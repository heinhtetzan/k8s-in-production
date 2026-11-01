# Local Kubernetes Manifests (k8s/local/)

Modularized Kubernetes manifests designed for local development on **Docker Desktop Kubernetes**, **Minikube**, or **Kind**.

---

## 📁 Directory Structure & Execution Order

| File | Resource Kind | Purpose | Local Endpoint |
| :--- | :--- | :--- | :--- |
| [`00-configmap.yaml`](./00-configmap.yaml) | `ConfigMap` | Non-sensitive settings (Ports 8000/3000/9002, `DB_SSL=false`) | *Internal DNS* |
| [`00-postgres.yaml`](./00-postgres.yaml) | `Secret`, `Deployment`, `Service` | In-cluster PostgreSQL 16 database | `localhost:5432` |
| [`01-api-app.yaml`](./01-api-app.yaml) | `Deployment`, `Service` | Bun + Hono REST API & Swagger UI | [http://localhost:8000](http://localhost:8000) |
| [`02-shop-app.yaml`](./02-shop-app.yaml) | `Deployment`, `Service` | Customer Storefront (TanStack Start) | [http://localhost:3000](http://localhost:3000) |
| [`03-shop-dashboard.yaml`](./03-shop-dashboard.yaml) | `Deployment`, `Service` | Admin Dashboard (TanStack Start) | [http://localhost:9002](http://localhost:9002) |
| [`kustomization.yaml`](./kustomization.yaml) | `Kustomization` | Bundles all local manifests for single-command deployment | N/A |

---

## 🏛️ Local Architecture & Configuration Diagram

The diagram below illustrates the local Kubernetes configuration, pod networking, configuration injection, and service exposure:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff'}}}%%
flowchart TD
    subgraph Host["Developer Host Machine (macOS / Localhost)"]
        Browser["Local Web Browser / Developer"]
        EP_Store["localhost:3000\nCustomer Storefront"]
        EP_Dash["localhost:9002\nAdmin Dashboard"]
        EP_API["localhost:8000\nREST API & Swagger UI"]
    end

    subgraph Cluster["Local Kubernetes Cluster (Docker Desktop / Kind / Minikube)"]
        subgraph Services["Kubernetes Services Layer"]
            Svc_Shop["shop-app-service\nType: LoadBalancer\nPort: 3000"]
            Svc_Dash["shop-dashboard-service\nType: LoadBalancer\nPort: 9002"]
            Svc_API["api-app-service\nType: LoadBalancer\nPort: 8000"]
            Svc_DB["postgres-service\nType: ClusterIP\nPort: 5432"]
        end

        subgraph Workloads["Workloads Layer (Deployments & Pods)"]
            Pod_Shop["Deployment: shop-app (1 Replica)\nImage: kendrick-shop-app:latest\nFramework: TanStack Start (Port 3000)"]
            Pod_Dash["Deployment: shop-dashboard (1 Replica)\nImage: kendrick-shop-dashboard:latest\nFramework: TanStack Start (Port 9002)"]
            Pod_API["Deployment: api-app (1 Replica)\nImage: kendrick-shop-api:latest\nFramework: Bun + Hono (Port 8000)"]
            Pod_DB["Deployment: postgres (1 Replica)\nImage: postgres:16-alpine\nDatabase Engine (Port 5432)"]
        end

        subgraph ConfigStorage["Configuration & Storage Layer"]
            CM["ConfigMap: shop-config\nAPI_PORT=8000 | SHOP_PORT=3000 | DASHBOARD_PORT=9002\nINTERNAL_API_URL=http://api-app-service:8000\nDB_SSL=false | NODE_ENV=development"]
            Sec["Secret: postgres-secret\nPOSTGRES_DB=shop | POSTGRES_USER=shop\nPOSTGRES_PASSWORD=password123\nDATABASE_URL=postgres://shop:...@postgres-service:5432/shop"]
            Vol[("Volume: postgres-data\nType: emptyDir\nMount: /var/lib/postgresql/data")]
        end
    end

    %% Client Routing
    Browser --> EP_Store
    Browser --> EP_Dash
    Browser --> EP_API

    EP_Store --> Svc_Shop
    EP_Dash --> Svc_Dash
    EP_API --> Svc_API

    %% Service to Pod Routing
    Svc_Shop --> Pod_Shop
    Svc_Dash --> Pod_Dash
    Svc_API --> Pod_API
    Svc_DB --> Pod_DB

    %% Internal Communication
    Pod_Shop -.->|"SSR / Internal API Calls"| Svc_API
    Pod_Dash -.->|"Internal Management APIs"| Svc_API
    Pod_API -.->|"SQL Queries (Port 5432)"| Svc_DB

    %% Config & Volume Bindings
    CM -.->|"Injects Config & Ports"| Pod_Shop
    CM -.->|"Injects Config & Ports"| Pod_Dash
    CM -.->|"Injects Config & DB_SSL=false"| Pod_API
    Sec -.->|"Injects DATABASE_URL"| Pod_API
    Sec -.->|"Injects DB Credentials"| Pod_DB
    Vol --- Pod_DB

    classDef hostNode fill:#0f172a,stroke:#64748b,stroke-width:2px,color:#ffffff;
    classDef svcNode fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    classDef podNode fill:#1e293b,stroke:#818cf8,stroke-width:2px,color:#ffffff;
    classDef cfgNode fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    classDef dbNode fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#ffffff;

    class Browser,EP_Store,EP_Dash,EP_API hostNode;
    class Svc_Shop,Svc_Dash,Svc_API,Svc_DB svcNode;
    class Pod_Shop,Pod_Dash,Pod_API podNode;
    class CM,Sec cfgNode;
    class Pod_DB,Vol dbNode;
```

### 💡 Local Configuration Breakdown:
- **Port Mapping & Ingress:** Each microservice is assigned a dedicated `LoadBalancer` service that binds directly to localhost ports: `3000` (Customer Storefront), `9002` (Admin Dashboard), and `8000` (Backend API & Swagger).
- **In-Cluster Database:** Unlike production (which uses managed AWS RDS), local development deploys an in-cluster PostgreSQL 16 instance with an ephemeral `emptyDir` volume for zero-cost, self-contained development.
- **Service Discovery & SSR:** Frontend applications (`shop-app` and `shop-dashboard`) communicate with the backend API via internal cluster DNS (`http://api-app-service:8000`), specified in [`00-configmap.yaml`](./00-configmap.yaml).
- **Environment Isolation:** Uses `DB_SSL="false"` and `NODE_ENV="development"`. Secrets are managed through [`00-postgres.yaml`](./00-postgres.yaml) with default local credentials (`shop:password123`).

---

## 🚀 Quickstart Guide

### 1. Build Local Docker Images
Before deploying, build images tagged locally (no need to push to AWS ECR):

```bash
# 1. API Backend
docker build -t kendrick-shop-api:latest ./services/api-app

# 2. Customer Storefront
docker build -t kendrick-shop-app:latest ./services/shop-app

# 3. Admin Dashboard
docker build -t kendrick-shop-dashboard:latest ./services/shop-dashboard
```

### 2. Deploy All Workloads with Kustomize
```bash
# Deploy all 4 workloads, database, and configmap together:
kubectl apply -k k8s/local

# Verify all pods reach 1/1 Running:
kubectl get pods -w
```

### 3. Seed Local In-Cluster Database
```bash
# Populates brands, categories, products, and admin credentials:
curl -X POST http://localhost:8000/seed
```

### 4. Access Local Endpoints
- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:9002](http://localhost:9002) *(Admin: `shop@kendrickdev.shop` / `admin123`)*
- **API Health:** [http://localhost:8000/health](http://localhost:8000/health)
- **Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Metrics:** [http://localhost:8000/metrics](http://localhost:8000/metrics)

> [!NOTE]
> If your local Kubernetes cluster does not automatically bind `type: LoadBalancer` to macOS `localhost`, port-forward directly to the services:
> ```bash
> kubectl port-forward svc/api-app-service 8000:8000 &
> kubectl port-forward svc/shop-app-service 3000:3000 &
> kubectl port-forward svc/shop-dashboard-service 9002:9002 &
> ```

---

## 🧹 Teardown Local Cluster Workloads

```bash
kubectl delete -k k8s/local
```
