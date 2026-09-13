'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronRight, User } from 'lucide-react'
import { PageHead, StatusBadge, Avatar, Segmented, Field } from '@/components/preone/ui'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Modal } from '@/components/preone/Modal'
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
  classroom: string | null
  programType: string | null
  primaryGuardian: { name: string; phone: string; relationship: string } | null
}

interface Classroom {
  id: string
  name: string
  programType: string
}

export default function StudentsPage() {
  const router = useRouter()
  const toast = useToast()
  const [rows, setRows] = useState<StudentRow[] | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [q, setQ] = useState('')
  const [classFilter, setClassFilter] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (classFilter !== 'ALL') params.set('classroomId', classFilter)
    const [sRes, cRes] = await Promise.all([
      fetch(`/api/v1/students?${params}`),
      fetch('/api/v1/classrooms'),
    ])
    const sJson = await sRes.json()
    const cJson = await cRes.json()
    if (sJson.success) setRows(sJson.data)
    if (cJson.success) setClassrooms(cJson.data)
  }, [q, classFilter])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

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
      load()
    } else {
      toast.error('Could not add child', json.error?.message)
    }
  }

  const columns: Column<StudentRow>[] = [
    {
      key: 'name',
      header: 'Child',
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
      render: (s) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.admissionNo}</span>
      ),
    },
    {
      key: 'classroom',
      header: 'Class / Section',
      render: (s) =>
        s.classroom ? (
          <>
            <span className="cell-strong">{s.classroom}</span>
            <span className="cell-sub">{enumLabel(s.programType || '')}</span>
          </>
        ) : (
          <span className="badge b-warning">Unassigned</span>
        ),
    },
    {
      key: 'dob',
      header: 'Date of Birth',
      render: (s) => fmtDate(s.dob),
    },
    {
      key: 'primaryGuardian',
      header: 'Parent / Guardian',
      render: (s) =>
        s.primaryGuardian ? (
          <>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.primaryGuardian.name}</span>
            <span className="cell-sub">{s.primaryGuardian.phone}</span>
          </>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: 36,
      render: () => <ChevronRight size={15} style={{ color: 'var(--foreground-muted)' }} />,
    },
  ]

  return (
    <>
      <PageHead
        title="Children & Students"
        sub="Complete directory of enrolled preschool children, guardians, and class sections."
        actions={
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Enroll Child
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={rows === null}
        searchPlaceholder="Search child name or admission no…"
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
      />

      {/* Enroll Child Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Enroll Child"
        subtitle="Add a new child directly to the student register"
        icon={<Plus size={22} />}
        wide
      >
        <form id="create-student" onSubmit={onCreate}>
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
              <input className="input" name="dob" type="date" required />
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
                <option value="">— Unassigned —</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({enumLabel(c.programType)})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Blood Group</label>
              <select className="select" name="bloodGroup" defaultValue="">
                <option value="">—</option>
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
              <input className="input" name="guardianPhone" required placeholder="+91 98765 43210" />
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${saving ? 'is-loading' : ''}`} disabled={saving}>
              {saving ? 'Saving…' : 'Enroll Child'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
