import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCart } from '../lib/cart-context'
import { useAuth } from '../lib/auth-context'
import { createCustomerOrder, type Order } from '../lib/api'
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  CreditCard,
  MapPin,
  Phone,
  FileText,
} from 'lucide-react'

export function CartSheet() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
    isCartOpen,
    closeCart,
  } = useCart()

  const { user, token, isAuthenticated, openAuthModal } = useAuth()
  const navigate = useNavigate()

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  // Checkout form fields
  const [shippingAddress, setShippingAddress] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash_on_delivery' | 'bank_transfer'>('card')
  const [notes, setNotes] = useState('')

  if (!isCartOpen) return null

  const formattedTotal = totalPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const handleStartCheckout = () => {
    if (!isAuthenticated) {
      openAuthModal()
      return
    }
    setCheckoutError(null)
    setIsCheckingOut(true)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      openAuthModal()
      return
    }

    if (!shippingAddress.trim()) {
      setCheckoutError('Please provide a valid delivery address')
      return
    }

    setIsSubmitting(true)
    setCheckoutError(null)

    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
        })),
        shippingAddress: shippingAddress.trim(),
        customerName: user?.name,
        customerEmail: user?.email,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      }

      const res = await createCustomerOrder(token, orderPayload)
      setConfirmedOrder(res.order)
      clearCart()
      setIsCheckingOut(false)
    } catch (err: any) {
      setCheckoutError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseAndReset = () => {
    closeCart()
    setIsCheckingOut(false)
    setConfirmedOrder(null)
    setCheckoutError(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop - Off (Transparent click-outside dismiss, no dimming or blur) */}
      <div
        className="fixed inset-0 bg-transparent"
        onClick={handleCloseAndReset}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="relative z-50 w-full max-w-md bg-card text-card-foreground border-l border-border/70 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm tracking-tight text-foreground">
              {confirmedOrder
                ? 'Order Confirmed'
                : isCheckingOut
                ? 'Checkout'
                : "Kendrick's Shop Cart"}
            </h2>
            {!confirmedOrder && !isCheckingOut && (
              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.2 font-semibold">
                {totalItems}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseAndReset}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Confirmed Order Success State */}
        {confirmedOrder ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 bg-secondary text-foreground flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">Order Successfully Placed!</h3>
              <p className="text-xs font-mono font-semibold text-primary">
                {confirmedOrder.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs pt-1">
                Thank you, {confirmedOrder.customerName}. We have received your order for{' '}
                <strong className="text-foreground">
                  {Number(confirmedOrder.totalAmount).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </strong>
                .
              </p>
            </div>

            <div className="w-full bg-muted/20 p-3 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Status:</span>
                <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-secondary">
                  {confirmedOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery to:</span>
                <span className="text-foreground font-medium text-right truncate max-w-[200px]">
                  {confirmedOrder.shippingAddress}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Items:</span>
                <span className="text-foreground font-medium">
                  {confirmedOrder.items?.length || 0} product(s)
                </span>
              </div>
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleCloseAndReset()
                  navigate({ to: '/orders' })
                }}
                className="w-full h-9 bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <span>View My Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCloseAndReset}
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : isCheckingOut ? (
          /* 2. Checkout Form State */
          <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <button
                type="button"
                onClick={() => setIsCheckingOut(false)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Cart Review</span>
              </button>

              {checkoutError && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs">
                  {checkoutError}
                </div>
              )}

              {/* Customer Contact */}
              <div className="space-y-3 bg-muted/15 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-foreground font-medium">{user?.name}</div>
                  <div className="text-muted-foreground">{user?.email}</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 text-primary" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-8.5 px-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-2 bg-muted/20 p-3.5 rounded-xl border border-border/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Delivery Address</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Street address, apartment/unit, city, postal code"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 resize-none transition-all"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2 bg-muted/20 p-3.5 rounded-xl border border-border/50">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span>Payment Method</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'card', label: 'Card' },
                    { id: 'cash_on_delivery', label: 'Cash on Deliv.' },
                    { id: 'bank_transfer', label: 'Bank Transfer' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`h-8 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                        paymentMethod === method.id
                          ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                          : 'bg-secondary/70 border-border/60 hover:bg-secondary text-foreground'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div className="space-y-1.5 bg-muted/20 p-3.5 rounded-xl border border-border/50">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-primary" />
                  <span>Notes / Delivery Instructions</span>
                </label>
                <input
                  type="text"
                  placeholder="Optional delivery instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-8.5 px-3 bg-secondary/60 rounded-lg border border-border/70 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Checkout Footer */}
            <div className="p-4 bg-muted/20 space-y-3 border-t border-border/50">
              <div className="flex justify-between text-sm font-bold text-foreground">
                <span>Amount to Pay</span>
                <span>{formattedTotal}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-9.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : items.length === 0 ? (
          /* 3. Empty Cart State */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-muted/40 text-muted-foreground flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">Your cart is empty</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Explore our catalog to find premium smartphones, laptops, audio gear, and more.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="inline-flex items-center gap-1.5 h-8 px-4 bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* 4. Cart Items List Review State */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y-0">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted/20 flex gap-3 items-center group transition-all hover:bg-muted/30 rounded-xl border border-border/50 shadow-xs"
                >
                  {/* Thumbnail - Full Square */}
                  <div className="w-16 h-16 aspect-square bg-muted/30 shrink-0 overflow-hidden rounded-lg border border-border/40">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {Number(item.price).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center bg-secondary/80 rounded-lg border border-border/60 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId || item.id, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center hover:bg-secondary text-secondary-foreground transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-secondary-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId || item.id, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center hover:bg-secondary text-secondary-foreground transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId || item.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-md"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="p-4 bg-muted/20 space-y-3 border-t border-border/50">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">{formattedTotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-foreground font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-1.5">
                  <span>Total</span>
                  <span>{formattedTotal}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  className="w-full h-9.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                >
                  <span>{isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    Clear Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseAndReset}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
