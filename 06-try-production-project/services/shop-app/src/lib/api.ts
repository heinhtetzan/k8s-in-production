export interface ProductImage {
  id: string
  url: string
  isPrimary: boolean
  createdAt?: string
}

export interface Brand {
  id: string
  title: string
  slug: string
  image?: string | null
  productsCount?: number
}

export interface Category {
  id: string
  title: string
  slug: string
  image?: string | null
  productsCount?: number
}

export interface Product {
  id: string
  title: string
  slug: string
  description?: string | null
  price: string
  brandId?: string | null
  categoryId?: string | null
  stock_count: number
  in_stock: boolean
  sku?: string | null
  primary_image?: string | null
  images: ProductImage[]
  brand?: Brand | null
  category?: Category | null
  createdAt?: string
  updatedAt?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ProductFilters {
  search?: string
  brand?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  in_stock?: boolean
  stock_count?: number
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc'
  page?: number
  limit?: number
}

export interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: Pagination
  filters: Record<string, any>
}

export interface AuthUser {
  id: string
  email: string
  name: string
  type: 'shop' | 'customer'
  avatarUrl?: string | null
  googleId?: string | null
  createdAt?: string
}

export interface AuthResponse {
  message: string
  token: string
  user: AuthUser
}

export interface DashboardOverview {
  message: string
  role: string
  endpoints: Record<string, any>
}

export interface HealthResponse {
  status: string
  database?: string
  orm?: string
  db_info?: {
    healthy?: number
    time?: string
    database?: string
  }
}

// Legacy task interface for tasks route
export interface Task {
  uuid: string
  title: string
  is_done: boolean
  created_at: string
  updated_at: string
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

// ============================================================================
// Public E-Commerce APIs
// ============================================================================

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const base = getApiBase()
  const url = new URL(`${base}/ecommerce/products`)

  if (filters.search) url.searchParams.set('search', filters.search.trim())
  if (filters.brand) url.searchParams.set('brand', filters.brand)
  if (filters.category) url.searchParams.set('category', filters.category)
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    url.searchParams.set('minPrice', filters.minPrice.toString())
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    url.searchParams.set('maxPrice', filters.maxPrice.toString())
  }
  if (filters.in_stock !== undefined) {
    url.searchParams.set('in_stock', filters.in_stock ? 'true' : 'false')
  }
  if (filters.sort) url.searchParams.set('sort', filters.sort)
  if (filters.page) url.searchParams.set('page', filters.page.toString())
  if (filters.limit) url.searchParams.set('limit', filters.limit.toString())

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || `Failed to fetch products: ${res.statusText}`)
  }

  return res.json()
}

export async function fetchProductByIdOrSlug(idOrSlug: string): Promise<Product> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/products/${encodeURIComponent(idOrSlug)}`)
  if (!res.ok) {
    throw new Error(`Product not found (${res.status})`)
  }
  const json = await res.json()
  return json.data
}

export async function fetchBrands(): Promise<Brand[]> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/brands`)
  if (!res.ok) return []
  const json = await res.json()
  return json.data || []
}

export async function fetchCategories(): Promise<Category[]> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/categories`)
  if (!res.ok) return []
  const json = await res.json()
  return json.data || []
}

// ============================================================================
// Customer Orders APIs
// ============================================================================

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
}

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>
  shippingAddress: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod?: 'card' | 'cash_on_delivery' | 'bank_transfer'
  notes?: string
}

export async function createCustomerOrder(
  token: string,
  payload: CreateOrderPayload
): Promise<{ success: boolean; message: string; order: Order }> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Failed to place order')
  }
  return json
}

export async function fetchCustomerOrders(
  token: string
): Promise<{ success: boolean; count: number; orders: Order[] }> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Failed to fetch your orders')
  }
  return json
}

export async function fetchCustomerOrderById(
  token: string,
  orderId: string
): Promise<{ success: boolean; order: Order }> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Failed to fetch order details')
  }
  return json
}

export async function cancelCustomerOrder(
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string; order: Order }> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Failed to cancel order')
  }
  return json
}

// ============================================================================
// Auth APIs (Under /ecommerce/auth for customers)
// ============================================================================

export async function loginUser(credentials: { email: string; password: string }): Promise<AuthResponse> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/auth/login`, {
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

export async function registerUser(credentials: {
  email: string
  password: string
  name: string
  type?: 'shop' | 'customer'
  avatarUrl?: string
}): Promise<AuthResponse> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Registration failed')
  }
  return json
}

export async function loginWithGoogle(payload: {
  idToken?: string
  googleId?: string
  email?: string
  name?: string
  avatarUrl?: string
  type?: 'shop' | 'customer'
}): Promise<AuthResponse> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Google login failed')
  }
  return json
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const base = getApiBase()
  const res = await fetch(`${base}/ecommerce/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error('Unauthorized or expired session')
  }
  const json = await res.json()
  return json.user
}

// ============================================================================
// Dashboard APIs (Requires Shop Token)
// ============================================================================

export async function fetchDashboardOverview(token: string): Promise<DashboardOverview> {
  const base = getApiBase()
  const res = await fetch(`${base}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || 'Dashboard access denied')
  }
  return res.json()
}

export async function fetchDashboardUsers(token: string): Promise<{ count: number; data: AuthUser[] }> {
  const base = getApiBase()
  const res = await fetch(`${base}/dashboard/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || 'Failed to fetch dashboard users')
  }
  return res.json()
}

// ============================================================================
// System Health
// ============================================================================

export async function checkApiHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${getApiBase()}/health`)
    if (!res.ok) return { status: 'disconnected' }
    return res.json()
  } catch {
    return { status: 'offline' }
  }
}

// ============================================================================
// Legacy Tasks APIs
// ============================================================================

export async function fetchTasks(filter?: 'all' | 'pending' | 'completed'): Promise<Task[]> {
  const base = getApiBase()
  const url = new URL(`${base}/tasks`)
  if (filter === 'completed') {
    url.searchParams.set('is_done', 'true')
  } else if (filter === 'pending') {
    url.searchParams.set('is_done', 'false')
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    return []
  }
  const json = await res.json()
  return json.data || []
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetch(`${getApiBase()}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, is_done: false }),
  })
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || 'Failed to create task')
  }
  return res.json()
}

export async function updateTask(uuid: string, updates: { title?: string; is_done?: boolean }): Promise<Task> {
  const res = await fetch(`${getApiBase()}/tasks/${uuid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || 'Failed to update task')
  }
  return res.json()
}

export async function deleteTask(uuid: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/tasks/${uuid}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || 'Failed to delete task')
  }
}

// ============================================================================
// Unified API client export
// ============================================================================

export const api = {
  getProducts: fetchProducts,
  getProduct: async (idOrSlug: string) => {
    try {
      const data = await fetchProductByIdOrSlug(idOrSlug)
      return { success: true, data }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
  getBrands: async () => {
    const data = await fetchBrands()
    return { success: true, data }
  },
  getCategories: async () => {
    const data = await fetchCategories()
    return { success: true, data }
  },
  getDashboardOverview: fetchDashboardOverview,
  getDashboardUsers: fetchDashboardUsers,
  login: loginUser,
  register: registerUser,
  googleAuth: loginWithGoogle,
}

