import { userRepository } from '../repositories/user.repository'

export interface UserResponse {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  type: string
  googleId: string | null
  createdAt: Date
  updatedAt: Date
}

function sanitizeUser(user: any): UserResponse {
  const { passwordHash, ...rest } = user
  return rest
}

export class UserService {
  async getAll(): Promise<UserResponse[]> {
    const list = await userRepository.findAll()
    return list
  }

  async getById(id: string): Promise<UserResponse> {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new Error(`User with ID "${id}" not found`)
    }
    return sanitizeUser(user)
  }

  async create(data: {
    email: string
    name: string
    password?: string
    type?: 'shop' | 'customer'
    avatarUrl?: string
  }): Promise<UserResponse> {
    const { email, name, password, type = 'customer', avatarUrl } = data

    if (!email || !name) {
      throw new Error('Email and name are required')
    }

    if (type !== 'shop' && type !== 'customer') {
      throw new Error('Type must be either "shop" or "customer"')
    }

    const existing = await userRepository.findByEmail(email)
    if (existing) {
      throw new Error(`User with email "${email}" already exists`)
    }

    let passwordHash: string | null = null
    if (password) {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      passwordHash = await Bun.password.hash(password, {
        algorithm: 'bcrypt',
        cost: 10,
      })
    }

    const created = await userRepository.create({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      type,
      avatarUrl: avatarUrl || null,
    })

    return sanitizeUser(created)
  }

  async update(
    id: string,
    data: {
      email?: string
      name?: string
      password?: string
      type?: 'shop' | 'customer'
      avatarUrl?: string
    }
  ): Promise<UserResponse> {
    const existing = await userRepository.findById(id)
    if (!existing) {
      throw new Error(`User with ID "${id}" not found`)
    }

    const updatePayload: any = {}

    if (data.name !== undefined) {
      updatePayload.name = data.name.trim()
    }

    if (data.type !== undefined) {
      if (data.type !== 'shop' && data.type !== 'customer') {
        throw new Error('Type must be either "shop" or "customer"')
      }
      updatePayload.type = data.type
    }

    if (data.avatarUrl !== undefined) {
      updatePayload.avatarUrl = data.avatarUrl
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email.toLowerCase().trim()
      if (normalizedEmail !== existing.email) {
        const emailTaken = await userRepository.findByEmail(normalizedEmail)
        if (emailTaken) {
          throw new Error(`User with email "${normalizedEmail}" already exists`)
        }
        updatePayload.email = normalizedEmail
      }
    }

    if (data.password) {
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      updatePayload.passwordHash = await Bun.password.hash(data.password, {
        algorithm: 'bcrypt',
        cost: 10,
      })
    }

    const updated = await userRepository.update(id, updatePayload)
    if (!updated) {
      throw new Error(`Failed to update user with ID "${id}"`)
    }

    return sanitizeUser(updated)
  }

  async delete(id: string): Promise<UserResponse> {
    const existing = await userRepository.findById(id)
    if (!existing) {
      throw new Error(`User with ID "${id}" not found`)
    }

    const deleted = await userRepository.delete(id)
    if (!deleted) {
      throw new Error(`Failed to delete user with ID "${id}"`)
    }

    return sanitizeUser(deleted)
  }
}

export const userService = new UserService()
