import { productRepository, FindPublicProductsParams } from '../repositories/product.repository'
import { brandRepository } from '../repositories/brand.repository'
import { categoryRepository } from '../repositories/category.repository'

export interface EcommerceProductsQuery {
  search?: string
  q?: string
  brand?: string
  brandId?: string
  brandSlug?: string
  category?: string
  categoryId?: string
  categorySlug?: string
  minPrice?: string | number
  maxPrice?: string | number
  inStock?: string | boolean
  in_stock?: string | boolean
  minStock?: string | number
  stock_count?: string | number
  sort?: string
  sortBy?: string
  page?: string | number
  limit?: string | number
}

export function formatPublicProduct(p: any) {
  const stockCount = Number(p.stock?.quantity ?? 0)
  const images = Array.isArray(p.images)
    ? [...p.images].sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    : []
  const primaryImage = images.find((img: any) => img.isPrimary)?.url || images[0]?.url || null

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    price: p.price,
    brandId: p.brandId,
    categoryId: p.categoryId,
    stock_count: stockCount,
    in_stock: stockCount > 0,
    sku: p.stock?.sku ?? null,
    primary_image: primaryImage,
    images: images.map((img: any) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      createdAt: img.createdAt,
    })),
    brand: p.brand
      ? {
          id: p.brand.id,
          title: p.brand.title,
          slug: p.brand.slug,
          image: p.brand.image,
        }
      : null,
    category: p.category
      ? {
          id: p.category.id,
          title: p.category.title,
          slug: p.category.slug,
        }
      : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export class EcommerceService {
  async getProducts(query: EcommerceProductsQuery = {}) {
    const search = (query.search || query.q || '').trim()
    const rawBrand = query.brandId || query.brand || query.brandSlug
    const rawCategory = query.categoryId || query.category || query.categorySlug

    let resolvedBrandId: string | undefined = undefined
    if (rawBrand) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawBrand)
      if (isUuid) {
        resolvedBrandId = rawBrand
      } else {
        const brand = await brandRepository.findBySlug(rawBrand)
        if (!brand) {
          // If specified brand does not exist, return empty result
          return {
            success: true,
            data: [],
            pagination: {
              page: Number(query.page || 1),
              limit: Number(query.limit || 12),
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
            filters: {
              search: search || null,
              brand: rawBrand,
              category: rawCategory || null,
              inStock: null,
              sort: query.sort || query.sortBy || 'newest',
            },
          }
        }
        resolvedBrandId = brand.id
      }
    }

    let resolvedCategoryId: string | undefined = undefined
    if (rawCategory) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCategory)
      if (isUuid) {
        resolvedCategoryId = rawCategory
      } else {
        const category = await categoryRepository.findBySlug(rawCategory)
        if (!category) {
          // If specified category does not exist, return empty result
          return {
            success: true,
            data: [],
            pagination: {
              page: Number(query.page || 1),
              limit: Number(query.limit || 12),
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
            filters: {
              search: search || null,
              brand: rawBrand || null,
              category: rawCategory,
              inStock: null,
              sort: query.sort || query.sortBy || 'newest',
            },
          }
        }
        resolvedCategoryId = category.id
      }
    }

    // Parse inStock boolean
    const inStockVal = query.inStock ?? query.in_stock
    let inStock: boolean | undefined = undefined
    if (inStockVal === 'true' || inStockVal === true || inStockVal === '1') {
      inStock = true
    } else if (inStockVal === 'false' || inStockVal === false || inStockVal === '0') {
      inStock = false
    }

    // Min/Max Price
    const minPrice = query.minPrice !== undefined && query.minPrice !== '' ? Number(query.minPrice) : undefined
    const maxPrice = query.maxPrice !== undefined && query.maxPrice !== '' ? Number(query.maxPrice) : undefined

    // Min Stock
    const minStock = query.minStock !== undefined && query.minStock !== ''
      ? Number(query.minStock)
      : query.stock_count !== undefined && query.stock_count !== ''
      ? Number(query.stock_count)
      : undefined

    const page = Math.max(1, Number(query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(query.limit || 12)))
    const sortBy = (query.sort || query.sortBy || 'newest').toLowerCase()

    const filter: FindPublicProductsParams = {
      search: search || undefined,
      brandId: resolvedBrandId,
      categoryId: resolvedCategoryId,
      minPrice,
      maxPrice,
      inStock,
      minStock,
      sortBy,
      page,
      limit,
    }

    const { items, total, totalPages } = await productRepository.findPublicProducts(filter)

    return {
      success: true,
      data: items.map(formatPublicProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        search: search || null,
        brand: rawBrand || null,
        category: rawCategory || null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        inStock: inStock !== undefined ? inStock : null,
        minStock: minStock ?? null,
        sort: sortBy,
      },
    }
  }

  async getProductByIdOrSlug(idOrSlug: string) {
    const product = await productRepository.findByIdOrSlug(idOrSlug)
    if (!product) {
      throw new Error(`Product '${idOrSlug}' not found`)
    }
    return formatPublicProduct(product)
  }

  async getBrands() {
    return await brandRepository.findAllWithCount()
  }

  async getBrandByIdOrSlug(idOrSlug: string) {
    const brand = await brandRepository.findByIdOrSlug(idOrSlug)
    if (!brand) {
      throw new Error(`Brand '${idOrSlug}' not found`)
    }

    const productsResult = await productRepository.findPublicProducts({
      brandId: brand.id,
      limit: 12,
    })

    return {
      ...brand,
      products: productsResult.items.map(formatPublicProduct),
      totalProducts: productsResult.total,
    }
  }

  async getCategories() {
    return await categoryRepository.findAllWithCount()
  }

  async getCategoryByIdOrSlug(idOrSlug: string) {
    const category = await categoryRepository.findByIdOrSlug(idOrSlug)
    if (!category) {
      throw new Error(`Category '${idOrSlug}' not found`)
    }

    const productsResult = await productRepository.findPublicProducts({
      categoryId: category.id,
      limit: 12,
    })

    return {
      ...category,
      products: productsResult.items.map(formatPublicProduct),
      totalProducts: productsResult.total,
    }
  }
}

export const ecommerceService = new EcommerceService()
