FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY services/admin-service/ ./services/admin-service/
WORKDIR /app/services/admin-service
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /bin/admin-service cmd/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /bin/admin-service .
EXPOSE 8088
CMD ["./admin-service"]
