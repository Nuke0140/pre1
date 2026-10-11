export type SupportedLocale = 'en-IN' | 'hi-IN' | 'mr-IN'

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string; nativeName: string }[] = [
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
]

export const DEFAULT_LOCALE: SupportedLocale = 'en-IN'

export function isSupportedLocale(val: unknown): val is SupportedLocale {
  return typeof val === 'string' && (val === 'en-IN' || val === 'hi-IN' || val === 'mr-IN')
}

export function normalizeLocale(locale?: string | null): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE
  const clean = locale.trim().toLowerCase()
  if (clean.startsWith('hi')) return 'hi-IN'
  if (clean.startsWith('mr')) return 'mr-IN'
  if (clean.startsWith('en')) return 'en-IN'
  return DEFAULT_LOCALE
}
