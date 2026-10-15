'use client'

import React, { useState } from 'react'
import { PreOnePlanetMark } from './PreOneLauncherButton'
import { useBranding } from '@/lib/branding'

export type BookLoaderMode = 'fullPage' | 'page' | 'section' | 'compact'
export type BookLoaderSize = 'sm' | 'md' | 'lg'

export interface BookPageLoaderProps {
  /**
   * Display mode:
   * - 'fullPage': Fixed full-screen overlay (covers entire viewport, z-[1000])
   * - 'page': Occupies the main content area inside AppShell (centered, min-h-[calc(100vh-220px)])
   * - 'section': Centered inside a card, tab, or modal drawer (min-h-[260px])
   * - 'compact': Inline mini loader (e.g. status badge or action placeholder)
   */
  mode?: BookLoaderMode
  /** Visual scale of the illustration */
  size?: BookLoaderSize
  /**
   * Optional custom/tenant logo URL override.
   * If omitted, automatically resolves Priority 1 (Configured School Logo from System Settings).
   * If absent or broken, gracefully falls back to Priority 2 (Official PreOne default logo).
   */
  logoUrl?: string | null
  /** Additional custom container classes */
  className?: string
  /** Accessible label announced to screen readers. Never rendered visually. */
  ariaLabel?: string
}

const SIZE_CONFIGS: Record<BookLoaderSize, { width: number; height: number; logoSize: number }> = {
  sm: { width: 180, height: 150, logoSize: 26 },
  md: { width: 220, height: 184, logoSize: 32 },
  lg: { width: 260, height: 216, logoSize: 38 },
}

/**
 * PreOne Global Animated Book Loader
 *
 * Professional educational book loader where soft layered pages genuinely turn around
 * the central spine, framed by a serene orbital multi-gradient progress ring and celestial sparkles,
 * with the dynamically resolved School Logo nestled directly above the book spine.
 *
 * PRECEDENCE RULES:
 * Priority 1 — Configured School Logo from System Settings (Tenant.logoUrl / getEffectiveBranding)
 * Priority 2 — Official PreOne default logo (/preone-mark.svg or retina PreOnePlanetMark)
 * Never uses menu/header logos as an independent fallback.
 *
 * MOTION QUALITY:
 * - Hardcover base, spine, and logo remain 100% rock-solid and stationary.
 * - Genuine 3D physical page-turn sequence around the vertical spine axis (no gelatin/watery wave, no skew).
 * - Receiving page soft cushion settle.
 */
