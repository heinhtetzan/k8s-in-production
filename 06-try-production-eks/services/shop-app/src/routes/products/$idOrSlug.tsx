import { useState, useEffect } from 'react'
import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { api, type Product } from '../../lib/api'
import { useCart } from '../../lib/cart-context'
import {
  Package,
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Camera,
} from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'

export const Route = createFileRoute('/products/$idOrSlug')({
  head: ({ loaderData }) => {
    const title = loaderData?.product?.title
      ? `${loaderData.product.title} | Kendrick's Shop`
      : "Product Details | Kendrick's Shop"
    const description =
      loaderData?.product?.description ||
      "Explore detailed specifications, live stock, and customer reviews on Kendrick's Shop."
    const image = loaderData?.product?.primary_image || loaderData?.product?.images?.[0]?.url
    return {
      meta: [
        {
          title,
        },
        {
          name: 'description',
          content: description.slice(0, 160),
        },
        {
          property: 'og:title',
          content: title,
        },
        {
          property: 'og:description',
          content: description.slice(0, 160),
        },
        ...(image
          ? [
              {
                property: 'og:image',
                content: image,
              },
            ]
          : []),
      ],
    }
  },
  loader: async ({ params }) => {
    try {
      const res = await api.getProduct(params.idOrSlug)
      return {
        product: res.data || null,
        error: res.success ? null : res.error || 'Product not found',
      }
    } catch (e: any) {
      return { product: null, error: e.message || 'Product not found' }
    }
  },
  errorComponent: ({ error }) => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="bg-card text-card-foreground rounded-2xl border border-border/70 p-6 text-center space-y-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
        <p className="text-xs text-muted-foreground">
          {(error as any)?.message || 'Failed to load product details.'}
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    </div>
  ),
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { idOrSlug } = useParams({ from: '/products/$idOrSlug' })
  const loaderData = Route.useLoaderData()
  const { addItem, openCart } = useCart()

  const [product, setProduct] = useState<Product | null>(loaderData?.product || null)
  const [isLoading, setIsLoading] = useState(!loaderData?.product && !loaderData?.error)
  const [error, setError] = useState<string | null>(loaderData?.error || null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedNotice, setAddedNotice] = useState(false)

  useEffect(() => {
    if (
      loaderData?.product &&
      (loaderData.product.slug === idOrSlug || loaderData.product.id === idOrSlug)
    ) {
      setProduct(loaderData.product)
      setIsLoading(false)
      setError(null)
      return
    }

    let isCancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await api.getProduct(idOrSlug)
        if (!isCancelled) {
          if (res.success && res.data) {
            setProduct(res.data)
            setActiveImageIndex(0)
            setQuantity(1)
          } else {
            setError(res.error || 'Product not found')
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load product details')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      isCancelled = true
    }
  }, [idOrSlug, loaderData])

  const handleAddToCart = () => {
    if (!product) return
    addItem(product, quantity)
    setAddedNotice(true)
    setTimeout(() => {
      setAddedNotice(false)
    }, 3000)
    openCart()
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-3 w-16 rounded" />
          <span className="text-muted-foreground text-xs">/</span>
          <Skeleton className="h-3 w-20 rounded" />
          <span className="text-muted-foreground text-xs">/</span>
          <Skeleton className="h-3 w-32 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-2xl bg-card border border-border/70 overflow-hidden shadow-xs">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-card border border-border/60 overflow-hidden">
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-4/5 rounded-lg" />
                <Skeleton className="h-8 w-2/3 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-28 rounded-md mt-2 font-mono" />
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-2">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-5/6 rounded" />
              <Skeleton className="h-3.5 w-4/6 rounded" />
            </div>

            <div className="space-y-3 pt-4 border-t border-border/40">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-card text-card-foreground rounded-2xl border border-border/70 p-6 text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Product Not Found</h2>
          <p className="text-xs text-muted-foreground">
            {error || 'The product you are looking for does not exist or may have been removed.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Determine images
  const allImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url)
      : product.primary_image
      ? [product.primary_image]
      : []

  const currentImage = allImages[activeImageIndex] || product.primary_image || null

  const formattedPrice = Number(product.price).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      {/* Breadcrumb Navigation - Every Step Clickable */}
      <nav
        aria-label="Breadcrumb navigation"
        className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground"
      >
        <Link
          to="/"
          className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
        >
          Store
        </Link>
        <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/60" />
        <Link
          to="/"
          className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
        >
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/60" />
            <Link
              to="/"
              search={{ category: product.category.slug || product.category.id }}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
              title={`Browse category: ${product.category.title}`}
            >
              {product.category.title}
            </Link>
          </>
        )}
        {product.brand && (
          <>
            <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/60" />
            <Link
              to="/"
              search={{ brand: product.brand.slug || product.brand.id }}
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
              title={`Browse brand: ${product.brand.title}`}
            >
              {product.brand.title}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/60" />
        <Link
          to="/products/$idOrSlug"
          params={{ idOrSlug: product.slug || product.id }}
          className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs hover:underline underline-offset-4 cursor-pointer"
          title={product.title}
        >
          {product.title}
        </Link>
      </nav>

      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>

      {/* Main Product Card */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/70 p-5 lg:p-7 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Primary Main Image - Full Square */}
            <div className="relative aspect-square w-full bg-muted/20 rounded-xl border border-border/60 overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="w-full h-full object-cover transition-all duration-200"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-muted text-muted-foreground flex items-center justify-center">
                  <Package className="w-8 h-8" />
                </div>
              )}

              {/* Badges Over Image - Clickable category and brand */}
              <div className="absolute top-3 left-3 z-10">
                {product.brand && (
                  <Link
                    to="/"
                    search={{ brand: product.brand.slug || product.brand.id }}
                    className="px-2.5 py-1 rounded-md bg-background/90 text-foreground text-xs font-semibold uppercase tracking-wider backdrop-blur-xs border border-border/60 shadow-xs hover:border-primary/50 hover:bg-background transition-all block cursor-pointer"
                    title={`View all products from ${product.brand.title}`}
                  >
                    {product.brand.title}
                  </Link>
                )}
              </div>

              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                {product.category && (
                  <Link
                    to="/"
                    search={{ category: product.category.slug || product.category.id }}
                    className="px-2.5 py-1 rounded-md bg-background/90 text-muted-foreground hover:text-foreground text-xs font-medium backdrop-blur-xs border border-border/60 shadow-xs hover:border-primary/50 hover:bg-background transition-all block cursor-pointer"
                    title={`View all products in ${product.category.title}`}
                  >
                    {product.category.title}
                  </Link>
                )}

                {allImages.length > 1 && (
                  <span className="px-2 py-1 rounded-md bg-background/90 text-foreground text-xs font-medium backdrop-blur-xs border border-border/60 shadow-xs flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {activeImageIndex + 1} / {allImages.length}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail selector if multiple images */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {allImages.map((imgUrl, idx) => {
                  const isActive = idx === activeImageIndex
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 aspect-square rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'border-primary ring-2 ring-primary/30 scale-102'
                          : 'border-border/60 opacity-70 hover:opacity-100 hover:scale-102'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.title} photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Header info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {product.brand && (
                  <Link
                    to="/"
                    search={{ brand: product.brand.slug || product.brand.id }}
                    className="px-2.5 py-1 rounded-md border border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium transition-all cursor-pointer"
                    title={`Filter by brand: ${product.brand.title}`}
                  >
                    {product.brand.title}
                  </Link>
                )}
                {product.category && (
                  <Link
                    to="/"
                    search={{ category: product.category.slug || product.category.id }}
                    className="px-2.5 py-1 rounded-md border border-border/60 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 text-xs font-medium transition-all cursor-pointer"
                    title={`Filter by category: ${product.category.title}`}
                  >
                    {product.category.title}
                  </Link>
                )}
                {product.sku && (
                  <span className="text-xs font-mono text-muted-foreground ml-auto">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {product.title}
              </h1>

              {/* Price line */}
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-2xl font-extrabold text-foreground">
                  {formattedPrice}
                </span>
                <span className="text-xs text-muted-foreground">Taxes included</span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Description
              </h2>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed description available for this product.'}
              </p>
            </div>

            {/* Quantity and Add to Cart Row */}
            <div className="pt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center">
                  <span className="text-xs font-medium text-muted-foreground mr-2">Qty:</span>
                  <div className="inline-flex items-center rounded-lg border border-border/70 bg-secondary text-secondary-foreground overflow-hidden">
                    <button
                      type="button"
                      disabled={quantity <= 1 || !product.in_stock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={!product.in_stock || quantity >= (product.stock_count || 99)}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart button */}
                <button
                  type="button"
                  disabled={!product.in_stock}
                  onClick={handleAddToCart}
                  className="h-9.5 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs hover:shadow-md hover:scale-101"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{product.in_stock ? 'Add to Cart' : 'Currently Unavailable'}</span>
                </button>
              </div>

              {/* Feedback Alert */}
              {addedNotice && (
                <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-foreground text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>
                    Added {quantity} &times; &ldquo;{product.title}&rdquo; to your Kendrick's Shop cart.
                  </span>
                </div>
              )}
            </div>

            {/* Trust and shipping guarantees */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground bg-muted/20 p-3.5 rounded-xl border border-border/50">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>100% Authentic Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-foreground shrink-0" />
                <span>30-Day Easy Returns</span>
              </div>
            </div>

            {/* Specifications Details Table - Borderless */}
            <div className="pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Product Details
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs bg-muted/10 p-3">
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Brand</dt>
                  <dd className="font-medium text-foreground">
                    {product.brand ? (
                      <Link
                        to="/"
                        search={{ brand: product.brand.slug || product.brand.id }}
                        className="hover:underline hover:text-primary transition-colors cursor-pointer"
                        title={`Filter by ${product.brand.title}`}
                      >
                        {product.brand.title}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium text-foreground">
                    {product.category ? (
                      <Link
                        to="/"
                        search={{ category: product.category.slug || product.category.id }}
                        className="hover:underline hover:text-primary transition-colors cursor-pointer"
                        title={`Filter by ${product.category.title}`}
                      >
                        {product.category.title}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-mono text-foreground">{product.sku || '—'}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Stock Available</dt>
                  <dd className="font-medium text-foreground">{product.stock_count} units</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
