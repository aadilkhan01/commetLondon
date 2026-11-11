FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY services/product-service/ ./services/product-service/
WORKDIR /app/services/product-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/product-service cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /bin/product-service .
EXPOSE 8083
CMD ["./product-service"]
