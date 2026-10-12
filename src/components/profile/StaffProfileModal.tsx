'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Phone, Building, Briefcase, Shield, KeyRound,
  CheckCircle2, Clock, Calendar, Edit3, Camera, Trash2,
  Lock, AlertCircle, RefreshCw, X, Sparkles, HeartPulse, MapPin
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { ROLE_BADGE } from '@/components/users/types'
import { normalizeRole } from '@/lib/roles'
import { fmtDateTime, timeAgo, fmtDate } from '@/lib/format'
import { useI18n } from '@/lib/i18n'

interface StaffProfileModalProps {
  open: boolean
  onClose: () => void
  onProfileUpdated?: (updatedData?: { name?: string; avatarUrl?: string | null }) => void
}

interface ProfileData {
  id: string
  userId: string
  fullName: string
  username?: string | null
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
  role: string
  roles: string[]
  status: string
  tenantId?: string | null
  tenantName?: string | null
  tenantCode?: string | null
  branchId?: string | null
  branchName?: string | null
  lastLoginAt?: string | null
  createdAt?: string | null
  staffProfile?: {
    id: string
    employeeCode: string
    designation?: string | null
    department?: string | null
    qualification?: string | null
    joiningDate?: string | null
    employmentType?: string | null
    emergencyContactName?: string | null
    emergencyContactPhone?: string | null
    currentAddress?: string | null
    permanentAddress?: string | null
    bloodGroup?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    status?: string | null
  } | null
}

const BLOOD_GROUPS = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
]

