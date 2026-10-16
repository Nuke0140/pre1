'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { playLobbyChime } from '@/lib/audio/chime'
import { useToast } from '@/components/preone/Toast'
import { Bell, HeartPulse, User, ArrowRight, X } from 'lucide-react'

export interface LobbyWalkInLead {
  id: string
  leadNumber: string
  parentName: string
  phone: string
  childName?: string | null
  interestedProgram?: string | null
  notes?: string | null
  source?: string | null
  createdAt: string
  branchName?: string | null
}

export interface UseLobbyWalkInNotifierProps {
  branchId?: string
  pollingIntervalMs?: number // default 15000 (15 seconds)
  enabled?: boolean
  onNewWalkIn?: (lead: LobbyWalkInLead) => void
}

/**
 * useLobbyWalkInNotifier
 *
 * Polls or listens for newly submitted leads with source === 'WALK_IN' or containing
 * lobby notes. When a new walk-in arrives:
 * 1. Plays a warm, high-fidelity Web Audio API chime.
 * 2. Triggers an in-app toast alert and active banner.
 * 3. Notifies front-desk staff with child name, parent name, and immediate view CTA.
 */
export function useLobbyWalkInNotifier({
  branchId,
  pollingIntervalMs = 15000,
  enabled = true,
  onNewWalkIn,
}: UseLobbyWalkInNotifierProps = {}) {
  const toast = useToast()
  const [latestLobbyLead, setLatestLobbyLead] = useState<LobbyWalkInLead | null>(null)
  const [unreadLobbyCount, setUnreadLobbyCount] = useState<number>(0)
  
  // Track known lead IDs to prevent duplicate alerts
  const knownLeadIdsRef = useRef<Set<string>>(new Set())
  const isInitialFetchRef = useRef<boolean>(true)

  const checkForLobbyWalkIns = useCallback(async () => {
    if (!enabled) return

    try {
      const qParams = new URLSearchParams({
        status: 'NEW',
        ...(branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all'
          ? { branchId }
          : {}),
      })

      const res = await fetch(`/api/v1/leads?${qParams.toString()}`)
      if (!res.ok) return
      const json = await res.json()
      if (!json.success || !Array.isArray(json.data)) return

      const leads: LobbyWalkInLead[] = json.data

      // Filter for lobby walk-ins (source === 'WALK_IN' or notes containing [Front-Desk Lobby Walk-In])
      const lobbyLeads = leads.filter(
        (l) =>
          l.source === 'WALK_IN' ||
          (typeof l.notes === 'string' && l.notes.includes('Lobby Walk-In'))
      )

      if (isInitialFetchRef.current) {
        // Seed initial known IDs so we don't spam chime on page load
        lobbyLeads.forEach((l) => knownLeadIdsRef.current.add(l.id))
        isInitialFetchRef.current = false
        return
      }

      // Detect brand new leads that arrived during this session
      const newLobbyArrivals = lobbyLeads.filter((l) => !knownLeadIdsRef.current.has(l.id))

      if (newLobbyArrivals.length > 0) {
        // Mark all as known
        newLobbyArrivals.forEach((l) => knownLeadIdsRef.current.add(l.id))

        const mostRecent = newLobbyArrivals[0]
        setLatestLobbyLead(mostRecent)
        setUnreadLobbyCount((prev) => prev + newLobbyArrivals.length)

        // 1. Play crystal clear audio chime!
        playLobbyChime(0.4)

        // 2. Surface toast banner
        const childLabel = mostRecent.childName || 'New Student'
        const parentLabel = mostRecent.parentName ? `Parent: ${mostRecent.parentName}` : ''
        toast.info(
          `🔔 New Lobby Walk-In: ${childLabel}`,
          `${parentLabel} just self-registered at the front desk reception.`
        )

        // 3. Callback hook
        if (onNewWalkIn) {
          onNewWalkIn(mostRecent)
        }
      }
    } catch {
      // Quietly ignore polling network glitches
    }
  }, [branchId, enabled, onNewWalkIn, toast])

  useEffect(() => {
    if (!enabled) return

    // Run initial fetch
    checkForLobbyWalkIns()

    const interval = setInterval(checkForLobbyWalkIns, pollingIntervalMs)
    return () => clearInterval(interval)
  }, [checkForLobbyWalkIns, pollingIntervalMs, enabled])

  const dismissLatestLobbyLead = () => {
    setLatestLobbyLead(null)
  }

  return {
    latestLobbyLead,
    unreadLobbyCount,
    dismissLatestLobbyLead,
    triggerManualCheck: checkForLobbyWalkIns,
  }
}

/**
 * LobbyWalkInAlertBanner
 *
 * A prominent, elegant floating notification banner for front-desk receptionists.
 * Displays when a waiting parent in the lobby completes their self-fill form.
 */
export function LobbyWalkInAlertBanner({
  lead,
  onDismiss,
  onViewLead,
}: {
  lead: LobbyWalkInLead | null
  onDismiss: () => void
  onViewLead: (lead: LobbyWalkInLead) => void
}) {
  if (!lead) return null

  const hasMedical = typeof lead.notes === 'string' && lead.notes.includes('Medical')

  return (
    <aside
      aria-label="New front-desk walk-in alert"
      className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300 shadow-2xl rounded-2xl bg-card border-2 border-primary/40 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-primary/15 via-rose-500/10 to-primary/5 p-3.5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs animate-bounce">
          <Bell size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              New Front-Desk Lobby Walk-In!
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              Just Now
            </span>
          </div>

          <div className="text-xs font-semibold text-foreground mt-0.5 truncate">
            {lead.childName ? `${lead.childName} ` : 'Child '}
            <span className="text-muted-foreground font-normal">
              ({lead.parentName || 'Parent'})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            {lead.interestedProgram && (
              <span className="font-semibold text-primary">
                Program: {lead.interestedProgram}
              </span>
            )}
            {hasMedical && (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                <HeartPulse size={12} />
                <span>Medical Notes Provided</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          aria-label="Dismiss alert"
        >
          <X size={15} />
        </button>
      </div>

      <div className="px-3.5 py-2.5 bg-muted/30 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          Waiting in reception lobby
        </span>
        <button
          type="button"
          onClick={() => onViewLead(lead)}
          className="btn btn-primary btn-sm h-8 px-3 rounded-xl text-xs font-bold gap-1.5 shadow-xs"
        >
          <span>View Lead Dossier</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </aside>
  )
}
