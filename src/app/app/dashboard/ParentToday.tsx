'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Baby,
  CalendarCheck,
  Calendar,
  Clock,
  Heart,
  AlertTriangle,
  Wallet,
  FileText,
  Eye,
  Download,
  UserCheck,
  Shield,
  Sparkles,
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronRight,
  User,
  Utensils,
  Moon,
  Smile,
  Activity,
  RefreshCw,
  Building2,
  GraduationCap,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react'
import { PageHead, Skeleton, Avatar, EmptyState, StatusBadge } from '@/components/preone/ui'
import { PdfViewerModal } from '@/components/preone/PdfViewerModal'
import { inr, fmtDate, fmtDateTime, timeAgo, enumLabel } from '@/lib/format'

interface AttendanceRecord {
  id: string
  date: string
  status: string
  markedAt: string | null
  notes: string | null
}

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  attendanceRate: number
}

interface TimelineItem {
  id: string
  type: string
  title: string
  body: string | null
  mood: string | null
  photoUrl: string | null
  at: string
}

interface ObservationItem {
  id: string
  narrative: string
  category: string | null
  observedAt: string
}

interface InvoiceItem {
  id: string
  feeHead: string
  description: string
  amountRupees: number
}

interface InvoiceData {
  id: string
  invoiceNumber: string
  title: string
  dueDate: string
  issueDate: string
  subtotalRupees: number
  discountRupees: number
  totalRupees: number
  paidRupees: number
  balanceRupees: number
  status: string
  items: InvoiceItem[]
}

interface PaymentRecord {
  id: string
  paymentNumber: string
  invoiceNumber: string
  amountRupees: number
  method: string
  status: string
  paymentDate: string
  receiptNumber: string | null
}

interface FeeScheduleItem {
  id: string
  feeHead: string
  dueDate: string
  amountDueRupees: number
  amountPaidRupees: number
  remainingRupees: number
  status: string
}

interface FeesData {
  summary: {
    totalApplicableRupees: number
    totalPaidRupees: number
    totalPendingRupees: number
    status: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'NO_FEES'
  }
  invoices: InvoiceData[]
  paymentHistory: PaymentRecord[]
  schedules: FeeScheduleItem[]
}

interface DocumentItem {
  id: string
  title: string
  documentType: string
  fileName: string
  fileSizeBytes: number
  createdAt: string
  downloadUrl: string
}

interface ChildDetail {
  id: string
  firstName: string
  lastName: string | null
  name: string
  photoUrl: string | null
  admissionNo: string
  admissionDate: string | null
  dob: string | null
  age: string | null
  gender: string
  status: string
  branch: { id: string; name: string; code: string } | null
  classroom: {
    id: string
    name: string
    code: string
    programType: string
    programName: string | null
    teacher: string | null
  } | null
  guardian?: {
    relationship?: string
    name?: string
    phone?: string
    isPrimary?: boolean
    canPickup?: boolean
  }
  bloodGroup?: string | null
  allergies?: string | null
  medicalAlerts?: string | null
  dietaryRestrictions?: string | null
  emergencyMedicalInstructions?: string | null
  address?: string | null

  attendance?: {
    todayStatus?: string | null
    todayNotes?: string | null
    summary?: AttendanceSummary
    recentHistory?: AttendanceRecord[]
  }
  todayCare?: TimelineItem[]
  observations?: ObservationItem[]
  fees?: FeesData
  documents?: DocumentItem[]
  alerts?: { title: string; severity: string; createdAt: string }[]
}

