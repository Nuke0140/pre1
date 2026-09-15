'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, UserPlus, Search, Phone, CheckCircle2,
  Edit3, Baby, Shield, Eye, LogOut, Ban, Check, Building,
  Clock, Download, SlidersHorizontal, ChevronRight
} from 'lucide-react'
import { Avatar, Segmented, Skeleton, Field, PageHead, StatusBadge, EmptyState } from '@/components/preone/ui'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Modal, ConfirmModal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { ROLE_PERMISSIONS, Role } from '@/lib/auth'

interface ClassroomOption {
  id: string
  name: string
  programType?: string
  code?: string
}

interface BranchOption {
  id: string
  name: string
  code: string
  isMain?: boolean
}

interface GuardianChild {
  id: string
  name: string
  admissionNo: string
  canPickup: boolean
}

interface UserRecord {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: Role
  roles?: Role[]
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  branchId: string | null
  lastLoginAt: string | null
  createdAt: string
  staffProfile?: {
    employeeCode: string
    designation: string | null
    department: string | null
    qualification: string | null
    employmentType: string
    dateOfBirth?: string | null
    gender?: string | null
    currentAddress?: string | null
  } | null
  taughtClasses?: Array<{ id: string; name: string; programType: string; capacity?: number }>
  guardianProfile?: {
    id: string
    relationship: string
    students: GuardianChild[]
  } | null
}

const ROLE_BADGE: Record<string, { cls: string; label: string }> = {
  OWNER: { cls: 'b-purple', label: 'Owner / Trust Head' },
  PRINCIPAL: { cls: 'b-blue', label: 'Principal / Center Head' },
  COORDINATOR: { cls: 'b-info', label: 'Academic Coordinator' },
  TEACHER: { cls: 'b-success', label: 'Teacher / Educator' },
  ACCOUNTS: { cls: 'b-warning', label: 'Finance / Accounts' },
  RECEPTION: { cls: 'b-pink', label: 'Front Desk / Reception' },
  PARENT: { cls: 'b-primary', label: 'Parent / Guardian' },
  PLATFORM_ADMIN: { cls: 'b-neutral', label: 'Platform Admin' },
}

