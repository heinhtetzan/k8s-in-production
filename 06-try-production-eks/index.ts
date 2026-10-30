import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";

const config = new pulumi.Config();
const dbName = config.get("dbName") || "shop";
const dbUser = config.get("dbUser") || "shop";
const dbPassword = config.getSecret("dbPassword") || pulumi.secret(process.env.POSTGRES_PASSWORD || "");

// ============================================================================
// 1. VPC & Networking for EKS and RDS (Multi-AZ)
// ============================================================================
const azs = aws.getAvailabilityZonesOutput({ state: "available" });
const az1 = azs.names[0];
const az2 = azs.names[1];

const vpc = new aws.ec2.Vpc("shop-vpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: "shop-eks-vpc",
    "kubernetes.io/cluster/shop-eks-cluster": "shared",
  },
});

const igw = new aws.ec2.InternetGateway("shop-igw", {
  vpcId: vpc.id,
  tags: { Name: "shop-igw" },
});

// Public Subnets (for Ingress/ALB & NAT Gateway)
const publicSubnet1 = new aws.ec2.Subnet("public-subnet-1", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  availabilityZone: az1,
  mapPublicIpOnLaunch: true,
  tags: {
    Name: "shop-public-subnet-1",
    "kubernetes.io/role/elb": "1",
    "kubernetes.io/cluster/shop-eks-cluster": "shared",
  },
});

const publicSubnet2 = new aws.ec2.Subnet("public-subnet-2", {
  vpcId: vpc.id,
  cidrBlock: "10.0.2.0/24",
  availabilityZone: az2,
  mapPublicIpOnLaunch: true,
  tags: {
    Name: "shop-public-subnet-2",
    "kubernetes.io/role/elb": "1",
    "kubernetes.io/cluster/shop-eks-cluster": "shared",
  },
});

const publicRouteTable = new aws.ec2.RouteTable("public-rt", {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
  tags: { Name: "shop-public-rt" },
});

new aws.ec2.RouteTableAssociation("public-rta-1", {
  subnetId: publicSubnet1.id,
  routeTableId: publicRouteTable.id,
});

new aws.ec2.RouteTableAssociation("public-rta-2", {
  subnetId: publicSubnet2.id,
  routeTableId: publicRouteTable.id,
});

// NAT Gateway in Public Subnet 1 (enables private subnets to pull images)
const eip = new aws.ec2.Eip("nat-eip", {
  domain: "vpc",
  tags: { Name: "shop-nat-eip" },
});

const natGateway = new aws.ec2.NatGateway("shop-nat", {
  allocationId: eip.id,
  subnetId: publicSubnet1.id,
  tags: { Name: "shop-nat-gateway" },
}, { dependsOn: [igw] });

// Private Subnets (for EKS Worker Nodes & RDS)
const privateSubnet1 = new aws.ec2.Subnet("private-subnet-1", {
  vpcId: vpc.id,
  cidrBlock: "10.0.10.0/24",
  availabilityZone: az1,
  tags: {
    Name: "shop-private-subnet-1",
    "kubernetes.io/role/internal-elb": "1",
    "kubernetes.io/cluster/shop-eks-cluster": "shared",
  },
});

const privateSubnet2 = new aws.ec2.Subnet("private-subnet-2", {
  vpcId: vpc.id,
  cidrBlock: "10.0.20.0/24",
  availabilityZone: az2,
  tags: {
    Name: "shop-private-subnet-2",
    "kubernetes.io/role/internal-elb": "1",
    "kubernetes.io/cluster/shop-eks-cluster": "shared",
  },
});

const privateRouteTable = new aws.ec2.RouteTable("private-rt", {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", natGatewayId: natGateway.id }],
  tags: { Name: "shop-private-rt" },
});

new aws.ec2.RouteTableAssociation("private-rta-1", {
  subnetId: privateSubnet1.id,
  routeTableId: privateRouteTable.id,
});

