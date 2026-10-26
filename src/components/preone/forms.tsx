'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar as CalIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { AnimatedCheckmark } from './TactileMotion'

/* ─── Date picker ─────────────────────────────────────────────────── */

export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

type DatePickerMode = 'days' | 'month' | 'year'

export function DatePicker({
  value, onChange, name, placeholder = 'Select date',
}: {
  value?: string
  onChange: (iso: string) => void
  name?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DatePickerMode>('days')
  const [view, setView] = useState(() => {
    const base = value ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')) : new Date()
    const valid = !isNaN(base.getTime()) ? base : new Date()
    return { y: valid.getFullYear(), m: valid.getMonth() }
  })
  const [yearPageStart, setYearPageStart] = useState(() => Math.floor(view.y / 12) * 12)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      if (value) {
        const parsed = new Date(value + (value.length === 10 ? 'T00:00:00' : ''))
        if (!isNaN(parsed.getTime())) {
          setView({ y: parsed.getFullYear(), m: parsed.getMonth() })
          setYearPageStart(Math.floor(parsed.getFullYear() / 12) * 12)
        }
      } else {
        setYearPageStart(Math.floor(view.y / 12) * 12)
      }
      setMode('days')
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as HTMLElement)) {
        setOpen(false)
        setMode('days')
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode !== 'days') {
          setMode('days')
        } else {
          setOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, mode])

  const pick = (d: Date) => {
    onChange(toIso(d))
    setOpen(false)
    setMode('days')
  }

  const cells = useMemo(() => {
    const startPad = new Date(view.y, view.m, 1).getDay()
    const daysIn = new Date(view.y, view.m + 1, 0).getDate()
    const out: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) out.push(null)
    for (let d = 1; d <= daysIn; d++) out.push(new Date(view.y, view.m, d))
    return out
  }, [view])

  const monthLabel = `${MONTH_NAMES[view.m]} ${view.y}`
  const fmt = (iso?: string) =>
    iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className="dp-root" ref={rootRef}>
      <div className="dp-input" onClick={() => setOpen((o) => !o)}>
        <CalIcon size={15} />
        <input
          placeholder={placeholder}
          value={fmt(value)}
          readOnly
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
            if (e.key === 'ArrowDown') setOpen(true)
          }}
        />
      </div>
      {name && <input type="hidden" name={name} value={value || ''} />}
      {open && (
        <div className="dp-cal" role="dialog" aria-label={monthLabel}>
          {mode === 'days' && (
            <>
              <div className="dp-head">
                <button
                  type="button"
                  className="dp-nav"
                  aria-label="Previous month"
                  onClick={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: v.m === 0 ? 11 : v.m - 1 }))}
                >
                  <ChevronLeft size={15} />
                </button>
                <div className="dp-title-group">
                  <button
                    type="button"
                    className="dp-title-btn"
                    onClick={() => setMode('month')}
                    aria-label="Select month"
                    title="Click to select month"
                  >
                    <span>{MONTH_NAMES[view.m]}</span>
                    <ChevronDown size={11} style={{ opacity: 0.6 }} />
                  </button>
                  <button
                    type="button"
                    className="dp-title-btn"
                    onClick={() => {
                      setYearPageStart(Math.floor(view.y / 12) * 12)
                      setMode('year')
                    }}
                    aria-label="Select year"
                    title="Click to select year"
                  >
                    <span>{view.y}</span>
                    <ChevronDown size={11} style={{ opacity: 0.6 }} />
                  </button>
                </div>
                <button
                  type="button"
                  className="dp-nav"
                  aria-label="Next month"
                  onClick={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: v.m === 11 ? 0 : v.m + 1 }))}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="dp-grid dp-weekdays">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="dp-dow">{d}</span>
                ))}
              </div>
              <div className="dp-grid">
                {cells.map((d, i) =>
                  d ? (
                    <button
                      type="button"
                      key={i}
                      className={`dp-day${value && toIso(d) === value ? ' on' : ''}`}
                      onClick={() => pick(d)}
                    >
                      {d.getDate()}
                    </button>
                  ) : (
                    <span key={i} className="dp-day-empty" aria-hidden="true" />
                  ),
                )}
              </div>
            </>
          )}

          {mode === 'month' && (
            <>
              <div className="dp-head">
                <button
                  type="button"
                  className="dp-nav"
                  aria-label="Previous year"
                  onClick={() => setView((v) => ({ ...v, y: v.y - 1 }))}
                >
                  <ChevronLeft size={15} />
                </button>
                <div className="dp-title-group">
                  <span className="dp-view-title">Select Month</span>
                  <button
                    type="button"
                    className="dp-title-btn"
                    onClick={() => {
                      setYearPageStart(Math.floor(view.y / 12) * 12)
                      setMode('year')
                    }}
                    aria-label="Select year"
                    title="Click to select year"
                  >
                    <span>{view.y}</span>
                    <ChevronDown size={11} style={{ opacity: 0.6 }} />
                  </button>
                </div>
                <button
                  type="button"
                  className="dp-nav"
                  aria-label="Next year"
                  onClick={() => setView((v) => ({ ...v, y: v.y + 1 }))}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="dp-month-grid">
                {MONTH_NAMES.map((mName, idx) => {
                  const isSelected = view.m === idx
                  return (
                    <button
                      key={mName}
                      type="button"
                      className={`dp-selection-btn${isSelected ? ' on' : ''}`}
                      onClick={() => {
                        setView((v) => ({ ...v, m: idx }))
                        setMode('days')
                      }}
                      aria-label={mName}
                    >
                      <span className="dp-selection-label">{MONTH_SHORT[idx]}</span>
                      <span className="dp-selection-sub">{mName}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {mode === 'year' && (
            <>
              <div className="dp-head">
                <button
                  type="button"
                  className="dp-nav"
                  aria-label="Previous 12 years"
                  onClick={() => setYearPageStart((ys) => ys - 12)}
                >
                  <ChevronLeft size={15} />
                </button>
                <div className="dp-title-group">
                  <span className="dp-view-title">{yearPageStart} – {yearPageStart + 11}</span>
                </div>
                <button
                  type="button"
                  className="dp-nav"
                  aria-label="Next 12 years"
                  onClick={() => setYearPageStart((ys) => ys + 12)}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="dp-year-grid">
                {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((yr) => {
                  const isSelected = view.y === yr
                  const isCurrentYear = new Date().getFullYear() === yr
                  return (
                    <button
                      key={yr}
                      type="button"
                      className={`dp-selection-btn${isSelected ? ' on' : ''}${isCurrentYear && !isSelected ? ' today' : ''}`}
                      onClick={() => {
                        setView((v) => ({ ...v, y: yr }))
                        setMode('days')
                      }}
                    >
                      <span className="dp-selection-label">{yr}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="dp-foot">
            {mode !== 'days' ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMode('days')}
              >
                Back to Dates
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const now = new Date()
                    setView({ y: now.getFullYear(), m: now.getMonth() })
                    pick(now)
                  }}
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                    }}
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Input masks ─────────────────────────────────────────────────── */

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '')
  const digits = d.length > 10 && d.startsWith('91') ? d.slice(2) : d
  const n = digits.slice(0, 10)
  return n.length > 5 ? `${n.slice(0, 5)} ${n.slice(5)}` : n
}

export function maskAadhaar(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 12)
  return n.replace(/(.{4})(?=.)/g, '$1 ')
}

export const unmask = (value: string) => value.replace(/\D/g, '')

export function MaskedInput({
  name, mask = 'phone', value, onChange, placeholder, required,
}: {
  name?: string
  mask?: 'phone' | 'aadhaar'
  value?: string
  onChange?: (rawDigits: string) => void
  placeholder?: string
  required?: boolean
}) {
  const [display, setDisplay] = useState(value ? (mask === 'phone' ? maskPhone(value) : maskAadhaar(value)) : '')

  return (
    <>
      <input
        className="input"
        placeholder={placeholder || (mask === 'phone' ? '+91 98765 43210' : '1234 5678 9012')}
        value={display}
        required={required}
        inputMode="numeric"
        autoComplete="off"
        maxLength={14}
        onChange={(e) => {
          const raw = unmask(e.target.value)
          const next = mask === 'phone' ? maskPhone(raw) : maskAadhaar(raw)
          setDisplay(next)
          if (onChange) onChange(unmask(next))
        }}
      />
      {name && <input type="hidden" name={name} value={unmask(display)} />}
    </>
  )
}

/* ─── Enter-to-next-field navigation ──────────────────────────────── */

export function EnterNav({ children }: { children: React.ReactNode }) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    const t = e.target as HTMLElement
    if (t.tagName !== 'INPUT' && t.tagName !== 'SELECT') return
    const form = t.closest('form')
    if (!form) return
    const fields = Array.from(form.querySelectorAll<HTMLElement>('input, select, textarea')).filter((el) => {
      if (el.hasAttribute('disabled')) return false
      if (el.tagName === 'INPUT') {
        const ty = (el as HTMLInputElement).type
        if (ty === 'button' || ty === 'submit' || ty === 'checkbox' || ty === 'radio' || ty === 'hidden') return false
      }
      return el.offsetParent !== null
    })
    const idx = fields.indexOf(t)
    if (idx === -1 || idx === fields.length - 1) return
    e.preventDefault()
    fields[idx + 1].focus()
  }
  return <div onKeyDown={onKeyDown}>{children}</div>
}

/* ─── Draft autosave for uncontrolled forms ───────────────────────── */

export function useFormDraft(key: string) {
  const save = (form: HTMLFormElement) => {
    try {
      const fd = new FormData(form)
      const obj: Record<string, string> = {}
      fd.forEach((v, k) => {
        if (typeof v === 'string' && v.trim() !== '') obj[k] = v
      })
      localStorage.setItem(key, JSON.stringify(obj))
    } catch {
      /* storage unavailable */
    }
  }
  const apply = (form: HTMLFormElement) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj as Record<string, string>)) {
          const el = form.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
          if (el && 'value' in el) el.value = v
        }
      }
    } catch {
      /* ignore corrupt draft */
    }
  }
  const clear = () => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  }
  return { save, apply, clear }
}

/* ─── Step wizard (presentational stepper) ────────────────────────── */

export function Wizard({
  steps, current, onChange, children,
}: {
  steps: { title: string; sub?: string }[]
  current: number
  onChange?: (idx: number) => void
  children?: React.ReactNode
}) {
  const prevCurrentRef = useRef(current)
  useEffect(() => {
    prevCurrentRef.current = current
  }, [current])
  const prevCurrent = prevCurrentRef.current

  return (
    <div className="wizard">
      <ol className="wizard-steps">
        {steps.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo'
          const justCompleted = i < current && i >= prevCurrent
          return (
            <li key={i} className={`wizard-step ${state}`}>
              <button
                type="button"
                className="wizard-node"
                aria-current={state === 'active' ? 'step' : undefined}
                onClick={() => i < current && onChange?.(i)}
                disabled={i > current}
              >
                <span className="wizard-dot">
                  {state === 'done' ? (
                    <AnimatedCheckmark size={14} animate={justCompleted} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="wizard-labels">
                  <b>{s.title}</b>
                  {s.sub && <span>{s.sub}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {children}
    </div>
  )
}