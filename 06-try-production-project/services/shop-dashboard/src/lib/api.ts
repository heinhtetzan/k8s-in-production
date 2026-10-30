export interface User {
  id: string
  name: string
  email: string
  type: 'shop' | 'customer'
  avatarUrl?: string | null
  googleId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Brand {
  id: string
  title: string
  slug: string
  image?: string | null
  createdAt?: string
  updatedAt?: string
  productsCount?: number
}

export interface Category {
  id: string
  title: string
  slug: string
  createdAt?: string
  updatedAt?: string
  productsCount?: number
}

export interface ProductImage {
  id: string
  productId?: string
  url: string
  isPrimary: boolean
  createdAt?: string
}

export interface Stock {
  id: string
  productId: string
  quantity: number
  sku?: string | null
  productTitle?: string
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  title: string
  slug: string
  description?: string | null
  price: string
  brandId?: string | null
  categoryId?: string | null
  stock_count?: number
  in_stock?: boolean
  sku?: string | null
  primary_image?: string | null
  images?: ProductImage[]
  brand?: Brand | null
  category?: Category | null
  stock?: Stock | null
  createdAt?: string
  updatedAt?: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId?: string | null
  productTitle: string
  productPrice: string
  productImage?: string | null
  quantity: number
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  shippingAddress: string
  paymentMethod: 'card' | 'cash_on_delivery' | 'bank_transfer'
  paymentStatus: string
  notes?: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  user?: User
}

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    // If running on production domain, always target live API
    if (window.location.hostname.includes('kendrickdev.shop')) {
      return 'https://api.kendrickdev.shop'
    }
    // Local / custom environment
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    return 'http://localhost:9000'
  }
  // Server-side (inside Docker container network or host runtime)
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL
  }
  // In Kubernetes cluster (Service: api-app-service, Port: 8000)
  if (process.env.KUBERNETES_SERVICE_HOST || process.env.NODE_ENV === 'production') {
    return 'http://api-app-service:8000'
  }
  return 'http://api:9000'
}

export const API_BASE = getApiBase()

// Helper for authenticated requests
async function authFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const base = getApiBase()
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  }

  const res = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`)
  }
  return json
}

// ============================================================================
// 1. Dashboard Authentication (Shop Type Enforced)
// ============================================================================

export async function loginShopAdmin(credentials: { email: string; password: string }): Promise<{
  message: string
  token: string
  user: User
}> {
  const base = getApiBase()
  const res = await fetch(`${base}/dashboard/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Login failed')
  }
  return json
}

export async function fetchShopAdminProfile(token: string): Promise<User> {
  const json = await authFetch('/dashboard/me', token)
  return json.user
}

// ============================================================================
// 2. Metrics & Overview
// ============================================================================

export async function fetchDashboardMetrics(token: string): Promise<{
  totalOrders: number
  totalRevenue: number
  byStatus: Array<{ status: string; count: number }>
}> {
  const json = await authFetch('/dashboard/orders/metrics', token)
  return json.metrics
}

// ============================================================================
// 3. Orders Management
// ============================================================================

export async function fetchAdminOrders(
  token: string,
  params: { status?: string; search?: string; page?: number; limit?: number } = {}
): Promise<{ orders: Order[]; total: number; totalPages: number }> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page.toString())
  if (params.limit) query.set('limit', params.limit.toString())

  const endpoint = `/dashboard/orders?${query.toString()}`
  return await authFetch(endpoint, token)
}

export async function fetchAdminOrderById(token: string, id: string): Promise<Order> {
  const json = await authFetch(`/dashboard/orders/${id}`, token)
  return json.order
}

