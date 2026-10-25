# Networking Basics: The Foundation for Production & Kubernetes

A comprehensive visual guide to computer networking fundamentals: from physical transmission media and IP addressing to CIDR subnetting, public vs. private networks, firewalls, and DNS resolution—and how they form the backbone of modern cloud and Kubernetes infrastructure.

---

## 1. What is a Network?

A **computer network** is a collection of interconnected computing devices (servers, laptops, smartphones, routers, switches) capable of exchanging data and sharing resources over communication links.

### The Two Foundational Network Models

To understand how data travels from a user's browser to a Kubernetes container, networking is abstracted into layers:

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
    subgraph OSI["OSI 7-Layer Model"]
        L7["7. Application (HTTP, DNS, SSH)"]
        L6["6. Presentation (TLS, SSL, JSON)"]
        L5["5. Session (Sockets, RPC)"]
        L4["4. Transport (TCP, UDP)"]
        L3["3. Network (IP, ICMP, Routing)"]
        L2["2. Data Link (Ethernet, MAC, Switches)"]
        L1["1. Physical (Cables, Fiber, Radio)"]
        L7 --> L6 --> L5 --> L4 --> L3 --> L2 --> L1
    end

    subgraph TCPIP["TCP/IP 4-Layer Model (The Real World)"]
        T4["Application Layer (HTTP, gRPC, DNS, TLS)"]
        T3["Transport Layer (TCP, UDP, Ports)"]
        T2["Internet Layer (IP Addressing, Routing)"]
        T1["Network Access Layer (Ethernet, Wi-Fi, MAC)"]
        T4 --> T3 --> T2 --> T1
    end

    style OSI fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style TCPIP fill:none,stroke:#2b6d51,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    classDef cOSI fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cTCP fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;

    class L7,L6,L5,L4,L3,L2,L1 cOSI;
    class T4,T3,T2,T1 cTCP;
```

### Packet Encapsulation & Data Units

When your application sends data, each layer wraps the payload in its own header (like nesting envelopes):

| Layer | Protocol Data Unit (PDU) | Key Addressing Identifier | Hardware / Component |
| :--- | :--- | :--- | :--- |
| **Application (L7)** | **Data / Payload** | URL / API Endpoint | NGINX, Ingress, Envoy |
| **Transport (L4)** | **Segment** (TCP) / **Datagram** (UDP) | **Port Number** (e.g. `80`, `443`, `8080`) | Operating System Kernel, Load Balancers |
| **Network (L3)** | **Packet** | **IP Address** (e.g. `10.0.1.15`, `192.168.1.1`) | Routers, AWS VPC Route Tables, K8s CNI |
| **Data Link (L2)** | **Frame** | **MAC Address** (e.g. `00:1A:2B:3C:4D:5E`) | Network Switches, Linux Network Bridges |
| **Physical (L1)** | **Bits** (0s & 1s) | Voltage pulses, Light pulses, Radio waves | Ethernet Cables, Fiber Optics, Wi-Fi Antennas |

---

## 2. Transmission Medium: Wired vs. Wireless

Data must physically travel across a medium. In modern enterprise systems, understanding the trade-offs between wired and wireless networks is vital.

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
    'textColor': '#e2e8f0'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; } .cluster * { filter: none !important; }'
}}%%
graph TD
    Medium["Transmission Medium"]
    
    subgraph Wired["Wired (Guided Media)"]
        Twisted["Twisted Pair Copper<br/><b>Cat5e / Cat6 / Cat6a / Cat8</b><br/>1 Gbps to 40 Gbps · RJ45"]
        Fiber["Fiber Optic Cables<br/><b>Single-Mode & Multi-Mode</b><br/>10 Gbps to 800 Gbps · Light pulses"]
        Coax["Coaxial Cables<br/>Legacy Cable Broadband"]
    end

    subgraph Wireless["Wireless (Unguided Media)"]
        WiFi["Wi-Fi (802.11ax / Wi-Fi 6 & 7)<br/>2.4 GHz · 5 GHz · 6 GHz bands"]
        Cellular["Cellular (4G LTE / 5G)<br/>Mobile carriers & private 5G LANs"]
        Satellite["Satellite (Starlink / LEO)<br/>High latency, remote site access"]
    end

    Medium --> Wired
    Medium --> Wireless

    style Wired fill:none,stroke:#38668c,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style Wireless fill:none,stroke:#8a7030,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    classDef cHead fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cWired fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cWireless fill:#252115,stroke:#8a7030,stroke-width:1.5px,color:#e2e8f0;

    class Medium cHead;
    class Twisted,Fiber,Coax cWired;
    class WiFi,Cellular,Satellite cWireless;
```

