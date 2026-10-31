'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Users, Building2, Key, History, Search, Filter,
  ArrowRightLeft, Plus, CheckCircle2, AlertTriangle, Eye, Edit3,
  Layers, Lock, Sparkles, RefreshCw, X, ChevronRight, Check, AlertCircle, Info, Shield
} from 'lucide-react'
import { PageHead, Skeleton, StatusBadge, Breadcrumbs, SetupScopeBadge } from '@/components/preone'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { CANONICAL_ROLES, ROLE_META, type CanonicalRole } from '@/lib/roles'

interface StaffMember {
  id: string
  userId: string
  username: string | null
  avatarUrl: string | null
  name: string
  fullName: string
  email: string | null
  phone: string | null
  role: string
  roles: string[]
  customRoles?: { id: string; name: string; code: string; capabilities: string[] }[]
  customRoleIds?: string[]
  status: string
  branchId: string | null
  assignedBranches: { id: string; name: string; code: string; isMain: boolean; isPrimary?: boolean }[]
  assignedBranchIds: string[]
  createdAt: string
  staffProfile: {
    employeeCode: string
    designation: string | null
    department: string | null
    qualification: string | null
    employmentType: string
    joiningDate: string | null
    reportingManager: { name: string; designation: string | null } | null
  } | null
}

interface CustomRoleItem {
  id: string
  name: string
  code: string
  description: string | null
  capabilities: string[]
  capabilitiesCount: number
  assignedUsersCount: number
  status: string
}

interface CapabilityItem {
  id: string
  name: string
  category: string
  description: string
}

interface BranchItem {
  id: string
  name: string
  code: string
  isMain: boolean
  isActive: boolean
}

interface EffectivePermissionReport {
  isFullAccess: boolean
  totalGranted: number
  effectivePermissions: string[]
  moduleBreakdown: {
    id: string
    name: string
    category: string
    description: string
    granted: boolean
    sources: string[]
  }[]
}

