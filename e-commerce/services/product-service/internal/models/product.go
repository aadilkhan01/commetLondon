package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ProductVariant represents a specific color/variant of a product.
type ProductVariant struct {
	ID            string   `json:"id" bson:"id"`
	Color         string   `json:"color" bson:"color"`
	SKU           string   `json:"sku" bson:"sku"`
	Stock         int      `json:"stock" bson:"stock"`
	Price         float64  `json:"price" bson:"price"`
	DiscountPrice float64  `json:"discountPrice,omitempty" bson:"discountPrice,omitempty"`
}

// Product represents a product in the catalog.
type Product struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name           string             `json:"name" bson:"name"`
	Slug           string             `json:"slug" bson:"slug"`
	Brand          string             `json:"brand" bson:"brand"`
	Category       string             `json:"category" bson:"category"`
	SubCategory    string             `json:"subCategory" bson:"subCategory"`
	Description    string             `json:"description" bson:"description"`
	Summary        string             `json:"summary,omitempty" bson:"summary,omitempty"`
	Specifications map[string]string  `json:"specifications" bson:"specifications"`
	Features       []string           `json:"features" bson:"features"`
	Images         []string           `json:"images" bson:"images"`
	Price          float64            `json:"price" bson:"price"`
	DiscountPrice  float64            `json:"discountPrice,omitempty" bson:"discountPrice,omitempty"`
	Stock          int                `json:"stock" bson:"stock"`
	SKU            string             `json:"sku" bson:"sku"`
	Ratings        float64            `json:"ratings" bson:"ratings"`
	ReviewsCount   int                `json:"reviewsCount" bson:"reviewsCount"`
	Tags           []string           `json:"tags" bson:"tags"`
	IsFeatured     bool               `json:"isFeatured" bson:"isFeatured"`
	IsNewArrival   bool               `json:"isNewArrival" bson:"isNewArrival"`
	IsBestSeller   bool               `json:"isBestSeller" bson:"isBestSeller"`
	Colors         []string           `json:"colors,omitempty" bson:"colors,omitempty"`
	Variants       []ProductVariant   `json:"variants,omitempty" bson:"variants,omitempty"`
	CreatedAt      time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt      time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// Category represents a product category.
type Category struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name"`
	Slug        string             `json:"slug" bson:"slug"`
	Description string             `json:"description,omitempty" bson:"description,omitempty"`
	Image       string             `json:"image,omitempty" bson:"image,omitempty"`
	ParentID    *primitive.ObjectID `json:"parentId,omitempty" bson:"parentId,omitempty"`
	Children    []Category         `json:"children,omitempty" bson:"-"`
	CreatedAt   time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// ProductFilter holds filter parameters for product queries.
type ProductFilter struct {
	Category     string
	SubCategory  string
	Brand        string
	Color        string
	MinPrice     float64
	MaxPrice     float64
	MinRating    float64
	InStock      *bool
	IsFeatured   *bool
	IsNewArrival *bool
	IsBestSeller *bool
	Tags         []string
	Search       string
	SortBy       string
	SortOrder    string
	Page         int
	Limit        int
}

// CreateProductRequest is the DTO for creating a product.
type CreateProductRequest struct {
	Name           string            `json:"name" validate:"required"`
	Brand          string            `json:"brand" validate:"required"`
	Category       string            `json:"category" validate:"required"`
	SubCategory    string            `json:"subCategory"`
	Description    string            `json:"description" validate:"required"`
	Specifications map[string]string `json:"specifications"`
	Features       []string          `json:"features"`
	Images         []string          `json:"images"`
	Price          float64           `json:"price" validate:"required,gt=0"`
	DiscountPrice  float64           `json:"discountPrice"`
	Stock          int               `json:"stock" validate:"gte=0"`
	SKU            string            `json:"sku" validate:"required"`
	Tags           []string          `json:"tags"`
	IsFeatured     bool              `json:"isFeatured"`
	IsNewArrival   bool              `json:"isNewArrival"`
	IsBestSeller   bool              `json:"isBestSeller"`
	Colors         []string          `json:"colors"`
	Variants       []ProductVariant  `json:"variants"`
}

// CreateCategoryRequest is the DTO for creating a category.
type CreateCategoryRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	Image       string  `json:"image"`
	ParentID    *string `json:"parentId"`
}
