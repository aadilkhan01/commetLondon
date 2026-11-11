package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
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

type OrderItem struct {
	ProductID primitive.ObjectID `json:"productId" bson:"productId"`
	Name      string             `json:"name" bson:"name"`
	Image     string             `json:"image" bson:"image"`
	Price     float64            `json:"price" bson:"price"`
	Quantity  int                `json:"quantity" bson:"quantity"`
	Color     string             `json:"color,omitempty" bson:"color,omitempty"`
}

type ShippingAddress struct {
	FullName     string `json:"fullName" bson:"fullName"`
	Phone        string `json:"phone" bson:"phone"`
	AddressLine1 string `json:"addressLine1" bson:"addressLine1"`
	AddressLine2 string `json:"addressLine2,omitempty" bson:"addressLine2,omitempty"`
	City         string `json:"city" bson:"city"`
	State        string `json:"state" bson:"state"`
	ZipCode      string `json:"zipCode" bson:"zipCode"`
	Country      string `json:"country" bson:"country"`
}

type Order struct {
	ID              primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	OrderNumber     string             `json:"orderNumber" bson:"orderNumber"`
	UserID          primitive.ObjectID `json:"userId" bson:"userId"`
	Items           []OrderItem        `json:"items" bson:"items"`
	ShippingAddress ShippingAddress    `json:"shippingAddress" bson:"shippingAddress"`
	Subtotal        float64            `json:"subtotal" bson:"subtotal"`
	ShippingCost    float64            `json:"shippingCost" bson:"shippingCost"`
	Tax             float64            `json:"tax" bson:"tax"`
	Total           float64            `json:"total" bson:"total"`
	Status          string             `json:"status" bson:"status"`
	PaymentMethod   string             `json:"paymentMethod" bson:"paymentMethod"`
	PaymentStatus   string             `json:"paymentStatus" bson:"paymentStatus"`
	CreatedAt       time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt       time.Time          `json:"updatedAt" bson:"updatedAt"`
	CancelReason    string             `json:"cancelReason,omitempty" bson:"cancelReason,omitempty"`
	CancelComments  string             `json:"cancelComments,omitempty" bson:"cancelComments,omitempty"`
}

type CancelOrderRequest struct {
	Reason   string `json:"reason"`
	Comments string `json:"comments"`
}

