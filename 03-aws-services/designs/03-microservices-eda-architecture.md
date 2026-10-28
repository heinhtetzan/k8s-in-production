# Architecture 3: Enterprise Cloud-Native & Event-Driven Architecture (EKS + Lambda + EventBridge + DynamoDB + Bedrock)

A state-of-the-art enterprise microservices platform built on Kubernetes (**Amazon EKS**), serverless compute (**AWS Lambda**), an Event-Driven Architecture (**EDA**) bus (**Amazon EventBridge**), polyglot persistence, and Generative AI (**Amazon Bedrock**).

---

## 🏗️ Architecture Diagram

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
    Clients(["Web, Mobile & IoT Clients"]) -->|1. Anycast DNS| R53["Amazon Route 53"]
    R53 --> CF["Amazon CloudFront (Edge CDN)<br/>+ AWS WAF (Rate Limiting)"]

    subgraph IngressGateway["Ingress & API Gateway Layer"]
        CF -->|HTTP REST / GraphQL| APIGW["Amazon API Gateway<br/>(Serverless Edge Endpoints)"]
        CF -->|Microservices Ingress| ALB["Application Load Balancer<br/>(AWS LB Controller)"]
    end

    subgraph ContainerCompute["Kubernetes Microservices Mesh (Amazon EKS)"]
        ECR[("Amazon ECR<br/>(Private Registry)")] -.->|Pulls Images| EKS_Nodes

        subgraph EKS_Nodes["EKS Cluster (VPC Subnets - Multi-AZ)"]
            OrderSvc["Order Service<br/>(Go Pods - Deployment)"]
            UserSvc["User Service<br/>(Node.js Pods - Deployment)"]
            PaySvc["Payment Service<br/>(Rust Pods - Deployment)"]
            SearchSvc["Search & Catalog Svc<br/>(Python Pods - Deployment)"]
        end
        ALB --> OrderSvc & UserSvc & SearchSvc
    end

    subgraph EventDrivenBackbone["Event-Driven Architecture (EDA) Backbone"]
        EventBridge{{"Amazon EventBridge<br/>(Central Domain Event Bus)"}}

        OrderSvc -->|2. Emits: OrderPlaced| EventBridge
        PaySvc -->|Emits: PaymentCompleted| EventBridge

        EventBridge -->|Route: Order Events| SQS_Order[("Amazon SQS<br/>(Order Processing Queue)")]
        EventBridge -->|Route: Notification Events| SNS_Fanout(("Amazon SNS<br/>(Fan-Out Topic)"))

        SNS_Fanout --> SQS_Email[("SQS: Email Queue")]
        SNS_Fanout --> SQS_Analytics[("SQS: Data Pipeline")]
    end

    subgraph ServerlessCompute["Serverless Worker Layer (AWS Lambda)"]
        SQS_Order --> Lambda_Fulfill["AWS Lambda<br/>(Fulfillment Worker)"]
        SQS_Email --> Lambda_Notify["AWS Lambda<br/>(Notification Sender)"]
        APIGW --> Lambda_Auth["AWS Lambda<br/>(Auth & Webhooks)"]
    end

    subgraph PolyglotPersistence["Polyglot Persistence Layer"]
        DynamoDB[("Amazon DynamoDB<br/>(Single-Digit ms Latency)")]
        Aurora[("Amazon Aurora Serverless v2<br/>(Financial Ledger - PostgreSQL)")]
        OpenSearch[("Amazon OpenSearch Service<br/>(Catalog Search & Vector Index)")]
        S3[("Amazon S3 & S3 Vectors<br/>(Invoices, Media & Embeddings)")]

        OrderSvc --> DynamoDB
        PaySvc --> Aurora
        SearchSvc --> OpenSearch
        Lambda_Fulfill --> S3
    end

    subgraph CDCSync["Change Data Capture (CDC)"]
        DynamoDB -.->|DynamoDB Streams| Lambda_CDC["AWS Lambda<br/>(Stream Consumer)"]
        Lambda_CDC -.->|Sync Search Index| OpenSearch
    end

    subgraph AILayer["The AWS AI & Agent Layer"]
        AgentCore["Bedrock AgentCore<br/>(Autonomous Multi-Step Agent)"]
        Bedrock["Amazon Bedrock & Nova<br/>(Foundation Model Inference)"]
        KB["Bedrock Knowledge Bases<br/>(Managed RAG Pipeline)"]

        SearchSvc --> AgentCore
        AgentCore --> Bedrock
        AgentCore --> KB
        KB -->|Vector Similarity Queries| S3
        AgentCore -.->|Executes Actions| APIGW
    end

    subgraph TelemetrySecurity["Observability & Zero-Trust Security"]
        CW["Amazon CloudWatch<br/>(Unified Logs & Metrics)"]
        XRay["AWS X-Ray<br/>(Distributed Tracing)"]
        SM["AWS Secrets Manager<br/>(CSI Secret Provider)"]
        KMS["AWS KMS<br/>(Envelope Encryption)"]

        EKS_Nodes & ServerlessCompute -.-> CW
        EKS_Nodes & ServerlessCompute -.-> XRay
        SM & KMS -.-> EKS_Nodes
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style IngressGateway fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style ContainerCompute fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style EKS_Nodes fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;
    style EventDrivenBackbone fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style ServerlessCompute fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style PolyglotPersistence fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style CDCSync fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;
    style AILayer fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style TelemetrySecurity fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    %% Component Classes
    classDef cClient fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cR53 fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;
    classDef cCF fill:#1c1b2b,stroke:#58518e,stroke-width:1.5px,color:#e2e8f0;
    classDef cNet fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cCompute fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorker fill:#202315,stroke:#5f6d35,stroke-width:1.5px,color:#e2e8f0;
    classDef cQueue fill:#261824,stroke:#853878,stroke-width:1.5px,color:#e2e8f0;
    classDef cDB fill:#161f28,stroke:#325f85,stroke-width:1.5px,color:#e2e8f0;
    classDef cStorage fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;
    classDef cAI fill:#142426,stroke:#2b757e,stroke-width:1.5px,color:#e2e8f0;
    classDef cSec fill:#252115,stroke:#8a7030,stroke-width:1.5px,color:#e2e8f0;
    classDef cObs fill:#1c2420,stroke:#3a7357,stroke-width:1.5px,color:#e2e8f0;

    class Clients cClient;
    class R53 cR53;
    class CF cCF;
    class APIGW,ALB cNet;
    class OrderSvc,UserSvc,PaySvc,SearchSvc cCompute;
    class Lambda_Fulfill,Lambda_Notify,Lambda_Auth,Lambda_CDC cWorker;
    class EventBridge,SQS_Order,SQS_Email,SQS_Analytics,SNS_Fanout cQueue;
    class DynamoDB,Aurora,OpenSearch cDB;
    class S3,ECR cStorage;
    class AgentCore,Bedrock,KB cAI;
    class SM,KMS cSec;
    class CW,XRay cObs;
