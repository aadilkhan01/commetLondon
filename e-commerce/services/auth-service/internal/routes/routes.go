package routes

import (
	"github.com/dynamo-ecommerce/auth-service/internal/handler"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/gofiber/fiber/v2"
)

// Setup registers all auth service routes.
func Setup(app *fiber.App, h *handler.AuthHandler, jwtSecret string) {
	api := app.Group("/api/v1/auth")

	// Public routes
	api.Post("/register", h.Register)
	api.Post("/login", h.Login)
	api.Post("/google", h.GoogleLogin)
	api.Post("/refresh", h.RefreshToken)
	api.Post("/forgot-password", h.ForgotPassword)
	api.Post("/reset-password", h.ResetPassword)

	// OTP routes
	api.Post("/otp/send", h.SendOTP)
	api.Post("/otp/verify", h.VerifyOTP)

	// Protected routes
	protected := api.Group("", middleware.AuthMiddleware(jwtSecret))
	protected.Get("/me", h.GetMe)
	protected.Post("/logout", h.Logout)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "auth-service"})
	})
}
