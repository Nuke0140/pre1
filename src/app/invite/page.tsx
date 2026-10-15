'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Building,
  User,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  fullName: string
  username: string | null
  role: string
  schoolName: string
  schoolCode: string
  expiresAt: string
}

function InviteAcceptForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(true)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // Password fields
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Password policy check
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigitOrSpecial = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  const isMatch = password.length > 0 && password === confirmPassword
  const isFormValid = hasMinLength && hasLetter && hasDigitOrSpecial && isMatch

  useEffect(() => {
    if (!token) {
      setError('No invitation token was provided in the link.')
      setVerifying(false)
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/v1/auth/invitation?token=${encodeURIComponent(token)}`)
        const json = await res.json()

        if (!res.ok || !json.success) {
          const errMsg = json.error?.message || json.message || 'Invitation is invalid or has expired.'
          setError(errMsg)
          if (json.error?.code === 'INVITATION_EXPIRED' || errMsg.toLowerCase().includes('expired')) {
            setIsExpired(true)
          }
        } else {
          setInvitation(json.data)
          if (json.data.username) {
            setUsername(json.data.username)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Network error while validating invitation link.')
      } finally {
        setVerifying(false)
        setLoading(false)
      }
    }

    verify()
  }, [token])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !token) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/auth/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          username: username.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Failed to activate account.')
      }

      setCompleted(true)
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Verifying your invitation link...
        </p>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="text-center py-8 space-y-5">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to PreOne!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Your credentials have been configured and your account in <strong>{invitation?.schoolName}</strong> is now fully active.
          </p>
        </div>

        <div className="pt-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6 space-y-5">
        <div className={`w-14 h-14 ${isExpired ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600' : 'bg-red-100 dark:bg-red-950/60 text-red-600'} rounded-2xl mx-auto flex items-center justify-center shadow-xs`}>
          {isExpired ? <Clock className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isExpired ? 'Invitation Expired' : 'Unable to Verify Invitation'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {error}
          </p>
        </div>

        {isExpired && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-left text-xs text-amber-900 dark:text-amber-200 space-y-1 max-w-sm mx-auto">
            <div className="font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Security Policy (7-Day Expiry)</span>
            </div>
            <p className="text-amber-700 dark:text-amber-300">
              Invitations expire after 7 days for school security. Please notify your school administrator or principal to issue an updated invitation link.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/auth/login"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Return to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <form onSubmit={handleActivate} className="space-y-5">
      {/* School & Invitee Badge */}
      <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 rounded-xl space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
          <Building className="w-3.5 h-3.5" />
          <span>{invitation.schoolName} ({invitation.schoolCode})</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-purple-200/40 dark:border-purple-800/20">
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {invitation.fullName}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {invitation.email}
            </div>
          </div>
          <span className="badge b-purple text-xs font-bold uppercase tracking-wider px-2.5 py-0.5">
            {invitation.role}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Username field (optional customization) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Login Username <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 font-mono text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
              placeholder={invitation.email.split('@')[0]}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            You can sign in using either your username or email address.
          </p>
        </div>

        {/* Password input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Choose Your Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Policy Checklist */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg space-y-1.5 text-xs">
          <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>At least 8 characters in length</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Contains uppercase or lowercase letter</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasDigitOrSpecial ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Contains at least one number or symbol</span>
          </div>
          <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passwords match</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || submitting}
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Activating Account...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Activate Account &amp; Sign In</span>
          </>
        )}
      </button>
    </form>
  )
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>PreOne School Operations OS</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          Account Setup &amp; Onboarding
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Complete your workspace invitation to access your school dashboard
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-5 sm:px-8 shadow-xl shadow-purple-500/5 sm:rounded-2xl border border-gray-100 dark:border-gray-800">
          <Suspense fallback={<div className="py-12 text-center text-xs text-gray-500">Loading invitation...</div>}>
            <InviteAcceptForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
