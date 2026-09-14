'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CalendarDays, Users, Wallet, Sparkles, Smartphone, Clock3,
  Shuffle, ShieldCheck, ShieldAlert, Bus,
} from 'lucide-react'
import { Avatar, StatusBadge, Segmented, EmptyState } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, inr, timeAgo, enumLabel } from '@/lib/format'

interface Props {
  profile: any
}

const TL_DOT: Record<string, string> = {
  OBSERVATION: 'g-purple', MILESTONE: 'g-yellow', MEAL: 'g-green', NAP: 'g-blue',
  ACTIVITY: 'g-pink', NOTE: '', INCIDENT: 'g-orange',
}

export function StudentDetailClient({ profile }: Props) {
  const { student, admission, academic, guardians, attendance, finance, academics, timeline, audit } = profile
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [allocOpen, setAllocOpen] = useState(false)
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; capacity: number; programType: string }[]>([])
  const [history, setHistory] = useState<any[]>(academic?.allocations || [])
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
        <Avatar name={student?.name || student?.fullName || student?.firstName} size="lg" />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="t-h2">{student?.name || student?.fullName || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student'}</h1>
            <StatusBadge status={student?.status || 'ACTIVE'} />
          </div>
          <div className="t-body" style={{ marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{student?.admissionNo}</span>
            {student.seatNumber && (
              <span className="badge b-info" style={{ marginLeft: 6, fontSize: 11 }}>
                Seat: {student.seatNumber}
              </span>
            )}
            {' · '}
            {academic?.classroom ? `${academic.classroom.name} (${enumLabel(academic.classroom.programType)})` : 'No classroom'}
            {' · '}
            {academic?.classroom?.primaryTeacher ? `Teacher: ${academic.classroom.primaryTeacher.fullName}` : 'No teacher assigned'}
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
            <b>{attendance?.percentage || 0}%</b>
            <span>Attendance</span>
          </div>
          <div className="stat-mini" style={{ minWidth: 100 }}>
            <b>{inr(finance?.balanceCents || 0, { compact: true })}</b>
            <span>Fee balance</span>
          </div>
        </div>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'overview', label: 'Overview' },
          { key: 'guardians', label: `Guardians (${guardians?.length || 0})` },
          { key: 'academic', label: 'Academic & Class' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'transport', label: `Transport (${profile.transport?.activeAssignment ? 'Active' : 'None'})` },
          { key: 'fees', label: `Fees (${finance?.invoices?.length || 0})` },
          { key: 'observations', label: `Observations (${academics?.observations?.length || 0})` },
          { key: 'timeline', label: 'Timeline' },
          { key: 'audit', label: `Audit (${audit?.length || 0})` },
        ]}
      />


      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="dash-grid">
          <div className="card">
            <div className="card-head">
              <div className="card-title">Admission & Origin</div>
              <Sparkles size={17} style={{ color: 'var(--preone-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption">Application No</span>
                <b>{admission?.applicationNumber || 'Direct Enrollment'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption">Admission Status</span>
                <StatusBadge status={admission?.status || student.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption">Home Address</span>
                <span style={{ maxWidth: 200, textAlign: 'right', fontSize: 13 }}>{student.address || 'Not recorded'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span className="t-caption">Admission Date</span>
                <span>{fmtDate(student.admissionDate)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Pickup Authorization</div>
              <Users size={17} style={{ color: 'var(--foreground-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guardians.map((g: any) => (
                <div key={g.id || g.name} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface-muted)', borderRadius: 12, padding: '10px 14px' }}>
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
                    <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => release(g.id, g.name)}>
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
          <div className="card-head"><div className="card-title">Family & Guardians</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {guardians.map((g: any) => (
              <div key={g.id || g.name} className="card card-hover" style={{ boxShadow: 'none' }}>
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
                  ✉️ {g.email || 'No email on file'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {g.isPrimary && <span className="badge b-primary">Primary</span>}
                  {g.isFeePayer && <span className="badge b-info">Fee Payer</span>}
                  {g.portalAccount && <span className="badge b-success">Portal Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'academic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Current Enrollment</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <span className="t-caption">Academic Session</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{academic?.session?.name || 'Current Session'}</div>
              </div>
              <div>
                <span className="t-caption">Classroom / Section</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{academic?.classroom?.name || 'Unassigned'}</div>
              </div>
              <div>
                <span className="t-caption">Program</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{enumLabel(academic?.classroom?.programType || '')}</div>
              </div>
              <div>
                <span className="t-caption">Primary Teacher</span>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{academic?.classroom?.primaryTeacher?.fullName || 'Not assigned'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Allocation History</div>
                <div className="card-sub">Session-by-session allocation trail (immutable)</div>
              </div>
              <Shuffle size={16} style={{ color: 'var(--foreground-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {academic?.allocations?.map((h: any) => (
                <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <b style={{ fontSize: 13, flex: 1 }}>{h.classroomName} ({enumLabel(h.programType)})</b>
                  <span className="t-caption">{h.sessionName}</span>
                  <StatusBadge status={h.status} />
                  <span className="t-caption">{fmtDate(h.startedAt)}{h.endedAt ? ` → ${fmtDate(h.endedAt)}` : ' → now'}</span>
                </div>
              ))}
              {(!academic?.allocations || academic.allocations.length === 0) && (
                <EmptyState icon={<Shuffle size={32} />} title="No allocation history" message="Classroom allocations will appear here." />
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Attendance Record</div>
              <div className="card-sub">{attendance.present}/{attendance.totalTracked} days present ({attendance.percentage}%)</div>
            </div>
            <CalendarDays size={17} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {attendance?.recent?.map((a: any) => (
              <div key={a.id} className="stat-mini" style={{ minWidth: 92, alignItems: 'center' }}>
                <span className="t-caption">{fmtDate(a.date).slice(0, 6)}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {(!attendance?.recent || attendance.recent.length === 0) && (
              <EmptyState icon={<CalendarDays size={32} />} title="No attendance yet" message="Attendance appears here once teachers mark the register." />
            )}
          </div>
        </div>
      )}

      {tab === 'fees' && (
        <div className="dtable-wrap">
          <div className="table-toolbar">
            <div className="card-title">Fee Invoices & Balance</div>
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
                {finance?.invoices?.map((i: any) => (
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
            {(!finance?.invoices || finance.invoices.length === 0) && (
              <EmptyState icon={<Wallet size={32} />} title="No invoices" message="Invoices raised for this student will appear here." />
            )}
          </div>
        </div>
      )}

      {tab === 'observations' && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Learning Observations & Milestone Progress</div>
            <Sparkles size={17} style={{ color: 'var(--preone-primary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {academics?.observations?.map((o: any) => (
              <div key={o.id} style={{ background: 'var(--surface-muted)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <StatusBadge status={o.status} />
                  <span className="t-caption">{timeAgo(o.observedAt)}</span>
                </div>
                <p style={{ fontSize: 13, marginTop: 6 }}>{o.narrative}</p>
                {o.milestoneTags && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {o.milestoneTags.split(',').map((m: string) => (
                      <span key={m} className="badge b-primary" style={{ height: 20, fontSize: 10.5 }}>{m.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(!academics?.observations || academics.observations.length === 0) && (
              <EmptyState icon={<Sparkles size={32} />} title="No observations yet" message="Teachers record learning observations from the Academics module." />
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Child Timeline</div>
              <div className="card-sub">What parents see — auto-aggregated from daily operations, academics, and attendance</div>
            </div>
            <Smartphone size={17} style={{ color: 'var(--foreground-muted)' }} />
          </div>
          <div className="timeline">
            {timeline?.map((t: any) => (
              <div className="tl-item" key={t.id}>
                <span className={`tl-dot ${TL_DOT[t.type] || ''}`} />
                <div className="tl-body">
                  <div className="tl-head">
                    <b>{t.title}</b>
                    <span className="badge b-neutral" style={{ height: 20, fontSize: 10.5 }}>{enumLabel(t.type)}</span>
                    <time>{timeAgo(t.createdAt || t.at)}</time>
                  </div>
                  {t.body && <p>{t.body}</p>}
                </div>
              </div>
            ))}
            {(!timeline || timeline.length === 0) && (
              <EmptyState icon={<Clock3 size={32} />} title="Timeline is empty" message="Daily activities and events will appear here in real time." />
            )}
          </div>
        </div>
      )}

      {tab === 'transport' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="dash-grid">
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Active Transport Assignment</div>
                <div className="card-sub">Current bus route and designated pickup/drop stops</div>
              </div>
            </div>
            {profile.transport?.activeAssignment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--c-accent-subtle, rgba(245,158,11,0.08))', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{profile.transport.activeAssignment.route.name}</div>
                    <div className="t-caption" style={{ fontFamily: 'var(--font-mono)' }}>Code: {profile.transport.activeAssignment.route.code}</div>
                  </div>
                  <span className="badge b-success">ACTIVE</span>
                </div>
                <div className="detail-row">
                  <span>Vehicle / Bus:</span>
                  <b>{profile.transport.activeAssignment.route.vehicle ? `${profile.transport.activeAssignment.route.vehicle.registrationNumber} (${profile.transport.activeAssignment.route.vehicle.makeModel || 'School Bus'})` : 'Not assigned'}</b>
                </div>
                <div className="detail-row">
                  <span>Driver:</span>
                  <b>{profile.transport.activeAssignment.route.driverProfile?.user?.fullName || 'Not assigned'} {profile.transport.activeAssignment.route.driverProfile?.user?.phone ? `(${profile.transport.activeAssignment.route.driverProfile.user.phone})` : ''}</b>
                </div>
                <div className="detail-row">
                  <span>Bus Attendant:</span>
                  <b>{profile.transport.activeAssignment.route.attendantProfile?.user?.fullName || 'Not assigned'}</b>
                </div>
                <div className="detail-row">
                  <span>Morning Pickup Stop:</span>
                  <b>{profile.transport.activeAssignment.pickupStop.name} (Scheduled: {profile.transport.activeAssignment.pickupStop.morningPickupTime})</b>
                </div>
                <div className="detail-row">
                  <span>Evening Drop Stop:</span>
                  <b>{profile.transport.activeAssignment.dropStop.name} (Scheduled: {profile.transport.activeAssignment.dropStop.eveningDropTime})</b>
                </div>
                <div className="detail-row">
                  <span>Monthly Transport Fee:</span>
                  <b>{profile.transport.activeAssignment.monthlyFeeCents > 0 ? inr(profile.transport.activeAssignment.monthlyFeeCents) : 'Complimentary / Included'}</b>
                </div>
              </div>
            ) : (
              <EmptyState icon={<Bus size={32} />} title="No Active Transport" message="This student is currently not enrolled in school bus transportation." />
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Recent Trips & Drop Verification</div>
                <div className="card-sub">Daily boarding and guardian handover log</div>
              </div>
            </div>
            {profile.transport?.recentTrips && profile.transport.recentTrips.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profile.transport.recentTrips.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <b>{item.trip.route.name} ({item.trip.tripType})</b>
                      <div className="t-caption">Stop: {item.stop.name} · {fmtDate(item.trip.tripDate)}</div>
                    </div>
                    <span className={`badge ${item.status === 'DROPPED' || item.status === 'BOARDED' ? 'b-success' : item.status === 'ABSENT' ? 'b-danger' : 'b-info'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Clock3 size={32} />} title="No Trip Records" message="Recent boarding and drop history will appear here." />
            )}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Audit Trail</div>
              <div className="card-sub">Immutable ledger of student lifecycle changes</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {audit?.map((a: any) => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span className="badge b-neutral">{a.action}</span>
                <div style={{ flex: 1 }}>
                  <b>{a.actorName || 'System'}</b> ({a.actorRole || 'SYSTEM'})
                  <div className="t-caption">{a.details ? JSON.stringify(a.details) : 'No extra metadata'}</div>
                </div>
                <time className="t-caption">{fmtDate(a.createdAt)}</time>
              </div>
            ))}
            {(!audit || audit.length === 0) && (
              <EmptyState icon={<Clock3 size={32} />} title="No audit entries" message="Audit logs will appear as changes occur." />
            )}
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
              {classrooms.filter((c) => c.name !== academic?.classroom?.name).map((c) => (
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
