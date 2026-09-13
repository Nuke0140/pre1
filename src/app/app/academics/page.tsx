'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Sparkles, Plus, Send, GraduationCap, School, BookOpen,
  CalendarCheck, UserCheck, ArrowRight, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { PageHead, StatusBadge, Skeleton, Avatar, Segmented, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { enumLabel, timeAgo } from '@/lib/format'

interface Classroom {
  id: string
  name: string
  code: string
  programType: string
  capacity: number
  primaryTeacher?: { id: string; fullName: string } | null
  studentCount?: number
  students?: number
}

interface Program {
  id: string
  name: string
  code: string
  programType: string
  ageMinMonths: number | null
  ageMaxMonths: number | null
  capacity: number
  isActive: boolean
}

interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  isCurrent: boolean
}

interface Observation {
  id: string
  studentName: string
  studentId: string
  classroom: string | null
  narrative: string
  milestoneTags: string | null
  category?: string | null
  concern?: string
  status: string
  observedAt: string
}

export default function AcademicsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('classes')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // Data states
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [observations, setObservations] = useState<Observation[]>([])
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([])
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([])

  // Modal states
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null)
  const [obsModalOpen, setObsModalOpen] = useState(false)
  const [promoteModalOpen, setPromoteModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, pRes, sRes, oRes, uRes, stuRes] = await Promise.all([
        fetch('/api/v1/classrooms').then((r) => r.json()),
        fetch('/api/v1/programs').then((r) => r.json()),
        fetch('/api/v1/academic-years').then((r) => r.json()),
        fetch('/api/v1/observations').then((r) => r.json()),
        fetch('/api/v1/users?role=TEACHER').then((r) => r.json()),
        fetch('/api/v1/students?pageSize=100').then((r) => r.json()),
      ])

      if (cRes.success) setClassrooms(cRes.data || [])
      if (pRes.success) setPrograms(pRes.data || [])
      if (sRes.success) setSessions(sRes.data || [])
      if (oRes.success) setObservations(oRes.data || [])
      if (uRes.success) setTeachers(uRes.data || [])
      if (stuRes.success) setStudents(stuRes.data || [])
    } catch (err: any) {
      toast.error('Error loading academics data', err.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          capacity: parseInt(String(fd.get('capacity')) || '20'),
          primaryTeacherId: fd.get('teacherId') || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Classroom section created')
        setClassModalOpen(false)
        loadData()
      } else {
        toast.error('Failed to create classroom', json.error?.message || json.error)
      }
    } catch (err: any) {
      toast.error('Failed to create classroom', err.message)
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
        loadData()
      } else {
        toast.error('Failed to assign teacher', json.error)
      }
    } catch (err: any) {
      toast.error('Failed to assign teacher', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateObservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/v1/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: fd.get('studentId'),
          narrative: fd.get('narrative'),
          milestoneTags: fd.get('milestoneTags') || undefined,
          category: fd.get('category') || undefined,
          concern: fd.get('concern') || 'NORMAL',
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Observation draft saved')
        setObsModalOpen(false)
        loadData()
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
        toast.success('Observation published to parent timeline')
        loadData()
      } else {
        toast.error('Failed to publish', json.error)
      }
    } catch (err: any) {
      toast.error('Failed to publish', err.message)
    }
  }

  return (
    <div className="page-shell">
      <PageHead
        title="Academics"
        sub="Classrooms, programs, curriculum, learning observations, and year-end promotion"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {activeTab === 'classes' && (
              <button className="btn btn-primary" onClick={() => setClassModalOpen(true)}>
                <Plus size={15} /> Add Section
              </button>
            )}
            {activeTab === 'observations' && (
              <button className="btn btn-primary" onClick={() => setObsModalOpen(true)}>
                <Plus size={15} /> New Observation
              </button>
            )}
          </div>
        }
      />

      {/* -- Tabs Navigation -- */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { key: 'classes', label: `Classes & Sections (${classrooms.length})` },
            { key: 'programs', label: `Programs (${programs.length})` },
            { key: 'years', label: `Academic Sessions (${sessions.length})` },
            { key: 'observations', label: `Observations (${observations.length})` },
          ]}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton h={40} />
          <Skeleton h={40} />
          <Skeleton h={40} />
        </div>
      ) : (
        <>
          {/* -- TAB 1: CLASSES & SECTIONS -- */}
          {activeTab === 'classes' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Section / Classroom</th>
                    <th>Program</th>
                    <th>Capacity & Enrolment</th>
                    <th>Primary Teacher</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classrooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--c-muted)' }}>
                        No classrooms found. Click "Add Section" to create one.
                      </td>
                    </tr>
                  ) : (
                    classrooms.map((c) => {
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
                                    width: `${Math.min(100, Math.round((count / c.capacity) * 100))}%`,
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

          {/* -- TAB 2: PROGRAMS OFFERED -- */}
          {activeTab === 'programs' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Type</th>
                    <th>Age Suitability</th>
                    <th>Target Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <span className="badge b-info">{enumLabel(p.programType)}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {p.ageMinMonths && p.ageMaxMonths
                          ? `${Math.floor(p.ageMinMonths / 12)}y - ${Math.floor(p.ageMaxMonths / 12)}y (${p.ageMinMonths}-${p.ageMaxMonths} mos)`
                          : 'General'}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{p.capacity} seats</td>
                      <td>
                        <span className={`badge ${p.isActive ? 'b-success' : 'b-neutral'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* -- TAB 3: ACADEMIC SESSIONS & PROMOTION -- */}
          {activeTab === 'years' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Academic Session</th>
                    <th>Date Range</th>
                    <th>Status</th>
                    <th>Current Active</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</td>
                      <td style={{ fontSize: 13, color: 'var(--c-muted)' }}>
                        {new Date(s.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} —{' '}
                        {new Date(s.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        {s.isCurrent ? (
                          <span className="badge b-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={12} /> Current Academic Year
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Previous / Planned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* -- TAB 4: LEARNING & OBSERVATIONS -- */}
          {activeTab === 'observations' && (
            <div style={{ display: 'grid', gap: 12 }}>
              {observations.length === 0 ? (
                <div className="card" style={{ padding: 36, textAlign: 'center' }}>
                  <Sparkles size={36} style={{ color: 'var(--c-muted)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600 }}>No learning observations drafted yet</div>
                  <p style={{ color: 'var(--c-muted)', fontSize: 13, marginTop: 4 }}>
                    Record classroom moments and milestones, then publish them to the parent timeline.
                  </p>
                </div>
              ) : (
                observations.map((obs) => (
                  <div key={obs.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{obs.studentName}</span>
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
                      <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 8 }}>
                        Observed {timeAgo(obs.observedAt)}
                        {obs.milestoneTags && ` • Milestones: ${obs.milestoneTags}`}
                      </div>
                    </div>
                    {obs.status === 'DRAFT' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublishObservation(obs.id)}
                      >
                        <Send size={13} /> Publish
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* -- Modal: Add Classroom Section -- */}
      <Modal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title="Add Classroom Section"
        subtitle="Create a new class section for the current academic session"
      >
        <form onSubmit={handleCreateClass}>
          <Field label="Section Name" required helper="e.g. Playgroup Sunflowers or Nursery Blue">
            <input className="input" name="name" placeholder="e.g. Nursery Blossoms" required />
          </Field>

          <Field label="Program" required>
            <select className="select" name="programType" required>
              <option value="PLAYGROUP">Playgroup</option>
              <option value="NURSERY">Nursery</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="DAYCARE">Daycare</option>
            </select>
          </Field>

          <Field label="Max Student Capacity" required helper="Prevents overbooking during admissions">
            <input className="input" name="capacity" type="number" defaultValue="20" min="5" max="50" required />
          </Field>

          <Field label="Primary Teacher" helper="Staff assigned to this classroom section">
            <select className="select" name="teacherId">
              <option value="">-- Assign Later --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setClassModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* -- Modal: Assign Primary Teacher -- */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Teacher — ${selectedClass?.name || ''}`}
        subtitle="Change or set the primary educator for this classroom section"
      >
        {selectedClass && (
          <form onSubmit={handleAssignTeacher}>
            <Field label="Select Teacher" required>
              <select className="select" name="teacherId" defaultValue={selectedClass.primaryTeacher?.id || ''}>
                <option value="">-- None (Unassigned) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save Assignment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* -- Modal: New Observation -- */}
      <Modal
        open={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        title="Record Learning Observation"
        subtitle="Log developmental milestone progress or learning observations"
      >
        <form onSubmit={handleCreateObservation}>
          <Field label="Child" required>
            <select className="select" name="studentId" required>
              <option value="">-- Select Child --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Curriculum Learning Area" helper="Mapped from school curriculum settings">
            <select className="select" name="category">
              <option value="Language & Literacy">Language & Literacy</option>
              <option value="Cognitive Development">Cognitive Development</option>
              <option value="Gross & Fine Motor Skills">Gross & Fine Motor Skills</option>
              <option value="Social & Emotional">Social & Emotional</option>
              <option value="Creative Arts">Creative Arts</option>
            </select>
          </Field>

          <Field label="Concern / Triage" helper="Flags urgent items for follow-up">
            <select className="select" name="concern" defaultValue="NORMAL">
              <option value="NORMAL">Normal Milestone / General</option>
              <option value="PROGRESS">Positive Progress</option>
              <option value="NEEDS_ATTENTION">Needs Attention (Raises follow-up)</option>
              <option value="URGENT">Urgent Concern</option>
            </select>
          </Field>

          <Field label="Observation Narrative" required>
            <textarea className="input" name="narrative" rows={3} placeholder="Describe the child's activity and milestone achievement…" required />
          </Field>

          <Field label="Milestone Tags" helper="Comma-separated milestones">
            <input className="input" name="milestoneTags" placeholder="e.g. counting-10, scissor-grip" />
          </Field>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setObsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save Draft'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
