'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { initials, avatarClass, enumLabel } from '@/lib/format'

export function Avatar({
  name,
  src,
  size,
  className,
}: {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [imgError, setImgError] = React.useState(false)
  const safeName = name || ''

  if (src && !imgError) {
    return (
      <span className={`avatar ${size || ''} ${className || ''}`} style={{ overflow: 'hidden', padding: 0 }} aria-hidden="true">
        <img
          src={src}
          alt={safeName}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
        />
      </span>
    )
  }

  return (
    <span className={`avatar ${size || ''} ${avatarClass(safeName)} ${className || ''}`} aria-hidden="true">
      {initials(safeName)}
    </span>
  )
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  title?: string
  variant?: 'ghost' | 'secondary' | 'outline' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  danger?: boolean
}

export function IconButton({
  icon,
  label,
  onClick,
  title,
  variant = 'ghost',
  size = 'md',
  danger = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  const tooltipText = title || label
  return (
    <button
      type={type}
      className={`btn-icon btn-icon-${size} btn-icon-${variant}${danger ? ' btn-icon-danger' : ''} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={tooltipText}
      {...rest}
    >
      {icon}
    </button>
  )
}

const STATUS_BADGE: Record<string, { cls: string; dot?: boolean }> = {
  // students
  ACTIVE: { cls: 'b-success', dot: true },
  INACTIVE: { cls: 'b-neutral' },
  TRANSFERRED: { cls: 'b-info' },
  GRADUATED: { cls: 'b-primary' },
  ARCHIVED: { cls: 'b-neutral' },
  // leads
  NEW: { cls: 'b-info', dot: true },
  CONTACTED: { cls: 'b-primary' },
  QUALIFIED: { cls: 'b-warning' },
  NURTURE: { cls: 'b-neutral' },
  APPLICATION_STARTED: { cls: 'b-orange' },
  CONVERTED: { cls: 'b-success' },
  LOST: { cls: 'b-danger' },
  DUPLICATE: { cls: 'b-neutral' },
  // applications
  SUBMITTED: { cls: 'b-info', dot: true },
  DOCUMENT_PENDING: { cls: 'b-warning' },
  VERIFIED: { cls: 'b-primary' },
  UNDER_REVIEW: { cls: 'b-warning' },
  APPROVED: { cls: 'b-success' },
  REJECTED: { cls: 'b-danger' },
  WAITLISTED: { cls: 'b-orange' },
  ENROLLED: { cls: 'b-success', dot: true },
  WITHDRAWN: { cls: 'b-neutral' },
  // invoices
  DRAFT: { cls: 'b-neutral' },
  ISSUED: { cls: 'b-info' },
  PARTIALLY_PAID: { cls: 'b-warning' },
  PAID: { cls: 'b-success', dot: true },
  OVERDUE: { cls: 'b-danger', dot: true },
  CANCELLED: { cls: 'b-neutral' },
  WRITTEN_OFF: { cls: 'b-neutral' },
  // attendance
  PRESENT: { cls: 'b-success' },
  ABSENT: { cls: 'b-danger' },
  LATE: { cls: 'b-warning' },
  HALF_DAY: { cls: 'b-info' },
  LEAVE: { cls: 'b-neutral' },
  // announcements
  GENERAL: { cls: 'b-neutral' },
  HOLIDAY: { cls: 'b-success' },
  EMERGENCY: { cls: 'b-danger' },
  EVENT: { cls: 'b-pink' },
  ACHIEVEMENT: { cls: 'b-orange' },
  IMPORTANT: { cls: 'b-warning' },
  FEE_REMINDER: { cls: 'b-info' },
  ACADEMIC: { cls: 'b-primary' },
  // observations
  PUBLISHED: { cls: 'b-success' },
  // inventory
  PENDING: { cls: 'b-warning', dot: true },
  PARTIALLY_FULFILLED: { cls: 'b-orange' },
  FULFILLED: { cls: 'b-success' },
  ORDERED: { cls: 'b-info' },
  PARTIALLY_RECEIVED: { cls: 'b-orange' },
  RECEIVED: { cls: 'b-success' },
  FINALIZED: { cls: 'b-success' },
  COMPLETED: { cls: 'b-success' },
  RETURNED: { cls: 'b-info' },
  CONSUMABLE: { cls: 'b-primary' },
  ASSET: { cls: 'b-info' },
  STATIONERY: { cls: 'b-pink' },
  LEARNING_KIT: { cls: 'b-warning' },
  UNIFORM: { cls: 'b-orange' },
  FIRST_AID: { cls: 'b-danger' },
  CLEANING: { cls: 'b-neutral' },
  KITCHEN_PANTRY: { cls: 'b-warning' },
  EVENT_PROP: { cls: 'b-pink' },
  OTHER: { cls: 'b-neutral' },
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = STATUS_BADGE[status] || { cls: 'b-neutral' }
  return (
    <span className={`badge ${cfg.cls}${cfg.dot ? ' b-dot' : ''}`}>
      {label || enumLabel(status)}
    </span>
  )
}

export function EmptyState({
  icon, title, message, action, why, kicker,
}: {
  icon: React.ReactNode
  title: string
  message: string
  action?: React.ReactNode
  why?: string
  kicker?: string
}) {
  const isIllustration = React.isValidElement(icon) && (Boolean((icon.props as any)?.size) || (icon.props as any)?.role === 'img')
  return (
    <div className="empty">
      <div className={`empty-art ${isIllustration ? 'empty-illustration' : ''}`}>{icon}</div>
      {kicker && <div className="empty-kicker">{kicker}</div>}
      <div className="empty-what">{title}</div>
      <p className="empty-why">{why || message}</p>
      {action && <div className="empty-next">{action}</div>}
    </div>
  )
}

export function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  style,
  as: Component = 'div',
  ...props
}: {
  children: React.ReactNode
  variant?: 'default' | 'compact' | 'featured' | 'metric' | 'interactive' | 'warning' | 'success' | 'info' | 'nav'
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
  as?: React.ElementType
  [key: string]: any
}) {
  const varClass = variant !== 'default' ? `card-${variant}` : ''
  return (
    <Component
      className={`card ${varClass} ${className}`.trim()}
      style={style}
      onClick={onClick}
      {...(onClick && Component === 'div' ? { role: 'button', tabIndex: 0 } : {})}
      {...props}
    >
      {children}
    </Component>
  )
}

export function KpiTile({
  label, value, unit, icon, iconClass, meta, trend, onClick, active, variant, hero, className = '',
}: {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  iconClass: string
  meta?: string
  trend?: { dir: 'up' | 'down' | 'flat'; text: string }
  onClick?: () => void
  active?: boolean
  variant?: 'hero' | 'primary' | 'secondary' | 'compact'
  hero?: boolean
  className?: string
}) {
  const isHero = hero || variant === 'hero' || variant === 'primary'
  const vClass = isHero ? 'kpi-hero' : variant ? `kpi-${variant}` : ''
  return (
    <div
      className={`kpi ${vClass}${onClick ? ' clickable' : ''}${active ? ' active' : ''} ${className}`}
      aria-pressed={onClick && active != null ? active : undefined}
      {...(onClick
        ? {
            role: 'button',
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            },
          }
        : {})}
    >
      <div className="kpi-top">
        <div className={`kpi-ic ${iconClass}`}>{icon}</div>
        {trend && <span className={`trend ${trend.dir}`}>{trend.text}</span>}
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {value}
          {unit && <span className="unit">{unit}</span>}
        </div>
      </div>
      {meta && <div className="kpi-meta">{meta}</div>}
    </div>
  )
}

export function PageHead({
  title, sub, actions, eyebrow, badge, backHref,
}: {
  title: React.ReactNode
  sub?: string
  actions?: React.ReactNode
  eyebrow?: string
  badge?: React.ReactNode
  backHref?: string
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {backHref && (
            <Link
              href={backHref}
              tabIndex={-1}
              className="btn btn-ghost"
              style={{
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                outline: 'none',
                boxShadow: 'none',
              }}
              title="Back"
            >
              <ChevronLeft size={18} />
            </Link>
          )}
          <h1 className="t-h1" style={{ margin: 0 }}>
            {title}
            {badge && <span className="page-head-badge">{badge}</span>}
          </h1>
        </div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Segmented({
  options, value, onChange,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (k: string) => void
}) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          suppressHydrationWarning
          key={o.key}
          role="tab"
          aria-selected={value === o.key}
          className={value === o.key ? 'on' : ''}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Skeleton({
  h, w, variant, className = '',
}: {
  h?: number | string
  w?: number | string
  variant?: 'text' | 'kpi' | 'row' | 'card'
  className?: string
}) {
  const vClass = variant ? `skel-${variant}` : ''
  const defaultHeight = variant === 'kpi' ? 124 : variant === 'card' ? 190 : variant === 'row' ? 42 : (h ?? 16)
  return <div className={`skel ${vClass} ${className}`} style={{ height: defaultHeight, width: w ?? '100%' }} />
}

export function Field({
  label, required, helper, children,
}: {
  label: string
  required?: boolean
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="field">
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {helper && <span className="helper">{helper}</span>}
    </div>
  )
}

export * from './Typography'

