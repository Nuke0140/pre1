'use client'

import React from 'react'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  HelpCircle,
} from 'lucide-react'
import type { SeatAvailabilityStatus } from '@/lib/admissions/capacity-service'

export interface SeatAvailabilityBadgeProps {
  status?: SeatAvailabilityStatus | string
  availableSeats?: number
  capacity?: number
  enrolledCount?: number
  totalOccupied?: number
  statusLabel?: string
  occupancySummary?: string
  size?: 'xs' | 'sm' | 'md'
  variant?: 'badge' | 'pill' | 'subtle'
  showOccupancy?: boolean
  showIcon?: boolean
  pulseOnLimited?: boolean
  className?: string
}

export function SeatAvailabilityBadge({
  status: rawStatus,
  availableSeats,
  capacity,
  enrolledCount,
  totalOccupied,
  statusLabel: customStatusLabel,
  occupancySummary: customOccupancySummary,
  size = 'sm',
  variant = 'badge',
  showOccupancy = false,
  showIcon = true,
  pulseOnLimited = true,
  className = '',
}: SeatAvailabilityBadgeProps) {
  // Derive status if not explicitly provided
  let status: SeatAvailabilityStatus = 'UNCONFIGURED'
  if (rawStatus) {
    status = rawStatus as SeatAvailabilityStatus
  } else if (capacity !== undefined && capacity > 0) {
    const occupied = totalOccupied ?? enrolledCount ?? 0
    const avail = availableSeats ?? Math.max(0, capacity - occupied)
    if (avail === 0) {
      status = 'WAITLIST_ONLY'
    } else if (avail <= 3) {
      status = 'LIMITED'
    } else {
      status = 'AVAILABLE'
    }
  }

  // Derive statusLabel
  let statusLabel = customStatusLabel
  if (!statusLabel) {
    if (status === 'UNCONFIGURED') {
      statusLabel = 'Capacity not set'
    } else if (status === 'WAITLIST_ONLY') {
      statusLabel = 'Full · Waitlist only'
    } else if (status === 'FULL') {
      statusLabel = 'Full'
    } else if (availableSeats !== undefined) {
      statusLabel = availableSeats === 1 ? '1 seat left' : `${availableSeats} seats left`
    } else if (status === 'LIMITED') {
      statusLabel = 'Limited seats'
    } else {
      statusLabel = 'Seats available'
    }
  }

  // Derive occupancy text
  const occupancyText =
    customOccupancySummary ||
    (capacity !== undefined && (totalOccupied !== undefined || enrolledCount !== undefined)
      ? `${totalOccupied ?? enrolledCount ?? 0}/${capacity} occupied`
      : null)

  const isXs = size === 'xs'
  const isSmall = size === 'sm'
  const iconSize = isXs ? 10 : isSmall ? 12 : 14

  let colorClasses = ''
  let IconComponent = CheckCircle2

  switch (status) {
    case 'AVAILABLE':
      colorClasses =
        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
      IconComponent = CheckCircle2
      break
    case 'LIMITED':
      colorClasses =
        'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60'
      IconComponent = AlertCircle
      break
    case 'FULL':
      colorClasses =
        'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60'
      IconComponent = XCircle
      break
    case 'WAITLIST_ONLY':
      colorClasses =
        'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200/80 dark:border-violet-800/60'
      IconComponent = Clock
      break
    case 'UNCONFIGURED':
    default:
      colorClasses = 'bg-muted/50 text-muted-foreground border-border/80'
      IconComponent = HelpCircle
      break
  }

  const sizeClasses = isXs
    ? 'text-[10px] px-1.5 py-0.2'
    : isSmall
    ? 'text-[11px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1'

  const roundedClasses = variant === 'pill' ? 'rounded-full' : 'rounded-lg'

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold border transition-colors select-none ${roundedClasses} ${sizeClasses} ${colorClasses} ${className}`.trim()}
      role="status"
      aria-label={`${statusLabel}${showOccupancy && occupancyText ? ` (${occupancyText})` : ''}`}
    >
      {showIcon && (
        <span
          className={`shrink-0 flex items-center justify-center ${
            status === 'LIMITED' && pulseOnLimited ? 'animate-pulse text-amber-600 dark:text-amber-400' : ''
          }`}
          aria-hidden="true"
        >
          <IconComponent size={iconSize} />
        </span>
      )}
      <span className="whitespace-nowrap">{statusLabel}</span>
      {showOccupancy && occupancyText && (
        <>
          <span className="opacity-40 text-[9px] font-normal" aria-hidden="true">
            ·
          </span>
          <span className="opacity-80 text-[10.5px] font-normal whitespace-nowrap">{occupancyText}</span>
        </>
      )}
    </span>
  )
}