### Detailed Comparison: Wired vs. Wireless

| Metric | Wired (Fiber & Twisted Pair) | Wireless (Wi-Fi 6/7 & 5G) |
| :--- | :--- | :--- |
| **Speed / Throughput** | **1 Gbps to 800 Gbps** (Ultra-high, sustained) | Up to 1–9 Gbps (Theoretical, shared across all active devices) |
| **Latency** | **< 1 millisecond** (Consistent, sub-millisecond) | 10 ms to 100+ ms (Variable, subject to radio interference) |
| **Reliability & Jitter** | **99.999% stable** (Zero packet loss under normal loads) | Susceptible to walls, physical obstacles, distance, and weather |
| **Electromagnetic Interference** | **Immune** (Fiber optics immune to EMI/RFI) | **High vulnerability** to microwaves, Bluetooth, physical obstacles |
| **Security** | Requires physical physical cable tap | Radio waves broadcast in all directions; vulnerable to eavesdropping |
| **Mobility** | Fixed location (server racks, desktops) | High mobility (laptops, mobile phones, IoT sensors) |

> [!IMPORTANT]
> **Production Rule**: Data centers, cloud provider infrastructure (AWS, GCP, Azure), Top-of-Rack (ToR) switches, and Kubernetes worker node clusters are **100% wired with fiber-optic backbones**. Wireless is reserved strictly for end-user edge access (laptops, smartphones).

---

## 3. IPv4 Addressing: What is an IP?

An **Internet Protocol Version 4 (IPv4) Address** is a unique number assigned to every device on a network so devices can find and talk to each other.

Think of it like a **phone number** or **home mailing address** for computers.

---

### How an IPv4 Address Looks

An IPv4 address is always written as **4 numbers separated by dots**:

$$\text{Number 1} \ .\  \text{Number 2} \ .\  \text{Number 3} \ .\  \text{Number 4}$$

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
    subgraph IPv4["Sample IP: 192.168.1.50"]
        O1["192"]
        Dot1["."]
        O2["168"]
        Dot2["."]
        O3["1"]
        Dot3["."]
        O4["50"]

        O1 --- Dot1 --- O2 --- Dot2 --- O3 --- Dot3 --- O4
    end

    style IPv4 fill:none,stroke:#2b6d51,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    classDef cOctet fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;
    classDef cDot fill:none,stroke:none,color:#94a3b8;

    class O1,O2,O3,O4 cOctet;
    class Dot1,Dot2,Dot3 cDot;
```

#### The Only 2 Rules to Remember:
1. **Each number must be between `0` and `255`**:
   * ✅ `192.168.1.1` is valid.
   * ❌ `192.168.1.300` is invalid (cannot exceed 255).
2. **There are always exactly 4 numbers**:
   * ✅ `10.0.0.1` is valid.
   * ❌ `10.0.1` is invalid (missing a number).

---

### Real-World Sample IP Addresses You See Every Day

| Sample IP | What It Is | Where You See It |
| :--- | :--- | :--- |
| **`127.0.0.1`** | **Localhost** (Your own computer) | When running code locally (`http://localhost:3000` or `http://127.0.0.1:3000`) |
| **`192.168.1.1`** | **Home Wi-Fi Router** | The admin gateway page to configure your home Wi-Fi |
| **`192.168.1.50`** | **Your Laptop or Phone** | The IP address assigned to your device on home Wi-Fi |
| **`1.1.1.1`** | **Cloudflare Public DNS** | Fast public internet directory server |
| **`8.8.8.8`** | **Google Public DNS** | Google's public internet directory server |
| **`172.17.0.2`** | **Docker Container** | Default private IP given to a container running in Docker |
| **`10.0.1.15`** | **Cloud Server / K8s Pod** | Private IP for a server inside an AWS VPC or Kubernetes cluster |

