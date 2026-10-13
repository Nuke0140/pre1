'use client'

import React, { useState, forwardRef } from 'react'

export type LauncherSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LauncherState = 'default' | 'hover' | 'pressed' | 'focus' | 'active' | 'disabled'
export type LauncherTheme = 'light' | 'dark'

export interface PreOnePlanetMarkProps {
  size?: number
  className?: string
  variant?: 'color' | 'white' | 'monochrome' | 'disabled'
  animated?: boolean
  animateOrbit?: boolean
}

/**
 * Pure Vector PreOne Planet Emblem
 * Ultra-lightweight (< 2KB), scale-independent, retina crisp at all sizes.
 * Perfectly replicates the Fluent Metro planet with orbital ring & celestial accents.
 */
export function PreOnePlanetMark({
  size = 32,
  className = '',
  variant = 'color',
  animated = false,
  animateOrbit = false,
}: PreOnePlanetMarkProps) {
  // Unique gradient ID prefix to avoid DOM collisions
  const uid = 'po-planet'

  const isWhite = variant === 'white'
  const isDisabled = variant === 'disabled'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`preone-planet-mark ${animated ? 'animate-planet-hover' : ''} ${animateOrbit ? 'animate-orbit-draw' : ''} ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Central Planet Gradient: Cyan -> Royal Blue -> Violet -> Magenta */}
        <linearGradient id={`${uid}-body`} x1="82" y1="28" x2="22" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="30%" stopColor="#0070F3" />
          <stop offset="70%" stopColor="#7928CA" />
          <stop offset="100%" stopColor="#F81CE5" />
        </linearGradient>

        {/* Orbital Ring Gradient: Pink -> Violet -> Electric Cyan */}
        <linearGradient id={`${uid}-ring`} x1="18" y1="74" x2="84" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF0080" />
          <stop offset="35%" stopColor="#7928CA" />
          <stop offset="70%" stopColor="#0070F3" />
          <stop offset="100%" stopColor="#00DFD8" />
        </linearGradient>

        {/* 4-Point Star Gold Gradient */}
        <linearGradient id={`${uid}-star`} x1="22" y1="16" x2="34" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEE140" />
          <stop offset="100%" stopColor="#FA709A" />
        </linearGradient>

        {/* Emerald Satellite Dot Gradient */}
        <linearGradient id={`${uid}-emerald`} x1="42" y1="14" x2="48" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Soft Drop Shadow for Planet Torus */}
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0070F3" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* ── 1. Orbital Ring (Back Half: passes behind upper-right planet hemisphere) ── */}
      <g transform="rotate(-31 52 53)">
        <path
          className="planet-orbit-path-back"
          d="M 14 53 A 40 14 0 0 1 90 53"
          stroke={isWhite ? 'rgba(255, 255, 255, 0.75)' : isDisabled ? '#94A3B8' : `url(#${uid}-ring)`}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={isWhite ? 0.8 : 0.95}
        />
      </g>

      {/* ── 2. Central Planet Body (Torus / Donut Ring) ── */}
      <g filter={!isWhite && !isDisabled ? `url(#${uid}-shadow)` : undefined}>
        {/* Outer sphere donut with central cutout */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 52 24 C 67.46 24 80 36.54 80 52 C 80 67.46 67.46 80 52 80 C 36.54 80 24 67.46 24 52 C 24 36.54 36.54 24 52 24 Z M 52 38 C 59.73 38 66 44.27 66 52 C 66 59.73 59.73 66 52 66 C 44.27 66 38 59.73 38 52 C 38 44.27 44.27 38 52 38 Z"
          fill={isWhite ? '#FFFFFF' : isDisabled ? '#94A3B8' : `url(#${uid}-body)`}
        />
      </g>

      {/* ── 3. Orbital Ring (Front Half: passes in front of lower-left planet hemisphere) ── */}
      <g transform="rotate(-31 52 53)">
        <path
          className="planet-orbit-path-front"
          d="M 90 53 A 40 14 0 0 1 14 53"
          stroke={isWhite ? '#FFFFFF' : isDisabled ? '#94A3B8' : `url(#${uid}-ring)`}
          strokeWidth="6.5"
          strokeLinecap="round"
        />
      </g>

      {/* ── 4. Celestial Accents ── */}
      {/* (A) 4-Point Gold Star Sparkle (Top-Left) */}
      <path
        d="M 28 14 C 28 20.5 24 23.5 17 23.5 C 24 23.5 28 26.5 28 33 C 28 26.5 32 23.5 39 23.5 C 32 23.5 28 20.5 28 14 Z"
        fill={isWhite ? '#FFFFFF' : isDisabled ? '#CBD5E1' : `url(#${uid}-star)`}
      />

      {/* (B) Emerald Green Particle Sphere (Top-Center) */}
      <circle
        cx="45"
        cy="17"
        r="3.6"
        fill={isWhite ? '#FFFFFF' : isDisabled ? '#CBD5E1' : `url(#${uid}-emerald)`}
      />

      {/* (C) Radiant Magenta Particle (Mid-Left) */}
      <circle
        cx="19"
        cy="47"
        r="2.8"
        fill={isWhite ? '#FFFFFF' : isDisabled ? '#CBD5E1' : '#F43F5E'}
      />
    </svg>
  )
}

export interface PreOneLauncherButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: LauncherSize
  buttonState?: LauncherState
  themeMode?: LauncherTheme
  label?: string
  showBadge?: boolean
  badgeCount?: number
  className?: string
}

