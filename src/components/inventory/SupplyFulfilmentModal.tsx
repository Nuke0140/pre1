'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Truck,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Building,
  ShieldCheck,
} from 'lucide-react'
import { SupplyRequestApprovalItem } from './SupplyApprovalInbox'

interface LocationOption {
  id: string
  name: string
  code: string
  locationType: string
}

interface SupplyFulfilmentModalProps {
  open: boolean
  onClose: () => void
  request: SupplyRequestApprovalItem | null
  locations: LocationOption[]
  onFulfillSuccess: (result: any) => void
}

export function SupplyFulfilmentModal({
  open,
  onClose,
  request,
  locations,
  onFulfillSuccess,
}: SupplyFulfilmentModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [quantitiesToIssue, setQuantitiesToIssue] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  useEffect(() => {
    if (request) {
      const initial: Record<string, number> = {}
      for (const itm of request.items) {
        const approved = itm.approvedQuantity ?? itm.requestedQuantity
        const remaining = Math.max(0, Number(approved) - Number(itm.issuedQuantity))
        initial[itm.itemId] = remaining
      }
      setQuantitiesToIssue(initial)
      setErrorMsg(null)
    }
  }, [request])

  if (!open || !request) return null

  const handleFulfillSubmit = async () => {
    if (!selectedLocationId) {
      setErrorMsg('Please select a warehouse store location to issue supplies from.')
      return
    }

    const itemsPayload = Object.entries(quantitiesToIssue)
      .map(([itemId, qty]) => ({ itemId, quantity: Number(qty) }))
      .filter((i) => i.quantity > 0)

    if (itemsPayload.length === 0) {
      setErrorMsg('Please specify at least one item quantity to issue.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/v1/inventory/material-requests/${request.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          items: itemsPayload,
          recipientNotes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error?.message || 'Failed to issue supplies.')
      }

      onFulfillSuccess(data.data || data)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Stock issue failed. Check inventory balances.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-emerald-50/50 dark:bg-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Fulfill Classroom Supplies
              </h3>
              <p className="text-xs text-gray-500">
                Issue materials for {request.classroom?.name || 'Classroom'} ({request.requestNumber})
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Warehouse Store Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-gray-400" />
              <span>Issue from Store Location <span className="text-red-500">*</span></span>
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.locationType})
                </option>
              ))}
            </select>
          </div>

          {/* Items to issue table */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Quantities to Disburse
            </label>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">Approved</th>
                    <th className="p-2.5 text-center">Already Issued</th>
                    <th className="p-2.5 text-right">Issue Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {request.items.map((line) => {
                    const approved = Number(line.approvedQuantity ?? line.requestedQuantity)
                    const remaining = Math.max(0, approved - Number(line.issuedQuantity))
                    const currentVal = quantitiesToIssue[line.itemId] ?? remaining

                    return (
                      <tr key={line.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                          <div>{line.item?.name}</div>
                          <div className="text-[10px] text-gray-400">Unit: {line.item?.unit?.symbol || 'Pack'}</div>
                        </td>
                        <td className="p-2.5 text-center font-bold text-gray-700 dark:text-gray-300">
                          {approved}
                        </td>
                        <td className="p-2.5 text-center text-gray-500">
                          {Number(line.issuedQuantity)}
                        </td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={currentVal}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(remaining, parseInt(e.target.value, 10) || 0))
                              setQuantitiesToIssue((prev) => ({ ...prev, [line.itemId]: val }))
                            }}
                            className="w-16 py-1 px-2 text-right text-xs font-bold rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recipient notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Handover Notes / Verification Remark
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over to Teacher Priya for Nursery-A classroom cabinet..."
              className="w-full text-xs py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Stock Safety Note */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Confirming this issue will immediately decrement stock balances in the selected store warehouse and create an immutable Stock Issue record.
            </span>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200/60 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFulfillSubmit}
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Issue...</span>
              </>
            ) : (
              <>
                <Truck className="h-3.5 w-3.5" />
                <span>Confirm Stock Issue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
