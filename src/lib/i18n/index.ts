import { enIN } from './locales/en-IN'
import { hiIN } from './locales/hi-IN'
import { mrIN } from './locales/mr-IN'
import { SupportedLocale, DEFAULT_LOCALE, normalizeLocale } from './types'

export type TranslationCatalog = typeof enIN

export const catalogs: Record<SupportedLocale, TranslationCatalog> = {
  'en-IN': enIN,
  'hi-IN': hiIN,
  'mr-IN': mrIN,
}

// Active locale singleton for non-React contexts (formatters, data-tables, etc.)
let currentGlobalLocale: SupportedLocale = DEFAULT_LOCALE

export function setGlobalLocale(locale: SupportedLocale) {
  currentGlobalLocale = normalizeLocale(locale)
}

export function getGlobalLocale(): SupportedLocale {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang
    if (lang === 'hi-IN' || lang === 'mr-IN' || lang === 'en-IN') {
      return lang
    }
  }
  return currentGlobalLocale
}

/**
 * Nested key lookup with fallback to en-IN.
 * E.g., t('common.save', 'mr-IN') -> 'जतन करा'
 */
export function getTranslation(key: string, locale?: SupportedLocale, params?: Record<string, string | number>): string {
  const normLocale = normalizeLocale(locale || getGlobalLocale())
  const dict = catalogs[normLocale] || enIN

  const parts = key.split('.')
  let current: any = dict
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      current = undefined
      break
    }
  }

  // Fallback to en-IN if not found
  if (typeof current !== 'string') {
    let fallback: any = enIN
    for (const part of parts) {
      if (fallback && typeof fallback === 'object' && part in fallback) {
        fallback = fallback[part]
      } else {
        fallback = undefined
        break
      }
    }
    current = typeof fallback === 'string' ? fallback : key
  }

  // Parameter replacement: {name} -> 'Aarav'
  if (params && typeof current === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      current = (current as string).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    })
  }

  return current
}

/** Formatter helpers aligned with locale */
export function formatCurrencyLocale(paise: number, locale?: SupportedLocale): string {
  const normLocale = normalizeLocale(locale || getGlobalLocale())
  const rupees = paise / 100
  return new Intl.NumberFormat(normLocale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees)
}

export function formatDateLocale(d: string | Date | null | undefined, locale?: SupportedLocale): string {
  if (!d) return '—'
  const normLocale = normalizeLocale(locale || getGlobalLocale())
  return new Date(d).toLocaleDateString(normLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTimeLocale(d: string | Date | null | undefined, locale?: SupportedLocale): string {
  if (!d) return '—'
  const normLocale = normalizeLocale(locale || getGlobalLocale())
  return new Date(d).toLocaleString(normLocale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumberLocale(val: number, locale?: SupportedLocale): string {
  const normLocale = normalizeLocale(locale || getGlobalLocale())
  return new Intl.NumberFormat(normLocale).format(val)
}

// Re-export context and hook so `@/lib/i18n` can be imported directly anywhere
export * from './context'
export * from './types'
