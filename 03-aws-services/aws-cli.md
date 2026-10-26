# AWS CLI Guide: Authentication, Profiles, S3, EC2 & RDS

A hands-on, practical cheat sheet and guide for working with the **AWS Command Line Interface (AWS CLI v2)** in production environments.

---

## 1. Prerequisites & Verification

Ensure you have AWS CLI version 2 installed:

```bash
# Check version (must be aws-cli/2.x)
aws --version

# Enable CLI autocompletion (zsh / bash)
complete -C '/usr/local/bin/aws_completer' aws
```

---

## 2. Authentication & Login Made Simple

### Method 1: Standard Login with Access Keys (`aws configure`)

> **Best for:** Personal AWS accounts, standard IAM users, long-lived dev keys.

#### Step 1: Run `aws configure`
```bash
aws configure
```

Fill in the 4 interactive prompts:
```text
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

#### Step 2: Verify you are logged in
```bash
aws sts get-caller-identity
```
If successful, it returns your Account ID and IAM User ARN:
```json
{
    "UserId": "AIDAS6OEXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/developer"
}
```

---

### Method 2: Multiple Accounts / Named Profiles (`--profile`)

> **Best for:** Switching between `dev`, `staging`, and `prod` without overwriting keys.

#### Step 1: Save credentials under a named profile
Use `--profile <name>` during configuration:

```bash
# Configure your dev account
aws configure --profile dev

# Configure your production account
aws configure --profile prod
```

#### Step 2: Use the profile in commands
You have two easy ways to use it:

```bash
# Option A: Add --profile flag to any command
aws s3 ls --profile dev
aws ec2 describe-instances --profile prod

# Option B: Switch your entire terminal window to that profile
export AWS_PROFILE=prod
aws sts get-caller-identity   # Now running as prod!
```

---

### How to Logout & Disconnect

To remove your credentials and ensure no active session remains in your terminal:

```bash
# Unset all AWS credential variables from terminal session
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE
```

**Confirm you are logged out:**
```bash
aws sts get-caller-identity
```
Output will confirm no active session:
```text
Unable to locate credentials. You can configure credentials by running "aws configure".
```

---

## 3. AWS CLI with Amazon S3

High-level `aws s3` provides human-friendly commands similar to Unix `ls`, `cp`, `mv`, and `sync`.

---

### 3.1 Bucket Lifecycle (`ls`, `mb`, `rb`)

```bash
# List all buckets in your account
aws s3 ls

# Create a new bucket in specific region (default: us-east-1)
aws s3 mb s3://my-app-assets-production-2026 --region us-east-1

# List contents of a bucket
aws s3 ls s3://my-app-assets-production-2026/

# List contents with human-readable file sizes and recursively
aws s3 ls s3://my-app-assets-production-2026/ --human-readable --recursive

# Delete an empty bucket
aws s3 rb s3://my-app-assets-production-2026

# Force delete bucket AND all objects/versions inside it
aws s3 rb s3://my-app-assets-production-2026 --force
```

---

### 3.2 File Operations (`cp`, `mv`, `rm`)

```bash
# Upload a single file
aws s3 cp app-build.tar.gz s3://my-app-assets-production-2026/builds/

# Upload file with explicit MIME type and cache-control headers
aws s3 cp index.html s3://my-app-assets-production-2026/ \
  --content-type "text/html" \
  --cache-control "max-age=3600"

# Download a file from S3 to current local directory
aws s3 cp s3://my-app-assets-production-2026/builds/app-build.tar.gz ./

# Move/Rename an object inside S3
aws s3 mv s3://my-app-assets-production-2026/old-name.jpg s3://my-app-assets-production-2026/new-name.jpg

# Delete a single object
aws s3 rm s3://my-app-assets-production-2026/old-file.txt

# Delete all files under a prefix (folder)
aws s3 rm s3://my-app-assets-production-2026/logs/ --recursive
```

---

### 3.3 Synchronizing Folders (`aws s3 sync`)

`aws s3 sync` compares modification times and file sizes, uploading only modified or new files.

```bash
# Deploy a frontend static build folder (e.g. Vite / React dist)
aws s3 sync ./dist s3://my-app-assets-production-2026/

