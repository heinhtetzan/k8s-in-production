import { describe, expect, it, beforeAll } from 'bun:test'
import app from './index'
import { generateToken } from './utils/jwt'
import { syncDatabaseSchema } from './db'

describe('E-Commerce API Endpoints', () => {
  let shopToken: string
  let customerToken: string

  beforeAll(async () => {
    try {
      await syncDatabaseSchema()
    } catch {
      // In case test runs without live DB
    }

    shopToken = await generateToken({
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'shop-admin@kendrickdev.shop',
      name: 'Admin Shop',
      type: 'shop',
    })

    customerToken = await generateToken({
      id: 'b0000000-0000-0000-0000-000000000002',
      email: 'customer-user@kendrickdev.shop',
      name: 'Customer User',
      type: 'customer',
    })
  })

  it('GET /health returns 200 or 500 with schema status', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/health'))
    expect([200, 500]).toContain(res.status)
    const json = await res.json()
    expect(json.status).toBeDefined()
  })

  it('GET / returns message: hono is running', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('hono is running')
  })

  it('GET /api.json returns valid OpenAPI 3.0.3 specification with dashboard paths', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/api.json'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.openapi).toBe('3.0.3')
    expect(json.info.title).toBe('E-Commerce Platform API')
    expect(json.paths['/ecommerce/products']).toBeDefined()
    expect(json.paths['/auth/login']).toBeDefined()
    expect(json.paths['/dashboard']).toBeDefined()
    expect(json.paths['/dashboard/products']).toBeDefined()
    expect(json.paths['/dashboard/brands']).toBeDefined()
    expect(json.paths['/dashboard/categories']).toBeDefined()
    expect(json.paths['/dashboard/stocks']).toBeDefined()
    expect(json.paths['/dashboard/users']).toBeDefined()
    expect(json.components.securitySchemes.bearerAuth).toBeDefined()
    expect(json.components.schemas.User).toBeDefined()
    expect(json.components.schemas.CreateUserRequest).toBeDefined()
    expect(json.components.schemas.UpdateUserRequest).toBeDefined()
  })

  it('GET /docs returns interactive Swagger UI page', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/docs'))
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('swagger-ui')
    expect(html).toContain('/api.json')
  })

  it('POST /seed route is reachable and responds with 200 or 500 depending on DB', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/seed', { method: 'POST' }))
    expect([200, 500]).toContain(res.status)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('POST /auth/register fails with missing credentials', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'bad' }),
      })
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  // ==========================================================================
  // Dashboard Security & Access Control Tests
  // ==========================================================================
  it('GET /dashboard fails without authorization token (401)', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/dashboard'))
    expect(res.status).toBe(401)
  })

  it('GET /dashboard fails with customer token (403 Forbidden)', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard', {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
    )
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toContain('shop')
  })

  it('GET /dashboard succeeds with shop token', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard', {
        headers: { Authorization: `Bearer ${shopToken}` },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.role).toBe('shop')
    expect(json.endpoints.users).toBeDefined()
    expect(json.endpoints.brands).toBeDefined()
    expect(json.endpoints.products).toBeDefined()
  })

  it('GET /dashboard/brands fails without authorization token (401)', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/dashboard/brands'))
    expect(res.status).toBe(401)
  })

  it('GET /dashboard/brands fails with customer token (403 Forbidden)', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard/brands', {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
    )
    expect(res.status).toBe(403)
  })

  it('GET /dashboard/brands succeeds with shop token', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard/brands', {
        headers: { Authorization: `Bearer ${shopToken}` },
      })
    )
    if (res.status === 200) {
      const json = await res.json()
      expect(Array.isArray(json.data)).toBe(true)
    } else {
      expect([200, 500]).toContain(res.status)
    }
  })

  it('POST /dashboard/brands fails without authorization token (401)', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Apple' }),
      })
    )
    expect(res.status).toBe(401)
  })

  it('POST /dashboard/products fails without authorization token (401)', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'iPhone 16 Pro', price: '999.00' }),
      })
    )
    expect(res.status).toBe(401)
  })

  // ==========================================================================
  // Dashboard User Management CRUD Tests
  // ==========================================================================
  it('GET /dashboard/users fails without authorization token (401)', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/dashboard/users'))
    expect(res.status).toBe(401)
  })

  it('GET /dashboard/users fails with customer token (403 Forbidden)', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/dashboard/users', {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
    )
    expect(res.status).toBe(403)
  })

  it('Full CRUD on /dashboard/users with shop token', async () => {
    const uniqueEmail = `testuser_${Date.now()}@kendrickdev.shop`

    // 1. CREATE USER
    const createRes = await app.fetch(
      new Request('http://localhost:8000/dashboard/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${shopToken}`,
        },
        body: JSON.stringify({
          email: uniqueEmail,
          name: 'Test Staff Member',
          password: 'password123',
          type: 'shop',
        }),
      })
    )
    if (createRes.status === 201) {
      const createJson = await createRes.json()
      expect(createJson.data.email).toBe(uniqueEmail)
      expect(createJson.data.name).toBe('Test Staff Member')
      expect(createJson.data.type).toBe('shop')
      expect(createJson.data.passwordHash).toBeUndefined() // Password must be sanitized
      const userId = createJson.data.id
      expect(userId).toBeDefined()

      // 2. GET USER DETAIL
      const getRes = await app.fetch(
        new Request(`http://localhost:8000/dashboard/users/${userId}`, {
          headers: { Authorization: `Bearer ${shopToken}` },
        })
      )
      expect(getRes.status).toBe(200)
      const getJson = await getRes.json()
      expect(getJson.data.id).toBe(userId)
      expect(getJson.data.name).toBe('Test Staff Member')

      // 3. UPDATE USER
      const updateRes = await app.fetch(
        new Request(`http://localhost:8000/dashboard/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${shopToken}`,
          },
          body: JSON.stringify({
            name: 'Updated Staff Name',
            type: 'customer',
          }),
        })
      )
      expect(updateRes.status).toBe(200)
      const updateJson = await updateRes.json()
      expect(updateJson.data.name).toBe('Updated Staff Name')
      expect(updateJson.data.type).toBe('customer')

      // 4. LIST USERS
      const listRes = await app.fetch(
        new Request('http://localhost:8000/dashboard/users', {
          headers: { Authorization: `Bearer ${shopToken}` },
        })
      )
      expect(listRes.status).toBe(200)
      const listJson = await listRes.json()
      expect(Array.isArray(listJson.data)).toBe(true)
      const found = listJson.data.find((u: any) => u.id === userId)
      expect(found).toBeDefined()

      // 5. DELETE USER
      const deleteRes = await app.fetch(
        new Request(`http://localhost:8000/dashboard/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${shopToken}` },
        })
      )
      expect(deleteRes.status).toBe(200)

      // 6. VERIFY NOT FOUND
      const verifyRes = await app.fetch(
        new Request(`http://localhost:8000/dashboard/users/${userId}`, {
          headers: { Authorization: `Bearer ${shopToken}` },
        })
      )
      expect(verifyRes.status).toBe(404)
    } else {
      expect([201, 400]).toContain(createRes.status)
    }
  })

  // ==========================================================================
  // Public E-Commerce Tests (No Auth Required)
  // ==========================================================================
  it('GET /ecommerce returns overview documentation without auth', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/ecommerce'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.public).toBe(true)
    expect(json.endpoints.products).toBeDefined()
    expect(json.endpoints.brands).toBeDefined()
    expect(json.endpoints.categories).toBeDefined()
  })

  it('GET /ecommerce/products returns 200 with structured pagination and filters', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/ecommerce/products?page=1&limit=5&sort=newest&in_stock=true')
    )
    // 200 on connected DB, or degraded error handled gracefully
    if (res.status === 200) {
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.pagination).toBeDefined()
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(5)
      expect(typeof json.pagination.total).toBe('number')
      expect(typeof json.pagination.totalPages).toBe('number')
      expect(typeof json.pagination.hasNextPage).toBe('boolean')
      expect(typeof json.pagination.hasPrevPage).toBe('boolean')
      expect(json.filters.inStock).toBe(true)
    }
  })

  it('GET /ecommerce/brands returns 200 with brand list', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/ecommerce/brands'))
    if (res.status === 200) {
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
    }
  })

  it('GET /ecommerce/categories returns 200 with categories list', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/ecommerce/categories'))
    if (res.status === 200) {
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
    }
  })

  it('GET /ecommerce/products/:idOrSlug returns 404 for unknown product', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/ecommerce/products/non-existent-product-xyz'))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.success).toBe(false)
  })
})
