import React from 'react'
import { Skeleton } from './ui/skeleton'

export function KpiCardSkeleton() {
  return (
    <div className="bg-card/90 border border-border/70 rounded-xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-28 rounded-md font-mono" />
      <Skeleton className="h-2.5 w-36 rounded" />
    </div>
  )
}

export function QuickStatCardSkeleton() {
  return (
    <div className="bg-card border border-border/70 p-4 space-y-2 shadow-xs">
      <Skeleton className="h-2.5 w-20 rounded" />
      <Skeleton className="h-6 w-16 rounded font-mono" />
      <Skeleton className="h-2.5 w-28 rounded" />
    </div>
  )
}

export function TableRowSkeleton({
  cols = 5,
  rows = 5,
}: {
  cols?: number
  rows?: number
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border/40">
          {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-3">
              <Skeleton
                className={`h-4 ${
                  i === 0
                    ? 'w-28'
                    : i === 1
                    ? 'w-36'
                    : i === cols - 1
                    ? 'w-16 ml-auto'
                    : 'w-20'
                } rounded`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
