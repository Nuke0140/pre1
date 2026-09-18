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
    <div className="flex items-center justify-between w-full gap-3">
      <div className="hidden sm:flex text-xs text-[var(--text-muted)] items-center gap-1.5">
        {role === 'PARENT' ? (
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-500" /> Max 2 Parents per child policy enforced
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Unlimited authorized guardians allowed
          </span>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
        <button
          type="button"
          className="btn btn-secondary text-xs flex-1 sm:flex-none"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          form="add-family-form"
          className={`btn text-xs flex-1 sm:flex-none ${role === 'PARENT' ? 'btn-primary' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
          disabled={submitting || isParentLimitExceeded}
        >
          {submitting ? 'Creating...' : `Create ${role === 'PARENT' ? 'Parent' : 'Guardian'}`}
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
          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        )
      }
      iconClass={role === 'PARENT' ? 'ic-purple' : 'ic-amber'}
      wide
      footer={modalFooter}
    >
      <form id="add-family-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selector Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setRole('PARENT')
              setRelationship('FATHER')
              setIsFeePayer(true)
            }}
            className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
              role === 'PARENT'
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500/20'
                : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                role === 'PARENT' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">Parent Account</span>
                <span className="badge b-primary text-[10px] py-0 px-1.5">Fee Payer</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                Max 2 per child. Full billing, academic, and attendance access.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('GUARDIAN')
              setRelationship('GRANDPARENT')
              setIsFeePayer(false)
            }}
            className={`p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
              role === 'GUARDIAN'
                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm ring-1 ring-amber-500/20'
                : 'border-[var(--border-default)] bg-[var(--bg-card)] hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                role === 'GUARDIAN' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">Authorized Guardian</span>
                <span className="badge text-[10px] py-0 px-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  Unlimited
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                Grandparents & relatives. Gate pickup & timeline notices.
              </p>
            </div>
          </button>
        </div>

        {/* Caregiver Identity Information */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold tracking-wide uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              1. Caregiver Information
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="input-icon-wrap">
                <User />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input text-sm"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Relationship to Child <span className="text-red-500">*</span>
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="select text-sm"
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

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="input-icon-wrap">
                <Mail />
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input text-sm"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Mobile Phone <span className="text-red-500">*</span>
              </label>
              <div className="input-icon-wrap">
                <Phone />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input text-sm"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Linked Child Selection */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold tracking-wide uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <Baby className="w-3.5 h-3.5 text-indigo-500" />
              2. Student Association
            </span>
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
            <div className="space-y-2.5">
              {!selectedStudent ? (
                <div className="space-y-2">
                  <div className="input-icon-wrap">
                    <Search />
                    <input
                      type="search"
                      name="search_student_record_query"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder="Type student name or admission number (e.g. Aarav, PRE-1001)..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="input text-sm"
                      style={{ paddingLeft: 38 }}
                    />
                  </div>

                  {searchingStudents && (
                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 px-1">
                      <span className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      Searching student roster...
                    </div>
                  )}

                  {studentOptions.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-[var(--border-default)] rounded-xl divide-y divide-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg">
                      {studentOptions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s)
                            setStudentSearch('')
                            setStudentOptions([])
                          }}
                          className="w-full p-2.5 text-left hover:bg-[var(--bg-subtle)] flex items-center justify-between transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[11px]">
                              {s.firstName?.[0] || 'S'}
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">
                                {s.firstName} {s.lastName || ''}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)]">
                                Class: {s.currentClassroom?.name || 'Unassigned'}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                            {s.admissionNo}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {selectedStudent.firstName?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                        {selectedStudent.firstName} {selectedStudent.lastName || ''}
                        <span className="badge b-primary font-mono text-[10px] py-0 px-1.5">{selectedStudent.admissionNo}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                        <span>Class: {selectedStudent.currentClassroom?.name || 'Unassigned'}</span>
                        <span>•</span>
                        <span>
                          {checkingParentCount ? (
                            'Checking parents...'
                          ) : (
                            <span
                              className={
                                existingParentCount >= 2
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-emerald-600 dark:text-emerald-400 font-medium'
                              }
                            >
                              {existingParentCount}/2 Parents registered
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
                    className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    Change Student
                  </button>
                </div>
              )}

              {/* Max 2 Parents policy warning */}
              {isParentLimitExceeded && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Max 2 Parents Rule Enforced</strong>
                    This child already has 2 registered Parent accounts in this school. To add an additional caregiver (grandparent, uncle, or pickup escort), please switch this user to a Guardian account.
                    <button
                      type="button"
                      onClick={() => {
                        setRole('GUARDIAN')
                        setRelationship('GRANDPARENT')
                        setIsFeePayer(false)
                      }}
                      className="mt-2 inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline"
                    >
                      Switch role to GUARDIAN account →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }} className="p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-subtle)]">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Child First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav"
                  value={childFirstName}
                  onChange={(e) => setChildFirstName(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Child Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={childLastName}
                  onChange={(e) => setChildLastName(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={childDOB}
                  onChange={(e) => setChildDOB(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Program Level
                </label>
                <select
                  value={childProgram}
                  onChange={(e) => setChildProgram(e.target.value)}
                  className="select text-sm"
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

        {/* Pickup & Security Authorization */}
        <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold tracking-wide uppercase text-[var(--text-muted)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              3. Security & Campus Authorizations
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                4-Digit Pickup PIN <span className="text-[var(--text-muted)] font-normal">(Campus gate signout)</span>
              </label>
              <div className="input-icon-wrap">
                <Lock />
                <input
                  type="password"
                  maxLength={4}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="e.g. 1234"
                  value={pickupPin}
                  onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                  className="input text-sm font-mono tracking-widest"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Portal Username <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder="e.g. rahul.sharma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input text-sm font-mono"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }} className="pt-1">
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                canPickup
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] opacity-75'
              }`}
            >
              <input
                type="checkbox"
                checked={canPickup}
                onChange={(e) => setCanPickup(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Authorized Campus Pickup</span>
                <span className="text-[11px] text-[var(--text-muted)] leading-tight block mt-0.5">
                  Authorized to sign-out child from campus gate with PIN verification
                </span>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                receivesComm
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] opacity-75'
              }`}
            >
              <input
                type="checkbox"
                checked={receivesComm}
                onChange={(e) => setReceivesComm(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Timeline & Notice Broadcasts</span>
                <span className="text-[11px] text-[var(--text-muted)] leading-tight block mt-0.5">
                  Receives daily attendance, photos, notifications, and alerts
                </span>
              </div>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}
