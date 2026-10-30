import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminProducts,
  deleteAdminProduct,
  fetchAdminCategories,
  fetchAdminBrands,
  type Product,
  type Category,
  type Brand,
} from '../../lib/api'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { TableRowSkeleton } from '../../components/StatCardSkeleton'

export const Route = createFileRoute('/products/')({
  head: () => ({
    meta: [
      {
        title: "Product Catalog Management | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Manage products, edit pricing, update categories and brands, and monitor stock levels.',
      },
    ],
  }),
  component: ProductsListPage,
})

function ProductsListPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')

  const loadProducts = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const [prods, cats, brs] = await Promise.all([
        fetchAdminProducts(token),
        fetchAdminCategories(token),
        fetchAdminBrands(token),
      ])
      setProducts(prods)
      setCategories(cats)
      setBrands(brs)
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [token])

  const handleDelete = async (id: string, title: string) => {
    if (!token || !confirm(`Permanently delete "${title}"?`)) return
    try {
      await deleteAdminProduct(token, id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete product')
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchCategory =
      selectedCategory === 'all' || p.categoryId === selectedCategory
    const matchBrand = selectedBrand === 'all' || p.brandId === selectedBrand

    return matchSearch && matchCategory && matchBrand
  })

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Products Catalog
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your store's inventory, pricing, categorization, and media.
          </p>
        </div>

        <Link
          to="/products/new"
          className="h-8 px-3.5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, slug, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 bg-secondary text-xs text-foreground outline-none w-56 sm:w-64"
            />
          </div>

          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger size="sm" className="w-40 h-8">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedBrand}
            onValueChange={setSelectedBrand}
          >
            <SelectTrigger size="sm" className="w-36 h-8">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-muted-foreground">
          Showing <strong>{filtered.length}</strong> of {products.length} products
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              <TableRowSkeleton cols={6} rows={8} />
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-card shadow-sm space-y-3">
          <Package className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">No products found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              {filtered.map((p) => {
                const img = p.primary_image || p.images?.[0]?.url
                const stockQty = p.stock?.quantity ?? 0
                return (
                  <tr key={p.id} className="hover:bg-muted/10">
                    <td className="p-3 flex items-center gap-3">
                      <div className="w-12 h-12 aspect-square bg-muted/20 shrink-0 overflow-hidden">
                        {img ? (
                          <img src={img} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to="/products/$id/edit"
                          params={{ id: p.id }}
                          className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {p.title}
                        </Link>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {p.sku || p.slug}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.category?.title || '—'}</td>
                    <td className="p-3 text-muted-foreground">{p.brand?.title || '—'}</td>
                    <td className="p-3 font-bold text-foreground">
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-semibold px-2 py-0.5 text-[10px] uppercase ${
                          stockQty <= 0
                            ? 'bg-destructive/20 text-destructive'
                            : stockQty < 10
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-primary/20 text-foreground'
                        }`}
                      >
                        {stockQty} in stock
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Link
                        to="/products/$id/edit"
                        params={{ id: p.id }}
                        className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.title)}
                        className="p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
