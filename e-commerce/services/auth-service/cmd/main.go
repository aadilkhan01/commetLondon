package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/dynamo-ecommerce/auth-service/internal/config"
	"github.com/dynamo-ecommerce/auth-service/internal/handler"
	"github.com/dynamo-ecommerce/auth-service/internal/repository"
	"github.com/dynamo-ecommerce/auth-service/internal/routes"
	"github.com/dynamo-ecommerce/auth-service/internal/service"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"github.com/dynamo-ecommerce/shared-utils/logger"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	logger.Init(cfg.LogLevel, "auth-service")
	log.Info().Msg("Starting Auth Service...")

	// Connect to MongoDB
	mongoClient, err := database.ConnectMongoDB(cfg.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	db := database.GetDatabase(mongoClient, cfg.DBName)

	// Connect to Redis
	redisClient, err := database.ConnectRedis(cfg.RedisURL, cfg.RedisPass, cfg.RedisDB)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Redis")
	}
	defer database.DisconnectRedis(redisClient)

	// Initialize layers
	repo := repository.NewAuthRepository(db)
	svc := service.NewAuthService(repo, redisClient, cfg)
	h := handler.NewAuthHandler(svc)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Auth Service",
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	// Register routes
	routes.Setup(app, h, cfg.JWTSecret)

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Info().Msg("Shutting down Auth Service...")
		_ = app.Shutdown()
	}()

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Info().Str("port", cfg.Port).Msg("Auth Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
