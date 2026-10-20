'use client'

import React, { useState, useRef } from 'react'
import {
  Upload, FileSpreadsheet, Download, AlertTriangle, AlertCircle,
  CheckCircle2, RefreshCw, X, ArrowLeft, ArrowRight, ShieldCheck,
  Check, Layers, HelpCircle, FileText
} from 'lucide-react'
import { useToast } from '@/components/preone/Toast'
import { SpreadsheetQuickGrid, GridColumn } from './SpreadsheetQuickGrid'
import { parseTabularContent } from '@/lib/importers/spreadsheet-parser'

export type ImportModule = 'CLASSROOMS' | 'STAFF' | 'FEES' | 'FAMILY'
export type DuplicatePolicy = 'SKIP' | 'UPDATE' | 'ERROR'

export interface SpreadsheetImportWorkspaceProps {
  module: ImportModule
  onSuccess?: () => void
  onCancel?: () => void
  embedded?: boolean
  initialOperation?: 'IMPORT' | 'EXPORT'
  exportContext?: {
    branchId?: string
    role?: string
    status?: string
    search?: string
    userType?: string
  }
}

const MODULE_CONFIG: Record<
  ImportModule,
  {
    title: string
    subtitle: string
    templateUrl: string
    templateFilename: string
    apiEndpoint: string
    columns: GridColumn[]
    entityLabel: string
  }
