'use client'

import React, { useState, useMemo } from 'react'
import {
  ShieldCheck, Search, Shield, CheckCircle2, XCircle, AlertCircle, Lock,
  Crown, GraduationCap, BookOpen, HeartHandshake, CircleDollarSign,
  Users, Bus, Heart, ChevronRight, X, Globe, Layers, Table2, LayoutGrid,
  Info, Sparkles, Check, ChevronDown, ChevronUp
} from 'lucide-react'
import { DEFAULT_ROLES_MATRIX, RoleMatrixItem } from './types'
import { useI18n } from '@/lib/i18n'
import {
  getRoleCardData,
  RoleCapabilityAccess,
  CapabilityStatus
} from '@/lib/users/role-capabilities'

export interface RolesDirectoryViewProps {
  rolesMatrix?: RoleMatrixItem[]
}

type RoleFilterCategory = 'ALL' | 'WORKFORCE' | 'TEACHING' | 'ADMIN' | 'TRANSPORT' | 'FAMILY'
type ViewMode = 'cards' | 'matrix'

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  OWNER: Crown,
  PRINCIPAL: GraduationCap,
  COORDINATOR: GraduationCap,
  TEACHER: BookOpen,
  STAFF: Users,
  ACCOUNTS: CircleDollarSign,
  RECEPTIONIST: Globe,
  ATTENDANT: HeartHandshake,
  DRIVER: Bus,
  PARENT: Heart,
  GUARDIAN: ShieldCheck,
}

