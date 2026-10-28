# Architecture 1: Single-Server Baseline (EC2 + VPC + RDS + S3 + Route 53)

A classic foundational architecture suitable for minimum viable products (MVPs), dev/staging environments, and early-stage monolith applications.

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
    Client(["Client / Browser"]) -->|"1. DNS Query"| R53["Amazon Route 53<br/>(Authoritative DNS)"]
    Client -->|"2. HTTPS :443"| IGW["Internet Gateway (IGW)"]

    subgraph AWS["AWS Cloud"]
        subgraph VPC["Virtual Private Cloud (VPC: 10.0.0.0/16)"]
            IGW --> Router["VPC Route Table"]

            subgraph PublicSubnet["Public Subnet (10.0.1.0/24 - AZ-1a)"]
                Router -->|"3. Route Traffic"| EC2["Amazon EC2 Instance<br/>(Monolith App: Nginx + API)<br/>Elastic IP: 54.x.x.x"]
                EC2 --- EBS[("Amazon EBS Volume<br/>Root: /dev/xvda")]
            end

            subgraph PrivateSubnet["Private Subnet (10.0.2.0/24 - AZ-1a)"]
                EC2 -->|"4. SQL Query :5432 / :3306"| RDS[("Amazon RDS Database<br/>PostgreSQL / MySQL")]
            end
        end

        EC2 -.->|"5. S3 Gateway Endpoint"| S3[("Amazon S3 Bucket<br/>Media, Uploads & Backups")]
        EC2 -.->|"6. Push Logs & Metrics"| CW["Amazon CloudWatch<br/>(Logs & Alarms)"]
        IAM["AWS IAM Role<br/>(Instance Profile)"] -.->|"Attach Perms"| EC2
    end

    %% Container Boundaries: Transparent BG with Muted Dashed and Dotted Strokes
    style AWS fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style VPC fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 4 4,color:#e2e8f0;
    style PublicSubnet fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;
    style PrivateSubnet fill:none,stroke:#334155,stroke-width:1px,stroke-dasharray: 2 3,color:#cbd5e1;

    %% Component Classes
    classDef cClient fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cR53 fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;
    classDef cNet fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cEC2 fill:#152226,stroke:#346a78,stroke-width:1.5px,color:#e2e8f0;
    classDef cStorage fill:#242015,stroke:#7d6830,stroke-width:1.5px,color:#e2e8f0;
    classDef cRDS fill:#161f28,stroke:#325f85,stroke-width:1.5px,color:#e2e8f0;
    classDef cCW fill:#1c2420,stroke:#3a7357,stroke-width:1.5px,color:#e2e8f0;
    classDef cIAM fill:#252115,stroke:#8a7030,stroke-width:1.5px,color:#e2e8f0;

    class Client cClient;
    class R53 cR53;
    class IGW,Router cNet;
    class EC2 cEC2;
    class EBS,S3 cStorage;
    class RDS cRDS;
    class CW cCW;
    class IAM cIAM;
```

---

## 🔄 End-to-End Traffic Walkthrough

1. **DNS Lookup (`Route 53`)**:
   * The user enters `example.com` into their browser.
   * Route 53 responds with the public Elastic IP address pointing directly to the EC2 instance (or an Elastic Network Interface in the public subnet).
2. **Ingress through Internet Gateway (`IGW`)**:
   * HTTPS (TCP 443) traffic reaches the VPC Internet Gateway and traverses the public route table (`0.0.0.0/0 -> igw-xxx`).
3. **Application Processing (`EC2 + EBS`)**:
   * The EC2 instance runs an Nginx reverse proxy routing requests to a backend app runtime (e.g. Node.js, Go, Python, or Ruby).
   * Static temporary files and the operating system run on the attached **Amazon EBS** root volume (`gp3`).
4. **Secure Database Queries (`RDS`)**:
   * The application queries the **Amazon RDS** database placed safely inside a **Private Subnet**.
   * **Security Group Barrier**: The RDS Security Group allows inbound connections *strictly* from the EC2 Security Group on port `5432` (PostgreSQL) or `3306` (MySQL). RDS has **no public IP** and cannot be reached from the internet.
5. **Object Storage Offloading (`S3`)**:
   * User-uploaded files (profile avatars, PDFs, images) bypass the EC2 disk and stream directly into **Amazon S3** using pre-signed URLs or backend IAM credentials (via an **EC2 Instance Profile**).
   * S3 Gateway Endpoint enables traffic to stay within the AWS internal network without hitting the public internet.
6. **Telemetry (`CloudWatch`)**:
   * The CloudWatch Agent sends CPU, memory, disk I/O metrics, and application logs (`/var/log/app.log`) for monitoring.

---

## 🛡️ Security Group Rules Matrix

| Security Group | Direction | Protocol | Port Range | Source / Destination | Purpose |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **`sg-web-ec2`** | Inbound | TCP | `443` | `0.0.0.0/0` (Anywhere) | Public HTTPS traffic |
| **`sg-web-ec2`** | Inbound | TCP | `80` | `0.0.0.0/0` (Anywhere) | HTTP to HTTPS redirection |
| **`sg-web-ec2`** | Inbound | TCP | `22` | `Admin_IP/32` (or AWS SSM) | SSH administration (or Session Manager) |
| **`sg-web-ec2`** | Outbound | All | All | `0.0.0.0/0` | Package updates & API calls |
| **`sg-rds-db`** | Inbound | TCP | `5432` / `3306` | `sg-web-ec2` (EC2 SG ID) | Only the web server can talk to DB |
| **`sg-rds-db`** | Outbound | All | All | None | Blocked egress |

---

## ⚖️ Architectural Trade-Offs

### ✅ Advantages
* **Simple to understand and manage**: Easy for a small team to build, deploy, and debug.
* **Low Initial Cost**: Can run on `t4g.small` or `t3.micro` free-tier eligible components.
* **Fast Time to Market**: No complex microservice orchestration or service discovery needed.

### ⚠️ Production Bottlenecks & Failure Modes
1. **Single Point of Failure (SPOF)**:
   * If the single EC2 instance fails or Availability Zone 1a experiences an outage, the entire service goes down.
2. **Maintenance Downtime**:
   * OS updates, security patching, and app deployments cause visible downtime.
3. **Vertical Scaling Wall**:
   * When traffic spikes, the server can only scale by resizing the instance (`vertical scaling`), which requires an instance reboot.
4. **Database Contention**:
   * Both write transactions and heavy read analytics hit the exact same single DB instance.

👉 *To solve these limitations, systems evolve into [Architecture 2: Horizontally Scaled Multi-AZ](02-horizontal-scaling-architecture.md).*
