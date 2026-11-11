module github.com/dynamo-ecommerce/api-gateway

go 1.23

require (
	github.com/dynamo-ecommerce/shared-utils v0.0.0
	github.com/gofiber/fiber/v2 v2.52.6
	github.com/rs/zerolog v1.33.0
	github.com/valyala/fasthttp v1.58.0
)

replace github.com/dynamo-ecommerce/shared-utils => ../../packages/shared-utils

require (
	github.com/andybalholm/brotli v1.1.1 // indirect
	github.com/golang-jwt/jwt/v5 v5.2.1 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/klauspost/compress v1.17.11 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.16 // indirect
	github.com/philhofer/fwd v1.1.3-0.20240916144458-20a13a1f6b7c // indirect
	github.com/rivo/uniseg v0.4.7 // indirect
	github.com/tinylib/msgp v1.2.5 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/tcplisten v1.0.0 // indirect
	golang.org/x/crypto v0.32.0 // indirect
	golang.org/x/sys v0.29.0 // indirect
)
