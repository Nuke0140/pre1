'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays, Users, Wallet, Sparkles, Smartphone, Clock3,
  Shuffle, ShieldCheck, ShieldAlert, Bus, School, Phone, Mail,
  MapPin, CheckCircle2, ArrowRight, UserCheck, HeartHandshake,
  FileText, CreditCard, ChevronRight, Edit3, Camera, Trash2,
  AlertTriangle, Upload, UserPlus, ArrowRightLeft, GraduationCap,
  ExternalLink, Check, X, AlertCircle, RefreshCw, ArrowLeft,
  Calendar, CheckCircle, Clock, Eye, Lock, Download,
  Briefcase, Package, Send, CheckCheck
} from 'lucide-react'
import { Avatar, StatusBadge, Segmented, EmptyState } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { PdfViewerModal } from '@/components/preone/PdfViewerModal'
import { BulkReportCardModal } from '@/components/academics/BulkReportCardModal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, inr, timeAgo, enumLabel } from '@/lib/format'

interface Props {
  profile: any
}

function formatAge(dobStr?: string | Date): string {
  if (!dobStr) return ''
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years <= 0) return `${months} mo${months === 1 ? '' : 's'}`
  if (months === 0) return `${years} yr${years === 1 ? '' : 's'}`
  return `${years} yr${years === 1 ? '' : 's'}, ${months} mo${months === 1 ? '' : 's'}`
}

const TL_DOT: Record<string, { color: string; label: string }> = {
  OBSERVATION: { color: 'var(--primary)', label: 'Observation' },
  MILESTONE: { color: 'var(--warning)', label: 'Milestone' },
  MEAL: { color: 'var(--success)', label: 'Meal' },
  NAP: { color: 'var(--info)', label: 'Nap' },
  ACTIVITY: { color: 'var(--danger)', label: 'Activity' },
  INCIDENT: { color: 'var(--danger)', label: 'Incident' },
  NOTE: { color: 'var(--text-secondary)', label: 'Note' },
}

