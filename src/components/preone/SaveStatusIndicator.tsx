'use client'

import React, { useMemo } from 'react'
import {
  CheckCircle2,
  Clock3,
  Loader2,
  AlertCircle,
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import { SaveStatus } from '@/lib/forms/use-autosave'

export interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt?: Date | null
  error?: Error | null
  onRetry?: () => void
  className?: string
  compact?: boolean
  showTime?: boolean
}

function formatSavedTime(date: Date): string {
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function SaveStatusIndicator({
  status,
  lastSavedAt,
  error,
  onRetry,
  className = '',
  compact = false,
  showTime = true,
}: SaveStatusIndicatorProps) {
  const formattedTime = useMemo(() => {
    return lastSavedAt ? formatSavedTime(lastSavedAt) : null
  }, [lastSavedAt])

  if (status === 'IDLE') {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs transition-all duration-200 select-none ${className}`.trim()}
    >
      {status === 'UNSAVED' && (
        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <Clock3 className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" />
          <span>{compact ? 'Unsaved' : 'Unsaved changes'}</span>
        </span>
      )}

      {status === 'SAVING' && (
        <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-purple-600 dark:text-purple-400" />
          <span>{compact ? 'Saving…' : 'Saving draft…'}</span>
        </span>
      )}

      {status === 'SAVED' && (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span>
            {compact ? 'Draft saved' : 'Draft saved'}
            {showTime && formattedTime ? ` (${formattedTime})` : ''}
          </span>
        </span>
      )}

      {status === 'OFFLINE_LOCAL' && (
        <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{compact ? 'Offline' : 'Offline — stored locally'}</span>
        </span>
      )}

      {status === 'ERROR' && (
        <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{error?.message ? `Save failed: ${error.message}` : 'Save failed'}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 inline-flex items-center gap-1 text-[11px] underline font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </span>
      )}
    </div>
  )
}
