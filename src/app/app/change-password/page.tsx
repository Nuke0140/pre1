'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { useToast } from '@/components/preone/Toast'

export default function ChangePasswordPage() {
  const router = useRouter()
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Validation rules
  const hasMinLength = newPassword.length >= 8
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword
  const isValid = hasMinLength && currentPassword.trim().length > 0 && isMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!currentPassword.trim()) {
      setErrorMsg('Please enter your current temporary password.')
      return
    }

    if (!hasMinLength) {
      setErrorMsg('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setErrorMsg('Your new password must be different from your current temporary password.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/v1/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      })

      const json = await res.json()

      if (json.success) {
        toast.success('Password updated successfully!', 'Welcome! Opening your school workspace...')
        // Force full page navigation to load new session cookie across layout & client components
        setTimeout(() => {
          window.location.href = '/app/home'
        }, 400)
      } else {
        const message = json.error?.message || 'Failed to update password. Please check your current password and try again.'
        setErrorMsg(message)
        toast.error('Password update failed', message)
        setSubmitting(false)
      }
    } catch (err: any) {
      const message = err.message || 'Network connectivity error. Please try again.'
      setErrorMsg(message)
      toast.error('Connection error', message)
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 160px)',
        padding: '24px 16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '32px 28px',
          borderRadius: 'var(--radius-24, 24px)',
          boxShadow: 'var(--shadow-modal), 0 20px 48px -12px rgba(15, 23, 42, 0.12)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'color-mix(in srgb, var(--surface-card) 98%, transparent)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
        }}
      >
        {/* Header with Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--primary-light, #F3EEFF), color-mix(in srgb, var(--primary) 18%, #ffffff))',
              color: 'var(--primary, #7C3AED)',
              border: '1px solid color-mix(in srgb, var(--primary) 24%, transparent)',
              boxShadow: '0 8px 20px -4px color-mix(in srgb, var(--primary) 25%, transparent)',
            }}
          >
            <KeyRound size={26} />
          </div>

          <span
            className="badge b-primary b-dot"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Action Required
          </span>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--foreground)',
              margin: '6px 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            Set Your New Password
          </h1>

          <p
            className="txt-muted"
            style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              maxWidth: 380,
              margin: '0 auto',
            }}
          >
            Welcome to PreOne! For security, please choose a private password to access your school workspace.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              backgroundColor: 'var(--danger-soft, #FEF2F2)',
              border: '1px solid var(--danger-border, #FCA5A5)',
              color: 'var(--danger, #DC2626)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 20,
            }}
            role="alert"
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, lineHeight: 1.35 }}>{errorMsg}</div>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current / Temporary Password */}
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Current / Temporary Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input"
                style={{
                  width: '100%',
                  paddingRight: 40,
                  height: 44,
                  fontSize: 14,
                  touchAction: 'manipulation',
                }}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--foreground-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  touchAction: 'manipulation',
                }}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              New Password (Min 8 Characters) *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                className="input"
                style={{
                  width: '100%',
                  paddingRight: 40,
                  height: 44,
                  fontSize: 14,
                  touchAction: 'manipulation',
                }}
                required
                minLength={8}
                placeholder="Create new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--foreground-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  touchAction: 'manipulation',
                }}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Checklist */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: hasMinLength ? 'var(--success, #16A34A)' : 'var(--text-secondary)',
                }}
              >
                <CheckCircle2 size={13} style={{ opacity: hasMinLength ? 1 : 0.4 }} />
                <span>At least 8 characters long</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: hasMixedCase ? 'var(--success, #16A34A)' : 'var(--text-secondary)',
                }}
              >
                <CheckCircle2 size={13} style={{ opacity: hasMixedCase ? 1 : 0.4 }} />
                <span>Uppercase &amp; lowercase letters (recommended)</span>
              </div>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Confirm New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input"
                style={{
                  width: '100%',
                  paddingRight: 40,
                  height: 44,
                  fontSize: 14,
                  touchAction: 'manipulation',
                }}
                required
                minLength={8}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--foreground-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  touchAction: 'manipulation',
                }}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !isMatch && (
              <span style={{ fontSize: 12, color: 'var(--danger, #DC2626)', marginTop: 4, display: 'block' }}>
                Passwords do not match
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn btn-primary ${submitting ? 'is-loading' : ''}`}
            disabled={submitting || !isValid}
            style={{
              height: 46,
              fontSize: 14,
              fontWeight: 700,
              width: '100%',
              marginTop: 8,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              touchAction: 'manipulation',
            }}
          >
            <ShieldCheck size={16} />
            <span>{submitting ? 'Updating Password…' : 'Update Password & Enter Workspace'}</span>
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer actions */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleSignOut}
            className="btn btn-ghost btn-sm"
            style={{
              color: 'var(--foreground-muted)',
              fontSize: 12.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              touchAction: 'manipulation',
            }}
          >
            <LogOut size={13} />
            <span>Sign out &amp; switch account</span>
          </button>
        </div>
      </div>
    </div>
  )
}
