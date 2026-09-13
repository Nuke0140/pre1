'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  School, Building2, Palette, Blocks, DoorOpen, Clock, ShieldCheck, Users,
  CalendarRange, LayoutGrid, GraduationCap, BookOpen, CalendarDays, IndianRupee,
  ClipboardList, HeartHandshake, Sun, Cross, Megaphone, FileText, Upload,
  Rocket, CheckCircle2, AlertTriangle, Lock, ChevronRight, PlayCircle,
  ClipboardCheck, LayoutList, ArrowRight, History, Sparkles, Edit3, Plus,
  Sliders, Activity, Check, RefreshCw
} from 'lucide-react'
import { PageHead, Segmented, Skeleton, EmptyState, KpiTile, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { PHASES } from '@/lib/setup/steps'

const ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  School, Building2, Palette, Blocks, DoorOpen, Clock, ShieldCheck, Users,
  CalendarRange, LayoutGrid, GraduationCap, BookOpen, CalendarDays, IndianRupee,
  ClipboardList, HeartHandshake, Sun, Cross, Megaphone, FileText, Upload,
}

interface StepRow {
  key: string; label: string; phase: string; applicability: string; icon: string
  description: string; status: 'PENDING' | 'COMPLETE' | 'BLOCKED' | 'SKIPPED'
  detail: string; blockedReason: string | null
  missingDeps: { key: string; label: string }[]
  completedAt: string | null; completedByName: string | null
  changedAfterCompletion: boolean; lastCheckedAt: string
  locked: boolean
}
interface StatusPayload {
  status: string; progress: number; startedAt: string | null; goLiveAt: string | null
  steps: StepRow[]; nextStepKey: string | null
  guidance: { level: string; message: string; stepKey: string }[]
}
interface ValidationPayload {
  overall: string
  categories: { key: string; label: string; status: string; findings: { status: string; message: string }[] }[]
  setupStatus?: string
}
interface DepsPayload {
  summary: {
    school: { name: { name: string; code: string; city: string | null } | null }
    branches: number; programs: number; academicYears: number; classes: number
    staff: number; calendarEvents: number; feePlans: number; students: number
  }
  graph: { key: string; label: string; applicability: string; status: string; blockedBy: { key: string; label: string }[]; deps: { key: string; label: string; status: string }[] }[]
}

type Dict = Record<string, any>

