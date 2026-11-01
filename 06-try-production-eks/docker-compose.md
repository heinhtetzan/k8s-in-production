# 💻 Local Development Quickstart (Docker Compose)

Provisions the complete local development environment for the `kendrick-shop` full-stack application using `docker-compose.yaml`. This setup orchestrates the PostgreSQL database, Bun + Hono API backend, and the TanStack Start frontend applications with live code hot-reloading.

---

## 🚀 Quickstart

### 1. Start Full Stack Locally
Ensure Docker is running on your machine, then run:

```bash
# 1. Copy environment template if not present
cp .env.example .env

# 2. Build and spin up PostgreSQL, API backend, Shop storefront, and Admin dashboard
docker compose up --build
```

### 2. Seed Initial Data & Products
Once the API container is healthy and responding, run:

```bash
# Populates 10 brands, 6 categories, 30 products with real S3 images, inventory stocks, and admin user
curl -X POST http://localhost:9000/seed
```

---

## 🌐 Local Service Endpoints

| Service | Local URL | Description / Default Credentials |
| :--- | :--- | :--- |
| **Shop Storefront** | [http://localhost:9001](http://localhost:9001) | Customer-facing storefront with Vite HMR |
| **Shop Admin Dashboard** | [http://localhost:9002](http://localhost:9002) | Admin: `shop@kendrickdev.shop` / `admin123` |
| **API Health Check** | [http://localhost:9000/health](http://localhost:9000/health) | Backend health check endpoint |
| **Interactive Swagger Docs** | [http://localhost:9000/docs](http://localhost:9000/docs) | Interactive OpenAPI / Swagger UI |
| **PostgreSQL Database** | `localhost:5432` | `shop` / `shop` / `asdffdsa` (or as configured in `.env`) |

---

## 🧪 Automated Tests & Typechecks

Run test suites and typechecks locally using Bun:

```bash
# Run backend unit & integration tests
cd services/api-app && bun test && bun x tsc --noEmit && cd ../..

# Verify frontend production builds
cd services/shop-app && bun run build && cd ../..
cd services/shop-dashboard && bun run build && cd ../..
```

---

## 💾 Backup Database & S3 Media (From Your Computer)

Run single-command backups anytime from your terminal:

```bash
# 1. Full Backup (PostgreSQL Database + S3 Media Bucket)
bun run backup

# 2. Database only (streams clean .sql file to backups/)
bun run backup:db

# 3. S3 Media only (syncs product images & brand assets to backups/s3_media_<timestamp>/)
bun run backup:s3
```

*See [doc/06-backup.md](./doc/06-backup.md) for full disaster recovery, AWS CLI snapshots, and restore procedures.*

---

## 🛠️ Docker Compose Common Commands

```bash
# Start containers in background (detached mode)
docker compose up -d

# Stream real-time logs across all services
docker compose logs -f

# Stream logs for a specific service (api, shop, dashboard, postgres)
docker compose logs -f api

# Stop all containers (preserves database data volume)
docker compose down

# Stop containers and wipe the database volume (clean reset)
docker compose down -v

# Rebuild images after updating Dockerfiles or dependencies
docker compose build --no-cache
```

---

## ⚠️ Troubleshooting

### `EXDEV: cross-device link not permitted, rename '/app/.tanstack/tmp/...' -> '/app/src/routeTree.gen.ts'`
- **Cause**: In Docker Compose, mounting `/app/.tanstack` as an anonymous volume mounts a distinct filesystem from `/app`. The TanStack Router route generator cannot atomically rename temporary files across different filesystem mount points.
- **Fix**: Keep `.tanstack` directly within the bind-mounted `/app` workspace without a separate volume in `docker-compose.yaml` (it is already ignored via `.gitignore`).

