# AWS EKS Kubernetes Manifests & HPA Architecture

This directory contains the modularized production Kubernetes manifests for running the `kendrick-shop` stack on Amazon EKS.

---

## 📁 Directory Structure & Execution Order

| File | Type | Description | External Endpoint |
| :--- | :--- | :--- | :--- |
| [`00-configmap.yaml`](./00-configmap.yaml) | `ConfigMap` | Centralized non-sensitive settings (Ports, URLs, flags) | *Internal Only* |
| [`00-postgres-secret.yaml`](./00-postgres-secret.yaml) | `Secret` | Template & instructions for AWS RDS credentials | *Internal Only* |
| [`01-api-app.yaml`](./01-api-app.yaml) | `Deployment`, `Service` | Bun + Hono API Backend & Swagger Docs | `https://api.kendrickdev.shop` |
| [`02-shop-app.yaml`](./02-shop-app.yaml) | `Deployment`, `Service` | TanStack Start Customer Storefront | `https://kendrickdev.shop` |
| [`03-shop-dashboard.yaml`](./03-shop-dashboard.yaml) | `Deployment`, `Service` | TanStack Start Admin Dashboard | `https://dashboard.kendrickdev.shop` |
| [`04-hpa.yaml`](./04-hpa.yaml) | `HorizontalPodAutoscaler` | Automatic scaling based on CPU & Memory usage | *Kubernetes Control Plane* |
| [`05-ingress.yaml`](./05-ingress.yaml) | `Ingress` | Single AWS ALB ($20/mo) routing all 3 domains with SSL | `https://*.kendrickdev.shop` |
| [`cluster-autoscaler.yaml`](./cluster-autoscaler.yaml) | `Deployment`, `RBAC` | Automatic EC2 node auto-scaler controller (2–6 nodes) | *Kubernetes Control Plane* |
| [`kustomization.yaml`](./kustomization.yaml) | `Kustomization` | Bundles all resources for `kubectl apply -k` | N/A |

---

## 🏛️ EKS Production Architecture & Configuration Diagram

