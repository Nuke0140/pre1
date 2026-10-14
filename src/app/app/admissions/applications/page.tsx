'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Plus, Search,
  Filter, RefreshCw, Eye, Sparkles, Send, GraduationCap, X, ChevronRight,
  ClipboardList, Check, Clock, UserCheck, Users, HeartPulse, MapPin,
  Phone, Mail, Calendar, Upload, AlertTriangle
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { SelectEnquiryForAppModal } from '@/components/admissions/SelectEnquiryForAppModal'
import { StaffAdmissionFormModal } from '@/components/admissions/StaffAdmissionFormModal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StatusPill, StudentIdentityChip, FamilyIdentityChip } from '@/components/preone'
import { invalidateAdmissionsCounts } from '@/lib/admissions/use-admissions-counts'

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
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  // Modals & Drawer
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectEnquiryModalOpen, setSelectEnquiryModalOpen] = useState(false)

  // Staff Admission Form Modal state (Phase B workspace)
  const [staffFormModalOpen, setStaffFormModalOpen] = useState(false)
  const [editingAppId, setEditingAppId] = useState<string | null>(null)
  const [editingAppData, setEditingAppData] = useState<any | null>(null)

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

  // Load master data (Branches, Sessions, Programs)
  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ data: [] })),
      fetch('/api/v1/sessions').then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([branchRes, sessionRes]) => {
      if (!active) return
      const rawBranches = branchRes.data || []
      const branchList = rawBranches.map((b: any) => ({
        id: b.id,
        name: b.name,
        isMain: Boolean(b.isMain),
      }))
      setBranches(branchList)

      const savedBranch =
        typeof window !== 'undefined'
          ? localStorage.getItem('preone_selected_branch')
          : null
      const initialBranch =
        savedBranch &&
        (savedBranch === '__ALL_BRANCHES__' || branchList.some((b: any) => b.id === savedBranch))
          ? savedBranch
          : branchList[0]?.id || '__ALL_BRANCHES__'
      setSelectedBranchId(initialBranch)

      const rawSessions = sessionRes.data || []
      const sessionList = rawSessions.map((s: any) => ({
        id: s.id,
        name: s.name,
        isCurrent: Boolean(s.isCurrent),
      }))
      setSessions(sessionList)

      const curSession = sessionList.find((s: any) => s.isCurrent)?.id || sessionList[0]?.id || ''
      setSelectedSessionId(curSession)
    })

    return () => {
      active = false
    }
  }, [])

  // Load branch programs whenever selectedBranchId changes
  useEffect(() => {
    let active = true
    const targetBranch = selectedBranchId && selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : ''
    const pUrl = targetBranch ? `/api/v1/programs?branchId=${targetBranch}` : '/api/v1/programs'
    fetch(pUrl)
      .then((r) => r.json())
      .then((res) => {
        if (!active) return
        if (res.success && Array.isArray(res.data)) {
          setPrograms(res.data)
        }
      })
      .catch((e) => console.error('Failed to load branch programs:', e))
    return () => {
      active = false
    }
  }, [selectedBranchId])

  // Check query params for lead prefill handoff (?leadId=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const queryLeadId = sp.get('leadId')
    if (queryLeadId) {
      fetch(`/api/v1/leads/${queryLeadId}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            const l = res.data
            const parts = (l.childName || '').trim().split(/\s+/)
            setEditingAppId(null)
            setEditingAppData({
              leadId: l.id,
              leadNumber: l.leadNumber,
              branchId: l.branchId || (selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : ''),
              programType: l.interestedProgram || 'NURSERY',
              childFirstName: parts[0] || (l.parentName ? l.parentName.trim().split(/\s+/)[0] : ''),
              childLastName: parts.slice(1).join(' ') || '',
              childDob: l.childDob,
              parentName: l.parentName,
              parentPhone: l.phone,
              parentEmail: l.email,
              notes: l.notes ? `Converted from Enquiry ${l.leadNumber}: ${l.notes}` : `Converted from Enquiry ${l.leadNumber}`,
              status: 'DRAFT',
            })
            setStaffFormModalOpen(true)
          }
        })
        .catch(() => {})
    }
  }, [selectedBranchId])

  // Load applications list
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

  // Open full dossier review drawer
  const openInspector = async (formId: string, initialTab: string = 'overview', appBranchId?: string) => {
    setBusy(true)
    try {
      const qParams = new URLSearchParams()
      const effectiveBranch =
        appBranchId && appBranchId !== '__ALL_BRANCHES__'
          ? appBranchId
          : selectedBranchId && selectedBranchId !== '__ALL_BRANCHES__'
          ? selectedBranchId
          : ''
      if (effectiveBranch) qParams.set('branchId', effectiveBranch)
      if (selectedSessionId && selectedSessionId !== '__ALL_SESSIONS__') {
        qParams.set('academicYearId', selectedSessionId)
      }

      const queryString = qParams.toString() ? `?${qParams.toString()}` : ''
      const res = await fetch(`/api/v1/applications/${formId}${queryString}`).then((r) => r.json())
      setBusy(false)
      if (res.success && res.data) {
        setInspector({
          open: true,
          formId,
          data: res.data,
          tab: initialTab,
        })
      } else {
        const errorMsg =
          typeof res.error === 'string'
            ? res.error
            : res.error?.message || 'Failed to load application details'
        toast.show(errorMsg, { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error fetching dossier', { type: 'error' })
    }
  }

  // Open Staff Admission Form Modal for creating a new application
  const handleOpenNewAdmissionForm = (prefillData?: any) => {
    setEditingAppId(null)
    setEditingAppData(prefillData || null)
    setStaffFormModalOpen(true)
  }

  // Open Staff Admission Form Modal for editing an existing application/draft
  const handleEditApplicationForm = async (appId: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${appId}`).then((r) => r.json())
      setBusy(false)
      if (res.success && res.data?.application) {
        setEditingAppId(appId)
        setEditingAppData(res.data.application)
        setStaffFormModalOpen(true)
      } else {
        toast.show('Failed to load application data', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Network error loading application data', { type: 'error' })
    }
  }

  // Open Enquiry picker to start an application with zero data re-entry
  const handleOpenEnquiryPicker = async () => {
    setBusy(true)
    try {
      const qParams = new URLSearchParams()
      if (selectedBranchId && selectedBranchId !== '__ALL_BRANCHES__') {
        qParams.set('branchId', selectedBranchId)
      }
      const res = await fetch(`/api/v1/leads?${qParams.toString()}`).then((r) => r.json())
      setBusy(false)
      if (res.success && res.data) {
        setEnquiries(res.data)
        setSelectEnquiryModalOpen(true)
      } else {
        toast.show('Failed to fetch enquiries', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Network error fetching enquiries', { type: 'error' })
    }
  }

  // Handle selected enquiry for application conversion
  const handleSelectEnquiryToConvert = (enquiry: any) => {
    const parts = (enquiry.childName || '').trim().split(/\s+/)
    const childFirst = parts[0] || (enquiry.parentName ? enquiry.parentName.trim().split(/\s+/)[0] : '')
    const childLast = parts.slice(1).join(' ') || ''

    handleOpenNewAdmissionForm({
      leadId: enquiry.id,
      leadNumber: enquiry.leadNumber,
      branchId: enquiry.branchId || (selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : ''),
      programType: enquiry.interestedProgram || 'NURSERY',
      childFirstName: childFirst,
      childLastName: childLast,
      childDob: enquiry.childDob ? new Date(enquiry.childDob).toISOString().split('T')[0] : '',
      childGender: 'MALE',
      parentName: enquiry.parentName || '',
      parentPhone: enquiry.phone || '',
      parentEmail: enquiry.email || '',
      notes: enquiry.notes ? `Converted from Enquiry ${enquiry.leadNumber}: ${enquiry.notes}` : `Converted from Enquiry ${enquiry.leadNumber}`,
      status: 'DRAFT',
    })
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
        toast.show('Uploaded mandatory documents verified successfully ✓', { type: 'success' })
        openInspector(inspector.formId, 'documents')
        invalidateAdmissionsCounts()
        loadApplications()
      } else {
        toast.show(res.error?.message || res.error || 'Verification failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error verifying documents', { type: 'error' })
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
        invalidateAdmissionsCounts()
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
        invalidateAdmissionsCounts()
        loadApplications()
      } else {
        toast.show(res.error || 'Offer generation failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error issuing offer', { type: 'error' })
    }
  }

  // Submit draft from inspector drawer
  const handleSubmitDraftFromDrawer = async () => {
    if (!inspector.formId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${inspector.formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SUBMITTED',
          isDraft: false,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Application submitted formally for review 📋', { type: 'success' })
        openInspector(inspector.formId, 'overview')
        invalidateAdmissionsCounts()
        loadApplications()
      } else {
        toast.show(res.error?.message || res.error || 'Submission failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error submitting application', { type: 'error' })
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
            onClick={() => handleOpenNewAdmissionForm()}
            className="btn btn-primary btn-sm h-8.5 px-3.5 gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
          >
            <Plus size={13} />
            <span>New Admission Form</span>
          </button>
          <button
            type="button"
            onClick={handleOpenEnquiryPicker}
            className="btn btn-outline btn-sm h-8.5 px-3 gap-1.5 text-xs font-semibold rounded-xl"
            title="Convert Lead / Enquiry to Application with Zero Data Re-entry"
          >
            <ClipboardList size={13} />
            <span className="hidden sm:inline">From Enquiry</span>
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card shadow-xs min-w-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="relative flex-1 sm:w-64 min-w-0">
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
              className="input h-8.5 px-3 text-xs rounded-xl bg-background border border-border/70 min-w-[130px] max-w-full min-w-0"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
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
                className="input h-8.5 px-3 text-xs rounded-xl bg-background border border-border/70 min-w-[120px] max-w-full min-w-0"
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
          <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
            <table className="table-frosted w-full text-xs text-left">
              <thead className="table-frosted-header">
                <tr>
                  <th className="px-4 py-3 font-semibold">Application #</th>
                  {selectedBranchId === '__ALL_BRANCHES__' && (
                    <th className="px-4 py-3 font-semibold">Campus</th>
                  )}
                  <th className="px-4 py-3 font-semibold">Child Applicant</th>
                  <th className="px-4 py-3 font-semibold">Primary Parent</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Documents</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {applications && applications.length > 0 ? (
                  applications.map((app) => {
                    const verifiedCount =
                      app.documents?.filter((d: any) => d.verified || d.status === 'VERIFIED').length || 0
                    const totalDocs = app.documents?.length || 0
                    const isDraft = app.status === 'DRAFT' || app.isDraft

                    return (
                      <tr
                        key={app.id}
                        onClick={() => openInspector(app.id, 'overview', app.branchId)}
                        className="table-frosted-row cursor-pointer group"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          <div className="flex items-center gap-1.5">
                            <span>{app.applicationNumber}</span>
                            {isDraft && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                Draft
                              </span>
                            )}
                          </div>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditApplicationForm(app.id)
                              }}
                              className="btn btn-ghost btn-sm h-7 px-2 text-[11px] rounded-lg gap-1 border border-border/70 hover:bg-muted/50"
                              title="Edit Admission Form & Guardians"
                            >
                              <FileText size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                openInspector(app.id, 'overview', app.branchId)
                              }}
                              className="btn btn-outline btn-sm h-7 px-2.5 text-[11px] rounded-lg gap-1"
                            >
                              <Eye size={12} />
                              <span>Dossier</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={selectedBranchId === '__ALL_BRANCHES__' ? 9 : 8} className="py-12">
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
                  {inspector.data.application?.leadNumber && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                      Lead: {inspector.data.application.leadNumber}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  {inspector.data.application?.childFirstName} {inspector.data.application?.childLastName || ''}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditApplicationForm(inspector.formId!)}
                  className="btn btn-outline btn-sm h-8 px-2.5 text-xs rounded-xl gap-1.5 font-semibold"
                  title="Edit Admission Form & Guardians"
                >
                  <FileText size={13} />
                  <span>Edit Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspector((prev) => ({ ...prev, open: false }))}
                  className="btn btn-ghost btn-sm h-8 w-8 p-0 rounded-xl"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Subtabs Bar */}
            <div className="px-5 border-b border-border/80 flex items-center gap-3 overflow-x-auto no-scrollbar text-xs font-semibold">
              {['overview', 'guardians', 'documents', 'timeline'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setInspector((prev) => ({ ...prev, tab }))}
                  className={`py-2.5 border-b-2 capitalize transition-colors ${
                    inspector.tab === tab ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  {tab === 'guardians' ? `Guardians (${inspector.data.application?.additionalGuardians?.length || 0})` : tab}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {inspector.tab === 'overview' && (
                <div className="space-y-4">
                  {/* Primary Summary Grid */}
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

                  {/* Child Dossier Details */}
                  <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Child Profile & Medical Details
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Date of Birth:</span>
                        <p className="font-semibold text-foreground">{fmtDate(inspector.data.application?.childDob)}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Blood Group:</span>
                        <p className="font-semibold text-foreground">{inspector.data.application?.bloodGroup || 'Not Recorded'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Previous School:</span>
                        <p className="font-semibold text-foreground">{inspector.data.application?.previousSchool || 'None'}</p>
                      </div>
                    </div>
                    {inspector.data.application?.address && (
                      <div className="pt-1.5 border-t border-border/50">
                        <span className="text-[11px] text-muted-foreground">Residential Address:</span>
                        <p className="text-foreground">{inspector.data.application?.address}</p>
                      </div>
                    )}
                    {inspector.data.application?.medicalNotes && (
                      <div className="pt-1.5 border-t border-border/50 text-destructive flex items-start gap-1.5">
                        <HeartPulse size={13} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-semibold">Medical / Allergy Notes:</span>
                          <p>{inspector.data.application?.medicalNotes}</p>
                        </div>
                      </div>
                    )}
                    {inspector.data.application?.emergencyContact && (
                      <div className="pt-1.5 border-t border-border/50">
                        <span className="text-[11px] text-muted-foreground">Emergency Contact:</span>
                        <p className="font-semibold text-foreground">{inspector.data.application?.emergencyContact}</p>
                      </div>
                    )}
                  </div>

                  {/* Requirements & Next Action summary */}
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Admissions Checklist & Approval Gate
                    </span>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        <span>Age eligibility: {inspector.data.requirements?.ageRequirement?.reason || 'Verified'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check
                          size={14}
                          className={
                            inspector.data.requirements?.documentsCheck?.isComplete
                              ? 'text-emerald-500'
                              : 'text-amber-500'
                          }
                        />
                        <span>
                          Mandatory documents: {inspector.data.requirements?.documentsCheck?.requiredVerified ?? 0} /{' '}
                          {inspector.data.requirements?.documentsCheck?.requiredTotal ?? 0} verified
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Bar inside dossier */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {inspector.data.application?.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={handleSubmitDraftFromDrawer}
                        className="btn btn-primary btn-sm h-8 px-3 rounded-xl gap-1 font-semibold"
                      >
                        <Send size={13} />
                        <span>Submit Application for Review</span>
                      </button>
                    )}
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

              {/* GUARDIANS TAB */}
              {inspector.tab === 'guardians' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Guardians & Pickups</span>
                    <button
                      type="button"
                      onClick={() => handleEditApplicationForm(inspector.formId!)}
                      className="btn btn-outline btn-sm h-7 px-2.5 text-xs rounded-lg gap-1"
                    >
                      <Plus size={12} />
                      <span>Manage Guardians</span>
                    </button>
                  </div>

                  {/* Primary Guardian Card */}
                  <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">Primary Guardian (Primary Contact)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        PRIMARY
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Name:</span>
                        <p className="font-semibold text-foreground">{inspector.data.application?.parentName}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Relationship:</span>
                        <p className="font-semibold text-foreground">{inspector.data.application?.relationship || 'Parent'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Phone:</span>
                        <p className="font-mono font-semibold text-foreground">{inspector.data.application?.parentPhone}</p>
                      </div>
                      {inspector.data.application?.alternatePhone && (
                        <div>
                          <span className="text-[11px] text-muted-foreground">Alt Phone:</span>
                          <p className="font-mono text-foreground">{inspector.data.application?.alternatePhone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Guardians */}
                  {Array.isArray(inspector.data.application?.additionalGuardians) &&
                  inspector.data.application.additionalGuardians.length > 0 ? (
                    inspector.data.application.additionalGuardians.map((g: any, i: number) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{g.fullName || `Guardian #${i + 1}`}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/80 text-foreground">
                            {g.relationship}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[11px] text-muted-foreground">Phone:</span>
                            <p className="font-mono font-semibold text-foreground">{g.phone}</p>
                          </div>
                          {g.email && (
                            <div>
                              <span className="text-[11px] text-muted-foreground">Email:</span>
                              <p className="text-foreground">{g.email}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-[10px] font-semibold">
                          {g.canPickup && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                              ✓ Authorized Pickup
                            </span>
                          )}
                          {g.isFeePayer && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400">
                              Fee Payer
                            </span>
                          )}
                          {g.receivesCommunication && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Notifications
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-muted-foreground">
                      No additional guardians registered.
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {inspector.tab === 'documents' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Checklist & Uploads</span>
                    <button
                      type="button"
                      onClick={handleVerifyAllDocs}
                      className="btn btn-outline btn-sm h-7.5 px-2.5 text-xs rounded-lg gap-1"
                    >
                      <Check size={12} />
                      <span>Verify Uploaded</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {inspector.data.application?.documents?.map((doc: any) => {
                      const isUploaded =
                        doc.status !== 'NOT_UPLOADED' &&
                        doc.fileName &&
                        !doc.fileName.endsWith('-pending.pdf')
                      const isVerified = doc.verified || doc.status === 'VERIFIED'

                      return (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl border border-border/70 bg-card flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{doc.docType.replace(/_/g, ' ')}</p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                  doc.isMandatory
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {doc.isMandatory ? 'REQUIRED' : 'OPTIONAL'}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {isUploaded ? doc.fileName : 'Not Uploaded'}
                            </p>
                            {doc.rejectionReason && (
                              <p className="text-[11px] text-destructive flex items-center gap-1">
                                <AlertTriangle size={11} />
                                <span>Correction needed: {doc.rejectionReason}</span>
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isVerified
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : isUploaded
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isVerified ? 'VERIFIED' : isUploaded ? 'PENDING REVIEW' : 'NOT UPLOADED'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
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

      {/* ── MODAL: STAFF ADMISSION FORM & GUARDIANS WORKSPACE (PHASE B) ── */}
      <StaffAdmissionFormModal
        open={staffFormModalOpen}
        onClose={() => {
          setStaffFormModalOpen(false)
          setEditingAppId(null)
          setEditingAppData(null)
        }}
        applicationId={editingAppId}
        initialData={editingAppData}
        branches={branches}
        sessions={sessions}
        programs={programs}
        selectedBranchId={selectedBranchId}
        selectedSessionId={selectedSessionId}
        onSuccess={(savedApp) => {
          loadApplications()
          invalidateAdmissionsCounts()
          if (inspector.open && inspector.formId === savedApp.id) {
            openInspector(savedApp.id, inspector.tab)
          }
        }}
      />

      {/* ── MODAL: SELECT ENQUIRY FOR APPLICATION PICKER (ZERO DATA RE-ENTRY) ── */}
      <SelectEnquiryForAppModal
        open={selectEnquiryModalOpen}
        onClose={() => setSelectEnquiryModalOpen(false)}
        enquiries={enquiries}
        onSelect={handleSelectEnquiryToConvert}
      />

      {/* Auxiliary Modals */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
        onSuccess={() => {
          invalidateAdmissionsCounts()
          loadApplications()
        }}
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
