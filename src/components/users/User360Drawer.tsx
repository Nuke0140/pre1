'use client'

import React, { useState } from 'react'
import {
  User, Mail, Phone, Building, Briefcase, Baby, Shield, KeyRound,
  Lock, CheckCircle2, XCircle, Clock, Calendar, Edit3, ShieldAlert,
  FileText, Download, Trash2, Eye, RefreshCw, Globe, MapPin,
  HeartHandshake, GraduationCap, Award, Hash, Check
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { PdfViewerModal } from '@/components/preone/PdfViewerModal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { UserRecord, ROLE_BADGE, LOCALES } from './types'
import { normalizeRole } from '@/lib/roles'
import { fmtDateTime, timeAgo, fmtDate } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { PhotoUploadModal } from './PhotoUploadModal'

interface User360DrawerProps {
  open: boolean
  onClose: () => void
  user: UserRecord | null
  onEdit?: (user: UserRecord) => void
  onStatusChange?: (user: UserRecord) => void
}

function maskAadhaar(aadhaar?: string | null) {
  if (!aadhaar) return 'Not recorded'
  const clean = aadhaar.replace(/\D/g, '')
  if (clean.length < 4) return '••••'
  return `•••• •••• ${clean.slice(-4)}`
}

function fmtLocalDate(d?: string | null) {
  if (!d) return 'Not recorded'
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}

export function User360Drawer({ open, onClose, user, onEdit, onStatusChange }: User360DrawerProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RELATIONSHIPS' | 'SECURITY' | 'DOCUMENTS'>('OVERVIEW')
  const [staffDocuments, setStaffDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)

  React.useEffect(() => {
    if (user) {
      setUserAvatarUrl(user.avatarUrl || null)
    }
  }, [user])

  const loadDocuments = React.useCallback(async () => {
    if (!user) return
    const entityId = (user as any).staffProfileId || (user.staffProfile as any)?.id || user.userId || user.id
    try {
      setLoadingDocs(true)
      const res = await fetch(`/api/v1/documents/profile?entityType=STAFF&entityId=${entityId}`).then((r) => r.json())
      if (res.success) {
        setStaffDocuments(res.data || [])
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingDocs(false)
    }
  }, [user])

  React.useEffect(() => {
    if (open && activeTab === 'DOCUMENTS') {
      loadDocuments()
    }
  }, [open, activeTab, loadDocuments])

  const handleDeleteDoc = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      const res = await fetch(`/api/v1/documents/profile?id=${docId}`, { method: 'DELETE' }).then((r) => r.json())
      if (res.success) {
        loadDocuments()
      }
    } catch {
      // Non-blocking
    }
  }

  if (!user) return null

  const isStaff = !['PARENT', 'GUARDIAN'].includes(normalizeRole(user.role))
  const isFamily = ['PARENT', 'GUARDIAN'].includes(normalizeRole(user.role))
  const badge = ROLE_BADGE[normalizeRole(user.role)] || { cls: 'b-neutral', label: user.role }
  const localeLabel = LOCALES.find((l) => l.value === user.locale)?.label || user.locale || 'English (en)'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('users.user360Title') || 'User Profile (360° View)'}
      subtitle={`Unified identity & access overview for ${user.name}`}
      wide
      maxWidth="780px"
    >
      <div className="space-y-4">
        {/* Header Profile Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 border border-gray-200 dark:border-gray-800 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer" onClick={() => setPhotoModalOpen(true)}>
              <Avatar name={user.name} src={userAvatarUrl} size="lg" />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold">
                Change
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{user.name}</h3>
                <span className={`badge ${badge.cls} text-xs font-semibold`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-mono flex-wrap">
                <span>@{user.username || user.email?.split('@')[0] || 'user'}</span>
                <span>•</span>
                <span>User ID: {user.userId.slice(-8)}</span>
                <span>•</span>
                <span>{localeLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={user.status} />
            <span className="text-[11px] text-gray-400">
              Active: {user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Never'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 text-xs font-semibold gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-2 transition-colors whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t('users.tabOverview') || 'Overview & Contact'}
          </button>
          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab('RELATIONSHIPS')}
              className={`pb-2 transition-colors whitespace-nowrap ${
                activeTab === 'RELATIONSHIPS'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Employment, HR &amp; Classes
            </button>
          )}
          {isFamily && (
            <button
              type="button"
              onClick={() => setActiveTab('RELATIONSHIPS')}
              className={`pb-2 transition-colors whitespace-nowrap ${
                activeTab === 'RELATIONSHIPS'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t('users.tabRelationships') || 'Caregiver & Enrolled Children'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`pb-2 transition-colors whitespace-nowrap ${
              activeTab === 'SECURITY'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t('users.tabSecurity') || 'Security & RBAC'}
          </button>
          {isStaff && (
            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`pb-2 transition-colors whitespace-nowrap ${
                activeTab === 'DOCUMENTS'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t('users.tabDocuments') || 'Documents'} ({staffDocuments.length})
            </button>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1: OVERVIEW */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100 font-mono select-all">
                  {user.email || 'Not recorded'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Mobile Phone
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                  {user.phone || 'Not recorded'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Username / Login Handle
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                  @{user.username || 'unset'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Preferred Language
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {localeLabel}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3" /> Campus Branch
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {user.branchId ? `Branch ID: ${user.branchId.slice(-6)}` : 'All Branches / Central'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Registered On
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {fmtDateTime(user.createdAt)}
                </span>
              </div>
            </div>

            {/* Emergency Contact & Address Quick Strip (if present) */}
            {isStaff && user.staffProfile && (
              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 space-y-2 text-xs">
                <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" /> Emergency Contact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 text-[11px] block">Contact Person</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.staffProfile.emergencyContactName || 'Not recorded'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Emergency Phone</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {user.staffProfile.emergencyContactPhone || 'Not recorded'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2: RELATIONSHIPS (STAFF: Full Employment, HR & Classes) */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'RELATIONSHIPS' && (
          <div className="space-y-3.5 text-xs">
            {isStaff && user.staffProfile && (
              <>
                {/* Professional & Assignment */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Professional &amp; Assignment
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Employee Code</span>
                      <span className="font-bold font-mono text-gray-900 dark:text-white">
                        {user.staffProfile.employeeCode || '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Designation</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.designation || 'Staff Member'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Department</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.department || 'Academics'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Employment Type</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.employmentType?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Joining Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fmtLocalDate(user.staffProfile.joiningDate)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Qualifications</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.qualification || 'Not recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Classrooms */}
                <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" /> Assigned Classrooms
                    </span>
                    <span className="badge b-neutral text-[10px]">
                      {user.taughtClasses?.length || 0} Assigned
                    </span>
                  </div>
                  {user.taughtClasses && user.taughtClasses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.taughtClasses.map((cls) => (
                        <div key={cls.id} className="p-2 rounded border border-border bg-muted/30 text-xs flex items-center gap-2">
                          <span className="font-bold text-foreground">{cls.name}</span>
                          <span className="badge b-primary text-[10px]">{cls.programType || 'Class'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No specific classroom assigned as lead teacher.</p>
                  )}
                </div>

                {/* Personal & Demographics */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Personal &amp; Demographics
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Date of Birth</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fmtLocalDate(user.staffProfile.dateOfBirth)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Gender</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.gender || 'Unspecified'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Marital Status</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.maritalStatus || 'Unspecified'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Blood Group</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {user.staffProfile.bloodGroup || 'Unspecified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Residential Addresses */}
                {(user.staffProfile.currentAddress || user.staffProfile.permanentAddress) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {user.staffProfile.currentAddress && (
                      <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                        <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" /> Current Residential Address
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                          {user.staffProfile.currentAddress}
                        </p>
                      </div>
                    )}
                    {user.staffProfile.permanentAddress && (
                      <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                        <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1 mb-1">
                          <Building className="w-3 h-3" /> Permanent Address
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                          {user.staffProfile.permanentAddress}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Statutory IDs & Compliance */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Statutory Records &amp; Identifiers
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">PAN Number</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white uppercase">
                        {user.staffProfile.panNumber || 'Not recorded'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Aadhaar (Masked)</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {maskAadhaar(user.staffProfile.aadhaarNumber)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">UAN (PF)</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.uanNumber || 'Not recorded'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">ESI Number</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {user.staffProfile.esiNumber || 'Not recorded'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HR Lifecycle */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    HR Lifecycle &amp; Notice Period
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Probation End</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fmtLocalDate(user.staffProfile.probationEndDate)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Confirmation Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {fmtLocalDate(user.staffProfile.confirmationDate)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                      <span className="text-gray-400 block text-[10px] uppercase">Notice Period</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {user.staffProfile.noticePeriodDays != null ? `${user.staffProfile.noticePeriodDays} Days` : 'Standard (30d)'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* TAB 2: RELATIONSHIPS (FAMILY: Caregiver Profile & Students) */}
            {/* ────────────────────────────────────────────────────────── */}
            {isFamily && (
              <div className="space-y-3">
                {/* Guardian Details Card */}
                {user.guardianProfile && (
                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-card grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Relationship</span>
                      <span className="font-bold text-gray-900 dark:text-white capitalize">
                        {user.guardianProfile.relationship?.toLowerCase() || 'Caregiver'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Profession / Occupation</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.guardianProfile.occupation || 'Not recorded'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Emergency Priority</span>
                      {user.guardianProfile.isPrimaryContact ? (
                        <span className="badge b-success text-[10px] font-semibold">Primary Contact</span>
                      ) : (
                        <span className="badge b-neutral text-[10px]">Secondary Contact</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Enrolled Students Card */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Enrolled Children ({user.guardianProfile?.students?.length || 0})</span>
                  </div>

                  {user.guardianProfile?.students && user.guardianProfile.students.length > 0 ? (
                    user.guardianProfile.students.map((child) => (
                      <div
                        key={child.id}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Baby className="w-3.5 h-3.5 text-indigo-600" />
                            {child.name}
                            <span className="badge b-primary font-mono text-[10px]">{child.admissionNo}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Relationship: <span className="font-medium capitalize">{child.relationship?.toLowerCase() || user.guardianProfile?.relationship?.toLowerCase() || 'Caregiver'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`badge text-[10px] ${
                              child.canPickup ? 'b-success' : 'b-neutral'
                            }`}
                          >
                            {child.canPickup ? 'Pickup Authorized' : 'No Pickup'}
                          </span>
                          {child.receivesComm !== false && (
                            <span className="badge b-blue text-[10px]">
                              Communications Active
                            </span>
                          )}
                          {child.pickupPin && (
                            <span className="badge b-purple font-mono text-[10px]" title="Pickup PIN is secured">
                              PIN: ••••
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center rounded-lg border border-dashed border-border text-muted-foreground text-xs">
                      No linked students found for this family profile.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3: SECURITY & RBAC */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-400 block text-[11px] mb-1">Assigned RBAC Roles</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((r) => (
                  <span key={r} className={`badge ${ROLE_BADGE[normalizeRole(r)]?.cls || 'b-neutral'} text-xs font-semibold`}>
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 block">Security Scoping</span>
              <p className="text-gray-500 text-[11px]">
                {isFamily
                  ? 'Relationship-scoped: Access strictly bounded to linked enrolled children only.'
                  : 'Role-based workforce scoping: Enforces branch isolation and module authorization.'}
              </p>
            </div>

            <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 text-[11px] space-y-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200 block">Protected Authentication Fields</span>
              <p>
                Password hashes, security tokens, and encryption secrets are never returned over API endpoints or rendered in client inspector interfaces.
              </p>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 4: DOCUMENTS LIBRARY */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'DOCUMENTS' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Staff Generated Documents</span>
              <button
                type="button"
                onClick={loadDocuments}
                className="btn btn-ghost btn-xs text-indigo-600 flex items-center gap-1"
              >
                <RefreshCw size={11} className={loadingDocs ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {loadingDocs ? (
              <div className="p-6 text-center text-gray-400">Loading documents...</div>
            ) : staffDocuments.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {staffDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <FileText size={13} className="text-indigo-600" />
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {fmtDate(doc.createdAt)} • {Math.round(doc.fileSizeBytes / 1024)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="btn btn-ghost btn-xs text-indigo-600"
                        title="View PDF"
                      >
                        <Eye size={12} />
                      </button>
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        download={doc.fileName || `${doc.title}.pdf`}
                        className="btn btn-ghost btn-xs text-gray-600"
                        title="Download PDF"
                      >
                        <Download size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="btn btn-ghost btn-xs text-rose-600"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                <FileText size={20} className="mx-auto mb-1 text-gray-300" />
                <p>No generated documents on file for this staff member.</p>
              </div>
            )}

            {previewDoc && (
              <PdfViewerModal
                open={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                documentId={previewDoc.id}
                title={previewDoc.title}
                documentType={previewDoc.documentType}
                fileSizeBytes={previewDoc.fileSizeBytes}
                fileName={previewDoc.fileName}
              />
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>
            {t('common.close')}
          </button>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                className="btn btn-secondary text-xs flex items-center gap-1.5"
                onClick={() => {
                  onClose()
                  onEdit(user)
                }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('common.edit') || 'Edit Profile'}
              </button>
            )}
            {onStatusChange && (
              <button
                type="button"
                className={`btn text-xs ${user.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  onClose()
                  onStatusChange(user)
                }}
              >
                {user.status === 'ACTIVE' ? t('users.statusSuspended') : t('users.statusActive')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
