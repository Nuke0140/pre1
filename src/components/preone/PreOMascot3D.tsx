'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type PreOReaction = 'welcome' | 'happy' | 'explore' | 'oops' | 'thinking' | 'sleep' | 'idle'
export type MascotMode = 'auto' | 'production_only' | 'prototype_diagnostic' | 'approved_art'
export type CameraFraming = 'companion' | 'full_body' | 'portrait'

export interface ModelStatus {
  isProduction3D: boolean
  isPrototype: boolean
  isPending: boolean
  availableClips: string[]
  error?: string
}

export interface PreOMascot3DProps {
  reaction?: PreOReaction
  mode?: MascotMode
  framing?: CameraFraming
  interactive?: boolean
  autoRotate?: boolean
  className?: string
  style?: React.CSSProperties
  width?: number | string
  height?: number | string
  onClick?: () => void
  cameraFov?: number
  showStatusBadge?: boolean
  customModelUrl?: string
  onStatusChange?: (status: ModelStatus) => void
}

const CLIP_MAP: Record<PreOReaction, string> = {
  idle: 'idle_breathe',
  welcome: 'wave_welcome',
  happy: 'celebrate',
  explore: 'wave_welcome',
  oops: 'thinking',
  thinking: 'thinking',
  sleep: 'sleep',
}

const ONE_SHOT_CLIPS = new Set(['wave_welcome', 'celebrate'])

