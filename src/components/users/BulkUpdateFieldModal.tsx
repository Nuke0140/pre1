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
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { getBulkEditableFields, BulkFieldConfig } from '@/lib/users/bulk-field-config'
import { BranchOption } from './types'

export interface BulkUpdateFieldModalProps {
  open: boolean
  onClose: () => void
  selectedUserIds?: string[]
  branches?: BranchOption[]
  userType?: 'STAFF' | 'FAMILY' | 'ALL'
  onSuccess?: () => void
}

type WizardStep = 'SELECT_FIELDS' | 'UPLOAD_CSV' | 'PREVIEW_CHANGES' | 'RESULTS'

export function BulkUpdateFieldModal({
  open,
  onClose,
  selectedUserIds = [],
  branches = [],
  userType = 'STAFF',
  onSuccess,
}: BulkUpdateFieldModalProps) {
  const toast = useToast()
  const availableFields = useMemo(() => getBulkEditableFields(), [])

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

  // Reset state on open
  useEffect(() => {
    if (open) {
      setStep('SELECT_FIELDS')
      setSelectedFile(null)
      setPreviewReport(null)
      setExecutionReport(null)
      setLoading(false)
      setDownloadingTemplate(false)
      setAuditReason('')
      if (selectedFieldKeys.length === 0) {
        setSelectedFieldKeys(['phone', 'email', 'address'])
      }
    }
  }, [open])

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
      toast.error('Network Error', err.message || 'Failed to execute bulk update.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    onClose()
    if (onSuccess) onSuccess()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={step === 'RESULTS' ? handleFinish : onClose}
      title="Dynamic Bulk User Field Update"
      subtitle="Select one or multiple fields, generate a dynamic CSV template, validate, preview changes, and update accounts."
      wide
    >
      <div className="space-y-5 text-xs">
        {/* Wizard Step Progress Tracker */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'SELECT_FIELDS' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
              }`}
            >
              1
            </span>
            <span className={`font-semibold ${step === 'SELECT_FIELDS' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
              Select Fields
            </span>
          </div>

          <div className="h-0.5 w-4 bg-gray-200 dark:bg-gray-800" />

          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'UPLOAD_CSV' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              }`}
            >
              2
            </span>
            <span className={`font-semibold ${step === 'UPLOAD_CSV' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
              Upload CSV
            </span>
          </div>

          <div className="h-0.5 w-4 bg-gray-200 dark:bg-gray-800" />

          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'PREVIEW_CHANGES' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              }`}
            >
              3
            </span>
            <span className={`font-semibold ${step === 'PREVIEW_CHANGES' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
              Preview & Confirm
            </span>
          </div>

          <div className="h-0.5 w-4 bg-gray-200 dark:bg-gray-800" />

          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'RESULTS' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
              }`}
            >
              4
            </span>
            <span className={`font-semibold ${step === 'RESULTS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
              Summary Results
            </span>
          </div>
        </div>

        {/* ── STEP 1: MULTI-FIELD SELECTION ── */}
        {step === 'SELECT_FIELDS' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-gray-900 dark:text-white block">
                  Select User Fields to Bulk Update
                </span>
                <span className="text-[11px] text-gray-500">
                  Select one or multiple fields. The generated CSV will dynamically include columns for only your selected fields.
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllFields}
                  className="btn btn-xs btn-outline hover:bg-purple-100"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllFields}
                  className="btn btn-xs btn-ghost text-gray-400 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {availableFields.map((field) => {
                const isSelected = selectedFieldKeys.includes(field.key)
                return (
                  <label
                    key={field.key}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 text-purple-950 dark:text-purple-100 shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleField(field.key)}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{field.label}</span>
                        {field.isUnique && (
                          <span className="badge b-amber text-[9px] font-mono shrink-0">UNIQUE</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                        {field.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Selection Counter Pill */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Selected:{' '}
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  {selectedFieldKeys.length} field(s)
                </span>
              </span>
              <span className="text-[11px] text-gray-400 italic">
                {selectedFieldKeys.length === 0
                  ? 'Please select at least 1 field'
                  : `Columns: username, ${selectedFieldKeys.join(', ')}`}
              </span>
            </div>
          </div>
        )}

        {/* ── STEP 2: UPLOAD FILLED CSV FILE ── */}
        {step === 'UPLOAD_CSV' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-bold block flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-blue-600" />
                Fill & Upload your CSV Template
              </span>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                1. Open your downloaded CSV template.
                <br />
                2. Enter new field values for the users you wish to update.
                <br />
                3. <strong className="text-blue-900 dark:text-blue-100">Empty cells mean DO NOT CHANGE THIS FIELD</strong>. Leave cells blank if you do not want to change existing values.
              </p>
            </div>

            {/* File Dropzone / Picker */}
            <div
              className={`p-6 rounded-xl border-2 border-dashed text-center space-y-3 cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-purple-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0])
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 mx-auto flex items-center justify-center">
                <Upload size={22} />
              </div>

              <div>
                <p className="font-bold text-gray-900 dark:text-white text-xs">
                  {selectedFile ? selectedFile.name : 'Click to select CSV File'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB • CSV File Ready`
                    : 'Select your populated .csv file from your computer'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: PREVIEW & VALIDATE CHANGES ── */}
        {step === 'PREVIEW_CHANGES' && previewReport && (
          <div className="space-y-4">
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-card">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">TOTAL ROWS</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {previewReport.totalRows}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block uppercase">VALID TO UPDATE</span>
                <span className="text-base font-bold text-emerald-600">{previewReport.validRowsCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold block uppercase">FAILED ERRORS</span>
                <span className="text-base font-bold text-rose-600">{previewReport.failedRowsCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/40">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">NO CHANGE</span>
                <span className="text-base font-bold text-gray-600">{previewReport.noChangeRowsCount}</span>
              </div>
            </div>

            {/* Validation Errors Breakdown */}
            {previewReport.failedRowsCount > 0 && (
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                  <ShieldAlert size={15} />
                  <span>{previewReport.failedRowsCount} row(s) failed validation and will be skipped</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
                  {previewReport.rows
                    .filter((r: any) => r.status === 'FAILED')
                    .map((r: any) => (
                      <div
                        key={r.rowIndex}
                        className="p-2 rounded border border-rose-200/70 dark:border-rose-900/40 bg-white/60 dark:bg-gray-900/60 flex items-center justify-between"
                      >
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                          Row {r.rowIndex}: {r.identifier}
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{r.error}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Change Preview Table */}
            <div className="space-y-2">
              <span className="font-bold text-gray-800 dark:text-gray-200 block text-xs">
                Proposed Field Changes Preview ({previewReport.validRowsCount} accounts):
              </span>

              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                {previewReport.rows
                  .filter((r: any) => r.status === 'VALID')
                  .map((r: any) => (
                    <div key={r.rowIndex} className="p-3 bg-card space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {r.userName} <span className="font-mono text-gray-400 font-normal">(@{r.identifier})</span>
                        </span>
                        <span className="badge b-purple text-[10px]">VALID FOR UPDATE</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        {r.fieldChanges
                          .filter((fc: any) => fc.status === 'CHANGE')
                          .map((fc: any) => (
                            <div
                              key={fc.fieldKey}
                              className="p-2 rounded border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between"
                            >
                              <span className="text-gray-500 font-medium">{fc.fieldLabel}:</span>
                              <div className="flex items-center gap-1 font-mono text-right">
                                <span className="text-gray-400 line-through">
                                  {fc.currentValue || '(empty)'}
                                </span>
                                <span>→</span>
                                <span className="font-bold text-purple-700 dark:text-purple-300">
                                  {String(fc.newValue)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Optional Audit Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Audit Log Reason / Reference Note <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="e.g. Q4 Staff Contact Directory Sync"
                className="input w-full text-xs"
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: FINAL EXECUTION RESULTS ── */}
        {step === 'RESULTS' && executionReport && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-1">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                Bulk User Field Update Completed
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Successfully updated <span className="font-bold">{executionReport.updatedCount}</span> user record(s).
              </p>
            </div>

            {/* Results breakdown list */}
            <div className="space-y-2">
              <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                Execution Item Results:
              </span>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {executionReport.results?.map((res: any) => (
                  <div
                    key={res.rowIndex || res.userId}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      res.status === 'SUCCESS'
                        ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {res.status === 'SUCCESS' ? (
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-rose-600 shrink-0" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {res.userName} <span className="font-mono text-gray-400 text-[11px]">(@{res.identifier})</span>
                      </span>
                    </div>

                    {res.status === 'SUCCESS' ? (
                      <span className="badge b-success text-[10px]">Updated</span>
                    ) : (
                      <span className="text-[11px] text-rose-600 font-semibold">{res.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Buttons Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          {step === 'SELECT_FIELDS' && (
            <>
              <button type="button" className="btn btn-secondary text-xs" onClick={onClose} disabled={downloadingTemplate}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs flex items-center gap-1.5 font-semibold"
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate || selectedFieldKeys.length === 0}
              >
                {downloadingTemplate ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>Download CSV Template ({selectedFieldKeys.length} fields) →</span>
              </button>
            </>
          )}

          {step === 'UPLOAD_CSV' && (
            <>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setStep('SELECT_FIELDS')}
                disabled={loading}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs flex items-center gap-1.5 font-semibold"
                onClick={handleValidateCsvFile}
                disabled={loading || !selectedFile}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                <span>Validate & Preview CSV →</span>
              </button>
            </>
          )}

          {step === 'PREVIEW_CHANGES' && (
            <>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setStep('UPLOAD_CSV')}
                disabled={loading}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs flex items-center gap-1.5 font-semibold"
                onClick={handleExecuteBulkUpdate}
                disabled={loading || (previewReport && previewReport.validRowsCount === 0)}
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Confirm Update ({previewReport?.validRowsCount || 0} Accounts)</span>
              </button>
            </>
          )}

          {step === 'RESULTS' && (
            <div className="w-full flex justify-end">
              <button type="button" className="btn btn-primary text-xs px-5 font-semibold" onClick={handleFinish}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
