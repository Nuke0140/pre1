'use client'

import React, { useEffect, useState } from 'react'
import { ScrollText, ShieldCheck } from 'lucide-react'
import { PageHead, EmptyState, Skeleton } from '@/components/preone/ui'
import { timeAgo } from '@/lib/format'

interface Log {
  id: string
  action: string
  entity: string
  entityId: string | null
  summary: string | null
  actorName: string | null
  createdAt: string
}

const ACTION_CLS: Record<string, string> = {
  CREATE: 'b-success', UPDATE: 'b-info', DELETE: 'b-danger', LOGIN: 'b-primary',
  APPROVE: 'b-success', REJECT: 'b-danger', PUBLISH: 'b-orange', CONVERT: 'b-pink',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[] | null>(null)

  useEffect(() => {
    fetch('/api/v1/audit-logs')
      .then((r) => r.json())
      .then((j) => (j.success ? setLogs(j.data) : setLogs([])))
      .catch(() => setLogs([]))
  }, [])

  return (
    <>
      <PageHead
        title="Audit Log"
        sub="Har state change yahan capture hota hai — immutable, 7-year retention."
      />

      <div className="dtable-wrap">
        <div className="table-toolbar">
          <div className="card-title">All Events</div>
          <span className="badge b-success"><ShieldCheck size={12} /> Immutable trail</span>
        </div>
        <div className="dtable-scroll">
          <table className="dtable">
            <thead>
              <tr><th>Action</th><th>Entity</th><th>Summary</th><th>Actor</th><th>When</th></tr>
            </thead>
            <tbody>
              {logs?.map((l) => (
                <tr key={l.id} style={{ cursor: 'default' }}>
                  <td><span className={`badge ${ACTION_CLS[l.action] || 'b-neutral'}`}>{l.action}</span></td>
                  <td style={{ fontSize: 12.5 }}>{l.entity}</td>
                  <td style={{ maxWidth: 360 }}>
                    <span style={{ fontSize: 13 }}>{l.summary || '—'}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{l.actorName || 'System'}</td>
                  <td className="t-caption">{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs === null && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} h={36} />)}
            </div>
          )}
          {logs?.length === 0 && (
            <EmptyState icon={<ScrollText size={40} />} title="No events yet" message="As staff use the system, every create/update/approve lands here." />
          )}
        </div>
      </div>
    </>
  )
}
