# Lesson 4 — Deployments, Auto-Healing & Scaling

## Objective
Understand why standalone Pods should never be used in production, create a multi-replica **Deployment**, link your Service to the Deployment, experience Kubernetes **self-healing** in action, dynamically scale replicas up and down, and observe automatic load balancing.

---

## 1. Why Not Standalone Pods?

In Lesson 2 and 3, we created standalone Pods (`kind: Pod`). 
* If a standalone Pod crashes or the node runs out of memory, the Pod terminates and is **never recreated**.
* If you delete a standalone Pod (`kubectl delete pod hello-api`), it is gone forever.
* You cannot scale a standalone Pod to multiple copies.

In production, you always wrap Pods in a **Deployment**:
* **Deployments** manage **ReplicaSets**, which in turn manage **Pods**.
* If a container dies, the Deployment immediately creates an identical replacement (**Self-Healing**).
* Deployments support zero-downtime rolling updates, rollbacks, and instant horizontal scaling.

---

## 2. Generating the Deployment Manifest

Generate a Deployment template for `hello-api`:

```bash
kubectl create deployment hello-api-deploy --image=hello-api:latest --port=3000 --dry-run=client -o yaml > hello-api-deployment.yaml
```

Edit [hello-api-deployment.yaml](hello-api-deployment.yaml) to:
1. Set `replicas: 3` (run 3 identical copies of the API).
2. Add `imagePullPolicy: IfNotPresent` under containers.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: hello-api-deploy
  name: hello-api-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hello-api-deploy
  strategy: {}
  template:
    metadata:
      labels:
        app: hello-api-deploy
    spec:
      containers:
      - image: hello-api:latest
        name: hello-api
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        resources: {}
status: {}
```

### Key Deployment Fields:
* **`replicas: 3`**: Desired number of running Pod instances.
* **`selector.matchLabels`**: The query the Deployment controller uses to find and manage its Pods.
* **`template`**: The blueprint used to create new Pods. Notice that `template.metadata.labels` must match `selector.matchLabels`.

---

## 3. Applying the Deployment

Apply the Deployment to your cluster:

```bash
kubectl apply -f hello-api-deployment.yaml
```

Check the status of Deployments and Pods:

```bash
kubectl get deployments,pods
```

Expected output:
```text
NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/hello-api-deploy   3/3     3            3           30s

NAME                                    READY   STATUS    RESTARTS   AGE
pod/hello-api-deploy-5fc5c9b49d-bwqwk   1/1     Running   0          30s
pod/hello-api-deploy-5fc5c9b49d-gg8nk   1/1     Running   0          30s
pod/hello-api-deploy-5fc5c9b49d-hndq7   1/1     Running   0          30s
```

All 3 replicas are running simultaneously!

---

## 4. Connecting the Service to the Deployment

In Lesson 3, our `hello-api-svc` was querying for `run: hello-api` (the old standalone Pod). We must update the Service selector to match our new Deployment Pod label: **`app: hello-api-deploy`**.

In [hello-api-svc.yaml](hello-api-svc.yaml), update `selector`:

```yaml
apiVersion: v1
kind: Service
metadata:
  labels:
    run: hello-api
  name: hello-api-svc
spec:
  ports:
  - port: 3000
    protocol: TCP
    targetPort: 3000
  selector:
    app: hello-api-deploy
```

Apply the updated Service and delete the old standalone Pod:

```bash
kubectl apply -f hello-api-svc.yaml
kubectl delete pod hello-api
```

Now inspect the endpoints for `hello-api-svc`:

```bash
kubectl get endpoints hello-api-svc
```

Expected output:
```text
NAME            ENDPOINTS                                            AGE
hello-api-svc   10.244.0.12:3000,10.244.0.13:3000,10.244.0.14:3000   17m
```

The Service automatically detected all 3 running Deployment Pods and now balances incoming requests across all three!

---

## 5. Testing Self-Healing (Auto-Recovery)

Let's test what happens when a Pod crashes or gets deleted. Delete one of the deployment pods:

```bash
kubectl delete pod hello-api-deploy-5fc5c9b49d-bwqwk
```

Immediately list your pods:

```bash
kubectl get pods -l app=hello-api-deploy
```

Expected output:
```text
NAME                                READY   STATUS    RESTARTS   AGE
hello-api-deploy-5fc5c9b49d-d9jbg   1/1     Running   0          5s
hello-api-deploy-5fc5c9b49d-gg8nk   1/1     Running   0          14m
hello-api-deploy-5fc5c9b49d-hndq7   1/1     Running   0          14m
```

The Deployment controller noticed that only 2 pods were running instead of the declared 3 (`desired state != actual state`) and **instantly spawned a brand new Pod** (`...-d9jbg`) to replace it!

---

## 6. Dynamic Scaling

Need to handle a surge in traffic? You can scale up the number of replicas on the fly:

```bash
kubectl scale deployment hello-api-deploy --replicas=5
```

Verify that 5 pods are running:

```bash
kubectl get pods -l app=hello-api-deploy
```

Inspect the Service endpoints:

```bash
kubectl get endpoints hello-api-svc
```

Output:
```text
NAME            ENDPOINTS                                                        AGE
hello-api-svc   10.244.0.12:3000,10.244.0.13:3000,10.244.0.15:3000 + 2 more...   39m
```

The Service automatically expanded its pool to include all 5 Pods.

Scale back down when traffic subsides:

```bash
kubectl scale deployment hello-api-deploy --replicas=2
```

---

## Key Takeaways

1. **Deployments** maintain your desired state (replica count, image versions).
2. If a Pod dies, the Deployment reconciles state and recreates it (**Self-Healing**).
3. Update the Service `selector` to match Deployment `matchLabels` for automated load balancing.
4. Scale workloads imperatively with `kubectl scale` or declaratively by updating `replicas` in YAML.

