'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  X,
  FileText,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/components/preone/Toast'
import { getBulkEditableFields, BulkFieldConfig } from '@/lib/users/bulk-field-config'
import { BranchOption } from './types'

export interface BulkUpdateFieldViewProps {
  selectedUserIds?: string[]
  branches?: BranchOption[]
  userType?: 'STAFF' | 'FAMILY' | 'ALL'
  onSuccess?: () => void
  onCancel?: () => void
}

type WizardStep = 'SELECT_FIELDS' | 'UPLOAD_CSV' | 'PREVIEW_CHANGES' | 'RESULTS'

export function BulkUpdateFieldView({
  selectedUserIds = [],
  branches = [],
  userType = 'STAFF',
  onSuccess,
  onCancel,
}: BulkUpdateFieldViewProps) {
  const toast = useToast()
  const availableFields = useMemo(() => getBulkEditableFields(userType), [userType])

  // Wizard Step State
  const [step, setStep] = useState<WizardStep>('SELECT_FIELDS')

  // Selected Checkboxes State
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([
    'phone',
    'email',
    'address',
  ])

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API State
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [previewReport, setPreviewReport] = useState<any>(null)
  const [executionReport, setExecutionReport] = useState<any>(null)
  const [auditReason, setAuditReason] = useState<string>('')

  // Checkbox Toggle Helpers
  const handleToggleField = (key: string) => {
    setSelectedFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSelectAllFields = () => {
    setSelectedFieldKeys(availableFields.map((f) => f.key))
  }

  const handleClearAllFields = () => {
    setSelectedFieldKeys([])
  }

  // 1. Download Dynamic CSV Template
  const handleDownloadTemplate = async () => {
    if (selectedFieldKeys.length === 0) {
      toast.error('Selection Required', 'Please select at least one field to generate a CSV template.')
      return
    }

    setDownloadingTemplate(true)
    try {
      const res = await fetch('/api/v1/users/bulk-update/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: selectedFieldKeys,
          userType,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || json.error || 'Failed to generate template')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `preone-user-bulk-update-template-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Template Downloaded', `Generated CSV template with ${selectedFieldKeys.length} selected field(s).`)
      setStep('UPLOAD_CSV')
    } catch (err: any) {
      toast.error('Template Download Error', err.message || 'Could not download template.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  // 2. Validate & Preview Uploaded CSV File
  const handleValidateCsvFile = async () => {
    if (!selectedFile) {
      toast.error('File Required', 'Please choose a filled CSV file to validate.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/v1/users/bulk-update/preview', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setPreviewReport(json.data || json)
        setStep('PREVIEW_CHANGES')
        toast.success(
          'CSV Parsed & Validated',
          `Parsed ${json.data?.totalRows || 0} row(s): ${json.data?.validRowsCount || 0} valid for update.`
        )
      } else {
        toast.error('Validation Error', json.error?.message || json.message || 'Failed to parse CSV file.')
      }
    } catch (err: any) {
      toast.error('Network Error', err.message || 'Server error during CSV validation.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Confirm & Execute Database Updates
  const handleExecuteBulkUpdate = async () => {
    if (!previewReport || !previewReport.rows) return

    setLoading(true)
    try {
      const res = await fetch('/api/v1/users/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXECUTE_CSV',
          rows: previewReport.rows,
          reason: auditReason.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setExecutionReport(json.data || json)
        setStep('RESULTS')
        toast.success(
          'Bulk Update Completed',
          `Successfully updated ${json.data?.updatedCount || 0} user record(s).`
        )
      } else {
        toast.error('Execution Failed', json.error?.message || json.message || 'Bulk update execution failed.')
      }
    } catch (err: any) {
      toast.error('Network Error', err.message || 'Server error during bulk execution.')
    } finally {
      setLoading(false)
    }
  }

  // Group fields by category / targetEntity
  const categories = useMemo(() => {
    const map = new Map<string, BulkFieldConfig[]>()
    for (const f of availableFields) {
      const cat =
        f.targetEntity === 'user'
          ? 'Identity & Account'
          : f.targetEntity === 'tenantUser'
          ? 'Campus & Access'
          : 'Profile Details'
      const existing = map.get(cat) || []
      existing.push(f)
      map.set(cat, existing)
    }
    return Array.from(map.entries())
  }, [availableFields])

  return (
    <div className="space-y-4">
      {/* Warning Callout */}
      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Caution: Bulk Update Workflow.</span> Changes applied here update multiple staff accounts simultaneously. Fields not explicitly included in your CSV template remain completely untouched. Audit logs record every modified row.
        </div>
      </div>

      {/* Wizard Progress Stepper */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 text-xs">
        {[
          { key: 'SELECT_FIELDS', label: '1. Select Fields' },
          { key: 'UPLOAD_CSV', label: '2. Upload CSV' },
          { key: 'PREVIEW_CHANGES', label: '3. Preview & Audit' },
          { key: 'RESULTS', label: '4. Summary' },
        ].map((s, idx) => {
          const isActive = step === s.key
          const isPassed =
            (step === 'UPLOAD_CSV' && idx < 1) ||
            (step === 'PREVIEW_CHANGES' && idx < 2) ||
            (step === 'RESULTS' && idx < 3)

          return (
            <div
              key={s.key}
              className={`flex items-center gap-2 font-medium ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : isPassed
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-2 ring-purple-600'
                    : isPassed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}
              >
                {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          )
        })}
      </div>

      {/* ── STEP 1: SELECT FIELDS & DOWNLOAD TEMPLATE ── */}
      {step === 'SELECT_FIELDS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Choose Fields to Update in Bulk
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select only the specific fields you need to update. A tailored template will be generated.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllFields}
                className="text-purple-600 hover:underline font-semibold"
              >
                Select All
              </button>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <button
                type="button"
                onClick={handleClearAllFields}
                className="text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
            {categories.map(([cat, fields], catIdx) => (
              <div
                key={cat || `category-${catIdx}`}
                className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-900/40 space-y-2"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {cat}
                </div>
                <div className="space-y-1.5">
                  {fields.map((f) => {
                    const checked = selectedFieldKeys.includes(f.key)
                    return (
                      <label
                        key={f.key}
                        className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                          checked
                            ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80 text-purple-950 dark:text-purple-200'
                            : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleField(f.key)}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{f.label}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {f.description}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs text-gray-500">
              <span className="font-bold text-purple-600">{selectedFieldKeys.length}</span> field(s) selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('UPLOAD_CSV')}
                className="btn btn-secondary text-xs px-3 py-1.5 font-medium"
              >
                Skip to Upload
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate || selectedFieldKeys.length === 0}
                className="btn btn-primary text-xs px-4 py-1.5 font-bold flex items-center gap-2"
              >
                {downloadingTemplate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Template...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: UPLOAD CSV ── */}
      {step === 'UPLOAD_CSV' && (
        <div className="space-y-4">
          <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
            <Upload className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Upload Filled CSV File
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              Upload the CSV file with your completed changes. The system requires an identifier column (<span className="font-mono">userId</span>, <span className="font-mono">email</span>, or <span className="font-mono">employeeCode</span>).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary text-xs px-4 py-2 font-bold"
            >
              {selectedFile ? 'Choose Different File' : 'Browse CSV File'}
            </button>
            {selectedFile && (
              <div className="mt-3 text-xs font-semibold text-purple-600 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setStep('SELECT_FIELDS')}
              className="btn btn-secondary text-xs px-3 py-1.5 font-medium"
            >
              Back to Field Selection
            </button>
            <button
              type="button"
              onClick={handleValidateCsvFile}
              disabled={loading || !selectedFile}
              className="btn btn-primary text-xs px-4 py-1.5 font-bold flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing & Validating...</span>
                </>
              ) : (
                <>
                  <span>Validate & Preview Changes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PREVIEW CHANGES & AUDIT REASON ── */}
      {step === 'PREVIEW_CHANGES' && previewReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80">
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {previewReport.totalRows || 0}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">Total Rows</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {previewReport.validRowsCount || 0}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">Valid for Update</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80">
              <div className="text-xl font-bold text-rose-700 dark:text-rose-300">
                {previewReport.errorRowsCount || 0}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">Blocked with Errors</div>
            </div>
          </div>

          {/* Rows Diff Table */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-[260px] overflow-y-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/80 sticky top-0 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-2.5 font-bold">Row</th>
                  <th className="p-2.5 font-bold">Identifier / User</th>
                  <th className="p-2.5 font-bold">Proposed Changes</th>
                  <th className="p-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {previewReport.rows?.map((r: any, idx: number) => (
                  <tr key={r.identifier ? `${r.identifier}-${idx}` : `row-${r.rowNumber || idx}`} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="p-2.5 font-mono text-[11px]">{r.rowNumber || idx + 1}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {r.userName || r.identifier}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{r.identifier}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="space-y-0.5">
                        {r.changes && Object.entries(r.changes).map(([k, v]: [string, any]) => (
                          <div key={k} className="text-[11px] flex items-center gap-1.5">
                            <span className="font-medium text-purple-600">{k}:</span>
                            <span className="line-through text-gray-400">{String(v.old ?? 'empty')}</span>
                            <span>→</span>
                            <span className="font-semibold text-emerald-600">{String(v.new)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-2.5">
                      {r.status === 'VALID' ? (
                        <span className="badge b-green text-[10px] px-1.5 py-0.5">Ready</span>
                      ) : (
                        <span className="badge b-red text-[10px] px-1.5 py-0.5" title={r.errors?.join(', ')}>
                          {r.errors?.[0] || 'Error'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Reason Input */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5 text-xs">
            <label className="font-bold text-gray-700 dark:text-gray-300">
              Audit Reason / Note (Recorded in System Audit Log)
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Annual faculty role reassignments, bulk phone verification"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setStep('UPLOAD_CSV')}
              className="btn btn-secondary text-xs px-3 py-1.5 font-medium"
            >
              Back to Upload
            </button>
            <button
              type="button"
              onClick={handleExecuteBulkUpdate}
              disabled={loading || previewReport.validRowsCount === 0}
              className="btn btn-primary text-xs px-4 py-1.5 font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Apply Bulk Updates</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: RESULTS ── */}
      {step === 'RESULTS' && executionReport && (
        <div className="space-y-4 text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            Bulk Update Completed
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Successfully applied changes to {executionReport.updatedCount || 0} user record(s). All modifications have been recorded in the school audit log.
          </p>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setStep('SELECT_FIELDS')
                setSelectedFile(null)
                setPreviewReport(null)
                setExecutionReport(null)
                onSuccess?.()
              }}
              className="btn btn-primary text-xs px-4 py-2 font-bold"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
