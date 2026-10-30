import { categoryRepository } from '../repositories/category.repository'
import { slugify } from '../utils/slug'

export class CategoryService {
  async getAll() {
    return await categoryRepository.findAll()
  }

  async getByIdOrSlug(idOrSlug: string) {
    const category = await categoryRepository.findByIdOrSlug(idOrSlug)
    if (!category) {
      throw new Error(`Category '${idOrSlug}' not found`)
    }
    return category
  }

  async create(params: { title: string; slug?: string }) {
    const { title, slug: customSlug } = params
    if (!title) {
      throw new Error('Title is required')
    }

    const baseSlug = customSlug ? slugify(customSlug) : slugify(title)
    const existing = await categoryRepository.findBySlug(baseSlug)
    const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

    return await categoryRepository.create({
      title: title.trim(),
      slug,
    })
  }

  async update(id: string, params: { title?: string; slug?: string }) {
    const category = await categoryRepository.findById(id)
    if (!category) {
      throw new Error(`Category not found`)
    }

    const updates: any = {}
    if (params.title !== undefined) updates.title = params.title.trim()
    if (params.slug !== undefined) updates.slug = slugify(params.slug)

    return await categoryRepository.update(id, updates)
  }

  async delete(id: string) {
    const deleted = await categoryRepository.delete(id)
    if (!deleted) {
      throw new Error(`Category not found`)
    }
    return deleted
  }
}

export const categoryService = new CategoryService()
