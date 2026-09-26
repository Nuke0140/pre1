'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  Users,
  Plus,
  BookOpen,
  Eye,
  History as HistoryIcon,
  Sparkles,
  Save,
  Filter,
  RefreshCw,
  Building2,
  CheckSquare,
  FileText,
  Calendar,
  Layers,
  Search,
  Check,
} from 'lucide-react'
import { PageHead, Avatar } from '@/components/preone/ui'
import { DatePicker } from '@/components/preone/forms'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { isoDate } from '@/lib/format'

interface UserContext {
  id: string
  name: string
  email: string
  role: string
  isTeacher: boolean
  isAdmin: boolean
}

interface ClassroomMeta {
  id: string
  name: string
  code: string
  programType: string
  capacity: number
  branchId: string
  academicSessionId: string
  primaryTeacherId: string | null
  teacherName: string
  studentCount: number
}

interface BranchMeta {
  id: string
  name: string
  code: string
  isMain: boolean
}

interface TeacherMeta {
  id: string
  fullName: string
  email: string | null
}

interface ContextData {
  user: UserContext
  academicSession: { id: string; name: string; isCurrent: boolean } | null
  branches: BranchMeta[]
  classrooms: ClassroomMeta[]
  teachers: TeacherMeta[]
}

interface OverviewData {
  classroom: {
    id: string
    name: string
    code: string
    programType: string
    capacity: number
    teacherName: string
    teacherId: string | null
    branchName?: string
    sessionName?: string
  }
  date: string
  stats: {
    totalStudents: number
    present: number
    absent: number
    late: number
    halfDay: number
    unmarked: number
    totalActivities: number
    completedActivities: number
    totalObservations: number
  }
  activities: {
    id: string
    title: string
    activityType: string
    startTime: string
    endTime: string
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    description: string | null
    actualOutcome: string | null
    teacherName: string
  }[]
  observations: {
    id: string
    studentId: string
    studentName: string
    narrative: string
    category: string
    concern: string
    observedAt: string
  }[]
}

interface AttendanceStudent {
  studentId: string
  firstName: string
  lastName: string | null
  name: string
  admissionNo: string
  photoUrl: string | null
  gender: string | null
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | null
  notes: string
  markedAt: string | null
  markedById: string | null
}

interface HistoryData {
  attendance: {
    id: string
    date: string
    studentName: string
    admissionNo: string
    status: string
    notes: string | null
  }[]
  activities: {
    id: string
    date: string
    title: string
    activityType: string
    status: string
    actualOutcome: string | null
    teacherName: string
  }[]
  observations: {
    id: string
    date: string
    studentName: string
    narrative: string
    category: string
    concern: string
  }[]
}

