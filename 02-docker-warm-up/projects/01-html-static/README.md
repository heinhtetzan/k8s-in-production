# 01-html-static: Static 5-Page Website (NGINX)

A lightweight, responsive 5-page static website served with an optimized [NGINX Alpine](https://hub.docker.com/_/nginx) container.

---

## 📁 Project Structure

```text
01-html-static/
├── Dockerfile          # Single-stage NGINX Alpine image
├── nginx.conf          # Custom NGINX config (gzip, security headers, caching)
├── index.html          # Home page
├── services.html       # Services catalog
├── pricing.html        # Pricing tiers table
├── about.html          # Company/team bio
├── contact.html        # Contact form
├── style.css           # Modern CSS variables, flex/grid design system
├── .dockerignore       # Files excluded from Docker build context
└── README.md           # This guide
```

---

## 🐳 Dockerfile Explained

```dockerfile
FROM nginx:1.25-alpine

# Replace default NGINX configuration with custom optimized config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets to the default NGINX document root
COPY . /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

* **Base Image**: `nginx:1.25-alpine` gives a lightweight footprint (~93 MB uncompressed).
* **`COPY nginx.conf`**: Configures gzip compression, asset caching headers, and custom 404 page routing.
* **`EXPOSE 80`**: Documents that NGINX listens on container HTTP port 80.

---

## 🛠️ Step 1: Build the Docker Image

From this directory (`02-docker-warm-up/projects/01-html-static`):

```bash
docker build -t my-html-app:1.0 .
```

### Build Flags Explained:
* `-t my-html-app:1.0`: Assigns a name (`my-html-app`) and tag (`1.0`) to the image.
* `.`: Sets the build context to the current working directory.

---

## 🚀 Step 2: Run the Docker Container

```bash
docker run -d -p 8080:80 --name html-app my-html-app:1.0
```

### Run Flags Explained:
* `-d`: Run in detached mode (background).
* `-p 8080:80`: Map host port `8080` to container port `80` (`-p <HOST_PORT>:<CONTAINER_PORT>`).
* `--name html-app`: Assign a readable name instead of a random UUID.
* `my-html-app:1.0`: The image name and tag to run.

---

## 🧪 Step 3: Test and Verify

### 1. Open in Browser
Visit [http://localhost:8080](http://localhost:8080) to browse the website. Navigate through all 5 pages:
* Home: `http://localhost:8080/`
* Services: `http://localhost:8080/services.html`
* Pricing: `http://localhost:8080/pricing.html`
* About: `http://localhost:8080/about.html`
* Contact: `http://localhost:8080/contact.html`

### 2. Verify with `curl`
```bash
# Check HTTP status 200 and NGINX headers
curl -I http://localhost:8080/

# Test gzip compression
curl -I -H "Accept-Encoding: gzip" http://localhost:8080/style.css
```

---

## 💡 Development Workflow: Live Mount (Volume)

To preview HTML/CSS edits in real-time without rebuilding the image:

```bash
docker run -d -p 8080:80 \
  -v "$(pwd)":/usr/share/nginx/html:ro \
  --name html-app-dev \
  my-html-app:1.0
```

* `-v "$(pwd)":/usr/share/nginx/html:ro`: Mounts your local project folder read-only (`:ro`). Any change saved to `index.html` or `style.css` is immediately reflected upon browser refresh.

---

## 🛑 Step 4: Container Management

```bash
# View container status
docker ps --filter "name=html-app"

# View access and error logs
docker logs -f html-app

# Enter the running container's shell
docker exec -it html-app sh

# Stop and remove the container
docker stop html-app
docker rm html-app
```
