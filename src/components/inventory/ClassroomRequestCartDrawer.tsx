'use client'

import React, { useState } from 'react'
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  AlertTriangle,
  Send,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { CartItem } from './TeacherSupplyStore'

interface ClassroomOption {
  id: string
  name: string
  code: string
  programType?: string
}

interface ClassroomRequestCartDrawerProps {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (itemId: string, newQty: number) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
  classrooms: ClassroomOption[]
  selectedClassroomId: string
  onSelectClassroom: (classroomId: string) => void
  onSubmitSuccess: (requestNumber: string) => void
  teacherName: string
  branchName?: string | null
}

export function ClassroomRequestCartDrawer({
  open,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  classrooms,
  selectedClassroomId,
  onSelectClassroom,
  onSubmitSuccess,
  teacherName,
  branchName,
}: ClassroomRequestCartDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [purpose, setPurpose] = useState('')
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'HIGH' | 'LOW'>('NORMAL')
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().slice(0, 10)
  })

  // Success celebration state
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<string | null>(null)

  if (!open) return null

  const totalItemCount = cart.length
  const totalUnits = cart.reduce((acc, i) => acc + i.quantity, 0)

  // Check for out of stock or excessive quantity items
  const invalidItems = cart.filter(
    (i) => i.quantity <= 0 || i.quantity > i.availableStock || i.availableStock <= 0
  )
  const hasInvalidItems = invalidItems.length > 0

  const handleSubmitForApproval = async () => {
    if (cart.length === 0) return
    if (!selectedClassroomId) {
      setErrorMsg('Please select your classroom for this supply request.')
      return
    }
    if (hasInvalidItems) {
      setErrorMsg('Some items have quantities that exceed available stock or are out of stock. Please adjust.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/v1/inventory/supply-store/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          requiredDate,
          priority,
          purpose: purpose.trim() || undefined,
          items: cart.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            notes: i.notes,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || 'Failed to submit supply request.')
      }

      const reqNumber = data.data?.requestNumber || data.requestNumber || 'REQ'
      setSubmittedRequestNumber(reqNumber)
      onClearCart()
      onSubmitSuccess(reqNumber)
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="relative w-screen max-w-lg bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
          {/* ── DRAWER HEADER ── */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4.5 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Classroom Supply Cart
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} • {totalUnits} total units
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── CELEBRATION MODAL ON SUCCESS ── */}
          {submittedRequestNumber ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Request Submitted for Approval!
                </h3>
                <p className="text-xs text-gray-500">
                  Request Number: <strong className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">{submittedRequestNumber}</strong>
                </p>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm">
                Your principal has received an in-app notification to review and approve your classroom supplies. You can track fulfilment status under the <strong>Requests</strong> tab.
              </p>

              <div className="pt-4 flex flex-col w-full gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRequestNumber(null)
                    onClose()
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-colors"
                >
                  Done & Continue Browsing
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* ── EMPTY CART STATE ── */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-3xl">
                🛒
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Your supply cart is empty
                </h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  Browse through the store and add crayons, chart papers, paints, and classroom materials for your students.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
              >
                <span>Browse Supply Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* ── CART CONTENT ── */
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Classroom & Request Meta */}
                <div className="space-y-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Requesting Teacher:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {teacherName}
                    </span>
                  </div>

                  {/* Classroom Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Classroom Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedClassroomId}
                      onChange={(e) => onSelectClassroom(e.target.value)}
                      className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {classrooms.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Needed Date & Priority */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>Needed By</span>
                      </label>
                      <input
                        type="date"
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="LOW">Low (Regular)</option>
                        <option value="NORMAL">Normal (Standard)</option>
                        <option value="HIGH">High (Urgent)</option>
                        <option value="URGENT">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Purpose / Remarks */}
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Purpose / Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Sensory art activities, weekly coloring sheets & hygiene replenishments..."
                      className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>

                {/* Items in Cart */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span>Requested Items ({cart.length})</span>
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-red-500 hover:text-red-700 underline font-normal"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cart.map((item) => {
                      const isExcessive = item.quantity > item.availableStock
                      const isOutOfStock = item.availableStock <= 0

                      return (
                        <div
                          key={item.itemId}
                          className="py-3 flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-2xl filter drop-shadow-sm select-none shrink-0">
                              {item.iconEmoji}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <span>Unit: {item.unit}</span>
                                <span>•</span>
                                <span
                                  className={
                                    isOutOfStock
                                      ? 'text-red-600 font-bold'
                                      : isExcessive
                                      ? 'text-amber-600 font-bold'
                                      : 'text-gray-500'
                                  }
                                >
                                  {item.availableStock} in stock
                                </span>
                              </div>
                              {isExcessive && (
                                <p className="text-[10px] text-red-600 font-semibold pt-0.5">
                                  ⚠️ Exceeds available stock ({item.availableStock})
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stepper & Trash */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.itemId, Math.max(1, item.quantity - 1))}
                                className="flex h-6 w-6 items-center justify-center rounded hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(
                                    item.itemId,
                                    Math.min(item.availableStock, item.quantity + 1)
                                  )
                                }
                                disabled={item.quantity >= item.availableStock}
                                className="flex h-6 w-6 items-center justify-center rounded hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.itemId)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Stock safety notice */}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3.5 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Important Workflow Notice</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    Submitting this cart sends an official supply request for principal approval. School inventory stock will be deducted only upon physical issue by inventory staff.
                  </p>
                </div>

                {errorMsg && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* ── DRAWER FOOTER: SUBMIT ACTION ── */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>Distinct Items:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{totalItemCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white">
                  <span>Total Units Requested:</span>
                  <span className="text-base text-emerald-600">{totalUnits} units</span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={submitting || hasInvalidItems || cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit for Approval</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
