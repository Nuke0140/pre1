'use client'

import React, { useState, useEffect } from 'react'
import {
  Briefcase, Building, Mail, Phone, User, Shield, Check, Key,
  Calendar, GraduationCap, Sparkles, RefreshCw, Layers, Award,
  Clock, DoorOpen, UserCheck, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { Role, BranchOption, ClassroomOption, CANONICAL_STAFF_ROLES, ROLE_BADGE } from './types'
import { UserPhotoUpload } from './UserPhotoUpload'

interface AddStaffModalProps {
  open: boolean
  onClose: () => void
  branches: BranchOption[]
  classrooms: ClassroomOption[]
  onSuccess: () => void
}

export function AddStaffModal({ open, onClose, branches, classrooms, onSuccess }: AddStaffModalProps) {
  const toast = useToast()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Step 1: Basic Information
  const [avatarUrl, setAvatarUrl] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('')

  // Step 2: Work & Assignment
  const [primaryRole, setPrimaryRole] = useState<Role>('TEACHER')
  const [additionalRoles, setAdditionalRoles] = useState<Role[]>([])
  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [employeeCode, setEmployeeCode] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('Academics')
  const [qualification, setQualification] = useState('')
  const [employmentType, setEmploymentType] = useState('FULL_TIME')
  const [joiningDate, setJoiningDate] = useState('')
  const [reportingManagerId, setReportingManagerId] = useState('')
  const [classroomId, setClassroomId] = useState('')

  // Step 3: Account & Access
  const [username, setUsername] = useState('')
  const [isUsernameCustom, setIsUsernameCustom] = useState(false)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'>('ACTIVE')

  // Auto-generate employee code on open if blank
  useEffect(() => {
    if (open) {
      if (!employeeCode) generateEmployeeCode()
      if (!branchId && branches.length > 0) setBranchId(branches[0].id)
      if (!password) generateRandomPassword()
    }
  }, [open, branches])

  // Auto-generate username from fullName if not manually customized
  const handleFullNameChange = (val: string) => {
    setFullName(val)
    if (!isUsernameCustom) {
      const slug = val
        .toLowerCase()
        .trim()
        .replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
      if (slug.length >= 2) {
        setUsername(`${slug[0]}.${slug[slug.length - 1]}`)
      } else if (slug.length === 1) {
        setUsername(slug[0])
      } else {
        setUsername('')
      }
    }
  }

  const generateEmployeeCode = () => {
    const year = new Date().getFullYear()
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    setEmployeeCode(`EMP-${year}-${randomSuffix}`)
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let pwd = 'PreOne@'
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pwd)
  }

  const toggleAdditionalRole = (r: Role) => {
    if (r === primaryRole) return
    setAdditionalRoles((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    )
  }

  const isTeacher = primaryRole === 'TEACHER' || additionalRoles.includes('TEACHER')

  // Available classrooms filtered by branch if selected
  const availableClassrooms = classrooms.filter(
    (c) => !branchId || !c.branchId || c.branchId === branchId
  )

  const resetForm = () => {
    setStep(1)
    setAvatarUrl('')
    setFullName('')
    setEmail('')
    setPhone('')
    setDateOfBirth('')
    setGender('')
    setUsername('')
    setIsUsernameCustom(false)
    setPassword('')
    setPrimaryRole('TEACHER')
    setAdditionalRoles([])
    setBranchId(branches[0]?.id || '')
    setStatus('ACTIVE')
    setEmployeeCode('')
    setDesignation('')
    setDepartment('Academics')
    setEmploymentType('FULL_TIME')
    setQualification('')
    setJoiningDate('')
    setReportingManagerId('')
    setClassroomId('')
  }

  const validateStep1 = () => {
    if (!fullName.trim()) {
      toast.error('Validation Error', 'Full Name is required')
      return false
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Validation Error', 'A valid Work Email is required')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!branchId) {
      toast.error('Validation Error', 'Campus Branch is required')
      return false
    }
    if (!employeeCode.trim()) {
      toast.error('Validation Error', 'Employee Code is required')
      return false
    }
    if (!designation.trim()) {
      toast.error('Validation Error', 'Job Designation is required')
      return false
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

    setSubmitting(true)
    try {
      const allRoles: Role[] = [...new Set([primaryRole, ...additionalRoles])]

      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          username: username.trim() || undefined,
          password: password.trim() || undefined,
          role: primaryRole,
          primaryRole,
          roles: allRoles,
          additionalRoles,
          branchId,
          status,
          employeeCode: employeeCode.trim(),
          designation: designation.trim(),
          department: department.trim() || undefined,
          employmentType,
          qualification: qualification.trim() || undefined,
          joiningDate: joiningDate || undefined,
          reportingManagerId: reportingManagerId || undefined,
          classroomId: isTeacher && classroomId ? classroomId : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to create staff account')
      }

      toast.success(
        'Staff Member Onboarded',
        `${fullName} registered as ${ROLE_BADGE[primaryRole]?.label || primaryRole} (Code: ${employeeCode.trim()}).`
      )
      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Creation Failed', err.message || 'Error occurred while saving staff user')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedBranchObj = branches.find((b) => b.id === branchId)
  const selectedClassroomObj = classrooms.find((c) => c.id === classroomId)

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
            form="add-staff-form"
            disabled={submitting}
            className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-4 font-semibold shadow-xs"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Onboarding...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Complete Onboarding</span>
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
      title="Add Staff Member"
      subtitle="Complete progressive staff onboarding in 3 simple steps"
      icon={<Briefcase className="w-5 h-5" />}
      iconClass="ic-purple"
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
                ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                : step > 1
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 1
                ? 'bg-purple-600 text-white font-bold'
                : step > 1
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>1. Basic Info</span>
          </button>

          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800 mx-2" />

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              step === 2
                ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                : step > 2
                ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 2
                ? 'bg-purple-600 text-white font-bold'
                : step > 2
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>2. Work & Assignment</span>
          </button>

          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800 mx-2" />

          <button
            type="button"
            onClick={() => validateStep1() && validateStep2() && setStep(3)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              step === 3
                ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                : 'text-gray-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              step === 3
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              3
            </span>
            <span>3. Access & Login</span>
          </button>
        </div>

        <form id="add-staff-form" onSubmit={handleSubmit} autoComplete="off">
          {/* ──────────────── STEP 1: BASIC INFORMATION ──────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Personal Details
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
                        placeholder="e.g. Priya Sharma"
                        value={fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        className="input w-full text-xs pl-9"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. priya@preschool.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Mobile Phone
                    </label>
                    <div className="relative mt-1">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>

                  {/* Staff Profile Photo Upload */}
                  <UserPhotoUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    name={fullName}
                    label="Staff Profile Photo"
                    hint="Upload photo from device (JPG, PNG, WebP up to 5MB). Stored securely."
                  />

                  {/* Date of Birth */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
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
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="select w-full text-xs mt-1"
                    >
                      <option value="">Select Gender</option>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: WORK & ASSIGNMENT ──────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Role &amp; Campus Position
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Primary Role */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Primary Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value as Role)}
                      className="select w-full text-xs mt-1"
                    >
                      {CANONICAL_STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_BADGE[r]?.label || r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campus Branch */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Campus Branch <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        required
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
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

                  {/* Employee Code */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Employee Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        required
                        placeholder="EMP-2026-001"
                        value={employeeCode}
                        onChange={(e) => setEmployeeCode(e.target.value)}
                        className="input flex-1 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={generateEmployeeCode}
                        className="btn btn-secondary text-xs px-2.5 py-1"
                        title="Regenerate code"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Job Designation */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Job Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Award className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lead Teacher / Accounts Officer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="select w-full text-xs mt-1"
                    >
                      <option value="Academics">Academics &amp; Early Years</option>
                      <option value="Administration">Administration</option>
                      <option value="Accounts">Accounts &amp; Finance</option>
                      <option value="Operations">Operations &amp; Support</option>
                      <option value="Transport">Transport &amp; Logistics</option>
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Employment Type
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="select w-full text-xs mt-1"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PROBATION">Probation</option>
                    </select>
                  </div>

                  {/* Joining Date */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Joining Date
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>

                  {/* Qualification */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Qualification
                    </label>
                    <div className="relative mt-1">
                      <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. B.Ed, ECCEd, NTT"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="input w-full text-xs pl-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Secondary Roles */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[11px] font-medium text-gray-500">
                    Additional Secondary Roles (Optional)
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {CANONICAL_STAFF_ROLES.filter((r) => r !== primaryRole).map((r) => {
                      const selected = additionalRoles.includes(r)
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleAdditionalRole(r)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            selected
                              ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-300 text-purple-700 dark:text-purple-300 font-semibold'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {selected ? `✓ ${ROLE_BADGE[r]?.label || r}` : `+ ${ROLE_BADGE[r]?.label || r}`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── TEACHING ASSIGNMENT: RENDERED STRICTLY ONLY FOR TEACHERS ── */}
              {isTeacher && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
                    <DoorOpen className="w-4 h-4" />
                    <span>Teaching Assignment (Classroom)</span>
                  </div>

                  <div className="field">
                    <label className="text-xs font-medium text-purple-900 dark:text-purple-200">
                      Assigned Primary Classroom
                    </label>
                    <div className="relative mt-1">
                      <select
                        value={classroomId}
                        onChange={(e) => setClassroomId(e.target.value)}
                        className="select w-full text-xs bg-white dark:bg-gray-900"
                      >
                        <option value="">Select Classroom / Section (Optional)</option>
                        {availableClassrooms.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.code ? `(${c.code})` : ''} {c.programType ? `— ${c.programType}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-1.5 leading-relaxed">
                      Assigning a classroom allows the teacher to take daily attendance, post learning observations, and manage classroom activity logs.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── STEP 3: ACCOUNT & ACCESS ──────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Access &amp; Security Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Login Username
                    </label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">@</span>
                        <input
                          type="text"
                          placeholder="priya.sharma"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value)
                            setIsUsernameCustom(true)
                          }}
                          className="input w-full text-xs pl-7 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsUsernameCustom(false)
                          handleFullNameChange(fullName)
                        }}
                        className="btn btn-secondary text-xs px-2.5 py-1"
                        title="Reset auto username"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      </button>
                    </div>
                  </div>

                  {/* Initial Password */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Initial Password
                    </label>
                    <div className="flex gap-2 mt-1">
                      <div className="relative flex-1">
                        <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
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

                  {/* Account Status */}
                  <div className="field sm:col-span-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Account Status
                    </label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={status === 'ACTIVE'}
                          onChange={() => setStatus('ACTIVE')}
                        />
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active (Immediate Login)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={status === 'PENDING'}
                          onChange={() => setStatus('PENDING')}
                        />
                        <span className="text-amber-700 dark:text-amber-400">Pending (Invite on first day)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 space-y-2">
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  Summary Review
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Name</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fullName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Role</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{ROLE_BADGE[primaryRole]?.label || primaryRole}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Branch</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedBranchObj?.name || 'All Campuses'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Employee Code</span>
                    <span className="font-mono font-semibold text-purple-700 dark:text-purple-300">{employeeCode || '—'}</span>
                  </div>
                  {isTeacher && selectedClassroomObj && (
                    <div className="col-span-2">
                      <span className="text-[11px] text-gray-400 block">Assigned Classroom</span>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">{selectedClassroomObj.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
