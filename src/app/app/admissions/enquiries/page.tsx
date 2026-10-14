'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users, Plus, Download, Search, X, Filter, Phone, Calendar,
  ClipboardList, CheckCircle2, AlertTriangle, ArrowRight, Check,
  RefreshCw, Building, Eye, Clock, MessageCircle, FileText, Edit2,
  LayoutGrid, List, SlidersHorizontal
} from 'lucide-react'
import { AdmissionsShell } from '@/components/admissions/AdmissionsShell'
import { MinimalEnquiryModal } from '@/components/admissions/MinimalEnquiryModal'
import { SharePublicFormModal } from '@/components/admissions/SharePublicFormModal'
import { StartApplicationModal } from '@/components/admissions/StartApplicationModal'
import { EnquiryCard } from '@/components/admissions/EnquiryCard'
import { MobileEnquiryActionBar } from '@/components/admissions/MobileEnquiryActionBar'
import { SelectEnquiryForAppModal } from '@/components/admissions/SelectEnquiryForAppModal'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { EmptyState, StatusPill, StudentIdentityChip, FamilyIdentityChip } from '@/components/preone'
import {
  normalizePhoneNumberForTel,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'
import { invalidateAdmissionsCounts } from '@/lib/admissions/use-admissions-counts'

export default function EnquiriesPage() {
  const toast = useToast()

  // Master contexts
  const [branches, setBranches] = useState<{ id: string; name: string; isMain?: boolean }[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [programs, setPrograms] = useState<any[]>([])

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProgram, setFilterProgram] = useState('')
  const [filterStatus, setFilterStatus] = useState('ACTIVE')
  const [filterSource, setFilterSource] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Layout View Mode: 'auto' (cards on mobile/tablet, table on desktop) | 'cards' | 'table'
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto')

  // Data states
  const [enquiries, setEnquiries] = useState<any[] | null>(null)
  const [busy, setBusy] = useState(false)

  // Selected enquiry for contextual mobile actions
  const [selectedEnquiryForApp, setSelectedEnquiryForApp] = useState<any | null>(null)

  // Modals
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'overview' | 'timeline'>('overview')
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])

  // Quick picker modal for "Start Application" when no enquiry is selected yet
  const [selectEnquiryModalOpen, setSelectEnquiryModalOpen] = useState(false)

  // Follow-up quick action modal
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; enquiry: any | null }>({
    open: false,
    enquiry: null,
  })
  const [followUpNote, setFollowUpNote] = useState('')
  const [followUpType, setFollowUpType] = useState('Phone Call')
  const [nextFollowUpDate, setNextFollowUpDate] = useState('')

  // Start Application Modal (staff assignment + follow-up scheduling)
  const [startAppModal, setStartAppModal] = useState<{ open: boolean; enquiry: any | null }>({
    open: false,
    enquiry: null,
  })

  // Load branches on mount
  useEffect(() => {
    async function loadBranches() {
      try {
        const brRes = await fetch('/api/v1/branches').then((r) => r.json()).catch(() => ({ success: false, data: [] }))
        if (brRes.success && brRes.data?.length > 0) {
          setBranches(brRes.data)
          // For multi-branch owners, default to All Branches for holistic visibility
          if (brRes.data.length > 1) {
            setSelectedBranchId('__ALL_BRANCHES__')
          } else {
            const main = brRes.data.find((b: any) => b.isMain) || brRes.data[0]
            setSelectedBranchId(main.id)
          }
        }
      } catch (e) {
        console.error('Failed to load branches:', e)
      }
    }
    loadBranches()
  }, [])

  // Dynamically update programs when branch filter changes
  useEffect(() => {
    let active = true
    const branchParam = selectedBranchId && selectedBranchId !== '__ALL_BRANCHES__'
      ? `?branchId=${encodeURIComponent(selectedBranchId)}`
      : ''
    fetch(`/api/v1/programs${branchParam}`)
      .then((r) => r.json())
      .then((res) => {
        if (!active) return
        if (res.success && Array.isArray(res.data)) {
          setPrograms(res.data)
          // Invalidate selected filterProgram if it doesn't exist in the new branch's programs
          setFilterProgram((prev) => {
            if (!prev) return ''
            const exists = res.data.some((p: any) => (p.programType || p.code) === prev || p.id === prev)
            return exists ? prev : ''
          })
        }
      })
      .catch((e) => console.error('Failed to load programs for branch:', e))
    return () => {
      active = false
    }
  }, [selectedBranchId])

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

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterProgram) count++
    if (filterStatus && filterStatus !== 'ACTIVE') count++
    if (filterSource) count++
    if (searchQuery) count++
    return count
  }, [filterProgram, filterStatus, filterSource, searchQuery])

  // Open Lead Dossier Drawer
  const openDossier = async (enquiry: any) => {
    setSelectedEnquiry(enquiry)
    setSelectedEnquiryForApp(enquiry)
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
        invalidateAdmissionsCounts()
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

  // Open Start Application / Assign Follow-up modal
  const handleStartApplication = (enquiry: any) => {
    setSelectedEnquiryForApp(enquiry)
    setStartAppModal({ open: true, enquiry })
  }

  // Trigger from mobile sticky action bar
  const handleMobileStartApplication = () => {
    if (selectedEnquiryForApp) {
      handleStartApplication(selectedEnquiryForApp)
    } else {
      setSelectEnquiryModalOpen(true)
    }
  }

  // Handle successful follow-up assignment
  const handleApplicationStarted = (data: any) => {
    toast.success(
      'Follow-up Assigned & Scheduled! ✓',
      `Assigned to staff. Enquiry is now in the Follow-ups workflow.`
    )
    loadEnquiries()
    invalidateAdmissionsCounts()
    if (selectedEnquiry?.id === data.leadId) {
      setDrawerOpen(false)
      setSelectedEnquiry(null)
    }
  }

  // Explicitly convert a Qualified lead to an Admission Application
  const handleConvertToApplication = async (enquiry: any) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/leads/${enquiry.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : (enquiry.branchId || undefined),
        }),
      })
      const json = await res.json()
      setBusy(false)
      if (json.success) {
        toast.success(
          'Converted to Application! 📋',
          `Application ${json.data?.applicationNumber || ''} created with zero data re-entry.`
        )
        loadEnquiries()
        invalidateAdmissionsCounts()
      } else {
        toast.error('Failed to convert enquiry', json.error?.message)
      }
    } catch {
      setBusy(false)
      toast.error('Network error while converting enquiry')
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
      hideMobileHeaderAction={true}
    >
      {/* Container with bottom padding so sticky bottom bar never obscures content */}
      <div className="space-y-4 pb-24 sm:pb-28 lg:pb-6">
        {/* ── Search & Filter Controls (Responsive Toolbar) ── */}
        <div className="p-3 sm:p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                className="input text-xs pl-9.5 pr-8 h-9 rounded-xl bg-background border border-border/80 w-full focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/80"
                placeholder="Search parent, phone, child, or ref #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Desktop Filters (Hidden on Mobile, visible on sm and up) */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap min-w-0">
              {/* Program Filter */}
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-auto max-w-[140px] max-w-full min-w-0 font-medium"
                aria-label="Filter by Program"
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
                className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-auto max-w-[160px] max-w-full min-w-0 font-medium"
                aria-label="Filter by Status"
              >
                <option value="ACTIVE">Active Enquiries</option>
                <option value="ALL">All Statuses (History)</option>
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
                className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-auto max-w-[130px] max-w-full min-w-0 font-medium"
                aria-label="Filter by Source"
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

            {/* Toolbar Right: Mobile Filter Toggle, View Switcher & Refresh */}
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`btn btn-outline btn-sm h-9 px-2.5 rounded-xl text-xs sm:hidden gap-1.5 font-semibold ${
                  activeFiltersCount > 0 ? 'border-primary text-primary bg-primary/5' : ''
                }`}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* View Switcher: Auto / Cards / Table */}
              <div className="hidden sm:inline-flex items-center p-0.5 rounded-xl border border-border/80 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'cards'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Card view (Touch friendly)"
                  aria-label="Switch to Card view"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'table'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Table view"
                  aria-label="Switch to Table view"
                >
                  <List size={13} />
                </button>
              </div>

              {/* Clear Filters (Desktop) */}
              {(searchQuery || filterProgram || (filterStatus && filterStatus !== 'ACTIVE') || filterSource) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterProgram('')
                    setFilterStatus('ACTIVE')
                    setFilterSource('')
                  }}
                  className="btn btn-ghost btn-sm h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium hidden sm:inline-flex"
                >
                  Reset
                </button>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={loadEnquiries}
                disabled={busy}
                className="btn btn-ghost btn-sm h-9 w-9 p-0 rounded-xl border border-border/80 hover:bg-muted/50 shrink-0"
                title="Refresh enquiries"
                aria-label="Refresh enquiries"
              >
                <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* ── Mobile Collapsible Filters Tray ── */}
          {showMobileFilters && (
            <div className="sm:hidden pt-2 border-t border-border/60 grid grid-cols-1 gap-2.5 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Program
                  </label>
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-full font-medium"
                  >
                    <option value="">All Programs</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.programType || p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-full font-medium"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Tour Scheduled</option>
                    <option value="APPLICATION_STARTED">App Started</option>
                    <option value="CONVERTED">Enrolled</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Enquiry Source
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="input text-xs h-9 rounded-xl bg-background border border-border/80 w-full font-medium"
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

              {(searchQuery || filterProgram || filterStatus !== 'ACTIVE' || filterSource) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterProgram('')
                      setFilterStatus('ACTIVE')
                      setFilterSource('')
                    }}
                    className="btn btn-ghost btn-sm h-8 px-3 text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Count & View Header ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {filterStatus === 'ALL' ? 'All Enquiries' : 'Active Enquiries'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
              {enquiries?.length || 0}
            </span>
          </div>

          {selectedEnquiryForApp && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>Selected for App:</span>
              <span className="font-bold text-primary truncate max-w-[140px]">
                {selectedEnquiryForApp.childName || selectedEnquiryForApp.parentName}
              </span>
              <button
                type="button"
                onClick={() => setSelectedEnquiryForApp(null)}
                className="text-muted-foreground hover:text-foreground"
                title="Clear selection"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RESPONSIVE DISPLAY: CARDS VS TABLE                            */}
        {/* ============================================================== */}

        {/* 1. RESPONSIVE CARDS VIEW (Default on Mobile & Tablet, or if viewMode === 'cards') */}
        <div
          className={
            viewMode === 'cards'
              ? 'block'
              : viewMode === 'table'
              ? 'hidden'
              : 'block lg:hidden'
          }
        >
          {enquiries && enquiries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {enquiries.map((e) => (
                <EnquiryCard
                  key={e.id}
                  enquiry={e}
                  onViewDossier={openDossier}
                  onLogFollowUp={(item) => setFollowUpModal({ open: true, enquiry: item })}
                  onStartApplication={handleStartApplication}
                  onConvertToApplication={handleConvertToApplication}
                  isSelected={selectedEnquiryForApp?.id === e.id}
                  onSelect={(item) => setSelectedEnquiryForApp(item)}
                  busy={busy}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-card p-8">
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
            </div>
          )}
        </div>

        {/* 2. DESKTOP TABLE VIEW (Default on Desktop >= 1024px, or if viewMode === 'table') */}
        <div
          className={
            viewMode === 'table'
              ? 'block'
              : viewMode === 'cards'
              ? 'hidden'
              : 'hidden lg:block'
          }
        >
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Enquiry Registry
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live Data</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
              <table className="table-frosted w-full text-left border-collapse text-xs">
                <thead className="table-frosted-header">
                  <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold text-foreground">Ref #</th>
                    {selectedBranchId === '__ALL_BRANCHES__' && (
                      <th className="py-3.5 px-4 font-semibold text-foreground">Branch</th>
                    )}
                    <th className="py-3.5 px-4 font-semibold text-foreground">Parent / Contact</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Child</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Program</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Source</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Date</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Next Reminder</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {enquiries && enquiries.length > 0 ? (
                    enquiries.map((e) => {
                      const isOverdue = e.nextFollowUpAt && new Date(e.nextFollowUpAt) < new Date()
                      const telUrl = normalizePhoneNumberForTel(e.phone)
                      const whatsAppUrl = buildWhatsAppChatUrl(
                        e.phone,
                        `Hello, I am contacting you regarding your admission enquiry with PreOne.`
                      )

                      return (
                        <tr
                          key={e.id}
                          className="table-frosted-row group cursor-pointer text-xs"
                          onClick={() => openDossier(e)}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                            {e.leadNumber}
                          </td>
                          {selectedBranchId === '__ALL_BRANCHES__' && (
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                <Building size={11} />
                                <span>{e.branchName || 'Main'}</span>
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <FamilyIdentityChip
                              name={e.parentName}
                              phone={e.phone}
                              email={e.email}
                            />
                          </td>
                          <td className="py-3 px-4">
                            {e.childName ? (
                              <StudentIdentityChip
                                name={e.childName}
                                size="sm"
                              />
                            ) : (
                              <span className="text-muted-foreground/70 italic text-[11px]">Not specified</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                              {e.interestedProgram || 'Nursery'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-muted text-foreground border border-border/60">
                              {e.source}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap font-medium">
                            {fmtDate(e.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                            {e.nextFollowUpAt ? (
                              <span className={isOverdue ? 'text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-lg' : 'text-foreground font-medium'}>
                                {fmtDate(e.nextFollowUpAt)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60 italic">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusPill status={e.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct Call action */}
                              {telUrl && (
                                <a
                                  href={telUrl}
                                  className="btn btn-ghost btn-sm h-7.5 px-2 rounded-lg hover:bg-primary/10 hover:text-primary gap-1 text-[11px] font-medium"
                                  title={`Call ${e.phone}`}
                                  aria-label={`Call ${e.parentName}`}
                                >
                                  <Phone size={12} />
                                  <span className="hidden sm:inline">Call</span>
                                </a>
                              )}

                              {/* Direct WhatsApp action */}
                              {whatsAppUrl && (
                                <a
                                  href={whatsAppUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-sm h-7.5 px-2 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px] font-medium"
                                  title={`WhatsApp ${e.phone}`}
                                  aria-label={`Message ${e.parentName} on WhatsApp`}
                                >
                                  <MessageCircle size={12} />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </a>
                              )}

                              {/* Dossier button */}
                              <button
                                type="button"
                                onClick={() => openDossier(e)}
                                className="btn btn-ghost btn-sm h-7.5 px-2 rounded-lg hover:bg-primary/10 hover:text-primary gap-1 text-[11px] font-medium"
                                title="View Dossier"
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">View</span>
                              </button>

                              {/* Contextual status button */}
                              {e.status === 'QUALIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => handleConvertToApplication(e)}
                                  disabled={busy}
                                  className="btn btn-sm h-7.5 px-2.5 text-[11px] font-semibold rounded-lg shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shrink-0"
                                  title="Move Qualified Lead to Admission Application"
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Move to App</span>
                                </button>
                              )}
                              {e.status === 'NEW' && (
                                <button
                                  type="button"
                                  onClick={() => handleStartApplication(e)}
                                  className="btn btn-primary btn-sm h-7.5 px-2.5 text-[11px] font-semibold rounded-lg shadow-xs shrink-0"
                                  title="Move to Follow-ups & schedule outreach"
                                >
                                  Move to Follow-ups
                                </button>
                              )}
                              {e.status === 'CONTACTED' && (
                                <button
                                  type="button"
                                  onClick={() => setFollowUpModal({ open: true, enquiry: e })}
                                  className="btn btn-outline btn-sm h-7.5 px-2.5 text-[11px] font-semibold rounded-lg shrink-0"
                                  title="Record outreach activity"
                                >
                                  Follow-up
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={selectedBranchId === '__ALL_BRANCHES__' ? 11 : 10} className="py-8">
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
      </div>

      {/* ── STICKY BOTTOM ACTION BAR ON MOBILE & TABLET ── */}
      <MobileEnquiryActionBar
        onRecordEnquiry={() => setEnquiryModalOpen(true)}
        onStartApplication={handleMobileStartApplication}
        selectedEnquiry={selectedEnquiryForApp}
        totalEnquiries={enquiries?.length || 0}
        disabled={busy}
      />

      {/* ── MODAL: Select Enquiry for Application Picker ── */}
      <SelectEnquiryForAppModal
        open={selectEnquiryModalOpen}
        onClose={() => setSelectEnquiryModalOpen(false)}
        enquiries={enquiries || []}
        onSelect={(enquiry) => {
          setSelectedEnquiryForApp(enquiry)
          handleStartApplication(enquiry)
        }}
      />

      {/* ── MODAL: Streamlined New Enquiry ── */}
      <MinimalEnquiryModal
        open={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        branches={branches}
        defaultBranchId={selectedBranchId}
        programs={programs}
        onSuccess={(created) => {
          if (created?.branchId && selectedBranchId !== '__ALL_BRANCHES__' && created.branchId !== selectedBranchId) {
            setSelectedBranchId(created.branchId)
          } else {
            loadEnquiries()
          }
        }}
      />

      {/* ── MODAL: Share Public Form ── */}
      <SharePublicFormModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        branchId={selectedBranchId}
        branchName={branches.find((b) => b.id === selectedBranchId)?.name}
      />

      {/* ── MODAL: Start Application & Staff Assignment ── */}
      <StartApplicationModal
        open={startAppModal.open}
        onClose={() => setStartAppModal({ open: false, enquiry: null })}
        enquiry={startAppModal.enquiry}
        onSuccess={handleApplicationStarted}
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

      {/* ── Pop-Up Lead Dossier Modal ── */}
      {selectedEnquiry && (
        <Modal
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={`Enquiry Dossier — ${selectedEnquiry.leadNumber}`}
          subtitle={`${selectedEnquiry.parentName} • ${selectedEnquiry.branchName || 'Main Campus'} • Status: ${selectedEnquiry.status.replace(/_/g, ' ')}`}
          icon={<FileText size={20} className="text-primary" />}
          size="lg"
        >
          <div className="space-y-4">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border/80 pb-2">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  drawerTab === 'overview'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setDrawerTab('overview')}
              >
                Lead Overview
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  drawerTab === 'timeline'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setDrawerTab('timeline')}
              >
                <span>Activity Timeline</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${drawerTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {timelineEvents.length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            {drawerTab === 'overview' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="text-muted-foreground font-medium">Parent / Guardian Contact</div>
                    <div className="font-bold text-foreground">{selectedEnquiry.parentName}</div>
                    <div className="font-mono text-muted-foreground">{selectedEnquiry.phone}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="text-muted-foreground font-medium">Email Address</div>
                    <div className="font-bold text-foreground truncate">{selectedEnquiry.email || 'None provided'}</div>
                    <div className="text-muted-foreground">Source: <span className="font-semibold text-foreground">{selectedEnquiry.source || 'Walk-in'}</span></div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="text-muted-foreground font-medium">Prospective Pupil</div>
                    <div className="font-bold text-foreground text-sm">{selectedEnquiry.childName || 'Unspecified'}</div>
                    {selectedEnquiry.childDob && (
                      <div className="text-muted-foreground">DOB: <span className="font-semibold text-foreground">{fmtDate(selectedEnquiry.childDob)}</span></div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="text-muted-foreground font-medium">Target Program & Branch</div>
                    <div className="font-bold text-primary text-sm">{selectedEnquiry.interestedProgram || 'Nursery'}</div>
                    <div className="text-muted-foreground">Campus: <span className="font-semibold text-foreground">{selectedEnquiry.branchName || 'Main Campus'}</span></div>
                  </div>
                </div>

                {selectedEnquiry.notes && (
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-1 text-xs">
                    <div className="font-semibold text-foreground">Intake Notes & Observations:</div>
                    <p className="text-muted-foreground leading-relaxed">{selectedEnquiry.notes}</p>
                  </div>
                )}

                {/* Modal Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="btn btn-ghost btn-sm h-8.5 px-3 rounded-xl text-xs font-medium"
                  >
                    Close
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false)
                        setFollowUpModal({ open: true, enquiry: selectedEnquiry })
                      }}
                      className="btn btn-outline btn-sm h-8.5 px-3 rounded-xl text-xs font-semibold gap-1.5"
                    >
                      <Phone size={13} />
                      <span>Log Follow-up</span>
                    </button>
                    {selectedEnquiry.status !== 'APPLICATION_STARTED' && selectedEnquiry.status !== 'CONVERTED' && selectedEnquiry.status !== 'LOST' && (
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false)
                          handleStartApplication(selectedEnquiry)
                        }}
                        className="btn btn-primary btn-sm h-8.5 px-3.5 rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
                      >
                        <ClipboardList size={13} />
                        <span>Start Application</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
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
                    No communications or events logged yet for this enquiry.
                  </div>
                )}
                <div className="flex items-center justify-end pt-3 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="btn btn-ghost btn-sm h-8.5 px-3 rounded-xl text-xs font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AdmissionsShell>
  )
}
