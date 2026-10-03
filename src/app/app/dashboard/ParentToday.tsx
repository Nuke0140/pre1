'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Baby, AlertTriangle, Wallet, Sparkles, CalendarCheck, FileText, Eye, Download } from 'lucide-react'
import { PageHead, Skeleton, Avatar, EmptyState, StatusBadge } from '@/components/preone/ui'
import { PdfViewerModal } from '@/components/preone/PdfViewerModal'
import { inr, timeAgo } from '@/lib/format'

interface ChildData {
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

export function ParentToday() {
  const [data, setData] = useState<{ today: string; children: ChildData[] } | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [previewDoc, setPreviewDoc] = useState<any>(null)

  const load = useCallback(async () => {
    try {
      const [rToday, rDocs] = await Promise.all([
        fetch('/api/v1/parent/today').then((r) => r.json()),
        fetch('/api/v1/parent/documents').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      ])
      if (rToday.success) setData(rToday.data)
      if (rDocs.success) setDocuments(rDocs.data || [])
    } catch {
      // Non-blocking
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (!data) {
    return (
      <>
        <PageHead title="Mera bachcha" sub="How is my child doing today?" />
        <Skeleton h={300} />
      </>
    )
  }

  return (
    <>
      <PageHead
        eyebrow="Parent Connect"
        badge={<span className="badge b-primary b-dot">Child Profile</span>}
        title="Mera bachcha"
        sub={`${data.today} — aaj ka din, care se learning tak.`}
      />

      {data.children.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Baby size={36} />}
            title="No children linked"
            message="Aapke account se koi child link nahi hai. School admin se contact karein."
          />
        </div>
      )}

      {data.children.map((c) => (
        <div className="card" key={c.id} style={{ marginBottom: 16 }}>
          <div className="card-head">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={c.name} size="lg" />
              <div>
                <div className="card-title">{c.name}</div>
                <div className="card-sub">
                  {c.classroom ?? '—'}{c.teacher ? ` · ${c.teacher}` : ''}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {c.attendance
                ? <StatusBadge status={c.attendance} />
                : <span className="badge b-neutral">Attendance pending</span>}
            </div>
          </div>

          {c.alerts.length > 0 && (
            <div style={{ background: 'color-mix(in srgb, var(--danger) 8%, transparent)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
              {c.alerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                  <b style={{ fontSize: 12.5 }}>{a.title}</b>
                  <span className="t-caption">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {/* TODAY — care */}
            <div>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <CalendarCheck size={13} /> Aaj ka din
              </b>
              {c.todayCare.length === 0 ? (
                <p className="t-caption" style={{ marginTop: 6 }}>Aaj koi care update nahi — school day shuru hote hi dikhega.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {c.todayCare.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <span className="badge b-neutral" style={{ height: 20, fontSize: 10.5 }}>{e.type}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12.5 }}>{e.title}{e.mood ? ` · ${e.mood}` : ''}</span>
                        <div className="t-caption">{timeAgo(e.at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LEARNING */}
            <div>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Sparkles size={13} /> Teacher update
              </b>
              {c.latestUpdate ? (
                <div style={{ marginTop: 8 }}>
                  <p className="t-caption" style={{ fontSize: 12.5 }}>{c.latestUpdate.narrative}</p>
                  <div className="t-caption" style={{ marginTop: 4 }}>
                    {c.latestUpdate.category ? `${c.latestUpdate.category} · ` : ''}{timeAgo(c.latestUpdate.observedAt)}
                  </div>
                </div>
              ) : (
                <p className="t-caption" style={{ marginTop: 6 }}>Published observations yahan dikhenge.</p>
              )}
              <Link className="btn btn-ghost btn-sm" href="/app/timeline" style={{ marginTop: 8 }}>
                Full child timeline
              </Link>
            </div>

            {/* FEES */}
            <div>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Wallet size={13} /> Fees
              </b>
              {c.feesDue.length === 0 ? (
                <p className="t-caption" style={{ marginTop: 6 }}>Sab clear — koi outstanding nahi.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {c.feesDue.map((f) => (
                    <div key={f.invoiceNumber} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <b style={{ fontSize: 12.5 }}>{f.invoiceNumber}</b>
                      <StatusBadge status={f.status} />
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700 }}>{inr(f.balanceCents)}</span>
                    </div>
                  ))}
                  <Link className="btn btn-secondary btn-sm" href="/app/finance" style={{ alignSelf: 'flex-start' }}>
                    Pay / view invoices
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* OFFICIAL REPORTS & DOCUMENTS */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <b style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
                <FileText size={13} className="text-purple-600" /> Official Reports & Documents
              </b>
              <span className="badge b-purple" style={{ fontSize: 10.5 }}>
                {documents.filter((d) => d.studentId === c.id).length} available
              </span>
            </div>

            {documents.filter((d) => d.studentId === c.id).length === 0 ? (
              <p className="t-caption" style={{ marginTop: 4 }}>
                Official report cards, certificates, and ID cards issued by the school will appear here.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 8 }}>
                {documents
                  .filter((d) => d.studentId === c.id)
                  .map((doc) => (
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
                        <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1" title={doc.title}>
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
      ))}

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
    </>
  )
}
