'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/preone/Modal'
import { FileText, User, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react'

export interface StartApplicationModalProps {
  open: boolean
  onClose: () => void
  enquiry: any | null
  onSuccess: (result: any) => void
}

export function StartApplicationModal({
  open,
  onClose,
  enquiry,
  onSuccess,
}: StartApplicationModalProps) {
  const [staffOptions, setStaffOptions] = useState<{ id: string; fullName: string; role?: string }[]>([])
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('Phone Call')
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Load authorized staff members
  useEffect(() => {
    if (!open) return

    // Pre-populate sensible follow-up date (tomorrow at 10:00 AM)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setFollowUpDate(localIso)
    setFollowUpType('Phone Call')
    setFollowUpNotes(`Follow-up regarding admission dossier, required certificates, and enrollment confirmation.`)
    setErrorMessage('')

    if (enquiry?.assignedToId) {
      setAssignedStaffId(enquiry.assignedToId)
    }

    async function loadStaff() {
      try {
        const res = await fetch('/api/v1/users?userType=STAFF&limit=100')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setStaffOptions(json.data.map((u: any) => ({
            id: u.id,
            fullName: u.fullName || u.email,
            role: u.role,
          })))
        }
      } catch (e) {
        console.error('Failed to load staff options:', e)
      }
    }

    loadStaff()
  }, [open, enquiry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enquiry?.id) return

    if (!assignedStaffId) {
      setErrorMessage('Please select an authorized staff member to assign this application and follow-up.')
      return
    }

    if (!followUpDate) {
      setErrorMessage('Please specify the follow-up reminder date and time.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch(`/api/v1/leads/${enquiry.id}/start-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedStaffId,
          followUpDate: new Date(followUpDate).toISOString(),
          followUpType,
          followUpNotes: followUpNotes.trim(),
        }),
      })

      const json = await res.json()
      setIsSubmitting(false)

      if (json.success) {
        onSuccess(json.data)
        onClose()
      } else {
        setErrorMessage(json.error?.message || 'Failed to start application.')
      }
    } catch {
      setIsSubmitting(false)
      setErrorMessage('A network error occurred. Please try again.')
    }
  }

  if (!enquiry) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Staff & Schedule Follow-up"
      subtitle={`Enquiry ${enquiry.leadNumber} • Schedule parent consultation and add to Follow-ups queue`}
      icon={<FileText size={20} className="text-primary" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Read-Only Lead Summary */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prospective Pupil:</span>
            <span className="font-semibold text-foreground">
              {enquiry.childName || 'Child'}
              {enquiry.childDob && (() => {
                const birth = new Date(enquiry.childDob)
                if (isNaN(birth.getTime())) return ''
                const now = new Date()
                let y = now.getFullYear() - birth.getFullYear()
                let m = now.getMonth() - birth.getMonth()
                let d = now.getDate() - birth.getDate()
                let age = y * 12 + m
                if (d < 0) age -= 1
                return ` (${Math.max(0, age)} mos old)`
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Parent / Guardian:</span>
            <span className="font-semibold text-foreground">{enquiry.parentName} ({enquiry.phone})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Program & Branch:</span>
            <span className="font-semibold text-foreground">{enquiry.interestedProgram || 'Nursery'} • {enquiry.branchName || 'Main Campus'}</span>
          </div>
        </div>

        {/* Assigned Staff Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User size={13} className="text-primary" />
            <span>Assign Staff Member *</span>
          </label>
          <select
            required
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
            className="input text-xs w-full h-9 rounded-xl bg-background border border-border/80 font-medium"
          >
            <option value="">Select counselor or teacher...</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} {s.role ? `(${s.role})` : ''}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            This staff member will receive an in-app notification and own the follow-up outreach.
          </p>
        </div>

        {/* Follow-up Reminder Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={13} className="text-primary" />
              <span>Follow-up Date & Time *</span>
            </label>
            <input
              type="datetime-local"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="input text-xs w-full h-9 rounded-xl bg-background border border-border/80 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone size={13} className="text-primary" />
              <span>Channel / Type</span>
            </label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="input text-xs w-full h-9 rounded-xl bg-background border border-border/80 font-medium"
            >
              <option value="Phone Call">Phone Call</option>
              <option value="Campus Tour">Campus Tour / Visit</option>
              <option value="WhatsApp Note">WhatsApp Message</option>
              <option value="Document Collection">Document Collection</option>
            </select>
          </div>
        </div>

        {/* Follow-up Instructions / Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Follow-up Notes & Instructions</label>
          <textarea
            rows={2}
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            placeholder="Instructions for the assigned staff member..."
            className="input text-xs w-full rounded-xl py-2 resize-none bg-background border border-border/80"
          />
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs space-y-1.5 border border-destructive/20">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-ghost btn-sm h-9 px-3.5 rounded-xl text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-sm h-9 px-4 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <span>Assigning Follow-up...</span>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Assign & Schedule Follow-up</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