export function PreOMascot3D({
  reaction = 'idle',
  mode = 'auto',
  framing = 'companion',
  interactive = true,
  autoRotate = false,
  className = '',
  style,
  width = '100%',
  height = '100%',
  onClick,
  cameraFov = 34,
  showStatusBadge = false,
  customModelUrl,
  onStatusChange,
}: PreOMascot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [modelTypeLoaded, setModelTypeLoaded] = useState<'production' | 'prototype' | 'art_fallback' | null>(null)
  const [availableClips, setAvailableClips] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map())
  const activeClipRef = useRef<string | null>(null)
  const modelRootRef = useRef<THREE.Group | null>(null)
  const reqIdRef = useRef<number | null>(null)

  // Interactive mouse tracking
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const mouseCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isHoveredRef = useRef(false)
  const isVisibleRef = useRef(true)

  // Play animation clip with crossfade
  const playClip = useCallback((clipName: string, options?: { loop?: boolean; fade?: number }) => {
    const mixer = mixerRef.current
    if (!mixer) return
    const nextAction = actionsRef.current.get(clipName)
    if (!nextAction) return

    const isOneShot = ONE_SHOT_CLIPS.has(clipName)
    const shouldLoop = options?.loop ?? !isOneShot
    const fadeDuration = options?.fade ?? 0.24

    const currentClip = activeClipRef.current
    const prevAction = currentClip ? actionsRef.current.get(currentClip) : null

    if (prevAction === nextAction && nextAction.isRunning()) {
      return
    }

    nextAction.reset()
    nextAction.enabled = true
    nextAction.setEffectiveWeight(1)
    nextAction.setEffectiveTimeScale(1)
    nextAction.clampWhenFinished = !shouldLoop
    nextAction.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, shouldLoop ? Infinity : 1)
    nextAction.fadeIn(fadeDuration).play()

    if (prevAction && prevAction !== nextAction) {
      prevAction.fadeOut(fadeDuration)
    }

    activeClipRef.current = clipName
  }, [])

  // Reaction prop changed -> play matching clip if 3D model is active
  useEffect(() => {
    const targetClip = CLIP_MAP[reaction] || 'idle_breathe'
    playClip(targetClip)
  }, [reaction, playClip])

  // Setup Three.js scene & load GLB
  useEffect(() => {
    if (mode === 'approved_art') {
      setModelTypeLoaded('art_fallback')
      setLoading(false)
      onStatusChange?.({
        isProduction3D: false,
        isPrototype: false,
        isPending: true,
        availableClips: [],
      })
      return
    }

    const container = containerRef.current
    if (!container) return

    let isDisposed = false

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const aspect = (container.clientWidth || 100) / (container.clientHeight || 100)
    const camera = new THREE.PerspectiveCamera(cameraFov, aspect, 0.1, 100)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Three-point Pixar Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.85)
    keyLight.position.set(2.5, 4.5, 3.5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xddd6fe, 1.25)
    fillLight.position.set(-3.5, 2.0, 2.5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xfae8ff, 1.1)
    rimLight.position.set(0, 4.0, -3.5)
    scene.add(rimLight)

    // Determine target model URL
    // Rule: Never silently load the prototype when production GLB is expected!
    let targetUrl: string | undefined = customModelUrl
    if (!targetUrl) {
      if (mode === 'prototype_diagnostic') {
        targetUrl = '/models/PreO_Explorer_Phase2_Prototype.glb'
      } else {
        // Authoritative production target
        targetUrl = '/models/PreO_Explorer_Production.glb'
      }
    }

    const loader = new GLTFLoader()

    loader.load(
      targetUrl,
      (gltf) => {
        if (isDisposed) return

        const model = gltf.scene
        modelRootRef.current = model

        const isProd = targetUrl?.includes('Production')
        const loadedType = isProd ? 'production' : 'prototype'
        setModelTypeLoaded(loadedType)

        // Enhance PBR materials for goggles and wristbands
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach((mat) => {
              if (mat && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                const stdMat = mat as THREE.MeshStandardMaterial
                const nameLower = (mesh.name + ' ' + stdMat.name).toLowerCase()

                if (nameLower.includes('goggle') || nameLower.includes('lens')) {
                  stdMat.transparent = true
                  stdMat.opacity = 0.78
                  stdMat.roughness = 0.12
                  stdMat.metalness = 0.05
                }
                if (nameLower.includes('wristband') || nameLower.includes('ring')) {
                  stdMat.emissive = new THREE.Color(0x8b5cf6)
                  stdMat.emissiveIntensity = 0.65
                }
              }
            })
          }
        })

        // Bounding box calculation & centering
        const box = new THREE.Box3().setFromObject(model)
        const center = new THREE.Vector3()
        const size = new THREE.Vector3()
        box.getCenter(center)
        box.getSize(size)

        model.position.x = -center.x
        model.position.y = -center.y
        model.position.z = -center.z

        const rootGroup = new THREE.Group()
        rootGroup.add(model)
        scene.add(rootGroup)
        modelRootRef.current = rootGroup

        // Camera Framing calculation
        const fovRad = (camera.fov * Math.PI) / 180
        if (framing === 'companion') {
          // Tight framing focusing on head, goggles, and chest logo
          const companionHeight = size.y * 0.72
          const distance = companionHeight / (2 * Math.tan(fovRad / 2))
          camera.position.set(0, size.y * 0.12, distance)
          camera.lookAt(0, size.y * 0.12, 0)
        } else if (framing === 'portrait') {
          const headHeight = size.y * 0.45
          const distance = headHeight / (2 * Math.tan(fovRad / 2))
          camera.position.set(0, size.y * 0.28, distance)
          camera.lookAt(0, size.y * 0.28, 0)
        } else {
          // Full body framing
          const maxDim = Math.max(size.x, size.y, size.z)
          const distance = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.08
          camera.position.set(0, 0, distance)
          camera.lookAt(0, 0, 0)
        }

        // Set up Animation Mixer
        const mixer = new THREE.AnimationMixer(model)
        mixerRef.current = mixer

        const clipNames: string[] = []
        const actions = new Map<string, THREE.AnimationAction>()
        for (const clip of gltf.animations) {
          clipNames.push(clip.name)
          const action = mixer.clipAction(clip)
          actions.set(clip.name, action)
        }
        actionsRef.current = actions
        setAvailableClips(clipNames)

        // Return to idle when one-shot completes
        mixer.addEventListener('finished', (e: any) => {
          const finishedClipName = e.action?.getClip?.()?.name
          if (finishedClipName && ONE_SHOT_CLIPS.has(finishedClipName)) {
            playClip('idle_breathe', { loop: true })
          }
        })

        // Initial play
        const initialClip = CLIP_MAP[reaction] || 'idle_breathe'
        playClip(initialClip)

        setLoading(false)
        onStatusChange?.({
          isProduction3D: isProd,
          isPrototype: !isProd,
          isPending: false,
          availableClips: clipNames,
        })
      },
      undefined,
      (err) => {
        if (isDisposed) return
        // Production GLB missing -> graceful fallback to approved 2D artwork
        setModelTypeLoaded('art_fallback')
        setLoading(false)
        onStatusChange?.({
          isProduction3D: false,
          isPrototype: false,
          isPending: true,
          availableClips: [],
          error: 'Production 3D model pending',
        })
      }
    )

    // Animation Loop
    const clock = new THREE.Clock()
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      if (!isVisibleRef.current || document.hidden) return

      if (mixerRef.current) {
        mixerRef.current.update(delta)
      }

      // Smooth interactive mouse tilt (only active for genuine 3D models)
      if (modelRootRef.current) {
        const root = modelRootRef.current
        const targetX = interactive && isHoveredRef.current ? mouseTargetRef.current.y * 0.22 : 0
        const targetY = interactive && isHoveredRef.current
          ? mouseTargetRef.current.x * 0.38
          : (autoRotate ? Math.sin(clock.getElapsedTime() * 0.7) * 0.12 : 0)

        mouseCurrentRef.current.x += (targetX - mouseCurrentRef.current.x) * 0.08
        mouseCurrentRef.current.y += (targetY - mouseCurrentRef.current.y) * 0.08

        root.rotation.x = mouseCurrentRef.current.x
        root.rotation.y = mouseCurrentRef.current.y
        root.position.y = Math.sin(clock.getElapsedTime() * 1.6) * 0.028
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(w, h)
        }
      }
    })
    resizeObserver.observe(container)

    // Intersection observer
    const visObserver = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting
    }, { threshold: 0.05 })
    visObserver.observe(container)

    return () => {
      isDisposed = true
      resizeObserver.disconnect()
      visObserver.disconnect()
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current)

      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
      scene.clear()
    }
  }, [cameraFov, framing, mode, customModelUrl, interactive, autoRotate, playClip, onStatusChange])

  // Mouse interaction handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    mouseTargetRef.current = { x, y }
    isHoveredRef.current = true
  }

  const handlePointerLeave = () => {
    isHoveredRef.current = false
    mouseTargetRef.current = { x: 0, y: 0 }
  }

  const handleClick = () => {
    if (modelTypeLoaded === 'production' || modelTypeLoaded === 'prototype') {
      if (activeClipRef.current === 'wave_welcome') {
        playClip('celebrate')
      } else {
        playClip('wave_welcome')
      }
    }
    onClick?.()
  }

  // Approved character artwork path (companion avatar vs full body)
  const approvedArtworkSrc = framing === 'companion'
    ? '/images/preo-approved-avatar.webp'
    : '/images/preo-approved-fullbody.webp'

  return (
    <div
      ref={containerRef}
      className={`preo-mascot-3d ${className}`}
      style={{
        position: 'relative',
        width,
        height,
        cursor: interactive ? 'pointer' : 'default',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      role="img"
      aria-label="PreO: The Explorer — PreOne Mascot"
    >
      {/* Approved 2D Artwork Fallback (when 3D production model is pending or requested) */}
      {modelTypeLoaded === 'art_fallback' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: framing === 'companion' ? 0 : 8,
          }}
        >
          <img
            src={approvedArtworkSrc}
            alt="PreO The Explorer — Approved Concept Reference"
            style={{
              width: '100%',
              height: '100%',
              objectFit: framing === 'companion' ? 'cover' : 'contain',
              objectPosition: framing === 'companion' ? 'center 20%' : 'center center',
              filter: framing === 'companion' ? 'none' : 'drop-shadow(0 8px 20px rgba(109, 40, 217, 0.18))',
              pointerEvents: 'none',
            }}
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '2.5px solid rgba(124, 58, 237, 0.25)',
              borderTopColor: '#7c3aed',
              animation: 'spin 0.75s linear infinite',
            }}
          />
        </div>
      )}

      {/* Status Badges for Studio Modal */}
      {showStatusBadge && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: modelTypeLoaded === 'production'
              ? 'rgba(16, 185, 129, 0.92)'
              : modelTypeLoaded === 'prototype'
              ? 'rgba(217, 119, 6, 0.95)'
              : 'rgba(109, 40, 217, 0.92)',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 999,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 15,
          }}
        >
          {modelTypeLoaded === 'production' && '✓ PreO Production 3D (Live Mesh)'}
          {modelTypeLoaded === 'prototype' && '⚠️ Phase 2 Blockout Rig Test (Diagnostic)'}
          {modelTypeLoaded === 'art_fallback' && 'Production 3D Model Pending — Approved Concept Visual'}
        </div>
      )}
    </div>
  )
}
