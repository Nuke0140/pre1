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
  animateOrbit = false,
}: {
  size?: number
  className?: string
  useImage?: boolean
  variant?: 'color' | 'white' | 'monochrome' | 'disabled'
  animateOrbit?: boolean
}) {
  if (useImage) {
    return (
      <img
        src={`/preone-mark.svg?${ASSET_VERSION}`}
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
    <span className={`mark inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <PreOnePlanetMark size={size} variant={variant} animateOrbit={animateOrbit} />
    </span>
  )
}

export function PLogoWordmark({ subtitle = 'Preschool OS' }: { subtitle?: string }) {
  return (
    <span className="wordmark">
      <img
        src={`/preone-logo.png?${ASSET_VERSION}`}
        alt="PreOne"
        width={100}
        height={47}
        className="wm-img"
        style={{ aspectRatio: '1000 / 470' }}
        draggable={false}
      />
      {subtitle ? <span>{subtitle}</span> : null}
    </span>
  )
}
