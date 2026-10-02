'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Loader2,
  GraduationCap,
  Users,
  UserCheck,
  Building,
  CalendarCheck,
  DollarSign,
  Briefcase,
  Truck,
  Package,
  FileText,
  Megaphone,
  ShieldCheck,
  Settings,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  Plus,
  Inbox,
  Ban,
  History,
  Trash2,
  Command,
  Home,
  LayoutDashboard,
  BarChart3,
  Phone,
  MessageCircle,
  Printer,
  Eye,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import type { SearchCategory, SearchResultItem, GlobalSearchResponse } from '@/lib/search/search-service'
import { RecordInspector, InspectorRecordType } from '@/components/preone/RecordInspector'
import { StatusBadge, Avatar } from '@/components/preone/ui'
import { enumLabel, inr, fmtDate } from '@/lib/format'
import type { Role } from '@/lib/auth'

export interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
  user?: {
    name: string
    email: string
    role: Role
    tenantName: string
    branchName: string | null
  }
}

const CATEGORY_ICONS: Record<SearchCategory, React.ComponentType<any>> = {
  students: GraduationCap,
  guardians: Users,
  staff: UserCheck,
  admissions: Building,
  academics: GraduationCap,
  attendance: CalendarCheck,
  operations: Building,
  finance: DollarSign,
  hr: Briefcase,
  transport: Truck,
  inventory: Package,
  reports: FileText,
  communication: Megaphone,
  audit: ShieldCheck,
  settings: Settings,
}

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  students: 'Students',
  guardians: 'Guardians',
  staff: 'Staff / Users',
  admissions: 'Admissions',
  academics: 'Academics',
  attendance: 'Attendance',
  operations: 'Operations',
  finance: 'Finance',
  hr: 'Workforce / HR',
  transport: 'Transport',
  inventory: 'Inventory',
  reports: 'Reports',
  communication: 'Communication',
  audit: 'Audit Logs',
  settings: 'Settings & Navigation',
}

const CATEGORY_ORDER: SearchCategory[] = [
  'students',
  'guardians',
  'staff',
  'admissions',
  'academics',
  'attendance',
  'operations',
  'finance',
  'hr',
  'transport',
  'inventory',
  'reports',
  'communication',
  'audit',
  'settings',
]

type CommandItem = {
  key: string
  label: string
  hint: string
  icon: React.ComponentType<any>
  href: string
}

type RecentItem = { label: string; hint: string; href: string }

const COMMANDS: CommandItem[] = [
  { key: 'enroll-student', label: 'Enroll a Child', hint: 'Student Workflow', icon: Plus, href: '/app/students?open=create' },
  { key: 'fast-roll-call', label: 'Fast Roll Call', hint: 'Daily Attendance', icon: Sparkles, href: '/app/daily-diary?tab=attendance&fastRollCall=true' },
  { key: 'add-staff', label: 'Add Staff User', hint: 'Staff Directory', icon: UserCheck, href: '/app/users/staff?open=add' },
  { key: 'create-user', label: 'Create user', hint: 'Actions', icon: Plus, href: '/app/users?open=ADD' },
  { key: 'pending-invites', label: 'View pending invitations', hint: 'Actions', icon: Inbox, href: '/app/users?tab=PENDING' },
  { key: 'home', label: 'Home', hint: 'Jump to module', icon: Home, href: '/app/home' },
  { key: 'dashboard', label: 'Dashboard', hint: 'Jump to module', icon: LayoutDashboard, href: '/app/dashboard' },
  { key: 'students', label: 'Students', hint: 'Jump to module', icon: GraduationCap, href: '/app/students' },
  { key: 'daily-diary', label: 'Attendance & Daily Diary', hint: 'Jump to module', icon: CalendarCheck, href: '/app/daily-diary' },
  { key: 'finance', label: 'Fees & Finance', hint: 'Jump to module', icon: DollarSign, href: '/app/finance' },
  { key: 'admissions', label: 'Admissions', hint: 'Jump to module', icon: Building, href: '/app/admissions' },
  { key: 'settings', label: 'Settings', hint: 'Jump to module', icon: Settings, href: '/app/settings' },
]

