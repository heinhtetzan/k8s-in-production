import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminBrands,
  deleteAdminBrand,
  type Brand,
} from '../../lib/api'
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { TableRowSkeleton } from '../../components/StatCardSkeleton'

export const Route = createFileRoute('/brands/')({
  head: () => ({
    meta: [
      {
        title: "Brand Partners & Labels | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Manage manufacturer brands, partner logos, and product association profiles.',
      },
    ],
  }),
  component: BrandsListPage,
})

function BrandsListPage() {
  const { token } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadBrands = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBrands(token)
      setBrands(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load brands')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
  }, [token])

  const handleDelete = async (id: string, title: string) => {
    if (!token || !confirm(`Permanently delete brand "${title}"?`)) return
    try {
      await deleteAdminBrand(token, id)
      setBrands((prev) => prev.filter((b) => b.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand')
    }
  }

  const filtered = brands.filter((b) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return b.title.toLowerCase().includes(term) || b.slug.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Brands Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage manufacturer logos, partner brands, and supplier affiliations.
          </p>
        </div>

        <Link
          to="/brands/new"
          className="h-8 px-3.5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Brand</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 shadow-sm">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search brands by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 pr-3 bg-secondary text-xs text-foreground outline-none w-64"
          />
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Total: {brands.length} brands
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
                <th className="p-3">Logo</th>
                <th className="p-3">Brand Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Linked Products</th>
                <th className="p-3">Created Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              <TableRowSkeleton cols={6} rows={6} />
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card p-12 text-center space-y-2 shadow-sm">
          <Tag className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No brands found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search criteria or add one.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Logo</th>
                <th className="p-3">Brand Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Linked Products</th>
                <th className="p-3">Created Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-muted/10">
                  <td className="p-3">
                    <div className="w-10 h-10 aspect-square bg-muted/20 overflow-hidden flex items-center justify-center">
                      {b.image ? (
                        <img src={b.image} alt={b.title} className="w-full h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link
                      to="/brands/$id/edit"
                      params={{ id: b.id }}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {b.title}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-muted-foreground">{b.slug}</td>
                  <td className="p-3">
                    <span className="font-semibold text-foreground">
                      {b.productsCount ?? 0}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <Link
                      to="/brands/$id/edit"
                      params={{ id: b.id }}
                      className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id, b.title)}
                      className="p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete brand"
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
