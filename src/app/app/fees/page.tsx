'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  IndianRupee,
  Receipt,
  Layers,
  Printer,
  FileText,
  Search,
  Filter,
  Users,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  X,
  Send,
  HelpCircle,
  DollarSign,
  UserCheck,
  Download,
} from 'lucide-react'
import { PageHead, StatusBadge, EmptyState, KpiTile, Skeleton } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { inr, fmtDate, enumLabel } from '@/lib/format'

interface FeeStructureItem {
  id?: string
  name: string
  feeType: 'REGULAR' | 'REFUNDABLE_DEPOSIT'
  amountCents: number
  currency?: string
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | 'ANNUALLY'
  dueRule?: string | null
  dueDate?: string | null
  lateFeeApplicable?: boolean
  lateFeeAmountCents?: number
  isRefundable?: boolean
  sortOrder?: number
}

interface FeeStructure {
  id: string
  name: string
  description?: string | null
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  effectiveFrom?: string | null
  effectiveTo?: string | null
  academicSession?: { id: string; name: string } | null
  classroom?: { id: string; name: string } | null
  program?: { id: string; name: string } | null
  programType?: string | null
  items: FeeStructureItem[]
  _count?: { schedules: number }
  createdAt: string
}

interface StudentFeeSchedule {
  id: string
  studentId: string
  studentName?: string
  admissionNo?: string
  itemName: string
  feeType: 'REGULAR' | 'REFUNDABLE_DEPOSIT'
  period: string
  dueDate: string
  amountDueRupees: string
  amountPaidRupees: string
  remainingRupees: string
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  isRefundable: boolean
}

interface StudentDeposit {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  name: string
  totalRupees: string
  refundedRupees: string
  adjustedRupees: string
  remainingRupees: string
  status: 'HELD' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'ADJUSTED'
  notes?: string | null
  createdAt: string
}

interface PaymentRecord {
  id: string
  paymentNumber: string
  amountRupees: string
  method: string
  status: string
  transactionRef?: string | null
  notes?: string | null
  paymentDate: string
  studentName: string
  admissionNo: string
  receiptId?: string | null
  receiptNumber?: string | null
}

interface ChildFeeProfile {
  childId: string
  childName: string
  admissionNo: string
  classroom: string
  summary: {
    totalDueRupees: number
    totalPaidRupees: number
    totalRemainingRupees: number
    totalOverdueRupees: number
    totalPendingRupees: number
  }
  schedules: StudentFeeSchedule[]
  deposits: StudentDeposit[]
  payments: PaymentRecord[]
}

