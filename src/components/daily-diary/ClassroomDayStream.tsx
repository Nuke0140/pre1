'use client'

import React, { useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  UserCheck,
  Sparkles,
  Utensils,
  Moon,
  Eye,
  HeartPulse,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Edit3,
  Trash2,
  CalendarCheck,
  Users,
} from 'lucide-react'
import { Avatar, EmptyState } from '@/components/preone'
import { isoDate } from '@/lib/format'
import { formatDateLocale, getGlobalLocale } from '@/lib/i18n'

export interface StreamItem {
  id: string
  streamType: 'ATTENDANCE' | 'ACTIVITY' | 'MEAL' | 'NAP' | 'OBSERVATION' | 'CARE' | 'INCIDENT'
  time: string
  sortMinutes: number
  endTime?: string | null
  title: string
  subtitle?: string | null
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING'
  badge: {
    label: string
    variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral'
  }
  teacherName?: string | null
  summary: string
  description?: string | null
  instructions?: string | null
  materials?: string | null
  actualOutcome?: string | null
  studentId?: string | null
  studentName?: string | null
  studentPhoto?: string | null
  concern?: string | null
  category?: string | null
  narrative?: string | null
  activityId?: string | null
  activityType?: string | null
  durationMinutes?: number | null
  consumptionStats?: {
    total: number
    ateAll: number
    ateMost: number
    ateHalf: number
    ateLittle: number
    refused: number
  } | null
  napStats?: {
    total: number
    slept: number
    rested: number
    fussy: number
    awake: number
  } | null
  attendanceStats?: {
    total: number
    present: number
    absent: number
    late: number
    halfDay: number
    unmarked: number
  } | null
  items?: any[]
  raw?: any
}

export interface DayStreamData {
  classroom: {
    id: string
    name: string
    code: string
    programType: string
    capacity: number
    teacherName: string
    teacherId: string | null
    branchName?: string
    sessionName?: string
  }
  date: string
  stats: {
    totalStudents: number
    present: number
    absent: number
    late: number
    halfDay: number
    unmarked: number
    totalEvents: number
    completedEvents: number
    inProgressEvents: number
    plannedEvents: number
    dayProgressPct: number
  }
  events: StreamItem[]
}

interface ClassroomDayStreamProps {
  data: DayStreamData | null
  loading: boolean
  selectedDate: string
  onDateChange: (date: string) => void
  onRefresh: () => void
  onOpenQuickLog: (type?: any) => void
  onOpenFastRollCall: () => void
  onOpenAttendanceRegister: () => void
  onOpenScheduleBuilder: () => void
  onStartActivity?: (activityId: string) => void
  onCompleteActivity?: (activityId: string) => void
  onDeleteActivity?: (activityId: string) => void
  classrooms?: { id: string; name: string; teacherName?: string }[]
  selectedClassroomId?: string
  onClassroomChange?: (classroomId: string) => void
}

