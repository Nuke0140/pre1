'use client'

import { useEffect } from 'react'

/**
 * PreOne — Global Universal Scrollbar System
 *
 * Lightweight, zero-overhead scroll listener that marks actively scrolling containers
 * with `data-scrolling="true"` using passive capture events.
 *
 * Key guarantees:
 * 1. Passive capture: captures scrolls from window, document, nested modals, drawers,
 *    and horizontal table wrappers with zero main-thread blocking.
 * 2. Scoped: only the specific element undergoing scroll activity is marked, avoiding
 *    unintended styling triggers on unrelated parent or sibling containers.
 * 3. Auto-hide timeout: automatically removes `data-scrolling` 1000ms after scrolling stops,
 *    allowing the scrollbar thumb to smoothly fade down into its discreet idle glass state.
 * 4. Memory safe: uses WeakMap for timer tracking so destroyed DOM elements (such as closed
 *    modals or unmounted tabs) are garbage-collected immediately with no memory leaks.
 */
export function GlobalScrollbar() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const activeTimers = new WeakMap<Element, number>()

    const handleScroll = (event: Event) => {
      const target = event.target
      if (!target) return

      let scrollElement: HTMLElement | null = null

      if (target === document || target === window) {
        scrollElement = document.documentElement
      } else if (target instanceof HTMLElement) {
        scrollElement = target
      }

      if (!scrollElement) return

      // Mark the actively scrolling element
      if (scrollElement.getAttribute('data-scrolling') !== 'true') {
        scrollElement.setAttribute('data-scrolling', 'true')
      }

      // Reset the debounce timer for this specific container
      const existingTimer = activeTimers.get(scrollElement)
      if (existingTimer !== undefined) {
        window.clearTimeout(existingTimer)
      }

      const timerId = window.setTimeout(() => {
        if (scrollElement && scrollElement.isConnected) {
          scrollElement.removeAttribute('data-scrolling')
        }
        activeTimers.delete(scrollElement)
      }, 1000)

      activeTimers.set(scrollElement, timerId)
    }

    // Capture: true ensures we detect scrolls on any nested container (table, modal, drawer)
    // Passive: true ensures 60/120fps native scrolling performance with zero jank
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [])

  return null
}

export default GlobalScrollbar
