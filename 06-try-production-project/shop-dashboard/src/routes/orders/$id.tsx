import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import {
  fetchAdminOrderById,
  updateAdminOrderStatus,
  deleteAdminOrder,
  type Order,
} from '../../lib/api'
import {
  ArrowLeft,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Loader2,
  AlertCircle,
  Trash2,
  MapPin,
  Mail,
  User,
  Phone,
  CreditCard,
  Package,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

export const Route = createFileRoute('/orders/$id')({
  component: OrderDetailPage,
})

const STATUS_LIST: Order['status'][] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

function OrderDetailPage() {
  const { id } = useParams({ from: '/orders/$id' })
  const { token } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<Order['status']>('pending')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadOrder = async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminOrderById(token, id)
      setOrder(data)
      setSelectedStatus(data.status)
    } catch (err: any) {
      setError(err.message || 'Failed to load order')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id, token])

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!token || !order || newStatus === order.status) return
    setIsUpdatingStatus(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const updated = await updateAdminOrderStatus(token, order.id, newStatus)
      setOrder(updated)
      setSelectedStatus(updated.status)
      setSuccessMessage(`Order status updated to "${newStatus}"`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update order status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !order) return
    if (!confirm(`Are you sure you want to permanently delete order ${order.orderNumber}?`)) {
      return
    }
    setIsDeleting(true)
    try {
      await deleteAdminOrder(token, order.id)
      navigate({ to: '/orders' })
    } catch (err: any) {
      alert(err.message || 'Failed to delete order')
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase bg-secondary text-secondary-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase bg-primary/20 text-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Processing</span>
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase bg-secondary text-secondary-foreground">
            <Truck className="w-3.5 h-3.5" />
            <span>Shipped</span>
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase bg-primary text-primary-foreground">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase bg-destructive/20 text-destructive">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold uppercase bg-secondary text-secondary-foreground">
            {status}
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs">Loading order invoice...</p>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders List</span>
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            title="Back to Orders List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-mono font-bold tracking-tight text-foreground">
                {order.orderNumber}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Change Status:</span>
            <Select
              value={order.status}
              disabled={isUpdatingStatus}
              onValueChange={(val) => handleStatusChange(val as Order['status'])}
            >
              <SelectTrigger size="sm" className="w-36 h-8 font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_LIST.map((st) => (
                  <SelectItem key={st} value={st} className="uppercase font-semibold text-xs">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdatingStatus && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 px-3 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-card shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b-0 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span>Purchased Items ({order.items?.length || 0})</span>
              </h2>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {order.items?.map((item) => {
                  const lineTotal = Number(item.productPrice) * item.quantity
                  return (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-12 h-12 aspect-square bg-muted/20 shrink-0 overflow-hidden">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground line-clamp-1">
                            {item.productTitle}
                          </div>
                          {item.productId && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                              ID: {item.productId.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-medium text-foreground">
                        ${Number(item.productPrice).toFixed(2)}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        ${lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Total Calculation Footer */}
            <div className="p-4 bg-muted/10 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">
                  ${Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping:</span>
                <span className="text-foreground uppercase font-semibold">Free Delivery</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-muted/20 text-foreground">
                <span>Total Amount:</span>
                <span className="font-mono text-base text-primary">
                  ${Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {order.notes && (
            <div className="bg-card p-4 shadow-sm space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer Instructions / Notes
              </h3>
              <p className="text-xs text-foreground bg-secondary/30 p-3 italic">
                "{order.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Customer & Delivery Details */}
        <div className="space-y-6">
          {/* Customer Information Card */}
          <div className="bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Customer Information</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Name</div>
                  <div className="font-semibold text-foreground">{order.customerName}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Email</div>
                  <div className="text-foreground">{order.customerEmail}</div>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Phone</div>
                    <div className="text-foreground font-mono">{order.customerPhone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping & Delivery Address Card */}
          <div className="bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Shipping Address</span>
            </h2>

            <div className="p-3 bg-secondary/30 text-xs text-foreground leading-relaxed">
              {order.shippingAddress}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Payment Details</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 bg-secondary/30 px-2.5">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-semibold text-foreground capitalize">
                  {order.paymentMethod.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1 bg-secondary/30 px-2.5">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-mono uppercase font-semibold text-foreground">
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
