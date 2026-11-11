package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// BinInfo represents Bank Identification Number mapping data.
type BinInfo struct {
	ID       primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	BIN      string             `json:"bin" bson:"bin"`
	Scheme   string             `json:"scheme" bson:"scheme"`
	BankName string             `json:"bankName" bson:"bankName"`
}
