# AWS Services Roadmap & Architecture Guide (2026 Edition)

An exhaustive reference guide to core and advanced Amazon Web Services (AWS) architectures, categorised across 5 functional pillars directly matching the **AWS Services Roadmap #2026**.

---

## 🧭 Classification Legend

| Badge | Type | Meaning & Production Usage |
| :---: | :--- | :--- |
| 🔵 | **CORE** | Foundational services essential for virtually every modern production architecture. |
| ⚪ | **DEPTH** | Specialized, advanced, or high-scale alternatives for specific enterprise architectures. |
| 🟣 | **AI** | Foundation models, generative AI platforms, autonomous agents, and machine learning infrastructure. |
| 🟧 | **NEW #2026** | Cutting-edge generation features, hardware accelerators, and architectural paradigm shifts. |

---

## 📐 Production Architecture Evolution Blueprints

Explore the three detailed end-to-end architecture diagrams illustrating the evolutionary path from single-server MVP to cloud-native event-driven microservices:

| Stage | Blueprint | Key Components & Technologies | Purpose & Scale |
| :---: | :--- | :--- | :--- |
| **01** | **[Architecture 1: Single-Server Baseline](01-basic-ec2-architecture.md)** | Route 53, VPC, EC2, EBS, RDS, S3, CloudWatch | Simple monolith MVP, low cost, baseline infrastructure |
| **02** | **[Architecture 2: Horizontally Scaled Multi-AZ](02-horizontal-scaling-architecture.md)** | CloudFront, ALB, Auto Scaling (ASG), ElastiCache (Redis), Aurora/RDS Read Replicas, SQS, SES | High-traffic resilience, zero downtime, asynchronous offloading |
| **03** | **[Architecture 3: Event-Driven Microservices](03-microservices-eda-architecture.md)** | EKS (Kubernetes), Lambda, EventBridge, ECR, DynamoDB, OpenSearch, Bedrock (AI/RAG), X-Ray | Enterprise scale, polyglot persistence, autonomous AI agents |
| **CLI** | **[AWS CLI Operations Guide](aws-cli.md)** | Authentication, Profiles, Logout, S3, EC2, RDS | Terminal guide, EC2 launch & lifecycle, RDS provision & snapshots, S3 sync |
| **IAM** | **[AWS IAM & Security Guide](aws-iam.md)** | Users, Policies, AdminAccess, S3 Only, EC2 Only, EKS | Least-privilege policies, EKS Access Entries, Pod Identity |

---

# Pillar 1: Compute & Storage

High-performance computing runtimes and persistent storage backends powering containerised microservices, Kubernetes clusters, and cloud-native workflows.

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
graph LR
    subgraph Registry["Container Image Storage"]
        ECR[("ECR<br/>(Docker & OCI Registry)")]
    end

    subgraph Compute["Compute & Orchestration Layer"]
        EC2["EC2<br/>(Virtual Servers / Nodes)"]
        EKS["EKS<br/>(Kubernetes Control Plane)"]
        ECS["ECS<br/>(Container Orchestration)"]
        Fargate["AWS Fargate<br/>(Serverless Containers)"]
        Lambda["AWS Lambda<br/>(Event-Driven Functions)"]
    end

    subgraph Storage["Persistent Storage Layer"]
        S3[("S3<br/>(Object Store & Vectors)")]
        EBS[("EBS<br/>(Block Volumes - RWO)")]
        EFS[("EFS<br/>(Shared NFS - RWX)")]
    end

    ECR -->|Pulls Images| EKS
    ECR -->|Pulls Images| ECS
    ECR -->|Pulls Images| Fargate
    ECR -->|Pulls Images| Lambda
    EC2 --- EBS
    EKS --> Fargate
    EKS --- EFS
    Lambda --> S3

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style Registry fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style Compute fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style Storage fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    %% Component Classes
    classDef cCompute fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorker fill:#202315,stroke:#5f6d35,stroke-width:1.5px,color:#e2e8f0;
    classDef cStorage fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;

    class EC2,EKS,ECS,Fargate cCompute;
    class Lambda cWorker;
    class ECR,S3,EBS,EFS cStorage;