This diagram visualizes the complete end-to-end production Kubernetes architecture on Amazon EKS, including single AWS Application Load Balancer (ALB) ingress routing, ACM wildcard SSL termination, multi-tier autoscaling, configuration management, and managed AWS backing services:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff'}}}%%
flowchart TD
    subgraph Clients["Internet Users & Route 53 DNS"]
        U_Store["Storefront Users\nhttps://kendrickdev.shop\nhttps://www.kendrickdev.shop"]
        U_Dash["Store Managers\nhttps://dashboard.kendrickdev.shop"]
        U_API["API Clients & Mobile\nhttps://api.kendrickdev.shop"]
        R53["AWS Route 53 (DNS)"]
    end

    subgraph AWS_Ingress["AWS Edge & Ingress Layer"]
        ALB["AWS Application Load Balancer (ALB)\nManaged by AWS Load Balancer Controller\nHTTP 80 -> HTTPS 443 Automatic Redirect"]
        ACM["AWS Certificate Manager (ACM)\nWildcard SSL: *.kendrickdev.shop"]
        ACM -.->|"TLS Termination (Port 443)"| ALB
    end

    subgraph Cluster["Amazon EKS Cluster (VPC Private Subnets)"]
        subgraph IngressRules["Ingress Host Routing (05-ingress.yaml)"]
            Rule_Store["Host: kendrickdev.shop\nPath: / -> shop-app-service:3000"]
            Rule_Dash["Host: dashboard.kendrickdev.shop\nPath: / -> shop-dashboard-service:9002"]
            Rule_API["Host: api.kendrickdev.shop\nPath: / -> api-app-service:8000"]
        end

        subgraph Services["Kubernetes Services Layer"]
            Svc_Shop["shop-app-service\nTargetPort: 3000"]
            Svc_Dash["shop-dashboard-service\nTargetPort: 9002"]
            Svc_API["api-app-service\nTargetPort: 8000"]
        end

        subgraph Deployments["Application Deployments (Auto-Scaled Workloads)"]
            Pod_Shop["shop-app (Min: 2, Max: 5 Replicas)\nTanStack Start Storefront\nImage: ECR / kendrick-shop-app:latest"]
            Pod_Dash["shop-dashboard (Min: 1, Max: 3 Replicas)\nTanStack Start Admin UI\nImage: ECR / kendrick-shop-dashboard:latest"]
            Pod_API["api-app (Min: 2, Max: 6 Replicas)\nBun + Hono Backend API\nImage: ECR / kendrick-shop-api:latest"]
        end

        subgraph Autoscaling["Telemetry & Autoscaling Plane"]
            MS["Kubernetes Metrics Server\nCollects CPU & Memory Telemetry"]
            HPA["Horizontal Pod Autoscaler (04-hpa.yaml)\nThresholds: CPU > 70% | Memory > 80%"]
            CA["Cluster Autoscaler (cluster-autoscaler.yaml)\nWatches Pending Pod Scheduling"]
        end

        subgraph ClusterConfig["Configuration & Secrets"]
            CM["ConfigMap: shop-config\nAPI_PORT=8000 | SHOP_PORT=3000 | DASHBOARD_PORT=9002\nINTERNAL_API_URL=http://api-app-service:8000\nDB_SSL=true | NODE_ENV=production"]
            Sec["Secret: postgres-secret\nAWS RDS Credentials & DATABASE_URL\n(sslmode=require)"]
        end
    end

    subgraph AWS_Managed["External Managed AWS Cloud Services"]
        RDS[("AWS RDS PostgreSQL 16\nManaged Multi-AZ Database")]
        ECR["AWS Elastic Container Registry (ECR)\nContainer Images Repository"]
        ASG["AWS EC2 Auto Scaling Group\nWorker Nodes (Min: 1, Max: 5)"]
        CW["AWS CloudWatch\nControl Plane Logs & Metrics"]
    end

    %% Client Traffic
    U_Store & U_Dash & U_API --> R53 --> ALB
    ALB --> Rule_Store & Rule_Dash & Rule_API

    Rule_Store --> Svc_Shop --> Pod_Shop
    Rule_Dash --> Svc_Dash --> Pod_Dash
    Rule_API --> Svc_API --> Pod_API

    %% Internal Communication
    Pod_Shop -.->|"SSR / Internal API (CoreDNS)"| Svc_API
    Pod_Dash -.->|"Internal API (CoreDNS)"| Svc_API

    %% Database Connection
    Pod_API ==>|"Encrypted TLS (Port 5432)"| RDS

    %% Image Pulls
    ECR -.->|"Pull on Rollout"| Deployments

    %% Config Injection
    CM -.->|"Inject Config & Ports"| Deployments
    Sec -.->|"Inject DATABASE_URL"| Pod_API

    %% Autoscaling Feedback Loops
    Deployments -.->|"Pod CPU & RAM"| MS
    MS --> HPA
    HPA -.->|"Scale Pod Replicas"| Deployments
    CA -.->|"Scale EC2 Instances"| ASG

    %% CloudWatch Logs
    Cluster -.->|"API Server, Audit & Scheduler Logs"| CW

    classDef clientNode fill:#0f172a,stroke:#64748b,stroke-width:2px,color:#ffffff;
    classDef albNode fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    classDef svcNode fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    classDef podNode fill:#1e293b,stroke:#818cf8,stroke-width:2px,color:#ffffff;
    classDef scaleNode fill:#1e293b,stroke:#22c55e,stroke-width:2px,color:#ffffff;
    classDef awsNode fill:#1e293b,stroke:#ec4899,stroke-width:2px,color:#ffffff;
    classDef cfgNode fill:#1e293b,stroke:#eab308,stroke-width:2px,color:#ffffff;

    class U_Store,U_Dash,U_API,R53 clientNode;
    class ALB,ACM,Rule_Store,Rule_Dash,Rule_API albNode;
    class Svc_Shop,Svc_Dash,Svc_API svcNode;
    class Pod_Shop,Pod_Dash,Pod_API podNode;
    class MS,HPA,CA scaleNode;
    class RDS,ECR,ASG,CW awsNode;
    class CM,Sec cfgNode;
```

### 💡 Production Configuration Breakdown (vs Local):
- **Single AWS ALB Ingress:** Replaces multiple costly Classic Load Balancers with a single AWS Application Load Balancer via [`05-ingress.yaml`](./05-ingress.yaml), reducing AWS infrastructure costs by ~66% (~$20/mo vs ~$60/mo).
- **Wildcard SSL & HTTP-to-HTTPS:** Terminates `*.kendrickdev.shop` certificates at the ALB via AWS ACM and automatically redirects port 80 (HTTP) to port 443 (HTTPS).
- **Two-Tier Autoscaling:**
  - **Horizontal Pod Autoscaler (HPA):** Scales pod replicas across all 3 services based on real-time CPU (70%) and Memory (80%) metrics collected by Kubernetes Metrics Server.
  - **Cluster Autoscaler:** Automatically provisions additional EC2 worker nodes (1–5 nodes) in the AWS Auto Scaling Group when pending pods cannot be scheduled.
- **Enterprise Persistence & Security:** Directs database traffic to managed AWS RDS PostgreSQL with enforced SSL encryption (`DB_SSL="true"`, `sslmode=require`).
- **Zero-Downtime Rolling Updates:** Configured with `RollingUpdate` strategy (`maxSurge: 1`, `maxUnavailable: 0`) and a 5-second `preStop` sleep hook to allow AWS ALB target groups to deregister draining pods before traffic interruption.

---

## 🚀 Quick Deployment Guide

### Step 1: Ensure AWS RDS Secret Exists
```bash
DATABASE_URL=$(pulumi stack output databaseUrl --show-secrets)

kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_DB=shop \
  --from-literal=POSTGRES_USER=shop \
  --from-literal=POSTGRES_PASSWORD="asdffdsa" \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Step 2: Install Kubernetes Metrics Server (Required for HPA)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify that metrics server is collecting CPU & RAM:
kubectl top nodes
kubectl top pods
```

### Step 3: Deploy All Workloads with Kustomize
```bash
# Option A: Deploy all at once with Kustomize
kubectl apply -k k8s/eks

# Option B: Deploy by directory
kubectl apply -f k8s/eks/

# Option C: Deploy or update an individual service
kubectl apply -f k8s/eks/01-api-app.yaml
```

---

## 📈 How Horizontal Pod Autoscaler (HPA) Works

Each HPA in [`04-hpa.yaml`](./04-hpa.yaml) observes pod metrics via the Kubernetes Metrics API:

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff'}}}%%
graph LR
    Pods["Running Pods"] -->|"CPU / RAM Usage"| MS["Metrics Server"]
    MS -->|"Metrics API"| HPA["Horizontal Pod Autoscaler"]
    HPA -->|"Scale Target: 2 - 5 Replicas"| Deploy["Deployment api-app / shop-app"]

    classDef darkNode fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    classDef scaleNode fill:#1e293b,stroke:#22c55e,stroke-width:2px,color:#ffffff;
    class Pods,Deploy darkNode;
    class MS,HPA scaleNode;
```

### Scaling Rules & Thresholds:
- **`api-app-hpa`:** Min 2, Max 6 pods (Scales when CPU > 70% or Memory > 80%)
- **`shop-app-hpa`:** Min 2, Max 5 pods (Scales when CPU > 70% or Memory > 80%)
- **`shop-dashboard-hpa`:** Min 1, Max 3 pods (Scales when CPU > 70% or Memory > 80%)
- **Scale-Down Cool-Down:** 300 seconds (5 minutes) stabilization window to prevent rapid flapping.

### Verify Autoscalers:
```bash
# View active HPA status and current % targets across all 3 apps:
kubectl get hpa

# Detailed scaling events and triggers:
kubectl describe hpa api-app-hpa
kubectl describe hpa shop-app-hpa
kubectl describe hpa shop-dashboard-hpa
```

### Testing Autoscaling Under Load (Optional):
```bash
# Run a temporary pod generating load against the API
kubectl run load-test --rm -i --tty --image=busybox --restart=Never -- \
  /bin/sh -c "while true; do wget -q -O- http://api-app-service:8000/health; done"

# In a separate terminal, watch HPA react and scale out pods:
kubectl get hpa -w
```

---

## 📊 Observability: Prometheus Metrics & AWS CloudWatch

### 1. Prometheus Application Metrics (`/metrics`)
The backend API exposes real-time application telemetry in standard Prometheus exposition format:

- **Endpoint:** `GET /metrics` (Exposed on `api-app` port 8000)
- **Scrape Annotations:** Pod template in `01-api-app.yaml` includes:
  ```yaml
  prometheus.io/scrape: "true"
  prometheus.io/port: "8000"
  prometheus.io/path: "/metrics"
  ```
- **Tracked Metrics:**
  - `http_requests_total{method, route, status}` (Counter of all processed requests)
  - `http_request_duration_seconds_sum` & `_count` (Summary of request latency in seconds)
  - `process_uptime_seconds` (Pod uptime gauge)
  - `process_resident_memory_bytes` & `nodejs_heap_size_used_bytes` (Memory usage gauges)

#### Test Metrics Locally:
```bash
curl http://localhost:9000/metrics
# Or over cluster service:
kubectl exec -it $(kubectl get pod -l app=api-app -o jsonpath='{.items[0].metadata.name}') -- \
  wget -qO- http://localhost:8000/metrics
```

---

### 2. AWS CloudWatch Centralized Logging
Configured declaratively in Pulumi [`index.ts`](../../index.ts) via `enabledClusterLogTypes`:

- **Active Log Streams:**
  - `api`: All Kubernetes API server REST calls.
  - `audit`: Full audit trail of user and service account actions.
  - `authenticator`: EKS IAM authentication events (logins, access entry validations).
  - `controllerManager`: Deployment rollouts, replica checks, pod scheduling.
  - `scheduler`: Node placement decisions for pods.
- **Where to view in AWS Console:**  
  Navigate to **CloudWatch** $\rightarrow$ **Logs** $\rightarrow$ **Log groups** $\rightarrow$ `/aws/eks/shop-eks-cluster/cluster`.
