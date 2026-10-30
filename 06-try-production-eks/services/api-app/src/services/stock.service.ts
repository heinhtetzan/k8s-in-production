import { stockRepository } from '../repositories/stock.repository'
import { productRepository } from '../repositories/product.repository'

export class StockService {
  async getAll() {
    return await stockRepository.findAll()
  }

  async getByProductId(productId: string) {
    const stock = await stockRepository.findByProductId(productId)
    if (!stock) {
      throw new Error(`Stock not found for product '${productId}'`)
    }
    return stock
  }

  async updateStock(productId: string, quantity: number, sku?: string) {
    const product = await productRepository.findByIdOrSlug(productId)
    if (!product) {
      throw new Error(`Product '${productId}' not found`)
    }

    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative')
    }

    return await stockRepository.upsert(productId, quantity, sku)
  }
}

export const stockService = new StockService()
