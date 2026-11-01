# Lesson 1 — Cluster & Pod Fundamentals

## Objective
Understand the basic Kubernetes architecture, inspect your local `kind` cluster, explore the kubeconfig file, learn declarative YAML generation with `--dry-run`, and manage your first Pod lifecycle.

---

## 1. Inspecting the Cluster

When you interact with Kubernetes using the `kubectl` CLI, it sends REST API requests to the Kubernetes control plane.

Verify that your local `kind` cluster is running:

```bash
kubectl cluster-info
```

Expected output:
```text
Kubernetes control plane is running at https://127.0.0.1:49351
CoreDNS is running at https://127.0.0.1:49351/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

Next, inspect the cluster nodes:

```bash
kubectl get nodes
```

Expected output:
```text
NAME                  STATUS   ROLES           AGE   VERSION
hello-control-plane   Ready    control-plane   51m   v1.37.0
```

> **Note on kind naming**: When you create a cluster with `kind create cluster --name hello`, kind creates a Docker container named `hello-control-plane` to act as your Kubernetes node.

---

## 2. Where Does Kubernetes Config Live?

If you inspect your current directory, you will notice there are no cluster config files. That is because `kubectl` automatically stores cluster connection credentials in your home directory:

```bash
cat ~/.kube/config
```

Or view a cleaned, active version using `kubectl`:

```bash
kubectl config view
```

This file defines:
- **Clusters**: API server endpoints and certificate authorities.
- **Users**: Client certificates or bearer tokens for authentication.
- **Contexts**: Pairs a user with a cluster and namespace.

---

## 3. What is a Pod?

A **Pod** is the smallest deployable computing unit in Kubernetes. It represents a single running process in your cluster and encapsulates:
- One or more tightly coupled application containers.
- Shared storage volumes.
- A unique network IP address inside the cluster.

---

## 4. Generating YAML with `--dry-run=client`

Instead of writing YAML manifests from scratch, you can generate clean starter templates using `kubectl`'s dry-run feature.

```bash
kubectl run my-app --image=nginx --dry-run=client -o yaml > pod.yaml
```

### What does `--dry-run=client` do?
- `--dry-run=client`: Simulates the command locally on your machine **without** sending it to the Kubernetes cluster or creating any actual resources.
- `-o yaml`: Formats the simulated object into standard Kubernetes YAML instead of plain text output.
- `> pod.yaml`: Redirects the output into a file.

### Inspecting `pod.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: my-app
  name: my-app
spec:
  containers:
  - image: nginx
    name: my-app
    resources: {}
  dnsPolicy: ClusterFirst
  restartPolicy: Always
status: {}
```

---

## 5. Declarative Deployment: `kubectl apply`

Create the Pod in your cluster using the generated file:

```bash
kubectl apply -f pod.yaml
```

Output:
```text
pod/my-app created
```

Verify that the Pod is running:

```bash
kubectl get pods
```

Output:
```text
NAME     READY   STATUS    RESTARTS   AGE
my-app   1/1     Running   0          25s
```

---

## 6. Accessing the Pod: Port Forwarding

By default, Pods receive internal private IPs that cannot be accessed directly from your host machine's browser. To connect to the Pod from your local machine, use **port-forwarding**:

```bash
kubectl port-forward pod/my-app 8080:80
```

Now open `http://localhost:8080` in your web browser. You will see the standard Nginx welcome page!

### Running Port-Forward in the Background
To avoid blocking your terminal window, append `&` to run the command as a background job:

```bash
kubectl port-forward pod/my-app 8080:80 &
```

To stop the background port-forward process later:

```bash
pkill -f "kubectl port-forward"
```

---

## 7. Deleting a Pod

To delete a Pod, you can either delete it by name or delete it using the manifest file:

```bash
# Delete by Pod name
kubectl delete pod my-app

# Or delete using the manifest file
kubectl delete -f pod.yaml
```

---

## Key Takeaways

1. `kubectl` reads credentials from `~/.kube/config`.
2. Use `--dry-run=client -o yaml` to generate accurate Kubernetes boilerplate manifests.
3. Use `kubectl apply -f <file.yaml>` for declarative resource management.
4. Use `kubectl port-forward` to access private Pod ports from your local machine.

