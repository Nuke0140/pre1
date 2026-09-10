'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, Save, PartyPopper, UserX } from 'lucide-react'
import { PageHead, Avatar } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'

interface Row {
  studentId: string
  name: string
  admissionNo: string
  status: string | null
}
interface Summary {
  total: number; present: number; absent: number; late: number; halfDay: number; unmarked: number
}

const STATUSES = [
  { key: 'PRESENT', label: 'Present', cls: 's-present' },
  { key: 'ABSENT', label: 'Absent', cls: 's-absent' },
  { key: 'LATE', label: 'Late', cls: 's-late' },
  { key: 'HALF_DAY', label: 'Half Day', cls: 's-half' },
] as const

export default function AttendancePage() {
  const toast = useToast()
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [classroomId, setClassroomId] = useState('')
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<Row[] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/v1/classrooms')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setClassrooms(j.data)
          if (j.data[0]) setClassroomId(j.data[0].id)
        }
      })
  }, [])

  const loadRegister = useCallback(async () => {
    if (!classroomId) return
    setRows(null)
    const res = await fetch(`/api/v1/attendance?classroomId=${classroomId}&date=${date}`)
    const json = await res.json()
    if (json.success) {
      setRows(json.data.students)
      setSummary(json.data.summary)
    }
  }, [classroomId, date])

  useEffect(() => {
    Promise.resolve().then(loadRegister)
  }, [loadRegister])

  const setStatus = (studentId: string, status: string | null) => {
    setRows((prev) =>
      prev
        ? prev.map((r) =>
            r.studentId === studentId ? { ...r, status: status as Row['status'] } : r
          )
        : prev
    )
  }

  const markAllPresent = () => {
    setRows((prev) => prev?.map((r) => ({ ...r, status: r.status ?? 'PRESENT' })) ?? null)
    toast.info('All unmarked set to Present', 'Review and save when ready')
  }

  const save = async () => {
    if (!rows) return
    const unmarked = rows.filter((r) => !r.status)
    if (unmarked.length > 0) {
      toast.warning(`${unmarked.length} students unmarked`, 'Mark everyone or save as-is')
    }
    setSaving(true)
    const entries = rows
      .filter((r) => r.status)
      .map((r) => ({ studentId: r.studentId, status: r.status }))
    const res = await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId, date, entries }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      toast.success(
        'Attendance saved',
        `${json.data.markedCount} marked · ${json.data.absentCount} absent — parents of absentees notified`
      )
      loadRegister()
    } else {
      toast.error('Save failed', json.error?.message)
    }
  }

  return (
    <>
      <PageHead
        title="Attendance"
        sub="Class register — 2 minute mein poori class mark karo."
        actions={
          <button className={`btn btn-primary ${saving ? 'is-loading' : ''}`} onClick={save} disabled={saving || !rows}>
            <Save size={15} /> Save Register
          </button>
        }
      />

      {/* Controls */}
      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ minWidth: 220 }}>
          <label>Classroom</label>
          <select className="select" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            {classrooms.length === 0 && <option value="">No classrooms</option>}
          </select>
        </div>
        <div className="field" style={{ minWidth: 180 }}>
          <label>Date</label>
          <input className="input" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={markAllPresent}>
          <PartyPopper size={15} /> All Present
        </button>
        {summary && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="stat-mini"><b>{summary.total}</b><span>Total</span></div>
            <div className="stat-mini"><b style={{ color: 'var(--success)' }}>{summary.present}</b><span>Present</span></div>
            <div className="stat-mini"><b style={{ color: 'var(--danger)' }}>{summary.absent}</b><span>Absent</span></div>
            <div className="stat-mini"><b style={{ color: '#B45309' }}>{summary.late}</b><span>Late</span></div>
            <div className="stat-mini"><b style={{ color: '#2563EB' }}>{summary.halfDay}</b><span>Half</span></div>
          </div>
        )}
      </div>

      {/* Register */}
      <div className="dtable-wrap">
        {rows?.map((r) => (
          <div className="att-row" key={r.studentId}>
            <Avatar name={r.name} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 650 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--foreground-muted)', fontFamily: 'var(--font-mono)' }}>{r.admissionNo}</div>
            </div>
            <div className="att-seg" role="radiogroup" aria-label={`Attendance for ${r.name}`}>
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  className={`${r.status === s.key ? `on ${s.cls}` : ''}`}
                  onClick={() => setStatus(r.studentId, r.status === s.key ? null : s.key)}
                  role="radio"
                  aria-checked={r.status === s.key}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {rows === null && (
          <div className="empty">
            <div className="empty-art"><CalendarCheck size={36} /></div>
            <h4>Loading register…</h4>
          </div>
        )}
        {rows?.length === 0 && (
          <div className="empty">
            <div className="empty-art"><UserX size={36} /></div>
            <h4>No students in this classroom</h4>
            <p>Enroll students via Admissions → approve an application.</p>
          </div>
        )}
      </div>

      <p className="t-caption" style={{ textAlign: 'center' }}>
        Register date: {fmtDate(date)} · Absent bacchon ke parents ko instant notification jaata hai (PRD Daily Ops).
      </p>
    </>
  )
}
