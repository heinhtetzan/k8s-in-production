import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminCategories,
  deleteAdminCategory,
  type Category,
} from '../../lib/api'
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  FolderTree,
} from 'lucide-react'
import { TableRowSkeleton } from '../../components/StatCardSkeleton'

export const Route = createFileRoute('/categories/')({
  head: () => ({
    meta: [
      {
        title: "Category Taxonomies | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Organize product categories, manage hierarchy, and configure SEO-friendly slug paths.',
      },
    ],
  }),
  component: CategoriesListPage,
})

function CategoriesListPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadCategories = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminCategories(token)
      setCategories(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [token])

  const handleDelete = async (id: string, title: string) => {
    if (!token || !confirm(`Permanently delete category "${title}"?`)) return
    try {
      await deleteAdminCategory(token, id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete category')
    }
  }

  const filtered = categories.filter((c) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return c.title.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Categories Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Organize catalog products into hierarchical departments and collections.
          </p>
        </div>

        <Link
          to="/categories/new"
          className="h-8 px-3.5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 shadow-sm">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 pr-3 bg-secondary text-xs text-foreground outline-none w-64"
          >
          </input>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Total: {categories.length} categories
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      {isLoading ? (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Category Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Linked Products</th>
                <th className="p-3">Created Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              <TableRowSkeleton cols={5} rows={6} />
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card p-12 text-center space-y-2 shadow-sm">
          <FolderTree className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No categories found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search criteria or add one.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Category Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Linked Products</th>
                <th className="p-3">Created Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/10">
                  <td className="p-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-secondary flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <Link
                      to="/categories/$id/edit"
                      params={{ id: cat.id }}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {cat.title}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{cat.slug}</td>
                  <td className="p-3">
                    <span className="font-semibold text-foreground">
                      {cat.productsCount ?? 0}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <Link
                      to="/categories/$id/edit"
                      params={{ id: cat.id }}
                      className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.title)}
                      className="p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
