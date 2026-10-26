# 06-rust-api: Rust Axum REST API (Ultra-Lightweight Multi-Stage)

A blazing-fast, memory-safe asynchronous REST API written in [Rust](https://www.rust-lang.org/) using [Axum](https://github.com/tokio-rs/axum) and [Tokio](https://tokio.rs/), compiled into an ultra-small Alpine container (~15 MB).

---

## 📁 Project Structure

```text
06-rust-api/
├── Dockerfile          # Multi-stage: Rust Alpine builder -> Alpine 3.19 runtime
├── Cargo.toml          # Rust package manifest & dependencies (axum, tokio, serde)
├── Cargo.lock          # Dependency lockfile
├── src/
│   └── main.rs         # Axum router, route handlers, and unit test suite
├── .dockerignore       # Excludes target/, .git, etc.
└── README.md           # This guide
```

---

## 📡 API Endpoints Specification

| Method | Endpoint | Request Payload | Response Example | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | *None* | `{"message":"Hello Rust"}` | Root greeting |
| `GET` | `/reverse/:word` | Path param (`:word`) | `{"message":"sirref"}` | Reverses characters |
| `POST` | `/area` | `{"width": 7, "height": 3}` | `{"message": 21.0}` | Area calculation |
| *Any* | `/*` (Fallback) | *None* | `{"message":"Route not found"}` | Custom 404 handler |

---

## 🐳 Dockerfile Explained (Multi-Stage Build)

```dockerfile
# Stage 1: Build the Rust binary
FROM rust:alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app

# Cache dependencies trick: compile dummy src/main.rs first
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy real source code and rebuild
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Stage 2: Minimal Alpine runtime
FROM alpine:3.19

RUN adduser -D -u 1000 appuser

WORKDIR /app
COPY --from=builder /app/target/release/rust-sample-api /app/server

USER appuser

EXPOSE 8082

CMD ["/app/server"]
```

### Key Optimizations:
1. **Cargo Layer Caching**: By copying only `Cargo.toml` and compiling a dummy `src/main.rs`, Docker caches all crates. Re-running `docker build` after editing `src/main.rs` takes only 2-3 seconds instead of re-downloading crates.
2. **Tiny Footprint**: The compiled musl binary is only ~4.2 MB. The complete container image is ~14.9 MB total.
3. **Non-Root User**: Runs under `appuser` (`UID 1000`).

---

## 🛠️ Step 1: Build the Docker Image

From this directory (`02-docker-warm-up/projects/06-rust-api`):

```bash
docker build -t my-rust-api:1.0 .
```

---

## 🚀 Step 2: Run the Docker Container

```bash
docker run -d -p 8082:8082 --name rust-api my-rust-api:1.0
```

### Run Flags Explained:
* `-d`: Run in background (detached).
* `-p 8082:8082`: Maps host port `8082` to container port `8082`.
* `--name rust-api`: Sets container name to `rust-api`.

---

## 🧪 Step 3: Test with `curl`

```bash
# 1. Root greeting
curl http://localhost:8082/

# 2. String reversal
curl http://localhost:8082/reverse/ferris

# 3. Valid Area Calculation
curl -X POST http://localhost:8082/area \
  -H "Content-Type: application/json" \
  -d '{"width": 7, "height": 3}'

# 4. Invalid Area Calculation (Axum JSON extractor failure returns HTTP 422)
curl -i -X POST http://localhost:8082/area \
  -H "Content-Type: application/json" \
  -d '{"width": "bad", "height": 3}'

# 5. Non-existent Route (Returns HTTP 404)
curl -i http://localhost:8082/unknown-path
```

---

## 🚦 Step 4: Run Automated Tests

The project includes asynchronous integration tests using `tower::ServiceExt` and `http_body_util`:

```bash
# If Rust/Cargo is installed on your host:
cargo test

# Or run tests directly inside a Docker container:
docker run --rm -v "$(pwd):/app" -w /app rust:alpine sh -c "apk add musl-dev && cargo test"
```

---

## 🛑 Step 5: Container Management

```bash
# Check container status
docker ps --filter "name=rust-api"

# View logs
docker logs -f rust-api

# Enter container shell
docker exec -it rust-api sh

# Stop and remove container
docker stop rust-api
docker rm rust-api
```
