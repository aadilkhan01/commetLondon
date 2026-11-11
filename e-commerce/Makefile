.PHONY: help dev build stop clean seed test

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Development ──────────────────────────────────────────────

dev: ## Start all services with Docker Compose
	docker-compose up --build

dev-detached: ## Start all services in background
	docker-compose up --build -d

stop: ## Stop all services
	docker-compose down

clean: ## Stop and remove volumes
	docker-compose down -v --remove-orphans

# ─── Individual Services ─────────────────────────────────────

run-gateway: ## Run API Gateway
	cd apps/api-gateway && go run cmd/main.go

run-auth: ## Run Auth Service
	cd services/auth-service && go run cmd/main.go

run-user: ## Run User Service
	cd services/user-service && go run cmd/main.go

run-product: ## Run Product Service
	cd services/product-service && go run cmd/main.go

run-cart: ## Run Cart Service
	cd services/cart-service && go run cmd/main.go

run-order: ## Run Order Service
	cd services/order-service && go run cmd/main.go

run-notification: ## Run Notification Service
	cd services/notification-service && go run cmd/main.go

run-search: ## Run Search Service
	cd services/search-service && go run cmd/main.go

run-admin-service: ## Run Admin Service
	cd services/admin-service && go run cmd/main.go

run-frontend: ## Run Frontend
	cd apps/frontend && npm run dev

run-admin-portal: ## Run Admin Portal
	cd apps/admin-portal && npm run dev

# ─── Database ────────────────────────────────────────────────

seed: ## Seed database with initial data
	cd services/product-service && go run seeds/seed.go

seed-admin: ## Seed admin account
	cd services/auth-service && go run cmd/seed-admin/main.go

# ─── Testing ─────────────────────────────────────────────────

test: ## Run all tests
	cd services/auth-service && go test ./...
	cd services/user-service && go test ./...
	cd services/product-service && go test ./...
	cd services/cart-service && go test ./...
	cd services/order-service && go test ./...
	cd services/notification-service && go test ./...
	cd services/search-service && go test ./...
	cd services/admin-service && go test ./...
	cd apps/api-gateway && go test ./...

test-frontend: ## Run frontend tests
	cd apps/frontend && npm run lint && npm run build

# ─── Build ───────────────────────────────────────────────────

build: ## Build all Go services
	cd apps/api-gateway && go build -o bin/gateway cmd/main.go
	cd services/auth-service && go build -o bin/auth cmd/main.go
	cd services/user-service && go build -o bin/user cmd/main.go
	cd services/product-service && go build -o bin/product cmd/main.go
	cd services/cart-service && go build -o bin/cart cmd/main.go
	cd services/order-service && go build -o bin/order cmd/main.go
	cd services/notification-service && go build -o bin/notification cmd/main.go
	cd services/search-service && go build -o bin/search cmd/main.go
	cd services/admin-service && go build -o bin/admin cmd/main.go

build-frontend: ## Build frontend for production
	cd apps/frontend && npm run build
	cd apps/admin-portal && npm run build
