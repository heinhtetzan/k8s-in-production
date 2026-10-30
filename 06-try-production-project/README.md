# AWS EKS & RDS Infrastructure (hello-k8s)

Provisions the complete cloud infrastructure required to run the `hello-k8s` full-stack application on AWS (Hono + Bun Backend, TanStack Start Frontend, and AWS RDS PostgreSQL 16) with Route 53 custom domain support and SSL.

---

## 🏗️ Architecture Overview

1. **Multi-AZ VPC (`10.0.0.0/16`) in `ap-southeast-2`**:
   - **Public Subnets**: Ingress / Elastic Load Balancers & NAT Gateway.
   - **Private Subnets**: EKS Worker Nodes & RDS PostgreSQL.
2. **AWS EKS Cluster (`shop-eks-cluster`)**:
   - Kubernetes 1.36 managed control plane.
   - EC2 Auto Scaling Group (`t3.small`, autoscaling 2–6 nodes).
   - CoreDNS, kube-proxy, AWS VPC CNI, and CloudWatch Observability Add-on.
   - Full CloudWatch control plane logging enabled (`api`, `audit`, `authenticator`, `controllerManager`, `scheduler`).
3. **AWS RDS PostgreSQL (`shop-postgres-db`)**:
   - Engine: PostgreSQL 16 (`db.t4g.micro`).
   - Private VPC subnet group with SSL encryption required.
   - Inbound port 5432 restricted to EKS worker node security group.
4. **Custom Domain & SSL**:
   - **AWS Route 53**: Hosted Zone for `kendrickdev.shop`.
   - **AWS Certificate Manager (ACM)**: Wildcard SSL certificate (`kendrickdev.shop`, `*.kendrickdev.shop`).
5. **Auto-Scaling & Workload Architecture (`k8s/eks/`)**:
   - **Horizontal Pod Autoscaler (HPA)**: Automatically scales application replicas (1–6 pods) based on real-time CPU & Memory utilization.
   - **Cluster Autoscaler**: Automatically provisions or terminates EC2 worker nodes (2–6 nodes) as pod workload demands change.
   - **Modular Manifests**: Numbered, decoupled manifests organized in [`k8s/eks/`](./k8s/eks/) with native Kustomize support.

---

## 💻 0. Local Development Quickstart

### Start Full Stack Locally
Ensure Docker is running, then run:
```bash
# 1. Copy environment template if not present
cp .env.example .env

# 2. Build and spin up PostgreSQL, API backend, Shop storefront, and Admin dashboard
docker compose up --build
```

### Seed Initial Data & Products
```bash
# Populates 10 brands, 6 categories, 30 products with real S3 images, inventory stocks, and admin user
curl -X POST http://localhost:9000/seed
```

