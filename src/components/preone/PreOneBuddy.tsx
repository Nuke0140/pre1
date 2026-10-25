'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { HelpCircle, X, Sparkles, MessageSquare, Moon, Smile, Lightbulb } from 'lucide-react'
import { PreOMascot3D, type PreOReaction } from './PreOMascot3D'
import './preone-buddy-live.css'

export type BuddyReaction = 'welcome' | 'happy' | 'explore' | 'oops' | 'thinking' | 'sleep'
export type Reaction = BuddyReaction

type BuddyEvent = CustomEvent<{ reaction?: Reaction; message?: string }>

const messages: Record<Reaction, string> = {
  welcome: 'Hi! I’m PreO. Welcome to PreOne!',
  happy: 'Great work! Everything looks perfect. ✨',
  explore: 'Ready to explore this part of PreOne?',
  oops: 'No worries. Let’s check that together.',
  thinking: 'One moment — let’s work through this.',
  sleep: 'I’m resting here whenever you need a hand. Zzz...',
}

export function triggerBuddyReaction(reaction: Reaction, message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('preone:buddy', { detail: { reaction, message } }))
  }
}

export function PreOneBuddy() {
  const pathname = usePathname()
  const [reaction, setReaction] = useState<Reaction>('welcome')
  const [message, setMessage] = useState(messages.welcome)
  const [open, setOpen] = useState(false)
  const [showStudioModal, setShowStudioModal] = useState(false)
  const [modalTab, setModalTab] = useState<'3d' | 'concept'>('3d')
  const [reducedMotion, setReducedMotion] = useState(false)
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
    const idle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        setReaction('sleep')
        setMessage(messages.sleep)
      }, 60000)
    }

    const onEvent = (event: Event) => {
      const detail = (event as BuddyEvent).detail
      if (!detail?.reaction || !(detail.reaction in messages)) return
      setReaction(detail.reaction)
      setMessage(detail.message || messages[detail.reaction])
      setOpen(true)
      if (messageTimer.current) clearTimeout(messageTimer.current)
      messageTimer.current = setTimeout(() => setOpen(false), 5000)
      idle()
    }

    const activity = () => {
      idle()
      if (reaction === 'sleep') {
        setReaction('welcome')
        setMessage(messages.welcome)
      }
    }

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
  }, [reaction])

  useEffect(() => {
    triggerBuddyReaction(pathname === '/' ? 'welcome' : 'explore')
  }, [pathname])

  const toggle = () => {
    setOpen((current) => !current)
    if (reaction === 'sleep') {
      setReaction('welcome')
      setMessage(messages.welcome)
    }
  }

  const handleAction = (newReaction: Reaction) => {
    setReaction(newReaction)
    setMessage(messages[newReaction])
    setOpen(true)
  }

  return (
    <>
      <div className="preone-buddy-live" data-reaction={reaction}>
        {open && (
          <div className="preone-buddy-live__bubble" role="status" aria-live="polite">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--foreground, #1e1b4b)' }}>{message}</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Dismiss Buddy message">
                  <X size={14} />
                </button>
              </div>

              {/* Quick interactive action buttons */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  style={{ height: 24, padding: '0 6px', fontSize: 11, borderRadius: 6, background: '#f5f3ff', color: '#6d28d9' }}
                  onClick={() => handleAction('welcome')}
                >
                  <Smile size={12} style={{ marginRight: 3 }} /> Wave
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  style={{ height: 24, padding: '0 6px', fontSize: 11, borderRadius: 6, background: '#f5f3ff', color: '#6d28d9' }}
                  onClick={() => handleAction('happy')}
                >
                  <Sparkles size={12} style={{ marginRight: 3 }} /> Cheer
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  style={{ height: 24, padding: '0 6px', fontSize: 11, borderRadius: 6, background: '#f5f3ff', color: '#6d28d9' }}
                  onClick={() => handleAction('thinking')}
                >
                  <Lightbulb size={12} style={{ marginRight: 3 }} /> Think
                </button>
                <button
                  type="button"
                  className="btn btn-ghost text-xs"
                  style={{ height: 24, padding: '0 6px', fontSize: 11, borderRadius: 6, background: '#f5f3ff', color: '#6d28d9' }}
                  onClick={() => setShowStudioModal(true)}
                >
                  3D View
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          className="preone-buddy-live__button"
          type="button"
          onClick={toggle}
          aria-label="Open PreO Mascot companion"
          aria-expanded={open}
          title="PreO 3D Mascot — Click to interact"
        >
          {reducedMotion ? (
            <img src="/animations/home/preo_learning_mascot.webp" alt="PreO" width="88" height="88" loading="lazy" decoding="async" />
          ) : (
            <PreOMascot3D
              reaction={reaction as PreOReaction}
              interactive={true}
              width="100%"
              height="100%"
            />
          )}
          <span className="preone-buddy-live__badge" aria-hidden="true">
            <HelpCircle size={14} />
          </span>
        </button>
      </div>

      {/* Expanded 3D Mascot Studio Modal */}
      {showStudioModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: 16,
          }}
          onClick={() => setShowStudioModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              background: 'linear-gradient(180deg, #ffffff 0%, #fdfcff 100%)',
              borderRadius: 24,
              boxShadow: '0 25px 50px -12px rgba(109, 40, 217, 0.25)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              overflow: 'hidden',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowStudioModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                background: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', margin: '0 0 4px' }}>
                PreO Mascot Companion
              </h3>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                <button
                  type="button"
                  style={{
                    padding: '3px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid #7c3aed',
                    background: modalTab === '3d' ? '#7c3aed' : '#ffffff',
                    color: modalTab === '3d' ? '#ffffff' : '#6d28d9',
                    cursor: 'pointer',
                  }}
                  onClick={() => setModalTab('3d')}
                >
                  Interactive 3D
                </button>
                <button
                  type="button"
                  style={{
                    padding: '3px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid #7c3aed',
                    background: modalTab === 'concept' ? '#7c3aed' : '#ffffff',
                    color: modalTab === 'concept' ? '#ffffff' : '#6d28d9',
                    cursor: 'pointer',
                  }}
                  onClick={() => setModalTab('concept')}
                >
                  Character Sheet
                </button>
              </div>
            </div>

            {modalTab === '3d' ? (
              <>
                {/* 3D Canvas Box */}
                <div
                  style={{
                    width: '100%',
                    height: 280,
                    borderRadius: 20,
                    background: 'radial-gradient(circle at 50% 50%, #f5f3ff 0%, #ede9fe 100%)',
                    border: '1px solid #ddd6fe',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 2px 10px rgba(109, 40, 217, 0.08)',
                  }}
                >
                  <PreOMascot3D
                    reaction={reaction as PreOReaction}
                    interactive={true}
                    autoRotate={false}
                    width="100%"
                    height="100%"
                    cameraFov={32}
                  />
                </div>

                {/* Animation reaction trigger buttons */}
                <div style={{ width: '100%', marginTop: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, textAlign: 'center' }}>
                    Animations & Actions
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleAction('welcome')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'welcome' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'welcome' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 12,
                        color: '#4338ca',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Smile size={16} />
                      <span>Wave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('happy')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'happy' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'happy' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 12,
                        color: '#4338ca',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Cheer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('thinking')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'thinking' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'thinking' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 12,
                        color: '#4338ca',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Lightbulb size={16} />
                      <span>Think</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('sleep')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'sleep' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'sleep' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 12,
                        color: '#4338ca',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Moon size={16} />
                      <span>Nap</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                  borderRadius: 16,
                  border: '1px solid #ddd6fe',
                  overflow: 'hidden',
                  background: '#f8fafc',
                }}
              >
                <img
                  src="/images/preo_explorer_concept.jpg"
                  alt="PreO The Explorer Master Asset Sheet"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{ padding: '8px 12px', fontSize: 11, color: '#475569', textAlign: 'center' }}>
                  Target Production Spec &bull; 18,420 polygons &bull; PBR Materials
                </div>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
              &ldquo;{message}&rdquo;
            </div>
          </div>
        </div>
      )}
    </>
  )
}
