package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Bank represents a net banking bank entity.
type Bank struct {
	ID   primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name string             `json:"name" bson:"name"`
}
