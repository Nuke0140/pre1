'use client'

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, Check, Sparkles } from 'lucide-react'
import { enumLabel } from '@/lib/format'

export interface ClassroomPillItem {
  id: string
  name: string
  code?: string
  programType?: string
  branchId?: string
  academicSessionId?: string
  programId?: string
  capacity?: number
  students?: number
  activeEnrollment?: number
  enrolledCount?: number
  _count?: {
    students?: number
  }
}

export interface ClassroomFilterPillsProps {
  /** All classrooms authorized in the current scope */
  classrooms: ClassroomPillItem[]
  /** Currently active classroom ID ('ALL' or specific classroom ID) */
  selectedClassroomId: string
  /** Callback invoked when a pill is selected */
  onSelectClassroom: (classroomId: string) => void
  /** Total count of students across all classrooms in the current scope (for 'All' pill) */
  totalCount?: number | null
  /** Optional loading state for counts or records */
  loading?: boolean
  /** Active branch filter ('ALL' or specific branchId) */
  branchId?: string
  /** Active academic session filter ('ALL' or specific sessionId) */
  academicSessionId?: string
  /** Active program filter ('ALL' or specific programId / programType) */
  programId?: string
  /** Maximum number of pills shown before collapsing into '+N more' dropdown (default: 8) */
  maxVisiblePills?: number
  /** Additional container CSS class */
  className?: string
  /** Label for the 'All' pill (default: 'All') */
  allLabel?: string
}

/**
 * ClassroomFilterPills — Production-ready 1-Tap Classroom Switching Rail.
 *
 * Features:
 * - One-tap classroom switching.
 * - Dynamic authoritative counts: `All (86)`, `Nursery-A (22)`.
 * - Hierarchy awareness: filters pills by active branch, academic session, and program.
 * - Auto-deselect safety: safely resets to 'ALL' if current classroom becomes invalid under scope change.
 * - Keyboard navigation (ArrowLeft, ArrowRight, Home, End, Enter, Space).
 * - Single-row horizontal scroll with touch-pan-x and edge-fade indicators.
 * - Compact overflow menu for branches with large classroom counts.
 * - Full theme-adaptive styling and ARIA accessibility semantics.
 */
