'use client'

import React, { useState, useEffect } from 'react'
import {
  KeyRound, Eye, EyeOff, RefreshCw, Copy, Check, ShieldAlert,
  Mail, AlertCircle, CheckCircle2, User, Lock
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'
import { UserRecord, ROLE_BADGE } from './types'
import { normalizeRole } from '@/lib/roles'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth'

interface ResetPasswordModalProps {
  open: boolean
  onClose: () => void
  user: UserRecord | null
  onSuccess?: () => void
}

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%^&*'
  let pwd = ''
  pwd += upper[Math.floor(Math.random() * upper.length)]
  pwd += lower[Math.floor(Math.random() * lower.length)]
  pwd += digits[Math.floor(Math.random() * digits.length)]
  pwd += special[Math.floor(Math.random() * special.length)]
  const all = upper + lower + digits + special
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)]
  }
  return pwd
}

export function ResetPasswordModal({
  open,
  onClose,
  user,
  onSuccess,
}: ResetPasswordModalProps) {
  const toast = useToast()
  const { t } = useI18n()

  const [mode, setMode] = useState<'GENERATE' | 'CUSTOM'>('GENERATE')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)
  const [sendEmail, setSendEmail] = useState(true)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Success view state
  const [resetResult, setResetResult] = useState<{
    temporaryPassword: string
    emailSent: boolean
  } | null>(null)

  useEffect(() => {
    if (open) {
      setGeneratedPassword(generateSecurePassword())
      setCustomPassword('')
      setShowPassword(false)
      const isParentRole = user?.role === 'PARENT' || user?.role === 'GUARDIAN'
      setMustChangePassword(isParentRole ? false : true)
      setSendEmail(Boolean(user?.email))
      setReason('')
      setResetResult(null)
      setCopied(false)
      setMode('GENERATE')
    }
  }, [open, user])

  if (!user) return null

  const activePassword = mode === 'GENERATE' ? generatedPassword : customPassword
  const isCustomValid = customPassword.trim().length >= MIN_PASSWORD_LENGTH

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to Clipboard', 'Temporary password copied.')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleRegenerate = () => {
    setGeneratedPassword(generateSecurePassword())
  }

  const handleReset = async () => {
    if (mode === 'CUSTOM' && !isCustomValid) {
      toast.error('Invalid Password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    setSubmitting(true)
    try {
      const targetUserId = user.userId || user.id
      const res = await fetch(`/api/v1/users/${targetUserId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: activePassword,
          mustChangePassword,
          sendEmail: user.email ? sendEmail : false,
          reason: reason.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to reset password')
      }

      setResetResult({
        temporaryPassword: data.temporaryPassword || activePassword,
        emailSent: Boolean(data.emailSent),
      })
      toast.success('Password Reset', `Password has been reset for ${user.name}.`)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error('Reset Failed', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => {
    onClose()
  }

  const roleNormalized = normalizeRole(user.role)
  const badge = ROLE_BADGE[roleNormalized] || { cls: 'b-neutral', label: user.role }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={resetResult ? 'Password Reset Complete' : 'Reset User Password'}
      subtitle={resetResult ? 'The temporary credential has been generated and sessions revoked' : 'Generate or assign a secure temporary credential'}
      icon={<KeyRound size={20} />}
      iconClass="ic-purple"
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

        {resetResult ? (
          /* Success Screen */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base">
                Temporary Password Ready
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                Share this temporary password with <strong>{user.name}</strong>. They will be prompted to set a new password upon signing in.
              </p>
            </div>

            {/* Password Box */}
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Temporary Credential</span>
                {resetResult.emailSent && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                    <Mail size={12} /> Email sent to user
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-base font-bold tracking-wider py-2 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white select-all">
                  {showPassword ? resetResult.temporaryPassword : '••••••••••••'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-secondary p-2.5 rounded-lg shrink-0"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(resetResult.temporaryPassword)}
                  className="btn btn-primary px-3 py-2 text-xs flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                All active web and mobile device sessions have been instantly revoked. Previous sessions cannot be reused.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleDone}
                className="btn btn-primary w-full py-2.5 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Configuration Screen */
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="flex border border-gray-200 dark:border-gray-800 rounded-lg p-1 bg-gray-50/70 dark:bg-gray-900/50 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode('GENERATE')}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
                  mode === 'GENERATE'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Auto-Generate Secure Password
              </button>
              <button
                type="button"
                onClick={() => setMode('CUSTOM')}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
                  mode === 'CUSTOM'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Custom Temporary Password
              </button>
            </div>

            {mode === 'GENERATE' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Generated Password</span>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-sm font-semibold py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                    {showPassword ? generatedPassword : '••••••••••••'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn btn-secondary p-2 rounded-lg shrink-0"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedPassword)}
                    className="btn btn-secondary p-2 rounded-lg shrink-0"
                    title="Copy password"
                  >
                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Custom Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full text-xs font-mono py-2 px-3 pr-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Minimum {MIN_PASSWORD_LENGTH} characters</span>
                  <span className={customPassword.length >= MIN_PASSWORD_LENGTH ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                    {customPassword.length}/{MIN_PASSWORD_LENGTH}
                  </span>
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-2.5 pt-1 border-t border-gray-100 dark:border-gray-800">
              {!(user?.role === 'PARENT' || user?.role === 'GUARDIAN') && (
                <label className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-medium">
                    Require password change on next sign-in (recommended)
                  </span>
                </label>
              )}

              <label className={`flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 select-none ${user.email ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                <input
                  type="checkbox"
                  checked={user.email ? sendEmail : false}
                  disabled={!user.email}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  Send notification email with credentials {user.email ? `to ${user.email}` : '(no email configured)'}
                </span>
              </label>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">
                Administrative Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. User requested credential reset via front desk"
                className="w-full text-xs py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Warning callout */}
            <div className="p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 text-purple-900 dark:text-purple-300 text-xs flex items-start gap-2">
              <Lock size={14} className="shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
              <span>
                Resetting will immediately terminate all active sessions on other devices and record an audit log event.
              </span>
            </div>

            {/* Action buttons */}
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
                onClick={handleReset}
                disabled={submitting || (mode === 'CUSTOM' && !isCustomValid)}
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                {submitting && <RefreshCw size={13} className="animate-spin" />}
                <span>{submitting ? 'Resetting...' : 'Reset Password'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
