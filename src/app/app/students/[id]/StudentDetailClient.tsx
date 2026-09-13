'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CalendarDays, Users, Wallet, Sparkles, Smartphone, Clock3,
  Shuffle, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import { Avatar, StatusBadge, Segmented, EmptyState } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, inr, timeAgo, enumLabel } from '@/lib/format'

interface Props {
  student: {
    id: string
    admissionNo: string
    seatNumber?: string | null
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
      guardianId: string
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
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [allocOpen, setAllocOpen] = useState(false)
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; capacity: number; programType: string }[]>([])
  const [history, setHistory] = useState<{ classroom: string; session: string; status: string; startedAt: string; endedAt: string | null; reason: string | null }[] | null>(null)
  const [busy, setBusy] = useState(false)

  const loadHistory = useCallback(async () => {
    const r = await fetch(`/api/v1/students/${student.id}/allocate`).then((r) => r.json())
    if (r.success) setHistory(r.data.history)
  }, [student.id])

  useEffect(() => {
    fetch('/api/v1/classrooms?pageSize=100').then((r) => r.json()).then((j) => {
      if (j.success) setClassrooms(j.data)
    }).catch(() => {})
    loadHistory()
  }, [loadHistory])

  const allocate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/v1/students/${student.id}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId: fd.get('classroomId'), reason: fd.get('reason') || undefined }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Allocation updated', `Now in ${json.data.classroom} — history preserved`)
      setAllocOpen(false)
      loadHistory()
      router.refresh()
    } else toast.error('Allocation blocked', json.error?.message)
  }

  const release = async (guardianId: string, guardianName: string) => {
    setBusy(true)
    const res = await fetch('/api/v1/operations/pickup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, guardianId }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) toast.success('Released', `${guardianName} verified — pickup recorded on child timeline`)
    else toast.error('RELEASE BLOCKED', json.error?.message || 'Not an authorised pickup contact — safety follow-up raised')
  }

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
            {student.seatNumber && (
              <span className="badge b-info" style={{ marginLeft: 6, fontSize: 11 }}>
                Seat: {student.seatNumber}
              </span>
            )}
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
          <button className="btn btn-secondary btn-sm" onClick={() => setAllocOpen(true)}>
            <Shuffle size={13} /> Change section
          </button>
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
                  {g.canPickup && (
                    <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => release(g.guardianId, g.name)}>
                      <ShieldCheck size={13} /> Release
                    </button>
                  )}
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

      {/* Allocation history (never overwritten — M01 Spec §10) */}
      {history && history.length > 0 && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Allocation history</div>
              <div className="card-sub">Per academic year — promotions and transfers preserve the full trail</div>
            </div>
            <Shuffle size={16} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h) => (
              <div key={h.classroom + h.startedAt} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <b style={{ fontSize: 13, flex: 1 }}>{h.classroom}</b>
                <span className="t-caption">{h.session}</span>
                <StatusBadge status={h.status} />
                <span className="t-caption">{fmtDate(h.startedAt)}{h.endedAt ? ` → ${fmtDate(h.endedAt)}` : ' → now'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allocate / transfer modal */}
      <Modal open={allocOpen} onClose={() => setAllocOpen(false)} title="Allocate / Transfer" subtitle="Capacity-guarded · audited · history preserved" icon={<Shuffle size={20} />}>
        <form onSubmit={allocate}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>New section <span className="req">*</span></label>
            <select className="select" name="classroomId" required defaultValue="">
              <option value="" disabled>Select section</option>
              {classrooms.filter((c) => c.name !== student.classroom?.name).map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {enumLabel(c.programType)} (cap {c.capacity})</option>
              ))}
            </select>
            <span className="helper">Full sections are blocked with a visible exception (no silent overbooking).</span>
          </div>
          <div className="field">
            <label>Reason</label>
            <select className="select" name="reason" defaultValue="Section change">
              <option>Section change</option>
              <option>TRANSFER</option>
              <option>Program move</option>
              <option>Parent request</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAllocOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Allocate</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
