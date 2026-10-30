'use client'

import React, { useState, useEffect } from 'react'
import { PLogoMark } from '@/components/preone/PLogo'
import { Building2 } from 'lucide-react'

export interface AuthBrandProps {
  tagline?: string
  logoSize?: number
  className?: string
  logoUrl?: string | null
  schoolName?: string
  campusName?: string | null
  loading?: boolean
}

/**
 * Reusable AuthBrand component.
 * Displays the school's configured logo if available, or falls back to
 * the authentic PreOne brand mark with generous breathing room.
 * Resilient against broken image URLs, responsive, and accessible.
 */
export function AuthBrand({
  tagline = 'Nurturing Little Futures',
  logoSize = 62,
  className = '',
  logoUrl,
  schoolName,
  campusName,
  loading = false,
}: AuthBrandProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset state when logoUrl changes
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
  }, [logoUrl])

  const showCustomLogo = Boolean(logoUrl && !imageError)

  return (
    <div className={`auth-brand text-center mb-4 sm:mb-6 relative z-10 ${className}`}>
      {/* Product / School Brand Anchor */}
      <div className="auth-stagger-1 flex justify-center mb-2 sm:mb-3.5 transition-transform duration-300 hover:scale-105">
        {logoUrl ? (
          !imageError ? (
            <div className="relative flex items-center justify-center min-h-[56px] max-h-16">
              {!imageLoaded && (
                <div className="absolute inset-0 h-16 w-32 rounded-xl bg-purple-100/40 dark:bg-purple-950/30 animate-pulse" />
              )}
              <img
                src={logoUrl}
                alt={schoolName ? `${schoolName} Logo` : 'School Brand Logo'}
                className={`h-14 sm:h-16 max-h-16 max-w-[220px] sm:max-w-[260px] object-contain rounded-lg drop-shadow-sm transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <PLogoMark size={logoSize} animateOrbit={true} />
          )
        ) : (
          <PLogoMark size={logoSize} animateOrbit={true} />
        )}
      </div>

      {/* Prominent School Name Display with wrapping */}
      {loading ? (
        <div className="h-6 w-44 bg-slate-200/60 dark:bg-slate-800/60 rounded-md mx-auto mb-2 animate-pulse" />
      ) : schoolName ? (
        <div className="auth-stagger-2 mb-1 px-2" data-testid="auth-school-name">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight break-words max-w-xs sm:max-w-sm mx-auto">
            {schoolName}
          </h2>
          {campusName && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide">
              {campusName}
            </p>
          )}
        </div>
      ) : null}

      {/* Brand Tagline Badge */}
      {tagline && (
        <div className="auth-stagger-2 auth-tagline-badge flex justify-center mt-1.5">
          <span className="inline-flex items-center text-[11px] sm:text-xs font-semibold tracking-wide text-purple-700 dark:text-purple-300 bg-purple-50/90 dark:bg-purple-950/60 px-3.5 py-1 rounded-full border border-purple-200/70 dark:border-purple-800/60 shadow-2xs">
            {tagline}
          </span>
        </div>
      )}
    </div>
  )
}
