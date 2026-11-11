package middleware

import (
	"strings"

	"github.com/dynamo-ecommerce/shared-utils/auth"
	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware validates JWT tokens from the Authorization header.
// It extracts user claims and sets them in the request locals.
func AuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    401,
					"message": "Authorization header is required",
				},
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    401,
					"message": "Invalid authorization header format",
				},
			})
		}

		claims, err := auth.ValidateToken(parts[1], jwtSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    401,
					"message": "Invalid or expired token",
				},
			})
		}

		// Set user info in context locals
		c.Locals("userId", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}

// AdminMiddleware checks if the authenticated user has the ADMIN role.
// Must be used after AuthMiddleware.
func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role != "ADMIN" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    403,
					"message": "Admin access required",
				},
			})
		}
		return c.Next()
	}
}

// OptionalAuthMiddleware parses the JWT if present but doesn't require it.
// Useful for endpoints that behave differently for authenticated users.
func OptionalAuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Next()
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Next()
		}

		claims, err := auth.ValidateToken(parts[1], jwtSecret)
		if err != nil {
			return c.Next()
		}

		c.Locals("userId", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
