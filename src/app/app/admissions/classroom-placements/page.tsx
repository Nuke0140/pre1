'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LayoutGrid, Building, Users, CheckCircle2, AlertCircle, Sparkles,
  Search, RefreshCw, ArrowRight, UserCheck, ShieldCheck, GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StudentIdentityChip, FamilyIdentityChip } from '@/components/preone'

export default function ClassroomPlacementsPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [sessions, setSessions] = useState<{ id: string; name: string; isCurrent?: boolean }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [classrooms, setClassrooms] = useState<any[]>([])

  // Applications awaiting placement
  const [candidates, setCandidates] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  // Allocation Modal
  const [allocateModal, setAllocateModal] = useState<{
    open: boolean
    candidate: any | null
    classroomId: string
  }>({
    open: false,
    candidate: null,
    classroomId: '',
  })

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

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
          if (brRes.data.length > 1) {
            setSelectedBranchId('__ALL_BRANCHES__')
          } else {
            const main = brRes.data.find((b: any) => b.isMain) || brRes.data[0]
            setSelectedBranchId(main.id)
          }
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
        console.error('Failed to load placement masters:', e)
      }
    }
    loadMasters()
  }, [])

  // Load candidates needing classroom placement
  const loadPlacementData = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        ...(selectedSessionId ? { academicSessionId: selectedSessionId } : {}),
      })
      const clsParams = new URLSearchParams({
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      })
      const [appRes, clsRes] = await Promise.all([
        fetch(`/api/v1/applications?${qParams.toString()}`).then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`/api/v1/classrooms?${clsParams.toString()}`).then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      ])
      setBusy(false)
      if (appRes.success && appRes.data) {
        const waitingPlacement = appRes.data.filter(
          (a: any) => ['OFFER_ACCEPTED', 'APPROVED'].includes(a.status) && !a.studentId
        )
        setCandidates(waitingPlacement)
      }
      if (clsRes.success && clsRes.data) {
        setClassrooms(clsRes.data)
      }
    } catch {
      setBusy(false)
    }
  }, [selectedBranchId, selectedSessionId])

  useEffect(() => {
    loadPlacementData()
  }, [loadPlacementData])

  // Execute placement & enrollment
  const handleConfirmPlacement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocateModal.candidate?.id || !allocateModal.classroomId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/applications/${allocateModal.candidate.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: allocateModal.classroomId,
          academicYearId: selectedSessionId,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Classroom seat allocated! Student officially enrolled.', { type: 'success' })
        setAllocateModal({ open: false, candidate: null, classroomId: '' })
        loadPlacementData()
      } else {
        toast.show(res.error || 'Failed to place candidate', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error allocating classroom seat', { type: 'error' })
    }
  }

  return (
    <AdmissionsShell
      title="Classroom Placements"
      description="Seat distribution across classroom divisions, batch timings, educator ratios, and placement readiness"
      currentModuleKey="classroom-placements"
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
          onClick={loadPlacementData}
          disabled={busy}
          className="btn btn-ghost btn-sm h-8.5 w-8.5 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
          title="Refresh Placements"
        >
          <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="space-y-5">
        {/* ── Classroom Capacity & Vacancy Overview ── */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building size={16} className="text-primary" />
                <span>Classroom Sections & Division Capacities</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active seat availability per room in selected branch and session
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {classrooms.length} sections configured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classrooms.map((cls) => {
              const enrolled = cls._count?.students || 0
              const available = Math.max(0, cls.capacity - enrolled)
              const pct = Math.min(100, Math.round((enrolled / Math.max(1, cls.capacity)) * 100))
              const isFull = available === 0

              return (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs">{cls.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-primary/10 text-primary">
                      {cls.programType}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>Occupancy:</span>
                    <span className="font-bold text-foreground">
                      {enrolled} / {cls.capacity} seats
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="text-[10.5px] font-semibold text-right">
                    <span className={isFull ? 'text-amber-600' : 'text-emerald-600'}>
                      {isFull ? 'Section Full' : `${available} seats remaining`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Candidates Waiting for Classroom Placement ── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Candidates Ready for Placement ({candidates.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Approved candidates with accepted offers awaiting division & classroom assignment
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">App Number</th>
                  {selectedBranchId === '__ALL_BRANCHES__' && (
                    <th className="px-4 py-3">Campus</th>
                  )}
                  <th className="px-4 py-3">Child Name</th>
                  <th className="px-4 py-3">Parent Contact</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Offer Status</th>
                  <th className="px-4 py-3 text-right">Placement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {candidates.length > 0 ? (
                  candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {cand.applicationNumber}
                      </td>
                      {selectedBranchId === '__ALL_BRANCHES__' && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/80 text-[10px] font-semibold text-foreground border border-border/70">
                            {cand.branch?.name || cand.branchName || 'Branch'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <StudentIdentityChip
                          name={`${cand.childFirstName} ${cand.childLastName || ''}`}
                          subtext={cand.childGender}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <FamilyIdentityChip
                          name={cand.parentName}
                          phone={cand.parentPhone}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          {cand.programType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                          ✓ {cand.status === 'OFFER_ACCEPTED' ? 'Offer Accepted' : 'Approved'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const match = classrooms.find((c) => c.programType === cand.programType)
                            setAllocateModal({
                              open: true,
                              candidate: cand,
                              classroomId: match?.id || '',
                            })
                          }}
                          className="btn btn-primary btn-sm h-7.5 px-3 text-xs rounded-lg font-bold gap-1"
                        >
                          <Building size={12} />
                          <span>Allocate Seat</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        illustration="classroom"
                        eyebrow="Placements"
                        title="No candidates waiting for placement"
                        description="All approved applicants with accepted offers have already been allocated to classrooms."
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

      {/* ── MODAL: ALLOCATE CLASSROOM ── */}
      <Modal
        open={allocateModal.open}
        onClose={() => setAllocateModal({ open: false, candidate: null, classroomId: '' })}
        title="Allocate Classroom Section"
        subtitle={allocateModal.candidate ? `For ${allocateModal.candidate.childFirstName} (${allocateModal.candidate.programType})` : 'Allocate Seat'}
        icon={<Building size={20} />}
      >
        <form onSubmit={handleConfirmPlacement} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Select Classroom Section *</label>
            <select
              required
              value={allocateModal.classroomId}
              onChange={(e) => setAllocateModal((prev) => ({ ...prev, classroomId: e.target.value }))}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="">Select Section...</option>
              {classrooms
                .filter((c) => {
                  const matchProg = !allocateModal.candidate?.programType || c.programType === allocateModal.candidate.programType
                  const candBranch = allocateModal.candidate?.branchId || allocateModal.candidate?.branch?.id
                  const matchBranch = !candBranch || c.branchId === candBranch
                  return matchProg && matchBranch
                })
                .map((cls) => {
                  const enrolled = cls._count?.students || 0
                  const available = Math.max(0, cls.capacity - enrolled)
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.branch?.name ? `(${cls.branch.name})` : ''} - {available} available / {cls.capacity} capacity
                    </option>
                  )
                })}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setAllocateModal({ open: false, candidate: null, classroomId: '' })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !allocateModal.classroomId}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl"
            >
              {busy ? 'Allocating...' : 'Confirm Seat & Enroll'}
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
        onSuccess={loadPlacementData}
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
