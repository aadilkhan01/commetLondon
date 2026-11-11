package config

import (
	sharedConfig "github.com/dynamo-ecommerce/shared-utils/config"
)

// Config holds all configuration for the auth service.
type Config struct {
	sharedConfig.BaseConfig
	Port              string
	DBName            string
	AccessTokenExp    string
	RefreshTokenExp   string
	OTPExpirySec      int
	OTPLength         int
	GoogleClientID    string
	GoogleSecret      string
	GoogleRedirectURL string
}

// Load loads the auth service configuration from environment variables.
func Load() *Config {
	base := sharedConfig.LoadBaseConfig()
	return &Config{
		BaseConfig:        base,
		Port:              sharedConfig.GetEnv("AUTH_SERVICE_PORT", "8081"),
		DBName:            sharedConfig.GetEnv("MONGODB_AUTH_DB", "ecommerce-auth"),
		AccessTokenExp:    sharedConfig.GetEnv("JWT_ACCESS_EXPIRY", "15m"),
		RefreshTokenExp:   sharedConfig.GetEnv("JWT_REFRESH_EXPIRY", "168h"),
		OTPExpirySec:      sharedConfig.GetEnvInt("OTP_EXPIRY_SECONDS", 300),
		OTPLength:         sharedConfig.GetEnvInt("OTP_LENGTH", 6),
		GoogleClientID:    sharedConfig.GetEnv("GOOGLE_CLIENT_ID", ""),
		GoogleSecret:      sharedConfig.GetEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL: sharedConfig.GetEnv("GOOGLE_REDIRECT_URL", "http://192.168.6.53/api/v1/auth/google/callback"),
	}
}
