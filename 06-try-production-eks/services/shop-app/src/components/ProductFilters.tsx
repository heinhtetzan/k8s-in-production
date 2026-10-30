import type { Brand, Category, Pagination, ProductFilters as FilterType } from '../lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Search,
  X,
  Tag,
  Layers,
  DollarSign,
  Box,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'

interface ProductFiltersProps {
  filters: FilterType
  onChange: (updated: Partial<FilterType>) => void
  onReset: () => void
  brands: Brand[]
  categories: Category[]
  totalCount?: number
  pagination?: Pagination
}

const PRICE_OPTIONS = [
  { id: 'all', label: 'All Prices', min: undefined, max: undefined },
  { id: 'under-100', label: 'Under $100', min: undefined, max: 100 },
  { id: '100-300', label: '$100 - $300', min: 100, max: 300 },
  { id: '300-800', label: '$300 - $800', min: 300, max: 800 },
  { id: '800-plus', label: '$800+', min: 800, max: undefined },
]

export function ProductFilters({
  filters,
  onChange,
  onReset,
  brands,
  categories,
  totalCount,
  pagination,
}: ProductFiltersProps) {
  const isBrandActive = Boolean(filters.brand && filters.brand !== 'all')
  const isCategoryActive = Boolean(filters.category && filters.category !== 'all')
  const isPriceActive = Boolean(
    filters.minPrice !== undefined || filters.maxPrice !== undefined
  )
  const isStockActive = Boolean(filters.in_stock === true)
  const isSortActive = Boolean(filters.sort && filters.sort !== 'newest')

  const hasAnyActive =
    isBrandActive ||
    isCategoryActive ||
    isPriceActive ||
    isStockActive ||
    isSortActive ||
    Boolean(filters.search)

  const currentPriceOption = PRICE_OPTIONS.find(
    (opt) => opt.min === filters.minPrice && opt.max === filters.maxPrice
  )
  const currentPriceId = currentPriceOption?.id || 'all'

  const handlePriceChange = (val: string) => {
    const opt = PRICE_OPTIONS.find((p) => p.id === val)
    if (opt && opt.id !== 'all') {
      onChange({
        minPrice: opt.min,
        maxPrice: opt.max,
        page: 1,
      })
    } else {
      onChange({ minPrice: undefined, maxPrice: undefined, page: 1 })
    }
  }

  // Active brand & category labels for chips
  const activeBrandObj = brands.find((b) => b.slug === filters.brand || b.id === filters.brand)
  const activeCategoryObj = categories.find((c) => c.slug === filters.category || c.id === filters.category)

  return (
    <div className="bg-card/90 text-card-foreground p-4.5 rounded-xl border border-border/70 shadow-sm backdrop-blur-xs space-y-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-foreground uppercase">
              Controls & Filters
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {totalCount !== undefined ? `${totalCount} products available` : 'Refine catalog'}
            </p>
          </div>
        </div>

        {hasAnyActive && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Real-time Search Input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          Search
        </label>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search title, brand..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="h-9 w-full rounded-lg border border-border/70 bg-secondary/60 focus:bg-background text-foreground pl-8 pr-7 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus:border-primary/50 transition-all shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '', page: 1 })}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasAnyActive && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-medium border border-primary/25">
              <span>"{filters.search}"</span>
              <button
                type="button"
                onClick={() => onChange({ search: '', page: 1 })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {isBrandActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/70">
              <span>{activeBrandObj?.title || filters.brand}</span>
              <button
                type="button"
                onClick={() => onChange({ brand: undefined, page: 1 })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {isCategoryActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/70">
              <span>{activeCategoryObj?.title || filters.category}</span>
              <button
                type="button"
                onClick={() => onChange({ category: undefined, page: 1 })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {isPriceActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium border border-border/70">
              <span>{currentPriceOption?.label}</span>
              <button
                type="button"
                onClick={() => onChange({ minPrice: undefined, maxPrice: undefined, page: 1 })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {isStockActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
              <span>In Stock Only</span>
              <button
                type="button"
                onClick={() => onChange({ in_stock: undefined, page: 1 })}
                className="hover:text-foreground cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* 2. Sort By Select */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-primary" />
          <span>Sort By</span>
        </label>
        <Select
          value={filters.sort || 'newest'}
          onValueChange={(val) => onChange({ sort: val as any, page: 1 })}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Sort Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest Additions</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="title_asc">Title: A to Z</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Category Select */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-primary" />
          <span>Category</span>
        </label>
        <Select
          value={filters.category || 'all'}
          onValueChange={(val) =>
            onChange({ category: val === 'all' ? undefined : val, page: 1 })
          }
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug || c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Brand Select */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-primary" />
          <span>Brand</span>
        </label>
        <Select
          value={filters.brand || 'all'}
          onValueChange={(val) =>
            onChange({ brand: val === 'all' ? undefined : val, page: 1 })
          }
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.slug || b.id}>
                {b.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 5. Price Range */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3 h-3 text-primary" />
          <span>Price Range</span>
        </label>
        <Select value={currentPriceId} onValueChange={handlePriceChange}>
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="All Prices" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 6. In-Stock Only Toggle Card */}
      <div
        onClick={() => onChange({ in_stock: filters.in_stock ? undefined : true, page: 1 })}
        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
          filters.in_stock
            ? 'bg-emerald-500/10 border-emerald-500/40 text-foreground'
            : 'bg-secondary/40 border-border/70 hover:bg-secondary/70 text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              filters.in_stock ? 'bg-emerald-500 text-white' : 'border border-border/80 bg-background/50'
            }`}
          >
            {filters.in_stock && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className="text-xs font-medium">In-Stock Only</span>
        </div>

        <span
          className={`w-2 h-2 rounded-full ${
            filters.in_stock ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40'
          }`}
        />
      </div>

      {/* 7. Sticky Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pt-3 border-t border-border/60 space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">
              Page
            </span>
            <span className="text-foreground font-semibold">
              {pagination.page} <span className="text-muted-foreground font-normal">of</span> {pagination.totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-between">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => onChange({ page: pagination.page - 1 })}
              className="flex-1 h-8 rounded-lg border border-border/70 bg-secondary/80 hover:bg-secondary text-secondary-foreground flex items-center justify-center gap-1 hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs font-medium shadow-xs"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Quick page pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let p = i + 1
                if (pagination.totalPages > 5 && pagination.page > 3) {
                  p = pagination.page - 3 + i
                  if (p > pagination.totalPages) p = pagination.totalPages - (4 - i)
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onChange({ page: p })}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all cursor-pointer border shadow-xs ${
                      pagination.page === p
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                        : 'bg-secondary/60 text-secondary-foreground border-border/60 hover:bg-secondary hover:border-primary/40'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => onChange({ page: pagination.page + 1 })}
              className="flex-1 h-8 rounded-lg border border-border/70 bg-secondary/80 hover:bg-secondary text-secondary-foreground flex items-center justify-center gap-1 hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-xs font-medium shadow-xs"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