# Sync and delete files in S3 that no longer exist locally
aws s3 sync ./dist s3://my-app-assets-production-2026/ --delete

# Exclude/Include patterns during sync
aws s3 sync ./assets s3://my-app-assets-production-2026/assets/ \
  --exclude "*.DS_Store" \
  --exclude ".git/*" \
  --include "*.png"
```

---

## 4. AWS CLI with Amazon EC2

Manage virtual servers, instances lifecycle, security groups, and key pairs.

---

### 4.1 Launch the Instance

Launch an Ubuntu Server (ARM64) instance in region **`ap-southeast-2`** using AMI **`ami-0be7d1b5b9749d43a`**.

> [!NOTE]
> `ami-0be7d1b5b9749d43a` is an **ARM64** image. Therefore, use an ARM-based instance type like **`t4g.small`** or **`t4g.micro`**.

#### Quick Launch (Uses Default VPC & Subnet automatically)
```bash
aws ec2 run-instances \
  --region ap-southeast-2 \
  --image-id ami-0be7d1b5b9749d43a \
  --instance-type t4g.small \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-ubuntu-server}]'
```

#### Launch with SSH Key Pair & Security Group (Ready to SSH)
```bash
aws ec2 run-instances \
  --region ap-southeast-2 \
  --image-id ami-0be7d1b5b9749d43a \
  --instance-type t4g.small \
  --key-name hello-aws \
  --security-group-ids sg-03fa60d8037398646 \
  --count 1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-ubuntu-server}]'
```

#### Launch with User Data Bootstrap Script (Auto-Install Docker)
```bash
aws ec2 run-instances \
  --region ap-southeast-2 \
  --image-id ami-0be7d1b5b9749d43a \
  --instance-type t4g.small \
  --user-data file://install-docker.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=docker-host}]'
```

---

### 4.2 View & Query Instances (`describe-instances`)

Once an instance is launched, verify its state and retrieve its Public IP:

```bash
# View running instances in ap-southeast-2 (ID, Type, Status, Public IP, Name)
aws ec2 describe-instances \
  --region ap-southeast-2 \
  --filters "Name=instance-state-name,Values=running,pending" \
  --query "Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name,PublicIpAddress,PrivateIpAddress,Tags[?Key=='Name'].Value | [0]]" \
  --output table

# Find specific instance by tag Name
aws ec2 describe-instances \
  --region ap-southeast-2 \
  --filters "Name=tag:Name,Values=my-ubuntu-server" \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
  --output table

# Get Public IP of a specific instance ID
aws ec2 describe-instances \
  --region ap-southeast-2 \
  --instance-ids i-0123456789abcdef0 \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text
```

---

### 4.3 Instance Lifecycle (`start`, `stop`, `reboot`, `terminate`)

```bash
# Stop a running instance (halts compute charges; EBS storage charges still apply)
aws ec2 stop-instances --instance-ids i-0123456789abcdef0

# Start a stopped instance
aws ec2 start-instances --instance-ids i-0123456789abcdef0

# Reboot an instance
aws ec2 reboot-instances --instance-ids i-0123456789abcdef0

# Terminate (Permanently delete) an instance
aws ec2 terminate-instances --instance-ids i-0123456789abcdef0
```

---

### 4.4 Security Groups & Key Pairs

```bash
# Create a Security Group
aws ec2 create-security-group \
  --group-name "web-traffic-sg" \
  --description "Allow inbound HTTP and HTTPS" \
  --vpc-id vpc-0123456789abcdef0

# Authorize inbound HTTPS (443) and HTTP (80)
aws ec2 authorize-security-group-ingress \
  --group-id sg-0123456789abcdef0 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-0123456789abcdef0 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Create and download a new SSH Key Pair
aws ec2 create-key-pair \
  --key-name my-ssh-key \
  --query "KeyMaterial" \
  --output text > ~/.ssh/my-ssh-key.pem

# Set secure permissions on private key
chmod 400 ~/.ssh/my-ssh-key.pem
```

---

## 5. AWS CLI with Amazon RDS

Provision, inspect, snapshot, and manage relational database instances (PostgreSQL & MySQL).

---

### 5.1 Inspect Databases (`describe-db-instances`)

```bash
# List all RDS database instances
aws rds describe-db-instances

