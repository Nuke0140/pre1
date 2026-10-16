'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  User,
  Lock,
  KeyRound,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

export interface PickupGuardianData {
  id: string
  linkId?: string
  name: string
  relationship: string
  phone: string
  email?: string | null
  photoUrl?: string | null
  isPrimary?: boolean
  isEmergencyContact?: boolean
  emergencyPriority?: number
  canPickup?: boolean
  pickupStatus?: string
  pickupDays?: string | null
  pickupTimeWindow?: string | null
  pickupRestrictions?: string | null
  authStartDate?: string | null
  authExpiresAt?: string | null
  verifiedAt?: string | null
  verifiedByName?: string | null
  hasPickupPin?: boolean
  pickupPinMasked?: string | null
  occupation?: string | null
  portalAccount?: any
}

interface ManagePickupAuthModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  guardian: PickupGuardianData | null
  onSuccess: () => void
}

const PRESET_DAYS = [
  'All Days',
  'Mon, Tue, Wed, Thu, Fri',
  'Mon, Wed, Fri',
  'Tue, Thu',
  'Custom',
]

const PRESET_WINDOWS = [
  'No time restriction configured',
  '12:30 PM – 01:30 PM',
  '01:45 PM – 02:15 PM',
  '02:30 PM – 03:30 PM',
  '03:30 PM – 04:30 PM',
  '05:00 PM – 06:00 PM',
  'Custom',
]

