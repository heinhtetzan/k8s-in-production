# 04-go-api: Go REST API (Multi-Stage Minimal Binary)

A lightweight, production-grade REST API written in idiomatic Go (1.22+) using standard library `net/http` and compiled into a standalone static binary inside a minimal Alpine container (~18 MB).

---

## 📁 Project Structure

```text
04-go-api/
├── Dockerfile          # Multi-stage build: Go builder -> Minimal Alpine runtime
├── go.mod              # Go module definition
├── main.go             # Application routes, handlers, and server bootstrap
├── main_test.go        # Automated route test suite (testing & httptest)
├── .dockerignore       # Excludes local binaries, git, etc.
└── README.md           # This guide
```

---

## 📡 API Endpoints Specification

| Method | Endpoint | Request Payload | Response Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | *None* | `{"message":"Hello Go"}` | Root greeting |
| `GET` | `/reverse/{word}` | Path param (`{word}`) | `{"message":"setenrebuk"}` | Reverses characters |
| `POST` | `/area` | `{"width": 8, "height": 4}` | `{"message": 32}` | Area calculation |
| *Any* | `/*` (Fallback) | *None* | `{"message":"Route not found"}` | Custom 404 handler |

---

## 🐳 Dockerfile Explained (Multi-Stage Build)

```dockerfile
# Stage 1: Compile static binary
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .

# Compile static binary with debugging symbols stripped (-s -w)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server .

# Stage 2: Minimal runtime
FROM alpine:3.19

RUN adduser -D -u 1000 appuser

WORKDIR /app
COPY --from=builder /app/server /app/server

USER appuser

EXPOSE 8080

CMD ["/app/server"]
```

### Key Security & Optimization Highlights:
1. **Multi-Stage Build**: Go compiler toolchain (~300 MB) is discarded. Only the compiled binary is placed into the runtime container (~18 MB total).
2. **Static Linking**: `CGO_ENABLED=0` ensures no external C dynamic library dependencies.
3. **Non-Root Execution**: Runs under unprivileged user `appuser` (`UID 1000`) for container security best practices.

---

## 🛠️ Step 1: Build the Docker Image

From this directory (`02-docker-warm-up/projects/04-go-api`):

```bash
docker build -t my-go-api:1.0 .
```

---

## 🚀 Step 2: Run the Docker Container

```bash
docker run -d -p 8081:8080 --name go-api my-go-api:1.0
```

### Run Flags Explained:
* `-d`: Run in detached mode (background).
* `-p 8081:8080`: Maps host port `8081` to container port `8080`.
* `--name go-api`: Sets container name to `go-api`.

---

## 🧪 Step 3: Test with `curl`

```bash
# 1. Root greeting
curl http://localhost:8081/

# 2. String reversal
curl http://localhost:8081/reverse/golang

# 3. Valid Area Calculation
curl -X POST http://localhost:8081/area \
  -H "Content-Type: application/json" \
  -d '{"width": 8, "height": 4}'

# 4. Invalid Area Calculation (JSON parsing failure returns HTTP 400)
curl -i -X POST http://localhost:8081/area \
  -H "Content-Type: application/json" \
  -d '{"width": "bad", "height": 4}'

# 5. Non-existent Route (Returns HTTP 404)
curl -i http://localhost:8081/unknown-path
```

---

## 🚦 Step 4: Run Automated Tests

The project includes test cases using Go's built-in `testing` and `net/http/httptest` packages:

```bash
# If Go is installed on your host:
go test -v ./...

# Or run tests directly inside a Docker container:
docker run --rm -v "$(pwd):/app" -w /app golang:1.22-alpine go test -v ./...
```

---

## 🛑 Step 5: Container Management

```bash
# Check container status
docker ps --filter "name=go-api"

# View logs
docker logs -f go-api

# Enter container shell
docker exec -it go-api sh

# Stop and remove container
docker stop go-api
docker rm go-api
```
