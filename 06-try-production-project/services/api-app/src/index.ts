import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { client, syncDatabaseSchema } from './db'
import { authController } from './controllers/auth.controller'
import { dashboardController } from './controllers/dashboard.controller'
import { ecommerceController } from './controllers/ecommerce.controller'
import { openApiSpec } from './openapi'
import { seedDatabase } from './db/seed'

const app = new Hono()

// Global CORS Middleware
app.use('*', cors())


// Initialize Drizzle ORM Schema on Startup
syncDatabaseSchema().catch((err) => {
  console.warn('⚠️ Initial database schema sync pending or failed:', err.message)
})

// ============================================================================
// API Documentation / Discovery Root
// ============================================================================
app.get('/', (c) => {
  return c.json({ message: 'hono is running' })
})


// ============================================================================
// OpenAPI 3.0 & Swagger UI Documentation
// ============================================================================
app.get('/api.json', (c) => c.json(openApiSpec))
app.get('/openapi.json', (c) => c.json(openApiSpec))

app.get('/docs', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>E-Commerce Platform API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout'
      });
    };
  </script>
</body>
</html>`)
})

// ============================================================================
// Health Check Endpoint
// ============================================================================
app.get('/health', async (c) => {
  try {
    const [result] = await client`SELECT 1 as healthy, NOW() as time, current_database() as database`
    await syncDatabaseSchema()
    return c.json({
      status: 'ok',
      database: 'connected',
      orm: 'drizzle',
      db_info: result,
    })
  } catch (error: any) {
    return c.json({
      status: 'degraded',
      database: 'disconnected',
      error: error.message,
    }, 500)
  }
})

// ============================================================================
// Mount Resource Controllers (Layered Architecture)
// ============================================================================
app.route('/auth', authController)
app.route('/dashboard', dashboardController)
app.route('/ecommerce', ecommerceController)

// ============================================================================
// Database Seed Endpoint (Populates Brands, Categories, Products, Stocks & S3 Images)
// ============================================================================
app.post('/seed', async (c) => {
  try {
    const stats = await seedDatabase()
    return c.json({
      success: true,
      message: 'Database seeded successfully with brands, categories, products, stocks, and S3 images',
      stats,
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

const port = Number(process.env.PORT) || 9000

export default {
  port,
  fetch: app.fetch,
}
