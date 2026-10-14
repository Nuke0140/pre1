'use client'

import React, { useState, useEffect } from 'react'
import {
  Briefcase, Building, Mail, Phone, User, Shield, Check, Key,
  Calendar, GraduationCap, Sparkles, RefreshCw, Layers, Award,
  Clock, DoorOpen, UserCheck, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { Role, BranchOption, ClassroomOption, CANONICAL_STAFF_ROLES, ROLE_BADGE, BLOOD_GROUPS, MARITAL_STATUSES, LOCALES } from './types'
import { UserPhotoUpload } from './UserPhotoUpload'
import { Input } from '@/components/ui/input'

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
  const [maritalStatus, setMaritalStatus] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [locale, setLocale] = useState('en-IN')

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
  const [panNumber, setPanNumber] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [uanNumber, setUanNumber] = useState('')
  const [esiNumber, setEsiNumber] = useState('')
  const [noticePeriodDays, setNoticePeriodDays] = useState('')

  // Step 3: Account & Access
  const [credentialSetupMode, setCredentialSetupMode] = useState<'MANUAL' | 'INVITE'>('MANUAL')
  const [username, setUsername] = useState('')
  const [isUsernameCustom, setIsUsernameCustom] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE')

  // Auto-generate employee code on open if blank
  useEffect(() => {
    if (open) {
      if (!employeeCode) generateEmployeeCode()
      if (!branchId && branches.length > 0) setBranchId(branches[0].id)
    }
  }, [open, branches])

  // Check username availability with debounce
  useEffect(() => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      setUsernameAvailable(null)
      setUsernameError(null)
      setUsernameChecking(false)
      return
    }

    if (trimmed.length < 3) {
      setUsernameAvailable(false)
      setUsernameError('Username must be at least 3 characters')
      setUsernameChecking(false)
      return
    }

    if (!/^[a-z0-9._-]+$/.test(trimmed) || /^[._-]|[._-]$/.test(trimmed)) {
      setUsernameAvailable(false)
      setUsernameError('Can only contain lowercase letters, numbers, dots, hyphens, and underscores')
      setUsernameChecking(false)
      return
    }

    setUsernameChecking(true)
    setUsernameError(null)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/users/username?preferred=${encodeURIComponent(trimmed)}&type=STAFF`
        )
        const json = await res.json()
        if (json.success && json.data) {
          setUsernameAvailable(Boolean(json.data.isAvailable))
          if (!json.data.isAvailable) {
            setUsernameError(`Username "${trimmed}" is already taken`)
          } else {
            setUsernameError(null)
          }
        } else {
          setUsernameAvailable(null)
        }
      } catch {
        setUsernameAvailable(null)
      } finally {
        setUsernameChecking(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [username])

  // Auto-suggest username from fullName if not manually customized
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
    setConfirmPassword(pwd)
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
    setMaritalStatus('')
    setBloodGroup('')
    setEmergencyContactName('')
    setEmergencyContactPhone('')
    setCurrentAddress('')
    setPermanentAddress('')
    setLocale('en-IN')
    setCredentialSetupMode('MANUAL')
    setUsername('')
    setIsUsernameCustom(false)
    setUsernameChecking(false)
    setUsernameAvailable(null)
    setUsernameError(null)
    setPassword('')
    setConfirmPassword('')
    setShowConfirmPassword(false)
    setShowPassword(false)
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
    setPanNumber('')
    setAadhaarNumber('')
    setUanNumber('')
    setEsiNumber('')
    setNoticePeriodDays('')
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

  const validateStep3 = () => {
    const trimmedUser = username.trim().toLowerCase()

    if (credentialSetupMode === 'MANUAL') {
      if (!trimmedUser) {
        toast.error('Validation Error', 'Login Username is required for manual credential setup')
        return false
      }
      if (trimmedUser.length < 3 || trimmedUser.length > 30) {
        toast.error('Validation Error', 'Username must be between 3 and 30 characters')
        return false
      }
      if (!/^[a-z0-9._-]+$/.test(trimmedUser) || /^[._-]|[._-]$/.test(trimmedUser)) {
        toast.error('Validation Error', 'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores')
        return false
      }
      if (usernameAvailable === false) {
        toast.error('Validation Error', usernameError || `Username "${trimmedUser}" is already taken`)
        return false
      }
      if (!password || password.trim().length === 0) {
        toast.error('Validation Error', 'Password is required for manual credential setup')
        return false
      }
      if (password.length < 6) {
        toast.error('Validation Error', 'Password must be at least 6 characters long')
        return false
      }
      if (password !== confirmPassword) {
        toast.error('Validation Error', 'Passwords do not match. Please verify both password fields')
        return false
      }
    } else {
      // INVITE mode
      if (trimmedUser) {
        if (trimmedUser.length < 3 || trimmedUser.length > 30) {
          toast.error('Validation Error', 'Suggested username must be between 3 and 30 characters')
          return false
        }
        if (!/^[a-z0-9._-]+$/.test(trimmedUser) || /^[._-]|[._-]$/.test(trimmedUser)) {
          toast.error('Validation Error', 'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores')
          return false
        }
        if (usernameAvailable === false) {
          toast.error('Validation Error', usernameError || `Username "${trimmedUser}" is already taken`)
          return false
        }
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step !== 3) {
      handleNext()
      return
    }

    if (!validateStep1() || !validateStep2() || !validateStep3()) return

    setSubmitting(true)
    try {
      const allRoles: Role[] = [...new Set([primaryRole, ...additionalRoles])]
      const isInvite = credentialSetupMode === 'INVITE'
      const finalStatus = isInvite ? 'PENDING' : status

      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialSetupMode,
          isInvite,
          status: finalStatus,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          maritalStatus: maritalStatus || undefined,
          bloodGroup: bloodGroup || undefined,
          emergencyContactName: emergencyContactName.trim() || undefined,
          emergencyContactPhone: emergencyContactPhone.trim() || undefined,
          currentAddress: currentAddress.trim() || undefined,
          permanentAddress: permanentAddress.trim() || undefined,
<<<<<<< HEAD
          locale: locale || undefined,
          username: username.trim().toLowerCase() || undefined,
          password: !isInvite ? password : undefined,
=======
          locale: locale || 'en-IN',
          username: username.trim() || undefined,
          password: password.trim() || undefined,
>>>>>>> pr-6
          role: primaryRole,
          primaryRole,
          roles: allRoles,
          additionalRoles,
          branchId,
          employeeCode: employeeCode.trim(),
          designation: designation.trim(),
          department: department.trim() || undefined,
          employmentType,
          qualification: qualification.trim() || undefined,
          joiningDate: joiningDate || undefined,
          reportingManagerId: reportingManagerId || undefined,
          classroomId: isTeacher && classroomId ? classroomId : undefined,
          panNumber: panNumber.trim().toUpperCase() || undefined,
          aadhaarNumber: aadhaarNumber.trim() || undefined,
          uanNumber: uanNumber.trim() || undefined,
          esiNumber: esiNumber.trim() || undefined,
          noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        const errorMsg =
          typeof json.error === 'object'
            ? json.error?.message
            : typeof json.error === 'string'
            ? json.error
            : json.message || 'Failed to create staff account'
        throw new Error(errorMsg)
      }

      if (isInvite) {
        toast.success(
          'Staff Invitation Created',
          `${fullName} onboarded with Pending status. Invitation ready for credential setup.`
        )
      } else {
        toast.success(
          'Staff Member Onboarded',
          `${fullName} registered as ${ROLE_BADGE[primaryRole]?.label || primaryRole} (Username: @${json.data?.username || username.trim().toLowerCase()}).`
        )
      }
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
            disabled={submitting || (credentialSetupMode === 'MANUAL' && usernameAvailable === false)}
            className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-4 font-semibold shadow-xs"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Onboarding...</span>
              </>
            ) : credentialSetupMode === 'INVITE' ? (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>Send Staff Invitation</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Complete Onboarding &amp; Activate</span>
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

        <form
          id="add-staff-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && step < 3) {
              e.preventDefault()
              handleNext()
            }
          }}
          autoComplete="off"
        >
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
                    <div className="mt-1">
                      <Input
                        leadingIcon={<User className="w-4 h-4" />}
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        className="text-xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <Input
                        leadingIcon={<Mail className="w-4 h-4" />}
                        type="email"
                        required
                        placeholder="e.g. priya@preschool.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Mobile Phone
                    </label>
                    <div className="mt-1">
                      <Input
                        leadingIcon={<Phone className="w-4 h-4" />}
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="text-xs"
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
                    <div className="mt-1">
                      <Input
                        leadingIcon={<Calendar className="w-4 h-4" />}
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="text-xs"
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

                  {/* Marital Status */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Marital Status
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="select w-full text-xs mt-1"
                    >
                      <option value="">Select Status</option>
                      {MARITAL_STATUSES.map((ms) => (
                        <option key={ms} value={ms}>{ms}</option>
                      ))}
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="select w-full text-xs mt-1"
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Language / Locale */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Preferred Language
                    </label>
                    <select
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className="select w-full text-xs mt-1"
                    >
                      {LOCALES.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Emergency Contact Name */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Emergency Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Next of kin name"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="input w-full text-xs mt-1"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 00000"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="input w-full text-xs mt-1"
                    />
                  </div>

                  {/* Current Address */}
                  <div className="field sm:col-span-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Current Residential Address
                    </label>
                    <input
                      type="text"
                      placeholder="Street, locality, city and postal pin code"
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      className="input w-full text-xs mt-1"
                    />
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
                        onChange={(e) => {
                          setBranchId(e.target.value)
                          setClassroomId('')
                        }}
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
                    <div className="mt-1">
                      <Input
                        leadingIcon={<Award className="w-4 h-4" />}
                        type="text"
                        required
                        placeholder="e.g. Lead Teacher / Accounts Officer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="text-xs"
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
                    <div className="mt-1">
                      <Input
                        leadingIcon={<Calendar className="w-4 h-4" />}
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Qualification */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Qualification
                    </label>
                    <div className="mt-1">
                      <Input
                        leadingIcon={<GraduationCap className="w-4 h-4" />}
                        type="text"
                        placeholder="e.g. B.Ed, ECCEd, NTT"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* PAN Number */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      PAN Number (Tax ID)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="input w-full text-xs mt-1 uppercase font-mono"
                    />
                  </div>

                  {/* Aadhaar Number */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Aadhaar Number (12 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="123456789012"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      className="input w-full text-xs mt-1 font-mono"
                    />
                  </div>

                  {/* UAN & ESI */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      UAN (PF Universal Account)
                    </label>
                    <input
                      type="text"
                      placeholder="100000000000"
                      value={uanNumber}
                      onChange={(e) => setUanNumber(e.target.value)}
                      className="input w-full text-xs mt-1 font-mono"
                    />
                  </div>

                  {/* Notice Period (Days) */}
                  <div className="field">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Notice Period (Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      placeholder="30"
                      value={noticePeriodDays}
                      onChange={(e) => setNoticePeriodDays(e.target.value)}
                      className="input w-full text-xs mt-1 font-mono"
                    />
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
              {/* Credential Setup Mode Selector */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-3">
                <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Credential Setup Method <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCredentialSetupMode('MANUAL')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      credentialSetupMode === 'MANUAL'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-1 ring-purple-600'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${credentialSetupMode === 'MANUAL' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          Set Credentials Manually
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          Owner defines username &amp; password now
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCredentialSetupMode('INVITE')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      credentialSetupMode === 'INVITE'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-1 ring-purple-600'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${credentialSetupMode === 'INVITE' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          Send Email Invitation
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          Staff creates password via link (Pending)
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Path A: Manual Credential Setup */}
              {credentialSetupMode === 'MANUAL' && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-4">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Login Credentials &amp; Access
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div className="field sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Login Username <span className="text-red-500">*</span>
                        </label>
                        {usernameChecking && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 border border-purple-600 border-t-transparent rounded-full animate-spin" />
                            Checking availability...
                          </span>
                        )}
                        {!usernameChecking && usernameAvailable === true && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Available
                          </span>
                        )}
                        {!usernameChecking && usernameAvailable === false && (
                          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {usernameError || 'Not available'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <div className="flex-1">
                          <Input
                            leadingIcon={<span className="text-xs font-mono text-gray-400">@</span>}
                            type="text"
                            required
                            placeholder="priya.sharma"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value)
                              setIsUsernameCustom(true)
                            }}
                            className={`text-xs font-mono ${
                              usernameAvailable === false ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUsernameCustom(false)
                            handleFullNameChange(fullName)
                          }}
                          className="btn btn-secondary text-xs px-2.5 py-1"
                          title="Generate from staff name"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Used to sign in across web &amp; mobile apps. Letters, numbers, dots, hyphens, underscores.
                      </p>
                    </div>

                    {/* Initial Password */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 mt-1">
                        <div className="flex-1">
                          <Input
                            leadingIcon={<Key className="w-4 h-4" />}
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-xs font-mono"
                            trailingAction={
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            }
                          />
                        </div>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="btn btn-secondary text-xs px-2.5 py-1"
                          title="Generate secure password"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="field">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <Input
                          leadingIcon={<Key className="w-4 h-4" />}
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-type password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`text-xs font-mono ${
                            confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                          }`}
                          trailingAction={
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          }
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <span className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> Passwords do not match
                        </span>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> Passwords match
                        </span>
                      )}
                    </div>

                    {/* Account Status */}
                    <div className="field sm:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Initial Account Status
                      </label>
                      <div className="flex items-center gap-4 mt-1.5">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={status === 'ACTIVE'}
                            onChange={() => setStatus('ACTIVE')}
                          />
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Active (Immediate Sign In)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={status === 'PENDING'}
                            onChange={() => setStatus('PENDING')}
                          />
                          <span className="text-amber-700 dark:text-amber-400">
                            Pending (Manual Activation Later)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Path B: Invitation Flow */}
              {credentialSetupMode === 'INVITE' && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                    <Mail className="w-4 h-4" />
                    <span>Staff Invitation &amp; Deferred Setup</span>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    An onboarding invitation will be queued for <strong>{email || 'the provided work email'}</strong>. The staff member will be prompted to set their own password upon first access.
                  </p>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                    <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      Security Policy Enforced:
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      The account is created with <strong>PENDING</strong> status. Login is strictly blocked until the invitation is accepted and credentials are validly saved.
                    </p>
                  </div>

                  <div className="field pt-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Suggested Username (Optional)
                    </label>
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <Input
                          leadingIcon={<span className="text-xs font-mono text-gray-400">@</span>}
                          type="text"
                          placeholder="priya.sharma"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value)
                            setIsUsernameCustom(true)
                          }}
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
