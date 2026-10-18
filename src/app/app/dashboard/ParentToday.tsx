'use client'

import React, { useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Baby,
  AlertTriangle,
  Wallet,
  Sparkles,
  CalendarCheck,
  FileText,
  Eye,
  Download,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import { PageHead, Skeleton, Avatar, EmptyState, StatusBadge } from '@/components/preone/ui'
import { PdfViewerModal } from '@/components/preone/PdfViewerModal'
import { ParentDailyReportModal } from '@/components/daily-diary/ParentDailyReportModal'
import { inr, timeAgo } from '@/lib/format'

export interface ChildData {
  id: string
  name: string
  admissionNo: string
  photoUrl: string | null
  classroom: string | null
  teacher: string | null
  attendance: string | null
  todayCare: { type: string; title: string; body: string | null; mood: string | null; at: string }[]
  latestUpdate: { narrative: string; observedAt: string; category: string | null } | null
  feesDue: { invoiceNumber: string; dueDate: string; balanceCents: number; status: string }[]
  alerts: { title: string; severity: string; createdAt: string }[]
}

interface ParentTodayProps {
  initialChildren?: ChildData[]
  initialToday?: string
}

export function ParentToday({ initialChildren, initialToday }: ParentTodayProps) {
  const [data, setData] = useState<{ today: string; children: ChildData[] } | null>(
    initialChildren && initialToday ? { today: initialToday, children: initialChildren } : null
  )
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    initialChildren && initialChildren.length > 0 ? initialChildren[0].id : null
  )
  const [childDetail, setChildDetail] = useState<ChildData | null>(
    initialChildren && initialChildren.length > 0 ? initialChildren[0] : null
  )
  const [switchingChild, setSwitchingChild] = useState<boolean>(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [selectedChildForReport, setSelectedChildForReport] = useState<ChildData | null>(null)
  const [showReportModal, setShowReportModal] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Request sequencing and abort management to guarantee latest-request-wins (DASH-5.1-01)
  const activeRequestIdRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef<boolean>(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // 1. Initial Load: Fetch all linked children summary
  const loadInitial = useCallback(async () => {
    try {
      setLoadError(null)
      const res = await fetch('/api/v1/parent/today')
      const json = await res.json()
      if (!isMountedRef.current) return

      if (json.success && json.data) {
        setData(json.data)
        if (json.data.children.length > 0) {
          const firstChild = json.data.children[0]
          setSelectedChildId(firstChild.id)
          setChildDetail(firstChild)
        }
      } else {
        setLoadError(json.error?.message || 'Failed to load linked children records.')
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setLoadError(err?.message || 'Network error loading child telemetry.')
      }
    }
  }, [])

  useEffect(() => {
    if (!data) {
      loadInitial()
    }
  }, [data, loadInitial])

  // 2. Child Switching & Scoped Data Fetch with Latest-Request-Wins
  const handleSelectChild = useCallback(
    async (childId: string) => {
      if (childId === selectedChildId && childDetail) return

      // Abort previous in-flight fetch if active
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      // Increment sequence token
      const currentRequestId = ++activeRequestIdRef.current

      setSelectedChildId(childId)
      // CRITICAL: Prevent stale data display by resetting active child detail while loading
      setChildDetail(null)
      setSwitchingChild(true)
      setDocuments([])
      setLoadingDocs(true)

      try {
        const [rChild, rDocs] = await Promise.all([
          fetch(`/api/v1/parent/today?studentId=${encodeURIComponent(childId)}`, {
            signal: controller.signal,
          }).then((r) => r.json()),
          fetch(`/api/v1/parent/documents?studentId=${encodeURIComponent(childId)}`, {
            signal: controller.signal,
          })
            .then((r) => r.json())
            .catch(() => ({ success: false, data: [] })),
        ])

        // Verify this request is still the latest active request and component is mounted
        if (!isMountedRef.current || activeRequestIdRef.current !== currentRequestId) {
          return // Obsolete superseded request: discard results completely
        }

        if (rChild.success && rChild.data?.children?.[0]) {
          setChildDetail(rChild.data.children[0])
        } else if (data?.children) {
          // Fallback to initial loaded summary if single-child endpoint is unreachable
          const cached = data.children.find((c) => c.id === childId)
          if (cached) setChildDetail(cached)
        }

        if (rDocs.success) {
          setDocuments(rDocs.data || [])
        }
      } catch (e: any) {
        // Discard aborted request errors
        if (e.name === 'AbortError') return

        // Verify this request is still current
        if (!isMountedRef.current || activeRequestIdRef.current !== currentRequestId) {
          return
        }

        // Fallback to local cached child data if available
        const cached = data?.children.find((c) => c.id === childId)
        if (cached) setChildDetail(cached)
      } finally {
        // Only clear loading flags if this request is still the latest active request
        if (isMountedRef.current && activeRequestIdRef.current === currentRequestId) {
          setSwitchingChild(false)
          setLoadingDocs(false)
        }
      }
    },
    [selectedChildId, childDetail, data]
  )

  // 3. Load documents for initial child once selected
  useEffect(() => {
    if (selectedChildId && documents.length === 0 && !loadingDocs) {
      let isMounted = true
      setLoadingDocs(true)
      fetch(`/api/v1/parent/documents?studentId=${encodeURIComponent(selectedChildId)}`)
        .then((r) => r.json())
        .then((rDocs) => {
          if (isMounted && rDocs.success) {
            setDocuments(rDocs.data || [])
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoadingDocs(false)
        })
      return () => {
        isMounted = false
      }
    }
  }, [selectedChildId])

  // Initial Loading State
  if (!data && !loadError) {
    return (
      <div className="space-y-4">
        <PageHead title="My Child" sub="Loading daily care, learning, and updates..." />
        <div className="card p-6">
          <Skeleton h={260} />
        </div>
      </div>
    )
  }

  // Error State
  if (loadError) {
    return (
      <div className="space-y-4">
        <PageHead title="Parent Connect" sub="Daily connection for enrolled families" />
        <div className="card p-6">
          <EmptyState
            icon={<ShieldAlert size={36} className="text-rose-500" />}
            title="Connection Error"
            message={loadError}
            action={
              <button
                type="button"
                onClick={() => loadInitial()}
                className="btn btn-primary btn-sm mt-3"
              >
                Retry Loading
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const allChildren = data?.children || []
  const hasMultipleChildren = allChildren.length > 1

  return (
    <div className="premium-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. Page Header ── */}
      <PageHead
        eyebrow="Parent Connect"
        badge={
          <span className="badge b-primary b-dot">
            {allChildren.length > 1 ? `${allChildren.length} Linked Children` : 'Child Profile'}
          </span>
        }
        title="Family Command Center"
        sub={`${data?.today || 'Today'} — real-time daily routine, meals, learning observations, and notices.`}
      />

      {/* ── 2. Empty State: No linked children found ── */}
      {allChildren.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Baby size={36} />}
            title="No children linked"
            message="No active children are currently linked to your guardian account. Please contact the preschool administrator to link your child's enrollment record."
          />
        </div>
      )}

      {/* ── 3. Multi-Child Switcher Tab Rail (Spec §4.5) ── */}
      {allChildren.length > 0 && (
        <div
          role="region"
          aria-label="Enrolled Children Selector"
          className="flex flex-col gap-2"
        >
          {hasMultipleChildren && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Switch Child Profile
              </span>
              <span className="text-xs text-slate-400">
                Select a profile to view attendance, care updates, and invoices
              </span>
            </div>
          )}

          {hasMultipleChildren && (
            <div
              role="tablist"
              aria-label="Select Enrolled Child"
              className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar focus-visible:outline-none"
            >
              {allChildren.map((child) => {
                const isSelected = child.id === selectedChildId
                return (
                  <button
                    key={child.id}
                    type="button"
                    role="tab"
                    id={`tab-child-${child.id}`}
                    aria-controls={`panel-child-${child.id}`}
                    aria-selected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => handleSelectChild(child.id)}
                    className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shrink-0 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-primary shadow-sm ring-1 ring-primary/20 text-slate-900 dark:text-white'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Avatar name={child.name} src={child.photoUrl} size="sm" />
                    <div className="flex flex-col pr-1">
                      <span className="text-xs font-bold leading-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {child.name}
                        {isSelected && (
                          <span
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full bg-primary inline-block"
                          />
                        )}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {child.classroom || 'Enrolled Student'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Loading State While Switching Active Child ── */}
      {switchingChild && (
        <div
          role="status"
          aria-live="polite"
          className="card p-8 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <Loader2 size={28} className="animate-spin text-primary" />
          <span className="text-xs font-medium">Refreshing child telemetry...</span>
        </div>
      )}

      {/* ── 5. Active Child Presentation Card (Strictly Guarded Against Stale Data) ── */}
      {!switchingChild && childDetail && (
        <div
          key={childDetail.id}
          role="tabpanel"
          id={`panel-child-${childDetail.id}`}
          aria-labelledby={`tab-child-${childDetail.id}`}
          className="card"
          style={{ marginBottom: 16 }}
        >
          {/* Card Header: Identity & Live Check-in */}
          <div className="card-head">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={childDetail.name} src={childDetail.photoUrl} size="lg" />
              <div>
                <div className="card-title flex items-center gap-2">
                  <span>{childDetail.name}</span>
                  <span className="text-[11px] font-mono text-slate-400 font-normal">
                    #{childDetail.admissionNo}
                  </span>
                </div>
                <div className="card-sub">
                  {childDetail.classroom ?? 'No Section Assigned'}
                  {childDetail.teacher ? ` · Primary Educator: ${childDetail.teacher}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedChildForReport(childDetail)
                  setShowReportModal(true)
                }}
                className="btn btn-xs btn-outline border-border/80 rounded-lg flex items-center gap-1 font-semibold"
                title="View full mobile daily report"
              >
                <FileText size={12} />
                <span>Daily Report</span>
              </button>

              {childDetail.attendance ? (
                <StatusBadge status={childDetail.attendance} />
              ) : (
                <span className="badge b-neutral">Attendance pending</span>
              )}
            </div>
          </div>

          {/* Health & Safety Alerts Banner */}
          {childDetail.alerts.length > 0 && (
            <div
              style={{
                background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 12,
              }}
            >
              {childDetail.alerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                  <b style={{ fontSize: 12.5 }}>{a.title}</b>
                  <span className="t-caption">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* 3-Column Routine, Learning, and Financial Status Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {/* Column A: Today's Routine & Care Stream */}
            <div>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <CalendarCheck size={13} /> Today&apos;s updates
              </b>
              {childDetail.todayCare.length === 0 ? (
                <p className="t-caption" style={{ marginTop: 6 }}>
                  No care updates today — meal, nap, and activity updates will appear as the school day progresses.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {childDetail.todayCare.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <span className="badge b-neutral" style={{ height: 20, fontSize: 10.5 }}>
                        {e.type}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12.5 }}>
                          {e.title}
                          {e.mood ? ` · ${e.mood}` : ''}
                        </span>
                        <div className="t-caption">{timeAgo(e.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column B: Learning & Educator Observations */}
            <div>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Sparkles size={13} /> Teacher update
              </b>
              {childDetail.latestUpdate ? (
                <div style={{ marginTop: 8 }}>
                  <p className="t-caption" style={{ fontSize: 12.5 }}>
                    {childDetail.latestUpdate.narrative}
                  </p>
                  <div className="t-caption" style={{ marginTop: 4 }}>
                    {childDetail.latestUpdate.category ? `${childDetail.latestUpdate.category} · ` : ''}
                    {timeAgo(childDetail.latestUpdate.observedAt)}
                  </div>
                </div>
              ) : (
                <p className="t-caption" style={{ marginTop: 6 }}>
                  Published observations and milestones will appear here once verified by teachers.
                </p>
              )}
              <Link className="btn btn-ghost btn-sm" href="/app/timeline" style={{ marginTop: 8 }}>
                Full child timeline <ChevronRight size={12} />
              </Link>
            </div>

            {/* Column C: Scoped Outstanding Invoices & Pay Action */}
            <div>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Wallet size={13} /> Fees
              </b>
              {childDetail.feesDue.length === 0 ? (
                <p className="t-caption" style={{ marginTop: 6 }}>
                  All clear — no outstanding dues for this child.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {childDetail.feesDue.map((f) => (
                    <div
                      key={f.invoiceNumber}
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <b style={{ fontSize: 12.5 }}>{f.invoiceNumber}</b>
                      <StatusBadge status={f.status} />
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700 }}>
                        {inr(f.balanceCents)}
                      </span>
                    </div>
                  ))}
                  <Link
                    className="btn btn-secondary btn-sm"
                    href="/app/finance"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Pay / view invoices
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Official Reports & Student Documents Section */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <FileText size={13} className="text-purple-600" /> Official Reports & Documents
              </b>
              <span className="badge b-purple" style={{ fontSize: 10.5 }}>
                {documents.length} available
              </span>
            </div>

            {loadingDocs ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Loading official child documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="t-caption" style={{ marginTop: 4 }}>
                Official report cards, certificates, and ID cards issued by the school will appear here.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                          {doc.documentType?.replace(/_/g, ' ') || 'REPORT'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {Math.round(doc.fileSizeBytes / 1024)} KB
                        </span>
                      </div>
                      <div
                        className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1"
                        title={doc.title}
                      >
                        {doc.title}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                        title="View PDF"
                      >
                        <Eye size={12} /> View
                      </button>
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        download={doc.fileName || `${doc.title}.pdf`}
                        className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:underline ml-auto"
                        title="Download PDF"
                      >
                        <Download size={12} /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Document Preview Modal */}
      {previewDoc && (
        <PdfViewerModal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc.id}
          title={previewDoc.title}
          documentType={previewDoc.documentType}
          fileSizeBytes={previewDoc.fileSizeBytes}
          fileName={previewDoc.fileName}
        />
      )}

      {/* Daily Diary Mobile Report Modal */}
      {selectedChildForReport && data && (
        <ParentDailyReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          studentId={selectedChildForReport.id}
          studentName={selectedChildForReport.name}
          dateStr={data.today}
        />
      )}
    </div>
  )
}
