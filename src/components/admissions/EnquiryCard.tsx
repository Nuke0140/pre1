'use client'

import React from 'react'
import {
  Phone,
  MessageCircle,
  Building,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle2,
  User,
  Baby,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { StatusPill } from '@/components/preone'
import { fmtDate } from '@/lib/format'
import {
  normalizePhoneNumberForTel,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'

export interface EnquiryCardProps {
  enquiry: any
  onViewDossier: (enquiry: any) => void
  onLogFollowUp: (enquiry: any) => void
  onStartApplication: (enquiry: any) => void
  onConvertToApplication: (enquiry: any) => void
  isSelected?: boolean
  onSelect?: (enquiry: any) => void
  busy?: boolean
  schoolName?: string
}

export function EnquiryCard({
  enquiry: e,
  onViewDossier,
  onLogFollowUp,
  onStartApplication,
  onConvertToApplication,
  isSelected = false,
  onSelect,
  busy = false,
  schoolName = 'PreOne',
}: EnquiryCardProps) {
  const isOverdue = e.nextFollowUpAt && new Date(e.nextFollowUpAt) < new Date()
  const telUrl = normalizePhoneNumberForTel(e.phone)
  const whatsAppUrl = buildWhatsAppChatUrl(
    e.phone,
    `Hello, I am contacting you regarding your admission enquiry with ${schoolName}${e.childName ? ` for ${e.childName}` : ''}.`
  )

  const handleCardKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      onViewDossier(e)
    }
  }

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Enquiry ${e.leadNumber} for ${e.parentName}. Status: ${e.status}. Tap to view details.`}
      onClick={() => onViewDossier(e)}
      onKeyDown={handleCardKeyDown}
      className={`group relative rounded-2xl border p-4 sm:p-4.5 bg-card text-card-foreground shadow-xs transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary select-none ${
        isSelected
          ? 'border-primary ring-2 ring-primary/30 bg-primary/[0.03]'
          : 'border-border/80 hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      <div className="space-y-3">
        {/* ── Top Bar: Reference #, Branch & Status Pill ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs font-bold text-primary tracking-tight">
              {e.leadNumber}
            </span>
            {e.branchName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 truncate max-w-[130px]">
                <Building size={10} className="shrink-0" />
                <span className="truncate">{e.branchName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <StatusPill status={e.status} size="sm" />
          </div>
        </div>

        {/* ── Child & Parent Identity ── */}
        <div className="space-y-1.5">
          {/* Child Identity */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
              <Baby size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground leading-tight truncate">
                {e.childName ? e.childName : <span className="text-muted-foreground italic font-normal text-xs">Child not specified</span>}
              </p>
              {e.childDob && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>DOB: {fmtDate(e.childDob)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Parent / Contact Identity */}
          <div className="pl-9 space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <User size={12} className="text-muted-foreground shrink-0" />
              <span className="truncate">{e.parentName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {e.phone && <span className="font-mono font-medium">{e.phone}</span>}
              {e.email && (
                <>
                  <span className="text-border">•</span>
                  <span className="truncate max-w-[160px]">{e.email}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Metadata Tags: Program, Source, Created Date ── */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
            {e.interestedProgram || 'Nursery'}
          </span>

          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
            {e.source || 'Walk-in'}
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-muted-foreground bg-muted/30 font-medium ml-auto">
            <Calendar size={11} className="text-muted-foreground" />
            <span>{fmtDate(e.createdAt)}</span>
          </span>
        </div>

        {/* ── Follow-up Reminder Due Alert ── */}
        {e.nextFollowUpAt && (
          <div
            className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
              isOverdue
                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            {isOverdue ? (
              <AlertTriangle size={13} className="shrink-0" />
            ) : (
              <Clock size={13} className="shrink-0" />
            )}
            <span className="text-[11px] font-semibold truncate">
              {isOverdue ? 'Overdue reminder:' : 'Scheduled reminder:'} {fmtDate(e.nextFollowUpAt)}
            </span>
          </div>
        )}

        {/* ── Intake Notes Snippet ── */}
        {e.notes && (
          <p className="text-[11px] text-muted-foreground bg-muted/20 border border-border/40 p-2 rounded-xl line-clamp-2 leading-relaxed">
            {e.notes}
          </p>
        )}

        {/* ── Quick Actions Footer ── */}
        <div
          className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5"
          onClick={(ev) => ev.stopPropagation()}
        >
          {/* Quick Contact Actions: Call & WhatsApp */}
          <div className="flex items-center gap-1.5">
            {telUrl ? (
              <a
                href={telUrl}
                aria-label={`Call ${e.parentName}`}
                className="btn btn-outline btn-sm h-8 px-2.5 rounded-xl text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
                title={`Call ${e.phone}`}
              >
                <Phone size={12} className="text-primary group-hover:text-inherit" />
                <span>Call</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="btn btn-outline btn-sm h-8 px-2.5 rounded-xl text-xs opacity-50 cursor-not-allowed"
                title="No phone number provided"
              >
                <Phone size={12} />
                <span>Call</span>
              </button>
            )}

            {whatsAppUrl ? (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat with ${e.parentName} on WhatsApp`}
                className="btn btn-outline btn-sm h-8 px-2.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5 transition-all shadow-xs"
                title={`WhatsApp message to ${e.phone}`}
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="btn btn-outline btn-sm h-8 px-2.5 rounded-xl text-xs opacity-50 cursor-not-allowed"
                title="No valid WhatsApp contact"
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </button>
            )}
          </div>

          {/* Workflow Status Action */}
          <div className="flex items-center gap-1.5">
            {e.status === 'QUALIFIED' && (
              <button
                type="button"
                onClick={() => onConvertToApplication(e)}
                disabled={busy}
                className="btn btn-sm h-8 px-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-xs"
                title="Convert to Admission Application"
              >
                <CheckCircle2 size={12} />
                <span>Move to App</span>
              </button>
            )}

            {e.status === 'NEW' && (
              <button
                type="button"
                onClick={() => onStartApplication(e)}
                className="btn btn-primary btn-sm h-8 px-2.5 rounded-xl text-xs font-semibold shadow-xs gap-1"
                title="Assign staff and schedule outreach"
              >
                <span>Assign</span>
              </button>
            )}

            {e.status === 'CONTACTED' && (
              <button
                type="button"
                onClick={() => onLogFollowUp(e)}
                className="btn btn-outline btn-sm h-8 px-2.5 rounded-xl text-xs font-semibold gap-1"
                title="Record follow-up notes"
              >
                <span>Follow-up</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onViewDossier(e)}
              className="btn btn-ghost btn-sm h-8 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              title="View full enquiry dossier"
            >
              <Eye size={12} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
