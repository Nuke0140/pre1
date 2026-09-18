'use client'

import React, { useState } from 'react'
import { ShieldCheck, Search, Shield, KeyRound, CheckCircle2, Lock } from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { SecurityShieldIllustration } from '@/components/preone'
import { DEFAULT_ROLES_MATRIX, ROLE_BADGE, RoleMatrixItem } from './types'

interface RolesDirectoryModalProps {
  open: boolean
  onClose: () => void
  rolesMatrix?: RoleMatrixItem[]
}

export function RolesDirectoryModal({ open, onClose, rolesMatrix = DEFAULT_ROLES_MATRIX }: RolesDirectoryModalProps) {
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const filteredRoles = rolesMatrix.filter(
    (r) =>
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase())
  )

  const activeRoleDetail = rolesMatrix.find((r) => r.role === selectedRole) || filteredRoles[0] || rolesMatrix[0]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Roles Directory & Permissions Matrix"
      subtitle="Canonical 9 RBAC roles defined in PreOne Enterprise Preschool OS"
      icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
      iconClass="ic-purple"
      wide
    >
      <div className="space-y-6">
        {/* Search bar */}
        <div className="relative input-icon-wrap">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="input w-full text-sm"
            style={{ paddingLeft: 38 }}
            placeholder="Search roles, descriptions, or permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 2-Column Split: Roles List on left, Role Details on right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, minHeight: 440 }}>
          {/* Left Column: Role Cards */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredRoles.map((item) => {
              const isSelected = activeRoleDetail?.role === item.role
              const badge = ROLE_BADGE[item.role] || { cls: 'b-neutral', label: item.role }
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setSelectedRole(item.role)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      {item.label}
                    </span>
                    <span className={`badge ${badge.cls} text-xs font-medium`}>
                      {item.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                    Scope: {item.scope}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right Column: Selected Role Details & Permissions */}
          <div className="bg-gray-50/60 dark:bg-gray-900/60 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
            {activeRoleDetail ? (
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-3.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                        {activeRoleDetail.label} Role Policy
                      </h4>
                      <span className="badge b-primary font-mono text-xs">
                        {activeRoleDetail.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {activeRoleDetail.description}
                    </p>
                  </div>
                  <SecurityShieldIllustration size={56} className="shrink-0 hidden sm:block" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[11px] uppercase tracking-wider mb-0.5">Access Scope</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{activeRoleDetail.scope}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[11px] uppercase tracking-wider mb-0.5">Account Category</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {['PARENT', 'GUARDIAN'].includes(activeRoleDetail.role) ? 'Family & Caregivers' : 'Preschool Workforce'}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                    Authorized Capabilities & Permissions
                  </h5>
                  <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {activeRoleDetail.permissions.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {activeRoleDetail.role === 'GUARDIAN' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Relationship-Scoped Security Guarantee
                    </div>
                    <div>
                      Guardian access is strictly limited to authorized linked children. Financial ledgers, school administrative data, and unrelated children remain completely inaccessible.
                    </div>
                  </div>
                )}

                {activeRoleDetail.role === 'PARENT' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Max 2 Parents Per Child
                    </div>
                    <div>
                      Enforced server-side with database transaction locking. Additional family caregivers (grandparents, uncles, aunts, nannies) must be registered with the GUARDIAN role.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
                <SecurityShieldIllustration size={100} className="mb-3" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No role found</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  No RBAC role matches &quot;{search}&quot;. Try searching for Teacher, Parent, Helper, or Principal.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button type="button" className="btn btn-secondary text-xs" onClick={onClose}>
                Close Directory
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
