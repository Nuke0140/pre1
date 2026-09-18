'use client'

import React from 'react'
import Link from 'next/link'
import type { HomeModule, SemanticTheme } from '@/lib/modules'

interface ModuleCardProps {
  module: HomeModule
  className?: string
}

const THEME_STYLES: Record<
  SemanticTheme,
  {
    iconBg: string
    iconColor: string
    iconBorder: string
    hoverBorder: string
    accentGlow: string
  }
> = {
  lavender: {
    iconBg: 'var(--primary-light, #F3EEFF)',
    iconColor: 'var(--primary, #7C3AED)',
    iconBorder: 'color-mix(in srgb, var(--primary, #7C3AED) 20%, transparent)',
    hoverBorder: 'var(--primary, #7C3AED)',
    accentGlow: 'color-mix(in srgb, var(--primary, #7C3AED) 8%, transparent)',
  },
  blue: {
    iconBg: 'var(--info-soft, #EBF5FF)',
    iconColor: 'var(--info, #2563EB)',
    iconBorder: 'color-mix(in srgb, var(--info, #2563EB) 20%, transparent)',
    hoverBorder: 'var(--info, #2563EB)',
    accentGlow: 'color-mix(in srgb, var(--info, #2563EB) 8%, transparent)',
  },
  teal: {
    iconBg: 'var(--secondary-light, #E6FFFA)',
    iconColor: 'var(--secondary, #0D9488)',
    iconBorder: 'color-mix(in srgb, var(--secondary, #0D9488) 20%, transparent)',
    hoverBorder: 'var(--secondary, #0D9488)',
    accentGlow: 'color-mix(in srgb, var(--secondary, #0D9488) 8%, transparent)',
  },
  orange: {
    iconBg: 'var(--accent-light, #FFF7ED)',
    iconColor: 'var(--warning, #D97706)',
    iconBorder: 'color-mix(in srgb, var(--warning, #D97706) 20%, transparent)',
    hoverBorder: 'var(--warning, #D97706)',
    accentGlow: 'color-mix(in srgb, var(--warning, #D97706) 8%, transparent)',
  },
  pink: {
    iconBg: 'var(--pink-soft, #FDF2F8)',
    iconColor: 'var(--pink, #DB2777)',
    iconBorder: 'color-mix(in srgb, var(--pink, #DB2777) 20%, transparent)',
    hoverBorder: 'var(--pink, #DB2777)',
    accentGlow: 'color-mix(in srgb, var(--pink, #DB2777) 8%, transparent)',
  },
  green: {
    iconBg: 'var(--success-soft, #ECFDF5)',
    iconColor: 'var(--success, #16A34A)',
    iconBorder: 'color-mix(in srgb, var(--success, #16A34A) 20%, transparent)',
    hoverBorder: 'var(--success, #16A34A)',
    accentGlow: 'color-mix(in srgb, var(--success, #16A34A) 8%, transparent)',
  },
  purple: {
    iconBg: 'var(--primary-light, #F3EEFF)',
    iconColor: 'var(--primary, #7C3AED)',
    iconBorder: 'color-mix(in srgb, var(--primary, #7C3AED) 20%, transparent)',
    hoverBorder: 'var(--primary, #7C3AED)',
    accentGlow: 'color-mix(in srgb, var(--primary, #7C3AED) 8%, transparent)',
  },
}

/**
 * Clean PreOne ModuleCard
 *
 * Minimalist Fluent Metro tile layout:
 * - Rounded card surface with soft elevation and subtle borders
 * - Semantic theme icon container with preschool-friendly pastel tones
 * - Crisp module title (clean, no subheadings or Launch action clutter)
 * - Non-intrusive subtle background watermark motif
 */
export function ModuleCard({ module: m, className = '' }: ModuleCardProps) {
  const Icon = m.icon
  const theme = THEME_STYLES[m.semanticTheme] || THEME_STYLES.lavender

  return (
    <Link
      href={m.href}
      className={`module-card group ${className}`.trim()}
      aria-label={m.label}
      draggable={false}
      style={
        {
          '--card-hover-border': theme.hoverBorder,
          '--card-accent-glow': theme.accentGlow,
        } as React.CSSProperties
      }
    >
      {/* Top Header: Icon + Category Tint */}
      <div className="module-card-top">
        <span
          className="module-card-icon"
          style={{
            background: theme.iconBg,
            color: theme.iconColor,
            border: `1px solid ${theme.iconBorder}`,
          }}
        >
          <Icon size={24} />
        </span>
      </div>

      {/* Main Body: Title only (clean & glanceable) */}
      <div className="module-card-body">
        <h3 className="module-card-title">{m.label}</h3>
      </div>

      {/* Subtle Preschool Watermark Motif (Decorative, non-intrusive) */}
      <div className="module-card-watermark" aria-hidden="true" style={{ color: theme.iconColor }}>
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
          <circle cx="48" cy="48" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" opacity="0.32" />
          <path
            d="M38 28L39.5 31.5L43 33L39.5 34.5L38 38L36.5 34.5L33 33L36.5 31.5L38 28Z"
            fill="currentColor"
            opacity="0.36"
          />
          <circle cx="26" cy="46" r="2.5" fill="currentColor" opacity="0.25" />
        </svg>
      </div>
    </Link>
  )
}
