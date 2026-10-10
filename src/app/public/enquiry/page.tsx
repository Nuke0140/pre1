'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Building, Heart, Sparkles, Send, Phone, Mail, User, Calendar } from 'lucide-react'

export default function PublicEnquiryPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<any | null>(null)

  const [schoolName, setSchoolName] = useState('PreOne Preschool')
  const [branches, setBranches] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])

  // Form states
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [childName, setChildName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [branchId, setBranchId] = useState('')
  const [interestedProgram, setInterestedProgram] = useState('')
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial school metadata
    fetch('/api/v1/public/enquiry')
      .then((r) => r.json())
      .then((json) => {
        setLoading(false)
        if (json.success && json.data) {
          if (json.data.schoolName) setSchoolName(json.data.schoolName)
          if (json.data.branches) {
            setBranches(json.data.branches)
            if (json.data.branches.length > 0) setBranchId(json.data.branches[0].id)
          }
          if (json.data.programs) setPrograms(json.data.programs)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanPhone = phone.trim().replace(/\D/g, '')
    if (!parentName.trim() || cleanPhone.length < 10) {
      setErrorMsg('Please provide your name and a valid 10-digit mobile number.')
      return
    }

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
          childDob: childDob || undefined,
          branchId: branchId || undefined,
          interestedProgram: interestedProgram || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const json = await res.json()
      setSubmitting(false)

      if (json.success) {
        setSubmitted(json.data)
      } else {
        setErrorMsg(json.error?.message || 'Submission failed. Please try again.')
      }
    } catch {
      setSubmitting(false)
      setErrorMsg('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2 shadow-xs">
          <Heart size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {schoolName}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Admission Enquiry & Campus Tour Request
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-6 px-5 sm:px-8 shadow-sm border border-border/80 rounded-2xl">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">
                  Enquiry Received!
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {submitted.message}
                </p>
              </div>
              {submitted.leadNumber && (
                <div className="p-3 bg-muted/40 rounded-xl text-xs font-mono font-semibold">
                  Reference: {submitted.leadNumber}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(null)
                    setParentName('')
                    setPhone('')
                    setEmail('')
                    setChildName('')
                    setChildDob('')
                    setNotes('')
                  }}
                  className="btn btn-outline btn-sm h-8 rounded-xl text-xs font-semibold"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Parent Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User size={13} className="text-primary" />
                  <span>Parent / Guardian Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="input text-xs w-full h-9 rounded-xl"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone size={13} className="text-primary" />
                    <span>Mobile Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input text-xs w-full h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail size={13} className="text-primary" />
                    <span>Email (Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input text-xs w-full h-9 rounded-xl"
                  />
                </div>
              </div>

              {/* Child Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Child Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="input text-xs w-full h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                    className="input text-xs w-full h-9 rounded-xl"
                  />
                </div>
              </div>

              {/* Branch & Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Branch / Campus *
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="input text-xs w-full h-9 rounded-xl bg-card"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Interested Program
                  </label>
                  <select
                    value={interestedProgram}
                    onChange={(e) => setInterestedProgram(e.target.value)}
                    className="input text-xs w-full h-9 rounded-xl bg-card"
                  >
                    <option value="">Select Program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.programType || p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Questions or Preferred Visit Timings
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inquiring about daycare hours, school bus transport, or fee schedule..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input text-xs w-full rounded-xl py-2 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full h-9 rounded-xl text-xs font-bold shadow-xs gap-1.5 justify-center mt-2"
              >
                <Send size={13} />
                <span>{submitting ? 'Submitting...' : 'Submit Admission Enquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
