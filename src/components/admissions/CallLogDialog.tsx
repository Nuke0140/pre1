'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Check,
  Save,
  Bell,
  HelpCircle,
} from 'lucide-react'

export interface CallLogDialogProps {
  open: boolean
  onClose: () => void
  leadId?: string | null
  applicationId?: string | null
  parentName?: string | null
  phone?: string | null
  phoneNumber?: string | null
  childName?: string | null
  branchId?: string | null
  onSaved?: (record: any) => void
}

export const CALL_OUTCOMES = [
  { id: 'CONNECTED', label: 'Connected / Discussed', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { id: 'NO_ANSWER', label: 'No Answer / Ringing', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { id: 'BUSY', label: 'Busy / Line Engaged', badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  { id: 'CALL_BACK_REQUESTED', label: 'Call Back Requested', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  { id: 'WRONG_NUMBER', label: 'Wrong Number / Invalid', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  { id: 'OTHER', label: 'Other', badge: 'bg-muted text-muted-foreground' },
]

export function CallLogDialog({
  open,
  onClose,
  leadId,
  applicationId,
  parentName = '',
  phone = '',
  phoneNumber = '',
  childName,
  branchId,
  onSaved,
}: CallLogDialogProps) {
  const effectivePhone = phone || phoneNumber || ''
  const toast = useToast()

  // Form states
  const [outcome, setOutcome] = useState('CONNECTED')
  const [callDateTime, setCallDateTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [createReminder, setCreateReminder] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!outcome) {
      setErrorMessage('Please select a call outcome.')
      return
    }

    if (notes.length > 1500) {
      setErrorMessage('Notes cannot exceed 1500 characters.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/v1/admissions/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId || undefined,
          applicationId: applicationId || undefined,
          channel: 'CALL',
          interactionType: 'CALL_LOGGED',
          callOutcome: outcome,
          notes: notes.trim() || undefined,
          parentName: parentName || undefined,
          phone: effectivePhone || undefined,
          branchId: branchId || undefined,
          callDate: callDateTime ? new Date(callDateTime).toISOString() : new Date().toISOString(),
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
          createReminderTask: createReminder || outcome === 'CALL_BACK_REQUESTED',
        }),
      })

      const json = await res.json()
      setSaving(false)

      if (json.success) {
        toast.success(
          'Call Logged! 📞',
          `Outcome: ${CALL_OUTCOMES.find((o) => o.id === outcome)?.label || outcome}`
        )
        onSaved?.(json.data)
        onClose()
      } else {
        setErrorMessage(json.error?.message || 'Failed to save call log. Please try again.')
      }
    } catch {
      setSaving(false)
      setErrorMessage('Network connection error. Your entered notes have been preserved.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Call Interaction"
      subtitle={`Log outreach call with ${parentName || 'Parent'} (${effectivePhone || 'No phone'})${childName ? ` regarding ${childName}` : ''}`}
      icon={<Phone size={20} className="text-primary" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Parent & Phone Header */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
          <div className="min-w-0">
            <span className="text-muted-foreground">Contact: </span>
            <span className="font-bold text-foreground">{parentName || 'Prospective Parent'}</span>
          </div>
          <div className="font-mono font-semibold text-primary">{phone || '—'}</div>
        </div>

        {/* Call Outcome Selection (Mandatory) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Call Outcome *</span>
            <span className="text-[10px] text-muted-foreground font-normal">Select what happened</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CALL_OUTCOMES.map((o) => {
              const isSelected = outcome === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setOutcome(o.id)
                    if (o.id === 'CALL_BACK_REQUESTED') {
                      setCreateReminder(true)
                    }
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold text-left border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary'
                      : 'border-border/70 bg-card hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{o.label}</span>
                    {isSelected && <Check size={12} className="shrink-0 text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date and Time of Call */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-primary" />
            <span>Date & Time of Call</span>
          </label>
          <input
            type="datetime-local"
            value={callDateTime}
            onChange={(e) => setCallDateTime(e.target.value)}
            className="input text-xs w-full h-9 rounded-xl bg-card border border-border/80"
          />
        </div>

        {/* Conversation Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Conversation Notes & Observations</span>
            <span className="text-[10px] text-muted-foreground font-mono">{notes.length}/1500</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Parent requested afternoon batch timings, inquired about daycare, visiting campus this Saturday..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input text-xs w-full rounded-xl py-2 resize-none border border-border/80"
          />
        </div>

        {/* Follow-up Scheduling */}
        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" />
              <span>Schedule Next Follow-up (Optional)</span>
            </label>
          </div>
          <input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => {
              setFollowUpDate(e.target.value)
              if (e.target.value) setCreateReminder(true)
            }}
            className="input text-xs w-full h-9 rounded-xl bg-card border border-border/80"
          />

          {followUpDate && (
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={createReminder}
                onChange={(e) => setCreateReminder(e.target.checked)}
                className="checkbox checkbox-primary checkbox-xs rounded"
              />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Bell size={12} className="text-amber-500" />
                <span>Create reminder task in Follow-ups queue</span>
              </span>
            </label>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-ghost btn-sm h-9 px-3 rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !outcome}
            className="btn btn-primary btn-sm h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
          >
            <Save size={13} />
            <span>{saving ? 'Saving Call...' : 'Save Call Log'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
