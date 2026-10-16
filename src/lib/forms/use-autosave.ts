'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus =
  | 'IDLE'
  | 'UNSAVED'
  | 'SAVING'
  | 'SAVED'
  | 'ERROR'
  | 'OFFLINE_LOCAL'

export interface StoredDraft<T> {
  key: string
  tenantId: string
  userId: string
  data: T
  savedAt: string
  schemaVersion: number
}

export interface UseAutosaveOptions<T> {
  /**
   * Unique scope key for this form or record, e.g. "admission:new" or "admission:app_123"
   */
  key: string
  /**
   * Current live form state
   */
  data: T
  /**
   * Async server persistence callback. Must return or resolve when server confirms persistence.
   */
  onSave: (draftData: T) => Promise<{ id?: string; [key: string]: any } | void>
  /**
   * Inactivity delay before saving. Default is 2500ms (2.5s)
   */
  debounceMs?: number
  /**
   * Current tenant context to prevent cross-tenant draft leakage
   */
  tenantId?: string
  /**
   * Current authenticated user to prevent cross-user draft leakage
   */
  userId?: string
  /**
   * Whether to persist a local browser draft for offline / refresh recovery. Default: true
   */
  localBackup?: boolean
  /**
   * Maximum bounded retry attempts for transient server failures. Default: 2
   */
  maxRetries?: number
  /**
   * Custom validator to verify if form has enough meaningful data to warrant a draft
   */
  validateForDraft?: (data: T) => boolean
  /**
   * Custom equality checker to detect meaningful dirty changes. Default: JSON comparison
   */
  isEqual?: (a: T, b: T) => boolean
  /**
   * Callback fired when an eligible draft is restored
   */
  onRestore?: (restoredData: T) => void
  /**
   * Warn before leaving the page if unsaved changes exist. Default: true
   */
  warnOnUnload?: boolean
}

export interface UseAutosaveReturn<T> {
  status: SaveStatus
  lastSavedAt: Date | null
  error: Error | null
  isDirty: boolean
  saveCount: number
  hasLocalDraft: boolean
  saveNow: (overrideData?: T) => Promise<boolean>
  restoreDraft: () => T | null
  clearDraft: () => void
  discardDraft: () => void
  retry: () => Promise<boolean>
}

const DRAFT_PREFIX = 'preone_draft_v1'
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function defaultIsEqual<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (!a || !b) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

/**
 * Builds the isolated storage key scoped to tenant, user, and form key.
 * This guarantees zero cross-tenant and zero cross-user draft collision.
 */
export function getDraftStorageKey(tenantId: string, userId: string, key: string): string {
  const safeTenant = (tenantId || 'global').trim().toLowerCase()
  const safeUser = (userId || 'anon').trim().toLowerCase()
  const safeKey = key.trim().toLowerCase()
  return `${DRAFT_PREFIX}:${safeTenant}:${safeUser}:${safeKey}`
}

