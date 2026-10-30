import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { useCart } from '../lib/cart-context'
import {
  ShoppingBag,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  PackageCheck,
} from 'lucide-react'

export function Navbar() {
  const { user, isAuthenticated, signOut, openAuthModal } = useAuth()
  const { totalItems, openCart } = useCart()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-base tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-semibold">Kendrick's Shop</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 text-xs font-medium">
            <Link
              to="/"
              activeProps={{ className: 'bg-primary/15 text-primary font-semibold' }}
              inactiveProps={{
                className: 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
              }}
              className="px-3 py-1.5 rounded-md transition-colors"
            >
              Storefront
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/orders"
                  activeProps={{ className: 'bg-primary/15 text-primary font-semibold' }}
                  inactiveProps={{
                    className: 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  }}
                  className="px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>My Orders</span>
                </Link>

                <Link
                  to="/dashboard"
                  activeProps={{ className: 'bg-primary/15 text-primary font-semibold' }}
                  inactiveProps={{
                    className: 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  }}
                  className="px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                  {user?.type === 'shop' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold uppercase">
                      Shop
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Actions: Cart & Auth */}
        <div className="flex items-center gap-2.5">
          {/* Cart Icon Button with Count Badge */}
          <button
            type="button"
            onClick={openCart}
            className="relative h-8 px-3 rounded-lg border border-border/60 bg-secondary/80 hover:bg-secondary text-secondary-foreground flex items-center gap-2 transition-all cursor-pointer text-xs font-medium hover:border-primary/40 shadow-xs"
            title="View cart"
            aria-label="View shopping cart"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cart</span>
            <span
              className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full text-[10px] font-bold ${
                totalItems > 0
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {totalItems}
            </span>
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-border/60 bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-all cursor-pointer text-xs hover:border-primary/40 shadow-xs"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium text-foreground leading-tight">
                    {user.name}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-52 bg-popover text-popover-foreground rounded-xl border border-border/70 shadow-xl py-1.5 z-50">
                    <div className="px-3 py-2 bg-muted/30 border-b border-border/40">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1 py-0.2 text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase">
                        {user.type === 'shop' ? 'Shop Admin' : 'Customer'}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>User Dashboard</span>
                      </Link>

                      {user.type === 'shop' && (
                        <a
                          href={
                            typeof window !== 'undefined' && window.location.hostname.includes('kendrickdev.shop')
                              ? 'https://dashboard.kendrickdev.shop'
                              : 'http://localhost:9002'
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>Shop Portal</span>
                        </a>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false)
                          signOut()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center h-8 px-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