new aws.ec2.RouteTableAssociation("private-rta-2", {
  subnetId: privateSubnet2.id,
  routeTableId: privateRouteTable.id,
});

// ============================================================================
// 2. AWS EKS Cluster
// ============================================================================
const cluster = new eks.Cluster("shop-cluster", {
  name: "shop-eks-cluster",
  vpcId: vpc.id,
  publicSubnetIds: [publicSubnet1.id, publicSubnet2.id],
  privateSubnetIds: [privateSubnet1.id, privateSubnet2.id],
  nodeAssociatePublicIpAddress: false, // EKS nodes stay private for security
  instanceType: "t3.small",
  desiredCapacity: 2,
  minSize: 2,
  maxSize: 6,
  createOidcProvider: false, // SCP denies iam:CreateOpenIDConnectProvider; not needed for our app
  corednsAddonOptions: { enabled: false }, // Disables blocking addon check; CoreDNS runs automatically on nodes
  authenticationMode: "API_AND_CONFIG_MAP", // Sourced from both EKS Access Entries and aws-auth ConfigMap
  enabledClusterLogTypes: [], // Disabled to prevent CloudWatch log ingestion charges
  tags: {
    Environment: "dev",
    Project: "hello-k8s",
  },
});


// ============================================================================
// EKS Access Entries & Policy Associations (Console & CI/CD Admin Access)
// ============================================================================
// AWS Management Console Session Role (AccountFullAccessRole)
export const consoleAccessEntry = new aws.eks.AccessEntry("console-access-entry", {
  clusterName: cluster.eksCluster.name,
  principalArn: "arn:aws:iam::542601847638:role/managed/AccountFullAccessRole",
  type: "STANDARD",
});

export const consoleAccessPolicy = new aws.eks.AccessPolicyAssociation("console-access-policy", {
  clusterName: cluster.eksCluster.name,
  principalArn: consoleAccessEntry.principalArn,
  policyArn: "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
  accessScope: {
    type: "cluster",
  },
});

// GitHub Actions Deployer IAM User
export const deployerAccessEntry = new aws.eks.AccessEntry("github-actions-access-entry", {
  clusterName: cluster.eksCluster.name,
  principalArn: "arn:aws:iam::542601847638:user/github-actions-deployer",
  type: "STANDARD",
});

export const deployerAccessPolicy = new aws.eks.AccessPolicyAssociation("github-actions-access-policy", {
  clusterName: cluster.eksCluster.name,
  principalArn: deployerAccessEntry.principalArn,
  policyArn: "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
  accessScope: {
    type: "cluster",
  },
});


// ============================================================================
// 3. AWS RDS PostgreSQL Database
// ============================================================================
// DB Subnet Group inside Private Subnets
const dbSubnetGroup = new aws.rds.SubnetGroup("shop-db-subnet-group", {
  subnetIds: [privateSubnet1.id, privateSubnet2.id],
  tags: { Name: "shop-db-subnet-group" },
});

