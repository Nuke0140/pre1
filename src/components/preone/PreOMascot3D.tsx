'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type PreOReaction = 'welcome' | 'happy' | 'explore' | 'oops' | 'thinking' | 'sleep' | 'idle'

export interface PreOMascot3DProps {
  reaction?: PreOReaction
  interactive?: boolean
  autoRotate?: boolean
  className?: string
  style?: React.CSSProperties
  width?: number | string
  height?: number | string
  onClick?: () => void
  cameraFov?: number
  enableShadows?: boolean
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
  interactive = true,
  autoRotate = false,
  className = '',
  style,
  width = '100%',
  height = '100%',
  onClick,
  cameraFov = 38,
}: PreOMascot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showReferenceFallback, setShowReferenceFallback] = useState(false)

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
    const fadeDuration = options?.fade ?? 0.22

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

  // Reaction prop changed -> play matching clip
  useEffect(() => {
    const targetClip = CLIP_MAP[reaction] || 'idle_breathe'
    playClip(targetClip)
  }, [reaction, playClip])

  // Setup Three.js scene & load GLB
  useEffect(() => {
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
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8)
    keyLight.position.set(2, 4, 3)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xddd6fe, 1.2)
    fillLight.position.set(-3, 2, 2)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xfae8ff, 1.0)
    rimLight.position.set(0, 3, -3)
    scene.add(rimLight)

    // Only use the approved production asset. The prototype is intentionally not
    // shown as a fallback because its blockout appearance does not match the
    // approved PreO character reference.
    const loader = new GLTFLoader()
    const candidateUrls = ['/models/PreO_Explorer_Production.glb']

    const tryLoad = (index: number) => {
      if (index >= candidateUrls.length) {
        if (!isDisposed) {
          setLoadError(null)
          setShowReferenceFallback(true)
          setLoading(false)
        }
        return
      }

      const modelUrl = candidateUrls[index]
      loader.load(
        modelUrl,
        (gltf) => {
          if (isDisposed) return

          const model = gltf.scene
          modelRootRef.current = model

          // Enhance PBR materials if needed (translucent goggles, emissive wristbands)
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
              materials.forEach((mat) => {
                if (mat && (mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const stdMat = mat as THREE.MeshStandardMaterial
                  if (mesh.name.toLowerCase().includes('goggle') || stdMat.name.toLowerCase().includes('goggle')) {
                    stdMat.transparent = true
                    stdMat.opacity = 0.75
                    stdMat.roughness = 0.15
                  }
                  if (mesh.name.toLowerCase().includes('wristband') || stdMat.name.toLowerCase().includes('wristband')) {
                    stdMat.emissive = new THREE.Color(0xa78bfa)
                    stdMat.emissiveIntensity = 0.6
                  }
                }
              })
            }
          })

          // Center model geometry
          const box = new THREE.Box3().setFromObject(model)
          const center = new THREE.Vector3()
          const size = new THREE.Vector3()
          box.getCenter(center)
          box.getSize(size)

          // Center on (0, 0, 0)
          model.position.x = -center.x
          model.position.y = -center.y
          model.position.z = -center.z

          const rootGroup = new THREE.Group()
          rootGroup.add(model)
          scene.add(rootGroup)
          modelRootRef.current = rootGroup

          // Position camera to fit model nicely
          const maxDim = Math.max(size.x, size.y, size.z)
          const fovRad = (camera.fov * Math.PI) / 180
          let cameraDistance = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.15
          camera.position.set(0, 0, cameraDistance)
          camera.lookAt(0, 0, 0)

          // Set up Animation Mixer
          const mixer = new THREE.AnimationMixer(model)
          mixerRef.current = mixer

          // Map clips
          const actions = new Map<string, THREE.AnimationAction>()
          for (const clip of gltf.animations) {
            const action = mixer.clipAction(clip)
            actions.set(clip.name, action)
          }
          actionsRef.current = actions

          // On one-shot finished -> return to idle
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
        },
        undefined,
        () => {
          // Fall back to next candidate URL
          tryLoad(index + 1)
        }
      )
    }

    tryLoad(0)

    // Animation Loop
    const clock = new THREE.Clock()
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      if (!isVisibleRef.current || document.hidden) return

      if (mixerRef.current) {
        mixerRef.current.update(delta)
      }

      // Smooth interactive head/body tilt towards mouse
      if (modelRootRef.current) {
        const root = modelRootRef.current
        const targetX = interactive && isHoveredRef.current ? mouseTargetRef.current.y * 0.25 : 0
        const targetY = interactive && isHoveredRef.current ? mouseTargetRef.current.x * 0.45 : (autoRotate ? Math.sin(clock.getElapsedTime() * 0.8) * 0.15 : 0)

        mouseCurrentRef.current.x += (targetX - mouseCurrentRef.current.x) * 0.08
        mouseCurrentRef.current.y += (targetY - mouseCurrentRef.current.y) * 0.08

        root.rotation.x = mouseCurrentRef.current.x
        root.rotation.y = mouseCurrentRef.current.y

        // Subtle breathing float
        root.position.y = Math.sin(clock.getElapsedTime() * 1.8) * 0.035
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        const height = entry.contentRect.height
        if (width > 0 && height > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = width / height
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(width, height)
        }
      }
    })
    resizeObserver.observe(container)

    // Visibility observer to pause loop offscreen
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
  }, [cameraFov, interactive, autoRotate, playClip])

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
    // Play wave or celebrate on tap
    if (activeClipRef.current === 'wave_welcome') {
      playClip('celebrate')
    } else {
      playClip('wave_welcome')
    }
    onClick?.()
  }

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
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      role="img"
      aria-label="Interactive 3D PreO Preschool Mascot"
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid rgba(124, 58, 237, 0.25)',
              borderTopColor: '#7c3aed',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
      {showReferenceFallback && (
        <div
          className="preo-mascot-3d__reference-fallback"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #ffffff 0%, #ede9fe 100%)',
            borderRadius: 'inherit',
          }}
        >
          <img
            src="/images/preo_explorer_concept.jpg"
            alt="PreO: The Explorer approved character reference; production 3D model is not installed yet"
            draggable={false}
            style={{
              display: 'block',
              width: 'auto',
              height: '100%',
              maxWidth: 'none',
              aspectRatio: '0.52',
              objectFit: 'cover',
              objectPosition: 'left center',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: 5,
              padding: '3px 5px',
              borderRadius: 6,
              background: 'rgba(30, 27, 75, 0.78)',
              color: '#ffffff',
              fontSize: 9,
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            Reference preview · production 3D pending
          </span>
        </div>
      )}
      {loadError && !showReferenceFallback && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10, color: '#9333ea', textAlign: 'center', padding: 4 }}>
          {loadError}
        </div>
      )}
    </div>
  )
}
