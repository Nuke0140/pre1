'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Phone, UserCheck, UserX, Clock3, FileCheck2, ClipboardList,
  ThumbsUp, ChevronRight, Calendar, Building, Search, Eye, AlertCircle,
  FileText, CheckCircle2, XCircle, Clock, Users, ArrowRight, Check,
  Send, UserPlus, HeartHandshake, AlertTriangle, RefreshCw
} from 'lucide-react'
import { PageHead, Segmented, EmptyState, StatusBadge, Skeleton } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, enumLabel } from '@/lib/format'

// ── Models ─────────────────────────────────────────────────────────────────
interface AcademicSessionOption {
  id: string
  name: string
  isCurrent: boolean
}

interface BranchOption {
  id: string
  name: string
  isMain: boolean
}

interface ProgramOption {
  id: string
  code: string
  name: string
  programType: string
  ageMinMonths: number | null
  ageMaxMonths: number | null
  capacity: number
}

interface ClassroomOption {
  id: string
  name: string
  code: string
  programType: string
  capacity: number
  _count?: { students: number }
}

interface Enquiry {
  id: string
  leadNumber: string
  parentName: string
  phone: string
  email: string | null
  childName: string | null
  childDob: string | null
  interestedProgram: string | null
  source: string
  status: string
  notes: string | null
  nextFollowUpAt: string | null
  createdAt: string
}

interface AdmissionForm {
  id: string
  applicationNumber: string
  childName: string
  childDob: string
  childGender: string
  programType: string
  parentName: string
  parentPhone: string
  parentEmail: string | null
  status: string
  submittedAt: string
  verifiedAt: string | null
  approvedAt: string | null
  studentId: string | null
  classroomId: string | null
  leadNumber: string | null
  documents: {
    id: string
    docType: string
    fileName: string
    verified: boolean
    remarks: string | null
  }[]
}

interface ReviewData {
  application: AdmissionForm
  requirements: {
    ageRequirement: { eligible: boolean; ageMonths: number; reason?: string }
    documentsCheck: { verified: number; total: number; isComplete: boolean; missing: string[] }
    capacityCheck: { hasAvailableCapacity: boolean; sections: { id: string; name: string; capacity: number; enrolled: number; available: number; hasSeat: boolean }[] }
    feePlanQuote: { id: string; name: string; totalAnnualRupees: number; installmentCount: number; items: { head: string; label: string; amountRupees: number }[] } | null
    isReadyForApproval: boolean
  }
}

const NAV_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'followups', label: 'Follow-ups' },
  { key: 'visits', label: 'School Visits' },
  { key: 'forms', label: 'Admission Forms' },
  { key: 'review', label: 'Review' },
  { key: 'waitlist', label: 'Waiting List' },
  { key: 'new_admissions', label: 'New Admissions' },
]