export function ClassroomDayStream({
  data,
  loading,
  selectedDate,
  onDateChange,
  onRefresh,
  onOpenQuickLog,
  onOpenFastRollCall,
  onOpenAttendanceRegister,
  onOpenScheduleBuilder,
  onStartActivity,
  onCompleteActivity,
  onDeleteActivity,
  classrooms = [],
  selectedClassroomId,
  onClassroomChange,
}: ClassroomDayStreamProps) {
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedEventIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    onDateChange(isoDate(d))
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    onDateChange(isoDate(d))
  }

  const handleToday = () => {
    onDateChange(isoDate())
  }

  const isToday = selectedDate === isoDate()

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ATTENDANCE':
        return CalendarCheck
      case 'ACTIVITY':
        return Sparkles
      case 'MEAL':
        return Utensils
      case 'NAP':
        return Moon
      case 'OBSERVATION':
        return Eye
      case 'CARE':
        return HeartPulse
      case 'INCIDENT':
        return AlertTriangle
      default:
        return Clock
    }
  }

  const getEventAccent = (type: string, status?: string) => {
    if (type === 'INCIDENT') {
      return {
        dot: 'bg-red-500 ring-red-500/30',
        badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
        card: 'border-l-4 border-l-red-500',
        iconBg: 'bg-red-500/10 text-red-500',
      }
    }
    if (type === 'ATTENDANCE') {
      return {
        dot: status === 'COMPLETED' ? 'bg-emerald-500 ring-emerald-500/30' : 'bg-blue-500 ring-blue-500/30',
        badge: status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        card: 'border-l-4 border-l-emerald-500',
        iconBg: 'bg-emerald-500/10 text-emerald-600',
      }
    }
    if (type === 'MEAL') {
      return {
        dot: 'bg-amber-500 ring-amber-500/30',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        card: 'border-l-4 border-l-amber-500',
        iconBg: 'bg-amber-500/10 text-amber-500',
      }
    }
    if (type === 'NAP') {
      return {
        dot: 'bg-indigo-500 ring-indigo-500/30',
        badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        card: 'border-l-4 border-l-indigo-500',
        iconBg: 'bg-indigo-500/10 text-indigo-500',
      }
    }
    if (type === 'OBSERVATION') {
      return {
        dot: 'bg-cyan-500 ring-cyan-500/30',
        badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        card: 'border-l-4 border-l-cyan-500',
        iconBg: 'bg-cyan-500/10 text-cyan-500',
      }
    }
    if (type === 'CARE') {
      return {
        dot: 'bg-rose-500 ring-rose-500/30',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        card: 'border-l-4 border-l-rose-500',
        iconBg: 'bg-rose-500/10 text-rose-500',
      }
    }

    // Default ACTIVITY
    if (status === 'COMPLETED') {
      return {
        dot: 'bg-emerald-500 ring-emerald-500/30',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        card: 'border-l-4 border-l-emerald-500',
        iconBg: 'bg-emerald-500/10 text-emerald-600',
      }
    }
    if (status === 'IN_PROGRESS') {
      return {
        dot: 'bg-blue-500 ring-blue-500/30 animate-pulse',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        card: 'border-l-4 border-l-blue-500',
        iconBg: 'bg-blue-500/10 text-blue-500',
      }
    }
    return {
      dot: 'bg-slate-400 ring-slate-400/20',
      badge: 'bg-muted text-muted-foreground border-border/60',
      card: 'border-l-4 border-l-slate-300 dark:border-l-slate-700',
      iconBg: 'bg-muted text-muted-foreground',
    }
  }

  const classroom = data?.classroom
  const stats = data?.stats
  const events = data?.events || []

  return (
    <div className="space-y-6">
      {/* 1. CLASSROOM DAY STREAM HEADER */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/80 shadow-sm space-y-4">
        {/* Top Row: Classroom Selector + Date Navigation + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {classrooms.length > 1 && onClassroomChange ? (
              <select
                value={selectedClassroomId || classroom?.id || ''}
                onChange={(e) => onClassroomChange(e.target.value)}
                className="text-lg font-bold bg-background border border-border rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.teacherName ? `(${c.teacherName})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>{classroom?.name || 'Classroom Day Stream'}</span>
                  {classroom?.programType && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {classroom.programType}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>Assigned Teacher: <strong className="text-foreground">{classroom?.teacherName || 'Unassigned'}</strong></span>
                  {classroom?.branchName && (
                    <>
                      <span>•</span>
                      <span>Branch: {classroom.branchName}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date Controls & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-muted/40 border border-border/60 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-background rounded-lg text-foreground/80 hover:text-foreground transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-background rounded-lg text-foreground/80 hover:text-foreground transition"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                type="button"
                onClick={handleToday}
                className="btn btn-sm btn-ghost border border-border/60 rounded-xl text-xs"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-sm btn-ghost p-2 rounded-xl text-muted-foreground hover:text-foreground"
              title="Refresh Stream"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* + Quick Log Trigger */}
            <button
              type="button"
              onClick={() => onOpenQuickLog()}
              className="btn btn-sm btn-primary rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Quick Log</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Attendance Summary Bar & Day Progress */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-border/60 items-center">
            {/* Attendance Breakdown Pills */}
            <div className="md:col-span-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mr-1">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
                Attendance:
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  {stats.present} Present
                </span>
                <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/20">
                  {stats.absent} Absent
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  {stats.late} Late
                </span>
                {stats.halfDay > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                    {stats.halfDay} Half Day
                  </span>
                )}
                {stats.unmarked > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 font-medium border border-slate-500/20">
                    {stats.unmarked} Unmarked
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={onOpenFastRollCall}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 px-2 py-0.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Fast Roll Call
                </button>
                <span className="text-muted-foreground/60">•</span>
                <button
                  type="button"
                  onClick={onOpenAttendanceRegister}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium px-1"
                >
                  Full Register
                </button>
              </div>
            </div>

            {/* Day Progress Meter */}
            <div className="md:col-span-4 bg-muted/30 p-2.5 rounded-xl border border-border/40 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-foreground/80">Day Progress</span>
                <span className="font-bold text-primary">
                  {stats.dayProgressPct}% ({stats.completedEvents}/{stats.totalEvents} Logged)
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${stats.dayProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. CHRONOLOGICAL STREAM TIMELINE */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-start gap-4">
              <div className="w-20 h-6 bg-muted rounded-lg shrink-0" />
              <div className="w-4 h-4 rounded-full bg-muted mt-1 shrink-0" />
              <div className="flex-1 h-24 bg-muted/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl border border-border/80 text-center space-y-4">
          <EmptyState
            title="No events logged for this date"
            description={`No scheduled activities, meals, attendance, or observations found for ${formatDateLocale(selectedDate, getGlobalLocale())}.`}
          />
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenQuickLog()}
              className="btn btn-sm btn-primary rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Quick Log First Event</span>
            </button>
            <button
              type="button"
              onClick={onOpenScheduleBuilder}
              className="btn btn-sm btn-ghost border border-border/60 rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Open Schedule Builder</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative pl-2 sm:pl-4 space-y-5">
          {/* Timeline Rail Track */}
          <div className="absolute top-4 bottom-4 left-6 sm:left-8 w-0.5 bg-border/80" />

          {events.map((evt) => {
            const Icon = getEventIcon(evt.streamType)
            const accent = getEventAccent(evt.streamType, evt.status)
            const isExpanded = !!expandedEventIds[evt.id]

            return (
              <div key={evt.id} className="relative flex items-start gap-3 sm:gap-4 group">
                {/* Time Badge (Desktop Left) */}
                <div className="w-16 sm:w-20 pt-1 shrink-0 text-right">
                  <span className="text-xs font-bold text-foreground/90 block">{evt.time}</span>
                  {evt.endTime && (
                    <span className="text-[10px] text-muted-foreground block -mt-0.5">to {evt.endTime}</span>
                  )}
                </div>

                {/* Timeline Connector Dot & Icon */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center shrink-0 shadow-sm ${accent.iconBg} ring-2 ${accent.dot}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event Card */}
                <div
                  className={`flex-1 glass-panel p-4 rounded-xl border border-border/70 shadow-sm hover:shadow-md transition-all ${accent.card}`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{evt.title}</h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accent.badge}`}
                        >
                          {evt.badge.label}
                        </span>
                        {evt.subtitle && (
                          <span className="text-[11px] text-muted-foreground">
                            • {evt.subtitle}
                          </span>
                        )}
                      </div>
                      {evt.teacherName && (
                        <p className="text-xs text-muted-foreground">
                          Led by: <strong className="text-foreground/80">{evt.teacherName}</strong>
                        </p>
                      )}
                    </div>

                    {/* Quick Contextual Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Attendance Fast Roll Call Action */}
                      {evt.streamType === 'ATTENDANCE' && (
                        <button
                          type="button"
                          onClick={onOpenFastRollCall}
                          className="btn btn-xs btn-primary rounded-lg flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Roll Call</span>
                        </button>
                      )}

                      {/* Activity Status Workflow Actions */}
                      {evt.streamType === 'ACTIVITY' && evt.activityId && (
                        <>
                          {evt.status === 'PLANNED' && onStartActivity && (
                            <button
                              type="button"
                              onClick={() => onStartActivity(evt.activityId!)}
                              className="btn btn-xs btn-ghost border border-border/60 hover:bg-muted text-xs rounded-lg"
                            >
                              Start
                            </button>
                          )}
                          {evt.status !== 'COMPLETED' && onCompleteActivity && (
                            <button
                              type="button"
                              onClick={() => onCompleteActivity(evt.activityId!)}
                              className="btn btn-xs btn-primary rounded-lg flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenQuickLog('OBSERVATION')}
                            className="btn btn-xs btn-ghost border border-border/60 text-xs rounded-lg flex items-center gap-1"
                            title="Add Student Observation for this Activity"
                          >
                            <Eye className="w-3 h-3 text-cyan-500" />
                            <span>Observe</span>
                          </button>
                          {onDeleteActivity && (
                            <button
                              type="button"
                              onClick={() => onDeleteActivity(evt.activityId!)}
                              className="p-1 text-muted-foreground hover:text-red-500 rounded transition"
                              title="Delete Activity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Meal Quick Intake Action */}
                      {evt.streamType === 'MEAL' && (
                        <button
                          type="button"
                          onClick={() => onOpenQuickLog('MEAL')}
                          className="btn btn-xs btn-ghost border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg flex items-center gap-1"
                        >
                          <Utensils className="w-3 h-3" />
                          <span>Log Meal</span>
                        </button>
                      )}

                      {/* Nap Quick Log Action */}
                      {evt.streamType === 'NAP' && (
                        <button
                          type="button"
                          onClick={() => onOpenQuickLog('NAP')}
                          className="btn btn-xs btn-ghost border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center gap-1"
                        >
                          <Moon className="w-3 h-3" />
                          <span>Log Rest</span>
                        </button>
                      )}

                      {/* Expand / Collapse Details Toggle */}
                      {(evt.items?.length || evt.description || evt.instructions || evt.narrative) && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(evt.id)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition ml-1"
                          title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Summary Line */}
                  <div className="mt-2 text-xs text-foreground/80 flex items-center gap-2">
                    <p className="line-clamp-2">{evt.summary}</p>
                  </div>

                  {/* Expandable Details Container */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-3 animate-in fade-in duration-150">
                      {/* Description & Teacher Notes */}
                      {evt.description && (
                        <div>
                          <strong className="text-foreground/70 font-semibold block mb-0.5">Activity Description:</strong>
                          <p className="text-muted-foreground">{evt.description}</p>
                        </div>
                      )}

                      {evt.actualOutcome && (
                        <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                          <strong className="text-emerald-700 dark:text-emerald-400 font-semibold block mb-0.5">Outcome & Reflection:</strong>
                          <p className="text-foreground/80">{evt.actualOutcome}</p>
                        </div>
                      )}

                      {evt.materials && (
                        <div>
                          <strong className="text-foreground/70 font-semibold block mb-0.5">Materials / Prep:</strong>
                          <p className="text-muted-foreground">{evt.materials}</p>
                        </div>
                      )}

                      {/* Observation Narrative */}
                      {evt.narrative && (
                        <div className="bg-cyan-500/5 p-2.5 rounded-lg border border-cyan-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            {evt.studentName && <span className="font-bold text-foreground">{evt.studentName}</span>}
                            {evt.category && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                                {evt.category}
                              </span>
                            )}
                          </div>
                          <p className="italic text-foreground/90">“{evt.narrative}”</p>
                        </div>
                      )}

                      {/* Child Breakdown List (Meals, Naps, Attendance) */}
                      {evt.items && evt.items.length > 0 && (
                        <div className="space-y-1.5">
                          <strong className="text-foreground/70 font-semibold block">
                            Student Log Breakdown ({evt.items.length} Children):
                          </strong>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 border border-border/40 rounded-lg bg-muted/10">
                            {evt.items.map((it: any, idx: number) => (
                              <div
                                key={it.id || idx}
                                className="flex items-center justify-between p-1.5 bg-background rounded border border-border/40 text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Avatar name={it.name || it.studentName} photoUrl={it.photoUrl} size="xs" />
                                  <span className="truncate font-medium">{it.name || it.studentName}</span>
                                </div>
                                <span className="font-semibold text-primary shrink-0 ml-1">
                                  {it.intake || it.status || it.notes || 'Recorded'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) for fast mobile/tablet logging */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          type="button"
          onClick={() => onOpenQuickLog()}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          title="Quick Log"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
