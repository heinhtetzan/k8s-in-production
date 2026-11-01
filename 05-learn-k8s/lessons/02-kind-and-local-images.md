# Lesson 2 — Kind & Local Docker Images

## Objective
Learn how `kind` handles container images, understand why local Docker images fail without loading, master the `:latest` tag gotcha (`imagePullPolicy: IfNotPresent`), handle Pod immutability errors, and deploy two custom apps (`hello-api` backend and `hello-shop` frontend).

---

## 1. Why Did Nginx Work, But Custom Images Fail?

When you ran `nginx` in Lesson 1, Kubernetes immediately downloaded it. Why?

* **Public Images (`nginx`)**: The image exists on a public registry (Docker Hub). Kubernetes worker nodes can pull it directly over the internet.
* **Local Images (`hello-api:latest`)**: When you build an image locally with `docker build`, it only exists in your host machine's Docker daemon. Your `kind` cluster runs inside its own Docker container with its own private `containerd` runtime and **cannot see your host machine's images**.

If you try to run an unloaded local image, Kubernetes tries to pull it from Docker Hub, fails, and gives:

```text
STATUS: ErrImagePull
STATUS: ImagePullBackOff
```

---

## 2. The Solution: `kind load docker-image`

To make a host Docker image available to your `kind` cluster, you must load it into the cluster nodes:

```bash
kind load docker-image hello-api:latest --name hello
```

> **Why `--name hello`?**  
> By default, `kind` looks for a cluster named `kind`. Because your cluster was named `hello` (e.g., node name `hello-control-plane`), you must explicitly pass `--name hello`.

### Verifying Cached Images in Kind Node
Because the kind node runs inside Docker, you can inspect its internal `containerd` cache using `crictl`:

```bash
docker exec -it hello-control-plane crictl images
```

You will see your loaded image in the list:
```text
IMAGE                                TAG      IMAGE ID        SIZE
docker.io/library/hello-api          latest   6f0f2fff897c    62MB
```

---

## 3. The `:latest` Gotcha: `imagePullPolicy`

Even after loading the image with `kind load`, your Pod may still fail with `ImagePullBackOff` if you tagged it `:latest`!

### Why?
Kubernetes follows this default rule:
* If an image has a specific version tag (e.g., `:1.0.0`), the default `imagePullPolicy` is **`IfNotPresent`**.
* If an image tag is **`:latest`** or omitted, Kubernetes automatically defaults `imagePullPolicy` to **`Always`**.

When set to `Always`, Kubernetes **always contacts Docker Hub** to check for a newer digest, which fails for local-only images!

### The Fix:
You must explicitly configure `imagePullPolicy: IfNotPresent` in your container spec:

```yaml
spec:
  containers:
  - image: hello-api:latest
    name: hello-api
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 3000
```

---

## 4. Pod Immutability & `kubectl replace --force`

If you try to edit `imagePullPolicy` in an existing YAML and run `kubectl apply`, you will receive this error:

```text
The Pod "hello-api" is invalid: spec: Forbidden: pod updates may not change fields other than `spec.containers[*].image`...
```

### Why?
Kubernetes Pod specifications are largely **immutable**. Once created, you cannot change networking, ports, or pull policies on a running Pod.

### How to resolve:
Either delete the existing Pod first:
```bash
kubectl delete pod hello-api
kubectl apply -f hello-api.yaml
```

Or force-recreate it in one step:
```bash
kubectl replace --force -f hello-api.yaml
```

---

## 5. Hands-On: Deploying `hello-api` (Backend)

`hello-api` is a lightweight Bun + Elysia API server listening on port 3000.

### Step 1: Dockerfile (`apps/hello-api/Dockerfile`)
```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY . .
USER bun
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

### Step 2: Build and Load
```bash
# Build Docker image
docker build -t hello-api:latest apps/hello-api

# Load into kind cluster
kind load docker-image hello-api:latest --name hello
```

### Step 3: Manifest (`hello-api.yaml`)
```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: hello-api
  name: hello-api
spec:
  containers:
  - image: hello-api:latest
    name: hello-api
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 3000
  restartPolicy: Always
```

### Step 4: Apply and Test
```bash
kubectl apply -f hello-api.yaml
kubectl port-forward pod/hello-api 3000:3000 &
curl http://localhost:3000
# Output: hello
```

---

## 6. Hands-On: Deploying `hello-shop` (Frontend)

`hello-shop` is a React + Vite single page application built with Bun and served statically with Nginx on port 80.

### Step 1: Multi-Stage Dockerfile (`apps/hello-shop/Dockerfile`)
```dockerfile
# Stage 1: Build the Vite production assets
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install
COPY . .
RUN bun run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Build and Load
```bash
docker build -t hello-shop:latest apps/hello-shop
kind load docker-image hello-shop:latest --name hello
```

### Step 3: Manifest (`hello-shop.yaml`)
```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: hello-shop
  name: hello-shop
spec:
  containers:
  - image: hello-shop:latest
    name: hello-shop
    imagePullPolicy: IfNotPresent
    ports:
    - containerPort: 80
  restartPolicy: Always
```

### Step 4: Apply and Verify Both Pods
```bash
kubectl apply -f hello-shop.yaml
kubectl get pods
```

Expected output:
```text
NAME         READY   STATUS    RESTARTS   AGE
hello-api    1/1     Running   0          5m
hello-shop   1/1     Running   0          10s
```

Test the frontend in your browser:
```bash
kubectl port-forward pod/hello-shop 8080:80
```
Open `http://localhost:8080` to see the React shop app.

