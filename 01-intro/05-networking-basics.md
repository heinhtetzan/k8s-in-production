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

## 3. IP Addresses: IPv4 vs. IPv6

An **Internet Protocol (IP) Address** is a unique numerical label assigned to every device connected to a computer network that uses the Internet Protocol for communication.

* **Identity**: Identifies *who* the machine is.
* **Location / Routing**: Identifies *where* the machine is located on the global network topology.

### IPv4 vs. IPv6 Architecture

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
    subgraph IPv4["IPv4: 32-Bit Address (4 Octets / Decimal)"]
        v4["192 . 168 . 1 . 50<br/>(8 bits) . (8 bits) . (8 bits) . (8 bits) = 32 bits<br/><b>Total Addresses: 2^32 ≈ 4.29 Billion</b>"]
    end

    subgraph IPv6["IPv6: 128-Bit Address (8 Groups / Hexadecimal)"]
        v6["2001 : 0db8 : 85a3 : 0000 : 0000 : 8a2e : 0370 : 7334<br/>(16 bits × 8 groups = 128 bits)<br/><b>Total Addresses: 2^128 ≈ 340 Undecillion</b>"]
    end

    style IPv4 fill:none,stroke:#38668c,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;
    style IPv6 fill:none,stroke:#2b6d51,stroke-width:1.5px,stroke-dasharray: 6 4,color:#e2e8f0;

    classDef c1 fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef c2 fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;

    class v4 c1;
    class v6 c2;
```

| Feature | IPv4 | IPv6 |
| :--- | :--- | :--- |
| **Address Length** | 32 bits (4 bytes) | 128 bits (16 bytes) |
| **Format** | 4 decimal numbers separated by dots (`172.217.16.206`) | 8 hexadecimal blocks separated by colons (`2607:f8b0:4005::200e`) |
| **Total Address Pool** | $2^{32} \approx 4,294,967,296$ (4.29 billion) | $2^{128} \approx 3.4 \times 10^{38}$ (Virtually infinite) |
| **Current Status** | Globally exhausted since 2011 (relies heavily on NAT) | Rapidly expanding, supported by all major clouds & K8s dual-stack |
| **Configuration** | DHCP or manual static assignment | Stateless Address Autoconfiguration (SLAAC) or DHCPv6 |

---

## 4. Public IP vs. Private IP (and RFC 1918)

Because the 4.29 billion IPv4 address pool was exhausted, the internet relies on a strict distinction between **Public** and **Private** IP addresses.

### Public IP Addresses
* **Globally Unique**: No two devices on the public internet can share the same public IP at the same time.
* **Globally Routable**: Can be reached directly by any server in the world over internet backbones.
* **Assigned by**: IANA $\rightarrow$ Regional Registries (ARIN, RIPE, APNIC) $\rightarrow$ ISPs / Cloud Providers (AWS, GCP).
* **Cost**: Scarce and expensive (Cloud providers now charge $\approx \$3.65/\text{month}$ per public IPv4 address).

---

### Private IP Addresses (RFC 1918)
* **Non-Routable**: Public internet routers immediately drop packets destined for private IP addresses.
* **Reusable**: Millions of companies, home routers, and VPCs safely reuse the exact same private IP ranges simultaneously without conflict.
* **Assigned to**: Laptops, internal backend microservices, database clusters, and Kubernetes Pods.

### The RFC 1918 Standard Ranges

| Class | CIDR Range | IP Range | Total Available IPs | Typical Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Class A** | `10.0.0.0/8` | `10.0.0.0` – `10.255.255.255` | **16,777,216** | **Cloud VPCs (AWS, GCP)**, Large Enterprises, Kubernetes Pod CIDRs |
| **Class B** | `172.16.0.0/12` | `172.16.0.0` – `172.31.255.255` | **1,048,576** | **Docker Default Bridge (`172.17.0.0/16`)**, Corporate LANs |
| **Class C** | `192.168.0.0/16` | `192.168.0.0` – `192.168.255.255` | **65,536** | **Home Wi-Fi routers**, Small office networks |

### Special Reserved IP Addresses

* **Loopback (`127.0.0.1` / `localhost`)**: Points back to the current machine. Packets never leave the local network interface card (NIC).
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

## 5. Subnetting & CIDR: What is a Subnet and Why?

A **Subnet** (sub-network) is a logical subdivision of an IP network.

### What is CIDR Notation?

CIDR stands for **Classless Inter-Domain Routing**. It represents an IP address and its associated network mask using a slash followed by the number of leading bits reserved for the network prefix.

```text
       IP Address: 10 .  0 .  1 . 15 / 24