> = {
  CLASSROOMS: {
    title: 'Classrooms Bulk Spreadsheet Import',
    subtitle: 'Upload a CSV or paste spreadsheet rows to batch import and configure preschool classrooms.',
    templateUrl: '/api/v1/classrooms/csv',
    templateFilename: 'preone_classrooms_template.csv',
    apiEndpoint: '/api/v1/classrooms/csv',
    entityLabel: 'Classroom',
    columns: [
      { key: 'name', label: 'Classroom Name', required: true, placeholder: 'e.g. Nursery A', width: '180px' },
      { key: 'code', label: 'Code', required: true, placeholder: 'e.g. NUR-A', width: '110px' },
      {
        key: 'programType',
        label: 'Program Type',
        required: true,
        width: '140px',
        options: ['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE'],
      },
      { key: 'capacity', label: 'Capacity', placeholder: '20', width: '90px' },
      { key: 'branchCode', label: 'Branch Code', placeholder: 'MAIN', width: '110px' },
      { key: 'primaryTeacherEmail', label: 'Primary Teacher Email', placeholder: 'teacher@preschool.com', width: '180px' },
    ],
  },
  STAFF: {
    title: 'Staff Bulk Spreadsheet Import',
    subtitle: 'Upload a CSV or paste rows to batch register teachers, administrators, and campus personnel.',
    templateUrl: '/api/v1/users/csv?template=staff',
    templateFilename: 'preone_staff_template.csv',
    apiEndpoint: '/api/v1/users/csv',
    entityLabel: 'Staff Member',
    columns: [
      { key: 'fullName', label: 'Full Name', required: true, placeholder: 'e.g. Ananya Sharma', width: '180px' },
      { key: 'email', label: 'Email Address', required: true, placeholder: 'ananya@preschool.com', width: '180px' },
      { key: 'phone', label: 'Phone Number', placeholder: '+919876543210', width: '130px' },
      { key: 'username', label: 'Username', placeholder: 'ananya.sharma', width: '130px' },
      {
        key: 'role',
        label: 'Role',
        required: true,
        width: '140px',
        options: ['TEACHER', 'PRINCIPAL', 'COORDINATOR', 'STAFF', 'ACCOUNTS', 'RECEPTIONIST', 'DRIVER', 'ATTENDANT', 'OWNER'],
      },
      { key: 'branchCode', label: 'Campus Branch', placeholder: 'MAIN', width: '110px' },
      { key: 'classroomCode', label: 'Assigned Classroom', placeholder: 'e.g. NUR-A', width: '140px' },
      { key: 'employeeCode', label: 'Employee Code', placeholder: 'EMP-101', width: '110px' },
      { key: 'password', label: 'Initial Password', placeholder: 'Min 8 chars, 1 upper, 1 number', width: '160px' },
      {
        key: 'status',
        label: 'Account Status',
        width: '120px',
        options: ['ACTIVE', 'PENDING'],
      },
    ],
  },
  FEES: {
    title: 'Fees & Fee Heads Bulk Spreadsheet Import',
    subtitle: 'Upload or paste fee heads and tuition billing structures into the preschool master catalog.',
    templateUrl: '/api/v1/fees/csv',
    templateFilename: 'preone_fees_template.csv',
    apiEndpoint: '/api/v1/fees/csv',
    entityLabel: 'Fee Head',
    columns: [
      { key: 'feeHeadName', label: 'Fee Head Name', required: true, placeholder: 'e.g. Tuition Fee', width: '180px' },
      { key: 'feeCode', label: 'Fee Code', required: true, placeholder: 'e.g. TUITION', width: '110px' },
      {
        key: 'category',
        label: 'Category',
        required: true,
        width: '140px',
        options: [
          'TUITION',
          'ADMISSION',
          'TRANSPORT',
          'MEALS',
          'UNIFORM',
          'BOOKS',
          'ACTIVITIES',
          'DAYCARE',
          'REGISTRATION',
          'EXAMINATION',
          'ANNUAL',
          'FACILITY',
          'LATE_FEE',
          'DEPOSIT',
          'OTHER',
        ],
      },
      { key: 'amount', label: 'Amount (₹)', required: true, placeholder: '15000', width: '110px' },
      {
        key: 'frequency',
        label: 'Frequency',
        required: true,
        width: '130px',
        options: ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
      },
      {
        key: 'feeType',
        label: 'Fee Type',
        width: '140px',
        options: ['REGULAR', 'REFUNDABLE_DEPOSIT'],
      },
      { key: 'description', label: 'Description', placeholder: 'Quarterly billing', width: '180px' },
    ],
  },
  FAMILY: {
    title: 'Family & Guardians Bulk Spreadsheet Import',
    subtitle: 'Upload a CSV or paste rows to batch register parents, guardians, and student associations.',
    templateUrl: '/api/v1/users/csv?template=family',
    templateFilename: 'preone_family_template.csv',
    apiEndpoint: '/api/v1/users/csv',
    entityLabel: 'Family Member',
    columns: [
      { key: 'fullName', label: 'Caregiver Full Name', required: true, placeholder: 'e.g. Rajesh Kumar', width: '180px' },
      { key: 'email', label: 'Email Address', required: true, placeholder: 'rajesh@example.com', width: '180px' },
      { key: 'phone', label: 'Phone Number', required: true, placeholder: '+919876543210', width: '140px' },
      {
        key: 'role',
        label: 'Role',
        required: true,
        width: '130px',
        options: ['PARENT', 'GUARDIAN'],
      },
      {
        key: 'relationship',
        label: 'Relationship to Child',
        width: '140px',
        options: ['FATHER', 'MOTHER', 'GUARDIAN', 'GRANDPARENT', 'SIBLING', 'OTHER'],
      },
      { key: 'studentAdmissionNo', label: 'Student Admission No', placeholder: 'e.g. PRE-2026-001', width: '160px' },
      {
        key: 'isPrimaryContact',
        label: 'Primary Contact',
        width: '120px',
        options: ['YES', 'NO'],
      },
      {
        key: 'canPickup',
        label: 'Authorized Pickup',
        width: '130px',
        options: ['YES', 'NO'],
      },
      {
        key: 'receivesComm',
        label: 'Receives Communications',
        width: '140px',
        options: ['YES', 'NO'],
      },
      {
        key: 'isFeePayer',
        label: 'Fee Payer',
        width: '110px',
        options: ['YES', 'NO'],
      },
      { key: 'occupation', label: 'Occupation', placeholder: 'e.g. Software Engineer', width: '160px' },
      { key: 'pickupPin', label: 'Pickup Gate PIN', placeholder: 'e.g. 1234', width: '120px' },
    ],
  },
}

