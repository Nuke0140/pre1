'use client'

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ChevronRight, Users, GraduationCap, ArrowRightLeft, UserX,
  Activity, Calendar, Building, BookOpen, UserRound, CheckSquare2,
  Search, RefreshCw, School, CheckCircle2, AlertCircle, X,
} from 'lucide-react'
import { PageHead, StatusBadge, Avatar, Segmented, Field, Skeleton } from '@/components/preone/ui'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Modal } from '@/components/preone/Modal'
import { DatePicker, MaskedInput, EnterNav, useFormDraft } from '@/components/preone/forms'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, enumLabel } from '@/lib/format'

interface StudentRow {
  id: string
  admissionNo: string
  seatNumber?: string | null
  photoUrl?: string | null
  name: string
  dob: string
  gender: string
  status: string
  classroom: { id: string; name: string; code: string; programType: string; teacher: string } | null
  programType: string | null
  branchName?: string | null
  academicSessionName?: string | null
  primaryGuardian: { name: string; phone: string; relationship: string } | null
}

interface Classroom {
  id: string
  name: string
  programType: string
  capacity?: number
  programId?: string
}

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  transferredStudents: number
  withdrawnStudents: number
  recentAdmissions30d: number
  averageAttendanceRate: number
}

interface ContextOption {
  id: string
  name: string
  isCurrent?: boolean
  isMain?: boolean
}

