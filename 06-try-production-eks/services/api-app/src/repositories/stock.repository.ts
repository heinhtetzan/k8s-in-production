import { eq } from 'drizzle-orm'
import { db } from '../db'
import { stocks, Stock, NewStock } from '../db/schema'

export class StockRepository {
  async findAll() {
    return await db.query.stocks.findMany({
      with: {
        product: true,
      },
    })
  }

  async findByProductId(productId: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.productId, productId))
    return stock
  }

  async upsert(productId: string, quantity: number, sku?: string): Promise<Stock> {
    const existing = await this.findByProductId(productId)

    if (existing) {
      const [updated] = await db
        .update(stocks)
        .set({
          quantity,
          sku: sku !== undefined ? sku : existing.sku,
          updatedAt: new Date(),
        })
        .where(eq(stocks.productId, productId))
        .returning()
      return updated
    } else {
      const [created] = await db
        .insert(stocks)
        .values({
          productId,
          quantity,
          sku: sku || null,
        })
        .returning()
      return created
    }
  }

  async delete(productId: string): Promise<Stock | undefined> {
    const [deleted] = await db.delete(stocks).where(eq(stocks.productId, productId)).returning()
    return deleted
  }
}

export const stockRepository = new StockRepository()
