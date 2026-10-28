# AWS IAM Guide: Users, Policies & Scoped Permissions (S3, EC2, EKS)

A hands-on, practical guide to **AWS Identity and Access Management (IAM)**—from creating users and understanding policy syntax to enforcing least-privilege access for **Amazon S3**, **Amazon EC2**, and **Amazon EKS (Kubernetes)**.


---

## 1. Core Concepts: Users, Groups, Roles & Policies

```text
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│    IAM User     │ ───►  │    IAM Group    │ ───►  │       IAM Policy       │
│  (Person / CLI) │       │  (Developers)   │       │ (JSON Permission Doc)  │
└─────────────────┘       └─────────────────┘       └────────────────────────┘
                                                                ▲
┌─────────────────┐                                             │
│    IAM Role     │ ────────────────────────────────────────────┘
│ (EC2, Pod, App) │ (Temporary Credentials assumed by Services or Users)
└─────────────────┘
```

* **IAM User**: An identity created in your account representing an individual person or service with permanent credentials (console password or CLI access keys).
* **IAM Group**: A collection of users. Applying permissions to a group automatically grants them to all group members.
* **IAM Role**: An identity with specific permissions, but **no permanent credentials**. It is temporarily assumed by EC2 instances, Lambda functions, Kubernetes pods, or cross-account users.
* **IAM Policy**: A JSON document formally defining **what actions** are allowed or denied on **which resources**.

---

## 2. Step-by-Step: Create a New IAM User

---

### Method A: Using AWS CLI (Fastest)

#### Step 1: Create the User
```bash
aws iam create-user --user-name john-developer
```

#### Step 2: Choose Credential Type

* **For CLI & API Access (Access Key + Secret Key)**:
  ```bash
  aws iam create-access-key --user-name john-developer
  ```
  **Output (Save these immediately—the Secret Key is shown only once!):**
  ```json
  {
      "AccessKey": {
          "UserName": "john-developer",
          "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
          "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          "Status": "Active"
      }
  }
  ```

* **For AWS Management Console Access (Web UI Login)**:
  ```bash
  aws iam create-login-profile \
    --user-name john-developer \
    --password "InitialPassword123!" \
    --password-reset-required
  ```

#### Step 3: Verify the User Exists
```bash
aws iam get-user --user-name john-developer
```

---

### Method B: Using AWS Management Console

1. Navigate to the **IAM Console** $\rightarrow$ Click **Users** on the left menu $\rightarrow$ Click **Create user**.
2. **User details**:
   * Enter User name: `john-developer`.
   * Check **Provide user access to the AWS Management Console** (if web login is needed).
   * Choose **I want to create an IAM-user** and set a password.
3. **Set permissions**:
   * *Option 1 (Recommended)*: **Add user to group** (e.g. `Developers` group).
   * *Option 2*: **Attach policies directly** (search for managed policies like `AmazonS3ReadOnlyAccess`).
4. Click **Next** $\rightarrow$ Review $\rightarrow$ Click **Create user**.
5. Download the `.csv` credentials file containing the login link, username, and password.

---

## 3. Understanding "All Permissions" (AdministratorAccess)

When you grant an identity full administrative control, you attach the AWS-managed policy named **`AdministratorAccess`**.

