'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  CalendarCheck,
  Sparkles,
  Utensils,
  Moon,
  Eye,
  HeartPulse,
  AlertTriangle,
  Smile,
  Clock,
  Users,
  Check,
  X,
  Search,
  RotateCcw,
  UserCheck,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar } from '@/components/preone'
import { useToast } from '@/components/preone/Toast'
import { VoiceObservationInput } from '@/components/daily-diary/VoiceObservationInput'

export type QuickLogType =
  | 'ATTENDANCE'
  | 'ACTIVITY'
  | 'MEAL'
  | 'NAP'
  | 'OBSERVATION'
  | 'CARE'
  | 'INCIDENT'
  | 'MOOD'

export interface StudentItem {
  id: string
  name: string
  admissionNo?: string
  photoUrl?: string | null
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'UNMARKED' | null
}

export interface TeacherItem {
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
  const [searchQuery, setSearchQuery] = useState('')

  // Multi-student selection state: Set of student IDs
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())

  // Default status for bulk operations
  const [defaultStatus, setDefaultStatus] = useState<string>('Ate All')

  // Per-student status override mapping: studentId -> status string
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({})

  // Per-student individual note override: studentId -> note
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({})

  // Active student note input drawer / open state
  const [expandedNotesStudentId, setExpandedNotesStudentId] = useState<string | null>(null)

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
  const [mealNotes, setMealNotes] = useState('')

  // Nap fields
  const [napStartTime, setNapStartTime] = useState('12:30')
  const [napEndTime, setNapEndTime] = useState('14:00')
  const [napNotes, setNapNotes] = useState('')

  // Mood fields
  const [moodSource, setMoodSource] = useState<'TEACHER_OBSERVED' | 'CHILD_EXPRESSED'>('TEACHER_OBSERVED')

  // Observation fields
  const [obsStudentId, setObsStudentId] = useState(students[0]?.id || '')
  const [obsNarrative, setObsNarrative] = useState('')
  const [obsCategory, setObsCategory] = useState('Cognitive')
  const [obsConcern, setObsConcern] = useState<'NORMAL' | 'MONITOR' | 'CONCERN'>('NORMAL')

  // Care fields
  const [careType, setCareType] = useState<'BATHROOM' | 'DIAPER' | 'WATER' | 'HEALTH_CHECK' | 'MEDICATION'>('BATHROOM')
  const [careNotes, setCareNotes] = useState('')

  // Incident fields
  const [incStudentId, setIncStudentId] = useState(students[0]?.id || '')
  const [incTitle, setIncTitle] = useState('')
  const [incSeverity, setIncSeverity] = useState<'INFO' | 'LOW' | 'MEDIUM' | 'HIGH'>('LOW')
  const [incDesc, setIncDesc] = useState('')

  // Options configuration per bulk event type
  const statusOptionsForType = useMemo(() => {
    switch (activeType) {
      case 'MEAL':
        return ['Ate All', 'Ate Most', 'Ate Half', 'Ate Little', 'Refused', 'Not Recorded']
      case 'NAP':
        return ['Slept Well', 'Rested Quietly', 'Fussy', 'Awake / Did Not Sleep']
      case 'ACTIVITY':
        return ['Participated', 'Active Leader', 'Observed Quietly', 'Assistance Needed', 'Refused']
      case 'MOOD':
        return ['Happy', 'Calm / Content', 'Energetic', 'Tired', 'Fussy / Upset', 'Needs Comfort']
      default:
        return []
    }
  }, [activeType])

  // Initial default value for event type
  const initialDefaultStatusForType = (type: QuickLogType): string => {
    switch (type) {
      case 'MEAL':
        return 'Ate All'
      case 'NAP':
        return 'Slept Well'
      case 'ACTIVITY':
        return 'Participated'
      case 'MOOD':
        return 'Happy'
      default:
        return ''
    }
  }

  // Authoritative eligibility helper:
  // For Meals, Naps, Activities, Mood: Absent students are excluded by default.
  // For Care / Potty: deliberate selection (none selected by default).
  const isStudentEligibleByDefault = (st: StudentItem, type: QuickLogType): boolean => {
    if (type === 'CARE') return false // Sensitive/Potty requires deliberate selection
    if (st.attendanceStatus === 'ABSENT') return false // Exclude absent students by default
    return true
  }

  // Reset or switch event types and initialize roster selections
  useEffect(() => {
    if (!isOpen) return

    setActiveType(initialType)
    setTime(getCurrentTime())
    setSearchQuery('')
    setExpandedNotesStudentId(null)

    const initDefault = initialDefaultStatusForType(initialType)
    setDefaultStatus(initDefault)

    // Build initial student statuses and default selection set
    const initialStatusMap: Record<string, string> = {}
    const initialSelected = new Set<string>()

    students.forEach((s) => {
      initialStatusMap[s.id] = initDefault
      if (isStudentEligibleByDefault(s, initialType)) {
        initialSelected.add(s.id)
      }
    })

    setStudentStatuses(initialStatusMap)
    setSelectedStudentIds(initialSelected)
    setStudentNotes({})

    if (students.length > 0) {
      if (!obsStudentId) setObsStudentId(students[0].id)
      if (!incStudentId) setIncStudentId(students[0].id)
    }
  }, [isOpen, initialType, students])

  // When switching type within the opened modal
  const handleSwitchType = (type: QuickLogType) => {
    setActiveType(type)
    setSearchQuery('')
    setExpandedNotesStudentId(null)

    const newDefault = initialDefaultStatusForType(type)
    setDefaultStatus(newDefault)

    const newStatusMap: Record<string, string> = {}
    const newSelected = new Set<string>()

    students.forEach((s) => {
      newStatusMap[s.id] = newDefault
      if (isStudentEligibleByDefault(s, type)) {
        newSelected.add(s.id)
      }
    })

    setStudentStatuses(newStatusMap)
    setSelectedStudentIds(newSelected)
  }

  // Handle Default Status Change:
  // Sets default and updates all selected students who haven't had an explicit custom override,
  // or updates all selected students to the new baseline.
  const handleApplyDefault = (status: string) => {
    setDefaultStatus(status)
    setStudentStatuses((prev) => {
      const updated = { ...prev }
      selectedStudentIds.forEach((sid) => {
        updated[sid] = status
      })
      return updated
    })
  }

  // Toggle selection for a single student
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  // Individual student status change (Exception)
  const handleStudentStatusChange = (studentId: string, status: string) => {
    // If student wasn't selected, select them now
    if (!selectedStudentIds.has(studentId)) {
      setSelectedStudentIds((prev) => new Set(prev).add(studentId))
    }
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  // Reset student back to default status
  const handleResetToDefault = (studentId: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: defaultStatus,
    }))
  }

  // Selection toolbar controls
  const handleSelectAllEligible = () => {
    const eligibleIds = students
      .filter((s) => s.attendanceStatus !== 'ABSENT')
      .map((s) => s.id)
    setSelectedStudentIds(new Set(eligibleIds))
  }

  const handleSelectPresentOnly = () => {
    const presentIds = students
      .filter((s) => s.attendanceStatus === 'PRESENT')
      .map((s) => s.id)
    setSelectedStudentIds(new Set(presentIds))
  }

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set())
  }

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase().trim()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(q))
    )
  }, [students, searchQuery])

  // Count summaries
  const eligibleStudents = useMemo(
    () => students.filter((s) => s.attendanceStatus !== 'ABSENT'),
    [students]
  )
  const absentStudents = useMemo(
    () => students.filter((s) => s.attendanceStatus === 'ABSENT'),
    [students]
  )
  const selectedCount = selectedStudentIds.size
  const excludedAbsentCount = absentStudents.filter((s) => !selectedStudentIds.has(s.id)).length

  // Calculate exceptions count: selected students whose status !== defaultStatus
  const exceptionCount = useMemo(() => {
    if (!statusOptionsForType.length) return 0
    let count = 0
    selectedStudentIds.forEach((sid) => {
      const status = studentStatuses[sid] || defaultStatus
      if (status !== defaultStatus) {
        count++
      }
    })
    return count
  }, [selectedStudentIds, studentStatuses, defaultStatus, statusOptionsForType])

  // Status breakdown for review box
  const statusBreakdown = useMemo(() => {
    if (!statusOptionsForType.length) return {}
    const counts: Record<string, number> = {}
    selectedStudentIds.forEach((sid) => {
      const status = studentStatuses[sid] || defaultStatus
      counts[status] = (counts[status] || 0) + 1
    })
    return counts
  }, [selectedStudentIds, studentStatuses, defaultStatus, statusOptionsForType])

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validations
    if (['MEAL', 'NAP', 'ACTIVITY', 'CARE', 'MOOD'].includes(activeType)) {
      if (selectedCount === 0) {
        toast.error('Please select at least one student')
        return
      }
    }

    setSubmitting(true)

    try {
      let payload: any = {
        classroomId,
        date: dateStr,
        time,
        type: activeType,
      }

      const selectedStudents = students.filter((s) => selectedStudentIds.has(s.id))

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
          activityEntries: selectedStudents.map((s) => ({
            studentId: s.id,
            participation: studentStatuses[s.id] || defaultStatus,
            notes: studentNotes[s.id]?.trim() || undefined,
          })),
        }
      } else if (activeType === 'MEAL') {
        payload = {
          ...payload,
          mealName: mealName.trim() || 'Fruit Snack',
          mealEntries: selectedStudents.map((s) => ({
            studentId: s.id,
            intake: studentStatuses[s.id] || defaultStatus,
            notes: studentNotes[s.id]?.trim() || mealNotes.trim() || undefined,
          })),
        }
      } else if (activeType === 'NAP') {
        payload = {
          ...payload,
          title: 'Nap & Rest Time',
          startTime: napStartTime,
          endTime: napEndTime,
          napEntries: selectedStudents.map((s) => ({
            studentId: s.id,
            napStatus: studentStatuses[s.id] || defaultStatus,
            notes: studentNotes[s.id]?.trim() || napNotes.trim() || undefined,
          })),
        }
      } else if (activeType === 'MOOD') {
        payload = {
          ...payload,
          title: 'Mood & Emotional State',
          moodSource,
          moodEntries: selectedStudents.map((s) => ({
            studentId: s.id,
            mood: studentStatuses[s.id] || defaultStatus,
            notes: studentNotes[s.id]?.trim() || undefined,
          })),
        }
      } else if (activeType === 'CARE') {
        payload = {
          ...payload,
          careType,
          careEntries: selectedStudents.map((s) => ({
            studentId: s.id,
            notes: studentNotes[s.id]?.trim() || careNotes.trim() || undefined,
          })),
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

      const countMsg = selectedStudents.length > 0 ? ` for ${selectedStudents.length} students` : ''
      toast.success(
        `${activeType.charAt(0) + activeType.slice(1).toLowerCase()} successfully saved${countMsg}`
      )
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
    { type: 'CARE', label: 'Potty & Care', icon: HeartPulse, color: 'text-rose-500' },
    { type: 'MOOD', label: 'Mood Check-in', icon: Smile, color: 'text-amber-600' },
    { type: 'OBSERVATION', label: 'Observation', icon: Eye, color: 'text-blue-500' },
    { type: 'INCIDENT', label: 'Incident / Note', icon: AlertTriangle, color: 'text-red-500' },
  ]

  // Dynamic primary action button label
  const getActionLabel = () => {
    switch (activeType) {
      case 'MEAL':
        return mealName || 'Meal'
      case 'NAP':
        return 'Nap & Rest'
      case 'ACTIVITY':
        return actTitle || 'Activity'
      case 'MOOD':
        return 'Mood Check-in'
      case 'CARE':
        return careType.replace('_', ' ')
      case 'OBSERVATION':
        return 'Observation'
      case 'INCIDENT':
        return 'Incident'
      default:
        return 'Entry'
    }
  }

  const isBulkType = ['MEAL', 'NAP', 'ACTIVITY', 'MOOD', 'CARE'].includes(activeType)

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`+ Quick Log: ${classroomName || 'Classroom Day'}`}
      size="lg"
    >
      <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        {/* Type Selector Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
          {quickTypes.map((qt) => {
            const Icon = qt.icon
            const isSelected = activeType === qt.type
            return (
              <button
                key={qt.type}
                type="button"
                onClick={() => handleSwitchType(qt.type)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40'
                    : 'border-border/60 hover:border-border hover:bg-muted/50 text-foreground/80'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-primary' : qt.color}`} />
                <span className="truncate text-[11px]">{qt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Attendance Shortcut Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground/90 font-medium">
              Morning Roll Call: {eligibleStudents.length} present / eligible students in class
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose()
              if (onOpenFastRollCall) onOpenFastRollCall()
            }}
            className="btn btn-xs btn-primary shrink-0 flex items-center gap-1 shadow-none"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Fast Roll Call
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Universal Header: Event Time & Classroom info */}
          <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-lg border border-border/40 text-xs">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
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
            <span className="text-muted-foreground ml-auto hidden sm:inline">
              Classroom: <strong className="text-foreground">{classroomName}</strong> • Date: {dateStr}
            </span>
          </div>

          {/* TAB: ACTIVITY */}
          {activeType === 'ACTIVITY' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-medium text-foreground/80 mb-1">
                  Activity Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Circle Time & Rhymes, Phonics & Letter Sounds, Art & Craft"
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
                  Classroom Reflection / Outcome (Optional)
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
            <div className="space-y-3 animate-in fade-in duration-150">
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
            </div>
          )}

          {/* TAB: NAP / REST */}
          {activeType === 'NAP' && (
            <div className="space-y-3 animate-in fade-in duration-150">
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
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Nap General Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Soft lullaby music played; quiet environment maintained."
                    value={napNotes}
                    onChange={(e) => setNapNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: MOOD CHECK-IN */}
          {activeType === 'MOOD' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Observation Source</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMoodSource('TEACHER_OBSERVED')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        moodSource === 'TEACHER_OBSERVED'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-semibold'
                          : 'bg-muted/40 border-border/60 text-muted-foreground'
                      }`}
                    >
                      Teacher Observed
                    </button>
                    <button
                      type="button"
                      onClick={() => setMoodSource('CHILD_EXPRESSED')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        moodSource === 'CHILD_EXPRESSED'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-semibold'
                          : 'bg-muted/40 border-border/60 text-muted-foreground'
                      }`}
                    >
                      Child Expressed
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Context</label>
                  <span className="text-xs text-muted-foreground block pt-1.5">
                    Record emotional well-being and engagement across the classroom day.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: POTTY & CARE */}
          {activeType === 'CARE' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong className="font-semibold block">Deliberate Student Selection Required</strong>
                  Potty, diapering, and hygiene events require individual child selection rather than whole-class logging. Select the specific children below who received care.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Care Type</label>
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
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Shared Care Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Clean change; wet diaper; or Drank 150ml water"
                    value={careNotes}
                    onChange={(e) => setCareNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: OBSERVATION (Single Child) */}
          {activeType === 'OBSERVATION' && (
            <div className="space-y-3 animate-in fade-in duration-150">
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

              <VoiceObservationInput
                value={obsNarrative}
                onChange={setObsNarrative}
                studentName={students.find((s) => s.id === obsStudentId)?.name}
                label="Narrative Observation"
                placeholder="Describe what the child demonstrated, built, communicated, or achieved..."
                rows={3}
                required
              />
            </div>
          )}

          {/* TAB: INCIDENT (Single Child) */}
          {activeType === 'INCIDENT' && (
            <div className="space-y-3 animate-in fade-in duration-150">
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

          {/* BULK ROSTER & FAST "APPLY DEFAULT TO ALL" SECTION */}
          {isBulkType && (
            <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-150">
              {/* Fast "Apply Default to All" Selector */}
              {statusOptionsForType.length > 0 && (
                <div className="bg-muted/20 border border-border/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/90">
                      Apply Default Status to Selected ({selectedCount} Selected)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Click a baseline to update all eligible students instantly
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {statusOptionsForType.map((status) => {
                      const isDefault = defaultStatus === status
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleApplyDefault(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isDefault
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-102 ring-2 ring-primary/20'
                              : 'bg-background hover:bg-muted text-foreground/80 border-border/80'
                          }`}
                        >
                          {status}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selection Controls Toolbar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/60">
                {/* Action buttons */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllEligible}
                    className="btn btn-xs btn-outline bg-background text-[11px]"
                  >
                    Select All Eligible ({eligibleStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectPresentOnly}
                    className="btn btn-xs btn-outline bg-background text-[11px]"
                  >
                    Present Only
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="btn btn-xs btn-ghost text-[11px] text-muted-foreground"
                  >
                    Clear Selection
                  </button>
                </div>

                {/* Search bar */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search child..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1 text-xs bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Student Roster Table / List */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-background">
                {/* Table Header */}
                <div className="px-3 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allFilteredSelected = filteredStudents.every((s) => selectedStudentIds.has(s.id))
                        if (allFilteredSelected) {
                          setSelectedStudentIds((prev) => {
                            const next = new Set(prev)
                            filteredStudents.forEach((s) => next.delete(s.id))
                            return next
                          })
                        } else {
                          setSelectedStudentIds((prev) => {
                            const next = new Set(prev)
                            filteredStudents.forEach((s) => next.add(s.id))
                            return next
                          })
                        }
                      }}
                      className="flex items-center gap-1.5 text-foreground hover:text-primary transition"
                    >
                      {filteredStudents.length > 0 &&
                      filteredStudents.every((s) => selectedStudentIds.has(s.id)) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>Student Roster ({filteredStudents.length})</span>
                    </button>
                  </div>
                  <span>Status & Exceptions</span>
                </div>

                {/* Table Rows */}
                <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                  {filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No matching students found.
                    </div>
                  ) : (
                    filteredStudents.map((st) => {
                      const isSelected = selectedStudentIds.has(st.id)
                      const isAbsent = st.attendanceStatus === 'ABSENT'
                      const isUnmarked = !st.attendanceStatus || st.attendanceStatus === 'UNMARKED'
                      const currentStatus = studentStatuses[st.id] || defaultStatus
                      const isException = isSelected && statusOptionsForType.length > 0 && currentStatus !== defaultStatus
                      const note = studentNotes[st.id] || ''

                      return (
                        <div
                          key={st.id}
                          className={`flex flex-col transition-all ${
                            !isSelected
                              ? 'opacity-65 bg-muted/5'
                              : isException
                              ? 'bg-amber-500/5 dark:bg-amber-500/10'
                              : 'hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between p-2 sm:px-3 gap-2">
                            {/* Checkbox + Student Avatar + Info */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleStudent(st.id)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary shrink-0 cursor-pointer"
                              />
                              <Avatar name={st.name} photoUrl={st.photoUrl} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-xs font-semibold truncate ${
                                      isSelected ? 'text-foreground' : 'text-foreground/70'
                                    }`}
                                  >
                                    {st.name}
                                  </span>

                                  {/* Attendance Badges */}
                                  {isAbsent && !isSelected && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                      Absent — Excluded by default
                                    </span>
                                  )}
                                  {isAbsent && isSelected && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                      Included (Manual Override)
                                    </span>
                                  )}
                                  {isUnmarked && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                                      Unmarked
                                    </span>
                                  )}
                                  {st.attendanceStatus === 'PRESENT' && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      Present
                                    </span>
                                  )}
                                  {st.attendanceStatus === 'LATE' && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                      Late
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  Roll #{st.admissionNo || '—'}
                                </span>
                              </div>
                            </div>

                            {/* Status Selector + Exception indicator */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Exception badge and Restore Default button */}
                              {isException && (
                                <div className="flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 animate-in fade-in">
                                    ⚡ Exception
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleResetToDefault(st.id)}
                                    title="Restore Default Status"
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Status Dropdown */}
                              {statusOptionsForType.length > 0 && (
                                <select
                                  disabled={!isSelected}
                                  value={currentStatus}
                                  onChange={(e) => handleStudentStatusChange(st.id, e.target.value)}
                                  className={`text-xs px-2 py-1 bg-background border rounded-lg outline-none transition ${
                                    isException
                                      ? 'border-amber-500 font-semibold text-amber-700 dark:text-amber-400 shadow-sm'
                                      : 'border-border/80'
                                  }`}
                                >
                                  {statusOptionsForType.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Individual Note toggle button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedNotesStudentId(
                                    expandedNotesStudentId === st.id ? null : st.id
                                  )
                                }
                                title="Add individual note for this child"
                                className={`p-1.5 rounded-lg border text-xs transition ${
                                  note
                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                    : 'border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expandable student individual note input */}
                          {expandedNotesStudentId === st.id && (
                            <div className="px-3 pb-2 pt-1 bg-muted/20 border-t border-border/30 flex items-center gap-2 animate-in fade-in">
                              <input
                                type="text"
                                placeholder={`Note for ${st.name} (e.g. complained of stomach ache; ate half)`}
                                value={studentNotes[st.id] || ''}
                                onChange={(e) =>
                                  setStudentNotes((prev) => ({
                                    ...prev,
                                    [st.id]: e.target.value,
                                  }))
                                }
                                className="w-full text-xs px-2.5 py-1 bg-background border border-border rounded outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={() => setExpandedNotesStudentId(null)}
                                className="btn btn-xs btn-ghost text-muted-foreground"
                              >
                                Done
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PRE-SAVE REVIEW SUMMARY BOX */}
          {isBulkType && (
            <div className="bg-muted/40 border border-border/80 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground">Review Summary:</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                    {selectedCount} Selected
                  </span>
                  {excludedAbsentCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/60">
                      {excludedAbsentCount} Excluded (Absent)
                    </span>
                  )}
                  {exceptionCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {exceptionCount} Exception{exceptionCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Records will be created atomically per student
                </span>
              </div>

              {/* Status Breakdown Chips */}
              {selectedCount > 0 && Object.keys(statusBreakdown).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-border/40">
                  {Object.entries(statusBreakdown).map(([status, cnt]) => (
                    <span
                      key={status}
                      className="px-2 py-0.5 rounded text-[11px] bg-background border border-border font-medium text-foreground/80"
                    >
                      <strong className="text-foreground">{cnt}</strong> {status}
                    </span>
                  ))}
                </div>
              )}

              {/* Absent exclusion explanation note */}
              {excludedAbsentCount > 0 && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {excludedAbsentCount} student(s) marked absent are excluded by default from this log.
                  </span>
                </p>
              )}
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
              disabled={submitting || (isBulkType && selectedCount === 0)}
              className="btn btn-sm btn-primary min-w-[170px] font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Saving...
                </>
              ) : isBulkType ? (
                `Save ${getActionLabel()} for ${selectedCount} Student${selectedCount === 1 ? '' : 's'}`
              ) : (
                `Save ${getActionLabel()}`
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