export function RolesDirectoryView({
  rolesMatrix = DEFAULT_ROLES_MATRIX,
}: RolesDirectoryViewProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<RoleFilterCategory>('ALL')
  const [selectedRole, setSelectedRole] = useState<string>('TEACHER')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [showTechnicalAudit, setShowTechnicalAudit] = useState(false)

  // Quick filter matching
  const filteredRoles = useMemo(() => {
    return rolesMatrix.filter((item) => {
      const card = getRoleCardData(item.role)

      const matchesCategory =
        activeCategory === 'ALL' ||
        (activeCategory === 'WORKFORCE' && card.category !== 'FAMILY') ||
        (activeCategory === 'TEACHING' && (item.role === 'TEACHER' || item.role === 'ATTENDANT' || item.role === 'COORDINATOR')) ||
        (activeCategory === 'ADMIN' && (item.role === 'OWNER' || item.role === 'PRINCIPAL' || item.role === 'ACCOUNTS' || item.role === 'RECEPTIONIST' || item.role === 'STAFF')) ||
        (activeCategory === 'TRANSPORT' && item.role === 'DRIVER') ||
        (activeCategory === 'FAMILY' && card.category === 'FAMILY')

      if (!matchesCategory) return false

      if (!search.trim()) return true

      const q = search.toLowerCase()
      const inLabel = item.label.toLowerCase().includes(q)
      const inRole = item.role.toLowerCase().includes(q)
      const inDesc = card.tagline.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      const inScope = card.scope.toLowerCase().includes(q)
      const inTitle = card.title.toLowerCase().includes(q)
      const inCapabilities = card.capabilities.some((c) =>
        c.capabilityLabel.toLowerCase().includes(q) ||
        c.explanation.toLowerCase().includes(q) ||
        (c.scope && c.scope.toLowerCase().includes(q))
      )

      return inLabel || inRole || inDesc || inScope || inTitle || inCapabilities
    })
  }, [rolesMatrix, activeCategory, search])

  // Active role details
  const activeRoleCard = useMemo(() => {
    const found = filteredRoles.find((r) => r.role === selectedRole)
    if (found) return getRoleCardData(found.role)
    if (filteredRoles.length > 0) return getRoleCardData(filteredRoles[0].role)
    return getRoleCardData(selectedRole || 'TEACHER')
  }, [selectedRole, filteredRoles])

  const RoleIcon = ROLE_ICONS[activeRoleCard.role] || Shield

  // Comparison matrix roles (Key Staff Roles)
  const comparisonRoles = useMemo(() => {
    const priority = ['TEACHER', 'ACCOUNTS', 'DRIVER', 'ATTENDANT', 'RECEPTIONIST', 'PRINCIPAL', 'OWNER']
    return priority.map((r) => getRoleCardData(r))
  }, [])

  // Helper renderer for Capability Status Badge
  const renderStatusBadge = (status: CapabilityStatus, label: string) => {
    switch (status) {
      case 'ALLOWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{label}</span>
          </span>
        )
      case 'LIMITED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{label}</span>
          </span>
        )
      case 'NOT_ALLOWED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shrink-0">
            <XCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>{label}</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Control Bar: View Mode Switcher + Filter Pills + Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800/80">
        {/* Left: View Mode Toggle + Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle: Role Cards vs Comparison Table */}
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-800 p-0.5 bg-gray-50 dark:bg-gray-900/50 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Role-by-Role Deep Dive Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Role Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Quick Comparison Matrix"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Quick Comparison</span>
            </button>
          </div>

          {/* Category Filter Segments (Only in Cards Mode) */}
          {viewMode === 'cards' && (
            <div className="seg text-xs shrink-0" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'ALL'}
                onClick={() => setActiveCategory('ALL')}
                className={activeCategory === 'ALL' ? 'on' : ''}
              >
                All ({rolesMatrix.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'WORKFORCE'}
                onClick={() => setActiveCategory('WORKFORCE')}
                className={activeCategory === 'WORKFORCE' ? 'on' : ''}
              >
                School Staff
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'TEACHING'}
                onClick={() => setActiveCategory('TEACHING')}
                className={activeCategory === 'TEACHING' ? 'on' : ''}
              >
                Educators
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'ADMIN'}
                onClick={() => setActiveCategory('ADMIN')}
                className={activeCategory === 'ADMIN' ? 'on' : ''}
              >
                Admins
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'FAMILY'}
                onClick={() => setActiveCategory('FAMILY')}
                className={activeCategory === 'FAMILY' ? 'on' : ''}
              >
                Families
              </button>
            </div>
          )}
        </div>

        {/* Right: Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={viewMode === 'cards' ? 'Search roles or capabilities...' : 'Search capabilities...'}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode A: Role Cards Deep Dive */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[460px]">
          {/* Column 1: Roles Selector List */}
          <div className="lg:col-span-4 border border-gray-200 dark:border-gray-800 rounded-xl p-2 space-y-1.5 max-h-[580px] overflow-y-auto bg-gray-50/50 dark:bg-gray-900/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2.5 py-1">
              Select Role ({filteredRoles.length})
            </div>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No roles match "{search}"
              </div>
            ) : (
              filteredRoles.map((item) => {
                const isSelected = activeRoleCard.role === item.role
                const ItemIcon = ROLE_ICONS[item.role] || Shield
                const card = getRoleCardData(item.role)

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start gap-3 border ${
                      isSelected
                        ? 'bg-white dark:bg-gray-800 border-purple-300 dark:border-purple-600 shadow-xs'
                        : 'border-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`font-bold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-gray-100'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {card.tagline}
                      </p>
                      <div className="text-[10px] font-medium text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                        <span>Scope: {card.scope}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Column 2: Selected Role Deep Dive View */}
          <div className="lg:col-span-8 flex flex-col space-y-4 max-h-[580px] overflow-y-auto pr-1">
            {/* Role Header Banner */}
            <div className="p-4 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/20 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-purple-600 text-white shadow-xs shrink-0">
                    <RoleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {activeRoleCard.title}
                      </h3>
                      <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                        {activeRoleCard.role}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                        Scope: {activeRoleCard.scope}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                      {activeRoleCard.tagline}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Data Boundary:</span>
                      <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                        {activeRoleCard.boundary}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities Breakdown */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
              <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Key School Capabilities
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {activeRoleCard.capabilities.filter(c => c.status === 'ALLOWED').length} Allowed •{' '}
                  {activeRoleCard.capabilities.filter(c => c.status === 'LIMITED').length} Limited •{' '}
                  {activeRoleCard.capabilities.filter(c => c.status === 'NOT_ALLOWED').length} Prohibited
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {activeRoleCard.capabilities.map((cap, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                          {cap.capabilityLabel}
                        </span>
                        {cap.scope && (
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {cap.scope}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                        {cap.explanation}
                      </p>
                    </div>
                    {renderStatusBadge(cap.status, cap.statusLabel)}
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Permission Strings (Auditor Expandable) */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50/60 dark:bg-gray-900/40 text-xs">
              <button
                type="button"
                onClick={() => setShowTechnicalAudit(!showTechnicalAudit)}
                className="w-full flex items-center justify-between font-semibold text-gray-700 dark:text-gray-300 text-left hover:text-purple-600"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Technical RBAC Audit Matrix (Admins & Auditors)</span>
                </div>
                {showTechnicalAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTechnicalAudit && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Underlying platform capabilities granted to <span className="font-mono font-bold text-purple-600">{activeRoleCard.role}</span> under PreOne core authorization middleware:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-[10px]">
                    {activeRoleCard.technicalPermissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Mode B: Comparison Matrix Table */
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 text-xs">
          <div className="p-3 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Role Access Comparison Matrix
            </span>
            <span className="text-[11px] text-gray-500">
              Comparing access permissions across core school workforce roles
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Role</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Scope</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">View Student PII</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Fee Invoices</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Message Parents</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Edit Attendance</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Staff Salaries</th>
                  <th className="py-2.5 px-4 font-bold text-gray-700 dark:text-gray-200">Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {comparisonRoles.map((roleCard) => {
                  const CompIcon = ROLE_ICONS[roleCard.role] || Shield
                  return (
                    <tr key={roleCard.role} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      {/* Role Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 shrink-0">
                            <CompIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {roleCard.title}
                            </div>
                            <div className="text-[10px] font-mono text-gray-400">
                              {roleCard.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="py-3 px-4 font-medium text-purple-700 dark:text-purple-300">
                        {roleCard.scope}
                      </td>

                      {/* View Student PII */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {renderStatusBadge(
                            roleCard.highlights.viewStudentPII.status,
                            roleCard.highlights.viewStudentPII.statusLabel
                          )}
                          {roleCard.highlights.viewStudentPII.scope && (
                            <div className="text-[10px] text-gray-400 line-clamp-1" title={roleCard.highlights.viewStudentPII.scope}>
                              {roleCard.highlights.viewStudentPII.scope}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* View Fee Invoices */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {renderStatusBadge(
                            roleCard.highlights.viewFeeInvoices.status,
                            roleCard.highlights.viewFeeInvoices.statusLabel
                          )}
                          {roleCard.highlights.viewFeeInvoices.scope && (
                            <div className="text-[10px] text-gray-400 line-clamp-1" title={roleCard.highlights.viewFeeInvoices.scope}>
                              {roleCard.highlights.viewFeeInvoices.scope}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Message Parents */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {renderStatusBadge(
                            roleCard.highlights.messageParents.status,
                            roleCard.highlights.messageParents.statusLabel
                          )}
                          {roleCard.highlights.messageParents.scope && (
                            <div className="text-[10px] text-gray-400 line-clamp-1" title={roleCard.highlights.messageParents.scope}>
                              {roleCard.highlights.messageParents.scope}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Edit Attendance */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {renderStatusBadge(
                            roleCard.highlights.editAttendance.status,
                            roleCard.highlights.editAttendance.statusLabel
                          )}
                          {roleCard.highlights.editAttendance.scope && (
                            <div className="text-[10px] text-gray-400 line-clamp-1" title={roleCard.highlights.editAttendance.scope}>
                              {roleCard.highlights.editAttendance.scope}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* View Staff Salaries */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(
                          roleCard.highlights.viewStaffSalaries.status,
                          roleCard.highlights.viewStaffSalaries.statusLabel
                        )}
                      </td>

                      {/* Scope Boundary */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {roleCard.boundary}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