### Local Service Endpoints
- **Shop Storefront**: [http://localhost:9001](http://localhost:9001)
- **Shop Admin Dashboard**: [http://localhost:9002](http://localhost:9002) *(Admin: `shop@kendrickdev.shop` / `admin123`)*
- **API Health Check**: [http://localhost:9000/health](http://localhost:9000/health)
- **Interactive Swagger Docs**: [http://localhost:9000/docs](http://localhost:9000/docs)
- **PostgreSQL Database**: `localhost:5432` (`shop` / `shop` / `shop_local_secret_2026`)

### Run Automated Tests & Typechecks
```bash
# Run backend unit & integration tests
cd api-app && bun test && bun x tsc --noEmit && cd ..

# Verify frontend builds
cd shop-app && bun run build && cd ..
cd shop-dashboard && bun run build && cd ..
```

### 💾 Backup Database & S3 Media (From Your Computer)
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

## 🚀 AWS Cloud Deployment: Complete Step-by-Step Guide

Follow these steps **in chronological order** to deploy the infrastructure, build the containers, and launch the application live on AWS.

---

### Step 1: AWS Credentials & Pulumi Configuration

1. **Verify AWS Authentication**:
   ```bash
   aws sts get-caller-identity
   ```
   *(If your session has expired, re-authenticate with `aws login` or `aws sso login`)*

2. **Configure Pulumi Stack**:
   ```bash
   # Select dev stack
   pulumi stack select dev || pulumi stack init dev

   # Set AWS Region
   pulumi config set aws:region ap-southeast-2

   # Set the RDS Master Database Password (MUST be at least 8 characters, no '@', '/', or '"')
   pulumi config set --secret dbPassword asdffdsa
   ```

---

### Step 2: Provision Cloud Infrastructure (Pulumi)

Run Pulumi to provision the VPC, Subnets, NAT Gateway, EKS Cluster, and RDS PostgreSQL:

```bash
# 1. Preview changes
pulumi preview

# 2. Deploy infrastructure (takes ~10-15 minutes on first run for EKS & RDS)
pulumi up --yes
```

3. **Register AWS Web Console in EKS Access Entries** *(Required for AWS Console Visibility)*:
   > [!NOTE]
   > AWS EKS Web Console requires your IAM Identity (e.g. SSO Role) to be registered in EKS Access Entries. If omitted, the AWS console displays **"Pods ⓧ Data unavailable"**:
   ```bash
   # Register your AWS Console SSO Role into EKS:
   aws eks create-access-entry \
     --cluster-name shop-eks-cluster \
     --principal-arn arn:aws:iam::542601847638:role/managed/AccountFullAccessRole || true

   aws eks associate-access-policy \
     --cluster-name shop-eks-cluster \
     --principal-arn arn:aws:iam::542601847638:role/managed/AccountFullAccessRole \
     --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
     --access-scope type=cluster || true
   ```

> [!NOTE]
> Once finished, save your stack outputs (cluster name, database URL, etc.):
> ```bash
> pulumi stack output
> ```

---

### Step 3: Build & Push Docker Images to AWS ECR

> [!IMPORTANT]
> **This step MUST be completed before deploying Kubernetes manifests.**
> If the images are not in ECR, EKS pods will enter `ImagePullBackOff` and your Load Balancers will return `503 Service Unavailable`.
>
> If you are on an Apple Silicon (M1/M2/M3/M4) Mac, you **must** build with `--platform linux/amd64`.

1. **Start Docker Desktop** on your machine:
   ```bash
   open -a Docker
   ```

2. **Log in Docker to your AWS ECR Registry**:
   ```bash
   aws ecr get-login-password --region ap-southeast-2 | \
     docker login --username AWS --password-stdin 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com
   ```
   > [!TIP]
   > **12-Hour Token Expiration**: AWS ECR authorization tokens are valid for **12 hours**. If a subsequent `docker push` fails with `denied: Your authorization token has expired. Reauthenticate and try again`, simply re-run this login command to refresh the token.

3. **Create ECR Repositories** *(first time only)*:
   ```bash
   aws ecr create-repository --repository-name api-app --region ap-southeast-2 || true
   aws ecr create-repository --repository-name shop-app --region ap-southeast-2 || true
   aws ecr create-repository --repository-name shop-dashboard --region ap-southeast-2 || true
   ```

4. **Build & Push All 3 Images**:
   ```bash
   # 1. API Backend (Hono + Bun)
   docker buildx build --platform linux/amd64 --target prod \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/api-app:latest \
     ./api-app --push

   # 2. Shop Frontend Storefront
   docker buildx build --platform linux/amd64 --target runner \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/shop-app:latest \
     ./shop-app --push

   # 3. Shop Admin Dashboard
   docker buildx build --platform linux/amd64 --target runner \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/shop-dashboard:latest \
     ./shop-dashboard --push
   ```

---

### Step 4: Deploy Applications to EKS

#### 📁 Kubernetes Manifests Structure (`k8s/eks/`)
All production Kubernetes resources are decoupled into modular, numbered files inside [`k8s/eks/`](./k8s/eks/):

| Manifest File | Resource Kind | Purpose & Scaling Configuration |
| :--- | :--- | :--- |
| [`00-configmap.yaml`](./k8s/eks/00-configmap.yaml) | `ConfigMap` | Centralized non-sensitive configuration (Ports, URLs, flags) |
| [`00-postgres-secret.yaml`](./k8s/eks/00-postgres-secret.yaml) | `Secret` | RDS PostgreSQL database credentials template & instructions |
| [`01-api-app.yaml`](./k8s/eks/01-api-app.yaml) | `Deployment`, `Service` | Bun + Hono API (`PORT 8000`) & ACM SSL LoadBalancer (`api.kendrickdev.shop`) |
| [`02-shop-app.yaml`](./k8s/eks/02-shop-app.yaml) | `Deployment`, `Service` | Customer Storefront (`PORT 3000`) & ACM SSL LoadBalancer (`kendrickdev.shop`) |
| [`03-shop-dashboard.yaml`](./k8s/eks/03-shop-dashboard.yaml) | `Deployment`, `Service` | Admin Dashboard (`PORT 9002`) & ACM SSL LoadBalancer (`dashboard.kendrickdev.shop`) |
| [`04-hpa.yaml`](./k8s/eks/04-hpa.yaml) | `HorizontalPodAutoscaler` | HPA auto-scaling policies for all 3 apps (`api-app`, `shop-app`, `shop-dashboard`) |
| [`05-ingress.yaml`](./k8s/eks/05-ingress.yaml) | `Ingress` | Single AWS Application Load Balancer ($20/mo) routing all 3 domains with SSL |
| [`cluster-autoscaler.yaml`](./k8s/eks/cluster-autoscaler.yaml) | `Deployment`, `RBAC` | Automatic EC2 node scaling (2–6 nodes) matching cluster workload demand |
| [`kustomization.yaml`](./k8s/eks/kustomization.yaml) | `Kustomization` | Bundles all workloads for single-command deployment |

---

1. **Connect `kubectl` to your EKS cluster**:
   ```bash
   aws eks update-kubeconfig --region ap-southeast-2 --name shop-eks-cluster
   kubectl get nodes
   ```

2. **Create the Database Secret in Kubernetes**:
   ```bash
   DATABASE_URL=$(pulumi stack output databaseUrl --show-secrets)

   kubectl create secret generic postgres-secret \
     --from-literal=POSTGRES_DB=shop \
     --from-literal=POSTGRES_USER=shop \
     --from-literal=POSTGRES_PASSWORD="asdffdsa" \
     --from-literal=DATABASE_URL="$DATABASE_URL" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Install Kubernetes Metrics Server (Prerequisite for HPA)**:
   ```bash
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

   # Verify metrics collection (wait ~30 seconds for initial collection):
   kubectl top nodes
   kubectl top pods
   ```

4. **Deploy Applications & Auto-Scalers**:
   ```bash
   # Option A: Deploy all workloads via Kustomize (Recommended):
   kubectl apply -k k8s/eks

   # Option B: Deploy individual components:
   kubectl apply -f k8s/eks/01-api-app.yaml
   kubectl apply -f k8s/eks/02-shop-app.yaml
   kubectl apply -f k8s/eks/03-shop-dashboard.yaml
   kubectl apply -f k8s/eks/04-hpa.yaml
   ```

5. **Deploy Cluster Autoscaler (Automatic EC2 Node Scaling)**:
   ```bash
   kubectl apply -f k8s/eks/cluster-autoscaler.yaml

   # Verify Cluster Autoscaler controller:
   kubectl get pods -n kube-system -l app=cluster-autoscaler
   ```

6. **Verify Workloads & Horizontal Pod Autoscalers (HPA)**:
   ```bash
   # Verify all application pods reach 1/1 Running
   kubectl get pods -w

   # Verify HPA is monitoring live CPU & Memory targets:
   kubectl get hpa
   ```
   *(Wait until all pods show `1/1 Running` and HPA displays live target % before continuing)*

---

### Step 5: Route Custom Domain via Route 53 (`kendrickdev.shop`)

1. **Verify AWS Load Balancers have hostnames assigned (~30–60 seconds)**:
   ```bash
   kubectl get svc shop-app-service api-app-service shop-dashboard-service
   ```
   *(Ensure each service displays an `EXTERNAL-IP` ending in `.elb.amazonaws.com`)*

2. **Feed Load Balancer Hostnames into Pulumi Config**:
   ```bash
   pulumi config set shopElbHost $(kubectl get svc shop-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   pulumi config set apiElbHost $(kubectl get svc api-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   pulumi config set dashboardElbHost $(kubectl get svc shop-dashboard-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   ```

3. **Apply DNS Records with Pulumi**:
   ```bash
   pulumi up --yes
   ```
   *Pulumi will automatically create and route:*
   - `kendrickdev.shop` (Apex Alias $\rightarrow$ Shop Storefront ELB)
   - `www.kendrickdev.shop` (CNAME $\rightarrow$ Shop Storefront ELB)
   - `api.kendrickdev.shop` (CNAME $\rightarrow$ API Backend ELB)
   - `dashboard.kendrickdev.shop` (CNAME $\rightarrow$ Dashboard ELB)

4. **Flush Local DNS Cache** (if DNS does not resolve immediately):
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

> [!TIP]
> **Advanced Architecture: Cost-Optimized Single ALB Ingress**  
> In enterprise environments, running 3 separate ELBs costs ~$60/mo. To consolidate into a single Application Load Balancer ($20/mo), see our dedicated guide: [`doc/04-eks-scaling-guide.md`](./doc/04-eks-scaling-guide.md) and [`k8s/eks/05-ingress.yaml`](./k8s/eks/05-ingress.yaml).

---

### Step 6: Seed the Production Database & Verify

Once pods are healthy and DNS resolves:

```bash
# Seed initial categories, brands, products, and admin credentials
curl -X POST http://api.kendrickdev.shop/seed
```
*(Or over HTTPS: `curl -k -X POST https://api.kendrickdev.shop/seed`)*

Verify endpoints:
- **API Health Check**: [http://api.kendrickdev.shop/health](http://api.kendrickdev.shop/health)
- **Interactive Swagger Docs**: [http://api.kendrickdev.shop/docs](http://api.kendrickdev.shop/docs)
- **Storefront**: [http://kendrickdev.shop](http://kendrickdev.shop)
- **Admin Dashboard**: [http://dashboard.kendrickdev.shop](http://dashboard.kendrickdev.shop)

---

### Step 7: SSL Certificate (AWS Certificate Manager)

A wildcard certificate for `kendrickdev.shop` and `*.kendrickdev.shop` is active:
- **Certificate ARN**: `arn:aws:acm:ap-southeast-2:542601847638:certificate/ca4e8033-f63c-461f-867d-96ab9cb887fc`
- **Validation**: Automatically validated via DNS in Route 53.
- Attached to all AWS Load Balancers via annotations in `k8s/eks/` manifests for full HTTPS support.

---

## 🛠️ Troubleshooting Guide

### 1. `curl: (6) Could not resolve host: api.kendrickdev.shop`
- **Cause**: DNS changes in Route 53 take 30–60 seconds to propagate, or your local machine has cached a negative DNS lookup.
- **Fix**: 
  - Flush macOS DNS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
  - Or test using the ELB IP directly: `curl -v -X POST http://api.kendrickdev.shop/seed --resolve api.kendrickdev.shop:80:<ELB_IP>`

### 2. `HTTP/1.1 503 Service Unavailable: Back-end server is at capacity`
- **Cause**: The AWS Load Balancer cannot reach any healthy container pods.
- **Fix**: Check `kubectl get pods`. If pods are in `ImagePullBackOff`, you have not pushed container images to ECR yet (see **Step 3**). Once images are pushed and pods turn to `Running`, the 503 will resolve.

### 3. `Failed to pull image ... rpc error: code = NotFound ... not found` (`ImagePullBackOff`)
- **Cause**: The Docker image tag (e.g. `api-app:latest`) does not exist in your ECR repository.
- **Fix**: Build and push the image using `docker buildx build --platform linux/amd64 ... ./api-app --push` (see **Step 3**).

### 4. `api error InvalidParameterValue: Invalid master password`
- **Cause**: Pulumi was run without setting `dbPassword`, passing an empty string to RDS.
- **Fix**: Run `pulumi config set --secret dbPassword <your-password>` where the password is at least 8 characters long, then re-run `pulumi up --yes`.

### 5. `Failed to refresh cached SSO credentials. Please refresh SSO login`
- **Cause**: Your AWS SSO / IAM Identity Center session has expired.
- **Fix**: Run `aws login` or `aws sso login` in your terminal to re-authenticate. To eliminate frequent logins, configure long-lived IAM User access keys in `~/.aws/credentials`.

### 6. `curl: (60) SSL: no alternative certificate subject name matches target host name`
- **Cause**: The certificate currently bound to the Load Balancer does not match `kendrickdev.shop`.
- **Fix**: Either call the endpoint using HTTP (`http://api.kendrickdev.shop/seed`), use `curl -k` (insecure flag), or complete the ACM SSL certificate setup in **Step 7**.

### 7. `ERROR: failed to push ... denied: Your authorization token has expired. Reauthenticate and try again.`
- **Cause**: AWS ECR login tokens automatically expire after **12 hours**. Docker cannot push layers until the auth token is refreshed.
- **Fix**: Generate and pipe a new token into Docker with:
  ```bash
  aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com
  ```

---

## 🧹 Complete Tear-Down / Destroy Order

To cleanly delete all resources without leaving dangling cloud assets:

```bash
# Step 1: Remove Kubernetes Load Balancers, Pods & HPA first (releases AWS ELBs)
kubectl delete -k k8s/eks

# Step 2: Destroy Pulumi Cloud Infrastructure (EKS, RDS, VPC, Route 53 records)
pulumi destroy --yes

# Step 3: (Optional) Delete ECR Repositories
aws ecr delete-repository --repository-name api-app --region ap-southeast-2 --force
aws ecr delete-repository --repository-name shop-app --region ap-southeast-2 --force
aws ecr delete-repository --repository-name shop-dashboard --region ap-southeast-2 --force
```

---

## 📚 Architecture & Operations Guides

For comprehensive engineering and operational deep dives, refer to our detailed documentation:

| Document | Focus & Highlights |
| :--- | :--- |
| [**00. Master Implementation Plan**](./doc/00-implementation-plan.md) | Chronological Phase 1–7 step-by-step roadmap from local docker compose to live production EKS |
| [**01. Local Kubernetes Guide**](./doc/01-local-k8s-guide.md) | Free local development using Docker Desktop Kubernetes (`k8s/local`) vs. cloud production EKS |
| [**02. EKS Cluster Overview**](./doc/02-eks-cluster-overview.md) | End-to-end architecture diagram, AWS service catalog & cost analysis, VPC topology, and workload math |
| [**03. RDS Connection Guide**](./doc/03-rds-connection-guide.md) | Private DB subnet isolation (`publiclyAccessible: false`) vs public access, `kubectl port-forward` tunnel setup |
| [**04. EKS Scaling Guide**](./doc/04-eks-scaling-guide.md) | Layer 1 node scaling via Pulumi ASG (2–6 nodes) vs. Layer 2 HPA container autoscaling (CPU/RAM thresholds) |
| [**05. CI/CD Pipeline Architecture**](./doc/05-ci-cd-architecture.md) | GitHub Actions Day 2 automated deployment, multi-platform buildx (`linux/amd64`), and zero-downtime rollouts |
| [**06. Backup & Disaster Recovery**](./doc/06-backup.md) | AWS CLI automated & manual RDS snapshots, PITR, logical `pg_dump` via K8s, and S3 versioning & cross-bucket DR sync |
| [**07. External Secrets Operator (ESO)**](./doc/07-external-secrets-operator-guide.md) | Enterprise secrets management syncing AWS Secrets Manager to native Kubernetes secrets via IRSA |