package database

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// ConnectRedis establishes a connection to Redis and returns a client.
func ConnectRedis(addr, password string, db int) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           db,
		MaxRetries:   3,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     50,
		MinIdleConns: 10,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	log.Info().Str("addr", addr).Msg("Connected to Redis")
	return client, nil
}

// DisconnectRedis gracefully closes the Redis connection.
func DisconnectRedis(client *redis.Client) {
	if err := client.Close(); err != nil {
		log.Error().Err(err).Msg("Error disconnecting from Redis")
	} else {
		log.Info().Msg("Disconnected from Redis")
	}
}
