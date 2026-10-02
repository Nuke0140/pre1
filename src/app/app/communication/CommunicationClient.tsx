'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import {
  Megaphone,
  Plus,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  Users,
  School,
  Send,
  Edit3,
  Trash2,
  XCircle,
  Search,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  FileText,
  Calendar,
  Building,
} from 'lucide-react'
import { PageHead, StatusBadge, EmptyState, Skeleton } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { timeAgo, enumLabel, fmtDate } from '@/lib/format'
import { Role, can } from '@/lib/auth'
import { normalizeRole } from '@/lib/roles'

export interface SessionProps {
  uid: string
  email: string
  name: string
  role: Role
  roles?: Role[]
  tenantId: string | null
  branchId: string | null
}

export interface Announcement {
  id: string
  tenantId: string
  branchId: string | null
  classroomId: string | null
  title: string
  body: string
  type: 'GENERAL' | 'HOLIDAY' | 'EMERGENCY' | 'EVENT' | 'ACHIEVEMENT' | 'IMPORTANT' | 'FEE_REMINDER' | 'ACADEMIC'
  audience: 'SCHOOL_WIDE' | 'ALL_PARENTS' | 'CLASS_PARENTS' | 'ALL_STAFF' | 'BRANCH_PARENTS'
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  authorId: string | null
  authorName?: string | null
  classroomName?: string | null
  publishedAt: string
  createdAt: string
  updatedAt?: string
}

interface ClassroomOption {
  id: string
  name: string
  code?: string
  programName?: string | null
}

const TYPE_OPTIONS: { value: Announcement['type']; label: string }[] = [
  { value: 'GENERAL', label: 'General update' },
  { value: 'HOLIDAY', label: 'Holiday notice' },
  { value: 'EMERGENCY', label: 'Emergency alert' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'IMPORTANT', label: 'Important notice' },
  { value: 'FEE_REMINDER', label: 'Fee reminder' },
  { value: 'ACADEMIC', label: 'Academic update' },
]

const AUDIENCE_OPTIONS: { value: Announcement['audience']; label: string }[] = [
  { value: 'SCHOOL_WIDE', label: 'Entire school community' },
  { value: 'ALL_PARENTS', label: 'All parents' },
  { value: 'CLASS_PARENTS', label: 'Parents of a specific class' },
  { value: 'ALL_STAFF', label: 'All staff' },
  { value: 'BRANCH_PARENTS', label: 'Parents at this branch' },
]

type StatusTab = 'PUBLISHED' | 'DRAFT' | 'CANCELLED'

