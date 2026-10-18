'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Phone,
  Calendar,
  School,
  UserRound,
  Eye,
  Check,
  Sparkles,
  ClipboardCheck,
  UserCheck
} from 'lucide-react'
import { StatusBadge, StatusPill } from '@/components/preone'
import { formatPreschoolAge, initials, avatarClass, enumLabel, fmtDate } from '@/lib/format'
import { StudentGuardianQuickActions } from './StudentGuardianQuickActions'
import { StudentSafetyBadges } from './StudentSafetyBadges'

export interface StudentRosterRecord {
  id: string
  admissionNo: string
  seatNumber?: string | null
  photoUrl?: string | null
  name: string
  firstName?: string
  lastName?: string
  dob: string
  gender?: string
  status: string
  bloodGroup?: string | null
  allergies?: string | null
  medicalAlerts?: string | null
  dietaryRestrictions?: string | null
  emergencyMedicalInstructions?: string | null
  health?: {
    bloodGroup?: string | null
    allergies?: string | null
    medicalAlerts?: string | null
    dietaryRestrictions?: string | null
    emergencyMedicalInstructions?: string | null
  } | null
  classroom: { id: string; name: string; code?: string; programType?: string; teacher?: string } | null
  programType?: string | null
  primaryGuardian?: {
    id?: string
    name: string
    phone?: string
    email?: string
    relationship?: string
    isPrimary?: boolean
  } | null
  emergencyContact?: {
    id?: string
    name: string
    phone?: string
    email?: string
    relationship?: string
    isPrimary?: boolean
    isEmergencyContact?: boolean
    emergencyPriority?: number | null
  } | null
  guardians?: Array<{
    id?: string
    name: string
    phone?: string
    email?: string
    relationship?: string
    isPrimary?: boolean
    isEmergencyContact?: boolean
    emergencyPriority?: number | null
  }>
  attendance?: { rate: number; totalTracked: number }
}

export interface StudentRosterCardProps {
  student: StudentRosterRecord
  selected?: boolean
  onToggleSelect?: (id: string) => void
  canSelect?: boolean
  onInspect?: (student: StudentRosterRecord) => void
  onViewProfile?: (id: string) => void
  onAssignClass?: (id: string) => void
  onOpenSafety?: (student: StudentRosterRecord) => void
  canWriteStudents?: boolean
}

