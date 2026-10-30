# Lesson 6 — Reliability and scaling

## Goal

Use health probes, resource requests and limits, and replica scaling to make behavior predictable under load and failure.

## Health checks mean different things

- **Startup probe** gives a slow-starting application time to initialize. Liveness and readiness checks wait until it succeeds.
- **Liveness probe** asks whether a container should be restarted.
- **Readiness probe** asks whether a Pod should receive Service traffic.

A failed readiness probe removes the Pod from ready service endpoints; it does not restart the container. A failed liveness probe triggers a restart after the configured threshold. Probe endpoints should reflect the real health condition and avoid expensive dependency cascades.

```yaml
startupProbe:
  httpGet: { path: /health, port: http }
  periodSeconds: 5
  failureThreshold: 12
readinessProbe:
  httpGet: { path: /ready, port: http }
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /health, port: http }
  periodSeconds: 10
```

Use a named container port `http` with value 3000 for this snippet.

## Resource requests and limits

- **Request**: resource amount used for scheduling and baseline allocation decisions.
- **Limit**: maximum allowed usage for a container (CPU is throttled; memory over limit can cause termination).

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

These values are examples, not universal recommendations. Measure your application and understand its memory behavior. Pods that request too much may remain Pending; limits that are too low can throttle or restart the app.

## Manual scaling and autoscaling

```sh
kubectl scale deployment/hello-api --replicas=4
```

A HorizontalPodAutoscaler (HPA) adjusts replicas from observed metrics. CPU-based scaling needs resource requests and a metrics pipeline:

```sh
kubectl autoscale deployment hello-api --min=2 --max=8 --cpu=70%
kubectl get hpa
```

In a local cluster, HPA may show unknown metrics until metrics-server is installed and configured. Autoscaling is not magic: set sensible bounds, ensure the app can start quickly, and ensure dependent systems can handle the extra load.

## Exercise

1. Add readiness and liveness probes to the app Deployment.
2. Set conservative resource requests and limits.
3. Observe `kubectl describe pod` and `kubectl get pods`.
4. Scale replicas manually; note how endpoint count changes.

**Next:** [Security and operations](07-security-operations.md).