```

---

### 💻 1.1 Compute Services

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Compute/48/Arch_Amazon-EC2_48.png" width="32" /> **Amazon EC2** | Compute | 🔵 CORE<br>🟧 **NEW** | **Virtual servers with full OS and kernel control.**<br>• Serves as the compute foundation for self-managed nodes, heavy GPU inference rigs, and custom OS requirements.<br>• 🟧 **NEW (Graviton5)**: Latest ARM-based silicon generation delivering up to 25% higher compute performance and reduced energy consumption compared to Graviton4. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Containers/48/Arch_Amazon-Elastic-Container-Service_48.png" width="32" /> **Amazon ECS** | Compute | 🔵 CORE<br>🟧 **NEW** | **AWS-native managed container orchestration.**<br>• Lightweight, deeply integrated with IAM, CloudWatch, and ALB without the management overhead of Kubernetes.<br>• 🟧 **NEW (Faster Scaling)**: 20-second metrics collection with a ~86-second scale-out trigger in official AWS benchmarks. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Containers/48/Arch_AWS-Fargate_48.png" width="32" /> **AWS Fargate** | Compute | 🔵 CORE | **Serverless compute engine for containers.**<br>• Runs containers on both ECS and EKS without provisioning, scaling, or patching EC2 host instances.<br>• Pay solely for requested CPU, memory, and ephemeral storage per pod/task. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Compute/48/Arch_AWS-Lambda_48.png" width="32" /> **AWS Lambda** | Compute | 🔵 CORE<br>🟧 **NEW** | **Serverless, event-driven functions.**<br>• Executes code in response to S3 uploads, SQS messages, API Gateway requests, or EventBridge triggers.<br>• 🟧 **NEW (Durable Functions)**: Stateful, resilient code execution with automatic checkpointing and pause/resume capabilities supporting workflows lasting up to one full year. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Containers/48/Arch_Amazon-Elastic-Kubernetes-Service_48.png" width="32" /> **Amazon EKS** | Compute | ⚪ DEPTH | **Managed upstream Kubernetes on AWS.**<br>• Manages control plane availability, automated version upgrades, VPC CNI native IP pod networking, and IAM Roles for Service Accounts (IRSA / Pod Identity).<br>• Industry standard for multi-cloud, GitOps, microservices, and enterprise production platforms. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Compute/48/Arch_AWS-Elastic-Beanstalk_48.png" width="32" /> **AWS Elastic Beanstalk** | Compute | ⚪ DEPTH<br>🟧 **NEW** | **Managed application deployment PaaS.**<br>• Automatically handles provisioning, load balancing, auto-scaling, and health monitoring from uploaded application code.<br>• 🟧 **NEW (Cluster Mode)**: Enables multiple applications to safely share managed underlying fleet infrastructure to maximize resource utilization. |

---

### 💾 1.2 Storage & Container Registry Services

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.png" width="32" /> **Amazon ECR** | Storage / Containers | 🔵 CORE | **Secure, highly available private Docker and OCI container image registry.**<br>• Directly stores and serves container images, Helm charts, and OCI artifacts for Kubernetes (EKS), ECS, and Lambda.<br>• Features automated CVE vulnerability scanning (via AWS Inspector), KMS encryption, cross-region replication, and lifecycle policies.<br>• Primary container image supply chain foundation for Kubernetes cluster deployments. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.png" width="32" /> **Amazon S3** | Storage | 🔵 CORE<br>🟧 **NEW** | **Globally scalable, highly durable (99.999999999%) object storage.**<br>• Stores static assets, backups, container image layers, data lake files, and LLM checkpoints.<br>• 🟧 **NEW (S3 Vectors)**: Native storage and fast nearest-neighbor similarity querying for AI vector embeddings directly inside S3 buckets.<br>• 🟧 **NEW (S3 Annotations)**: Attach structured, queryable metadata context to stored objects for instant semantic retrieval. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Storage/48/Arch_Amazon-Elastic-Block-Store_48.png" width="32" /> **Amazon EBS** | Storage | 🔵 CORE | **High-performance block storage volumes for EC2.**<br>• Attached as raw block devices to single EC2 instances or mounted as `ReadWriteOnce` (RWO) PersistentVolumes in Kubernetes via the AWS EBS CSI driver.<br>• Ideal for low-latency databases, disk caches, and file systems. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Storage/48/Arch_Amazon-EFS_48.png" width="32" /> **Amazon EFS** | Storage | ⚪ DEPTH | **Serverless, fully elastic POSIX shared file system (NFSv4).**<br>• Mountable concurrently across hundreds of EC2 instances and Kubernetes pods (`ReadWriteMany` / RWX).<br>• Ideal for shared CMS media uploads, distributed build caches, and shared ML model weights. |

---

# Pillar 2: Databases & Messaging

> [!IMPORTANT]
> **ENGINEERING RULE**: Design the access pattern before choosing the database. Relational schemas prioritize flexible ad-hoc querying, while NoSQL databases require table schemas designed around specific query access keys.

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
    subgraph MessagingPatterns["Messaging Architectures"]
        subgraph P2P["SQS: Point-to-Point Queue"]
            Producer1["Publisher"] --> Queue[("SQS Queue")]
            Queue --> Consumer1["Worker 1 (Processes Job)"]
            Queue -.-> Consumer2["Worker 2 (Only 1 worker gets message)"]
        end

        subgraph FanOut["SNS: Pub/Sub Fan-Out"]
            Producer2["Publisher"] --> Topic(("SNS Topic"))
            Topic --> Sub1["SQS Queue A<br/>(Subscriber 1)"]
            Topic --> Sub2["SQS Queue B<br/>(Subscriber 2)"]
            Topic --> Sub3["Lambda Webhook<br/>(Subscriber 3)"]
        end
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style MessagingPatterns fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style P2P fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;
    style FanOut fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;

    %% Component Classes
    classDef cClient fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cQueue fill:#261824,stroke:#853878,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorker fill:#202315,stroke:#5f6d35,stroke-width:1.5px,color:#e2e8f0;

    class Producer1,Producer2 cClient;
    class Queue,Topic,Sub1,Sub2 cQueue;
    class Consumer1,Consumer2,Sub3 cWorker;
```