Binary Conversion: 00001010 . 00000000 . 00000001 . 00001111
  Network Bits   : [-------- 24 Network Bits --------] [8 Host Bits]
```

* The first **24 bits** identify the **Network/Subnet**.
* The remaining **8 bits** identify the **Host (individual machine/pod)** within that subnet.

### Breaking Down a `/24` Subnet (`10.0.1.0/24`)

* **Subnet Mask**: `255.255.255.0`
* **Total IP Addresses**: $2^{32 - 24} = 2^8 = 256$ IPs.
* **Network Address**: `10.0.1.0` (Identifies the subnet; cannot be assigned to a host).
* **Broadcast Address**: `10.0.1.255` (Sends packets to all hosts in the subnet; cannot be assigned to a host).
* **Usable Host Addresses**: `10.0.1.1` through `10.0.1.254` (**254 usable IPs**).

> [!CAUTION]
> **Cloud Provider Reserved IPs (e.g. AWS VPC)**:  
> In every AWS VPC subnet, **5 IP addresses** are reserved by AWS and cannot be assigned to instances or pods:
> * `.0`: Network Address
> * `.1`: Reserved by AWS for the VPC default router
> * `.2`: Reserved by AWS for DNS (AmazonProvidedDNS)
> * `.3`: Reserved by AWS for future use
> * `.255`: Network Broadcast Address
> * *Formula for AWS*: Total IPs minus $5$ (e.g., a `/24` gives $256 - 5 = 251$ usable IPs).

### CIDR Quick-Reference Cheat Sheet

| CIDR Prefix | Subnet Mask | Total Addresses | Usable IPs (Standard) | Usable IPs (AWS VPC) | Common Production Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **/16** | `255.255.0.0` | **65,536** | 65,534 | 65,531 | Standard VPC Root Range (e.g. `10.0.0.0/16`) |
| **/20** | `255.255.240.0` | **4,096** | 4,094 | 4,091 | Large Kubernetes Worker Node Subnet |
| **/24** | `255.255.255.0` | **256** | 254 | 251 | Standard Microservice / Web Tier Subnet |
| **/28** | `255.255.255.240` | **16** | 14 | 11 | Small Bastion Host / Transit Gateway Subnet |
| **/32** | `255.255.255.255` | **1** | 1 | 1 | Single specific host (used in firewall security rules) |

---

### Why Subnet? (The 4 Critical Architectural Reasons)

Why not just put every server into one giant flat network like `10.0.0.0/8`?

1. **Security Isolation & Defense in Depth**:
   * Databases should never sit on the same subnet as internet-facing web servers. If an attacker compromises a web container, subnet boundaries prevent them from directly scanning database ports.
2. **Broadcast Domain Containment**:
   * Devices on a local network use ARP (Address Resolution Protocol) broadcasts to discover MAC addresses. In a flat network with 10,000 servers, broadcast traffic overwhelms CPU cycles (broadcast storm). Subnetting confines broadcasts to manageable boundaries.
3. **Multi-Availability Zone (Multi-AZ) High Availability**:
   * In cloud architectures (AWS, GCP), **a subnet resides strictly inside a single physical data center (Availability Zone)**. To build a fault-tolerant Kubernetes cluster, you must create subnets across multiple AZs (`us-east-1a`, `us-east-1b`, `us-east-1c`).
4. **Independent Route Table Policies**:
   * Route tables attach at the subnet level. Subnetting allows you to route public subnet traffic out through an Internet Gateway, while routing private subnet traffic through a NAT Gateway.

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
| **AAAA** | IPv6 Address | Maps domain name to an **IPv6 address** | `api.example.com` $\rightarrow$ `2600:1f18::1` |
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
