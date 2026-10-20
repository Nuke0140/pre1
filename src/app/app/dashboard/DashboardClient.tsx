'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  CalendarCheck,
  Wallet,
  ClipboardList,
  ArrowRight,
  Activity,
  School,
  Plus,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Baby,
  Package,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { KpiMetricCard } from '@/components/preone/ui'
import { LineChart, DonutChart } from '@/components/preone/Chart'
import { inr, timeAgo, enumLabel } from '@/lib/format'
import { SetupIncompleteBanner } from '@/components/dashboard/SetupIncompleteBanner'

interface Props {
  role: string
  perms: {
    students: boolean
    admissions: boolean
    finance: boolean
    attendance: boolean
    audit?: boolean
  }
  setup?: { status: string } | null
  sessionName?: string
  userName?: string
  data: {
    activeStudents: number
    presentToday: number
    attendancePct: number
    billed: number
    collected: number
    overdue: number
    collectRate: number
    pendingApps: number
    newLeads: number
    classrooms: { name: string; programType: string; students: number; capacity: number }[]
    trend: { label: string; pct: number }[]
    recentActivity: { summary: string; actor: string | null; at: string }[]
  }
}

export function DashboardClient({ role, perms, setup, sessionName, userName, data }: Props) {
  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
    if (hour < 17) return { text: 'Good afternoon', emoji: '🌤️' }
    return { text: 'Good evening', emoji: '🌙' }
  }, [])

  // Formatted date string (e.g. Tuesday, 20 Oct 2026)
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date())
  }, [])

  // Classroom metrics
  const totalCapacity = useMemo(
    () => data.classrooms.reduce((acc, c) => acc + (c.capacity || 0), 0),
    [data.classrooms]
  )
  const totalEnrolled = useMemo(
    () => data.classrooms.reduce((acc, c) => acc + (c.students || 0), 0),
    [data.classrooms]
  )
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  // Attendance trend metrics
  const avgAttendance = useMemo(() => {
    if (!data.trend || data.trend.length === 0) return 0
    const sum = data.trend.reduce((acc, t) => acc + (t.pct || 0), 0)
    return Math.round(sum / data.trend.length)
  }, [data.trend])

  const peakDay = useMemo(() => {
    if (!data.trend || data.trend.length === 0) return { label: '—', pct: 0 }
    return data.trend.reduce((best, cur) => (cur.pct > best.pct ? cur : best), data.trend[0])
  }, [data.trend])

  // Donut chart data for Fee Health
  const feeDonutData = useMemo(() => {
    const remaining = Math.max(0, data.billed - data.collected - data.overdue)
    const segments = []
    if (data.collected > 0) {
      segments.push({
        label: 'Collected',
        value: data.collected,
        color: '#10B981', // emerald
      })
    }
    if (data.overdue > 0) {
      segments.push({
        label: 'Overdue',
        value: data.overdue,
        color: '#EF4444', // red/rose
      })
    }
    if (remaining > 0) {
      segments.push({
        label: 'Pending / Due Later',
        value: remaining,
        color: '#6366F1', // indigo
      })
    }
    if (segments.length === 0) {
      segments.push({
        label: 'No Billed Invoices',
        value: 1,
        color: 'var(--border-subtle, #E2E8F0)',
      })
    }
    return segments
  }, [data.billed, data.collected, data.overdue])

  return (
    <div className="premium-enter flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* ── Setup Incomplete Non-Blocking Banner (OWNER/PRINCIPAL) ── */}
      {setup && setup.status !== 'LIVE' && (
        <SetupIncompleteBanner status={setup.status} />
      )}

      {/* ── 1. Modern Operational Command Center Hero ── */}
      <div className="operational-hero rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-7 relative overflow-hidden">
        {/* Soft decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="operational-hero-head relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20">
                <Sparkles size={13} className="text-primary" />
                Preschool Operations Command
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Clock size={12} className="text-slate-500" />
                {todayFormatted}
              </span>
            </div>

            <h1 className="operational-hero-title text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{greeting.emoji}</span>
              <span>
                {greeting.text},{' '}
                {userName || (role === 'TEACHER' ? 'Teacher' : role === 'PARENT' ? 'Parent' : 'Administrator')}!
              </span>
            </h1>

            <p className="operational-hero-sub text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Live operational pulse for your preschool — today&apos;s attendance, enrolled students, fee collections, and critical workflows.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="badge b-primary b-dot shadow-sm px-3 py-1.5 text-xs font-semibold">
              {sessionName ? `Session: ${sessionName}` : 'Active Academic Session'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Campus Live
            </span>
          </div>
        </div>

        {/* ── High-Impact Operational KPI Metrics Grid (§6) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
          {perms.students && (
            <div className="premium-enter premium-stagger-1 transform transition hover:-translate-y-0.5 duration-200">
              <KpiMetricCard
                label="Active Students"
                value={data.activeStudents}
                icon={<Users size={17} />}
                iconClass="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40"
                status={{
                  text: `${data.classrooms.length} active classrooms`,
                  variant: 'neutral',
                }}
              />
            </div>
          )}

          {perms.attendance && (
            <div className="premium-enter premium-stagger-2 transform transition hover:-translate-y-0.5 duration-200">
              <KpiMetricCard
                label="Present Today"
                value={data.presentToday}
                icon={<CalendarCheck size={17} />}
                iconClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40"
                status={{
                  text: `${data.attendancePct}% daily attendance`,
                  variant: data.attendancePct >= 85 ? 'success' : 'warning',
                }}
              />
            </div>
          )}

          {perms.finance && (
            <div className="premium-enter premium-stagger-3 transform transition hover:-translate-y-0.5 duration-200">
              <KpiMetricCard
                label="Fees Collected"
                value={inr(data.collected, { compact: true })}
                icon={<Wallet size={17} />}
                iconClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40"
                status={{
                  text: `${data.collectRate}% of ${inr(data.billed, { compact: true })} billed`,
                  variant: data.collectRate >= 80 ? 'success' : 'warning',
                }}
              />
            </div>
          )}

          {perms.admissions && (
            <div className="premium-enter premium-stagger-4 transform transition hover:-translate-y-0.5 duration-200">
              <KpiMetricCard
                label="Admissions Pipeline"
                value={data.pendingApps}
                icon={<ClipboardList size={17} />}
                iconClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40"
                status={{
                  text: `${data.newLeads} new leads to call`,
                  variant: 'info',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Quick Action Launchpad ── */}
      <div className="quick-action-strip flex items-center gap-2.5 flex-wrap p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="strip-label text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" />
          Quick Actions:
        </span>

        {perms.attendance && (
          <Link
            href="/app/daily-diary?tab=attendance"
            className="btn-action group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/80 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700/80 transition-all shadow-2xs"
          >
            <CalendarCheck size={14} className="text-primary group-hover:scale-110 transition-transform" />
            <span>Mark Attendance</span>
          </Link>
        )}

        {perms.students && (
          <Link
            href="/app/students"
            className="btn-action group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/80 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700/80 transition-all shadow-2xs"
          >
            <Plus size={14} className="text-primary group-hover:scale-110 transition-transform" />
            <span>Enroll Child</span>
          </Link>
        )}

        {perms.finance && (
          <Link
            href="/app/finance"
            className="btn-action group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/80 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700/80 transition-all shadow-2xs"
          >
            <Wallet size={14} className="text-primary group-hover:scale-110 transition-transform" />
            <span>Fee Manager</span>
          </Link>
        )}

        {perms.admissions && (
          <Link
            href="/app/admissions"
            className="btn-action group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/80 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700/80 transition-all shadow-2xs"
          >
            <ClipboardList size={14} className="text-primary group-hover:scale-110 transition-transform" />
            <span>Review Pipeline</span>
          </Link>
        )}

        {/* Fast Receiving & Daily Diary shortcuts for smoother campus operations */}
        <Link
          href="/app/inventory/fast-receiving"
          className="btn-action group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/80 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700/80 transition-all shadow-2xs"
        >
          <Package size={14} className="text-primary group-hover:scale-110 transition-transform" />
          <span>Fast Stock Receive</span>
        </Link>

        <Link
          href="/app/daily-diary"
          className="btn-action group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary dark:bg-slate-800/80 dark:hover:bg-primary/20 border border-slate-200 dark:border-slate-700/80 transition-all shadow-2xs"
        >
          <BookOpen size={14} className="text-primary group-hover:scale-110 transition-transform" />
          <span>Classroom Diary</span>
        </Link>
      </div>

      {/* ── 3. Operational Analytics Workspace ── */}
      <div className="dash-grid grid grid-cols-1 lg:grid-cols-12 gap-6 premium-enter premium-stagger-2">
        {/* Attendance trend chart (7 cols on desktop) */}
        {perms.attendance && (
          <div className="card lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="card-head flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <div className="card-title text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarCheck size={18} className="text-primary" />
                    Weekly Attendance Dynamics
                  </div>
                  <div className="card-sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Daily present % across all classrooms
                  </div>
                </div>
                <span className="badge b-success b-dot text-xs font-semibold">Live Feed</span>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-3 gap-3 my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">7-Day Average</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {avgAttendance}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Peak Day</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {peakDay.label} ({peakDay.pct}%)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Today vs Target</span>
                  <span className={`text-base font-bold font-mono ${data.attendancePct >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {data.attendancePct >= 85 ? '✓ On Target' : '⚠️ Below 85%'}
                  </span>
                </div>
              </div>

              {/* Line Chart */}
              <div style={{ padding: '8px 4px' }}>
                <LineChart
                  data={data.trend.map((t) => ({ label: t.label, value: t.pct }))}
                  height={190}
                  ariaLabel="Weekly attendance dynamics line chart"
                  color="var(--primary)"
                  fillGradient
                  showGrid
                />
              </div>
            </div>

            <div className="card-foot pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-2">
              <span className="t-caption text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Target benchmark: ≥85% healthy attendance
              </span>
              <Link href="/app/daily-diary?tab=attendance" className="btn btn-ghost btn-sm text-xs font-semibold inline-flex items-center gap-1.5 text-primary hover:text-primary-focus">
                Open Daily Register <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Overdue + Fee Health (5 cols on desktop) */}
        {perms.finance && (
          <div className="card lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="card-head flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <div className="card-title text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet size={18} className="text-amber-500" />
                    Fee Health & Collection
                  </div>
                  <div className="card-sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Collections rate & outstanding balance
                  </div>
                </div>
                <span className={`badge ${data.overdue > 0 ? 'b-warning' : 'b-success'} text-xs font-semibold`}>
                  {data.overdue > 0 ? 'Follow-up Needed' : 'On Track'}
                </span>
              </div>

              {/* Donut Chart Visual & Efficiency Breakdown */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="flex justify-center items-center">
                  <DonutChart
                    data={feeDonutData}
                    size={150}
                    strokeWidth={18}
                    centerLabel={`${data.collectRate}%`}
                    centerSublabel="Collected"
                    ariaLabel="Fee collection breakdown chart"
                    showLegend={false}
                  />
                </div>

                <div className="flex flex-col gap-2.5 w-full sm:w-auto flex-1">
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Collected to Date</div>
                    <div className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-100">
                      {inr(data.collected, { compact: true })}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-lg border ${
                    data.overdue > 0
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-800/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/40'
                  }`}>
                    <div className={`text-[11px] font-semibold ${data.overdue > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      Overdue Outstanding
                    </div>
                    <div className={`text-lg font-bold font-mono ${data.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      {inr(data.overdue, { compact: true })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Target */}
              <div className="mt-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Collection Efficiency</span>
                  <span className="text-xs font-mono font-bold text-primary">{data.collectRate}%</span>
                </div>
                <div className="progressbar w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <i
                    style={{ width: `${Math.min(100, data.collectRate)}%` }}
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500 block"
                  />
                </div>
                <div className="flex justify-between items-center text-[11.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                  <span>Target: 92% recovery</span>
                  <span>Total Billed: {inr(data.billed, { compact: true })}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4">
              <Link
                href="/app/finance"
                className="btn btn-secondary btn-sm w-full justify-center text-xs font-semibold py-2.5 flex items-center gap-2"
              >
                <span>Open Finance Control Center</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Operations & Audit Workspace ── */}
      <div className="dash-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classrooms & Capacity */}
        <div className="card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="card-head flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <div className="card-title text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <School size={18} className="text-indigo-500" />
                  Classrooms & Enrollment
                </div>
                <div className="card-sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Student count vs licensed capacity
                </div>
              </div>

              {totalCapacity > 0 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {totalEnrolled} / {totalCapacity}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {overallOccupancy}% total occupancy
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3.5 mt-4">
              {data.classrooms.map((c) => {
                const pct = Math.round((c.students / Math.max(1, c.capacity)) * 100)
                // Color badges based on capacity ratio
                const isNearFull = pct >= 90
                const isOptimal = pct >= 70 && pct < 90

                return (
                  <div
                    key={c.name}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {enumLabel(c.programType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          {c.students} / {c.capacity}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                            isNearFull
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : isOptimal
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>

                    <div className="progressbar w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                      <i
                        style={{ width: `${Math.min(100, pct)}%` }}
                        className={`h-full rounded-full transition-all duration-300 block ${
                          isNearFull
                            ? 'bg-rose-500'
                            : isOptimal
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}

              {data.classrooms.length === 0 && (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <School size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="t-body text-sm font-medium text-slate-500 dark:text-slate-400">
                    No classrooms configured yet.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Add programs like Playgroup, Nursery, LKG, and Daycare in Settings.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Baby size={13} className="text-primary" />
              Preschool student-to-teacher ratio monitored
            </span>
            <Link href="/app/students" className="btn btn-ghost btn-sm text-xs font-semibold text-primary inline-flex items-center gap-1">
              View All Students <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Recent Activity — Strictly authorized */}
        {perms.audit && (
          <div className="card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="card-head flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <div className="card-title text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-emerald-500" />
                    Recent Operational Activity
                  </div>
                  <div className="card-sub text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time immutable audit trail
                  </div>
                </div>
                <ShieldCheck size={18} className="text-slate-400" />
              </div>

              <div className="timeline flex flex-col gap-3 mt-4">
                {data.recentActivity.map((a, i) => (
                  <div
                    key={i}
                    className="tl-item flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850/60 transition"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="tl-body flex-1 min-w-0">
                      <div className="tl-head text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {a.summary}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{a.actor || 'System'}</span>
                        <span>·</span>
                        <span>{timeAgo(a.at)}</span>
                      </p>
                    </div>
                  </div>
                ))}

                {data.recentActivity.length === 0 && (
                  <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Activity size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="t-body text-sm font-medium text-slate-500 dark:text-slate-400">
                      No recent activity recorded.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      System events, logins, and operational updates will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Immutable audit ledger active
              </span>
              <Link href="/app/audit" className="btn btn-ghost btn-sm text-xs font-semibold text-primary inline-flex items-center gap-1">
                Full Audit Log <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Preschool Operational Health Checklist (§Best Practice) ── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Daily Preschool Readiness Checklist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quick check on essential preschool workflows for today.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${data.presentToday > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>Attendance: {data.presentToday > 0 ? 'Recorded' : 'Pending'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${data.newLeads > 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              <span>Leads: {data.newLeads > 0 ? `${data.newLeads} to follow up` : 'All contacted'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${data.overdue > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>Fees: {data.overdue > 0 ? 'Overdue pending' : 'Clear'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
