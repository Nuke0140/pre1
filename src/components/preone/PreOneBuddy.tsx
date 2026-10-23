'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Heart, HelpCircle, X } from 'lucide-react'
import './preone-buddy.css'

export type BuddyReaction = 'welcome' | 'happy' | 'explore' | 'oops' | 'thinking' | 'sleep'
type BuddyEvent = CustomEvent<{ reaction?: BuddyReaction; message?: string }>

const copy: Record<BuddyReaction, { label: string; message: string }> = {
  welcome: { label: 'Welcome', message: 'Hi! I’m PreOne Buddy. Let’s get started!' },
  happy: { label: 'Celebrating', message: 'Great work! You did it. ✨' },
  explore: { label: 'Explore', message: 'Ready to explore this part of PreOne?' },
  oops: { label: 'Gentle help', message: 'No worries. Let’s check that together.' },
  thinking: { label: 'Thinking', message: 'One moment — let’s work through this.' },
  sleep: { label: 'Resting', message: 'I’m here whenever you need a hand.' },
}

/** Send a non-sensitive event from a client component to trigger a reaction. */
export function triggerBuddyReaction(reaction: BuddyReaction, message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('preone:buddy', { detail: { reaction, message } }))
  }
}

export function PreOneBuddy() {
  const pathname = usePathname()
  const [reaction, setReaction] = useState<BuddyReaction>('welcome')
  const [message, setMessage] = useState(copy.welcome.message)
  const [open, setOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (messageTimer.current) clearTimeout(messageTimer.current)
    idleTimer.current = null
    messageTimer.current = null
  }, [])

  const reactTo = useCallback((next: BuddyReaction, customMessage?: string) => {
    setReaction(next)
    setMessage(customMessage || copy[next].message)
    if (messageTimer.current) clearTimeout(messageTimer.current)
    if (next !== 'sleep') {
      setOpen(true)
      messageTimer.current = setTimeout(() => setOpen(false), 4200)
    }
  }, [])

  const resetIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      setReaction('sleep')
      setMessage(copy.sleep.message)
      setOpen(false)
    }, 60000)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    updateMotion()
    media.addEventListener?.('change', updateMotion)

    const onBuddyEvent = (event: Event) => {
      const detail = (event as BuddyEvent).detail
      if (detail?.reaction && detail.reaction in copy) reactTo(detail.reaction, detail.message)
      resetIdle()
    }
    const onActivity = () => resetIdle()
    window.addEventListener('preone:buddy', onBuddyEvent)
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    resetIdle()

    return () => {
      clearTimers()
      media.removeEventListener?.('change', updateMotion)
      window.removeEventListener('preone:buddy', onBuddyEvent)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [clearTimers, reactTo, resetIdle])

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    reactTo('explore')
    resetIdle()
  }, [pathname, reactTo, resetIdle])

  const toggleOpen = () => {
    if (!open) {
      setMessage(reaction === 'sleep' ? copy.sleep.message : copy[reaction].message)
      setOpen(true)
      if (reaction === 'sleep') setReaction('welcome')
    } else setOpen(false)
    resetIdle()
  }

  return (
    <div className={`preone-buddy ${reducedMotion ? 'preone-buddy--reduced' : ''}`} data-reaction={reaction}>
      {open && (
        <div className="preone-buddy__bubble" role="status" aria-live="polite">
          <span>{message}</span>
          <button type="button" className="preone-buddy__close" aria-label="Dismiss Buddy message" onClick={() => setOpen(false)}><X size={14} /></button>
        </div>
      )}
      <button type="button" className="preone-buddy__button" onClick={toggleOpen}
        aria-label={open ? 'Close PreOne Buddy message' : 'Open PreOne Buddy help'}
        aria-expanded={open} aria-controls="preone-buddy-help" title="PreOne Buddy — help and reactions">
        <span className="preone-buddy__halo" aria-hidden="true" />
        <img className="preone-buddy__image" src="/animations/home/preo_learning_mascot.webp"
          alt="" width="88" height="88" loading="lazy" decoding="async" />
        <span className="preone-buddy__badge" aria-hidden="true">
          {reaction === 'happy' ? <Heart size={14} fill="currentColor" /> : <HelpCircle size={14} />}
        </span>
      </button>
      <span id="preone-buddy-help" className="sr-only">PreOne Buddy: {copy[reaction].label}. Activate the mascot to read its message.</span>
    </div>
  )
}
