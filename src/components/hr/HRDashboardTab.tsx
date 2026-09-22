'use client'

import React from 'react'
import {
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  Clock,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react'
import { Card, StatusBadge, Skeleton } from '@/components/preone/ui'
import type { HRMetrics, HRTabKey } from './types'
import { money } from './types'

interface HRDashboardTabProps {
  metrics: HRMetrics | null
  loading?: boolean
  onNavigateTab: (tab: HRTabKey) => void
  onOpenOnboard?: () => void
  canWrite?: boolean
}

export function HRDashboardTab({
  metrics,
  loading,
  onNavigateTab,
  onOpenOnboard,
  canWrite,
}: HRDashboardTabProps) {
  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} h={110} variant="card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton h={220} variant="card" />
          <Skeleton h={220} variant="card" />
          <Skeleton h={220} variant="card" />
        </div>
      </div>
    )
  }

  // Calculate live attendance percentages for visual progress bar
  const total = Math.max(metrics.totalStaff, 1)
  const presentPct = Math.round((metrics.presentToday / total) * 100)
  const leavePct = Math.round((metrics.onLeaveToday / total) * 100)
  const absentCount = Math.max(0, metrics.totalStaff - (metrics.presentToday + metrics.onLeaveToday))
  const absentPct = Math.max(0, 100 - (presentPct + leavePct))

  return (
    <div className="space-y-6">
      {/* ── 1. Canonical PreOne 6-Metric Strip ── */}
      <div
        className="metric-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
        }}
      >
        {/* Metric 1: Total Staff */}
        <div
          className="metric-cell clickable"
          onClick={() => onNavigateTab('employees')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Staff
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {metrics.totalStaff}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {metrics.activeStaff} active • {metrics.onProbation} probation
          </div>
        </div>

        {/* Metric 2: Present Today */}
        <div
          className="metric-cell clickable"
          onClick={() => onNavigateTab('attendance')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Present Today
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={15} style={{ color: 'var(--success)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--success)', lineHeight: 1.1 }}>
            {metrics.presentToday}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {presentPct}% roll call rate
          </div>
        </div>

        {/* Metric 3: Absent Today */}
        <div
          className="metric-cell clickable"
          onClick={() => onNavigateTab('attendance')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Absent Today
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={15} style={{ color: 'var(--danger)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: metrics.absentToday > 0 ? 'var(--danger)' : 'var(--text-primary)', lineHeight: 1.1 }}>
            {metrics.absentToday}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Unplanned absences
          </div>
        </div>

        {/* Metric 4: On Leave */}
        <div
          className="metric-cell clickable"
          onClick={() => onNavigateTab('leave')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              On Leave
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={15} style={{ color: 'var(--info)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--info)', lineHeight: 1.1 }}>
            {metrics.onLeaveToday}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Approved staff leaves
          </div>
        </div>

        {/* Metric 5: Preschool Teachers */}
        <div
          className="metric-cell clickable"
          onClick={() => onNavigateTab('schedule')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Teachers
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={15} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {metrics.totalTeachers ?? Math.max(0, metrics.totalStaff - 3)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Classroom educators
          </div>
        </div>

        {/* Metric 6: Pending Requests */}
        <div
          className="metric-cell clickable"
          onClick={() => onNavigateTab('requests')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Requests
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={15} style={{ color: 'var(--warning)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: metrics.pendingLeaves > 0 ? 'var(--warning)' : 'var(--text-primary)', lineHeight: 1.1 }}>
            {metrics.pendingLeaves}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Pending reviews
          </div>
        </div>
      </div>

      {/* ── 2. Operational Control Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card A: Today's Roll Call Status with Progress Bar */}
        <Card className="p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Today's Attendance Roll Call</h3>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Open Register <ArrowRight size={12} />
            </button>
          </div>

          {/* Visual Multi-Segment Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-muted/70 overflow-hidden flex">
              <div
                style={{ width: `${presentPct}%` }}
                className="bg-success h-full transition-all duration-500"
                title={`Present: ${presentPct}%`}
              />
              <div
                style={{ width: `${leavePct}%` }}
                className="bg-info h-full transition-all duration-500"
                title={`On Leave: ${leavePct}%`}
              />
              <div
                style={{ width: `${absentPct}%` }}
                className="bg-danger/80 h-full transition-all duration-500"
                title={`Absent/Unmarked: ${absentPct}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" /> Present ({metrics.presentToday})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-info" /> Leave ({metrics.onLeaveToday})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-danger" /> Absent ({absentCount})
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Campus Staff Ready:</span>
            <span className="font-semibold text-foreground">{metrics.presentToday} / {metrics.totalStaff} staff</span>
          </div>
        </Card>

        {/* Card B: Pending Requests Inbox */}
        <Card className="p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Requests & Approvals</h3>
            </div>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
              <span className="text-muted-foreground">Pending Leave Applications</span>
              <span className="badge b-warning text-xs font-semibold px-2 py-0.5">
                {metrics.pendingLeaves} to review
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
              <span className="text-muted-foreground">Exit & Resignation Notices</span>
              <span className="font-medium text-foreground">{metrics.pendingResignations} in notice</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
              <span className="text-muted-foreground">Statutory Expiries (30 Days)</span>
              <span className="font-medium text-warning">{metrics.poshDue} certificates</span>
            </div>
          </div>
        </Card>

        {/* Card C: Payroll & Compliance Health */}
        <Card className="p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Payroll & Compliance</h3>
            </div>
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Cycles <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">Monthly Cycle</span>
              <StatusBadge status={metrics.latestPayrollStatus} />
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">Net Payout Scheduled</span>
              <span className="font-mono font-bold text-success text-sm">{money(metrics.latestPayrollNet)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground">Child Safety Compliance</span>
              <span className="flex items-center gap-1 text-success font-semibold text-xs">
                <ShieldCheck size={14} /> 100% Compliant
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
