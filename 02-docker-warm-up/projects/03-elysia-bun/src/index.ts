import { Elysia } from 'elysia'

const app = new Elysia()
  // Root welcome
  .get('/', () => ({
    service: 'elysia-sample-api',
    runtime: 'Bun',
    framework: 'ElysiaJS',
    status: 'online',
    timestamp: new Date().toISOString()
  }))

  // Health check endpoint (for K8s liveness/readiness probes)
  .get('/api/health', () => ({
    status: 'healthy',
    uptime_seconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production'
  }))

  // Sample Users REST endpoint
  .get('/api/users', () => [
    { id: 1, name: 'Alice Walker', role: 'DevOps Lead', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', role: 'Frontend Engineer', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Kim', role: 'SRE Specialist', email: 'charlie@example.com' }
  ])

  // Sample Products REST endpoint
  .get('/api/products', () => [
    { id: 'prod-001', name: 'Managed Kubernetes Node', price: 79.99, in_stock: true },
    { id: 'prod-002', name: 'Application Load Balancer', price: 25.00, in_stock: true },
    { id: 'prod-003', name: 'Persistent Block Volume 100GB', price: 10.00, in_stock: false }
  ])

  // Sample Server Metrics endpoint
  .get('/api/metrics', () => ({
    memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    active_connections: 42,
    http_requests_total: 10450
  }))

  .listen(3000)

console.log(`🦊 Elysia API is running at http://${app.server?.hostname}:${app.server?.port}`)
