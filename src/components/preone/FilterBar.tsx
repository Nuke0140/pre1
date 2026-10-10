'use client'

import React from 'react'
import {
  SearchFilterBar,
  type FilterConfig,
  type FilterOption,
  type ActiveChipItem,
} from './SearchFilterBar'

export type { FilterOption }

export interface FilterField {
  id: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}

export interface ActiveChip {
  id: string
  label: string
  valueLabel: string
  onRemove: () => void
}

export interface FilterBarProps {
  search?: string
  onSearchChange?: (val: string) => void
  searchPlaceholder?: string
  filters?: FilterField[]
  activeChips?: ActiveChip[]
  onReset?: () => void
  extraActions?: React.ReactNode
  className?: string
}

/**
 * FilterBar — Backwards-compatible facade that routes to the canonical SearchFilterBar.
 */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  activeChips,
  onReset,
  extraActions,
  className = '',
}: FilterBarProps) {
  const convertedFilters: FilterConfig[] = filters.map((f) => ({
    id: f.id,
    label: f.label,
    value: f.value,
    defaultValue: 'ALL',
    options: f.options,
    onChange: f.onChange,
  }))

  return (
    <SearchFilterBar
      search={
        onSearchChange !== undefined
          ? {
              value: search || '',
              onChange: onSearchChange,
              placeholder: searchPlaceholder,
            }
          : undefined
      }
      filters={convertedFilters}
      activeChips={activeChips}
      onReset={onReset}
      extraActions={extraActions}
      className={className}
    />
  )
}

export interface FilterChipsProps {
  chips: ActiveChip[]
  onClearAll?: () => void
  className?: string
}

export function FilterChips({ chips, onClearAll, className = '' }: FilterChipsProps) {
  if (!chips || chips.length === 0) return null
  return (
    <SearchFilterBar
      activeChips={chips}
      onReset={onClearAll}
      className={className}
      showActiveChips={true}
    />
  )
}
