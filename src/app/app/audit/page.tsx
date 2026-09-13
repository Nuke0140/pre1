'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ScrollText, ShieldCheck, Download, Filter, Eye, Globe, Terminal } from 'lucide-react'
import { PageHead, EmptyState, Skeleton, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { fmtDate, timeAgo } from '@/lib/format'

interface Log {
  id: string
  action: string
  entity: string
  entityId: string | null
  module: string | null
  summary: string | null
  severity: string
  actorName: string | null
  actorRole: string | null
  ipAddress: string | null
  userAgent: string | null
  oldValues: string | null
  newValues: string | null
  createdAt: string
}

const ACTION_CLS: Record<string, string> = {
  CREATE: 'b-success',
  UPDATE: 'b-info',
  DELETE: 'b-danger',
  LOGIN: 'b-primary',
  APPROVE: 'b-success',
  REJECT: 'b-danger',
  PUBLISH: 'b-orange',
  SCAN: 'b-pink',
  GATE_PICKUP: 'b-success',
  EMERGENCY_BLOCK: 'b-danger',
}

const MODULES = [
  'ALL',
  'Users',
  'Setup',
  'Academics',
  'Admissions',
  'Students',
  'Operations',
  'Fees',
  'Announcements',
  'Settings',
]

export default function AuditPage() {
  const toast = useToast()
  const [logs, setLogs] = useState<Log[] | null>(null)
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const url = moduleFilter === 'ALL' ? '/api/v1/audit-logs' : `/api/v1/audit-logs?module=${moduleFilter}`
    try {
      const res = await fetch(url)
      const j = await res.json()
      if (j.success) setLogs(j.data)
      else setLogs([])
    } catch {
      setLogs([])
    }
  }, [moduleFilter])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const exportLogs = async () => {
    setBusy(true)
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DATA_EXPORT',
        payload: { entity: 'AuditLog', moduleFilter },
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (json.success) {
      toast.success('Audit export queued', `Job #${json.data.id.slice(0, 8)} started in background`)
    } else {
      toast.error('Failed to export audit logs', json.error?.message)
    }
  }

  return (
    <>
      <PageHead
        title="Audit & Compliance Logs"
        sub="Immutable record of system changes, security events, and gate scans with 7-year retention."
        actions={
          <button className="btn btn-outline" onClick={exportLogs} disabled={busy} title="Export audit trail">
            <Download size={15} /> Export Audit Trail
          </button>
        }
      />

      <div className="dtable-wrap">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="card-title">Event Logs</span>
            <span className="badge b-success"><ShieldCheck size={12} /> Tamper-evident</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: 'var(--muted)' }} />
            <select
              className="select"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{ height: 32, fontSize: 13, padding: '0 10px' }}
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? 'All Modules' : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="dtable-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>Action</th>
                <th>Module</th>
                <th>Entity</th>
                <th>Summary</th>
                <th>Actor</th>
                <th>Severity</th>
                <th>When</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((l) => (
                <tr key={l.id} onClick={() => setSelectedLog(l)}>
                  <td>
                    <span className={`badge ${ACTION_CLS[l.action] || 'b-neutral'}`}>{l.action}</span>
                  </td>
                  <td style={{ fontSize: 12.5, fontWeight: 500 }}>{l.module || '—'}</td>
                  <td style={{ fontSize: 12.5 }}>{l.entity}</td>
                  <td style={{ maxWidth: 320 }}>
                    <span style={{ fontSize: 13 }}>{l.summary || '—'}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    <div style={{ fontWeight: 600 }}>{l.actorName || 'System'}</div>
                    {l.actorRole && <div className="t-caption">{l.actorRole}</div>}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        l.severity === 'CRITICAL'
                          ? 'b-danger'
                          : l.severity === 'WARN'
                          ? 'b-orange'
                          : 'b-neutral'
                      }`}
                      style={{ fontSize: 10 }}
                    >
                      {l.severity || 'INFO'}
                    </span>
                  </td>
                  <td className="t-caption">{timeAgo(l.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 4 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLog(l)
                      }}
                      title="Inspect log details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
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
            <EmptyState
              icon={<ScrollText size={40} />}
              title="No events found"
              message={moduleFilter !== 'ALL' ? `No events logged for ${moduleFilter} yet.` : 'As staff use the system, every create, update, approve and scan lands here.'}
            />
          )}
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event #${selectedLog.id.slice(0, 8)}` : ''}
        subtitle="Forensic payload & metadata snapshot"
        icon={<Terminal size={22} />}
        wide
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--surface-sunken)', padding: 14, borderRadius: 10 }}>
              <div>
                <div className="t-caption">ACTION & MODULE</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{selectedLog.action} · {selectedLog.module || 'System'}</div>
              </div>
              <div>
                <div className="t-caption">ENTITY</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{selectedLog.entity} ({selectedLog.entityId || 'N/A'})</div>
              </div>
              <div>
                <div className="t-caption">ACTOR</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{selectedLog.actorName || 'System'} ({selectedLog.actorRole || 'SYSTEM'})</div>
              </div>
              <div>
                <div className="t-caption">TIMESTAMP</div>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{fmtDate(selectedLog.createdAt)}</div>
              </div>
            </div>

            <div>
              <div className="t-caption" style={{ fontWeight: 600, marginBottom: 4 }}>EVENT SUMMARY</div>
              <p style={{ margin: 0, fontSize: 13.5, background: 'var(--surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                {selectedLog.summary || 'No summary text recorded.'}
              </p>
            </div>

            {(selectedLog.ipAddress || selectedLog.userAgent) && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: 'var(--muted)' }}>
                {selectedLog.ipAddress && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe size={13} /> IP: {selectedLog.ipAddress}
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                    Client: {selectedLog.userAgent}
                  </div>
                )}
              </div>
            )}

            {(selectedLog.oldValues || selectedLog.newValues) && (
              <div style={{ display: 'grid', gridTemplateColumns: selectedLog.oldValues ? '1fr 1fr' : '1fr', gap: 12 }}>
                {selectedLog.oldValues && (
                  <div>
                    <div className="t-caption" style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>BEFORE (OLD VALUES)</div>
                    <pre style={{ margin: 0, padding: 10, background: 'var(--surface-sunken)', borderRadius: 8, fontSize: 11, maxHeight: 180, overflow: 'auto', fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.newValues && (
                  <div>
                    <div className="t-caption" style={{ fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>AFTER (NEW VALUES)</div>
                    <pre style={{ margin: 0, padding: 10, background: 'var(--surface-sunken)', borderRadius: 8, fontSize: 11, maxHeight: 180, overflow: 'auto', fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
