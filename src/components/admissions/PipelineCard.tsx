'use client'

import React, { useState } from 'react'
import {
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle2,
  User,
  MoreVertical,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Building,
  Sparkles,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'
import type { PipelineCardData, PipelineStageKey } from '@/lib/admissions/pipeline-constants'
import { ORDERED_PIPELINE_STAGES, PIPELINE_STAGES } from '@/lib/admissions/pipeline-constants'
import { fmtDate } from '@/lib/format'
import {
  normalizePhoneNumberForTel,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'
import { DirectContactButtonGroup } from './DirectContactButtonGroup'
import { PromoteStageButton } from './PromoteStageButton'

export interface PipelineCardProps {
  card: PipelineCardData
  onInspect: (card: PipelineCardData) => void
  onScheduleFollowUp: (card: PipelineCardData) => void
  onBookTour: (card: PipelineCardData) => void
  onMoveStage: (card: PipelineCardData, targetStage: PipelineStageKey) => void
  onStartApplication?: (card: PipelineCardData) => void
  onGenerateOffer?: (card: PipelineCardData) => void
  onPromoteSuccess?: (card: PipelineCardData) => void
  onDragStart?: (e: React.DragEvent, card: PipelineCardData) => void
  onDragEnd?: (e: React.DragEvent) => void
  onOpenCall?: (card: PipelineCardData) => void
  onOpenWhatsApp?: (card: PipelineCardData) => void
  schoolName?: string
}

export function PipelineCard({
  card,
  onInspect,
  onScheduleFollowUp,
  onBookTour,
  onMoveStage,
  onStartApplication,
  onGenerateOffer,
  onDragStart,
  onDragEnd,
  onOpenCall,
  onOpenWhatsApp,
  schoolName = 'PreOne',
}: PipelineCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const telUrl = normalizePhoneNumberForTel(card.phone)
  const whatsAppUrl = buildWhatsAppChatUrl(
    card.phone,
    `Hello, I am contacting you regarding ${card.studentName}'s admission enquiry at ${schoolName}.`
  )

  const currentIndex = ORDERED_PIPELINE_STAGES.indexOf(card.stage)
  const prevStage = currentIndex > 0 ? ORDERED_PIPELINE_STAGES[currentIndex - 1] : null
  const nextStage =
    currentIndex < ORDERED_PIPELINE_STAGES.length - 1
      ? ORDERED_PIPELINE_STAGES[currentIndex + 1]
      : null

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onInspect(card)
    }
  }

  // Get initial for avatar
  const initials = card.studentName
    ? card.studentName
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => onDragStart?.(e, card)}
      onDragEnd={onDragEnd}
      onClick={() => onInspect(card)}
      onKeyDown={handleCardKeyDown}
      className={`group relative rounded-xl border border-border/80 bg-card p-3.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 select-none focus:outline-none focus:ring-2 focus:ring-primary/40`}
    >
      <div className="space-y-2.5">
        {/* ── Top Bar: Reference & Badges ── */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[11px] font-bold text-primary tracking-tight truncate">
              {card.referenceNumber}
            </span>
            <span
              className={`text-[9.5px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${
                card.kind === 'APPLICATION'
                  ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
                  : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
              }`}
            >
              {card.kind === 'APPLICATION' ? 'Application' : 'Lead'}
            </span>
          </div>

          {/* Action Menu (Accessible keyboard & touch fallback) */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label={`Actions for ${card.studentName}`}
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onInspect(card)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-muted font-medium"
                  >
                    <Eye size={13} className="text-primary" /> View Details
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onScheduleFollowUp(card)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-muted font-medium"
                  >
                    <Clock size={13} className="text-amber-600" /> Schedule Follow-up
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onBookTour(card)
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-muted font-medium"
                  >
                    <Calendar size={13} className="text-blue-600" /> Book Campus Tour
                  </button>

                  {card.kind === 'LEAD' && onStartApplication && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        onStartApplication(card)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-muted font-medium text-violet-600 dark:text-violet-400"
                    >
                      <FileSpreadsheet size={13} /> Start Application
                    </button>
                  )}

                  {card.kind === 'APPLICATION' && onGenerateOffer && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        onGenerateOffer(card)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-muted font-medium text-indigo-600 dark:text-indigo-400"
                    >
                      <Sparkles size={13} /> Generate Offer
                    </button>
                  )}

                  <div className="h-px bg-border my-1" />

                  {/* Accessible Move to Stage */}
                  <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Move to Stage
                  </div>

                  {ORDERED_PIPELINE_STAGES.map((stKey) => {
                    const st = PIPELINE_STAGES[stKey]
                    const isCurrent = card.stage === stKey
                    return (
                      <button
                        key={stKey}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          setMenuOpen(false)
                          onMoveStage(card, stKey)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium ${
                          isCurrent
                            ? 'opacity-40 cursor-default bg-muted/40'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span className="truncate">{st.label}</span>
                        {isCurrent && <CheckCircle2 size={12} className="text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Student Information ── */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {card.studentName}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
              {card.programName && (
                <span className="font-semibold text-foreground/80">
                  {card.programName}
                </span>
              )}
              {card.branchName && (
                <>
                  <span>•</span>
                  <span className="truncate">{card.branchName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Parent Contact & Quick Call Buttons ── */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="min-w-0 pr-1">
            <div className="font-medium text-foreground/90 truncate text-[11.5px]">
              {card.parentName}
            </div>
            <div className="text-[10.5px] text-muted-foreground font-mono truncate">
              {card.phone}
            </div>
          </div>

          <DirectContactButtonGroup
            phone={card.phone}
            parentName={card.parentName}
            onOpenCall={() => onOpenCall ? onOpenCall(card) : (telUrl && window.open(telUrl))}
            onOpenWhatsApp={() => onOpenWhatsApp ? onOpenWhatsApp(card) : (whatsAppUrl && window.open(whatsAppUrl, '_blank'))}
            size="sm"
          />
        </div>

        {/* ── Stage-Specific Milestones & Overdue Warning ── */}
        <div className="space-y-1 pt-1">
          {card.isOverdue && (
            <div className="flex items-center gap-1 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
              <AlertTriangle size={11} className="shrink-0" />
              <span>Follow-up overdue</span>
            </div>
          )}

          {card.isDueToday && !card.isOverdue && (
            <div className="flex items-center gap-1 text-[10.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60">
              <Clock size={11} className="shrink-0" />
              <span>Follow-up due today</span>
            </div>
          )}

          {card.tourScheduledAt && (
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60">
              <Calendar size={11} className="shrink-0" />
              <span>Tour: {fmtDate(card.tourScheduledAt)}</span>
            </div>
          )}

          {card.documentsPendingCount !== undefined && card.documentsPendingCount > 0 && (
            <div className="flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
              <FileText size={11} className="shrink-0 text-amber-500" />
              <span>{card.documentsPendingCount} doc(s) pending</span>
            </div>
          )}

          {card.offerDetails && (
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/60">
              <Sparkles size={11} className="shrink-0" />
              <span>
                Offer: {card.offerDetails.offerNumber} ({card.offerDetails.status})
              </span>
            </div>
          )}

          {card.classroomName && (
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-900/60">
              <Building size={11} className="shrink-0" />
              <span>Classroom: {card.classroomName}</span>
            </div>
          )}
        </div>

        {/* ── 1-Click Zero-Retype Stage Progression Action ── */}
        <div
          className="pt-2 border-t border-border/50 flex items-center justify-between gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Progression
          </span>
          <PromoteStageButton
            recordId={card.id}
            kind={card.kind}
            studentName={card.studentName}
            referenceNumber={card.referenceNumber}
            branchId={card.branchId || undefined}
            academicSessionId={card.academicSessionId || undefined}
            size="sm"
            onSuccess={() => onPromoteSuccess?.(card)}
            onOpenDetails={() => onInspect(card)}
          />
        </div>
      </div>
    </div>
  )
}