export function ClassroomFilterPills({
  classrooms = [],
  selectedClassroomId = 'ALL',
  onSelectClassroom,
  totalCount = null,
  loading = false,
  branchId = 'ALL',
  academicSessionId = 'ALL',
  programId = 'ALL',
  maxVisiblePills = 10,
  className = '',
  allLabel = 'All',
}: ClassroomFilterPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false)
  const [hasRightOverflow, setHasRightOverflow] = useState(false)
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  // 1. Filter classrooms matching current active hierarchy scope
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      if (branchId && branchId !== 'ALL' && c.branchId && c.branchId !== branchId) {
        return false
      }
      if (academicSessionId && academicSessionId !== 'ALL' && c.academicSessionId && c.academicSessionId !== academicSessionId) {
        return false
      }
      if (programId && programId !== 'ALL') {
        const matchesType = c.programType === programId
        const matchesId = c.programId === programId
        if (!matchesType && !matchesId) return false
      }
      return true
    })
  }, [classrooms, branchId, academicSessionId, programId])

  // 2. Safety check: If current selection is not valid in filtered set, reset safely
  useEffect(() => {
    if (selectedClassroomId && selectedClassroomId !== 'ALL') {
      const exists = filteredClassrooms.some((c) => c.id === selectedClassroomId)
      if (!exists && filteredClassrooms.length > 0) {
        onSelectClassroom('ALL')
      }
    }
  }, [filteredClassrooms, selectedClassroomId, onSelectClassroom])

  // 3. Compute count helper
  const getPillCount = useCallback((c: ClassroomPillItem): number | null => {
    if (typeof c.activeEnrollment === 'number') return c.activeEnrollment
    if (typeof c.enrolledCount === 'number') return c.enrolledCount
    if (typeof c.students === 'number') return c.students
    if (typeof c._count?.students === 'number') return c._count.students
    return null
  }, [])

  // Authoritative 'All' count
  const authoritativeAllCount = useMemo(() => {
    if (typeof totalCount === 'number') return totalCount
    // Aggregate sum from visible classrooms if available
    let sum = 0
    let hasValid = false
    for (const c of filteredClassrooms) {
      const cnt = getPillCount(c)
      if (cnt !== null) {
        sum += cnt
        hasValid = true
      }
    }
    return hasValid ? sum : null
  }, [totalCount, filteredClassrooms, getPillCount])

  // 4. Overflow handling
  const checkScrollOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setHasLeftOverflow(scrollLeft > 4)
    setHasRightOverflow(scrollLeft < scrollWidth - clientWidth - 4)
  }, [])

  useEffect(() => {
    checkScrollOverflow()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScrollOverflow, { passive: true })
    window.addEventListener('resize', checkScrollOverflow)
    return () => {
      el.removeEventListener('scroll', checkScrollOverflow)
      window.removeEventListener('resize', checkScrollOverflow)
    }
  }, [checkScrollOverflow, filteredClassrooms.length])

  // Auto-scroll selected pill into view smoothly
  useEffect(() => {
    if (!scrollRef.current) return
    const activePill = scrollRef.current.querySelector('[aria-selected="true"]') as HTMLElement
    if (activePill) {
      const container = scrollRef.current
      const left = activePill.offsetLeft - container.offsetLeft - 32
      container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    }
  }, [selectedClassroomId])

  // Click outside listener for overflow dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false)
      }
    }
    if (moreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [moreDropdownOpen])

  // Partition visible vs overflow pills
  const { visiblePills, overflowPills, isSelectedInOverflow } = useMemo(() => {
    if (filteredClassrooms.length <= maxVisiblePills) {
      return {
        visiblePills: filteredClassrooms,
        overflowPills: [],
        isSelectedInOverflow: false,
      }
    }

    const selectedIndex = filteredClassrooms.findIndex((c) => c.id === selectedClassroomId)
    // If selected is beyond maxVisiblePills, pin it inside visible or flag it
    const visible = filteredClassrooms.slice(0, maxVisiblePills)
    const overflow = filteredClassrooms.slice(maxVisiblePills)
    const inOverflow = selectedIndex >= maxVisiblePills

    return {
      visiblePills: visible,
      overflowPills: overflow,
      isSelectedInOverflow: inOverflow,
    }
  }, [filteredClassrooms, maxVisiblePills, selectedClassroomId])

  // Keyboard navigation across pills
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const pills = Array.from(
      scrollRef.current?.querySelectorAll<HTMLButtonElement>('.cfp-pill') || []
    )
    if (pills.length === 0) return

    const currentIndex = pills.findIndex((p) => p === document.activeElement)
    let nextIndex = currentIndex

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = currentIndex < pills.length - 1 ? currentIndex + 1 : 0
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = currentIndex > 0 ? currentIndex - 1 : pills.length - 1
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = pills.length - 1
    }

    if (nextIndex !== currentIndex && pills[nextIndex]) {
      pills[nextIndex].focus()
    }
  }

  const selectedOverflowClassroom = useMemo(() => {
    return overflowPills.find((c) => c.id === selectedClassroomId)
  }, [overflowPills, selectedClassroomId])

  return (
    <div
      className={`cfp-container ${hasLeftOverflow ? 'cfp-has-left-overflow' : ''} ${
        hasRightOverflow ? 'cfp-has-right-overflow' : ''
      } ${className}`}
      role="region"
      aria-label="Classroom quick switch"
    >
      <div
        ref={scrollRef}
        className="cfp-scroll-track"
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
      >
        {/* ── 1. ALL CLASSROOMS PILL ── */}
        <button
          type="button"
          role="tab"
          id="classroom-pill-all"
          aria-selected={selectedClassroomId === 'ALL'}
          aria-controls="student-roster-content"
          tabIndex={selectedClassroomId === 'ALL' ? 0 : -1}
          onClick={() => onSelectClassroom('ALL')}
          className={`cfp-pill ${selectedClassroomId === 'ALL' ? 'is-active' : ''}`}
        >
          <span>{allLabel}</span>
          {authoritativeAllCount !== null && (
            <span
              className="cfp-pill-count"
              title={`${authoritativeAllCount} total students`}
              aria-label={`${authoritativeAllCount} students`}
            >
              {loading ? '…' : authoritativeAllCount}
            </span>
          )}
        </button>

        {/* ── 2. VISIBLE CLASSROOM PILLS ── */}
        {visiblePills.map((c) => {
          const isSelected = selectedClassroomId === c.id
          const count = getPillCount(c)

          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              id={`classroom-pill-${c.id}`}
              aria-selected={isSelected}
              aria-controls="student-roster-content"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelectClassroom(c.id)}
              className={`cfp-pill ${isSelected ? 'is-active' : ''}`}
            >
              <span>{c.name}</span>
              {c.programType && (
                <span className="cfp-pill-tag">
                  {enumLabel(c.programType)}
                </span>
              )}
              {count !== null && (
                <span
                  className="cfp-pill-count"
                  title={`${count} active students`}
                  aria-label={`${count} students`}
                >
                  {loading && isSelected ? '…' : count}
                </span>
              )}
            </button>
          )
        })}

        {/* ── 3. OVERFLOW DROPDOWN FOR LARGE CLASSROOM LISTS ── */}
        {overflowPills.length > 0 && (
          <div ref={moreRef} className="relative inline-flex items-center">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={moreDropdownOpen}
              onClick={() => setMoreDropdownOpen((prev) => !prev)}
              className={`cfp-overflow-trigger ${
                isSelectedInOverflow ? 'is-active' : ''
              }`}
              title="More classrooms"
            >
              <span>
                {selectedOverflowClassroom
                  ? selectedOverflowClassroom.name
                  : `+${overflowPills.length} more`}
              </span>
              {selectedOverflowClassroom && (
                <span className="cfp-pill-count">
                  {getPillCount(selectedOverflowClassroom) ?? ''}
                </span>
              )}
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  moreDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {moreDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-50 min-w-[200px] max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1.5 animate-in fade-in zoom-in-95"
                role="listbox"
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Additional Classrooms
                </div>
                {overflowPills.map((c) => {
                  const isSelected = selectedClassroomId === c.id
                  const count = getPillCount(c)

                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectClassroom(c.id)
                        setMoreDropdownOpen(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isSelected && <Check size={12} className="shrink-0 text-purple-600" />}
                        <span className="truncate">{c.name}</span>
                        {c.programType && (
                          <span className="text-[10px] opacity-60">
                            ({enumLabel(c.programType)})
                          </span>
                        )}
                      </div>
                      {count !== null && (
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
