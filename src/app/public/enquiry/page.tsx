'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  Building2,
  Sparkles,
  Send,
  Phone,
  Mail,
  User,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  MapPin,
  School,
  Check,
  ShieldCheck,
  HelpCircle,
  RotateCcw,
} from 'lucide-react'

// Official WhatsApp icon
function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.031 2C6.516 2 2.031 6.484 2.031 12c0 1.86.516 3.64 1.484 5.203L2 22l4.953-1.484A9.972 9.972 0 0 0 12.031 22C17.547 22 22.031 17.516 22.031 12s-4.484-10-10-10zm0 18.281c-1.625 0-3.187-.438-4.562-1.25l-.328-.188-3.375 1.016 1.031-3.281-.203-.344A8.257 8.257 0 0 1 3.75 12c0-4.562 3.719-8.281 8.281-8.281 4.563 0 8.281 3.719 8.281 8.281s-3.718 8.281-8.281 8.281zm4.531-6.172c-.25-.125-1.469-.734-1.703-.812-.234-.094-.406-.125-.578.125-.172.25-.656.812-.812.984-.156.172-.313.188-.563.063-.25-.125-1.047-.391-2-1.234-.734-.656-1.234-1.469-1.375-1.719-.141-.25-.016-.391.109-.516.109-.109.25-.281.375-.422.125-.141.172-.234.25-.391.078-.156.047-.313-.016-.438-.063-.125-.578-1.391-.797-1.906-.219-.516-.438-.438-.594-.453l-.516-.016c-.172 0-.453.063-.688.313-.234.25-.906.875-.906 2.141s.922 2.484 1.063 2.656c.141.172 1.813 2.766 4.391 3.875.609.266 1.094.422 1.469.547.625.203 1.188.172 1.641.109.5-.078 1.469-.609 1.672-1.203.203-.594.203-1.094.141-1.203-.063-.109-.234-.172-.484-.297z" />
    </svg>
  )
}

interface Branch {
  id: string
  name: string
  code: string
  isMain: boolean
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  phone?: string | null
  email?: string | null
  timingOpen?: string | null
  timingClose?: string | null
}

interface Program {
  id: string
  code: string
  name: string
  programType: string
  description?: string | null
  ageMinMonths?: number | null
  ageMaxMonths?: number | null
  durationMonths?: number | null
}

interface Shift {
  id: string
  name: string
  timings: string
}

function calculateChildAge(dobString: string) {
  if (!dobString) return null
  const birth = new Date(dobString)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let y = now.getFullYear() - birth.getFullYear()
  let m = now.getMonth() - birth.getMonth()
  let d = now.getDate() - birth.getDate()
  if (d < 0) m -= 1
  if (m < 0) {
    y -= 1
    m += 12
  }
  const totalMonths = Math.max(0, y * 12 + m)
  const displayText = y > 0 ? `${y} yr ${m} mo (${totalMonths} mo)` : `${totalMonths} months`
  return { totalMonths, years: y, months: m, displayText }
}