export default function AdmissionsPage() {
  const toast = useToast()

  // Navigation state
  const [tab, setTab] = useState<string>('overview')

  // Master setup contexts (loaded from DB/ConfigurationService)
  const [sessions, setSessions] = useState<AcademicSessionOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Active Scope Selection
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [filterProgram, setFilterProgram] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Data states
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null)
  const [forms, setForms] = useState<AdmissionForm[] | null>(null)
  const [busy, setBusy] = useState(false)

  // Modals
  const [enquiryModal, setEnquiryModal] = useState(false)
  const [formModal, setFormModal] = useState(false)
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; enquiry: Enquiry | null }>({ open: false, enquiry: null })
  const [visitModal, setVisitModal] = useState<{ open: boolean; enquiry: Enquiry | null }>({ open: false, enquiry: null })
  const [reviewModal, setReviewModal] = useState<{ open: boolean; formId: string | null; data: ReviewData | null }>({ open: false, formId: null, data: null })
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // ── Load Masters ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadMasters() {
      try {
        const [sessRes, brRes, progRes, clsRes] = await Promise.all([
          fetch('/api/v1/academic-years').then((r) => r.json()),
          fetch('/api/v1/branches').then((r) => r.json()),
          fetch('/api/v1/programs').then((r) => r.json()),
          fetch('/api/v1/classrooms').then((r) => r.json()),
        ])

        if (sessRes.success && sessRes.data.length > 0) {
          setSessions(sessRes.data)
          const current = sessRes.data.find((s: AcademicSessionOption) => s.isCurrent) || sessRes.data[0]
          setSelectedSessionId(current.id)
        }
        if (brRes.success && brRes.data.length > 0) {
          setBranches(brRes.data)
          const main = brRes.data.find((b: BranchOption) => b.isMain) || brRes.data[0]
          setSelectedBranchId(main.id)
        }
        if (progRes.success) setPrograms(progRes.data)
        if (clsRes.success) setClassrooms(clsRes.data)
      } catch (err) {
        console.error('Failed to load setup masters:', err)
      }
    }
    loadMasters()
  }, [])

  // ── Load Admission Data Scoped by Academic Year & Branch ──────────────────
  const loadData = useCallback(async () => {
    if (!selectedSessionId || !selectedBranchId) return
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        academicYearId: selectedSessionId,
        ...(filterProgram ? { programType: filterProgram } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
      })

      const [enqRes, formRes] = await Promise.all([
        fetch(`/api/v1/leads?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/applications?${qParams.toString()}`).then((r) => r.json()),
      ])

      if (enqRes.success) setEnquiries(enqRes.data)
      if (formRes.success) setForms(formRes.data)
    } catch (err) {
      console.error('Failed to fetch admissions data:', err)
    }
  }, [selectedSessionId, selectedBranchId, filterProgram, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreateEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.branchId = selectedBranchId
    payload.academicYearId = selectedSessionId

    const res = await fetch('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setBusy(false)

    if (json.success) {
      if (json.meta?.isDuplicate) {
        toast.info('Existing enquiry noted', json.meta.warning)
      } else {
        toast.success('Enquiry recorded', `${json.data.leadNumber} created for ${json.data.parentName}`)
      }
      setEnquiryModal(false)
      loadData()
    } else {
      toast.error('Failed to record enquiry', json.error?.message)
    }
  }

  const handleCreateForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.branchId = selectedBranchId
    payload.academicYearId = selectedSessionId

    const res = await fetch('/api/v1/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setBusy(false)

    if (json.success) {
      toast.success('Admission Form created', `${json.data.applicationNumber} ready for document verification`)
      setFormModal(false)
      loadData()
    } else {
      toast.error('Failed to create form', json.error?.message)
    }
  }

  const handleConvertEnquiry = async (enquiryId: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/leads/${enquiryId}/convert`, { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Admission Form Started', `Form ${json.data.applicationNumber} created`)
      loadData()
    } else {
      toast.error('Could not convert', json.error?.message)
    }
  }

  const handleAddFollowUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!followUpModal.enquiry) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.branchId = selectedBranchId
    payload.academicYearId = selectedSessionId

    const res = await fetch(`/api/v1/leads/${followUpModal.enquiry.id}/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Follow-up logged', 'Action scheduled on enquiry')
      setFollowUpModal({ open: false, enquiry: null })
      loadData()
    } else {
      toast.error('Failed to log follow-up', json.error?.message)
    }
  }

  const handleScheduleVisit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!visitModal.enquiry) return
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    payload.branchId = selectedBranchId
    payload.academicYearId = selectedSessionId

    const res = await fetch(`/api/v1/leads/${visitModal.enquiry.id}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('School Visit scheduled', 'Notification and follow-up assigned')
      setVisitModal({ open: false, enquiry: null })
      loadData()
    } else {
      toast.error('Failed to schedule visit', json.error?.message)
    }
  }

  const openReview = async (formId: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${formId}?branchId=${selectedBranchId}&academicYearId=${selectedSessionId}`)
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      setReviewModal({ open: true, formId, data: json.data })
      const availableSection = json.data.requirements.capacityCheck.sections.find((s: any) => s.hasSeat)
      if (availableSection) setSelectedClassId(availableSection.id)
    } else {
      toast.error('Could not load review', json.error?.message)
    }
  }

  const handleVerifyDoc = async (formId: string, docId: string, action: 'VERIFY' | 'NEEDS_CORRECTION') => {
    setBusy(true)
    const reason = action === 'NEEDS_CORRECTION' ? prompt('Enter reason for correction:') : undefined
    if (action === 'NEEDS_CORRECTION' && !reason) {
      setBusy(false)
      return
    }

    const res = await fetch(`/api/v1/applications/${formId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId, action, remarks: reason }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success(action === 'VERIFY' ? 'Document verified' : 'Correction requested')
      openReview(formId)
      loadData()
    } else {
      toast.error('Action failed', json.error?.message)
    }
  }

  const handleApproveEnroll = async (formId: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${formId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId: selectedClassId || undefined, academicYearId: selectedSessionId }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Admission Completed! 🎉', `Student ${json.data.admissionNo} enrolled in ${json.data.classroomName}`)
      setReviewModal({ open: false, formId: null, data: null })
      loadData()
    } else {
      toast.error('Could not enroll', json.error?.message)
    }
  }

  const handleWaitlist = async (formId: string) => {
    const reason = prompt('Enter waitlist reason (optional):') || 'Section capacity reached'
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${formId}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, academicYearId: selectedSessionId }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.info('Application Waitlisted', `Position #${json.data.position}`)
      setReviewModal({ open: false, formId: null, data: null })
      loadData()
    } else {
      toast.error('Failed to waitlist', json.error?.message)
    }
  }

  // ── Metrics Calculation ───────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalEnquiries = enquiries?.length || 0
    const totalForms = forms?.length || 0
    const pendingReview = forms?.filter((f) => ['SUBMITTED', 'VERIFIED', 'UNDER_REVIEW'].includes(f.status)).length || 0
    const docsPending = forms?.filter((f) => f.documents.some((d) => !d.verified)).length || 0
    const waitlisted = forms?.filter((f) => f.status === 'WAITLISTED').length || 0
    const newAdmissions = forms?.filter((f) => f.status === 'ENROLLED').length || 0

    return { totalEnquiries, totalForms, pendingReview, docsPending, waitlisted, newAdmissions }
  }, [enquiries, forms])

  const selectedSessionName = sessions.find((s) => s.id === selectedSessionId)?.name || 'Academic Year'
  const selectedBranchName = branches.find((b) => b.id === selectedBranchId)?.name || 'Branch'

  return (
    <>
      <PageHead
        title="Admissions"
        sub="Complete preschool admission journey: from enquiry and school visit to review, class allocation, and enrolment."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setEnquiryModal(true)}>
              <Plus size={15} /> New Enquiry
            </button>
            <button className="btn btn-primary" onClick={() => setFormModal(true)}>
              <Plus size={15} /> New Admission Form
            </button>
          </div>
        }
      />

      {/* Scope Bar: Academic Year + Branch Selection (Mandatory Context) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--primary, #7c3aed)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Academic Year:</span>
            <select
              className="select"
              style={{ minWidth: 140, height: 34, fontSize: 13 }}
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '★ (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={18} style={{ color: 'var(--primary, #7c3aed)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Branch:</span>
            <select
              className="select"
              style={{ minWidth: 180, height: 34, fontSize: 13 }}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.isMain ? '(Main)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Program:</span>
            <select
              className="select"
              style={{ minWidth: 130, height: 34, fontSize: 13 }}
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.programType || p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground-muted)' }}
            />
            <input
              className="input"
              style={{ paddingLeft: 30, height: 34, width: 200, fontSize: 13 }}
              placeholder="Search child, parent, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadData} title="Refresh data">
            <RefreshCw size={14} className={busy ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <Segmented
        value={tab}
        onChange={(v) => setTab(v)}
        options={NAV_TABS}
      />

      {/* ── 1. OVERVIEW DASHBOARD ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <div className="t-caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Enquiries</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{metrics.totalEnquiries}</div>
              <div className="kc-meta">Parent enquiries for {selectedSessionName}</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #8b5cf6' }}>
              <div className="t-caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Admission Forms</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{metrics.totalForms}</div>
              <div className="kc-meta">Formal applications submitted</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
              <div className="t-caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Review</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{metrics.pendingReview}</div>
              <div className="kc-meta">Awaiting document check or approval</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #ef4444' }}>
              <div className="t-caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Waiting List</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{metrics.waitlisted}</div>
              <div className="kc-meta">Children awaiting seat release</div>
            </div>
            <div className="card" style={{ padding: 16, borderLeft: '4px solid #10b981' }}>
              <div className="t-caption" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>New Admissions</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{metrics.newAdmissions}</div>
              <div className="kc-meta">Enrolled & classroom allocated</div>
            </div>
          </div>

          {/* Admission Journey Pipeline */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
              Admission Journey — {selectedSessionName} ({selectedBranchName})
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="badge b-blue" style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20 }}>Enquiries</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{metrics.totalEnquiries}</div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--foreground-muted)' }} />
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="badge b-purple" style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20 }}>Admission Forms</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{metrics.totalForms}</div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--foreground-muted)' }} />
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="badge b-warning" style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20 }}>Review & Docs</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{metrics.pendingReview}</div>
              </div>
              <ArrowRight size={18} style={{ color: 'var(--foreground-muted)' }} />
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="badge b-success" style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20 }}>New Admissions</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{metrics.newAdmissions}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ENQUIRIES TAB ── */}
      {tab === 'enquiries' && (
        <div style={{ marginTop: 16 }}>
          <div className="dtable-wrap">
            <div className="dtable-scroll">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Enquiry #</th>
                    <th>Child</th>
                    <th>Parent</th>
                    <th>Program</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Next Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries?.map((enq) => (
                    <tr key={enq.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{enq.leadNumber}</td>
                      <td className="cell-strong">{enq.childName || '—'}</td>
                      <td>
                        {enq.parentName}
                        <span className="cell-sub">{enq.phone}</span>
                      </td>
                      <td><span className="badge b-pink">{enumLabel(enq.interestedProgram || 'NURSERY')}</span></td>
                      <td>{enumLabel(enq.source)}</td>
                      <td><StatusBadge status={enq.status} /></td>
                      <td style={{ fontSize: 12 }}>{enq.nextFollowUpAt ? fmtDate(enq.nextFollowUpAt) : 'None set'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setFollowUpModal({ open: true, enquiry: enq })}
                            title="Add Follow-up"
                          >
                            <Phone size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setVisitModal({ open: true, enquiry: enq })}
                            title="Schedule Visit"
                          >
                            <Calendar size={13} />
                          </button>
                          {enq.status !== 'CONVERTED' && (
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={busy}
                              onClick={() => handleConvertEnquiry(enq.id)}
                              title="Start Admission Form"
                            >
                              Start Form
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {enquiries?.length === 0 && (
                <EmptyState
                  icon={<ClipboardList size={40} />}
                  title="No enquiries yet"
                  message={`No parent enquiries recorded for ${selectedSessionName} at this branch.`}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. FOLLOW-UPS TAB ── */}
      {tab === 'followups' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Parent Follow-up Actions</h3>
            <p className="kc-meta">Scheduled calls, WhatsApp reminders, and admission queries.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Enquiry #</th><th>Child / Parent</th><th>Phone</th><th>Status</th><th>Next Action Due</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries?.filter((e) => e.nextFollowUpAt || e.status !== 'CONVERTED').map((enq) => (
                  <tr key={enq.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{enq.leadNumber}</td>
                    <td><b>{enq.childName || enq.parentName}</b> · {enq.parentName}</td>
                    <td>{enq.phone}</td>
                    <td><StatusBadge status={enq.status} /></td>
                    <td>{enq.nextFollowUpAt ? fmtDate(enq.nextFollowUpAt) : 'Pending assignment'}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setFollowUpModal({ open: true, enquiry: enq })}>
                        Log Follow-up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. SCHOOL VISITS TAB ── */}
      {tab === 'visits' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Parent School Visits & Counselling</h3>
            <p className="kc-meta">Campus tours and face-to-face child interactions.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Enquiry #</th><th>Parent</th><th>Child</th><th>Program</th><th>Scheduled Visit</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries?.filter((e) => ['QUALIFIED', 'CONTACTED'].includes(e.status)).map((enq) => (
                  <tr key={enq.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{enq.leadNumber}</td>
                    <td>{enq.parentName}</td>
                    <td><b>{enq.childName || 'Child'}</b></td>
                    <td>{enumLabel(enq.interestedProgram || 'NURSERY')}</td>
                    <td>{enq.nextFollowUpAt ? fmtDate(enq.nextFollowUpAt) : 'Schedule pending'}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => setVisitModal({ open: true, enquiry: enq })}>
                        Schedule Visit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. ADMISSION FORMS TAB ── */}
      {tab === 'forms' && (
        <div style={{ marginTop: 16 }}>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th>
                  <th>Child</th>
                  <th>Program</th>
                  <th>Parent</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {forms?.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{f.applicationNumber}</td>
                    <td className="cell-strong">{f.childName}</td>
                    <td><span className="badge b-pink">{enumLabel(f.programType)}</span></td>
                    <td>
                      {f.parentName}
                      <span className="cell-sub">{f.parentPhone}</span>
                    </td>
                    <td>
                      <span className={`badge ${f.documents.every((d) => d.verified) ? 'b-success' : 'b-warning'}`}>
                        {f.documents.filter((d) => d.verified).length}/{f.documents.length} verified
                      </span>
                    </td>
                    <td><StatusBadge status={f.status} /></td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openReview(f.id)}>
                        <Eye size={13} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {forms?.length === 0 && (
              <EmptyState
                icon={<ClipboardList size={40} />}
                title="No Admission Forms"
                message={`No admission forms submitted for ${selectedSessionName} at this branch.`}
              />
            )}
          </div>
        </div>
      )}

      {/* ── 6. REVIEW TAB ── */}
      {tab === 'review' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Admission Forms Awaiting Review</h3>
            <p className="kc-meta">Verify documents, program eligibility, and classroom availability before approval.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th><th>Child</th><th>Program</th><th>Parent</th><th>Docs Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {forms?.filter((f) => ['SUBMITTED', 'VERIFIED', 'UNDER_REVIEW'].includes(f.status)).map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{f.applicationNumber}</td>
                    <td><b>{f.childName}</b></td>
                    <td>{enumLabel(f.programType)}</td>
                    <td>{f.parentName} ({f.parentPhone})</td>
                    <td>
                      <span className={`badge ${f.documents.every((d) => d.verified) ? 'b-success' : 'b-warning'}`}>
                        {f.documents.filter((d) => d.verified).length}/{f.documents.length}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => openReview(f.id)}>
                        Open Review Check
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 7. WAITING LIST TAB ── */}
      {tab === 'waitlist' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Waiting List Management</h3>
            <p className="kc-meta">Children on waitlist due to full section capacity.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th><th>Child</th><th>Program</th><th>Parent</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms?.filter((f) => f.status === 'WAITLISTED').map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{f.applicationNumber}</td>
                    <td><b>{f.childName}</b></td>
                    <td>{enumLabel(f.programType)}</td>
                    <td>{f.parentName} ({f.parentPhone})</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => openReview(f.id)}>
                        Re-evaluate & Enroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {forms?.filter((f) => f.status === 'WAITLISTED').length === 0 && (
              <EmptyState
                icon={<Users size={40} />}
                title="Waiting List is Empty"
                message="All approved applicants have been allocated sections."
              />
            )}
          </div>
        </div>
      )}

      {/* ── 8. NEW ADMISSIONS TAB ── */}
      {tab === 'new_admissions' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Enrolled Students ({selectedSessionName})</h3>
            <p className="kc-meta">Admissions completed: Student profile, Parent link, Class allocation & Invoice generated.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th><th>Child</th><th>Program</th><th>Parent</th><th>Status</th><th>Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                {forms?.filter((f) => f.status === 'ENROLLED').map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{f.applicationNumber}</td>
                    <td><b>{f.childName}</b></td>
                    <td><span className="badge b-pink">{enumLabel(f.programType)}</span></td>
                    <td>{f.parentName} ({f.parentPhone})</td>
                    <td><span className="badge b-success">Active Student</span></td>
                    <td>{f.approvedAt ? fmtDate(f.approvedAt) : fmtDate(f.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {forms?.filter((f) => f.status === 'ENROLLED').length === 0 && (
              <EmptyState
                icon={<UserCheck size={40} />}
                title="No New Admissions Completed"
                message="Complete admission review to finalize student enrolment."
              />
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: NEW ENQUIRY ── */}
      <Modal
        open={enquiryModal}
        onClose={() => setEnquiryModal(false)}
        title="Record New Enquiry"
        subtitle={`Academic Year: ${selectedSessionName} · Branch: ${selectedBranchName}`}
        icon={<Phone size={22} />}
        wide
      >
        <form onSubmit={handleCreateEnquiry}>
          <div className="form-grid">
            <div className="field">
              <label>Parent Name <span className="req">*</span></label>
              <input className="input" name="parentName" required placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="field">
              <label>Phone Number <span className="req">*</span></label>
              <input className="input" name="phone" required placeholder="e.g. 9876543210" />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input className="input" name="email" type="email" placeholder="e.g. rahul@example.com" />
            </div>
            <div className="field">
              <label>Child Name</label>
              <input className="input" name="childName" placeholder="e.g. Aarav Sharma" />
            </div>
            <div className="field">
              <label>Child Date of Birth</label>
              <input className="input" name="childDob" type="date" />
            </div>
            <div className="field">
              <label>Interested Program</label>
              <select className="select" name="interestedProgram" defaultValue="NURSERY">
                {programs.map((p) => (
                  <option key={p.id} value={p.programType || p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Enquiry Source</label>
              <select className="select" name="source" defaultValue="WALK_IN">
                {['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'FACEBOOK', 'INSTAGRAM', 'EVENT', 'PARTNER'].map((s) => (
                  <option key={s} value={s}>{enumLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Enquiry Notes / Parent Queries</label>
            <textarea className="textarea" name="notes" placeholder="Interested in morning batch, requested school tour..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setEnquiryModal(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Record Enquiry</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: NEW ADMISSION FORM ── */}
      <Modal
        open={formModal}
        onClose={() => setFormModal(false)}
        title="New Admission Form"
        subtitle={`Academic Year: ${selectedSessionName} · Branch: ${selectedBranchName}`}
        icon={<ClipboardList size={22} />}
        wide
      >
        <form onSubmit={handleCreateForm}>
          <div className="form-grid">
            <div className="field">
              <label>Child First Name <span className="req">*</span></label>
              <input className="input" name="childFirstName" required placeholder="Aarav" />
            </div>
            <div className="field">
              <label>Child Last Name</label>
              <input className="input" name="childLastName" placeholder="Sharma" />
            </div>
            <div className="field">
              <label>Child Date of Birth <span className="req">*</span></label>
              <input className="input" name="childDob" type="date" required />
            </div>
            <div className="field">
              <label>Gender</label>
              <select className="select" name="childGender" defaultValue="UNSPECIFIED">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNSPECIFIED">Prefer not to say</option>
              </select>
            </div>
            <div className="field">
              <label>Program <span className="req">*</span></label>
              <select className="select" name="programType" defaultValue="NURSERY">
                {programs.map((p) => (
                  <option key={p.id} value={p.programType || p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Parent Name <span className="req">*</span></label>
              <input className="input" name="parentName" required placeholder="Rahul Sharma" />
            </div>
            <div className="field">
              <label>Parent Phone <span className="req">*</span></label>
              <input className="input" name="parentPhone" required placeholder="9876543210" />
            </div>
            <div className="field">
              <label>Parent Email</label>
              <input className="input" name="parentEmail" type="email" placeholder="rahul@example.com" />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Residential Address</label>
            <input className="input" name="address" placeholder="Flat 402, Sunshine Residency..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setFormModal(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Submit Admission Form</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: LOG FOLLOW-UP ── */}
      <Modal
        open={followUpModal.open}
        onClose={() => setFollowUpModal({ open: false, enquiry: null })}
        title="Log Follow-up Action"
        subtitle={followUpModal.enquiry ? `${followUpModal.enquiry.parentName} (${followUpModal.enquiry.phone})` : ''}
        icon={<Phone size={22} />}
      >
        <form onSubmit={handleAddFollowUp}>
          <div className="field">
            <label>Action Type</label>
            <select className="select" name="type" defaultValue="Call Parent">
              <option value="Call Parent">Phone Call</option>
              <option value="WhatsApp Parent">WhatsApp Message</option>
              <option value="Visit Confirmation">Visit Confirmation</option>
              <option value="Form Reminder">Form Reminder</option>
              <option value="Document Reminder">Document Reminder</option>
            </select>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Follow-up Notes / Outcome <span className="req">*</span></label>
            <textarea className="textarea" name="note" required placeholder="Discussed curriculum, parent requested brochure..." />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Next Follow-up Date</label>
            <input className="input" name="dueAt" type="datetime-local" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setFollowUpModal({ open: false, enquiry: null })}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>Save Follow-up</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: SCHEDULE VISIT ── */}
      <Modal
        open={visitModal.open}
        onClose={() => setVisitModal({ open: false, enquiry: null })}
        title="Schedule School Visit"
        subtitle={visitModal.enquiry ? `${visitModal.enquiry.parentName} · ${visitModal.enquiry.childName || 'Child'}` : ''}
        icon={<Calendar size={22} />}
      >
        <form onSubmit={handleScheduleVisit}>
          <div className="field">
            <label>Visit Date & Time <span className="req">*</span></label>
            <input className="input" name="scheduledAt" type="datetime-local" required />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Expected Visitors Count</label>
            <input className="input" name="visitorCount" type="number" defaultValue={2} min={1} max={6} />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Special Instructions / Notes</label>
            <textarea className="textarea" name="notes" placeholder="Needs classroom walk-through, meeting with coordinator..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setVisitModal({ open: false, enquiry: null })}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>Confirm School Visit</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: AUTHORITATIVE ADMISSION REVIEW ── */}
      <Modal
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, formId: null, data: null })}
        title={reviewModal.data ? `Review Form ${reviewModal.data.application.applicationNumber}` : 'Admission Review'}
        subtitle={reviewModal.data ? `${reviewModal.data.application.childName} · ${enumLabel(reviewModal.data.application.programType)}` : ''}
        icon={<FileCheck2 size={22} />}
        wide
      >
        {reviewModal.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Requirements Check Card */}
            <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: 14 }}>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Requirements Checklist</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {reviewModal.data.requirements.ageRequirement.eligible ? (
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  ) : (
                    <XCircle size={18} style={{ color: '#ef4444' }} />
                  )}
                  <span style={{ fontSize: 13 }}>
                    Age Eligibility ({reviewModal.data.requirements.ageRequirement.ageMonths}m)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {reviewModal.data.requirements.documentsCheck.isComplete ? (
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                  )}
                  <span style={{ fontSize: 13 }}>
                    Documents ({reviewModal.data.requirements.documentsCheck.verified}/{reviewModal.data.requirements.documentsCheck.total})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {reviewModal.data.requirements.capacityCheck.hasAvailableCapacity ? (
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  ) : (
                    <XCircle size={18} style={{ color: '#ef4444' }} />
                  )}
                  <span style={{ fontSize: 13 }}>Section Capacity Available</span>
                </div>
              </div>
            </div>

            {/* Document Checklist Items */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Submitted Documents</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reviewModal.data.application.documents.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--surface-card, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${d.verified ? 'b-success' : 'b-warning'}`}>
                        {d.verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{enumLabel(d.docType)}</span>
                      {d.remarks && <span className="cell-sub" style={{ color: '#ef4444' }}>({d.remarks})</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!d.verified && (
                        <>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleVerifyDoc(reviewModal.formId!, d.id, 'NEEDS_CORRECTION')}
                          >
                            Needs Correction
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleVerifyDoc(reviewModal.formId!, d.id, 'VERIFY')}
                          >
                            Verify
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Allocation & Capacity */}
            <div className="field">
              <label>Allocate Classroom / Section <span className="req">*</span></label>
              <select
                className="select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {reviewModal.data.requirements.capacityCheck.sections.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.hasSeat}>
                    {s.name} — Capacity: {s.capacity} | Enrolled: {s.enrolled} | Available: {s.available} {s.hasSeat ? '✓' : '(FULL)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Plan Quote Notice */}
            {reviewModal.data.requirements.feePlanQuote && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12.5 }}>
                <b>Configured Fee Plan:</b> {reviewModal.data.requirements.feePlanQuote.name} (₹{reviewModal.data.requirements.feePlanQuote.totalAnnualRupees.toLocaleString('en-IN')}/year).
                First invoice will be generated automatically upon admission approval.
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button className="btn btn-ghost" onClick={() => setReviewModal({ open: false, formId: null, data: null })}>
                Close
              </button>
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => handleWaitlist(reviewModal.formId!)}
              >
                Add to Waiting List
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !reviewModal.data.requirements.isReadyForApproval}
                onClick={() => handleApproveEnroll(reviewModal.formId!)}
              >
                <ThumbsUp size={15} /> Complete Admission
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
