import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminStockByProductId,
  updateAdminStock,
  fetchAdminProductById,
  type Stock,
  type Product,
} from '../../lib/api'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Boxes,
  CheckCircle2,
  Package,
} from 'lucide-react'

export const Route = createFileRoute('/stocks/$productId')({
  component: EditStockPage,
})

function EditStockPage() {
  const { productId } = useParams({ from: '/stocks/$productId' })
  const { token } = useAuth()
  const navigate = useNavigate()

  const [stock, setStock] = useState<Stock | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<number>(0)
  const [sku, setSku] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadData = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const [stData, prodData] = await Promise.all([
        fetchAdminStockByProductId(token, productId).catch(() => null),
        fetchAdminProductById(token, productId).catch(() => null),
      ])

      if (stData) {
        setStock(stData)
        setQuantity(stData.quantity ?? 0)
        setSku(stData.sku || '')
      } else if (prodData) {
        setQuantity(prodData.stock?.quantity ?? 0)
        setSku(prodData.sku || '')
      }

      if (prodData) {
        setProduct(prodData)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stock data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [productId, token])

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(0, prev + delta))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const updated = await updateAdminStock(token, productId, {
        quantity: Number(quantity) || 0,
        sku: sku.trim() || undefined,
      })
      setStock(updated)
      setSuccessMessage('Inventory level updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update stock')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs">Loading stock record...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card p-4 shadow-sm">
        <Link
          to="/stocks"
          className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          title="Back to Inventory"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            <span>Update Stock Level</span>
            {product && (
              <span className="text-xs font-normal text-muted-foreground">({product.title})</span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            Adjust physical warehouse stock count and SKU identifier.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-primary/10 text-primary text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card p-5 shadow-sm space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Stock Keeping Unit (SKU)</label>
          <input
            type="text"
            placeholder="e.g. PRD-001-BLK"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Available Quantity in Stock <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-32 h-9 px-3 bg-secondary text-sm font-bold font-mono text-foreground outline-none"
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustQuantity(-10)}
                className="h-9 px-2 bg-secondary hover:bg-secondary/80 text-xs font-mono font-medium"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
                className="h-9 px-2.5 bg-secondary hover:bg-secondary/80 text-xs font-mono font-medium"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustQuantity(+1)}
                className="h-9 px-2.5 bg-secondary hover:bg-secondary/80 text-xs font-mono font-medium"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustQuantity(+10)}
                className="h-9 px-2 bg-secondary hover:bg-secondary/80 text-xs font-mono font-medium"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => adjustQuantity(+50)}
                className="h-9 px-2 bg-secondary hover:bg-secondary/80 text-xs font-mono font-medium"
              >
                +50
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <Link
            to="/stocks"
            className="h-9 px-4 bg-secondary text-secondary-foreground text-xs font-medium inline-flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            Back to Inventory
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 px-5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Update Stock</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
