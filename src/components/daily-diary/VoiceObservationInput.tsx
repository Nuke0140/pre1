'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Square,
  RotateCcw,
  AlertCircle,
  Check,
  Sparkles,
  Info,
  X,
  Volume2,
} from 'lucide-react'

// Web Speech API interfaces
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null
}

export interface VoiceObservationInputProps {
  value: string
  onChange: (value: string) => void
  studentName?: string
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  label?: string
  className?: string
  id?: string
}

export function VoiceObservationInput({
  value,
  onChange,
  studentName,
  placeholder = "Describe what was observed during today's activities...",
  rows = 3,
  required = false,
  disabled = false,
  label = 'Observation Narrative',
  className = '',
  id = 'observation-narrative',
}: VoiceObservationInputProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [interimTranscript, setInterimTranscript] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [insertMode, setInsertMode] = useState<'append' | 'replace'>('append')
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const baseValueBeforeListeningRef = useRef<string>('')

  // Check browser capability on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsSupported(Boolean(SpeechRecognitionClass))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore abort errors on unmount
        }
      }
    }
  }, [])

  // Smart text joiner for append mode:
  // Preserves existing punctuation, adds spacing, capitalizes new text
  const joinText = (baseText: string, newText: string, mode: 'append' | 'replace'): string => {
    const trimmedNew = newText.trim()
    if (!trimmedNew) return baseText
    if (mode === 'replace' || !baseText.trim()) {
      return trimmedNew.charAt(0).toUpperCase() + trimmedNew.slice(1)
    }

    const trimmedBase = baseText.trim()
    const lastChar = trimmedBase.slice(-1)
    const capitalizedNew = trimmedNew.charAt(0).toUpperCase() + trimmedNew.slice(1)

    if (['.', '!', '?'].includes(lastChar)) {
      return `${trimmedBase} ${capitalizedNew}`
    } else if (lastChar === ',') {
      return `${trimmedBase} ${trimmedNew}`
    } else {
      return `${trimmedBase}. ${capitalizedNew}`
    }
  }

  const startListening = () => {
    setErrorMessage(null)
    setSuccessNotice(null)
    setInterimTranscript('')

    if (typeof window === 'undefined') return

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari, or enter notes manually.'
      )
      return
    }

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      baseValueBeforeListeningRef.current = value

      recognition.onstart = () => {
        setIsListening(true)
        setErrorMessage(null)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalChunk = ''
        let currentInterim = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          const transcript = result[0]?.transcript || ''
          if (result.isFinal) {
            finalChunk += transcript
          } else {
            currentInterim += transcript
          }
        }

        setInterimTranscript(currentInterim)

        if (finalChunk) {
          onChange(joinText(baseValueBeforeListeningRef.current, finalChunk, insertMode))
          baseValueBeforeListeningRef.current = joinText(
            baseValueBeforeListeningRef.current,
            finalChunk,
            insertMode
          )
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        setInterimTranscript('')

        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setErrorMessage(
              'Microphone access was denied. Please allow microphone permission in your browser settings to dictate observations.'
            )
            break
          case 'no-speech':
            setErrorMessage(
              'No speech was detected. Please check your microphone and speak clearly.'
            )
            break
          case 'audio-capture':
            setErrorMessage(
              'No microphone was detected on your device. Please connect a microphone.'
            )
            break
          case 'network':
            setErrorMessage(
              'Network error during speech recognition. Please check your internet connection.'
            )
            break
          case 'aborted':
            // Explicitly cancelled by teacher; do not show error
            break
          default:
            setErrorMessage(
              `Speech recognition error (${event.error}). You can continue typing manually.`
            )
            break
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimTranscript('')
        setSuccessNotice('Speech captured. Review and edit your observation before saving.')
        setTimeout(() => setSuccessNotice(null), 4000)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: any) {
      setIsListening(false)
      setErrorMessage(
        err.message || 'Unable to start speech recognition. Please type manually.'
      )
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        setIsListening(false)
      }
    }
  }

  const cancelListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // Ignore
      }
    }
    // Revert to original text before dictation began
    onChange(baseValueBeforeListeningRef.current)
    setIsListening(false)
    setInterimTranscript('')
    setErrorMessage(null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header Bar: Label + Mode Toggle + Microphone Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label htmlFor={id} className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {studentName && (
            <span className="text-[11px] font-normal text-muted-foreground">
              for <strong className="text-foreground">{studentName}</strong>
            </span>
          )}
        </label>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Append vs Replace Mode Selector */}
          <div className="flex items-center text-[10px] bg-muted/50 border border-border/60 rounded-lg p-0.5">
            <button
              type="button"
              disabled={isListening || disabled}
              onClick={() => setInsertMode('append')}
              title="Append speech to existing observation text"
              className={`px-1.5 py-0.5 rounded font-medium transition ${
                insertMode === 'append'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Append
            </button>
            <button
              type="button"
              disabled={isListening || disabled}
              onClick={() => setInsertMode('replace')}
              title="Replace existing text with dictated speech"
              className={`px-1.5 py-0.5 rounded font-medium transition ${
                insertMode === 'replace'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Replace
            </button>
          </div>

          {/* Voice Button */}
          {isSupported ? (
            !isListening ? (
              <button
                type="button"
                onClick={startListening}
                disabled={disabled}
                className="btn btn-xs btn-outline border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1.5 font-semibold transition-all shadow-2xs"
                title="Start voice dictation (Speech-to-Text)"
                aria-label="Start voice dictation"
              >
                <Mic className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Dictate Observation</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={stopListening}
                  className="btn btn-xs bg-red-600 hover:bg-red-700 text-white border-red-700 flex items-center gap-1.5 font-semibold animate-pulse shadow-sm"
                  title="Stop listening"
                  aria-label="Stop listening"
                >
                  <Square className="w-3 h-3 fill-current shrink-0" />
                  <span>Stop Listening</span>
                </button>
                <button
                  type="button"
                  onClick={cancelListening}
                  className="btn btn-xs btn-ghost text-muted-foreground hover:text-foreground p-1"
                  title="Cancel dictation and discard speech"
                  aria-label="Cancel dictation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          ) : (
            <span
              className="text-[11px] text-muted-foreground/75 flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40"
              title="Speech recognition is not supported in this browser. You can type manually."
            >
              <MicOff className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <span>Voice typing unavailable</span>
            </span>
          )}
        </div>
      </div>

      {/* Active Listening Indicator Banner */}
      {isListening && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span>Listening... Speak naturally</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              [Click Stop when finished]
            </span>
          </div>

          {/* Real-time Interim Transcript Preview */}
          {interimTranscript && (
            <div className="text-xs text-foreground/80 italic bg-background/80 p-2 rounded-lg border border-border/40 flex items-start gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>&ldquo;{interimTranscript}&rdquo;</span>
            </div>
          )}
        </div>
      )}

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Error / Permission Denied Banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Microphone Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 shrink-0 p-0.5"
            aria-label="Dismiss error notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Observation Textarea (Always editable manually) */}
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-background border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary leading-relaxed transition ${
            isListening
              ? 'border-red-400 ring-1 ring-red-400/30'
              : 'border-border'
          }`}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
        <span>Review or edit text above. Dictation never publishes automatically.</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  )
}