export async function updateAdminOrderStatus(
  token: string,
  id: string,
  status: Order['status']
): Promise<Order> {
  const json = await authFetch(`/dashboard/orders/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return json.order
}

export async function deleteAdminOrder(token: string, id: string): Promise<void> {
  await authFetch(`/dashboard/orders/${id}`, token, { method: 'DELETE' })
}

// ============================================================================
// 4. Products Management
// ============================================================================

export async function fetchAdminProducts(token: string): Promise<Product[]> {
  const json = await authFetch('/dashboard/products', token)
  return json.data || []
}

export async function fetchAdminProductById(token: string, id: string): Promise<Product> {
  const json = await authFetch(`/dashboard/products/${id}`, token)
  return json.data
}

export async function createAdminProduct(
  token: string,
  productData: {
    title: string
    slug: string
    description?: string
    price: number | string
    brandId?: string | null
    categoryId?: string | null
    stock?: number
    sku?: string
    imageUrl?: string
    images?: string[]
  }
): Promise<Product> {
  const json = await authFetch('/dashboard/products', token, {
    method: 'POST',
    body: JSON.stringify(productData),
  })
  return json.data
}

export async function updateAdminProduct(
  token: string,
  id: string,
  updates: Partial<{
    title: string
    slug: string
    description: string
    price: number | string
    brandId: string | null
    categoryId: string | null
  }>
): Promise<Product> {
  const json = await authFetch(`/dashboard/products/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  return json.data
}

export async function deleteAdminProduct(token: string, id: string): Promise<void> {
  await authFetch(`/dashboard/products/${id}`, token, { method: 'DELETE' })
}

export async function addAdminProductImage(
  token: string,
  productId: string,
  imageData: { url: string; isPrimary?: boolean }
): Promise<ProductImage> {
  const json = await authFetch(`/dashboard/products/${productId}/images`, token, {
    method: 'POST',
    body: JSON.stringify(imageData),
  })
  return json.data
}

export async function deleteAdminProductImage(token: string, imageId: string): Promise<void> {
  await authFetch(`/dashboard/products/images/${imageId}`, token, { method: 'DELETE' })
}

// ============================================================================
// 5. Categories Management
// ============================================================================

export async function fetchAdminCategories(token: string): Promise<Category[]> {
  const json = await authFetch('/dashboard/categories', token)
  return json.data || []
}

export async function fetchAdminCategoryById(token: string, id: string): Promise<Category> {
  const json = await authFetch(`/dashboard/categories/${id}`, token)
  return json.data
}

export async function createAdminCategory(
  token: string,
  data: { title: string; slug: string }
): Promise<Category> {
  const json = await authFetch('/dashboard/categories', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return json.data
}

export async function updateAdminCategory(
  token: string,
  id: string,
  data: { title?: string; slug?: string }
): Promise<Category> {
  const json = await authFetch(`/dashboard/categories/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return json.data
}

export async function deleteAdminCategory(token: string, id: string): Promise<void> {
  await authFetch(`/dashboard/categories/${id}`, token, { method: 'DELETE' })
}

// ============================================================================
// 6. Brands Management
// ============================================================================

export async function fetchAdminBrands(token: string): Promise<Brand[]> {
  const json = await authFetch('/dashboard/brands', token)
  return json.data || []
}

export async function fetchAdminBrandById(token: string, id: string): Promise<Brand> {
  const json = await authFetch(`/dashboard/brands/${id}`, token)
  return json.data
}

export async function createAdminBrand(
  token: string,
  data: { title: string; slug: string; image?: string }
): Promise<Brand> {
  const json = await authFetch('/dashboard/brands', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return json.data
}

export async function updateAdminBrand(
  token: string,
  id: string,
  data: { title?: string; slug?: string; image?: string }
): Promise<Brand> {
  const json = await authFetch(`/dashboard/brands/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return json.data
}

export async function deleteAdminBrand(token: string, id: string): Promise<void> {
  await authFetch(`/dashboard/brands/${id}`, token, { method: 'DELETE' })
}

// ============================================================================
// 7. Stocks Management
// ============================================================================

export async function fetchAdminStocks(token: string): Promise<Stock[]> {
  const json = await authFetch('/dashboard/stocks', token)
  return json.data || []
}

export async function fetchAdminStockByProductId(token: string, productId: string): Promise<Stock> {
  const json = await authFetch(`/dashboard/stocks/${productId}`, token)
  return json.data
}

export async function updateAdminStock(
  token: string,
  productId: string,
  data: { quantity: number; sku?: string }
): Promise<Stock> {
  const json = await authFetch(`/dashboard/stocks/${productId}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return json.data
}

// ============================================================================
// 8. Users Management
// ============================================================================

export async function fetchAdminUsers(token: string): Promise<User[]> {
  const json = await authFetch('/dashboard/users', token)
  return json.data || []
}

export async function fetchAdminUserById(token: string, id: string): Promise<User> {
  const json = await authFetch(`/dashboard/users/${id}`, token)
  return json.data
}

export async function createAdminUser(
  token: string,
  data: { name: string; email: string; password?: string; type: 'shop' | 'customer' }
): Promise<User> {
  const json = await authFetch('/dashboard/users', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return json.data
}

export async function updateAdminUser(
  token: string,
  id: string,
  data: { name?: string; email?: string; type?: 'shop' | 'customer' }
): Promise<User> {
  const json = await authFetch(`/dashboard/users/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return json.data
}

export async function deleteAdminUser(token: string, id: string): Promise<void> {
  await authFetch(`/dashboard/users/${id}`, token, { method: 'DELETE' })
}
