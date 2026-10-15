'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Briefcase, Search, UserPlus, FileSpreadsheet, Download, RefreshCw,
  Building, Phone, Mail, MoreHorizontal, Edit3, Shield, Eye, Lock,
  ChevronLeft, AlertCircle, ArrowUpDown, GraduationCap, Users, X, Camera,
  KeyRound, Unlock, UserX, UserCheck, Send, Layers, Image, Network
} from 'lucide-react'
import { Avatar, StatusBadge, EmptyState, KpiTile, PageHead, IconButton } from '@/components/preone/ui'
import { EmptyUsersIllustration } from '@/components/preone'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { SearchFilterBar, type FilterConfig } from '@/components/preone'
import { useToast } from '@/components/preone/Toast'
import { AddStaffModal } from '@/components/users/AddStaffModal'
import { CsvImportModal } from '@/components/users/CsvImportModal'
import { BulkPhotoUploadModal } from '@/components/users/BulkPhotoUploadModal'
import { BulkUpdateFieldModal } from '@/components/users/BulkUpdateFieldModal'
import { User360Drawer } from '@/components/users/User360Drawer'
import { RecordInspector } from '@/components/preone'
import { EditUserModal } from '@/components/users/EditUserModal'
import { RolesDirectoryModal } from '@/components/users/RolesDirectoryModal'
import { InvitationsLifecycleView } from '@/components/users/InvitationsLifecycleView'
import { BulkActionModal } from '@/components/users/BulkActionModal'
import { ZipPhotoUploadModal } from '@/components/users/ZipPhotoUploadModal'
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal'
import { SuspendUserModal } from '@/components/users/SuspendUserModal'
import { OrgHierarchyView } from '@/components/users/OrgHierarchyView'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  GlobalActionMenu,
  type ActionItem,
  type ActionGroup,
} from '@/components/ui/action-menu'
import {
  UserRecord, BranchOption, ClassroomOption, Role,
  CANONICAL_STAFF_ROLES, ROLE_BADGE
} from '@/components/users/types'
import { normalizeRole } from '@/lib/roles'
import { timeAgo, fmtDate } from '@/lib/format'
import { useI18n } from '@/lib/i18n'

