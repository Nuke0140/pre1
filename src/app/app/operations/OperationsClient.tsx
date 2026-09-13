'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, CheckCircle2, CalendarCheck, Users, RefreshCw, Siren,
  QrCode, ScanLine, ShieldCheck, ShieldAlert, KeyRound, Clock, HeartPulse,
  Utensils, Moon, Droplets, Sun, Sparkles, UserCheck, PhoneCall, ChevronRight,
  FileText, Search, Filter, Baby, Bath, Smile
} from 'lucide-react'
import { PageHead, KpiTile, StatusBadge, Skeleton, Avatar, EmptyState, Segmented, Field } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { timeAgo, isoDate } from '@/lib/format'

interface FollowUpItem {
  id: string
  domain: string
  severity: string
  status: string
  title: string
  detail?: string | null
  student: string | null
  studentId?: string | null
  classroom: string | null
  responsibleRole?: string
  createdAt: string
  dueAt?: string | null
}

interface TodayData {
  today: string
  academicSession?: { id: string; name: string } | null
  branch?: { id: string; name: string } | null
  schoolStatus: { dayStatus: string; eventTitle: string | null; attendanceExpected: boolean; open: boolean }
  kpis: {
    totalStudents: number
    expectedChildren: number
    present: number
    absent: number
    late: number
    unmarked: number
    checkedIn: number
    checkedOut: number
    pickupPending: number
    healthAlerts: number
    openIncidents: number
    attendancePct: number
  }
  sections: {
    id: string; name: string; programType: string; teacher: string
    teacherId: string | null; capacity: number; expected: number
    present: number; absent: number; unmarked: number; attendancePct: number
    understaffed: boolean
  }[]
  exceptions: {
    criticalCount: number
    attentionCount: number
    unresolvedTotal: number
    critical: FollowUpItem[]
    attention: FollowUpItem[]
  }
}

const SEVERITY_BADGE: Record<string, string> = {
  EMERGENCY: 'b-danger', URGENT: 'b-orange', WARNING: 'b-warning', INFO: 'b-info',
}

