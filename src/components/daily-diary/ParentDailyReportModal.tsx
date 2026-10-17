'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Utensils,
  Moon,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Heart,
  CalendarCheck,
  X,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone'
import { formatDateLocale, getGlobalLocale } from '@/lib/i18n'

interface ParentDailyReportModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName?: string
  dateStr: string
}

export function ParentDailyReportModal({
  open,
  onClose,
  studentId,
  studentName = 'Child',
  dateStr,
}: ParentDailyReportModalProps) {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open && studentId) {
      loadReport()
    } else {
      setReportData(null)
      setErrorMsg(null)
    }
  }, [open, studentId, dateStr])

  const loadReport = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/v1/parent/daily-report?childId=${studentId}&date=${dateStr}`)
      const json = await res.json()
      if (res.ok && json.data) {
        setReportData(json.data)
      } else {
        setErrorMsg(json.error || 'Failed to load daily report')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error loading daily report')
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = formatDateLocale(dateStr, getGlobalLocale())
  const report = reportData?.report

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${studentName}’s Daily Report`}
      subtitle={formattedDate}
      size="md"
    >
      <div className="space-y-5">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading daily report...</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!loading && !errorMsg && reportData && !reportData.published && (
          <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/20">
            <Clock className="w-10 h-10 text-amber-500 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-foreground">Report in Preparation</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {reportData.message ||
                  "Your child's daily report is currently being prepared and reviewed by their classroom teacher. It will be available here once published."}
              </p>
            </div>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-background border border-primary/20 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={report.student?.name} photoUrl={report.student?.photoUrl} size="lg" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">{report.student?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {report.classroomName} • Teacher: <strong className="text-foreground">{report.teacherName}</strong>
                    </p>
                  </div>
                </div>
                {report.attendanceStatus && (
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-2xs ${
                      report.attendanceStatus === 'PRESENT'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : report.attendanceStatus === 'LATE'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : report.attendanceStatus === 'HALF_DAY'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    }`}
                  >
                    {report.attendanceStatus}
                  </span>
                )}
              </div>

              {/* Teacher Summary Note */}
              {report.summaryText && (
                <div className="p-3 rounded-xl bg-background/80 border border-border/60 text-xs">
                  <span className="font-bold text-foreground/80 block mb-1">Teacher’s Daily Note:</span>
                  <p className="text-foreground/90 italic leading-relaxed">“{report.summaryText}”</p>
                </div>
              )}
            </div>

            {/* Activities Timeline */}
            {report.activities && report.activities.length > 0 && (
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Classroom Activities ({report.activities.length})</span>
                </h4>
                <div className="divide-y divide-border/60">
                  {report.activities.map((a: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-foreground">{a.title}</span>
                        {a.time && <span className="text-[11px] text-muted-foreground block">{a.time}</span>}
                      </div>
                      <span className="text-[11px] font-semibold text-primary">{a.outcome || a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition & Meals */}
            {report.meals && report.meals.length > 0 && (
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  <span>Meals & Nutrition</span>
                </h4>
                <div className="divide-y divide-border/60">
                  {report.meals.map((m: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{m.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20 text-[11px]">
                        {m.intake}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Naps & Rest */}
            {report.naps && report.naps.length > 0 && (
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Rest & Nap Time</span>
                </h4>
                <div className="divide-y divide-border/60">
                  {report.naps.map((n: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{n.title}</span>
                      <span className="text-muted-foreground">{n.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Highlights & Observations */}
            {report.observations && report.observations.length > 0 && (
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-500" />
                  <span>Learning Highlights</span>
                </h4>
                <div className="space-y-2">
                  {report.observations.map((o: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs">
                      <span className="font-bold text-cyan-800 dark:text-cyan-200 block mb-0.5">
                        {o.category}
                      </span>
                      <p className="text-foreground/90 italic">“{o.narrative}”</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Activity Photos */}
            {report.photos && report.photos.length > 0 && (
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Daily Photos</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {report.photos.map((p: any, idx: number) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-border/60 bg-muted/20">
                      <img src={p.url} alt={p.caption || 'Activity'} className="w-full h-32 object-cover" />
                      {p.caption && (
                        <p className="p-1.5 text-[11px] text-muted-foreground truncate">{p.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Published Timestamp */}
            {report.publishedAt && (
              <div className="text-center pt-2 text-[11px] text-muted-foreground">
                Published on {formatDateLocale(report.publishedAt, getGlobalLocale())} by {report.teacherName}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border/60">
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