export function StudentRosterCard({
  student,
  selected = false,
  onToggleSelect,
  canSelect = false,
  onInspect,
  onViewProfile,
  onAssignClass,
  onOpenSafety,
  canWriteStudents = false,
}: StudentRosterCardProps) {
  const [imgError, setImgError] = useState(false)

  const firstName = student.firstName || student.name.split(' ')[0] || student.name
  const lastName = student.lastName || student.name.split(' ').slice(1).join(' ')
  const classroomName =
    typeof student.classroom === 'object' && student.classroom
      ? student.classroom.name
      : typeof student.classroom === 'string'
      ? student.classroom
      : null

  const preschoolAge = formatPreschoolAge(student.dob)
  const attendanceRate = student.attendance?.rate ?? 100
  const isGoodAttendance = attendanceRate >= 85
  const isWarningAttendance = attendanceRate >= 70 && attendanceRate < 85
  const attendanceDotBg = isGoodAttendance
    ? 'bg-emerald-500'
    : isWarningAttendance
    ? 'bg-amber-500'
    : 'bg-rose-500'

  return (
    <article
      tabIndex={0}
      role="region"
      aria-label={`Student card for ${student.name}`}
      onClick={() => onInspect?.(student)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onInspect?.(student)
        }
      }}
      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
        selected
          ? 'border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20 dark:bg-purple-950/20'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/80'
      }`}
    >
      {/* Top Floating Badges: Multi-select Checkbox & Status */}
      <div className="flex items-center justify-between gap-2 w-full mb-3">
        {canSelect ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select ${student.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect?.(student.id)
            }}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer min-h-[32px] min-w-[32px] focus:outline-none focus:ring-2 focus:ring-purple-500/40 ${
              selected
                ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-purple-400'
            }`}
          >
            <Check size={14} className={selected ? 'opacity-100 stroke-[3]' : 'opacity-0'} />
          </button>
        ) : (
          <div className="w-6" />
        )}

        <StatusBadge status={student.status} size="sm" />
      </div>

      {/* ── Face-First Photo Section ── */}
      <div className="flex flex-col items-center text-center">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden relative shadow-xs border-2 border-white dark:border-slate-800 ring-1 ring-slate-200 dark:ring-slate-700/80 bg-slate-100 dark:bg-slate-800/80 shrink-0 mx-auto">
          {student.photoUrl && !imgError ? (
            <img
              src={student.photoUrl}
              alt={`${student.name}'s profile photo`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center ${avatarClass(
                student.name
              )} text-white select-none`}
            >
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {initials(student.name)}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 mt-1 bg-black/15 px-2 py-0.5 rounded-full">
                No photo
              </span>
            </div>
          )}

          {/* Mini Attendance Indicator Dot */}
          <div
            className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 shadow-2xs"
            title={`30-day attendance: ${attendanceRate}%`}
          >
            <span className={`w-2 h-2 rounded-full ${attendanceDotBg}`} />
            <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {attendanceRate}%
            </span>
          </div>
        </div>

        {/* ── Student Names ── */}
        <div className="mt-3 w-full px-1">
          <h3
            className="text-base sm:text-[17px] font-extrabold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
            title={student.name}
          >
            {firstName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5" title={student.name}>
            {lastName ? student.name : '—'}
          </p>

          {/* Admission & Seat Tags */}
          <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200/60 dark:border-slate-700/40"
              title="Admission Number"
            >
              {student.admissionNo}
            </span>
            {student.seatNumber && (
              <span
                className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/50"
                title="Seat / Roll Number"
              >
                {student.seatNumber}
              </span>
            )}
          </div>

          {/* Life-Saving Safety & Allergy Badges */}
          <div className="mt-2 flex justify-center w-full min-h-[20px]">
            <StudentSafetyBadges
              student={student}
              maxVisible={2}
              size="xs"
              showBloodGroup
              onOpenSafety={() => onOpenSafety?.(student)}
            />
          </div>
        </div>

        {/* ── Meta Chips: Classroom & Preschool Age ── */}
        <div className="flex items-center justify-center gap-2 mt-3 w-full flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 truncate max-w-[145px]"
            title={`Classroom: ${classroomName || 'Unassigned'}`}
          >
            <School size={12} className="shrink-0 text-indigo-500" />
            <span className="truncate">{classroomName || 'Unassigned'}</span>
          </span>

          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-purple-50/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-mono shrink-0"
            title={`Preschool Age: ${preschoolAge}${student.dob ? ` (Born: ${fmtDate(student.dob)})` : ''}`}
          >
            <Sparkles size={12} className="shrink-0 text-purple-500" />
            <span>{preschoolAge}</span>
          </span>
        </div>
      </div>

      {/* ── Primary Guardian / Parent Contact Section ── */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        {student.primaryGuardian?.name ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-slate-700 dark:text-slate-300">
              <span
                className="font-medium truncate flex items-center gap-1"
                title={`Primary Contact: ${student.primaryGuardian.name}`}
              >
                <UserRound size={12} className="text-slate-400 shrink-0" />
                <span className="truncate font-semibold">{student.primaryGuardian.name}</span>
              </span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                {enumLabel(student.primaryGuardian.relationship || 'Guardian')}
              </span>
            </div>

            {/* Relationship-Aware 1-Click Call & WhatsApp Actions */}
            <div className="pt-0.5">
              <StudentGuardianQuickActions
                guardian={student.primaryGuardian}
                emergencyContact={student.emergencyContact}
                childName={student.name}
                variant="card"
              />
            </div>
          </div>
        ) : (
          <div className="text-slate-400 italic text-[11px] flex items-center justify-center gap-1.5 py-0.5">
            <UserRound size={12} className="text-slate-300 dark:text-slate-600" />
            <span>No primary guardian listed</span>
          </div>
        )}
      </div>

      {/* ── Card Action Buttons ── */}
      <div
        className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onInspect?.(student)}
          className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-800 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          title="Quick Inspect Child Drawer"
          aria-label={`Quick Inspect ${student.name}`}
        >
          <Eye size={13} className="shrink-0" />
          <span>Inspect</span>
        </button>

        <button
          type="button"
          onClick={() => onViewProfile?.(student.id)}
          className="flex-1 min-h-[38px] px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          title="View Student 360° Profile"
          aria-label={`View Student 360° Profile for ${student.name}`}
        >
          <UserCheck size={13} className="shrink-0" />
          <span>360° Profile</span>
        </button>
      </div>
    </article>
  )
}
