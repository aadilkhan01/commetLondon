package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Init initializes the zerolog logger with the given level and service name.
func Init(level, serviceName string) {
	// Parse log level
	logLevel, err := zerolog.ParseLevel(level)
	if err != nil {
		logLevel = zerolog.DebugLevel
	}

	zerolog.SetGlobalLevel(logLevel)
	zerolog.TimeFieldFormat = time.RFC3339

	// Console writer for development, JSON for production
	if os.Getenv("APP_ENV") == "production" {
		log.Logger = zerolog.New(os.Stdout).
			With().
			Timestamp().
			Str("service", serviceName).
			Logger()
	} else {
		output := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "15:04:05",
		}
		log.Logger = zerolog.New(output).
			With().
			Timestamp().
			Str("service", serviceName).
			Logger()
	}
}
