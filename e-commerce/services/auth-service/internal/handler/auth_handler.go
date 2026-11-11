package handler

import (
	"github.com/dynamo-ecommerce/auth-service/internal/models"
	"github.com/dynamo-ecommerce/auth-service/internal/service"
	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles HTTP requests for authentication.
type AuthHandler struct {
	service *service.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{service: svc}
}

// Register handles user registration.
// POST /api/v1/auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req models.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if req.FirstName == "" || req.LastName == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "All fields are required"},
		})
	}

	if len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Password must be at least 8 characters"},
		})
	}

	result, err := h.service.Register(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 409, "message": err.Error()},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Registration successful",
		"data":    result,
	})
}

// Login handles email/password authentication.
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Email and password are required"},
		})
	}

	result, err := h.service.Login(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 401, "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Login successful",
		"data":    result,
	})
}

// GoogleLogin handles Google SSO.
// POST /api/v1/auth/google
func (h *AuthHandler) GoogleLogin(c *fiber.Ctx) error {
	var req models.GoogleLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if req.Token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Google token is required"},
		})
	}

	result, err := h.service.GoogleLogin(c.Context(), req.Token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 401, "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Google Login successful",
		"data":    result,
	})
}

// RefreshToken handles token rotation.
// POST /api/v1/auth/refresh
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req models.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	result, err := h.service.RefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 401, "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}

// Logout invalidates all refresh tokens.
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 401, "message": "Unauthorized"},
		})
	}

	if err := h.service.Logout(c.Context(), userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 500, "message": "Failed to logout"},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Logged out successfully",
	})
}

// SendOTP sends an OTP to the mobile number.
// POST /api/v1/auth/otp/send
func (h *AuthHandler) SendOTP(c *fiber.Ctx) error {
	var req models.SendOTPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if err := h.service.SendOTP(c.Context(), req.Mobile); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 500, "message": "Failed to send OTP"},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "OTP sent successfully",
	})
}

// VerifyOTP verifies the OTP and authenticates the user.
// POST /api/v1/auth/otp/verify
func (h *AuthHandler) VerifyOTP(c *fiber.Ctx) error {
	var req models.VerifyOTPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	result, err := h.service.VerifyOTP(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 401, "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "OTP verified successfully",
		"data":    result,
	})
}

// ForgotPassword initiates a password reset.
// POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req models.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	_ = h.service.ForgotPassword(c.Context(), req.Email)

	// Always return success to not reveal if email exists
	return c.JSON(fiber.Map{
		"success": true,
		"message": "If the email is registered, you will receive a reset link",
	})
}

// ResetPassword resets the password using a valid token.
// POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req models.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	if err := h.service.ResetPassword(c.Context(), &req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 400, "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Password reset successfully",
	})
}

// GetMe returns the current user's info.
// GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID, ok := c.Locals("userId").(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 401, "message": "Unauthorized"},
		})
	}

	user, err := h.service.GetCurrentUser(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 404, "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    user,
	})
}
