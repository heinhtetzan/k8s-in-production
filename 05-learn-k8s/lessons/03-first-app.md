# Lesson 3 — Build and deploy the first app

## Goal

Build a small Bun + Hono API, package it in an image, load it into `kind`, and run three replicas.

## 1. Create the cluster

```sh
kind create cluster --name learning
kubectl get nodes
```

If the cluster already exists, this command reports that; continue with the existing `learning` context.

## 2. Application source

The starter project is in `examples/app/`. The API exposes `/`, `/health`, and `/ready`:

```ts
import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => c.json({ message: "Hello Kubernetes!", version: "1.0.0" }));
app.get("/health", (c) => c.json({ status: "healthy" }));
app.get("/ready", (c) => c.json({ status: "ready" }));

export default { port: 3000, fetch: app.fetch };
```

From the app directory, install dependencies and try it locally:

```sh
cd examples/app
bun install
bun run src/index.ts
```

In another terminal, request `http://localhost:3000/health` (or use `curl`) and then stop the server with Ctrl+C.

## 3. Build an image

```sh
docker build -t kendrick-shop:v1 -f examples/app/Dockerfile examples/app
kind load docker-image kendrick-shop:v1 --name learning
```

The image is loaded into the local kind node; a remote registry is not needed for this exercise. Keep `imagePullPolicy: IfNotPresent` for this local image.

## 4. Apply the workload and Service

```sh
kubectl apply -f examples/k8s/hello-app.yaml
kubectl rollout status deployment/hello-api
kubectl get pods -l app=hello-api -o wide
kubectl get service hello-service
```

The manifest includes a Deployment and a ClusterIP Service. The Service maps port 80 to the container's port 3000.

## 5. Reach the API

```sh
kubectl port-forward service/hello-service 8080:80
```

In another terminal:

```sh
curl http://localhost:8080/
curl http://localhost:8080/health
```

Stop port-forward with Ctrl+C. Port-forward is a developer access path, not an internet ingress design.

## 6. Inspect and change

```sh
kubectl logs deployment/hello-api
kubectl describe deployment hello-api
kubectl scale deployment/hello-api --replicas=5
kubectl get pods -l app=hello-api
```

Edit `src/index.ts` to return version `2.0.0`, build and load `kendrick-shop:v2`, then update the manifest image or run:

```sh
docker build -t kendrick-shop:v2 -f examples/app/Dockerfile examples/app
kind load docker-image kendrick-shop:v2 --name learning
kubectl set image deployment/hello-api hello-api=kendrick-shop:v2
kubectl rollout status deployment/hello-api
kubectl rollout undo deployment/hello-api
```

When finished, restore the manifest to the version you intend to keep.

**Next:** [Services and networking](04-services-networking.md).
