# End-to-End Implementation Plan (Step-by-Step)

This document provides a complete, chronological implementation plan to take the `kendrick-shop` project from local development to a fully automated, production-grade cloud deployment on AWS EKS and RDS with CI/CD.

---

## 🗺️ Implementation Roadmap

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart TD
    Phase1["Phase 1: Local Setup & Verification<br/>(Docker Compose, Bun Tests)"] --> Phase2["Phase 2: Cloud Infrastructure Provisioning<br/>(Pulumi IaC: VPC, EKS, RDS)"]
    Phase2 --> Phase3["Phase 3: Domain & Wildcard SSL Setup<br/>(Route 53 & AWS ACM)"]
    Phase3 --> Phase4["Phase 4: Container Registry & Image Seeding<br/>(AWS ECR & Docker Buildx)"]
    Phase4 --> Phase5["Phase 5: Kubernetes Workload Deployment<br/>(AWS EKS & RDS Database Seeding)"]
    Phase5 --> Phase6["Phase 6: CI/CD Pipeline Automation<br/>(GitHub Actions & EKS Auth)"]
    Phase6 --> Phase7["Phase 7: Maintenance & Day-to-Day Workflow<br/>(Rolling Updates & Teardown Order)"]

    classDef planStyle fill:#1e293b,stroke:#22c55e,stroke-width:2px,color:#ffffff;
    class Phase1,Phase2,Phase3,Phase4,Phase5,Phase6,Phase7 planStyle;
```

---

## Phase 1: Local Development & Verification

Before deploying anything to the cloud, verify that the application code, database schema, and test suites are passing locally.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart LR
    LocalEnv[".env Configuration"] --> DockerCompose["docker compose up --build"]
    DockerCompose --> SeedLocal["curl /seed (Local DB)"]
    SeedLocal --> TestSuites["bun test & bun run build"]

    classDef darkNode fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    class LocalEnv,DockerCompose,SeedLocal,TestSuites darkNode;
```

### Steps:
1. **Prepare Environment File**:
   ```bash
   cp .env.example .env
   ```
2. **Start Local Full Stack (PostgreSQL, Backend API, Storefront, Admin Dashboard)**:
   ```bash
   docker compose up --build -d
   ```
