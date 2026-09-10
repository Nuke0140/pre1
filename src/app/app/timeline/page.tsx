'use client'

import React, { useEffect, useState } from 'react'
import { Smartphone, Camera, UtensilsCrossed, Moon, Palette, Star, Eye, Sparkles } from 'lucide-react'
import { PageHead, EmptyState, Skeleton, Avatar, Segmented } from '@/components/preone/ui'
import { timeAgo, enumLabel } from '@/lib/format'

interface Entry {
  id: string
  type: string
  title: string
  body: string | null
  at: string
  studentId: string
  studentName: string
}

const TYPE_META: Record<string, { icon: React.ReactNode; dot: string }> = {
  ARRIVAL: { icon: <Eye size={14} />, dot: 'g-blue' },
  MEAL: { icon: <UtensilsCrossed size={14} />, dot: 'g-green' },
  NAP: { icon: <Moon size={14} />, dot: 'g-blue' },
  ACTIVITY: { icon: <Palette size={14} />, dot: 'g-pink' },
  OBSERVATION: { icon: <Sparkles size={14} />, dot: 'g-purple' },
  MILESTONE: { icon: <Star size={14} />, dot: 'g-yellow' },
  NOTE: { icon: <Smartphone size={14} />, dot: '' },
  PHOTO: { icon: <Camera size={14} />, dot: 'g-pink' },
  PICKUP: { icon: <Eye size={14} />, dot: 'g-orange' },
  INCIDENT: { icon: <Eye size={14} />, dot: 'g-orange' },
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/v1/timeline')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setEntries(j.data)
        else setEntries([])
      })
      .catch(() => setEntries([]))
  }, [])

  const filtered = (entries || []).filter(
    (e) => filter === 'ALL' || e.studentId === filter
  )
  const children = Array.from(new Map((entries || []).map((e) => [e.studentId, e.studentName])).entries())

  return (
    <>
      <PageHead
        title="Child Timeline"
        sub="Ye wahi feed hai jo parents apne phone par dekhte hain — real-time."
      />

      {children.length > 1 && (
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'ALL', label: 'All children' },
            ...children.map(([id, name]) => ({ key: id, label: name })),
          ]}
        />
      )}

      <div className="card">
        {entries === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(6)].map((_, i) => <Skeleton key={i} h={56} />)}
          </div>
        )}
        {filtered.length === 0 && entries !== null && (
          <EmptyState
            icon={<Smartphone size={40} />}
            title="Timeline is empty"
            message="Daily activities, meals, observations and announcements automatically flow into this feed."
          />
        )}
        {filtered.length > 0 && (
          <div className="timeline">
            {filtered.map((e) => {
              const meta = TYPE_META[e.type] || TYPE_META.NOTE
              return (
                <div className="tl-item" key={e.id}>
                  <span className={`tl-dot ${meta.dot}`} />
                  <div className="tl-body">
                    <div className="tl-head">
                      <b>{e.title}</b>
                      <span className="badge b-neutral" style={{ height: 20, fontSize: 10.5 }}>
                        {meta.icon} {enumLabel(e.type)}
                      </span>
                      <time>{timeAgo(e.at)}</time>
                    </div>
                    {e.body && <p>{e.body}</p>}
                    {children.length > 1 && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge b-primary" style={{ height: 20, fontSize: 10.5 }}>
                          {e.studentName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
