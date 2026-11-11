package main

import (
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/dynamo-ecommerce/shared-utils/config"
	"github.com/dynamo-ecommerce/shared-utils/logger"
	"github.com/dynamo-ecommerce/shared-utils/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog/log"
	"github.com/valyala/fasthttp"
)

// ServiceRoute maps a URL prefix to a backend service URL.
type ServiceRoute struct {
	Prefix    string
	Target    string
	Protected bool // Whether this route requires authentication
}

func main() {
	port := config.GetEnv("API_GATEWAY_PORT", "8080")
	base := config.LoadBaseConfig()

	logger.Init(base.LogLevel, "api-gateway")
	log.Info().Msg("Starting API Gateway...")

	// Service routing table
	routes := []ServiceRoute{
		{Prefix: "/api/v1/auth", Target: config.GetEnv("AUTH_SERVICE_URL", "http://localhost:8081"), Protected: false},
		{Prefix: "/api/v1/users", Target: config.GetEnv("USER_SERVICE_URL", "http://localhost:8082"), Protected: true},
		{Prefix: "/api/v1/products", Target: config.GetEnv("PRODUCT_SERVICE_URL", "http://localhost:8083"), Protected: false},
		{Prefix: "/api/v1/categories", Target: config.GetEnv("PRODUCT_SERVICE_URL", "http://localhost:8083"), Protected: false},
		{Prefix: "/api/v1/cart", Target: config.GetEnv("CART_SERVICE_URL", "http://localhost:8084"), Protected: true},
		{Prefix: "/api/v1/orders", Target: config.GetEnv("ORDER_SERVICE_URL", "http://localhost:8085"), Protected: true},
		{Prefix: "/api/v1/notifications", Target: config.GetEnv("NOTIFICATION_SERVICE_URL", "http://localhost:8086"), Protected: true},
		{Prefix: "/api/v1/search", Target: config.GetEnv("SEARCH_SERVICE_URL", "http://localhost:8087"), Protected: false},
		{Prefix: "/api/v1/admin", Target: config.GetEnv("ADMIN_SERVICE_URL", "http://localhost:8088"), Protected: true},
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		AppName:      "API Gateway",
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Request-ID",
		AllowCredentials: false,
	}))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.RequestLogger())


	// Register proxy routes
	for _, route := range routes {
		r := route // capture
		app.All(r.Prefix+"/*", func(c *fiber.Ctx) error {
			return proxyRequest(c, r.Target)
		})
		app.All(r.Prefix, func(c *fiber.Ctx) error {
			return proxyRequest(c, r.Target)
		})
	}

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "api-gateway",
			"version": "1.0.0",
		})
	})

	// 404 handler
	app.Use(func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 404, "message": "Route not found"},
		})
	})

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Info().Msg("Shutting down API Gateway...")
		_ = app.Shutdown()
	}()

	addr := fmt.Sprintf(":%s", port)
	log.Info().Str("port", port).Msg("API Gateway is running")
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

// proxyRequest forwards the request to the target service.
func proxyRequest(c *fiber.Ctx, targetBase string) error {
	// Build target URL
	path := c.OriginalURL()
	targetURL := targetBase + path

	req := fasthttp.AcquireRequest()
	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseRequest(req)
	defer fasthttp.ReleaseResponse(resp)

	// Copy request
	req.SetRequestURI(targetURL)
	req.Header.SetMethod(c.Method())

	// Copy headers
	c.Request().Header.VisitAll(func(key, value []byte) {
		k := string(key)
		if !strings.EqualFold(k, "Host") && !strings.EqualFold(k, "Connection") {
			req.Header.Set(k, string(value))
		}
	})

	// Copy body
	if len(c.Body()) > 0 {
		req.SetBody(c.Body())
	}

	// Execute request
	client := &fasthttp.Client{
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	if err := client.Do(req, resp); err != nil {
		log.Error().Err(err).Str("target", targetURL).Msg("Proxy request failed")
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": 502, "message": "Service unavailable"},
		})
	}

	// Copy response
	c.Status(resp.StatusCode())
	resp.Header.VisitAll(func(key, value []byte) {
		k := string(key)
		if !strings.EqualFold(k, "Connection") && 
			!strings.EqualFold(k, "Transfer-Encoding") && 
			!strings.HasPrefix(strings.ToLower(k), "access-control-") {
			c.Set(k, string(value))
		}
	})

	return c.Send(resp.Body())
}
