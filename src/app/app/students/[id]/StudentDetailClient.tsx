'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CalendarDays, Users, Wallet, Sparkles, Smartphone, Clock3,
} from 'lucide-react'
import { Avatar, StatusBadge, Segmented, EmptyState } from '@/components/preone/ui'
import { fmtDate, inr, timeAgo, enumLabel } from '@/lib/format'

interface Props {
  student: {
    id: string
    admissionNo: string
    name: string
    firstName: string
    dob: string
    gender: string
    status: string
    bloodGroup: string | null
    address: string | null
    admissionDate: string
    classroom: { name: string; programType: string; teacher: string | null } | null
    guardians: {
      name: string; relationship: string; phone: string; email: string | null
      isPrimary: boolean; canPickup: boolean
    }[]
    attendance: {
      pct: number; present: number; total: number
      recent: { date: string; status: string }[]
    }
    invoices: {
      id: string; invoiceNumber: string; title: string
      totalCents: number; paidCents: number; balanceCents: number
      status: string; dueDate: string
    }[]
    observations: { id: string; narrative: string; milestoneTags: string | null; status: string; observedAt: string }[]
    timeline: { id: string; type: string; title: string; body: string | null; at: string }[]
  }
}

const TL_DOT: Record<string, string> = {
  OBSERVATION: 'g-purple', MILESTONE: 'g-yellow', MEAL: 'g-green', NAP: 'g-blue',
  ACTIVITY: 'g-pink', NOTE: '', INCIDENT: 'g-orange',
}