# Table summary of DB Identifier, Engine, Status, Endpoint, and Class
aws rds describe-db-instances \
  --query "DBInstances[*].[DBInstanceIdentifier,Engine,DBInstanceStatus,Endpoint.Address,DBInstanceClass]" \
  --output table

# Extract database connection endpoint address
aws rds describe-db-instances \
  --db-instance-identifier prod-postgres-db \
  --query "DBInstances[0].Endpoint.Address" \
  --output text
```

---

### 5.2 Create a Managed Database (`create-db-instance`)

```bash
# Create a PostgreSQL 16 database instance
aws rds create-db-instance \
  --db-instance-identifier prod-postgres-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.3 \
  --master-username dbadmin \
  --master-user-password "SuperSecretPass123!" \
  --allocated-storage 20 \
  --max-allocated-storage 100 \
  --storage-type gp3 \
  --no-publicly-accessible \
  --vpc-security-group-ids sg-0123456789abcdef0 \
  --backup-retention-period 7
```

---

### 5.3 Snapshots & Backups (`create-db-snapshot`, `restore`)

```bash
# Take a manual snapshot before deploying schema migrations
aws rds create-db-snapshot \
  --db-instance-identifier prod-postgres-db \
  --db-snapshot-identifier prod-postgres-db-pre-migration-$(date +%F)

# List available snapshots for a database
aws rds describe-db-snapshots \
  --db-instance-identifier prod-postgres-db \
  --query "DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]" \
  --output table

# Restore a database from a snapshot to a new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prod-postgres-db-restored \
  --db-snapshot-identifier prod-postgres-db-pre-migration-2026-10-26
```

---

### 5.4 Modify, Stop, Start & Delete Database

```bash
# Stop a database (Saves compute costs in Dev/Staging overnight)
aws rds stop-db-instance --db-instance-identifier dev-postgres-db

# Start a stopped database
aws rds start-db-instance --db-instance-identifier dev-postgres-db

# Modify instance class (scale compute up to db.t4g.medium)
aws rds modify-db-instance \
  --db-instance-identifier prod-postgres-db \
  --db-instance-class db.t4g.medium \
  --apply-immediately

# Delete database with a final backup snapshot
aws rds delete-db-instance \
  --db-instance-identifier dev-postgres-db \
  --final-db-snapshot-identifier dev-postgres-final-snapshot

# Delete database without a final snapshot (Development only!)
aws rds delete-db-instance \
  --db-instance-identifier dev-postgres-db \
  --skip-final-snapshot
```

---

## 📌 Summary Reference Card

| Goal | CLI Command |
| :--- | :--- |
| **Check Active Identity** | `aws sts get-caller-identity` |
| **Configure Basic Key** | `aws configure` |
| **Switch Named Profile** | `export AWS_PROFILE=<profile-name>` |
| **Logout / Clear Environment** | `unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE` |
| **List S3 Buckets** | `aws s3 ls` |
| **Sync S3 Directory** | `aws s3 sync ./dist s3://<bucket>/ --delete` |
| **Upload File to S3** | `aws s3 cp app.tar.gz s3://<bucket>/` |
| **List Running EC2s** | `aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"` |
| **Launch EC2 Instance** | `aws ec2 run-instances --image-id <ami> --instance-type <type> --key-name <key>` |
| **Start / Stop EC2** | `aws ec2 start-instances / stop-instances --instance-ids <id>` |
| **Terminate EC2** | `aws ec2 terminate-instances --instance-ids <id>` |
| **Create Security Group** | `aws ec2 create-security-group --group-name <name> --vpc-id <vpc-id>` |
| **List RDS Databases** | `aws rds describe-db-instances` |
| **Create RDS Database** | `aws rds create-db-instance --db-instance-identifier <id> --engine postgres ...` |
| **Start / Stop RDS** | `aws rds start-db-instance / stop-db-instance --db-instance-identifier <id>` |
| **Create RDS Snapshot** | `aws rds create-db-snapshot --db-instance-identifier <id> --db-snapshot-identifier <name>` |
