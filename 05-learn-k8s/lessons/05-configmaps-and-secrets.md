# Lesson 5 — ConfigMaps, Secrets & Rolling Updates

## Objective
Learn how to decouple application configuration from container images using **ConfigMaps** and **Secrets**, inject them as environment variables into your Deployments, observe automatic **Rolling Updates**, and verify values directly inside running containers.

---

## 1. Why ConfigMaps & Secrets?

According to the **Twelve-Factor App** methodology, configuration should always be strictly separated from code.
* You should **never** hardcode environment variables, database URLs, or API keys inside your Docker image.
* You should **never** rebuild a Docker container image just because an environment variable changed between development, staging, and production.

Kubernetes solves this with two objects:
1. **ConfigMap**: For non-sensitive configurations (ports, feature flags, API endpoints, log levels).
2. **Secret**: For confidential data (passwords, TLS certificates, database credentials, API tokens).

---

## 2. Creating a ConfigMap

Create a ConfigMap named `api-config` with a custom message:

```bash
kubectl create configmap api-config --from-literal=MESSAGE="Hello Kubernetes from ConfigMap!"
```

Inspect the created ConfigMap:

```bash
kubectl get configmap api-config -o yaml
```

Output:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  MESSAGE: Hello Kubernetes from ConfigMap!
```

---

## 3. Injecting ConfigMap as an Environment Variable

In [hello-api-deployment.yaml](hello-api-deployment.yaml), add the `env:` block under `containers`:

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
        env:
        - name: MESSAGE
          valueFrom:
            configMapKeyRef:
              name: api-config
              key: MESSAGE
```

### Explanation:
* **`name: MESSAGE`**: The environment variable name available inside the Linux container.
* **`valueFrom.configMapKeyRef`**: Tells Kubernetes to read the value dynamically from the `api-config` ConfigMap under the key `MESSAGE`.

---

## 4. Automatic Rolling Updates

Apply the updated Deployment:

```bash
kubectl apply -f hello-api-deployment.yaml
```

Watch the pods immediately after applying:

```bash
kubectl get pods -l app=hello-api-deploy
```

Output:
```text
NAME                                READY   STATUS        RESTARTS   AGE
hello-api-deploy-5fc5c9b49d-52bb7   1/1     Terminating   0          2m
hello-api-deploy-5fc5c9b49d-d9jbg   1/1     Terminating   0          23m
hello-api-deploy-65f4964bbc-48z4s   1/1     Running       0          5s
hello-api-deploy-65f4964bbc-9ggps   1/1     Running       0          4s
hello-api-deploy-65f4964bbc-hzctg   1/1     Running       0          5s
```

### What happened?
Because the `template` specification changed, Kubernetes automatically initiated a **Rolling Update**:
1. It created new Pods with the new environment configuration.
2. It waited for the new Pods to become healthy and ready.
3. Only then did it terminate the old Pods.

This ensures zero downtime for your users during configuration updates or new image deployments!

---

## 5. Verifying the Injected Variable

You can execute commands inside one of the deployment's pods to verify the environment variable:

```bash
kubectl exec deployment/hello-api-deploy -- printenv MESSAGE
```

Output:
```text
Hello Kubernetes from ConfigMap!
```

---

## 6. Managing Sensitive Data with Secrets

For passwords and private tokens, use a Kubernetes **Secret**.

### Step 1: Create the Secret
```bash
kubectl create secret generic api-secret --from-literal=API_KEY="supersecret123"
```

Inspect the Secret:

```bash
kubectl get secret api-secret -o yaml
```

Notice that Kubernetes stores Secret values as **Base64-encoded strings**:
```yaml
apiVersion: v1
data:
  API_KEY: c3VwZXJzZWNyZXQxMjM=
kind: Secret
metadata:
  name: api-secret
type: Opaque
```

*(You can decode it locally with `echo "c3VwZXJzZWNyZXQxMjM=" | base64 --decode`)*.

### Step 2: Inject the Secret into the Deployment
Add the secret to the `env:` array in [hello-api-deployment.yaml](hello-api-deployment.yaml):

```yaml
        env:
        - name: MESSAGE
          valueFrom:
            configMapKeyRef:
              name: api-config
              key: MESSAGE
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secret
              key: API_KEY
```

Apply and verify:

```bash
kubectl apply -f hello-api-deployment.yaml
kubectl exec deployment/hello-api-deploy -- printenv API_KEY
```

Output:
```text
supersecret123
```

Kubernetes automatically decoded the base64 Secret and presented the plaintext value to your container process!

---

## Summary of the Complete Journey

Congratulations! Through this hands-on course, you have mastered:

```
[Local Docker Daemon] 
       | (kind load)
       v
[Kind Node Container (containerd)]
       |
       +---> [Deployment: hello-api-deploy (3 Replicas)]
       |          ^                  ^
       |          | (configMapKeyRef)| (secretKeyRef)
       |     [ConfigMap]          [Secret]
       |          ^
       |          | (Endpoints auto-discovery)
       |     [Service: hello-api-svc (ClusterIP)]
       |          ^
       |          | (CoreDNS: http://hello-api-svc:3000)
       +---> [Pod: hello-shop (Vite + Nginx)]
                  ^
                  | (kubectl port-forward 8080:80)
             [Host Browser]
```

1. **Pods**: Basic execution unit, YAML authoring with `--dry-run=client`, port-forwarding, and immutability.
2. **Kind Architecture**: Local image caches, containerd inside nodes, and the `imagePullPolicy: IfNotPresent` gotcha.
3. **Services & CoreDNS**: Decoupling ephemeral Pod IPs, load balancing, and discovering services by name.
4. **Deployments**: Self-healing auto-recovery, horizontal scaling, and zero-downtime rolling updates.
5. **ConfigMaps & Secrets**: 12-factor configuration separation and secure credential injection.

