# Learn Kubernetes — Step by Step

A practical course that starts with Kubernetes fundamentals, builds a Bun + Hono API, runs it locally in `kind`, and then develops the habits and architecture needed for production and AWS EKS.

## How to use this course

1. Read the lesson in order. Each lesson introduces a small set of ideas.
2. Run the commands in a terminal from this folder unless a lesson says otherwise.
3. Save the example manifests in `examples/` and apply them with `kubectl`.
4. Use `kubectl get`, `describe`, `logs`, and `events` to observe what Kubernetes actually did.
5. Clean up local resources when finished. Do not copy local-learning credentials or settings into production.

## Course map

| Lesson | Topic | Outcome |
|---|---|---|
| [01](lessons/01-fundamentals.md) | Fundamentals and architecture | Explain cluster, control plane, node, Pod, and reconciliation |
| [02](lessons/02-workloads.md) | Pods, ReplicaSets, Deployments | Run and update a replicated application |
| [03](lessons/03-first-app.md) | Build and deploy the Hono API | Run a containerized API in `kind` |
| [04](lessons/04-services-networking.md) | Services and networking | Reach Pods through stable names and ports |
| [05](lessons/05-configuration-storage.md) | Configuration and storage | Configure apps and understand persistent data |
| [06](lessons/06-reliability-scaling.md) | Probes, resources, scaling | Keep workloads healthy and right-sized |
| [07](lessons/07-security-operations.md) | Access, security, troubleshooting | Apply safer defaults and diagnose failures |
| [08](lessons/08-production-eks.md) | Production patterns and EKS | Understand the path from local cluster to AWS |

## Prerequisites

- Comfortable using a terminal and basic Linux commands.
- Docker Desktop (or another working Docker engine).
- On macOS, install `kubectl` and `kind` with Homebrew:

```sh
brew install kubectl kind
```

Check the tools:

```sh
docker version
kubectl version --client
kind version
```

## Project files

- `examples/app/` — small Hono API and container image recipe.
- `examples/k8s/` — manifests used throughout the local lessons.
- `diagrams/` — local diagrams used in the lessons.
- `file.md` — original pasted notes, preserved as a reference.

## Local cluster lifecycle

```sh
kind create cluster --name learning
kubectl cluster-info
kubectl get nodes

# At the end of the course:
kind delete cluster --name learning
```

Keep the cluster for later lessons; delete it only when you are done.