export function StaffProfileModal({ open, onClose, onProfileUpdated }: StaffProfileModalProps) {
  const toast = useToast()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EDIT'>('OVERVIEW')

  // Edit form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')
  const [permanentAddress, setPermanentAddress] = useState('')
  const [qualification, setQualification] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [saving, setSaving] = useState(false)

  // Photo states
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const clearPhotoSelection = () => {
    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl)
    }
    setSelectedPhotoFile(null)
    setPhotoPreviewUrl(null)
  }

  const populateForm = (data: ProfileData) => {
    setFullName(data.fullName || '')
    setPhone(data.phone || '')
    setEmergencyName(data.staffProfile?.emergencyContactName || '')
    setEmergencyPhone(data.staffProfile?.emergencyContactPhone || '')
    setCurrentAddress(data.staffProfile?.currentAddress || '')
    setPermanentAddress(data.staffProfile?.permanentAddress || '')
    setQualification(data.staffProfile?.qualification || '')
    setBloodGroup(data.staffProfile?.bloodGroup || '')
  }

  // Load profile data
  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/profile')
      const json = await res.json()
      if (json.success && json.data) {
        setProfile(json.data)
        populateForm(json.data)
      } else {
        toast.error('Error', json.error?.message || 'Failed to load profile')
      }
    } catch {
      toast.error('Network Error', 'Could not retrieve profile information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false
    // Asynchronous fetch prevents synchronous setState in effect body
    fetch('/api/v1/profile')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success && json.data) {
          setProfile(json.data)
          populateForm(json.data)
        } else {
          toast.error('Error', json.error?.message || 'Failed to load profile')
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Network Error', 'Could not retrieve profile information')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  // Handle Photo selection & instant preview
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid Format', 'Please choose a JPG, PNG, or WebP photo')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum photo size is 5MB')
      return
    }

    setSelectedPhotoFile(file)
    const objUrl = URL.createObjectURL(file)
    setPhotoPreviewUrl(objUrl)
  }

  // Upload selected photo
  const handleSavePhoto = async () => {
    if (!selectedPhotoFile) return
    setUploadingPhoto(true)

    try {
      const formData = new FormData()
      formData.append('photo', selectedPhotoFile)

      const res = await fetch('/api/v1/profile/photo', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Photo upload failed')
      }

      const newAvatar = json.data?.avatarUrl || json.avatarUrl
      setProfile((prev) => (prev ? { ...prev, avatarUrl: newAvatar } : null))
      toast.success('Photo Updated', 'Your profile photo has been saved successfully')
      clearPhotoSelection()
      onProfileUpdated?.({ avatarUrl: newAvatar })
    } catch (err: any) {
      toast.error('Upload Error', err.message || 'Failed to update photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Remove photo
  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return
    setUploadingPhoto(true)

    try {
      const res = await fetch('/api/v1/profile/photo', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Photo removal failed')
      }

      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : null))
      clearPhotoSelection()
      toast.success('Photo Removed', 'Profile picture removed')
      onProfileUpdated?.({ avatarUrl: null })
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not remove photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Submit personal details update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Name Required', 'Full name cannot be blank')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        emergencyContactName: emergencyName.trim() || null,
        emergencyContactPhone: emergencyPhone.trim() || null,
        currentAddress: currentAddress.trim() || null,
        permanentAddress: permanentAddress.trim() || null,
        qualification: qualification.trim() || null,
        bloodGroup: bloodGroup || null,
      }

      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Update failed')
      }

      toast.success('Profile Updated', 'Your personal details have been saved')
      await loadProfile()
      setActiveTab('OVERVIEW')
      onProfileUpdated?.({ name: fullName.trim() })
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not save profile changes')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const normRole = profile ? normalizeRole(profile.role) : 'STAFF'
  const badge = ROLE_BADGE[normRole] || { cls: 'b-neutral', label: profile?.role || 'Staff' }
  const currentAvatar = photoPreviewUrl || profile?.avatarUrl || null

  return (
    <Modal
      open={open}
      onClose={() => {
        clearPhotoSelection()
        onClose()
      }}
      title="My Profile"
      subtitle="View and manage your staff personal profile and account credentials"
      icon={<User className="w-5 h-5 text-indigo-600" />}
      iconClass="ic-purple"
      wide
    >
      <div className="space-y-5">
        {/* Profile Card Header Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50/40 dark:from-gray-900 dark:to-indigo-950/20 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar name={profile?.fullName || 'User'} src={currentAvatar} size="lg" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-semibold cursor-pointer border-0"
                title="Change Photo"
                aria-label="Change profile photo"
              >
                <Camera size={16} />
                <span>Change</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {profile?.fullName || 'Loading...'}
                </h3>
                <span className={`badge ${badge.cls} text-xs font-semibold`}>
                  {badge.label}
                </span>
                {profile?.staffProfile?.employeeCode && (
                  <span className="badge b-neutral text-xs font-mono">
                    EMP: {profile.staffProfile.employeeCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-mono flex-wrap">
                <span>@{profile?.username || profile?.email?.split('@')[0] || 'staff'}</span>
                <span>•</span>
                <span>{profile?.email}</span>
                {profile?.branchName && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium">
                      {profile.branchName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-1.5 border-t sm:border-0 pt-2 sm:pt-0 border-gray-200 dark:border-gray-800">
            <StatusBadge status={profile?.status || 'ACTIVE'} />
            <span className="text-[11px] text-gray-400">
              Last Login: {profile?.lastLoginAt ? timeAgo(profile.lastLoginAt) : 'Active now'}
            </span>
          </div>
        </div>

        {/* Photo Upload Confirmation / Staging Banner */}
        {photoPreviewUrl && (
          <div className="p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Camera size={18} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-gray-900 dark:text-white">
                  New photo selected for preview.
                </span>
                <span className="text-gray-500 ml-1">
                  Click save to persist this image to your profile.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearPhotoSelection}
                className="btn btn-ghost btn-sm text-xs"
                disabled={uploadingPhoto}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={uploadingPhoto}
                className="btn btn-primary btn-sm text-xs font-medium"
              >
                {uploadingPhoto ? 'Saving...' : 'Save Photo'}
              </button>
            </div>
          </div>
        )}

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 text-xs font-semibold gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <User size={14} />
            Profile Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EDIT')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'EDIT'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Edit3 size={14} />
            Edit Personal Details
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-gray-500 font-medium">
                Personal identity and verified school employment details
              </span>
              <div className="flex items-center gap-2">
                {profile?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="btn btn-ghost btn-sm text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={13} className="mr-1" />
                    Remove Photo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-ghost btn-sm text-xs text-indigo-600 dark:text-indigo-400"
                >
                  <Camera size={13} className="mr-1" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('EDIT')}
                  className="btn btn-primary btn-sm text-xs font-medium"
                >
                  <Edit3 size={13} className="mr-1" />
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Personal Contact & Profile */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <User size={14} className="text-indigo-500" />
                  Personal Information
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Full Name</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.fullName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Email Address</span>
                    <span className="font-mono text-gray-900 dark:text-white flex items-center gap-1.5">
                      {profile?.email || '—'}
                      <span title="Verified Account"><CheckCircle2 size={13} className="text-emerald-500" /></span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Mobile Phone</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.phone || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Qualification</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.qualification || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Blood Group</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.bloodGroup?.replace('_', ' ') || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Emergency Contact</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.emergencyContactName
                        ? `${profile.staffProfile.emergencyContactName} (${profile.staffProfile.emergencyContactPhone || 'No phone'})`
                        : 'None'}
                    </span>
                  </div>
                  <div className="py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500 block mb-1">Current Address</span>
                    <span className="text-gray-800 dark:text-gray-200 block text-[11.5px] leading-relaxed">
                      {profile?.staffProfile?.currentAddress || 'No current address provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Institutional & Employment Record (Protected) */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    <Briefcase size={14} className="text-indigo-500" />
                    Employment &amp; Campus Record
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded font-medium">
                    <Lock size={10} />
                    Administrative Scope
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Staff Role</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">School Institution</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.tenantName || 'PreOne School'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Assigned Campus</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.branchName || 'Main Campus'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Employee Code</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.employeeCode || 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Department</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.department || 'Academics & Operations'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Designation</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.designation || badge.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Employment Type</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.employmentType || 'FULL_TIME'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-gray-500">Date of Joining</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {profile?.staffProfile?.joiningDate
                        ? fmtDate(profile.staffProfile.joiningDate)
                        : 'On Record'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'EDIT' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Protected Field Notice */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Lock size={15} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Institutional assignments are protected:</span>
                <span className="ml-1">
                  Your official Role, Employee Code, Branch Assignment, and Account Status are managed centrally by School Administration. Contact your principal or admin to request updates to institutional records.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. Meera Iyer"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mobile / Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Qualification / Education
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. B.Ed, M.Sc Early Childhood"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg.value} value={bg.value}>
                      {bg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. Spouse / Parent Name"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. +91 98765 43211"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Current Residential Address
                </label>
                <textarea
                  rows={2}
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  className="input w-full"
                  placeholder="Apartment, Street, Locality, City, Pincode"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Permanent Address
                </label>
                <textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="input w-full"
                  placeholder="Permanent / Native address"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  if (profile) populateForm(profile)
                  setActiveTab('OVERVIEW')
                }}
                className="btn btn-ghost text-xs"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary text-xs font-semibold px-4"
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