type CreateOrderRequest struct {
	Items           []OrderItem     `json:"items"`
	ShippingAddress ShippingAddress `json:"shippingAddress"`
	PaymentMethod   string          `json:"paymentMethod"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// Valid status transitions
var validTransitions = map[string][]string{
	"PLACED":    {"SHIPPED", "CANCELLED"},
	"SHIPPED":   {"DELIVERED", "CANCELLED"},
	"DELIVERED": {"RETURNED"},
	"CANCELLED": {},
	"RETURNED":  {},
}

func generateOrderNumber() string {
	return fmt.Sprintf("DYN-%d%04d", time.Now().Unix()%100000, rand.Intn(10000))
}

func adjustStock(items []OrderItem, sign int) {
	for _, item := range items {
		delta := item.Quantity * sign
		body, _ := json.Marshal(map[string]interface{}{"delta": delta, "color": item.Color})
		url := fmt.Sprintf("http://product-service:8083/api/v1/products/internal/%s/stock", item.ProductID.Hex())
		req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
		if err == nil {
			req.Header.Set("Content-Type", "application/json")
			client := &http.Client{Timeout: 5 * time.Second}
			client.Do(req)
		}
	}
}

func main() {
	port := config.GetEnv("ORDER_SERVICE_PORT", "8085")
	dbName := config.GetEnv("MONGODB_ORDERS_DB", "ecommerce-orders")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "order-service")
	log.Info().Msg("Starting Order Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	db := mongoClient.Database(dbName)
	ordersCol := db.Collection("orders")

	ctx := context.Background()
	ordersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "userId", Value: 1}}},
		{Keys: bson.D{{Key: "orderNumber", Value: 1}}, Options: options.Index().SetUnique(true)},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "createdAt", Value: -1}}},
	})

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Order Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{AllowOrigins: "*", AllowMethods: "GET,POST,PUT,DELETE,OPTIONS", AllowHeaders: "Origin,Content-Type,Accept,Authorization"}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	api := app.Group("/api/v1/orders", middleware.AuthMiddleware(base.JWTSecret))

	// POST /api/v1/orders - Create order
	api.Post("/", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		var req CreateOrderRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"}})
		}

		if len(req.Items) == 0 {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Order must have at least one item"}})
		}

		var subtotal float64
		for _, item := range req.Items {
			subtotal += item.Price * float64(item.Quantity)
		}

		shippingCost := 0.0
		if subtotal < 100 {
			shippingCost = 9.99
		}
		tax := subtotal * 0.08 // 8% tax
		total := subtotal + shippingCost + tax

		order := Order{
			OrderNumber:     generateOrderNumber(),
			UserID:          userObjID,
			Items:           req.Items,
			ShippingAddress: req.ShippingAddress,
			Subtotal:        subtotal,
			ShippingCost:    shippingCost,
			Tax:             tax,
			Total:           total,
			Status:          "PLACED",
			PaymentMethod:   req.PaymentMethod,
			PaymentStatus:   "PENDING",
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		result, err := ordersCol.InsertOne(c.Context(), order)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to create order"}})
		}

		order.ID = result.InsertedID.(primitive.ObjectID)

		// Decrease stock asynchronously
		go adjustStock(order.Items, -1)

		return c.Status(201).JSON(fiber.Map{
			"success": true, "message": "Order created successfully", "data": order,
		})
	})

	// GET /api/v1/orders - List user's orders
	api.Get("/", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
		cursor, err := ordersCol.Find(c.Context(), bson.M{"userId": userObjID}, opts)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch orders"}})
		}
		defer cursor.Close(c.Context())

		var orders []Order
		cursor.All(c.Context(), &orders)
		if orders == nil {
			orders = []Order{}
		}

		return c.JSON(fiber.Map{"success": true, "data": orders})
	})

	// GET /api/v1/orders/:id - Get order detail
	api.Get("/:id", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		orderID, err := primitive.ObjectIDFromHex(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid order ID"}})
		}

		var order Order
		err = ordersCol.FindOne(c.Context(), bson.M{"_id": orderID, "userId": userObjID}).Decode(&order)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 404, "message": "Order not found"}})
		}

		return c.JSON(fiber.Map{"success": true, "data": order})
	})

	// GET /api/v1/orders/:id/admin - Get order detail (admin)
	api.Get("/:id/admin", middleware.AdminMiddleware(), func(c *fiber.Ctx) error {
		orderID, err := primitive.ObjectIDFromHex(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid order ID"}})
		}

		var order Order
		err = ordersCol.FindOne(c.Context(), bson.M{"_id": orderID}).Decode(&order)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 404, "message": "Order not found"}})
		}

		return c.JSON(fiber.Map{"success": true, "data": order})
	})

	// PUT /api/v1/orders/:id/cancel - Cancel order
	api.Put("/:id/cancel", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		orderID, _ := primitive.ObjectIDFromHex(c.Params("id"))

		var req CancelOrderRequest
		if err := c.BodyParser(&req); err != nil && string(c.Body()) != "" {
			// It's okay if body is empty (for backward compatibility), but if it's invalid JSON, return error
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"}})
		}

		var order Order
		err := ordersCol.FindOne(c.Context(), bson.M{"_id": orderID, "userId": userObjID}).Decode(&order)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 404, "message": "Order not found"}})
		}

		allowed := validTransitions[order.Status]
		canCancel := false
		for _, s := range allowed {
			if s == "CANCELLED" {
				canCancel = true
				break
			}
		}

		if !canCancel {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Order cannot be cancelled in its current status"}})
		}

		updateFields := bson.M{
			"status":    "CANCELLED",
			"updatedAt": time.Now(),
		}
		if req.Reason != "" {
			updateFields["cancelReason"] = req.Reason
		}
		if req.Comments != "" {
			updateFields["cancelComments"] = req.Comments
		}

		ordersCol.UpdateOne(c.Context(),
			bson.M{"_id": orderID},
			bson.M{"$set": updateFields},
		)

		// Restore stock asynchronously
		go adjustStock(order.Items, 1)

		return c.JSON(fiber.Map{"success": true, "message": "Order cancelled"})
	})

	// PUT /api/v1/orders/:id/status - Update status (admin)
	api.Put("/:id/status", middleware.AdminMiddleware(), func(c *fiber.Ctx) error {
		orderID, _ := primitive.ObjectIDFromHex(c.Params("id"))

		var req UpdateStatusRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request"}})
		}

		var order Order
		err := ordersCol.FindOne(c.Context(), bson.M{"_id": orderID}).Decode(&order)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 404, "message": "Order not found"}})
		}

		allowed := validTransitions[order.Status]
		valid := false
		for _, s := range allowed {
			if s == req.Status {
				valid = true
				break
			}
		}
		if !valid {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": fmt.Sprintf("Cannot transition from %s to %s", order.Status, req.Status)}})
		}

		ordersCol.UpdateOne(c.Context(),
			bson.M{"_id": orderID},
			bson.M{"$set": bson.M{"status": req.Status, "updatedAt": time.Now()}},
		)

		return c.JSON(fiber.Map{"success": true, "message": "Order status updated"})
	})

	// GET /api/v1/orders/admin/all - Admin: list all orders
	api.Get("/admin/all", middleware.AdminMiddleware(), func(c *fiber.Ctx) error {
		opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(50)
		cursor, err := ordersCol.Find(c.Context(), bson.M{}, opts)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch orders"}})
		}
		defer cursor.Close(c.Context())

		var orders []Order
		cursor.All(c.Context(), &orders)
		if orders == nil {
			orders = []Order{}
		}

		return c.JSON(fiber.Map{"success": true, "data": orders})
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "order-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("Order Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
