'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  FileSpreadsheet,
  Send,
  DollarSign,
  Loader2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { ClassroomSeatSelector } from '@/components/admissions/ClassroomSeatSelector'
import { SeatAvailabilityBadge } from '@/components/admissions/SeatAvailabilityBadge'
import type { ProgressionEligibilityStatus, ProgressionExecutionResult } from '@/lib/admissions/progression-service'

export interface PromoteStageButtonProps {
  recordId: string
  kind: 'LEAD' | 'APPLICATION'
  initialStage?: string
  studentName?: string
  referenceNumber?: string
  branchId?: string
  academicSessionId?: string
  size?: 'sm' | 'md'
  variant?: 'primary' | 'secondary' | 'compact'
  onSuccess?: (result: ProgressionExecutionResult) => void
  onOpenDetails?: () => void
}

export function PromoteStageButton({
  recordId,
  kind,
  initialStage,
  studentName = 'Candidate',
  referenceNumber = '',
  branchId,
  academicSessionId,
  size = 'sm',
  variant = 'primary',
  onSuccess,
  onOpenDetails,
}: PromoteStageButtonProps) {
  const toast = useToast()

  // State
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [status, setStatus] = useState<ProgressionEligibilityStatus | null>(null)
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [blockedModalOpen, setBlockedModalOpen] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [executionResult, setExecutionResult] = useState<ProgressionExecutionResult | null>(null)

  // Enrollment confirmation form states
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [seatNumber, setSeatNumber] = useState('')

  // Offline Payment states (if transitioning Offer -> Fee Received)
  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [transactionRef, setTransactionRef] = useState('')

  // Fetch real-time eligibility
  const checkEligibility = async (silent = true) => {
    if (!silent) setEvaluating(true)
    try {
      const q = new URLSearchParams()
      if (branchId) q.set('branchId', branchId)
      if (academicSessionId) q.set('academicSessionId', academicSessionId)

      const res = await fetch(`/api/v1/admissions/progression/${recordId}?${q.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setStatus(json.data)
        return json.data as ProgressionEligibilityStatus
      }
    } catch {
      // Ignore background evaluation errors
    } finally {
      if (!silent) setEvaluating(false)
    }
    return null
  }

  // Handle Promote Action
  const handlePromoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)

    try {
      const currentStatus = await checkEligibility(false)
      if (!currentStatus) {
        toast.show({
          title: 'Evaluation Failed',
          description: 'Could not verify stage progression eligibility. Please try again.',
          variant: 'error',
        })
        setLoading(false)
        return
      }

      // Check if blocked by missing prerequisites
      if (!currentStatus.canPromote) {
        setLoading(false)
        setBlockedModalOpen(true)
        return
      }

      // Case A: Next stage is ENROLLED -> Open celebratory Enrollment Confirmation Modal
      if (currentStatus.nextStage === 'ENROLLED') {
        setLoading(false)
        await loadEligibleClassrooms(currentStatus.candidateDetails.branchId || branchId, currentStatus.candidateDetails.programType)
        setEnrollModalOpen(true)
        return
      }

      // Case B: Next stage is FEE_RECEIVED and payment is not verified -> Open Fee Recording Modal
      if (currentStatus.nextStage === 'FEE_RECEIVED' && !currentStatus.paymentStatus?.isPaid) {
        setLoading(false)
        const amt = currentStatus.paymentStatus?.requiredAmountCents
          ? (currentStatus.paymentStatus.requiredAmountCents / 100).toFixed(2)
          : '15000'
        setPaymentAmount(amt)
        setFeeModalOpen(true)
        return
      }

      // Case C: Standard 1-Click Promote (Enquiry -> Application, Application -> Offer, etc.)
      await executePromotion({})
    } catch (err: any) {
      toast.show({
        title: 'Promotion Error',
        description: err.message || 'Failed to promote record.',
        variant: 'error',
      })
      setLoading(false)
    }
  }

  // Load Classrooms for enrollment confirmation
  const loadEligibleClassrooms = async (bId?: string | null, programType?: string | null) => {
    setLoadingClassrooms(true)
    try {
      const q = new URLSearchParams()
      if (bId) q.set('branchId', bId)
      if (programType) q.set('programType', programType)

      const res = await fetch(`/api/v1/admissions/capacity?${q.toString()}`).catch(() => null)
      const json = res ? await res.json().catch(() => null) : null
      let list = json?.success && Array.isArray(json.data?.classrooms) ? json.data.classrooms : null

      if (!list) {
        const fallbackRes = await fetch(`/api/v1/classrooms?${q.toString()}`)
        const fallbackJson = await fallbackRes.json()
        if (fallbackJson.success && Array.isArray(fallbackJson.data)) {
          list = fallbackJson.data
        }
      }

      if (Array.isArray(list)) {
        const filtered = programType
          ? list.filter((c: any) => c.programType === programType || !c.programType)
          : list
        const finalClassrooms = filtered.length > 0 ? filtered : list
        setClassrooms(finalClassrooms)
        const firstAvailable = finalClassrooms.find((c: any) => (c.availableSeats ?? 1) > 0) || finalClassrooms[0]
        if (firstAvailable) {
          setSelectedClassroomId(firstAvailable.id)
        }
      }
    } catch (e) {
      console.error('Failed to load classrooms with capacity:', e)
    } finally {
      setLoadingClassrooms(false)
    }
  }

  // Execute Promotion API Call
  const executePromotion = async (payload: any) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/admissions/progression/${recordId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          branchId,
          academicSessionId,
        }),
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error?.message || json.message || 'Promotion rejected by server')
      }

      const result: ProgressionExecutionResult = json.data
      setExecutionResult(result)

      // If enrolled, open celebration modal
      if (result.targetStage === 'ENROLLED') {
        setEnrollModalOpen(false)
        setSuccessModalOpen(true)
      } else {
        toast.show({
          title: 'Stage Promoted!',
          description: result.message,
          variant: 'success',
        })
      }

      onSuccess?.(result)
    } catch (err: any) {
      toast.show({
        title: 'Promotion Blocked',
        description: err.message || 'Could not complete stage progression.',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper labels
  const getButtonLabel = () => {
    if (loading || evaluating) return 'Checking...'
    if (!status) {
      if (kind === 'LEAD') return 'Start Application →'
      return 'Promote to Next Stage →'
    }
    if (status.nextStage === 'APPLICATION') return 'Convert to Application'
    if (status.nextStage === 'OFFER') return 'Generate Offer'
    if (status.nextStage === 'FEE_RECEIVED') return 'Confirm Fee Received'
    if (status.nextStage === 'ENROLLED') return 'Enroll Student 🎓'
    return 'Fully Enrolled'
  }

  const isTerminal = status?.currentStage === 'ENROLLED'

  return (
    <>
      <button
        type="button"
        disabled={loading || isTerminal}
        onClick={handlePromoteClick}
        className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all shadow-xs rounded-xl ${
          size === 'sm' ? 'h-7.5 px-2.5 text-[11px]' : 'h-9 px-4 text-xs'
        } ${
          isTerminal
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default opacity-80'
            : variant === 'primary'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border border-emerald-600/30 active:scale-[0.98]'
            : 'bg-card hover:bg-muted text-foreground border border-border/80'
        }`}
        title={status?.nextStage ? `Progress to ${status.nextStageLabel}` : '1-Click Stage Progression'}
      >
        {loading || evaluating ? (
          <Loader2 size={12} className="animate-spin text-current" />
        ) : isTerminal ? (
          <CheckCircle2 size={13} className="text-emerald-500" />
        ) : (
          <Sparkles size={12} className="text-amber-200 shrink-0" />
        )}
        <span className="truncate">{getButtonLabel()}</span>
      </button>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. BLOCKED PREREQUISITES DIALOG                                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={blockedModalOpen}
        onClose={() => setBlockedModalOpen(false)}
        title="Progression Blocked"
        subtitle={`Requirements needed before moving ${studentName} to ${status?.nextStageLabel || 'Next Stage'}`}
        icon={<AlertTriangle size={20} className="text-amber-500" />}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
            <span className="font-bold block mb-1">Missing Stage Prerequisites:</span>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground dark:text-amber-200/80">
              {status?.blockedReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* Actionable Prerequisite items */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Required Next Steps
            </span>
            <div className="divide-y divide-border/60 border border-border/70 rounded-xl overflow-hidden bg-card">
              {status?.prerequisites.map((req) => (
                <div key={req.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${req.status === 'SATISFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="font-semibold text-foreground">{req.title}</span>
                    </div>
                    {req.reason && <p className="text-muted-foreground mt-0.5 text-[11px]">{req.reason}</p>}
                  </div>
                  {req.status !== 'SATISFIED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setBlockedModalOpen(false)
                        onOpenDetails?.()
                      }}
                      className="btn btn-outline btn-sm h-7 px-2.5 text-[11px] shrink-0 rounded-lg gap-1 font-semibold"
                    >
                      <span>Resolve</span>
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBlockedModalOpen(false)}
              className="btn btn-outline btn-sm h-8 px-4 rounded-xl"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setBlockedModalOpen(false)
                onOpenDetails?.()
              }}
              className="btn btn-primary btn-sm h-8 px-4 rounded-xl font-semibold gap-1.5"
            >
              <span>Open Dossier Inspector</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. RECORD VERIFIED OFFLINE FEE MODAL                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={feeModalOpen}
        onClose={() => setFeeModalOpen(false)}
        title="Authoritative Fee Payment Receipt"
        subtitle={`Verify and log admission fee payment for ${studentName}`}
        icon={<DollarSign size={20} className="text-emerald-500" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setFeeModalOpen(false)
            executePromotion({
              offlinePayment: {
                amountRupees: parseFloat(paymentAmount) || 0,
                method: paymentMethod,
                transactionRef: transactionRef.trim() || undefined,
              },
            })
          }}
          className="space-y-4 text-xs"
        >
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
            <span className="font-bold text-foreground">Authoritative Finance Gate:</span>
            <p className="text-muted-foreground">
              To proceed from Offer to Fee Received, a verified transaction receipt is required. This creates a persistent ledger record in Finance.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Amount Received (₹) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="input h-9 text-xs w-full rounded-xl font-mono"
                placeholder="e.g. 15000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input h-9 text-xs w-full rounded-xl"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque / DD</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="input h-9 text-xs w-full rounded-xl font-mono"
                  placeholder="e.g. UPI-984210"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFeeModalOpen(false)}
              className="btn btn-outline btn-sm h-8 px-4 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !paymentAmount}
              className="btn btn-primary btn-sm h-8 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Recording...' : 'Confirm & Issue Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. CELEBRATORY ENROLLMENT CONFIRMATION MODAL                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`${studentName} is ready to enroll! 🎉`}
        subtitle="Choose the classroom and confirm enrollment to create the student's profile."
        icon={<GraduationCap size={22} className="text-emerald-500" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            executePromotion({
              classroomId: selectedClassroomId,
              seatNumber: seatNumber.trim() || undefined,
            })
          }}
          className="space-y-4 text-xs"
        >
          {/* Candidate Dossier Snapshot */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 grid grid-cols-2 gap-3">
            <div>
              <span className="text-muted-foreground text-[11px]">Pupil Name:</span>
              <p className="font-bold text-foreground text-sm mt-0.5">{studentName}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px]">Campus Branch:</span>
              <p className="font-semibold text-foreground mt-0.5">
                {status?.candidateDetails.branchName || 'Main Campus'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px]">Program Level:</span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 font-bold text-[10.5px] mt-0.5">
                {status?.candidateDetails.programType || 'Nursery'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[11px]">Fee Verification:</span>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                <CheckCircle2 size={13} />
                <span>Verified (₹{((status?.paymentStatus?.paidAmountCents || 0) / 100).toFixed(2)})</span>
              </div>
            </div>
          </div>

          {/* Classroom Selection with Live Seat Availability & Urgency Badges */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Select Classroom Section <span className="text-destructive">*</span>
            </label>
            {loadingClassrooms ? (
              <div className="flex items-center gap-2 p-3 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading live classroom seat availability...</span>
              </div>
            ) : classrooms.length === 0 ? (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                No active classroom found for this program. Please configure a classroom in Setup first.
              </div>
            ) : (
              <ClassroomSeatSelector
                classrooms={classrooms}
                value={selectedClassroomId}
                onChange={setSelectedClassroomId}
                required
                placeholder="Choose section with open seats..."
              />
            )}
          </div>

          {/* Optional Seat Number */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Seat / Roll Number <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="e.g. S-01 (or leave blank for auto-assignment)"
              className="input h-9 text-xs w-full rounded-xl font-mono"
            />
          </div>

          {/* Welcome Kit preview indicator */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Welcome Kit & Parent Portal</span>
                <p className="text-muted-foreground text-[10.5px]">
                  Generates student admission number, portal login, and welcome letter.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Ready
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => {
                setEnrollModalOpen(false)
                onOpenDetails?.()
              }}
              className="btn btn-ghost btn-sm h-8.5 px-3 rounded-xl text-muted-foreground"
            >
              Review Details
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="btn btn-outline btn-sm h-8.5 px-3.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedClassroomId}
                className="btn btn-primary btn-sm h-8.5 px-4 rounded-xl font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Confirm Enrollment & Generate Welcome Kit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. SUCCESS CELEBRATION MODAL                                               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Enrollment Complete! 🎓"
        subtitle={`Official Student Profile created for ${studentName}`}
        icon={<CheckCircle2 size={24} className="text-emerald-500" />}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              🎓
            </div>
            <h3 className="text-base font-bold text-foreground">
              {studentName} is Officially Enrolled!
            </h3>
            <p className="text-muted-foreground">
              Assigned Admission No:{' '}
              <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                {executionResult?.admissionNo || 'STU-2026-0001'}
              </span>
            </p>
            <div className="text-[11px] text-muted-foreground font-medium">
              Section: <span className="font-bold text-foreground">{executionResult?.classroomName}</span>
            </div>
          </div>

          {executionResult?.welcomeKit && (
            <div className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">{executionResult.welcomeKit.title}</span>
                <p className="text-muted-foreground text-[10.5px]">{executionResult.welcomeKit.message}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {executionResult.welcomeKit.status}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setSuccessModalOpen(false)}
              className="btn btn-outline btn-sm h-8 px-4 rounded-xl"
            >
              Done
            </button>
            <a
              href={`/app/students/${executionResult?.studentId || ''}`}
              className="btn btn-primary btn-sm h-8 px-4 rounded-xl font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <span>Open Student Profile</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </Modal>
    </>
  )
}
