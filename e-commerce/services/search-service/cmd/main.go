package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"github.com/dynamo-ecommerce/shared-utils/logger"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	port := config.GetEnv("SEARCH_SERVICE_PORT", "8087")
	productDBName := config.GetEnv("MONGODB_PRODUCTS_DB", "ecommerce-products")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "search-service")
	log.Info().Msg("Starting Search Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	productDB := mongoClient.Database(productDBName)
	productsCol := productDB.Collection("products")

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Search Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{AllowOrigins: "*", AllowMethods: "GET,OPTIONS", AllowHeaders: "Origin,Content-Type,Accept,Authorization"}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	api := app.Group("/api/v1/search")

	// Full-text search
	api.Get("/", func(c *fiber.Ctx) error {
		q := c.Query("q")
		if q == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 400, "message": "Query parameter 'q' is required"},
			})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		filter := bson.M{"$text": bson.M{"$search": q}}
		opts := options.Find().
			SetProjection(bson.M{"score": bson.M{"$meta": "textScore"}}).
			SetSort(bson.D{{Key: "score", Value: bson.M{"$meta": "textScore"}}}).
			SetLimit(20)

		cursor, err := productsCol.Find(ctx, filter, opts)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 500, "message": "Search failed"},
			})
		}
		defer cursor.Close(ctx)

		var results []bson.M
		if err := cursor.All(ctx, &results); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 500, "message": "Failed to parse results"},
			})
		}
		if results == nil {
			results = []bson.M{}
		}

		return c.JSON(fiber.Map{"success": true, "data": results, "total": len(results)})
	})

	// Autocomplete
	api.Get("/autocomplete", func(c *fiber.Ctx) error {
		q := c.Query("q")
		if q == "" || len(q) < 2 {
			return c.JSON(fiber.Map{"success": true, "data": []string{}})
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		filter := bson.M{"name": bson.M{"$regex": q, "$options": "i"}}
		opts := options.Find().
			SetProjection(bson.M{"name": 1, "slug": 1, "category": 1, "images": bson.M{"$slice": 1}}).
			SetLimit(8)

		cursor, err := productsCol.Find(ctx, filter, opts)
		if err != nil {
			return c.JSON(fiber.Map{"success": true, "data": []string{}})
		}
		defer cursor.Close(ctx)

		var suggestions []bson.M
		cursor.All(ctx, &suggestions)
		if suggestions == nil {
			suggestions = []bson.M{}
		}

		return c.JSON(fiber.Map{"success": true, "data": suggestions})
	})

	// Trending searches (static for now, can be made dynamic with analytics)
	api.Get("/trending", func(c *fiber.Ctx) error {
		trending := []string{
			"trolley bag", "laptop backpack", "cabin luggage",
			"duffel bag", "travel organizer", "premium luggage",
		}
		return c.JSON(fiber.Map{"success": true, "data": trending})
	})

	// Filter options
	api.Get("/filters", func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		brands, _ := productsCol.Distinct(ctx, "brand", bson.M{})
		categories, _ := productsCol.Distinct(ctx, "category", bson.M{})

		// Price range
		pipeline := mongo.Pipeline{
			{{Key: "$group", Value: bson.M{
				"_id":      nil,
				"minPrice": bson.M{"$min": "$price"},
				"maxPrice": bson.M{"$max": "$price"},
			}}},
		}
		cursor, _ := productsCol.Aggregate(ctx, pipeline)
		var priceRange []bson.M
		cursor.All(ctx, &priceRange)

		var minP, maxP float64
		if len(priceRange) > 0 {
			if v, ok := priceRange[0]["minPrice"].(float64); ok {
				minP = v
			}
			if v, ok := priceRange[0]["maxPrice"].(float64); ok {
				maxP = v
			}
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"brands":     brands,
				"categories": categories,
				"minPrice":   minP,
				"maxPrice":   maxP,
			},
		})
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "search-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("Search Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
