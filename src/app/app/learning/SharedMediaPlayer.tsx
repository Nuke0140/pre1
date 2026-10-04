'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Music,
  GraduationCap,
} from 'lucide-react'

export interface MediaItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  activityType?: 'LESSON' | 'RHYME' | 'STORY' | 'COURSE' | 'ACTIVITY' | string
  durationMinutes?: number
  expectedOutcome?: string
  materials?: string
  instructions?: string
  classroomName?: string
  mediaUrl?: string | null // Canonical media file URL if available
  mediaProvider?: 'DIRECT' | 'DRIVE' | 'NONE'
}

export interface SharedMediaPlayerProps {
  item: MediaItem
  initialPositionSecs?: number
  isCompleted?: boolean
  canProgress?: boolean
  onProgressUpdate?: (positionSecs: number, percentage: number) => void
  onComplete?: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  className?: string
}

export function SharedMediaPlayer({
  item,
  initialPositionSecs = 0,
  isCompleted = false,
  canProgress = true,
  onProgressUpdate,
  onComplete,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  className = '',
}: SharedMediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialPositionSecs)
  const [isMuted, setIsMuted] = useState(false)
  const [completed, setCompleted] = useState(isCompleted)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Detect Google Drive file ID
  const driveFileId = React.useMemo(() => {
    const raw = item.mediaUrl || (item.mediaProvider === 'DRIVE' ? item.instructions || item.materials : '')
    if (!raw) return null
    const match = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }, [item.mediaUrl, item.mediaProvider, item.instructions, item.materials])

  const isDriveMedia = item.mediaProvider === 'DRIVE' || Boolean(driveFileId)

  // Direct video URL (if raw direct video or downloadable stream)
  const directVideoUrl = React.useMemo(() => {
    if (item.mediaProvider === 'DIRECT' && item.mediaUrl) {
      return item.mediaUrl
    }
    return null
  }, [item.mediaProvider, item.mediaUrl])

  // Calculate total seconds from activity duration (default 30 mins = 1800s, rhymes often 3-5m, stories 8-15m)
  const defaultDurationMins = item.activityType === 'RHYME' ? 3 : item.activityType === 'STORY' ? (item.durationMinutes || 10) : (item.durationMinutes || 15)
  const totalDurationSecs = defaultDurationMins * 60

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastReportedTime = useRef<number>(initialPositionSecs)
  const currentTimeRef = useRef<number>(initialPositionSecs)

  // Keep currentTimeRef in sync
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  // Reset or initialize state when item changes
  useEffect(() => {
    setCurrentTime(initialPositionSecs)
    currentTimeRef.current = initialPositionSecs
    setCompleted(isCompleted)
    setIsPlaying(false)
    setMediaError(null)
    setIframeLoaded(false)
    lastReportedTime.current = initialPositionSecs
  }, [item.id, initialPositionSecs, isCompleted])

  // Timer ticker for interactive classroom session or Drive preview mode
  useEffect(() => {
    let interval: any = null
    if (isPlaying) {
      interval = setInterval(() => {
        const next = currentTimeRef.current + 1
        currentTimeRef.current = next
        setCurrentTime(next)

        const pct = Math.min(100, Math.round((next / totalDurationSecs) * 100))

        // Debounced progress report every 5 seconds
        if (next - lastReportedTime.current >= 5 && canProgress) {
          lastReportedTime.current = next
          onProgressUpdate?.(next, pct)
        }

        if (next >= totalDurationSecs) {
          setIsPlaying(false)
          setCompleted(true)
          onComplete?.()
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, totalDurationSecs, canProgress, onProgressUpdate, onComplete])

  // HTML5 Video element sync
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return
    const pos = Math.round(videoRef.current.currentTime)
    setCurrentTime(pos)
    const dur = Math.round(videoRef.current.duration) || totalDurationSecs
    const pct = Math.min(100, Math.round((pos / dur) * 100))
    if (pos - lastReportedTime.current >= 5 && canProgress) {
      lastReportedTime.current = pos
      onProgressUpdate?.(pos, pct)
    }
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
    setCompleted(true)
    if (canProgress) {
      onProgressUpdate?.(totalDurationSecs, 100)
    }
    onComplete?.()
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((err) => {
          console.warn('Playback blocked by browser policy:', err)
          setMediaError('Playback was blocked by browser autoplay policy. Please interact directly with the video.')
        })
      }
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value, 10)
    setCurrentTime(newTime)
    lastReportedTime.current = newTime
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
    const pct = Math.min(100, Math.round((newTime / totalDurationSecs) * 100))
    if (canProgress) {
      onProgressUpdate?.(newTime, pct)
    }
  }

  const handleRestart = () => {
    setCurrentTime(0)
    lastReportedTime.current = 0
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
    setIsPlaying(true)
    if (canProgress) {
      onProgressUpdate?.(0, 0)
    }
  }

  const handleMarkFinished = () => {
    setCurrentTime(totalDurationSecs)
    setIsPlaying(false)
    setCompleted(true)
    if (canProgress) {
      onProgressUpdate?.(totalDurationSecs, 100)
    }
    onComplete?.()
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const progressPercentage = Math.min(100, Math.round((currentTime / totalDurationSecs) * 100))

  const getItemTypeBadge = () => {
    switch (item.activityType) {
      case 'RHYME':
        return { label: 'Action Rhyme & Song', icon: <Music size={13} />, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' }
      case 'STORY':
        return { label: 'Picture Tale & Story', icon: <BookOpen size={13} />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
      case 'LESSON':
      default:
        return { label: 'Course Lesson', icon: <GraduationCap size={13} />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
    }
  }

  const badgeMeta = getItemTypeBadge()

  return (
    <div className={`card bg-surface-elevated border border-border rounded-3xl overflow-hidden shadow-lg ${className}`}>
      {/* ── Visual Stage / Media Screen Area ── */}
      <div className="relative aspect-video sm:aspect-[21/9] min-h-[320px] max-h-[480px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden">
        {/* Soft background ambient halo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.18),transparent_70%)] pointer-events-none" />

        {/* 1. Google Drive Embedded Media */}
        {isDriveMedia && driveFileId ? (
          <div className="absolute inset-0 w-full h-full flex flex-col z-0">
            <iframe
              src={`https://drive.google.com/file/d/${driveFileId}/preview`}
              className="w-full h-full border-none rounded-none"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              onLoad={() => setIframeLoaded(true)}
              onError={() => setMediaError('Google Drive preview failed to load. The file may be private or restricted.')}
              title={item.title}
            />
          </div>
        ) : directVideoUrl ? (
          /* 2. Direct HTML5 Video */
          <video
            ref={videoRef}
            src={directVideoUrl}
            className="absolute inset-0 w-full h-full object-contain z-0"
            playsInline
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            onError={() => setMediaError('Video failed to stream. Verify the media URL or file permissions.')}
          />
        ) : (
          /* 3. Preschool Guided Stage Info Display */
          <div className="relative z-10 max-w-lg space-y-3 px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md bg-white/5 border-white/10 text-white/90">
              {badgeMeta.icon}
              <span>{badgeMeta.label}</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {item.title}
            </h2>

            {item.subtitle && (
              <p className="text-xs sm:text-sm text-white/70 line-clamp-2">
                {item.subtitle}
              </p>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Clock size={12} />
              <span>Interactive Classroom Session ({formatTime(currentTime)} / {formatTime(totalDurationSecs)})</span>
            </div>

            {/* Center Play Button Overlay for interactive mode */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 hover:bg-primary text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-primary/40"
              >
                {isPlaying ? (
                  <Pause size={28} className="fill-white" />
                ) : (
                  <Play size={28} className="fill-white translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Media Error Overlay (Actionable error state if Drive or file fails) */}
        {mediaError && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle size={36} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Media Playback Restricted</h3>
            <p className="text-xs text-white/80 max-w-md">{mediaError}</p>
            {driveFileId && (
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm text-xs rounded-xl inline-flex items-center gap-1.5"
                >
                  <span>Open in Google Drive</span>
                </a>
                <button
                  onClick={() => setMediaError(null)}
                  className="btn btn-secondary btn-sm text-xs rounded-xl"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completion badge if marked complete */}
        {completed && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold backdrop-blur-md">
            <CheckCircle2 size={14} />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* ── Media Player Controls Bar ── */}
      <div className="p-5 sm:p-6 space-y-4 bg-surface-elevated border-t border-border/80">
        {/* Scrubber & Progress Track */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={totalDurationSecs}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 rounded-lg bg-border accent-primary cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-foreground">{progressPercentage}%</span>
              <span>/</span>
              <span>{formatTime(totalDurationSecs)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Previous, Play/Pause, Next, Restart, Mark Complete */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left: Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="btn btn-secondary btn-sm rounded-xl px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Item"
            >
              <ChevronLeft size={16} />
              <span className="text-xs hidden sm:inline">Previous</span>
            </button>

            <button
              onClick={togglePlay}
              className="btn btn-primary btn-sm rounded-xl px-4 inline-flex items-center gap-1.5"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span className="text-xs font-semibold">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className="btn btn-secondary btn-sm rounded-xl px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Item"
            >
              <span className="text-xs hidden sm:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Right: State & Completion Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="btn btn-ghost btn-sm rounded-xl text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              title="Restart from beginning"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Restart</span>
            </button>

            {canProgress && (
              <button
                onClick={handleMarkFinished}
                disabled={completed}
                className={`btn btn-sm rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  completed
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'btn-secondary hover:border-emerald-500/50 hover:text-emerald-600'
                }`}
              >
                <CheckCircle2 size={14} className={completed ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                <span>{completed ? 'Completed' : 'Mark as Done'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Content Narrative, Lesson Guidance & Outcomes ── */}
        {(item.description || item.expectedOutcome || item.instructions) && (
          <div className="pt-4 border-t border-border/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Teacher Guide & Developmental Focus
            </h4>

            {item.description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {item.expectedOutcome && (
                <div className="p-3 rounded-xl bg-surface border border-border/70 space-y-1">
                  <div className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <Sparkles size={12} className="text-primary" />
                    <span>Expected Milestone Outcome</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.expectedOutcome}</p>
                </div>
              )}

              {item.materials && (
                <div className="p-3 rounded-xl bg-surface border border-border/70 space-y-1">
                  <div className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <BookOpen size={12} className="text-amber-500" />
                    <span>Suggested Materials</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.materials}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