const SIZE_CONFIG: Record<
  LauncherSize,
  { buttonPx: number; iconPx: number; paddingPx: number }
> = {
  xs: { buttonPx: 24, iconPx: 15, paddingPx: 2 },
  sm: { buttonPx: 32, iconPx: 20, paddingPx: 3 },
  md: { buttonPx: 40, iconPx: 26, paddingPx: 4 },
  lg: { buttonPx: 48, iconPx: 31, paddingPx: 5 },
  xl: { buttonPx: 56, iconPx: 36, paddingPx: 6 },
}

/**
 * PreOne Launcher Button — Fluent Metro Classic Style
 * Perfectly reproduces the multi-state Fluent Metro Neumorphic / Glassmorphic Disc.
 * Supports:
 * - 6 Button States: Default, Hover, Pressed, Focus, Active, Disabled
 * - 5 Standard Sizes: XS (24px), SM (32px), MD (40px), LG (48px), XL (56px)
 * - 2 Themes: Light (Ceramic White) & Dark (Obsidian Slate)
 */
export const PreOneLauncherButton = forwardRef<
  HTMLButtonElement,
  PreOneLauncherButtonProps
>(function PreOneLauncherButton(
  {
    size = 'md',
    buttonState,
    themeMode = 'light',
    label = 'PreOne Start Menu',
    showBadge = false,
    badgeCount = 0,
    className = '',
    onClick,
    disabled = false,
    ...props
  },
  ref
) {
  const [internalHover, setInternalHover] = useState(false)
  const [internalActive, setInternalActive] = useState(false)

  const isExplicitDisabled = disabled || buttonState === 'disabled'
  const isExplicitActive = buttonState === 'active' || internalActive
  const isExplicitHover = buttonState === 'hover' || internalHover
  const isExplicitPressed = buttonState === 'pressed'
  const isExplicitFocus = buttonState === 'focus'

  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md
  const isDark = themeMode === 'dark'

  // Dynamic visual styling per Fluent Metro specification
  let bgStyle: React.CSSProperties = {}
  let shadowStyle = ''
  let transformStyle = 'none'

  if (isExplicitDisabled) {
    bgStyle = {
      background: isDark ? '#1E293B' : '#F1F5F9',
      border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
      opacity: 0.6,
      cursor: 'not-allowed',
    }
    shadowStyle = 'none'
  } else if (isExplicitActive) {
    // Saturated Cobalt-to-Sky gradient background with luminescent white icon
    bgStyle = {
      background: 'linear-gradient(135deg, #0070F3 0%, #00C6FF 100%)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
    }
    shadowStyle = '0 10px 28px -2px rgba(0, 112, 243, 0.45), 0 2px 8px rgba(0, 112, 243, 0.2)'
    transformStyle = 'scale(0.98)'
  } else if (isExplicitPressed) {
    // Pressed state: Inset recessed depth
    bgStyle = {
      background: isDark ? '#0F172A' : '#F8FAFC',
      border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
    }
    shadowStyle = isDark
      ? 'inset 0 3px 6px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0,0,0,0.3)'
      : 'inset 0 2px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 112, 243, 0.08)'
    transformStyle = 'scale(0.95)'
  } else if (isExplicitHover) {
    // Hover state: Expanded radiant blue illumination
    bgStyle = {
      background: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1px solid #475569' : '1px solid rgba(255, 255, 255, 0.95)',
    }
    shadowStyle = isDark
      ? '0 14px 34px -4px rgba(0, 198, 255, 0.35), 0 0 16px rgba(124, 58, 237, 0.25)'
      : '0 12px 30px -2px rgba(0, 122, 255, 0.32), 0 4px 10px rgba(0, 0, 0, 0.05)'
    transformStyle = 'translateY(-1.5px) scale(1.03)'
  } else if (isExplicitFocus) {
    // Focus state: High contrast outer focus ring
    bgStyle = {
      background: isDark ? '#1E293B' : '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.8)',
    }
    shadowStyle = isDark
      ? '0 0 0 2px #0F172A, 0 0 0 4px #38BDF8, 0 8px 20px rgba(56, 189, 248, 0.3)'
      : '0 0 0 2px #FFFFFF, 0 0 0 4.5px #0070F3, 0 8px 24px rgba(0, 112, 243, 0.25)'
  } else {
    // Default state: Crisp ceramic disc with soft ambient glow
    bgStyle = {
      background: isDark ? '#1E293B' : '#FFFFFF',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.9)',
    }
    shadowStyle = isDark
      ? '0 8px 24px -2px rgba(0, 0, 0, 0.4), 0 0 16px rgba(0, 112, 243, 0.15)'
      : '0 8px 24px -2px rgba(0, 112, 243, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)'
  }

  const markVariant = isExplicitDisabled
    ? 'disabled'
    : isExplicitActive
    ? 'white'
    : 'color'

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={isExplicitDisabled}
      onClick={onClick}
      onMouseEnter={() => setInternalHover(true)}
      onMouseLeave={() => {
        setInternalHover(false)
        setInternalActive(false)
      }}
      onMouseDown={() => setInternalActive(true)}
      onMouseUp={() => setInternalActive(false)}
      className={`preone-launcher-btn ${className}`}
      style={{
        width: cfg.buttonPx,
        height: cfg.buttonPx,
        borderRadius: 9999,
        padding: 0,
        margin: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        cursor: isExplicitDisabled ? 'not-allowed' : 'pointer',
        boxShadow: shadowStyle,
        transform: transformStyle,
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        userSelect: 'none',
        ...bgStyle,
      }}
      {...props}
    >
      <PreOnePlanetMark
        size={cfg.iconPx}
        variant={markVariant}
        animated={isExplicitHover}
      />

      {/* Notification badge if unread items exist */}
      {showBadge && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: size === 'xs' ? 8 : 14,
            height: size === 'xs' ? 8 : 14,
            padding: '0 3px',
            borderRadius: 999,
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: size === 'xs' ? 7 : 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 2px #FFFFFF',
          }}
        >
          {badgeCount > 0 ? (badgeCount > 99 ? '99+' : badgeCount) : ''}
        </span>
      )}
    </button>
  )
})
