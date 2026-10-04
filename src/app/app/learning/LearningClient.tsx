'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Users,
  Award,
  Layers,
  ChevronRight,
  Eye,
  FileText,
  Activity,
  CheckCheck,
  Brain,
  Palette,
  HeartHandshake,
  Compass,
  Smile,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Music,
  Gamepad2,
  BookMarked,
  GraduationCap,
  FolderSync,
  ChevronLeft,
  Play,
} from 'lucide-react'
import {
  Courses3DIcon,
  Rhymes3DIcon,
  Stories3DIcon,
  Games3DIcon,
} from './Learning3DIcons'
import {
  EnglishSubjectIllustration,
  MathSubjectIllustration,
  EVSSubjectIllustration,
  CreativitySubjectIllustration,
} from './SubjectIllustrations'
import { SharedMediaPlayer, MediaItem } from './SharedMediaPlayer'
import { Breadcrumbs } from '@/components/preone/Breadcrumbs'
import {
  PageHead,
  StatusPill,
  EmptyState,
  KpiTile,
  Segmented,
  Field,
  Avatar,
  TabularNumber,
} from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { TactileButton } from '@/components/preone/TactileMotion'
import { fmtDate, enumLabel } from '@/lib/format'
import type { Role } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'

interface SessionProps {
  uid: string
  email: string
  name: string
  role: Role
  roles?: Role[]
  tenantId: string | null
  branchId: string | null
}

interface LearningClientProps {
  session?: SessionProps
}

