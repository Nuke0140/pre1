'use client'

import { useEffect, useState, useRef } from 'react'

export interface UseCountUpOptions {
  duration?: number // duration in ms, default 400ms
  start?: number
  decimals?: number
}

/**
 * Lightweight, performant count-up animation hook for KPI numbers.
 * - Uses requestAnimationFrame for 60fps smoothness.
 * - Automatically bypasses animation if prefers-reduced-motion is active.
 * - Handles non-numeric inputs gracefully.
 * - Cleans up animation frame on unmount or target change.
 */
export function useCountUp(
  target: number | string | null | undefined,
  options: UseCountUpOptions = {}
): string | number {
  const { duration = 400, start = 0, decimals } = options

  // If target is null/undefined or non-numeric string (e.g. '—' or 'Pending')
  const numericTarget = typeof target === 'number' ? target : parseFloat(String(target))
  const isNumeric = !isNaN(numericTarget) && target !== null && target !== undefined

  const [displayValue, setDisplayValue] = useState<number>(() => {
    return isNumeric ? start : 0
  })

  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isNumeric) return

    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(numericTarget)
      return
    }

    const startVal = start
    const endVal = numericTarget
    startTimeRef.current = null

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Cubic ease out curve: 1 - Math.pow(1 - progress, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (endVal - startVal) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setDisplayValue(endVal)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [numericTarget, duration, start, isNumeric])

  if (!isNumeric) {
    return target != null ? target : '—'
  }

  if (decimals !== undefined) {
    return displayValue.toFixed(decimals)
  }

  // Format as integer if original target is an integer, or match decimal precision
  const targetStr = String(target)
  if (targetStr.includes('.')) {
    const decPlaces = targetStr.split('.')[1].length
    return displayValue.toFixed(decPlaces)
  }

  return Math.round(displayValue)
}