---

## 4. Public IP vs. Private IP (and RFC 1918)

Because the 4.29 billion IPv4 address pool was exhausted, the internet relies on a strict distinction between **Public** and **Private** IP addresses.

### Public IP Addresses
* **Globally Unique**: No two devices on the public internet can share the same public IP at the same time.
* **Globally Routable**: Can be reached directly by any computer in the world over the internet.
* **Assigned by**: ISPs and Cloud Providers (AWS, GCP, Azure).
* **Cost**: Scarce and expensive (Cloud providers charge $\approx \$3.65/\text{month}$ per public IPv4 address).

#### 5 Real-World Public IP Examples:

| Public IP | Organization | What Runs on It |
| :--- | :--- | :--- |
| **`8.8.8.8`** | Google | Google's primary public DNS resolver |
| **`1.1.1.1`** | Cloudflare | Cloudflare's fast public DNS directory |
| **`140.82.121.4`** | GitHub | Public web server hosting `github.com` |
| **`142.250.190.46`** | Google | Public web server hosting `google.com` |
| **`54.210.88.99`** | AWS (Amazon) | Public Elastic IP attached to an Application Load Balancer |

---

### Private IP Addresses (RFC 1918)
* **Non-Routable on Internet**: Internet routers immediately drop packets destined for private IPs. Nobody on the outside internet can directly ping or hack your private IP.
* **100% Free & Reusable**: Millions of homes, offices, and cloud VPCs safely reuse the exact same private IP addresses without any conflict.
* **Assigned by**: Your local home router (via DHCP), your Docker engine, or your AWS VPC.

#### 5 Real-World Private IP Examples:

| Private IP | RFC 1918 Class | Where You See It |
| :--- | :--- | :--- |
| **`192.168.1.1`** | Class C | The default gateway / admin page of your home Wi-Fi router |
| **`192.168.1.105`** | Class C | Your personal laptop or smartphone connected to home Wi-Fi |
| **`10.0.1.50`** | Class A | A private backend API server or database inside an AWS VPC |
| **`10.244.2.89`** | Class A | A microservice container (Pod) running inside a Kubernetes cluster |
| **`172.17.0.2`** | Class B | A local container running on Docker's default bridge network |

---

### The RFC 1918 Standard Ranges

Any IP starting with these numbers is guaranteed to be a **private network**:

| Class | CIDR Range | IP Range | Total Available IPs | Typical Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Class A** | `10.0.0.0/8` | `10.0.0.0` – `10.255.255.255` | **16,777,216** | **Cloud VPCs (AWS, GCP)**, Large Enterprises, Kubernetes Pod CIDRs |
| **Class B** | `172.16.0.0/12` | `172.16.0.0` – `172.31.255.255` | **1,048,576** | **Docker Default Bridge (`172.17.0.0/16`)**, Corporate LANs |
| **Class C** | `192.168.0.0/16` | `192.168.0.0` – `192.168.255.255` | **65,536** | **Home Wi-Fi routers**, Small office networks |

### Special Reserved IP Addresses

* **Loopback (`127.0.0.1` / `localhost`)**: Points back to the current machine. Packets never leave your computer.
* **Link-Local / APIPA (`169.254.0.0/16`)**: Auto-assigned when DHCP fails. Also used for the **Cloud Instance Metadata Service (IMDS)**: `http://169.254.169.254`.
* **Default Route / Wildcard (`0.0.0.0/0`)**: Represents "all IPv4 addresses" or "any network" in routing tables and firewall rules.

---

