import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminCategoryById,
  updateAdminCategory,
  type Category,
} from '../../lib/api'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Layers,
  CheckCircle2,
} from 'lucide-react'

export const Route = createFileRoute('/categories/$id/edit')({
  component: EditCategoryPage,
})

function EditCategoryPage() {
  const { id } = useParams({ from: '/categories/$id/edit' })
  const { token } = useAuth()
  const navigate = useNavigate()

  const [category, setCategory] = useState<Category | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadData = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminCategoryById(token, id)
      setCategory(data)
      setTitle(data.title || '')
      setSlug(data.slug || '')
    } catch (err: any) {
      setError(err.message || 'Failed to load category')
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
      const updated = await updateAdminCategory(token, id, {
        title: title.trim(),
        slug: slug.trim(),
      })
      setCategory(updated)
      setSuccessMessage('Category updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update category')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs">Loading category...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card p-4 shadow-sm">
        <Link
          to="/categories"
          className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          title="Back to Categories"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Edit Category</span>
            <span className="text-xs font-mono font-normal text-muted-foreground">({category?.slug})</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Update category title or permalink slug.
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
      <form onSubmit={handleSubmit} className="bg-card p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Category Name <span className="text-destructive">*</span>
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

        <div className="pt-3 flex items-center justify-end gap-2">
          <Link
            to="/categories"
            className="h-9 px-4 bg-secondary text-secondary-foreground text-xs font-medium inline-flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            Back to List
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
  )
}
