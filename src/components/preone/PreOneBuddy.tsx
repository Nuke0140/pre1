'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { HelpCircle, X } from 'lucide-react'
import type { AnimationItem } from 'lottie-web'
import './preone-buddy-live.css'

type Reaction = 'welcome' | 'happy' | 'explore' | 'oops' | 'thinking' | 'sleep'
type BuddyEvent = CustomEvent<{ reaction?: Reaction; message?: string }>
const messages: Record<Reaction, string> = {
  welcome: 'Hi! I’m PreOne Buddy. Let’s get started!',
  happy: 'Great work! You did it. ✨',
  explore: 'Ready to explore this part of PreOne?',
  oops: 'No worries. Let’s check that together.',
  thinking: 'One moment — let’s work through this.',
  sleep: 'I’m here whenever you need a hand.',
}
export function triggerBuddyReaction(reaction: Reaction, message?: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('preone:buddy', { detail: { reaction, message } }))
}

/** Uses the existing 83 KB embedded-image Lottie asset; animation work pauses when hidden/offscreen. */
export function PreOneBuddy() {
  const pathname = usePathname()
  const host = useRef<HTMLDivElement>(null)
  const animation = useRef<AnimationItem | null>(null)
  const [reaction, setReaction] = useState<Reaction>('welcome')
  const [message, setMessage] = useState(messages.welcome)
  const [open, setOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [visible, setVisible] = useState(true)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (reducedMotion || !host.current) return
    let cancelled = false
    let instance: AnimationItem | null = null
    const start = async () => {
      const lottie = (await import('lottie-web')).default
      if (cancelled || !host.current) return
      instance = lottie.loadAnimation({
        container: host.current,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '/animations/home/preo_learning_mascot.json',
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true, hideOnTransparent: true },
      })
      animation.current = instance
      if (visible && !document.hidden) instance.play()
    }
    void start()
    return () => {
      cancelled = true
      instance?.destroy()
      animation.current = null
    }
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion || !animation.current) return
    if (visible && !document.hidden) animation.current.play()
    else animation.current.pause()
  }, [visible, reducedMotion])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) animation.current?.pause()
      else if (visible && !reducedMotion) animation.current?.play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const observer = host.current ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 }) : null
    if (host.current) observer?.observe(host.current)
    return () => { document.removeEventListener('visibilitychange', onVisibility); observer?.disconnect() }
  }, [visible, reducedMotion])

  useEffect(() => {
    const idle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setReaction('sleep')
        setMessage(messages.sleep)
        setOpen(false)
        animation.current?.pause()
      }, 60000)
    }
    const onEvent = (event: Event) => {
      const detail = (event as BuddyEvent).detail
      if (!detail?.reaction || !(detail.reaction in messages)) return
      setReaction(detail.reaction)
      setMessage(detail.message || messages[detail.reaction])
      setOpen(true)
      if (messageTimer.current) clearTimeout(messageTimer.current)
      messageTimer.current = setTimeout(() => setOpen(false), 4200)
      if (!reducedMotion && visible && !document.hidden) animation.current?.play()
      idle()
    }
    const activity = () => { idle(); if (reaction === 'sleep' && !reducedMotion && visible && !document.hidden) animation.current?.play() }
    window.addEventListener('preone:buddy', onEvent)
    window.addEventListener('pointerdown', activity, { passive: true })
    window.addEventListener('keydown', activity)
    idle()
    return () => {
      window.removeEventListener('preone:buddy', onEvent)
      window.removeEventListener('pointerdown', activity)
      window.removeEventListener('keydown', activity)
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (messageTimer.current) clearTimeout(messageTimer.current)
    }
  }, [reaction, reducedMotion, visible])

  useEffect(() => {
    triggerBuddyReaction(pathname === '/' ? 'welcome' : 'explore')
  }, [pathname])

  const toggle = () => {
    setOpen((current) => !current)
    if (reaction === 'sleep') {
      setReaction('welcome')
      setMessage(messages.welcome)
      if (!reducedMotion && visible && !document.hidden) animation.current?.play()
    }
  }

  return (
    <div className="preone-buddy-live" data-reaction={reaction}>
      {open && <div className="preone-buddy-live__bubble" role="status" aria-live="polite">
        <span>{message}</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss Buddy message"><X size={14} /></button>
      </div>}
      <button className="preone-buddy-live__button" type="button" onClick={toggle} aria-label="Open PreOne Buddy help" aria-expanded={open}>
        {reducedMotion
          ? <img src="/animations/home/preo_learning_mascot.webp" alt="" width="88" height="88" loading="lazy" decoding="async" />
          : <div className="preone-buddy-live__animation" ref={host} aria-hidden="true" />}
        <span className="preone-buddy-live__badge" aria-hidden="true"><HelpCircle size={14} /></span>
      </button>
    </div>
  )
}
