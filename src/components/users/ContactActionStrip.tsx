'use client'

import React, { useState } from 'react'
import { Phone, MessageCircle, Copy, Check } from 'lucide-react'
import { normalizePhoneNumber } from '@/lib/users/phone-utils'
import { useToast } from '@/components/preone/Toast'
import { useI18n } from '@/lib/i18n'

export interface ContactActionStripProps {
  name: string
  phone?: string | null
  email?: string | null
  className?: string
  alwaysVisible?: boolean
}

export function ContactActionStrip({
  name,
  phone,
  email,
  className = '',
  alwaysVisible = false,
}: ContactActionStripProps) {
  const { t } = useI18n()
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const phoneRes = normalizePhoneNumber(phone)
  const hasValidPhone = phoneRes.isValid
  const hasValidEmail = Boolean(email && email.trim() && email.includes('@'))

  if (!hasValidPhone && !hasValidEmail) {
    return null
  }

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!email) return

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email)
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = email
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      toast.success(t('users.emailCopied') || 'Email copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('users.copyEmailFailed') || 'Failed to copy email address')
    }
  }

  const visibilityClass = alwaysVisible
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 pointer-events-auto sm:transition-opacity sm:duration-150'

  return (
    <div
      className={`contact-action-strip inline-flex items-center gap-1 shrink-0 ${visibilityClass} ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label={`Contact shortcuts for ${name}`}
    >
      {/* 1. Phone Call Action */}
      {hasValidPhone && (
        <a
          href={phoneRes.telHref}
          className="p-1 rounded-md text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          title={`Call ${name} (${phoneRes.display})`}
          aria-label={`Call ${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        </a>
      )}

      {/* 2. WhatsApp Direct Message Action */}
      {hasValidPhone && phoneRes.whatsAppUrl && (
        <a
          href={phoneRes.whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-md text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-800/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          title={`WhatsApp ${name} (${phoneRes.display})`}
          aria-label={`WhatsApp ${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        </a>
      )}

      {/* 3. Copy Email Action */}
      {hasValidEmail && (
        <button
          type="button"
          onClick={handleCopyEmail}
          className="p-1 rounded-md text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/80 dark:border-slate-800/80 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          title={copied ? 'Copied!' : `Copy ${email}`}
          aria-label={`Copy email address for ${name}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
}
