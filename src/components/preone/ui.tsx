'use client'

import React from 'react'
import { initials, avatarClass, enumLabel } from '@/lib/format'

export function Avatar({ name, size, className }: { name: string; size?: 'sm' | 'lg'; className?: string }) {
  return (
    <span className={`avatar ${size || ''} ${avatarClass(name)} ${className || ''}`} aria-hidden="true">
      {initials(name)}
    </span>
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
  icon, title, message, action,
}: {
  icon: React.ReactNode
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-art">{icon}</div>
      <h4>{title}</h4>
      <p>{message}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  )
}

export function KpiTile({
  label, value, unit, icon, iconClass, meta, trend,
}: {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  iconClass: string
  meta?: string
  trend?: { dir: 'up' | 'down' | 'flat'; text: string }
}) {
  return (
    <div className="kpi">
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
  title, sub, actions,
}: {
  title: string
  sub?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="t-h1">{title}</h1>
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

export function Skeleton({ h = 16, w }: { h?: number; w?: number | string }) {
  return <div className="skel" style={{ height: h, width: w ?? '100%' }} />
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
