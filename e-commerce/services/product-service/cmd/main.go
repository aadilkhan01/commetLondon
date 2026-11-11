package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"github.com/dynamo-ecommerce/shared-utils/logger"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/dynamo-ecommerce/product-service/internal/handler"
	"github.com/dynamo-ecommerce/product-service/internal/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog/log"
)

func main() {
	port := config.GetEnv("PRODUCT_SERVICE_PORT", "8083")
	dbName := config.GetEnv("MONGODB_PRODUCTS_DB", "ecommerce-products")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "product-service")
	log.Info().Msg("Starting Product Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	db := database.GetDatabase(mongoClient, dbName)
	repo := repository.NewProductRepository(db)
	h := handler.NewProductHandler(repo)

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Product Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	// Serve static uploads
	app.Static("/uploads", "./uploads")

	// Public product routes
	products := app.Group("/api/v1/products")
	products.Get("/featured", h.GetFeaturedProducts)
	products.Get("/new-arrivals", h.GetNewArrivals)
	products.Get("/best-sellers", h.GetBestSellers)
	products.Get("/filters", h.GetFilterOptions)
	products.Post("/batch", h.GetProductsByIDs)
	products.Post("/internal/:id/stock", h.AdjustStock)
	products.Get("/:id/reviews", h.GetProductReviews)
	products.Get("/:slug", h.GetProductBySlug)
	products.Get("/", h.GetProducts)

	// Auth product routes
	authProducts := products.Group("", middleware.AuthMiddleware(base.JWTSecret))
	authProducts.Post("/upload", h.UploadImage)
	authProducts.Get("/reviews/me", h.GetReviewedProducts)
	authProducts.Post("/:id/reviews", h.AddReview)

	// Admin product routes
	adminProducts := products.Group("", middleware.AuthMiddleware(base.JWTSecret), middleware.AdminMiddleware())
	adminProducts.Post("/", h.CreateProduct)
	adminProducts.Put("/:id", h.UpdateProduct)
	adminProducts.Delete("/:id", h.DeleteProduct)

	// Category routes (public read, admin write)
	categories := app.Group("/api/v1/categories")
	categories.Get("/", h.GetCategories)

	adminCategories := categories.Group("", middleware.AuthMiddleware(base.JWTSecret), middleware.AdminMiddleware())
	adminCategories.Post("/", h.CreateCategory)
	adminCategories.Put("/:id", h.UpdateCategory)
	adminCategories.Delete("/:id", h.DeleteCategory)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "product-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Info().Msg("Shutting down Product Service...")
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("Product Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
