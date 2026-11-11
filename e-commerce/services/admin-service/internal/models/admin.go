package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// DashboardStats holds summary KPI metrics for the backoffice main page.
type DashboardStats struct {
	TotalSales    float64       `json:"totalSales"`
	TotalOrders   int64         `json:"totalOrders"`
	TotalUsers    int64         `json:"totalUsers"`
	TotalProducts int64         `json:"totalProducts"`
	LowStockCount int64         `json:"lowStockCount"`
	RecentOrders  []RecentOrder `json:"recentOrders"`
}

// RecentOrder is a lightweight order model for the dashboard list.
type RecentOrder struct {
	ID          string    `json:"id"`
	OrderNumber string    `json:"orderNumber"`
	Email       string    `json:"email"`
	Total       float64   `json:"total"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

// AdminSettings represents global application configuration.
type AdminSettings struct {
	ID              primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	TaxRate         float64            `json:"taxRate" bson:"taxRate"`
	ShippingFee     float64            `json:"shippingFee" bson:"shippingFee"`
	FreeShippingMin float64            `json:"freeShippingMin" bson:"freeShippingMin"`
	UpdatedAt       time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// AuditLog tracks actions performed by backoffice administrators.
type AuditLog struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	AdminID   string             `json:"adminId" bson:"adminId"`
	Action    string             `json:"action" bson:"action"`
	Details   string             `json:"details" bson:"details"`
	IPAddress string             `json:"ipAddress" bson:"ipAddress"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}
