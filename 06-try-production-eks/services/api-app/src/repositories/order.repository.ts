import { eq, desc, and, sql, ilike, or } from 'drizzle-orm'
import { db } from '../db'
import { orders, orderItems, stocks, products, type Order, type NewOrder, type OrderItem } from '../db/schema'

export interface CreateOrderItemInput {
  productId?: string | null
  productTitle: string
  productPrice: string
  productImage?: string | null
  quantity: number
}

export class OrderRepository {
  async create(orderData: NewOrder, items: CreateOrderItemInput[]) {
    return await db.transaction(async (tx) => {
      // 1. Insert order
      const [order] = await tx.insert(orders).values(orderData).returning()

      // 2. Insert order items
      const insertedItems: OrderItem[] = []
      for (const item of items) {
        const [insertedItem] = await tx
          .insert(orderItems)
          .values({
            orderId: order.id,
            productId: item.productId || null,
            productTitle: item.productTitle,
            productPrice: item.productPrice,
            productImage: item.productImage || null,
            quantity: item.quantity,
          })
          .returning()
        insertedItems.push(insertedItem)

        // 3. Decrement stock if productId exists
        if (item.productId) {
          await tx
            .update(stocks)
            .set({
              quantity: sql`GREATEST(0, ${stocks.quantity} - ${item.quantity})`,
              updatedAt: new Date(),
            })
            .where(eq(stocks.productId, item.productId))
        }
      }

      return {
        ...order,
        items: insertedItems,
      }
    })
  }

  async findByUserId(userId: string) {
    return await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true,
      },
    })
  }

  async findById(id: string) {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            type: true,
          },
        },
      },
    })
  }

  async findAll(params: {
    status?: string
    search?: string
    page?: number
    limit?: number
  } = {}) {
    const { status, search, page = 1, limit = 50 } = params
    const offset = (page - 1) * limit

    const conditions = []
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status))
    }
    if (search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(orders.customerName, `%${search}%`),
          ilike(orders.customerEmail, `%${search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [allOrders, [{ total }]] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        orderBy: [desc(orders.createdAt)],
        limit,
        offset,
        with: {
          items: true,
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(orders)
        .where(whereClause),
    ])

    return {
      orders: allOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    }
  }

  async updateStatus(id: string, status: string) {
    const [updated] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()
    return updated
  }

  async delete(id: string) {
    const [deleted] = await db.delete(orders).where(eq(orders.id, id)).returning()
    return deleted
  }

  async getMetrics() {
    const [[countResult], [revenueResult], [statusCounts]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(orders),
      db
        .select({
          totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)::text`,
        })
        .from(orders),
      db
        .select({
          status: orders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .groupBy(orders.status),
    ])

    return {
      totalOrders: countResult?.count ?? 0,
      totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
      byStatus: statusCounts || [],
    }
  }
}

export const orderRepository = new OrderRepository()
