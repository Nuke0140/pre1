'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { UserPlus, AlertTriangle, ArrowRight, Check } from 'lucide-react'
import { fmtDate } from '@/lib/format'

export interface MinimalEnquiryModalProps {
  open: boolean
  onClose: () => void
  branches: { id: string; name: string; isMain?: boolean }[]
  defaultBranchId?: string
  programs: { id: string; code: string; name: string; programType: string }[]
  onSuccess: (enquiry: any) => void
}

export function MinimalEnquiryModal({
  open,
  onClose,
  branches,
  defaultBranchId,
  programs,
  onSuccess,
}: MinimalEnquiryModalProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  // Minimal form fields per specification
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const initialBranchId = defaultBranchId === '__ALL_BRANCHES__' ? '' : (defaultBranchId || '')
  const [branchId, setBranchId] = useState(initialBranchId)
  const [interestedProgram, setInterestedProgram] = useState('')
  const [source, setSource] = useState('WALK_IN')
  const [notes, setNotes] = useState('')

  // Pre-flight duplicate prompt state
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null)

  // Branch-dependent dynamic programs state
  const [branchPrograms, setBranchPrograms] = useState<any[]>(programs || [])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [programFetchError, setProgramFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (defaultBranchId && defaultBranchId !== '__ALL_BRANCHES__' && !branchId) {
      setBranchId(defaultBranchId)
    }
  }, [defaultBranchId, branchId])

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setDuplicateWarning(null)
      const initBranch = defaultBranchId === '__ALL_BRANCHES__' ? (branches[0]?.id || '') : (defaultBranchId || branches[0]?.id || '')
      setBranchId(initBranch)
    }
  }, [open, defaultBranchId, branches])

  // Dynamic branch-dependent program fetching with race condition prevention
  useEffect(() => {
    if (!open) return
    if (!branchId || branchId === '__ALL_BRANCHES__' || branchId === 'all') {
      setBranchPrograms([])
      setInterestedProgram('')
      setProgramFetchError(null)
      return
    }

    let active = true
    setProgramsLoading(true)
    setProgramFetchError(null)

    fetch(`/api/v1/programs?branchId=${encodeURIComponent(branchId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return
        setProgramsLoading(false)
        if (json.success && Array.isArray(json.data)) {
          setBranchPrograms(json.data)
          // Keep selection only if it exists in the newly fetched branch programs
          setInterestedProgram((prev) => {
            const stillValid = json.data.some(
              (p: any) => (p.programType || p.code) === prev || p.id === prev
            )
            return stillValid ? prev : ''
          })
        } else {
          setBranchPrograms([])
          setInterestedProgram('')
          setProgramFetchError(json.error?.message || 'Failed to load programs for this campus.')
        }
      })
      .catch(() => {
        if (!active) return
        setProgramsLoading(false)
        setBranchPrograms([])
        setInterestedProgram('')
        setProgramFetchError('Unable to load programs for this campus. Please try again.')
      })

    return () => {
      active = false
    }
  }, [open, branchId])

  const handleSubmit = async (e: React.FormEvent, overrideDuplicate: boolean = false) => {
    e.preventDefault()

    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (!parentName.trim() || cleanPhone.length < 10) {
      toast.error('Validation Error', 'Parent name and a valid 10-digit mobile number are required.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: parentName.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          childName: childName.trim() || undefined,
          childDob: childDob ? new Date(childDob).toISOString() : undefined,
          branchId: branchId || undefined,
          interestedProgram: interestedProgram || undefined,
          source,
          notes: notes.trim() || undefined,
          overrideDuplicate,
        }),
      })

      const json = await res.json()
      setBusy(false)

      if (json.success) {
        if (json.data.isDuplicate) {
          // Duplicate detected and not overridden
          setDuplicateWarning(json.data)
          return
        }

        toast.success(
          'Enquiry Registered! 🎉',
          `Reference #${json.data.leadNumber || json.data.id?.slice(0, 8)} recorded.`
        )
        // Reset form
        setParentName('')
        setPhone('')
        setEmail('')
        setChildName('')
        setChildDob('')
        setNotes('')
        setDuplicateWarning(null)
        onSuccess(json.data)
        onClose()
      } else {
        toast.error('Submission Failed', json.error?.message || 'Could not register enquiry')
      }
    } catch {
      setBusy(false)
      toast.error('Network Error', 'Failed to submit enquiry')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Prospective Family Enquiry"
      subtitle="Capture parent interest with zero unnecessary friction"
      icon={<UserPlus size={20} className="text-primary" />}
      size="md"
    >
      {duplicateWarning ? (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <AlertTriangle size={15} />
              <span>Duplicate Record Detected</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An enquiry already exists with this phone number or email:{' '}
              <strong className="text-foreground">{duplicateWarning.message || duplicateWarning.enquiry?.leadNumber}</strong>
            </p>
            {duplicateWarning.enquiry && (
              <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs space-y-1">
                <div><strong>Enquiry No:</strong> {duplicateWarning.enquiry.leadNumber}</div>
                <div><strong>Parent:</strong> {duplicateWarning.enquiry.parentName} ({duplicateWarning.enquiry.phone})</div>
                <div><strong>Child:</strong> {duplicateWarning.enquiry.childName || 'Not specified'}</div>
                <div><strong>Current Status:</strong> {duplicateWarning.enquiry.status}</div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDuplicateWarning(null)}
              disabled={busy}
            >
              Back to Form
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1.5"
              onClick={(e) => handleSubmit(e, true)}
              disabled={busy}
            >
              <Check size={14} />
              <span>Register Anyway (Create Lead)</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-3.5">
          {/* Row 1: Parent Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Parent / Guardian Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="input text-xs w-full h-8.5 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input text-xs w-full h-8.5 rounded-xl"
              />
            </div>
          </div>

          {/* Row 2: Email & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Email Address <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="e.g. parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-xs w-full h-8.5 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Enquiry Source <span className="text-destructive">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input text-xs w-full h-8.5 rounded-xl bg-card"
              >
                <option value="WALK_IN">Walk-in Visit</option>
                <option value="PHONE">Phone Call</option>
                <option value="WEBSITE">Website Form</option>
                <option value="REFERRAL">Parent / Staff Referral</option>
                <option value="FACEBOOK">Facebook / Instagram</option>
                <option value="GOOGLE_ADS">Google Search / Ads</option>
                <option value="EVENT">School Open House / Event</option>
                <option value="OTHER">Other Channel</option>
              </select>
            </div>
          </div>

          {/* Row 3: Child Name & DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Child Name <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="input text-xs w-full h-8.5 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Child Date of Birth <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={childDob}
                onChange={(e) => setChildDob(e.target.value)}
                className="input text-xs w-full h-8.5 rounded-xl"
              />
            </div>
          </div>

          {/* Row 4: Branch & Program */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Target Branch <span className="text-destructive">*</span>
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="input text-xs w-full h-8.5 rounded-xl bg-card"
              >
                <option value="">Select School Branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isMain ? '(Main Campus)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Interested Program <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </label>
                {programsLoading && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">Loading programs...</span>
                )}
              </div>
              <select
                value={interestedProgram}
                onChange={(e) => setInterestedProgram(e.target.value)}
                disabled={programsLoading || !branchId || branchPrograms.length === 0}
                className="input text-xs w-full h-8.5 rounded-xl bg-card disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!branchId
                    ? 'Select a branch first...'
                    : programsLoading
                    ? 'Loading campus programs...'
                    : branchPrograms.length === 0
                    ? 'No programs available for this campus'
                    : 'Select Program...'}
                </option>
                {branchPrograms.map((p) => (
                  <option key={p.id} value={p.programType || p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
              {programFetchError && (
                <p className="text-[11px] text-destructive font-medium">{programFetchError}</p>
              )}
              {!programsLoading && branchId && branchPrograms.length === 0 && !programFetchError && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  No programs configured for this campus. Configure in Setup.
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Conversation Notes & Preferences <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Inquired about transport routes, daycare facility, or upcoming intake dates..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input text-xs w-full rounded-xl py-2 resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="btn btn-ghost btn-sm h-8.5 px-3 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm h-8.5 px-4 rounded-xl text-xs font-semibold shadow-xs gap-1.5"
            >
              <span>{busy ? 'Saving...' : 'Record Enquiry'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
