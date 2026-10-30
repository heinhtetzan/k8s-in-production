import { Hono } from 'hono'
import { requireAuth, requireShop } from '../middleware/auth.middleware'
import { brandController } from './brand.controller'
import { categoryController } from './category.controller'
import { productController } from './product.controller'
import { stockController } from './stock.controller'
import { userController } from './user.controller'
import { orderController } from './order.controller'
import { authService } from '../services/auth.service'
import { UserTokenPayload } from '../utils/jwt'

export const dashboardController = new Hono()

// ============================================================================
// Public Dashboard Login (Enforces 'shop' User Type)
// ============================================================================
dashboardController.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const result = await authService.login(body)
    if (result.user.type !== 'shop') {
      return c.json(
        { error: 'Access denied: Only shop accounts are permitted to access the dashboard' },
        403
      )
    }
    return c.json({ message: 'Dashboard login successful', ...result })
  } catch (error: any) {
    return c.json({ error: error.message || 'Login failed' }, 401)
  }
})

// ============================================================================
// Guard All Dashboard Routes (Strictly Requires Authenticated 'shop' User)
// ============================================================================
dashboardController.use('*', requireAuth, requireShop)

// GET /dashboard/me - Get current logged-in shop administrator profile
dashboardController.get('/me', async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const profile = await authService.getProfile(user.id)
    return c.json({ user: profile })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch shop profile' }, 404)
  }
})

// GET /dashboard - Dashboard Root Overview
dashboardController.get('/', (c) => {
  return c.json({
    message: 'Shop Management Dashboard API',
    role: 'shop',
    endpoints: {
      me: 'GET /dashboard/me',
      orders: {
        list: 'GET /dashboard/orders',
        metrics: 'GET /dashboard/orders/metrics',
        detail: 'GET /dashboard/orders/:id',
        updateStatus: 'PATCH /dashboard/orders/:id/status',
        delete: 'DELETE /dashboard/orders/:id',
      },
      brands: {
        list: 'GET /dashboard/brands',
        detail: 'GET /dashboard/brands/:idOrSlug',
        create: 'POST /dashboard/brands',
        update: 'PATCH /dashboard/brands/:id',
        delete: 'DELETE /dashboard/brands/:id',
      },
      categories: {
        list: 'GET /dashboard/categories',
        detail: 'GET /dashboard/categories/:idOrSlug',
        create: 'POST /dashboard/categories',
        update: 'PATCH /dashboard/categories/:id',
        delete: 'DELETE /dashboard/categories/:id',
      },
      products: {
        list: 'GET /dashboard/products',
        detail: 'GET /dashboard/products/:idOrSlug',
        create: 'POST /dashboard/products',
        update: 'PATCH /dashboard/products/:id',
        delete: 'DELETE /dashboard/products/:id',
        addImage: 'POST /dashboard/products/:id/images',
        deleteImage: 'DELETE /dashboard/products/images/:imageId',
      },
      stocks: {
        list: 'GET /dashboard/stocks',
        detail: 'GET /dashboard/stocks/:productId',
        update: 'PUT /dashboard/stocks/:productId',
      },
      users: {
        list: 'GET /dashboard/users',
        detail: 'GET /dashboard/users/:id',
        create: 'POST /dashboard/users',
        update: 'PATCH /dashboard/users/:id',
        delete: 'DELETE /dashboard/users/:id',
      },
    },
  })
})

// ============================================================================
// Mount Dashboard Resource Sub-Controllers
// ============================================================================
dashboardController.route('/orders', orderController)
dashboardController.route('/brands', brandController)
dashboardController.route('/categories', categoryController)
dashboardController.route('/products', productController)
dashboardController.route('/stocks', stockController)
dashboardController.route('/users', userController)
