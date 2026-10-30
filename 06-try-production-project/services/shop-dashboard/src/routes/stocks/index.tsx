import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { fetchAdminStocks, type Stock } from '../../lib/api'
import {
  Boxes,
  Search,
  Edit2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { TableRowSkeleton } from '../../components/StatCardSkeleton'

export const Route = createFileRoute('/stocks/')({
  head: () => ({
    meta: [
      {
        title: "Inventory Stock Control | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Monitor warehouse inventory levels, stock quantities, out-of-stock items, and threshold adjustments.',
      },
    ],
  }),
  component: StocksListPage,
})

function StocksListPage() {
  const { token } = useAuth()
  const [stocks, setStocks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all')

  const loadStocks = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminStocks(token)
      setStocks(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory stock levels')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStocks()
  }, [token])

  const filtered = stocks.filter((s) => {
    const productTitle = s.product?.title || s.productTitle || ''
    const sku = s.sku || s.product?.sku || ''

    const matchSearch =
      !searchTerm ||
      productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase())

    let matchStatus = true
    if (statusFilter === 'out') {
      matchStatus = s.quantity <= 0
    } else if (statusFilter === 'low') {
      matchStatus = s.quantity > 0 && s.quantity <= 10
    } else if (statusFilter === 'in_stock') {
      matchStatus = s.quantity > 10
    }

    return matchSearch && matchStatus
  })

  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-destructive/20 text-destructive">
          <XCircle className="w-3 h-3" />
          <span>Out of Stock</span>
        </span>
      )
    }
    if (quantity <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-secondary text-secondary-foreground">
          <AlertTriangle className="w-3 h-3" />
          <span>Low Stock ({quantity})</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase bg-primary/20 text-foreground">
        <CheckCircle2 className="w-3 h-3" />
        <span>In Stock ({quantity})</span>
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            <span>Inventory & Stock Management</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor real-time product quantities, track low inventory levels, and manage SKUs.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStocks}
          className="h-8 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium cursor-pointer"
        >
          Refresh Stock
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product title or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 bg-secondary text-xs text-foreground outline-none w-56 sm:w-64"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as any)}
          >
            <SelectTrigger size="sm" className="w-44 h-8">
              <SelectValue placeholder="All Stock Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Statuses</SelectItem>
              <SelectItem value="in_stock">Healthy Stock (&gt;10)</SelectItem>
              <SelectItem value="low">Low Stock (1-10)</SelectItem>
              <SelectItem value="out">Out of Stock (0)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          Total: {stocks.length} tracked items
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
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Current Quantity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              <TableRowSkeleton cols={6} rows={8} />
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card p-12 text-center space-y-2 shadow-sm">
          <Boxes className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No stock records found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your search criteria or status filter.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Current Quantity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              {filtered.map((s) => {
                const prodTitle = s.product?.title || s.productTitle || 'Unknown Product'
                const sku = s.sku || s.product?.sku || '—'
                return (
                  <tr key={s.id || s.productId} className="hover:bg-muted/10">
                    <td className="p-3 flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-secondary flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <Link
                          to="/stocks/$productId"
                          params={{ productId: s.productId }}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {prodTitle}
                        </Link>
                        {s.product?.slug && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {s.product.slug}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground">{sku}</td>
                    <td className="p-3 font-bold font-mono text-sm text-foreground">
                      {s.quantity}
                    </td>
                    <td className="p-3">{getStockBadge(s.quantity)}</td>
                    <td className="p-3 text-muted-foreground">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to="/stocks/$productId"
                        params={{ productId: s.productId }}
                        className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Update</span>
                      </Link>
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