export function ManagePickupAuthModal({
  open,
  onClose,
  studentId,
  studentName,
  guardian,
  onSuccess,
}: ManagePickupAuthModalProps) {
  const [pickupStatus, setPickupStatus] = useState<'AUTHORIZED' | 'NOT_AUTHORIZED' | 'PENDING' | 'RESTRICTED' | 'EXPIRED'>('AUTHORIZED')
  const [isEmergencyContact, setIsEmergencyContact] = useState(false)
  const [emergencyPriority, setEmergencyPriority] = useState(1)
  const [isPrimary, setIsPrimary] = useState(false)
  
  const [selectedDayPreset, setSelectedDayPreset] = useState('All Days')
  const [customDays, setCustomDays] = useState('')
  
  const [selectedWindowPreset, setSelectedWindowPreset] = useState('No time restriction configured')
  const [customWindow, setCustomWindow] = useState('')
  
  const [authStartDate, setAuthStartDate] = useState('')
  const [authExpiresAt, setAuthExpiresAt] = useState('')
  const [pickupRestrictions, setPickupRestrictions] = useState('')
  const [verifiedByName, setVerifiedByName] = useState('')
  const [customPin, setCustomPin] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (guardian && open) {
      const status = (guardian.pickupStatus as any) || (guardian.canPickup ? 'AUTHORIZED' : 'NOT_AUTHORIZED')
      setPickupStatus(status)
      setIsEmergencyContact(Boolean(guardian.isEmergencyContact ?? guardian.isPrimary))
      setEmergencyPriority(guardian.emergencyPriority || 1)
      setIsPrimary(Boolean(guardian.isPrimary))

      // Days preset
      const days = guardian.pickupDays || 'All Days'
      if (PRESET_DAYS.includes(days)) {
        setSelectedDayPreset(days)
        setCustomDays('')
      } else {
        setSelectedDayPreset('Custom')
        setCustomDays(days)
      }

      // Time window preset
      const tw = guardian.pickupTimeWindow || 'No time restriction configured'
      if (PRESET_WINDOWS.includes(tw)) {
        setSelectedWindowPreset(tw)
        setCustomWindow('')
      } else {
        setSelectedWindowPreset('Custom')
        setCustomWindow(tw)
      }

      setAuthStartDate(guardian.authStartDate ? new Date(guardian.authStartDate).toISOString().slice(0, 10) : '')
      setAuthExpiresAt(guardian.authExpiresAt ? new Date(guardian.authExpiresAt).toISOString().slice(0, 10) : '')
      setPickupRestrictions(guardian.pickupRestrictions || '')
      setVerifiedByName(guardian.verifiedByName || '')
      setCustomPin('')
    }
  }, [guardian, open])

  if (!open || !guardian) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const resolvedDays = selectedDayPreset === 'Custom' ? customDays.trim() : (selectedDayPreset === 'All Days' ? null : selectedDayPreset)
      const resolvedWindow = selectedWindowPreset === 'Custom' ? customWindow.trim() : (selectedWindowPreset === 'No time restriction configured' ? null : selectedWindowPreset)

      if (customPin && !/^\d{4,6}$/.test(customPin.trim())) {
        toast.error('Invalid PIN', 'Pickup PIN must be 4 to 6 numeric digits')
        setSaving(false)
        return
      }

      const payload = {
        action: 'MANAGE_PICKUP',
        guardianId: guardian.id,
        pickupStatus,
        canPickup: pickupStatus === 'AUTHORIZED' || pickupStatus === 'RESTRICTED',
        isEmergencyContact,
        emergencyPriority: Number(emergencyPriority) || 1,
        isPrimary,
        pickupDays: resolvedDays,
        pickupTimeWindow: resolvedWindow,
        authStartDate: authStartDate ? new Date(authStartDate).toISOString() : null,
        authExpiresAt: authExpiresAt ? new Date(authExpiresAt).toISOString() : null,
        pickupRestrictions: pickupRestrictions.trim() || null,
        verifiedByName: verifiedByName.trim() || null,
        verifiedAt: verifiedByName.trim() ? new Date().toISOString() : null,
        ...(customPin.trim() ? { pickupPin: customPin.trim() } : {}),
      }

      const res = await fetch(`/api/v1/students/${studentId}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Pickup Security Updated', `Pickup authorization configured for ${guardian.name}`)
        onSuccess()
        onClose()
      } else {
        toast.error('Update Failed', json.error?.message || 'Could not update authorization')
      }
    } catch (err: any) {
      toast.error('Network Error', err.message || 'Failed to save authorization')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-linear-to-r from-purple-50 via-indigo-50/50 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Manage Pickup Authorization
              </h2>
              <p className="text-xs text-slate-500">
                Child Safety & Dismissal Gate Policy for <span className="font-semibold text-slate-700 dark:text-slate-300">{studentName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Guardian Info Banner */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
              {guardian.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{guardian.name}</div>
              <div className="text-slate-500 text-[11px]">{guardian.relationship} • {guardian.phone}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">PIN Status:</span>
            <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">
              {guardian.hasPickupPin ? 'Configured (••••)' : 'Not set'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Pickup Authorization Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={14} className="text-purple-600" />
              <span>Pickup Authorization Status *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'AUTHORIZED', label: 'Authorized for Pickup', color: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
                { key: 'RESTRICTED', label: 'Restricted Pickup', color: 'border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
                { key: 'PENDING', label: 'Authorization Pending', color: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
                { key: 'NOT_AUTHORIZED', label: 'Not Authorized', color: 'border-slate-400 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                { key: 'EXPIRED', label: 'Authorization Expired', color: 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setPickupStatus(opt.key as any)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col justify-between gap-1 ${
                    pickupStatus === opt.key
                      ? `${opt.color} ring-2 ring-purple-500/20 shadow-xs font-bold`
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{opt.label}</span>
                  {pickupStatus === opt.key && (
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">● Selected</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              * Gate attendants and teachers will strictly enforce this status during daily dismissal.
            </p>
          </div>

          {/* Emergency Contact & Priority Settings */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={14} className="text-purple-600" />
                <span>Emergency Contact Designations</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergencyContact}
                  onChange={(e) => setIsEmergencyContact(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Emergency Contact</div>
                  <div className="text-[11px] text-slate-400">Call during medical or safety emergencies</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => {
                    setIsPrimary(e.target.checked)
                    if (e.target.checked) setIsEmergencyContact(true)
                  }}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Primary Contact</div>
                  <div className="text-[11px] text-slate-400">Main contact for school operations</div>
                </div>
              </label>
            </div>

            {isEmergencyContact && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Call Priority Order:</span>
                <select
                  value={emergencyPriority}
                  onChange={(e) => setEmergencyPriority(Number(e.target.value))}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                >
                  <option value={1}>1st Call (Priority 1)</option>
                  <option value={2}>2nd Call (Priority 2)</option>
                  <option value={3}>3rd Call (Priority 3)</option>
                  <option value={4}>4th Call (Priority 4)</option>
                </select>
              </div>
            )}
          </div>

          {/* Scope: Days of Week and Time Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Days of Week */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-purple-600" />
                <span>Authorized Days</span>
              </label>
              <select
                value={selectedDayPreset}
                onChange={(e) => setSelectedDayPreset(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500/20"
              >
                {PRESET_DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {selectedDayPreset === 'Custom' && (
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed, Fri"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-1"
                />
              )}
            </div>

            {/* Time Window */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={13} className="text-purple-600" />
                <span>Pickup Time Window</span>
              </label>
              <select
                value={selectedWindowPreset}
                onChange={(e) => setSelectedWindowPreset(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500/20"
              >
                {PRESET_WINDOWS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              {selectedWindowPreset === 'Custom' && (
                <input
                  type="text"
                  placeholder="e.g. 01:45 PM – 02:15 PM"
                  value={customWindow}
                  onChange={(e) => setCustomWindow(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-1"
                />
              )}
            </div>
          </div>

          {/* Dates & Expiry */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valid From</label>
              <input
                type="date"
                value={authStartDate}
                onChange={(e) => setAuthStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expires On</label>
              <input
                type="date"
                value={authExpiresAt}
                onChange={(e) => setAuthExpiresAt(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Specific Restrictions / Gate Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <span>Approved Pickup Restrictions / Notes</span>
            </label>
            <textarea
              rows={2}
              value={pickupRestrictions}
              onChange={(e) => setPickupRestrictions(e.target.value)}
              placeholder="e.g. Grandmother collects on Fridays only. Must verify physical photo ID before releasing."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Staff Verification & Pickup PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verified By (Staff Name)</label>
              <input
                type="text"
                placeholder="e.g. Principal Ananya"
                value={verifiedByName}
                onChange={(e) => setVerifiedByName(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <KeyRound size={12} className="text-purple-600" />
                <span>Configure Pickup PIN</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder={guardian.hasPickupPin ? "•••• (keep existing)" : "4 to 6 numeric digits"}
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-purple-600/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>{saving ? 'Saving...' : 'Save Authorization'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
