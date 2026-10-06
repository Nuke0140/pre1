'use client'

import React, { useState, useEffect } from 'react'
import {
  Users, AlertCircle, ArrowRight, CheckCircle2, Shield,
  Building, RefreshCw, KeyRound, Edit3, Sliders
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'
import { Role, BranchOption, CANONICAL_STAFF_ROLES, ROLE_BADGE } from './types'

export type BulkActionType =
  | 'ASSIGN_ROLE'
  | 'CHANGE_BRANCH'
  | 'ACTIVATE'
  | 'SUSPEND'
  | 'FORCE_PASSWORD_CHANGE'
  | 'BULK_EDIT'
  | 'CUSTOM_FIELD'

export type OverrideMode = 'UPDATE_ALL' | 'ONLY_EMPTY' | 'ONLY_MATCHING' | 'SKIP_EXISTING'

interface BulkDiffItem {
  userId: string
  name: string
  before: string
  after: string
  willChange: boolean
}

interface BulkActionModalProps {
  open: boolean
  onClose: () => void
  selectedUserIds: string[]
  branches: BranchOption[]
  onSuccess: () => void
}

export function BulkActionModal({
  open,
  onClose,
  selectedUserIds,
  branches,
  onSuccess,
}: BulkActionModalProps) {
  const toast = useToast()
  const { t } = useI18n()

  const [step, setStep] = useState<'CONFIG' | 'DIFF_PREVIEW'>('CONFIG')
  const [actionType, setActionType] = useState<BulkActionType>('ASSIGN_ROLE')

  // Action configurations
  const [targetRole, setTargetRole] = useState<Role>('TEACHER')
  const [targetBranchId, setTargetBranchId] = useState<string>('')
  const [editField, setEditField] = useState<'department' | 'designation'>('department')
  const [editValue, setEditValue] = useState<string>('')
  const [overrideMode, setOverrideMode] = useState<OverrideMode>('UPDATE_ALL')
  const [matchCurrentValue, setMatchCurrentValue] = useState<string>('')

  // Custom Field
  const [customFields, setCustomFields] = useState<any[]>([])
  const [selectedCustomFieldName, setSelectedCustomFieldName] = useState<string>('')
  const [customFieldValue, setCustomFieldValue] = useState<string>('')

  // Preview state
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [diffItems, setDiffItems] = useState<BulkDiffItem[]>([])
  const [previewStats, setPreviewStats] = useState({
    totalSelected: 0,
    willUpdate: 0,
    willSkip: 0,
    blocked: 0,
  })

  // Execution state
  const [executing, setExecuting] = useState(false)

  // Fetch custom field definitions
  useEffect(() => {
    if (open) {
      fetch('/api/v1/users/custom-fields')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data?.fields) {
            setCustomFields(json.data.fields)
            if (json.data.fields.length > 0) {
              setSelectedCustomFieldName(json.data.fields[0].key)
            }
          }
        })
        .catch(() => {})
    }
  }, [open])

  const buildPayload = (mode: 'PREVIEW' | 'EXECUTE') => {
    const payload: any = {
      action: actionType,
      userIds: selectedUserIds,
      mode,
    }

    if (actionType === 'ASSIGN_ROLE') {
      payload.role = targetRole
      payload.isPrimary = true
    } else if (actionType === 'CHANGE_BRANCH') {
      payload.branchId = targetBranchId || null
    } else if (actionType === 'BULK_EDIT') {
      payload.field = editField
      payload.fieldValue = editValue
      payload.overrideMode = overrideMode
      payload.matchCurrentValue = matchCurrentValue
    } else if (actionType === 'CUSTOM_FIELD') {
      payload.fieldName = selectedCustomFieldName
      payload.fieldValue = customFieldValue
      payload.overrideMode = overrideMode
      payload.matchCurrentValue = matchCurrentValue
    }

    return payload
  }

  const handleGeneratePreview = async () => {
    setLoadingPreview(true)
    try {
      const payload = buildPayload('PREVIEW')
      const res = await fetch('/api/v1/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to generate preview')
      }

      setDiffItems(json.data?.diff || [])
      setPreviewStats({
        totalSelected: selectedUserIds.length,
        willUpdate: json.data?.updatedCount || 0,
        willSkip: json.data?.unchangedCount || 0,
        blocked: json.data?.blocked?.length || 0,
      })
      setStep('DIFF_PREVIEW')
    } catch (err: any) {
      toast.error('Preview Error', err.message || 'Could not analyze bulk changes')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleExecute = async () => {
    setExecuting(true)
    try {
      const payload = buildPayload('EXECUTE')
      const res = await fetch('/api/v1/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Bulk operation failed')
      }

      toast.success(
        'Bulk Update Applied',
        `Successfully updated ${json.data?.updatedCount || selectedUserIds.length} users.`
      )
      onSuccess()
      handleClose()
    } catch (err: any) {
      toast.error('Execution Failed', err.message || 'Failed to execute bulk action')
    } finally {
      setExecuting(false)
    }
  }

  const handleClose = () => {
    setStep('CONFIG')
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('users.bulkOperations') || 'Bulk User Operations'}
      subtitle={`Configure and preview changes across ${selectedUserIds.length} selected users`}
      wide
    >
      <div className="space-y-5 py-2">
        {step === 'CONFIG' && (
          <div className="space-y-4">
            {/* Action selector tiles */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Select Action to Perform
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'ASSIGN_ROLE', label: 'Change Role', icon: Shield, desc: 'Assign primary role' },
                  { id: 'CHANGE_BRANCH', label: 'Move Branch', icon: Building, desc: 'Reassign campus' },
                  { id: 'BULK_EDIT', label: 'Bulk Field Edit', icon: Edit3, desc: 'Dept or Designation' },
                  { id: 'ACTIVATE', label: 'Set Active', icon: CheckCircle2, desc: 'Restore account access' },
                  { id: 'SUSPEND', label: 'Suspend', icon: AlertCircle, desc: 'Halt account access' },
                  { id: 'FORCE_PASSWORD_CHANGE', label: 'Force Password Change', icon: KeyRound, desc: 'Require reset on login' },
                  { id: 'CUSTOM_FIELD', label: 'Custom Field', icon: Sliders, desc: 'Update custom attribute' },
                ].map((act) => {
                  const Icon = act.icon
                  const isSelected = actionType === act.id
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id as BulkActionType)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-purple-600'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-purple-900 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}>
                          {act.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{act.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Parameter configuration based on chosen action */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
              {actionType === 'ASSIGN_ROLE' && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Select New Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as Role)}
                    className="select w-full text-xs"
                  >
                    {CANONICAL_STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_BADGE[r]?.label || r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {actionType === 'CHANGE_BRANCH' && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Select Target Campus Branch
                  </label>
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
                    className="select w-full text-xs"
                  >
                    <option value="">All Campuses / Central Headquarters</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(actionType === 'BULK_EDIT' || actionType === 'CUSTOM_FIELD') && (
                <div className="space-y-3">
                  {actionType === 'BULK_EDIT' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                          Field to Update
                        </label>
                        <select
                          value={editField}
                          onChange={(e) => setEditField(e.target.value as any)}
                          className="select w-full text-xs"
                        >
                          <option value="department">Department</option>
                          <option value="designation">Designation / Title</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                          New Value
                        </label>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="e.g. Early Years Academics"
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {actionType === 'CUSTOM_FIELD' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                          Custom Field
                        </label>
                        {customFields.length > 0 ? (
                          <select
                            value={selectedCustomFieldName}
                            onChange={(e) => setSelectedCustomFieldName(e.target.value)}
                            className="select w-full text-xs"
                          >
                            {customFields.map((cf) => (
                              <option key={cf.id} value={cf.key}>
                                {cf.name} ({cf.key})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={selectedCustomFieldName}
                            onChange={(e) => setSelectedCustomFieldName(e.target.value)}
                            placeholder="e.g. employee_tier"
                            className="input w-full text-xs"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                          Field Value
                        </label>
                        <input
                          type="text"
                          value={customFieldValue}
                          onChange={(e) => setCustomFieldValue(e.target.value)}
                          placeholder="Value to set"
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Override Mode Selector */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Override Rule
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'UPDATE_ALL', label: 'Overwrite All', desc: 'Update all selected users' },
                        { id: 'ONLY_EMPTY', label: 'Only if Empty', desc: 'Keep existing values intact' },
                        { id: 'ONLY_MATCHING', label: 'Only Matching Value', desc: 'Replace specific existing string' },
                        { id: 'SKIP_EXISTING', label: 'Skip Existing', desc: 'Only populate unassigned' },
                      ].map((om) => (
                        <label
                          key={om.id}
                          className={`p-2.5 rounded-lg border flex flex-col cursor-pointer transition-colors ${
                            overrideMode === om.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="overrideMode"
                              checked={overrideMode === om.id}
                              onChange={() => setOverrideMode(om.id as OverrideMode)}
                              className="text-purple-600"
                            />
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{om.label}</span>
                          </div>
                          <span className="text-[11px] text-gray-500 mt-0.5 pl-5">{om.desc}</span>
                        </label>
                      ))}
                    </div>

                    {overrideMode === 'ONLY_MATCHING' && (
                      <div className="mt-3">
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          Current value that must match to trigger update:
                        </label>
                        <input
                          type="text"
                          value={matchCurrentValue}
                          onChange={(e) => setMatchCurrentValue(e.target.value)}
                          placeholder="Existing value to replace"
                          className="input w-full text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(actionType === 'ACTIVATE' || actionType === 'SUSPEND' || actionType === 'FORCE_PASSWORD_CHANGE') && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <p>
                    {actionType === 'ACTIVATE' && 'Will activate status and restore access across all active sessions.'}
                    {actionType === 'SUSPEND' && 'Will immediately revoke all current device sessions and halt user login.'}
                    {actionType === 'FORCE_PASSWORD_CHANGE' && 'Users will be prompted to set a new password upon their next successful login.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
              <button type="button" onClick={handleClose} className="btn btn-secondary text-xs">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={loadingPreview}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
                <span>{loadingPreview ? 'Analyzing Impact...' : 'Preview Changes'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 'DIFF_PREVIEW' && (
          <div className="space-y-4">
            {/* Impact Metric Chips */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20">
                <span className="text-purple-700 dark:text-purple-400 block text-[11px]">Selected Users</span>
                <span className="text-base font-bold text-purple-700 dark:text-purple-400 font-mono">
                  {previewStats.totalSelected}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Will Be Updated</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {previewStats.willUpdate}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-500 block text-[11px]">Unchanged / Skipped</span>
                <span className="text-base font-bold text-gray-700 dark:text-gray-300 font-mono">
                  {previewStats.willSkip}
                </span>
              </div>
            </div>

            {/* Before vs After Diff Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Current (Before)</th>
                    <th className="p-2.5">Updated (After)</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {diffItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="p-2.5 font-mono text-gray-500 line-through">
                        {item.before}
                      </td>
                      <td className="p-2.5 font-mono font-semibold text-purple-700 dark:text-purple-400">
                        {item.after}
                      </td>
                      <td className="p-2.5">
                        {item.willChange ? (
                          <span className="badge badge-success text-[10px]">WILL UPDATE</span>
                        ) : (
                          <span className="badge badge-neutral text-[10px]">UNCHANGED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setStep('CONFIG')}
                disabled={executing}
                className="btn btn-secondary text-xs"
              >
                Back to Config
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={executing}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={executing || previewStats.willUpdate === 0}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {executing ? 'Applying Changes...' : `Confirm & Apply to ${previewStats.willUpdate} Users`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
