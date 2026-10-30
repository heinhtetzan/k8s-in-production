import { eq, or, desc, asc, and, ilike, gte, lte, gt, exists, notExists, count } from 'drizzle-orm'
import { db } from '../db'
import { products, productImages, stocks, Product, NewProduct, ProductImage, NewProductImage } from '../db/schema'

export interface FindPublicProductsParams {
  search?: string
  brandId?: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  minStock?: number
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc' | string
  page?: number
  limit?: number
}

export class ProductRepository {
  async findAll() {
    return await db.query.products.findMany({
      with: {
        brand: true,
        category: true,
        images: true,
        stock: true,
      },
      orderBy: [desc(products.createdAt)],
    })
  }

  async findPublicProducts(filter: FindPublicProductsParams = {}) {
    const conditions = []

    if (filter.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`
      conditions.push(
        or(
          ilike(products.title, term),
          ilike(products.description, term),
          exists(
            db.select({ id: stocks.id }).from(stocks).where(
              and(eq(stocks.productId, products.id), ilike(stocks.sku, term))
            )
          )
        )
      )
    }

    if (filter.brandId) {
      conditions.push(eq(products.brandId, filter.brandId))
    }

    if (filter.categoryId) {
      conditions.push(eq(products.categoryId, filter.categoryId))
    }

    if (filter.minPrice !== undefined && !isNaN(filter.minPrice)) {
      conditions.push(gte(products.price, String(filter.minPrice)))
    }

    if (filter.maxPrice !== undefined && !isNaN(filter.maxPrice)) {
      conditions.push(lte(products.price, String(filter.maxPrice)))
    }

    if (filter.inStock === true) {
      conditions.push(
        exists(
          db.select({ id: stocks.id }).from(stocks).where(
            and(eq(stocks.productId, products.id), gt(stocks.quantity, 0))
          )
        )
      )
    } else if (filter.inStock === false) {
      conditions.push(
        or(
          exists(
            db.select({ id: stocks.id }).from(stocks).where(
              and(eq(stocks.productId, products.id), lte(stocks.quantity, 0))
            )
          ),
          notExists(
            db.select({ id: stocks.id }).from(stocks).where(eq(stocks.productId, products.id))
          )
        )
      )
    }

    if (filter.minStock !== undefined && !isNaN(filter.minStock)) {
      conditions.push(
        exists(
          db.select({ id: stocks.id }).from(stocks).where(
            and(eq(stocks.productId, products.id), gte(stocks.quantity, filter.minStock))
          )
        )
      )
    }

    let orderBy: any = desc(products.createdAt)
    switch (filter.sortBy) {
      case 'oldest':
        orderBy = asc(products.createdAt)
        break
      case 'price_asc':
        orderBy = asc(products.price)
        break
      case 'price_desc':
        orderBy = desc(products.price)
        break
      case 'title_asc':
        orderBy = asc(products.title)
        break
      case 'title_desc':
        orderBy = desc(products.title)
        break
      case 'newest':
      default:
        orderBy = desc(products.createdAt)
        break
    }

    const page = Math.max(1, filter.page || 1)
    const limit = Math.min(100, Math.max(1, filter.limit || 12))
    const offset = (page - 1) * limit

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [countResult] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause)

    const total = Number(countResult?.total ?? 0)

    const items = await db.query.products.findMany({
      where: whereClause,
      with: {
        brand: true,
        category: true,
        images: true,
        stock: true,
      },
      orderBy: [orderBy],
      limit,
      offset,
    })

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findByIdOrSlug(idOrSlug: string) {
    if (!idOrSlug || !idOrSlug.trim()) {
      return undefined
    }
    const clean = idOrSlug.trim()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)

    return await db.query.products.findFirst({
      where: isUuid
        ? or(eq(products.id, clean), eq(products.slug, clean))
        : eq(products.slug, clean),
      with: {
        brand: true,
        category: true,
        images: true,
        stock: true,
      },
    })
  }

  async findById(id: string) {
    if (!id || !id.trim()) {
      return undefined
    }
    return await this.findByIdOrSlug(id)
  }

  async findBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug))
    return product
  }

  async create(data: NewProduct): Promise<Product> {
    const [created] = await db.insert(products).values(data).returning()
    return created
  }

  async update(id: string, data: Partial<NewProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    return updated
  }

  async delete(id: string): Promise<Product | undefined> {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning()
    return deleted
  }

  // --- Product Images ---
  async addImage(data: NewProductImage): Promise<ProductImage> {
    const [image] = await db.insert(productImages).values(data).returning()
    return image
  }

  async deleteImage(imageId: string): Promise<ProductImage | undefined> {
    const [deleted] = await db.delete(productImages).where(eq(productImages.id, imageId)).returning()
    return deleted
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    // Reset all to false
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId))

    // Set target to true
    await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(and(eq(productImages.productId, productId), eq(productImages.id, imageId)))
  }
}

export const productRepository = new ProductRepository()
