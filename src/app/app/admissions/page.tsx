'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Plus, Phone, UserCheck, UserX, Clock3, FileCheck2, ClipboardList, ThumbsUp, ChevronRight,
} from 'lucide-react'
import { PageHead, Segmented, EmptyState, StatusBadge, Skeleton } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, enumLabel } from '@/lib/format'

interface Lead {
  id: string
  leadNumber: string
  parentName: string
  phone: string
  childName: string | null
  status: string
  source: string
  interestedProgram: string | null
  notes: string | null
}

interface App {
  id: string
  applicationNumber: string
  childName: string
  programType: string
  parentName: string
  parentPhone: string
  status: string
  submittedAt: string
  documents: { id: string; docType: string; verified: boolean }[]
}

const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPLICATION_STARTED', 'CONVERTED', 'LOST']

export default function AdmissionsPage() {
  const toast = useToast()
  const [view, setView] = useState<'pipeline' | 'applications'>('pipeline')
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [apps, setApps] = useState<App[] | null>(null)
  const [leadModal, setLeadModal] = useState(false)
  const [appModal, setAppModal] = useState(false)
  const [detailApp, setDetailApp] = useState<App | null>(null)
  const [approveClass, setApproveClass] = useState<string>('')
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; programType: string }[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [l, a, c] = await Promise.all([
      fetch('/api/v1/leads').then((r) => r.json()),
      fetch('/api/v1/applications').then((r) => r.json()),
      fetch('/api/v1/classrooms').then((r) => r.json()),
    ])
    if (l.success) setLeads(l.data)
    if (a.success) setApps(a.data)
    if (c.success) setClassrooms(c.data)
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const createLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Lead captured', 'Follow-up within 30 minutes wins conversions!')
      setLeadModal(false)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const createApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Application submitted', `${json.data.applicationNumber} created with doc checklist`)
      setAppModal(false)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const moveLead = async (id: string, status: string) => {
    const res = await fetch(`/api/v1/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    if (json.success) load()
    else toast.error('Failed', json.error?.message)
  }

  const convertLead = async (id: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/leads/${id}/convert`, { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Converted to application', json.data.applicationNumber)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const verifyApp = async (id: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${id}/verify`, { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Documents verified', 'Ready for approval')
      setDetailApp(null)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const approveApp = async (id: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId: approveClass || undefined }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Enrolled! 🎉', `${json.data.admissionNo} joined ${json.data.classroom}${json.data.invoiceNumber ? ` · invoice ${json.data.invoiceNumber}` : ''}`)
      setDetailApp(null)
      load()
    } else toast.error('Could not approve', json.error?.message)
  }

  const rejectApp = async (id: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/applications/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Did not meet admission criteria' }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.info('Application rejected')
      setDetailApp(null)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  return (
    <>
      <PageHead
        title="Admissions"
        sub="Lead se enrollment tak — poora pipeline ek jagah."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setLeadModal(true)}>
              <Plus size={15} /> New Lead
            </button>
            <button className="btn btn-primary" onClick={() => setAppModal(true)}>
              <Plus size={15} /> New Application
            </button>
          </>
        }
      />

      <Segmented
        value={view}
        onChange={(v) => setView(v as 'pipeline' | 'applications')}
        options={[
          { key: 'pipeline', label: 'Lead Pipeline' },
          { key: 'applications', label: `Applications (${apps?.length ?? 0})` },
        ]}
      />

      {view === 'pipeline' && (
        <div className="kanban">
          {leads === null &&
            [...Array(4)].map((_, i) => (
              <div key={i} className="kcol"><Skeleton h={120} /></div>
            ))}
          {leads &&
            LEAD_STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.status === stage)
              return (
                <div className="kcol" key={stage}>
                  <div className="kcol-head">
                    <b>{enumLabel(stage)}</b>
                    <span className="kcol-count">{stageLeads.length}</span>
                  </div>
                  {stageLeads.map((l) => (
                    <div className="kcard" key={l.id}>
                      <b>{l.childName || l.parentName}</b>
                      <div className="kc-meta">
                        {l.parentName} · {l.phone}
                      </div>
                      <div className="kc-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
                        {l.leadNumber} · {enumLabel(l.source)}
                        {l.interestedProgram ? ` · ${enumLabel(l.interestedProgram)}` : ''}
                      </div>
                      <div className="kc-foot">
                        <span className="t-caption">{fmtDate(new Date()) && ''}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {stage !== 'CONVERTED' && stage !== 'LOST' && (
                            <>
                              {stage === 'APPLICATION_STARTED' ? (
                                <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => convertLead(l.id)}>
                                  Convert
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-ghost"
                                  title="Move forward"
                                  onClick={() => moveLead(l.id, LEAD_STAGES[Math.min(LEAD_STAGES.indexOf(stage) + 1, 3)])}
                                >
                                  →
                                </button>
                              )}
                              <button className="btn btn-sm btn-ghost" title="Mark lost" onClick={() => moveLead(l.id, 'LOST')}>
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="t-caption" style={{ textAlign: 'center', padding: '14px 0' }}>Empty</div>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {view === 'applications' && (
        <div className="dtable-wrap">
          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Application</th><th>Child</th><th>Program</th><th>Parent</th><th>Docs</th><th>Status</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {apps?.map((a) => (
                  <tr key={a.id} onClick={() => { setDetailApp(a); setApproveClass('') }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{a.applicationNumber}</td>
                    <td className="cell-strong">{a.childName}</td>
                    <td><span className="badge b-pink">{enumLabel(a.programType)}</span></td>
                    <td>
                      {a.parentName}
                      <span className="cell-sub">{a.parentPhone}</span>
                    </td>
                    <td>
                      <span className={`badge ${a.documents.every((d) => d.verified) ? 'b-success' : 'b-warning'}`}>
                        {a.documents.filter((d) => d.verified).length}/{a.documents.length} verified
                      </span>
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                    <td><ChevronRight size={15} style={{ color: 'var(--foreground-muted)' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {apps === null && (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(4)].map((_, i) => <Skeleton key={i} h={36} />)}
              </div>
            )}
            {apps?.length === 0 && (
              <EmptyState
                icon={<ClipboardList size={40} />}
                title="No applications yet"
                message="Capture a walk-in lead or create an application directly."
              />
            )}
          </div>
        </div>
      )}

      {/* Lead modal */}
      <Modal open={leadModal} onClose={() => setLeadModal(false)} title="New Lead" subtitle="Walk-in / call / referral capture" icon={<Phone size={22} />} wide>
        <form onSubmit={createLead}>
          <div className="form-grid">
            <div className="field"><label>Parent Name <span className="req">*</span></label><input className="input" name="parentName" required /></div>
            <div className="field"><label>Phone <span className="req">*</span></label><input className="input" name="phone" required placeholder="+91..." /></div>
            <div className="field"><label>Child Name</label><input className="input" name="childName" /></div>
            <div className="field"><label>Child DOB</label><input className="input" name="childDob" type="date" /></div>
            <div className="field"><label>Source</label>
              <select className="select" name="source" defaultValue="WALK_IN">
                {['WALK_IN','PHONE','WEBSITE','REFERRAL','FACEBOOK','INSTAGRAM','EVENT','PARTNER'].map((s) => (
                  <option key={s} value={s}>{enumLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="field"><label>Interested Program</label>
              <select className="select" name="interestedProgram" defaultValue="NURSERY">
                {['PLAYGROUP','NURSERY','LKG','UKG','DAYCARE'].map((p) => (
                  <option key={p} value={p}>{enumLabel(p)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Notes</label>
            <textarea className="textarea" name="notes" placeholder="Saw our Instagram reel, wants morning batch…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setLeadModal(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Capture Lead</button>
          </div>
        </form>
      </Modal>

      {/* Application modal */}
      <Modal open={appModal} onClose={() => setAppModal(false)} title="New Application" subtitle="Admission application with document checklist" icon={<ClipboardList size={22} />} wide>
        <form onSubmit={createApp}>
          <div className="form-grid">
            <div className="field"><label>Child First Name <span className="req">*</span></label><input className="input" name="childFirstName" required /></div>
            <div className="field"><label>Child Last Name</label><input className="input" name="childLastName" /></div>
            <div className="field"><label>Child DOB <span className="req">*</span></label><input className="input" name="childDob" type="date" required /></div>
            <div className="field"><label>Gender</label>
              <select className="select" name="childGender" defaultValue="UNSPECIFIED">
                <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="UNSPECIFIED">Prefer not to say</option>
              </select>
            </div>
            <div className="field"><label>Program <span className="req">*</span></label>
              <select className="select" name="programType" defaultValue="NURSERY">
                {['PLAYGROUP','NURSERY','LKG','UKG','DAYCARE'].map((p) => <option key={p} value={p}>{enumLabel(p)}</option>)}
              </select>
            </div>
            <div className="field"><label>Parent Name <span className="req">*</span></label><input className="input" name="parentName" required /></div>
            <div className="field"><label>Parent Phone <span className="req">*</span></label><input className="input" name="parentPhone" required /></div>
            <div className="field"><label>Parent Email</label><input className="input" name="parentEmail" type="email" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setAppModal(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Submit Application</button>
          </div>
        </form>
      </Modal>

      {/* Application detail / actions */}
      <Modal
        open={!!detailApp}
        onClose={() => setDetailApp(null)}
        title={detailApp ? `Application ${detailApp.applicationNumber}` : ''}
        subtitle={detailApp ? `${detailApp.childName} · ${enumLabel(detailApp.programType)}` : ''}
        icon={<FileCheck2 size={22} />}
        wide
      >
        {detailApp && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-body-sm"><strong>{detailApp.parentName}</strong> · {detailApp.parentPhone}</span>
                <StatusBadge status={detailApp.status} />
              </div>
              <div className="t-caption">Submitted {fmtDate(detailApp.submittedAt)}</div>
            </div>
            <div className="sm-title">Document checklist</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
              {detailApp.documents.map((d) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-muted)', borderRadius: 10, padding: '8px 12px' }}>
                  <span className={`badge ${d.verified ? 'b-success' : 'b-warning'}`}>{d.verified ? '✓' : '…'}</span>
                  <span style={{ fontSize: 12.5 }}>{enumLabel(d.docType)}</span>
                </div>
              ))}
            </div>
            {detailApp.status === 'VERIFIED' && (
              <div className="field">
                <label>Classroom for enrollment</label>
                <select className="select" value={approveClass} onChange={(e) => setApproveClass(e.target.value)}>
                  <option value="">Auto (program default)</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="helper">Approval creates the student record, enrollment and the first fee invoice — all at once.</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              {['SUBMITTED', 'DOCUMENT_PENDING', 'UNDER_REVIEW'].includes(detailApp.status) && (
                <button className={`btn btn-secondary ${busy ? 'is-loading' : ''}`} disabled={busy} onClick={() => verifyApp(detailApp.id)}>
                  <FileCheck2 size={15} /> Verify Documents
                </button>
              )}
              {['VERIFIED', 'UNDER_REVIEW'].includes(detailApp.status) && (
                <>
                  <button className={`btn btn-destructive ${busy ? 'is-loading' : ''}`} disabled={busy} onClick={() => rejectApp(detailApp.id)}>
                    <UserX size={15} /> Reject
                  </button>
                  <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy} onClick={() => approveApp(detailApp.id)}>
                    <ThumbsUp size={15} /> Approve & Enroll
                  </button>
                </>
              )}
              {detailApp.status === 'ENROLLED' && (
                <span className="badge b-success b-dot" style={{ height: 36, padding: '0 16px' }}>Enrolled</span>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
