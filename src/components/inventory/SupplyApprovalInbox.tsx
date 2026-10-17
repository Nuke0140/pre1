'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Sparkles,
  AlertTriangle,
  Send,
  Boxes,
  Truck,
  FileText,
  User,
  Calendar,
  Building,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'

export interface SupplyRequestApprovalItem {
  id: string
  requestNumber: string
  requestedByName: string
  requestedByRole?: string | null
  classroomId?: string | null
  classroom?: { id: string; name: string; code: string } | null
  branch?: { id: string; name: string } | null
  requiredDate: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_ISSUED' | 'FULFILLED' | 'CANCELLED'
  reason?: string | null
  notes?: string | null
  createdAt: string
  approvedByName?: string | null
  approvedAt?: string | null
  rejectedByName?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  items: Array<{
    id: string
    itemId: string
    requestedQuantity: number
    approvedQuantity?: number | null
    issuedQuantity: number
    notes?: string | null
    item: {
      id: string
      name: string
      sku: string
      imageUrl?: string | null
      unit?: { name: string; symbol: string } | null
      category?: { name: string } | null
    }
    currentAvailableStock?: number
  }>
}

interface SupplyApprovalInboxProps {
  requests: SupplyRequestApprovalItem[]
  onApprove: (requestId: string, notes?: string) => Promise<void>
  onReject: (requestId: string, reason: string) => Promise<void>
  onOpenFulfillModal: (request: SupplyRequestApprovalItem) => void
  onViewDetails: (request: SupplyRequestApprovalItem) => void
  loading?: boolean
  canApprove?: boolean
  canFulfill?: boolean
}

export function SupplyApprovalInbox({
  requests,
  onApprove,
  onReject,
  onOpenFulfillModal,
  onViewDetails,
  loading = false,
  canApprove = true,
  canFulfill = true,
}: SupplyApprovalInboxProps) {
  const [rejectModalReq, setRejectModalReq] = useState<SupplyRequestApprovalItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const pendingRequests = requests.filter((r) => r.status === 'PENDING')

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return
    if (!rejectReason.trim()) {
      setActionError('Rejection reason is mandatory.')
      return
    }

    setProcessingId(rejectModalReq.id)
    setActionError(null)

    try {
      await onReject(rejectModalReq.id, rejectReason.trim())
      setRejectModalReq(null)
      setRejectReason('')
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject request.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleQuickApprove = async (req: SupplyRequestApprovalItem) => {
    setProcessingId(req.id)
    setActionError(null)
    try {
      await onApprove(req.id)
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve request.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-700"
            />
          ))}
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 text-xl">
            ✨
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            All Caught Up! Zero Pending Approvals
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            All classroom material requests have been reviewed. When teachers submit supply carts, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const isBusy = processingId === req.id
            const classroomName = req.classroom?.name || 'Classroom'
            const totalUnits = req.items.reduce((acc, i) => acc + Number(i.requestedQuantity), 0)

            return (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs shrink-0">
                      🏫
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{classroomName} requested classroom supplies</span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {req.requestNumber}
                        </span>
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>By {req.requestedByName}</span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.priority === 'URGENT'
                          ? 'bg-red-100 text-red-700'
                          : req.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {req.priority} Priority
                    </span>
                  </div>
                </div>

                {/* Purpose / Remarks if present */}
                {req.reason && (
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-500">Purpose: </span>
                    {req.reason}
                  </div>
                )}

                {/* Items Summary Table */}
                <div className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-center">Requested Qty</th>
                        <th className="py-2 px-3 text-right">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {req.items.map((line) => (
                        <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">
                            {line.item?.name}
                          </td>
                          <td className="py-2 px-3 text-gray-500">
                            {line.item?.category?.name || '—'}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            {Number(line.requestedQuantity)}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-500">
                            {line.item?.unit?.symbol || line.item?.unit?.name || 'Pack'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-gray-500 font-medium">
                    Total: {req.items.length} items ({totalUnits} units)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewDetails(req)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Details</span>
                    </button>

                    {canApprove && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectModalReq(req)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickApprove(req)}
                          disabled={isBusy}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isBusy ? (
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Approve</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── REJECTION MODAL (MANDATORY REASON) ── */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Reject Supply Request
                </h3>
                <p className="text-xs text-gray-500">
                  {rejectModalReq.requestNumber} • {rejectModalReq.classroom?.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              Provide a clear reason for the teacher explaining why these materials cannot be approved at this time:
            </p>

            <div className="space-y-1">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Current stock reserved for upcoming sports day event, please re-request next Monday..."
                className="w-full text-xs p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalReq(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || processingId === rejectModalReq.id}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {processingId === rejectModalReq.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
