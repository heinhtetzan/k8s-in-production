import {
  Link,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
  useNavigate,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../lib/auth-context'
import {
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Tag,
  Boxes,
  Users,
  Menu,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: "Kendrick's Shop | Admin Operations Portal",
      },
      {
        name: 'description',
        content:
          "Enterprise administration dashboard for Kendrick's Shop. Real-time order fulfillment, catalog, stock control, and user governance.",
      },
      {
        name: 'robots',
        content: 'noindex, nofollow',
      },
      {
        name: 'author',
        content: 'Kendrick Dev',
      },
      {
        name: 'theme-color',
        content: '#090a0f',
      },
      {
        name: 'color-scheme',
        content: 'dark',
      },
      // Open Graph
      {
        property: 'og:site_name',
        content: "Kendrick's Shop Admin Portal",
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: "Kendrick's Shop | Admin Operations Portal",
      },
      {
        property: 'og:description',
        content:
          "Enterprise administration dashboard for Kendrick's Shop. Real-time order fulfillment, catalog, and inventory control.",
      },
      {
        property: 'og:url',
        content: 'https://dashboard.kendrickdev.shop',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary',
      },
      {
        name: 'twitter:title',
        content: "Kendrick's Shop Admin Portal",
      },
      {
        name: 'twitter:description',
        content:
          "Enterprise administration dashboard for Kendrick's Shop operations.",
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon.png',
      },
      {
        rel: 'alternate icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
})

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Layers },
  { to: '/brands', label: 'Brands', icon: Tag },
  { to: '/stocks', label: 'Inventory', icon: Boxes },
  { to: '/users', label: 'Users', icon: Users },
]

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth()
  const routerState = useRouterState()
  const navigate = useNavigate()
  const pathname = routerState.location.pathname
  const isLoginPage = pathname === '/login'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      navigate({ to: '/login' })
    }
  }, [isLoading, isAuthenticated, isLoginPage, navigate])

  if (isLoginPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-card/90 backdrop-blur-md px-4 h-14 flex items-center justify-between border-b border-border/70 shadow-xs">
        <Link to="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Kendrick's Shop Admin</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-md border-r border-border/70 shadow-lg flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Portal Badge */}
          <div className="p-5 flex items-center justify-between border-b border-border/50">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 font-bold text-sm tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight font-semibold">Kendrick's Shop</span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isExact = pathname === item.to
              const isChild = item.to !== '/' && pathname.startsWith(item.to)
              const isActive = isExact || isChild

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

        </div>

        {/* User Info & Logout Footer */}
        {isAuthenticated && user && (
          <div className="p-3 bg-secondary/30 border-t border-border/60 space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border/60 text-secondary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{user.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-border/60 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area - 100% Fluid Full-Screen Canvas */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-background/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">{children}</div>
      </main>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AuthProvider>

        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
