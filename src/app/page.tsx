'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Eye, EyeOff, LogIn, User, Lock, Mail,
  Crown, GraduationCap, BookOpen, CircleDollarSign, Headphones,
  Heart, Building2, Check, ArrowRight, Sun, Moon, AlertCircle,
  Zap, X
} from 'lucide-react'
import { PLogoMark } from '@/components/preone/PLogo'

interface DemoProfile {
  role: string
  title: string
  name: string
  username: string
  email: string
  category: 'SCHOOL' | 'EXTERNAL'
  icon: React.ComponentType<{ className?: string }>
  badgeCls: string
  accentColor: string
  desc: string
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    role: 'OWNER',
    title: 'School Owner',
    name: 'Meera Iyer',
    username: 'meera.iyer',
    email: 'owner@sunshine.demo',
    category: 'SCHOOL',
    icon: Crown,
    badgeCls: 'text-purple-700 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
    accentColor: 'from-purple-500 to-indigo-600',
    desc: 'Institution oversight, financial ledgers & analytics',
  },
  {
    role: 'PRINCIPAL',
    title: 'Principal',
    name: 'Rajni Malhotra',
    username: 'rajni.malhotra',
    email: 'principal@sunshine.demo',
    category: 'SCHOOL',
    icon: GraduationCap,
    badgeCls: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
    accentColor: 'from-blue-500 to-cyan-600',
    desc: 'Campus academic administration & approvals',
  },
  {
    role: 'TEACHER',
    title: 'Teacher',
    name: 'Anita Sharma',
    username: 'anita.sharma',
    email: 'teacher@sunshine.demo',
    category: 'SCHOOL',
    icon: BookOpen,
    badgeCls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    accentColor: 'from-emerald-500 to-teal-600',
    desc: 'Classroom attendance, diaries & observations',
  },
  {
    role: 'ACCOUNTS',
    title: 'Accounts Officer',
    name: 'Vikram Rao',
    username: 'vikram.rao',
    email: 'accounts@sunshine.demo',
    category: 'SCHOOL',
    icon: CircleDollarSign,
    badgeCls: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    accentColor: 'from-amber-500 to-orange-600',
    desc: 'Fee invoicing, collections & financial ledgers',
  },
  {
    role: 'RECEPTIONIST',
    title: 'Receptionist',
    name: 'Divya Nair',
    username: 'divya.nair',
    email: 'reception@sunshine.demo',
    category: 'SCHOOL',
    icon: Headphones,
    badgeCls: 'text-pink-700 bg-pink-50 dark:bg-pink-950/50 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/60',
    accentColor: 'from-pink-500 to-rose-600',
    desc: 'Inquiries, visitor desk & lead management',
  },
  {
    role: 'PARENT',
    title: 'Parent Portal',
    name: 'Priya Sharma',
    username: 'priya.sharma',
    email: 'parent@sunshine.demo',
    category: 'EXTERNAL',
    icon: Heart,
    badgeCls: 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
    accentColor: 'from-rose-500 to-pink-600',
    desc: "Child timeline, activity logs & fee receipts",
  },
  {
    role: 'PLATFORM_ADMIN',
    title: 'Platform Admin',
    name: 'PreOne Admin',
    username: 'platform.admin',
    email: 'platform@preone.in',
    category: 'EXTERNAL',
    icon: Building2,
    badgeCls: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
    accentColor: 'from-indigo-500 to-violet-600',
    desc: 'System infrastructure & multi-school onboarding',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('owner@sunshine.demo')
  const [password, setPassword] = useState('Preone@123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeProfile, setActiveProfile] = useState<string>('OWNER')
  const [useUsername, setUseUsername] = useState<boolean>(false)
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const identifierInputRef = useRef<HTMLInputElement>(null)

  // Sync theme with document
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    setTheme(currentTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    try {
      localStorage.setItem('preone_theme', nextTheme)
    } catch {}
  }

  // Auto redirect if already logged in
  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success) router.replace('/app/dashboard')
      })
      .catch(() => {})
  }, [router])

  const handleLogin = async (e?: React.FormEvent, customId?: string, customPw?: string) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    const loginIdentifier = (customId ?? identifier).trim()
    const loginPassword = customPw ?? password

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error?.message || 'Invalid credentials. Please verify and try again.')
        setLoading(false)
        return
      }
      router.push('/app/dashboard')
      router.refresh()
    } catch {
      setError('Network connectivity error. Please try again.')
      setLoading(false)
    }
  }

  const selectProfile = (p: DemoProfile, autoSubmit = false) => {
    setActiveProfile(p.role)
    const val = useUsername ? p.username : p.email
    setIdentifier(val)
    setPassword('Preone@123')
    setError(null)

    if (autoSubmit) {
      handleLogin(undefined, val, 'Preone@123')
    }
  }

  const toggleIdentifierFormat = () => {
    const nextMode = !useUsername
    setUseUsername(nextMode)
    const found = DEMO_PROFILES.find((p) => p.role === activeProfile)
    if (found) {
      setIdentifier(nextMode ? found.username : found.email)
    }
  }

  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  const isEmail = identifier.includes('@')
  const currentProfile = DEMO_PROFILES.find((p) => p.role === activeProfile)

  return (
    <main className="min-h-screen w-full relative flex flex-col justify-between items-center px-4 py-6 sm:py-10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-purple-500 selection:text-white transition-colors duration-200">
      {/* ── Background Subtle Glow & Dots Pattern ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[42rem] h-[22rem] bg-gradient-to-b from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl transform-gpu" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl transform-gpu" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl transform-gpu" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between pb-4 sm:pb-6">
        <div className="flex items-center gap-2.5">
          <PLogoMark size={32} />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            Pre<span className="text-purple-600 dark:text-purple-400">One</span>
          </span>
          <span className="hidden sm:inline-flex items-center ml-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
            Preschool OS
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Cloud Health Pill */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloud Active</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all focus:outline-none"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Main Login Container ── */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto my-auto">
        <div className="rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/90 shadow-xl shadow-purple-950/5 dark:shadow-none p-6 sm:p-8 transition-all">
          {/* Card Header with Glowing Halo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-50 dark:from-purple-950/60 dark:to-indigo-950/40 border border-purple-200/60 dark:border-purple-800/50 shadow-inner mb-3.5">
              <PLogoMark size={42} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to PreOne
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter credentials or select a verified demo profile
            </p>
          </div>

          {/* Error Banner with Dismiss */}
          {error && (
            <div
              className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-medium flex items-start justify-between gap-2.5 animate-in fade-in"
              role="alert"
            >
              <div className="flex items-start gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <span className="leading-snug break-words">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="text-red-400 hover:text-red-600 dark:hover:text-red-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={(e) => handleLogin(e)}>
            {/* Identifier Input (Email or Username) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email or Username
                </label>
                <button
                  type="button"
                  onClick={toggleIdentifierFormat}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center gap-1"
                >
                  <span>Format: <strong>{useUsername ? 'Username' : 'Email'}</strong></span>
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  {isEmail ? <Mail className="w-4 h-4 text-purple-500" /> : <User className="w-4 h-4 text-purple-500" />}
                </div>
                <input
                  id="login-identifier"
                  ref={identifierInputRef}
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setActiveProfile('')
                  }}
                  placeholder={useUsername ? 'e.g. meera.iyer' : 'e.g. owner@sunshine.demo'}
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all font-medium"
                />
                {identifier && (
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('')
                      identifierInputRef.current?.focus()
                    }}
                    aria-label="Clear identifier"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setPassword('Preone@123')}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Demo Default: <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">Preone@123</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4 text-purple-500" />
                </div>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={checkCapsLock}
                  onKeyUp={checkCapsLock}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* CapsLock Warning */}
              {capsLockActive && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Caps Lock is ON</span>
                </div>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] shadow-md shadow-purple-600/20 dark:shadow-purple-950/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* ── 1-Click Role Profiles (The Core UX Feature) ── */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Instant Role Access
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                1-Click to select & sign in
              </span>
            </div>

            {/* Role Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DEMO_PROFILES.map((p) => {
                const IconComponent = p.icon
                const isSelected = activeProfile === p.role || identifier === p.email || identifier === p.username
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => selectProfile(p)}
                    className={`group flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-purple-500/80 bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200/70 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border shrink-0 ${p.badgeCls}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-[11.5px] leading-tight">
                        {p.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                        {p.name.split(' ')[0]}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 ml-auto" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Quick Login Bar for Currently Selected Profile */}
            {currentProfile && (
              <div className="mt-3 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-purple-900 dark:text-purple-200 font-medium truncate">
                    <span className="font-semibold">{currentProfile.name}</span>
                    <span className="text-purple-400 dark:text-purple-600">•</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400">{currentProfile.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentProfile.desc}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectProfile(currentProfile, true)}
                  disabled={loading}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Launch</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Minimalist Clean Footer ── */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 sm:pt-6 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Based Access Control • Active Session Monitoring</span>
        </div>
        <div>
          <span>PreOne Operating System © 2026</span>
        </div>
      </footer>
    </main>
  )
}
