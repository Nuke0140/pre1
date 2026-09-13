'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, CheckCircle2, CalendarCheck, Users, RefreshCw, Siren,
  QrCode, ScanLine, ShieldCheck, ShieldAlert, KeyRound,
} from 'lucide-react'
import { PageHead, KpiTile, StatusBadge, Skeleton, Avatar, EmptyState, Segmented, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { timeAgo } from '@/lib/format'

interface FollowUpItem {
  id: string
  domain: string
  severity: string
  status: string
  title: string
  detail?: string | null
  student: string | null
  classroom: string | null
  responsibleRole?: string
  createdAt: string
  dueAt?: string | null
  outcome?: string | null
  resolvedAt?: string | null
}

interface TodayData {
  today: string
  schoolStatus: { dayStatus: string; eventTitle: string | null; attendanceExpected: boolean; open: boolean }
  attendance: { expected: number; present: number; absent: number; unmarked: number; pct: number }
  sections: {
    id: string; name: string; programType: string; teacher: string | null
    capacity: number; expected: number; present: number; absent: number
    unmarked: number; attendancePct: number; understaffed: boolean
  }[]
  exceptions: {
    critical: FollowUpItem[]; attention: FollowUpItem[]; normalCount: number
    criticalCount: number; attentionCount: number; unresolvedTotal: number
  }
  activity: { careEventsToday: number; announcementsToday: number }
}

const SEVERITY_BADGE: Record<string, string> = {
  EMERGENCY: 'b-danger', URGENT: 'b-orange', WARNING: 'b-warning', INFO: 'b-info',
}

export function OperationsClient() {
  const toast = useToast()
  const [data, setData] = useState<TodayData | null>(null)
  const [items, setItems] = useState<FollowUpItem[]>([])
  const [busy, setBusy] = useState(false)

  // Scanner state
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [scanMode, setScanMode] = useState<'ARRIVAL' | 'PICKUP'>('ARRIVAL')
  const [scannedStudent, setScannedStudent] = useState<any>(null)
  const [selectedGuardianId, setSelectedGuardianId] = useState('')
  const [pickupPin, setPickupPin] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLookup = async (code: string) => {
    if (!code.trim()) return
    setScanLoading(true)
    setScanMessage(null)
    try {
      const res = await fetch(`/api/v1/operations/scan?code=${encodeURIComponent(code.trim())}`)
      const json = await res.json()
      if (json.success && json.data?.student) {
        setScannedStudent(json.data.student)
        if (json.data.student.guardians?.length > 0) {
          setSelectedGuardianId(json.data.student.guardians[0].id)
        }
      } else {
        setScannedStudent(null)
        setScanMessage({ type: 'error', text: json.error || 'Student not recognized' })
      }
    } catch (e: any) {
      setScanMessage({ type: 'error', text: e.message })
    } finally {
      setScanLoading(false)
    }
  }

  const handleExecuteScan = async () => {
    if (!scannedStudent) return
    setScanLoading(true)
    setScanMessage(null)
    try {
      const res = await fetch('/api/v1/operations/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: scannedStudent.admissionNo || scannedStudent.id,
          eventType: scanMode,
          guardianId: scanMode === 'PICKUP' ? selectedGuardianId : undefined,
          pin: scanMode === 'PICKUP' ? pickupPin : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setScanMessage({
          type: 'success',
          text: scanMode === 'ARRIVAL'
            ? `Arrival verified for ${json.data.student} at ${json.data.time} (${json.data.status})`
            : `Authorized pickup released for ${json.data.student} to ${json.data.guardian}`,
        })
        toast.success(scanMode === 'ARRIVAL' ? 'Arrival Confirmed' : 'Pickup Released')
        load()
      } else {
        setScanMessage({
          type: 'error',
          text: json.error || 'Security Alert: Operation Blocked',
        })
        toast.error('Release Blocked', json.error)
        load()
      }
    } catch (e: any) {
      setScanMessage({ type: 'error', text: e.message })
    } finally {
      setScanLoading(false)
    }
  }

  const load = useCallback(async () => {
    const [t, fu] = await Promise.all([
      fetch('/api/v1/operations/today').then((r) => r.json()),
      fetch('/api/v1/operations/follow-ups?take=100').then((r) => r.json()),
    ])
    if (t.success) setData(t.data)
    if (fu.success) setItems(fu.data.items)
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000) // live command centre refresh
    return () => clearInterval(t)
  }, [load])

  const act = async (id: string, action: string, outcome?: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/operations/follow-ups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, outcome }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success(`Follow-up ${action}nowledged`.replace('acknowledgenowledged', 'acknowledged'), outcome || 'Status updated — full audit trail kept')
      load()
    } else toast.error('Failed', json.error?.message)
  }

  if (!data) {
    return (
      <>
        <PageHead title="Operations — Command Centre" sub="Kya aaj school theek chal raha hai?" />
        <div className="kpi-row" style={{ marginBottom: 16 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={120} />)}
        </div>
        <Skeleton h={300} />
      </>
    )
  }

  const ex = data.exceptions
  const okDay = data.schoolStatus.open && data.schoolStatus.attendanceExpected

  const FollowUpRow = ({ f }: { f: FollowUpItem }) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <Avatar name={f.student || f.title} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <b style={{ fontSize: 13.5 }}>{f.title}</b>
          <span className={`badge ${SEVERITY_BADGE[f.severity] || 'b-neutral'}`}>{f.severity}</span>
          <StatusBadge status={f.status} />
        </div>
        <div className="t-caption" style={{ marginTop: 2 }}>
          {f.student && <>{f.student} · </>}{f.classroom && <>{f.classroom} · </>}{f.domain} · {timeAgo(f.createdAt)}
          {f.responsibleRole ? <> · owner: {f.responsibleRole}</> : null}
        </div>
        {f.detail && <p className="t-caption" style={{ marginTop: 4 }}>{f.detail}</p>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {f.status === 'OPEN' && (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act(f.id, 'acknowledge')}>
            Ack
          </button>
        )}
        {['OPEN', 'ACKNOWLEDGED'].includes(f.status) && (
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act(f.id, 'start')}>
            Start
          </button>
        )}
        {!['RESOLVED', 'CLOSED'].includes(f.status) && (
          <button
            className="btn btn-success btn-sm" disabled={busy}
            onClick={() => {
              const outcome = window.prompt('Resolution outcome (kya hua? kya kiya?)', '')
              if (outcome && outcome.trim()) act(f.id, 'resolve', outcome.trim())
            }}
          >
            <CheckCircle2 size={13} /> Resolve
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <PageHead
        title="Operations — Command Centre"
        sub={`${data.today} · ${okDay ? 'School open' : data.schoolStatus.dayStatus.replace(/_/g, ' ').toLowerCase()}${data.schoolStatus.eventTitle ? ` — ${data.schoolStatus.eventTitle}` : ''}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setScanModalOpen(true)
                setScanMessage(null)
                setScannedStudent(null)
                setScanCode('')
              }}
            >
              <QrCode size={14} /> Gate Scanner
            </button>
            <button className="btn btn-outline" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        }
      />

      <div className="kpi-row" style={{ marginBottom: 16 }}>
        <KpiTile
          label="Critical Exceptions"
          value={ex.criticalCount}
          icon={<Siren />}
          iconClass={ex.criticalCount > 0 ? 'ic-red' : 'ic-green'}
          meta={ex.criticalCount > 0 ? 'Health / safety / urgent open' : 'All clear'}
          trend={{ dir: ex.criticalCount > 0 ? 'down' : 'up', text: ex.criticalCount > 0 ? 'ACT NOW' : 'CLEAR' }}
        />
        <KpiTile
          label="Attention Items"
          value={ex.attentionCount}
          icon={<AlertTriangle />}
          iconClass="ic-yellow"
          meta={`${ex.normalCount} low-priority open`}
          trend={{ dir: ex.attentionCount > 0 ? 'down' : 'flat', text: `${ex.unresolvedTotal} total` }}
        />
        <KpiTile
          label="Attendance Today"
          value={`${data.attendance.pct}%`}
          icon={<CalendarCheck />}
          iconClass="ic-green"
          meta={`${data.attendance.present}/${data.attendance.expected} present${data.attendance.unmarked > 0 ? ` · ${data.attendance.unmarked} unmarked` : ''}`}
          trend={{ dir: data.attendance.pct >= 85 ? 'up' : 'down', text: `${data.attendance.absent} absent` }}
        />
        <KpiTile
          label="Today's Activity"
          value={data.activity.careEventsToday}
          icon={<Activity />}
          iconClass="ic-purple"
          meta={`${data.activity.announcementsToday} announcements sent`}
          trend={{ dir: 'flat', text: 'Care + comms' }}
        />
      </div>

      {/* CRITICAL band — safety first (Spec §34) */}
      <div className="card" style={{ marginBottom: 16, borderColor: ex.criticalCount > 0 ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : undefined }}>
        <div className="card-head">
          <div className="card-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Siren size={16} style={{ color: ex.criticalCount > 0 ? 'var(--danger)' : 'var(--success)' }} />
            CRITICAL — act now
          </div>
          <span className="badge b-neutral">{ex.criticalCount} open</span>
        </div>
        {ex.critical.length === 0 ? (
          <p className="t-caption">Koi critical exception nahi — safety incidents, unauthorized pickup attempts sab resolved.</p>
        ) : (
          ex.critical.map((f) => <FollowUpRow key={f.id} f={f} />)
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* ATTENTION band */}
        <div className="card">
          <div className="card-head">
            <div className="card-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> ATTENTION
            </div>
            <span className="badge b-neutral">{ex.attentionCount} open</span>
          </div>
          {ex.attention.length === 0 ? (
            <p className="t-caption">Absences, fee follow-ups, staffing — sab under control.</p>
          ) : (
            ex.attention.slice(0, 6).map((f) => <FollowUpRow key={f.id} f={f} />)
          )}
        </div>

        {/* Sections grid */}
        <div className="card">
          <div className="card-head">
            <div className="card-title" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Users size={16} /> Sections today
            </div>
            <Link href="/app/attendance" className="btn btn-ghost btn-sm">Attendance</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.sections.map((s) => (
              <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <b style={{ fontSize: 13 }}>{s.name}</b>
                  <div className="t-caption">
                    {s.teacher ?? 'No primary teacher — assign now'} · {s.expected}/{s.capacity} children
                  </div>
                </div>
                <div style={{ width: 90, height: 8, borderRadius: 4, background: 'var(--surface-hover)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${s.attendancePct}%`, height: '100%',
                    background: s.attendancePct >= 75 ? 'var(--success)' : s.attendancePct >= 40 ? 'var(--warning)' : 'var(--danger)',
                  }} />
                </div>
                <span className="t-caption" style={{ width: 64, textAlign: 'right' }}>
                  {s.unmarked > 0 ? `${s.present}+${s.unmarked}?` : `${s.present}/${s.expected}`}
                </span>
              </div>
            ))}
            {data.sections.length === 0 && <p className="t-caption">No active sections — Setup → Classes &amp; Sections.</p>}
          </div>
        </div>
      </div>

      {/* Full follow-up queue */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Follow-up queue
            <span className="t-caption" style={{ fontWeight: 400, marginLeft: 8 }}>(notification ≠ resolution — yahan resolve hota hai)</span>
          </div>
        </div>
        {items.filter((f) => !['RESOLVED', 'CLOSED'].includes(f.status)).length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={36} />}
            title="Zero unresolved follow-ups"
            message="Every exception has been acknowledged, acted on and resolved. School is running clean."
          />
        ) : (
          items.filter((f) => !['RESOLVED', 'CLOSED'].includes(f.status)).map((f) => <FollowUpRow key={f.id} f={f} />)
        )}

        {items.filter((f) => ['RESOLVED', 'CLOSED'].includes(f.status)).length > 0 && (
          <>
            <div className="card-foot card-title" style={{ fontSize: 13 }}>Recently resolved</div>
            {items.filter((f) => ['RESOLVED', 'CLOSED'].includes(f.status)).slice(0, 5).map((f) => (
              <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', opacity: 0.75 }}>
                <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13 }}>{f.title}</span>
                  <div className="t-caption">{f.outcome || 'Resolved'} · {f.resolvedAt ? timeAgo(f.resolvedAt) : ''}</div>
                </div>
                <span className="badge b-success">Resolved</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Gate Scanner Modal ── */}
      <Modal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title="Gate Scanner — Arrival & Pickup"
        subtitle="Verify child identity, mark arrival, or authorize parent pickup"
        icon={<ScanLine size={22} />}
        iconClass="ic-primary"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Segmented
            value={scanMode}
            onChange={(m) => { setScanMode(m as 'ARRIVAL' | 'PICKUP'); setScanMessage(null) }}
            options={[
              { key: 'ARRIVAL', label: 'Morning Arrival (Check-In)' },
              { key: 'PICKUP', label: 'Afternoon Pickup (Release)' },
            ]}
          />

          <Field label="Scan Barcode / Enter Student Code" required helper="Supports Admission No, Seat No, or Student ID barcode scan">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Scan QR or enter code (e.g. STU-2026-0001)..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLookup(scanCode)
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleLookup(scanCode)}
                disabled={scanLoading || !scanCode.trim()}
              >
                {scanLoading ? 'Checking…' : 'Lookup'}
              </button>
            </div>
          </Field>

          {scanMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: scanMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: scanMessage.type === 'success' ? '#10B981' : '#EF4444',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {scanMessage.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              <span>{scanMessage.text}</span>
            </div>
          )}

          {scannedStudent && (
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 14, background: 'var(--bg-sunken)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={scannedStudent.name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{scannedStudent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', display: 'flex', gap: 8 }}>
                    <span>{scannedStudent.admissionNo}</span>
                    {scannedStudent.seatNumber && <span>• Seat: {scannedStudent.seatNumber}</span>}
                    <span>• {scannedStudent.classroom}</span>
                  </div>
                </div>
              </div>

              {scanMode === 'PICKUP' && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'grid', gap: 10 }}>
                  <Field label="Select Authorised Pickup Person" required>
                    <select
                      className="select"
                      value={selectedGuardianId}
                      onChange={(e) => setSelectedGuardianId(e.target.value)}
                    >
                      {scannedStudent.guardians?.map((g: any) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.relationship}) — {g.canPickup ? 'Authorised' : 'BLOCKED'}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Pickup Security PIN" helper="Required when school security policy mandates PIN matching">
                    <input
                      className="input"
                      type="password"
                      placeholder="Enter 4-digit guardian PIN..."
                      value={pickupPin}
                      onChange={(e) => setPickupPin(e.target.value)}
                    />
                  </Field>
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExecuteScan}
                  disabled={scanLoading}
                >
                  {scanMode === 'ARRIVAL' ? (
                    <><CheckCircle2 size={14} /> Confirm Arrival</>
                  ) : (
                    <><ShieldCheck size={14} /> Authorize Pickup & Release</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
