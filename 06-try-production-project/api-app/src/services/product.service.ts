import { productRepository } from '../repositories/product.repository'
import { stockRepository } from '../repositories/stock.repository'
import { slugify } from '../utils/slug'

export class ProductService {
  async getAll() {
    return await productRepository.findAll()
  }

  async getByIdOrSlug(idOrSlug: string) {
    const product = await productRepository.findByIdOrSlug(idOrSlug)
    if (!product) {
      throw new Error(`Product '${idOrSlug}' not found`)
    }
    return product
  }

  async create(params: {
    title: string
    description?: string
    price: number | string
    brandId?: string
    categoryId?: string
    createdBy?: string
    slug?: string
    initialStock?: number
    stock?: number
    sku?: string
    images?: string[]
    imageUrl?: string
  }) {
    const { title, description, price, brandId, categoryId, createdBy, slug: customSlug, initialStock, stock, sku, images, imageUrl } = params

    if (!title) {
      throw new Error('Title is required')
    }

    const baseSlug = customSlug ? slugify(customSlug) : slugify(title)
    const existing = await productRepository.findBySlug(baseSlug)
    const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

    const product = await productRepository.create({
      title: title.trim(),
      slug,
      description: description || null,
      price: String(price || '0.00'),
      brandId: brandId || null,
      categoryId: categoryId || null,
      createdBy: createdBy || null,
    })

    // Initialize stock if specified (default 0)
    const stockQty = initialStock !== undefined ? initialStock : (stock !== undefined ? stock : 0)
    await stockRepository.upsert(product.id, stockQty, sku)

    // Add initial product images if provided
    const imageList: string[] = images && images.length > 0 
      ? images 
      : (imageUrl ? [imageUrl] : [])

    if (imageList.length > 0) {
      for (let i = 0; i < imageList.length; i++) {
        await productRepository.addImage({
          productId: product.id,
          url: imageList[i],
          isPrimary: i === 0,
        })
      }
    }

    return await productRepository.findByIdOrSlug(product.id)
  }

  async update(id: string, params: {
    title?: string
    description?: string
    price?: number | string
    brandId?: string | null
    categoryId?: string | null
    slug?: string
  }) {
    const product = await productRepository.findByIdOrSlug(id)
    if (!product) {
      throw new Error('Product not found')
    }

    const updates: any = {}
    if (params.title !== undefined) updates.title = params.title.trim()
    if (params.description !== undefined) updates.description = params.description
    if (params.price !== undefined) updates.price = String(params.price)
    if (params.brandId !== undefined) updates.brandId = params.brandId
    if (params.categoryId !== undefined) updates.categoryId = params.categoryId
    if (params.slug !== undefined) updates.slug = slugify(params.slug)

    await productRepository.update(id, updates)
    return await productRepository.findByIdOrSlug(id)
  }

  async delete(id: string) {
    const deleted = await productRepository.delete(id)
    if (!deleted) {
      throw new Error('Product not found')
    }
    return deleted
  }

  // --- Product Images ---
  async addImage(productId: string, url: string, isPrimary = false) {
    if (!url) {
      throw new Error('Image URL is required')
    }

    const product = await productRepository.findByIdOrSlug(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    if (isPrimary) {
      await productRepository.setPrimaryImage(productId, '')
    }

    return await productRepository.addImage({
      productId,
      url,
      isPrimary,
    })
  }

  async deleteImage(imageId: string) {
    const deleted = await productRepository.deleteImage(imageId)
    if (!deleted) {
      throw new Error('Product image not found')
    }
    return deleted
  }
}

export const productService = new ProductService()
