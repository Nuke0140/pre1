'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { HomeModule } from '@/lib/modules'
import { SEMANTIC_THEME_TOKENS } from '@/lib/modules'
import { AnimatedModuleIcon } from './AnimatedModuleIcon'

interface ModuleCardProps {
  module: HomeModule
  className?: string
}

/**
 * Clean PreOne ModuleCard
 *
 * Minimalist Fluent Metro tile layout:
 * - Rounded card surface with soft elevation and subtle borders
 * - Semantic theme icon container with hardware-accelerated 3D illustration
 * - Crisp module title (clean, no subheadings or Launch action clutter)
 * - Non-intrusive subtle background watermark motif
 */
export function ModuleCard({ module: m, className = '' }: ModuleCardProps) {
  const theme = SEMANTIC_THEME_TOKENS[m.semanticTheme] || SEMANTIC_THEME_TOKENS.lavender

  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <Link
      href={m.href}
      prefetch={true}
      className={`module-card group ${className}`.trim()}
      aria-label={m.label}
      data-module={m.key}
      draggable={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={
        {
          '--card-hover-border': theme.hoverBorder,
          '--card-accent-glow': theme.accentGlow,
        } as React.CSSProperties
      }
    >
      {/* Icon Area: Takes ~80% of usable card space */}
      <div className="module-card-icon-area module-card-top">
        <AnimatedModuleIcon
          moduleKey={m.key}
          label={m.label}
          icon={m.icon}
          animation={m.animation}
          theme={theme}
          triggerAnimation={isHovered || isFocused}
        />
      </div>

      {/* Title Area: ~20% at the bottom, cleanly positioned below the icon */}
      <div className="module-card-title-area module-card-body">
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