// Helper: Calculate child age in human-readable preschool format
function formatAge(dobString: string): string {
  if (!dobString) return ''
  const birth = new Date(dobString)
  if (isNaN(birth.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years <= 0) return `${months} mos`
  if (months === 0) return `${years} yrs`
  return `${years}y ${months}m`
}

export default function StudentsPage() {
  const router = useRouter()
  const toast = useToast()
  const [rows, setRows] = useState<StudentRow[] | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Filters & Context State
  const [q, setQ] = useState('')
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [sessionFilter, setSessionFilter] = useState('ALL')
  const [programFilter, setProgramFilter] = useState('ALL')
  const [classFilter, setClassFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')

  // Master Dropdown data
  const [branches, setBranches] = useState<ContextOption[]>([])
  const [sessions, setSessions] = useState<ContextOption[]>([])
  const [programs, setPrograms] = useState<ContextOption[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrollClassroomId, setEnrollClassroomId] = useState('')

  // Enroll form enhancements (date picker, mask, draft autosave)
  const formRef = useRef<HTMLFormElement>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const [dob, setDob] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const draft = useFormDraft('preone.create-student.v1')

  useEffect(() => {
    if (createOpen && formRef.current) {
      draft.apply(formRef.current)
      const v = new FormData(formRef.current).get('dob')
      if (typeof v === 'string' && v) setDob(v)
    }
  }, [createOpen])

  const onDraftChange = () => {
    if (!formRef.current) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      draft.save(formRef.current as HTMLFormElement)
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    }, 400)
  }

  // Bulk operations
  const [selected, setSelected] = useState<(string | number)[]>([])
  const [bulkClassOpen, setBulkClassOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [bulkNewClass, setBulkNewClass] = useState('')
  const [bulkNewStatus, setBulkNewStatus] = useState('ACTIVE')
  const [bulkReason, setBulkReason] = useState('')

  const openBulkClass = (targets?: (string | number)[]) => {
    if (targets && targets.length > 0) setSelected(targets)
    setBulkClassOpen(true)
  }

  const applyBulkClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!bulkNewClass || selected.length === 0) return
    setBulkAssigning(true)
    const reason = bulkReason || 'Bulk assignment'
    try {
      const results = await Promise.all(
        selected.map((id) =>
          fetch(`/api/v1/students/${id}/classroom`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationClassroomId: bulkNewClass, reason }),
          }).then((r) => r.json()),
        ),
      )
      const okCount = results.filter((r) => r.success).length
      if (okCount === selected.length) {
        toast.success('Class assigned', `${okCount} child${okCount === 1 ? '' : 'ren'} moved`)
      } else {
        toast.error('Partial update', `${okCount} of ${selected.length} children updated`)
      }
      setBulkClassOpen(false)
      setBulkNewClass('')
      setBulkReason('')
      setSelected([])
      load()
    } catch (err: any) {
      toast.error('Could not assign class', err.message)
    } finally {
      setBulkAssigning(false)
    }
  }

  const applyBulkStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selected.length === 0) return
    setBulkAssigning(true)
    try {
      const results = await Promise.all(
        selected.map((id) =>
          fetch(`/api/v1/students/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkNewStatus, reason: bulkReason || 'Bulk update' }),
          }).then((r) => r.json()),
        ),
      )
      const okCount = results.filter((r) => r.success).length
      if (okCount === selected.length) {
        toast.success('Status updated', `${okCount} child${okCount === 1 ? '' : 'ren'} updated`)
      } else {
        toast.error('Partial update', `${okCount} of ${selected.length} children updated`)
      }
      setBulkStatusOpen(false)
      setBulkNewStatus('ACTIVE')
      setBulkReason('')
      setSelected([])
      load()
    } catch (err: any) {
      toast.error('Could not update status', err.message)
    } finally {
      setBulkAssigning(false)
    }
  }

  // Load Setup Master Dropdowns
  useEffect(() => {
    async function loadMasters() {
      try {
        const [bRes, sRes, pRes, cRes] = await Promise.all([
          fetch('/api/v1/branches'),
          fetch('/api/v1/academic-years'),
          fetch('/api/v1/programs'),
          fetch('/api/v1/classrooms'),
        ])
        const [bJson, sJson, pJson, cJson] = await Promise.all([
          bRes.json(), sRes.json(), pRes.json(), cRes.json()
        ])
        if (bJson.success && Array.isArray(bJson.data)) setBranches(bJson.data)
        if (sJson.success && Array.isArray(sJson.data)) setSessions(sJson.data)
        if (pJson.success && Array.isArray(pJson.data)) setPrograms(pJson.data)
        if (cJson.success && Array.isArray(cJson.data)) setClassrooms(cJson.data)
      } catch (err) {
        console.error('Failed to load setup context masters:', err)
      }
    }
    loadMasters()
  }, [])

  // Load KPI Dashboard Stats
  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (branchFilter !== 'ALL') params.set('branchId', branchFilter)
      if (sessionFilter !== 'ALL') params.set('academicSessionId', sessionFilter)
      const res = await fetch(`/api/v1/students/dashboard?${params}`)
      const json = await res.json()
      if (json.success) setStats(json.data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [branchFilter, sessionFilter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (branchFilter !== 'ALL') params.set('branchId', branchFilter)
      if (sessionFilter !== 'ALL') params.set('academicSessionId', sessionFilter)
      if (programFilter !== 'ALL') params.set('programType', programFilter)
      if (classFilter !== 'ALL') params.set('classroomId', classFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const [sRes, cRes] = await Promise.all([
        fetch(`/api/v1/students?${params}`),
        fetch('/api/v1/classrooms'),
      ])
      const sJson = await sRes.json()
      const cJson = await cRes.json()
      if (sJson.success) setRows(sJson.data)
      if (cJson.success) setClassrooms(cJson.data)
    } catch (err: any) {
      console.error('Failed to load students:', err)
      toast.error('Failed to load students', err.message)
    } finally {
      setLoading(false)
    }
  }, [q, branchFilter, sessionFilter, programFilter, classFilter, statusFilter, toast])

  useEffect(() => {
    const t = setTimeout(() => {
      load()
      loadStats()
    }, 250)
    return () => clearTimeout(t)
  }, [load, loadStats])

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    try {
      const res = await fetch('/api/v1/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Child admitted', `${payload.firstName} joined with ID ${json.data.admissionNo}`)
        setCreateOpen(false)
        setDob('')
        setEnrollClassroomId('')
        draft.clear()
        load()
        loadStats()
      } else {
        toast.error('Could not add child', json.error?.message || 'Check form fields and retry')
      }
    } catch (err: any) {
      toast.error('Error saving child', err.message)
    } finally {
      setSaving(false)
    }
  }

  // Selected enroll classroom helper for capacity display
  const selectedEnrollClass = useMemo(() => {
    return classrooms.find((c) => c.id === enrollClassroomId)
  }, [classrooms, enrollClassroomId])

  // Selected destination classroom helper for bulk transfer
  const selectedBulkClass = useMemo(() => {
    return classrooms.find((c) => c.id === bulkNewClass)
  }, [classrooms, bulkNewClass])

  // Context current session label
  const currentSessionObj = useMemo(() => {
    return sessions.find((s) => s.id === sessionFilter || s.isCurrent)
  }, [sessions, sessionFilter])

  const columns: Column<StudentRow>[] = [
    {
      key: 'name',
      header: 'Child',
      sortable: true,
      sortValue: (s) => s.name.toLowerCase(),
      export: (s) => s.name,
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={s.name} src={s.photoUrl} size="md" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {s.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11.5,
                  padding: '1px 6px',
                  borderRadius: 5,
                  background: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {s.admissionNo}
              </span>
              {s.seatNumber && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  Seat: {s.seatNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'classroom',
      header: 'Class / Section',
      sortable: true,
      sortValue: (s) => s.classroom?.name || '',
      export: (s) => s.classroom ? `${s.classroom.name} (${s.classroom.code})` : 'Unassigned',
      render: (s) =>
        s.classroom ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="t-body-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {s.classroom.name}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                }}
              >
                {enumLabel(s.classroom.programType)}
              </span>
            </div>
            <span className="t-caption" style={{ color: 'var(--text-secondary)' }}>
              {s.classroom.teacher ? `Educator: ${s.classroom.teacher}` : 'No primary teacher'}
            </span>
          </div>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 500,
              background: 'var(--warning-soft)',
              color: 'var(--warning)',
              border: '1px solid var(--warning-soft)',
            }}
          >
            Unassigned
          </span>
        ),
    },
    {
      key: 'dob',
      header: 'Age & DOB',
      sortable: true,
      sortValue: (s) => new Date(s.dob).getTime(),
      export: (s) => `${fmtDate(s.dob)} (${formatAge(s.dob)})`,
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="t-body-sm" style={{ fontWeight: 550, color: 'var(--text-primary)' }}>
            {formatAge(s.dob)}
          </span>
          <span className="t-caption" style={{ color: 'var(--text-secondary)' }}>
            {fmtDate(s.dob)}
          </span>
        </div>
      ),
    },
    {
      key: 'primaryGuardian',
      header: 'Primary Guardian',
      export: (s) => (s.primaryGuardian ? `${s.primaryGuardian.name} (${s.primaryGuardian.relationship}) ${s.primaryGuardian.phone}` : 'None'),
      render: (s) =>
        s.primaryGuardian ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="t-body-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {s.primaryGuardian.name}
              </span>
              <span className="t-caption" style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                ({s.primaryGuardian.relationship.toLowerCase()})
              </span>
            </div>
            <span className="t-data" style={{ color: 'var(--text-secondary)' }}>
              {s.primaryGuardian.phone}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>-</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filter: {
        placeholder: 'Filter by status',
        get: (s) => s.status,
        options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'TRANSFERRED', label: 'Transferred' },
          { value: 'WITHDRAWN', label: 'Withdrawn' },
          { value: 'SUSPENDED', label: 'Suspended' },
          { value: 'GRADUATED', label: 'Graduated' },
        ],
      },
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: 44,
      hideable: false,
      render: () => (
        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <ChevronRight size={17} />
        </div>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Standard PageHead */}
      <PageHead
        eyebrow="Preschool Enrollment & Operations"
        badge={<span className="badge b-primary b-dot">Active Roster</span>}
        title="Students & Children"
        sub="Manage enrolled children, classroom allocations, guardians and the complete child journey."
        actions={
          <button
            className="btn btn-primary"
            style={{
              height: 44,
              padding: '0 18px',
              borderRadius: 11,
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(91, 61, 245, 0.25)',
            }}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={17} /> Enroll Child
          </button>
        }
      />

      {/* 2. Unified 6-Metric Student Health Strip */}
      <div
        className="metric-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {/* Metric 1: Total Enrolled */}
        <div
          className="metric-cell"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Enrolled
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats ? stats.totalStudents : 0}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Registered identities</div>
        </div>

        {/* Metric 2: Active Children */}
        <div
          className="metric-cell"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Active Children
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={15} style={{ color: 'var(--success)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--success)', lineHeight: 1.1 }}>
            {stats ? stats.activeStudents : 0}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Currently attending</div>
        </div>

        {/* Metric 3: New Admissions */}
        <div
          className="metric-cell"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              New Admissions
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={15} style={{ color: 'var(--info)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats ? stats.recentAdmissions30d : 0}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Last 30 days</div>
        </div>

        {/* Metric 4: Avg Attendance */}
        <div
          className="metric-cell"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Avg Attendance
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={15} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 }}>
              {stats?.averageAttendanceRate != null ? `${stats.averageAttendanceRate}%` : '—'}
            </span>
          </div>
          <div style={{ width: '100%', background: 'var(--bg-muted)', height: 4, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, stats?.averageAttendanceRate || 0))}%`,
                background: 'var(--primary)',
                height: '100%',
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Live calculation</div>
        </div>

        {/* Metric 5: Transferred */}
        <div
          className="metric-cell"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Transferred
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={15} style={{ color: 'var(--warning)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats ? stats.transferredStudents : 0}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Branch transfers</div>
        </div>

        {/* Metric 6: Withdrawn */}
        <div
          className="metric-cell"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Withdrawn
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={15} style={{ color: 'var(--danger)' }} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats ? stats.withdrawnStudents : 0}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Non-destructive exit</div>
        </div>
      </div>

      {/* 3. School Context Bar */}
      <div
        className="school-context-bar"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
          padding: '10px 16px',
          boxShadow: '0 1px 3px rgba(21, 37, 74, 0.03)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Session Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
          <Calendar size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600 }}>Session:</span>
          <select
            className="select"
            style={{ height: 34, fontSize: 13, padding: '0 28px 0 10px', borderRadius: 8, borderColor: 'var(--border-default)' }}
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
          >
            <option value="ALL">All Academic Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? '★ (Current)' : ''}
              </option>
            ))}
          </select>
          {currentSessionObj?.isCurrent && sessionFilter !== 'ALL' && (
            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--primary-light)', color: 'var(--primary)' }}>
              ★ Current
            </span>
          )}
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border-default)' }} />

        {/* Campus / Branch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
          <Building size={15} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 600 }}>Campus:</span>
          <select
            className="select"
            style={{ height: 34, fontSize: 13, padding: '0 28px 0 10px', borderRadius: 8, borderColor: 'var(--border-default)' }}
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.isMain ? '(Main Campus)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border-default)' }} />

        {/* Program */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
          <BookOpen size={15} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 600 }}>Program:</span>
          <select
            className="select"
            style={{ height: 34, fontSize: 13, padding: '0 28px 0 10px', borderRadius: 8, borderColor: 'var(--border-default)' }}
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="ALL">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.programType || p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border-default)' }} />

        {/* Lifecycle Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
          <span style={{ fontWeight: 600 }}>Status:</span>
          <select
            className="select"
            style={{ height: 34, fontSize: 13, padding: '0 28px 0 10px', borderRadius: 8, borderColor: 'var(--border-default)' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>

        {/* Spin Refresh button */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { load(); loadStats(); }}
            title="Refresh list"
            style={{ height: 34, width: 34, padding: 0, borderRadius: 8, color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4. Classroom Roster Quick-Switch Navigation */}
      <div style={{ marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Segmented
          options={[
            { key: 'ALL', label: 'All Classrooms' },
            ...classrooms.map((c) => ({
              key: c.id,
              label: `${c.name} (${enumLabel(c.programType)})`,
            })),
          ]}
          value={classFilter}
          onChange={setClassFilter}
        />
      </div>

      {/* 5. Prominent Search Bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search
          size={18}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          className="input"
          style={{
            height: 46,
            paddingLeft: 42,
            paddingRight: 40,
            borderRadius: 12,
            fontSize: 14,
            borderColor: 'var(--border-default)',
            background: 'var(--surface)',
            boxShadow: '0 1px 3px rgba(21, 37, 74, 0.03)',
          }}
          placeholder="Search child, admission ID or guardian phone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            onClick={() => setQ('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* 6. Contextual Bulk Action Floating / Docked Toolbar */}
      {selected.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-light)',
            borderRadius: 12,
            marginBottom: 16,
            color: 'var(--primary)',
            boxShadow: '0 2px 8px rgba(91, 61, 245, 0.12)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <CheckSquare2 size={16} />
            <span>{selected.length} child{selected.length === 1 ? '' : 'ren'} selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--primary-light)', color: 'var(--primary)', height: 32, fontSize: 12.5 }}
              onClick={() => openBulkClass()}
            >
              <ArrowRightLeft size={13} /> Assign Class
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--primary-light)', color: 'var(--primary)', height: 32, fontSize: 12.5 }}
              onClick={() => setBulkStatusOpen(true)}
            >
              <CheckSquare2 size={13} /> Change Status
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ height: 32, fontSize: 12.5, color: 'var(--text-secondary)' }}
              onClick={() => setSelected([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* 7. Student Directory Workspace */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(21, 37, 74, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Desktop Table View */}
        <div className="hidden-mobile">
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            onRowClick={(s) => router.push(`/app/students/${s.id}`)}
            emptyTitle="No children found"
            emptyMessage="No students match the selected campus, session, classroom, or search query."
            paginate
            defaultPageSize={10}
            exportFileName="students-roster.csv"
            rowSelection
            selectedKeys={selected}
            onSelectionChange={setSelected}
            rowActions={(s) => [
              {
                label: 'View 360° Profile',
                icon: <UserRound size={15} />,
                onClick: () => router.push(`/app/students/${s.id}`),
              },
              {
                label: 'Assign Classroom',
                icon: <ArrowRightLeft size={15} />,
                onClick: () => openBulkClass([s.id]),
              },
            ]}
            footer={
              rows ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <span>Total Shown: <b>{rows.length}</b></span>
                  <span>·</span>
                  <span>Active: <b style={{ color: 'var(--success)' }}>{rows.filter((r) => r.status === 'ACTIVE').length}</b></span>
                  <span>·</span>
                  <span>Transferred: <b>{rows.filter((r) => r.status === 'TRANSFERRED').length}</b></span>
                  <span>·</span>
                  <span>Withdrawn: <b>{rows.filter((r) => r.status === 'WITHDRAWN').length}</b></span>
                  <span>·</span>
                  <span>Unassigned: <b>{rows.filter((r) => !r.classroom).length}</b></span>
                </div>
              ) : null
            }
          />
        </div>

        {/* Mobile View: High-Fidelity Child Cards (<768px) */}
        <div className="visible-mobile" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton h={90} />
              <Skeleton h={90} />
              <Skeleton h={90} />
            </div>
          ) : rows && rows.length > 0 ? (
            rows.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/app/students/${s.id}`)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 1px 2px rgba(21, 37, 74, 0.03)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Avatar name={s.name} src={s.photoUrl} size="md" />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-muted)', padding: '1px 5px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                          {s.admissionNo}
                        </span>
                        {s.seatNumber && (
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                            {s.seatNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5, borderTop: '1px solid var(--bg-muted)', paddingTop: 10 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Classroom</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.classroom?.name || 'Unassigned'}</div>
                    {s.classroom && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{enumLabel(s.classroom.programType)}</div>}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Guardian</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.primaryGuardian?.name || '-'}</div>
                    {s.primaryGuardian?.phone && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{s.primaryGuardian.phone}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--bg-muted)', paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Born: {fmtDate(s.dob)} ({formatAge(s.dob)})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 12.5, fontWeight: 600 }}>
                    Profile <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <UserRound size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No children found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No students match the current filter criteria.</div>
            </div>
          )}
        </div>
      </div>

      {/* 8. Enroll Child Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Enroll Child"
        subtitle="Add a new child directly to the preschool student register"
        icon={<Plus size={22} />}
        wide
      >
        <form id="create-student" onSubmit={onCreate} onInput={onDraftChange} ref={formRef}>
          <EnterNav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section A: Child Demographic Information */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)', marginBottom: 12 }}>
                  1. Child Information
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>First Name <span className="req">*</span></label>
                    <input className="input" name="firstName" required placeholder="e.g. Aarav" />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Last Name</label>
                    <input className="input" name="lastName" placeholder="e.g. Sharma" />
                  </div>
                  <div className="field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      <span>Date of Birth <span className="req">*</span></span>
                      {dob && <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>Age: {formatAge(dob)}</span>}
                    </label>
                    <DatePicker name="dob" value={dob} onChange={setDob} placeholder="Select date of birth" />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Gender <span className="req">*</span></label>
                    <select className="select" name="gender" required defaultValue="MALE">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section B: Classroom & Program Placement */}
              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)', marginBottom: 12 }}>
                  2. Classroom Placement & Capacity
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Classroom / Section</label>
                    <select
                      className="select"
                      name="classroomId"
                      value={enrollClassroomId}
                      onChange={(e) => setEnrollClassroomId(e.target.value)}
                    >
                      <option value="">- Unassigned -</option>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({enumLabel(c.programType)}) {c.capacity ? `· Cap: ${c.capacity}` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedEnrollClass && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-default)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <School size={15} style={{ color: 'var(--primary)' }} />
                          <span><b>{selectedEnrollClass.name}</b> ({enumLabel(selectedEnrollClass.programType)})</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Capacity: <b>{selectedEnrollClass.capacity || 20} seats</b>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section C: Family & Guardian Information */}
              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)', marginBottom: 12 }}>
                  3. Parent / Guardian Details
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Guardian Name <span className="req">*</span></label>
                    <input className="input" name="guardianName" required placeholder="e.g. Priya Sharma" />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Relationship <span className="req">*</span></label>
                    <select className="select" name="guardianRelationship" defaultValue="MOTHER">
                      <option value="MOTHER">Mother</option>
                      <option value="FATHER">Father</option>
                      <option value="GRANDPARENT">Grandparent</option>
                      <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                    </select>
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Guardian Phone <span className="req">*</span></label>
                    <MaskedInput name="guardianPhone" mask="phone" required />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Guardian Email</label>
                    <input className="input" name="guardianEmail" type="email" placeholder="priya@example.com" />
                  </div>
                </div>
              </div>

              {/* Section D: Health & Home Address */}
              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary)', marginBottom: 12 }}>
                  4. Health & Home Address
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div className="field">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Blood Group</label>
                    <select className="select" name="bloodGroup" defaultValue="">
                      <option value="">- Unknown / Not recorded -</option>
                      {['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'].map((b) => (
                        <option key={b} value={b}>{b.replace('_POSITIVE','+').replace('_NEGATIVE','-')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Residential Address</label>
                    <input className="input" name="address" placeholder="Flat 402, Green Valley Apartments, Pune" />
                  </div>
                </div>
              </div>
            </div>
          </EnterNav>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
            <span style={{ fontSize: 12, color: draftSaved ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {draftSaved ? <><CheckCircle2 size={13} /> Draft autosaved</> : 'Autosaves as you type'}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${saving ? 'is-loading' : ''}`}
                disabled={saving}
                style={{ height: 42, padding: '0 20px', borderRadius: 9, fontWeight: 600 }}
              >
                {saving ? 'Admitting...' : 'Complete Enrollment'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 9. Bulk Assign Classroom Modal */}
      <Modal
        open={bulkClassOpen}
        onClose={() => setBulkClassOpen(false)}
        title="Assign Classroom Section"
        subtitle={`Move ${selected.length} child${selected.length === 1 ? '' : 'ren'} to a new section`}
        icon={<ArrowRightLeft size={22} />}
      >
        <form onSubmit={applyBulkClass}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: 14 }}>
            <Field label="Destination class / section" required helper="Classroom capacity is strictly enforced on the server.">
              <select
                className="select"
                value={bulkNewClass}
                onChange={(e) => setBulkNewClass(e.target.value)}
                required
              >
                <option value="">- Select classroom -</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({enumLabel(c.programType)}) {c.capacity ? `· Capacity: ${c.capacity}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            {selectedBulkClass && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  color: 'var(--primary)',
                }}
              >
                <span>Moving to <b>{selectedBulkClass.name}</b></span>
                <span>Capacity: <b>{selectedBulkClass.capacity || 20} seats</b></span>
              </div>
            )}

            <Field label="Reason (for audit trail)">
              <input
                className="input"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="e.g. Sibling placement, cohort regrouping, teacher request"
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBulkClassOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${bulkAssigning ? 'is-loading' : ''}`}
              disabled={bulkAssigning || !bulkNewClass || selected.length === 0}
            >
              {bulkAssigning ? 'Moving...' : `Assign ${selected.length} child${selected.length === 1 ? '' : 'ren'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* 10. Bulk Change Status Modal */}
      <Modal
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        title="Update Student Lifecycle Status"
        subtitle={`Update ${selected.length} child${selected.length === 1 ? '' : 'ren'} status`}
        icon={<CheckSquare2 size={22} />}
      >
        <form onSubmit={applyBulkStatus}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: 14 }}>
            <Field label="New lifecycle status" required>
              <select
                className="select"
                value={bulkNewStatus}
                onChange={(e) => setBulkNewStatus(e.target.value)}
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="GRADUATED">Graduated</option>
              </select>
            </Field>
            <Field label="Reason for change" required helper="Required for administrative compliance and immutable audit trail.">
              <input
                className="input"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                required
                placeholder="Why is this status being applied?"
              />
            </Field>
          </div>

          {bulkNewStatus === 'WITHDRAWN' && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger-soft)',
                color: 'var(--danger)',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>Withdrawal is non-destructive. Students with pending fees may require settlement before withdrawal.</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBulkStatusOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${bulkAssigning ? 'is-loading' : ''}`}
              disabled={bulkAssigning || selected.length === 0}
            >
              {bulkAssigning ? 'Updating...' : `Update ${selected.length} child${selected.length === 1 ? '' : 'ren'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
