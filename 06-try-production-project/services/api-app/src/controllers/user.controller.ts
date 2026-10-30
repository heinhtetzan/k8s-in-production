import { Hono } from 'hono'
import { userService } from '../services/user.service'

export const userController = new Hono()

// GET / - List all users
userController.get('/', async (c) => {
  try {
    const users = await userService.getAll()
    return c.json({ count: users.length, data: users })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /:id - Get single user by ID
userController.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const user = await userService.getById(id)
    return c.json({ data: user })
  } catch (error: any) {
    return c.json({ error: error.message }, 404)
  }
})

// POST / - Create a new user
userController.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const user = await userService.create(body)
    return c.json({ message: 'User created successfully', data: user }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// PATCH /:id - Update user
userController.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const user = await userService.update(id, body)
    return c.json({ message: 'User updated successfully', data: user })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// DELETE /:id - Delete user
userController.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const user = await userService.delete(id)
    return c.json({ message: 'User deleted successfully', data: user })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
