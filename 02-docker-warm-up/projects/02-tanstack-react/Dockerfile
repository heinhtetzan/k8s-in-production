# ==========================================
# Stage 1: Build the Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions first for layer caching
COPY package.json ./
# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# ==========================================
# Stage 2: Serve with NGINX
# ==========================================
FROM nginx:alpine

# Remove default Nginx HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
