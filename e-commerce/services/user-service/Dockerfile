FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY services/user-service/ ./services/user-service/
WORKDIR /app/services/user-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/user-service cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /bin/user-service .
EXPOSE 8082
CMD ["./user-service"]
