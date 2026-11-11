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

type CartItem struct {
	ProductID primitive.ObjectID `json:"productId" bson:"productId"`
	Name      string             `json:"name" bson:"name"`
	Slug      string             `json:"slug" bson:"slug"`
	Image     string             `json:"image" bson:"image"`
	Price     float64            `json:"price" bson:"price"`
	Quantity  int                `json:"quantity" bson:"quantity"`
	Color     string             `json:"color" bson:"color"`
}

type Cart struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	Items     []CartItem         `json:"items" bson:"items"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

type AddItemRequest struct {
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Slug      string  `json:"slug"`
	Image     string  `json:"image"`
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
	Color     string  `json:"color"`
}

type UpdateQuantityRequest struct {
	Quantity int `json:"quantity"`
}

type Coupon struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Code          string             `json:"code" bson:"code"`
	DiscountPct   float64            `json:"discountPct" bson:"discountPct"`
	MinOrderValue float64            `json:"minOrderValue" bson:"minOrderValue"`
	MaxDiscount   float64            `json:"maxDiscount" bson:"maxDiscount"`
	Description   string             `json:"description" bson:"description"`
}

type UsedCoupon struct {
	ID     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID primitive.ObjectID `json:"userId" bson:"userId"`
	Code   string             `json:"code" bson:"code"`
}

type ApplyCouponRequest struct {
	Code string `json:"code"`
}

func main() {
	port := config.GetEnv("CART_SERVICE_PORT", "8084")
	dbName := config.GetEnv("MONGODB_CART_DB", "ecommerce-cart")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "cart-service")
	log.Info().Msg("Starting Cart Service...")

	mongoClient, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer database.DisconnectMongoDB(mongoClient)

	db := mongoClient.Database(dbName)
	cartsCol := db.Collection("carts")
	couponsCol := db.Collection("coupons")
	usedCouponsCol := db.Collection("used_coupons")

	// Create index
	ctx := context.Background()
	cartsCol.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "userId", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// Seed Coupons
	seedCoupons := []interface{}{
		Coupon{Code: "NEW20", DiscountPct: 20, MinOrderValue: 500, MaxDiscount: 1000, Description: "Get 20% off on your order above ₹500"},
		Coupon{Code: "GOCARRY25", DiscountPct: 25, MinOrderValue: 1000, MaxDiscount: 1500, Description: "Special 25% off for GoCarry users"},
	}
	for _, c := range seedCoupons {
		opts := options.Update().SetUpsert(true)
		couponsCol.UpdateOne(ctx, bson.M{"code": c.(Coupon).Code}, bson.M{"$set": c}, opts)
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "Cart Service",
	})

	app.Use(recover.New())
	app.Use(cors.New(cors.Config{AllowOrigins: "*", AllowMethods: "GET,POST,PUT,DELETE,OPTIONS", AllowHeaders: "Origin,Content-Type,Accept,Authorization"}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())

	// ALL cart routes require authentication
	api := app.Group("/api/v1/cart", middleware.AuthMiddleware(base.JWTSecret))

	// GET /api/v1/cart - Get user's cart
	api.Get("/", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		var cart Cart
		err := cartsCol.FindOne(c.Context(), bson.M{"userId": userObjID}).Decode(&cart)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return c.JSON(fiber.Map{"success": true, "data": Cart{Items: []CartItem{}, UserID: userObjID}})
			}
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get cart"}})
		}
		if cart.Items == nil {
			cart.Items = []CartItem{}
		}

		// Calculate totals
		var subtotal float64
		for _, item := range cart.Items {
			subtotal += item.Price * float64(item.Quantity)
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"cart":     cart,
				"subtotal": subtotal,
				"itemCount": len(cart.Items),
			},
		})
	})

	// POST /api/v1/cart/items - Add item to cart
	api.Post("/items", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		var req AddItemRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"}})
		}

		productObjID, err := primitive.ObjectIDFromHex(req.ProductID)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid product ID"}})
		}

		qty := req.Quantity
		if qty < 1 {
			qty = 1
		}

		item := CartItem{
			ProductID: productObjID,
			Name:      req.Name,
			Slug:      req.Slug,
			Image:     req.Image,
			Price:     req.Price,
			Quantity:  qty,
			Color:     req.Color,
		}

		// Try to increment quantity if product and color already in cart
		result, _ := cartsCol.UpdateOne(c.Context(),
			bson.M{"userId": userObjID, "items.productId": productObjID, "items.color": req.Color},
			bson.M{"$inc": bson.M{"items.$.quantity": qty}, "$set": bson.M{"updatedAt": time.Now()}},
		)

		if result != nil && result.ModifiedCount > 0 {
			return c.JSON(fiber.Map{"success": true, "message": "Cart updated"})
		}

		// Product not in cart, add it
		opts := options.Update().SetUpsert(true)
		_, err = cartsCol.UpdateOne(c.Context(),
			bson.M{"userId": userObjID},
			bson.M{
				"$push": bson.M{"items": item},
				"$set":  bson.M{"updatedAt": time.Now()},
			}, opts)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to add item"}})
		}

		return c.Status(201).JSON(fiber.Map{"success": true, "message": "Item added to cart"})
	})

	// PUT /api/v1/cart/items/:productId - Update quantity
	api.Put("/items/:productId", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		productID, _ := primitive.ObjectIDFromHex(c.Params("productId"))
		color := c.Query("color")

		var req UpdateQuantityRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request"}})
		}

		if req.Quantity < 1 {
			// Remove item if quantity is 0 or less
			pullQuery := bson.M{"productId": productID, "color": color}
			cartsCol.UpdateOne(c.Context(),
				bson.M{"userId": userObjID},
				bson.M{"$pull": bson.M{"items": pullQuery}, "$set": bson.M{"updatedAt": time.Now()}},
			)
			return c.JSON(fiber.Map{"success": true, "message": "Item removed from cart"})
		}

		query := bson.M{"userId": userObjID, "items.productId": productID, "items.color": color}

		cartsCol.UpdateOne(c.Context(),
			query,
			bson.M{"$set": bson.M{"items.$.quantity": req.Quantity, "updatedAt": time.Now()}},
		)

		return c.JSON(fiber.Map{"success": true, "message": "Quantity updated"})
	})

	// DELETE /api/v1/cart/items/:productId - Remove item
	api.Delete("/items/:productId", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)
		productID, _ := primitive.ObjectIDFromHex(c.Params("productId"))
		color := c.Query("color")

		pullQuery := bson.M{"productId": productID, "color": color}

		cartsCol.UpdateOne(c.Context(),
			bson.M{"userId": userObjID},
			bson.M{"$pull": bson.M{"items": pullQuery}, "$set": bson.M{"updatedAt": time.Now()}},
		)

		return c.JSON(fiber.Map{"success": true, "message": "Item removed from cart"})
	})

	// DELETE /api/v1/cart/clear - Clear cart
	api.Delete("/clear", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		cartsCol.UpdateOne(c.Context(),
			bson.M{"userId": userObjID},
			bson.M{"$set": bson.M{"items": []CartItem{}, "updatedAt": time.Now()}},
		)

		return c.JSON(fiber.Map{"success": true, "message": "Cart cleared"})
	})

	// GET /api/v1/cart/coupons - Get available coupons
	api.Get("/coupons", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		// Get all used coupons for user
		cursor, err := usedCouponsCol.Find(c.Context(), bson.M{"userId": userObjID})
		var used []UsedCoupon
		if err == nil {
			cursor.All(c.Context(), &used)
		}

		usedCodes := make(map[string]bool)
		for _, u := range used {
			usedCodes[u.Code] = true
		}

		// Get all coupons
		cursor, err = couponsCol.Find(c.Context(), bson.M{})
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to get coupons"}})
		}

		var allCoupons []Coupon
		if err = cursor.All(c.Context(), &allCoupons); err != nil {
			return c.Status(500).JSON(fiber.Map{"success": false, "error": fiber.Map{"code": 500, "message": "Failed to parse coupons"}})
		}

		// Filter out used
		var available []Coupon
		for _, coupon := range allCoupons {
			if !usedCodes[coupon.Code] {
				available = append(available, coupon)
			}
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data": available,
		})
	})

	// POST /api/v1/cart/coupons/apply - Mark coupon as used (Called on order completion, but available for frontend testing)
	api.Post("/coupons/apply", func(c *fiber.Ctx) error {
		userID := c.Locals("userId").(string)
		userObjID, _ := primitive.ObjectIDFromHex(userID)

		var req ApplyCouponRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"success": false, "message": "Invalid request"})
		}

		usedCouponsCol.InsertOne(c.Context(), UsedCoupon{
			UserID: userObjID,
			Code:   req.Code,
		})

		return c.JSON(fiber.Map{"success": true, "message": "Coupon applied successfully"})
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": "cart-service"})
	})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("Cart Service is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
