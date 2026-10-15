'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Lock,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { toast } from '@/components/ui/toast'
import type { DpdpPreviewResult } from '@/lib/security/dpdp-service'

interface DpdpAnonymizeModalProps {
  user: {
    id: string
    userId?: string
    name: string
    email?: string | null
    phone?: string | null
    role: string
    status: string
  }
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function DpdpAnonymizeModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: DpdpAnonymizeModalProps) {
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [preview, setPreview] = useState<DpdpPreviewResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const effectiveId = user.id || user.userId

  useEffect(() => {
    if (!isOpen || !effectiveId) return

    setReason('')
    setConfirmed(false)
    setPreview(null)
    setPreviewError(null)
    setLoadingPreview(true)

    fetch(`/api/v1/users/${effectiveId}/anonymize`)
      .then(async (res) => {
        const json = await res.json()
        if (res.ok && json.success) {
          setPreview(json.data)
        } else {
          setPreviewError(json.error?.message || json.error || 'Failed to load DPDP preview')
        }
      })
      .catch((err) => {
        setPreviewError(err.message || 'Network error fetching DPDP preview')
      })
      .finally(() => {
        setLoadingPreview(false)
      })
  }, [isOpen, effectiveId])

  if (!isOpen) return null

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmed || !reason.trim()) return

    setExecuting(true)
    try {
      const res = await fetch(`/api/v1/users/${effectiveId}/anonymize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          confirmErasure: true,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(
          'DPDP Erasure Completed',
          `User data de-identified (${json.data.scrubbedCount} fields scrubbed, ${json.data.sessionsRevokedCount} sessions terminated).`
        )
        onSuccess?.()
        onClose()
      } else {
        toast.error('Erasure Failed', json.error?.message || json.error || 'Failed to execute DPDP erasure')
      }
    } catch (err: any) {
      toast.error('Execution Error', err.message)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                DPDP Act 2023: Data Erasure &amp; Anonymization
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Statutory Right to Erasure &amp; De-Identification for {user.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={executing}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-600 dark:text-gray-300">
          {/* Legal Warning Notice */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Irreversible Legal Action</p>
              <p className="text-[11px] leading-relaxed">
                Under the Digital Personal Data Protection Act (DPDP) 2023, direct personal identifiers
                will be permanently de-identified and direct contact credentials wiped. Active sessions will be terminated immediately.
              </p>
            </div>
          </div>

          {loadingPreview ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span>Analyzing data principal profile &amp; compliance records...</span>
            </div>
          ) : previewError ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300">
              <p className="font-medium">Error loading preview:</p>
              <p className="text-[11px] mt-1">{previewError}</p>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {/* Dual Column Analysis: Direct Identifiers vs Statutory Preserved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Column 1: Erased */}
                <div className="p-3.5 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Direct PII To Be Scrubbed ({preview.fieldsToScrub.length})</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400 font-mono">
                    {preview.fieldsToScrub.map((field) => (
                      <li key={field} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="truncate">{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Preserved for Audit */}
                <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Statutory Records Preserved (7-Yr Audit)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                    Accounting, tax, and fee receipts retain anonymous relational references:
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-emerald-100 dark:border-emerald-900/30">
                      <span>Invoices &amp; Receipts:</span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {preview.preservedRecords.invoicesCount}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-emerald-100 dark:border-emerald-900/30">
                      <span>Payments &amp; Transactions:</span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {preview.preservedRecords.paymentsCount}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-emerald-100 dark:border-emerald-900/30">
                      <span>Salary Payslips:</span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {preview.preservedRecords.payslipsCount}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Attendance Logs:</span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {preview.preservedRecords.attendanceCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input: Reason & Confirmation */}
              <form id="dpdp-form" onSubmit={handleExecute} className="space-y-3 pt-2">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1 text-xs">
                    Statutory Reason / Consent Revocation Justification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    placeholder="e.g. Employee resignation and explicit consent withdrawal under DPDP Sec 6(6)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={executing}
                    className="input input-sm w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Recorded permanently in immutable compliance audit logs for regulatory inspections.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="dpdp-confirm-checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    disabled={executing}
                    className="checkbox checkbox-xs checkbox-error mt-0.5"
                  />
                  <label
                    htmlFor="dpdp-confirm-checkbox"
                    className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                  >
                    I confirm that I am an authorized compliance administrator and hereby authorize the irreversible de-identification of this user under the DPDP Act 2023.
                  </label>
                </div>
              </form>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={executing}
              className="btn btn-ghost btn-sm text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="dpdp-form"
              disabled={executing || !confirmed || !reason.trim() || reason.trim().length < 5 || loadingPreview}
              className="btn btn-sm btn-error text-xs flex items-center gap-1.5 text-white"
            >
              {executing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scrubbing Personal Data...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Execute Irreversible Erasure</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
