'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FileText, Plus, Search, Filter, RefreshCw, Download, CheckCircle2,
  AlertTriangle, Clock, XCircle, ChevronRight, ArrowLeft, RotateCcw,
  Eye, Trash2, Building, Users, Sparkles, Layers, ShieldCheck, FileSpreadsheet
} from 'lucide-react'
import { PageHead, Segmented, KpiTile, EmptyState, Field, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { DataTable, Column } from '@/components/preone/DataTable'
import { useToast } from '@/components/preone/Toast'
import { DocumentType, DOCUMENT_TYPE_CONFIG } from '@/lib/templates/types'

interface BulkDocumentJobsClientProps {
  onBackToReports?: () => void
}

export function BulkDocumentJobsClient({ onBackToReports }: BulkDocumentJobsClientProps) {
  const toast = useToast()

  // Jobs list state
  const [jobs, setJobs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(15)

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [docTypeFilter, setDocTypeFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('ALL')

  // Context data
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; branchId?: string }[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  // Active Job Detail state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobDetail, setJobDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailItemPage, setDetailItemPage] = useState(1)

  // Create Job Wizard Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [submittingJob, setSubmittingJob] = useState(false)

  // Wizard form data
  const [formData, setFormData] = useState<{
    title: string
    documentType: DocumentType
    templateId: string
    branchId: string
    classroomId: string
    staffCategory: string
    status: string
  }>({
    title: '',
    documentType: 'STUDENT_ID_CARD',
    templateId: '',
    branchId: 'ALL',
    classroomId: 'ALL',
    staffCategory: 'ALL',
    status: 'ACTIVE',
  })

  // Population preview state
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTotal, setPreviewTotal] = useState<number | null>(null)
  const [previewSamples, setPreviewSamples] = useState<any[]>([])

  // Load branches, classrooms, and templates on mount
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

    fetch('/api/v1/templates?limit=100')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.items) {
          setTemplates(res.data.items)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch Jobs List
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      })
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (docTypeFilter !== 'ALL') params.set('documentType', docTypeFilter)
      if (selectedBranch !== 'ALL') params.set('branchId', selectedBranch)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/v1/reports/document-jobs?${params.toString()}`).then((r) => r.json())
      if (res.success) {
        setJobs(res.data.jobs || [])
        setTotal(res.data.total || 0)
      } else {
        toast.error('Error', res.error || 'Failed to fetch document generation jobs')
      }
    } catch {
      toast.error('Network Error', 'Unable to retrieve jobs')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, docTypeFilter, selectedBranch, searchQuery, toast])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Fetch Single Job Detail
  const fetchJobDetail = useCallback(async (jobId: string) => {
    try {
      setLoadingDetail(true)
      const res = await fetch(`/api/v1/reports/document-jobs/${jobId}?includeItems=true&itemPage=${detailItemPage}&itemLimit=50`).then((r) => r.json())
      if (res.success) {
        setJobDetail(res.data)
      } else {
        toast.error('Error', res.error || 'Failed to load job details')
      }
    } catch {
      toast.error('Network Error', 'Unable to retrieve job details')
    } finally {
      setLoadingDetail(false)
    }
  }, [detailItemPage, toast])

  useEffect(() => {
    if (selectedJobId) {
      fetchJobDetail(selectedJobId)
    } else {
      setJobDetail(null)
    }
  }, [selectedJobId, fetchJobDetail])

  // Real-time polling when viewing an active job
  useEffect(() => {
    if (!selectedJobId || !jobDetail) return
    if (jobDetail.status === 'RUNNING' || jobDetail.status === 'QUEUED') {
      const interval = setInterval(() => {
        fetchJobDetail(selectedJobId)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [selectedJobId, jobDetail?.status, fetchJobDetail])

  // Also auto-refresh job list if any job is RUNNING or QUEUED
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'RUNNING' || j.status === 'QUEUED')
    if (hasActive) {
      const interval = setInterval(() => {
        fetchJobs()
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [jobs, fetchJobs])

  // Available templates matching selected document type in wizard
  const availableTemplatesForType = useMemo(() => {
    return templates.filter((t) => t.type === formData.documentType)
  }, [templates, formData.documentType])

  // Update template selection when documentType changes
  useEffect(() => {
    if (availableTemplatesForType.length > 0) {
      const defaultTmpl = availableTemplatesForType.find((t) => t.isDefault) || availableTemplatesForType[0]
      setFormData((prev) => ({
        ...prev,
        templateId: defaultTmpl.id,
      }))
    } else {
      setFormData((prev) => ({ ...prev, templateId: '' }))
    }
  }, [formData.documentType, availableTemplatesForType])

  // Fetch population preview when wizard step 2 is active or filters change
  const fetchPopulationPreview = useCallback(async () => {
    try {
      setPreviewLoading(true)
      const res = await fetch('/api/v1/reports/document-jobs/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: formData.documentType,
          filters: {
            branchId: formData.branchId,
            classroomId: formData.classroomId,
            staffCategory: formData.staffCategory,
            status: formData.status,
          },
        }),
      }).then((r) => r.json())

      if (res.success) {
        setPreviewTotal(res.data.totalCount)
        setPreviewSamples(res.data.sampleRecords || [])
      } else {
        setPreviewTotal(0)
        setPreviewSamples([])
      }
    } catch {
      setPreviewTotal(0)
      setPreviewSamples([])
    } finally {
      setPreviewLoading(false)
    }
  }, [formData.documentType, formData.branchId, formData.classroomId, formData.staffCategory, formData.status])

  useEffect(() => {
    if (createModalOpen && wizardStep >= 2) {
      fetchPopulationPreview()
    }
  }, [createModalOpen, wizardStep, fetchPopulationPreview])

  // Auto-generate job title
  const handleProceedToStep3 = () => {
    const tmpl = availableTemplatesForType.find((t) => t.id === formData.templateId)
    const tmplName = tmpl?.name || (DOCUMENT_TYPE_CONFIG[formData.documentType] as any)?.title || DOCUMENT_TYPE_CONFIG[formData.documentType]?.label || 'Document'
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    const autoTitle = `Bulk ${tmplName} — ${today}`
    setFormData((prev) => ({ ...prev, title: prev.title.trim() || autoTitle }))
    setWizardStep(3)
  }

  // Submit Job Creation
  const handleCreateJob = async () => {
    if (!formData.templateId) {
      toast.error('Validation Error', 'Please select a document template')
      return
    }
    if (!formData.title.trim()) {
      toast.error('Validation Error', 'Please enter a job title')
      return
    }

    try {
      setSubmittingJob(true)
      const res = await fetch('/api/v1/reports/document-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          templateId: formData.templateId,
          documentType: formData.documentType,
          filters: {
            branchId: formData.branchId,
            classroomId: formData.classroomId,
            staffCategory: formData.staffCategory,
            status: formData.status,
          },
          autoStart: true,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Job Created', 'Bulk document generation job has been queued')
        setCreateModalOpen(false)
        setWizardStep(1)
        fetchJobs()
        // Open the newly created job
        if (res.data?.id) {
          setSelectedJobId(res.data.id)
        }
      } else {
        toast.error('Failed', res.error || 'Failed to create job')
      }
    } catch {
      toast.error('Error', 'Network error creating job')
    } finally {
      setSubmittingJob(false)
    }
  }

  // Retry Failed Records
  const handleRetryFailed = async (jobId: string) => {
    try {
      const res = await fetch(`/api/v1/reports/document-jobs/${jobId}/retry`, {
        method: 'POST',
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Retrying', `Retrying ${res.data.retriedCount} failed items`)
        fetchJobDetail(jobId)
        fetchJobs()
      } else {
        toast.error('Retry Failed', res.error || 'Could not retry failed records')
      }
    } catch {
      toast.error('Network Error', 'Failed to trigger retry')
    }
  }

  // Cancel Job
  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this document generation job?')) return
    try {
      const res = await fetch(`/api/v1/reports/document-jobs/${jobId}/cancel`, {
        method: 'POST',
      }).then((r) => r.json())

      if (res.success) {
        toast.success('Cancelled', 'Document generation job cancelled')
        fetchJobDetail(jobId)
        fetchJobs()
      } else {
        toast.error('Cancel Failed', res.error || 'Could not cancel job')
      }
    } catch {
      toast.error('Network Error', 'Failed to cancel job')
    }
  }

  // Status badge styling helper
  const renderJobStatus = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} /> Completed
          </span>
        )
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={12} /> Partially Done
          </span>
        )
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-pulse">
            <RefreshCw size={12} className="animate-spin" /> Processing
          </span>
        )
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock size={12} /> Queued
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle size={12} /> Failed
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Cancelled
          </span>
        )
      default:
        return <StatusBadge status={status} />
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: JOB DETAIL SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (selectedJobId && jobDetail) {
    const pct = jobDetail.totalCount > 0 ? Math.round((jobDetail.processedCount / jobDetail.totalCount) * 100) : 0
    const isCompleted = jobDetail.status === 'COMPLETED' || jobDetail.status === 'PARTIALLY_COMPLETED'
    const canRetry = jobDetail.failedCount > 0 && jobDetail.status !== 'RUNNING' && jobDetail.status !== 'QUEUED'
    const canCancel = jobDetail.status === 'RUNNING' || jobDetail.status === 'QUEUED'

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-28">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedJobId(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Document Jobs
          </button>
          <div className="flex items-center gap-2">
            {canRetry && (
              <button
                onClick={() => handleRetryFailed(jobDetail.id)}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RotateCcw size={14} /> Retry Failed ({jobDetail.failedCount})
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => handleCancelJob(jobDetail.id)}
                className="btn btn-outline btn-sm text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <XCircle size={14} /> Cancel Job
              </button>
            )}
            {jobDetail.zipUrl && (
              <a
                href={jobDetail.zipUrl}
                download
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download ZIP Package
              </a>
            )}
          </div>
        </div>

        {/* Job Header Card */}
        <div className="card p-6 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {jobDetail.title}
                </h1>
                {renderJobStatus(jobDetail.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Template: <span className="font-semibold text-slate-700 dark:text-slate-300">{jobDetail.templateName}</span> (v{jobDetail.templateVersion})
                {' • '}Type: <span className="font-semibold text-slate-700 dark:text-slate-300">{(DOCUMENT_TYPE_CONFIG[jobDetail.documentType as DocumentType] as any)?.title || DOCUMENT_TYPE_CONFIG[jobDetail.documentType as DocumentType]?.label || jobDetail.documentType}</span>
                {' • '}Created by {jobDetail.createdByName || 'Admin'} on {new Date(jobDetail.createdAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Overall Progress ({pct}%)</span>
              <span>{jobDetail.processedCount} of {jobDetail.totalCount} records processed</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  jobDetail.status === 'COMPLETED' ? 'bg-emerald-500' :
                  jobDetail.status === 'FAILED' ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white">{jobDetail.totalCount}</div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Eligible Records</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{jobDetail.successCount}</div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Succeeded</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-center">
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{jobDetail.failedCount}</div>
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Failed</div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-center">
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {jobDetail.zipSizeBytes ? `${(jobDetail.zipSizeBytes / (1024 * 1024)).toFixed(2)} MB` : 'Pending'}
              </div>
              <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Package Size</div>
            </div>
          </div>
        </div>

        {/* Record Results Table */}
        <div className="card p-5 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Individual Record Results ({jobDetail.itemsTotal || 0})
            </h2>
            <button
              onClick={() => fetchJobDetail(jobDetail.id)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={13} className={loadingDetail ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Generated Document</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {jobDetail.items && jobDetail.items.length > 0 ? (
                  jobDetail.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.entityName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.identifier}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'SUCCESS' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} /> Succeeded
                          </span>
                        )}
                        {item.status === 'FAILED' && (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                              <XCircle size={13} /> Failed
                            </span>
                            {item.errorMessage && (
                              <span className="text-[11px] text-rose-500">{item.errorMessage}</span>
                            )}
                          </div>
                        )}
                        {item.status === 'PROCESSING' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                            <RefreshCw size={13} className="animate-spin" /> Rendering PDF
                          </span>
                        )}
                        {item.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={13} /> Queued
                          </span>
                        )}
                        {item.status === 'SKIPPED' && (
                          <span className="text-xs text-slate-400">Skipped</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.document ? (
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                            {item.document.fileName} ({Math.round(item.document.fileSizeBytes / 1024)} KB)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.document && (
                          <div className="inline-flex items-center gap-1">
                            <a
                              href={item.document.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-xs text-indigo-600"
                              title="View PDF"
                            >
                              <Eye size={13} />
                            </a>
                            <a
                              href={item.document.fileUrl}
                              download
                              className="btn btn-ghost btn-xs text-indigo-600"
                              title="Download PDF"
                            >
                              <Download size={13} />
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No item records found for this job.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW: MAIN JOBS DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-28">
      {/* Page Header */}
      <PageHead
        title="Document Generation Jobs"
        actions={
          <div className="flex items-center gap-2">
            {onBackToReports && (
              <button
                onClick={onBackToReports}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Back to Reports
              </button>
            )}
            <button
              onClick={() => {
                setFormData({
                  title: '',
                  documentType: 'STUDENT_ID_CARD',
                  templateId: '',
                  branchId: 'ALL',
                  classroomId: 'ALL',
                  staffCategory: 'ALL',
                  status: 'ACTIVE',
                })
                setWizardStep(1)
                setCreateModalOpen(true)
              }}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Create Document Job
            </button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="card p-4 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="input w-full pl-9 h-10 text-xs rounded-xl"
              placeholder="Search by job title or template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Document Type Filter */}
          <select
            className="input h-10 text-xs rounded-xl"
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
          >
            <option value="ALL">All Document Types</option>
            <option value="STUDENT_ID_CARD">Student ID Card</option>
            <option value="STAFF_ID_CARD">Staff ID Card</option>
            <option value="CERTIFICATE">Certificate</option>
            <option value="ADMISSION_FORM">Admission Form</option>
            <option value="REPORT_CARD">Report Card</option>
          </select>

          {/* Status Filter */}
          <select
            className="input h-10 text-xs rounded-xl"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIALLY_COMPLETED">Partially Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Branch Filter */}
          <select
            className="input h-10 text-xs rounded-xl"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card p-5 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Generation History ({total})
          </h2>
          <button
            onClick={fetchJobs}
            className="btn btn-ghost btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Job Title & Template</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Progress / Output</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {jobs.length > 0 ? (
                jobs.map((job) => {
                  const pct = job.totalCount > 0 ? Math.round((job.processedCount / job.totalCount) * 100) : 0
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors">
                          {job.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          Template: {job.templateName} (v{job.templateVersion})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {(DOCUMENT_TYPE_CONFIG[job.documentType as DocumentType] as any)?.title || DOCUMENT_TYPE_CONFIG[job.documentType as DocumentType]?.label || job.documentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${job.status === 'COMPLETED' ? 'bg-emerald-500' : job.status === 'FAILED' ? 'bg-rose-500' : 'bg-indigo-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {job.successCount}/{job.totalCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {renderJobStatus(job.status)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {job.zipUrl && (
                            <a
                              href={job.zipUrl}
                              download
                              className="btn btn-outline btn-xs"
                              title="Download ZIP Archive"
                            >
                              <Download size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedJobId(job.id)}
                            className="btn btn-ghost btn-xs text-indigo-600"
                            title="View Details"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No document generation jobs found</p>
                      <p className="text-xs text-slate-400">Create your first bulk job to generate ID cards, certificates, or forms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          CREATE JOB WIZARD MODAL
         ───────────────────────────────────────────────────────────────────────── */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Bulk Document Job"
        subtitle="Select a published template, filter the target audience, and trigger generation"
        wide
      >
        <div className="space-y-6">
          {/* Stepper Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-semibold">
            <button
              onClick={() => setWizardStep(1)}
              className={`pb-1 ${wizardStep === 1 ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
            >
              1. Document & Template
            </button>
            <button
              onClick={() => {
                if (formData.templateId) setWizardStep(2)
              }}
              disabled={!formData.templateId}
              className={`pb-1 ${wizardStep === 2 ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
            >
              2. Target Population & Filter
            </button>
            <button
              onClick={() => {
                if (formData.templateId) handleProceedToStep3()
              }}
              disabled={!formData.templateId}
              className={`pb-1 ${wizardStep === 3 ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
            >
              3. Review & Launch
            </button>
          </div>

          {/* STEP 1: DOCUMENT TYPE & TEMPLATE */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(['STUDENT_ID_CARD', 'STAFF_ID_CARD', 'CERTIFICATE', 'ADMISSION_FORM', 'REPORT_CARD'] as DocumentType[]).map((type) => {
                    const cfg = DOCUMENT_TYPE_CONFIG[type]
                    const isSelected = formData.documentType === type
                    return (
                      <div
                        key={type}
                        onClick={() => setFormData((prev) => ({ ...prev, documentType: type }))}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-bold'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-semibold">{(cfg as any)?.title || cfg?.label || type}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{cfg?.description?.slice(0, 40)}...</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Template ({availableTemplatesForType.length} available)
                </label>
                {availableTemplatesForType.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {availableTemplatesForType.map((t) => {
                      const isSelected = formData.templateId === t.id
                      return (
                        <div
                          key={t.id}
                          onClick={() => setFormData((prev) => ({ ...prev, templateId: t.id }))}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</span>
                            {t.isDefault && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>v{t.version}</span>
                            <span>•</span>
                            <span className="capitalize">{t.status.toLowerCase()}</span>
                            <span>•</span>
                            <span>{t.pageSize}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    No templates found for this document type. Please create or publish one in Template Studio first.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  disabled={!formData.templateId}
                  onClick={() => setWizardStep(2)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Next: Configure Audience <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: AUDIENCE & FILTERS */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Scope
                  </label>
                  <select
                    className="input w-full h-10 text-xs rounded-xl"
                    value={formData.branchId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branchId: e.target.value }))}
                  >
                    <option value="ALL">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Type Specific Filter */}
                {formData.documentType === 'STAFF_ID_CARD' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Staff Department / Category
                    </label>
                    <select
                      className="input w-full h-10 text-xs rounded-xl"
                      value={formData.staffCategory}
                      onChange={(e) => setFormData((prev) => ({ ...prev, staffCategory: e.target.value }))}
                    >
                      <option value="ALL">All Departments</option>
                      <option value="Academics">Academics / Teaching</option>
                      <option value="Administration">Administration</option>
                      <option value="Operations">Operations / Support</option>
                      <option value="Transport">Transport</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Classroom Filter
                    </label>
                    <select
                      className="input w-full h-10 text-xs rounded-xl"
                      value={formData.classroomId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, classroomId: e.target.value }))}
                    >
                      <option value="ALL">All Classrooms</option>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Live Population Preview Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Eligible Population: {previewLoading ? 'Counting...' : `${previewTotal ?? 0} records`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Live Database Match</span>
                </div>

                {previewSamples.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 space-y-1">
                    <span className="font-semibold text-slate-500">Sample matches:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewSamples.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                          {s.entityName} ({s.identifier})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="btn btn-outline"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={previewTotal === 0}
                  onClick={handleProceedToStep3}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Next: Review & Title <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & LAUNCH */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title / Name
                </label>
                <input
                  type="text"
                  className="input w-full h-10 text-xs rounded-xl"
                  placeholder="e.g. Bulk ID Cards - Nursery (2026-2027)"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" /> Ready to Launch Bulk Generation
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li>Total target records: <strong>{previewTotal ?? 0}</strong></li>
                  <li>Document type: <strong>{(DOCUMENT_TYPE_CONFIG[formData.documentType] as any)?.title || DOCUMENT_TYPE_CONFIG[formData.documentType]?.label || formData.documentType}</strong></li>
                  <li>Template: <strong>{availableTemplatesForType.find((t) => t.id === formData.templateId)?.name}</strong></li>
                  <li>Output: Individual PDF stored in student/staff profile document library + downloadable ZIP package</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="btn btn-outline"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submittingJob || (previewTotal ?? 0) === 0}
                  onClick={handleCreateJob}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {submittingJob ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Starting Job...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm & Start Generation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
