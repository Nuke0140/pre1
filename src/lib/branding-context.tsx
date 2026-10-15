'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { BrandingConfig } from './branding'

const BrandingContext = createContext<BrandingConfig | null>(null)

// In-memory module cache so even across unmounts or before context mounts, client has synchronous access
let cachedBranding: BrandingConfig | null = null

export function getCachedBranding(): BrandingConfig | null {
  return cachedBranding
}

export function setCachedBranding(branding: BrandingConfig | null) {
  cachedBranding = branding
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

  useEffect(() => {
    if (branding) {
      cachedBranding = branding
      setCurrentBranding(branding)
    }
  }, [branding])

  return (
    <BrandingContext.Provider value={currentBranding}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingConfig | null {
  const ctx = useContext(BrandingContext)
  return ctx || cachedBranding
}