export default function FeesPage() {
  const toast = useToast()

  // User Role State
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Navigation Tabs for Admin
  const [activeTab, setActiveTab] = useState<'STRUCTURES' | 'SCHEDULES' | 'DEPOSITS' | 'PAYMENTS'>('STRUCTURES')

  // Master Options
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [academicSessions, setAcademicSessions] = useState<{ id: string; name: string }[]>([])
  const [students, setStudents] = useState<{ id: string; name: string; admissionNo: string }[]>([])

  // Data States
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [schedules, setSchedules] = useState<StudentFeeSchedule[]>([])
  const [deposits, setDeposits] = useState<StudentDeposit[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [parentChildren, setParentChildren] = useState<ChildFeeProfile[]>([])
  const [selectedChildIndex, setSelectedChildIndex] = useState(0)

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modals
  const [showStructureModal, setShowStructureModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<StudentFeeSchedule | null>(null)
  const [selectedDeposit, setSelectedDeposit] = useState<StudentDeposit | null>(null)
  const [receiptModal, setReceiptModal] = useState<any | null>(null)

  // Form States
  const [structForm, setStructForm] = useState({
    name: '',
    description: '',
    academicSessionId: '',
    classroomId: '',
    status: 'ACTIVE' as 'DRAFT' | 'ACTIVE',
    effectiveFrom: '',
    effectiveTo: '',
    items: [
      { name: 'Admission Fee', feeType: 'REGULAR' as const, amountRupees: 5000, frequency: 'ONE_TIME' as const, isRefundable: false },
      { name: 'Tuition Fee', feeType: 'REGULAR' as const, amountRupees: 3000, frequency: 'MONTHLY' as const, isRefundable: false },
      { name: 'Activity Fee', feeType: 'REGULAR' as const, amountRupees: 2000, frequency: 'ANNUALLY' as const, isRefundable: false },
      { name: 'Security Deposit', feeType: 'REFUNDABLE_DEPOSIT' as const, amountRupees: 5000, frequency: 'ONE_TIME' as const, isRefundable: true },
    ],
  })

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    feeScheduleId: '',
    amountRupees: '',
    method: 'CASH' as const,
    transactionRef: '',
    notes: '',
  })

  const [studentSchedules, setStudentSchedules] = useState<any[]>([])
  const [loadingStudentSchedules, setLoadingStudentSchedules] = useState(false)

  // Fetch Fee Schedules for Selected Student in Payment Modal
  useEffect(() => {
    if (!paymentForm.studentId) {
      setStudentSchedules([])
      return
    }
    async function fetchStudentSchedules() {
      setLoadingStudentSchedules(true)
      try {
        const res = await fetch(`/api/v1/students/${paymentForm.studentId}/fees/schedule`)
        if (res.ok) {
          const d = await res.json()
          setStudentSchedules(d.data || d || [])
        }
      } catch (e) {
        setStudentSchedules([])
      } finally {
        setLoadingStudentSchedules(false)
      }
    }
    fetchStudentSchedules()
  }, [paymentForm.studentId])

  const [refundForm, setRefundForm] = useState({
    depositId: '',
    studentId: '',
    amountRupees: '',
    refundMode: 'BANK_TRANSFER',
    reference: '',
    reason: '',
  })

  const [adjustForm, setAdjustForm] = useState({
    depositId: '',
    studentId: '',
    adjustmentAmountRupees: '',
    reason: '',
  })

  // Fetch Current User Role
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/v1/me')
        if (res.ok) {
          const data = await res.json()
          const role = data.data?.role || data.role || 'STAFF'
          setUserRole(role)
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  // Fetch Options (Classrooms, Academic Sessions, Students)
  useEffect(() => {
    async function loadOptions() {
      try {
        const [clsRes, sessRes, stdRes] = await Promise.all([
          fetch('/api/v1/classrooms').catch(() => null),
          fetch('/api/v1/academic-years').catch(() => fetch('/api/v1/academics/sessions')).catch(() => null),
          fetch('/api/v1/students').catch(() => null),
        ])
        if (clsRes && clsRes.ok) {
          const d = await clsRes.json()
          setClassrooms(d.data || d || [])
        }
        if (sessRes && sessRes.ok) {
          const d = await sessRes.json()
          setAcademicSessions(d.data || d || [])
        }
        if (stdRes && stdRes.ok) {
          const d = await stdRes.json()
          const list = (d.data || d || []).map((s: any) => ({
            id: s.id,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
            admissionNo: s.admissionNo || s.admissionNumber || s.id,
          }))
          setStudents(list)
        }
      } catch (e) {
        // Fallback
      }
    }
    loadOptions()
  }, [])

  // Load Main Data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (userRole === 'PARENT' || userRole === 'GUARDIAN') {
        const res = await fetch('/api/v1/parent/fees')
        if (res.ok) {
          const d = await res.json()
          setParentChildren(d.data || [])
        }
      } else {
        const [structRes, depRes, payRes] = await Promise.all([
          fetch('/api/v1/fee-structures'),
          fetch('/api/v1/deposits'),
          fetch('/api/v1/payments'),
        ])

        if (structRes.ok) {
          const d = await structRes.json()
          setStructures(d.data || [])
        }
        if (depRes.ok) {
          const d = await depRes.json()
          setDeposits(d.data || [])
        }
        if (payRes.ok) {
          const d = await payRes.json()
          setPayments(d.data || [])
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load fee records')
    } finally {
      setLoading(false)
    }
  }, [userRole, toast])

  useEffect(() => {
    if (!loadingUser) {
      loadData()
    }
  }, [loadingUser, loadData])

  // Create Fee Structure Handler
  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!structForm.name || !structForm.items.length) {
      toast.error('Structure name and fee items are required')
      return
    }

    try {
      const res = await fetch('/api/v1/fee-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: structForm.name,
          description: structForm.description,
          academicSessionId: structForm.academicSessionId || undefined,
          classroomId: structForm.classroomId || undefined,
          status: structForm.status,
          effectiveFrom: structForm.effectiveFrom || undefined,
          effectiveTo: structForm.effectiveTo || undefined,
          items: structForm.items.map((i, idx) => ({
            name: i.name,
            feeType: i.feeType,
            amountCents: Math.round(i.amountRupees * 100),
            frequency: i.frequency,
            isRefundable: i.isRefundable || i.feeType === 'REFUNDABLE_DEPOSIT',
            sortOrder: idx,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create fee structure')

      toast.success(
        structForm.status === 'ACTIVE'
          ? 'Fee structure created and automatically applied to eligible class students!'
          : 'Fee structure created as draft'
      )
      setShowStructureModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Apply Fee Structure to Class
  const handleApplyStructure = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/fee-structures/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to apply fee structure')

      toast.success(data.data?.message || 'Successfully applied fee structure to class students!')
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Record Fee Payment Handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.feeScheduleId || !paymentForm.amountRupees || !paymentForm.method) {
      toast.error('Fee schedule, amount, and payment method are required')
      return
    }

    try {
      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeScheduleId: paymentForm.feeScheduleId,
          studentId: paymentForm.studentId,
          amountRupees: parseFloat(paymentForm.amountRupees),
          method: paymentForm.method,
          transactionRef: paymentForm.transactionRef,
          notes: paymentForm.notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to record payment')

      toast.success('Payment successfully recorded & official receipt generated!')
      setShowPaymentModal(false)
      if (data.data?.receipt) {
        setReceiptModal(data.data.receipt)
      }
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Process Refund Handler
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundForm.depositId || !refundForm.amountRupees || !refundForm.reason) {
      toast.error('Deposit, refund amount, and reason are required')
      return
    }

    try {
      const res = await fetch(`/api/v1/deposits/${refundForm.depositId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: refundForm.studentId,
          amountRupees: parseFloat(refundForm.amountRupees),
          refundMode: refundForm.refundMode,
          reference: refundForm.reference,
          reason: refundForm.reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to process refund')

      toast.success('Refund processed successfully!')
      setShowRefundModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Process Deposit Adjustment Handler
  const handleAdjustDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustForm.depositId || !adjustForm.adjustmentAmountRupees || !adjustForm.reason) {
      toast.error('Deposit, adjustment amount, and reason are required')
      return
    }

    try {
      const res = await fetch(`/api/v1/deposits/${adjustForm.depositId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: adjustForm.studentId,
          adjustmentAmountRupees: parseFloat(adjustForm.adjustmentAmountRupees),
          reason: adjustForm.reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Failed to adjust deposit')

      toast.success('Deposit adjustment recorded!')
      setShowAdjustModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Add Item in Structure Form
  const addStructItem = () => {
    setStructForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: '', feeType: 'REGULAR', amountRupees: 1000, frequency: 'ONE_TIME', isRefundable: false },
      ],
    }))
  }

  const removeStructItem = (idx: number) => {
    setStructForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  // Export Payment Transactions to CSV
  const handleExportPaymentsCSV = () => {
    if (!payments.length) {
      toast.error('No payment transactions to export.')
      return
    }

    const headers = ['Payment #', 'Receipt #', 'Student Name', 'Admission No', 'Payment Date', 'Method', 'Amount (INR)', 'Status']
    const rows = payments.map((p) => [
      `"${(p.paymentNumber || '').replace(/"/g, '""')}"`,
      `"${(p.receiptNumber || '').replace(/"/g, '""')}"`,
      `"${(p.studentName || '').replace(/"/g, '""')}"`,
      `"${(p.admissionNo || '').replace(/"/g, '""')}"`,
      `"${fmtDate(p.paymentDate)}"`,
      `"${(p.method || '').replace(/"/g, '""')}"`,
      `"${p.amountRupees || 0}"`,
      `"${(p.status || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `payment_transactions_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Payment transactions exported to CSV successfully!')
  }

  // Calculate Metrics Aggregates
  const totalStructuresCount = structures.length
  const activeStructuresCount = structures.filter((s) => s.status === 'ACTIVE').length
  const totalHeldDepositsRupees = deposits
    .filter((d) => d.status === 'HELD' || d.status === 'PARTIALLY_REFUNDED')
    .reduce((acc, d) => acc + parseFloat(d.remainingRupees || '0'), 0)
  const totalCollectedRupees = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + parseFloat(p.amountRupees || '0'), 0)

  if (loadingUser) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // =========================================================================
  // PARENT PORTAL VIEW
  // =========================================================================
  if (userRole === 'PARENT' || userRole === 'GUARDIAN') {
    const activeChild = parentChildren[selectedChildIndex]

    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <PageHead
          title="Child Fee Portal"
          sub="View fee schedules, payment history, receipts, and deposit status"
        />

        {parentChildren.length > 1 && (
          <div className="flex gap-2 border-b pb-2">
            {parentChildren.map((c, idx) => (
              <button
                key={c.childId}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  selectedChildIndex === idx
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.childName} ({c.classroom})
              </button>
            ))}
          </div>
        )}

        {!activeChild ? (
          <EmptyState
            icon={<Users className="size-8 text-indigo-500" />}
            title="No Linked Children Found"
            message="You currently do not have any active student profiles linked to your parent account."
          />
        ) : (
          <div className="space-y-6">
            {/* KPI Cards for Child */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">Total Due</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{inr(activeChild.summary.totalDueRupees * 100)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">Total Paid</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{inr(activeChild.summary.totalPaidRupees * 100)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">Remaining</div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{inr(activeChild.summary.totalRemainingRupees * 100)}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase">Overdue</div>
                <div className="text-2xl font-bold text-rose-600 mt-1">{inr(activeChild.summary.totalOverdueRupees * 100)}</div>
              </div>
            </div>

            {/* Fee Schedule Installments */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="size-5 text-indigo-600" /> Fee Schedule & Installments
              </h3>

              {!activeChild.schedules.length ? (
                <EmptyState
                  icon={<CreditCard className="size-8 text-emerald-500" />}
                  title="No Active Fee Schedule"
                  message="Fee schedule for this academic session has not been published yet."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-600 font-semibold">
                        <th className="p-3">Fee Item</th>
                        <th className="p-3">Period</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Amount Due</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Remaining</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeChild.schedules.map((sc) => (
                        <tr key={sc.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-900">
                            {sc.itemName}
                            {sc.isRefundable && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-normal">
                                Refundable Deposit
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">{sc.period}</td>
                          <td className="p-3 text-slate-600">{fmtDate(sc.dueDate)}</td>
                          <td className="p-3 font-semibold">{inr(parseFloat(sc.amountDueRupees) * 100)}</td>
                          <td className="p-3 text-emerald-600 font-medium">{inr(parseFloat(sc.amountPaidRupees) * 100)}</td>
                          <td className="p-3 text-indigo-600 font-medium">{inr(parseFloat(sc.remainingRupees) * 100)}</td>
                          <td className="p-3">
                            <StatusBadge status={sc.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Refundable Deposits */}
            {activeChild.deposits.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-amber-600" /> Refundable Security Deposits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChild.deposits.map((d) => (
                    <div key={d.id} className="p-4 border rounded-2xl bg-amber-50/50 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/40 space-y-2 [box-shadow:var(--shadow-premium-card,inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.035))] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.035),0_4px_14px_rgba(0,0,0,0.16)]">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-amber-900 dark:text-amber-200">{d.name}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                        <div>Total Deposit: <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">{inr(parseFloat(d.totalRupees) * 100)}</span></div>
                        <div>Refunded: <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{inr(parseFloat(d.refundedRupees) * 100)}</span></div>
                        <div>Remaining Held Balance: <span className="font-mono font-bold tabular-nums text-amber-800 dark:text-amber-300">{inr(parseFloat(d.remainingRupees) * 100)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white/96 dark:bg-slate-900/96 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 [box-shadow:var(--shadow-premium-card,inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.035),0_4px_12px_rgba(15,23,42,0.035))] dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.035),0_4px_14px_rgba(0,0,0,0.16)]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="size-5 text-emerald-600 dark:text-emerald-400" /> Payment Receipts History
              </h3>

              {!activeChild.payments.length ? (
                <EmptyState
                  icon={<Receipt className="size-8 text-emerald-500" />}
                  title="No Payment History"
                  message="No recorded payments found for this student."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-xs">
                        <th className="p-3">Payment #</th>
                        <th className="p-3">Receipt #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {activeChild.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">{p.paymentNumber}</td>
                          <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">{p.receiptNumber || 'N/A'}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{fmtDate(p.paymentDate)}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{p.method}</td>
                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{inr(parseFloat(p.amountRupees) * 100)}</td>
                          <td className="p-3">
                            <StatusBadge status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // ADMIN & STAFF MANAGEMENT VIEW
  // =========================================================================
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHead
        title="Fees & Finance Management"
        sub="Manage fee structures, class assignments, payments, receipts, and refundable deposits"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowStructureModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="size-4" /> Create Fee Structure
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm flex items-center gap-1.5 shadow-sm"
            >
              <IndianRupee className="size-4" /> Record Payment
            </button>
          </div>
        }
      />

      {/* Admin Top KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile
          label="Active Fee Structures"
          value={activeStructuresCount.toString()}
          meta={`${totalStructuresCount} total configured`}
          icon={<Layers className="size-5 text-indigo-600" />}
          iconClass="ic-purple"
        />
        <KpiTile
          label="Total Collected Fees"
          value={inr(totalCollectedRupees * 100)}
          meta="Verified payment transactions"
          icon={<IndianRupee className="size-5 text-emerald-600" />}
          iconClass="ic-emerald"
        />
        <KpiTile
          label="Refundable Deposits Held"
          value={inr(totalHeldDepositsRupees * 100)}
          meta={`${deposits.length} security deposits active`}
          icon={<ShieldCheck className="size-5 text-amber-600" />}
          iconClass="ic-amber"
        />
        <KpiTile
          label="Recorded Payments"
          value={payments.length.toString()}
          meta="Official receipts issued"
          icon={<Receipt className="size-5 text-purple-600" />}
          iconClass="ic-blue"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        {[
          { key: 'STRUCTURES', label: 'Fee Structures & Activation', icon: Layers },
          { key: 'DEPOSITS', label: 'Refundable Security Deposits', icon: ShieldCheck },
          { key: 'PAYMENTS', label: 'Payment Transactions & Receipts', icon: Receipt },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-150 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: FEE STRUCTURES */}
      {activeTab === 'STRUCTURES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Configured Fee Structures</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Activating a structure automatically applies it to all eligible class students
            </span>
          </div>

          {!structures.length ? (
            <EmptyState
              icon={<Sparkles className="size-8 text-indigo-500" />}
              title="No Fee Structures Configured"
              message="Create a fee structure for Nursery or Playgroup to configure tuition and deposit rules."
              action={
                <button
                  onClick={() => setShowStructureModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all duration-150 active:scale-[0.98]"
                >
                  Create Fee Structure
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {structures.map((st) => (
                <div key={st.id} className="premium-card p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{st.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Academic Session: <span className="font-medium text-slate-700 dark:text-slate-300">{st.academicSession?.name || 'AY 2026-27'}</span>
                      </p>
                    </div>
                    <StatusBadge status={st.status} />
                  </div>

                  {st.description && <p className="text-xs text-slate-600 dark:text-slate-300">{st.description}</p>}

                  {/* Fee Items Table */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 space-y-2 text-xs border border-slate-100 dark:border-slate-800/60">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Configured Fee Items</div>
                    {st.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200/80 dark:border-slate-800/60 last:border-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({enumLabel(item.frequency)})</span>
                          {item.feeType === 'REFUNDABLE_DEPOSIT' && (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              Refundable
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200">{inr(item.amountCents)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Total Annual Amount: <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">{inr(st.items.reduce((s, i) => s + i.amountCents, 0))}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplyStructure(st.id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-150 active:scale-[0.98]"
                      >
                        <Sparkles className="size-3.5" /> Activate & Apply to Class
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REFUNDABLE DEPOSITS */}
      {activeTab === 'DEPOSITS' && (
        <div className="premium-card p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" /> Refundable Security Deposits
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Manage security deposits, process full/partial refunds, or approved adjustments
            </span>
          </div>

          {!deposits.length ? (
            <EmptyState
              icon={<ShieldCheck className="size-8 text-amber-500" />}
              title="No Held Deposits"
              message="Refundable security deposits will appear here once recorded for enrolled students."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-sm divide-y divide-slate-100 dark:divide-slate-800">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Deposit Name</th>
                    <th className="p-3">Total Deposit</th>
                    <th className="p-3">Refunded</th>
                    <th className="p-3">Adjusted</th>
                    <th className="p-3">Remaining Held</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{d.studentName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{d.admissionNo}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{d.name}</td>
                      <td className="p-3 font-mono tabular-nums font-medium text-slate-900 dark:text-slate-200">{inr(parseFloat(d.totalRupees) * 100)}</td>
                      <td className="p-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{inr(parseFloat(d.refundedRupees) * 100)}</td>
                      <td className="p-3 font-mono tabular-nums text-amber-600 dark:text-amber-400 font-medium">{inr(parseFloat(d.adjustedRupees) * 100)}</td>
                      <td className="p-3 font-mono tabular-nums font-bold text-amber-900 dark:text-amber-300">{inr(parseFloat(d.remainingRupees) * 100)}</td>
                      <td className="p-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          {parseFloat(d.remainingRupees) > 0 && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedDeposit(d)
                                  setRefundForm({
                                    depositId: d.id,
                                    studentId: d.studentId,
                                    amountRupees: d.remainingRupees,
                                    refundMode: 'BANK_TRANSFER',
                                    reference: '',
                                    reason: 'Full refund upon student exit',
                                  })
                                  setShowRefundModal(true)
                                }}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                              >
                                Refund
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDeposit(d)
                                  setAdjustForm({
                                    depositId: d.id,
                                    studentId: d.studentId,
                                    adjustmentAmountRupees: '',
                                    reason: '',
                                  })
                                  setShowAdjustModal(true)
                                }}
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
                              >
                                Adjust
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS & RECEIPTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="premium-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="size-5 text-purple-600 dark:text-purple-400" /> Recorded Payments & Official Receipts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Every payment transaction is linked to a unique official receipt</p>
            </div>
            {payments.length > 0 && (
              <button
                type="button"
                onClick={handleExportPaymentsCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs"
              >
                <Download className="size-4 text-emerald-600 dark:text-emerald-400" /> Download CSV / Excel
              </button>
            )}
          </div>

          {!payments.length ? (
            <EmptyState
              icon={<CreditCard className="size-8 text-emerald-500" />}
              title="No Payment Transactions Recorded"
              message="Payments recorded against fee schedules will appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-sm divide-y divide-slate-100 dark:divide-slate-800">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    <th className="p-3">Payment #</th>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-medium text-slate-800 dark:text-slate-200">{p.paymentNumber}</td>
                      <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{p.receiptNumber || 'N/A'}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{p.studentName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{p.admissionNo}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{fmtDate(p.paymentDate)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{p.method}</td>
                      <td className="p-3 font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{inr(parseFloat(p.amountRupees) * 100)}</td>
                      <td className="p-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE FEE STRUCTURE MODAL */}
      {showStructureModal && (
        <Modal
          title="Create Fee Structure"
          open={showStructureModal}
          onClose={() => setShowStructureModal(false)}
        >
          <form onSubmit={handleCreateStructure} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Structure Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nursery Annual Fee Structure 2026-27"
                value={structForm.name}
                onChange={(e) => setStructForm({ ...structForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Academic Session</label>
                <select
                  value={structForm.academicSessionId}
                  onChange={(e) => setStructForm({ ...structForm, academicSessionId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Current Academic Year</option>
                  {academicSessions.map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Target Classroom / Program</label>
                <select
                  value={structForm.classroomId}
                  onChange={(e) => setStructForm({ ...structForm, classroomId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">All Classrooms / All Programs</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Activation Status</label>
              <select
                value={structForm.status}
                onChange={(e) => setStructForm({ ...structForm, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ACTIVE" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">ACTIVE (Automatically applies to all eligible class students)</option>
                <option value="DRAFT" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">DRAFT (Save for later configuration)</option>
              </select>
            </div>

            {/* Configured Fee Items List */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Fee Items & Frequency</h4>
                <button
                  type="button"
                  onClick={addStructItem}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3" /> Add Fee Item
                </button>
              </div>

              {structForm.items.map((item, idx) => (
                <div key={idx} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Item #{idx + 1}</span>
                    {structForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStructItem(idx)}
                        className="text-rose-600 dark:text-rose-400 hover:text-rose-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Item Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tuition Fee"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...structForm.items]
                          updated[idx].name = e.target.value
                          setStructForm({ ...structForm, items: updated })
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Fee Type</label>
                      <select
                        value={item.feeType}
                        onChange={(e) => {
                          const updated = [...structForm.items]
                          const feeType = e.target.value as any
                          updated[idx].feeType = feeType
                          if (feeType === 'REFUNDABLE_DEPOSIT') {
                            updated[idx].isRefundable = true
                          }
                          setStructForm({ ...structForm, items: updated })
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="REGULAR" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Regular Fee</option>
                        <option value="REFUNDABLE_DEPOSIT" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Refundable Deposit</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Amount (₹)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.amountRupees}
                        onChange={(e) => {
                          const updated = [...structForm.items]
                          updated[idx].amountRupees = parseFloat(e.target.value) || 0
                          setStructForm({ ...structForm, items: updated })
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Payment Frequency</label>
                      <select
                        value={item.frequency}
                        onChange={(e) => {
                          const updated = [...structForm.items]
                          updated[idx].frequency = e.target.value as any
                          setStructForm({ ...structForm, items: updated })
                        }}
                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="ONE_TIME" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">One Time</option>
                        <option value="MONTHLY" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Monthly</option>
                        <option value="QUARTERLY" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Quarterly</option>
                        <option value="HALF_YEARLY" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Half-Yearly</option>
                        <option value="ANNUALLY" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowStructureModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Save Fee Structure
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <Modal
          title="Record Payment & Issue Receipt"
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Select Student *</label>
              <select
                required
                value={paymentForm.studentId}
                onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                    {s.name} ({s.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            {paymentForm.studentId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Select Fee Item / Installment *</label>
                {loadingStudentSchedules ? (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium py-2 animate-pulse">Loading student fee schedules...</div>
                ) : (
                  <select
                    required
                    value={paymentForm.feeScheduleId}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const found = studentSchedules.find((sc) => sc.id === selectedId)
                      setPaymentForm({
                        ...paymentForm,
                        feeScheduleId: selectedId,
                        amountRupees: found?.remainingRupees ? found.remainingRupees : paymentForm.amountRupees,
                      })
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                      -- Select Due Installment --
                    </option>
                    {studentSchedules
                      .filter((sc) => sc.status !== 'PAID' && sc.status !== 'CANCELLED')
                      .map((sc) => (
                        <option key={sc.id} value={sc.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">
                          {sc.itemName} ({sc.period || 'One Time'}) — Due: ₹{sc.amountDueRupees} | Remaining: ₹{sc.remainingRupees} [{sc.status}]
                        </option>
                      ))}
                    {studentSchedules.length > 0 && studentSchedules.every((sc) => sc.status === 'PAID') && (
                      <option disabled value="" className="text-slate-500 dark:text-slate-400">
                        (All fee schedules for this student are fully PAID)
                      </option>
                    )}
                    {studentSchedules.length === 0 && (
                      <option disabled value="" className="text-slate-500 dark:text-slate-400">
                        (No fee schedule found — please activate Fee Structure for student class)
                      </option>
                    )}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 3000"
                  value={paymentForm.amountRupees}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountRupees: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Supports partial payment</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Payment Method *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">CASH</option>
                  <option value="UPI" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">UPI</option>
                  <option value="BANK_TRANSFER" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">BANK TRANSFER</option>
                  <option value="CARD" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">CARD</option>
                  <option value="CHEQUE" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">CHEQUE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Transaction Ref / Reference Number</label>
              <input
                type="text"
                placeholder="e.g. UPI-129381928"
                value={paymentForm.transactionRef}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm"
              >
                Confirm & Issue Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PROCESS REFUND MODAL */}
      {showRefundModal && selectedDeposit && (
        <Modal
          title={`Process Refund — ${selectedDeposit.name}`}
          open={showRefundModal}
          onClose={() => setShowRefundModal(false)}
        >
          <form onSubmit={handleProcessRefund} className="space-y-4 p-1">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs space-y-1">
              <div>Student: <span className="font-semibold">{selectedDeposit.studentName}</span> ({selectedDeposit.admissionNo})</div>
              <div>Available Refundable Balance: <span className="font-bold text-amber-900 dark:text-amber-200">{inr(parseFloat(selectedDeposit.remainingRupees) * 100)}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Refund Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedDeposit.remainingRupees}
                value={refundForm.amountRupees}
                onChange={(e) => setRefundForm({ ...refundForm, amountRupees: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Refund Mode</label>
              <select
                value={refundForm.refundMode}
                onChange={(e) => setRefundForm({ ...refundForm, refundMode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="BANK_TRANSFER" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">BANK TRANSFER</option>
                <option value="UPI" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">UPI</option>
                <option value="CHEQUE" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">CHEQUE</option>
                <option value="CASH" className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white">CASH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Reason for Refund *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Student course completion refund"
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm"
              >
                Confirm Refund
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADJUST DEPOSIT MODAL */}
      {showAdjustModal && selectedDeposit && (
        <Modal
          title={`Adjust Deposit — ${selectedDeposit.name}`}
          open={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
        >
          <form onSubmit={handleAdjustDeposit} className="space-y-4 p-1">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
              <div>Student: <span className="font-semibold">{selectedDeposit.studentName}</span></div>
              <div>Available Held Deposit: <span className="font-bold">{inr(parseFloat(selectedDeposit.remainingRupees) * 100)}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Adjustment Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedDeposit.remainingRupees}
                placeholder="e.g. 1000 for damages / unreturned books"
                value={adjustForm.adjustmentAmountRupees}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentAmountRupees: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Adjustment Reason & Audit Note *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Deduction for damaged library kit"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 shadow-sm"
              >
                Record Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
