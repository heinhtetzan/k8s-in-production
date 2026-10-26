# Docker Warmup: Essential Commands & an Elysia Dockerfile

A practical, hands-on guide covering the container lifecycle, building and publishing images, and a Dockerfile that runs an Elysia app with Bun.

---

## 🗺️ The Complete Docker Lifecycle

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
  'themeCSS': '* { filter: none !important; box-shadow: none !important; } .node * { filter: none !important; }'
}}%%
graph LR
    subgraph Dev["1. Development"]
        Code["Source Code + Dockerfile"]
    end

    subgraph Build["2. Build & Package"]
        B1["docker build / buildx"]
        Tag["docker tag"]
    end

    subgraph Registry["3. Remote Registry"]
        Hub["Docker Hub / GHCR / ECR"]
    end

    subgraph Run["4. Execution"]
        Pull["docker pull"]
        Container["docker run<br/>(-p, -v, -e, --name)"]
    end

    Code --> B1 --> Tag
    Tag -->|"docker push"| Hub
    Hub -->|"docker pull"| Pull
    Pull --> Container

    classDef cDev fill:#1f1929,stroke:#7c5295,stroke-width:1.5px,color:#e2e8f0;
    classDef cBuild fill:#17212b,stroke:#38668c,stroke-width:1.5px,color:#e2e8f0;
    classDef cReg fill:#241b16,stroke:#8a5832,stroke-width:1.5px,color:#e2e8f0;
    classDef cRun fill:#15241d,stroke:#2b6d51,stroke-width:1.5px,color:#e2e8f0;

    class Code cDev;
    class B1,Tag cBuild;
    class Hub cReg;
    class Pull,Container cRun;
```

---

## 1. `docker pull`: Downloading Pre-built Images

Before building custom images, you often pull pre-existing base images (like databases, web servers, or operating system runtimes) from a container registry.

### Syntax
```bash
docker pull <image-name>:<tag>
```

### Examples
```bash
# Pull the latest Alpine Linux (ultra-lightweight ~5MB)
docker pull alpine:latest

# Pull NGINX with Alpine base
docker pull nginx:alpine

# Pull a specific version of PostgreSQL database
docker pull postgres:16-alpine

# Pull an image from GitHub Container Registry (GHCR)
docker pull ghcr.io/username/my-service:1.0.0
```

> [!TIP]
> **Always specify a tag!** Avoid using `:latest` in production because it can change without notice and break your deployment. Prefer explicit versions like `node:20-alpine` or `postgres:16.2-alpine`.

---

## 2. `docker run`: Creating & Running Containers

`docker run` is the most powerful and frequently used Docker command. It downloads the image (if not already local), creates an isolated container, and starts it.

### Essential Flags Breakdown

| Flag | Meaning | What It Does |
| :--- | :--- | :--- |
| `-d` | **Detached** | Runs the container in the background (keeps your terminal free). |
| `-p <host>:<container>` | **Port Mapping** | Forwards traffic from your laptop/host port into the container port. |
| `-v <host>:<container>` | **Volume / Mount** | Mounts a local folder or named volume into the container for data persistence. |
| `--name <name>` | **Container Name** | Gives the container a human-readable name instead of a random string. |
| `--rm` | **Auto-Remove** | Automatically deletes the container when it stops (avoids leftover clutter). |
| `-e KEY=VALUE` | **Environment Var** | Passes environment variables (database credentials, API keys) into the app. |
| `--restart unless-stopped` | **Restart Policy** | Automatically restarts the container if it crashes or after system reboot. |

---

### Real-World `docker run` Examples

#### Example 1: Run NGINX Web Server with Port Mapping
```bash
docker run -d \
  --name my-web \
  -p 8080:80 \
  nginx:alpine
```
* **Result**: Visit `http://localhost:8080` in your browser to see the default NGINX welcome page.

#### Example 2: Run Postgres DB with Port, Volume, and Env Variables
```bash
docker run -d \
  --name my-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_DB=mydb \
  -v pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16-alpine
```
* **`-v pgdata:/var/lib/postgresql/data`**: Ensures database data is saved inside the `pgdata` volume even if you destroy the container!

#### Example 3: Quick One-Off Test (with `--rm`)
```bash
# Run a temporary Python interactive shell and auto-delete when done
docker run --rm -it python:3.12-alpine python
```

---

## 3. Entering a Running Container (`docker exec`)

Once a container is running in the background (detached with `-d`), you can jump inside it to explore files, inspect environment variables, or debug problems in real time.

### Syntax
```bash
docker exec -it <container-name-or-id> <shell>
```

* `-i` (**Interactive**): Keeps `STDIN` open so you can enter commands.
* `-t` (**TTY**): Allocates a terminal prompt for you.

### Common Examples

