'use client'

import React, { useState, useMemo } from 'react'
import {
  ShieldCheck, Search, Shield, CheckCircle2, XCircle, AlertCircle, Lock,
  Crown, GraduationCap, BookOpen, HeartHandshake, CircleDollarSign,
  Users, Bus, Heart, ChevronRight, X, Globe, Layers, Table2, LayoutGrid,
  Info, Sparkles, Check, ChevronDown, ChevronUp
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { SecurityShieldIllustration } from '@/components/preone'
import { DEFAULT_ROLES_MATRIX, RoleMatrixItem } from './types'
import { useI18n } from '@/lib/i18n'
import {
  getRoleCardData,
  RoleCapabilityAccess,
  CapabilityStatus
} from '@/lib/users/role-capabilities'

interface RolesDirectoryModalProps {
  open: boolean
  onClose: () => void
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

export function RolesDirectoryModal({
  open,
  onClose,
  rolesMatrix = DEFAULT_ROLES_MATRIX,
}: RolesDirectoryModalProps) {
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
    <Modal
      open={open}
      onClose={onClose}
      title={t('users.rolesDirectoryTitle') || 'Who Can See What?'}
      subtitle={t('users.rolesDirectorySub') || 'Understand what each staff role can access in your school.'}
      icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
      iconClass="ic-purple"
      maxWidth="min(1100px, 100vw - 32px)"
      className="modal-xl"
      wide
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>PreOne Role-Based Access Control (RBAC) strictly enforces tenant, campus branch, and classroom boundaries.</span>
          </div>
          <button type="button" className="btn btn-secondary text-xs px-4 py-1.5 font-medium" onClick={onClose}>
            {t('common.close') || 'Close'}
          </button>
        </div>
      }
    >
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
                  aria-selected={activeCategory === 'TEACHING'}
                  onClick={() => setActiveCategory('TEACHING')}
                  className={activeCategory === 'TEACHING' ? 'on' : ''}
                >
                  Teaching &amp; Care
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === 'ADMIN'}
                  onClick={() => setActiveCategory('ADMIN')}
                  className={activeCategory === 'ADMIN' ? 'on' : ''}
                >
                  Admin &amp; Finance
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === 'TRANSPORT'}
                  onClick={() => setActiveCategory('TRANSPORT')}
                  className={activeCategory === 'TRANSPORT' ? 'on' : ''}
                >
                  Transport
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === 'FAMILY'}
                  onClick={() => setActiveCategory('FAMILY')}
                  className={activeCategory === 'FAMILY' ? 'on' : ''}
                >
                  Family
                </button>
              </div>
            )}
          </div>

          {/* Right: Quick Search Input */}
          <div className="relative flex-1 sm:max-w-xs input-icon-wrap">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="input w-full text-xs py-1.5"
              style={{ paddingLeft: 36, paddingRight: search ? 30 : 12 }}
              placeholder="Search roles, fees, attendance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* VIEW 1: ROLE CARDS (DEEP DIVE 2-PANE VIEW)                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {viewMode === 'cards' && (
          <div className="roles-matrix-grid">
            {/* Left Pane: Role Selector Cards */}
            <div className="role-list-pane">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((item) => {
                  const card = getRoleCardData(item.role)
                  const isSelected = activeRoleCard.role === item.role
                  const ItemIcon = ROLE_ICONS[item.role] || Shield

                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`role-card-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div
                        className="role-avatar-box"
                        style={{
                          background: card.iconBg,
                          color: card.iconColor,
                        }}
                      >
                        <ItemIcon style={{ width: 18, height: 18 }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                            {card.title}
                          </span>
                          <span className={`badge ${card.badgeCls || 'b-neutral'} text-[10px] font-mono shrink-0`}>
                            {item.role}
                          </span>
                        </div>

                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }} className="line-clamp-1">
                          {card.tagline}
                        </p>

                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>
                          {card.scope}
                        </div>
                      </div>

                      {isSelected && (
                        <ChevronRight style={{ width: 16, height: 16, color: 'var(--primary)', alignSelf: 'center', flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  <Search className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No matching roles</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Try clearing your search query or switching tabs.</p>
                </div>
              )}
            </div>

            {/* Right Pane: Selected Role Capability Card */}
            <div className="role-details-pane space-y-4">
              {/* 1. Role Hero Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ background: activeRoleCard.iconBg, color: activeRoleCard.iconColor }}
                  >
                    <RoleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        {activeRoleCard.title}
                      </h4>
                      <span className={`badge ${activeRoleCard.badgeCls} font-mono text-[11px] font-semibold`}>
                        {activeRoleCard.role}
                      </span>
                      <span className="badge b-neutral text-[10px]">
                        {activeRoleCard.tierLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                      {activeRoleCard.tagline}
                    </p>
                  </div>
                </div>
                <SecurityShieldIllustration size={44} className="shrink-0 hidden sm:block opacity-75" />
              </div>

              {/* 2. Key High-Sensitivity Capabilities at a Glance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Key Capabilities at a Glance
                  </span>
                  <span className="text-[10px] text-gray-400">Essential permissions overview</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* View Student Fees */}
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">View Student Fees</span>
                      {renderStatusBadge(
                        activeRoleCard.highlights.viewStudentFees.status,
                        activeRoleCard.highlights.viewStudentFees.statusLabel
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      {activeRoleCard.highlights.viewStudentFees.explanation}
                    </p>
                    {activeRoleCard.highlights.viewStudentFees.scope && (
                      <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40 inline-block">
                        Scope: {activeRoleCard.highlights.viewStudentFees.scope}
                      </div>
                    )}
                  </div>

                  {/* Message Parents */}
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Message Parents</span>
                      {renderStatusBadge(
                        activeRoleCard.highlights.messageParents.status,
                        activeRoleCard.highlights.messageParents.statusLabel
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      {activeRoleCard.highlights.messageParents.explanation}
                    </p>
                    {activeRoleCard.highlights.messageParents.scope && (
                      <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40 inline-block">
                        Scope: {activeRoleCard.highlights.messageParents.scope}
                      </div>
                    )}
                  </div>

                  {/* Edit Attendance */}
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Edit Attendance</span>
                      {renderStatusBadge(
                        activeRoleCard.highlights.editAttendance.status,
                        activeRoleCard.highlights.editAttendance.statusLabel
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      {activeRoleCard.highlights.editAttendance.explanation}
                    </p>
                    {activeRoleCard.highlights.editAttendance.scope && (
                      <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40 inline-block">
                        Scope: {activeRoleCard.highlights.editAttendance.scope}
                      </div>
                    )}
                  </div>

                  {/* View Staff Salaries */}
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">View Staff Salaries</span>
                      {renderStatusBadge(
                        activeRoleCard.highlights.viewStaffSalaries.status,
                        activeRoleCard.highlights.viewStaffSalaries.statusLabel
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                      {activeRoleCard.highlights.viewStaffSalaries.explanation}
                    </p>
                    {activeRoleCard.highlights.viewStaffSalaries.scope && (
                      <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40 inline-block">
                        Scope: {activeRoleCard.highlights.viewStaffSalaries.scope}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Detailed Operational Capabilities (Plain-English Cards) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Complete Capability Breakdown
                  </span>
                  <span className="text-[10px] text-gray-400">{activeRoleCard.capabilities.length} Capabilities</span>
                </div>

                <div className="space-y-2">
                  {activeRoleCard.capabilities.map((cap) => (
                    <div
                      key={cap.capabilityId}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors hover:border-gray-300 dark:hover:border-gray-700"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {cap.capabilityLabel}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800">
                            {cap.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
                          {cap.explanation || cap.description}
                        </p>
                        {cap.scope && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                            Scope limitation: {cap.scope}
                          </div>
                        )}
                      </div>

                      {renderStatusBadge(cap.status, cap.statusLabel)}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Strict Security & Governance Policy Banner */}
              <div
                className="p-3.5 rounded-xl border space-y-1"
                style={{
                  borderColor:
                    activeRoleCard.policyType === 'security'
                      ? 'rgba(124, 58, 237, 0.3)'
                      : activeRoleCard.policyType === 'warning'
                      ? 'rgba(217, 119, 6, 0.3)'
                      : 'rgba(2, 132, 199, 0.3)',
                  background:
                    activeRoleCard.policyType === 'security'
                      ? 'rgba(124, 58, 237, 0.05)'
                      : activeRoleCard.policyType === 'warning'
                      ? 'rgba(217, 119, 6, 0.05)'
                      : 'rgba(2, 132, 199, 0.05)',
                }}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span>{activeRoleCard.policyTitle}</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed pl-5">
                  {activeRoleCard.policyText}
                </p>
              </div>

              {/* Optional Technical RBAC Audit Toggle (for developers / compliance) */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowTechnicalAudit(!showTechnicalAudit)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <span>Technical RBAC Mapping (Audit Log)</span>
                  {showTechnicalAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showTechnicalAudit && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-[10px] space-y-1 text-gray-600 dark:text-gray-400">
                    <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 font-sans mb-1">
                      Underlying Technical Permission Bundle:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rolesMatrix.find((r) => r.role === activeRoleCard.role)?.permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {p}
                        </span>
                      )) || 'No explicit permissions mapped.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* VIEW 2: QUICK COMPARISON MATRIX (SIDE-BY-SIDE SUMMARY TABLE)  */}
        {/* ───────────────────────────────────────────────────────────── */}
        {viewMode === 'matrix' && (
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200">
              <Info className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Quick Comparison Matrix:</strong> Review core high-sensitivity permissions across key school staff roles at a glance. Click any role row to open its full capability breakdown.
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Staff Role</th>
                    <th className="py-3 px-4">View Student Fees</th>
                    <th className="py-3 px-4">Message Parents</th>
                    <th className="py-3 px-4">Edit Attendance</th>
                    <th className="py-3 px-4">View Staff Salaries</th>
                    <th className="py-3 px-4">Scope Boundary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {comparisonRoles.map((roleCard) => {
                    const RoleIcon = ROLE_ICONS[roleCard.role] || Shield
                    return (
                      <tr
                        key={roleCard.role}
                        onClick={() => {
                          setSelectedRole(roleCard.role)
                          setViewMode('cards')
                        }}
                        className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 cursor-pointer transition-colors"
                      >
                        {/* Role Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: roleCard.iconBg, color: roleCard.iconColor }}
                            >
                              <RoleIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span>{roleCard.title.split('/')[0].trim()}</span>
                                <span className={`badge ${roleCard.badgeCls} text-[9px] px-1 py-0 font-mono`}>
                                  {roleCard.role}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-normal">
                                {roleCard.tierLabel.split('•')[1]?.trim() || roleCard.categoryLabel}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* View Student Fees */}
                        <td className="py-3 px-4">
                          {renderStatusBadge(
                            roleCard.highlights.viewStudentFees.status,
                            roleCard.highlights.viewStudentFees.statusLabel
                          )}
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
    </Modal>
  )
}
