'use client'

import React from 'react'
import { FileText, RotateCcw, Trash2 } from 'lucide-react'

export interface DraftRecoveryBannerProps {
  onRestore: () => void
  onDiscard: () => void
  savedAt?: Date | null
  className?: string
  message?: string
}

export function DraftRecoveryBanner({
  onRestore,
  onDiscard,
  savedAt,
  className = '',
  message,
}: DraftRecoveryBannerProps) {
  const timeString = savedAt
    ? savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      role="region"
      aria-label="Draft recovery notification"
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 shadow-xs ${className}`.trim()}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-purple-950 dark:text-purple-100">
            {message || 'Unsaved draft found'}
          </p>
          <p className="text-purple-700/80 dark:text-purple-300/80 text-[11px]">
            {timeString
              ? `You have a draft saved from ${timeString}. Would you like to restore it?`
              : 'You have an earlier draft available. Would you like to restore it?'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors font-medium text-xs cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Discard</span>
        </button>
        <button
          type="button"
          onClick={onRestore}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Draft</span>
        </button>
      </div>
    </div>
  )
}
