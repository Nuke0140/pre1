'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Phone, UserCheck, UserX, Clock3, FileCheck2, ClipboardList,
  ThumbsUp, ChevronRight, Calendar, Building, Search, Eye, AlertCircle,
  FileText, CheckCircle2, XCircle, Clock, Users, ArrowRight, Check,
  Send, UserPlus, HeartHandshake, AlertTriangle, RefreshCw, ChevronDown,
  Download, Printer, DollarSign, History, ShieldAlert, Award, X
} from 'lucide-react'
import { PageHead, Segmented, EmptyState, StatusBadge, Skeleton } from '@/components/preone/ui'
import { DataTable, RowAction } from '@/components/preone/DataTable'
import { Modal } from '@/components/preone/Modal'
import { DatePicker, MaskedInput, EnterNav, Wizard } from '@/components/preone/forms'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, enumLabel } from '@/lib/format'

// ── Master Types ─────────────────────────────────────────────────────────────
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
  convertedApplicationId: string | null
  createdAt: string
}

interface ApplicationListItem {
  id: string
  applicationNumber: string
  childName: string
  childFirstName: string
  childLastName?: string | null
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
  leadId: string | null
  offers?: { id: string; offerNumber: string; status: string }[]
  documents: {
    id: string
    docType: string
    fileName: string
    status: string
    verified: boolean
    remarks: string | null
    rejectionReason: string | null
  }[]
}

interface ReviewData {
  application: {
    id: string
    applicationNumber: string
    childFirstName: string
    childLastName?: string | null
    childDob: string
    childGender: string
    programType: string
    parentName: string
    parentPhone: string
    parentEmail?: string | null
    previousSchool?: string | null
    status: string
    submittedAt?: string
    verifiedAt?: string | null
    approvedAt?: string | null
    rejectedAt?: string | null
    rejectionReason?: string | null
    notes?: string | null
    studentId?: string | null
    classroomId?: string | null
    leadId?: string | null
    lead?: { leadNumber: string; source: string; notes?: string } | null
    academicSession?: { name: string } | null
    documents: {
      id: string
      docType: string
      fileName: string
      status: string
      verified: boolean
      uploadedAt: string
      verifiedAt?: string | null
      remarks?: string | null
      rejectionReason?: string | null
    }[]
    offers: {
      id: string
      offerNumber: string
      childName: string
      parentName: string
      programType: string
      feeTotalCents: number
      terms?: string | null
      status: string
      validFrom: string
      validUntil: string
      issuedAt?: string | null
      acceptedAt?: string | null
      declinedAt?: string | null
      acceptNote?: string | null
      declineReason?: string | null
    }[]
  }
  requirements: {
    ageRequirement: { eligible: boolean; ageMonths: number; minMonths?: number | null; maxMonths?: number | null; reason?: string }
    documentsCheck: { verified: number; rejected: number; total: number; isComplete: boolean; missing: string[] }
    capacityCheck: { hasAvailableCapacity: boolean; sections: { id: string; name: string; capacity: number; enrolled: number; available: number; hasSeat: boolean }[] }
    feePlanQuote: { id: string; name: string; totalAnnualRupees: number; installmentCount: number; items: { head: string; label: string; amountRupees: number }[] } | null
    siblingConcession: {
      hasSibling: boolean
      existingChildren: { studentId: string; admissionNo: string; name: string; classroom: string; status: string }[]
      applicableDiscountPercent: number
    }
    isReadyForApproval: boolean
  }
  offers: any[]
  timeline: { id: string; action: string; summary: string; actorName?: string | null; actorRole?: string | null; createdAt: string }[]
}

const NAV_TABS = [
  { key: 'pipeline', label: 'CRM Pipeline' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'followups', label: 'Follow-ups' },
  { key: 'applications', label: 'Applications' },
  { key: 'waitlist', label: 'Waiting List' },
  { key: 'admissions', label: 'Admissions' },
  { key: 'reports', label: 'CRM Analytics' },
]

