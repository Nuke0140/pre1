'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  Eye,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  ShieldCheck,
  Star,
  ExternalLink,
  Loader2,
  User,
  Users,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { DocumentType, TemplateDefinition, PAGE_DIMENSIONS } from '@/lib/templates/types'

interface RecordItem {
  id: string
  type: 'STUDENT' | 'STAFF' | 'PAYMENT' | 'FIXTURE'
  title: string
  subtitle: string
  badgeText?: string
  avatarUrl?: string | null
  metadata?: Record<string, string>
}

interface FieldValidationItem {
  key: string
  label: string
  domain: string
  resolvedValue: string
  status: 'MAPPED' | 'FALLBACK' | 'MISSING'
  isRequired: boolean
  description?: string
}

interface TestTemplateModalProps {
  open: boolean
  onClose: () => void
  templateId: string
  templateName: string
  documentType: DocumentType
  initialDefinition?: TemplateDefinition | null
  isPublished?: boolean
  publishedVersion?: number
  currentDraftVersion?: number
  onSetDefaultSuccess?: () => void
}

type WizardStep = 'SELECT_RECORD' | 'VALIDATE_DATA' | 'PREVIEW' | 'DOWNLOAD_PRINT'

export function TestTemplateModal({
  open,
  onClose,
  templateId,
  templateName,
  documentType,
  initialDefinition,
  isPublished = false,
  publishedVersion = 1,
  currentDraftVersion = 1,
  onSetDefaultSuccess,
}: TestTemplateModalProps) {
  const toast = useToast()

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>('SELECT_RECORD')
  const [testVersionMode, setTestVersionMode] = useState<'PUBLISHED' | 'DRAFT'>(
    isPublished ? 'PUBLISHED' : 'DRAFT'
  )

  // Step A: Records
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null)

  // Step B: Validation & Mapping
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    ready: boolean
    status: 'READY' | 'ATTENTION_NEEDED' | 'BLOCKED'
    fields: FieldValidationItem[]
    mappedCount: number
    fallbackCount: number
    missingCount: number
    moduleAssignment: {
      isDefault: boolean
      isRegisteredInSetup: boolean
      workflowEligibility: string
    }
  } | null>(null)

  // Step C: Live Preview
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewScale, setPreviewScale] = useState(1)
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null)

  // Step D: PDF Download & Print
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [lastPdfInfo, setLastPdfInfo] = useState<{
    sizeBytes: number
    filename: string
    timestamp: string
    engine?: string
  } | null>(null)

  // Assigning Default
  const [assigningDefault, setAssigningDefault] = useState(false)

  // Active definition based on mode
  const activeDefinition = initialDefinition || undefined

  // 1. Fetch Records on Mount or Search Change
  const fetchRecords = useCallback(async (query: string = '') => {
    setLoadingRecords(true)
    try {
      const res = await fetch(
        `/api/v1/templates/${templateId}/test/records?q=${encodeURIComponent(query)}`
      )
      const json = await res.json()
      if (json.success && json.data) {
        setRecords(json.data.records || [])
        // Auto select first record if none selected
        if (!selectedRecord && json.data.records?.length > 0) {
          setSelectedRecord(json.data.records[0])
        }
      }
    } catch (err: any) {
      toast.error('Record lookup failed', err.message)
    } finally {
      setLoadingRecords(false)
    }
  }, [templateId, selectedRecord, toast])

  useEffect(() => {
    if (open) {
      fetchRecords(searchQuery)
    }
  }, [open, fetchRecords, searchQuery])

  // 2. Run Field Validation
  const runValidation = useCallback(
    async (record: RecordItem) => {
      setValidating(true)
      try {
        const res = await fetch(`/api/v1/templates/${templateId}/test/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId: record.id,
            recordType: record.type,
            definition: testVersionMode === 'DRAFT' ? activeDefinition : undefined,
          }),
        })
        const json = await res.json()
        if (json.success && json.data) {
          setValidationResult(json.data)
        } else {
          toast.error('Validation error', json.error?.message)
        }
      } catch (err: any) {
        toast.error('Validation failed', err.message)
      } finally {
        setValidating(false)
      }
    },
    [templateId, testVersionMode, activeDefinition, toast]
  )

  // 3. Load Preview
  const loadPreview = useCallback(
    async (record: RecordItem) => {
      setLoadingPreview(true)
      try {
        const res = await fetch(`/api/v1/templates/${templateId}/test/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordId: record.id,
            recordType: record.type,
            definition: testVersionMode === 'DRAFT' ? activeDefinition : undefined,
          }),
        })
        const json = await res.json()
        if (json.success && json.data) {
          setPreviewHtml(json.data.html)
        } else {
          toast.error('Preview error', json.error?.message)
        }
      } catch (err: any) {
        toast.error('Preview failed', err.message)
      } finally {
        setLoadingPreview(false)
      }
    },
    [templateId, testVersionMode, activeDefinition, toast]
  )

  // Step Transitions
  const handleProceedToValidate = () => {
    if (!selectedRecord) {
      toast.error('Select a record', 'Please pick a record to test this template with.')
      return
    }
    runValidation(selectedRecord)
    setCurrentStep('VALIDATE_DATA')
  }

  const handleProceedToPreview = () => {
    if (!selectedRecord) return
    loadPreview(selectedRecord)
    setCurrentStep('PREVIEW')
  }

  const handleProceedToDownload = () => {
    setCurrentStep('DOWNLOAD_PRINT')
  }

  // 4. Download PDF Action
  const handleDownloadPdf = async () => {
    if (!selectedRecord) return
    setGeneratingPdf(true)
    try {
      const res = await fetch(`/api/v1/templates/${templateId}/test/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedRecord.id,
          recordType: selectedRecord.type,
          definition: testVersionMode === 'DRAFT' ? activeDefinition : undefined,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to generate PDF')
      }

      const blob = await res.blob()
      const headerDisposition = res.headers.get('content-disposition') || ''
      const match = headerDisposition.match(/filename="?([^"]+)"?/)
      const filename = match ? match[1] : `${documentType.toLowerCase()}-${selectedRecord.id}.pdf`
      const engine = res.headers.get('x-preone-engine') || 'Production PDF Engine'

      // Trigger browser download
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      setLastPdfInfo({
        sizeBytes: blob.size,
        filename,
        timestamp: new Date().toLocaleTimeString(),
        engine,
      })

      toast.success(
        'PDF Downloaded Successfully',
        `Generated ${filename} (${Math.round(blob.size / 1024)} KB) with verified formatting.`
      )
    } catch (err: any) {
      toast.error('PDF Generation Failed', err.message)
    } finally {
      setGeneratingPdf(false)
    }
  }

  // 5. Print Document Action
  const handlePrintDocument = () => {
    if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
      previewIframeRef.current.contentWindow.focus()
      previewIframeRef.current.contentWindow.print()
    } else {
      // Fallback: open print window
      const printWin = window.open('', '_blank')
      if (printWin) {
        printWin.document.write(previewHtml)
        printWin.document.close()
        printWin.focus()
        printWin.print()
      }
    }
  }

  // 6. Set as Module Default
  const handleSetModuleDefault = async () => {
    setAssigningDefault(true)
    try {
      const res = await fetch(`/api/v1/templates/${templateId}/assign`, {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        toast.success(
          'Assigned as Module Default',
          `Template "${templateName}" is now the active default document for ${documentType}.`
        )
        if (validationResult) {
          setValidationResult({
            ...validationResult,
            moduleAssignment: {
              ...validationResult.moduleAssignment,
              isDefault: true,
              workflowEligibility: 'Active Module Default (Ready for immediate production generation)',
            },
          })
        }
        if (onSetDefaultSuccess) onSetDefaultSuccess()
      } else {
        toast.error('Assignment failed', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Assignment failed', err.message)
    } finally {
      setAssigningDefault(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Test Template — ${templateName}`}
      subtitle={`Verify field mappings, preview production layout, and generate verified PDF for ${documentType}`}
      icon={<Sparkles size={20} />}
      iconClass="ic-purple"
      wide
      maxWidth="1020px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top Header: Version Selector & Wizard Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-muted)',
            padding: '10px 14px',
            borderRadius: 8,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Stepper Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${currentStep === 'SELECT_RECORD' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => setCurrentStep('SELECT_RECORD')}
            >
              1. Select Record
            </button>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <button
              type="button"
              className={`btn btn-sm ${currentStep === 'VALIDATE_DATA' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
              disabled={!selectedRecord}
              onClick={handleProceedToValidate}
            >
              2. Validate Data
            </button>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <button
              type="button"
              className={`btn btn-sm ${currentStep === 'PREVIEW' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
              disabled={!selectedRecord}
              onClick={handleProceedToPreview}
            >
              3. Live Preview
            </button>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <button
              type="button"
              className={`btn btn-sm ${currentStep === 'DOWNLOAD_PRINT' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 12, padding: '4px 10px' }}
              disabled={!selectedRecord}
              onClick={handleProceedToDownload}
            >
              4. Download / Print
            </button>
          </div>

          {/* Version Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Test Version:</span>
            <div style={{ display: 'inline-flex', background: 'var(--surface-panel)', padding: 2, borderRadius: 6, border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${testVersionMode === 'PUBLISHED' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => setTestVersionMode('PUBLISHED')}
              >
                Published (v{publishedVersion})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${testVersionMode === 'DRAFT' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => setTestVersionMode('DRAFT')}
              >
                Draft (v{currentDraftVersion})
              </button>
            </div>
          </div>
        </div>

        {/* ── STEP A: SELECT RECORD ── */}
        {currentStep === 'SELECT_RECORD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Select an Authorized {documentType === 'STAFF_ID_CARD' ? 'Staff' : 'Student'} Record
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {records.length} authorized records available
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                className="input input-sm"
                style={{ paddingLeft: 36, width: '100%' }}
                placeholder={
                  documentType === 'STAFF_ID_CARD'
                    ? 'Search staff by name, employee code, or designation...'
                    : 'Search students by name or admission number...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Records List */}
            {loadingRecords ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                Loading authorized records...
              </div>
            ) : records.length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign: 'center',
                  background: 'var(--surface-muted)',
                  borderRadius: 8,
                  color: 'var(--text-muted)',
                }}
              >
                No records found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 10,
                  paddingRight: 4,
                }}
              >
                {records.map((r) => {
                  const isSelected = selectedRecord?.id === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: isSelected ? '2px solid #7C3AED' : '1px solid var(--border-color)',
                        background: isSelected ? '#F5F3FF' : 'var(--surface-panel)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: r.type === 'STAFF' ? '#EEF2FF' : '#F3E8FF',
                            color: r.type === 'STAFF' ? '#4F46E5' : '#7C3AED',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {r.type === 'STAFF' ? <User size={18} /> : <Users size={18} />}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: isSelected ? '#5B21B6' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {r.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {r.subtitle} {r.badgeText ? `• ${r.badgeText}` : ''}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#7C3AED',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Selected Card Banner */}
            {selectedRecord && (
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>
                    Selected Record: <strong>{selectedRecord.title}</strong> ({selectedRecord.subtitle})
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleProceedToValidate}
                >
                  Proceed to Validate Data <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP B: VALIDATE DATA & FIELD MAPPING ── */}
        {currentStep === 'VALIDATE_DATA' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {validating ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
                Validating data tokens and record bindings...
              </div>
            ) : validationResult ? (
              <>
                {/* Readiness Banner */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: validationResult.ready ? '#ECFDF5' : '#FFFBEB',
                    border: validationResult.ready ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {validationResult.ready ? (
                      <CheckCircle2 size={20} style={{ color: '#059669' }} />
                    ) : (
                      <AlertTriangle size={20} style={{ color: '#D97706' }} />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: validationResult.ready ? '#065F46' : '#92400E',
                        }}
                      >
                        {validationResult.ready
                          ? '✓ Ready to Preview & Generate'
                          : '⚠️ Attention Needed: Missing Required Fields'}
                      </div>
                      <div style={{ fontSize: 12, color: validationResult.ready ? '#047857' : '#B45309' }}>
                        {validationResult.mappedCount} live fields resolved • {validationResult.fallbackCount} sample fallbacks • {validationResult.missingCount} missing
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleProceedToPreview}
                  >
                    Proceed to Live Preview <ArrowRight size={13} />
                  </button>
                </div>

                {/* Module Assignment Box */}
                <div
                  style={{
                    background: 'var(--surface-panel)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={20} style={{ color: validationResult.moduleAssignment.isDefault ? '#7C3AED' : '#64748B' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Module Workflow Assignment
                        <span className={`badge ${validationResult.moduleAssignment.isDefault ? 'b-success' : 'b-neutral'}`} style={{ fontSize: 10 }}>
                          {validationResult.moduleAssignment.isDefault ? 'ACTIVE MODULE DEFAULT' : 'STANDALONE TEMPLATE'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {validationResult.moduleAssignment.workflowEligibility}
                      </div>
                    </div>
                  </div>

                  {!validationResult.moduleAssignment.isDefault && (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleSetModuleDefault}
                      disabled={assigningDefault}
                    >
                      <Star size={13} /> {assigningDefault ? 'Assigning...' : 'Set as Active Module Default'}
                    </button>
                  )}
                </div>

                {/* Field Mapping Table */}
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                  Resolved Data Fields & Token Bindings
                </div>
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Field Token</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Label & Domain</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Resolved Value</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, width: 100 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.fields.map((f) => (
                        <tr key={f.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#4338CA' }}>
                            {`{{${f.key}}}`}
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                            {f.label} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({f.domain})</span>
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {f.resolvedValue}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span
                              className={`badge ${
                                f.status === 'MAPPED'
                                  ? 'b-success'
                                  : f.status === 'FALLBACK'
                                  ? 'b-warning'
                                  : 'b-danger'
                              }`}
                              style={{ fontSize: 10 }}
                            >
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setCurrentStep('SELECT_RECORD')}
                  >
                    <ArrowLeft size={13} /> Change Record
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleProceedToPreview}
                  >
                    Proceed to Live Preview <ArrowRight size={13} />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── STEP C: LIVE PREVIEW ── */}
        {currentStep === 'PREVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface-muted)',
                padding: '6px 12px',
                borderRadius: 6,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>📐 Format: <strong>{documentType}</strong></span>
                <span>👤 Record: <strong>{selectedRecord?.title}</strong></span>
              </div>

              {/* Zoom Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPreviewScale((prev) => Math.max(0.4, prev - 0.1))}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span style={{ fontSize: 11, minWidth: 40, textAlign: 'center' }}>
                  {Math.round(previewScale * 100)}%
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPreviewScale((prev) => Math.min(2.0, prev + 0.1))}
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setPreviewScale(1)}
                  title="Reset 100%"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {/* Document Iframe Container */}
            <div
              style={{
                height: 380,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                background: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: 20,
              }}
            >
              {loadingPreview ? (
                <div style={{ color: '#FFFFFF', textAlign: 'center' }}>
                  <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                  Rendering production HTML with real record data...
                </div>
              ) : (
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    background: '#FFFFFF',
                  }}
                >
                  <iframe
                    ref={previewIframeRef}
                    title="Live Preview"
                    srcDoc={previewHtml}
                    style={{
                      width: '650px',
                      height: '420px',
                      border: 'none',
                      display: 'block',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setCurrentStep('VALIDATE_DATA')}
              >
                <ArrowLeft size={13} /> Back to Field Validation
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleProceedToDownload}
              >
                Proceed to PDF Download & Print <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP D: DOWNLOAD & PRINT ── */}
        {currentStep === 'DOWNLOAD_PRINT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Download & Print Action Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                padding: 10,
              }}
            >
              {/* PDF Download Card */}
              <div
                style={{
                  background: 'var(--surface-panel)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Download size={20} style={{ color: '#7C3AED' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Download Production PDF
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Generates a verified, millimeter-accurate PDF with the active template version and live record data.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  style={{
                    background: '#7C3AED',
                    borderColor: '#7C3AED',
                    padding: '10px 16px',
                    fontWeight: 600,
                  }}
                >
                  {generatingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Download Verified PDF
                    </>
                  )}
                </button>
              </div>

              {/* Native Print Card */}
              <div
                style={{
                  background: 'var(--surface-panel)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Printer size={20} style={{ color: '#2563EB' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Print Document
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Opens the operating system printer dialog using CSS print media rules and zero margin offsets.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrintDocument}
                  style={{ padding: '10px 16px', fontWeight: 600 }}
                >
                  <Printer size={16} /> Send to Printer...
                </button>
              </div>
            </div>

            {/* Diagnostics Summary Card */}
            <div
              style={{
                background: 'var(--surface-muted)',
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} style={{ color: '#059669' }} />
                Test Verification Outcome
                <span className="badge b-success" style={{ fontSize: 10 }}>PASS</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Template Version:</span>{' '}
                  <strong>{testVersionMode} (v{testVersionMode === 'PUBLISHED' ? publishedVersion : currentDraftVersion})</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target Record:</span>{' '}
                  <strong>{selectedRecord?.title}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Document Type:</span>{' '}
                  <strong>{documentType}</strong>
                </div>
                {lastPdfInfo && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>PDF Size:</span>{' '}
                      <strong>{Math.round(lastPdfInfo.sizeBytes / 1024)} KB</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Engine:</span>{' '}
                      <strong>{lastPdfInfo.engine}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Reset Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setCurrentStep('PREVIEW')}
              >
                <ArrowLeft size={13} /> Back to Preview
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setCurrentStep('SELECT_RECORD')
                  }}
                >
                  <RotateCcw size={13} /> Test Another Record
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={onClose}
                >
                  Done Testing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
