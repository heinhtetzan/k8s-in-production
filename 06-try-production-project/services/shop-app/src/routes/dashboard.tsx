import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth-context'
import { api } from '../lib/api'
import {
  LogOut,
  Mail,
  Calendar,
  LayoutDashboard,
  Users,
  Loader2,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { Skeleton } from '../components/ui/skeleton'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      {
        title: "Account Dashboard | Kendrick's Shop",
      },
      {
        name: 'description',
        content:
          "Manage your customer profile, view store metrics, and check account status on Kendrick's Shop.",
      },
    ],
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { user, isAuthenticated, signOut, openAuthModal, token } = useAuth()

  const [dashboardUsers, setDashboardUsers] = useState<any[]>([])
  const [dashboardOverview, setDashboardOverview] = useState<any>(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const [stats, setStats] = useState({
    productsCount: 0,
    brandsCount: 0,
    categoriesCount: 0,
    totalStock: 0,
  })

  // Redirect or show login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // User can view or sign in
    }
  }, [isAuthenticated])

  // Fetch admin dashboard details if user is a shop admin
  useEffect(() => {
    let isCancelled = false

    async function fetchShopData() {
      if (!user || user.type !== 'shop' || !token) return
      setLoadingDashboard(true)
      setDashboardError(null)

      try {
        // Fetch dashboard overview
        const overviewRes = await api.getDashboardOverview(token)
        if (!isCancelled && overviewRes) {
          setDashboardOverview(overviewRes)
        }

        // Fetch dashboard users
        const usersRes = await api.getDashboardUsers(token)
        if (!isCancelled && usersRes?.data) {
          setDashboardUsers(usersRes.data)
        }

        // Fetch catalog counts for overview
        const [productsRes, brandsRes, categoriesRes] = await Promise.all([
          api.getProducts({ limit: 1 }),
          api.getBrands(),
          api.getCategories(),
        ])

        if (!isCancelled) {
          setStats({
            productsCount: productsRes.pagination?.total || 0,
            brandsCount: brandsRes.data?.length || 0,
            categoriesCount: categoriesRes.data?.length || 0,
            totalStock: (productsRes.data || []).reduce((acc: number, p: any) => acc + (p.stock_count || 0), 0),
          })
        }
      } catch (err: any) {
        if (!isCancelled) {
          setDashboardError(err.message || 'Failed to fetch dashboard administration data')
        }
      } finally {
        if (!isCancelled) {
          setLoadingDashboard(false)
        }
      }
    }

    fetchShopData()
    return () => {
      isCancelled = true
    }
  }, [user, token])

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-muted border border-border/60 text-muted-foreground flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Sign In to View Dashboard</h2>
        <p className="text-xs text-muted-foreground">
          Please sign in to view your profile, manage orders, or access Kendrick's Shop management portal.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <span>Sign In / Create Account</span>
        </button>
      </div>
    )
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recently'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Profile Header Banner */}
      <div className="relative bg-card text-card-foreground rounded-2xl border border-border/70 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-14 h-14 rounded-xl border border-border/60 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center shadow-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {user.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-secondary text-secondary-foreground border border-border/60">
                {user.type === 'shop' ? 'Shop Admin' : 'Customer Account'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <span>{user.email}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span>Joined {memberSince}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={signOut}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 h-8.5 px-3 rounded-lg border border-border/60 bg-secondary hover:bg-destructive/10 text-destructive text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {dashboardError && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Notice: {dashboardError}</span>
        </div>
      )}

      {/* Shop Admin Dashboard Section */}
      {user.type === 'shop' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <span>Kendrick's Shop Administration & Metrics</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {dashboardOverview?.message || 'Shop Management Dashboard API'}
              </p>
            </div>

          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {loadingDashboard ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/70 bg-card space-y-2.5 shadow-xs">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-2.5 w-24 rounded" />
                </div>
              ))
            ) : (
              <>
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-1 shadow-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Products
                  </div>
                  <div className="text-xl font-bold text-foreground">{stats.productsCount}</div>
                  <div className="text-[10px] text-muted-foreground">Active catalog</div>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-1 shadow-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Brands
                  </div>
                  <div className="text-xl font-bold text-foreground">{stats.brandsCount}</div>
                  <div className="text-[10px] text-muted-foreground">Taxonomies</div>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-1 shadow-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </div>
                  <div className="text-xl font-bold text-foreground">{stats.categoriesCount}</div>
                  <div className="text-[10px] text-muted-foreground">Sections</div>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-1 shadow-xs">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Inventory
                  </div>
                  <div className="text-xl font-bold text-foreground">{stats.totalStock}</div>
                  <div className="text-[10px] text-muted-foreground">Units in stock</div>
                </div>
              </>
            )}
          </div>

          {/* Registered Users Table */}
          <div className="bg-card text-card-foreground rounded-2xl border border-border/70 p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground text-xs">
                  Registered Platform Users ({dashboardUsers.length})
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                GET /dashboard/users
              </span>
            </div>

            {loadingDashboard ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : dashboardUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No users found or error loading users.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground uppercase text-[10px] tracking-wider bg-muted/40 rounded-lg">
                      <th className="p-2.5 font-semibold rounded-l-lg">User</th>
                      <th className="p-2.5 font-semibold">Email</th>
                      <th className="p-2.5 font-semibold">Role</th>
                      <th className="p-2.5 font-semibold rounded-r-lg">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {dashboardUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-medium text-foreground flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-secondary text-secondary-foreground font-bold text-[9px] flex items-center justify-center border border-border/60">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="p-2.5 text-muted-foreground font-mono">{u.email}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase bg-secondary text-secondary-foreground border border-border/60">
                            {u.type}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Dashboard View */}
      {user.type === 'customer' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/70 p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h3>Your Order History</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              You currently have no pending orders.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-xs"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card text-card-foreground rounded-2xl border border-border/70 p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3>Account Security & Preferences</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-muted-foreground">Email Authentication</span>
                <span className="font-medium text-foreground">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-muted-foreground">Google OAuth Link</span>
                <span className="font-medium text-foreground">
                  {user.googleId ? 'Linked' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-muted-foreground">Customer Tier</span>
                <span className="font-medium text-foreground">Standard Member</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
