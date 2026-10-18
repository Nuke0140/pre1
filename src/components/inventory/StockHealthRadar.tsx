'use client'

import React from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShoppingCart,
  Filter,
  X,
  ChevronRight,
  Package,
  MessageSquare,
} from 'lucide-react'
import type {
  StockHealthRadarSummary,
  StockHealthCategory,
  StockHealthStatus,
} from '@/lib/inventory/stock-health'

export interface StockHealthRadarProps {
  summary: StockHealthRadarSummary
  selectedCategory?: StockHealthCategory | 'ALL'
  onSelectCategory?: (category: StockHealthCategory | 'ALL') => void
  onQuickReorder?: (item: {
    id: string
    name: string
    sku?: string
    suggestedReorderQuantity?: number
    defaultVendor?: { id?: string; name?: string; code?: string; phone?: string | null; contactPerson?: string | null } | null
    defaultVendorId?: string | null
    costPriceCents?: number | null
  }) => void
  onWhatsAppReorder?: (item: any) => void
  onBulkWhatsAppReorder?: (items: any[]) => void
  canProcure?: boolean
  canManageStock?: boolean
  branchName?: string
  className?: string
}

export function StockHealthRadar({
  summary,
  selectedCategory = 'ALL',
  onSelectCategory,
  onQuickReorder,
  onWhatsAppReorder,
  onBulkWhatsAppReorder,
  canProcure = false,
  canManageStock = false,
  branchName,
  className = '',
}: StockHealthRadarProps) {
  const { counts, criticalItems, lowStockItems } = summary
  const totalTracked = counts.totalTracked || 1
  const healthyPercentage = Math.round((counts.healthy / totalTracked) * 100)

  const isCategoryActive = (cat: StockHealthCategory | 'ALL') => selectedCategory === cat

  const handleCardClick = (cat: StockHealthCategory | 'ALL') => {
    if (!onSelectCategory) return
    // Toggle: if already active, reset to 'ALL', otherwise select
    if (selectedCategory === cat && cat !== 'ALL') {
      onSelectCategory('ALL')
    } else {
      onSelectCategory(cat)
    }
  }

  const allowReorder = canProcure || canManageStock

  return (
    <div
      role="region"
      aria-label="Stock Health Radar"
      className={`card w-full max-w-full min-w-0 transition-all ${className}`.trim()}
      style={{
        padding: 18,
        background: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 14px)',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      {/* 1. RADAR HEADER & TRAFFIC LIGHT OVERVIEW */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[var(--border-subtle,#f1f5f9)]">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(245,158,11,0.15) 50%, rgba(16,185,129,0.15) 100%)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
            }}
          >
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Stock Health Radar
              </h2>
              {branchName && (
                <span className="badge b-neutral text-[10px] uppercase font-mono tracking-wider">
                  {branchName}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Live inventory replenishment radar &amp; proactive stockout prevention
            </p>
          </div>
        </div>

        {/* ACTIVE FILTER STATUS / RESET PILL */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedCategory !== 'ALL' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800">
              <Filter size={12} />
              <span>
                Filtered by:{' '}
                {selectedCategory === 'CRITICAL_OUT_OF_STOCK'
                  ? 'Critical / Out of Stock'
                  : selectedCategory === 'LOW_STOCK'
                  ? 'Low Stock'
                  : selectedCategory === 'HEALTHY'
                  ? 'Healthy Stock'
                  : 'Unrated Items'}
              </span>
              <button
                type="button"
                onClick={() => onSelectCategory?.('ALL')}
                className="hover:opacity-75 p-0.5 ml-1 inline-flex"
                title="Clear category filter"
                aria-label="Clear category filter"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any card to filter catalog
            </span>
          )}

          {allowReorder && onBulkWhatsAppReorder && (counts.criticalOutOfStock + counts.lowStock) > 0 && (
            <button
              type="button"
              onClick={() => onBulkWhatsAppReorder([...criticalItems, ...lowStockItems])}
              className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-semibold flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg shadow-sm transition-all"
              title="Open WhatsApp Vendor Re-Order for all low-stock items"
            >
              <MessageSquare size={13} />
              <span>WhatsApp Re-Order ({counts.criticalOutOfStock + counts.lowStock})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. THREE-COLUMN TRAFFIC LIGHT RADAR CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* ============================================================== */}
        {/* CARD 1: 🔴 CRITICAL / OUT OF STOCK                             */}
        {/* ============================================================== */}
        <div
          onClick={() => handleCardClick('CRITICAL_OUT_OF_STOCK')}
          className={`flex flex-col rounded-xl p-3.5 transition-all cursor-pointer border ${
            isCategoryActive('CRITICAL_OUT_OF_STOCK')
              ? 'ring-2 ring-rose-500 bg-rose-50/60 dark:bg-rose-950/30 border-rose-400'
              : 'bg-white dark:bg-slate-900 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 hover:shadow-sm'
          }`}
          style={{ minHeight: 180 }}
          tabIndex={0}
          role="button"
          aria-pressed={isCategoryActive('CRITICAL_OUT_OF_STOCK')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('CRITICAL_OUT_OF_STOCK')}
        >
          {/* Card Top Pill & Count */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                <AlertOctagon size={15} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Critical / Out of Stock
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                counts.criticalOutOfStock > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts.criticalOutOfStock}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
            {counts.outOfStock > 0 ? (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {counts.outOfStock} out of stock
              </span>
            ) : (
              '0 zero-stock items'
            )}
            {counts.critical > 0 && ` • ${counts.critical} below safety reserve`}
          </div>

          {/* Critical Items Preview List */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
            {criticalItems.length > 0 ? (
              criticalItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-slate-900 dark:text-slate-100">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span
                        className={`font-semibold ${
                          item.status === 'OUT_OF_STOCK'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.availableQuantity} {item.unit}
                      </span>
                    </div>
                  </div>

                  {allowReorder && (
                    <div className="flex items-center gap-1 shrink-0">
                      {onWhatsAppReorder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onWhatsAppReorder(item)
                          }}
                          className="btn btn-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-none px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1"
                          title={`WhatsApp Vendor Re-Order for ${item.name}`}
                        >
                          <MessageSquare size={11} /> WhatsApp
                        </button>
                      )}
                      {onQuickReorder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onQuickReorder(item)
                          }}
                          className="btn btn-xs shrink-0 bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-none px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1"
                          title={`Quick Re-Order ${item.name} (Suggested: ${item.suggestedReorderQuantity} ${item.unit})`}
                        >
                          <ShoppingCart size={11} /> PO
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-3 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg">
                <CheckCircle2 size={18} className="text-emerald-500 mb-1" />
                <span>Zero critical stockouts</span>
              </div>
            )}
          </div>

          {counts.criticalOutOfStock > 3 && (
            <div className="mt-2 text-right text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-0.5">
              <span>+{counts.criticalOutOfStock - 3} more items</span>
              <ChevronRight size={12} />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CARD 2: 🟡 LOW STOCK                                          */}
        {/* ============================================================== */}
        <div
          onClick={() => handleCardClick('LOW_STOCK')}
          className={`flex flex-col rounded-xl p-3.5 transition-all cursor-pointer border ${
            isCategoryActive('LOW_STOCK')
              ? 'ring-2 ring-amber-500 bg-amber-50/60 dark:bg-amber-950/30 border-amber-400'
              : 'bg-white dark:bg-slate-900 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-300 hover:shadow-sm'
          }`}
          style={{ minHeight: 180 }}
          tabIndex={0}
          role="button"
          aria-pressed={isCategoryActive('LOW_STOCK')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('LOW_STOCK')}
        >
          {/* Card Top Pill & Count */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <AlertTriangle size={15} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Low Stock
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                counts.lowStock > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {counts.lowStock}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
            At or below replenishment threshold (requires replenishment)
          </div>

          {/* Low Stock Items Preview List */}
          <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-slate-900 dark:text-slate-100">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        {item.availableQuantity} / {item.reorderLevel} {item.unit}
                      </span>
                    </div>
                  </div>

                  {allowReorder && (
                    <div className="flex items-center gap-1 shrink-0">
                      {onWhatsAppReorder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onWhatsAppReorder(item)
                          }}
                          className="btn btn-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-none px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1"
                          title={`WhatsApp Vendor Re-Order for ${item.name}`}
                        >
                          <MessageSquare size={11} /> WhatsApp
                        </button>
                      )}
                      {onQuickReorder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onQuickReorder(item)
                          }}
                          className="btn btn-xs shrink-0 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-none px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1"
                          title={`Re-Order ${item.name} (Suggested: ${item.suggestedReorderQuantity} ${item.unit})`}
                        >
                          <ShoppingCart size={11} /> PO
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-3 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg">
                <CheckCircle2 size={18} className="text-emerald-500 mb-1" />
                <span>No items waiting for reorder</span>
              </div>
            )}
          </div>

          {counts.lowStock > 3 && (
            <div className="mt-2 text-right text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-end gap-0.5">
              <span>+{counts.lowStock - 3} more items</span>
              <ChevronRight size={12} />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CARD 3: 🟢 HEALTHY STOCK                                      */}
        {/* ============================================================== */}
        <div
          onClick={() => handleCardClick('HEALTHY')}
          className={`flex flex-col justify-between rounded-xl p-3.5 transition-all cursor-pointer border ${
            isCategoryActive('HEALTHY')
              ? 'ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-400'
              : 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-300 hover:shadow-sm'
          }`}
          style={{ minHeight: 180 }}
          tabIndex={0}
          role="button"
          aria-pressed={isCategoryActive('HEALTHY')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('HEALTHY')}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <CheckCircle2 size={15} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Healthy Stock
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                {counts.healthy}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Adequately stocked above reorder thresholds
            </div>

            {/* Health Meter Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, healthyPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span>{healthyPercentage}% of catalog healthy</span>
              <span>{counts.healthy} / {totalTracked} items</span>
            </div>
          </div>

          {/* Unrated Transparency Note */}
          {counts.unrated > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                handleCardClick('UNRATED')
              }}
              className="mt-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between hover:bg-slate-100 transition-colors"
              title="Click to view unrated items missing minimum and reorder thresholds"
            >
              <div className="flex items-center gap-1 truncate">
                <HelpCircle size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  {counts.unrated} unrated {counts.unrated === 1 ? 'item' : 'items'}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                Review &rarr;
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
