'use client'

import React from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Eye,
  AlertCircle,
  Truck,
  Building,
  Check,
  Send,
} from 'lucide-react'
import { SupplyRequestApprovalItem } from './SupplyApprovalInbox'

interface MySupplyRequestsListProps {
  requests: SupplyRequestApprovalItem[]
  onViewDetails: (request: SupplyRequestApprovalItem) => void
  onOpenStore: () => void
  loading?: boolean
}

export function MySupplyRequestsList({
  requests,
  onViewDetails,
  onOpenStore,
  loading = false,
}: MySupplyRequestsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-700"
          />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-2xl">
          📦
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          No Classroom Supply Requests Yet
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          You haven't submitted any classroom material requests. Open the Supply Store to request crayons, craft papers, paints, and supplies.
        </p>
        <button
          type="button"
          onClick={onOpenStore}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
        >
          <span>Browse Supply Store</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const totalItemsCount = req.items.length
        const totalUnits = req.items.reduce((acc, i) => acc + Number(i.requestedQuantity), 0)
        const totalIssued = req.items.reduce((acc, i) => acc + Number(i.issuedQuantity), 0)

        // Status badge configuration
        const getStatusBadge = () => {
          switch (req.status) {
            case 'PENDING':
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  Pending Approval
                </span>
              )
            case 'APPROVED':
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/40 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                  <Check className="h-3.5 w-3.5" />
                  Approved — Awaiting Stock Issue
                </span>
              )
            case 'PARTIALLY_ISSUED':
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  <Truck className="h-3.5 w-3.5" />
                  Partially Issued ({totalIssued}/{totalUnits} units)
                </span>
              )
            case 'FULFILLED':
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Fully Issued / Delivered
                </span>
              )
            case 'REJECTED':
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/40 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Rejected
                </span>
              )
            default:
              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700">
                  {req.status}
                </span>
              )
          }
        }

        return (
          <div
            key={req.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4.5 shadow-sm hover:shadow-md transition-shadow space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                  📋
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                      {req.requestNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                      {req.classroom?.name || 'Classroom'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Submitted on {new Date(req.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {getStatusBadge()}
            </div>

            {/* Rejection callout if rejected */}
            {req.status === 'REJECTED' && req.rejectionReason && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-2.5 text-xs text-red-800 dark:text-red-300">
                <span className="font-bold">Rejection Reason: </span>
                <span>{req.rejectionReason}</span>
                {req.rejectedByName && (
                  <span className="text-[10px] text-red-600 dark:text-red-400 block pt-0.5">
                    — Reviewed by {req.rejectedByName}
                  </span>
                )}
              </div>
            )}

            {/* Approval info if approved */}
            {req.status === 'APPROVED' && req.approvedByName && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-2.5 text-xs text-blue-800 dark:text-blue-300">
                <span>Approved by <strong>{req.approvedByName}</strong> on {req.approvedAt ? new Date(req.approvedAt).toLocaleDateString('en-IN') : 'recently'}. Awaiting warehouse fulfillment.</span>
              </div>
            )}

            {/* Items summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</span>
                <span>•</span>
                <span>{totalUnits} requested units</span>
                {totalIssued > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">{totalIssued} issued</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onViewDetails(req)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
