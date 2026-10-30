import { eq, or } from 'drizzle-orm'
import { db } from '../db'
import { users, User, NewUser } from '../db/schema'

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()))
    return user
  }

  async findByGoogleIdOrEmail(googleId: string, email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, googleId), eq(users.email, email.toLowerCase().trim())))
    return user
  }

  async create(data: NewUser): Promise<User> {
    const [created] = await db.insert(users).values(data).returning()
    return created
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return updated
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        type: users.type,
        googleId: users.googleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
  }

  async delete(id: string): Promise<User | undefined> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning()
    return deleted
  }
}

export const userRepository = new UserRepository()
