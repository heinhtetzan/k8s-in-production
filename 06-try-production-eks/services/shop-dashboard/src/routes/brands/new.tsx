import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { createAdminBrand } from '../../lib/api'
import { ArrowLeft, Save, Loader2, AlertCircle, Tag, Image as ImageIcon } from 'lucide-react'

export const Route = createFileRoute('/brands/new')({
  component: NewBrandPage,
})

function NewBrandPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [image, setImage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    const auto = val
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    setSlug(auto)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !title.trim() || !slug.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      await createAdminBrand(token, {
        title: title.trim(),
        slug: slug.trim(),
        image: image.trim() || undefined,
      })
      navigate({ to: '/brands' })
    } catch (err: any) {
      setError(err.message || 'Failed to create brand')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card p-4 shadow-sm">
        <Link
          to="/brands"
          className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          title="Back to Brands"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <span>Create New Brand</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Register a partner label or manufacturer in the catalog.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Brand Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Nike, Apple, Sony"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
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
            placeholder="e.g. nike"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Logo / Brand Image URL</label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full h-9 px-3 bg-secondary text-xs text-foreground outline-none"
          />
          {image && (
            <div className="mt-2 p-2 bg-secondary/30 flex items-center gap-3">
              <div className="w-12 h-12 aspect-square bg-muted/30 overflow-hidden flex items-center justify-center">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">Image preview</span>
            </div>
          )}
        </div>

        <div className="pt-3 flex items-center justify-end gap-2">
          <Link
            to="/brands"
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Create Brand</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
