import { Hono } from 'hono'
import { categoryService } from '../services/category.service'
import { requireAuth, requireShop } from '../middleware/auth.middleware'

export const categoryController = new Hono()

// GET /categories - List all categories
categoryController.get('/', async (c) => {
  try {
    const categories = await categoryService.getAll()
    return c.json({ count: categories.length, data: categories })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /categories/:idOrSlug - Get single category
categoryController.get('/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const category = await categoryService.getByIdOrSlug(idOrSlug)
    return c.json({ data: category })
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

// POST /categories - Create a category (Requires 'shop' type user)
categoryController.post('/', requireAuth, requireShop, async (c) => {
  try {
    const body = await c.req.json()
    const category = await categoryService.create(body)
    return c.json({ message: 'Category created successfully', data: category }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// PATCH /categories/:id - Update category (Requires 'shop' type user)
categoryController.patch('/:id', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const body = await c.req.json()
    const category = await categoryService.update(id, body)
    return c.json({ message: 'Category updated successfully', data: category })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// DELETE /categories/:id - Delete category (Requires 'shop' type user)
categoryController.delete('/:id', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const category = await categoryService.delete(id)
    return c.json({ message: 'Category deleted successfully', data: category })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
