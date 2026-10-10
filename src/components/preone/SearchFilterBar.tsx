'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Check,
  Building2,
  Calendar,
  Loader2,
  Filter,
} from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FilterType =
  | 'select'
  | 'multi-select'
  | 'status'
  | 'branch'
  | 'date'
  | 'date-preset'
  | 'toggle'
  | 'custom'

export interface FilterOption {
  value: string
  label: string
  icon?: React.ReactNode
  colorDot?: string // e.g. '#10B981', 'green', 'amber', 'red', 'blue', or CSS hex/var
  description?: string
  badge?: string | number
  isMain?: boolean // For branch filters (indicates main branch)
}

export interface FilterConfig {
  id: string
  label: string
  type?: FilterType
  icon?: React.ReactNode
  value: string | string[] | boolean | undefined
  defaultValue?: string | string[] | boolean
  options?: FilterOption[]
  placeholder?: string
  searchable?: boolean // Enables mini-search inside dropdown when options > 6
  clearable?: boolean // Show inline 'x' when active
  disabled?: boolean
  ariaLabel?: string
  onChange: (value: any) => void
  renderCustom?: () => React.ReactNode
}

export interface SearchSuggestionItem {
  id: string
  title: string
  subtitle?: string
  category?: string
  badge?: string
  icon?: React.ReactNode
  avatar?: string
  metadata?: Record<string, any>
}

export interface SearchConfig {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  shortcut?: string // e.g. '⌘K' or '/'
  autoFocus?: boolean
  ariaLabel?: string
  suggestions?: SearchSuggestionItem[]
  onSelectSuggestion?: (item: SearchSuggestionItem) => void
  renderSuggestion?: (item: SearchSuggestionItem) => React.ReactNode
}

export interface ActiveChipItem {
  id: string
  label: string
  valueLabel: string
  onRemove: () => void
}

export interface SearchFilterBarProps {
  /** Search configuration object or legacy search query string */
  search?: SearchConfig | string
  /** Legacy search change handler */
  onSearchChange?: (val: string) => void
  /** Legacy search placeholder */
  searchPlaceholder?: string
  /** Primary toolbar filters */
  filters?: FilterConfig[]
  /** Advanced / secondary filters shown in expandable panel */
  advancedFilters?: FilterConfig[]
  /** Callback to reset all filters and search */
  onReset?: () => void
  /** Callback for clearing all applied filters */
  onClearAll?: () => void
  /** Custom active chips if overridden by consumer */
  activeChips?: ActiveChipItem[]
  /** Whether to show the active chips summary rail (defaults to true) */
  showActiveChips?: boolean
  /** Extra actions rendered on the right side of toolbar (e.g. Export, Add) */
  extraActions?: React.ReactNode
  /** Visual variant */
  variant?: 'default' | 'compact' | 'embedded'
  /** Max filters to display directly on primary toolbar before moving to More */
  maxVisibleFilters?: number
  /** Additional CSS class names */
  className?: string
  /** ARIA label for the entire search and filter landmark */
  ariaLabel?: string
}

// ============================================================================
// HELPER: STATUS COLOR RESOLVER
// ============================================================================

export function resolveStatusDotColor(statusOrColor: string | undefined): string {
  if (!statusOrColor) return 'var(--text-muted, #94a3b8)'
  const s = statusOrColor.toLowerCase()
  if (s === 'active' || s === 'success' || s === 'paid' || s === 'completed' || s === 'green') {
    return 'var(--success, #10b981)'
  }
  if (s === 'pending' || s === 'warning' || s === 'in_progress' || s === 'amber' || s === 'yellow') {
    return 'var(--warning, #f59e0b)'
  }
  if (
    s === 'suspended' ||
    s === 'inactive' ||
    s === 'danger' ||
    s === 'overdue' ||
    s === 'failed' ||
    s === 'locked' ||
    s === 'deactivated' ||
    s === 'red'
  ) {
    return 'var(--danger, #f43f5e)'
  }
  if (s === 'info' || s === 'blue' || s === 'enquiry') {
    return 'var(--info, #3b82f6)'
  }
  if (s === 'purple' || s === 'primary') {
    return 'var(--primary, #7c3aed)'
  }
  return statusOrColor
}

