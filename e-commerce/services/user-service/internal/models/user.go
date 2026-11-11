package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user profile in the system.
type User struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	FirstName    string             `json:"firstName" bson:"firstName"`
	LastName     string             `json:"lastName" bson:"lastName"`
	Email        string             `json:"email" bson:"email"`
	Mobile       string             `json:"mobile,omitempty" bson:"mobile,omitempty"`
	ProfileImage string             `json:"profileImage,omitempty" bson:"profileImage,omitempty"`
	Addresses    []Address          `json:"addresses" bson:"addresses"`
	Wishlist     []primitive.ObjectID `json:"wishlist" bson:"wishlist"`
	SavedCards   []SavedCard          `json:"savedCards" bson:"savedCards"`
	CreatedAt    time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt    time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// Address represents a shipping/billing address.
type Address struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	FullName   string             `json:"fullName" bson:"fullName"`
	Phone      string             `json:"phone" bson:"phone"`
	AddressLine1 string           `json:"addressLine1" bson:"addressLine1"`
	AddressLine2 string           `json:"addressLine2,omitempty" bson:"addressLine2,omitempty"`
	City       string             `json:"city" bson:"city"`
	State      string             `json:"state" bson:"state"`
	ZipCode    string             `json:"zipCode" bson:"zipCode"`
	Country    string             `json:"country" bson:"country"`
	IsDefault  bool               `json:"isDefault" bson:"isDefault"`
}

// SavedCard represents a saved credit/debit card for a user.
type SavedCard struct {
	ID    string `json:"id" bson:"_id"`
	Brand string `json:"brand" bson:"brand"`
	Last4 string `json:"last4" bson:"last4"`
	Bank  string `json:"bank" bson:"bank"`
}

// ─── Request DTOs ───────────────────────────────────────────

// UpdateProfileRequest for updating user profile.
type UpdateProfileRequest struct {
	FirstName    string `json:"firstName,omitempty"`
	LastName     string `json:"lastName,omitempty"`
	Mobile       string `json:"mobile,omitempty"`
	ProfileImage string `json:"profileImage,omitempty"`
}

// AddAddressRequest for adding a new address.
type AddAddressRequest struct {
	FullName     string `json:"fullName" validate:"required"`
	Phone        string `json:"phone" validate:"required"`
	AddressLine1 string `json:"addressLine1" validate:"required"`
	AddressLine2 string `json:"addressLine2,omitempty"`
	City         string `json:"city" validate:"required"`
	State        string `json:"state" validate:"required"`
	ZipCode      string `json:"zipCode" validate:"required"`
	Country      string `json:"country" validate:"required"`
	IsDefault    bool   `json:"isDefault"`
}

// AddSavedCardRequest for adding a new saved card.
type AddSavedCardRequest struct {
	ID    string `json:"id" validate:"required"`
	Brand string `json:"brand" validate:"required"`
	Last4 string `json:"last4" validate:"required"`
	Bank  string `json:"bank"`
}
