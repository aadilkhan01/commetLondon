package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/dynamo-ecommerce/auth-service/internal/config"
	"github.com/dynamo-ecommerce/auth-service/internal/models"
	"github.com/dynamo-ecommerce/auth-service/internal/repository"
	"github.com/dynamo-ecommerce/shared-utils/auth"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// AuthService handles all authentication business logic.
type AuthService struct {
	repo   *repository.AuthRepository
	redis  *redis.Client
	config *config.Config
}

// NewAuthService creates a new AuthService instance.
func NewAuthService(repo *repository.AuthRepository, redis *redis.Client, cfg *config.Config) *AuthService {
	return &AuthService{
		repo:   repo,
		redis:  redis,
		config: cfg,
	}
}

// Register creates a new user account.
func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if email already exists
	existing, _ := s.repo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create credential
	cred := &models.Credential{
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Email:      req.Email,
		Password:   hashedPassword,
		Role:       "CUSTOMER",
		Provider:   "local",
		IsVerified: false,
	}

	cred, err = s.repo.CreateCredential(ctx, cred)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}

	// Generate tokens
	return s.generateAuthResponse(cred)
}

// Login authenticates a user with email and password.
func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	cred, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("invalid email or password")
		}
		return nil, err
	}

	if !auth.CheckPassword(req.Password, cred.Password) {
		return nil, errors.New("invalid email or password")
	}

	return s.generateAuthResponse(cred)
}