---

### 🗄️ 2.1 Database Services

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Databases/48/Arch_Amazon-RDS_48.png" width="32" /> **Amazon RDS** | Databases | 🔵 CORE | **Managed relational database engine (PostgreSQL / MySQL / MariaDB).**<br>• Automates hardware provisioning, database patching, automated continuous snapshots, and Multi-AZ synchronous failover.<br>• Primary choice for transactional business applications requiring ACID guarantees and SQL schemas. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Databases/48/Arch_Amazon-DynamoDB_48.png" width="32" /> **Amazon DynamoDB** | Databases | 🔵 CORE | **Fully managed, serverless NoSQL key-value and document database.**<br>• Guarantees single-digit millisecond latency at any scale with unlimited horizontal auto-partitioning.<br>• Ideal for user profiles, session state, shopping carts, and event logging with predictable access patterns. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Databases/48/Arch_Amazon-ElastiCache_48.png" width="32" /> **Amazon ElastiCache** | Databases | 🔵 CORE | **Managed in-memory data store for Redis OSS, Valkey, and Memcached.**<br>• Delivers sub-millisecond response times to relieve strain on relational databases.<br>• Used for session caching, rate-limiting counters, pub/sub queues, and distributed locking. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Databases/48/Arch_Amazon-Aurora_48.png" width="32" /> **Amazon Aurora** | Databases | ⚪ DEPTH | **Cloud-native, high-performance relational database engine.**<br>• Delivers up to 5x throughput of standard MySQL and 3x of standard PostgreSQL.<br>• Storage layer automatically replicates 6 copies across 3 Availability Zones with self-healing block recovery and auto-scaling read replicas. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Analytics/48/Arch_Amazon-OpenSearch-Service_48.png" width="32" /> **Amazon OpenSearch** | Databases | ⚪ DEPTH<br>🟧 **NEW** | **Distributed search, full-text indexing, and log analytics engine.**<br>• Fork of Elasticsearch powering interactive log exploration, observability dashboards, and search catalogs.<br>• 🟧 **NEW (GPU Vector Indexing)**: Hardware-accelerated vector index creation and automated query graph optimization for low-latency RAG and semantic search. |

---

