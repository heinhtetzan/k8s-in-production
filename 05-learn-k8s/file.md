# Learn Kubernetes — Step by Step

Let's learn Kubernetes from the fundamentals to production-level Kubernetes administration, using practical examples rather than just theory.

Since you already have experience with Docker, Linux, cloud infrastructure, AWS, and container deployment, we'll build on that knowledge.

My recommendation is to learn Kubernetes using hands-on projects, starting locally on your Mac and eventually deploying applications to AWS EKS.

## 1. Kubernetes learning roadmap

We'll follow this learning path in order.

1. Kubernetes Fundamentals
   - What is Kubernetes?
   - Why do we need it?
   - Kubernetes architecture
   - Cluster, Node, Pod
2. Core Kubernetes Objects
   - Pod
   - ReplicaSet
   - Deployment
   - Service
   - Namespace
3. Application Configuration
   - ConfigMap
   - Secret
   - Environment variables
   - Volume and PersistentVolume
4. Networking
   - ClusterIP
   - NodePort
   - LoadBalancer
   - Ingress
   - DNS and service discovery
5. Scaling and Reliability
   - Replicas
   - Horizontal Pod Autoscaler
   - Health checks
   - Liveness and Readiness probes
   - Resource limits
6. Advanced Kubernetes
   - StatefulSet
   - DaemonSet
   - Jobs and CronJobs
   - RBAC
   - Storage
   - Helm
7. Production Kubernetes
   - Monitoring and logging
   - Security
   - CI/CD
   - Rolling updates
   - Cluster management
8. AWS EKS
   - EKS architecture
   - ECR integration
   - VPC and networking
   - IAM and IRSA
   - Load Balancer Controller
   - Production deployment

Let's start with Lesson 1.

# Lesson 1 — What is Kubernetes?

## 2. Why do we need Kubernetes?

First, think about a normal Docker deployment.

You have an application:

```
Frontend (Next.js)
Backend (Hono)
Database (PostgreSQL)
Redis
```

You can run them using Docker:

```
docker run -d backend
docker run -d frontend
docker run -d postgres
docker run -d redis
```

This works.

But imagine your backend receives 100,000 requests per day.

You might want to:

- Run 5 backend containers instead of 1.
- Automatically restart failed containers.
- Distribute incoming traffic.
- Scale containers when traffic increases.
- Deploy new versions without downtime.
- Manage containers across multiple servers.

Docker alone doesn't provide a complete orchestration solution for all these requirements.

Kubernetes is a container orchestration platform.

It automates deploying, scaling, networking, and managing containerized applications.

