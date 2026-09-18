'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Briefcase, Search, UserPlus, FileSpreadsheet, Download, RefreshCw,
  Building, Phone, Mail, MoreHorizontal, Edit3, Shield, Eye, Lock,
  ChevronLeft, AlertCircle, ArrowUpDown, GraduationCap, Users, X
} from 'lucide-react'
import { Avatar, StatusBadge, EmptyState, KpiTile, PageHead } from '@/components/preone/ui'
import { EmptyUsersIllustration } from '@/components/preone'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { useToast } from '@/components/preone/Toast'
import { AddStaffModal } from '@/components/users/AddStaffModal'
import { CsvImportModal } from '@/components/users/CsvImportModal'
import { User360Drawer } from '@/components/users/User360Drawer'
import { EditUserModal } from '@/components/users/EditUserModal'
import { RolesDirectoryModal } from '@/components/users/RolesDirectoryModal'
import {
  UserRecord, BranchOption, ClassroomOption, Role,
  CANONICAL_STAFF_ROLES, ROLE_BADGE
} from '@/components/users/types'
import { timeAgo, fmtDate } from '@/lib/format'

export default function StaffUsersPage() {
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)

  // Modals
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
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

  // KPIs
  const kpis = useMemo(() => {
    const active = users.filter((u) => u.status === 'ACTIVE').length
    const teachers = users.filter((u) => u.role === 'TEACHER').length
    const helpers = users.filter((u) => u.role === 'HELPER').length
    const admins = users.filter((u) => ['OWNER', 'PRINCIPAL', 'ACCOUNTANT', 'HR'].includes(u.role)).length
    return { active, teachers, helpers, admins }
  }, [users])

  // Columns definition for DataTable
  const columns: Column<UserRecord>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} size="md" />
          <div>
            <div className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setViewingUser(u)}>
              {u.name}
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              @{u.username || u.email.split('@')[0]}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Title',
      sortable: true,
      render: (u) => {
        const badge = ROLE_BADGE[u.role] || { cls: 'b-neutral', label: u.role }
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
      header: 'Contact',
      render: (u) => (
        <div className="text-xs space-y-0.5">
          <div className="text-gray-700 dark:text-gray-300 font-mono flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-gray-400" />
            {u.email}
          </div>
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
      header: 'Campus Branch',
      render: (u) => {
        const branch = branches.find((b) => b.id === u.branchId)
        return (
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-gray-400" />
            {branch ? `${branch.name} (${branch.code})` : 'All Campuses'}
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
      render: (u) => (
        <span className="text-xs text-gray-500">
          {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="View 360 Profile"
            onClick={() => setViewingUser(u)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Edit Staff Member"
            onClick={() => setEditingUser(u)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/app' },
          { label: 'Users & Access', href: '/app/users' },
          { label: 'Staff Users' },
        ]}
      />

      {/* Page Header */}
      <PageHead
        title="Staff Users"
        sub="Preschool workforce directory: Teachers, Helpers, Principals, Accountants, HR, and Drivers"
        backHref="/app/users"
        actions={
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={fetchStaff}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-card hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Refresh list"
              aria-label="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setRolesModalOpen(true)}
              className="btn btn-secondary text-xs flex items-center justify-center gap-1.5 py-2 px-3 shrink-0"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Roles Directory</span>
            </button>
            <button
              type="button"
              onClick={() => setCsvModalOpen(true)}
              className="btn btn-secondary text-xs flex items-center justify-center gap-1.5 py-2 px-3 shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk Import Staff</span>
            </button>
            <button
              type="button"
              onClick={() => setAddStaffOpen(true)}
              className="btn btn-primary text-xs flex items-center justify-center gap-1.5 py-2 px-3.5 shadow-sm font-semibold shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Staff User</span>
            </button>
          </div>
        }
      />

      {/* 4-Box KPI Strip (Single cohesive line on desktop & laptops) */}
      <div className="kpi-row kpi-4">
        <KpiTile
          label="Total Staff"
          value={total}
          meta={`${kpis.active} active on payroll`}
          icon={<Briefcase />}
          iconClass="ic-purple"
          variant="compact"
        />
        <KpiTile
          label="Teachers / Guides"
          value={kpis.teachers}
          meta="Classroom educators"
          icon={<GraduationCap />}
          iconClass="ic-blue"
          variant="compact"
        />
        <KpiTile
          label="Classroom Helpers"
          value={kpis.helpers}
          meta="Operational support"
          icon={<Users />}
          iconClass="ic-green"
          variant="compact"
        />
        <KpiTile
          label="Campus Leadership"
          value={kpis.admins}
          meta="Principals, HR & Accounts"
          icon={<Shield />}
          iconClass="ic-orange"
          variant="compact"
        />
      </div>

      {/* Filter Bar */}
      <div className="card card-compact" style={{ borderRadius: 'var(--radius-xl)', padding: '12px 16px' }}>
        <div className="filter-row">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, email, phone, role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              style={{ paddingLeft: '36px', paddingRight: search ? '32px' : '14px' }}
              className="input w-full text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="w-48 shrink-0">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setPage(1)
              }}
              className="select w-full text-xs"
            >
              <option value="ALL">All Staff Roles</option>
              {CANONICAL_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_BADGE[r]?.label || r}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="w-48 shrink-0">
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value)
                setPage(1)
              }}
              className="select w-full text-xs"
            >
              <option value="ALL">All Campus Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-36 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="select w-full text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          {/* Export CSV */}
          <a
            href="/api/v1/users/export?role=STAFF"
            className="btn btn-outline text-xs flex items-center justify-center gap-1.5 py-2 px-3 shrink-0"
            download
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </a>

          {(search || selectedRole !== 'ALL' || selectedBranch !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedRole('ALL')
                setSelectedBranch('ALL')
                setSelectedStatus('ALL')
                setPage(1)
              }}
              className="btn btn-ghost text-xs py-2 px-2.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
              title="Reset filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Staff DataTable Workspace */}
      <div className="table-workspace">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyIcon={<EmptyUsersIllustration size={120} />}
          emptyTitle="No staff members found"
          emptyMessage="No staff records match your selected role, branch, status, or search query."
        />

        {/* Pagination Strip */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500" style={{ background: 'var(--bg-subtle)' }}>
          <span className="text-center sm:text-left">
            Showing {users.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(page * pageSize, total)} of {total} staff members
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary text-xs px-2.5 py-1"
            >
              Previous
            </button>
            <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold px-2">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
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

      {/* Modals */}
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
        onSuccess={fetchStaff}
      />

      <RolesDirectoryModal
        open={rolesModalOpen}
        onClose={() => setRolesModalOpen(false)}
      />
    </div>
  )
}
