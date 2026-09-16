'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Users, UserPlus, Search, Phone, CheckCircle2,
  Edit3, Baby, Shield, Eye, LogOut, Ban, Check, Building,
  Clock, Download, SlidersHorizontal, ChevronRight,
  FileSpreadsheet, Upload, RefreshCw, AlertTriangle, AlertCircle, FileDown, Layers, Rows3, KeyRound
} from 'lucide-react'
import { Avatar, Segmented, Skeleton, Field, PageHead, StatusBadge, EmptyState } from '@/components/preone/ui'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { Modal, ConfirmModal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { ROLE_PERMISSIONS, Role } from '@/lib/auth'
import { fmtDate, fmtDateTime, timeAgo } from '@/lib/format'

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

const VALID_CATEGORY_TABS: string[] = ['ALL', 'STAFF', 'TEACHER', 'PARENT', 'PRINCIPAL', 'ACCOUNTS', 'GUARDIAN', 'PENDING']
const VALID_STATUS_FILTERS: string[] = ['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']

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
  const searchParams = useSearchParams()

  // Filters
  const [categoryTab, setCategoryTab] = useState<'ALL' | 'STAFF' | 'TEACHER' | 'PARENT' | 'PRINCIPAL' | 'ACCOUNTS' | 'GUARDIAN' | 'PENDING'>(
    () => {
      const t = searchParams.get('tab')
      return t && VALID_CATEGORY_TABS.includes(t) ? (t as any) : 'ALL'
    },
  )
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status')
    return s && VALID_STATUS_FILTERS.includes(s) ? s : 'ALL'
  })
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')
  const [tableDensity, setTableDensity] = useState<'cozy' | 'compact'>('compact')

  // Drill-through from the shell needs-attention panel (?tab=PENDING / ?status=SUSPENDED)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && VALID_CATEGORY_TABS.includes(tab)) setCategoryTab(tab as any)
    const status = searchParams.get('status')
    if (status && VALID_STATUS_FILTERS.includes(status)) setStatusFilter(status)
  }, [searchParams])

  // Server-side pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Category tab counts (from server meta.tabs)
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    ALL: 0, STAFF: 0, TEACHER: 0, PARENT: 0, PRINCIPAL: 0, ACCOUNTS: 0, GUARDIAN: 0, PENDING: 0,
  })

  // Add-mode (direct create vs invitation) + password reset
  const [addMode, setAddMode] = useState<'CREATE' | 'INVITE'>('CREATE')
  const [resetPwUser, setResetPwUser] = useState<UserRecord | null>(null)
  const [resetPwValue, setResetPwValue] = useState('')

  // Fresh 360 detail (fetched on modal open)
  const [viewDetail, setViewDetail] = useState<UserRecord | null>(null)
  const [viewDetailLoading, setViewDetailLoading] = useState(false)

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

  // Auto-open the add-user modal when the command palette jumps here (?open=ADD)
  useEffect(() => {
    if (searchParams.get('open') === 'ADD') {
      setAddModalOpen(true)
    }
  }, [searchParams])

  const [rolesModalOpen, setRolesModalOpen] = useState(false)
  const [rolesMatrix, setRolesMatrix] = useState<any[]>(DEFAULT_ROLES_MATRIX)
  const [groupsModalOpen, setGroupsModalOpen] = useState(false)

  // CSV Manager Modal State
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvMode, setCsvMode] = useState<'CREATE' | 'UPDATE' | 'DELETE'>('CREATE')
  const [csvOverwrite, setCsvOverwrite] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvRawText, setCsvRawText] = useState('')
  const [csvParsedRows, setCsvParsedRows] = useState<any[]>([])
  const [csvValidating, setCsvValidating] = useState(false)
  const [csvExecuting, setCsvExecuting] = useState(false)
  const [csvValidationResult, setCsvValidationResult] = useState<any | null>(null)
  const [csvApplyValidOnly, setCsvApplyValidOnly] = useState(false)
  const [confirmCsvDelete, setConfirmCsvDelete] = useState(false)

  // Bulk Modals
  const [bulkModalAction, setBulkModalAction] = useState<string | null>(null)
  const [bulkRole, setBulkRole] = useState<Role>('TEACHER')
  const [bulkBranchId, setBulkBranchId] = useState('')
  const [bulkDesignation, setBulkDesignation] = useState('')

  // Bulk Overwrite Modal State
  const [bulkOverwriteOpen, setBulkOverwriteOpen] = useState(false)
  const [bulkOverwriteRole, setBulkOverwriteRole] = useState<string>('')
  const [bulkOverwriteBranchId, setBulkOverwriteBranchId] = useState<string>('')
  const [bulkOverwriteDesignation, setBulkOverwriteDesignation] = useState<string>('')
  const [bulkOverwriteDepartment, setBulkOverwriteDepartment] = useState<string>('')
  const [bulkOverwriteStatus, setBulkOverwriteStatus] = useState<string>('')
  const [bulkOverwriteFields, setBulkOverwriteFields] = useState<{
    role: boolean
    branch: boolean
    designation: boolean
    department: boolean
    status: boolean
  }>({ role: false, branch: false, designation: false, department: false, status: false })

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
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('activeTab', categoryTab)

      // Map active category tab onto server filters (mutually exclusive with the role/status/type dropdowns)
      if (categoryTab === 'PENDING') {
        params.set('status', 'PENDING')
      } else if (categoryTab === 'STAFF') {
        params.set('userType', 'STAFF')
      } else if (categoryTab === 'GUARDIAN') {
        params.set('userType', 'PARENT')
      } else if (categoryTab === 'TEACHER' || categoryTab === 'PARENT' || categoryTab === 'PRINCIPAL' || categoryTab === 'ACCOUNTS') {
        params.set('role', categoryTab)
      } else {
        if (roleFilter !== 'ALL') params.set('role', roleFilter)
        if (statusFilter !== 'ALL') params.set('status', statusFilter)
        if (userTypeFilter !== 'ALL') params.set('userType', userTypeFilter)
      }

      if (branchFilter !== 'ALL') params.set('branchId', branchFilter)
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`/api/v1/users?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setUsers(json.data)
        if (json.meta?.kpis) {
          setKpis(json.meta.kpis)
        }
        if (json.meta?.tabs) {
          setTabCounts(json.meta.tabs)
        }
        setTotal(json.meta?.total ?? 0)
        setTotalPages(json.meta?.totalPages ?? 1)
      } else {
        setUsers([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch {
      toast.error('Failed to load users')
      setUsers([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [categoryTab, roleFilter, statusFilter, branchFilter, userTypeFilter, search, page, pageSize, toast])

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

  // Debounced search: commit input only after 300ms of inactivity
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Any filter/tab/search change resets navigation to the first page
  useEffect(() => {
    setPage(1)
  }, [categoryTab, roleFilter, statusFilter, branchFilter, userTypeFilter, search])

  useEffect(() => {
    fetchUsers()
    fetchMetadata()
    fetchRolesDirectory()
  }, [fetchUsers, fetchMetadata, fetchRolesDirectory])

  // Rows are filtered & paginated server-side (category tab drives the query);
  // counts for each category tab come from the API response meta.tabs.

  // Map rows for DataTable with id set to userId
  const tableData = useMemo(() => {
    return (users || []).map((u) => ({
      ...u,
      id: u.userId,
    }))
  }, [users])

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const fullName = fd.get('fullName') as string
    const email = fd.get('email') as string
    const phone = fd.get('phone') as string
    const password = (fd.get('password') as string) || 'Preone@123'
    const role = fd.get('role') as Role
    const branchId = fd.get('branchId') as string
    const designation = fd.get('designation') as string
    const isInvite = addMode === 'INVITE'

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
          isInvite,
          status: isInvite ? 'PENDING' : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        if (isInvite) {
          toast.success('Invitation sent', `${fullName} was added as a pending invitation`)
        } else {
          toast.success('User created successfully', `${fullName} has been provisioned`)
        }
        setAddModalOpen(false)
        setAddMode('CREATE')
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

  // Open the 360 modal and fetch fresh detail from the API for up-to-date data
  const openViewModal = useCallback(async (u: UserRecord) => {
    setViewingUser(u)
    setViewDetail(null)
    setViewModalOpen(true)
    setViewDetailLoading(true)
    try {
      const res = await fetch(`/api/v1/users/${u.userId}`)
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        setViewDetail({
          ...u,
          id: d.id ?? u.id,
          userId: d.userId ?? u.userId,
          name: d.fullName ?? u.name,
          email: d.email ?? u.email,
          phone: d.phone ?? u.phone,
          role: d.role ?? u.role,
          roles: d.roles ?? u.roles,
          status: d.status ?? u.status,
          branchId: d.branchId ?? u.branchId,
          lastLoginAt: d.lastLoginAt ?? u.lastLoginAt,
          createdAt: d.createdAt ?? u.createdAt,
          staffProfile: d.staffProfile ?? u.staffProfile ?? null,
          taughtClasses: d.taughtClasses ?? u.taughtClasses,
          guardianProfile: d.guardianProfile ?? u.guardianProfile ?? null,
        })
      }
    } catch {
      // fall back to the row snapshot data
    } finally {
      setViewDetailLoading(false)
    }
  }, [])

  // Reset a user's login password
  const handleResetPassword = async () => {
    if (!resetPwUser || resetPwValue.trim().length < 6) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/users/${resetPwUser.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPwValue.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Password reset complete', `${resetPwUser.name} can now sign in with the new password`)
        setResetPwUser(null)
        setResetPwValue('')
      } else {
        toast.error(json.error?.message || 'Failed to reset password')
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

  // Parse CSV Client-Side Helper
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return { headers: [], rows: [] }

    const parseLine = (line: string): string[] => {
      const result: string[] = []
      let cur = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += char
        }
      }
      result.push(cur.trim())
      return result
    }

    const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim())
    const rows = lines.slice(1).map((line, idx) => {
      const values = parseLine(line)
      const obj: any = { rowNumber: idx + 2 }
      headers.forEach((h, i) => {
        if (values[i] !== undefined) {
          obj[h] = values[i]
        }
      })
      return obj
    })

    return { headers, rows }
  }

  // Handle CSV file selection
  const handleCsvFileSelected = (file: File) => {
    setCsvFile(file)
    setCsvValidationResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = (e.target?.result as string) || ''
      setCsvRawText(content)
      const { rows } = parseCsvText(content)
      setCsvParsedRows(rows)
    }
    reader.readAsText(file)
  }

  // Handle CSV Dry-Run Validation
  const handleValidateCsv = async () => {
    if (csvParsedRows.length === 0) {
      toast.error('No rows detected in CSV file')
      return
    }
    setCsvValidating(true)
    try {
      const res = await fetch('/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          mode: csvMode,
          overwrite: csvOverwrite,
          rows: csvParsedRows,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCsvValidationResult(json.data)
        if (json.data.errors && json.data.errors.length > 0) {
          toast.warning(`Validation identified ${json.data.errors.length} issue(s)`, 'Review errors before applying')
        } else {
          toast.success('Validation passed!', `All ${json.data.validRows} rows are ready to execute`)
        }
      } else {
        toast.error(json.error?.message || 'Validation failed')
      }
    } catch {
      toast.error('Failed to validate CSV')
    } finally {
      setCsvValidating(false)
    }
  }

  // Handle CSV Execution
  const handleExecuteCsv = async () => {
    if (csvParsedRows.length === 0) return
    if (csvMode === 'DELETE' && !confirmCsvDelete) {
      setConfirmCsvDelete(true)
      return
    }

    setCsvExecuting(true)
    try {
      const res = await fetch('/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          mode: csvMode,
          overwrite: csvOverwrite,
          rows: csvParsedRows,
          applyValidOnly: csvApplyValidOnly,
        }),
      })
      const json = await res.json()
      if (json.success) {
        const d = json.data
        toast.success(
          `CSV ${csvMode} Complete!`,
          `Created: ${d.createdCount}, Updated: ${d.updatedCount}, Deactivated: ${d.deletedCount || 0}, Skipped: ${d.skippedCount}`
        )
        setCsvModalOpen(false)
        setCsvFile(null)
        setCsvParsedRows([])
        setCsvValidationResult(null)
        setConfirmCsvDelete(false)
        fetchUsers()
      } else {
        toast.error(json.error?.message || 'Execution failed')
      }
    } catch {
      toast.error('Failed to execute CSV operation')
    } finally {
      setCsvExecuting(false)
    }
  }

  // Download CSV Error Report
  const handleDownloadCsvErrors = () => {
    if (!csvValidationResult?.errors || csvValidationResult.errors.length === 0) return
    const errorHeaders = ['rowNumber', 'identifier', 'field', 'currentValue', 'requestedValue', 'errorCode', 'errorMessage']
    const csvContent = [
      errorHeaders.join(','),
      ...csvValidationResult.errors.map((err: any) =>
        [
          err.rowNumber,
          `"${(err.identifier || '').replace(/"/g, '""')}"`,
          `"${(err.field || '').replace(/"/g, '""')}"`,
          `"${(err.currentValue || '').replace(/"/g, '""')}"`,
          `"${(err.requestedValue || '').replace(/"/g, '""')}"`,
          `"${(err.errorCode || '').replace(/"/g, '""')}"`,
          `"${(err.errorMessage || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `csv_validation_errors_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Handle Bulk Overwrite Execution
  const handleExecuteBulkOverwrite = async () => {
    if (selected.length === 0) return
    const hasAnyField = Object.values(bulkOverwriteFields).some(Boolean)
    if (!hasAnyField) {
      toast.warning('No fields selected for overwrite', 'Check at least one attribute to overwrite')
      return
    }

    setBusy(true)
    try {
      const changes: any = {}
      if (bulkOverwriteFields.role && bulkOverwriteRole) changes.role = bulkOverwriteRole
      if (bulkOverwriteFields.branch) changes.branchId = bulkOverwriteBranchId || null
      if (bulkOverwriteFields.designation) changes.designation = bulkOverwriteDesignation.trim()
      if (bulkOverwriteFields.department) changes.department = bulkOverwriteDepartment.trim()
      if (bulkOverwriteFields.status && bulkOverwriteStatus) changes.status = bulkOverwriteStatus

      const res = await fetch('/api/v1/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PROFILE',
          userIds: selected,
          changes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Bulk Overwrite applied!', `Updated attributes across ${json.data.updatedCount} accounts`)
        setBulkOverwriteOpen(false)
        setSelected([])
        fetchUsers()
      } else {
        toast.error(json.error?.message || 'Bulk overwrite failed')
      }
    } catch {
      toast.error('Network error during bulk overwrite')
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
      // Mirror the active category tab onto the export filters
      if (categoryTab === 'PENDING') payload.status = 'PENDING'
      else if (categoryTab === 'STAFF') payload.userType = 'STAFF'
      else if (categoryTab === 'GUARDIAN') payload.userType = 'PARENT'
      else if (categoryTab === 'TEACHER' || categoryTab === 'PARENT' || categoryTab === 'PRINCIPAL' || categoryTab === 'ACCOUNTS') payload.role = categoryTab
      else {
        if (roleFilter !== 'ALL') payload.role = roleFilter
        if (statusFilter !== 'ALL') payload.status = statusFilter
        if (userTypeFilter !== 'ALL') payload.userType = userTypeFilter
      }
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
            <div className="t-body-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {u.name}
            </div>
            <div className="t-caption">
              {u.email}
            </div>
            {u.phone && (
              <div className="t-caption" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
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
          <span>{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}</span>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      {/* 1. CANONICAL PAGEHEAD */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/app/home' },
          { label: 'Users & Access' },
        ]}
      />
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
            <a
              href="/api/v1/users/import/template"
              download="preone_users_template.csv"
              className="btn btn-secondary"
              title="Download official CSV template for user management"
            >
              <FileSpreadsheet size={14} /> CSV Template
            </a>
            <button
              onClick={() => {
                setCsvModalOpen(true)
                setCsvValidationResult(null)
                setCsvFile(null)
                setCsvRawText('')
                setCsvParsedRows([])
              }}
              className="btn btn-secondary"
              title="Import, update, overwrite, or deactivate users in bulk using CSV"
            >
              <Upload size={14} /> Import / Bulk CSV
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
          onClick={() => { setCategoryTab('ALL'); setStatusFilter('ACTIVE'); }}
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
          <div className="m-val">{tabCounts.STAFF}</div>
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
          <div className="m-val">{tabCounts.PARENT}</div>
          <div className="m-meta">Guardian portal</div>
        </div>

        <div
          className="metric-cell"
          onClick={() => { setCategoryTab('ALL'); setStatusFilter('SUSPENDED'); }}
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
            { id: 'ALL', label: 'All Users', count: tabCounts.ALL },
            { id: 'STAFF', label: 'Staff', count: tabCounts.STAFF },
            { id: 'TEACHER', label: 'Teachers', count: tabCounts.TEACHER },
            { id: 'PARENT', label: 'Parents', count: tabCounts.PARENT },
            { id: 'PRINCIPAL', label: 'Principals', count: tabCounts.PRINCIPAL },
            { id: 'ACCOUNTS', label: 'Accounts', count: tabCounts.ACCOUNTS },
            { id: 'GUARDIAN', label: 'Guardians', count: tabCounts.GUARDIAN },
            { id: 'PENDING', label: 'Invitations', count: tabCounts.PENDING },
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
        <div
          className="school-context-bar"
          style={{
            borderRadius: 0,
            border: 'none',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            padding: '8px 16px',
          }}
        >
          {/* Search */}
          <div className="context-item" style={{ flex: '1 1 200px', minWidth: 170 }}>
            <div className="input-search" style={{ width: '100%' }}>
              <Search size={14} />
              <input
                className="input"
                style={{ height: 32 }}
                placeholder="Search name, email, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <span className="context-divider" />

          {/* Role Filter */}
          <div className="context-item" style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 12 }}>Role:</label>
            <select
              className="select"
              style={{ height: 32, fontSize: 12, padding: '0 24px 0 8px' }}
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

          {/* Status Filter */}
          <div className="context-item" style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 12 }}>Status:</label>
            <select
              className="select"
              style={{ height: 32, fontSize: 12, padding: '0 24px 0 8px' }}
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

          {/* Branch Filter */}
          <div className="context-item" style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 12 }}>Branch:</label>
            <select
              className="select"
              style={{ height: 32, fontSize: 12, padding: '0 24px 0 8px', maxWidth: 130 }}
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

          {/* User Type Filter */}
          <div className="context-item" style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 12 }}>Type:</label>
            <select
              className="select"
              style={{ height: 32, fontSize: 12, padding: '0 24px 0 8px' }}
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="STAFF">Staff</option>
              <option value="PARENT">Parents</option>
            </select>
          </div>

          <span className="context-divider" />

          {/* Actions: Compact / Reset / Export CSV */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto', marginLeft: 'auto' }}>
            <button
              onClick={() => setTableDensity((d) => (d === 'compact' ? 'cozy' : 'compact'))}
              className={`btn btn-sm ${tableDensity === 'compact' ? 'btn-secondary' : 'btn-ghost'}`}
              title={tableDensity === 'compact' ? 'Switch to cozy rows' : 'Switch to compact rows'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, whiteSpace: 'nowrap' }}
            >
              <Rows3 size={13} />
              <span>{tableDensity === 'compact' ? 'Compact' : 'Cozy'}</span>
            </button>
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
              style={{ height: 32, whiteSpace: 'nowrap' }}
            >
              <SlidersHorizontal size={13} /> Reset
            </button>
            <button
              onClick={handleExportCsv}
              className="btn btn-outline btn-sm"
              title="Export CSV"
              style={{ height: 32, whiteSpace: 'nowrap' }}
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
          pagination={{ page, pageSize, total, onPageChange: setPage, onPageSizeChange: setPageSize }}
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
          tableKey="users-directory"
          stickyCheckColumn
          selectionSummary={
            <span className="t-caption">
              of {total.toLocaleString('en-IN')} matching · page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </span>
          }
          density={tableDensity}
          onDensityChange={setTableDensity}
          onRowClick={(u) => {
            openViewModal(u)
          }}
          rowSelection
          selectedKeys={selected}
          onSelectionChange={(keys) => setSelected(keys.map(String))}
          showToolbar={false}
          showExport={false}
          bulkActions={
            selected.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginRight: 2 }}>
                  Bulk tools:
                </span>
                <button className="btn btn-sm btn-secondary" onClick={() => setBulkModalAction('ASSIGN_ROLE')} title="Append an extra role to all selected accounts">
                  Assign Role
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setBulkModalAction('CHANGE_BRANCH')} title="Move all selected accounts to another campus">
                  Move Branch
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setBulkModalAction('CHANGE_DESIGNATION')} title="Update the workforce designation for all selected accounts">
                  Set Designation
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setBulkModalAction('ACTIVATE')} title="Activate all selected accounts">
                  <Check size={12} /> Activate
                </button>
                <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setBulkModalAction('SUSPEND')} title="Suspend access for all selected accounts">
                  <Ban size={12} /> Suspend
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setBulkOverwriteOpen(true)} title="Batch overwrite profile fields across selected accounts">
                  Overwrite Profiles
                </button>
              </div>
            ) : undefined
          }
          rowActions={(u) => [
            {
              label: 'View 360',
              icon: <Eye size={14} />,
              onClick: () => {
                openViewModal(u)
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
              label: u.status === 'PENDING' ? 'Set Password' : 'Reset Password',
              icon: <KeyRound size={14} />,
              onClick: () => {
                setResetPwUser(u)
                setResetPwValue('')
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
        onClose={() => { setAddModalOpen(false); setAddMode('CREATE'); }}
        title={addMode === 'INVITE' ? 'Send Invitation' : 'Add New User'}
        subtitle={addMode === 'INVITE'
          ? 'Create a pending invitation without full login credentials'
          : 'Create portal credentials and configure role assignments'}
        icon={<UserPlus size={22} />}
        wide
      >
        <div style={{ marginBottom: 16 }}>
          <Segmented
            options={[
              { key: 'CREATE', label: 'Create Account' },
              { key: 'INVITE', label: 'Send Invitation' },
            ]}
            value={addMode}
            onChange={(k) => setAddMode(k as 'CREATE' | 'INVITE')}
          />
        </div>
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
            {addMode === 'CREATE' && (
              <div className="field">
                <label>Initial Password <span className="req">*</span></label>
                <input className="input" type="password" name="password" defaultValue="Preone@123" required />
              </div>
            )}
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
            <button type="button" className="btn btn-ghost" onClick={() => { setAddModalOpen(false); setAddMode('CREATE'); }}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              {addMode === 'INVITE' ? 'Send Invitation' : 'Create User'}
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
        onClose={() => { setViewModalOpen(false); setViewingUser(null); setViewDetail(null); }}
        title="User Profile 360"
        subtitle={`${viewingUser?.email || ''}${viewDetailLoading ? ' — refreshing live data…' : ''}`}
        icon={<Eye size={22} />}
        wide
      >
        {(viewDetail || viewingUser) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
            {viewDetailLoading && (
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 5, display: 'flex',
                  flexDirection: 'column', gap: 12, padding: 4,
                }}
              >
                <Skeleton h={72} variant="row" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <Skeleton h={58} /><Skeleton h={58} /><Skeleton h={58} /><Skeleton h={58} />
                </div>
                <Skeleton h={80} variant="card" />
              </div>
            )}
            {(viewDetail || viewingUser) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--surface-muted)', borderRadius: 12 }}>
                <Avatar name={(viewDetail || viewingUser)!.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    {(viewDetail || viewingUser)!.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {(viewDetail || viewingUser)!.email} {(viewDetail || viewingUser)!.phone ? `· ${(viewDetail || viewingUser)!.phone}` : ''}
                  </div>
                </div>
                <StatusBadge status={(viewDetail || viewingUser)!.status} />
              </div>
            )}

            {/* Scope and Assignment Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Primary Role</span>
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                  {ROLE_BADGE[(viewDetail || viewingUser)!.role]?.label || (viewDetail || viewingUser)!.role}
                </strong>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Branch Scope</span>
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                  {branches.find((b) => b.id === (viewDetail || viewingUser)!.branchId)?.name || 'All Campuses'}
                </strong>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Last Active</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  {timeAgo((viewDetail || viewingUser)!.lastLoginAt)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                  {(viewDetail || viewingUser)!.lastLoginAt
                    ? fmtDateTime((viewDetail || viewingUser)!.lastLoginAt)
                    : ''}
                </span>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Account Created</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  {fmtDate((viewDetail || viewingUser)!.createdAt)}
                </span>
              </div>
            </div>

            {/* Roles Scope */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Effective Assigned Roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {((viewDetail || viewingUser)!.roles || [(viewDetail || viewingUser)!.role]).map((r, i) => (
                  <span key={i} className={`badge ${ROLE_BADGE[r]?.cls || 'b-neutral'}`}>
                    {ROLE_BADGE[r]?.label || r}
                  </span>
                ))}
              </div>
            </div>

            {/* Staff / Guardian Details */}
            {(viewDetail || viewingUser)!.staffProfile && (
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Workforce & HR Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Employee Code:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.employeeCode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Designation:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.designation || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Department:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.department || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Type:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.employmentType || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Qualification:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.qualification || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>{' '}
                    <strong>
                      {(viewDetail || viewingUser)!.staffProfile!.dateOfBirth
                        ? fmtDate((viewDetail || viewingUser)!.staffProfile!.dateOfBirth)
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Gender:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.gender || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Current Address:</span>{' '}
                    <strong>{(viewDetail || viewingUser)!.staffProfile!.currentAddress || '—'}</strong>
                  </div>
                </div>
              </div>
            )}

            {(viewDetail || viewingUser)!.taughtClasses && (viewDetail || viewingUser)!.taughtClasses!.length > 0 && (
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Educator & Classroom Assignment
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(viewDetail || viewingUser)!.taughtClasses!.map((c) => (
                    <div
                      key={c.id}
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
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span className="badge b-success">{c.programType || 'Primary Educator'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(viewDetail || viewingUser)!.guardianProfile && (
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  Parent & Guardian Relationship
                </div>
                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Relationship:</span>{' '}
                  <span className="badge b-primary">{(viewDetail || viewingUser)!.guardianProfile!.relationship}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(viewDetail || viewingUser)!.guardianProfile!.students?.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/app/students/${ch.id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: 'var(--surface-muted)',
                        borderRadius: 6,
                        fontSize: 12,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {ch.name} ({ch.admissionNo})
                        <ChevronRight size={12} />
                      </span>
                      <span className={`badge ${ch.canPickup ? 'b-success' : 'b-neutral'}`}>
                        {ch.canPickup ? 'Authorized Pickup' : 'No Pickup'}
                      </span>
                    </Link>
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
                  setEditingUser(viewDetail || viewingUser)
                  setEditModalOpen(true)
                }}
              >
                <Edit3 size={13} /> Edit Profile
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setResetPwUser(viewDetail || viewingUser)
                  setResetPwValue('')
                }}
              >
                <KeyRound size={13} /> Reset Password
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={() => {
                  setViewModalOpen(false)
                  setConfirmRevoke(viewDetail || viewingUser)
                }}
              >
                <LogOut size={13} /> Revoke Sessions
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: (viewDetail || viewingUser)!.status === 'ACTIVE' ? 'var(--danger)' : 'var(--success)' }}
                onClick={() => {
                  setViewModalOpen(false)
                  if ((viewDetail || viewingUser)!.status === 'ACTIVE') setConfirmSuspend(viewDetail || viewingUser)
                  else setConfirmReactivate(viewDetail || viewingUser)
                }}
              >
                <Ban size={13} /> {(viewDetail || viewingUser)!.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setViewModalOpen(false); setViewingUser(null); setViewDetail(null); }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6b. RESET PASSWORD MODAL */}
      <Modal
        open={!!resetPwUser}
        onClose={() => { setResetPwUser(null); setResetPwValue(''); }}
        title="Reset Password"
        subtitle={resetPwUser ? `Set a new login password for ${resetPwUser.name} (${resetPwUser.email})` : ''}
        icon={<KeyRound size={22} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>New Password <span className="req">*</span></label>
            <input
              className="input"
              type="password"
              value={resetPwValue}
              onChange={(e) => setResetPwValue(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            The updated password applies on the user's next sign-in. Existing active sessions remain valid.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => { setResetPwUser(null); setResetPwValue(''); }}>
              Cancel
            </button>
            <button
              className={`btn btn-primary ${busy ? 'is-loading' : ''}`}
              onClick={handleResetPassword}
              disabled={busy || resetPwValue.trim().length < 6}
            >
              Reset Password
            </button>
          </div>
        </div>
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
          const target = confirmSuspend
          const res = await fetch(`/api/v1/users/${target.userId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'SUSPENDED', reason: 'Administrative suspension' }),
          })
          setConfirmSuspend(null)
          if (!res.ok) {
            toast.error('Action failed', 'Could not suspend access')
            return
          }
          fetchUsers()
          toast.undo('User suspended', target.name, async () => {
            await fetch(`/api/v1/users/${target.userId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'ACTIVE' }),
            })
            toast.info('Reactivated', `${target.name} restored`)
            fetchUsers()
          })
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
          const target = confirmReactivate
          const res = await fetch(`/api/v1/users/${target.userId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE' }),
          })
          setConfirmReactivate(null)
          if (!res.ok) {
            toast.error('Action failed', 'Could not reactivate access')
            return
          }
          fetchUsers()
          toast.undo('User reactivated', target.name, async () => {
            await fetch(`/api/v1/users/${target.userId}/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'SUSPENDED', reason: 'Undo: reactivation reverted' }),
            })
            toast.info('Suspended', `${target.name}'s access re-suspended`)
            fetchUsers()
          })
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

      {/* 11. BULK OVERWRITE MODAL */}
      <Modal
        open={bulkOverwriteOpen}
        onClose={() => setBulkOverwriteOpen(false)}
        title="Bulk Overwrite User Profiles"
        subtitle={`Batch update profile attributes across ${selected.length} selected user(s)`}
        icon={<Layers size={22} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Select the fields you want to overwrite. Only checked fields will be updated across all {selected.length} selected records.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            {/* Role Overwrite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="chk-role"
                checked={bulkOverwriteFields.role}
                onChange={(e) => setBulkOverwriteFields({ ...bulkOverwriteFields, role: e.target.checked })}
              />
              <label htmlFor="chk-role" style={{ width: 110, fontSize: 13, fontWeight: 600 }}>Primary Role:</label>
              <select
                disabled={!bulkOverwriteFields.role}
                value={bulkOverwriteRole}
                onChange={(e) => setBulkOverwriteRole(e.target.value)}
                className="select"
                style={{ flex: 1 }}
              >
                <option value="">Select Role...</option>
                {Object.keys(ROLE_BADGE).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_BADGE[r].label} ({r})
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Overwrite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="chk-branch"
                checked={bulkOverwriteFields.branch}
                onChange={(e) => setBulkOverwriteFields({ ...bulkOverwriteFields, branch: e.target.checked })}
              />
              <label htmlFor="chk-branch" style={{ width: 110, fontSize: 13, fontWeight: 600 }}>Campus Branch:</label>
              <select
                disabled={!bulkOverwriteFields.branch}
                value={bulkOverwriteBranchId}
                onChange={(e) => setBulkOverwriteBranchId(e.target.value)}
                className="select"
                style={{ flex: 1 }}
              >
                <option value="">All Branches / Main</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Designation Overwrite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="chk-desig"
                checked={bulkOverwriteFields.designation}
                onChange={(e) => setBulkOverwriteFields({ ...bulkOverwriteFields, designation: e.target.checked })}
              />
              <label htmlFor="chk-desig" style={{ width: 110, fontSize: 13, fontWeight: 600 }}>Designation:</label>
              <input
                type="text"
                disabled={!bulkOverwriteFields.designation}
                placeholder="e.g. Lead Early Years Educator"
                value={bulkOverwriteDesignation}
                onChange={(e) => setBulkOverwriteDesignation(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              >
              </input>
            </div>

            {/* Department Overwrite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="chk-dept"
                checked={bulkOverwriteFields.department}
                onChange={(e) => setBulkOverwriteFields({ ...bulkOverwriteFields, department: e.target.checked })}
              />
              <label htmlFor="chk-dept" style={{ width: 110, fontSize: 13, fontWeight: 600 }}>Department:</label>
              <input
                type="text"
                disabled={!bulkOverwriteFields.department}
                placeholder="e.g. Montessori & Kindergarten"
                value={bulkOverwriteDepartment}
                onChange={(e) => setBulkOverwriteDepartment(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              >
              </input>
            </div>

            {/* Status Overwrite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="chk-status"
                checked={bulkOverwriteFields.status}
                onChange={(e) => setBulkOverwriteFields({ ...bulkOverwriteFields, status: e.target.checked })}
              />
              <label htmlFor="chk-status" style={{ width: 110, fontSize: 13, fontWeight: 600 }}>Account Status:</label>
              <select
                disabled={!bulkOverwriteFields.status}
                value={bulkOverwriteStatus}
                onChange={(e) => setBulkOverwriteStatus(e.target.value)}
                className="select"
                style={{ flex: 1 }}
              >
                <option value="">Select Status...</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE (Soft Deactivation)</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={() => setBulkOverwriteOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button
              className={`btn btn-primary ${busy ? 'is-loading' : ''}`}
              onClick={handleExecuteBulkOverwrite}
              disabled={busy || !Object.values(bulkOverwriteFields).some(Boolean)}
            >
              Apply Overwrite to {selected.length} Users
            </button>
          </div>
        </div>
      </Modal>

      {/* 12. CSV MANAGER MODAL (CREATE / UPDATE / DELETE) */}
      <Modal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title="CSV User Management Hub"
        subtitle="Bulk create, update/overwrite profiles, or deactivate users with zero schema breaking"
        icon={<FileSpreadsheet size={22} />}
        wide
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Workflow Mode Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <button
              className={`btn btn-sm ${csvMode === 'CREATE' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setCsvMode('CREATE')
                setCsvValidationResult(null)
              }}
            >
              1. Create New Users
            </button>
            <button
              className={`btn btn-sm ${csvMode === 'UPDATE' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setCsvMode('UPDATE')
                setCsvValidationResult(null)
              }}
            >
              2. Update / Overwrite Profiles
            </button>
            <button
              className={`btn btn-sm ${csvMode === 'DELETE' ? 'btn-danger' : 'btn-ghost'}`}
              onClick={() => {
                setCsvMode('DELETE')
                setCsvValidationResult(null)
              }}
            >
              3. Bulk Deactivate (Soft)
            </button>
          </div>

          {/* Workflow Header & Settings */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {csvMode === 'CREATE' && 'Create Mode: Add new user accounts to tenant'}
                {csvMode === 'UPDATE' && 'Update Mode: Match by email and overwrite non-empty fields'}
                {csvMode === 'DELETE' && 'Deactivate Mode: Set matching accounts to INACTIVE and soft-delete'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {csvMode === 'CREATE' && 'New emails will be registered. Existing emails will be flagged unless overwrite is enabled.'}
                {csvMode === 'UPDATE' && 'Passwords will be preserved if left empty. Non-empty cells overwrite current profile data.'}
                {csvMode === 'DELETE' && 'Preserves relational history (attendance, grades, audit logs). Only flags status=INACTIVE.'}
              </div>
            </div>

            {csvMode === 'CREATE' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                <input
                  type="checkbox"
                  checked={csvOverwrite}
                  onChange={(e) => setCsvOverwrite(e.target.checked)}
                />
                Overwrite if already exists
              </label>
            )}
          </div>

          {/* File Upload Zone */}
          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 16px',
              textAlign: 'center',
              background: csvFile ? 'var(--bg-card)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Upload size={28} style={{ color: 'var(--primary)', opacity: 0.8 }} />
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {csvFile ? csvFile.name : 'Select or drop your CSV file here'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {csvFile
                ? `${csvParsedRows.length} data rows detected (${(csvFile.size / 1024).toFixed(1)} KB)`
                : 'Supports UTF-8 CSV with standard PreOne user headers'}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <input
                type="file"
                accept=".csv,text/csv"
                id="csv-file-input"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCsvFileSelected(e.target.files[0])
                  }
                }}
              />
              <label htmlFor="csv-file-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                Browse CSV File
              </label>
              <a
                href="/api/v1/users/import/template"
                download="preone_users_template.csv"
                className="btn btn-ghost btn-sm"
              >
                <Download size={13} /> Download Template
              </a>
            </div>
          </div>

          {/* Stage 1: Validation Results Display */}
          {csvValidationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Rows</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{csvValidationResult.totalRows}</div>
                </div>
                <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--success)' }}>Valid Rows</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>{csvValidationResult.validRows}</div>
                </div>
                <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--danger)' }}>Errors / Conflicts</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>{csvValidationResult.invalidRows}</div>
                </div>
                <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--info)' }}>
                    {csvMode === 'DELETE' ? 'To Deactivate' : 'To Update / Overwrite'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--info)' }}>
                    {csvMode === 'DELETE' ? csvValidationResult.deactivatingUsers : csvValidationResult.existingUsers}
                  </div>
                </div>
              </div>

              {/* Diffs Viewer (if updates or new users exist) */}
              {csvValidationResult.diffs && csvValidationResult.diffs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text)' }}>
                    Preview Changes ({csvValidationResult.diffs.length} rows):
                  </div>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
                    {csvValidationResult.diffs.map((d: any, idx: number) => (
                      <div key={idx} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>Row {d.rowNumber}</strong>: {d.name} ({d.identifier})
                          <span className={`badge ${d.isNew ? 'b-success' : 'b-info'}`} style={{ marginLeft: 6 }}>
                            {d.isNew ? 'NEW USER' : 'OVERWRITE'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {d.changes.length} attribute change(s)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Details Table (if any) */}
              {csvValidationResult.errors && csvValidationResult.errors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--danger)' }}>
                      Identified Validation Errors ({csvValidationResult.errors.length}):
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={handleDownloadCsvErrors}>
                      <FileDown size={13} /> Download Error Report
                    </button>
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '6px 8px' }}>Row</th>
                          <th style={{ padding: '6px 8px' }}>User / Email</th>
                          <th style={{ padding: '6px 8px' }}>Field</th>
                          <th style={{ padding: '6px 8px' }}>Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvValidationResult.errors.map((err: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '6px 8px' }}>{err.rowNumber}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{err.identifier}</td>
                            <td style={{ padding: '6px 8px', color: 'var(--danger)' }}>{err.field}</td>
                            <td style={{ padding: '6px 8px' }}>{err.errorMessage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Apply Valid Rows Only Toggle */}
              {csvValidationResult.invalidRows > 0 && csvValidationResult.validRows > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, color: 'var(--warning)', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={csvApplyValidOnly}
                    onChange={(e) => setCsvApplyValidOnly(e.target.checked)}
                  />
                  Apply valid rows only ({csvValidationResult.validRows} rows) and skip rows with errors
                </label>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <button className="btn btn-ghost" onClick={() => setCsvModalOpen(false)} disabled={csvValidating || csvExecuting}>
              Close
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={`btn btn-secondary ${csvValidating ? 'is-loading' : ''}`}
                onClick={handleValidateCsv}
                disabled={csvValidating || csvExecuting || csvParsedRows.length === 0}
              >
                <RefreshCw size={14} /> Validate Dry-Run
              </button>

              <button
                className={`btn ${csvMode === 'DELETE' ? 'btn-danger' : 'btn-primary'} ${csvExecuting ? 'is-loading' : ''}`}
                onClick={handleExecuteCsv}
                disabled={
                  csvValidating ||
                  csvExecuting ||
                  csvParsedRows.length === 0 ||
                  (csvValidationResult &&
                    csvValidationResult.invalidRows > 0 &&
                    !csvApplyValidOnly)
                }
              >
                {csvMode === 'DELETE' ? 'Execute Soft Deactivation' : 'Execute CSV Import'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 13. CONFIRM CSV SOFT DEACTIVATION */}
      <ConfirmModal
        open={confirmCsvDelete}
        onClose={() => setConfirmCsvDelete(false)}
        title="Confirm Bulk Soft Deactivation"
        message={`Are you sure you want to deactivate the users identified in your CSV? Their status will be set to INACTIVE, but no data or relational history will be deleted.`}
        confirmLabel="Deactivate Accounts"
        danger
        onConfirm={async () => {
          setConfirmCsvDelete(false)
          setCsvExecuting(true)
          try {
            const res = await fetch('/api/v1/users/csv', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'execute',
                mode: 'DELETE',
                rows: csvParsedRows,
                applyValidOnly: csvApplyValidOnly,
              }),
            })
            const json = await res.json()
            if (json.success) {
              toast.success(`Deactivated ${json.data.deletedCount} users`)
              setCsvModalOpen(false)
              setCsvFile(null)
              setCsvParsedRows([])
              setCsvValidationResult(null)
              fetchUsers()
            } else {
              toast.error(json.error?.message || 'Deactivation failed')
            }
          } catch {
            toast.error('Network error during bulk deactivation')
          } finally {
            setCsvExecuting(false)
          }
        }}
      />
    </div>
  )
}
