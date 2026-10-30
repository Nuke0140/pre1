'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { BrandingConfig } from './branding'

export interface BrandingContextValue {
  branding: BrandingConfig | null
  refresh: () => Promise<BrandingConfig | null>
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

// In-memory module cache so even across unmounts or before context mounts, client has synchronous access
let cachedBranding: BrandingConfig | null = null

export function getCachedBranding(): BrandingConfig | null {
  return cachedBranding
}

export function setCachedBranding(branding: BrandingConfig | null) {
  cachedBranding = branding
}

/**
 * Broadcasts branding updates globally to all mounted components and windows.
 */
export function broadcastBrandingUpdate(updated: BrandingConfig) {
  cachedBranding = updated
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('preone:branding-updated', { detail: updated }))
      localStorage.setItem('preone_branding_sync', JSON.stringify({ ...updated, _ts: Date.now() }))
    } catch {}
  }
}

export function BrandingProvider({
  branding,
  children,
}: {
  branding?: BrandingConfig | null
  children: React.ReactNode
}) {
  const [currentBranding, setCurrentBranding] = useState<BrandingConfig | null>(
    branding || cachedBranding
  )

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/branding')
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data as BrandingConfig
        cachedBranding = d
        setCurrentBranding(d)
        broadcastBrandingUpdate(d)
        return d
      }
    } catch {}
    return null
  }, [])

  useEffect(() => {
    if (branding) {
      cachedBranding = branding
      setCurrentBranding(branding)
    }
  }, [branding])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        setCurrentBranding(detail)
        cachedBranding = detail
      } else {
        refresh()
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'preone_branding_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          delete parsed._ts
          setCurrentBranding(parsed)
          cachedBranding = parsed
        } catch {}
      }
    }

    window.addEventListener('preone:branding-updated', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('preone:branding-updated', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [refresh])

  return (
    <BrandingContext.Provider value={{ branding: currentBranding, refresh }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingConfig | null {
  const ctx = useContext(BrandingContext)
  return ctx?.branding || cachedBranding
}

export function useBrandingController() {
  const ctx = useContext(BrandingContext)
  return {
    branding: ctx?.branding || cachedBranding,
    refresh: ctx?.refresh || (async () => null),
  }
}
