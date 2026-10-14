'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  PhoneCall,
  FileSpreadsheet,
  GraduationCap,
  LayoutGrid,
  BarChart3,
  Building,
  Calendar,
  Plus,
  Download,
  Share2,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/preone'
import { useI18n } from '@/lib/i18n'
import {
  AdmissionsNavigationRibbon,
  ADMISSIONS_MODULES,
  type AdmissionsNavigationModule,
} from './AdmissionsNavigationRibbon'

import { useAdmissionsCounts } from '@/lib/admissions/use-admissions-counts'

export { ADMISSIONS_MODULES, type AdmissionsNavigationModule }

export interface AdmissionsShellProps {
  title: string
  description?: string
  currentModuleKey?: string
  breadcrumbs?: { label: string; href?: string }[]
  children: React.ReactNode
  // Branch & Session selector support
  branches?: { id: string; name: string; isMain?: boolean }[]
  selectedBranchId?: string
  onBranchChange?: (branchId: string) => void
  sessions?: { id: string; name: string; isCurrent?: boolean }[]
  selectedSessionId?: string
  onSessionChange?: (sessionId: string) => void
  showSessionFilter?: boolean
  // Primary & Secondary actions
  onNewEnquiry?: () => void
  onImport?: () => void
  onSharePublicForm?: () => void
  actions?: React.ReactNode
  moduleCounts?: Partial<Record<string, number>>
  hideMobileHeaderAction?: boolean
}

export function AdmissionsShell({
  title,
  description,
  currentModuleKey,
  breadcrumbs,
  children,
  branches = [],
  selectedBranchId,
  onBranchChange,
  sessions = [],
  selectedSessionId,
  onSessionChange,
  showSessionFilter = false,
  onNewEnquiry,
  onImport,
  onSharePublicForm,
  actions,
  moduleCounts = {},
  hideMobileHeaderAction = false,
}: AdmissionsShellProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const { counts: syncCounts } = useAdmissionsCounts(selectedBranchId, selectedSessionId)

  const effectiveModuleCounts = React.useMemo(() => {
    return {
      ...(syncCounts || {}),
      ...(moduleCounts || {}),
    }
  }, [syncCounts, moduleCounts])

  const defaultCrumbs = [
    { label: t('nav.home') || 'Home', href: '/app' },
    { label: 'Admissions', href: '/app/admissions' },
  ]

  const finalCrumbs = breadcrumbs || (currentModuleKey ? [
    ...defaultCrumbs,
    { label: title },
  ] : defaultCrumbs)

  return (
    <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-4 pb-16">
      {/* ── Breadcrumb Navigation ── */}
      <Breadcrumbs items={finalCrumbs} />

      {/* ── Compact Admissions Module Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Global / Action Controls */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          {/* Branch Selector */}
          {branches.length > 0 && onBranchChange && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card border border-border/80 shadow-xs max-w-full min-w-0">
              <Building size={13} className="text-primary shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0 hidden sm:inline">
                Branch:
              </span>
              <select
                value={selectedBranchId}
                onChange={(e) => onBranchChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[190px] truncate max-w-full min-w-0"
              >
                {branches.length > 1 && (
                  <option value="__ALL_BRANCHES__">
                    All Branches ({branches.length})
                  </option>
                )}
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.code ? `(${b.code})` : ''} {b.isMain ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Academic Session Selector (Displayed only when relevant) */}
          {showSessionFilter && sessions.length > 0 && onSessionChange && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card border border-border/80 shadow-xs max-w-full min-w-0">
              <Calendar size={13} className="text-primary shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0 hidden sm:inline">
                Session:
              </span>
              <select
                value={selectedSessionId}
                onChange={(e) => onSessionChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[150px] truncate max-w-full min-w-0"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isCurrent ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Share Public Form Action */}
          {onSharePublicForm && (
            <button
              type="button"
              onClick={onSharePublicForm}
              className="btn btn-ghost btn-sm h-8.5 px-2.5 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
              title="Share Public Enquiry Link"
            >
              <Share2 size={13} className="text-muted-foreground" />
              <span className="hidden sm:inline">Share Form</span>
            </button>
          )}

          {/* Import CSV */}
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="btn btn-ghost btn-sm h-8.5 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
            >
              <Download size={13} />
              <span>Import</span>
            </button>
          )}

          {/* Primary Quick Action: New Enquiry */}
          {onNewEnquiry && (
            <button
              type="button"
              onClick={onNewEnquiry}
              className={`btn btn-primary btn-sm h-8.5 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs ${
                hideMobileHeaderAction ? 'hidden lg:inline-flex' : ''
              }`}
            >
              <Plus size={14} />
              <span>New Enquiry</span>
            </button>
          )}

          {/* Custom actions if supplied */}
          {actions}
        </div>
      </div>

      {/* ── Multi-Color Windows Navigation Ribbon (Signature Module Glows & Badges) ── */}
      <AdmissionsNavigationRibbon moduleCounts={effectiveModuleCounts} />

      {/* ── Page Content ── */}
      <div className="pt-1">
        {children}
      </div>
    </div>
  )
}
