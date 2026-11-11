FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/api-gateway/ ./apps/api-gateway/
WORKDIR /app/apps/api-gateway
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/api-gateway cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /bin/api-gateway .
EXPOSE 8080
CMD ["./api-gateway"]