### How Private Devices Access the Internet: NAT (Network Address Translation)

If private IPs cannot route on the internet, how does a laptop with IP `192.168.1.5` or a private Kubernetes Pod browse GitHub? **Via NAT**.

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
    'textColor': '#e2e8f0'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; } .cluster * { filter: none !important; }'
}}%%
graph LR
    subgraph PrivateNetwork["Private Subnet / Local Network"]
        Server1["Backend Pod A<br/>Private IP: 10.0.2.15:42100"]
        Server2["Backend Pod B<br/>Private IP: 10.0.2.20:53120"]
    end

    subgraph GatewayEdge["Edge Router / Cloud NAT Gateway"]
        NAT["NAT Gateway / Router<br/><b>Public Elastic IP: 54.210.88.99</b><br/>Translates Private IP $\leftrightarrow$ Public IP via Port Mapping"]
    end

    subgraph InternetWorld["Public Internet"]
        GitHub[("GitHub / DockerHub<br/>Public IP: 140.82.121.4:443")]
    end

    Server1 -->|"Src: 10.0.2.15:42100"| NAT
    Server2 -->|"Src: 10.0.2.20:53120"| NAT
    NAT -->|"Src: 54.210.88.99:61001"| GitHub
    NAT -->|"Src: 54.210.88.99:61002"| GitHub

    style PrivateNetwork fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style GatewayEdge fill:none,stroke:#2b6d51,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style InternetWorld fill:none,stroke:#38668c,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    classDef cPriv fill:#1e293b,stroke:#475569,stroke-width:1.5px,color:#e2e8f0;
    classDef cNAT fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;
    classDef cPub fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;

    class Server1,Server2 cPriv;
    class NAT cNAT;
    class GitHub cPub;
```

* **SNAT (Source NAT)**: Replaces the private source IP of outgoing packets with the NAT Gateway's public IP. The NAT maintains a translation table mapping port numbers so it knows which private machine to return responses to.
* **DNAT (Destination NAT / Port Forwarding)**: Replaces the public destination IP with a private internal IP (used when incoming internet traffic hits an ingress controller or router port 80/443).

---

## 5. Subnetting: What is a Subnet and Why?

A **Subnet** (sub-network) is simply a smaller slice of a larger network—like dividing a large building into separate rooms or departments.

---

### What does the slash (`/24`) mean?

The slash number tells you **how many numbers are locked (fixed)**:

| Subnet Mask | What It Means | Total IPs | Where It Is Used |
| :--- | :--- | :--- | :--- |
| **/24** | **First 3 numbers locked** (`192.168.1.x`) | **256** IPs | Standard home Wi-Fi and microservice subnets |
| **/16** | **First 2 numbers locked** (`10.0.x.x`) | **65,536** IPs | Cloud VPCs (AWS / GCP) |
| **/32** | **All 4 numbers locked** (`10.0.1.50`) | **1** IP | A single specific server (used in firewall rules) |

---

### Why Do We Subnet? (The 2 Big Reasons)

1. **Security (Isolation)**:
   * Keep web servers in one subnet and databases in another subnet. If a hacker breaks into a web server, they cannot immediately reach the database.
2. **Organization**:
   * Instead of throwing thousands of servers into one big chaotic pool, you group them cleanly (e.g. Subnet A for Web, Subnet B for Worker Nodes, Subnet C for Data).

---

## 6. Public Network vs. Private Network (Cloud VPC Architecture)

In production cloud engineering, you deploy your systems inside a **Virtual Private Cloud (VPC)**. The VPC is divided into **Public Subnets** and **Private Subnets**.

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
    Internet(["🌐 The Public Internet"]) <--> IGW["Internet Gateway (IGW)"]

    subgraph VPC["Virtual Private Cloud (VPC: 10.0.0.0/16)"]
        subgraph PublicSubnet["Public Subnet (10.0.1.0/24)"]
            ALB["Application Load Balancer (Public IP: 52.14.8.10)"]
            NATGW["NAT Gateway (Public Elastic IP)"]
            Bastion["Bastion / Jump Host (SSH)"]
        end

        subgraph PrivateAppSubnet["Private Application Subnet (10.0.2.0/24)"]
            K8sNode1["K8s Worker Node 1 (10.0.2.50)"]
            K8sNode2["K8s Worker Node 2 (10.0.2.51)"]
            Pods["Kubernetes Microservice Pods"]
            K8sNode1 --- Pods
            K8sNode2 --- Pods
        end

        subgraph PrivateDataSubnet["Isolated Database Subnet (10.0.3.0/24)"]
            RDS[("PostgreSQL Primary (10.0.3.90)")]
            Redis[("Redis Cluster (10.0.3.95)")]
        end
    end

    IGW <-->|"Public Ingress / Egress"| ALB
    IGW <-->|"Public Ingress / Egress"| NATGW
    ALB -->|"Forwards internal HTTP"| K8sNode1
    ALB -->|"Forwards internal HTTP"| K8sNode2
    
    Pods -->|"Outbound updates via NAT"| NATGW
    NATGW -->|"Outbound only"| IGW

    Pods -->|"DB Queries (Port 5432)"| RDS
    Pods -->|"Cache Lookups (Port 6379)"| Redis

    style VPC fill:none,stroke:#475569,stroke-width:2px,stroke-dasharray: 6 4,color:#e2e8f0;
    style PublicSubnet fill:none,stroke:#38668c,stroke-width:1.5px,stroke-dasharray: 4 4,color:#e2e8f0;
    style PrivateAppSubnet fill:none,stroke:#2b6d51,stroke-width:1.5px,stroke-dasharray: 4 4,color:#e2e8f0;
    style PrivateDataSubnet fill:none,stroke:#8a5832,stroke-width:1.5px,stroke-dasharray: 4 4,color:#e2e8f0;

    classDef cEdge fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cPub fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cPriv fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;
    classDef cDB fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;

    class Internet,IGW cEdge;
    class ALB,NATGW,Bastion cPub;
    class K8sNode1,K8sNode2,Pods cPriv;
    class RDS,Redis cDB;
```