const RECENTS_KEY = 'preone:search-recents'
const RECENTS_MAX = 5

function loadRecents(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => r && typeof r.label === 'string' && typeof r.href === 'string')
      .slice(0, RECENTS_MAX)
  } catch {
    return []
  }
}

function cleanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

export interface ParsedAction {
  intent: 'ENROLL_CHILD' | 'ADD_STAFF' | 'CONTACT_GUARDIAN' | 'VIEW_RECEIPT' | 'FAST_ROLL_CALL' | null
  target?: string
  contactMethod?: 'call' | 'whatsapp'
}

export function parseUniversalAction(query: string): ParsedAction {
  const q = query.trim().toLowerCase()
  if (!q) return { intent: null }

  // 1. Enroll child
  if (/^(add\s+stu(dent)?|enroll(\s+a)?\s+child|new\s+student)$/i.test(q)) {
    return { intent: 'ENROLL_CHILD' }
  }

  // 2. Add staff
  if (/^(add\s+staff|invite\s+staff|create\s+staff|new\s+teacher)$/i.test(q)) {
    return { intent: 'ADD_STAFF' }
  }

  // 3. Fast Roll Call
  if (/^(roll\s*call|fast\s*roll\s*call|take\s+attendance|open\s+attendance)$/i.test(q)) {
    return { intent: 'FAST_ROLL_CALL' }
  }

  // 4. Contact guardian: call [name] or whatsapp [name]
  const callMatch = q.match(/^call\s+(.+)$/i)
  if (callMatch) {
    return { intent: 'CONTACT_GUARDIAN', target: callMatch[1].trim(), contactMethod: 'call' }
  }
  const waMatch = q.match(/^(whatsapp|wa)\s+(.+)$/i)
  if (waMatch) {
    return { intent: 'CONTACT_GUARDIAN', target: waMatch[2].trim(), contactMethod: 'whatsapp' }
  }

  // 5. Receipt [name]
  const receiptMatch = q.match(/^(receipts?|fee\s+receipt)\s+(.+)$/i)
  if (receiptMatch) {
    return { intent: 'VIEW_RECEIPT', target: receiptMatch[2].trim() }
  }

  return { intent: null }
}

