import { Elysia } from 'elysia'
import os from 'node:os'

const startTime = Date.now()

// Pure static mock task (stateless - no database or in-memory state manipulation)
const staticTask = {
  id: 1,
  title: "Learn Kubernetes in Production",
  is_done: false,
  created: "2026-10-26T07:00:00Z"
}

const getSystemUsage = () => {
  const mem = process.memoryUsage()
  return {
    status: "healthy",
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    memory_rss_mb: +(mem.rss / 1024 / 1024).toFixed(2),
    memory_heap_mb: +(mem.heapUsed / 1024 / 1024).toFixed(2),
    cpu_cores: os.cpus().length,
    platform: process.platform
  }
}

const app = new Elysia()
  // 1. GET / for {message, data: {techstack, version}}
  .get('/', () => ({
    message: "Service information",
    data: {
      techstack: "Bun + ElysiaJS",
      version: "1.0.0"
    }
  }))

  // 2. POST /health for {message, data: {system_resource_usage}}
  .post('/health', () => ({
    message: "Service is healthy",
    data: getSystemUsage()
  }))
  .get('/health', () => ({
    message: "Service is healthy",
    data: getSystemUsage()
  }))

  // 3. GET /tasks & /tasts (pure static data)
  .get('/tasks', () => ({
    message: "Tasks retrieved successfully",
    data: [staticTask]
  }))
  .get('/tasts', () => ({
    message: "Tasks retrieved successfully",
    data: [staticTask]
  }))

  // 4. POST /tasks & /tasts (pure static data)
  .post('/tasks', () => ({
    message: "Task created successfully",
    data: staticTask
  }))
  .post('/tasts', () => ({
    message: "Task created successfully",
    data: staticTask
  }))

  // 5. PUT /tasks & /tasts (pure static data)
  .put('/tasks', () => ({
    message: "Task updated successfully",
    data: staticTask
  }))
  .put('/tasts', () => ({
    message: "Task updated successfully",
    data: staticTask
  }))

  // 6. PATCH /tasks & /tasts (pure static data)
  .patch('/tasks', () => ({
    message: "Task patched successfully",
    data: staticTask
  }))
  .patch('/tasts', () => ({
    message: "Task patched successfully",
    data: staticTask
  }))

  // 7. DELETE /tasks & /tasts (pure static data)
  .delete('/tasks', () => ({
    message: "Task deleted successfully",
    data: staticTask
  }))
  .delete('/tasts', () => ({
    message: "Task deleted successfully",
    data: staticTask
  }))

  .listen(3000)

console.log(`🦊 Elysia API is running at http://${app.server?.hostname}:${app.server?.port}`)
