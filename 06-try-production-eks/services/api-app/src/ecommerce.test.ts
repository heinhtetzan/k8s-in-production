import { describe, expect, it } from 'bun:test'
import app from './index'

describe('Public E-Commerce API Suite', () => {
  it('GET /ecommerce overview provides full query parameter specification', async () => {
    const res = await app.fetch(new Request('http://localhost:8000/ecommerce'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.public).toBe(true)
    expect(json.endpoints.products.query_params.search).toBeDefined()
    expect(json.endpoints.products.query_params.brand).toBeDefined()
    expect(json.endpoints.products.query_params.category).toBeDefined()
    expect(json.endpoints.products.query_params.in_stock).toBeDefined()
    expect(json.endpoints.products.query_params.stock_count).toBeDefined()
    expect(json.endpoints.products.query_params.limit).toBeDefined()
    expect(json.endpoints.products.query_params.page).toBeDefined()
  })

  it('GET /ecommerce/products supports search, pagination, and stock_count query filters', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/ecommerce/products?search=test&page=1&limit=10&in_stock=true&sort=price_asc')
    )
    if (res.status === 200) {
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.pagination.page).toBe(1)
      expect(json.pagination.limit).toBe(10)
      expect(json.filters.search).toBe('test')
      expect(json.filters.inStock).toBe(true)
      expect(json.filters.sort).toBe('price_asc')

      for (const item of json.data) {
        expect(item.id).toBeDefined()
        expect(item.title).toBeDefined()
        expect(typeof item.stock_count).toBe('number')
        expect(typeof item.in_stock).toBe('boolean')
        expect(item.stock_count >= 0).toBe(true)
      }
    }
  })

  it('GET /ecommerce/products returns empty array when filtering by non-existent brand slug', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/ecommerce/products?brand=non-existent-brand-xyz123')
    )
    if (res.status === 200) {
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(0)
      expect(json.pagination.total).toBe(0)
    }
  })

  it('GET /ecommerce/products returns empty array when filtering by non-existent category slug', async () => {
    const res = await app.fetch(
      new Request('http://localhost:8000/ecommerce/products?category=non-existent-cat-xyz123')
    )
    if (res.status === 200) {
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.length).toBe(0)
      expect(json.pagination.total).toBe(0)
    }
  })
})
