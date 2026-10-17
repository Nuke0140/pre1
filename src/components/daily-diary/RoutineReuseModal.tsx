'use client'

import React, { useState, useEffect } from 'react'
import {
  Copy,
  BookOpen,
  Sparkles,
  Clock,
  Trash2,
  Plus,
  AlertTriangle,
  Check,
  RotateCcw,
  Calendar,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { formatDateLocale, getGlobalLocale } from '@/lib/i18n'

export interface EditableRoutineActivity {
  id: string
  title: string
  activityType: string
  startTime: string
  endTime: string
  durationMinutes: number
  description: string
  materials?: string
  instructions?: string
  expectedOutcome?: string
}

export interface WeeklyTemplate {
  id: string
  name: string
  theme: string
  description: string | null
  isDefault: boolean
  activities: {
    title: string
    activityType: string
    startTime?: string
    endTime?: string
    durationMinutes?: number
    description?: string
  }[]
}

interface RoutineReuseModalProps {
  open: boolean
  onClose: () => void
  classroomId: string
  classroomName?: string
  targetDateStr: string
  onSuccess: () => void
  initialMode?: 'COPY_YESTERDAY' | 'WEEKLY_TEMPLATE'
}

const ACTIVITY_TYPES = [
  { value: 'CORE_SUBJECT', label: 'Core Learning / Phonics / STEM' },
  { value: 'CIRCLE_TIME', label: 'Circle Time & Greetings' },
  { value: 'PLAY', label: 'Play & Sensory' },
  { value: 'ART', label: 'Art & Craft' },
  { value: 'OUTDOOR', label: 'Outdoor / Gross Motor' },
  { value: 'STORY', label: 'Storybook & Language' },
  { value: 'MUSIC', label: 'Music & Movement' },
  { value: 'ACTIVITY', label: 'General Activity' },
]

export function RoutineReuseModal({
  open,
  onClose,
  classroomId,
  classroomName = 'Classroom',
  targetDateStr,
  onSuccess,
  initialMode = 'COPY_YESTERDAY',
}: RoutineReuseModalProps) {
  const toast = useToast()
  const [mode, setMode] = useState<'COPY_YESTERDAY' | 'WEEKLY_TEMPLATE'>(initialMode)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Previous Day State
  const [previousRoutineInfo, setPreviousRoutineInfo] = useState<{
    hasPreviousRoutine: boolean
    sourceDate?: string
    activityCount?: number
    message?: string
  } | null>(null)

  // Templates State
  const [templates, setTemplates] = useState<WeeklyTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Editable preview activities
  const [activities, setActivities] = useState<EditableRoutineActivity[]>([])
  const [sourceTitle, setSourceTitle] = useState<string>('')

  // Conflict state
  const [conflictData, setConflictData] = useState<{
    existingCount: number
    existingActivities: any[]
    message: string
  } | null>(null)

  // Reset or initialize on open
  useEffect(() => {
    if (open && classroomId) {
      setMode(initialMode)
      setConflictData(null)
      if (initialMode === 'COPY_YESTERDAY') {
        fetchPreviousRoutine()
      } else {
        fetchTemplates()
      }
    } else {
      setActivities([])
      setConflictData(null)
      setSelectedTemplateId(null)
    }
  }, [open, classroomId, targetDateStr, initialMode])

  // Fetch Previous Routine
  const fetchPreviousRoutine = async () => {
    setLoading(true)
    setConflictData(null)
    try {
      const res = await fetch(
        `/api/v1/daily-diary/previous-routine?classroomId=${classroomId}&targetDate=${targetDateStr}`
      )
      const json = await res.json()
      if (res.ok && json.data) {
        const data = json.data
        setPreviousRoutineInfo({
          hasPreviousRoutine: data.hasPreviousRoutine,
          sourceDate: data.sourceDate,
          activityCount: data.activityCount,
          message: data.message,
        })

        if (data.hasPreviousRoutine && Array.isArray(data.activities)) {
          const mapped: EditableRoutineActivity[] = data.activities.map((a: any, idx: number) => ({
            id: `copied-${idx}-${Date.now()}`,
            title: a.title,
            activityType: a.activityType || 'CORE_SUBJECT',
            startTime: a.startTime || '09:00',
            endTime: a.endTime || '09:30',
            durationMinutes: a.durationMinutes || 30,
            description: a.description || '',
            materials: a.materials || '',
            instructions: a.instructions || '',
            expectedOutcome: a.expectedOutcome || '',
          }))
          setActivities(mapped)
          setSourceTitle(`Copied from previous routine (${data.sourceDate})`)
        } else {
          setActivities([])
          setSourceTitle('')
        }
      } else {
        toast.show({
          title: 'Error',
          message: json.error || 'Failed to load previous routine',
          variant: 'danger',
        })
      }
    } catch (err: any) {
      toast.show({
        title: 'Error',
        message: err.message || 'Failed to connect to routine service',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch Weekly Theme Templates
  const fetchTemplates = async () => {
    setLoading(true)
    setConflictData(null)
    try {
      const res = await fetch('/api/v1/daily-diary/routine-templates')
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setTemplates(json.data)
        // If not already selected, select first default or first item
        if (!selectedTemplateId && json.data.length > 0) {
          const first = json.data.find((t: any) => t.isDefault) || json.data[0]
          selectTemplate(first)
        }
      }
    } catch (err: any) {
      toast.show({
        title: 'Error',
        message: err.message || 'Failed to load theme templates',
        variant: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  // Select a template and populate preview activities
  const selectTemplate = (template: WeeklyTemplate) => {
    setSelectedTemplateId(template.id)
    setSourceTitle(`Template: ${template.name}`)
    setConflictData(null)

    const rawActivities = (template.activities as any[]) || []
    const mapped: EditableRoutineActivity[] = rawActivities.map((a, idx) => ({
      id: `tmpl-${idx}-${Date.now()}`,
      title: a.title || 'Classroom Activity',
      activityType: a.activityType || 'CORE_SUBJECT',
      startTime: a.startTime || '09:00',
      endTime: a.endTime || '09:30',
      durationMinutes: a.durationMinutes || 30,
      description: a.description || '',
    }))
    setActivities(mapped)
  }

  // Handle Tab Change
  const handleTabChange = (newMode: 'COPY_YESTERDAY' | 'WEEKLY_TEMPLATE') => {
    setMode(newMode)
    setConflictData(null)
    if (newMode === 'COPY_YESTERDAY') {
      fetchPreviousRoutine()
    } else {
      fetchTemplates()
    }
  }

  // Activity Editing Handlers
  const handleUpdateActivity = (index: number, field: keyof EditableRoutineActivity, val: any) => {
    setActivities((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const handleDeleteActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddActivity = () => {
    const last = activities[activities.length - 1]
    let nextStart = '10:00'
    let nextEnd = '10:30'
    if (last && last.endTime) {
      nextStart = last.endTime
      // Add 30 mins approx
      const [h, m] = last.endTime.split(':').map(Number)
      if (!isNaN(h) && !isNaN(m)) {
        const d = new Date()
        d.setHours(h, m + 30)
        nextEnd = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      }
    }

    setActivities((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: 'New Activity',
        activityType: 'CORE_SUBJECT',
        startTime: nextStart,
        endTime: nextEnd,
        durationMinutes: 30,
        description: '',
      },
    ])
  }

  // Submit Routine / Apply to Classroom Day
  const handleApplyRoutine = async (replaceExisting = false) => {
    if (activities.length === 0) {
      toast.show({
        title: 'No Activities',
        message: 'Please add at least one planned activity before saving',
        variant: 'warning',
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        classroomId,
        targetDateStr,
        sourceType: mode,
        sourceName: sourceTitle,
        replaceExisting,
        activities: activities.map((a) => ({
          title: a.title,
          activityType: a.activityType,
          startTime: a.startTime,
          endTime: a.endTime,
          durationMinutes: Number(a.durationMinutes) || 30,
          description: a.description || null,
          materials: a.materials || null,
          instructions: a.instructions || null,
          expectedOutcome: a.expectedOutcome || null,
        })),
      }

      const res = await fetch('/api/v1/daily-diary/apply-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.show({
          title: 'Error',
          message: json.error || 'Failed to apply routine',
          variant: 'danger',
        })
        return
      }

      // Check if server detected existing conflict
      if (json.data?.conflict) {
        setConflictData({
          existingCount: json.data.existingCount,
          existingActivities: json.data.existingActivities || [],
          message: json.data.message || 'Target day already has planned activities.',
        })
        return
      }

      // Success
      toast.show({
        title: 'Routine Applied',
        message: `Successfully planned ${activities.length} routine activities for ${classroomName} on ${targetDateStr}.`,
        variant: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.show({
        title: 'Error',
        message: err.message || 'An unexpected error occurred while applying routine',
        variant: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formattedTargetDate = formatDateLocale(targetDateStr, getGlobalLocale())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Classroom Routine Reuse & Themes"
      subtitle={`Plan activities for ${classroomName} on ${formattedTargetDate}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-muted/40 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => handleTabChange('COPY_YESTERDAY')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === 'COPY_YESTERDAY'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Copy className="w-4 h-4 text-primary" />
            <span>📋 Copy Yesterday’s Routine</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('WEEKLY_TEMPLATE')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === 'WEEKLY_TEMPLATE'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>📚 Weekly Theme Templates</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">
              Loading {mode === 'COPY_YESTERDAY' ? "yesterday's schedule..." : 'weekly theme templates...'}
            </p>
          </div>
        )}

        {/* Conflict Warning Alert */}
        {conflictData && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Existing Schedule Detected ({conflictData.existingCount} Activities)
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {conflictData.message}
                </p>
                {conflictData.existingActivities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {conflictData.existingActivities.map((ea: any) => (
                      <span
                        key={ea.id}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-100 font-medium"
                      >
                        {ea.title} ({ea.startTime}–{ea.endTime})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setConflictData(null)}
                className="btn btn-xs btn-ghost text-amber-800 dark:text-amber-200"
              >
                Keep Existing & Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyRoutine(true)}
                disabled={submitting}
                className="btn btn-xs btn-warning bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replace Existing Schedule</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 1: COPY YESTERDAY'S ROUTINE */}
        {!loading && mode === 'COPY_YESTERDAY' && (
          <div className="space-y-4">
            {previousRoutineInfo?.hasPreviousRoutine ? (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Previous Planned Routine Found ({previousRoutineInfo.activityCount} Activities)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Source Date: <strong>{previousRoutineInfo.sourceDate}</strong>. All activities will be copied as planned without past attendance or logs.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchPreviousRoutine}
                  className="btn btn-xs btn-ghost border border-border/60 text-xs shrink-0"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Re-fetch
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/20">
                <Info className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    No Previous Routine Found
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    {previousRoutineInfo?.message ||
                      'No previous planned activities were found for this classroom in the past 14 days.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('WEEKLY_TEMPLATE')}
                    className="btn btn-sm btn-primary rounded-xl flex items-center gap-1.5 mx-auto"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Load Weekly Theme Template Instead</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: WEEKLY THEME TEMPLATES PICKER */}
        {!loading && mode === 'WEEKLY_TEMPLATE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select a Standard Curriculum Theme
              </span>
              <span className="text-xs text-muted-foreground">
                {templates.length} templates available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id
                const actCount = Array.isArray(tpl.activities) ? tpl.activities.length : 0
                return (
                  <div
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-sm ring-2 ring-purple-500/20'
                        : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground">{tpl.name}</h4>
                          {tpl.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                          {tpl.theme}
                        </span>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {tpl.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground">
                          {actCount} items
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* EDITABLE ACTIVITIES PREVIEW TABLE */}
        {!loading && activities.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Planned Activities Preview ({activities.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Review & customize before applying to {formattedTargetDate}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddActivity}
                className="btn btn-xs btn-ghost border border-border/60 rounded-lg flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>+ Add Row</span>
              </button>
            </div>

            {/* Activities Table */}
            <div className="border border-border/70 rounded-xl overflow-hidden bg-card shadow-xs">
              <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                {activities.map((act, idx) => (
                  <div
                    key={act.id}
                    className="p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-5 shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={act.title}
                        onChange={(e) => handleUpdateActivity(idx, 'title', e.target.value)}
                        placeholder="Activity Title"
                        className="text-xs font-bold bg-background border border-border/80 rounded-lg px-2.5 py-1.5 flex-1 focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                      {/* Time Pickers */}
                      <div className="flex items-center gap-1 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="time"
                          value={act.startTime}
                          onChange={(e) => handleUpdateActivity(idx, 'startTime', e.target.value)}
                          className="bg-transparent text-xs font-semibold outline-none cursor-pointer w-16"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={act.endTime}
                          onChange={(e) => handleUpdateActivity(idx, 'endTime', e.target.value)}
                          className="bg-transparent text-xs font-semibold outline-none cursor-pointer w-16"
                        />
                      </div>

                      {/* Type Dropdown */}
                      <select
                        value={act.activityType}
                        onChange={(e) => handleUpdateActivity(idx, 'activityType', e.target.value)}
                        className="text-xs bg-background border border-border/80 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none"
                      >
                        {ACTIVITY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(idx)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition"
                        title="Remove activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Child Safety & Integrity Callout */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                <strong>Strict Invariant:</strong> Copied routines strictly populate planned activities (<span className="font-semibold underline">status: PLANNED</span>). Past attendance, meal records, observations, or nap logs are <strong>never</strong> carried over.
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-sm btn-ghost"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleApplyRoutine(false)}
            disabled={submitting || activities.length === 0}
            className="btn btn-sm btn-primary min-w-[200px] font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Applying Routine...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Apply {activities.length} Activities to {targetDateStr}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
