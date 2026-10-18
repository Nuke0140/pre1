'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Check, Search, AlertCircle, Building, User } from 'lucide-react'
import { SeatAvailabilityBadge } from './SeatAvailabilityBadge'
import type { CapacityMetrics, SeatAvailabilityStatus } from '@/lib/admissions/capacity-service'

export interface ClassroomOption {
  id: string
  name: string
  code?: string | null
  programType?: string | null
  capacity: number
  enrolledCount?: number
  students?: number
  availableSeats?: number
  isFull?: boolean
  status?: SeatAvailabilityStatus | string
  statusLabel?: string
  occupancySummary?: string
  occupancyPercent?: number
  teacher?: string | null
  primaryTeacher?: { fullName?: string | null } | null
  branchName?: string | null
  branch?: { name?: string | null } | null
}

export interface ClassroomSeatSelectorProps {
  classrooms: ClassroomOption[]
  value?: string
  onChange: (classroomId: string) => void
  disabled?: boolean
  required?: boolean
  placeholder?: string
  allowWaitlistSelect?: boolean
  className?: string
  id?: string
  name?: string
}

export function ClassroomSeatSelector({
  classrooms,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select a classroom section...',
  allowWaitlistSelect = false,
  className = '',
  id: propId,
  name,
}: ClassroomSeatSelectorProps) {
  const autoId = useId()
  const componentId = propId || autoId
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Normalize classroom data to ensure capacity and occupancy fields exist
  const normalizedClassrooms = classrooms.map((c) => {
    const enrolled = c.enrolledCount ?? c.students ?? 0
    const capacity = c.capacity ?? 20
    const availableSeats = c.availableSeats ?? Math.max(0, capacity - enrolled)
    const isFull = c.isFull ?? enrolled >= capacity

    let status: SeatAvailabilityStatus = 'UNCONFIGURED'
    if (c.status) {
      status = c.status as SeatAvailabilityStatus
    } else if (capacity > 0) {
      if (availableSeats === 0) status = 'WAITLIST_ONLY'
      else if (availableSeats <= 3) status = 'LIMITED'
      else status = 'AVAILABLE'
    }

    const statusLabel =
      c.statusLabel ||
      (status === 'WAITLIST_ONLY'
        ? 'Full · Waitlist only'
        : status === 'FULL'
        ? 'Full'
        : availableSeats === 1
        ? '1 seat left'
        : `${availableSeats} seats left`)

    const occupancySummary = c.occupancySummary || `${enrolled}/${capacity} occupied`
    const teacherName =
      c.teacher || c.primaryTeacher?.fullName || null
    const branchName =
      c.branchName || c.branch?.name || null

    return {
      ...c,
      enrolled,
      capacity,
      availableSeats,
      isFull,
      status,
      statusLabel,
      occupancySummary,
      teacherName,
      branchName,
    }
  })

  const selectedClassroom = normalizedClassrooms.find((c) => c.id === value)

  const filteredClassrooms = normalizedClassrooms.filter((c) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    const nameMatch = c.name.toLowerCase().includes(term)
    const codeMatch = c.code ? c.code.toLowerCase().includes(term) : false
    const teacherMatch = c.teacherName ? c.teacherName.toLowerCase().includes(term) : false
    const branchMatch = c.branchName ? c.branchName.toLowerCase().includes(term) : false
    return nameMatch || codeMatch || teacherMatch || branchMatch
  })

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (classroomId: string, isDisabled: boolean) => {
    if (isDisabled) return
    onChange(classroomId)
    setIsOpen(false)
    setSearch('')
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setActiveIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < filteredClassrooms.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredClassrooms.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filteredClassrooms.length) {
          const item = filteredClassrooms[activeIndex]
          const isItemDisabled = item.availableSeats <= 0 && !allowWaitlistSelect
          handleSelect(item.id, isItemDisabled)
        }
        break
      default:
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ''}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        id={componentId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border bg-card text-foreground transition-all duration-150 text-left focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          isOpen ? 'border-primary ring-2 ring-primary/10 shadow-sm' : 'border-border/80 hover:border-border'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-muted/30' : 'cursor-pointer'}`}
      >
        <div className="flex-1 min-w-0 pr-1">
          {selectedClassroom ? (
            <div className="flex items-center justify-between gap-2">
              <div className="truncate font-semibold text-foreground">
                <span>{selectedClassroom.name}</span>
                {selectedClassroom.branchName && (
                  <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                    ({selectedClassroom.branchName})
                  </span>
                )}
              </div>
              <SeatAvailabilityBadge
                status={selectedClassroom.status}
                availableSeats={selectedClassroom.availableSeats}
                capacity={selectedClassroom.capacity}
                statusLabel={selectedClassroom.statusLabel}
                occupancySummary={selectedClassroom.occupancySummary}
                size="xs"
              />
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Selected Classroom secondary summary pill */}
      {selectedClassroom && !isOpen && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 px-1">
          <span>
            {selectedClassroom.occupancySummary} occupied
            {selectedClassroom.capacity > 0 && (
              <span className="ml-1 opacity-70">
                ({Math.round(((selectedClassroom.enrolled) / selectedClassroom.capacity) * 100)}%)
              </span>
            )}
          </span>
          {selectedClassroom.teacherName && (
            <span className="truncate max-w-[180px] flex items-center gap-1">
              <User size={10} className="text-primary/70" />
              <span>{selectedClassroom.teacherName}</span>
            </span>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={componentId}
          className="absolute z-50 left-0 right-0 mt-1.5 p-1 rounded-2xl bg-popover/95 backdrop-blur-md border border-border/80 shadow-xl max-h-72 overflow-hidden flex flex-col animation-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Search box if > 4 classrooms */}
          {normalizedClassrooms.length > 4 && (
            <div className="p-1.5 border-b border-border/60">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setActiveIndex(0)
                  }}
                  placeholder="Search section or teacher..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-muted/50 border-0 focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Classroom options list */}
          <div ref={listRef} className="overflow-y-auto max-h-60 p-1 space-y-1">
            {filteredClassrooms.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No matching classrooms found
              </div>
            ) : (
              filteredClassrooms.map((cls, idx) => {
                const isSelected = cls.id === value
                const isFull = cls.availableSeats <= 0
                const isOptionDisabled = isFull && !allowWaitlistSelect
                const isItemActive = idx === activeIndex

                return (
                  <div
                    key={cls.id}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isOptionDisabled}
                    onClick={() => handleSelect(cls.id, isOptionDisabled)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`relative p-2 rounded-xl transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/20'
                        : isItemActive
                        ? 'bg-muted/70'
                        : 'hover:bg-muted/50'
                    } ${
                      isOptionDisabled
                        ? 'opacity-60 cursor-not-allowed bg-muted/20'
                        : 'cursor-pointer'
                    }`}
                  >
                    {/* Line 1: Name + Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isSelected && (
                          <Check size={12} className="shrink-0 text-primary" />
                        )}
                        <span
                          className={`font-semibold text-xs truncate ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {cls.name}
                        </span>
                        {cls.branchName && (
                          <span className="text-[10px] text-muted-foreground font-normal shrink-0">
                            · {cls.branchName}
                          </span>
                        )}
                      </div>

                      <SeatAvailabilityBadge
                        status={cls.status}
                        availableSeats={cls.availableSeats}
                        capacity={cls.capacity}
                        statusLabel={cls.statusLabel}
                        occupancySummary={cls.occupancySummary}
                        size="xs"
                      />
                    </div>

                    {/* Line 2: Occupancy summary + Teacher info */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-0.5">
                      <span className="flex items-center gap-1">
                        <span>{cls.occupancySummary}</span>
                        {cls.availableSeats > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ({cls.availableSeats} open)
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            (At capacity)
                          </span>
                        )}
                      </span>

                      {cls.teacherName ? (
                        <span className="truncate max-w-[150px] opacity-80">
                          Teacher: {cls.teacherName}
                        </span>
                      ) : (
                        <span className="opacity-60 italic text-[10px]">
                          Teacher not assigned
                        </span>
                      )}
                    </div>

                    {/* Disabled warning indicator */}
                    {isOptionDisabled && (
                      <div className="mt-1 flex items-center gap-1 text-[10.5px] text-destructive">
                        <AlertCircle size={10} className="shrink-0" />
                        <span>Section full. Select another section or configure waitlist.</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
