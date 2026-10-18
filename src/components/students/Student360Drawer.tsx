'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  X,
  ExternalLink,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Building,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Heart,
  Droplet,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Info,
} from 'lucide-react'
import { Avatar, StatusBadge, IconButton } from '@/components/preone/ui'
import { inr, fmtDate, formatPreschoolAge, enumLabel } from '@/lib/format'
import { buildWhatsAppChatUrl, normalizePhoneNumberForTel } from '@/lib/contact-utils'
import { StudentGuardianQuickActions } from './StudentGuardianQuickActions'
import { StudentSafetyBadges } from './StudentSafetyBadges'
import { StudentSafetyModal } from './StudentSafetyModal'

export interface Student360InitialData {
  id: string
  name: string
  firstName?: string
  lastName?: string
  admissionNo?: string
  seatNumber?: string | null
  photoUrl?: string | null
  dob?: string | Date | null
  gender?: string | null
  status?: string | null
  classroom?: { id?: string; name: string; code?: string; programType?: string; teacher?: string } | string | null
  primaryGuardian?: {
    id?: string
    name: string
    phone?: string
    email?: string
    relationship?: string
    isPrimary?: boolean
  } | null
  attendance?: { rate?: number; totalTracked?: number }
}

export interface Student360Summary {
  student: {
    id: string
    admissionNo: string
    seatNumber?: string | null
    firstName: string
    lastName?: string | null
    name: string
    dob: string | Date
    gender: string
    status: string
    admissionDate: string | Date
    photoUrl?: string | null
    classroom?: {
      id: string
      name: string
      code?: string
      programType?: string
      teacher?: string
    } | null
  }
  health: {
    bloodGroup?: string | null
    allergies?: string | null
    medicalAlerts?: string | null
    dietaryRestrictions?: string | null
    emergencyMedicalInstructions?: string | null
  }
  primaryGuardian: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    relationship?: string | null
    isPrimary?: boolean
    isEmergencyContact?: boolean
    emergencyPriority?: number | null
    canPickup?: boolean
  } | null
  emergencyContact?: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    relationship?: string | null
    isPrimary?: boolean
    isEmergencyContact?: boolean
    emergencyPriority?: number | null
    canPickup?: boolean
  } | null
  guardians: Array<{
    id: string
    name: string
    phone?: string | null
    email?: string | null
    relationship?: string | null
    isPrimary?: boolean
    isEmergencyContact?: boolean
    emergencyPriority?: number | null
    canPickup?: boolean
  }>
  todayAttendance: {
    id: string
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED'
    markedAt: string | Date
    notes?: string | null
  } | null
  finance: {
    isRestricted: boolean
    totalBilledCents: number
    totalPaidCents: number
    balanceCents: number
    overdueCents: number
    hasOutstanding: boolean
  }
}

export interface Student360DrawerProps {
  open: boolean
  onClose: () => void
  studentId?: string | null
  initialData?: Student360InitialData | null
}

