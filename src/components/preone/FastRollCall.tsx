'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare,
  Undo2,
  ArrowRight,
  ShieldCheck,
  Check,
  HelpCircle,
} from 'lucide-react'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { isoDate, fmtDate } from '@/lib/format'
import { useToast } from '@/components/preone/Toast'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | null

export interface FastRollCallStudent {
  id: string
  name: string
  admissionNo: string
  seatNumber?: string | null
  photoUrl?: string | null
  currentStatus: AttendanceStatus
  localStatus: AttendanceStatus
  savedStatus: AttendanceStatus
  saveState: 'idle' | 'pending' | 'saved' | 'failed'
  notes?: string
}

export interface FastRollCallProps {
  open: boolean
  onClose: () => void
  classroomId: string
  classroomName: string
  academicSessionName?: string
  teacherName?: string
  initialDate?: string
  onAttendanceSaved?: () => void
}

export function FastRollCall({
  open,
  onClose,
  classroomId,
  classroomName,
  academicSessionName,
  teacherName,
  initialDate = isoDate(),
  onAttendanceSaved,
}: FastRollCallProps) {
  const toast = useToast()
  const [date, setDate] = useState(initialDate)
  const [students, setStudents] = useState<FastRollCallStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL')
  const [search, setSearch] = useState('')
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [activeStudentIndex, setActiveStudentIndex] = useState<number>(0)

  // Fetch classroom register
  const loadRegister = useCallback(async (targetDate: string) => {
    if (!classroomId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/attendance?classroomId=${encodeURIComponent(classroomId)}&date=${encodeURIComponent(targetDate)}`)
      if (!res.ok) {
        throw new Error(`Failed to load attendance register (${res.status})`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        const studentRows: FastRollCallStudent[] = (json.data.students || []).map((s: any) => ({
          id: s.id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
          admissionNo: s.admissionNo || '',
          seatNumber: s.seatNumber || null,
          photoUrl: s.photoUrl || null,
          currentStatus: s.status || null,
          localStatus: s.status || null,
          savedStatus: s.status || null,
          saveState: s.status ? 'saved' : 'idle',
        }))
        setStudents(studentRows)
      } else {
        throw new Error(json.error?.message || 'Invalid attendance payload')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching classroom students')
    } finally {
      setLoading(false)
    }
  }, [classroomId])

  useEffect(() => {
    if (open && classroomId) {
      loadRegister(date)
    }
  }, [open, classroomId, date, loadRegister])

  // Mark single student status
  const handleMarkStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s
        const isSame = s.localStatus === status
        const nextStatus = isSame ? null : status
        return {
          ...s,
          localStatus: nextStatus,
          saveState: nextStatus === s.savedStatus ? 'saved' : 'pending',
        }
      })
    )
  }

  // Mark all currently filtered/unmarked students as Present
  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        localStatus: s.localStatus ? s.localStatus : 'PRESENT',
        saveState: s.localStatus === s.savedStatus ? (s.savedStatus ? 'saved' : 'pending') : 'pending',
      }))
    )
    toast.info('Unmarked set to Present', 'Remember to save changes to commit to cloud register.')
  }

  // Save changes to backend
  const handleSaveAttendance = async () => {
    const entriesToSave = students
      .filter((s) => s.localStatus !== null)
      .map((s) => ({
        studentId: s.id,
        status: s.localStatus as 'PRESENT' | 'ABSENT' | 'LATE',
      }))

    if (entriesToSave.length === 0) {
      toast.warning('No attendance marked', 'Please mark at least one student before saving.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          date,
          entries: entriesToSave,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error?.message || `Save failed with status ${res.status}`)
      }

      // Mark all saved successfully
      setStudents((prev) =>
        prev.map((s) => ({
          ...s,
          savedStatus: s.localStatus,
          saveState: s.localStatus ? 'saved' : 'idle',
        }))
      )

      toast.success(
        'Attendance saved successfully',
        `Saved ${entriesToSave.length} records for ${classroomName}.`
      )

      if (onAttendanceSaved) onAttendanceSaved()
      setShowSummaryModal(true)
    } catch (err: any) {
      toast.error('Save failed', err.message || 'Could not save attendance. Please try again.')
      setStudents((prev) =>
        prev.map((s) => (s.saveState === 'pending' ? { ...s, saveState: 'failed' } : s))
      )
    } finally {
      setSaving(false)
    }
  }

  // Keyboard navigation & quick shortcuts (P, L, A, Enter, Esc)
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside search input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveStudentIndex((prev) => Math.min(filteredStudents.length - 1, prev + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveStudentIndex((prev) => Math.max(0, prev - 1))
      } else if (e.key === 'p' || e.key === 'P') {
        const current = filteredStudents[activeStudentIndex]
        if (current) handleMarkStatus(current.id, 'PRESENT')
      } else if (e.key === 'l' || e.key === 'L') {
        const current = filteredStudents[activeStudentIndex]
        if (current) handleMarkStatus(current.id, 'LATE')
      } else if (e.key === 'a' || e.key === 'A') {
        const current = filteredStudents[activeStudentIndex]
        if (current) handleMarkStatus(current.id, 'ABSENT')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, activeStudentIndex, students, filter, search, onClose])

  // Calculated counts
  const totalCount = students.length
  const presentCount = students.filter((s) => s.localStatus === 'PRESENT').length
  const absentCount = students.filter((s) => s.localStatus === 'ABSENT').length
  const lateCount = students.filter((s) => s.localStatus === 'LATE').length
  const markedCount = presentCount + absentCount + lateCount
  const remainingCount = Math.max(0, totalCount - markedCount)
  const percentComplete = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0
  const hasUnsavedChanges = students.some((s) => s.saveState === 'pending' || s.saveState === 'failed')

  // Filter & Search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filter === 'UNMARKED' && s.localStatus !== null) return false
      if (filter === 'PRESENT' && s.localStatus !== 'PRESENT') return false
      if (filter === 'ABSENT' && s.localStatus !== 'ABSENT') return false
      if (filter === 'LATE' && s.localStatus !== 'LATE') return false

      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesAdm = s.admissionNo.toLowerCase().includes(q)
        const matchesSeat = s.seatNumber ? s.seatNumber.toLowerCase().includes(q) : false
        if (!matchesName && !matchesAdm && !matchesSeat) return false
      }
      return true
    })
  }, [students, filter, search])

  // Date step helper
  const shiftDate = (days: number) => {
    const cur = new Date(date)
    cur.setDate(cur.getDate() + days)
    setDate(isoDate(cur))
  }

  if (!open) return null

  return (
    <div
      className="ovl ovl-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fast-roll-call-title"
      style={{ zIndex: 120 }}
    >
      <div
        className="ovl-backdrop"
        onClick={() => {
          if (!hasUnsavedChanges || window.confirm('You have unsaved attendance changes. Discard and close?')) {
            onClose()
          }
        }}
      />

      <div
        className="drawer"
        style={{
          width: 'min(720px, 100vw)',
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--elevation-3), var(--surface-highlight-dialog)',
        }}
      >
        {/* Sticky Header */}
        <div
          className="drawer-head p-4 sm:p-5 border-b shrink-0 space-y-3"
          style={{
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                <Sparkles size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    id="fast-roll-call-title"
                    className="text-base sm:text-lg font-bold text-foreground truncate"
                  >
                    Fast Roll Call
                  </h3>
                  <span className="badge b-primary text-xs font-semibold px-2 py-0.5">
                    {classroomName}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {teacherName ? `Teacher: ${teacherName}` : 'Rapid Classroom Attendance'} • {academicSessionName || 'Current Session'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasUnsavedChanges && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}

              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={() => {
                  if (!hasUnsavedChanges || window.confirm('You have unsaved attendance changes. Discard and close?')) {
                    onClose()
                  }
                }}
                title="Close Fast Roll Call (Esc)"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Date Selector & Counter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
            {/* Date Switcher */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 text-xs">
              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={() => shiftDate(-1)}
                title="Previous day"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="font-semibold text-foreground px-2 flex items-center gap-1.5 min-w-[120px] justify-center">
                <Calendar size={13} className="text-muted-foreground" />
                {fmtDate(date)}
              </span>

              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={() => shiftDate(1)}
                title="Next day"
              >
                <ChevronRight size={14} />
              </button>

              {date !== isoDate() && (
                <button
                  type="button"
                  onClick={() => setDate(isoDate())}
                  className="px-2 py-0.5 text-[11px] font-semibold text-primary hover:underline"
                >
                  Today
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {presentCount} Present
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {lateCount} Late
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {absentCount} Absent
              </span>
              <span className="flex items-center gap-1 font-semibold text-muted-foreground tabular-nums">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                {remainingCount} Left
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>
                <b>{markedCount}</b> of <b>{totalCount}</b> marked ({percentComplete}%)
              </span>
              {remainingCount === 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Complete
                </span>
              ) : (
                <span>{remainingCount} remaining</span>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentComplete === 100 ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Filter Pills & Live Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === 'ALL'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNMARKED')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === 'UNMARKED'
                    ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                }`}
              >
                Unmarked ({remainingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('PRESENT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === 'PRESENT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('LATE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === 'LATE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                }`}
              >
                Late ({lateCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('ABSENT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === 'ABSENT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>

            <div className="relative shrink-0 sm:w-48">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find child..."
                className="input h-8 pl-8 pr-2 text-xs w-full rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Roster Body */}
        <div className="drawer-body flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-16 bg-muted/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load classroom register</p>
                <p className="mt-1 text-muted-foreground">{error}</p>
                <button
                  type="button"
                  onClick={() => loadRegister(date)}
                  className="btn btn-sm btn-outline mt-3 text-xs"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Users className="mx-auto text-muted-foreground mb-2" size={36} />
              <h4 className="font-bold text-sm text-foreground">No students match filter</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? `No matches found for "${search}".` : `No students found in ${filter.toLowerCase()} category.`}
              </p>
              {(search || filter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilter('ALL')
                  }}
                  className="btn btn-sm btn-outline mt-3 text-xs"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student, idx) => (
                <FastRollCallCard
                  key={student.id}
                  student={student}
                  isActive={idx === activeStudentIndex}
                  onSelectStatus={(status) => handleMarkStatus(student.id, status)}
                  onFocus={() => setActiveStudentIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="drawer-foot border-t border-border/80 p-3 sm:p-4 shrink-0 flex items-center justify-between"
          style={{
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs"
              onClick={handleMarkAllPresent}
              title="Mark all unmarked students as Present"
            >
              <CheckSquare size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Set Unmarked to Present</span>
              <span className="sm:hidden">All Present</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline text-xs"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-sm btn-primary flex items-center gap-1.5 text-xs font-bold shadow-sm"
              onClick={handleSaveAttendance}
              disabled={saving}
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completion Summary Modal */}
      {showSummaryModal && (
        <div className="ovl" style={{ zIndex: 130 }}>
          <div className="ovl-backdrop" onClick={() => setShowSummaryModal(false)} />
          <div className="modal" style={{ width: 'min(440px, 92vw)' }}>
            <div className="modal-head">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">Attendance Committed</h3>
                  <p className="text-xs text-muted-foreground">{classroomName} • {fmtDate(date)}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={() => setShowSummaryModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body space-y-4 text-xs">
              <p className="text-muted-foreground">
                Classroom attendance has been officially saved and audited for this date.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">PRESENT</span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{presentCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block">LATE</span>
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{lateCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block">ABSENT</span>
                  <span className="text-xl font-bold text-rose-700 dark:text-rose-300 tabular-nums">{absentCount}</span>
                </div>
              </div>

              {remainingCount > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Notice: {remainingCount} child{remainingCount === 1 ? '' : 'ren'} remain unmarked for this session.</span>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-sm btn-outline text-xs"
                onClick={() => setShowSummaryModal(false)}
              >
                Review Register
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary text-xs font-bold"
                onClick={() => {
                  setShowSummaryModal(false)
                  onClose()
                }}
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAST ROLL CALL CARD COMPONENT WITH TOUCH SWIPE & KEYBOARD ACCESSIBILITY
// ─────────────────────────────────────────────────────────────────────────────
function FastRollCallCard({
  student,
  isActive,
  onSelectStatus,
  onFocus,
}: {
  student: FastRollCallStudent
  isActive: boolean
  onSelectStatus: (status: 'PRESENT' | 'ABSENT' | 'LATE') => void
  onFocus: () => void
}) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState<number>(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const isPresent = student.localStatus === 'PRESENT'
  const isAbsent = student.localStatus === 'ABSENT'
  const isLate = student.localStatus === 'LATE'
  const isPending = student.saveState === 'pending'
  const isFailed = student.saveState === 'failed'

  // Touch Swipe Handlers (Swipe right for Present, swipe left for Absent)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return
    const dx = e.touches[0].clientX - touchStartX
    const dy = e.touches[0].clientY - touchStartY

    // Safeguard: Ignore if scrolling vertically (dy > dx * 1.5)
    if (Math.abs(dy) > Math.abs(dx) * 1.2) return

    // Dampen offset
    if (Math.abs(dx) < 140) {
      setSwipeOffset(dx)
    }
  }

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      // Swiped Right -> Present
      onSelectStatus('PRESENT')
    } else if (swipeOffset < -60) {
      // Swiped Left -> Absent
      onSelectStatus('ABSENT')
    }
    setTouchStartX(null)
    setTouchStartY(null)
    setSwipeOffset(0)
  }

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      onFocus={onFocus}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined,
        transition: swipeOffset ? 'none' : 'transform 200ms ease, border-color 150ms ease',
        boxShadow: isActive ? 'var(--shadow-card), 0 0 0 2px var(--primary)' : 'var(--shadow-xs)',
      }}
      className={`card p-3 sm:p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 outline-none transition-all ${
        isActive ? 'border-primary ring-1 ring-primary' : 'border-border'
      } ${
        isPresent
          ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-300 dark:border-emerald-800/60'
          : isAbsent
          ? 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-300 dark:border-rose-800/60'
          : isLate
          ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-300 dark:border-amber-800/60'
          : 'bg-card'
      }`}
    >
      {/* Student Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={student.name} src={student.photoUrl} size="md" className="shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-foreground truncate">{student.name}</h4>
            {isPending && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pending save" />
            )}
            {isFailed && (
              <span className="badge b-danger text-[10px]">Save Failed</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">{student.admissionNo}</span>
            {student.seatNumber && (
              <>
                <span>•</span>
                <span className="font-medium text-primary">Seat {student.seatNumber}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rapid Action Buttons (Touch & Click Friendly) */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        {/* PRESENT */}
        <button
          type="button"
          onClick={() => onSelectStatus('PRESENT')}
          className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
            isPresent
              ? 'bg-emerald-600 text-white shadow-xs scale-100 ring-2 ring-emerald-500/40'
              : 'bg-muted/70 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-muted-foreground hover:text-emerald-700'
          }`}
          title="Mark Present (P)"
        >
          <Check size={14} className={isPresent ? 'text-white' : 'text-emerald-600'} />
          <span>Present</span>
        </button>

        {/* LATE */}
        <button
          type="button"
          onClick={() => onSelectStatus('LATE')}
          className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
            isLate
              ? 'bg-amber-600 text-white shadow-xs scale-100 ring-2 ring-amber-500/40'
              : 'bg-muted/70 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-muted-foreground hover:text-amber-700'
          }`}
          title="Mark Late (L)"
        >
          <Clock size={14} className={isLate ? 'text-white' : 'text-amber-600'} />
          <span>Late</span>
        </button>

        {/* ABSENT */}
        <button
          type="button"
          onClick={() => onSelectStatus('ABSENT')}
          className={`h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
            isAbsent
              ? 'bg-rose-600 text-white shadow-xs scale-100 ring-2 ring-rose-500/40'
              : 'bg-muted/70 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-muted-foreground hover:text-rose-700'
          }`}
          title="Mark Absent (A)"
        >
          <X size={14} className={isAbsent ? 'text-white' : 'text-rose-600'} />
          <span>Absent</span>
        </button>
      </div>
    </div>
  )
}
