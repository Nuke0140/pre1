'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ChevronRight, Users, GraduationCap, ArrowRightLeft, UserX,
  Activity, Calendar, Building, BookOpen, UserRound, CheckSquare2,
} from 'lucide-react'
import { PageHead, StatusBadge, Avatar, Segmented, Field } from '@/components/preone/ui'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Modal } from '@/components/preone/Modal'
import { DatePicker, MaskedInput, EnterNav, useFormDraft } from '@/components/preone/forms'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, enumLabel } from '@/lib/format'

interface StudentRow {
  id: string
  admissionNo: string
  seatNumber?: string | null
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

  // Enroll form enhancements (date picker, mask, draft autosave)
  const formRef = useRef<HTMLFormElement>(null)
  const saveTimer = useRef<number | undefined>(undefined)
  const [dob, setDob] = useState('')
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
    saveTimer.current = window.setTimeout(() => draft.save(formRef.current as HTMLFormElement), 400)
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
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (branchFilter !== 'ALL') params.set('branchId', branchFilter)
    if (sessionFilter !== 'ALL') params.set('academicSessionId', sessionFilter)
    if (programFilter !== 'ALL') params.set('programId', programFilter)
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
  }, [q, branchFilter, sessionFilter, programFilter, classFilter, statusFilter])

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
    const res = await fetch('/api/v1/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      toast.success('Child admitted', `${payload.firstName} joined with ID ${json.data.admissionNo}`)
      setCreateOpen(false)
      setDob('')
      draft.clear()
      load()
    } else {
      toast.error('Could not add child', json.error?.message)
    }
  }

  const columns: Column<StudentRow>[] = [
    {
      key: 'name',
      header: 'Child',
      sortable: true,
      sortValue: (s) => s.name.toLowerCase(),
      export: (s) => s.name,
      render: (s) => (
        <span className="cell-user">
          <Avatar name={s.name} />
          <span>
            <span className="cell-strong">{s.name}</span>
            {s.seatNumber && <span className="cell-sub">Seat: {s.seatNumber}</span>}
          </span>
        </span>
      ),
    },
    {
      key: 'admissionNo',
      header: 'Admission No',
      sortable: true,
      export: (s) => s.admissionNo,
      render: (s) => (
        <span className="dt-id-chip">{s.admissionNo}</span>
      ),
    },
    {
      key: 'classroom',
      header: 'Class / Section',
      sortable: true,
      sortValue: (s) => s.classroom?.name || '',
      export: (s) => s.classroom ? `${s.classroom.name} (${s.classroom.code})` : '',
      render: (s) =>
        s.classroom ? (
          <>
            <span className="cell-strong">{s.classroom.name}</span>
            <span className="cell-sub">
              {s.classroom.code} · {enumLabel(s.classroom.programType)} · {s.classroom.teacher}
            </span>
          </>
        ) : (
          <span className="badge b-warning">Unassigned</span>
        ),
    },
    {
      key: 'dob',
      header: 'Date of Birth',
      sortable: true,
      sortValue: (s) => new Date(s.dob).getTime(),
      export: (s) => s.dob,
      render: (s) => fmtDate(s.dob),
    },
    {
      key: 'primaryGuardian',
      header: 'Parent / Guardian',
      export: (s) => (s.primaryGuardian ? `${s.primaryGuardian.name} ${s.primaryGuardian.phone}` : ''),
      render: (s) =>
        s.primaryGuardian ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.primaryGuardian.name}</span>
            <span className="cell-sub">{s.primaryGuardian.phone}</span>
          </>
        ) : (
          '-'
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
      width: 36,
      hideable: false,
      render: () => <ChevronRight size={15} style={{ color: 'var(--foreground-muted)' }} />,
    },
  ]

  return (
    <>
      <PageHead
        eyebrow="Preschool Enrollment & Academics"
        badge={<span className="badge b-primary b-dot">Active Roster</span>}
        title="Students & Children"
        sub="Canonical enrolled-child directory connecting Admissions, Academics, Operations, Attendance, and Finance."
        actions={
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Enroll Child
          </button>
        }
      />

      {/* Unified Metric Strip */}
      <div className="metric-strip" style={{ marginBottom: 20 }}>
        <div className="metric-cell">
          <div className="m-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} style={{ color: 'var(--primary, #6A35FF)' }} /> Total Enrolled
          </div>
          <div className="m-val">{stats ? stats.totalStudents : '-'}</div>
          <div className="m-meta">Registered identities</div>
        </div>

        <div className="metric-cell">
          <div className="m-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GraduationCap size={14} style={{ color: 'var(--success, #10B981)' }} /> Active Children
          </div>
          <div className="m-val" style={{ color: 'var(--success, #10B981)' }}>{stats ? stats.activeStudents : '-'}</div>
          <div className="m-meta">Currently attending</div>
        </div>

        <div className="metric-cell">
          <div className="m-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={14} style={{ color: '#3B82F6' }} /> New Admissions
          </div>
          <div className="m-val">{stats ? stats.recentAdmissions30d : '-'}</div>
          <div className="m-meta">Last 30 days</div>
        </div>

        <div className="metric-cell">
          <div className="m-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} style={{ color: '#8B5CF6' }} /> Avg Attendance
          </div>
          <div className="m-val" style={{ color: '#8B5CF6' }}>{stats ? stats.averageAttendanceRate + '%' : '-'}</div>
          <div className="m-meta">Live calculation</div>
        </div>

        <div className="metric-cell">
          <div className="m-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowRightLeft size={14} style={{ color: '#F59E0B' }} /> Transferred
          </div>
          <div className="m-val">{stats ? stats.transferredStudents : '-'}</div>
          <div className="m-meta">Branch transfers</div>
        </div>

        <div className="metric-cell">
          <div className="m-lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserX size={14} style={{ color: '#EF4444' }} /> Withdrawn
          </div>
          <div className="m-val">{stats ? stats.withdrawnStudents : '-'}</div>
          <div className="m-meta">Non-destructive exit</div>
        </div>
      </div>

      {/* Student Register Table Workspace */}
      <div className="table-workspace">
        <div className="school-context-bar" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-muted)' }}>
        {branches.length > 0 && (
          <>
            <div className="context-item">
              <label><Building size={14} style={{ color: 'var(--text-muted)' }} /> Branch:</label>
              <select
                className="select"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <span className="context-divider" />
          </>
        )}

        {sessions.length > 0 && (
          <>
            <div className="context-item">
              <label><Calendar size={14} style={{ color: 'var(--text-muted)' }} /> Session:</label>
              <select
                className="select"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
              >
                <option value="ALL">All Academic Sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <span className="context-divider" />
          </>
        )}

        {programs.length > 0 && (
          <>
            <div className="context-item">
              <label><BookOpen size={14} style={{ color: 'var(--text-muted)' }} /> Program:</label>
              <select
                className="select"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                <option value="ALL">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <span className="context-divider" />
          </>
        )}

        <div className="context-item">
          <label>Status:</label>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={rows === null}
        searchPlaceholder="Search child name, admission no, or guardian phone..."
        searchValue={q}
        onSearch={setQ}
        onRowClick={(s) => router.push(`/app/students/${s.id}`)}
        emptyTitle="No children found"
        emptyMessage="No students match the current filter or search criteria."
        filters={
          <Segmented
            options={[
              { key: 'ALL', label: 'All Classes' },
              ...classrooms.map((c) => ({ key: c.id, label: c.name })),
            ]}
            value={classFilter}
            onChange={setClassFilter}
          />
        }
        paginate
        defaultPageSize={10}
        exportFileName="students.csv"
        rowSelection
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => openBulkClass()} disabled={selected.length === 0}>
              <ArrowRightLeft size={14} /> Assign class
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setBulkStatusOpen(true)} disabled={selected.length === 0}>
              <CheckSquare2 size={14} /> Change status
            </button>
          </>
        }
        rowActions={(s) => [
          {
            label: 'View profile',
            icon: <UserRound size={15} />,
            onClick: () => router.push(`/app/students/${s.id}`),
          },
          {
            label: 'Assign classroom',
            icon: <ArrowRightLeft size={15} />,
            onClick: () => openBulkClass([s.id]),
          },
        ]}
        footer={
          rows ? (
            <span>
              Active <b>{rows.filter((r) => r.status === 'ACTIVE').length}</b>
              <span className="t-caption" style={{ margin: '0 8px' }}>·</span>
              Transferred <b>{rows.filter((r) => r.status === 'TRANSFERRED').length}</b>
              <span className="t-caption" style={{ margin: '0 8px' }}>·</span>
              Withdrawn <b>{rows.filter((r) => r.status === 'WITHDRAWN').length}</b>
              <span className="t-caption" style={{ margin: '0 8px' }}>·</span>
              Unassigned <b>{rows.filter((r) => !r.classroom).length}</b>
            </span>
          ) : null
        }
      />
      </div>


      {/* Enroll Child Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Enroll Child"
        subtitle="Add a new child directly to the student register"
        icon={<Plus size={22} />}
        wide
      >
        <form id="create-student" onSubmit={onCreate} onInput={onDraftChange} ref={formRef}>
          <EnterNav>
          <div className="form-grid">
            <div className="field">
              <label>First Name <span className="req">*</span></label>
              <input className="input" name="firstName" required placeholder="Aarav" />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input className="input" name="lastName" placeholder="Sharma" />
            </div>
            <div className="field">
              <label>Date of Birth <span className="req">*</span></label>
              <DatePicker name="dob" value={dob} onChange={setDob} placeholder="Date of birth" />
            </div>
            <div className="field">
              <label>Gender <span className="req">*</span></label>
              <select className="select" name="gender" required defaultValue="MALE">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="field">
              <label>Class / Section</label>
              <select className="select" name="classroomId" defaultValue="">
                <option value="">- Unassigned -</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({enumLabel(c.programType)}){c.capacity ? ` - Cap: ${c.capacity}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Blood Group</label>
              <select className="select" name="bloodGroup" defaultValue="">
                <option value="">-</option>
                {['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'].map((b) => (
                  <option key={b} value={b}>{b.replace('_POSITIVE','+').replace('_NEGATIVE','-')}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Parent / Guardian Name <span className="req">*</span></label>
              <input className="input" name="guardianName" required placeholder="Priya Sharma" />
            </div>
            <div className="field">
              <label>Guardian Phone <span className="req">*</span></label>
              <MaskedInput name="guardianPhone" mask="phone" required />
            </div>
            <div className="field">
              <label>Guardian Email</label>
              <input className="input" name="guardianEmail" type="email" placeholder="priya@example.com" />
            </div>
            <div className="field">
              <label>Relationship</label>
              <select className="select" name="guardianRelationship" defaultValue="MOTHER">
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
                <option value="GRANDPARENT">Grandparent</option>
                <option value="LEGAL_GUARDIAN">Legal Guardian</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Home Address</label>
              <input className="input" name="address" placeholder="Flat 402, Green Valley Apartments, Pune" />
            </div>
          </div>
          </EnterNav>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${saving ? 'is-loading' : ''}`} disabled={saving}>
              {saving ? 'Saving...' : 'Enroll Child'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Assign Classroom Modal */}
      <Modal
        open={bulkClassOpen}
        onClose={() => setBulkClassOpen(false)}
        title="Assign classroom"
        subtitle={`Move ${selected.length} child${selected.length === 1 ? '' : 'ren'} to a new section`}
        icon={<ArrowRightLeft size={22} />}
      >
        <form onSubmit={applyBulkClass}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <Field label="Destination class / section" required helper="Capacity is enforced per classroom on the server.">
              <select className="select" value={bulkNewClass} onChange={(e) => setBulkNewClass(e.target.value)} required>
                <option value="">- Select classroom -</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({enumLabel(c.programType)}){c.capacity ? ` - Cap: ${c.capacity}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reason (optional)">
              <input className="input" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} placeholder="Section regrouping, sibling placement..." />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBulkClassOpen(false)}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${bulkAssigning ? 'is-loading' : ''}`} disabled={bulkAssigning || !bulkNewClass || selected.length === 0}>
              {bulkAssigning ? 'Assigning...' : `Assign ${selected.length} child${selected.length === 1 ? '' : 'ren'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Change Status Modal */}
      <Modal
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        title="Change status"
        subtitle={`Update ${selected.length} child${selected.length === 1 ? '' : 'ren'} lifecycle status`}
        icon={<CheckSquare2 size={22} />}
      >
        <form onSubmit={applyBulkStatus}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <Field label="New status" required>
              <select className="select" value={bulkNewStatus} onChange={(e) => setBulkNewStatus(e.target.value)} required>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </Field>
            <Field label="Reason" required helper="Required for audit trail">
              <input className="input" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} required placeholder="Why is this status being applied?" />
            </Field>
          </div>
          {bulkNewStatus === 'WITHDRAWN' && (
            <div className="msg" style={{ marginTop: 12 }}>
              Withdrawal is non-destructive and may be blocked for students with pending fees unless forced.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBulkStatusOpen(false)}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${bulkAssigning ? 'is-loading' : ''}`} disabled={bulkAssigning || selected.length === 0}>
              {bulkAssigning ? 'Updating...' : `Update ${selected.length} child${selected.length === 1 ? '' : 'ren'}`}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
