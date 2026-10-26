# 02-tanstack-react: React SPA (Multi-Stage Vite + NGINX)

A modern 5-page Single Page Application (SPA) built with React 18, Vite, TypeScript, and served with a production-tuned [NGINX Alpine](https://hub.docker.com/_/nginx) container.

---

## 📁 Project Structure

```text
02-tanstack-react/
├── Dockerfile          # Multi-stage: Node 20 builder -> NGINX Alpine runtime
├── nginx.conf          # NGINX config with SPA client-side fallback (try_files)
├── package.json        # Dependencies (React, Vite, TypeScript)
├── vite.config.ts      # Vite bundler configuration
├── tsconfig.json       # TypeScript compiler settings
├── index.html          # SPA HTML entry point
├── src/                # React components and 5 SPA pages
│   ├── App.tsx         # Router and page switcher
│   ├── main.tsx        # React DOM bootstrap
│   └── index.css       # Design system and layout styling
├── .dockerignore       # Excludes node_modules, dist, etc.
└── README.md           # This guide
```

---

## 🐳 Dockerfile Explained (Multi-Stage Build)

```dockerfile
# Stage 1: Build the production static bundle
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve static bundle via NGINX
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Why Multi-Stage?
1. **Zero Node.js Runtime in Production**: Heavy Node.js tools (~450 MB) stay in `builder`. Only pure static HTML/JS/CSS assets are transferred to the final NGINX image (~93 MB total).
2. **SPA Routing**: The custom `nginx.conf` includes `try_files $uri $uri/ /index.html;`, ensuring client-side navigation (e.g. `/analytics`, `/settings`) does not return 404 on page reload.

---

## 🛠️ Step 1: Build the Docker Image

From this directory (`02-docker-warm-up/projects/02-tanstack-react`):

```bash
docker build -t my-react-app:1.0 .
```

### Build Flags Explained:
* `-t my-react-app:1.0`: Names the image `my-react-app` and tags it as version `1.0`.
* `.`: Targets the current directory containing `Dockerfile` and source code.

---

## 🚀 Step 2: Run the Docker Container

```bash
docker run -d -p 3000:80 --name react-app my-react-app:1.0
```

### Run Flags Explained:
* `-d`: Runs in the background (detached).
* `-p 3000:80`: Forwards port `3000` on your host to port `80` inside the container.
* `--name react-app`: Sets the container container name to `react-app`.
* `my-react-app:1.0`: The image name.

---

## 🧪 Step 3: Test and Verify

### 1. Open in Browser
Visit [http://localhost:3000](http://localhost:3000). You can interactively switch between all 5 SPA pages:
* Dashboard (`/dashboard`)
* Analytics (`/analytics`)
* Workflows (`/workflows`)
* Settings (`/settings`)
* Documentation (`/docs`)

### 2. Verify SPA Fallback Routing
```bash
# Direct hit to root
curl -I http://localhost:3000/

# Direct hit to deep client-side route (must return 200 with index.html)
curl -I http://localhost:3000/analytics
```

---

## 🛑 Step 4: Container Management

```bash
# Check container status
docker ps --filter "name=react-app"

# View access logs
docker logs -f react-app

# Enter running container shell
docker exec -it react-app sh

# Stop and remove container
docker stop react-app
docker rm react-app
```
