'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle2, RefreshCw, UserX, UserCheck, ShieldAlert
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { UserRecord, ROLE_BADGE } from './types'
import { normalizeRole } from '@/lib/roles'

interface SuspendUserModalProps {
  open: boolean
  onClose: () => void
  user: UserRecord | null
  onSuccess?: () => void
}

const COMMON_SUSPEND_REASONS = [
  'Administrative review',
  'Contract pause / Extended leave',
  'Security policy violation',
  'Role transition',
  'Offboarding pending',
  'Other',
]

export function SuspendUserModal({
  open,
  onClose,
  user,
  onSuccess,
}: SuspendUserModalProps) {
  const toast = useToast()

  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setReason(COMMON_SUSPEND_REASONS[0])
      setCustomReason('')
    }
  }, [open, user])

  if (!user) return null

  const isCurrentlyActive = user.status === 'ACTIVE'
  const actionToPerform = isCurrentlyActive ? 'suspend' : 'activate'

  const effectiveReason =
    reason === 'Other' ? customReason.trim() : reason

  const handleAction = async () => {
    setSubmitting(true)
    try {
      const targetUserId = user.userId || user.id
      const res = await fetch(`/api/v1/users/${targetUserId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionToPerform,
          reason: isCurrentlyActive ? (effectiveReason || undefined) : 'Reactivated by administrator',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || `Failed to ${actionToPerform} user`)
      }

      toast.success(
        isCurrentlyActive ? 'User Suspended' : 'User Reactivated',
        `Account for ${user.name} has been ${isCurrentlyActive ? 'suspended' : 'reactivated'}.`
      )
      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      toast.error('Action Failed', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const roleNormalized = normalizeRole(user.role)
  const badge = ROLE_BADGE[roleNormalized] || { cls: 'b-neutral', label: user.role }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCurrentlyActive ? 'Suspend User Access' : 'Reactivate User Access'}
      subtitle={
        isCurrentlyActive
          ? 'Temporarily halt account access and terminate active sessions'
          : 'Restore full account access and clear login lockouts'
      }
      icon={isCurrentlyActive ? <UserX size={20} /> : <UserCheck size={20} />}
      iconClass={isCurrentlyActive ? 'ic-red' : 'ic-green'}
      maxWidth={500}
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

        {isCurrentlyActive ? (
          /* Suspend Warning & Reason */
          <div className="space-y-3.5">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 text-xs">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1">
                <span className="font-semibold block">Warning: Active Sessions Will Be Terminated</span>
                <span>
                  Suspending <strong>{user.name}</strong> will instantly revoke all connected web and mobile device sessions. The user will be blocked from logging into the portal until reactivated.
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Reason for Suspension
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              >
                {COMMON_SUSPEND_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {reason === 'Other' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">
                  Specify Reason
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter suspension reason..."
                  className="w-full text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
          </div>
        ) : (
          /* Reactivate Info */
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300 text-xs">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1">
                <span className="font-semibold block">Restore Account Capabilities</span>
                <span>
                  Reactivating <strong>{user.name}</strong> will return their status to Active and clear any failed authentication lockouts, enabling them to log in immediately.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-secondary text-xs py-2 px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAction}
            disabled={submitting}
            className={`btn text-xs py-2 px-4 flex items-center gap-1.5 ${
              isCurrentlyActive ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {submitting && <RefreshCw size={13} className="animate-spin" />}
            <span>
              {submitting
                ? (isCurrentlyActive ? 'Suspending...' : 'Reactivating...')
                : (isCurrentlyActive ? 'Suspend Account' : 'Reactivate Account')}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
