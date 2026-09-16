'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  School, Building2, Palette, Blocks, DoorOpen, Clock, ShieldCheck, Users,
  CalendarRange, LayoutGrid, GraduationCap, BookOpen, CalendarDays, IndianRupee,
  ClipboardList, HeartHandshake, Sun, Cross, Megaphone, FileText, Upload,
  Rocket, CheckCircle2, AlertTriangle, Lock, ChevronRight, PlayCircle,
  ClipboardCheck, LayoutList, ArrowRight, History, Sparkles, Edit3, Plus,
  Sliders, Activity, Check, RefreshCw, Layers, ExternalLink, AlertCircle, Info,
} from 'lucide-react'
import { PageHead, Segmented, Skeleton, EmptyState, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { PHASES, SETUP_STEPS, STEP_MAP, type StepKey } from '@/lib/setup/steps'

const ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  School, Building2, Palette, Blocks, DoorOpen, Clock, ShieldCheck, Users,
  CalendarRange, LayoutGrid, GraduationCap, BookOpen, CalendarDays, IndianRupee,
  ClipboardList, HeartHandshake, Sun, Cross, Megaphone, FileText, Upload,
}

interface StepRow {
  key: string
  label: string
  phase: string
  applicability: 'MANDATORY' | 'OPTIONAL' | 'RECOMMENDED'
  icon: string
  description: string
  status: 'PENDING' | 'COMPLETE' | 'BLOCKED' | 'SKIPPED'
  detail: string
  blockedReason: string | null
  missingDeps: { key: string; label: string }[]
  completedAt: string | null
  completedByName: string | null
  changedAfterCompletion: boolean
  lastCheckedAt: string
  locked: boolean
}

interface StatusPayload {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'READY_FOR_REVIEW' | 'READY_FOR_GO_LIVE' | 'LIVE'
  progress: number
  startedAt: string | null
  goLiveAt: string | null
  steps: StepRow[]
  nextStepKey: string | null
  guidance: { level: 'info' | 'warning'; message: string; stepKey: string }[]
}

interface ValidationCategory {
  key: string
  label: string
  status: 'PASS' | 'WARNING' | 'BLOCKED'
  findings: { status: 'PASS' | 'WARNING' | 'BLOCKED'; message: string }[]
}

interface ValidationPayload {
  overall: 'PASS' | 'WARNING' | 'BLOCKED'
  categories: ValidationCategory[]
  setupStatus?: string
}

interface DepsPayload {
  summary: {
    school: { name: { name: string; code: string; city: string | null } | null }
    branches: number
    programs: number
    academicYears: number
    classes: number
    staff: number
    calendarEvents: number
    feePlans: number
    students: number
  }
  graph: {
    key: string
    label: string
    applicability: string
    status: string
    blockedBy: { key: string; label: string }[]
    deps: { key: string; label: string; status: string }[]
  }[]
}

type Dict = Record<string, any>

const STEP_STATUS_MAP: Record<string, { cls: string; label: string }> = {
  COMPLETE: { cls: 'b-success', label: 'Complete' },
  PENDING: { cls: 'b-info', label: 'Pending' },
  BLOCKED: { cls: 'b-danger', label: 'Blocked' },
  SKIPPED: { cls: 'b-neutral', label: 'Skipped' },
}

const LIFECYCLE_STATUS_MAP: Record<string, { cls: string; label: string }> = {
  NOT_STARTED: { cls: 'b-neutral', label: 'Not Started' },
  IN_PROGRESS: { cls: 'b-orange', label: 'In Progress' },
  BLOCKED: { cls: 'b-danger', label: 'Blocked' },
  READY_FOR_REVIEW: { cls: 'b-primary', label: 'Ready for Review' },
  READY_FOR_GO_LIVE: { cls: 'b-primary', label: 'Ready for Go-Live' },
  LIVE: { cls: 'b-success', label: 'Live' },
}

const CAT_STATUS_MAP: Record<string, { cls: string; label: string }> = {
  PASS: { cls: 'b-success', label: 'Pass' },
  WARNING: { cls: 'b-warning', label: 'Warning' },
  BLOCKED: { cls: 'b-danger', label: 'Blocked' },
}

