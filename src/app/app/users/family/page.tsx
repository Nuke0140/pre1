'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Baby, Search, UserPlus, FileSpreadsheet, Download, RefreshCw,
  Phone, Mail, Edit3, Shield, Eye, Lock,
  ChevronLeft, CheckCircle2, User, Users,
  KeyRound, Clock, X, Camera
} from 'lucide-react'
import { Avatar, StatusBadge, EmptyState, KpiTile, PageHead, IconButton } from '@/components/preone/ui'
import { EmptyUsersIllustration } from '@/components/preone'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { SearchFilterBar } from '@/components/preone'
import { useToast } from '@/components/preone/Toast'
import { AddFamilyModal } from '@/components/users/AddFamilyModal'
import { CsvImportModal } from '@/components/users/CsvImportModal'
import { BulkPhotoUploadModal } from '@/components/users/BulkPhotoUploadModal'
import { BulkUpdateFieldModal } from '@/components/users/BulkUpdateFieldModal'
import { User360Drawer } from '@/components/users/User360Drawer'
import { EditUserModal } from '@/components/users/EditUserModal'
import { RolesDirectoryModal } from '@/components/users/RolesDirectoryModal'
import { BulkActionModal } from '@/components/users/BulkActionModal'
import { ZipPhotoUploadModal } from '@/components/users/ZipPhotoUploadModal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  GlobalActionMenu,
  type ActionItem,
  type ActionGroup,
} from '@/components/ui/action-menu'
import { UserRecord, BranchOption, ClassroomOption } from '@/components/users/types'
import { timeAgo } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { Image, Layers, MoreHorizontal } from 'lucide-react'

