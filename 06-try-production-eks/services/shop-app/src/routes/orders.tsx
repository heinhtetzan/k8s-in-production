import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { fetchCustomerOrders, cancelCustomerOrder, type Order } from '../lib/api'
import {
  PackageCheck,
  MapPin,
  CreditCard,
  ShoppingBag,
  Loader2,
  ChevronRight,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Skeleton } from '../components/ui/skeleton'

export const Route = createFileRoute('/orders')({
  head: () => ({
    meta: [
      {
        title: "My Orders | Kendrick's Shop",
      },
      {
        name: 'description',
        content:
          "Track order fulfillment, view delivery status, and review previous order receipts on Kendrick's Shop.",
      },
    ],
  }),
  component: CustomerOrdersPage,
})

function CustomerOrdersPage() {
  const { token, isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    async function loadOrders() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetchCustomerOrders(token!)
        setOrders(res.orders || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [token])

  const handleCancelOrder = async (orderId: string) => {
    if (!token || !confirm('Are you sure you want to cancel this order?')) return

    setCancellingOrderId(orderId)
    try {
      await cancelCustomerOrder(token, orderId)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      )
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-foreground text-background">
            Delivered
          </span>
        )
      case 'shipped':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground">
            Shipped
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground">
            Processing
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-destructive/20 text-destructive">
            Cancelled
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">
            Pending
          </span>
        )
    }
  }

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs font-medium text-muted-foreground">Authenticating session...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
          <PackageCheck className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Sign In to View Your Orders</h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Please log in with your customer account to view your order history and live shipment status.
          </p>
        </div>
        <button
          type="button"
          onClick={openAuthModal}
          className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <span>Sign In / Register</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">
          Store
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">My Orders</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-0 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Order History</h1>
          <p className="text-xs text-muted-foreground">
            Manage your purchases, track fulfillment, or cancel pending requests.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground self-start sm:self-auto">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card text-card-foreground border border-border/70 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>

              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
                <Skeleton className="h-6 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Could not load orders</span>
          </div>
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-card text-card-foreground shadow-sm space-y-4">
          <div className="w-14 h-14 bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground">No orders found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven't placed any orders yet. Discover our premium products and start shopping today.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 h-8 px-4 bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            const formattedTotal = Number(order.totalAmount).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })

            return (
              <div
                key={order.id}
                className="bg-card text-card-foreground shadow-sm overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Order Number
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-muted" />

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Placed On
                      </span>
                      <span className="text-muted-foreground">{formattedDate}</span>
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-muted" />

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Total
                      </span>
                      <span className="font-bold text-foreground">{formattedTotal}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}

                    {order.status === 'pending' && (
                      <button
                        type="button"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-2 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors cursor-pointer"
                        title="Cancel this pending order"
                      >
                        {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3">
                  <div className="divide-y-0 space-y-2.5">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-1 text-xs"
                      >
                        <div className="w-14 h-14 aspect-square bg-muted/20 shrink-0 overflow-hidden">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground line-clamp-1">
                            {item.productTitle}
                          </h4>
                          <p className="text-muted-foreground mt-0.5">
                            Qty: <strong className="text-foreground">{item.quantity}</strong> ×{' '}
                            {Number(item.productPrice).toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            })}
                          </p>
                        </div>

                        <div className="text-right font-bold text-foreground">
                          {(Number(item.productPrice) * item.quantity).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping & Payment Meta */}
                  <div className="pt-3 border-t border-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate max-w-md">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-foreground" />
                      <span className="truncate">
                        <strong>Delivery:</strong> {order.shippingAddress}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 shrink-0 text-foreground" />
                      <span className="uppercase text-[11px] font-medium">
                        Payment: {order.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
