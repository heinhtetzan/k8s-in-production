import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  fetchProducts,
  fetchBrands,
  fetchCategories,
  type Product,
  type Brand,
  type Category,
  type Pagination,
  type ProductFilters as FilterType,
} from '../lib/api'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeletonGrid } from '../components/ProductCardSkeleton'
import { ProductFilters } from '../components/ProductFilters'
import {
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from 'lucide-react'

export interface CatalogSearchParams {
  category?: string
  brand?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'title_asc' | 'title_desc'
  page?: number
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: "Catalog & Products | Kendrick's Shop",
      },
      {
        name: 'description',
        content:
          'Browse our complete catalog of curated electronics, tech gadgets, laptops, smartphones, and accessories with instant search and filter options.',
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): CatalogSearchParams => {
    return {
      category: typeof search.category === 'string' && search.category ? search.category : undefined,
      brand: typeof search.brand === 'string' && search.brand ? search.brand : undefined,
      search: typeof search.search === 'string' && search.search ? search.search : undefined,
      sort: typeof search.sort === 'string' ? (search.sort as any) : undefined,
      page: search.page ? Number(search.page) : undefined,
    }
  },
  component: Home,
})

function Home() {
  const routeSearch = Route.useSearch()
  const navigate = Route.useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterType>(() => ({
    search: routeSearch.search || '',
    brand: routeSearch.brand || undefined,
    category: routeSearch.category || undefined,
    minPrice: undefined,
    maxPrice: undefined,
    in_stock: undefined,
    sort: routeSearch.sort || 'newest',
    page: routeSearch.page || 1,
    limit: 12,
  }))

  // Synchronize filters when URL search params change (e.g. clicking breadcrumbs or browser back/forward)
  useEffect(() => {
    setFilters((prev) => {
      const nextBrand = routeSearch.brand || undefined
      const nextCategory = routeSearch.category || undefined
      const nextSearch = routeSearch.search || ''
      const nextSort = routeSearch.sort || 'newest'
      const nextPage = routeSearch.page || 1

      if (
        prev.brand !== nextBrand ||
        prev.category !== nextCategory ||
        prev.search !== nextSearch ||
        prev.sort !== nextSort ||
        prev.page !== nextPage
      ) {
        return {
          ...prev,
          brand: nextBrand,
          category: nextCategory,
          search: nextSearch,
          sort: nextSort,
          page: nextPage,
        }
      }
      return prev
    })
  }, [routeSearch.brand, routeSearch.category, routeSearch.search, routeSearch.sort, routeSearch.page])

  // Load brands and categories once on mount
  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const [b, c] = await Promise.all([fetchBrands(), fetchCategories()])
        setBrands(b)
        setCategories(c)
      } catch (err) {
        console.error('Failed to load taxonomies:', err)
      }
    }
    loadTaxonomies()
  }, [])

  // Fetch products whenever filters change
  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    setError(null)

    async function loadProducts() {
      try {
        const res = await fetchProducts(filters)
        if (!isCancelled) {
          setProducts(res.data)
          setPagination(res.pagination)
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load products')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()
    return () => {
      isCancelled = true
    }
  }, [filters])

  const handleFilterChange = (updated: Partial<FilterType>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updated }
      navigate({
        search: {
          brand: next.brand || undefined,
          category: next.category || undefined,
          search: next.search ? next.search.trim() : undefined,
          sort: next.sort && next.sort !== 'newest' ? next.sort : undefined,
          page: next.page && next.page > 1 ? next.page : undefined,
        },
        replace: true,
      })
      return next
    })
  }

  const handleResetFilters = () => {
    navigate({
      search: {},
      replace: true,
    })
    setFilters({
      search: '',
      brand: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      in_stock: undefined,
      sort: 'newest',
      page: 1,
      limit: 12,
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* 2-Column Split: Left 3-Column Products, Right Sticky Controls & Pagination */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN: Products Grid */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          {/* Top Catalog Banner / Bar */}
          <div className="flex items-center justify-between bg-card/60 border border-border/60 rounded-xl px-4 py-3 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-sm font-bold tracking-tight text-foreground">
                All Products Catalog
              </h1>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{products.length}</strong> of{' '}
              <strong className="text-foreground">{pagination.total}</strong> items
            </div>
          </div>

          {/* Product Grid / Loading / Error / Empty States */}
          {isLoading ? (
            <ProductCardSkeletonGrid count={12} />
          ) : error ? (
            <div className="p-8 text-center bg-card text-card-foreground border border-destructive/30 rounded-xl space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
                <PackageSearch className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Failed to load catalog</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-card text-card-foreground border border-border/70 rounded-xl space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mx-auto border border-border/60">
                <PackageSearch className="w-7 h-7 opacity-50" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">No matching products found</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  We couldn't find any items matching your active search criteria. Try modifying your
                  category, brand, price filters or resetting your search.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* 3-Column Responsive Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Bottom Pagination for Mobile / Tablet (Visible on small screens) */}
              {pagination.totalPages > 1 && (
                <div className="lg:hidden pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/80 border border-border/70 text-card-foreground px-4 py-3 rounded-xl shadow-xs">
                  <div className="text-xs text-muted-foreground">
                    Page <strong className="text-foreground">{pagination.page}</strong> of{' '}
                    <strong className="text-foreground">{pagination.totalPages}</strong> (
                    {pagination.total} total items)
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                      className="h-8 px-3 rounded-lg border border-border/70 bg-secondary/80 text-secondary-foreground flex items-center justify-center gap-1 hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleFilterChange({ page: p })}
                          className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                            pagination.page === p
                              ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                              : 'bg-secondary/60 text-secondary-foreground border-border/60 hover:bg-secondary'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!pagination.hasNextPage}
                      onClick={() => handleFilterChange({ page: pagination.page + 1 })}
                      className="h-8 px-3 rounded-lg border border-border/70 bg-secondary/80 text-secondary-foreground flex items-center justify-center gap-1 hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-xs font-medium"
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Top Controls, Filters & Pagination */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-20 space-y-4">
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            brands={brands}
            categories={categories}
            totalCount={pagination.total}
            pagination={pagination}
          />
        </aside>
      </div>
    </div>
  )
}