3. **Verify Local Endpoints**:
   - Storefront: [http://localhost:9001](http://localhost:9001)
   - Admin Dashboard: [http://localhost:9002](http://localhost:9002)
   - Backend API: [http://localhost:9000/health](http://localhost:9000/health)
4. **Seed Local Database**:
   ```bash
   curl -X POST http://localhost:9000/seed
   ```
5. **Run Automated Unit Tests & Builds**:
   ```bash
   # Backend tests
   cd api-app && bun test && cd ..

   # Frontend build validations
   cd shop-app && bun run build && cd ..
   cd shop-dashboard && bun run build && cd ..
   ```

---

## Phase 2: Cloud Infrastructure Provisioning (Day 0 — Pulumi)

Provision the underlying cloud infrastructure (VPC, Subnets, NAT Gateway, EKS Cluster, and RDS PostgreSQL).

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart LR
    PulumiConfig["Configure Pulumi Stack & Secret"] --> PulumiPreview["pulumi preview"]
    PulumiPreview --> PulumiUp["pulumi up --yes"]
    PulumiUp --> Outputs["Capture Stack Outputs<br/>(VPC, EKS, RDS Endpoint)"]

    classDef purpleNode fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#ffffff;
    class PulumiConfig,PulumiPreview,PulumiUp,Outputs purpleNode;
```

### Steps:
1. **Authenticate to AWS**:
   ```bash
   aws sts get-caller-identity
   ```
   *(If expired: `aws login` or `aws sso login`)*
2. **Configure Pulumi prod Stack**:
   ```bash
   pulumi stack select prod || pulumi stack init prod
   pulumi config set aws:region ap-southeast-2
   pulumi config set --secret dbPassword asdffdsa
   ```
3. **Review & Provision Infrastructure**:
   ```bash
   pulumi preview
   pulumi up --yes
   ```
   *(First-time run takes ~10–15 minutes to create EKS Control Plane, EC2 Worker Nodes, and RDS)*
4. **Export Outputs for Kubernetes**:
   ```bash
   pulumi stack output
   pulumi stack output databaseUrl --show-secrets
   ```

---

## Phase 3: Custom Domain & Wildcard SSL Setup (Route 53 + ACM)

Set up a public wildcard SSL certificate and DNS routing for `*.kendrickdev.shop`.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart LR
    ACMRequest["Request ACM Wildcard Certificate<br/>(*.kendrickdev.shop)"] --> R53Validation["Create CNAME Record in Route 53"]
    R53Validation --> ACMStatus["Wait for Status: ISSUED"]
    ACMStatus --> UpdateK8s["Attach Certificate ARN to Load Balancers"]

    classDef cyanNode fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    class ACMRequest,R53Validation,ACMStatus,UpdateK8s cyanNode;
```

### Steps:
1. **Request Wildcard Certificate in ACM**:
   ```bash
   CERT_ARN=$(aws acm request-certificate \
     --domain-name "kendrickdev.shop" \
     --subject-alternative-names "*.kendrickdev.shop" \
     --validation-method DNS \
     --region ap-southeast-2 \
     --query CertificateArn --output text)
   ```
2. **Add Validation CNAME to Route 53**:
   Retrieve the validation record and add it to Route 53 zone `Z08860401VCN5M5J9SOP9`:
   ```bash
   aws acm describe-certificate \
     --certificate-arn "$CERT_ARN" \
     --region ap-southeast-2 \
     --query "Certificate.DomainValidationOptions"
   ```
   *(Or click "Create records in Route 53" in the AWS ACM Console)*
3. **Wait for Issuance**:
   ```bash
   aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region ap-southeast-2
   ```
4. **Update `k8s/eks/` Manifests**:
   Ensure `service.beta.kubernetes.io/aws-load-balancer-ssl-cert` in `k8s/eks/01-api-app.yaml`, `02-shop-app.yaml`, and `03-shop-dashboard.yaml` matches this Certificate ARN.

---

## Phase 4: Container Registry & Image Seeding (AWS ECR)

Build multi-architecture container images (`linux/amd64`) and push them to AWS ECR before Kubernetes pods are launched.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart LR
    DockerLogin["aws ecr get-login-password | docker login"] --> CreateRepos["Create ECR Repositories"]
    CreateRepos --> Buildx["docker buildx build (--platform linux/amd64)"]
    Buildx --> PushECR["Push Images to AWS ECR<br/>(:v1 and :latest)"]

    classDef amberNode fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#ffffff;
    class DockerLogin,CreateRepos,Buildx,PushECR amberNode;
```

### Steps:
1. **Log In to Amazon ECR**:
   ```bash
   aws ecr get-login-password --region ap-southeast-2 | \
     docker login --username AWS --password-stdin 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com
   ```
2. **Create ECR Repositories** *(if not present)*:
   ```bash
   aws ecr create-repository --repository-name kendrick-shop-api --region ap-southeast-2 || true
   aws ecr create-repository --repository-name kendrick-shop-app --region ap-southeast-2 || true
   aws ecr create-repository --repository-name kendrick-shop-dashboard --region ap-southeast-2 || true
   ```
3. **Build & Push All 3 Container Images** (Must be `--platform linux/amd64` for EKS):
   ```bash
   # 1. API Backend
   docker buildx build --platform linux/amd64 --target prod \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/kendrick-shop-api:v1 \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/kendrick-shop-api:latest \
     ./services/api-app --push

   # 2. Shop Frontend
   docker buildx build --platform linux/amd64 --target runner \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/kendrick-shop-app:v2 \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/kendrick-shop-app:latest \
     ./services/shop-app --push

   # 3. Shop Admin Dashboard
   docker buildx build --platform linux/amd64 --target runner \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/kendrick-shop-dashboard:v1 \
     -t 542601847638.dkr.ecr.ap-southeast-2.amazonaws.com/kendrick-shop-dashboard:latest \
     ./services/shop-dashboard --push
   ```

---

## Phase 5: Kubernetes Workload Deployment & Database Seeding

Deploy application workloads to EKS and seed the live AWS RDS database.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart LR
    Kubeconfig["Connect kubectl to EKS"] --> K8sSecret["Create postgres-secret"]
    K8sSecret --> ApplyK8s["kubectl apply -k k8s/eks"]
    ApplyK8s --> PulumiDNS["Feed ELB DNS into Pulumi & pulumi up"]
    PulumiDNS --> SeedLive["curl -X POST https://api.kendrickdev.shop/seed"]

    classDef greenNode fill:#1e293b,stroke:#22c55e,stroke-width:2px,color:#ffffff;
    class Kubeconfig,K8sSecret,ApplyK8s,PulumiDNS,SeedLive greenNode;
```

### Steps:
1. **Connect `kubectl` to EKS**:
   ```bash
   aws eks update-kubeconfig --region ap-southeast-2 --name shop-eks-cluster
   kubectl get nodes
   ```
2. **Create the Database Connection Secret in Kubernetes**:
   ```bash
   DATABASE_URL=$(pulumi stack output databaseUrl --show-secrets)

   kubectl create secret generic postgres-secret \
     --from-literal=POSTGRES_DB=shop \
     --from-literal=POSTGRES_USER=shop \
     --from-literal=POSTGRES_PASSWORD="asdffdsa" \
     --from-literal=DATABASE_URL="$DATABASE_URL" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
3. **Apply Workload Manifests with Kustomize**:
   ```bash
   kubectl apply -k k8s/eks
   kubectl get pods -w
   ```
   *(Wait until all pods show `1/1 Running`)*
4. **Feed Load Balancers into Route 53**:
   ```bash
   pulumi config set shopElbHost $(kubectl get svc shop-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   pulumi config set apiElbHost $(kubectl get svc api-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   pulumi config set dashboardElbHost $(kubectl get svc shop-dashboard-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   pulumi up --yes
   ```
5. **Seed the Live Production Database**:
   ```bash
   curl -X POST https://api.kendrickdev.shop/seed
   ```
   *(Populates 10 brands, 6 categories, 30 products with real S3 images, stocks, and bcrypt admin credentials)*

---

## Phase 6: Automated CI/CD Setup (Day 2 Operations)

Configure GitHub Actions so any future code pushed to `main` automatically builds and deploys to EKS.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'darkMode': true, 'background': '#0d1117', 'mainBkg': '#1e293b', 'primaryColor': '#1e293b', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#38bdf8', 'lineColor': '#94a3b8', 'textColor': '#ffffff', 'clusterBkg': '#0f172a', 'clusterBorder': '#334155'}}}%%
flowchart TD
    CreateIAM["1. Create AWS IAM User<br/>(github-actions-deployer)"] --> AttachPolicy["2. Attach ECR & EKS Policies<br/>(or AdministratorAccess)"]
    AttachPolicy --> GenKeys["3. Generate Access Key ID & Secret Key"]
    GenKeys --> AddGHSecrets["4. Add to GitHub Repo Secrets<br/>(AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY)"]
    AttachPolicy --> MapEKS["5. EKS Access Entry in IaC<br/>(AmazonEKSClusterAdminPolicy)"]
    AddGHSecrets --> PushCode["6. git push origin main"]
    MapEKS --> PushCode
    PushCode --> GHAPipeline["7. Automated GitHub Actions Run<br/>(Test -> Buildx ECR -> EKS Rollout)"]

    classDef iamStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#ffffff;
    class CreateIAM,AttachPolicy,GenKeys,AddGHSecrets,MapEKS,PushCode,GHAPipeline iamStyle;
```

---

### Step 6.1: Create the AWS IAM User (Step-by-Step)

You can create the dedicated IAM deployment user either through the **AWS Management Console** or directly using the **AWS CLI**.

#### Option A: Via AWS Management Console (Visual Steps)

1. **Navigate to IAM**:
   - Log into the [AWS Management Console](https://console.aws.amazon.com/).
   - In the top search bar, type `IAM` and press Enter.
   - In the left sidebar, click **Users** $\rightarrow$ click the orange **Create user** button.

2. **Specify User Details**:
   - **User name**: `github-actions-deployer`
   - **Provide user access to the AWS Management Console**: Leave this **UNCHECKED** (This user is exclusively for automated programmatic/CLI access).
   - Click **Next**.

3. **Set Permissions**:
   - Select **Attach policies directly**.
   - For complete cluster & container registry deployment privileges, search for and select:
     - `AdministratorAccess` *(Recommended for personal dev/interview environments)*
     - **OR** for production least-privilege:
       - `AmazonEC2ContainerRegistryPowerUser` (Allows ECR login, docker push, and pull)
       - `AmazonEKSClusterPolicy` (Allows EKS cluster description and kubeconfig retrieval)
   - Click **Next** $\rightarrow$ click **Create user**.

4. **Generate Access Keys**:
   - On the Users list, click on your newly created user: `github-actions-deployer`.
   - Select the **Security credentials** tab.
   - Scroll down to the **Access keys** section and click **Create access key**.
   - Under **Use case**, select **Command Line Interface (CLI)**.
   - Check the confirmation box acknowledging the recommendation.
   - Click **Next** $\rightarrow$ *(Optional)* Enter description tag: `GitHub Actions CI/CD`.
   - Click **Create access key**.
   - **IMPORTANT**: Copy both:
     - **Access key ID** (e.g. `AKIAIOSFODNN7EXAMPLE`)
     - **Secret access key** (e.g. `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
   - Click **Download .csv file** as a secure backup, then click **Done**.

---

#### Option B: Via AWS CLI (One-Click Terminal Commands)

Alternatively, create the IAM user and generate keys in seconds from your terminal:

```bash
# 1. Create the IAM user
aws iam create-user --user-name github-actions-deployer

# 2. Attach deployment policy (AdministratorAccess for dev/interview)
aws iam attach-user-policy \
  --user-name github-actions-deployer \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 3. Generate Access Key & Secret
aws iam create-access-key --user-name github-actions-deployer
```
*Save the output `AccessKeyId` and `SecretAccessKey`.*

---

### Step 6.2: Add Credentials to GitHub Secrets

1. Open your repository on GitHub:
   [https://github.com/heinhtetzan/interview/settings/secrets/actions](https://github.com/heinhtetzan/interview/settings/secrets/actions)
2. Under **Repository secrets**, click **New repository secret**:
   - **Name**: `AWS_ACCESS_KEY_ID`
   - **Secret**: Paste your IAM user's Access Key ID
   - Click **Add secret**
3. Click **New repository secret** again:
   - **Name**: `AWS_SECRET_ACCESS_KEY`
   - **Secret**: Paste your IAM user's Secret Access Key
   - Click **Add secret**

---

### Step 6.3: Grant Kubernetes Access in EKS via IAM Access Entries (Modern EKS Standard)

Modern AWS EKS clusters configured with `API_AND_CONFIG_MAP` authentication use **EKS Access Entries** instead of manually editing the legacy `aws-auth` ConfigMap. 

> [!NOTE]
> **Cost**: EKS Access Entries are **100% Free ($0.00)**. AWS does not charge any additional fees for access entries or policy associations.

Run the following commands to create the Access Entry and attach the `AmazonEKSClusterAdminPolicy` (Cluster Admin privileges):

```bash
# 1. Create EKS Access Entry for the IAM deployer user
aws eks create-access-entry \
  --cluster-name shop-eks-cluster \
  --principal-arn arn:aws:iam::542601847638:user/github-actions-deployer \
  --type STANDARD \
  --region ap-southeast-2

# 2. Associate full Cluster Admin policy
aws eks associate-access-policy \
  --cluster-name shop-eks-cluster \
  --principal-arn arn:aws:iam::542601847638:user/github-actions-deployer \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region ap-southeast-2

# 3. Associate standard Admin policy
aws eks associate-access-policy \
  --cluster-name shop-eks-cluster \
  --principal-arn arn:aws:iam::542601847638:user/github-actions-deployer \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy \
  --access-scope type=cluster \
  --region ap-southeast-2
```

#### Verify Active EKS Access Entries:
```bash
aws eks list-access-entries --cluster-name shop-eks-cluster --region ap-southeast-2
aws eks list-associated-access-policies \
  --cluster-name shop-eks-cluster \
  --principal-arn arn:aws:iam::542601847638:user/github-actions-deployer \
  --region ap-southeast-2
```

---

### Step 6.4: Trigger & Verify the CI/CD Pipeline

Once secrets and permissions are in place, test the automated deployment:

```bash
# 1. Stage and commit your code
git add .
git commit -m "feat: complete CI/CD automation with IAM deployer"

# 2. Push to main
git push origin main
```

Monitor your live workflow under **GitHub Actions**:
`https://github.com/heinhtetzan/interview/actions`

GitHub Actions will automatically execute:
1. **Test job**: Runs Bun tests and validates builds for `api-app`, `shop-app`, and `shop-dashboard`.
2. **Build-and-push job**: Builds `linux/amd64` Docker images and pushes them to AWS ECR with commit SHA tags.
3. **Deploy job**: Connects to EKS, updates deployments with `kubectl set image`, and verifies zero-downtime rollout.

---

## Phase 7: Day-to-Day Operations & Runbooks

### 1. Rolling Restart Application Pods
If you need to force-pull fresh images without code changes:
```bash
kubectl rollout restart deployment/api-app deployment/shop-app deployment/shop-dashboard
```

### 2. View Live Production Logs
```bash
# Backend API logs
kubectl logs -l app=api-app --tail=50 -f

# Shop Storefront logs
kubectl logs -l app=shop-app --tail=50 -f

# Admin Dashboard logs
kubectl logs -l app=shop-dashboard --tail=50 -f
```

### 3. Clean Cloud Teardown Order
To avoid leaving lingering cloud assets or incurring ongoing costs:
```bash
# Step 1: Delete Kubernetes Load Balancers first (releases AWS ELBs)
kubectl delete -k k8s/eks

# Step 2: Destroy cloud infrastructure via Pulumi
pulumi destroy --yes

# Step 3: (Optional) Delete ECR Repositories
aws ecr delete-repository --repository-name kendrick-shop-api --region ap-southeast-2 --force
aws ecr delete-repository --repository-name kendrick-shop-app --region ap-southeast-2 --force
aws ecr delete-repository --repository-name kendrick-shop-dashboard --region ap-southeast-2 --force
```
