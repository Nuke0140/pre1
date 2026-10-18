'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, Check, Sparkles } from 'lucide-react'
import { SeatAvailabilityBadge } from './SeatAvailabilityBadge'
import type { ProgramCapacitySummary, SeatAvailabilityStatus } from '@/lib/admissions/capacity-service'

export interface ProgramOption {
  id: string
  name: string
  code?: string | null
  programType?: string | null
  ageMinMonths?: number | null
  ageMaxMonths?: number | null
  capacitySummary?: ProgramCapacitySummary
}

export interface ProgramSeatSelectorProps {
  programs: ProgramOption[]
  value?: string
  onChange: (value: string) => void
  branchId?: string | null
  disabled?: boolean
  required?: boolean
  placeholder?: string
  className?: string
  id?: string
  name?: string
}

export function ProgramSeatSelector({
  programs,
  value,
  onChange,
  branchId,
  disabled = false,
  required = false,
  placeholder = 'Select Program Level...',
  className = '',
  id: propId,
  name,
}: ProgramSeatSelectorProps) {
  const autoId = useId()
  const componentId = propId || autoId
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [capacityMap, setCapacityMap] = useState<Record<string, ProgramCapacitySummary>>({})
  const [loadingCapacity, setLoadingCapacity] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch program capacity metrics if branchId is provided
  useEffect(() => {
    let isCancelled = false
    async function loadCapacity() {
      if (!branchId) return
      setLoadingCapacity(true)
      try {
        const res = await fetch(`/api/v1/admissions/capacity?branchId=${encodeURIComponent(branchId)}`)
        const json = await res.json()
        if (!isCancelled && json.success && Array.isArray(json.data?.programs)) {
          const map: Record<string, ProgramCapacitySummary> = {}
          for (const p of json.data.programs) {
            map[p.programType] = p
            if (p.programId) map[p.programId] = p
          }
          setCapacityMap(map)
        }
      } catch (err) {
        console.error('Failed to load program capacity:', err)
      } finally {
        if (!isCancelled) setLoadingCapacity(false)
      }
    }

    loadCapacity()
    return () => {
      isCancelled = true
    }
  }, [branchId])

  // Click outside to close
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

  const selectedProgram = programs.find(
    (p) => (p.programType || p.code || p.id) === value || p.id === value
  )

  const selectedMetrics = selectedProgram
    ? capacityMap[selectedProgram.programType || selectedProgram.code || selectedProgram.id] ||
      selectedProgram.capacitySummary
    : undefined

  const handleSelect = (progVal: string) => {
    onChange(progVal)
    setIsOpen(false)
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
        setActiveIndex((prev) => (prev < programs.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : programs.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < programs.length) {
          const item = programs[activeIndex]
          handleSelect(item.programType || item.code || item.id)
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
          {selectedProgram ? (
            <div className="flex items-center justify-between gap-2">
              <div className="truncate font-semibold text-foreground">
                <span>{selectedProgram.name}</span>
                {(selectedProgram.ageMinMonths != null || selectedProgram.ageMaxMonths != null) && (
                  <span className="text-[10.5px] text-muted-foreground ml-1.5 font-normal">
                    ({selectedProgram.ageMinMonths ?? 0}–{selectedProgram.ageMaxMonths ?? '∞'} mo)
                  </span>
                )}
              </div>
              {selectedMetrics && (
                <SeatAvailabilityBadge
                  status={selectedMetrics.status}
                  availableSeats={selectedMetrics.totalAvailableSeats}
                  capacity={selectedMetrics.totalCapacity}
                  statusLabel={selectedMetrics.statusLabel}
                  occupancySummary={selectedMetrics.occupancySummary}
                  size="xs"
                />
              )}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={componentId}
          className="absolute z-50 left-0 right-0 mt-1.5 p-1 rounded-2xl bg-popover/95 backdrop-blur-md border border-border/80 shadow-xl max-h-72 overflow-y-auto space-y-1 animation-in fade-in-50 zoom-in-95 duration-100"
        >
          {programs.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No programs available
            </div>
          ) : (
            programs.map((prog, idx) => {
              const progVal = prog.programType || prog.code || prog.id
              const isSelected = progVal === value || prog.id === value
              const isItemActive = idx === activeIndex
              const metrics =
                capacityMap[prog.programType || prog.code || prog.id] || prog.capacitySummary

              return (
                <div
                  key={prog.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(progVal)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`relative p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/20'
                      : isItemActive
                      ? 'bg-muted/70'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Line 1: Program Name + Badge */}
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
                        {prog.name}
                      </span>
                    </div>

                    {metrics && (
                      <SeatAvailabilityBadge
                        status={metrics.status}
                        availableSeats={metrics.totalAvailableSeats}
                        capacity={metrics.totalCapacity}
                        statusLabel={metrics.statusLabel}
                        occupancySummary={metrics.occupancySummary}
                        size="xs"
                      />
                    )}
                  </div>

                  {/* Line 2: Occupancy summary and age brackets */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-0.5">
                    {metrics ? (
                      <span className="flex items-center gap-1">
                        <span>{metrics.occupancySummary}</span>
                        {metrics.sectionCount > 0 && (
                          <span className="opacity-70">
                            · {metrics.sectionCount} section{metrics.sectionCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="opacity-60">Program Tier</span>
                    )}

                    {(prog.ageMinMonths != null || prog.ageMaxMonths != null) && (
                      <span className="text-[10.5px] opacity-80">
                        {prog.ageMinMonths ?? 0}–{prog.ageMaxMonths ?? '∞'} months
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
