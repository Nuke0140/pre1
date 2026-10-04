'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  GraduationCap, Check, AlertCircle, RefreshCw, X, Sparkles,
  Users, CheckCircle2, ChevronRight, FileText, Send, Eye,
  SlidersHorizontal, Download, Layers, ShieldCheck, AlertTriangle
} from 'lucide-react'
import { Modal } from '@/components/preone/Modal'
import { Avatar, StatusBadge } from '@/components/preone/ui'
import { useToast } from '@/components/preone/Toast'

interface Props {
  open: boolean
  onClose: () => void
  defaultClassroomId?: string
  defaultAcademicSessionId?: string
  onComplete?: () => void
}

interface StudentItem {
  id: string
  name: string
  admissionNo: string
  photoUrl?: string | null
  seatNumber?: string | null
}

export interface TemplateFieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'grade' | 'rating' | 'textarea' | 'select'
  options?: string[]
  description?: string
  required?: boolean
  ordering?: number
}

interface StudentEvaluationState {
  overallGrade: string
  remarks: string
  attendancePct: string
  customFields: Record<string, any>
}

export function BulkReportCardModal({
  open,
  onClose,
  defaultClassroomId,
  defaultAcademicSessionId,
  onComplete,
}: Props) {
  const toast = useToast()

  // Masters
  const [sessions, setSessions] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [templateFields, setTemplateFields] = useState<TemplateFieldDef[]>([])

  // Selections
  const [sessionId, setSessionId] = useState(defaultAcademicSessionId || '')
  const [classroomId, setClassroomId] = useState(defaultClassroomId || '')
  const [term, setTerm] = useState('Term 1 Evaluation')
  const [templateId, setTemplateId] = useState('')

  // Students & Values
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, StudentEvaluationState>>({})
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  // Bulk Apply Toolbar
  const [bulkField, setBulkField] = useState<string>('remarks')
  const [bulkValue, setBulkValue] = useState('')

  // Processing & Results
  const [saving, setSaving] = useState(false)
  const [saveOutcome, setSaveOutcome] = useState<{
    successCount: number
    failedCount: number
    errors?: Array<{ studentId: string; studentName?: string; error: string }>
  } | null>(null)

  // 1. Load Context Masters
  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch('/api/v1/academic-years').then((r) => r.json()),
      fetch('/api/v1/classrooms?pageSize=100').then((r) => r.json()),
      fetch('/api/v1/templates?type=REPORT_CARD').then((r) => r.json()),
    ])
      .then(([sJson, cJson, tJson]) => {
        if (sJson.success && Array.isArray(sJson.data)) {
          setSessions(sJson.data)
          if (!sessionId) {
            const current = sJson.data.find((s: any) => s.isCurrent) || sJson.data[0]
            if (current) setSessionId(current.id)
          }
        }
        if (cJson.success && Array.isArray(cJson.data)) {
          setClassrooms(cJson.data)
          if (!classroomId && cJson.data[0]) {
            setClassroomId(cJson.data[0].id)
          }
        }
        if (tJson.success && Array.isArray(tJson.data)) {
          setTemplates(tJson.data)
          if (tJson.data[0]) {
            setTemplateId(tJson.data[0].id)
          }
        }
      })
      .catch((err) => console.error('Failed to load masters:', err))
  }, [open, defaultAcademicSessionId, defaultClassroomId])

  // 2. Load Template Dynamic Fields whenever template changes
  useEffect(() => {
    if (!templateId) return
    fetch(`/api/v1/academics/report-cards/fields?templateId=${encodeURIComponent(templateId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.fields)) {
          setTemplateFields(json.data.fields)
        }
      })
      .catch((err) => console.error('Failed to load template fields:', err))
  }, [templateId])

  // 3. Load classroom students & pre-fill existing evaluations
  const loadClassroomData = useCallback(async () => {
    if (!classroomId || !sessionId) return
    setLoadingStudents(true)
    setSaveOutcome(null)

    try {
      // 1. Fetch classroom students
      const sRes = await fetch(`/api/v1/students?classroomId=${classroomId}&pageSize=100`).then((r) => r.json())
      const studentList: StudentItem[] = sRes.success && Array.isArray(sRes.data)
        ? sRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            admissionNo: s.admissionNo,
            photoUrl: s.photoUrl,
            seatNumber: s.seatNumber,
          }))
        : []
      setStudents(studentList)

      // 2. Fetch existing report cards for this class, session and term to pre-populate
      const rcRes = await fetch(
        `/api/v1/academics/report-cards?classroomId=${classroomId}&academicSessionId=${sessionId}&term=${encodeURIComponent(term)}`
      ).then((r) => r.json())

      const existingMap: Record<string, any> = {}
      if (rcRes.success && Array.isArray(rcRes.data?.reportCards)) {
        rcRes.data.reportCards.forEach((rc: any) => {
          existingMap[rc.studentId] = rc
        })
      }

      // 3. Initialize evaluation state for each student
      const initialMap: Record<string, StudentEvaluationState> = {}
      studentList.forEach((s) => {
        const existing = existingMap[s.id]
        const fv = (existing?.fieldValues as Record<string, any>) || {}

        // Populate custom fields from dynamic template fields
        const customMap: Record<string, any> = {}
        templateFields.forEach((tf) => {
          customMap[tf.key] = fv[tf.key]?.value ?? (tf.type === 'rating' ? 'Mastered' : '')
        })

        // Also preserve any keys present in fv that might be extra
        Object.entries(fv).forEach(([k, v]: [string, any]) => {
          if (!['overallGrade', 'remarks', 'attendancePct'].includes(k) && customMap[k] === undefined) {
            customMap[k] = v?.value ?? ''
          }
        })

        initialMap[s.id] = {
          overallGrade: existing?.overallGrade || 'A',
          remarks: existing?.remarks || '',
          attendancePct: existing?.attendancePct ? String(existing.attendancePct) : '95',
          customFields: customMap,
        }
      })

      setEvaluations(initialMap)
      setSelectedStudentIds([])
    } catch (err: any) {
      toast.error('Failed to load classroom students', err.message)
    } finally {
      setLoadingStudents(false)
    }
  }, [classroomId, sessionId, term, templateFields, toast])

  useEffect(() => {
    if (open && classroomId && sessionId) {
      loadClassroomData()
    }
  }, [open, classroomId, sessionId, term, loadClassroomData])

  // Update core student field
  const updateStudentField = (studentId: string, field: 'overallGrade' | 'remarks' | 'attendancePct', value: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }))
  }

  // Update dynamic custom field
  const updateCustomField = (studentId: string, fieldKey: string, value: any) => {
    setEvaluations((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        customFields: {
          ...(prev[studentId]?.customFields || {}),
          [fieldKey]: value,
        },
      },
    }))
  }

  // Selection helpers
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(students.map((s) => s.id))
    }
  }

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Active bulk field metadata
  const activeBulkFieldDef = useMemo(() => {
    return templateFields.find((f) => f.key === bulkField)
  }, [templateFields, bulkField])

  // Apply Common Value to Selected Students
  const applyCommonValue = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('No students selected', 'Please select one or more students using checkboxes.')
      return
    }
    if (!bulkValue.trim()) {
      toast.error('Value required', 'Select or enter the value to apply.')
      return
    }

    setEvaluations((prev) => {
      const next = { ...prev }
      selectedStudentIds.forEach((id) => {
        if (next[id]) {
          if (bulkField === 'remarks' || bulkField === 'overallGrade' || bulkField === 'attendancePct') {
            next[id] = {
              ...next[id],
              [bulkField]: bulkValue.trim(),
            }
          } else {
            next[id] = {
              ...next[id],
              customFields: {
                ...(next[id].customFields || {}),
                [bulkField]: bulkValue.trim(),
              },
            }
          }
        }
      })
      return next
    })

    toast.success('Applied to selection', `Updated ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'}.`)
  }

  // Save All Evaluated Students
  const handleSave = async (targetStatus: 'DRAFT' | 'REVIEWED' | 'PUBLISHED') => {
    if (students.length === 0) return
    if (!templateId) {
      toast.error('Missing Template', 'Please select a Report Card template.')
      return
    }

    setSaving(true)
    setSaveOutcome(null)

    const payloadItems = students.map((s) => {
      const state = evaluations[s.id] || {
        overallGrade: 'A',
        remarks: '',
        attendancePct: '95',
        customFields: {},
      }

      const fieldValues: Record<string, any> = {
        overallGrade: { key: 'overallGrade', label: 'Overall Grade', type: 'grade', value: state.overallGrade },
        remarks: { key: 'remarks', label: 'Educator Remarks', type: 'textarea', value: state.remarks },
        attendancePct: { key: 'attendancePct', label: 'Attendance %', type: 'number', value: state.attendancePct },
      }

      // Add each dynamic template field
      templateFields.forEach((tf) => {
        fieldValues[tf.key] = {
          key: tf.key,
          label: tf.label,
          type: tf.type,
          description: tf.description,
          value: state.customFields?.[tf.key] ?? (tf.type === 'rating' ? 'Mastered' : ''),
        }
      })

      // Add any additional custom fields that may be present
      Object.entries(state.customFields || {}).forEach(([k, v]) => {
        if (!fieldValues[k]) {
          fieldValues[k] = {
            key: k,
            label: k,
            type: 'text',
            value: v,
          }
        }
      })

      return {
        studentId: s.id,
        overallGrade: state.overallGrade,
        remarks: state.remarks,
        attendancePct: parseInt(state.attendancePct, 10) || null,
        fieldValues,
      }
    })

    try {
      const res = await fetch('/api/v1/academics/report-cards/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicSessionId: sessionId,
          classroomId,
          term,
          templateId,
          status: targetStatus,
          items: payloadItems,
        }),
      })

      const json = await res.json()
      if (json.success) {
        const studentMap = new Map(students.map((st) => [st.id, st.name]))
        const failedErrors = (json.data.results || [])
          .filter((r: any) => !r.success)
          .map((r: any) => ({
            studentId: r.studentId,
            studentName: studentMap.get(r.studentId) || r.studentId,
            error: r.error || 'Evaluation save failed',
          }))

        setSaveOutcome({
          successCount: json.data.successCount,
          failedCount: json.data.failedCount,
          errors: failedErrors,
        })

        if (json.data.failedCount === 0) {
          toast.success(
            targetStatus === 'PUBLISHED' ? 'Reports Published!' : 'Report Cards Saved!',
            `Successfully saved ${json.data.successCount} of ${students.length} student records.`
          )
          if (onComplete) onComplete()
        } else {
          toast.warning(
            'Partial Save Completed',
            `${json.data.successCount} succeeded, ${json.data.failedCount} had errors. Review error messages below.`
          )
        }
      } else {
        toast.error('Bulk save failed', json.error?.message || 'Check connection and retry')
      }
    } catch (err: any) {
      toast.error('Network Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Teacher Bulk Report Card Entry"
      subtitle="Evaluate classroom students with dynamic template criteria and batch apply tools"
      icon={<GraduationCap size={24} />}
      wide
    >
      <div className="space-y-5">
        {/* ── 1. CONFIGURATION STRIP ── */}
        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Academic Session</label>
            <select
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 font-medium text-slate-800 dark:text-slate-200"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '★' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Classroom / Section</label>
            <select
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 font-medium text-slate-800 dark:text-slate-200"
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Evaluation Term</label>
            <select
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 font-medium text-slate-800 dark:text-slate-200"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="Term 1 Evaluation">Term 1 Evaluation</option>
              <option value="Term 2 Mid-Year">Term 2 Mid-Year</option>
              <option value="Term 3 Final Assessment">Term 3 Final Assessment</option>
              <option value="Annual Holistic Review">Annual Holistic Review</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Template Studio Format</label>
            <select
              className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 font-medium text-slate-800 dark:text-slate-200"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 2. "APPLY TO SELECTED" TOOLBAR ── */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
            >
              {selectedStudentIds.length === students.length && students.length > 0
                ? 'Deselect All'
                : `Select All (${students.length})`}
            </button>
            <span className="text-slate-500 font-medium">
              {selectedStudentIds.length} child{selectedStudentIds.length === 1 ? '' : 'ren'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Batch Apply:</span>
            <select
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-medium max-w-[200px]"
              value={bulkField}
              onChange={(e) => {
                setBulkField(e.target.value)
                setBulkValue('')
              }}
            >
              <optgroup label="Standard Fields">
                <option value="remarks">Educator Remarks</option>
                <option value="overallGrade">Overall Grade</option>
                <option value="attendancePct">Attendance %</option>
              </optgroup>
              {templateFields.length > 0 && (
                <optgroup label="Template Evaluation Fields">
                  {templateFields.map((tf) => (
                    <option key={tf.key} value={tf.key}>{tf.label}</option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Input according to bulk field type */}
            {bulkField === 'overallGrade' ? (
              <select
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              >
                <option value="">Select Grade...</option>
                <option value="A+">A+ (Exemplary)</option>
                <option value="A">A (Proficient)</option>
                <option value="B">B (Developing)</option>
                <option value="C">C (Emerging)</option>
                <option value="Mastered">Mastered</option>
                <option value="Developing">Developing</option>
              </select>
            ) : activeBulkFieldDef && (activeBulkFieldDef.type === 'rating' || (activeBulkFieldDef.options && activeBulkFieldDef.options.length > 0)) ? (
              <select
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              >
                <option value="">Select Rating...</option>
                {(activeBulkFieldDef.options || ['Mastered', 'Developing', 'Emerging']).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={bulkField === 'attendancePct' ? 'number' : 'text'}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-56 placeholder:text-slate-400"
                placeholder={
                  bulkField === 'remarks'
                    ? 'e.g. Participates enthusiastically in activities'
                    : bulkField === 'attendancePct'
                    ? 'e.g. 96'
                    : 'Enter value...'
                }
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
              />
            )}

            <button
              type="button"
              onClick={applyCommonValue}
              disabled={selectedStudentIds.length === 0}
              className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Apply to Selected</span>
            </button>
          </div>
        </div>

        {/* ── 3. ROSTER EVALUATION GRID ── */}
        {loadingStudents ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-purple-600" />
            Loading classroom roster and existing term entries...
          </div>
        ) : students.length > 0 ? (
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800">
                <tr className="text-slate-500">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded accent-purple-600"
                    />
                  </th>
                  <th className="p-3 min-w-[190px]">Student</th>
                  <th className="p-3 w-28">Grade</th>
                  <th className="p-3 w-24">Attend %</th>
                  <th className="p-3 min-w-[280px]">Teacher Observations & Remarks</th>
                  <th className="p-3 min-w-[280px]">
                    Template Evaluation Criteria ({templateFields.length || 5})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {students.map((s) => {
                  const state = evaluations[s.id] || {
                    overallGrade: 'A',
                    remarks: '',
                    attendancePct: '95',
                    customFields: {},
                  }
                  const isSelected = selectedStudentIds.includes(s.id)

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-purple-50/30 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(s.id)}
                          className="rounded accent-purple-600"
                        />
                      </td>

                      {/* Student Info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.name} src={s.photoUrl} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {s.admissionNo} {s.seatNumber ? `• Seat ${s.seatNumber}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Overall Grade */}
                      <td className="p-3">
                        <select
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-purple-700 dark:text-purple-300"
                          value={state.overallGrade}
                          onChange={(e) => updateStudentField(s.id, 'overallGrade', e.target.value)}
                        >
                          <option value="A+">A+ (Exemplary)</option>
                          <option value="A">A (Proficient)</option>
                          <option value="B">B (Developing)</option>
                          <option value="C">C (Emerging)</option>
                          <option value="Mastered">Mastered</option>
                          <option value="Developing">Developing</option>
                        </select>
                      </td>

                      {/* Attendance % */}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-16 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-semibold"
                            value={state.attendancePct}
                            onChange={(e) => updateStudentField(s.id, 'attendancePct', e.target.value)}
                          />
                          <span className="text-slate-400 font-bold">%</span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="p-3">
                        <textarea
                          rows={2}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-purple-500 resize-none"
                          placeholder="Enter child-specific narrative observations..."
                          value={state.remarks}
                          onChange={(e) => updateStudentField(s.id, 'remarks', e.target.value)}
                        />
                      </td>

                      {/* Dynamic Template Fields */}
                      <td className="p-3">
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          {(templateFields.length > 0 ? templateFields : [
                            { key: 'domainMotor', label: 'Motor Skills', type: 'rating', options: ['Mastered', 'Developing', 'Emerging'] },
                            { key: 'domainLanguage', label: 'Language', type: 'rating', options: ['Mastered', 'Developing', 'Emerging'] },
                            { key: 'domainSocial', label: 'Social & Harmony', type: 'rating', options: ['Mastered', 'Developing', 'Emerging'] },
                            { key: 'domainCognitive', label: 'Cognitive', type: 'rating', options: ['Mastered', 'Developing', 'Emerging'] },
                          ]).map((f: any) => {
                            const val = state.customFields?.[f.key] ?? (f.type === 'rating' ? 'Mastered' : '')
                            const options = f.options || ['Mastered', 'Developing', 'Emerging']

                            return (
                              <div key={f.key}>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold truncate" title={f.label}>
                                  {f.label}:
                                </span>
                                {f.type === 'rating' || (f.options && f.options.length > 0) ? (
                                  <select
                                    className="w-full h-7 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    value={val}
                                    onChange={(e) => updateCustomField(s.id, f.key, e.target.value)}
                                  >
                                    {options.map((opt: string) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={f.type === 'number' ? 'number' : 'text'}
                                    className="w-full h-7 px-1.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    value={val}
                                    onChange={(e) => updateCustomField(s.id, f.key, e.target.value)}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs">
            No active students assigned to this classroom section.
          </div>
        )}

        {/* ── 4. OUTCOME REPORTING & ACTIONABLE ERRORS ── */}
        {saveOutcome && (
          <div className="space-y-2">
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              saveOutcome.failedCount === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                {saveOutcome.failedCount === 0 ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600" />
                )}
                <span>
                  <b>{saveOutcome.successCount}</b> report card evaluations persisted successfully.
                </span>
              </div>
              {saveOutcome.failedCount > 0 && (
                <span className="text-rose-600 font-bold">{saveOutcome.failedCount} records rejected</span>
              )}
            </div>

            {saveOutcome.errors && saveOutcome.errors.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
                <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                  <AlertCircle size={14} />
                  <span>Actionable Errors:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {saveOutcome.errors.map((err, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">{err.studentName}:</span> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── 5. ACTION BUTTONS ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving || students.length === 0}
              onClick={() => handleSave('DRAFT')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>

            <button
              type="button"
              disabled={saving || students.length === 0}
              onClick={() => handleSave('REVIEWED')}
              className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 text-xs font-semibold transition-colors disabled:opacity-40"
            >
              Mark Reviewed
            </button>

            <button
              type="button"
              disabled={saving || students.length === 0}
              onClick={() => handleSave('PUBLISHED')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Publish & Make Visible to Parents</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
