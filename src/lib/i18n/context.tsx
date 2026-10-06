'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SupportedLocale, DEFAULT_LOCALE, normalizeLocale } from './types'
import { getTranslation, formatCurrencyLocale, formatDateLocale, formatNumberLocale } from './index'

interface I18nContextValue {
  locale: SupportedLocale
  setLocale: (newLocale: SupportedLocale) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
  formatCurrency: (paise: number) => string
  formatDate: (d: string | Date | null | undefined) => string
  formatNumber: (val: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: string | null
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => normalizeLocale(initialLocale))

  useEffect(() => {
    // Sync document element lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const setLocale = useCallback(async (newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }

    try {
      // Persist to user profile / cookie
      await fetch('/api/v1/users/locale', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      })
    } catch (err) {
      console.warn('[i18n] Failed to persist locale to user profile:', err)
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => getTranslation(key, locale, params),
    [locale]
  )

  const formatCurrency = useCallback(
    (paise: number) => formatCurrencyLocale(paise, locale),
    [locale]
  )

  const formatDate = useCallback(
    (d: string | Date | null | undefined) => formatDateLocale(d, locale),
    [locale]
  )

  const formatNumber = useCallback(
    (val: number) => formatNumberLocale(val, locale),
    [locale]
  )

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatCurrency,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Safe fallback if used outside provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: async () => {},
      t: (key: string, params?: Record<string, string | number>) => getTranslation(key, DEFAULT_LOCALE, params),
      formatCurrency: (paise: number) => formatCurrencyLocale(paise, DEFAULT_LOCALE),
      formatDate: (d: string | Date | null | undefined) => formatDateLocale(d, DEFAULT_LOCALE),
      formatNumber: (val: number) => formatNumberLocale(val, DEFAULT_LOCALE),
    }
  }
  return ctx
}
