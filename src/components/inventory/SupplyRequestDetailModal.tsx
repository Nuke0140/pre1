'use client'

import React from 'react'
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Building,
  User,
  Calendar,
  Layers,
  AlertTriangle,
  Check,
} from 'lucide-react'
import { SupplyRequestApprovalItem } from './SupplyApprovalInbox'

interface SupplyRequestDetailModalProps {
  open: boolean
  onClose: () => void
  request: SupplyRequestApprovalItem | null
  canApprove?: boolean
  canFulfill?: boolean
  onApprove?: (requestId: string) => void
  onReject?: (request: SupplyRequestApprovalItem) => void
  onFulfill?: (request: SupplyRequestApprovalItem) => void
}

export function SupplyRequestDetailModal({
  open,
  onClose,
  request,
  canApprove = false,
  canFulfill = false,
  onApprove,
  onReject,
  onFulfill,
}: SupplyRequestDetailModalProps) {
  if (!open || !request) return null

  const classroomName = request.classroom?.name || 'Classroom'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/70 dark:bg-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Request {request.requestNumber}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold">
                  {request.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Submitted for {classroomName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Classroom</span>
              <span className="font-bold text-gray-900 dark:text-white">{classroomName}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Requester</span>
              <span className="font-bold text-gray-900 dark:text-white">{request.requestedByName}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Needed Date</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {new Date(request.requiredDate).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Priority</span>
              <span className="font-bold text-gray-900 dark:text-white">{request.priority}</span>
            </div>
          </div>

          {/* Purpose / Remarks */}
          {request.reason && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Teacher Remarks / Purpose</span>
              <p className="text-gray-800 dark:text-gray-200 font-medium">{request.reason}</p>
            </div>
          )}

          {/* Decision Notes */}
          {request.status === 'REJECTED' && request.rejectionReason && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Rejection Reason</span>
              <p className="font-semibold">{request.rejectionReason}</p>
              {request.rejectedByName && (
                <span className="text-[10px] text-red-500 block pt-0.5">Reviewed by {request.rejectedByName} on {request.rejectedAt ? new Date(request.rejectedAt).toLocaleDateString('en-IN') : 'recently'}</span>
              )}
            </div>
          )}

          {request.status === 'APPROVED' && request.approvedByName && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              <span className="font-bold">Approved by {request.approvedByName}</span> on {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('en-IN') : 'recently'}. Ready for warehouse stock disbursement.
            </div>
          )}

          {/* Requested Items Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-800 dark:text-gray-200">
              Requested Materials ({request.items.length})
            </h4>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5">Item Name</th>
                    <th className="p-2.5 text-center">Requested</th>
                    <th className="p-2.5 text-center">Approved</th>
                    <th className="p-2.5 text-center">Issued</th>
                    <th className="p-2.5 text-right">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {request.items.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="p-2.5 font-bold text-gray-900 dark:text-white">
                        <div>{line.item?.name}</div>
                        <div className="font-mono text-[10px] text-gray-400 font-normal">{line.item?.sku}</div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-gray-700 dark:text-gray-300">
                        {Number(line.requestedQuantity)}
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">
                        {line.approvedQuantity !== null && line.approvedQuantity !== undefined
                          ? Number(line.approvedQuantity)
                          : '—'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">
                        {Number(line.issuedQuantity)}
                      </td>
                      <td className="p-2.5 text-right text-gray-500 font-medium">
                        {line.item?.unit?.symbol || line.item?.unit?.name || 'Pack'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200/60 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {request.status === 'PENDING' && canApprove && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onReject?.(request)
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg dark:bg-red-950/30 dark:hover:bg-red-950/50 transition-colors"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onApprove?.(request.id)
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve Request</span>
                </button>
              </>
            )}

            {(request.status === 'APPROVED' || request.status === 'PARTIALLY_ISSUED') && canFulfill && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onFulfill?.(request)
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Truck className="h-4 w-4" />
                <span>Issue Supplies Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
