package database

import (
	"context"
	"time"

	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// ConnectMongoDB establishes a connection to MongoDB and returns a client.
func ConnectMongoDB(uri string) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().
		ApplyURI(uri).
		SetMaxPoolSize(100).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(30 * time.Second)

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, err
	}

	// Ping to verify connection
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, err
	}

	log.Info().Str("uri", uri).Msg("Connected to MongoDB")
	return client, nil
}

// GetDatabase returns a database reference from the MongoDB client.
func GetDatabase(client *mongo.Client, dbName string) *mongo.Database {
	return client.Database(dbName)
}

// DisconnectMongoDB gracefully disconnects from MongoDB.
func DisconnectMongoDB(client *mongo.Client) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Disconnect(ctx); err != nil {
		log.Error().Err(err).Msg("Error disconnecting from MongoDB")
	} else {
		log.Info().Msg("Disconnected from MongoDB")
	}
}