export function useAutosave<T extends Record<string, any>>({
  key,
  data,
  onSave,
  debounceMs = 2500,
  tenantId = 'default',
  userId = 'anonymous',
  localBackup = true,
  maxRetries = 2,
  validateForDraft,
  isEqual = defaultIsEqual,
  onRestore,
  warnOnUnload = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [status, setStatus] = useState<SaveStatus>('IDLE')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [saveCount, setSaveCount] = useState<number>(0)
  const [hasLocalDraft, setHasLocalDraft] = useState<boolean>(false)

  // Stable references for state & async race conditions
  const dataRef = useRef<T>(data)
  dataRef.current = data

  const lastSavedSnapshotRef = useRef<T | null>(null)
  const requestSeqRef = useRef<number>(0)
  const isSavingRef = useRef<boolean>(false)
  const queuedDataRef = useRef<T | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const storageKey = getDraftStorageKey(tenantId, userId, key)

  // Local draft read helper
  const readLocalDraft = useCallback((): StoredDraft<T> | null => {
    if (typeof window === 'undefined' || !localBackup) return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed: StoredDraft<T> = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || !parsed.data) return null
      const age = Date.now() - new Date(parsed.savedAt).getTime()
      if (age > DRAFT_TTL_MS) {
        localStorage.removeItem(storageKey)
        return null
      }
      return parsed
    } catch {
      return null
    }
  }, [storageKey, localBackup])

  // Save local draft helper
  const writeLocalDraft = useCallback((draftData: T): boolean => {
    if (typeof window === 'undefined' || !localBackup) return false
    try {
      const payload: StoredDraft<T> = {
        key,
        tenantId,
        userId,
        data: draftData,
        savedAt: new Date().toISOString(),
        schemaVersion: 1,
      }
      localStorage.setItem(storageKey, JSON.stringify(payload))
      setHasLocalDraft(true)
      return true
    } catch {
      return false
    }
  }, [storageKey, key, tenantId, userId, localBackup])

  // Remove local draft
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(storageKey)
      setHasLocalDraft(false)
    } catch {
      // ignore
    }
  }, [storageKey])

  // Check for existing local draft on mount or key change
  useEffect(() => {
    isMountedRef.current = true
    const existing = readLocalDraft()
    if (existing && existing.data) {
      setHasLocalDraft(true)
    } else {
      setHasLocalDraft(false)
    }
    return () => {
      isMountedRef.current = false
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [readLocalDraft])

  // Execute Save Action with concurrency guard & bounded retries
  const executeSave = useCallback(
    async (dataToPersist: T, retryCount = 0): Promise<boolean> => {
      if (!isMountedRef.current) return false

      // Skip redundant saves if unchanged
      if (
        lastSavedSnapshotRef.current &&
        isEqual(dataToPersist, lastSavedSnapshotRef.current)
      ) {
        setStatus('SAVED')
        return true
      }

      // Check draft validity (e.g. at least one non-empty field)
      if (validateForDraft && !validateForDraft(dataToPersist)) {
        return false
      }

      // Concurrency lock: queue if another save is already in-flight
      if (isSavingRef.current) {
        queuedDataRef.current = dataToPersist
        return false
      }

      isSavingRef.current = true
      const thisSeq = ++requestSeqRef.current
      setStatus('SAVING')
      setError(null)

      // Offline check: save locally first
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
      if (!isOnline) {
        const localSaved = writeLocalDraft(dataToPersist)
        isSavingRef.current = false
        if (localSaved && isMountedRef.current) {
          lastSavedSnapshotRef.current = dataToPersist
          setLastSavedAt(new Date())
          setStatus('OFFLINE_LOCAL')
          return true
        }
      }

      try {
        await onSave(dataToPersist)

        // Drop out-of-order response if a newer request began
        if (thisSeq !== requestSeqRef.current) {
          isSavingRef.current = false
          return false
        }

        if (isMountedRef.current) {
          lastSavedSnapshotRef.current = dataToPersist
          const now = new Date()
          setLastSavedAt(now)
          setSaveCount((c) => c + 1)
          setStatus('SAVED')
          setError(null)

          // Also backup locally as fallback cache
          writeLocalDraft(dataToPersist)
        }

        isSavingRef.current = false

        // Process queued changes if edits happened while saving
        if (queuedDataRef.current && isMountedRef.current) {
          const next = queuedDataRef.current
          queuedDataRef.current = null
          if (!isEqual(next, dataToPersist)) {
            executeSave(next)
          }
        }

        return true
      } catch (err: any) {
        if (thisSeq !== requestSeqRef.current) {
          isSavingRef.current = false
          return false
        }

        // Bounded retry on network errors
        if (retryCount < maxRetries) {
          const backoff = 1000 * Math.pow(1.5, retryCount)
          await new Promise((resolve) => setTimeout(resolve, backoff))
          isSavingRef.current = false
          return executeSave(dataToPersist, retryCount + 1)
        }

        // Save locally so data is preserved even if network failed
        const localSaved = writeLocalDraft(dataToPersist)

        if (isMountedRef.current) {
          isSavingRef.current = false
          setError(err instanceof Error ? err : new Error(String(err || 'Draft save failed')))
          if (localSaved) {
            setStatus('OFFLINE_LOCAL')
          } else {
            setStatus('ERROR')
          }
        }
        return false
      }
    },
    [isEqual, validateForDraft, writeLocalDraft, onSave, maxRetries]
  )

  // Reactive Change Detector & Debouncer
  useEffect(() => {
    // Determine if data has genuinely changed from last saved snapshot
    const isUnchanged =
      lastSavedSnapshotRef.current && isEqual(data, lastSavedSnapshotRef.current)

    if (isUnchanged) {
      return
    }

    // Set dirty state immediately
    setStatus('UNSAVED')

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave(dataRef.current)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [data, debounceMs, isEqual, executeSave])

  // Unload protection: warn before accidental page navigation if unsaved
  useEffect(() => {
    if (!warnOnUnload || typeof window === 'undefined') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isUnsaved =
        status === 'UNSAVED' ||
        (lastSavedSnapshotRef.current && !isEqual(dataRef.current, lastSavedSnapshotRef.current))
      if (isUnsaved) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [status, isEqual, warnOnUnload])

  // Explicit immediate save (flushes pending changes)
  const saveNow = useCallback(
    async (overrideData?: T): Promise<boolean> => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      const target = overrideData || dataRef.current
      return executeSave(target)
    },
    [executeSave]
  )

  // Restore stored draft
  const restoreDraft = useCallback((): T | null => {
    const existing = readLocalDraft()
    if (existing && existing.data) {
      if (onRestore) {
        onRestore(existing.data)
      }
      lastSavedSnapshotRef.current = existing.data
      setLastSavedAt(new Date(existing.savedAt))
      setStatus('SAVED')
      return existing.data
    }
    return null
  }, [readLocalDraft, onRestore])

  const discardDraft = useCallback(() => {
    clearDraft()
    setStatus('IDLE')
  }, [clearDraft])

  const retry = useCallback(async (): Promise<boolean> => {
    return saveNow()
  }, [saveNow])

  const isDirty = status === 'UNSAVED' || status === 'SAVING'

  return {
    status,
    lastSavedAt,
    error,
    isDirty,
    saveCount,
    hasLocalDraft,
    saveNow,
    restoreDraft,
    clearDraft,
    discardDraft,
    retry,
  }
}
