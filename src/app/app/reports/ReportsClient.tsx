'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Download, Filter, RefreshCw, Calendar, FileSpreadsheet,
  FileText, Printer, Search, Plus, Trash2, Eye, CheckCircle2,
  Users, CalendarCheck, IndianRupee, HeartPulse, Sparkles, Bus, Package,
  Sliders, AlertTriangle, ArrowLeft, ChevronRight, X, RotateCcw,
  GraduationCap, ClipboardList, ShieldAlert
} from 'lucide-react'
import { PageHead, Segmented, KpiTile, EmptyState, Field, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { DataTable, Column } from '@/components/preone/DataTable'
import { useToast } from '@/components/preone/Toast'
import { BulkDocumentJobsClient } from '@/components/reports/BulkDocumentJobsClient'

// ─────────────────────────────────────────────────────────────────────────────
// EXACTLY EIGHT CANONICAL REPORT GROUPS (MANDATORY PRODUCT SCOPE)
// ─────────────────────────────────────────────────────────────────────────────
export type ReportGroupId =
  | 'overview'
  | 'admissions'
  | 'attendance'
  | 'learning'
  | 'fees'
  | 'workforce'
  | 'transport'
  | 'inventory'

export interface SubReport {
  id: string
  label: string
  reportKey: string
  description: string
}

export interface ReportGroupConfig {
  id: ReportGroupId
  title: string
  plainDescription: string
  category: string
  icon: any
  subReports: SubReport[]
  searchPlaceholder: string
  statusOptions?: { value: string; label: string }[]
  supportsDate: boolean
  supportsBranch: boolean
  supportsRoom: boolean
}

export const REPORT_GROUPS: ReportGroupConfig[] = [
  {
    id: 'overview',
    title: 'School Overview',
    plainDescription: 'See the main numbers for your school.',
    category: 'Executive MIS',
    icon: BarChart3,
    subReports: [
      { id: 'summary', label: 'Operational Snapshot', reportKey: 'exec-overview', description: 'Real-time overview of enrollments, attendance, fees, staffing, and supplies.' },
    ],
    searchPlaceholder: 'Search summary metric...',
    supportsDate: true,
    supportsBranch: true,
    supportsRoom: false,
  },
  {
    id: 'admissions',
    title: 'Admissions & Enrollment',
    plainDescription: 'View enquiries and enrolled students.',
    category: 'Admissions & Students',
    icon: GraduationCap,
    subReports: [
      { id: 'students', label: 'Enrolled Students', reportKey: 'students-strength', description: 'Active enrolled students with classroom allocations and programs.' },
      { id: 'pipeline', label: 'Admissions Pipeline', reportKey: 'admissions-funnel', description: 'Prospective enquiries, applicant stages, and conversion tracking.' },
    ],
    searchPlaceholder: 'Search student name, admission #, or enquiry...',
    statusOptions: [
      { value: 'ACTIVE', label: 'Active Students' },
      { value: 'INACTIVE', label: 'Inactive / On Hold' },
      { value: 'GRADUATED', label: 'Graduated' },
      { value: 'TRANSFERRED', label: 'Transferred' },
    ],
    supportsDate: true,
    supportsBranch: true,
    supportsRoom: true,
  },
  {
    id: 'attendance',
    title: 'Attendance & Daily Care',
    plainDescription: 'Check attendance and children\'s daily records.',
    category: 'Operations',
    icon: CalendarCheck,
    subReports: [
      { id: 'daily-attendance', label: 'Attendance Register', reportKey: 'attendance-daily', description: 'Daily attendance logs, arrivals, late arrivals, and absence notes.' },
      { id: 'daily-care', label: 'Daily Care Timeline', reportKey: 'operations-daily', description: 'Meals, naps, incident reports, and health care observations.' },
    ],
    searchPlaceholder: 'Search student name or admission #...',
    statusOptions: [
      { value: 'PRESENT', label: 'Present' },
      { value: 'ABSENT', label: 'Absent' },
      { value: 'LATE', label: 'Late Arrival' },
      { value: 'HALF_DAY', label: 'Half Day' },
    ],
    supportsDate: true,
    supportsBranch: true,
    supportsRoom: true,
  },
  {
    id: 'learning',
    title: 'Learning & Development',
    plainDescription: 'Review observations and developmental progress.',
    category: 'Academics',
    icon: HeartPulse,
    subReports: [
      { id: 'milestones', label: 'Milestones & Observations', reportKey: 'academics-milestones', description: 'Teacher observation records, learning goals, and developmental milestones.' },
    ],
    searchPlaceholder: 'Search student, milestone, or learning area...',
    statusOptions: [
      { value: 'PUBLISHED', label: 'Published / Verified' },
      { value: 'DRAFT', label: 'Draft Observation' },
    ],
    supportsDate: true,
    supportsBranch: true,
    supportsRoom: true,
  },
  {
    id: 'fees',
    title: 'Fees & Payments',
    plainDescription: 'View collections, receipts and pending fees.',
    category: 'Finance',
    icon: IndianRupee,
    subReports: [
      { id: 'collections', label: 'Collections & Receipts', reportKey: 'finance-collections', description: 'Fee payments received, receipt numbers, payment modes, and clearance status.' },
      { id: 'outstanding', label: 'Outstanding & Aging', reportKey: 'finance-outstanding', description: 'Pending invoices, overdue balances, and 30-60-90 day aging buckets.' },
    ],
    searchPlaceholder: 'Search invoice #, receipt #, or student name...',
    statusOptions: [
      { value: 'PAID', label: 'Fully Paid' },
      { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
      { value: 'OVERDUE', label: 'Overdue Dues' },
      { value: 'ISSUED', label: 'Issued / Pending' },
    ],
    supportsDate: true,
    supportsBranch: true,
    supportsRoom: true,
  },
  {
    id: 'workforce',
    title: 'Staff & Workforce',
    plainDescription: 'Review staff information and attendance.',
    category: 'HR',
    icon: Users,
    subReports: [
      { id: 'headcount', label: 'Staff Directory & Attendance', reportKey: 'hr-headcount', description: 'Staff directory, designations, departments, and attendance status today.' },
    ],
    searchPlaceholder: 'Search employee code, staff name, or designation...',
    statusOptions: [
      { value: 'PRESENT', label: 'Present Today' },
      { value: 'ABSENT', label: 'Absent Today' },
      { value: 'NOT_MARKED', label: 'Not Marked' },
    ],
    supportsDate: true,
    supportsBranch: true,
    supportsRoom: false,
  },
  {
    id: 'transport',
    title: 'Transport',
    plainDescription: 'View routes, vehicles and assigned students.',
    category: 'Fleet',
    icon: Bus,
    subReports: [
      { id: 'routes', label: 'Route Utilization & Fleet', reportKey: 'transport-utilization', description: 'Vehicle seat capacity, assigned student riders, and utilization percentage.' },
    ],
    searchPlaceholder: 'Search route code, route name, or vehicle #...',
    statusOptions: [
      { value: 'ACTIVE', label: 'Active Routes' },
      { value: 'INACTIVE', label: 'Inactive Routes' },
    ],
    supportsDate: false,
    supportsBranch: true,
    supportsRoom: false,
  },
  {
    id: 'inventory',
    title: 'Inventory & Supplies',
    plainDescription: 'Check available stock and low-stock items.',
    category: 'Supplies',
    icon: Package,
    subReports: [
      { id: 'stock', label: 'Stock Valuation & Alerts', reportKey: 'inventory-valuation', description: 'Current item quantities, minimum thresholds, unit price, and stock valuation.' },
    ],
    searchPlaceholder: 'Search item code, name, or category...',
    statusOptions: [
      { value: 'LOW_STOCK', label: 'Low Stock Alerts' },
      { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
      { value: 'ADEQUATE', label: 'Adequate Stock' },
    ],
    supportsDate: false,
    supportsBranch: true,
    supportsRoom: false,
  },
]

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'session' | 'custom'

export default function ReportsClient() {
  const toast = useToast()

  // Navigation State: null = Landing Page Hub; string = Detail Report Group
  const [activeGroup, setActiveGroup] = useState<ReportGroupId | null>(null)
  const [subTab, setSubTab] = useState<string>('')
  const [showBulkJobs, setShowBulkJobs] = useState(false)

  // Hub Search
  const [hubSearch, setHubSearch] = useState('')


  // Report Dataset & UI state
  const [reportData, setReportData] = useState<any>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [selectedClassroom, setSelectedClassroom] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)

  // Auxiliary context dropdown lists
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; branchId?: string }[]>([])

  // Custom Report Builder Modal state
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customSources] = useState([
    { id: 'STUDENTS', label: 'Students Directory', fields: ['admissionNumber', 'firstName', 'lastName', 'programType', 'status'] },
    { id: 'INVOICES', label: 'Fee Invoices', fields: ['invoiceNumber', 'totalAmountCents', 'paidAmountCents', 'balanceCents', 'status'] },
    { id: 'ATTENDANCE', label: 'Student Attendance', fields: ['date', 'status', 'arrivalTime', 'notes'] },
    { id: 'STAFF', label: 'Staff & Workforce', fields: ['employeeCode', 'designation', 'department', 'employmentType'] },
    { id: 'TRANSPORT', label: 'Transport Routes', fields: ['code', 'name', 'status'] },
    { id: 'INVENTORY', label: 'Inventory Stock', fields: ['code', 'name', 'unitPriceCents', 'isConsumable'] },
  ])
  const [customSource, setCustomSource] = useState('STUDENTS')
  const [customReportName, setCustomReportName] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(['admissionNumber', 'firstName', 'lastName', 'status'])
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [previewColumns, setPreviewColumns] = useState<any[]>([])
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  // Load Branches and Classrooms on mount
  useEffect(() => {
    fetch('/api/v1/branches')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setBranches(res.data.map((b: any) => ({ id: b.id, name: b.name })))
        }
      })
      .catch(() => {})

    fetch('/api/v1/classrooms')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setClassrooms(res.data.map((c: any) => ({ id: c.id, name: c.name, branchId: c.branchId })))
        }
      })
      .catch(() => {})
  }, [])


  // Active Group Config
  const currentGroupConfig = useMemo(() => {
    if (!activeGroup) return null
    return REPORT_GROUPS.find((g) => g.id === activeGroup) || null
  }, [activeGroup])

  // Active Report Key
  const activeReportKey = useMemo(() => {
    if (!currentGroupConfig) return 'students-strength'
    const found = currentGroupConfig.subReports.find((sr) => sr.id === subTab)
    return found ? found.reportKey : currentGroupConfig.subReports[0]?.reportKey || 'students-strength'
  }, [currentGroupConfig, subTab])

  // Synchronize subTab default when switching group
  useEffect(() => {
    if (activeGroup && currentGroupConfig) {
      if (!currentGroupConfig.subReports.some((sr) => sr.id === subTab)) {
        setSubTab(currentGroupConfig.subReports[0]?.id || '')
      }
    }
  }, [activeGroup, currentGroupConfig, subTab])

  // Date Preset Calculator
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset)
    setDateValidationError(null)
    const now = new Date()

    if (preset === 'today') {
      const todayStr = now.toISOString().slice(0, 10)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === 'yesterday') {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      const yStr = y.toISOString().slice(0, 10)
      setStartDate(yStr)
      setEndDate(yStr)
    } else if (preset === 'week') {
      const w = new Date(now)
      const day = w.getDay() || 7
      w.setDate(w.getDate() - day + 1)
      setStartDate(w.toISOString().slice(0, 10))
      setEndDate(now.toISOString().slice(0, 10))
    } else if (preset === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(first.toISOString().slice(0, 10))
      setEndDate(now.toISOString().slice(0, 10))
    } else if (preset === 'session') {
      const sessionStart = new Date(now.getFullYear(), 3, 1) // April 1st
      setStartDate(sessionStart.toISOString().slice(0, 10))
      setEndDate(now.toISOString().slice(0, 10))
    } else if (preset === 'all') {
      setStartDate('')
      setEndDate('')
    }
  }

  // Validate custom date range
  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    if (val && endDate && val > endDate) {
      setDateValidationError('Start date cannot be after end date')
    } else {
      setDateValidationError(null)
    }
  }

  const handleEndDateChange = (val: string) => {
    setEndDate(val)
    if (startDate && val && startDate > val) {
      setDateValidationError('Start date cannot be after end date')
    } else {
      setDateValidationError(null)
    }
  }

  // Load Active Report Data
  const loadReportData = useCallback(async () => {
    if (!activeGroup) return

    if (startDate && endDate && startDate > endDate) {
      setDateValidationError('Start date cannot be after end date')
      return
    }

    try {
      setLoadingReport(true)
      setReportError(null)

      const payloadOptions: any = {
        page,
        pageSize,
        branchId: selectedBranch || null,
        classroomId: selectedClassroom || null,
        status: selectedStatus || undefined,
        search: searchQuery.trim() || undefined,
      }

      if (startDate) payloadOptions.startDate = startDate
      if (endDate) payloadOptions.endDate = endDate

      const res = await fetch('/api/v1/reports/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: activeReportKey,
          options: payloadOptions,
        }),
      }).then((r) => r.json())

      if (res.success) {
        setReportData(res.report)
      } else {
        setReportError(res.error || 'Failed to load report dataset')
      }
    } catch {
      setReportError('Network error while requesting report. Please check your connection.')
    } finally {
      setLoadingReport(false)
    }
  }, [activeGroup, activeReportKey, page, pageSize, selectedBranch, selectedClassroom, selectedStatus, searchQuery, startDate, endDate])

  // Trigger query on parameter change
  useEffect(() => {
    if (activeGroup) {
      loadReportData()
    }
  }, [activeGroup, activeReportKey, page, loadReportData])

  // Reset Filters
  const handleResetFilters = () => {
    setDatePreset('all')
    setStartDate('')
    setEndDate('')
    setDateValidationError(null)
    setSelectedBranch('')
    setSelectedClassroom('')
    setSelectedStatus('')
    setSearchQuery('')
    setPage(1)
  }

  // Export Trigger (CSV, Excel, Print/PDF)
  const handleExport = async (format: 'CSV' | 'XLSX' | 'PRINT') => {
    try {
      setExporting(true)
      const payloadOptions: any = {
        branchId: selectedBranch || null,
        classroomId: selectedClassroom || null,
        status: selectedStatus || undefined,
        search: searchQuery.trim() || undefined,
      }
      if (startDate) payloadOptions.startDate = startDate
      if (endDate) payloadOptions.endDate = endDate

      const res = await fetch('/api/v1/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: activeReportKey,
          format,
          options: payloadOptions,
        }),
      })

      if (!res.ok) {
        throw new Error('Export request failed')
      }

      if (format === 'PRINT') {
        const html = await res.text()
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(html)
          win.document.close()
        }
      } else {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeReportKey}_${new Date().toISOString().slice(0, 10)}.${format === 'XLSX' ? 'xls' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
      toast.success(`Exported ${format} successfully`)
    } catch {
      toast.error('Failed to download report export')
    } finally {
      setExporting(false)
    }
  }

  // Load Saved Custom Reports
  const loadSavedReports = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/reports/custom').then((r) => r.json())
      if (res.success) {
        setSavedReports(res.reports || [])
      }
    } catch {}
  }, [])

  // Custom Preview
  const handlePreviewCustom = async () => {
    try {
      setPreviewLoading(true)
      const res = await fetch('/api/v1/reports/custom/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: customSource,
          fields: selectedFields,
          filters: [],
        }),
      }).then((r) => r.json())

      if (res.success) {
        setPreviewRows(res.preview.previewRows || [])
        setPreviewColumns(res.preview.columns || [])
        toast.success(`Generated preview (${res.preview.totalPreview} rows)`)
      } else {
        toast.error(res.error || 'Failed to preview')
      }
    } catch {
      toast.error('Failed to generate preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Save Custom Report
  const handleSaveCustom = async () => {
    if (!customReportName.trim()) {
      toast.error('Please enter a report name')
      return
    }

    try {
      const res = await fetch('/api/v1/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customReportName,
          source: customSource,
          fields: selectedFields,
          filters: [],
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Custom report saved successfully')
        setCustomReportName('')
        loadSavedReports()
      } else {
        toast.error(res.error || 'Failed to save custom report')
      }
    } catch {
      toast.error('Error saving custom report')
    }
  }

  // Table Columns
  const tableColumns: Column<any>[] = useMemo(() => {
    if (!reportData?.columns) return []
    return reportData.columns.map((c: any) => ({
      key: c.key,
      header: c.label,
      align: c.align || 'left',
      render: (row: any) => {
        const val = row[c.key]
        if (c.type === 'ENUM') {
          return <StatusBadge status={String(val || '')} />
        }
        return <span>{val ?? '—'}</span>
      },
    }))
  }, [reportData])

  // Filtered Hub Cards
  const filteredHubCards = useMemo(() => {
    if (!hubSearch.trim()) return REPORT_GROUPS
    const q = hubSearch.toLowerCase()
    return REPORT_GROUPS.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.plainDescription.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
    )
  }, [hubSearch])

  // Active Filter Chips
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; value: string; onRemove: () => void }[] = []
    if (startDate && endDate) {
      chips.push({
        id: 'date',
        label: 'Date Range',
        value: `${startDate} to ${endDate}`,
        onRemove: () => {
          setDatePreset('all')
          setStartDate('')
          setEndDate('')
        },
      })
    } else if (startDate) {
      chips.push({
        id: 'startDate',
        label: 'Date',
        value: startDate,
        onRemove: () => {
          setDatePreset('all')
          setStartDate('')
        },
      })
    }
    if (selectedBranch) {
      const bName = branches.find((b) => b.id === selectedBranch)?.name || 'Branch'
      chips.push({
        id: 'branch',
        label: 'Branch',
        value: bName,
        onRemove: () => setSelectedBranch(''),
      })
    }
    if (selectedClassroom) {
      const cName = classrooms.find((c) => c.id === selectedClassroom)?.name || 'Classroom'
      chips.push({
        id: 'room',
        label: 'Classroom',
        value: cName,
        onRemove: () => setSelectedClassroom(''),
      })
    }
    if (selectedStatus) {
      chips.push({
        id: 'status',
        label: 'Status',
        value: selectedStatus,
        onRemove: () => setSelectedStatus(''),
      })
    }
    if (searchQuery.trim()) {
      chips.push({
        id: 'search',
        label: 'Search',
        value: `"${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(''),
      })
    }
    return chips
  }, [startDate, endDate, selectedBranch, selectedClassroom, selectedStatus, searchQuery, branches, classrooms])

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: BULK DOCUMENT GENERATION JOBS
  // ───────────────────────────────────────────────────────────────────────────
  if (showBulkJobs) {
    return <BulkDocumentJobsClient onBackToReports={() => setShowBulkJobs(false)} />
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 1: LANDING PAGE HUB (EXACTLY EIGHT CANONICAL REPORT GROUPS)
  // ───────────────────────────────────────────────────────────────────────────
  if (!activeGroup) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-28">
        {/* Page Head */}
        <PageHead
          title="Reports & Analytics"
          actions={
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary"
                onClick={() => setShowBulkJobs(true)}
                title="Create and manage bulk document generation jobs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={14} /> Document Jobs
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setCustomModalOpen(true)
                  loadSavedReports()
                }}
                title="Create custom report projection"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Sliders size={14} /> Custom Builder
              </button>
            </div>
          }
        />

        {/* Hub Search Field */}
        <div className="w-full sm:max-w-md">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              className="input w-full pl-10 pr-9 h-11 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-2xs focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Find a report (e.g. fees, attendance, admissions, staff)..."
              value={hubSearch}
              onChange={(e) => setHubSearch(e.target.value)}
            />
            {hubSearch && (
              <button
                type="button"
                className="btn btn-ghost btn-sm absolute right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                onClick={() => setHubSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* The Eight Canonical Report Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredHubCards.map((g) => {
            const Icon = g.icon
            return (
              <div
                key={g.id}
                className="card card-interactive flex flex-col justify-between p-5 cursor-pointer border border-slate-200/80 dark:border-slate-800/80 rounded-2xl transition-all duration-200 hover:shadow-md hover:border-indigo-400/50 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs group"
                onClick={() => {
                  setActiveGroup(g.id)
                  setSubTab(g.subReports[0]?.id || '')
                  handleResetFilters()
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon size={20} />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {g.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed m-0">
                    {g.plainDescription}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open report</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>

        {filteredHubCards.length === 0 && (
          <div className="card mt-5">
            <EmptyState
              icon={<Search size={32} />}
              title="No report groups match your search"
              message={`No reports found matching "${hubSearch}". Try searching for "fees", "attendance", "admissions", or "staff".`}
              action={
                <button className="btn btn-outline" onClick={() => setHubSearch('')}>
                  Clear search
                </button>
              }
            />
          </div>
        )}

        {/* Modal: Custom Report Builder (Secondary Capability) */}
        {renderCustomBuilderModal()}
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 2: INDIVIDUAL REPORT PAGE (STRUCTURED FOR NON-TECHNICAL USERS)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-28">
      {/* Top Breadcrumb & Header */}
      <div className="mb-2">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setActiveGroup(null)
            handleResetFilters()
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', paddingLeft: 0 }}
        >
          <ArrowLeft size={14} /> Back to all reports
        </button>
      </div>

      <PageHead
        title={currentGroupConfig?.title || 'Report Details'}
        sub={currentGroupConfig?.plainDescription}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleExport('CSV')}
              disabled={exporting || loadingReport}
              title="Download CSV"
            >
              <Download size={13} style={{ marginRight: 4 }} /> CSV
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleExport('XLSX')}
              disabled={exporting || loadingReport}
              title="Download Excel"
            >
              <FileSpreadsheet size={13} style={{ marginRight: 4 }} /> Excel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleExport('PRINT')}
              disabled={exporting || loadingReport}
              title="Print / PDF View"
            >
              <Printer size={13} style={{ marginRight: 4 }} /> Print / PDF
            </button>
          </div>
        }
      />

      {/* Sub-Reports Switcher (If multiple canonical sub-views exist) */}
      {currentGroupConfig && currentGroupConfig.subReports.length > 1 && (
        <div className="overflow-x-auto pb-1 mt-3 mb-4">
          <Segmented
            options={currentGroupConfig.subReports.map((sr) => ({ key: sr.id, label: sr.label }))}
            value={subTab}
            onChange={(key) => {
              setSubTab(key)
              setPage(1)
            }}
          />
        </div>
      )}

      {/* Filter Control Surface */}
      <div
        className="card"
        style={{
          marginTop: currentGroupConfig && currentGroupConfig.subReports.length > 1 ? 0 : 16,
          marginBottom: 20,
          padding: 16,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Row 1: Search + Date Presets + Apply/Reset */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder={currentGroupConfig?.searchPlaceholder || 'Search records...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, height: 36, fontSize: 13 }}
            />
          </div>

          {/* Quick Date Presets (If supported) */}
          {currentGroupConfig?.supportsDate && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 2 }}>Period:</span>
              {(['all', 'today', 'yesterday', 'week', 'month', 'session', 'custom'] as DatePreset[]).map((p) => {
                const labels: Record<DatePreset, string> = {
                  all: 'All Time',
                  today: 'Today',
                  yesterday: 'Yesterday',
                  week: 'This Week',
                  month: 'This Month',
                  session: 'This Year',
                  custom: 'Custom',
                }
                const isActive = datePreset === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleDatePresetChange(p)}
                    className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: 12, height: 32, padding: '0 10px' }}
                  >
                    {labels[p]}
                  </button>
                )
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setPage(1)
                loadReportData()
              }}
              disabled={loadingReport || !!dateValidationError}
              style={{ height: 34, fontSize: 12 }}
            >
              <Filter size={13} style={{ marginRight: 4 }} /> Apply
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleResetFilters}
              disabled={loadingReport}
              style={{ height: 34, fontSize: 12, color: 'var(--text-muted)' }}
              title="Reset all filters"
            >
              <RotateCcw size={13} style={{ marginRight: 4 }} /> Reset
            </button>
          </div>
        </div>

        {/* Custom Date Range Row (Visible if custom selected) */}
        {datePreset === 'custom' && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle, #F1F5F9)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>From:</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                style={{ height: 32, fontSize: 12, width: 140 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>To:</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                style={{ height: 32, fontSize: 12, width: 140 }}
              />
            </div>
            {dateValidationError && (
              <span style={{ fontSize: 12, color: 'var(--urgent, #DC2626)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} /> {dateValidationError}
              </span>
            )}
          </div>
        )}

        {/* Secondary / Advanced Filters Toggle */}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ fontSize: 12, paddingLeft: 0, color: 'var(--primary, #4338CA)' }}
          >
            {showAdvancedFilters ? '− Hide filter options' : '+ More filter options (Branch, Classroom, Status)'}
          </button>
        </div>

        {/* Expandable Advanced Filters Box */}
        {showAdvancedFilters && (
          <div className="mt-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Branch Selector */}
            {currentGroupConfig?.supportsBranch && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Campus Branch
                </label>
                <select
                  className="input"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  style={{ height: 34, fontSize: 12, width: '100%' }}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Classroom Selector */}
            {currentGroupConfig?.supportsRoom && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Classroom
                </label>
                <select
                  className="input"
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  style={{ height: 34, fontSize: 12, width: '100%' }}
                >
                  <option value="">All Classrooms</option>
                  {classrooms
                    .filter((c) => !selectedBranch || c.branchId === selectedBranch)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Status Selector */}
            {currentGroupConfig?.statusOptions && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Record Status
                </label>
                <select
                  className="input"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ height: 34, fontSize: 12, width: '100%' }}
                >
                  <option value="">All Statuses</option>
                  {currentGroupConfig.statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Chips Summary */}
        {activeChips.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle, #F1F5F9)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Filters:
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'var(--surface-subtle, #F1F5F9)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                <span>{chip.label}:</span> <strong>{chip.value}</strong>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                  title={`Remove ${chip.label} filter`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Strip (If report provides summary metrics) */}
      {reportData?.summary && Object.keys(reportData.summary).length > 0 && (
        <div
          className="metric-strip"
          style={{
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {Object.entries(reportData.summary).map(([key, val]) => {
            const formattedLabel = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
            return (
              <div key={key} className="metric-cell" style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div className="metric-cell-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formattedLabel}</div>
                <div className="metric-cell-value" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                  {String(val)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main Table Workspace */}
      <div className="table-workspace">
        <div className="table-workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="table-workspace-title" style={{ fontSize: 15, fontWeight: 700 }}>
              {reportData?.title || 'Report Records'}
            </div>
            <div className="table-workspace-meta" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Freshness: {reportData?.freshness || 'REAL_TIME'} · Total records: <strong>{reportData?.total ?? 0}</strong>
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadReportData}
            disabled={loadingReport}
            style={{ fontSize: 12 }}
          >
            <RefreshCw size={12} className={loadingReport ? 'spin' : ''} style={{ marginRight: 4 }} /> Refresh
          </button>
        </div>

        {/* Error State */}
        {reportError ? (
          <div className="card" style={{ margin: 16 }}>
            <EmptyState
              icon={<AlertTriangle size={32} style={{ color: 'var(--urgent, #DC2626)' }} />}
              title="Unable to load report data"
              message={reportError}
              action={
                <button className="btn btn-outline" onClick={loadReportData}>
                  Try again
                </button>
              }
            />
          </div>
        ) : (
          /* Data Table */
          <DataTable
            columns={tableColumns}
            data={reportData?.data || []}
            loading={loadingReport}
            emptyIcon="reports"
            emptyTitle="No records found"
            emptyMessage="No operational records matched your filter criteria. Try adjusting dates or resetting filters."
          />
        )}

        {/* Pagination Bar */}
        {reportData && reportData.totalPages > 1 && (
          <div className="p-3 sm:px-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <div>
              Showing page <strong>{page}</strong> of <strong>{reportData.totalPages}</strong> ({reportData.total} total items)
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || loadingReport}
                style={{ fontSize: 12 }}
              >
                Previous
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(Math.min(reportData.totalPages, page + 1))}
                disabled={page >= reportData.totalPages || loadingReport}
                style={{ fontSize: 12 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Custom Report Builder (Secondary Capability) */}
      {renderCustomBuilderModal()}
    </div>
  )

  // ───────────────────────────────────────────────────────────────────────────
  // HELPER: RENDER CUSTOM REPORT BUILDER MODAL (FR-049 PRESERVED AS SECONDARY)
  // ───────────────────────────────────────────────────────────────────────────
  function renderCustomBuilderModal() {
    return (
      <Modal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="Custom Report Builder"
        subtitle="Create ad-hoc projections from verified domain models"
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
          {/* Controls */}
          <div>
            <Field label="1. Select Canonical Source">
              <select
                className="input"
                value={customSource}
                onChange={(e) => {
                  setCustomSource(e.target.value)
                  const src = customSources.find((s) => s.id === e.target.value)
                  if (src) setSelectedFields(src.fields.slice(0, 4))
                }}
              >
                {customSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 650, display: 'block', marginBottom: 8, color: 'var(--text)' }}>
                2. Projected Columns
              </label>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 10 }}>
                {customSources
                  .find((s) => s.id === customSource)
                  ?.fields.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        id={`cf-${f}`}
                        checked={selectedFields.includes(f)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, f])
                          } else {
                            setSelectedFields(selectedFields.filter((x) => x !== f))
                          }
                        }}
                      />
                      <label htmlFor={`cf-${f}`} style={{ fontSize: 12, cursor: 'pointer', color: 'var(--text)' }}>
                        {f}
                      </label>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Field label="3. Report Name">
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Active Student Summary"
                  value={customReportName}
                  onChange={(e) => setCustomReportName(e.target.value)}
                />
              </Field>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-outline"
                onClick={handlePreviewCustom}
                disabled={previewLoading || selectedFields.length === 0}
              >
                <Eye size={13} style={{ marginRight: 6 }} /> Preview 10 Rows
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveCustom}
                disabled={!customReportName.trim() || selectedFields.length === 0}
              >
                <Plus size={13} style={{ marginRight: 6 }} /> Save Custom Report
              </button>
            </div>
          </div>

          {/* Preview Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Live Preview (Max 10 Rows)</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Source: {customSource}</span>
            </div>

            {previewRows.length > 0 ? (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: 300 }}>
                <table className="table" style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {previewColumns.map((col) => (
                        <th key={col.key} style={{ padding: '6px 10px', background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border)' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        {previewColumns.map((col) => (
                          <td key={col.key} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                            {String(row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 30, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: 13 }}>
                Click "Preview 10 Rows" to inspect generated data projection.
              </div>
            )}

            {/* Saved Reports List */}
            {savedReports.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                  Saved Custom Reports ({savedReports.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                  {savedReports.map((sr) => (
                    <div
                      key={sr.id}
                      style={{
                        padding: '6px 10px',
                        background: 'var(--surface-subtle)',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      <span><strong>{sr.name}</strong> ({sr.source})</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sr.fields?.length || 0} fields</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    )
  }
}
