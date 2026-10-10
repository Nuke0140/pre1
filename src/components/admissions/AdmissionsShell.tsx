'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  PhoneCall,
  CalendarCheck2,
  FileSpreadsheet,
  GraduationCap,
  Hourglass,
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

export interface AdmissionsNavigationModule {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number | string
  accent: string // e.g. 'rose' | 'amber' | 'blue' | 'violet' | 'teal' | 'orange' | 'emerald' | 'indigo'
}

export const ADMISSIONS_MODULES: AdmissionsNavigationModule[] = [
  {
    key: 'enquiries',
    label: 'Enquiries',
    href: '/app/admissions/enquiries',
    icon: Users,
    accent: 'rose',
  },
  {
    key: 'follow-ups',
    label: 'Follow-ups',
    href: '/app/admissions/follow-ups',
    icon: PhoneCall,
    accent: 'amber',
  },
  {
    key: 'visits',
    label: 'Campus Visits',
    href: '/app/admissions/visits',
    icon: CalendarCheck2,
    accent: 'blue',
  },
  {
    key: 'applications',
    label: 'Applications',
    href: '/app/admissions/applications',
    icon: FileSpreadsheet,
    accent: 'violet',
  },
  {
    key: 'admitted',
    label: 'Confirmed Admissions',
    href: '/app/admissions/admitted',
    icon: GraduationCap,
    accent: 'teal',
  },
  {
    key: 'waiting-list',
    label: 'Waiting List',
    href: '/app/admissions/waiting-list',
    icon: Hourglass,
    accent: 'orange',
  },
  {
    key: 'classroom-placements',
    label: 'Classroom Placements',
    href: '/app/admissions/classroom-placements',
    icon: LayoutGrid,
    accent: 'emerald',
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/app/admissions/reports',
    icon: BarChart3,
    accent: 'indigo',
  },
]

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
}: AdmissionsShellProps) {
  const pathname = usePathname()
  const { t } = useI18n()

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
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Branch Selector */}
          {branches.length > 0 && onBranchChange && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card border border-border/80 shadow-xs">
              <Building size={13} className="text-primary shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0 hidden sm:inline">
                Branch:
              </span>
              <select
                value={selectedBranchId}
                onChange={(e) => onBranchChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isMain ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Academic Session Selector (Displayed only when relevant) */}
          {showSessionFilter && sessions.length > 0 && onSessionChange && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card border border-border/80 shadow-xs">
              <Calendar size={13} className="text-primary shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0 hidden sm:inline">
                Session:
              </span>
              <select
                value={selectedSessionId}
                onChange={(e) => onSessionChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[150px] truncate"
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
              className="btn btn-primary btn-sm h-8.5 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
            >
              <Plus size={14} />
              <span>New Enquiry</span>
            </button>
          )}

          {/* Custom actions if supplied */}
          {actions}
        </div>
      </div>

      {/* ── Compact Windows-Style Module Navigation Bar ── */}
      <div className="w-full overflow-x-auto no-scrollbar py-0.5">
        <nav
          className="inline-flex items-center gap-1 p-1 rounded-2xl bg-card border border-border/80 shadow-2xs text-xs"
          aria-label="Admissions Modules Navigation"
        >
          {/* Home Launcher link */}
          <Link
            href="/app/admissions"
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap font-medium ${
              pathname === '/app/admissions'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-80" />
            <span>Control Center</span>
          </Link>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* 8 Module Links */}
          {ADMISSIONS_MODULES.map((mod) => {
            const Icon = mod.icon
            const isActive = pathname.startsWith(mod.href)
            const count = moduleCounts[mod.key]

            return (
              <Link
                key={mod.key}
                href={mod.href}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-muted-foreground'} />
                <span className={isActive ? 'text-white font-bold' : ''}>{mod.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Page Content ── */}
      <div className="pt-1">
        {children}
      </div>
    </div>
  )
}
