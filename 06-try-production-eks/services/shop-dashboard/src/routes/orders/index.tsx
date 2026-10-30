import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminOrders,
  fetchDashboardMetrics,
  type Order,
} from '../../lib/api'
import {
  ShoppingCart,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  Filter,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { TableRowSkeleton } from '../../components/StatCardSkeleton'
import { Skeleton } from '../../components/ui/skeleton'

export const Route = createFileRoute('/orders/')({
  head: () => ({
    meta: [
      {
        title: "Orders Fulfillment Management | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Monitor customer orders, fulfillment statuses, shipments, payments, and order tracking.',
      },
    ],
  }),
  component: OrdersListPage,
})

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

function OrdersListPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [metrics, setMetrics] = useState<{ totalOrders: number; totalRevenue: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const loadData = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const [ordersRes, metricsRes] = await Promise.all([
        fetchAdminOrders(token, {
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: searchTerm || undefined,
        }),
        fetchDashboardMetrics(token).catch(() => null),
      ])
      setOrders(ordersRes.orders || [])
      if (metricsRes) setMetrics(metricsRes)
    } catch (err: any) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token, selectedStatus])

  // Simple client-side search filtering if API already fetched
  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.customerEmail.toLowerCase().includes(term) ||
      (o.shippingAddress && o.shippingAddress.toLowerCase().includes(term))
    )
  })

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-secondary text-secondary-foreground">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-primary/20 text-foreground">
            <RotateCcw className="w-3 h-3" />
            <span>Processing</span>
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-secondary text-secondary-foreground">
            <Truck className="w-3 h-3" />
            <span>Shipped</span>
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-primary text-primary-foreground">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase bg-destructive/20 text-destructive">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-secondary text-secondary-foreground">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Orders Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor customer orders, fulfillment statuses, shipments, and customer payments.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="bg-secondary/40 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Orders:</span>
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="bg-secondary/40 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Revenue:</span>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : metrics ? (
          <div className="flex items-center gap-3">
            <div className="bg-secondary/40 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Orders:</span>
              <span className="text-xs font-bold text-foreground">{metrics.totalOrders}</span>
            </div>
            <div className="bg-secondary/40 px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Revenue:</span>
              <span className="text-xs font-bold text-foreground font-mono">
                ${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order #, customer, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 bg-secondary text-xs text-foreground outline-none w-56 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger size="sm" className="w-36 h-8">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="h-8 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              <TableRowSkeleton cols={8} rows={8} />
            </tbody>
          </table>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card p-12 text-center space-y-2 shadow-sm">
          <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No orders found</h3>
          <p className="text-xs text-muted-foreground">
            {searchTerm || selectedStatus !== 'all'
              ? 'Try modifying your search query or status filter.'
              : 'There are no customer orders placed yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/20">
              {filteredOrders.map((order) => {
                const totalItemCount =
                  order.items?.reduce((sum, it) => sum + it.quantity, 0) || 0

                return (
                  <tr key={order.id} className="hover:bg-muted/10">
                    <td className="p-3">
                      <Link
                        to="/orders/$id"
                        params={{ id: order.id }}
                        className="font-mono font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{order.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{order.customerEmail}</div>
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3">
                      <div className="capitalize text-muted-foreground font-medium">
                        {order.paymentMethod.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">
                        {order.paymentStatus}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to="/orders/$id"
                        params={{ id: order.id }}
                        className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
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