### 📬 2.2 Messaging & Event Streaming Services

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Application-Integration/48/Arch_Amazon-Simple-Queue-Service_48.png" width="32" /> **Amazon SQS** | Messaging | 🔵 CORE | **Distributed message queuing service.**<br>• Decouples producer microservices from consumer worker pools. Guarantees message delivery with dead-letter queue (DLQ) support.<br>• **Point-to-Point**: Each individual message is received and processed by only one worker consumer. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Application-Integration/48/Arch_Amazon-Simple-Notification-Service_48.png" width="32" /> **Amazon SNS** | Messaging | 🔵 CORE | **High-throughput publish/subscribe (Pub/Sub) messaging service.**<br>• Enables instant message distribution from publishers to multiple endpoints.<br>• **Fan-Out**: Every subscriber (SQS queues, Lambda functions, HTTP webhooks, mobile push) receives an exact duplicate copy of the event. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Application-Integration/48/Arch_Amazon-EventBridge_48.png" width="32" /> **Amazon EventBridge** | Messaging | 🔵 CORE | **Serverless event bus service for modern event-driven architectures.**<br>• Routes real-time JSON events between internal AWS resources, third-party SaaS platforms (e.g. GitHub, Datadog), and custom apps.<br>• Features declarative content-based filtering, schema discovery, and scheduled cron rules. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Analytics/48/Arch_Amazon-Kinesis_48.png" width="32" /> **Amazon Kinesis** | Messaging | ⚪ DEPTH | **Real-time streaming platform for high-volume data ingestion.**<br>• Captures, processes, and stores gigabytes per second of continuous streaming events (clickstreams, financial tickers, IoT feeds) with strict shard ordering. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Analytics/48/Arch_Amazon-Managed-Streaming-for-Apache-Kafka_48.png" width="32" /> **Amazon MSK** | Messaging | ⚪ DEPTH | **Fully managed Apache Kafka service.**<br>• Runs native Apache Kafka clusters with automated ZooKeeper/KRaft node management, multi-AZ broker replication, and AWS IAM client authentication.<br>• Direct drop-in for Kafka enterprise pipelines. |

---

# Pillar 3: Networking & Security

End-to-end traffic routing, SSL/TLS termination, edge caching, zero-trust identity enforcement, and automated threat defense.

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
graph LR
    User(["End User / Client"]) --> R53["Route 53<br/>(DNS)"]
    R53 --> CF["CloudFront<br/>(Edge CDN & WAF)"]
    CF --> ALB["ALB<br/>(Layer 7 Load Balancer)"]
    ALB --> ComputeCluster

    subgraph VPCNetwork["Private VPC Network"]
        ComputeCluster["Compute Layer<br/>(EKS Pods / ECS Tasks / EC2)"]
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style VPCNetwork fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    %% Component Classes
    classDef cClient fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cR53 fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;
    classDef cCF fill:#1c1b2b,stroke:#58518e,stroke-width:1.5px,color:#e2e8f0;
    classDef cNet fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cCompute fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;

    class User cClient;
    class R53 cR53;
    class CF cCF;
    class ALB cNet;
    class ComputeCluster cCompute;
