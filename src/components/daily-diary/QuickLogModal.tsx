'use client'

import React, { useState, useEffect } from 'react'
import {
  CalendarCheck,
  Sparkles,
  Utensils,
  Moon,
  Eye,
  HeartPulse,
  AlertTriangle,
  Clock,
  Users,
  Check,
  X,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone'
import { useToast } from '@/components/preone/Toast'

export type QuickLogType = 'ATTENDANCE' | 'ACTIVITY' | 'MEAL' | 'NAP' | 'OBSERVATION' | 'CARE' | 'INCIDENT'

interface StudentItem {
  id: string
  name: string
  admissionNo?: string
  photoUrl?: string | null
}

interface TeacherItem {
  id: string
  fullName: string
}

interface QuickLogModalProps {
  isOpen: boolean
  onClose: () => void
  classroomId: string
  classroomName?: string
  dateStr: string
  students: StudentItem[]
  teachers: TeacherItem[]
  initialType?: QuickLogType
  onSuccess: () => void
  onOpenFastRollCall?: () => void
}

export function QuickLogModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  dateStr,
  students,
  teachers,
  initialType = 'ACTIVITY',
  onSuccess,
  onOpenFastRollCall,
}: QuickLogModalProps) {
  const toast = useToast()
  const [activeType, setActiveType] = useState<QuickLogType>(initialType)
  const [submitting, setSubmitting] = useState(false)

  // Current local time HH:MM
  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const [time, setTime] = useState(getCurrentTime())

  // Activity fields
  const [actTitle, setActTitle] = useState('')
  const [actType, setActType] = useState('ACTIVITY')
  const [actStartTime, setActStartTime] = useState(getCurrentTime())
  const [actEndTime, setActEndTime] = useState('10:00')
  const [actStatus, setActStatus] = useState<'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'>('COMPLETED')
  const [actDesc, setActDesc] = useState('')
  const [actOutcome, setActOutcome] = useState('')
  const [actTeacherId, setActTeacherId] = useState(teachers[0]?.id || '')

  // Meal fields
  const [mealName, setMealName] = useState('Fruit Snack')
  const [mealTarget, setMealTarget] = useState<'ALL' | 'CUSTOM'>('ALL')
  const [defaultIntake, setDefaultIntake] = useState('Ate All')
  const [studentMealIntakes, setStudentMealIntakes] = useState<Record<string, string>>({})
  const [mealNotes, setMealNotes] = useState('')

  // Nap fields
  const [napStartTime, setNapStartTime] = useState('12:30')
  const [napEndTime, setNapEndTime] = useState('14:00')
  const [defaultNapStatus, setDefaultNapStatus] = useState('Slept Well')
  const [studentNapStatuses, setStudentNapStatuses] = useState<Record<string, string>>({})
  const [napNotes, setNapNotes] = useState('')

  // Observation fields
  const [obsStudentId, setObsStudentId] = useState(students[0]?.id || '')
  const [obsNarrative, setObsNarrative] = useState('')
  const [obsCategory, setObsCategory] = useState('Cognitive')
  const [obsConcern, setObsConcern] = useState<'NORMAL' | 'MONITOR' | 'CONCERN'>('NORMAL')

  // Care fields
  const [careType, setCareType] = useState<'BATHROOM' | 'DIAPER' | 'WATER' | 'HEALTH_CHECK' | 'MEDICATION'>('BATHROOM')
  const [careTarget, setCareTarget] = useState<'ALL' | 'SINGLE'>('ALL')
  const [careStudentId, setCareStudentId] = useState(students[0]?.id || '')
  const [careNotes, setCareNotes] = useState('')

  // Incident fields
  const [incStudentId, setIncStudentId] = useState(students[0]?.id || '')
  const [incTitle, setIncTitle] = useState('')
  const [incSeverity, setIncSeverity] = useState<'INFO' | 'LOW' | 'MEDIUM' | 'HIGH'>('LOW')
  const [incDesc, setIncDesc] = useState('')

  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType)
      setTime(getCurrentTime())
      if (students.length > 0) {
        if (!obsStudentId) setObsStudentId(students[0].id)
        if (!careStudentId) setCareStudentId(students[0].id)
        if (!incStudentId) setIncStudentId(students[0].id)
      }
    }
  }, [isOpen, initialType, students])

  // Initialize student custom intake overrides when switching or updating default
  useEffect(() => {
    const map: Record<string, string> = {}
    students.forEach((s) => {
      map[s.id] = defaultIntake
    })
    setStudentMealIntakes(map)
  }, [defaultIntake, students])

  useEffect(() => {
    const map: Record<string, string> = {}
    students.forEach((s) => {
      map[s.id] = defaultNapStatus
    })
    setStudentNapStatuses(map)
  }, [defaultNapStatus, students])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let payload: any = {
        classroomId,
        date: dateStr,
        time,
        type: activeType,
      }

      if (activeType === 'ACTIVITY') {
        if (!actTitle.trim()) {
          toast.error('Please enter an activity title')
          setSubmitting(false)
          return
        }
        payload = {
          ...payload,
          title: actTitle.trim(),
          activityType: actType,
          startTime: actStartTime,
          endTime: actEndTime,
          status: actStatus,
          teacherId: actTeacherId || undefined,
          description: actDesc.trim() || undefined,
          actualOutcome: actOutcome.trim() || undefined,
        }
      } else if (activeType === 'MEAL') {
        const mealEntries = students.map((s) => ({
          studentId: s.id,
          intake: studentMealIntakes[s.id] || defaultIntake,
          notes: mealNotes.trim() || undefined,
        }))
        payload = {
          ...payload,
          mealName,
          mealEntries,
        }
      } else if (activeType === 'NAP') {
        const napEntries = students.map((s) => ({
          studentId: s.id,
          napStatus: studentNapStatuses[s.id] || defaultNapStatus,
          notes: napNotes.trim() || undefined,
        }))
        payload = {
          ...payload,
          title: 'Nap & Rest Time',
          startTime: napStartTime,
          endTime: napEndTime,
          napEntries,
        }
      } else if (activeType === 'OBSERVATION') {
        if (!obsNarrative.trim()) {
          toast.error('Please provide observation narrative notes')
          setSubmitting(false)
          return
        }
        payload = {
          ...payload,
          studentId: obsStudentId,
          narrative: obsNarrative.trim(),
          category: obsCategory,
          concern: obsConcern,
        }
      } else if (activeType === 'CARE') {
        let careEntries = []
        if (careTarget === 'ALL') {
          careEntries = students.map((s) => ({
            studentId: s.id,
            notes: careNotes.trim() || undefined,
          }))
        } else {
          careEntries = [{ studentId: careStudentId, notes: careNotes.trim() || undefined }]
        }
        payload = {
          ...payload,
          careType,
          careEntries,
        }
      } else if (activeType === 'INCIDENT') {
        if (!incDesc.trim()) {
          toast.error('Please describe the incident')
          setSubmitting(false)
          return
        }
        payload = {
          ...payload,
          studentId: incStudentId,
          title: incTitle.trim() || 'Classroom Incident',
          severity: incSeverity,
          description: incDesc.trim(),
        }
      }

      const res = await fetch('/api/v1/daily-diary/quick-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || 'Failed to record entry')
      }

      toast.success(`${activeType.charAt(0) + activeType.slice(1).toLowerCase()} successfully logged`)
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Error recording log entry')
    } finally {
      setSubmitting(false)
    }
  }

  const quickTypes: { type: QuickLogType; label: string; icon: any; color: string }[] = [
    { type: 'ACTIVITY', label: 'Activity', icon: Sparkles, color: 'text-emerald-500' },
    { type: 'MEAL', label: 'Meal / Snack', icon: Utensils, color: 'text-amber-500' },
    { type: 'NAP', label: 'Nap / Rest', icon: Moon, color: 'text-indigo-500' },
    { type: 'OBSERVATION', label: 'Observation', icon: Eye, color: 'text-blue-500' },
    { type: 'CARE', label: 'Care / Hygiene', icon: HeartPulse, color: 'text-rose-500' },
    { type: 'INCIDENT', label: 'Incident / Note', icon: AlertTriangle, color: 'text-red-500' },
  ]

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`+ Quick Log: ${classroomName || 'Classroom Day'}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Type Selector Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickTypes.map((qt) => {
            const Icon = qt.icon
            const isSelected = activeType === qt.type
            return (
              <button
                key={qt.type}
                type="button"
                onClick={() => setActiveType(qt.type)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-muted/50 text-foreground/80'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-primary' : qt.color}`} />
                <span className="truncate">{qt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Attendance Shortcut Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-foreground/90">
              Need to take student attendance or morning roll call?
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose()
              if (onOpenFastRollCall) onOpenFastRollCall()
            }}
            className="btn btn-xs btn-primary shrink-0 flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Launch Fast Roll Call
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Universal Time Header */}
          <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-lg border border-border/40 text-xs">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground/80">Event Time:</span>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value)
                setActStartTime(e.target.value)
              }}
              className="px-2 py-1 bg-background border border-border rounded text-xs focus:ring-1 focus:ring-primary outline-none"
            />
            <span className="text-muted-foreground ml-auto">Date: {dateStr}</span>
          </div>

          {/* TAB: ACTIVITY */}
          {activeType === 'ACTIVITY' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">
                  Activity Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Circle Time & Rhymes, Phonics, Art & Craft"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
                  required
                />
                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Circle Time & Rhymes',
                    'Story Time & Puppets',
                    'Phonics & Letter Sounds',
                    'Sensory & Finger Painting',
                    'Outdoor Motor Play',
                    'Math & Counting Blocks',
                    'Music & Movement',
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setActTitle(sugg)}
                      className="px-2 py-0.5 rounded text-[11px] bg-muted hover:bg-muted/80 text-foreground/70 border border-border/60 transition"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Activity Type</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  >
                    <option value="ACTIVITY">General Activity</option>
                    <option value="CORE_SUBJECT">Core Subject</option>
                    <option value="CIRCLE_TIME">Circle Time</option>
                    <option value="PLAY">Free Play</option>
                    <option value="OUTDOOR">Outdoor Play</option>
                    <option value="ART">Art & Craft</option>
                    <option value="MUSIC">Music & Movement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Start & End</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={actStartTime}
                      onChange={(e) => setActStartTime(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs outline-none"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="time"
                      value={actEndTime}
                      onChange={(e) => setActEndTime(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Status</label>
                  <select
                    value={actStatus}
                    onChange={(e) => setActStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  >
                    <option value="COMPLETED">Completed (Done)</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PLANNED">Planned for Later</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">
                  Actual Outcome / Reflection (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. All 16 children participated actively; engaged enthusiastically with song gestures."
                  value={actOutcome}
                  onChange={(e) => setActOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB: MEAL / SNACK */}
          {activeType === 'MEAL' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Meal / Snack Item</label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g. Fruit Snack (Papaya & Bananas), Lunch"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                    required
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['Fruit Snack', 'Lunch', 'Morning Snack', 'Milk & Biscuit'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMealName(m)}
                        className="px-2 py-0.5 rounded text-[10px] bg-muted text-foreground/70 border border-border/50"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Class Intake Baseline</label>
                  <div className="flex flex-wrap gap-1">
                    {['Ate All', 'Ate Most', 'Ate Half', 'Ate Little', 'Refused'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDefaultIntake(level)}
                        className={`px-2 py-1 rounded text-xs font-medium border transition ${
                          defaultIntake === level
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50'
                            : 'bg-muted/50 border-border/60 text-foreground/70 hover:bg-muted'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    Click a baseline to set all students, then customize exceptions below.
                  </span>
                </div>
              </div>

              {/* Student individual customization accordion */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10">
                <div className="px-3 py-2 bg-muted/30 border-b border-border/40 flex items-center justify-between text-xs font-medium">
                  <span>Student Consumption Breakdown ({students.length} Students)</span>
                  <span className="text-[11px] text-muted-foreground">Adjust individual differences</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border/30 p-2 space-y-1">
                  {students.map((st) => (
                    <div key={st.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/40 rounded">
                      <div className="flex items-center gap-2">
                        <Avatar name={st.name} photoUrl={st.photoUrl} size="sm" />
                        <span className="text-xs font-medium text-foreground/90">{st.name}</span>
                      </div>
                      <select
                        value={studentMealIntakes[st.id] || defaultIntake}
                        onChange={(e) => setStudentMealIntakes((prev) => ({ ...prev, [st.id]: e.target.value }))}
                        className="text-xs px-2 py-1 bg-background border border-border rounded outline-none"
                      >
                        <option value="Ate All">Ate All</option>
                        <option value="Ate Most">Ate Most</option>
                        <option value="Ate Half">Ate Half</option>
                        <option value="Ate Little">Ate Little</option>
                        <option value="Refused">Refused</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: NAP / REST */}
          {activeType === 'NAP' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Nap Window</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={napStartTime}
                      onChange={(e) => setNapStartTime(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs outline-none"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={napEndTime}
                      onChange={(e) => setNapEndTime(e.target.value)}
                      className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Classroom Rest Baseline</label>
                  <div className="flex flex-wrap gap-1">
                    {['Slept Well', 'Rested Quietly', 'Fussy', 'Awake'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setDefaultNapStatus(status)}
                        className={`px-2 py-1 rounded text-xs font-medium border transition ${
                          defaultNapStatus === status
                            ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/50'
                            : 'bg-muted/50 border-border/60 text-foreground/70 hover:bg-muted'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student individual nap statuses */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10">
                <div className="px-3 py-2 bg-muted/30 border-b border-border/40 flex items-center justify-between text-xs font-medium">
                  <span>Student Rest Statuses ({students.length} Students)</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border/30 p-2 space-y-1">
                  {students.map((st) => (
                    <div key={st.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/40 rounded">
                      <div className="flex items-center gap-2">
                        <Avatar name={st.name} photoUrl={st.photoUrl} size="sm" />
                        <span className="text-xs font-medium text-foreground/90">{st.name}</span>
                      </div>
                      <select
                        value={studentNapStatuses[st.id] || defaultNapStatus}
                        onChange={(e) => setStudentNapStatuses((prev) => ({ ...prev, [st.id]: e.target.value }))}
                        className="text-xs px-2 py-1 bg-background border border-border rounded outline-none"
                      >
                        <option value="Slept Well">Slept Well</option>
                        <option value="Rested Quietly">Rested Quietly</option>
                        <option value="Fussy">Fussy</option>
                        <option value="Awake">Awake / Did Not Sleep</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: OBSERVATION */}
          {activeType === 'OBSERVATION' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={obsStudentId}
                    onChange={(e) => setObsStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.admissionNo || 'Student'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Developmental Domain</label>
                  <select
                    value={obsCategory}
                    onChange={(e) => setObsCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  >
                    <option value="Cognitive">Cognitive & Problem Solving</option>
                    <option value="Language & Literacy">Language & Early Literacy</option>
                    <option value="Physical / Motor">Physical / Gross & Fine Motor</option>
                    <option value="Social-Emotional">Social & Emotional Well-being</option>
                    <option value="Creative Arts">Creative Arts & Expression</option>
                    <option value="General">General Classroom Engagement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">Concern Level</label>
                <div className="flex gap-2">
                  {[
                    { id: 'NORMAL', label: 'Age Appropriate (Normal)', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
                    { id: 'MONITOR', label: 'Monitor Development', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
                    { id: 'CONCERN', label: 'Support Needed (Concern)', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setObsConcern(lvl.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        obsConcern === lvl.id ? `${lvl.color} ring-1 ring-primary` : 'bg-muted/40 border-border/60 text-muted-foreground'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">
                  Narrative Observation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what the child demonstrated, built, communicated, or achieved..."
                  value={obsNarrative}
                  onChange={(e) => setObsNarrative(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}

          {/* TAB: CARE / HYGIENE */}
          {activeType === 'CARE' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Care Log Type</label>
                  <select
                    value={careType}
                    onChange={(e) => setCareType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  >
                    <option value="BATHROOM">Bathroom Break</option>
                    <option value="DIAPER">Diaper Change</option>
                    <option value="WATER">Water / Hydration Check</option>
                    <option value="HEALTH_CHECK">Temperature / Health Check</option>
                    <option value="MEDICATION">Administered Medication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Apply To</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCareTarget('ALL')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                        careTarget === 'ALL' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border/60 text-muted-foreground'
                      }`}
                    >
                      Whole Classroom
                    </button>
                    <button
                      type="button"
                      onClick={() => setCareTarget('SINGLE')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                        careTarget === 'SINGLE' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/40 border-border/60 text-muted-foreground'
                      }`}
                    >
                      Specific Child
                    </button>
                  </div>
                </div>
              </div>

              {careTarget === 'SINGLE' && (
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Child</label>
                  <select
                    value={careStudentId}
                    onChange={(e) => setCareStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">Care Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Diaper wet, clean change; or Temp 98.4°F; or Drank 200ml water"
                  value={careNotes}
                  onChange={(e) => setCareNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB: INCIDENT */}
          {activeType === 'INCIDENT' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">
                    Child <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incStudentId}
                    onChange={(e) => setIncStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Severity</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  >
                    <option value="INFO">Informational Note</option>
                    <option value="LOW">Low (Minor bump, band-aid)</option>
                    <option value="MEDIUM">Medium (Supervision alert, scrape)</option>
                    <option value="HIGH">High (Immediate parent notification needed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">Incident Title</label>
                <input
                  type="text"
                  placeholder="e.g. Minor knee scrape on grass during outdoor play"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">
                  Description & Care Provided <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what occurred, any first aid applied, and child comfort level..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-sm btn-primary min-w-[120px]"
            >
              {submitting ? 'Saving...' : `Save ${activeType.charAt(0) + activeType.slice(1).toLowerCase()}`}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
