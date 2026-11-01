# Module 05: Learn Kubernetes (K8s)

[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28+-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](#)
[![Kind](https://img.shields.io/badge/Local_Cluster-Kind%20%7C%20K3s-black?style=for-the-badge&logo=docker)](#)
[![Tools](https://img.shields.io/badge/TUI-k9s-orange?style=for-the-badge)](#)

A practical, hands-on curriculum taking you from container orchestration fundamentals to mastering core Kubernetes primitives (Pods, Deployments, Services, ConfigMaps, Secrets, Storage, Probes, and Autoscaling) running locally in **Kind** / **K3s** and preparing for cloud production on **AWS EKS**, **GCP GKE**, and **Azure AKS**.

---

## 🗺️ Curriculum Roadmap

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'darkMode': true,
    'background': '#0f172a',
    'primaryColor': '#1e293b',
    'primaryTextColor': '#e2e8f0',
    'primaryBorderColor': '#475569',
    'lineColor': '#64748b',
    'textColor': '#e2e8f0',
    'edgeLabelBackground': '#0f172a'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; } .cluster * { filter: none !important; }'
}}%%
flowchart TD
    L1["01. What is Kubernetes?<br/>Why K8s, Features, Docker vs K8s, Local & Cloud"] --> L2["02. Local K8s with Kind<br/>Kind CLI, kubectl boundary & image loading secret"]
    L2 --> L3["03. Hands-On with kubectl<br/>Contexts, Pods, Deployments & Port-Forwarding"]
    L3 --> L4["04. Services & Networking<br/>ClusterIP, NodePort, LoadBalancer & CoreDNS"]
    L4 --> L5["05. Configuration & Secrets<br/>ConfigMaps, Secrets & MySQL Lab"]
    L5 --> L6["06. What You Need to Learn More<br/>Probes, Ingress, HPA & Bridge to Production EKS"]

    classDef active fill:#1f1929,stroke:#7c5295,stroke-width:2px,color:#ffffff;
    classDef capstone fill:#15241d,stroke:#22c55e,stroke-width:2px,color:#ffffff;

    class L1,L2,L3,L4,L5 active;
    class L6 capstone;
```

---

## 📚 Lessons Overview

| Lesson | Title | Core Topics | Status |
| :---: | :--- | :--- | :---: |
| **01** | **[What is Kubernetes? Architecture, Features & Ecosystem](./01-what-is-kubernetes.md)** | • Why we need orchestration & main features<br>• Docker vs. Docker Compose vs. Kubernetes<br>• Local (Kind, K3s, K9s) vs. Cloud (AWS EKS, GCP GKE, Azure AKS)<br>• Curriculum strategy: Kind local & AWS EKS production | ✅ Ready |
| **02** | **[Kubernetes in Local with Kind](./02-kubernetes-in-local-with-kind.md)** | • Installing `kind` & `kubectl`<br>• Cluster lifecycle (`create`, `get`, `delete`)<br>• `kind` manages clusters vs. `kubectl` manages workloads<br>• The extra secret: `kind load docker-image` & `imagePullPolicy` | ✅ Ready |
| **03** | **[Hands-On with kubectl: Contexts, Pods, Deployments & Port-Forwarding](./03-kubectl-commands-pods-and-networking.md)** | • Context management (`get-contexts`, `use-context`)<br>• Pod creation (imperative vs `--dry-run=client -o yaml`)<br>• Deployments & self-healing verification<br>• Network testing via `kubectl port-forward` | ✅ Ready |
| **04** | **[Kubernetes Services & Internal Networking](./04-services-and-networking.md)** | • The ephemeral Pod IP problem<br>• Service types: `ClusterIP`, `NodePort`, `LoadBalancer`<br>• Port mapping (`port` vs `targetPort` vs `nodePort`)<br>• In-cluster DNS with CoreDNS & round-robin load balancing | ✅ Ready |
| **05** | **[Application Configuration & Secrets (MySQL Lab)](./05-application-configuration-and-secrets.md)** | • The 12-factor decoupling principle<br>• ConfigMaps (env vars & mounting custom `my.cnf`)<br>• Secrets (`Opaque`, base64 myth, etcd encryption)<br>• Hands-on MySQL deployment & client query lab | ✅ Ready |
| **06** | **[What You Need to Learn More & Bridge to Production EKS](./06-what-you-need-to-learn-more.md)** | • Probes & graceful termination (`preStop` hooks)<br>• CPU/Memory requests & limits<br>• AWS ALB Ingress & Wildcard ACM SSL<br>• Horizontal Pod Autoscaler (HPA)<br>• Managed AWS RDS vs StatefulSets<br>• External Secrets Operator & Capstone Roadmap | ✅ Ready |
| **07** | **Rollouts & Autoscaling** | • RollingUpdate tuning (`maxSurge`, `maxUnavailable`)<br>• Rollback commands (`rollout undo`), HPA autoscaling | ⏳ Upcoming |
| **08** | **Observability, Security & Production Patterns** | • Mastering `k9s` and `kubectl describe/logs/exec`<br>• Resource requests/limits, SecurityContext & EKS promotion | ⏳ Upcoming |