export function LearningClient({ session }: LearningClientProps) {
  const toast = useToast()

  // Tabs
  const [tab, setTab] = useState<'overview' | 'curriculum' | 'activities' | 'observations' | 'progress'>('overview')

  // Landing library vs category vs staff admin workspace views
  const [view, setView] = useState<'library' | 'category' | 'player' | 'admin'>('library')
  const [selectedCategory, setSelectedCategory] = useState<'courses' | 'rhymes' | 'stories' | 'games' | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<'english' | 'mathematics' | 'evs' | 'creativity' | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [activePlayItem, setActivePlayItem] = useState<any | null>(null)
  const [activityProgressMap, setActivityProgressMap] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [categorySearchQuery, setCategorySearchQuery] = useState('')

  const CATEGORIES = useMemo(() => [
    {
      id: 'courses' as const,
      title: 'Courses',
      subtitle: 'Structured lessons & developmental learning units',
      activityType: 'LESSON',
      singularLabel: 'Course Lesson',
      Icon: Courses3DIcon,
      bgGlow: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent',
    },
    {
      id: 'rhymes' as const,
      title: 'Poems & Rhymes',
      subtitle: 'Melodic action rhymes, songs & cadence phonics',
      activityType: 'RHYME',
      singularLabel: 'Rhyme',
      Icon: Rhymes3DIcon,
      bgGlow: 'bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent',
    },
    {
      id: 'stories' as const,
      title: 'Stories',
      subtitle: 'Illustrated picture tales, moral adventures & reads',
      activityType: 'STORY',
      singularLabel: 'Story',
      Icon: Stories3DIcon,
      bgGlow: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent',
    },
    {
      id: 'games' as const,
      title: 'Games',
      subtitle: 'Tactile puzzles, sorting play & motor coordination',
      activityType: 'GAME',
      singularLabel: 'Game',
      Icon: Games3DIcon,
      bgGlow: 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent',
    },
  ], [])

  // Canonical 4-Subject definition for Courses category (matching reference layout & sequence)
  const SUBJECTS = useMemo(() => [
    {
      id: 'english' as const,
      number: 1,
      title: 'English',
      subtitle: 'Alphabet → Phonics → Vocabulary → Reading → Writing',
      badge: 'Language & Literacy',
      topics: ['Alphabet', 'Phonics', 'Vocabulary', 'Reading', 'Writing'],
      keywords: ['alphabet', 'phonics', 'vocabulary', 'reading', 'writing', 'letter', 'sound', 'word', 'story', 'english', 'language'],
      colorTheme: 'blue',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      tagline: 'Foundational phonics, sensory letter tracing, and joyful early vocabulary',
      Icon: EnglishSubjectIllustration,
    },
    {
      id: 'mathematics' as const,
      number: 2,
      title: 'Mathematics',
      subtitle: 'Numbers → Counting → Shapes → Patterns → Basic Maths',
      badge: 'Core Numeracy',
      topics: ['Numbers', 'Counting', 'Shapes', 'Patterns', 'Basic Maths'],
      keywords: ['number', 'counting', 'shape', 'pattern', 'math', 'count', 'quantity', 'geometry', 'measure', 'logic'],
      colorTheme: 'amber',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      tagline: 'Concrete counting, tactile geometric shapes, and early spatial reasoning',
      Icon: MathSubjectIllustration,
    },
    {
      id: 'evs' as const,
      number: 3,
      title: 'EVS & General Awareness',
      subtitle: 'Fruits → Animals → Plants → Body Parts → Our World',
      badge: 'Environmental Discovery',
      topics: ['Fruits', 'Animals', 'Plants', 'Body Parts', 'Our World'],
      keywords: ['fruit', 'animal', 'plant', 'body', 'nature', 'world', 'weather', 'community', 'season', 'sensory', 'evs', 'science'],
      colorTheme: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      tagline: 'Sensory science, nature observation, living things, and classroom community',
      Icon: EVSSubjectIllustration,
    },
    {
      id: 'creativity' as const,
      number: 4,
      title: 'Creativity & Life Skills',
      subtitle: 'Art → Rhymes → Stories → Good Habits → Social Skills',
      badge: 'Creative & Socio-Emotional',
      topics: ['Art', 'Rhymes', 'Stories', 'Good Habits', 'Social Skills'],
      keywords: ['art', 'rhyme', 'story', 'habit', 'social', 'craft', 'music', 'emotion', 'sharing', 'manners', 'kindness', 'hygiene'],
      colorTheme: 'purple',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      tagline: 'Hands-on artistic expression, rhyming cadences, daily habits, and collaborative play',
      Icon: CreativitySubjectIllustration,
    },
  ], [])

  // Auth / Permissions
  const effectiveRoles = useMemo(() => {
    if (!session) return []
    const list = [session.role, ...(session.roles || [])].filter(Boolean)
    return Array.from(new Set(list)).map(normalizeRole)
  }, [session])

  const isAdmin = effectiveRoles.some((r) =>
    ['PLATFORM_ADMIN', 'OWNER', 'PRINCIPAL', 'COORDINATOR'].includes(r)
  )
  const isTeacher = effectiveRoles.some((r) => ['TEACHER'].includes(r))
  const canWrite = isAdmin || isTeacher

  // Data states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [curricula, setCurricula] = useState<any[]>([])
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null)
  const [activeCurriculumDetail, setActiveCurriculumDetail] = useState<any>(null)
  const [loadingCurriculumDetail, setLoadingCurriculumDetail] = useState(false)

  const [activities, setActivities] = useState<any[]>([])
  const [observations, setObservations] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  // Progress matrix states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [studentProgress, setStudentProgress] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)

  // Filters
  const [activityClassroomFilter, setActivityClassroomFilter] = useState<string>('ALL')
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('ALL')
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('ALL')
  const [obsConcernFilter, setObsConcernFilter] = useState<string>('ALL')
  const [obsCategoryFilter, setObsCategoryFilter] = useState<string>('ALL')
  const [obsSearch, setObsSearch] = useState<string>('')

  // Modals
  const [modalNewCurriculum, setModalNewCurriculum] = useState(false)
  const [modalNewArea, setModalNewArea] = useState(false)
  const [modalNewGoal, setModalNewGoal] = useState(false)
  const [selectedAreaForGoal, setSelectedAreaForGoal] = useState<string>('')
  const [modalNewActivity, setModalNewActivity] = useState(false)
  const [modalNewObservation, setModalNewObservation] = useState(false)

  // Modal Submitting States
  const [submittingCurriculum, setSubmittingCurriculum] = useState(false)
  const [submittingArea, setSubmittingArea] = useState(false)
  const [submittingGoal, setSubmittingGoal] = useState(false)
  const [submittingActivity, setSubmittingActivity] = useState(false)
  const [submittingObservation, setSubmittingObservation] = useState(false)

  // Form states
  const [curriculumForm, setCurriculumForm] = useState({
    name: 'Early Years Foundation Stage (EYFS)',
    framework: 'EYFS',
    description: 'Foundational early childhood curriculum covering cognitive, communication, motor, and socio-emotional domains.',
    seedDefaultAreas: true,
  })

  const [areaForm, setAreaForm] = useState({
    name: '',
    description: '',
    displayOrder: 1,
  })

  const [goalForm, setGoalForm] = useState({
    name: '',
    description: '',
    ageMinMonths: 24,
    ageMaxMonths: 48,
    displayOrder: 1,
  })

  const [activityForm, setActivityForm] = useState({
    title: '',
    activityType: 'ACTIVITY',
    classroomId: '',
    activityDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    durationMinutes: 30,
    curriculumId: '',
    learningGoalId: '',
    materials: '',
    instructions: '',
    expectedOutcome: '',
  })

  const [observationForm, setObservationForm] = useState({
    studentId: '',
    learningGoalId: '',
    narrative: '',
    category: 'GENERAL',
    concern: 'NONE',
    progressStage: 'DEVELOPING',
    publishToTimeline: true,
  })

  // 1. Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true)
      const [dashRes, currRes, actRes, obsRes, clsRes, stuRes] = await Promise.all([
        fetch('/api/v1/academics/dashboard').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/academics/curriculum').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/academics/activities').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/academics/observations').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/classrooms').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/v1/students?pageSize=100').then((r) => r.json()).catch(() => ({ success: false })),
      ])

      if (dashRes.success) setStats(dashRes.data)
      if (currRes.success) {
        const list = currRes.data || []
        setCurricula(list)
        if (list.length > 0 && !selectedCurriculumId) {
          setSelectedCurriculumId(list[0].id)
        }
      }
      if (actRes.success) setActivities(actRes.data || [])
      if (obsRes.success) setObservations(obsRes.data || [])
      if (clsRes.success) {
        const clsList = clsRes.data || []
        setClassrooms(clsList)
        if (clsList.length > 0 && !activityForm.classroomId) {
          setActivityForm((prev) => ({ ...prev, classroomId: clsList[0].id }))
        }
      }
      if (stuRes.success) {
        const stuList = stuRes.data || []
        setStudents(stuList)
        if (stuList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(stuList[0].id)
        }
      }
    } catch (err: any) {
      toast.error('Fetch Error', err.message || 'Could not load academic data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedCurriculumId, activityForm.classroomId, selectedStudentId, toast])

  useEffect(() => {
    fetchData()
  }, [])

  // 2. Fetch specific curriculum detail
  useEffect(() => {
    if (!selectedCurriculumId) return
    let isMounted = true
    setLoadingCurriculumDetail(true)
    fetch(`/api/v1/academics/curriculum/${selectedCurriculumId}`)
      .then((r) => r.json())
      .then((json) => {
        if (isMounted && json.success) {
          setActiveCurriculumDetail(json.data)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingCurriculumDetail(false)
      })
    return () => {
      isMounted = false
    }
  }, [selectedCurriculumId])

  // 3. Fetch student progress when student changes in Progress tab
  useEffect(() => {
    if (!selectedStudentId) return
    let isMounted = true
    setLoadingProgress(true)
    fetch(`/api/v1/academics/students/${selectedStudentId}/progress`)
      .then((r) => r.json())
      .then((json) => {
        if (isMounted && json.success) {
          setStudentProgress(json.data)
        } else if (isMounted) {
          setStudentProgress(null)
        }
      })
      .catch(() => {
        if (isMounted) setStudentProgress(null)
      })
      .finally(() => {
        if (isMounted) setLoadingProgress(false)
      })
    return () => {
      isMounted = false
    }
  }, [selectedStudentId])

  // 4. Fetch activity progress for selected student across activities
  useEffect(() => {
    if (!selectedStudentId) return
    let isMounted = true
    fetch(`/api/v1/academics/learning-progress?studentId=${selectedStudentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data)) {
          const map: Record<string, any> = {}
          json.data.forEach((item: any) => {
            map[item.activityId] = item
          })
          setActivityProgressMap(map)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [selectedStudentId, activities])

  // Handlers for creating items
  const handleSeedStandardEYFS = async () => {
    if (isSeeding) return
    try {
      setIsSeeding(true)
      const res = await fetch('/api/v1/academics/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Early Years Foundation Stage (EYFS)',
          framework: 'EYFS',
          description: 'Foundational early childhood curriculum covering communication, numeracy, motor, social-emotional, creative, and world discovery domains.',
          seedDefaultAreas: true,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Curriculum Initialized', '6 foundational domains and 18 milestone goals are active.')
        await fetchData()
        if (json.data?.id) setSelectedCurriculumId(json.data.id)
      } else {
        toast.warning('Notice', json.error?.message || 'Could not seed curriculum')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCreateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curriculumForm.name.trim()) {
      toast.warning('Validation', 'Curriculum name is required')
      return
    }
    if (submittingCurriculum) return
    try {
      setSubmittingCurriculum(true)
      const res = await fetch('/api/v1/academics/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curriculumForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Curriculum Created', 'Framework initialized with early childhood domains')
        setModalNewCurriculum(false)
        await fetchData()
        if (json.data?.id) setSelectedCurriculumId(json.data.id)
      } else {
        toast.error('Error', json.error?.message || 'Failed to create curriculum')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setSubmittingCurriculum(false)
    }
  }

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCurriculumId || !areaForm.name.trim()) return
    if (submittingArea) return
    try {
      setSubmittingArea(true)
      const res = await fetch('/api/v1/academics/learning-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumId: selectedCurriculumId, ...areaForm }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Domain Added', 'New learning area created')
        setModalNewArea(false)
        setAreaForm({ name: '', description: '', displayOrder: 1 })
        // Refresh curriculum detail
        const det = await fetch(`/api/v1/academics/curriculum/${selectedCurriculumId}`).then((r) => r.json())
        if (det.success) setActiveCurriculumDetail(det.data)
      } else {
        toast.error('Error', json.error?.message || 'Failed to add learning area')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setSubmittingArea(false)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAreaForGoal || !goalForm.name.trim()) return
    if (submittingGoal) return
    try {
      setSubmittingGoal(true)
      const res = await fetch('/api/v1/academics/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculumLearningAreaId: selectedAreaForGoal, ...goalForm }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Goal Added', 'Developmental milestone recorded')
        setModalNewGoal(false)
        setGoalForm({ name: '', description: '', ageMinMonths: 24, ageMaxMonths: 48, displayOrder: 1 })
        if (selectedCurriculumId) {
          const det = await fetch(`/api/v1/academics/curriculum/${selectedCurriculumId}`).then((r) => r.json())
          if (det.success) setActiveCurriculumDetail(det.data)
        }
      } else {
        toast.error('Error', json.error?.message || 'Failed to add learning goal')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setSubmittingGoal(false)
    }
  }

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activityForm.classroomId || !activityForm.title.trim()) {
      toast.warning('Validation', 'Classroom and activity title are required')
      return
    }
    if (submittingActivity) return
    try {
      setSubmittingActivity(true)
      const res = await fetch('/api/v1/academics/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activityForm,
          curriculumId: selectedCurriculumId || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Activity Planned', 'Classroom lesson added to schedule')
        setModalNewActivity(false)
        setActivityForm((prev) => ({
          ...prev,
          title: '',
          materials: '',
          instructions: '',
          expectedOutcome: '',
        }))
        await fetchData()
      } else {
        toast.error('Error', json.error?.message || 'Failed to schedule activity')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setSubmittingActivity(false)
    }
  }

  const handleUpdateActivityStatus = async (activityId: string, newStatus: string) => {
    try {
      // Optimistic update
      setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, status: newStatus } : a)))
      const res = await fetch(`/api/v1/academics/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Status Updated', `Activity marked as ${newStatus}`)
      } else {
        await fetchData()
        toast.error('Error', 'Failed to update status')
      }
    } catch (err: any) {
      await fetchData()
      toast.error('Error', err.message)
    }
  }

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!observationForm.studentId || !observationForm.narrative.trim()) {
      toast.warning('Validation', 'Student and observation narrative are required')
      return
    }
    if (submittingObservation) return
    try {
      setSubmittingObservation(true)
      const res = await fetch('/api/v1/academics/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(observationForm),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Observation Recorded', 'Developmental note saved & synced')
        setModalNewObservation(false)
        setObservationForm({
          studentId: '',
          learningGoalId: '',
          narrative: '',
          category: 'GENERAL',
          concern: 'NONE',
          progressStage: 'DEVELOPING',
          publishToTimeline: true,
        })
        await fetchData()
        if (selectedStudentId === observationForm.studentId) {
          // Refresh student progress
          fetch(`/api/v1/academics/students/${selectedStudentId}/progress`)
            .then((r) => r.json())
            .then((j) => j.success && setStudentProgress(j.data))
        }
      } else {
        toast.error('Error', json.error?.message || 'Failed to record observation')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    } finally {
      setSubmittingObservation(false)
    }
  }

  // Resolve media provider and url from activity fields (e.g. Google Drive links in instructions or materials)
  const resolveMediaMeta = (act: any, defaultSubtitle?: string): MediaItem => {
    const rawUrl = act.instructions?.match(/https?:\/\/[^\s"'<>]+/)?.[0] || act.materials?.match(/https?:\/\/[^\s"'<>]+/)?.[0] || null
    let provider: 'DIRECT' | 'DRIVE' | 'NONE' = 'NONE'
    if (rawUrl) {
      if (rawUrl.includes('drive.google.com')) {
        provider = 'DRIVE'
      } else if (/\.(mp4|webm|ogg|mov)$/i.test(rawUrl)) {
        provider = 'DIRECT'
      }
    }

    return {
      id: act.id,
      title: act.title,
      subtitle: act.classroom?.name || defaultSubtitle || 'Classroom Activity',
      description: act.description,
      activityType: act.activityType || 'ACTIVITY',
      durationMinutes: act.durationMinutes,
      expectedOutcome: act.expectedOutcome,
      materials: act.materials,
      instructions: act.instructions,
      classroomName: act.classroom?.name,
      mediaUrl: rawUrl,
      mediaProvider: provider,
    }
  }

  const handleActivityProgressUpdate = useCallback(
    async (activityId: string, positionSecs: number, pct: number) => {
      if (!selectedStudentId) return
      try {
        // Optimistic state update
        setActivityProgressMap((prev) => ({
          ...prev,
          [activityId]: {
            ...(prev[activityId] || {}),
            activityId,
            studentId: selectedStudentId,
            playbackPositionSecs: positionSecs,
            progressPercentage: pct,
            status: pct >= 90 ? 'COMPLETED' : pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
          },
        }))

        await fetch('/api/v1/academics/learning-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityId,
            studentId: selectedStudentId,
            playbackPositionSecs: positionSecs,
            progressPercentage: pct,
            status: pct >= 90 ? 'COMPLETED' : pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
          }),
        })
      } catch (err) {
        console.error('Failed to save learning progress:', err)
      }
    },
    [selectedStudentId]
  )

  const handleActivityComplete = useCallback(
    async (activityId: string) => {
      if (!selectedStudentId) return
      try {
        setActivityProgressMap((prev) => ({
          ...prev,
          [activityId]: {
            ...(prev[activityId] || {}),
            activityId,
            studentId: selectedStudentId,
            playbackPositionSecs: 0,
            progressPercentage: 100,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          },
        }))

        const res = await fetch('/api/v1/academics/learning-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityId,
            studentId: selectedStudentId,
            progressPercentage: 100,
            status: 'COMPLETED',
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Completed!', 'Progress recorded for this learner')
        }
      } catch (err: any) {
        toast.error('Error', err.message || 'Could not complete activity')
      }
    },
    [selectedStudentId, toast]
  )

  const handleUpdateStudentStage = async (goalId: string, stage: string) => {
    if (!selectedStudentId) return
    try {
      // Optimistic update
      if (studentProgress?.areas) {
        const nextAreas = studentProgress.areas.map((area: any) => ({
          ...area,
          goals: area.goals.map((g: any) => (g.id === goalId ? { ...g, stage } : g)),
        }))
        setStudentProgress((prev: any) => ({ ...prev, areas: nextAreas }))
      }

      const res = await fetch(`/api/v1/academics/students/${selectedStudentId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learningGoalId: goalId,
          stage,
          notes: `Updated milestone progress to ${stage} via PreO Learning Studio`,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Milestone Updated', `Stage marked as ${enumLabel(stage)}`)
      } else {
        toast.error('Error', json.error?.message || 'Could not update stage')
      }
    } catch (err: any) {
      toast.error('Error', err.message)
    }
  }

  // Filtered views
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (activityClassroomFilter !== 'ALL' && a.classroomId !== activityClassroomFilter) return false
      if (activityStatusFilter !== 'ALL' && a.status !== activityStatusFilter) return false
      if (activityTypeFilter !== 'ALL' && (a.activityType || 'ACTIVITY') !== activityTypeFilter) return false
      return true
    })
  }, [activities, activityClassroomFilter, activityStatusFilter, activityTypeFilter])

  const filteredObservations = useMemo(() => {
    return observations.filter((o) => {
      if (obsConcernFilter === 'CONCERN' && o.concern === 'NONE') return false
      if (obsConcernFilter === 'NONE' && o.concern !== 'NONE') return false
      if (obsCategoryFilter !== 'ALL' && o.category !== obsCategoryFilter) return false
      if (obsSearch.trim()) {
        const query = obsSearch.toLowerCase()
        const stuName = `${o.student?.firstName || ''} ${o.student?.lastName || ''}`.toLowerCase()
        const narrative = (o.narrative || '').toLowerCase()
        const goalName = (o.learningGoal?.name || '').toLowerCase()
        if (!stuName.includes(query) && !narrative.includes(query) && !goalName.includes(query)) return false
      }
      return true
    })
  }, [observations, obsConcernFilter, obsCategoryFilter, obsSearch])

  // Extract all available goals for selects
  const allGoals = useMemo(() => {
    if (!activeCurriculumDetail?.learningAreas) return []
    const list: { id: string; name: string; areaName: string }[] = []
    activeCurriculumDetail.learningAreas.forEach((area: any) => {
      ;(area.goals || []).forEach((goal: any) => {
        list.push({ id: goal.id, name: goal.name, areaName: area.name })
      })
    })
    return list
  }, [activeCurriculumDetail])

  // Domain icon helper
  const getDomainIcon = (name: string) => {
    const l = name.toLowerCase()
    if (l.includes('language') || l.includes('communication') || l.includes('literacy')) return <FileText size={18} className="text-blue-500" />
    if (l.includes('cognitive') || l.includes('math') || l.includes('thinking') || l.includes('numeracy')) return <Brain size={18} className="text-purple-500" />
    if (l.includes('motor') || l.includes('physical')) return <Activity size={18} className="text-emerald-500" />
    if (l.includes('social') || l.includes('emotional') || l.includes('psed')) return <HeartHandshake size={18} className="text-rose-500" />
    if (l.includes('art') || l.includes('creative') || l.includes('expressive')) return <Palette size={18} className="text-amber-500" />
    if (l.includes('world') || l.includes('science')) return <Compass size={18} className="text-teal-500" />
    return <Sparkles size={18} className="text-indigo-500" />
  }

  // Activity type icon and label helper
  const getActivityTypeMeta = (type?: string | null) => {
    switch (type) {
      case 'RHYME':
        return { label: 'Rhyme & Song', icon: <Music size={13} className="text-pink-500" />, badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' }
      case 'STORY':
        return { label: 'Story & Book', icon: <BookMarked size={13} className="text-amber-500" />, badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
      case 'GAME':
        return { label: 'Sensory Game', icon: <Gamepad2 size={13} className="text-emerald-500" />, badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
      case 'LESSON':
        return { label: 'Concept Lesson', icon: <GraduationCap size={13} className="text-blue-500" />, badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
      default:
        return { label: 'Play Activity', icon: <Sparkles size={13} className="text-purple-500" />, badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' }
    }
  }

  // Genuine resumable activities (IN_PROGRESS or scheduled for today)
  const resumableActivities = useMemo(() => {
    return activities.filter((a) => {
      if (a.status === 'IN_PROGRESS') return true
      if (a.status === 'PLANNED' && a.activityDate) {
        const today = new Date().toISOString().slice(0, 10)
        const d = new Date(a.activityDate).toISOString().slice(0, 10)
        return d === today
      }
      return false
    })
  }, [activities])

  const openNewActivityForCategory = (type: string) => {
    setActivityForm((prev) => ({
      ...prev,
      activityType: type,
      title: '',
      description: '',
      materials: '',
      expectedOutcome: '',
    }))
    setModalNewActivity(true)
  }

  const getCategoryFromType = (type?: string): 'courses' | 'rhymes' | 'stories' | 'games' => {
    switch (type) {
      case 'RHYME': return 'rhymes'
      case 'STORY': return 'stories'
      case 'GAME': return 'games'
      case 'LESSON':
      default:
        return 'courses'
    }
  }

  // Matching items for landing search control
  const librarySearchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return activities.filter((a) =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.activityType || '').toLowerCase().includes(q)
    )
  }, [searchQuery, activities])

  // Category specific activities
  const categoryActivities = useMemo(() => {
    if (!selectedCategory) return []
    const cat = CATEGORIES.find((c) => c.id === selectedCategory)
    if (!cat) return []
    return activities.filter((a) => {
      if (cat.id === 'courses') {
        return a.activityType === 'LESSON' || a.activityType === 'COURSE' || a.activityType === 'ACTIVITY'
      }
      return a.activityType === cat.activityType
    })
  }, [selectedCategory, activities, CATEGORIES])

  // Subject specific activities within Courses
  const subjectActivities = useMemo(() => {
    if (!selectedSubject) return []
    const subj = SUBJECTS.find((s) => s.id === selectedSubject)
    if (!subj) return []

    return activities.filter((a) => {
      // Must be course/lesson/activity type
      const isCourseType = a.activityType === 'LESSON' || a.activityType === 'COURSE' || a.activityType === 'ACTIVITY' || !a.activityType
      if (!isCourseType && selectedSubject !== 'creativity') return false

      const t = (a.title || '').toLowerCase()
      const d = (a.description || '').toLowerCase()
      const goalName = (a.learningGoal?.name || '').toLowerCase()
      const areaName = (a.learningGoal?.learningArea?.name || '').toLowerCase()

      // 1. Topic filter if selected
      if (selectedTopic) {
        const topicLower = selectedTopic.toLowerCase()
        const matchesTopic = t.includes(topicLower) || d.includes(topicLower) || goalName.includes(topicLower)
        if (!matchesTopic) return false
      }

      // 2. Keyword match for subject
      const text = `${t} ${d} ${goalName} ${areaName}`
      const matchesKeywords = subj.keywords.some((kw) => text.includes(kw))

      // For creativity, also include rhymes or stories if they contain creativity keywords
      if (selectedSubject === 'creativity' && (a.activityType === 'RHYME' || a.activityType === 'STORY')) {
        return matchesKeywords
      }

      return matchesKeywords
    })
  }, [activities, selectedSubject, selectedTopic, SUBJECTS])

  const filteredSubjectActivities = useMemo(() => {
    if (!categorySearchQuery.trim()) return subjectActivities
    const q = categorySearchQuery.toLowerCase()
    return subjectActivities.filter((a) =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.classroom?.name || '').toLowerCase().includes(q)
    )
  }, [subjectActivities, categorySearchQuery])

  const filteredCategoryActivities = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoryActivities
    const q = categorySearchQuery.toLowerCase()
    return categoryActivities.filter((a) =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.classroom?.name || '').toLowerCase().includes(q)
    )
  }, [categoryActivities, categorySearchQuery])

  return (
    <div className="page-shell space-y-6">
      {/* ── Breadcrumbs ── */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/app/home' },
          {
            label: 'PreO Learning',
            ...(view !== 'library'
              ? {
                  href: '#',
                  onClick: (e: any) => {
                    e?.preventDefault?.()
                    setView('library')
                    setSelectedCategory(null)
                    setSelectedSubject(null)
                    setSelectedTopic(null)
                    setCategorySearchQuery('')
                  },
                }
              : {}),
          },
          ...(view === 'category' && selectedCategory
            ? [
                {
                  label: CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'Category',
                  ...(selectedSubject
                    ? {
                        href: '#',
                        onClick: (e: any) => {
                          e?.preventDefault?.()
                          setSelectedSubject(null)
                          setSelectedTopic(null)
                          setCategorySearchQuery('')
                        },
                      }
                    : {}),
                },
                ...(selectedSubject
                  ? [
                      {
                        label: SUBJECTS.find((s) => s.id === selectedSubject)?.title || 'Subject',
                        ...(selectedTopic
                          ? {
                              href: '#',
                              onClick: (e: any) => {
                                e?.preventDefault?.()
                                setSelectedTopic(null)
                              },
                            }
                          : {}),
                      },
                      ...(selectedTopic ? [{ label: selectedTopic }] : []),
                    ]
                  : []),
              ]
            : []),
          ...(view === 'player' && activePlayItem
            ? [
                {
                  label: CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'Category',
                  href: '#',
                  onClick: (e: any) => {
                    e?.preventDefault?.()
                    setView('category')
                    setActivePlayItem(null)
                  },
                },
                ...(selectedCategory === 'courses' && selectedSubject
                  ? [
                      {
                        label: SUBJECTS.find((s) => s.id === selectedSubject)?.title || 'Subject',
                        href: '#',
                        onClick: (e: any) => {
                          e?.preventDefault?.()
                          setView('category')
                          setActivePlayItem(null)
                        },
                      },
                    ]
                  : []),
                { label: activePlayItem.title || 'Lesson Player' },
              ]
            : []),
          ...(view === 'admin' ? [{ label: 'Staff Workspace' }] : []),
        ]}
      />

      {/* ═════════════════════════════════════════════════════════════════════
          VIEW 1: PRIMARY 4-CARD PREO LEARNING LIBRARY (CLEAN CHILD-FRIENDLY LANDING)
          ═════════════════════════════════════════════════════════════════════ */}
      {view === 'library' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header: Title, Subtitle, and Preschool Mascot Companion */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              <img
                src="/animations/home/preo_learning_mascot.webp"
                alt="PreO Learning Mascot"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl bg-primary/10 p-1.5 shadow-sm shrink-0"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  PreO Learning
                </h1>
                <p className="text-sm sm:text-base font-medium text-muted-foreground tracking-wide mt-0.5">
                  Learn • Listen • Read • Play
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => fetchData()}
                disabled={refreshing}
                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 rounded-xl text-xs"
                title="Refresh Library"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {canWrite && (
                <button
                  onClick={() => setView('admin')}
                  className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold hover:border-primary/50 transition-colors"
                  title="Switch to Staff & Curriculum Studio"
                >
                  <Layers size={14} className="text-primary" />
                  <span>Staff Workspace</span>
                </button>
              )}
            </div>
          </div>

          {/* Compact Search Control */}
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, rhymes, stories, or games..."
              className="input pl-10 pr-10 py-2.5 text-sm w-full rounded-2xl bg-surface-elevated border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}

            {/* Live Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-surface-elevated border border-border rounded-2xl shadow-xl z-20 space-y-2 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1">
                  <span>Search Results</span>
                  <span>{librarySearchResults.length} found</span>
                </div>
                {librarySearchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No learning items found matching &quot;{searchQuery}&quot;
                  </p>
                ) : (
                  librarySearchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const catId = getCategoryFromType(item.activityType)
                        setSelectedCategory(catId)
                        setCategorySearchQuery(item.title)
                        setView('category')
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{item.classroom?.name || 'Classroom'}</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {item.activityType || 'ACTIVITY'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Optional Continue Learning Section — Rendered ONLY when genuine resumable progress exists */}
          {resumableActivities.length > 0 && (
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  Continue Learning
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resumableActivities.slice(0, 2).map((act) => {
                  const typeMeta = getActivityTypeMeta(act.activityType)
                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-surface-elevated border border-border hover:border-primary/40 transition-all flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${typeMeta.badge}`}>
                            {typeMeta.label}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={11} /> {act.durationMinutes || 30}m
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground truncate">{act.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{act.classroom?.name || 'Preschool Class'}</p>
                      </div>
                      <button
                        onClick={() => {
                          const catId = getCategoryFromType(act.activityType)
                          setSelectedCategory(catId)
                          setView('category')
                        }}
                        className="btn btn-primary btn-sm rounded-xl px-3 text-xs inline-flex items-center gap-1 shrink-0"
                      >
                        <span>Resume</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Exactly Four Primary Category Cards in a responsive 2×2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.Icon
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setSelectedSubject(null)
                    setSelectedTopic(null)
                    setCategorySearchQuery('')
                    setView('category')
                  }}
                  className="group relative flex flex-col items-center justify-between p-6 sm:p-8 rounded-3xl bg-surface-elevated border border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 text-center min-h-[300px] sm:min-h-[320px] overflow-hidden"
                >
                  {/* Subtle hover gradient backdrop */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${cat.bgGlow}`}
                  />

                  {/* 60–70% Visual Area for 3D Icon */}
                  <div className="w-full flex-1 flex items-center justify-center py-2 sm:py-4 min-h-[160px] sm:min-h-[190px]">
                    <div className="w-48 h-36 sm:w-56 sm:h-44 flex items-center justify-center transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
                      <IconComp className="w-full h-full object-contain filter drop-shadow-md" />
                    </div>
                  </div>

                  {/* Text placed beneath the icon */}
                  <div className="w-full mt-2 z-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {cat.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">
                      {cat.subtitle}
                    </p>
                  </div>

                  {/* Clickable affordance */}
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 z-10">
                    <span>{`Explore ${cat.title}`}</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          VIEW 2: CATEGORY SCREEN (COURSES, RHYMES, STORIES, GAMES)
          ═════════════════════════════════════════════════════════════════════ */}
      {view === 'category' && selectedCategory && (() => {
        const cat = CATEGORIES.find((c) => c.id === selectedCategory)!
        const CatIcon = cat.Icon

        // ─────────────────────────────────────────────────────────────────
        // SUB-VIEW 2A: COURSES CATEGORY -> SUBJECT DETAIL VIEW
        // ─────────────────────────────────────────────────────────────────
        if (selectedCategory === 'courses' && selectedSubject) {
          const currentSubject = SUBJECTS.find((s) => s.id === selectedSubject)!
          const SubjectIconComp = currentSubject.Icon

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Back navigation & Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedSubject(null)
                    setSelectedTopic(null)
                    setCategorySearchQuery('')
                  }}
                  className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={16} />
                  <span>Back to Subjects</span>
                </button>

                <div className="flex items-center gap-2">
                  {canWrite && (
                    <button
                      onClick={() => setView('admin')}
                      className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      <Layers size={13} />
                      <span>Staff Studio</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Detail Header Hero */}
              <div className="card p-6 sm:p-8 bg-surface-elevated border border-border rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-sm">
                    <SubjectIconComp className="w-full h-full" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Subject 0{currentSubject.number}
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentSubject.badgeClass}`}>
                        {currentSubject.badge}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border border-border bg-surface text-muted-foreground">
                        {subjectActivities.length} {subjectActivities.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                      {currentSubject.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                      {currentSubject.tagline}
                    </p>
                  </div>
                </div>

                {canWrite && (
                  <TactileButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActivityForm((prev) => ({
                        ...prev,
                        activityType: 'LESSON',
                        title: `${currentSubject.title}: `,
                        description: `Preschool ${currentSubject.title} activity focusing on ${selectedTopic || currentSubject.topics[0]}`,
                      }))
                      setModalNewActivity(true)
                    }}
                    className="inline-flex items-center gap-1.5 shadow-sm rounded-xl shrink-0"
                  >
                    <Plus size={15} />
                    <span>Schedule Lesson</span>
                  </TactileButton>
                )}
              </div>

              {/* Interactive Topics Stepper / Filter Pills */}
              <div className="card p-4 sm:p-5 bg-surface-elevated border border-border rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Canonical Learning Path
                  </span>
                  {selectedTopic && (
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Clear topic filter (Show all {currentSubject.title})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                      selectedTopic === null
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface text-muted-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    All Topics
                  </button>
                  {currentSubject.topics.map((topicName, idx) => {
                    const isSelected = selectedTopic === topicName
                    return (
                      <button
                        key={topicName}
                        onClick={() => setSelectedTopic(isSelected ? null : topicName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-surface text-foreground border-border hover:border-primary/40'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>{topicName}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Search Within Subject */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder={`Search ${currentSubject.title.toLowerCase()} lessons...`}
                    className="input pl-10 pr-4 py-2 text-xs w-full rounded-xl bg-surface-elevated border-border"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Showing {filteredSubjectActivities.length} of {subjectActivities.length} lessons</span>
                </div>
              </div>

              {/* Subject Lessons Grid or Friendly Empty State */}
              {filteredSubjectActivities.length === 0 ? (
                <div className="card p-12 text-center bg-surface-elevated border border-border rounded-3xl space-y-4">
                  <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-2xl overflow-hidden opacity-90">
                    <SubjectIconComp className="w-full h-full" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">
                      No Lessons Scheduled in {currentSubject.title}
                      {selectedTopic ? ` for ${selectedTopic}` : ''}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      There are currently no classroom activities planned for this curriculum track.
                      {canWrite ? ' Schedule a hands-on learning activity to engage children in this subject.' : ''}
                    </p>
                  </div>
                  {canWrite && (
                    <div className="pt-2">
                      <TactileButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActivityForm((prev) => ({
                            ...prev,
                            activityType: 'LESSON',
                            title: `${currentSubject.title}: ${selectedTopic || currentSubject.topics[0]} Introduction`,
                            description: `Interactive preschool activity for ${selectedTopic || currentSubject.topics[0]}`,
                          }))
                          setModalNewActivity(true)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Schedule First {currentSubject.title} Lesson</span>
                      </TactileButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubjectActivities.map((act) => {
                    const typeMeta = getActivityTypeMeta(act.activityType)
                    return (
                      <div
                        key={act.id}
                        className="card p-5 bg-surface-elevated border border-border hover:border-primary/40 rounded-2xl transition-all flex flex-col justify-between space-y-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${typeMeta.badge}`}>
                              {typeMeta.label}
                            </span>
                            <StatusPill
                              variant={
                                act.status === 'COMPLETED'
                                  ? 'success'
                                  : act.status === 'IN_PROGRESS'
                                  ? 'info'
                                  : 'neutral'
                              }
                              label={enumLabel(act.status)}
                            />
                          </div>

                          <h4 className="text-base font-bold text-foreground leading-snug">
                            {act.title}
                          </h4>

                          {act.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {act.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <Users size={12} className="text-primary" />
                              {act.classroom?.name || 'Classroom'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {act.durationMinutes || 30} mins
                            </span>
                          </div>

                          {act.expectedOutcome && (
                            <div className="text-[11px] bg-surface p-2 rounded-lg border border-border/60 text-muted-foreground">
                              <span className="font-semibold text-foreground">Outcome: </span>
                              {act.expectedOutcome}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              onClick={() => {
                                setActivePlayItem(resolveMediaMeta(act, 'Classroom Lesson'))
                                setView('player')
                              }}
                              className="btn btn-primary btn-sm text-xs py-1 px-3 rounded-lg inline-flex items-center gap-1.5"
                            >
                              <Play size={12} className="fill-white" />
                              <span>{activityProgressMap[act.id]?.status === 'COMPLETED' ? 'Replay' : activityProgressMap[act.id]?.status === 'IN_PROGRESS' ? 'Resume' : 'Play Lesson'}</span>
                            </button>

                            {canWrite && (
                              <div className="flex items-center gap-1.5">
                                {act.status === 'PLANNED' && (
                                  <button
                                    onClick={() => handleUpdateActivityStatus(act.id, 'IN_PROGRESS')}
                                    className="btn btn-secondary btn-sm text-xs py-1 rounded-lg"
                                  >
                                    Start
                                  </button>
                                )}
                                {act.status === 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleUpdateActivityStatus(act.id, 'COMPLETED')}
                                    className="btn btn-secondary btn-sm text-xs py-1 rounded-lg"
                                  >
                                    Mark Complete
                                  </button>
                                )}
                                {act.status === 'COMPLETED' && (
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        // ─────────────────────────────────────────────────────────────────
        // SUB-VIEW 2B: COURSES CATEGORY -> 4-SUBJECT SELECTION SCREEN (REFERENCE INSPIRED)
        // ─────────────────────────────────────────────────────────────────
        if (selectedCategory === 'courses' && !selectedSubject) {
          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setView('library')
                    setSelectedCategory(null)
                    setCategorySearchQuery('')
                  }}
                  className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={16} />
                  <span>Back to PreO Learning</span>
                </button>

                {canWrite && (
                  <button
                    onClick={() => setView('admin')}
                    className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                  >
                    <Layers size={13} />
                    <span>Open Staff Workspace</span>
                  </button>
                )}
              </div>

              {/* Courses Header Banner */}
              <div className="card p-6 sm:p-8 bg-surface-elevated border border-border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                  <div className="w-20 h-16 sm:w-24 sm:h-20 shrink-0 flex items-center justify-center">
                    <CatIcon className="w-full h-full object-contain filter drop-shadow-sm" />
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2.5">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                        Courses & Subjects
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border border-border bg-surface text-muted-foreground">
                        4 Foundation Subjects
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                      Structured early developmental learning paths designed for holistic preschool growth.
                    </p>
                  </div>
                </div>

                {canWrite && (
                  <TactileButton
                    variant="primary"
                    size="sm"
                    onClick={() => openNewActivityForCategory('LESSON')}
                    className="inline-flex items-center gap-1.5 shadow-sm rounded-xl shrink-0"
                  >
                    <Plus size={15} />
                    <span>Schedule Course Lesson</span>
                  </TactileButton>
                )}
              </div>

              {/* Clean Filter / Search for Subjects */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    placeholder="Search subjects or learning topics..."
                    className="input pl-10 pr-4 py-2 text-xs w-full rounded-xl bg-surface-elevated border-border"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Select a subject to explore developmental topics and lessons
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  THE 4 SUBJECTS: CLEAN, SPACIOUS, VERTICALLY STACKED ROWS
                  Matching the reference design with left rounded-square illustration,
                  subject number + title, learning-path description, subtle dividers,
                  and smooth navigation affordance.
                  ───────────────────────────────────────────────────────────── */}
              <div className="card bg-surface-elevated border border-border rounded-3xl divide-y divide-border overflow-hidden shadow-sm">
                {SUBJECTS.filter((s) => {
                  if (!categorySearchQuery.trim()) return true
                  const q = categorySearchQuery.toLowerCase()
                  return (
                    s.title.toLowerCase().includes(q) ||
                    s.subtitle.toLowerCase().includes(q) ||
                    s.badge.toLowerCase().includes(q) ||
                    s.topics.some((tp) => tp.toLowerCase().includes(q))
                  )
                }).map((subject) => {
                  const SubjectIcon = subject.Icon

                  // Count activities matching this subject
                  const count = activities.filter((a) => {
                    const isCourseType = a.activityType === 'LESSON' || a.activityType === 'COURSE' || a.activityType === 'ACTIVITY' || !a.activityType
                    if (!isCourseType && subject.id !== 'creativity') return false
                    const text = `${a.title || ''} ${a.description || ''} ${a.learningGoal?.name || ''}`.toLowerCase()
                    return subject.keywords.some((kw) => text.includes(kw))
                  }).length

                  return (
                    <div
                      key={subject.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedSubject(subject.id)
                        setSelectedTopic(null)
                        setCategorySearchQuery('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedSubject(subject.id)
                          setSelectedTopic(null)
                          setCategorySearchQuery('')
                        }
                      }}
                      className="group p-5 sm:p-7 hover:bg-surface/70 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 outline-none focus-visible:bg-surface/80 focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {/* Left: Illustration + Content */}
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0 flex-1">
                        {/* Rounded-Square Educational Illustration */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md flex items-center justify-center">
                          <SubjectIcon className="w-full h-full" />
                        </div>

                        {/* Subject Info */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              0{subject.number}.
                            </span>
                            <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                              {subject.title}
                            </h3>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${subject.badgeClass}`}>
                              {subject.badge}
                            </span>
                            {count > 0 && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface border border-border text-muted-foreground">
                                {count} {count === 1 ? 'lesson' : 'lessons'}
                              </span>
                            )}
                          </div>

                          {/* Learning Path Description */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                            {subject.topics.map((tp, idx) => (
                              <React.Fragment key={tp}>
                                <span className="font-medium hover:text-foreground transition-colors">
                                  {tp}
                                </span>
                                {idx < subject.topics.length - 1 && (
                                  <span className="text-muted-foreground/40 font-light select-none">→</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Subtitle / Tagline */}
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 hidden sm:block">
                            {subject.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Right: Navigation Affordance */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 text-xs font-semibold text-primary group-hover:translate-x-1 transition-all duration-200">
                        <span className="hidden sm:inline">Explore Subject</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        // ─────────────────────────────────────────────────────────────────
        // SUB-VIEW 2C: OTHER CATEGORIES (RHYMES, STORIES, GAMES)
        // Kept 100% intact as primary categories with their full functionality
        // ─────────────────────────────────────────────────────────────────
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Back Affordance */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setView('library')
                  setSelectedCategory(null)
                  setCategorySearchQuery('')
                }}
                className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={16} />
                <span>Back to PreO Learning</span>
              </button>

              {canWrite && (
                <button
                  onClick={() => setView('admin')}
                  className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                >
                  <Layers size={13} />
                  <span>Open Staff Workspace</span>
                </button>
              )}
            </div>

            {/* Category Hero Banner */}
            <div className="card p-6 sm:p-8 bg-surface-elevated border border-border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                <div className="w-20 h-16 sm:w-24 sm:h-20 shrink-0 flex items-center justify-center">
                  <CatIcon className="w-full h-full object-contain filter drop-shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {cat.title}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border border-border bg-surface text-muted-foreground">
                      {categoryActivities.length} {categoryActivities.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              {canWrite && (
                <TactileButton
                  variant="primary"
                  size="sm"
                  onClick={() => openNewActivityForCategory(cat.activityType)}
                  className="inline-flex items-center gap-1.5 shadow-sm rounded-xl shrink-0"
                >
                  <Plus size={15} />
                  <span>Schedule {cat.singularLabel}</span>
                </TactileButton>
              )}
            </div>

            {/* Category Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder={`Search ${cat.title.toLowerCase()} by title or classroom...`}
                  className="input pl-10 pr-4 py-2 text-xs w-full rounded-xl bg-surface-elevated border-border"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Showing {filteredCategoryActivities.length} of {categoryActivities.length}</span>
              </div>
            </div>

            {/* Items Grid or Friendly Empty State */}
            {filteredCategoryActivities.length === 0 ? (
              <div className="card p-12 text-center bg-surface-elevated border border-border rounded-3xl space-y-4">
                <div className="w-24 h-20 mx-auto flex items-center justify-center opacity-85">
                  <CatIcon className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    No {cat.title} Scheduled
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    There are currently no {cat.title.toLowerCase()} scheduled for this preschool classroom.
                    {canWrite ? ' Use the button below to schedule one for your learners.' : ''}
                  </p>
                </div>
                {canWrite && (
                  <div className="pt-2">
                    <TactileButton
                      variant="primary"
                      size="sm"
                      onClick={() => openNewActivityForCategory(cat.activityType)}
                      className="inline-flex items-center gap-1.5 rounded-xl shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Schedule First {cat.singularLabel}</span>
                    </TactileButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategoryActivities.map((act) => {
                  const typeMeta = getActivityTypeMeta(act.activityType)
                  return (
                    <div
                      key={act.id}
                      className="card p-5 bg-surface-elevated border border-border hover:border-primary/40 rounded-2xl transition-all flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${typeMeta.badge}`}>
                            {typeMeta.label}
                          </span>
                          <StatusPill
                            variant={
                              act.status === 'COMPLETED'
                                ? 'success'
                                : act.status === 'IN_PROGRESS'
                                ? 'info'
                                : 'neutral'
                            }
                            label={enumLabel(act.status)}
                          />
                        </div>

                        <h4 className="text-base font-bold text-foreground leading-snug">
                          {act.title}
                        </h4>

                        {act.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <Users size={12} className="text-primary" />
                            {act.classroom?.name || 'Classroom'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {act.durationMinutes || 30} mins
                          </span>
                        </div>

                        {act.expectedOutcome && (
                          <div className="text-[11px] bg-surface p-2 rounded-lg border border-border/60 text-muted-foreground">
                            <span className="font-semibold text-foreground">Outcome: </span>
                            {act.expectedOutcome}
                          </div>
                        )}

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              onClick={() => {
                                setActivePlayItem(resolveMediaMeta(act, cat.title))
                                setView('player')
                              }}
                              className="btn btn-primary btn-sm text-xs py-1 px-3 rounded-lg inline-flex items-center gap-1.5"
                            >
                              <Play size={12} className="fill-white" />
                              <span>{activityProgressMap[act.id]?.status === 'COMPLETED' ? 'Replay' : activityProgressMap[act.id]?.status === 'IN_PROGRESS' ? 'Resume' : `Play ${cat.singularLabel}`}</span>
                            </button>

                            {canWrite && (
                              <div className="flex items-center gap-1.5">
                                {act.status === 'PLANNED' && (
                                  <button
                                    onClick={() => handleUpdateActivityStatus(act.id, 'IN_PROGRESS')}
                                    className="btn btn-secondary btn-sm text-xs py-1 rounded-lg"
                                  >
                                    Start
                                  </button>
                                )}
                                {act.status === 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleUpdateActivityStatus(act.id, 'COMPLETED')}
                                    className="btn btn-secondary btn-sm text-xs py-1 rounded-lg"
                                  >
                                    Mark Complete
                                  </button>
                                )}
                                {act.status === 'COMPLETED' && (
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ═════════════════════════════════════════════════════════════════════
          VIEW 3: SHARED MEDIA PLAYER & CANONICAL STUDENT PROGRESS
          ═════════════════════════════════════════════════════════════════════ */}
      {view === 'player' && activePlayItem && (() => {
        // Find playlist context for Next / Previous buttons
        let playlist: any[] = []
        if (selectedCategory === 'courses' && selectedSubject) {
          const currentSubject = SUBJECTS.find((s) => s.id === selectedSubject)
          if (currentSubject) {
            playlist = activities.filter((a) => {
              const isCourseType = a.activityType === 'LESSON' || a.activityType === 'COURSE' || a.activityType === 'ACTIVITY' || !a.activityType
              if (!isCourseType && currentSubject.id !== 'creativity') return false
              const text = `${a.title || ''} ${a.description || ''} ${a.learningGoal?.name || ''}`.toLowerCase()
              return currentSubject.keywords.some((kw) => text.includes(kw))
            })
          }
        } else if (selectedCategory) {
          const cat = CATEGORIES.find((c) => c.id === selectedCategory)
          if (cat) {
            playlist = activities.filter((a) => a.activityType === cat.activityType)
          }
        } else {
          playlist = activities
        }

        const currentIndex = playlist.findIndex((it) => it.id === activePlayItem.id)
        const hasPrev = currentIndex > 0
        const hasNxt = currentIndex >= 0 && currentIndex < playlist.length - 1

        const handlePlaySibling = (siblingItem: any) => {
          setActivePlayItem(resolveMediaMeta(siblingItem, activePlayItem.subtitle))
        }

        const currentProgress = activityProgressMap[activePlayItem.id]
        const isItemCompleted = currentProgress?.status === 'COMPLETED'
        const initialPos = currentProgress?.playbackPositionSecs || 0

        const activeStudent = students.find((s) => s.id === selectedStudentId)

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Navigation & Context Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
              <button
                onClick={() => {
                  if (selectedCategory) {
                    setView('category')
                  } else {
                    setView('library')
                  }
                }}
                className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline w-fit"
              >
                <ChevronLeft size={16} />
                <span>
                  {selectedCategory === 'courses' && selectedSubject
                    ? `Back to ${SUBJECTS.find((s) => s.id === selectedSubject)?.title || 'Subject'}`
                    : selectedCategory
                    ? `Back to ${CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'Category'}`
                    : 'Back to Library'}
                </span>
              </button>

              {/* Active Learner Selector */}
              <div className="flex items-center gap-2.5 bg-surface-elevated px-3 py-1.5 rounded-2xl border border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  Learner:
                </span>
                {students.length > 0 ? (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="text-xs font-semibold bg-transparent border-none text-foreground focus:outline-none focus:ring-0 cursor-pointer pr-2"
                  >
                    {students.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.firstName} {stu.lastName} ({stu.classroom?.name || 'Classroom'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No students enrolled</span>
                )}
                {activeStudent && (
                  <Avatar
                    name={`${activeStudent.firstName} ${activeStudent.lastName}`}
                    src={activeStudent.photoUrl}
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* Shared Media Player Component */}
            <SharedMediaPlayer
              item={activePlayItem}
              initialPositionSecs={initialPos}
              isCompleted={isItemCompleted}
              canProgress={Boolean(selectedStudentId)}
              onProgressUpdate={(pos, pct) => handleActivityProgressUpdate(activePlayItem.id, pos, pct)}
              onComplete={() => handleActivityComplete(activePlayItem.id)}
              hasPrevious={hasPrev}
              hasNext={hasNxt}
              onPrevious={() => {
                if (hasPrev) handlePlaySibling(playlist[currentIndex - 1])
              }}
              onNext={() => {
                if (hasNxt) handlePlaySibling(playlist[currentIndex + 1])
              }}
            />
          </div>
        )
      })()}

      {/* ═════════════════════════════════════════════════════════════════════
          VIEW 4: ADMINISTRATIVE WORKSPACE (FULL 5 TABS & KPIS)
          ═════════════════════════════════════════════════════════════════════ */}
      {view === 'admin' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Return Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <button
              onClick={() => setView('library')}
              className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
            >
              <ChevronLeft size={16} />
              <span>Back to PreO Learning Library</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-surface-elevated px-2.5 py-1 rounded-full border border-border">
              Staff & Curriculum Studio
            </span>
          </div>

          <PageHead
        title="PreO Learning"
        eyebrow="Preschool Curriculum & Milestone Studio"
        description="Developmental domains, early childhood curriculum frameworks, daily activity lesson plans, formative observations & milestone tracking."
        backHref="/app/home"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
              title="Refresh Academic Data"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {canWrite && (
              <>
                <TactileButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalNewObservation(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <Eye size={15} />
                  <span>Observe</span>
                </TactileButton>

                <TactileButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalNewActivity(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <Calendar size={15} />
                  <span>Plan Activity</span>
                </TactileButton>

                <TactileButton
                  variant="primary"
                  size="sm"
                  onClick={() => setModalNewCurriculum(true)}
                  className="inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={15} />
                  <span>New Curriculum</span>
                </TactileButton>
              </>
            )}
          </div>
        }
      />

      {/* ── Top Preschool KPI Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiTile
          label="Active Frameworks"
          value={curricula.length}
          icon={<BookOpen size={20} />}
          iconClass="ic-purple"
          meta={curricula[0]?.framework ? `${curricula[0].framework} Framework` : 'Standard Framework'}
          onClick={() => setTab('curriculum')}
          active={tab === 'curriculum'}
        />
        <KpiTile
          label="Learning Domains"
          value={activeCurriculumDetail?.learningAreas?.length ?? (stats?.curriculumsCount ? stats.curriculumsCount * 6 : 6)}
          icon={<Layers size={20} />}
          iconClass="ic-blue"
          meta="Early Childhood Areas"
          onClick={() => setTab('curriculum')}
          active={tab === 'curriculum'}
        />
        <KpiTile
          label="Activities Today"
          value={stats?.activitiesTodayCount ?? activities.length}
          icon={<Calendar size={20} />}
          iconClass="ic-emerald"
          meta="Classroom Plans"
          onClick={() => setTab('activities')}
          active={tab === 'activities'}
        />
        <KpiTile
          label="Observations"
          value={stats?.observationsCount ?? observations.length}
          icon={<Award size={20} />}
          iconClass="ic-amber"
          meta="Formative Notes"
          onClick={() => setTab('observations')}
          active={tab === 'observations'}
        />
        <KpiTile
          label="Concern Flags"
          value={stats?.concernsCount ?? observations.filter((o) => o.concern !== 'NONE').length}
          icon={<AlertTriangle size={20} />}
          iconClass="ic-rose"
          meta={stats?.concernsCount ? 'Requires Triage' : 'All Clear'}
          onClick={() => {
            setTab('observations')
            setObsConcernFilter('CONCERN')
          }}
          active={tab === 'observations' && obsConcernFilter === 'CONCERN'}
        />
      </div>

      {/* ── Module Tabs ── */}
      <div className="flex items-center justify-between border-b border-border/60 pb-1">
        <Segmented
          value={tab}
          onChange={(val: any) => setTab(val)}
          options={[
            { key: 'overview', label: 'Overview' },
            { key: 'curriculum', label: `Curriculum & Goals (${curricula.length})` },
            { key: 'activities', label: `Activity Planner (${activities.length})` },
            { key: 'observations', label: `Observations (${observations.length})` },
            { key: 'progress', label: 'Milestone Matrix' },
          ]}
        />
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW DASHBOARD
          ═════════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner / Empty state prompt if 0 curriculum */}
          {curricula.length === 0 && (
            <div className="card p-6 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border-purple-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles size={18} className="text-primary" />
                    Initialize Preschool Developmental Framework
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    No curriculum framework is active yet. Initialize the standard Early Years
                    Foundation Stage (EYFS) with all 6 developmental domains and 18+ milestone goals ready to use.
                  </p>
                </div>
                <TactileButton
                  variant="primary"
                  size="md"
                  disabled={isSeeding}
                  onClick={handleSeedStandardEYFS}
                  className="whitespace-nowrap shadow-sm inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>{isSeeding ? 'Initializing EYFS...' : 'Seed Standard EYFS Curriculum'}</span>
                </TactileButton>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Today's Classroom Schedule & Foundational Domains */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Schedule Card */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Calendar size={16} className="text-emerald-500" />
                      Classroom Activities Plan
                    </h3>
                    <p className="text-xs text-muted-foreground">Scheduled early learning sessions & lessons</p>
                  </div>
                  <TactileButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTab('activities')
                      setModalNewActivity(true)
                    }}
                    className="text-xs"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Session
                  </TactileButton>
                </div>

                {activities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No activities planned yet. Schedule play-based or structured activities for your classrooms.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activities.slice(0, 4).map((act) => {
                      const typeMeta = getActivityTypeMeta(act.activityType)
                      return (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-xl border border-border/60 bg-surface hover:bg-surface-elevated transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex flex-col items-center justify-center shrink-0">
                              <Clock size={16} />
                              <span className="text-[10px] font-bold">{act.durationMinutes || 30}m</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-foreground truncate">{act.title}</h4>
                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${typeMeta.badge} inline-flex items-center gap-1`}>
                                  {typeMeta.icon}
                                  <span>{typeMeta.label}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                                <span className="font-semibold text-foreground/80">{act.classroom?.name || 'All Classes'}</span>
                                <span>•</span>
                                <span>{fmtDate(act.activityDate)}</span>
                                {act.startTime && <span>at {act.startTime}</span>}
                                {act.learningGoal && (
                                  <>
                                    <span>•</span>
                                    <span className="text-primary truncate max-w-[180px]">{act.learningGoal.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusPill
                              variant={
                                act.status === 'COMPLETED'
                                  ? 'success'
                                  : act.status === 'IN_PROGRESS'
                                  ? 'warning'
                                  : act.status === 'CANCELLED'
                                  ? 'danger'
                                  : 'neutral'
                              }
                              label={enumLabel(act.status)}
                              size="sm"
                            />
                          </div>
                        </div>
                      )
                    })}

                    {activities.length > 4 && (
                      <button
                        onClick={() => setTab('activities')}
                        className="w-full py-2 text-center text-xs text-primary font-semibold hover:underline inline-flex items-center justify-center gap-1"
                      >
                        View all {activities.length} activities
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Foundational Learning Domains Overview */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      Early Childhood Developmental Domains
                    </h3>
                    <p className="text-xs text-muted-foreground">Core EYFS & holistic developmental milestones</p>
                  </div>
                  <button
                    onClick={() => setTab('curriculum')}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Manage Curriculum
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Language & Communication', desc: 'Phonics, vocabulary, story comprehension & expressive talk', icon: <FileText size={16} className="text-blue-500" /> },
                    { title: 'Early Numeracy & Logic', desc: 'Numbers, shape sorting, patterning & logical deduction', icon: <Brain size={16} className="text-purple-500" /> },
                    { title: 'Physical & Motor Skills', desc: 'Gross balance, scissor coordination & fine finger grasp', icon: <Activity size={16} className="text-emerald-500" /> },
                    { title: 'Social & Emotional (PSED)', desc: 'Self-regulation, peer sharing, empathy & emotional resilience', icon: <HeartHandshake size={16} className="text-rose-500" /> },
                    { title: 'Creative Expression & Arts', desc: 'Rhythm, role-play, clay sculpting & sensory exploration', icon: <Palette size={16} className="text-amber-500" /> },
                    { title: 'Understanding the World', desc: 'Nature discovery, plant life cycles & community helpers', icon: <Compass size={16} className="text-teal-500" /> },
                  ].map((dom, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border/60 bg-surface/60 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-elevated border border-border/40 shrink-0">
                        {dom.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground">{dom.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{dom.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Content & Multi-Format Readiness Card */}
              <div className="card p-5 border border-border/60 bg-surface/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderSync size={16} className="text-primary" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Digital Curriculum & Content Studio
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                    Provider-Independent
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PreO Learning supports multi-format lesson resources: nursery rhymes, picture storybooks, sensory
                  learning games, and structured lesson activities. Content metadata is designed for cloud storage and
                  future Google Drive integrations without mock playback simulation.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-foreground">
                  <div className="p-2 rounded-lg bg-surface-elevated flex items-center gap-1.5 border border-border/40">
                    <Music size={13} className="text-pink-500 shrink-0" />
                    <span>Poems & Rhymes</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-elevated flex items-center gap-1.5 border border-border/40">
                    <BookMarked size={13} className="text-amber-500 shrink-0" />
                    <span>Storybooks</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-elevated flex items-center gap-1.5 border border-border/40">
                    <Gamepad2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Sensory Games</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-elevated flex items-center gap-1.5 border border-border/40">
                    <GraduationCap size={13} className="text-blue-500 shrink-0" />
                    <span>Concept Lessons</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Recent Formative Observations Feed */}
            <div className="space-y-6">
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      Recent Observations
                    </h3>
                    <p className="text-xs text-muted-foreground">Formative teacher notes & milestone checks</p>
                  </div>
                  <TactileButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTab('observations')
                      setModalNewObservation(true)
                    }}
                    className="text-xs"
                  >
                    <Plus size={14} className="mr-1" />
                    Record
                  </TactileButton>
                </div>

                {observations.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No observations recorded yet. Capture student milestones, social breakthroughs, or support needs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {observations.slice(0, 5).map((obs) => (
                      <div
                        key={obs.id}
                        className="p-3 rounded-xl border border-border/60 bg-surface/70 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar
                              name={`${obs.student?.firstName || ''} ${obs.student?.lastName || ''}`}
                              src={obs.student?.photoUrl}
                              size="sm"
                            />
                            <div className="truncate">
                              <span className="font-bold text-foreground">
                                {obs.student?.firstName} {obs.student?.lastName}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                {obs.classroom?.name || ''}
                              </span>
                            </div>
                          </div>
                          {obs.concern !== 'NONE' ? (
                            <StatusPill variant="danger" label="Concern" size="sm" dot />
                          ) : (
                            <StatusPill variant="success" label="Passed" size="sm" />
                          )}
                        </div>

                        <p className="text-foreground/90 italic text-[11.5px] line-clamp-3 bg-surface-elevated/40 p-2 rounded-lg border border-border/30">
                          &ldquo;{obs.narrative}&rdquo;
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                          <span className="truncate max-w-[150px] font-medium text-primary">
                            {obs.learningGoal?.name || obs.category || 'General'}
                          </span>
                          <span>{fmtDate(obs.observedAt)}</span>
                        </div>
                      </div>
                    ))}

                    {observations.length > 5 && (
                      <button
                        onClick={() => setTab('observations')}
                        className="w-full py-1.5 text-center text-xs text-primary font-semibold hover:underline"
                      >
                        View all observations
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions Card */}
              <div className="card p-5 space-y-3 bg-gradient-to-br from-primary/5 via-surface to-surface">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Academic Workflows</h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setTab('progress')
                    }}
                    className="w-full p-2.5 rounded-lg border border-border/60 bg-surface hover:bg-surface-elevated text-left flex items-center justify-between text-xs font-semibold text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCheck size={15} className="text-emerald-500" />
                      Update Student Milestone Matrix
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </button>

                  <Link
                    href="/app/reports"
                    className="w-full p-2.5 rounded-lg border border-border/60 bg-surface hover:bg-surface-elevated text-left flex items-center justify-between text-xs font-semibold text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={15} className="text-purple-500" />
                      Academic Term Report Cards
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 2: CURRICULUM FRAMEWORKS & DEVELOPMENTAL GOALS
          ═════════════════════════════════════════════════════════════════════ */}
      {tab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Early Childhood Curriculums & Domains</h3>
              <p className="text-xs text-muted-foreground">
                Manage learning areas, milestones, and age-appropriate goals for preschool cohorts.
              </p>
            </div>
            {canWrite && (
              <div className="flex items-center gap-2">
                <TactileButton
                  variant="primary"
                  size="sm"
                  onClick={() => setModalNewCurriculum(true)}
                  className="inline-flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>New Curriculum</span>
                </TactileButton>
              </div>
            )}
          </div>

          {/* Curriculum Switcher Pills */}
          {curricula.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {curricula.map((curr) => {
                const isSelected = curr.id === selectedCurriculumId
                return (
                  <button
                    key={curr.id}
                    onClick={() => setSelectedCurriculumId(curr.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface border-border/60 text-foreground hover:bg-surface-elevated'
                    }`}
                  >
                    <BookOpen size={14} />
                    <span>{curr.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-elevated text-muted-foreground'
                      }`}
                    >
                      {curr.framework || 'EYFS'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Curriculum Detail Content */}
          {loadingCurriculumDetail ? (
            <div className="card p-12 text-center text-xs text-muted-foreground">
              Loading curriculum areas & goals...
            </div>
          ) : !activeCurriculumDetail ? (
            <div className="card p-10">
              <EmptyState
                illustration="curriculum"
                eyebrow="No Frameworks"
                title="Create Your First Early Years Curriculum"
                description="Set up an EYFS, Montessori, or custom preschool curriculum to track milestones across all learning domains."
                action={{
                  label: isSeeding ? 'Initializing...' : 'Seed Standard EYFS Curriculum',
                  onClick: handleSeedStandardEYFS,
                  variant: 'primary',
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Curriculum Banner */}
              <div className="card p-5 border-l-4 border-l-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground">{activeCurriculumDetail.name}</h3>
                    <StatusPill
                      variant={activeCurriculumDetail.status === 'ACTIVE' ? 'success' : 'neutral'}
                      label={enumLabel(activeCurriculumDetail.status)}
                      size="sm"
                      dot
                    />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {activeCurriculumDetail.framework || 'EYFS'} Framework
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-2xl">
                    {activeCurriculumDetail.description || 'Comprehensive developmental milestone framework for early childhood.'}
                  </p>
                </div>

                {canWrite && (
                  <div className="flex items-center gap-2">
                    <TactileButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setModalNewArea(true)}
                      className="text-xs whitespace-nowrap"
                    >
                      <Plus size={14} className="mr-1" />
                      Add Learning Domain
                    </TactileButton>
                  </div>
                )}
              </div>

              {/* Learning Areas Tree */}
              <div className="space-y-4">
                {(activeCurriculumDetail.learningAreas || []).length === 0 ? (
                  <div className="card p-8 text-center text-xs text-muted-foreground">
                    No learning domains yet. Click &ldquo;Add Learning Domain&rdquo; to add domains like Cognitive, Language, or Motor skills.
                  </div>
                ) : (
                  (activeCurriculumDetail.learningAreas || []).map((area: any) => (
                    <div key={area.id} className="card p-5 space-y-4">
                      {/* Area Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-surface-elevated border border-border/50">
                            {getDomainIcon(area.name)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                              {area.name}
                              <span className="text-[11px] font-normal text-muted-foreground">
                                ({area.goals?.length || 0} milestones)
                              </span>
                            </h4>
                            {area.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{area.description}</p>
                            )}
                          </div>
                        </div>

                        {canWrite && (
                          <TactileButton
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedAreaForGoal(area.id)
                              setModalNewGoal(true)
                            }}
                            className="text-xs"
                          >
                            <Plus size={13} className="mr-1" />
                            Add Goal
                          </TactileButton>
                        )}
                      </div>

                      {/* Goals List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(area.goals || []).length === 0 ? (
                          <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                            No milestone goals defined in this domain.
                          </div>
                        ) : (
                          area.goals.map((goal: any) => (
                            <div
                              key={goal.id}
                              className="p-3 rounded-xl border border-border/40 bg-surface/40 hover:bg-surface-elevated transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                                <Check size={12} strokeWidth={3} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-foreground">{goal.name}</div>
                                {goal.description && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                    {goal.description}
                                  </div>
                                )}
                                {(goal.ageMinMonths || goal.ageMaxMonths) && (
                                  <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                                    Target Age: {goal.ageMinMonths || 0}–{goal.ageMaxMonths || 60} months
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 3: ACTIVITY PLANNER & DAILY ROUTINE
          ═════════════════════════════════════════════════════════════════════ */}
      {tab === 'activities' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Classroom Activity Planner</h3>
              <p className="text-xs text-muted-foreground">
                Schedule play, sensory, phonics, and motor lessons linked to early childhood learning goals.
              </p>
            </div>
            {canWrite && (
              <TactileButton
                variant="primary"
                size="sm"
                onClick={() => setModalNewActivity(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Plan Activity</span>
              </TactileButton>
            )}
          </div>

          {/* Filter Bar */}
          <div className="card p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter size={14} />
              <span>Filters:</span>
            </div>

            <select
              value={activityClassroomFilter}
              onChange={(e) => setActivityClassroomFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground font-medium"
            >
              <option value="ALL">All Classrooms</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground font-medium"
            >
              <option value="ALL">All Lesson Formats</option>
              <option value="ACTIVITY">Play Activity</option>
              <option value="RHYME">Rhyme & Poem</option>
              <option value="STORY">Storytelling</option>
              <option value="GAME">Sensory Game</option>
              <option value="LESSON">Concept Lesson</option>
            </select>

            <select
              value={activityStatusFilter}
              onChange={(e) => setActivityStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Activities List */}
          {filteredActivities.length === 0 ? (
            <div className="card p-10">
              <EmptyState
                illustration="curriculum"
                eyebrow="No Activities"
                title="No Activities Scheduled"
                description="Plan guided lessons, sensory bin activities, or story circles for your classrooms."
                action={
                  canWrite
                    ? {
                        label: 'Schedule an Activity',
                        onClick: () => setModalNewActivity(true),
                        variant: 'primary',
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActivities.map((act) => {
                const typeMeta = getActivityTypeMeta(act.activityType)
                return (
                  <div
                    key={act.id}
                    className="card p-4 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase">
                            {act.classroom?.name || 'All Classes'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${typeMeta.badge} inline-flex items-center gap-1`}>
                            {typeMeta.icon}
                            <span>{typeMeta.label}</span>
                          </span>
                        </div>
                        <StatusPill
                          variant={
                            act.status === 'COMPLETED'
                              ? 'success'
                              : act.status === 'IN_PROGRESS'
                              ? 'warning'
                              : act.status === 'CANCELLED'
                              ? 'danger'
                              : 'neutral'
                          }
                          label={enumLabel(act.status)}
                          size="sm"
                          dot
                        />
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug">{act.title}</h4>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                        <Clock size={13} className="text-primary" />
                        <span>{fmtDate(act.activityDate)}</span>
                        {act.startTime && <span>at {act.startTime}</span>}
                        <span>({act.durationMinutes || 30} mins)</span>
                      </div>

                      {act.learningGoal && (
                        <div className="p-2 rounded-lg bg-surface-elevated/60 border border-border/30 text-[11px] text-foreground/90">
                          <div className="text-[10px] font-bold text-primary uppercase">Target Goal</div>
                          <div className="truncate font-medium">{act.learningGoal.name}</div>
                        </div>
                      )}

                      {act.materials && (
                        <div className="text-[11px] text-muted-foreground">
                          <strong className="text-foreground">Materials:</strong> {act.materials}
                        </div>
                      )}

                      {act.instructions && (
                        <div className="text-[11px] text-muted-foreground bg-surface/50 p-2 rounded-lg border border-border/20">
                          <strong className="text-foreground block mb-0.5">Instructions:</strong>
                          <p className="line-clamp-3 whitespace-pre-line">{act.instructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Toggle Bar */}
                    {canWrite && (
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground">Change Status:</span>
                        <div className="flex items-center gap-1">
                          {act.status !== 'IN_PROGRESS' && act.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateActivityStatus(act.id, 'IN_PROGRESS')}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                            >
                              Start
                            </button>
                          )}
                          {act.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateActivityStatus(act.id, 'COMPLETED')}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center gap-1"
                            >
                              <Check size={11} />
                              Complete
                            </button>
                          )}
                          {act.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateActivityStatus(act.id, 'PLANNED')}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-surface-elevated text-muted-foreground hover:bg-surface"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 4: OBSERVATIONS JOURNAL & CONCERN TRIAGE
          ═════════════════════════════════════════════════════════════════════ */}
      {tab === 'observations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Formative Observations & Milestone Journal</h3>
              <p className="text-xs text-muted-foreground">
                Document individual child discoveries, developmental milestones, and early intervention concerns.
              </p>
            </div>
            {canWrite && (
              <TactileButton
                variant="primary"
                size="sm"
                onClick={() => setModalNewObservation(true)}
                className="inline-flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Record Observation</span>
              </TactileButton>
            )}
          </div>

          {/* Filter Bar */}
          <div className="card p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-2.5 py-1.5 flex-1 min-w-[200px]">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search child, notes, or milestone..."
                value={obsSearch}
                onChange={(e) => setObsSearch(e.target.value)}
                className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <select
              value={obsCategoryFilter}
              onChange={(e) => setObsCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General Learning</option>
              <option value="LANGUAGE">Language & Phonics</option>
              <option value="COGNITIVE">Cognitive & Math</option>
              <option value="MOTOR">Gross & Fine Motor</option>
              <option value="SOCIAL">Social Interaction</option>
              <option value="EMOTIONAL">Emotional Regulation</option>
              <option value="CREATIVE">Creative Arts</option>
            </select>

            <select
              value={obsConcernFilter}
              onChange={(e) => setObsConcernFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground font-medium"
            >
              <option value="ALL">All Observations</option>
              <option value="CONCERN">Concerns Flagged Only</option>
              <option value="NONE">Standard Milestones (No Concern)</option>
            </select>
          </div>

          {/* Observations Feed */}
          {filteredObservations.length === 0 ? (
            <div className="card p-10">
              <EmptyState
                illustration="curriculum"
                eyebrow="No Observations"
                title="No Observations Recorded"
                description="Capture a new milestone or developmental note for a student."
                action={
                  canWrite
                    ? {
                        label: 'Record New Observation',
                        onClick: () => setModalNewObservation(true),
                        variant: 'primary',
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredObservations.map((obs) => (
                <div
                  key={obs.id}
                  className="card p-4 space-y-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={`${obs.student?.firstName || ''} ${obs.student?.lastName || ''}`}
                        src={obs.student?.photoUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">
                            {obs.student?.firstName} {obs.student?.lastName}
                          </h4>
                          {obs.student?.admissionNo && (
                            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface-elevated">
                              {obs.student.admissionNo}
                            </span>
                          )}
                          {obs.classroom?.name && (
                            <span className="text-[11px] font-semibold text-primary">
                              {obs.classroom.name}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Observed on {fmtDate(obs.observedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {obs.concern && obs.concern !== 'NONE' ? (
                        <StatusPill
                          variant="danger"
                          label={`Concern: ${enumLabel(obs.concern)}`}
                          dot
                          pulse
                          size="sm"
                        />
                      ) : (
                        <StatusPill variant="success" label="Standard Progress" size="sm" dot />
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-elevated border border-border/50 text-foreground">
                        {obs.category || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Narrative Quote */}
                  <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border/40 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    &ldquo;{obs.narrative}&rdquo;
                  </div>

                  {/* Linked Goal Footer */}
                  {obs.learningGoal && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-primary font-medium">
                        <CheckCircle2 size={14} />
                        <span>Target Goal: {obs.learningGoal.name}</span>
                      </div>
                      {obs.learningGoal.learningArea?.name && (
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Domain: {obs.learningGoal.learningArea.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          TAB 5: STUDENT MILESTONE MATRIX (FORMATIVE ASSESSMENT)
          ═════════════════════════════════════════════════════════════════════ */}
      {tab === 'progress' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Student Milestone Assessment Matrix</h3>
              <p className="text-xs text-muted-foreground">
                Track each child&apos;s developmental progress stage across all curriculum goals.
              </p>
            </div>

            {/* Student Picker */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">Select Child:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground font-semibold flex-1 sm:w-64"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNo || 'STU'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingProgress ? (
            <div className="card p-12 text-center text-xs text-muted-foreground">
              Loading student milestone progress...
            </div>
          ) : !studentProgress ? (
            <div className="card p-10 text-center text-xs text-muted-foreground">
              Select a student above to review developmental milestone stages.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Overview Header Card */}
              <div className="card p-5 bg-gradient-to-r from-purple-500/10 via-surface to-surface border-purple-500/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={`${studentProgress.student?.firstName || ''} ${studentProgress.student?.lastName || ''}`}
                      src={studentProgress.student?.photoUrl}
                      size="lg"
                    />
                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {studentProgress.student?.firstName} {studentProgress.student?.lastName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>Adm: {studentProgress.student?.admissionNo}</span>
                        <span>•</span>
                        <span>Class: {studentProgress.student?.currentClassroom?.name || 'Classroom'}</span>
                        <span>•</span>
                        <span className="text-primary font-semibold">
                          Framework: {studentProgress.curriculum?.framework || 'EYFS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-center px-3 py-1.5 rounded-xl bg-surface border border-border/60">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {studentProgress.overallStats?.achievedGoals || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Achieved</div>
                    </div>
                    <div className="text-center px-3 py-1.5 rounded-xl bg-surface border border-border/60">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {studentProgress.overallStats?.developingGoals || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Developing</div>
                    </div>
                    <div className="text-center px-3 py-1.5 rounded-xl bg-surface border border-border/60">
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {studentProgress.overallStats?.introducedGoals || 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Introduced</div>
                    </div>
                    <div className="text-center px-3 py-1.5 rounded-xl bg-surface border border-border/60">
                      <div className="text-xs font-bold text-primary">
                        {studentProgress.overallStats?.percentAchieved || 0}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Mastery</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domains & Goals Progress Grid */}
              <div className="space-y-4">
                {(studentProgress.areas || []).map((area: any) => (
                  <div key={area.id} className="card p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-surface-elevated border border-border/40">
                          {getDomainIcon(area.name)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{area.name}</h4>
                          <span className="text-[11px] text-muted-foreground">
                            {area.achievedCount} of {area.totalCount} milestones achieved ({area.percentAchieved}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-32 bg-surface-elevated rounded-full h-2.5 overflow-hidden border border-border/30">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${area.percentAchieved}%` }}
                        />
                      </div>
                    </div>

                    {/* Goals List with Interactive Stage Selector */}
                    <div className="space-y-2">
                      {(area.goals || []).map((g: any) => (
                        <div
                          key={g.id}
                          className="p-3 rounded-xl border border-border/40 bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-foreground">{g.name}</div>
                            {g.notes && (
                              <div className="text-[11px] text-muted-foreground italic mt-0.5">
                                &ldquo;{g.notes}&rdquo;
                              </div>
                            )}
                          </div>

                          {/* Stage Buttons */}
                          <div className="flex items-center gap-1 shrink-0 flex-wrap">
                            {(['NOT_STARTED', 'INTRODUCED', 'DEVELOPING', 'ACHIEVED'] as const).map((st) => {
                              const isActive = g.stage === st
                              return (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateStudentStage(g.id, st)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                    isActive
                                      ? st === 'ACHIEVED'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : st === 'DEVELOPING'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                        : st === 'INTRODUCED'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                      : 'bg-surface border-border/50 text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
                                  }`}
                                >
                                  {st === 'NOT_STARTED'
                                    ? 'Not Started'
                                    : st === 'INTRODUCED'
                                    ? 'Introduced'
                                    : st === 'DEVELOPING'
                                    ? 'Developing'
                                    : 'Achieved'}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 1: NEW CURRICULUM
          ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalNewCurriculum}
        onClose={() => setModalNewCurriculum(false)}
        title="Create Early Childhood Curriculum"
        subtitle="Define an EYFS, Montessori, or play-based developmental framework"
        maxWidth={540}
      >
        <form onSubmit={handleCreateCurriculum} className="space-y-4">
          <Field label="Curriculum Name" required>
            <input
              type="text"
              required
              value={curriculumForm.name}
              onChange={(e) => setCurriculumForm({ ...curriculumForm, name: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="e.g. Early Years Foundation Stage (EYFS)"
            />
          </Field>

          <Field label="Educational Framework" required>
            <select
              value={curriculumForm.framework}
              onChange={(e) => setCurriculumForm({ ...curriculumForm, framework: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
            >
              <option value="EYFS">Early Years Foundation Stage (EYFS)</option>
              <option value="MONTESSORI">Montessori Method</option>
              <option value="PLAY_BASED">Play-Based Early Learning</option>
              <option value="REGGIO_EMILIA">Reggio Emilia Approach</option>
              <option value="WALDORF">Waldorf Steiner Early Years</option>
              <option value="CUSTOM">Custom Preschool Framework</option>
            </select>
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={curriculumForm.description}
              onChange={(e) => setCurriculumForm({ ...curriculumForm, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="Brief description of the learning vision..."
            />
          </Field>

          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
            <input
              type="checkbox"
              id="seedDefault"
              checked={curriculumForm.seedDefaultAreas}
              onChange={(e) => setCurriculumForm({ ...curriculumForm, seedDefaultAreas: e.target.checked })}
              className="mt-0.5 rounded text-primary"
            />
            <label htmlFor="seedDefault" className="text-xs text-foreground cursor-pointer">
              <strong>Seed Standard Foundational Domains (Recommended)</strong>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automatically pre-populates all 6 core preschool domains: Language & Communication, Early Numeracy & Logic,
                Physical & Motor, Social & Emotional (PSED), Creative Expression & Arts, and Understanding the World.
              </p>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={submittingCurriculum}
              onClick={() => setModalNewCurriculum(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCurriculum}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              {submittingCurriculum ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Creating Framework...</span>
                </>
              ) : (
                <span>Create Framework</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 2: ADD LEARNING DOMAIN / AREA
          ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalNewArea}
        onClose={() => setModalNewArea(false)}
        title="Add Learning Domain"
        subtitle="Add a core developmental area to the active curriculum"
        maxWidth={480}
      >
        <form onSubmit={handleCreateArea} className="space-y-4">
          <Field label="Domain Name" required>
            <input
              type="text"
              required
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="e.g. Sensory & Nature Exploration"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={2}
              value={areaForm.description}
              onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="What children learn in this developmental area..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={submittingArea}
              onClick={() => setModalNewArea(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingArea}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              {submittingArea ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Adding Domain...</span>
                </>
              ) : (
                <span>Add Domain</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 3: ADD LEARNING GOAL
          ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalNewGoal}
        onClose={() => setModalNewGoal(false)}
        title="Add Developmental Goal"
        subtitle="Specify a milestone goal under this developmental domain"
        maxWidth={480}
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Field label="Goal / Milestone Statement" required>
            <input
              type="text"
              required
              value={goalForm.name}
              onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="e.g. Cuts along curved lines using child-safe scissors"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Age (Months)">
              <input
                type="number"
                value={goalForm.ageMinMonths}
                onChange={(e) => setGoalForm({ ...goalForm, ageMinMonths: parseInt(e.target.value, 10) || 0 })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              />
            </Field>

            <Field label="Max Age (Months)">
              <input
                type="number"
                value={goalForm.ageMaxMonths}
                onChange={(e) => setGoalForm({ ...goalForm, ageMaxMonths: parseInt(e.target.value, 10) || 60 })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              />
            </Field>
          </div>

          <Field label="Teacher Guide / Description">
            <textarea
              rows={2}
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="Tips for observing or assessing this milestone..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={submittingGoal}
              onClick={() => setModalNewGoal(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingGoal}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              {submittingGoal ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving Milestone...</span>
                </>
              ) : (
                <span>Save Milestone Goal</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 4: PLAN CLASSROOM ACTIVITY
          ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalNewActivity}
        onClose={() => setModalNewActivity(false)}
        title="Plan Classroom Activity"
        subtitle="Schedule an engaging early learning session for your classroom"
        maxWidth={560}
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <Field label="Activity Title" required>
            <input
              type="text"
              required
              value={activityForm.title}
              onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="e.g. Scented Playdough Alphabet Stamping"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Lesson / Resource Format" required>
              <select
                value={activityForm.activityType}
                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              >
                <option value="ACTIVITY">Play & Hands-on Activity</option>
                <option value="RHYME">Rhyme, Song & Phonics Poem</option>
                <option value="STORY">Storytelling & Picture Book</option>
                <option value="GAME">Sensory & Circle Game</option>
                <option value="LESSON">Concept & Circle Time Lesson</option>
              </select>
            </Field>

            <Field label="Classroom" required>
              <select
                required
                value={activityForm.classroomId}
                onChange={(e) => setActivityForm({ ...activityForm, classroomId: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              >
                <option value="">Select Classroom</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Activity Date" required>
              <input
                type="date"
                required
                value={activityForm.activityDate}
                onChange={(e) => setActivityForm({ ...activityForm, activityDate: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              />
            </Field>

            <Field label="Start Time">
              <input
                type="time"
                value={activityForm.startTime}
                onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              />
            </Field>

            <Field label="Duration (Minutes)">
              <input
                type="number"
                value={activityForm.durationMinutes}
                onChange={(e) => setActivityForm({ ...activityForm, durationMinutes: parseInt(e.target.value, 10) || 30 })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              />
            </Field>
          </div>

          {allGoals.length > 0 && (
            <Field label="Target Learning Milestone">
              <select
                value={activityForm.learningGoalId}
                onChange={(e) => setActivityForm({ ...activityForm, learningGoalId: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              >
                <option value="">Optional: Link to Milestone Goal</option>
                {allGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.areaName}] {g.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Materials Required">
            <input
              type="text"
              value={activityForm.materials}
              onChange={(e) => setActivityForm({ ...activityForm, materials: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="e.g. Non-toxic playdough, wooden alphabet stamps, rolling pins"
            />
          </Field>

          <Field label="Lesson Instructions / Steps">
            <textarea
              rows={3}
              value={activityForm.instructions}
              onChange={(e) => setActivityForm({ ...activityForm, instructions: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="1. Distribute playdough rolls to each table.&#10;2. Demonstrate pressing stamp firmly.&#10;3. Practice phonics sound."
            />
          </Field>

          <Field label="Expected Developmental Outcome">
            <input
              type="text"
              value={activityForm.expectedOutcome}
              onChange={(e) => setActivityForm({ ...activityForm, expectedOutcome: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="e.g. Finger muscle coordination and phonics letter recognition"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={submittingActivity}
              onClick={() => setModalNewActivity(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingActivity}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              {submittingActivity ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Activity</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 5: RECORD FORMATIVE OBSERVATION
          ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        open={modalNewObservation}
        onClose={() => setModalNewObservation(false)}
        title="Record Developmental Observation"
        subtitle="Capture qualitative observations and formative milestone checks"
        maxWidth={560}
      >
        <form onSubmit={handleCreateObservation} className="space-y-4">
          <Field label="Student" required>
            <select
              required
              value={observationForm.studentId}
              onChange={(e) => setObservationForm({ ...observationForm, studentId: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
            >
              <option value="">Select Child</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNo || 'STU'})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select
                value={observationForm.category}
                onChange={(e) => setObservationForm({ ...observationForm, category: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              >
                <option value="GENERAL">General Learning</option>
                <option value="LANGUAGE">Language & Phonics</option>
                <option value="COGNITIVE">Cognitive & Math</option>
                <option value="MOTOR">Gross & Fine Motor</option>
                <option value="SOCIAL">Social Interaction</option>
                <option value="EMOTIONAL">Emotional Regulation</option>
                <option value="CREATIVE">Creative Arts</option>
              </select>
            </Field>

            <Field label="Concern Level">
              <select
                value={observationForm.concern}
                onChange={(e) => setObservationForm({ ...observationForm, concern: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground font-semibold"
              >
                <option value="NONE">None (Typical Progress)</option>
                <option value="MILD">Mild (Needs Encouragement)</option>
                <option value="MODERATE">Moderate (Follow-Up Needed)</option>
                <option value="CRITICAL">Critical (Immediate Care Team Flag)</option>
              </select>
            </Field>
          </div>

          {allGoals.length > 0 && (
            <Field label="Linked Milestone Goal (Optional)">
              <select
                value={observationForm.learningGoalId}
                onChange={(e) => setObservationForm({ ...observationForm, learningGoalId: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              >
                <option value="">None / General Note</option>
                {allGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.areaName}] {g.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {observationForm.learningGoalId && (
            <Field label="Update Milestone Stage">
              <select
                value={observationForm.progressStage}
                onChange={(e) => setObservationForm({ ...observationForm, progressStage: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              >
                <option value="INTRODUCED">Introduced</option>
                <option value="DEVELOPING">Developing</option>
                <option value="ACHIEVED">Achieved</option>
              </select>
            </Field>
          )}

          <Field label="Observation Narrative / Teacher Notes" required>
            <textarea
              required
              rows={4}
              value={observationForm.narrative}
              onChange={(e) => setObservationForm({ ...observationForm, narrative: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-xl border border-border bg-surface text-foreground"
              placeholder="Describe what the child demonstrated today, e.g. 'Aarav confidently held child scissors and followed the curved line independently with joyful focus.'"
            />
          </Field>

          <div className="flex items-center gap-2 p-3 rounded-xl border border-border/60 bg-surface/60">
            <input
              type="checkbox"
              id="timelinePub"
              checked={observationForm.publishToTimeline}
              onChange={(e) => setObservationForm({ ...observationForm, publishToTimeline: e.target.checked })}
              className="rounded text-primary"
            />
            <label htmlFor="timelinePub" className="text-xs text-foreground cursor-pointer">
              Publish milestone breakthrough to Parent Portal timeline
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={submittingObservation}
              onClick={() => setModalNewObservation(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingObservation}
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
            >
              {submittingObservation ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Saving Observation...</span>
                </>
              ) : (
                <span>Record Observation</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
