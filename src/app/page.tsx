'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PreOneBuddy, triggerBuddyReaction } from '@/components/preone/PreOneBuddy'
import {
  Mail, User, AlertCircle, X,
  HelpCircle, CheckCircle2, ArrowLeft, KeyRound, Sparkles, ArrowRight
} from 'lucide-react'
import {
  AuthShell,
  AuthViewport,
  AuthFrame,
  AuthCard,
  AuthBrand,
  AuthHeader,
  AuthContent,
  AuthForm,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthOtpInput,
  AuthLink,
  AuthIconButton,
  AuthActions,
  AuthMeta
} from '@/components/auth'

export default function LoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'login' | 'otp'>('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [brandingLoading, setBrandingLoading] = useState(true)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string
    password?: string
    otp?: string
  }>({})
  const [touched, setTouched] = useState<{
    identifier?: boolean
    password?: boolean
  }>({})
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [useUsername, setUseUsername] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)

  // School branding state
  const [branding, setBranding] = useState<{
    logoUrl?: string | null
    schoolName?: string
    campusName?: string | null
    primaryColor?: string
    theme?: { primaryColor?: string; secondaryColor?: string }
    school?: { name?: string; logoUrl?: string | null; campusName?: string | null }
  } | null>(null)

  // Multi-school disambiguation state
  const [availableSchools, setAvailableSchools] = useState<Array<{
    id: string
    name: string
    code: string
    logoUrl?: string | null
    role?: string
  }> | null>(null)

  // Compute time-aware greeting safely on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) {
          setGreeting('Good morning ☀')
        } else if (hour >= 12 && hour < 17) {
          setGreeting('Good afternoon ☀')
        } else {
          setGreeting('Good evening 🌙')
        }
      } catch {}
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) triggerBuddyReaction('thinking')
  }, [loading])

  useEffect(() => {
    if (generalError) triggerBuddyReaction('oops', 'No worries. Please review the message and try again.')
  }, [generalError])

  // OTP specific state
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [otpCountdown, setOtpCountdown] = useState<number>(45)
  const [canResendOtp, setCanResendOtp] = useState<boolean>(false)
  const [resendSuccess, setResendSuccess] = useState<boolean>(false)

  useEffect(() => {
    if (resendSuccess) triggerBuddyReaction('happy', 'Your verification code is on its way!')
  }, [resendSuccess])

  // MFA Step-Up specific state (Doc 1.2)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaDestination, setMfaDestination] = useState<string | null>(null)
  const [mfaRole, setMfaRole] = useState<string | null>(null)

  const identifierInputRef = useRef<HTMLInputElement>(null)

  // Fetch school branding for login surface based on hostname/subdomain or query param
  useEffect(() => {
    let isMounted = true
    const queryCode = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('code') ||
        new URLSearchParams(window.location.search).get('school') ||
        new URLSearchParams(window.location.search).get('tenant') || ''
      : ''
    const url = queryCode
      ? `/api/v1/auth/branding?code=${encodeURIComponent(queryCode)}`
      : '/api/v1/auth/branding'

    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (isMounted && j?.success && j.data) {
          setBranding(j.data)
          const primary = j.data.theme?.primaryColor || j.data.primaryColor
          if (primary && primary !== '#7C3AED') {
            document.documentElement.style.setProperty('--primary', primary)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setBrandingLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Auto redirect if already logged in
  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success) {
          const role = j.data?.role || j.data?.user?.role
          if (role === 'PLATFORM_ADMIN') {
            router.replace('/onboard')
          } else {
            router.replace('/app/dashboard')
          }
        } else {
          document.cookie = 'preone_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        }
      })
      .catch(() => {})
  }, [router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (authMode !== 'otp') return
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setCanResendOtp(true), 0)
      return () => clearTimeout(timer)
    }
  }, [authMode, otpCountdown])

  const validateField = (fieldName: 'identifier' | 'password', val?: string) => {
    const value = val !== undefined ? val : (fieldName === 'identifier' ? identifier : password)
    let err: string | undefined

    if (fieldName === 'identifier') {
      const trimmed = value.trim()
      if (!trimmed) {
        err = useUsername ? 'Username is required.' : 'Email or username is required.'
      } else if (!useUsername && trimmed.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmed)) {
          err = 'Please enter a valid email address.'
        }
      }
    } else if (fieldName === 'password') {
      if (!value) {
        err = 'Password is required.'
      }
    }

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: err,
    }))
    return !err
  }

  const validateLoginForm = () => {
    setTouched({ identifier: true, password: true })
    const errors: { identifier?: string; password?: string } = {}
    const trimmedIdent = identifier.trim()
    if (!trimmedIdent) {
      errors.identifier = useUsername ? 'Username is required.' : 'Email or username is required.'
    } else if (!useUsername && trimmedIdent.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedIdent)) {
        errors.identifier = 'Please enter a valid email address.'
      }
    }
    if (!password) {
      errors.password = 'Password is required.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e?: React.FormEvent, selectedTenantId?: string) => {
    if (e) e.preventDefault()
    setGeneralError(null)

    if (!validateLoginForm()) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          selectedTenantId: selectedTenantId || undefined,
        }),
      })

      const json = await res.json()
      if (!json.success) {
        setGeneralError(json.error?.message || 'Invalid credentials. Please verify and try again.')
        setLoading(false)
        return
      }

      // Multi-school workspace disambiguation flow
      if (json.data?.requiresSchoolSelection && Array.isArray(json.data.schools)) {
        setAvailableSchools(json.data.schools)
        setLoading(false)
        return
      }

      // Privileged role Step-Up MFA Challenge (Doc 1.2: OWNER & ACCOUNTS)
      if (json.data?.requiresMfa) {
        setMfaToken(json.data.mfaToken)
        setMfaDestination(json.data.destination || identifier.trim())
        setMfaRole(json.data.role || 'Privileged Role')
        setAuthMode('otp')
        setOtp(['', '', '', ''])
        setOtpCountdown(45)
        setCanResendOtp(false)
        setGeneralError(null)
        setFieldErrors({})
        setLoading(false)
        return
      }

      if (json.data?.user?.role === 'PLATFORM_ADMIN') {
        router.push('/onboard')
      } else {
        router.push('/app/dashboard')
      }
      router.refresh()
    } catch {
      setGeneralError('Network connectivity error. Please try again.')
      setLoading(false)
    }
  }

  const handleOtpVerify = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    let code = otp.join('')
    if (code.length < 4 && typeof document !== 'undefined') {
      const inputs = document.querySelectorAll<HTMLInputElement>('.auth-otp-group input')
      if (inputs.length >= 4) {
        const domCode = Array.from(inputs).map((inp) => inp.value).join('')
        if (domCode.length === 4) {
          code = domCode
          setOtp(domCode.split(''))
        }
      }
    }

    if (code.length < 4) {
      const msg = 'Please enter all 4 digits of your verification code.'
      setFieldErrors({ otp: msg })
      setGeneralError(msg)
      return
    }

    setLoading(true)
    setGeneralError(null)
    setFieldErrors({})

    try {
      const res = await (mfaToken
        ? fetch('/api/v1/auth/mfa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mfaToken, code }),
          })
        : fetch('/api/v1/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: identifier.trim() || undefined,
              code,
            }),
          }))

      const json = await res.json()
      if (!json.success) {
        const errorMsg =
          json.error?.message || 'Invalid verification code. Please check and try again.'
        setFieldErrors({ otp: errorMsg })
        setGeneralError(errorMsg)
        setLoading(false)
        return
      }

      if (json.data?.user?.role === 'PLATFORM_ADMIN') {
        router.push('/onboard')
      } else {
        router.push('/app/dashboard')
      }
      router.refresh()
    } catch {
      const errorMsg = 'Network connectivity error. Please check your connection and try again.'
      setGeneralError(errorMsg)
      setFieldErrors({ otp: errorMsg })
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResendOtp || loading) return
    setLoading(true)
    setGeneralError(null)
    setFieldErrors({})

    try {
      const res = await (mfaToken
        ? fetch('/api/v1/auth/mfa/resend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mfaToken }),
          })
        : fetch('/api/v1/auth/otp/resend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: identifier.trim() || undefined,
            }),
          }))

      const json = await res.json()
      if (!json.success) {
        setGeneralError(json.error?.message || 'Failed to resend code. Please try again.')
        setLoading(false)
        return
      }

      setOtpCountdown(45)
      setCanResendOtp(false)
      setResendSuccess(true)
      setOtp(['', '', '', ''])
      setTimeout(() => setResendSuccess(false), 3000)
    } catch {
      setGeneralError('Network error while resending verification code.')
    } finally {
      setLoading(false)
    }
  }

  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  const isEmail = identifier.includes('@')
  const effectiveSchoolName = branding?.school?.name || branding?.schoolName
  const effectiveLogoUrl = branding?.school?.logoUrl || branding?.logoUrl
  const effectiveCampusName = branding?.school?.campusName || branding?.campusName

  return (
    <AuthShell>
      <AuthViewport>
        <AuthFrame>
          <AuthCard>
            
            {/* Dynamic School Branding Anchor */}
            <AuthBrand
              tagline="Nurturing Little Futures"
              logoUrl={effectiveLogoUrl}
              schoolName={effectiveSchoolName}
              campusName={effectiveCampusName}
              loading={brandingLoading}
            />

            {/* ══════════════════════════════════════════════════════════
                MODE 1: LOGIN VIEW
                ══════════════════════════════════════════════════════════ */}
            {authMode === 'login' && (
              <>
                <AuthHeader
                  greeting={greeting}
                  title="Welcome Back"
                  description="Sign in to your school workspace"
                />

                <AuthContent>
                  {/* Demo Account Quick-Fill Helper */}
                  <div className="mb-4 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 flex items-center justify-between text-xs text-purple-900 dark:text-purple-200 animate-in fade-in">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="truncate">Demo: <strong>owner@sunshine.demo</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('owner@sunshine.demo')
                        setPassword('Preone@123')
                        setFieldErrors({})
                        setGeneralError(null)
                      }}
                      className="ml-2 font-semibold text-[11px] px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
                    >
                      Quick Fill
                    </button>
                  </div>

                  {/* General Error Alert */}
                  {generalError && (
                    <div
                      className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start justify-between gap-2.5 animate-in fade-in duration-200"
                      role="alert"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <span className="leading-snug break-words">{generalError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGeneralError(null)}
                        aria-label="Dismiss error"
                        className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Multi-School Disambiguation Chooser */}
                  {availableSchools ? (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="text-center mb-4">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Select School Workspace
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Your account belongs to multiple schools. Select which workspace to open:
                        </p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {availableSchools.map((school) => (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => {
                              setAvailableSchools(null)
                              handleLogin(undefined, school.id)
                            }}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all flex items-center justify-between group cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {school.logoUrl ? (
                                <img src={school.logoUrl} alt={school.name} className="w-8 h-8 rounded-lg object-contain bg-white shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xs shrink-0">
                                  {school.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {school.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Code: {school.code} {school.role ? `• ${school.role}` : ''}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 text-center">
                        <AuthLink onClick={() => setAvailableSchools(null)}>
                          Back to sign in
                        </AuthLink>
                      </div>
                    </div>
                  ) : (
                    <AuthForm onSubmit={handleLogin}>
                      {/* Field 1: Work Email / Username */}
                      <AuthField
                        id="login-identifier"
                        label={useUsername ? 'Username' : 'Work Email / Username'}
                        error={fieldErrors.identifier}
                        labelAction={
                          <AuthLink
                            onClick={() => {
                              const nextMode = !useUsername
                              setUseUsername(nextMode)
                              setFieldErrors((prev) => ({ ...prev, identifier: undefined }))
                              if (identifier.trim() && touched.identifier) {
                                setTimeout(() => {
                                  validateField('identifier', identifier)
                                }, 0)
                              }
                            }}
                          >
                            Use {useUsername ? 'Email' : 'Username'}
                          </AuthLink>
                        }
                      >
                        <AuthInput
                          id="login-identifier"
                          ref={identifierInputRef}
                          type="text"
                          value={identifier}
                          onChange={(e) => {
                            const val = e.target.value
                            setIdentifier(val)
                            if (fieldErrors.identifier) {
                              if (val.trim()) {
                                setFieldErrors((prev) => ({ ...prev, identifier: undefined }))
                              }
                            }
                          }}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, identifier: true }))
                            validateField('identifier', identifier)
                          }}
                          placeholder={useUsername ? 'e.g. meera.iyer' : 'Enter your work email or username'}
                          autoComplete="username"
                          leadingIcon={isEmail ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          hasError={!!fieldErrors.identifier}
                          aria-invalid={!!fieldErrors.identifier}
                          aria-describedby={fieldErrors.identifier ? 'login-identifier-error' : undefined}
                          trailingAction={
                            identifier ? (
                              <AuthIconButton
                                icon={<X className="w-3.5 h-3.5" />}
                                ariaLabel="Clear email or username"
                                onClick={() => {
                                  setIdentifier('')
                                  identifierInputRef.current?.focus()
                                  if (touched.identifier) {
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      identifier: useUsername ? 'Username is required.' : 'Email or username is required.',
                                    }))
                                  }
                                }}
                              />
                            ) : null
                          }
                        />
                      </AuthField>

                      {/* Field 2: Password */}
                      <AuthField
                        id="login-password"
                        label="Password"
                        error={fieldErrors.password}
                        labelAction={
                          <AuthLink onClick={() => setShowForgotModal(true)}>
                            Forgot password?
                          </AuthLink>
                        }
                      >
                        <AuthPasswordInput
                          id="login-password"
                          value={password}
                          onChange={(e) => {
                            const val = e.target.value
                            setPassword(val)
                            if (fieldErrors.password && val) {
                              setFieldErrors((prev) => ({ ...prev, password: undefined }))
                            }
                          }}
                          onBlur={() => {
                            setTouched((prev) => ({ ...prev, password: true }))
                            setCapsLockActive(false)
                            validateField('password', password)
                          }}
                          onKeyDown={checkCapsLock}
                          onKeyUp={checkCapsLock}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          hasError={!!fieldErrors.password}
                          aria-invalid={!!fieldErrors.password}
                          aria-describedby={
                            fieldErrors.password
                              ? 'login-password-error'
                              : capsLockActive
                              ? 'login-password-caps'
                              : undefined
                          }
                        />
                      </AuthField>

                      {/* CapsLock Warning */}
                      {capsLockActive && (
                        <div
                          id="login-password-caps"
                          role="status"
                          aria-live="polite"
                          className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in duration-150 select-none"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Caps Lock is on</span>
                        </div>
                      )}

                      {/* Primary CTA Button */}
                      <AuthActions
                        primaryText="Sign In"
                        loadingText="Signing in..."
                        loading={loading}
                        secondaryAction={
                          <div className="pt-1">
                            <AuthLink
                              onClick={async () => {
                                setAuthMode('otp')
                                setMfaToken(null)
                                setMfaDestination(null)
                                setMfaRole(null)
                                setGeneralError(null)
                                setFieldErrors({})
                                if (identifier.trim()) {
                                  try {
                                    await fetch('/api/v1/auth/otp/send', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        identifier: identifier.trim(),
                                      }),
                                    })
                                  } catch {}
                                }
                              }}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 font-medium no-underline hover:no-underline"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Login with OTP →</span>
                            </AuthLink>
                          </div>
                        }
                      />
                    </AuthForm>
                  )}
                </AuthContent>

                {/* Security Reassurance Metadata */}
                <AuthMeta label="Secure PreOne workspace • Role-based access" />
              </>
            )}

            {/* ══════════════════════════════════════════════════════════
                MODE 2: OTP VERIFICATION VIEW
                ══════════════════════════════════════════════════════════ */}
            {authMode === 'otp' && (
              <>
                <AuthHeader
                  title={mfaToken ? "Two-Factor Authentication" : "Verify Your Login"}
                  description={
                    mfaToken
                      ? `Step-up verification required for ${mfaRole || 'Privileged'} account. Enter the 4-digit code sent to ${mfaDestination || 'your registered contact'}.`
                      : identifier.trim()
                        ? `Enter the 4-digit verification code sent to ${identifier.trim()}.`
                        : 'Enter the 4-digit verification code sent to your registered contact.'
                  }
                />

                <AuthContent>
                  {/* Resend Success Pill */}
                  {resendSuccess && (
                    <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>New verification code sent successfully.</span>
                    </div>
                  )}

                  {/* General Error Banner */}
                  {generalError && (
                    <div
                      className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start justify-between gap-2.5 animate-in fade-in duration-200"
                      role="alert"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                        <span className="leading-snug break-words">{generalError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGeneralError(null)}
                        aria-label="Dismiss error"
                        className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <AuthForm onSubmit={handleOtpVerify}>
                    {/* 4-Digit Luxury OTP Group */}
                    <div>
                      <AuthOtpInput
                        value={otp}
                        onChange={(nextOtp) => {
                          setOtp(nextOtp)
                          setFieldErrors((prev) => ({ ...prev, otp: undefined }))
                        }}
                        hasError={!!fieldErrors.otp}
                        disabled={loading}
                      />
                      {fieldErrors.otp && (
                        <p className="mt-2 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
                          {fieldErrors.otp}
                        </p>
                      )}

                      {/* Demo OTP One-Click Helper */}
                      <div className="mt-3 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setOtp(['0', '0', '0', '0'])
                            setFieldErrors((prev) => ({ ...prev, otp: undefined }))
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Demo MFA Code: <strong>0000</strong> (Click to fill)</span>
                        </button>
                      </div>
                    </div>

                    {/* Verify CTA Button & Countdown */}
                    <AuthActions
                      primaryText="Verify OTP"
                      loadingText="Verifying code..."
                      loading={loading}
                      onClick={(e) => handleOtpVerify(e)}
                      secondaryAction={
                        <div className="space-y-3 pt-1">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span>Didn&apos;t receive the code? </span>
                            {canResendOtp ? (
                              <AuthLink onClick={handleResendOtp} className="font-semibold">
                                Resend OTP
                              </AuthLink>
                            ) : (
                              <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                                Resend OTP ({String(Math.floor(otpCountdown / 60)).padStart(2, '0')}:
                                {String(otpCountdown % 60).padStart(2, '0')})
                              </span>
                            )}
                          </div>

                          <div>
                            <AuthLink
                              onClick={() => {
                                setAuthMode('login')
                                setMfaToken(null)
                                setMfaDestination(null)
                                setMfaRole(null)
                                setGeneralError(null)
                                setFieldErrors({})
                              }}
                              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 no-underline hover:no-underline"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to Sign In</span>
                            </AuthLink>
                          </div>
                        </div>
                      }
                    />
                  </AuthForm>
                </AuthContent>

                {/* Security Reassurance Metadata */}
                <AuthMeta label="Secure PreOne workspace • Role-based access" />
              </>
            )}

          </AuthCard>
        </AuthFrame>
      </AuthViewport>

      <PreOneBuddy />

      {/* ── Forgot Password Dialog Modal ── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50 text-purple-600 dark:text-purple-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="forgot-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                    Need Password Help?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Account recovery protocol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              For security compliance, user credentials in PreOne are managed directly by your school administrator.
            </p>

            <div className="space-y-2.5 mb-5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Contact your <strong>School Principal</strong> or <strong>IT Admin</strong> to issue a password reset.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>For enterprise assistance, write to <a href="mailto:support@preone.in" className="text-purple-600 dark:text-purple-400 underline">support@preone.in</a>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full h-10 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  )
}
