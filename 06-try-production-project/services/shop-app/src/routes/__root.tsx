import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { AuthProvider } from '../lib/auth-context'
import { CartProvider } from '../lib/cart-context'
import { Navbar } from '../components/Navbar'
import { CartSheet } from '../components/CartSheet'
import { AuthModal } from '../components/AuthModal'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

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
        title: "Kendrick's Shop | Modern E-Commerce Storefront",
      },
      {
        name: 'description',
        content:
          "Discover high-performance electronics, gadgets, and tech essentials at Kendrick's Shop. Fast delivery, verified stock, and seamless checkout.",
      },
      {
        name: 'keywords',
        content:
          'ecommerce, electronics, smartphones, laptops, gadgets, online shop, tech store, kendrick dev',
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
      // Open Graph / Facebook
      {
        property: 'og:site_name',
        content: "Kendrick's Shop",
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: "Kendrick's Shop | Modern E-Commerce Storefront",
      },
      {
        property: 'og:description',
        content:
          "Discover high-performance electronics, gadgets, and tech essentials with real-time inventory and instant checkout.",
      },
      {
        property: 'og:url',
        content: 'https://kendrickdev.shop',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: "Kendrick's Shop | Modern E-Commerce Storefront",
      },
      {
        name: 'twitter:description',
        content:
          "Discover high-performance electronics, gadgets, and tech essentials with real-time inventory.",
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
      {
        rel: 'canonical',
        href: 'https://kendrickdev.shop',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col justify-between">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <CartSheet />
            <AuthModal />

            {/* Shared Footer with subtle top border */}
            <footer className="bg-card/60 backdrop-blur-md border-t border-border/60 text-muted-foreground py-8 mt-12 text-xs">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">Kendrick's Shop</span>
                  <span>&bull;</span>
                  <span>Modern E-Commerce Store</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground">&copy; 2026 Kendrick's Shop</span>
                </div>
              </div>
            </footer>
          </CartProvider>
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
