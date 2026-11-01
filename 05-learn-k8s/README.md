# Learn Kubernetes — Hands-On Step-by-Step Course

A practical, terminal-first guide to mastering Kubernetes fundamentals with `kind` (Kubernetes in Docker) and `kubectl`. 

This course is built directly from real interactive development sessions: starting from a bare cluster, containerizing custom backend and frontend services, managing Pod lifecycles, debugging local image issues, discovering cluster networking via Services & CoreDNS, enabling self-healing Deployments, and decoupling configuration with ConfigMaps and Secrets.

---

## What We Build & Learn

```
                                      +------------------------------------+
                                      |            kind Cluster            |
                                      |              ("hello")             |
                                      |                                    |
[Browser] --- port-forward (8080) --> | [ hello-shop Pod (Nginx, Port 80) ]|
                                      |                  |                 |
                                      |         CoreDNS (Internal DNS)     |
                                      |                  v                 |
                                      |     [ hello-api-svc (Port 3000) ]  |
                                      |                  |                 |
                                      |    +-------------+-------------+   |
                                      |    |       ClusterIP Endpoints |   |
                                      |    v             v             v   |
                                      | [Pod 1]       [Pod 2]       [Pod 3]|
                                      | <--- hello-api-deploy Replicas --->|
                                      +------------------------------------+
```

1. **Backend Service (`hello-api`)**: An ultra-fast HTTP server built with Bun & Elysia listening on port 3000.
2. **Frontend Service (`hello-shop`)**: A modern React/Vite single-page application built with Bun and served by Nginx on port 80.
3. **Local Cluster (`kind`)**: Multi-container local Kubernetes cluster managing real workloads.

---

## Course Roadmap

| # | Lesson | Core Concepts & Highlights |
|---|---|---|
| **01** | [Cluster & Pod Fundamentals](lessons/01-cluster-and-first-pod.md) | `kubectl cluster-info`, `~/.kube/config`, declarative YAML vs imperative CLI, `--dry-run=client`, port-forwarding in background (`&`). |
| **02** | [Kind & Local Docker Images](lessons/02-kind-and-local-images.md) | Why Docker Hub images pull automatically while local images fail, `kind load docker-image`, `crictl images`, the `:latest` tag gotcha (`imagePullPolicy: IfNotPresent`), and Pod immutability. |
| **03** | [Services & Cluster Networking](lessons/03-services-and-networking.md) | Why Pod IPs are ephemeral, `ClusterIP` Services, `selector` matching `labels`, internal CoreDNS discovery (`http://hello-api-svc:3000`), and how `Endpoints` route traffic to Pod IPs. |
| **04** | [Deployments, Auto-Healing & Scaling](lessons/04-deployments-and-scaling.md) | Why standalone Pods are not production-ready, Pod templates in Deployments, simulating container crashes / auto-healing, dynamic replica scaling (`kubectl scale`), and automatic load balancing. |
| **05** | [ConfigMaps & Secrets](lessons/05-configmaps-and-secrets.md) | Decoupling application config from container images, creating ConfigMaps & Secrets, environment variable injection via `configMapKeyRef` / `secretKeyRef`, and automatic zero-downtime rolling updates. |

---

## Quick Reference: Essential Commands Cheat Sheet

### Cluster & Context
```bash
# Check cluster control plane status
kubectl cluster-info

# View active nodes
kubectl get nodes -o wide

# View active kubeconfig
kubectl config view
```

### Pod & Workload Operations
```bash
# Generate manifest without creating resource (Dry Run)
kubectl run <pod-name> --image=<image> --port=<port> --dry-run=client -o yaml > pod.yaml

# Create / Apply resource
kubectl apply -f <manifest.yaml>

# List resources
kubectl get pods
kubectl get deployments
kubectl get svc

# Delete resource
kubectl delete pod <pod-name>
kubectl delete -f <manifest.yaml>

# Force replace an immutable Pod
kubectl replace --force -f <manifest.yaml>
```

### Networking & Debugging
```bash
# Port-forward to host (foreground or background)
kubectl port-forward pod/<pod-name> 8080:80
kubectl port-forward pod/<pod-name> 3000:3000 &

# Kill background port-forward
pkill -f "kubectl port-forward"

# Inspect Pod endpoints mapped to a Service
kubectl get endpoints <service-name>

# Execute a command inside a running Pod container
kubectl exec <pod-name> -- <command>
kubectl exec deployment/<deployment-name> -- printenv <ENV_VAR>
```

### Kind Operations
```bash
# Create cluster
kind create cluster --name hello

# Load local host Docker image into kind node
kind load docker-image <image-name>:<tag> --name hello

# List images cached inside kind node
docker exec -it hello-control-plane crictl images

# Delete cluster when done
kind delete cluster --name hello
```

---

## Directory Structure

```
05-learn-k8s/
├── README.md                          # Course overview and quick reference
├── lessons/
│   ├── 01-cluster-and-first-pod.md    # Lesson 1: Pods, YAML & dry-run
│   ├── 02-kind-and-local-images.md    # Lesson 2: Local images, kind load & imagePullPolicy
│   ├── 03-services-and-networking.md  # Lesson 3: Services, DNS & Endpoints
│   ├── 04-deployments-and-scaling.md  # Lesson 4: Deployments, replicas & self-healing
│   └── 05-configmaps-and-secrets.md   # Lesson 5: Injected configs & rolling updates
└── examples/
    ├── apps/
    │   ├── hello-api/                 # Backend Bun + Elysia API (port 3000)
    │   └── hello-shop/                # Frontend Vite + React + Nginx (port 80)
    └── k8s/
        ├── 01-starter-pod.yaml        # Starter Nginx Pod
        ├── 02-hello-api-pod.yaml      # Standalone API Pod
        ├── 03-hello-shop-pod.yaml     # Standalone Shop Frontend Pod
        ├── 04-hello-api-svc.yaml      # ClusterIP Service for API
        ├── 05-hello-api-deploy.yaml   # Scalable 3-replica Deployment with env injection
        ├── 06-configmap.yaml          # ConfigMap for API
        └── 07-secret.yaml             # Secret for API key
```

