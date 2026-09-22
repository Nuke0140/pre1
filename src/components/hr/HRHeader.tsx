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
} from 'lucide-react'
import { PageHead } from '@/components/preone/ui'
import type { HRTabKey } from './types'

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
}

interface TabDef {
  key: HRTabKey
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number | string
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
}: HRHeaderProps) {
  const tabs: TabDef[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { key: 'leave', label: 'Leave', icon: CalendarDays },
    { key: 'schedule', label: 'Staff Schedule', icon: CalendarRange },
    { key: 'payroll', label: 'Payroll', icon: CreditCard },
    { key: 'performance', label: 'Performance', icon: Award },
    { key: 'training', label: 'Training', icon: ShieldCheck },
    { key: 'requests', label: 'Requests', icon: Inbox, badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
    { key: 'reports', label: 'Reports', icon: FileBarChart },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── 1. Canonical PreOne PageHead ── */}
      <PageHead
        eyebrow="Preschool Workforce & Operations"
        badge={
          <span className="badge b-primary b-dot" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            M07 Control Plane
          </span>
        }
        title="HR & Workforce"
        sub="Manage preschool educators, attendance roll calls, leave approvals, classroom allocations, and monthly compensation."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="relative min-w-[220px] hidden sm:block">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                className="input text-xs"
                style={{ paddingLeft: '2.25rem', height: 38 }}
                placeholder="Search staff, code, role..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value)
                  if (activeTab !== 'employees') onTabChange('employees')
                }}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={busy}
              className="btn btn-ghost"
              style={{
                height: 38,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
              }}
              title="Refresh HR data"
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
              <span>{lastSyncTime ? `Synced ${lastSyncTime}` : 'Refresh'}</span>
            </button>

            {/* Onboard Button */}
            {canWrite && onOpenOnboard && (
              <button
                onClick={onOpenOnboard}
                className="btn btn-primary"
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 10,
                  fontWeight: 650,
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                }}
              >
                <Plus size={15} />
                <span>Onboard Staff</span>
              </button>
            )}
          </div>
        }
      />

      {/* ── 2. Canonical PreOne Navigation Tabs ── */}
      <div className="tabs" role="tablist" style={{ borderBottom: '1px solid var(--border-default)' }}>
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              className="tab"
              onClick={() => onTabChange(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '11px 16px',
                fontSize: 13.5,
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'var(--warning)',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
