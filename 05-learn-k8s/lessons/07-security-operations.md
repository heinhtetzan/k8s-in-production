# Lesson 7 — Security and operations

## Goal

Learn safe defaults for workloads and a repeatable troubleshooting sequence.

## Least privilege

A Kubernetes ServiceAccount is an identity for a workload. Do not grant broad cluster-admin permissions to application Pods. Create a Role for only the needed namespace actions, bind it to a dedicated ServiceAccount, and disable automatic token mounting when the app does not call the Kubernetes API:

```yaml
spec:
  serviceAccountName: hello-api
  automountServiceAccountToken: false
```

Other useful defaults include running as a non-root user, dropping Linux capabilities, using a read-only root filesystem where practical, and scanning/pinning images. Validate security settings against what the application needs.

## RBAC scope

- `Role` grants permissions in one namespace.
- `ClusterRole` grants cluster-wide or reusable permissions.
- `RoleBinding` or `ClusterRoleBinding` attaches permissions to a user, group, or ServiceAccount.

Start with read-only and narrow resource verbs. Avoid wildcard resources and verbs unless there is a clear requirement.

## Troubleshooting sequence

```sh
kubectl get deploy,rs,pods,svc
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl get events --sort-by=.lastTimestamp
kubectl get endpointslice -l kubernetes.io/service-name=hello-service
```

Common clues:

| Symptom | First checks |
|---|---|
| `Pending` | Events, node capacity, requests, PVC binding, scheduling constraints |
| `ImagePullBackOff` | Image name/tag, registry access, pull secret, local kind image load |
| `CrashLoopBackOff` | Current and previous logs, command, environment, probes |
| Running but not reachable | Readiness, Service selector/ports, EndpointSlices, app bind address, network policy |

Use `kubectl exec` only for targeted diagnosis; logs and events are usually a better first step. Avoid printing secrets into terminal history or logs.

## Updates and rollbacks

```sh
kubectl rollout status deployment/hello-api
kubectl rollout history deployment/hello-api
kubectl rollout undo deployment/hello-api
```

A rollback restores an earlier Deployment template; it cannot reverse database schema changes or external side effects. Plan application and data changes together.

## Exercise

Cause a harmless failure by temporarily setting an invalid image tag. Use `describe` and events to find the issue, correct the tag, and confirm rollout completion.

**Next:** [Production patterns and EKS](08-production-eks.md).