export function OperationsClient() {
  const toast = useToast()
  const [data, setData] = useState<TodayData | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'COMMAND' | 'CLASSROOM' | 'PICKUP_QUEUE' | 'DAILY_REPORT'>('COMMAND')

  // Classroom operational sheet state
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('')
  const [classroomData, setClassroomData] = useState<any>(null)
  const [classLoading, setClassLoading] = useState(false)

  // Pickup queue state
  const [pickupQueue, setPickupQueue] = useState<any[]>([])
  const [queueLoading, setQueueLoading] = useState(false)

  // Scanner modal state
  const [scanModalOpen, setScanModalOpen] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [scanMode, setScanMode] = useState<'ARRIVAL' | 'PICKUP'>('ARRIVAL')
  const [scannedStudent, setScannedStudent] = useState<any>(null)
  const [selectedGuardianId, setSelectedGuardianId] = useState('')
  const [pickupPin, setPickupPin] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Care intake modal state
  const [careModalOpen, setCareModalOpen] = useState(false)
  const [activeCareStudent, setActiveCareStudent] = useState<any>(null)
  const [careType, setCareType] = useState<'MEAL' | 'NAP' | 'BATHROOM' | 'WATER' | 'MOOD'>('MEAL')
  const [careNotes, setCareNotes] = useState('')
  const [careQuantity, setCareQuantity] = useState('Full')

  // Health check modal state
  const [healthModalOpen, setHealthModalOpen] = useState(false)
  const [activeHealthStudent, setActiveHealthStudent] = useState<any>(null)
  const [healthOutcome, setHealthOutcome] = useState<'CLEAR' | 'ATTENTION' | 'ISOLATE'>('CLEAR')
  const [healthTemp, setHealthTemp] = useState('')
  const [healthSymptoms, setHealthSymptoms] = useState('')

  // Incident modal state
  const [incidentModalOpen, setIncidentModalOpen] = useState(false)
  const [activeIncidentStudent, setActiveIncidentStudent] = useState<any>(null)
  const [incidentCategory, setIncidentCategory] = useState<'INJURY' | 'ILLNESS' | 'BEHAVIOR' | 'SAFETY'>('INJURY')
  const [incidentSeverity, setIncidentSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [incidentTitle, setIncidentTitle] = useState('')
  const [incidentDesc, setIncidentDesc] = useState('')

  // Daily report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [activeReportStudent, setActiveReportStudent] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const loadToday = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/operations/today')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
        if (json.data.sections?.length > 0 && !selectedClassroomId) {
          setSelectedClassroomId(json.data.sections[0].id)
        }
      }
    } catch (e: any) {
      toast.error('Failed to load dashboard', e.message)
    }
  }, [selectedClassroomId, toast])

  const loadClassroom = useCallback(async (cId: string) => {
    if (!cId) return
    setClassLoading(true)
    try {
      const res = await fetch(`/api/v1/operations/classrooms/${cId}`)
      const json = await res.json()
      if (json.success) setClassroomData(json.data)
    } catch (e: any) {
      toast.error('Failed to load classroom', e.message)
    } finally {
      setClassLoading(false)
    }
  }, [toast])

  const loadPickupQueue = useCallback(async () => {
    setQueueLoading(true)
    try {
      const url = selectedClassroomId
        ? `/api/v1/operations/pickup?classroomId=${selectedClassroomId}`
        : '/api/v1/operations/pickup'
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) setPickupQueue(json.data.items || [])
    } catch (e: any) {
      toast.error('Failed to load pickup queue', e.message)
    } finally {
      setQueueLoading(false)
    }
  }, [selectedClassroomId, toast])

  useEffect(() => {
    loadToday()
    const timer = setInterval(loadToday, 45_000)
    return () => clearInterval(timer)
  }, [loadToday])

  useEffect(() => {
    if (tab === 'CLASSROOM' && selectedClassroomId) {
      loadClassroom(selectedClassroomId)
    } else if (tab === 'PICKUP_QUEUE') {
      loadPickupQueue()
    }
  }, [tab, selectedClassroomId, loadClassroom, loadPickupQueue])

  // Gate Scanner Lookup
  const handleLookup = async (code: string) => {
    if (!code.trim()) return
    setScanLoading(true)
    setScanMessage(null)
    try {
      const res = await fetch(`/api/v1/operations/scan?code=${encodeURIComponent(code.trim())}`)
      const json = await res.json()
      if (json.success && json.data?.student) {
        setScannedStudent(json.data.student)
        const primary = json.data.student.guardians?.find((g: any) => g.canPickup)
        if (primary) setSelectedGuardianId(primary.id)
        else if (json.data.student.guardians?.length > 0) {
          setSelectedGuardianId(json.data.student.guardians[0].id)
        }
      } else {
        setScannedStudent(null)
        setScanMessage({ type: 'error', text: json.error?.message || 'Child not found' })
      }
    } catch (e: any) {
      setScanMessage({ type: 'error', text: e.message })
    } finally {
      setScanLoading(false)
    }
  }

  // Gate Scanner Action Execution
  const handleExecuteScan = async () => {
    if (!scannedStudent) return
    setScanLoading(true)
    setScanMessage(null)
    try {
      const res = await fetch('/api/v1/operations/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: scannedStudent.admissionNo || scannedStudent.id,
          studentId: scannedStudent.id,
          eventType: scanMode,
          guardianId: scanMode === 'PICKUP' ? selectedGuardianId : undefined,
          pin: scanMode === 'PICKUP' ? pickupPin : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setScanMessage({
          type: 'success',
          text: scanMode === 'ARRIVAL'
            ? `Arrival recorded for ${json.data.studentName} at ${json.data.time} (${json.data.status})`
            : `Authorized pickup released for ${json.data.studentName} to ${json.data.guardianName}`,
        })
        toast.success(scanMode === 'ARRIVAL' ? 'Arrival Recorded' : 'Pickup Released')
        loadToday()
        if (tab === 'CLASSROOM' && selectedClassroomId) loadClassroom(selectedClassroomId)
        if (tab === 'PICKUP_QUEUE') loadPickupQueue()
      } else {
        setScanMessage({
          type: 'error',
          text: json.error?.message || 'Operation Blocked',
        })
        toast.error('Blocked', json.error?.message)
        loadToday()
      }
    } catch (e: any) {
      setScanMessage({ type: 'error', text: e.message })
    } finally {
      setScanLoading(false)
    }
  }

  // Quick Classroom Attendance Marking
  const handleMarkClassAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          date: isoDate(),
          entries: [{ studentId, status }],
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Marked ${status}`)
        loadClassroom(selectedClassroomId)
        loadToday()
      } else {
        toast.error('Failed to mark', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    }
  }

  // Submit Care Intake
  const handleSubmitCare = async () => {
    if (!activeCareStudent) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeCareStudent.id,
          type: careType,
          title: `${careType.charAt(0) + careType.slice(1).toLowerCase()} Log`,
          body: careNotes || undefined,
          quantity: careQuantity,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Recorded on Daily Timeline')
        setCareModalOpen(false)
        setCareNotes('')
        loadClassroom(selectedClassroomId)
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Submit Health Check
  const handleSubmitHealth = async () => {
    if (!activeHealthStudent) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/operations/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeHealthStudent.id,
          outcome: healthOutcome,
          temperature: healthTemp ? parseFloat(healthTemp) : null,
          symptoms: healthSymptoms ? healthSymptoms.split(',').map((s) => s.trim()) : [],
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Health Check Recorded')
        setHealthModalOpen(false)
        setHealthTemp('')
        setHealthSymptoms('')
        loadClassroom(selectedClassroomId)
        loadToday()
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // Submit Incident
  const handleSubmitIncident = async () => {
    if (!activeIncidentStudent) return
    if (!incidentTitle.trim() || !incidentDesc.trim()) {
      toast.error('Validation Error', 'Title and description are required')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/v1/operations/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeIncidentStudent.id,
          category: incidentCategory,
          severity: incidentSeverity,
          title: incidentTitle.trim(),
          description: incidentDesc.trim(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Incident Logged & Escalated')
        setIncidentModalOpen(false)
        setIncidentTitle('')
        setIncidentDesc('')
        loadClassroom(selectedClassroomId)
        loadToday()
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  // View Daily Report
  const handleViewReport = async (student: any) => {
    setActiveReportStudent(student)
    setReportModalOpen(true)
    setReportLoading(true)
    try {
      const res = await fetch(`/api/v1/operations/reports/daily?studentId=${student.id}`)
      const json = await res.json()
      if (json.success) setReportData(json.data)
    } catch (e: any) {
      toast.error('Failed to load daily report', e.message)
    } finally {
      setReportLoading(false)
    }
  }

  // Follow-up resolution
  const actFollowUp = async (id: string, action: string) => {
    let outcome: string | null = null
    if (action === 'resolve') {
      outcome = window.prompt('Resolution outcome (Kya action liya? Kya result aaya?):', '')
      if (!outcome || !outcome.trim()) return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/operations/follow-ups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, outcome: outcome?.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Follow-up updated')
        loadToday()
      } else {
        toast.error('Failed', json.error?.message)
      }
    } catch (e: any) {
      toast.error('Error', e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!data) {
    return (
      <div className="p-6">
        <PageHead title="Operations — Command Center" sub="Daily Preschool Operations Control Room" />
        <div className="kpi-row mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} h={110} />)}
        </div>
        <Skeleton h={340} />
      </div>
    )
  }

  const k = data.kpis
  const ex = data.exceptions

  return (
    <div className="p-6">
      {/* Page Header */}
      <PageHead
        title="Operations — Daily Control Center"
        sub={`${data.today} · ${data.branch?.name || 'Main Campus'} · Session: ${data.academicSession?.name || 'Active'}`}
        actions={
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => {
                setScanModalOpen(true)
                setScanMessage(null)
                setScannedStudent(null)
                setScanCode('')
              }}
            >
              <QrCode size={15} /> Gate Scanner
            </button>
            <button className="btn btn-outline" onClick={loadToday} disabled={busy}>
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      {/* Top Real-Time KPI Row */}
      <div className="kpi-row mb-6">
        <KpiTile
          label="Present Today"
          value={`${k.present}/${k.totalStudents}`}
          icon={<UserCheck />}
          iconClass="ic-green"
          meta={`${k.attendancePct}% attendance rate`}
          trend={{ dir: k.attendancePct >= 80 ? 'up' : 'down', text: `${k.absent} absent · ${k.late} late` }}
        />
        <KpiTile
          label="Checked In (Arrived)"
          value={k.checkedIn}
          icon={<Sun />}
          iconClass="ic-blue"
          meta={`${k.totalStudents - k.checkedIn} pending gate arrival`}
          trend={{ dir: 'flat', text: 'Arrival window' }}
        />
        <KpiTile
          label="Pending Pickup"
          value={k.pickupPending}
          icon={<Clock />}
          iconClass="ic-yellow"
          meta={`${k.checkedOut} released so far`}
          trend={{ dir: k.pickupPending > 0 ? 'down' : 'up', text: k.pickupPending > 0 ? 'Active release' : 'All released' }}
        />
        <KpiTile
          label="Critical Safety Alerts"
          value={ex.criticalCount}
          icon={<Siren />}
          iconClass={ex.criticalCount > 0 ? 'ic-red' : 'ic-green'}
          meta={`${ex.attentionCount} items needing attention`}
          trend={{ dir: ex.criticalCount > 0 ? 'down' : 'up', text: ex.criticalCount > 0 ? 'ACT NOW' : 'ALL CLEAR' }}
        />
      </div>

      {/* Module Navigation Tabs */}
      <div className="mb-6">
        <Segmented
          value={tab}
          onChange={(val) => setTab(val as any)}
          options={[
            { key: 'COMMAND', label: 'Command Center & Alerts' },
            { key: 'CLASSROOM', label: 'Classroom Daily Sheet' },
            { key: 'PICKUP_QUEUE', label: 'Gate & Pickup Queue' },
          ]}
        />
      </div>

      {/* TAB 1: COMMAND CENTER */}
      {tab === 'COMMAND' && (
        <div className="space-y-6">
          {/* Critical Exceptions Band */}
          <div className="card" style={{ borderColor: ex.criticalCount > 0 ? 'var(--danger)' : undefined }}>
            <div className="card-head">
              <div className="card-title flex items-center gap-2">
                <Siren size={18} style={{ color: ex.criticalCount > 0 ? 'var(--danger)' : 'var(--success)' }} />
                <span>Critical Safety Exceptions</span>
              </div>
              <span className="badge b-danger">{ex.criticalCount} Open</span>
            </div>
            {ex.critical.length === 0 ? (
              <p className="t-caption p-2">Zero critical alerts — all gate, health, and safety follow-ups are clear.</p>
            ) : (
              <div className="divide-y divide-border-subtle">
                {ex.critical.map((f) => (
                  <div key={f.id} className="py-3 flex items-start gap-3">
                    <Avatar name={f.student || f.title} size="sm" />
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <b className="text-sm">{f.title}</b>
                        <span className={`badge ${SEVERITY_BADGE[f.severity] || 'b-neutral'}`}>{f.severity}</span>
                        <StatusBadge status={f.status} />
                      </div>
                      <div className="t-caption mt-1">
                        {f.student && <span className="font-semibold">{f.student} · </span>}
                        {f.classroom && <span>{f.classroom} · </span>}
                        <span>{f.domain} · {timeAgo(f.createdAt)}</span>
                      </div>
                      {f.detail && <p className="text-xs text-muted-foreground mt-1">{f.detail}</p>}
                    </div>
                    <div className="flex gap-2">
                      {f.status === 'OPEN' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => actFollowUp(f.id, 'acknowledge')}>
                          Ack
                        </button>
                      )}
                      {!['RESOLVED', 'CLOSED'].includes(f.status) && (
                        <button className="btn btn-success btn-sm" onClick={() => actFollowUp(f.id, 'resolve')}>
                          <CheckCircle2 size={13} /> Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Attendance Meters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-head">
                <div className="card-title flex items-center gap-2">
                  <Users size={16} /> Section Roster Status
                </div>
              </div>
              <div className="space-y-3">
                {data.sections.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="t-caption">{s.teacher} · {s.expected} students</div>
                    </div>
                    <div className="w-24 h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${s.attendancePct}%`,
                          backgroundColor: s.attendancePct >= 75 ? 'var(--success)' : s.attendancePct >= 40 ? 'var(--warning)' : 'var(--danger)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono w-16 text-right">
                      {s.present}/{s.expected}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelectedClassroomId(s.id)
                        setTab('CLASSROOM')
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Attention Follow-ups */}
            <div className="card">
              <div className="card-head">
                <div className="card-title flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: 'var(--warning)' }} /> Attention Items
                </div>
                <span className="badge b-warning">{ex.attentionCount} Open</span>
              </div>
              {ex.attention.length === 0 ? (
                <p className="t-caption p-2">No attention items pending.</p>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {ex.attention.slice(0, 5).map((f) => (
                    <div key={f.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold">{f.title}</span>
                        <div className="text-muted-foreground">{f.student} · {timeAgo(f.createdAt)}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => actFollowUp(f.id, 'resolve')}>
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASSROOM DAILY SHEET */}
      {tab === 'CLASSROOM' && (
        <div className="space-y-4">
          {/* Classroom Selector */}
          <div className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
            <Field label="Selected Classroom">
              <select
                className="select"
                value={selectedClassroomId}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
              >
                {data.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.programType}) — Teacher: {s.teacher}
                  </option>
                ))}
              </select>
            </Field>
            {classroomData && (
              <div className="ml-auto flex gap-4 text-xs">
                <div>Total: <b>{classroomData.summary.total}</b></div>
                <div>Present: <b className="text-success">{classroomData.summary.present}</b></div>
                <div>Absent: <b className="text-danger">{classroomData.summary.absent}</b></div>
                <div>Unmarked: <b>{classroomData.summary.unmarked}</b></div>
              </div>
            )}
          </div>

          {/* Student Grid */}
          {classLoading ? (
            <Skeleton h={300} />
          ) : !classroomData || classroomData.students.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="No active students found"
              message="Students enrolled and allocated to this classroom will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classroomData.students.map((st: any) => (
                <div key={st.id} className="card p-4 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={st.name} size="lg" />
                        <div>
                          <div className="font-bold text-base leading-tight">{st.name}</div>
                          <div className="t-caption">{st.admissionNo} {st.seatNumber ? `· Seat: ${st.seatNumber}` : ''}</div>
                        </div>
                      </div>
                      <StatusBadge status={st.attendance} />
                    </div>

                    {/* Care Tags & Metrics */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      <span className="badge b-neutral flex items-center gap-1">
                        <Utensils size={11} /> {st.careSummary.mealsCount} Meals
                      </span>
                      <span className="badge b-neutral flex items-center gap-1">
                        <Moon size={11} /> {st.careSummary.napCount} Naps
                      </span>
                      <span className="badge b-neutral flex items-center gap-1">
                        <Bath size={11} /> {st.careSummary.bathroomCount} Toilet
                      </span>
                      {st.careSummary.healthFlag && (
                        <span className="badge b-danger flex items-center gap-1">
                          <HeartPulse size={11} /> Health Flag
                        </span>
                      )}
                      {st.isPickedUp && (
                        <span className="badge b-success flex items-center gap-1">
                          <ShieldCheck size={11} /> Released ({st.pickedUpAt})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                    {/* Attendance Toggles */}
                    <div className="flex gap-1">
                      <button
                        className={`btn btn-sm ${st.attendance === 'PRESENT' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleMarkClassAttendance(st.id, 'PRESENT')}
                        title="Mark Present"
                      >
                        P
                      </button>
                      <button
                        className={`btn btn-sm ${st.attendance === 'ABSENT' ? 'btn-danger' : 'btn-ghost'}`}
                        onClick={() => handleMarkClassAttendance(st.id, 'ABSENT')}
                        title="Mark Absent"
                      >
                        A
                      </button>
                      <button
                        className={`btn btn-sm ${st.attendance === 'LATE' ? 'btn-warning' : 'btn-ghost'}`}
                        onClick={() => handleMarkClassAttendance(st.id, 'LATE')}
                        title="Mark Late"
                      >
                        L
                      </button>
                    </div>

                    {/* Quick Modal Triggers */}
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Care Intake (Meals, Nap, etc.)"
                        onClick={() => {
                          setActiveCareStudent(st)
                          setCareModalOpen(true)
                        }}
                      >
                        <Utensils size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Health Check"
                        onClick={() => {
                          setActiveHealthStudent(st)
                          setHealthModalOpen(true)
                        }}
                      >
                        <HeartPulse size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Report Incident"
                        onClick={() => {
                          setActiveIncidentStudent(st)
                          setIncidentModalOpen(true)
                        }}
                      >
                        <AlertTriangle size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Daily Report"
                        onClick={() => handleViewReport(st)}
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GATE & PICKUP QUEUE */}
      {tab === 'PICKUP_QUEUE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div className="font-semibold text-sm">
              Today's Pickup Release Queue ({pickupQueue.length} Total Enrolled)
            </div>
            <button className="btn btn-outline btn-sm" onClick={loadPickupQueue} disabled={queueLoading}>
              <RefreshCw size={13} className={queueLoading ? 'animate-spin' : ''} /> Refresh Queue
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Child</th>
                  <th className="p-3">Classroom</th>
                  <th className="p-3">Attendance</th>
                  <th className="p-3">Authorized Guardians</th>
                  <th className="p-3">Release Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pickupQueue.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="p-3 flex items-center gap-2">
                      <Avatar name={item.name} size="sm" />
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.admissionNo}</div>
                      </div>
                    </td>
                    <td className="p-3">{item.classroom}</td>
                    <td className="p-3">
                      <StatusBadge status={item.attendance} />
                    </td>
                    <td className="p-3">
                      <div className="text-xs">
                        {item.guardians?.map((g: any) => (
                          <div key={g.id} className={g.canPickup ? 'text-foreground' : 'text-danger line-through'}>
                            {g.name} ({g.relationship})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {item.isPickedUp ? (
                        <span className="badge b-success flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> Released
                        </span>
                      ) : item.isPresent ? (
                        <span className="badge b-warning flex items-center gap-1 w-fit">
                          <Clock size={12} /> Waiting Pickup
                        </span>
                      ) : (
                        <span className="badge b-neutral w-fit">Not Present</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!item.isPickedUp && item.isPresent && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setScannedStudent(item)
                            setScanMode('PICKUP')
                            if (item.guardians?.length > 0) setSelectedGuardianId(item.guardians[0].id)
                            setScanModalOpen(true)
                          }}
                        >
                          <ShieldCheck size={13} /> Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Gate Scanner Modal ── */}
      <Modal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title="Gate Scanner — Arrival & Pickup"
        subtitle="Real-time child identity lookup and secure release authorization"
        icon={<ScanLine size={22} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4">
          <Segmented
            value={scanMode}
            onChange={(m) => { setScanMode(m as any); setScanMessage(null) }}
            options={[
              { key: 'ARRIVAL', label: 'Morning Arrival (Check-In)' },
              { key: 'PICKUP', label: 'Afternoon Pickup (Release)' },
            ]}
          />

          <Field label="Scan Barcode / Enter Code" required helper="Supports Admission No, Seat No, or Student ID">
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Scan QR or code (e.g. STU-2026-0001)..."
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup(scanCode)}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleLookup(scanCode)}
                disabled={scanLoading || !scanCode.trim()}
              >
                {scanLoading ? 'Checking…' : 'Lookup'}
              </button>
            </div>
          </Field>

          {scanMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                scanMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              {scanMessage.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              <span>{scanMessage.text}</span>
            </div>
          )}

          {scannedStudent && (
            <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={scannedStudent.name} size="lg" />
                <div>
                  <div className="font-bold text-base">{scannedStudent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {scannedStudent.admissionNo} · {scannedStudent.classroom}
                  </div>
                </div>
              </div>

              {scanMode === 'PICKUP' && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <Field label="Select Authorized Pickup Guardian" required>
                    <select
                      className="select"
                      value={selectedGuardianId}
                      onChange={(e) => setSelectedGuardianId(e.target.value)}
                    >
                      {scannedStudent.guardians?.map((g: any) => (
                        <option key={g.id} value={g.id} disabled={!g.canPickup}>
                          {g.name} ({g.relationship}) {g.canPickup ? '— Authorized' : '— [BLOCKED]'}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Security PIN Verification" helper="Required if guardian PIN policy is active">
                    <input
                      className="input"
                      type="password"
                      placeholder="Enter 4-digit pickup PIN..."
                      value={pickupPin}
                      onChange={(e) => setPickupPin(e.target.value)}
                    />
                  </Field>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExecuteScan}
                  disabled={scanLoading}
                >
                  {scanMode === 'ARRIVAL' ? (
                    <><CheckCircle2 size={14} /> Confirm Arrival</>
                  ) : (
                    <><ShieldCheck size={14} /> Authorize Pickup & Release</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Care Intake Modal ── */}
      <Modal
        open={careModalOpen}
        onClose={() => setCareModalOpen(false)}
        title={`Record Daily Care — ${activeCareStudent?.name}`}
        subtitle="Log meals, nap, water, or bathroom events"
        icon={<Utensils size={20} />}
        iconClass="ic-primary"
      >
        <div className="space-y-4">
          <Field label="Event Type" required>
            <select className="select" value={careType} onChange={(e) => setCareType(e.target.value as any)}>
              <option value="MEAL">Meal (Breakfast / Lunch / Snack)</option>
              <option value="NAP">Nap Session</option>
              <option value="BATHROOM">Bathroom / Toilet</option>
              <option value="WATER">Water Intake</option>
              <option value="MOOD">Mood / General Behavior</option>
            </select>
          </Field>

          {careType === 'MEAL' && (
            <Field label="Consumed Quantity">
              <select className="select" value={careQuantity} onChange={(e) => setCareQuantity(e.target.value)}>
                <option value="Full">Full Portion Finished</option>
                <option value="Half">Half Portion Finished</option>
                <option value="Bites">Few Bites / Minimal</option>
                <option value="Refused">Refused Meal</option>
              </select>
            </Field>
          )}

          <Field label="Observation Notes">
            <textarea
              className="textarea"
              placeholder="e.g. Ate nicely, happy mood, slept 45 mins..."
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
              rows={3}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <button className="btn btn-primary" onClick={handleSubmitCare} disabled={busy}>
              Save to Daily Sheet
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Health Check Modal ── */}
      <Modal
        open={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        title={`Health Check — ${activeHealthStudent?.name}`}
        subtitle="Capture morning wellness and flag symptomatic conditions"
        icon={<HeartPulse size={20} />}
        iconClass="ic-danger"
      >
        <div className="space-y-4">
          <Field label="Health Outcome" required>
            <select className="select" value={healthOutcome} onChange={(e) => setHealthOutcome(e.target.value as any)}>
              <option value="CLEAR">Clear (Normal Participation)</option>
              <option value="ATTENTION">Attention (Mild Symptoms / Under Observation)</option>
              <option value="ISOLATE">Isolate (Fever / Contagious Symptoms — Action Needed)</option>
            </select>
          </Field>

          <Field label="Temperature (°F)" helper="Optional unless symptomatic">
            <input
              className="input"
              type="number"
              step="0.1"
              placeholder="e.g. 98.6"
              value={healthTemp}
              onChange={(e) => setHealthTemp(e.target.value)}
            />
          </Field>

          <Field label="Symptoms Observed" helper="Comma-separated: cough, runny nose, rash, etc.">
            <input
              className="input"
              placeholder="e.g. Mild cough, flushed cheeks"
              value={healthSymptoms}
              onChange={(e) => setHealthSymptoms(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <button className="btn btn-primary" onClick={handleSubmitHealth} disabled={busy}>
              Submit Health Observation
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Incident Modal ── */}
      <Modal
        open={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        title={`Report Incident — ${activeIncidentStudent?.name}`}
        subtitle="Safety incident intake with automatic escalation"
        icon={<AlertTriangle size={20} />}
        iconClass="ic-danger"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select className="select" value={incidentCategory} onChange={(e) => setIncidentCategory(e.target.value as any)}>
                <option value="INJURY">Minor Injury / Scrape</option>
                <option value="FALL">Fall / Slip</option>
                <option value="ILLNESS">Sudden Illness</option>
                <option value="BEHAVIOR">Behavioral Incident</option>
                <option value="SAFETY">Safety Issue</option>
              </select>
            </Field>
            <Field label="Severity" required>
              <select className="select" value={incidentSeverity} onChange={(e) => setIncidentSeverity(e.target.value as any)}>
                <option value="LOW">Low (First-aid only)</option>
                <option value="MEDIUM">Medium (Supervision follow-up)</option>
                <option value="HIGH">High (Parent call required)</option>
                <option value="CRITICAL">Critical (Emergency action)</option>
              </select>
            </Field>
          </div>

          <Field label="Incident Title" required>
            <input
              className="input"
              placeholder="Brief summary (e.g. Scraped knee during outdoor play)"
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
            />
          </Field>

          <Field label="Detailed Description" required>
            <textarea
              className="textarea"
              placeholder="Explain exactly what occurred and immediate first aid applied..."
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              rows={3}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <button className="btn btn-danger" onClick={handleSubmitIncident} disabled={busy}>
              Log Incident
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Daily Report Modal ── */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={`Daily Parent Report — ${activeReportStudent?.name}`}
        subtitle="Aggregated real-time summary for today"
        icon={<FileText size={20} />}
        iconClass="ic-primary"
      >
        {reportLoading ? (
          <Skeleton h={200} />
        ) : reportData ? (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-muted rounded-lg flex justify-between">
              <div>Class: <b>{reportData.student.classroom}</b></div>
              <div>Attendance: <b>{reportData.attendance}</b></div>
            </div>

            <div>
              <div className="font-semibold mb-1">Meals:</div>
              {reportData.meals?.length ? (
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {reportData.meals.map((m: string, i: number) => <li key={i}>{m}</li>)}
                </ul>
              ) : <p className="text-xs text-muted-foreground">No meal logs recorded.</p>}
            </div>

            <div>
              <div className="font-semibold mb-1">Naps & Rest:</div>
              {reportData.naps?.length ? (
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {reportData.naps.map((n: string, i: number) => <li key={i}>{n}</li>)}
                </ul>
              ) : <p className="text-xs text-muted-foreground">No nap logs recorded.</p>}
            </div>

            <div>
              <div className="font-semibold mb-1">Pickup State:</div>
              <div className="text-xs">{reportData.pickup}</div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
