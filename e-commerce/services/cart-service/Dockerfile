FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY services/cart-service/ ./services/cart-service/
WORKDIR /app/services/cart-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/cart-service cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /bin/cart-service .
EXPOSE 8084
CMD ["./cart-service"]
