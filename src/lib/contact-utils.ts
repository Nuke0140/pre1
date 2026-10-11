/**
 * PreOne — Canonical Contact & Calling Utilities
 *
 * Normalizes telephone and WhatsApp contacts for mobile action links.
 * Handles Indian numbers, country codes, international formatting, and null fallbacks.
 */

/**
 * Normalizes phone number into a safe tel: URI.
 * Returns null if the phone is missing, too short, or invalid.
 */
export function normalizePhoneNumberForTel(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null
  const cleaned = phone.trim().replace(/[^\d+]/g, '')
  if (cleaned.length < 7 || cleaned.length > 16) return null
  return `tel:${cleaned}`
}

/**
 * Normalizes phone number for WhatsApp wa.me links.
 * Indian 10-digit numbers are converted to E.164 with the 91 prefix.
 * Strips leading 0 from 11-digit numbers.
 * Returns null if the phone is invalid or unconfigured.
 */
export function normalizePhoneNumberForWhatsApp(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  if (digits.length === 10) {
    return `91${digits}`
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits
  }
  return null
}

/**
 * Constructs a safe, sanitized WhatsApp click-to-chat URL with an optional prefilled message.
 * Returns null if the phone number is invalid.
 */
export function buildWhatsAppChatUrl(
  phone?: string | null,
  prefilledText?: string | null
): string | null {
  const normalized = normalizePhoneNumberForWhatsApp(phone)
  if (!normalized) return null

  if (prefilledText && prefilledText.trim()) {
    return `https://wa.me/${normalized}?text=${encodeURIComponent(prefilledText.trim())}`
  }
  return `https://wa.me/${normalized}`
}
