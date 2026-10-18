'use client'

import React, { useState, useMemo } from 'react'
import {
  Users,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Plus,
  CheckSquare2,
  Square
} from 'lucide-react'
import { StudentRosterCard, StudentRosterRecord } from './StudentRosterCard'
import { Skeleton } from '@/components/preone'

export interface StudentRosterCardGridProps {
  students: StudentRosterRecord[]
  loading?: boolean
  selectedIds?: (string | number)[]
  onToggleSelect?: (id: string) => void
  onSelectAll?: (ids: string[]) => void
  canSelect?: boolean
  onInspect?: (student: StudentRosterRecord) => void
  onViewProfile?: (id: string) => void
  onAssignClass?: (id: string) => void
  canWriteStudents?: boolean
  onOpenSafety?: (student: StudentRosterRecord) => void
  activeFiltersCount?: number
  onClearFilters?: () => void
  onEnrollChild?: () => void
  pageSize?: number
}

export function StudentRosterCardGrid({
  students,
  loading = false,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  canSelect = false,
  onInspect,
  onViewProfile,
  onAssignClass,
  onOpenSafety,
  canWriteStudents = false,
  activeFiltersCount = 0,
  onClearFilters,
  onEnrollChild,
  pageSize = 12,
}: StudentRosterCardGridProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 if students list changes significantly
  React.useEffect(() => {
    setCurrentPage(1)
  }, [students.length])

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedStudents = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return students.slice(startIndex, startIndex + pageSize)
  }, [students, safeCurrentPage, pageSize])

  const allPageIdsSelected = useMemo(() => {
    if (paginatedStudents.length === 0) return false
    return paginatedStudents.every((s) => selectedIds.includes(s.id))
  }, [paginatedStudents, selectedIds])

  const handleToggleSelectAllPage = () => {
    if (!onSelectAll) return
    if (allPageIdsSelected) {
      // Deselect page items
      const pageIdSet = new Set(paginatedStudents.map((s) => s.id))
      onSelectAll(selectedIds.filter((id) => !pageIdSet.has(String(id))) as string[])
    } else {
      // Add all page items to selection
      const newIds = new Set([...selectedIds.map(String), ...paginatedStudents.map((s) => s.id)])
      onSelectAll(Array.from(newIds))
    }
  }

  // ── Loading Skeletons ──
  if (loading && students.length === 0) {
    return (
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-4.5">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 space-y-3.5 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 mx-auto" />
              <div className="space-y-1.5 text-center">
                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                <div className="w-16 h-3 bg-slate-100 dark:bg-slate-800/60 rounded mx-auto" />
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="w-14 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Empty State ──
  if (students.length === 0) {
    return (
      <div className="py-16 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center border border-purple-200/50 dark:border-purple-800/40 shadow-xs">
          <Users size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {activeFiltersCount > 0 ? 'No matching children found' : 'No children enrolled yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {activeFiltersCount > 0
              ? 'Try adjusting your campus, session, classroom or search keyword.'
              : 'Admit your first preschool child to populate the visual roster.'}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          {activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs font-semibold transition-colors"
            >
              <FilterX size={14} />
              <span>Clear All Filters</span>
            </button>
          ) : canWriteStudents ? (
            <button
              type="button"
              onClick={onEnrollChild}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Enroll First Child</span>
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* ── Sub-header Toolbar: Card Selection & Count ── */}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <div className="flex items-center gap-2">
          {canSelect && onSelectAll && (
            <button
              type="button"
              onClick={handleToggleSelectAllPage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              title={allPageIdsSelected ? 'Deselect page' : 'Select all on this page'}
            >
              {allPageIdsSelected ? (
                <CheckSquare2 size={14} className="text-purple-600 dark:text-purple-400" />
              ) : (
                <Square size={14} className="text-slate-400" />
              )}
              <span>Select Page ({paginatedStudents.length})</span>
            </button>
          )}

          <span className="font-medium">
            Showing <b className="text-slate-900 dark:text-white">{paginatedStudents.length}</b> of{' '}
            <b className="text-slate-900 dark:text-white">{students.length}</b> students
          </span>
        </div>

        {/* Quick Pagination Stats */}
        {totalPages > 1 && (
          <div className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-800 dark:text-slate-200">{safeCurrentPage}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</span>
          </div>
        )}
      </div>

      {/* ── Visual Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-4.5">
        {paginatedStudents.map((student) => (
          <StudentRosterCard
            key={student.id}
            student={student}
            selected={selectedIds.includes(student.id)}
            onToggleSelect={onToggleSelect}
            canSelect={canSelect}
            onInspect={onInspect}
            onViewProfile={onViewProfile}
            onAssignClass={onAssignClass}
            onOpenSafety={onOpenSafety}
            canWriteStudents={canWriteStudents}
          />
        ))}
      </div>

      {/* ── Pagination Controls ── */}
      {totalPages > 1 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing {(safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, students.length)} of {students.length} students
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors min-h-[36px]"
              aria-label="Previous Page"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                const isActive = num === safeCurrentPage
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors min-h-[32px] min-w-[32px] ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors min-h-[36px]"
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
