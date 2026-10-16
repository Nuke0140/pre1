'use client'

import React from 'react'
import { Globe, Building2 } from 'lucide-react'
import type { SetupScope } from '@/lib/setup/scope-model'

export interface SetupScopeBadgeProps {
  scope: SetupScope | 'TENANT' | 'BRANCH' | string
  branchName?: string | null
  className?: string
  size?: 'sm' | 'md'
  showTooltip?: boolean
}

export function SetupScopeBadge({
  scope,
  branchName,
  className = '',
  size = 'sm',
  showTooltip = true,
}: SetupScopeBadgeProps) {
  const isGlobal = scope === 'TENANT' || scope === 'GLOBAL'

  const label = isGlobal
    ? 'All Branches'
    : branchName && branchName !== 'ALL' && branchName !== 'All Campuses (Aggregated)'
    ? `Branch Specific · ${branchName}`
    : 'Branch Specific'

  const tooltip = isGlobal
    ? 'School-Wide: Changes apply organization-wide across all campuses'
    : branchName && branchName !== 'ALL' && branchName !== 'All Campuses (Aggregated)'
    ? `Campus-Specific: Configuration belongs specifically to ${branchName}`
    : 'Campus-Specific: Configuration that varies by campus'

  const isSmall = size === 'sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${
        isGlobal
          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/80'
          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/80'
      } ${
        isSmall ? 'text-[10.5px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${className}`.trim()}
      title={showTooltip ? tooltip : undefined}
      aria-label={label}
      role="status"
    >
      {isGlobal ? (
        <span className="flex items-center gap-1">
          <Globe size={isSmall ? 11 : 13} className="shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <span>All Branches</span>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Building2 size={isSmall ? 11 : 13} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span className="truncate max-w-[170px]">{label}</span>
        </span>
      )}
    </span>
  )
}
