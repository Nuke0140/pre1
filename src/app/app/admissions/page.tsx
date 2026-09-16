'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Phone, UserCheck, UserX, Clock3, FileCheck2, ClipboardList,
  ThumbsUp, ChevronRight, Calendar, Building, Search, Eye, AlertCircle,
  FileText, CheckCircle2, XCircle, Clock, Users, ArrowRight, Check,
  Send, UserPlus, HeartHandshake, AlertTriangle, RefreshCw, ChevronDown,
  Download, Printer, DollarSign, History, ShieldAlert, Award, X,
  MessageCircle, FileSignature, GraduationCap, BarChart3, Filter,
  ArrowUpRight, ArrowDownRight, Layers, Sparkles, User, Info, CheckCircle
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

/** Calculate age in months from a date-of-birth string */
function calculateAgeMonths(dobString: string): number | null {
  if (!dobString) return null
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return null
  const now = new Date()
  const years = now.getFullYear() - dob.getFullYear()
  const months = now.getMonth() - dob.getMonth()
  const days = now.getDate() - dob.getDate()
  let totalMonths = years * 12 + months
  if (days < 0) totalMonths -= 1
  return Math.max(0, totalMonths)
}

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
  const [appProgramType, setAppProgramType] = useState('NURSERY')
  const [appStep, setAppStep] = useState(0)
  const [appSummary, setAppSummary] = useState<{ k: string; v: string }[]>([])

  // Computed age for application wizard live feedback
  const appAgeMonths = useMemo(() => calculateAgeMonths(appDob), [appDob])
  const selectedProgramDetails = useMemo(() => {
    return programs.find((p) => (p.programType || p.code) === appProgramType)
  }, [programs, appProgramType])

  const appAgeEligibility = useMemo(() => {
    if (appAgeMonths === null || !selectedProgramDetails) return null
    const min = selectedProgramDetails.ageMinMonths
    const max = selectedProgramDetails.ageMaxMonths
    if (min !== null && appAgeMonths < min) {
      return { eligible: false, message: `Child is ${appAgeMonths}m old. Recommended minimum for ${selectedProgramDetails.name} is ${min} months.` }
    }
    if (max !== null && appAgeMonths > max) {
      return { eligible: false, message: `Child is ${appAgeMonths}m old. Recommended limit for ${selectedProgramDetails.name} is ${max} months.` }
    }
    return { eligible: true, message: `Child is ${appAgeMonths} months old. Eligible for ${selectedProgramDetails.name}.` }
  }, [appAgeMonths, selectedProgramDetails])

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

  // CSV Bulk Import Wizard State
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvStep, setCsvStep] = useState(0)
  const [csvType, setCsvType] = useState<'leads' | 'applications'>('leads')
  const [csvRawText, setCsvRawText] = useState('')
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRawRows, setCsvRawRows] = useState<any[]>([])
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({})
  const [csvValidationResult, setCsvValidationResult] = useState<any>(null)
  const [csvDuplicateAction, setCsvDuplicateAction] = useState<'SKIP' | 'CREATE' | 'LINK'>('SKIP')
  const [csvImportResult, setCsvImportResult] = useState<any>(null)
  const [csvLoading, setCsvLoading] = useState(false)

  // Allocation Engine Modal State
  const [allocModal, setAllocModal] = useState<{
    open: boolean
    applicationId: string | null
    data: any
    loading: boolean
    selectedClassId?: string
  }>({
    open: false,
    applicationId: null,
    data: null,
    loading: false,
  })

  const handleParseCsv = (content: string) => {
    setCsvRawText(content)
    const lines = content.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) {
      toast('CSV file must have a header row and at least one data row', 'error')
      return
    }
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))
    setCsvHeaders(headers)

    const rows: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
      const obj: any = {}
      headers.forEach((h, idx) => {
        obj[h] = vals[idx] || ''
      })
      rows.push(obj)
    }
    setCsvRawRows(rows)

    const initialMapping: Record<string, string> = {}
    const canonicalFields = csvType === 'leads'
      ? [
          { key: 'parentName', aliases: ['parent_name', 'parent', 'guardian', 'father_name', 'mother_name'] },
          { key: 'phone', aliases: ['parent_phone', 'phone', 'mobile', 'contact'] },
          { key: 'email', aliases: ['parent_email', 'email'] },
          { key: 'childName', aliases: ['child_name', 'student_name', 'child'] },
          { key: 'dob', aliases: ['child_dob', 'dob', 'date_of_birth', 'birth_date'] },
          { key: 'program', aliases: ['interested_program', 'program', 'class', 'grade'] },
          { key: 'notes', aliases: ['notes', 'remarks', 'comment'] },
        ]
      : [
          { key: 'childFirstName', aliases: ['child_first_name', 'first_name', 'name'] },
          { key: 'childLastName', aliases: ['child_last_name', 'last_name', 'surname'] },
          { key: 'dob', aliases: ['dob', 'date_of_birth', 'child_dob'] },
          { key: 'gender', aliases: ['gender', 'sex'] },
          { key: 'program', aliases: ['program', 'program_type', 'class'] },
          { key: 'parentName', aliases: ['parent_name', 'guardian_name', 'father_name'] },
          { key: 'parentPhone', aliases: ['parent_phone', 'phone', 'mobile'] },
          { key: 'parentEmail', aliases: ['parent_email', 'email'] },
          { key: 'address', aliases: ['address', 'residence', 'location'] },
          { key: 'notes', aliases: ['notes', 'remarks'] },
        ]

    canonicalFields.forEach((cf) => {
      const match = headers.find((h) => {
        const clean = h.toLowerCase().replace(/[\s_-]/g, '')
        return cf.aliases.some((a) => a.replace(/[\s_-]/g, '') === clean) || clean === cf.key.toLowerCase()
      })
      if (match) initialMapping[cf.key] = match
    })
    setCsvMapping(initialMapping)
    setCsvStep(1)
  }

  const handleValidateCsv = async () => {
    setCsvLoading(true)
    try {
      const res = await fetch('/api/v1/admissions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          type: csvType,
          rows: csvRawRows,
          mapping: csvMapping,
          branchId: selectedBranchId,
          academicYearId: selectedSessionId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCsvValidationResult(json.data)
        setCsvStep(2)
      } else {
        toast(json.error?.message || 'Validation failed', 'error')
      }
    } catch (err) {
      toast('Failed to validate CSV rows', 'error')
    } finally {
      setCsvLoading(false)
    }
  }

  const handleExecuteCsvImport = async () => {
    setCsvLoading(true)
    try {
      const res = await fetch('/api/v1/admissions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          type: csvType,
          rows: csvValidationResult.rows,
          duplicateAction: csvDuplicateAction,
          branchId: selectedBranchId,
          academicYearId: selectedSessionId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCsvImportResult(json.data)
        setCsvStep(4)
        toast(`Import Batch ${json.data.batchId} completed!`, 'success')
        loadData()
      } else {
        toast(json.error?.message || 'Import execution failed', 'error')
      }
    } catch (err) {
      toast('Failed to execute batch import', 'error')
    } finally {
      setCsvLoading(false)
    }
  }

  const openAllocationModal = async (appId: string) => {
    setAllocModal({ open: true, applicationId: appId, data: null, loading: true })
    try {
      const res = await fetch(`/api/v1/applications/${appId}/allocation`)
      const json = await res.json()
      if (json.success) {
        setAllocModal({
          open: true,
          applicationId: appId,
          data: json.data,
          loading: false,
          selectedClassId: json.data.recommendedClassroomId || json.data.divisions[0]?.id || '',
        })
      } else {
        toast(json.error?.message || 'Failed to load allocation options', 'error')
      }
    } catch (err) {
      toast('Failed to evaluate allocation options', 'error')
      setAllocModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleConfirmAllocation = async (action: 'allocate' | 'waitlist') => {
    if (!allocModal.applicationId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${allocModal.applicationId}/allocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          classroomId: allocModal.selectedClassId,
          academicYearId: selectedSessionId,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast(action === 'waitlist' ? 'Application placed on Waiting List' : `Allocated to ${json.data.classroomName}!`, 'success')
        setAllocModal({ open: false, applicationId: null, data: null, loading: false })
        loadData()
        if (inspector.open && inspector.formId === allocModal.applicationId) {
          openInspector(allocModal.applicationId)
        }
      } else {
        toast(json.error?.message || 'Allocation failed', 'error')
      }
    } catch (err) {
      toast('Allocation request failed', 'error')
    } finally {
      setBusy(false)
    }
  }

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

  // Operational Journey Stages configuration
  const journeyStages = [
    { label: 'Leads', count: metrics.totalLeads, subtext: 'New enquiries', stage: '', icon: <Users size={15} />, iconBg: '#EAF2FE', iconColor: '#3B82F6' },
    { label: 'Applications', count: metrics.totalApps, subtext: 'In progress', stage: 'SUBMITTED', icon: <FileText size={15} />, iconBg: '#F0ECFF', iconColor: '#5B3DF5' },
    { label: 'Docs Pending', count: metrics.docsPending, subtext: 'Need verification', stage: 'DOCUMENT_PENDING', icon: <ClipboardList size={15} />, iconBg: '#FEF3DD', iconColor: '#F59E0B' },
    { label: 'Counselling', count: metrics.counsellingDue, subtext: 'Due today', stage: 'COUNSELLING', icon: <MessageCircle size={15} />, iconBg: '#E0F2FE', iconColor: '#0284C7' },
    { label: 'Approval', count: metrics.pendingApproval, subtext: 'Awaiting review', stage: 'PENDING_APPROVAL', icon: <ShieldAlert size={15} />, iconBg: '#FCE7F3', iconColor: '#DB2777' },
    { label: 'Offers Sent', count: metrics.offersIssued, subtext: 'Issued', stage: 'OFFER_SENT', icon: <FileSignature size={15} />, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
    { label: 'Accepted', count: metrics.offersAccepted, subtext: 'Confirmed', stage: 'OFFER_ACCEPTED', icon: <CheckCircle2 size={15} />, iconBg: '#E8F8F2', iconColor: '#10B981' },
    { label: 'Admitted', count: metrics.enrolledCount, subtext: 'Enrolled', stage: 'ENROLLED', icon: <GraduationCap size={15} />, iconBg: '#E8F8F2', iconColor: '#059669' },
  ]

  // Enquiries source badge color mapper
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'WALK_IN': return { cls: 'b-blue', label: 'Walk-in' }
      case 'WEBSITE': return { cls: 'b-purple', label: 'Website' }
      case 'REFERRAL': return { cls: 'b-success', label: 'Referral' }
      case 'PHONE': return { cls: 'b-info', label: 'Phone' }
      case 'FACEBOOK':
      case 'INSTAGRAM':
      case 'SOCIAL_MEDIA': return { cls: 'b-pink', label: 'Social Media' }
      case 'EVENT': return { cls: 'b-orange', label: 'Event' }
      default: return { cls: 'b-neutral', label: enumLabel(source) }
    }
  }

  return (
    <div className="admissions-container">
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5B3DF5', background: '#F0ECFF', padding: '3px 9px', borderRadius: 6 }}>
              PREONE OPS
            </span>
            <span style={{ fontSize: 12, color: '#8A94A8', fontWeight: 500 }}>
              {selectedSessionName} · {selectedBranchName}
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#15254A', letterSpacing: '-0.025em', margin: 0 }}>
            Admissions & CRM
          </h1>
          <p style={{ fontSize: 14.5, color: '#66738F', margin: '4px 0 0', maxWidth: 640, lineHeight: 1.45 }}>
            Manage enquiries, applications, follow-ups and student enrollment.
          </p>
        </div>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setEnquiryModal(true)}
            style={{
              height: 42,
              padding: '0 16px',
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #E7EAF2',
              color: '#15254A',
              fontWeight: 650,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(21,37,74,0.04)',
              cursor: 'pointer',
            }}
          >
            <UserPlus size={15} style={{ color: '#5B3DF5' }} />
            <span>+ New Lead</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => { setCsvModalOpen(true); setCsvStep(0); setCsvImportResult(null); setCsvValidationResult(null); }}
            style={{
              height: 42,
              padding: '0 16px',
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #E7EAF2',
              color: '#15254A',
              fontWeight: 650,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 2px rgba(21,37,74,0.04)',
              cursor: 'pointer',
            }}
          >
            <Download size={15} style={{ color: '#2563EB' }} />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setFormModal(true)}
            style={{
              height: 42,
              padding: '0 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #5B3DF5 0%, #4528C7 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 650,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(91,61,245,0.25)',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            <span>+ New Application</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setTab('waiting')}
            style={{
              height: 42,
              padding: '0 14px',
              borderRadius: 12,
              background: tab === 'waiting' ? '#FEF3C7' : '#FFFFFF',
              border: '1px solid #E7EAF2',
              color: tab === 'waiting' ? '#92400E' : '#66738F',
              fontWeight: 650,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Clock size={15} />
            <span>Waiting List</span>
          </button>
        </div>
      </div>

      {/* ── Canonical 8-Stage Operational Journey Strip ── */}
      <div className="adm-journey-strip" role="region" aria-label="Admission operational journey stages">
        {journeyStages.map((st) => {
          const isSelected = filterStage === st.stage
          return (
            <button
              key={st.label}
              type="button"
              className={`adm-journey-cell ${isSelected ? 'is-selected' : ''}`}
              onClick={() => {
                setFilterStage(isSelected ? '' : st.stage)
                setTab(st.stage === '' ? 'enquiries' : 'applications')
              }}
              title={`Filter by ${st.label}`}
            >
              <div className="adm-journey-head">
                <span className="adm-journey-lbl">{st.label}</span>
                <div className="adm-journey-icon" style={{ background: st.iconBg, color: st.iconColor }}>
                  {st.icon}
                </div>
              </div>
              <div className="adm-journey-val">
                {st.count}
              </div>
              <div className="adm-journey-meta">
                {isSelected ? 'Active filter' : st.subtext}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Refined School Context Toolbar ── */}
      <div className="adm-context-toolbar">
        <div className="adm-context-badge">
          <Layers size={13} />
          <span>CONTEXT</span>
        </div>

        {/* Academic Session */}
        <div className="adm-context-field">
          <label><Calendar size={14} style={{ color: '#5B3DF5' }} /> Academic Year:</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            aria-label="Select Academic Session"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.isCurrent ? '★ (Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <span style={{ width: 1, height: 22, background: '#E7EAF2' }} />

        {/* Branch / Campus */}
        <div className="adm-context-field">
          <label><Building size={14} style={{ color: '#5B3DF5' }} /> Branch:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            aria-label="Select Branch"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.isMain ? '(Main Campus)' : ''}
              </option>
            ))}
          </select>
        </div>

        <span style={{ width: 1, height: 22, background: '#E7EAF2' }} />

        {/* Program Filter */}
        <div className="adm-context-field">
          <label><Filter size={14} style={{ color: '#66738F' }} /> Program:</label>
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            aria-label="Filter by Program"
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.programType || p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search & Refresh */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="adm-search-box">
            <Search size={15} className="adm-search-icon" />
            <input
              className="adm-search-input"
              placeholder="Search child, parent, phone, lead or application..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search admissions records"
            />
            {searchQuery && (
              <button
                type="button"
                className="adm-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={loadData}
            title="Refresh admissions data"
            style={{ height: 38, width: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={15} className={busy ? 'spin' : ''} style={{ color: '#66738F' }} />
          </button>
        </div>
      </div>

      {/* ── Segmented Workspace Navigation ── */}
      <div className="adm-tab-rail" role="tablist">
        {NAV_TABS.map((t) => {
          const isActive = tab === t.key
          let count = 0
          if (t.key === 'pipeline') count = (enquiries?.length || 0) + (applications?.length || 0)
          else if (t.key === 'enquiries') count = enquiries?.length || 0
          else if (t.key === 'followups') count = enquiries?.filter((e) => e.nextFollowUpAt || e.status !== 'CONVERTED').length || 0
          else if (t.key === 'applications') count = applications?.length || 0
          else if (t.key === 'waitlist') count = applications?.filter((f) => f.status === 'WAITLISTED').length || 0
          else if (t.key === 'admissions') count = applications?.filter((f) => ['ENROLLED', 'ADMITTED'].includes(f.status)).length || 0

          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              className={`adm-tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span>{t.label}</span>
              {t.key !== 'reports' && (
                <span className="adm-tab-count">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 1. PIPELINE KANBAN VIEW ── */}
      {tab === 'pipeline' && (
        <div className="adm-kanban-board">
          {/* Column 1: Leads / Enquiries */}
          <div className="adm-kanban-col">
            <div className="adm-kanban-col-head">
              <div className="adm-kanban-stage-title">
                <span className="adm-kanban-dot" style={{ background: '#3B82F6' }} />
                <span>Leads / Enquiries</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#66738F', background: '#FFFFFF', padding: '2px 8px', borderRadius: 999, border: '1px solid #E7EAF2' }}>
                  {enquiries?.filter((e) => ['NEW', 'CONTACTED'].includes(e.status)).length || 0}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEnquiryModal(true)}
                  title="Add enquiry"
                  style={{ padding: 4, height: 26, width: 26, borderRadius: 6 }}
                >
                  <Plus size={14} style={{ color: '#5B3DF5' }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 620, overflowY: 'auto' }}>
              {enquiries?.filter((e) => ['NEW', 'CONTACTED'].includes(e.status)).map((e) => {
                const childAge = e.childDob ? calculateAgeMonths(e.childDob) : null
                return (
                  <div
                    key={e.id}
                    className="adm-kanban-card"
                    onClick={() => setFollowUpModal({ open: true, enquiry: e })}
                  >
                    <div className="adm-kanban-card-head">
                      <span className="adm-kanban-id">{e.leadNumber}</span>
                      <StatusBadge status={e.status} />
                    </div>

                    <div className="adm-kanban-child">{e.childName || 'Child Unspecified'}</div>

                    <div className="adm-kanban-parent">
                      <User size={13} style={{ color: '#8A94A8' }} />
                      <span>{e.parentName} · {e.phone}</span>
                    </div>

                    <div className="adm-kanban-meta-row">
                      <span className="badge b-pink" style={{ fontSize: 11 }}>
                        {enumLabel(e.interestedProgram || 'NURSERY')}
                      </span>
                      {childAge !== null && (
                        <span style={{ fontSize: 11.5, color: '#66738F', background: '#F1F4FA', padding: '2px 6px', borderRadius: 4 }}>
                          {childAge} months
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#8A94A8' }}>
                        {selectedBranchName}
                      </span>
                    </div>

                    {e.nextFollowUpAt && (
                      <div className="adm-kanban-next-action">
                        <Clock size={12} />
                        <span>Follow-up: {fmtDate(e.nextFollowUpAt)}</span>
                      </div>
                    )}

                    <div className="adm-kanban-foot" onClick={(evt) => evt.stopPropagation()}>
                      <span style={{ fontSize: 11, color: '#8A94A8' }}>
                        {fmtDate(e.createdAt)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleConvertEnquiry(e.id)}
                        style={{ fontSize: 11.5, padding: '4px 10px', height: 28, borderRadius: 8 }}
                      >
                        Start App →
                      </button>
                    </div>
                  </div>
                )
              })}

              {enquiries?.filter((e) => ['NEW', 'CONTACTED'].includes(e.status)).length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#8A94A8', fontSize: 13 }}>
                  No active enquiries in this view
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Forms & Docs */}
          <div className="adm-kanban-col">
            <div className="adm-kanban-col-head">
              <div className="adm-kanban-stage-title">
                <span className="adm-kanban-dot" style={{ background: '#F59E0B' }} />
                <span>Forms & Docs</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#66738F', background: '#FFFFFF', padding: '2px 8px', borderRadius: 999, border: '1px solid #E7EAF2' }}>
                {applications?.filter((a) => ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW', 'COUNSELLING'].includes(a.status)).length || 0}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 620, overflowY: 'auto' }}>
              {applications?.filter((a) => ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW', 'COUNSELLING'].includes(a.status)).map((a) => {
                const verifiedDocs = a.documents.filter((d) => d.verified || d.status === 'VERIFIED').length
                const totalDocs = a.documents.length
                const childAge = a.childDob ? calculateAgeMonths(a.childDob) : null
                const isFullyVerified = totalDocs > 0 && verifiedDocs === totalDocs

                return (
                  <div
                    key={a.id}
                    className="adm-kanban-card"
                    onClick={() => openInspector(a.id, 'documents')}
                  >
                    <div className="adm-kanban-card-head">
                      <span className="adm-kanban-id">{a.applicationNumber}</span>
                      <StatusBadge status={a.status} />
                    </div>

                    <div className="adm-kanban-child">{a.childName}</div>

                    <div className="adm-kanban-parent">
                      <User size={13} style={{ color: '#8A94A8' }} />
                      <span>{a.parentName} · {a.parentPhone}</span>
                    </div>

                    <div className="adm-kanban-meta-row">
                      <span className="badge b-purple" style={{ fontSize: 11 }}>
                        {enumLabel(a.programType)}
                      </span>
                      {childAge !== null && (
                        <span style={{ fontSize: 11.5, color: '#66738F', background: '#F1F4FA', padding: '2px 6px', borderRadius: 4 }}>
                          {childAge} months
                        </span>
                      )}
                    </div>

                    <div className="adm-kanban-next-action" style={{ color: isFullyVerified ? '#059669' : '#D97706', borderColor: isFullyVerified ? '#A7F3D0' : '#FDE68A' }}>
                      <ClipboardList size={12} />
                      <span>Next: {isFullyVerified ? 'Ready for Counselling / Approval' : 'Verify pending documents'}</span>
                    </div>

                    <div className="adm-kanban-foot" onClick={(evt) => evt.stopPropagation()}>
                      <span className={`badge ${isFullyVerified ? 'b-success' : 'b-warning'}`} style={{ fontSize: 11 }}>
                        {verifiedDocs}/{totalDocs} Docs
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openInspector(a.id, 'documents')}
                        style={{ fontSize: 11.5, padding: '4px 10px', height: 28, borderRadius: 8 }}
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                )
              })}

              {applications?.filter((a) => ['SUBMITTED', 'DOCUMENT_PENDING', 'DOCUMENT_REVIEW', 'COUNSELLING'].includes(a.status)).length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#8A94A8', fontSize: 13 }}>
                  No applications pending review
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Approved / Offers */}
          <div className="adm-kanban-col">
            <div className="adm-kanban-col-head">
              <div className="adm-kanban-stage-title">
                <span className="adm-kanban-dot" style={{ background: '#7C3AED' }} />
                <span>Approved / Offers</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#66738F', background: '#FFFFFF', padding: '2px 8px', borderRadius: 999, border: '1px solid #E7EAF2' }}>
                {applications?.filter((a) => ['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).length || 0}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 620, overflowY: 'auto' }}>
              {applications?.filter((a) => ['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).map((a) => {
                const childAge = a.childDob ? calculateAgeMonths(a.childDob) : null
                return (
                  <div
                    key={a.id}
                    className="adm-kanban-card"
                    onClick={() => openInspector(a.id, a.status === 'APPROVED' ? 'offer' : 'enrollment')}
                  >
                    <div className="adm-kanban-card-head">
                      <span className="adm-kanban-id">{a.applicationNumber}</span>
                      <StatusBadge status={a.status} />
                    </div>

                    <div className="adm-kanban-child">{a.childName}</div>

                    <div className="adm-kanban-parent">
                      <User size={13} style={{ color: '#8A94A8' }} />
                      <span>{a.parentName} · {a.parentPhone}</span>
                    </div>

                    <div className="adm-kanban-meta-row">
                      <span className="badge b-purple" style={{ fontSize: 11 }}>
                        {enumLabel(a.programType)}
                      </span>
                      {childAge !== null && (
                        <span style={{ fontSize: 11.5, color: '#66738F', background: '#F1F4FA', padding: '2px 6px', borderRadius: 4 }}>
                          {childAge} months
                        </span>
                      )}
                    </div>

                    <div className="adm-kanban-next-action" style={{ color: '#7C3AED', borderColor: '#DDD6FE' }}>
                      <FileSignature size={12} />
                      <span>
                        Next: {a.status === 'APPROVED' ? 'Generate Offer Letter' : a.status === 'OFFER_SENT' ? 'Awaiting Parent Acceptance' : 'Classroom Section Allocation'}
                      </span>
                    </div>

                    <div className="adm-kanban-foot" onClick={(evt) => evt.stopPropagation()}>
                      <span style={{ fontSize: 11, color: '#8A94A8' }}>
                        {fmtDate(a.submittedAt)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => openInspector(a.id, a.status === 'OFFER_ACCEPTED' ? 'enrollment' : 'offer')}
                        style={{ fontSize: 11.5, padding: '4px 10px', height: 28, borderRadius: 8 }}
                      >
                        {a.status === 'OFFER_ACCEPTED' ? 'Enrol Student →' : 'Manage Offer'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {applications?.filter((a) => ['APPROVED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(a.status)).length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#8A94A8', fontSize: 13 }}>
                  No approved files pending offer/enrolment
                </div>
              )}
            </div>
          </div>

          {/* Column 4: Admitted / Enrolled */}
          <div className="adm-kanban-col">
            <div className="adm-kanban-col-head">
              <div className="adm-kanban-stage-title">
                <span className="adm-kanban-dot" style={{ background: '#10B981' }} />
                <span>Enrolled Students</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#66738F', background: '#FFFFFF', padding: '2px 8px', borderRadius: 999, border: '1px solid #E7EAF2' }}>
                {applications?.filter((a) => ['ENROLLED', 'ADMITTED'].includes(a.status)).length || 0}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 620, overflowY: 'auto' }}>
              {applications?.filter((a) => ['ENROLLED', 'ADMITTED'].includes(a.status)).map((a) => {
                const childAge = a.childDob ? calculateAgeMonths(a.childDob) : null
                return (
                  <div
                    key={a.id}
                    className="adm-kanban-card"
                    onClick={() => openInspector(a.id, 'overview')}
                  >
                    <div className="adm-kanban-card-head">
                      <span className="adm-kanban-id">{a.applicationNumber}</span>
                      <span className="badge b-success" style={{ fontSize: 11 }}>
                        ✓ Enrolled
                      </span>
                    </div>

                    <div className="adm-kanban-child">{a.childName}</div>

                    <div className="adm-kanban-parent">
                      <User size={13} style={{ color: '#8A94A8' }} />
                      <span>{a.parentName} · {a.parentPhone}</span>
                    </div>

                    <div className="adm-kanban-meta-row">
                      <span className="badge b-pink" style={{ fontSize: 11 }}>
                        {enumLabel(a.programType)}
                      </span>
                      {childAge !== null && (
                        <span style={{ fontSize: 11.5, color: '#66738F', background: '#F1F4FA', padding: '2px 6px', borderRadius: 4 }}>
                          {childAge} months
                        </span>
                      )}
                    </div>

                    <div className="adm-kanban-next-action" style={{ color: '#059669', borderColor: '#A7F3D0', background: '#F0FDF4' }}>
                      <GraduationCap size={12} />
                      <span>Student master created · Section allocated</span>
                    </div>

                    <div className="adm-kanban-foot" onClick={(evt) => evt.stopPropagation()}>
                      <span style={{ fontSize: 11, color: '#8A94A8' }}>
                        {a.approvedAt ? fmtDate(a.approvedAt) : fmtDate(a.submittedAt)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => openInspector(a.id, 'overview')}
                        style={{ fontSize: 11.5, padding: '4px 10px', height: 28, borderRadius: 8 }}
                      >
                        <Eye size={13} /> View File
                      </button>
                    </div>
                  </div>
                )
              })}

              {applications?.filter((a) => ['ENROLLED', 'ADMITTED'].includes(a.status)).length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#8A94A8', fontSize: 13 }}>
                  No completed admissions yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ENQUIRIES WORKSPACE ── */}
      {tab === 'enquiries' && (
        <div>
          <DataTable<Enquiry>
            columns={[
              {
                key: 'leadNumber',
                header: 'Enquiry #',
                sortValue: (e) => e.leadNumber,
                render: (e) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 650, color: '#5B3DF5' }}>{e.leadNumber}</span>
              },
              {
                key: 'childName',
                header: 'Child Name',
                sortValue: (e) => e.childName || '',
                render: (e) => {
                  const age = e.childDob ? calculateAgeMonths(e.childDob) : null
                  return (
                    <div>
                      <span className="cell-strong">{e.childName || '—'}</span>
                      {age !== null && <span className="cell-sub">{age} months</span>}
                    </div>
                  )
                }
              },
              {
                key: 'parentName',
                header: 'Parent / Contact',
                sortValue: (e) => e.parentName,
                render: (e) => (
                  <div>
                    <span style={{ fontWeight: 600, color: '#15254A' }}>{e.parentName}</span>
                    <span className="cell-sub">{e.phone}</span>
                  </div>
                )
              },
              {
                key: 'program',
                header: 'Program',
                sortValue: (e) => enumLabel(e.interestedProgram || 'NURSERY'),
                render: (e) => <span className="badge b-pink">{enumLabel(e.interestedProgram || 'NURSERY')}</span>
              },
              {
                key: 'source',
                header: 'Source',
                sortValue: (e) => e.source,
                render: (e) => {
                  const src = getSourceBadge(e.source)
                  return <span className={`badge ${src.cls}`}>{src.label}</span>
                }
              },
              {
                key: 'status',
                header: 'Status',
                sortValue: (e) => e.status,
                render: (e) => <StatusBadge status={e.status} />
              },
              {
                key: 'nextFollowUpAt',
                header: 'Next Action Due',
                sortValue: (e) => e.nextFollowUpAt || '',
                render: (e) => (
                  <span style={{ fontSize: 12.5, color: e.nextFollowUpAt ? '#15254A' : '#8A94A8' }}>
                    {e.nextFollowUpAt ? fmtDate(e.nextFollowUpAt) : 'None set'}
                  </span>
                )
              },
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

      {/* ── 3. FOLLOW-UPS WORKSPACE ── */}
      {tab === 'followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 750, color: '#15254A', margin: 0 }}>Parent Follow-up CRM Centre</h3>
              <p style={{ fontSize: 13, color: '#66738F', margin: '4px 0 0' }}>
                Operational callback queue, WhatsApp follow-ups, and scheduled school visits.
              </p>
            </div>
            <span className="badge b-purple" style={{ fontSize: 12.5, padding: '4px 10px' }}>
              {enquiries?.filter((e) => e.nextFollowUpAt || e.status !== 'CONVERTED').length || 0} active follow-ups
            </span>
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
                {enquiries?.filter((e) => e.nextFollowUpAt || e.status !== 'CONVERTED').map((enq) => {
                  const isOverdue = enq.nextFollowUpAt && new Date(enq.nextFollowUpAt) < new Date()
                  const isDueToday = enq.nextFollowUpAt && new Date(enq.nextFollowUpAt).toDateString() === new Date().toDateString()

                  return (
                    <tr key={enq.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 650, color: '#5B3DF5' }}>{enq.leadNumber}</td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#15254A' }}>{enq.childName || 'Child Unspecified'}</div>
                        <div style={{ fontSize: 12, color: '#66738F' }}>Parent: {enq.parentName}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{enq.phone}</td>
                      <td><StatusBadge status={enq.status} /></td>
                      <td>
                        {enq.nextFollowUpAt ? (
                          <span
                            className={`badge ${isOverdue ? 'b-danger' : isDueToday ? 'b-warning' : 'b-info'}`}
                            style={{ fontSize: 11.5 }}
                          >
                            {isOverdue ? '⚠ Overdue: ' : isDueToday ? '⏰ Due Today: ' : ''}
                            {fmtDate(enq.nextFollowUpAt)}
                          </span>
                        ) : (
                          <span className="badge b-warning" style={{ fontSize: 11.5 }}>
                            Immediate follow-up due
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setFollowUpModal({ open: true, enquiry: enq })}
                          style={{ height: 32, gap: 6 }}
                        >
                          <Phone size={13} style={{ color: '#5B3DF5' }} /> Log Follow-up
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. APPLICATIONS WORKSPACE ── */}
      {tab === 'applications' && (
        <div>
          <DataTable<ApplicationListItem>
            columns={[
              {
                key: 'applicationNumber',
                header: 'Form #',
                sortValue: (f) => f.applicationNumber,
                render: (f) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 650, color: '#5B3DF5' }}>{f.applicationNumber}</span>
              },
              {
                key: 'childName',
                header: 'Child Name',
                sortValue: (f) => f.childName,
                render: (f) => {
                  const age = f.childDob ? calculateAgeMonths(f.childDob) : null
                  return (
                    <div>
                      <span className="cell-strong">{f.childName}</span>
                      {age !== null && <span className="cell-sub">{age} months · {enumLabel(f.childGender)}</span>}
                    </div>
                  )
                }
              },
              {
                key: 'program',
                header: 'Program',
                sortValue: (f) => enumLabel(f.programType),
                render: (f) => <span className="badge b-pink">{enumLabel(f.programType)}</span>
              },
              {
                key: 'parentName',
                header: 'Parent / Phone',
                sortValue: (f) => f.parentName,
                render: (f) => (
                  <div>
                    <span style={{ fontWeight: 600, color: '#15254A' }}>{f.parentName}</span>
                    <span className="cell-sub">{f.parentPhone}</span>
                  </div>
                )
              },
              {
                key: 'docs',
                header: 'Documents',
                sortValue: (f) => f.documents.filter((d) => d.status === 'VERIFIED' || d.verified).length,
                render: (f) => {
                  const verifiedCount = f.documents.filter((d) => d.status === 'VERIFIED' || d.verified).length
                  const hasRejected = f.documents.some((d) => d.status === 'REJECTED')
                  const isAllVerified = f.documents.length > 0 && verifiedCount === f.documents.length
                  return (
                    <span className={`badge ${isAllVerified ? 'b-success' : hasRejected ? 'b-danger' : 'b-warning'}`}>
                      {verifiedCount}/{f.documents.length} verified
                    </span>
                  )
                }
              },
              {
                key: 'status',
                header: 'Stage Status',
                sortValue: (f) => f.status,
                render: (f) => <StatusBadge status={f.status} />
              },
            ]}
            data={applications || []}
            paginate
            exportFileName="applications.csv"
            emptyTitle="No Admission Applications"
            emptyMessage={`No admission forms submitted for ${selectedSessionName} at this branch.`}
            rowActions={(f) => [
              { label: 'Inspect application', icon: <Eye size={14} />, onClick: () => openInspector(f.id) }
            ]}
          />
        </div>
      )}

      {/* ── 5. WAITING LIST WORKSPACE ── */}
      {tab === 'waitlist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 750, color: '#15254A', margin: 0 }}>Waiting List Queue Management</h3>
              <p style={{ fontSize: 13, color: '#66738F', margin: '4px 0 0' }}>
                Applications held due to full classroom sections. Re-evaluate as seats become available.
              </p>
            </div>
            <span className="badge b-orange" style={{ fontSize: 12.5, padding: '4px 10px' }}>
              {applications?.filter((f) => f.status === 'WAITLISTED').length || 0} waitlisted
            </span>
          </div>

          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Priority</th>
                  <th>Form #</th>
                  <th>Child</th>
                  <th>Program</th>
                  <th>Parent & Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications?.filter((f) => f.status === 'WAITLISTED').map((f, idx) => (
                  <tr key={f.id}>
                    <td>
                      <span className="adm-rank-pill">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 650, color: '#5B3DF5' }}>{f.applicationNumber}</td>
                    <td>
                      <div style={{ fontWeight: 650, color: '#15254A' }}>{f.childName}</div>
                      <div style={{ fontSize: 12, color: '#66738F' }}>{f.childDob ? `${calculateAgeMonths(f.childDob)} months` : '—'}</div>
                    </td>
                    <td><span className="badge b-pink">{enumLabel(f.programType)}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#15254A' }}>{f.parentName}</div>
                      <div style={{ fontSize: 12, color: '#66738F' }}>{f.parentPhone}</div>
                    </td>
                    <td><StatusBadge status={f.status} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => openInspector(f.id, 'approval')}
                        style={{ height: 32 }}
                      >
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
                message="All approved applicants have been successfully allocated to sections or admitted."
              />
            )}
          </div>
        </div>
      )}

      {/* ── 6. ADMISSIONS WORKSPACE ── */}
      {tab === 'admissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 750, color: '#15254A', margin: 0 }}>Enrolled Student Master List ({selectedSessionName})</h3>
              <p style={{ fontSize: 13, color: '#66738F', margin: '4px 0 0' }}>
                Active student master records, parent linkages, classroom allocations, and finance records.
              </p>
            </div>
            <span className="badge b-success" style={{ fontSize: 12.5, padding: '4px 10px' }}>
              {applications?.filter((f) => ['ENROLLED', 'ADMITTED'].includes(f.status)).length || 0} active enrolments
            </span>
          </div>

          <div className="dtable-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Form #</th>
                  <th>Child</th>
                  <th>Program</th>
                  <th>Parent</th>
                  <th>Student Status</th>
                  <th>Admitted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications?.filter((f) => ['ENROLLED', 'ADMITTED'].includes(f.status)).map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 650, color: '#5B3DF5' }}>{f.applicationNumber}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#15254A' }}>{f.childName}</div>
                      {f.studentId && (
                        <div style={{ fontSize: 11.5, color: '#5B3DF5', fontFamily: 'var(--font-mono)' }}>
                          STU: {f.studentId.slice(0, 10)}...
                        </div>
                      )}
                    </td>
                    <td><span className="badge b-pink">{enumLabel(f.programType)}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#15254A' }}>{f.parentName}</div>
                      <div style={{ fontSize: 12, color: '#66738F' }}>{f.parentPhone}</div>
                    </td>
                    <td><span className="badge b-success">✓ Active Student</span></td>
                    <td style={{ fontSize: 12.5 }}>{f.approvedAt ? fmtDate(f.approvedAt) : fmtDate(f.submittedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => openInspector(f.id)}
                        style={{ height: 32, gap: 6 }}
                      >
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
                title="No Enrolled Students Yet"
                message="Complete admission approval and offer acceptance to enroll students in this session."
              />
            )}
          </div>
        </div>
      )}

      {/* ── 7. CRM ANALYTICS WORKSPACE ── */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Conversion Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderTop: '4px solid #3B82F6', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#66738F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Lead → Application Rate
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#15254A', marginTop: 6, letterSpacing: '-0.03em' }}>
                {metrics.leadToAppPct}%
              </div>
              <div style={{ fontSize: 13, color: '#8A94A8', marginTop: 4 }}>
                {metrics.totalApps} applications from {metrics.totalLeads} leads
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderTop: '4px solid #7C3AED', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#66738F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Application → Offer Rate
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#15254A', marginTop: 6, letterSpacing: '-0.03em' }}>
                {metrics.appToOfferPct}%
              </div>
              <div style={{ fontSize: 13, color: '#8A94A8', marginTop: 4 }}>
                {metrics.offersIssued + metrics.offersAccepted + metrics.enrolledCount} offers generated
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderTop: '4px solid #10B981', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#66738F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Offer → Admission Rate
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#15254A', marginTop: 6, letterSpacing: '-0.03em' }}>
                {metrics.offerToAdmPct}%
              </div>
              <div style={{ fontSize: 13, color: '#8A94A8', marginTop: 4 }}>
                {metrics.enrolledCount} enrolled from offers
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderTop: '4px solid #06B6D4', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#66738F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Overall Conversion (Lead → Enrolled)
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#15254A', marginTop: 6, letterSpacing: '-0.03em' }}>
                {metrics.leadToAdmPct}%
              </div>
              <div style={{ fontSize: 13, color: '#8A94A8', marginTop: 4 }}>
                {metrics.enrolledCount} final enrolments
              </div>
            </div>
          </div>

          {/* Admission Journey Funnel Representation */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 750, color: '#15254A', margin: '0 0 16px' }}>
              Authoritative Admission Lifecycle Funnel
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { stage: '1. Total Leads Captured', count: metrics.totalLeads, max: metrics.totalLeads || 1, color: '#3B82F6' },
                { stage: '2. Applications Submitted', count: metrics.totalApps, max: metrics.totalLeads || 1, color: '#5B3DF5' },
                { stage: '3. Approved for Admission', count: metrics.pendingApproval + metrics.offersIssued + metrics.offersAccepted + metrics.enrolledCount, max: metrics.totalLeads || 1, color: '#DB2777' },
                { stage: '4. Official Offers Issued', count: metrics.offersIssued + metrics.offersAccepted + metrics.enrolledCount, max: metrics.totalLeads || 1, color: '#7C3AED' },
                { stage: '5. Offers Accepted', count: metrics.offersAccepted + metrics.enrolledCount, max: metrics.totalLeads || 1, color: '#10B981' },
                { stage: '6. Final Enrolled Students', count: metrics.enrolledCount, max: metrics.totalLeads || 1, color: '#059669' },
              ].map((fn, idx) => {
                const pct = Math.min(100, Math.round((fn.count / (fn.max || 1)) * 100))
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ fontWeight: 650, color: '#15254A' }}>{fn.stage}</span>
                      <span style={{ fontWeight: 700, color: fn.color }}>
                        {fn.count} ({metrics.totalLeads > 0 ? `${pct}%` : '—'})
                      </span>
                    </div>
                    <div style={{ height: 10, background: '#F1F4FA', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: fn.color,
                          borderRadius: 999,
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── APPLICATION 360 INSPECTOR (SLIDE-OUT RIGHT DRAWER) ── */}
      {inspector.open && (
        <div className="adm-drawer-overlay" onClick={() => setInspector({ open: false, formId: null, data: null, tab: 'overview' })}>
          <div className="adm-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="adm-drawer-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#5B3DF5' }}>
                    {inspector.data?.application.applicationNumber || 'APP-FILE'}
                  </span>
                  {inspector.data && <StatusBadge status={inspector.data.application.status} />}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#15254A', margin: '4px 0 0' }}>
                  {inspector.data ? `${inspector.data.application.childFirstName} ${inspector.data.application.childLastName || ''}`.trim() : 'Application File'}
                </h3>
                <div style={{ fontSize: 13, color: '#66738F', marginTop: 2 }}>
                  {inspector.data && enumLabel(inspector.data.application.programType)} · {selectedBranchName} ({selectedSessionName})
                </div>
              </div>

              <button
                type="button"
                className="x-btn"
                onClick={() => setInspector({ open: false, formId: null, data: null, tab: 'overview' })}
                aria-label="Close Inspector"
                style={{ width: 32, height: 32, borderRadius: 8 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Sub-tabs */}
            {inspector.data && (
              <div className="adm-drawer-subtabs">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'child', label: 'Child Details' },
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
                    type="button"
                    className={`adm-drawer-subtab-btn ${inspector.tab === t.key ? 'is-active' : ''}`}
                    onClick={() => setInspector((prev) => ({ ...prev, tab: t.key }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Drawer Body Content */}
            <div className="adm-drawer-body">
              {inspector.data && (
                <>
                  {/* TAB: OVERVIEW */}
                  {inspector.tab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#66738F' }}>Current Stage</div>
                          <div style={{ marginTop: 4 }}><StatusBadge status={inspector.data.application.status} /></div>
                        </div>

                        <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#66738F' }}>Originating Lead</div>
                          <div style={{ fontWeight: 650, fontSize: 13.5, color: '#15254A', marginTop: 4 }}>
                            {inspector.data.application.lead?.leadNumber || 'Direct Application'}
                          </div>
                        </div>

                        <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#66738F' }}>Submitted On</div>
                          <div style={{ fontSize: 13, color: '#15254A', marginTop: 4 }}>
                            {fmtDate(inspector.data.application.submittedAt || new Date().toISOString())}
                          </div>
                        </div>

                        <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#66738F' }}>Classroom</div>
                          <div style={{ fontSize: 13, color: '#15254A', marginTop: 4 }}>
                            {inspector.data.application.classroomId ? 'Allocated' : 'Pending Allocation'}
                          </div>
                        </div>
                      </div>

                      {inspector.data.application.notes && (
                        <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 12, padding: 14 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#66738F', marginBottom: 4 }}>
                            Application Notes
                          </div>
                          <p style={{ fontSize: 13, color: '#15254A', margin: 0, whiteSpace: 'pre-line' }}>
                            {inspector.data.application.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: CHILD DETAILS */}
                  {inspector.tab === 'child' && (
                    <div className="form-grid">
                      <div className="field">
                        <label>Child First Name</label>
                        <input className="input" readOnly value={inspector.data.application.childFirstName} />
                      </div>
                      <div className="field">
                        <label>Child Last Name</label>
                        <input className="input" readOnly value={inspector.data.application.childLastName || '—'} />
                      </div>
                      <div className="field">
                        <label>Date of Birth</label>
                        <input className="input" readOnly value={fmtDate(inspector.data.application.childDob)} />
                      </div>
                      <div className="field">
                        <label>Calculated Age</label>
                        <input className="input" readOnly value={`${inspector.data.requirements.ageRequirement.ageMonths} months`} />
                      </div>
                      <div className="field">
                        <label>Gender</label>
                        <input className="input" readOnly value={enumLabel(inspector.data.application.childGender)} />
                      </div>
                      <div className="field">
                        <label>Previous School</label>
                        <input className="input" readOnly value={inspector.data.application.previousSchool || 'None (First time admission)'} />
                      </div>
                    </div>
                  )}

                  {/* TAB: PARENT & SIBLINGS */}
                  {inspector.tab === 'parent' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="form-grid">
                        <div className="field">
                          <label>Primary Guardian Name</label>
                          <input className="input" readOnly value={inspector.data.application.parentName} />
                        </div>
                        <div className="field">
                          <label>Phone Number</label>
                          <input className="input" readOnly value={inspector.data.application.parentPhone} />
                        </div>
                        <div className="field">
                          <label>Email Address</label>
                          <input className="input" readOnly value={inspector.data.application.parentEmail || '—'} />
                        </div>
                      </div>

                      {/* Sibling Logic Card */}
                      <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderLeft: '4px solid #5B3DF5', borderRadius: 12, padding: 14, boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15254A' }}>
                          Sibling & Existing Child Connectivity
                        </div>
                        {inspector.data.requirements.siblingConcession.hasSibling ? (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ fontSize: 12.5, color: '#66738F', margin: 0 }}>
                              Matching guardian contact found for the following enrolled student(s):
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                              {inspector.data.requirements.siblingConcession.existingChildren.map((sib) => (
                                <div key={sib.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F8F9FE', borderRadius: 8, fontSize: 12.5 }}>
                                  <span><b>{sib.name}</b> ({sib.admissionNo})</span>
                                  <span className="badge b-purple">{sib.classroom}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12.5, color: '#10B981', fontWeight: 650 }}>
                              ✓ Sibling Concession Eligible: {inspector.data.requirements.siblingConcession.applicableDiscountPercent}% discount applicable on Tuition Fee.
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: 12.5, color: '#66738F', margin: '6px 0 0' }}>
                            No other children currently enrolled under this guardian contact.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: DOCUMENTS CHECKLIST */}
                  {inspector.tab === 'documents' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15254A', margin: 0 }}>
                          Authoritative Verification Checklist
                        </h4>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={handleVerifyAllDocuments}
                          disabled={busy}
                          style={{ height: 32, fontSize: 12 }}
                        >
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
                              background: '#FFFFFF',
                              border: '1px solid #E7EAF2',
                              borderRadius: 10,
                              padding: '10px 14px',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className={`badge ${d.status === 'VERIFIED' || d.verified ? 'b-success' : d.status === 'REJECTED' ? 'b-danger' : 'b-warning'}`}>
                                  {d.status === 'VERIFIED' || d.verified ? '✓ Verified' : d.status === 'REJECTED' ? '✗ Rejected' : '⏳ Pending'}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 650, color: '#15254A' }}>{enumLabel(d.docType)}</span>
                              </div>
                              {d.rejectionReason && (
                                <div style={{ color: '#EF4444', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                                  Reason: {d.rejectionReason}
                                </div>
                              )}
                              {d.remarks && !d.rejectionReason && (
                                <div style={{ color: '#8A94A8', fontSize: 12, marginTop: 2 }}>{d.remarks}</div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              {d.status !== 'VERIFIED' && !d.verified && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => {
                                      const reason = prompt('Enter document rejection reason (mandatory):')
                                      if (reason && reason.trim()) {
                                        handleVerifyDocument(d.id, 'REJECT', reason.trim())
                                      }
                                    }}
                                    disabled={busy}
                                    style={{ height: 28, fontSize: 11.5 }}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleVerifyDocument(d.id, 'VERIFY')}
                                    disabled={busy}
                                    style={{ height: 28, fontSize: 11.5 }}
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
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15254A', margin: 0 }}>
                        Record Counselling & Child Interaction
                      </h4>
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
                      <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 12, padding: 14 }}>
                        <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: '#15254A', margin: '0 0 10px' }}>
                          Authoritative Approval Gate Assessment
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {inspector.data.requirements.ageRequirement.eligible ? (
                              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                            ) : (
                              <XCircle size={18} style={{ color: '#EF4444' }} />
                            )}
                            <span style={{ fontSize: 13, color: '#15254A' }}>
                              Age Requirement ({inspector.data.requirements.ageRequirement.ageMonths}m)
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {inspector.data.requirements.documentsCheck.isComplete ? (
                              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                            ) : (
                              <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
                            )}
                            <span style={{ fontSize: 13, color: '#15254A' }}>
                              Documents ({inspector.data.requirements.documentsCheck.verified}/{inspector.data.requirements.documentsCheck.total})
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {inspector.data.requirements.capacityCheck.hasAvailableCapacity ? (
                              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                            ) : (
                              <XCircle size={18} style={{ color: '#EF4444' }} />
                            )}
                            <span style={{ fontSize: 13, color: '#15254A' }}>
                              Classroom Capacity Available
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
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
                          type="button"
                          className="btn btn-secondary"
                          disabled={busy || ['ENROLLED', 'WAITLISTED'].includes(inspector.data.application.status)}
                          onClick={() => handleWaitlist(inspector.formId!)}
                        >
                          Move to Waiting List
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy || !inspector.data.requirements.isReadyForApproval || ['APPROVED', 'ENROLLED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(inspector.data.application.status)}
                          onClick={() => handleApproveApplication()}
                        >
                          <ThumbsUp size={15} /> Authorize & Approve Application
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB: FEE & OFFER */}
                  {inspector.tab === 'offer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {inspector.data.requirements.feePlanQuote && (
                        <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(21,37,74,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15254A', margin: 0 }}>
                              Applicable Fee Plan: {inspector.data.requirements.feePlanQuote.name}
                            </h4>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>
                              ₹{inspector.data.requirements.feePlanQuote.totalAnnualRupees.toLocaleString('en-IN')}/yr
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
                            {inspector.data.requirements.feePlanQuote.items.map((it, idx) => (
                              <div key={idx} style={{ padding: '8px 12px', background: '#F8F9FE', borderRadius: 8, fontSize: 12.5 }}>
                                <b style={{ color: '#15254A' }}>{it.label}:</b> ₹{it.amountRupees.toLocaleString('en-IN')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Branded Offer Letter View or Generator */}
                      {inspector.data.application.offers.length > 0 ? (
                        <div style={{ background: '#FCFAFF', border: '2px solid #7C3AED', borderRadius: 14, padding: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E9D5FF', paddingBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 750, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Official Admission Offer
                              </div>
                              <div style={{ fontSize: 17, fontWeight: 800, color: '#15254A', marginTop: 2 }}>
                                {inspector.data.application.offers[0].offerNumber}
                              </div>
                            </div>
                            <StatusBadge status={inspector.data.application.offers[0].status} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12, fontSize: 13 }}>
                            <div><b>Child:</b> {inspector.data.application.offers[0].childName}</div>
                            <div><b>Parent:</b> {inspector.data.application.offers[0].parentName}</div>
                            <div><b>Valid Until:</b> {fmtDate(inspector.data.application.offers[0].validUntil)}</div>
                            <div><b>Annual Total:</b> ₹{(inspector.data.application.offers[0].feeTotalCents / 100).toLocaleString('en-IN')}</div>
                          </div>

                          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            {inspector.data.application.offers[0].status === 'ISSUED' && (
                              <>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeclineOffer('Parent declined')} disabled={busy}>
                                  Decline Offer
                                </button>
                                <button type="button" className="btn btn-primary btn-sm" onClick={handleAcceptOffer} disabled={busy}>
                                  <Check size={14} /> Record Parent Acceptance
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '28px 0' }}>
                          <p style={{ color: '#8A94A8', fontSize: 13 }}>No offer letter has been generated yet for this application.</p>
                          <button
                            type="button"
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

                  {/* TAB: ENROLMENT */}
                  {inspector.tab === 'enrollment' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 12, padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15254A', margin: 0 }}>
                            Classroom / Section Allocation
                          </h4>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => openAllocationModal(inspector.data!.application.id)}
                            style={{ fontSize: 12, height: 28, background: '#EEF2FF', color: '#5B3DF5', border: '1px solid #C7D2FE' }}
                          >
                            <Sparkles size={13} /> Evaluate Allocation Engine
                          </button>
                        </div>
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
                          type="button"
                          className="btn btn-primary"
                          disabled={busy || !selectedClassId || ['ENROLLED', 'ADMITTED'].includes(inspector.data.application.status)}
                          onClick={handleCompleteEnrollment}
                        >
                          <Award size={15} /> Complete Final Admission & Enrol Student
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB: TIMELINE */}
                  {inspector.tab === 'timeline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15254A', margin: 0 }}>
                        Immutable Admission Audit History
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                        {inspector.data.timeline.map((item) => (
                          <div key={item.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 10, fontSize: 12.5 }}>
                            <div style={{ minWidth: 110, color: '#8A94A8', fontSize: 12 }}>{fmtDate(item.createdAt)}</div>
                            <div style={{ flex: 1 }}>
                              <span className="badge b-blue" style={{ fontSize: 11, marginRight: 8 }}>{item.action}</span>
                              <span style={{ color: '#15254A', fontWeight: 500 }}>{item.summary}</span>
                              {item.actorName && <span style={{ color: '#8A94A8', fontSize: 11.5 }}> (by {item.actorName})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
              <>
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
                  <select
                    className="select"
                    name="programType"
                    value={appProgramType}
                    onChange={(e) => setAppProgramType(e.target.value)}
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.programType || p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {appAgeEligibility && (
                <div className={`adm-age-banner ${appAgeEligibility.eligible ? 'is-eligible' : 'is-ineligible'}`} style={{ marginTop: 12 }}>
                  {appAgeEligibility.eligible ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{appAgeEligibility.message}</span>
                </div>
              )}
            </>
            )}
            {appStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={16} style={{ color: '#5B3DF5', flexShrink: 0 }} />
                  <div style={{ fontSize: 12.5, color: '#66738F' }}>
                    <strong style={{ color: '#15254A' }}>Sibling Concession Auto-Detection:</strong> If another enrolled child shares this parent phone/email, the 10% Sibling Concession is automatically recommended during Fee Offer generation.
                  </div>
                </div>
              </div>
            )}
            {appStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label>Residential Address</label>
                  <input className="input" name="address" placeholder="Flat 402, Sunshine Residency..." />
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(21,37,74,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E7EAF2' }}>
                    <FileCheck2 size={16} style={{ color: '#5B3DF5' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#15254A' }}>Review Application Dossier</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {appSummary.map((r) => (
                      <div key={r.k} style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#66738F', textTransform: 'uppercase' }}>{r.k}</div>
                        <div style={{ fontSize: 13, fontWeight: 650, color: '#15254A', marginTop: 2 }}>{r.v || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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

      {/* ── MODAL: CSV BULK IMPORT WIZARD (7-STEP UNIFIED ENGINE) ── */}
      <Modal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title={`Bulk Import ${csvType === 'leads' ? 'Leads / Enquiries' : 'Applications'}`}
        subtitle="Unified business engine — records undergo strict canonical validation and audit logging"
        icon={<Download size={22} />}
        wide
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Type Selector & Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 12, borderBottom: '1px solid #E7EAF2' }}>
            <div style={{ display: 'flex', gap: 6, background: '#F1F4FA', padding: 4, borderRadius: 10 }}>
              <button
                type="button"
                className={`btn btn-sm ${csvType === 'leads' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setCsvType('leads'); setCsvStep(0); setCsvValidationResult(null); }}
                style={{ borderRadius: 8, height: 32 }}
              >
                Import Leads
              </button>
              <button
                type="button"
                className={`btn btn-sm ${csvType === 'applications' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setCsvType('applications'); setCsvStep(0); setCsvValidationResult(null); }}
                style={{ borderRadius: 8, height: 32 }}
              >
                Import Applications
              </button>
            </div>

            <a
              href={`/api/v1/admissions/import/template?type=${csvType}`}
              download
              className="btn btn-sm btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5B3DF5', border: '1px solid #E0E7FF' }}
            >
              <Download size={14} /> Download Sample CSV Template
            </a>
          </div>

          {/* STEP 0: Upload / Paste CSV */}
          {csvStep === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ border: '2px dashed #CBD5E1', borderRadius: 12, padding: 24, textAlign: 'center', background: '#F8FAFC' }}>
                <FileText size={32} style={{ color: '#64748B', margin: '0 auto 8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#15254A' }}>Upload or Paste CSV Data</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                  Paste raw CSV text below or drop your CSV file contents. First row must contain column headers.
                </p>
              </div>

              <div className="field">
                <label>Raw CSV Content</label>
                <textarea
                  className="textarea"
                  rows={8}
                  placeholder={`parent_name,parent_phone,child_name,child_dob,program\nRahul Sharma,9876543210,Aarav Sharma,2023-05-15,NURSERY`}
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 12.5 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCsvModalOpen(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!csvRawText.trim()}
                  onClick={() => handleParseCsv(csvRawText)}
                >
                  Continue to Column Mapping <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Map Columns */}
          {csvStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#EEF2FF', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#3730A3' }}>
                Parsed <strong>{csvRawRows.length} data rows</strong>. Map your CSV headers to canonical PreOne fields below:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {Object.keys(csvMapping).map((cf) => (
                  <div key={cf} style={{ background: '#FFFFFF', border: '1px solid #E7EAF2', borderRadius: 8, padding: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#15254A', textTransform: 'capitalize' }}>
                      {cf.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <select
                      className="select"
                      style={{ marginTop: 4, height: 36, fontSize: 12.5 }}
                      value={csvMapping[cf] || ''}
                      onChange={(e) => setCsvMapping((prev) => ({ ...prev, [cf]: e.target.value }))}
                    >
                      <option value="">-- Do Not Import --</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCsvStep(0)}>Back</button>
                <button
                  type="button"
                  className={`btn btn-primary ${csvLoading ? 'is-loading' : ''}`}
                  disabled={csvLoading}
                  onClick={handleValidateCsv}
                >
                  Validate Rows Independently <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Validation Results & Duplicate Action */}
          {csvStep === 2 && csvValidationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Validation Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>TOTAL ROWS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#15254A' }}>{csvValidationResult.totalRows}</div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>READY / VALID</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>{csvValidationResult.validCount}</div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>DUPLICATES</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#B45309' }}>{csvValidationResult.duplicateCount}</div>
                </div>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>INVALID</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#B91C1C' }}>{csvValidationResult.invalidCount}</div>
                </div>
              </div>

              {/* Duplicate Action Selector */}
              {csvValidationResult.duplicateCount > 0 && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                    ⚠ Potential Duplicates Detected ({csvValidationResult.duplicateCount} records):
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={csvDuplicateAction === 'SKIP'}
                        onChange={() => setCsvDuplicateAction('SKIP')}
                      />
                      <span><strong>Skip Duplicates (Recommended)</strong> — Protects against duplicate clutter</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dupAction"
                        checked={csvDuplicateAction === 'CREATE'}
                        onChange={() => setCsvDuplicateAction('CREATE')}
                      />
                      <span><strong>Create Anyway</strong> — Explicit authorized override</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Row Preview List */}
              <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #E7EAF2', borderRadius: 8 }}>
                <table className="dtable" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Parent</th>
                      <th>Phone</th>
                      <th>Child / Program</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvValidationResult.rows.slice(0, 10).map((r: any) => (
                      <tr key={r.rowNumber}>
                        <td>{r.rowNumber}</td>
                        <td>{r.mapped.parentName || '—'}</td>
                        <td>{r.mapped.phone || '—'}</td>
                        <td>{r.mapped.childName || 'Child'} ({r.mapped.programType})</td>
                        <td>
                          {r.status === 'VALID' && <span className="badge b-success">✓ Ready</span>}
                          {r.status === 'DUPLICATE' && <span className="badge b-warning">⚠ Duplicate</span>}
                          {r.status === 'INVALID' && (
                            <span className="badge b-danger" title={r.errors.join(', ')}>
                              ✕ {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCsvStep(1)}>Back</button>
                <button
                  type="button"
                  className={`btn btn-primary ${csvLoading ? 'is-loading' : ''}`}
                  disabled={csvLoading || (csvValidationResult.validCount === 0 && csvDuplicateAction === 'SKIP')}
                  onClick={handleExecuteCsvImport}
                >
                  Execute Batch Import ({csvDuplicateAction === 'SKIP' ? csvValidationResult.validCount : csvValidationResult.validCount + csvValidationResult.duplicateCount} records)
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Import Complete Summary */}
          {csvStep === 4 && csvImportResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 999, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle size={24} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#15254A' }}>
                CSV Import Batch {csvImportResult.batchId} Executed
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                All records were processed through the canonical admission engine with immutable audit trails.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 440, margin: '10px auto 0' }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>IMPORTED</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D' }}>{csvImportResult.success}</div>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>SKIPPED</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#334155' }}>{csvImportResult.skipped}</div>
                </div>
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>FAILED</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#B91C1C' }}>{csvImportResult.failed}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setCsvModalOpen(false); setCsvStep(0); }}
                >
                  Done & View Records
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── MODAL: CLASS + DIVISION ALLOCATION ENGINE ── */}
      <Modal
        open={allocModal.open}
        onClose={() => setAllocModal({ open: false, applicationId: null, data: null, loading: false })}
        title="Class & Division Allocation Engine"
        subtitle={allocModal.data ? `Candidate: ${allocModal.data.childName} · Program: ${allocModal.data.programName}` : 'Evaluate seat capacity'}
        icon={<Building size={22} />}
      >
        {allocModal.loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <p>Evaluating classroom divisions and capacity policies...</p>
          </div>
        ) : allocModal.data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#F8F9FE', border: '1px solid #E7EAF2', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Configured Allocation Policy</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15254A' }}>{allocModal.data.allocationPolicy.replace(/_/g, ' ')}</div>
              </div>
              <span className="badge b-purple">
                Total Available Seats: {allocModal.data.totalAvailableSeats}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#15254A' }}>Select Classroom Division:</label>
              {allocModal.data.divisions.map((div: any) => {
                const isSelected = allocModal.selectedClassId === div.id
                const isRecommended = allocModal.data.recommendedClassroomId === div.id
                return (
                  <div
                    key={div.id}
                    onClick={() => { if (!div.isFull) setAllocModal((prev) => ({ ...prev, selectedClassId: div.id })) }}
                    style={{
                      border: `1.5px solid ${isSelected ? '#5B3DF5' : div.isFull ? '#E2E8F0' : '#E7EAF2'}`,
                      background: isSelected ? '#F5F3FF' : div.isFull ? '#F8FAFC' : '#FFFFFF',
                      opacity: div.isFull ? 0.65 : 1,
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: div.isFull ? 'not-allowed' : 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14, color: '#15254A' }}>{div.name}</strong>
                        {isRecommended && !div.isFull && (
                          <span className="badge b-success" style={{ fontSize: 11 }}>
                            ★ Recommended
                          </span>
                        )}
                        {div.isFull && (
                          <span className="badge b-danger" style={{ fontSize: 11 }}>
                            Section Full (0 seats)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Capacity: {div.capacity} · Enrolled: {div.allocated} · Available: {div.availableSeats} seats
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="divisionSelect"
                      disabled={div.isFull}
                      checked={isSelected}
                      onChange={() => setAllocModal((prev) => ({ ...prev, selectedClassId: div.id }))}
                    />
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: '#D97706', borderColor: '#FDE68A' }}
                onClick={() => handleConfirmAllocation('waitlist')}
                disabled={busy}
              >
                Place on Waiting List
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAllocModal({ open: false, applicationId: null, data: null, loading: false })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-primary ${busy ? 'is-loading' : ''}`}
                  disabled={busy || !allocModal.selectedClassId}
                  onClick={() => handleConfirmAllocation('allocate')}
                >
                  Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
