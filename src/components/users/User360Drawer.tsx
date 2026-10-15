'use client'

<<<<<<< Updated upstream
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
=======
import React, { useState, useEffect, useMemo, useCallback } from 'react'
>>>>>>> Stashed changes
import {
  User, Mail, Phone, Building, Briefcase, Baby, Shield, KeyRound,
  Lock, CheckCircle2, XCircle, Clock, Calendar, Edit3, ShieldAlert,
  FileText, Download, Trash2, Eye, RefreshCw, Globe, MapPin,
  HeartHandshake, GraduationCap, Award, Hash, Check, Copy,
  Laptop, Smartphone, Tablet, Monitor, LogOut, Unlock, Send, UserX, UserCheck,
  History, ChevronDown, ChevronRight, Filter, Network
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { PdfViewerModal } from '@/components/preone/PdfViewerModal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { UserRecord, ROLE_BADGE, LOCALES } from './types'
import { normalizeRole } from '@/lib/roles'
import { fmtDateTime, timeAgo, fmtDate } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { PhotoUploadModal } from './PhotoUploadModal'
import { ResetPasswordModal } from './ResetPasswordModal'
import { PickupPinModal } from './PickupPinModal'
import { DpdpAnonymizeModal } from './DpdpAnonymizeModal'
import { FamilyGroupingCard } from './FamilyGroupingCard'

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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RELATIONSHIPS' | 'SECURITY' | 'DOCUMENTS' | 'ACTIVITY'>('OVERVIEW')
  const [staffDocuments, setStaffDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [profileDetail, setProfileDetail] = useState<any | null>(null)
  const toast = useToast()
  const [userSessions, setUserSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [pickupPinModalOpen, setPickupPinModalOpen] = useState(false)
  const [dpdpModalOpen, setDpdpModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Activity Trail State (Doc N-6)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [activityPerspective, setActivityPerspective] = useState<'ALL' | 'TARGET' | 'ACTOR'>('ALL')
  const [activityCounts, setActivityCounts] = useState({ total: 0, asTarget: 0, asActor: 0 })
  const [activitySearch, setActivitySearch] = useState('')
  const [activitySeverity, setActivitySeverity] = useState('ALL')
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set())

  const handleUnlock = async () => {
    if (!user) return
    const uid = user.userId || user.id
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/users/${uid}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to unlock account')
      toast.success('Account Unlocked', `Account for ${user.name} has been unlocked.`)
    } catch (err: any) {
      toast.error('Unlock Failed', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResendInvite = async () => {
    if (!user) return
    if (!user.email) {
      toast.error('Missing Email', `${user.name} does not have an email address configured.`)
      return
    }
    const uid = user.userId || user.id
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/users/${uid}/resend-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to resend invitation')
      toast.success('Email Dispatched', data.message || `Invitation/welcome email sent to ${user.email}.`)
    } catch (err: any) {
      toast.error('Failed to Resend', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const loadSessions = React.useCallback(async () => {
    if (!user) return
    const uid = user.userId || user.id
    try {
      setLoadingSessions(true)
      const res = await fetch(`/api/v1/users/${uid}/sessions`).then((r) => r.json())
      if (res.success && Array.isArray(res.data)) {
        setUserSessions(res.data)
      } else {
        setUserSessions([])
      }
    } catch {
      setUserSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }, [user])

  React.useEffect(() => {
    if (open && activeTab === 'SECURITY') {
      loadSessions()
    }
  }, [open, activeTab, loadSessions])

  const handleRevokeSession = async (sessionId: string, deviceName: string) => {
    if (!user) return
    const uid = user.userId || user.id
    try {
      setRevokingSessionId(sessionId)
      const res = await fetch(`/api/v1/users/${uid}/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success('Device Session Revoked', `Disconnected ${deviceName} for ${user.name}.`)
        setUserSessions((prev) => prev.filter((s) => s.id !== sessionId))
      } else {
        toast.error('Revoke Failed', json.error?.message || json.error || 'Failed to revoke device session')
      }
    } catch (err: any) {
      toast.error('Revoke Error', err.message)
    } finally {
      setRevokingSessionId(null)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!user) return
    const confirmed = window.confirm(
      `Are you sure you want to sign out ${user.name} from all devices? This will invalidate all active sessions immediately.`
    )
    if (!confirmed) return

    const uid = user.userId || user.id
    try {
      setRevokingAll(true)
      const res = await fetch(`/api/v1/users/${uid}/revoke-sessions`, {
        method: 'POST',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          'All Devices Signed Out',
          `Revoked ${json.data?.revokedCount ?? 'all'} active sessions for ${user.name}.`
        )
        setUserSessions([])
      } else {
        toast.error('Revocation Failed', json.error?.message || json.error || 'Failed to sign out all devices')
      }
    } catch (err: any) {
      toast.error('Revocation Error', err.message)
    } finally {
      setRevokingAll(false)
    }
  }

  React.useEffect(() => {
    if (user) {
      setUserAvatarUrl(user.avatarUrl || null)
    }
  }, [user])

  const loadProfileDetail = React.useCallback(async () => {
    if (!user) return
    const uid = user.userId || user.id
    try {
      const res = await fetch(`/api/v1/users/${uid}`).then((r) => r.json())
      if (res.success && res.data) {
        setProfileDetail(res.data)
      }
    } catch {
      // Non-blocking
    }
  }, [user])

  const loadActivity = React.useCallback(async () => {
    if (!user) return
    const uid = user.userId || user.id
    try {
      setLoadingActivity(true)
      const params = new URLSearchParams()
      if (activityPerspective) params.set('perspective', activityPerspective)
      if (activitySearch) params.set('search', activitySearch)
      if (activitySeverity && activitySeverity !== 'ALL') params.set('severity', activitySeverity)
      params.set('limit', '50')

      const res = await fetch(`/api/v1/users/${uid}/activity?${params.toString()}`).then((r) => r.json())
      if (res.success && res.data) {
        setActivityLogs(res.data.items || [])
        setActivityCounts(res.data.counts || { total: 0, asTarget: 0, asActor: 0 })
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingActivity(false)
    }
  }, [user, activityPerspective, activitySearch, activitySeverity])

  const toggleExpandLog = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  React.useEffect(() => {
    if (open && user) {
      loadSessions()
      loadProfileDetail()
      loadActivity()
      return () => {
        setProfileDetail(null)
      }
    }
  }, [open, user, loadSessions, loadProfileDetail, loadActivity])

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

  const activeUser: UserRecord = profileDetail
    ? {
        ...user,
        ...profileDetail,
        staffProfile: profileDetail.staffProfile || user.staffProfile,
        guardianProfile: profileDetail.guardianProfile || user.guardianProfile,
      }
    : user

  const sp = activeUser.staffProfile || user.staffProfile
  const gp = activeUser.guardianProfile || user.guardianProfile

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
            <button
              type="button"
              onClick={() => setActiveTab('SECURITY')}
              className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Click to view connected devices & sessions"
            >
              <Clock className="w-3 h-3 text-gray-400" />
              <span>Active: {user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Never'}</span>
              {userSessions.length > 0 && (
                <span className="badge badge-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-none font-mono text-[9px] px-1">
                  {userSessions.length} {userSessions.length === 1 ? 'device' : 'devices'}
                </span>
              )}
            </button>
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
            className={`pb-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'SECURITY'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>{t('users.tabSecurity') || 'Security & Active Sessions'}</span>
            {userSessions.length > 0 && (
              <span className="badge badge-xs badge-primary font-mono text-[10px]">
                {userSessions.length}
              </span>
            )}
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
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVITY')}
            className={`pb-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ACTIVITY'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History size={13} />
            <span>Activity Trail</span>
            {activityCounts.total > 0 && (
              <span className="badge badge-xs badge-neutral font-mono text-[10px]">
                {activityCounts.total}
              </span>
            )}
          </button>
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

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 sm:col-span-2">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3" /> Campus Branch Assignment
                </span>
                {(() => {
                  const branchesList = profileDetail?.assignedBranches || user.assignedBranches || []
                  if (branchesList.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {branchesList.map((b: any) => {
                          const isPrimary = b.isPrimary || b.id === user.branchId
                          return (
                            <span
                              key={b.id}
                              className={`badge badge-sm text-[11px] ${
                                isPrimary
                                  ? 'badge-primary font-semibold'
                                  : 'badge-ghost border border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              {b.name} ({b.code})
                              {isPrimary && ' • Primary'}
                            </span>
                          )
                        })}
                      </div>
                    )
                  }
                  if (isFamily) {
                    const familyCampuses = gp?.campuses || []
                    if (familyCampuses.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {familyCampuses.map((c: any) => (
                            <span key={c.id} className="badge badge-sm text-[11px] badge-outline font-medium">
                              {c.name} {c.code ? `(${c.code})` : ''}
                            </span>
                          ))}
                        </div>
                      )
                    }
                    return (
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Relationship-Scoped (Linked Wards)
                      </span>
                    )
                  }
                  return (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {user.branchId ? 'Single Campus Branch' : 'All Branches / Central'}
                    </span>
                  )
                })()}
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
            {isStaff && sp && (
              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 space-y-2 text-xs">
                <div className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" /> Emergency Contact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 text-[11px] block">Contact Person</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sp.emergencyContactName || 'Not recorded'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Emergency Phone</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {sp.emergencyContactPhone || 'Not recorded'}
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
            {isStaff && sp && (
              <>
                {/* Professional & Assignment */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Professional &amp; Assignment
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Employee Code</span>
                      <span className="font-bold font-mono text-foreground">
                        {sp.employeeCode || '—'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Designation</span>
                      <span className="font-medium text-foreground">
                        {sp.designation || 'Staff Member'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Department</span>
                      <span className="font-medium text-foreground">
                        {sp.department || 'Academics'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Employment Type</span>
                      <span className="font-medium text-foreground">
                        {sp.employmentType?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Joining Date</span>
                      <span className="font-medium text-foreground">
                        {fmtLocalDate(sp.joiningDate)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Qualifications</span>
                      <span className="font-medium text-foreground">
                        {sp.qualification || 'Not recorded'}
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

                {/* Organizational Hierarchy & Reporting */}
                <div className="p-3 rounded-lg border border-border/80 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Network className="w-3.5 h-3.5 text-primary" /> Reporting Hierarchy
                    </span>
                    {(sp.directReports?.length || 0) > 0 && (
                      <span className="badge b-primary text-[10px]">
                        {sp.directReports?.length} Direct Report{sp.directReports?.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Reporting Manager */}
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                        Reporting Manager
                      </span>
                      {sp.reportingManager || activeUser.reportingManager ? (
                        <div className="flex items-center gap-2.5 pt-0.5">
                          <Avatar
                            name={(sp.reportingManager || activeUser.reportingManager)!.name}
                            src={(sp.reportingManager || activeUser.reportingManager)!.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {(sp.reportingManager || activeUser.reportingManager)!.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {(sp.reportingManager || activeUser.reportingManager)!.designation || 'Supervisor'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pt-1">
                          Top-level / Self-managed (No manager)
                        </p>
                      )}
                    </div>

                    {/* Direct Reports Count / Summary */}
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                      <span className="text-muted-foreground block text-[11px] font-semibold uppercase tracking-wider">
                        Direct Reports
                      </span>
                      {sp.directReports && sp.directReports.length > 0 ? (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {sp.directReports.map((dr: any) => (
                            <div
                              key={dr.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-border text-xs"
                              title={`${dr.name} - ${dr.designation || dr.department || 'Staff'}`}
                            >
                              <Avatar name={dr.name} src={dr.avatarUrl} size="sm" />
                              <span className="font-medium text-foreground truncate max-w-[120px]">{dr.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pt-1">
                          No direct reports assigned
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal & Demographics */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    Personal &amp; Demographics
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Date of Birth</span>
                      <span className="font-medium text-foreground">
                        {fmtLocalDate(sp.dateOfBirth)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Gender</span>
                      <span className="font-medium text-foreground">
                        {sp.gender || 'Unspecified'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Marital Status</span>
                      <span className="font-medium text-foreground">
                        {sp.maritalStatus || 'Unspecified'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Blood Group</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {sp.bloodGroup || 'Unspecified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Residential Addresses */}
                {(sp.currentAddress || sp.permanentAddress) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sp.currentAddress && (
                      <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                        <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" /> Current Residential Address
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                          {sp.currentAddress}
                        </p>
                      </div>
                    )}
                    {sp.permanentAddress && (
                      <div className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-card">
                        <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1 mb-1">
                          <Building className="w-3 h-3" /> Permanent Address
                        </span>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                          {sp.permanentAddress}
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
                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">PAN Number</span>
                      <span className="font-mono font-bold text-foreground uppercase">
                        {sp.panNumber || 'Not recorded'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Aadhaar (Masked)</span>
                      <span className="font-mono font-medium text-foreground">
                        {maskAadhaar(sp.aadhaarNumber)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">UAN (PF)</span>
                      <span className="font-mono font-medium text-foreground">
                        {sp.uanNumber || 'Not recorded'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">ESI Number</span>
                      <span className="font-mono font-medium text-foreground">
                        {sp.esiNumber || 'Not recorded'}
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
                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Probation End</span>
                      <span className="font-medium text-foreground">
                        {fmtLocalDate(sp.probationEndDate)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Confirmation Date</span>
                      <span className="font-medium text-foreground">
                        {fmtLocalDate(sp.confirmationDate)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/80 bg-card">
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Notice Period</span>
                      <span className="font-bold text-foreground">
                        {sp.noticePeriodDays != null ? `${sp.noticePeriodDays} Days` : 'Standard (30d)'}
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
              <FamilyGroupingCard
                user={activeUser}
                onOpenPinModal={() => setPickupPinModalOpen(true)}
                onUpdate={loadProfileDetail}
              />
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3: SECURITY & SESSIONS (Doc 5.1 P2 Audit) */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4 text-xs">
            {/* Invitation Lifecycle Card (Doc 1.3) */}
            {user.status === 'PENDING' && (
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Workspace Invitation Lifecycle</span>
                        {profileDetail?.invitation?.effectiveStatus === 'EXPIRED' ? (
                          <span className="badge b-red text-[10px] font-bold">Expired</span>
                        ) : profileDetail?.invitation?.effectiveStatus === 'EXPIRING_SOON' ? (
                          <span className="badge b-amber text-[10px] font-bold animate-pulse">Expiring Soon</span>
                        ) : (
                          <span className="badge b-amber text-[10px] font-bold">Pending Setup</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Onboarding credential invitation sent to <strong className="font-mono text-gray-700 dark:text-gray-300">{user.email}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResendInvite}
                      disabled={actionLoading}
                      className="btn btn-xs btn-primary flex items-center gap-1"
                      title="Generate fresh 7-day token and resend email"
                    >
                      <Send size={11} className={actionLoading ? 'animate-spin' : ''} />
                      <span>{actionLoading ? 'Sending...' : 'Resend Invite'}</span>
                    </button>
                    {profileDetail?.invitation?.inviteUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(profileDetail.invitation.inviteUrl)
                          toast.success('Link Copied', 'Direct invitation link copied to clipboard.')
                        }}
                        className="btn btn-xs btn-outline flex items-center gap-1"
                        title="Copy direct invitation onboarding link"
                      >
                        <Copy size={11} />
                        <span>Copy Link</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-200/50 dark:border-amber-800/30 text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-900/60 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] text-gray-400 block">Invited Age</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {profileDetail?.invitation?.invitedAge || timeAgo(user.createdAt)}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-gray-900/60 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] text-gray-400 block">Expiry Status</span>
                    <span className={`font-semibold ${profileDetail?.invitation?.isExpired ? 'text-rose-600' : profileDetail?.invitation?.isExpiringSoon ? 'text-amber-600' : 'text-gray-800 dark:text-gray-200'}`}>
                      {profileDetail?.invitation?.expiresIn || 'Valid for 7 days'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-gray-900/60 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] text-gray-400 block">Resends Count</span>
                    <span className="font-semibold font-mono text-gray-800 dark:text-gray-200">
                      {profileDetail?.invitation?.resendCount ?? 0} resends
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-gray-900/60 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] text-gray-400 block">Invited By</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">
                      {profileDetail?.invitation?.invitedByName || 'Administrator'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Sessions & Connected Devices */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Active Sessions &amp; Connected Devices
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Live authenticated login sessions and recognized hardware devices
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={loadSessions}
                    disabled={loadingSessions}
                    className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                    title="Refresh active sessions"
                  >
                    <RefreshCw size={12} className={loadingSessions ? 'animate-spin' : ''} />
                  </button>
                  {userSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRevokeAllSessions}
                      disabled={revokingAll}
                      className="btn btn-xs btn-outline text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 flex items-center gap-1"
                    >
                      <LogOut size={12} className={revokingAll ? 'animate-spin' : ''} />
                      <span>{revokingAll ? 'Revoking...' : 'Sign Out All Devices'}</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingSessions ? (
                <div className="p-4 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-indigo-600" /> Loading sessions...
                </div>
              ) : userSessions.length > 0 ? (
                <div className="space-y-2">
                  {userSessions.map((s) => {
                    const isMobile = /mobile|android|iphone/i.test(s.device || s.userAgent || '')
                    const isTablet = /tablet|ipad/i.test(s.device || s.userAgent || '')
                    const DeviceIcon = isTablet ? Tablet : isMobile ? Smartphone : Laptop

                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                            <DeviceIcon size={16} />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs truncate">
                                {s.device || 'Active Device'}
                              </span>
                              <span className="badge badge-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-none text-[10px]">
                                Active
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                              <span>{s.platform || 'Platform Unknown'}</span>
                              {s.ipAddress && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{s.ipAddress}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Active {timeAgo(s.lastActiveAt)}</span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              Signed in: {fmtDateTime(s.createdAt)}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id, s.device || 'Device')}
                          disabled={revokingSessionId === s.id}
                          className="btn btn-ghost btn-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 flex items-center gap-1"
                          title="Revoke session for this device"
                        >
                          {revokingSessionId === s.id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <LogOut size={12} />
                          )}
                          <span>Revoke</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 text-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs space-y-1">
                  <p>No active login sessions recorded for this user.</p>
                  <p className="text-[10px] text-gray-400">
                    Sessions are tracked automatically upon user sign-in.
                  </p>
                </div>
              )}
            </div>

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

            {profileDetail?.customRoles && profileDetail.customRoles.length > 0 && (
              <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900/40 space-y-2">
                <span className="text-indigo-700 dark:text-indigo-300 font-semibold block text-[11px]">
                  Custom Dynamic Roles &amp; Capabilities (Doc 2.1)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profileDetail.customRoles.map((cr: any) => (
                    <span key={cr.id} className="badge badge-primary text-xs font-semibold">
                      {cr.name} ({cr.code})
                    </span>
                  ))}
                </div>
                <div className="pt-1">
                  <span className="text-[10px] text-gray-400 block mb-1">Effective Dynamic Capabilities:</span>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(profileDetail.customRoles.flatMap((cr: any) => cr.capabilities || []))].map((cap: any) => (
                      <span key={cap} className="badge badge-xs badge-ghost font-mono text-[10px]">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-gray-400 block text-[11px] mb-1">Campus Scoping &amp; Assigned Branches</span>
              {(() => {
                const branchesList = profileDetail?.assignedBranches || user.assignedBranches || []
                if (branchesList.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {branchesList.map((b: any) => {
                        const isPrimary = b.isPrimary || b.id === user.branchId
                        return (
                          <span
                            key={b.id}
                            className={`badge ${
                              isPrimary ? 'badge-primary' : 'badge-ghost border border-gray-200 dark:border-gray-700'
                            } text-xs font-semibold`}
                          >
                            <Building className="w-3 h-3 mr-1 inline" />
                            {b.name} ({b.code})
                            {isPrimary && ' [Primary]'}
                          </span>
                        )
                      })}
                    </div>
                  )
                }
                if (isFamily) {
                  const familyCampuses = gp?.campuses || []
                  if (familyCampuses.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {familyCampuses.map((c: any) => (
                          <span key={c.id} className="badge badge-outline text-xs font-semibold">
                            <Building className="w-3 h-3 mr-1 inline" />
                            {c.name} {c.code ? `(${c.code})` : ''}
                          </span>
                        ))}
                      </div>
                    )
                  }
                  return (
                    <p className="text-gray-500 text-[11px] mt-1">
                      Relationship-Scoped: Linked across student campus enrollments
                    </p>
                  )
                }
                return (
                  <p className="text-gray-500 text-[11px] mt-1">
                    {user.branchId ? 'Single Campus Branch' : 'Central / All Campuses Scope'}
                  </p>
                )
              })()}
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

            {/* Quick Administrative Access Actions */}
            <div className="p-3.5 border border-indigo-100 dark:border-indigo-950/60 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
              <span className="font-semibold text-gray-900 dark:text-gray-100 block text-xs">
                Administrative Access Actions
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setResetPasswordOpen(true)}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300"
                >
                  <KeyRound size={13} className="text-indigo-600" />
                  <span>Reset Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={actionLoading}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-amber-700 dark:text-amber-300"
                >
                  <Unlock size={13} className="text-amber-600" />
                  <span>Unlock Account</span>
                </button>
                <button
                  type="button"
                  onClick={handleResendInvite}
                  disabled={actionLoading}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-sky-700 dark:text-sky-300"
                >
                  <Send size={13} className="text-sky-600" />
                  <span>{user.status === 'PENDING' ? 'Resend Invitation' : 'Resend Welcome Email'}</span>
                </button>
              </div>
            </div>

            {/* Child Pickup Verification PIN Card (Doc N-5) */}
            {isFamily && (
              <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Child Pickup Security PIN
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Gate release authorization &amp; physical kiosk authentication PIN
                    </p>
                  </div>
                  <span
                    className={`badge text-[10px] font-mono ${
                      gp?.pickupPin || gp?.students?.some((s: any) => Boolean(s.pickupPin))
                        ? 'b-purple'
                        : 'b-neutral'
                    }`}
                  >
                    {gp?.pickupPin || gp?.students?.some((s: any) => Boolean(s.pickupPin))
                      ? 'PIN Configured (••••)'
                      : 'No PIN Configured'}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900/30 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Coverage Status:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {(() => {
                        const children = gp?.students || []
                        const authorized = children.filter((c: any) => c.canPickup)
                        const withPin = authorized.filter((c: any) => Boolean(c.pickupPin) || Boolean(gp?.pickupPin))
                        return `${withPin.length} of ${authorized.length} pickup-authorized children covered`
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => setPickupPinModalOpen(true)}
                    className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  >
                    <KeyRound size={13} className="text-purple-600" />
                    <span>Manage Pickup PIN (Reset / Regenerate / Auto-Provision)</span>
                  </button>
                </div>
              </div>
            )}

            {/* DPDP Statutory Compliance & Data Erasure (Doc 4.2) */}
            <div className="p-3.5 bg-red-50/40 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" /> DPDP Statutory Compliance &amp; Data Erasure
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Irreversible de-identification of personal data under Digital Personal Data Protection Act 2023
                  </p>
                </div>
                <span
                  className={`badge text-[10px] font-mono ${
                    user.status === 'ARCHIVED' || user.name.startsWith('Anonymized')
                      ? 'badge-warning'
                      : 'badge-ghost border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {user.status === 'ARCHIVED' || user.name.startsWith('Anonymized')
                    ? 'DPDP Anonymized'
                    : 'Active Data Principal'}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                Scrubs direct identifiers across user, staff HR records, and guardian contacts while preserving immutable statutory accounting receipts (7-year retention rule).
              </p>

              {user.status !== 'ARCHIVED' && !user.name.startsWith('Anonymized') && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setDpdpModalOpen(true)}
                    className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={13} className="text-red-600 dark:text-red-400" />
                    <span>DPDP De-identification &amp; Erasure Workflow</span>
                  </button>
                </div>
              )}
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

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 5: ACTIVITY TRAIL (Doc N-6) */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'ACTIVITY' && (
          <div className="space-y-3.5 text-xs">
            {/* Header / Perspective Filter Segmented Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl text-[11px] font-medium overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivityPerspective('ALL')}
                  className={`py-1 px-2.5 rounded-lg transition-all whitespace-nowrap ${
                    activityPerspective === 'ALL'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  All Events ({activityCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityPerspective('TARGET')}
                  className={`py-1 px-2.5 rounded-lg transition-all whitespace-nowrap ${
                    activityPerspective === 'TARGET'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  Changes to Account ({activityCounts.asTarget})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityPerspective('ACTOR')}
                  className={`py-1 px-2.5 rounded-lg transition-all whitespace-nowrap ${
                    activityPerspective === 'ACTOR'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  Actions by User ({activityCounts.asActor})
                </button>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <select
                  value={activitySeverity}
                  onChange={(e) => setActivitySeverity(e.target.value)}
                  className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none text-gray-700 dark:text-gray-300"
                >
                  <option value="ALL">All Severities</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <button
                  type="button"
                  onClick={loadActivity}
                  disabled={loadingActivity}
                  className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 p-1"
                  title="Refresh activity logs"
                >
                  <RefreshCw size={13} className={loadingActivity ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Filter by action or summary keyword..."
                className="w-full text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              />
              <History size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>

            {/* Timeline Stream */}
            {loadingActivity ? (
              <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-indigo-600" />
                <span>Loading activity stream...</span>
              </div>
            ) : activityLogs.length > 0 ? (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {activityLogs.map((log) => {
                  const isExpanded = expandedLogIds.has(log.id)
                  const hasDiff = Boolean(
                    (log.oldValues && Object.keys(log.oldValues).length > 0) ||
                    (log.newValues && Object.keys(log.newValues).length > 0)
                  )

                  const severityColor =
                    log.severity === 'CRITICAL'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                      : log.severity === 'WARNING'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900/70 shadow-xs space-y-2 transition-all"
                    >
                      {/* Top Bar: Action, Perspective Badge, Severity & Timestamp */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-white font-mono text-[11px]">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`badge text-[10px] uppercase font-mono px-1.5 py-0.5 ${
                              log.perspective === 'TARGET'
                                ? 'b-purple'
                                : log.perspective === 'ACTOR'
                                ? 'b-blue'
                                : 'b-neutral'
                            }`}
                          >
                            {log.perspective === 'TARGET'
                              ? 'Subject'
                              : log.perspective === 'ACTOR'
                              ? 'Actor'
                              : 'Subject & Actor'}
                          </span>
                          <span className={`badge text-[9px] uppercase px-1 py-0.2 border ${severityColor}`}>
                            {log.severity}
                          </span>
                        </div>

                        <span className="text-[11px] text-gray-400" title={fmtDateTime(log.createdAt)}>
                          {timeAgo(log.createdAt)}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        {log.summary || `Action ${log.action} on ${log.entity || 'account'}`}
                      </p>

                      {/* Attribution and Meta Row */}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800/60">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-gray-400" />
                          <span>
                            {log.actor?.name
                              ? `${log.actor.name} (${log.actor.role || 'Staff'})`
                              : 'System / Self-service'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {log.ipAddress && (
                            <span className="font-mono text-[10px] text-gray-400">
                              IP: {log.ipAddress}
                            </span>
                          )}
                          {hasDiff && (
                            <button
                              type="button"
                              onClick={() => toggleExpandLog(log.id)}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              <span>{isExpanded ? 'Hide changes' : 'View changes'}</span>
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Diffs */}
                      {isExpanded && hasDiff && (
                        <div className="pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          {log.oldValues && (
                            <div className="p-2 rounded bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
                              <span className="font-bold text-rose-700 dark:text-rose-400 block text-[10px] uppercase">
                                Previous Values
                              </span>
                              <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap text-rose-900 dark:text-rose-200">
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase">
                                Applied Values
                              </span>
                              <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap text-emerald-900 dark:text-emerald-200">
                                {JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500 space-y-1">
                <History size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-1" />
                <p className="font-medium text-xs text-gray-700 dark:text-gray-300">
                  No activity records found
                </p>
                <p className="text-[11px] text-gray-400">
                  Audit events and administrative actions will appear here automatically.
                </p>
              </div>
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
                  onEdit(activeUser)
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

      <ResetPasswordModal
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        user={user}
        onSuccess={() => {
          loadSessions()
        }}
      />

      <PickupPinModal
        isOpen={pickupPinModalOpen}
        onClose={() => setPickupPinModalOpen(false)}
        user={
          user
            ? {
                id: user.userId || user.id,
                fullName: user.name || (user as any).fullName,
                role: user.role,
                students: gp?.students || [],
              }
            : null
        }
        onSuccess={() => {
          loadProfileDetail()
        }}
      />

      {user && (
        <DpdpAnonymizeModal
          isOpen={dpdpModalOpen}
          onClose={() => setDpdpModalOpen(false)}
          user={{
            id: user.userId || user.id,
            userId: user.userId || user.id,
            name: user.name || (user as any).fullName || 'User',
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
          }}
          onSuccess={() => {
            loadProfileDetail()
            loadSessions()
            onClose()
          }}
        />
      )}
    </Modal>
  )
}
