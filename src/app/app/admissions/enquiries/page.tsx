'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users, Plus, Download, Search, X, Filter, Phone, Calendar,
  ClipboardList, CheckCircle2, AlertTriangle, ArrowRight, Check,
  RefreshCw, Building, Eye, Clock, MessageCircle, FileText
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState } from '@/components/preone'

export default function EnquiriesPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [programs, setPrograms] = useState<any[]>([])

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSource, setFilterSource] = useState('')

  // Data states
  const [enquiries, setEnquiries] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'overview' | 'timeline'>('overview')
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])

  // Follow-up quick action modal
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; enquiry: any | null }>({
    open: false,
    enquiry: null,
  })
  const [followUpNote, setFollowUpNote] = useState('')
  const [followUpType, setFollowUpType] = useState('Phone Call')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')

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
          const main = brRes.data.find((b: any) => b.isMain) || brRes.data[0]
          setSelectedBranchId(main.id)
        }
        if (progRes.success && progRes.data) {
          setPrograms(progRes.data)
        }
      } catch (e) {
        console.error('Failed to load branches & programs:', e)
      }
    }
    loadMasters()
  }, [])

  // Load enquiries
  const loadEnquiries = useCallback(async () => {
    if (!selectedBranchId) return
    setBusy(true)
    try {
      const qParams = new URLSearchParams({
        branchId: selectedBranchId,
        ...(filterProgram ? { program: filterProgram } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterSource ? { source: filterSource } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
      })
      const res = await fetch(`/api/v1/leads?${qParams.toString()}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] }))
      setBusy(false)
      if (res.success) {
        setEnquiries(res.data)
      }
    } catch {
      setBusy(false)
    }
  }, [selectedBranchId, filterProgram, filterStatus, filterSource, searchQuery])

  useEffect(() => {
    loadEnquiries()
  }, [loadEnquiries])

  // Open Lead Dossier Drawer
  const openDossier = async (enquiry: any) => {
    setSelectedEnquiry(enquiry)
    setDrawerOpen(true)
    setDrawerTab('overview')
    try {
      const res = await fetch(`/api/v1/leads/${enquiry.id}/activity`).then((r) => r.json())
      if (res.success) {
        setTimelineEvents(res.data || [])
      }
    } catch {
      setTimelineEvents([])
    }
  }

  // Handle Log Follow-up
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followUpModal.enquiry || !followUpNote.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/leads/${followUpModal.enquiry.id}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: followUpType,
          note: followUpNote.trim(),
          dueAt: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
        }),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Follow-up Logged! ✓', 'Next reminder updated on enquiry.')
        setFollowUpModal({ open: false, enquiry: null })
        setFollowUpNote('')
        setNextFollowUpDate('')
        loadEnquiries()
        if (selectedEnquiry?.id === followUpModal.enquiry.id) {
          openDossier(followUpModal.enquiry)
        }
      } else {
        toast.error('Failed to log follow-up', json.error?.message)
      }
    } catch {
      setBusy(false)
      toast.error('Network error')
    }
  }

  // Handle Start Application
  const handleStartApplication = async (enquiryId: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/leads/${enquiryId}/start-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success('Application Dossier Initialized! 📋', 'Lead data seamlessly converted without re-entry.')
        loadEnquiries()
      } else {
        toast.error('Could not start application', json.error?.message)
      }
    } catch {
      setBusy(false)
      toast.error('Failed to start application')
    }
  }

  return (
    <AdmissionsShell
      title="Enquiries"
      description="Manage prospective family enquiries, walk-ins, and follow-ups"
      currentModuleKey="enquiries"
      branches={branches}
      selectedBranchId={selectedBranchId}
      onBranchChange={setSelectedBranchId}
      onNewEnquiry={() => setEnquiryModalOpen(true)}
      onSharePublicForm={() => setShareModalOpen(true)}
      moduleCounts={{
        enquiries: enquiries?.length || 0,
      }}
    >
      <div className="space-y-4">
        {/* ── Search & Filter Controls ── */}
        <div className="p-3 sm:p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input with generous left padding so text never overlaps icon */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                className="input text-xs pl-9.5 pr-8 h-9 rounded-xl bg-background border border-border/80 w-full focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/80"
                placeholder="Search by parent name, phone, child, or reference ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Program Filter */}
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-auto max-w-[150px] font-medium"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.programType || p.code}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-auto max-w-[160px] font-medium"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New (Uncontacted)</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Campus Tour Scheduled</option>
              <option value="APPLICATION_STARTED">Application Started</option>
              <option value="CONVERTED">Enrolled / Admitted</option>
              <option value="LOST">Closed / Lost</option>
            </select>

            {/* Source Filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-auto max-w-[140px] font-medium"
            >
              <option value="">All Sources</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="PHONE">Phone Call</option>
              <option value="WEBSITE">Website Form</option>
              <option value="REFERRAL">Referral</option>
              <option value="GOOGLE_ADS">Google Ads</option>
              <option value="FACEBOOK">Social Media</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(searchQuery || filterProgram || filterStatus || filterSource) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setFilterProgram('')
                  setFilterStatus('')
                  setFilterSource('')
                }}
                className="btn btn-ghost btn-sm h-9 px-3 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={loadEnquiries}
              disabled={busy}
              className="btn btn-ghost btn-sm h-9 w-9 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
              title="Refresh"
            >
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Enquiries Table ── */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                All Enquiries
              </span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                {enquiries?.length || 0}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Updated</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Parent / Guardian</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Child</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Next Reminder</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {enquiries && enquiries.length > 0 ? (
                  enquiries.map((e) => {
                    const isOverdue = e.nextFollowUpAt && new Date(e.nextFollowUpAt) < new Date()

                    return (
                      <tr
                        key={e.id}
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => openDossier(e)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {e.leadNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          {e.parentName}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {e.phone}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {e.childName || <span className="text-muted-foreground italic">Not specified</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge b-purple text-[10px]">
                            {e.interestedProgram || 'Nursery'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge b-gray text-[10px]">
                            {e.source}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                          {fmtDate(e.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                          {e.nextFollowUpAt ? (
                            <span className={isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                              {fmtDate(e.nextFollowUpAt)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70 italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`badge text-[10px] ${
                            e.status === 'NEW' ? 'b-blue' :
                            e.status === 'CONTACTED' ? 'b-amber' :
                            e.status === 'QUALIFIED' ? 'b-purple' :
                            e.status === 'APPLICATION_STARTED' ? 'b-success' :
                            e.status === 'CONVERTED' ? 'b-success' :
                            e.status === 'LOST' ? 'b-danger' :
                            'b-gray'
                          }`}>
                            {e.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(ev) => ev.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setFollowUpModal({ open: true, enquiry: e })}
                              className="btn btn-ghost btn-sm h-7.5 w-7.5 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                              title="Log Follow-up Call"
                            >
                              <Phone size={13} />
                            </button>
                            {e.status !== 'APPLICATION_STARTED' && e.status !== 'CONVERTED' && e.status !== 'LOST' && (
                              <button
                                type="button"
                                onClick={() => handleStartApplication(e.id)}
                                className="btn btn-primary btn-sm h-7.5 px-2.5 text-[11px] font-semibold rounded-lg shadow-xs"
                              >
                                Start Form
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8">
                      <EmptyState
                        illustration="enquiries"
                        eyebrow="Admissions"
                        title={searchQuery ? `No enquiries match "${searchQuery}"` : 'No enquiries found'}
                        description={
                          searchQuery
                            ? 'Try refining your search terms or clearing your filters.'
                            : 'Capture parent interest and prospective family walk-ins to start your admissions pipeline.'
                        }
                        action={{
                          label: '+ Register New Enquiry',
                          onClick: () => setEnquiryModalOpen(true),
                        }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: Streamlined New Enquiry ── */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
        onSuccess={() => {
          loadEnquiries()
        }}
      />

      {/* ── MODAL: Share Public Form ── */}
      <SharePublicFormModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        branchId={selectedBranchId}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name}
      />

      {/* ── MODAL: Fast Follow-up Action ── */}
      <Modal
        open={followUpModal.open}
        onClose={() => setFollowUpModal({ open: false, enquiry: null })}
        title="Log Communication Follow-up"
        subtitle={followUpModal.enquiry ? `For ${followUpModal.enquiry.parentName} (${followUpModal.enquiry.phone})` : ''}
        icon={<Phone size={20} className="text-primary" />}
        size="md"
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Communication Channel *</label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="input text-xs w-full h-8.5 rounded-xl bg-card"
            >
              <option value="Phone Call">Phone Call</option>
              <option value="WhatsApp Note">WhatsApp Message</option>
              <option value="Email">Email Communication</option>
              <option value="In-person Walk-in">In-person Discussion</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Discussion Notes *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Discussed fee plan and nursery batch timings. Parent requested campus tour on Saturday..."
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              className="input text-xs w-full rounded-xl py-2 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Next Follow-up Due Date & Time</label>
            <input
              type="datetime-local"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="input text-xs w-full h-8.5 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
            <button
              type="button"
              onClick={() => setFollowUpModal({ open: false, enquiry: null })}
              className="btn btn-ghost btn-sm h-8 px-3 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary btn-sm h-8 px-3.5 rounded-xl text-xs font-semibold shadow-xs"
            >
              Save Follow-up
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Slide-Over Lead Dossier Inspector ── */}
      {drawerOpen && selectedEnquiry && (
        <div className="adm-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div
            className="adm-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(800px, 92vw)' }}
          >
            {/* Header */}
            <div className="adm-drawer-header">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    ENQUIRY DOSSIER
                  </span>
                  <span className="badge text-[10px]">
                    {selectedEnquiry.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1 flex items-center gap-2">
                  <span>{selectedEnquiry.leadNumber}</span>
                  <span className="text-muted-foreground font-normal">—</span>
                  <span>{selectedEnquiry.parentName}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-ghost btn-sm h-8 w-8 p-0 rounded-xl"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="adm-drawer-tabs">
              <button
                type="button"
                className={`adm-drawer-tab ${drawerTab === 'overview' ? 'active' : ''}`}
                onClick={() => setDrawerTab('overview')}
              >
                Lead Overview
              </button>
              <button
                type="button"
                className={`adm-drawer-tab ${drawerTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setDrawerTab('timeline')}
              >
                Activity Timeline ({timelineEvents.length})
              </button>
            </div>

            {/* Body */}
            <div className="adm-drawer-body space-y-4 p-5">
              {drawerTab === 'overview' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                      <div className="text-muted-foreground">Mobile Phone</div>
                      <div className="font-bold text-foreground font-mono">{selectedEnquiry.phone}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                      <div className="text-muted-foreground">Email Address</div>
                      <div className="font-bold text-foreground">{selectedEnquiry.email || 'None provided'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                      <div className="text-muted-foreground">Child Name</div>
                      <div className="font-bold text-foreground">{selectedEnquiry.childName || 'Unspecified'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                      <div className="text-muted-foreground">Target Program</div>
                      <div className="font-bold text-foreground">{selectedEnquiry.interestedProgram || 'Nursery'}</div>
                    </div>
                  </div>

                  {selectedEnquiry.notes && (
                    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 space-y-1 text-xs">
                      <div className="font-semibold text-foreground">Intake Notes:</div>
                      <p className="text-muted-foreground leading-relaxed">{selectedEnquiry.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setFollowUpModal({ open: true, enquiry: selectedEnquiry })}
                      className="btn btn-outline btn-sm h-8.5 rounded-xl text-xs font-semibold gap-1.5 flex-1 justify-center"
                    >
                      <Phone size={13} />
                      <span>Log Follow-up</span>
                    </button>
                    {selectedEnquiry.status !== 'APPLICATION_STARTED' && selectedEnquiry.status !== 'CONVERTED' && selectedEnquiry.status !== 'LOST' && (
                      <button
                        type="button"
                        onClick={() => handleStartApplication(selectedEnquiry.id)}
                        className="btn btn-primary btn-sm h-8.5 rounded-xl text-xs font-semibold gap-1.5 flex-1 justify-center shadow-xs"
                      >
                        <ClipboardList size={13} />
                        <span>Start Application</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents.length > 0 ? (
                    timelineEvents.map((ev, i) => (
                      <div key={i} className="p-3 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>{ev.summary || ev.action}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{fmtDate(ev.createdAt)}</span>
                        </div>
                        {ev.actorName && (
                          <div className="text-[11px] text-muted-foreground">By {ev.actorName}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No communications logged yet for this enquiry.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdmissionsShell>
  )
}