export default function DailyDiaryPage() {
  const toast = useToast()

  // Context & Selection States
  const [context, setContext] = useState<ContextData | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)

  const [selectedDate, setSelectedDate] = useState<string>(isoDate())
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [adminViewMode, setAdminViewMode] = useState<'school' | 'class'>('class')

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'timetable' | 'observations' | 'history'>('overview')

  // Data States
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)

  // Attendance Register State
  const [attendanceRegister, setAttendanceRegister] = useState<AttendanceStudent[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)

  // Admin School Overview State
  const [adminOverview, setAdminOverview] = useState<any>(null)
  const [loadingAdminOverview, setLoadingAdminOverview] = useState(false)

  // History State
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Modal States
  const [showAddActivityModal, setShowAddActivityModal] = useState(false)
  const [showObservationModal, setShowObservationModal] = useState(false)
  const [showCompleteActivityModal, setShowCompleteActivityModal] = useState<string | null>(null)
  const [activityNotesInput, setActivityNotesInput] = useState('')

  // Form Inputs: Add Activity
  const [newActTitle, setNewActTitle] = useState('')
  const [newActType, setNewActType] = useState('ACTIVITY')
  const [newActStartTime, setNewActStartTime] = useState('09:30')
  const [newActEndTime, setNewActEndTime] = useState('10:00')
  const [newActTeacherId, setNewActTeacherId] = useState('')
  const [newActDesc, setNewActDesc] = useState('')
  const [submittingAct, setSubmittingAct] = useState(false)

  // Form Inputs: Add Observation
  const [obsStudentId, setObsStudentId] = useState('')
  const [obsNarrative, setObsNarrative] = useState('')
  const [obsCategory, setObsCategory] = useState('General')
  const [obsConcern, setObsConcern] = useState('NORMAL')
  const [submittingObs, setSubmittingObs] = useState(false)

  // Load Context on Mount
  useEffect(() => {
    async function fetchContext() {
      try {
        setLoadingContext(true)
        const res = await fetch('/api/v1/daily-diary/context')
        const json = await res.json()

        if (json.success && json.data) {
          const ctx: ContextData = json.data
          setContext(ctx)

          if (ctx.user.isAdmin && !ctx.user.isTeacher) {
            setAdminViewMode('school')
          }

          if (ctx.classrooms.length > 0) {
            setSelectedClassroomId(ctx.classrooms[0].id)
          }
        } else {
          toast.error('Error', json.error?.message || 'Failed to initialize Daily Diary')
        }
      } catch (err: any) {
        toast.error('Error', 'Failed to load initial context')
      } finally {
        setLoadingContext(false)
      }
    }
    fetchContext()
  }, [])

  // Load Overview whenever classroomId or selectedDate changes
  const loadOverview = useCallback(async () => {
    if (!selectedClassroomId || !selectedDate) return
    try {
      setLoadingOverview(true)
      const res = await fetch(`/api/v1/daily-diary/overview?classroomId=${selectedClassroomId}&date=${selectedDate}`)
      const json = await res.json()
      if (json.success && json.data) {
        setOverview(json.data)
      } else {
        toast.error('Failed to load overview', json.error?.message)
      }
    } catch {
      toast.error('Error', 'Failed to fetch overview data')
    } finally {
      setLoadingOverview(false)
    }
  }, [selectedClassroomId, selectedDate])

  // Load Attendance Register
  const loadAttendance = useCallback(async () => {
    if (!selectedClassroomId || !selectedDate) return
    try {
      setLoadingAttendance(true)
      const res = await fetch(`/api/v1/daily-diary/attendance?classroomId=${selectedClassroomId}&date=${selectedDate}`)
      const json = await res.json()
      if (json.success && json.data) {
        setAttendanceRegister(json.data)
      }
    } catch {
      toast.error('Error', 'Failed to fetch attendance register')
    } finally {
      setLoadingAttendance(false)
    }
  }, [selectedClassroomId, selectedDate])

  // Load Admin School Overview
  const loadAdminOverview = useCallback(async () => {
    if (!selectedDate) return
    try {
      setLoadingAdminOverview(true)
      const url = `/api/v1/daily-diary/admin-overview?date=${selectedDate}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success && json.data) {
        setAdminOverview(json.data)
      }
    } catch {
      toast.error('Error', 'Failed to fetch school overview')
    } finally {
      setLoadingAdminOverview(false)
    }
  }, [selectedDate, selectedBranchId])

  // Load History Data
  const loadHistory = useCallback(async () => {
    if (!selectedClassroomId) return
    try {
      setLoadingHistory(true)
      const res = await fetch(`/api/v1/daily-diary/history?classroomId=${selectedClassroomId}&startDate=${selectedDate}&endDate=${selectedDate}`)
      const json = await res.json()
      if (json.success && json.data) {
        setHistoryData(json.data)
      }
    } catch {
      toast.error('Error', 'Failed to fetch history')
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedClassroomId, selectedDate])

  // Trigger Data Fetching on Selection Changes
  useEffect(() => {
    if (adminViewMode === 'school') {
      loadAdminOverview()
    } else {
      if (activeTab === 'overview' || activeTab === 'timetable') {
        loadOverview()
      }
      if (activeTab === 'attendance') {
        loadAttendance()
        loadOverview()
      }
      if (activeTab === 'observations') {
        loadOverview()
      }
      if (activeTab === 'history') {
        loadHistory()
      }
    }
  }, [selectedClassroomId, selectedDate, activeTab, adminViewMode, selectedBranchId, loadOverview, loadAttendance, loadAdminOverview, loadHistory])

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(isoDate(d))
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(isoDate(d))
  }

  // Attendance Register Actions
  const handleMarkAllPresent = () => {
    setAttendanceRegister((prev) =>
      prev.map((s) => ({ ...s, status: 'PRESENT' }))
    )
  }

  const handleSetStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    setAttendanceRegister((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    )
  }

  const handleSetStudentNotes = (studentId: string, notes: string) => {
    setAttendanceRegister((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
    )
  }

  const handleSaveAttendance = async () => {
    if (!selectedClassroomId) return
    try {
      setSavingAttendance(true)
      const records = attendanceRegister.map((s) => ({
        studentId: s.studentId,
        status: s.status || 'PRESENT',
        notes: s.notes,
      }))

      const res = await fetch('/api/v1/daily-diary/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          date: selectedDate,
          records,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Attendance Saved', `Updated attendance for ${json.data?.count || records.length} students.`)
        loadOverview()
      } else {
        toast.error('Save Failed', json.error?.message)
      }
    } catch {
      toast.error('Error', 'Could not save attendance register')
    } finally {
      setSavingAttendance(false)
    }
  }

  // Activity Actions
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActTitle.trim() || !selectedClassroomId) return
    try {
      setSubmittingAct(true)
      const res = await fetch('/api/v1/daily-diary/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          date: selectedDate,
          title: newActTitle,
          activityType: newActType,
          startTime: newActStartTime,
          endTime: newActEndTime,
          teacherId: newActTeacherId || undefined,
          description: newActDesc,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Activity Scheduled', `"${newActTitle}" added to today's timetable.`)
        setShowAddActivityModal(false)
        setNewActTitle('')
        setNewActDesc('')
        loadOverview()
        if (adminViewMode === 'school') loadAdminOverview()
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch {
      toast.error('Error', 'Failed to add activity')
    } finally {
      setSubmittingAct(false)
    }
  }

  const handleUpdateActivityStatus = async (activityId: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/daily-diary/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Activity Updated', `Activity status changed to ${status}.`)
        setShowCompleteActivityModal(null)
        setActivityNotesInput('')
        loadOverview()
      } else {
        toast.error('Update Failed', json.error?.message)
      }
    } catch {
      toast.error('Error', 'Could not update activity status')
    }
  }

  // Observation Actions
  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obsStudentId || !obsNarrative.trim() || !selectedClassroomId) return
    try {
      setSubmittingObs(true)
      const res = await fetch('/api/v1/daily-diary/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: obsStudentId,
          classroomId: selectedClassroomId,
          narrative: obsNarrative,
          category: obsCategory,
          concern: obsConcern,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Observation Recorded', 'Student observation saved.')
        setShowObservationModal(false)
        setObsNarrative('')
        loadOverview()
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch {
      toast.error('Error', 'Failed to save observation')
    } finally {
      setSubmittingObs(false)
    }
  }

  if (loadingContext) {
    return (
      <div className="space-y-6">
        <PageHead title="Daily Diary" subtitle="Loading daily classroom activities..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-panel p-6 animate-pulse h-28" />
          ))}
        </div>
        <div className="glass-panel p-8 animate-pulse h-64" />
      </div>
    )
  }

  const user = context?.user
  const classrooms = context?.classrooms || []
  const currentClass = classrooms.find((c) => c.id === selectedClassroomId) || classrooms[0]

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarCheck className="text-emerald-500" size={26} />
              Daily Diary
            </h1>
            {context?.academicSession && (
              <span className="badge b-emerald text-xs font-semibold">
                {context.academicSession.name}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.isTeacher ? (
              <>
                Teacher: <strong className="text-foreground">{user.name}</strong> • Class:{' '}
                <strong className="text-foreground">{currentClass?.name || 'Unassigned'}</strong>
              </>
            ) : (
              <>
                School-wide Daily Activity & Operational Command Center
              </>
            )}
          </p>
        </div>

        {/* DATE & SCOPE NAVIGATOR */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Admin Mode Switcher */}
          {user?.isAdmin && (
            <div className="join border border-border rounded-lg bg-background/50 p-1 flex">
              <button
                type="button"
                className={`btn btn-xs ${adminViewMode === 'school' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAdminViewMode('school')}
              >
                <Building2 size={13} className="mr-1" /> School Overview
              </button>
              <button
                type="button"
                className={`btn btn-xs ${adminViewMode === 'class' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAdminViewMode('class')}
              >
                <Users size={13} className="mr-1" /> Class View
              </button>
            </div>
          )}

          {/* Date Picker with Prev/Next */}
          <div className="flex items-center bg-card border border-border rounded-lg px-2 py-1 gap-1">
            <button
              type="button"
              className="btn btn-icon btn-icon-sm btn-icon-ghost"
              onClick={handlePrevDay}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-icon btn-icon-sm btn-icon-ghost"
              onClick={handleNextDay}
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost text-xs text-primary font-semibold ml-1"
              onClick={() => setSelectedDate(isoDate())}
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* ADMIN SCHOOL OVERVIEW VIEW */}
      {adminViewMode === 'school' && user?.isAdmin ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {context?.branches && context.branches.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Branch:</span>
                  <select
                    className="select select-sm text-xs"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {context.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowAddActivityModal(true)}
            >
              <Plus size={15} /> Schedule Activity
            </button>
          </div>

          {/* School Overview Summary Stats */}
          {loadingAdminOverview ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="glass-panel p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : adminOverview ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass-panel p-4 border-l-4 border-l-primary">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Classes</span>
                <div className="text-2xl font-bold text-foreground mt-1">{adminOverview.stats.totalClasses}</div>
              </div>
              <div className="glass-panel p-4 border-l-4 border-l-blue-500">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Students</span>
                <div className="text-2xl font-bold text-foreground mt-1">{adminOverview.stats.totalStudents}</div>
              </div>
              <div className="glass-panel p-4 border-l-4 border-l-emerald-500">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Present</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{adminOverview.stats.present}</div>
              </div>
              <div className="glass-panel p-4 border-l-4 border-l-rose-500">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Absent</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">{adminOverview.stats.absent}</div>
              </div>
              <div className="glass-panel p-4 border-l-4 border-l-amber-500">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Late</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">{adminOverview.stats.late}</div>
              </div>
              <div className="glass-panel p-4 border-l-4 border-l-slate-400">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Unmarked</span>
                <div className="text-2xl font-bold text-muted-foreground mt-1">{adminOverview.stats.unmarked}</div>
              </div>
            </div>
          ) : null}

          {/* Classes Grid */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>Today&apos;s Classrooms ({adminOverview?.classes?.length || 0})</span>
              <span className="text-xs text-muted-foreground font-normal">Click any class to monitor & edit detail</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminOverview?.classes?.map((cls: any) => (
                <div
                  key={cls.id}
                  className="border border-border hover:border-primary rounded-xl p-5 bg-card/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  onClick={() => {
                    setSelectedClassroomId(cls.id)
                    setAdminViewMode('class')
                    setActiveTab('overview')
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {cls.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Teacher: <span className="font-medium text-foreground">{cls.teacherName}</span>
                      </p>
                    </div>
                    <span className="badge b-blue text-xs font-semibold">{cls.programType}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center my-4 bg-background/60 p-2.5 rounded-lg border border-border/50 text-xs">
                    <div>
                      <div className="text-muted-foreground text-[10px]">Total</div>
                      <div className="font-bold">{cls.studentCount}</div>
                    </div>
                    <div>
                      <div className="text-emerald-600 text-[10px]">Present</div>
                      <div className="font-bold text-emerald-600">{cls.present}</div>
                    </div>
                    <div>
                      <div className="text-rose-600 text-[10px]">Absent</div>
                      <div className="font-bold text-rose-600">{cls.absent}</div>
                    </div>
                    <div>
                      <div className="text-amber-600 text-[10px]">Late</div>
                      <div className="font-bold text-amber-600">{cls.late}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-primary" /> Activities: {cls.activitiesCount} ({cls.completedActivities} completed)
                    </span>
                    <span className="text-primary font-semibold group-hover:underline flex items-center gap-0.5">
                      Open Diary →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CLASSROOM DIARY VIEW (Teacher & Admin Class Detail) */
        <div className="space-y-6">
          {/* Class Selector Bar */}
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Classroom:</span>
              <select
                className="select select-sm text-sm font-semibold min-w-[200px]"
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.teacherName})
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Navigation Buttons */}
            <div className="flex items-center gap-1 bg-background/60 p-1 border border-border rounded-xl">
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('overview')}
              >
                <BookOpen size={14} className="mr-1.5" /> Overview
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'attendance' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('attendance')}
              >
                <UserCheck size={14} className="mr-1.5" /> Attendance
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'timetable' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('timetable')}
              >
                <Clock size={14} className="mr-1.5" /> Timetable
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'observations' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('observations')}
              >
                <FileText size={14} className="mr-1.5" /> Observations
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('history')}
              >
                <HistoryIcon size={14} className="mr-1.5" /> History
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {loadingOverview ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="glass-panel p-4 animate-pulse h-24" />
                  ))}
                </div>
              ) : overview ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="glass-panel p-4 border-l-4 border-l-primary">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Total Students</span>
                      <div className="text-2xl font-bold text-foreground mt-1">{overview.stats.totalStudents}</div>
                    </div>
                    <div className="glass-panel p-4 border-l-4 border-l-emerald-500">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Present</span>
                      <div className="text-2xl font-bold text-emerald-600 mt-1">{overview.stats.present}</div>
                    </div>
                    <div className="glass-panel p-4 border-l-4 border-l-rose-500">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Absent</span>
                      <div className="text-2xl font-bold text-rose-600 mt-1">{overview.stats.absent}</div>
                    </div>
                    <div className="glass-panel p-4 border-l-4 border-l-amber-500">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Late</span>
                      <div className="text-2xl font-bold text-amber-600 mt-1">{overview.stats.late}</div>
                    </div>
                    <div className="glass-panel p-4 border-l-4 border-l-slate-400">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Unmarked</span>
                      <div className="text-2xl font-bold text-muted-foreground mt-1">{overview.stats.unmarked}</div>
                    </div>
                    <div className="glass-panel p-4 border-l-4 border-l-blue-500">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Activities</span>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {overview.stats.completedActivities}/{overview.stats.totalActivities}
                      </div>
                    </div>
                  </div>

                  {/* Today's Activities & Quick Observations Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Schedule / Timetable Widget */}
                    <div className="lg:col-span-2 glass-panel p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <Clock size={18} className="text-primary" /> Today&apos;s Schedule & Activities
                        </h3>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setShowAddActivityModal(true)}
                        >
                          <Plus size={13} /> Add Activity
                        </button>
                      </div>

                      {overview.activities.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-xl">
                          <Clock className="mx-auto text-muted-foreground mb-2" size={32} />
                          <p className="text-sm font-medium text-muted-foreground">No activities scheduled for today.</p>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary mt-3"
                            onClick={() => setShowAddActivityModal(true)}
                          >
                            Add Schedule
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {overview.activities.map((act) => (
                            <div
                              key={act.id}
                              className="p-4 rounded-xl border border-border bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-muted">
                                    {act.startTime} – {act.endTime}
                                  </span>
                                  <span className="badge b-purple text-[10px] font-semibold uppercase">
                                    {act.activityType.replace('_', ' ')}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-foreground text-sm">{act.title}</h4>
                                {act.description && (
                                  <p className="text-xs text-muted-foreground">{act.description}</p>
                                )}
                                {act.actualOutcome && (
                                  <p className="text-xs text-emerald-600 font-medium">Notes: {act.actualOutcome}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {act.status === 'COMPLETED' ? (
                                  <span className="badge b-success text-xs font-semibold flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Completed
                                  </span>
                                ) : act.status === 'IN_PROGRESS' ? (
                                  <span className="badge b-warning text-xs font-semibold">In Progress</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline"
                                    onClick={() => setShowCompleteActivityModal(act.id)}
                                  >
                                    Mark Done
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Today's Observations Summary */}
                    <div className="glass-panel p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <FileText size={18} className="text-amber-500" /> Today&apos;s Observations
                        </h3>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => setShowObservationModal(true)}
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>

                      {overview.observations.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-xl">
                          <FileText className="mx-auto text-muted-foreground mb-2" size={32} />
                          <p className="text-sm font-medium text-muted-foreground">No observations recorded today.</p>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary mt-3"
                            onClick={() => setShowObservationModal(true)}
                          >
                            Record Observation
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {overview.observations.map((obs) => (
                            <div key={obs.id} className="p-3 rounded-lg border border-border bg-card/30 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">{obs.studentName}</span>
                                <span className={`badge text-[10px] ${obs.concern === 'URGENT' ? 'b-danger' : obs.concern === 'ELEVATED' ? 'b-warning' : 'b-neutral'}`}>
                                  {obs.category}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">&ldquo;{obs.narrative}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <UserCheck size={20} className="text-emerald-500" /> Class Attendance Register
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mark daily presence, absence, or late arrival for all students in {currentClass?.name}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleMarkAllPresent}
                  >
                    <CheckSquare size={15} /> Mark All Present
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                  >
                    {savingAttendance ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                    Save Attendance
                  </button>
                </div>
              </div>

              {loadingAttendance ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="glass-panel p-4 animate-pulse h-16" />
                  ))}
                </div>
              ) : attendanceRegister.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Users className="mx-auto text-muted-foreground mb-2" size={40} />
                  <h4 className="font-bold text-base text-foreground">No students assigned</h4>
                  <p className="text-xs text-muted-foreground mt-1">No students are currently allocated to {currentClass?.name}.</p>
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card/30">
                  {attendanceRegister.map((student, idx) => (
                    <div
                      key={student.studentId}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-6">{idx + 1}.</span>
                        <Avatar name={student.name} src={student.photoUrl} size="md" />
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{student.name}</h4>
                          <span className="text-xs text-muted-foreground font-mono">Adm No: {student.admissionNo}</span>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600'
                          }`}
                          onClick={() => handleSetStudentStatus(student.studentId, 'PRESENT')}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600'
                          }`}
                          onClick={() => handleSetStudentStatus(student.studentId, 'ABSENT')}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600'
                          }`}
                          onClick={() => handleSetStudentStatus(student.studentId, 'LATE')}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            student.status === 'HALF_DAY'
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600'
                          }`}
                          onClick={() => handleSetStudentStatus(student.studentId, 'HALF_DAY')}
                        >
                          Half Day
                        </button>

                        <input
                          type="text"
                          placeholder="Optional notes..."
                          className="input input-xs text-xs max-w-[150px] ml-2"
                          value={student.notes}
                          onChange={(e) => handleSetStudentNotes(student.studentId, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMETABLE & ACTIVITIES */}
          {activeTab === 'timetable' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock size={20} className="text-primary" /> Today&apos;s Class Timetable
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schedule and track core teaching activities and classroom events for {selectedDate}.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowAddActivityModal(true)}
                >
                  <Plus size={15} /> Add Activity
                </button>
              </div>

              {overview?.activities.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Clock className="mx-auto text-muted-foreground mb-2" size={40} />
                  <h4 className="font-bold text-base text-foreground">No activities scheduled</h4>
                  <p className="text-xs text-muted-foreground mt-1">There are no activities planned for this classroom today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overview?.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-5 rounded-xl border border-border bg-card/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-muted">
                            {act.startTime} – {act.endTime}
                          </span>
                          <span className="badge b-purple text-xs font-semibold">
                            {act.activityType.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Teacher: <strong className="text-foreground">{act.teacherName}</strong>
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground">{act.title}</h4>
                        {act.description && <p className="text-xs text-muted-foreground">{act.description}</p>}
                        {act.actualOutcome && (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700">
                            <strong>Execution Notes:</strong> {act.actualOutcome}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {act.status === 'COMPLETED' ? (
                          <span className="badge b-success text-xs font-semibold py-1 px-3 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Completed
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => setShowCompleteActivityModal(act.id)}
                            >
                              <Check size={14} /> Mark Completed
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost text-rose-500"
                              onClick={() => handleUpdateActivityStatus(act.id, 'CANCELLED')}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OBSERVATIONS */}
          {activeTab === 'observations' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText size={20} className="text-amber-500" /> Child Observations
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Record general classroom notes or individual student observations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowObservationModal(true)}
                >
                  <Plus size={15} /> Record Observation
                </button>
              </div>

              {overview?.observations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <FileText className="mx-auto text-muted-foreground mb-2" size={40} />
                  <h4 className="font-bold text-base text-foreground">No observations recorded</h4>
                  <p className="text-xs text-muted-foreground mt-1">Record your observations on student participation or learning progress.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overview?.observations.map((obs) => (
                    <div key={obs.id} className="p-5 rounded-xl border border-border bg-card/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{obs.studentName}</span>
                        <span className="badge b-neutral text-xs">{obs.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{obs.narrative}&rdquo;</p>
                      <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                        Observed on: {new Date(obs.observedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === 'history' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <HistoryIcon size={20} className="text-blue-500" /> Daily Diary Logs & History
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Audit trail of past attendance, completed activities, and child observations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={loadHistory}
                >
                  <RefreshCw size={13} /> Refresh History
                </button>
              </div>

              {loadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="glass-panel p-4 animate-pulse h-16" />
                  ))}
                </div>
              ) : historyData ? (
                <div className="space-y-6">
                  {/* Past Attendance Logs */}
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-3">Recent Attendance Records</h4>
                    {historyData.attendance.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No attendance records found for this date.</p>
                    ) : (
                      <div className="border border-border rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-muted font-bold text-muted-foreground">
                            <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Adm No</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {historyData.attendance.map((row) => (
                              <tr key={row.id} className="hover:bg-card/50">
                                <td className="p-3 font-mono">{row.date}</td>
                                <td className="p-3 font-semibold text-foreground">{row.studentName}</td>
                                <td className="p-3 font-mono">{row.admissionNo}</td>
                                <td className="p-3">
                                  <span className={`badge text-[10px] ${row.status === 'PRESENT' ? 'b-success' : row.status === 'ABSENT' ? 'b-danger' : 'b-warning'}`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">{row.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD ACTIVITY */}
      {showAddActivityModal && (
        <Modal
          isOpen={showAddActivityModal}
          onClose={() => setShowAddActivityModal(false)}
          title="Schedule Classroom Activity"
        >
          <form onSubmit={handleAddActivity} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Activity Title *</label>
              <input
                type="text"
                className="input text-sm mt-1"
                placeholder="e.g. Drawing & Coloring, Circle Time..."
                value={newActTitle}
                onChange={(e) => setNewActTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Activity Type</label>
                <select
                  className="select text-xs mt-1"
                  value={newActType}
                  onChange={(e) => setNewActType(e.target.value)}
                >
                  <option value="CORE_TEACHING">Core Teaching</option>
                  <option value="ACTIVITY">Activity</option>
                  <option value="OUTDOOR">Outdoor Play</option>
                  <option value="STORY_TIME">Story Time</option>
                  <option value="RHYMES">Rhymes & Music</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Assigned Teacher</label>
                <select
                  className="select text-xs mt-1"
                  value={newActTeacherId}
                  onChange={(e) => setNewActTeacherId(e.target.value)}
                >
                  <option value="">Default Class Teacher</option>
                  {context?.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Start Time</label>
                <input
                  type="time"
                  className="input text-xs mt-1"
                  value={newActStartTime}
                  onChange={(e) => setNewActStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">End Time</label>
                <input
                  type="time"
                  className="input text-xs mt-1"
                  value={newActEndTime}
                  onChange={(e) => setNewActEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Notes / Description</label>
              <textarea
                className="input text-xs mt-1 h-20"
                placeholder="Details or instructions for the activity..."
                value={newActDesc}
                onChange={(e) => setNewActDesc(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowAddActivityModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={submittingAct}
              >
                {submittingAct ? <RefreshCw className="animate-spin" size={14} /> : <Plus size={14} />}
                Save Activity
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RECORD OBSERVATION */}
      {showObservationModal && (
        <Modal
          isOpen={showObservationModal}
          onClose={() => setShowObservationModal(false)}
          title="Record Child Observation"
        >
          <form onSubmit={handleAddObservation} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Select Student *</label>
              <select
                className="select text-xs mt-1"
                value={obsStudentId}
                onChange={(e) => setObsStudentId(e.target.value)}
                required
              >
                <option value="">-- Choose Student --</option>
                {attendanceRegister.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Category</label>
                <select
                  className="select text-xs mt-1"
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Learning">Learning & Core</option>
                  <option value="Behavior">Behavior & Social</option>
                  <option value="Health">Health & Wellness</option>
                  <option value="Meal/Nap">Meal & Nap</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Concern Level</label>
                <select
                  className="select text-xs mt-1"
                  value={obsConcern}
                  onChange={(e) => setObsConcern(e.target.value)}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="ELEVATED">Elevated</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Observation Details *</label>
              <textarea
                className="input text-xs mt-1 h-24"
                placeholder="What did the child do or demonstrate today?..."
                value={obsNarrative}
                onChange={(e) => setObsNarrative(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowObservationModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={submittingObs}
              >
                {submittingObs ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                Save Observation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: COMPLETE ACTIVITY */}
      {showCompleteActivityModal && (
        <Modal
          isOpen={!!showCompleteActivityModal}
          onClose={() => setShowCompleteActivityModal(null)}
          title="Mark Activity Completed"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Activity Outcome / Execution Notes</label>
              <textarea
                className="input text-xs mt-1 h-20"
                placeholder="e.g. Children practiced color recognition actively..."
                value={activityNotesInput}
                onChange={(e) => setActivityNotesInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowCompleteActivityModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() =>
                  handleUpdateActivityStatus(showCompleteActivityModal, 'COMPLETED', activityNotesInput)
                }
              >
                <CheckCircle2 size={14} /> Confirm Completion
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
