'use client'

import React from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import {
  normalizePhoneNumberForTel,
  normalizePhoneNumberForWhatsApp,
} from '@/lib/contact-utils'

export interface DirectContactButtonGroupProps {
  phone?: string | null
  parentName?: string | null
  onOpenCall: () => void
  onOpenWhatsApp: () => void
  size?: 'sm' | 'md'
  showLabels?: boolean
  className?: string
}

/**
 * DirectContactButtonGroup
 *
 * A compact, accessible 1-click communication action group for WhatsApp and phone calls.
 * Displays green WhatsApp icon with pre-fill template trigger and phone call icon
 * with integrated outcome-logging dialog.
 */
export function DirectContactButtonGroup({
  phone,
  parentName,
  onOpenCall,
  onOpenWhatsApp,
  size = 'sm',
  showLabels = false,
  className = '',
}: DirectContactButtonGroupProps) {
  const telUrl = normalizePhoneNumberForTel(phone)
  const isWhatsAppValid = Boolean(normalizePhoneNumberForWhatsApp(phone))

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Open tel: link on device if valid
    if (telUrl && typeof window !== 'undefined') {
      window.location.href = telUrl
    }
    // Immediately open Call Log dialog so staff can record the outcome
    onOpenCall()
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onOpenWhatsApp()
  }

  const btnHeight = size === 'sm' ? 'h-7.5 px-2 text-xs' : 'h-8.5 px-2.5 text-xs'
  const iconSize = size === 'sm' ? 12 : 13

  return (
    <div
      className={`inline-flex items-center gap-1 shrink-0 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Call Button */}
      {telUrl ? (
        <button
          type="button"
          onClick={handleCallClick}
          aria-label={`Call ${parentName || 'Parent'}`}
          title={`Call ${phone} and log outcome`}
          className={`btn btn-outline ${btnHeight} rounded-xl font-semibold gap-1.5 hover:bg-primary/10 hover:text-primary transition-all shadow-2xs`}
        >
          <Phone size={iconSize} className="text-primary" />
          {showLabels && <span>Call</span>}
        </button>
      ) : (
        <button
          type="button"
          disabled
          aria-label="No phone number available"
          title="No phone number provided"
          className={`btn btn-outline ${btnHeight} rounded-xl opacity-40 cursor-not-allowed`}
        >
          <Phone size={iconSize} />
          {showLabels && <span>Call</span>}
        </button>
      )}

      {/* WhatsApp Button */}
      {isWhatsAppValid ? (
        <button
          type="button"
          onClick={handleWhatsAppClick}
          aria-label={`Send WhatsApp message to ${parentName || 'Parent'}`}
          title={`Open WhatsApp template message for ${phone}`}
          className={`btn btn-outline ${btnHeight} rounded-xl font-semibold gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-all shadow-2xs`}
        >
          <MessageCircle size={iconSize} className="text-emerald-500 fill-emerald-500/20" />
          {showLabels && <span>WhatsApp</span>}
        </button>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Invalid WhatsApp phone number"
          title="No valid mobile phone number for WhatsApp"
          className={`btn btn-outline ${btnHeight} rounded-xl opacity-40 cursor-not-allowed`}
        >
          <MessageCircle size={iconSize} />
          {showLabels && <span>WhatsApp</span>}
        </button>
      )}
    </div>
  )
}