```

---

## 🔑 Key Architectural Paradigms

### 1. Hybrid Compute: Kubernetes (EKS) + Serverless (Lambda)
* **Amazon EKS**: Hosts long-running, latency-sensitive microservices (`Order Service`, `User Service`, `Search Service`) with horizontal pod autoscaling (HPA) and Karpenter node provisioning on Graviton EC2 instances.
* **AWS Lambda**: Handles asynchronous bursty events, webhook integrations, and SQS queue processing where zero idle cost is desired.
* **Security**: Both EKS pods and Lambda functions access AWS resources using **EKS Pod Identity** or IAM execution roles—**zero static AWS access keys** in containers.

---

### 2. Event Choreography via Amazon EventBridge
Instead of synchronous point-to-point HTTP calls between microservices (which creates cascading failures and tight coupling), services communicate via an **Event-Driven Choreography** pattern:

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
    actor Customer
    participant OrderSvc as EKS: Order Service
    participant Bus as Amazon EventBridge
    participant SQS as Amazon SQS
    participant PaySvc as EKS: Payment Service
    participant Lambda as Lambda: Email Worker

    Customer->>OrderSvc: POST /orders
    OrderSvc->>OrderSvc: Save Order (Status: Pending)
    OrderSvc->>Bus: Emit Event "OrderPlaced"
    OrderSvc-->>Customer: 201 Created (Instant Response)

    par Async Processing via Bus Rules
        Bus->>SQS: Route to Payment Queue
        SQS->>PaySvc: Process Credit Card
        PaySvc->>Bus: Emit Event "PaymentCompleted"
    and
        Bus->>Lambda: Trigger Notification
        Lambda->>Customer: Send Confirmation Email
    end
```

