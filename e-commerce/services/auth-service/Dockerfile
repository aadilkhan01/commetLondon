# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy shared packages first (for caching)
COPY packages/ ./packages/

# Copy service
COPY services/auth-service/ ./services/auth-service/

WORKDIR /app/services/auth-service

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/auth-service cmd/main.go

# Run stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

COPY --from=builder /bin/auth-service .

EXPOSE 8081

CMD ["./auth-service"]
