'use client'

import React, { useState, useEffect } from 'react'
import {
  Trash2,
  AlertTriangle,
  UserX,
  ShieldAlert,
  Info,
  Check,
  RefreshCw,
  UserCheck,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { UserRecord, ROLE_BADGE } from './types'
import { normalizeRole } from '@/lib/roles'

interface DeleteUserModalProps {
  open: boolean
  onClose: () => void
  user: UserRecord | null
  onSuccess?: () => void
}

const COMMON_DELETE_REASONS = [
  'Staff resignation / Contract departure',
  'Family withdrawal / Student graduated',
  'Security policy violation / Terminated',
  'Duplicate or redundant account',
  'Administrative cleanup',
  'Other',
]

export function DeleteUserModal({
  open,
  onClose,
  user,
  onSuccess,
}: DeleteUserModalProps) {
  const toast = useToast()

  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [affectedStudents, setAffectedStudents] = useState<any[]>([])
  const [selectedAlternateId, setSelectedAlternateId] = useState('')

  useEffect(() => {
    if (open) {
      setReason(COMMON_DELETE_REASONS[0])
      setCustomReason('')
      setConfirmText('')
      setAffectedStudents([])
      setSelectedAlternateId('')
    }
  }, [open, user])

  if (!user) return null

  const effectiveReason = reason === 'Other' ? customReason.trim() : reason
  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDelete = async () => {
    if (!isConfirmed) return

    setSubmitting(true)
    try {
      const targetUserId = user.userId || user.id
      const res = await fetch(`/api/v1/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: effectiveReason || 'Deactivated by administrator',
          ...(selectedAlternateId ? { alternateGuardianId: selectedAlternateId } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (
          data.error?.code === 'PRIMARY_CONTACT_DEACTIVATION_BLOCKED' &&
          data.error?.details?.affectedStudents
        ) {
          const aff = data.error.details.affectedStudents
          setAffectedStudents(aff)
          const firstWithAlt = aff.find(
            (s: any) => s.availableAlternates && s.availableAlternates.length > 0
          )
          if (firstWithAlt && firstWithAlt.availableAlternates.length > 0) {
            setSelectedAlternateId(firstWithAlt.availableAlternates[0].guardianId)
          }
          toast.warning('Nominate Alternate Guardian', data.error.message)
          return
        }
        if (data.error?.code === 'CANNOT_DELETE_SELF') {
          throw new Error('You cannot delete your own account.')
        }
        if (data.error?.code === 'LAST_ADMIN_PROTECTION') {
          throw new Error('Cannot delete the last administrator or owner of the school.')
        }
        throw new Error(data.error?.message || data.error || data.message || 'Failed to delete user')
      }

      toast.success(
        'Account Deactivated',
        `User ${user.name} has been deactivated. Historical records and audit logs are safely retained.`
      )
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Deletion Failed', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const allAlternates = Array.from(
    new Map(
      affectedStudents
        .flatMap((s: any) => s.availableAlternates || [])
        .map((a: any) => [a.guardianId, a])
    ).values()
  )

  const roleNormalized = normalizeRole(user.role)
  const badge = ROLE_BADGE[roleNormalized] || { cls: 'b-neutral', label: user.role }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate & Delete User"
      subtitle="Safely deactivate account access while preserving required historical and operational records."
      icon={<Trash2 size={20} />}
      iconClass="ic-red"
      maxWidth={520}
    >
      <div className="space-y-4">
        {/* User Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <Avatar name={user.name} src={user.avatarUrl} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                {user.name}
              </span>
              <span className={`badge ${badge.cls} text-[10px] shrink-0 font-semibold`}>
                {badge.label}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono truncate">
              {user.email || user.username || `@${user.userId.slice(-6)}`}
            </div>
          </div>
          <StatusBadge status={user.status} />
        </div>

        {/* Warning / Retention Notice */}
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-xs text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>Important Data Retention & Security Policy</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-rose-800/90 dark:text-rose-300/90 pl-1">
            <li>User credentials and all active sessions will be revoked immediately.</li>
            <li>The account will no longer be able to log in or access any school data.</li>
            <li>
              <strong>Operational integrity:</strong> Student profiles, attendance history, invoices,
              and historical audit logs are strictly preserved.
            </li>
          </ul>
        </div>

        {/* Primary Contact Guard Transfer if required */}
        {affectedStudents.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Primary Contact Reassignment Required</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300">
              This user is the designated primary emergency/care contact for enrolled student(s). To
              deactivate this account, you must nominate an alternate active guardian to assume primary contact status.
            </p>
            {allAlternates.length > 0 ? (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Nominate Replacement Primary Contact:
                </label>
                <select
                  value={selectedAlternateId}
                  onChange={(e) => setSelectedAlternateId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white"
                >
                  {allAlternates.map((alt: any) => (
                    <option key={alt.guardianId} value={alt.guardianId}>
                      {alt.name} ({alt.relationship || 'Guardian'}) - {alt.phone || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-rose-700 dark:text-rose-400 font-medium pt-1">
                No active alternate guardian exists for the affected child. Please add a second guardian
                to the family profile first.
              </div>
            )}
          </div>
        )}

        {/* Reason for Deletion */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Deactivation Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white"
          >
            {COMMON_DELETE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reason === 'Other' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specify the reason for deactivating this user..."
              rows={2}
              className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white mt-1.5"
            />
          )}
        </div>

        {/* Destructive Action Confirmation */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            To confirm deactivation, type <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">DELETE</span> below:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 font-mono text-gray-900 dark:text-white"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-secondary text-xs px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || submitting || (affectedStudents.length > 0 && allAlternates.length === 0)}
            className="btn btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5 font-semibold"
          >
            {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Deactivate User</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
