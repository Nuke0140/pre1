'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  X,
  ExternalLink,
  GraduationCap,
  UserCheck,
  FileText,
  Phone,
  Mail,
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
  Users,
  Eye,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Briefcase,
  Pencil,
  Edit,
} from 'lucide-react'
import { Avatar, StatusBadge, StatusPill, IconButton } from '@/components/preone/ui'
import { inr, fmtDate, timeAgo, enumLabel } from '@/lib/format'

export type InspectorRecordType = 'student' | 'staff' | 'invoice'

export interface RecordInspectorProps {
  open: boolean
  onClose: () => void
  type: InspectorRecordType
  recordId?: string | null
  initialData?: any
  onEdit?: (record: any) => void
}

function formatAge(dobString?: string | null): string {
  if (!dobString) return ''
  const birth = new Date(dobString)
  if (isNaN(birth.getTime())) return ''
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years <= 0) return `${months} mos`
  if (months === 0) return `${years} yrs`
  return `${years}y ${months}m`
}

function cleanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  // If Indian 10 digits without 91, prepend 91
  if (digits.length === 10) return `91${digits}`
  return digits
}

export function RecordInspector({
  open,
  onClose,
  type,
  recordId,
  initialData,
  onEdit,
}: RecordInspectorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(initialData || null)
  const [error, setError] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync initialData when passed
  useEffect(() => {
    if (initialData) setData(initialData)
  }, [initialData])

  // Auto-scroll drawer body to top on open, record change, or data loaded
  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = 0
      requestAnimationFrame(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0
      })
    }
  }, [open, recordId, data])

  // Fetch record when opened or recordId changes
  const fetchRecord = useCallback(async () => {
    if (!recordId) return
    setLoading(true)
    setError(null)
    try {
      let endpoint = ''
      if (type === 'student') endpoint = `/api/v1/students/${recordId}`
      else if (type === 'staff') endpoint = `/api/v1/users/${recordId}`
      else if (type === 'invoice') endpoint = `/api/v1/invoices/${recordId}`

      if (!endpoint) return

      const res = await fetch(endpoint)
      if (!res.ok) {
        throw new Error(`Failed to load ${type} record (${res.status})`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else if (json.data) {
        setData(json.data)
      } else {
        setData(json)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch details')
    } finally {
      setLoading(false)
    }
  }, [type, recordId])

  useEffect(() => {
    if (open && recordId) {
      fetchRecord()
    } else if (!open) {
      setError(null)
    }
  }, [open, recordId, fetchRecord])

  // Background scroll preservation and focus management without page jump
  useEffect(() => {
    if (!open) return

    // Save exact background scroll position
    const currentScrollY = window.scrollY
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    // Prevent background window from jumping or scrolling while drawer is open
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (window.scrollY !== currentScrollY) {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' })
    }

    // Accessible focus without scrolling parent page
    closeBtnRef.current?.focus({ preventScroll: true })

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
      // Restore exact background scroll position
      window.scrollTo({ top: currentScrollY, behavior: 'instant' })
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  const getRecordTitle = () => {
    if (!data) return `${type.toUpperCase()} INSPECTOR`
    if (type === 'student') return `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'Student'
    if (type === 'staff') return data.fullName || data.name || 'Staff Member'
    if (type === 'invoice') return data.invoiceNumber ? `Invoice #${data.invoiceNumber}` : 'Invoice'
    return 'Record'
  }

  const getSubtitle = () => {
    if (!data) return ''
    if (type === 'student') {
      const parts: string[] = []
      if (data.admissionNo) parts.push(`Adm: ${data.admissionNo}`)
      if (data.currentClassroom?.name || data.classroom?.name) {
        parts.push(data.currentClassroom?.name || data.classroom?.name)
      }
      return parts.join(' • ')
    }
    if (type === 'staff') {
      const parts: string[] = []
      if (data.employeeCode || data.username) parts.push(`@${data.username || data.employeeCode}`)
      if (data.role) parts.push(enumLabel(data.role))
      return parts.join(' • ')
    }
    if (type === 'invoice') {
      return data.student?.name ? `Student: ${data.student.name}` : data.title || ''
    }
    return ''
  }

  const getStatus = () => {
    return data?.status || 'ACTIVE'
  }

  return createPortal(
    <div
      className="ovl ovl-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{ zIndex: 'var(--z-overlay, 500)' as any, overflow: 'hidden' }}
    >
      <div className="ovl-backdrop" onClick={onClose} />

      <div
        ref={drawerRef}
        className="drawer w-full sm:w-[540px] md:w-[600px] lg:w-[640px] max-w-full h-[94vh] sm:h-full mt-auto sm:mt-0 rounded-t-2xl sm:rounded-none"
        style={{
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--elevation-3), var(--surface-highlight-dialog)',
          overscrollBehavior: 'contain',
          overflowX: 'hidden',
        }}
      >
        {/* Sticky Header with Upper Action Buttons */}
        <div
          className="drawer-head border-b border-border/80 px-4 sm:px-6 py-3 sm:py-3.5 shrink-0 flex flex-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Mobile drag handle */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

          {/* Primary Header Row */}
          <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                style={{
                  background:
                    type === 'student'
                      ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                      : type === 'staff'
                      ? 'color-mix(in srgb, #0EA5E9 12%, transparent)'
                      : 'color-mix(in srgb, #10B981 12%, transparent)',
                  color:
                    type === 'student'
                      ? 'var(--primary)'
                      : type === 'staff'
                      ? '#0EA5E9'
                      : '#10B981',
                }}
              >
                {type === 'student' && <GraduationCap size={18} />}
                {type === 'staff' && <UserCheck size={18} />}
                {type === 'invoice' && <FileText size={18} />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    id="inspector-title"
                    className="text-sm sm:text-base font-bold truncate text-foreground leading-tight"
                  >
                    {getRecordTitle()}
                  </h3>
                  <StatusBadge status={getStatus()} size="sm" />
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5 font-medium">
                  {getSubtitle()}
                </p>
              </div>
            </div>

            {/* Desktop Upper Action Buttons Cluster */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              {/* STUDENT UPPER ACTIONS */}
              {type === 'student' && (data?.id || recordId) && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs font-semibold px-2.5 h-8 border-border hover:bg-muted"
                    onClick={() => {
                      const id = data?.id || recordId
                      if (onEdit) onEdit(data || { id })
                      else {
                        onClose()
                        router.push(`/app/students/${id}?edit=true`)
                      }
                    }}
                    title="Edit Student Information"
                  >
                    <Pencil size={13} className="text-primary" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary flex items-center gap-1.5 text-xs font-semibold px-3 h-8 shadow-xs"
                    onClick={() => {
                      const id = data?.id || recordId
                      onClose()
                      router.push(`/app/students/${id}`)
                    }}
                    title="Open Full 360° Profile"
                  >
                    <span className="whitespace-nowrap">Full Profile</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}

              {/* STAFF UPPER ACTIONS */}
              {type === 'staff' && (data?.id || data?.userId || recordId) && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs font-semibold px-2.5 h-8 border-border hover:bg-muted"
                    onClick={() => {
                      const id = data?.userId || data?.id || recordId
                      if (onEdit) onEdit(data || { id })
                      else {
                        onClose()
                        router.push(`/app/users/staff?editUser=${id}`)
                      }
                    }}
                    title="Edit Staff Member"
                  >
                    <Pencil size={13} className="text-sky-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary flex items-center gap-1.5 text-xs font-semibold px-3 h-8 shadow-xs"
                    onClick={() => {
                      const id = data?.userId || data?.id || recordId
                      onClose()
                      router.push(`/app/users/staff?user=${id}`)
                    }}
                    title="Open Full Staff Profile"
                  >
                    <span className="whitespace-nowrap">Staff Profile</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}

              {/* INVOICE UPPER ACTIONS */}
              {type === 'invoice' && (data?.id || recordId) && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary flex items-center gap-1.5 text-xs font-semibold px-3 h-8 shadow-xs"
                  onClick={() => {
                    const id = data?.id || recordId
                    onClose()
                    router.push(`/app/finance?invoiceId=${id}`)
                  }}
                  title="Open in Finance"
                >
                  <span className="whitespace-nowrap">View in Finance</span>
                  <ExternalLink size={13} />
                </button>
              )}

              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={fetchRecord}
                title="Refresh details"
                aria-label="Refresh details"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>

              <button
                ref={closeBtnRef}
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={onClose}
                title="Close inspector (Esc)"
                aria-label="Close inspector"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile Header Quick Utilities: Refresh + Close */}
            <div className="flex sm:hidden items-center gap-1 shrink-0">
              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={fetchRecord}
                title="Refresh details"
                aria-label="Refresh details"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                className="btn-icon btn-icon-sm btn-icon-ghost"
                onClick={onClose}
                title="Close inspector"
                aria-label="Close inspector"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Mobile Secondary Action Strip (Visible only on mobile screens < 640px) */}
          <div className="flex sm:hidden items-center gap-2 pt-2.5 mt-2 border-t border-border/40">
            {type === 'student' && (data?.id || recordId) && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold h-8"
                  onClick={() => {
                    const id = data?.id || recordId
                    if (onEdit) onEdit(data || { id })
                    else {
                      onClose()
                      router.push(`/app/students/${id}?edit=true`)
                    }
                  }}
                  title="Edit Student Information"
                >
                  <Pencil size={13} className="text-primary" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold h-8 shadow-xs"
                  onClick={() => {
                    const id = data?.id || recordId
                    onClose()
                    router.push(`/app/students/${id}`)
                  }}
                  title="Open Full Profile"
                >
                  <span>Full Profile</span>
                  <ExternalLink size={13} />
                </button>
              </>
            )}

            {type === 'staff' && (data?.id || data?.userId || recordId) && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold h-8"
                  onClick={() => {
                    const id = data?.userId || data?.id || recordId
                    if (onEdit) onEdit(data || { id })
                    else {
                      onClose()
                      router.push(`/app/users/staff?editUser=${id}`)
                    }
                  }}
                  title="Edit Staff Member"
                >
                  <Pencil size={13} className="text-sky-500" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold h-8 shadow-xs"
                  onClick={() => {
                    const id = data?.userId || data?.id || recordId
                    onClose()
                    router.push(`/app/users/staff?user=${id}`)
                  }}
                  title="Open Staff Profile"
                >
                  <span>Staff Profile</span>
                  <ExternalLink size={13} />
                </button>
              </>
            )}

            {type === 'invoice' && (data?.id || recordId) && (
              <button
                type="button"
                className="btn btn-sm btn-primary w-full flex items-center justify-center gap-1.5 text-xs font-semibold h-8 shadow-xs"
                onClick={() => {
                  const id = data?.id || recordId
                  onClose()
                  router.push(`/app/finance?invoiceId=${id}`)
                }}
              >
                <span>View in Finance</span>
                <ExternalLink size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Body (Auto-scrolled to top on open) */}
        <div
          ref={bodyRef}
          className="drawer-body flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5"
          style={{ overscrollBehavior: 'contain', overflowX: 'hidden' }}
        >
          {loading && !data ? (
            <div className="space-y-4 py-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                </div>
              </div>
              <div className="h-24 bg-muted/60 rounded-xl animate-pulse" />
              <div className="h-32 bg-muted/60 rounded-xl animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load details</p>
                <p className="mt-1 text-muted-foreground">{error}</p>
                <button
                  type="button"
                  onClick={fetchRecord}
                  className="btn btn-sm btn-outline mt-3 text-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No record selected or available.
            </div>
          ) : (
            <>
              {/* STUDENT VIEW */}
              {type === 'student' && (
                <StudentInspectorContent data={data} router={router} onClose={onClose} />
              )}

              {/* STAFF VIEW */}
              {type === 'staff' && (
                <StaffInspectorContent data={data} router={router} onClose={onClose} onEdit={onEdit} />
              )}

              {/* INVOICE VIEW */}
              {type === 'invoice' && (
                <InvoiceInspectorContent data={data} router={router} onClose={onClose} />
              )}
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div
          className="drawer-foot border-t border-border/80 px-4 sm:px-6 py-3.5 shrink-0 flex items-center justify-between"
          style={{
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Side-Peek Inspector • PreOne OS
          </span>

          <div className="flex items-center justify-end w-full sm:w-auto gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline px-4 h-8 text-xs font-semibold"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT CONTENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function StudentInspectorContent({
  data,
  router,
  onClose,
}: {
  data: any
  router: any
  onClose: () => void
}) {
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'Student'
  const classroom = data.currentClassroom || data.classroom
  const teacher = classroom?.primaryTeacher || data.teacher
  const guardianLinks = data.guardians || []
  const primaryGuardianLink =
    guardianLinks.find((g: any) => g.isPrimary) ||
    guardianLinks[0] ||
    (data.primaryGuardian ? { guardian: data.primaryGuardian, relationship: data.primaryGuardian.relationship } : null)
  const primaryGuardian = primaryGuardianLink?.guardian || data.primaryGuardian
  const guardianRel = primaryGuardianLink?.relationship || primaryGuardian?.relationship || 'Guardian'
  const guardianPhone = primaryGuardian?.phone
  const cleanPhone = cleanPhoneForWhatsApp(guardianPhone)

  // Attendance stats
  const attendances = data.attendances || []
  const totalTracked = attendances.length || data.attendance?.totalTracked || 0
  const presentCount = attendances.filter((a: any) => a.status === 'PRESENT').length
  const lateCount = attendances.filter((a: any) => a.status === 'LATE').length
  const attendanceRate =
    data.attendance?.rate !== undefined
      ? data.attendance.rate
      : totalTracked > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalTracked) * 100)
      : null

  // Financial summary
  const invoices = data.invoices || []
  const hasFinanceData = invoices.length > 0 || data.feeBalance !== undefined
  const totalBilled = invoices.reduce((sum: number, inv: any) => sum + (inv.totalCents || 0), 0)
  const totalPaid = invoices.reduce((sum: number, inv: any) => sum + (inv.paidCents || 0), 0)
  const balanceOutstanding = invoices.reduce((sum: number, inv: any) => sum + (inv.balanceCents || 0), 0)

  return (
    <div className="space-y-5 text-sm">
      {/* Identity Card */}
      <div className="card p-4 rounded-xl flex items-start gap-4">
        <Avatar name={fullName} src={data.photoUrl} size="lg" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-base text-foreground truncate">{fullName}</h4>
            <StatusBadge status={data.status || 'ACTIVE'} size="sm" />
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Admission No
              </span>
              <span className="font-mono font-medium text-foreground">{data.admissionNo || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Age / DOB
              </span>
              <span className="font-medium text-foreground">
                {data.dob ? `${fmtDate(data.dob)} (${formatAge(data.dob)})` : '—'}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Classroom
              </span>
              <span className="font-medium text-foreground">
                {classroom?.name || 'Unassigned'}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Class Teacher
              </span>
              <span className="font-medium text-foreground">
                {teacher?.fullName || teacher?.name || 'Not assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Guardian & Contact Strip */}
      <div className="card p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User size={14} className="text-primary" /> Primary Guardian & Contacts
          </span>
          {guardianRel && (
            <span className="badge b-primary text-[11px] font-semibold">{guardianRel}</span>
          )}
        </div>

        {primaryGuardian ? (
          <div className="space-y-3">
            <div>
              <div className="font-bold text-foreground text-sm">
                {primaryGuardian.fullName || primaryGuardian.name || 'Unnamed Guardian'}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                {guardianPhone || 'No phone recorded'}
              </div>
            </div>

            {/* Quick Action Contact Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {guardianPhone ? (
                <>
                  <a
                    href={`tel:${guardianPhone}`}
                    className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
                    title={`Call ${primaryGuardian.fullName || 'guardian'}`}
                  >
                    <Phone size={13} className="text-emerald-500" />
                    <span>Call</span>
                  </a>

                  {cleanPhone ? (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
                      title="Open WhatsApp chat"
                    >
                      <MessageCircle size={13} className="text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No valid phone number for direct contact.
                </span>
              )}

              {primaryGuardian.email && (
                <a
                  href={`mailto:${primaryGuardian.email}`}
                  className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
                >
                  <Mail size={13} className="text-sky-500" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic py-2">
            No guardian record linked yet.
          </div>
        )}
      </div>

      {/* Attendance Metric */}
      <div className="card p-4 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500" /> Attendance Summary
          </span>
          {attendanceRate !== null && (
            <span
              className={`badge font-bold ${
                attendanceRate >= 85
                  ? 'b-success'
                  : attendanceRate >= 70
                  ? 'b-warning'
                  : 'b-danger'
              }`}
            >
              {attendanceRate}% Present
            </span>
          )}
        </div>

        {totalTracked > 0 ? (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, attendanceRate || 0)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{presentCount} days present</span>
              <span>{totalTracked} total tracked days</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            No recent attendance logs recorded for this student.
          </p>
        )}
      </div>

      {/* Pickup Authorization Summary (WITHOUT exposing secret PIN) */}
      <div className="card p-4 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-indigo-500" /> Pickup Authorization
          </span>
          <span className="text-[11px] text-muted-foreground">
            {guardianLinks.length} authorized
          </span>
        </div>

        <div className="space-y-1.5">
          {guardianLinks.length > 0 ? (
            guardianLinks.map((g: any, i: number) => {
              const guard = g.guardian || g
              return (
                <div
                  key={guard.id || i}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={guard.fullName || guard.name} size="sm" />
                    <div>
                      <span className="font-semibold text-foreground">
                        {guard.fullName || guard.name}
                      </span>
                      <span className="text-muted-foreground ml-1.5 text-[11px]">
                        ({g.relationship || guard.relationship || 'Guardian'})
                      </span>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Authorized
                  </span>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-muted-foreground py-1">
              General parents authorized under primary relationship.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground italic mt-1">
            * Security note: Guardian pickup verification PINs are protected and managed through the authorized gate pickup terminal.
          </p>
        </div>
      </div>

      {/* Fee & Invoices Summary (if present) */}
      {hasFinanceData && (
        <div className="card p-4 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard size={14} className="text-emerald-500" /> Fees & Balance
            </span>
            <span
              className={`font-bold tabular-nums ${
                balanceOutstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
              }`}
            >
              Balance: {inr(balanceOutstanding)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[10px] text-muted-foreground block font-semibold">BILLED</span>
              <span className="font-bold tabular-nums text-foreground">{inr(totalBilled)}</span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[10px] text-muted-foreground block font-semibold">PAID</span>
              <span className="font-bold tabular-nums text-emerald-600">{inr(totalPaid)}</span>
            </div>
            <div className="p-2 rounded bg-muted/40">
              <span className="text-[10px] text-muted-foreground block font-semibold">DUE</span>
              <span className="font-bold tabular-nums text-rose-600">{inr(balanceOutstanding)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF CONTENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function StaffInspectorContent({
  data,
  router,
  onClose,
  onEdit,
}: {
  data: any
  router: any
  onClose: () => void
  onEdit?: (record: any) => void
}) {
  const staff = data.user || data
  const profile = staff.staffProfile || data.staffProfile || {}
  const fullName = staff.fullName || staff.name || 'Staff Member'
  const email = staff.email
  const phone = staff.phone || profile.phone
  const cleanPhone = cleanPhoneForWhatsApp(phone)
  const role = staff.role || data.role || 'STAFF'
  const taughtClasses = staff.taughtClasses || data.taughtClasses || []

  return (
    <div className="space-y-5 text-sm">
      {/* Identity Card */}
      <div className="card p-4 rounded-xl flex items-start gap-4">
        <Avatar name={fullName} src={staff.avatarUrl} size="lg" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-base text-foreground truncate">{fullName}</h4>
            <StatusBadge status={staff.status || 'ACTIVE'} size="sm" />
          </div>

          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
            @{staff.username || (email ? email.split('@')[0] : 'staff')}
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Designation
              </span>
              <span className="font-medium text-foreground">{profile.designation || enumLabel(role)}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Employee Code
              </span>
              <span className="font-mono font-medium text-foreground">{profile.employeeCode || '—'}</span>
            </div>
            <div className="mt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Department
              </span>
              <span className="font-medium text-foreground">{profile.department || 'Academics'}</span>
            </div>
            <div className="mt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold block text-muted-foreground/80">
                Last Active
              </span>
              <span className="font-medium text-foreground">
                {staff.lastLoginAt ? timeAgo(staff.lastLoginAt) : 'Never logged in'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Contact Options */}
      <div className="card p-4 rounded-xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Phone size={14} className="text-sky-500" /> Staff Communication
        </span>

        <div className="flex flex-wrap gap-2">
          {phone ? (
            <>
              <a
                href={`tel:${phone}`}
                className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
              >
                <Phone size={13} className="text-emerald-500" />
                <span>Call ({phone})</span>
              </a>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
                >
                  <MessageCircle size={13} className="text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic py-1">
              No telephone on record.
            </span>
          )}

          {email && (
            <a
              href={`mailto:${email}`}
              className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
            >
              <Mail size={13} className="text-sky-500" />
              <span>Email ({email})</span>
            </a>
          )}
        </div>
      </div>

      {/* Assigned Classrooms / Responsibilities */}
      <div className="card p-4 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Building size={14} className="text-purple-500" /> Assigned Classrooms
          </span>
          <span className="badge b-neutral text-[11px] font-semibold">
            {taughtClasses.length} Classes
          </span>
        </div>

        {taughtClasses.length > 0 ? (
          <div className="space-y-1.5">
            {taughtClasses.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs border border-border/50"
              >
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap size={14} className="text-primary" />
                  <span>{c.name}</span>
                </div>
                <span className="text-muted-foreground">{c.programType || 'Classroom'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            No specific classroom assigned as primary teacher.
          </p>
        )}
      </div>

      {/* Security & Access Overview */}
      <div className="card p-4 rounded-xl space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield size={14} className="text-indigo-500" /> System Role & Security
        </span>

        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
          <span className="text-muted-foreground">Authorized System Role:</span>
          <span className="font-bold text-foreground font-mono">{role}</span>
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          * Confidentiality notice: Payroll, compensation and bank records are restricted and not exposed in general directory inspection.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE CONTENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceInspectorContent({
  data,
  router,
  onClose,
}: {
  data: any
  router: any
  onClose: () => void
}) {
  const items = data.items || []
  const payments = data.payments || []
  const student = data.student || {}
  const isPaid = data.status === 'PAID'
  const isOverdue = data.status === 'OVERDUE'
  const isPartiallyPaid = data.status === 'PARTIALLY_PAID'

  return (
    <div className="space-y-5 text-sm">
      {/* Financial Snapshot */}
      <div className="card p-4 rounded-xl space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-base text-foreground">
              Invoice #{data.invoiceNumber || data.id}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.title || 'Student Term Tuition & Fees'}
            </p>
          </div>
          <StatusBadge status={data.status || 'ISSUED'} />
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-xs pt-1 border-t border-border/60">
          <div>
            <span className="text-muted-foreground block text-[11px]">STUDENT</span>
            <span className="font-semibold text-foreground">{student.name || 'Student'}</span>
            {student.admissionNo && (
              <span className="text-muted-foreground text-[11px] block font-mono">
                {student.admissionNo}
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">DUE DATE</span>
            <span className="font-semibold text-foreground">
              {data.dueDate ? fmtDate(data.dueDate) : '—'}
            </span>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/60">
          <div className="p-2 rounded bg-muted/40">
            <span className="text-[10px] text-muted-foreground font-semibold block">BILLED</span>
            <span className="font-bold tabular-nums text-foreground">
              {inr(data.totalCents || 0)}
            </span>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <span className="text-[10px] text-muted-foreground font-semibold block">PAID</span>
            <span className="font-bold tabular-nums text-emerald-600">
              {inr(data.paidCents || 0)}
            </span>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <span className="text-[10px] text-muted-foreground font-semibold block">BALANCE</span>
            <span
              className={`font-bold tabular-nums ${
                (data.balanceCents || 0) > 0 ? 'text-rose-600' : 'text-foreground'
              }`}
            >
              {inr(data.balanceCents || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Fee Breakdown */}
      {items.length > 0 && (
        <div className="card p-4 rounded-xl space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CreditCard size={14} className="text-primary" /> Itemized Charges
          </span>

          <div className="divide-y divide-border/60 text-xs">
            {items.map((item: any, i: number) => (
              <div key={item.id || i} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">{item.feeHead}</span>
                  {item.description && (
                    <span className="text-[11px] text-muted-foreground">{item.description}</span>
                  )}
                </div>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {inr(item.amountCents || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Transactions & Verified Receipts */}
      <div className="card p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-500" /> Verified Payment Records
          </span>
          <span className="text-[11px] text-muted-foreground">
            {payments.length} transactions
          </span>
        </div>

        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p: any, i: number) => (
              <div
                key={p.id || i}
                className="p-2.5 rounded-lg border border-border/70 bg-card/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground tabular-nums">
                      {inr(p.amountCents || 0)}
                    </span>
                    <span className="badge b-success text-[10px]">SUCCESS</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {p.method} • {p.paymentDate ? fmtDate(p.paymentDate) : 'Paid'}
                  </div>
                </div>

                {p.receiptId || p.receiptNumber || p.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      const recId = p.receiptId || p.id
                      window.open(`/api/v1/receipts/${recId}`, '_blank')
                    }}
                    className="btn btn-sm btn-outline text-xs flex items-center gap-1.5"
                    title="View and print official payment receipt"
                  >
                    <Printer size={12} className="text-primary" />
                    <span>Receipt</span>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-1">
            No payments have been received for this invoice yet.
          </p>
        )}
      </div>
    </div>
  )
}
