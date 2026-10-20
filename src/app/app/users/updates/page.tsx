'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Layers, Edit3, Search, Building, Mail, Phone, RefreshCw, ArrowLeft,
  CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Users, Eye
} from 'lucide-react'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { BulkUpdateFieldView } from '@/components/users/BulkUpdateFieldView'
import { EditUserModal } from '@/components/users/EditUserModal'
import { User360Drawer } from '@/components/users/User360Drawer'
import { UserRecord, BranchOption, ClassroomOption } from '@/components/users/types'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'

export default function StaffUpdatesPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const requestedTab = searchParams?.get('tab')
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>(
    requestedTab === 'bulk' ? 'bulk' : 'individual'
  )

  // Staff List State for Individual Edit Tab
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffList, setStaffList] = useState<UserRecord[]>([])
  const [search, setSearch] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL')
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Modal State for Individual Edit
  const [editingStaff, setEditingStaff] = useState<UserRecord | null>(null)
  const [viewingStaff, setViewingStaff] = useState<UserRecord | null>(null)

  // Load branches & classrooms
  useEffect(() => {
    async function loadMetadata() {
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
      } catch {
        // Non-blocking
      }
    }
    loadMetadata()
  }, [])

  // Fetch staff list for individual search and editing
  const fetchStaff = async () => {
    setLoadingStaff(true)
    try {
      const res = await fetch('/api/v1/users?role=STAFF&pageSize=100')
      if (res.ok) {
        const json = await res.json()
        setStaffList(json.data || json.items || [])
      } else {
        toast.error('Load Error', 'Failed to fetch staff directory')
      }
    } catch {
      toast.error('Network Error', 'Failed to load staff list')
    } finally {
      setLoadingStaff(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  // Sync tab with URL
  const handleTabChange = (tab: 'individual' | 'bulk') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('tab', tab)
    router.replace(`/app/users/updates?${params.toString()}`, { scroll: false })
  }

  // Filter staff for individual editing
  const filteredStaff = useMemo(() => {
    return staffList.filter((u) => {
      if (selectedBranch !== 'ALL' && u.branchId !== selectedBranch) {
        return false
      }
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const matchName = (u.name || u.fullName || '').toLowerCase().includes(q)
      const matchEmail = (u.email || '').toLowerCase().includes(q)
      const matchPhone = (u.phone || '').toLowerCase().includes(q)
      const matchRole = (u.role || '').toLowerCase().includes(q)
      const matchEmp = (u.employeeCode || '').toLowerCase().includes(q)
      return matchName || matchEmail || matchPhone || matchRole || matchEmp
    })
  }, [staffList, search, selectedBranch])

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: t('nav.home') || 'Home', href: '/app' },
          { label: t('users.title') || 'Users', href: '/app/users' },
          { label: 'Staff Updates' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/app/users"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Users Dashboard</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <span>Staff Updates</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Maintain staff records: edit individual educator profiles or perform bulk field updates via validated CSV.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 p-1 bg-gray-50 dark:bg-gray-900/50 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            id="tab-individual-edit"
            onClick={() => handleTabChange('individual')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'individual'
                ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Individual Edit</span>
          </button>
          <button
            type="button"
            id="tab-bulk-update"
            onClick={() => handleTabChange('bulk')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bulk Update</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="mt-4">
        {activeTab === 'individual' ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            {/* Mode Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 text-xs">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  Individual Staff Edit Mode: Select any educator or staff member to modify their identity, campus placement, or credentials.
                </span>
              </div>
              <button
                type="button"
                onClick={fetchStaff}
                disabled={loadingStaff}
                className="btn btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStaff ? 'animate-spin text-amber-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, employee code, or role..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {branches.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Campus:</span>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="text-xs py-1.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-medium"
                  >
                    <option value="ALL">All Campus Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Staff Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Campus Branch</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        {loadingStaff ? 'Loading staff directory...' : `No staff records found matching "${search}"`}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((u) => {
                      const branch = branches.find((b) => b.id === u.branchId)
                      return (
                        <tr key={u.id || u.userId} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.name || u.fullName} src={u.avatarUrl} size="sm" />
                              <div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                  {u.name || u.fullName}
                                </div>
                                {u.employeeCode && (
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    ID: {u.employeeCode}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="badge badge-sm font-semibold">{u.role}</span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
                              {u.email && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <span>{u.email}</span>
                                </div>
                              )}
                              {u.phone && (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-gray-700 dark:text-gray-300">
                            {branch ? `${branch.name} (${branch.code})` : 'All Campuses'}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={u.status} />
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingStaff(u)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="View 360 Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStaff(u)}
                                className="btn btn-secondary text-xs px-3 py-1 font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Profile</span>
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
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xs">
            <BulkUpdateFieldView
              branches={branches}
              userType="STAFF"
              onSuccess={() => {
                fetchStaff()
                toast.success('Bulk Update Applied', 'Staff directory updated successfully.')
              }}
            />
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingStaff && (
        <EditUserModal
          open={Boolean(editingStaff)}
          onClose={() => setEditingStaff(null)}
          user={editingStaff}
          branches={branches}
          classrooms={classrooms}
          onSuccess={() => {
            setEditingStaff(null)
            fetchStaff()
            toast.success('Profile Saved', 'Staff member profile updated successfully.')
          }}
        />
      )}

      {/* User 360 Inspection Drawer */}
      {viewingStaff && (
        <User360Drawer
          user={viewingStaff}
          onClose={() => setViewingStaff(null)}
          branches={branches}
        />
      )}
    </div>
  )
}