export default function RolesSetupPage() {
  const router = useRouter()
  const toast = useToast()

  // Primary navigation tabs
  const [activeTab, setActiveTab] = useState<'staff' | 'roles' | 'permissions' | 'branches' | 'history'>('staff')

  // Global loading
  const [loading, setLoading] = useState(true)

  // Data sets
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRoleItem[]>([])
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([])
  const [categoriesMap, setCategoriesMap] = useState<Record<string, CapabilityItem[]>>({})
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Branch selector state
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL')

  // Filters for Staff Directory
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals & Drawers
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  
  // Edit Roles Modal
  const [editRolesModalOpen, setEditRolesModalOpen] = useState(false)
  const [draftPrimaryRole, setDraftPrimaryRole] = useState<string>('')
  const [draftAdditionalRoles, setDraftAdditionalRoles] = useState<string[]>([])
  const [draftCustomRoleIds, setDraftCustomRoleIds] = useState<string[]>([])
  const [effectivePreview, setEffectivePreview] = useState<EffectivePermissionReport | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [savingRoles, setSavingRoles] = useState(false)

  // Branch Transfer / Assignment Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferAction, setTransferAction] = useState<'TRANSFER_PRIMARY' | 'ADD_BRANCH'>('TRANSFER_PRIMARY')
  const [targetDestinationBranchId, setTargetDestinationBranchId] = useState<string>('')
  const [retainSourceBranch, setRetainSourceBranch] = useState(true)
  const [transferReason, setTransferReason] = useState('')
  const [executingTransfer, setExecutingTransfer] = useState(false)

  // Custom Role Template Modal
  const [roleTemplateModalOpen, setRoleTemplateModalOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleCode, setNewRoleCode] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [newRoleCapabilities, setNewRoleCapabilities] = useState<string[]>([])
  const [creatingCustomRole, setCreatingCustomRole] = useState(false)

  // 1. Initial Load of Authoritative Data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, branchesRes, rolesRes, capRes, auditRes] = await Promise.all([
        fetch('/api/v1/users?userType=STAFF&pageSize=100').then((r) => r.json()),
        fetch('/api/v1/branches').then((r) => r.json()),
        fetch('/api/v1/roles').then((r) => r.json()),
        fetch('/api/v1/roles/capabilities').then((r) => r.json()),
        fetch('/api/v1/audit-logs?module=Users&pageSize=30').then((r) => r.json()),
      ])

      if (usersRes.success) {
        setStaffList(usersRes.data?.members || usersRes.data || [])
      }
      if (branchesRes.success) {
        setBranches(branchesRes.data || [])
      }
      if (rolesRes.success) {
        setCustomRoles(rolesRes.data || [])
      }
      if (capRes.success) {
        setCapabilities(capRes.data?.capabilities || [])
        setCategoriesMap(capRes.data?.categories || {})
      }
      if (auditRes.success) {
        setAuditLogs(auditRes.data?.logs || auditRes.data || [])
      }
    } catch (e: any) {
      toast.error('Failed to load roles setup data', e?.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 2. Filtered Staff Computation
  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      // Branch filter
      if (selectedBranchId !== 'ALL') {
        const matchesPrimary = m.branchId === selectedBranchId
        const matchesAssigned = (m.assignedBranches || []).some((ab) => ab.id === selectedBranchId)
        if (!matchesPrimary && !matchesAssigned) return false
      }

      // Role filter
      if (roleFilter !== 'ALL') {
        const allRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role]
        if (!allRoles.includes(roleFilter)) return false
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (m.status !== statusFilter) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = m.fullName.toLowerCase().includes(q)
        const matchesEmail = (m.email || '').toLowerCase().includes(q)
        const matchesEmp = (m.staffProfile?.employeeCode || '').toLowerCase().includes(q)
        const matchesDesig = (m.staffProfile?.designation || '').toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesEmp && !matchesDesig) return false
      }

      return true
    })
  }, [staffList, selectedBranchId, roleFilter, statusFilter, searchQuery])

  // 3. Summary Aggregates
  const summary = useMemo(() => {
    const total = filteredStaff.length
    const active = filteredStaff.filter((s) => s.status === 'ACTIVE').length
    const multiBranch = filteredStaff.filter(
      (s) => (s.assignedBranches && s.assignedBranches.length > 1) || (s.assignedBranchIds && s.assignedBranchIds.length > 1)
    ).length
    const customRoleCount = filteredStaff.filter(
      (s) => (s.customRoles && s.customRoles.length > 0) || (s.customRoleIds && s.customRoleIds.length > 0)
    ).length

    return { total, active, multiBranch, customRoleCount }
  }, [filteredStaff])

  // 4. Load Effective Permission Preview
  const loadEffectivePreview = useCallback(async (userId: string, pRole: string, aRoles: string[], cRoleIds: string[]) => {
    setLoadingPreview(true)
    try {
      const q = new URLSearchParams()
      q.set('userId', userId)
      q.set('primaryRole', pRole)
      if (aRoles.length > 0) q.set('roles', aRoles.join(','))
      if (cRoleIds.length > 0) q.set('customRoleIds', cRoleIds.join(','))

      const res = await fetch(`/api/v1/roles/effective?${q.toString()}`).then((r) => r.json())
      if (res.success && res.data) {
        setEffectivePreview(res.data)
      }
    } catch (e: any) {
      console.warn('Preview error:', e)
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  // Open Edit Roles
  const handleOpenEditRoles = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setDraftPrimaryRole(staff.role)
    const secondaries = (staff.roles || []).filter((r) => r !== staff.role)
    setDraftAdditionalRoles(secondaries)
    const existingCustomIds = staff.customRoles ? staff.customRoles.map((c) => c.id) : (staff.customRoleIds || [])
    setDraftCustomRoleIds(existingCustomIds)
    setEditRolesModalOpen(true)
    loadEffectivePreview(staff.userId, staff.role, secondaries, existingCustomIds)
  }

  // Open Branch Transfer
  const handleOpenTransfer = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setTransferAction('TRANSFER_PRIMARY')
    const currentPrimary = staff.branchId || ''
    // Select first branch that is not current primary
    const alternate = branches.find((b) => b.id !== currentPrimary)
    setTargetDestinationBranchId(alternate?.id || '')
    setRetainSourceBranch(true)
    setTransferReason('')
    setTransferModalOpen(true)
  }

  // Save Role Changes
  const handleSaveRoles = async () => {
    if (!selectedStaff) return
    setSavingRoles(true)
    try {
      const allRoles = Array.from(new Set([draftPrimaryRole, ...draftAdditionalRoles]))
      const res = await fetch(`/api/v1/users/${selectedStaff.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: draftPrimaryRole,
          primaryRole: draftPrimaryRole,
          roles: allRoles,
          customRoleIds: draftCustomRoleIds,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Roles updated successfully', `Updated roles for ${selectedStaff.fullName}`)
        setEditRolesModalOpen(false)
        loadData()
      } else {
        toast.error('Role update failed', res.error?.message || 'Server rejected changes')
      }
    } catch (e: any) {
      toast.error('Network error updating roles', e?.message)
    } finally {
      setSavingRoles(false)
    }
  }

  // Execute Branch Transfer
  const handleExecuteTransfer = async () => {
    if (!selectedStaff || !targetDestinationBranchId) return
    setExecutingTransfer(true)
    try {
      const res = await fetch('/api/v1/roles/branch-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: transferAction,
          userId: selectedStaff.userId,
          targetBranchId: targetDestinationBranchId,
          retainSourceAccess: retainSourceBranch,
          reason: transferReason.trim() || undefined,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success(
          transferAction === 'TRANSFER_PRIMARY' ? 'Staff transferred' : 'Branch assigned',
          `${selectedStaff.fullName} branch assignment updated`
        )
        setTransferModalOpen(false)
        loadData()
      } else {
        toast.error('Branch operation failed', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Network error executing branch change', e?.message)
    } finally {
      setExecutingTransfer(false)
    }
  }

  // Create Custom Role Template
  const handleCreateCustomRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Role name required', 'Please provide a descriptive role name')
      return
    }
    if (newRoleCapabilities.length === 0) {
      toast.error('Capabilities required', 'Select at least one module capability for this custom role')
      return
    }

    setCreatingCustomRole(true)
    try {
      const res = await fetch('/api/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName.trim(),
          code: newRoleCode.trim() || undefined,
          description: newRoleDescription.trim() || undefined,
          capabilities: newRoleCapabilities,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Custom Role Created', `Created ${newRoleName}`)
        setRoleTemplateModalOpen(false)
        setNewRoleName('')
        setNewRoleCode('')
        setNewRoleDescription('')
        setNewRoleCapabilities([])
        loadData()
      } else {
        toast.error('Failed to create role', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Network error creating custom role', e?.message)
    } finally {
      setCreatingCustomRole(false)
    }
  }

  const assignableSystemRoles = useMemo(() => {
    return CANONICAL_ROLES.filter((r) => {
      const meta = ROLE_META[r]
      return meta?.isAssignableBySchool && !['PARENT', 'GUARDIAN'].includes(r)
    })
  }, [])

  return (
    <div style={{ padding: '24px 32px 100px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Breadcrumb & Page Head ── */}
      <Breadcrumbs
        items={[
          { label: 'Setup', href: '/app/setup' },
          { label: 'Roles & Permissions' },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Roles & Permissions
            </h1>
            <SetupScopeBadge scope="TENANT" />
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage staff roles, module access, and branch assignments across your preschool network.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setRoleTemplateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Plus size={15} />
            Create Custom Role
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
        <div className="card" style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Staff in Scope
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
            {summary.total}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Across {selectedBranchId === 'ALL' ? 'all authorized branches' : 'selected branch'}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Staff
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
            {summary.active}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Provisioned with active login credentials
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Multi-Branch Staff
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#3B82F6', marginTop: 4 }}>
            {summary.multiBranch}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Assigned to 2 or more campuses
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', borderRadius: 10, background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Custom Role Overrides
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#8B5CF6', marginTop: 4 }}>
            {summary.customRoleCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Carrying tailored module capability sets
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'staff', label: 'Staff Directory', icon: <Users size={15} /> },
          { key: 'roles', label: 'Roles & Templates', icon: <Shield size={15} /> },
          { key: 'permissions', label: 'Module Permissions', icon: <Key size={15} /> },
          { key: 'branches', label: 'Branch Assignments', icon: <Building2 size={15} /> },
          { key: 'history', label: 'Access History', icon: <History size={15} /> },
        ].map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Branch Selector & Search Bar ── */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 14,
          borderRadius: 10,
          background: 'var(--surface-card)',
        }}
      >
        {/* Branch Scope */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Branch Scope:</span>
          <select
            className="select"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{ fontSize: 13, padding: '5px 12px', minWidth: 220 }}
          >
            <option value="ALL">All Authorized Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code}){b.isMain ? ' — Main' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Global Filter Bar for Staff tab */}
        {activeTab === 'staff' && (
          <>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="input"
                placeholder="Search staff by name, email, employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 13, width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                className="select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ fontSize: 12.5, padding: '5px 10px' }}
              >
                <option value="ALL">All Roles</option>
                {assignableSystemRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: 12.5, padding: '5px 10px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending Setup</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: STAFF DIRECTORY                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <div className="card" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Primary Role</th>
                  <th>Additional Roles</th>
                  <th>Primary Branch</th>
                  <th>Other Branches</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No staff members match the selected filters or branch scope.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const primaryBranch = branches.find((b) => b.id === staff.branchId)
                    const otherBranches = (staff.assignedBranches || []).filter((b) => b.id !== staff.branchId)
                    const secondaries = (staff.roles || []).filter((r) => r !== staff.role)

                    return (
                      <tr key={staff.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'var(--primary-subtle, #ede9fe)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              {staff.avatarUrl ? (
                                <img
                                  src={staff.avatarUrl}
                                  alt={staff.fullName}
                                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                staff.fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                                {staff.fullName}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                {staff.staffProfile?.employeeCode ? `${staff.staffProfile.employeeCode} • ` : ''}
                                {staff.staffProfile?.designation || staff.email || 'No email registered'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="badge b-primary" style={{ fontWeight: 700 }}>
                            {staff.role}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {secondaries.length === 0 && (!staff.customRoles || staff.customRoles.length === 0) ? (
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>None</span>
                            ) : (
                              <>
                                {secondaries.map((r) => (
                                  <span key={r} className="badge b-neutral" style={{ fontSize: 10.5 }}>
                                    {r}
                                  </span>
                                ))}
                                {(staff.customRoles || []).map((cr) => (
                                  <span key={cr.id} className="badge b-warning" style={{ fontSize: 10.5 }}>
                                    {cr.name}
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                        </td>

                        <td>
                          {primaryBranch ? (
                            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{primaryBranch.name}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not Assigned</span>
                          )}
                        </td>

                        <td>
                          {otherBranches.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {otherBranches.map((ob) => (
                                <span key={ob.id} className="badge b-neutral" style={{ fontSize: 10.5 }}>
                                  {ob.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        <td>
                          <StatusBadge status={staff.status} />
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSelectedStaff(staff)
                                setViewDrawerOpen(true)
                              }}
                              title="View Access Details"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleOpenEditRoles(staff)}
                              title="Edit Roles & Permissions"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              <Edit3 size={13} />
                              Roles
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleOpenTransfer(staff)}
                              title="Branch Transfer / Assignment"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              <ArrowRightLeft size={13} />
                              Transfer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: ROLES & TEMPLATES                                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* System Roles */}
          <div className="card" style={{ padding: 20, borderRadius: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>PreOne System Roles</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              Standard system-managed roles with hard-coded security boundaries and built-in permission sets.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
              {assignableSystemRoles.map((role) => {
                const meta = ROLE_META[role]
                const staffWithRole = staffList.filter((s) => s.role === role || (s.roles || []).includes(role)).length

                return (
                  <div
                    key={role}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: 14,
                      background: 'var(--surface-ground)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge b-primary" style={{ fontWeight: 700, fontSize: 12 }}>
                        {role}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {staffWithRole} Assigned
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 8, color: 'var(--text-primary)' }}>
                      {meta?.label || role}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, minHeight: 36 }}>
                      {meta?.description || 'Standard platform role.'}
                    </div>

                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> System Managed
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                        Tier Level {meta?.hierarchyLevel || 0}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom Dynamic Roles */}
          <div className="card" style={{ padding: 20, borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>School Custom Dynamic Roles</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  Tailored capability sets created by your administrators to fit unique campus responsibilities.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setRoleTemplateModalOpen(true)}
                style={{ fontSize: 12.5 }}
              >
                <Plus size={14} /> New Custom Role
              </button>
            </div>

            {customRoles.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                No custom roles defined yet. Create a custom role to grant tailored capabilities to coordinators or specialist staff.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                {customRoles.map((cr) => (
                  <div
                    key={cr.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: 14,
                      background: 'var(--surface-ground)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="badge b-warning" style={{ fontWeight: 700, fontSize: 12 }}>
                        {cr.code}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {cr.assignedUsersCount} Members
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 8, color: 'var(--text-primary)' }}>
                      {cr.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, minHeight: 36 }}>
                      {cr.description || 'Custom capability bundle.'}
                    </div>

                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={12} /> {cr.capabilitiesCount} Capabilities
                      </span>
                      <StatusBadge status={cr.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: MODULE PERMISSIONS                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'permissions' && (
        <div className="card" style={{ padding: 20, borderRadius: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>PreOne Capability & Module Catalog</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Authoritative platform capabilities organized by functional module (ADR-063). Custom dynamic roles draw from these permissions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(categoriesMap).map(([category, items]) => (
              <div key={category} style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'var(--surface-ground)',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: 13,
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Layers size={14} />
                  Module: {category} ({items.length} actions)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, padding: 14 }}>
                  {items.map((cap) => (
                    <div
                      key={cap.id}
                      style={{
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        background: 'var(--surface-card)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
                          {cap.name}
                        </span>
                        <code style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-ground)', padding: '2px 4px', borderRadius: 4 }}>
                          {cap.id}
                        </code>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {cap.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 4: BRANCH ASSIGNMENTS                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'branches' && (
        <div className="card" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Staff Campus Allocation Matrix</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
              Audit primary branch homes and secondary authorized branches across your institution.
            </p>
          </div>

          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Primary Branch</th>
                  <th>Additional Assigned Branches</th>
                  <th>Multi-Branch?</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => {
                  const primaryBranch = branches.find((b) => b.id === staff.branchId)
                  const otherBranches = (staff.assignedBranches || []).filter((b) => b.id !== staff.branchId)
                  const isMulti = otherBranches.length > 0

                  return (
                    <tr key={staff.id}>
                      <td>
                        <span className="cell-strong">{staff.fullName}</span>
                        <span className="cell-sub">{staff.staffProfile?.designation || staff.role}</span>
                      </td>

                      <td>
                        <span className="badge b-primary">{staff.role}</span>
                      </td>

                      <td>
                        {primaryBranch ? (
                          <strong>{primaryBranch.name}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </td>

                      <td>
                        {otherBranches.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {otherBranches.map((ob) => (
                              <span key={ob.id} className="badge b-neutral" style={{ fontSize: 10.5 }}>
                                {ob.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Primary only</span>
                        )}
                      </td>

                      <td>
                        {isMulti ? (
                          <span className="badge b-success" style={{ fontSize: 10.5 }}>Yes ({otherBranches.length + 1})</span>
                        ) : (
                          <span className="badge b-neutral" style={{ fontSize: 10.5 }}>Single</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleOpenTransfer(staff)}
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        >
                          <ArrowRightLeft size={13} /> Manage Allocation
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 5: ACCESS HISTORY                                      */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="card" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>Security & Role Modification Audit Log</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>
              Immutable records of role assignments, dynamic custom role grants, and campus branch transfers.
            </p>
          </div>

          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Administrator</th>
                  <th>Summary</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No recent security audit logs found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <code style={{ fontSize: 11, fontWeight: 700 }}>{log.action}</code>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{log.actorName || 'System'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5 }}>{log.summary}</td>
                      <td>
                        <span
                          className={`badge ${
                            log.severity === 'WARNING'
                              ? 'b-warning'
                              : log.severity === 'CRITICAL'
                              ? 'b-danger'
                              : 'b-neutral'
                          }`}
                          style={{ fontSize: 10.5 }}
                        >
                          {log.severity || 'INFO'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT ROLES & PERMISSIONS                            */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        open={editRolesModalOpen}
        onClose={() => setEditRolesModalOpen(false)}
        title={`Edit Roles & Permissions — ${selectedStaff?.fullName || ''}`}
        subtitle="Configure primary platform role, secondary roles, and custom capability sets."
        icon={<ShieldCheck size={20} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Primary Role */}
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>
              Primary Role <span className="req">*</span>
            </label>
            <select
              className="select"
              value={draftPrimaryRole}
              onChange={(e) => {
                const nextP = e.target.value
                setDraftPrimaryRole(nextP)
                if (selectedStaff) {
                  loadEffectivePreview(selectedStaff.userId, nextP, draftAdditionalRoles, draftCustomRoleIds)
                }
              }}
            >
              {assignableSystemRoles.map((r) => (
                <option key={r} value={r}>
                  {r} — {ROLE_META[r]?.label || ''}
                </option>
              ))}
            </select>
            <span className="helper">
              Governs main navigation, dashboard views, and base permission bundle.
            </span>
          </div>

          {/* Additional Roles */}
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Additional Roles (Multi-Role)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {assignableSystemRoles
                .filter((r) => r !== draftPrimaryRole)
                .map((r) => {
                  const on = draftAdditionalRoles.includes(r)
                  return (
                    <button
                      key={r}
                      type="button"
                      className={`badge ${on ? 'b-primary' : 'b-neutral'}`}
                      onClick={() => {
                        const nextA = on
                          ? draftAdditionalRoles.filter((x) => x !== r)
                          : [...draftAdditionalRoles, r]
                        setDraftAdditionalRoles(nextA)
                        if (selectedStaff) {
                          loadEffectivePreview(selectedStaff.userId, draftPrimaryRole, nextA, draftCustomRoleIds)
                        }
                      }}
                      style={{ cursor: 'pointer', padding: '6px 12px' }}
                    >
                      {on ? '✓ ' : '+ '}
                      {r}
                    </button>
                  )
                })}
            </div>
            <span className="helper">
              Enables staff to perform tasks across multiple departments (e.g. Teacher + Coordinator).
            </span>
          </div>

          {/* Custom Dynamic Roles */}
          {customRoles.length > 0 && (
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13 }}>Custom Dynamic Role Overrides</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {customRoles.map((cr) => {
                  const on = draftCustomRoleIds.includes(cr.id)
                  return (
                    <button
                      key={cr.id}
                      type="button"
                      className={`badge ${on ? 'b-warning' : 'b-neutral'}`}
                      onClick={() => {
                        const nextC = on
                          ? draftCustomRoleIds.filter((x) => x !== cr.id)
                          : [...draftCustomRoleIds, cr.id]
                        setDraftCustomRoleIds(nextC)
                        if (selectedStaff) {
                          loadEffectivePreview(selectedStaff.userId, draftPrimaryRole, draftAdditionalRoles, nextC)
                        }
                      }}
                      style={{ cursor: 'pointer', padding: '6px 12px' }}
                    >
                      {on ? '✓ ' : '+ '}
                      {cr.name} ({cr.capabilitiesCount} caps)
                    </button>
                  )
                })}
              </div>
              <span className="helper">
                Augments staff permissions with granular capabilities defined in custom roles.
              </span>
            </div>
          )}

          {/* Authoritative Effective Permissions Preview */}
          <div
            style={{
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              padding: 14,
              background: 'var(--surface-ground)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                Authoritative Effective Access Preview
              </div>
              {loadingPreview && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Calculating…</span>}
            </div>

            {effectivePreview && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  {effectivePreview.isFullAccess
                    ? 'Owner Level: Complete unconstrained institution-wide authority.'
                    : `Staff member will possess ${effectivePreview.totalGranted} active capabilities.`}
                </div>

                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {effectivePreview.moduleBreakdown
                    .filter((m) => m.granted)
                    .map((m) => (
                      <span
                        key={m.id}
                        className="badge b-neutral"
                        title={`Granted via: ${m.sources.join(', ')}`}
                        style={{ fontSize: 10.5 }}
                      >
                        ✓ {m.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditRolesModalOpen(false)}
              disabled={savingRoles}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveRoles}
              disabled={savingRoles}
            >
              {savingRoles ? 'Saving Changes…' : 'Save Role Assignment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: BRANCH TRANSFER & ASSIGNMENT                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={`Branch Management — ${selectedStaff?.fullName || ''}`}
        subtitle="Transfer primary campus or authorize additional branch operations."
        icon={<ArrowRightLeft size={20} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Operation Type */}
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Assignment Operation</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                onClick={() => setTransferAction('TRANSFER_PRIMARY')}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `2px solid ${transferAction === 'TRANSFER_PRIMARY' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: transferAction === 'TRANSFER_PRIMARY' ? 'var(--surface-card)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>Primary Branch Transfer</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  Relocates the member's main operating campus.
                </div>
              </div>

              <div
                onClick={() => setTransferAction('ADD_BRANCH')}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `2px solid ${transferAction === 'ADD_BRANCH' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: transferAction === 'ADD_BRANCH' ? 'var(--surface-card)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>Additional Branch</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                  Grants roaming access without altering primary home.
                </div>
              </div>
            </div>
          </div>

          {/* Current Branch Details */}
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-ground)', fontSize: 12.5 }}>
            <div>Current Primary Campus: <strong>{branches.find((b) => b.id === selectedStaff?.branchId)?.name || 'None'}</strong></div>
            <div style={{ marginTop: 4 }}>
              Other Active Branches:{' '}
              {selectedStaff?.assignedBranches && selectedStaff.assignedBranches.length > 0
                ? selectedStaff.assignedBranches.map((b) => b.name).join(', ')
                : 'None'}
            </div>
          </div>

          {/* Destination Branch */}
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>
              Destination Branch <span className="req">*</span>
            </label>
            <select
              className="select"
              value={targetDestinationBranchId}
              onChange={(e) => setTargetDestinationBranchId(e.target.value)}
            >
              <option value="">Select target campus…</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) {!b.isActive ? '— Inactive' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Policy: Retain old primary branch? */}
          {transferAction === 'TRANSFER_PRIMARY' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={retainSourceBranch}
                onChange={(e) => setRetainSourceBranch(e.target.checked)}
              />
              <span>Retain source branch as an authorized additional campus</span>
            </label>
          )}

          {/* Administrative Justification Reason */}
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Administrative Reason / Note</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Center relocation, inter-campus teaching support, administrative transfer"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setTransferModalOpen(false)}
              disabled={executingTransfer}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExecuteTransfer}
              disabled={executingTransfer || !targetDestinationBranchId}
            >
              {executingTransfer ? 'Processing…' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE CUSTOM ROLE TEMPLATE                         */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        open={roleTemplateModalOpen}
        onClose={() => setRoleTemplateModalOpen(false)}
        title="Create Custom Role Template"
        subtitle="Define a custom role with selective capabilities scoped to this school."
        icon={<Plus size={20} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>
              Role Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Lead STEM Specialist"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>

          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Role Code (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. STEM_SPECIALIST"
              value={newRoleCode}
              onChange={(e) => setNewRoleCode(e.target.value)}
            />
          </div>

          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>Description</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Describes who carries this role and what duties they perform."
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
            />
          </div>

          {/* Capabilities Picker */}
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13 }}>
              Included Module Capabilities ({newRoleCapabilities.length} selected) <span className="req">*</span>
            </label>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, padding: 10 }}>
              {capabilities.map((cap) => {
                const on = newRoleCapabilities.includes(cap.id)
                return (
                  <label
                    key={cap.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 4,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      background: on ? 'var(--surface-ground)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => {
                        setNewRoleCapabilities(
                          e.target.checked
                            ? [...newRoleCapabilities, cap.id]
                            : newRoleCapabilities.filter((c) => c !== cap.id)
                        )
                      }}
                    />
                    <div>
                      <strong>{cap.name}</strong> <code style={{ fontSize: 10 }}>({cap.id})</code>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cap.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRoleTemplateModalOpen(false)}
              disabled={creatingCustomRole}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateCustomRole}
              disabled={creatingCustomRole || !newRoleName.trim() || newRoleCapabilities.length === 0}
            >
              {creatingCustomRole ? 'Creating Role…' : 'Create Role Template'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ────────────────────────────────────────────────────────── */}
      {/* DRAWER / MODAL: VIEW STAFF DETAILS                         */}
      {/* ────────────────────────────────────────────────────────── */}
      {selectedStaff && (
        <Modal
          open={viewDrawerOpen}
          onClose={() => setViewDrawerOpen(false)}
          title={selectedStaff.fullName}
          subtitle={`Employee Code: ${selectedStaff.staffProfile?.employeeCode || 'N/A'}`}
          icon={<Eye size={20} />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-ground)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Primary Role</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{selectedStaff.role}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-ground)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Account Status</div>
                <div style={{ marginTop: 2 }}><StatusBadge status={selectedStaff.status} /></div>
              </div>
              <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-ground)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontWeight: 600, marginTop: 2, fontSize: 12 }}>{selectedStaff.email || 'None'}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-ground)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontWeight: 600, marginTop: 2, fontSize: 12 }}>{selectedStaff.phone || 'None'}</div>
              </div>
            </div>

            <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-ground)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Campus Allocation</div>
              <div style={{ fontWeight: 600, marginTop: 4, fontSize: 12.5 }}>
                Primary: {branches.find((b) => b.id === selectedStaff.branchId)?.name || 'Unassigned'}
              </div>
              {selectedStaff.assignedBranches && selectedStaff.assignedBranches.length > 0 && (
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  All Authorized: {selectedStaff.assignedBranches.map((b) => b.name).join(', ')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewDrawerOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setViewDrawerOpen(false)
                  handleOpenEditRoles(selectedStaff)
                }}
              >
                Edit Access
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
