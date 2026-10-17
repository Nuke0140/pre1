'use client'

import React from 'react'

export interface KpiTrend {
  dir?: 'up' | 'down' | 'flat' | 'neutral'
  text: string
  isPositive?: boolean
}

export interface KpiStatus {
  text: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

export type KpiSemanticVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'compact'
  | 'hero'
  | 'secondary'

export interface GlobalKpiCardProps {
  /** Concise metric label (What is being measured?) */
  label?: string
  /** Backwards compatibility alias for label */
  title?: string
  /** Prominent numeric or textual metric value */
  value?: string | number | null
  /** Unit indicator (e.g. '%', 'students', '₹') */
  unit?: string
  /** Secondary context / supporting text */
  supportingText?: React.ReactNode
  /** Backwards compatibility alias for supportingText */
  meta?: React.ReactNode
  /** Backwards compatibility alias for supportingText */
  sub?: React.ReactNode
  /** Icon element (Lucide or SVG) */
  icon?: React.ReactNode
  /** Custom container class or color tokens for icon */
  iconClass?: string
  /** Trend comparison indicator with direction */
  trend?: KpiTrend
  /** Explanatory status pill or dot */
  status?: KpiStatus
  /** Semantic theme variant */
  semanticVariant?: KpiSemanticVariant
  /** Backwards compatibility alias for semanticVariant */
  variant?: 'hero' | 'primary' | 'secondary' | 'compact'
  /** Hero emphasis indicator */
  hero?: boolean
  /** Loading skeleton state during data retrieval */
  loading?: boolean
  /** Genuine error message if metric failed to load */
  error?: string | null
  /** Interactive callback if clicking drills into details or filters */
  onClick?: () => void
  /** Accessible label for screen readers */
  accessibleLabel?: string
  /** Hover tooltip */
  tooltip?: string
  /** Selected or active toggle state */
  active?: boolean
  /** Selected alias */
  selected?: boolean
  /** Compact density mode (~76-92px height) */
  size?: 'compact' | 'default'
  /** Badge element rendered in top row */
  badge?: React.ReactNode
  /** Custom class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** HTML or component tag to render as */
  as?: React.ElementType
}

/**
 * PreOne Global KPI Card
 *
 * Master Design System component for metrics across all modules.
 * Features:
 * - Compact dimensions (~76-104px height)
 * - Theme-matching subtle default border derived from CSS variables
 * - Restrained theme-colored glow on hover, focus, and active states
 * - High-contrast accessible typography (Label, Tabular Numeral, Supporting Text)
 * - Genuine zero support (distinguished from empty or loading)
 * - Loading skeleton & error states
 * - Keyboard navigation (Enter/Space) and focus rings
 * - Accessible ARIA attributes
 */
export function GlobalKpiCard({
  label,
  title,
  value,
  unit,
  supportingText,
  meta,
  sub,
  icon,
  iconClass = '',
  trend,
  status,
  semanticVariant = 'default',
  variant,
  hero,
  loading = false,
  error,
  onClick,
  accessibleLabel,
  tooltip,
  active,
  selected,
  size = 'default',
  badge,
  className = '',
  style,
  as: Component = 'div',
}: GlobalKpiCardProps) {
  const displayLabel = label || title || ''
  const displaySub = supportingText ?? meta ?? sub
  const isSelected = active ?? selected ?? false
  const isInteractive = Boolean(onClick)
  const isHero = hero || variant === 'hero' || semanticVariant === 'hero' || variant === 'primary' || semanticVariant === 'primary'
  const isCompact = size === 'compact' || variant === 'compact' || semanticVariant === 'compact'

  // Loading skeleton state
  if (loading) {
    return (
      <div
        className={`preone-kpi-card ${isCompact ? 'py-2.5 px-3.5' : 'py-3 px-4'} ${className}`}
        style={style}
        role="status"
        aria-label={`Loading ${displayLabel || 'metric'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="mt-1 h-6 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        {displaySub && <div className="mt-1 h-2.5 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />}
      </div>
    )
  }

  // Genuine error state (distinguished from zero or empty)
  if (error) {
    return (
      <div
        className={`preone-kpi-card border-rose-200/90 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 ${
          isCompact ? 'py-2.5 px-3.5' : 'py-3 px-4'
        } ${className}`}
        style={style}
        role="alert"
        title={error}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">
            {displayLabel}
          </span>
          <span className="text-rose-500 text-xs font-semibold">!</span>
        </div>
        <div className="text-sm font-semibold text-rose-800 dark:text-rose-200">Data Unavailable</div>
        <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 truncate font-sans">{error}</div>
      </div>
    )
  }

  // Value formatting: preserve genuine 0
  const renderedValue = value != null ? value : '—'

  // Determine icon background and text styles if iconClass isn't custom
  const defaultIconWrap =
    iconClass ||
    'bg-[color-mix(in_srgb,var(--primary,#7c3aed)_10%,transparent)] text-[var(--primary,#7c3aed)] dark:text-purple-300'

  const handleKeyDown = isInteractive
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }
    : undefined

  const ariaLabelText =
    accessibleLabel ||
    (displayLabel ? `${displayLabel}: ${renderedValue}${unit ? ` ${unit}` : ''}` : undefined)

  return (
    <Component
      className={`preone-kpi-card ${isInteractive ? 'interactive' : ''} ${isSelected ? 'active' : ''} ${
        isHero ? 'kpi-hero' : ''
      } ${isCompact ? 'kpi-compact' : ''} ${className}`.trim()}
      style={style}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabelText}
      aria-pressed={isInteractive && isSelected != null ? isSelected : undefined}
      title={tooltip || (typeof displaySub === 'string' ? displaySub : undefined)}
    >
      {/* Top Header Row: Label & Optional Icon / Badge / Trend */}
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <span
          className="font-heading text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate"
          title={displayLabel}
        >
          {displayLabel}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                trend.isPositive !== undefined
                  ? trend.isPositive
                    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40'
                    : 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                  : trend.dir === 'up'
                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40'
                  : trend.dir === 'down'
                  ? 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40'
                  : 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800'
              }`}
            >
              {trend.text}
            </span>
          )}
          {icon && (
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-200 group-hover:scale-105 ${defaultIconWrap}`}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Primary Metric Row */}
      <div className="flex items-baseline gap-1.5 w-full min-w-0">
        <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white leading-none">
          {renderedValue}
        </span>
        {unit && (
          <span className="font-sans text-xs font-semibold text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom Supporting Context Row (Status / Meta) */}
      {(status || displaySub) && (
        <div className="flex items-center gap-2 text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 truncate w-full min-w-0">
          {status && (
            <span
              className={`inline-flex items-center gap-1 font-semibold truncate ${
                status.variant === 'warning'
                  ? 'text-amber-700 dark:text-amber-300'
                  : status.variant === 'danger'
                  ? 'text-rose-700 dark:text-rose-300'
                  : status.variant === 'info'
                  ? 'text-blue-700 dark:text-blue-300'
                  : status.variant === 'neutral'
                  ? 'text-slate-600 dark:text-slate-400'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span className="text-[7px]" aria-hidden="true">●</span>
              <span>{status.text}</span>
            </span>
          )}
          {displaySub && !status && (
            <span className="truncate font-medium">{displaySub}</span>
          )}
        </div>
      )}
    </Component>
  )
}

