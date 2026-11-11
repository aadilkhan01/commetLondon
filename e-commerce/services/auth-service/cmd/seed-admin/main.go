package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/dynamo-ecommerce/auth-service/internal/models"
	"github.com/dynamo-ecommerce/shared-utils/auth"
	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/database"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {
	base := config.LoadBaseConfig()
	dbName := config.GetEnv("MONGODB_AUTH_DB", "ecommerce-auth")

	client, err := database.ConnectMongoDB(base.MongoURI)
	if err != nil {
		fmt.Printf("Failed to connect to MongoDB: %v\n", err)
		os.Exit(1)
	}
	defer database.DisconnectMongoDB(client)

	db := client.Database(dbName)
	ctx := context.Background()

	credCol := db.Collection("credentials")

	// Check if admin user already exists
	adminEmail := "admin@dynamo.com"
	var existing models.Credential
	err = credCol.FindOne(ctx, bson.M{"email": adminEmail}).Decode(&existing)
	if err == nil {
		fmt.Println("⏭️  Admin user admin@dynamo.com already exists, skipping...")
		return
	}

	// Hash default admin password
	hashedPassword, err := auth.HashPassword("adminpassword")
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		os.Exit(1)
	}

	// Create Admin credential
	admin := models.Credential{
		FirstName:      "System",
		LastName:       "Administrator",
		Email:          adminEmail,
		Password:       hashedPassword,
		Role:           "ADMIN",
		Provider:       "local",
		IsVerified:     true,
		EmailVerified:  true,
		MobileVerified: false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, err = credCol.InsertOne(ctx, admin)
	if err != nil {
		fmt.Printf("Failed to seed admin user: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✅ Seeded Admin user (admin@dynamo.com / adminpassword)")
}
