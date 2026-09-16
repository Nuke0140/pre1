'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Save,
  CheckSquare2,
  SquareX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  UserX,
  AlertCircle,
  FileSpreadsheet,
  Edit3,
  ExternalLink,
  ShieldAlert,
  X,
  User,
  Sparkles,
} from 'lucide-react'
import { PageHead, Avatar } from '@/components/preone/ui'
import { DatePicker } from '@/components/preone/forms'
import { Modal, Drawer } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { isoDate } from '@/lib/format'

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE'] as const
type Status = (typeof STATUSES)[number]

const STATUS_META: Record<
  Status,
  { label: string; full: string; cls: string; color: string }
> = {
  PRESENT: { label: 'P', full: 'Present', cls: 'st-present', color: 'var(--success)' },
  ABSENT: { label: 'A', full: 'Absent', cls: 'st-absent', color: 'var(--danger)' },
  LATE: { label: 'L', full: 'Late', cls: 'st-late', color: 'var(--warning)' },
  HALF_DAY: { label: 'H', full: 'Half Day', cls: 'st-half', color: 'var(--info)' },
  LEAVE: { label: 'V', full: 'Leave', cls: 'st-leave', color: 'var(--primary)' },
}

interface RegisterStudent {
  studentId: string
  name: string
  firstName: string
  lastName: string | null
  admissionNo: string
  seatNumber: string | null
  photoUrl: string | null
  gender: string | null
  dob: string | null
  status: Status | null
  notes: string | null
  markedAt: string | null
  markedById: string | null
  markedByName: string | null
  followUp?: {
    id: string
    severity: string
    status: string
    title: string
    detail: string
  } | null
}

interface ClassroomMeta {
  id: string
  name: string
  code?: string
  capacity?: number
  programType?: string
  branchId?: string
  teacher?: string | null
  primaryTeacher?: { id: string; name: string; email?: string } | null
  branch?: { id: string; name: string; code: string } | null
  academicSession?: { id: string; name: string; code: string } | null
}

interface DayStatusMeta {
  date: string
  status: 'WORKING_DAY' | 'NON_WORKING_DAY' | 'HOLIDAY' | 'VACATION' | 'EVENT_DAY'
  eventTitle?: string
  workingDay: boolean
  attendanceExpected: boolean
}

const PRESET_REASONS = [
  'Parent notified - sick / fever',
  'Doctor / medical appointment',
  'Bus transit / traffic delay',
  'Family travel / event',
  'Accidental marking error corrected',
  'Arrived late with parent note',
]

