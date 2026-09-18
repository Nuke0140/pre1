'use client'

import React, { useState, useEffect } from 'react'
import { Baby, User, Mail, Phone, Key, Shield, AlertCircle, AlertTriangle, CheckCircle2, Lock, Search } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { BranchOption, ClassroomOption } from './types'

interface AddFamilyModalProps {
  open: boolean
  onClose: () => void
  defaultRole?: 'PARENT' | 'GUARDIAN'
  branches: BranchOption[]
  classrooms: ClassroomOption[]
  onSuccess: () => void
}

interface StudentSearchItem {
  id: string
  firstName: string
  lastName: string | null
  admissionNo: string
  currentClassroom?: { id: string; name: string } | null
}

export function AddFamilyModal({
  open,
  onClose,
  defaultRole = 'PARENT',
  branches,
  classrooms,
  onSuccess,
}: AddFamilyModalProps) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [role, setRole] = useState<'PARENT' | 'GUARDIAN'>(defaultRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [relationship, setRelationship] = useState('FATHER')

  // Child association mode: EXISTING vs CREATE
  const [childMode, setChildMode] = useState<'EXISTING' | 'CREATE'>('EXISTING')

  // Existing student state
  const [studentSearch, setStudentSearch] = useState('')
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [studentOptions, setStudentOptions] = useState<StudentSearchItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)
  const [existingParentCount, setExistingParentCount] = useState<number>(0)
  const [checkingParentCount, setCheckingParentCount] = useState(false)

  // New child state
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [childDOB, setChildDOB] = useState('')
  const [childGender, setChildGender] = useState('MALE')
  const [childProgram, setChildProgram] = useState('NURSERY')
  const [childBranchId, setChildBranchId] = useState('')
  const [childClassroomId, setChildClassroomId] = useState('')

  // Permissions & pickup
  const [canPickup, setCanPickup] = useState(true)
  const [pickupPin, setPickupPin] = useState('')
  const [receivesComm, setReceivesComm] = useState(true)
  const [isFeePayer, setIsFeePayer] = useState(true)
  const [isPrimary, setIsPrimary] = useState(false)

  useEffect(() => {
    setRole(defaultRole)
    if (defaultRole === 'GUARDIAN') {
      setRelationship('GRANDPARENT')
      setIsFeePayer(false)
    } else {
      setRelationship('FATHER')
      setIsFeePayer(true)
    }
  }, [defaultRole, open])

  // Search students when search query changes
  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) {
      setStudentOptions([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingStudents(true)
      try {
        const res = await fetch(`/api/v1/students?search=${encodeURIComponent(studentSearch.trim())}&pageSize=10`)
        if (res.ok) {
          const json = await res.json()
          setStudentOptions(json.data || json.items || [])
        }
      } catch (err) {
        console.error('Failed to search students:', err)
      } finally {
        setSearchingStudents(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [studentSearch])

  // Check parent count when selectedStudent changes
  useEffect(() => {
    if (!selectedStudent) {
      setExistingParentCount(0)
      return
    }

    const checkParents = async () => {
      setCheckingParentCount(true)
      try {
        const res = await fetch(`/api/v1/students/${selectedStudent.id}`)
        if (res.ok) {
          const json = await res.json()
          const guardians: any[] = json.data?.guardians || []
          const parents = guardians.filter((g) => {
            const r = (g.relationship || '').toUpperCase()
            return r === 'FATHER' || r === 'MOTHER' || g.isParentAccount
          })
          setExistingParentCount(parents.length)
        }
      } catch (e) {
        // Silent catch
      } finally {
        setCheckingParentCount(false)
      }
    }

    checkParents()
  }, [selectedStudent])

  const isParentLimitExceeded = role === 'PARENT' && childMode === 'EXISTING' && existingParentCount >= 2

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setUsername('')
    setPassword('')
    setSelectedStudent(null)
    setStudentSearch('')
    setChildFirstName('')
    setChildLastName('')
    setChildDOB('')
    setPickupPin('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim() || !email.trim()) {
      toast.error('Validation Error', 'Name and email are required')
      return
    }

    if (childMode === 'EXISTING' && !selectedStudent) {
      toast.error('Student Required', 'Please search and select the enrolled child')
      return
    }

    if (isParentLimitExceeded) {
      toast.error(
        'Max 2 Parents Rule',
        'This child already has 2 registered parents. Please select the GUARDIAN role.'
      )
      return
    }

    if (childMode === 'CREATE' && (!childFirstName.trim() || !childDOB)) {
      toast.error('Child Info Required', 'Child first name and DOB are required')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        role,
        primaryRole: role,
        roles: [role],
        relationship,
        isPrimary,
        canPickup,
        pickupPin: pickupPin.trim() || undefined,
        receivesComm,
        isFeePayer: role === 'PARENT' ? true : isFeePayer,
      }

      if (childMode === 'EXISTING' && selectedStudent) {
        payload.studentId = selectedStudent.id
      }

      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to create family user')
      }

      toast.success(
        `${role === 'PARENT' ? 'Parent' : 'Guardian'} Account Created`,
        `${fullName} has been registered and linked to child. Username: ${json.data?.username || 'Auto-generated'}`
      )
      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Creation Failed', err.message || 'Error occurred while saving family user')
    } finally {
      setSubmitting(false)
    }
  }

  const modalFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 6 }}>
        {role === 'PARENT' ? (
          <span
            className="badge b-primary"
            style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 600, gap: 6 }}
          >
            <Shield style={{ width: 13, height: 13 }} />
            Max 2 Parents per child policy enforced
          </span>
        ) : (
          <span
            className="badge b-amber"
            style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 600, gap: 6 }}
          >
            <CheckCircle2 style={{ width: 13, height: 13 }} />
            Unlimited authorized guardians allowed
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'auto', marginLeft: 'auto' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          form="add-family-form"
          className={`btn btn-sm ${role === 'PARENT' ? 'btn-primary' : ''}`}
          style={
            role === 'GUARDIAN'
              ? { background: 'var(--warning)', color: '#FFFFFF', border: 'none' }
              : undefined
          }
          disabled={submitting || isParentLimitExceeded}
        >
          {submitting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
              Saving...
            </span>
          ) : (
            `Create ${role === 'PARENT' ? 'Parent Account' : 'Authorized Guardian'}`
          )}
        </button>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={role === 'PARENT' ? 'Add Parent Account' : 'Add Authorized Guardian'}
      subtitle={
        role === 'PARENT'
          ? 'Primary student caregiver & fee payer with full academic visibility'
          : 'Authorized pickup escort, relative, or secondary campus contact'
      }
      icon={
        role === 'PARENT' ? (
          <User style={{ width: 20, height: 20 }} />
        ) : (
          <Shield style={{ width: 20, height: 20 }} />
        )
      }
      iconClass={role === 'PARENT' ? 'ic-purple' : 'ic-amber'}
      wide
      footer={modalFooter}
    >
      <form id="add-family-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Role Selector Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {/* Parent Account Card */}
          <button
            type="button"
            onClick={() => {
              setRole('PARENT')
              setRelationship('FATHER')
              setIsFeePayer(true)
            }}
            style={{
              position: 'relative',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              background: role === 'PARENT' ? 'var(--preone-primary-soft)' : 'var(--bg-card)',
              border: role === 'PARENT' ? '2px solid var(--primary)' : '1px solid var(--border-default)',
              boxShadow: role === 'PARENT' ? 'var(--shadow-card)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              transition: 'all 150ms ease',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: role === 'PARENT' ? 'var(--primary)' : 'var(--bg-muted)',
                color: role === 'PARENT' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 150ms ease',
              }}
            >
              <User style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Parent Account</span>
                <span className="badge b-primary b-sm">Fee Payer</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.35 }}>
                Max 2 per child. Full billing, academic, and attendance access.
              </p>
            </div>
            {role === 'PARENT' && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                }}
              />
            )}
          </button>

          {/* Authorized Guardian Card */}
          <button
            type="button"
            onClick={() => {
              setRole('GUARDIAN')
              setRelationship('GRANDPARENT')
              setIsFeePayer(false)
            }}
            style={{
              position: 'relative',
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              background: role === 'GUARDIAN' ? 'var(--warning-soft)' : 'var(--bg-card)',
              border: role === 'GUARDIAN' ? '2px solid var(--warning)' : '1px solid var(--border-default)',
              boxShadow: role === 'GUARDIAN' ? 'var(--shadow-card)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              transition: 'all 150ms ease',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: role === 'GUARDIAN' ? 'var(--warning)' : 'var(--bg-muted)',
                color: role === 'GUARDIAN' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 150ms ease',
              }}
            >
              <Shield style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Authorized Guardian</span>
                <span className="badge b-amber b-sm">Unlimited</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.35 }}>
                Grandparents & relatives. Gate pickup & timeline notices.
              </p>
            </div>
            {role === 'GUARDIAN' && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--warning)',
                }}
              />
            )}
          </button>
        </div>

        {/* Section 1: Caregiver Information */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              1
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Caregiver Information
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="field">
              <label>
                Full Name <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <User style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="field">
              <label>
                Relationship to Child <span className="req">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="select"
              >
                {role === 'PARENT' ? (
                  <>
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                  </>
                ) : (
                  <>
                    <option value="GRANDPARENT">Grandparent (Grandmother / Grandfather)</option>
                    <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                    <option value="OTHER">Uncle / Aunt / Caregiver / Nanny</option>
                  </>
                )}
              </select>
            </div>

            <div className="field">
              <label>
                Email Address <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <Mail style={{ width: 16, height: 16 }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="field">
              <label>
                Mobile Phone <span className="req">*</span>
              </label>
              <div className="input-icon-wrap">
                <Phone style={{ width: 16, height: 16 }} />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Student Association */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                2
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Student Association
              </span>
            </div>

            <div className="seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={childMode === 'EXISTING'}
                onClick={() => setChildMode('EXISTING')}
                className={childMode === 'EXISTING' ? 'on' : ''}
              >
                Enrolled Student
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={childMode === 'CREATE'}
                onClick={() => setChildMode('CREATE')}
                className={childMode === 'CREATE' ? 'on' : ''}
              >
                Enroll New
              </button>
            </div>
          </div>

          {childMode === 'EXISTING' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!selectedStudent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="input-icon-wrap">
                    <Search style={{ width: 16, height: 16 }} />
                    <input
                      type="search"
                      name="search_student_record_query"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder="Type student name or admission number (e.g. Aarav, PRE-1001)..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="input"
                      style={{ paddingLeft: 38 }}
                    />
                  </div>

                  {searchingStudents && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}>
                      <span className="animate-spin" style={{ width: 12, height: 12, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      Searching student directory...
                    </div>
                  )}

                  {studentOptions.length > 0 && (
                    <div
                      style={{
                        maxHeight: 190,
                        overflowY: 'auto',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-card)',
                        boxShadow: 'var(--shadow-elevated)',
                      }}
                    >
                      {studentOptions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s)
                            setStudentSearch('')
                            setStudentOptions([])
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 120ms ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                              }}
                            >
                              {s.firstName?.[0] || 'S'}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-primary)' }}>
                                {s.firstName} {s.lastName || ''}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                Class: {s.currentClassroom?.name || 'Unassigned'}
                              </div>
                            </div>
                          </div>
                          <span className="badge b-neutral b-sm font-mono" style={{ fontSize: 11 }}>
                            {s.admissionNo}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'var(--primary)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        boxShadow: 'var(--shadow-soft)',
                      }}
                    >
                      {selectedStudent.firstName?.[0] || 'S'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--text-primary)' }}>
                          {selectedStudent.firstName} {selectedStudent.lastName || ''}
                        </span>
                        <span className="badge b-primary b-sm font-mono" style={{ fontWeight: 700 }}>
                          {selectedStudent.admissionNo}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Class: {selectedStudent.currentClassroom?.name || 'Unassigned'}</span>
                        <span>•</span>
                        <span>
                          {checkingParentCount ? (
                            <span style={{ color: 'var(--primary)' }}>Verifying quota...</span>
                          ) : (
                            <span
                              className={`badge b-sm ${
                                existingParentCount >= 2 ? 'b-amber' : 'b-success'
                              }`}
                              style={{ padding: '2px 8px' }}
                            >
                              {existingParentCount >= 2 ? (
                                <AlertTriangle style={{ width: 11, height: 11 }} />
                              ) : (
                                <CheckCircle2 style={{ width: 11, height: 11 }} />
                              )}
                              {existingParentCount}/2 Parents registered
                              {existingParentCount < 2 && ` (${2 - existingParentCount} slot open)`}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null)
                      setStudentSearch('')
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', fontSize: 12 }}
                  >
                    Change Student
                  </button>
                </div>
              )}

              {/* Max 2 Parents policy warning */}
              {isParentLimitExceeded && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--warning-soft)',
                    border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 12,
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <AlertTriangle style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 13, marginBottom: 2 }}>
                      Max 2 Parents Rule Enforced
                    </strong>
                    This child already has 2 registered Parent accounts in this preschool. According to school policy, primary parent accounts are capped at 2. You can add this caregiver as an Authorized Guardian with full gate pickup authorizations.
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRole('GUARDIAN')
                          setRelationship('GRANDPARENT')
                          setIsFeePayer(false)
                        }}
                        className="btn btn-sm"
                        style={{ background: '#D97706', color: '#FFFFFF', border: 'none', fontWeight: 700 }}
                      >
                        Switch to Authorized Guardian account →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
                padding: '14px 16px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="field">
                <label>
                  Child First Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav"
                  value={childFirstName}
                  onChange={(e) => setChildFirstName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label>Child Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={childLastName}
                  onChange={(e) => setChildLastName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label>
                  Date of Birth <span className="req">*</span>
                </label>
                <input
                  type="date"
                  value={childDOB}
                  onChange={(e) => setChildDOB(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label>Program Level</label>
                <select
                  value={childProgram}
                  onChange={(e) => setChildProgram(e.target.value)}
                  className="select"
                >
                  <option value="PLAYGROUP">Playgroup</option>
                  <option value="NURSERY">Nursery</option>
                  <option value="LKG">LKG / Junior KG</option>
                  <option value="UKG">UKG / Senior KG</option>
                  <option value="DAYCARE">Daycare</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Security & Campus Authorizations */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              3
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Security & Campus Authorizations
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div className="field">
              <label>
                4-Digit Pickup PIN <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Campus gate signout)</span>
              </label>
              <div className="input-icon-wrap">
                <Lock style={{ width: 16, height: 16 }} />
                <input
                  type="password"
                  maxLength={4}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="e.g. 1234"
                  value={pickupPin}
                  onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                  className="input font-mono"
                  style={{ paddingLeft: 38, letterSpacing: '0.2em' }}
                />
              </div>
              <span className="helper">Used for biometric or kiosk verification during afternoon student dismissal.</span>
            </div>

            <div className="field">
              <label>
                Portal Username <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="e.g. rahul.sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input font-mono"
              />
              <span className="helper">Auto-generated from email handle if left empty.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: canPickup ? '1.5px solid var(--primary)' : '1px solid var(--border-default)',
                background: canPickup ? 'var(--preone-primary-soft)' : 'var(--bg-subtle)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={canPickup}
                onChange={(e) => setCanPickup(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  Authorized Campus Pickup
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginTop: 2, lineHeight: 1.35 }}>
                  Authorized to sign-out child from campus gate with PIN verification.
                </span>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: receivesComm ? '1.5px solid var(--primary)' : '1px solid var(--border-default)',
                background: receivesComm ? 'var(--preone-primary-soft)' : 'var(--bg-subtle)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={receivesComm}
                onChange={(e) => setReceivesComm(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  Timeline & Notice Broadcasts
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'block', marginTop: 2, lineHeight: 1.35 }}>
                  Receives daily attendance alerts, classroom photos, and announcements.
                </span>
              </div>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}

