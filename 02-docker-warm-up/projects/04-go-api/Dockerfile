# ==========================================
# Stage 1: Build static Go binary
# ==========================================
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache module dependencies
COPY go.mod ./

# Copy source code
COPY . .

# Compile standalone static binary (CGO_ENABLED=0)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

# ==========================================
# Stage 2: Minimal runtime
# ==========================================
FROM alpine:3.19

# Create non-root user for production security
RUN adduser -D -u 1000 appuser

WORKDIR /app

# Copy compiled binary from builder
COPY --from=builder /app/server /app/server

USER appuser

EXPOSE 8080

CMD ["/app/server"]