export default function AdmissionsPage() {
  const toast = useToast()

  // Navigation state
  const [tab, setTab] = useState<string>('pipeline')

  // Master setup contexts (loaded from DB/ConfigurationService)
  const [sessions, setSessions] = useState<AcademicSessionOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])

  // Active Scope Selection
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [filterProgram, setFilterProgram] = useState<string>('')
  const [filterStage, setFilterStage] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Data states
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null)
  const [applications, setApplications] = useState<ApplicationListItem[] | null>(null)
  const [busy, setBusy] = useState(false)

  // Inspector & Modal states
  const [enquiryModal, setEnquiryModal] = useState(false)
  const [formModal, setFormModal] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null)
  const [pendingFormPayload, setPendingFormPayload] = useState<any | null>(null)

  // Enquiry / Application form enhancements
  const [enquiryDob, setEnquiryDob] = useState('')
  const [appDob, setAppDob] = useState('')
  const [appStep, setAppStep] = useState(0)
  const [appSummary, setAppSummary] = useState<{ k: string; v: string }[]>([])

  useEffect(() => {
    if (formModal) {
      setAppStep(0)
      setAppSummary([])
    }
  }, [formModal])

  const nextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    const f = e.currentTarget.form
    if (f && !f.reportValidity()) return
    setAppStep((s) => {
      const ns = Math.min(s + 1, 2)
      if (ns >= 2 && f) {
        const fd = new FormData(f)
        const g = (k: string) => String(fd.get(k) || '')
        setAppSummary([
          { k: 'Child', v: `${g('childFirstName')} ${g('childLastName')}`.trim() },
          { k: 'Date of birth', v: g('childDob') },
          { k: 'Gender', v: g('childGender') },
          { k: 'Program', v: g('programType') },
          { k: 'Parent', v: g('parentName') },
          { k: 'Phone', v: g('parentPhone') },
          { k: 'Email', v: g('parentEmail') },
        ])
      }
      return ns
    })
  }

  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; enquiry: Enquiry | null; defaultType?: string }>({ open: false, enquiry: null })
  const [visitModal, setVisitModal] = useState<{ open: boolean; enquiry: Enquiry | null }>({ open: false, enquiry: null })
  
  // Application Inspector Modal
  const [inspector, setInspector] = useState<{ open: boolean; formId: string | null; data: ReviewData | null; tab: string }>({
    open: false,
    formId: null,
    data: null,
    tab: 'overview',
  })

  // Inspector Action States
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [rejectReasonModal, setRejectReasonModal] = useState<{ open: boolean; docId?: string; isAppReject?: boolean }>({ open: false })
  const [rejectReasonText, setRejectReasonText] = useState<string>('')
  const [counsellingForm, setCounsellingForm] = useState({
    scheduledAt: new Date().toISOString().slice(0, 16),
    counselorName: '',
    mode: 'IN_PERSON',
    notes: '',
    outcome: 'POSITIVE',
  })

  // ── Load Masters from Database ───────────────────────────────────────────
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

  // ── Load Admissions Data ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedSessionId || !selectedBranchId) return
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        academicYearId: selectedSessionId,
        ...(filterProgram ? { programType: filterProgram } : {}),
        ...(filterStage ? { status: filterStage } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
      })

      const [enqRes, formRes] = await Promise.all([
        fetch(`/api/v1/leads?${qParams.toString()}`).then((r) => r.json()),
        fetch(`/api/v1/applications?${qParams.toString()}`).then((r) => r.json()),
      ])

      if (enqRes.success) setEnquiries(enqRes.data)
      if (formRes.success) setApplications(formRes.data)
    } catch (err) {
      console.error('Failed to fetch admissions data:', err)
    }
  }, [selectedSessionId, selectedBranchId, filterProgram, filterStage, searchQuery])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Open Inspector ───────────────────────────────────────────────────────
  const openInspector = async (formId: string, initialTab: string = 'overview') => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${formId}?branchId=${selectedBranchId}&academicYearId=${selectedSessionId}`)
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        setInspector({
          open: true,
          formId,
          data: json.data,
          tab: initialTab,
        })
        const availableSection = json.data.requirements?.capacityCheck?.sections?.find((s: any) => s.hasSeat)
        if (availableSection) setSelectedClassId(availableSection.id)
      } else {
        toast.error('Could not load application detail', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Network error loading application', err.message)
    }
  }

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
      setEnquiryDob('')
      loadData()
    } else {
      toast.error('Failed to record enquiry', json.error?.message)
    }
  }

  const handleCreateApplication = async (e: React.FormEvent<HTMLFormElement>) => {
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
      toast.success('Application created', `${json.data.applicationNumber} ready for document verification`)
      setFormModal(false)
      setAppDob('')
      setAppStep(0)
      setAppSummary([])
      setDuplicateWarning(null)
      setPendingFormPayload(null)
      loadData()
      openInspector(json.data.id, 'documents')
    } else if (json.status === 409 || json.error?.code === 'CONFLICT' || json.meta?.isDuplicate) {
      setDuplicateWarning(json.error?.message || 'A similar application exists for this child.')
      setPendingFormPayload(payload)
    } else {
      toast.error('Application creation failed', json.error?.message)
    }
  }

  const handleConfirmDuplicateApplication = async () => {
    if (!pendingFormPayload) return
    setBusy(true)
    pendingFormPayload.isDuplicateConfirmed = true
    const res = await fetch('/api/v1/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingFormPayload),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Application created with confirmation', json.data.applicationNumber)
      setFormModal(false)
      setDuplicateWarning(null)
      setPendingFormPayload(null)
      loadData()
    } else {
      toast.error('Could not create application', json.error?.message)
    }
  }

  const handleConvertEnquiry = async (enquiryId: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/leads/${enquiryId}/convert`, { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Admission Form Started', `Form ${json.data.applicationNumber} created from enquiry`)
      loadData()
      openInspector(json.data.applicationId, 'documents')
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
      toast.success('Follow-up scheduled', 'Action recorded on lead')
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
      toast.success('School Visit confirmed', 'Calendar entry & follow-up set')
      setVisitModal({ open: false, enquiry: null })
      loadData()
    } else {
      toast.error('Failed to schedule visit', json.error?.message)
    }
  }

  // ── Document Workflow ────────────────────────────────────────────────────
  const handleVerifyDocument = async (docId: string, action: 'VERIFY' | 'REJECT', remarks?: string) => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId, action, remarks }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success(action === 'VERIFY' ? 'Document verified' : 'Document rejected')
      openInspector(inspector.formId, 'documents')
      loadData()
    } else {
      toast.error('Action failed', json.error?.message)
    }
  }

  const handleVerifyAllDocuments = async () => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('All documents verified', 'Application status updated to VERIFIED')
      openInspector(inspector.formId, 'documents')
      loadData()
    } else {
      toast.error('Could not verify documents', json.error?.message)
    }
  }

  // ── Counselling Workflow ─────────────────────────────────────────────────
  const handleSaveCounselling = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/counselling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...counsellingForm,
        branchId: selectedBranchId,
        academicYearId: selectedSessionId,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Counselling session recorded', `Outcome: ${json.data.outcome}`)
      openInspector(inspector.formId, 'approval')
      loadData()
    } else {
      toast.error('Could not save counselling', json.error?.message)
    }
  }

  // ── Approval Workflow ────────────────────────────────────────────────────
  const handleApproveApplication = async (notes?: string) => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Application Approved! 🎉', 'Ready for fee quote & offer letter generation')
      openInspector(inspector.formId, 'offer')
      loadData()
    } else {
      toast.error('Approval failed', json.error?.message)
    }
  }

  const handleRejectApplication = async (reason: string) => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.info('Application Rejected', `Reason: ${reason}`)
      setRejectReasonModal({ open: false })
      setRejectReasonText('')
      openInspector(inspector.formId, 'overview')
      loadData()
    } else {
      toast.error('Could not reject', json.error?.message)
    }
  }

  // ── Offer Generation & Acceptance ────────────────────────────────────────
  const handleGenerateOffer = async (validityDays: number = 7) => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        validityDays,
        branchId: selectedBranchId,
        academicYearId: selectedSessionId,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Admission Offer Issued! 📜', `${json.data.offer.offerNumber} valid for ${validityDays} days`)
      openInspector(inspector.formId, 'offer')
      loadData()
    } else {
      toast.error('Failed to issue offer', json.error?.message)
    }
  }

  const handleAcceptOffer = async () => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/offer/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ACCEPT' }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Offer Accepted by Parent! ✓', 'Application is ready for classroom allocation and student enrolment')
      openInspector(inspector.formId, 'enrollment')
      loadData()
    } else {
      toast.error('Could not record acceptance', json.error?.message)
    }
  }

  const handleDeclineOffer = async (declineReason: string) => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/offer/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DECLINE', declineReason }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.info('Offer Declined', 'Application status updated to Withdrawn')
      openInspector(inspector.formId, 'overview')
      loadData()
    } else {
      toast.error('Could not record decline', json.error?.message)
    }
  }

  // ── Final Enrollment ─────────────────────────────────────────────────────
  const handleCompleteEnrollment = async () => {
    if (!inspector.formId) return
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${inspector.formId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classroomId: selectedClassId || undefined,
        academicYearId: selectedSessionId,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Admission Completed! 🎉', `Student ${json.data.admissionNo} enrolled in ${json.data.classroomName}`)
      openInspector(inspector.formId, 'overview')
      loadData()
    } else {
      toast.error('Enrolment failed', json.error?.message)
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
      if (inspector.open) openInspector(formId, 'overview')
      loadData()
    } else {
      toast.error('Failed to waitlist', json.error?.message)
    }
  }

  // ── Pipeline & CRM Metrics Calculation ───────────────────────────────────
  const metrics = useMemo(() => {
    const totalLeads = enquiries?.length || 0
    const totalApps = applications?.length || 0
    const docsPending = applications?.filter((f) => f.documents?.some((d) => d.status !== 'VERIFIED' && !d.verified)).length || 0
    const counsellingDue = applications?.filter((f) => ['SUBMITTED', 'VERIFIED', 'COUNSELLING'].includes(f.status)).length || 0
    const pendingApproval = applications?.filter((f) => ['VERIFIED', 'COUNSELLING', 'PENDING_APPROVAL'].includes(f.status)).length || 0
    const offersIssued = applications?.filter((f) => f.status === 'OFFER_SENT').length || 0
    const offersAccepted = applications?.filter((f) => f.status === 'OFFER_ACCEPTED').length || 0
    const enrolledCount = applications?.filter((f) => ['ENROLLED', 'ADMITTED'].includes(f.status)).length || 0
    const waitlistedCount = applications?.filter((f) => f.status === 'WAITLISTED').length || 0
    const rejectedCount = applications?.filter((f) => f.status === 'REJECTED').length || 0

    // Conversion percentages
    const leadToAppPct = totalLeads > 0 ? Math.round((totalApps / totalLeads) * 100) : 0
    const appToOfferPct = totalApps > 0 ? Math.round(((offersIssued + offersAccepted + enrolledCount) / totalApps) * 100) : 0
    const offerToAdmPct = (offersIssued + offersAccepted + enrolledCount) > 0 ? Math.round((enrolledCount / (offersIssued + offersAccepted + enrolledCount)) * 100) : 0
    const leadToAdmPct = totalLeads > 0 ? Math.round((enrolledCount / totalLeads) * 100) : 0

    return {
      totalLeads, totalApps, docsPending, counsellingDue, pendingApproval,
      offersIssued, offersAccepted, enrolledCount, waitlistedCount, rejectedCount,
      leadToAppPct, appToOfferPct, offerToAdmPct, leadToAdmPct,
    }
  }, [enquiries, applications])

  const selectedSessionName = sessions.find((s) => s.id === selectedSessionId)?.name || 'Academic Year'
  const selectedBranchName = branches.find((b) => b.id === selectedBranchId)?.name || 'Branch'

  return (
    <>
      <PageHead
        title="Admissions & CRM"
        sub="Authoritative preschool admission journey: Lead → Follow-up → Application → Verification → Counselling → Approval → Offer → Enrolment."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setEnquiryModal(true)}>
              <Plus size={15} /> New Enquiry
            </button>
            <button className="btn btn-primary" onClick={() => setFormModal(true)}>
              <Plus size={15} /> New Application
            </button>
          </div>
        }
      />

      {/* Canonical Metric Strip */}
      <div className="metric-strip" style={{ marginBottom: 16 }}>
        {[
          { label: 'Leads', count: metrics.totalLeads, color: 'var(--primary)', stage: '' },
          { label: 'Applications', count: metrics.totalApps, color: 'var(--accent)', stage: 'SUBMITTED' },
          { label: 'Docs Pending', count: metrics.docsPending, color: 'var(--warning)', stage: 'DOCUMENT_PENDING' },
          { label: 'Counselling', count: metrics.counsellingDue, color: '#06b6d4', stage: 'COUNSELLING' },
          { label: 'Approval', count: metrics.pendingApproval, color: '#ec4899', stage: 'PENDING_APPROVAL' },
          { label: 'Offers Sent', count: metrics.offersIssued, color: '#6366f1', stage: 'OFFER_SENT' },
          { label: 'Accepted', count: metrics.offersAccepted, color: 'var(--success)', stage: 'OFFER_ACCEPTED' },
          { label: 'Admitted', count: metrics.enrolledCount, color: 'var(--success)', stage: 'ENROLLED' },
        ].map((st) => (
          <div
            key={st.label}
            className="metric-cell"
            onClick={() => {
              setFilterStage(filterStage === st.stage ? '' : st.stage)
              setTab(st.stage === '' ? 'enquiries' : 'applications')
            }}
            style={{
              cursor: 'pointer',
              background: filterStage === st.stage ? 'var(--surface)' : undefined,
              boxShadow: filterStage === st.stage ? 'inset 0 0 0 2px var(--primary)' : undefined,
            }}
          >
            <div className="m-lbl" style={{ color: st.color }}>{st.label}</div>
            <div className="m-val" style={{ color: st.color }}>{st.count}</div>
            <div className="m-meta">Click to filter</div>
          </div>
        ))}
      </div>

      {/* Scope Context Bar */}
      <div className="school-context-bar" style={{ marginBottom: 16 }}>
        <div className="context-item">
          <label><Calendar size={14} style={{ color: 'var(--foreground-muted)' }} /> Academic Year:</label>
          <select
            className="select"
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

        <span className="context-divider" />

        <div className="context-item">
          <label><Building size={14} style={{ color: 'var(--foreground-muted)' }} /> Branch:</label>
          <select
            className="select"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.isMain ? '(Main Campus)' : ''}
              </option>
            ))}
          </select>
        </div>

        <span className="context-divider" />

        <div className="context-item">
          <label>Program:</label>
          <select
            className="select"
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

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="input-search" style={{ maxWidth: 220 }}>
            <Search size={14} />
            <input
              className="input"
              placeholder="Search leads, apps..."
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

      {/* ── 1. PIPELINE KANBAN VIEW ── */}
      {tab === 'pipeline' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {/* Column 1: New Enquiries */}
            <div className="card" style={{ padding: 14, background: 'var(--surface-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Leads / Enquiries ({enquiries?.filter((e) => ['NEW', 'CONTACTED'].includes(e.status)).length || 0})
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setEnquiryModal(true)}><Plus size={13} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                {enquiries?.filter((e) => ['NEW', 'CONTACTED'].includes(e.status)).map((e) => (
                  <div key={e.id} className="card" style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{e.leadNumber}</span>
                      <StatusBadge status={e.status} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4, color: 'var(--text)' }}>{e.childName || 'Child'}</div>
                    <div className="kc-meta">{e.parentName} · {e.phone}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span className="badge b-pink" style={{ fontSize: 11 }}>{enumLabel(e.interestedProgram || 'NURSERY')}</span>
                      <button className="btn btn-sm btn-primary" onClick={() => handleConvertEnquiry(e.id)} style={{ fontSize: 11 }}>
                        Start App
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Applications Under Review */}
            <div className="card" style={{ padding: 14, background: 'var(--surface-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Forms & Docs ({applications?.filter((a) => ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW'].includes(a.status)).length || 0})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                {applications?.filter((a) => ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW'].includes(a.status)).map((a) => (
                  <div key={a.id} className="card" style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{a.applicationNumber}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4, color: 'var(--text)' }}>{a.childName}</div>
                    <div className="kc-meta">{a.parentName} · {enumLabel(a.programType)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span className={`badge ${a.documents.every((d) => d.verified) ? 'b-success' : 'b-warning'}`} style={{ fontSize: 11 }}>
                        {a.documents.filter((d) => d.verified).length}/{a.documents.length} Docs
                      </span>
                      <button className="btn btn-sm btn-secondary" onClick={() => openInspector(a.id, 'documents')} style={{ fontSize: 11 }}>
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Approved & Offers Sent */}
            <div className="card" style={{ padding: 14, background: 'var(--surface-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: 'var(--info, #0284c7)' }}>
                  Approved / Offers ({applications?.filter((a) => ['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).length || 0})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                {applications?.filter((a) => ['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).map((a) => (
                  <div key={a.id} className="card" style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{a.applicationNumber}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4, color: 'var(--text)' }}>{a.childName}</div>
                    <div className="kc-meta">{a.parentName} · {enumLabel(a.programType)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span className="badge b-purple" style={{ fontSize: 11 }}>{enumLabel(a.status)}</span>
                      <button className="btn btn-sm btn-primary" onClick={() => openInspector(a.id, a.status === 'APPROVED' ? 'offer' : 'enrollment')} style={{ fontSize: 11 }}>
                        {a.status === 'OFFER_ACCEPTED' ? 'Enrol' : 'Offer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Final Admissions */}
            <div className="card" style={{ padding: 14, background: 'var(--surface-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', color: 'var(--success)' }}>
                  Admitted ({applications?.filter((a) => ['ENROLLED', 'ADMITTED'].includes(a.status)).length || 0})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                {applications?.filter((a) => ['ENROLLED', 'ADMITTED'].includes(a.status)).map((a) => (
                  <div key={a.id} className="card" style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{a.applicationNumber}</span>
                      <span className="badge b-success" style={{ fontSize: 11 }}>✓ Enrolled</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4, color: 'var(--text)' }}>{a.childName}</div>
                    <div className="kc-meta">{a.parentName} · {enumLabel(a.programType)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span className="badge b-blue" style={{ fontSize: 11 }}>Student Created</span>
                      <button className="btn btn-sm btn-ghost" onClick={() => openInspector(a.id, 'overview')} style={{ fontSize: 11 }}>
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ENQUIRIES TAB ── */}
      {tab === 'enquiries' && (
        <div style={{ marginTop: 16 }}>
          <DataTable<Enquiry>
            columns={[
              { key: 'leadNumber', header: 'Enquiry #', sortValue: (e) => e.leadNumber, render: (e) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.leadNumber}</span> },
              { key: 'childName', header: 'Child Name', sortValue: (e) => e.childName || '', render: (e) => <span className="cell-strong">{e.childName || '—'}</span> },
              { key: 'parentName', header: 'Parent / Contact', sortValue: (e) => e.parentName, render: (e) => (<>{e.parentName}<span className="cell-sub">{e.phone}</span></>) },
              { key: 'program', header: 'Program', sortValue: (e) => enumLabel(e.interestedProgram || 'NURSERY'), render: (e) => <span className="badge b-pink">{enumLabel(e.interestedProgram || 'NURSERY')}</span> },
              { key: 'source', header: 'Source', sortValue: (e) => e.source, render: (e) => enumLabel(e.source) },
              { key: 'status', header: 'Status', sortValue: (e) => e.status, render: (e) => <StatusBadge status={e.status} /> },
              { key: 'nextFollowUpAt', header: 'Next Action Due', sortValue: (e) => e.nextFollowUpAt || '', render: (e) => <span style={{ fontSize: 12 }}>{e.nextFollowUpAt ? fmtDate(e.nextFollowUpAt) : 'None set'}</span> },
            ]}
            data={enquiries || []}
            paginate
            exportFileName="enquiries.csv"
            emptyTitle="No enquiries recorded"
            emptyMessage={`No parent enquiries captured for ${selectedSessionName} at ${selectedBranchName}.`}
            rowActions={(enq) => {
              const acts: RowAction[] = [
                { label: 'Log follow-up', icon: <Phone size={14} />, onClick: () => setFollowUpModal({ open: true, enquiry: enq }) },
                { label: 'Schedule visit', icon: <Calendar size={14} />, onClick: () => setVisitModal({ open: true, enquiry: enq }) },
              ]
              if (enq.status !== 'CONVERTED') {
                acts.push({ label: 'Start application form', icon: <ClipboardList size={14} />, onClick: () => handleConvertEnquiry(enq.id) })
              }
              return acts
            }}
          />
        </div>
      )}

      {/* ── 3. FOLLOW-UPS TAB ── */}
      {tab === 'followups' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Parent Follow-up CRM Centre</h3>
            <p className="kc-meta">Scheduled calls, WhatsApp follow-ups, and enquiry callbacks.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Enquiry #</th>
                  <th>Child / Parent</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Next Follow-up Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enquiries?.filter((e) => e.nextFollowUpAt || e.status !== 'CONVERTED').map((enq) => (
                  <tr key={enq.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{enq.leadNumber}</td>
                    <td><b>{enq.childName || enq.parentName}</b> · {enq.parentName}</td>
                    <td>{enq.phone}</td>
                    <td><StatusBadge status={enq.status} /></td>
                    <td style={{ fontSize: 12 }}>{enq.nextFollowUpAt ? fmtDate(enq.nextFollowUpAt) : 'Immediate follow-up due'}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setFollowUpModal({ open: true, enquiry: enq })}>
                        <Phone size={13} /> Log Follow-up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. APPLICATIONS TAB ── */}
      {tab === 'applications' && (
        <div style={{ marginTop: 16 }}>
          <DataTable<ApplicationListItem>
            columns={[
              { key: 'applicationNumber', header: 'Form #', sortValue: (f) => f.applicationNumber, render: (f) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{f.applicationNumber}</span> },
              { key: 'childName', header: 'Child Name', sortValue: (f) => f.childName, render: (f) => <span className="cell-strong">{f.childName}</span> },
              { key: 'program', header: 'Program', sortValue: (f) => enumLabel(f.programType), render: (f) => <span className="badge b-pink">{enumLabel(f.programType)}</span> },
              { key: 'parentName', header: 'Parent / Phone', sortValue: (f) => f.parentName, render: (f) => (<>{f.parentName}<span className="cell-sub">{f.parentPhone}</span></>) },
              {
                key: 'docs', header: 'Documents', sortValue: (f) => f.documents.filter((d) => d.status === 'VERIFIED' || d.verified).length,
                render: (f) => (
                  <span className={`badge ${f.documents.every((d) => d.status === 'VERIFIED' || d.verified) ? 'b-success' : f.documents.some((d) => d.status === 'REJECTED') ? 'b-danger' : 'b-warning'}`}>
                    {f.documents.filter((d) => d.status === 'VERIFIED' || d.verified).length}/{f.documents.length} verified
                  </span>
                ),
              },
              { key: 'status', header: 'Stage Status', sortValue: (f) => f.status, render: (f) => <StatusBadge status={f.status} /> },
            ]}
            data={applications || []}
            paginate
            exportFileName="applications.csv"
            emptyTitle="No Admission Applications"
            emptyMessage={`No admission forms submitted for ${selectedSessionName} at this branch.`}
            rowActions={(f) => [{ label: 'Inspect application', icon: <Eye size={14} />, onClick: () => openInspector(f.id) }]}
          />
        </div>
      )}

      {/* ── 5. WAITING LIST TAB ── */}
      {tab === 'waitlist' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Waiting List Management</h3>
            <p className="kc-meta">Applications held due to full classroom sections. Re-evaluate as seats become available.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th><th>Child</th><th>Program</th><th>Parent</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications?.filter((f) => f.status === 'WAITLISTED').map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{f.applicationNumber}</td>
                    <td><b>{f.childName}</b></td>
                    <td>{enumLabel(f.programType)}</td>
                    <td>{f.parentName} ({f.parentPhone})</td>
                    <td><StatusBadge status={f.status} /></td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => openInspector(f.id, 'approval')}>
                        Re-evaluate & Allocate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications?.filter((f) => f.status === 'WAITLISTED').length === 0 && (
              <EmptyState
                icon={<Users size={40} />}
                title="Waiting list is empty"
                message="All approved applicants have been successfully enrolled in sections."
              />
            )}
          </div>
        </div>
      )}

      {/* ── 6. ADMISSIONS TAB ── */}
      {tab === 'admissions' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Enrolled Students ({selectedSessionName})</h3>
            <p className="kc-meta">Active student master records, parent links, section allocations & finance linkages.</p>
          </div>
          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th><th>Child</th><th>Program</th><th>Parent</th><th>Student Status</th><th>Admitted Date</th><th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {applications?.filter((f) => ['ENROLLED', 'ADMITTED'].includes(f.status)).map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{f.applicationNumber}</td>
                    <td><b>{f.childName}</b></td>
                    <td><span className="badge b-pink">{enumLabel(f.programType)}</span></td>
                    <td>{f.parentName} ({f.parentPhone})</td>
                    <td><span className="badge b-success">Active Student</span></td>
                    <td>{f.approvedAt ? fmtDate(f.approvedAt) : fmtDate(f.submittedAt)}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => openInspector(f.id)}>
                        <Eye size={13} /> View File
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications?.filter((f) => ['ENROLLED', 'ADMITTED'].includes(f.status)).length === 0 && (
              <EmptyState
                icon={<UserCheck size={40} />}
                title="No New Admissions Completed"
                message="Complete admission approval and offer acceptance to enroll students."
              />
            )}
          </div>
        </div>
      )}

      {/* ── 7. CRM REPORTS TAB ── */}
      {tab === 'reports' && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div className="card" style={{ padding: 18, borderTop: '4px solid #3b82f6' }}>
              <div className="t-caption">Lead → Application Rate</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{metrics.leadToAppPct}%</div>
              <div className="kc-meta">{metrics.totalApps} applications from {metrics.totalLeads} enquiries</div>
            </div>
            <div className="card" style={{ padding: 18, borderTop: '4px solid #8b5cf6' }}>
              <div className="t-caption">Application → Offer Rate</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{metrics.appToOfferPct}%</div>
              <div className="kc-meta">{metrics.offersIssued + metrics.offersAccepted + metrics.enrolledCount} offers generated</div>
            </div>
            <div className="card" style={{ padding: 18, borderTop: '4px solid #10b981' }}>
              <div className="t-caption">Offer → Admission Rate</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{metrics.offerToAdmPct}%</div>
              <div className="kc-meta">{metrics.enrolledCount} enrolled from offers</div>
            </div>
            <div className="card" style={{ padding: 18, borderTop: '4px solid #06b6d4' }}>
              <div className="t-caption">Overall Conversion (Lead → Admitted)</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{metrics.leadToAdmPct}%</div>
              <div className="kc-meta">{metrics.enrolledCount} final admissions</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: APPLICATION INSPECTOR (FULL MULTI-TAB CRM INSPECTION) ── */}
      <Modal
        open={inspector.open}
        onClose={() => setInspector({ open: false, formId: null, data: null, tab: 'overview' })}
        title={inspector.data ? `Admission File: ${inspector.data.application.applicationNumber}` : 'Application Inspector'}
        subtitle={inspector.data ? `${inspector.data.application.childFirstName} ${inspector.data.application.childLastName || ''} · ${enumLabel(inspector.data.application.programType)} (${selectedSessionName})` : ''}
        icon={<FileCheck2 size={22} />}
        wide
      >
        {inspector.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Inspector Sub-Tabs */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'child', label: 'Child' },
                { key: 'parent', label: 'Parent & Siblings' },
                { key: 'documents', label: `Documents (${inspector.data.requirements.documentsCheck.verified}/${inspector.data.requirements.documentsCheck.total})` },
                { key: 'counselling', label: 'Counselling' },
                { key: 'approval', label: 'Approval Gate' },
                { key: 'offer', label: 'Fee & Offer' },
                { key: 'enrollment', label: 'Enrolment' },
                { key: 'timeline', label: 'Audit Timeline' },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`btn btn-sm ${inspector.tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setInspector((prev) => ({ ...prev, tab: t.key }))}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            {inspector.tab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div className="card" style={{ padding: 12 }}>
                    <div className="t-caption">Application Stage</div>
                    <div style={{ marginTop: 4 }}><StatusBadge status={inspector.data.application.status} /></div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div className="t-caption">Originating Lead</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                      {inspector.data.application.lead?.leadNumber || 'Direct Walk-in'}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div className="t-caption">Submitted On</div>
                    <div style={{ marginTop: 4 }}>{fmtDate(inspector.data.application.submittedAt || new Date().toISOString())}</div>
                  </div>
                  <div className="card" style={{ padding: 12 }}>
                    <div className="t-caption">Branch & Session</div>
                    <div style={{ marginTop: 4 }}>{selectedBranchName} · {selectedSessionName}</div>
                  </div>
                </div>

                {inspector.data.application.notes && (
                  <div className="card" style={{ padding: 14, background: '#f8fafc' }}>
                    <h5 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Counselor / Application Notes</h5>
                    <p style={{ fontSize: 13, whiteSpace: 'pre-line' }}>{inspector.data.application.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CHILD DETAILS */}
            {inspector.tab === 'child' && (
              <div className="form-grid">
                <div className="field"><label>Child First Name</label><input className="input" readOnly value={inspector.data.application.childFirstName} /></div>
                <div className="field"><label>Child Last Name</label><input className="input" readOnly value={inspector.data.application.childLastName || '—'} /></div>
                <div className="field"><label>Date of Birth</label><input className="input" readOnly value={fmtDate(inspector.data.application.childDob)} /></div>
                <div className="field"><label>Calculated Age</label><input className="input" readOnly value={`${inspector.data.requirements.ageRequirement.ageMonths} months`} /></div>
                <div className="field"><label>Gender</label><input className="input" readOnly value={enumLabel(inspector.data.application.childGender)} /></div>
                <div className="field"><label>Previous School</label><input className="input" readOnly value={inspector.data.application.previousSchool || 'None (First time admission)'} /></div>
              </div>
            )}

            {/* TAB: PARENT & SIBLINGS */}
            {inspector.tab === 'parent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-grid">
                  <div className="field"><label>Primary Guardian Name</label><input className="input" readOnly value={inspector.data.application.parentName} /></div>
                  <div className="field"><label>Phone Number</label><input className="input" readOnly value={inspector.data.application.parentPhone} /></div>
                  <div className="field"><label>Email Address</label><input className="input" readOnly value={inspector.data.application.parentEmail || '—'} /></div>
                </div>

                {/* Sibling Logic Card */}
                <div className="card" style={{ padding: 14, borderLeft: '4px solid #8b5cf6' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>Sibling & Existing Child Connectivity</h4>
                  {inspector.data.requirements.siblingConcession.hasSibling ? (
                    <div style={{ marginTop: 8 }}>
                      <p className="kc-meta">Matching guardian phone found for the following enrolled student(s):</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {inspector.data.requirements.siblingConcession.existingChildren.map((sib) => (
                          <div key={sib.studentId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 13 }}>
                            <span><b>{sib.name}</b> ({sib.admissionNo})</span>
                            <span className="badge b-purple">{sib.classroom}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12.5, color: '#10b981', fontWeight: 600 }}>
                        ✓ Sibling Concession Eligible: {inspector.data.requirements.siblingConcession.applicableDiscountPercent}% discount applicable on Tuition Fee.
                      </div>
                    </div>
                  ) : (
                    <p className="kc-meta" style={{ marginTop: 6 }}>No other children currently enrolled under this guardian contact.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTS CHECKLIST & WORKFLOW */}
            {inspector.tab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>Authoritative Document Verification Checklist</h4>
                  <button className="btn btn-sm btn-secondary" onClick={handleVerifyAllDocuments} disabled={busy}>
                    Verify All Pending
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {inspector.data.application.documents.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--surface-card, #ffffff)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: 8,
                        padding: '10px 14px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${d.status === 'VERIFIED' || d.verified ? 'b-success' : d.status === 'REJECTED' ? 'b-danger' : 'b-warning'}`}>
                            {d.status === 'VERIFIED' || d.verified ? '✓ Verified' : d.status === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{enumLabel(d.docType)}</span>
                        </div>
                        {d.rejectionReason && (
                          <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                            Rejection Reason: {d.rejectionReason}
                          </div>
                        )}
                        {d.remarks && !d.rejectionReason && (
                          <div className="kc-meta" style={{ marginTop: 2 }}>{d.remarks}</div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {d.status !== 'VERIFIED' && !d.verified && (
                          <>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                const reason = prompt('Enter document rejection reason (mandatory):')
                                if (reason && reason.trim()) {
                                  handleVerifyDocument(d.id, 'REJECT', reason.trim())
                                }
                              }}
                              disabled={busy}
                            >
                              Reject
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleVerifyDocument(d.id, 'VERIFY')}
                              disabled={busy}
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
            )}

            {/* TAB: COUNSELLING */}
            {inspector.tab === 'counselling' && (
              <form onSubmit={handleSaveCounselling} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>Record Counselling Session & Child Interaction</h4>
                <div className="form-grid">
                  <div className="field">
                    <label>Session Date & Time <span className="req">*</span></label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={counsellingForm.scheduledAt}
                      onChange={(e) => setCounsellingForm({ ...counsellingForm, scheduledAt: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Counselor Name</label>
                    <input
                      className="input"
                      placeholder="e.g. Meera Desai"
                      value={counsellingForm.counselorName}
                      onChange={(e) => setCounsellingForm({ ...counsellingForm, counselorName: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Mode</label>
                    <select
                      className="select"
                      value={counsellingForm.mode}
                      onChange={(e) => setCounsellingForm({ ...counsellingForm, mode: e.target.value })}
                    >
                      <option value="IN_PERSON">In-Person Campus Visit</option>
                      <option value="PHONE">Phone Consultation</option>
                      <option value="VIDEO">Video Meeting</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Interaction Outcome <span className="req">*</span></label>
                    <select
                      className="select"
                      value={counsellingForm.outcome}
                      onChange={(e) => setCounsellingForm({ ...counsellingForm, outcome: e.target.value })}
                    >
                      <option value="POSITIVE">Positive / Recommend Admission</option>
                      <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                      <option value="NOT_INTERESTED">Parent Not Interested</option>
                      <option value="REFERRED">Referred to Special Program</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Counselling Notes / Observations</label>
                  <textarea
                    className="textarea"
                    placeholder="Child demonstrated readiness for Nursery, engaged well in play area..."
                    value={counsellingForm.notes}
                    onChange={(e) => setCounsellingForm({ ...counsellingForm, notes: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="btn btn-primary" disabled={busy}>
                    Save Counselling & Proceed
                  </button>
                </div>
              </form>
            )}

            {/* TAB: APPROVAL GATE */}
            {inspector.tab === 'approval' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ padding: 14, background: '#f8fafc' }}>
                  <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                    Authoritative Approval Gate Assessment
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {inspector.data.requirements.ageRequirement.eligible ? (
                        <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                      ) : (
                        <XCircle size={18} style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ fontSize: 13 }}>
                        Age Requirement ({inspector.data.requirements.ageRequirement.ageMonths}m)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {inspector.data.requirements.documentsCheck.isComplete ? (
                        <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                      ) : (
                        <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                      )}
                      <span style={{ fontSize: 13 }}>
                        Documents ({inspector.data.requirements.documentsCheck.verified}/{inspector.data.requirements.documentsCheck.total})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {inspector.data.requirements.capacityCheck.hasAvailableCapacity ? (
                        <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                      ) : (
                        <XCircle size={18} style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ fontSize: 13 }}>Classroom Capacity Available</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    className="btn btn-danger"
                    disabled={busy || ['ENROLLED', 'REJECTED'].includes(inspector.data.application.status)}
                    onClick={() => {
                      const reason = prompt('Enter application rejection reason (AGE_NOT_ELIGIBLE, DOCUMENT_INCOMPLETE, CAPACITY_FULL, etc.):')
                      if (reason && reason.trim()) handleRejectApplication(reason.trim())
                    }}
                  >
                    Reject Application
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={busy || ['ENROLLED', 'WAITLISTED'].includes(inspector.data.application.status)}
                    onClick={() => handleWaitlist(inspector.formId!)}
                  >
                    Move to Waiting List
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={busy || !inspector.data.requirements.isReadyForApproval || ['APPROVED', 'ENROLLED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(inspector.data.application.status)}
                    onClick={() => handleApproveApplication()}
                  >
                    <ThumbsUp size={15} /> Authorize & Approve Application
                  </button>
                </div>
              </div>
            )}

            {/* TAB: FEE QUOTE & OFFER LETTER */}
            {inspector.tab === 'offer' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {inspector.data.requirements.feePlanQuote && (
                  <div className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600 }}>Applicable Fee Plan: {inspector.data.requirements.feePlanQuote.name}</h4>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                        ₹{inspector.data.requirements.feePlanQuote.totalAnnualRupees.toLocaleString('en-IN')}/yr
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
                      {inspector.data.requirements.feePlanQuote.items.map((it, idx) => (
                        <div key={idx} style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                          <b>{it.label}:</b> ₹{it.amountRupees.toLocaleString('en-IN')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Branded Offer Letter View or Generator */}
                {inspector.data.application.offers.length > 0 ? (
                  <div className="card" style={{ padding: 16, border: '2px solid #7c3aed', background: '#fcfaff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9d5ff', paddingBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase' }}>Official Admission Offer</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{inspector.data.application.offers[0].offerNumber}</div>
                      </div>
                      <StatusBadge status={inspector.data.application.offers[0].status} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12, fontSize: 13 }}>
                      <div><b>Child:</b> {inspector.data.application.offers[0].childName}</div>
                      <div><b>Parent:</b> {inspector.data.application.offers[0].parentName}</div>
                      <div><b>Valid Until:</b> {fmtDate(inspector.data.application.offers[0].validUntil)}</div>
                      <div><b>Annual Total:</b> ₹{(inspector.data.application.offers[0].feeTotalCents / 100).toLocaleString('en-IN')}</div>
                    </div>

                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {inspector.data.application.offers[0].status === 'ISSUED' && (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeclineOffer('Parent declined')} disabled={busy}>
                            Decline Offer
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={handleAcceptOffer} disabled={busy}>
                            <Check size={14} /> Record Parent Acceptance
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p className="kc-meta">No offer letter has been generated yet for this application.</p>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 12 }}
                      disabled={busy}
                      onClick={() => handleGenerateOffer(7)}
                    >
                      <Send size={15} /> Generate Official Admission Offer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: FINAL ENROLMENT & SECTION ALLOCATION */}
            {inspector.tab === 'enrollment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Classroom / Section Allocation</h4>
                  <div className="field">
                    <label>Select Target Section <span className="req">*</span></label>
                    <select
                      className="select"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      {inspector.data.requirements.capacityCheck.sections.map((s) => (
                        <option key={s.id} value={s.id} disabled={!s.hasSeat}>
                          {s.name} — Capacity: {s.capacity} | Enrolled: {s.enrolled} | Available: {s.available} {s.hasSeat ? '✓' : '(FULL)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    disabled={busy || !selectedClassId || ['ENROLLED', 'ADMITTED'].includes(inspector.data.application.status)}
                    onClick={handleCompleteEnrollment}
                  >
                    <Award size={15} /> Complete Final Admission & Enrol Student
                  </button>
                </div>
              </div>
            )}

            {/* TAB: AUDIT TIMELINE */}
            {inspector.tab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>Immutable Admission Audit History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                  {inspector.data.timeline.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12.5 }}>
                      <div style={{ minWidth: 120, color: '#64748b' }}>{fmtDate(item.createdAt)}</div>
                      <div style={{ flex: 1 }}>
                        <span className="badge b-blue" style={{ fontSize: 11, marginRight: 8 }}>{item.action}</span>
                        <span>{item.summary}</span>
                        {item.actorName && <span className="kc-meta"> (by {item.actorName})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

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
          <EnterNav>
          <div className="form-grid">
            <div className="field">
              <label>Parent Name <span className="req">*</span></label>
              <input className="input" name="parentName" required placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="field">
              <label>Phone Number <span className="req">*</span></label>
              <MaskedInput name="phone" mask="phone" required />
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
              <DatePicker name="childDob" value={enquiryDob} onChange={setEnquiryDob} placeholder="Date of birth" />
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
          </EnterNav>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setEnquiryModal(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Record Enquiry</button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: NEW ADMISSION FORM WITH DUPLICATE INTERCEPT ── */}
      <Modal
        open={formModal}
        onClose={() => { setFormModal(false); setDuplicateWarning(null); setPendingFormPayload(null); }}
        title="New Admission Application"
        subtitle={`Academic Year: ${selectedSessionName} · Branch: ${selectedBranchName}`}
        icon={<ClipboardList size={22} />}
        wide
      >
        {duplicateWarning ? (
          <div style={{ padding: 14, background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 600 }}>
              <AlertTriangle size={20} /> Possible Duplicate Application Detected
            </div>
            <p style={{ marginTop: 8, fontSize: 13 }}>{duplicateWarning}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setDuplicateWarning(null); setPendingFormPayload(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleConfirmDuplicateApplication} disabled={busy}>
                Confirm & Create Application Anyway
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateApplication}>
            <Wizard
              steps={[
                { title: 'Child details', sub: 'Name, DOB, program' },
                { title: 'Parent contact', sub: 'Guardian information' },
                { title: 'Address & review', sub: 'Confirm & submit' },
              ]}
              current={appStep}
              onChange={setAppStep}
            />
            <EnterNav>
            {appStep === 0 && (
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
                  <DatePicker name="childDob" value={appDob} onChange={setAppDob} placeholder="Date of birth" />
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
              </div>
            )}
            {appStep === 1 && (
              <div className="form-grid">
                <div className="field">
                  <label>Parent Name <span className="req">*</span></label>
                  <input className="input" name="parentName" required placeholder="Rahul Sharma" />
                </div>
                <div className="field">
                  <label>Parent Phone <span className="req">*</span></label>
                  <MaskedInput name="parentPhone" mask="phone" required />
                </div>
                <div className="field">
                  <label>Parent Email</label>
                  <input className="input" name="parentEmail" type="email" placeholder="rahul@example.com" />
                </div>
              </div>
            )}
            {appStep === 2 && (
              <>
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Residential Address</label>
                  <input className="input" name="address" placeholder="Flat 402, Sunshine Residency..." />
                </div>
                <div className="panel" style={{ marginTop: 4, background: 'var(--surface-muted)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <FileCheck2 size={16} style={{ color: 'var(--preone-primary)' }} />
                    <b style={{ fontSize: 13 }}>Review application details</b>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '6px 12px' }}>
                    {appSummary.map((r) => (
                      <React.Fragment key={r.k}>
                        <span className="txt-muted" style={{ fontSize: 12.5 }}>{r.k}</span>
                        <b style={{ fontSize: 12.5 }}>{r.v}</b>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </>
            )}
            </EnterNav>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setFormModal(false)}>Cancel</button>
              {appStep > 0 && (
                <button type="button" className="btn btn-outline" onClick={() => setAppStep((s) => s - 1)}>Back</button>
              )}
              {appStep < 2 ? (
                <button type="button" className="btn btn-secondary" onClick={nextStep}>Next <ChevronRight size={15} /></button>
              ) : (
                <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Submit Application</button>
              )}
            </div>
          </form>
        )}
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
            <textarea className="textarea" name="note" required placeholder="Discussed curriculum, parent requested campus visit..." />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Next Follow-up Due</label>
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
        title="Schedule Campus Visit & Counselling"
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
            <textarea className="textarea" name="notes" placeholder="Needs classroom walk-through, meeting with academic coordinator..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setVisitModal({ open: false, enquiry: null })}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>Confirm Campus Visit</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
