'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Plus, Search,
  Filter, RefreshCw, Eye, Sparkles, Send, GraduationCap, X, ChevronRight,
  ClipboardList, Check, Clock, UserCheck
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StatusPill, StudentIdentityChip, FamilyIdentityChip } from '@/components/preone'

export default function ApplicationsPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [sessions, setSessions] = useState<{ id: string; name: string; isCurrent?: boolean }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [programs, setPrograms] = useState<any[]>([])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProgram, setFilterProgram] = useState('')

  // Data states
  const [applications, setApplications] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)

  // Modals & Drawer
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [directFormOpen, setDirectFormOpen] = useState(false)

  // Application Inspector Drawer
  const [inspector, setInspector] = useState<{
    open: boolean
    formId: string | null
    data: any | null
    tab: string
  }>({
    open: false,
    formId: null,
    data: null,
    tab: 'overview',
  })

  // Direct Admission Form state
  const [formBranchId, setFormBranchId] = useState('')
  const [formChildFirst, setFormChildFirst] = useState('')
  const [formChildLast, setFormChildLast] = useState('')
  const [formChildDob, setFormChildDob] = useState('')
  const [formChildGender, setFormChildGender] = useState('MALE')
  const [formParentName, setFormParentName] = useState('')
  const [formParentPhone, setFormParentPhone] = useState('')
  const [formParentEmail, setFormParentEmail] = useState('')
  const [formProgram, setFormProgram] = useState('NURSERY')

  // Load masters on mount
  useEffect(() => {
    async function loadMasters() {
      try {
        const [brRes, sesRes, progRes] = await Promise.all([
          fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/academic-years').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/programs').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        ])
        if (brRes.success && brRes.data?.length > 0) {
          setBranches(brRes.data)
          if (brRes.data.length > 1) {
            setSelectedBranchId('__ALL_BRANCHES__')
          } else {
            const main = brRes.data.find((b: any) => b.isMain) || brRes.data[0]
            setSelectedBranchId(main.id)
          }
        }
        if (sesRes.success && sesRes.data?.length > 0) {
          setSessions(sesRes.data)
          const curr = sesRes.data.find((s: any) => s.isCurrent) || sesRes.data[0]
          setSelectedSessionId(curr.id)
        }
        if (progRes.success && progRes.data) {
          setPrograms(progRes.data)
        }
      } catch (e) {
        console.error('Failed to load application masters:', e)
      }
    }
    loadMasters()
  }, [])

  // Load applications
  const loadApplications = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        ...(selectedSessionId ? { academicSessionId: selectedSessionId } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterProgram ? { programType: filterProgram } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
      })
      const res = await fetch(`/api/v1/applications?${qParams.toString()}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] }))
      setBusy(false)
      if (res.success && res.data) {
        setApplications(res.data)
      }
    } catch {
      setBusy(false)
    }
  }, [selectedBranchId, selectedSessionId, filterStatus, filterProgram, searchQuery])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Open full dossier review
  const openInspector = async (formId: string, initialTab: string = 'overview') => {
    setBusy(true)
    try {
      const res = await fetch(
        `/api/v1/applications/${formId}?branchId=${selectedBranchId}&academicYearId=${selectedSessionId}`
      ).then((r) => r.json())
      setBusy(false)
      if (res.success && res.data) {
        setInspector({
          open: true,
          formId,
          data: res.data,
          tab: initialTab,
        })
      } else {
        toast.show(res.error || 'Failed to load application details', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error fetching dossier', { type: 'error' })
    }
  }

  // Document verification helper inside dossier
  const handleVerifyAllDocs = async () => {
    if (!inspector.formId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${inspector.formId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('All mandatory documents marked as verified', { type: 'success' })
        openInspector(inspector.formId, 'documents')
        loadApplications()
      } else {
        toast.show(res.error || 'Verification failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error', { type: 'error' })
    }
  }

  // Principal approval
  const handleApproveApplication = async () => {
    if (!inspector.formId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${inspector.formId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Application Approved! Ready for offer issuance', { type: 'success' })
        openInspector(inspector.formId, 'overview')
        loadApplications()
      } else {
        toast.show(res.error || 'Approval failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error approving dossier', { type: 'error' })
    }
  }

  // Generate admission offer
  const handleGenerateOffer = async () => {
    if (!inspector.formId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${inspector.formId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validityDays: 7,
          branchId: selectedBranchId,
          academicYearId: selectedSessionId,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show(`Admission Offer Generated: ${res.data?.offer?.offerNumber || 'Offer Sent'}`, { type: 'success' })
        openInspector(inspector.formId, 'overview')
        loadApplications()
      } else {
        toast.show(res.error || 'Offer generation failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error issuing offer', { type: 'error' })
    }
  }

  // Submit Direct Application Wizard
  const handleCreateDirectApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetBranch = formBranchId || (selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : '')
    if (!targetBranch) {
      toast.show('Please select a specific school branch for this application', { type: 'error' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childFirstName: formChildFirst,
          childLastName: formChildLast,
          childDob: formChildDob,
          childGender: formChildGender,
          parentName: formParentName,
          parentPhone: formParentPhone,
          parentEmail: formParentEmail || undefined,
          programType: formProgram,
          branchId: targetBranch,
          academicYearId: selectedSessionId,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('New Application created successfully', { type: 'success' })
        setDirectFormOpen(false)
        setFormBranchId('')
        setFormChildFirst('')
        setFormChildLast('')
        setFormChildDob('')
        setFormParentName('')
        setFormParentPhone('')
        setFormParentEmail('')
        loadApplications()
      } else {
        toast.show(res.error || 'Failed to submit application', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error creating application', { type: 'error' })
    }
  }

  return (
    <AdmissionsShell
      title="Applications"
      description="Formal admission applications, comprehensive child dossiers, document verification, and offer management"
      currentModuleKey="applications"
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
      sessions={sessions}
      selectedSessionId={selectedSessionId}
      onSessionChange={setSelectedSessionId}
      showSessionFilter
      onNewEnquiry={() => setEnquiryModalOpen(true)}
      onSharePublicForm={() => setShareModalOpen(true)}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDirectFormOpen(true)}
            className="btn btn-primary btn-sm h-8.5 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
          >
            <Plus size={13} />
            <span>New Application</span>
          </button>
          <button
            type="button"
            onClick={loadApplications}
            disabled={busy}
            className="btn btn-ghost btn-sm h-8.5 w-8.5 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
            title="Refresh Applications"
          >
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ── Filter Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search applicant or parent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-8.5 pl-8 pr-3 text-xs w-full rounded-xl bg-background border border-border/70"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input h-8.5 px-3 text-xs rounded-xl bg-background border border-border/70 min-w-[130px]"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="OFFER_SENT">Offer Sent</option>
              <option value="OFFER_ACCEPTED">Offer Accepted</option>
              <option value="ENROLLED">Enrolled</option>
            </select>

            {programs.length > 0 && (
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="input h-8.5 px-3 text-xs rounded-xl bg-background border border-border/70 min-w-[120px]"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {applications?.length || 0} dossiers loaded
          </div>
        </div>

        {/* ── Applications Dossier Ledger Table ── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">App Number</th>
                  {selectedBranchId === '__ALL_BRANCHES__' && (
                    <th className="px-4 py-3">Campus</th>
                  )}
                  <th className="px-4 py-3">Child Name</th>
                  <th className="px-4 py-3">Parent / Mobile</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {applications && applications.length > 0 ? (
                  applications.map((app) => {
                    const docs = app.documents || []
                    const verifiedCount = docs.filter((d: any) => d.verified || d.status === 'VERIFIED').length
                    const totalDocs = docs.length

                    return (
                      <tr
                        key={app.id}
                        onClick={() => openInspector(app.id, 'overview')}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          {app.applicationNumber}
                        </td>
                        {selectedBranchId === '__ALL_BRANCHES__' && (
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/80 text-[10px] font-semibold text-foreground border border-border/70">
                              {app.branch?.name || app.branchName || 'Branch'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <StudentIdentityChip
                            name={`${app.childFirstName} ${app.childLastName || ''}`}
                            subtext={app.childGender}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <FamilyIdentityChip
                            name={app.parentName}
                            phone={app.parentPhone}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                            {app.programType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                            <span>{verifiedCount}/{totalDocs}</span>
                            {verifiedCount === totalDocs && totalDocs > 0 ? (
                              <CheckCircle2 size={13} className="text-emerald-500" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={app.status} />
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {fmtDate(app.submittedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openInspector(app.id, 'overview')
                            }}
                            className="btn btn-outline btn-sm h-7 px-2.5 text-[11px] rounded-lg gap-1"
                          >
                            <Eye size={12} />
                            <span>Dossier</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12">
                      <EmptyState
                        illustration="applications"
                        eyebrow="Applications"
                        title="No applications found"
                        description="Prospective applicants registered through forms or walk-ins will be logged here."
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SLIDE-OVER DOSSIER INSPECTOR DRAWER ── */}
      {inspector.open && inspector.data && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card h-full shadow-2xl flex flex-col justify-between border-l border-border/80 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Dossier Review
                  </span>
                  <span className="font-mono text-xs text-muted-foreground font-semibold">
                    {inspector.data.application?.applicationNumber}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  {inspector.data.application?.childFirstName} {inspector.data.application?.childLastName || ''}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspector((prev) => ({ ...prev, open: false }))}
                className="btn btn-ghost btn-sm h-8 w-8 p-0 rounded-xl"
              >
                <X size={16} />
              </button>
            </div>

            {/* Subtabs Bar */}
            <div className="px-5 border-b border-border/80 flex items-center gap-3 overflow-x-auto no-scrollbar text-xs font-semibold">
              {['overview', 'documents', 'timeline'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setInspector((prev) => ({ ...prev, tab }))}
                  className={`py-2.5 border-b-2 capitalize transition-colors ${
                    inspector.tab === tab ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {inspector.tab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                    <div>
                      <span className="text-muted-foreground text-[11px]">Primary Parent:</span>
                      <p className="font-bold text-foreground mt-0.5">{inspector.data.application?.parentName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Contact Phone:</span>
                      <p className="font-mono font-semibold text-foreground mt-0.5">{inspector.data.application?.parentPhone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Program Level:</span>
                      <p className="font-bold text-foreground mt-0.5">{inspector.data.application?.programType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px]">Application Status:</span>
                      <div className="mt-0.5"><StatusPill status={inspector.data.application?.status} /></div>
                    </div>
                  </div>

                  {/* Requirements & Next Action summary */}
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Admissions Checklist & Approval Gate
                    </span>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        <span>Age eligibility calculated and verified</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className={inspector.data.requirements?.documentsCheck?.isComplete ? 'text-emerald-500' : 'text-amber-500'} />
                        <span>Document checklist: {inspector.data.requirements?.documentsCheck?.verified || 0} / {inspector.data.requirements?.documentsCheck?.total || 0} verified</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Bar inside dossier */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {inspector.data.application?.status === 'UNDER_REVIEW' && (
                      <button
                        type="button"
                        onClick={handleApproveApplication}
                        className="btn btn-primary btn-sm h-8 px-3 rounded-xl gap-1 font-semibold"
                      >
                        <Sparkles size={13} />
                        <span>Principal Approval</span>
                      </button>
                    )}
                    {inspector.data.application?.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={handleGenerateOffer}
                        className="btn btn-primary btn-sm h-8 px-3 rounded-xl gap-1 font-semibold"
                      >
                        <Send size={13} />
                        <span>Generate & Send Offer Letter</span>
                      </button>
                    )}
                    {inspector.data.application?.status === 'OFFER_ACCEPTED' && (
                      <a
                        href="/app/admissions/admitted"
                        className="btn btn-primary btn-sm h-8 px-3 rounded-xl gap-1 font-semibold"
                      >
                        <GraduationCap size={13} />
                        <span>Complete Classroom Enrollment →</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {inspector.tab === 'documents' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Mandatory Documents</span>
                    <button
                      type="button"
                      onClick={handleVerifyAllDocs}
                      className="btn btn-outline btn-sm h-7.5 px-2.5 text-xs rounded-lg gap-1"
                    >
                      <Check size={12} />
                      <span>Verify All Pending</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {inspector.data.application?.documents?.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{doc.docType.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-muted-foreground">{doc.fileName}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doc.verified ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                        }`}>
                          {doc.verified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspector.tab === 'timeline' && (
                <div className="space-y-2.5">
                  {inspector.data.timeline?.map((evt: any) => (
                    <div key={evt.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{evt.summary}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{fmtDate(evt.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{evt.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border/80 flex justify-end">
              <button
                type="button"
                onClick={() => setInspector((prev) => ({ ...prev, open: false }))}
                className="btn btn-ghost btn-sm h-8 px-4 text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DIRECT APPLICATION FORM WIZARD ── */}
      <Modal
        open={directFormOpen}
        onClose={() => setDirectFormOpen(false)}
        title="Direct Admission Application Form"
        subtitle="Intake comprehensive pupil and guardian dossier"
        icon={<FileSpreadsheet size={20} />}
      >
        <form onSubmit={handleCreateDirectApplication} className="space-y-3.5">
          {/* Target Branch Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Target School Branch <span className="text-destructive">*</span>
            </label>
            <select
              value={formBranchId || (selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : '')}
              onChange={(e) => setFormBranchId(e.target.value)}
              required
              className="input text-xs h-9 w-full rounded-xl bg-card"
            >
              <option value="">Select Target Branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.isMain ? '(Main Campus)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Child First Name *</label>
              <input
                required
                value={formChildFirst}
                onChange={(e) => setFormChildFirst(e.target.value)}
                placeholder="e.g. Aarav"
                className="input text-xs h-9 w-full rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Child Last Name</label>
              <input
                value={formChildLast}
                onChange={(e) => setFormChildLast(e.target.value)}
                placeholder="e.g. Sharma"
                className="input text-xs h-9 w-full rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Date of Birth *</label>
              <input
                type="date"
                required
                value={formChildDob}
                onChange={(e) => setFormChildDob(e.target.value)}
                className="input text-xs h-9 w-full rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Gender *</label>
              <select
                value={formChildGender}
                onChange={(e) => setFormChildGender(e.target.value)}
                className="input text-xs h-9 w-full rounded-xl"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Primary Parent Name *</label>
              <input
                required
                value={formParentName}
                onChange={(e) => setFormParentName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="input text-xs h-9 w-full rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Parent Mobile Phone *</label>
              <input
                required
                value={formParentPhone}
                onChange={(e) => setFormParentPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="input text-xs h-9 w-full rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Parent Email (Optional)</label>
              <input
                type="email"
                value={formParentEmail}
                onChange={(e) => setFormParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="input text-xs h-9 w-full rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Target Program *</label>
              <select
                value={formProgram}
                onChange={(e) => setFormProgram(e.target.value)}
                className="input text-xs h-9 w-full rounded-xl"
              >
                <option value="PLAYGROUP">Playgroup</option>
                <option value="NURSERY">Nursery</option>
                <option value="LKG">LKG / Junior KG</option>
                <option value="UKG">UKG / Senior KG</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setDirectFormOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl"
            >
              {busy ? 'Creating...' : 'Submit Application Dossier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Auxiliary Modals */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
        onSuccess={loadApplications}
      />
      <SharePublicFormModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        branchId={selectedBranchId}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name}
      />
    </AdmissionsShell>
  )
}
