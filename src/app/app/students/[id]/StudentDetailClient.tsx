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
  ExternalLink, Check, X, AlertCircle, RefreshCw
} from 'lucide-react'
import { Avatar, StatusBadge, Segmented, EmptyState } from '@/components/preone/ui'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import { Modal } from '@/components/preone/Modal'
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
    address: student?.address || '',
    photoUrl: student?.photoUrl || '',
    seatNumber: student?.seatNumber || '',
    generateSeatNumber: false,
  })

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
    relationship: 'MOTHER',
    isPrimary: false,
    canPickup: true,
    pickupPin: '',
    isFeePayer: false,
    receivesComm: true,
  })
  const [guardianToUnlink, setGuardianToUnlink] = useState<{ id: string; name: string } | null>(null)

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
      const res = await fetch(`/api/v1/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim() || undefined,
          dob: editForm.dob,
          gender: editForm.gender,
          bloodGroup: editForm.bloodGroup || undefined,
          address: editForm.address.trim() || undefined,
          photoUrl: editForm.photoUrl || undefined,
          seatNumber: editForm.seatNumber.trim() || undefined,
          generateSeatNumber: editForm.generateSeatNumber,
        }),
      })

      const json = await res.json()
      setBusy(false)

      if (json.success) {
        toast.success('Student updated', 'Student identity and profile updated successfully')
        setEditStudentOpen(false)
        router.refresh()
      } else {
        toast.error('Update failed', json.error?.message || 'Could not update student')
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Network error', err.message)
    }
  }

  // 2. STATUS TRANSITION
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    try {
      const res = await fetch(`/api/v1/students/${student.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusForm.status,
          reason: statusForm.reason || 'Administrative status change',
          notes: statusForm.notes || undefined,
          forceWithPendingFees: statusForm.forceWithPendingFees,
        }),
      })

      const json = await res.json()
      setBusy(false)

      if (json.success) {
        toast.success('Status updated', `Student status is now ${statusForm.status}`)
        setStatusOpen(false)
        router.refresh()
      } else {
        toast.error('Status transition blocked', json.error?.message || 'Failed to update status')
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Network error', err.message)
    }
  }

  // 3. GUARDIAN SAVE (LINK OR UPDATE)
  const handleSaveGuardian = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    try {
      const payload: any = {
        action: guardianForm.isEdit ? 'UPDATE' : 'LINK',
        guardianId: guardianForm.guardianId || undefined,
        fullName: guardianForm.fullName.trim(),
        phone: guardianForm.phone.trim(),
        email: guardianForm.email.trim() || undefined,
        relationship: guardianForm.relationship,
        isPrimary: guardianForm.isPrimary,
        canPickup: guardianForm.canPickup,
        pickupPin: guardianForm.pickupPin.trim() || undefined,
        isFeePayer: guardianForm.isFeePayer,
        receivesCommunication: guardianForm.receivesComm,
      }

      const res = await fetch(`/api/v1/students/${student.id}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      setBusy(false)

      if (json.success) {
        toast.success('Guardian saved', `${guardianForm.fullName} association updated`)
        setGuardianModalOpen(false)
        router.refresh()
      } else {
        toast.error('Guardian action failed', json.error?.message || 'Could not save guardian link')
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Network error', err.message)
    }
  }

  // 4. GUARDIAN UNLINK
  const handleUnlinkGuardian = async () => {
    if (!guardianToUnlink) return
    setBusy(true)

    try {
      const res = await fetch(`/api/v1/students/${student.id}/guardians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNLINK',
          guardianId: guardianToUnlink.id,
        }),
      })

      const json = await res.json()
      setBusy(false)

      if (json.success) {
        toast.success('Guardian unlinked', `${guardianToUnlink.name} removed from student family contacts`)
        setUnlinkModalOpen(false)
        setGuardianToUnlink(null)
        router.refresh()
      } else {
        toast.error('Unlink failed', json.error?.message)
      }
    } catch (err: any) {
      setBusy(false)
      toast.error('Network error', err.message)
    }
  }

  // 5. SECTION ALLOCATION
  const handleAllocate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/v1/students/${student.id}/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId: fd.get('classroomId'), reason: fd.get('reason') || undefined }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Allocation updated', `Now in ${json.data.classroom} — history preserved`)
      setAllocOpen(false)
      loadHistory()
      router.refresh()
    } else toast.error('Allocation blocked', json.error?.message)
  }

  // 6. INTER-BRANCH TRANSFER
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferBranchId || !transferClassroomId) {
      toast.error('Required fields', 'Please select destination branch and classroom')
      return
    }
    setBusy(true)
    const res = await fetch(`/api/v1/students/${student.id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationBranchId: transferBranchId,
        destinationClassroomId: transferClassroomId,
        reason: transferReason,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Transfer complete', `Student transferred to ${json.data.branchName} — ${json.data.classroomName}`)
      setTransferOpen(false)
      router.refresh()
    } else toast.error('Transfer blocked', json.error?.message)
  }

  // 7. ACADEMIC SESSION PROMOTION
  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoteSessionId || !promoteClassroomId) {
      toast.error('Required fields', 'Please select target session and classroom')
      return
    }
    const targetClass = classrooms.find((c) => c.id === promoteClassroomId)
    setBusy(true)
    const res = await fetch(`/api/v1/students/${student.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nextAcademicSessionId: promoteSessionId,
        nextProgramId: (targetClass as any)?.programId || targetClass?.programType || 'NURSERY',
        nextClassroomId: promoteClassroomId,
        reason: promoteReason,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Promoted successfully', `Student promoted into next academic session`)
      setPromoteOpen(false)
      router.refresh()
    } else toast.error('Promotion blocked', json.error?.message)
  }

  // 8. PICKUP RELEASE
  const release = async (guardianId: string, guardianName: string) => {
    setBusy(true)
    const res = await fetch('/api/v1/operations/pickup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: student.id, guardianId }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) toast.success('Released', `${guardianName} verified — pickup recorded on child timeline`)
    else toast.error('RELEASE BLOCKED', json.error?.message || 'Not an authorised pickup contact — safety follow-up raised')
  }

  // 9. CANCEL TRANSPORT ASSIGNMENT
  const handleCancelTransport = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeAssignmentId = profile.transport?.activeAssignment?.id
    if (!activeAssignmentId) return

    setBusy(true)
    const res = await fetch(`/api/v1/transport/assignments/${activeAssignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CANCEL', reason: cancelTransportReason }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Transport cancelled', 'Student bus assignment cancelled and historical trip logs preserved')
      setCancelTransportOpen(false)
      router.refresh()
    } else toast.error('Cancellation failed', json.error?.message)
  }

  const childAge = formatAge(student?.dob)
  const feeBalance = finance?.balanceCents || 0
  const attendanceRate = attendance?.percentage || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/app/home' },
          { label: 'Students', href: '/app/students' },
          { label: student?.name || student?.fullName || student?.firstName || 'Student Profile' },
        ]}
      />

      {/* Hero Dossier Card with Comprehensive Identity Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--primary-light) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: '0 4px 20px -2px rgba(91, 61, 245, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar with Photo & Upload Trigger */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar name={student?.name || student?.fullName || student?.firstName} src={student?.photoUrl} size="lg" />
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: student?.status === 'ACTIVE' ? 'var(--success)' : student?.status === 'WITHDRAWN' ? 'var(--danger)' : 'var(--text-secondary)',
                border: '2px solid var(--surface)',
                width: 15,
                height: 15,
                borderRadius: '50%',
              }}
              title={`Status: ${student?.status}`}
            />
            <button
              type="button"
              onClick={() => setEditStudentOpen(true)}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--primary)',
                color: 'var(--surface)',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--surface)',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
              title="Edit identity & photo"
            >
              <Camera size={12} />
            </button>
          </div>

          {/* Child Identity Details */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
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
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                title="Click to transition lifecycle status"
              >
                <StatusBadge status={student?.status || 'ACTIVE'} />
              </button>

              {student?.admissionNo && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: 6,
                    background: 'rgba(91, 61, 245, 0.08)',
                    color: 'var(--preone-primary)',
                    border: '1px solid rgba(91, 61, 245, 0.16)',
                  }}
                  title="Admission Number (System Generated)"
                >
                  {student.admissionNo}
                </span>
              )}

              {student?.seatNumber && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'var(--info-soft)',
                    color: 'var(--info)',
                    border: '1px solid var(--info-soft)',
                  }}
                >
                  Seat {student.seatNumber}
                </span>
              )}
            </div>

            {/* Program & Teacher Pill Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  background: 'var(--surface-muted)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <School size={14} style={{ color: 'var(--preone-primary)' }} />
                {academic?.classroom ? `${academic.classroom.name} (${enumLabel(academic.classroom.programType)})` : 'Unassigned Class'}
              </span>

              {academic?.classroom?.primaryTeacher && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: 'var(--foreground-muted)',
                    background: 'var(--bg-subtle)',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                >
                  <UserCheck size={14} style={{ color: 'var(--success)' }} />
                  Lead: {academic.classroom.primaryTeacher.fullName}
                </span>
              )}
            </div>

            {/* Demographics row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                fontSize: 12.5,
                color: 'var(--foreground-muted)',
                marginTop: 10,
              }}
            >
              {childAge && (
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
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
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
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

          {/* Quick Stats & Action Cards */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                minWidth: 100,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: attendanceRate >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                {attendanceRate}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--foreground-muted)', fontWeight: 500 }}>Attendance</div>
            </div>

            <div
              style={{
                padding: '8px 14px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                minWidth: 100,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: feeBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {inr(feeBalance, { compact: true })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--foreground-muted)', fontWeight: 500 }}>Fee Balance</div>
            </div>

            {/* Primary Edit Button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditForm({
                  firstName: student?.firstName || '',
                  lastName: student?.lastName || '',
                  dob: student?.dob ? new Date(student.dob).toISOString().slice(0, 10) : '',
                  gender: student?.gender || 'MALE',
                  bloodGroup: student?.bloodGroup || '',
                  address: student?.address || '',
                  photoUrl: student?.photoUrl || '',
                  seatNumber: student?.seatNumber || '',
                  generateSeatNumber: false,
                })
                setEditStudentOpen(true)
              }}
              style={{ height: 38, padding: '0 14px', fontWeight: 600, gap: 6 }}
            >
              <Edit3 size={14} /> Edit Student
            </button>

            {/* Status Button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStatusForm({
                  status: student?.status || 'ACTIVE',
                  reason: '',
                  notes: '',
                  forceWithPendingFees: false,
                })
                setStatusOpen(true)
              }}
              style={{ height: 38, padding: '0 12px', fontWeight: 600, gap: 6 }}
            >
              Change Status
            </button>
          </div>
        </div>
      </div>

      {/* 9-Tab Navigation with horizontal scroll on mobile */}
      <div style={{ overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'overview', label: 'Overview' },
            { key: 'guardians', label: `Guardians (${guardians?.length || 0})` },
            { key: 'academic', label: 'Academic & Class' },
            { key: 'attendance', label: `Attendance (${attendanceRate}%)` },
            { key: 'transport', label: `Transport (${profile.transport?.activeAssignment ? 'Active' : 'None'})` },
            { key: 'fees', label: `Fees (${finance?.invoices?.length || 0})` },
            { key: 'observations', label: `Observations (${academics?.observations?.length || 0})` },
            { key: 'timeline', label: 'Timeline' },
            { key: 'audit', label: `Audit (${audit?.length || 0})` },
          ]}
        />
      </div>

      {/* Tab 1: Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }} className="dash-grid">
          {/* Child Identity & Personal Info Card */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} style={{ color: 'var(--preone-primary)' }} />
                <div className="card-title" style={{ fontSize: 16 }}>Child Identity & Details</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditStudentOpen(true)}
                style={{ height: 30, fontSize: 12, padding: '0 10px', gap: 5 }}
              >
                <Edit3 size={13} /> Edit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Full Name</span>
                <b style={{ fontSize: 13 }}>{student?.firstName} {student?.lastName || ''}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Date of Birth</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(student.dob)} ({childAge || 'Calculated'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Gender</span>
                <span style={{ fontSize: 13 }}>{enumLabel(student.gender)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Blood Group</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: student.bloodGroup ? 'var(--danger)' : undefined }}>
                  {student.bloodGroup ? student.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : 'Not recorded'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', alignItems: 'flex-start' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Residential Address</span>
                <span style={{ maxWidth: 220, textAlign: 'right', fontSize: 13, color: student.address ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                  {student.address || 'No residential address recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Admission & Origin Card */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <School size={18} style={{ color: 'var(--preone-primary)' }} />
                <div className="card-title" style={{ fontSize: 16 }}>Admission & Origin</div>
              </div>
              <StatusBadge status={admission?.status || student.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Application Ref</span>
                <b style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{admission?.applicationNumber || 'Direct Enrollment'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Enrolled Session</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{academic?.session?.name || 'Current Academic Session'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Enrollment Date</span>
                <span style={{ fontSize: 13 }}>{fmtDate(student.admissionDate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Current Section</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{academic?.classroom?.name || 'Unassigned'}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAllocOpen(true)}
                    style={{ height: 24, fontSize: 11, padding: '0 6px' }}
                  >
                    Change
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span className="t-caption" style={{ fontSize: 13 }}>Seat Number</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
                  {student.seatNumber || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Pickup Authorization Card */}
          <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                <div>
                  <div className="card-title" style={{ fontSize: 16 }}>Dismissal & Pickup Authorization</div>
                  <div className="card-sub" style={{ fontSize: 12 }}>Safety verification for guardian handover at school gate</div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
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
                style={{ height: 30, fontSize: 12, padding: '0 10px', gap: 5 }}
              >
                <UserPlus size={13} /> Link Guardian
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {guardians && guardians.length > 0 ? (
                guardians.map((g: any) => (
                  <div
                    key={g.id || g.name}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      background: 'var(--surface-muted)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <Avatar name={g.name} size="sm" />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--foreground)' }}>{g.name}</span>
                        {g.isPrimary && (
                          <span className="badge b-primary" style={{ height: 18, fontSize: 10, padding: '0 6px' }}>Primary</span>
                        )}
                      </div>
                      <div className="t-caption" style={{ fontSize: 12, marginTop: 2 }}>
                        {enumLabel(g.relationship)} · {g.phone}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${g.canPickup ? 'b-success' : 'b-neutral'}`} style={{ height: 22 }}>
                        {g.canPickup ? 'Authorized' : 'No Pickup'}
                      </span>
                      {g.canPickup && (
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={busy}
                          onClick={() => release(g.id, g.name)}
                          style={{ height: 30, fontSize: 12, padding: '0 8px' }}
                          title="Record verified pickup event on child timeline"
                        >
                          <ShieldCheck size={13} style={{ color: 'var(--success)' }} /> Release
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={<ShieldAlert size={32} />} title="No Guardians Configured" message="Add authorized parents or emergency contacts to configure dismissal safety." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guardians */}
      {tab === 'guardians' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="card-title" style={{ fontSize: 17 }}>Family & Guardians</div>
              <div className="card-sub">Primary contacts, billing guarantors, and parent portal access</div>
            </div>
            <button
              className="btn btn-primary btn-sm"
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
              style={{ gap: 6 }}
            >
              <UserPlus size={14} /> Add / Link Guardian
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {guardians?.map((g: any) => (
              <div
                key={g.id || g.name}
                className="card card-hover"
                style={{
                  boxShadow: 'none',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  borderRadius: 14,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={g.name} size="md" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--foreground)' }}>{g.name}</div>
                    <div className="t-caption" style={{ fontSize: 12.5 }}>{enumLabel(g.relationship)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setGuardianForm({
                          isEdit: true,
                          guardianId: g.id,
                          fullName: g.name,
                          phone: g.phone || '',
                          email: g.email || '',
                          relationship: g.relationship || 'MOTHER',
                          isPrimary: !!g.isPrimary,
                          canPickup: g.canPickup !== false,
                          pickupPin: g.pickupPin || '',
                          isFeePayer: !!g.isFeePayer,
                          receivesComm: g.receivesComm !== false,
                        })
                        setGuardianModalOpen(true)
                      }}
                      style={{ height: 28, width: 28, padding: 0 }}
                      title="Edit Guardian details and relationship permissions"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setGuardianToUnlink({ id: g.id, name: g.name })
                        setUnlinkModalOpen(true)
                      }}
                      style={{ height: 28, width: 28, padding: 0, color: 'var(--danger)' }}
                      title="Unlink guardian from child"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--foreground)' }}>
                    <Phone size={14} style={{ color: 'var(--foreground-muted)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{g.phone || 'No phone recorded'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--foreground-muted)' }}>
                    <Mail size={14} />
                    <span style={{ fontSize: 12.5 }}>{g.email || 'No email on file'}</span>
                  </div>
                  {g.address && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--foreground-muted)' }}>
                      <MapPin size={14} style={{ marginTop: 2 }} />
                      <span style={{ fontSize: 12 }}>{g.address}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {g.isPrimary && <span className="badge b-primary">Primary Contact</span>}
                  {g.isFeePayer && <span className="badge b-info">Fee Payer</span>}
                  {g.portalAccount && <span className="badge b-success">Portal Active</span>}
                  {g.canPickup ? <span className="badge b-success">Pickup Authorized</span> : <span className="badge b-neutral">No Pickup</span>}
                </div>
              </div>
            ))}
            {(!guardians || guardians.length === 0) && (
              <EmptyState icon={<Users size={32} />} title="No Guardians" message="No guardian contacts linked to this child record." />
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Academic & Class */}
      {tab === 'academic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current Enrollment */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-head" style={{ marginBottom: 18 }}>
              <div>
                <div className="card-title" style={{ fontSize: 17 }}>Current Academic Enrollment</div>
                <div className="card-sub">Active session, assigned classroom, and pedagogy lead</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setAllocOpen(true)}>
                  <Shuffle size={13} /> Change Section
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setTransferOpen(true)}>
                  <ArrowRightLeft size={13} /> Branch Transfer
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPromoteOpen(true)}>
                  <GraduationCap size={13} /> Promote Session
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 12 }}>Academic Session</span>
                <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--foreground)', marginTop: 4 }}>
                  {academic?.session?.name || 'Current Session'}
                </div>
              </div>
              <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 12 }}>Classroom / Section</span>
                <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--foreground)', marginTop: 4 }}>
                  {academic?.classroom?.name || 'Unassigned'}
                </div>
              </div>
              <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 12 }}>Program Track</span>
                <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--foreground)', marginTop: 4 }}>
                  {enumLabel(academic?.classroom?.programType || 'Not set')}
                </div>
              </div>
              <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span className="t-caption" style={{ fontSize: 12 }}>Primary Educator</span>
                <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--foreground)', marginTop: 4 }}>
                  {academic?.classroom?.primaryTeacher?.fullName || 'No lead teacher assigned'}
                </div>
              </div>
            </div>
          </div>

          {/* Allocation History */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-head" style={{ marginBottom: 18 }}>
              <div>
                <div className="card-title" style={{ fontSize: 17 }}>Allocation History</div>
                <div className="card-sub">Session-by-session historical trail (immutable audit)</div>
              </div>
              <span className="badge b-neutral" style={{ fontSize: 11 }}>Read Only</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history && history.length > 0 ? (
                history.map((h: any) => (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--surface-muted)',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
                        {h.classroomName || h.classroom?.name}
                        {h.programType && (
                          <span style={{ fontWeight: 400, color: 'var(--foreground-muted)', marginLeft: 6 }}>
                            ({enumLabel(h.programType)})
                          </span>
                        )}
                      </div>
                      <div className="t-caption" style={{ fontSize: 12, marginTop: 2 }}>
                        Session: {h.sessionName || h.session?.name || 'Current'}
                        {h.reason ? ` · Reason: ${h.reason}` : ''}
                      </div>
                    </div>

                    <StatusBadge status={h.status || 'ACTIVE'} />

                    <div className="t-caption" style={{ fontSize: 12, minWidth: 160, textAlign: 'right' }}>
                      {fmtDate(h.startedAt)}{h.endedAt ? ` → ${fmtDate(h.endedAt)}` : ' → Present'}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={<Shuffle size={32} />} title="No Allocation History" message="Classroom allocations and section transfers will appear here." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Attendance */}
      {tab === 'attendance' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="card-title" style={{ fontSize: 17 }}>Attendance Record</div>
              <div className="card-sub">
                {attendance?.present || 0} of {attendance?.totalTracked || 0} instructional days attended ({attendanceRate}%)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href={`/app/attendance?classroomId=${academic?.classroom?.id || ''}`}
                className="btn btn-secondary btn-sm"
                style={{ gap: 6 }}
              >
                <CalendarDays size={14} /> Open Class Register
              </Link>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: attendanceRate >= 80 ? 'var(--success)' : 'var(--warning)',
                  background: attendanceRate >= 80 ? 'var(--success-soft)' : 'var(--warning-soft)',
                  padding: '4px 12px',
                  borderRadius: 8,
                }}
              >
                {attendanceRate}% Present
              </span>
            </div>
          </div>

          {/* Attendance progress bar */}
          <div style={{ width: '100%', height: 8, background: 'var(--border-default)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, attendanceRate))}%`,
                height: '100%',
                background: attendanceRate >= 80 ? 'linear-gradient(90deg, var(--success), var(--success))' : 'linear-gradient(90deg, var(--warning), var(--warning))',
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ fontSize: 13.5, fontWeight: 650, marginBottom: 12, color: 'var(--foreground)' }}>
            Recent Daily Log
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {attendance?.recent?.map((a: any) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  background: 'var(--surface-muted)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}
              >
                <span className="t-caption" style={{ fontSize: 11.5, fontWeight: 600 }}>{fmtDate(a.date)}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {(!attendance?.recent || attendance.recent.length === 0) && (
              <div style={{ gridColumn: '1 / -1' }}>
                <EmptyState icon={<CalendarDays size={32} />} title="No Attendance Recorded" message="Daily attendance records will appear once homeroom educators mark morning roll call." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Transport */}
      {tab === 'transport' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }} className="dash-grid">
          {/* Active Transport Assignment */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-head" style={{ marginBottom: 18 }}>
              <div>
                <div className="card-title" style={{ fontSize: 17 }}>Bus Route & Stops</div>
                <div className="card-sub">Assigned morning pickup and evening drop points</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/app/transport" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                  <ExternalLink size={13} /> Open Transport
                </Link>
                {profile.transport?.activeAssignment && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCancelTransportOpen(true)}
                    style={{ color: 'var(--danger)', height: 32, fontSize: 12 }}
                  >
                    Cancel Assignment
                  </button>
                )}
              </div>
            </div>

            {profile.transport?.activeAssignment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(91, 61, 245, 0.06)',
                    borderRadius: 12,
                    border: '1px solid rgba(91, 61, 245, 0.14)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--preone-primary)' }}>
                      {profile.transport.activeAssignment.route.name}
                    </div>
                    <div className="t-caption" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      Route Code: {profile.transport.activeAssignment.route.code}
                    </div>
                  </div>
                  <span className="badge b-success">ACTIVE</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="t-caption">Vehicle / Bus</span>
                    <b>{profile.transport.activeAssignment.route.vehicle ? `${profile.transport.activeAssignment.route.vehicle.registrationNumber} (${profile.transport.activeAssignment.route.vehicle.makeModel || 'School Van'})` : 'Standard Van'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="t-caption">Assigned Driver</span>
                    <b>{profile.transport.activeAssignment.route.driverProfile?.user?.fullName || 'School Fleet Driver'} {profile.transport.activeAssignment.route.driverProfile?.user?.phone ? `(${profile.transport.activeAssignment.route.driverProfile.user.phone})` : ''}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="t-caption">Bus Attendant</span>
                    <b>{profile.transport.activeAssignment.route.attendantProfile?.user?.fullName || 'Assigned Staff'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="t-caption">Morning Pickup</span>
                    <b>{profile.transport.activeAssignment.pickupStop?.name} ({profile.transport.activeAssignment.pickupStop?.morningPickupTime || 'Scheduled'})</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="t-caption">Evening Drop</span>
                    <b>{profile.transport.activeAssignment.dropStop?.name} ({profile.transport.activeAssignment.dropStop?.eveningDropTime || 'Scheduled'})</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span className="t-caption">Monthly Transport Fee</span>
                    <b style={{ color: 'var(--foreground)' }}>
                      {profile.transport.activeAssignment.monthlyFeeCents > 0 ? inr(profile.transport.activeAssignment.monthlyFeeCents) : 'Included / Complimentary'}
                    </b>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={<Bus size={32} />} title="No Active Transport" message="This child is currently marked as self-drop or walking (no bus assigned)." />
            )}
          </div>

          {/* Recent Trips */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-head" style={{ marginBottom: 18 }}>
              <div>
                <div className="card-title" style={{ fontSize: 17 }}>Recent Trips & Boarding Log</div>
                <div className="card-sub">Real-time stops, handover, and attendance verification</div>
              </div>
              <Clock3 size={18} style={{ color: 'var(--foreground-muted)' }} />
            </div>

            {profile.transport?.recentTrips && profile.transport.recentTrips.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.transport.recentTrips.map((item: any) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--surface-muted)',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <b>{item.trip?.route?.name || 'Bus Route'} ({item.trip?.tripType || 'TRIP'})</b>
                      <div className="t-caption" style={{ fontSize: 11.5, marginTop: 2 }}>
                        Stop: {item.stop?.name || 'Designated Stop'} · {fmtDate(item.trip?.tripDate)}
                      </div>
                    </div>
                    <span className={`badge ${item.status === 'DROPPED' || item.status === 'BOARDED' ? 'b-success' : item.status === 'ABSENT' ? 'b-danger' : 'b-info'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Clock3 size={32} />} title="No Trip Records" message="Recent boarding and handover events will appear once drivers log trips." />
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Fees */}
      {tab === 'fees' && (
        <div className="dtable-wrap" style={{ borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="table-toolbar" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title" style={{ fontSize: 17 }}>Fee Invoices & Ledger</div>
              <div className="card-sub">Total dues, payment status, and parent fee receipts</div>
            </div>
            <Link href={`/app/finance?studentId=${student.id}`} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
              <CreditCard size={14} /> Open Fee Manager
            </Link>
          </div>

          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Invoice Ref</th>
                  <th>Due Date</th>
                  <th>Total Due</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {finance?.invoices?.map((i: any) => (
                  <tr key={i.id} onClick={() => router.push(`/app/finance?invoice=${i.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span className="cell-strong" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--preone-primary)' }}>
                        {i.invoiceNumber}
                      </span>
                      <span className="cell-sub">{i.title}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{fmtDate(i.dueDate)}</td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{inr(i.totalCents)}</td>
                    <td style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>{inr(i.paidCents)}</td>
                    <td style={{ fontSize: 13, fontWeight: 700, color: i.balanceCents > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {inr(i.balanceCents)}
                    </td>
                    <td><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!finance?.invoices || finance.invoices.length === 0) && (
              <EmptyState icon={<Wallet size={32} />} title="No Invoices Raised" message="Tuition, admission, and transport fees will appear here once invoiced." />
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Observations */}
      {tab === 'observations' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="card-title" style={{ fontSize: 17 }}>Learning Observations & Milestones</div>
              <div className="card-sub">Developmental milestones recorded by early childhood educators</div>
            </div>
            <Link href="/app/academics" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
              <ExternalLink size={13} /> Open Academics & Planner
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {academics?.observations?.map((o: any) => (
              <div
                key={o.id}
                style={{
                  background: 'var(--surface-muted)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={o.status || 'PUBLISHED'} />
                  <span className="t-caption" style={{ fontSize: 12 }}>{timeAgo(o.observedAt)}</span>
                </div>
                <p style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5, color: 'var(--foreground)' }}>
                  {o.narrative}
                </p>
                {o.milestoneTags && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {o.milestoneTags.split(',').map((m: string) => (
                      <span
                        key={m}
                        className="badge b-primary"
                        style={{ height: 22, fontSize: 11, padding: '0 8px', borderRadius: 6 }}
                      >
                        {m.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(!academics?.observations || academics.observations.length === 0) && (
              <EmptyState icon={<Sparkles size={32} />} title="No Observations Yet" message="Teachers record early childhood learning observations and milestone progress from the Academics module." />
            )}
          </div>
        </div>
      )}

      {/* Tab 8: Timeline */}
      {tab === 'timeline' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-head" style={{ marginBottom: 20 }}>
            <div>
              <div className="card-title" style={{ fontSize: 17 }}>Child Activity & Operations Timeline</div>
              <div className="card-sub">What parents see in the mobile app — daily logs, activities, and meals</div>
            </div>
            <Smartphone size={18} style={{ color: 'var(--preone-primary)' }} />
          </div>

          <div className="timeline" style={{ paddingLeft: 8 }}>
            {timeline?.map((t: any) => {
              const meta = TL_DOT[t.type] || { color: 'var(--text-secondary)', label: 'Event' }
              return (
                <div className="tl-item" key={t.id} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: meta.color,
                      marginTop: 6,
                      boxShadow: `0 0 0 3px rgba(91, 61, 245, 0.12)`,
                      flexShrink: 0,
                    }}
                  />
                  <div className="tl-body" style={{ flex: 1, background: 'var(--surface-muted)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: 14, color: 'var(--foreground)' }}>{t.title}</b>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge b-neutral" style={{ height: 20, fontSize: 10.5 }}>
                          {meta.label}
                        </span>
                        <time className="t-caption" style={{ fontSize: 11.5 }}>
                          {timeAgo(t.createdAt || t.at)}
                        </time>
                      </div>
                    </div>
                    {t.body && <p style={{ fontSize: 13, marginTop: 6, color: 'var(--foreground-muted)', lineHeight: 1.4 }}>{t.body}</p>}
                  </div>
                </div>
              )
            })}
            {(!timeline || timeline.length === 0) && (
              <EmptyState icon={<Clock3 size={32} />} title="Timeline is Empty" message="Daily check-ins, meals, naps, and milestone notes will appear here automatically." />
            )}
          </div>
        </div>
      )}

      {/* Tab 9: Audit */}
      {tab === 'audit' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-head" style={{ marginBottom: 18 }}>
            <div>
              <div className="card-title" style={{ fontSize: 17 }}>Immutable Audit Ledger</div>
              <div className="card-sub">Permanent record of record edits, transfers, and security events</div>
            </div>
            <span className="badge b-neutral">IMMUTABLE · READ ONLY</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {audit?.map((a: any) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'var(--surface-muted)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  flexWrap: 'wrap',
                }}
              >
                <span className="badge b-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {a.action}
                </span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b>{a.actorName || 'System Service'}</b>{' '}
                  <span className="t-caption">({a.actorRole || 'SYSTEM'})</span>
                  <div className="t-caption" style={{ fontSize: 11.5, marginTop: 2 }}>
                    {a.details ? (typeof a.details === 'object' ? JSON.stringify(a.details) : a.details) : 'System record audit'}
                  </div>
                </div>
                <time className="t-caption" style={{ fontSize: 12 }}>
                  {fmtDate(a.createdAt)}
                </time>
              </div>
            ))}
            {(!audit || audit.length === 0) && (
              <EmptyState icon={<Clock3 size={32} />} title="No Audit Records" message="All administrative modifications to this student record will be stamped here." />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: FULL STUDENT IDENTITY & PHOTO EDITOR            */}
      {/* ======================================================== */}
      <Modal
        open={editStudentOpen}
        onClose={() => setEditStudentOpen(false)}
        title="Edit Student Information"
        subtitle="Manage canonical identity, demographics, photo, and classroom seat"
        icon={<Edit3 size={20} />}
      >
        <form onSubmit={handleSaveStudent}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />

          {/* Photo Section */}
          <div
            style={{
              padding: 16,
              background: 'var(--surface-muted)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 18,
            }}
          >
            <Avatar name={editForm.firstName || student?.name} src={editForm.photoUrl} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--foreground)' }}>Child Photo</div>
              <div className="t-caption" style={{ fontSize: 12, marginTop: 2 }}>
                Used in Student 360, Directory, Attendance, and Pickup Verification.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: 30, fontSize: 12, gap: 5 }}
                >
                  <Upload size={12} /> {editForm.photoUrl ? 'Replace Photo' : 'Upload Photo'}
                </button>
                {editForm.photoUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditForm((p) => ({ ...p, photoUrl: '' }))}
                    style={{ height: 30, fontSize: 12, color: 'var(--danger)', gap: 4 }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: Child Identity */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--preone-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            1. Child Identity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>First Name <span className="req">*</span></label>
              <input
                className="input"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                style={{ height: 40 }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Last Name</label>
              <input
                className="input"
                value={editForm.lastName}
                onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                style={{ height: 40 }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Date of Birth <span className="req">*</span></label>
              <input
                type="date"
                className="input"
                required
                value={editForm.dob}
                onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))}
                style={{ height: 40 }}
              />
              {editForm.dob && (
                <span className="helper" style={{ fontSize: 11.5, color: 'var(--preone-primary)' }}>
                  Current Age: {formatAge(editForm.dob)}
                </span>
              )}
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Gender <span className="req">*</span></label>
              <select
                className="select"
                required
                value={editForm.gender}
                onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                style={{ height: 40 }}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Section 2: Health & Address */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--preone-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            2. Health & Home Address
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Blood Group</label>
              <select
                className="select"
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                style={{ height: 40 }}
              >
                <option value="">- Unknown / Not Set -</option>
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
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Residential Address</label>
              <input
                className="input"
                value={editForm.address}
                onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Street address, apartment, locality"
                style={{ height: 40 }}
              />
            </div>
          </div>

          {/* Section 3: Identifiers & Seat Number */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--preone-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            3. Seat & System Identifiers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Admission Number <span className="badge b-neutral" style={{ fontSize: 10, marginLeft: 6 }}>Read Only</span>
              </label>
              <input
                className="input"
                disabled
                value={student.admissionNo}
                style={{ height: 40, background: 'var(--bg-muted)', fontFamily: 'var(--font-mono)' }}
              />
              <span className="helper" style={{ fontSize: 11 }}>Immutable identifier generated by system.</span>
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Seat Number</label>
              <input
                className="input"
                value={editForm.seatNumber}
                onChange={(e) => setEditForm((p) => ({ ...p, seatNumber: e.target.value, generateSeatNumber: false }))}
                placeholder="e.g. NUR-A-001"
                style={{ height: 40, fontFamily: 'var(--font-mono)' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.generateSeatNumber}
                  onChange={(e) => setEditForm((p) => ({ ...p, generateSeatNumber: e.target.checked }))}
                />
                Auto-generate based on classroom code
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setEditStudentOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: LIFECYCLE STATUS TRANSITION                     */}
      {/* ======================================================== */}
      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Student Lifecycle Status"
        subtitle="Transition active, inactive, or withdrawal states with compliance checks"
        icon={<CheckCircle2 size={20} />}
      >
        <form onSubmit={handleStatusChange}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Target Lifecycle Status <span className="req">*</span></label>
            <select
              className="select"
              value={statusForm.status}
              onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
              style={{ height: 42 }}
            >
              <option value="ACTIVE">Active (Enrolled & Attending)</option>
              <option value="INACTIVE">Inactive (Temporarily on hold)</option>
              <option value="TRANSFERRED">Transferred (Moved branch or school)</option>
              <option value="WITHDRAWN">Withdrawn (Formal exit / non-destructive)</option>
              <option value="SUSPENDED">Suspended (Disciplinary / medical pause)</option>
              <option value="GRADUATED">Graduated (Completed preschool program)</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Reason for Change <span className="req">*</span></label>
            <input
              className="input"
              required
              value={statusForm.reason}
              onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Family relocation, completed preschool cycle, financial hold"
              style={{ height: 42 }}
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Additional Administrative Notes</label>
            <textarea
              className="input"
              rows={2}
              value={statusForm.notes}
              onChange={(e) => setStatusForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes preserved in child permanent timeline"
              style={{ padding: 10 }}
            />
          </div>

          {/* Withdrawn warning & Fee settlement guard */}
          {statusForm.status === 'WITHDRAWN' && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger-soft)',
                color: 'var(--danger)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <AlertCircle size={18} />
                Non-Destructive Withdrawal Guard
              </div>
              <p style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.4 }}>
                Withdrawing closes all active class allocations and sets status to INACTIVE. The child record is permanently preserved in the database for compliance and transcripts.
              </p>
              {feeBalance > 0 && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--danger-soft)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>⚠️ Outstanding Balance: {inr(feeBalance)}</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 6, cursor: 'pointer', color: 'var(--danger)' }}>
                    <input
                      type="checkbox"
                      checked={statusForm.forceWithPendingFees}
                      onChange={(e) => setStatusForm((p) => ({ ...p, forceWithPendingFees: e.target.checked }))}
                    />
                    I confirm administrative override to withdraw with outstanding balance
                  </label>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStatusOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              Apply Status Transition
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: GUARDIAN MANAGEMENT (ADD / EDIT)                */}
      {/* ======================================================== */}
      <Modal
        open={guardianModalOpen}
        onClose={() => setGuardianModalOpen(false)}
        title={guardianForm.isEdit ? 'Edit Guardian & Permissions' : 'Link / Add Family Guardian'}
        subtitle="Manage contact details, pickup authorization, and fee responsibility"
        icon={<Users size={20} />}
      >
        <form onSubmit={handleSaveGuardian}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Guardian Full Name <span className="req">*</span></label>
              <input
                className="input"
                required
                value={guardianForm.fullName}
                onChange={(e) => setGuardianForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="e.g. Priya Sharma"
                style={{ height: 40 }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Phone Number <span className="req">*</span></label>
              <input
                className="input"
                required
                value={guardianForm.phone}
                onChange={(e) => setGuardianForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="10-digit mobile phone"
                style={{ height: 40 }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Email Address</label>
              <input
                type="email"
                className="input"
                value={guardianForm.email}
                onChange={(e) => setGuardianForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="parent@example.com"
                style={{ height: 40 }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 600 }}>Relationship <span className="req">*</span></label>
              <select
                className="select"
                required
                value={guardianForm.relationship}
                onChange={(e) => setGuardianForm((p) => ({ ...p, relationship: e.target.value }))}
                style={{ height: 40 }}
              >
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="GRANDPARENT">Grandparent</option>
                <option value="OTHER">Other Relative / Carer</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--surface-muted)', padding: 14, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>
              Relationship Permissions & Flags
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={guardianForm.isPrimary}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                />
                Primary Emergency Contact
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={guardianForm.canPickup}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, canPickup: e.target.checked }))}
                />
                Authorized for Dismissal / Pickup
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={guardianForm.isFeePayer}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, isFeePayer: e.target.checked }))}
                />
                Designated Fee Payer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={guardianForm.receivesComm}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, receivesComm: e.target.checked }))}
                />
                Receives Daily App Updates
              </label>
            </div>
            {guardianForm.canPickup && (
              <div style={{ marginTop: 10, maxWidth: 220 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Optional 4-Digit Pickup PIN</label>
                <input
                  className="input"
                  maxLength={6}
                  value={guardianForm.pickupPin}
                  onChange={(e) => setGuardianForm((p) => ({ ...p, pickupPin: e.target.value }))}
                  placeholder="e.g. 4821"
                  style={{ height: 34, fontFamily: 'var(--font-mono)' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setGuardianModalOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              {guardianForm.isEdit ? 'Update Guardian' : 'Save & Link Guardian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: GUARDIAN UNLINK CONFIRMATION                    */}
      {/* ======================================================== */}
      <Modal
        open={unlinkModalOpen}
        onClose={() => setUnlinkModalOpen(false)}
        title="Unlink Guardian"
        subtitle="Remove contact association from this student"
        icon={<Trash2 size={20} style={{ color: 'var(--danger)' }} />}
      >
        <div style={{ padding: '8px 0 16px' }}>
          <p style={{ fontSize: 14 }}>
            Are you sure you want to unlink <b>{guardianToUnlink?.name}</b> from <b>{student.name}</b>?
          </p>
          <span className="t-caption" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>
            The guardian record itself will be preserved in the school directory; only this student link will be removed.
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setUnlinkModalOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleUnlinkGuardian} disabled={busy}>
            Confirm Unlink
          </button>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 5: SECTION REALLOCATION                            */}
      {/* ======================================================== */}
      <Modal
        open={allocOpen}
        onClose={() => setAllocOpen(false)}
        title="Transfer / Allocate Section"
        subtitle="Capacity-guarded · audited · history preserved"
        icon={<Shuffle size={20} />}
      >
        <form onSubmit={handleAllocate}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
              New Classroom Section <span className="req">*</span>
            </label>
            <select className="select" name="classroomId" required defaultValue="" style={{ height: 42 }}>
              <option value="" disabled>Choose target section...</option>
              {classrooms
                .filter((c) => c.name !== academic?.classroom?.name)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {enumLabel(c.programType)} (Max Capacity: {c.capacity})
                  </option>
                ))}
            </select>
            <span className="helper" style={{ fontSize: 12, marginTop: 6, color: 'var(--foreground-muted)' }}>
              Over-capacity sections are blocked with an explicit warning to protect educator-to-child ratios.
            </span>
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Transfer Reason</label>
            <select className="select" name="reason" defaultValue="Section change" style={{ height: 42 }}>
              <option>Section change</option>
              <option>TRANSFER</option>
              <option>Program move</option>
              <option>Parent request</option>
              <option>Academic progression</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAllocOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              Confirm Section Allocation
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 6: INTER-BRANCH TRANSFER                           */}
      {/* ======================================================== */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Inter-Branch Campus Transfer"
        subtitle="Transfer child to another school branch with seamless capacity check"
        icon={<ArrowRightLeft size={20} />}
      >
        <form onSubmit={handleTransfer}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Destination Branch <span className="req">*</span></label>
            <select
              className="select"
              required
              value={transferBranchId}
              onChange={(e) => setTransferBranchId(e.target.value)}
              style={{ height: 42 }}
            >
              <option value="" disabled>Select target branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Destination Classroom Section <span className="req">*</span></label>
            <select
              className="select"
              required
              value={transferClassroomId}
              onChange={(e) => setTransferClassroomId(e.target.value)}
              style={{ height: 42 }}
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

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Transfer Reason</label>
            <input
              className="input"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Family moved to West Campus neighborhood"
              style={{ height: 42 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setTransferOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              Execute Campus Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 7: ACADEMIC PROMOTION                              */}
      {/* ======================================================== */}
      <Modal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Promote to Next Academic Session"
        subtitle="Annual cohort progression preserving past session allocation history"
        icon={<GraduationCap size={20} />}
      >
        <form onSubmit={handlePromote}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Target Academic Session <span className="req">*</span></label>
            <select
              className="select"
              required
              value={promoteSessionId}
              onChange={(e) => setPromoteSessionId(e.target.value)}
              style={{ height: 42 }}
            >
              <option value="" disabled>Select next academic session...</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Promoted Section <span className="req">*</span></label>
            <select
              className="select"
              required
              value={promoteClassroomId}
              onChange={(e) => setPromoteClassroomId(e.target.value)}
              style={{ height: 42 }}
            >
              <option value="" disabled>Select classroom...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {enumLabel(c.programType)} (Cap: {c.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Promotion Reason / Notes</label>
            <input
              className="input"
              value={promoteReason}
              onChange={(e) => setPromoteReason(e.target.value)}
              style={{ height: 42 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setPromoteOpen(false)}>
              Cancel
            </button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>
              Confirm Promotion
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 8: CANCEL TRANSPORT ASSIGNMENT                     */}
      {/* ======================================================== */}
      <Modal
        open={cancelTransportOpen}
        onClose={() => setCancelTransportOpen(false)}
        title="Cancel Bus Route Assignment"
        subtitle="End student transportation without deleting past trip history"
        icon={<Bus size={20} style={{ color: 'var(--danger)' }} />}
      >
        <form onSubmit={handleCancelTransport}>
          <div style={{ padding: '6px 0 14px' }}>
            <p style={{ fontSize: 13.5 }}>
              Are you sure you want to cancel transport assignment on route{' '}
              <b>{profile.transport?.activeAssignment?.route?.name}</b>?
            </p>
          </div>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Cancellation Reason</label>
            <input
              className="input"
              value={cancelTransportReason}
              onChange={(e) => setCancelTransportReason(e.target.value)}
              style={{ height: 40 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCancelTransportOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" disabled={busy}>
              Confirm Transport Cancellation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


