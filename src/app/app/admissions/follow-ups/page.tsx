'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PhoneCall, Phone, Calendar, Clock, CheckCircle2, AlertCircle,
  MessageCircle, Plus, Search, Filter, RefreshCw, UserCheck, Eye,
  Building, ChevronRight, FileText, XCircle, Check
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState } from '@/components/preone'
import { invalidateAdmissionsCounts } from '@/lib/admissions/use-admissions-counts'

export default function FollowUpsPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [programs, setPrograms] = useState<any[]>([])

  // Queue filter: ALL_OPEN | DUE_TODAY | UPCOMING | OVERDUE | COMPLETED
  const [activeQueue, setActiveQueue] = useState<'ALL_OPEN' | 'DUE_TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'>('ALL_OPEN')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [staffOptions, setStaffOptions] = useState<{ id: string; fullName: string }[]>([])

  // Data states
  const [workspaceData, setWorkspaceData] = useState<{ counts: any; items: any[] } | null>(null)
  const [busy, setBusy] = useState(false)

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Follow-up quick action modal
  const [logModal, setLogModal] = useState<{ open: boolean; item: any | null }>({
    open: false,
    item: null,
  })
  const [followUpNote, setFollowUpNote] = useState('')
  const [followUpType, setFollowUpType] = useState('Phone Call')
  const [followUpOutcome, setFollowUpOutcome] = useState('CONNECTED_INTERESTED')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')

  // Mark lost modal
  const [lostModal, setLostModal] = useState<{ open: boolean; item: any | null }>({
    open: false,
    item: null,
  })
  const [lostReason, setLostReason] = useState('FEES_TOO_HIGH')
  const [lostNotes, setLostNotes] = useState('')

  // Load masters on mount
  useEffect(() => {
    async function loadMasters() {
      try {
        const [brRes, progRes, staffRes] = await Promise.all([
          fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/programs').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/users?userType=STAFF&limit=100').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
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
        if (progRes.success && progRes.data) {
          setPrograms(progRes.data)
        }
        if (staffRes.success && Array.isArray(staffRes.data)) {
          setStaffOptions(staffRes.data.map((u: any) => ({
            id: u.id,
            fullName: u.fullName || u.email,
          })))
        }
      } catch (e) {
        console.error('Failed to load branches and staff:', e)
      }
    }
    loadMasters()
  }, [])

  // Load Follow-up queue from backend
  const loadQueue = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        queue: activeQueue,
      })
      const res = await fetch(`/api/v1/visits?${qParams.toString()}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: null }))
      setBusy(false)
      if (res.success && res.data) {
        setWorkspaceData(res.data)
      }
    } catch (e) {
      setBusy(false)
      console.error('Failed to load follow-ups queue:', e)
    }
  }, [selectedBranchId, activeQueue])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // Submit follow-up interaction
  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logModal.item?.lead?.id && !logModal.item?.sourceId) {
      toast.show('No associated enquiry lead found', { type: 'error' })
      return
    }
    const leadId = logModal.item.lead?.id || logModal.item.sourceId
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: followUpType,
          note: followUpNote.trim(),
          dueAt: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
          outcome: followUpOutcome,
          lostReason: followUpOutcome === 'NOT_INTERESTED' ? lostReason : undefined,
          followUpId: logModal.item?.id,
        }),
      }).then((r) => r.json())

      setBusy(false)
      if (res.success) {
        toast.show('Follow-up activity recorded successfully', { type: 'success' })
        setLogModal({ open: false, item: null })
        setFollowUpNote('')
        setNextFollowUpDate('')
        invalidateAdmissionsCounts()
        loadQueue()
      } else {
        toast.show(res.error || 'Failed to save follow-up', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error while saving follow-up', { type: 'error' })
    }
  }

  // Explicitly convert a Qualified lead to an Admission Application
  const handleConvertToApp = async (item: any) => {
    const leadId = item.lead?.id || item.sourceId
    if (!leadId) {
      toast.show('No associated enquiry lead found', { type: 'error' })
      return
    }
    setBusy(true)
    try {
      const branchIdToSend = (selectedBranchId && selectedBranchId !== '__ALL_BRANCHES__')
        ? selectedBranchId
        : (item.lead?.branchId || item.branchId)

      const res = await fetch(`/api/v1/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branchIdToSend,
        }),
      }).then((r) => r.json())

      setBusy(false)
      if (res.success) {
        toast.show(
          `Application ${res.data?.applicationNumber || ''} created with zero data re-entry!`,
          { type: 'success' }
        )
        invalidateAdmissionsCounts()
        loadQueue()
      } else {
        toast.show(res.error?.message || 'Failed to convert enquiry', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Network error while converting lead', { type: 'error' })
    }
  }

  // Directly close lead as lost
  const handleMarkLost = async (e: React.FormEvent) => {
    e.preventDefault()
    const leadId = lostModal.item?.lead?.id || lostModal.item?.sourceId
    if (!leadId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lostReason,
          notes: lostNotes.trim(),
        }),
      }).then((r) => r.json())

      setBusy(false)
      if (res.success) {
        toast.show('Enquiry closed as Lost and removed from active queue', { type: 'success' })
        setLostModal({ open: false, item: null })
        invalidateAdmissionsCounts()
        loadQueue()
      } else {
        toast.show(res.error?.message || 'Failed to mark lead as lost', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Network error while marking lead as lost', { type: 'error' })
    }
  }

  // Filter items locally by search & program
  const filteredItems = useMemo(() => {
    if (!workspaceData?.items) return []
    // Filter down to non-SchoolVisit items (or phone outreach items)
    return workspaceData.items.filter((item) => {
      // Must not be a standalone campus tour if queue is purely follow-ups, but include recovery calls
      if (item.sourceType === 'SchoolVisit') return false
      
      const lead = item.lead
      if (filterProgram && lead?.interestedProgram !== filterProgram) return false
      if (filterStaff && item.assignedToId !== filterStaff) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const parentName = (lead?.parentName || item.title || '').toLowerCase()
        const childName = (lead?.childName || '').toLowerCase()
        const phone = (lead?.phone || '').toLowerCase()
        const leadNo = (lead?.leadNumber || '').toLowerCase()
        const staff = (item.assignedStaffName || '').toLowerCase()
        if (!parentName.includes(q) && !childName.includes(q) && !phone.includes(q) && !leadNo.includes(q) && !staff.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [workspaceData, filterProgram, filterStaff, searchQuery])

  const counts = workspaceData?.counts || {
    allOpen: 0,
    dueToday: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
  }

  return (
    <AdmissionsShell
      title="Follow-ups"
      description="Systematic parent outreach, phone consultations, WhatsApp notes, and communication cadence"
      currentModuleKey="follow-ups"
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
      onNewEnquiry={() => setEnquiryModalOpen(true)}
      onSharePublicForm={() => setShareModalOpen(true)}
      actions={
        <button
          type="button"
          onClick={loadQueue}
          disabled={busy}
          className="btn btn-ghost btn-sm h-8.5 w-8.5 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
          title="Refresh Follow-ups"
        >
          <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
        </button>
      }
    >
      <div className="space-y-4">
        {/* ── Sub-queue Segmented Navigation Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { key: 'ALL_OPEN', label: 'All Open Tasks', count: counts.allOpen ?? (counts.dueToday + (counts.upcoming || 0)), icon: PhoneCall, badgeVariant: 'primary' },
              { key: 'DUE_TODAY', label: 'Due Today', count: counts.dueToday, icon: Clock, badgeVariant: 'amber' },
              { key: 'UPCOMING', label: 'Upcoming / Scheduled', count: counts.upcoming || counts.upcomingVisits || 0, icon: Calendar, badgeVariant: 'indigo' },
              { key: 'OVERDUE', label: 'Overdue', count: counts.overdue, icon: AlertCircle, badgeVariant: 'rose' },
              { key: 'COMPLETED', label: 'Completed / History', count: counts.completed, icon: CheckCircle2, badgeVariant: 'emerald' },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeQueue === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveQueue(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick search & program filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            <div className="relative flex-1 sm:w-56 min-w-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search parent or child..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-8 pl-8 pr-3 text-xs w-full rounded-xl bg-background border border-border/70"
              />
            </div>
            {programs.length > 0 && (
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="input h-8 px-2.5 text-xs rounded-xl bg-background border border-border/70 max-w-[130px] max-w-full min-w-0"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {staffOptions.length > 0 && (
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="input h-8 px-2.5 text-xs rounded-xl bg-background border border-border/70 max-w-[140px] max-w-full min-w-0"
              >
                <option value="">All Counselors</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Follow-up Tasks Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const lead = item.lead
              const isResolved = ['RESOLVED', 'CLOSED'].includes(item.status)

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-border/80 bg-card shadow-card-rest flex flex-col justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="space-y-2.5">
                    {/* Top Identity Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-primary">
                          {lead?.leadNumber || '—'}
                        </span>
                        {lead?.status === 'QUALIFIED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            <span>Qualified (Green)</span>
                          </span>
                        )}
                        {lead?.status === 'CONTACTED' && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            In Follow-up
                          </span>
                        )}
                        {(selectedBranchId === '__ALL_BRANCHES__' || !selectedBranchId) && (item.branchName || lead?.branchName) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/80 text-[10px] font-semibold text-foreground border border-border/70">
                            <Building size={9} className="text-primary" />
                            <span>{item.branchName || lead?.branchName}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        {lead?.interestedProgram || 'Nursery'}
                      </span>
                    </div>

                    {/* Parent & Child info */}
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {lead?.parentName || item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Child: <span className="font-semibold text-foreground/80">{lead?.childName || 'Prospective pupil'}</span>
                      </p>
                      {lead?.phone && (
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {lead.phone}
                        </p>
                      )}
                    </div>

                    {/* Schedule info box */}
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Due Time:</span>
                        <span className="font-semibold text-foreground">
                          {item.dueAt ? fmtDate(item.dueAt) : 'Today'}
                        </span>
                      </div>
                      {item.assignedStaffName && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="font-semibold text-primary">
                            {item.assignedStaffName}
                          </span>
                        </div>
                      )}
                      {item.detail && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 pt-0.5 italic">
                          &ldquo;{item.detail}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Operational Action Footer */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {lead?.phone && (
                        <>
                          <a
                            href={`tel:${lead.phone}`}
                            className="btn btn-outline btn-sm h-7.5 px-2.5 text-xs rounded-lg gap-1"
                            title="Call Parent"
                          >
                            <Phone size={11} />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm h-7.5 px-2.5 text-xs rounded-lg gap-1"
                            title="WhatsApp"
                          >
                            <MessageCircle size={11} />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      )}
                    </div>

                    {!isResolved && (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {lead?.status === 'QUALIFIED' && (
                          <button
                            type="button"
                            onClick={() => handleConvertToApp(item)}
                            disabled={busy}
                            className="btn btn-sm h-7.5 px-2.5 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs"
                            title="Convert to Application with zero data re-entry"
                          >
                            <CheckCircle2 size={12} />
                            <span>Move to App</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setLogModal({ open: true, item })
                            setFollowUpNote('')
                            setFollowUpOutcome(lead?.status === 'QUALIFIED' ? 'CONNECTED_INTERESTED' : 'CONNECTED_INTERESTED')
                          }}
                          className="btn btn-primary btn-sm h-7.5 px-2.5 text-xs rounded-lg font-semibold"
                        >
                          Log Outcome
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLostModal({ open: true, item })
                            setLostReason('FEES_TOO_HIGH')
                            setLostNotes('')
                          }}
                          disabled={busy}
                          className="btn btn-ghost btn-sm h-7.5 px-2 text-xs rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Mark Enquiry as Lost"
                        >
                          Lost
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full py-12">
              <EmptyState
                illustration="calendar"
                eyebrow="Follow-up Queue"
                title={
                  activeQueue === 'ALL_OPEN'
                    ? 'No open follow-up tasks'
                    : activeQueue === 'DUE_TODAY'
                    ? 'No follow-up calls due today'
                    : activeQueue === 'UPCOMING'
                    ? 'No upcoming scheduled follow-ups'
                    : activeQueue === 'OVERDUE'
                    ? 'No overdue follow-up tasks'
                    : 'No completed follow-ups recorded yet'
                }
                description="Parent consultations, inquiry calls, and outreach follow-ups will appear here based on scheduled dates."
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: LOG FOLLOW-UP OUTCOME ── */}
      <Modal
        open={logModal.open}
        onClose={() => setLogModal({ open: false, item: null })}
        title="Record Follow-up Outcome"
        subtitle={logModal.item?.lead?.parentName ? `For ${logModal.item.lead.parentName} (${logModal.item.lead.leadNumber})` : 'Record outreach results'}
        icon={<PhoneCall size={20} />}
      >
        <form onSubmit={handleSubmitFollowUp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Outreach Channel *</label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="Phone Call">Phone Call</option>
              <option value="WhatsApp">WhatsApp Conversation</option>
              <option value="In-Person Discussion">In-Person Discussion</option>
              <option value="Email">Email Communication</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Interaction Outcome *</label>
            <select
              value={followUpOutcome}
              onChange={(e) => setFollowUpOutcome(e.target.value)}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="CONNECTED_INTERESTED">★ Positive / Qualified (Green) — Interested in Admission</option>
              <option value="CALLBACK_REQUESTED">Callback Requested — Needs follow-up outreach</option>
              <option value="NO_RESPONSE">No Response / Unreachable — Try again</option>
              <option value="NOT_INTERESTED">Not Interested / Lost — Parent declined</option>
              <option value="NURTURE">Nurture — Keep warm for future term</option>
            </select>
          </div>

          {followUpOutcome === 'NOT_INTERESTED' && (
            <div className="space-y-1 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs">
              <label className="font-semibold text-destructive">Reason for Not Proceeding *</label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input text-xs h-9 w-full rounded-xl bg-background border border-border"
              >
                <option value="FEES_TOO_HIGH">Fees Too High / Budget Constraint</option>
                <option value="DISTANCE_LOCATION">Distance / Location Inconvenient</option>
                <option value="TIMINGS_INCONVENIENT">Timings / Session Schedule Mismatch</option>
                <option value="CHOSE_ANOTHER_SCHOOL">Chose Another Preschool / Daycare</option>
                <option value="FACILITIES_EXPECTATIONS">Facilities or Curriculum Expectations</option>
                <option value="RELOCATING">Family Relocating</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Discussion Notes / Parent Remarks *</label>
            <textarea
              required
              rows={3}
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="e.g. Discussed fee structure, parent interested in morning batch, planned visit next Tuesday..."
              className="input text-xs py-2 w-full rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Next Scheduled Follow-up (Optional)</label>
            <input
              type="datetime-local"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="input text-xs h-9 w-full rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setLogModal({ open: false, item: null })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !followUpNote.trim()}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl"
            >
              {busy ? 'Saving...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: MARK AS LOST DIRECTLY ── */}
      <Modal
        open={lostModal.open}
        onClose={() => setLostModal({ open: false, item: null })}
        title="Mark Enquiry as Lost"
        subtitle={lostModal.item?.lead?.parentName ? `For ${lostModal.item.lead.parentName} (${lostModal.item.lead.leadNumber})` : 'Close enquiry prospect'}
        icon={<XCircle size={20} className="text-destructive" />}
      >
        <form onSubmit={handleMarkLost} className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
            Marking this enquiry as <strong>LOST</strong> will close active follow-up tasks and preserve the record in Admissions Lost Reports for audit and analytics.
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Lost Reason *</label>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="input text-xs h-9 w-full rounded-xl"
            >
              <option value="FEES_TOO_HIGH">Fees Too High / Budget Constraint</option>
              <option value="DISTANCE_LOCATION">Distance / Location Inconvenient</option>
              <option value="TIMINGS_INCONVENIENT">Timings / Session Schedule Mismatch</option>
              <option value="CHOSE_ANOTHER_SCHOOL">Chose Another Preschool / Daycare</option>
              <option value="FACILITIES_EXPECTATIONS">Facilities or Curriculum Expectations</option>
              <option value="RELOCATING">Family Relocating</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Detailed Remarks / Feedback</label>
            <textarea
              rows={3}
              value={lostNotes}
              onChange={(e) => setLostNotes(e.target.value)}
              placeholder="Provide context or parent feedback explaining why they declined..."
              className="input text-xs py-2 w-full rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setLostModal({ open: false, item: null })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-error btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? 'Saving...' : 'Confirm Mark Lost'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Minimal enquiry & share public form modals */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
        onSuccess={() => {
          invalidateAdmissionsCounts()
          loadQueue()
        }}
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
