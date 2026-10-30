import { eq, or, count } from 'drizzle-orm'
import { db } from '../db'
import { categories, products, Category, NewCategory } from '../db/schema'

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.title)
  }

  async findAllWithCount() {
    const result = await db
      .select({
        id: categories.id,
        title: categories.title,
        slug: categories.slug,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productsCount: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(categories.title)

    return result.map((c) => ({
      ...c,
      productsCount: Number(c.productsCount),
    }))
  }

  async findById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id))
    return category
  }

  async findBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug))
    return category
  }

  async findByIdOrSlug(idOrSlug: string): Promise<Category | undefined> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    if (isUuid) {
      const [category] = await db
        .select()
        .from(categories)
        .where(or(eq(categories.id, idOrSlug), eq(categories.slug, idOrSlug)))
      return category
    }
    const [category] = await db.select().from(categories).where(eq(categories.slug, idOrSlug))
    return category
  }

  async create(data: NewCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(data).returning()
    return created
  }

  async update(id: string, data: Partial<NewCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()
    return updated
  }

  async delete(id: string): Promise<Category | undefined> {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning()
    return deleted
  }
}

export const categoryRepository = new CategoryRepository()
