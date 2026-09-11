'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Users, ChevronRight, Loader2 } from 'lucide-react'
import { PageHead, EmptyState, StatusBadge, Avatar, Segmented, Skeleton } from '@/components/preone/ui'
import { Modal, ConfirmModal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, enumLabel } from '@/lib/format'

interface StudentRow {
  id: string
  admissionNo: string
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
      toast.success('Student added', `${payload.firstName} joined with ID ${json.data.admissionNo}`)
      setCreateOpen(false)
      load()
    } else {
      toast.error('Could not add student', json.error?.message)
    }
  }

  return (
    <>
      <PageHead
        title="Students"
        sub="Aapke school ke saare bacche — search, filter aur profiles."
        actions={
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add Student
          </button>
        }
      />

      <div className="dtable-wrap">
        <div className="table-toolbar">
          <div className="input-search" style={{ maxWidth: 280 }}>
            <Search />
            <input
              className="input"
              placeholder="Search name or admission no…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Segmented
            options={[
              { key: 'ALL', label: 'All Classes' },
              ...classrooms.map((c) => ({ key: c.id, label: c.name })),
            ]}
            value={classFilter}
            onChange={setClassFilter}
          />
        </div>
        <div className="dtable-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Classroom</th>
                <th>DOB</th>
                <th>Parent</th>
                <th>Status</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {rows?.map((s) => (
                <tr key={s.id} onClick={() => (window.location.href = `/app/students/${s.id}`)}>
                  <td>
                    <span className="cell-user">
                      <Avatar name={s.name} />
                      <span className="cell-strong">{s.name}</span>
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.admissionNo}</td>
                  <td>
                    {s.classroom ? (
                      <>
                        <span className="cell-strong">{s.classroom}</span>
                        <span className="cell-sub">{enumLabel(s.programType || '')}</span>
                      </>
                    ) : (
                      <span className="badge b-warning">Unassigned</span>
                    )}
                  </td>
                  <td>{fmtDate(s.dob)}</td>
                  <td>
                    {s.primaryGuardian ? (
                      <>
                        <span style={{ fontSize: 13 }}>{s.primaryGuardian.name}</span>
                        <span className="cell-sub">{s.primaryGuardian.phone}</span>
                      </>
                    ) : '—'}
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td><ChevronRight size={15} style={{ color: 'var(--foreground-muted)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows === null && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} h={36} />)}
            </div>
          )}
          {rows?.length === 0 && (
            <EmptyState
              icon={<Users size={40} />}
              title="No students found"
              message="Try a different search, or add your first student to get started."
              action={
                <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={15} /> Add Student
                </button>
              }
            />
          )}
        </div>
        {rows && rows.length > 0 && (
          <div className="table-foot">
            <span>{rows.length} students</span>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Student"
        subtitle="Direct admission — student record + guardian created together"
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
              <label>Classroom</label>
              <select className="select" name="classroomId" defaultValue="">
                <option value="">— Unassigned —</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
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
              <label>Parent/Guardian Name <span className="req">*</span></label>
              <input className="input" name="guardianName" required placeholder="Priya Sharma" />
            </div>
            <div className="field">
              <label>Guardian Phone <span className="req">*</span></label>
              <input className="input" name="guardianPhone" required placeholder="+9198XXXXXXXX" />
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
              {saving ? 'Saving…' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
