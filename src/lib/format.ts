import { formatCurrencyLocale, formatDateLocale, formatDateTimeLocale, getTranslation, getGlobalLocale } from './i18n'

/** Money is stored as integer paise. Display in ₹ according to active locale. */
export function inr(paise: number, opts?: { compact?: boolean }): string {
  const currentLocale = getGlobalLocale()
  const rupees = paise / 100
  if (opts?.compact && rupees >= 100000) {
    if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`
    return `₹${(rupees / 100000).toFixed(2)} L`
  }
  return formatCurrencyLocale(paise, currentLocale)
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return formatDateLocale(d, getGlobalLocale())
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return formatDateTimeLocale(d, getGlobalLocale())
}

export function timeAgo(d: string | Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Localized enum label:
 * 1. Looks up `status.${v}` in active translation dictionary
 * 2. Falls back to Title Case English ("PARTIALLY_PAID" -> "Partially Paid")
 */
export function enumLabel(v: string | null | undefined): string {
  if (!v) return '—'
  const cleanKey = v.trim().toUpperCase()
  const translated = getTranslation(`status.${cleanKey}`)
  if (translated && translated !== `status.${cleanKey}`) {
    return translated
  }
  return v
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function initials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

const AVATAR_CLASSES = ['a-p', 'a-b', 'a-k', 'a-o', 'a-g', 'a-c', 'a-y', 'a-n']
export function avatarClass(seed?: string | null): string {
  if (!seed || typeof seed !== 'string') return AVATAR_CLASSES[0]!
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_CLASSES[h % AVATAR_CLASSES.length]!
}
