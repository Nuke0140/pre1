'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Clipboard, Eraser, AlertCircle } from 'lucide-react'
import { sanitizeInputCellValue } from '@/lib/importers/spreadsheet-parser'

export interface GridColumn {
  key: string
  label: string
  required?: boolean
  placeholder?: string
  width?: string
  options?: string[] // For select dropdowns
}

interface SpreadsheetQuickGridProps {
  columns: GridColumn[]
  initialRows?: Record<string, string>[]
  onChange?: (rows: Record<string, string>[]) => void
  onValidate?: (rows: Record<string, string>[]) => void
  disabled?: boolean
}

export function SpreadsheetQuickGrid({
  columns,
  initialRows = [],
  onChange,
  onValidate,
  disabled = false,
}: SpreadsheetQuickGridProps) {
  // Start with 5 empty rows if none provided
  const createEmptyRow = useCallback(() => {
    const row: Record<string, string> = {}
    columns.forEach((c) => {
      row[c.key] = ''
    })
    return row
  }, [columns])

  const [rows, setRows] = useState<Record<string, string>[]>(() => {
    if (initialRows && initialRows.length > 0) return initialRows
    return [createEmptyRow(), createEmptyRow(), createEmptyRow(), createEmptyRow(), createEmptyRow()]
  })

  const [activeCell, setActiveCell] = useState<{ rowIndex: number; colKey: string } | null>(null)
  const [pasteNotice, setPasteNotice] = useState<string | null>(null)

  const updateRows = (newRows: Record<string, string>[]) => {
    setRows(newRows)
    onChange?.(newRows)
  }

  const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
    const cleaned = sanitizeInputCellValue(value)
    const newRows = [...rows]
    newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: cleaned }
    updateRows(newRows)
  }

  const handleAddRow = () => {
    updateRows([...rows, createEmptyRow()])
  }

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      updateRows([createEmptyRow()])
      return
    }
    const newRows = rows.filter((_, i) => i !== index)
    updateRows(newRows)
  }

  const handleClearAll = () => {
    updateRows([createEmptyRow(), createEmptyRow(), createEmptyRow()])
    setPasteNotice(null)
  }

  /**
   * Handle pasting clipboard data directly into the table.
   * Splits by newline for rows and tab for columns (Excel / Google Sheets standard).
   */
  const handlePaste = (e: React.ClipboardEvent, startRowIndex: number = 0, startColIndex: number = 0) => {
    e.preventDefault()
    const clipboardData = e.clipboardData.getData('text')
    if (!clipboardData) return

    const normalized = clipboardData.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const rawLines = normalized.split('\n').filter((l) => l.length > 0)
    if (rawLines.length === 0) return

    // Detect delimiter: Tab for Excel/Sheets, fallback to comma
    const isTab = rawLines[0].includes('\t')
    const delimiter = isTab ? '\t' : ','

    const parsedMatrix: string[][] = rawLines.map((line) => {
      return line.split(delimiter).map((cell) => sanitizeInputCellValue(cell))
    })

    // Check if the first row appears to be a header row matching our column labels
    let matrixToInsert = parsedMatrix
    const firstRowNormalized = parsedMatrix[0].map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const columnLabelsNormalized = columns.map((c) => c.label.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const headerMatches = firstRowNormalized.filter((c) => columnLabelsNormalized.includes(c)).length

    if (headerMatches >= Math.min(2, columns.length)) {
      // First row is headers! Remove it so we only insert data rows
      matrixToInsert = parsedMatrix.slice(1)
    }

    if (matrixToInsert.length === 0) return

    const newRows = [...rows]
    for (let i = 0; i < matrixToInsert.length; i++) {
      const targetRowIndex = startRowIndex + i
      const rowData = matrixToInsert[i]
      const existingRow = newRows[targetRowIndex] || createEmptyRow()
      const updatedRow = { ...existingRow }

      for (let j = 0; j < rowData.length; j++) {
        const targetColIndex = startColIndex + j
        if (targetColIndex < columns.length) {
          const colKey = columns[targetColIndex].key
          updatedRow[colKey] = rowData[j]
        }
      }

      if (targetRowIndex < newRows.length) {
        newRows[targetRowIndex] = updatedRow
      } else {
        newRows.push(updatedRow)
      }
    }

    updateRows(newRows)
    setPasteNotice(`Successfully pasted ${matrixToInsert.length} row(s) from spreadsheet.`)
    setTimeout(() => setPasteNotice(null), 4000)
  }

  // Count non-empty rows
  const populatedRowCount = rows.filter((r) => Object.values(r).some((v) => v.trim() !== '')).length

  return (
    <div className="space-y-3">
      {/* Quick Grid Action Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Spreadsheet Quick Grid:
          </span>
          <span className="badge b-primary text-[11px] font-mono">
            {populatedRowCount} populated row(s)
          </span>
          {pasteNotice && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs animate-in fade-in flex items-center gap-1">
              ✓ {pasteNotice}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAddRow}
            disabled={disabled}
            className="btn btn-secondary text-xs flex items-center gap-1 py-1 px-2.5"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" />
            <span>Add Row</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled || populatedRowCount === 0}
            className="btn btn-secondary text-xs flex items-center gap-1 py-1 px-2.5 text-gray-500 hover:text-red-600"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center font-mono text-[11px] text-gray-400 select-none">
                  #
                </th>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{ minWidth: c.width || '150px' }}
                    className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white select-none whitespace-nowrap"
                  >
                    <span>{c.label}</span>
                    {c.required && <span className="text-red-500 ml-0.5">*</span>}
                  </th>
                ))}
                <th className="py-2.5 px-2 w-10 text-center font-semibold text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 bg-white dark:bg-card">
              {rows.map((row, rIdx) => {
                const isPopulated = Object.values(row).some((v) => v.trim() !== '')
                return (
                  <tr
                    key={rIdx}
                    className={`hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors ${
                      isPopulated ? '' : 'opacity-70'
                    }`}
                  >
                    <td className="py-1 px-2 text-center font-mono text-[11px] text-gray-400 select-none">
                      {rIdx + 1}
                    </td>
                    {columns.map((col, cIdx) => {
                      const val = row[col.key] || ''
                      const isFocused = activeCell?.rowIndex === rIdx && activeCell?.colKey === col.key
                      return (
                        <td
                          key={col.key}
                          className={`p-1 border-r border-gray-100 dark:border-gray-800/50 last:border-r-0 ${
                            isFocused ? 'ring-2 ring-purple-500 rounded' : ''
                          }`}
                        >
                          {col.options && col.options.length > 0 ? (
                            <select
                              value={val}
                              disabled={disabled}
                              onFocus={() => setActiveCell({ rowIndex: rIdx, colKey: col.key })}
                              onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                              className="w-full py-1 px-2 text-xs bg-transparent border-0 focus:outline-none rounded text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Select...</option>
                              {col.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={val}
                              placeholder={col.placeholder || ''}
                              disabled={disabled}
                              onFocus={() => setActiveCell({ rowIndex: rIdx, colKey: col.key })}
                              onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                              onPaste={(e) => handlePaste(e, rIdx, cIdx)}
                              className="w-full py-1 px-2 text-xs bg-transparent border-0 focus:outline-none focus:bg-purple-50/50 dark:focus:bg-purple-950/40 rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                          )}
                        </td>
                      )
                    })}
                    <td className="py-1 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        disabled={disabled}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy-Paste Hint Footer */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 px-1">
        <div className="flex items-center gap-1.5">
          <Clipboard className="w-3.5 h-3.5 text-purple-500" />
          <span>
            <strong>Pro-tip:</strong> Copy rows from Excel or Google Sheets and press{' '}
            <kbd className="px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono text-[10px]">
              Ctrl+V
            </kbd>{' '}
            in any cell to auto-populate all rows and columns.
          </span>
        </div>
      </div>
    </div>
  )
}
