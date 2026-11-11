package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Review represents a product review submitted by a user.
type Review struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	ProductID primitive.ObjectID `json:"productId" bson:"productId"`
	UserID    primitive.ObjectID `json:"userId" bson:"userId"`
	UserName  string             `json:"userName" bson:"userName"`
	Rating    int                `json:"rating" bson:"rating"`
	Comment   string             `json:"comment" bson:"comment"`
	Images    []string           `json:"images" bson:"images"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

// CreateReviewRequest represents the payload for creating a review.
type CreateReviewRequest struct {
	Rating  int      `json:"rating"`
	Comment string   `json:"comment"`
	Images  []string `json:"images"`
}