```

---

### 🌐 3.1 Networking & Content Delivery

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.png" width="32" /> **Amazon VPC** | Networking | 🔵 CORE | **Logically isolated software-defined virtual private cloud network.**<br>• Configures IP address ranges (CIDR), public/private subnets, Route Tables, Internet Gateways, NAT Gateways, and VPC Peering.<br>• Core security boundary housing all Kubernetes worker nodes and databases away from public exposure. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.png" width="32" /> **Amazon API Gateway** | Networking | 🔵 CORE | **Managed API front door for REST and WebSocket APIs.**<br>• Handles traffic throttling, rate-limiting, CORS, API keys, request validation, and authorization before reaching downstream Lambda or internal VPC services. |
| <img src="./icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Application-Load-Balancer_48.png" width="32" /> **AWS ALB** | Networking | 🔵 CORE | **Layer 7 Application Load Balancer.**<br>• Routes HTTP/HTTPS traffic based on advanced request attributes (host header, URL path, query params, HTTP headers).<br>• Automatically provisioned as the Kubernetes Ingress entrypoint via the AWS Load Balancer Controller. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.png" width="32" /> **Amazon CloudFront** | Networking | 🔵 CORE | **Global Content Delivery Network (CDN).**<br>• Caches static assets, images, and video at hundreds of edge points of presence (PoPs) worldwide.<br>• Accelerates dynamic API requests with TLS termination at edge, integrated with AWS Shield and WAF. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Networking-Content-Delivery/48/Arch_Amazon-Route-53_48.png" width="32" /> **Amazon Route 53** | Networking | 🔵 CORE<br>🟧 **NEW** | **Highly available, low-latency authoritative DNS and domain registrar (100% SLA).**<br>• Provides latency-based routing, geo-DNS, weighted traffic splits (Canary), and DNS failover health checks.<br>• 🟧 **NEW (Global Resolver)**: Secure anycast DNS resolution across global edge PoPs with automated DDoS resilience. |
| <img src="./icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Network-Load-Balancer_48.png" width="32" /> **AWS NLB** | Networking | ⚪ DEPTH | **Layer 4 Network Load Balancer (TCP, UDP, TLS).**<br>• Capable of handling tens of millions of requests per second with ultra-low latency.<br>• Assigns static Elastic IPs per AZ; ideal for gRPC microservices, gaming protocols, and non-HTTP TCP traffic. |

---

### 🛡️ 3.2 Security, Identity & Compliance

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_AWS-Identity-and-Access-Management_48.png" width="32" /> **AWS IAM** | Security | 🔵 CORE<br>🟧 **NEW** | **Fine-grained access control and identity governance across AWS.**<br>• Governs Roles, Policies, Users, and Service Accounts via least-privilege JSON policy evaluation.<br>• 🟧 **NEW (IAM Policy Autopilot)**: Automatically synthesizes and tightens baseline least-privilege IAM policies directly from application code inspection. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_AWS-Secrets-Manager_48.png" width="32" /> **AWS Secrets Manager** | Security | 🔵 CORE | **Encrypted secrets vault with automated lifecycle rotation.**<br>• Securely stores database passwords, API tokens, and private certificates.<br>• Integrates natively with Kubernetes via the AWS Secrets Store CSI driver to mount credentials as files inside pods. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_Amazon-Cognito_48.png" width="32" /> **Amazon Cognito** | Security | 🔵 CORE | **Customer identity and access management (CIAM).**<br>• Provides User Pools for customer registration, passwordless sign-in, MFA, and social federation (Google, Apple, SAML, OIDC).<br>• Issues secure standard JWT tokens (ID, Access, Refresh) for frontend and mobile authorization. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_AWS-Key-Management-Service_48.png" width="32" /> **AWS KMS** | Security | ⚪ DEPTH | **Hardware-backed (FIPS 140-3) cryptographic key management.**<br>• Centralized encryption and decryption service controlling cryptographic keys for S3 buckets, EBS volumes, RDS tables, and Kubernetes secrets at rest. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_AWS-WAF_48.png" width="32" /> **AWS WAF** | Security | ⚪ DEPTH<br>🟧 **NEW** | **Web Application Firewall filtering malicious HTTP(S) traffic.**<br>• Protects ALBs, CloudFront, and API Gateways against SQL injection, XSS, rate-limiting violations, and bad bots.<br>• 🟧 **NEW (AI Traffic Monetization)**: Enables API owners to meter, rate-limit, or charge AI scrapers and automated LLM bots crawling website content. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_Amazon-GuardDuty_48.png" width="32" /> **Amazon GuardDuty** | Security | ⚪ DEPTH<br>🟧 **NEW** | **Continuous intelligent threat detection and anomaly monitoring.**<br>• Analyzes CloudTrail events, VPC Flow Logs, DNS queries, and EKS audit logs using machine learning to detect unauthorized behavior and compromised keys.<br>• 🟧 **NEW (Extended Detection)**: Correlates complex multi-stage attack patterns across diverse cloud resources into actionable kill-chain alerts. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Security-Identity/48/Arch_AWS-Security-Agent_48.png" width="32" /> **AWS Security Agent** | Security | 🟣 AI | **AI-driven autonomous security assessment and pen-testing assistant.**<br>• Analyzes cloud posture, identifies misconfigurations, correlates vulnerability scans, and performs automated simulated attack paths (GA March 2026). |

---

# Pillar 4: DevOps, Observability & IaC (Deploy. Observe. Automate.)

Continuous integration, automated deployment pipelines, unified operational telemetry, and declarative infrastructure-as-code automation.

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
graph LR
    subgraph CICD["CI/CD Pipeline"]
        Git["Git Source Code"] --> CB["AWS CodeBuild<br/>(Build & Test)"]
        CB --> ECR[("Amazon ECR<br/>(Docker Registry)")]
        ECR --> CD["CodeDeploy / ArgoCD<br/>(GitOps Delivery)"]
    end

    CD --> Runtime["Runtime Cluster<br/>(Kubernetes EKS / ECS)"]

    subgraph Observability["Observability & Auditing"]
        Runtime -.-> CW["Amazon CloudWatch<br/>(Metrics & Logs)"]
        Runtime -.-> XRay["AWS X-Ray<br/>(Distributed Traces)"]
        Runtime -.-> CT["AWS CloudTrail<br/>(Audit Events)"]
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style CICD fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style Observability fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    %% Component Classes
    classDef cDev fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cStorage fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;
    classDef cCompute fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;
    classDef cObs fill:#1c2420,stroke:#3a7357,stroke-width:1.5px,color:#e2e8f0;

    class Git,CB,CD cDev;
    class ECR cStorage;
    class Runtime cCompute;
    class CW,XRay,CT cObs;
```

