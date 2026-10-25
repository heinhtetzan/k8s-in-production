# Docker Practice Projects

This directory contains **5 complete, runnable projects** with production-ready `Dockerfile` configurations:

```text
projects/
├── 01-html-static/        # Frontend: 5-page static website (NGINX Alpine)
├── 02-tanstack-react/     # Frontend: 5-page React SPA (Vite + Node build + NGINX serve)
├── 03-elysia-bun/         # Backend: REST API sample with mock JSON (Bun + Elysia)
├── 04-go-api/             # Backend: REST API sample with mock JSON (Go multi-stage ~15MB)
└── 05-python-api/         # Backend: REST API sample with mock JSON (FastAPI + Uvicorn)
```

---

## 1. `01-html-static` (Frontend - 5 Pages)
A lightweight static site with 5 pages:
* Home (`index.html`)
* About (`about.html`)
* Services (`services.html`)
* Pricing (`pricing.html`)
* Contact (`contact.html`)

### Build & Run:
```bash
cd 01-html-static
docker build -t my-html-app:1.0 .
docker run -d -p 8080:80 --name html-app my-html-app:1.0
```
* **Test**: Open `http://localhost:8080` in your browser.

---

## 2. `02-tanstack-react` (Frontend - 5 Pages SPA)
A modern React Single Page Application with 5 interactive views:
* Home, Features, Solutions, Pricing, Contact.
* Multi-stage build compiles with Node 20 and serves via NGINX Alpine (~25MB).

### Build & Run:
```bash
cd 02-tanstack-react
docker build -t my-react-app:1.0 .
docker run -d -p 3000:80 --name react-app my-react-app:1.0
```
* **Test**: Open `http://localhost:3000` in your browser.

---

## 3. `03-elysia-bun` (Backend - REST API)
High-performance REST API built with Bun and ElysiaJS.
* Endpoints:
  * `GET /` -> Service info JSON
  * `GET /api/health` -> Health check JSON
  * `GET /api/users` -> Sample user objects
  * `GET /api/products` -> Sample product objects
  * `GET /api/metrics` -> Memory and connection stats

### Build & Run:
```bash
cd 03-elysia-bun
docker build -t my-elysia-api:1.0 .
docker run -d -p 3001:3000 --name elysia-api my-elysia-api:1.0
```
* **Test**: `curl http://localhost:3001/api/users`

---

## 4. `04-go-api` (Backend - REST API)
Ultra-fast, zero-dependency Go REST API using multi-stage compilation.
* Endpoints:
  * `GET /` -> Service metadata JSON
  * `GET /api/health` -> Goroutines & CPU stats JSON
  * `GET /api/users` -> Sample user list
  * `GET /api/products` -> Sample cloud products
  * `GET /api/metrics` -> GC and memory alloc stats

### Build & Run:
```bash
cd 04-go-api
docker build -t my-go-api:1.0 .
docker run -d -p 8081:8080 --name go-api my-go-api:1.0
```
* **Test**: `curl http://localhost:8081/api/health`

---

## 5. `05-python-api` (Backend - REST API)
Production-style FastAPI REST API with unbuffered logs and a non-root user.
* Endpoints:
  * `GET /` -> FastAPI welcome JSON
  * `GET /api/health` -> Probes check JSON
  * `GET /api/users` -> Sample user records
  * `GET /api/products` -> Sample product catalog
  * `GET /api/orders` -> Sample order transactions
  * `GET /docs` -> Interactive Swagger UI!

### Build & Run:
```bash
cd 05-python-api
docker build -t my-python-api:1.0 .
docker run -d -p 8000:8000 --name python-api my-python-api:1.0
```
* **Test**: `curl http://localhost:8000/api/users` or open `http://localhost:8000/docs`
