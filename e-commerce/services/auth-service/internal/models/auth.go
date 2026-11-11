package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Credential stores user authentication credentials.
type Credential struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	FirstName     string             `json:"firstName" bson:"firstName"`
	LastName      string             `json:"lastName" bson:"lastName"`
	Email         string             `json:"email" bson:"email"`
	Mobile        string             `json:"mobile,omitempty" bson:"mobile,omitempty"`
	Password      string             `json:"-" bson:"password,omitempty"`
	Role          string             `json:"role" bson:"role"`
	Provider      string             `json:"provider" bson:"provider"` // "local", "google"
	GoogleID      string             `json:"-" bson:"googleId,omitempty"`
	IsVerified    bool               `json:"isVerified" bson:"isVerified"`
	EmailVerified bool               `json:"emailVerified" bson:"emailVerified"`
	MobileVerified bool             `json:"mobileVerified" bson:"mobileVerified"`
	CreatedAt     time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt     time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// RefreshToken stores refresh tokens for token rotation.
type RefreshToken struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	Token     string             `json:"token" bson:"token"`
	ExpiresAt time.Time          `json:"expiresAt" bson:"expiresAt"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

// ─── Request DTOs ───────────────────────────────────────────

// RegisterRequest is the DTO for user registration.
type RegisterRequest struct {
	FirstName string `json:"firstName" validate:"required,min=2,max=50"`
	LastName  string `json:"lastName" validate:"required,min=2,max=50"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8,max=128"`
}

// LoginRequest is the DTO for email/password login.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// GoogleLoginRequest is the DTO for Google SSO.
type GoogleLoginRequest struct {
	Token string `json:"token" validate:"required"`
}

// SendOTPRequest is the DTO for sending OTP.
type SendOTPRequest struct {
	Mobile string `json:"mobile" validate:"required,min=10,max=15"`
}

// VerifyOTPRequest is the DTO for verifying OTP.
type VerifyOTPRequest struct {
	Mobile string `json:"mobile" validate:"required,min=10,max=15"`
	OTP    string `json:"otp" validate:"required,len=6"`
}

// RefreshTokenRequest is the DTO for token refresh.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

// ForgotPasswordRequest is the DTO for forgot password.
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordRequest is the DTO for password reset.
type ResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=8,max=128"`
}

// ─── Response DTOs ──────────────────────────────────────────

// AuthResponse is the response after successful authentication.
type AuthResponse struct {
	User         *UserInfo `json:"user"`
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
}

// UserInfo is the safe user information returned in responses.
type UserInfo struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}