---

### 🚀 4.1 DevOps & CI/CD Pipelines

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Containers/48/Arch_Amazon-Elastic-Container-Registry_48.png" width="32" /> **Amazon ECR** | CI/CD | 🔵 CORE | **Secure, highly available private Docker and OCI container image registry.**<br>• Directly integrates with IAM permissions, KMS encryption, automated Clair/Inspector vulnerability scanning, and image lifecycle retention policies.<br>• Primary container image source for EKS and ECS cluster deployments. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Developer-Tools/48/Arch_AWS-CodeBuild_48.png" width="32" /> **AWS CodeBuild** | CI/CD | 🔵 CORE | **Fully managed continuous integration build service.**<br>• Compiles source code, executes unit and integration test suites, builds Docker container images, and generates deployable artifacts.<br>• Scales elastically with pay-per-minute compute containers. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Developer-Tools/48/Arch_AWS-CodeDeploy_48.png" width="32" /> **AWS CodeDeploy** | CI/CD | 🔵 CORE | **Automated software deployment engine.**<br>• Coordinates zero-downtime rolling, Canary, and Blue/Green deployment rollouts across EC2, ECS, Lambda, and on-premises servers with automatic rollback on failure. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Developer-Tools/48/Arch_AWS-CodePipeline_48.png" width="32" /> **AWS CodePipeline** | CI/CD | ⚪ DEPTH | **Continuous delivery workflow orchestrator.**<br>• Models, visualizes, and coordinates pipeline stages: Source checkout $\rightarrow$ Build $\rightarrow$ Test $\rightarrow$ Manual Approval $\rightarrow$ Multi-region Production Deployment. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Management-Tools/48/Arch_AWS-DevOps-Agent_48.png" width="32" /> **AWS DevOps Agent** | CI/CD | 🟣 AI | **AI-powered incident investigation and root-cause analysis assistant.**<br>• Monitors production alarms, ingests error traces and commit logs, analyzes anomalies, and provides operational runbook recommendations during active outages. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Migration-Modernization/48/Arch_AWS-Transform_48.png" width="32" /> **AWS Transform** | CI/CD | 🟣 AI | **AI-assisted legacy application modernization service.**<br>• Analyzes legacy application codebases (e.g. legacy Java, .NET Framework), generates updated boilerplate, refactors deprecated APIs, and accelerates cloud migration. |
| <img src="./icons/Resource-Icons_07312026/Res_General-Icons/Res_48_Dark/Res_Git-Repository_48_Dark.png" width="32" /> **GitHub Actions** | CI/CD | *(Industry Alternative)* | *Common external CI platform. Delivery tooling often depends on the deployment destination (e.g. GitHub Actions pushing images to ECR, with ArgoCD handling GitOps deployment into EKS).* |

---