const STEP_BADGE: Record<string, { cls: string; label: string }> = {
  COMPLETE: { cls: 'b-success', label: 'Complete' },
  PENDING: { cls: 'b-info', label: 'Pending' },
  BLOCKED: { cls: 'b-danger', label: 'Blocked' },
  SKIPPED: { cls: 'b-neutral', label: 'Skipped' },
}
const SETUP_BADGE: Record<string, { cls: string; label: string }> = {
  NOT_STARTED: { cls: 'b-neutral', label: 'Not started' },
  IN_PROGRESS: { cls: 'b-orange', label: 'In progress' },
  BLOCKED: { cls: 'b-danger', label: 'Blocked' },
  READY_FOR_REVIEW: { cls: 'b-primary', label: 'Ready for review' },
  READY_FOR_GO_LIVE: { cls: 'b-primary', label: 'Ready for go-live' },
  LIVE: { cls: 'b-success', label: 'Live' },
}
const CAT_BADGE: Record<string, string> = { PASS: 'b-success', WARNING: 'b-warning', BLOCKED: 'b-danger' }

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

  // Quick Hub Master Data
  const [profile, setProfile] = useState<Dict | null>(null)
  const [branches, setBranches] = useState<Dict[]>([])
  const [programs, setPrograms] = useState<Dict[]>([])
  const [years, setYears] = useState<Dict[]>([])
  const [classrooms, setClassrooms] = useState<Dict[]>([])
  const [operatingConfig, setOperatingConfig] = useState<Dict | null>(null)
  const [health, setHealth] = useState<Dict | null>(null)

  // Edit Modals on Hub
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Dict | null>(null)

  const load = useCallback(async () => {
    const j = await fetch('/api/v1/setup/status').then((r) => r.json())
    if (j.success) setStatus(j.data)
  }, [])

  const loadHubData = useCallback(async () => {
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
    if (b?.success) setBranches(b.data)
    if (pr?.success) setPrograms(pr.data)
    if (y?.success) setYears(y.data)
    if (c?.success) setClassrooms(c.data)
    if (o?.success) setOperatingConfig(o.data.data)
    if (h?.success) setHealth(h.data)
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
    Promise.resolve().then(loadHubData)
  }, [load, loadHubData])

  const refreshAll = useCallback(() => {
    load()
    loadHubData()
  }, [load, loadHubData])

  const loadDeps = useCallback(async () => {
    const j = await fetch('/api/v1/setup/dependencies').then((r) => r.json())
    if (j.success) setDeps(j.data)
  }, [])

  const runValidation = async () => {
    setValidating(true)
    const j = await fetch('/api/v1/setup/validate', { method: 'POST' }).then((r) => r.json())
    setValidating(false)
    if (j.success) {
      setValidation(j.data)
      setTab('validation')
      toast.success('Validation complete', `Overall: ${j.data.overall}`)
    } else {
      toast.error('Validation failed', j.error?.message)
    }
  }

  const goLive = async () => {
    setBusy(true)
    const j = await fetch('/api/v1/setup/go-live', { method: 'POST' }).then((r) => r.json())
    setBusy(false)
    if (j.success) {
      toast.success('Go-live complete', 'Your preschool is now live on PreOne')
      setGoLiveOpen(false)
      setValidation(null)
      load()
    } else {
      toast.error('Go-live blocked', j.error?.message)
      if (j.error?.code === 'SETUP_001') { setGoLiveOpen(false); runValidation() }
    }
  }

  const nextStep = useMemo(() => status?.steps.find((s) => s.key === status.nextStepKey) ?? null, [status])
  const currentYear = useMemo(() => years.find((y) => y.isCurrent) ?? years[0] ?? null, [years])
  const mandatoryLeft = useMemo(
    () => status?.steps.filter((s) => s.applicability === 'MANDATORY' && (s.status === 'PENDING' || s.status === 'BLOCKED')).length ?? 0,
    [status]
  )

  if (status === null) {
    return (
      <>
        <PageHead title="Preschool Setup & Configuration" sub="From empty tenant to fully operational PreOne preschool" />
        <div className="card"><div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <Skeleton h={28} /><Skeleton h={16} /><Skeleton h={16} /><Skeleton h={120} />
        </div></div>
      </>
    )
  }

  const badge = SETUP_BADGE[status.status] ?? SETUP_BADGE.NOT_STARTED

  return (
    <>
      <PageHead
        title="Preschool Setup & Master Configuration"
        sub="Easily view, edit, and configure your preschool foundation, programs, campuses, and business rules in one place."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => { setDepOpen(true); if (!deps) loadDeps() }}>
              <LayoutList size={15} /> Dependencies
            </button>
            <button className="btn btn-outline" onClick={runValidation} disabled={validating}>
              <ClipboardCheck size={15} /> {validating ? 'Checking…' : 'Run Health Check'}
            </button>
            {nextStep && (
              <a className="btn btn-primary" href={`/app/setup/${nextStep.key}`}>
                <PlayCircle size={15} /> Step Guide ({nextStep.label}) <ChevronRight size={14} />
              </a>
            )}
          </>
        }
      />

      {/* ── Progress & Status Strip ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="kpi-ic ic-violet"><Rocket size={20} /></div>
            <div>
              <div className="card-title">School Operational Readiness <span className={`badge ${badge.cls}`} style={{ marginLeft: 8 }}>{badge.label}</span></div>
              <div className="card-sub">
                {status.status === 'LIVE'
                  ? `Live since ${status.goLiveAt ? new Date(status.goLiveAt).toLocaleDateString() : '—'} — configuration remains fully editable in place`
                  : mandatoryLeft === 0
                    ? 'All required preschool configuration verified — click below to review and launch'
                    : `${mandatoryLeft} required configuration step${mandatoryLeft === 1 ? '' : 's'} remaining`}
              </div>
            </div>
          </div>
          <div style={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              <span>Configuration Progress</span><span>{status.progress}%</span>
            </div>
            <div className="progressbar"><div style={{ width: `${status.progress}%` }} /></div>
          </div>
        </div>
      </div>

      {/* ── Guidance Tips ── */}
      {status.guidance.length > 0 && status.status !== 'LIVE' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><div><div className="card-title">Helpful Configuration Tips</div><div className="card-sub">Recommended setups to complete next</div></div><Sparkles size={18} className="t-muted" /></div>
          <div style={{ display: 'grid', gap: 8 }}>
            {status.guidance.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
                {g.level === 'warning'
                  ? <AlertTriangle size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                  : <ArrowRight size={15} style={{ color: 'var(--preone-primary)', flexShrink: 0, marginTop: 1 }} />}
                <span>{g.message}</span>
                <a href={`/app/setup/${g.stepKey}`} className="cell-link" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Configure</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Segmented Tabs ── */}
      <Segmented
        value={tab}
        onChange={(v) => {
          setTab(v as typeof tab)
          if (v === 'summary' && !deps) loadDeps()
        }}
        options={[
          { key: 'hub', label: '⚡ Quick Configuration Hub' },
          { key: 'steps', label: 'All 21 Setup Steps' },
          { key: 'validation', label: 'Readiness & Health' },
          { key: 'summary', label: 'Data Summary' },
        ]}
      />

      {/* ════════════════════ TAB 1: QUICK CONFIGURATION HUB ════════════════════ */}
      {tab === 'hub' && (
        <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
          {/* TOP MASTER CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>

            {/* CARD 1: School Profile & Identity */}
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-violet"><School size={17} /></div>
                  <div>
                    <div className="card-title">School Identity & Branding</div>
                    <div className="card-sub">Name, contact info, logo & address</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('profile')}>
                  <Edit3 size={13} /> Edit
                </button>
              </div>
              <div style={{ padding: '4px 0', fontSize: 13.5 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {profile?.name || 'School Name'}
                </div>
                <div className="t-caption" style={{ marginBottom: 8 }}>
                  Code: <b>{profile?.code || '—'}</b> · {profile?.city || '—'}, {profile?.state || ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: 'var(--foreground-secondary)', fontSize: 12.5 }}>
                  <span>📧 {profile?.email || 'No email configured'}</span>
                  <span>📞 {profile?.phone || 'No phone configured'}</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Current Academic Year */}
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-green"><CalendarRange size={17} /></div>
                  <div>
                    <div className="card-title">Operating Academic Year</div>
                    <div className="card-sub">Enrolment & attendance calendar year</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => setActiveModal('newYear')} title="Create new year">
                    <Plus size={13} /> New Year
                  </button>
                  {currentYear && (
                    <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(currentYear); setActiveModal('editYear'); }}>
                      <Edit3 size={13} /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div style={{ padding: '4px 0' }}>
                {currentYear ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{currentYear.name}</span>
                      <span className="badge b-success">CURRENT YEAR</span>
                    </div>
                    <div className="t-caption">
                      {new Date(currentYear.startDate).toLocaleDateString()} → {new Date(currentYear.endDate).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--foreground-secondary)' }}>
                      Total {years.length} academic year{years.length === 1 ? '' : 's'} configured
                    </div>
                  </>
                ) : (
                  <div className="t-caption">No active academic year found. Click "New Year" to configure.</div>
                )}
              </div>
            </div>

            {/* CARD 3: Campus Branches */}
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-blue"><Building2 size={17} /></div>
                  <div>
                    <div className="card-title">Campus Branches ({branches.length})</div>
                    <div className="card-sub">Physical school campuses & hours</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setActiveModal('newBranch')}>
                  <Plus size={13} /> Add Campus
                </button>
              </div>
              <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {branches.length === 0 ? (
                  <div className="t-caption">No branch campuses created yet.</div>
                ) : (
                  branches.map((b) => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-subtle)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {b.name} {b.isMain && <span className="badge b-primary" style={{ fontSize: 10, marginLeft: 4 }}>MAIN</span>}
                        </div>
                        <div className="t-caption">{b.timingOpen || '08:30'}–{b.timingClose || '16:00'} · {b.capacity ? `${b.capacity} seats` : 'Capacity flexible'}</div>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(b); setActiveModal('editBranch'); }} title="Edit branch timings & capacity">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD 4: Programs Offered */}
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-violet"><Blocks size={17} /></div>
                  <div>
                    <div className="card-title">Programs Offered ({programs.length})</div>
                    <div className="card-sub">Age bands, capacities & fee plans</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setActiveModal('newProgram')}>
                  <Plus size={13} /> Add Program
                </button>
              </div>
              <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {programs.length === 0 ? (
                  <div className="t-caption">No programs created yet.</div>
                ) : (
                  programs.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-subtle)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {p.name} <span className="cell-sub">({p.code})</span>
                        </div>
                        <div className="t-caption">
                          {p.ageMinMonths != null && p.ageMaxMonths != null ? `${p.ageMinMonths}–${p.ageMaxMonths} months` : 'Age flexible'} · {p.capacity} seats max
                        </div>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(p); setActiveModal('editProgram'); }} title="Edit program age and capacity">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD 5: Classrooms & Capacity */}
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-orange"><LayoutGrid size={17} /></div>
                  <div>
                    <div className="card-title">Classrooms & Sections ({classrooms.length})</div>
                    <div className="card-sub">Active class-sections and lead teachers</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setActiveModal('newClass')}>
                  <Plus size={13} /> Add Class
                </button>
              </div>
              <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {classrooms.length === 0 ? (
                  <div className="t-caption">No classrooms configured yet.</div>
                ) : (
                  classrooms.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--surface-subtle)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {c.name} <span className="cell-sub">({c.programName || c.programType})</span>
                        </div>
                        <div className="t-caption">
                          Teacher: {c.teacher || 'Unassigned'} · Enrolled: <b>{c.students ?? 0}</b> / {c.capacity}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => { setEditingItem(c); setActiveModal('editClass'); }} title="Edit classroom capacity and teacher">
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD 6: Daily Operating Schedule */}
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-cyan"><Clock size={17} /></div>
                  <div>
                    <div className="card-title">Daily Timings & Schedule</div>
                    <div className="card-sub">Operating hours, arrival & pickup window</div>
                  </div>
                </div>
                <a className="btn btn-sm btn-outline" href="/app/setup/operating_config">
                  <Edit3 size={13} /> Edit Hours
                </a>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption">School Hours:</span>
                  <b>{operatingConfig?.schoolStartTime || '08:30'} – {operatingConfig?.schoolEndTime || '16:00'}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption">Arrival Window:</span>
                  <span>{operatingConfig?.arrivalWindowStart || '08:00'} – {operatingConfig?.arrivalWindowEnd || '09:30'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption">Pickup Window:</span>
                  <span>{operatingConfig?.pickupWindowStart || '15:30'} – {operatingConfig?.pickupWindowEnd || '17:00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-caption">Working Days:</span>
                  <span>{(operatingConfig?.workingDays || ['MON', 'TUE', 'WED', 'THU', 'FRI']).join(', ')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* SYSTEM HEALTH & INTEGRATIONS ROW */}
          {health && (
            <div className="card">
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="kpi-ic ic-green"><Activity size={17} /></div>
                  <div>
                    <div className="card-title">System & Integration Live Health</div>
                    <div className="card-sub">Database and gateway connectivity check</div>
                  </div>
                </div>
                <span className={`badge ${health.overall === 'HEALTHY' ? 'b-success' : 'b-warning'}`}>{health.overall}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 4 }}>
                {health.checks && Object.entries(health.checks).map(([service, status]: [string, any]) => (
                  <div key={service} style={{ padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{service}</span>
                      <span className={`badge ${status.status === 'PASS' ? 'b-success' : 'b-neutral'}`}>{status.status}</span>
                    </div>
                    <div className="t-caption">{status.message || 'Connected'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ TAB 2: ALL 21 SETUP STEPS ════════════════════ */}
      {tab === 'steps' && (
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          {PHASES.map((phase) => {
            const rows = status.steps.filter((s) => s.phase === phase.key)
            if (!rows.length) return null
            return (
              <div className="card" key={phase.key}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{phase.label}</div>
                    <div className="card-sub">{phase.sub} — {rows.filter((r) => r.status === 'COMPLETE' || r.status === 'SKIPPED').length}/{rows.length} complete</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {rows.map((s) => {
                    const Icon = ICONS[s.icon] ?? School
                    const b = STEP_BADGE[s.status]
                    return (
                      <div key={s.key} style={{
                        display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px',
                        border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--surface)',
                      }}>
                        <div className="kpi-ic ic-violet" style={{ width: 34, height: 34, borderRadius: 8 }}><Icon size={17} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.label}</span>
                            <span className={`badge ${b.cls}`}>{b.label}</span>
                            {s.applicability !== 'MANDATORY' && <span className="badge b-neutral">{s.applicability}</span>}
                            {s.changedAfterCompletion && <span className="badge b-orange">edited</span>}
                          </div>
                          <div className="card-sub" style={{ marginTop: 2 }}>
                            {s.status === 'BLOCKED'
                              ? s.blockedReason
                              : s.status === 'COMPLETE'
                                ? `${s.detail}${s.completedByName ? ` — by ${s.completedByName}` : ''}`
                                : s.detail || s.description}
                          </div>
                        </div>
                        <a className="btn btn-sm btn-outline" href={`/app/setup/${s.key}`}>
                          {s.status === 'COMPLETE' ? 'Edit' : 'Configure'} <ChevronRight size={13} />
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════ TAB 3: VALIDATION & READINESS ════════════════════ */}
      {tab === 'validation' && (
        <div style={{ marginTop: 16 }}>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-head">
              <div>
                <div className="card-title">Setup Readiness & Rule Engine</div>
                <div className="card-sub">Automated verification of cross-module dependencies and integrity rules</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={runValidation} disabled={validating}>
                <ClipboardCheck size={14} /> {validating ? 'Running…' : 'Run Full Validation'}
              </button>
            </div>
            {validation ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Readiness:</span>
                  <span className={`badge ${CAT_BADGE[validation.overall] ?? 'b-neutral'}`}>{validation.overall}</span>
                </div>
                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                  {validation.categories.map((c) => (
                    <div key={c.key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.label}</span>
                        <span className={`badge ${CAT_BADGE[c.status] ?? 'b-neutral'}`}>{c.status}</span>
                      </div>
                      <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
                        {c.findings.map((f, i) => (
                          <div key={i} style={{ fontSize: 12.5, color: f.status === 'PASS' ? 'var(--foreground-secondary)' : 'var(--danger)' }}>
                            {f.status === 'PASS' ? '✓ ' : '✗ '}{f.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--foreground-secondary)' }}>
                Click "Run Full Validation" to check system readiness.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 4: DATA SUMMARY ════════════════════ */}
      {tab === 'summary' && (
        <div style={{ marginTop: 16 }}>
          {!deps ? <Skeleton h={200} /> : (
            <div className="card">
              <div className="card-head">
                <div><div className="card-title">Setup Summary Matrix</div><div className="card-sub">Current master records across all domains</div></div>
                <button className="btn btn-outline btn-sm" onClick={() => setDepOpen(true)}><LayoutList size={14} /> Dependency Graph</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
                {[
                  { label: 'Preschool', value: deps.summary.school.name?.name ?? '—' },
                  { label: 'Campuses', value: deps.summary.branches },
                  { label: 'Programs', value: deps.summary.programs },
                  { label: 'Academic Years', value: deps.summary.academicYears },
                  { label: 'Classes', value: deps.summary.classes },
                  { label: 'Staff Members', value: deps.summary.staff },
                  { label: 'Calendar Events', value: deps.summary.calendarEvents },
                  { label: 'Fee Plans', value: deps.summary.feePlans },
                  { label: 'Enrolled Students', value: deps.summary.students },
                ].map((x) => (
                  <div key={x.label} className="stat-mini">
                    <div className="stat-mini-val" style={{ fontSize: 16, fontWeight: 700 }}>{x.value}</div>
                    <div className="stat-mini-label">{x.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ POPUP MODALS ════════════════════ */}

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

      {/* Dependency Graph Modal */}
      <Modal open={depOpen} onClose={() => setDepOpen(false)} title="Setup Dependency Graph" subtitle="What blocks what — the M00 dependency engine" icon={<LayoutList size={22} />} wide>
        {!deps ? <Skeleton h={300} /> : (
          <div style={{ display: 'grid', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
            {deps.graph.map((g: any) => (
              <div key={g.key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{g.label}</span>
                  <span className={`badge ${STEP_BADGE[g.status]?.cls ?? 'b-neutral'}`}>{g.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--foreground-secondary)' }}>
                    {g.deps.length === 0 ? 'no dependencies' : `requires: ${g.deps.map((d: any) => d.label).join(', ')}`}
                  </span>
                </div>
                {g.blockedBy && g.blockedBy.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)' }}>
                    Why blocked: needs {g.blockedBy.map((b: any) => b.label).join(' and ')} completed first.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Go Live Confirmation */}
      <Modal open={goLiveOpen} onClose={() => setGoLiveOpen(false)} title="Go Live" icon={<Rocket size={22} />} iconClass="ic-violet">
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          This marks the preschool as <b>LIVE</b> and makes the operational dashboard the primary landing page.
          Configuration remains fully editable anytime.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => setGoLiveOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={goLive} disabled={busy}>
            <Rocket size={15} /> {busy ? 'Going live…' : 'Confirm Go Live'}
          </button>
        </div>
      </Modal>
    </>
  )
}