// GoogleLogin handles single sign-on authentication via Google.
func (s *AuthService) GoogleLogin(ctx context.Context, token string) (*models.AuthResponse, error) {
	if token == "" {
		return nil, errors.New("invalid google token")
	}

	// Fetch user info from Google
	req, err := http.NewRequestWithContext(ctx, "GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Add("Authorization", "Bearer " + token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user info from google: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("invalid google token or token expired")
	}

	var googleUser struct {
		Sub           string `json:"sub"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return nil, fmt.Errorf("failed to parse google response: %w", err)
	}

	if googleUser.Email == "" {
		return nil, errors.New("google account has no email")
	}

	cred, err := s.repo.FindByEmail(ctx, googleUser.Email)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			// Auto-register the user if they don't exist
			newCred := &models.Credential{
				FirstName:     googleUser.GivenName,
				LastName:      googleUser.FamilyName,
				Email:         googleUser.Email,
				Role:          "CUSTOMER",
				Provider:      "google",
				GoogleID:      googleUser.Sub,
				IsVerified:    googleUser.EmailVerified,
				EmailVerified: googleUser.EmailVerified,
			}
			
			// Fallback if given_name/family_name are missing
			if newCred.FirstName == "" {
				newCred.FirstName = googleUser.Name
			}
			if newCred.LastName == "" {
				newCred.LastName = "User"
			}
			
			cred, err = s.repo.CreateCredential(ctx, newCred)
			if err != nil {
				return nil, fmt.Errorf("failed to create google account: %w", err)
			}
		} else {
			return nil, err
		}
	} else if cred.GoogleID == "" {
		log.Warn().Str("email", cred.Email).Msg("existing user logging in via google, googleId not linked in DB yet")
	}

	return s.generateAuthResponse(cred)
}

// RefreshToken implements token rotation: validates the old refresh token,
// issues new access + refresh tokens, and invalidates the old refresh token.
func (s *AuthService) RefreshToken(ctx context.Context, refreshTokenStr string) (*models.AuthResponse, error) {
	// Validate refresh token
	userID, err := auth.ValidateRefreshToken(refreshTokenStr, s.config.JWTSecret)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Check if token exists in DB
	storedToken, err := s.repo.FindRefreshToken(ctx, refreshTokenStr)
	if err != nil {
		return nil, errors.New("refresh token not found or already used")
	}

	// Delete old refresh token (rotation)
	_ = s.repo.DeleteRefreshToken(ctx, storedToken.Token)

	// Get user
	objID, _ := primitive.ObjectIDFromHex(userID)
	cred, err := s.repo.FindByID(ctx, objID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return s.generateAuthResponse(cred)
}

// Logout invalidates all refresh tokens for the user.
func (s *AuthService) Logout(ctx context.Context, userID string) error {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}
	return s.repo.DeleteAllRefreshTokens(ctx, objID)
}

// SendOTP generates and stores an OTP in Redis for mobile authentication.
func (s *AuthService) SendOTP(ctx context.Context, mobile string) error {
	otp := s.generateOTP(s.config.OTPLength)

	// Store OTP in Redis with expiry
	key := fmt.Sprintf("otp:%s", mobile)
	err := s.redis.Set(ctx, key, otp, time.Duration(s.config.OTPExpirySec)*time.Second).Err()
	if err != nil {
		return fmt.Errorf("failed to store OTP: %w", err)
	}

	// In production, send OTP via SMS service
	log.Info().Str("mobile", mobile).Str("otp", otp).Msg("OTP generated (dev mode)")

	return nil
}

// VerifyOTP validates the OTP and authenticates the user.
func (s *AuthService) VerifyOTP(ctx context.Context, req *models.VerifyOTPRequest) (*models.AuthResponse, error) {
	key := fmt.Sprintf("otp:%s", req.Mobile)

	// Get stored OTP
	storedOTP, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, errors.New("OTP expired or not found")
		}
		return nil, err
	}

	if storedOTP != req.OTP {
		return nil, errors.New("invalid OTP")
	}

	// Delete OTP after successful verification
	s.redis.Del(ctx, key)

	// Find or create user by mobile
	cred, err := s.repo.UpsertCredentialByMobile(ctx, req.Mobile)
	if err != nil {
		return nil, fmt.Errorf("failed to process mobile auth: %w", err)
	}

	return s.generateAuthResponse(cred)
}

// ForgotPassword generates a password reset token and stores it in Redis.
func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	cred, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		// Don't reveal if email exists
		return nil
	}

	// Generate reset token
	resetToken := s.generateOTP(32)
	key := fmt.Sprintf("reset:%s", resetToken)
	err = s.redis.Set(ctx, key, cred.ID.Hex(), 30*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("failed to store reset token: %w", err)
	}

	// In production, send reset email
	log.Info().Str("email", email).Str("token", resetToken).Msg("Password reset token generated (dev mode)")

	return nil
}

// ResetPassword resets the user's password using a valid reset token.
func (s *AuthService) ResetPassword(ctx context.Context, req *models.ResetPasswordRequest) error {
	key := fmt.Sprintf("reset:%s", req.Token)

	userIDStr, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	s.redis.Del(ctx, key)

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	objID, _ := primitive.ObjectIDFromHex(userIDStr)
	return s.repo.UpdatePassword(ctx, objID, hashedPassword)
}

// GetCurrentUser returns the user info for the currently authenticated user.
func (s *AuthService) GetCurrentUser(ctx context.Context, userID string) (*models.UserInfo, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	cred, err := s.repo.FindByID(ctx, objID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return &models.UserInfo{
		ID:        cred.ID.Hex(),
		FirstName: cred.FirstName,
		LastName:  cred.LastName,
		Email:     cred.Email,
		Role:      cred.Role,
	}, nil
}

// ─── Private Helpers ────────────────────────────────────────

func (s *AuthService) generateAuthResponse(cred *models.Credential) (*models.AuthResponse, error) {
	accessExpiry, _ := time.ParseDuration(s.config.AccessTokenExp)
	if accessExpiry == 0 {
		accessExpiry = 15 * time.Minute
	}

	refreshExpiry, _ := time.ParseDuration(s.config.RefreshTokenExp)
	if refreshExpiry == 0 {
		refreshExpiry = 168 * time.Hour
	}

	accessToken, err := auth.GenerateAccessToken(
		cred.ID.Hex(), cred.Email, cred.Role,
		s.config.JWTSecret, accessExpiry,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := auth.GenerateRefreshToken(
		cred.ID.Hex(), s.config.JWTSecret, refreshExpiry,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token in DB
	ctx := context.Background()
	_ = s.repo.SaveRefreshToken(ctx, &models.RefreshToken{
		UserID:    cred.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(refreshExpiry),
	})

	return &models.AuthResponse{
		User: &models.UserInfo{
			ID:        cred.ID.Hex(),
			FirstName: cred.FirstName,
			LastName:  cred.LastName,
			Email:     cred.Email,
			Role:      cred.Role,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) generateOTP(length int) string {
	const charset = "0123456789"
	otp := make([]byte, length)
	for i := range otp {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		otp[i] = charset[n.Int64()]
	}
	return string(otp)
}