### The 3 Subnet Types in Production

| Subnet Type | Route Table Target for `0.0.0.0/0` | Public IP Allowed? | What Runs Here? |
| :--- | :--- | :--- | :--- |
| **Public Subnet** | Points to **Internet Gateway (`igw-xxxx`)** | **Yes** (Public Elastic IPs) | ALBs, NAT Gateways, Ingress Controllers, Bastion Hosts |
| **Private Subnet** | Points to **NAT Gateway (`nat-xxxx`)** | **No** (Private IPs only) | Kubernetes Worker Nodes, Microservices, Batch Workers |
| **Isolated Database Subnet**| **None** (No default route to internet) | **No** (Strictly internal) | Production RDS PostgreSQL, Aurora, MongoDB, Redis |

---

## 7. Firewalls: Controlling Ingress and Egress

A **Firewall** monitors and filters incoming (**Ingress**) and outgoing (**Egress**) network traffic based on predefined security rules.

### Stateful vs. Stateless Firewalls

In cloud environments like AWS, security is enforced at two distinct boundaries:

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
    'textColor': '#e2e8f0'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; } .cluster * { filter: none !important; }'
}}%%
graph TD
    Traffic(["Incoming Internet Traffic"]) --> NACL

    subgraph SubnetBoundary["Subnet Boundary"]
        NACL["Network ACL (NACL)<br/><b>Stateless Firewall</b><br/>Evaluates rules by rule number (100, 200, *)"]
    end

    subgraph InstanceBoundary["Instance / Pod Boundary"]
        SG["Security Group / Host Firewall<br/><b>Stateful Firewall</b><br/>Attached directly to virtual network interfaces (ENIs)"]
        Workload["Kubernetes Pod / EC2 Instance"]
        SG --> Workload
    end

    NACL --> SG

    style SubnetBoundary fill:none,stroke:#475569,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style InstanceBoundary fill:none,stroke:#2b6d51,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    classDef c1 fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef c2 fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;
    classDef cWorkload fill:#1e293b,stroke:#475569,stroke-width:1.5px,color:#e2e8f0;

    class NACL c1;
    class SG c2;
    class Workload cWorkload;