export default function StaffUsersPage() {
  const toast = useToast()
  const { t } = useI18n()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Smart Selection state
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])
  const [selectAllMatching, setSelectAllMatching] = useState(false)

  const searchParams = useSearchParams()
  const initialStatusParam = searchParams?.get('tab') || searchParams?.get('status')

  // Filters
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>(
    initialStatusParam && ['PENDING', 'ACTIVE', 'SUSPENDED'].includes(initialStatusParam.toUpperCase())
      ? initialStatusParam.toUpperCase()
      : 'ALL'
  )

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [metaKpis, setMetaKpis] = useState<{ total: number; active: number; pending: number; suspended: number; inactive: number }>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    inactive: 0,
  })

  // Selection & Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkFieldUpdateOpen, setBulkFieldUpdateOpen] = useState(false)

  // Modals
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [zipPhotoModalOpen, setZipPhotoModalOpen] = useState(false)
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false)
  const [bulkPhotosOpen, setBulkPhotosOpen] = useState(false)
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRecord | null>(null)
  const [suspendModalUser, setSuspendModalUser] = useState<UserRecord | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'directory' | 'hierarchy'>('directory')

  const handleSelectUserFromHierarchy = async (userId: string) => {
    const existing = users.find((u) => (u.userId || u.id) === userId)
    if (existing) {
      setViewingUser(existing)
      return
    }
    try {
      const res = await fetch(`/api/v1/users/${userId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setViewingUser(json.data)
      }
    } catch {
      toast.error('Load Error', 'Failed to load user profile')
    }
  }

  const handleUnlockUser = async (u: UserRecord) => {
    const targetUserId = u.userId || u.id
    setActionLoadingId(targetUserId)
    try {
      const res = await fetch(`/api/v1/users/${targetUserId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to unlock account')
      toast.success('Account Unlocked', `Account for ${u.name} has been unlocked.`)
      fetchStaff()
    } catch (err: any) {
      toast.error('Unlock Failed', err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResendInvite = async (u: UserRecord) => {
    if (!u.email) {
      toast.error('Missing Email', `${u.name} does not have an email address configured.`)
      return
    }
    const targetUserId = u.userId || u.id
    setActionLoadingId(targetUserId)
    try {
      const res = await fetch(`/api/v1/users/${targetUserId}/resend-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to resend invitation')
      toast.success('Email Dispatched', data.message || `Invitation/welcome email sent to ${u.email}.`)
    } catch (err: any) {
      toast.error('Failed to Resend', err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const fetchBranchesAndClassrooms = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/v1/branches'),
        fetch('/api/v1/classrooms'),
      ])
      if (bRes.ok) {
        const bJson = await bRes.json()
        setBranches(bJson.data || bJson.items || [])
      }
      if (cRes.ok) {
        const cJson = await cRes.json()
        setClassrooms(cJson.data || cJson.items || [])
      }
    } catch (e) {
      // Non-blocking
    }
  }

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userType: 'STAFF',
        page: String(page),
        pageSize: String(pageSize),
      })

      if (search.trim()) params.set('q', search.trim())
      if (selectedRole !== 'ALL') params.set('role', selectedRole)
      if (selectedBranch !== 'ALL') params.set('branchId', selectedBranch)
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus)

      const res = await fetch(`/api/v1/users?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setUsers(json.data || [])
        setTotal(json.meta?.total || 0)
        if (json.meta?.kpis) {
          setMetaKpis(json.meta.kpis)
        }
      } else {
        toast.error('Fetch Error', 'Failed to retrieve staff users')
      }
    } catch (e: any) {
      toast.error('Network Error', e.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, selectedRole, selectedBranch, selectedStatus, toast])

  useEffect(() => {
    fetchBranchesAndClassrooms()
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Track handled URL deep link IDs to prevent infinite re-opening on close
  const deepLinkHandledRef = React.useRef<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && users.length > 0) {
      const sp = new URLSearchParams(window.location.search)
      const editUserId = sp.get('editUser')
      const viewUserId = sp.get('user')
      const targetId = editUserId || viewUserId

      if (targetId && deepLinkHandledRef.current !== targetId) {
        deepLinkHandledRef.current = targetId
        if (editUserId) {
          const found = users.find((u) => u.userId === editUserId || u.id === editUserId)
          if (found) setEditingUser(found)
        } else if (viewUserId) {
          const found = users.find((u) => u.userId === viewUserId || u.id === viewUserId)
          if (found) setViewingUser(found)
        }
      }
    }
  }, [users])

  const handleCloseViewingUser = useCallback(() => {
    setViewingUser(null)
    deepLinkHandledRef.current = null
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (sp.has('user') || sp.has('editUser')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('user')
        url.searchParams.delete('editUser')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  const handleCloseEditingUser = useCallback(() => {
    setEditingUser(null)
    deepLinkHandledRef.current = null
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (sp.has('user') || sp.has('editUser')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('user')
        url.searchParams.delete('editUser')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  // KPIs
  const kpis = useMemo(() => {
    const active = users.filter((u) => u.status === 'ACTIVE').length
    const teachers = users.filter((u) => normalizeRole(u.role) === 'TEACHER').length
    const staffOps = users.filter((u) => ['STAFF', 'ATTENDANT'].includes(normalizeRole(u.role))).length
    const leadership = users.filter((u) => ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'ACCOUNTS'].includes(normalizeRole(u.role))).length
    return { active, teachers, staffOps, leadership }
  }, [users])

  // Columns definition for DataTable
  const columns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: t('users.staffMember'),
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="md" />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setViewingUser(u)}>
              {u.name}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              @{u.username || u.email?.split('@')[0] || 'staff'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.roleTitle'),
      sortable: true,
      render: (u) => {
        const badge = ROLE_BADGE[normalizeRole(u.role)] || ROLE_BADGE[u.role] || { cls: 'b-neutral', label: u.role }
        return (
          <div>
            <span className={`badge ${badge.cls} text-xs font-semibold`}>
              {badge.label}
            </span>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">
              {u.staffProfile?.designation || u.staffProfile?.department || 'Staff'}
            </div>
          </div>
        )
      },
    },
    {
      key: 'email',
      header: t('users.contactDetails'),
      render: (u) => (
        <div className="text-xs space-y-0.5">
          {u.email ? (
            <div className="text-gray-700 dark:text-gray-300 font-mono flex items-center gap-1.5 break-all">
              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
              <span>{u.email}</span>
            </div>
          ) : (
            <div className="text-gray-400 italic text-[11px] flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-gray-300 shrink-0" />
              <span>{t('users.noEmailAddress')}</span>
            </div>
          )}
          {u.phone && (
            <div className="text-gray-500 font-mono flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-gray-400" />
              {u.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'branchId',
      header: t('users.branch'),
      render: (u) => {
        const assigned = u.assignedBranches || []
        const primaryBranch = branches.find((b) => b.id === u.branchId) || assigned.find((b) => b.isPrimary || b.id === u.branchId)
        const additionalCount = assigned.length > 1 ? assigned.length - 1 : 0

        return (
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{primaryBranch ? `${primaryBranch.name} (${primaryBranch.code})` : t('users.allCampuses')}</span>
              {additionalCount > 0 && (
                <span className="badge b-purple text-[10px] px-1.5 py-0" title={assigned.map((b) => `${b.name} (${b.code})`).join(', ')}>
                  +{additionalCount}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'lastLoginAt',
      header: t('users.lastActive'),
      render: (u) => (
        <span className="text-xs text-gray-500">
          {u.lastLoginAt ? timeAgo(u.lastLoginAt) : t('users.never')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      render: (u) => (
        <div className="dt-actions-row flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={<Eye size={15} />}
            label={t('users.view360Profile')}
            onClick={() => setViewingUser(u)}
          />
          <IconButton
            icon={<Edit3 size={15} />}
            label={t('users.editStaff')}
            onClick={() => setEditingUser(u)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="dt-icon-btn p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
                title={t('common.moreActions')}
                aria-label={t('common.moreActions')}
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border border-border/80 bg-popover z-50">
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setViewingUser(u)}
              >
                <Eye size={14} className="text-slate-500" />
                <span>{t('users.view360Profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setEditingUser(u)}
              >
                <Edit3 size={14} className="text-primary" />
                <span>{t('users.individualEdit')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => {
                  setSelectedKeys([u.userId || u.id])
                  setBulkFieldUpdateOpen(true)
                }}
              >
                <Layers size={14} className="text-purple-600" />
                <span>{t('users.bulkFieldUpdate')}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-t border-border/60" />
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                Admin Actions
              </div>

              {/* Reset Password */}
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setResetPasswordUser(u)}
              >
                <KeyRound size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Reset Password</span>
              </DropdownMenuItem>

              {/* Unlock Account */}
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => handleUnlockUser(u)}
                disabled={actionLoadingId === (u.userId || u.id)}
              >
                <Unlock size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Unlock Account</span>
                {u.status === 'LOCKED' && (
                  <span className="badge badge-xs b-red ml-auto text-[9px] uppercase">Locked</span>
                )}
              </DropdownMenuItem>

              {/* Suspend / Reactivate */}
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setSuspendModalUser(u)}
              >
                {u.status === 'ACTIVE' ? (
                  <>
                    <UserX size={14} className="text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-600 dark:text-rose-400 font-medium">Suspend Access</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Reactivate Access</span>
                  </>
                )}
              </DropdownMenuItem>

              {/* Resend Invite / Welcome */}
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => handleResendInvite(u)}
                disabled={actionLoadingId === (u.userId || u.id)}
              >
                <Send size={14} className="text-sky-600 dark:text-sky-400" />
                <span>{u.status === 'PENDING' ? 'Resend Invitation' : 'Resend Welcome Email'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="users-workspace-container">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home'), href: '/app' },
          { label: t('users.title'), href: '/app/users' },
          { label: t('users.staffUsers') },
        ]}
      />

      {/* Page Header */}
      <PageHead
        title={t('users.staffUsers')}
        backHref="/app/users"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStaff}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-card hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            </button>

            {/* View Mode Toggle: Directory vs Org Hierarchy */}
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 p-0.5 bg-gray-50 dark:bg-gray-900/50 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('directory')}
                className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'directory'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-gray-500 hover:text-foreground'
                }`}
                title="Directory Table View"
              >
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Directory</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('hierarchy')}
                className={`px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'hierarchy'
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-gray-500 hover:text-foreground'
                }`}
                title="Org Hierarchy View"
              >
                <Network className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Org Hierarchy</span>
              </button>
            </div>

            <GlobalActionMenu
              label={t('common.actions') || 'Actions'}
              groups={[
                { id: 'data', label: t('users.dataOperations') || 'Data Operations' },
                { id: 'management', label: t('users.management') || 'Management' },
              ]}
              actions={[
                {
                  id: 'roles',
                  label: t('users.rolesDirectory'),
                  icon: <Shield />,
                  category: 'settings',
                  groupId: 'management',
                  onClick: () => setRolesModalOpen(true),
                },
                {
                  id: 'import-csv',
                  label: t('users.importStaffCsv') || `${t('common.import')} CSV`,
                  icon: <FileSpreadsheet />,
                  category: 'import',
                  groupId: 'data',
                  onClick: () => setCsvModalOpen(true),
                },
                {
                  id: 'export-csv',
                  label: t('users.exportStaffCsv') || `${t('common.export')} CSV`,
                  icon: <Download />,
                  category: 'export',
                  groupId: 'data',
                  href: `/api/v1/users/export?userType=STAFF${selectedRole !== 'ALL' ? `&role=${selectedRole}` : ''}${selectedBranch !== 'ALL' ? `&branchId=${selectedBranch}` : ''}${selectedStatus !== 'ALL' ? `&status=${selectedStatus}` : ''}${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''}`,
                  download: 'staff-directory.csv',
                },
                {
                  id: 'individual-edit',
                  label: t('users.individualEdit') || 'Individual Edit',
                  icon: <Edit3 />,
                  category: 'edit',
                  groupId: 'management',
                  onClick: () => {
                    if (selectedKeys.length === 1) {
                      const u = users.find((x) => String(x.userId || x.id) === String(selectedKeys[0]))
                      if (u) {
                        setEditingUser(u)
                        return
                      }
                    }
                    if (users.length > 0) {
                      setEditingUser(users[0])
                    } else {
                      toast.info('Selection Needed', 'No staff member available to edit')
                    }
                  },
                },
                {
                  id: 'bulk-update',
                  label: t('users.bulkFieldUpdate') || 'Bulk Field Update',
                  icon: <Layers />,
                  category: 'edit',
                  groupId: 'management',
                  onClick: () => setBulkFieldUpdateOpen(true),
                },
                {
                  id: 'upload-photos',
                  label: t('users.uploadPhotos') || 'Upload Photos',
                  icon: <Camera />,
                  category: 'import',
                  groupId: 'management',
                  onClick: () => setBulkPhotosOpen(true),
                },
                {
                  id: 'zip-photos',
                  label: t('users.bulkPhotoUpload') || 'Bulk Profile Photo Upload',
                  icon: <Image />,
                  category: 'import',
                  groupId: 'management',
                  onClick: () => setZipPhotoModalOpen(true),
                },
              ]}
            />

            <button
              type="button"
              onClick={() => setAddStaffOpen(true)}
              className="btn btn-primary text-xs flex items-center justify-center gap-1.5 py-2 px-3.5 shadow-sm font-semibold users-act-add"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ {t('users.addStaff')}</span>
            </button>
          </div>
        }
      />

      {viewMode === 'hierarchy' ? (
        <OrgHierarchyView
          branches={branches}
          onSelectUser={handleSelectUserFromHierarchy}
        />
      ) : (
        <>
          {/* 4-Box KPI Strip (Single cohesive line on desktop & laptops) */}
          <div className="kpi-row kpi-4">
        <KpiTile
          label={t('users.totalStaff')}
          value={total}
          icon={<Briefcase />}
          iconClass="ic-purple"
          variant="compact"
        />
        <KpiTile
          label={t('users.teachersGuides')}
          value={kpis.teachers}
          icon={<GraduationCap />}
          iconClass="ic-blue"
          variant="compact"
        />
        <KpiTile
          label={t('users.supportOps')}
          value={kpis.staffOps}
          icon={<Users />}
          iconClass="ic-green"
          variant="compact"
        />
        <KpiTile
          label={t('users.leadershipAdmin')}
          value={kpis.leadership}
          icon={<Shield />}
          iconClass="ic-orange"
          variant="compact"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="card card-compact p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-3">
        {/* Quick Status Pill Bar */}
        <div className="flex items-center gap-1.5 flex-wrap border-b border-gray-100 dark:border-gray-800/80 pb-2.5 text-xs">
          <button
            type="button"
            onClick={() => { setSelectedStatus('ALL'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All <span className="opacity-75 font-mono ml-1">{metaKpis.total || total}</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedStatus('ACTIVE'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedStatus === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Active <span className="opacity-75 font-mono ml-1">{metaKpis.active}</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedStatus('PENDING'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedStatus === 'PENDING'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Pending <span className="opacity-75 font-mono ml-1">{metaKpis.pending}</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedStatus('SUSPENDED'); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedStatus === 'SUSPENDED'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Inactive / Suspended <span className="opacity-75 font-mono ml-1">{(metaKpis.suspended || 0) + (metaKpis.inactive || 0)}</span>
          </button>
        </div>

        <SearchFilterBar
          search={{
            value: search,
            onChange: (val) => {
              setSearch(val)
              setPage(1)
            },
            placeholder: t('users.searchStaffPlaceholder'),
            shortcut: '⌘K',
          }}
          filters={[
            {
              id: 'role',
              label: t('users.filterByRole') || 'Role',
              type: 'select',
              value: selectedRole,
              defaultValue: 'ALL',
              placeholder: t('users.allRoles'),
              options: [
                { value: 'ALL', label: t('users.allRoles') },
                ...CANONICAL_STAFF_ROLES.map((r) => ({
                  value: r,
                  label: ROLE_BADGE[r]?.label || r,
                })),
              ],
              onChange: (val) => {
                setSelectedRole(val)
                setPage(1)
              },
            },
            {
              id: 'branch',
              label: t('users.filterByBranch') || 'Campus',
              type: 'branch',
              value: selectedBranch,
              defaultValue: 'ALL',
              placeholder: t('users.allBranches'),
              options: [
                { value: 'ALL', label: t('users.allBranches') },
                ...branches.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.code})`,
                  isMain: b.code === 'MAIN' || (b as any).isMain,
                })),
              ],
              onChange: (val) => {
                setSelectedBranch(val)
                setPage(1)
              },
            },
            {
              id: 'status',
              label: t('users.filterByStatus') || 'Status',
              type: 'status',
              value: selectedStatus,
              defaultValue: 'ALL',
              placeholder: t('users.allStatuses'),
              options: [
                { value: 'ALL', label: t('users.allStatuses') },
                { value: 'ACTIVE', label: t('users.statusActive'), colorDot: 'green' },
                { value: 'PENDING', label: t('users.statusPending') || 'Pending', colorDot: 'amber' },
                { value: 'SUSPENDED', label: t('users.statusSuspended'), colorDot: 'red' },
                { value: 'LOCKED', label: t('users.statusLocked'), colorDot: 'red' },
                { value: 'DEACTIVATED', label: t('users.statusDeactivated'), colorDot: 'red' },
                { value: 'ARCHIVED', label: t('users.statusArchived'), colorDot: 'slate' },
              ],
              onChange: (val) => {
                setSelectedStatus(val)
                setPage(1)
              },
            },
          ]}
          onReset={() => {
            setSearch('')
            setSelectedRole('ALL')
            setSelectedBranch('ALL')
            setSelectedStatus('ALL')
            setPage(1)
          }}
        />
      </div>

      {/* Staff DataTable Workspace or Invitations Lifecycle View */}
      {selectedStatus === 'PENDING' ? (
        <InvitationsLifecycleView
          onSelectUser={(userId) => {
            const u = users.find((x) => String(x.userId || x.id) === String(userId))
            if (u) {
              setViewingUser(u)
            } else {
              fetch(`/api/v1/users/${userId}`)
                .then((r) => r.json())
                .then((j) => {
                  if (j.success && j.data) setViewingUser(j.data)
                })
                .catch(() => {})
            }
          }}
          onInviteSuccess={fetchStaff}
        />
      ) : (
        <div className="table-workspace">
        {/* Smart Selection Banner when page is fully selected and total > pageSize */}
        {selectedKeys.length > 0 && (
          <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-xs">
            <span className="text-purple-900 dark:text-purple-200 font-medium">
              {selectAllMatching ? (
                <>All <strong>{total}</strong> staff matching filters are selected.</>
              ) : (
                <>
                  <strong>{selectedKeys.length}</strong> staff on this page selected.
                  {total > users.length && (
                    <button
                      type="button"
                      onClick={() => setSelectAllMatching(true)}
                      className="ml-2 underline text-purple-700 dark:text-purple-300 font-semibold hover:text-purple-900"
                    >
                      Select all {total} matching staff
                    </button>
                  )}
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkActionModalOpen(true)}
                className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1.5 shadow-sm"
              >
                <Layers size={13} />
                <span>Bulk Actions ({selectAllMatching ? total : selectedKeys.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedKeys([])
                  setSelectAllMatching(false)
                }}
                className="btn btn-ghost text-xs py-1 px-2 text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          onRowClick={(u) => setViewingUser(u)}
          rowSelection={true}
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            setSelectedKeys(keys)
            if (keys.length === 0) setSelectAllMatching(false)
          }}
          showToolbar={selectedKeys.length > 0}
          bulkActions={
            selectedKeys.length > 0 ? (
              <div className="flex items-center gap-2">
                {selectedKeys.length === 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                    onClick={() => {
                      const u = users.find((x) => String(x.userId || x.id) === String(selectedKeys[0]))
                      if (u) setEditingUser(u)
                    }}
                  >
                    <Edit3 size={14} className="text-primary" />
                    <span>Individual Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                  onClick={() => setBulkFieldUpdateOpen(true)}
                >
                  <Layers size={14} />
                  <span>{t('users.bulkFieldUpdate')} ({selectedKeys.length})</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                  onClick={() => setBulkActionModalOpen(true)}
                >
                  <span>{t('common.moreActions') || 'More Actions'}</span>
                </button>
              </div>
            ) : null
          }
          emptyIcon={<EmptyUsersIllustration size={120} />}
          emptyTitle={t('users.noStaffFound')}
          emptyMessage={t('users.noStaffMessage')}
        />

        {/* Pagination Strip */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500" style={{ background: 'var(--bg-subtle)' }}>
          <span className="text-center sm:text-left">
            {t('table.showing')} {users.length > 0 ? (page - 1) * pageSize + 1 : 0} {t('table.of')}{' '}
            {Math.min(page * pageSize, total)} {t('table.of')} {total} {t('users.totalStaff')}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary text-xs px-2.5 py-1"
            >
              {t('common.prev')}
            </button>
            <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold px-2">
              {page} / {Math.max(1, Math.ceil(total / pageSize))}
            </span>
            <button
              type="button"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-secondary text-xs px-2.5 py-1"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>
      )}
      </>
      )}

      {/* Modals & Inspectors */}
      <AddStaffModal
        open={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        branches={branches}
        classrooms={classrooms}
        onSuccess={fetchStaff}
      />

      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        type="STAFF"
        onSuccess={fetchStaff}
      />

      <BulkPhotoUploadModal
        open={bulkPhotosOpen}
        onClose={() => setBulkPhotosOpen(false)}
        onSuccess={fetchStaff}
      />

      {/* Side-Peek Inspector Drawer */}
      <RecordInspector
        open={Boolean(viewingUser)}
        onClose={handleCloseViewingUser}
        type="staff"
        recordId={viewingUser?.userId || viewingUser?.id}
        initialData={viewingUser}
        onEdit={(u) => setEditingUser(u)}
      />

      <EditUserModal
        open={Boolean(editingUser)}
        onClose={handleCloseEditingUser}
        user={editingUser}
        branches={branches}
        classrooms={classrooms}
        onSuccess={fetchStaff}
      />

      <RolesDirectoryModal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
      />

      <BulkPhotoUploadModal
        open={bulkPhotosOpen}
        onClose={() => setBulkPhotosOpen(false)}
        onSuccess={fetchStaff}
      />

      <ZipPhotoUploadModal
        open={zipPhotoModalOpen}
        onClose={() => setZipPhotoModalOpen(false)}
        onSuccess={fetchStaff}
      />

      <BulkActionModal
        open={bulkActionModalOpen}
        onClose={() => setBulkActionModalOpen(false)}
        selectedUserIds={
          selectAllMatching
            ? users.map((u) => u.userId || u.id)
            : (selectedKeys.map(String))
        }
        branches={branches}
        onSuccess={() => {
          setSelectedKeys([])
          setSelectAllMatching(false)
          fetchStaff()
        }}
      />

      <BulkUpdateFieldModal
        open={bulkFieldUpdateOpen}
        onClose={() => setBulkFieldUpdateOpen(false)}
        selectedUserIds={selectedKeys.map((k) => String(k))}
        branches={branches}
        userType="STAFF"
        onSuccess={() => {
          setSelectedKeys([])
          fetchStaff()
        }}
      />

      <ResetPasswordModal
        open={Boolean(resetPasswordUser)}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
        onSuccess={fetchStaff}
      />

      <SuspendUserModal
        open={Boolean(suspendModalUser)}
        onClose={() => setSuspendModalUser(null)}
        user={suspendModalUser}
        onSuccess={fetchStaff}
      />
    </div>
  )
}
