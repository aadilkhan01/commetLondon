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
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Notification struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	Type      string             `json:"type" bson:"type"`       // EMAIL, SMS, PUSH
	Event     string             `json:"event" bson:"event"`     // REGISTRATION, OTP, ORDER_CREATED, etc.
	Title     string             `json:"title" bson:"title"`
	Message   string             `json:"message" bson:"message"`
	IsRead    bool               `json:"isRead" bson:"isRead"`
	Metadata  map[string]string  `json:"metadata,omitempty" bson:"metadata,omitempty"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

type SendNotificationRequest struct {
	UserID  string            `json:"userId"`
	Type    string            `json:"type"`
	Event   string            `json:"event"`
	Title   string            `json:"title"`
	Message string            `json:"message"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

func main() {
	port := config.GetEnv("NOTIFICATION_SERVICE_PORT", "8086")
	dbName := config.GetEnv("MONGODB_NOTIFICATIONS_DB", "ecommerce-notifications")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "notification-service")
	log.Info().Msg("Starting Notification Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	db := mongoClient.Database(dbName)
	notifCol := db.Collection("notifications")

	ctx := context.Background()
	notifCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
		{Keys: bson.D{{Key: "isRead", Value: 1}}},
	})

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Notification Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{AllowOrigins: "*", AllowMethods: "GET,POST,PUT,OPTIONS", AllowHeaders: "Origin,Content-Type,Accept,Authorization"}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	api := app.Group("/api/v1/notifications")

	// POST /api/v1/notifications/send - Send notification (internal use)
	api.Post("/send", func(c *fiber.Ctx) error {
		var req SendNotificationRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request"}})
		}

		userObjID, _ := primitive.ObjectIDFromHex(req.UserID)
		notif := Notification{
			UserID:    userObjID,
			Type:      req.Type,
			Event:     req.Event,
			Title:     req.Title,
			Message:   req.Message,
			IsRead:    false,
			Metadata:  req.Metadata,
			CreatedAt: time.Now(),
		}

		result, err := notifCol.InsertOne(c.Context(), notif)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to send notification"}})
		}
		notif.ID = result.InsertedID.(primitive.ObjectID)

		// In production, dispatch to email/SMS/push services here
		log.Info().Str("type", req.Type).Str("event", req.Event).Str("userId", req.UserID).Msg("Notification sent")

		return c.Status(201).JSON(fiber.Map{"success": true, "data": notif})
	})

	// GET /api/v1/notifications - Get user notifications (protected)
	api.Get("/", middleware.AuthMiddleware(base.JWTSecret), func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(50)
		cursor, err := notifCol.Find(c.Context(), bson.M{"userId": userObjID}, opts)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get notifications"}})
		}
		defer cursor.Close(c.Context())

		var notifications []Notification
		cursor.All(c.Context(), &notifications)
		if notifications == nil {
			notifications = []Notification{}
		}

		return c.JSON(fiber.Map{"success": true, "data": notifications})
	})

	// PUT /api/v1/notifications/:id/read - Mark as read (protected)
	api.Put("/:id/read", middleware.AuthMiddleware(base.JWTSecret), func(c *fiber.Ctx) error {
		notifID, _ := primitive.ObjectIDFromHex(c.Params("id"))
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		notifCol.UpdateOne(c.Context(),
			bson.M{"_id": notifID, "userId": userObjID},
			bson.M{"$set": bson.M{"isRead": true}},
		)

		return c.JSON(fiber.Map{"success": true, "message": "Marked as read"})
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "notification-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("Notification Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
