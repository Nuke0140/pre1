'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, UserPlus, Search, Mail, Phone,
  CheckCircle2, XCircle, Edit3, Baby, Shield, Eye,
  KeyRound, LogOut, Ban, Check, Building, BookOpen, UserCheck
} from 'lucide-react'
import { PageHead, Avatar, Segmented, Skeleton, Field } from '@/components/preone/ui'
import { Modal, ConfirmModal } from '@/components/preone/Modal'
import { DataTable, Column } from '@/components/preone/DataTable'
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
    qualification: string | null
    employmentType: string
  } | null
  taughtClasses?: Array<{ id: string; name: string; programType: string; capacity?: number }>
  guardianProfile?: {
    id: string
    relationship: string
    students: GuardianChild[]
  } | null
}

const ROLE_META: Record<string, { bg: string; text: string; label: string; desc: string }> = {
  OWNER: { bg: 'rgba(124, 58, 237, 0.12)', text: '#7C3AED', label: 'Owner / Trust Head', desc: 'Full institutional control across all branches, finance, and system settings' },
  PRINCIPAL: { bg: 'rgba(2, 132, 199, 0.12)', text: '#0284C7', label: 'Principal / Center Head', desc: 'Complete academic, admissions, operational, and staff management' },
  COORDINATOR: { bg: 'rgba(14, 165, 233, 0.12)', text: '#0EA5E9', label: 'Academic Coordinator', desc: 'Curriculum oversight, teacher management, class schedules, and attendance' },
  TEACHER: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', label: 'Teacher / Educator', desc: 'Assigned classroom management, daily student attendance, activities, and logs' },
  ACCOUNTS: { bg: 'rgba(245, 158, 11, 0.12)', text: '#D97706', label: 'Finance / Accounts', desc: 'Fee invoicing, collections, discounts, receipts, and financial audits' },
  RECEPTION: { bg: 'rgba(236, 72, 153, 0.12)', text: '#DB2777', label: 'Front Desk / Reception', desc: 'Parent enquiries, admissions desk, visitor tracking, and general notifications' },
  PARENT: { bg: 'rgba(99, 102, 241, 0.12)', text: '#4F46E5', label: 'Parent / Guardian', desc: 'Student daily timeline, notices, fee payments, and school communication' },
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', label: 'Active' },
  SUSPENDED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', label: 'Suspended' },
  INACTIVE: { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748B', label: 'Inactive' },
  PENDING: { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', label: 'Pending' },
}

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState<UserRecord[] | null>(null)
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRecord | null>(null)
  const [viewUser, setViewUser] = useState<UserRecord | null>(null)
  const [viewTab, setViewTab] = useState<'overview' | 'permissions' | 'person' | 'security'>('overview')

  // Confirmation dialogs
  const [confirmSuspend, setConfirmSuspend] = useState<UserRecord | null>(null)
  const [confirmReactivate, setConfirmReactivate] = useState<UserRecord | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<UserRecord | null>(null)

  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<(string | number)[]>([])
  const [guardians, setGuardians] = useState<Array<{ id: string; fullName: string; relationship: string; phone: string; hasAccount?: boolean; children?: GuardianChild[] }>>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Form states for Add Modal
  const [selectedRole, setSelectedRole] = useState<Role>('TEACHER')
  const [addRoles, setAddRoles] = useState<Role[]>(['TEACHER'])

  // Form states for Edit Modal
  const [editRoles, setEditRoles] = useState<Role[]>([])
  const [editPrimaryRole, setEditPrimaryRole] = useState<Role>('TEACHER')

  const openEditModal = useCallback((u: UserRecord) => {
    const userRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role]
    setEditRoles(userRoles)
    setEditPrimaryRole(u.role)
    setEditUser(u)
  }, [])

  // Fetch users directory
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/users')
      const json = await res.json()
      if (json.success) {
        setUsers(json.data)
      } else {
        toast.error('Failed to load users', json.error)
      }
    } catch (e: any) {
      toast.error('Error loading users', e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Fetch guardians for parent account linking
  const fetchGuardians = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/users/guardians')
      const json = await res.json()
      if (json.success && json.data) {
        setGuardians(json.data)
      }
    } catch {
      // Optional fallback
    }
  }, [])

  // Fetch branches and classrooms for staff/teacher linking
  const fetchMetadata = useCallback(async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/v1/branches'),
        fetch('/api/v1/classrooms'),
      ])
      const [bJson, cJson] = await Promise.all([bRes.json(), cRes.json()])
      if (bJson.success && bJson.data) setBranches(bJson.data)
      if (cJson.success && cJson.data) setClassrooms(cJson.data)
    } catch {
      // Silent error handling for optional metadata
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchGuardians()
    fetchMetadata()
  }, [fetchUsers, fetchGuardians, fetchMetadata])

  // Filter users by role and search term
  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter((u) => {
      const uRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role]
      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'STAFF' && ['PRINCIPAL', 'COORDINATOR', 'TEACHER', 'ACCOUNTS', 'RECEPTION'].some((r) => uRoles.includes(r))) ||
        uRoles.includes(roleFilter as any)

      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.staffProfile?.employeeCode && u.staffProfile.employeeCode.toLowerCase().includes(q)) ||
        (u.taughtClasses && u.taughtClasses.some((c) => c.name.toLowerCase().includes(q))) ||
        (u.guardianProfile?.students?.some((s) => s.name.toLowerCase().includes(q)))

      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, search])

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)

    const payload: any = {
      fullName: (fd.get('fullName') as string)?.trim(),
      email: (fd.get('email') as string)?.trim(),
      phone: (fd.get('phone') as string)?.trim() || undefined,
      password: fd.get('password') as string,
      role: selectedRole,
      roles: addRoles.length > 0 ? addRoles : [selectedRole],
      primaryRole: selectedRole,
    }

    const bId = fd.get('branchId') as string
    if (bId) payload.branchId = bId

    if (addRoles.includes('PARENT')) {
      const gId = fd.get('guardianId') as string
      if (gId) payload.guardianId = gId
    }

    const isStaff = addRoles.some((r) =>
      ['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'OWNER'].includes(r)
    )
    if (isStaff || !addRoles.includes('PARENT')) {
      const empCode = fd.get('employeeCode') as string
      const desig = fd.get('designation') as string
      if (empCode) payload.employeeCode = empCode.trim()
      if (desig) payload.designation = desig.trim()

      if (addRoles.includes('TEACHER')) {
        const cId = fd.get('classroomId') as string
        if (cId) payload.classroomId = cId
      }
    }

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('User created successfully')
        setAddModalOpen(false)
        fetchUsers()
        fetchGuardians()
      } else {
        toast.error('Failed to create user', json.error)
      }
    } catch (err: any) {
      toast.error('Error creating user', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Handle Edit User
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editUser) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)

    const finalRoles = editRoles.length > 0 ? editRoles : [editPrimaryRole]
    const payload: any = {
      fullName: (fd.get('fullName') as string)?.trim(),
      phone: (fd.get('phone') as string)?.trim() || null,
      role: editPrimaryRole,
      roles: finalRoles,
      primaryRole: editPrimaryRole,
    }

    const bId = fd.get('branchId') as string
    payload.branchId = bId || null

    if (finalRoles.includes('TEACHER')) {
      const cId = fd.get('classroomId') as string
      if (cId) payload.classroomId = cId
    }

    const desig = fd.get('designation') as string
    if (desig !== undefined) payload.designation = desig?.trim() || null

    const newPwd = fd.get('password') as string
    if (newPwd && newPwd.trim()) {
      payload.password = newPwd.trim()
    }

    try {
      const res = await fetch(`/api/v1/users/${editUser.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('User updated successfully')
        setEditUser(null)
        fetchUsers()
      } else {
        toast.error('Failed to update user', json.error)
      }
    } catch (err: any) {
      toast.error('Error updating user', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Handle Lifecycle Status Transitions (Suspend, Reactivate, Deactivate)
  const handleSetStatus = async (user: UserRecord, nextStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE', reason?: string) => {
    try {
      setBusy(true)
      const res = await fetch(`/api/v1/users/${user.userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`User marked as ${nextStatus.toLowerCase()}`)
        fetchUsers()
        if (viewUser && viewUser.userId === user.userId) {
          setViewUser({ ...viewUser, status: nextStatus })
        }
      } else {
        toast.error('Failed to update status', json.error)
      }
    } catch (err: any) {
      toast.error('Error updating status', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Bulk lifecycle status transition for selected rows
  const applyBulkStatus = async (nextStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') => {
    if (selected.length === 0) return
    setBusy(true)
    try {
      const results = await Promise.all(
        selected.map((id) =>
          fetch(`/api/v1/users/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus, reason: 'Bulk status change' }),
          }).then((r) => r.json()),
        ),
      )
      const okCount = results.filter((r) => r.success).length
      if (okCount === selected.length) {
        toast.success(`Users marked as ${nextStatus.toLowerCase()}`, `${okCount} account${okCount === 1 ? '' : 's'} updated`)
      } else {
        toast.error('Partial update', `${okCount} of ${selected.length} accounts updated`)
      }
      setSelected([])
      fetchUsers()
    } catch (err: any) {
      toast.error('Bulk update failed', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Handle Session Revocation across all devices
  const handleRevokeSessions = async (user: UserRecord) => {
    try {
      setBusy(true)
      const res = await fetch(`/api/v1/users/${user.userId}/revoke-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (json.success) {
        toast.success('All active sessions revoked. User has been signed out on all devices.')
      } else {
        toast.error('Failed to revoke sessions', json.error)
      }
    } catch (err: any) {
      toast.error('Error revoking sessions', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Define DataTable Columns
  const columns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'User / Identity',
      sortable: true,
      sortValue: (u) => u.name.toLowerCase(),
      export: (u) => u.name,
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={u.name} size="sm" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--c-ink)' }}>{u.name}</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={11} /> {u.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Roles & Staff ID',
      sortable: true,
      sortValue: (u) => (ROLE_META[u.role]?.label || u.role).toLowerCase(),
      export: (u) => (u.roles && u.roles.length > 0 ? u.roles.join(', ') : u.role),
      render: (u) => {
        const primaryMeta = ROLE_META[u.role] || { bg: 'rgba(100,116,139,0.12)', text: '#64748B', label: u.role }
        const allRoles: Role[] = u.roles && u.roles.length > 0 ? u.roles : [u.role]
        const additionalRoles = allRoles.filter((r) => r !== u.role)

        return (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: primaryMeta.bg,
                  color: primaryMeta.text,
                  border: `1px solid ${primaryMeta.text}33`,
                }}
                title="Primary System Role"
              >
                ★ {primaryMeta.label}
              </span>
              {additionalRoles.map((r) => {
                const rMeta = ROLE_META[r] || { bg: 'rgba(100,116,139,0.12)', text: '#64748B', label: r }
                return (
                  <span
                    key={r}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      borderRadius: 9999,
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: rMeta.bg,
                      color: rMeta.text,
                    }}
                  >
                    {rMeta.label.split(' / ')[0]}
                  </span>
                )
              })}
            </div>
            {u.staffProfile?.employeeCode && (
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 3, fontFamily: 'monospace' }}>
                EMP: {u.staffProfile.employeeCode} {u.staffProfile.designation ? `• ${u.staffProfile.designation}` : ''}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (u) => (
        <div style={{ fontSize: 13, color: u.phone ? 'var(--c-ink)' : 'var(--c-muted)' }}>
          {u.phone ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} style={{ color: 'var(--c-muted)' }} /> {u.phone}
            </span>
          ) : (
            '—'
          )}
        </div>
      ),
    },
    {
      key: 'affiliation',
      header: 'Scope / Assignment',
      render: (u) => {
        if (u.role === 'TEACHER') {
          return u.taughtClasses && u.taughtClasses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {u.taughtClasses.map((c) => (
                <span key={c.id} className="badge badge-purple" style={{ fontSize: 11 }}>
                  <BookOpen size={11} style={{ marginRight: 4 }} /> {c.name}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--c-muted)', fontStyle: 'italic' }}>Unassigned class</span>
          )
        }
        if (u.role === 'PARENT' && u.guardianProfile) {
          const count = u.guardianProfile.students?.length || 0
          return (
            <div style={{ fontSize: 12 }}>
              <span className="badge badge-teal" style={{ fontSize: 11 }}>
                <Baby size={11} style={{ marginRight: 4 }} /> {count} {count === 1 ? 'Child' : 'Children'}
              </span>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                {u.guardianProfile.students?.map((s) => s.name).join(', ') || 'No wards linked'}
              </div>
            </div>
          )
        }
        if (u.staffProfile?.designation) {
          return <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{u.staffProfile.designation}</span>
        }
        return <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>—</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      export: (u) => u.status,
      filter: {
        placeholder: 'Filter by status',
        get: (u) => u.status,
        options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'SUSPENDED', label: 'Suspended' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'PENDING', label: 'Pending' },
        ],
      },
      render: (u) => {
        const s = STATUS_BADGES[u.status] || { bg: 'rgba(100,116,139,0.12)', text: '#64748B', label: u.status }
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: s.bg,
              color: s.text,
            }}
          >
            {s.label}
          </span>
        )
      },
    },
    {
      key: 'lastLogin',
      header: 'Last Active',
      sortable: true,
      sortValue: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0),
      export: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : ''),
      render: (u) => (
        <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never logged in'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      hideable: false,
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm"
            title="Inspect Details & Permissions"
            onClick={(e) => {
              e.stopPropagation()
              setViewUser(u)
              setViewTab('overview')
            }}
          >
            <Eye size={14} /> View
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title="Edit User"
            onClick={(e) => {
              e.stopPropagation()
              openEditModal(u)
            }}
          >
            <Edit3 size={14} /> Edit
          </button>
          {u.status === 'ACTIVE' ? (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#DC2626' }}
              title="Suspend Access"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmSuspend(u)
              }}
            >
              <Ban size={14} /> Suspend
            </button>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#059669' }}
              title="Reactivate Access"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmReactivate(u)
              }}
            >
              <Check size={14} /> Activate
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="page-shell">
      <PageHead
        title="Users & Access"
        sub="Central identity and RBAC management for educators, parents, and administrative staff"
        actions={
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <UserPlus size={16} /> Add User
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Segmented
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { key: 'ALL', label: `All (${users?.length ?? 0})` },
              { key: 'STAFF', label: 'All Staff' },
              { key: 'TEACHER', label: 'Teachers' },
              { key: 'PARENT', label: 'Parents' },
              { key: 'PRINCIPAL', label: 'Principals' },
              { key: 'ACCOUNTS', label: 'Accounts' },
            ]}
          />

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--c-muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by name, email, ward, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users DataTable */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyTitle="No users found"
          emptyMessage={search ? 'Try adjusting your search query or role filter.' : 'Add your first educator or school administrator.'}
          emptyAction={
            <button className="btn btn-primary btn-sm" onClick={() => setAddModalOpen(true)}>
              <UserPlus size={14} /> Add User
            </button>
          }
          paginate
          defaultPageSize={10}
          exportFileName="users.csv"
          rowSelection
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={
            <>
              <button
                className="btn btn-ghost btn-sm"
                disabled={selected.length === 0}
                style={{ color: '#DC2626' }}
                onClick={() => applyBulkStatus('SUSPENDED')}
              >
                <Ban size={14} /> Suspend
              </button>
              <button
                className="btn btn-ghost btn-sm"
                disabled={selected.length === 0}
                style={{ color: '#059669' }}
                onClick={() => applyBulkStatus('ACTIVE')}
              >
                <Check size={14} /> Activate
              </button>
            </>
          }
          footer={
            users ? (
              <span>
                Active <b>{users.filter((u) => u.status === 'ACTIVE').length}</b>
                <span className="t-caption" style={{ margin: '0 8px' }}>·</span>
                Suspended <b>{users.filter((u) => u.status === 'SUSPENDED').length}</b>
                <span className="t-caption" style={{ margin: '0 8px' }}>·</span>
                Inactive <b>{users.filter((u) => u.status === 'INACTIVE').length}</b>
              </span>
            ) : null
          }
          onRowClick={(row) => {
            setViewUser(row)
            setViewTab('overview')
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* USER DETAIL INSPECTOR MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title={viewUser?.name || 'User Profile'}
        subtitle={viewUser ? `Account ID: ${viewUser.userId}` : undefined}
        icon={<UserCheck size={20} />}
        iconClass="ic-purple"
        wide
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {viewUser?.status === 'ACTIVE' ? (
                <button
                  className="btn btn-destructive btn-sm"
                  onClick={() => {
                    if (viewUser) setConfirmSuspend(viewUser)
                  }}
                >
                  <Ban size={14} /> Suspend Account
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (viewUser) setConfirmReactivate(viewUser)
                  }}
                >
                  <Check size={14} /> Reactivate Account
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (viewUser) setConfirmRevoke(viewUser)
                }}
              >
                <LogOut size={14} /> Sign Out All Devices
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (viewUser) {
                    const target = viewUser
                    setViewUser(null)
                    openEditModal(target)
                  }
                }}
              >
                <Edit3 size={14} /> Edit User
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewUser(null)}>
                Close
              </button>
            </div>
          </div>
        }
      >
        {viewUser && (
          <div>
            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', marginBottom: 16 }}>
              <button
                type="button"
                className={`tab-btn ${viewTab === 'overview' ? 'tab-active' : ''}`}
                onClick={() => setViewTab('overview')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: viewTab === 'overview' ? '2px solid var(--c-primary)' : '2px solid transparent',
                  fontWeight: viewTab === 'overview' ? 600 : 400,
                  cursor: 'pointer',
                  color: viewTab === 'overview' ? 'var(--c-primary)' : 'var(--c-muted)',
                }}
              >
                Overview
              </button>
              <button
                type="button"
                className={`tab-btn ${viewTab === 'permissions' ? 'tab-active' : ''}`}
                onClick={() => setViewTab('permissions')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: viewTab === 'permissions' ? '2px solid var(--c-primary)' : '2px solid transparent',
                  fontWeight: viewTab === 'permissions' ? 600 : 400,
                  cursor: 'pointer',
                  color: viewTab === 'permissions' ? 'var(--c-primary)' : 'var(--c-muted)',
                }}
              >
                Roles & Effective Permissions
              </button>
              <button
                type="button"
                className={`tab-btn ${viewTab === 'person' ? 'tab-active' : ''}`}
                onClick={() => setViewTab('person')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: viewTab === 'person' ? '2px solid var(--c-primary)' : '2px solid transparent',
                  fontWeight: viewTab === 'person' ? 600 : 400,
                  cursor: 'pointer',
                  color: viewTab === 'person' ? 'var(--c-primary)' : 'var(--c-muted)',
                }}
              >
                {viewUser.role === 'PARENT' ? 'Linked Children / Wards' : 'Linked Staff & Classes'}
              </button>
              <button
                type="button"
                className={`tab-btn ${viewTab === 'security' ? 'tab-active' : ''}`}
                onClick={() => setViewTab('security')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: viewTab === 'security' ? '2px solid var(--c-primary)' : '2px solid transparent',
                  fontWeight: viewTab === 'security' ? 600 : 400,
                  cursor: 'pointer',
                  color: viewTab === 'security' ? 'var(--c-primary)' : 'var(--c-muted)',
                }}
              >
                Security & Session
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {viewTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Identity Profile
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Avatar name={viewUser.name} size="lg" />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{viewUser.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>{viewUser.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--c-muted)' }}>Phone Number:</span>
                      <span style={{ fontWeight: 500 }}>{viewUser.phone || 'Not provided'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--c-muted)' }}>Account Status:</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: STATUS_BADGES[viewUser.status]?.text,
                        }}
                      >
                        {STATUS_BADGES[viewUser.status]?.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--c-muted)' }}>Created Date:</span>
                      <span>{new Date(viewUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Institutional Role
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: 13,
                        fontWeight: 600,
                        backgroundColor: ROLE_META[viewUser.role]?.bg,
                        color: ROLE_META[viewUser.role]?.text,
                      }}
                    >
                      {ROLE_META[viewUser.role]?.label || viewUser.role}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', lineHeight: 1.5 }}>
                    {ROLE_META[viewUser.role]?.desc}
                  </p>
                  {viewUser.branchId && (
                    <div style={{ marginTop: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building size={14} style={{ color: 'var(--c-muted)' }} />
                      <span>Assigned Branch: <strong>{branches.find((b) => b.id === viewUser.branchId)?.name || viewUser.branchId}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ROLES & EFFECTIVE PERMISSIONS */}
            {viewTab === 'permissions' && (() => {
              const activeRoles: Role[] =
                viewUser.roles && viewUser.roles.length > 0 ? viewUser.roles : [viewUser.role]
              const isOwner = activeRoles.includes('OWNER')
              const allPerms = isOwner
                ? ['*']
                : Array.from(new Set(activeRoles.flatMap((r) => ROLE_PERMISSIONS[r] || [])))

              return (
                <div>
                  <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--c-muted)' }}>
                    Showing effective permissions union across {activeRoles.length} assigned roles:{' '}
                    <span style={{ fontWeight: 600, color: 'var(--c-ink)' }}>{activeRoles.join(', ')}</span>.
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 8,
                      maxHeight: 320,
                      overflowY: 'auto',
                      padding: 8,
                      background: 'var(--c-subtle)',
                      borderRadius: 8,
                    }}
                  >
                    {allPerms.map((perm) => (
                      <div
                        key={perm}
                        style={{
                          padding: '6px 10px',
                          background: '#fff',
                          borderRadius: 6,
                          border: '1px solid var(--c-border)',
                          fontSize: 12,
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Shield size={12} style={{ color: 'var(--c-primary)' }} />
                        <span>{perm === '*' ? 'ALL_PERMISSIONS (*)' : perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* TAB: LINKED PERSON / CHILDREN / CLASSES */}
            {viewTab === 'person' && (
              <div>
                {(viewUser.roles?.includes('PARENT') || viewUser.role === 'PARENT') ? (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                      Linked Wards & Children ({viewUser.guardianProfile?.students?.length || 0})
                    </div>
                    {viewUser.guardianProfile?.students && viewUser.guardianProfile.students.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                        {viewUser.guardianProfile.students.map((child) => (
                          <div key={child.id} className="card" style={{ padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Baby size={18} style={{ color: 'var(--c-primary)' }} />
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{child.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--c-muted)', fontFamily: 'monospace' }}>
                                  ADM: {child.admissionNo}
                                </div>
                              </div>
                            </div>
                            {child.canPickup && (
                              <div style={{ marginTop: 8, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                                Authorized for pickup
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--c-muted)', fontSize: 13 }}>No student records linked to this parent profile.</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Staff Employment & Workforce Profile</div>
                      <span className="badge badge-teal" style={{ fontSize: 11 }}>Connected to HR</span>
                    </div>
                    {viewUser.staffProfile ? (
                      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Employee Code:</span>{' '}
                            <strong>{viewUser.staffProfile.employeeCode}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Designation:</span>{' '}
                            <strong>{viewUser.staffProfile.designation || 'Staff'}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Qualification:</span>{' '}
                            <span>{viewUser.staffProfile.qualification || 'Not specified'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--c-muted)' }}>Employment Type:</span>{' '}
                            <span>{viewUser.staffProfile.employmentType || 'FULL_TIME'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--c-muted)', fontSize: 13, marginBottom: 16 }}>
                        No staff profile record attached to this user.
                      </div>
                    )}

                    {viewUser.role === 'TEACHER' && (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Assigned Classrooms (Primary Educator)</div>
                        {viewUser.taughtClasses && viewUser.taughtClasses.length > 0 ? (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {viewUser.taughtClasses.map((cls) => (
                              <div key={cls.id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={16} style={{ color: '#7C3AED' }} />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{cls.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>Program: {cls.programType}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--c-muted)', fontSize: 13 }}>
                            This teacher currently has no primary classroom assigned. Edit user to assign a class.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: SECURITY & SESSION */}
            {viewTab === 'security' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={16} /> Temporary Password & Credentials
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 10 }}>
                    Passwords cannot be viewed in plaintext once hashed. You can issue a new password or temporary password for this user anytime through Edit User.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (viewUser) {
                        const target = viewUser
                        setViewUser(null)
                        openEditModal(target)
                      }
                    }}
                  >
                    Reset Password
                  </button>
                </div>

                <div className="card" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LogOut size={16} /> Active Session Invalidation
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 10 }}>
                    If this user lost their mobile device or is suspected of unauthorized access, force an immediate sign-out across all mobile apps and web browsers.
                  </p>
                  <button
                    className="btn btn-destructive btn-sm"
                    onClick={() => setConfirmRevoke(viewUser)}
                  >
                    <LogOut size={14} /> Revoke All Active Sessions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* ADD USER MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New User"
        subtitle="Create an identity with role-based preschool access"
        icon={<UserPlus size={20} />}
        iconClass="ic-purple"
        wide
      >
        <form onSubmit={handleAddUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Field label="Full Name" required>
              <input type="text" name="fullName" className="input" placeholder="e.g. Priya Sharma" required />
            </Field>

            <Field label="Email Address" required>
              <input type="email" name="email" className="input" placeholder="e.g. priya@preschool.edu" required />
            </Field>

            <Field label="Phone Number">
              <input type="tel" name="phone" className="input" placeholder="e.g. +91 98765 43210" />
            </Field>

            <Field label="Temporary Password" required helper="Minimum 6 characters">
              <input type="password" name="password" className="input" required minLength={6} placeholder="******" />
            </Field>

            <Field label="Primary System Role" required helper="Defines default dashboard theme and primary role badge">
              <select
                className="input"
                value={selectedRole}
                onChange={(e) => {
                  const newPrimary = e.target.value as Role
                  setSelectedRole(newPrimary)
                  if (!addRoles.includes(newPrimary)) {
                    setAddRoles([...addRoles, newPrimary])
                  }
                }}
              >
                <option value="TEACHER">Teacher / Educator</option>
                <option value="PRINCIPAL">Principal / Center Head</option>
                <option value="COORDINATOR">Academic Coordinator</option>
                <option value="ACCOUNTS">Finance / Accounts</option>
                <option value="RECEPTION">Front Desk / Reception</option>
                <option value="PARENT">Parent / Guardian</option>
                <option value="OWNER">School Owner</option>
              </select>
            </Field>

            <Field label="Branch Scope">
              <select name="branchId" className="input">
                <option value="">All Branches / Main Campus</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* MULTI-ROLE ASSIGNMENT CHECKBOXES */}
          <div className="card" style={{ padding: 12, marginBottom: 16, backgroundColor: 'var(--c-bg-subtle, rgba(0,0,0,0.02))' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={15} style={{ color: 'var(--c-primary, #7C3AED)' }} /> Assigned Roles & Permission Bundles (Multi-Role)
            </div>
            <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 8 }}>
              Check all roles to grant the union of their permissions. Primary role determines default profile UX:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {(['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'PARENT', 'OWNER'] as Role[]).map((r) => {
                const isChecked = addRoles.includes(r)
                const isPrimary = selectedRole === r
                return (
                  <label
                    key={r}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: isPrimary ? 700 : 500,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: isChecked ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAddRoles([...addRoles, r])
                        } else {
                          if (addRoles.length > 1) {
                            const next = addRoles.filter((item) => item !== r)
                            setAddRoles(next)
                            if (selectedRole === r) setSelectedRole(next[0])
                          }
                        }
                      }}
                    />
                    <span>{ROLE_META[r]?.label.split(' / ')[0] || r}</span>
                    {isPrimary && <span style={{ fontSize: 10, color: '#7C3AED', marginLeft: 'auto' }}>★ Primary</span>}
                  </label>
                )
              })}
            </div>
          </div>

          {/* DYNAMIC ROLE FIELDS */}
          {selectedRole === 'PARENT' ? (
            <div className="card" style={{ padding: 14, backgroundColor: 'rgba(99, 102, 241, 0.05)', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Baby size={16} /> Link Registered Guardian
              </div>
              <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 10 }}>
                Select an existing guardian recorded during admissions to link their student wards to this login account:
              </p>
              <Field label="Select Guardian">
                <select name="guardianId" className="input">
                  <option value="">-- Standalone Parent Account (Link later) --</option>
                  {guardians
                    .filter((g) => !g.hasAccount)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.fullName} ({g.relationship}) - {g.children?.map((c) => c.name).join(', ') || 'No wards'}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
          ) : (
            <div className="card" style={{ padding: 14, backgroundColor: 'rgba(124, 58, 237, 0.05)', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={16} /> Staff Employment Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Employee Code">
                  <input type="text" name="employeeCode" className="input" placeholder="e.g. EMP-101" />
                </Field>
                <Field label="Designation">
                  <input type="text" name="designation" className="input" placeholder="e.g. Senior Nursery Educator" />
                </Field>
              </div>

              {selectedRole === 'TEACHER' && (
                <div style={{ marginTop: 10 }}>
                  <Field label="Primary Classroom Assignment">
                    <select name="classroomId" className="input">
                      <option value="">-- Assign Classroom Later --</option>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.programType ? `(${c.programType})` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        subtitle={editUser?.email}
        icon={<Edit3 size={20} />}
        iconClass="ic-blue"
      >
        {editUser && (
          <form onSubmit={handleEditUser}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Full Name" required>
                <input type="text" name="fullName" defaultValue={editUser.name} className="input" required />
              </Field>

              <Field label="Phone Number">
                <input type="tel" name="phone" defaultValue={editUser.phone || ''} className="input" />
              </Field>

              <Field label="Primary Role" required helper="Primary role displayed on profile and badges">
                <select
                  name="role"
                  value={editPrimaryRole}
                  onChange={(e) => {
                    const newPrimary = e.target.value as Role
                    setEditPrimaryRole(newPrimary)
                    if (!editRoles.includes(newPrimary)) {
                      setEditRoles([...editRoles, newPrimary])
                    }
                  }}
                  className="input"
                >
                  <option value="TEACHER">Teacher / Educator</option>
                  <option value="PRINCIPAL">Principal / Center Head</option>
                  <option value="COORDINATOR">Academic Coordinator</option>
                  <option value="ACCOUNTS">Finance / Accounts</option>
                  <option value="RECEPTION">Front Desk / Reception</option>
                  <option value="PARENT">Parent / Guardian</option>
                  <option value="OWNER">School Owner</option>
                </select>
              </Field>

              {/* MULTI-ROLE ASSIGNMENT CHECKBOXES FOR EDIT */}
              <div className="card" style={{ padding: 12, backgroundColor: 'var(--c-bg-subtle, rgba(0,0,0,0.02))' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={15} style={{ color: 'var(--c-primary, #7C3AED)' }} /> Assigned Roles (Multi-Role Permissions Union)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
                  {(['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'PARENT', 'OWNER'] as Role[]).map((r) => {
                    const isChecked = editRoles.includes(r)
                    const isPrimary = editPrimaryRole === r
                    return (
                      <label
                        key={r}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: isPrimary ? 700 : 500,
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: 6,
                          backgroundColor: isChecked ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditRoles([...editRoles, r])
                            } else {
                              if (editRoles.length > 1) {
                                const next = editRoles.filter((item) => item !== r)
                                setEditRoles(next)
                                if (editPrimaryRole === r) setEditPrimaryRole(next[0])
                              }
                            }
                          }}
                        />
                        <span>{ROLE_META[r]?.label.split(' / ')[0] || r}</span>
                        {isPrimary && <span style={{ fontSize: 9, color: '#7C3AED', marginLeft: 'auto' }}>★ Primary</span>}
                      </label>
                    )
                  })}
                </div>
              </div>

              {(!editRoles.includes('PARENT') || editUser.staffProfile) && (
                <Field label="Workforce Designation" helper="Stored on StaffProfile — e.g. Storekeeper, Senior Teacher, Driver, Helper">
                  <input
                    type="text"
                    name="designation"
                    defaultValue={editUser.staffProfile?.designation || ''}
                    className="input"
                    placeholder="e.g. Storekeeper / Senior Educator"
                  />
                </Field>
              )}

              <Field label="Branch Scope">
                <select name="branchId" defaultValue={editUser.branchId || ''} className="input">
                  <option value="">All Branches / Main Campus</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </Field>

              {editRoles.includes('TEACHER') && (
                <Field label="Primary Classroom Assignment">
                  <select
                    name="classroomId"
                    defaultValue={editUser.taughtClasses?.[0]?.id || ''}
                    className="input"
                  >
                    <option value="">-- No Class / Keep Existing --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.programType ? `(${c.programType})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Change Password" helper="Leave blank to keep existing password">
                <input
                  type="password"
                  name="password"
                  minLength={6}
                  className="input"
                  placeholder="Enter new password (optional)"
                />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* CONFIRM MODALS FOR ACTIONS */}
      {/* ========================================================================= */}
      <ConfirmModal
        open={!!confirmSuspend}
        onClose={() => setConfirmSuspend(null)}
        onConfirm={() => {
          if (confirmSuspend) handleSetStatus(confirmSuspend, 'SUSPENDED')
        }}
        title="Suspend User Account"
        message={`Are you sure you want to suspend ${confirmSuspend?.name}? Suspended accounts immediately lose access to mobile and web dashboards.`}
        confirmLabel="Suspend User"
        danger
      />

      <ConfirmModal
        open={!!confirmReactivate}
        onClose={() => setConfirmReactivate(null)}
        onConfirm={() => {
          if (confirmReactivate) handleSetStatus(confirmReactivate, 'ACTIVE')
        }}
        title="Reactivate User Account"
        message={`Reactivate ${confirmReactivate?.name}'s account? The user will immediately be able to sign in again.`}
        confirmLabel="Activate User"
      />

      <ConfirmModal
        open={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => {
          if (confirmRevoke) handleRevokeSessions(confirmRevoke)
        }}
        title="Sign Out All Devices"
        message={`Force sign out ${confirmRevoke?.name} from all web browsers, tablets, and mobile applications? Active auth sessions will be invalidated immediately.`}
        confirmLabel="Sign Out Devices"
        danger
      />
    </div>
  )
}
