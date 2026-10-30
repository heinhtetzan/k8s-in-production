import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from './api'

export interface CartItem {
  id: string
  productId?: string
  slug: string
  title: string
  price: number
  image: string | null
  brandTitle?: string
  quantity: number
  stockCount: number
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (product: Product | { id: string; slug?: string; title: string; price: string | number; primary_image?: string | null; images?: { url: string; isPrimary?: boolean }[]; brand?: { title: string }; stock_count?: number }, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'kendricks_shop_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart to localStorage', e)
    }
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addItem = (
    product: Product | { id: string; slug?: string; title: string; price: string | number; primary_image?: string | null; images?: { url: string; isPrimary?: boolean }[]; brand?: { title: string }; stock_count?: number },
    quantity = 1
  ) => {
    const rawPrice = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price)
    const price = isNaN(rawPrice) ? 0 : rawPrice
    const image =
      product.primary_image ||
      product.images?.find((img) => img.isPrimary)?.url ||
      product.images?.[0]?.url ||
      null
    const stockCount = product.stock_count ?? 99

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, stockCount)
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        )
      } else {
        const newItem: CartItem = {
          id: product.id,
          productId: product.id,
          slug: product.slug || product.id,
          title: product.title,
          price,
          image,
          brandTitle: product.brand?.title,
          quantity: Math.min(quantity, stockCount),
          stockCount,
        }
        return [...prev, newItem]
      }
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          return { ...item, quantity: Math.min(quantity, item.stockCount) }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  const toggleCart = () => setIsCartOpen((prev) => !prev)

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
