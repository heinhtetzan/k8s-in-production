import { Hono } from 'hono'
import { ecommerceService } from '../services/ecommerce.service'
import { authService } from '../services/auth.service'
import { orderService } from '../services/order.service'
import { requireAuth } from '../middleware/auth.middleware'
import { UserTokenPayload } from '../utils/jwt'

export const ecommerceController = new Hono()

// ============================================================================
// Public E-Commerce Overview / Docs
// ============================================================================
ecommerceController.get('/', (c) => {
  return c.json({
    public: true,
    description: 'Public E-Commerce Storefront API',
    endpoints: {
      auth: {
        register: 'POST /ecommerce/auth/register (Registers as customer)',
        login: 'POST /ecommerce/auth/login',
        google: 'POST /ecommerce/auth/google',
        me: 'GET /ecommerce/auth/me (Protected)',
      },
      orders: {
        create: 'POST /ecommerce/orders (Create order, protected)',
        list: 'GET /ecommerce/orders (Only returns user-related orders, protected)',
        detail: 'GET /ecommerce/orders/:id (Only returns user-related order, protected)',
        cancel: 'PATCH /ecommerce/orders/:id/cancel (Protected)',
      },
      products: {
        list: 'GET /ecommerce/products',
        detail: 'GET /ecommerce/products/:idOrSlug',
        query_params: {
          search: 'Search term for name/description',
          brand: 'Filter by brand slug or id',
          category: 'Filter by category slug or id',
          in_stock: 'Filter only in stock (boolean)',
          stock_count: 'Filter by minimum stock count',
          limit: 'Items per page',
          page: 'Page number',
        },
      },
      brands: {
        list: 'GET /ecommerce/brands',
        detail: 'GET /ecommerce/brands/:idOrSlug',
      },
      categories: {
        list: 'GET /ecommerce/categories',
        detail: 'GET /ecommerce/categories/:idOrSlug',
      },
    },
  })
})

// ============================================================================
// 1. Customer Authentication Routes
// ============================================================================

// Register customer account (enforces type='customer')
const handleCustomerRegister = async (c: any) => {
  try {
    const body = await c.req.json()
    // Explicitly enforce 'customer' user type for ecommerce registration
    const result = await authService.register({
      ...body,
      type: 'customer',
    })
    return c.json({ message: 'Customer registration successful', ...result }, 201)
  } catch (error: any) {
    return c.json({ error: error.message || 'Registration failed' }, 400)
  }
}
ecommerceController.post('/auth/register', handleCustomerRegister)
ecommerceController.post('/register', handleCustomerRegister)

// Customer login
const handleCustomerLogin = async (c: any) => {
  try {
    const body = await c.req.json()
    const result = await authService.login(body)
    return c.json({ message: 'Login successful', ...result })
  } catch (error: any) {
    return c.json({ error: error.message || 'Login failed' }, 401)
  }
}
ecommerceController.post('/auth/login', handleCustomerLogin)
ecommerceController.post('/login', handleCustomerLogin)

// Customer Google OAuth login
const handleCustomerGoogle = async (c: any) => {
  try {
    const body = await c.req.json()
    const result = await authService.loginWithGoogle({
      ...body,
      type: 'customer',
    })
    return c.json({ message: 'Google authentication successful', ...result })
  } catch (error: any) {
    return c.json({ error: error.message || 'Google authentication failed' }, 400)
  }
}
ecommerceController.post('/auth/google', handleCustomerGoogle)
ecommerceController.post('/google', handleCustomerGoogle)

// Current customer profile
const handleCustomerMe = async (c: any) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const profile = await authService.getProfile(user.id)
    return c.json({ user: profile })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch customer profile' }, 404)
  }
}
ecommerceController.get('/auth/me', requireAuth, handleCustomerMe)
ecommerceController.get('/me', requireAuth, handleCustomerMe)

// ============================================================================
// 2. Customer Orders Management (Only show user-related orders)
// ============================================================================

// POST /ecommerce/orders - Place a new order
ecommerceController.post('/orders', requireAuth, async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const body = await c.req.json()
    const order = await orderService.createCustomerOrder(user.id, body)
    return c.json({ success: true, message: 'Order placed successfully', order }, 201)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// GET /ecommerce/orders - List orders (STRICTLY user-related orders only)
ecommerceController.get('/orders', requireAuth, async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const userOrders = await orderService.getCustomerOrders(user.id)
    return c.json({ success: true, count: userOrders.length, orders: userOrders })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

// GET /ecommerce/orders/:id - Get order details (STRICTLY user-related order only)
ecommerceController.get('/orders/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const orderId = c.req.param('id')!
    const order = await orderService.getCustomerOrderById(user.id, orderId)
    return c.json({ success: true, order })
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 404
    return c.json({ success: false, error: error.message }, status)
  }
})

// PATCH /ecommerce/orders/:id/cancel - Cancel pending order
ecommerceController.patch('/orders/:id/cancel', requireAuth, async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const orderId = c.req.param('id')!
    const order = await orderService.cancelCustomerOrder(user.id, orderId)
    return c.json({ success: true, message: 'Order cancelled successfully', order })
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 400
    return c.json({ success: false, error: error.message }, status)
  }
})

// ============================================================================
// 3. Products (Public)
// ============================================================================
ecommerceController.get('/products', async (c) => {
  try {
    const query = c.req.query()
    const result = await ecommerceService.getProducts(query)
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400)
  }
})

ecommerceController.get('/products/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const product = await ecommerceService.getProductByIdOrSlug(idOrSlug)
    return c.json({ success: true, data: product })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 404)
  }
})

// ============================================================================
// 4. Brands (Public)
// ============================================================================
ecommerceController.get('/brands', async (c) => {
  try {
    const brands = await ecommerceService.getBrands()
    return c.json({ success: true, count: brands.length, data: brands })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

ecommerceController.get('/brands/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const brand = await ecommerceService.getBrandByIdOrSlug(idOrSlug)
    return c.json({ success: true, data: brand })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 404)
  }
})

// ============================================================================
// 5. Categories (Public)
// ============================================================================
ecommerceController.get('/categories', async (c) => {
  try {
    const categories = await ecommerceService.getCategories()
    return c.json({ success: true, count: categories.length, data: categories })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

ecommerceController.get('/categories/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const category = await ecommerceService.getCategoryByIdOrSlug(idOrSlug)
    return c.json({ success: true, data: category })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 404)
  }
})
