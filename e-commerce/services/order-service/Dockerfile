FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY services/order-service/ ./services/order-service/
WORKDIR /app/services/order-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/order-service cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /bin/order-service .
EXPOSE 8085
CMD ["./order-service"]