export function StudentDetailClient({ student }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState('overview')

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => router.push('/app/students')} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={14} /> All students
      </button>

      {/* Header card */}
      <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Avatar name={student.name} size="lg" />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="t-h2">{student.name}</h1>
            <StatusBadge status={student.status} />
          </div>
          <div className="t-body" style={{ marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{student.admissionNo}</span>
            {' · '}
            {student.classroom ? `${student.classroom.name} (${enumLabel(student.classroom.programType)})` : 'No classroom'}
            {' · '}
            {student.classroom?.teacher ? `Teacher: ${student.classroom.teacher}` : 'No teacher assigned'}
          </div>
          <div className="t-caption" style={{ marginTop: 6 }}>
            Born {fmtDate(student.dob)} · {enumLabel(student.gender)} · Admitted {fmtDate(student.admissionDate)}
            {student.bloodGroup ? ` · ${student.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="stat-mini" style={{ minWidth: 100 }}>
            <b>{student.attendance.pct}%</b>
            <span>Attendance</span>
          </div>
          <div className="stat-mini" style={{ minWidth: 100 }}>
            <b>{inr(student.invoices.reduce((s, i) => s + i.balanceCents, 0), { compact: true })}</b>
            <span>Fee balance</span>
          </div>
        </div>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'overview', label: 'Overview' },
          { key: 'guardians', label: `Guardians (${student.guardians.length})` },
          { key: 'attendance', label: 'Attendance' },
          { key: 'fees', label: `Fees (${student.invoices.length})` },
          { key: 'timeline', label: 'Timeline' },
        ]}
      />

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="dash-grid">
          <div className="card">
            <div className="card-head">
              <div className="card-title">Recent Observations</div>
              <Sparkles size={17} style={{ color: 'var(--preone-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {student.observations.map((o) => (
                <div key={o.id} style={{ background: 'var(--surface-muted)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <StatusBadge status={o.status} />
                    <span className="t-caption">{timeAgo(o.observedAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, marginTop: 6 }}>{o.narrative}</p>
                  {o.milestoneTags && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {o.milestoneTags.split(',').map((m) => (
                        <span key={m} className="badge b-primary" style={{ height: 20, fontSize: 10.5 }}>{m.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {student.observations.length === 0 && (
                <EmptyState icon={<Sparkles size={32} />} title="No observations yet" message="Teachers record learning observations from the Academics module." />
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Pickup Authorization</div>
              <Users size={17} style={{ color: 'var(--foreground-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {student.guardians.map((g) => (
                <div key={g.name + g.phone} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface-muted)', borderRadius: 12, padding: '10px 14px' }}>
                  <Avatar name={g.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 650 }}>
                      {g.name} {g.isPrimary && <span className="badge b-primary" style={{ height: 19, fontSize: 10 }}>Primary</span>}
                    </div>
                    <div className="t-caption">{enumLabel(g.relationship)} · {g.phone}</div>
                  </div>
                  <span className={`badge ${g.canPickup ? 'b-success' : 'b-neutral'}`}>
                    {g.canPickup ? 'Can pickup' : 'No pickup'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'guardians' && (
        <div className="card">
          <div className="card-head"><div className="card-title">Guardians</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {student.guardians.map((g) => (
              <div key={g.name + g.phone} className="card card-hover" style={{ boxShadow: 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={g.name} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                    <div className="t-caption">{enumLabel(g.relationship)}</div>
                  </div>
                </div>
                <div className="t-body-sm" style={{ marginTop: 10 }}>
                  📞 {g.phone}
                  <br />
                  {g.email || 'No email on file'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Attendance Record</div>
              <div className="card-sub">{student.attendance.present}/{student.attendance.total} days present ({student.attendance.pct}%)</div>
            </div>
            <CalendarDays size={17} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {student.attendance.recent.map((a) => (
              <div key={a.date} className="stat-mini" style={{ minWidth: 92, alignItems: 'center' }}>
                <span className="t-caption">{fmtDate(a.date).slice(0, 6)}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {student.attendance.recent.length === 0 && (
              <EmptyState icon={<CalendarDays size={32} />} title="No attendance yet" message="Attendance appears here once teachers start marking the register." />
            )}
          </div>
        </div>
      )}

      {tab === 'fees' && (
        <div className="dtable-wrap">
          <div className="table-toolbar">
            <div className="card-title">Fee Invoices</div>
            <Link href="/app/finance" className="btn btn-secondary btn-sm">Open Fee Manager</Link>
          </div>
          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Invoice</th><th>Due Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {student.invoices.map((i) => (
                  <tr key={i.id} onClick={() => router.push(`/app/finance?invoice=${i.id}`)}>
                    <td>
                      <span className="cell-strong" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{i.invoiceNumber}</span>
                      <span className="cell-sub">{i.title}</span>
                    </td>
                    <td>{fmtDate(i.dueDate)}</td>
                    <td>{inr(i.totalCents)}</td>
                    <td style={{ color: 'var(--success)' }}>{inr(i.paidCents)}</td>
                    <td style={{ fontWeight: 700, color: i.balanceCents > 0 ? '#DC2626' : undefined }}>{inr(i.balanceCents)}</td>
                    <td><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {student.invoices.length === 0 && (
              <EmptyState icon={<Wallet size={32} />} title="No invoices" message="Invoices raised for this student will appear here." />
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Child Timeline</div>
              <div className="card-sub">What parents see — auto-aggregated from daily ops & academics</div>
            </div>
            <Smartphone size={17} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div className="timeline">
            {student.timeline.map((t) => (
              <div className="tl-item" key={t.id}>
                <span className={`tl-dot ${TL_DOT[t.type] || ''}`} />
                <div className="tl-body">
                  <div className="tl-head">
                    <b>{t.title}</b>
                    <span className="badge b-neutral" style={{ height: 20, fontSize: 10.5 }}>{enumLabel(t.type)}</span>
                    <time>{timeAgo(t.at)}</time>
                  </div>
                  {t.body && <p>{t.body}</p>}
                </div>
              </div>
            ))}
            {student.timeline.length === 0 && (
              <EmptyState icon={<Clock3 size={32} />} title="Timeline is empty" message="Daily activities and observations will appear here in real time." />
            )}
          </div>
        </div>
      )}
    </>
  )
}
