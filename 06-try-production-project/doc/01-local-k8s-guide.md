# Local Kubernetes Development Guide: Docker Desktop vs. AWS EKS

> **Target Platform:** Docker Desktop Kubernetes (Local Mac) vs. Amazon EKS (Cloud Production)  
> **Cost Comparison:** **$0.00 / month (Local)** vs. **~$70–$140 / month (AWS EKS + RDS + ELB)**  
> **Related Manifests:** [`k8s/local/`](../k8s/local/) (Local Single-Node) & [`k8s/eks/`](../k8s/eks/) (Cloud Multi-Node)

---

## 1. Why Test Kubernetes Locally?

Developing directly on AWS EKS costs real money and slows down development loops (waiting for image pushes to ECR, DNS propagation, and CloudFormation/Pulumi runs).

Testing on local Kubernetes gives you:
- **Instant Iteration:** Build images locally with `docker build` and test them immediately without pushing to AWS ECR.
- **Zero Cloud Costs ($0):** Practice deployments, rollouts, service discovery, and pod networking completely offline.
- **Safe Sandbox:** Make mistakes, break configs, test migrations, and restart clusters without affecting production or risking AWS bills.

---

## 2. Cluster Context Switching Cheatsheet

Your machine already has both Kubernetes clusters configured. Use `kubectl config` to switch between them instantly:

### View Available Clusters
```bash
kubectl config get-contexts
```
*Output will display:*
```text
CURRENT   NAME                                                               CLUSTER
*         arn:aws:eks:ap-southeast-2:542601847638:cluster/shop-eks-cluster   ...
          docker-desktop                                                     docker-desktop
```

### Switch to Free Local Kubernetes (Docker Desktop)
```bash
kubectl config use-context docker-desktop
```

### Switch Back to AWS EKS (Cloud Production)
```bash
kubectl config use-context arn:aws:eks:ap-southeast-2:542601847638:cluster/shop-eks-cluster
```

### Check Which Cluster You Are Currently Operating
```bash
kubectl config current-context
```

---

## 3. Architecture Comparison: Local vs. Cloud

| Category | Local Kubernetes (`docker-desktop`) | AWS EKS (`shop-eks-cluster`) |
| :--- | :--- | :--- |
| **Compute Nodes** | 1 single virtual node running on your Mac | 2–6 EC2 instances (`t3.small` / `t3.large`) across multiple AZs |
| **Database** | PostgreSQL container pod inside the cluster (`postgres-service:5432`) | AWS RDS PostgreSQL 16 multi-AZ managed instance with private VPC peering |
| **External Access** | `type: LoadBalancer` maps directly to `localhost` ports (`8000`, `3000`, `9002`) | AWS Application Load Balancer (ALB) via Ingress + Route 53 Custom Domains |
| **SSL / HTTPS** | Plain HTTP (`http://localhost:...`) for speed and simplicity | AWS Certificate Manager (ACM) Wildcard TLS (`https://*.kendrickdev.shop`) |
| **Docker Images** | Local image daemon (`api-app:latest`, `imagePullPolicy: IfNotPresent`) | Amazon ECR private repository (`542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/...`) |
| **DNS Resolution** | CoreDNS resolves internal `.svc.cluster.local` names | CoreDNS + AWS Route 53 Hosted Zone |
| **Auto-Scaling** | Fixed replica counts (single node hardware limit) | Horizontal Pod Autoscaler (HPA) + Cluster Autoscaler (Auto Scaling Group) |

---

## 4. Complete Step-by-Step Local Deployment Walkthrough

### Step 1: Ensure Docker Desktop Kubernetes is Running
1. Open **Docker Desktop** on macOS.
2. Go to **Settings** $\rightarrow$ **Kubernetes** $\rightarrow$ Ensure **"Enable Kubernetes"** is checked.
3. Switch your terminal context:
   ```bash
   kubectl config use-context docker-desktop
   kubectl get nodes
   ```
   *(Node `docker-desktop` should report status `Ready`)*

---

### Step 2: Build Application Docker Images Locally
Because you are running locally, you do **not** need to tag images with the AWS ECR registry or push over the internet:

```bash
# 1. Backend API (Hono + Bun)
docker build -t api-app:v2 ./api-app

# 2. Customer Storefront (TanStack Start / React)
docker build -t shop-app:v2 ./shop-app

# 3. Admin Dashboard (TanStack Start / React)
docker build -t shop-dashboard:v1 ./shop-dashboard
```

---

### Step 3: Create Local Database Secret
In local mode, the backend connects to the PostgreSQL pod inside Kubernetes at `postgres-service:5432`:

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_DB=shop \
  --from-literal=POSTGRES_USER=shop \
  --from-literal=POSTGRES_PASSWORD=password123 \
  --from-literal=DATABASE_URL="postgres://shop:password123@postgres-service:5432/shop" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

