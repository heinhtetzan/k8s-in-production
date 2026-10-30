import { brandRepository } from '../repositories/brand.repository'
import { slugify } from '../utils/slug'

export class BrandService {
  async getAll() {
    return await brandRepository.findAll()
  }

  async getByIdOrSlug(idOrSlug: string) {
    const brand = await brandRepository.findByIdOrSlug(idOrSlug)
    if (!brand) {
      throw new Error(`Brand '${idOrSlug}' not found`)
    }
    return brand
  }

  async create(params: { title: string; image?: string; slug?: string }) {
    const { title, image, slug: customSlug } = params
    if (!title) {
      throw new Error('Title is required')
    }

    const baseSlug = customSlug ? slugify(customSlug) : slugify(title)
    const existing = await brandRepository.findBySlug(baseSlug)
    const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

    return await brandRepository.create({
      title: title.trim(),
      slug,
      image: image || null,
    })
  }

  async update(id: string, params: { title?: string; image?: string; slug?: string }) {
    const brand = await brandRepository.findById(id)
    if (!brand) {
      throw new Error(`Brand not found`)
    }

    const updates: any = {}
    if (params.title !== undefined) updates.title = params.title.trim()
    if (params.image !== undefined) updates.image = params.image
    if (params.slug !== undefined) updates.slug = slugify(params.slug)

    return await brandRepository.update(id, updates)
  }

  async delete(id: string) {
    const deleted = await brandRepository.delete(id)
    if (!deleted) {
      throw new Error(`Brand not found`)
    }
    return deleted
  }
}

export const brandService = new BrandService()