const DEFAULT_ROLES_MATRIX = [
  { role: 'PLATFORM_ADMIN', label: 'Platform Administrator', description: 'Global infrastructure and multi-tenant management plane', userCount: 0, permissions: ['platform:manage', 'audit:read'] },
  { role: 'OWNER', label: 'Owner / Trust Head', description: 'Full institutional control across all branches, finance, and system settings', userCount: 1, permissions: ['*'] },
  { role: 'PRINCIPAL', label: 'Principal / Center Head', description: 'Complete academic, admissions, operational, and staff management', userCount: 1, permissions: ['students:read', 'students:write', 'admissions:approve', 'attendance:approve', 'finance:read', 'academics:approve', 'users:manage'] },
  { role: 'COORDINATOR', label: 'Academic Coordinator', description: 'Curriculum oversight, teacher management, class schedules, and attendance', userCount: 0, permissions: ['students:read', 'attendance:mark', 'academics:write', 'timeline:read', 'reports:read'] },
  { role: 'TEACHER', label: 'Teacher / Educator', description: 'Assigned classroom management, daily student attendance, activities, and logs', userCount: 5, permissions: ['students:read', 'attendance:mark', 'academics:read', 'timeline:read', 'reports:read'] },
  { role: 'ACCOUNTS', label: 'Finance / Accounts', description: 'Fee invoicing, collections, discounts, receipts, and financial audits', userCount: 1, permissions: ['finance:read', 'finance:write', 'payroll:process', 'reports:export'] },
  { role: 'RECEPTION', label: 'Front Desk / Reception', description: 'Parent enquiries, admissions desk, visitor tracking, and general notifications', userCount: 1, permissions: ['students:read', 'admissions:read', 'communication:read', 'transport:read'] },
  { role: 'PARENT', label: 'Parent / Guardian', description: 'Student daily timeline, notices, fee payments, and school communication', userCount: 2, permissions: ['timeline:read', 'communication:read', 'finance:read'] },
]

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState<UserRecord[] | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [categoryTab, setCategoryTab] = useState<'ALL' | 'STAFF' | 'TEACHER' | 'PARENT' | 'PRINCIPAL' | 'ACCOUNTS' | 'GUARDIAN' | 'PENDING'>('ALL')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')

  // KPIs
  const [kpis, setKpis] = useState({ total: 0, active: 0, pending: 0, suspended: 0, inactive: 0 })

  // Selection
  const [selected, setSelected] = useState<string[]>([])

  // Inspector & Edit states
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [rolesMatrix, setRolesMatrix] = useState<any[]>(DEFAULT_ROLES_MATRIX)
  const [groupsModalOpen, setGroupsModalOpen] = useState(false)

  // Bulk Modals
  const [bulkModalAction, setBulkModalAction] = useState<string | null>(null)
  const [bulkRole, setBulkRole] = useState<Role>('TEACHER')
  const [bulkBranchId, setBulkBranchId] = useState('')
  const [bulkDesignation, setBulkDesignation] = useState('')

  // Confirmation Modals
  const [confirmSuspend, setConfirmSuspend] = useState<UserRecord | null>(null)
  const [confirmReactivate, setConfirmReactivate] = useState<UserRecord | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<UserRecord | null>(null)

  const [busy, setBusy] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'ALL') params.set('role', roleFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (branchFilter !== 'ALL') params.set('branchId', branchFilter)
      if (userTypeFilter !== 'ALL') params.set('userType', userTypeFilter)
      if (search.trim()) params.set('q', search.trim())
      params.set('pageSize', '150')

      const res = await fetch(`/api/v1/users?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setUsers(json.data)
        if (json.meta?.kpis) {
          setKpis(json.meta.kpis)
        }
        if (viewingUser) {
          const fresh = json.data.find((u: UserRecord) => u.userId === viewingUser.userId)
          if (fresh) setViewingUser(fresh)
        }
        if (editingUser) {
          const fresh = json.data.find((u: UserRecord) => u.userId === editingUser.userId)
          if (fresh) setEditingUser(fresh)
        }
      } else {
        setUsers([])
      }
    } catch {
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter, branchFilter, userTypeFilter, search, viewingUser, editingUser, toast])

  // Fetch Metadata
  const fetchMetadata = useCallback(async () => {
    try {
      const [bRes, cRes] = await Promise.all([fetch('/api/v1/branches'), fetch('/api/v1/classrooms')])
      const [bJson, cJson] = await Promise.all([bRes.json(), cRes.json()])
      if (bJson.success && bJson.data) setBranches(bJson.data)
      if (cJson.success && cJson.data) setClassrooms(cJson.data)
    } catch {
      // silent
    }
  }, [])

  // Fetch Roles Directory
  const fetchRolesDirectory = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/users/roles')
      const json = await res.json()
      if (json.success && json.data?.roles) setRolesMatrix(json.data.roles)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchMetadata()
    fetchRolesDirectory()
  }, [fetchUsers, fetchMetadata, fetchRolesDirectory])

  // Filtered Users based on category tabs
  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter((u) => {
      const assigned = u.roles && u.roles.length > 0 ? u.roles : [u.role]
      if (categoryTab === 'ALL') return true
      if (categoryTab === 'PENDING') return u.status === 'PENDING'
      if (categoryTab === 'TEACHER') return assigned.includes('TEACHER')
      if (categoryTab === 'PARENT') return assigned.includes('PARENT')
      if (categoryTab === 'PRINCIPAL') return assigned.includes('PRINCIPAL')
      if (categoryTab === 'ACCOUNTS') return assigned.includes('ACCOUNTS')
      if (categoryTab === 'GUARDIAN') return !!u.guardianProfile || assigned.includes('PARENT')
      if (categoryTab === 'STAFF') {
        return assigned.some((r) => ['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'OWNER'].includes(r))
      }
      return true
    })
  }, [users, categoryTab])

  // Counts for Category Tabs
  const categoryCounts = useMemo(() => {
    if (!users) return { ALL: 0, STAFF: 0, TEACHER: 0, PARENT: 0, PRINCIPAL: 0, ACCOUNTS: 0, GUARDIAN: 0, PENDING: 0 }
    let staff = 0, teachers = 0, parents = 0, principals = 0, accounts = 0, guardians = 0, pending = 0
    for (const u of users) {
      const assigned = u.roles && u.roles.length > 0 ? u.roles : [u.role]
      if (u.status === 'PENDING') pending++
      if (assigned.includes('TEACHER')) teachers++
      if (assigned.includes('PARENT')) parents++
      if (assigned.includes('PRINCIPAL')) principals++
      if (assigned.includes('ACCOUNTS')) accounts++
      if (u.guardianProfile || assigned.includes('PARENT')) guardians++
      if (assigned.some((r) => ['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'OWNER'].includes(r))) staff++
    }
    return {
      ALL: users.length,
      STAFF: staff,
      TEACHER: teachers,
      PARENT: parents,
      PRINCIPAL: principals,
      ACCOUNTS: accounts,
      GUARDIAN: guardians,
      PENDING: pending,
    }
  }, [users])

  // Map rows for DataTable with id set to userId
  const tableData = useMemo(() => {
    return filteredUsers.map((u) => ({
      ...u,
      id: u.userId,
    }))
  }, [filteredUsers])

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const fullName = fd.get('fullName') as string
    const email = fd.get('email') as string
    const phone = fd.get('phone') as string
    const password = fd.get('password') as string
    const role = fd.get('role') as Role
    const branchId = fd.get('branchId') as string
    const designation = fd.get('designation') as string

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone: phone || null,
          password,
          role,
          roles: [role],
          branchId: branchId || null,
          designation: designation || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('User created successfully', `${fullName} has been provisioned`)
        setAddModalOpen(false)
        fetchUsers()
      } else {
        toast.error(json.error?.message || 'Failed to create user')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setBusy(false)
    }
  }

  // Handle Edit User
  const handleSaveEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return
    setBusy(true)

    const fd = new FormData(e.currentTarget)
    const fullName = (fd.get('fullName') as string)?.trim() || editingUser.name
    const phone = (fd.get('phone') as string)?.trim() || null
    const branchId = (fd.get('branchId') as string) || null
    const designation = (fd.get('designation') as string)?.trim() || null
    const department = (fd.get('department') as string)?.trim() || null
    const primaryRole = (fd.get('primaryRole') as Role) || editingUser.role

    try {
      const res = await fetch(`/api/v1/users/${editingUser.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          branchId,
          designation,
          department,
          primaryRole,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('User updated successfully')
        setEditModalOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error(json.error?.message || 'Failed to update user')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setBusy(false)
    }
  }

  // Bulk Actions
  const handleExecuteBulkAction = async () => {
    if (!bulkModalAction || selected.length === 0) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkModalAction,
          userIds: selected,
          role: bulkRole,
          branchId: bulkBranchId || null,
          designation: bulkDesignation,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Bulk ${bulkModalAction} completed`, `Updated ${json.data.updatedCount} accounts`)
        setSelected([])
        setBulkModalAction(null)
        fetchUsers()
      } else {
        toast.error(json.error?.message || 'Bulk operation failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setBusy(false)
    }
  }

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const payload: any = {}
      if (selected.length > 0) payload.userIds = selected
      if (roleFilter !== 'ALL') payload.role = roleFilter
      if (statusFilter !== 'ALL') payload.status = statusFilter
      if (branchFilter !== 'ALL') payload.branchId = branchFilter
      if (search.trim()) payload.search = search.trim()

      const res = await fetch('/api/v1/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `preone_users_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('CSV Export downloaded')
    } catch {
      toast.error('Export failed')
    }
  }

  // Canonical Columns
  const columns: Column<any>[] = [
    {
      key: 'user',
      header: 'User Identity',
      sortable: true,
      sortValue: (u) => u.name,
      export: (u) => `${u.name} <${u.email}>`,
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={u.name} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
              {u.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {u.email}
            </div>
            {u.phone && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Phone size={10} /> {u.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Roles',
      sortable: true,
      sortValue: (u) => u.role,
      export: (u) => (u.roles && u.roles.length > 0 ? u.roles.join(', ') : u.role),
      render: (u) => {
        const assigned = u.roles && u.roles.length > 0 ? u.roles : [u.role]
        const primaryBadge = ROLE_BADGE[u.role] || { cls: 'b-neutral', label: u.role }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            <span className={`badge ${primaryBadge.cls}`}>
              {primaryBadge.label}
            </span>
            {assigned.filter((r: string) => r !== u.role).map((r: string, i: number) => {
              const b = ROLE_BADGE[r] || { cls: 'b-neutral', label: r }
              return (
                <span key={i} className="badge b-neutral" style={{ fontSize: 10 }}>
                  {b.label}
                </span>
              )
            })}
          </div>
        )
      },
    },
    {
      key: 'profile',
      header: 'Workforce / Profile',
      render: (u) => {
        if (u.staffProfile) {
          return (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                {u.staffProfile.designation || 'Staff Member'}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>
                {u.staffProfile.employeeCode} {u.staffProfile.department ? `· ${u.staffProfile.department}` : ''}
              </div>
            </div>
          )
        }
        if (u.guardianProfile) {
          return (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                {u.guardianProfile.relationship}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {u.guardianProfile.students?.length || 0} child{u.guardianProfile.students?.length !== 1 ? 'ren' : ''} linked
              </div>
            </div>
          )
        }
        return <span style={{ color: 'var(--text-muted)' }}>—</span>
      },
    },
    {
      key: 'branch',
      header: 'Branch Scope',
      sortable: true,
      sortValue: (u) => branches.find((b) => b.id === u.branchId)?.name || 'All',
      render: (u) => {
        const b = branches.find((br) => br.id === u.branchId)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text)' }}>
            <Building size={13} style={{ color: 'var(--text-muted)' }} />
            <span>{b ? b.name : 'All Campuses'}</span>
          </div>
        )
      },
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
      sortable: true,
      sortValue: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0),
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <Clock size={12} />
          <span>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN') : 'Never'}</span>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* 1. CANONICAL PAGEHEAD */}
      <PageHead
        eyebrow="Identity & Access Management"
        badge={<span className="badge b-primary b-dot">Active Directory</span>}
        title="Users & Access"
        sub="Manage staff, guardians and user access across your preschool network."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => {
                fetchRolesDirectory()
                setRolesModalOpen(true)
              }}
              className="btn btn-secondary"
            >
              <Shield size={14} /> Roles Directory
            </button>
            <button
              onClick={() => setGroupsModalOpen(true)}
              className="btn btn-secondary"
            >
              <Users size={14} /> Groups
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn btn-primary"
            >
              <UserPlus size={14} /> Add User
            </button>
          </div>
        }
      />

      {/* 2. CANONICAL METRIC STRIP */}
      <div className="metric-strip" style={{ marginBottom: 20 }}>
        <div
          className="metric-cell"
          onClick={() => { setCategoryTab('ALL'); setStatusFilter('ALL'); }}
          style={{ cursor: 'pointer' }}
        >
          <div className="m-top">
            <span className="m-lbl">Total Users</span>
            <Users size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="m-val">{kpis.total}</div>
          <div className="m-meta">Directory records</div>
        </div>

        <div
          className="metric-cell"
          onClick={() => setStatusFilter('ACTIVE')}
          style={{ cursor: 'pointer' }}
        >
          <div className="m-top">
            <span className="m-lbl">Active Users</span>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div className="m-val m-success">{kpis.active}</div>
          <div className="m-meta">Full portal access</div>
        </div>

        <div
          className="metric-cell"
          onClick={() => setCategoryTab('STAFF')}
          style={{ cursor: 'pointer' }}
        >
          <div className="m-top">
            <span className="m-lbl">Staff Accounts</span>
            <Building size={16} style={{ color: 'var(--info)' }} />
          </div>
          <div className="m-val">{categoryCounts.STAFF}</div>
          <div className="m-meta">Faculty & workforce</div>
        </div>

        <div
          className="metric-cell"
          onClick={() => setCategoryTab('PARENT')}
          style={{ cursor: 'pointer' }}
        >
          <div className="m-top">
            <span className="m-lbl">Parent Accounts</span>
            <Baby size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="m-val">{categoryCounts.PARENT}</div>
          <div className="m-meta">Guardian portal</div>
        </div>

        <div
          className="metric-cell"
          onClick={() => setStatusFilter('SUSPENDED')}
          style={{ cursor: 'pointer' }}
        >
          <div className="m-top">
            <span className="m-lbl">Inactive / Suspended</span>
            <Ban size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <div className="m-val" style={{ color: (kpis.suspended + kpis.inactive) > 0 ? 'var(--danger)' : undefined }}>
            {kpis.suspended + kpis.inactive}
          </div>
          <div className="m-meta">{kpis.suspended} suspended · {kpis.inactive} inactive</div>
        </div>
      </div>

      {/* 3. TABLE WORKSPACE */}
      <div className="table-workspace">
        {/* Category Navigation Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-muted)' }}>
          {[
            { id: 'ALL', label: 'All Users', count: categoryCounts.ALL },
            { id: 'STAFF', label: 'Staff', count: categoryCounts.STAFF },
            { id: 'TEACHER', label: 'Teachers', count: categoryCounts.TEACHER },
            { id: 'PARENT', label: 'Parents', count: categoryCounts.PARENT },
            { id: 'PRINCIPAL', label: 'Principals', count: categoryCounts.PRINCIPAL },
            { id: 'ACCOUNTS', label: 'Accounts', count: categoryCounts.ACCOUNTS },
            { id: 'GUARDIAN', label: 'Guardians', count: categoryCounts.GUARDIAN },
            { id: 'PENDING', label: 'Invitations', count: categoryCounts.PENDING },
          ].map((tab) => {
            const isActive = categoryTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setCategoryTab(tab.id as any)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 999 }}
              >
                <span>{tab.label}</span>
                <span style={{ marginLeft: 6, opacity: 0.8, fontSize: 11, fontWeight: 700 }}>
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Integrated Context & Filter Bar */}
        <div className="school-context-bar" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="context-item" style={{ flex: 1, minWidth: 220 }}>
            <div className="input-search" style={{ width: '100%' }}>
              <Search size={14} />
              <input
                className="input"
                placeholder="Search name, email, phone, employee code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="context-item">
            <label>Role:</label>
            <select
              className="select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              {Object.keys(ROLE_BADGE).map((r) => (
                <option key={r} value={r}>
                  {ROLE_BADGE[r].label}
                </option>
              ))}
            </select>
          </div>

          <div className="context-item">
            <label>Status:</label>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="context-item">
            <label>Branch:</label>
            <select
              className="select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="context-item">
            <label>Type:</label>
            <select
              className="select"
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
            >
              <option value="ALL">All User Types</option>
              <option value="STAFF">Staff & Workforce</option>
              <option value="PARENT">Parents & Guardians</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => {
                setSearch('')
                setRoleFilter('ALL')
                setStatusFilter('ALL')
                setBranchFilter('ALL')
                setUserTypeFilter('ALL')
                setCategoryTab('ALL')
              }}
              className="btn btn-ghost btn-sm"
              title="Reset all filters"
            >
              <SlidersHorizontal size={13} /> Reset
            </button>
            <button
              onClick={handleExportCsv}
              className="btn btn-outline btn-sm"
              title="Export CSV"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Canonical DataTable */}
        <DataTable
          columns={columns}
          data={tableData}
          loading={loading}
          paginate
          defaultPageSize={10}
          onRowClick={(u) => {
            setViewingUser(u)
            setViewModalOpen(true)
          }}
          rowSelection
          selectedKeys={selected}
          onSelectionChange={(keys) => setSelected(keys.map(String))}
          bulkActions={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                {selected.length} selected
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkModalAction('ASSIGN_ROLE')}
              >
                <Shield size={13} /> Assign Role
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkModalAction('CHANGE_BRANCH')}
              >
                <Building size={13} /> Change Branch
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkModalAction('ACTIVATE')}
              >
                <Check size={13} /> Activate
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkModalAction('SUSPEND')}
              >
                <Ban size={13} /> Suspend
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkModalAction('CHANGE_DESIGNATION')}
              >
                <Edit3 size={13} /> Designation
              </button>
            </div>
          }
          rowActions={(u) => [
            {
              label: 'View 360',
              icon: <Eye size={14} />,
              onClick: () => {
                setViewingUser(u)
                setViewModalOpen(true)
              },
            },
            {
              label: 'Edit User',
              icon: <Edit3 size={14} />,
              onClick: () => {
                setEditingUser(u)
                setEditModalOpen(true)
              },
            },
            {
              label: u.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate Access',
              icon: <Ban size={14} />,
              danger: u.status === 'ACTIVE',
              onClick: () => {
                if (u.status === 'ACTIVE') setConfirmSuspend(u)
                else setConfirmReactivate(u)
              },
            },
            {
              label: 'Revoke Sessions',
              icon: <LogOut size={14} />,
              danger: true,
              onClick: () => setConfirmRevoke(u),
            },
          ]}
          emptyTitle="No users found"
          emptyMessage="No directory records matched the selected filters."
        />
      </div>

      {/* 4. ADD USER MODAL */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New User"
        subtitle="Create portal credentials and configure role assignments"
        icon={<UserPlus size={22} />}
        wide
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-grid">
            <div className="field">
              <label>Full Name <span className="req">*</span></label>
              <input className="input" name="fullName" required placeholder="e.g. Ananya Sharma" />
            </div>
            <div className="field">
              <label>Email Address <span className="req">*</span></label>
              <input className="input" type="email" name="email" required placeholder="ananya@school.com" />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input className="input" name="phone" placeholder="+91 98765 43210" />
            </div>
            <div className="field">
              <label>Initial Password <span className="req">*</span></label>
              <input className="input" type="password" name="password" defaultValue="Preone@123" required />
            </div>
            <div className="field">
              <label>Primary Role <span className="req">*</span></label>
              <select className="select" name="role" defaultValue="TEACHER">
                {Object.keys(ROLE_BADGE).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_BADGE[r].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Campus Branch</label>
              <select className="select" name="branchId" defaultValue="">
                <option value="">All Campuses / Main</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Workforce Designation</label>
              <input className="input" name="designation" placeholder="e.g. Senior Montessori Educator" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. EDIT USER MODAL */}
      <Modal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingUser(null); }}
        title="Edit User Profile"
        subtitle={editingUser ? `Update configuration for ${editingUser.name}` : ''}
        icon={<Edit3 size={22} />}
        wide
      >
        {editingUser && (
          <form onSubmit={handleSaveEditUser}>
            <div className="form-grid">
              <div className="field">
                <label>Full Name <span className="req">*</span></label>
                <input className="input" name="fullName" defaultValue={editingUser.name} required />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input className="input" defaultValue={editingUser.email} disabled style={{ opacity: 0.7 }} />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input className="input" name="phone" defaultValue={editingUser.phone || ''} placeholder="+91 98765 43210" />
              </div>
              <div className="field">
                <label>Primary Role</label>
                <select className="select" name="primaryRole" defaultValue={editingUser.role}>
                  {Object.keys(ROLE_BADGE).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_BADGE[r].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Branch Scope</label>
                <select className="select" name="branchId" defaultValue={editingUser.branchId || ''}>
                  <option value="">All Campuses / Main</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Designation</label>
                <input className="input" name="designation" defaultValue={editingUser.staffProfile?.designation || ''} placeholder="e.g. Lead Teacher" />
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Department</label>
                <input className="input" name="department" defaultValue={editingUser.staffProfile?.department || ''} placeholder="e.g. Early Years Pedagogy" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setEditModalOpen(false); setEditingUser(null); }}>
                Cancel
              </button>
              <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 6. USER 360 OVERVIEW MODAL */}
      <Modal
        open={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewingUser(null); }}
        title="User Profile 360"
        subtitle={viewingUser?.email || ''}
        icon={<Eye size={22} />}
        wide
      >
        {viewingUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Top Identity Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--surface-muted)', borderRadius: 12 }}>
              <Avatar name={viewingUser.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {viewingUser.name}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {viewingUser.email} {viewingUser.phone ? `· ${viewingUser.phone}` : ''}
                </div>
              </div>
              <StatusBadge status={viewingUser.status} />
            </div>

            {/* Scope and Assignment Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Primary Role</span>
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>{ROLE_BADGE[viewingUser.role]?.label || viewingUser.role}</strong>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Branch Scope</span>
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                  {branches.find((b) => b.id === viewingUser.branchId)?.name || 'All Campuses'}
                </strong>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Last Login</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  {viewingUser.lastLoginAt ? new Date(viewingUser.lastLoginAt).toLocaleDateString('en-IN') : 'Never'}
                </span>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Account Created</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  {new Date(viewingUser.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {/* Roles Scope */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Effective Assigned Roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(viewingUser.roles || [viewingUser.role]).map((r, i) => (
                  <span key={i} className={`badge ${ROLE_BADGE[r]?.cls || 'b-neutral'}`}>
                    {ROLE_BADGE[r]?.label || r}
                  </span>
                ))}
              </div>
            </div>

            {/* Staff / Guardian Details */}
            {viewingUser.staffProfile && (
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Workforce & HR Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Employee Code:</span>{' '}
                    <strong>{viewingUser.staffProfile.employeeCode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Designation:</span>{' '}
                    <strong>{viewingUser.staffProfile.designation || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Department:</span>{' '}
                    <strong>{viewingUser.staffProfile.department || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Type:</span>{' '}
                    <strong>{viewingUser.staffProfile.employmentType}</strong>
                  </div>
                </div>
              </div>
            )}

            {viewingUser.guardianProfile && (
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Parent & Guardian Relationship
                </div>
                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Relationship:</span>{' '}
                  <span className="badge b-primary">{viewingUser.guardianProfile.relationship}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {viewingUser.guardianProfile.students?.map((ch) => (
                    <div
                      key={ch.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: 'var(--surface-muted)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{ch.name} ({ch.admissionNo})</span>
                      <span className={`badge ${ch.canPickup ? 'b-success' : 'b-neutral'}`}>
                        {ch.canPickup ? 'Authorized Pickup' : 'No Pickup'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setViewModalOpen(false)
                  setEditingUser(viewingUser)
                  setEditModalOpen(true)
                }}
              >
                <Edit3 size={13} /> Edit Profile
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={() => {
                  setViewModalOpen(false)
                  setConfirmRevoke(viewingUser)
                }}
              >
                <LogOut size={13} /> Revoke Sessions
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: viewingUser.status === 'ACTIVE' ? 'var(--danger)' : 'var(--success)' }}
                onClick={() => {
                  setViewModalOpen(false)
                  if (viewingUser.status === 'ACTIVE') setConfirmSuspend(viewingUser)
                  else setConfirmReactivate(viewingUser)
                }}
              >
                <Ban size={13} /> {viewingUser.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setViewModalOpen(false); setViewingUser(null); }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. BULK ACTIONS MODAL */}
      <Modal
        open={!!bulkModalAction}
        onClose={() => setBulkModalAction(null)}
        title={`Bulk Action: ${bulkModalAction}`}
        subtitle={`Applying to ${selected.length} selected user account(s)`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bulkModalAction === 'ASSIGN_ROLE' && (
            <div className="field">
              <label>Select Role to Append</label>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as Role)}
                className="select"
              >
                {Object.keys(ROLE_BADGE).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_BADGE[r].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {bulkModalAction === 'CHANGE_BRANCH' && (
            <div className="field">
              <label>Select Campus Branch</label>
              <select
                value={bulkBranchId}
                onChange={(e) => setBulkBranchId(e.target.value)}
                className="select"
              >
                <option value="">All Campuses / Main</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {bulkModalAction === 'CHANGE_DESIGNATION' && (
            <div className="field">
              <label>New Workforce Designation</label>
              <input
                type="text"
                placeholder="e.g. Lead Teacher"
                value={bulkDesignation}
                onChange={(e) => setBulkDesignation(e.target.value)}
                className="input"
              />
            </div>
          )}

          {(bulkModalAction === 'ACTIVATE' || bulkModalAction === 'SUSPEND') && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Are you sure you want to transition {selected.length} user account(s) to <strong>{bulkModalAction}</strong>?
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button className="btn btn-ghost" onClick={() => setBulkModalAction(null)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} onClick={handleExecuteBulkAction} disabled={busy}>
              Apply Bulk Action
            </button>
          </div>
        </div>
      </Modal>

      {/* 8. ROLES DIRECTORY & PERMISSIONS MATRIX MODAL */}
      <Modal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
        title="Roles Directory & Permissions Matrix"
        subtitle="Canonical 8 RBAC roles defined in PreOne OS"
        icon={<Shield size={22} />}
        wide
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '65vh', overflowY: 'auto' }}>
          {rolesMatrix.map((rm) => (
            <div
              key={rm.role}
              className="card"
              style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${ROLE_BADGE[rm.role]?.cls || 'b-neutral'}`}>
                    {rm.label}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    ({rm.role})
                  </span>
                </div>
                <span className="badge b-purple" style={{ fontWeight: 700 }}>
                  {rm.userCount} users
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{rm.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {rm.permissions.slice(0, 10).map((p: string, idx: number) => (
                  <span
                    key={idx}
                    className="badge b-neutral"
                    style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  >
                    {p}
                  </span>
                ))}
                {rm.permissions.length > 10 && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>
                    +{rm.permissions.length - 10} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* 9. GROUPS & TEAMS MODAL */}
      <Modal
        open={groupsModalOpen}
        onClose={() => setGroupsModalOpen(false)}
        title="User Groups & Teams"
        subtitle="Functional organization units across departments"
        icon={<Users size={22} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Teaching & Pedagogy</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>All early years educators, assistants, and coordinators</div>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Administration & Front Office</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Admissions, reception, finance, and operations personnel</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setGroupsModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* 10. CONFIRMATION MODALS */}
      <ConfirmModal
        open={!!confirmSuspend}
        onClose={() => setConfirmSuspend(null)}
        title="Suspend User Access"
        message={`Suspend portal login access for ${confirmSuspend?.name}? This prevents authentication until reactivated.`}
        confirmLabel="Suspend Access"
        danger
        onConfirm={async () => {
          if (!confirmSuspend) return
          await fetch(`/api/v1/users/${confirmSuspend.userId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'SUSPENDED', reason: 'Administrative suspension' }),
          })
          toast.success('User suspended')
          setConfirmSuspend(null)
          fetchUsers()
        }}
      />

      <ConfirmModal
        open={!!confirmReactivate}
        onClose={() => setConfirmReactivate(null)}
        title="Reactivate User Access"
        message={`Restore active login access for ${confirmReactivate?.name}?`}
        confirmLabel="Reactivate"
        onConfirm={async () => {
          if (!confirmReactivate) return
          await fetch(`/api/v1/users/${confirmReactivate.userId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE' }),
          })
          toast.success('User reactivated')
          setConfirmReactivate(null)
          fetchUsers()
        }}
      />

      <ConfirmModal
        open={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        title="Revoke All Sessions"
        message={`Sign out all devices for ${confirmRevoke?.name}? Active JWT sessions will be invalidated immediately.`}
        confirmLabel="Revoke Sessions"
        danger
        onConfirm={async () => {
          if (!confirmRevoke) return
          await fetch(`/api/v1/users/${confirmRevoke.userId}/revoke-sessions`, { method: 'POST' })
          toast.success('All sessions revoked')
          setConfirmRevoke(null)
        }}
      />
    </div>
  )
}
