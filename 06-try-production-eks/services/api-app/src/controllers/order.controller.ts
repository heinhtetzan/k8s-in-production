import { Hono } from 'hono'
import { orderService } from '../services/order.service'

export const orderController = new Hono()

// GET /dashboard/orders - List all orders across system
orderController.get('/', async (c) => {
  try {
    const status = c.req.query('status')
    const search = c.req.query('search')
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 50)

    const result = await orderService.getAllOrders({ status, search, page, limit })
    return c.json({ success: true, ...result })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// GET /dashboard/orders/metrics - Summary statistics
orderController.get('/metrics', async (c) => {
  try {
    const metrics = await orderService.getMetrics()
    return c.json({ success: true, metrics })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// GET /dashboard/orders/:id - Single order details
orderController.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const order = await orderService.getOrderById(id)
    return c.json({ success: true, order })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 404)
  }
})

// PATCH /dashboard/orders/:id/status - Update order status
orderController.patch('/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    if (!body.status) {
      return c.json({ error: 'Status is required' }, 400)
    }
    const updated = await orderService.updateOrderStatus(id, body.status)
    return c.json({ success: true, order: updated })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// DELETE /dashboard/orders/:id - Delete order
orderController.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const deleted = await orderService.deleteOrder(id)
    return c.json({ success: true, message: 'Order deleted successfully', order: deleted })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})
