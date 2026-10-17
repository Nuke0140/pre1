'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  Utensils,
  Moon,
  Eye,
  Check,
  User,
  Users,
  Search,
  RotateCcw,
  Smartphone,
  Save,
  Info,
  Calendar,
  X,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone'
import { useToast } from '@/components/preone/Toast'
import { formatDateLocale, getGlobalLocale } from '@/lib/i18n'

interface DailyReportPublishModalProps {
  open: boolean
  onClose: () => void
  classroomId: string
  classroomName?: string
  dateStr: string
  onSuccess: () => void
}

export function DailyReportPublishModal({
  open,
  onClose,
  classroomId,
  classroomName = 'Classroom',
  dateStr,
  onSuccess,
}: DailyReportPublishModalProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Overrides for teacher custom notes: studentId -> string
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false)

  // Publication results state
  const [publishResults, setPublishResults] = useState<{
    publishedCount: number
    skippedCount: number
    results: any[]
  } | null>(null)

  useEffect(() => {
    if (open && classroomId) {
      loadReviewData()
    } else {
      setReports([])
      setSelectedStudentId(null)
      setPublishResults(null)
      setShowConfirm(false)
    }
  }, [open, classroomId, dateStr])

  const loadReviewData = async () => {
    setLoading(true)
    setPublishResults(null)
    setShowConfirm(false)
    try {
      const res = await fetch(
        `/api/v1/daily-diary/reports/review?classroomId=${classroomId}&date=${dateStr}`
      )
      const json = await res.json()
      if (res.ok && json.data) {
        const list = json.data.reports || []
        setReports(list)

        // Seed draft notes from existing summaryText
        const drafts: Record<string, string> = {}
        list.forEach((r: any) => {
          if (r.summaryText) {
            drafts[r.studentId] = r.summaryText
          }
        })
        setNotesDraft(drafts)

        // Select first student
        if (list.length > 0) {
          setSelectedStudentId(list[0].studentId)
        }
      } else {
        toast.show({
          title: 'Error',
          message: json.error || 'Failed to load daily reports for review',
          variant: 'danger',
        })
      }
    } catch (err: any) {
      toast.show({
        title: 'Error',
        message: err.message || 'Network error fetching report data',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async (studentId: string) => {
    const text = notesDraft[studentId] || ''
    setSavingNoteId(studentId)
    try {
      const res = await fetch('/api/v1/daily-diary/reports/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          studentId,
          dateStr,
          summaryText: text,
        }),
      })
      if (res.ok) {
        toast.show({
          title: 'Note Saved',
          message: 'Teacher note updated for this child',
          variant: 'success',
        })
      } else {
        const json = await res.json()
        toast.show({
          title: 'Error',
          message: json.error || 'Failed to save note',
          variant: 'danger',
        })
      }
    } catch (err: any) {
      toast.show({
        title: 'Error',
        message: err.message || 'Error saving note',
        variant: 'danger',
      })
    } finally {
      setSavingNoteId(null)
    }
  }

  // Publish Ready Reports
  const handlePublishConfirmed = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/v1/daily-diary/reports/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          dateStr,
          summaryOverrides: notesDraft,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setPublishResults({
          publishedCount: json.data.publishedCount,
          skippedCount: json.data.skippedCount,
          results: json.data.results || [],
        })
        setShowConfirm(false)
        toast.show({
          title: 'Reports Published',
          message: `Published ${json.data.publishedCount} report(s) and notified parents.`,
          variant: 'success',
        })
        onSuccess()
        // Reload data to reflect updated PUBLISHED status
        loadReviewData()
      } else {
        toast.show({
          title: 'Publishing Failed',
          message: json.error || 'Failed to publish daily reports',
          variant: 'danger',
        })
      }
    } catch (err: any) {
      toast.show({
        title: 'Error',
        message: err.message || 'Unexpected error while publishing reports',
        variant: 'danger',
      })
    } finally {
      setPublishing(false)
    }
  }

  const filteredReports = reports.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.admissionNo && r.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectedReport = reports.find((r) => r.studentId === selectedStudentId) || reports[0]

  const readyReports = reports.filter((r) => r.status === 'READY')
  const publishedReports = reports.filter((r) => r.status === 'PUBLISHED')
  const needsReviewReports = reports.filter((r) => r.status === 'NEEDS_REVIEW')

  const formattedDate = formatDateLocale(dateStr, getGlobalLocale())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review & Send Daily Reports to Parents"
      subtitle={`${classroomName} • ${formattedDate}`}
      size="xl"
    >
      <div className="space-y-5">
        {/* Top Readiness Summary Bar */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {classroomName} Status:
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold border border-slate-500/20">
              {reports.length} Eligible
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
              {readyReports.length} Ready to Send
            </span>
            {needsReviewReports.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                {needsReviewReports.length} Needs Review
              </span>
            )}
            {publishedReports.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30">
                {publishedReports.length} Already Published
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={loadReviewData}
            disabled={loading}
            className="btn btn-xs btn-ghost border border-border/60 text-xs flex items-center gap-1"
          >
            <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Publication Results Banner */}
        {publishResults && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h4 className="text-sm font-bold">
                Daily Reports Successfully Dispatched!
              </h4>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              <strong>{publishResults.publishedCount}</strong> daily report(s) published and sent to parent timeline channels.
              {publishResults.skippedCount > 0 && (
                <span> <strong>{publishResults.skippedCount}</strong> student(s) skipped due to missing attendance or unlinked guardians.</span>
              )}
            </p>
          </div>
        )}

        {/* Main Content Layout: Left Student List | Right Mobile Preview */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading classroom day reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
            No active students found in this classroom.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT RAIL: STUDENT LIST */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter children..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/80 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="max-h-[58vh] overflow-y-auto space-y-2 pr-1">
                {filteredReports.map((r) => {
                  const isSelected = selectedStudentId === r.studentId
                  return (
                    <div
                      key={r.studentId}
                      onClick={() => setSelectedStudentId(r.studentId)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                          : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={r.name} photoUrl={r.photoUrl} size="sm" />
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-foreground truncate">{r.name}</h4>
                            <p className="text-[10px] text-muted-foreground">{r.admissionNo || 'Student'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Attendance Status */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              r.attendanceStatus === 'PRESENT'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : r.attendanceStatus === 'LATE'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : r.attendanceStatus === 'HALF_DAY'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : r.attendanceStatus === 'ABSENT'
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}
                          >
                            {r.attendanceStatus}
                          </span>

                          {/* Readiness Badge */}
                          {r.status === 'PUBLISHED' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300">
                              Sent
                            </span>
                          ) : r.status === 'READY' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              Ready
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300" title={r.issues?.join(', ')}>
                              Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Issues hint */}
                      {r.issues && r.issues.length > 0 && r.status !== 'PUBLISHED' && (
                        <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{r.issues[0]}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT PANEL: MOBILE PARENT-FACING PREVIEW */}
            <div className="lg:col-span-7 space-y-4">
              {selectedReport ? (
                <div className="border border-border/80 rounded-2xl bg-muted/10 p-4 space-y-4 max-h-[64vh] overflow-y-auto">
                  {/* Phone Header Banner */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Smartphone className="w-4 h-4 text-primary" />
                      <span>Parent Mobile Preview</span>
                    </div>

                    <span className="text-[11px] font-medium text-muted-foreground">
                      {selectedReport.classroomName} • {formattedDate}
                    </span>
                  </div>

                  {/* Readiness Status Box */}
                  {selectedReport.issues && selectedReport.issues.length > 0 && selectedReport.status !== 'PUBLISHED' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Notice for this report:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[11px]">
                          {selectedReport.issues.map((iss: string, i: number) => (
                            <li key={i}>{iss}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Child Profile Card */}
                  <div className="p-4 rounded-xl bg-card border border-border/70 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={selectedReport.name} photoUrl={selectedReport.photoUrl} size="md" />
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{selectedReport.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedReport.classroomName} • Led by {selectedReport.teacherName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          selectedReport.attendanceStatus === 'PRESENT'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : selectedReport.attendanceStatus === 'LATE'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : selectedReport.attendanceStatus === 'HALF_DAY'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        {selectedReport.attendanceStatus}
                      </span>
                    </div>

                    {/* Teacher Daily Note (Editable) */}
                    <div className="pt-2 border-t border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span>Teacher Note to Parents:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(selectedReport.studentId)}
                          disabled={savingNoteId === selectedReport.studentId}
                          className="btn btn-xs btn-ghost text-primary text-xs flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savingNoteId === selectedReport.studentId ? 'Saving...' : 'Save Draft'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={notesDraft[selectedReport.studentId] ?? selectedReport.summaryText ?? ''}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({
                            ...prev,
                            [selectedReport.studentId]: e.target.value,
                          }))
                        }
                        placeholder="Add an encouraging note or daily highlight for the parent..."
                        className="w-full text-xs p-2 bg-background border border-border/80 rounded-lg outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>

                  {/* Meals & Nutrition */}
                  {selectedReport.meals && selectedReport.meals.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Meals & Snack Consumption</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        {selectedReport.meals.map((m: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                            <span className="font-semibold text-foreground">{m.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                              {m.intake}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nap Time */}
                  {selectedReport.naps && selectedReport.naps.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Rest & Nap Time</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        {selectedReport.naps.map((n: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                            <span className="font-semibold text-foreground">{n.title}</span>
                            <span className="text-muted-foreground">{n.details}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Highlights */}
                  {selectedReport.observations && selectedReport.observations.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Learning Observations</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        {selectedReport.observations.map((o: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                            <span className="font-bold text-cyan-800 dark:text-cyan-200 block text-[11px]">
                              {o.category}
                            </span>
                            <p className="italic text-foreground/90 text-xs">“{o.narrative}”</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities List */}
                  {selectedReport.activities && selectedReport.activities.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Classroom Routines & Activities</span>
                      </h4>
                      <div className="space-y-1 text-xs">
                        {selectedReport.activities.map((a: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-none">
                            <span className="font-medium text-foreground">{a.title}</span>
                            <span className="text-[11px] text-muted-foreground">{a.outcome || a.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guardian Recipients List */}
                  <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>Authorized Parent Recipients ({selectedReport.guardians?.length || 0})</span>
                    </h4>
                    {selectedReport.guardians && selectedReport.guardians.length > 0 ? (
                      <div className="divide-y divide-border/40 text-xs">
                        {selectedReport.guardians.map((g: any) => (
                          <div key={g.id} className="py-1.5 flex items-center justify-between">
                            <div>
                              <strong className="text-foreground">{g.fullName}</strong>
                              <span className="text-muted-foreground ml-1.5 text-[11px]">({g.relationship || 'Guardian'})</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold">
                              Notify Enabled
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠ No guardian linked with communication enabled.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Confirmation Modal Popover */}
        {showConfirm && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Confirm Classroom Daily Report Dispatch
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are about to publish and send daily reports for <strong>{readyReports.length}</strong> eligible student(s) in <strong>{classroomName}</strong> for <strong>{formattedDate}</strong>. Parents will receive an in-app notification and mobile daily timeline card.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary/20">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={publishing}
                className="btn btn-xs btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishConfirmed}
                disabled={publishing}
                className="btn btn-xs btn-primary font-bold flex items-center gap-1.5 shadow-sm"
              >
                {publishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Send to Parents</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            className="btn btn-sm btn-ghost"
          >
            Close
          </button>

          {!showConfirm && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={publishing || readyReports.length === 0}
              className="btn btn-sm btn-primary min-w-[240px] font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Publish Daily Reports to Parents ({readyReports.length} Ready)</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
