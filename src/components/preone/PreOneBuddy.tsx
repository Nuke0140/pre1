'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { HelpCircle, X, Sparkles, Smile, Lightbulb, Moon, Eye, FileText, AlertTriangle, ShieldCheck, Lock } from 'lucide-react'
import { PreOMascot3D, type PreOReaction, type ModelStatus } from './PreOMascot3D'
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
  
  // Default tab is strictly 'concept' (Approved Design) so crude prototype is never shown by default
  const [modalTab, setModalTab] = useState<'concept' | '3d_prod' | 'diagnostic'>('concept')
  const [diagnosticConfirmed, setDiagnosticConfirmed] = useState(false)
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    isProduction3D: false,
    isPrototype: false,
    isPending: true,
    availableClips: [],
  })
  
  const [reducedMotion, setReducedMotion] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
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

  const handleCopyPrompt = async () => {
    try {
      const res = await fetch('/mascot-kit/PreO_Production_Prompt_Suite.md')
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 3000)
    } catch {
      // Fallback
    }
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
                  style={{ height: 24, padding: '0 6px', fontSize: 11, borderRadius: 6, background: '#ede9fe', color: '#5b21b6', fontWeight: 600 }}
                  onClick={() => setShowStudioModal(true)}
                >
                  Mascot Studio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Mascot Button — Displays dedicated approved square avatar */}
        <button
          className="preone-buddy-live__button"
          type="button"
          onClick={toggle}
          aria-label="Open PreO Mascot companion"
          aria-expanded={open}
          title="PreO Explorer — PreOne Mascot (Approved Design)"
        >
          {reducedMotion ? (
            <img
              src="/images/preo-approved-avatar.webp"
              alt="PreO The Explorer Mascot"
              width="82"
              height="82"
              loading="eager"
              decoding="async"
              style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          ) : (
            <PreOMascot3D
              reaction={reaction as PreOReaction}
              mode="auto"
              framing="companion"
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

      {/* Expanded Mascot Studio Modal */}
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
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            padding: 16,
          }}
          onClick={() => setShowStudioModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 24,
              boxShadow: '0 25px 60px -15px rgba(109, 40, 217, 0.35)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              overflow: 'hidden',
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'auto',
              maxHeight: '92vh',
              overflowY: 'auto',
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
                zIndex: 20,
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 14, width: '100%' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5f3ff', padding: '3px 10px', borderRadius: 999, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PreOne Mascot Studio
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', margin: '2px 0 6px' }}>
                PreO: The Explorer
              </h3>

              {/* Navigation Tabs (Default: Approved Design) */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: modalTab === 'concept' ? '#7c3aed' : '#e2e8f0',
                    background: modalTab === 'concept' ? '#7c3aed' : '#ffffff',
                    color: modalTab === 'concept' ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setModalTab('concept')}
                >
                  Approved Design
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: modalTab === '3d_prod' ? '#7c3aed' : '#e2e8f0',
                    background: modalTab === '3d_prod' ? '#7c3aed' : '#ffffff',
                    color: modalTab === '3d_prod' ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setModalTab('3d_prod')}
                >
                  Production 3D
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: modalTab === 'diagnostic' ? '#d97706' : '#e2e8f0',
                    background: modalTab === 'diagnostic' ? '#d97706' : '#ffffff',
                    color: modalTab === 'diagnostic' ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setModalTab('diagnostic')}
                >
                  Rig Diagnostic
                </button>
              </div>
            </div>

            {/* TAB 1: APPROVED CHARACTER DESIGN (DEFAULT) */}
            {modalTab === 'concept' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Approved Turnaround Views */}
                <div
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    border: '1px solid #ddd6fe',
                    overflow: 'hidden',
                    background: '#f8fafc',
                    boxShadow: '0 4px 16px rgba(109, 40, 217, 0.08)',
                  }}
                >
                  <img
                    src="/images/preo-approved-turnaround.webp"
                    alt="PreO Turnaround Views (Front, 3/4, Side, Back)"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    loading="eager"
                  />
                  <div style={{ padding: '6px 10px', background: '#ede9fe', fontSize: 11, color: '#5b21b6', textAlign: 'center', fontWeight: 600 }}>
                    Official Turnaround Views (Front &bull; 3/4 Front &bull; Side &bull; Back)
                  </div>
                </div>

                {/* Approved Expressions Strip */}
                <div
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  <img
                    src="/images/preo-approved-expressions.webp"
                    alt="PreO Facial Expressions (Normal, Happy, Wink, Surprised, Thinking)"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    loading="lazy"
                  />
                  <div style={{ padding: '4px 10px', background: '#f8fafc', fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                    Target Expressions: Normal &bull; Happy &bull; Wink &bull; Surprised &bull; Thinking
                  </div>
                </div>

                {/* Target Production Specifications */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={16} color="#7c3aed" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b' }}>
                        Production Specifications
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '1px 8px', borderRadius: 999 }}>
                      Pixar Stylized
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 11, color: '#475569' }}>
                    <div>&bull; <strong>Polygons:</strong> ~18,420 quads/tris</div>
                    <div>&bull; <strong>Vertices:</strong> ~12,306 verts</div>
                    <div>&bull; <strong>Textures:</strong> 2048&times;2048 PBR</div>
                    <div>&bull; <strong>Rig:</strong> 20-bone Skinned Humanoid</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #7c3aed',
                      background: copiedPrompt ? '#10b981' : '#7c3aed',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <FileText size={14} />
                    {copiedPrompt ? 'Copied 3D Brief!' : 'Copy Blender Master Brief'}
                  </button>
                  <a
                    href="/images/preo_explorer_concept.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Eye size={14} /> Full Sheet
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTION 3D MODEL (Honest status & live mesh viewport) */}
            {modalTab === '3d_prod' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 3D Viewport Box */}
                <div
                  style={{
                    width: '100%',
                    height: 290,
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
                    mode="auto"
                    framing="full_body"
                    interactive={true}
                    autoRotate={false}
                    width="100%"
                    height="100%"
                    cameraFov={32}
                    showStatusBadge={true}
                    onStatusChange={setModelStatus}
                  />
                </div>

                {/* Honest Pipeline Status Notification */}
                {modelStatus.isPending && (
                  <div
                    style={{
                      background: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 11,
                      color: '#4338ca',
                      lineHeight: 1.45,
                    }}
                  >
                    <strong>Approved Concept Reference Active:</strong> The production 3D model (<code>PreO_Explorer_Production.glb</code>) is pending artist export. The live Three.js viewport will automatically switch to genuine 3D the moment the file is placed in <code>public/models/</code>.
                  </div>
                )}

                {/* Animation Trigger Buttons (Enabled only when genuine 3D animations are loaded) */}
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {!modelStatus.isProduction3D && <Lock size={12} />}
                    <span>{modelStatus.isProduction3D ? 'Animation Clips' : 'Animation Controls (Active in Live 3D)'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    <button
                      type="button"
                      disabled={!modelStatus.isProduction3D}
                      onClick={() => handleAction('welcome')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'welcome' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'welcome' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 11,
                        color: modelStatus.isProduction3D ? '#4338ca' : '#94a3b8',
                        cursor: modelStatus.isProduction3D ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        opacity: modelStatus.isProduction3D ? 1 : 0.6,
                      }}
                    >
                      <Smile size={16} />
                      <span>Wave</span>
                    </button>
                    <button
                      type="button"
                      disabled={!modelStatus.isProduction3D}
                      onClick={() => handleAction('happy')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'happy' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'happy' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 11,
                        color: modelStatus.isProduction3D ? '#4338ca' : '#94a3b8',
                        cursor: modelStatus.isProduction3D ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        opacity: modelStatus.isProduction3D ? 1 : 0.6,
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Cheer</span>
                    </button>
                    <button
                      type="button"
                      disabled={!modelStatus.isProduction3D}
                      onClick={() => handleAction('thinking')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'thinking' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'thinking' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 11,
                        color: modelStatus.isProduction3D ? '#4338ca' : '#94a3b8',
                        cursor: modelStatus.isProduction3D ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        opacity: modelStatus.isProduction3D ? 1 : 0.6,
                      }}
                    >
                      <Lightbulb size={16} />
                      <span>Think</span>
                    </button>
                    <button
                      type="button"
                      disabled={!modelStatus.isProduction3D}
                      onClick={() => handleAction('sleep')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 12,
                        border: reaction === 'sleep' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        background: reaction === 'sleep' ? '#f5f3ff' : '#ffffff',
                        fontWeight: 600,
                        fontSize: 11,
                        color: modelStatus.isProduction3D ? '#4338ca' : '#94a3b8',
                        cursor: modelStatus.isProduction3D ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        opacity: modelStatus.isProduction3D ? 1 : 0.6,
                      }}
                    >
                      <Moon size={16} />
                      <span>Sleep</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RIG DIAGNOSTICS (Explicitly guarded & isolated) */}
            {modalTab === 'diagnostic' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Warning Card */}
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.45 }}>
                    <strong>Diagnostic Blockout Only — Not Approved Character:</strong> This Phase 2 prototype contains 37 unskinned primitive shapes (~220 vertices each) created for initial bone-rotation testing. It does not represent the approved PreO character mesh.
                  </div>
                </div>

                {!diagnosticConfirmed ? (
                  <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Technical Inspection Mode
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14, maxWidth: 320, margin: '0 auto 14px' }}>
                      To prevent confusing the unskinned prototype with the final character, diagnostic rendering requires confirmation.
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiagnosticConfirmed(true)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 10,
                        border: '1px solid #d97706',
                        background: '#d97706',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Load Diagnostic Prototype
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: '100%',
                        height: 260,
                        borderRadius: 20,
                        background: 'radial-gradient(circle at 50% 50%, #fefce8 0%, #fef3c7 100%)',
                        border: '1px solid #fde68a',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <PreOMascot3D
                        reaction={reaction as PreOReaction}
                        mode="prototype_diagnostic"
                        framing="full_body"
                        interactive={true}
                        width="100%"
                        height="100%"
                        cameraFov={36}
                        showStatusBadge={true}
                      />
                    </div>

                    {/* Verified Prototype Limitations */}
                    <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#b45309' }}>
                      <div>&bull; <strong>Skin Weights:</strong> 0/37 primitives with <code>JOINTS_0/WEIGHTS_0</code></div>
                      <div>&bull; <strong>Mesh Type:</strong> 37 unskinned primitive boxes/cylinders</div>
                      <div>&bull; <strong>Status:</strong> Unsuitable for production user-facing display</div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 12, color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
              &ldquo;{message}&rdquo;
            </div>
          </div>
        </div>
      )}
    </>
  )
}
