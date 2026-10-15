'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  User, Mail, Phone, Building, Briefcase, Baby, Shield, KeyRound,
  Lock, CheckCircle2, XCircle, Clock, Calendar, Edit3, ShieldAlert,
  FileText, Download, Trash2, Eye, RefreshCw, Globe, MapPin,
  HeartHandshake, GraduationCap, Award, Hash, Check,
  Laptop, Smartphone, Tablet, Monitor, LogOut, Unlock, Send, UserX, UserCheck,
  History, ChevronDown, ChevronRight, Filter, AlertCircle
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

  const isPasswordConfigured = activeUser.hasPassword !== false && (activeUser.passwordStatus === 'CONFIGURED' || activeUser.hasPassword)
  const displayMaskedPassword = activeUser.maskedPassword || (isPasswordConfigured ? '••••••••' : null)

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
                  return (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {user.branchId ? `Branch ID: ${user.branchId.slice(-6)}` : 'All Branches / Central'}
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

              <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-400 block text-[11px] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-indigo-500" /> Password Status
                  </span>
                  {isPasswordConfigured ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <AlertCircle className="w-2.5 h-2.5" /> Pending Setup
                    </span>
                  )}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-gray-800 dark:text-gray-200 tracking-wider text-xs font-semibold">
                    {isPasswordConfigured ? (displayMaskedPassword || '••••••••') : 'No password set'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setResetPasswordOpen(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    Reset
                  </button>
                </div>
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
              <div className="space-y-3">
                {/* Guardian Details Card */}
                {gp && (
                  <div className="p-3 rounded-lg border border-border/80 bg-card grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Relationship</span>
                      <span className="font-bold text-foreground capitalize">
                        {gp.relationship?.toLowerCase() || 'Caregiver'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Profession / Occupation</span>
                      <span className="font-medium text-foreground">
                        {gp.occupation || 'Not recorded'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Emergency Priority</span>
                      {gp.isPrimaryContact ? (
                        <span className="badge b-success text-xs font-semibold">Primary Contact</span>
                      ) : (
                        <span className="badge b-neutral text-xs">Secondary Contact</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Enrolled Students Card */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Enrolled Children ({gp?.students?.length || 0})</span>
                  </div>

                  {gp?.students && gp.students.length > 0 ? (
                    gp.students.map((child) => (
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
                            Relationship: <span className="font-medium capitalize">{child.relationship?.toLowerCase() || gp?.relationship?.toLowerCase() || 'Caregiver'}</span>
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
                          {child.canPickup && (
                            <>
                              {child.pickupPin || gp?.pickupPin ? (
                                <span className="badge b-purple font-mono text-[10px]" title="Pickup PIN is secured">
                                  PIN: ••••
                                </span>
                              ) : (
                                <span className="badge b-neutral text-[10px]" title="No pickup PIN set">
                                  No PIN
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setPickupPinModalOpen(true)}
                                className="btn btn-ghost btn-xs text-[10px] text-purple-600 dark:text-purple-400 hover:underline px-1.5 py-0.5 h-auto font-medium"
                                title="Manage Pickup PIN for this child and family"
                              >
                                Manage PIN
                              </button>
                            </>
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
        {/* TAB 3: SECURITY & SESSIONS (Doc 5.1 P2 Audit) */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4 text-xs">
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
                return (
                  <p className="text-gray-500 text-[11px] mt-1">
                    {user.branchId ? `Single Campus Branch (${user.branchId.slice(-6)})` : 'Central / All Campuses Scope'}
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

            {/* Account Password & Security Credentials Card */}
            <div className="p-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/60 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Account Password &amp; Credentials
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Login credentials status and password security enforcement
                  </p>
                </div>
                {isPasswordConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Password Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Pending Setup
                  </span>
                )}
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">Stored Password Value</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base tracking-widest font-semibold text-gray-900 dark:text-gray-100">
                      {isPasswordConfigured ? (displayMaskedPassword || '••••••••') : 'No password configured'}
                    </span>
                    {isPasswordConfigured && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60 dark:border-emerald-800/40">
                        Active &amp; Protected
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResetPasswordOpen(true)}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 shrink-0"
                >
                  <KeyRound size={13} className="text-indigo-600" />
                  <span>Change Password</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-2 bg-gray-50/50 dark:bg-gray-800/30 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p>
                  Passwords are cryptographically salted and hashed using bcrypt before database persistence. Plain-text passwords and cryptographic hashes are never displayed in client interfaces or sent in API responses.
                </p>
              </div>
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
        user={activeUser}
        onSuccess={() => {
          loadSessions()
          loadProfileDetail()
        }}
      />

      <PickupPinModal
        isOpen={pickupPinModalOpen}
        onClose={() => setPickupPinModalOpen(false)}
        user={
          user
            ? {
                id: user.userId || user.id,
                fullName: user.name || user.fullName || '',
                role: user.role,
                students: gp?.students || [],
              }
            : null
        }
        onSuccess={() => {
          loadProfileDetail()
        }}
      />
    </Modal>
  )
}
