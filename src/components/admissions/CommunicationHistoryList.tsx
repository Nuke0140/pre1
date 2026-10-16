'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { fmtDate } from '@/lib/format'
import { CALL_OUTCOMES } from './CallLogDialog'

export interface AdmissionCommunicationItem {
  id: string
  tenantId: string
  branchId?: string | null
  leadId?: string | null
  applicationId?: string | null
  channel: 'CALL' | 'WHATSAPP'
  interactionType: 'CALL_LOGGED' | 'CALL_INITIATED' | 'WHATSAPP_PREPARED'
  callOutcome?: string | null
  notes?: string | null
  parentName?: string | null
  phone?: string | null
  followUpDate?: string | null
  createdById?: string | null
  createdByName?: string | null
  createdAt: string
}

export interface CommunicationHistoryListProps {
  leadId?: string | null
  applicationId?: string | null
  title?: string
  onLogCall?: () => void
  onSendWhatsApp?: () => void
  refreshTrigger?: number
  className?: string
}

export function CommunicationHistoryList({
  leadId,
  applicationId,
  title,
  onLogCall,
  onSendWhatsApp,
  refreshTrigger = 0,
  className = '',
}: CommunicationHistoryListProps) {
  const [items, setItems] = useState<AdmissionCommunicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    if (!leadId && !applicationId) return
    setLoading(true)
    setError(null)

    try {
      const qParams = new URLSearchParams()
      if (leadId) qParams.set('leadId', leadId)
      if (applicationId) qParams.set('applicationId', applicationId)

      const res = await fetch(`/api/v1/admissions/communications?${qParams.toString()}`)
      const json = await res.json()
      setLoading(false)

      if (json.success && Array.isArray(json.data)) {
        setItems(json.data)
      } else {
        setError(json.error?.message || 'Failed to load communication history.')
      }
    } catch {
      setLoading(false)
      setError('Unable to fetch communication logs.')
    }
  }, [leadId, applicationId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, refreshTrigger])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between pb-1 border-b border-border/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            {title || 'Direct Communication History'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
            {items.length} logged
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Refresh communication history"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          {onLogCall && (
            <button
              type="button"
              onClick={onLogCall}
              className="btn btn-outline btn-xs h-7 px-2 rounded-lg text-[11px] font-semibold gap-1"
            >
              <Phone size={11} className="text-primary" />
              <span>Log Call</span>
            </button>
          )}
          {onSendWhatsApp && (
            <button
              type="button"
              onClick={onSendWhatsApp}
              className="btn btn-outline btn-xs h-7 px-2 rounded-lg text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 hover:bg-emerald-500/10"
            >
              <MessageCircle size={11} />
              <span>WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
          Loading communication ledger...
        </div>
      ) : error ? (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadHistory}
            className="text-[11px] font-bold underline ml-2"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
          <p>No phone calls or WhatsApp messages recorded yet.</p>
          <p className="text-[11px] text-muted-foreground/80">
            Use the actions above to contact the parent directly and record call outcomes.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isCall = item.channel === 'CALL'
            const outcomeObj = CALL_OUTCOMES.find((o) => o.id === item.callOutcome)
            const badgeClass =
              outcomeObj?.badge ||
              (isCall
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-1.5 text-xs transition-all hover:bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isCall
                          ? 'bg-primary/10 text-primary'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isCall ? <Phone size={12} /> : <MessageCircle size={12} />}
                    </div>
                    <span className="font-bold text-foreground">
                      {isCall ? 'Phone Call Outreach' : 'WhatsApp Outreach'}
                    </span>
                    {item.callOutcome && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                        {outcomeObj?.label || item.callOutcome}
                      </span>
                    )}
                    {item.interactionType === 'WHATSAPP_PREPARED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        Template Prepared
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {fmtDate(item.createdAt)}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-muted-foreground text-[11.5px] leading-relaxed whitespace-pre-wrap pl-8">
                    {item.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between text-[10.5px] text-muted-foreground pt-1 pl-8 border-t border-border/40">
                  <span>Logged by {item.createdByName || 'Staff Counselor'}</span>
                  {item.followUpDate && (
                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <Clock size={11} />
                      <span>Next Follow-up: {fmtDate(item.followUpDate)}</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
