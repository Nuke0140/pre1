'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationItem } from 'lottie-web'

const clips = [
  { name: 'idle_breathe', mode: 'Loop', state: 'Prototype clip listed' },
  { name: 'wave_welcome', mode: 'One-shot', state: 'Prototype clip listed' },
  { name: 'thinking', mode: 'Loop while active', state: 'Prototype clip listed' },
  { name: 'celebrate', mode: 'One-shot', state: 'Prototype clip listed' },
  { name: 'sleep', mode: 'Loop while asleep', state: 'Prototype clip listed' },
]

export default function PreOMascotPreviewPage() {
  const host = useRef<HTMLDivElement>(null)
  const animation = useRef<AnimationItem | null>(null)
  const [failed, setFailed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

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
    let item: AnimationItem | null = null
    const start = async () => {
      try {
        const lottie = (await import('lottie-web')).default
        if (cancelled || !host.current) return
        item = lottie.loadAnimation({
          container: host.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/animations/home/preo_learning_mascot.json',
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        })
        animation.current = item
        item.addEventListener('data_failed', () => setFailed(true))
      } catch {
        setFailed(true)
      }
    }
    void start()
    return () => {
      cancelled = true
      item?.destroy()
      animation.current = null
    }
  }, [reducedMotion])

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">PreOne · Mascot Lab</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meet PreO</h1>
        <p className="max-w-2xl text-slate-600">A visible preview of the current mascot artwork and animation asset, with the 3D production gates documented below.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-8 shadow-sm">
          <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
            {!reducedMotion && !failed && <div ref={host} className="h-full w-full" aria-label="Animated PreO mascot preview" />}
            {(reducedMotion || failed) && <img src="/animations/home/preo_learning_mascot.webp" alt="PreO learning mascot" className="h-full w-full object-contain" />}
          </div>
          <p className="mt-3 text-center text-sm font-medium text-slate-700">{failed ? 'Static preview · animation could not load' : reducedMotion ? 'Static preview · reduced motion enabled' : 'Animated mascot preview'}</p>
          <p className="mt-1 text-center text-xs text-slate-500">If animation fails, the artwork remains visible.</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Production readiness</h2>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">3D rig: QA required</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">The supplied GLB is a structural prototype, not a production-skinned character. Static inspection found no mesh primitives with both JOINTS_0 and WEIGHTS_0, so smooth skin deformation is not yet verified.</p>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ Existing mascot artwork and Lottie asset available</li>
            <li>✓ Static image fallback for reduced-motion or load failure</li>
            <li>✓ Five required clip names documented in the handoff</li>
            <li>○ Vertex weights and deformation QA in Blender</li>
            <li>○ Playback QA and crossfades in the browser</li>
            <li>○ Final optimized GLB and source project delivery</li>
          </ul>
          <p className="text-xs leading-5 text-slate-500">This page deliberately does not label the current GLB as production-ready. The validated 3D binary must be added to the repository after rigging and playback checks.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Animation handoff</h2>
        <p className="mt-1 text-sm text-slate-600">Expected runtime behavior for the five clips in the 3D handoff. Names are present in the prototype report; visual playback is still unverified.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clips.map((clip) => (
            <article key={clip.name} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-mono text-sm font-semibold text-violet-700">{clip.name}</p>
              <p className="mt-1 text-sm text-slate-600">{clip.mode}</p>
              <p className="mt-2 text-xs text-amber-700">{clip.state}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
