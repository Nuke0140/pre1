'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  GraduationCap, CheckCircle2, Building, DollarSign, Users, Search,
  Filter, RefreshCw, Eye, ArrowRight, ShieldCheck, Sparkles, BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StatusPill, StudentIdentityChip, FamilyIdentityChip } from '@/components/preone'

export default function ConfirmedAdmissionsPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [sessions, setSessions] = useState<{ id: string; name: string; isCurrent?: boolean }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [classrooms, setClassrooms] = useState<any[]>([])

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('')

  // Data states
  const [admittedStudents, setAdmittedStudents] = useState<any[] | null>(null)
  const [readyForEnrollment, setReadyForEnrollment] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Confirm Enrollment Modal
  const [enrollModal, setEnrollModal] = useState<{
    open: boolean
    application: any | null
    classroomId: string
  }>({
    open: false,
    application: null,
    classroomId: '',
  })

  // Load masters on mount
  useEffect(() => {
    async function loadMasters() {
      try {
        const [brRes, sesRes, clsRes] = await Promise.all([
          fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/academic-years').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/classrooms').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        ])
        if (brRes.success && brRes.data?.length > 0) {
          setBranches(brRes.data)
          const main = brRes.data.find((b: any) => b.isMain) || brRes.data[0]
          setSelectedBranchId(main.id)
        }
        if (sesRes.success && sesRes.data?.length > 0) {
          setSessions(sesRes.data)
          const curr = sesRes.data.find((s: any) => s.isCurrent) || sesRes.data[0]
          setSelectedSessionId(curr.id)
        }
        if (clsRes.success && clsRes.data) {
          setClassrooms(clsRes.data)
        }
      } catch (e) {
        console.error('Failed to load masters:', e)
      }
    }
    loadMasters()
  }, [])

  // Load applications data (both ENROLLED and OFFER_ACCEPTED)
  const loadAdmissionsLedger = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        ...(selectedSessionId ? { academicSessionId: selectedSessionId } : {}),
      })
      const res = await fetch(`/api/v1/applications?${qParams.toString()}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] }))
      setBusy(false)
      if (res.success && res.data) {
        const all = res.data
        const enrolled = all.filter((a: any) => ['ENROLLED', 'ADMITTED'].includes(a.status))
        const ready = all.filter((a: any) => a.status === 'OFFER_ACCEPTED')
        setAdmittedStudents(enrolled)
        setReadyForEnrollment(ready)
      }
    } catch {
      setBusy(false)
    }
  }, [selectedBranchId, selectedSessionId])

  useEffect(() => {
    loadAdmissionsLedger()
  }, [loadAdmissionsLedger])

  // Execute Enrollment Fan-out
  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollModal.application?.id || !enrollModal.classroomId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${enrollModal.application.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: enrollModal.classroomId,
          academicYearId: selectedSessionId,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show(`Admission Confirmed! Enrolled with Admission No: ${res.data?.admissionNo || 'Generated'}`, { type: 'success' })
        setEnrollModal({ open: false, application: null, classroomId: '' })
        loadAdmissionsLedger()
      } else {
        toast.show(res.error || 'Enrollment failed', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error enrolling pupil', { type: 'error' })
    }
  }

  // Filter local enrolled list
  const filteredStudents = useMemo(() => {
    if (!admittedStudents) return []
    return admittedStudents.filter((app) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const child = `${app.childFirstName} ${app.childLastName || ''}`.toLowerCase()
        const parent = (app.parentName || '').toLowerCase()
        const phone = (app.parentPhone || '').toLowerCase()
        const appNo = (app.applicationNumber || '').toLowerCase()
        if (!child.includes(q) && !parent.includes(q) && !phone.includes(q) && !appNo.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [admittedStudents, searchQuery])

  return (
    <AdmissionsShell
      title="Confirmed Admissions"
      description="Official ledger of finalized admissions with created Student profiles, Family IAM, and connected finance invoices"
      currentModuleKey="admitted"
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
      sessions={sessions}
      selectedSessionId={selectedSessionId}
      onSessionChange={setSelectedSessionId}
      showSessionFilter
      onNewEnquiry={() => setEnquiryModalOpen(true)}
      onSharePublicForm={() => setShareModalOpen(true)}
      actions={
        <button
          type="button"
          onClick={loadAdmissionsLedger}
          disabled={busy}
          className="btn btn-ghost btn-sm h-8.5 w-8.5 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
          title="Refresh Ledger"
        >
          <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="space-y-5">
        {/* ── Action Required: Candidates Awaiting Final Enrollment ── */}
        {readyForEnrollment.length > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Parent Accepted Offers ({readyForEnrollment.length} Ready for Final Enrollment)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Parents have accepted admission terms. Allocate a classroom section to generate the official student record.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {readyForEnrollment.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-primary">{candidate.applicationNumber}</span>
                      <span className="px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-700">
                        {candidate.programType}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      {candidate.childFirstName} {candidate.childLastName || ''}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Parent: {candidate.parentName} · {candidate.parentPhone}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEnrollModal({
                        open: true,
                        application: candidate,
                        classroomId: '',
                      })
                    }}
                    className="btn btn-primary btn-sm h-8 rounded-lg text-xs font-semibold w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Confirm & Enroll Student →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Authoritative Admissions Ledger ── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Official Student Enrollment Ledger
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed admissions fan-out with active pupil profiles, parent IAM, and tuition fee schedules
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search enrolled pupil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-8.5 pl-8 pr-3 text-xs w-full rounded-xl bg-background border border-border/70"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">App Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Parent / Contact</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Enrolled On</th>
                  <th className="px-4 py-3 text-right">360 Quicklinks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {app.applicationNumber}
                      </td>
                      <td className="px-4 py-3">
                        <StudentIdentityChip
                          name={`${app.childFirstName} ${app.childLastName || ''}`}
                          subtext={app.childGender}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <FamilyIdentityChip
                          name={app.parentName}
                          phone={app.parentPhone}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                          {app.programType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <CheckCircle2 size={11} />
                          <span>ENROLLED</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {fmtDate(app.verifiedAt || app.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href="/app/students"
                            className="btn btn-outline btn-sm h-7 px-2 text-[11px] rounded-lg gap-1"
                            title="Open Student 360"
                          >
                            <GraduationCap size={11} />
                            <span>Student</span>
                          </Link>
                          <Link
                            href="/app/finance"
                            className="btn btn-outline btn-sm h-7 px-2 text-[11px] rounded-lg gap-1"
                            title="Open Finance"
                          >
                            <DollarSign size={11} />
                            <span>Fees</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <EmptyState
                        illustration="students"
                        eyebrow="Confirmed Admissions"
                        title="No enrolled students found"
                        description="Once applicants accept their admission offers and classroom allocation is finalized, their enrollment records will appear here."
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: CONFIRM ENROLLMENT & ALLOCATE CLASSROOM ── */}
      <Modal
        open={enrollModal.open}
        onClose={() => setEnrollModal({ open: false, application: null, classroomId: '' })}
        title="Complete Admission & Class Allocation"
        subtitle={enrollModal.application ? `For ${enrollModal.application.childFirstName} ${enrollModal.application.childLastName || ''}` : 'Class allocation'}
        icon={<GraduationCap size={20} />}
      >
        <form onSubmit={handleConfirmEnrollment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1 text-primary">
            <span className="font-bold">Automated Unified Admission Fan-out:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
              <li>Generates canonical Student master with official Admission Number</li>
              <li>Reserves seat in chosen classroom section</li>
              <li>Provisions parent user account for Family & Parent Portal</li>
              <li>Generates initial Tuition Fee invoice in Finance</li>
            </ul>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Classroom Section Allocation *</label>
            <select
              required
              value={enrollModal.classroomId}
              onChange={(e) => setEnrollModal((prev) => ({ ...prev, classroomId: e.target.value }))}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="">Select Classroom Section...</option>
              {classrooms
                .filter((c) => !enrollModal.application?.programType || c.programType === enrollModal.application.programType)
                .map((cls) => {
                  const enrolled = cls._count?.students || 0
                  const available = Math.max(0, cls.capacity - enrolled)
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({available} seats available / {cls.capacity} capacity)
                    </option>
                  )
                })}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setEnrollModal({ open: false, application: null, classroomId: '' })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !enrollModal.classroomId}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {busy ? 'Enrolling...' : 'Confirm & Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Auxiliary Modals */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={[]}
        onSuccess={loadAdmissionsLedger}
      />
      <SharePublicFormModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        branchId={selectedBranchId}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name}
      />
    </AdmissionsShell>
  )
}
