'use client'

import React from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CreditCard,
  Award,
  ShieldCheck,
  Inbox,
  FileBarChart,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import type { HRTabKey } from './types'
import { GlobalModuleNavigation, getHrNavConfig } from '@/components/preone'

interface HRHeaderProps {
  activeTab: HRTabKey
  onTabChange: (tab: HRTabKey) => void
  lastSyncTime?: string
  searchQuery: string
  onSearchChange: (q: string) => void
  onRefresh: () => void
  busy?: boolean
  pendingRequestsCount?: number
  onOpenOnboard?: () => void
  canWrite?: boolean
  canPayroll?: boolean
  canApprove?: boolean
  onOpenProcessPayroll?: () => void
}

export function HRHeader({
  activeTab,
  onTabChange,
  lastSyncTime,
  searchQuery,
  onSearchChange,
  onRefresh,
  busy,
  pendingRequestsCount = 0,
  onOpenOnboard,
  canWrite,
  canPayroll,
  canApprove,
  onOpenProcessPayroll,
}: HRHeaderProps) {
  // Render contextual action buttons per active tab
  const renderContextualActions = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <button
              onClick={() => onTabChange('requests')}
              className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
            >
              <Inbox size={14} className="text-orange-500" />
              <span>View Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="badge b-warning text-[10px] px-1.5 py-0 font-bold ml-0.5">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onTabChange('payroll')}
              className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
            >
              <CreditCard size={14} className="text-primary" />
              <span>Payroll</span>
            </button>
            {canWrite && onOpenOnboard && (
              <button
                onClick={onOpenOnboard}
                className="btn btn-primary btn-sm h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
              >
                <Plus size={14} />
                <span>Add Employee</span>
              </button>
            )}
          </>
        )

      case 'employees':
        return (
          canWrite && onOpenOnboard && (
            <button
              onClick={onOpenOnboard}
              className="btn btn-primary btn-sm h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
            >
              <Plus size={14} />
              <span>Add Employee</span>
            </button>
          )
        )

      case 'attendance':
        return (
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <button
              onClick={() => onTabChange('schedule')}
              className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
            >
              <CalendarRange size={14} className="text-indigo-500" />
              <span>View Roster</span>
            </button>
          </div>
        )

      case 'leave':
        return (
          <button
            onClick={() => onTabChange('requests')}
            className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
          >
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Review Requests</span>
          </button>
        )

      case 'schedule':
        return (
          <button
            onClick={() => onTabChange('employees')}
            className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
          >
            <Users size={14} className="text-primary" />
            <span>Staff Directory</span>
          </button>
        )

      case 'payroll':
        return (
          canPayroll && onOpenProcessPayroll && (
            <button
              onClick={onOpenProcessPayroll}
              className="btn btn-primary btn-sm h-9 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
            >
              <CreditCard size={14} />
              <span>Process Payroll</span>
            </button>
          )
        )

      case 'training':
        return (
          <button
            onClick={() => onTabChange('reports')}
            className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
          >
            <FileText size={14} className="text-cyan-500" />
            <span>Compliance Report</span>
          </button>
        )

      case 'requests':
        return (
          <button
            onClick={() => onTabChange('leave')}
            className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
          >
            <CalendarDays size={14} className="text-amber-500" />
            <span>Leave Balances</span>
          </button>
        )

      case 'reports':
        return (
          <button
            onClick={onRefresh}
            className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
          >
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            <span>Refresh Analytics</span>
          </button>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* ── 1. HR Module Hero Section ── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
          {/* Left: Eyebrow + Heading + Badge + Description */}
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                PEOPLE & OPERATIONS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                M07 Control Plane
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              HR & Workforce
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Manage preschool educators, attendance, leave, classroom assignments, payroll, training and staff operations.
            </p>
          </div>

          {/* Right: Search + Refresh + Contextual Actions */}
          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            {/* Quick Staff Search */}
            <div className="relative min-w-[200px] sm:min-w-[220px] max-w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                className="input text-xs pl-8 pr-3 h-9 w-full rounded-xl bg-background/80"
                placeholder="Search staff, code, role..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value)
                  if (activeTab !== 'employees') onTabChange('employees')
                }}
              />
            </div>

            {/* Refresh / Sync Button */}
            <button
              onClick={onRefresh}
              disabled={busy}
              className="btn btn-ghost btn-sm h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border border-border/80 hover:bg-muted/50"
              title="Refresh HR Data"
            >
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">
                {lastSyncTime ? `Synced ${lastSyncTime}` : 'Sync'}
              </span>
            </button>

            {/* Contextual Actions */}
            {renderContextualActions()}
          </div>
        </div>
      </div>

      {/* ── 2. Windows / Metro-Inspired Module Navigation (10 Interactive Cards) ── */}
      {/* ── 2. Unified Global Module Navigation ── */}
      <GlobalModuleNavigation
        items={getHrNavConfig({ pendingRequestsCount })}
        activeId={activeTab}
        onSelect={(id) => onTabChange(id as HRTabKey)}
        ariaLabel="HR Modules"
        className="w-full"
      />
    </div>
  )
}
