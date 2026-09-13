'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Save, CheckSquare2, SquareX } from 'lucide-react'
import { DataTable, Column } from '@/components/preone/DataTable'
import { PageHead, Segmented, Avatar } from '@/components/preone/ui'
import { DatePicker } from '@/components/preone/forms'
import { useToast } from '@/components/preone/Toast'
import { isoDate } from '@/lib/format'

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE'] as const
type Status = (typeof STATUSES)[number]

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  PRESENT: { label: 'P', cls: 'st-present' },
  ABSENT: { label: 'A', cls: 'st-absent' },
  LATE: { label: 'L', cls: 'st-late' },
  HALF_DAY: { label: 'H', cls: 'st-half' },
  LEAVE: { label: 'V', cls: 'st-leave' },
}

interface RegisterRow {
  id: string
  studentId: string
  name: string
  admissionNo: string
  status: Status | null
  notes: string | null
}

export default function AttendancePage() {
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; branchId?: string }[]>([])
  const [clsId, setClsId] = useState('')
  const [date, setDate] = useState(isoDate())
  const [rows, setRows] = useState<RegisterRow[]>([])
  const [saved, setSaved] = useState<Record<string, Status | ''>>({})
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const loadClassrooms = useCallback(async () => {
    const c = await fetch('/api/v1/classrooms').then((r) => r.json())
    if (c.success && Array.isArray(c.data)) {
      setClassrooms(c.data)
      if (c.data.length && !clsId) setClsId(c.data[0].id)
    }
  }, [clsId])

  const load = useCallback(async () => {
    if (!clsId) return
    setLoading(true)
    try {
      const q = new URLSearchParams({ classroomId: clsId, date })
      const r = await fetch(`/api/v1/attendance?${q}`).then((res) => res.json())
      if (r.success) {
        setRows(r.data.students.map((s: RegisterRow) => ({ ...s, id: s.studentId })))
        setSaved(Object.fromEntries(r.data.students.map((s: RegisterRow) => [s.studentId, s.status]).filter(([, s]) => s)))
        setSummary(r.data.summary)
      } else {
        toast.error('Failed to load register', r.error)
      }
    } finally {
      setLoading(false)
    }
  }, [clsId, date])

  useEffect(() => {
    loadClassrooms()
  }, [loadClassrooms])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = (studentId: string, s: Status) => {
    setSaved((prev) => ({ ...prev, [studentId]: prev[studentId] === s ? '' : s }))
  }

  const markAll = (s: Status) => {
    const next: Record<string, Status | ''> = {}
    for (const st of rows) next[st.studentId] = s
    setSaved(next)
  }

  const clearAll = () => {
    const next: Record<string, Status | ''> = {}
    for (const st of rows) next[st.studentId] = ''
    setSaved(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      const entries = rows
        .filter((r) => saved[r.studentId])
        .map((r) => ({ studentId: r.studentId, status: saved[r.studentId] as Status }))
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: clsId, date, entries }),
      }).then((r) => r.json())
      if (res.success) {
        toast.success('Attendance saved', `Marked ${res.data.markedCount} children on ${date}`)
        load()
      } else {
        toast.error('Failed to save', res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  const markCount = rows.filter((r) => saved[r.studentId]).length

  const columns: Column<RegisterRow>[] = [
    {
      key: 'name',
      header: 'Child',
      sortValue: (r) => r.name,
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={r.name} />
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'admissionNo',
      header: 'Admission #',
      sortValue: (r) => r.admissionNo,
      render: (r) => <span className="txt-muted">{r.admissionNo}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => (r.status ? STATUSES.indexOf(r.status) : -1),
      render: (r) => {
        const current = saved[r.studentId] as Status | undefined
        return (
          <div className="att-group" role="group" aria-label={`Status for ${r.name}`}>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`sg-mini ${STATUS_META[s].cls}${current === s ? ' on' : ''}`}
                aria-pressed={current === s}
                onClick={() => setStatus(r.studentId, s)}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        )
      },
    },
  ]

  const clsMeta = (id: string) => classrooms.find((c) => c.id === id)

  return (
    <div className="page">
      <PageHead
        title={`Attendance — ${clsMeta(clsId)?.name || 'Register'}`}
        sub="Daily class register. Mark all present in one tap; ABSENT / LATE auto-raise parent communication."
      />

      <div className="panel" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 300 }}>
          <label className="lbl">Classroom</label>
          <Segmented
            options={classrooms.map((c) => ({ key: c.id, label: c.name }))}
            value={clsId}
            onChange={setClsId}
          />
        </div>
        <div>
          <label className="lbl">Date</label>
          <div style={{ width: 210 }}>
            <DatePicker value={date} onChange={(iso) => iso && setDate(iso)} placeholder="Choose day" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-ghost" onClick={load} disabled={loading || !clsId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-ghost" onClick={() => markAll('PRESENT')} disabled={!rows.length} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare2 size={15} /> Mark all present
          </button>
          <button className="btn btn-ghost" onClick={clearAll} disabled={!rows.length} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SquareX size={15} /> Clear
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !markCount} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} /> Save register ({markCount})
          </button>
        </div>
      </div>

      {summary.total > 0 && (
        <div className="panel" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '12px 18px' }}>
          <Chip label="Total" value={summary.total} cls="chip-muted" />
          <Chip label="Present" value={summary.present || 0} cls="chip-success" />
          <Chip label="Absent" value={summary.absent || 0} cls="chip-danger" />
          <Chip label="Late" value={summary.late || 0} cls="chip-warning" />
          <Chip label="Half day" value={summary.halfDay || 0} cls="chip-info" />
          <Chip label="Unmarked" value={summary.unmarked || 0} cls="chip-muted" />
        </div>
      )}

      <div className="panel">
        <DataTable<RegisterRow> columns={columns} data={loading ? [] : rows} footer={<span>Marked: {markCount} of {rows.length || 0}</span>} exportFileName="attendance.csv" showExport={!!rows.length} />
        {!loading && !rows.length && <div className="empty-state" style={{ padding: 40, textAlign: 'center', color: 'var(--foreground-muted)' }}>No active students in this classroom. Pick another class or check the date.</div>}
      </div>

      <div className="panel" style={{ padding: '14px 18px' }}>
        <span className="txt-muted" style={{ fontSize: 13 }}>
          Legend — <b className="st-present">P</b> Present · <b className="st-absent">A</b> Absent · <b className="st-late">L</b> Late · <b className="st-half">H</b> Half day · <b className="st-leave">V</b> Leave.
          Saving ABSENT/LATE entries triggers an exception event (parent communication pipeline) automatically.
        </span>
      </div>
    </div>
  )
}

function Chip({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className={`chip-sum ${cls}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}