# 03-elysia-bun: Bun + Elysia REST API

A high-throughput TypeScript REST API powered by [Bun](https://bun.sh) and [Elysia.js](https://elysiajs.com) with built-in TypeBox schema validation.

---

## 📁 Project Structure

```text
03-elysia-bun/
├── Dockerfile          # Container build using oven/bun:1-alpine
├── package.json        # Dependencies (elysia, @types/bun) & scripts
├── tsconfig.json       # TypeScript configuration for Bun
├── src/
│   ├── index.ts        # API routes and server bootstrap
│   └── index.test.ts   # Automated route test suite (bun:test)
├── .dockerignore       # Excludes node_modules, .git, etc.
└── README.md           # This guide
```

---

## 📡 API Endpoints Specification

| Method | Endpoint | Request Payload | Response Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | *None* | `{"message":"Hello Elysia"}` | Root greeting |
| `GET` | `/reverse/:word` | Path param (`:word`) | `{"message":"aisyle"}` | Reverses characters |
| `POST` | `/area` | `{"width": 10, "height": 5}` | `{"message": 50}` | Area calculation |
| *Any* | `/*` (Fallback) | *None* | `{"message":"Route not found"}` | Custom 404 handler |

---

## 🐳 Dockerfile Explained

```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

# Cache package dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy application source
COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

* **Base Image**: `oven/bun:1-alpine` provides an official, minimal Alpine-based Bun runtime.
* **Dependency Caching**: Copying `package.json` before `src/` ensures `bun install` is only re-executed when dependencies change.
* **Non-Root / Fast Startup**: Bun boots within milliseconds with low memory overhead.

---

## 🛠️ Step 1: Build the Docker Image

From this directory (`02-docker-warm-up/projects/03-elysia-bun`):

```bash
docker build -t my-elysia-api:1.0 .
```

---

## 🚀 Step 2: Run the Docker Container

```bash
docker run -d -p 3001:3000 --name elysia-api my-elysia-api:1.0
```

### Run Flags Explained:
* `-d`: Run in detached mode (background).
* `-p 3001:3000`: Maps port `3001` on host to port `3000` inside the container.
* `--name elysia-api`: Assigns a descriptive container name.

---

## 🧪 Step 3: Test with `curl`

```bash
# 1. Root greeting
curl http://localhost:3001/

# 2. String reversal
curl http://localhost:3001/reverse/kubernetes

# 3. Valid Area Calculation
curl -X POST http://localhost:3001/area \
  -H "Content-Type: application/json" \
  -d '{"width": 10, "height": 5}'

# 4. Invalid Area Calculation (Type validation error returns HTTP 422)
curl -i -X POST http://localhost:3001/area \
  -H "Content-Type: application/json" \
  -d '{"width": "invalid", "height": 5}'

# 5. Non-existent Route (Returns HTTP 404)
curl -i http://localhost:3001/unknown-path
```

---

## 🚦 Step 4: Run Automated Tests

The project includes unit and integration tests using Bun's built-in test runner (`bun:test`):

```bash
# If Bun is installed on your host machine:
bun test

# Or run tests directly inside a Docker container:
docker run --rm -v "$(pwd):/app" -w /app oven/bun:1-alpine bun test
```

---

## 🛑 Step 5: Container Management

```bash
# Check container status
docker ps --filter "name=elysia-api"

# Follow live output logs
docker logs -f elysia-api

# Enter container shell
docker exec -it elysia-api sh

# Stop and remove container
docker stop elysia-api
docker rm elysia-api
```
