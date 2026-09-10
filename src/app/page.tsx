'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Sparkles, Wallet, Users, Eye, EyeOff, LogIn,
} from 'lucide-react'
import { PLogoMark } from '@/components/preone/PLogo'

const DEMO_USERS = [
  { role: 'Owner', email: 'owner@sunshine.demo', desc: 'Full access + analytics' },
  { role: 'Principal', email: 'principal@sunshine.demo', desc: 'Approvals + academics' },
  { role: 'Teacher', email: 'teacher@sunshine.demo', desc: 'Attendance + observations' },
  { role: 'Accounts', email: 'accounts@sunshine.demo', desc: 'Invoices + payments' },
  { role: 'Reception', email: 'reception@sunshine.demo', desc: 'Leads + admissions' },
  { role: 'Parent', email: 'parent@sunshine.demo', desc: "Child's timeline" },
  { role: 'Platform', email: 'platform@preone.in', desc: 'Onboard new clients' },
]

const STARS = Array.from({ length: 26 }).map((_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 1.5 + ((i * 7) % 3),
  delay: `${(i % 12) * 0.4}s`,
  opacity: 0.3 + ((i % 5) * 0.14),
}))

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('owner@sunshine.demo')
  const [password, setPassword] = useState('Preone@123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success) router.replace('/app/dashboard')
      })
      .catch(() => {})
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message || 'Login failed')
        setLoading(false)
        return
      }
      router.push('/app/dashboard')
      router.refresh()
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  const quickFill = (em: string) => {
    setEmail(em)
    setPassword('Preone@123')
    setError(null)
  }

  return (
    <div className="login-wrap">
      {/* ── Brand panel ── */}
      <div className="login-left">
        <div className="stars" aria-hidden="true">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: s.left, top: s.top, width: s.size, height: s.size,
                animationDelay: s.delay, opacity: s.opacity,
              }}
            />
          ))}
        </div>
        <div className="login-brand">
          <PLogoMark size={56} />
          <div>
            <b>PreOne</b>
            <span>Preschool Operating System</span>
          </div>
        </div>
        <h1>One beautiful operating system for every preschool.</h1>
        <p className="lede">
          Admissions, students, attendance, fees and parent communication — everything your
          school runs on, in one joyful place. Built ground-up for early childhood education,
          not adapted from K-12 ERPs.
        </p>
        <div className="login-feats">
          <div className="login-feat">
            <span className="fi"><Users /></span>
            Admissions pipeline — from first walk-in to enrolled child
          </div>
          <div className="login-feat">
            <span className="fi"><Sparkles /></span>
            Observations & milestones that flow straight to parents
          </div>
          <div className="login-feat">
            <span className="fi"><Wallet /></span>
            Fees, invoices & receipts with automatic reconciliation
          </div>
          <div className="login-feat">
            <span className="fi"><ShieldCheck /></span>
            Enterprise RBAC, audit trail & multi-branch support
          </div>
        </div>
      </div>

      {/* ── Login card ── */}
      <div className="login-right">
        <form className="login-card" onSubmit={submit}>
          <div className="lc-head">
            <PLogoMark size={52} />
            <h2>Welcome back</h2>
            <p>Sign in to your school workspace</p>
          </div>

          {error && (
            <div className="login-err" role="alert">
              <ShieldCheck size={15} /> {error}
            </div>
          )}

          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.in"
              required
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label>Password <span className="req">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="x-btn"
                style={{ position: 'absolute', right: 4, top: 4 }}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button className={`btn btn-hero ${loading ? 'is-loading' : ''}`} disabled={loading}>
            <LogIn size={17} /> Sign in to PreOne
          </button>

          <div className="demo-creds">
            <b>Demo accounts · password: Preone@123</b>
            {DEMO_USERS.map((u) => (
              <div className="demo-cred" key={u.email}>
                <div>
                  <strong>{u.role}</strong> <span style={{ color: 'var(--foreground-muted)' }}>— {u.desc}</span>
                  <br />
                  <code>{u.email}</code>
                </div>
                <button type="button" onClick={() => quickFill(u.email)}>Use</button>
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}
