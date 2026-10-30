import React from 'react'
import { Skeleton } from './ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <div className="group relative bg-card/90 rounded-xl border border-border/70 flex flex-col overflow-hidden text-left shadow-xs">
      {/* Top Image Container - Aspect Square */}
      <div className="relative aspect-square w-full bg-muted/40 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
        
        {/* Floating Brand Badge Placeholder */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Category Tag */}
          <Skeleton className="h-3 w-20 rounded" />

          {/* Product Title (2 lines) */}
          <div className="space-y-1.5 pt-0.5">
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
          </div>
        </div>

        {/* Footer: Price & Add Button */}
        <div className="pt-2 flex items-center justify-between border-t border-border/40">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10 rounded" />
            <Skeleton className="h-5 w-20 rounded font-mono" />
          </div>

          {/* Quick Add Button Placeholder */}
          <Skeleton className="h-8.5 w-8.5 rounded-lg shrink-0" />
        </div>
      </div>
    </div>
  )
}

export function ProductCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
