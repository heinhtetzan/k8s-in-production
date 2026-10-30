import { Hono } from 'hono'
import { productService } from '../services/product.service'
import { requireAuth, requireShop } from '../middleware/auth.middleware'
import { UserTokenPayload } from '../utils/jwt'

export const productController = new Hono()

// GET /products - List all products with images, brand, category, and stock
productController.get('/', async (c) => {
  try {
    const products = await productService.getAll()
    return c.json({ count: products.length, data: products })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /products/:idOrSlug - Get single product
productController.get('/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const product = await productService.getByIdOrSlug(idOrSlug)
    return c.json({ data: product })
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

// POST /products - Create product (Shop role only)
productController.post('/', requireAuth, requireShop, async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const body = await c.req.json()

    const product = await productService.create({
      ...body,
      createdBy: user.id,
    })

    return c.json({ message: 'Product created successfully', data: product }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// PATCH /products/:id - Update product (Shop role only)
productController.patch('/:id', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const body = await c.req.json()
    const product = await productService.update(id, body)
    return c.json({ message: 'Product updated successfully', data: product })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// DELETE /products/:id - Delete product (Shop role only)
productController.delete('/:id', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const product = await productService.delete(id)
    return c.json({ message: 'Product deleted successfully', data: product })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// POST /products/:id/images - Add an image to a product
productController.post('/:id/images', requireAuth, requireShop, async (c) => {
  try {
    const id = c.req.param('id')!
    const body = await c.req.json()
    const { url, isPrimary } = body

    const image = await productService.addImage(id, url, Boolean(isPrimary))
    return c.json({ message: 'Image added successfully', data: image }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// DELETE /products/images/:imageId - Delete a product image
productController.delete('/images/:imageId', requireAuth, requireShop, async (c) => {
  try {
    const imageId = c.req.param('imageId')!
    const deleted = await productService.deleteImage(imageId)
    return c.json({ message: 'Image deleted successfully', data: deleted })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
