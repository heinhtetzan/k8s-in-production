# Kubernetes in Production: Hands-on Learning Path

A comprehensive step-by-step repository covering containerization, AWS cloud infrastructure, Infrastructure as Code (IaC), Kubernetes architectures, and a complete production e-commerce stack.

---

## 📁 Repository Modules

| Module | Topic | Description | Documentation |
| :--- | :--- | :--- | :--- |
| **[`01-foundation-knowledge`](./01-foundation-knowledge/)** | Foundations | Linux, networking, containers & K8s core concepts | [Read Guide](./01-foundation-knowledge/README.md) |
| **[`02-docker-warm-up`](./02-docker-warm-up/)** | Docker | Multi-stage builds, caching, Docker Compose | [Read Guide](./02-docker-warm-up/README.md) |
| **[`03-aws-services`](./03-aws-services/)** | AWS | IAM, VPC, ECR, RDS, S3, Route 53, CloudWatch | [Read Guide](./03-aws-services/README.md) |
| **[`04-iac`](./04-iac/)** | IaC | CDK and Pulumi with Bun/TypeScript | [Read Guide](./04-iac/README.md) |
| **[`05-learn-k8s`](./05-learn-k8s/)** | Kubernetes | Pods, Deployments, Services, ConfigMaps, Ingress | [Read Guide](./05-learn-k8s/README.md) |
| **[`06-try-production-eks`](./06-try-production-eks/)** | Production Stack | Full-stack e-commerce on Docker Compose & AWS EKS | [**Read Main README**](./06-try-production-eks/README.md) |

---

## 🚀 Quick Links for `06-try-production-eks`

- **[Local Docker Compose Quickstart](./06-try-production-eks/README.md#💻-0-local-development-quickstart)**: Run PostgreSQL, Hono API, TanStack Start Storefront & Dashboard locally with `docker compose up`.
- **[Local Kubernetes Guide (`k8s/local/`)](./06-try-production-eks/doc/01-local-k8s-guide.md)**: Deploy the full stack on Docker Desktop Kubernetes for $0/month.
- **[EKS Cloud Production Architecture](./06-try-production-eks/doc/02-eks-cluster-overview.md)**: Production EKS cluster, RDS PostgreSQL, ALB Ingress, and Route 53 setup.

