'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FileSpreadsheet, User, Users, FileText, CheckCircle2, AlertCircle,
  Plus, Trash2, Upload, ShieldCheck, HeartPulse, MapPin, Phone, Mail,
  Calendar, Building2, Save, Send, AlertTriangle, X
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { StatusPill } from '@/components/preone'
import { useToast } from '@/components/preone/Toast'

export interface AdditionalGuardian {
  id?: string
  fullName: string
  relationship: string
  phone: string
  email?: string
  canPickup: boolean
  pickupPin?: string
  isFeePayer: boolean
  receivesCommunication: boolean
}

export interface StaffAdmissionFormModalProps {
  open: boolean
  onClose: () => void
  applicationId?: string | null
  initialData?: any
  branches: { id: string; name: string; isMain?: boolean }[]
  sessions: { id: string; name: string; isCurrent?: boolean }[]
  programs: any[]
  selectedBranchId: string
  selectedSessionId: string
  onSuccess: (app: any) => void
}

export function StaffAdmissionFormModal({
  open,
  onClose,
  applicationId,
  initialData,
  branches,
  sessions,
  programs,
  selectedBranchId,
  selectedSessionId,
  onSuccess,
}: StaffAdmissionFormModalProps) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'school' | 'child' | 'parent' | 'guardians' | 'documents' | 'declarations'>('school')
  const [saving, setSaving] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)

  // 1. School & Session
  const [branchId, setBranchId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [programId, setProgramId] = useState('')
  const [programType, setProgramType] = useState('NURSERY')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [leadNumber, setLeadNumber] = useState<string | null>(null)
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null)
  const [appStatus, setAppStatus] = useState<string>('DRAFT')

  // 2. Child Details
  const [childFirstName, setChildFirstName] = useState('')
  const [childMiddleName, setChildMiddleName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [childDob, setChildDob] = useState('')
  const [childGender, setChildGender] = useState('MALE')
  const [bloodGroup, setBloodGroup] = useState('')
  const [address, setAddress] = useState('')
  const [previousSchool, setPreviousSchool] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')

  // 3. Primary Parent
  const [parentName, setParentName] = useState('')
  const [parentRelationship, setParentRelationship] = useState('MOTHER')
  const [parentPhone, setParentPhone] = useState('')
  const [alternatePhone, setAlternatePhone] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [isPrimaryFeePayer, setIsPrimaryFeePayer] = useState(true)
  const [isPrimaryPickupAuth, setIsPrimaryPickupAuth] = useState(true)

  // 4. Additional Guardians
  const [guardians, setGuardians] = useState<AdditionalGuardian[]>([])

  // 5. Documents
  const [documents, setDocuments] = useState<any[]>([])

  // 6. Declarations & Notes
  const [notes, setNotes] = useState('')
  const [accuracyDeclared, setAccuracyDeclared] = useState(true)
  const [parentConsent, setParentConsent] = useState(true)
  const [authorizedPickupConsent, setAuthorizedPickupConsent] = useState(true)
  const [declaredByName, setDeclaredByName] = useState('')

  // Populate form on open / initialData change
  useEffect(() => {
    if (!open) return

    if (initialData) {
      setBranchId(initialData.branchId || (selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : ''))
      setAcademicYearId(initialData.academicSessionId || initialData.academicYearId || selectedSessionId || '')
      setProgramId(initialData.programId || '')
      setProgramType(initialData.programType || 'NURSERY')
      setLeadId(initialData.leadId || null)
      setLeadNumber(initialData.leadNumber || initialData.lead?.leadNumber || null)
      setApplicationNumber(initialData.applicationNumber || null)
      setAppStatus(initialData.status || 'DRAFT')

      setChildFirstName(initialData.childFirstName || '')
      setChildMiddleName(initialData.middleName || '')
      setChildLastName(initialData.childLastName || '')
      setChildDob(
        initialData.childDob
          ? new Date(initialData.childDob).toISOString().split('T')[0]
          : ''
      )
      setChildGender(initialData.childGender || 'MALE')
      setBloodGroup(initialData.bloodGroup || '')
      setAddress(initialData.address || '')
      setPreviousSchool(initialData.previousSchool || '')
      setMedicalNotes(initialData.medicalNotes || '')
      setEmergencyContact(initialData.emergencyContact || '')

      setParentName(initialData.parentName || '')
      setParentRelationship(initialData.relationship || 'MOTHER')
      setParentPhone(initialData.parentPhone || '')
      setAlternatePhone(initialData.alternatePhone || '')
      setParentEmail(initialData.parentEmail || '')

      setGuardians(
        Array.isArray(initialData.additionalGuardians) ? initialData.additionalGuardians : []
      )
      setDocuments(Array.isArray(initialData.documents) ? initialData.documents : [])
      setNotes(initialData.humanNotes || initialData.notes || '')

      if (initialData.declarations) {
        setAccuracyDeclared(Boolean(initialData.declarations.accuracyDeclared ?? true))
        setParentConsent(Boolean(initialData.declarations.parentConsent ?? true))
        setAuthorizedPickupConsent(Boolean(initialData.declarations.authorizedPickupConsent ?? true))
        setDeclaredByName(initialData.declarations.declaredByName || initialData.parentName || '')
      } else {
        setDeclaredByName(initialData.parentName || '')
      }
    } else {
      // Default new draft state
      setBranchId(selectedBranchId !== '__ALL_BRANCHES__' ? selectedBranchId : (branches[0]?.id || ''))
      setAcademicYearId(selectedSessionId || (sessions[0]?.id || ''))
      setProgramId('')
      setProgramType(programs[0]?.programType || 'NURSERY')
      setLeadId(null)
      setLeadNumber(null)
      setApplicationNumber(null)
      setAppStatus('DRAFT')

      setChildFirstName('')
      setChildMiddleName('')
      setChildLastName('')
      setChildDob('')
      setChildGender('MALE')
      setBloodGroup('')
      setAddress('')
      setPreviousSchool('')
      setMedicalNotes('')
      setEmergencyContact('')

      setParentName('')
      setParentRelationship('MOTHER')
      setParentPhone('')
      setAlternatePhone('')
      setParentEmail('')
      setIsPrimaryFeePayer(true)
      setIsPrimaryPickupAuth(true)

      setGuardians([])
      setDocuments([])
      setNotes('')
      setAccuracyDeclared(true)
      setParentConsent(true)
      setAuthorizedPickupConsent(true)
      setDeclaredByName('')
    }
    setActiveTab('school')
  }, [open, initialData, selectedBranchId, selectedSessionId, branches, sessions, programs])

  // Live program age eligibility check
  const ageCheck = useMemo(() => {
    if (!childDob || !programType) return null
    const birth = new Date(childDob)
    if (isNaN(birth.getTime())) return null
    const now = new Date()
    let y = now.getFullYear() - birth.getFullYear()
    let m = now.getMonth() - birth.getMonth()
    let d = now.getDate() - birth.getDate()
    let ageMonths = y * 12 + m
    if (d < 0) ageMonths -= 1
    ageMonths = Math.max(0, ageMonths)

    const prog = programs.find((p) => (p.programType || p.code) === programType || p.id === programId)
    if (!prog) return null

    const min = prog.ageMinMonths
    const max = prog.ageMaxMonths

    if (min != null && ageMonths < min) {
      return {
        eligible: false,
        ageMonths,
        reason: `Child is ${ageMonths} mo old; minimum required for ${prog.name} is ${min} mo.`,
      }
    }
    if (max != null && ageMonths > max) {
      return {
        eligible: false,
        ageMonths,
        reason: `Child is ${ageMonths} mo old; maximum permitted for ${prog.name} is ${max} mo.`,
      }
    }
    return {
      eligible: true,
      ageMonths,
      reason: `Eligible: ${ageMonths} months old (${prog.name})`,
    }
  }, [childDob, programType, programId, programs])

  // Guardian Repeater Handlers
  const handleAddGuardian = () => {
    setGuardians((prev) => [
      ...prev,
      {
        fullName: '',
        relationship: 'FATHER',
        phone: '',
        email: '',
        canPickup: true,
        pickupPin: '',
        isFeePayer: false,
        receivesCommunication: true,
      },
    ])
  }

  const handleUpdateGuardian = (index: number, field: keyof AdditionalGuardian, value: any) => {
    setGuardians((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleRemoveGuardian = (index: number) => {
    setGuardians((prev) => prev.filter((_, i) => i !== index))
  }

  // Document Upload Handler
  const handleAttachFile = async (docType: string, file: File) => {
    if (!applicationId) {
      toast.show('Please save the application draft first before attaching files.', { type: 'error' })
      return
    }

    setLoadingDoc(docType)
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          fileName: file.name,
          remarks: `Uploaded by staff (${file.name})`,
        }),
      }).then((r) => r.json())

      if (res.success) {
        toast.show(`Document attached: ${file.name}`, { type: 'success' })
        // Refresh documents list
        const refreshRes = await fetch(`/api/v1/applications/${applicationId}/documents`).then((r) => r.json())
        if (refreshRes.success && refreshRes.data?.documents) {
          setDocuments(refreshRes.data.documents)
        }
      } else {
        toast.show(res.error?.message || 'Failed to attach file', { type: 'error' })
      }
    } catch {
      toast.show('Network error attaching document', { type: 'error' })
    } finally {
      setLoadingDoc(null)
    }
  }

  // Document Remove Handler
  const handleRemoveFile = async (documentId: string) => {
    if (!applicationId) return
    setLoadingDoc(documentId)
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      }).then((r) => r.json())

      if (res.success) {
        toast.show('Document removed', { type: 'success' })
        const refreshRes = await fetch(`/api/v1/applications/${applicationId}/documents`).then((r) => r.json())
        if (refreshRes.success && refreshRes.data?.documents) {
          setDocuments(refreshRes.data.documents)
        }
      } else {
        toast.show(res.error?.message || 'Failed to remove document', { type: 'error' })
      }
    } catch {
      toast.show('Network error removing document', { type: 'error' })
    } finally {
      setLoadingDoc(null)
    }
  }

  // Save / Submit Master Handler
  const handleSave = async (isDraft: boolean) => {
    const targetBranch = branchId || selectedBranchId
    if (!targetBranch || targetBranch === '__ALL_BRANCHES__') {
      toast.show('Please select a specific school campus branch.', { type: 'error' })
      setActiveTab('school')
      return
    }

    if (!isDraft) {
      if (!childFirstName.trim()) {
        toast.show('Child first name is required for formal submission.', { type: 'error' })
        setActiveTab('child')
        return
      }
      if (!childDob) {
        toast.show('Child date of birth is required for formal submission.', { type: 'error' })
        setActiveTab('child')
        return
      }
      if (!parentName.trim() || !parentPhone.trim()) {
        toast.show('Primary parent name and phone are required for formal submission.', { type: 'error' })
        setActiveTab('parent')
        return
      }
      if (ageCheck && !ageCheck.eligible) {
        toast.show(ageCheck.reason, { type: 'error' })
        setActiveTab('child')
        return
      }
      if (!accuracyDeclared) {
        toast.show('Please check and confirm the accuracy declaration.', { type: 'error' })
        setActiveTab('declarations')
        return
      }
    } else {
      if (!childFirstName.trim() && !parentName.trim() && !parentPhone.trim()) {
        toast.show('Please enter at least a child name or parent contact to save a draft.', { type: 'error' })
        return
      }
    }

    setSaving(true)
    try {
      const selectedProg = programs.find((p) => (p.programType || p.code) === programType || p.id === programId)

      const payload = {
        branchId: targetBranch,
        academicYearId,
        programId: selectedProg?.id || programId || null,
        programType: selectedProg?.programType || programType,
        childFirstName: childFirstName.trim(),
        childLastName: childLastName.trim() || null,
        childMiddleName: childMiddleName.trim() || null,
        childDob: childDob || undefined,
        childGender,
        bloodGroup: bloodGroup || null,
        address: address.trim() || null,
        previousSchool: previousSchool.trim() || null,
        medicalNotes: medicalNotes.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        parentName: parentName.trim(),
        relationship: parentRelationship,
        parentPhone: parentPhone.trim(),
        alternatePhone: alternatePhone.trim() || null,
        parentEmail: parentEmail.trim() || null,
        additionalGuardians: guardians.filter((g) => g.fullName.trim() || g.phone.trim()),
        declarations: {
          accuracyDeclared,
          parentConsent,
          authorizedPickupConsent,
          declaredByName: declaredByName.trim() || parentName.trim(),
          declaredAt: new Date().toISOString(),
        },
        notes: notes.trim(),
        isDraft,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        leadId,
      }

      let res
      if (applicationId) {
        res = await fetch(`/api/v1/applications/${applicationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((r) => r.json())
      } else {
        res = await fetch('/api/v1/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then((r) => r.json())
      }

      if (res.success) {
        toast.show(
          isDraft
            ? 'Application draft saved successfully ✓'
            : 'Application submitted formally for review 📋',
          { type: 'success' }
        )
        onSuccess(res.data)
        onClose()
      } else {
        const msg = typeof res.error === 'string' ? res.error : res.error?.message || 'Failed to save application'
        toast.show(msg, { type: 'error' })
      }
    } catch {
      toast.show('Network error while saving application', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={applicationId ? `Admission Dossier: ${applicationNumber || 'Application'}` : 'New Admission Application'}
      subtitle="Comprehensive child record, parent guardians, document checklist, and declarations"
      icon={<FileSpreadsheet size={20} className="text-primary" />}
      size="xl"
    >
      <div className="space-y-4">
        {/* Status & Reference Header */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <StatusPill status={appStatus} />
            {applicationNumber && (
              <span className="font-mono text-xs font-bold text-foreground">
                #{applicationNumber}
              </span>
            )}
            {leadNumber && (
              <span className="text-[11px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded-lg border border-border/60">
                Lead: {leadNumber}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Strict PreOne Invariant: Submission does NOT create student or parent accounts.
          </div>
        </div>

        {/* Workspace Tab Navigator */}
        <div className="flex items-center gap-1.5 border-b border-border/80 overflow-x-auto no-scrollbar text-xs font-semibold">
          {[
            { id: 'school', label: '1. School & Session', icon: Building2 },
            { id: 'child', label: '2. Child Dossier', icon: User },
            { id: 'parent', label: '3. Primary Parent', icon: Users },
            { id: 'guardians', label: `4. Additional Guardians (${guardians.length})`, icon: Users },
            { id: 'documents', label: `5. Documents (${documents.length})`, icon: FileText },
            { id: 'declarations', label: '6. Declarations', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-bold bg-primary/[0.04]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="min-h-[380px] max-h-[55vh] overflow-y-auto pr-1 text-xs space-y-4">
          {/* TAB 1: SCHOOL & SESSION */}
          {activeTab === 'school' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    School Campus / Branch <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                    className="input h-9 text-xs w-full rounded-xl bg-card"
                  >
                    <option value="">Select Campus Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.isMain ? '(Main Campus)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Academic Cycle / Session</label>
                  <select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="input h-9 text-xs w-full rounded-xl bg-card"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isCurrent ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Target Program Level <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={programType}
                    onChange={(e) => {
                      setProgramType(e.target.value)
                      const p = programs.find((x) => (x.programType || x.code) === e.target.value || x.id === e.target.value)
                      if (p) setProgramId(p.id)
                    }}
                    className="input h-9 text-xs w-full rounded-xl bg-card"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.programType || p.code}>
                        {p.name} {p.ageMinMonths != null ? `(${p.ageMinMonths}–${p.ageMaxMonths ?? '∞'} mo)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Converted Lead / Enquiry #</label>
                  <input
                    readOnly
                    value={leadNumber || (leadId ? `ID: ${leadId}` : 'Direct Application (No lead)')}
                    className="input h-9 text-xs w-full rounded-xl bg-muted/50 cursor-not-allowed font-mono text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHILD DOSSIER */}
          {activeTab === 'child' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    placeholder="e.g. Aarav"
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Middle Name</label>
                  <input
                    value={childMiddleName}
                    onChange={(e) => setChildMiddleName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Last Name</label>
                  <input
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Date of Birth <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Gender</label>
                  <select
                    value={childGender}
                    onChange={(e) => setChildGender(e.target.value)}
                    className="input h-9 text-xs w-full rounded-xl"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="input h-9 text-xs w-full rounded-xl"
                  >
                    <option value="">Not Specified</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age Eligibility Feedback */}
              {ageCheck && (
                <div
                  className={`p-2.5 rounded-xl flex items-center gap-2 ${
                    ageCheck.eligible
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-destructive/10 border border-destructive/20 text-destructive'
                  }`}
                >
                  {ageCheck.eligible ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
                  <span>{ageCheck.reason}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Residential Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, apartment, locality, city, pincode..."
                  className="input p-2 text-xs w-full rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Previous School / Preschool</label>
                  <input
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    placeholder="None or previous playgroup"
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Emergency Contact (Name & Phone)</label>
                  <input
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Grandparent: 9876543210"
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <HeartPulse size={13} className="text-destructive" />
                  <span>Medical Notes / Allergies</span>
                </label>
                <input
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Peanut allergy, asthma inhaler required, speech delay notes"
                  className="input h-9 text-xs w-full rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PRIMARY PARENT */}
          {activeTab === 'parent' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Primary Parent / Guardian Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    className="input h-9 text-xs w-full rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Relationship to Child</label>
                  <select
                    value={parentRelationship}
                    onChange={(e) => setParentRelationship(e.target.value)}
                    className="input h-9 text-xs w-full rounded-xl"
                  >
                    <option value="MOTHER">Mother</option>
                    <option value="FATHER">Father</option>
                    <option value="GUARDIAN">Legal Guardian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Primary Mobile Phone <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="10-digit primary mobile"
                    className="input h-9 text-xs w-full rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Alternate Mobile Phone</label>
                  <input
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="Secondary phone"
                    className="input h-9 text-xs w-full rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Parent Email Address</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="input h-9 text-xs w-full rounded-xl"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/70 space-y-2">
                <span className="font-semibold text-foreground">Authorizations:</span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrimaryFeePayer}
                      onChange={(e) => setIsPrimaryFeePayer(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Designated Fee Payer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrimaryPickupAuth}
                      onChange={(e) => setIsPrimaryPickupAuth(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Authorized for Daily Dismissal / Pickup</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADDITIONAL GUARDIANS */}
          {activeTab === 'guardians' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Additional Guardians & Authorized Pickups</h3>
                  <p className="text-[11px] text-muted-foreground">Add father, mother, grandparents, or designated guardians with pickup permissions.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGuardian}
                  className="btn btn-outline btn-sm h-8 px-2.5 text-xs rounded-xl gap-1"
                >
                  <Plus size={13} />
                  <span>Add Guardian</span>
                </button>
              </div>

              {guardians.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-border/80 text-center space-y-2 bg-muted/20">
                  <Users size={24} className="mx-auto text-muted-foreground/60" />
                  <p className="font-medium text-foreground">No additional guardians recorded</p>
                  <p className="text-[11px] text-muted-foreground">Click "Add Guardian" above if a second parent or guardian is involved.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guardians.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="font-bold text-primary text-xs">Guardian #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuardian(idx)}
                          className="text-destructive hover:text-destructive/80 p-1"
                          title="Remove Guardian"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">Full Name *</label>
                          <input
                            value={g.fullName}
                            onChange={(e) => handleUpdateGuardian(idx, 'fullName', e.target.value)}
                            placeholder="Guardian Name"
                            className="input h-8 text-xs w-full rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">Relationship</label>
                          <select
                            value={g.relationship}
                            onChange={(e) => handleUpdateGuardian(idx, 'relationship', e.target.value)}
                            className="input h-8 text-xs w-full rounded-lg"
                          >
                            <option value="FATHER">Father</option>
                            <option value="MOTHER">Mother</option>
                            <option value="GRANDPARENT">Grandparent</option>
                            <option value="UNCLE">Uncle / Aunt</option>
                            <option value="GUARDIAN">Guardian</option>
                            <option value="DRIVER">Designated Driver / Escort</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">Phone *</label>
                          <input
                            value={g.phone}
                            onChange={(e) => handleUpdateGuardian(idx, 'phone', e.target.value)}
                            placeholder="Mobile phone"
                            className="input h-8 text-xs w-full rounded-lg font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">Email (Optional)</label>
                          <input
                            type="email"
                            value={g.email || ''}
                            onChange={(e) => handleUpdateGuardian(idx, 'email', e.target.value)}
                            placeholder="guardian@example.com"
                            className="input h-8 text-xs w-full rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">Pickup Security PIN (Optional)</label>
                          <input
                            value={g.pickupPin || ''}
                            onChange={(e) => handleUpdateGuardian(idx, 'pickupPin', e.target.value)}
                            placeholder="4-digit PIN"
                            maxLength={6}
                            className="input h-8 text-xs w-full rounded-lg font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={g.canPickup}
                            onChange={(e) => handleUpdateGuardian(idx, 'canPickup', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span>Authorized for Pickup</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={g.isFeePayer}
                            onChange={(e) => handleUpdateGuardian(idx, 'isFeePayer', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span>Fee Payer</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={g.receivesCommunication}
                            onChange={(e) => handleUpdateGuardian(idx, 'receivesCommunication', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span>Receives Notifications</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENT CHECKLIST */}
          {activeTab === 'documents' && (
            <div className="space-y-3.5">
              <div>
                <h3 className="font-semibold text-foreground">Document Checklist & Real Uploads</h3>
                <p className="text-[11px] text-muted-foreground">
                  Mandatory documents are policy-enforced; optional documents will not block admission confirmation.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { type: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', mandatory: true },
                  { type: 'PHOTO', label: 'Child Photograph', mandatory: true },
                  { type: 'PARENT_ID', label: 'Parent ID / Aadhaar', mandatory: false },
                  { type: 'MEDICAL_CERTIFICATE', label: 'Immunization / Medical Record', mandatory: false },
                  { type: 'ADDRESS_PROOF', label: 'Address Proof', mandatory: false },
                ].map((item) => {
                  const existingDoc = documents.find((d) => d.docType === item.type)
                  const isUploaded = existingDoc && existingDoc.status !== 'NOT_UPLOADED' && existingDoc.fileName && !existingDoc.fileName.endsWith('-pending.pdf')
                  const isVerified = existingDoc && (existingDoc.verified || existingDoc.status === 'VERIFIED')

                  return (
                    <div
                      key={item.type}
                      className="p-3 rounded-2xl border border-border/80 bg-card flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.mandatory ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {item.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {isUploaded ? existingDoc.fileName : 'No file uploaded yet'}
                        </p>
                        {existingDoc?.rejectionReason && (
                          <p className="text-[11px] text-destructive flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>Rejected: {existingDoc.rejectionReason}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isUploaded && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isVerified ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          }`}>
                            {isVerified ? 'VERIFIED' : 'PENDING REVIEW'}
                          </span>
                        )}

                        {/* Real file upload input */}
                        <label className="btn btn-outline btn-sm h-7.5 px-2.5 text-xs rounded-xl cursor-pointer gap-1">
                          <Upload size={12} />
                          <span>{isUploaded ? 'Replace' : 'Upload'}</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleAttachFile(item.type, f)
                            }}
                          />
                        </label>

                        {isUploaded && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(existingDoc.id)}
                            className="text-destructive hover:text-destructive/80 p-1"
                            title="Remove file"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 6: DECLARATIONS & CONSENT */}
          {activeTab === 'declarations' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
                <span className="font-bold text-primary text-xs uppercase tracking-wider">
                  Staff & Guardian Declarations
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accuracyDeclared}
                      onChange={(e) => setAccuracyDeclared(e.target.checked)}
                      className="mt-0.5 rounded border-border"
                    />
                    <div>
                      <p className="font-semibold text-foreground">Truthfulness & Accuracy Declaration</p>
                      <p className="text-[11px] text-muted-foreground">
                        All information submitted regarding child birth date, identity, and contact details has been verified against valid proofs.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      className="mt-0.5 rounded border-border"
                    />
                    <div>
                      <p className="font-semibold text-foreground">Parent Terms & Medical Consent</p>
                      <p className="text-[11px] text-muted-foreground">
                        Parent acknowledges school rules, emergency medical assistance protocols, and fee policies.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={authorizedPickupConsent}
                      onChange={(e) => setAuthorizedPickupConsent(e.target.checked)}
                      className="mt-0.5 rounded border-border"
                    />
                    <div>
                      <p className="font-semibold text-foreground">Safe Dismissal & Authorized Pickup Protocol</p>
                      <p className="text-[11px] text-muted-foreground">
                        The school will strictly release the child only to the primary parent or listed additional guardians with matching pickup credentials.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="space-y-1 pt-2 border-t border-primary/10">
                  <label className="font-semibold text-foreground">Declared By Name</label>
                  <input
                    value={declaredByName}
                    onChange={(e) => setDeclaredByName(e.target.value)}
                    placeholder="Full name of declaring parent / legal guardian"
                    className="input h-8 text-xs w-full rounded-lg bg-card"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Internal Staff Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context from campus interview, fee discussion, special handling..."
                  className="input p-2 text-xs w-full rounded-xl resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm h-9 px-3.5 text-xs rounded-xl"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="btn btn-outline btn-sm h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5"
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="btn btn-primary btn-sm h-9 px-4 text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
            >
              <Send size={13} />
              <span>{saving ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