export function SpreadsheetImportWorkspace({
  module,
  onSuccess,
  onCancel,
  embedded = false,
  initialOperation = 'IMPORT',
  exportContext,
}: SpreadsheetImportWorkspaceProps) {
  const toast = useToast()
  const cfg = MODULE_CONFIG[module]

  const [operation, setOperation] = useState<'IMPORT' | 'EXPORT'>(initialOperation)
  const [exporting, setExporting] = useState(false)
  const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'RESULT'>('INPUT')
  const [inputMode, setInputMode] = useState<'FILE' | 'GRID'>('GRID')
  const [duplicatePolicy, setDuplicatePolicy] = useState<DuplicatePolicy>('SKIP')
  const [atomicAllOrNothing, setAtomicAllOrNothing] = useState(false)

  // File Upload State
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Quick Grid State
  const [gridRows, setGridRows] = useState<Record<string, string>[]>([])

  // Preview & Result State
  const [validating, setValidating] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'BLOCKED'>('ALL')

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    loadFile(f)
  }

  const loadFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv') && f.type !== 'text/csv' && !f.type.includes('csv')) {
      toast.error('Invalid File Format', 'Please upload a standard .csv spreadsheet file')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File Exceeds Limit', 'Maximum allowed file size is 5 MB')
      return
    }

    setFile(f)
    const reader = new FileReader()
    reader.onload = (event) => {
      setFileContent((event.target?.result as string) || '')
    }
    reader.readAsText(f)
  }

  const handleDownloadTemplate = () => {
    window.location.href = cfg.templateUrl
  }

  // Trigger server-authoritative validation
  const handleValidate = async () => {
    let payloadRows: Record<string, string>[] = []
    let payloadCsv: string | undefined = undefined

    if (inputMode === 'FILE') {
      if (!fileContent.trim()) {
        toast.error('File Empty', 'Please select a valid CSV file before previewing.')
        return
      }
      payloadCsv = fileContent
    } else {
      // In GRID mode, filter out completely blank rows
      payloadRows = gridRows.filter((r) => Object.values(r).some((v) => v.trim() !== ''))
      if (payloadRows.length === 0) {
        toast.error('Empty Grid', 'Please enter or paste at least one row in the grid.')
        return
      }
    }

    setValidating(true)
    try {
      const res = await fetch(cfg.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          type: module === 'FAMILY' ? 'FAMILY' : module === 'STAFF' ? 'STAFF' : undefined,
          csv: payloadCsv,
          rows: payloadRows.length > 0 ? payloadRows : undefined,
          duplicatePolicy,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || json.error || json.message || 'Validation failed')
      }

      setPreviewData(json.data || json)
      setStep('PREVIEW')
    } catch (err: any) {
      toast.error('Validation Error', err.message || 'Could not validate data on server')
    } finally {
      setValidating(false)
    }
  }

  // Execute import
  const handleExecute = async () => {
    if (!previewData || !previewData.rows) return

    setExecuting(true)
    try {
      const res = await fetch(cfg.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          type: module === 'FAMILY' ? 'FAMILY' : module === 'STAFF' ? 'STAFF' : undefined,
          previewRows: previewData.rows,
          duplicatePolicy,
          atomic: atomicAllOrNothing,
          async: false,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error?.message || json.error || json.message || 'Import execution failed')
      }

      const result = json.data || json
      setImportResult(result)
      setStep('RESULT')
      toast.success(
        'Import Completed',
        `Successfully processed ${result.total || previewData.rows.length} records.`
      )
      onSuccess?.()
    } catch (err: any) {
      toast.error('Import Failed', err.message || 'An error occurred during import')
    } finally {
      setExecuting(false)
    }
  }

  const handleDownloadErrorReport = () => {
    if (!importResult?.errors || importResult.errors.length === 0) return
    const errorLines = [
      'rowNumber,identifier,errorMessage',
      ...importResult.errors.map(
        (e: any) => `${e.rowNumber},"${String(e.identifier || '').replace(/"/g, '""')}","${String(e.message || '').replace(/"/g, '""')}"`
      ),
    ]
    const blob = new Blob([errorLines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${module.toLowerCase()}_import_errors.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const resetAll = () => {
    setStep('INPUT')
    setFile(null)
    setFileContent('')
    setGridRows([])
    setPreviewData(null)
    setImportResult(null)
    setFilterTab('ALL')
  }

  const handleTriggerExport = () => {
    setExporting(true)
    const userType = module === 'FAMILY' ? (exportContext?.userType || 'PARENT') : 'STAFF'
    const params = new URLSearchParams()
    params.set('userType', userType)
    if (exportContext?.role && exportContext.role !== 'ALL') params.set('role', exportContext.role)
    if (exportContext?.branchId && exportContext.branchId !== 'ALL') params.set('branchId', exportContext.branchId)
    if (exportContext?.status && exportContext.status !== 'ALL') params.set('status', exportContext.status)
    if (exportContext?.search && exportContext.search.trim()) params.set('q', exportContext.search.trim())

    const url = `/api/v1/users/export?${params.toString()}`
    const filename = `${module.toLowerCase()}_directory_export.csv`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()

    setTimeout(() => {
      setExporting(false)
      toast.success('Export Complete', 'Directory export CSV downloaded successfully.')
    }, 800)
  }

  return (
    <div className={`space-y-4 ${embedded ? '' : 'p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-card shadow-xs'}`}>
      {/* Top Workspace Bar: Segmented Operation Control (Import vs Export) */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap">
        <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1 border border-gray-200/50 dark:border-gray-700/50">
          <button
            type="button"
            onClick={() => setOperation('IMPORT')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              operation === 'IMPORT'
                ? 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Data</span>
          </button>
          <button
            type="button"
            onClick={() => setOperation('EXPORT')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              operation === 'EXPORT'
                ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Workspace</span>
          </button>
        )}
      </div>

      {/* EXPORT WORKSPACE VIEW */}
      {operation === 'EXPORT' && (
        <div className="space-y-5 p-2 sm:p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {module === 'FAMILY'
                    ? 'Family & Guardians Directory Export'
                    : module === 'STAFF'
                    ? 'Staff & Personnel Directory Export'
                    : `${cfg.title} Export`}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Download a clean, structured CSV spreadsheet reflecting your current directory filters and RBAC permissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Applied Directory Scope</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-800">
                  <span className="text-gray-500">Target Persona:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {module === 'FAMILY' ? 'Family & Guardians' : module === 'STAFF' ? 'Staff Workforce' : module}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-800">
                  <span className="text-gray-500">Campus Branch:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {exportContext?.branchId ? exportContext.branchId : 'All Campuses (Institution-wide)'}
                  </span>
                </div>
                {exportContext?.role && (
                  <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-800">
                    <span className="text-gray-500">Role Filter:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{exportContext.role}</span>
                  </div>
                )}
                {exportContext?.status && (
                  <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-800">
                    <span className="text-gray-500">Status Filter:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{exportContext.status}</span>
                  </div>
                )}
                {exportContext?.search && (
                  <div className="flex justify-between py-1 border-b border-gray-200/60 dark:border-gray-800">
                    <span className="text-gray-500">Search Query:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">"{exportContext.search}"</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Security & Privacy Controls</span>
              </h4>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Spreadsheet Formula Injection Defense:</strong> Cells beginning with <code className="text-[11px] bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">= + - @ \t \r</code> are escaped with single quotes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Data Minimization:</strong> Passwords, password hashes, pickup PINs, and sensitive auth tokens are strictly excluded.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Audit Trail:</strong> Export requests are authorized and recorded in the audit ledger.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={exporting}
              onClick={handleTriggerExport}
              className="btn btn-primary text-xs py-2 px-5 flex items-center gap-2 font-semibold shadow-xs"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Directory CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* IMPORT WORKSPACE VIEW */}
      {operation === 'IMPORT' && (
        <>
          {/* Workspace Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800/80 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {cfg.title}
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                {cfg.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                title="Download clean CSV template with headers and example rows"
              >
                <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Download Template (CSV)</span>
              </button>
            </div>
          </div>

      {/* ========================================================================= */}
      {/* STEP 1: INPUT WORKSPACE                                                   */}
      {/* ========================================================================= */}
      {step === 'INPUT' && (
        <div className="space-y-4">
          {/* Top Options Bar: Option A vs Option B Toggle */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="seg text-xs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'GRID'}
                onClick={() => setInputMode('GRID')}
                className={`flex items-center gap-1.5 ${inputMode === 'GRID' ? 'on' : ''}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Option B: Copy & Paste Grid</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'FILE'}
                onClick={() => setInputMode('FILE')}
                className={`flex items-center gap-1.5 ${inputMode === 'FILE' ? 'on' : ''}`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Option A: Upload File</span>
              </button>
            </div>

            {/* Duplicate Policy Config */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Duplicate Policy:</span>
              <select
                value={duplicatePolicy}
                onChange={(e) => setDuplicatePolicy(e.target.value as DuplicatePolicy)}
                className="select py-1 px-2.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-800 bg-card text-gray-900 dark:text-gray-100"
              >
                <option value="SKIP">Skip Existing Records</option>
                <option value="UPDATE">Update Existing Records</option>
                <option value="ERROR">Report Conflict / Block</option>
              </select>
            </div>
          </div>

          {/* Mode 1: Interactive Copy-Paste Grid */}
          {inputMode === 'GRID' && (
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              <SpreadsheetQuickGrid
                columns={cfg.columns}
                onChange={(rows) => setGridRows(rows)}
                disabled={validating}
              />
            </div>
          )}

          {/* Mode 2: Drag & Drop File Upload */}
          {inputMode === 'FILE' && (
            <div>
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) loadFile(f)
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    isDragging
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-200'
                      : 'border-gray-200 dark:border-gray-800 hover:border-purple-400 bg-gray-50/40 dark:bg-gray-950/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Select or Drop your {cfg.entityLabel} CSV File
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepts standard RFC-4180 .csv files up to 5 MB
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <label className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5 font-semibold py-2 px-4 shadow-xs">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Browse Computer</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mt-0.5">
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>Ready for validation</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="btn btn-secondary text-xs cursor-pointer">
                      <span>Replace</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setFileContent('')
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supported Schema Reference Box */}
          <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1.5">
              <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Supported Schema Columns:</span>
                <span className="text-[11px] text-gray-400 font-normal">(* required)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cfg.columns.map((c) => (
                  <span
                    key={c.key}
                    className={`badge text-[11px] font-mono ${
                      c.required ? 'b-primary' : 'b-neutral'
                    }`}
                  >
                    {c.key} {c.required ? '*' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400 select-none">
                <input
                  type="checkbox"
                  checked={atomicAllOrNothing}
                  onChange={(e) => setAtomicAllOrNothing(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Atomic mode (Roll back entire batch if any single row fails)</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleValidate}
              disabled={validating}
              className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-4 font-semibold shadow-xs"
            >
              {validating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating Data...</span>
                </>
              ) : (
                <>
                  <span>Validate & Preview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PREVIEW & REVIEW WORKSPACE                                        */}
      {/* ========================================================================= */}
      {step === 'PREVIEW' && previewData && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-card">
              <div className="text-gray-500 font-medium">Total Rows</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {previewData.totalRows}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div className="text-emerald-700 dark:text-emerald-400 font-medium">Ready to Import</div>
              <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                {previewData.validRows}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
              <div className="text-amber-700 dark:text-amber-400 font-medium">Warnings / Duplicates</div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">
                {previewData.warningRows}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20">
              <div className="text-red-700 dark:text-red-400 font-medium">Needs Correction</div>
              <div className="text-xl font-bold text-red-800 dark:text-red-300 mt-0.5">
                {previewData.blockedRows}
              </div>
            </div>
          </div>

          {/* Filter Sub-Tabs */}
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-1">
              {(['ALL', 'VALID', 'WARNING', 'BLOCKED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterTab === tab
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 font-semibold'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab === 'ALL'
                    ? `All (${previewData.totalRows})`
                    : tab === 'VALID'
                    ? `Ready (${previewData.validRows})`
                    : tab === 'WARNING'
                    ? `Warnings (${previewData.warningRows})`
                    : `Errors (${previewData.blockedRows})`}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-gray-500">
              Duplicate policy: <strong>{duplicatePolicy}</strong>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-card shadow-xs">
            <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center font-mono text-[11px] text-gray-400">#</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">Action</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">Identifier / Name</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">Details</th>
                    <th className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">Issues / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 bg-white dark:bg-card">
                  {previewData.rows
                    .filter((r: any) => {
                      if (filterTab === 'VALID') return r.status === 'VALID'
                      if (filterTab === 'WARNING') return r.status === 'WARNING'
                      if (filterTab === 'BLOCKED') return r.status === 'BLOCKED'
                      return true
                    })
                    .map((row: any) => {
                      return (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors ${
                            row.status === 'BLOCKED' ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-gray-400">
                            {row.rowNumber}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {row.status === 'VALID' && (
                              <span className="badge b-primary text-[10px] font-semibold">
                                Ready to Import
                              </span>
                            )}
                            {row.status === 'WARNING' && (
                              <span className="badge b-amber text-[10px] font-semibold">
                                Warning / Exists
                              </span>
                            )}
                            {row.status === 'BLOCKED' && (
                              <span className="badge text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                Needs Correction
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-mono text-[11px] uppercase font-bold text-gray-700 dark:text-gray-300">
                              {row.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {row.name}
                            </div>
                            <div className="font-mono text-[11px] text-gray-400">
                              {row.identifier}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                            {row.details || row.role || row.category || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.errors?.length > 0 && (
                              <div className="text-red-600 dark:text-red-400 space-y-0.5">
                                {row.errors.map((err: string, eIdx: number) => (
                                  <div key={eIdx} className="flex items-center gap-1 text-[11px]">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>{err}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {row.warnings?.length > 0 && (
                              <div className="text-amber-600 dark:text-amber-400 space-y-0.5 mt-0.5">
                                {row.warnings.map((warn: string, wIdx: number) => (
                                  <div key={wIdx} className="flex items-center gap-1 text-[11px]">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{warn}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {row.errors?.length === 0 && row.warnings?.length === 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>All validations passed</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview Navigation Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep('INPUT')}
              className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit Grid</span>
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={executing || (previewData.validRows === 0 && previewData.warningRows === 0)}
              className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-4 font-semibold shadow-xs"
            >
              {executing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Records...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Confirm & Import (
                    {previewData.validRows + previewData.warningRows} records)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: RESULT SUMMARY                                                    */}
      {/* ========================================================================= */}
      {step === 'RESULT' && importResult && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Spreadsheet Import Finished
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your data has been processed safely using authoritative server validation.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {importResult.createdCount || 0}
                </div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  Created
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.updatedCount || 0}
                </div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  Updated
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {importResult.skippedCount || 0}
                </div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  Skipped
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failedCount || importResult.errors?.length || 0}
                </div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  Failed
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {importResult.errors?.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report (CSV)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="btn btn-secondary text-xs py-1.5 px-3"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={() => {
                  onSuccess?.()
                  if (onCancel) onCancel()
                }}
                className="btn btn-primary text-xs py-1.5 px-4 font-semibold shadow-xs"
              >
                Done & View Records
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