```

### The Fundamental Difference: Stateful vs. Stateless

| Feature | Security Group (Stateful) | Network ACL / NACL (Stateless) |
| :--- | :--- | :--- |
| **Operating Level** | Instance / Pod Network Interface (ENI) | Subnet Boundary |
| **State Tracking** | **Stateful**: Automatically tracks connections | **Stateless**: Treats request & response as completely unrelated |
| **Return Traffic** | **Automatically allowed** (If inbound port 443 is open, return traffic on any port is automatically permitted) | **Must explicitly allow return traffic** on ephemeral ports (`1024-65535`) |
| **Rule Processing** | All rules evaluated together; most permissive wins | Evaluated in strict numerical order (Rule 100, then 200) |
| **Deny Rules** | Cannot specify explicit `DENY` rules (all rules are allow) | Supports explicit `ALLOW` and `DENY` rules |

> [!TIP]
> **Kubernetes NetworkPolicies**:  
> In Kubernetes, a **NetworkPolicy** acts like a stateful pod-level firewall. By default, all Pods can talk to all other Pods across namespaces. Applying a NetworkPolicy isolates Pods so they can only accept traffic from designated services (e.g. only allow traffic from `frontend` to `backend` on TCP port 8080).

---

## 8. DNS (Domain Name System): The Phonebook of the Internet

Humans remember names (`api.mycompany.com`), but network routers only understand numerical IP addresses (`142.250.190.46`). **DNS** translates human-friendly hostnames into machine-routable IP addresses.

### Step-by-Step DNS Resolution Walkthrough

What happens under the hood when a user visits `https://api.example.com`?

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
    'textColor': '#e2e8f0'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; } .cluster * { filter: none !important; }'
}}%%
sequenceDiagram
    autonumber
    actor User as 👤 Client Browser
    participant OS as Local OS / Cache
    participant Resolver as Recursive Resolver<br/>(8.8.8.8 / 1.1.1.1)
    participant Root as Root Nameserver<br/>(".")
    participant TLD as TLD Nameserver<br/>(".com")
    participant Auth as Authoritative Nameserver<br/>(AWS Route 53)

    User->>OS: Query "api.example.com"
    OS-->>User: Cache Miss
    OS->>Resolver: Forward query to Recursive Resolver
    Resolver->>Root: Where is ".com"?
    Root-->>Resolver: Referral to TLD Servers (e.g. 192.5.6.30)
    Resolver->>TLD: Where is "example.com"?
    TLD-->>Resolver: Referral to Authoritative Nameserver (e.g. ns-1.awsdns.com)
    Resolver->>Auth: What is IP for "api.example.com"?
    Auth-->>Resolver: Returns A Record: 54.210.88.99 (TTL: 300s)
    Resolver-->>OS: Returns IP & caches for 300s
    OS-->>User: Returns IP: 54.210.88.99
    User->>User: Establishes TCP / TLS handshake to 54.210.88.99
