'use client'

import React, { useState, useEffect } from 'react'
import {
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
  AlertTriangle,
  Baby,
} from 'lucide-react'
import { toast } from 'sonner'

export interface LinkedStudentSummary {
  id: string
  name: string
  admissionNo: string
  hasPin?: boolean
  canPickup?: boolean
}

export interface PickupPinModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    fullName: string
    role?: string
    students?: LinkedStudentSummary[]
  } | null
  onSuccess?: () => void
}

export function PickupPinModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: PickupPinModalProps) {
  const [mode, setMode] = useState<'REGENERATE' | 'CUSTOM' | 'AUTOPROVISION' | 'CLEAR'>('REGENERATE')
  const [customPin, setCustomPin] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL')
  const [syncToAll, setSyncToAll] = useState(true)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [completedPin, setCompletedPin] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setMode('REGENERATE')
      setCustomPin('')
      setSelectedStudentId('ALL')
      setSyncToAll(true)
      setReason('')
      setCompletedPin(null)
      setCopied(false)
    }
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleCopy = () => {
    if (!completedPin) return
    navigator.clipboard.writeText(completedPin)
    setCopied(true)
    toast.success('Pickup PIN copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'CUSTOM') {
      const trimmed = customPin.trim()
      if (!/^\d{4,6}$/.test(trimmed)) {
        toast.error('Pickup PIN must be between 4 and 6 numeric digits')
        return
      }
    }

    try {
      setLoading(true)

      let action: 'regenerate' | 'reset' | 'auto-provision' | 'clear' = 'regenerate'
      if (mode === 'CUSTOM') action = 'reset'
      if (mode === 'AUTOPROVISION') action = 'auto-provision'
      if (mode === 'CLEAR') action = 'clear'

      const isSpecificStudent = selectedStudentId !== 'ALL'

      const res = await fetch(`/api/v1/users/${user.id}/pickup-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          pin: mode === 'CUSTOM' ? customPin.trim() : undefined,
          studentId: isSpecificStudent ? selectedStudentId : undefined,
          syncToAllStudents: !isSpecificStudent && syncToAll,
          reason: reason.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to update pickup PIN')
      }

      const resData = data.data || data

      if (mode === 'CLEAR') {
        toast.success(resData.message || 'Pickup PIN cleared successfully')
        onSuccess?.()
        onClose()
      } else {
        const pinReturned = resData.newPin || resData.provisionedPin || customPin.trim()
        setCompletedPin(pinReturned)
        toast.success(resData.message || 'Pickup PIN updated successfully')
        onSuccess?.()
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Manage Pickup PIN
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {user.fullName} ({user.role || 'Family'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {completedPin ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Check size={24} />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                Pickup Security PIN Ready
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Share this PIN securely with the family member for physical gate release and kiosk verification.
              </p>
            </div>

            {/* Large PIN display */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-center gap-2">
                {completedPin.split('').map((char, idx) => (
                  <span
                    key={idx}
                    className="w-11 h-12 bg-white dark:bg-gray-900 border-2 border-indigo-500/40 rounded-lg flex items-center justify-center text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 shadow-sm"
                  >
                    {char}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 text-xs text-gray-700 dark:text-gray-200"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy PIN to Clipboard'}</span>
              </button>
            </div>

            <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 text-left flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                For security reasons, this PIN is stored with access controls and will be masked with bullets on future views.
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary w-full text-xs font-medium py-2 rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Action selector tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setMode('REGENERATE')}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'REGENERATE'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => setMode('CUSTOM')}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'CUSTOM'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Custom
              </button>
              <button
                type="button"
                onClick={() => setMode('AUTOPROVISION')}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'AUTOPROVISION'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Auto-Fill
              </button>
              <button
                type="button"
                onClick={() => setMode('CLEAR')}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'CLEAR'
                    ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Clear
              </button>
            </div>

            {/* Scope / Student selector */}
            {user.students && user.students.length > 1 && mode !== 'CLEAR' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Baby size={12} className="text-indigo-500" /> Apply PIN Scope
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="ALL">Entire Family (All linked children)</option>
                  {user.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNo})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode-specific body */}
            {mode === 'REGENERATE' && (
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block">Cryptographic Auto-Generation</span>
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Creates a secure 4-digit numeric PIN, filtering out weak sequences (e.g. 0000, 1234), and syncs it for immediate gate pickup verification.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {mode === 'CUSTOM' && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                  Enter Custom 4 to 6 Digit PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 8492"
                  className="w-full text-base font-mono tracking-widest text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-900 dark:text-white"
                  autoFocus
                />
                <p className="text-[10px] text-gray-500">
                  Must be between 4 and 6 numeric digits. Trivial repeated or sequential digits will be rejected.
                </p>
              </div>
            )}

            {mode === 'AUTOPROVISION' && (
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold block">Smart Provisioning</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Scans the guardian profile and all linked children. If any active pickup authorization is missing a PIN, generates and links a secure PIN automatically.
                </span>
              </div>
            )}

            {mode === 'CLEAR' && (
              <div className="p-3 bg-red-50/60 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50 space-y-1.5 text-xs text-red-900 dark:text-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block">Remove Pickup PIN</span>
                    <span className="text-[11px] text-red-700 dark:text-red-300">
                      Clearing the pickup PIN will prevent this person from authenticating at physical pickup kiosks using a PIN until a new PIN is assigned.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Reason / Justification */}
            <div className="space-y-1">
              <label className="text-[11px] text-gray-500 dark:text-gray-400">
                Reason / Note (optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Requested by parent over front-desk support"
                className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-ghost btn-sm text-xs text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (mode === 'CUSTOM' && customPin.length < 4)}
                className={`btn btn-sm text-xs flex items-center gap-1.5 font-medium px-4 py-2 rounded-xl text-white ${
                  mode === 'CLEAR'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : mode === 'CLEAR' ? (
                  <Trash2 size={13} />
                ) : mode === 'REGENERATE' ? (
                  <RefreshCw size={13} />
                ) : mode === 'AUTOPROVISION' ? (
                  <Sparkles size={13} />
                ) : (
                  <Check size={13} />
                )}
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'CLEAR'
                    ? 'Confirm Clear PIN'
                    : mode === 'REGENERATE'
                    ? 'Generate & Rotate'
                    : mode === 'AUTOPROVISION'
                    ? 'Auto-Provision'
                    : 'Save Custom PIN'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