export function GlobalSearchModal({ isOpen, onClose, initialQuery = '', user }: GlobalSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GlobalSearchResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [recents, setRecents] = useState<RecentItem[]>(loadRecents)

  // Action Command State
  const [actionLoading, setActionLoading] = useState(false)
  const [actionStudents, setActionStudents] = useState<any[]>([])

  // Side-Peek Inspector State
  const [inspectingRecord, setInspectingRecord] = useState<{
    type: InspectorRecordType
    id: string
    data?: any
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    } else {
      setQuery('')
      setData(null)
      setActiveCategory('all')
      setSelectedIndex(0)
      setError(null)
      setActionStudents([])
    }
  }, [isOpen])

  // Persist recents
  useEffect(() => {
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(recents))
    } catch {
      // storage unavailable
    }
  }, [recents])

  const parsedAction = useMemo(() => parseUniversalAction(query), [query])

  // Resolve entity for CONTACT_GUARDIAN or VIEW_RECEIPT
  useEffect(() => {
    if (!parsedAction.intent || !parsedAction.target) {
      setActionStudents([])
      setActionLoading(false)
      return
    }

    if (parsedAction.intent === 'CONTACT_GUARDIAN' || parsedAction.intent === 'VIEW_RECEIPT') {
      setActionLoading(true)
      const controller = new AbortController()

      fetch(`/api/v1/search?q=${encodeURIComponent(parsedAction.target)}&category=students&limit=5`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Search failed'))))
        .then(async (json) => {
          if (json.success && json.data && json.data.results) {
            const studentIds = json.data.results.map((r: any) => r.id)
            if (studentIds.length === 0) {
              setActionStudents([])
              setActionLoading(false)
              return
            }

            // Fetch profiles to resolve guardians and receipts
            const profilePromises = studentIds.slice(0, 3).map((id: string) =>
              fetch(`/api/v1/students/${id}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((j) => (j && j.success ? j.data : null))
                .catch(() => null)
            )

            const profiles = (await Promise.all(profilePromises)).filter(Boolean)
            setActionStudents(profiles)
          } else {
            setActionStudents([])
          }
        })
        .catch(() => {
          setActionStudents([])
        })
        .finally(() => {
          setActionLoading(false)
        })

      return () => controller.abort()
    }
  }, [parsedAction])

  // Debounced search for standard search queries
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.startsWith('>') || parsedAction.intent) {
      if (!parsedAction.intent) setData(null)
      setLoading(false)
      setError(null)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const catParam = activeCategory !== 'all' ? `&category=${encodeURIComponent(activeCategory)}` : ''
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}${catParam}&limit=20`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`Search failed: HTTP ${res.status}`)
        }
        const json = await res.json()
        if (json.success && json.data) {
          setData(json.data)
          setSelectedIndex(0)
        } else {
          throw new Error(json.error?.message || 'Search returned unexpected response')
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message || 'An error occurred while searching')
        }
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, activeCategory, parsedAction.intent])

  const trimmedQuery = query.trim()
  const commandMode = trimmedQuery.startsWith('>')
  const commandQuery = commandMode ? trimmedQuery.slice(1).trim().toLowerCase() : ''
  const filteredCommands = commandMode
    ? COMMANDS.filter(
        (c) =>
          !commandQuery ||
          c.label.toLowerCase().includes(commandQuery) ||
          c.hint.toLowerCase().includes(commandQuery) ||
          c.key.includes(commandQuery),
      )
    : []
  const results = data?.results || []

  const pushRecent = useCallback((item: RecentItem) => {
    setRecents((prev) => [item, ...prev.filter((r) => r.href !== item.href)].slice(0, RECENTS_MAX))
  }, [])

  const clearRecents = useCallback(() => {
    setRecents([])
    setSelectedIndex(0)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const activeCount = commandMode ? filteredCommands.length : trimmedQuery ? results.length : recents.length
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (activeCount > 0 ? (prev + 1) % activeCount : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (activeCount > 0 ? (prev - 1 + activeCount) % activeCount : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (commandMode) {
          const cmd = filteredCommands[selectedIndex]
          if (cmd) {
            pushRecent({ label: cmd.label, hint: cmd.hint, href: cmd.href })
            onClose()
            router.push(cmd.href)
          }
        } else if (parsedAction.intent === 'ENROLL_CHILD') {
          onClose()
          router.push('/app/students?open=create')
        } else if (parsedAction.intent === 'ADD_STAFF') {
          onClose()
          router.push('/app/users/staff?open=add')
        } else if (parsedAction.intent === 'FAST_ROLL_CALL') {
          onClose()
          router.push('/app/daily-diary?tab=attendance&fastRollCall=true')
        } else if (!trimmedQuery) {
          const rec = recents[selectedIndex]
          if (rec) {
            onClose()
            router.push(rec.href)
          }
        } else if (results[selectedIndex]) {
          const target = results[selectedIndex]
          pushRecent({ label: target.title, hint: CATEGORY_LABELS[target.category], href: target.actionUrl })
          onClose()
          router.push(target.actionUrl)
        } else {
          onClose()
          router.push(`/app/search?q=${encodeURIComponent(trimmedQuery)}${activeCategory !== 'all' ? `&category=${activeCategory}` : ''}`)
        }
      }
    },
    [onClose, commandMode, filteredCommands, parsedAction, trimmedQuery, results, selectedIndex, recents, activeCategory, router, pushRecent],
  )

  // Auto-scroll selected element
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector('[data-sel]') as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex, commandMode, trimmedQuery, results.length, recents.length])

  // Open Side-Peek Inspector for an item
  const handleInspect = (category: SearchCategory, id: string, itemData?: any) => {
    let inspectType: InspectorRecordType | null = null
    if (category === 'students') inspectType = 'student'
    else if (category === 'staff') inspectType = 'staff'
    else if (category === 'finance') inspectType = 'invoice'

    if (inspectType) {
      setInspectingRecord({ type: inspectType, id, data: itemData })
    }
  }

  if (!isOpen && !inspectingRecord) return null

  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => data?.categoryCounts && (data.categoryCounts[cat] ?? 0) > 0
  )

  return (
    <>
      {isOpen && (
        <div
          className="global-search-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Universal Action Search"
        >
          <div
            className="global-search-modal"
            onKeyDown={handleKeyDown}
            style={{
              boxShadow: 'var(--elevation-3), var(--surface-highlight-dialog)',
            }}
          >
            {/* Search Input Header */}
            <div className="search-modal-header">
              <div className="search-input-wrapper">
                {loading || actionLoading ? (
                  <Loader2 className="search-icon spin" size={20} />
                ) : (
                  <Search className="search-icon" size={20} />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  className="search-input"
                  placeholder="Type an action (e.g. “add student”, “call Aarav”, “roll call”, “receipt Ved”)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search or type action command"
                  autoComplete="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear query"
                  >
                    <X size={16} />
                  </button>
                )}
                <span className="search-badge-esc">ESC</span>
              </div>

              {/* Category Filter Pills (When data available and no parsed action) */}
              {!parsedAction.intent && data && data.total > 0 && availableCategories.length > 1 && (
                <div className="category-pills-bar">
                  <button
                    type="button"
                    className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('all')}
                  >
                    All ({data.total})
                  </button>
                  {availableCategories.map((cat) => {
                    const count = data.categoryCounts[cat] || 0
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {CATEGORY_LABELS[cat]} ({count})
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Results / Action Command Content */}
            <div className="search-modal-body" ref={listRef}>
              {error && (
                <div className="search-feedback-box error">
                  <p>{error}</p>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  FEATURE A: NATURAL LANGUAGE & ACTION COMMANDS
                  ───────────────────────────────────────────────────────────── */}

              {/* 1. ENROLL CHILD ACTION CARD */}
              {parsedAction.intent === 'ENROLL_CHILD' && (
                <div className="p-4 m-3 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                        <Plus size={18} />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Enroll a Child</h4>
                        <p className="text-xs text-muted-foreground">
                          Create a new student record and allocate classroom
                        </p>
                      </div>
                    </div>
                    <span className="badge b-primary text-xs">Action Command</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-primary/20">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline text-xs"
                      onClick={() => setQuery('')}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      onClick={() => {
                        onClose()
                        router.push('/app/students?open=create')
                      }}
                    >
                      <span>Open Enrollment</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. ADD STAFF ACTION CARD */}
              {parsedAction.intent === 'ADD_STAFF' && (
                <div className="p-4 m-3 rounded-2xl border border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                        <UserCheck size={18} />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Add Staff User</h4>
                        <p className="text-xs text-muted-foreground">
                          Register a new teacher, assistant, or campus administrator
                        </p>
                      </div>
                    </div>
                    <span className="badge b-info text-xs">Action Command</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-sky-200 dark:border-sky-800">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline text-xs"
                      onClick={() => setQuery('')}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      onClick={() => {
                        onClose()
                        router.push('/app/users/staff?open=add')
                      }}
                    >
                      <span>Open Staff Registration</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. FAST ROLL CALL ACTION CARD */}
              {parsedAction.intent === 'FAST_ROLL_CALL' && (
                <div className="p-4 m-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Fast Roll Call</h4>
                        <p className="text-xs text-muted-foreground">
                          Open touch-friendly rapid classroom attendance workspace
                        </p>
                      </div>
                    </div>
                    <span className="badge b-warning text-xs">Action Command</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-amber-200 dark:border-amber-800">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline text-xs"
                      onClick={() => setQuery('')}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      onClick={() => {
                        onClose()
                        router.push('/app/daily-diary?tab=attendance&fastRollCall=true')
                      }}
                    >
                      <span>Start Fast Roll Call</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* 4. CONTACT GUARDIAN (CALL / WHATSAPP) RESOLVER & DISAMBIGUATION */}
              {parsedAction.intent === 'CONTACT_GUARDIAN' && (
                <div className="p-4 m-3 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                        {parsedAction.contactMethod === 'whatsapp' ? (
                          <MessageCircle size={16} />
                        ) : (
                          <Phone size={16} />
                        )}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          Contact Guardian • {parsedAction.target}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Resolving authorized contacts for matching student records...
                        </p>
                      </div>
                    </div>
                    <span className="badge b-success text-xs font-semibold">
                      {parsedAction.contactMethod?.toUpperCase()}
                    </span>
                  </div>

                  {actionLoading ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span>Resolving student & authorized guardian...</span>
                    </div>
                  ) : actionStudents.length === 0 ? (
                    <div className="py-4 text-xs text-muted-foreground text-center">
                      <p className="font-semibold text-foreground">
                        No student found matching “{parsedAction.target}”
                      </p>
                      <p className="mt-1">
                        Try searching with full name or admission number.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      {actionStudents.length > 1 && (
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Multiple students found — select authorized guardian:
                        </p>
                      )}

                      {actionStudents.map((st: any) => {
                        const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name
                        const guardianLink = (st.guardians || []).find((g: any) => g.isPrimary) || (st.guardians || [])[0]
                        const guardian = guardianLink?.guardian
                        const relationship = guardianLink?.relationship || 'Guardian'
                        const phone = guardian?.phone
                        const cleanPhone = cleanPhoneForWhatsApp(phone)

                        return (
                          <div
                            key={st.id}
                            className="p-3 rounded-xl border border-border/70 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={fullName} src={st.photoUrl} size="md" />
                              <div>
                                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                  <span>{fullName}</span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {st.admissionNo}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Class: {st.currentClassroom?.name || 'Classroom'} • Guardian:{' '}
                                  <b className="text-foreground">{guardian?.fullName || 'Not recorded'}</b>{' '}
                                  ({relationship})
                                </div>
                              </div>
                            </div>

                            {/* Contact Action Buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {phone ? (
                                <>
                                  <a
                                    href={`tel:${phone}`}
                                    className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
                                    title={`Call ${guardian?.fullName}`}
                                  >
                                    <Phone size={13} className="text-emerald-500" />
                                    <span>Call</span>
                                  </a>

                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/${cleanPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline flex items-center gap-1.5 text-xs text-foreground"
                                      title="Open WhatsApp chat"
                                    >
                                      <MessageCircle size={13} className="text-emerald-600" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  No phone on record
                                </span>
                              )}

                              <button
                                type="button"
                                className="btn btn-sm btn-ghost text-xs flex items-center gap-1"
                                onClick={() => handleInspect('students', st.id, st)}
                                title="Inspect Student Side-Peek"
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 5. RECEIPT RESOLVER & FINANCIAL SAFEGUARD */}
              {parsedAction.intent === 'VIEW_RECEIPT' && (
                <div className="p-4 m-3 rounded-2xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                        <Printer size={16} />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          Fee Receipts • {parsedAction.target}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Resolving verified payment transactions for student...
                        </p>
                      </div>
                    </div>
                    <span className="badge b-primary text-xs font-semibold">FINANCIAL RECEIPT</span>
                  </div>

                  {actionLoading ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span>Verifying payments & receipts...</span>
                    </div>
                  ) : actionStudents.length === 0 ? (
                    <div className="py-4 text-xs text-muted-foreground text-center">
                      <p className="font-semibold text-foreground">
                        No student found matching “{parsedAction.target}”
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {actionStudents.map((st: any) => {
                        const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.name
                        const invoices = st.invoices || []
                        const payments = invoices.flatMap((inv: any) => inv.payments || [])

                        return (
                          <div key={st.id} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-foreground">
                                {fullName} ({st.admissionNo})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {payments.length} verified payment{payments.length === 1 ? '' : 's'}
                              </span>
                            </div>

                            {payments.length === 0 ? (
                              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>No successful payment records on file. Official receipts cannot be generated without confirmed payment.</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5 pt-1">
                                {payments.map((p: any, i: number) => (
                                  <div
                                    key={p.id || i}
                                    className="p-2 rounded-lg bg-card border border-border/50 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-foreground tabular-nums">
                                        {inr(p.amountCents || 0)}
                                      </span>
                                      <span className="text-muted-foreground ml-2">
                                        • {p.method} • {p.paymentDate ? fmtDate(p.paymentDate) : 'Paid'}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline text-xs flex items-center gap-1.5"
                                      onClick={() => {
                                        const recId = p.receipt?.id || p.id
                                        window.open(`/api/v1/receipts/${recId}`, '_blank')
                                      }}
                                    >
                                      <Printer size={12} className="text-primary" />
                                      <span>Print Receipt</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Commands (">" prefix) */}
              {commandMode && (
                <div className="search-section">
                  <div className="search-section-head">
                    <span className="search-section-label">
                      <Command size={13} /> Commands
                    </span>
                    {filteredCommands.length > 0 && (
                      <span className="search-section-count">{filteredCommands.length}</span>
                    )}
                  </div>
                  {filteredCommands.length === 0 && (
                    <div className="search-empty-state compact">
                      <p className="no-results-title">No command found</p>
                      <p className="no-results-desc">
                        Try “Enroll a Child”, “Fast Roll Call”, or a module name.
                      </p>
                    </div>
                  )}
                  {filteredCommands.map((cmd: CommandItem, idx: number) => {
                    const Icon = cmd.icon
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={cmd.key}
                        className={`search-result-row search-command-row ${isSelected ? 'selected' : ''}`}
                        data-sel={isSelected ? '' : undefined}
                        onClick={() => {
                          pushRecent({ label: cmd.label, hint: cmd.hint, href: cmd.href })
                          onClose()
                          router.push(cmd.href)
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="result-category-icon command">
                          <Icon size={18} />
                        </div>
                        <div className="result-info">
                          <div className="result-title-row">
                            <span className="result-title">{cmd.label}</span>
                            <span className="result-category-label">{cmd.hint}</span>
                          </div>
                          {cmd.href.includes('?') && (
                            <span className="result-subtitle">
                              Direct action · {cmd.href.slice(cmd.href.indexOf('/app'))}
                            </span>
                          )}
                        </div>
                        <div className="result-arrow">
                          {isSelected ? (
                            <span className="enter-key-indicator">
                              <CornerDownLeft size={13} />
                            </span>
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Recents (empty query) */}
              {!commandMode && !trimmedQuery && recents.length > 0 && (
                <div className="search-section">
                  <div className="search-section-head">
                    <span className="search-section-label">
                      <History size={13} /> Recent Searches
                    </span>
                    <button
                      type="button"
                      className="search-section-clear"
                      onClick={clearRecents}
                      aria-label="Clear recent searches"
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  </div>
                  {recents.map((rec: RecentItem, idx: number) => {
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={rec.href}
                        className={`search-result-row ${isSelected ? 'selected' : ''}`}
                        data-sel={isSelected ? '' : undefined}
                        onClick={() => {
                          onClose()
                          router.push(rec.href)
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="result-category-icon recent">
                          <History size={16} />
                        </div>
                        <div className="result-info">
                          <div className="result-title-row">
                            <span className="result-title">{rec.label}</span>
                            <span className="result-category-label">{rec.hint}</span>
                          </div>
                        </div>
                        <div className="result-arrow">
                          {isSelected ? (
                            <span className="enter-key-indicator">
                              <CornerDownLeft size={13} />
                            </span>
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Empty state hints */}
              {!commandMode && !trimmedQuery && (
                <div className="search-empty-state">
                  <div className="search-empty-icon">
                    <Sparkles size={28} />
                  </div>
                  <h4>Universal Action Search</h4>
                  <p>Search records or trigger direct preschool operations instantly.</p>
                  <div className="search-hints-grid">
                    <div className="search-hint-item" onClick={() => setQuery('add student')}>
                      <span className="hint-tag">Action</span> “add student”
                    </div>
                    <div className="search-hint-item" onClick={() => setQuery('roll call')}>
                      <span className="hint-tag">Attendance</span> “roll call”
                    </div>
                    <div className="search-hint-item" onClick={() => setQuery('call ')}>
                      <span className="hint-tag">Contact</span> “call [Student]”
                    </div>
                    <div className="search-hint-item" onClick={() => setQuery('receipt ')}>
                      <span className="hint-tag">Finance</span> “receipt [Student]”
                    </div>
                  </div>
                </div>
              )}

              {/* No matching results state */}
              {!commandMode && trimmedQuery && !loading && !parsedAction.intent && results.length === 0 && (
                <div className="search-empty-state">
                  <p className="no-results-title">No matching records found</p>
                  <p className="no-results-desc">
                    No results match “<strong>{trimmedQuery}</strong>” within your authorized access scope.
                  </p>
                </div>
              )}

              {/* Standard Categorized Results */}
              {!parsedAction.intent && results.length > 0 &&
                results.map((item: SearchResultItem, idx: number) => {
                  const Icon = CATEGORY_ICONS[item.category] || GraduationCap
                  const isSelected = idx === selectedIndex
                  const isInspectable = ['students', 'staff', 'finance'].includes(item.category)

                  return (
                    <div
                      key={item.id}
                      className={`search-result-row ${isSelected ? 'selected' : ''}`}
                      data-sel={isSelected ? '' : undefined}
                      onClick={() => {
                        pushRecent({
                          label: item.title,
                          hint: CATEGORY_LABELS[item.category],
                          href: item.actionUrl,
                        })
                        onClose()
                        router.push(item.actionUrl)
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={`result-category-icon ${item.category}`}>
                        <Icon size={18} />
                      </div>
                      <div className="result-info">
                        <div className="result-title-row">
                          <span className="result-title">{item.title}</span>
                          {item.badge && <StatusBadge status={item.badge} size="sm" />}
                          <span className="result-category-label">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                        </div>
                        {item.subtitle && (
                          <span className="result-subtitle">{item.subtitle}</span>
                        )}
                      </div>

                      {/* Quick Inspect Side-Peek Action Button */}
                      {isInspectable && (
                        <button
                          type="button"
                          className="px-2 py-1 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/20 shrink-0 mr-1 transition-colors flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInspect(item.category, item.id)
                          }}
                          title="Open Side-Peek Inspector"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      )}

                      <div className="result-arrow">
                        {isSelected ? (
                          <span className="enter-key-indicator">
                            <CornerDownLeft size={13} />
                          </span>
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Modal Keyboard Footer */}
            <div className="search-modal-footer">
              <div className="keyboard-shortcuts-hint">
                <span className="shortcut-item">
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> Navigate
                </span>
                <span className="shortcut-item">
                  <kbd>↵</kbd> Select
                </span>
                <span className="shortcut-item">
                  <kbd>esc</kbd> Close
                </span>
              </div>
              <div className="search-footer-tagline">PreOne OS • Operational Ergonomics</div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Side-Peek Inspector Drawer */}
      <RecordInspector
        open={Boolean(inspectingRecord)}
        onClose={() => setInspectingRecord(null)}
        type={inspectingRecord?.type || 'student'}
        recordId={inspectingRecord?.id}
        initialData={inspectingRecord?.data}
      />
    </>
  )
}