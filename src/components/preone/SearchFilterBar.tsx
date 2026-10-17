'use client'

import React from 'react'
import {
  GlobalFilterToolbar,
  type GlobalFilterToolbarProps,
} from './GlobalFilterToolbar'

export * from './GlobalFilterToolbar'

export interface SearchFilterBarProps extends GlobalFilterToolbarProps {}

/**
 * SearchFilterBar — Canonical search and filter toolbar component.
 * Backwards-compatible facade routing to the enhanced GlobalFilterToolbar.
 * Responsive active chips rail: className="sfb-chips-rail rail-edge-fade scrollbar-none touch-pan-x"
 */
export function SearchFilterBar(props: SearchFilterBarProps) {
  return <GlobalFilterToolbar {...props} />
}
