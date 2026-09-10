'use client'

import React from 'react'
import Link from 'next/link'
import {
  Users, CalendarCheck, Wallet, ClipboardList, ArrowRight, Activity, School,
} from 'lucide-react'
import { PageHead, KpiTile } from '@/components/preone/ui'
import { inr, timeAgo, enumLabel } from '@/lib/format'

interface Props {
  role: string
  perms: { students: boolean; admissions: boolean; finance: boolean; attendance: boolean }
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

export function DashboardClient({ role, perms, data }: Props) {
  const maxTrend = Math.max(...data.trend.map((t) => t.pct), 100)

  return (
    <>
      <PageHead
        title={`Namaste, ${role === 'TEACHER' ? 'Teacher' : role === 'PARENT' ? 'Parent' : 'Admin'}!`}
        sub="Aapke school ka aaj ka snapshot — sab kuch ek nazar mein."
      />

      {/* KPI row — 4 tiles max (design law) */}
      <div className="kpi-row">
        {perms.students && (
          <KpiTile
            label="Active Students"
            value={data.activeStudents}
            icon={<Users />}
            iconClass="ic-purple"
            meta={`${data.classrooms.length} classrooms`}
            trend={{ dir: 'flat', text: 'All branches' }}
          />
        )}
        {perms.attendance && (
          <KpiTile
            label="Present Today"
            value={data.presentToday}
            icon={<CalendarCheck />}
            iconClass="ic-green"
            meta={`${data.attendancePct}% attendance`}
            trend={{ dir: data.attendancePct >= 85 ? 'up' : 'down', text: `${data.attendancePct}%` }}
          />
        )}
        {perms.finance && (
          <KpiTile
            label="Fees Collected"
            value={inr(data.collected, { compact: true })}
            icon={<Wallet />}
            iconClass="ic-yellow"
            meta={`${data.collectRate}% of ${inr(data.billed, { compact: true })} billed`}
            trend={{ dir: data.collectRate >= 90 ? 'up' : 'flat', text: `${data.collectRate}%` }}
          />
        )}
        {perms.admissions && (
          <KpiTile
            label="Pending Admissions"
            value={data.pendingApps}
            icon={<ClipboardList />}
            iconClass="ic-pink"
            meta={`${data.newLeads} new leads to call`}
            trend={{ dir: 'flat', text: 'Pipeline' }}
          />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }} className="dash-grid">
        {/* Attendance trend chart */}
        {perms.attendance && (
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Attendance This Week</div>
                <div className="card-sub">Daily present % across all classrooms</div>
              </div>
              <span className="badge b-success b-dot">Live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, padding: '8px 4px 0' }}>
              {data.trend.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span className="t-caption" style={{ fontWeight: 700 }}>{t.pct}%</span>
                  <div
                    style={{
                      width: '100%', maxWidth: 46, borderRadius: '10px 10px 6px 6px',
                      height: `${Math.max(6, (t.pct / maxTrend) * 120)}px`,
                      background: t.pct >= 85
                        ? 'linear-gradient(180deg,#10B981,#34d399)'
                        : 'linear-gradient(180deg,var(--preone-primary),#9F67FF)',
                      transition: 'height var(--motion-slow) var(--ease-standard)',
                    }}
                  />
                  <span className="t-caption">{t.label}</span>
                </div>
              ))}
            </div>
            <div className="card-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="t-caption">Green bars = healthy days (≥85%)</span>
              <Link href="/app/attendance" className="btn btn-ghost btn-sm">
                Mark attendance <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Overdue + quick actions */}
        {perms.finance && (
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Fee Health</div>
                <div className="card-sub">Collections & outstanding</div>
              </div>
              <span className={`badge ${data.overdue > 0 ? 'b-danger' : 'b-success'}`}>
                {data.overdue > 0 ? 'Action needed' : 'On track'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="stat-mini">
                <b>{inr(data.collected, { compact: true })}</b>
                <span>Collected till date</span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="t-caption">Collection rate</span>
                  <span className="t-caption" style={{ fontWeight: 700 }}>{data.collectRate}%</span>
                </div>
                <div className="progressbar"><i style={{ width: `${data.collectRate}%` }} /></div>
                <div style={{ fontSize: 11, color: 'var(--foreground-muted)', marginTop: 6 }}>
                  Target: 92% (North Star metric)
                </div>
              </div>
              <div className="stat-mini" style={{ background: data.overdue > 0 ? 'var(--danger-soft)' : 'var(--surface-muted)' }}>
                <b style={{ color: data.overdue > 0 ? '#DC2626' : undefined }}>{inr(data.overdue, { compact: true })}</b>
                <span>Overdue outstanding</span>
              </div>
              <Link href="/app/finance" className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
                Open Fee Manager <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="dash-grid">
        {/* Classrooms */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Classrooms</div>
              <div className="card-sub">Enrollment vs capacity</div>
            </div>
            <School size={18} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.classrooms.map((c) => {
              const pct = Math.round((c.students / Math.max(1, c.capacity)) * 100)
              return (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {c.name} <span className="t-caption">· {enumLabel(c.programType)}</span>
                    </span>
                    <span className="t-caption">{c.students}/{c.capacity}</span>
                  </div>
                  <div className="progressbar" style={{ height: 5 }}>
                    <i style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              )
            })}
            {data.classrooms.length === 0 && (
              <p className="t-body">No classrooms yet — create them in Settings.</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-sub">Audit trail — last 8 events</div>
            </div>
            <Activity size={18} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div className="timeline">
            {data.recentActivity.map((a, i) => (
              <div className="tl-item" key={i}>
                <span className="tl-dot" />
                <div className="tl-body">
                  <div className="tl-head">
                    <b style={{ fontSize: 13 }}>{a.summary}</b>
                  </div>
                  <p style={{ fontSize: 12 }}>
                    {a.actor || 'System'} · {timeAgo(a.at)}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="t-body">No activity yet — things are about to get busy!</p>
            )}
          </div>
        </div>
      </div>

    </>
  )
}
