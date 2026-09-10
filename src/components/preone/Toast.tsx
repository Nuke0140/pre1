'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface ToastItem {
  id: number
  type: ToastType
  title: string
  body?: string
  out?: boolean
}

interface ToastApi {
  success: (title: string, body?: string) => void
  error: (title: string, body?: string) => void
  warning: (title: string, body?: string) => void
  info: (title: string, body?: string) => void
}

const ToastCtx = createContext<ToastApi | null>(null)

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 />,
  error: <XCircle />,
  warning: <AlertTriangle />,
  info: <Info />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(1)

  const push = useCallback((type: ToastType, title: string, body?: string) => {
    const id = idRef.current++
    setItems((prev) => [...prev.slice(-4), { id, type, title, body }])
    setTimeout(() => {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, out: true } : t)))
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 280)
    }, 4200)
  }, [])

  const api: ToastApi = {
    success: (t, b) => push('success', t, b),
    error: (t, b) => push('error', t, b),
    warning: (t, b) => push('warning', t, b),
    info: (t, b) => push('info', t, b),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast t-${t.type}${t.out ? ' out' : ''}`}>
            <span className="t-ic">{ICONS[t.type]}</span>
            <div>
              <b>{t.title}</b>
              {t.body && <p>{t.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
