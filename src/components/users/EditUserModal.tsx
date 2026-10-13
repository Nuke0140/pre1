'use client'

import React, { useState, useEffect } from 'react'
import {
  User, Phone, Building, Briefcase, Shield, Key, Camera, Trash2,
  Mail, Calendar, Award, HeartHandshake, FileText, Lock, Globe,
  CheckCircle2, AlertCircle, Baby, Users, MapPin, UserCheck
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import {
  Role, UserLifecycleStatus, BranchOption, ClassroomOption, UserRecord,
  CANONICAL_STAFF_ROLES, CANONICAL_FAMILY_ROLES, CANONICAL_RELATIONSHIPS,
  BLOOD_GROUPS, GENDERS, MARITAL_STATUSES, EMPLOYMENT_TYPES, LOCALES,
  ROLE_BADGE
} from './types'
import { useI18n } from '@/lib/i18n'

interface EditUserModalProps {
  open: boolean
  onClose: () => void
  user: UserRecord | null
  branches: BranchOption[]
  classrooms?: ClassroomOption[]
  onSuccess: () => void
}

export function EditUserModal({
  open,
  onClose,
  user,
  branches,
  classrooms = [],
  onSuccess,
}: EditUserModalProps) {
  const toast = useToast()
  const { t } = useI18n()
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [availableClassrooms, setAvailableClassrooms] = useState<ClassroomOption[]>(classrooms)

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('basic')

  // Common User Identity Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [locale, setLocale] = useState('en')
  const [role, setRole] = useState<Role>('TEACHER')
  const [additionalRoles, setAdditionalRoles] = useState<Role[]>([])
  const [status, setStatus] = useState<UserLifecycleStatus>('ACTIVE')
  const [branchId, setBranchId] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Staff Profile Fields
  const [employeeCode, setEmployeeCode] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')
  const [qualification, setQualification] = useState('')
  const [employmentType, setEmploymentType] = useState('FULL_TIME')
  const [joiningDate, setJoiningDate] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [uanNumber, setUanNumber] = useState('')
  const [esiNumber, setEsiNumber] = useState('')
  const [probationEndDate, setProbationEndDate] = useState('')
  const [confirmationDate, setConfirmationDate] = useState('')
  const [noticePeriodDays, setNoticePeriodDays] = useState('')
  const [classroomId, setClassroomId] = useState('')

  // Guardian Profile Fields
  const [relationship, setRelationship] = useState('FATHER')
  const [occupation, setOccupation] = useState('')
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)
  const [pickupPin, setPickupPin] = useState('')
  const [canPickup, setCanPickup] = useState(true)
  const [receivesComm, setReceivesComm] = useState(true)

  // Fetch classrooms if not provided
  useEffect(() => {
    if (classrooms && classrooms.length > 0) {
      setAvailableClassrooms(classrooms)
    } else if (open) {
      fetch('/api/v1/classrooms')
        .then((res) => res.json())
        .then((json) => {
          if (json.data || json.items) {
            setAvailableClassrooms(json.data || json.items)
          }
        })
        .catch(() => {})
    }
  }, [open, classrooms])

  // Prepopulate all fields on open
  useEffect(() => {
    if (user && open) {
      setFullName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setUsername(user.username || '')
      setLocale(user.locale || 'en')
      setRole(user.role)
      setAdditionalRoles(user.roles ? user.roles.filter((r) => r !== user.role) : [])
      setStatus(user.status)
      setBranchId(user.branchId || '')
      setAvatarUrl(user.avatarUrl || null)
      setNewPassword('')

      const isStaffUser = !['PARENT', 'GUARDIAN'].includes(user.role)
      setActiveTab(isStaffUser ? 'basic' : 'caregiver')

      if (isStaffUser) {
        const sp = user.staffProfile
        setEmployeeCode(sp?.employeeCode || '')
        setDesignation(sp?.designation || '')
        setDepartment(sp?.department || '')
        setQualification(sp?.qualification || '')
        setEmploymentType(sp?.employmentType || 'FULL_TIME')
        setJoiningDate(sp?.joiningDate ? sp.joiningDate.slice(0, 10) : '')
        setDateOfBirth(sp?.dateOfBirth ? sp.dateOfBirth.slice(0, 10) : '')
        setGender(sp?.gender || '')
        setMaritalStatus(sp?.maritalStatus || '')
        setBloodGroup(sp?.bloodGroup || '')
        setEmergencyContactName(sp?.emergencyContactName || '')
        setEmergencyContactPhone(sp?.emergencyContactPhone || '')
        setCurrentAddress(sp?.currentAddress || '')
        setPermanentAddress(sp?.permanentAddress || '')
        setPanNumber(sp?.panNumber || '')
        setAadhaarNumber(sp?.aadhaarNumber || '')
        setUanNumber(sp?.uanNumber || '')
        setEsiNumber(sp?.esiNumber || '')
        setProbationEndDate(sp?.probationEndDate ? sp.probationEndDate.slice(0, 10) : '')
        setConfirmationDate(sp?.confirmationDate ? sp.confirmationDate.slice(0, 10) : '')
        setNoticePeriodDays(sp?.noticePeriodDays != null ? String(sp.noticePeriodDays) : '')
        setClassroomId(user.taughtClasses?.[0]?.id || '')
      } else {
        const gp = user.guardianProfile
        setRelationship(gp?.relationship || 'FATHER')
        setOccupation(gp?.occupation || '')
        setIsPrimaryContact(Boolean(gp?.isPrimaryContact))
        setPickupPin('')
        const firstStudent = gp?.students?.[0]
        setCanPickup(firstStudent?.canPickup ?? true)
        setReceivesComm(firstStudent?.receivesComm ?? true)
      }
    }
  }, [user, open])

  if (!user) return null

  const isStaff = !['PARENT', 'GUARDIAN'].includes(role)
  const isFamily = ['PARENT', 'GUARDIAN'].includes(role)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const userId = user.userId || user.id
    const formData = new FormData()
    formData.append('file', file)

    setUploadingPhoto(true)
    try {
      const res = await fetch(`/api/v1/users/${userId}/photo`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Photo upload failed')
      }
      setAvatarUrl(json.data.avatarUrl)
      toast.success('Photo Uploaded', 'User profile photo updated successfully')
      onSuccess()
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Failed to upload profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    const userId = user.userId || user.id
    setUploadingPhoto(true)
    try {
      const res = await fetch(`/api/v1/users/${userId}/photo`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Photo removal failed')
      }
      setAvatarUrl(null)
      toast.success('Photo Removed', 'User profile photo removed successfully')
      onSuccess()
    } catch (err: any) {
      toast.error('Removal Error', err.message || 'Failed to remove profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const toggleAdditionalRole = (r: Role) => {
    if (r === role) return
    setAdditionalRoles((prev) =>
      prev.includes(r) ? prev.filter((item) => item !== r) : [...prev, r]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast.error('Name Required', 'User full name cannot be blank')
      return
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Password Validation', 'New password must be at least 6 characters')
      return
    }

    if (pickupPin && !/^\d{4,6}$/.test(pickupPin.trim())) {
      toast.error('Invalid PIN', 'Pickup PIN must be between 4 and 6 digits')
      return
    }

    setSubmitting(true)
    try {
      const allRoles: Role[] = [...new Set([role, ...additionalRoles])]

      const payload: Record<string, any> = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase() || null,
        phone: phone.trim() || null,
        username: username.trim() || null,
        locale: locale || 'en',
        role,
        primaryRole: role,
        roles: allRoles,
        status,
        branchId: branchId || null,
      }

      if (newPassword && newPassword.length >= 6) {
        payload.password = newPassword
      }

      if (isStaff) {
        payload.employeeCode = employeeCode.trim() || null
        payload.designation = designation.trim() || null
        payload.department = department.trim() || null
        payload.qualification = qualification.trim() || null
        payload.employmentType = employmentType || 'FULL_TIME'
        payload.joiningDate = joiningDate || null
        payload.dateOfBirth = dateOfBirth || null
        payload.gender = gender || null
        payload.maritalStatus = maritalStatus || null
        payload.bloodGroup = bloodGroup || null
        payload.emergencyContactName = emergencyContactName.trim() || null
        payload.emergencyContactPhone = emergencyContactPhone.trim() || null
        payload.currentAddress = currentAddress.trim() || null
        payload.permanentAddress = permanentAddress.trim() || null
        payload.panNumber = panNumber.trim().toUpperCase() || null
        payload.aadhaarNumber = aadhaarNumber.trim() || null
        payload.uanNumber = uanNumber.trim() || null
        payload.esiNumber = esiNumber.trim() || null
        payload.probationEndDate = probationEndDate || null
        payload.confirmationDate = confirmationDate || null
        payload.noticePeriodDays = noticePeriodDays ? Number(noticePeriodDays) : null
        payload.classroomId = classroomId || null
      }

      if (isFamily) {
        payload.relationship = relationship
        payload.occupation = occupation.trim() || null
        payload.isPrimaryContact = isPrimaryContact
        if (pickupPin.trim()) {
          payload.pickupPin = pickupPin.trim()
        }
        payload.canPickup = canPickup
        payload.receivesComm = receivesComm
      }

      const res = await fetch(`/api/v1/users/${user.userId || user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to update user profile')
      }

      toast.success('User Profile Updated', `Successfully updated profile for ${fullName}.`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Error occurred while saving profile changes')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter classrooms by branch
  const filteredClassrooms = availableClassrooms.filter(
    (c) => !branchId || !c.branchId || c.branchId === branchId
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('users.editUserTitle') || 'Edit User Profile'}
      subtitle={`Complete profile management for ${user.name}`}
      icon={<User className="w-5 h-5 text-indigo-600" />}
      iconClass="ic-purple"
      wide
      maxWidth="760px"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Role: <span className="font-semibold text-foreground">{role}</span> • Status: <span className="font-semibold text-foreground">{status}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary text-xs"
              onClick={onClose}
              disabled={submitting}
            >
              {t('users.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              form="edit-user-form"
              className="btn btn-primary text-xs"
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : (t('users.saveUser') || 'Save Changes')}
            </button>
          </div>
        </div>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Summary Strip */}
        <div className="flex items-center gap-4 p-3 rounded-xl border border-border/80 bg-muted/30">
          <div className="relative group shrink-0">
            <Avatar name={fullName || user.name} src={avatarUrl} size="lg" />
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                ...
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground truncate">{fullName || user.name}</span>
              <span className={`badge ${ROLE_BADGE[role]?.cls || 'b-neutral'} text-[10px]`}>
                {ROLE_BADGE[role]?.label || role}
              </span>
              <span className="badge b-neutral font-mono text-[10px]">{status}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              JPG, PNG, WEBP or GIF up to 5MB. Photo updates apply immediately.
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="btn btn-xs btn-outline flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="btn btn-xs btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border text-xs font-medium gap-2 sm:gap-4 overflow-x-auto pb-px">
          {isStaff ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'basic'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Basic & Identity</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('work')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'work'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Work & Role</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Personal & Emergency</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('statutory')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'statutory'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Statutory & HR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Security & Access</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('caregiver')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'caregiver'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>Caregiver Details</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('access')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'access'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Campus & Pickup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`pb-2 px-1 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Security & Access</span>
              </button>
            </>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1 (STAFF): BASIC & IDENTITY */}
        {/* ────────────────────────────────────────────────────────── */}
        {isStaff && activeTab === 'basic' && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative input-icon-wrap">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g. Eleanor Vance"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Work Email Address
                </label>
                <div className="relative input-icon-wrap">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full text-sm font-mono"
                    placeholder="eleanor@preschool.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative input-icon-wrap">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input w-full text-sm font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Username / Login ID
                </label>
                <div className="relative input-icon-wrap">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs pointer-events-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input w-full text-sm font-mono"
                    placeholder="eleanor.vance"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Preferred Language / Locale
                </label>
                <div className="relative input-icon-wrap">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="select w-full text-sm"
                  >
                    {LOCALES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2 (STAFF): WORK & ROLE */}
        {/* ────────────────────────────────────────────────────────── */}
        {isStaff && activeTab === 'work' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Primary Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="select w-full text-sm"
                >
                  {CANONICAL_STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_BADGE[r]?.label || r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Campus Branch Assignment
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="select w-full text-sm"
                >
                  <option value="">Central / All Campuses</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Roles Multi-Select */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Additional / Secondary Roles (Multi-Role Permission Scoping)
              </label>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-border bg-muted/20">
                {CANONICAL_STAFF_ROLES.filter((r) => r !== role).map((r) => {
                  const selected = additionalRoles.includes(r)
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleAdditionalRole(r)}
                      className={`btn btn-xs ${selected ? 'btn-primary' : 'btn-outline'} text-[11px]`}
                    >
                      {selected && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {ROLE_BADGE[r]?.label || r}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="input w-full text-sm font-mono"
                  placeholder="EMP-2026-101"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Job Designation / Title
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g. Head Teacher"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g. Academics"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="select w-full text-sm"
                >
                  {EMPLOYMENT_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Assigned Classroom
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="select w-full text-sm"
                >
                  <option value="">No Classroom Assigned</option>
                  {filteredClassrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.programType ? `(${c.programType})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3 (STAFF): PERSONAL & EMERGENCY */}
        {/* ────────────────────────────────────────────────────────── */}
        {isStaff && activeTab === 'personal' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="select w-full text-sm"
                >
                  <option value="">Unspecified</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="select w-full text-sm"
                >
                  <option value="">Unspecified</option>
                  {MARITAL_STATUSES.map((ms) => (
                    <option key={ms} value={ms}>{ms}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="select w-full text-sm"
                >
                  <option value="">Unspecified</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <div className="sm:col-span-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Emergency Contact Details
                </span>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g. Spouse / Relative Name"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Contact Mobile Phone
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="input w-full text-sm font-mono"
                  placeholder="+91 98765 00000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Current Residential Address
                </label>
                <textarea
                  rows={2}
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  className="input w-full text-sm resize-none"
                  placeholder="House, Street, Area, City & PIN code"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Permanent Address
                </label>
                <textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="input w-full text-sm resize-none"
                  placeholder="Permanent / Native home address"
                />
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 4 (STAFF): STATUTORY & HR */}
        {/* ────────────────────────────────────────────────────────── */}
        {isStaff && activeTab === 'statutory' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  PAN Number (Statutory Tax ID)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="input w-full text-sm font-mono uppercase"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Aadhaar Number (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                  className="input w-full text-sm font-mono"
                  placeholder="123456789012"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  UAN (Universal Account No. / PF)
                </label>
                <input
                  type="text"
                  value={uanNumber}
                  onChange={(e) => setUanNumber(e.target.value)}
                  className="input w-full text-sm font-mono"
                  placeholder="100000000000"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  ESI Number (State Insurance)
                </label>
                <input
                  type="text"
                  value={esiNumber}
                  onChange={(e) => setEsiNumber(e.target.value)}
                  className="input w-full text-sm font-mono"
                  placeholder="31000000000000000"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Educational & Professional Qualifications
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="input w-full text-sm"
                placeholder="e.g. M.Ed, Montessori Certified, B.A. English"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Probation End Date
                </label>
                <input
                  type="date"
                  value={probationEndDate}
                  onChange={(e) => setProbationEndDate(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Confirmation Date
                </label>
                <input
                  type="date"
                  value={confirmationDate}
                  onChange={(e) => setConfirmationDate(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(e.target.value)}
                  className="input w-full text-sm font-mono"
                  placeholder="30"
                />
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1 (FAMILY): CAREGIVER DETAILS */}
        {/* ────────────────────────────────────────────────────────── */}
        {isFamily && activeTab === 'caregiver' && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Caregiver Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative input-icon-wrap">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g. David Miller"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative input-icon-wrap">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full text-sm font-mono"
                    placeholder="david.m@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative input-icon-wrap">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input w-full text-sm font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Relationship to Child <span className="text-red-500">*</span>
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="select w-full text-sm"
                >
                  {CANONICAL_RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Profession / Occupation
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g. Software Architect"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Language / Locale
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="select w-full text-sm"
                >
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground text-xs block">
                  Primary Emergency Contact
                </span>
                <span className="text-[11px] text-muted-foreground">
                  First caregiver contacted during emergencies, health alerts, or unnotified student absences.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPrimaryContact}
                onChange={(e) => setIsPrimaryContact(e.target.checked)}
                className="checkbox checkbox-primary h-4 w-4 rounded"
              />
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2 (FAMILY): CAMPUS & PICKUP */}
        {/* ────────────────────────────────────────────────────────── */}
        {isFamily && activeTab === 'access' && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Campus Branch Association
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="select w-full text-sm"
              >
                <option value="">Central / All Campuses</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5 text-primary" /> Gate Pickup Verification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background">
                  <div>
                    <span className="font-medium text-foreground block">Authorized to Pickup</span>
                    <span className="text-[10px] text-muted-foreground">Permits scanning at school gate</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canPickup}
                    onChange={(e) => setCanPickup(e.target.checked)}
                    className="checkbox checkbox-primary h-4 w-4 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background">
                  <div>
                    <span className="font-medium text-foreground block">Receives Communications</span>
                    <span className="text-[10px] text-muted-foreground">SMS, WhatsApp &amp; In-app notices</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={receivesComm}
                    onChange={(e) => setReceivesComm(e.target.checked)}
                    className="checkbox checkbox-primary h-4 w-4 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">
                  Change Pickup PIN (4 to 6 Digits)
                </label>
                <div className="relative input-icon-wrap">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pickupPin}
                    onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, ''))}
                    className="input w-full text-sm font-mono tracking-widest"
                    placeholder="Leave blank to preserve existing security PIN"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Linked Children List Display */}
            {user.guardianProfile?.students && user.guardianProfile.students.length > 0 && (
              <div className="space-y-2">
                <span className="font-semibold text-muted-foreground uppercase text-[11px] block">
                  Linked Enrolled Children ({user.guardianProfile.students.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {user.guardianProfile.students.map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-lg border border-border/70 bg-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Baby className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground text-xs">{st.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                            Adm #{st.admissionNo}
                          </span>
                        </div>
                      </div>
                      <span className={`badge ${st.canPickup ? 'b-success' : 'b-neutral'} text-[10px]`}>
                        {st.canPickup ? 'Pickup Active' : 'Pickup Blocked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB (COMMON): SECURITY & STATUS */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-foreground mb-1">
                  Account Lifecycle Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as UserLifecycleStatus)}
                  className="select w-full text-sm font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Authorized Full Access)</option>
                  <option value="PENDING">PENDING (Awaiting Activation)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
                  <option value="LOCKED">LOCKED (Exceeded Failed Logins)</option>
                  <option value="DEACTIVATED">DEACTIVATED (Offboarded)</option>
                  <option value="ARCHIVED">ARCHIVED (Historical Record)</option>
                </select>
              </div>

              {isFamily && (
                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Family Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="select w-full text-sm"
                  >
                    {CANONICAL_FAMILY_ROLES.map((fr) => (
                      <option key={fr} value={fr}>{fr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
              <label className="block font-semibold text-foreground">
                Reset Login Password
              </label>
              <div className="text-[11px] text-muted-foreground">
                Leave blank to keep the current password. If entering a new password, it must be at least 6 characters.
              </div>
              <div className="relative input-icon-wrap mt-1">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="password"
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full text-sm font-mono"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Audit &amp; Security Policy</span>
              <p>
                All profile updates are recorded in the immutable audit trail. Changing an account status to SUSPENDED, DEACTIVATED or LOCKED instantly terminates any active login sessions.
              </p>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
