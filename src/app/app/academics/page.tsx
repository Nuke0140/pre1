'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen, Sparkles, Plus, Send, GraduationCap, School,
  CalendarCheck, UserCheck, ArrowRight, CheckCircle2, AlertTriangle,
  Clock, Calendar, Building, Search, Eye, Filter, RefreshCw,
  Award, TrendingUp, CheckCircle, AlertCircle, FileText, X,
  Layers, Users, ChevronRight, Download, Printer, Target, Flame
} from 'lucide-react'
import { PageHead, StatusBadge, Skeleton, Avatar, Segmented, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { enumLabel, timeAgo, fmtDate } from '@/lib/format'

// -- Master / Setup Context Types --
interface AcademicSessionOption {
  id: string
  name: string
  isCurrent: boolean
}

interface BranchOption {
  id: string
  name: string
  isMain: boolean
}

interface ProgramOption {
  id: string
  name: string
  code: string
  programType: string
  ageMinMonths: number | null
  ageMaxMonths: number | null
  capacity: number
  isActive: boolean
}

interface ClassroomOption {
  id: string
  name: string
  code: string
  programType: string
  capacity: number
  primaryTeacher?: { id: string; fullName: string } | null
  studentCount?: number
  students?: number
}

// -- Domain Types --
interface LearningGoal {
  id: string
  name: string
  code?: string | null
  description?: string | null
  orderIndex: number
}

interface LearningArea {
  id: string
  name: string
  code?: string | null
  description?: string | null
  orderIndex: number
  goals: LearningGoal[]
}

interface Curriculum {
  id: string
  name: string
  programType: string
  framework?: string | null
  description?: string | null
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  version: string
  effectiveFrom?: string | null
  effectiveTo?: string | null
  program?: { name: string; code: string } | null
  academicSession?: { name: string } | null
  learningAreas: LearningArea[]
  _count?: { activities: number }
}

interface Activity {
  id: string
  title: string
  activityDate: string
  startTime?: string | null
  endTime?: string | null
  durationMinutes?: number | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  description?: string | null
  materials?: string | null
  instructions?: string | null
  expectedOutcome?: string | null
  classroom: { id: string; name: string; code: string; programType: string }
  curriculum?: { id: string; name: string } | null
  learningGoal?: { id: string; name: string; learningArea: { name: string } } | null
  teacher?: { id: string; fullName: string } | null
  observations?: any[]
}

interface Observation {
  id: string
  studentId: string
  narrative: string
  category?: string | null
  concern: string
  status: string
  milestoneTags?: string | null
  observedAt: string
  student: { id: string; firstName: string; lastName: string; admissionNo: string; photoUrl?: string | null }
  classroom?: { id: string; name: string; code: string } | null
  learningGoal?: { id: string; name: string; learningArea?: { name: string } } | null
}

interface DashboardStats {
  sessionsCount: number
  activeSession: { id: string; name: string } | null
  programsCount: number
  classroomsCount: number
  teachersCount: number
  enrolledStudentsCount: number
  curriculumCount: number
  activitiesCount: number
  activitiesTodayCount: number
  observationsCount: number
  observationsNeedsAttentionCount: number
  progressAchievedCount: number
  progressTotalCount: number
  masteryPercentage: number
}

const TABS = [
  { key: 'dashboard', label: 'Academic Dashboard' },
  { key: 'classes', label: 'Classes & Sections' },
  { key: 'curriculum', label: 'Curriculum & Goals' },
  { key: 'activities', label: 'Activities & Planner' },
  { key: 'observations', label: 'Observations' },
  { key: 'progress', label: 'Progress Matrix' },
  { key: 'reports', label: 'Academic Reports' },
]

export default function AcademicsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // -- Setup Masters (Authoritative Context) --
  const [sessions, setSessions] = useState<AcademicSessionOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; fullName?: string; name?: string }>>([])
  const [students, setStudents] = useState<Array<{ id: string; firstName?: string; lastName?: string; name?: string; admissionNo?: string }>>([])

  // -- Scoped Filter Bar --
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [filterClassroomId, setFilterClassroomId] = useState<string>('')
  const [filterProgramType, setFilterProgramType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // -- Domain Data States --
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [curricula, setCurricula] = useState<Curriculum[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [observations, setObservations] = useState<Observation[]>([])

  // -- Inspector / Modal States --
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassroomOption | null>(null)

  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false)
  const [areaModalOpen, setAreaModalOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')

  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [obsModalOpen, setObsModalOpen] = useState(false)

  // Student 360 & Report Drawer
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [studentProfile, setStudentProfile] = useState<any | null>(null)
  const [studentReport, setStudentReport] = useState<any | null>(null)
  const [studentProgressMatrix, setStudentProgressMatrix] = useState<any | null>(null)

  // -- 1. Load Master Setup Data --
  useEffect(() => {
    async function loadMasters() {
      try {
        const [sessRes, brRes, progRes, clsRes, uRes, stuRes] = await Promise.all([
          fetch('/api/v1/academic-years').then((r) => r.json()),
          fetch('/api/v1/branches').then((r) => r.json()),
          fetch('/api/v1/programs').then((r) => r.json()),
          fetch('/api/v1/classrooms').then((r) => r.json()),
          fetch('/api/v1/users?role=TEACHER').then((r) => r.json()),
          fetch('/api/v1/students?pageSize=100').then((r) => r.json()),
        ])

        if (sessRes.success && sessRes.data.length > 0) {
          setSessions(sessRes.data)
          const current = sessRes.data.find((s: AcademicSessionOption) => s.isCurrent) || sessRes.data[0]
          setSelectedSessionId(current.id)
        }
        if (brRes.success && brRes.data.length > 0) {
          setBranches(brRes.data)
          const main = brRes.data.find((b: BranchOption) => b.isMain) || brRes.data[0]
          setSelectedBranchId(main.id)
        }
        if (progRes.success) setPrograms(progRes.data || [])
        if (clsRes.success) setClassrooms(clsRes.data || [])
        if (uRes.success) setTeachers(uRes.data || [])
        if (stuRes.success) {
          setStudents(
            (stuRes.data || []).map((s: any) => ({
              id: s.id,
              name: s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : s.name,
              firstName: s.firstName,
              lastName: s.lastName,
              admissionNo: s.admissionNo,
            }))
          )
        }
      } catch (err: any) {
        console.error('Failed to load setup masters:', err)
        toast.error('Could not load Setup master data', err.message)
      }
    }
    loadMasters()
  }, [])

  // -- 2. Load Academic Domain Data Scoped by Session & Branch --
  const loadAcademicData = useCallback(async () => {
    if (!selectedSessionId) return
    setLoading(true)
    try {
      const qParams = new URLSearchParams({
        academicSessionId: selectedSessionId,
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
        ...(filterClassroomId ? { classroomId: filterClassroomId } : {}),
      })

      const [dashRes, currRes, actRes, obsRes] = await Promise.all([
        fetch(`/api/v1/academics/dashboard?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/academics/curriculum?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/academics/activities?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/academics/observations?${qParams.toString()}`).then((r) => r.json()),
      ])

      if (dashRes.success) setDashboardStats(dashRes.data)
      if (currRes.success) setCurricula(currRes.data || [])
      if (actRes.success) setActivities(actRes.data || [])
      if (obsRes.success) setObservations(obsRes.data || [])
    } catch (err: any) {
      toast.error('Error fetching academic data', err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId, selectedBranchId, filterClassroomId, toast])

  useEffect(() => {
    if (selectedSessionId) {
      loadAcademicData()
    }
  }, [loadAcademicData, selectedSessionId])

  // -- 3. Student Academic Profile & Report Inspector --
  const inspectStudent = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setStudentModalOpen(true)
    setBusy(true)
    try {
      const qParams = new URLSearchParams({ academicSessionId: selectedSessionId })
      const [profileRes, reportRes, progRes] = await Promise.all([
        fetch(`/api/v1/academics/students/${studentId}?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/academics/reports/student/${studentId}?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/academics/students/${studentId}/progress?${qParams.toString()}`).then((r) => r.json()),
      ])

      if (profileRes.success) setStudentProfile(profileRes.data)
      if (reportRes.success) setStudentReport(reportRes.data)
      if (progRes.success) setStudentProgressMatrix(progRes.data)
    } catch (err: any) {
      toast.error('Failed to load student profile', err.message)
    } finally {
      setBusy(false)
    }
  }

  // -- 4. Handlers --
  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          programType: fd.get('programType'),
          capacity: parseInt(String(fd.get('capacity')) || '20', 10),
          primaryTeacherId: fd.get('teacherId') || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Classroom section created')
        setClassModalOpen(false)
        const updated = await fetch('/api/v1/classrooms').then((r) => r.json())
        if (updated.success) setClassrooms(updated.data)
        loadAcademicData()
      } else {
        toast.error('Failed to create section', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to create section', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleAssignTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedClass) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/v1/classrooms/${selectedClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryTeacherId: fd.get('teacherId') || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Teacher assignment updated')
        setAssignModalOpen(false)
        setSelectedClass(null)
        const updated = await fetch('/api/v1/classrooms').then((r) => r.json())
        if (updated.success) setClassrooms(updated.data)
        loadAcademicData()
      } else {
        toast.error('Failed to assign teacher', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to assign teacher', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateCurriculum = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/academics/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          programType: fd.get('programType'),
          academicSessionId: selectedSessionId,
          framework: fd.get('framework') || 'EYFS Foundational',
          description: fd.get('description'),
          seedDefaultAreas: fd.get('seedDefaultAreas') === 'true',
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Curriculum framework created')
        setCurriculumModalOpen(false)
        loadAcademicData()
      } else {
        toast.error('Failed to create curriculum', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to create curriculum', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateArea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCurriculumId) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/academics/learning-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumId: selectedCurriculumId,
          name: fd.get('name'),
          code: fd.get('code') || undefined,
          description: fd.get('description') || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Learning Area added')
        setAreaModalOpen(false)
        loadAcademicData()
      } else {
        toast.error('Failed to add learning area', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to add learning area', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedAreaId) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/academics/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learningAreaId: selectedAreaId,
          name: fd.get('name'),
          code: fd.get('code') || undefined,
          description: fd.get('description') || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Milestone goal added')
        setGoalModalOpen(false)
        loadAcademicData()
      } else {
        toast.error('Failed to add goal', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to add goal', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/academics/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: fd.get('classroomId'),
          title: fd.get('title'),
          activityDate: fd.get('activityDate'),
          startTime: fd.get('startTime') || undefined,
          endTime: fd.get('endTime') || undefined,
          durationMinutes: fd.get('durationMinutes') || 30,
          curriculumId: fd.get('curriculumId') || undefined,
          learningGoalId: fd.get('learningGoalId') || undefined,
          teacherId: fd.get('teacherId') || undefined,
          description: fd.get('description') || undefined,
          materials: fd.get('materials') || undefined,
          expectedOutcome: fd.get('expectedOutcome') || undefined,
          academicSessionId: selectedSessionId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Activity scheduled')
        setActivityModalOpen(false)
        loadAcademicData()
      } else {
        toast.error('Failed to schedule activity', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to schedule activity', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateActivityStatus = async (activityId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const res = await fetch(`/api/v1/academics/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Activity marked as ${enumLabel(status)}`)
        loadAcademicData()
      } else {
        toast.error('Failed to update status', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to update status', err.message)
    }
  }

  const handleCreateObservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/academics/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: fd.get('studentId'),
          narrative: fd.get('narrative'),
          category: fd.get('category') || undefined,
          concern: fd.get('concern') || 'NORMAL',
          learningGoalId: fd.get('learningGoalId') || undefined,
          progressStage: fd.get('progressStage') || undefined,
          publishToTimeline: fd.get('publishToTimeline') === 'true',
          academicSessionId: selectedSessionId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(
          fd.get('publishToTimeline') === 'true'
            ? 'Observation published to parent timeline!'
            : 'Observation saved'
        )
        setObsModalOpen(false)
        loadAcademicData()
      } else {
        toast.error('Failed to save observation', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to save observation', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handlePublishObservation = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/observations/${id}/publish`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('Observation published to Parent Portal Timeline')
        loadAcademicData()
      } else {
        toast.error('Failed to publish', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to publish', err.message)
    }
  }

  const handleUpdateProgressStage = async (studentId: string, goalId: string, stage: string) => {
    try {
      const res = await fetch(`/api/v1/academics/students/${studentId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learningGoalId: goalId,
          stage,
          academicSessionId: selectedSessionId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Milestone updated to ${enumLabel(stage)}`)
        inspectStudent(studentId)
        loadAcademicData()
      } else {
        toast.error('Failed to update stage', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to update stage', err.message)
    }
  }

  // -- Flattened Goals Helper for Selectors --
  const allAvailableGoals = useMemo(() => {
    const goals: Array<{ id: string; name: string; areaName: string; currName: string }> = []
    curricula.forEach((c) => {
      c.learningAreas?.forEach((a) => {
        a.goals?.forEach((g) => {
          goals.push({
            id: g.id,
            name: g.name,
            areaName: a.name,
            currName: c.name,
          })
        })
      })
    })
    return goals
  }, [curricula])

  // Filtered lists
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      if (filterProgramType && c.programType !== filterProgramType) return false
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [classrooms, filterProgramType, searchQuery])

  const filteredCurricula = useMemo(() => {
    return curricula.filter((c) => {
      if (filterProgramType && c.programType !== filterProgramType) return false
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [curricula, filterProgramType, searchQuery])

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (filterClassroomId && a.classroom?.id !== filterClassroomId) return false
      if (filterProgramType && a.classroom?.programType !== filterProgramType) return false
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [activities, filterClassroomId, filterProgramType, searchQuery])

  const filteredObservations = useMemo(() => {
    return observations.filter((o) => {
      if (filterClassroomId && o.classroom?.id !== filterClassroomId) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchStudent = `${o.student?.firstName || ''} ${o.student?.lastName || ''}`.toLowerCase().includes(q)
        const matchNarrative = o.narrative.toLowerCase().includes(q)
        if (!matchStudent && !matchNarrative) return false
      }
      return true
    })
  }, [observations, filterClassroomId, searchQuery])

  return (
    <div className="page-shell">
      {/* -- Page Header -- */}
      <PageHead
        title="Academics & Learning"
        sub="Continuous developmental journey: Master Sessions -> Classroom Sections -> Curriculum Frameworks -> Activities -> Observations -> Milestone Mastery -> Parent Timeline."
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setObsModalOpen(true)}>
              <Sparkles size={15} /> Record Observation
            </button>
            <button className="btn btn-secondary" onClick={() => setActivityModalOpen(true)}>
              <CalendarCheck size={15} /> Schedule Activity
            </button>
            <button className="btn btn-primary" onClick={() => setCurriculumModalOpen(true)}>
              <Plus size={15} /> New Curriculum
            </button>
          </div>
        }
      />

      {/* -- Canonical Metric Strip -- */}
      <div className="metric-strip" style={{ marginBottom: 16 }}>
        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Enrolled</span>
            <Users size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="m-val">{dashboardStats?.enrolledStudentsCount ?? 0}</div>
          <div className="m-meta">In session</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Sections</span>
            <School size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="m-val">{dashboardStats?.classroomsCount ?? classrooms.length}</div>
          <div className="m-meta">Active Classrooms</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Teachers</span>
            <UserCheck size={14} style={{ color: 'var(--success)' }} />
          </div>
          <div className="m-val m-success">{dashboardStats?.teachersCount ?? teachers.length}</div>
          <div className="m-meta">Assigned Staff</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Curriculum</span>
            <BookOpen size={14} style={{ color: '#8b5cf6' }} />
          </div>
          <div className="m-val">{dashboardStats?.curriculumCount ?? curricula.length}</div>
          <div className="m-meta">Active Frameworks</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Today's Activities</span>
            <Flame size={14} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="m-val" style={{ color: '#B45309' }}>{dashboardStats?.activitiesTodayCount ?? 0}</div>
          <div className="m-meta">Scheduled Today</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Observations</span>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="m-val">{dashboardStats?.observationsCount ?? observations.length}</div>
          <div className="m-meta">Logged Moments</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Attention</span>
            <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
          </div>
          <div className="m-val" style={{ color: 'var(--danger)' }}>{dashboardStats?.observationsNeedsAttentionCount ?? 0}</div>
          <div className="m-meta">Flagged Concerns</div>
        </div>

        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Mastery</span>
            <Target size={14} style={{ color: 'var(--success)' }} />
          </div>
          <div className="m-val m-success">{dashboardStats?.masteryPercentage ?? 0}%</div>
          <div className="m-meta">Achieved Goals</div>
        </div>
      </div>

      {/* -- Canonical School Context Bar -- */}
      <div className="school-context-bar" style={{ marginBottom: 16 }}>
        <div className="context-item">
          <label><Calendar size={14} style={{ color: 'var(--foreground-muted)' }} /> Session:</label>
          <select
            className="select"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <span className="context-divider" />

        <div className="context-item">
          <label><Building size={14} style={{ color: 'var(--foreground-muted)' }} /> Branch:</label>
          <select
            className="select"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.isMain ? '(Main)' : ''}
              </option>
            ))}
          </select>
        </div>

        <span className="context-divider" />

        <div className="context-item">
          <label>Program:</label>
          <select
            className="select"
            value={filterProgramType}
            onChange={(e) => setFilterProgramType(e.target.value)}
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.programType}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <span className="context-divider" />

        <div className="context-item">
          <label><School size={14} style={{ color: 'var(--foreground-muted)' }} /> Section:</label>
          <select
            className="select"
            value={filterClassroomId}
            onChange={(e) => setFilterClassroomId(e.target.value)}
          >
            <option value="">All Classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="input-search" style={{ maxWidth: 220 }}>
            <Search size={14} />
            <input
              className="input"
              placeholder="Search curriculum, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={loadAcademicData}
            title="Reload Scoped Academic Data"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* -- Navigation Tabs -- */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: 16 }}>
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={TABS}
        />
      </div>

      {/* -- Tab Content Areas -- */}
      {loading ? (
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton h={40} />
          <Skeleton h={40} />
          <Skeleton h={40} />
        </div>
      ) : (
        <>
          {/* ====== TAB 1: ACADEMIC DASHBOARD ====== */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
              {/* Today's Activities Panel */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarCheck size={18} style={{ color: 'var(--primary)' }} />
                    Today's Classroom Activities
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('activities')}>
                    View All <ArrowRight size={13} />
                  </button>
                </div>
                {activities.filter((a) => {
                  const today = new Date().toISOString().slice(0, 10)
                  return a.activityDate?.slice(0, 10) === today
                }).length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                    No activities scheduled for today. Click "Schedule Activity" above to plan one.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activities
                      .filter((a) => a.activityDate?.slice(0, 10) === new Date().toISOString().slice(0, 10))
                      .map((act) => (
                        <div
                          key={act.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{act.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--c-muted)', display: 'flex', gap: 12, marginTop: 4 }}>
                              <span>Section: {act.classroom?.name}</span>
                              {act.startTime && <span>Time: {act.startTime} ({act.durationMinutes || 30}m)</span>}
                              {act.teacher && <span>Teacher: {act.teacher.fullName}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className={`badge ${act.status === 'COMPLETED' ? 'b-success' : act.status === 'IN_PROGRESS' ? 'b-primary' : 'b-neutral'}`}>
                              {enumLabel(act.status)}
                            </span>
                            {act.status === 'PLANNED' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleUpdateActivityStatus(act.id, 'IN_PROGRESS')}
                              >
                                Start
                              </button>
                            )}
                            {act.status === 'IN_PROGRESS' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdateActivityStatus(act.id, 'COMPLETED')}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Triage & Observations Requiring Follow-Up */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                    Concern Triage & Support Needs
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('observations')}>
                    View All <ArrowRight size={13} />
                  </button>
                </div>
                {observations.filter((o) => o.concern !== 'NORMAL').length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                    <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                    No urgent developmental concerns flagged in this session. All students on track!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {observations
                      .filter((o) => o.concern !== 'NORMAL')
                      .slice(0, 5)
                      .map((obs) => (
                        <div
                          key={obs.id}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            border: '1px solid #fed7aa',
                            background: '#fffbeb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>
                                {obs.student?.firstName} {obs.student?.lastName}
                              </span>
                              <span className={`badge ${obs.concern === 'URGENT' ? 'b-danger' : 'b-warning'}`}>
                                {enumLabel(obs.concern)}
                              </span>
                              {obs.category && <span className="badge b-neutral">{obs.category}</span>}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--c-ink)', marginTop: 6, lineHeight: 1.4 }}>
                              {obs.narrative}
                            </p>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => inspectStudent(obs.studentId)}
                          >
                            <Eye size={14} /> Inspect Child
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== TAB 2: CLASSES & SECTIONS ====== */}
          {activeTab === 'classes' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Configured Sections & Rosters ({filteredClassrooms.length})
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => setClassModalOpen(true)}>
                  <Plus size={14} /> Add Section
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Section / Classroom</th>
                    <th>Program</th>
                    <th>Capacity & Enrolment</th>
                    <th>Primary Educator</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassrooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--c-muted)' }}>
                        No classrooms found matching criteria. Click "Add Section" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredClassrooms.map((c) => {
                      const count = c.studentCount ?? c.students ?? 0
                      const isFull = count >= c.capacity
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--c-ink)' }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>Code: {c.code || 'N/A'}</div>
                          </td>
                          <td>
                            <span className="badge b-primary">{enumLabel(c.programType)}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 80, height: 6, background: 'var(--bg-sunken)', borderRadius: 3, overflow: 'hidden' }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, Math.round((count / (c.capacity || 20)) * 100))}%`,
                                    background: isFull ? '#EF4444' : '#10B981',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>
                                {count} / {c.capacity}
                              </span>
                              {isFull && <span className="badge b-danger" style={{ fontSize: 10 }}>FULL</span>}
                            </div>
                          </td>
                          <td>
                            {c.primaryTeacher ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                <Avatar name={c.primaryTeacher.fullName} size="sm" />
                                <span>{c.primaryTeacher.fullName}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setSelectedClass(c)
                                setAssignModalOpen(true)
                              }}
                            >
                              <UserCheck size={14} /> Assign Teacher
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ====== TAB 3: CURRICULUM & GOALS ====== */}
          {activeTab === 'curriculum' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>Developmental Curricula & Milestone Goals</h3>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
                    Scoped by Academic Session & Program. Teachers observe children against these developmental goals.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setCurriculumModalOpen(true)}>
                  <Plus size={15} /> Add Curriculum
                </button>
              </div>

              {filteredCurricula.length === 0 ? (
                <div className="card" style={{ padding: 36, textAlign: 'center' }}>
                  <BookOpen size={36} style={{ color: 'var(--c-muted)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600 }}>No curriculum frameworks found</div>
                  <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 4 }}>
                    Create a curriculum for {selectedSessionId ? 'the selected session' : 'your school'} with foundational developmental areas.
                  </p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setCurriculumModalOpen(true)}>
                    <Plus size={14} /> Seed Foundational Curriculum
                  </button>
                </div>
              ) : (
                filteredCurricula.map((curr) => (
                  <div key={curr.id} className="card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 14, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-ink)' }}>{curr.name}</span>
                          <span className="badge b-primary">{enumLabel(curr.programType)}</span>
                          <span className={`badge ${curr.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>
                            {curr.status}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>v{curr.version}</span>
                        </div>
                        {curr.description && (
                          <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>{curr.description}</p>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4, display: 'flex', gap: 16 }}>
                          <span>Framework: {curr.framework || 'Standard'}</span>
                          {curr.academicSession && <span>Session: {curr.academicSession.name}</span>}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedCurriculumId(curr.id)
                          setAreaModalOpen(true)
                        }}
                      >
                        <Plus size={14} /> Add Learning Area
                      </button>
                    </div>

                    {/* Learning Areas and Goals Tree */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                      {curr.learningAreas?.length === 0 ? (
                        <div style={{ fontSize: 13, color: 'var(--c-muted)', padding: 12 }}>
                          No learning areas added yet. Click "Add Learning Area" to add areas like Literacy or Motor Skills.
                        </div>
                      ) : (
                        curr.learningAreas?.map((area) => (
                          <div
                            key={area.id}
                            style={{
                              background: 'var(--bg-sunken, #f8fafc)',
                              borderRadius: 8,
                              border: '1px solid var(--border-color, #e2e8f0)',
                              padding: 12,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-ink)' }}>
                                {area.name} {area.code ? `(${area.code})` : ''}
                              </div>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', fontSize: 11 }}
                                onClick={() => {
                                  setSelectedAreaId(area.id)
                                  setGoalModalOpen(true)
                                }}
                              >
                                <Plus size={12} /> Add Goal
                              </button>
                            </div>

                            {area.goals?.length === 0 ? (
                              <div style={{ fontSize: 11, color: 'var(--c-muted)', fontStyle: 'italic' }}>
                                No milestone goals yet
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {area.goals.map((g) => (
                                  <div
                                    key={g.id}
                                    style={{
                                      background: '#ffffff',
                                      padding: '6px 10px',
                                      borderRadius: 6,
                                      border: '1px solid #e2e8f0',
                                      fontSize: 12,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <span style={{ fontWeight: 500 }}>{g.name}</span>
                                    {g.code && <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{g.code}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ====== TAB 4: ACTIVITIES & PLANNER ====== */}
          {activeTab === 'activities' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  Scheduled Classroom Activities ({filteredActivities.length})
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => setActivityModalOpen(true)}>
                  <Plus size={14} /> Schedule Activity
                </button>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Activity & Date</th>
                    <th>Classroom Section</th>
                    <th>Learning Goal</th>
                    <th>Educator</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--c-muted)' }}>
                        No activities scheduled. Click "Schedule Activity" to create a lesson plan.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => (
                      <tr key={act.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--c-ink)' }}>{act.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--c-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                            <span>Date: {fmtDate(act.activityDate)}</span>
                            {act.startTime && <span>Time: {act.startTime} ({act.durationMinutes || 30}m)</span>}
                          </div>
                        </td>
                        <td>
                          <span className="badge b-primary">{act.classroom?.name}</span>
                        </td>
                        <td>
                          {act.learningGoal ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{act.learningGoal.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{act.learningGoal.learningArea?.name}</div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>General Activity</span>
                          )}
                        </td>
                        <td>
                          {act.teacher ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                              <Avatar name={act.teacher.fullName} size="sm" />
                              <span>{act.teacher.fullName}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${act.status === 'COMPLETED' ? 'b-success' : act.status === 'IN_PROGRESS' ? 'b-primary' : act.status === 'CANCELLED' ? 'b-danger' : 'b-neutral'}`}>
                            {enumLabel(act.status)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {act.status === 'PLANNED' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleUpdateActivityStatus(act.id, 'IN_PROGRESS')}
                              >
                                Start
                              </button>
                            )}
                            {act.status === 'IN_PROGRESS' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdateActivityStatus(act.id, 'COMPLETED')}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ====== TAB 5: LEARNING OBSERVATIONS ====== */}
          {activeTab === 'observations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>Child Milestone & Learning Observations</h3>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
                    Observations logged by teachers. Publishing shares the milestone card on the Parent Portal Timeline.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setObsModalOpen(true)}>
                  <Plus size={15} /> Record Observation
                </button>
              </div>

              {filteredObservations.length === 0 ? (
                <div className="card" style={{ padding: 36, textAlign: 'center' }}>
                  <Sparkles size={36} style={{ color: 'var(--c-muted)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600 }}>No observations logged yet</div>
                  <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 4 }}>
                    Record classroom moments, developmental milestones, or concern flags for any enrolled child.
                  </p>
                </div>
              ) : (
                filteredObservations.map((obs) => (
                  <div key={obs.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--primary)' }}
                          onClick={() => inspectStudent(obs.studentId)}
                        >
                          {obs.student?.firstName} {obs.student?.lastName} ({obs.student?.admissionNo || 'N/A'})
                        </span>
                        {obs.classroom && <span className="badge b-primary">{obs.classroom.name}</span>}
                        {obs.category && <span className="badge b-neutral">{obs.category}</span>}
                        {obs.concern && obs.concern !== 'NORMAL' && (
                          <span className={`badge ${obs.concern === 'URGENT' ? 'b-danger' : 'b-warning'}`}>
                            {enumLabel(obs.concern)}
                          </span>
                        )}
                        <StatusBadge status={obs.status} />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--c-ink)', lineHeight: 1.5, margin: '4px 0' }}>
                        {obs.narrative}
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 8, display: 'flex', gap: 12 }}>
                        <span>Observed {timeAgo(obs.observedAt)}</span>
                        {obs.learningGoal && <span>Goal: {obs.learningGoal.name}</span>}
                        {obs.milestoneTags && <span>Tags: {obs.milestoneTags}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => inspectStudent(obs.studentId)}
                      >
                        <Eye size={14} /> Profile
                      </button>
                      {obs.status === 'DRAFT' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePublishObservation(obs.id)}
                        >
                          <Send size={13} /> Publish to Parent
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ====== TAB 6: PROGRESS MATRIX ====== */}
          {activeTab === 'progress' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>Developmental Milestone Matrix</h3>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
                    Select a student to view or update milestone progress across all developmental areas.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {students.map((stu) => (
                  <div
                    key={stu.id}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-card)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onClick={() => inspectStudent(stu.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={stu.name || 'Student'} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{stu.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Adm: {stu.admissionNo || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--primary)' }}>
                      <span>Inspect Progress Matrix</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== TAB 7: ACADEMIC REPORTS ====== */}
          {activeTab === 'reports' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} style={{ color: 'var(--primary)' }} />
                  Student Academic Progress Cards
                </h3>
                <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 14 }}>
                  Generates an authoritative, session-scoped progress report with milestone mastery rates, teacher narratives, and developmental feedback.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {students.slice(0, 10).map((stu) => (
                    <div
                      key={stu.id}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{stu.name}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => inspectStudent(stu.id)}
                      >
                        <Eye size={13} /> View Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} style={{ color: '#10b981' }} />
                  Classroom Section Progress Summary
                </h3>
                <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 14 }}>
                  Section-level developmental distribution, average mastery percentage, and total observation counts.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {classrooms.map((cls) => (
                    <div
                      key={cls.id}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{cls.name}</span>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                          Capacity: {cls.studentCount ?? cls.students ?? 0} / {cls.capacity}
                        </div>
                      </div>
                      <span className="badge b-info">{enumLabel(cls.programType)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ====== MODAL: ADD CLASSROOM SECTION ====== */}
      <Modal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title="Add Classroom Section"
        subtitle="Create a new class section for the current academic session"
      >
        <form onSubmit={handleCreateClass}>
          <Field label="Section Name" required helper="e.g. Playgroup Sunflowers or Nursery Blossoms">
            <input className="input" name="name" placeholder="e.g. Nursery Blossoms" required />
          </Field>

          <Field label="Program" required>
            <select className="select" name="programType" required>
              {programs.length > 0 ? (
                programs.map((p) => (
                  <option key={p.id} value={p.programType}>
                    {p.name} ({enumLabel(p.programType)})
                  </option>
                ))
              ) : (
                <>
                  <option value="PLAYGROUP">Playgroup</option>
                  <option value="NURSERY">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="DAYCARE">Daycare</option>
                </>
              )}
            </select>
          </Field>

          <Field label="Max Student Capacity" required helper="Prevents overbooking during admissions">
            <input className="input" name="capacity" type="number" defaultValue="20" min="5" max="50" required />
          </Field>

          <Field label="Primary Teacher" helper="Staff assigned to this classroom section">
            <select className="select" name="teacherId">
              <option value="">-- Assign Later --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setClassModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating...' : 'Create Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====== MODAL: ASSIGN TEACHER ====== */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Teacher - ${selectedClass?.name || ''}`}
        subtitle="Change or set the primary educator for this classroom section"
      >
        {selectedClass && (
          <form onSubmit={handleAssignTeacher}>
            <Field label="Select Teacher" required>
              <select className="select" name="teacherId" defaultValue={selectedClass.primaryTeacher?.id || ''}>
                <option value="">-- None (Unassigned) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName || t.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving...' : 'Save Assignment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ====== MODAL: NEW CURRICULUM FRAMEWORK ====== */}
      <Modal
        open={curriculumModalOpen}
        onClose={() => setCurriculumModalOpen(false)}
        title="Create Curriculum Framework"
        subtitle="Define a developmental curriculum scoped to academic year and program"
      >
        <form onSubmit={handleCreateCurriculum}>
          <Field label="Curriculum Name" required helper="e.g. Nursery EYFS Early Years Framework 2026-27">
            <input className="input" name="name" placeholder="e.g. Nursery EYFS Framework" required />
          </Field>

          <Field label="Program" required>
            <select className="select" name="programType" required>
              {programs.length > 0 ? (
                programs.map((p) => (
                  <option key={p.id} value={p.programType}>
                    {p.name} ({enumLabel(p.programType)})
                  </option>
                ))
              ) : (
                <>
                  <option value="PLAYGROUP">Playgroup</option>
                  <option value="NURSERY">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="DAYCARE">Daycare</option>
                </>
              )}
            </select>
          </Field>

          <Field label="Pedagogical Framework" helper="e.g. EYFS, Montessori, Reggio Emilia, NEP Foundational">
            <input className="input" name="framework" defaultValue="EYFS Foundational" />
          </Field>

          <Field label="Description" helper="Brief outline of goals and focus areas">
            <textarea className="input" name="description" rows={2} placeholder="Focuses on language acquisition, motor skills, and social engagement." />
          </Field>

          <Field label="Seed Default Developmental Areas" helper="Auto-creates standard EYFS areas (Communication, Physical, Personal/Social, Literacy, Mathematics, Expressive Arts)">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" name="seedDefaultAreas" value="true" defaultChecked />
              Include 7 standard preschool developmental areas with default milestone goals
            </label>
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setCurriculumModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Create Curriculum'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====== MODAL: ADD LEARNING AREA ====== */}
      <Modal
        open={areaModalOpen}
        onClose={() => setAreaModalOpen(false)}
        title="Add Learning Area"
        subtitle="Group related milestone goals (e.g. Gross Motor, Language & Phonics)"
      >
        <form onSubmit={handleCreateArea}>
          <Field label="Learning Area Name" required helper="e.g. Fine Motor Skills & Coordination">
            <input className="input" name="name" placeholder="e.g. Fine Motor Skills" required />
          </Field>

          <Field label="Code" helper="Optional abbreviation, e.g. FM, LIT, COG">
            <input className="input" name="code" placeholder="e.g. FM" />
          </Field>

          <Field label="Description">
            <textarea className="input" name="description" rows={2} placeholder="Development of hand-eye coordination and pencil grip." />
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setAreaModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Add Area'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====== MODAL: ADD LEARNING GOAL ====== */}
      <Modal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Add Milestone Goal"
        subtitle="Define a measurable developmental target that educators can assess"
      >
        <form onSubmit={handleCreateGoal}>
          <Field label="Goal Title / Milestone" required helper="e.g. Can hold pencil with pincer grip">
            <input className="input" name="name" placeholder="e.g. Pincer grip mastery" required />
          </Field>

          <Field label="Goal Code" helper="e.g. FM-01, LIT-02">
            <input className="input" name="code" placeholder="e.g. FM-01" />
          </Field>

          <Field label="Description / Success Criteria">
            <textarea className="input" name="description" rows={2} placeholder="Child demonstrates tripod grasp during drawing activities without prompting." />
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setGoalModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====== MODAL: SCHEDULE CLASSROOM ACTIVITY ====== */}
      <Modal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title="Schedule Classroom Activity"
        subtitle="Link classroom lesson planning to curriculum learning goals"
      >
        <form onSubmit={handleCreateActivity}>
          <Field label="Activity Title" required helper="e.g. Morning Phonics Circle or Finger Painting Exploration">
            <input className="input" name="title" placeholder="e.g. Clay Modeling & Hand Coordination" required />
          </Field>

          <Field label="Classroom Section" required>
            <select className="select" name="classroomId" required>
              <option value="">-- Select Section --</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({enumLabel(c.programType)})
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Activity Date" required>
              <input className="input" name="activityDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </Field>

            <Field label="Start Time">
              <input className="input" name="startTime" type="time" defaultValue="09:30" />
            </Field>
          </div>

          <Field label="Lead Educator">
            <select className="select" name="teacherId">
              <option value="">-- Assigned Section Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName || t.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Curriculum Milestone Goal" helper="Aligns activity with developmental framework">
            <select className="select" name="learningGoalId">
              <option value="">-- General Play / No Specific Goal --</option>
              {allAvailableGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.areaName}: {g.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Materials Required" helper="e.g. Playdough, wooden rollers, shape cutters">
            <input className="input" name="materials" placeholder="e.g. Playdough, rollers, paper" />
          </Field>

          <Field label="Expected Outcome">
            <textarea className="input" name="expectedOutcome" rows={2} placeholder="Children experiment with shapes and strengthen finger muscles." />
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setActivityModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Scheduling...' : 'Schedule Activity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====== MODAL: RECORD LEARNING OBSERVATION ====== */}
      <Modal
        open={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        title="Record Learning Observation"
        subtitle="Capture milestones, photos/narrative, and publish to Parent Portal"
      >
        <form onSubmit={handleCreateObservation}>
          <Field label="Child" required>
            <select className="select" name="studentId" required>
              <option value="">-- Select Child --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Adm: {s.admissionNo || 'N/A'})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Milestone Goal Mapped" helper="Directly updates student developmental milestone">
            <select className="select" name="learningGoalId">
              <option value="">-- General Observation --</option>
              {allAvailableGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.areaName}: {g.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Milestone Stage" helper="Optional quick assessment">
            <select className="select" name="progressStage" defaultValue="INTRODUCED">
              <option value="NOT_STARTED">Not Started</option>
              <option value="INTRODUCED">Introduced</option>
              <option value="DEVELOPING">Developing (In Progress)</option>
              <option value="ACHIEVED">Achieved (Mastered)</option>
            </select>
          </Field>

          <Field label="Concern / Triage" helper="Raises follow-up task if attention is needed">
            <select className="select" name="concern" defaultValue="NORMAL">
              <option value="NORMAL">Normal Developmental Progress</option>
              <option value="PROGRESS">Positive Progress / Star Moment</option>
              <option value="NEEDS_ATTENTION">Needs Attention (Raises follow-up task)</option>
              <option value="URGENT">Urgent Concern (Alerts Leadership)</option>
            </select>
          </Field>

          <Field label="Teacher Narrative" required helper="Detailed observations of what the child did, said, or achieved">
            <textarea
              className="input"
              name="narrative"
              rows={3}
              placeholder="e.g. Aarav successfully balanced 6 wooden blocks without them falling over, exhibiting great patience and concentration."
              required
            />
          </Field>

          <Field label="Milestone Tags" helper="Comma-separated keywords for portfolio filtering">
            <input className="input" name="milestoneTags" placeholder="e.g. block-building, balance, fine-motor" />
          </Field>

          <Field label="Publishing Action">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" name="publishToTimeline" value="true" defaultChecked />
              Publish immediately to Parent Portal Timeline
            </label>
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setObsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving...' : 'Record Observation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ====== MODAL / DRAWER: 360 STUDENT ACADEMIC INSPECTOR ====== */}
      <Modal
        open={studentModalOpen}
        onClose={() => {
          setStudentModalOpen(false)
          setSelectedStudentId('')
          setStudentProfile(null)
          setStudentReport(null)
          setStudentProgressMatrix(null)
        }}
        title="Student Academic Profile (360)"
        subtitle="Academic Session developmental matrix, milestone mastery, and official report card"
      >
        {busy && !studentProfile ? (
          <div style={{ padding: 24 }}>
            <Skeleton h={30} />
            <div style={{ height: 12 }} />
            <Skeleton h={80} />
          </div>
        ) : studentProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Student Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 14,
                background: 'var(--bg-sunken)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={`${studentProfile.student.firstName} ${studentProfile.student.lastName || ''}`} size="lg" />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-ink)' }}>
                    {studentProfile.student.firstName} {studentProfile.student.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                    <span>Adm: {studentProfile.student.admissionNo}</span>
                    <span>Classroom: {studentProfile.classroom?.name || 'Unallocated'}</span>
                    <span>Session: {studentProfile.session?.name}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', textTransform: 'uppercase' }}>Overall Mastery</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
                  {studentReport?.summary?.masteryRate ?? 0}%
                </div>
              </div>
            </div>

            {/* Guardians & Teachers Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div style={{ padding: 10, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Primary Educator:</span>
                <div style={{ marginTop: 4, color: 'var(--c-muted)' }}>
                  {studentProfile.primaryTeacher?.fullName || 'Not assigned'}
                </div>
              </div>
              <div style={{ padding: 10, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--c-ink)' }}>Guardians (Parent Portal):</span>
                <div style={{ marginTop: 4, color: 'var(--c-muted)' }}>
                  {studentProfile.guardians?.map((g: any) => g.fullName).join(', ') || 'None listed'}
                </div>
              </div>
            </div>

            {/* Developmental Areas & Milestone Matrix */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={15} style={{ color: 'var(--primary)' }} />
                Milestone Progress Matrix ({studentProfile.session?.name})
              </h4>

              {studentProgressMatrix?.learningAreas?.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--c-muted)', fontStyle: 'italic' }}>
                  No curriculum goals configured for this program session yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                  {studentProgressMatrix?.learningAreas?.map((area: any) => (
                    <div key={area.id} style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--c-ink)' }}>
                        {area.name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {area.goals?.map((g: any) => {
                          const currentStage = g.studentProgress?.stage || 'NOT_STARTED'
                          return (
                            <div
                              key={g.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: 12,
                                background: '#f8fafc',
                                padding: '6px 8px',
                                borderRadius: 4,
                              }}
                            >
                              <span>{g.name}</span>
                              <select
                                className="select"
                                style={{ height: 26, fontSize: 11, padding: '2px 6px', minWidth: 110 }}
                                value={currentStage}
                                onChange={(e) => handleUpdateProgressStage(studentProfile.student.id, g.id, e.target.value)}
                              >
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="INTRODUCED">Introduced</option>
                                <option value="DEVELOPING">Developing</option>
                                <option value="ACHIEVED">Achieved</option>
                              </select>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observations History */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                Observations & Parent Timeline Milestones ({studentProfile.observations?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {studentProfile.observations?.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--c-muted)', fontStyle: 'italic' }}>
                    No observations recorded for this child yet.
                  </div>
                ) : (
                  studentProfile.observations?.map((o: any) => (
                    <div
                      key={o.id}
                      style={{
                        padding: 8,
                        background: '#f8fafc',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{o.category || 'General'}</span>
                        <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{timeAgo(o.observedAt)}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--c-ink)' }}>{o.narrative}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setStudentModalOpen(false)
                  setSelectedStudentId('')
                }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  window.print()
                }}
              >
                <Printer size={14} /> Print Report Card
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
