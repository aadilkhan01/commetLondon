package handler

import (
	"context"
	"time"

	"github.com/dynamo-ecommerce/admin-service/internal/models"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// AdminHandler handles backoffice administrative endpoints.
type AdminHandler struct {
	mongoClient   *mongo.Client
	credentials   *mongo.Collection
	orders        *mongo.Collection
	products      *mongo.Collection
	settings      *mongo.Collection
	auditLogs     *mongo.Collection
}

// NewAdminHandler creates a new AdminHandler and initializes collections.
func NewAdminHandler(client *mongo.Client) *AdminHandler {
	return &AdminHandler{
		mongoClient:   client,
		credentials:   client.Database("ecommerce-auth").Collection("credentials"),
		orders:        client.Database("ecommerce-orders").Collection("orders"),
		products:      client.Database("ecommerce-products").Collection("products"),
		settings:      client.Database("ecommerce-admin").Collection("settings"),
		auditLogs:     client.Database("ecommerce-admin").Collection("audit_logs"),
	}
}

// GetDashboardStats aggregates KPIs across all databases.
// GET /api/v1/admin/dashboard/stats
func (h *AdminHandler) GetDashboardStats(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// 1. Total Sales (delivered and confirmed orders sum)
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"status": bson.M{"$nin": []interface{}{"CANCELLED", "PENDING"}}}}},
		{{Key: "$group", Value: bson.M{"_id": nil, "totalSales": bson.M{"$sum": "$total"}}}},
	}
	cursor, err := h.orders.Aggregate(ctx, pipeline)
	var totalSales float64
	if err == nil {
		defer cursor.Close(ctx)
		var results []bson.M
		if err := cursor.All(ctx, &results); err == nil && len(results) > 0 {
			if tsVal, ok := results[0]["totalSales"].(float64); ok {
				totalSales = tsVal
			} else if tsValInt, ok := results[0]["totalSales"].(int32); ok {
				totalSales = float64(tsValInt)
			} else if tsValInt64, ok := results[0]["totalSales"].(int64); ok {
				totalSales = float64(tsValInt64)
			}
		}
	}

	// 2. Total Orders
	totalOrders, _ := h.orders.CountDocuments(ctx, bson.M{})

	// 3. Total Users (registered CUSTOMERs)
	totalUsers, _ := h.credentials.CountDocuments(ctx, bson.M{"role": "CUSTOMER"})

	// 4. Total Products
	totalProducts, _ := h.products.CountDocuments(ctx, bson.M{})

	// 5. Low Stock Count (stock < 5)
	lowStockCount, _ := h.products.CountDocuments(ctx, bson.M{"stock": bson.M{"$lt": 5}})

	// 6. Recent 5 Orders (with joined customer email)
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(5)
	orderCursor, err := h.orders.Find(ctx, bson.M{}, opts)
	var recentOrders []models.RecentOrder
	if err == nil {
		defer orderCursor.Close(ctx)
		for orderCursor.Next(ctx) {
			var ord struct {
				ID          primitive.ObjectID `bson:"_id"`
				OrderNumber string             `bson:"orderNumber"`
				UserID      primitive.ObjectID `bson:"userId"`
				Total       float64            `bson:"total"`
				Status      string             `bson:"status"`
				CreatedAt   time.Time          `bson:"createdAt"`
			}
			if err := orderCursor.Decode(&ord); err == nil {
				// Lookup customer email
				var email string
				var cred struct {
					Email string `bson:"email"`
				}
				err = h.credentials.FindOne(ctx, bson.M{"_id": ord.UserID}).Decode(&cred)
				if err == nil {
					email = cred.Email
				} else {
					email = "unknown@customer.com"
				}

				recentOrders = append(recentOrders, models.RecentOrder{
					ID:          ord.ID.Hex(),
					OrderNumber: ord.OrderNumber,
					Email:       email,
					Total:       ord.Total,
					Status:      ord.Status,
					CreatedAt:   ord.CreatedAt,
				})
			}
		}
	}
	if recentOrders == nil {
		recentOrders = []models.RecentOrder{}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": models.DashboardStats{
			TotalSales:    totalSales,
			TotalOrders:   totalOrders,
			TotalUsers:    totalUsers,
			TotalProducts: totalProducts,
			LowStockCount: lowStockCount,
			RecentOrders:  recentOrders,
		},
	})
}

// GetSettings retrieves backoffice configurations.
// GET /api/v1/admin/settings
func (h *AdminHandler) GetSettings(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var settings models.AdminSettings
	err := h.settings.FindOne(ctx, bson.M{}).Decode(&settings)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Initialize default settings
			settings = models.AdminSettings{
				TaxRate:         8.0,
				ShippingFee:     9.99,
				FreeShippingMin: 100.0,
				UpdatedAt:       time.Now(),
			}
			res, errInsert := h.settings.InsertOne(ctx, settings)
			if errInsert == nil {
				settings.ID = res.InsertedID.(primitive.ObjectID)
			}
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch settings"},
			})
		}
	}

	return c.JSON(fiber.Map{"success": true, "data": settings})
}

// UpdateSettings updates backoffice configurations.
// PUT /api/v1/admin/settings
func (h *AdminHandler) UpdateSettings(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 400, "message": "Invalid request body"},
		})
	}

	update := bson.M{"updatedAt": time.Now()}
	if val, ok := body["taxRate"].(float64); ok {
		update["taxRate"] = val
	}
	if val, ok := body["shippingFee"].(float64); ok {
		update["shippingFee"] = val
	}
	if val, ok := body["freeShippingMin"].(float64); ok {
		update["freeShippingMin"] = val
	}

	opts := options.Update().SetUpsert(true)
	_, err := h.settings.UpdateOne(ctx, bson.M{}, bson.M{"$set": update}, opts)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to update settings"},
		})
	}

	// Create audit log
	adminID := c.Locals("userId").(string)
	h.LogAction(ctx, adminID, "UPDATE_SETTINGS", "Updated tax or shipping rates", c.IP())

	return c.JSON(fiber.Map{"success": true, "message": "Settings updated successfully"})
}

// GetAuditLogs lists log of all administrative actions.
// GET /api/v1/admin/audit-logs
func (h *AdminHandler) GetAuditLogs(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(100)
	cursor, err := h.auditLogs.Find(ctx, bson.M{}, opts)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false, "error": fiber.Map{"code": 500, "message": "Failed to fetch audit logs"},
		})
	}
	defer cursor.Close(ctx)

	var logs []models.AuditLog
	cursor.All(ctx, &logs)
	if logs == nil {
		logs = []models.AuditLog{}
	}

	return c.JSON(fiber.Map{"success": true, "data": logs})
}

// LogAction inserts a record in the audit log collection.
func (h *AdminHandler) LogAction(ctx context.Context, adminID, action, details, ip string) {
	logEntry := models.AuditLog{
		AdminID:   adminID,
		Action:    action,
		Details:   details,
		IPAddress: ip,
		CreatedAt: time.Now(),
	}
	_, _ = h.auditLogs.InsertOne(ctx, logEntry)
}
