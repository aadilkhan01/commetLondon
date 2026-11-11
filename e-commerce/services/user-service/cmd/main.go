package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"github.com/dynamo-ecommerce/shared-utils/logger"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/dynamo-ecommerce/user-service/internal/handler"
	"github.com/dynamo-ecommerce/user-service/internal/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog/log"
)

func main() {
	port := config.GetEnv("USER_SERVICE_PORT", "8082")
	dbName := config.GetEnv("MONGODB_USERS_DB", "ecommerce-users")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "user-service")
	log.Info().Msg("Starting User Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	db := database.GetDatabase(mongoClient, dbName)
	repo := repository.NewUserRepository(db)
	
	// Seed initial testing data
	repo.SeedBinData(context.Background())
	repo.SeedBanksData(context.Background())
	
	h := handler.NewUserHandler(repo)

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "User Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	// All user routes are protected
	api := app.Group("/api/v1/users", middleware.AuthMiddleware(base.JWTSecret))
	api.Get("/profile", h.GetProfile)
	api.Put("/profile", h.UpdateProfile)
	api.Get("/addresses", h.GetAddresses)
	api.Post("/addresses", h.AddAddress)
	api.Put("/addresses/:id", h.UpdateAddress)
	api.Delete("/addresses/:id", h.DeleteAddress)
	api.Post("/cards", h.AddSavedCard)
	api.Get("/cards", h.GetSavedCards)
	api.Post("/wishlist/:productId", h.AddToWishlist)
	api.Delete("/wishlist/:productId", h.RemoveFromWishlist)
	api.Get("/wishlist", h.GetWishlist)
	
	// Open/Public endpoint (or authenticated) for BIN lookup and Banks
	api.Get("/bin/:bin", h.LookupBin)
	api.Get("/banks", h.GetBanks)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "user-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Info().Msg("Shutting down User Service...")
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("User Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
