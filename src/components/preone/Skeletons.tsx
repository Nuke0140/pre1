'use client'

import React from 'react'

/**
 * PreOne Shape-Matched Skeletons
 * Provides zero-CLS placeholders matching real component layouts.
 */

export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 64 : 44
  return (
    <div
      className="skel rounded-full shrink-0"
      style={{ width: dim, height: dim }}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`card p-5 space-y-4 ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="skel h-5 w-32 rounded-md" />
        <div className="skel h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="skel h-4 w-full rounded-sm" />
        <div className="skel h-4 w-4/5 rounded-sm" />
        <div className="skel h-4 w-2/3 rounded-sm" />
      </div>
    </div>
  )
}

export function KPIGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="kpi skel-kpi p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="skel w-10 h-10 rounded-xl" />
            <div className="skel w-14 h-5 rounded-full" />
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="skel h-3.5 w-24 rounded-xs" />
            <div className="skel h-7 w-20 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="zen-table-wrap overflow-hidden" aria-hidden="true">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="skel h-9 w-64 rounded-lg" />
        <div className="flex gap-2">
          <div className="skel h-9 w-20 rounded-lg" />
          <div className="skel h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="zen-table w-full">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="zen-th">
                  <div className="skel h-3.5 w-20 rounded-xs" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="zen-tr">
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="zen-td">
                    <div
                      className="skel h-4 rounded-xs"
                      style={{ width: `${Math.max(45, 85 - (c * 12))}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ListRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60"
        >
          <div className="flex items-center gap-3">
            <div className="skel w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <div className="skel h-4 w-32 rounded-xs" />
              <div className="skel h-3 w-48 rounded-xs" />
            </div>
          </div>
          <div className="skel h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 p-5 card" aria-hidden="true">
      <div className="skel h-5 w-40 rounded-sm mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skel h-3.5 w-24 rounded-xs" />
            <div className="skel h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="skel h-9 w-20 rounded-lg" />
        <div className="skel h-9 w-28 rounded-lg" />
      </div>
    </div>
  )
}

export function DetailHeaderSkeleton() {
  return (
    <div className="card p-6 space-y-4 mb-6" aria-hidden="true">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarSkeleton size="lg" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="skel h-7 w-48 rounded-md" />
              <div className="skel h-5 w-16 rounded-full" />
            </div>
            <div className="skel h-4 w-36 rounded-xs" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="skel h-9 w-24 rounded-lg" />
          <div className="skel h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function Student360Skeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading student profile">
      <DetailHeaderSkeleton />
      <KPIGridSkeleton count={4} />
      <div className="skel h-11 w-full max-w-xl rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export function ModulePageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading workspace">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skel h-7 w-40 rounded-md" />
          <div className="skel h-4 w-64 rounded-xs" />
        </div>
        <div className="skel h-9 w-28 rounded-lg" />
      </div>
      <KPIGridSkeleton count={4} />
      <TableSkeleton rows={6} columns={5} />
    </div>
  )
}

export function HomeGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="home" aria-busy="true" aria-label="Loading home modules">
      <section className="home-center-hero">
        <div className="home-center-brand">
          <div className="skel h-10 w-40 rounded-xl" />
        </div>
        <div className="home-context-bar flex items-center justify-center gap-2 mt-2">
          <div className="skel h-4 w-44 rounded-full" />
        </div>
      </section>

      <main>
        <div className="module-grid">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="module-card pointer-events-none">
              <div className="module-card-icon-area">
                <div className="skel w-11 h-11 rounded-xl" />
              </div>
              <div className="module-card-title-area">
                <div className="skel h-3 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