---

### 3. Polyglot Persistence: Right Tool for the Right Job
Modern architectures reject the "one database fits all" anti-pattern:
* **Amazon DynamoDB**: Chosen for the `Order Service` for sub-10ms predictable write latency at any scale.
* **Amazon Aurora Serverless v2**: Chosen for `Payment Service` where ACID transactions, foreign keys, and double-entry bookkeeping are mandatory.
* **Amazon OpenSearch Service**: Serves product search, auto-complete, and faceted filtering.
* **Amazon S3**: Stores immutable invoices, contract PDFs, and AI vector embeddings.

---

### 4. Change Data Capture (CDC) with DynamoDB Streams
To keep OpenSearch in sync with DynamoDB without double-writing from application code:
1. `Order Service` writes directly to DynamoDB.
2. **DynamoDB Streams** emits a record of every change (`INSERT`, `MODIFY`, `REMOVE`).
3. A dedicated **AWS Lambda** stream processor receives batches of changes and indexes them directly into **Amazon OpenSearch Service**.
4. Eliminates distributed transaction failures!

---

### 5. Generative AI & Autonomous Agent Layer (Amazon Bedrock)
* **Foundation Models**: The `Search & Catalog Service` invokes **Amazon Nova 2 Lite** and Anthropic Claude via the unified **Amazon Bedrock** API.
* **Bedrock Knowledge Bases (RAG)**: Automatically chunks and retrieves relevant product manuals, internal knowledge, and reviews from **S3 Vectors** to answer customer questions accurately without hallucinations.
* **Bedrock AgentCore**: Production agent runtime capable of multi-step reasoning. An agent can understand a customer query (*"Find my order from last Tuesday and update shipping address"*), check the order database via API Gateway, and execute the address update autonomously.

---

### 6. Observability: Distributed Tracing with AWS X-Ray & OpenTelemetry
* Every incoming HTTP request gets injected with a unique `X-Amzn-Trace-Id` at CloudFront/ALB.
* Microservices pass this trace header across internal HTTP calls and EventBridge event envelopes.
* **AWS X-Ray** correlates traces end-to-end across EKS containers, SQS queues, Lambda functions, and DynamoDB tables into a visual service dependency graph.

---

## 📊 Evolution Comparison: From Monolith to Event-Driven

| Architectural Dimension | [Architecture 1 (Single EC2)](01-basic-ec2-architecture.md) | [Architecture 2 (Scaled Multi-AZ)](02-horizontal-scaling-architecture.md) | **Architecture 3 (Cloud-Native EDA)** |
| :--- | :--- | :--- | :--- |
| **Compute Engine** | 1x EC2 Instance (Monolith) | Auto Scaling EC2 Fleet | **Amazon EKS (K8s) + AWS Lambda** |
| **Availability** | Single AZ (High Risk) | Multi-AZ (99.99%) | **Multi-AZ + Edge Anywhere (99.999%)** |
| **Database** | Single RDS SQL Instance | Primary + Read Replicas + Redis | **Polyglot (DynamoDB + Aurora + OpenSearch)** |
| **Inter-Service Comms** | In-process function calls | In-process + SQS background jobs | **Asynchronous EventBridge + SQS/SNS** |
| **Deployment Model** | SSH / Manual Script / Downtime | Blue/Green or Rolling via CodeDeploy | **GitOps (ArgoCD / EKS) + Serverless CI/CD** |
| **AI Integration** | None | Ad-hoc external API calls | **Native Bedrock RAG + AgentCore Execution** |
| **Failure Blast Radius** | Total system outage | Subnet / Single instance crash | **Isolated to single microservice boundary** |
