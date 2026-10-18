'use client'

import React from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  HeartPulse,
  Utensils,
  Droplet,
  Info,
  ChevronRight,
} from 'lucide-react'
import {
  getStudentSafetySummary,
  SafetyAlertItem,
  StudentSafetySource,
  StudentSafetySummary,
} from '@/lib/students/safety-alerts'

export interface StudentSafetyBadgesProps {
  student?: StudentSafetySource | null
  summary?: StudentSafetySummary | null
  maxVisible?: number
  size?: 'xs' | 'sm' | 'md'
  showBloodGroup?: boolean
  showSafeState?: boolean
  onOpenSafety?: (e: React.MouseEvent) => void
  className?: string
}

export function StudentSafetyBadges({
  student,
  summary: propSummary,
  maxVisible = 2,
  size = 'sm',
  showBloodGroup = false,
  showSafeState = false,
  onOpenSafety,
  className = '',
}: StudentSafetyBadgesProps) {
  const summary = propSummary || getStudentSafetySummary(student)

  if (!summary.hasAlerts && !showBloodGroup && !showSafeState) {
    return null
  }

  const visibleAlerts = summary.alerts.slice(0, maxVisible)
  const overflowCount = Math.max(0, summary.alerts.length - maxVisible)

  const handleGroupClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenSafety?.(e)
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1 rounded-md font-semibold',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-lg font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-xl font-bold',
  }[size]

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
  }[size]

  return (
    <div
      className={`inline-flex items-center flex-wrap gap-1.5 ${className}`}
      onClick={handleGroupClick}
      role={onOpenSafety ? 'button' : undefined}
      tabIndex={onOpenSafety ? 0 : undefined}
      aria-label={
        summary.hasAlerts
          ? `Safety alerts: ${summary.alerts.map((a) => a.label).join(', ')}. Click to view emergency details.`
          : 'Safety information'
      }
      onKeyDown={(e) => {
        if (onOpenSafety && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          e.stopPropagation()
          onOpenSafety(e as unknown as React.MouseEvent)
        }
      }}
    >
      {/* 1. Blood Group Badge (Optional / Compact) */}
      {showBloodGroup && summary.bloodGroup && (
        <span
          className={`inline-flex items-center border font-mono tracking-tight shrink-0 transition-transform hover:scale-105 ${sizeClasses} bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60 shadow-2xs`}
          title={`Blood Group: ${summary.bloodGroup}`}
        >
          <Droplet size={iconSizes} className="fill-rose-500 text-rose-500 shrink-0" />
          <span>{summary.bloodGroup}</span>
        </span>
      )}

      {/* 2. Visible Safety Alert Badges */}
      {visibleAlerts.map((alert) => {
        const isCritical = alert.severity === 'CRITICAL'
        const isWarning = alert.severity === 'WARNING'

        let badgeStyle =
          'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60'
        let IconComponent = HeartPulse

        if (isCritical) {
          badgeStyle =
            'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/80 shadow-2xs font-extrabold'
          IconComponent = ShieldAlert
        } else if (isWarning) {
          badgeStyle =
            'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60 shadow-2xs'
          IconComponent = alert.type === 'DIETARY' ? Utensils : AlertTriangle
        }

        return (
          <span
            key={alert.id}
            className={`inline-flex items-center border truncate max-w-[170px] sm:max-w-[200px] transition-all hover:scale-105 cursor-pointer ${sizeClasses} ${badgeStyle}`}
            title={`${alert.type}: ${alert.label}${isCritical ? ' (CRITICAL EMERGENCY ALERT)' : ''} — Click to view instructions`}
          >
            <IconComponent
              size={iconSizes}
              className={`shrink-0 ${
                isCritical
                  ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                  : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-sky-600 dark:text-sky-400'
              }`}
            />
            <span className="truncate">{alert.label}</span>
          </span>
        )
      })}

      {/* 3. Overflow Counter Pill */}
      {overflowCount > 0 && (
        <span
          className={`inline-flex items-center border font-bold shrink-0 transition-transform hover:scale-105 cursor-pointer ${sizeClasses} ${
            summary.hasCriticalAlert
              ? 'bg-rose-100/80 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={`${overflowCount} more alert${overflowCount === 1 ? '' : 's'} recorded. Click to open emergency sheet.`}
        >
          <span>+{overflowCount} more</span>
          <ChevronRight size={iconSizes - 2} className="opacity-70 ml-0.5" />
        </span>
      )}

      {/* 4. Safe State Pill (When explicitly enabled) */}
      {!summary.hasAlerts && showSafeState && (
        <span
          className={`inline-flex items-center border text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 ${sizeClasses}`}
        >
          <span>No alerts</span>
        </span>
      )}
    </div>
  )
}
