'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, Sliders } from 'lucide-react'

export interface SetupIncompleteBannerProps {
  status: string
  completedSteps?: number
  totalSteps?: number
  setupHref?: string
}

export function SetupIncompleteBanner({
  status,
  completedSteps,
  totalSteps = 5,
  setupHref = '/app/setup',
}: SetupIncompleteBannerProps) {
  // Only render when setup status is not LIVE
  if (status === 'LIVE') return null

  const displayStatus = status === 'NOT_STARTED'
    ? 'Initial Setup Required'
    : status === 'READY_FOR_GO_LIVE'
    ? 'Ready for Go-Live'
    : status === 'READY_FOR_REVIEW'
    ? 'Ready for Review'
    : status === 'BLOCKED'
    ? 'Setup Blocked'
    : 'Setup Incomplete'

  return (
    <div
      role="region"
      aria-label="Setup Incomplete Notice"
      className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/40 p-4 transition-all shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 p-2 text-amber-700 dark:text-amber-300 shrink-0">
            <AlertTriangle size={18} aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                Setup In Progress
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100">
                {displayStatus}
              </span>
            </div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              School configuration is not yet live. You are previewing the dashboard with real-time center data.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300/90">
              Complete the setup wizard (academic year, campuses, classrooms, and fees) to activate parent portals and public admissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0">
          <Link
            href={setupHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
          >
            <Sliders size={13} aria-hidden="true" />
            <span>Continue Setup</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}
