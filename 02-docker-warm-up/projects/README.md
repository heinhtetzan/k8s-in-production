# Docker Practice Projects

This directory contains **5 complete, runnable projects** with production-ready `Dockerfile` configurations:

```text
projects/
├── 01-html-static/        # Frontend: 5-page static website (NGINX Alpine)
├── 02-tanstack-react/     # Frontend: 5-page React SPA (Vite + Node build + NGINX serve)
├── 03-elysia-bun/         # Backend: REST API (Bun + Elysia)
├── 04-go-api/             # Backend: REST API (Go net/http multi-stage ~15MB)
└── 05-python-api/         # Backend: REST API (FastAPI + Uvicorn)
```

---

## 📡 Unified API Envelope Across All Projects

Every response follows the uniform structure: **`{ "message": string, "data": any }`**

| Method | Endpoint | Envelope Format | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `{"message": "...", "data": {"techstack": "...", "version": "1.0.0"}}` | Service runtime identification |
| `POST` | `/health` | `{"message": "Service is healthy", "data": {"status": "...", "uptime_seconds": ..., "memory_rss_mb": ...}}` | Health check + system resource usage |
| `GET` | `/tasks` | `{"message": "Tasks retrieved successfully", "data": [{"id": 1, "title": "...", "is_done": false, "created": "..."}]}` | Fetch tasks (stateless static data) |
| `POST` | `/tasks` | `{"message": "Task created successfully", "data": {"id": 1, "title": "...", "is_done": false, "created": "..."}}` | Create task (stateless static data) |
| `PUT` | `/tasks` | `{"message": "Task updated successfully", "data": {"id": 1, "title": "...", "is_done": false, "created": "..."}}` | Update task (stateless static data) |
| `PATCH` | `/tasks` | `{"message": "Task patched successfully", "data": {"id": 1, "title": "...", "is_done": false, "created": "..."}}` | Patch task (stateless static data) |
| `DELETE` | `/tasks` | `{"message": "Task deleted successfully", "data": {"id": 1, "title": "...", "is_done": false, "created": "..."}}` | Delete task (stateless static data) |

*(Note: `/tasts` is supported as an alias for `/tasks` across all HTTP methods).*

---

## Quick Build & Run Reference

### 1. `01-html-static` (Port 8080)
```bash
docker build -t my-html-app:1.0 ./01-html-static
docker run -d -p 8080:80 --name html-app my-html-app:1.0
```

### 2. `02-tanstack-react` (Port 3000)
```bash
docker build -t my-react-app:1.0 ./02-tanstack-react
docker run -d -p 3000:80 --name react-app my-react-app:1.0
```

### 3. `03-elysia-bun` (Port 3001)
```bash
docker build -t my-elysia-api:1.0 ./03-elysia-bun
docker run -d -p 3001:3000 --name elysia-api my-elysia-api:1.0
```

### 4. `04-go-api` (Port 8081)
```bash
docker build -t my-go-api:1.0 ./04-go-api
docker run -d -p 8081:8080 --name go-api my-go-api:1.0
```

### 5. `05-python-api` (Port 8000)
```bash
docker build -t my-python-api:1.0 ./05-python-api
docker run -d -p 8000:8000 --name python-api my-python-api:1.0
```