```

### Essential DNS Record Types

| Record Type | Name | Purpose | Example |
| :--- | :--- | :--- | :--- |
| **A** | Address | Maps domain name to an **IPv4 address** | `api.example.com` $\rightarrow$ `54.210.88.99` |
| **CNAME** | Canonical Name | Creates an alias pointing to another domain name | `www.example.com` $\rightarrow$ `example.com` |
| **ALIAS / ANAME** | Virtual CNAME | Allows CNAME-like routing at the domain root (apex `@`) | `example.com` $\rightarrow$ `my-alb-123.us-east-1.elb.amazonaws.com` |
| **MX** | Mail Exchange | Directs emails to the destination mail server | `example.com` $\rightarrow$ `10 mail.google.com` |
| **TXT** | Text | Stores text metadata (SPF, DKIM, domain verification) | `"v=spf1 include:_spf.google.com ~all"` |
| **PTR** | Pointer | Reverse DNS: maps an IP back to a hostname | `54.210.88.99` $\rightarrow$ `ec2-54-210-88-99.compute.amazonaws.com` |
| **NS** | Name Server | Delegates a DNS zone to authoritative nameservers | `example.com` $\rightarrow$ `ns-1.awsdns.com` |

### TTL (Time To Live) and Caching

* **TTL** defines how many seconds a DNS resolver or client is allowed to cache the DNS record before making another query.
* **Low TTL (e.g. 60 seconds)**: Used during production migrations and blue/green deployments so changes propagate within 1 minute.
* **High TTL (e.g. 86400 seconds / 24 hours)**: Saves DNS query costs and speeds up lookups for static, rarely changing records.

---

### DNS in Kubernetes: CoreDNS

In Kubernetes, Pods are ephemeral: they die and restart with new, dynamic private IP addresses continuously. You **cannot hardcode IP addresses** in microservices.

Instead, Kubernetes runs an internal cluster DNS server called **CoreDNS**:

```text
       Format: <service-name>.<namespace>.svc.cluster.local
Example Query: order-service.prod.svc.cluster.local
```

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
    'textColor': '#e2e8f0'
  },
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; } .cluster * { filter: none !important; }'
}}%%
graph LR
    PodA["Frontend Pod<br/>(10.244.1.45)"] -->|"1. GET http://order-service"| CoreDNS[("CoreDNS Cluster Service<br/>10.96.0.10")]
    CoreDNS -->|"2. Resolves to ClusterIP: 10.96.15.200"| PodA
    PodA -->|"3. Traffic routed via kube-proxy iptables"| PodB["Order Service Pod<br/>(10.244.2.89)"]

    classDef cPod fill:#1e293b,stroke:#475569,stroke-width:1.5px,color:#e2e8f0;
    classDef cDNS fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;

    class PodA,PodB cPod;
    class CoreDNS cDNS;
```

* Every microservice exposes a static DNS name.
* When Pod A queries `http://order-service`, CoreDNS instantly resolves it to the service's virtual `ClusterIP`.
* Even if backend pods die and spin up on different worker nodes with new private IPs, the DNS name **never changes**.

---

## 9. Master Production Networking Cheat Sheet

| Concept | What It Is | Real-World Production Example | Kubernetes Manifest Equivalent |
| :--- | :--- | :--- | :--- |
| **Physical Medium** | Wired Fiber Optic | 100 Gbps AWS Direct Connect / Top-of-Rack Switch | Physical K8s Bare-Metal Node NICs |
| **Public IP** | Globally routable address | `54.210.88.99` (AWS Elastic IP) | LoadBalancer Service (`type: LoadBalancer`) |
| **Private IP** | Internal RFC 1918 address | `10.0.2.15` (AWS EC2 / K8s Worker Node IP) | Pod IP (`status.podIP`) |
| **Subnet / CIDR** | Network partition boundary | `10.0.1.0/24` (Subnet for 251 usable cloud hosts) | Pod CIDR allocation (`--pod-network-cidr=10.244.0.0/16`) |
| **Public Subnet** | Subnet with Internet Gateway route | Houses Application Load Balancers and Bastions | Ingress Controller pods with public load balancer |
| **Private Subnet** | Subnet routed via NAT Gateway | Houses Kubernetes Worker Nodes and Pods | Worker node nodes in private subnets |
| **Firewall (Stateful)** | Stateful packet inspection | AWS Security Group allowing port 443 | Kubernetes `NetworkPolicy` ingress/egress rules |
| **Firewall (Stateless)**| Subnet-level packet filtering | AWS Network ACL (NACL) blocking malicious CIDRs | Subnet ACL boundary |
| **DNS** | Domain name to IP translation | `api.company.com` $\rightarrow$ ALB Public IP | CoreDNS (`<svc>.<ns>.svc.cluster.local`) |
