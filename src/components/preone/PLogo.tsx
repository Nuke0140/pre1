/* eslint-disable @next/next/no-img-element */

import React from 'react'
import { PreOnePlanetMark } from './PreOneLauncherButton'

/**
 * PreOne brand assets — Fluent Metro Classic Style:
 * Uses pure vector PreOnePlanetMark (ultra-lightweight, 0ms load, retina crisp).
 * Fallback to /preone-mark.png if useImage is explicitly requested.
 */
const ASSET_VERSION = 'v2'

export function PLogoMark({
  size = 36,
  className = '',
  useImage = false,
  variant = 'color',
}: {
  size?: number
  className?: string
  useImage?: boolean
  variant?: 'color' | 'white' | 'monochrome' | 'disabled'
}) {
  if (useImage) {
    return (
      <img
        src={`/preone-mark.png?${ASSET_VERSION}`}
        width={size}
        height={size}
        className={`mark ${className}`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    )
  }

  return (
    <span className={`mark inline-flex items-center justify-center ${className}`}>
      <PreOnePlanetMark size={size} variant={variant} />
    </span>
  )
}

export function PLogoWordmark({ subtitle = 'Preschool OS' }: { subtitle?: string }) {
  return (
    <span className="wordmark">
      <img src={`/preone-logo.png?${ASSET_VERSION}`} alt="PreOne" className="wm-img" draggable={false} />
      {subtitle ? <span>{subtitle}</span> : null}
    </span>
  )
}