/** Aliases for convenient importing */
export const KpiCard = GlobalKpiCard

export interface KpiGridProps {
  children: React.ReactNode
  /** Number of columns or responsive preset */
  columns?: 2 | 3 | 4 | 5 | 6 | 'auto'
  /** Custom class name */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * PreOne Shared KPI Grid / Group
 *
 * Ensures consistent multi-column responsive layout across modules:
 * - 1 column on mobile (<640px)
 * - 2 columns on small tablets (sm)
 * - 3 or 4 columns on desktop (md/lg)
 * - 5 or 6 columns on wide displays when configured
 */
export function KpiGrid({
  children,
  columns = 'auto',
  className = '',
  style,
}: KpiGridProps) {
  let gridColsClass = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4'
  if (columns === 2) gridColsClass = 'grid-cols-1 sm:grid-cols-2'
  else if (columns === 3) gridColsClass = 'grid-cols-1 sm:grid-cols-3'
  else if (columns === 4) gridColsClass = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4'
  else if (columns === 5) gridColsClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
  else if (columns === 6) gridColsClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
  else if (columns === 'auto') gridColsClass = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4'

  return (
    <div
      className={`grid ${gridColsClass} gap-3 sm:gap-4 w-full ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  )
}

export const GlobalKpiGrid = KpiGrid
export const KpiGroup = KpiGrid
