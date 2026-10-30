import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || 'shop'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'shop'}`

const useSsl =
  process.env.DB_SSL === 'true' ||
  connectionString.includes('sslmode=require')

export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(client, { schema })

/**
 * Auto-creates tables if they do not exist on app startup.
 */
export async function syncDatabaseSchema() {
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (type IN ('shop', 'customer')),
      google_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS brands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      image TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS stocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 0,
      sku VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number VARCHAR(100) UNIQUE NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      shipping_address TEXT NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'card',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  await client`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      product_title VARCHAR(255) NOT NULL,
      product_price NUMERIC(12, 2) NOT NULL,
      product_image TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `

  // Remove deprecated tasks table if it exists
  await client`DROP TABLE IF EXISTS tasks;`.catch(() => {})
}
