'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface AdmissionsRibbonCounts {
  enquiries: number
  'follow-ups': number
  applications: number
  admitted: number
  'classroom-placements': number
  reports: number
}

export interface AdmissionsMetrics {
  enquiries: {
    total: number
    new: number
    contacted: number
    qualified: number
    nurture: number
  }
  followUps: {
    total: number
    allOpen: number
    dueToday: number
    overdue: number
    upcoming: number
    completed: number
  }
  applications: {
    total: number
    submitted: number
    underReview: number
    approved: number
    offerSent: number
    offerAccepted: number
    waitlisted: number
    admitted: number
  }
  classrooms: number
}

export interface AdmissionsSummaryResponse {
  counts: AdmissionsRibbonCounts
  metrics: AdmissionsMetrics
}

export const DEFAULT_RIBBON_COUNTS: AdmissionsRibbonCounts = {
  enquiries: 0,
  'follow-ups': 0,
  applications: 0,
  admitted: 0,
  'classroom-placements': 0,
  reports: 0,
}

// Global In-Memory Cache & In-Flight Dedup
const countsCache = new Map<string, AdmissionsSummaryResponse>()
const inFlightRequests = new Map<string, Promise<AdmissionsSummaryResponse | null>>()
const listeners = new Set<() => void>()

export function invalidateAdmissionsCounts() {
  countsCache.clear()
  inFlightRequests.clear()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('preone:admissions-mutated'))
  }
  listeners.forEach((notify) => {
    try {
      notify()
    } catch {
      // ignore listener errors
    }
  })
}

function getCacheKey(branchId?: string, sessionId?: string) {
  return `${branchId || '__ALL_BRANCHES__'}:${sessionId || '__ALL_SESSIONS__'}`
}

async function fetchSummary(branchId?: string, sessionId?: string): Promise<AdmissionsSummaryResponse | null> {
  const key = getCacheKey(branchId, sessionId)

  // Deduplicate concurrent in-flight requests
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!
  }

  const promise = (async () => {
    try {
      const qParams = new URLSearchParams()
      if (branchId && branchId !== '__ALL_BRANCHES__') {
        qParams.set('branchId', branchId)
      } else if (branchId === '__ALL_BRANCHES__') {
        qParams.set('branchId', '__ALL_BRANCHES__')
      }
      if (sessionId && sessionId !== '__ALL_SESSIONS__') {
        qParams.set('academicYearId', sessionId)
      }

      const url = `/api/v1/admissions/summary${qParams.toString() ? `?${qParams.toString()}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success && json.data) {
        countsCache.set(key, json.data)
        return json.data as AdmissionsSummaryResponse
      }
      return null
    } catch (err) {
      console.warn('Failed to fetch admissions summary counts:', err)
      return null
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, promise)
  return promise
}

export function useAdmissionsCounts(branchId?: string, sessionId?: string) {
  const key = getCacheKey(branchId, sessionId)
  const cached = countsCache.get(key)

  const [data, setData] = useState<AdmissionsSummaryResponse | null>(cached || null)
  const [loading, setLoading] = useState<boolean>(!cached)
  const isMountedRef = useRef(true)

  const loadData = useCallback(async (force = false) => {
    if (!force) {
      const existing = countsCache.get(key)
      if (existing) {
        setData(existing)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    const result = await fetchSummary(branchId, sessionId)
    if (isMountedRef.current) {
      if (result) {
        setData(result)
      }
      setLoading(false)
    }
  }, [branchId, sessionId, key])

  useEffect(() => {
    isMountedRef.current = true
    loadData()

    const handleInvalidation = () => {
      if (isMountedRef.current) {
        loadData(true)
      }
    }

    listeners.add(handleInvalidation)
    if (typeof window !== 'undefined') {
      window.addEventListener('preone:admissions-mutated', handleInvalidation)
    }

    return () => {
      isMountedRef.current = false
      listeners.delete(handleInvalidation)
      if (typeof window !== 'undefined') {
        window.removeEventListener('preone:admissions-mutated', handleInvalidation)
      }
    }
  }, [loadData])

  return {
    counts: data?.counts || DEFAULT_RIBBON_COUNTS,
    metrics: data?.metrics || null,
    loading,
    refetch: () => loadData(true),
  }
}
