'use client'

import React from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Utensils,
  Droplet,
  FileText,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  School,
  Sparkles,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone/ui'
import { formatPreschoolAge, fmtDate, enumLabel } from '@/lib/format'
import {
  getStudentSafetySummary,
  StudentSafetySource,
} from '@/lib/students/safety-alerts'
import { StudentGuardianQuickActions } from './StudentGuardianQuickActions'

export interface StudentSafetyModalProps {
  open: boolean
  onClose: () => void
  student?: (StudentSafetySource & {
    id: string
    name: string
    firstName?: string
    lastName?: string
    admissionNo?: string
    seatNumber?: string | null
    photoUrl?: string | null
    dob?: string | Date
    classroom?: { name: string; teacher?: string } | string | null
    primaryGuardian?: {
      name: string
      phone?: string
      relationship?: string
      isPrimary?: boolean
    } | null
    emergencyContact?: {
      name: string
      phone?: string
      relationship?: string
      isPrimary?: boolean
      isEmergencyContact?: boolean
    } | null
    guardians?: Array<{
      name: string
      phone?: string
      relationship?: string
      isPrimary?: boolean
      isEmergencyContact?: boolean
    }>
  }) | null
  onViewProfile?: (studentId: string) => void
}

export function StudentSafetyModal({
  open,
  onClose,
  student,
  onViewProfile,
}: StudentSafetyModalProps) {
  if (!student) return null

  const summary = getStudentSafetySummary(student)
  const preschoolAge = student.dob ? formatPreschoolAge(student.dob) : '—'
  const classroomName =
    typeof student.classroom === 'object' && student.classroom
      ? student.classroom.name
      : typeof student.classroom === 'string'
      ? student.classroom
      : null

  const allergyAlerts = summary.alerts.filter((a) => a.type === 'ALLERGY')
  const medicalAlerts = summary.alerts.filter((a) => a.type === 'MEDICAL')
  const dietaryAlerts = summary.alerts.filter((a) => a.type === 'DIETARY')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Student Health & Emergency Safety Sheet"
      subtitle={`Life-saving medical directives and emergency contacts for ${student.name}`}
      icon={<ShieldAlert size={22} className={summary.hasCriticalAlert ? 'text-rose-600' : 'text-amber-500'} />}
      iconClass={summary.hasCriticalAlert ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}
      wide
    >
      <div className="space-y-4.5 py-1">
        {/* ── 1. Top Identity Strip ── */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <Avatar name={student.name} src={student.photoUrl} size="lg" className="ring-2 ring-white dark:ring-slate-700 shadow-xs shrink-0" />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {student.name}
                </h3>
                {summary.bloodGroup && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 shadow-2xs">
                    <Droplet size={11} className="fill-rose-500 text-rose-500" />
                    <span>Blood: {summary.bloodGroup}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700">
                  {student.admissionNo || 'ID: —'}
                </span>
                {student.seatNumber && (
                  <span className="font-mono bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800">
                    Seat: {student.seatNumber}
                  </span>
                )}
                {classroomName && (
                  <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <School size={12} className="text-purple-500 shrink-0" />
                    <span>{classroomName}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles size={12} className="text-amber-500 shrink-0" />
                  <span>Age: {preschoolAge}</span>
                </span>
              </div>
            </div>
          </div>

          {onViewProfile && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onViewProfile(student.id)
              }}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/70 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            >
              <span>View Full 360°</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>

        {/* ── 2. Critical Alert Banner (if applicable) ── */}
        {summary.hasCriticalAlert ? (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 dark:border-rose-500/40 rounded-2xl p-3.5 sm:p-4 text-rose-950 dark:text-rose-100 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert size={18} />
            </div>
            <div className="space-y-1">
              <div className="font-black text-sm tracking-tight text-rose-900 dark:text-rose-200 uppercase flex items-center gap-2">
                <span>Critical Safety Condition Active</span>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded-full font-bold">
                  HIGH URGENCY
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
                This child has life-threatening allergy or medical conditions requiring immediate staff protocol adherence. Do not administer unauthorized snacks or medications.
              </p>
            </div>
          </div>
        ) : summary.hasAlerts ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-amber-900 dark:text-amber-200 flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>Staff note: Please adhere to dietary and health precautions below during meals and classroom activities.</span>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>No critical medical alerts or dietary restrictions recorded for this child.</span>
          </div>
        )}

        {/* ── 3. Categorized Alerts Breakdown ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* A: Allergies */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider">
              <ShieldAlert size={15} />
              <span>Allergies ({allergyAlerts.length})</span>
            </div>
            {allergyAlerts.length > 0 ? (
              <div className="space-y-1.5">
                {allergyAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 border ${
                      a.severity === 'CRITICAL'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <span>{a.label}</span>
                    {a.severity === 'CRITICAL' && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white shrink-0">
                        Severe
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No allergies recorded</p>
            )}
          </div>

          {/* B: Medical Conditions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-extrabold text-xs uppercase tracking-wider">
              <HeartPulse size={15} />
              <span>Medical ({medicalAlerts.length})</span>
            </div>
            {medicalAlerts.length > 0 ? (
              <div className="space-y-1.5">
                {medicalAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-2 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-1.5"
                  >
                    <span>{a.label}</span>
                    {a.isCritical && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-600 text-white shrink-0">
                        Alert
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No medical conditions</p>
            )}
          </div>

          {/* C: Dietary Restrictions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Utensils size={15} />
              <span>Dietary ({dietaryAlerts.length})</span>
            </div>
            {dietaryAlerts.length > 0 ? (
              <div className="space-y-1.5">
                {dietaryAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="p-2 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                  >
                    <span>{a.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No dietary restrictions</p>
            )}
          </div>
        </div>

        {/* ── 4. Emergency Protocol / Medical Directives ── */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
            <FileText size={15} className="text-purple-600" />
            <span>Emergency Medical Instructions & Action Protocol</span>
          </div>
          {summary.emergencyInstructions ? (
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium leading-relaxed shadow-2xs whitespace-pre-line">
              {summary.emergencyInstructions}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 text-xs italic">
              No custom emergency instructions recorded by guardians. In case of an emergency, contact primary guardians and emergency services immediately.
            </div>
          )}
        </div>

        {/* ── 5. Emergency Contacts & Rapid 1-Tap Calling ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
              <Phone size={14} className="text-emerald-600" />
              <span>Emergency Contacts & Rapid Dialing</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">1-Tap Dial or WhatsApp</span>
          </div>

          <div className="space-y-2">
            {student.primaryGuardian ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {student.primaryGuardian.name}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                      {enumLabel(student.primaryGuardian.relationship || 'Primary Guardian')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      (Primary)
                    </span>
                  </div>
                  {student.primaryGuardian.phone && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {student.primaryGuardian.phone}
                    </div>
                  )}
                </div>

                <StudentGuardianQuickActions
                  guardian={student.primaryGuardian}
                  emergencyContact={student.emergencyContact}
                  childName={student.name}
                  variant="modal"
                />
              </div>
            ) : null}

            {student.emergencyContact &&
            student.emergencyContact.name !== student.primaryGuardian?.name ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {student.emergencyContact.name}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                      Emergency Contact
                    </span>
                  </div>
                  {student.emergencyContact.phone && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {student.emergencyContact.phone}
                    </div>
                  )}
                </div>

                <StudentGuardianQuickActions
                  guardian={student.emergencyContact}
                  childName={student.name}
                  variant="modal"
                />
              </div>
            ) : null}

            {!student.primaryGuardian && !student.emergencyContact && (
              <p className="text-xs text-slate-400 italic">No emergency contacts registered.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
