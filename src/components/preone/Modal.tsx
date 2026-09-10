'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: React.ReactNode
  iconClass?: string
  wide?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({
  open, onClose, title, subtitle, icon, iconClass = 'ic-purple', wide, children, footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ovl" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ovl-backdrop" onClick={onClose} />
      <div className={`modal${wide ? ' modal-wide' : ''}`}>
        <div className="modal-head">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {icon && <div className={`modal-icon ${iconClass}`}>{icon}</div>}
            <div>
              <h3>{title}</h3>
              {subtitle && <div className="modal-sub">{subtitle}</div>}
            </div>
          </div>
          <button className="x-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={danger ? <X /> : <Alert />}
      iconClass={danger ? 'ic-pink' : 'ic-yellow'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-destructive' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose() }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="t-body">{message}</p>
    </Modal>
  )
}

function Alert() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