export function CommunicationClient({ session }: { session: SessionProps }) {
  const toast = useToast()

  const effectiveRoles = useMemo(() => {
    const list = [session.role, ...(session.roles || [])].filter(Boolean)
    return Array.from(new Set(list)).map(normalizeRole)
  }, [session.role, session.roles])

  const canBroadcast = can(effectiveRoles, 'communication:broadcast') || can(effectiveRoles, 'communication:write')

  // Feed & Filter States
  const [items, setItems] = useState<Announcement[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StatusTab>('PUBLISHED')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedAudience, setSelectedAudience] = useState<string>('ALL')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  // Debounce search query to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Counts metadata
  const [counts, setCounts] = useState<{ published: number; drafts: number; cancelled: number }>({
    published: 0,
    drafts: 0,
    cancelled: 0,
  })

  // Selected announcement for Split View
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // Composer Modal States (Create)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerBusy, setComposerBusy] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formType, setFormType] = useState<Announcement['type']>('GENERAL')
  const [formAudience, setFormAudience] = useState<Announcement['audience']>('SCHOOL_WIDE')
  const [formClassroomId, setFormClassroomId] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(false)

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editBusy, setEditBusy] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editType, setEditType] = useState<Announcement['type']>('GENERAL')
  const [editAudience, setEditAudience] = useState<Announcement['audience']>('SCHOOL_WIDE')
  const [editClassroomId, setEditClassroomId] = useState('')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const [editEmergencyConfirmed, setEditEmergencyConfirmed] = useState(false)

  // Cancel Confirmation Modal States
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelTargetTitle, setCancelTargetTitle] = useState('')
  const [cancelBusy, setCancelBusy] = useState(false)

  // Discard Draft Modal States
  const [discardModalOpen, setDiscardModalOpen] = useState(false)
  const [discardTargetId, setDiscardTargetId] = useState<string | null>(null)
  const [discardTargetTitle, setDiscardTargetTitle] = useState('')
  const [discardBusy, setDiscardBusy] = useState(false)

  // Classrooms for Class Targeting
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [classroomsLoading, setClassroomsLoading] = useState(false)
  const [classroomsError, setClassroomsError] = useState<string | null>(null)

  // Load classrooms when needed
  const loadClassrooms = useCallback(async () => {
    if (classrooms.length > 0) return
    setClassroomsLoading(true)
    setClassroomsError(null)
    try {
      const res = await fetch('/api/v1/classrooms')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setClassrooms(json.data)
      } else {
        setClassroomsError(json.error?.message || 'Unable to load classrooms')
      }
    } catch (e: any) {
      setClassroomsError(e?.message || 'Network error loading classrooms')
    } finally {
      setClassroomsLoading(false)
    }
  }, [classrooms.length])

  // Fetch announcements with current filters & pagination
  const loadAnnouncements = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setError(null)
      }
      try {
        const params = new URLSearchParams()
        params.set('status', activeTab)
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
        if (selectedType !== 'ALL') params.set('type', selectedType)
        if (selectedAudience !== 'ALL') params.set('audience', selectedAudience)
        params.set('sort', sortOrder)
        params.set('page', String(targetPage))
        params.set('limit', '50')

        const res = await fetch(`/api/v1/announcements?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          if (append) {
            setItems((prev) => (prev ? [...prev, ...json.data] : json.data))
          } else {
            setItems(json.data)
          }
          setPage(targetPage)
          setHasMore(Boolean(json.meta?.hasMore))
          if (json.meta?.counts) {
            setCounts({
              published: json.meta.counts.published ?? 0,
              drafts: json.meta.counts.drafts ?? 0,
              cancelled: json.meta.counts.cancelled ?? 0,
            })
          }
        } else {
          if (!append) setError(json.error?.message || 'Failed to fetch announcements')
        }
      } catch (e: any) {
        if (!append) setError(e?.message || 'Network error while loading announcements')
      } finally {
        if (append) {
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    },
    [activeTab, debouncedSearch, selectedType, selectedAudience, sortOrder]
  )

  useEffect(() => {
    loadAnnouncements(1, false)
  }, [loadAnnouncements])

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAnnouncements(page + 1, true)
    }
  }

  // Auto-select first item when items change if current selection is invalid
  useEffect(() => {
    if (items && items.length > 0) {
      if (!selectedId || !items.some((i) => i.id === selectedId)) {
        setSelectedId(items[0].id)
      }
    } else {
      setSelectedId(null)
    }
  }, [items, selectedId])

  // Currently selected announcement
  const selectedAnnouncement = useMemo(() => {
    if (!items || !selectedId) return null
    return items.find((i) => i.id === selectedId) || null
  }, [items, selectedId])

  // Open Composer
  const handleOpenComposer = () => {
    setFormTitle('')
    setFormBody('')
    setFormType('GENERAL')
    setFormAudience('SCHOOL_WIDE')
    setFormClassroomId('')
    setValidationError(null)
    setEmergencyConfirmed(false)
    loadClassrooms()
    setComposerOpen(true)
  }

  // Handle Create Submit (Publish or Save Draft)
  const handleSaveComposer = async (targetStatus: 'PUBLISHED' | 'DRAFT') => {
    setValidationError(null)
    const trimmedTitle = formTitle.trim()
    const trimmedBody = formBody.trim()

    if (!trimmedTitle) {
      setValidationError('Please enter an announcement title.')
      return
    }
    if (!trimmedBody) {
      setValidationError('Please enter a message body.')
      return
    }
    if (formAudience === 'CLASS_PARENTS' && !formClassroomId) {
      setValidationError('Please select a target classroom.')
      return
    }
    if (targetStatus === 'PUBLISHED' && formType === 'EMERGENCY' && !emergencyConfirmed) {
      setValidationError('Please check the confirmation box to authorize this Emergency Alert.')
      return
    }

    setComposerBusy(true)
    try {
      const res = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          body: trimmedBody,
          type: formType,
          audience: formAudience,
          classroomId: formAudience === 'CLASS_PARENTS' ? formClassroomId : undefined,
          status: targetStatus,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success(
          targetStatus === 'DRAFT' ? 'Draft saved' : 'Announcement published',
          targetStatus === 'DRAFT'
            ? 'Draft saved successfully in the Drafts tab'
            : formAudience === 'ALL_STAFF'
            ? 'Broadcast sent to all staff members'
            : 'Broadcast published to parent timelines and school feeds'
        )
        setComposerOpen(false)
        if (targetStatus === 'DRAFT' && activeTab !== 'DRAFT') {
          setActiveTab('DRAFT')
        } else if (targetStatus === 'PUBLISHED' && activeTab !== 'PUBLISHED') {
          setActiveTab('PUBLISHED')
        } else {
          loadAnnouncements()
        }
      } else {
        toast.error('Operation failed', json.error?.message || 'Could not save announcement')
        setValidationError(json.error?.message || 'Failed to process announcement.')
      }
    } catch (e: any) {
      toast.error('Network Error', e?.message || 'Could not connect to server')
      setValidationError(e?.message || 'A network error occurred.')
    } finally {
      setComposerBusy(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (ann: Announcement) => {
    setEditId(ann.id)
    setEditTitle(ann.title)
    setEditBody(ann.body)
    setEditType(ann.type)
    setEditAudience(ann.audience)
    setEditClassroomId(ann.classroomId || '')
    setEditValidationError(null)
    setEditEmergencyConfirmed(ann.type === 'EMERGENCY')
    loadClassrooms()
    setEditModalOpen(true)
  }

  // Handle Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    setEditValidationError(null)

    const trimmedTitle = editTitle.trim()
    const trimmedBody = editBody.trim()

    if (!trimmedTitle) {
      setEditValidationError('Please enter an announcement title.')
      return
    }
    if (!trimmedBody) {
      setEditValidationError('Please enter a message body.')
      return
    }
    if (editAudience === 'CLASS_PARENTS' && !editClassroomId) {
      setEditValidationError('Please select a target classroom.')
      return
    }
    if (editType === 'EMERGENCY' && !editEmergencyConfirmed) {
      setEditValidationError('Please check the confirmation box for Emergency Alert.')
      return
    }

    setEditBusy(true)
    try {
      const res = await fetch(`/api/v1/announcements/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          body: trimmedBody,
          type: editType,
          audience: editAudience,
          classroomId: editAudience === 'CLASS_PARENTS' ? editClassroomId : null,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Changes saved', 'Announcement updated successfully')
        setEditModalOpen(false)
        loadAnnouncements()
      } else {
        toast.error('Update failed', json.error?.message || 'Could not update announcement')
        setEditValidationError(json.error?.message || 'Failed to update announcement.')
      }
    } catch (e: any) {
      toast.error('Network Error', e?.message || 'Could not connect to server')
      setEditValidationError(e?.message || 'A network error occurred.')
    } finally {
      setEditBusy(false)
    }
  }

  // Publish Draft Directly
  const handlePublishDraft = async (ann: Announcement) => {
    if (publishingId) return
    setPublishingId(ann.id)
    try {
      const res = await fetch(`/api/v1/announcements/${ann.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PUBLISH' }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Announcement published', `"${ann.title}" is now published and active`)
        setActiveTab('PUBLISHED')
      } else {
        toast.error('Publishing failed', json.error?.message || 'Could not publish draft')
      }
    } catch (e: any) {
      toast.error('Network Error', e?.message || 'Could not connect to server')
    } finally {
      setPublishingId(null)
    }
  }

  // Open Cancel Modal
  const handleOpenCancel = (ann: Announcement) => {
    setCancelTargetId(ann.id)
    setCancelTargetTitle(ann.title)
    setCancelModalOpen(true)
  }

  // Confirm Cancel Notice
  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return
    setCancelBusy(true)
    try {
      const res = await fetch(`/api/v1/announcements/${cancelTargetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Notice cancelled', 'Announcement has been marked as cancelled')
        setCancelModalOpen(false)
        loadAnnouncements()
      } else {
        toast.error('Failed to cancel', json.error?.message || 'Could not cancel notice')
      }
    } catch (e: any) {
      toast.error('Network Error', e?.message || 'Could not connect to server')
    } finally {
      setCancelBusy(false)
    }
  }

  // Open Discard Draft Modal
  const handleOpenDiscard = (ann: Announcement) => {
    setDiscardTargetId(ann.id)
    setDiscardTargetTitle(ann.title)
    setDiscardModalOpen(true)
  }

  // Confirm Discard Draft
  const handleConfirmDiscard = async () => {
    if (!discardTargetId) return
    setDiscardBusy(true)
    try {
      const res = await fetch(`/api/v1/announcements/${discardTargetId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Draft discarded', 'Unpublished draft has been deleted')
        setDiscardModalOpen(false)
        if (selectedId === discardTargetId) {
          setSelectedId(null)
        }
        loadAnnouncements()
      } else {
        toast.error('Failed to discard', json.error?.message || 'Could not discard draft')
      }
    } catch (e: any) {
      toast.error('Network Error', e?.message || 'Could not connect to server')
    } finally {
      setDiscardBusy(false)
    }
  }

  const getAudienceLabel = (aud: Announcement['audience'], classroomId: string | null, classroomName?: string | null) => {
    if (aud === 'CLASS_PARENTS') {
      if (classroomName) return `Class: ${classroomName}`
      const match = classrooms.find((c) => c.id === classroomId)
      return match ? `Class: ${match.name}` : 'Specific class'
    }
    const opt = AUDIENCE_OPTIONS.find((o) => o.value === aud)
    return opt ? opt.label : enumLabel(aud)
  }

  return (
    <div className="page-container" style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
      {/* 1. Header with PageHead */}
      <PageHead
        title="Announcements"
        sub="Important notices, school circulars, holiday alerts, and communications."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-ghost"
              onClick={() => loadAnnouncements()}
              disabled={loading}
              title="Refresh announcements"
              aria-label="Refresh announcements"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
            {canBroadcast && (
              <button className="btn btn-primary" onClick={handleOpenComposer}>
                <Plus size={15} /> New Announcement
              </button>
            )}
          </div>
        }
      />

      {/* 2. Main Workspace Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 440px) 1fr',
          gap: 20,
          marginTop: 18,
          alignItems: 'start',
        }}
        className="announcements-split-grid"
      >
        {/* ============================================================== */}
        {/* LEFT COLUMN: Segmented Tabs, Filter Toolbar & Announcement List */}
        {/* ============================================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 0,
          }}
        >
          {/* Segmented Status Tabs (Only for staff who can view drafts/cancelled; parents only have Published) */}
          {canBroadcast && (
            <div
              style={{
                display: 'flex',
                background: 'var(--c-surface-hover, rgba(0,0,0,0.03))',
                padding: 4,
                borderRadius: 10,
                border: '1px solid var(--border-default, #e2e8f0)',
                gap: 4,
              }}
              role="tablist"
              aria-label="Filter notices by status"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'PUBLISHED'}
                onClick={() => setActiveTab('PUBLISHED')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: activeTab === 'PUBLISHED' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'PUBLISHED' ? 'var(--c-surface, #ffffff)' : 'transparent',
                  color: activeTab === 'PUBLISHED' ? 'var(--primary, #7c3aed)' : 'var(--c-text-muted, #64748b)',
                  boxShadow: activeTab === 'PUBLISHED' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Published</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background:
                      activeTab === 'PUBLISHED'
                        ? 'rgba(124, 58, 237, 0.12)'
                        : 'var(--c-surface-active, rgba(0,0,0,0.06))',
                    color: activeTab === 'PUBLISHED' ? 'var(--primary, #7c3aed)' : 'var(--c-text-muted)',
                  }}
                >
                  {counts.published}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'DRAFT'}
                onClick={() => setActiveTab('DRAFT')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: activeTab === 'DRAFT' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'DRAFT' ? 'var(--c-surface, #ffffff)' : 'transparent',
                  color: activeTab === 'DRAFT' ? 'var(--primary, #7c3aed)' : 'var(--c-text-muted, #64748b)',
                  boxShadow: activeTab === 'DRAFT' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Drafts</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background:
                      activeTab === 'DRAFT'
                        ? 'rgba(124, 58, 237, 0.12)'
                        : 'var(--c-surface-active, rgba(0,0,0,0.06))',
                    color: activeTab === 'DRAFT' ? 'var(--primary, #7c3aed)' : 'var(--c-text-muted)',
                  }}
                >
                  {counts.drafts}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'CANCELLED'}
                onClick={() => setActiveTab('CANCELLED')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: activeTab === 'CANCELLED' ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'CANCELLED' ? 'var(--c-surface, #ffffff)' : 'transparent',
                  color: activeTab === 'CANCELLED' ? 'var(--primary, #7c3aed)' : 'var(--c-text-muted, #64748b)',
                  boxShadow: activeTab === 'CANCELLED' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Cancelled</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background:
                      activeTab === 'CANCELLED'
                        ? 'rgba(124, 58, 237, 0.12)'
                        : 'var(--c-surface-active, rgba(0,0,0,0.06))',
                    color: activeTab === 'CANCELLED' ? 'var(--primary, #7c3aed)' : 'var(--c-text-muted)',
                  }}
                >
                  {counts.cancelled}
                </span>
              </button>
            </div>
          )}

          {/* Search & Filter Card */}
          <div
            className="card"
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: 'var(--c-surface, #ffffff)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--c-text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="input"
                style={{
                  paddingLeft: 34,
                  paddingRight: searchQuery ? 30 : 10,
                  height: 36,
                  fontSize: 13,
                  width: '100%',
                }}
                placeholder="Search title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: 'var(--c-text-muted)',
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <select
                  className="select"
                  style={{ height: 32, fontSize: 12, padding: '2px 8px' }}
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  aria-label="Filter by type"
                >
                  <option value="ALL">All Categories</option>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className="select"
                  style={{ height: 32, fontSize: 12, padding: '2px 8px' }}
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                  aria-label="Filter by audience"
                >
                  <option value="ALL">All Audiences</option>
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span className="t-caption" style={{ color: 'var(--c-text-muted)' }}>
                {items ? `${items.length} ${items.length === 1 ? 'notice' : 'notices'}` : 'Loading...'}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                style={{ fontSize: 11.5, padding: '2px 6px', height: 26 }}
              >
                Sort: {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && items === null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ marginBottom: 8 }}><Skeleton h={16} w="60%" /></div>
                  <div style={{ marginBottom: 6 }}><Skeleton h={13} w="90%" /></div>
                  <Skeleton h={12} w="40%" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <AlertTriangle size={24} style={{ color: 'var(--c-urgent)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>Failed to load notices</div>
              <p className="t-caption" style={{ color: 'var(--c-text-muted)', margin: '4px 0 12px' }}>
                {error}
              </p>
              <button className="btn btn-secondary btn-sm" onClick={() => loadAnnouncements()}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && items?.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <EmptyState
                icon={<Megaphone size={32} />}
                title={
                  activeTab === 'DRAFT'
                    ? 'No drafts found'
                    : activeTab === 'CANCELLED'
                    ? 'No cancelled notices'
                    : 'No announcements found'
                }
                message={
                  activeTab === 'DRAFT'
                    ? 'Create a new announcement and click "Save Draft" to edit it later.'
                    : activeTab === 'CANCELLED'
                    ? 'Cancelled notices will appear here for audit history.'
                    : searchQuery || selectedType !== 'ALL' || selectedAudience !== 'ALL'
                    ? 'No announcements match your search or filter criteria.'
                    : 'Share important notices with parents and staff.'
                }
                action={
                  searchQuery || selectedType !== 'ALL' || selectedAudience !== 'ALL' ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedType('ALL')
                        setSelectedAudience('ALL')
                      }}
                    >
                      Clear all filters
                    </button>
                  ) : canBroadcast && activeTab !== 'CANCELLED' ? (
                    <button className="btn btn-primary btn-sm" onClick={handleOpenComposer}>
                      <Plus size={14} /> New Announcement
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}

          {/* Compact Announcement Items List */}
          {!loading && !error && items && items.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 'calc(100vh - 220px)',
                overflowY: 'auto',
                paddingRight: 2,
              }}
            >
              {items.map((a) => {
                const isSelected = selectedId === a.id
                const isEmergency = a.type === 'EMERGENCY'
                const isImportant = a.type === 'IMPORTANT'

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedId(a.id)
                      setMobileDetailOpen(true)
                    }}
                    className="card card-hover"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderLeft: isEmergency
                        ? '4px solid var(--c-urgent, #ef4444)'
                        : isImportant
                        ? '4px solid var(--c-warning, #f59e0b)'
                        : isSelected
                        ? '4px solid var(--primary, #7c3aed)'
                        : '4px solid transparent',
                      background: isSelected
                        ? 'rgba(124, 58, 237, 0.04)'
                        : isEmergency
                        ? 'rgba(239, 68, 68, 0.02)'
                        : isImportant
                        ? 'rgba(245, 158, 11, 0.02)'
                        : 'var(--c-surface, #ffffff)',
                      borderColor: isSelected ? 'var(--primary, #7c3aed)' : undefined,
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {/* Header Row: Category Badge + Status / Priority */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StatusBadge status={a.type} />
                      </div>

                      <span className="t-caption" style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                        {timeAgo(a.publishedAt || a.createdAt)}
                      </span>
                    </div>

                    {/* Announcement Title */}
                    <h4
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        margin: '0 0 4px 0',
                        color: 'var(--c-text)',
                        lineHeight: 1.35,
                      }}
                    >
                      {a.title}
                    </h4>

                    {/* Preview snippet */}
                    <p
                      className="t-caption"
                      style={{
                        margin: '0 0 8px 0',
                        color: 'var(--c-text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      {a.body}
                    </p>

                    {/* Footer Row: Audience Pill & Status */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--c-text-muted)',
                        }}
                      >
                        {a.audience === 'ALL_STAFF' ? (
                          <Users size={12} />
                        ) : a.audience === 'CLASS_PARENTS' ? (
                          <School size={12} />
                        ) : (
                          <Users size={12} />
                        )}
                        {getAudienceLabel(a.audience, a.classroomId, a.classroomName)}
                      </span>

                      {a.status === 'DRAFT' && (
                        <span className="badge b-pending" style={{ fontSize: 10 }}>
                          Draft
                        </span>
                      )}
                      {a.status === 'CANCELLED' && (
                        <span className="badge b-urgent" style={{ fontSize: 10 }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Load More Button */}
              {hasMore && (
                <div style={{ textAlign: 'center', paddingTop: 6, paddingBottom: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                  >
                    {loadingMore ? <RefreshCw size={13} className="animate-spin" /> : null}
                    {loadingMore ? 'Loading older notices...' : 'Load more announcements'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Desktop Sticky Detail Panel */}
        {/* ============================================================== */}
        <div
          className={`announcements-detail-panel ${mobileDetailOpen ? 'mobile-open' : ''}`}
          style={{
            position: 'sticky',
            top: 20,
            minWidth: 0,
          }}
        >
          {selectedAnnouncement ? (
            <div
              className="card"
              style={{
                padding: '24px 28px',
                background: 'var(--c-surface, #ffffff)',
                borderTop:
                  selectedAnnouncement.type === 'EMERGENCY'
                    ? '4px solid var(--c-urgent, #ef4444)'
                    : selectedAnnouncement.type === 'IMPORTANT'
                    ? '4px solid var(--c-warning, #f59e0b)'
                    : undefined,
              }}
            >
              {/* Mobile Back Button */}
              <div className="mobile-only-header" style={{ display: 'none', marginBottom: 14 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMobileDetailOpen(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 0 }}
                >
                  <ArrowLeft size={16} /> Back to all notices
                </button>
              </div>

              {/* Priority Banner for Emergency / Important */}
              {selectedAnnouncement.type === 'EMERGENCY' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: 'var(--c-urgent, #ef4444)',
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={18} style={{ flex: 'none' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 13 }}>HIGH PRIORITY EMERGENCY ALERT</strong>
                    <span style={{ fontSize: 12 }}>
                      Immediate broadcast dispatched across school emergency communication channels.
                    </span>
                  </div>
                </div>
              )}

              {selectedAnnouncement.type === 'IMPORTANT' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: 'var(--c-warning, #b45309)',
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertOctagon size={18} style={{ flex: 'none' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 13 }}>IMPORTANT SCHOOL NOTICE</strong>
                    <span style={{ fontSize: 12 }}>Mandatory reading for designated recipients.</span>
                  </div>
                </div>
              )}

              {/* Status Banner for Cancelled */}
              {selectedAnnouncement.status === 'CANCELLED' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--c-urgent, #b91c1c)',
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <XCircle size={18} style={{ flex: 'none' }} />
                  <span>
                    <strong>This announcement was cancelled.</strong> It is archived for preschool compliance and audit
                    records.
                  </span>
                </div>
              )}

              {/* Status Banner for Draft */}
              {selectedAnnouncement.status === 'DRAFT' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(124, 58, 237, 0.06)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    color: 'var(--primary, #6d28d9)',
                    fontSize: 13,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FileText size={18} style={{ flex: 'none' }} />
                  <span>
                    <strong>Draft Notice.</strong> This announcement is private and has not been broadcast to parents or
                    staff yet.
                  </span>
                </div>
              )}

              {/* Detail Header: Metadata Badges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge status={selectedAnnouncement.type} />
                  <span
                    className="badge b-neutral"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                    }}
                  >
                    {selectedAnnouncement.audience === 'ALL_STAFF' ? (
                      <Users size={12} />
                    ) : selectedAnnouncement.audience === 'CLASS_PARENTS' ? (
                      <School size={12} />
                    ) : (
                      <Users size={12} />
                    )}
                    {getAudienceLabel(
                      selectedAnnouncement.audience,
                      selectedAnnouncement.classroomId,
                      selectedAnnouncement.classroomName
                    )}
                  </span>

                  {selectedAnnouncement.status === 'PUBLISHED' && (
                    <span className="badge b-active" style={{ fontSize: 11, display: 'inline-flex', gap: 4 }}>
                      <CheckCircle2 size={11} /> Published
                    </span>
                  )}
                  {selectedAnnouncement.status === 'DRAFT' && (
                    <span className="badge b-pending" style={{ fontSize: 11, display: 'inline-flex', gap: 4 }}>
                      <Clock size={11} /> Draft
                    </span>
                  )}
                  {selectedAnnouncement.status === 'CANCELLED' && (
                    <span className="badge b-urgent" style={{ fontSize: 11, display: 'inline-flex', gap: 4 }}>
                      <XCircle size={11} /> Cancelled
                    </span>
                  )}
                </div>

                <div className="t-caption" style={{ color: 'var(--c-text-muted)' }}>
                  {fmtDate(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt)}
                </div>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--c-text)',
                  margin: '0 0 12px 0',
                  lineHeight: 1.3,
                }}
              >
                {selectedAnnouncement.title}
              </h2>

              {/* Attribution and Scoping Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 12.5,
                  color: 'var(--c-text-muted)',
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--border-default, #e2e8f0)',
                  marginBottom: 18,
                }}
              >
                <span>
                  By <strong>{selectedAnnouncement.authorName || 'School Staff'}</strong>
                </span>
                {selectedAnnouncement.classroomName && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <School size={13} /> Class: <strong>{selectedAnnouncement.classroomName}</strong>
                  </span>
                )}
              </div>

              {/* Action Toolbar for Authorized Users */}
              {canBroadcast && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                    border: '1px solid var(--border-default, #e2e8f0)',
                  }}
                >
                  {selectedAnnouncement.status === 'DRAFT' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={publishingId === selectedAnnouncement.id}
                        onClick={() => handlePublishDraft(selectedAnnouncement)}
                      >
                        {publishingId === selectedAnnouncement.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        {publishingId === selectedAnnouncement.id ? 'Publishing...' : 'Publish Now'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(selectedAnnouncement)}
                      >
                        <Edit3 size={13} /> Edit Draft
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--c-urgent)', marginLeft: 'auto' }}
                        onClick={() => handleOpenDiscard(selectedAnnouncement)}
                      >
                        <Trash2 size={13} /> Discard Draft
                      </button>
                    </>
                  )}

                  {selectedAnnouncement.status === 'PUBLISHED' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(selectedAnnouncement)}
                      >
                        <Edit3 size={13} /> Edit Notice
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--c-urgent)', marginLeft: 'auto' }}
                        onClick={() => handleOpenCancel(selectedAnnouncement)}
                      >
                        <XCircle size={13} /> Cancel Notice
                      </button>
                    </>
                  )}

                  {selectedAnnouncement.status === 'CANCELLED' && (
                    <span className="t-caption" style={{ color: 'var(--c-text-muted)' }}>
                      Archived record. No further actions permitted.
                    </span>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.7,
                  color: 'var(--c-text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {selectedAnnouncement.body}
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                background: 'var(--c-surface, #ffffff)',
              }}
            >
              <Megaphone size={40} style={{ color: 'var(--c-text-muted)', margin: '0 auto 12px', opacity: 0.6 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0' }}>Select an announcement</h3>
              <p className="t-body" style={{ color: 'var(--c-text-muted)', margin: 0 }}>
                Choose a circular or notice from the list to view its full message, target audience, and details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. Composer Modal (Create Announcement / Save Draft) */}
      {/* ============================================================== */}
      {canBroadcast && (
        <Modal
          open={composerOpen}
          onClose={() => {
            if (!composerBusy) setComposerOpen(false)
          }}
          title="New Announcement"
          subtitle="Broadcast notices to parents and staff across your school"
          icon={<Megaphone size={22} />}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSaveComposer('PUBLISHED')
            }}
          >
            {validationError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--c-urgent, #ef4444)',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={15} style={{ flex: 'none' }} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Title */}
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                Announcement title <span className="req">*</span>
              </label>
              <input
                className="input"
                value={formTitle}
                onChange={(e) => {
                  setFormTitle(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                required
                placeholder="e.g. Annual Sports Day & Parent Orientation"
                disabled={composerBusy}
              />
            </div>

            {/* Message Body */}
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                Message <span className="req">*</span>
              </label>
              <textarea
                className="textarea"
                rows={5}
                value={formBody}
                onChange={(e) => {
                  setFormBody(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                required
                placeholder="Write the announcement details here. Line breaks and paragraphs are preserved..."
                disabled={composerBusy}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Type and Audience Grid */}
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="field">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                  Announcement type
                </label>
                <select
                  className="select"
                  value={formType}
                  onChange={(e) => {
                    setFormType(e.target.value as Announcement['type'])
                    if (e.target.value !== 'EMERGENCY') {
                      setEmergencyConfirmed(false)
                    }
                  }}
                  disabled={composerBusy}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                  Audience
                </label>
                <select
                  className="select"
                  value={formAudience}
                  onChange={(e) => {
                    const val = e.target.value as Announcement['audience']
                    setFormAudience(val)
                    if (val !== 'CLASS_PARENTS') setFormClassroomId('')
                    setValidationError(null)
                  }}
                  disabled={composerBusy}
                >
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Classroom Selector (CLASS_PARENTS) */}
            {formAudience === 'CLASS_PARENTS' && (
              <div
                className="field"
                style={{
                  marginBottom: 14,
                  padding: '12px 14px',
                  background: 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                  borderRadius: 8,
                  border: '1px solid var(--border-default, #e2e8f0)',
                }}
              >
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                  Select target classroom <span className="req">*</span>
                </label>
                {classroomsLoading && (
                  <div className="t-caption" style={{ padding: '6px 0' }}>
                    Loading classrooms...
                  </div>
                )}
                {classroomsError && (
                  <div className="t-caption" style={{ color: 'var(--c-urgent)', padding: '6px 0' }}>
                    {classroomsError}
                  </div>
                )}
                {!classroomsLoading && !classroomsError && classrooms.length === 0 && (
                  <div className="t-caption" style={{ color: 'var(--c-warning)', padding: '6px 0' }}>
                    No active classrooms found in this school.
                  </div>
                )}
                {!classroomsLoading && !classroomsError && classrooms.length > 0 && (
                  <select
                    className="select"
                    value={formClassroomId}
                    onChange={(e) => {
                      setFormClassroomId(e.target.value)
                      if (validationError) setValidationError(null)
                    }}
                    required
                    disabled={composerBusy}
                  >
                    <option value="">-- Choose a classroom --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.programName ? `(${c.programName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Emergency Alert Confirmation Guard */}
            {formType === 'EMERGENCY' && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ color: '#ef4444', flex: 'none', marginTop: 2 }} />
                  <div>
                    <b style={{ color: '#b91c1c', fontSize: 13 }}>Emergency Alert Notice:</b>
                    <p className="t-body" style={{ fontSize: 12, margin: '4px 0 8px 0', color: 'var(--c-text)' }}>
                      Emergency alerts immediately dispatch high-priority notifications across parent and staff channels.
                    </p>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={emergencyConfirmed}
                        onChange={(e) => {
                          setEmergencyConfirmed(e.target.checked)
                          if (validationError) setValidationError(null)
                        }}
                        disabled={composerBusy}
                      />
                      <span>I confirm this is an urgent emergency alert that requires immediate dispatch.</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Save Draft vs Publish */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setComposerOpen(false)}
                disabled={composerBusy}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSaveComposer('DRAFT')}
                  disabled={composerBusy}
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${composerBusy ? 'is-loading' : ''}`}
                  disabled={composerBusy}
                >
                  {composerBusy ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 4. Edit Announcement Modal */}
      {/* ============================================================== */}
      {canBroadcast && (
        <Modal
          open={editModalOpen}
          onClose={() => {
            if (!editBusy) setEditModalOpen(false)
          }}
          title="Edit Announcement"
          subtitle="Update notice details and target audience"
          icon={<Edit3 size={22} />}
          wide
        >
          <form onSubmit={handleSaveEdit}>
            {editValidationError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--c-urgent, #ef4444)',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={15} style={{ flex: 'none' }} />
                <span>{editValidationError}</span>
              </div>
            )}

            {/* Title */}
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                Announcement title <span className="req">*</span>
              </label>
              <input
                className="input"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value)
                  if (editValidationError) setEditValidationError(null)
                }}
                required
                disabled={editBusy}
              />
            </div>

            {/* Body */}
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                Message <span className="req">*</span>
              </label>
              <textarea
                className="textarea"
                rows={5}
                value={editBody}
                onChange={(e) => {
                  setEditBody(e.target.value)
                  if (editValidationError) setEditValidationError(null)
                }}
                required
                disabled={editBusy}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Type and Audience */}
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="field">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                  Announcement type
                </label>
                <select
                  className="select"
                  value={editType}
                  onChange={(e) => {
                    setEditType(e.target.value as Announcement['type'])
                    if (e.target.value !== 'EMERGENCY') {
                      setEditEmergencyConfirmed(false)
                    }
                  }}
                  disabled={editBusy}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                  Audience
                </label>
                <select
                  className="select"
                  value={editAudience}
                  onChange={(e) => {
                    const val = e.target.value as Announcement['audience']
                    setEditAudience(val)
                    if (val !== 'CLASS_PARENTS') setEditClassroomId('')
                    setEditValidationError(null)
                  }}
                  disabled={editBusy}
                >
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Classroom Selector (CLASS_PARENTS) */}
            {editAudience === 'CLASS_PARENTS' && (
              <div
                className="field"
                style={{
                  marginBottom: 14,
                  padding: '12px 14px',
                  background: 'var(--c-surface-hover, rgba(0,0,0,0.02))',
                  borderRadius: 8,
                  border: '1px solid var(--border-default, #e2e8f0)',
                }}
              >
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: 'block' }}>
                  Select target classroom <span className="req">*</span>
                </label>
                {classroomsLoading && (
                  <div className="t-caption" style={{ padding: '6px 0' }}>
                    Loading classrooms...
                  </div>
                )}
                {classroomsError && (
                  <div className="t-caption" style={{ color: 'var(--c-urgent)', padding: '6px 0' }}>
                    {classroomsError}
                  </div>
                )}
                {!classroomsLoading && !classroomsError && classrooms.length > 0 && (
                  <select
                    className="select"
                    value={editClassroomId}
                    onChange={(e) => {
                      setEditClassroomId(e.target.value)
                      if (editValidationError) setEditValidationError(null)
                    }}
                    required
                    disabled={editBusy}
                  >
                    <option value="">-- Choose a classroom --</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.programName ? `(${c.programName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Emergency Checkbox */}
            {editType === 'EMERGENCY' && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  marginBottom: 16,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editEmergencyConfirmed}
                    onChange={(e) => {
                      setEditEmergencyConfirmed(e.target.checked)
                      if (editValidationError) setEditValidationError(null)
                    }}
                    disabled={editBusy}
                  />
                  <span>I confirm this is an urgent emergency alert.</span>
                </label>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditModalOpen(false)}
                disabled={editBusy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${editBusy ? 'is-loading' : ''}`}
                disabled={editBusy}
              >
                {editBusy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 5. Cancel Notice Confirmation Modal */}
      {/* ============================================================== */}
      {canBroadcast && (
        <Modal
          open={cancelModalOpen}
          onClose={() => {
            if (!cancelBusy) setCancelModalOpen(false)
          }}
          title="Cancel Announcement?"
          subtitle="This will retract the notice for all recipients"
          icon={<XCircle size={22} style={{ color: 'var(--c-urgent)' }} />}
        >
          <div style={{ padding: '4px 0 16px' }}>
            <p className="t-body" style={{ margin: '0 0 12px 0' }}>
              Are you sure you want to cancel <strong>"{cancelTargetTitle}"</strong>?
            </p>
            <p className="t-caption" style={{ color: 'var(--c-text-muted)', margin: 0 }}>
              The announcement will be marked as cancelled and preserved in school audit logs. Parents and staff will see
              it as cancelled.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelBusy}
            >
              Keep Notice
            </button>
            <button
              type="button"
              className={`btn btn-danger ${cancelBusy ? 'is-loading' : ''}`}
              onClick={handleConfirmCancel}
              disabled={cancelBusy}
            >
              {cancelBusy ? 'Cancelling...' : 'Cancel Announcement'}
            </button>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 6. Discard Draft Confirmation Modal */}
      {/* ============================================================== */}
      {canBroadcast && (
        <Modal
          open={discardModalOpen}
          onClose={() => {
            if (!discardBusy) setDiscardModalOpen(false)
          }}
          title="Discard Draft?"
          subtitle="This action cannot be undone"
          icon={<Trash2 size={22} style={{ color: 'var(--c-urgent)' }} />}
        >
          <div style={{ padding: '4px 0 16px' }}>
            <p className="t-body" style={{ margin: '0 0 12px 0' }}>
              Are you sure you want to delete draft <strong>"{discardTargetTitle}"</strong>?
            </p>
            <p className="t-caption" style={{ color: 'var(--c-text-muted)', margin: 0 }}>
              This draft has not been published yet and will be permanently removed.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setDiscardModalOpen(false)}
              disabled={discardBusy}
            >
              Keep Draft
            </button>
            <button
              type="button"
              className={`btn btn-danger ${discardBusy ? 'is-loading' : ''}`}
              onClick={handleConfirmDiscard}
              disabled={discardBusy}
            >
              {discardBusy ? 'Discarding...' : 'Discard Draft'}
            </button>
          </div>
        </Modal>
      )}

      {/* Responsive Styles for Split Layout on Mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .announcements-split-grid {
            grid-template-columns: 1fr !important;
          }
          .announcements-detail-panel {
            display: none !important;
          }
          .announcements-detail-panel.mobile-open {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 1000 !important;
            background: var(--c-surface, #ffffff) !important;
            overflow-y: auto !important;
            padding: 16px !important;
          }
          .mobile-only-header {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
