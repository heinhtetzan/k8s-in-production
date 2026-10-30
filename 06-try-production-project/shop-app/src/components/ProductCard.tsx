import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import type { Product } from '../lib/api'
import { useCart } from '../lib/cart-context'
import { Package, ShoppingCart, Check } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [isAdded, setIsAdded] = useState(false)

  const imageUrl =
    product.primary_image ||
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    null

  // Secondary image for hover effect
  const secondaryImage =
    product.images && product.images.length > 1
      ? product.images.find((img) => img.url !== imageUrl)?.url || null
      : null

  const formattedPrice = Number(product.price).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 1500)
  }

  return (
    <div
      className={`group relative bg-card/90 text-card-foreground rounded-xl border flex flex-col overflow-hidden text-left shadow-xs transition-all duration-300 ${
        isAdded
          ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/15 -translate-y-1'
          : 'border-border/70 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1'
      }`}
    >
      <Link
        to="/products/$idOrSlug"
        params={{ idOrSlug: product.slug || product.id }}
        className="flex-1 flex flex-col"
      >
        {/* Top Image Container - Full Square, Edge-to-Edge */}
        <div className="relative aspect-square w-full bg-muted/30 overflow-hidden">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={product.title}
                loading="lazy"
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  secondaryImage ? 'group-hover:opacity-0' : ''
                }`}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {secondaryImage && (
                <img
                  src={secondaryImage}
                  alt={`${product.title} alternate view`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted text-muted-foreground flex items-center justify-center">
              <Package className="w-8 h-8 opacity-40" />
            </div>
          )}

          {/* Floating Brand Badge Only */}
          {product.brand && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate({
                    to: '/',
                    search: { brand: product.brand?.slug || product.brand?.id },
                  })
                }}
                className="px-2 py-0.5 rounded-md border border-border/60 bg-background/85 text-foreground text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs hover:border-primary/50 hover:bg-background cursor-pointer transition-all"
                title={`Filter by ${product.brand.title}`}
              >
                {product.brand.title}
              </button>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            {/* Category as clean text (not a badge) */}
            {product.category && (
              <span
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate({
                    to: '/',
                    search: { category: product.category?.slug || product.category?.id },
                  })
                }}
                className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors mb-1 inline-block cursor-pointer"
                title={`Filter by ${product.category.title}`}
              >
                {product.category.title}
              </span>
            )}

            {/* Title */}
            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            {/* Description snippet */}
            {product.description && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Card Footer: Price & Actions */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase font-semibold text-muted-foreground">Price</div>
              <div className="text-base font-bold text-foreground">
                {formattedPrice}
              </div>
            </div>

            {product.in_stock && (
              <button
                type="button"
                onClick={handleQuickAdd}
                className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isAdded
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 scale-105 animate-in zoom-in-90 duration-150'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:scale-102 active:scale-95'
                }`}
                title={isAdded ? 'Added to cart' : 'Add to cart'}
                aria-label={isAdded ? 'Added to cart' : 'Add to cart'}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
