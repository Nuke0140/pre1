/**
 * Safe, robust phone normalization for telephonic links and WhatsApp web URLs.
 * Integrates with canonical PreOne contact utilities (@/lib/contact-utils) while
 * providing a structured PhoneNormalizationResult with display formatting,
 * protocol validation, and error attribution.
 */

import {
  normalizePhoneNumberForTel,
  normalizePhoneNumberForWhatsApp,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'

export {
  normalizePhoneNumberForTel,
  normalizePhoneNumberForWhatsApp,
  buildWhatsAppChatUrl,
}

export interface PhoneNormalizationResult {
  isValid: boolean
  display: string
  telHref: string
  whatsAppUrl?: string
  digitsOnly?: string
  reason?: string
}

export function normalizePhoneNumber(rawPhone: string | null | undefined): PhoneNormalizationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, display: '', telHref: '', reason: 'Empty phone number' }
  }

  const trimmed = rawPhone.trim()
  if (!trimmed) {
    return { isValid: false, display: '', telHref: '', reason: 'Whitespace-only phone number' }
  }

  const cleanDigits = trimmed.replace(/\D/g, '')
  if (!cleanDigits) {
    return { isValid: false, display: trimmed, telHref: '', reason: 'No digits present' }
  }

  // Length check: E.164 limits numbers to between 7 and 15 digits
  if (cleanDigits.length < 7 || cleanDigits.length > 15) {
    return { isValid: false, display: trimmed, telHref: '', reason: 'Invalid phone length' }
  }

  // Delegate WhatsApp canonical normalization (handles 10-digit Indian mobiles -> 91..., trunk 0 -> 91..., international 11-15 digits)
  const waDigits = normalizePhoneNumberForWhatsApp(trimmed)
  // Generates canonical WhatsApp click-to-chat URL via trusted https://wa.me/ protocol
  const whatsAppUrl = waDigits ? `https://wa.me/${waDigits}` : (buildWhatsAppChatUrl(trimmed) || undefined)

  if (waDigits) {
    // E.164 valid number with international country code
    const telHref = `tel:+${waDigits}`

    // Format display string nicely for Indian mobile numbers
    let display = trimmed
    if (waDigits.startsWith('91') && waDigits.length === 12) {
      const mob = waDigits.slice(2)
      display = `+91 ${mob.slice(0, 5)} ${mob.slice(5)}`
    }

    return {
      isValid: true,
      display,
      telHref,
      whatsAppUrl,
      digitsOnly: waDigits,
    }
  }

  // Fallback to canonical tel normalization for shorter/local landlines (e.g. 7-9 digits)
  const telFallback = normalizePhoneNumberForTel(trimmed)
  if (telFallback) {
    return {
      isValid: true,
      display: trimmed,
      telHref: telFallback,
      digitsOnly: cleanDigits,
    }
  }

  return { isValid: false, display: trimmed, telHref: '', reason: 'Unrecognized phone format' }
}
