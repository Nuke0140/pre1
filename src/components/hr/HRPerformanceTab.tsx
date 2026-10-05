'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Award,
  Plus,
  Star,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Eye,
  Send,
  Check,
  X,
  ChevronRight,
  Sparkles,
  DollarSign,
  User,
  Calendar,
} from 'lucide-react'
import { Card, StatusBadge, Avatar, Skeleton, Field } from '@/components/preone/ui'
import { DataTable, Column } from '@/components/preone/DataTable'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'

interface StaffRef {
  id: string
  employeeCode: string
  designation: string | null
  user: {
    fullName: string
    email: string
  }
}

interface AppraisalItem {
  id: string
  tenantId: string
  employeeId: string
  reviewPeriod: string
  reviewStartDate: string | null
  reviewEndDate: string | null
  appraisalDate: string
  reviewerId: string
  rating: number
  performanceStatus: string
  strengths: string | null
  areasForImprovement: string | null
  goals: string | null
  achievements: string | null
  reviewerComments: string | null
  employeeComments: string | null
  previousSalary: number
  increaseType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'NO_INCREASE'
  increasePercentage: number | null
  increaseAmount: number
  revisedSalary: number
  effectiveDate: string | null
  salaryRevisionStatus: 'NOT_APPLICABLE' | 'PENDING' | 'APPROVED' | 'APPLIED' | 'CANCELLED'
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  employee: StaffRef
  reviewer: StaffRef
}

interface PerformanceDashboardStats {
  totalEmployees: number
  dueForAppraisal: number
  completedAppraisals: number
  pendingReviews: number
  approvedAppraisals: number
  salaryRevisionsApplied: number
}

