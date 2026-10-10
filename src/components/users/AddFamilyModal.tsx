'use client'

import React, { useState, useEffect } from 'react'
import {
  Baby, User, Mail, Phone, Key, Shield, AlertCircle,
  CheckCircle2, Lock, Search, RefreshCw, Eye, EyeOff, Plus,
  ArrowRight, ArrowLeft, Check, Sparkles, Building, DoorOpen, Calendar
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { BranchOption, ClassroomOption } from './types'
import { UserPhotoUpload } from './UserPhotoUpload'

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
  branchId?: string
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
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Step 1: Caregiver Details
  const [role, setRole] = useState<'PARENT' | 'GUARDIAN'>(defaultRole)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] = useState('FATHER')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Step 2: Child Connection
  const [childMode, setChildMode] = useState<'EXISTING' | 'CREATE'>('EXISTING')

  // Mode A: Existing Student
  const [studentSearch, setStudentSearch] = useState('')
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [studentOptions, setStudentOptions] = useState<StudentSearchItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null)
  const [existingParentCount, setExistingParentCount] = useState<number>(0)

  // Mode B: New Student
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [childDOB, setChildDOB] = useState('')
  const [childGender, setChildGender] = useState('MALE')
  const [childBranchId, setChildBranchId] = useState(branches[0]?.id || '')
  const [childClassroomId, setChildClassroomId] = useState(classrooms[0]?.id || '')
  const [childAdmissionNo, setChildAdmissionNo] = useState('')
  const [childPhotoUrl, setChildPhotoUrl] = useState('')

  // Step 3: Security & Access
  const [canPickup, setCanPickup] = useState(true)
  const [pickupPin, setPickupPin] = useState('')
  const [receivesComm, setReceivesComm] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE')

  useEffect(() => {
    if (open) {
      setRole(defaultRole)
      if (defaultRole === 'GUARDIAN') {
        setRelationship('GRANDPARENT')
      } else {
        setRelationship('FATHER')
      }
      if (!password) generateRandomPassword()
      if (branches.length > 0 && !childBranchId) setChildBranchId(branches[0].id)
      if (classrooms.length > 0 && !childClassroomId) setChildClassroomId(classrooms[0].id)
    }
  }, [open, defaultRole, branches, classrooms])

  // Auto-generate username from fullName
  const handleFullNameChange = (val: string) => {
    setFullName(val)
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/^(mr\.|mrs\.|ms\.|dr\.)\s+/i, '')
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
    if (slug) {
      const rand = Math.floor(100 + Math.random() * 900)
      setUsername(`${slug}.${rand}`)
    } else {
      setUsername('')
    }
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let pwd = 'PreOne@'
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pwd)
  }

  // Search students with debounce
  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) {
      setStudentOptions([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchingStudents(true)
      try {
        const res = await fetch(`/api/v1/students?search=${encodeURIComponent(studentSearch.trim())}&pageSize=8`)
        if (res.ok) {
          const json = await res.json()
          setStudentOptions(json.data || json.items || [])
        }
      } catch (err) {
        // Non-blocking
      } finally {
        setSearchingStudents(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [studentSearch])

  // Check parent count when existing student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setExistingParentCount(0)
      return
    }

    const checkParents = async () => {
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
        // Non-blocking
      }
    }

    checkParents()
  }, [selectedStudent])

  const isParentLimitExceeded = role === 'PARENT' && childMode === 'EXISTING' && existingParentCount >= 2

  const resetForm = () => {
    setStep(1)
    setFullName('')
    setPhone('')
    setEmail('')
    setAvatarUrl('')
    setRole(defaultRole)
    setRelationship('FATHER')
    setChildMode('EXISTING')
    setSelectedStudent(null)
    setStudentSearch('')
    setChildFirstName('')
    setChildLastName('')
    setChildDOB('')
    setChildAdmissionNo('')
    setChildPhotoUrl('')
    setCanPickup(true)
    setPickupPin('')
    setReceivesComm(true)
    setUsername('')
    setPassword('')
    setStatus('ACTIVE')
  }

  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error('Validation Error', 'Full Name is required')
      return false
    }
    if (!phone.trim()) {
      toast.error('Validation Error', 'Mobile Phone number is required')
      return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Validation Error', 'A valid Email address is required')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (childMode === 'EXISTING') {
      if (!selectedStudent) {
        toast.error('Student Required', 'Please search and select the enrolled child')
        return false
      }
      if (isParentLimitExceeded) {
        toast.error(
          'Max 2 Parents Rule',
          'This child already has 2 registered parents. Please select Guardian role in Step 1.'
        )
        return false
      }
    } else {
      if (!childFirstName.trim()) {
        toast.error('Validation Error', 'Child first name is required')
        return false
      }
      if (!childDOB) {
        toast.error('Validation Error', 'Child Date of Birth is required')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2)
    } else if (step === 2) {
      if (validateStep2()) setStep(3)
    }
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep1() || !validateStep2()) return

    if (pickupPin && !/^\d{4,6}$/.test(pickupPin.trim())) {
      toast.error('Invalid PIN', 'Pickup PIN must be 4 to 6 numeric digits')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim() || null,
        role,
        primaryRole: role,
        roles: [role],
        relationship,
        status,
        canPickup,
        pickupPin: pickupPin.trim() || undefined,
        receivesComm,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        childMode,
      }

      if (childMode === 'EXISTING' && selectedStudent) {
        payload.studentId = selectedStudent.id
        payload.studentAdmissionNo = selectedStudent.admissionNo
      }

      if (childMode === 'CREATE') {
        payload.newChild = {
          firstName: childFirstName.trim(),
          lastName: childLastName.trim() || undefined,
          dob: childDOB,
          gender: childGender,
          branchId: childBranchId || undefined,
          classroomId: childClassroomId || undefined,
          admissionNo: childAdmissionNo.trim() || undefined,
          photoUrl: childPhotoUrl.trim() || undefined,
        }
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
        `${fullName} registered successfully.`
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
      {step > 1 ? (
        <button
          type="button"
          onClick={handleBack}
          disabled={submitting}
          className="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="btn btn-secondary text-xs py-2 px-3"
        >
          Cancel
        </button>
      )}

      <div className="flex items-center gap-2">
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-4 font-semibold shadow-xs"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            form="add-family-form"
            disabled={submitting}
            className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-4 font-semibold shadow-xs"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Create Family Account</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Family Member"
      subtitle="Connect parents and authorized guardians to students effortlessly"
      icon={<Baby className="w-5 h-5" />}
      iconClass="ic-orange"
      wide
      footer={modalFooter}
    >
      <div className="space-y-4">
        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between px-1 py-1 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              step === 1
                ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                : step > 1
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 1
                ? 'bg-amber-600 text-white font-bold'
                : step > 1
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>1. Caregiver Details</span>
          </button>

          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800 mx-2" />

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              step === 2
                ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                : step > 2
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 2
                ? 'bg-amber-600 text-white font-bold'
                : step > 2
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>2. Child Connection</span>
          </button>

          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800 mx-2" />

          <button
            type="button"
            onClick={() => validateStep1() && validateStep2() && setStep(3)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              step === 3
                ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 3
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              3
            </span>
            <span>3. Security &amp; Access</span>
          </button>
        </div>

        <form id="add-family-form" onSubmit={handleSubmit} autoComplete="off">
          {/* ──────────────── STEP 1: CAREGIVER DETAILS ──────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Caregiver Profile
                  </span>
                  {/* Role Selector Pills */}
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('PARENT')
                        if (relationship === 'GRANDPARENT') setRelationship('FATHER')
                      }}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        role === 'PARENT'
                          ? 'bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 font-semibold shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRole('GUARDIAN')
                        if (relationship === 'FATHER' || relationship === 'MOTHER') setRelationship('GRANDPARENT')
                      }}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        role === 'GUARDIAN'
                          ? 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 font-semibold shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Guardian
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Joshi"
                        value={fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        className="input w-full text-xs pl-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Relationship */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Relationship to Child <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="select w-full text-xs mt-1"
                    >
                      {role === 'PARENT' ? (
                        <>
                          <option value="FATHER">Father</option>
                          <option value="MOTHER">Mother</option>
                          <option value="STEP_PARENT">Step-Parent</option>
                        </>
                      ) : (
                        <>
                          <option value="GRANDPARENT">Grandparent</option>
                          <option value="UNCLE_AUNT">Uncle / Aunt</option>
                          <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                          <option value="NANNY_CARETAKER">Nanny / Caretaker</option>
                          <option value="OTHER">Other Relative</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Mobile Phone */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Mobile Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>

                  {/* Caregiver Profile Photo Upload */}
                  <UserPhotoUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    name={fullName}
                    label="Caregiver Profile Photo"
                    hint="Upload photo from device (JPG, PNG, WebP up to 5MB). Stored securely."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: CHILD CONNECTION ──────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Option Selector: Existing vs Create New */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChildMode('EXISTING')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    childMode === 'EXISTING'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500/30'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      childMode === 'EXISTING' ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-400'
                    }`}>
                      {childMode === 'EXISTING' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Enrolled Student</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-6">
                    Link to a child already registered in the preschool
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setChildMode('CREATE')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    childMode === 'CREATE'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500/30'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      childMode === 'CREATE' ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-400'
                    }`}>
                      {childMode === 'CREATE' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Register New Student</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-6">
                    Create child record along with this caregiver
                  </p>
                </button>
              </div>

              {/* MODE A: EXISTING STUDENT SEARCH */}
              {childMode === 'EXISTING' && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-3">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    Select Enrolled Student
                  </div>

                  {selectedStudent ? (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-200/60 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 font-bold flex items-center justify-center text-xs">
                          {selectedStudent.firstName[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            {selectedStudent.firstName} {selectedStudent.lastName || ''}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                            <span>Adm: {selectedStudent.admissionNo}</span>
                            {selectedStudent.currentClassroom && (
                              <span>• Class: {selectedStudent.currentClassroom.name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null)
                          setStudentSearch('')
                        }}
                        className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search child by name or admission number..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="input w-full text-xs pl-9"
                          autoFocus
                        />
                        {searchingStudents && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        )}
                      </div>

                      {studentOptions.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                          {studentOptions.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => {
                                setSelectedStudent(st)
                                setStudentOptions([])
                              }}
                              className="p-2.5 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {st.firstName} {st.lastName || ''}
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono">
                                {st.admissionNo} {st.currentClassroom ? `(${st.currentClassroom.name})` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {studentSearch.length >= 2 && !searchingStudents && studentOptions.length === 0 && (
                        <p className="text-xs text-gray-400 italic py-1">
                          No students matching &quot;{studentSearch}&quot;. You can choose &quot;Register New Student&quot; above.
                        </p>
                      )}
                    </div>
                  )}

                  {isParentLimitExceeded && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <strong>Max 2 Parents Rule:</strong> This child already has 2 registered Parents.
                        Please switch role to <strong>Guardian</strong> in Step 1.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE B: CREATE NEW STUDENT */}
              {childMode === 'CREATE' && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    New Student Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aarav"
                        value={childFirstName}
                        onChange={(e) => setChildFirstName(e.target.value)}
                        className="input w-full text-xs mt-1"
                        autoFocus
                      />
                    </div>

                    {/* Last Name */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Joshi"
                        value={childLastName}
                        onChange={(e) => setChildLastName(e.target.value)}
                        className="input w-full text-xs mt-1"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          required
                          value={childDOB}
                          onChange={(e) => setChildDOB(e.target.value)}
                          className="input w-full text-xs pl-9"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Gender
                      </label>
                      <select
                        value={childGender}
                        onChange={(e) => setChildGender(e.target.value)}
                        className="select w-full text-xs mt-1"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    {/* Campus Branch */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Campus Branch
                      </label>
                      <div className="relative mt-1">
                        <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          value={childBranchId}
                          onChange={(e) => setChildBranchId(e.target.value)}
                          className="select w-full text-xs pl-9"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Classroom */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Classroom / Section
                      </label>
                      <div className="relative mt-1">
                        <DoorOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          value={childClassroomId}
                          onChange={(e) => setChildClassroomId(e.target.value)}
                          className="select w-full text-xs pl-9"
                        >
                          <option value="">Select Classroom</option>
                          {classrooms.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.code ? `(${c.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Admission Number */}
                    <div className="field sm:col-span-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Admission Number (Optional - Auto-generated if left blank)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PRE-2026-0042"
                        value={childAdmissionNo}
                        onChange={(e) => setChildAdmissionNo(e.target.value)}
                        className="input w-full text-xs font-mono mt-1"
                      />
                    </div>

                    {/* Child Admission Photo Upload */}
                    <UserPhotoUpload
                      value={childPhotoUrl}
                      onChange={setChildPhotoUrl}
                      name={`${childFirstName} ${childLastName}`.trim() || 'Child'}
                      label="Child Photo (Optional)"
                      hint="Upload student enrollment photo from device (JPG, PNG, WebP up to 5MB)."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 3: SECURITY & ACCESS ──────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Pickup &amp; Access Controls
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pickup Authorization Toggle */}
                  <div className="field sm:col-span-2 flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white block">
                        Authorized for Campus Pickup
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Permit this caregiver to pick up the child from campus gates
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={canPickup}
                        onChange={(e) => setCanPickup(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600" />
                    </label>
                  </div>

                  {/* Pickup PIN */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Pickup Security PIN (Optional)
                    </label>
                    <div className="relative mt-1">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 4821"
                        value={pickupPin}
                        onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                        className="input w-full text-xs pl-9 font-mono tracking-widest"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      4 to 6 digits numeric PIN for contactless gate verification
                    </p>
                  </div>

                  {/* Communications Toggle */}
                  <div className="field flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white block">
                        Receive Broadcasts &amp; Alerts
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Attendance, fee receipts, and updates
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receivesComm}
                        onChange={(e) => setReceivesComm(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Login Credentials & Review */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-3">
                <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Parent Portal Access
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Portal Username
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input w-full text-xs pl-7 font-mono"
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Temporary Password
                    </label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input w-full text-xs pl-9 pr-9 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="btn btn-secondary text-xs px-2.5 py-1"
                        title="Generate random password"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  Review &amp; Confirm
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Caregiver</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Role &amp; Relation</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                      {role.toLowerCase()} ({relationship.toLowerCase().replace('_', ' ')})
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Child</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {childMode === 'EXISTING'
                        ? selectedStudent ? `${selectedStudent.firstName} (${selectedStudent.admissionNo})` : '—'
                        : `${childFirstName} ${childLastName}`.trim()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Pickup Security</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {canPickup ? (pickupPin ? 'Authorized (PIN)' : 'Authorized') : 'Restricted'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
