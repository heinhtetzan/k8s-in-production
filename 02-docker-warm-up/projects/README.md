# Docker Practice Projects

This directory contains **6 complete, runnable projects** with production-ready `Dockerfile` configurations:

```text
projects/
├── 01-html-static/        # Frontend: 5-page static website (NGINX Alpine)
├── 02-tanstack-react/     # Frontend: 5-page React SPA (Vite + Node build + NGINX serve)
├── 03-elysia-bun/         # Backend: REST API (Bun + Elysia)
├── 04-go-api/             # Backend: REST API (Go net/http multi-stage ~15MB)
├── 05-python-api/         # Backend: REST API (FastAPI + Uvicorn)
└── 06-rust-api/           # Backend: REST API (Rust Axum + Tokio multi-stage ~20MB)
```

---

## 📡 Unified API Routes Across Backend Projects

Every backend project implements the exact same REST endpoints:

| Method | Route | Request Payload | Response Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | `{"message": "Hello <TechStack>"}` | Root greeting |
| `GET` | `/reverse/:word` | Path param (`:word`) | `{"message": "<reversed_word>"}` | Reverse string logic |
| `POST` | `/area` | `{"width": 10, "height": 5}` | `{"message": 50}` | Area calculation |
| *Any* | `/*` (Fallback) | None | `{"message": "Route not found"}` | 404 error handler |

---

## Quick Build & Run Reference

### 1. `03-elysia-bun` (Port 3001)
```bash
cd 03-elysia-bun
docker build -t my-elysia-api:1.0 .
docker run -d -p 3001:3000 --name elysia-api my-elysia-api:1.0
```
* **Test**:
  * `curl http://localhost:3001/`
  * `curl http://localhost:3001/reverse/kubernetes`
  * `curl -X POST http://localhost:3001/area -H "Content-Type: application/json" -d '{"width": 10, "height": 5}'`

### 2. `04-go-api` (Port 8081)
```bash
cd 04-go-api
docker build -t my-go-api:1.0 .
docker run -d -p 8081:8080 --name go-api my-go-api:1.0
```
* **Test**:
  * `curl http://localhost:8081/`
  * `curl http://localhost:8081/reverse/docker`
  * `curl -X POST http://localhost:8081/area -H "Content-Type: application/json" -d '{"width": 8, "height": 4}'`

### 3. `05-python-api` (Port 8000)
```bash
cd 05-python-api
docker build -t my-python-api:1.0 .
docker run -d -p 8000:8000 --name python-api my-python-api:1.0
```
* **Test**:
  * `curl http://localhost:8000/`
  * `curl http://localhost:8000/reverse/production`
  * `curl -X POST http://localhost:8000/area -H "Content-Type: application/json" -d '{"width": 12, "height": 6}'`

### 4. `06-rust-api` (Port 8082)
```bash
cd 06-rust-api
docker build -t my-rust-api:1.0 .
docker run -d -p 8082:8082 --name rust-api my-rust-api:1.0
```
* **Test**:
  * `curl http://localhost:8082/`
  * `curl http://localhost:8082/reverse/ferris`
  * `curl -X POST http://localhost:8082/area -H "Content-Type: application/json" -d '{"width": 7, "height": 3}'`

---

### Frontend Projects
* **`01-html-static` (Port 8080)**: 5 static HTML pages served via NGINX.
* **`02-tanstack-react` (Port 3000)**: 5 interactive SPA views built with React & Vite.

---

## 🧪 Running Automated Unit & Integration Tests

All backend projects come equipped with identical test suites validating `GET /`, `GET /reverse/:word`, `POST /area` (valid & invalid input), and `404 Not Found`:

| Project | Test Command | Framework / Runner |
| :--- | :--- | :--- |
| **`03-elysia-bun`** | `bun test` | Bun Test Runner (`bun:test`) |
| **`04-go-api`** | `go test -v ./...` | Go standard `testing` + `net/http/httptest` |
| **`05-python-api`** | `pytest -v` | Pytest + Starlette `TestClient` |
| **`06-rust-api`** | `cargo test` | Rust built-in test harness + `tower::ServiceExt` |