### 📊 4.2 Observability & Governance

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Management-Tools/48/Arch_Amazon-CloudWatch_48.png" width="32" /> **Amazon CloudWatch** | Observability | 🔵 CORE<br>🟧 **NEW** | **Centralized operational telemetry, logging, and metrics platform.**<br>• Ingests container logs (Fluent Bit / Container Insights), tracks system resource metrics, triggers automated alarm actions, and renders dashboards.<br>• 🟧 **NEW (Unified Data Management)**: A single consolidated telemetry store unifying operations metrics, security events, and compliance audit data in one queryable repository. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Developer-Tools/48/Arch_AWS-X-Ray_48.png" width="32" /> **AWS X-Ray** | Observability | ⚪ DEPTH | **Distributed end-to-end request tracing system.**<br>• Tracks user requests across microservices, databases, and third-party APIs.<br>• Generates dependency service maps and identifies high-latency bottlenecks and uncaught exceptions across distributed topologies. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Management-Tools/48/Arch_AWS-CloudTrail_48.png" width="32" /> **AWS CloudTrail** | Observability | 🔵 CORE | **Immutable audit trail recording all AWS account management actions.**<br>• Captures every API call made via the AWS Console, CLI, SDKs, or automated pipelines (who, what, when, where from IP) for security compliance and incident forensics. |

---

