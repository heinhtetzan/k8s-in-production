import { userRepository } from '../repositories/user.repository'
import { generateToken } from '../utils/jwt'

export class AuthService {
  async register(params: {
    email: string
    password: string
    name: string
    type?: 'shop' | 'customer'
    avatarUrl?: string
  }) {
    const { email, password, name, type = 'customer', avatarUrl } = params

    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required')
    }

    if (type !== 'shop' && type !== 'customer') {
      throw new Error('Type must be either "shop" or "customer"')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const existing = await userRepository.findByEmail(email)
    if (existing) {
      throw new Error('An account with this email already exists')
    }

    const passwordHash = await Bun.password.hash(password, {
      algorithm: 'bcrypt',
      cost: 10,
    })

    const user = await userRepository.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      type,
      avatarUrl: avatarUrl || null,
    })

    const token = await generateToken(user)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    }
  }

  async login(params: { email: string; password: string }) {
    const { email, password } = params

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const user = await userRepository.findByEmail(email)
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password')
    }

    try {
      const isValid = await Bun.password.verify(password, user.passwordHash)
      if (!isValid) {
        throw new Error('Invalid email or password')
      }
    } catch (err: any) {
      if (err.message === 'Invalid email or password') throw err
      console.error('Password verification error:', err.message)
      throw new Error('Invalid email or password')
    }

    const token = await generateToken(user)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        avatarUrl: user.avatarUrl,
      },
    }
  }

  async loginWithGoogle(params: {
    idToken?: string
    googleId?: string
    email?: string
    name?: string
    avatarUrl?: string
    type?: 'shop' | 'customer'
  }) {
    let { idToken, googleId, email, name, avatarUrl, type = 'customer' } = params

    // If an id_token was sent, verify it with Google's public tokeninfo API
    if (idToken) {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
        if (response.ok) {
          const payload = (await response.json()) as any
          email = payload.email
          name = payload.name || name || payload.email.split('@')[0]
          avatarUrl = payload.picture || avatarUrl
          googleId = payload.sub
        }
      } catch (err) {
        console.warn('Google id_token validation warning:', err)
      }
    }

    if (!email) {
      throw new Error('Valid Google email is required')
    }

    if (!googleId) {
      googleId = `g_${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    }

    let user = await userRepository.findByGoogleIdOrEmail(googleId, email)

    if (user) {
      // Update google_id, avatar, and name
      user = await userRepository.update(user.id, {
        googleId,
        avatarUrl: avatarUrl || user.avatarUrl,
        name: name || user.name,
      })
    } else {
      // Register new user via Google
      user = await userRepository.create({
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0],
        type: type === 'shop' ? 'shop' : 'customer',
        avatarUrl: avatarUrl || null,
        googleId,
      })
    }

    if (!user) {
      throw new Error('Failed to authenticate Google user')
    }

    const token = await generateToken(user)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        avatarUrl: user.avatarUrl,
      },
    }
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    const { passwordHash, ...profile } = user
    return profile
  }
}

export const authService = new AuthService()