export function HRPerformanceTab({ canWrite }: { canWrite?: boolean }) {
  const toast = useToast()
  const [appraisals, setAppraisals] = useState<AppraisalItem[]>([])
  const [stats, setStats] = useState<PerformanceDashboardStats | null>(null)
  const [staffList, setStaffList] = useState<StaffRef[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)

  // Create Form State
  const [form, setForm] = useState({
    employeeId: '',
    reviewerId: '',
    reviewPeriod: '2025–26',
    reviewStartDate: '',
    reviewEndDate: '',
    appraisalDate: new Date().toISOString().split('T')[0],
    rating: 4.5,
    performanceStatus: 'Excellent',
    strengths: '',
    areasForImprovement: '',
    goals: '',
    achievements: '',
    reviewerComments: '',
    employeeComments: '',
    increaseType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'NO_INCREASE',
    increasePercentage: 10,
    increaseAmount: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
  })

  // Selected Employee base salary lookup (from staff list or standard)
  const selectedEmpPreviousSalary = useMemo(() => {
    // We can estimate or retrieve if available
    return 25000
  }, [form.employeeId])

  // Calculated Preview
  const calculatedPreview = useMemo(() => {
    const base = selectedEmpPreviousSalary
    let incAmount = 0
    if (form.increaseType === 'PERCENTAGE') {
      incAmount = (base * (form.increasePercentage || 0)) / 100
    } else if (form.increaseType === 'FIXED_AMOUNT') {
      incAmount = form.increaseAmount || 0
    }
    const revised = base + incAmount
    return { base, incAmount, revised }
  }, [selectedEmpPreviousSalary, form.increaseType, form.increasePercentage, form.increaseAmount])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [resAppraisals, resStats, resStaff] = await Promise.all([
        fetch('/api/v1/hr/appraisals').then((r) => r.json()),
        fetch('/api/v1/hr/appraisals?stats=true').then((r) => r.json()),
        fetch('/api/v1/hr/staff').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      ])

      if (resAppraisals.success) {
        setAppraisals(resAppraisals.data || [])
      }
      if (resStats.success) {
        setStats(resStats.data)
      }
      if (resStaff.success) {
        // Flatten staff list to required shape
        const list = (resStaff.data || []).map((s: any) => ({
          id: s.id,
          employeeCode: s.employeeCode,
          designation: s.designationRef?.name || s.designation || 'Staff',
          user: {
            fullName: s.user?.fullName || 'Unknown',
            email: s.user?.email || '',
          },
        }))
        setStaffList(list)
      }
    } catch (e: any) {
      toast.error('Failed to load performance appraisals', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleCreateAppraisal = async () => {
    if (!form.employeeId || !form.reviewerId || !form.reviewPeriod) {
      toast.error('Validation Error', 'Please select Employee, Reviewer, and Review Period.')
      return
    }
    setSubmittingAction(true)
    try {
      const res = await fetch('/api/v1/hr/appraisals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Appraisal Record Created', 'Draft appraisal record saved successfully.')
        setIsCreateOpen(false)
        loadAll()
      } else {
        toast.error('Failed to create appraisal', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleSubmitAppraisal = async (id: string) => {
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/v1/hr/appraisals/${id}/submit`, { method: 'POST' }).then((r) =>
        r.json()
      )
      if (res.success) {
        toast.success('Appraisal Submitted', 'Appraisal is now under review.')
        setIsDetailOpen(false)
        loadAll()
      } else {
        toast.error('Submission Failed', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleApproveAppraisal = async (id: string) => {
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/v1/hr/appraisals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerComments: 'Appraisal approved with salary revision.' }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Appraisal Approved', 'Salary revision applied to employee salary structure.')
        setIsDetailOpen(false)
        loadAll()
      } else {
        toast.error('Approval Failed', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleRejectAppraisal = async (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason === null) return

    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/v1/hr/appraisals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      }).then((r) => r.json())

      if (res.success) {
        toast.info('Appraisal Rejected', 'Appraisal status updated to REJECTED.')
        setIsDetailOpen(false)
        loadAll()
      } else {
        toast.error('Rejection Failed', res.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setSubmittingAction(false)
    }
  }

  const filteredAppraisals = useMemo(() => {
    if (statusFilter === 'ALL') return appraisals
    return appraisals.filter((a) => a.status === statusFilter)
  }, [appraisals, statusFilter])

  const columns = useMemo<Column<AppraisalItem>[]>(
    () => [
      {
        key: 'employee',
        header: 'Employee',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5 py-0.5">
            <Avatar name={row.employee?.user?.fullName || 'Staff'} size="md" />
            <div>
              <div className="font-semibold text-foreground leading-tight">
                {row.employee?.user?.fullName || 'Unknown'}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {row.employee?.employeeCode} • {row.employee?.designation || 'Staff'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'reviewPeriod',
        header: 'Review Period',
        sortable: true,
        render: (row) => (
          <div>
            <div className="text-xs font-bold text-foreground">{row.reviewPeriod}</div>
            <div className="text-[10px] text-muted-foreground">
              Reviewer: {row.reviewer?.user?.fullName || 'Management'}
            </div>
          </div>
        ),
      },
      {
        key: 'rating',
        header: 'Rating & Status',
        sortable: true,
        align: 'center',
        render: (row) => (
          <div className="flex flex-col items-center gap-1">
            <span className="badge b-warning text-xs font-bold px-2 py-0.5 inline-flex items-center gap-1 shadow-2xs">
              <Star size={11} className="fill-warning text-warning" />
              <span>{row.rating.toFixed(1)} / 5.0</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">{row.performanceStatus}</span>
          </div>
        ),
      },
      {
        key: 'salaryImpact',
        header: 'Salary Impact',
        sortable: true,
        render: (row) => (
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <span>₹{row.previousSalary.toLocaleString()}</span>
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ₹{row.revisedSalary.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span>
                {row.increaseType === 'PERCENTAGE'
                  ? `+${row.increasePercentage}% (₹${row.increaseAmount.toLocaleString()})`
                  : row.increaseType === 'FIXED_AMOUNT'
                  ? `+₹${row.increaseAmount.toLocaleString()} fixed`
                  : 'No Increase'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Workflow Status',
        sortable: true,
        align: 'center',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'salaryRevisionStatus',
        header: 'Revision Status',
        sortable: true,
        align: 'center',
        render: (row) => (
          <span
            className={`badge text-[10px] font-bold px-2 py-0.5 rounded-full ${
              row.salaryRevisionStatus === 'APPLIED'
                ? 'b-success'
                : row.salaryRevisionStatus === 'APPROVED'
                ? 'b-primary'
                : 'b-neutral'
            }`}
          >
            {row.salaryRevisionStatus}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'center',
        render: (row) => (
          <div className="flex items-center justify-center gap-1.5">
            {row.status !== 'APPROVED' && (
              <button
                onClick={() => handleApproveAppraisal(row.id)}
                disabled={submittingAction}
                title="Approve Appraisal & Apply Salary Revision"
                className="btn btn-success btn-xs flex items-center gap-1 px-2 py-1 text-[11px] font-bold shadow-2xs"
              >
                <Check size={12} />
                <span>Approve</span>
              </button>
            )}

            {row.status !== 'REJECTED' && (
              <button
                onClick={() => handleRejectAppraisal(row.id)}
                disabled={submittingAction}
                title="Reject Appraisal / Not Approved"
                className="btn btn-danger btn-xs flex items-center gap-1 px-2 py-1 text-[11px] font-bold shadow-2xs"
              >
                <X size={12} />
                <span>Not Approved</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedAppraisal(row)
                setIsDetailOpen(true)
              }}
              className="btn btn-ghost btn-xs flex items-center gap-1 text-primary hover:bg-primary/10 px-2 py-1"
            >
              <Eye size={12} />
              <span>Details</span>
            </button>
          </div>
        ),
      },
    ],
    []
  )

  if (loading && !appraisals.length) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} h={90} variant="card" />
          ))}
        </div>
        <Skeleton h={300} variant="card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 1. KPI Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Employees
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User size={13} />
            </div>
          </div>
          <div className="text-xl font-bold text-foreground">{stats?.totalEmployees || 0}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Active staff count</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Due For Appraisal
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={13} />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats?.dueForAppraisal || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Pending evaluation</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award size={13} />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {stats?.completedAppraisals || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Appraisals logged</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Pending Reviews
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCheck size={13} />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {stats?.pendingReviews || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Submitted for review</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Approved
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.approvedAppraisals || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Approved appraisals</div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Salary Revisions
            </span>
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp size={13} />
            </div>
          </div>
          <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
            {stats?.salaryRevisionsApplied || 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Applied to Payroll</div>
        </div>
      </div>

      {/* ── 2. Top Header & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Performance & Appraisal Module
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maintain historical records of employee performance reviews, ratings, feedback, and salary revisions integrated with Salary Structure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Badges */}
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border text-xs">
            {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {canWrite !== false && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary btn-sm flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus size={14} />
              <span>Create Appraisal</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Appraisals Table ── */}
      <DataTable
        columns={columns}
        data={filteredAppraisals}
        searchPlaceholder="Search appraisal by employee name or review period..."
        emptyTitle="No Appraisal Records Found"
        emptyMessage="No employee performance appraisals have been recorded yet."
        emptyIcon={<Award size={36} className="text-muted-foreground opacity-50" />}
        paginate
        defaultPageSize={15}
        showExport
        exportFileName="preone-employee-appraisals"
      />

      {/* ── 4. Create Appraisal Modal ── */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Employee Performance Appraisal"
        subtitle="Record performance review details, rating, goals, and salary revision decision"
        icon={<Award size={18} />}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={submittingAction} onClick={handleCreateAppraisal}>
              {submittingAction ? 'Saving...' : 'Save Draft Appraisal'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Employee & Reviewer */}
          <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-3">
            <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <User size={13} className="text-primary" />
              Employee & Reviewer Scope
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Employee" required>
                <select
                  className="select text-xs w-full"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                >
                  <option value="">Select Employee...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.fullName} ({s.employeeCode} - {s.designation})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Reviewer" required>
                <select
                  className="select text-xs w-full"
                  value={form.reviewerId}
                  onChange={(e) => setForm({ ...form, reviewerId: e.target.value })}
                >
                  <option value="">Select Reviewer...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.fullName} ({s.employeeCode})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Section 2: Review Period & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Review Period (e.g. 2025–26)" required>
              <input
                className="input text-xs w-full"
                value={form.reviewPeriod}
                onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })}
                placeholder="2025–26"
              />
            </Field>

            <Field label="Appraisal Date" required>
              <input
                type="date"
                className="input text-xs w-full"
                value={form.appraisalDate}
                onChange={(e) => setForm({ ...form, appraisalDate: e.target.value })}
              />
            </Field>

            <Field label="Salary Effective Date">
              <input
                type="date"
                className="input text-xs w-full"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              />
            </Field>
          </div>

          {/* Section 3: Performance Rating & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Performance Rating (1.0 to 5.0)" required>
              <select
                className="select text-xs w-full"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
              >
                <option value={5.0}>5.0 — Excellent / Outstanding</option>
                <option value={4.5}>4.5 — Very Good</option>
                <option value={4.0}>4.0 — Meets Expectations</option>
                <option value={3.0}>3.0 — Needs Improvement</option>
                <option value={2.0}>2.0 — Poor</option>
                <option value={1.0}>1.0 — Unsatisfactory</option>
              </select>
            </Field>

            <Field label="Performance Status / Result" required>
              <input
                className="input text-xs w-full"
                value={form.performanceStatus}
                onChange={(e) => setForm({ ...form, performanceStatus: e.target.value })}
                placeholder="Excellent / Outstanding"
              />
            </Field>
          </div>

          {/* Section 4: Qualitative Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Strengths">
              <textarea
                className="input text-xs w-full min-h-[60px]"
                rows={2}
                value={form.strengths}
                onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                placeholder="Key strengths, classroom management, leadership..."
              />
            </Field>

            <Field label="Areas For Improvement">
              <textarea
                className="input text-xs w-full min-h-[60px]"
                rows={2}
                value={form.areasForImprovement}
                onChange={(e) => setForm({ ...form, areasForImprovement: e.target.value })}
                placeholder="Key growth areas..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Goals / Targets">
              <textarea
                className="input text-xs w-full min-h-[60px]"
                rows={2}
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
                placeholder="Future objectives..."
              />
            </Field>

            <Field label="Achievements">
              <textarea
                className="input text-xs w-full min-h-[60px]"
                rows={2}
                value={form.achievements}
                onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                placeholder="Notable accomplishments..."
              />
            </Field>
          </div>

          <Field label="Reviewer Comments">
            <textarea
              className="input text-xs w-full min-h-[60px]"
              rows={2}
              value={form.reviewerComments}
              onChange={(e) => setForm({ ...form, reviewerComments: e.target.value })}
              placeholder="Overall reviewer summary..."
            />
          </Field>

          {/* Section 5: Salary Impact Decision */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                Salary Revision Decision
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Appraisal records recommendation; approved appraisal updates Salary Structure.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Increase Type">
                <select
                  className="select text-xs w-full"
                  value={form.increaseType}
                  onChange={(e) =>
                    setForm({ ...form, increaseType: e.target.value as any })
                  }
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  <option value="NO_INCREASE">No Increase</option>
                </select>
              </Field>

              {form.increaseType === 'PERCENTAGE' && (
                <Field label="Increase Percentage (%)">
                  <input
                    type="number"
                    step="0.1"
                    className="input text-xs w-full"
                    value={form.increasePercentage}
                    onChange={(e) =>
                      setForm({ ...form, increasePercentage: parseFloat(e.target.value) || 0 })
                    }
                  />
                </Field>
              )}

              {form.increaseType === 'FIXED_AMOUNT' && (
                <Field label="Increase Amount (₹)">
                  <input
                    type="number"
                    className="input text-xs w-full"
                    value={form.increaseAmount}
                    onChange={(e) =>
                      setForm({ ...form, increaseAmount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </Field>
              )}
            </div>

            {/* Live Salary Calculation Preview */}
            <div className="p-3 rounded-lg bg-background border border-emerald-500/20 text-xs space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Salary Calculation Live Preview
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span>Previous Base Salary:</span>
                <span>₹{calculatedPreview.base.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-emerald-600 dark:text-emerald-400">
                <span>Increase Amount:</span>
                <span>+ ₹{calculatedPreview.incAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-1 flex items-center justify-between font-mono font-bold text-sm text-foreground">
                <span>Revised Salary:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ₹{calculatedPreview.revised.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── 5. Appraisal Detail & Action Drawer ── */}
      {selectedAppraisal && (
        <Modal
          open={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Appraisal Record — ${selectedAppraisal.employee?.user?.fullName}`}
          subtitle={`Review Period: ${selectedAppraisal.reviewPeriod} • Status: ${selectedAppraisal.status}`}
          icon={<Award size={18} />}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Workflow Action:</span>
                <span className="badge b-primary text-xs">{selectedAppraisal.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost text-xs" onClick={() => setIsDetailOpen(false)}>
                  Close
                </button>
                {selectedAppraisal.status !== 'APPROVED' && (
                  <button
                    className="btn btn-success btn-xs flex items-center gap-1 font-bold"
                    disabled={submittingAction}
                    onClick={() => handleApproveAppraisal(selectedAppraisal.id)}
                  >
                    <Check size={13} />
                    <span>Approve & Apply Revision</span>
                  </button>
                )}
                {selectedAppraisal.status !== 'REJECTED' && (
                  <button
                    className="btn btn-danger btn-xs flex items-center gap-1 font-bold"
                    disabled={submittingAction}
                    onClick={() => handleRejectAppraisal(selectedAppraisal.id)}
                  >
                    <X size={13} />
                    <span>Not Approved (Reject)</span>
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            {/* Header Profile */}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedAppraisal.employee?.user?.fullName || 'Staff'} size="lg" />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedAppraisal.employee?.user?.fullName}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {selectedAppraisal.employee?.employeeCode} • {selectedAppraisal.employee?.designation}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="badge b-warning text-sm font-bold px-2.5 py-1 inline-flex items-center gap-1">
                  <Star size={13} className="fill-warning text-warning" />
                  <span>{selectedAppraisal.rating.toFixed(1)} / 5.0</span>
                </span>
                <div className="text-xs font-semibold text-muted-foreground mt-1">
                  {selectedAppraisal.performanceStatus}
                </div>
              </div>
            </div>

            {/* Appraisal Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Review Period</div>
                <div className="font-semibold text-foreground mt-0.5">{selectedAppraisal.reviewPeriod}</div>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Appraisal Date</div>
                <div className="font-semibold text-foreground mt-0.5">
                  {new Date(selectedAppraisal.appraisalDate).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Reviewer</div>
                <div className="font-semibold text-foreground mt-0.5">
                  {selectedAppraisal.reviewer?.user?.fullName || 'Management'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Revision Status</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedAppraisal.salaryRevisionStatus}
                </div>
              </div>
            </div>

            {/* Detailed Qualitative Fields */}
            {selectedAppraisal.strengths && (
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-bold text-foreground">Strengths:</span>
                <p className="text-muted-foreground leading-relaxed">{selectedAppraisal.strengths}</p>
              </div>
            )}

            {selectedAppraisal.areasForImprovement && (
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-bold text-foreground">Areas For Improvement:</span>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedAppraisal.areasForImprovement}
                </p>
              </div>
            )}

            {selectedAppraisal.goals && (
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-bold text-foreground">Goals & Targets:</span>
                <p className="text-muted-foreground leading-relaxed">{selectedAppraisal.goals}</p>
              </div>
            )}

            {selectedAppraisal.achievements && (
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-bold text-foreground">Achievements:</span>
                <p className="text-muted-foreground leading-relaxed">{selectedAppraisal.achievements}</p>
              </div>
            )}

            {selectedAppraisal.reviewerComments && (
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="font-bold text-foreground">Reviewer Comments:</span>
                <p className="text-muted-foreground italic leading-relaxed">
                  "{selectedAppraisal.reviewerComments}"
                </p>
              </div>
            )}

            {/* Salary Impact Breakdown */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-emerald-600" />
                  Salary Impact & Structure Linkage
                </span>
                <span className="text-[11px] font-mono">
                  Effective: {selectedAppraisal.effectiveDate ? new Date(selectedAppraisal.effectiveDate).toLocaleDateString('en-IN') : 'Immediate'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Base Salary</div>
                  <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                    ₹{selectedAppraisal.previousSalary.toLocaleString()}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Appraisal Increase</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {selectedAppraisal.increaseType === 'PERCENTAGE'
                      ? `${selectedAppraisal.increasePercentage}%`
                      : selectedAppraisal.increaseType === 'FIXED_AMOUNT'
                      ? 'Fixed'
                      : 'None'}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Increase Amount</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    + ₹{selectedAppraisal.increaseAmount.toLocaleString()}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-background border border-emerald-500/30">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Revised Salary</div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    ₹{selectedAppraisal.revisedSalary.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