### 🏗️ 4.3 Infrastructure as Code (IaC)

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Management-Tools/48/Arch_AWS-CloudFormation_48.png" width="32" /> **AWS CloudFormation** | IaC | 🔵 CORE | **AWS-native declarative infrastructure orchestration.**<br>• Models all AWS resources in standardized JSON or YAML templates with automated rollback and dependency ordering. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Developer-Tools/48/Arch_AWS-Cloud-Development-Kit_48.png" width="32" /> **AWS CDK** | IaC | ⚪ DEPTH | **Modern programmatic infrastructure framework.**<br>• Allows developers to define cloud infrastructure using familiar programming languages (TypeScript, Python, Go, Java, C#) that synthesizes into clean CloudFormation stacks. |
| <img src="./icons/Resource-Icons_07312026/Res_General-Icons/Res_48_Dark/Res_JSON-Script_48_Dark.png" width="32" /> **HashiCorp Terraform** | IaC | 🔵 CORE | **Multi-cloud, declarative Infrastructure as Code using HCL.**<br>• Industry standard for managing AWS infrastructure alongside Kubernetes clusters, Helm releases, and SaaS providers with state file tracking. |

---

# Pillar 5: The AWS AI Layer

The enterprise Generative AI stack: foundation models, high-performance reasoning APIs, managed RAG retrieval pipelines, and autonomous agent orchestration.

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
    UserApp(["Application / Client"]) --> Agent["Bedrock AgentCore<br/>(Multi-Step Agent Execution)"]
    Agent --> Model["Amazon Bedrock / Nova<br/>(Foundation Models)"]
    Agent --> KB["Bedrock Knowledge Bases<br/>(Managed RAG Pipeline)"]
    KB --> VectorStore[("S3 Vectors / OpenSearch<br/>Aurora pgvector")]
    Model --> Inference["Nova 2 Lite / Sonic / Act<br/>(Inference Runtimes)"]

    %% Component Classes
    classDef cClient fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cAI fill:#142426,stroke:#2b757e,stroke-width:1.5px,color:#e2e8f0;
    classDef cStorage fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;

    class UserApp cClient;
    class Agent,Model,KB,Inference cAI;
    class VectorStore cStorage;
```

---

### 🤖 5.1 Foundation Models & APIs

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.png" width="32" /> **Amazon Bedrock** | AI Layer | 🟣 AI | **Fully managed, serverless unified foundation model API.**<br>• Provides single-API access to top-tier models from Anthropic (Claude), Meta (Llama), Mistral AI, Cohere, AI21 Labs, and Amazon Nova.<br>• Includes built-in enterprise privacy (zero training on customer prompts) and Guardrails for PII redaction and safety filtering. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Artificial-Intelligence/48/Arch_Amazon-Nova_48.png" width="32" /> **Amazon Nova** | AI Layer | 🟣 AI | **AWS native foundation model family built for speed, cost, and agentic workflows.**<br>• **Nova 2 Lite**: Ultra-fast, cost-effective reasoning model optimized for high-throughput enterprise pipelines.<br>• **Nova 2 Sonic**: Real-time speech-to-speech conversational model for human-like voice interfaces.<br>• **Nova Act**: Specialized action-taking agentic model capable of automating browser workflows and UI executions. |

---

### 🧠 5.2 Retrieval & Autonomous Agents

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.png" width="32" /> **Bedrock Knowledge Bases** | AI Layer | 🟣 AI | **Fully managed Retrieval-Augmented Generation (RAG) pipeline.**<br>• Automates data chunking, text parsing, embedding generation, and vector index sync with Amazon OpenSearch Serverless, S3 Vectors, or Aurora PostgreSQL.<br>• Enriches LLM generation with accurate, private enterprise facts without hallucinations. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock-AgentCore_48.png" width="32" /> **Bedrock AgentCore** | AI Layer | 🟣 AI | **Infrastructure and orchestration runtime for production AI agents.**<br>• Dynamically breaks down user prompts into multi-step execution plans, queries knowledge bases, and securely invokes internal REST APIs or Lambda functions to complete complex tasks autonomously. |

---

### ⚙️ 5.3 Customization & ML Operations

| Service | Category | Classification | Architecture Role & Summary |
| :--- | :---: | :---: | :--- |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Artificial-Intelligence/48/Arch_Amazon-Bedrock_48.png" width="32" /> **Bedrock Reinforcement Fine-Tuning** | AI Layer | 🟣 AI<br>🟧 **NEW** | **Model customization via feedback-based reinforcement learning (RLHF / RLAIF).**<br>• Aligns foundation models with customized organizational guidelines, domain-specific tone, and business task reward functions. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Analytics/48/Arch_Amazon-SageMaker_48.png" width="32" /> **Amazon SageMaker** | AI Layer | 🟣 AI | **End-to-end enterprise machine learning and deep learning platform.**<br>• Covers data labeling (Ground Truth), distributed model training on GPU clusters (UltraClusters / Trainium), hyperparameter tuning, model registry, and managed real-time inference endpoints. |
| <img src="./icons/Architecture-Service-Icons_07312026/Arch_Management-Tools/48/Arch_AWS-DevOps-Agent_48.png" width="32" /> **AWS DevOps Agent** | AI Layer | 🟣 AI | **AI operational copilot for incident response.**<br>• Correlates system metrics, error spikes, and deployment events to suggest rapid triage steps and operational fixes during system incidents. |

---

## 🎯 Architecture Summary: How It All Fits Together in Production

In a modern Kubernetes (`Amazon EKS`) or containerized production deployment on AWS:

1. **Traffic Entry & Edge Security**: Clients query **Route 53**, hit **CloudFront** edge caches protected by **AWS WAF**, and terminate TLS at an **ALB** managed by the AWS Load Balancer Controller.
2. **Compute & Orchestration**: Incoming requests are distributed into **Amazon EKS** running on **EC2 (Graviton5)** nodes or serverless **AWS Fargate** pods.
3. **Storage & State**: Stateful pods mount low-latency **Amazon EBS** volumes for single-node state, or shared **Amazon EFS** file systems for shared multi-pod assets.
4. **Data & Caching**: Application code reads and writes transactional data to **Amazon RDS** or **Amazon Aurora**, caches hot queries and session state in **Amazon ElastiCache (Valkey/Redis)**, and offloads key-value data to **Amazon DynamoDB**.
5. **Decoupled Asynchrony**: Background tasks queue up in **Amazon SQS**, broadcast notifications through **Amazon SNS**, and route SaaS events across **Amazon EventBridge**.
6. **AI Augmentation**: Microservices invoke **Amazon Bedrock** and **Amazon Nova** foundation models, grounded by enterprise documents indexed in **Bedrock Knowledge Bases** and executed via **Bedrock AgentCore**.
7. **Delivery & Observability**: Everything is declared in **Terraform** or **AWS CDK**, built in **AWS CodeBuild**, pushed to **Amazon ECR**, deployed continuously, and monitored end-to-end with **Amazon CloudWatch** and **AWS CloudTrail**.
