'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  School, Building2, Palette, Blocks, DoorOpen, Clock, ShieldCheck, Users,
  CalendarRange, LayoutGrid, GraduationCap, BookOpen, CalendarDays, IndianRupee,
  ClipboardList, HeartHandshake, Sun, Cross, Megaphone, FileText, Upload,
  Rocket, CheckCircle2, AlertTriangle, Lock, ChevronRight, PlayCircle,
  ClipboardCheck, LayoutList, ArrowRight, History, Sparkles,
} from 'lucide-react'
import { PageHead, Segmented, Skeleton, EmptyState, KpiTile } from '@/components/preone/ui'
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
  graph: { key: string; label: string; applicability: string; status: string; deps: { key: string; label: string; status: string }[] }[]
}

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
  const [tab, setTab] = useState<'steps' | 'validation' | 'summary'>('steps')
  const [validation, setValidation] = useState<ValidationPayload | null>(null)
  const [validating, setValidating] = useState(false)
  const [deps, setDeps] = useState<DepsPayload | null>(null)
  const [depOpen, setDepOpen] = useState(false)
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const j = await fetch('/api/v1/setup/status').then((r) => r.json())
    if (j.success) setStatus(j.data)
  }, [])
  useEffect(() => { Promise.resolve().then(load) }, [load])

  const loadDeps = useCallback(async () => {
    const j = await fetch('/api/v1/setup/dependencies').then((r) => r.json())
    if (j.success) setDeps(j.data)
  }, [])

  const runValidation = async () => {
    setValidating(true)
    const j = await fetch('/api/v1/setup/validate', { method: 'POST' }).then((r) => r.json())
    setValidating(false)
    if (j.success) { setValidation(j.data); setTab('validation'); toast.success('Validation complete', `Overall: ${j.data.overall}`) }
    else toast.error('Validation failed', j.error?.message)
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
  const mandatoryLeft = useMemo(
    () => status?.steps.filter((s) => s.applicability === 'MANDATORY' && (s.status === 'PENDING' || s.status === 'BLOCKED')).length ?? 0,
    [status]
  )

  if (status === null) {
    return (
      <>
        <PageHead title="Preschool Setup" sub="From empty tenant to fully operational PreOne preschool" />
        <div className="card"><div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <Skeleton h={28} /><Skeleton h={16} /><Skeleton h={16} /><Skeleton h={120} />
        </div></div>
      </>
    )
  }

  const badge = SETUP_BADGE[status.status] ?? SETUP_BADGE.NOT_STARTED
  const canGoLive = status.status === 'READY_FOR_REVIEW' || status.status === 'READY_FOR_GO_LIVE' || status.status === 'LIVE'

  return (
    <>
      <PageHead
        title="Preschool Setup"
        sub="Take this school from empty tenant to fully operational — configuration flows into every module"
        actions={
          <>
            <button className="btn btn-outline" onClick={() => { setDepOpen(true); if (!deps) loadDeps() }}>
              <LayoutList size={15} /> View Dependencies
            </button>
            {nextStep && (
              <a className="btn btn-primary" href={`/app/setup/${nextStep.key}`}>
                <PlayCircle size={15} /> Continue Setup <ChevronRight size={14} />
              </a>
            )}
          </>
        }
      />

      {/* ── progress banner ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="kpi-ic ic-violet"><Rocket size={20} /></div>
            <div>
              <div className="card-title">School Setup <span className={`badge ${badge.cls}`} style={{ marginLeft: 8 }}>{badge.label}</span></div>
              <div className="card-sub">
                {status.status === 'LIVE'
                  ? `Live since ${status.goLiveAt ? new Date(status.goLiveAt).toLocaleDateString() : '—'} — configuration remains editable`
                  : mandatoryLeft === 0
                    ? 'All mandatory configuration complete — validate and go live'
                    : `${mandatoryLeft} mandatory step${mandatoryLeft === 1 ? '' : 's'} remaining`}
              </div>
            </div>
          </div>
          <div style={{ minWidth: 260, flex: 1, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              <span>Setup progress</span><span>{status.progress}%</span>
            </div>
            <div className="progressbar"><div style={{ width: `${status.progress}%` }} /></div>
          </div>
        </div>
      </div>

      {/* ── guidance feed ── */}
      {status.guidance.length > 0 && status.status !== 'LIVE' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><div><div className="card-title">Guidance</div><div className="card-sub">Proactive next-step hints</div></div><Sparkles size={18} className="t-muted" /></div>
          <div style={{ display: 'grid', gap: 8 }}>
            {status.guidance.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
                {g.level === 'warning'
                  ? <AlertTriangle size={15} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                  : <ArrowRight size={15} style={{ color: 'var(--preone-primary)', flexShrink: 0, marginTop: 1 }} />}
                <span>{g.message}</span>
                <a href={`/app/setup/${g.stepKey}`} className="cell-link" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Fix now</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="kpi-row" style={{ marginBottom: 16 }}>
        <KpiTile label="Progress" value={`${status.progress}%`} icon={<Rocket size={18} />} iconClass="ic-violet" />
        <KpiTile label="Completed steps" value={`${status.steps.filter((s) => s.status === 'COMPLETE').length}/${status.steps.length}`} icon={<CheckCircle2 size={18} />} iconClass="ic-green" />
        <KpiTile label="Mandatory remaining" value={String(mandatoryLeft)} icon={<AlertTriangle size={18} />} iconClass={mandatoryLeft ? 'ic-orange' : 'ic-green'} />
        <KpiTile label="Blocked" value={String(status.steps.filter((s) => s.status === 'BLOCKED').length)} icon={<Lock size={18} />} iconClass={status.steps.some((s) => s.status === 'BLOCKED') ? 'ic-red' : 'ic-green'} />
      </div>

      {/* ── tabs ── */}
      <Segmented
        value={tab}
        onChange={(v) => {
          setTab(v as typeof tab)
          if (v === 'summary' && !deps) loadDeps()
        }}
        options={[
          { key: 'steps', label: 'Setup Steps' },
          { key: 'validation', label: 'Validation' },
          { key: 'summary', label: 'Summary' },
        ]}
      />

      {/* ── STEPS ── */}
      {tab === 'steps' && (
        <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
          {PHASES.map((phase) => {
            const rows = status.steps.filter((s) => s.phase === phase.key)
            if (!rows.length) return null
            return (
              <div className="card" key={phase.key}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{phase.label}</div>
                    <div className="card-sub">{phase.sub} — {rows.filter((r) => r.status === 'COMPLETE' || r.status === 'SKIPPED').length}/{rows.length} done</div>
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
                            {s.changedAfterCompletion && <span className="badge b-orange">edited after completion</span>}
                          </div>
                          <div className="card-sub" style={{ marginTop: 2 }}>
                            {s.status === 'BLOCKED'
                              ? s.blockedReason
                              : s.status === 'COMPLETE'
                                ? `${s.detail}${s.completedByName ? ` — by ${s.completedByName}` : ''}`
                                : s.detail || s.description}
                          </div>
                          {s.status === 'BLOCKED' && s.missingDeps.length > 0 && (
                            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: 'var(--foreground-secondary)', alignSelf: 'center' }}>Missing:</span>
                              {s.missingDeps.map((d) => (
                                <a key={d.key} href={`/app/setup/${d.key}`} className="badge b-warning">✗ {d.label}</a>
                              ))}
                            </div>
                          )}
                          <div className="t-caption" style={{ marginTop: 3 }}>
                            {s.completedAt ? `Completed ${new Date(s.completedAt).toLocaleDateString()} · checked ${new Date(s.lastCheckedAt).toLocaleTimeString()}` : `Checked ${new Date(s.lastCheckedAt).toLocaleTimeString()}`}
                          </div>
                        </div>
                        {s.locked && s.status !== 'COMPLETE' && s.status !== 'SKIPPED' && (
                          <span className="badge b-neutral" title="Complete earlier steps first"><Lock size={11} /></span>
                        )}
                        {!s.locked || s.status === 'COMPLETE' ? (
                          <a className={`btn btn-sm ${s.status === 'COMPLETE' ? 'btn-outline' : 'btn-primary'}`} href={`/app/setup/${s.key}`}>
                            {s.status === 'COMPLETE' ? 'Review' : s.status === 'SKIPPED' ? 'Configure' : 'Continue'}
                            <ChevronRight size={13} />
                          </a>
                        ) : <span style={{ width: 8 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* validation / go-live band */}
          <div className="card" style={{ borderColor: 'var(--preone-primary)', borderWidth: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="kpi-ic ic-violet"><ClipboardCheck size={20} /></div>
                <div>
                  <div className="card-title">Ready to go live?</div>
                  <div className="card-sub">Run automated validation across 15 categories, resolve blockers, then go live.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={runValidation} disabled={validating}>
                  <ClipboardCheck size={15} /> {validating ? 'Validating…' : 'Run Validation'}
                </button>
                <button className={`btn btn-primary ${canGoLive ? '' : 'is-disabled'}`} disabled={!canGoLive || busy} onClick={() => setGoLiveOpen(true)}>
                  <Rocket size={15} /> Go Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VALIDATION ── */}
      {tab === 'validation' && (
        <div style={{ marginTop: 14 }}>
          {!validation ? (
            <div className="card">
              <EmptyState
                icon={<ClipboardCheck size={40} />}
                title="No validation run yet"
                message="Run the setup validation engine to check all 15 readiness categories — Identity, Branch, RBAC, Academic, Finance and more."
              />
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 18, marginTop: -6 }}>
                <button className="btn btn-primary" onClick={runValidation} disabled={validating}>
                  <ClipboardCheck size={15} /> {validating ? 'Validating…' : 'Run Validation'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`badge ${CAT_BADGE[validation.overall]}`} style={{ fontSize: 13, padding: '6px 12px' }}>
                  Overall: {validation.overall}
                </span>
                <span className="card-sub">
                  {validation.categories.filter((c) => c.status === 'BLOCKED').length} blocked · {validation.categories.filter((c) => c.status === 'WARNING').length} warnings · {validation.categories.filter((c) => c.status === 'PASS').length} passed
                </span>
                <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={runValidation} disabled={validating}>
                  {validating ? 'Validating…' : 'Re-run'}
                </button>
                {validation.overall !== 'BLOCKED' && status.status !== 'LIVE' && (
                  <button className="btn btn-primary btn-sm" onClick={goLive} disabled={busy}>
                    <Rocket size={14} /> Go Live
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {validation.categories.map((c) => (
                  <div className="card" key={c.key}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="card-title" style={{ fontSize: 14 }}>{c.label}</div>
                      <span className={`badge ${CAT_BADGE[c.status]}`}>{c.status}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 5 }}>
                      {c.findings.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12.5, alignItems: 'flex-start' }}>
                          <span>{f.status === 'BLOCKED' ? '✗' : f.status === 'WARNING' ? '△' : '✓'}</span>
                          <span style={{ color: f.status === 'PASS' ? 'var(--foreground-secondary)' : undefined }}>{f.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SUMMARY ── */}
      {tab === 'summary' && (
        <div style={{ marginTop: 14 }}>
          {!deps ? <Skeleton h={200} /> : (
            <>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-head">
                  <div><div className="card-title">Setup Summary</div><div className="card-sub">What has been configured — click any step to edit</div></div>
                  <button className="btn btn-outline btn-sm" onClick={() => setDepOpen(true)}><LayoutList size={14} /> Dependencies</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'School', value: deps.summary.school.name?.name ?? '—' },
                    { label: 'Branches', value: deps.summary.branches },
                    { label: 'Programs', value: deps.summary.programs },
                    { label: 'Academic Years', value: deps.summary.academicYears },
                    { label: 'Classes', value: deps.summary.classes },
                    { label: 'Staff', value: deps.summary.staff },
                    { label: 'Calendar Events', value: deps.summary.calendarEvents },
                    { label: 'Fee Plans', value: deps.summary.feePlans },
                    { label: 'Students', value: deps.summary.students },
                  ].map((x) => (
                    <div key={x.label} className="stat-mini">
                      <div className="stat-mini-val" style={{ fontSize: 16, fontWeight: 700 }}>{x.value}</div>
                      <div className="stat-mini-label">{x.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* dependency graph modal */}
      <Modal open={depOpen} onClose={() => setDepOpen(false)} title="Setup Dependency Graph" subtitle="What blocks what — the M00 dependency engine" icon={<LayoutList size={22} />} wide>
        {!deps ? <Skeleton h={300} /> : (
          <div style={{ display: 'grid', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
            {deps.graph.map((g) => (
              <div key={g.key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{g.label}</span>
                  <span className={`badge ${STEP_BADGE[g.status]?.cls ?? 'b-neutral'}`}>{g.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--foreground-secondary)' }}>
                    {g.deps.length === 0 ? 'no dependencies' : `requires: ${g.deps.map((d) => d.label).join(', ')}`}
                  </span>
                </div>
                {g.blockedBy.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--danger)' }}>
                    Why blocked: needs {g.blockedBy.map((b) => b.label).join(' and ')} completed first.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* go-live confirm */}
      <Modal open={goLiveOpen} onClose={() => setGoLiveOpen(false)} title="Go Live" icon={<Rocket size={22} />} iconClass="ic-violet">
        <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          This marks the preschool as <b>LIVE</b> and makes the normal operational dashboard the primary landing page.
          Setup remains available for future configuration, and every change stays audited.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--foreground-secondary)' }}>
          A final GO_LIVE_CHECK validation will run automatically — go-live is denied if any category is BLOCKED.
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
