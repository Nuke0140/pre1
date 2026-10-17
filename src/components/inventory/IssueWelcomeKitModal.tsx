'use client'

import React, { useState, useEffect, useId } from 'react'
import {
  X,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  User,
  GraduationCap,
  Shirt,
  Calendar,
  Layers,
  Search,
  Check,
  Building,
  Loader2,
  FileText,
} from 'lucide-react'
import {
  WelcomeKitDetailsResult,
  WelcomeKitComponentDetail,
} from '@/lib/inventory/welcome-kit-service'

interface PreselectedStudent {
  id: string
  admissionNo: string
  fullName: string
  branchId?: string
  classroomName?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
}

interface LocationOption {
  id: string
  name: string
  code: string
  isMain?: boolean
}

interface IssueWelcomeKitModalProps {
  open: boolean
  onClose: () => void
  student?: PreselectedStudent | null
  locations?: LocationOption[]
  onSuccess: (result: {
    kitNumber: string
    kitIssuance: any
    stockIssue: any
  }) => void
}

export function IssueWelcomeKitModal({
  open,
  onClose,
  student: initialStudent,
  locations = [],
  onSuccess,
}: IssueWelcomeKitModalProps) {
  // Student state
  const [selectedStudent, setSelectedStudent] = useState<PreselectedStudent | null>(
    initialStudent || null
  )
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([])
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [eligibilityChecking, setEligibilityChecking] = useState(false)
  const [eligibilityInfo, setEligibilityInfo] = useState<any | null>(null)

  // Bundle & Variant state
  const [bundles, setBundles] = useState<any[]>([])
  const [selectedBundleId, setSelectedBundleId] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('M')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')

  // Live stock breakdown
  const [details, setDetails] = useState<WelcomeKitDetailsResult | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Form options
  const [notes, setNotes] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [overrideDuplicate, setOverrideDuplicate] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Initialize idempotency key and initial student
  useEffect(() => {
    if (open) {
      setIdempotencyKey(`kit_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`)
      setErrorMsg(null)
      if (initialStudent) {
        setSelectedStudent(initialStudent)
        if (initialStudent.guardianName) setGuardianName(initialStudent.guardianName)
      }
    }
  }, [open, initialStudent])

  // Set default location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      const main = locations.find((l) => l.isMain) || locations[0]
      setSelectedLocationId(main.id)
    }
  }, [locations, selectedLocationId])

  // Load available bundles
  useEffect(() => {
    if (open) {
      fetch('/api/v1/inventory/welcome-kits/bundles')
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data?.bundles) {
            setBundles(res.data.bundles)
            if (res.data.bundles.length > 0 && !selectedBundleId) {
              const defaultBundle =
                res.data.bundles.find((b: any) => b.code === 'NURSERY_WELCOME_KIT') ||
                res.data.bundles[0]
              setSelectedBundleId(defaultBundle.id)
            }
          }
        })
        .catch(console.error)
    }
  }, [open, selectedBundleId])

  // Search students when no student is preselected
  useEffect(() => {
    if (!initialStudent && studentSearchQuery.trim().length >= 2) {
      setSearchingStudents(true)
      const timer = setTimeout(() => {
        fetch(`/api/v1/inventory/welcome-kits/students?q=${encodeURIComponent(studentSearchQuery)}`)
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data?.students) {
              setStudentSearchResults(res.data.students)
            }
          })
          .catch(console.error)
          .finally(() => setSearchingStudents(false))
      }, 250)
      return () => clearTimeout(timer)
    } else {
      setStudentSearchResults([])
    }
  }, [studentSearchQuery, initialStudent])

  // Check student eligibility & previous kits whenever student changes
  useEffect(() => {
    if (selectedStudent?.id) {
      setEligibilityChecking(true)
      fetch(`/api/v1/inventory/welcome-kits/eligibility?studentId=${selectedStudent.id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            setEligibilityInfo(res.data)
            if (res.data.student?.primaryGuardian?.name && !guardianName) {
              setGuardianName(res.data.student.primaryGuardian.name)
            }
          }
        })
        .catch(console.error)
        .finally(() => setEligibilityChecking(false))
    } else {
      setEligibilityInfo(null)
    }
  }, [selectedStudent?.id])

  // Fetch live bundle details & stock breakdown
  useEffect(() => {
    if (!selectedBundleId) return

    setLoadingDetails(true)
    const params = new URLSearchParams()
    params.set('bundleId', selectedBundleId)
    params.set('uniformSize', selectedSize)
    if (selectedLocationId) params.set('locationId', selectedLocationId)
    if (selectedStudent?.branchId) params.set('branchId', selectedStudent.branchId)

    fetch(`/api/v1/inventory/welcome-kits/bundles?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setDetails(res.data)
        } else {
          setErrorMsg(res.error?.message || 'Failed to load bundle details')
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoadingDetails(false))
  }, [selectedBundleId, selectedSize, selectedLocationId, selectedStudent?.branchId])

  // Submission handler
  const handleIssueKit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      setErrorMsg('Please select a student first.')
      return
    }

    if (details && !details.allInStock) {
      setErrorMsg('Cannot issue welcome kit: one or more items have insufficient stock.')
      return
    }

    if (eligibilityInfo?.hasPreviousKit && !overrideDuplicate) {
      setErrorMsg('This student already received a welcome kit. Check the override box to proceed.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/v1/inventory/welcome-kits/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          bundleId: selectedBundleId,
          uniformSize: selectedSize,
          locationId: selectedLocationId,
          branchId: selectedStudent.branchId,
          notes,
          guardianName,
          overrideDuplicate,
          idempotencyKey,
        }),
      })

      const json = await res.json()

      if (json.success && json.data) {
        onSuccess({
          kitNumber: json.data.kitNumber || json.data.kitIssuance?.kitNumber,
          kitIssuance: json.data.kitIssuance,
          stockIssue: json.data.stockIssue,
        })
        onClose()
      } else {
        setErrorMsg(json.error?.message || 'Failed to issue welcome kit.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while issuing welcome kit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const isBlockedByStock = details ? !details.allInStock : false
  const isBlockedByDuplicate = eligibilityInfo?.hasPreviousKit && !overrideDuplicate

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#faf5ff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Issue Student Welcome Kit
              </h3>
              <p style={{ fontSize: '0.78rem', margin: '2px 0 0 0', color: '#64748b' }}>
                1-click bundle issuance with atomic stock deduction & printable handover slip
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleIssueKit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Error Banner */}
            {errorMsg && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Issuance Blocked:</strong> {errorMsg}
                </div>
              </div>
            )}

            {/* STEP 1: Student Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                1. Recipient Student
              </label>

              {selectedStudent ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '999px',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                        {selectedStudent.fullName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Adm No: <strong>{selectedStudent.admissionNo}</strong>
                        {selectedStudent.classroomName ? ` • ${selectedStudent.classroomName}` : ''}
                      </div>
                    </div>
                  </div>

                  {!initialStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null)
                        setEligibilityInfo(null)
                      }}
                      style={{
                        fontSize: '0.75rem',
                        color: '#7c3aed',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 11,
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search student by name or admission number..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    {searchingStudents && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ position: 'absolute', right: 12, top: 11, color: '#7c3aed' }}
                      />
                    )}
                  </div>

                  {studentSearchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '100%',
                        marginTop: 4,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        zIndex: 50,
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {studentSearchResults.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent({
                              id: s.id,
                              admissionNo: s.admissionNo,
                              fullName: s.fullName,
                              branchId: s.branchId,
                              classroomName: s.classroom?.name,
                              guardianName: s.primaryGuardian?.name,
                              guardianPhone: s.primaryGuardian?.phone,
                            })
                            setStudentSearchQuery('')
                            setStudentSearchResults([])
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                              {s.fullName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {s.admissionNo} {s.classroom ? `• ${s.classroom.name}` : ''}
                            </div>
                          </div>
                          {s.hasPreviousKit && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                fontWeight: 600,
                              }}
                            >
                              Kit Issued
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DUPLICATE KIT ALERT BANNER */}
            {eligibilityInfo?.hasPreviousKit && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <AlertTriangle size={16} />
                  <span>Student Already Received a Welcome Kit</span>
                </div>
                <p style={{ margin: '4px 0 8px 0', fontSize: '0.78rem', color: '#78350f' }}>
                  Student was previously issued <strong>{eligibilityInfo.previousKit?.bundleName}</strong> (
                  {eligibilityInfo.previousKit?.kitNumber}) on{' '}
                  {new Date(eligibilityInfo.previousKit?.issueDate).toLocaleDateString()}.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={overrideDuplicate}
                    onChange={(e) => setOverrideDuplicate(e.target.checked)}
                  />
                  <span>Permit re-issuance (e.g. replacement uniform or second session)</span>
                </label>
              </div>
            )}

            {/* STEP 2: Bundle & Variant Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {/* Bundle Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  2. Welcome Kit Bundle
                </label>
                <select
                  value={selectedBundleId}
                  onChange={(e) => setSelectedBundleId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {bundles.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.totalQuantity || b.itemsCount} items)
                    </option>
                  ))}
                </select>
              </div>

              {/* Uniform Size Selector */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  <span>3. Uniform Size</span>
                  <span style={{ fontSize: '0.7rem', color: '#7c3aed', textTransform: 'none' }}>
                    (2 Sets Included)
                  </span>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['S', 'M', 'L', 'XL'].map((sz) => {
                    const isSelected = selectedSize === sz
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        style={{
                          flex: 1,
                          padding: '7px 0',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#ede9fe' : '#ffffff',
                          color: isSelected ? '#6d28d9' : '#475569',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Store Location Selection */}
            {locations.length > 1 && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  Fulfill From Store Location
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* STEP 3: Component Breakdown & Live Stock Pre-check */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                  }}
                >
                  4. Bundle Contents & Live Stock Check
                </label>
                {details && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: details.allInStock ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {details.allInStock
                      ? `✓ All ${details.totalItemsCount} items ready in stock`
                      : `⚠ Insufficient stock on ${details.insufficientItems.length} items`}
                  </span>
                )}
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                {loadingDetails ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
                    <span style={{ fontSize: '0.8rem' }}>Checking store stock levels...</span>
                  </div>
                ) : details ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Item Component</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: '#475569' }}>Qty Needed</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', color: '#475569' }}>Available Stock</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.components.map((comp) => (
                        <tr
                          key={comp.bundleItemId}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: comp.hasSufficientStock ? 'transparent' : '#fef2f2',
                          }}
                        >
                          <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{comp.itemName}</span>
                              {comp.hasVariants && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: '#ede9fe',
                                    color: '#6d28d9',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  Size {comp.selectedVariant}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                              {comp.sku}
                            </div>
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700 }}>
                            {comp.quantityRequired} {comp.unit}
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              textAlign: 'center',
                              fontWeight: 700,
                              color: comp.hasSufficientStock ? '#0f172a' : '#b91c1c',
                            }}
                          >
                            {comp.availableStock} {comp.unit}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                            {comp.hasSufficientStock ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#15803d',
                                  backgroundColor: '#dcfce7',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                }}
                              >
                                <Check size={12} /> In Stock
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#b91c1c',
                                  backgroundColor: '#fee2e2',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                }}
                              >
                                Low Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total Items Included:</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: '#7c3aed' }}>
                          {details.totalItemsCount} units
                        </td>
                        <td colSpan={2} style={{ padding: '8px 12px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                          Deduction is all-or-nothing
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : null}
              </div>
            </div>

            {/* Handover & Guardian Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  Parent / Receiver Name
                </label>
                <input
                  type="text"
                  placeholder="Parent or guardian receiving the kit..."
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  Optional Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received in lobby, term 1 session"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 22px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {isBlockedByStock ? (
                <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                  Cannot confirm: replenish out-of-stock items first
                </span>
              ) : isBlockedByDuplicate ? (
                <span style={{ color: '#b45309', fontWeight: 600 }}>
                  Acknowledge duplicate issuance override above
                </span>
              ) : (
                <span>Atomic deduction • PreOne stock ledger updated</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || !selectedStudent || isBlockedByStock || isBlockedByDuplicate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor:
                    submitting || !selectedStudent || isBlockedByStock || isBlockedByDuplicate
                      ? '#cbd5e1'
                      : '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor:
                    submitting || !selectedStudent || isBlockedByStock || isBlockedByDuplicate
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Issuing Bundle...</span>
                  </>
                ) : (
                  <>
                    <Package size={16} />
                    <span>Confirm & Issue Welcome Kit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
