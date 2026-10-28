# Architecture 2: Horizontally Scaled Multi-AZ Architecture (Auto Scaling + Caching + DB Read Scaling + SQS + SES)

A resilient, high-availability multi-tier architecture engineered for production scale, high concurrency, zero downtime deployments, and asynchronous background job processing.

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
    User(["Users & Mobile Clients"]) -->|"1. HTTPS Request"| R53["Amazon Route 53<br/>(Latency / Failover DNS)"]
    R53 --> CF["Amazon CloudFront (CDN) + AWS WAF<br/>(DDoS Protection & Edge Cache)"]

    CF -->|"Static Assets"| S3[("Amazon S3 Bucket<br/>Origin Access Control")]
    CF -->|"Dynamic API / HTML"| IGW["Internet Gateway (IGW)"]

    subgraph AWS["AWS Cloud (Region: us-east-1)"]
        subgraph VPC["Virtual Private Cloud (VPC: 10.0.0.0/16)"]

            subgraph PublicSubnets["Public Subnets (DMZ)"]
                subgraph PubAZ1["AZ 1a (10.0.1.0/24)"]
                    NAT1["NAT Gateway 1"]
                end
                subgraph PubAZ2["AZ 1b (10.0.2.0/24)"]
                    NAT2["NAT Gateway 2"]
                end
                ALB["Application Load Balancer (ALB)<br/>(Multi-AZ Layer 7 Ingress)"]
            end

            IGW --> ALB

            subgraph PrivateAppSubnets["Private Application Subnets (Auto Scaling Group)"]
                subgraph AppAZ1["AZ 1a (10.0.10.0/24)"]
                    EC2_1["EC2 App Instance 1"]
                    Worker1["Worker Process 1"]
                end
                subgraph AppAZ2["AZ 1b (10.0.20.0/24)"]
                    EC2_2["EC2 App Instance 2"]
                    Worker2["Worker Process 2"]
                end
                ASG["Auto Scaling Group (ASG)<br/>Target: 60% CPU / Request Count"]
            end

            ALB -->|"Target Group HTTP:8080"| EC2_1
            ALB -->|"Target Group HTTP:8080"| EC2_2

            subgraph PrivateDataSubnets["Private Data & Caching Subnets"]
                subgraph CacheTier["In-Memory Caching"]
                    ElastiCache[("Amazon ElastiCache<br/>Redis / Valkey Multi-AZ Cluster")]
                end

                subgraph DBTier["Database Scaling Tier (Amazon Aurora / RDS)"]
                    DB_Primary[("Aurora / RDS Primary (Writer)<br/>AZ 1a - Multi-AZ Sync")]
                    DB_Replica[("Aurora / RDS Read Replica (Reader)<br/>AZ 1b - Auto-scaling Reads")]
                    DB_Primary -.->|"Async Replication"| DB_Replica
                end
            end

            EC2_1 & EC2_2 -->|"2. Check Cache First"| ElastiCache
            EC2_1 & EC2_2 -->|"3. Writes / Mutates"| DB_Primary
            EC2_1 & EC2_2 -->|"4. Reads / Queries"| DB_Replica

            subgraph AsyncQueue["Asynchronous Job & Notification Decoupling"]
                SQS[("Amazon SQS Queue<br/>Background Jobs + DLQ")]
                SES["Amazon SES<br/>(Simple Email Service)"]
            end

            EC2_1 & EC2_2 -->|"5. Push Heavy Jobs"| SQS
            SQS -->|"6. Batch Messages"| Worker1 & Worker2
            Worker1 & Worker2 -->|"7. Send Email"| SES
        end

        CW["Amazon CloudWatch<br/>Metrics, Logs & Alarms"]
        CW -.->|"Trigger Scale Out / In"| ASG
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style AWS fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style VPC fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 4 4,color:#e2e8f0;
    style PublicSubnets fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;
    style PubAZ1,PubAZ2 fill:none,stroke:#334155,stroke-width:1px,color:#94a3b8;
    style PrivateAppSubnets fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;
    style AppAZ1,AppAZ2 fill:none,stroke:#334155,stroke-width:1px,color:#94a3b8;
    style PrivateDataSubnets,CacheTier,DBTier,AsyncQueue fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;

    %% Component Classes
    classDef cUser fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cR53 fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;
    classDef cCF fill:#1c1b2b,stroke:#58518e,stroke-width:1.5px,color:#e2e8f0;
    classDef cNet fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cCompute fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorker fill:#202315,stroke:#5f6d35,stroke-width:1.5px,color:#e2e8f0;
    classDef cCache fill:#261616,stroke:#853d3d,stroke-width:1.5px,color:#e2e8f0;
    classDef cDB fill:#161f28,stroke:#325f85,stroke-width:1.5px,color:#e2e8f0;
    classDef cMsg fill:#261824,stroke:#853878,stroke-width:1.5px,color:#e2e8f0;
    classDef cStorage fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;
    classDef cCW fill:#1c2420,stroke:#3a7357,stroke-width:1.5px,color:#e2e8f0;

    class User cUser;
    class R53 cR53;
    class CF cCF;
    class S3 cStorage;
    class IGW,NAT1,NAT2,ALB cNet;
    class EC2_1,EC2_2,ASG cCompute;
    class Worker1,Worker2 cWorker;
    class ElastiCache cCache;
    class DB_Primary,DB_Replica cDB;
    class SQS,SES cMsg;
    class CW cCW;