export function StudentDetailClient({ profile }: Props) {
  const { student, admission, academic, guardians, attendance, finance, academics, timeline, audit } = profile
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(['overview']))
  const [guardiansList, setGuardiansList] = useState<any[]>(guardians || [])

  const handleTabChange = useCallback((nextTab: string) => {
    setTab(nextTab)
    setVisitedTabs((prev) => {
      if (prev.has(nextTab)) return prev
      const next = new Set(prev)
      next.add(nextTab)
      return next
    })
  }, [])
  const [busy, setBusy] = useState(false)

  // Master options
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; capacity: number; programType: string; branchId?: string }[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string; code?: string }[]>([])
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
  const [history, setHistory] = useState<any[]>(academic?.allocations || [])

  // Modals & Drawers
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [allocOpen, setAllocOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [guardianModalOpen, setGuardianModalOpen] = useState(false)
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false)
  const [cancelTransportOpen, setCancelTransportOpen] = useState(false)

  // Photo upload reference
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Student Identity Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    dob: student?.dob ? new Date(student.dob).toISOString().slice(0, 10) : '',
    gender: student?.gender || 'MALE',
    bloodGroup: student?.bloodGroup || '',
    allergies: student?.allergies || '',
    medicalAlerts: student?.medicalAlerts || '',
    dietaryRestrictions: student?.dietaryRestrictions || '',
    emergencyMedicalInstructions: student?.emergencyMedicalInstructions || '',
    address: student?.address || '',
    photoUrl: student?.photoUrl || '',
    seatNumber: student?.seatNumber || '',
    generateSeatNumber: false,
  })

  // Report Card State
  const [reportCards, setReportCards] = useState<any[]>(profile.reportCards || [])
  const [loadingReportCards, setLoadingReportCards] = useState(false)
  const [bulkReportModalOpen, setBulkReportModalOpen] = useState(false)
  const [singleReportModalOpen, setSingleReportModalOpen] = useState(false)
  const [renderingReportId, setRenderingReportId] = useState<string | null>(null)
  const [reportForm, setReportForm] = useState<any>({
    id: undefined,
    term: 'Term 1',
    templateId: '',
    overallGrade: 'A',
    remarks: '',
    attendancePct: '95',
    status: 'DRAFT',
    domainMotor: 'Meeting Expectations',
    domainLanguage: 'Meeting Expectations',
    domainSocial: 'Meeting Expectations',
    domainCognitive: 'Meeting Expectations',
  })

  const loadReportCards = useCallback(async () => {
    if (!student?.id) return
    try {
      setLoadingReportCards(true)
      const res = await fetch(`/api/v1/academics/report-cards?studentId=${student.id}`).then((r) => r.json())
      if (res.success && Array.isArray(res.data?.reportCards)) {
        setReportCards(res.data.reportCards)
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingReportCards(false)
    }
  }, [student?.id])

  // Status Change Form State
  const [statusForm, setStatusForm] = useState({
    status: student?.status || 'ACTIVE',
    reason: '',
    notes: '',
    forceWithPendingFees: false,
  })

  // Guardian Modal State
  const [guardianForm, setGuardianForm] = useState({
    isEdit: false,
    guardianId: '',
    fullName: '',
    phone: '',
    email: '',
    occupation: '',
    relationship: 'MOTHER',
    isPrimary: false,
    canPickup: true,
    pickupPin: '',
    isFeePayer: false,
    receivesComm: true,
  })
  const [guardianToUnlink, setGuardianToUnlink] = useState<{ id: string; name: string } | null>(null)
  const [invitingGuardianId, setInvitingGuardianId] = useState<string | null>(null)

  const handleInviteGuardian = async (guardianId: string, guardianName: string) => {
    const previousGuardians = [...guardiansList]
    setInvitingGuardianId(guardianId)

    // Optimistic UI: mark invitation as pending immediately
    setGuardiansList((prev) =>
      prev.map((g) =>
        g.id === guardianId
          ? {
              ...g,
              portalAccount: g.portalAccount || {
                id: 'temp-invite-' + Date.now(),
                email: g.email || '',
                status: 'INVITATION_PENDING',
                isOptimistic: true,
              },
            }
          : g
      )
    )

    try {
      const res = await fetch(`/api/v1/students/${student?.id}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'INVITE', guardianId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Invitation sent', `Parent portal invitation dispatched to ${guardianName}`)
        if (json.data?.portalAccount || json.data?.guardian?.portalAccount) {
          const confirmedAccount = json.data?.portalAccount || json.data?.guardian?.portalAccount
          setGuardiansList((prev) =>
            prev.map((g) =>
              g.id === guardianId ? { ...g, portalAccount: confirmedAccount } : g
            )
          )
        }
      } else {
        // Rollback on rejection
        setGuardiansList(previousGuardians)
        toast.error('Invitation failed', json.error?.message || 'Could not send invitation')
      }
    } catch (err: any) {
      // Rollback on network failure
      setGuardiansList(previousGuardians)
      toast.error('Invitation error', err.message || 'Network error occurred')
    } finally {
      setInvitingGuardianId(null)
    }
  }

  // Branch Transfer State
  const [transferBranchId, setTransferBranchId] = useState('')
  const [transferClassroomId, setTransferClassroomId] = useState('')
  const [transferReason, setTransferReason] = useState('Campus relocation')

  // Promotion State
  const [promoteSessionId, setPromoteSessionId] = useState('')
  const [promoteClassroomId, setPromoteClassroomId] = useState('')
  const [promoteReason, setPromoteReason] = useState('Session progression')

  // Cancel Transport State
  const [cancelTransportReason, setCancelTransportReason] = useState('Parent requested cancellation')

  // Load classroom history and setup master lookups
  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`/api/v1/students/${student?.id}/allocate`).then((r) => r.json())
      if (r.success) setHistory(r.data.history)
    } catch {
      // silently fallback
    }
  }, [student?.id])

  // Document Library state
  const [studentDocuments, setStudentDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)

  const loadStudentDocuments = useCallback(async () => {
    if (!student?.id) return
    try {
      setLoadingDocs(true)
      const res = await fetch(`/api/v1/documents/profile?entityType=STUDENT&entityId=${student.id}`).then((r) => r.json())
      if (res.success) {
        setStudentDocuments(res.data || [])
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingDocs(false)
    }
  }, [student?.id])

  useEffect(() => {
    loadStudentDocuments()
  }, [loadStudentDocuments])

  const handleDeleteDocument = async (docId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from this student's profile?`)) return
    try {
      const res = await fetch(`/api/v1/documents/profile?id=${docId}`, { method: 'DELETE' }).then((r) => r.json())
      if (res.success) {
        toast.success('Document Deleted', 'Document removed from profile')
        loadStudentDocuments()
      } else {
        toast.error('Delete Failed', res.error || 'Could not delete document')
      }
    } catch {
      toast.error('Network Error', 'Failed to delete document')
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/classrooms?pageSize=100').then((r) => r.json()),
      fetch('/api/v1/branches').then((r) => r.json()),
      fetch('/api/v1/academic-years').then((r) => r.json()),
    ])
      .then(([cJson, bJson, sJson]) => {
        if (cJson.success && Array.isArray(cJson.data)) setClassrooms(cJson.data)
        if (bJson.success && Array.isArray(bJson.data)) setBranches(bJson.data)
        if (sJson.success && Array.isArray(sJson.data)) setSessions(sJson.data)
      })
      .catch(() => {})
    loadHistory()
  }, [loadHistory])

  const [reportTemplates, setReportTemplates] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/v1/templates?type=REPORT_CARD')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setReportTemplates(json.data)
        }
      })
      .catch(() => {})
  }, [])

  const handleRenderReportPdf = async (reportCardId: string) => {
    setRenderingReportId(reportCardId)
    try {
      const res = await fetch(`/api/v1/academics/report-cards/${reportCardId}/render`, {
        method: 'POST',
      }).then((r) => r.json())
      if (res.success) {
        toast.success('Report Card Generated', 'Official PDF has been compiled and saved to Profile Documents')
        loadReportCards()
        loadStudentDocuments()
        if (res.data?.document) {
          setPreviewDoc(res.data.document)
        }
      } else {
        toast.error('Generation Failed', res.error?.message || 'Could not compile report card PDF')
      }
    } catch (err: any) {
      toast.error('Network Error', err.message)
    } finally {
      setRenderingReportId(null)
    }
  }

  const handleSaveSingleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const selectedTmpl = reportForm.templateId || reportTemplates[0]?.id
      if (!selectedTmpl) {
        toast.error('Template Required', 'Please select a report card template')
        setBusy(false)
        return
      }

      const res = await fetch('/api/v1/academics/report-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicSessionId: academic?.session?.id || sessions[0]?.id,
          classroomId: academic?.classroom?.id || classrooms[0]?.id,
          studentId: student?.id,
          templateId: selectedTmpl,
          term: reportForm.term,
          status: reportForm.status,
          overallGrade: reportForm.overallGrade,
          remarks: reportForm.remarks,
          attendancePct: parseInt(reportForm.attendancePct, 10) || null,
          fieldValues: {
            overallGrade: { key: 'overallGrade', label: 'Overall Grade', type: 'grade', value: reportForm.overallGrade },
            remarks: { key: 'remarks', label: 'Educator Remarks', type: 'textarea', value: reportForm.remarks },
            attendancePct: { key: 'attendancePct', label: 'Attendance %', type: 'number', value: reportForm.attendancePct },
            domainMotor: { key: 'domainMotor', label: 'Gross & Fine Motor Skills', type: 'rating', value: reportForm.domainMotor },
            domainLanguage: { key: 'domainLanguage', label: 'Language & Phonics', type: 'rating', value: reportForm.domainLanguage },
            domainSocial: { key: 'domainSocial', label: 'Social & Emotional Harmony', type: 'rating', value: reportForm.domainSocial },
            domainCognitive: { key: 'domainCognitive', label: 'Cognitive & Sensory Exploration', type: 'rating', value: reportForm.domainCognitive },
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Report Card Saved', `Term assessment recorded for ${reportForm.term}`)
        setSingleReportModalOpen(false)
        loadReportCards()
      } else {
        toast.error('Save Failed', json.error?.message || 'Could not save report card')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // Auto-open student edit modal if navigated with ?edit=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('edit') === 'true') {
        setEditStudentOpen(true)
      }
    }
  }, [])

  // Photo processing: converts selected file to compressed JPEG data URL
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', 'Please select a JPEG, PNG, or WebP image')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setEditForm((prev) => ({ ...prev, photoUrl: compressedDataUrl }))
        toast.success('Photo ready', 'Image loaded and ready to save')
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 1. SAVE STUDENT IDENTITY
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    try {
      const res = await fetch(`/api/v1/students/${student?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Student updated', 'Identity, demographics and photo saved')
        setEditStudentOpen(false)
        router.refresh()
      } else {
        toast.error('Save failed', json.error?.message || 'Could not update student')
      }
    } catch (err: any) {
      toast.error('Save error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 2. CHANGE LIFECYCLE STATUS
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    try {
      const res = await fetch(`/api/v1/students/${student?.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Status updated', `Student status transitioned to ${statusForm.status}`)
        setStatusOpen(false)
        router.refresh()
      } else {
        toast.error('Transition failed', json.error?.message || 'Check compliance rules')
      }
    } catch (err: any) {
      toast.error('Status error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 3. SAVE / LINK GUARDIAN
  const handleSaveGuardian = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    try {
      const endpoint = `/api/v1/students/${student?.id}/guardians`
      const payload = {
        ...guardianForm,
        action: guardianForm.isEdit ? 'UPDATE' : 'LINK',
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Guardian saved', guardianForm.isEdit ? 'Guardian information updated' : 'Guardian linked successfully')
        setGuardianModalOpen(false)
        router.refresh()
      } else {
        toast.error('Guardian action failed', json.error?.message || 'Could not save guardian')
      }
    } catch (err: any) {
      toast.error('Guardian error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 4. UNLINK GUARDIAN
  const handleUnlinkGuardian = async () => {
    if (!guardianToUnlink) return
    setBusy(true)

    try {
      const res = await fetch(`/api/v1/students/${student?.id}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNLINK', guardianId: guardianToUnlink.id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Guardian unlinked', `${guardianToUnlink.name} removed from student record`)
        setUnlinkModalOpen(false)
        setGuardianToUnlink(null)
        router.refresh()
      } else {
        toast.error('Could not unlink', json.error?.message || 'Operation failed')
      }
    } catch (err: any) {
      toast.error('Unlink error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 5. ALLOCATE SECTION
  const handleAllocate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const classroomId = fd.get('classroomId') as string
    const reason = fd.get('reason') as string

    try {
      const res = await fetch(`/api/v1/students/${student?.id}/classroom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationClassroomId: classroomId, reason }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Classroom allocated', 'Student moved and seat generated')
        setAllocOpen(false)
        router.refresh()
      } else {
        toast.error('Allocation rejected', json.error?.message || 'Section may be full')
      }
    } catch (err: any) {
      toast.error('Allocation error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 6. CAMPUS BRANCH TRANSFER
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferBranchId || !transferClassroomId) {
      toast.error('Validation error', 'Destination branch and classroom are required')
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/v1/students/${student?.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationBranchId: transferBranchId,
          destinationClassroomId: transferClassroomId,
          reason: transferReason,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Branch transferred', 'Student transferred with historic record intact')
        setTransferOpen(false)
        router.refresh()
      } else {
        toast.error('Transfer rejected', json.error?.message || 'Capacity or eligibility error')
      }
    } catch (err: any) {
      toast.error('Transfer error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 7. ACADEMIC PROMOTION
  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoteSessionId || !promoteClassroomId) {
      toast.error('Validation error', 'Target session and classroom are required')
      return
    }

    setBusy(true)
    try {
      const targetClass = classrooms.find((c) => c.id === promoteClassroomId)
      const res = await fetch(`/api/v1/students/${student?.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAcademicSessionId: promoteSessionId,
          destinationClassroomId: promoteClassroomId,
          targetProgramType: targetClass?.programType,
          reason: promoteReason,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Promoted', 'Student advanced to next academic session')
        setPromoteOpen(false)
        router.refresh()
      } else {
        toast.error('Promotion failed', json.error?.message || 'Could not promote student')
      }
    } catch (err: any) {
      toast.error('Promotion error', err.message)
    } finally {
      setBusy(false)
    }
  }

  // 8. CANCEL TRANSPORT
  const handleCancelTransport = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    try {
      const res = await fetch(`/api/v1/students/${student?.id}/transport`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelTransportReason }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Transport cancelled', 'Student assignment unlinked')
        setCancelTransportOpen(false)
        router.refresh()
      } else {
        toast.error('Could not cancel transport', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Transport error', err.message)
    } finally {
      setBusy(false)
    }
  }

  const childAge = formatAge(student?.dob)
  const feeBalance = finance?.balanceCents || 0
  const attendanceRate = attendance?.percentage || 0

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* ── BREADCRUMB / BACK NAVIGATION ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Students Directory</span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/40">
          STUDENT 360° PROFILE
        </span>
      </div>

      {/* ── HERO DOSSIER CARD / PROFILE HEADER ── */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar with Photo & Camera Upload Trigger */}
          <div className="relative self-center sm:self-start">
            <Avatar
              name={student?.name || student?.fullName || student?.firstName}
              src={student?.photoUrl}
              size="lg"
            />
            {/* Status indicator ring */}
            <div
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                student?.status === 'ACTIVE'
                  ? 'bg-emerald-500'
                  : student?.status === 'WITHDRAWN'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              title={`Status: ${student?.status}`}
            />
            {/* Camera Trigger */}
            <button
              type="button"
              onClick={() => setEditStudentOpen(true)}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm hover:bg-purple-700 transition-colors"
              title="Edit identity & photo"
            >
              <Camera size={11} />
            </button>
          </div>

          {/* Child Identity Details */}
          <div className="flex-1 min-w-[260px] space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {student?.name || student?.fullName || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student'}
              </h1>

              {/* Status Badge with Click-to-Change */}
              <button
                type="button"
                onClick={() => {
                  setStatusForm({
                    status: student?.status || 'ACTIVE',
                    reason: '',
                    notes: '',
                    forceWithPendingFees: false,
                  })
                  setStatusOpen(true)
                }}
                className="hover:opacity-85 transition-opacity"
                title="Click to transition lifecycle status"
              >
                <StatusBadge status={student?.status || 'ACTIVE'} />
              </button>

              {student?.admissionNo && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                  {student.admissionNo}
                </span>
              )}

              {student?.seatNumber && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                  Seat: {student.seatNumber}
                </span>
              )}
            </div>

            {/* Program, Classroom & Educator Pill Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/60 dark:border-slate-700">
                <School size={13} className="text-purple-600 dark:text-purple-400" />
                <span>{academic?.classroom ? `${academic.classroom.name} (${enumLabel(academic.classroom.programType)})` : 'Unassigned Class'}</span>
              </span>

              {academic?.classroom?.primaryTeacher && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <UserCheck size={13} className="text-emerald-500" />
                  <span>Educator: {academic.classroom.primaryTeacher.fullName}</span>
                </span>
              )}
            </div>

            {/* Demographics row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              {childAge && (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Age {childAge}
                </span>
              )}
              {student?.dob && (
                <>
                  <span>•</span>
                  <span>Born {fmtDate(student.dob)}</span>
                </>
              )}
              {student?.gender && (
                <>
                  <span>•</span>
                  <span>{enumLabel(student.gender)}</span>
                </>
              )}
              {student?.bloodGroup && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    🩸 {student.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                  </span>
                </>
              )}
              {student?.admissionDate && (
                <>
                  <span>•</span>
                  <span>Enrolled {fmtDate(student.admissionDate)}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2.5 self-center sm:self-start flex-wrap justify-center sm:justify-end">
            {/* Attendance Quick Tile */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-center min-w-[90px]">
              <div className={`text-base font-bold ${attendanceRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {attendanceRate}%
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Attendance</div>
            </div>

            {/* Fee Balance Quick Tile */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-center min-w-[90px]">
              <div className={`text-base font-bold ${feeBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {inr(feeBalance, { compact: true })}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Fee Balance</div>
            </div>

            {/* Actions */}
            <button
              onClick={() => setEditStudentOpen(true)}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                setStatusForm({
                  status: student?.status || 'ACTIVE',
                  reason: '',
                  notes: '',
                  forceWithPendingFees: false,
                })
                setStatusOpen(true)
              }}
              className="h-10 px-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Change Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── HEALTH & MEDICAL DIRECTIVES ALERT BANNER (Section 7) ── */}
      {(student?.allergies || student?.medicalAlerts || student?.dietaryRestrictions || student?.emergencyMedicalInstructions) && (
        <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span>Medical & Health Directives Alert</span>
              {student?.bloodGroup && (
                <span className="px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                  Blood: {student.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
              {student?.allergies && (
                <div>
                  <span className="font-bold text-amber-950 dark:text-amber-100 block">Allergies:</span>
                  <span className="text-amber-800 dark:text-amber-300">{student.allergies}</span>
                </div>
              )}
              {student?.medicalAlerts && (
                <div>
                  <span className="font-bold text-amber-950 dark:text-amber-100 block">Medical Conditions:</span>
                  <span className="text-amber-800 dark:text-amber-300">{student.medicalAlerts}</span>
                </div>
              )}
              {student?.dietaryRestrictions && (
                <div>
                  <span className="font-bold text-amber-950 dark:text-amber-100 block">Dietary Restrictions:</span>
                  <span className="text-amber-800 dark:text-amber-300">{student.dietaryRestrictions}</span>
                </div>
              )}
              {student?.emergencyMedicalInstructions && (
                <div>
                  <span className="font-bold text-amber-950 dark:text-amber-100 block">Emergency Protocol:</span>
                  <span className="text-amber-800 dark:text-amber-300">{student.emergencyMedicalInstructions}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MULTI-TAB NAVIGATION STRIP ── */}
      <div className="overflow-x-auto scrollbar-none pb-1">
        <Segmented
          value={tab}
          onChange={handleTabChange}
          options={[
            { key: 'overview', label: 'Overview' },
            { key: 'guardians', label: `Guardians (${guardiansList.length})` },
            { key: 'academic', label: 'Academic & Class' },
            { key: 'report-cards', label: `Report Cards (${reportCards?.length || 0})` },
            { key: 'attendance', label: `Attendance (${attendanceRate}%)` },
            { key: 'transport', label: `Transport (${profile.transport?.activeAssignment ? 'Active' : 'None'})` },
            { key: 'fees', label: `Fees (${finance?.invoices?.length || 0})` },
            { key: 'inventory', label: `Inventory (${profile.inventory?.stockIssues?.length || 0})` },
            { key: 'observations', label: `Observations (${academics?.observations?.length || 0})` },
            { key: 'timeline', label: 'Timeline' },
            { key: 'documents', label: `Documents (${studentDocuments?.length || 0})` },
            { key: 'audit', label: `Audit (${audit?.length || 0})` },
          ]}
        />
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {visitedTabs.has('overview') && (
        <div
          role="tabpanel"
          id="tabpanel-overview"
          aria-labelledby="tab-overview"
          hidden={tab !== 'overview'}
          className={tab === 'overview' ? 'tab-panel-enter' : ''}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Child Identity & Personal Info */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Child Identity & Details</h3>
              </div>
              <button
                onClick={() => setEditStudentOpen(true)}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> Edit
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-slate-900 dark:text-white">{student?.firstName} {student?.lastName || ''}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Date of Birth</span>
                <span className="font-semibold text-slate-900 dark:text-white">{fmtDate(student.dob)} ({childAge || 'Calculated'})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Gender</span>
                <span className="text-slate-800 dark:text-slate-200">{enumLabel(student.gender)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Blood Group</span>
                <span className={`font-semibold ${student.bloodGroup ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  {student.bloodGroup ? student.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : 'Not recorded'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 items-start">
                <span className="text-slate-500">Residential Address</span>
                <span className="max-w-[240px] text-right text-slate-800 dark:text-slate-200">
                  {student.address || 'No residential address recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Current Enrollment & Origin Dossier */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <School size={17} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Admission & Placement Dossier</h3>
              </div>
              <StatusBadge status={admission?.status || student.status} />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Application Ref</span>
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{admission?.applicationNumber || 'Direct Enrollment'}</span>
              </div>
              {admission?.lead && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Lead Attribution</span>
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                    {admission.lead.leadNumber} • {admission.lead.source || 'Inquiry'}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Previous School</span>
                <span className="text-slate-800 dark:text-slate-200">{admission?.previousSchool || 'First-time Preschooler'}</span>
              </div>
              {admission?.offer && (
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Agreed Offer Terms</span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {inr(admission.offer.feeTotalCents || 0)} ({admission.offer.status})
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Enrolled Session</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{academic?.session?.name || 'Current Academic Session'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Enrollment Date</span>
                <span className="text-slate-800 dark:text-slate-200">{fmtDate(student.admissionDate)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 items-center">
                <span className="text-slate-500">Current Section</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{academic?.classroom?.name || 'Unassigned'}</span>
                  <button
                    onClick={() => setAllocOpen(true)}
                    className="text-xs font-semibold text-purple-600 hover:underline px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50"
                  >
                    Change
                  </button>
                </div>
              </div>
              <div className="flex justify-between py-1.5 items-center">
                <span className="text-slate-500">Seat Number</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {student.seatNumber || 'Not assigned'}
                </span>
              </div>
              {admission?.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                    <Lock size={12} className="text-slate-400" />
                    <span>Counselor & Intake Notes (Staff Only)</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                    &ldquo;{admission.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pickup Authorization Overview */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Pickup Authorization</h3>
              </div>
              <button
                onClick={() => {
                  setGuardianForm({
                    isEdit: false,
                    guardianId: '',
                    fullName: '',
                    phone: '',
                    email: '',
                    relationship: 'MOTHER',
                    isPrimary: false,
                    canPickup: true,
                    pickupPin: '',
                    isFeePayer: false,
                    receivesComm: true,
                  })
                  setGuardianModalOpen(true)
                }}
                className="text-xs font-semibold text-purple-600 hover:underline"
              >
                + Add Guardian
              </button>
            </div>

            <div className="space-y-2.5">
              {guardians && guardians.length > 0 ? (
                guardians.filter((g: any) => g.canPickup).map((g: any) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{g.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{enumLabel(g.relationship)}</span>
                        <span>•</span>
                        <span>{g.phone}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                      Authorized Pickup
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No authorized pickup individuals specified.</p>
              )}
            </div>
          </div>

          {/* Card 4: Parent Portal Connection */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone size={17} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Parent Portal Connection</h3>
              </div>
            </div>

            <div className="space-y-3">
              {guardians && guardians.some((g: any) => g.portalAccount) ? (
                guardians.filter((g: any) => g.portalAccount).map((g: any) => (
                  <div key={g.id} className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">{g.name}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                        ● Connected
                      </span>
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300">
                      Login Email: {g.portalAccount?.email}
                    </div>
                    {g.portalAccount?.lastLoginAt && (
                      <div className="text-[11px] text-slate-500">
                        Last Active: {timeAgo(g.portalAccount.lastLoginAt)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center space-y-1.5">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    No active parent portal account linked yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Guardians receive access invitations to monitor daily diary, attendance and invoices.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 2: GUARDIANS & PICKUPS ── */}
      {visitedTabs.has('guardians') && (
        <div
          role="tabpanel"
          id="tabpanel-guardians"
          aria-labelledby="tab-guardians"
          hidden={tab !== 'guardians'}
          className={tab === 'guardians' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Family & Guardian Roster</h2>
              <p className="text-xs text-slate-500">Designated emergency contacts, billing responsibilities and dismissal PINs.</p>
            </div>
            <button
              onClick={() => {
                setGuardianForm({
                  isEdit: false,
                  guardianId: '',
                  fullName: '',
                  phone: '',
                  email: '',
                  relationship: 'MOTHER',
                  isPrimary: false,
                  canPickup: true,
                  pickupPin: '',
                  isFeePayer: false,
                  receivesComm: true,
                })
                setGuardianModalOpen(true)
              }}
              className="bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>Link Guardian</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guardiansList && guardiansList.length > 0 ? (
              guardiansList.map((g: any) => (
                <div key={g.id} className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                        {g.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base">{g.name}</div>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          {enumLabel(g.relationship)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setGuardianForm({
                            isEdit: true,
                            guardianId: g.id,
                            fullName: g.name,
                            phone: g.phone || '',
                            email: g.email || '',
                            occupation: g.occupation || '',
                            relationship: g.relationship || 'MOTHER',
                            isPrimary: !!g.isPrimary,
                            canPickup: !!g.canPickup,
                            pickupPin: '',
                            isFeePayer: !!g.isFeePayer,
                            receivesComm: !!g.receivesComm,
                          })
                          setGuardianModalOpen(true)
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit guardian"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setGuardianToUnlink({ id: g.id, name: g.name })
                          setUnlinkModalOpen(true)
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Unlink guardian"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span>{g.phone || 'No phone number'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span>{g.email || 'No email address'}</span>
                    </div>
                    {g.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase size={13} className="text-slate-400" />
                        <span>{g.occupation}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges / Flags */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {g.isPrimary && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Primary Emergency
                      </span>
                    )}
                    {g.canPickup && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Pickup Authorized
                      </span>
                    )}
                    {g.isFeePayer && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Fee Payer
                      </span>
                    )}
                    {g.receivesComm && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        Daily Updates
                      </span>
                    )}
                  </div>

                  {/* Portal Account Link & Health */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {g.portalAccount ? (
                      <div className="space-y-0.5">
                        <div className={`flex items-center gap-1.5 font-semibold ${
                          g.portalAccount.status === 'INVITATION_PENDING' || g.portalAccount.isOptimistic
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {g.portalAccount.status === 'INVITATION_PENDING' || g.portalAccount.isOptimistic ? (
                            <>
                              <Clock size={14} className="animate-spin shrink-0" />
                              <span>Invitation Pending ({g.portalAccount.email || g.email || 'Dispatched'})</span>
                            </>
                          ) : (
                            <>
                              <CheckCheck size={14} />
                              <span>Portal Connected ({g.portalAccount.email})</span>
                            </>
                          )}
                        </div>
                        {g.portalAccount.sessions && g.portalAccount.sessions.length > 0 ? (
                          <div className="text-[11px] text-slate-400">
                            {g.portalAccount.sessions.length} active session{g.portalAccount.sessions.length > 1 ? 's' : ''} • Last active {timeAgo(g.portalAccount.sessions[0].lastActiveAt)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">
                            {g.portalAccount.status === 'INVITATION_PENDING' || g.portalAccount.isOptimistic
                              ? 'Invitation dispatched, waiting for parent acceptance'
                              : g.portalAccount.lastLoginAt
                              ? `Last login ${timeAgo(g.portalAccount.lastLoginAt)}`
                              : 'Account active'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-slate-400">No portal login linked</span>
                        <button
                          type="button"
                          onClick={() => handleInviteGuardian(g.id, g.name)}
                          disabled={invitingGuardianId === g.id}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Send size={11} />
                          <span>{invitingGuardianId === g.id ? 'Inviting...' : 'Invite to Portal'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2">
                <EmptyState
                  icon={<Users size={32} />}
                  title="No Guardians Linked"
                  message="Link family members to configure emergency contacts and dismissal authorization."
                  action={{
                    label: '+ Link Guardian',
                    onClick: () => setGuardianModalOpen(true),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 3: ACADEMIC & CLASS ── */}
      {visitedTabs.has('academic') && (
        <div
          role="tabpanel"
          id="tabpanel-academic"
          aria-labelledby="tab-academic"
          hidden={tab !== 'academic'}
          className={tab === 'academic' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          {/* Current Placement Card */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Current Classroom Allocation</h3>
                <p className="text-xs text-slate-500">Active classroom section, educator, and room seating.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setAllocOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Shuffle size={13} />
                  <span>Reallocate Class</span>
                </button>
                <button
                  onClick={() => setTransferOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <ArrowRightLeft size={13} />
                  <span>Campus Transfer</span>
                </button>
                <button
                  onClick={() => setPromoteOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <GraduationCap size={14} />
                  <span>Promote Session</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="text-[11px] uppercase font-bold text-slate-400">Classroom Section</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {academic?.classroom?.name || 'Unassigned'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {academic?.classroom?.programType ? enumLabel(academic.classroom.programType) : '—'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="text-[11px] uppercase font-bold text-slate-400">Assigned Educator</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {academic?.classroom?.primaryTeacher?.fullName || 'Not assigned'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {academic?.classroom?.primaryTeacher?.email || '—'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="text-[11px] uppercase font-bold text-slate-400">Seat Number</div>
                <div className="font-mono text-base font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {student?.seatNumber || 'Unassigned'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Capacity: {academic?.classroom?.capacity || 20} seats
                </div>
              </div>
            </div>
          </div>

          {/* Allocation History */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Academic Progression History</h3>
              <span className="text-xs text-slate-400">{history?.length || 0} recorded allocation{history?.length === 1 ? '' : 's'}</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history && history.length > 0 ? (
                history.map((alloc: any) => (
                  <div key={alloc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {alloc.classroomName || alloc.classroom?.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          alloc.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {alloc.status || 'COMPLETED'}
                        </span>
                        {alloc.programType && (
                          <span className="text-slate-400 text-xs">({enumLabel(alloc.programType)})</span>
                        )}
                      </div>
                      <div className="text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>Session: <strong className="text-slate-700 dark:text-slate-300">{alloc.sessionName || alloc.academicSession?.name}</strong></span>
                        {alloc.classroomCode && <span>• Code: {alloc.classroomCode}</span>}
                        <span>• Reason: {alloc.reason || 'General Placement'}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-slate-400 text-[11px] shrink-0">
                      <div>From: {fmtDate(alloc.startedAt)}</div>
                      {alloc.endedAt ? (
                        <div>To: {fmtDate(alloc.endedAt)}</div>
                      ) : (
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">Currently Active</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No historic class allocation records.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB: REPORT CARDS & EVALUATIONS (Section 17) ── */}
      {visitedTabs.has('report-cards') && (
        <div
          role="tabpanel"
          id="tabpanel-report-cards"
          aria-labelledby="tab-report-cards"
          hidden={tab !== 'report-cards'}
          className={tab === 'report-cards' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          {/* Action Header & Metric Strip */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Academic Term Evaluations & Report Cards</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Term assessments, developmental rubrics, educator observations, and official PDF report cards.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={loadReportCards}
                  className="btn btn-ghost btn-sm text-xs"
                  title="Refresh evaluations"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} className={loadingReportCards ? 'animate-spin' : ''} /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReportForm({
                      id: undefined,
                      term: 'Term 1',
                      templateId: reportTemplates[0]?.id || '',
                      status: 'DRAFT',
                      overallGrade: 'A',
                      remarks: '',
                      attendancePct: '95',
                      domainMotor: 'Meeting Expectations',
                      domainLanguage: 'Meeting Expectations',
                      domainSocial: 'Meeting Expectations',
                      domainCognitive: 'Meeting Expectations',
                    })
                    setSingleReportModalOpen(true)
                  }}
                  className="btn btn-outline btn-sm text-xs font-semibold text-purple-700 dark:text-purple-300"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FileText size={13} /> Single Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setBulkReportModalOpen(true)}
                  className="btn btn-primary btn-sm text-xs font-semibold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Sparkles size={13} /> Teacher Bulk Entry
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Evaluations</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{reportCards?.length || 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Published to Parents</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {reportCards?.filter((r) => r.status === 'PUBLISHED').length || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">In Draft / Review</div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {reportCards?.filter((r) => r.status !== 'PUBLISHED').length || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Active Classroom</div>
                <div className="text-sm font-bold text-purple-700 dark:text-purple-300 truncate mt-1">
                  {academic?.classroom?.name || 'Unassigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Evaluations Grid */}
          {loadingReportCards ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white/95 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80">
              <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-purple-600" />
              Loading student report cards...
            </div>
          ) : reportCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportCards.map((rc: any) => {
                const domainMotor = rc.fieldValues?.domainMotor?.value || rc.fieldValues?.domainMotor
                const domainLanguage = rc.fieldValues?.domainLanguage?.value || rc.fieldValues?.domainLanguage
                const domainSocial = rc.fieldValues?.domainSocial?.value || rc.fieldValues?.domainSocial
                const domainCognitive = rc.fieldValues?.domainCognitive?.value || rc.fieldValues?.domainCognitive

                return (
                  <div
                    key={rc.id}
                    className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 dark:hover:border-purple-800/60 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-base">
                              {rc.term}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              rc.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : rc.status === 'REVIEWED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}>
                              {rc.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Session: {rc.academicSession?.name || academic?.session?.name || 'Current Session'}
                            {rc.template?.name ? ` • Template: ${rc.template.name}` : ''}
                          </p>
                        </div>

                        {rc.overallGrade && (
                          <div className="text-right shrink-0">
                            <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                              {rc.overallGrade}
                            </div>
                            <div className="text-[10px] font-bold uppercase text-slate-400">Grade</div>
                          </div>
                        )}
                      </div>

                      {/* Evaluator & Attendance */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluator</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {rc.evaluatorName || 'Assigned Educator'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Term Attendance</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {rc.attendancePct != null ? `${rc.attendancePct}%` : 'Not recorded'}
                          </span>
                        </div>
                      </div>

                      {/* Remarks */}
                      {rc.remarks && (
                        <div className="text-xs bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-100/60 dark:border-purple-900/30">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block mb-0.5">
                            Educator Remarks:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 italic">
                            &ldquo;{rc.remarks}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Developmental Domains Chips */}
                      {(domainMotor || domainLanguage || domainSocial || domainCognitive) && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Developmental Areas</span>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {domainMotor && (
                              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex justify-between">
                                <span className="text-slate-500">Motor:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{domainMotor}</span>
                              </div>
                            )}
                            {domainLanguage && (
                              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex justify-between">
                                <span className="text-slate-500">Language:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{domainLanguage}</span>
                              </div>
                            )}
                            {domainSocial && (
                              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex justify-between">
                                <span className="text-slate-500">Social:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{domainSocial}</span>
                              </div>
                            )}
                            {domainCognitive && (
                              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex justify-between">
                                <span className="text-slate-500">Cognitive:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{domainCognitive}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        {rc.document ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(rc.document)}
                              className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              <Eye size={13} /> View PDF
                            </button>
                            <a
                              href={`/api/v1/documents/${rc.documentId}/download`}
                              download={rc.document.fileName || `ReportCard_${rc.term}.pdf`}
                              className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:underline"
                            >
                              <Download size={13} /> Download
                            </a>
                          </>
                        ) : null}

                        <button
                          type="button"
                          disabled={renderingReportId === rc.id}
                          onClick={() => handleRenderReportPdf(rc.id)}
                          className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300 hover:underline disabled:opacity-50"
                        >
                          {renderingReportId === rc.id ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" /> Compiling...
                            </>
                          ) : (
                            <>
                              <FileText size={13} /> {rc.document ? 'Re-render PDF' : 'Generate PDF'}
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReportForm({
                            id: rc.id,
                            term: rc.term,
                            templateId: rc.templateId,
                            status: rc.status,
                            overallGrade: rc.overallGrade || '',
                            remarks: rc.remarks || '',
                            attendancePct: rc.attendancePct != null ? String(rc.attendancePct) : '',
                            domainMotor: domainMotor || 'Meeting Expectations',
                            domainLanguage: domainLanguage || 'Meeting Expectations',
                            domainSocial: domainSocial || 'Meeting Expectations',
                            domainCognitive: domainCognitive || 'Meeting Expectations',
                          })
                          setSingleReportModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-purple-600"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <GraduationCap size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No academic report cards recorded
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Evaluate the child individually or launch Teacher Bulk Entry to record evaluations for the entire classroom in one pass.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportForm({
                      id: undefined,
                      term: 'Term 1',
                      templateId: reportTemplates[0]?.id || '',
                      status: 'DRAFT',
                      overallGrade: 'A',
                      remarks: '',
                      attendancePct: '95',
                      domainMotor: 'Meeting Expectations',
                      domainLanguage: 'Meeting Expectations',
                      domainSocial: 'Meeting Expectations',
                      domainCognitive: 'Meeting Expectations',
                    })
                    setSingleReportModalOpen(true)
                  }}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Create Individual Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setBulkReportModalOpen(true)}
                  className="btn btn-primary btn-sm text-xs"
                >
                  Launch Classroom Bulk Entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ── TAB 4: ATTENDANCE ── */}
      {visitedTabs.has('attendance') && (
        <div
          role="tabpanel"
          id="tabpanel-attendance"
          aria-labelledby="tab-attendance"
          hidden={tab !== 'attendance'}
          className={tab === 'attendance' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          {/* Top Attendance Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Attendance Rate</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{attendanceRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Calculated score</div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Present</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{attendance?.present || 0}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Full days</div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Absent</div>
              <div className={`text-2xl font-bold mt-1 ${attendance?.absent ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {attendance?.absent || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recorded absences</div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Late</div>
              <div className={`text-2xl font-bold mt-1 ${attendance?.late ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {attendance?.late || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Late check-ins</div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Tracked Days</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{attendance?.totalTracked || 0}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Past 60 days</div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Attendance Trail</h3>
              <Link
                href={`/app/daily-diary?tab=attendance&classroomId=${academic?.classroom?.id || ''}`}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Daily Diary Register</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendance?.recent && attendance.recent.length > 0 ? (
                attendance.recent.map((rec: any) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtDate(rec.date)}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      rec.status === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rec.status === 'ABSENT'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No attendance check-ins recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 5: TRANSPORT ── */}
      {visitedTabs.has('transport') && (
        <div
          role="tabpanel"
          id="tabpanel-transport"
          aria-labelledby="tab-transport"
          hidden={tab !== 'transport'}
          className={tab === 'transport' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          {profile.transport?.activeAssignment ? (
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bus size={18} className="text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Transportation Route</h3>
                </div>
                <button
                  onClick={() => setCancelTransportOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                >
                  Cancel Transport
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Route & Vehicle</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {profile.transport.activeAssignment.route?.name}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Vehicle: {profile.transport.activeAssignment.route?.vehicle?.registrationNo || 'Assigned Bus'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Stops & Schedule</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    Pickup: {profile.transport.activeAssignment.pickupStop?.name || 'Designated Stop'}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Drop: {profile.transport.activeAssignment.dropStop?.name || 'School Campus'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Bus size={28} />}
              title="No School Transport Assigned"
              description="There's no school transport route linked to this student's profile yet."
              action={{
                label: 'Assign Route',
                href: '/app/transport',
              }}
            />
          )}

          {/* Pickup & Dismissal Authorizations (Area D) */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Dismissal & Pickup Authorizations</h3>
              </div>
              <span className="text-xs text-slate-400">Guardian & Delegated Verification</span>
            </div>

            {/* Guardian Dismissal Status */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Guardian Dismissal Authorizations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guardians && guardians.length > 0 ? (
                  guardians.map((g: any) => (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{g.name} ({enumLabel(g.relationship)})</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{g.phone || 'No phone'}</div>
                      </div>
                      <div>
                        {g.canPickup ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check size={11} /> Authorized
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500">
                            No Dismissal Rights
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-2">No guardians registered.</p>
                )}
              </div>
            </div>

            {/* Third-Party Pickup Delegates */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Third-Party & Emergency Delegates</h4>
                <span className="text-xs text-slate-400">
                  {profile.transport?.pickupAuthorizations?.length || 0} registered
                </span>
              </div>

              {profile.transport?.pickupAuthorizations && profile.transport.pickupAuthorizations.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.transport.pickupAuthorizations.map((auth: any) => (
                    <div key={auth.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{auth.personName}</span>
                          <span className="text-slate-400 text-[11px]">({auth.relationship})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            auth.status === 'APPROVED' || auth.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {auth.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                          <span>Phone: {auth.phone}</span>
                          {auth.approvedByName && <span>• Approved by: {auth.approvedByName}</span>}
                        </div>
                      </div>
                      <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0">
                        <div>Valid: {fmtDate(auth.validFrom)} – {fmtDate(auth.validUntil)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No third-party temporary pickup delegates active.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 6: FEES & FINANCE ── */}
      {visitedTabs.has('fees') && (
        <div
          role="tabpanel"
          id="tabpanel-fees"
          aria-labelledby="tab-fees"
          hidden={tab !== 'fees'}
          className={tab === 'fees' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          {/* Fee Reconciliation Discrepancy Banner (Area E) */}
          {finance?.reconciliation?.hasDiscrepancy && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs shadow-xs">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-sm">Admission Offer Fee Discrepancy Detected</div>
                <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                  Agreed admission offer total is <strong>{inr(finance.reconciliation.offerAgreedCents)}</strong>, whereas total posted invoices in the student ledger equal <strong>{inr(finance.reconciliation.invoicedTotalCents)}</strong> (Variance: {inr(Math.abs(finance.reconciliation.discrepancyCents))}).
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  In accordance with financial compliance, historical invoices and ledgers remain immutable. Please create an adjustment credit/debit voucher if an alignment is required.
                </p>
              </div>
            </div>
          )}

          {/* Finance KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Total Billed</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{inr(finance?.totalBilledCents || 0)}</div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Total Paid</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{inr(finance?.totalPaidCents || 0)}</div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Current Balance</div>
              <div className={`text-xl font-bold mt-1 ${feeBalance > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                {inr(feeBalance)}
              </div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Overdue</div>
              <div className={`text-xl font-bold mt-1 ${finance?.overdueCents > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {inr(finance?.overdueCents || 0)}
              </div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Deposits Held</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {inr(finance?.depositsSummary?.remainingAmountCents || 0)}
              </div>
            </div>
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Refunded</div>
              <div className="text-xl font-bold text-slate-600 dark:text-slate-300 mt-1">
                {inr(finance?.depositsSummary?.refundedAmountCents || 0)}
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Invoices & Receipts</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {finance?.invoices && finance.invoices.length > 0 ? (
                finance.invoices.map((inv: any) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{inv.title || inv.invoiceNumber}</div>
                      <div className="text-slate-500 mt-0.5">
                        Due: {fmtDate(inv.dueDate)} • Billed: {inr(inv.totalCents)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {inv.status}
                      </span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                        Bal: {inr(inv.balanceCents)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No financial invoices found for this student.</p>
              )}
            </div>
          </div>

          {/* Security Deposits & Refunds Section (Area E) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deposits Card */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Security & Caution Deposits</h3>
                <span className="text-xs text-slate-400">{finance?.deposits?.length || 0} records</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {finance?.deposits && finance.deposits.length > 0 ? (
                  finance.deposits.map((dep: any) => (
                    <div key={dep.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{dep.depositNumber || dep.type}</div>
                        <div className="text-slate-400 text-[11px]">
                          Received: {fmtDate(dep.receivedAt)} • Remaining: {inr(dep.remainingAmountCents)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">{inr(dep.amountCents)}</div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {dep.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No security deposits on file.</p>
                )}
              </div>
            </div>

            {/* Refunds Card */}
            <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Processed Refunds</h3>
                <span className="text-xs text-slate-400">{finance?.refunds?.length || 0} records</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {finance?.refunds && finance.refunds.length > 0 ? (
                  finance.refunds.map((ref: any) => (
                    <div key={ref.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{ref.refundNumber}</div>
                        <div className="text-slate-400 text-[11px]">{ref.reason || 'Deposit return / Overpayment'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-rose-600 dark:text-rose-400">{inr(ref.amountCents)}</div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {ref.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No refunds recorded for this student.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB: INVENTORY ISSUES (Area C) ── */}
      {visitedTabs.has('inventory') && (
        <div
          role="tabpanel"
          id="tabpanel-inventory"
          aria-labelledby="tab-inventory"
          hidden={tab !== 'inventory'}
          className={tab === 'inventory' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Student Inventory & Issued Assets</h2>
              <p className="text-xs text-slate-500">Track kits, books, uniforms, learning materials and recorded returns.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {profile.inventory?.stockIssues?.length || 0} Issue Batches
            </span>
          </div>

          {/* Inventory Items List */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Issue Records & Itemized Assets</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {profile.inventory?.stockIssues && profile.inventory.stockIssues.length > 0 ? (
                profile.inventory.stockIssues.map((issue: any) => (
                  <div key={issue.id} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <Package size={15} className="text-purple-600" />
                          <span>{issue.issueNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            issue.status === 'COMPLETED' || issue.status === 'ISSUED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Issued on {fmtDate(issue.issueDate)} {issue.location?.name ? `• Location: ${issue.location.name}` : ''}
                        </div>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {issue.notes && <span className="italic">&ldquo;{issue.notes}&rdquo;</span>}
                      </div>
                    </div>

                    {/* Item lines */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-200/60 dark:border-slate-700/60">
                            <th className="pb-2 font-semibold">Item & SKU</th>
                            <th className="pb-2 font-semibold">Category</th>
                            <th className="pb-2 font-semibold text-center">Qty Issued</th>
                            <th className="pb-2 font-semibold text-center">Qty Returned</th>
                            <th className="pb-2 font-semibold text-right">Unit Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {issue.items?.map((item: any) => (
                            <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                              <td className="py-2 font-medium">
                                {item.itemName || item.item?.name || 'Supply item'}
                                {(item.itemSku || item.item?.sku) && (
                                  <span className="text-slate-400 font-mono text-[11px] ml-1.5">
                                    ({item.itemSku || item.item?.sku})
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-slate-500">{item.category || item.item?.category?.name || 'General'}</td>
                              <td className="py-2 text-center font-bold text-slate-900 dark:text-white">{item.quantity}</td>
                              <td className="py-2 text-center text-slate-500">{item.returnedQuantity || 0}</td>
                              <td className="py-2 text-right">
                                {item.unitCostCents || item.unitCost ? inr(item.unitCostCents || item.unitCost) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<Package size={28} />}
                  title="No Inventory Issues Yet"
                  description="Items issued to this classroom will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 7: OBSERVATIONS & PROGRESS ── */}
      {visitedTabs.has('observations') && (
        <div
          role="tabpanel"
          id="tabpanel-observations"
          aria-labelledby="tab-observations"
          hidden={tab !== 'observations'}
          className={tab === 'observations' ? 'tab-panel-enter' : ''}
        >
          <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Observations & Milestones</h2>
              <p className="text-xs text-slate-500">Documented developmental progress, milestones and classroom diary notes.</p>
            </div>
            <Link
              href="/app/daily-diary?tab=observations"
              className="bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <span>Open Daily Diary</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {academics?.observations && academics.observations.length > 0 ? (
              academics.observations.map((obs: any) => (
                <div key={obs.id} className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider text-[11px]">
                      {obs.category || 'Developmental Milestone'}
                    </span>
                    <span className="text-slate-400">{timeAgo(obs.observedAt)}</span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {obs.narrative}
                  </p>
                  {obs.concern && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                      <AlertTriangle size={12} />
                      <span>Educator concern flagged</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Sparkles size={28} />}
                title="No Observations Recorded Yet"
                description="Learning observations for this student will appear here when recorded."
                action={{
                  label: 'Add Observation',
                  href: `/app/daily-diary?tab=observations&studentId=${student?.id || ''}`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 8: TIMELINE ── */}
      {visitedTabs.has('timeline') && (
        <div
          role="tabpanel"
          id="tabpanel-timeline"
          aria-labelledby="tab-timeline"
          hidden={tab !== 'timeline'}
          className={tab === 'timeline' ? 'tab-panel-enter' : ''}
        >
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Student Chronological Activity Feed</h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timeline && timeline.length > 0 ? (
              timeline.map((item: any) => (
                <div key={item.id} className="relative text-xs space-y-1">
                  <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white dark:border-slate-900" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{item.title || item.type}</span>
                    <span className="text-slate-400">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3">No activity timeline events recorded yet.</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── TAB: DOCUMENTS LIBRARY ── */}
      {visitedTabs.has('documents') && (
        <div
          role="tabpanel"
          id="tabpanel-documents"
          aria-labelledby="tab-documents"
          hidden={tab !== 'documents'}
          className={tab === 'documents' ? 'tab-panel-enter' : ''}
        >
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Student Document Library</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official identity cards, certificates, forms, and report cards generated for this student.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadStudentDocuments}
                className="btn btn-ghost btn-sm"
                title="Refresh Documents"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={13} className={loadingDocs ? 'animate-spin' : ''} /> Refresh
              </button>
              <Link
                href="/app/reports"
                className="btn btn-outline btn-sm text-xs font-semibold text-purple-700 dark:text-purple-300"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={13} /> Bulk Generator
              </Link>
            </div>
          </div>

          {loadingDocs ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-purple-600" />
              Loading student documents...
            </div>
          ) : studentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentDocuments.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/60 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {doc.documentType?.replace(/_/g, ' ') || 'DOCUMENT'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(doc.fileSizeBytes / 1024)} KB
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {doc.title}
                    </h4>

                    <p className="text-[11px] text-slate-400">
                      Generated {fmtDate(doc.createdAt)} {doc.job?.title ? `• Job: ${doc.job.title}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                        title="View PDF Preview"
                      >
                        <Eye size={13} /> View
                      </button>
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        download={doc.fileName || `${doc.title}.pdf`}
                        className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:underline"
                        title="Download official PDF"
                      >
                        <Download size={13} /> Download
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <FileText size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No generated documents on file</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Documents generated via the Bulk Document Generation engine or Template Studio will automatically appear here.
              </p>
              <div className="pt-2">
                <Link
                  href="/app/reports"
                  className="btn btn-outline btn-sm text-xs"
                >
                  Go to Document Generation Jobs
                </Link>
              </div>
            </div>
          )}

          {/* Verified Admission & Intake Records (Section 16) */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Verified Admission Intake & Enrollment Records
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Birth certificate, immunization proofs, identity proofs, and intake documents verified during enrollment.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {admission?.documents?.length || 0} intake files
              </span>
            </div>

            {admission?.documents && admission.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {admission.documents.map((adDoc: any) => (
                  <div
                    key={adDoc.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {adDoc.documentType?.replace(/_/g, ' ') || adDoc.name || 'Admission Document'}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          adDoc.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {adDoc.status || 'VERIFIED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {adDoc.fileName || 'Document File'} {adDoc.verifiedAt ? `• Verified ${fmtDate(adDoc.verifiedAt)}` : ''}
                      </p>
                    </div>
                    {adDoc.fileUrl && (
                      <a
                        href={adDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-xs text-purple-600 hover:text-purple-700 shrink-0"
                        title="View original file"
                      >
                        <ExternalLink size={13} /> View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">
                No intake documents registered during enrollment.
              </p>
            )}
          </div>

          {previewDoc && (
            <PdfViewerModal
              open={!!previewDoc}
              onClose={() => setPreviewDoc(null)}
              documentId={previewDoc.id}
              title={previewDoc.title}
              documentType={previewDoc.documentType}
              fileSizeBytes={previewDoc.fileSizeBytes}
              fileName={previewDoc.fileName}
            />
          )}
        </div>
      </div>
      )}

      {/* ── TAB 9: AUDIT ── */}
      {visitedTabs.has('audit') && (
        <div
          role="tabpanel"
          id="tabpanel-audit"
          aria-labelledby="tab-audit"
          hidden={tab !== 'audit'}
          className={tab === 'audit' ? 'tab-panel-enter' : ''}
        >
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Immutable Security Audit Ledger</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {audit && audit.length > 0 ? (
              audit.map((a: any) => (
                <div key={a.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{a.action}</span>
                    <span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-500">
                    Actor: {a.actorName || a.actorId || 'System'}
                  </div>
                  {a.details && (
                    <pre className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto">
                      {typeof a.details === 'object' ? JSON.stringify(a.details, null, 2) : a.details}
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No audit records found.</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ── MODAL 1: FULL STUDENT IDENTITY & PHOTO EDITOR ── */}
      <Modal
        open={editStudentOpen}
        onClose={() => setEditStudentOpen(false)}
        title="Edit Student Information"
        subtitle="Manage canonical identity, demographics, photo, and classroom seat"
        icon={<Edit3 size={20} />}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {/* Photo Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center gap-4">
            <Avatar name={editForm.firstName || student?.name} src={editForm.photoUrl} size="lg" />
            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Child Photo</div>
              <p className="text-xs text-slate-500">Used across Directory, Student 360, and Dismissal Verification.</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <Upload size={12} />
                  <span>{editForm.photoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                </button>
                {editForm.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, photoUrl: '' }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Demographics Fields */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={editForm.lastName}
                onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth *</label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={editForm.dob}
                onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={editForm.gender}
                onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blood Group</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))}
              >
                <option value="">- Not Set -</option>
                <option value="A_POSITIVE">A+</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_POSITIVE">B+</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="AB_NEGATIVE">AB-</option>
                <option value="O_POSITIVE">O+</option>
                <option value="O_NEGATIVE">O-</option>
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Residential Address</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={editForm.address}
                onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Street address, locality, city"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Admission No.</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm font-mono text-slate-500 cursor-not-allowed"
                disabled
                value={student.admissionNo}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Seat Number</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={editForm.seatNumber}
                onChange={(e) => setEditForm((p) => ({ ...p, seatNumber: e.target.value, generateSeatNumber: false }))}
                placeholder="e.g. NUR-A-001"
              />
            </div>
          </div>

          {/* Health & Medical Directives (Section 7) */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Health, Allergies & Emergency Directives</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Known Allergies</label>
                <input
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={editForm.allergies || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, allergies: e.target.value }))}
                  placeholder="e.g. Peanuts, Dairy, Penicillin"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Medical Conditions / Alerts</label>
                <input
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={editForm.medicalAlerts || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, medicalAlerts: e.target.value }))}
                  placeholder="e.g. Asthma (carries inhaler), Febrile seizures"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dietary Restrictions</label>
                <input
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={editForm.dietaryRestrictions || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, dietaryRestrictions: e.target.value }))}
                  placeholder="e.g. Vegetarian, No eggs, Halal"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emergency Medical Protocol</label>
                <input
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={editForm.emergencyMedicalInstructions || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, emergencyMedicalInstructions: e.target.value }))}
                  placeholder="e.g. Call parent immediately, Dr. Mehta 9876543210"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setEditStudentOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm disabled:opacity-50"
            >
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: LIFECYCLE STATUS TRANSITION ── */}
      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Student Lifecycle Status"
        subtitle="Transition active, inactive, or withdrawal states with compliance checks"
        icon={<CheckCircle2 size={20} />}
      >
        <form onSubmit={handleStatusChange} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Status *</label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              value={statusForm.status}
              onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="ACTIVE">Active (Enrolled & Attending)</option>
              <option value="INACTIVE">Inactive (Temporarily on hold)</option>
              <option value="TRANSFERRED">Transferred (Moved branch or school)</option>
              <option value="WITHDRAWN">Withdrawn (Formal exit / non-destructive)</option>
              <option value="SUSPENDED">Suspended (Disciplinary / medical pause)</option>
              <option value="GRADUATED">Graduated (Completed preschool program)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason for Change *</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              value={statusForm.reason}
              onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Family relocation, completed preschool cycle"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Administrative Notes</label>
            <textarea
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              rows={2}
              value={statusForm.notes}
              onChange={(e) => setStatusForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes preserved in child permanent record"
            />
          </div>

          {statusForm.status === 'WITHDRAWN' && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle size={15} />
                <span>Non-Destructive Withdrawal Guard</span>
              </div>
              <p>Withdrawing marks active allocations as ended and sets status to INACTIVE. Records remain permanently preserved.</p>
              {feeBalance > 0 && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 space-y-1.5">
                  <div className="font-bold text-rose-600">Outstanding Balance: {inr(feeBalance)}</div>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={statusForm.forceWithPendingFees}
                      onChange={(e) => setStatusForm((p) => ({ ...p, forceWithPendingFees: e.target.checked }))}
                    />
                    <span>Confirm administrative override to withdraw with pending balance</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setStatusOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {busy ? 'Applying...' : 'Apply Status Transition'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 3: GUARDIAN MANAGEMENT ── */}
      <Modal
        open={guardianModalOpen}
        onClose={() => setGuardianModalOpen(false)}
        title={guardianForm.isEdit ? 'Edit Guardian Details' : 'Link Family Guardian'}
        subtitle="Manage contact details, pickup authorization, and fee responsibility"
        icon={<Users size={20} />}
      >
        <form onSubmit={handleSaveGuardian} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={guardianForm.fullName}
                onChange={(e) => setGuardianForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={guardianForm.phone}
                onChange={(e) => setGuardianForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="10-digit mobile phone"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={guardianForm.email}
                onChange={(e) => setGuardianForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="parent@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Occupation</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={guardianForm.occupation}
                onChange={(e) => setGuardianForm((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="e.g. Software Engineer, Doctor"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Relationship *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={guardianForm.relationship}
                onChange={(e) => setGuardianForm((p) => ({ ...p, relationship: e.target.value }))}
              >
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="GRANDPARENT">Grandparent</option>
                <option value="OTHER">Other Relative / Carer</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Permissions & Responsibilities
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianForm.isPrimary}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                />
                <span>Primary Emergency Contact</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianForm.canPickup}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, canPickup: e.target.checked }))}
                />
                <span>Authorized for Pickup</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianForm.isFeePayer}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, isFeePayer: e.target.checked }))}
                />
                <span>Designated Fee Payer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianForm.receivesComm}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, receivesComm: e.target.checked }))}
                />
                <span>Receives Daily Updates</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setGuardianModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {busy ? 'Saving...' : guardianForm.isEdit ? 'Update Guardian' : 'Save & Link Guardian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 4: GUARDIAN UNLINK ── */}
      <Modal
        open={unlinkModalOpen}
        onClose={() => setUnlinkModalOpen(false)}
        title="Unlink Guardian"
        subtitle="Remove contact association from this student"
        icon={<Trash2 size={20} className="text-rose-500" />}
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            Are you sure you want to unlink <b>{guardianToUnlink?.name}</b> from <b>{student.name}</b>?
          </p>
          <p className="text-xs text-slate-500">
            The guardian profile is permanently preserved in the school directory; only this student link will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setUnlinkModalOpen(false)}
            >
              Cancel
            </button>
            <button
              onClick={handleUnlinkGuardian}
              disabled={busy}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              Confirm Unlink
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 5: SECTION REALLOCATION ── */}
      <Modal
        open={allocOpen}
        onClose={() => setAllocOpen(false)}
        title="Reallocate Classroom Section"
        subtitle="Capacity-guarded · audited · history preserved"
        icon={<Shuffle size={20} />}
      >
        <form onSubmit={handleAllocate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Classroom Section *
            </label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              name="classroomId"
              required
              defaultValue=""
            >
              <option value="" disabled>Choose target section...</option>
              {classrooms
                .filter((c) => c.name !== academic?.classroom?.name)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {enumLabel(c.programType)} (Capacity: {c.capacity})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transfer Reason</label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              name="reason"
              defaultValue="Section change"
            >
              <option>Section change</option>
              <option>Program move</option>
              <option>Parent request</option>
              <option>Academic progression</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setAllocOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {busy ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 6: CAMPUS BRANCH TRANSFER ── */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Inter-Branch Campus Transfer"
        subtitle="Transfer child to another school branch with capacity check"
        icon={<ArrowRightLeft size={20} />}
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destination Branch *</label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              value={transferBranchId}
              onChange={(e) => setTransferBranchId(e.target.value)}
            >
              <option value="" disabled>Select target branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destination Classroom *</label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              value={transferClassroomId}
              onChange={(e) => setTransferClassroomId(e.target.value)}
            >
              <option value="" disabled>Select destination classroom...</option>
              {classrooms
                .filter((c) => !transferBranchId || c.branchId === transferBranchId || !c.branchId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {enumLabel(c.programType)} (Cap: {c.capacity})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Transfer Reason</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Relocation to West Campus neighborhood"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setTransferOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {busy ? 'Transferring...' : 'Execute Campus Transfer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 7: ACADEMIC PROMOTION ── */}
      <Modal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Promote to Next Academic Session"
        subtitle="Annual cohort progression preserving past session allocation history"
        icon={<GraduationCap size={20} />}
      >
        <form onSubmit={handlePromote} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Academic Session *</label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              value={promoteSessionId}
              onChange={(e) => setPromoteSessionId(e.target.value)}
            >
              <option value="" disabled>Select next academic session...</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Promoted Section *</label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              value={promoteClassroomId}
              onChange={(e) => setPromoteClassroomId(e.target.value)}
            >
              <option value="" disabled>Select classroom...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {enumLabel(c.programType)} (Cap: {c.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Promotion Reason / Notes</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              value={promoteReason}
              onChange={(e) => setPromoteReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setPromoteOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              {busy ? 'Promoting...' : 'Confirm Promotion'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 8: CANCEL TRANSPORT ASSIGNMENT ── */}
      <Modal
        open={cancelTransportOpen}
        onClose={() => setCancelTransportOpen(false)}
        title="Cancel Bus Route Assignment"
        subtitle="End student transportation without deleting past trip history"
        icon={<Bus size={20} className="text-rose-500" />}
      >
        <form onSubmit={handleCancelTransport} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to cancel transport assignment on route{' '}
            <b>{profile.transport?.activeAssignment?.route?.name}</b>?
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cancellation Reason</label>
            <input
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              value={cancelTransportReason}
              onChange={(e) => setCancelTransportReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setCancelTransportOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 9: SINGLE REPORT CARD ASSESSMENT (Section 17) ── */}
      <Modal
        open={singleReportModalOpen}
        onClose={() => setSingleReportModalOpen(false)}
        title={reportForm.id ? 'Edit Report Card Assessment' : 'New Report Card Assessment'}
        subtitle={`Evaluation for ${student?.firstName} ${student?.lastName || ''}`}
        icon={<GraduationCap size={20} />}
      >
        <form onSubmit={handleSaveSingleReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assessment Term *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
                value={reportForm.term}
                onChange={(e) => setReportForm((p) => ({ ...p, term: e.target.value }))}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="Final Term">Final Term</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Card Template *</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={reportForm.templateId}
                onChange={(e) => setReportForm((p) => ({ ...p, templateId: e.target.value }))}
              >
                {reportTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (v{t.version || 1})
                  </option>
                ))}
                {reportTemplates.length === 0 && (
                  <option value="">Default Preschool Report Card</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Overall Grade</label>
              <input
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={reportForm.overallGrade}
                onChange={(e) => setReportForm((p) => ({ ...p, overallGrade: e.target.value }))}
                placeholder="A+, A, B, Exceeds"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Attendance %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={reportForm.attendancePct}
                onChange={(e) => setReportForm((p) => ({ ...p, attendancePct: e.target.value }))}
                placeholder="95"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                value={reportForm.status}
                onChange={(e) => setReportForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="DRAFT">Draft</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="PUBLISHED">Published (Visible to Parents)</option>
              </select>
            </div>
          </div>

          {/* Developmental Domains */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
              Developmental Domain Rubrics
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Gross & Fine Motor Skills</label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  value={reportForm.domainMotor}
                  onChange={(e) => setReportForm((p) => ({ ...p, domainMotor: e.target.value }))}
                >
                  <option value="Exceeding Expectations">Exceeding Expectations</option>
                  <option value="Meeting Expectations">Meeting Expectations</option>
                  <option value="Emerging">Emerging</option>
                  <option value="Needs Support">Needs Support</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Language & Phonics</label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  value={reportForm.domainLanguage}
                  onChange={(e) => setReportForm((p) => ({ ...p, domainLanguage: e.target.value }))}
                >
                  <option value="Exceeding Expectations">Exceeding Expectations</option>
                  <option value="Meeting Expectations">Meeting Expectations</option>
                  <option value="Emerging">Emerging</option>
                  <option value="Needs Support">Needs Support</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Social & Emotional Harmony</label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  value={reportForm.domainSocial}
                  onChange={(e) => setReportForm((p) => ({ ...p, domainSocial: e.target.value }))}
                >
                  <option value="Exceeding Expectations">Exceeding Expectations</option>
                  <option value="Meeting Expectations">Meeting Expectations</option>
                  <option value="Emerging">Emerging</option>
                  <option value="Needs Support">Needs Support</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cognitive & Sensory Exploration</label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  value={reportForm.domainCognitive}
                  onChange={(e) => setReportForm((p) => ({ ...p, domainCognitive: e.target.value }))}
                >
                  <option value="Exceeding Expectations">Exceeding Expectations</option>
                  <option value="Meeting Expectations">Meeting Expectations</option>
                  <option value="Emerging">Emerging</option>
                  <option value="Needs Support">Needs Support</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Educator Remarks & Narrative</label>
            <textarea
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              rows={3}
              value={reportForm.remarks}
              onChange={(e) => setReportForm((p) => ({ ...p, remarks: e.target.value }))}
              placeholder="Detailed observations on student growth, curiosity, peer collaboration..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              onClick={() => setSingleReportModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm disabled:opacity-50"
            >
              {busy ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 10: TEACHER BULK REPORT ENTRY (Section 17) ── */}
      <BulkReportCardModal
        open={bulkReportModalOpen}
        onClose={() => setBulkReportModalOpen(false)}
        defaultClassroomId={academic?.classroom?.id}
        defaultSessionId={academic?.session?.id}
        onSaved={() => {
          loadReportCards()
          loadStudentDocuments()
        }}
      />
    </div>
  )
}