// RDS Security Group (allows inbound port 5432 from EKS cluster nodes only)
const dbSecurityGroup = new aws.ec2.SecurityGroup("shop-db-sg", {
  vpcId: vpc.id,
  description: "Allow inbound PostgreSQL traffic from EKS worker nodes",
  ingress: [
    {
      protocol: "tcp",
      fromPort: 5432,
      toPort: 5432,
      securityGroups: [cluster.nodeSecurityGroupId],
      cidrBlocks: [vpc.cidrBlock],
      description: "Postgres from EKS node security group and VPC",
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  tags: { Name: "shop-db-sg" },
});

// AWS RDS PostgreSQL Instance
const rdsInstance = new aws.rds.Instance("shop-postgres", {
  identifier: "shop-postgres-db",
  engine: "postgres",
  engineVersion: "16.10",
  instanceClass: "db.t4g.micro",
  allocatedStorage: 20,
  maxAllocatedStorage: 50,
  dbName: dbName,
  username: dbUser,
  password: dbPassword,
  dbSubnetGroupName: dbSubnetGroup.name,
  vpcSecurityGroupIds: [dbSecurityGroup.id],
  skipFinalSnapshot: true,
  publiclyAccessible: false, // Kept private inside VPC
  tags: {
    Name: "shop-postgres-db",
    Environment: "dev",
  },
});

// ============================================================================
// 4. Route 53 & Custom Domain Management (kendrickdev.shop)
// ============================================================================
const domainName = config.get("domainName") || "kendrickdev.shop";

// Look up existing Route 53 public hosted zone
const zone = aws.route53.getZoneOutput({
  name: domainName,
  privateZone: false,
});

// Optional ALB/ELB hostnames for automated DNS routing
// For Single ALB Ingress (Cost-optimized ~$20/mo):
//   pulumi config set albHost <alb-hostname>
// Or for individual Classic ELBs:
//   pulumi config set shopElbHost <shop-elb-dns>
//   pulumi config set apiElbHost <api-elb-dns>
//   pulumi config set dashboardElbHost <dashboard-elb-dns>
const albHost = config.get("albHost");
const shopElbHost = albHost || config.get("shopElbHost");
const apiElbHost = albHost || config.get("apiElbHost");
const dashboardElbHost = albHost || config.get("dashboardElbHost");

// Canonical Hosted Zone ID for Classic ELB/ALB in ap-southeast-2
const apSoutheast2ElbZoneId = "Z1GM3OXH4ZPM65";

// Apex record (kendrickdev.shop) -> Shop Frontend LoadBalancer
const apexDnsRecord = shopElbHost
  ? new aws.route53.Record("shop-apex-record", {
    zoneId: zone.zoneId,
    name: domainName,
    type: "A",
    aliases: [
      {
        name: shopElbHost,
        zoneId: apSoutheast2ElbZoneId,
        evaluateTargetHealth: false,
      },
    ],
  })
  : undefined;

// WWW record (www.kendrickdev.shop) -> Shop Frontend LoadBalancer
const wwwDnsRecord = shopElbHost
  ? new aws.route53.Record("shop-www-record", {
    zoneId: zone.zoneId,
    name: `www.${domainName}`,
    type: "CNAME",
    ttl: 300,
    records: [shopElbHost],
  })
  : undefined;

// API record (api.kendrickdev.shop) -> Backend API LoadBalancer
const apiDnsRecord = apiElbHost
  ? new aws.route53.Record("api-record", {
    zoneId: zone.zoneId,
    name: `api.${domainName}`,
    type: "CNAME",
    ttl: 300,
    records: [apiElbHost],
  })
  : undefined;

// Dashboard record (dashboard.kendrickdev.shop) -> Shop Dashboard Frontend LoadBalancer
const dashboardDnsRecord = dashboardElbHost
  ? new aws.route53.Record("dashboard-record", {
    zoneId: zone.zoneId,
    name: `dashboard.${domainName}`,
    type: "CNAME",
    ttl: 300,
    records: [dashboardElbHost],
  })
  : undefined;

// ============================================================================
// 5. Exports
// ============================================================================
export const vpcId = vpc.id;
export const clusterName = cluster.eksCluster.name;
export const kubeconfig = cluster.kubeconfig;
export const rdsEndpoint = rdsInstance.endpoint;
export const rdsAddress = rdsInstance.address;
export const rdsPort = rdsInstance.port;
export const route53ZoneId = zone.zoneId;
export const customDomain = domainName;
export const certificateArn = "arn:aws:acm:ap-southeast-2:542601847638:certificate/ca4e8033-f63c-461f-867d-96ab9cb887fc";
export const mediaBucketName = "shop-media-542601847638";
export const mediaBucketUrl = "https://shop-media-542601847638.s3.ap-southeast-2.amazonaws.com";

// Database connection string formatted for Kubernetes secret
export const databaseUrl = pulumi.interpolate`postgres://${dbUser}:${dbPassword}@${rdsInstance.endpoint}/${dbName}?sslmode=require`;
