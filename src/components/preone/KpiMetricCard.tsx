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

export interface KpiMetricCardProps {
  /** Concise metric label (What is being measured?) */
  label: string
  /** Prominent numeric or textual metric value */
  value: string | number | null | undefined
  /** Unit indicator (e.g. '%', 'students', '₹') */
  unit?: string
  /** Semantic icon container */
  icon?: React.ReactNode
  /** Icon color styling or custom container class */
  iconClass?: string
  /** Meaningful context: comparison or trend indicator */
  trend?: KpiTrend
  /** Meaningful context: explanatory status with semantic dot */
  status?: KpiStatus
  /** Additional secondary context / metadata */
  meta?: string
  /** Loading skeleton state during data retrieval */
  loading?: boolean
  /** Genuine error message if metric failed to load */
  error?: string | null
  /** Interactive callback if clicking drills into details */
  onClick?: () => void
  /** Accessible title or tooltip */
  title?: string
  /** Additional styling classes */
  className?: string
  /** Active selected state */
  active?: boolean
  style?: React.CSSProperties
}

/**
 * PreOne High-Impact KPI Metric Card
 *
 * Combines Linear-style data refinement with preschool operational warmth.
 * Answers the three critical questions:
 * 1. What is being measured? (Concise uppercase label)
 * 2. What is the current value? (Strong tabular numeral)
 * 3. What meaningful context explains that value? (Trend, status, or subtitle)
 */
export function KpiMetricCard({
  label,
  value,
  unit,
  icon,
  iconClass = 'text-primary dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/30',
  trend,
  status,
  meta,
  loading = false,
  error,
  onClick,
  title,
  className = '',
  active = false,
  style,
}: KpiMetricCardProps) {
  // Skeleton state during initial retrieval
  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/80 bg-white/96 p-4 sm:p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-900/96 [box-shadow:var(--shadow-premium-card,inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.035))] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.035),0_4px_14px_rgba(0,0,0,0.16)] ${className}`}
        style={style}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="mt-3 h-7 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
    )
  }

  // Genuine error state (distinguished from zero or empty)
  if (error) {
    return (
      <div
        className={`rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 sm:p-5 shadow-xs dark:border-rose-900/50 dark:bg-rose-950/20 ${className}`}
        style={style}
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          {label}
        </div>
        <div className="mt-1 text-sm font-semibold text-rose-900 dark:text-rose-200">
          Data Unavailable
        </div>
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
          {error}
        </p>
      </div>
    )
  }

  const isClickable = Boolean(onClick)
  const isInteractive = isClickable
  const displayValue = value != null ? value : '—'

  return (
    <div
      className={`group relative rounded-2xl border border-slate-200/80 bg-white/96 p-4 sm:p-5 shadow-xs transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/96 [box-shadow:var(--shadow-premium-card,inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.035))] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.035),0_4px_14px_rgba(0,0,0,0.16)] ${
        isInteractive
          ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
          : ''
      } ${
        active
          ? 'ring-2 ring-purple-500/40 border-purple-400 dark:border-purple-600'
          : ''
      } ${className}`.trim()}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      title={title}
      style={style}
    >
      {/* Top Row: Metric Label & Optional Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        {icon && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${iconClass} transition-transform duration-200 group-hover:scale-105`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Primary Value Row: Tabular Numeral */}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
          {displayValue}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom Context Row: Status, Trend or Meta */}
      {(status || trend || meta) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          {status && (
            <div
              className={`flex items-center gap-1 font-medium ${
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
              <span className="text-[8px]" aria-hidden="true">●</span>
              <span>{status.text}</span>
            </div>
          )}

          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive !== undefined
                  ? trend.isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                  : trend.dir === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend.dir === 'down'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trend.text}
            </span>
          )}

          {meta && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {meta}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
