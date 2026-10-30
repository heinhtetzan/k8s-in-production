import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import {
  fetchDashboardMetrics,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminStocks,
  fetchAdminUsers,
  fetchAdminCategories,
  fetchAdminBrands,
  type Order,
  type Product,
  type Stock,
} from '../lib/api'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Tag,
  Boxes,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
} from 'lucide-react'
import {
  KpiCardSkeleton,
  QuickStatCardSkeleton,
  TableRowSkeleton,
} from '../components/StatCardSkeleton'
import { Skeleton } from '../components/ui/skeleton'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: "Overview & Analytics | Admin Portal",
      },
      {
        name: 'description',
        content:
          'Store performance overview, live revenue metrics, recent customer orders, and low-inventory alerts.',
      },
    ],
  }),
  component: DashboardOverviewPage,
})

function DashboardOverviewPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  const [metrics, setMetrics] = useState<{
    totalOrders: number
    totalRevenue: number
    byStatus: Array<{ status: string; count: number }>
  } | null>(null)

  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStocks, setLowStocks] = useState<any[]>([])
  const [counts, setCounts] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    users: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthLoading, isAuthenticated, navigate])

  const loadOverviewData = async () => {
    const token = localStorage.getItem('shop_admin_token')
    if (!token) return

    setIsLoading(true)
    setError(null)
    try {
      const [
        metricsRes,
        ordersRes,
        prodsRes,
        stocksRes,
        catsRes,
        brandsRes,
        usersRes,
      ] = await Promise.all([
        fetchDashboardMetrics(token).catch(() => ({ totalOrders: 0, totalRevenue: 0, byStatus: [] })),
        fetchAdminOrders(token, { limit: 6 }).catch(() => ({ orders: [], total: 0, totalPages: 0 })),
        fetchAdminProducts(token).catch(() => []),
        fetchAdminStocks(token).catch(() => []),
        fetchAdminCategories(token).catch(() => []),
        fetchAdminBrands(token).catch(() => []),
        fetchAdminUsers(token).catch(() => []),
      ])

      setMetrics(metricsRes)
      setRecentOrders(ordersRes.orders || [])
      setCounts({
        products: prodsRes.length,
        categories: catsRes.length,
        brands: brandsRes.length,
        users: usersRes.length,
      })

      // Filter low or out of stock items
      const alerts = stocksRes.filter((s: any) => s.quantity <= 10).slice(0, 5)
      setLowStocks(alerts)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard overview')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadOverviewData()
    }
  }, [isAuthenticated])

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

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs">Loading admin session...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Store Performance Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>. Here is the operational summary of your shop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/products/new"
            className="h-8 px-3.5 bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            {/* Total Revenue */}
            <div className="bg-card/90 border border-border/70 rounded-xl p-5 shadow-xs hover:border-primary/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Revenue
                </span>
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                ${(metrics?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-muted-foreground">Cumulative customer gross sales</p>
            </div>

            {/* Total Orders */}
            <div className="bg-card/90 border border-border/70 rounded-xl p-5 shadow-xs hover:border-primary/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Orders Placed
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metrics?.totalOrders || 0}
              </div>
              <Link
                to="/orders"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Manage orders</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Active Products */}
            <div className="bg-card/90 border border-border/70 rounded-xl p-5 shadow-xs hover:border-primary/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Products
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{counts.products}</div>
              <Link
                to="/products"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Catalog items</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Registered Accounts */}
            <div className="bg-card/90 border border-border/70 rounded-xl p-5 shadow-xs hover:border-primary/40 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Users & Admins
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{counts.users}</div>
              <Link
                to="/users"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Manage accounts</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Module Quick Nav Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/orders"
          className="bg-card/90 border border-border/70 rounded-xl p-4 shadow-xs hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <ShoppingCart className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground">Orders</span>
          <span className="text-[10px] text-muted-foreground">Full CRUD</span>
        </Link>

        <Link
          to="/products"
          className="bg-card/90 border border-border/70 rounded-xl p-4 shadow-xs hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <Package className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground">Products</span>
          <span className="text-[10px] text-muted-foreground">Full CRUD</span>
        </Link>

        <Link
          to="/categories"
          className="bg-card/90 border border-border/70 rounded-xl p-4 shadow-xs hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <Layers className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground">Categories</span>
          <span className="text-[10px] text-muted-foreground">Full CRUD</span>
        </Link>

        <Link
          to="/brands"
          className="bg-card/90 border border-border/70 rounded-xl p-4 shadow-xs hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <Tag className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground">Brands</span>
          <span className="text-[10px] text-muted-foreground">Full CRUD</span>
        </Link>

        <Link
          to="/stocks"
          className="bg-card/90 border border-border/70 rounded-xl p-4 shadow-xs hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <Boxes className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground">Inventory</span>
          <span className="text-[10px] text-muted-foreground">Stock control</span>
        </Link>

        <Link
          to="/users"
          className="bg-card/90 border border-border/70 rounded-xl p-4 shadow-xs hover:border-primary/40 hover:bg-secondary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
        >
          <Users className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-foreground">Users</span>
          <span className="text-[10px] text-muted-foreground">Full CRUD</span>
        </Link>
      </div>

      {/* Main Grid: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card/90 border border-border/70 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-muted/20 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Recent Orders
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Latest customer purchases requiring fulfillment
                </p>
              </div>
              <Link
                to="/orders"
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/20">
                  <TableRowSkeleton cols={5} rows={5} />
                </tbody>
              </table>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No orders placed yet.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/20">
                  {recentOrders.map((order) => (
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
                      <td className="p-3 font-mono font-bold text-foreground">
                        ${Number(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                      <td className="p-3 text-right">
                        <Link
                          to="/orders/$id"
                          params={{ id: order.id }}
                          className="px-2 py-0.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium inline-flex items-center gap-0.5 transition-colors"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Inventory & Catalog Stats (1 Col) */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-card/90 border border-border/70 rounded-xl shadow-xs p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span>Inventory Alerts</span>
              </h2>
              <Link
                to="/stocks"
                className="text-[10px] text-primary hover:underline font-semibold"
              >
                All Stocks
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-secondary/30 flex items-center justify-between text-xs rounded"
                  >
                    <div className="min-w-0 pr-2 space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lowStocks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                All tracked inventory levels are healthy (&gt;10 units).
              </p>
            ) : (
              <div className="space-y-2">
                {lowStocks.map((s) => (
                  <div
                    key={s.id || s.productId}
                    className="p-2.5 bg-secondary/30 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-foreground truncate">
                        {s.product?.title || s.productTitle || 'Product'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        SKU: {s.sku || s.product?.sku || 'None'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold ${
                          s.quantity <= 0
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {s.quantity} left
                      </span>
                      <Link
                        to="/stocks/$productId"
                        params={{ productId: s.productId }}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Adjust
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Structure Stats */}
          <div className="bg-card shadow-sm p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Catalog Structure
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 bg-secondary/30 px-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-bold text-foreground">{counts.categories}</span>
                  )}
                  <Link to="/categories" className="text-[10px] text-primary font-bold hover:underline">
                    Manage
                  </Link>
                </div>
              </div>

              <div className="flex justify-between items-center py-1.5 bg-secondary/30 px-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Brands</span>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="font-bold text-foreground">{counts.brands}</span>
                  )}
                  <Link to="/brands" className="text-[10px] text-primary font-bold hover:underline">
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
