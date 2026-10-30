import { Hono } from 'hono'
import { stockService } from '../services/stock.service'
import { requireAuth, requireShop } from '../middleware/auth.middleware'

export const stockController = new Hono()

// GET /stocks - List all stock entries with product details
stockController.get('/', async (c) => {
  try {
    const stocks = await stockService.getAll()
    return c.json({ count: stocks.length, data: stocks })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /stocks/:productId - Get stock for specific product
stockController.get('/:productId', async (c) => {
  try {
    const productId = c.req.param('productId')
    const stock = await stockService.getByProductId(productId)
    return c.json({ data: stock })
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

// PUT /stocks/:productId - Update or set inventory level (Shop role only)
stockController.put('/:productId', requireAuth, requireShop, async (c) => {
  try {
    const productId = c.req.param('productId')!
    const body = await c.req.json()
    const { quantity, sku } = body

    if (quantity === undefined || typeof quantity !== 'number') {
      return c.json({ error: 'Quantity must be a valid number' }, 400)
    }

    const stock = await stockService.updateStock(productId, quantity, sku)
    return c.json({ message: 'Stock updated successfully', data: stock })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