export function Student360Drawer({
  open,
  onClose,
  studentId,
  initialData,
}: Student360DrawerProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Student360Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [safetyModalOpen, setSafetyModalOpen] = useState(false)

  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll body to top when drawer opens or studentId changes
  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = 0
    }
  }, [open, studentId])

  // Fetch summary endpoint with abort protection against race conditions
  const fetchSummary = useCallback(async (id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/students/${id}/summary`, {
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Failed to load student summary (${res.status})`)
      }

      const json = await res.json()
      if (json.success && json.data) {
        setSummary(json.data)
      } else if (json.data) {
        setSummary(json.data)
      } else {
        setSummary(json)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Ignored; newer request in flight
        return
      }
      setError(err.message || 'Unable to load student summary')
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (open && studentId) {
      fetchSummary(studentId)
    } else if (!open) {
      setSummary(null)
      setError(null)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [open, studentId, fetchSummary])

  // Scroll lock & Escape key handling
  useEffect(() => {
    if (!open) return

    const currentScrollY = window.scrollY
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (window.scrollY !== currentScrollY) {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' })
    }

    if (closeBtnRef.current && !drawerRef.current?.contains(document.activeElement)) {
      closeBtnRef.current.focus({ preventScroll: true })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      document.removeEventListener('keydown', handleKeyDown)
      window.scrollTo({ top: currentScrollY, behavior: 'instant' })
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  // Resolution of active student attributes with optimistic fallback
  const resolvedStudent = summary?.student || {
    id: studentId || initialData?.id || '',
    admissionNo: initialData?.admissionNo || '—',
    seatNumber: initialData?.seatNumber || null,
    firstName: initialData?.firstName || initialData?.name?.split(' ')[0] || 'Student',
    lastName: initialData?.lastName || initialData?.name?.split(' ').slice(1).join(' ') || '',
    name: initialData?.name || 'Student',
    dob: initialData?.dob || '',
    gender: initialData?.gender || 'UNKNOWN',
    status: initialData?.status || 'ACTIVE',
    admissionDate: new Date(),
    photoUrl: initialData?.photoUrl || null,
    classroom:
      typeof initialData?.classroom === 'object' && initialData?.classroom
        ? initialData.classroom
        : typeof initialData?.classroom === 'string'
        ? { id: '', name: initialData.classroom }
        : null,
  }

  const preschoolAge = formatPreschoolAge(resolvedStudent.dob)

  // Primary Guardian resolution
  const guardian = summary?.primaryGuardian || initialData?.primaryGuardian || null
  const telLink = normalizePhoneNumberForTel(guardian?.phone)
  const waLink = buildWhatsAppChatUrl(
    guardian?.phone,
    `Hello ${guardian?.name || 'Guardian'}, regards regarding ${resolvedStudent.name} from preschool.`
  )

  // Format today's arrival time
  const formatArrivalTime = (markedAt?: string | Date | null) => {
    if (!markedAt) return null
    try {
      const d = new Date(markedAt)
      if (isNaN(d.getTime())) return null
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return null
    }
  }

  const arrivalTime = summary?.todayAttendance?.markedAt
    ? formatArrivalTime(summary.todayAttendance.markedAt)
    : null

  const navigateToFullProfile = () => {
    onClose()
    router.push(`/app/students/${resolvedStudent.id}`)
  }

  return createPortal(
    <div
      className="ovl ovl-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-360-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{ zIndex: 'var(--z-overlay, 500)' as any, overflow: 'hidden' }}
    >
      {/* Backdrop */}
      <div className="ovl-backdrop" onClick={onClose} />

      {/* Slide-in Drawer Container */}
      <div
        ref={drawerRef}
        className="drawer w-full sm:w-[440px] md:w-[460px] max-w-full h-[94vh] sm:h-full mt-auto sm:mt-0 rounded-t-2xl sm:rounded-none flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl transition-transform duration-200 ease-out"
        style={{
          boxShadow: 'var(--elevation-3), var(--surface-highlight-dialog)',
          overscrollBehavior: 'contain',
          overflowX: 'hidden',
        }}
      >
        {/* ── HEADER ── */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {/* Mobile Drag Indicator */}
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1 mb-2.5 sm:hidden shrink-0" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar
                name={resolvedStudent.name}
                src={resolvedStudent.photoUrl}
                size="lg"
                className="ring-2 ring-purple-100 dark:ring-purple-900/60 shadow-xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    id="student-360-title"
                    className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate tracking-tight"
                  >
                    {resolvedStudent.name}
                  </h2>
                  <StatusBadge status={resolvedStudent.status} size="sm" />
                </div>

                {/* Admission No, Classroom, and Age */}
                <div className="flex items-center flex-wrap gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {resolvedStudent.admissionNo}
                  </span>
                  {resolvedStudent.seatNumber && (
                    <span className="font-mono bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-purple-200/50">
                      Seat {resolvedStudent.seatNumber}
                    </span>
                  )}
                  <span>•</span>
                  <span className="font-medium truncate max-w-[140px]">
                    {resolvedStudent.classroom?.name || 'Unassigned'}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono">
                    {preschoolAge}
                  </span>
                </div>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE DRAWER BODY ── */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin bg-slate-50/60 dark:bg-slate-900/60"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">Error loading live 360 data</p>
                <p className="mt-0.5 text-rose-600/90 dark:text-rose-400/90">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => studentId && fetchSummary(studentId)}
                className="underline font-bold text-rose-700 hover:text-rose-800 text-[11px] shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. HEALTH & MEDICAL ALERT CARD */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Heart size={13} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Health &amp; Medical Safety
                </h3>
              </div>
              {/* Blood Group Pill */}
              <StudentSafetyBadges
                summary={null}
                student={{
                  bloodGroup: summary?.health?.bloodGroup,
                  allergies: summary?.health?.allergies,
                  medicalAlerts: summary?.health?.medicalAlerts,
                  dietaryRestrictions: summary?.health?.dietaryRestrictions,
                  emergencyMedicalInstructions: summary?.health?.emergencyMedicalInstructions,
                  health: summary?.health,
                }}
                showBloodGroup
                maxVisible={0}
                onOpenSafety={() => setSafetyModalOpen(true)}
              />
            </div>

            {/* Allergies / Medical Condition Status */}
            {loading && !summary ? (
              <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : (summary?.health?.allergies || summary?.health?.medicalAlerts || summary?.health?.dietaryRestrictions) ? (
              <div
                onClick={() => setSafetyModalOpen(true)}
                className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2 cursor-pointer hover:bg-amber-100/70 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold tracking-tight">
                    <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Active Safety Directives</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    Tap for Emergency Sheet
                  </span>
                </div>

                <div className="pt-0.5">
                  <StudentSafetyBadges
                    student={{
                      bloodGroup: summary.health.bloodGroup,
                      allergies: summary.health.allergies,
                      medicalAlerts: summary.health.medicalAlerts,
                      dietaryRestrictions: summary.health.dietaryRestrictions,
                      emergencyMedicalInstructions: summary.health.emergencyMedicalInstructions,
                      health: summary.health,
                    }}
                    maxVisible={3}
                    size="xs"
                    onOpenSafety={() => setSafetyModalOpen(true)}
                  />
                </div>

                {summary.health.emergencyMedicalInstructions && (
                  <div className="mt-1 pt-1.5 border-t border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 italic">
                    Protocol: {summary.health.emergencyMedicalInstructions}
                  </div>
                )}
              </div>
            ) : summary?.health ? (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>No allergies or medical conditions recorded</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <HelpCircle size={14} className="text-slate-400 shrink-0" />
                <span>Health information unavailable</span>
              </div>
            )}
          </div>

          {/* 2. PRIMARY GUARDIAN & 1-CLICK CONTACT CARD */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User size={13} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Primary Guardian
                </h3>
              </div>
              {guardian?.relationship && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {enumLabel(guardian.relationship)}
                </span>
              )}
            </div>

            {guardian?.name ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {guardian.name}
                    </div>
                    {guardian.phone ? (
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {guardian.phone}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic mt-0.5">No phone number listed</div>
                    )}
                  </div>
                  {guardian.canPickup && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded">
                      Pickup Authorized
                    </span>
                  )}
                </div>

                {/* 1-Click Relationship-Aware Call, WhatsApp, and Emergency Actions */}
                <div className="pt-1">
                  <StudentGuardianQuickActions
                    guardian={guardian}
                    emergencyContact={summary?.emergencyContact}
                    childName={resolvedStudent.name}
                    variant="drawer"
                    showEmergency={true}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No primary guardian configured on record.
              </div>
            )}
          </div>

          {/* 3. TODAY'S ATTENDANCE SNAPSHOT */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock size={13} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Today's Attendance
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {loading && !summary ? (
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : summary?.todayAttendance ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      summary.todayAttendance.status === 'PRESENT'
                        ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950'
                        : summary.todayAttendance.status === 'LATE'
                        ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950'
                        : summary.todayAttendance.status === 'HALF_DAY'
                        ? 'bg-sky-500 ring-4 ring-sky-100 dark:ring-sky-950'
                        : 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {enumLabel(summary.todayAttendance.status)}
                    </span>
                    {arrivalTime && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-mono">
                        · Arrived {arrivalTime}
                      </span>
                    )}
                  </div>
                </div>
                {summary.todayAttendance.notes && (
                  <span className="text-[11px] text-slate-500 italic max-w-[120px] truncate" title={summary.todayAttendance.notes}>
                    {summary.todayAttendance.notes}
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span>Not yet marked today</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Roll Call Pending</span>
              </div>
            )}
          </div>

          {/* 4. FEE BALANCE SNAPSHOT (PERMISSION-AWARE) */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CreditCard size={13} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Fee Balance
                </h3>
              </div>
            </div>

            {loading && !summary ? (
              <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : summary?.finance?.isRestricted ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                <Shield size={14} className="text-slate-400 shrink-0" />
                <span>Financial details restricted (requires fee permissions)</span>
              </div>
            ) : summary?.finance ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Current Outstanding
                  </div>
                  <div className="mt-0.5">
                    {summary.finance.balanceCents > 0 ? (
                      <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                        {inr(summary.finance.balanceCents)} Due
                      </span>
                    ) : (
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={16} />
                        <span>All Paid Up</span>
                      </span>
                    )}
                  </div>
                </div>

                {summary.finance.overdueCents > 0 && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md font-mono">
                    {inr(summary.finance.overdueCents)} Overdue
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 text-center">
                Fee balance unavailable
              </div>
            )}
          </div>
        </div>

        {/* ── STICKY FOOTER ACTION: OPEN FULL PROFILE ── */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={navigateToFullProfile}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all hover:gap-2.5 group"
          >
            <span>Open Full Profile</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Safety & Emergency Modal */}
        <StudentSafetyModal
          open={safetyModalOpen}
          onClose={() => setSafetyModalOpen(false)}
          student={
            summary?.student
              ? {
                  ...summary.student,
                  bloodGroup: summary.health?.bloodGroup,
                  allergies: summary.health?.allergies,
                  medicalAlerts: summary.health?.medicalAlerts,
                  dietaryRestrictions: summary.health?.dietaryRestrictions,
                  emergencyMedicalInstructions: summary.health?.emergencyMedicalInstructions,
                  health: summary.health,
                  classroom: summary.student.classroom,
                  primaryGuardian: summary.primaryGuardian,
                  emergencyContact: (summary as any).emergencyContact || summary.primaryGuardian,
                  guardians: (summary as any).guardians,
                }
              : initialData
              ? {
                  id: initialData.id,
                  name: initialData.name,
                  dob: (initialData.dob as string) || '',
                  admissionNo: initialData.admissionNo,
                  seatNumber: initialData.seatNumber,
                  photoUrl: initialData.photoUrl,
                  classroom: initialData.classroom,
                  primaryGuardian: initialData.primaryGuardian,
                }
              : null
          }
          onViewProfile={(id) => {
            onClose()
            router.push(`/app/students/${id}`)
          }}
        />
      </div>
    </div>,
    document.body
  )
}
