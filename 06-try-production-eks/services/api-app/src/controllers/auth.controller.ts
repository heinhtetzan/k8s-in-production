import { Hono } from 'hono'
import { authService } from '../services/auth.service'
import { requireAuth } from '../middleware/auth.middleware'
import { UserTokenPayload } from '../utils/jwt'

export const authController = new Hono()

// POST /auth/register - Register with email & password
authController.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const result = await authService.register(body)
    return c.json({ message: 'Registration successful', ...result }, 201)
  } catch (error: any) {
    return c.json({ error: error.message || 'Registration failed' }, 400)
  }
})

// POST /auth/login - Login with email & password
authController.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const result = await authService.login(body)
    return c.json({ message: 'Login successful', ...result })
  } catch (error: any) {
    return c.json({ error: error.message || 'Login failed' }, 401)
  }
})

// POST /auth/google - Login or register with Google OAuth
authController.post('/google', async (c) => {
  try {
    const body = await c.req.json()
    const result = await authService.loginWithGoogle(body)
    return c.json({ message: 'Google authentication successful', ...result })
  } catch (error: any) {
    return c.json({ error: error.message || 'Google authentication failed' }, 400)
  }
})

// GET /auth/me - Get current logged-in user profile
authController.get('/me', requireAuth, async (c) => {
  try {
    const user = c.get('user') as UserTokenPayload
    const profile = await authService.getProfile(user.id)
    return c.json({ user: profile })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch profile' }, 404)
  }
})
