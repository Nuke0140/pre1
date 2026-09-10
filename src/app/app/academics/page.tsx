'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Sparkles, Plus, Send } from 'lucide-react'
import { PageHead, StatusBadge, EmptyState, Skeleton, Avatar } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { timeAgo } from '@/lib/format'

interface Observation {
  id: string
  studentName: string
  studentId: string
  classroom: string | null
  narrative: string
  milestoneTags: string | null
  status: string
  observedAt: string
}

export default function AcademicsPage() {
  const toast = useToast()
  const [items, setItems] = useState<Observation[] | null>(null)
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [o, s] = await Promise.all([
      fetch('/api/v1/observations').then((r) => r.json()),
      fetch('/api/v1/students?pageSize=100').then((r) => r.json()),
    ])
    if (o.success) setItems(o.data)
    if (s.success) setStudents(s.data)
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/v1/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: fd.get('studentId'),
        narrative: fd.get('narrative'),
        milestoneTags: fd.get('milestoneTags'),
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Observation saved as draft', 'Publish it to share with parents')
      setOpen(false)
      load()
    } else toast.error('Failed', json.error?.message)
  }

  const publish = async (id: string) => {
    setBusy(true)
    const res = await fetch(`/api/v1/observations/${id}/publish`, { method: 'POST' })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Published to parent timeline', 'Observation + milestone tracking updated')
      load()
    } else toast.error('Failed', json.error?.message)
  }

  return (
    <>
      <PageHead
        title="Academics — Observations"
        sub="Bacchon ke learning moments record karo — publish hote hi parents ko dikhta hai."
        actions={
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={15} /> New Observation
          </button>
        }
      />

      {items === null && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={70} />)}
        </div>
      )}

      {items?.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<Sparkles size={40} />}
            title="No observations yet"
            message="Record what you see — block play, story time, motor skills. Minimum 20 characters per PRD."
            action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Record first observation</button>}
          />
        </div>
      )}

      {items && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((o) => (
            <div className="card card-hover" key={o.id}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Avatar name={o.studentName} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: 14 }}>{o.studentName}</b>
                    {o.classroom && <span className="t-caption">{o.classroom}</span>}
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="t-body" style={{ marginTop: 4 }}>{o.narrative}</p>
                  {o.milestoneTags && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {o.milestoneTags.split(',').map((m) => (
                        <span key={m} className="badge b-primary" style={{ height: 22, fontSize: 11 }}>{m.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span className="t-caption">{timeAgo(o.observedAt)}</span>
                  {o.status === 'DRAFT' && (
                    <button className={`btn btn-secondary btn-sm ${busy ? 'is-loading' : ''}`} disabled={busy} onClick={() => publish(o.id)}>
                      <Send size={13} /> Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Record Observation" subtitle="AI-ready narrative — min 20 characters" icon={<Sparkles size={22} />} wide>
        <form onSubmit={create}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Student <span className="req">*</span></label>
            <select className="select" name="studentId" required defaultValue="">
              <option value="" disabled>Select student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>What did you observe? <span className="req">*</span></label>
            <textarea className="textarea" name="narrative" required minLength={20}
              placeholder="Anaya built a 12-block tower today and explained balance to her friends — emerging spatial reasoning and leadership…"
              style={{ minHeight: 110 }} />
            <span className="helper">Teacher approval ke baad publish hota hai (PRD rule).</span>
          </div>
          <div className="field">
            <label>Milestone Tags</label>
            <input className="input" name="milestoneTags" placeholder="Fine Motor, Social Skills" />
            <span className="helper">Comma separated — links to milestone tracker</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Draft</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
