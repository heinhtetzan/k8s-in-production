import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// 1. Users Table (Type: 'shop' | 'customer')
// ============================================================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  type: varchar('type', { length: 50 }).notNull().default('customer'), // 'shop' | 'customer'
  googleId: varchar('google_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// 2. Brands Table (title, slug, image)
// ============================================================================
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// 3. Categories Table (title, slug)
// ============================================================================
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// 4. Products Table (title, description, price, brand_id, category_id)
// ============================================================================
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// 5. Product Images Table (url, product_id, is_primary)
// ============================================================================
export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// 6. Stocks Table (product_id, quantity, sku)
// ============================================================================
export const stocks = pgTable('stocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .unique()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(0),
  sku: varchar('sku', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// Relations
// ============================================================================
export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
  images: many(productImages),
  stock: one(stocks, {
    fields: [products.id],
    references: [stocks.productId],
  }),
}))

// ============================================================================
// 7. Orders Table
// ============================================================================
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 50 }),
  shippingAddress: text('shipping_address').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('card'), // 'card' | 'cash_on_delivery' | 'bank_transfer'
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('paid'), // 'pending' | 'paid' | 'failed'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// 8. Order Items Table
// ============================================================================
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productTitle: varchar('product_title', { length: 255 }).notNull(),
  productPrice: numeric('product_price', { precision: 12, scale: 2 }).notNull(),
  productImage: text('product_image'),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  createdProducts: many(products),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}))

export const stocksRelations = relations(stocks, ({ one }) => ({
  product: one(products, {
    fields: [stocks.productId],
    references: [products.id],
  }),
}))

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Brand = typeof brands.$inferSelect
export type NewBrand = typeof brands.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert
export type Stock = typeof stocks.$inferSelect
export type NewStock = typeof stocks.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

