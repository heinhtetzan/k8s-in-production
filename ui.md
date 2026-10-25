# Markdown UI Showcase & Reference Guide

A visual catalog of UI components, interactive widgets, tables, and diagrams achievable in Markdown.

[![Markdown](https://img.shields.io/badge/Format-GFM_Markdown-blue?style=for-the-badge&logo=markdown)](#)
[![Version](https://img.shields.io/badge/Version-1.0.0-success?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Documentation-Interactive-orange?style=for-the-badge)](#)

---

## 1. Alert & Callout Boxes

GitHub Flavored Markdown supports native styled callout banners for contextual messaging.

> [!NOTE]
> Standard note highlighting helpful background information or references.

> [!TIP]
> Best practices, tips, or performance suggestions to speed up workflows.

> [!IMPORTANT]
> Essential prerequisites, critical operational constraints, or must-know details.

> [!WARNING]
> Potential failure points, breaking changes, or deprecation notices.

> [!CAUTION]
> High-risk operations that could trigger irreversible data loss or downtime.

---

## 2. Interactive Collapsible Sections (`<details>`)

Keep documents clean by hiding secondary information, configurations, or logs behind collapsible panels.

<details>
<summary><b>▶ Click to view sample Kubernetes Deployment YAML</b></summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: server
          image: nginx:1.25-alpine
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "256Mi"
              cpu: "500m"
```

</details>

<details open>
<summary><b>▼ Open by default: Database Connection Specs</b></summary>

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Host** | `postgres.internal.net` | Internal VPC endpoint |
| **Port** | `5432` | Standard PostgreSQL port |
| **SSL Mode** | `require` | Enforced TLS encryption |

</details>

---

## 3. Task Checklists

Track workflows, deployment steps, or runbooks with interactive checkboxes.

- [x] Provision VPC & Subnets on AWS
- [x] Create Amazon EKS cluster with managed node groups
- [x] Install Ingress Controller (`ingress-nginx`)
- [ ] Configure `cert-manager` for automated Let's Encrypt certificates
- [ ] Enable Horizontal Pod Autoscaling (HPA)
- [ ] Set up Prometheus & Grafana alerting rules

---

## 4. Tables with Badges & Formatting

Structure metrics, status dashboards, and configurations with aligned columns.

| Service Name | Namespace | Replicas | CPU / Mem | Health Status | Actions |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `auth-service` | `production` | 3 | 250m / 512Mi | ![Healthy](https://img.shields.io/badge/status-healthy-brightgreen) | [Restart](#) \| [Logs](#) |
| `order-worker` | `production` | 5 | 500m / 1Gi | ![Healthy](https://img.shields.io/badge/status-healthy-brightgreen) | [Restart](#) \| [Logs](#) |
| `payment-gateway`| `production` | 2 | 300m / 256Mi | ![Degraded](https://img.shields.io/badge/status-degraded-orange) | [Restart](#) \| [Logs](#) |
| `legacy-sync` | `staging` | 0 | 0m / 0Mi | ![Offline](https://img.shields.io/badge/status-stopped-lightgrey) | [Start](#) \| [Logs](#) |

---

## 5. Inline UI Elements & Micro-Widgets

Enhance readability with keyboard shortcuts, badges, and progress bars.

* **Keyboard Shortcuts:** Press <kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open Command Palette.
* **Inline Key Combination:** To cancel a command in shell: <kbd>Ctrl</kbd> + <kbd>C</kbd>.
* **Native Progress Bar:**
  * Rolling update progress: <progress value="85" max="100"></progress> **85% complete**
  * Storage quota utilization: <progress value="42" max="100"></progress> **42% used**

---

## 6. Code Differences (`diff`)

Highlight changes in configuration files and source code.

```diff
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: customer-service
  spec:
-   replicas: 1
+   replicas: 5
    template:
      spec:
        containers:
-         - image: customer-service:1.0.4
+         - image: customer-service:1.1.0
          env:
+           - name: ENABLE_REDIS_CACHE
+             value: "true"
```

---

## 7. Diagrams & Architecture (Mermaid)

Render dynamic flowcharts, sequences, and state transitions directly in Markdown.

### 7.1 Architecture Flowchart

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
graph TD
    Client(["Client / Browser"]) --> Route53["AWS Route 53 DNS"]
    Route53 --> CloudFront["AWS CloudFront CDN"]
    CloudFront --> ALB["Application Load Balancer"]
    
    subgraph EKS["Amazon EKS Cluster — Dashed Boundary"]
        ALB --> Ingress["NGINX Ingress Controller"]
        Ingress --> ServiceA["Auth Service Pods"]
        Ingress --> ServiceB["API Gateway Pods"]
        ServiceB --> Worker1[("Worker Pod 1")]
        ServiceB --> Worker2[("Worker Pod 2")]
    end
    
    subgraph DataTier["Data Persistence Tier — Dotted Boundary"]
        ServiceA --> RDS[("Amazon Aurora PostgreSQL")]
        Worker1 --> Redis[("Amazon ElastiCache Redis")]
        Worker2 --> S3[("Amazon S3 Bucket")]
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style EKS fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style DataTier fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 2 3,color:#e2e8f0;

    %% Individual Muted Solid Styling for Every Single Component
    classDef cClient fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cRoute53 fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;
    classDef cCloudFront fill:#1c1b2b,stroke:#58518e,stroke-width:1.5px,color:#e2e8f0;
    classDef cALB fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cIngress fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;
    classDef cAuth fill:#252115,stroke:#8a7030,stroke-width:1.5px,color:#e2e8f0;
    classDef cGateway fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorker1 fill:#152422,stroke:#2e6e65,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorker2 fill:#202315,stroke:#5f6d35,stroke-width:1.5px,color:#e2e8f0;
    classDef cRDS fill:#161f28,stroke:#325f85,stroke-width:1.5px,color:#e2e8f0;
    classDef cRedis fill:#261616,stroke:#853d3d,stroke-width:1.5px,color:#e2e8f0;
    classDef cS3 fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;

    class Client cClient;
    class Route53 cRoute53;
    class CloudFront cCloudFront;
    class ALB cALB;
    class Ingress cIngress;
    class ServiceA cAuth;
    class ServiceB cGateway;
    class Worker1 cWorker1;
    class Worker2 cWorker2;
    class RDS cRDS;
    class Redis cRedis;
    class S3 cS3;
```

### 7.2 Request Sequence Diagram

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'darkMode': true,
    'actorBkg': '#1e293b',
    'actorBorder': '#475569',
    'actorTextColor': '#e2e8f0',
    'signalColor': '#526071',
    'signalTextColor': '#cbd5e1',
    'labelBoxBkgColor': '#1e293b',
    'labelBoxBorderColor': '#475569',
    'labelTextColor': '#e2e8f0',
    'noteBkgColor': '#1e293b',
    'noteBorderColor': '#475569',
    'noteTextColor': '#cbd5e1'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .note rect { stroke-width: 1.5px !important; }'
}}%%
sequenceDiagram
    autonumber
    actor User as Client
    participant Ingress as NGINX Ingress
    participant Service as App Service
    participant DB as Aurora DB

    User->>Ingress: GET /api/v1/orders
    Ingress->>Service: Forward request (Bearer Token)
    Note over Service: Dashed Note: Validate JWT
    Service->>DB: SELECT * FROM orders WHERE user_id = ?
    DB-->>Service: Return dataset (rows)
    Service-->>Ingress: 200 OK (JSON Payload)
    Ingress-->>User: 200 OK (Compressed Gzip)
```

### 7.3 Pod Lifecycle State Machine

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'darkMode': true,
    'primaryColor': '#1e293b',
    'primaryTextColor': '#e2e8f0',
    'primaryBorderColor': '#475569',
    'lineColor': '#64748b',
    'labelColor': '#e2e8f0'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; }'
}}%%
stateDiagram-v2
    [*] --> Pending: Manifest Applied
    Pending --> ContainerCreating: Image Pulling
    ContainerCreating --> Running: Containers Started
    Running --> CrashLoopBackOff: Container Exits Non-Zero
    CrashLoopBackOff --> Running: Auto-Restart Backoff
    Running --> Terminating: SIGTERM Received
    Terminating --> [*]: Evicted / Graceful Exit
```

### 7.4 Extension-Free Universal Embed (Solid Dark SVG)

If an environment does not have Mermaid extensions installed, you can render any Mermaid code directly as a solid dark SVG:

![K8s Deployment Architecture](https://mermaid.ink/svg/pako:eNpVj00KgzAQha8SexbBXtCiF_B6CTdJMZg_kUzEgnfvRIrb7ebNw3uP2Y3BBc_rZ2_W-1a6Xw4L924y0G4i6LbrL1jX3ik2nkyP58cK2kKa18jFf_q773bIXbXWn1kF8p4xS9p1jN7zX-j8Vhky667T0bU23yQjBLoxn5-qIe_uJ-xXSzRnx8u2bV_qR2gZ?bgColor=!0f172a)

---

## 8. Mathematical & Scientific Formulas (LaTeX)

Render formulas for scaling, capacity planning, and metrics.

Horizontal Pod Autoscaler (HPA) target calculation:

$$ \text{Desired Replicas} = \left\lceil \text{Current Replicas} \times \left( \frac{\text{Current Metric Value}}{\text{Target Metric Value}} \right) \right\rceil $$

Service Level Availability (SLA):

$$ \text{Availability} = \frac{\text{Total Time} - \text{Downtime}}{\text{Total Time}} \times 100\% $$