[Kubernetes Architecture and components | by jaffar shaik | Medium](https://images.openai.com/static-rsc-4/0ZngUENzhaLXRSWKGdMUCohNdE8qgqFh0Tg5ScgdL8mZn3UKH0QtoZrIqCIoPvmKcbX-EkdAY3s4N1-Wf2Sp08qjp6iT0S6lN-tYYNj1cyVNELD3lzqq1Uii1SKmSjmR9iD4MDWpB-2WWmNgR8q9NPQ5cQ0uvhhJ_ZsiHM-QVtM?purpose=inline)

[jaffarshaik.medium.com](https://jaffarshaik.medium.com/kubernetes-architecture-and-components-bf637dbd0526?utm_source=chatgpt.com)

### Docker vs Kubernetes

| Docker                           | Kubernetes                  |
| -------------------------------- | --------------------------- |
| Builds container images          | Manages container workloads |
| Runs containers                  | Schedules workloads         |
| Manages individual containers    | Manages many containers     |
| Docker Compose                   | Kubernetes manifests        |
| Single-host container management | Cluster orchestration       |
| Manual scaling                   | Automated scaling options   |

An important distinction: Kubernetes does not replace Docker as an image-building tool. It can run container images using container runtimes such as containerd.

## 3. Understand Kubernetes architecture

This is one of the most important concepts.

A Kubernetes environment is called a Cluster.

A cluster consists of two major parts:

1. Control Plane
2. Worker Nodes

[Medium](https://images.openai.com/static-rsc-4/2vDFHqyK4Ad75qM6I0kvMzisyI8KXCe4CDNovVnj7h7ApF4WO5TFPnuIl19pZQdgtU9Ov4Lft6WFBmPw5P4WIKIoAr96je-FqmzhU0VBEJVQcofJwR9XP_0M3LDrRNiAuBIPZ2-stdAm_H46XxRLyIrAi4y0B_tMvgSs4tCe5f0?purpose=inline)

[medium.com](https://medium.com/%40vijaykumarbangaru45/medium-article-day-3-8989319f5f83?utm_source=chatgpt.com)

### A. Control Plane

The Control Plane manages the entire Kubernetes cluster.

| Component          | Responsibility                          |
| ------------------ | --------------------------------------- |
| API Server         | Entry point for Kubernetes API requests |
| Scheduler          | Decides which node should run a Pod     |
| Controller Manager | Maintains the desired cluster state     |
| etcd               | Stores Kubernetes cluster data          |

For example:

You request 3 backend replicas.

The Control Plane makes sure Kubernetes maintains 3 replicas.

### B. Worker Node

A Worker Node is a machine that runs your applications.

It can be a physical server or a virtual machine.

Each worker node normally has:

| Component         | Responsibility                                                                       |
| ----------------- | ------------------------------------------------------------------------------------ |
| Kubelet           | Communicates with the Control Plane                                                  |
| Container Runtime | Runs containers                                                                      |
| kube-proxy        | Implements Service networking rules (depending on cluster networking implementation) |
| Pods              | Run your applications                                                                |

Important: A Node is not the same as a Pod.

- Cluster = Collection of nodes.
- Node = Server or virtual machine.
- Pod = Smallest deployable Kubernetes workload unit.
- Container = Application process running inside a Pod.

# Lesson 2 — Understand the most important objects

Before writing code, understand these five Kubernetes objects.

Deployment

Manages application replicas and updates

ReplicaSet

Maintains the desired number of Pods

Pod 1

Container

Pod 2

Container

Pod 3

Container

Service

Provides a stable network endpoint for Pods

Conceptual relationship. A Service selects Pods independently; it is not a child of a Deployment.

### 1. Pod

A Pod is the smallest deployable unit in Kubernetes.

It usually contains one application container, although it can contain multiple closely related containers.

Example:

```
apiVersion: v1
kind: Pod
metadata:
  name: hello-pod
spec:
  containers:
    - name: hello
      image: nginx:alpine
      ports:
        - containerPort: 80
```

### 2. Deployment

A Deployment manages your application and ensures the desired number of Pods are running.

For example:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: nginx:alpine
          ports:
            - containerPort: 80
```

Notice:

```
replicas: 3
```

Kubernetes tries to maintain three running Pods.

If one Pod crashes, Kubernetes will try to replace it.

### 3. ReplicaSet

A ReplicaSet maintains the number of running Pods.

Normally, you don't create ReplicaSets manually. Deployments create and manage them.

### 4. Service

Pods are replaceable. Their IP addresses can change.

How can other applications communicate with them reliably?

We use a Service.

```
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

The Service finds Pods with:

```
labels:
  app: backend
```

And distributes traffic to the matching ready endpoints.

### 5. Namespace

A Namespace logically separates resources inside a cluster.

For example:

```
Kubernetes Cluster
│
├── development
│   ├── backend
│   └── frontend
│
├── staging
│   ├── backend
│   └── frontend
│
└── production
    ├── backend
    └── frontend
```

Namespaces are useful when multiple environments or teams share a cluster.

# Lesson 3 — Build and deploy your first application

Now let's build a real application and deploy it to Kubernetes.

We'll use:

- Bun
- TypeScript
- Hono
- Docker
- Kubernetes
- kind (Kubernetes in Docker)

This is a local learning environment. You don't need AWS EKS yet.

## Step 1. Install Kubernetes tools

On your Mac, make sure Docker Desktop is running.

Install:

```
brew install kubectl
brew install kind
```

Check versions:

```
docker --version
kubectl version --client
kind version
```

What are these tools?

| Tool    | Purpose                                            |
| ------- | -------------------------------------------------- |
| Docker  | Builds and manages container images                |
| kubectl | Communicates with Kubernetes                       |
| kind    | Creates local Kubernetes clusters using containers |

## Step 2. Create a project

```
mkdir hello-kubernetes
cd hello-kubernetes

bun init -y
bun add hono
```

Project structure:

```
hello-kubernetes/
│
├── src/
│   └── index.ts
│
├── package.json
├── bun.lock
├── Dockerfile
└── k8s/
    ├── deployment.yaml
    └── service.yaml
```

Create `src/index.ts`:

```
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    message: "Hello Kubernetes!",
    version: "1.0.0",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
```

Test locally:

```
bun run src/index.ts
```

Open:

```
http://localhost:3000
```

## Step 3. Create a Dockerfile

Create `Dockerfile`:

```
FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY src ./src

USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

Build the image:

```
docker build -t hello-k8s:v1 .
```

Check:

```
docker images
```

At this point, you have a Docker image.

But Kubernetes needs a cluster where it can run that image.

## Step 4. Create your first Kubernetes cluster

Run:

```
kind create cluster --name learning
```

Check:

```
kubectl cluster-info
```

Check your nodes:

```
kubectl get nodes
```

Example:

```
NAME                     STATUS   ROLES
learning-control-plane   Ready    control-plane
```

Congratulations! You now have a local Kubernetes cluster.

What just happened?

kind created a Kubernetes cluster using Docker containers.

Your local Docker environment is now hosting a Kubernetes control plane and node.

## Step 5. Load your Docker image into Kubernetes

Our application image currently exists in Docker.

kind uses its own node container image storage, so we need to load our image into the cluster.

```
kind load docker-image hello-k8s:v1 --name learning
```

Now Kubernetes can use:

```
hello-k8s:v1
```

## Step 6. Create a Deployment

Create `k8s/deployment.yaml`:

```
apiVersion: apps/v1
kind: Deployment

metadata:
  name: hello-api

spec:
  replicas: 3

  selector:
    matchLabels:
      app: hello-api

  template:
    metadata:
      labels:
        app: hello-api

    spec:
      containers:
        - name: hello-api
          image: hello-k8s:v1
          imagePullPolicy: IfNotPresent

          ports:
            - containerPort: 3000
```

Let's understand the important parts.

| Configuration      | Meaning                               |
| ------------------ | ------------------------------------- |
| `apiVersion`       | Kubernetes API version                |
| `kind`             | Resource type                         |
| `metadata.name`    | Deployment name                       |
| `replicas: 3`      | Desired number of Pods                |
| `selector`         | Identifies Pods managed by Deployment |
| `template`         | Defines how Pods are created          |
| `containers.image` | Container image                       |
| `containerPort`    | Application listening port            |

Apply the Deployment:

```
kubectl apply -f k8s/deployment.yaml
```

Check:

```
kubectl get deployments
```

Check Pods:

```
kubectl get pods
```

Expected result:

```
NAME                         READY   STATUS
hello-api-xxxxx              1/1     Running
hello-api-yyyyy              1/1     Running
hello-api-zzzzz              1/1     Running
```

Your first 3 Kubernetes Pods are running!

## Step 7. Create a Service

Your application is running, but how do you access it?

Create `k8s/service.yaml`:

```
apiVersion: v1
kind: Service

metadata:
  name: hello-service

spec:
  selector:
    app: hello-api

  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000

  type: ClusterIP
```

Apply:

```
kubectl apply -f k8s/service.yaml
```

Check:

```
kubectl get services
```

Now we have:

```
Service
   |
   ├── Pod 1
   ├── Pod 2
   └── Pod 3
```

The Service receives traffic on port 80 and forwards it to port 3000 in the selected Pods.

## Step 8. Access your application

For now, use port forwarding:

```
kubectl port-forward service/hello-service 8080:80
```

Open:

```
http://localhost:8080
```

Expected response:

```
{
  "message": "Hello Kubernetes!",
  "version": "1.0.0"
}
```

You have successfully deployed a Bun + Hono application to Kubernetes!

# Lesson 4 — Understand Kubernetes operations

Now let's learn how to manage your application.

These are commands you'll use frequently as a Kubernetes engineer.

## 1. Inspect resources

```
# List all Pods
kubectl get pods

# List Deployments
kubectl get deployments

# List Services
kubectl get services

# List Nodes
kubectl get nodes

# Show all resources
kubectl get all

# Get more detailed information
kubectl get pods -o wide
```

## 2. Inspect a specific Pod

```
kubectl describe pod <pod-name>
```

This is particularly useful when a Pod fails to start.

For example, you might see:

```
Status: Pending
ImagePullBackOff
CrashLoopBackOff
```

These are common Kubernetes troubleshooting situations.

## 3. View application logs

```
kubectl logs <pod-name>
```

Follow logs continuously:

```
kubectl logs -f <pod-name>
```

View logs from a Deployment:

```
kubectl logs deployment/hello-api
```

## 4. Scale your application

Remember our Deployment:

```
replicas: 3
```

Suppose you want 5 Pods.

Run:

```
kubectl scale deployment hello-api --replicas=5
```

Check:

```
kubectl get pods
```

Now Kubernetes will try to maintain 5 Pods.

You can also scale down:

```
kubectl scale deployment hello-api --replicas=2
```

This is manual scaling. Later, we'll learn Horizontal Pod Autoscaler (HPA), which can automatically adjust replicas based on metrics.

## 5. Test Kubernetes self-healing

This is one of the most interesting Kubernetes features.

First, list your Pods:

```
kubectl get pods
```

Delete one:

```
kubectl delete pod <pod-name>
```

Now check again:

```
kubectl get pods
```

You should see a replacement Pod being created.

Why?

Because your Deployment declares:

```
replicas: 3
```

Kubernetes continuously reconciles the actual state against your desired state.

If you want 3 Pods, Kubernetes tries to maintain 3 Pods.

This is called Declarative Configuration and Reconciliation.

## 6. Update your application

Change the application version:

```
return c.json({
  message: "Hello Kubernetes!",
  version: "2.0.0",
});
```

Build a new image:

```
docker build -t hello-k8s:v2 .
```

Load it into kind:

```
kind load docker-image hello-k8s:v2 --name learning
```

Update your Deployment:

```
kubectl set image deployment/hello-api \
  hello-api=hello-k8s:v2
```

Check rollout status:

```
kubectl rollout status deployment/hello-api
```

Check rollout history:

```
kubectl rollout history deployment/hello-api
```

Rollback:

```
kubectl rollout undo deployment/hello-api
```

This is how Kubernetes supports rolling updates and rollbacks.

# Lesson 5 — Important Kubernetes commands cheat sheet

Keep these commands handy.

| Command                                      | Purpose               |
| -------------------------------------------- | --------------------- |
| `kubectl get pods`                           | List Pods             |
| `kubectl get nodes`                          | List Nodes            |
| `kubectl get deployments`                    | List Deployments      |
| `kubectl get services`                       | List Services         |
| `kubectl describe pod NAME`                  | Inspect Pod           |
| `kubectl logs NAME`                          | View logs             |
| `kubectl exec -it NAME -- sh`                | Enter container       |
| `kubectl apply -f file.yaml`                 | Apply configuration   |
| `kubectl delete -f file.yaml`                | Delete resources      |
| `kubectl scale deployment NAME --replicas=3` | Scale application     |
| `kubectl get namespaces`                     | List namespaces       |
| `kubectl config get-contexts`                | List cluster contexts |

## Your first practical assignment

Try these tasks yourself:

Kubernetes practical checklist

0/10 completed

Install kubectl and kind

Create a Kubernetes cluster named learning

Build the Bun application Docker image

Create a Deployment with 3 replicas

Create a ClusterIP Service

Access the API using port-forward

Delete one Pod and observe self-healing

Scale the Deployment to 5 replicas

Update the image from v1 to v2

Perform a rollback

## What we'll learn next

After completing this first project, the next important topic is Kubernetes networking.

[Kubernetes Networking, Demystified | Medium](https://images.openai.com/static-rsc-4/0DY4ZvQXrMNINxO5dThmDLq20cH4OBNkWPlFSnrPQbdJG0X6ZXOrcZedGfBzzt_f7xL1DnB0LpE2k13MxrJ7TJMqLVej-hwvPs98-EjtHBitgNmAz9NBTBgiDkK_VsJp4ocKtjDAm5KJ3RoPvh61Ru74C7LnBeW_E4zkVWSxDhM?purpose=inline)

[medium.com](https://medium.com/%40akhilmittal510/kubernetes-networking-demystified-from-control-plane-to-packets-on-the-wire-f66a5db4a936?utm_source=chatgpt.com)

We'll cover:

1. How Pods communicate with each other.
2. How Services discover Pods.
3. ClusterIP vs NodePort vs LoadBalancer.
4. How Ingress works.
5. How to expose your Hono API to the internet.

My recommendation: Don't jump directly into AWS EKS. Understand local Kubernetes first. Once you understand Pods, Deployments, Services, Networking, and Storage, AWS EKS will make much more sense.

We'll eventually deploy the same application to EKS, integrate AWS ECR, configure Route 53, and build a production deployment architecture.&#x20;