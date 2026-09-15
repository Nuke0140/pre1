'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Loader2,
  GraduationCap,
  Users,
  UserCheck,
  Building,
  CalendarCheck,
  DollarSign,
  Briefcase,
  Truck,
  Package,
  FileText,
  Megaphone,
  ShieldCheck,
  Settings,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react'
import type { SearchCategory, SearchResultItem, GlobalSearchResponse } from '@/lib/search/search-service'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

const CATEGORY_ICONS: Record<SearchCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  students: GraduationCap,
  guardians: Users,
  staff: UserCheck,
  admissions: Building,
  academics: GraduationCap,
  attendance: CalendarCheck,
  operations: Building,
  finance: DollarSign,
  hr: Briefcase,
  transport: Truck,
  inventory: Package,
  reports: FileText,
  communication: Megaphone,
  audit: ShieldCheck,
  settings: Settings,
}

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  students: 'Students',
  guardians: 'Guardians',
  staff: 'Staff / Users',
  admissions: 'Admissions',
  academics: 'Academics',
  attendance: 'Attendance',
  operations: 'Operations',
  finance: 'Finance',
  hr: 'Workforce / HR',
  transport: 'Transport',
  inventory: 'Inventory',
  reports: 'Reports',
  communication: 'Communication',
  audit: 'Audit Logs',
  settings: 'Settings & Navigation',
}

const CATEGORY_ORDER: SearchCategory[] = [
  'students',
  'guardians',
  'staff',
  'admissions',
  'academics',
  'attendance',
  'operations',
  'finance',
  'hr',
  'transport',
  'inventory',
  'reports',
  'communication',
  'audit',
  'settings',
]

export function GlobalSearchModal({ isOpen, onClose, initialQuery = '' }: GlobalSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GlobalSearchResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Focus on mount or open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    } else {
      setQuery('')
      setData(null)
      setActiveCategory('all')
      setSelectedIndex(0)
      setError(null)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const catParam = activeCategory !== 'all' ? `&category=${encodeURIComponent(activeCategory)}` : ''
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}${catParam}&limit=20`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`Search failed: HTTP ${res.status}`)
        }
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
          setSelectedIndex(0)
        } else {
          throw new Error(json.error?.message || 'Search returned unexpected response')
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message || 'An error occurred while searching')
        }
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, activeCategory])

  const results = data?.results || []

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results.length > 0 && results[selectedIndex]) {
          const target = results[selectedIndex]
          onClose()
          router.push(target.actionUrl)
        } else if (query.trim()) {
          onClose()
          router.push(`/app/search?q=${encodeURIComponent(query.trim())}${activeCategory !== 'all' ? `&category=${activeCategory}` : ''}`)
        }
      }
    },
    [onClose, results, selectedIndex, query, activeCategory, router]
  )

  // Auto-scroll to selected element
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, results.length])

  if (!isOpen) return null

  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => data?.categoryCounts && (data.categoryCounts[cat] ?? 0) > 0
  )

  return (
    <div
      className="global-search-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      <div className="global-search-modal" onKeyDown={handleKeyDown}>
        {/* Search Input Bar */}
        <div className="search-modal-header">
          <div className="search-input-wrapper">
            {loading ? (
              <Loader2 className="search-icon spin" size={20} />
            ) : (
              <Search className="search-icon" size={20} />
            )}
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search students, parents, invoices, classes, staff, logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search query"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                aria-label="Clear query"
              >
                <X size={16} />
              </button>
            )}
            <span className="search-badge-esc">ESC</span>
          </div>

          {/* Category Filter Pills */}
          {data && data.total > 0 && availableCategories.length > 1 && (
            <div className="category-pills-bar">
              <button
                type="button"
                className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All ({data.total})
              </button>
              {availableCategories.map((cat) => {
                const count = data.categoryCounts[cat] || 0
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {CATEGORY_LABELS[cat]} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Results List / Content */}
        <div className="search-modal-body" ref={listRef}>
          {error && (
            <div className="search-feedback-box error">
              <p>{error}</p>
            </div>
          )}

          {!query.trim() && (
            <div className="search-empty-state">
              <div className="search-empty-icon">
                <Sparkles size={28} />
              </div>
              <h4>Search PreOne Enterprise OS</h4>
              <p>Type a student name, parent phone, invoice number, classroom, or module.</p>
              <div className="search-hints-grid">
                <div className="search-hint-item" onClick={() => setQuery('Sun')}>
                  <span className="hint-tag">Prefix</span> Search “Sun”
                </div>
                <div className="search-hint-item" onClick={() => setQuery('Class')}>
                  <span className="hint-tag">Module</span> Search “Class”
                </div>
                <div className="search-hint-item" onClick={() => setQuery('INV')}>
                  <span className="hint-tag">Finance</span> Search “INV”
                </div>
              </div>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="search-empty-state">
              <p className="no-results-title">No matching records found</p>
              <p className="no-results-desc">
                No results match “<strong>{query}</strong>” within your authorized access scope.
              </p>
            </div>
          )}

          {results.length > 0 &&
            results.map((item: SearchResultItem, idx: number) => {
              const Icon = CATEGORY_ICONS[item.category] || GraduationCap
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  className={`search-result-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onClose()
                    router.push(item.actionUrl)
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={`result-category-icon ${item.category}`}>
                    <Icon size={18} />
                  </div>

                  <div className="result-info">
                    <div className="result-title-row">
                      <span className="result-title">{item.title}</span>
                      {item.badge && (
                        <span className={`result-badge ${item.badgeVariant || 'default'}`}>
                          {item.badge}
                        </span>
                      )}
                      <span className="result-category-label">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>
                    {item.subtitle && <span className="result-subtitle">{item.subtitle}</span>}
                  </div>

                  <div className="result-arrow">
                    {isSelected ? (
                      <span className="enter-key-indicator">
                        <CornerDownLeft size={13} />
                      </span>
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Modal Footer */}
        <div className="search-modal-footer">
          <div className="footer-keys">
            <span className="key-shortcut">
              <kbd>↑</kbd>
              <kbd>↓</kbd> Navigate
            </span>
            <span className="key-shortcut">
              <kbd>↵</kbd> Select
            </span>
            <span className="key-shortcut">
              <kbd>esc</kbd> Close
            </span>
          </div>

          {query.trim() && data && data.total > 0 && (
            <button
              type="button"
              className="footer-view-all"
              onClick={() => {
                onClose()
                router.push(`/app/search?q=${encodeURIComponent(query.trim())}${activeCategory !== 'all' ? `&category=${activeCategory}` : ''}`)
              }}
            >
              View all results ({data.total}) <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