### Policy Breakdown

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
```

#### What Every Line Means:
* **`"Version": "2012-10-17"`**: The language specification version for IAM policy evaluation (do not change this to today's date—`2012-10-17` is the current standard policy version).
* **`"Effect": "Allow"`**: Grants permission (the alternative is `"Deny"`, which always overrides an Allow).
* **`"Action": "*"`**: Wildcard matching **every single API call across all 200+ AWS services** (`ec2:*`, `s3:*`, `rds:*`, `iam:*`, etc.).
* **`"Resource": "*"`**: Applies the permission across **every single resource in your account** in every AWS region.

---

### Root Account vs Administrator IAM User

| Attribute | Root Account (`root`) | Administrator IAM User |
| :--- | :--- | :--- |
| **Identity** | The email address used to sign up for AWS | An IAM user inside the account with `AdministratorAccess` |
| **Capabilities** | Unlimited. Can close the account, change billing plans, restore lost permissions | Can manage all infrastructure, create users, databases, networks |
| **Cannot Do** | Cannot be restricted by IAM policies | Cannot close the AWS account or change root credentials |
| **Best Practice** | **Lock away with hardware MFA.** Never create access keys for root. Never use for daily tasks! | Use for initial setup and emergency administration only. |

> [!CAUTION]
> **Never assign `AdministratorAccess` to applications, CI/CD runners, or team members who only need specific services.** A leaked admin key allows an attacker to delete your entire cloud infrastructure or launch thousands of expensive GPU mining instances.

---

## 4. Scoped Policy 1: S3 Only Access

---

### Full S3 Access vs Scoped Single Bucket Access

* **`AmazonS3FullAccess` (AWS Managed)**: Allows creating, deleting, and modifying **all** S3 buckets across the entire account.
* **Scoped Single Bucket Policy (Least Privilege)**: Restricts the user to **one specific project bucket**, preventing them from viewing or modifying other buckets.

---

### Production-Grade Single Bucket JSON Policy

Create a file named `s3-bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowListBucketContents",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::my-production-app-bucket"
    },
    {
      "Sid": "AllowReadWriteObjectsInsideBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-production-app-bucket/*"
    }
  ]
}
```

> [!NOTE]
> * Notice the difference between `Resource`:
>   * `arn:aws:s3:::my-production-app-bucket` (No slash) is required for bucket-level actions like `s3:ListBucket`.
>   * `arn:aws:s3:::my-production-app-bucket/*` (With `/*`) applies to the objects *inside* the bucket for `GetObject`, `PutObject`, and `DeleteObject`.

---

### Attach and Test with CLI

#### 1. Attach the Inline Policy to the User:
```bash
aws iam put-user-policy \
  --user-name john-developer \
  --policy-name SpecificBucketAccess \
  --policy-document file://s3-bucket-policy.json
```

#### 2. Test S3 Access (Should SUCCEED):
```bash
# List files in the permitted bucket
aws s3 ls s3://my-production-app-bucket/

# Upload a test file
aws s3 cp test.txt s3://my-production-app-bucket/test.txt
```

#### 3. Test EC2 Access (Should FAIL with AccessDenied):
```bash
aws ec2 describe-instances
```
**Expected Error:**
```text
An error occurred (UnauthorizedOperation) when calling the DescribeInstances operation: 
You are not authorized to perform this operation.
```

---

## 5. Scoped Policy 2: EC2 Only Access

---

### Full EC2 Access vs Operator (Start/Stop Only)

* **`AmazonEC2FullAccess`**: Allows launching large expensive instances, deleting VPCs, terminating instances, and attaching internet gateways.
* **Safe EC2 Operator Policy**: Allows engineers to inspect instances and reboot/stop/start instances for maintenance, but **forbids terminating instances or modifying security groups**.

---

### Safe EC2 Operator JSON Policy

Create a file named `ec2-operator-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDescribeAllEC2",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeImages",
        "ec2:DescribeKeyPairs",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowStartStopRebootExistingInstances",
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/*"
    }
  ]
}
```

---

### Attach and Test with CLI

#### 1. Attach Policy:
```bash
aws iam put-user-policy \
  --user-name john-developer \
  --policy-name EC2OperatorOnly \
  --policy-document file://ec2-operator-policy.json
```

#### 2. Test EC2 Inspection & Start/Stop (Should SUCCEED):
```bash
# View running instances
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"

# Reboot an instance
aws ec2 reboot-instances --instance-ids i-0123456789abcdef0
```

#### 3. Test EC2 Termination (Should FAIL):
```bash
aws ec2 terminate-instances --instance-ids i-0123456789abcdef0
```
**Expected Error:**
```text
An error occurred (UnauthorizedOperation) when calling the TerminateInstances operation: 
You are not authorized to perform this operation.
```

---

## 6. EKS & IAM: Kubernetes Cluster Authentication

In Amazon EKS, **IAM authenticates the user**, while **Kubernetes RBAC controls what the user can do** inside the cluster (`pods`, `deployments`, `namespaces`).

---

### How IAM Authenticates with Kubernetes

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / CI Runner
    participant CLI as AWS CLI / kubectl
    participant IAM as AWS IAM (STS)
    participant EKS as EKS Control Plane
    participant RBAC as K8s RBAC Engine

    Dev->>CLI: kubectl get pods
    CLI->>IAM: 1. Request temporary signed token (aws sts get-caller-identity)
    IAM-->>CLI: 2. Return signed bearer token (k8s-aws-v1...)
    CLI->>EKS: 3. Send HTTP request with bearer token
    EKS->>IAM: 4. Verify token signature & extract IAM ARN
    IAM-->>EKS: 5. Token Valid! User is: arn:aws:iam::123:user/john
    EKS->>RBAC: 6. Check EKS Access Entry & RBAC permissions for john
    RBAC-->>EKS: 7. Permitted to read pods
    EKS-->>CLI: 8. Return Pod List
```

---

### Granting a User Access to EKS (Modern Access Entries)

Starting with Amazon EKS version 1.23+, AWS introduced **EKS Access Entries**, replacing the legacy, fragile `aws-auth` ConfigMap.

#### Step 1: Create an EKS Access Entry for the IAM User
```bash
aws eks create-access-entry \
  --cluster-name production-cluster \
  --principal-arn arn:aws:iam::123456789012:user/john-developer \
  --type STANDARD
```

---

### Cluster Admin vs Read-Only Viewer

AWS provides standardized **EKS Cluster Access Policies**:

#### Option A: Grant Full Cluster Administrator Access
```bash
aws eks associate-access-policy \
  --cluster-name production-cluster \
  --principal-arn arn:aws:iam::123456789012:user/john-developer \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

#### Option B: Grant Read-Only Viewer Access (View pods, services, logs)
```bash
aws eks associate-access-policy \
  --cluster-name production-cluster \
  --principal-arn arn:aws:iam::123456789012:user/john-developer \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy \
  --access-scope type=cluster
```

#### Option C: Restrict User to a Specific Kubernetes Namespace (e.g. `staging` only)
```bash
aws eks associate-access-policy \
  --cluster-name production-cluster \
  --principal-arn arn:aws:iam::123456789012:user/john-developer \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy \
  --access-scope type=namespace,namespaces=staging
```

#### Step 2: Connect `kubectl` using the User's Credentials
On the developer's computer:

```bash
# 1. Update local kubeconfig to point to the EKS cluster
aws eks update-kubeconfig \
  --region us-east-1 \
  --name production-cluster \
  --profile dev-profile

# 2. Test Kubernetes cluster connection
kubectl get nodes
kubectl get pods -A
```

---

### Pod-Level Permissions: EKS Pod Identity & IRSA

> [!IMPORTANT]
> **Never embed static AWS Access Keys inside Docker containers or Kubernetes Secrets.**

To give a container inside Kubernetes access to AWS services (e.g. your backend pod needs to read from S3):

```text
┌───────────────────────────────┐
│ Kubernetes Pod (Spring / Go)  │
│  ServiceAccount: "order-sa"   │
└──────────────┬────────────────┘
               │ (EKS Pod Identity Agent)
               ▼
┌───────────────────────────────┐
│     IAM Role: "OrderAppRole"  │
│     Policy: "S3ReadWrite"     │
└──────────────┬────────────────┘
               │ (Automatic STS temporary token injected into pod)
               ▼
┌───────────────────────────────┐
│       Amazon S3 Bucket        │
└───────────────────────────────┘
```

#### Setup EKS Pod Identity (Fast & Modern):
```bash
# 1. Create the IAM Role with trust policy for pods
aws iam create-role \
  --role-name OrderServiceS3Role \
  --assume-role-policy-document file://pods-trust-policy.json

# 2. Attach S3 policy to that role
aws iam attach-role-policy \
  --role-name OrderServiceS3Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 3. Associate Kubernetes ServiceAccount with the IAM Role
aws eks create-pod-identity-association \
  --cluster-name production-cluster \
  --namespace default \
  --service-account order-service-sa \
  --role-arn arn:aws:iam::123456789012:role/OrderServiceS3Role
```

Now any pod running with `serviceAccountName: order-service-sa` automatically inherits S3 access without storing credentials!

---

## 7. 📌 IAM Policy Comparison Matrix

| Permission Requirement | Recommended Policy Strategy | Sample Policy ARN / Scope |
| :--- | :--- | :--- |
| **Full Account Admin** | AWS Managed `AdministratorAccess` | `arn:aws:iam::aws:policy/AdministratorAccess` (Emergency/Root only) |
| **All S3 Buckets** | AWS Managed `AmazonS3FullAccess` | `arn:aws:iam::aws:policy/AmazonS3FullAccess` |
| **Single Specific S3 Bucket** | Custom Customer Managed Policy | Scoped to `arn:aws:s3:::bucket-name` and `arn:aws:s3:::bucket-name/*` |
| **All EC2 Instances** | AWS Managed `AmazonEC2FullAccess` | `arn:aws:iam::aws:policy/AmazonEC2FullAccess` |
| **EC2 Maintenance (No Terminate)** | Custom Customer Managed Policy | Allows `ec2:Describe*`, `ec2:StartInstances`, `ec2:StopInstances` |
| **EKS Full Cluster Admin** | EKS Access Entry + ClusterAdminPolicy | `arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy` |
| **EKS Read-Only Pod Viewer** | EKS Access Entry + ViewPolicy | `arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy` |
| **EKS Pod Accessing AWS APIs** | EKS Pod Identity / IRSA | IAM Role assumed by Kubernetes `ServiceAccount` |