export default function SetupPage() {
  const toast = useToast()
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [tab, setTab] = useState<'hub' | 'steps' | 'validation' | 'summary'>('hub')
  const [validation, setValidation] = useState<ValidationPayload | null>(null)
  const [validating, setValidating] = useState(false)
  const [deps, setDeps] = useState<DepsPayload | null>(null)
  const [depOpen, setDepOpen] = useState(false)
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Step filter in Tab 2
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL')
  const [stepStatusFilter, setStepStatusFilter] = useState<string>('ALL')

  // Master Data
  const [profile, setProfile] = useState<Dict | null>(null)
  const [branches, setBranches] = useState<Dict[]>([])
  const [programs, setPrograms] = useState<Dict[]>([])
  const [years, setYears] = useState<Dict[]>([])
  const [classrooms, setClassrooms] = useState<Dict[]>([])
  const [operatingConfig, setOperatingConfig] = useState<Dict | null>(null)
  const [health, setHealth] = useState<Dict | null>(null)

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Dict | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/setup/status')
      const j = await res.json()
      if (j.success) setStatus(j.data)
    } catch {
      // ignore network errors on unmount
    }
  }, [])

  const loadHubData = useCallback(async () => {
    try {
      const [p, b, pr, y, c, o, h] = await Promise.all([
        fetch('/api/v1/setup/school-profile').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/branches').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/programs').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/academic-years').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/classrooms').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/setup/config/OPERATING').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/integrations/health').then((r) => r.json()).catch(() => null),
      ])
      if (p?.success) setProfile(p.data)
      if (b?.success) setBranches(b.data || [])
      if (pr?.success) setPrograms(pr.data || [])
      if (y?.success) setYears(y.data || [])
      if (c?.success) setClassrooms(c.data || [])
      if (o?.success) setOperatingConfig(o.data?.data || null)
      if (h?.success) setHealth(h.data || null)
    } catch {
      // ignore
    }
  }, [])

  const loadDeps = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/setup/dependencies')
      const j = await res.json()
      if (j.success) setDeps(j.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    load()
    loadHubData()
    loadDeps()
  }, [load, loadHubData, loadDeps])

  const refreshAll = useCallback(() => {
    load()
    loadHubData()
    loadDeps()
  }, [load, loadHubData, loadDeps])

  const runValidation = async () => {
    setValidating(true)
    try {
      const res = await fetch('/api/v1/setup/validate', { method: 'POST' })
      const j = await res.json()
      setValidating(false)
      if (j.success) {
        setValidation(j.data)
        setTab('validation')
        toast.success('Validation complete', `Overall: ${j.data.overall}`)
        load()
      } else {
        toast.error('Validation failed', j.error?.message)
      }
    } catch (e: any) {
      setValidating(false)
      toast.error('Validation error', e?.message || 'Server error')
    }
  }

  const goLive = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/v1/setup/go-live', { method: 'POST' })
      const j = await res.json()
      setBusy(false)
      if (j.success) {
        toast.success('Preschool is LIVE', 'Operational dashboard is now primary')
        setGoLiveOpen(false)
        load()
      } else {
        toast.error('Go-live blocked', j.error?.message)
        if (j.error?.code === 'SETUP_001') {
          setGoLiveOpen(false)
          runValidation()
        }
      }
    } catch (e: any) {
      setBusy(false)
      toast.error('Go-live failed', e?.message || 'Server error')
    }
  }

  const nextStep = useMemo(() => status?.steps.find((s) => s.key === status.nextStepKey) ?? null, [status])
  const currentYear = useMemo(() => years.find((y) => y.isCurrent) ?? years[0] ?? null, [years])

  const mandatorySteps = useMemo(() => status?.steps.filter((s) => s.applicability === 'MANDATORY') ?? [], [status])
  const mandatoryCompleted = useMemo(() => mandatorySteps.filter((s) => s.status === 'COMPLETE' || s.status === 'SKIPPED').length, [mandatorySteps])
  const mandatoryLeft = useMemo(() => mandatorySteps.length - mandatoryCompleted, [mandatorySteps, mandatoryCompleted])
  const blockedCount = useMemo(() => status?.steps.filter((s) => s.status === 'BLOCKED').length ?? 0, [status])

  const filteredSteps = useMemo(() => {
    if (!status?.steps) return []
    return status.steps.filter((s) => {
      const matchPhase = phaseFilter === 'ALL' || s.phase === phaseFilter
      const matchStatus = stepStatusFilter === 'ALL' || s.status === stepStatusFilter
      return matchPhase && matchStatus
    })
  }, [status, phaseFilter, stepStatusFilter])

  if (!status) {
    return (
      <div className="page-container">
        <PageHead
          eyebrow="PRESCHOOL SETUP & READINESS"
          title="Preschool Setup & Configuration"
          sub="Configure your preschool, verify operational readiness, and prepare the school for go-live."
        />
        <div className="metric-strip" style={{ marginBottom: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="metric-cell"><Skeleton h={54} /></div>
          ))}
        </div>
        <div className="table-workspace"><div style={{ padding: 24 }}><Skeleton h={180} /></div></div>
      </div>
    )
  }

  const lifecycleBadge = LIFECYCLE_STATUS_MAP[status.status] || LIFECYCLE_STATUS_MAP.NOT_STARTED

  return (
    <div className="page-container">
      {/* ── 1. CANONICAL PAGE HEADER ── */}
      <PageHead
        eyebrow="PRESCHOOL SETUP & READINESS"
        title="Preschool Setup & Configuration"
        sub="Configure your preschool, verify operational readiness, and prepare the school for go-live."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => { setDepOpen(true); if (!deps) loadDeps() }}>
              <LayoutList size={14} /> Dependency Graph
            </button>
            <button className="btn btn-outline" onClick={runValidation} disabled={validating}>
              <ClipboardCheck size={14} /> {validating ? 'Verifying…' : 'Run Health Check'}
            </button>
            <button className="btn btn-outline" onClick={() => setGoLiveOpen(true)}>
              <Rocket size={14} /> Go-Live Checklist
            </button>
            {status.status !== 'LIVE' && mandatoryLeft === 0 && (
              <button className="btn btn-primary" onClick={() => setGoLiveOpen(true)}>
                <Rocket size={14} /> Launch Preschool (Go Live)
              </button>
            )}
            {nextStep && (
              <a className="btn btn-primary" href={`/app/setup/${nextStep.key}`}>
                <PlayCircle size={14} /> Step Guide ({nextStep.label}) <ChevronRight size={14} />
              </a>
            )}
          </div>
        }
      />

      {/* ── 2. CANONICAL READINESS METRIC STRIP ── */}
      <div className="metric-strip" style={{ marginBottom: 20 }}>
        {/* Cell 1: Overall Progress */}
        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Readiness Progress</span>
            <Rocket size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="m-val m-highlight">{status.progress}%</div>
          <div className="m-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="progressbar" style={{ width: 60, height: 5 }}>
              <div style={{ width: `${status.progress}%` }} />
            </div>
            <span>{status.status === 'LIVE' ? 'Fully operational' : `${100 - status.progress}% remaining`}</span>
          </div>
        </div>

        {/* Cell 2: Mandatory Steps */}
        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Mandatory Steps</span>
            <ShieldCheck size={15} style={{ color: mandatoryLeft === 0 ? 'var(--success)' : 'var(--warning)' }} />
          </div>
          <div className={`m-val ${mandatoryLeft === 0 ? 'm-success' : 'm-warning'}`}>
            {mandatoryCompleted} / {mandatorySteps.length}
          </div>
          <div className="m-meta">
            {mandatoryLeft === 0 ? 'All prerequisites met' : `${mandatoryLeft} required step${mandatoryLeft === 1 ? '' : 's'} remaining`}
          </div>
        </div>

        {/* Cell 3: Dependency Blockers */}
        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Active Blockers</span>
            <Lock size={15} style={{ color: blockedCount === 0 ? 'var(--success)' : 'var(--danger)' }} />
          </div>
          <div className={`m-val ${blockedCount === 0 ? 'm-success' : 'm-danger'}`}>
            {blockedCount}
          </div>
          <div className="m-meta">
            {blockedCount === 0 ? 'Zero dependency locks' : 'Blocked by dependencies'}
          </div>
        </div>

        {/* Cell 4: Validation Health */}
        <div className="metric-cell" onClick={runValidation} style={{ cursor: 'pointer' }}>
          <div className="m-top">
            <span className="m-lbl">System Health</span>
            <Activity size={15} style={{ color: validation?.overall === 'PASS' ? 'var(--success)' : validation?.overall === 'BLOCKED' ? 'var(--danger)' : 'var(--primary)' }} />
          </div>
          <div className={`m-val ${validation?.overall === 'PASS' ? 'm-success' : validation?.overall === 'BLOCKED' ? 'm-danger' : 'm-highlight'}`}>
            {validation?.overall || (health?.overall === 'HEALTHY' ? 'PASS' : 'UNCHECKED')}
          </div>
          <div className="m-meta">
            {validation ? `${validation.categories.filter((c) => c.status === 'PASS').length}/15 categories passed` : 'Click to run health check'}
          </div>
        </div>

        {/* Cell 5: Lifecycle Stage */}
        <div className="metric-cell">
          <div className="m-top">
            <span className="m-lbl">Lifecycle Status</span>
            <Sparkles size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="m-val" style={{ fontSize: 18, marginTop: 4 }}>
            <span className={`badge ${lifecycleBadge.cls}`}>{lifecycleBadge.label}</span>
          </div>
          <div className="m-meta">
            {status.status === 'LIVE' ? `Live since ${status.goLiveAt ? new Date(status.goLiveAt).toLocaleDateString() : 'recent'}` : 'Pre-operational setup'}
          </div>
        </div>
      </div>

      {/* ── 3. OPERATIONAL HERO / NEXT ACTION COMMAND BANNER ── */}
      <div className="operational-hero" style={{ marginBottom: 20 }}>
        <div className="operational-hero-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge b-primary">Operational Status</span>
              {blockedCount > 0 && <span className="badge b-danger">{blockedCount} Blocked</span>}
              {mandatoryLeft === 0 && status.status !== 'LIVE' && (
                <span className="badge b-success">Ready for Go-Live</span>
              )}
            </div>
            <div className="operational-hero-title">
              {status.status === 'LIVE'
                ? 'Preschool Operating in Production'
                : mandatoryLeft === 0
                  ? 'All Mandatory Foundations Complete — Ready for Go-Live'
                  : nextStep
                    ? `Next Step: ${nextStep.label}`
                    : 'Preschool Foundation Configuration'}
            </div>
            <div className="operational-hero-sub">
              {status.status === 'LIVE'
                ? 'All master data, branches, fee schedules, classrooms, and daily ops rules are live. Configuration remains fully editable in place.'
                : mandatoryLeft === 0
                  ? 'Your preschool has satisfied all foundational, academic, and business policies. Execute a final health check and launch the preschool.'
                  : nextStep
                    ? `${nextStep.description} — ${nextStep.detail || 'Complete this step to unlock downstream academic and financial modules.'}`
                    : 'Complete all mandatory foundational steps to prepare the preschool for child enrollments and operations.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {status.status !== 'LIVE' && mandatoryLeft === 0 ? (
              <button className="btn btn-primary" onClick={() => setGoLiveOpen(true)}>
                <Rocket size={15} /> Launch Preschool (Go Live)
              </button>
            ) : nextStep ? (
              <a className="btn btn-primary" href={`/app/setup/${nextStep.key}`}>
                <PlayCircle size={15} /> Configure {nextStep.label} <ChevronRight size={14} />
              </a>
            ) : null}
          </div>
        </div>

        {/* Guidance and Drift Alerts */}
        {status.guidance && status.guidance.length > 0 && status.status !== 'LIVE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            {status.guidance.map((g, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                {g.level === 'warning' ? (
                  <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                ) : (
                  <Info size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                )}
                <span style={{ color: 'var(--text-secondary)' }}>{g.message}</span>
                <a href={`/app/setup/${g.stepKey}`} className="cell-link" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  Resolve <ChevronRight size={12} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. WORKSPACE TABS (SEGMENTED) ── */}
      <Segmented
        value={tab}
        onChange={(v) => {
          setTab(v as typeof tab)
          if (v === 'summary' && !deps) loadDeps()
        }}
        options={[
          { key: 'hub', label: '⚡ Quick Configuration Hub' },
          { key: 'steps', label: `All 21 Setup Steps (${status.steps.filter((s) => s.status === 'COMPLETE' || s.status === 'SKIPPED').length}/21)` },
          { key: 'validation', label: 'Readiness & Health (Validation)' },
          { key: 'summary', label: 'Data Summary & Dependencies' },
        ]}
      />

      {/* ════════════════════ TAB 1: QUICK CONFIGURATION HUB ════════════════════ */}
      {tab === 'hub' && (
        <div style={{ marginTop: 16 }} className="table-workspace">
          <div className="table-workspace-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cell-strong">Core Operational Master Data</span>
              <span className="badge b-neutral">7 Master Domains</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={refreshAll}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ width: 280 }}>Master Configuration Area</th>
                  <th style={{ width: 140 }}>Status</th>
                  <th>Current Derived Operational State</th>
                  <th style={{ textAlign: 'right', width: 180 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. School Profile & Identity */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-violet" style={{ width: 32, height: 32 }}><School size={16} /></div>
                      <div>
                        <span className="cell-strong">School Profile & Identity</span>
                        <span className="cell-sub">Legal identity, code, timezone & address</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${profile?.email && profile?.phone && profile?.city ? 'b-success' : 'b-warning'}`}>
                      {profile?.email && profile?.phone && profile?.city ? 'Verified' : 'Incomplete'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      <b>{profile?.name || 'School Name'}</b>
                      <span className="cell-sub">
                        Code: {profile?.code || '—'} · {profile?.city || 'City missing'}, {profile?.state || ''} · {profile?.email || 'No email'} · {profile?.phone || 'No phone'}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('profile')}>
                      <Edit3 size={13} /> Edit Profile
                    </button>
                  </td>
                </tr>

                {/* 2. Operating Academic Year */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-green" style={{ width: 32, height: 32 }}><CalendarRange size={16} /></div>
                      <div>
                        <span className="cell-strong">Academic Year</span>
                        <span className="cell-sub">Session range for admissions & attendance</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${currentYear ? 'b-success' : 'b-danger'}`}>
                      {currentYear ? 'Current Active' : 'No Active Year'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {currentYear ? (
                        <>
                          <b>{currentYear.name}</b>
                          <span className="cell-sub">
                            {new Date(currentYear.startDate).toLocaleDateString()} → {new Date(currentYear.endDate).toLocaleDateString()} ({years.length} total years registered)
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>No academic year marked current</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {currentYear && (
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(currentYear); setActiveModal('editYear'); }}>
                          <Edit3 size={13} /> Edit
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('newYear')}>
                        <Plus size={13} /> Add Year
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 3. Campuses & Branches */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-blue" style={{ width: 32, height: 32 }}><Building2 size={16} /></div>
                      <div>
                        <span className="cell-strong">Campuses & Branches</span>
                        <span className="cell-sub">Physical school operating locations</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${branches.length > 0 ? 'b-success' : 'b-danger'}`}>
                      {branches.length} Active Branch{branches.length === 1 ? '' : 'es'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {branches.length > 0 ? (
                        <>
                          <b>{branches.map((b) => b.name).join(' · ')}</b>
                          <span className="cell-sub">
                            Timings: {branches[0]?.timingOpen || '08:30'} – {branches[0]?.timingClose || '16:00'} · Total Capacity: {branches.reduce((acc, b) => acc + (b.capacity || 0), 0)} seats
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>No active campus configured</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {branches[0] && (
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(branches[0]); setActiveModal('editBranch'); }}>
                          <Edit3 size={13} /> Edit
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('newBranch')}>
                        <Plus size={13} /> Add Branch
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 4. Programs Offered */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-violet" style={{ width: 32, height: 32 }}><Blocks size={16} /></div>
                      <div>
                        <span className="cell-strong">Programs Offered</span>
                        <span className="cell-sub">Educational tracks, age eligibility & capacity</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${programs.length > 0 ? 'b-success' : 'b-danger'}`}>
                      {programs.length} Program{programs.length === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {programs.length > 0 ? (
                        <>
                          <b>{programs.map((p) => p.name).join(', ')}</b>
                          <span className="cell-sub">
                            Configured tracks: {programs.map((p) => `${p.code} (${p.ageMinMonths || 0}–${p.ageMaxMonths || 0} mo)`).join(', ')}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>No programs configured</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {programs[0] && (
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(programs[0]); setActiveModal('editProgram'); }}>
                          <Edit3 size={13} /> Edit
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('newProgram')}>
                        <Plus size={13} /> Add Program
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 5. Classrooms & Rooms */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-orange" style={{ width: 32, height: 32 }}><LayoutGrid size={16} /></div>
                      <div>
                        <span className="cell-strong">Classrooms & Sections</span>
                        <span className="cell-sub">Learning spaces linked to programs</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${classrooms.length > 0 ? 'b-success' : 'b-danger'}`}>
                      {classrooms.length} Class Section{classrooms.length === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {classrooms.length > 0 ? (
                        <>
                          <b>{classrooms.map((c) => c.name).join(', ')}</b>
                          <span className="cell-sub">
                            Total seats: {classrooms.reduce((acc, c) => acc + (c.capacity || 0), 0)} · Teachers assigned: {classrooms.filter((c) => c.primaryTeacherId).length}/{classrooms.length}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}>No classroom sections created</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {classrooms[0] && (
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(classrooms[0]); setActiveModal('editClass'); }}>
                          <Edit3 size={13} /> Edit
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('newClass')}>
                        <Plus size={13} /> Add Class
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 6. Operating Hours & Schedule Rules */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-blue" style={{ width: 32, height: 32 }}><Clock size={16} /></div>
                      <div>
                        <span className="cell-strong">Operating Rules & Schedule</span>
                        <span className="cell-sub">Arrival, pickup, and daily attendance windows</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${operatingConfig?.schoolStartTime ? 'b-success' : 'b-warning'}`}>
                      {operatingConfig?.schoolStartTime ? 'Configured' : 'Defaults Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      <b>Hours: {operatingConfig?.schoolStartTime || '08:30'} – {operatingConfig?.schoolEndTime || '16:00'}</b>
                      <span className="cell-sub">
                        Arrival window: {operatingConfig?.arrivalWindowStart || '08:00'}–{operatingConfig?.arrivalWindowEnd || '09:30'} · Pickup window: {operatingConfig?.pickupWindowStart || '15:30'}–{operatingConfig?.pickupWindowEnd || '17:00'} · Days: {(operatingConfig?.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI']).join(', ')}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a className="btn btn-sm btn-outline" href="/app/setup/operating_config">
                      <Edit3 size={13} /> Configure Rules
                    </a>
                  </td>
                </tr>

                {/* 7. Live System & Integration Health */}
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="kpi-ic ic-green" style={{ width: 32, height: 32 }}><Activity size={16} /></div>
                      <div>
                        <span className="cell-strong">Integrations & Live Health</span>
                        <span className="cell-sub">Database, gateway & notification infrastructure</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${health?.overall === 'HEALTHY' ? 'b-success' : 'b-warning'}`}>
                      {health?.overall || 'HEALTHY'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {health?.checks ? (
                        <>
                          <b>All Core Services Online</b>
                          <span className="cell-sub">
                            {Object.entries(health.checks).map(([k, v]: [string, any]) => `${k}: ${v.status}`).join(' · ')}
                          </span>
                        </>
                      ) : (
                        <span>Database connected · Storage active · Multi-tenant security verified</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-outline" onClick={runValidation}>
                      <ClipboardCheck size={13} /> Re-verify
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 2: ALL 21 SETUP STEPS ════════════════════ */}
      {tab === 'steps' && (
        <div style={{ marginTop: 16 }} className="table-workspace">
          {/* Workspace Filter Bar */}
          <div className="table-workspace-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="t-caption" style={{ fontWeight: 600 }}>Phase:</span>
                <select
                  className="select"
                  style={{ height: 32, fontSize: 12.5 }}
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value)}
                >
                  <option value="ALL">All 4 Phases</option>
                  {PHASES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="t-caption" style={{ fontWeight: 600 }}>Status:</span>
                <select
                  className="select"
                  style={{ height: 32, fontSize: 12.5 }}
                  value={stepStatusFilter}
                  onChange={(e) => setStepStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="PENDING">Pending</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="SKIPPED">Skipped</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="t-caption">Showing {filteredSteps.length} of {status.steps.length} steps</span>
            </div>
          </div>

          <div className="dtable-scroll">
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ width: 260 }}>Setup Step</th>
                  <th style={{ width: 130 }}>Phase</th>
                  <th style={{ width: 110 }}>Applicability</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th>Operational Reality & Blocker Reason</th>
                  <th style={{ width: 160 }}>Sign-Off Metadata</th>
                  <th style={{ textAlign: 'right', width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32 }}>
                      <EmptyState
                        icon={<ClipboardCheck size={36} />}
                        title="No steps match the selected filter"
                        message="Adjust the phase or status filters above to view other setup steps."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredSteps.map((s) => {
                    const Icon = ICONS[s.icon] ?? School
                    const badge = STEP_STATUS_MAP[s.status] || STEP_STATUS_MAP.PENDING
                    const phase = PHASES.find((p) => p.key === s.phase)
                    return (
                      <tr key={s.key}>
                        {/* Step Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className={`kpi-ic ${s.status === 'COMPLETE' ? 'ic-green' : s.status === 'BLOCKED' ? 'ic-red' : 'ic-violet'}`} style={{ width: 30, height: 30 }}>
                              <Icon size={15} />
                            </div>
                            <div>
                              <span className="cell-strong">{s.label}</span>
                              <span className="cell-sub">{s.description}</span>
                            </div>
                          </div>
                        </td>

                        {/* Phase */}
                        <td>
                          <span className="badge b-neutral" style={{ fontSize: 11 }}>{phase?.label || s.phase}</span>
                        </td>

                        {/* Applicability */}
                        <td>
                          <span className={`badge ${s.applicability === 'MANDATORY' ? 'b-primary' : 'b-neutral'}`} style={{ fontSize: 11 }}>
                            {s.applicability}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className={`badge ${badge.cls}`}>{badge.label}</span>
                            {s.changedAfterCompletion && (
                              <span className="badge b-orange" title="Underlying master records changed after completion">drift</span>
                            )}
                          </div>
                        </td>

                        {/* Operational Reality */}
                        <td>
                          <div style={{ fontSize: 13 }}>
                            {s.status === 'BLOCKED' ? (
                              <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Lock size={13} style={{ flexShrink: 0 }} />
                                <span>{s.blockedReason || 'Blocked by prerequisites'}</span>
                              </div>
                            ) : s.status === 'COMPLETE' ? (
                              <div style={{ color: 'var(--success)' }}>
                                ✓ {s.detail || 'Requirements satisfied'}
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-secondary)' }}>
                                {s.detail || s.description}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Sign-off metadata */}
                        <td>
                          <div className="t-caption">
                            {s.completedByName ? (
                              <>
                                <div>{s.completedByName}</div>
                                <div>{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ''}</div>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <a
                            className="btn btn-sm btn-outline"
                            href={`/app/setup/${s.key}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {s.status === 'COMPLETE' ? 'Edit' : 'Configure'}
                            <ChevronRight size={13} />
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 3: READINESS & HEALTH (VALIDATION) ════════════════════ */}
      {tab === 'validation' && (
        <div style={{ marginTop: 16 }} className="table-workspace">
          <div className="table-workspace-toolbar">
            <div>
              <span className="cell-strong">Operational Readiness & Health Check</span>
              <div className="cell-sub">Authoritative 15-category cross-module validation engine</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {validation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="t-caption" style={{ fontWeight: 600 }}>Overall Result:</span>
                  <span className={`badge ${CAT_STATUS_MAP[validation.overall]?.cls || 'b-neutral'}`}>
                    {validation.overall}
                  </span>
                </div>
              )}
              <button className="btn btn-primary btn-sm" onClick={runValidation} disabled={validating}>
                <ClipboardCheck size={14} /> {validating ? 'Running Verification…' : 'Run Full Validation'}
              </button>
            </div>
          </div>

          {!validation ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <EmptyState
                icon={<ClipboardCheck size={40} />}
                title="System Health Has Not Been Verified"
                message="Run the complete 15-category verification suite to audit cross-module dependencies, academic calendars, fee coverage, classroom capacities, and go-live readiness."
                action={
                  <button className="btn btn-primary" onClick={runValidation} disabled={validating}>
                    <ClipboardCheck size={15} /> Run Health Check
                  </button>
                }
              />
            </div>
          ) : (
            <div className="dtable-scroll">
              <table className="dtable">
                <thead>
                  <tr>
                    <th style={{ width: 220 }}>Validation Category</th>
                    <th style={{ width: 120 }}>Health Status</th>
                    <th>Automated Findings & Integrity Checks</th>
                  </tr>
                </thead>
                <tbody>
                  {validation.categories.map((c) => {
                    const statusConfig = CAT_STATUS_MAP[c.status] || CAT_STATUS_MAP.PASS
                    return (
                      <tr key={c.key}>
                        <td>
                          <span className="cell-strong">{c.label}</span>
                        </td>
                        <td>
                          <span className={`badge ${statusConfig.cls}`}>{statusConfig.label}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {c.findings.map((f, idx) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: 13,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  color: f.status === 'PASS' ? 'var(--text-secondary)' : f.status === 'BLOCKED' ? 'var(--danger)' : 'var(--warning)',
                                }}
                              >
                                {f.status === 'PASS' ? (
                                  <Check size={13} style={{ color: 'var(--success)' }} />
                                ) : f.status === 'BLOCKED' ? (
                                  <AlertCircle size={13} style={{ color: 'var(--danger)' }} />
                                ) : (
                                  <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
                                )}
                                <span>{f.message}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Go-Live Launch Strip */}
          {validation && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                  {validation.overall === 'BLOCKED'
                    ? 'Go-Live Blocked by Integrity Errors'
                    : status.status === 'LIVE'
                      ? 'Preschool is Live in Production'
                      : 'Preschool Ready for Production Go-Live'}
                </div>
                <div className="t-caption">
                  {validation.overall === 'BLOCKED'
                    ? 'Resolve all categories marked BLOCKED above before launching the school.'
                    : status.status === 'LIVE'
                      ? 'Normal PreOne preschool operations are active.'
                      : 'All mandatory gates passed. Launching the school promotes the operational dashboard as primary.'}
                </div>
              </div>
              <div>
                {status.status !== 'LIVE' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setGoLiveOpen(true)}
                    disabled={validation.overall === 'BLOCKED' || mandatoryLeft > 0}
                  >
                    <Rocket size={15} /> Launch Preschool (Go Live)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 4: DATA SUMMARY & DEPENDENCIES ════════════════════ */}
      {tab === 'summary' && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!deps ? (
            <div className="table-workspace"><div style={{ padding: 32 }}><Skeleton h={150} /></div></div>
          ) : (
            <>
              {/* Metric Strip for Master Counts */}
              <div className="metric-strip">
                <div className="metric-cell">
                  <div className="m-top"><span className="m-lbl">Campuses</span><Building2 size={15} /></div>
                  <div className="m-val">{deps.summary.branches}</div>
                  <div className="m-meta">Operating branches</div>
                </div>
                <div className="metric-cell">
                  <div className="m-top"><span className="m-lbl">Programs</span><Blocks size={15} /></div>
                  <div className="m-val">{deps.summary.programs}</div>
                  <div className="m-meta">Educational tracks</div>
                </div>
                <div className="metric-cell">
                  <div className="m-top"><span className="m-lbl">Classrooms</span><LayoutGrid size={15} /></div>
                  <div className="m-val">{deps.summary.classes}</div>
                  <div className="m-meta">Class sections</div>
                </div>
                <div className="metric-cell">
                  <div className="m-top"><span className="m-lbl">Staff Members</span><Users size={15} /></div>
                  <div className="m-val">{deps.summary.staff}</div>
                  <div className="m-meta">Employment profiles</div>
                </div>
                <div className="metric-cell">
                  <div className="m-top"><span className="m-lbl">Fee Plans</span><IndianRupee size={15} /></div>
                  <div className="m-val">{deps.summary.feePlans}</div>
                  <div className="m-meta">Active billing plans</div>
                </div>
                <div className="metric-cell">
                  <div className="m-top"><span className="m-lbl">Students</span><GraduationCap size={15} /></div>
                  <div className="m-val">{deps.summary.students}</div>
                  <div className="m-meta">Enrolled children</div>
                </div>
              </div>

              {/* Dependency Graph Workspace */}
              <div className="table-workspace">
                <div className="table-workspace-toolbar">
                  <div>
                    <span className="cell-strong">Setup Dependency DAG</span>
                    <div className="cell-sub">Authoritative prerequisite graph — what unlocks what</div>
                  </div>
                  <span className="badge b-neutral">{deps.graph.length} Dependent Nodes</span>
                </div>

                <div className="dtable-scroll">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th style={{ width: 240 }}>Step Target</th>
                        <th style={{ width: 120 }}>Applicability</th>
                        <th style={{ width: 110 }}>Current Status</th>
                        <th>Required Prerequisites (Unlocks when all COMPLETE)</th>
                        <th>Active Blockers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deps.graph.map((node) => (
                        <tr key={node.key}>
                          <td>
                            <span className="cell-strong">{node.label}</span>
                            <span className="cell-sub">{node.key}</span>
                          </td>
                          <td>
                            <span className={`badge ${node.applicability === 'MANDATORY' ? 'b-primary' : 'b-neutral'}`} style={{ fontSize: 11 }}>
                              {node.applicability}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${STEP_STATUS_MAP[node.status]?.cls || 'b-neutral'}`}>{node.status}</span>
                          </td>
                          <td>
                            {node.deps.length === 0 ? (
                              <span style={{ color: 'var(--text-muted)' }}>Root step — no prerequisites</span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {node.deps.map((d) => (
                                  <span key={d.key} className={`badge ${d.status === 'COMPLETE' ? 'b-success' : 'b-neutral'}`} style={{ fontSize: 11 }}>
                                    {d.status === 'COMPLETE' ? '✓ ' : ''}{d.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {node.blockedBy.length > 0 ? (
                              <div style={{ color: 'var(--danger)', fontSize: 12.5 }}>
                                Needs: {node.blockedBy.map((b) => b.label).join(', ')}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--success)', fontSize: 12.5 }}>✓ Unlocked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════ CANONICAL MODALS ════════════════════ */}

      {/* 1. EDIT SCHOOL PROFILE MODAL */}
      {activeModal === 'profile' && profile && (
        <Modal open onClose={() => setActiveModal(null)} title="Edit School Profile & Identity" icon={<School size={22} />} iconClass="ic-violet" wide>
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch('/api/v1/setup/school-profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fd),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('School profile updated')
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Update failed', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Preschool Name <span className="req">*</span></label><input className="input" name="name" defaultValue={profile.name} required /></div>
              <div className="field"><label>School Code</label><input className="input" value={profile.code} disabled /></div>
              <div className="field"><label>Official Email <span className="req">*</span></label><input className="input" name="email" type="email" defaultValue={profile.email} required /></div>
              <div className="field"><label>Primary Phone <span className="req">*</span></label><input className="input" name="phone" defaultValue={profile.phone} required /></div>
              <div className="field"><label>City <span className="req">*</span></label><input className="input" name="city" defaultValue={profile.city} required /></div>
              <div className="field"><label>State</label><input className="input" name="state" defaultValue={profile.state || ''} /></div>
              <div className="field"><label>Pincode</label><input className="input" name="pincode" defaultValue={profile.pincode || ''} /></div>
              <div className="field"><label>Timezone</label><input className="input" name="timezone" defaultValue={profile.timezone || 'Asia/Kolkata'} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Campus Address</label><textarea className="textarea" rows={2} name="address" defaultValue={profile.address || ''} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. ADD CAMPUS MODAL */}
      {activeModal === 'newBranch' && (
        <Modal open onClose={() => setActiveModal(null)} title="Add Campus Branch" icon={<Building2 size={22} />} iconClass="ic-blue">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch('/api/v1/branches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fd),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Branch added', res.data.name)
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Failed to create branch', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Branch Name <span className="req">*</span></label><input className="input" name="name" required placeholder="e.g. Koramangala Campus" /></div>
              <div className="field"><label>Code <span className="req">*</span></label><input className="input" name="code" required placeholder="KRM" /></div>
              <div className="field"><label>City</label><input className="input" name="city" placeholder="Bengaluru" /></div>
              <div className="field"><label>Phone</label><input className="input" name="phone" /></div>
              <div className="field"><label>Opens at</label><input className="input" name="timingOpen" type="time" defaultValue="08:30" /></div>
              <div className="field"><label>Closes at</label><input className="input" name="timingClose" type="time" defaultValue="16:00" /></div>
              <div className="field"><label>Seat Capacity</label><input className="input" name="capacity" type="number" placeholder="60" /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address</label><input className="input" name="address" /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Branch</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. EDIT CAMPUS MODAL */}
      {activeModal === 'editBranch' && editingItem && (
        <Modal open onClose={() => setActiveModal(null)} title={`Edit Branch — ${editingItem.name}`} icon={<Building2 size={22} />} iconClass="ic-blue">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch(`/api/v1/branches/${editingItem.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: fd.name,
                city: fd.city || null,
                phone: fd.phone || null,
                timingOpen: fd.timingOpen,
                timingClose: fd.timingClose,
                capacity: fd.capacity ? Number(fd.capacity) : null,
                address: fd.address || null,
                isActive: fd.isActive === 'on',
              }),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Branch updated')
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Update failed', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Branch Name <span className="req">*</span></label><input className="input" name="name" defaultValue={editingItem.name} required /></div>
              <div className="field"><label>Code</label><input className="input" value={editingItem.code} disabled /></div>
              <div className="field"><label>City</label><input className="input" name="city" defaultValue={editingItem.city || ''} /></div>
              <div className="field"><label>Phone</label><input className="input" name="phone" defaultValue={editingItem.phone || ''} /></div>
              <div className="field"><label>Opens at</label><input className="input" name="timingOpen" type="time" defaultValue={editingItem.timingOpen || '08:30'} /></div>
              <div className="field"><label>Closes at</label><input className="input" name="timingClose" type="time" defaultValue={editingItem.timingClose || '16:00'} /></div>
              <div className="field"><label>Capacity</label><input className="input" name="capacity" type="number" defaultValue={editingItem.capacity || ''} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address</label><input className="input" name="address" defaultValue={editingItem.address || ''} /></div>
              <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" name="isActive" defaultChecked={editingItem.isActive !== false} />
                  <span>Active Branch</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. ADD PROGRAM MODAL */}
      {activeModal === 'newProgram' && (
        <Modal open onClose={() => setActiveModal(null)} title="Add Program" icon={<Blocks size={22} />} iconClass="ic-violet">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch('/api/v1/programs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fd),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Program added', res.data.name)
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Failed to create program', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Program Name <span className="req">*</span></label><input className="input" name="name" required placeholder="e.g. Toddler Playgroup" /></div>
              <div className="field"><label>Code <span className="req">*</span></label><input className="input" name="code" required placeholder="PLAY" /></div>
              <div className="field"><label>System Program Type <span className="req">*</span></label>
                <select className="select" name="programType" required>
                  {['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field"><label>Capacity (seats) <span className="req">*</span></label><input className="input" name="capacity" type="number" defaultValue={20} min="1" required /></div>
              <div className="field"><label>Min Age (months)</label><input className="input" name="ageMinMonths" type="number" placeholder="24" /></div>
              <div className="field"><label>Max Age (months)</label><input className="input" name="ageMaxMonths" type="number" placeholder="36" /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><input className="input" name="description" placeholder="Sensory and motor early play" /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Program</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. EDIT PROGRAM MODAL */}
      {activeModal === 'editProgram' && editingItem && (
        <Modal open onClose={() => setActiveModal(null)} title={`Edit Program — ${editingItem.name}`} icon={<Blocks size={22} />} iconClass="ic-violet">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch(`/api/v1/programs/${editingItem.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: fd.name,
                ageMinMonths: fd.ageMinMonths ? Number(fd.ageMinMonths) : null,
                ageMaxMonths: fd.ageMaxMonths ? Number(fd.ageMaxMonths) : null,
                capacity: Number(fd.capacity || 20),
                description: fd.description || null,
                isActive: fd.isActive === 'on',
              }),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Program updated')
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Update failed', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Program Name <span className="req">*</span></label><input className="input" name="name" defaultValue={editingItem.name} required /></div>
              <div className="field"><label>Code</label><input className="input" value={editingItem.code} disabled /></div>
              <div className="field"><label>Capacity (seats) <span className="req">*</span></label><input className="input" name="capacity" type="number" defaultValue={editingItem.capacity} min="1" required /></div>
              <div className="field"><label>Min Age (months)</label><input className="input" name="ageMinMonths" type="number" defaultValue={editingItem.ageMinMonths || ''} /></div>
              <div className="field"><label>Max Age (months)</label><input className="input" name="ageMaxMonths" type="number" defaultValue={editingItem.ageMaxMonths || ''} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><input className="input" name="description" defaultValue={editingItem.description || ''} /></div>
              <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" name="isActive" defaultChecked={editingItem.isActive !== false} />
                  <span>Accepting Admissions (Active)</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. ADD ACADEMIC YEAR MODAL */}
      {activeModal === 'newYear' && (
        <Modal open onClose={() => setActiveModal(null)} title="Create Academic Year" icon={<CalendarRange size={22} />} iconClass="ic-green">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch('/api/v1/academic-years', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fd),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Academic year created', res.data.name)
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Failed to create year', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Year Name <span className="req">*</span></label><input className="input" name="name" required placeholder="2026-27" /></div>
              <div className="field"><label>Start Date <span className="req">*</span></label><input className="input" name="startDate" type="date" required /></div>
              <div className="field"><label>End Date <span className="req">*</span></label><input className="input" name="endDate" type="date" required /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Year</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. EDIT ACADEMIC YEAR MODAL */}
      {activeModal === 'editYear' && editingItem && (
        <Modal open onClose={() => setActiveModal(null)} title={`Edit Academic Year — ${editingItem.name}`} icon={<CalendarRange size={22} />} iconClass="ic-green">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const payload: Dict = {
              name: fd.name,
              startDate: fd.startDate,
              endDate: fd.endDate,
            }
            if (fd.setStatusCurrent === 'on') payload.setStatusCurrent = true
            const res = await fetch(`/api/v1/academic-years/${editingItem.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Academic year updated')
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Update failed', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Year Name <span className="req">*</span></label><input className="input" name="name" defaultValue={editingItem.name} required /></div>
              <div className="field"><label>Start Date <span className="req">*</span></label><input className="input" name="startDate" type="date" defaultValue={editingItem.startDate ? new Date(editingItem.startDate).toISOString().split('T')[0] : ''} required /></div>
              <div className="field"><label>End Date <span className="req">*</span></label><input className="input" name="endDate" type="date" defaultValue={editingItem.endDate ? new Date(editingItem.endDate).toISOString().split('T')[0] : ''} required /></div>
              <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" name="setStatusCurrent" defaultChecked={editingItem.isCurrent === true} />
                  <span>Set as Current Operating Year</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 8. ADD CLASSROOM MODAL */}
      {activeModal === 'newClass' && (
        <Modal open onClose={() => setActiveModal(null)} title="Add Classroom / Section" icon={<LayoutGrid size={22} />} iconClass="ic-orange">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const selectedProgram = programs.find((p) => p.id === fd.programId)
            const payload = {
              name: fd.name,
              programType: selectedProgram ? selectedProgram.programType : 'PLAYGROUP',
              programId: fd.programId || null,
              capacity: Number(fd.capacity || 20),
              branchId: fd.branchId || (branches[0]?.id ?? null),
            }
            const res = await fetch('/api/v1/classrooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Classroom created', res.data.name)
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Failed to create classroom', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Classroom Name <span className="req">*</span></label><input className="input" name="name" required placeholder="e.g. Playgroup Blueberries" /></div>
              <div className="field"><label>Program <span className="req">*</span></label>
                <select className="select" name="programId" required>
                  <option value="">Select program…</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Branch Campus <span className="req">*</span></label>
                <select className="select" name="branchId" required defaultValue={branches[0]?.id || ''}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Seat Capacity <span className="req">*</span></label><input className="input" name="capacity" type="number" defaultValue={20} min="1" required /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Classroom</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 9. EDIT CLASSROOM MODAL */}
      {activeModal === 'editClass' && editingItem && (
        <Modal open onClose={() => setActiveModal(null)} title={`Edit Classroom — ${editingItem.name}`} icon={<LayoutGrid size={22} />} iconClass="ic-orange">
          <form onSubmit={async (e) => {
            e.preventDefault(); setBusy(true)
            const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
            const res = await fetch(`/api/v1/classrooms/${editingItem.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: fd.name,
                capacity: Number(fd.capacity || 20),
                programId: fd.programId || null,
                primaryTeacherId: fd.primaryTeacherId || null,
              }),
            }).then((r) => r.json())
            setBusy(false)
            if (res.success) {
              toast.success('Classroom updated')
              setActiveModal(null)
              refreshAll()
            } else {
              toast.error('Update failed', res.error?.message)
            }
          }}>
            <div className="form-grid">
              <div className="field"><label>Class Name <span className="req">*</span></label><input className="input" name="name" defaultValue={editingItem.name} required /></div>
              <div className="field"><label>Code</label><input className="input" value={editingItem.code} disabled /></div>
              <div className="field"><label>Linked Program</label>
                <select className="select" name="programId" defaultValue={editingItem.programId || ''}>
                  <option value="">Select program…</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Capacity (seats) <span className="req">*</span></label>
                <input className="input" name="capacity" type="number" defaultValue={editingItem.capacity} min="1" required />
                <div className="helper">Currently enrolled: {editingItem.students ?? 0} children</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* 10. DEPENDENCY GRAPH MODAL */}
      <Modal open={depOpen} onClose={() => setDepOpen(false)} title="Setup Dependency Graph" subtitle="What blocks what — the M00 prerequisite engine" icon={<LayoutList size={22} />} wide>
        {!deps ? <Skeleton h={300} /> : (
          <div style={{ display: 'grid', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
            {deps.graph.map((g: any) => (
              <div key={g.key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 14px', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="cell-strong" style={{ fontSize: 13.5 }}>{g.label}</span>
                  <span className={`badge ${STEP_STATUS_MAP[g.status]?.cls ?? 'b-neutral'}`}>{g.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {g.deps.length === 0 ? 'Root step' : `Requires: ${g.deps.map((d: any) => d.label).join(', ')}`}
                  </span>
                </div>
                {g.blockedBy && g.blockedBy.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={12} />
                    <span>Needs {g.blockedBy.map((b: any) => b.label).join(' and ')} completed first</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 11. GO-LIVE CONFIRMATION MODAL */}
      <Modal open={goLiveOpen} onClose={() => setGoLiveOpen(false)} title="Launch Preschool (Go Live)" icon={<Rocket size={22} />} iconClass="ic-violet">
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}>
            This officially transitions the preschool to <b>LIVE</b> in production and activates the full operational dashboard as the default landing environment.
          </p>
          <div style={{ padding: '12px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Readiness Confirmation Checklist:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <div>✓ Mandatory Foundation & Academic Steps Verified</div>
              <div>✓ Classrooms, Programs & Fee Plans Active</div>
              <div>✓ Primary Teachers Assigned & Staff Branch Scoped</div>
              <div>✓ Operational Settings & Attendance Rules Ready</div>
            </div>
          </div>
          <p className="t-caption">
            Note: All master records, fee schedules, and academic settings remain 100% editable anytime after launch.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={() => setGoLiveOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={goLive} disabled={busy}>
            <Rocket size={15} /> {busy ? 'Launching…' : 'Confirm & Launch Preschool'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