function PublicEnquiryForm() {
  const searchParams = useSearchParams()
  const initialBranchParam = searchParams.get('branchId') || ''
  const initialSchoolCode = searchParams.get('schoolCode') || searchParams.get('code') || ''

  // Loading & submission state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<any | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Current wizard step: 1 (Child & Parent Basics) or 2 (Program & Preferences)
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Validated, setStep1Validated] = useState(false)

  // Institution branding & academic setup metadata
  const [schoolName, setSchoolName] = useState('PreOne Preschool')
  const [schoolCode, setSchoolCode] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [academicSession, setAcademicSession] = useState<{ id: string; name: string } | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [whatsAppNumber, setWhatsAppNumber] = useState<string | null>(null)
  const [schoolContact, setSchoolContact] = useState<any>(null)

  // Dependent academic data
  const [programs, setPrograms] = useState<Program[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [programFetchError, setProgramFetchError] = useState<string | null>(null)

  // Step 1 Form fields
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [branchId, setBranchId] = useState(initialBranchParam)

  // Step 2 Form fields
  const [interestedProgram, setInterestedProgram] = useState('')
  const [preferredShift, setPreferredShift] = useState('')
  const [notes, setNotes] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  // Step 1 Field error flags for inline feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Resolve selected branch record
  const selectedBranch = useMemo(() => {
    return branches.find((b) => b.id === branchId) || (branches.length === 1 ? branches[0] : null)
  }, [branches, branchId])

  // Resolve selected program record
  const selectedProgramObj = useMemo(() => {
    return (
      programs.find(
        (p) =>
          p.id === interestedProgram ||
          p.programType === interestedProgram ||
          p.code === interestedProgram
      ) || null
    )
  }, [programs, interestedProgram])

  // Calculate reactive child age
  const childAge = useMemo(() => calculateChildAge(childDob), [childDob])

  // 1. Initial Load: Fetch institution profile, academic session, branding & campus list
  useEffect(() => {
    const query = new URLSearchParams()
    if (initialSchoolCode) query.set('schoolCode', initialSchoolCode)
    if (initialBranchParam) query.set('branchId', initialBranchParam)

    fetch(`/api/v1/public/enquiry?${query.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        setLoading(false)
        if (json.success && json.data) {
          const d = json.data
          if (d.schoolName) setSchoolName(d.schoolName)
          if (d.schoolCode) setSchoolCode(d.schoolCode)
          if (d.logoUrl) setLogoUrl(d.logoUrl)
          if (d.academicSession) setAcademicSession(d.academicSession)
          if (d.whatsAppNumber) setWhatsAppNumber(d.whatsAppNumber)
          if (d.schoolContact) setSchoolContact(d.schoolContact)

          if (d.branches && d.branches.length > 0) {
            setBranches(d.branches)
            const matched = d.branches.find((b: Branch) => b.id === initialBranchParam)
            if (matched) {
              setBranchId(matched.id)
            } else if (d.branches.length === 1) {
              // Preselect single campus
              setBranchId(d.branches[0].id)
            } else if (d.selectedBranchId) {
              setBranchId(d.selectedBranchId)
            }
          }

          if (d.programs) setPrograms(d.programs)
          if (d.shifts) setShifts(d.shifts)
        }
      })
      .catch(() => {
        setLoading(false)
        setErrorMsg('Unable to connect to the admissions server. Please try refreshing.')
      })
  }, [initialBranchParam, initialSchoolCode])

  // 2. Campus Change Effect: Dynamically reloads campus-specific programs & shifts
  useEffect(() => {
    if (!branchId || branchId === '__ALL_BRANCHES__' || branchId === 'all') {
      return
    }

    const controller = new AbortController()
    setProgramsLoading(true)
    setProgramFetchError(null)

    const query = new URLSearchParams({ branchId })
    if (initialSchoolCode) query.set('schoolCode', initialSchoolCode)

    fetch(`/api/v1/public/enquiry?${query.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        setProgramsLoading(false)
        if (json.success && json.data) {
          const fetchedPrograms = json.data.programs || []
          setPrograms(fetchedPrograms)
          if (json.data.shifts) setShifts(json.data.shifts)
          if (json.data.whatsAppNumber) setWhatsAppNumber(json.data.whatsAppNumber)

          // Clear previously selected program if not available at the new campus
          setInterestedProgram((prev) => {
            if (!prev) return ''
            const isStillOffered = fetchedPrograms.some(
              (p: Program) =>
                p.id === prev ||
                p.programType === prev ||
                p.programType === prev.toUpperCase() ||
                p.code === prev
            )
            return isStillOffered ? prev : ''
          })
        } else {
          setPrograms([])
          setInterestedProgram('')
          setProgramFetchError(json.error?.message || 'No programs configured for this campus.')
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setProgramsLoading(false)
        setProgramFetchError('Failed to load programs for this campus.')
      })

    return () => {
      controller.abort()
    }
  }, [branchId, initialSchoolCode])

  // Validate Step 1 before proceeding
  const handleProceedToStep2 = () => {
    const errors: Record<string, string> = {}

    if (!parentName.trim()) {
      errors.parentName = 'Parent / Guardian name is required.'
    } else if (parentName.trim().length < 2) {
      errors.parentName = 'Please enter a valid full name.'
    }

    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) {
      errors.phone = 'Mobile number is required.'
    } else if (cleanPhone.length < 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number.'
    } else if (cleanPhone.length === 10 && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.'
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please provide a valid email address.'
      }
    }

    if (!childDob) {
      errors.childDob = 'Child date of birth is required for admission eligibility.'
    } else {
      const parsed = new Date(childDob)
      if (isNaN(parsed.getTime())) {
        errors.childDob = 'Please select a valid date of birth.'
      } else if (parsed > new Date()) {
        errors.childDob = 'Date of birth cannot be in the future.'
      }
    }

    if (!branchId && branches.length > 0) {
      errors.branchId = 'Please select a campus / branch.'
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length === 0) {
      setStep1Validated(true)
      setErrorMsg(null)
      setStep(2)
      // Scroll to top of form card on step change for mobile friendliness
      window.scrollTo({ top: 120, behavior: 'smooth' })
    } else {
      setErrorMsg('Please complete all required fields correctly before proceeding.')
    }
  }

  // Handle final enquiry submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!consentGiven) {
      setErrorMsg('Please check the consent box to receive admission details and updates.')
      return
    }

    if (!interestedProgram) {
      setErrorMsg('Please choose an academic program / class.')
      return
    }

    const cleanPhone = phone.replace(/\D/g, '')
    setSubmitting(true)

    try {
      const res = await fetch('/api/v1/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: parentName.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          childName: childName.trim() || undefined,
          childDob,
          branchId: branchId || undefined,
          academicSessionId: academicSession?.id || undefined,
          schoolCode: schoolCode || initialSchoolCode || undefined,
          interestedProgram,
          preferredShift: preferredShift || undefined,
          notes: notes.trim() || undefined,
          consentGiven: true,
        }),
      })

      const json = await res.json()
      setSubmitting(false)

      if (json.success) {
        setSubmitted({
          ...json.data,
          submittedProgram: selectedProgramObj?.name || interestedProgram,
          submittedShift: preferredShift || 'Standard Session',
          submittedChild: childName.trim() || 'Your child',
          submittedDob: childDob,
        })
        window.scrollTo({ top: 100, behavior: 'smooth' })
      } else {
        const errorDetail = json.error?.validation?.[0]?.message || json.error?.message
        setErrorMsg(errorDetail || 'Enquiry submission failed. Please verify your details and try again.')
      }
    } catch {
      setSubmitting(false)
      setErrorMsg('A network error occurred. Please check your connection and try again.')
    }
  }

  // Reset form cleanly for another enquiry
  const handleResetForm = () => {
    setSubmitted(null)
    setStep(1)
    setParentName('')
    setPhone('')
    setEmail('')
    setChildName('')
    setChildDob('')
    setInterestedProgram('')
    setPreferredShift('')
    setNotes('')
    setConsentGiven(false)
    setFieldErrors({})
    setErrorMsg(null)
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* ============================================================== */}
        {/* 1. INSTITUTION BRANDING & WELCOME BANNER                       */}
        {/* ============================================================== */}
        <header className="text-center space-y-3 pt-2">
          {/* Logo container with fallback */}
          <div className="flex justify-center items-center">
            {logoUrl ? (
              <div className="h-16 max-w-[200px] flex items-center justify-center p-1.5 rounded-2xl bg-card border border-border/60 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`${schoolName} Logo`}
                  className="max-h-full max-w-full object-contain"
                  onError={() => setLogoUrl(null)}
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
                <School className="w-7 h-7" />
              </div>
            )}
          </div>

          {/* School Name & Academic Session Badge */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
              {schoolName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                <span>
                  Admissions Open {academicSession?.name ? `· ${academicSession.name}` : ''}
                </span>
              </span>
              {selectedBranch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>{selectedBranch.name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Welcoming Admissions Subtitle */}
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Welcome to {schoolName} Admissions. Tell us a little about your child, and our admissions team will help you with the next steps.
          </p>
        </header>

        {/* ============================================================== */}
        {/* 2. FORM WIZARD CONTAINER                                       */}
        {/* ============================================================== */}
        <main className="bg-card shadow-sm border border-border/60 rounded-3xl overflow-hidden transition-all duration-300">
          {/* Confirmed / Thank You Screen */}
          {submitted ? (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                  Thank you! Your enquiry has been submitted.
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Our admissions team at <span className="font-semibold text-foreground">{schoolName}</span> will help you with the next steps.
                </p>
              </div>

              {/* Reference Number Pill */}
              {submitted.leadNumber && (
                <div className="inline-flex flex-col items-center justify-center px-5 py-2.5 bg-muted/60 rounded-2xl border border-border/60 text-xs font-mono font-semibold text-foreground">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-medium">
                    Enquiry Reference Number
                  </span>
                  <span className="text-sm font-bold text-primary">{submitted.leadNumber}</span>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-border/60 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Campus:</span>
                  <span className="font-semibold text-foreground">{submitted.campusName || selectedBranch?.name || 'Main Campus'}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Child:</span>
                  <span className="font-semibold text-foreground">{submitted.submittedChild}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Interested Program:</span>
                  <span className="font-semibold text-primary">{submitted.submittedProgram}</span>
                </div>
                {submitted.submittedShift && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Preferred Timing:</span>
                    <span className="font-semibold text-foreground">{submitted.submittedShift}</span>
                  </div>
                )}
              </div>

              {/* WHATSAPP INTEGRATION CTA */}
              {submitted.whatsAppNumber || whatsAppNumber ? (
                <div className="space-y-2 pt-2 max-w-md mx-auto">
                  <a
                    href={`https://wa.me/${(submitted.whatsAppNumber || whatsAppNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hello, I have submitted an admission enquiry to ${schoolName}. My enquiry reference is ${submitted.leadNumber || ''}. I would like to know the next steps.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 w-full py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0 fill-current" />
                    <span>Chat with our Admissions Counselor on WhatsApp</span>
                  </a>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Have quick questions about fees, bus routes, or booking a campus visit? Reach us directly on WhatsApp.
                  </p>
                </div>
              ) : (
                /* Fallback contact info when WhatsApp is not configured */
                <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60 text-xs text-muted-foreground space-y-1 max-w-md mx-auto">
                  <p className="font-medium text-foreground">Need immediate assistance?</p>
                  <p>
                    Call our admissions office at{' '}
                    <span className="font-semibold text-foreground">
                      {selectedBranch?.phone || schoolContact?.phone || 'our campus'}
                    </span>{' '}
                    or email{' '}
                    <span className="font-semibold text-foreground">
                      {selectedBranch?.email || schoolContact?.email || 'admissions team'}
                    </span>
                    .
                  </p>
                </div>
              )}

              {/* Submit another enquiry button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-outline btn-sm rounded-xl text-xs font-semibold gap-1.5 inline-flex items-center"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Submit Another Enquiry</span>
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* TWO-STEP FORM WIZARD                                           */
            /* ============================================================== */
            <div>
              {/* TWO-STEP PROGRESS INDICATOR */}
              <div className="border-b border-border/60 bg-muted/20 px-6 py-4">
                <div className="flex items-center justify-between max-w-sm mx-auto">
                  {/* Step 1 Pill */}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-left group focus:outline-none"
                    aria-current={step === 1 ? 'step' : undefined}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 1
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                          : step1Validated
                          ? 'bg-emerald-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step1Validated && step !== 1 ? <Check size={14} /> : '1'}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          step === 1 ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        Child & Parent
                      </p>
                      <p className="text-[10px] text-muted-foreground">Basics & Campus</p>
                    </div>
                  </button>

                  {/* Connecting line */}
                  <div className="flex-1 mx-3 h-0.5 bg-border/80" />

                  {/* Step 2 Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      if (step1Validated) setStep(2)
                      else handleProceedToStep2()
                    }}
                    className="flex items-center gap-2 text-left group focus:outline-none"
                    aria-current={step === 2 ? 'step' : undefined}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === 2
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      2
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          step === 2 ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        Program & Timing
                      </p>
                      <p className="text-[10px] text-muted-foreground">Preferences</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-8">
                {/* Global Error Banner */}
                {errorMsg && (
                  <div className="mb-5 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                )}

                {loading ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-muted-foreground">
                      Loading admissions configuration...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ======================================================== */}
                    {/* STEP 1: CHILD & PARENT BASICS                           */}
                    {/* ======================================================== */}
                    {step === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="border-b border-border/40 pb-2 mb-3">
                          <h2 className="text-sm font-bold text-foreground font-heading">
                            Step 1: Parent & Child Details
                          </h2>
                          <p className="text-[11px] text-muted-foreground">
                            Please provide your contact details so our admissions counselor can reach you.
                          </p>
                        </div>

                        {/* Parent Full Name */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <User size={13} className="text-primary" />
                            <span>Parent / Guardian Full Name *</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Priya Sharma"
                            value={parentName}
                            onChange={(e) => {
                              setParentName(e.target.value)
                              if (fieldErrors.parentName) {
                                setFieldErrors((prev) => ({ ...prev, parentName: '' }))
                              }
                            }}
                            className={`input text-xs w-full h-10 rounded-2xl ${
                              fieldErrors.parentName ? 'border-destructive focus:ring-destructive' : ''
                            }`}
                          />
                          {fieldErrors.parentName && (
                            <p className="text-[11px] text-destructive font-medium">
                              {fieldErrors.parentName}
                            </p>
                          )}
                        </div>

                        {/* Phone & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Mobile Number with India code pill */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Phone size={13} className="text-primary" />
                              <span>Mobile Number *</span>
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs font-bold text-muted-foreground">
                                +91
                              </span>
                              <input
                                type="tel"
                                required
                                maxLength={10}
                                placeholder="9876543210"
                                value={phone}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '')
                                  setPhone(val)
                                  if (fieldErrors.phone) {
                                    setFieldErrors((prev) => ({ ...prev, phone: '' }))
                                  }
                                }}
                                className={`input text-xs w-full h-10 pl-11 rounded-2xl ${
                                  fieldErrors.phone ? 'border-destructive focus:ring-destructive' : ''
                                }`}
                              />
                            </div>
                            {fieldErrors.phone ? (
                              <p className="text-[11px] text-destructive font-medium">
                                {fieldErrors.phone}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">
                                10-digit mobile number for call & WhatsApp updates
                              </p>
                            )}
                          </div>

                          {/* Email Address */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Mail size={13} className="text-primary" />
                              <span>Email Address (Optional)</span>
                            </label>
                            <input
                              type="email"
                              placeholder="parent@example.com"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value)
                                if (fieldErrors.email) {
                                  setFieldErrors((prev) => ({ ...prev, email: '' }))
                                }
                              }}
                              className={`input text-xs w-full h-10 rounded-2xl ${
                                fieldErrors.email ? 'border-destructive focus:ring-destructive' : ''
                              }`}
                            />
                            {fieldErrors.email && (
                              <p className="text-[11px] text-destructive font-medium">
                                {fieldErrors.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Child Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          {/* Child Name */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                              Child Name (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Aarav Sharma"
                              value={childName}
                              onChange={(e) => setChildName(e.target.value)}
                              className="input text-xs w-full h-10 rounded-2xl"
                            />
                          </div>

                          {/* Child DOB */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <Calendar size={13} className="text-primary" />
                                <span>Child Date of Birth *</span>
                              </label>
                              {childAge && (
                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                  {childAge.displayText}
                                </span>
                              )}
                            </div>
                            <input
                              type="date"
                              required
                              value={childDob}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                setChildDob(e.target.value)
                                if (fieldErrors.childDob) {
                                  setFieldErrors((prev) => ({ ...prev, childDob: '' }))
                                }
                              }}
                              className={`input text-xs w-full h-10 rounded-2xl ${
                                fieldErrors.childDob ? 'border-destructive focus:ring-destructive' : ''
                              }`}
                            />
                            {fieldErrors.childDob ? (
                              <p className="text-[11px] text-destructive font-medium">
                                {fieldErrors.childDob}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">
                                Used to verify program eligibility and age placement
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Campus / Branch Selection */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 size={13} className="text-primary" />
                            <span>Select Campus / Branch *</span>
                          </label>

                          {branches.length === 0 ? (
                            <div className="p-3 bg-muted/40 rounded-2xl text-xs text-muted-foreground">
                              No active campus branches currently configured.
                            </div>
                          ) : branches.length === 1 ? (
                            /* Single Campus Simplification */
                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground">
                                  {branches[0].name}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  Main Campus
                                </span>
                              </div>
                              {branches[0].address && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <MapPin size={11} className="shrink-0" />
                                  <span>
                                    {branches[0].address}
                                    {branches[0].city ? `, ${branches[0].city}` : ''}
                                  </span>
                                </p>
                              )}
                              {branches[0].timingOpen && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock size={11} className="shrink-0" />
                                  <span>
                                    Timings: {branches[0].timingOpen} – {branches[0].timingClose || '04:00 PM'}
                                  </span>
                                </p>
                              )}
                            </div>
                          ) : (
                            /* Multi-Campus Selection Dropdown */
                            <div className="space-y-2">
                              <select
                                value={branchId}
                                onChange={(e) => {
                                  setBranchId(e.target.value)
                                  if (fieldErrors.branchId) {
                                    setFieldErrors((prev) => ({ ...prev, branchId: '' }))
                                  }
                                }}
                                className={`input text-xs w-full h-10 rounded-2xl bg-card ${
                                  fieldErrors.branchId ? 'border-destructive' : ''
                                }`}
                              >
                                <option value="">Select a campus branch...</option>
                                {branches.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} {b.city ? `(${b.city})` : ''} {b.isMain ? '★ Main' : ''}
                                  </option>
                                ))}
                              </select>
                              {fieldErrors.branchId && (
                                <p className="text-[11px] text-destructive font-medium">
                                  {fieldErrors.branchId}
                                </p>
                              )}
                              {selectedBranch && (
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground space-y-0.5">
                                  {selectedBranch.address && (
                                    <p className="flex items-center gap-1">
                                      <MapPin size={11} className="text-primary shrink-0" />
                                      <span>
                                        {selectedBranch.address}
                                        {selectedBranch.city ? `, ${selectedBranch.city}` : ''}
                                      </span>
                                    </p>
                                  )}
                                  {selectedBranch.timingOpen && (
                                    <p className="flex items-center gap-1">
                                      <Clock size={11} className="text-primary shrink-0" />
                                      <span>
                                        Operating Hours: {selectedBranch.timingOpen} – {selectedBranch.timingClose || '04:00 PM'}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Continue Button */}
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={handleProceedToStep2}
                            className="btn btn-primary w-full h-11 rounded-2xl text-xs font-bold shadow-xs gap-2 justify-center"
                          >
                            <span>Continue to Program & Preferences</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* STEP 2: PROGRAM & PREFERENCES                           */}
                    {/* ======================================================== */}
                    {step === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="border-b border-border/40 pb-2 mb-3 flex items-center justify-between">
                          <div>
                            <h2 className="text-sm font-bold text-foreground font-heading">
                              Step 2: Program & Timing Preferences
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                              Select your desired academic class and convenient daily schedule.
                            </p>
                          </div>
                          {academicSession?.name && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {academicSession.name}
                            </span>
                          )}
                        </div>

                        {/* Program / Class Selection */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <School size={13} className="text-primary" />
                              <span>Academic Program / Class *</span>
                            </label>
                            {programsLoading && (
                              <span className="text-[10px] text-muted-foreground animate-pulse">
                                Loading campus programs...
                              </span>
                            )}
                          </div>

                          <select
                            value={interestedProgram}
                            onChange={(e) => setInterestedProgram(e.target.value)}
                            disabled={programsLoading || programs.length === 0}
                            className="input text-xs w-full h-10 rounded-2xl bg-card disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {programsLoading
                                ? 'Loading offerings...'
                                : programs.length === 0
                                ? 'No programs available for this campus'
                                : 'Select Program / Class...'}
                            </option>
                            {programs.map((p) => {
                              const ageRange =
                                p.ageMinMonths != null || p.ageMaxMonths != null
                                  ? ` (${p.ageMinMonths ?? 0}–${p.ageMaxMonths ?? '∞'} mo)`
                                  : ''
                              return (
                                <option key={p.id} value={p.programType || p.code}>
                                  {p.name} {ageRange}
                                </option>
                              )
                            })}
                          </select>

                          {programFetchError && (
                            <p className="text-[11px] text-destructive font-medium">
                              {programFetchError}
                            </p>
                          )}

                          {/* Dynamic Age Eligibility Guidance */}
                          {childAge && selectedProgramObj && (
                            <div className="mt-1">
                              {(() => {
                                const min = selectedProgramObj.ageMinMonths
                                const max = selectedProgramObj.ageMaxMonths
                                const m = childAge.totalMonths

                                if (min != null && m < min) {
                                  return (
                                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                      <p className="font-semibold flex items-center gap-1.5">
                                        <AlertCircle size={13} className="shrink-0" />
                                        <span>Age Advisory: Child is {childAge.displayText}</span>
                                      </p>
                                      <p className="text-[11px] leading-relaxed">
                                        Typical age range for {selectedProgramObj.name} is {min} to{' '}
                                        {max ?? 'Flexible'} months. You may proceed with your enquiry, and our admissions team will advise on optimal readiness and placement.
                                      </p>
                                    </div>
                                  )
                                }

                                if (max != null && m > max) {
                                  return (
                                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                      <p className="font-semibold flex items-center gap-1.5">
                                        <AlertCircle size={13} className="shrink-0" />
                                        <span>Age Notice: Child is {childAge.displayText}</span>
                                      </p>
                                      <p className="text-[11px] leading-relaxed">
                                        Recommended criteria for {selectedProgramObj.name} is up to {max} months. You can still submit; our team will review child readiness.
                                      </p>
                                    </div>
                                  )
                                }

                                if (min != null || max != null) {
                                  return (
                                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                                      <span>
                                        Child is {childAge.displayText} (Eligible for {selectedProgramObj.name}).
                                      </span>
                                    </div>
                                  )
                                }

                                return null
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Preferred Shift Selection */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Clock size={13} className="text-primary" />
                            <span>Preferred Shift / Schedule</span>
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {shifts.map((s) => {
                              const isSelected = preferredShift === s.name || preferredShift === s.id
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setPreferredShift(s.name)}
                                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                                      : 'border-border/60 bg-card hover:bg-muted/40 text-muted-foreground'
                                  }`}
                                >
                                  <p className="text-xs font-bold leading-tight text-foreground">
                                    {s.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {s.timings}
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Additional Questions / Notes */}
                        <div className="space-y-1 pt-1">
                          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <HelpCircle size={13} className="text-primary" />
                            <span>Questions or Preferred Visit Timings (Optional)</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Inquiring about daycare hours, transport van routes, or scheduling a Saturday campus tour..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input text-xs w-full rounded-2xl py-2 resize-none"
                          />
                        </div>

                        {/* Mandatory Privacy & Contact Consent */}
                        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={consentGiven}
                              onChange={(e) => setConsentGiven(e.target.checked)}
                              className="checkbox checkbox-primary checkbox-xs mt-0.5 rounded-md"
                            />
                            <span className="text-[11px] text-muted-foreground leading-relaxed select-none">
                              I consent to be contacted by <span className="font-semibold text-foreground">{schoolName}</span> regarding admission updates, campus tour schedules, and fee details via phone, SMS, and WhatsApp.
                            </span>
                          </label>
                        </div>

                        {/* Wizard Buttons: Back & Submit */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg(null)
                              setStep(1)
                            }}
                            className="btn btn-outline h-11 rounded-2xl text-xs font-semibold gap-1.5 justify-center"
                          >
                            <ArrowLeft size={13} />
                            <span>Back</span>
                          </button>

                          <button
                            type="submit"
                            disabled={submitting || !consentGiven}
                            className="btn btn-primary h-11 rounded-2xl text-xs font-bold shadow-xs gap-1.5 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Send size={13} />
                            <span>{submitting ? 'Submitting...' : 'Submit Enquiry'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ============================================================== */}
        {/* 3. FOOTER TRUST & PRIVACY NOTICE                              */}
        {/* ============================================================== */}
        <footer className="text-center space-y-1 text-[11px] text-muted-foreground py-2">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck size={13} className="text-primary" />
            <span>Secure admissions portal powered by PreOne Preschool OS</span>
          </p>
          <p>© {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default function PublicEnquiryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50/70 dark:bg-slate-950">
          <div className="text-xs font-semibold text-muted-foreground animate-pulse">
            Loading Enquiry Portal...
          </div>
        </div>
      }
    >
      <PublicEnquiryForm />
    </Suspense>
  )
}
