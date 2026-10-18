'use client'

import React from 'react'
import {
  Phone,
  MessageCircle,
  AlertTriangle,
  User,
  Shield,
  ExternalLink,
} from 'lucide-react'
import {
  normalizePhoneNumberForTel,
  buildWhatsAppChatUrl,
  formatGuardianCallLabel,
} from '@/lib/contact-utils'
import { enumLabel } from '@/lib/format'

export interface GuardianContactInfo {
  id?: string
  name: string
  phone?: string | null
  email?: string | null
  relationship?: string | null
  isPrimary?: boolean
  isEmergencyContact?: boolean
  emergencyPriority?: number | null
}

export interface StudentGuardianQuickActionsProps {
  /** The primary guardian for routine calls and WhatsApp */
  guardian?: GuardianContactInfo | null
  /** Optional separate emergency contact if distinct from primary */
  emergencyContact?: GuardianContactInfo | null
  /** Optional child name for neutral, safe WhatsApp template */
  childName?: string | null
  /** Visual density variant: 'card' (compact icon/pill), 'drawer' (prominent split), 'inline' (table cell), 'full' (profile header) */
  variant?: 'card' | 'drawer' | 'inline' | 'full'
  /** Show emergency action if distinct emergency contact is present */
  showEmergency?: boolean
  /** Compact call button label without first name */
  compactLabel?: boolean
  /** Custom extra CSS classes */
  className?: string
  /** Callback when call action is triggered */
  onCallInitiated?: (guardian: GuardianContactInfo) => void
  /** Callback when WhatsApp is triggered */
  onWhatsAppOpened?: (guardian: GuardianContactInfo) => void
}

export function StudentGuardianQuickActions({
  guardian,
  emergencyContact,
  childName,
  variant = 'card',
  showEmergency = true,
  compactLabel = false,
  className = '',
  onCallInitiated,
  onWhatsAppOpened,
}: StudentGuardianQuickActionsProps) {
  // If neither primary nor emergency contact is provided
  if (!guardian && !emergencyContact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-slate-400 italic ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <User size={13} className="text-slate-300 dark:text-slate-600 shrink-0" />
        <span>No guardian contact</span>
      </div>
    )
  }

  // Active target for primary contact
  const targetGuardian = guardian || emergencyContact!
  const telLink = normalizePhoneNumberForTel(targetGuardian.phone)
  
  // Neutral, safe WhatsApp prefilled message without sensitive medical or personal diagnoses
  const waPrefill = childName
    ? `Hello, this is the preschool contacting you regarding ${childName}. Please contact us when available.`
    : `Hello, this is the preschool contacting you regarding your child. Please contact us when available.`
  
  const waLink = buildWhatsAppChatUrl(targetGuardian.phone, waPrefill)

  const callLabel = formatGuardianCallLabel(targetGuardian, {
    isEmergency: targetGuardian.isEmergencyContact && !targetGuardian.isPrimary,
    compact: compactLabel,
  })

  // Determine if a separate emergency contact button should be rendered
  const distinctEmergency =
    showEmergency &&
    emergencyContact &&
    emergencyContact.phone &&
    emergencyContact.phone !== targetGuardian.phone
      ? emergencyContact
      : null

  const emergencyTelLink = distinctEmergency
    ? normalizePhoneNumberForTel(distinctEmergency.phone)
    : null

  const emergencyCallLabel = distinctEmergency
    ? formatGuardianCallLabel(distinctEmergency, { isEmergency: true, compact: compactLabel })
    : null

  const handleCallClick = (e: React.MouseEvent, g: GuardianContactInfo) => {
    e.stopPropagation()
    if (onCallInitiated) onCallInitiated(g)
  }

  const handleWhatsAppClick = (e: React.MouseEvent, g: GuardianContactInfo) => {
    e.stopPropagation()
    if (onWhatsAppOpened) onWhatsAppOpened(g)
  }

  // ── VARIANT 1: CARD (Compact for Roster Cards & Grid) ──
  if (variant === 'card') {
    return (
      <div
        className={`flex items-center gap-1.5 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {telLink ? (
          <a
            href={telLink}
            onClick={(e) => handleCallClick(e, targetGuardian)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 shadow-2xs transition-all active:scale-[0.98] group/call truncate max-w-[170px]"
            title={`Call: ${targetGuardian.name} (${targetGuardian.phone})`}
          >
            <Phone size={11} className="text-purple-600 dark:text-purple-400 shrink-0 group-hover/call:scale-110 transition-transform" />
            <span className="truncate">{callLabel}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
            title="No verified telephone number on file"
          >
            <Phone size={11} />
            <span className="truncate">No Phone</span>
          </button>
        )}

        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleWhatsAppClick(e, targetGuardian)}
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shadow-2xs transition-all active:scale-[0.98] shrink-0"
            title={`WhatsApp ${targetGuardian.name}`}
            aria-label={`WhatsApp ${targetGuardian.name}`}
          >
            <MessageCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
          </a>
        ) : null}

        {distinctEmergency && emergencyTelLink ? (
          <a
            href={emergencyTelLink}
            onClick={(e) => handleCallClick(e, distinctEmergency)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 shadow-2xs transition-all active:scale-[0.98] shrink-0"
            title={`Emergency Contact: ${distinctEmergency.name} (${distinctEmergency.phone})`}
          >
            <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>SOS</span>
          </a>
        ) : null}
      </div>
    )
  }

  // ── VARIANT 2: INLINE (Compact Table Cell) ──
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-1.5 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {telLink ? (
          <a
            href={telLink}
            onClick={(e) => handleCallClick(e, targetGuardian)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200/60 dark:border-slate-700 transition-colors"
            title={`Call ${targetGuardian.name} (${targetGuardian.phone})`}
          >
            <Phone size={11} className="text-purple-600 dark:text-purple-400" />
            <span className="font-mono text-[11px]">{targetGuardian.phone}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">No phone</span>
        )}

        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleWhatsAppClick(e, targetGuardian)}
            className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0"
            title={`WhatsApp ${targetGuardian.name}`}
            aria-label={`WhatsApp ${targetGuardian.name}`}
          >
            <MessageCircle size={13} />
          </a>
        ) : null}
      </div>
    )
  }

  // ── VARIANT 3: DRAWER / FULL (Prominent Two-Column or Hero Buttons) ──
  return (
    <div
      className={`space-y-2 w-full ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-2">
        {telLink ? (
          <a
            href={telLink}
            onClick={(e) => handleCallClick(e, targetGuardian)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs group"
            title={`Call: ${targetGuardian.name} (${targetGuardian.phone})`}
          >
            <Phone size={14} className="group-hover:scale-110 transition-transform" />
            <span className="truncate">{callLabel}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed opacity-60"
            title="No phone number on file"
          >
            <Phone size={14} />
            <span>No Phone</span>
          </button>
        )}

        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleWhatsAppClick(e, targetGuardian)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs group"
            title={`WhatsApp ${targetGuardian.name}`}
          >
            <MessageCircle size={14} className="group-hover:scale-110 transition-transform" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed opacity-60"
            title="WhatsApp unavailable (invalid or missing phone)"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>
        )}
      </div>

      {distinctEmergency && emergencyTelLink ? (
        <a
          href={emergencyTelLink}
          onClick={(e) => handleCallClick(e, distinctEmergency)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-xs font-bold transition-all shadow-2xs group"
          title={`Call Emergency Contact: ${distinctEmergency.name} (${distinctEmergency.phone})`}
        >
          <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          <span>{emergencyCallLabel}</span>
        </a>
      ) : null}
    </div>
  )
}
