'use client'

import React from 'react'
import {
  GlobalModuleNavigation,
  ADMISSIONS_NAVIGATION_CONFIG,
  type ModuleNavigationItem,
} from '@/components/preone'

export interface AdmissionsNavigationModule {
  key: string
  label: string
  href: string
  icon: any
  badge?: number | string
  accent?: string
}

export const ADMISSIONS_MODULES = ADMISSIONS_NAVIGATION_CONFIG.map((m) => ({
  key: m.id,
  label: m.label,
  href: m.href || '',
  icon: m.icon,
  badge: m.badge,
}))

export interface AdmissionsNavigationRibbonProps {
  moduleCounts?: Partial<Record<string, number>>
  className?: string
}

/**
 * PreOne Admissions Navigation Ribbon
 * Standardized on GlobalModuleNavigation with centralized typed configuration.
 */
export function AdmissionsNavigationRibbon({
  moduleCounts = {},
  className = '',
}: AdmissionsNavigationRibbonProps) {
  // Merge live counts with centralized admissions navigation config
  const items: ModuleNavigationItem[] = ADMISSIONS_NAVIGATION_CONFIG.map((item) => ({
    ...item,
    badge: moduleCounts[item.id],
  }))

  return (
    <div className={`w-full min-w-0 max-w-full ${className}`}>
      <GlobalModuleNavigation
        items={items}
        ariaLabel="Admissions Workspaces Navigation"
        maxVisibleMobile={5}
      />
    </div>
  )
}
