'use client'

import React from 'react'
import Link from 'next/link'
import type { HomeModule } from '@/lib/modules'
import { SEMANTIC_THEME_TOKENS } from '@/lib/modules'

interface ModuleCardProps {
  module: HomeModule
  className?: string
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
  const theme = SEMANTIC_THEME_TOKENS[m.semanticTheme] || SEMANTIC_THEME_TOKENS.lavender

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
          <Icon size={35} strokeWidth={2.2} />
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
