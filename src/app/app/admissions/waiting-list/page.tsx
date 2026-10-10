'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Hourglass, Users, Sparkles, Clock, CheckCircle2, AlertCircle,
  Plus, Search, RefreshCw, Eye, Award, ArrowUpCircle, X, ChevronRight,
  Send, ThumbsUp, UserX
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StatusPill, StudentIdentityChip, FamilyIdentityChip } from '@/components/preone'

export default function WaitingListPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [sessions, setSessions] = useState<{ id: string; name: string; isCurrent?: boolean }[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [classrooms, setClassrooms] = useState<any[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'NORMAL' | 'HIGH'>('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [programFilter, setProgramFilter] = useState('')

  // Data states
  const [entries, setEntries] = useState<any[] | null>(null)
  const [capacitySummaries, setCapacitySummaries] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  // Modals & Inspector
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Inspector Drawer
  const [inspector, setInspector] = useState<{
    open: boolean
    entry: any | null
    loading: boolean
  }>({
    open: false,
    entry: null,
    loading: false,
  })

  // Action Modals
  const [offerModal, setOfferModal] = useState<{ open: boolean; entry: any | null; validityDays: number }>({
    open: false,
    entry: null,
    validityDays: 7,
  })

  const [responseModal, setResponseModal] = useState<{
    open: boolean
    entry: any | null
    response: 'ACCEPTED' | 'DECLINED'
    notes: string
  }>({
    open: false,
    entry: null,
    response: 'ACCEPTED',
    notes: '',
  })

  const [completeModal, setCompleteModal] = useState<{
    open: boolean
    entry: any | null
    classroomId: string
  }>({
    open: false,
    entry: null,
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
        console.error('Failed to load waitlist masters:', e)
      }
    }
    loadMasters()
  }, [])

  // Load waitlist entries & capacities
  const loadWaitlist = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        ...(selectedSessionId ? { academicSessionId: selectedSessionId } : {}),
        ...(programFilter ? { program: programFilter } : {}),
        ...(priorityFilter !== 'ALL' ? { priority: priorityFilter } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
      })
      const res = await fetch(`/api/v1/admissions/waitlist?${qParams.toString()}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] }))
      setBusy(false)
      if (res.success && res.data) {
        setEntries(res.data)
        if (res.meta?.capacitySummaries) {
          setCapacitySummaries(res.meta.capacitySummaries)
        }
      }
    } catch {
      setBusy(false)
    }
  }, [selectedBranchId, selectedSessionId, programFilter, priorityFilter, statusFilter, searchQuery])

  useEffect(() => {
    loadWaitlist()
  }, [loadWaitlist])

  // Mark Seat Available
  const handleMarkSeatAvailable = async (entry: any) => {
    if (!confirm(`Notify family of seat availability for ${entry.childFirstName}? (Notification != Admission Approval)`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/admissions/waitlist/${entry.id}/seat-available`, {
        method: 'POST',
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Parent notified of seat opportunity', { type: 'success' })
        loadWaitlist()
      } else {
        toast.show(res.error || 'Failed to update seat status', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error', { type: 'error' })
    }
  }

  // Issue Offer
  const handleIssueOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerModal.entry) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/admissions/waitlist/${offerModal.entry.id}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validDays: offerModal.validityDays,
          branchId: selectedBranchId,
          academicYearId: selectedSessionId,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Admission Offer Issued from Waiting List', { type: 'success' })
        setOfferModal({ open: false, entry: null, validityDays: 7 })
        loadWaitlist()
      } else {
        toast.show(res.error || 'Failed to issue offer', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error issuing offer', { type: 'error' })
    }
  }

  // Record Parent Response
  const handleSaveParentResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseModal.entry) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/admissions/waitlist/${responseModal.entry.id}/parent-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: responseModal.response,
          notes: responseModal.notes,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show(`Parent response recorded: ${responseModal.response}`, { type: 'success' })
        setResponseModal({ open: false, entry: null, response: 'ACCEPTED', notes: '' })
        loadWaitlist()
      } else {
        toast.show(res.error || 'Failed to save response', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error', { type: 'error' })
    }
  }

  // Complete Unified Admission
  const handleCompleteAdmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completeModal.entry || !completeModal.classroomId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/admissions/waitlist/${completeModal.entry.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: completeModal.classroomId,
          academicYearId: selectedSessionId,
        }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Admission Confirmed! Candidate enrolled from waiting list', { type: 'success' })
        setCompleteModal({ open: false, entry: null, classroomId: '' })
        loadWaitlist()
      } else {
        toast.show(res.error || 'Failed to enroll candidate', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error', { type: 'error' })
    }
  }

  return (
    <AdmissionsShell
      title="Waiting List"
      description="Deterministic FIFO queue management, high-priority sibling quotas, live seat vacancies, and waitlist offers"
      currentModuleKey="waiting-list"
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
          onClick={loadWaitlist}
          disabled={busy}
          className="btn btn-ghost btn-sm h-8.5 w-8.5 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
          title="Refresh Queue"
        >
          <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="space-y-4">
        {/* ── Live Program Capacity Strip ── */}
        {capacitySummaries.length > 0 && (
          <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users size={14} className="text-primary" />
                <span>Real-Time Program Capacity Engine</span>
              </span>
              <span className="text-[11px] text-muted-foreground">Click program to filter</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {capacitySummaries.map((cap) => {
                const isSelected = programFilter === cap.programType
                const isFull = cap.available === 0
                return (
                  <div
                    key={cap.programType}
                    onClick={() => setProgramFilter(isSelected ? '' : cap.programType)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border/70 bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{cap.programType}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isFull ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'
                      }`}>
                        {isFull ? 'Full' : `${cap.available} free`}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between text-[11px] text-muted-foreground">
                      <span>Occ: {cap.occupied}/{cap.capacity}</span>
                      <span className="font-mono font-bold text-primary">{cap.activeWaitlistCount} waiting</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Filter & Search Command Strip ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-8.5 pl-8 pr-3 text-xs w-full rounded-xl bg-background border border-border/70"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="input h-8.5 px-3 text-xs rounded-xl bg-background border border-border/70"
            >
              <option value="ALL">All Priorities</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority (Quotas)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input h-8.5 px-3 text-xs rounded-xl bg-background border border-border/70"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">In Queue (Active)</option>
              <option value="SEAT_AVAILABLE">Seat Available</option>
              <option value="OFFER_SENT">Offer Sent</option>
              <option value="PARENT_ACCEPTED">Parent Accepted</option>
              <option value="CONVERTED">Enrolled</option>
            </select>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {entries?.length || 0} waitlisted candidates
          </div>
        </div>

        {/* ── Waiting List Table ── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Rank #</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Child Name</th>
                  <th className="px-4 py-3">Parent / Contact</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Waiting Since</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {entries && entries.length > 0 ? (
                  entries.map((entry) => {
                    const isHigh = entry.priority === 'HIGH'
                    return (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center font-black px-2 py-0.5 rounded-lg text-xs ${
                            isHigh ? 'bg-purple-600 text-white shadow-xs' : 'bg-primary/10 text-primary font-bold'
                          }`}>
                            #{entry.queuePosition < 10 ? `0${entry.queuePosition}` : entry.queuePosition}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isHigh ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              ★ HIGH
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Normal</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StudentIdentityChip
                            name={`${entry.childFirstName} ${entry.childLastName || ''}`}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <FamilyIdentityChip
                            name={entry.parentName}
                            phone={entry.parentPhone}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                            {entry.programType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {fmtDate(entry.waitingSince || entry.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={entry.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {entry.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleMarkSeatAvailable(entry)}
                                className="btn btn-primary btn-sm h-7 px-2 text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold"
                              >
                                Seat Available
                              </button>
                            )}

                            {entry.status === 'SEAT_AVAILABLE' && (
                              <button
                                type="button"
                                onClick={() => setOfferModal({ open: true, entry, validityDays: 7 })}
                                className="btn btn-primary btn-sm h-7 px-2 text-[11px] rounded-lg font-bold"
                              >
                                Create Offer
                              </button>
                            )}

                            {entry.status === 'OFFER_SENT' && (
                              <button
                                type="button"
                                onClick={() => setResponseModal({ open: true, entry, response: 'ACCEPTED', notes: '' })}
                                className="btn btn-outline btn-sm h-7 px-2 text-[11px] rounded-lg font-bold text-purple-600"
                              >
                                Parent Response
                              </button>
                            )}

                            {entry.status === 'PARENT_ACCEPTED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const matchingClass = classrooms.find((c) => c.programType === entry.programType)
                                  setCompleteModal({
                                    open: true,
                                    entry,
                                    classroomId: matchingClass?.id || '',
                                  })
                                }}
                                className="btn btn-primary btn-sm h-7 px-2.5 text-[11px] rounded-lg font-bold bg-teal-600 hover:bg-teal-700"
                              >
                                Enroll Student
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12">
                      <EmptyState
                        illustration="waitinglist"
                        eyebrow="Waiting List"
                        title="Waiting list is empty"
                        description="There are currently no candidates in the waiting queue for this branch and academic session."
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

      {/* ── MODAL: ISSUE WAITLIST OFFER ── */}
      <Modal
        open={offerModal.open}
        onClose={() => setOfferModal({ open: false, entry: null, validityDays: 7 })}
        title="Issue Admission Offer"
        subtitle={offerModal.entry ? `For candidate ${offerModal.entry.childFirstName}` : 'Offer Letter'}
        icon={<Send size={20} />}
      >
        <form onSubmit={handleIssueOffer} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Offer Validity (Days) *</label>
            <input
              type="number"
              min={1}
              max={30}
              required
              value={offerModal.validityDays}
              onChange={(e) => setOfferModal((prev) => ({ ...prev, validityDays: parseInt(e.target.value, 10) }))}
              className="input text-xs h-9 w-full rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setOfferModal({ open: false, entry: null, validityDays: 7 })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl"
            >
              {busy ? 'Issuing...' : 'Issue Offer Letter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: PARENT RESPONSE ── */}
      <Modal
        open={responseModal.open}
        onClose={() => setResponseModal({ open: false, entry: null, response: 'ACCEPTED', notes: '' })}
        title="Record Parent Response"
        subtitle={responseModal.entry ? `For candidate ${responseModal.entry.childFirstName}` : 'Response'}
        icon={<ThumbsUp size={20} />}
      >
        <form onSubmit={handleSaveParentResponse} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Parent Decision *</label>
            <select
              value={responseModal.response}
              onChange={(e) => setResponseModal((prev) => ({ ...prev, response: e.target.value as any }))}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="ACCEPTED">ACCEPTED — Parent accepted offer and seat</option>
              <option value="DECLINED">DECLINED — Parent opted out of seat</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Parent Remarks</label>
            <textarea
              rows={2}
              value={responseModal.notes}
              onChange={(e) => setResponseModal((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Confirmed on phone, fees will be submitted..."
              className="input text-xs py-2 w-full rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setResponseModal({ open: false, entry: null, response: 'ACCEPTED', notes: '' })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl"
            >
              Save Response
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: COMPLETE WAITLIST ADMISSION ── */}
      <Modal
        open={completeModal.open}
        onClose={() => setCompleteModal({ open: false, entry: null, classroomId: '' })}
        title="Complete Admission from Waiting List"
        subtitle={completeModal.entry ? `Enroll ${completeModal.entry.childFirstName}` : 'Class allocation'}
        icon={<Award size={20} />}
      >
        <form onSubmit={handleCompleteAdmission} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Classroom Section Allocation *</label>
            <select
              required
              value={completeModal.classroomId}
              onChange={(e) => setCompleteModal((prev) => ({ ...prev, classroomId: e.target.value }))}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="">Select Classroom Section...</option>
              {classrooms
                .filter((c) => !completeModal.entry?.programType || c.programType === completeModal.entry.programType)
                .map((cls) => {
                  const enrolled = cls._count?.students || 0
                  const available = Math.max(0, cls.capacity - enrolled)
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({available} available / {cls.capacity} capacity)
                    </option>
                  )
                })}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setCompleteModal({ open: false, entry: null, classroomId: '' })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !completeModal.classroomId}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              Confirm Enrollment
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
        onSuccess={loadWaitlist}
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
