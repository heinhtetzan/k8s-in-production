import { Hono } from 'hono'
import { brandService } from '../services/brand.service'
import { requireAuth, requireShop } from '../middleware/auth.middleware'

export const brandController = new Hono()

// GET /brands - List all brands
brandController.get('/', async (c) => {
  try {
    const brands = await brandService.getAll()
    return c.json({ count: brands.length, data: brands })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /brands/:idOrSlug - Get single brand by id or slug
brandController.get('/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const brand = await brandService.getByIdOrSlug(idOrSlug)
    return c.json({ data: brand })
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

// POST /brands - Create a brand (Requires 'shop' type user)
brandController.post('/', requireAuth, requireShop, async (c) => {
  try {
    const body = await c.req.json()
    const brand = await brandService.create(body)
    return c.json({ message: 'Brand created successfully', data: brand }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// PATCH /brands/:id - Update brand (Requires 'shop' type user)
brandController.patch('/:id', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const body = await c.req.json()
    const brand = await brandService.update(id, body)
    return c.json({ message: 'Brand updated successfully', data: brand })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// DELETE /brands/:id - Delete brand (Requires 'shop' type user)
brandController.delete('/:id', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const brand = await brandService.delete(id)
    return c.json({ message: 'Brand deleted successfully', data: brand })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