### Step 4: Deploy Workloads Using Kustomize
Apply the local deployment manifests:

```bash
kubectl apply -k k8s/local
```

Verify that all pods reach `1/1 Running`:
```bash
kubectl get pods -w
```
*Expected Output:*
```text
NAME                               READY   STATUS    RESTARTS   AGE
postgres-5c4c59ff85-q2k5w          1/1     Running   0          45s
api-app-6c99bd85f6-x7plm           1/1     Running   0          30s
shop-app-7b8979fcbd-9z8vk          1/1     Running   0          25s
shop-dashboard-8c76ad12ef-3b1ca    1/1     Running   0          20s
```

---

### Step 5: Seed Data & Test Local Endpoints
Docker Desktop automatically binds `type: LoadBalancer` services to your Mac's `localhost`:

```bash
# Seed initial brands, categories, products, and admin user
curl -X POST http://localhost:8000/seed
```

Open endpoints in your browser:
- **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Prometheus Metrics:** [http://localhost:8000/metrics](http://localhost:8000/metrics)
- **Storefront Web App:** [http://localhost:3000](http://localhost:3000)

---

## 5. Essential Local Debugging Techniques

### 1. View Live Streaming Container Logs
```bash
# Follow logs for the API backend
kubectl logs -f deployment/api-app

# Follow logs for the Storefront
kubectl logs -f deployment/shop-app
```

### 2. Connect Directly to the In-Cluster PostgreSQL Database
```bash
# Open interactive psql shell inside the running PostgreSQL pod
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U shop -d shop
```
*Inside psql:*
```sql
\dt              -- List all Drizzle ORM tables
SELECT count(*) FROM products;
\q               -- Exit
```

### 3. Quick Port-Forwarding (Bypass Services)
If a service is having trouble with external port binding, port-forward directly to a pod:
```bash
# Forward local port 8080 directly to API container port 8000
kubectl port-forward deployment/api-app 8080:8000
```

### 4. Interactive Shell into a Container
```bash
kubectl exec -it deployment/api-app -- /bin/sh
```

---

## 6. Clean Up Local Resources

When you are done testing, delete all local pods and services in one command:

```bash
kubectl delete -k k8s/local
```
*(Your Mac's RAM and CPU are instantly freed, with zero cloud bills).*

---

## 7. Modular Local Architecture ([`k8s/local/`](../k8s/local/))

The repository organizes local Kubernetes workloads under [`k8s/local/`](../k8s/local/) to mirror the production structure of [`k8s/eks/`](../k8s/eks/). You can deploy all local components with a single command: `kubectl apply -k k8s/local`.

### 1. Directory Structure
```text
k8s/local/
├── 00-configmap.yaml         # Centralized ports & local config (DB_SSL=false)
├── 00-postgres.yaml          # In-cluster PostgreSQL database Secret, Deployment & Service
├── 01-api-app.yaml           # API backend with localhost:8000 port binding
├── 02-shop-app.yaml          # Storefront with localhost:3000 port binding
├── 03-shop-dashboard.yaml    # Admin dashboard with localhost:9002 port binding
├── kustomization.yaml        # Local Kustomize bundle
└── README.md                 # Quickstart guide & local test commands
```

### 2. Sample Manifests

#### `k8s/local/00-postgres.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: postgres-secret
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  type: ClusterIP
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

#### `k8s/local/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - 00-postgres.yaml
  - 01-api-app.yaml
  - 02-shop-app.yaml
  - 03-shop-dashboard.yaml

generatorOptions:
  disableNameSuffixHash: true

# Injects local development labels across all resources
commonLabels:
  environment: local
```

### 3. Production Kustomize Pattern (Base & Overlays)
For enterprise multi-environment setups, teams use Kustomize overlays instead of duplicate manifests:
```text
k8s/
├── base/                   # Shared manifests (Deployments, Services, Ports)
│   ├── api-app.yaml
│   ├── shop-app.yaml
│   └── kustomization.yaml
└── overlays/
    ├── local/              # Adds postgres pod, removes ALB ingress, sets replicas=1
    │   ├── kustomization.yaml
    │   └── postgres.yaml
    └── eks/                # Adds ALB ingress, HPA, Cluster Autoscaler, RDS secrets
        ├── kustomization.yaml
        ├── hpa.yaml
        └── ingress.yaml
```
With this pattern:
- Local deployment: `kubectl apply -k k8s/overlays/local`
- AWS EKS deployment: `kubectl apply -k k8s/overlays/eks`

