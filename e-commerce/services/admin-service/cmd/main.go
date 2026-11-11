package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/dynamo-ecommerce/admin-service/internal/handler"
	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"github.com/dynamo-ecommerce/shared-utils/logger"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog/log"
)

func main() {
	port := config.GetEnv("ADMIN_SERVICE_PORT", "8088")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "admin-service")
	log.Info().Msg("Starting Admin Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	h := handler.NewAdminHandler(mongoClient)

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Admin Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	// Secured admin routes
	api := app.Group("/api/v1/admin", middleware.AuthMiddleware(base.JWTSecret), middleware.AdminMiddleware())
	api.Get("/dashboard/stats", h.GetDashboardStats)
	api.Get("/settings", h.GetSettings)
	api.Put("/settings", h.UpdateSettings)
	api.Get("/audit-logs", h.GetAuditLogs)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "admin-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Info().Msg("Shutting down Admin Service...")
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("Admin Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
