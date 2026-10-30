import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminProductById,
  updateAdminProduct,
  addAdminProductImage,
  deleteAdminProductImage,
  fetchAdminCategories,
  fetchAdminBrands,
  type Product,
  type Category,
  type Brand,
} from '../../lib/api'
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

export const Route = createFileRoute('/products/$id/edit')({
  component: EditProductPage,
})

function EditProductPage() {
  const { id } = useParams({ from: '/products/$id/edit' })
  const { token } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')

  // New Image input state
  const [newImageUrl, setNewImageUrl] = useState('')
  const [isAddingImage, setIsAddingImage] = useState(false)

  const loadData = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const [prodData, cats, brs] = await Promise.all([
        fetchAdminProductById(token, id),
        fetchAdminCategories(token),
        fetchAdminBrands(token),
      ])
      setProduct(prodData)
      setCategories(cats)
      setBrands(brs)

      // Pre-fill form
      setTitle(prodData.title || '')
      setSlug(prodData.slug || '')
      setDescription(prodData.description || '')
      setPrice(prodData.price ? String(prodData.price) : '')
      setCategoryId(prodData.categoryId || '')
      setBrandId(prodData.brandId || '')
    } catch (err: any) {
      setError(err.message || 'Failed to load product details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !title.trim() || !slug.trim()) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updated = await updateAdminProduct(token, id, {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        categoryId: categoryId || null,
        brandId: brandId || null,
      })
      setProduct((prev) => (prev ? { ...prev, ...updated } : updated))
      setSuccessMessage('Product updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newImageUrl.trim() || !product) return

    setIsAddingImage(true)
    setError(null)
    try {
      const newImg = await addAdminProductImage(token, product.id, {
        url: newImageUrl.trim(),
        isPrimary: !product.images || product.images.length === 0,
      })
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              images: [...(prev.images || []), newImg],
            }
          : prev
      )
      setNewImageUrl('')
      setSuccessMessage('Image added to gallery!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to add image')
    } finally {
      setIsAddingImage(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!token || !confirm('Remove this image from product gallery?')) return
    try {
      await deleteAdminProductImage(token, imageId)
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              images: prev.images?.filter((img) => img.id !== imageId),
            }
          : prev
      )
    } catch (err: any) {
      alert(err.message || 'Failed to delete image')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs">Loading product details...</p>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            title="Back to Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Edit Product</span>
              <span className="text-xs font-mono font-normal text-muted-foreground">({product?.slug})</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Update pricing, metadata, descriptions, and manage image gallery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/stocks"
            className="h-8 px-3 bg-secondary text-secondary-foreground text-xs font-medium inline-flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manage Stock</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Details */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground border-b-0 pb-1">
              General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Product Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  URL Slug <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Price (USD $) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <Select
                  value={categoryId || 'none'}
                  onValueChange={(val) => setCategoryId(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Uncategorized</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Brand</label>
                <Select
                  value={brandId || 'none'}
                  onValueChange={(val) => setBrandId(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Generic</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-secondary text-xs text-foreground outline-none resize-y"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <Link
                to="/products"
                className="h-9 px-4 bg-secondary text-secondary-foreground text-xs font-medium inline-flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Images & Inventory Summary */}
        <div className="space-y-6">
          {/* Gallery Management */}
          <div className="bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center justify-between">
              <span>Image Gallery</span>
              <span className="text-xs font-mono text-muted-foreground">
                ({product?.images?.length || 0} images)
              </span>
            </h2>

            {/* Images Grid */}
            <div className="grid grid-cols-2 gap-2">
              {product?.images && product.images.length > 0 ? (
                product.images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative group aspect-square bg-muted/20 overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                      title="Delete image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center bg-secondary/30 text-muted-foreground text-xs">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span>No images attached yet</span>
                </div>
              )}
            </div>

            {/* Add Image URL */}
            <form onSubmit={handleAddImage} className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-foreground">Add Image by URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 h-8 px-2.5 bg-secondary text-xs text-foreground outline-none"
                />
                <button
                  type="submit"
                  disabled={isAddingImage || !newImageUrl.trim()}
                  className="h-8 px-3 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isAddingImage ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  <span>Add</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
              Inventory Snapshot
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 bg-secondary/30 px-2.5">
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-mono font-semibold text-foreground">{product?.sku || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 bg-secondary/30 px-2.5">
                <span className="text-muted-foreground">Stock Qty:</span>
                <span className="font-semibold text-foreground">{product?.stock?.quantity ?? 0}</span>
              </div>
              <div className="flex justify-between py-1 bg-secondary/30 px-2.5">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">
                  {product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
