import { sign, verify } from 'hono/jwt'

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-shop-jwt-secret-2026'

export interface UserTokenPayload {
  [key: string]: unknown
  id: string
  email: string
  name: string
  type: 'shop' | 'customer'
  exp: number
}

export async function generateToken(user: { id: string; email: string; name: string; type: string }): Promise<string> {
  const payload: UserTokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type as 'shop' | 'customer',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
  }
  return await sign(payload, JWT_SECRET, 'HS256')
}

export async function verifyToken(token: string): Promise<UserTokenPayload> {
  return (await verify(token, JWT_SECRET, 'HS256')) as unknown as UserTokenPayload
}
