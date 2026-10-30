import { Context, Next } from 'hono'
import { verifyToken, UserTokenPayload } from '../utils/jwt'

declare module 'hono' {
  interface ContextVariableMap {
    user: UserTokenPayload
  }
}

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = await verifyToken(token)
    c.set('user', payload)
    await next()
  } catch (err: any) {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401)
  }
}

export async function requireShop(c: Context, next: Next) {
  const user = c.get('user') as UserTokenPayload | undefined
  if (!user) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401)
  }

  if (user.type !== 'shop') {
    return c.json({ error: 'Forbidden: Only shop accounts are permitted to perform this action' }, 403)
  }

  await next()
}
