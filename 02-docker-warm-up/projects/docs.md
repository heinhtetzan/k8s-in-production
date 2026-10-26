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

## 🧪 Running Automated Unit & Integration Tests

All backend projects come equipped with identical test suites validating `GET /`, `GET /reverse/:word`, `POST /area` (valid & invalid input), and `404 Not Found`:

| Project | Test Command | Framework / Runner |
| :--- | :--- | :--- |
| **`03-elysia-bun`** | `bun test` | Bun Test Runner (`bun:test`) |
| **`04-go-api`** | `go test -v ./...` | Go standard `testing` + `net/http/httptest` |
| **`05-python-api`** | `pytest -v` | Pytest + Starlette `TestClient` |
| **`06-rust-api`** | `cargo test` | Rust built-in test harness + `tower::ServiceExt` |