export function BookPageLoader({
  mode = 'section',
  size = 'md',
  logoUrl: propLogoUrl,
  className = '',
  ariaLabel = 'Loading content',
}: BookPageLoaderProps) {
  const contextBranding = useBranding()
  const [imgError, setImgError] = useState(false)
  const [officialImgError, setOfficialImgError] = useState(false)

  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md

  // ── Canonical Logo Precedence Resolution ──
  // Priority 1: Primary school logo configured in System Settings (Tenant.logoUrl)
  // Priority 2: Official PreOne default logo asset in repository
  const configuredSchoolLogo = propLogoUrl !== undefined ? propLogoUrl : contextBranding?.logoUrl
  const effectiveSchoolLogo = !imgError && configuredSchoolLogo && typeof configuredSchoolLogo === 'string' && configuredSchoolLogo.trim()
    ? configuredSchoolLogo.trim()
    : null

  // Container styling per mode with strict visual centering
  const containerModeClasses = {
    fullPage:
      'fixed inset-0 z-[1000] flex items-center justify-center bg-white/85 dark:bg-slate-950/85 backdrop-blur-xs transition-opacity duration-300',
    page:
      'relative w-full flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-220px)] py-12',
    section:
      'relative w-full flex flex-col items-center justify-center min-h-[260px] py-8',
    compact:
      'relative inline-flex items-center justify-center p-1',
  }[mode]

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`preone-book-loader-container ${containerModeClasses} ${className}`}
    >
      {/* ── Visual Stage (Centered Canvas with Exact Proportions) ── */}
      <div
        className="preone-book-loader-visual relative select-none flex items-center justify-center"
        style={{ width: cfg.width, height: cfg.height, perspective: 800 }}
        aria-hidden="true"
      >
        {/* ── 1. Soft Radial Glow / Brand Aura ── */}
        <div
          className="preone-book-aura absolute inset-0 pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(0, 112, 243, 0.12), rgba(124, 58, 237, 0.06), transparent 70%)',
          }}
        />

        {/* ── 2. SVG Vector Composition (Spine, Pages, Ring, Sparkles) ── */}
        <svg
          viewBox="0 0 240 200"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="preone-book-svg block w-full h-full overflow-visible"
        >
          <defs>
            {/* Hardcover Royal Blue Gradient */}
            <linearGradient id="po-book-cover-grad" x1="40" y1="140" x2="200" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="48%" stopColor="#0052CC" />
              <stop offset="52%" stopColor="#0046B3" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>

            {/* Hardcover Bottom Rim Shadow */}
            <linearGradient id="po-book-rim-grad" x1="120" y1="150" x2="120" y2="175" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#003D99" />
              <stop offset="100%" stopColor="#00245E" />
            </linearGradient>

            {/* Left Page Surface Gradient */}
            <linearGradient id="po-page-left-grad" x1="120" y1="130" x2="40" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="15%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Right Page Surface Gradient */}
            <linearGradient id="po-page-right-grad" x1="120" y1="130" x2="200" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="15%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Turning Leaf Gradient Face */}
            <linearGradient id="po-leaf-turning-grad" x1="120" y1="130" x2="190" y2="145" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>

            {/* Center Spine Fold Shadow */}
            <linearGradient id="po-spine-shadow" x1="117" y1="130" x2="123" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(15, 23, 42, 0.02)" />
              <stop offset="50%" stopColor="rgba(15, 23, 42, 0.22)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.02)" />
            </linearGradient>

            {/* Progress Ring Orbit Gradient: Cyan -> Blue -> Violet -> Magenta */}
            <linearGradient id="po-ring-grad" x1="70" y1="35" x2="170" y2="135" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00DFD8" />
              <stop offset="30%" stopColor="#0070F3" />
              <stop offset="70%" stopColor="#7928CA" />
              <stop offset="100%" stopColor="#FF0080" />
            </linearGradient>

            {/* Soft Drop Shadow for Stationary Book Base */}
            <filter id="po-book-shadow" x="20" y="130" width="200" height="60" filterUnits="userSpaceOnUse">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4.5" />
              <feOffset dx="0" dy="6" />
              <feComponentTransfer><feFuncA type="linear" slope="0.16" /></feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── 3. Subtle Circular Progress Ring (Framing the Logo) ── */}
          <g className="preone-book-ring-group" transform="translate(120, 84)">
            {/* Inactive Subtle Circular Track */}
            <circle
              cx="0"
              cy="0"
              r="52"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-200 dark:text-slate-800"
              opacity="0.45"
              fill="none"
            />

            {/* Rotating Active Progress Arc */}
            <circle
              cx="0"
              cy="0"
              r="52"
              stroke="url(#po-ring-grad)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="110 220"
              fill="none"
              className="preone-book-progress-arc"
            />

            {/* Orbiting Satellite Dot / Highlight */}
            <g className="preone-book-orbit-satellite">
              <circle cx="0" cy="-52" r="3.5" fill="#00DFD8" filter="drop-shadow(0 0 3px #00DFD8)" />
            </g>
          </g>

          {/* ── 4. Decorative Celestial Sparkles (Restrained & Close to Center) ── */}
          <path
            d="M 54 48 Q 58 48 58 44 Q 58 48 62 48 Q 58 48 58 52 Q 58 48 54 48 Z"
            fill="#F59E0B"
            className="preone-sparkle preone-sparkle-1"
          />
          <path
            d="M 182 44 Q 186 44 186 40 Q 186 44 190 44 Q 186 44 186 48 Q 186 44 182 44 Z"
            fill="#00E5FF"
            className="preone-sparkle preone-sparkle-2"
          />
          <path
            d="M 38 106 Q 42 106 42 102 Q 42 106 46 106 Q 42 106 42 110 Q 42 106 38 106 Z"
            fill="#A855F7"
            className="preone-sparkle preone-sparkle-3"
          />
          <path
            d="M 198 102 Q 202 102 202 98 Q 202 102 206 102 Q 202 102 202 106 Q 202 102 198 102 Z"
            fill="#FBBF24"
            className="preone-sparkle preone-sparkle-4"
          />
          <circle cx="82" cy="32" r="1.8" fill="#38BDF8" className="preone-sparkle preone-sparkle-2" />
          <circle cx="158" cy="34" r="1.8" fill="#F43F5E" className="preone-sparkle preone-sparkle-1" />

          {/* ── 5. Open Book Illustration (Width ~164px, Anchored Base) ── */}
          <g filter="url(#po-book-shadow)">
            {/* Stationary Hardcover Outer Base / Rim */}
            <path
              d="M 38 150 C 65 154 95 163 120 164 C 145 163 175 154 202 150 L 202 159 C 175 164 145 172 120 172 C 95 172 65 164 38 159 Z"
              fill="url(#po-book-rim-grad)"
            />

            {/* Stationary Hardcover Main Wings */}
            <path
              d="M 40 147 C 67 151 97 159 120 160 C 143 159 173 151 200 147 L 200 155 C 173 160 143 167 120 168 C 97 167 67 160 40 155 Z"
              fill="url(#po-book-cover-grad)"
            />

            {/* Left Page Bottom Stack (Dense resting sheets) */}
            <path
              d="M 44 145 C 68 142 98 149 120 155 L 120 151 C 98 145 68 138 44 141 Z"
              className="fill-slate-300 dark:fill-slate-700"
            />
            {/* Right Page Bottom Stack (Dense resting sheets) */}
            <path
              d="M 196 145 C 172 142 142 149 120 155 L 120 151 C 142 145 172 138 196 141 Z"
              className="fill-slate-300 dark:fill-slate-700"
            />

            {/* Left Main Resting Page (Soft cushion response as page lands) */}
            <g className="preone-book-leaf-left-cushion" style={{ transformOrigin: '120px 148px' }}>
              <path
                d="M 120 133 C 90 120 58 125 44 141 C 66 138 98 145 120 152 Z"
                fill="url(#po-page-left-grad)"
                className="dark:fill-slate-800"
                stroke="rgba(203, 213, 225, 0.45)"
                strokeWidth="0.7"
              />
            </g>

            {/* Right Main Resting Page (Stationary) */}
            <path
              d="M 120 133 C 150 120 182 125 196 141 C 174 138 142 145 120 152 Z"
              fill="url(#po-page-right-grad)"
              className="dark:fill-slate-800"
              stroke="rgba(203, 213, 225, 0.45)"
              strokeWidth="0.7"
            />

            {/* ── Genuine 3D Book Page Turn Sequence (Hinge at X=120) ── */}
            <g
              className="preone-book-turning-page"
              style={{
                transformOrigin: '120px 148px',
                transformBox: 'fill-box',
              }}
            >
              <path
                d="M 120 132 C 148 118 178 121 192 137 C 170 135 140 143 120 150 Z"
                fill="url(#po-leaf-turning-grad)"
                className="dark:fill-slate-700"
                stroke="rgba(226, 232, 240, 0.7)"
                strokeWidth="0.75"
              />
            </g>

            {/* Stationary Center Spine Crease / Binding Shade */}
            <path
              d="M 118 132 L 122 132 L 123 154 L 117 154 Z"
              fill="url(#po-spine-shadow)"
            />
          </g>
        </svg>

        {/* ── 6. Dynamically Resolved Logo (Stationary, Perfectly Centered) ── */}
        <div
          className="preone-book-logo-anchor absolute flex items-center justify-center pointer-events-none"
          style={{
            left: '50%',
            top: '42%',
            transform: 'translate(-50%, -50%)',
            width: cfg.logoSize + 12,
            height: cfg.logoSize + 12,
          }}
        >
          <div className="preone-book-logo-stable flex items-center justify-center w-full h-full">
            {effectiveSchoolLogo ? (
              <img
                src={effectiveSchoolLogo}
                alt=""
                onError={() => setImgError(true)}
                className="object-contain drop-shadow-sm rounded transition-opacity duration-200"
                style={{
                  maxWidth: cfg.logoSize,
                  maxHeight: cfg.logoSize,
                }}
              />
            ) : !officialImgError ? (
              <img
                src="/preone-mark.svg"
                alt=""
                onError={() => setOfficialImgError(true)}
                className="object-contain drop-shadow-sm transition-opacity duration-200"
                style={{
                  maxWidth: cfg.logoSize,
                  maxHeight: cfg.logoSize,
                }}
              />
            ) : (
              <PreOnePlanetMark size={cfg.logoSize} animated={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Drop-in wrapper component for page-level or module loading boundaries.
 */
export function PageLoadingBoundary({
  children,
  isLoading,
  fallback,
  mode = 'page',
}: {
  children?: React.ReactNode
  isLoading: boolean
  fallback?: React.ReactNode
  mode?: BookLoaderMode
}) {
  if (isLoading) {
    return fallback ? <>{fallback}</> : <BookPageLoader mode={mode} />
  }
  return <>{children}</>
}

/**
 * Compact inline book loader icon suitable for button states or miniature status badges.
 */
export function BookLoaderIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <BookPageLoader mode="compact" size="sm" className="scale-[0.4] origin-center" />
    </div>
  )
}