// ============================================================================
// COMPONENT: SEARCH CONTROL
// ============================================================================

interface SearchControlProps {
  config: SearchConfig
  compact?: boolean
}

function SearchControl({ config, compact }: SearchControlProps) {
  const {
    value,
    onChange,
    placeholder = 'Search records...',
    loading = false,
    disabled = false,
    shortcut,
    autoFocus = false,
    ariaLabel = 'Search records',
    suggestions = [],
    onSelectSuggestion,
    renderSuggestion,
  } = config

  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const showSuggestions =
    isFocused && suggestions.length > 0 && (value.trim().length > 0 || highlightedIndex >= 0)

  // Keyboard shortcut listener (e.g. '/' or '⌘K')
  useEffect(() => {
    if (!shortcut) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const isCmdK = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k'
      const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey

      if ((shortcut.includes('K') && isCmdK) || (shortcut === '/' && isSlash)) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcut])

  // Click outside to close suggestions
  useEffect(() => {
    if (!showSuggestions) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions])

  // Key navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Escape') {
        inputRef.current?.blur()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault()
        const selected = suggestions[highlightedIndex]
        if (onSelectSuggestion) onSelectSuggestion(selected)
        else onChange(selected.title)
        setIsFocused(false)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsFocused(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`sfb-search-wrap${compact ? ' sfb-search-compact' : ''}${isFocused ? ' is-focused' : ''}${
        disabled ? ' is-disabled' : ''
      }`}
    >
      <div className="sfb-search-icon-box" aria-hidden="true">
        <Search className="sfb-search-icon" size={compact ? 13 : 15} />
      </div>

      <input
        ref={inputRef}
        type="text"
        className="sfb-search-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setHighlightedIndex(-1)
        }}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-controls={showSuggestions ? 'sfb-search-suggestions-list' : undefined}
      />

      <div className="sfb-search-actions">
        {loading && (
          <span className="sfb-search-loading" title="Searching..." aria-label="Searching">
            <Loader2 className="sfb-spinner" size={compact ? 13 : 14} />
          </span>
        )}

        {value && !loading && !disabled && (
          <button
            type="button"
            className="sfb-clear-btn"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={compact ? 12 : 13} />
          </button>
        )}

        {shortcut && !value && !loading && (
          <kbd className="sfb-kbd" title={`Keyboard shortcut: ${shortcut}`}>
            {shortcut}
          </kbd>
        )}
      </div>

      {/* Autocomplete Suggestions Panel */}
      {showSuggestions && (
        <ul
          id="sfb-search-suggestions-list"
          className="sfb-suggestions-panel"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isHighlighted}
                className={`sfb-suggestion-item${isHighlighted ? ' is-highlighted' : ''}`}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => {
                  if (onSelectSuggestion) onSelectSuggestion(item)
                  else onChange(item.title)
                  setIsFocused(false)
                }}
              >
                {renderSuggestion ? (
                  renderSuggestion(item)
                ) : (
                  <>
                    {item.avatar ? (
                      <span className="sfb-suggestion-avatar">
                        <img src={item.avatar} alt="" />
                      </span>
                    ) : item.icon ? (
                      <span className="sfb-suggestion-icon">{item.icon}</span>
                    ) : null}

                    <div className="sfb-suggestion-text">
                      <span className="sfb-suggestion-title">{item.title}</span>
                      {item.subtitle && <span className="sfb-suggestion-sub">{item.subtitle}</span>}
                    </div>

                    {item.badge && <span className="sfb-suggestion-badge">{item.badge}</span>}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT: FILTER CONTROL (INDIVIDUAL DROPDOWN / TOGGLE)
// ============================================================================

interface FilterControlProps {
  filter: FilterConfig
  compact?: boolean
  key?: React.Key
}

function FilterControl({ filter, compact }: FilterControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const {
    id,
    label,
    type = 'select',
    icon,
    value,
    defaultValue = type === 'multi-select' ? [] : 'ALL',
    options = [],
    placeholder = 'All',
    searchable = options.length > 7,
    clearable = true,
    disabled = false,
    onChange,
    renderCustom,
  } = filter

  // Check if currently active (non-default value)
  const isActive = useMemo(() => {
    if (value === undefined || value === null) return false
    if (Array.isArray(value)) {
      return value.length > 0 && JSON.stringify(value) !== JSON.stringify(defaultValue)
    }
    if (typeof value === 'boolean') {
      return value !== defaultValue
    }
    return String(value) !== String(defaultValue) && String(value) !== '' && String(value) !== 'ALL'
  }, [value, defaultValue])

  // Resolve display label
  const displayValue = useMemo(() => {
    if (type === 'multi-select') {
      const arr = Array.isArray(value) ? value : []
      if (arr.length === 0) return placeholder
      if (arr.length === 1) {
        const opt = options.find((o) => o.value === arr[0])
        return opt ? opt.label : arr[0]
      }
      return `${arr.length} selected`
    }

    if (type === 'toggle') {
      return value ? 'On' : 'Off'
    }

    if (!isActive) return placeholder

    const opt = options.find((o) => String(o.value) === String(value))
    return opt ? opt.label : String(value)
  }, [type, value, isActive, options, placeholder])

  // Click outside and escape handler
  useEffect(() => {
    if (!isOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Filter options if mini-search active
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase().trim()
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    )
  }, [options, searchQuery])

  // Clear specific filter back to defaultValue
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(defaultValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Toggle filter type
  if (type === 'toggle') {
    const isChecked = Boolean(value)
    return (
      <button
        type="button"
        className={`sfb-filter-trigger sfb-toggle-trigger${isChecked ? ' is-active' : ''}${
          compact ? ' sfb-filter-compact' : ''
        }`}
        onClick={() => onChange(!isChecked)}
        disabled={disabled}
        aria-pressed={isChecked}
        aria-label={label}
      >
        {icon}
        <span className="sfb-filter-label">{label}</span>
        <span className={`sfb-toggle-switch${isChecked ? ' is-checked' : ''}`} aria-hidden="true" />
      </button>
    )
  }

  // Custom filter render
  if (renderCustom) {
    return <div className="sfb-custom-filter">{renderCustom()}</div>
  }

  // Pick default icon based on type
  const resolvedIcon =
    icon ||
    (type === 'branch' ? (
      <Building2 size={13} aria-hidden="true" />
    ) : type === 'date' || type === 'date-preset' ? (
      <Calendar size={13} aria-hidden="true" />
    ) : null)

  // Status dot color for active status filter
  const activeStatusDot =
    type === 'status' && isActive ? resolveStatusDotColor(String(value)) : null

  return (
    <div
      ref={dropdownRef}
      className={`sfb-filter-item${isOpen ? ' is-open' : ''}${isActive ? ' is-active' : ''}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`sfb-filter-trigger${isActive ? ' is-active' : ''}${
          compact ? ' sfb-filter-compact' : ''
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${displayValue}`}
        title={`${label}: ${displayValue}`}
      >
        {resolvedIcon && <span className="sfb-filter-icon">{resolvedIcon}</span>}

        {activeStatusDot && (
          <span
            className="sfb-status-dot"
            style={{ backgroundColor: activeStatusDot }}
            aria-hidden="true"
          />
        )}

        <span className="sfb-filter-label-group">
          <span className="sfb-filter-name">{label}:</span>
          <span className="sfb-filter-value">{displayValue}</span>
        </span>

        {isActive && clearable ? (
          <span
            role="button"
            tabIndex={0}
            className="sfb-filter-quick-clear"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClear(e as any)
              }
            }}
            title={`Clear ${label}`}
            aria-label={`Clear ${label}`}
          >
            <X size={11} />
          </span>
        ) : (
          <ChevronDown
            size={12}
            className={`sfb-filter-chevron${isOpen ? ' is-rotated' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Dropdown Surface */}
      {isOpen && (
        <div className="sfb-dropdown-panel" role="listbox" aria-label={label}>
          {searchable && options.length > 5 && (
            <div className="sfb-dropdown-search">
              <Search size={12} className="sfb-dropdown-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="sfb-dropdown-search-input"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="sfb-dropdown-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          <div className="sfb-options-list">
            {filteredOptions.length === 0 ? (
              <div className="sfb-no-options">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected =
                  type === 'multi-select'
                    ? Array.isArray(value) && value.includes(opt.value)
                    : String(value) === String(opt.value)

                const dotColor =
                  type === 'status' || opt.colorDot
                    ? resolveStatusDotColor(opt.colorDot || opt.value)
                    : null

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`sfb-option-item${isSelected ? ' is-selected' : ''}`}
                    onClick={() => {
                      if (type === 'multi-select') {
                        const cur = Array.isArray(value) ? [...value] : []
                        const next = cur.includes(opt.value)
                          ? cur.filter((v) => v !== opt.value)
                          : [...cur, opt.value]
                        onChange(next)
                      } else {
                        onChange(opt.value)
                        setIsOpen(false)
                        setSearchQuery('')
                        triggerRef.current?.focus()
                      }
                    }}
                  >
                    {type === 'multi-select' && (
                      <span className={`sfb-checkbox${isSelected ? ' is-checked' : ''}`}>
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </span>
                    )}

                    {dotColor && (
                      <span
                        className="sfb-status-dot"
                        style={{ backgroundColor: dotColor }}
                        aria-hidden="true"
                      />
                    )}

                    {opt.icon && <span className="sfb-opt-icon">{opt.icon}</span>}

                    <span className="sfb-opt-label">
                      {opt.label}
                      {opt.isMain && <span className="sfb-opt-main-tag">Main</span>}
                    </span>

                    {opt.badge !== undefined && (
                      <span className="sfb-opt-badge">{opt.badge}</span>
                    )}

                    {type !== 'multi-select' && isSelected && (
                      <Check size={13} className="sfb-opt-check" aria-hidden="true" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {type === 'multi-select' && (
            <div className="sfb-dropdown-footer">
              <button
                type="button"
                className="sfb-btn-text"
                onClick={() => onChange(options.map((o) => o.value))}
              >
                Select all
              </button>
              <button type="button" className="sfb-btn-text" onClick={() => onChange([])}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT: ADVANCED FILTER PANEL (EXPANDABLE)
// ============================================================================

interface AdvancedFilterPanelProps {
  filters: FilterConfig[]
  isOpen: boolean
  onClose: () => void
  onClearAll?: () => void
}

function AdvancedFilterPanel({
  filters,
  isOpen,
  onClose,
  onClearAll,
}: AdvancedFilterPanelProps) {
  if (!isOpen || filters.length === 0) return null

  return (
    <div className="sfb-advanced-panel" role="region" aria-label="Advanced Filters">
      <div className="sfb-advanced-header">
        <div className="sfb-advanced-title">
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Advanced Filters</span>
        </div>
        {onClearAll && (
          <button type="button" className="sfb-btn-text" onClick={onClearAll}>
            Reset All
          </button>
        )}
      </div>

      <div className="sfb-advanced-grid">
        {filters.map((f) => (
          <div key={f.id} className="sfb-advanced-cell">
            <span className="sfb-advanced-field-label">{f.label}</span>
            <FilterControl filter={f} />
          </div>
        ))}
      </div>

      <div className="sfb-advanced-footer">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: APPLIED ACTIVE FILTER CHIPS RAIL
// ============================================================================

interface ActiveChipsRailProps {
  chips: ActiveChipItem[]
  onClearAll?: () => void
}

function ActiveChipsRail({ chips, onClearAll }: ActiveChipsRailProps) {
  if (chips.length === 0) return null

  return (
    <div className="sfb-chips-rail" role="region" aria-label="Applied Filters">
      <span className="sfb-chips-label">
        Applied ({chips.length}):
      </span>

      <div className="sfb-chips-list">
        {chips.map((chip) => (
          <span key={chip.id} className="sfb-chip">
            <span className="sfb-chip-text">
              <strong className="sfb-chip-name">{chip.label}:</strong> {chip.valueLabel}
            </span>
            <button
              type="button"
              className="sfb-chip-remove"
              onClick={chip.onRemove}
              aria-label={`Remove filter ${chip.label}`}
              title={`Remove filter ${chip.label}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      {onClearAll && (
        <button
          type="button"
          className="sfb-chips-clear-all"
          onClick={onClearAll}
          title="Clear all active filters"
        >
          <RotateCcw size={11} aria-hidden="true" />
          <span>Clear all</span>
        </button>
      )}
    </div>
  )
}

// ============================================================================
// MAIN CANONICAL COMPONENT: SearchFilterBar
// ============================================================================

export function SearchFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  advancedFilters = [],
  onReset,
  onClearAll,
  activeChips: customChips,
  showActiveChips = true,
  extraActions,
  variant = 'default',
  maxVisibleFilters = 5,
  className = '',
  ariaLabel = 'Search and Filter Bar',
}: SearchFilterBarProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Normalize search config to support both unified object and legacy props
  const normalizedSearch: SearchConfig | null = useMemo(() => {
    if (!search && !onSearchChange) return null
    if (typeof search === 'object') return search
    if (onSearchChange) {
      return {
        value: typeof search === 'string' ? search : '',
        onChange: onSearchChange,
        placeholder: searchPlaceholder || 'Search records...',
      }
    }
    return null
  }, [search, onSearchChange, searchPlaceholder])

  // Split primary filters if more than maxVisibleFilters
  const { visibleFilters, overflowFilters } = useMemo(() => {
    if (filters.length <= maxVisibleFilters) {
      return { visibleFilters: filters, overflowFilters: [] }
    }
    return {
      visibleFilters: filters.slice(0, maxVisibleFilters),
      overflowFilters: filters.slice(maxVisibleFilters),
    }
  }, [filters, maxVisibleFilters])

  const combinedAdvancedFilters = useMemo(() => {
    return [...overflowFilters, ...advancedFilters]
  }, [overflowFilters, advancedFilters])

  // Count active advanced filters for badge
  const activeAdvancedCount = useMemo(() => {
    return combinedAdvancedFilters.filter((f) => {
      const def = f.defaultValue ?? (f.type === 'multi-select' ? [] : 'ALL')
      if (Array.isArray(f.value)) return f.value.length > 0 && JSON.stringify(f.value) !== JSON.stringify(def)
      if (typeof f.value === 'boolean') return f.value !== def
      return f.value !== undefined && f.value !== null && String(f.value) !== String(def) && String(f.value) !== '' && String(f.value) !== 'ALL'
    }).length
  }, [combinedAdvancedFilters])

  // Compute active chips automatically if not explicitly provided
  const resolvedActiveChips = useMemo<ActiveChipItem[]>(() => {
    if (customChips) return customChips

    const result: ActiveChipItem[] = []

    // 1. Search chip
    if (normalizedSearch && normalizedSearch.value && normalizedSearch.value.trim().length > 0) {
      result.push({
        id: 'search-query',
        label: 'Search',
        valueLabel: `"${normalizedSearch.value.trim()}"`,
        onRemove: () => normalizedSearch.onChange(''),
      })
    }

    // 2. Filter chips
    const allFilters = [...filters, ...advancedFilters]
    allFilters.forEach((f) => {
      const def = f.defaultValue ?? (f.type === 'multi-select' ? [] : 'ALL')
      let isActive = false
      let display = ''

      if (f.type === 'multi-select') {
        const arr = Array.isArray(f.value) ? f.value : []
        if (arr.length > 0 && JSON.stringify(arr) !== JSON.stringify(def)) {
          isActive = true
          display = arr.join(', ')
        }
      } else if (f.type === 'toggle') {
        if (f.value !== def) {
          isActive = true
          display = f.value ? 'Yes' : 'No'
        }
      } else if (f.value !== undefined && f.value !== null && String(f.value) !== String(def) && String(f.value) !== '' && String(f.value) !== 'ALL') {
        isActive = true
        const opt = f.options?.find((o) => String(o.value) === String(f.value))
        display = opt ? opt.label : String(f.value)
      }

      if (isActive) {
        result.push({
          id: f.id,
          label: f.label,
          valueLabel: display,
          onRemove: () => f.onChange(def),
        })
      }
    })

    return result
  }, [customChips, normalizedSearch, filters, advancedFilters])

  const handleGlobalClear = useCallback(() => {
    if (onClearAll) {
      onClearAll()
    } else if (onReset) {
      onReset()
    } else {
      if (normalizedSearch) normalizedSearch.onChange('')
      filters.forEach((f) => {
        const def = f.defaultValue ?? (f.type === 'multi-select' ? [] : 'ALL')
        f.onChange(def)
      })
      advancedFilters.forEach((f) => {
        const def = f.defaultValue ?? (f.type === 'multi-select' ? [] : 'ALL')
        f.onChange(def)
      })
    }
  }, [onClearAll, onReset, normalizedSearch, filters, advancedFilters])

  const hasAnyActive = resolvedActiveChips.length > 0

  return (
    <div
      className={`sfb-container sfb-${variant} ${className}`.trim()}
      role="search"
      aria-label={ariaLabel}
    >
      {/* ── Main Toolbar ── */}
      <div className="sfb-toolbar">
        {/* Search Control */}
        {normalizedSearch && (
          <div className="sfb-search-slot">
            <SearchControl config={normalizedSearch} compact={variant === 'compact'} />
          </div>
        )}

        {/* Mobile Filter Toggle */}
        {(visibleFilters.length > 0 || combinedAdvancedFilters.length > 0) && (
          <button
            type="button"
            className={`sfb-mobile-toggle-btn${mobileExpanded ? ' is-active' : ''}`}
            onClick={() => setMobileExpanded((prev) => !prev)}
            aria-expanded={mobileExpanded}
            aria-label="Toggle mobile filter options"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Filters</span>
            {hasAnyActive && (
              <span className="sfb-count-badge" aria-label={`${resolvedActiveChips.length} active filters`}>
                {resolvedActiveChips.length}
              </span>
            )}
          </button>
        )}

        {/* Desktop / Expanded Filters Rail */}
        <div className={`sfb-filters-rail${mobileExpanded ? ' is-mobile-open' : ''}`}>
          {visibleFilters.map((f) => (
            <FilterControl key={f.id} filter={f} compact={variant === 'compact'} />
          ))}

          {/* More / Advanced Filters Button */}
          {combinedAdvancedFilters.length > 0 && (
            <button
              type="button"
              className={`sfb-filter-trigger sfb-more-btn${advancedOpen ? ' is-open' : ''}${
                activeAdvancedCount > 0 ? ' is-active' : ''
              }${variant === 'compact' ? ' sfb-filter-compact' : ''}`}
              onClick={() => setAdvancedOpen((prev) => !prev)}
              aria-expanded={advancedOpen}
              aria-label={`More filters (${activeAdvancedCount} active)`}
            >
              <Filter size={13} aria-hidden="true" />
              <span>More Filters</span>
              {activeAdvancedCount > 0 && (
                <span className="sfb-count-badge">{activeAdvancedCount}</span>
              )}
            </button>
          )}

          {/* Quick Clear All in Toolbar (Desktop) */}
          {hasAnyActive && (
            <button
              type="button"
              className="sfb-reset-btn"
              onClick={handleGlobalClear}
              title="Reset all search and filters"
              aria-label="Reset all search and filters"
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Extra Actions Slot (Export, New Item, View Toggles) */}
        {extraActions && <div className="sfb-extra-actions">{extraActions}</div>}
      </div>

      {/* ── Advanced Filter Expandable Panel ── */}
      <AdvancedFilterPanel
        filters={combinedAdvancedFilters}
        isOpen={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        onClearAll={handleGlobalClear}
      />

      {/* ── Active Filter Chips Rail ── */}
      {showActiveChips && (
        <ActiveChipsRail chips={resolvedActiveChips} onClearAll={handleGlobalClear} />
      )}
    </div>
  )
}
