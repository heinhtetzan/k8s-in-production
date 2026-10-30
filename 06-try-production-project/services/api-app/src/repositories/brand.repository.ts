import { eq, or, count } from 'drizzle-orm'
import { db } from '../db'
import { brands, products, Brand, NewBrand } from '../db/schema'

export class BrandRepository {
  async findAll(): Promise<Brand[]> {
    return await db.select().from(brands).orderBy(brands.title)
  }

  async findAllWithCount() {
    const result = await db
      .select({
        id: brands.id,
        title: brands.title,
        slug: brands.slug,
        image: brands.image,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
        productsCount: count(products.id),
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .groupBy(brands.id)
      .orderBy(brands.title)

    return result.map((b) => ({
      ...b,
      productsCount: Number(b.productsCount),
    }))
  }

  async findById(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id))
    return brand
  }

  async findBySlug(slug: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.slug, slug))
    return brand
  }

  async findByIdOrSlug(idOrSlug: string): Promise<Brand | undefined> {
    // If it looks like a valid UUID, search by both ID or slug, otherwise by slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
    if (isUuid) {
      const [brand] = await db
        .select()
        .from(brands)
        .where(or(eq(brands.id, idOrSlug), eq(brands.slug, idOrSlug)))
      return brand
    }
    const [brand] = await db.select().from(brands).where(eq(brands.slug, idOrSlug))
    return brand
  }

  async create(data: NewBrand): Promise<Brand> {
    const [created] = await db.insert(brands).values(data).returning()
    return created
  }

  async update(id: string, data: Partial<NewBrand>): Promise<Brand | undefined> {
    const [updated] = await db
      .update(brands)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning()
    return updated
  }

  async delete(id: string): Promise<Brand | undefined> {
    const [deleted] = await db.delete(brands).where(eq(brands.id, id)).returning()
    return deleted
  }
}

export const brandRepository = new BrandRepository()