export function ParentToday() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ today: string; children: ChildDetail[] } | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'attendance' | 'diary' | 'fees' | 'documents'>('all')
  const [diarySubTab, setDiarySubTab] = useState<'care' | 'observations'>('care')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/parent/today', { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.data) {
        const children = Array.isArray(json.data.children) ? json.data.children : []
        setData({
          today: json.data.today || '',
          children,
        })
        if (children.length > 0) {
          setSelectedChildId((prev) =>
            prev && children.some((c: ChildDetail) => c.id === prev) ? prev : children[0].id
          )
        }
      }
    } catch {
      // quiet failure
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const childrenList = useMemo(() => {
    return Array.isArray(data?.children) ? data!.children : []
  }, [data?.children])

  const activeChild = useMemo(() => {
    if (childrenList.length === 0) return null
    return childrenList.find((c) => c.id === selectedChildId) || childrenList[0]
  }, [childrenList, selectedChildId])

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <PageHead title="My Child" sub="Loading student profile and daily dashboard..." />
        <Skeleton h={320} />
      </div>
    )
  }

  if (!data || childrenList.length === 0) {
    return (
      <div className="space-y-4">
        <PageHead
          eyebrow="Parent Connect"
          badge={<span className="badge b-primary b-dot">Family Portal</span>}
          title="Parent Dashboard"
          sub="Child profile, daily attendance, care logs and school documents."
        />
        <div className="card">
          <EmptyState
            icon={<Baby size={40} className="text-slate-400" />}
            title="No Children Linked"
            message="No student profile is currently linked to your parent account. Please contact your school administrator to link your account to your child."
          />
        </div>
      </div>
    )
  }

  const child = activeChild!
  const hasMultipleChildren = childrenList.length > 1

  const alerts = Array.isArray(child?.alerts) ? child.alerts : []
  const attendance = child?.attendance ?? {}
  const attendanceSummary: AttendanceSummary = {
    totalDays: attendance?.summary?.totalDays ?? 0,
    presentDays: attendance?.summary?.presentDays ?? 0,
    absentDays: attendance?.summary?.absentDays ?? 0,
    lateDays: attendance?.summary?.lateDays ?? 0,
    halfDays: attendance?.summary?.halfDays ?? 0,
    attendanceRate: attendance?.summary?.attendanceRate ?? 0,
  }
  const recentHistory = Array.isArray(attendance?.recentHistory) ? attendance.recentHistory : []
  const todayCare = Array.isArray(child?.todayCare) ? child.todayCare : []
  const observations = Array.isArray(child?.observations) ? child.observations : []
  const fees = child?.fees ?? {}
  const feesSummary = {
    totalApplicableRupees: fees?.summary?.totalApplicableRupees ?? 0,
    totalPaidRupees: fees?.summary?.totalPaidRupees ?? 0,
    totalPendingRupees: fees?.summary?.totalPendingRupees ?? 0,
    status: fees?.summary?.status ?? 'NO_FEES',
  }
  const invoices = Array.isArray(fees?.invoices) ? fees.invoices : []
  const schedules = Array.isArray(fees?.schedules) ? fees.schedules : []
  const paymentHistory = Array.isArray(fees?.paymentHistory) ? fees.paymentHistory : []
  const documents = Array.isArray(child?.documents) ? child.documents : []

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHead
          eyebrow="Parent Connect"
          badge={<span className="badge b-primary b-dot">Student Master & Profile</span>}
          title={hasMultipleChildren ? 'Parent Dashboard' : `${child.name} — Overview`}
          sub={`${data.today} · Real-time attendance, daily care updates, fees and issued documents.`}
        />
        <button
          type="button"
          onClick={load}
          className="btn btn-ghost btn-sm inline-flex items-center gap-2 self-start md:self-auto cursor-pointer"
          title="Refresh updates"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Multiple Children Selector ── */}
      {hasMultipleChildren && (
        <div className="bg-slate-100/80 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 whitespace-nowrap">
            Switch Child:
          </span>
          {childrenList.map((c) => {
            const isSelected = c.id === child.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChildId(c.id)}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all text-left whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-purple-500/40 ring-2 ring-purple-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/50'
                }`}
              >
                <Avatar name={c.name} src={c.photoUrl} size="sm" />
                <div>
                  <div className="text-xs font-bold leading-tight">{c.name}</div>
                  <div className="text-[10px] text-slate-500">
                    {c.classroom?.name || 'Classroom'}{c.admissionNo ? ` · ${c.admissionNo}` : ''}
                  </div>
                </div>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 ml-1" />}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Safety Alerts (if any) ── */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wide">
            <AlertTriangle size={15} /> Safety / Health Notification
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200">
              <span className="font-medium">{a.title}</span>
              <span className="text-slate-500 text-[11px]">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Child Hero Card: Student Master Details ── */}
      <div className="card overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="p-5 md:p-6 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-transparent border-b border-slate-200/70 dark:border-slate-800/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={child.name}
                src={child.photoUrl}
                size="lg"
                className="w-16 h-16 text-lg ring-4 ring-white dark:ring-slate-900 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {child.name}
                  </h2>
                  <StatusBadge status={child.status} />
                  {child.guardian?.relationship && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                      {child.guardian.relationship}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-medium">#{child.admissionNo}</span>
                  {child.classroom?.name && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {child.classroom.name}
                      </span>
                    </>
                  )}
                  {child.branch?.name && (
                    <>
                      <span>·</span>
                      <span>{child.branch.name} Campus</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs">
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Today's Attendance</span>
                {attendance.todayStatus ? (
                  <StatusBadge status={attendance.todayStatus} />
                ) : (
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Not Marked Yet</span>
                )}
              </div>
              <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs">
                <span className="text-slate-400 text-[10px] block uppercase font-medium">Fee Balance</span>
                <span
                  className={`font-bold ${
                    feesSummary.totalPendingRupees > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {inr(feesSummary.totalPendingRupees * 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Complete Profile Information Grid ── */}
        <div className="p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User size={13} className="text-purple-600" /> Student Master Record
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Admission ID: {child.admissionNo}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            {/* Admission No */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 text-[10px] block uppercase font-semibold">Admission No.</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                {child.admissionNo}
              </span>
            </div>

            {/* Admission Date */}
            {child.admissionDate && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Admission Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmtDate(child.admissionDate)}
                </span>
              </div>
            )}

            {/* Date of Birth & Age */}
            {child.dob && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Date of Birth (Age)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmtDate(child.dob)}
                  {child.age ? ` (${child.age})` : ''}
                </span>
              </div>
            )}

            {/* Gender */}
            {child.gender && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{enumLabel(child.gender)}</span>
              </div>
            )}

            {/* Branch / Campus */}
            {child.branch?.name && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Campus / Branch</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{child.branch.name}</span>
              </div>
            )}

            {/* Classroom */}
            {child.classroom?.name && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Classroom / Section</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {child.classroom.name}
                  {child.classroom.code ? ` (${child.classroom.code})` : ''}
                </span>
              </div>
            )}

            {/* Program / Level */}
            {(child.classroom?.programName || child.classroom?.programType) && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Program / Level</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {child.classroom.programName || enumLabel(child.classroom.programType)}
                </span>
              </div>
            )}

            {/* Primary Teacher */}
            {child.classroom?.teacher && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Class Teacher</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{child.classroom.teacher}</span>
              </div>
            )}
          </div>

          {/* ── Health, Medical & Emergency Details (Show only valid non-empty fields) ── */}
          {(child.bloodGroup ||
            child.allergies ||
            child.medicalAlerts ||
            child.dietaryRestrictions ||
            child.emergencyMedicalInstructions ||
            child.address) && (
            <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart size={12} className="text-rose-500" /> Health, Care & Safety Notes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {child.bloodGroup && (
                  <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30">
                    <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase block">
                      Blood Group
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{child.bloodGroup}</span>
                  </div>
                )}
                {child.allergies && (
                  <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                    <span className="text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase block">
                      Known Allergies
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{child.allergies}</span>
                  </div>
                )}
                {child.dietaryRestrictions && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Dietary Restrictions</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {child.dietaryRestrictions}
                    </span>
                  </div>
                )}
                {child.medicalAlerts && (
                  <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                    <span className="text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase block">
                      Medical Alerts
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{child.medicalAlerts}</span>
                  </div>
                )}
                {child.emergencyMedicalInstructions && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">
                      Emergency Medical Instructions
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {child.emergencyMedicalInstructions}
                    </span>
                  </div>
                )}
                {child.address && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Registered Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{child.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section Navigation Filter ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'all', label: 'All Sections' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'diary', label: 'Daily Diary & Updates' },
          { key: 'fees', label: 'Fees & Invoices' },
          { key: 'documents', label: 'Official Documents' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Section 2: Attendance Summary & History ── */}
      {(activeTab === 'all' || activeTab === 'attendance') && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Summary & History</h3>
                <p className="text-xs text-slate-500">
                  Official student daily attendance records recorded by classroom teachers.
                </p>
              </div>
            </div>
            {attendance.todayStatus && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Today:</span>
                <StatusBadge status={attendance.todayStatus} />
              </div>
            )}
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Attendance Rate</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {attendanceSummary.attendanceRate}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                Present Days
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {attendanceSummary.presentDays}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30">
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">
                Absent Days
              </span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                {attendanceSummary.absentDays}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
                Late / Half Day
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {attendanceSummary.lateDays + attendanceSummary.halfDays}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Days Recorded</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {attendanceSummary.totalDays}
              </span>
            </div>
          </div>

          {/* Attendance History */}
          {recentHistory.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              <Calendar className="mx-auto mb-2 opacity-40" size={24} />
              No attendance records recorded yet. Daily attendance marked by teachers will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800/70">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Marked At</th>
                    <th className="px-4 py-2.5">Teacher Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {recentHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                        {fmtDate(rec.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {rec.markedAt ? fmtDateTime(rec.markedAt) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{rec.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Daily Diary and Teacher Updates ── */}
      {(activeTab === 'all' || activeTab === 'diary') && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Diary & Learning Updates</h3>
                <p className="text-xs text-slate-500">
                  Real-time daily activities, meals, nap times and published observations.
                </p>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDiarySubTab('care')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  diarySubTab === 'care'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Care & Activity Diary ({todayCare.length})
              </button>
              <button
                type="button"
                onClick={() => setDiarySubTab('observations')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  diarySubTab === 'observations'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Teacher Observations ({observations.length})
              </button>
            </div>
          </div>

          {/* SubTab 1: Care & Activities */}
          {diarySubTab === 'care' && (
            <div>
              {todayCare.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Activity className="mx-auto mb-2 opacity-40" size={26} />
                  No care or activity logs recorded for this child yet. Real-time updates posted by teachers during the
                  school day will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todayCare.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                          {entry.type}
                        </span>
                        <span className="text-[11px] text-slate-400">{timeAgo(entry.at)}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {entry.title}
                        {entry.mood && (
                          <span className="ml-2 font-normal text-slate-500">· Mood: {entry.mood}</span>
                        )}
                      </div>
                      {entry.body && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {entry.body}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SubTab 2: Teacher Observations */}
          {diarySubTab === 'observations' && (
            <div>
              {observations.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Sparkles className="mx-auto mb-2 opacity-40" size={26} />
                  No published learning observations yet. Formal developmental observations published by your teacher
                  will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {observations.map((obs) => (
                    <div
                      key={obs.id}
                      className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                          {obs.category || 'LEARNING & DEVELOPMENT'}
                        </span>
                        <span className="text-[11px] text-slate-400">{fmtDate(obs.observedAt)}</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        {obs.narrative}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Section 4: Fees and Financial Records ── */}
      {(activeTab === 'all' || activeTab === 'fees') && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fees & Billing Overview</h3>
                <p className="text-xs text-slate-500">
                  Official fee structures, issued invoices and payment receipts for this student.
                </p>
              </div>
            </div>
            <StatusBadge status={feesSummary.status} />
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Applicable Fees</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {inr(feesSummary.totalApplicableRupees * 100)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                Total Amount Paid
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {inr(feesSummary.totalPaidRupees * 100)}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
                Remaining / Pending Amount
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {inr(feesSummary.totalPendingRupees * 100)}
              </span>
            </div>
          </div>

          {/* Invoices List */}
          {invoices.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-500">Issued Invoices</h4>
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                          {inv.invoiceNumber}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{inv.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Due: {fmtDate(inv.dueDate)}</div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Total: {inr(inv.totalRupees * 100)}
                        </div>
                        {inv.balanceRupees > 0 && (
                          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            Due: {inr(inv.balanceRupees * 100)}
                          </div>
                        )}
                      </div>
                      <Link className="btn btn-secondary btn-sm text-xs" href="/app/finance">
                        View / Pay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fee Schedules (if no invoices yet, but schedules exist) */}
          {invoices.length === 0 && schedules.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-500">Scheduled Installments</h4>
              <div className="space-y-2">
                {schedules.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{sc.feeHead}</span>
                      <span className="text-slate-400 text-[11px] ml-2">Due: {fmtDate(sc.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{inr(sc.amountDueRupees * 100)}</span>
                      <StatusBadge status={sc.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <h4 className="text-xs font-bold uppercase text-slate-500">Payment Receipts</h4>
              <div className="space-y-1.5">
                {paymentHistory.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {p.paymentNumber}
                      </span>
                      {p.receiptNumber && (
                        <span className="ml-2 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                          Receipt #{p.receiptNumber}
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px] ml-2">({fmtDate(p.paymentDate)})</span>
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {inr(p.amountRupees * 100)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoices.length === 0 && schedules.length === 0 && (
            <div className="py-6 text-center text-slate-400 text-xs">
              <Wallet className="mx-auto mb-2 opacity-40" size={24} />
              No fees or pending invoices currently assigned to this student.
            </div>
          )}
        </div>
      )}

      {/* ── Section 5: Reports and Documents ── */}
      {(activeTab === 'all' || activeTab === 'documents') && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official Reports & Documents</h3>
                <p className="text-xs text-slate-500">
                  Official student report cards, ID cards and certificates issued by the school.
                </p>
              </div>
            </div>
            <span className="badge b-purple">{documents.length} available</span>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <FileText className="mx-auto mb-2 opacity-40" size={26} />
              No documents, certificates or report cards have been issued for this child yet. Documents published by the
              school administration will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                        {doc.documentType?.replace(/_/g, ' ') || 'DOCUMENT'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.round((doc.fileSizeBytes || 0) / 1024)} KB
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1" title={doc.title}>
                      {doc.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Issued: {fmtDate(doc.createdAt)}</div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      <Eye size={12} /> View PDF
                    </button>
                    <a
                      href={doc.downloadUrl}
                      download={doc.fileName}
                      className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:underline ml-auto"
                    >
                      <Download size={12} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Document PDF Preview Modal ── */}
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
  )
}
