# 🦊 Task API (ElysiaJS + Bun + MySQL)

A lightweight, modern REST API built specifically for learning Kubernetes in [`05-learn-k8s`](../README.md) and bridging directly into the capstone e-commerce stack in [`06-try-production-eks`](../../06-try-production-eks/).

---

## 🚀 Key Features
- **Framework**: [ElysiaJS](https://elysiajs.com/) on [Bun](https://bun.sh/) (ultra-fast startup $<10\text{ms}$).
- **Database**: MySQL 8.0 via `mysql2/promise` with automatic schema creation and in-memory fallback.
- **Kubernetes Native**: Returns the current Pod hostname (`process.env.HOSTNAME`) in every response, making it easy to observe **round-robin load balancing** and **autoscaling** across multiple replicas.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root welcome message and current Pod hostname |
| `GET` | `/info` | Pod status, uptime, and MySQL connection health |
| `GET` | `/health` | Health probe endpoint for Kubernetes Liveness & Readiness checks |
| `GET` | `/tasks` | List all tasks/todos (from MySQL or fallback) |
| `POST` | `/tasks` | Create a new task (`{ "title": "...", "description": "..." }`) |
| `GET` | `/tasks/:id` | Fetch task by ID |
| `PATCH` | `/tasks/:id/toggle` | Toggle task completion status (`completed = !completed`) |

---

## 💻 Local Development

```bash
# Install dependencies
bun install

# Run in development mode (hot-reload)
bun run dev

# Run with environment variables connecting to MySQL
DB_HOST=127.0.0.1 DB_USER=root DB_PASSWORD=secret DB_NAME=taskdb bun run dev
```

---

## 🐳 Docker Build

```bash
# Build Docker image
docker build -t task-api:1.0.0 .

# Test run locally
docker run -p 3000:3000 --rm task-api:1.0.0
```

---

## ☸️ Load into Kind Kubernetes Cluster

```bash
# Load directly into Kind node containerd cache
kind load docker-image task-api:1.0.0 --name k8s-local
```
