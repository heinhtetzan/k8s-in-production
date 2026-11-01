# Lesson 3 — Services & Cluster Networking

## Objective
Learn why Services are essential in Kubernetes, create a `ClusterIP` Service, understand labels and selectors, test internal CoreDNS service discovery between Pods, and inspect how `Endpoints` route traffic under the hood.

---

## 1. Why Do We Need Services?

In Kubernetes, Pods are ephemeral:
* If a Pod crashes, is rescheduled, or is deleted, Kubernetes replaces it with a new Pod.
* Every new Pod gets assigned a **brand new internal IP address**.

If your frontend (`hello-shop`) needed to connect directly to the backend Pod's IP (`10.244.0.9`), every single restart would break your application.

A **Service** provides:
1. A **stable virtual IP** (`ClusterIP`) that never changes throughout the life of the Service.
2. A **stable internal DNS name** managed by CoreDNS (e.g., `http://hello-api-svc:3000`).
3. Automatic **load balancing** across all matching healthy Pods.

---

## 2. Generating the Service Manifest

Generate a Service configuration for `hello-api`:

```bash
kubectl expose pod hello-api --port=3000 --name=hello-api-svc --dry-run=client -o yaml > hello-api-svc.yaml
```

### Inspecting `hello-api-svc.yaml`:
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
    run: hello-api
status:
  loadBalancer: {}
```

### Anatomy of the Service:
* **`port: 3000`**: The port that the Service itself listens on inside the cluster.
* **`targetPort: 3000`**: The actual port inside the destination Pod container where your application is running.
* **`selector: run: hello-api`**: The query Kubernetes uses to find target Pods. Any Pod bearing the label `run: hello-api` automatically receives traffic sent to this Service.

---

## 3. Applying and Verifying the Service

Apply the Service manifest:

```bash
kubectl apply -f hello-api-svc.yaml
```

List active services in the cluster:

```bash
kubectl get svc
```

Expected output:
```text
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
hello-api-svc   ClusterIP   10.96.179.135   <none>        3000/TCP   30s
kubernetes      ClusterIP   10.96.0.1       <none>        443/TCP    178m
```

The Service has been assigned a permanent internal virtual IP (`10.96.179.135`).

---

## 4. Internal DNS in Action: Testing Pod-to-Pod Communication

Kubernetes runs a cluster DNS service (**CoreDNS**). Any Pod in the same namespace can communicate with `hello-api-svc` simply by using its name as the hostname:

```text
http://<service-name>:<port>
http://hello-api-svc:3000
```

Test calling the API from inside the `hello-shop` frontend container using `kubectl exec`:

```bash
kubectl exec hello-shop -- wget -qO- http://hello-api-svc:3000
```

Output:
```text
hello
```

`hello-shop` resolved `hello-api-svc` through CoreDNS and reached the backend seamlessly.

---

## 5. Under the Hood: Endpoints & IP Mapping

How does Kubernetes know where to route incoming traffic sent to `hello-api-svc`?

Whenever a Service is created with a `selector`, Kubernetes automatically generates an **`Endpoints`** (or `EndpointSlice`) object with the same name:

```bash
kubectl get endpoints hello-api-svc
```

Output:
```text
NAME            ENDPOINTS         AGE
hello-api-svc   10.244.0.9:3000   2m
```

Now run `kubectl get pods -o wide` to inspect the actual private IPs of your Pods:

```bash
kubectl get pods -o wide
```

Output:
```text
NAME         READY   STATUS    IP           NODE                  NOMINATED NODE   READINESS GATES
hello-api    1/1     Running   10.244.0.9   hello-control-plane   <none>           <none>
hello-shop   1/1     Running   10.244.0.10  hello-control-plane   <none>           <none>
```

Notice that `10.244.0.9:3000` is the exact internal IP of the `hello-api` Pod! The Service acts as a dynamic router that maintains this list of active Pod IPs automatically.

---

## Key Takeaways

1. Never target Pod IPs directly; always communicate through a **Service**.
2. Services use **Selectors** to route traffic to Pods with matching **Labels**.
3. Built-in **CoreDNS** enables microservices to find each other by name (e.g., `http://hello-api-svc:3000`).
4. **Endpoints** bridge the stable Service IP to dynamic Pod container IPs.

