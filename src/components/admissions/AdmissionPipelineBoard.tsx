'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  Calendar,
  FileSpreadsheet,
  Sparkles,
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  Table,
  Kanban,
  CheckCircle2,
  X,
  AlertCircle,
  Building,
  UserCheck,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { PipelineCard } from './PipelineCard'
import type {
  PipelineCardData,
  PipelineMetrics,
  PipelineStageKey,
} from '@/lib/admissions/pipeline-constants'
import {
  ORDERED_PIPELINE_STAGES,
  PIPELINE_STAGES,
} from '@/lib/admissions/pipeline-constants'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate } from '@/lib/format'
import { CallLogDialog } from './CallLogDialog'
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal'

export interface AdmissionPipelineBoardProps {
  selectedBranchId?: string
  selectedSessionId?: string
  branches?: { id: string; name: string }[]
  academicSessions?: { id: string; name: string }[]
  onInspect: (card: PipelineCardData) => void
  onNewEnquiry?: () => void
  onStartApplication?: (card: PipelineCardData) => void
  onGenerateOffer?: (card: PipelineCardData) => void
  viewMode: 'table' | 'pipeline'
  onViewModeChange: (mode: 'table' | 'pipeline') => void
}

export function AdmissionPipelineBoard({
  selectedBranchId,
  selectedSessionId,
  branches = [],
  academicSessions = [],
  onInspect,
  onNewEnquiry,
  onStartApplication,
  onGenerateOffer,
  viewMode,
  onViewModeChange,
}: AdmissionPipelineBoardProps) {
  const toast = useToast()

  // Data states
  const [loading, setLoading] = useState(true)
  const [stages, setStages] = useState<Record<PipelineStageKey, PipelineCardData[]>>({
    ENQUIRIES: [],
    FOLLOW_UPS: [],
    APPLICATIONS: [],
    CONFIRMED_ADMISSIONS: [],
    CLASSROOM_PLACEMENTS: [],
  })
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    totalActive: 0,
    enquiries: 0,
    followUps: 0,
    applications: 0,
    confirmedAdmissions: 0,
    classroomPlacements: 0,
    followupsOverdue: 0,
    followupsDueToday: 0,
    upcomingTours: 0,
  })

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [followUpFilter, setFollowUpFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'>('ALL')

  // Drag-and-drop states
  const [draggedCard, setDraggedCard] = useState<PipelineCardData | null>(null)
  const [activeDropStage, setActiveDropStage] = useState<PipelineStageKey | null>(null)

  // Follow-up & Tour Modal states
  const [followUpModal, setFollowUpModal] = useState<{
    open: boolean
    card: PipelineCardData | null
    dueAt: string
    note: string
    responsibleRole: string
  }>({
    open: false,
    card: null,
    dueAt: '',
    note: '',
    responsibleRole: 'PRINCIPAL',
  })

  const [tourModal, setTourModal] = useState<{
    open: boolean
    card: PipelineCardData | null
    scheduledAt: string
    tourFocus: string
    visitorCount: number
    notes: string
  }>({
    open: false,
    card: null,
    scheduledAt: '',
    tourFocus: 'Classroom & Play Area Tour',
    visitorCount: 2,
    notes: '',
  })

  // Actionable rejection modal (e.g. Prerequisite missing)
  const [rejectionModal, setRejectionModal] = useState<{
    open: boolean
    message: string
    requireAction?: string
    card?: PipelineCardData | null
  }>({
    open: false,
    message: '',
  })

  // Direct Communication Modals (Call Log & WhatsApp)
  const [callLogModal, setCallLogModal] = useState<{
    open: boolean
    card: PipelineCardData | null
  }>({
    open: false,
    card: null,
  })

  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean
    card: PipelineCardData | null
  }>({
    open: false,
    card: null,
  })

  // Fetch pipeline data
  const loadPipeline = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBranchId && selectedBranchId !== '__ALL_BRANCHES__') {
        params.set('branchId', selectedBranchId)
      }
      if (selectedSessionId && selectedSessionId !== '__ALL_SESSIONS__') {
        params.set('academicSessionId', selectedSessionId)
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }
      if (selectedProgram) {
        params.set('program', selectedProgram)
      }
      if (followUpFilter !== 'ALL') {
        params.set('followUpStatus', followUpFilter)
      }

      const res = await fetch(`/api/v1/admissions/pipeline?${params.toString()}`)
      const json = await res.json()

      if (json.success && json.data) {
        setStages(json.data.stages)
        setMetrics(json.data.metrics)
      } else {
        toast.error('Could not load admissions pipeline', json.error?.message)
      }
    } catch (err: any) {
      toast.error('Network error loading pipeline', err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedBranchId, selectedSessionId, searchQuery, selectedProgram, followUpFilter, toast])

  useEffect(() => {
    loadPipeline()
  }, [loadPipeline])

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, card: PipelineCardData) => {
    setDraggedCard(card)
    e.dataTransfer.setData('text/plain', card.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
    setActiveDropStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stageKey: PipelineStageKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropStage !== stageKey) {
      setActiveDropStage(stageKey)
    }
  }

  const handleDragLeave = (e: React.DragEvent, stageKey: PipelineStageKey) => {
    // Only clear if leaving the drop container
    if (activeDropStage === stageKey) {
      setActiveDropStage(null)
    }
  }

  // Execute stage transition
  const executeTransition = async (
    card: PipelineCardData,
    targetStage: PipelineStageKey,
    extra?: {
      followUp?: any
      reason?: string
    }
  ) => {
    if (card.stage === targetStage) return

    const previousStages = { ...stages }
    const fromStage = card.stage

    // Optimistic UI Update: move card immediately in local state
    setStages((prev) => {
      const fromList = prev[fromStage].filter((c) => c.id !== card.id)
      const toList = [{ ...card, stage: targetStage }, ...prev[targetStage]]
      return {
        ...prev,
        [fromStage]: fromList,
        [targetStage]: toList,
      }
    })

    try {
      const res = await fetch('/api/v1/admissions/pipeline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          targetStage,
          reason: extra?.reason,
          followUp: extra?.followUp,
          branchId: selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : undefined,
          academicYearId: selectedSessionId !== '__ALL_SESSIONS__' ? selectedSessionId : undefined,
        }),
      })

      const json = await res.json()

      if (json.success) {
        toast.success(json.data?.message || `Moved to ${PIPELINE_STAGES[targetStage].label}`)
        // Refresh authoritative counts and data
        loadPipeline()
      } else {
        // Rollback to previous state
        setStages(previousStages)

        const errorMsg = json.error?.message || 'Stage transition rejected'
        const requireAction = json.error?.requireAction || json.error?.details?.requireAction

        if (requireAction) {
          setRejectionModal({
            open: true,
            message: errorMsg,
            requireAction,
            card,
          })
        } else {
          toast.error('Cannot move card', errorMsg)
        }
      }
    } catch (err: any) {
      // Rollback on network failure
      setStages(previousStages)
      toast.error('Network error during move', err.message)
    } finally {
      setDraggedCard(null)
      setActiveDropStage(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStageKey) => {
    e.preventDefault()
    setActiveDropStage(null)

    if (!draggedCard) return
    if (draggedCard.stage === targetStage) return

    // If moving to FOLLOW_UPS, show visit/follow-up scheduler modal for rich context
    if (targetStage === 'FOLLOW_UPS') {
      const nextDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const dateStr = nextDate.toISOString().slice(0, 16)
      setTourModal({
        open: true,
        card: draggedCard,
        scheduledAt: dateStr,
        tourFocus: 'Classroom & Facilities Tour',
        visitorCount: 2,
        notes: '',
      })
      return
    }

    // Direct transition for other stages
    executeTransition(draggedCard, targetStage)
  }

  // Confirm Tour Schedule from Modal
  const handleConfirmTour = async () => {
    if (!tourModal.card || !tourModal.scheduledAt) return
    await executeTransition(tourModal.card, 'FOLLOW_UPS', {
      followUp: {
        dueAt: new Date(tourModal.scheduledAt).toISOString(),
        tourFocus: tourModal.tourFocus,
        visitorCount: tourModal.visitorCount,
        note: tourModal.notes || 'Tour booked via Visual Pipeline',
      },
    })
    setTourModal({ open: false, card: null, scheduledAt: '', tourFocus: '', visitorCount: 2, notes: '' })
  }

  // Confirm Follow-up Reminder
  const handleConfirmFollowUp = async () => {
    if (!followUpModal.card || !followUpModal.note) return
    await executeTransition(followUpModal.card, followUpModal.card.stage, {
      followUp: {
        dueAt: followUpModal.dueAt ? new Date(followUpModal.dueAt).toISOString() : undefined,
        note: followUpModal.note,
        responsibleRole: followUpModal.responsibleRole,
      },
    })
    setFollowUpModal({ open: false, card: null, dueAt: '', note: '', responsibleRole: 'PRINCIPAL' })
  }

  return (
    <div className="space-y-4">
      {/* ── 1. SUMMARY METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {[
          {
            label: 'Total Active',
            value: metrics.totalActive,
            icon: Users,
            color: 'text-foreground',
            bg: 'bg-card',
          },
          {
            label: 'Enquiries',
            value: metrics.enquiries,
            icon: Users,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/5',
          },
          {
            label: 'Follow-ups',
            value: metrics.followUps,
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/5',
          },
          {
            label: 'Applications',
            value: metrics.applications,
            icon: FileSpreadsheet,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-500/5',
          },
          {
            label: 'Confirmed',
            value: metrics.confirmedAdmissions,
            icon: Sparkles,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/5',
          },
          {
            label: 'Placements',
            value: metrics.classroomPlacements,
            icon: GraduationCap,
            color: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-500/5',
          },
          {
            label: 'Overdue',
            value: metrics.followupsOverdue,
            icon: AlertTriangle,
            color: metrics.followupsOverdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground',
            bg: metrics.followupsOverdue > 0 ? 'bg-rose-500/10 border-rose-300 dark:border-rose-800' : 'bg-card',
            alert: metrics.followupsOverdue > 0,
          },
          {
            label: 'Due Today',
            value: metrics.followupsDueToday,
            icon: Calendar,
            color: metrics.followupsDueToday > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
            bg: metrics.followupsDueToday > 0 ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800' : 'bg-card',
          },
        ].map((m, i) => {
          const Icon = m.icon
          return (
            <div
              key={i}
              className={`rounded-xl border border-border/80 p-2.5 sm:p-3 shadow-xs flex flex-col justify-between ${m.bg}`}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-medium truncate">{m.label}</span>
                <Icon size={13} className={m.color} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${m.color}`}>
                  {m.value}
                </span>
                {m.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 2. VIEW TOGGLE & FILTER CONTROLS BAR ── */}
      <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Segmented Switcher & Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* View Toggle */}
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table size={13} />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban size={13} />
              <span>Visual Pipeline</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search child, parent, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Program Filter, Urgency Filter, Refresh & New Enquiry */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Urgency Filter */}
          <select
            value={followUpFilter}
            onChange={(e) => setFollowUpFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All Follow-ups</option>
            <option value="OVERDUE">⚠️ Overdue Only</option>
            <option value="TODAY">🕒 Due Today</option>
            <option value="UPCOMING">Upcoming</option>
          </select>

          {/* Refresh button */}
          <button
            type="button"
            onClick={loadPipeline}
            disabled={loading}
            aria-label="Refresh pipeline"
            className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* New Enquiry Action */}
          {onNewEnquiry && (
            <button
              type="button"
              onClick={onNewEnquiry}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Enquiry</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3. FIVE-STAGE KANBAN BOARD ── */}
      <div className="w-full overflow-x-auto pb-4 pt-1">
        <div className="flex items-start gap-3.5 min-w-[1240px]">
          {ORDERED_PIPELINE_STAGES.map((stageKey) => {
            const config = PIPELINE_STAGES[stageKey]
            const cardsInStage = stages[stageKey] || []
            const isDropActive = activeDropStage === stageKey

            return (
              <div
                key={stageKey}
                onDragOver={(e) => handleDragOver(e, stageKey)}
                onDragLeave={(e) => handleDragLeave(e, stageKey)}
                onDrop={(e) => handleDrop(e, stageKey)}
                className={`flex-1 min-w-[240px] max-w-[280px] rounded-2xl border flex flex-col bg-muted/20 transition-all duration-200 ${
                  isDropActive
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/[0.04]'
                    : 'border-border/70'
                }`}
              >
                {/* Column Header */}
                <div className={`p-3.5 rounded-t-2xl border-b border-border/70 bg-card/60 backdrop-blur-xs`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm text-foreground truncate">
                        {config.label}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/80">
                        {cardsInStage.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {stageKey === 'ENQUIRIES' && onNewEnquiry && (
                        <button
                          type="button"
                          onClick={onNewEnquiry}
                          aria-label="Add new enquiry"
                          className="w-5 h-5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      )}
                      {config.href && (
                        <Link
                          href={config.href}
                          aria-label={`Open ${config.label} page`}
                          className="w-5 h-5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {config.description}
                  </p>
                </div>

                {/* Column Body / Cards Container */}
                <div className="p-2.5 space-y-2.5 min-h-[460px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {loading && cardsInStage.length === 0 ? (
                    <div className="space-y-2.5">
                      {[1, 2].map((n) => (
                        <div
                          key={n}
                          className="rounded-xl border border-border/60 bg-card p-3 space-y-2 animate-pulse"
                        >
                          <div className="h-3 bg-muted rounded-sm w-1/3" />
                          <div className="h-4 bg-muted rounded-sm w-3/4" />
                          <div className="h-3 bg-muted rounded-sm w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : cardsInStage.length > 0 ? (
                    cardsInStage.map((card) => (
                      <PipelineCard
                        key={card.id}
                        card={card}
                        onInspect={onInspect}
                        onScheduleFollowUp={(c) => {
                          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
                            .toISOString()
                            .slice(0, 16)
                          setFollowUpModal({
                            open: true,
                            card: c,
                            dueAt: tomorrow,
                            note: '',
                            responsibleRole: 'PRINCIPAL',
                          })
                        }}
                        onBookTour={(c) => {
                          const nextDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
                            .toISOString()
                            .slice(0, 16)
                          setTourModal({
                            open: true,
                            card: c,
                            scheduledAt: nextDate,
                            tourFocus: 'Campus Facilities & Classroom Visit',
                            visitorCount: 2,
                            notes: '',
                          })
                        }}
                        onMoveStage={(c, st) => executeTransition(c, st)}
                        onStartApplication={onStartApplication}
                        onGenerateOffer={onGenerateOffer}
                        onPromoteSuccess={() => loadPipeline()}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onOpenCall={(c) => setCallLogModal({ open: true, card: c })}
                        onOpenWhatsApp={(c) => setWhatsAppModal({ open: true, card: c })}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-3 text-center border-2 border-dashed border-border/60 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mb-2">
                        <Users size={14} />
                      </div>
                      <span className="text-xs font-semibold text-foreground/80">
                        No prospects
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Drag cards here to update stage
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 4. TOUR BOOKING MODAL ── */}
      {tourModal.open && tourModal.card && (
        <Modal
          open={tourModal.open}
          onClose={() => setTourModal({ open: false, card: null, scheduledAt: '', tourFocus: '', visitorCount: 2, notes: '' })}
          title={`Book Campus Tour: ${tourModal.card.studentName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
              <div className="font-bold">Moving to Campus Tour Booked</div>
              <p className="mt-0.5 text-[11px]">
                Parent: {tourModal.card.parentName} ({tourModal.card.phone})
              </p>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Scheduled Visit Date & Time *
              </label>
              <input
                type="datetime-local"
                value={tourModal.scheduledAt}
                onChange={(e) => setTourModal({ ...tourModal, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Tour Focus
                </label>
                <select
                  value={tourModal.tourFocus}
                  onChange={(e) => setTourModal({ ...tourModal, tourFocus: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Classroom & Facilities Tour">Classroom & Facilities</option>
                  <option value="Playground & Safety Focus">Playground & Safety</option>
                  <option value="Curriculum & Teacher Meet">Curriculum & Educator Meet</option>
                  <option value="Full Campus Walkthrough">Full Campus Walkthrough</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  Expected Visitors
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={tourModal.visitorCount}
                  onChange={(e) => setTourModal({ ...tourModal, visitorCount: Number(e.target.value) || 2 })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Notes / Special Requests
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Parent requested to meet the lead teacher"
                value={tourModal.notes}
                onChange={(e) => setTourModal({ ...tourModal, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setTourModal({ open: false, card: null, scheduledAt: '', tourFocus: '', visitorCount: 2, notes: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={handleConfirmTour}
              >
                <CheckCircle2 size={13} />
                <span>Confirm Tour & Move</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 5. FOLLOW-UP REMINDER MODAL ── */}
      {followUpModal.open && followUpModal.card && (
        <Modal
          open={followUpModal.open}
          onClose={() => setFollowUpModal({ open: false, card: null, dueAt: '', note: '', responsibleRole: 'PRINCIPAL' })}
          title={`Schedule Follow-up: ${followUpModal.card.studentName}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">
                Follow-up Due Date & Time *
              </label>
              <input
                type="datetime-local"
                value={followUpModal.dueAt}
                onChange={(e) => setFollowUpModal({ ...followUpModal, dueAt: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Next Action / Reminder Note *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Follow up with parent on admission fee payment or documents"
                value={followUpModal.note}
                onChange={(e) => setFollowUpModal({ ...followUpModal, note: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Responsible Role
              </label>
              <select
                value={followUpModal.responsibleRole}
                onChange={(e) => setFollowUpModal({ ...followUpModal, responsibleRole: e.target.value })}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="PRINCIPAL">Principal / Head of Admissions</option>
                <option value="TEACHER">Class Teacher</option>
                <option value="STAFF">Front Desk / Admissions Coordinator</option>
              </select>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setFollowUpModal({ open: false, card: null, dueAt: '', note: '', responsibleRole: 'PRINCIPAL' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={handleConfirmFollowUp}
                disabled={!followUpModal.note.trim()}
              >
                <CheckCircle2 size={13} />
                <span>Save Reminder</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 6. REJECTION & ACTIONABLE PREREQUISITE MODAL ── */}
      {rejectionModal.open && (
        <Modal
          open={rejectionModal.open}
          onClose={() => setRejectionModal({ open: false, message: '', card: null })}
          title="Prerequisite Required"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Action Required</h4>
                <p className="mt-1 text-xs leading-relaxed">{rejectionModal.message}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setRejectionModal({ open: false, message: '', card: null })}
              >
                Dismiss
              </button>

              {rejectionModal.requireAction === 'COMPLETE_ENROLLMENT' && rejectionModal.card && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() => {
                    const c = rejectionModal.card
                    setRejectionModal({ open: false, message: '', card: null })
                    if (c) onInspect(c)
                  }}
                >
                  <GraduationCap size={13} />
                  <span>Open Admission Review</span>
                </button>
              )}

              {rejectionModal.requireAction === 'GENERATE_OFFER' && rejectionModal.card && onGenerateOffer && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() => {
                    const c = rejectionModal.card
                    setRejectionModal({ open: false, message: '', card: null })
                    if (c) onGenerateOffer(c)
                  }}
                >
                  <Sparkles size={13} />
                  <span>Generate Offer Now</span>
                </button>
              )}

              {rejectionModal.requireAction === 'ALLOCATE_CLASSROOM' && (
                <Link
                  href="/app/admissions/classroom-placements"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() => setRejectionModal({ open: false, message: '', card: null })}
                >
                  <GraduationCap size={13} />
                  <span>Go to Classroom Placements</span>
                </Link>
              )}

              {rejectionModal.requireAction === 'CREATE_APPLICATION' && rejectionModal.card && onStartApplication && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() => {
                    const c = rejectionModal.card
                    setRejectionModal({ open: false, message: '', card: null })
                    if (c) onStartApplication(c)
                  }}
                >
                  <FileSpreadsheet size={13} />
                  <span>Start Application</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── 6. CALL LOG DIALOG ── */}
      {callLogModal.open && callLogModal.card && (
        <CallLogDialog
          open={callLogModal.open}
          onClose={() => setCallLogModal({ open: false, card: null })}
          leadId={callLogModal.card.kind === 'LEAD' ? callLogModal.card.id : undefined}
          applicationId={callLogModal.card.kind === 'APPLICATION' ? callLogModal.card.id : undefined}
          parentName={callLogModal.card.parentName}
          phone={callLogModal.card.phone}
          onSaved={() => {
            loadPipeline()
          }}
        />
      )}

      {/* ── 7. WHATSAPP TEMPLATE MODAL ── */}
      {whatsAppModal.open && whatsAppModal.card && (
        <WhatsAppTemplateModal
          open={whatsAppModal.open}
          onClose={() => setWhatsAppModal({ open: false, card: null })}
          leadId={whatsAppModal.card.kind === 'LEAD' ? whatsAppModal.card.id : undefined}
          applicationId={whatsAppModal.card.kind === 'APPLICATION' ? whatsAppModal.card.id : undefined}
          parentName={whatsAppModal.card.parentName}
          childName={whatsAppModal.card.studentName}
          phone={whatsAppModal.card.phone}
          branchName={whatsAppModal.card.branchName}
          programName={whatsAppModal.card.programName}
          tourDate={whatsAppModal.card.tourScheduledAt ? fmtDate(whatsAppModal.card.tourScheduledAt) : undefined}
          applicationNumber={whatsAppModal.card.kind === 'APPLICATION' ? whatsAppModal.card.referenceNumber : undefined}
          leadNumber={whatsAppModal.card.kind === 'LEAD' ? whatsAppModal.card.referenceNumber : undefined}
          onLogged={() => {
            loadPipeline()
          }}
        />
      )}
    </div>
  )
}