```bash
# 1. Enter an Alpine-based container using 'sh'
docker exec -it my-web sh

# 2. Enter an Ubuntu/Debian container using 'bash'
docker exec -it my-web bash

# 3. Run a single command directly without opening a shell session
docker exec my-web env
docker exec my-web ls -la /app
```

> [!TIP]
> **Which shell should you use (`sh` vs `bash`)?**
> Minimal container images like Alpine Linux do not include `bash` by default. If you see:
> `OCI runtime exec failed: exec: "bash": executable file not found in $PATH`
> simply use **`sh`** instead of `bash`.

To exit the container and return to your laptop's terminal, type **`exit`** or press **`Ctrl + D`**.

---

## 4. Managing Containers

List running containers with `docker ps`. Add `-a` to include stopped containers:

```bash
docker ps
docker ps -a
```

Start or stop a container by its name or ID. Remove a stopped container with `docker rm`; use `-f` only when you intend to stop and remove a running container:

```bash
docker start my-web
docker stop my-web
docker rm my-web

# Force-stop and remove a running container
docker rm -f my-web
```

---

## 5. Elysia Project (Bun Runtime)

Elysia runs on Bun. Save this as `Dockerfile` in the Elysia app directory:

```dockerfile
# File: Dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN bun install --production

# Copy source code
COPY . .

# Run as non-root user for security
USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

---

## 6. `docker build` & `docker buildx`: Building Images

### Standard Build (`docker build`)
Builds a local image using the `Dockerfile` in the current folder:

```bash
docker build -t myapp:1.0.0 .
```

* **`-t myapp:1.0.0`**: Names the image `myapp` with version tag `1.0.0`.
* **`.` (Period)**: Specifies the **Build Context** (the folder sent to the Docker daemon).

---

### Multi-Architecture Builds (`docker buildx`)

> [!IMPORTANT]
> **The Apple Silicon (M1/M2/M3) vs Cloud Server Problem**:
> If you build an image on an Apple Silicon Mac, it builds for `linux/arm64` by default. When you deploy it to an AWS EC2 or Kubernetes node running on standard Intel/AMD (`linux/amd64`), it will crash with:
> `exec /server: exec format error`!

To build images that run anywhere, use **`docker buildx`**:

```bash
# 1. Create and switch to a multi-platform builder
docker buildx create --name mybuilder --use

# 2. Log in to the target registry before pushing
docker login

# 3. Build for BOTH Intel (amd64) and Apple/ARM (arm64) and push directly
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myusername/myapp:1.0.0 \
  --push .
```

---

## 7. `docker tag`: Versioning & Naming for Registries

Before pushing an image to Docker Hub, GitHub, or AWS, you must tag it with the target registry repository name:

### Syntax
```bash
docker tag <local-image>:<local-tag> <registry-username>/<repo-name>:<version>
```

### Examples
```bash
# Tag for Docker Hub
docker tag myapp:1.0.0 kendirck/myapp:1.0.0

# Also tag as latest
docker tag myapp:1.0.0 kendirck/myapp:latest

# Tag for GitHub Container Registry (GHCR)
docker tag myapp:1.0.0 ghcr.io/kendirck/myapp:1.0.0

# Tag for AWS Elastic Container Registry (ECR)
docker tag myapp:1.0.0 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0.0
```

---

## 8. `docker login` & `docker push`: Publishing to Registries

Once your image is built and tagged, upload it so Kubernetes clusters or cloud VMs can pull and run it.

### Step 1: Login to Container Registry

```bash
# Login to Docker Hub (prompts for username & personal access token)
docker login

# Login to GitHub Container Registry
docker login ghcr.io -u YOUR_GITHUB_USERNAME

# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Push the Image

```bash
# Push specific version
docker push kendirck/myapp:1.0.0

# Push latest tag
docker push kendirck/myapp:latest
```

---

## 9. Master Cheat Sheet

| Step | Command | Description |
| :--- | :--- | :--- |
| **Pull** | `docker pull nginx:alpine` | Download image from registry |
| **Run** | `docker run -d -p 8080:80 -v data:/data --name web nginx:alpine` | Run with ports, volumes, name |
| **Enter** | `docker exec -it web sh` | Open interactive shell inside running container |
| **List** | `docker ps` / `docker ps -a` | List running / all containers |
| **Start / Stop** | `docker start web` / `docker stop web` | Start or stop a container |
| **Remove** | `docker rm web` | Remove a stopped container |
| **Build** | `docker build -t myapp:1.0.0 .` | Build local image |
| **Buildx** | `docker buildx build --platform linux/amd64,linux/arm64 -t user/app:1.0 --push .` | Multi-arch cross-compile |
| **Tag** | `docker tag myapp:1.0.0 user/myapp:1.0.0` | Alias image with registry name |
| **Login** | `docker login` / `docker login ghcr.io` | Authenticate before pushing to a registry |
| **Push** | `docker push user/myapp:1.0.0` | Upload image to registry |