export default function FamilyUsersPage() {
  const toast = useToast()
  const { t } = useI18n()

  // Tab: PARENTS vs GUARDIANS
  const [activeTab, setActiveTab] = useState<'PARENTS' | 'GUARDIANS'>('PARENTS')

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)

  // Overall counts for tabs
  const [parentCount, setParentCount] = useState(0)
  const [guardianCount, setGuardianCount] = useState(0)

  // Selection
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([])
  const [selectAllMatching, setSelectAllMatching] = useState(false)
  const [bulkFieldUpdateOpen, setBulkFieldUpdateOpen] = useState(false)

  // Modals
  const [addFamilyOpen, setAddFamilyOpen] = useState(false)
  const [addFamilyRole, setAddFamilyRole] = useState<'PARENT' | 'GUARDIAN'>('PARENT')
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [zipPhotoModalOpen, setZipPhotoModalOpen] = useState(false)
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false)
  const [bulkPhotosOpen, setBulkPhotosOpen] = useState(false)
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)

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

  const fetchFamilyUsers = useCallback(async () => {
    setLoading(true)
    try {
      const targetRole = activeTab === 'PARENTS' ? 'PARENT' : 'GUARDIAN'
      const params = new URLSearchParams({
        role: targetRole,
        page: String(page),
        pageSize: String(pageSize),
      })

      if (search.trim()) params.set('q', search.trim())
      if (selectedBranch !== 'ALL') params.set('branchId', selectedBranch)
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus)

      const res = await fetch(`/api/v1/users?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setUsers(json.data || [])
        setTotal(json.meta?.total || 0)
        if (json.meta?.tabs) {
          setParentCount(json.meta.tabs.PARENT || 0)
          setGuardianCount(json.meta.tabs.GUARDIAN || 0)
        }
      } else {
        toast.error('Fetch Error', 'Failed to retrieve family accounts')
      }
    } catch (e: any) {
      toast.error('Network Error', e.message)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, pageSize, search, selectedBranch, selectedStatus, toast])

  useEffect(() => {
    fetchBranchesAndClassrooms()
  }, [])

  useEffect(() => {
    fetchFamilyUsers()
  }, [fetchFamilyUsers])

  // KPIs
  const kpis = useMemo(() => {
    let linkedChildrenTotal = 0
    let authorizedPickupTotal = 0
    let pinSetTotal = 0
    let multiChildCount = 0

    users.forEach((u) => {
      const children = u.guardianProfile?.students || []
      linkedChildrenTotal += children.length
      if (children.length > 1) multiChildCount++
      children.forEach((c) => {
        if (c.canPickup) authorizedPickupTotal++
        if (c.pickupPin) pinSetTotal++
      })
    })

    return {
      linkedChildrenTotal,
      authorizedPickupTotal,
      pinSetTotal,
      multiChildCount,
    }
  }, [users])

  // Columns for PARENTS Tab
  const parentColumns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'Parent Identity',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="md" />
          <div className="min-w-0">
            <div
              className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer text-sm truncate"
              onClick={() => setViewingUser(u)}
              title="View 360 profile"
            >
              {u.name}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              @{u.username || u.email?.split('@')[0] || 'parent'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'children',
      header: 'Linked Students',
      render: (u) => {
        const children = u.guardianProfile?.students || []
        if (children.length === 0) {
          return <span className="text-xs text-gray-400 italic">No linked students</span>
        }
        return (
          <div className="space-y-1">
            {children.map((child) => (
              <div key={child.id} className="text-xs flex items-center gap-1.5 font-medium flex-wrap">
                <span className="text-gray-900 dark:text-white font-medium">{child.name}</span>
                <span className="badge b-primary font-mono text-[10px] shrink-0">{child.admissionNo}</span>
                <span className="text-gray-400 text-[10px] capitalize shrink-0">({child.relationship?.toLowerCase() || 'parent'})</span>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      key: 'email',
      header: 'Contact Details',
      render: (u) => (
        <div className="text-xs space-y-1">
          {u.email ? (
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-mono break-all">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{u.email}</span>
            </div>
          ) : (
            <div className="text-gray-400 italic text-[11px] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span>No email address</span>
            </div>
          )}
          {u.phone && (
            <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{u.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'financials',
      header: 'Fee Visibility',
      render: () => (
        <span className="badge b-success text-xs font-medium">
          Fee Payer
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'lastLoginAt',
      header: 'Last Portal Login',
      render: (u) => (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="dt-actions-row flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={<Eye size={15} />}
            label="View 360 Profile"
            onClick={() => setViewingUser(u)}
          />
          <IconButton
            icon={<Edit3 size={15} />}
            label="Edit Parent"
            onClick={() => setEditingUser(u)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="dt-icon-btn p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
                title="More Actions"
                aria-label="More Actions"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-lg border border-border/80 bg-popover z-50">
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setEditingUser(u)}
              >
                <Edit3 size={14} className="text-amber-600" />
                <span>Individual Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => {
                  setSelectedKeys([u.userId || u.id])
                  setBulkFieldUpdateOpen(true)
                }}
              >
                <Layers size={14} className="text-purple-600" />
                <span>Bulk Edit / Update</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setViewingUser(u)}
              >
                <Eye size={14} className="text-slate-500" />
                <span>View 360 Profile</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  // Columns for GUARDIANS Tab
  const guardianColumns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'Authorized Guardian',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="md" />
          <div className="min-w-0">
            <div
              className="font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer text-sm truncate"
              onClick={() => setViewingUser(u)}
              title="View 360 profile"
            >
              {u.name}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              @{u.username || u.email?.split('@')[0] || 'guardian'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'children',
      header: 'Authorized Linked Child',
      render: (u) => {
        const children = u.guardianProfile?.students || []
        if (children.length === 0) {
          return <span className="text-xs text-gray-400 italic">No linked children</span>
        }
        return (
          <div className="space-y-1">
            {children.map((child) => (
              <div key={child.id} className="text-xs flex items-center gap-1.5 font-medium flex-wrap">
                <span className="text-gray-900 dark:text-white font-medium">{child.name}</span>
                <span className="badge b-primary font-mono text-[10px] shrink-0">{child.admissionNo}</span>
                <span className="text-gray-400 text-[10px] capitalize shrink-0">({child.relationship?.toLowerCase() || 'guardian'})</span>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      key: 'pickup',
      header: 'Pickup Security',
      render: (u) => {
        const children = u.guardianProfile?.students || []
        const canPickup = children.some((c) => c.canPickup)
        const hasPin = children.some((c) => Boolean(c.pickupPin))
        return (
          <div className="flex items-center gap-1.5">
            <span className={`badge text-xs ${canPickup ? 'b-success' : 'b-neutral'}`}>
              {canPickup ? 'Authorized' : 'Restricted'}
            </span>
            {hasPin && (
              <span className="badge b-purple font-mono text-[10px]">
                PIN Set
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'email',
      header: 'Contact Details',
      render: (u) => (
        <div className="text-xs space-y-1">
          {u.email ? (
            <div className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{u.email}</span>
            </div>
          ) : (
            <div className="text-gray-400 italic text-[11px] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span>No email address</span>
            </div>
          )}
          {u.phone && (
            <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{u.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'lastLoginAt',
      header: 'Last Active',
      render: (u) => (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="dt-actions-row flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={<Eye size={15} />}
            label="View 360 Profile"
            onClick={() => setViewingUser(u)}
          />
          <IconButton
            icon={<Edit3 size={15} />}
            label="Edit Guardian"
            onClick={() => setEditingUser(u)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="dt-icon-btn p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
                title="More Actions"
                aria-label="More Actions"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-lg border border-border/80 bg-popover z-50">
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setEditingUser(u)}
              >
                <Edit3 size={14} className="text-amber-600" />
                <span>Individual Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => {
                  setSelectedKeys([u.userId || u.id])
                  setBulkFieldUpdateOpen(true)
                }}
              >
                <Layers size={14} className="text-purple-600" />
                <span>Bulk Edit / Update</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                onClick={() => setViewingUser(u)}
              >
                <Eye size={14} className="text-slate-500" />
                <span>View 360 Profile</span>
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
          { label: t('users.familyUsers') },
        ]}
      />

      {/* Page Header */}
      <PageHead
        title={t('users.familyUsers')}
        backHref="/app/users"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFamilyUsers}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-card hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>

            <GlobalActionMenu
              label={t('common.actions') || 'Actions'}
              groups={[
                { id: 'data', label: 'Data Operations', helperText: 'माहिती देवाणघेवाण' },
                { id: 'management', label: 'Management', helperText: 'व्यवस्थापन' },
              ]}
              actions={[
                {
                  id: 'roles',
                  label: t('users.rolesDirectory'),
                  helperText: 'भूमिका आणि प्रवेश निर्देशिका',
                  icon: <Shield />,
                  category: 'settings',
                  groupId: 'management',
                  onClick: () => setRolesModalOpen(true),
                },
                {
                  id: 'import-csv',
                  label: t('users.importFamilyCsv'),
                  helperText: 'कुटुंब यादी आयात करा',
                  icon: <FileSpreadsheet />,
                  category: 'import',
                  groupId: 'data',
                  onClick: () => setCsvModalOpen(true),
                },
                {
                  id: 'export-csv',
                  label: `${t('common.export')} CSV`,
                  helperText: 'पालकांची यादी डाउनलोड करा',
                  icon: <Download />,
                  category: 'export',
                  groupId: 'data',
                  href: `/api/v1/users/export?userType=${activeTab === 'PARENTS' ? 'PARENT' : 'GUARDIAN'}${selectedBranch !== 'ALL' ? `&branchId=${selectedBranch}` : ''}${selectedStatus !== 'ALL' ? `&status=${selectedStatus}` : ''}${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''}`,
                  download: `${activeTab.toLowerCase()}-directory.csv`,
                },
                {
                  id: 'individual-edit',
                  label: 'Individual Edit',
                  helperText: 'विशिष्ट पालक संपादन',
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
                      toast.info('Selection Needed', 'No family user available to edit')
                    }
                  },
                },
                {
                  id: 'bulk-update',
                  label: 'Bulk Field Update',
                  helperText: 'एकाच वेळी माहिती अपडेट करा',
                  icon: <Layers />,
                  category: 'edit',
                  groupId: 'management',
                  onClick: () => setBulkFieldUpdateOpen(true),
                },
                {
                  id: 'upload-photos',
                  label: 'Upload Photos',
                  helperText: 'पालकांचे फोटो अपलोड करा',
                  icon: <Camera />,
                  category: 'import',
                  groupId: 'management',
                  onClick: () => setBulkPhotosOpen(true),
                },
                {
                  id: 'zip-photos',
                  label: t('users.bulkPhotoUpload'),
                  helperText: 'झिप फाइलमधून फोटो अपलोड',
                  icon: <Image />,
                  category: 'import',
                  groupId: 'management',
                  onClick: () => setZipPhotoModalOpen(true),
                },
              ]}
            />

            <button
              type="button"
              onClick={() => {
                setAddFamilyRole(activeTab === 'PARENTS' ? 'PARENT' : 'GUARDIAN')
                setAddFamilyOpen(true)
              }}
              className="btn btn-primary text-xs flex items-center justify-center gap-1.5 py-2 px-3.5 shadow-sm font-semibold users-act-add"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ {t('users.addFamily') || 'Add Family Member'}</span>
            </button>
          </div>
        }
      />

      {/* Workspace Tabs: Parents vs Guardians */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="seg users-segmented-nav" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'PARENTS'}
            className={`px-3 sm:px-4 py-1.5 text-center justify-center ${activeTab === 'PARENTS' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('PARENTS')
              setPage(1)
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{t('users.parentsTab', { count: parentCount })}</span>
            </span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'GUARDIANS'}
            className={`px-3 sm:px-4 py-1.5 text-center justify-center ${activeTab === 'GUARDIANS' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('GUARDIANS')
              setPage(1)
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('users.guardiansTab', { count: guardianCount })}</span>
            </span>
          </button>
        </div>
      </div>

      {/* All 5 KPI & Policy Boxes in ONE LINE on Desktop, Fully Responsive */}
      <div className="kpi-row kpi-5">
        {activeTab === 'PARENTS' ? (
          <>
            <KpiTile
              label="Security Policy"
              value="Max 2 Parents"
              icon={<Lock />}
              iconClass="ic-purple"
              variant="compact"
            />
            <KpiTile
              label="Total Parents"
              value={parentCount}
              icon={<User />}
              iconClass="ic-blue"
              variant="compact"
            />
            <KpiTile
              label="Linked Students"
              value={kpis.linkedChildrenTotal}
              icon={<Baby />}
              iconClass="ic-green"
              variant="compact"
            />
            <KpiTile
              label="Fee Visibility"
              value="Fee Payers"
              icon={<CheckCircle2 />}
              iconClass="ic-orange"
              variant="compact"
            />
            <KpiTile
              label="Multi-Child Parents"
              value={kpis.multiChildCount}
              icon={<Users />}
              iconClass="ic-teal"
              variant="compact"
            />
          </>
        ) : (
          <>
            <KpiTile
              label="Security Policy"
              value="Gate Escort"
              meta="Zero financial access"
              icon={<Shield />}
              iconClass="ic-amber"
              variant="compact"
            />
            <KpiTile
              label="Total Guardians"
              value={guardianCount}
              meta="Authorized pickup escorts"
              icon={<Shield />}
              iconClass="ic-orange"
              variant="compact"
            />
            <KpiTile
              label="Gate Clearance"
              value={kpis.authorizedPickupTotal}
              meta="Authorized for pickup"
              icon={<CheckCircle2 />}
              iconClass="ic-green"
              variant="compact"
            />
            <KpiTile
              label="Gate PIN Set"
              value={kpis.pinSetTotal}
              meta="Cryptographic PIN set"
              icon={<KeyRound />}
              iconClass="ic-purple"
              variant="compact"
            />
            <KpiTile
              label="Privacy Shield"
              value="Strict"
              meta="Zero billing/grade access"
              icon={<Lock />}
              iconClass="ic-blue"
              variant="compact"
            />
          </>
        )}
      </div>

      <SearchFilterBar
        search={{
          value: search,
          onChange: (val) => {
            setSearch(val)
            setPage(1)
          },
          placeholder: `Search ${activeTab === 'PARENTS' ? 'parent' : 'guardian'} name, child, admission no...`,
          shortcut: '⌘K',
        }}
        filters={[
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
          setSelectedBranch('ALL')
          setSelectedStatus('ALL')
          setPage(1)
        }}
      />

      {/* Family DataTable Workspace */}
      <div className="table-workspace">
        {/* Smart Selection Banner */}
        {selectedKeys.length > 0 && (
          <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-xs">
            <span className="text-purple-900 dark:text-purple-200 font-medium">
              {selectAllMatching ? (
                <>All <strong>{total}</strong> {activeTab.toLowerCase()} matching filters are selected.</>
              ) : (
                <>
                  <strong>{selectedKeys.length}</strong> {activeTab.toLowerCase()} on this page selected.
                  {total > users.length && (
                    <button
                      type="button"
                      onClick={() => setSelectAllMatching(true)}
                      className="ml-2 underline text-purple-700 dark:text-purple-300 font-semibold hover:text-purple-900"
                    >
                      Select all {total} matching {activeTab.toLowerCase()}
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
          columns={activeTab === 'PARENTS' ? parentColumns : guardianColumns}
          data={users}
          loading={loading}
          showToolbar={selectedKeys.length > 0}
          rowSelection={true}
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            setSelectedKeys(keys)
            if (keys.length === 0) setSelectAllMatching(false)
          }}
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
                    <Edit3 size={14} className="text-amber-600" />
                    <span>Individual Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                  onClick={() => setBulkFieldUpdateOpen(true)}
                >
                  <Layers size={14} />
                  <span>Bulk Update Field ({selectedKeys.length})</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-semibold"
                  onClick={() => setBulkActionModalOpen(true)}
                >
                  <span>More Actions</span>
                </button>
              </div>
            ) : null
          }
          emptyIcon={<EmptyUsersIllustration size={120} />}
          emptyTitle={`No ${activeTab === 'PARENTS' ? 'parents' : 'guardians'} found`}
          emptyMessage={`No ${activeTab === 'PARENTS' ? 'parent' : 'guardian'} accounts match your selected campus branch, status, or search query.`}
        />

        {/* Pagination Strip */}
        <div
          className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500"
          style={{ background: 'var(--bg-subtle)' }}
        >
          <span className="text-center sm:text-left">
            Showing {users.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, total)} of {total} {activeTab.toLowerCase()}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary text-xs px-2.5 py-1"
            >
              Previous
            </button>
            <span className="w-7 h-7 rounded-md font-semibold text-xs flex items-center justify-center bg-purple-600 text-white">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-secondary text-xs px-2.5 py-1"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddFamilyModal
        open={addFamilyOpen}
        onClose={() => setAddFamilyOpen(false)}
        defaultRole={addFamilyRole}
        branches={branches}
        classrooms={classrooms}
        onSuccess={fetchFamilyUsers}
      />

      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        type="FAMILY"
        onSuccess={fetchFamilyUsers}
      />

      <BulkPhotoUploadModal
        open={bulkPhotosOpen}
        onClose={() => setBulkPhotosOpen(false)}
        onSuccess={fetchFamilyUsers}
      />

      <User360Drawer
        open={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        onEdit={(u) => setEditingUser(u)}
      />

      <EditUserModal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        branches={branches}
        classrooms={classrooms}
        onSuccess={fetchFamilyUsers}
      />

      <RolesDirectoryModal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
      />

      <BulkPhotoUploadModal
        open={bulkPhotosOpen}
        onClose={() => setBulkPhotosOpen(false)}
        onSuccess={fetchFamilyUsers}
      />

      <ZipPhotoUploadModal
        open={zipPhotoModalOpen}
        onClose={() => setZipPhotoModalOpen(false)}
        onSuccess={fetchFamilyUsers}
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
          fetchFamilyUsers()
        }}
      />

      <BulkUpdateFieldModal
        open={bulkFieldUpdateOpen}
        onClose={() => setBulkFieldUpdateOpen(false)}
        selectedUserIds={selectedKeys.map((k) => String(k))}
        branches={branches}
        userType="FAMILY"
        onSuccess={() => {
          setSelectedKeys([])
          fetchFamilyUsers()
        }}
      />
    </div>
  )
}