```

---

## ⚡ Core Scaling Strategies Explained

### 1. Ingress Layer: CloudFront + ALB
* **Edge Caching**: CloudFront caches global static assets and terminates TLS near the user, preventing unnecessary trips to the backend.
* **AWS WAF**: Blocks DDoS, SQLi, and bot traffic before reaching the VPC.
* **Application Load Balancer (ALB)**: Performs intelligent HTTP health checks (`/health`) and routes traffic across healthy EC2 instances in multiple Availability Zones.

---

### 2. Compute Layer: Auto Scaling Group (ASG)
* **Zero Downtime**: If an instance crashes, the ALB stops routing traffic to it immediately and the ASG spins up a replacement instance automatically.
* **Dynamic Scaling**: Target tracking scaling policy monitors:
  * `ASGAverageCPUUtilization` (e.g. scale out when CPU > 60%).
  * `ALBRequestCountPerTarget` (e.g. scale out when each instance receives > 1,000 requests/minute).
* **Multi-AZ Distribution**: Instances are distributed evenly between `AZ-1a` and `AZ-1b` for disaster resilience.

---

### 3. Caching Layer: Amazon ElastiCache (Redis / Valkey)
Implements the **Cache-Aside (Lazy Loading)** architectural pattern:

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
    participant App as EC2 Application
    participant Cache as ElastiCache (Redis)
    participant DB as RDS / Aurora Read Replica

    App->>Cache: 1. GET key (user_session_123)
    alt Cache Hit (Sub-millisecond)
        Cache-->>App: Return cached payload
    else Cache Miss
        Cache-->>App: Key not found (nil)
        App->>DB: 2. SQL Query user profile
        DB-->>App: Return data row
        App->>Cache: 3. SET key with TTL (e.g. 3600s)
    end
```

* **Session Store**: User sessions are stored in ElastiCache so users don't get logged out if a request hits a different EC2 server (stateless app servers).

---

### 4. Database Scaling: Primary (Writer) + Read Replicas (Reader)
* **Write Pipeline**: All mutative operations (`INSERT`, `UPDATE`, `DELETE`) hit the **Primary Writer** instance in AZ-1a.
* **Read Pipeline**: Read-heavy operations (`SELECT`) are routed to the **Read Replica** in AZ-1b.
* **Multi-AZ Failover**: If the primary hardware fails, Aurora/RDS promotes the read replica to primary in under 30 seconds with automatic DNS pointer updates.

---

### 5. Asynchronous Decoupling: Amazon SQS + Amazon SES
* **Problem**: Synchronous actions like generating PDFs, resizing uploaded images, or calling third-party email providers can take 2-5 seconds, blocking web threads and exhausting HTTP connection pools.
* **Solution**:
  1. Web app receives an order or signup request.
  2. Web app enqueues a light message into **Amazon SQS** (`{"task": "send_welcome_email", "email": "user@example.com"}`) in < 5 milliseconds.
  3. Web app responds `200 OK` to the user immediately.
  4. Background workers long-poll SQS in batches, generate the email, and dispatch it via **Amazon SES**.
  5. If an email fails, SQS automatically retries with exponential backoff before sending the poison message to a **Dead-Letter Queue (DLQ)** for investigation.

---

## 🛡️ Security Group Isolation Matrix

```text
[Internet]
    │  (Port 443)
    ▼
[sg-alb] ──(Port 8080)──► [sg-app-ec2] ──(Port 6379)──► [sg-elasticache]
                                │
                                └───(Port 5432)───────► [sg-rds-db]
```

* **`sg-alb`**: Allows `443` from `0.0.0.0/0`.
* **`sg-app-ec2`**: Allows `8080` *strictly* from `sg-alb`.
* **`sg-elasticache`**: Allows `6379` *strictly* from `sg-app-ec2`.
* **`sg-rds-db`**: Allows `5432` (or `3306`) *strictly* from `sg-app-ec2`.

---

## ⚖️ Architectural Assessment

### ✅ What this solves:
* **High Availability**: Survives full Availability Zone failure.
* **Elastic Scale**: Scales seamlessly from 2 instances to 50+ instances during traffic spikes.
* **Fast Page Loads**: Database read pressure reduced by 80%+ via caching and read replicas.
* **Snappy User Experience**: Heavy tasks processed asynchronously in background.

👉 *Next Evolution: When teams grow and monolithic codebases become deployment bottlenecks, we move to [Architecture 3: Event-Driven Microservices](03-microservices-eda-architecture.md).*
