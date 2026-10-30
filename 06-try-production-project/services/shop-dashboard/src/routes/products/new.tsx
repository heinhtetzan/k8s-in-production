import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  createAdminProduct,
  fetchAdminCategories,
  fetchAdminBrands,
  type Category,
  type Brand,
} from '../../lib/api'
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  PackagePlus,
  Image as ImageIcon,
  Boxes,
  Check,
  Plus,
  Trash2,
  Star,
  Sparkles,
  Info,
  DollarSign,
  Tag,
  Layers,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

export const Route = createFileRoute('/products/new')({
  component: CreateProductPage,
})

type Step = 1 | 2 | 3

// Sample Unsplash photography links for convenience
const PRESET_SAMPLE_IMAGES = [
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { label: 'Camera', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
]

function CreateProductPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Stepper state: 1: Product Data, 2: Images, 3: Stocks
  const [currentStep, setCurrentStep] = useState<Step>(1)

  // Taxonomies
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoadingTaxonomies, setIsLoadingTaxonomies] = useState(true)

  // Step 1: Product Data
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')

  // Step 2: Images
  const [images, setImages] = useState<string[]>([])
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0)

  // Step 3: Adding Stocks
  const [stock, setStock] = useState('20')
  const [sku, setSku] = useState('')

  // Submission & validation state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTaxonomies() {
      if (!token) return
      try {
        const [c, b] = await Promise.all([
          fetchAdminCategories(token),
          fetchAdminBrands(token),
        ])
        setCategories(c)
        setBrands(b)
        if (c.length > 0 && !categoryId) setCategoryId(c[0].id)
        if (b.length > 0 && !brandId) setBrandId(b[0].id)
      } catch (err: any) {
        console.error('Failed to load taxonomies:', err)
      } finally {
        setIsLoadingTaxonomies(false)
      }
    }
    loadTaxonomies()
  }, [token])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }

  const handleAddImage = (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || currentImageUrl).trim()
    if (!targetUrl) return
    if (!images.includes(targetUrl)) {
      setImages((prev) => [...prev, targetUrl])
    }
    setCurrentImageUrl('')
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove)
      if (primaryImageIndex >= next.length) {
        setPrimaryImageIndex(Math.max(0, next.length - 1))
      }
      return next
    })
  }

  const handleSetPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index)
  }

  const generateAutoSku = () => {
    const brandPrefix = brands.find((b) => b.id === brandId)?.slug.slice(0, 3).toUpperCase() || 'PRD'
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase()
    setSku(`${brandPrefix}-${randomHex}`)
  }

  // Step Transitions & Validations
  const validateStep1 = (): boolean => {
    setError(null)
    if (!title.trim()) {
      setError('Product title is required.')
      return false
    }
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please provide a valid, non-negative price.')
      return false
    }
    if (!slug.trim()) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
    return true
  }

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) {
      // Auto-suggest SKU if empty
      if (!sku) {
        generateAutoSku()
      }
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNextToStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    // If user has typed an image URL but didn't click "Add", add it automatically
    if (currentImageUrl.trim() && !images.includes(currentImageUrl.trim())) {
      setImages((prev) => [...prev, currentImageUrl.trim()])
      setCurrentImageUrl('')
    }
    setError(null)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!validateStep1()) {
      setCurrentStep(1)
      return
    }

    const stockQty = parseInt(stock, 10)
    if (isNaN(stockQty) || stockQty < 0) {
      setError('Please provide a valid initial stock quantity (0 or greater).')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Re-order images so primary is first
      const orderedImages = [...images]
      if (primaryImageIndex > 0 && primaryImageIndex < orderedImages.length) {
        const [primary] = orderedImages.splice(primaryImageIndex, 1)
        orderedImages.unshift(primary)
      }

      await createAdminProduct(token, {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        price: Number(price),
        description: description.trim() || undefined,
        categoryId: categoryId || null,
        brandId: brandId || null,
        stock: stockQty,
        sku: sku.trim() || undefined,
        images: orderedImages,
        imageUrl: orderedImages[0] || undefined,
      })

      navigate({ to: '/products' })
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
      setIsSubmitting(false)
    }
  }

  const selectedCategoryObj = categories.find((c) => c.id === categoryId)
  const selectedBrandObj = brands.find((b) => b.id === brandId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products List</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-card p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create New Product
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Step-by-step product wizard: enter core information, manage media gallery, and set initial warehouse stock.
        </p>
      </div>

      {/* Stepper Wizard Progress Tabs */}
      <div className="bg-card shadow-sm p-2 sm:p-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Step 1 Tab */}
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1 || validateStep1()) {
                setCurrentStep(1)
              }
            }}
            className={`p-3 text-left transition-all cursor-pointer flex items-center gap-3 ${
              currentStep === 1
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : currentStep > 1
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-transparent text-muted-foreground'
            }`}
          >
            <div
              className={`w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 1
                  ? 'bg-primary-foreground text-primary'
                  : currentStep > 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Step 1</div>
              <div className="font-bold truncate text-xs">Product Data</div>
            </div>
          </button>

          {/* Step 2 Tab */}
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(2)
              }
            }}
            className={`p-3 text-left transition-all cursor-pointer flex items-center gap-3 ${
              currentStep === 2
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : currentStep > 2
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-transparent text-muted-foreground'
            }`}
          >
            <div
              className={`w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 2
                  ? 'bg-primary-foreground text-primary'
                  : currentStep > 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Step 2</div>
              <div className="font-bold truncate text-xs">Images & Media</div>
            </div>
          </button>

          {/* Step 3 Tab */}
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(3)
              }
            }}
            className={`p-3 text-left transition-all cursor-pointer flex items-center gap-3 ${
              currentStep === 3
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-transparent text-muted-foreground'
            }`}
          >
            <div
              className={`w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 3
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              3
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">Step 3</div>
              <div className="font-bold truncate text-xs">Stock & Review</div>
            </div>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 1: PRODUCT DATA                                                 */}
      {/* ===================================================================== */}
      {currentStep === 1 && (
        <form onSubmit={handleNextToStep2} className="bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b-0 pb-1">
            <div>
              <h2 className="text-base font-bold text-foreground">1. Core Product Information</h2>
              <p className="text-xs text-muted-foreground">
                Define the catalog naming, pricing, categories, and descriptive specs.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5">
              Step 1 of 3
            </span>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Product Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sony WH-1000XM5 Wireless Noise-Canceling Headphones"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full h-10 px-3 bg-secondary text-xs text-foreground outline-none font-medium"
              />
            </div>

            {/* Price & Slug Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Retail Price (USD $) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="399.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-10 pl-8 pr-3 bg-secondary text-xs text-foreground font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  URL Slug (Permalink) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="sony-wh-1000xm5"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full h-10 px-3 bg-secondary text-xs font-mono text-foreground outline-none"
                />
              </div>
            </div>

            {/* Category & Brand Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Category</span>
                </label>
                <Select
                  value={categoryId || 'none'}
                  onValueChange={(val) => setCategoryId(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-10">
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
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Brand</span>
                </label>
                <Select
                  value={brandId || 'none'}
                  onValueChange={(val) => setBrandId(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-10">
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
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Product Description</label>
              <textarea
                rows={5}
                placeholder="Describe key features, technical specifications, and what's in the box..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-secondary text-xs text-foreground outline-none resize-y"
              />
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-muted/20">
            <Link
              to="/products"
              className="h-9 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium inline-flex items-center transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Next: Product Images</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* STEP 2: IMAGES & MEDIA                                                */}
      {/* ===================================================================== */}
      {currentStep === 2 && (
        <form onSubmit={handleNextToStep3} className="bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b-0 pb-1">
            <div>
              <h2 className="text-base font-bold text-foreground">2. Images & Media Gallery</h2>
              <p className="text-xs text-muted-foreground">
                Add multiple high-resolution photos. The first image will be set as primary storefront cover.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5">
              Step 2 of 3
            </span>
          </div>

          {/* Add Image URL Input */}
          <div className="space-y-3 p-4 bg-secondary/30">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Add Image by URL</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                HTTPS direct image links (JPG, PNG, WebP)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={currentImageUrl}
                onChange={(e) => setCurrentImageUrl(e.target.value)}
                className="flex-1 h-9 px-3 bg-secondary text-xs text-foreground outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddImage()}
                disabled={!currentImageUrl.trim()}
                className="h-9 px-4 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Image</span>
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Sample Photos:</span>
              </span>
              {PRESET_SAMPLE_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAddImage(preset.url)}
                  className="px-2 py-0.5 text-[10px] bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery View */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Added Gallery Images ({images.length})
              </h3>
              {images.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Click the star icon to set as Primary image.
                </span>
              )}
            </div>

            {images.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-muted/40 text-center space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <div className="text-xs font-semibold text-foreground">No images added yet</div>
                <p className="text-[11px] text-muted-foreground">
                  Paste an image link above or click one of the sample photos to test.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => {
                  const isPrimary = idx === primaryImageIndex
                  return (
                    <div
                      key={idx}
                      className={`relative group aspect-square bg-muted/20 overflow-hidden ${
                        isPrimary ? 'ring-2 ring-primary shadow-xs' : ''
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'
                        }}
                      />

                      {/* Primary Badge */}
                      {isPrimary && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider shadow-xs">
                          Primary
                        </span>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="p-1.5 bg-background text-foreground hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors cursor-pointer"
                            title="Make Primary"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-muted/20">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-9 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Product Data</span>
            </button>

            <button
              type="submit"
              className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Next: Stock & Inventory</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* STEP 3: ADDING STOCKS & FINAL REVIEW                                  */}
      {/* ===================================================================== */}
      {currentStep === 3 && (
        <form onSubmit={handleFinalSubmit} className="bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b-0 pb-1">
            <div>
              <h2 className="text-base font-bold text-foreground">3. Warehouse Stock & Final Review</h2>
              <p className="text-xs text-muted-foreground">
                Set initial available quantity, assign SKU barcode, and review your product before saving.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5">
              Step 3 of 3
            </span>
          </div>

          {/* Stock Input Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-secondary/20">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Initial Stock Quantity <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-32 h-10 px-3 bg-secondary text-sm font-bold font-mono text-foreground outline-none"
                />
                <div className="flex items-center gap-1">
                  {[0, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStock(String(preset))}
                      className={`h-8 px-2 text-[10px] font-mono transition-colors cursor-pointer ${
                        stock === String(preset)
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">SKU (Stock Keeping Unit)</label>
                <button
                  type="button"
                  onClick={generateAutoSku}
                  className="text-[10px] text-primary hover:underline font-mono"
                >
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. SNY-WH-XM5-BLK"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-10 px-3 bg-secondary text-xs font-mono text-foreground outline-none uppercase"
              />
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Overview Summary
            </h3>

            <div className="p-4 bg-secondary/30 flex flex-col sm:flex-row gap-4 items-start">
              {/* Primary Image Preview */}
              <div className="w-24 h-24 aspect-square bg-muted/30 shrink-0 overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[primaryImageIndex] || images[0]}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                  </div>
                )}
              </div>

              {/* Data Breakdown */}
              <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                <div className="text-base font-bold text-foreground">{title || 'Untitled Product'}</div>
                <div className="text-xs font-mono font-bold text-primary">
                  ${price ? Number(price).toFixed(2) : '0.00'}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Category:</span>
                    <span className="font-semibold text-foreground">
                      {selectedCategoryObj?.title || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Brand:</span>
                    <span className="font-semibold text-foreground">
                      {selectedBrandObj?.title || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Stock:</span>
                    <span className="font-semibold font-mono text-foreground">{stock} units</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">SKU:</span>
                    <span className="font-mono text-foreground">{sku || 'None'}</span>
                  </div>
                </div>

                {description && (
                  <p className="text-[11px] text-muted-foreground pt-1 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-muted/20">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="h-9 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Images</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
