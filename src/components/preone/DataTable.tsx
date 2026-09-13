'use client'

import React, { useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react'
import { Skeleton, EmptyState } from './ui'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string | number
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | null
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: React.ReactNode
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  searchValue?: string
  toolbarActions?: React.ReactNode
  filters?: React.ReactNode
  onRowClick?: (row: T) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (p: number) => void
  }
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading,
  error,
  emptyTitle = 'No records found',
  emptyMessage = 'No records are currently available matching your criteria.',
  emptyAction,
  searchPlaceholder,
  onSearch,
  searchValue,
  toolbarActions,
  filters,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(searchValue || '')

  const handleSearchChange = (val: string) => {
    setLocalSearch(val)
    if (onSearch) onSearch(val)
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  return (
    <div className="dtable-wrap">
      {(searchPlaceholder || filters || toolbarActions) && (
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            {searchPlaceholder && (
              <div className="input-search" style={{ maxWidth: 280, width: '100%' }}>
                <Search size={15} />
                <input
                  className="input"
                  placeholder={searchPlaceholder}
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            )}
            {filters}
          </div>
          {toolbarActions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {toolbarActions}
            </div>
          )}
        </div>
      )}

      <div className="dtable-scroll">
        <table className="dtable">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    textAlign: col.align || 'left',
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 &&
              data.map((row, idx) => (
                <tr
                  key={row.id ? String(row.id) : idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.render ? col.render(row, idx) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>

        {loading && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} h={38} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <AlertCircle size={32} style={{ color: 'var(--danger)', margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600, color: 'var(--danger)' }}>Failed to load data</div>
            <div className="t-caption" style={{ marginTop: 4 }}>{error}</div>
          </div>
        )}

        {!loading && !error && data && data.length === 0 && (
          <EmptyState
            icon={<Filter size={36} />}
            title={emptyTitle}
            message={emptyMessage}
            action={emptyAction}
          />
        )}
      </div>

      {pagination && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)' }}>
          <span className="t-caption">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '0 4px' }}>
              {pagination.page} / {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
