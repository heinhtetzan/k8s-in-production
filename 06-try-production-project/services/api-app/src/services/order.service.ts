import { orderRepository, CreateOrderItemInput } from '../repositories/order.repository'
import { productRepository } from '../repositories/product.repository'
import { userRepository } from '../repositories/user.repository'

export interface PlaceOrderInput {
  items: Array<{
    productId: string
    quantity: number
  }>
  shippingAddress: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  paymentMethod?: 'card' | 'cash_on_delivery' | 'bank_transfer'
  notes?: string
}

export class OrderService {
  async createCustomerOrder(userId: string, input: PlaceOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Order must contain at least one item')
    }

    if (!input.shippingAddress || !input.shippingAddress.trim()) {
      throw new Error('Shipping address is required')
    }

    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('Customer account not found')
    }

    const customerName = input.customerName?.trim() || user.name
    const customerEmail = input.customerEmail?.trim() || user.email
    const customerPhone = input.customerPhone?.trim() || null

    // Fetch and validate all products
    const orderItemsData: CreateOrderItemInput[] = []
    let totalAmountNum = 0

    for (const item of input.items) {
      const prodId = (item.productId || (item as any).id || (item as any).slug)?.trim()
      if (!prodId) {
        throw new Error('Product identifier is missing for one or more items')
      }
      const qty = Math.max(1, Number(item.quantity) || 1)
      const product = await productRepository.findById(prodId)
      if (!product) {
        throw new Error(`Product "${prodId}" could not be found`)
      }

      // Check stock
      const stock = product.stock?.quantity ?? 0
      if (stock < qty) {
        throw new Error(
          `Insufficient stock for "${product.title}". Requested: ${qty}, Available: ${stock}`
        )
      }

      const price = Number(product.price)
      totalAmountNum += price * qty

      const primaryImg =
        product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || null

      orderItemsData.push({
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        productImage: primaryImg,
        quantity: qty,
      })
    }

    // Generate unique order number (e.g. ORD-M1B2-7K9P)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const newOrder = await orderRepository.create(
      {
        orderNumber,
        userId,
        status: 'pending',
        totalAmount: totalAmountNum.toFixed(2),
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: input.shippingAddress.trim(),
        paymentMethod: input.paymentMethod || 'card',
        paymentStatus: 'paid',
        notes: input.notes?.trim() || null,
      },
      orderItemsData
    )

    return newOrder
  }

  /**
   * Strictly returns only the orders belonging to the authenticated user.
   */
  async getCustomerOrders(userId: string) {
    if (!userId) {
      throw new Error('User ID is required')
    }
    return await orderRepository.findByUserId(userId)
  }

  /**
   * Strictly checks ownership before returning order details.
   */
  async getCustomerOrderById(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    if (order.userId !== userId) {
      throw new Error('Forbidden: You are not authorized to view this order')
    }
    return order
  }

  async cancelCustomerOrder(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    if (order.userId !== userId) {
      throw new Error('Forbidden: You are not authorized to cancel this order')
    }
    if (order.status !== 'pending') {
      throw new Error(`Cannot cancel order in "${order.status}" status`)
    }
    return await orderRepository.updateStatus(orderId, 'cancelled')
  }

  // ============================================================================
  // Dashboard Admin Methods (Guarded by requireShop)
  // ============================================================================
  async getAllOrders(params: {
    status?: string
    search?: string
    page?: number
    limit?: number
  } = {}) {
    return await orderRepository.findAll(params)
  }

  async getOrderById(orderId: string) {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    return order
  }

  async updateOrderStatus(orderId: string, status: string) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }
    const updated = await orderRepository.updateStatus(orderId, status)
    if (!updated) {
      throw new Error('Order not found')
    }
    return updated
  }

  async deleteOrder(orderId: string) {
    const deleted = await orderRepository.delete(orderId)
    if (!deleted) {
      throw new Error('Order not found')
    }
    return deleted
  }

  async getMetrics() {
    return await orderRepository.getMetrics()
  }
}

export const orderService = new OrderService()