export default function AttendancePage() {
  const [classrooms, setClassrooms] = useState<ClassroomMeta[]>([])
  const [clsId, setClsId] = useState('')
  const [date, setDate] = useState(isoDate())
  const [students, setStudents] = useState<RegisterStudent[]>([])
  const [saved, setSaved] = useState<Record<string, Status | ''>>({})
  const [initialSaved, setInitialSaved] = useState<Record<string, Status | ''>>({})
  const [classroomDetails, setClassroomDetails] = useState<ClassroomMeta | null>(null)
  const [dayStatus, setDayStatus] = useState<DayStatusMeta | null>(null)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [exceptions, setExceptions] = useState<RegisterStudent[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Correction Drawer State
  const [correctionTarget, setCorrectionTarget] = useState<RegisterStudent | null>(null)
  const [correctionStatus, setCorrectionStatus] = useState<Status>('PRESENT')
  const [correctionReason, setCorrectionReason] = useState('')
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false)

  // Force Override Dialog State
  const [forceModalOpen, setForceModalOpen] = useState(false)
  const [forceReasonMsg, setForceReasonMsg] = useState('')

  // Exceptions Drawer State
  const [exceptionsDrawerOpen, setExceptionsDrawerOpen] = useState(false)

  const toast = useToast()

  // Load classrooms list
  const loadClassrooms = useCallback(async () => {
    try {
      const c = await fetch('/api/v1/classrooms').then((r) => r.json())
      if (c.success && Array.isArray(c.data)) {
        setClassrooms(c.data)
        if (c.data.length && !clsId) {
          setClsId(c.data[0].id)
        }
      }
    } catch {
      toast.error('Could not load classrooms')
    }
  }, [clsId, toast])

  // Load register for chosen classroom + date
  const load = useCallback(async () => {
    if (!clsId) return
    setLoading(true)
    try {
      const q = new URLSearchParams({ classroomId: clsId, date })
      const res = await fetch(`/api/v1/attendance?${q}`).then((r) => r.json())
      if (res.success && res.data) {
        const studentList: RegisterStudent[] = res.data.students || []
        setStudents(studentList)
        setClassroomDetails(res.data.classroom || null)
        setDayStatus(res.data.dayStatus || null)
        setSummary(res.data.summary || {})
        setExceptions(res.data.exceptions || [])

        const initialStatusMap: Record<string, Status | ''> = {}
        studentList.forEach((s) => {
          if (s.status) initialStatusMap[s.studentId] = s.status
        })
        setSaved(initialStatusMap)
        setInitialSaved(initialStatusMap)
      } else {
        toast.error('Failed to load register', res.error?.message || 'Unknown error')
      }
    } catch (e: unknown) {
      toast.error('Failed to load register', e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [clsId, date, toast])

  useEffect(() => {
    loadClassrooms()
  }, [loadClassrooms])

  useEffect(() => {
    load()
  }, [load])

  // Date jump helpers
  const changeDateByDays = (delta: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(isoDate(d))
  }

  const jumpToToday = () => {
    setDate(isoDate())
  }

  // Fast marking toggles
  const setStatus = (studentId: string, s: Status) => {
    setSaved((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === s ? '' : s,
    }))
  }

  const markAll = (s: Status) => {
    const next: Record<string, Status | ''> = {}
    for (const st of students) next[st.studentId] = s
    setSaved(next)
  }

  const markUnmarkedPresent = () => {
    setSaved((prev) => {
      const next = { ...prev }
      for (const st of students) {
        if (!next[st.studentId]) {
          next[st.studentId] = 'PRESENT'
        }
      }
      return next
    })
  }

  const clearAll = () => {
    const next: Record<string, Status | ''> = {}
    for (const st of students) next[st.studentId] = ''
    setSaved(next)
  }

  // Save changes (bulk)
  const save = async (forceOverride = false) => {
    setSaving(true)
    try {
      const entries = students
        .filter((r) => saved[r.studentId])
        .map((r) => ({
          studentId: r.studentId,
          status: saved[r.studentId] as Status,
        }))

      const payload: {
        classroomId: string
        date: string
        entries: typeof entries
        force?: boolean
      } = {
        classroomId: clsId,
        date,
        entries,
      }

      if (forceOverride) {
        payload.force = true
      }

      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json())

      if (res.success) {
        toast.success(
          'Register saved successfully',
          `Marked ${res.data.markedCount} children on ${date}${
            res.data.exceptionsRaised ? ` (${res.data.exceptionsRaised} exceptions raised)` : ''
          }`
        )
        setForceModalOpen(false)
        load()
      } else if (res.error?.code === 'BUSINESS_SCHOOL_CLOSED' || res.error?.includes?.('CLOSED')) {
        setForceReasonMsg(res.error?.message || 'Today is marked as non-working on the school calendar.')
        setForceModalOpen(true)
      } else {
        toast.error('Failed to save attendance', res.error?.message || 'Server error')
      }
    } catch (e: unknown) {
      toast.error('Save error', e instanceof Error ? e.message : 'Network error')
    } finally {
      setSaving(false)
    }
  }

  // Dedicated single-student correction
  const openCorrection = (st: RegisterStudent) => {
    setCorrectionTarget(st)
    setCorrectionStatus(st.status || 'PRESENT')
    setCorrectionReason('')
  }

  const submitCorrection = async () => {
    if (!correctionTarget) return
    setCorrectionSubmitting(true)
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: clsId,
          date,
          entries: [
            {
              studentId: correctionTarget.studentId,
              status: correctionStatus,
            },
          ],
          reason: correctionReason.trim() || 'Manual studio correction',
          force: !dayStatus?.attendanceExpected,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success(
          'Attendance corrected',
          `${correctionTarget.name} updated to ${STATUS_META[correctionStatus].full}`
        )
        setCorrectionTarget(null)
        load()
      } else {
        toast.error('Correction failed', res.error?.message || 'Could not update record')
      }
    } catch {
      toast.error('Correction failed', 'Network error occurred')
    } finally {
      setCorrectionSubmitting(false)
    }
  }

  // Quick mark present from exceptions drawer
  const quickMarkPresent = async (studentId: string, studentName: string) => {
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: clsId,
          date,
          entries: [{ studentId, status: 'PRESENT' }],
          reason: 'Late arrival - checked in via studio exceptions drawer',
          force: !dayStatus?.attendanceExpected,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Marked Present', `${studentName} updated to Present`)
        load()
      } else {
        toast.error('Failed to update', res.error?.message)
      }
    } catch {
      toast.error('Error updating status')
    }
  }

  // Dirty counter (unsaved modifications)
  const dirtyCount = useMemo(() => {
    return students.filter((s) => (saved[s.studentId] || '') !== (initialSaved[s.studentId] || '')).length
  }, [students, saved, initialSaved])

  const markedCount = Object.values(saved).filter(Boolean).length

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const currentStatus = saved[st.studentId] || ''
      if (statusFilter === 'PRESENT' && currentStatus !== 'PRESENT') return false
      if (statusFilter === 'ABSENT' && currentStatus !== 'ABSENT') return false
      if (statusFilter === 'LATE' && currentStatus !== 'LATE') return false
      if (statusFilter === 'HALF_DAY' && currentStatus !== 'HALF_DAY') return false
      if (statusFilter === 'LEAVE' && currentStatus !== 'LEAVE') return false
      if (statusFilter === 'UNMARKED' && currentStatus !== '') return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const nameMatch = st.name.toLowerCase().includes(q)
        const admMatch = st.admissionNo.toLowerCase().includes(q)
        const seatMatch = st.seatNumber?.toLowerCase().includes(q)
        if (!nameMatch && !admMatch && !seatMatch) return false
      }
      return true
    })
  }, [students, saved, statusFilter, searchQuery])

  // CSV Export handler
  const exportCSV = () => {
    if (!students.length) return
    const headers = ['Admission No', 'Name', 'Seat No', 'Status', 'Date', 'Marked By', 'Notes']
    const rows = students.map((s) => [
      `"${s.admissionNo}"`,
      `"${s.name}"`,
      `"${s.seatNumber || ''}"`,
      `"${saved[s.studentId] || 'UNMARKED'}"`,
      `"${date}"`,
      `"${s.markedByName || ''}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_${classroomDetails?.name || 'Class'}_${date}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isToday = date === isoDate()
  const activeClassroom = classrooms.find((c) => c.id === clsId)

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Page Header */}
      <PageHead
        eyebrow="Daily Attendance Studio"
        badge={
          <span className="badge b-success b-dot" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync
          </span>
        }
        title={`Attendance — ${classroomDetails?.name || activeClassroom?.name || 'Class Register'}`}
        sub="High-speed daily roll call register. 1-tap bulk marking, calendar awareness, real-time exception follow-ups, and student 360 link."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              onClick={load}
              disabled={loading || !clsId}
              title="Refresh Register"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={exportCSV}
              disabled={!students.length}
              title="Export Register to CSV"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
            <button
              className={`btn ${dirtyCount > 0 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => save(false)}
              disabled={saving || (!dirtyCount && !markedCount)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 650,
              }}
            >
              <Save size={16} />
              <span>
                {saving ? 'Saving...' : dirtyCount > 0 ? `Save Register (${dirtyCount} unsaved)` : `Register Saved`}
              </span>
            </button>
          </div>
        }
      />

      {/* 2. School Calendar Alert Strip (if holiday / non-working day) */}
      {dayStatus && !dayStatus.attendanceExpected && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 14,
            background: 'color-mix(in srgb, var(--warning, var(--warning)) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning, var(--warning)) 30%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} style={{ color: 'var(--warning, var(--warning))', flexShrink: 0 }} />
            <div>
              <div className="t-body-sm" style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                School Calendar Notice: {dayStatus.status.replace(/_/g, ' ')}
                {dayStatus.eventTitle ? ` — ${dayStatus.eventTitle}` : ''}
              </div>
              <div className="t-caption" style={{ color: 'var(--foreground-muted)' }}>
                Regular attendance is not scheduled for this date. Emergency force overrides are audited.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setForceModalOpen(true)}
            style={{
              borderColor: 'color-mix(in srgb, var(--warning, var(--warning)) 40%, transparent)',
              color: 'var(--warning, var(--warning))',
              fontWeight: 600,
            }}
          >
            <ShieldAlert size={14} style={{ marginRight: 6 }} />
            Emergency Force Override Info
          </button>
        </div>
      )}

      {/* 3. Context Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          padding: '14px 18px',
          background: 'var(--surface-elevated, var(--surface))',
          borderRadius: 16,
          border: '1px solid var(--border-subtle, var(--border-default))',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div>
          <div className="t-label">
            Branch & Session
          </div>
          <div className="t-body-sm" style={{ fontWeight: 650, color: 'var(--foreground)', marginTop: 2 }}>
            {classroomDetails?.branch?.name || 'Main Branch'} ·{' '}
            <span style={{ color: 'var(--foreground-muted)' }}>
              {classroomDetails?.academicSession?.name || 'Current Session'}
            </span>
          </div>
        </div>

        <div>
          <div className="t-label">
            Classroom & Room Code
          </div>
          <div className="t-body-sm" style={{ fontWeight: 650, color: 'var(--foreground)', marginTop: 2 }}>
            {classroomDetails?.name || 'Classroom'}{' '}
            {classroomDetails?.code ? (
              <span className="dt-id-chip" style={{ fontSize: 11, marginLeft: 6 }}>
                {classroomDetails.code}
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <div className="t-label">
            Primary Teacher
          </div>
          <div className="t-body-sm" style={{ fontWeight: 650, color: 'var(--foreground)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={14} style={{ color: 'var(--foreground-muted)' }} />
            <span>{classroomDetails?.primaryTeacher?.name || activeClassroom?.teacher || 'Unassigned'}</span>
          </div>
        </div>

        <div>
          <div className="t-label">
            Capacity & Roster
          </div>
          <div className="t-body-sm" style={{ fontWeight: 650, color: 'var(--foreground)', marginTop: 2 }}>
            <span style={{ color: 'var(--preone-primary, var(--primary))' }}>{students.length}</span> Enrolled{' '}
            <span style={{ color: 'var(--foreground-muted)' }}>/ {classroomDetails?.capacity || 20} Capacity</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>
            Calendar Status
          </div>
          <div style={{ marginTop: 3 }}>
            {dayStatus?.workingDay ? (
              <span className="badge b-success" style={{ fontSize: 11.5, fontWeight: 650 }}>
                Working Day
              </span>
            ) : (
              <span className="badge b-warning" style={{ fontSize: 11.5, fontWeight: 650 }}>
                {dayStatus?.status.replace(/_/g, ' ') || 'Closed'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Classroom Switcher Pill Rail */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'thin',
        }}
      >
        {classrooms.map((c) => {
          const isActive = c.id === clsId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setClsId(c.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: isActive ? 700 : 550,
                border: isActive
                  ? '1.5px solid var(--preone-primary, var(--primary))'
                  : '1px solid var(--border-subtle, var(--border-default))',
                background: isActive
                  ? 'color-mix(in srgb, var(--preone-primary, var(--primary)) 10%, var(--surface))'
                  : 'var(--surface-elevated, var(--surface))',
                color: isActive ? 'var(--preone-primary, var(--primary))' : 'var(--foreground)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{c.name}</span>
              {c.teacher && (
                <span style={{ fontSize: 11, color: 'var(--foreground-muted)', fontWeight: 400 }}>
                  ({c.teacher})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 5. Register Studio Main Container */}
      <div
        className="register-studio"
        style={{
          background: 'var(--surface-elevated, var(--surface))',
          borderRadius: 20,
          border: '1px solid var(--border-subtle, var(--border-default))',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        }}
      >
        {/* Command & Date Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle, var(--border-default))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Date Selector with Jump Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => changeDateByDays(-1)}
                title="Previous Day"
                style={{ padding: '6px 8px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ width: 170 }}>
                <DatePicker value={date} onChange={(iso) => iso && setDate(iso)} placeholder="Select date" />
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => changeDateByDays(1)}
                title="Next Day"
                style={{ padding: '6px 8px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className={`btn btn-sm ${isToday ? 'btn-primary' : 'btn-ghost'}`}
                onClick={jumpToToday}
                style={{ fontSize: 12, padding: '4px 10px', height: 32 }}
              >
                Today
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => changeDateByDays(-1)}
                style={{ fontSize: 12, padding: '4px 10px', height: 32 }}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Quick 1-Tap Studio Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => markAll('PRESENT')}
              disabled={!students.length}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34 }}
            >
              <CheckSquare2 size={15} style={{ color: 'var(--success, var(--success))' }} />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={markUnmarkedPresent}
              disabled={!students.length}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34 }}
            >
              <Sparkles size={14} style={{ color: 'var(--preone-primary, var(--primary))' }} />
              <span>Mark Unmarked Present</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearAll}
              disabled={!students.length}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34 }}
            >
              <SquareX size={15} style={{ color: 'var(--foreground-muted)' }} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setExceptionsDrawerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                position: 'relative',
                color: exceptions.length ? 'var(--danger, var(--danger))' : 'var(--foreground)',
              }}
            >
              <AlertCircle size={15} />
              <span>Exceptions ({exceptions.length})</span>
              {exceptions.length > 0 && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--danger, var(--danger))',
                    position: 'absolute',
                    top: 6,
                    right: 6,
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* 6. Live Counter Pulse Strip (Clickable Segmented Filters) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            padding: '12px 20px',
            background: 'var(--surface-muted, var(--bg-subtle))',
            borderBottom: '1px solid var(--border-subtle, var(--border-default))',
          }}
        >
          {/* Total */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'ALL' ? '2px solid var(--foreground)' : '1px solid var(--border-subtle)',
              background: statusFilter === 'ALL' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground-muted)' }}>TOTAL ROSTER</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>
              {summary.total ?? students.length}
            </div>
          </button>

          {/* Present */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PRESENT' ? 'ALL' : 'PRESENT')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'PRESENT' ? '2px solid var(--success, var(--success))' : '1px solid var(--border-subtle)',
              background: statusFilter === 'PRESENT' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success, var(--success))' }}>PRESENT</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success, var(--success))' }}>
              {summary.present ?? 0}
            </div>
          </button>

          {/* Absent */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'ABSENT' ? 'ALL' : 'ABSENT')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'ABSENT' ? '2px solid var(--danger, var(--danger))' : '1px solid var(--border-subtle)',
              background: statusFilter === 'ABSENT' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger, var(--danger))' }}>ABSENT</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger, var(--danger))' }}>
              {summary.absent ?? 0}
            </div>
          </button>

          {/* Late */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'LATE' ? 'ALL' : 'LATE')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'LATE' ? '2px solid var(--warning, var(--warning))' : '1px solid var(--border-subtle)',
              background: statusFilter === 'LATE' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning, var(--warning))' }}>LATE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning, var(--warning))' }}>
              {summary.late ?? 0}
            </div>
          </button>

          {/* Half Day */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'HALF_DAY' ? 'ALL' : 'HALF_DAY')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'HALF_DAY' ? '2px solid var(--info, var(--info))' : '1px solid var(--border-subtle)',
              background: statusFilter === 'HALF_DAY' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--info, var(--info))' }}>HALF DAY</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--info, var(--info))' }}>
              {summary.halfDay ?? 0}
            </div>
          </button>

          {/* Leave */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'LEAVE' ? 'ALL' : 'LEAVE')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'LEAVE' ? '2px solid var(--preone-primary, var(--primary))' : '1px solid var(--border-subtle)',
              background: statusFilter === 'LEAVE' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--preone-primary, var(--primary))' }}>LEAVE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--preone-primary, var(--primary))' }}>
              {summary.leave ?? 0}
            </div>
          </button>

          {/* Unmarked */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'UNMARKED' ? 'ALL' : 'UNMARKED')}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: statusFilter === 'UNMARKED' ? '2px solid var(--foreground-muted)' : '1px solid var(--border-subtle)',
              background: statusFilter === 'UNMARKED' ? 'var(--surface-elevated, var(--surface))' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground-muted)' }}>UNMARKED</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground-muted)' }}>
              {summary.unmarked ?? 0}
            </div>
          </button>

          {/* Rate */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: 'var(--surface-elevated, var(--surface))',
              border: '1px solid var(--border-subtle)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground-muted)' }}>ATTENDANCE RATE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--preone-primary, var(--primary))' }}>
              {summary.attendanceRate ?? 0}%
            </div>
          </div>
        </div>

        {/* 7. Search & Register Filter Controls */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid var(--border-subtle, var(--border-default))',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', width: 280 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--foreground-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search student or admission #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inp"
              style={{ paddingLeft: 32, fontSize: 13, height: 36, width: '100%' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--foreground-muted)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--foreground-muted)' }}>
            Showing <b>{filteredStudents.length}</b> of {students.length} students
            {statusFilter !== 'ALL' && (
              <span style={{ marginLeft: 6 }}>
                (filtered by <b>{statusFilter}</b>)
              </span>
            )}
          </div>
        </div>

        {/* 8. Register Table (Desktop) */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted, var(--bg-subtle))', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--foreground-muted)', width: '32%' }}>
                  STUDENT (360 LINK)
                </th>
                <th style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--foreground-muted)', width: '16%' }}>
                  ADMISSION #
                </th>
                <th style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--foreground-muted)', width: '28%' }}>
                  STATUS SELECTION
                </th>
                <th style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: 'var(--foreground-muted)', width: '14%' }}>
                  MARK AUDIT
                </th>
                <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: 'var(--foreground-muted)', width: '10%', textAlign: 'right' }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => {
                const currentStatus = saved[st.studentId] as Status | undefined
                const isDraftDirty = (saved[st.studentId] || '') !== (initialSaved[st.studentId] || '')
                const hasFollowUp = !!st.followUp

                return (
                  <tr
                    key={st.studentId}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, var(--bg-muted))',
                      background: isDraftDirty ? 'color-mix(in srgb, var(--preone-primary, var(--primary)) 3%, var(--surface))' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Student Identity + 360 link */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={st.name} src={st.photoUrl} size="md" />
                        <div>
                          <Link
                            href={`/app/students/${st.studentId}`}
                            className="student-link"
                            style={{
                              fontWeight: 650,
                              fontSize: 13.5,
                              color: 'var(--foreground)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>{st.name}</span>
                            <ExternalLink size={12} style={{ opacity: 0.4 }} />
                          </Link>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            {st.seatNumber ? (
                              <span style={{ fontSize: 11, color: 'var(--foreground-muted)', fontWeight: 550 }}>
                                Seat: {st.seatNumber}
                              </span>
                            ) : null}
                            {st.gender ? (
                              <span style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>
                                · {st.gender}
                              </span>
                            ) : null}
                            {hasFollowUp && (
                              <span
                                className="badge b-danger"
                                style={{ fontSize: 10, padding: '1px 6px', fontWeight: 650 }}
                              >
                                Follow-up {st.followUp?.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Admission No */}
                    <td style={{ padding: '12px 14px' }}>
                      <Link
                        href={`/app/students/${st.studentId}`}
                        title="View Student 360"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="dt-id-chip" style={{ cursor: 'pointer' }}>
                          {st.admissionNo}
                        </span>
                      </Link>
                    </td>

                    {/* 1-Tap 44px Status Controls */}
                    <td style={{ padding: '12px 14px' }}>
                      <div
                        className="att-group"
                        role="group"
                        aria-label={`Attendance status for ${st.name}`}
                        style={{ display: 'flex', gap: 4, maxWidth: 260 }}
                      >
                        {STATUSES.map((s) => {
                          const isSelected = currentStatus === s
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setStatus(st.studentId, s)}
                              aria-pressed={isSelected}
                              style={{
                                flex: 1,
                                height: 40,
                                minWidth: 38,
                                borderRadius: 8,
                                border: isSelected
                                  ? '1.5px solid transparent'
                                  : '1px solid var(--border-subtle, var(--border-default))',
                                background: isSelected
                                  ? STATUS_META[s].color
                                  : 'var(--surface-muted, var(--bg-subtle))',
                                color: isSelected ? 'var(--surface)' : 'var(--foreground)',
                                fontWeight: 750,
                                fontSize: 12.5,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                              }}
                              title={`${STATUS_META[s].full} (${STATUS_META[s].label})`}
                            >
                              {STATUS_META[s].label}
                            </button>
                          )
                        })}
                      </div>
                    </td>

                    {/* Mark Audit Info */}
                    <td style={{ padding: '12px 14px' }}>
                      {st.markedAt ? (
                        <div style={{ fontSize: 11.5, color: 'var(--foreground-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={12} style={{ color: 'var(--success, var(--success))' }} />
                            <span>{st.markedByName || 'Staff'}</span>
                          </div>
                          <div style={{ fontSize: 10.5, marginTop: 1, opacity: 0.8 }}>
                            {new Date(st.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11.5, color: 'var(--foreground-muted)', fontStyle: 'italic' }}>
                          Unmarked
                        </span>
                      )}
                      {st.notes && (
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--foreground-muted)',
                            marginTop: 3,
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={st.notes}
                        >
                          Note: {st.notes}
                        </div>
                      )}
                    </td>

                    {/* Actions: Correct / Details */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openCorrection(st)}
                        style={{ fontSize: 12, padding: '4px 10px', height: 32 }}
                        title="Correct Attendance & Log Reason"
                      >
                        <Edit3 size={13} style={{ marginRight: 4 }} />
                        Correct
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {!loading && !filteredStudents.length && (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--foreground-muted)',
              }}
            >
              <UserX size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--foreground)' }}>
                No students match the current criteria
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing the search query or status filter.'
                  : 'No active students enrolled in this classroom.'}
              </div>
            </div>
          )}
        </div>

        {/* 9. Legend & Operational Guidance Strip */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--surface-muted, var(--bg-subtle))',
            borderTop: '1px solid var(--border-subtle, var(--border-default))',
            fontSize: 12,
            color: 'var(--foreground-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>
              <b>Legend:</b>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="badge b-success" style={{ padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                P
              </span>{' '}
              Present
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="badge b-danger" style={{ padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                A
              </span>{' '}
              Absent
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="badge b-warning" style={{ padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                L
              </span>{' '}
              Late
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="badge b-info" style={{ padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                H
              </span>{' '}
              Half Day
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="badge b-primary" style={{ padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                V
              </span>{' '}
              Leave
            </span>
          </div>

          <div>
            Marking <b>ABSENT</b> or <b>LATE</b> auto-triggers parent notification and teacher follow-up dispatch.
          </div>
        </div>
      </div>

      {/* 10. Attendance Correction Modal / Drawer */}
      <Modal
        open={!!correctionTarget}
        onClose={() => setCorrectionTarget(null)}
        title="Attendance Correction & Reason Capture"
        subtitle={correctionTarget ? `${correctionTarget.name} (${correctionTarget.admissionNo}) · Date: ${date}` : ''}
        icon={<Edit3 />}
        iconClass="ic-purple"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setCorrectionTarget(null)}
              disabled={correctionSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitCorrection}
              disabled={correctionSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={15} />
              <span>{correctionSubmitting ? 'Saving Correction...' : 'Confirm Correction'}</span>
            </button>
          </div>
        }
      >
        {correctionTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Student mini card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                background: 'var(--surface-muted, var(--bg-subtle))',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Avatar name={correctionTarget.name} src={correctionTarget.photoUrl} size="md" />
              <div>
                <div style={{ fontWeight: 650, fontSize: 14 }}>{correctionTarget.name}</div>
                <div style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>
                  Admission: {correctionTarget.admissionNo} · Current Status in DB:{' '}
                  <b>{correctionTarget.status || 'UNMARKED'}</b>
                </div>
              </div>
            </div>

            {/* Revised Status Picker */}
            <div>
              <label className="lbl" style={{ marginBottom: 8, display: 'block' }}>
                Revised Attendance Status
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {STATUSES.map((s) => {
                  const active = correctionStatus === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCorrectionStatus(s)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 10,
                        border: active ? '2px solid var(--preone-primary, var(--primary))' : '1px solid var(--border-subtle)',
                        background: active
                          ? 'color-mix(in srgb, var(--preone-primary, var(--primary)) 12%, var(--surface))'
                          : 'var(--surface-elevated, var(--surface))',
                        color: active ? 'var(--preone-primary, var(--primary))' : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div>{STATUS_META[s].label}</div>
                      <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>{STATUS_META[s].full}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Reason Pills */}
            <div>
              <label className="lbl" style={{ marginBottom: 6, display: 'block' }}>
                Preset Correction Reasons
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESET_REASONS.map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setCorrectionReason(pr)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--border-subtle)',
                      background: correctionReason === pr ? 'var(--foreground)' : 'var(--surface-muted)',
                      color: correctionReason === pr ? 'var(--surface-elevated)' : 'var(--foreground)',
                      fontSize: 11.5,
                      cursor: 'pointer',
                    }}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Text */}
            <div>
              <label className="lbl" style={{ marginBottom: 6, display: 'block' }}>
                Detailed Reason / Note (Audited)
              </label>
              <textarea
                className="inp"
                rows={3}
                placeholder="Explain the reason for this attendance correction..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--foreground-muted)', display: 'flex', gap: 6 }}>
              <ShieldAlert size={14} style={{ color: 'var(--preone-primary, var(--primary))', flexShrink: 0 }} />
              <span>
                This correction will be permanently logged in the audit trail. If changing from ABSENT to PRESENT, any
                open absence follow-up ticket will be automatically resolved.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* 11. Exceptions Drawer */}
      <Drawer
        open={exceptionsDrawerOpen}
        onClose={() => setExceptionsDrawerOpen(false)}
        title={`Attendance Exceptions (${exceptions.length})`}
        subtitle={`Classroom: ${classroomDetails?.name || 'Active Class'} · Date: ${date}`}
        icon={<AlertCircle />}
        iconClass="ic-pink"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 12.5, color: 'var(--foreground-muted)' }}>
            The following students are marked <b>ABSENT</b> or <b>LATE</b> for today. Follow-up tickets and parent
            notifications have been dispatched.
          </div>

          {!exceptions.length ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--success, var(--success))', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 650, color: 'var(--foreground)' }}>No Exceptions Today!</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>All marked students are present.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exceptions.map((ex) => (
                <div
                  key={ex.studentId}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: 'var(--surface-muted, var(--bg-subtle))',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={ex.name} src={ex.photoUrl} size="sm" />
                      <div>
                        <Link
                          href={`/app/students/${ex.studentId}`}
                          style={{
                            fontWeight: 650,
                            fontSize: 13.5,
                            color: 'var(--foreground)',
                            textDecoration: 'none',
                          }}
                        >
                          {ex.name}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>
                          Adm: {ex.admissionNo} {ex.seatNumber ? `· Seat: ${ex.seatNumber}` : ''}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`badge ${ex.status === 'ABSENT' ? 'b-danger' : 'b-warning'}`}
                      style={{ fontWeight: 700 }}
                    >
                      {ex.status}
                    </span>
                  </div>

                  {ex.followUp && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'var(--surface-elevated, var(--surface))',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 11.5,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        Follow-Up: {ex.followUp.title}
                      </div>
                      <div style={{ color: 'var(--foreground-muted)', fontSize: 11, marginTop: 2 }}>
                        Status: <b>{ex.followUp.status}</b>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => quickMarkPresent(ex.studentId, ex.name)}
                      style={{ flex: 1, fontSize: 12, height: 32 }}
                    >
                      <CheckCircle2 size={13} style={{ marginRight: 4, color: 'var(--success)' }} />
                      Mark Present
                    </button>
                    <Link
                      href={`/app/students/${ex.studentId}`}
                      className="btn btn-sm btn-ghost"
                      style={{ flex: 1, fontSize: 12, height: 32, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <User size={13} style={{ marginRight: 4 }} />
                      Student 360
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>

      {/* 12. School Calendar Closed / Emergency Force Override Dialog */}
      <Modal
        open={forceModalOpen}
        onClose={() => setForceModalOpen(false)}
        title="School Calendar Closed-Day Guard"
        subtitle={`Class: ${classroomDetails?.name || activeClassroom?.name} · Date: ${date}`}
        icon={<AlertTriangle />}
        iconClass="ic-yellow"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setForceModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => save(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ShieldAlert size={15} />
              <span>Confirm & Force Save</span>
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
            {forceReasonMsg ||
              `The school calendar has marked ${date} as a closed or non-working day. Regular student attendance is normally not recorded.`}
          </p>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--warning, var(--warning)) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning, var(--warning)) 30%, transparent)',
              fontSize: 12,
              color: 'var(--foreground)',
            }}
          >
            <b>Audited Override Notice:</b> Proceeding with an Emergency Force Override will record attendance for this
            closed day and will log an explicit entry in the PreOne audit trail with your account credentials.
          </div>
        </div>
      </Modal>
    </div>
  )
}