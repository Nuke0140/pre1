'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
  FileCheck,
  Users,
} from 'lucide-react'
import { DailyReportPublishModal } from './DailyReportPublishModal'

interface EndOfDayPublishCardProps {
  classroomId: string
  classroomName?: string
  dateStr: string
  onRefreshDayStream?: () => void
}

export function EndOfDayPublishCard({
  classroomId,
  classroomName = 'Classroom',
  dateStr,
  onRefreshDayStream,
}: EndOfDayPublishCardProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    classroomName: string
    stats: {
      totalEligible: number
      readyCount: number
      needsReviewCount: number
      publishedCount: number
      canPublish: boolean
    }
    students: any[]
  } | null>(null)

  const [modalOpen, setModalOpen] = useState(false)

  const loadReadiness = async () => {
    if (!classroomId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/v1/daily-diary/reports/readiness?classroomId=${classroomId}&date=${dateStr}`
      )
      const json = await res.json()
      if (res.ok && json.data) {
        setData(json.data)
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReadiness()
  }, [classroomId, dateStr])

  if (!data) return null

  const stats = data.stats
  const titleCount = stats.readyCount > 0 ? stats.readyCount : stats.totalEligible
  const titleText =
    stats.publishedCount === stats.totalEligible && stats.totalEligible > 0
      ? `All ${stats.publishedCount} Daily Summaries Published for ${data.classroomName}`
      : `${titleCount} Daily Summaries ${stats.readyCount > 0 ? 'Ready' : 'Prepared'} for ${data.classroomName}`

  return (
    <>
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-background shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-extrabold tracking-tight text-foreground">
                {titleText}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground pl-10">
              End-of-day parent report publishing. Review child attendance, meals, naps, activities, and observations before sending.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn btn-sm btn-primary rounded-xl font-bold flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Review & Send to Parents</span>
            </button>
          </div>
        </div>

        {/* Readiness Badges & Breakdown */}
        <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold border border-slate-500/20">
              {stats.totalEligible} Eligible Students
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
              {stats.readyCount} Ready to Publish
            </span>
            {stats.needsReviewCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                {stats.needsReviewCount} Need Review
              </span>
            )}
            {stats.publishedCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30">
                {stats.publishedCount} Published
              </span>
            )}
          </div>

          {stats.needsReviewCount > 0 && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Some reports need attendance marked or guardian link before sending.</span>
            </div>
          )}
        </div>
      </div>

      {/* Review & Publish Modal */}
      <DailyReportPublishModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        classroomId={classroomId}
        classroomName={classroomName}
        dateStr={dateStr}
        onSuccess={() => {
          loadReadiness()
          if (onRefreshDayStream) onRefreshDayStream()
        }}
      />
    </>
  )
}
