package config

import (
	"os"
	"strconv"
)

// GetEnv returns the value of an environment variable or a default value.
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetEnvInt returns an environment variable as int or a default.
func GetEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

// GetEnvBool returns an environment variable as bool or a default.
func GetEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

// BaseConfig holds common configuration shared by all services.
type BaseConfig struct {
	AppEnv     string
	MongoURI   string
	RedisURL   string
	RedisPass  string
	RedisDB    int
	JWTSecret  string
	LogLevel   string
}

// LoadBaseConfig loads common configuration from environment.
func LoadBaseConfig() BaseConfig {
	return BaseConfig{
		AppEnv:    GetEnv("APP_ENV", "development"),
		MongoURI:  GetEnv("MONGODB_URI", "mongodb://localhost:27017"),
		RedisURL:  GetEnv("REDIS_URL", "localhost:6379"),
		RedisPass: GetEnv("REDIS_PASSWORD", ""),
		RedisDB:   GetEnvInt("REDIS_DB", 0),
		JWTSecret: GetEnv("JWT_SECRET", "default-secret-change-me"),
		LogLevel:  GetEnv("LOG_LEVEL", "debug"),
	}
}
