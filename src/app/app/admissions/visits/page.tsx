'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CalendarCheck2, Calendar, Clock, MapPin, CheckCircle2, AlertCircle,
  Plus, Search, RefreshCw, UserCheck, Eye, ChevronRight, Phone,
  MessageCircle, XCircle, Award
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState } from '@/components/preone'

export default function CampusVisitsPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [programs, setPrograms] = useState<any[]>([])

  // Queue filter: UPCOMING | COMPLETED
  const [activeQueue, setActiveQueue] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProgram, setFilterProgram] = useState('')

  // Data states
  const [workspaceData, setWorkspaceData] = useState<{ counts: any; items: any[] } | null>(null)
  const [busy, setBusy] = useState(false)

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Visit Outcome Modal
  const [outcomeModal, setOutcomeModal] = useState<{ open: boolean; item: any | null }>({
    open: false,
    item: null,
  })
  const [selectedOutcomeType, setSelectedOutcomeType] = useState<
    'READY_TO_PROCEED' | 'CONSIDERING' | 'FUTURE_TERM' | 'NOT_PROCEEDING'
  >('READY_TO_PROCEED')
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')
  const [lostReason, setLostReason] = useState('CHOSE_ANOTHER_SCHOOL')

  // Child interaction preschool cues
  const [comfort, setComfort] = useState<'COMFORTABLE' | 'TOOK_SOME_TIME' | 'NEEDED_SUPPORT'>('COMFORTABLE')
  const [activityResponse, setActivityResponse] = useState<'INTERESTED' | 'PARTICIPATED_WITH_SUPPORT' | 'OBSERVED_ONLY'>('INTERESTED')

  // Load masters on mount
  useEffect(() => {
    async function loadMasters() {
      try {
        const [brRes, progRes] = await Promise.all([
          fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
          fetch('/api/v1/programs').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
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
      } catch (e) {
        console.error('Failed to load branches:', e)
      }
    }
    loadMasters()
  }, [])

  // Load Visits queue
  const loadVisits = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        queue: activeQueue === 'UPCOMING' ? 'UPCOMING' : 'COMPLETED',
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
      console.error('Failed to load visits:', e)
    }
  }, [selectedBranchId, activeQueue])

  useEffect(() => {
    loadVisits()
  }, [loadVisits])

  // Mark No-Show
  const handleMarkNoShow = async (visitId: string) => {
    if (!confirm('Mark this scheduled visit as NO-SHOW? A recovery follow-up call will be generated for tomorrow.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/visits/${visitId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Parent did not attend scheduled campus tour' }),
      }).then((r) => r.json())
      setBusy(false)
      if (res.success) {
        toast.show('Visit marked as NO-SHOW. Recovery task scheduled.', { type: 'info' })
        loadVisits()
      } else {
        toast.show(res.error || 'Failed to update visit status', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error', { type: 'error' })
    }
  }

  // Submit Visit Outcome
  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!outcomeModal.item) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/visits/${outcomeModal.item.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: selectedOutcomeType,
          staffNotes: outcomeNotes,
          childInteraction: {
            comfort,
            activityResponse,
          },
          nextFollowUpAt: selectedOutcomeType === 'CONSIDERING' ? nextFollowUpDate : undefined,
          lostReason: selectedOutcomeType === 'NOT_PROCEEDING' ? lostReason : undefined,
        }),
      }).then((r) => r.json())

      setBusy(false)
      if (res.success) {
        toast.show('Visit completed and outcome recorded', { type: 'success' })
        setOutcomeModal({ open: false, item: null })
        setOutcomeNotes('')
        setNextFollowUpDate('')

        // If outcome is ready to proceed, direct user towards application
        if (selectedOutcomeType === 'READY_TO_PROCEED' && res.data?.applicationId) {
          window.location.href = `/app/admissions/applications`
        } else {
          loadVisits()
        }
      } else {
        toast.show(res.error || 'Failed to complete visit', { type: 'error' })
      }
    } catch {
      setBusy(false)
      toast.show('Server error completing visit', { type: 'error' })
    }
  }

  // Filter items locally by search & program
  const filteredVisits = useMemo(() => {
    if (!workspaceData?.items) return []
    return workspaceData.items.filter((item) => {
      // Must be a campus visit record
      if (item.sourceType !== 'SchoolVisit') return false

      const lead = item.lead
      if (filterProgram && lead?.interestedProgram !== filterProgram) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const parentName = (lead?.parentName || item.title || '').toLowerCase()
        const childName = (lead?.childName || '').toLowerCase()
        const phone = (lead?.phone || '').toLowerCase()
        if (!parentName.includes(q) && !childName.includes(q) && !phone.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [workspaceData, filterProgram, searchQuery])

  const counts = workspaceData?.counts || {
    upcomingVisits: 0,
    completed: 0,
  }

  return (
    <AdmissionsShell
      title="Campus Visits"
      description="Scheduled school tours, facility walkthroughs, classroom trials, and non-clinical child observations"
      currentModuleKey="visits"
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
      onNewEnquiry={() => setEnquiryModalOpen(true)}
      onSharePublicForm={() => setShareModalOpen(true)}
      actions={
        <button
          type="button"
          onClick={loadVisits}
          disabled={busy}
          className="btn btn-ghost btn-sm h-8.5 w-8.5 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
          title="Refresh Visits"
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
              { key: 'UPCOMING', label: 'Upcoming Tours', count: counts.upcomingVisits, icon: CalendarCheck2 },
              { key: 'COMPLETED', label: 'Completed Visits', count: counts.completed, icon: CheckCircle2 },
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

          {/* Search & Program Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search visitor family..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input h-8 pl-8 pr-3 text-xs w-full rounded-xl bg-background border border-border/70"
              />
            </div>
            {programs.length > 0 && (
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="input h-8 px-2.5 text-xs rounded-xl bg-background border border-border/70 max-w-[130px]"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Visits Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.length > 0 ? (
            filteredVisits.map((item) => {
              const lead = item.lead
              const detail = item.parsedDetail || {}
              const isResolved = ['RESOLVED', 'CLOSED'].includes(item.status)

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-primary">
                          {lead?.leadNumber || 'TOUR-SLOT'}
                        </span>
                        {(selectedBranchId === '__ALL_BRANCHES__' || !selectedBranchId) && (item.branchName || lead?.branchName) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/80 text-[10px] font-semibold text-foreground border border-border/70">
                            <span>{item.branchName || lead?.branchName}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                        {lead?.interestedProgram || 'Preschool Tour'}
                      </span>
                    </div>

                    {/* Visitors */}
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

                    {/* Tour Date & Highlights Box */}
                    <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Scheduled Time:</span>
                        <span className="font-semibold text-foreground">
                          {item.dueAt ? fmtDate(item.dueAt) : 'Upcoming'}
                        </span>
                      </div>
                      {detail.tourFocus && (
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Focus:</span> {detail.tourFocus}
                        </div>
                      )}
                      {detail.attendees && (
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Visitors:</span> {detail.attendees} ({detail.visitorCount || 2})
                        </div>
                      )}
                    </div>

                    {/* Completed Outcome details */}
                    {isResolved && (
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Outcome:</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            detail.outcome === 'READY_TO_PROCEED'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : detail.visitStatus === 'NO_SHOW'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-amber-500/10 text-amber-700'
                          }`}>
                            {detail.outcome || detail.visitStatus || 'COMPLETED'}
                          </span>
                        </div>
                        {detail.staffNotes && (
                          <p className="text-[11px] text-muted-foreground italic line-clamp-2 pt-0.5">
                            &ldquo;{detail.staffNotes}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Operational Footer */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {lead?.phone && (
                        <>
                          <a
                            href={`tel:${lead.phone}`}
                            className="btn btn-outline btn-sm h-7.5 px-2.5 text-xs rounded-lg gap-1"
                            title="Call Family"
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
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMarkNoShow(item.id)}
                          className="btn btn-ghost btn-sm h-7.5 px-2 text-xs rounded-lg text-destructive hover:bg-destructive/10"
                          title="Mark No-Show"
                        >
                          No-Show
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOutcomeModal({ open: true, item })
                            setSelectedOutcomeType('READY_TO_PROCEED')
                            setOutcomeNotes('')
                          }}
                          className="btn btn-primary btn-sm h-7.5 px-3 text-xs rounded-lg font-semibold gap-1"
                        >
                          <Award size={12} />
                          <span>Record Outcome</span>
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
                eyebrow="Campus Tours"
                title={
                  activeQueue === 'UPCOMING'
                    ? 'No upcoming campus visits scheduled'
                    : 'No completed visits on record'
                }
                description="Guided campus tours booked with prospective families and walk-in trials will appear in this timeline."
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: RECORD VISIT OUTCOME ── */}
      <Modal
        open={outcomeModal.open}
        onClose={() => setOutcomeModal({ open: false, item: null })}
        title="Record Campus Visit Outcome"
        subtitle={outcomeModal.item?.lead?.parentName ? `Walkthrough outcome for ${outcomeModal.item.lead.parentName}` : 'Record tour results'}
        icon={<Award size={20} />}
      >
        <form onSubmit={handleSaveOutcome} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Family Decision / Outcome *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'READY_TO_PROCEED', title: 'Ready to Proceed', desc: 'Family wants to take admission now', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' },
                { key: 'CONSIDERING', title: 'Considering', desc: 'Evaluating options, schedule follow-up', color: 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300' },
                { key: 'FUTURE_TERM', title: 'Future Term', desc: 'Postponed to next term or session', color: 'border-blue-500 bg-blue-500/10 text-blue-800 dark:text-blue-300' },
                { key: 'NOT_PROCEEDING', title: 'Not Proceeding', desc: 'Chose another school or dropped off', color: 'border-destructive bg-destructive/10 text-destructive' },
              ].map((opt) => (
                <div
                  key={opt.key}
                  onClick={() => setSelectedOutcomeType(opt.key as any)}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedOutcomeType === opt.key ? opt.color : 'border-border/70 hover:border-border'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Child Preschool Observation Cues */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Preschool Observation Cues
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Comfort in Environment</label>
                <select
                  value={comfort}
                  onChange={(e) => setComfort(e.target.value as any)}
                  className="input text-xs h-8 w-full rounded-lg"
                >
                  <option value="COMFORTABLE">Comfortable / Exploring</option>
                  <option value="TOOK_SOME_TIME">Took Some Time to Settle</option>
                  <option value="NEEDED_SUPPORT">Needed Parent Support</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Activity Response</label>
                <select
                  value={activityResponse}
                  onChange={(e) => setActivityResponse(e.target.value as any)}
                  className="input text-xs h-8 w-full rounded-lg"
                >
                  <option value="INTERESTED">Engaged & Curious</option>
                  <option value="PARTICIPATED_WITH_SUPPORT">Participated with Educator</option>
                  <option value="OBSERVED_ONLY">Observed from Distance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conditional follow-up date */}
          {selectedOutcomeType === 'CONSIDERING' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Next Follow-up Due Date *</label>
              <input
                type="datetime-local"
                required
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="input text-xs h-9 w-full rounded-xl"
              />
            </div>
          )}

          {/* Conditional drop-off reason */}
          {selectedOutcomeType === 'NOT_PROCEEDING' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Drop-off Reason *</label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input text-xs h-9 w-full rounded-xl"
              >
                <option value="CHOSE_ANOTHER_SCHOOL">Chose another preschool</option>
                <option value="FEES">Fees out of budget</option>
                <option value="LOCATION">Distance / Transport issue</option>
                <option value="TIMING">School timing mismatch</option>
                <option value="OTHER">Other specific factor</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Educator / Counselor Notes</label>
            <textarea
              rows={2}
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="Parent reactions, questions asked, batch preferences..."
              className="input text-xs py-2 w-full rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8.5 px-3 text-xs rounded-xl"
              onClick={() => setOutcomeModal({ open: false, item: null })}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm h-8.5 px-4 text-xs font-semibold rounded-xl"
            >
              {busy ? 'Saving...' : selectedOutcomeType === 'READY_TO_PROCEED' ? 'Save & Start Application →' : 'Save Outcome'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modals */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
        onSuccess={loadVisits}
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
