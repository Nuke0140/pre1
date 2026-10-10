'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Plus, Lock, RotateCcw, RotateCw, Save,
  UserPlus, CalendarPlus, Trash2, Building2, Upload, Users, Settings2,
  Blocks, CalendarDays, DoorOpen, GraduationCap, LayoutGrid, IndianRupee, Edit3, Edit, Power, Check, BookOpen,
  ArrowUpRight, ShieldCheck,
} from 'lucide-react'
import { PageHead, Skeleton, EmptyState, StatusBadge } from '@/components/preone/ui'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import { CONFIG_FORMS, type FormField, type DomainForm } from '@/lib/setup/step-forms'
import { STEP_MAP } from '@/lib/setup/steps'
import { ROLE_META, type CanonicalRole } from '@/lib/roles'

const CANONICAL_SETUP_STAFF_ROLES: CanonicalRole[] = [
  'PRINCIPAL',
  'COORDINATOR',
  'TEACHER',
  'STAFF',
  'ACCOUNTS',
  'RECEPTIONIST',
  'DRIVER',
  'ATTENDANT',
]

interface StepRow {
  key: string; label: string; status: 'PENDING' | 'COMPLETE' | 'BLOCKED' | 'SKIPPED'
  applicability: string; detail: string; blockedReason: string | null
  missingDeps: { key: string; label: string }[]; locked: boolean
  completedByName: string | null; completedAt: string | null; changedAfterCompletion: boolean
}
interface StatusPayload { status: string; progress: number; steps: StepRow[]; nextStepKey: string | null }

type Dict = Record<string, unknown>

/** stepKey → SchoolConfig domain (names differ by design — steps are UX, domains are storage) */
const CONFIG_STEP_DOMAIN: Record<string, string> = {
  operating_config: 'OPERATING',
  admission_config: 'ADMISSION',
  student_parent: 'STUDENT_PARENT',
  daily_operations: 'DAILY_OPERATIONS',
  health_settings: 'HEALTH_SAFETY',
  health_safety: 'HEALTH_SAFETY',
  curriculum: 'CURRICULUM',
  communication: 'COMMUNICATION',
  templates: 'DOCUMENT_TEMPLATES',
  documents: 'DOCUMENT_TEMPLATES',
  branding: 'BRANDING',
  mood_environment: 'MOOD_ENVIRONMENT',
  promotion: 'PROMOTION',
}

/* ────────────────────────── generic field renderer ────────────────────────── */
function FieldInput({ f, value, onChange }: { f: FormField; value: unknown; onChange: (v: unknown) => void }) {
  if (f.type === 'checklist') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(f.options ?? []).map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              type="button" key={opt}
              className={`badge ${on ? 'b-primary' : 'b-neutral'}`}
              style={{ cursor: 'pointer', padding: '5px 10px', border: '1px solid transparent' }}
              onClick={() => onChange(on ? selected.filter((x) => x !== opt) : [...selected, opt])}
            >{on ? '✓ ' : ''}{opt.replaceAll('_', ' ').toLowerCase()}</button>
          )
        })}
      </div>
    )
  }
  if (f.type === 'list') {
    return (
      <textarea
        className="textarea" rows={3} value={Array.isArray(value) ? (value as string[]).join('\n') : String(value ?? '')}
        onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        placeholder="One per line"
      />
    )
  }
  if (f.type === 'checkbox') {
    return (
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        Enabled
      </label>
    )
  }
  if (f.type === 'select') {
    return (
      <select className="select" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {(f.options ?? []).map((o) => <option key={o} value={o}>{o.replaceAll('_', ' ')}</option>)}
      </select>
    )
  }
  const typeMap: Record<string, string> = { text: 'text', number: 'number', date: 'date', time: 'time', color: 'color' }
  return (
    <input
      className="input" type={typeMap[f.type] ?? 'text'}
      value={String(value ?? '')} onChange={(e) => onChange(f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
    />
  )
}

function ConfigForm({ form, data, setData }: { form: DomainForm; data: Dict; setData: (d: Dict) => void }) {
  const set = (k: string, v: unknown) => setData({ ...data, [k]: v })
  return (
    <div className="form-grid">
      {form.fields.map((f) => {
        const value = data[f.key] !== undefined ? data[f.key] : form.defaults[f.key]
        return (
          <div className="field" key={f.key} style={f.full ? { gridColumn: '1 / -1' } : undefined}>
            <label>{f.label} {f.required && <span className="req">*</span>}</label>
            <FieldInput f={f} value={value} onChange={(v) => set(f.key, v)} />
            {f.help && <div className="helper">{f.help}</div>}
          </div>
        )
      })}
    </div>
  )
}

type ApiFn = (url: string, method: string, body?: unknown) => Promise<any>
type ToastFn = { success: (t: string, s?: string) => void; error: (t: string, s?: string) => void; info: (t: string, s?: string) => void; warning: (t: string, s?: string) => void }

function TableToolbar({ title, count, onAdd, addLabel, icon }: { title: string; count: number; onAdd?: () => void; addLabel?: string; icon?: React.ReactNode }) {
  return (
    <div className="table-toolbar" style={{ marginBottom: 10 }}>
      <div className="card-title">{icon}{title} <span className="badge b-neutral">{count}</span></div>
      {onAdd && addLabel && <button className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={14} /> {addLabel}</button>}
    </div>
  )
}

function FooterActions({ busy, onSaveDraft, onComplete, completeLabel = 'Save & Continue', showDraft = true }: {
  busy: boolean; onSaveDraft: () => void; onComplete: () => void; completeLabel?: string; showDraft?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
      {showDraft && (
        <button className="btn btn-outline" onClick={onSaveDraft} disabled={busy}><Save size={15} /> Save as Draft</button>
      )}
      <button className="btn btn-primary" onClick={onComplete} disabled={busy}>
        <CheckCircle2 size={15} /> {busy ? 'Saving…' : completeLabel}
      </button>
    </div>
  )
}

/* ────────────────────────── main page ────────────────────────── */
export default function SetupStepPage() {
  const params = useParams<{ step: string }>()
  const router = useRouter()
  const toast = useToast()
  const stepKey = params.step
  const def = STEP_MAP[stepKey]

  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [me, setMe] = useState<StepRow | null>(null)
  const [payload, setPayload] = useState<Dict | Dict[] | null>(null)
  const [configData, setConfigData] = useState<Dict | null>(null)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<Dict | null>(null)
  const [editType, setEditType] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const kind = useMemo(() => {
    if (!def) return 'unknown'
    if (def.key === 'school_profile') return 'profile'
    if (def.key === 'branding') return 'branding'
    if (CONFIG_STEP_DOMAIN[def.key]) return 'config'
    switch (def.key) {
      case 'branch': return 'branches'
      case 'programs': return 'programs'
      case 'roles': return 'roles'
      case 'academic_year': return 'years'
      case 'classroom': return 'classes'
      case 'classes_sections': return 'classes'
      case 'subject': return 'subjects'
      case 'fees_setup': return 'fees'
      case 'fees': return 'fees'
      case 'infrastructure': return 'infrastructure'
      case 'staff': return 'staff'
      case 'teacher_assignment': return 'teachers'
      case 'calendar': return 'calendar'
      case 'data_import': return 'import'
      default: return 'unknown'
    }
  }, [def])
  const configDomain = def ? (CONFIG_STEP_DOMAIN[def.key] ?? '') : ''

  const api: ApiFn = useCallback(async (url, method, body) => {
    return fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => r.json())
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const j = await fetch('/api/v1/setup/status', { cache: 'no-store' }).then((r) => r.json())
      if (j.success) {
        setStatus(j.data)
        setMe(j.data.steps.find((s: StepRow) => s.key === stepKey) ?? null)
      }
    } catch (e: any) {
      console.error('Failed to load setup status', e)
    }
  }, [stepKey])

  const loadBody = useCallback(async () => {
    const urls: Record<string, string> = {
      profile: '/api/v1/setup/school-profile',
      branches: '/api/v1/branches',
      programs: '/api/v1/programs',
      infrastructure: '/api/v1/classrooms',
      roles: '/api/v1/users',
      staff: '/api/v1/staff',
      years: '/api/v1/academic-years',
      classes: '/api/v1/classrooms',
      teachers: '/api/v1/classrooms',
      calendar: '/api/v1/calendar',
      fees: '/api/v1/programs',
      subjects: '/api/v1/subjects',
    }
    const url = kind === 'config' || kind === 'branding' ? `/api/v1/setup/config/${configDomain}` : urls[kind]
    if (!url) return
    try {
      const j = await fetch(url, { cache: 'no-store' }).then((r) => r.json())
      if (j.success) {
        if (kind === 'config' || kind === 'branding') {
          // seed the form with schema defaults so a first-time Save persists sensible values
          const formKey = kind === 'branding' ? 'BRANDING' : configDomain
          const defaults = CONFIG_FORMS[formKey]?.defaults ?? {}
          setConfigData({ ...defaults, ...((j.data.data as Dict) ?? {}) })
        } else setPayload(j.data as Dict[])
      }
    } catch (e: any) {
      console.error('Failed to load step body', e)
    }
  }, [kind, configDomain])

  useEffect(() => { Promise.resolve().then(loadStatus); Promise.resolve().then(loadBody) }, [loadStatus, loadBody])

  const refreshAll = useCallback(async () => {
    setReloading(true)
    await Promise.all([loadStatus(), loadBody()])
    setReloadTrigger((p) => p + 1)
    setReloading(false)
  }, [loadStatus, loadBody])

  const saveConfig = async (): Promise<boolean> => {
    if (kind === 'config') {
      const j = await api(`/api/v1/setup/config/${configDomain}`, 'PUT', configData ?? {})
      if (!j.success) { toast.error('Save failed', j.error?.message); return false }
      toast.success('Configuration saved')
      return true
    }
    if (kind === 'branding') {
      const logo = (configData?.logoUrl as string) ?? null
      const p1 = await api('/api/v1/setup/school-profile', 'PATCH', { logoUrl: logo })
      if (!p1.success) { toast.error('Logo save failed', p1.error?.message); return false }
      const { logoUrl, ...brand } = configData ?? {}
      const p2 = await api('/api/v1/setup/config/BRANDING', 'PUT', brand)
      if (!p2.success) { toast.error('Branding save failed', p2.error?.message); return false }
      toast.success('Branding saved')
      return true
    }
    if (kind === 'profile') {
      const j = await api('/api/v1/setup/school-profile', 'PATCH', payload ?? {})
      if (!j.success) { toast.error('Save failed', j.error?.message); return false }
      toast.success('School profile saved')
      return true
    }
    return true
  }

  const completeStep = async (thenNav = true) => {
    setSaving(true)
    const saved = await saveConfig()
    if (!saved) { setSaving(false); return }
    const j = await api(`/api/v1/setup/steps/${stepKey}`, 'POST', { action: 'complete' })
    setSaving(false)
    if (j.success) {
      toast.success('Step complete', j.data?.message)
      const fresh = await fetch('/api/v1/setup/status').then((r) => r.json())
      if (fresh.success) {
        const next = fresh.data.nextStepKey as string | null
        if (thenNav && next) router.push(next === 'branding' ? '/app/setup/branding' : `/app/setup/${next}`)
        else if (thenNav) router.push('/app/setup')
        else loadStatus()
      }
    } else {
      toast.error('Cannot complete yet', [j.error?.message, j.error?.details].filter(Boolean).join(' — '))
    }
  }

  const skipStep = async () => {
    const j = await api(`/api/v1/setup/steps/${stepKey}`, 'POST', { action: 'skip' })
    if (j.success) { toast.info('Step skipped', j.data?.message); router.push('/app/setup') }
    else toast.error('Cannot skip', j.error?.message)
  }

  const reopenStep = async () => {
    const j = await api(`/api/v1/setup/steps/${stepKey}`, 'POST', { action: 'reopen' })
    if (j.success) { toast.info('Reopened', 'Configure again, then mark complete'); loadStatus() }
    else toast.error('Cannot reopen', j.error?.message)
  }

  if (!def) {
    return <EmptyState icon={<AlertTriangle size={40} />} title="Unknown setup step" message={`No setup step "${stepKey}" exists.`} />
  }
  if (status === null) {
    return <><PageHead title={def.label} sub={def.description} /><div className="card"><div style={{ padding: 16 }}><Skeleton h={200} /></div></div></>
  }

  const isOptional = def.applicability !== 'MANDATORY'
  const displayStatus = me?.status === 'BLOCKED' ? 'PENDING' : (me?.status ?? 'PENDING')
  const statusBadgeCls: Record<string, string> = { COMPLETE: 'b-success', PENDING: 'b-info', BLOCKED: 'b-danger', SKIPPED: 'b-neutral' }
  const list = Array.isArray(payload) ? payload : []

  return (
    <>
      <PageHead
        breadcrumbs={[
          { label: 'Home', href: '/app' },
          { label: 'Setup', href: '/app/setup' },
          { label: def.label },
        ]}
        title={def.label}
        sub={def.description}
        actions={
          <>
            <a className="btn btn-ghost" href="/app/setup"><ArrowLeft size={15} /> Back to Setup</a>
            <button
              type="button"
              className="btn btn-outline"
              onClick={refreshAll}
              disabled={reloading}
              title="Reload live operational data and recalculate setup status"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCw size={14} className={reloading ? 'animate-spin' : ''} />
              <span>{reloading ? 'Reloading…' : 'Reload'}</span>
            </button>
            {me?.status !== 'COMPLETE' && isOptional && me?.status !== 'SKIPPED' && (
              <button className="btn btn-outline" onClick={skipStep}>Skip for now</button>
            )}
            {me?.status === 'COMPLETE' ? (
              <button className="btn btn-outline" onClick={reopenStep}><RotateCcw size={15} /> Reopen</button>
            ) : me?.status !== 'SKIPPED' && (
              <button className="btn btn-primary" onClick={() => completeStep(true)} disabled={saving}>
                <CheckCircle2 size={15} /> {saving ? 'Saving…' : 'Save & Continue'}
              </button>
            )}
          </>
        }
      />

      {/* status strip */}
      <div className="card" style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className={`badge ${statusBadgeCls[displayStatus]}`}>{displayStatus}</span>
        {me?.applicability !== 'MANDATORY' && <span className="badge b-neutral">{me?.applicability}</span>}
        {me?.changedAfterCompletion && <span className="badge b-orange">edited after completion</span>}
        <span className="card-sub" style={{ flex: 1 }}>{me?.detail || def.description}</span>
        {me?.completedByName && <span className="t-caption">completed by {me.completedByName}</span>}
      </div>

      {/* prerequisite notice if dependencies pending */}
      {me?.missingDeps && me.missingDeps.length > 0 && me?.status !== 'COMPLETE' && (
        <div className="card" style={{ borderColor: 'var(--border-subtle)', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Lock size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>Prerequisite Steps Pending</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{me?.blockedReason ?? 'You can configure this step now. Marking it complete will verify prerequisite steps.'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {me.missingDeps.map((d) => (
                  <a key={d.key} className="btn btn-sm btn-outline" href={`/app/setup/${d.key}`}>
                    → {d.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY (Always accessible for editing) ── */}
      <div className="card">
        <div style={{ padding: 16 }}>
            {(kind === 'config' || kind === 'branding') && CONFIG_FORMS[configDomain] && (
              <>
                <p className="card-sub" style={{ marginBottom: 14 }}>{CONFIG_FORMS[configDomain].intro}</p>
                {kind === 'branding' && (
                  <div className="form-grid" style={{ marginBottom: 6 }}>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label>School logo URL</label>
                      <input className="input" value={String(configData?.logoUrl ?? '')} onChange={(e) => setConfigData({ ...configData, logoUrl: e.target.value })} placeholder="https://…/logo.png" />
                      <div className="helper">Shown on login, portals, receipts, certificates and documents.</div>
                    </div>
                  </div>
                )}
                <ConfigForm form={CONFIG_FORMS[configDomain]} data={configData ?? {}} setData={setConfigData} />
                <FooterActions
                  busy={saving}
                  onSaveDraft={async () => { if (await saveConfig()) toast.info('Draft saved', 'You can continue later') }}
                  onComplete={() => completeStep(true)}
                />
              </>
            )}

            {kind === 'profile' && payload && !Array.isArray(payload) && (
              <>
                <div className="form-grid">
                  {[
                    { k: 'name', label: 'School name', req: true }, { k: 'email', label: 'Email', req: true, t: 'email' },
                    { k: 'phone', label: 'Contact number', req: true }, { k: 'website', label: 'Website' },
                    { k: 'city', label: 'City', req: true }, { k: 'state', label: 'State' },
                    { k: 'pincode', label: 'Postal code' }, { k: 'timezone', label: 'Timezone' },
                    { k: 'locale', label: 'Default language' },
                  ].map((f) => (
                    <div className="field" key={f.k}>
                      <label>{f.label} {f.req && <span className="req">*</span>}</label>
                      <input className="input" type={f.t ?? 'text'} value={String(payload[f.k] ?? '')} onChange={(e) => setPayload({ ...payload, [f.k]: e.target.value })} />
                    </div>
                  ))}
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
                    <textarea className="textarea" rows={2} value={String(payload.address ?? '')} onChange={(e) => setPayload({ ...payload, address: e.target.value })} />
                  </div>
                </div>
                <p className="helper" style={{ marginTop: 8 }}>School identity propagates to branding, login, portals, communication, reports, certificates and documents.</p>
                <FooterActions
                  busy={saving}
                  onSaveDraft={async () => { if (await saveConfig()) toast.info('Draft saved') }}
                  onComplete={() => completeStep(true)}
                />
              </>
            )}

            {kind === 'branches' && (
              <>
                <TableToolbar title="Branches" count={list.length} onAdd={() => setModal('branch')} addLabel="Add Branch" />
                {list.length === 0 ? <EmptyState icon={<Building2 size={40} />} title="No branches configured yet" message="Add your first campus — classrooms, staff, students and operations all hang from a branch." /> : (
                  <div className="dtable-scroll"><table className="dtable">
                    <thead><tr><th>Branch</th><th>Capacity</th><th>Facilities</th><th>Staff</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{list.map((b: any) => (
                      <tr key={String(b.id)}>
                        <td><span className="cell-strong">{b.name}</span><span className="cell-sub">{b.code} · {b.city ?? '—'}</span></td>
                        <td>{b.capacity ? (b.capacity + ' seats') : 'Flexible'}</td>
                        <td>{String(b.facilities ?? 0)}</td>
                        <td>{String(b.staff ?? 0)}</td>
                        <td><StatusBadge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditItem(b); setEditType('branch'); }} title="Edit branch details">
                            <Edit3 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </>
            )}

            {kind === 'programs' && (
              <>
                <TableToolbar title="Master Programs" count={list.length} onAdd={() => setModal('program')} addLabel="Add Program" />
                {list.length === 0 ? <EmptyState icon={<Blocks size={40} />} title="No programs configured" message="Define the master programs your preschool runs — Playgroup, Nursery, Jr KG, Sr KG, Daycare. Mappings below will make them operational across campuses." /> : (
                  <div className="dtable-scroll"><table className="dtable">
                    <thead><tr><th>Program</th><th>Age band</th><th>Master Capacity</th><th>Classes</th><th>Fee plan</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{list.map((p: any) => (
                      <tr key={String(p.id)}>
                        <td><span className="cell-strong">{p.name}</span><span className="cell-sub">{p.code} · {String(p.programType).toLowerCase()}</span></td>
                        <td>{p.ageMinMonths != null && p.ageMaxMonths != null ? (p.ageMinMonths + '–' + p.ageMaxMonths + ' mo') : 'Flexible'}</td>
                        <td>{p.capacity ? (p.capacity + ' seats') : '—'}</td>
                        <td>{String(p.classrooms ?? 0)}</td>
                        <td>{p.hasFeePlan ? <span className="badge b-success">linked</span> : <span className="badge b-warning">none</span>}</td>
                        <td><StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditItem(p); setEditType('program'); }} title="Edit program age and capacity">
                            <Edit3 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
                <ProgramCampusMappingSection programs={list} onDone={refreshAll} api={api} toast={toast} />
              </>
            )}

            {kind === 'roles' && (
              <>
                <p className="card-sub" style={{ marginBottom: 14 }}>PreOne uses one RBAC system. Members below already carry platform-enforced roles — invite more staff in Settings → Staff.</p>
                <div className="dtable-scroll"><table className="dtable">
                  <thead><tr><th>Member</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>{list.map((u: any) => (
                    <tr key={String(u.id)}>
                      <td><span className="cell-strong">{u.name}</span><span className="cell-sub">{u.email}</span></td>
                      <td><span className="badge b-primary">{String(u.role).replaceAll('_', ' ')}</span></td>
                      <td><StatusBadge status={String(u.status)} /></td>
                    </tr>
                  ))}</tbody>
                </table></div>
                <p className="helper" style={{ marginTop: 10 }}>This step completes automatically once the owner plus at least one operator account exist.</p>
              </>
            )}

            {kind === 'years' && (
              <>
                <TableToolbar title="Academic years" count={list.length} onAdd={() => setModal('year')} addLabel="Create Academic Year" />
                {list.length === 0 ? <EmptyState icon={<CalendarPlus size={40} />} title="No academic year exists" message="Create the operating year — enrolment, attendance, fees and reports all hang from it. Historical years stay queryable forever." /> : (
                  <div className="dtable-scroll"><table className="dtable">
                    <thead><tr><th>Year</th><th>Range</th><th>Classes</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{list.map((y: any) => (
                      <tr key={String(y.id)}>
                        <td><span className="cell-strong">{y.name}</span>{y.isCurrent && <span className="badge b-success" style={{ marginLeft: 6 }}>current</span>}</td>
                        <td>{new Date(String(y.startDate)).toLocaleDateString()} → {new Date(String(y.endDate)).toLocaleDateString()}</td>
                        <td>{String(y.classrooms ?? 0)}</td>
                        <td><StatusBadge status={String(y.status)} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => { setEditItem(y); setEditType('year'); }} title="Edit academic year dates">
                              <Edit3 size={13} /> Edit
                            </button>
                            {!y.isCurrent && (
                              <button className="btn btn-sm btn-outline" onClick={async () => {
                                const j = await api(`/api/v1/academic-years/${y.id}`, 'PATCH', { setStatusCurrent: true });
                                if (j.success) { toast.success('Current year set', String(y.name)); refreshAll() } else toast.error('Failed', j.error?.message)
                              }}>
                                Set current
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </>
            )}

            {kind === 'calendar' && (
              <>
                <TableToolbar title="Calendar events" count={list.length} onAdd={() => setModal('event')} addLabel="Add Event" />
                {list.length === 0 ? <EmptyState icon={<CalendarDays size={40} />} title="No calendar events" message="Add holidays, vacations, parent meetings, assessment periods and special days — attendance understands them." /> : (
                  <div className="dtable-scroll"><table className="dtable">
                    <thead><tr><th>Date</th><th>Type</th><th>Title</th><th></th></tr></thead>
                    <tbody>{list.map((e: any) => (
                      <tr key={String(e.id)}>
                        <td>{new Date(String(e.date)).toLocaleDateString()}</td>
                        <td><span className="badge b-info">{String(e.type).replaceAll('_', ' ')}</span></td>
                        <td><span className="cell-strong">{e.title}</span><span className="cell-sub">{e.notes ?? ''}</span></td>
                        <td><button className="btn btn-sm btn-ghost" onClick={async () => { const j = await api(`/api/v1/calendar/${e.id}`, 'DELETE'); if (j.success) { toast.info('Removed'); refreshAll() } else toast.error('Failed', j.error?.message) }}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </>
            )}

            {kind === 'infrastructure' && <InfraSection rooms={list} onDone={refreshAll} onAddFacility={() => setModal('facility')} onEditFacility={(f) => { setEditItem(f); setEditType('facility'); }} onEditClass={(c) => { setEditItem(c); setEditType('class'); }} />}

            {kind === 'classes' && <ClassesSection rooms={list} onDone={refreshAll} onEditClass={(c) => { setEditItem(c); setEditType('class'); }} onAddClass={() => setModal('classroom')} />}

            {kind === 'subjects' && (
              <>
                <TableToolbar title="Subjects & Learning Areas" count={list.length} icon={<BookOpen size={14} style={{ marginRight: 6, verticalAlign: -2 }} />} onAdd={() => setModal('subject')} addLabel="Add Subject" />
                <p className="helper" style={{ marginBottom: 10 }}>Configure core and activity learning areas (e.g. Literacy, Numeracy, Motor Skills) and map them to programs.</p>
                {list.length === 0 ? (
                  <EmptyState icon={<BookOpen size={40} />} title="No subjects configured" message="Add early learning areas and subjects. These link to programs and classroom observations." />
                ) : (
                  <div className="dtable-scroll"><table className="dtable">
                    <thead><tr><th>Subject</th><th>Type</th><th>Programs Mapped</th><th>Classes</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{list.map((s: any) => (
                      <tr key={String(s.id)}>
                        <td><span className="cell-strong">{s.name}</span><span className="cell-sub">{s.code}</span></td>
                        <td><span className={`badge ${s.type === 'CORE' ? 'b-primary' : s.type === 'OPTIONAL' ? 'b-info' : 'b-neutral'}`}>{s.type}</span></td>
                        <td>
                          {s.programSubjects && s.programSubjects.length > 0 ? (
                            <span className="badge b-success">{s.programSubjects.map((ps: any) => ps.program?.name ?? ps.programId).join(', ')}</span>
                          ) : (
                            <span className="badge b-warning">Unmapped</span>
                          )}
                        </td>
                        <td>{String(s.classroomCount ?? 0)}</td>
                        <td><StatusBadge status={s.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => { setEditItem(s); setEditType('subject'); }} title="Edit subject">
                            <Edit3 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </>
            )}

            {kind === 'teachers' && <TeachersSection rooms={list} onDone={refreshAll} />}

            {kind === 'staff' && <StaffSection staff={list} onDone={refreshAll} onAdd={() => setModal('staff')} onEditStaff={(s) => { setEditItem(s); setEditType('staff'); }} />}

            {kind === 'fees' && (
              <FeeSetupSection onDone={refreshAll} api={api} toast={toast} refreshTrigger={reloadTrigger} />
            )}

            {kind === 'import' && (
              <StudentImportSection api={api} toast={toast} onDone={refreshAll} />
            )}

            {kind === 'unknown' && <EmptyState icon={<Settings2 size={40} />} title="Nothing to configure" message="This step completes from your existing data — mark it complete below." />}

            {/* footer complete for non-form kinds */}
            {kind !== 'config' && kind !== 'branding' && kind !== 'profile' && me?.status !== 'COMPLETE' && me?.status !== 'SKIPPED' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <span className="helper" style={{ marginRight: 'auto' }}>Completion is verified against your real data — this records who completed the step and when.</span>
                <button className="btn btn-primary" onClick={() => completeStep(true)} disabled={saving}><CheckCircle2 size={15} /> Mark Step Complete</button>
              </div>
            )}
          </div>
        </div>

      {/* ── MODALS (rendered from parent with real api/toast) ── */}
      {modal === 'branch' && <BranchModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'program' && <ProgramModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'subject' && <SubjectModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'year' && <YearModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'event' && <EventModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'classroom' && <ClassroomModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'facility' && <FacilityModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}
      {modal === 'staff' && <StaffModal onClose={() => setModal(null)} onDone={refreshAll} api={api} toast={toast} />}

      {/* ── EDIT MODALS (In-Place Row-Level Editing) ── */}
      {editType === 'branch' && editItem && (
        <EditBranchModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
      {editType === 'program' && editItem && (
        <EditProgramModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
      {editType === 'subject' && editItem && (
        <EditSubjectModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
      {editType === 'year' && editItem && (
        <EditYearModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
      {editType === 'class' && editItem && (
        <EditClassModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
      {editType === 'facility' && editItem && (
        <EditFacilityModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
      {editType === 'staff' && editItem && (
        <EditStaffModal item={editItem} onClose={() => { setEditType(null); setEditItem(null); }} onDone={refreshAll} api={api} toast={toast} />
      )}
    </>
  )
}

/* ────────────────────────── section components ────────────────────────── */
function InfraSection({ rooms, onDone, onAddFacility, onEditFacility, onEditClass }: { rooms: Dict[]; onDone: () => void; onAddFacility: () => void; onEditFacility: (f: Dict) => void; onEditClass: (c: Dict) => void }) {
  const [facilities, setFacilities] = useState<Dict[] | null>(null)
  const loadF = useCallback(async () => { const j = await fetch('/api/v1/facilities').then((r) => r.json()); if (j.success) setFacilities(j.data) }, [])
  useEffect(() => { Promise.resolve().then(loadF) }, [loadF])
  return (
    <>
      <TableToolbar title="Rooms (classrooms)" count={rooms.length} icon={<LayoutGrid size={14} style={{ marginRight: 6, verticalAlign: -2 }} />} />
      <p className="helper" style={{ marginBottom: 10 }}>Rooms are managed in <a href="/app/settings" className="cell-link">Settings → Classes</a> — every active room counts toward this step; other areas are registered here.</p>
      <div className="dtable-scroll"><table className="dtable">
        <thead><tr><th>Room</th><th>Program</th><th>Capacity</th><th>Teacher</th><th>Students</th><th>Actions</th></tr></thead>
        <tbody>{rooms.map((c: any) => (
          <tr key={String(c.id)}>
            <td><span className="cell-strong">{c.name}</span><span className="cell-sub">{c.code}</span></td>
            <td>{c.programName ?? String(c.programType).toLowerCase()}</td>
            <td>{String(c.capacity)}</td>
            <td>{c.teacher ?? <span className="badge b-warning">unassigned</span>}</td>
            <td>{String(c.students)}</td>
            <td>
              <button className="btn btn-sm btn-outline" onClick={() => onEditClass(c)} title="Edit room capacity and teacher">
                <Edit3 size={13} /> Edit
              </button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
      <div className="table-toolbar" style={{ margin: '16px 0 10px' }}>
        <div className="card-title">Other facilities <span className="badge b-neutral">{facilities?.length ?? '…'}</span></div>
        <button className="btn btn-primary btn-sm" onClick={onAddFacility}><Plus size={14} /> Register Facility</button>
      </div>
      {facilities !== null && facilities.length === 0 ? (
        <EmptyState icon={<DoorOpen size={36} />} title="No play / nap / meal areas yet" message="Recommended: register activity, play, nap, meal areas, washrooms and a medical room for daily operations and safety." />
      ) : (
        <div className="dtable-scroll"><table className="dtable">
          <thead><tr><th>Facility</th><th>Type</th><th>Branch</th><th>Capacity</th><th>Actions</th></tr></thead>
          <tbody>{(facilities ?? []).map((f: any) => (
            <tr key={String(f.id)}>
              <td><span className="cell-strong">{f.name}</span><span className="cell-sub">{f.code}</span></td>
              <td><span className="badge b-info">{String(f.type).replaceAll('_', ' ')}</span></td>
              <td>{f.branchName}</td>
              <td>{f.capacity ?? '—'}</td>
              <td>
                <button className="btn btn-sm btn-outline" onClick={() => onEditFacility(f)} title="Edit facility details">
                  <Edit3 size={13} /> Edit
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  )
}

function ClassesSection({ rooms, onDone, onEditClass, onAddClass }: { rooms: Dict[]; onDone: () => void; onEditClass: (c: Dict) => void; onAddClass: () => void }) {
  const toast = useToast()
  const [programs, setPrograms] = useState<Dict[]>([])
  useEffect(() => { fetch('/api/v1/programs').then((r) => r.json()).then((j) => { if (j.success) setPrograms(j.data) }) }, [])
  const link = async (id: string, programId: string) => {
    const j = await fetch(`/api/v1/classrooms/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programId: programId || null }) }).then((r) => r.json())
    if (j.success) { toast.success('Program linked'); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <>
      <TableToolbar title="Class-sections (current year)" count={rooms.length} icon={<LayoutGrid size={14} style={{ marginRight: 6, verticalAlign: -2 }} />} onAdd={onAddClass} addLabel="Add Classroom" />
      <p className="helper" style={{ marginBottom: 10 }}>New classes are added in <a href="/app/settings" className="cell-link">Settings → Classes</a>. Here you link each class-section to its program — capacity guards prevent over-allocation.</p>
      <div className="dtable-scroll"><table className="dtable">
        <thead><tr><th>Class</th><th>Linked program</th><th>Capacity</th><th>Teacher</th><th>Students</th><th>Link program</th><th>Actions</th></tr></thead>
        <tbody>{rooms.map((c: any) => (
          <tr key={String(c.id)}>
            <td><span className="cell-strong">{c.name}</span><span className="cell-sub">{c.code}</span></td>
            <td>{c.programName ?? <span className="badge b-warning">not linked</span>}</td>
            <td>{String(c.capacity)}</td>
            <td>{c.teacher ?? <span className="badge b-warning">unassigned</span>}</td>
            <td>{String(c.students)}</td>
            <td>
              <select className="select" style={{ maxWidth: 180 }} value={String(c.programId ?? '')} onChange={(e) => link(String(c.id), e.target.value)}>
                <option value="">— choose —</option>
                {programs.map((p: any) => <option key={String(p.id)} value={String(p.id)}>{p.name}</option>)}
              </select>
            </td>
            <td>
              <button className="btn btn-sm btn-outline" onClick={() => onEditClass(c)} title="Edit class settings">
                <Edit3 size={13} /> Edit
              </button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
      {rooms.length === 0 && <EmptyState icon={<LayoutGrid size={36} />} title="No classes for the current year" message="Add class-sections in Settings → Classes — each needs a program link and capacity." />}
    </>
  )
}

function TeachersSection({ rooms, onDone }: { rooms: Dict[]; onDone: () => void }) {
  const toast = useToast()
  const [members, setMembers] = useState<Dict[]>([])
  const [sel, setSel] = useState<Dict | null>(null)
  const [teacherId, setTeacherId] = useState('')
  useEffect(() => { fetch('/api/v1/users').then((r) => r.json()).then((j) => { if (j.success) setMembers(j.data) }) }, [])
  const unassigned = rooms.filter((c) => !c.primaryTeacherId).length
  const assign = async () => {
    if (!sel || !teacherId) return
    const j = await fetch(`/api/v1/classrooms/${sel.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryTeacherId: teacherId }) }).then((r) => r.json())
    if (j.success) { toast.success('Teacher assigned', sel.name as string); setSel(null); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <>
      <TableToolbar title="Teacher assignment" count={rooms.length} icon={<GraduationCap size={14} style={{ marginRight: 6, verticalAlign: -2 }} />} addLabel={`${unassigned} without teacher`} />
      <div className="dtable-scroll"><table className="dtable">
        <thead><tr><th>Class</th><th>Primary teacher</th><th></th></tr></thead>
        <tbody>{rooms.map((c: any) => (
          <tr key={String(c.id)}>
            <td><span className="cell-strong">{c.name}</span><span className="cell-sub">{c.code}</span></td>
            <td>{c.teacher ?? <span className="badge b-warning">unassigned</span>}</td>
            <td><button className="btn btn-sm btn-outline" onClick={() => { setSel(c); setTeacherId('') }}><UserPlus size={13} /> Assign</button></td>
          </tr>
        ))}</tbody>
      </table></div>
      {rooms.length === 0 && <EmptyState icon={<GraduationCap size={36} />} title="No classes to staff yet" message="Classes & Sections must be configured before teachers can be assigned." />}
      {sel && (
        <Modal open onClose={() => setSel(null)} title={`Assign teacher — ${sel.name}`} icon={<GraduationCap size={22} />} iconClass="ic-blue">
          <div className="form-grid">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Member <span className="req">*</span></label>
              <select className="select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Select member…</option>
                {members.map((u: any) => <option key={String(u.userId)} value={String(u.userId)}>{u.name} ({String(u.role).replaceAll('_', ' ')})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => setSel(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={assign} disabled={!teacherId}>Assign</button>
          </div>
        </Modal>
      )}
    </>
  )
}

function StaffSection({ staff, onDone, onAdd, onEditStaff }: { staff: Dict[]; onDone: () => void; onAdd: () => void; onEditStaff: (s: Dict) => void }) {
  const toast = useToast()
  const [branches, setBranches] = useState<Dict[]>([])
  useEffect(() => { fetch('/api/v1/branches').then((r) => r.json()).then((j) => { if (j.success) setBranches(j.data) }) }, [])
  const assign = async (id: string, branchId: string) => {
    const j = await fetch('/api/v1/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, branchId: branchId || null }) }).then((r) => r.json())
    if (j.success) { toast.success(branchId ? 'Branch assigned' : 'Assignment cleared'); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <>
      <TableToolbar title="Staff foundation" count={staff.length} icon={<Users size={14} style={{ marginRight: 6, verticalAlign: -2 }} />} onAdd={onAdd} addLabel="Add Staff" />
      {staff.length === 0 ? <EmptyState icon={<Users size={40} />} title="No staff yet" message="Create staff employment profiles — identity comes from their PreOne account, employment data lives here." /> : (
        <div className="dtable-scroll"><table className="dtable">
          <thead><tr><th>Staff</th><th>Role</th><th>Branch</th><th>Employment</th><th>Classes</th><th>Assign branch</th><th>Actions</th></tr></thead>
          <tbody>{staff.map((s: any) => (
            <tr key={String(s.id)}>
              <td><span className="cell-strong">{s.name}</span><span className="cell-sub">{s.employeeCode} · {s.email}</span></td>
              <td><span className="badge b-primary">{String(s.role ?? '—').replaceAll('_', ' ')}</span></td>
              <td>{s.branchName ?? <span className="badge b-warning">unassigned</span>}</td>
              <td><span className="cell-sub">{String(s.employmentType).toLowerCase()} · joined {s.joiningDate ? new Date(String(s.joiningDate)).toLocaleDateString() : '—'}</span></td>
              <td>{String(s.classesAssigned)}</td>
              <td>
                <select className="select" style={{ maxWidth: 160 }} value={String(s.branchId ?? '')} onChange={(e) => assign(String(s.id), e.target.value)}>
                  <option value="">— none —</option>
                  {branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name}</option>)}
                </select>
              </td>
              <td>
                <button className="btn btn-sm btn-outline" onClick={() => onEditStaff(s)} title="Edit staff profile">
                  <Edit3 size={13} /> Edit
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  )
}

function StudentImportSection({
  onDone,
  api,
  toast,
}: {
  onDone: () => void
  api: ApiFn
  toast: ToastFn
}) {
  const [branches, setBranches] = useState<Dict[]>([])
  const [programs, setPrograms] = useState<Dict[]>([])
  const [classrooms, setClassrooms] = useState<Dict[]>([])
  const [branchId, setBranchId] = useState<string>('')
  const [programId, setProgramId] = useState<string>('')
  const [classroomId, setClassroomId] = useState<string>('')
  const [csv, setCsv] = useState<string>('')
  const [preview, setPreview] = useState<Dict | null>(null)
  const [previewing, setPreviewing] = useState<boolean>(false)
  const [importing, setImporting] = useState<boolean>(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/branches').then((r) => r.json()),
      fetch('/api/v1/programs').then((r) => r.json()),
      fetch('/api/v1/classrooms').then((r) => r.json()),
    ]).then(([bRes, pRes, cRes]) => {
      if (bRes.success && Array.isArray(bRes.data)) {
        setBranches(bRes.data)
        if (bRes.data.length > 0) {
          const main = bRes.data.find((b: any) => b.isMain) || bRes.data[0]
          setBranchId(main.id)
        }
      }
      if (pRes.success && Array.isArray(pRes.data)) setPrograms(pRes.data)
      if (cRes.success && Array.isArray(cRes.data)) setClassrooms(cRes.data)
    }).catch((err) => console.error('Failed to load import context', err))
  }, [])

  // Filter programs offered at selected branch
  const availablePrograms = useMemo(() => {
    if (!branchId) return programs
    return programs.filter((p: any) => {
      if (!p.branchMappings || p.branchMappings.length === 0) return true
      return p.branchMappings.some((bm: any) => bm.branchId === branchId && bm.isActive)
    })
  }, [programs, branchId])

  // Filter classrooms at selected branch and program
  const availableClassrooms = useMemo(() => {
    return classrooms.filter((c: any) => {
      if (branchId && c.branchId && c.branchId !== branchId) return false
      if (programId && c.programId && c.programId !== programId) return false
      return true
    })
  }, [classrooms, branchId, programId])

  const loadSample = () => {
    const sample = `firstName,lastName,dob,gender,admissionNo,guardianName,guardianPhone,relationship\nAarav,Sharma,2022-04-12,MALE,IMP-001,Priya Sharma,9876543210,MOTHER\nDiya,Patel,2021-11-20,FEMALE,IMP-002,Kiran Patel,9876543211,FATHER\nVihaan,Deshmukh,2022-01-15,MALE,IMP-003,Sunita Deshmukh,9876543212,MOTHER`
    setCsv(sample)
    setPreview(null)
  }

  const handlePreview = async () => {
    if (!branchId) {
      toast.error('Branch Required', 'Please select a destination campus branch')
      return
    }
    if (!csv.trim()) {
      toast.error('CSV Required', 'Please enter or paste CSV data')
      return
    }
    setPreviewing(true)
    const payload = {
      mode: 'preview',
      csv,
      branchId,
      programId: programId || undefined,
      classroomId: classroomId || undefined,
    }
    const res = await api('/api/v1/setup/import/students', 'POST', payload)
    setPreviewing(false)
    if (res.success) {
      setPreview(res.data)
      toast.info('Validation complete', res.data.message)
    } else {
      toast.error('Preview failed', res.error?.message)
    }
  }

  const handleCommit = async () => {
    if (!branchId) {
      toast.error('Branch Required', 'Please select a destination campus branch')
      return
    }
    setImporting(true)
    const payload = {
      mode: 'commit',
      csv,
      branchId,
      programId: programId || undefined,
      classroomId: classroomId || undefined,
    }
    const res = await api('/api/v1/setup/import/students', 'POST', payload)
    setImporting(false)
    if (res.success) {
      toast.success('Import complete', res.data.message)
      setPreview(null)
      setCsv('')
      onDone()
    } else {
      toast.error('Import failed', res.error?.message)
    }
  }

  const selectedBranch = branches.find((b) => b.id === branchId)
  const selectedProg = programs.find((p) => p.id === programId)
  const selectedRoom = classrooms.find((c) => c.id === classroomId)

  return (
    <>
      <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Building2 size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>Destination Campus & Academic Target</span>
        </div>
        <p className="card-sub" style={{ marginBottom: 12 }}>
          Select the campus branch where newly imported students and guardians will be enrolled. Optionally choose an entry program and classroom.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div className="field">
            <label>Campus Branch <span className="req">*</span></label>
            <select
              className="select"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value)
                setProgramId('')
                setClassroomId('')
                setPreview(null)
              }}
              required
            >
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}){b.isMain ? ' — Main Campus' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Entry Program (Optional)</label>
            <select
              className="select"
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value)
                setClassroomId('')
                setPreview(null)
              }}
            >
              <option value="">— Unassigned / Match on Classroom —</option>
              {availablePrograms.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Target Classroom (Optional)</label>
            <select
              className="select"
              value={classroomId}
              onChange={(e) => {
                setClassroomId(e.target.value)
                setPreview(null)
              }}
            >
              <option value="">— Assign Later in Classes —</option>
              {availableClassrooms.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          CSV format: <code>firstName,lastName,dob,gender,admissionNo,guardianName,guardianPhone,relationship</code>
        </span>
        <button type="button" className="btn btn-sm btn-outline" onClick={loadSample}>
          Load Sample Data
        </button>
      </div>

      <textarea
        className="textarea"
        rows={6}
        value={csv}
        onChange={(e) => {
          setCsv(e.target.value)
          if (preview) setPreview(null)
        }}
        placeholder={'firstName,lastName,dob,gender,admissionNo,guardianName,guardianPhone,relationship\nAarav,Sharma,2022-04-12,MALE,IMP-001,Priya Sharma,9876543210,MOTHER'}
        style={{ fontFamily: 'monospace', fontSize: 12.5 }}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn btn-outline ${previewing ? 'is-loading' : ''}`}
          onClick={handlePreview}
          disabled={!csv.trim() || !branchId || previewing}
        >
          <Upload size={15} /> Validate & Preview
        </button>

        {preview && Number(preview.valid) > 0 && (
          <button
            className={`btn btn-primary ${importing ? 'is-loading' : ''}`}
            onClick={handleCommit}
            disabled={importing}
          >
            <CheckCircle2 size={15} /> Commit & Import {String(preview.valid)} Students to {selectedBranch?.name || 'Campus'}
          </button>
        )}
      </div>

      {preview && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', fontSize: 13 }}>
            <span className="badge b-success">{String(preview.valid)} Valid</span>
            {Number(preview.invalid) > 0 && <span className="badge b-danger">{String(preview.invalid)} Invalid</span>}
            <span style={{ color: 'var(--text-muted)' }}>
              Target: <strong>{selectedBranch?.name}</strong>
              {selectedProg ? ` · ${selectedProg.name}` : ''}
              {selectedRoom ? ` · Room: ${selectedRoom.name}` : ''}
            </span>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
            <table className="dtable" style={{ margin: 0, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Row</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>DOB & Gender</th>
                  <th>Primary Guardian</th>
                  <th>Validation Status</th>
                </tr>
              </thead>
              <tbody>
                {(preview.rows as any[]).map((r: any) => (
                  <tr key={String(r.row)}>
                    <td>{String(r.row)}</td>
                    <td><span className="cell-strong">{r.firstName} {r.lastName}</span></td>
                    <td><code>{r.admissionNo}</code></td>
                    <td><span className="cell-sub">{r.dob} · {r.gender}</span></td>
                    <td>{r.guardian}</td>
                    <td>
                      {r.status === 'READY' ? (
                        <span className="badge b-success">READY</span>
                      ) : (
                        <span className="badge b-danger" title={(r.errors as string[])?.join('; ')}>
                          ERROR: {(r.errors as string[])?.join('; ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

interface FeeItemRow {
  name: string
  feeType: 'REGULAR' | 'REFUNDABLE_DEPOSIT'
  amountRupees: number | string
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUALLY'
  dueRule: string
  lateFeeApplicable: boolean
  lateFeeRupees: number | string
  isRefundable: boolean
}

function CreateFeeStructureModal({
  branches,
  programs,
  academicYears,
  onClose,
  onDone,
  api,
  toast,
}: {
  branches: any[]
  programs: any[]
  academicYears: any[]
  onClose: () => void
  onDone: () => void
  api: ApiFn
  toast: ToastFn
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [branchId, setBranchId] = useState(branches[0]?.id || '')
  const [academicSessionId, setAcademicSessionId] = useState(
    academicYears.find((y) => y.isCurrent)?.id || academicYears[0]?.id || ''
  )
  const [programId, setProgramId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>('ACTIVE')
  const [busy, setBusy] = useState(false)

  const [items, setItems] = useState<FeeItemRow[]>([
    { name: 'Admission Fee', feeType: 'REGULAR', amountRupees: 5000, frequency: 'ONE_TIME', dueRule: 'On Admission', lateFeeApplicable: false, lateFeeRupees: 0, isRefundable: false },
    { name: 'Tuition Fee', feeType: 'REGULAR', amountRupees: 4000, frequency: 'MONTHLY', dueRule: '10th of every month', lateFeeApplicable: true, lateFeeRupees: 200, isRefundable: false },
    { name: 'Caution / Security Deposit', feeType: 'REFUNDABLE_DEPOSIT', amountRupees: 5000, frequency: 'ONE_TIME', dueRule: 'On Admission', lateFeeApplicable: false, lateFeeRupees: 0, isRefundable: true },
  ])

  // Filter programs mapped to selected branch
  const availablePrograms = useMemo(() => {
    if (!branchId) return []
    return programs.filter((p) => {
      if (!p.branchMappings || p.branchMappings.length === 0) return true
      return p.branchMappings.some((bm: any) => bm.branchId === branchId && bm.isActive)
    })
  }, [programs, branchId])

  useEffect(() => {
    if (availablePrograms.length > 0 && !availablePrograms.some((p) => p.id === programId)) {
      setProgramId(availablePrograms[0].id)
    }
  }, [availablePrograms, programId])

  const selectedProg = programs.find((p) => p.id === programId)
  const selectedBranch = branches.find((b) => b.id === branchId)
  const selectedYear = academicYears.find((y) => y.id === academicSessionId)

  // Auto-generate name when parameters change if name was default
  useEffect(() => {
    if (selectedProg && selectedBranch && selectedYear) {
      setName(`${selectedProg.name} Fee Structure — ${selectedYear.name || 'AY'}`)
    }
  }, [selectedProg?.name, selectedBranch?.name, selectedYear?.name])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: 'Activity & Learning Kit', feeType: 'REGULAR', amountRupees: 1500, frequency: 'ANNUALLY', dueRule: 'Term Start', lateFeeApplicable: false, lateFeeRupees: 0, isRefundable: false },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Validation', 'A fee structure must have at least one fee head')
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, patch: Partial<FeeItemRow>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const totalAnnualRupees = useMemo(() => {
    return items.reduce((sum, item) => {
      const amt = Number(item.amountRupees) || 0
      const mult = item.frequency === 'MONTHLY' ? 12 : item.frequency === 'QUARTERLY' ? 4 : item.frequency === 'HALF_YEARLY' ? 2 : 1
      return sum + amt * mult
    }, 0)
  }, [items])

  const handleSubmit = async () => {
    if (!branchId) { toast.error('Branch Required', 'Please select a campus branch'); return }
    if (!academicSessionId) { toast.error('Academic Year Required', 'Please select an academic year'); return }
    if (!programId) { toast.error('Program Required', 'Please select a program mapped to this branch'); return }
    if (!name.trim()) { toast.error('Name Required', 'Please provide a name for this fee structure'); return }
    if (items.length === 0) { toast.error('Fee Items Required', 'Please configure at least one fee head'); return }

    for (const item of items) {
      if (!item.name.trim()) {
        toast.error('Validation', 'All fee heads must have a name')
        return
      }
      if (Number(item.amountRupees) <= 0) {
        toast.error('Validation', `Amount for "${item.name}" must be greater than zero`)
        return
      }
    }

    setBusy(true)
    const payload = {
      branchId,
      academicSessionId,
      programId,
      name: name.trim(),
      description: description.trim() || null,
      status,
      items: items.map((it, idx) => ({
        name: it.name.trim(),
        feeType: it.feeType,
        amountCents: Math.round(Number(it.amountRupees) * 100),
        currency: 'INR',
        frequency: it.frequency,
        dueRule: it.dueRule?.trim() || null,
        lateFeeApplicable: Boolean(it.lateFeeApplicable),
        lateFeeAmountCents: it.lateFeeApplicable ? Math.round(Number(it.lateFeeRupees) * 100) : 0,
        isRefundable: Boolean(it.isRefundable || it.feeType === 'REFUNDABLE_DEPOSIT'),
        sortOrder: idx,
      })),
    }

    const res = await api('/api/v1/fee-structures', 'POST', payload)
    setBusy(false)

    if (res.success) {
      toast.success('Fee Structure Created', `Configured "${name}" for ${selectedProg?.name} (${selectedBranch?.name})`)
      onDone()
      onClose()
    } else {
      toast.error('Failed to create fee structure', res.error?.message || 'Database error')
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={step === 1 ? 'Configure Canonical Fee Structure' : 'Review & Confirm Fee Structure'}
      icon={<IndianRupee size={22} />}
      iconClass="ic-blue"
      wide
    >
      {step === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-muted)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: 'var(--foreground-muted)' }}>
            This configuration writes directly to canonical Finance records. Finance operations (invoicing, collections, student fee schedules) consume this exact structure.
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Campus Branch <span className="req">*</span></label>
              <select className="select" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Academic Year <span className="req">*</span></label>
              <select className="select" value={academicSessionId} onChange={(e) => setAcademicSessionId(e.target.value)} required>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Current)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Program <span className="req">*</span></label>
              <select className="select" value={programId} onChange={(e) => setProgramId(e.target.value)} required disabled={availablePrograms.length === 0}>
                {availablePrograms.length === 0 ? (
                  <option value="">No programs mapped to this campus</option>
                ) : (
                  availablePrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))
                )}
              </select>
              {availablePrograms.length === 0 && (
                <span className="helper" style={{ color: 'var(--danger)' }}>
                  Map programs to this campus in Program Setup first.
                </span>
              )}
            </div>

            <div className="field">
              <label>Initial Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="ACTIVE">ACTIVE (Ready for Student Invoicing)</option>
                <option value="DRAFT">DRAFT (Review / Under Configuration)</option>
              </select>
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Structure Name <span className="req">*</span></label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nursery Annual Fee Plan — AY 2026-27" required />
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Description / Notes</label>
              <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional administrative remarks or schedule notes" />
            </div>
          </div>

          {/* Fee Items Table */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Fee Heads & Installment Rules</span>
                <span className="helper" style={{ display: 'block' }}>Configured amounts stored in exact integer paise</span>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={addItem}>
                <Plus size={13} /> Add Fee Head
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
              <table className="dtable" style={{ margin: 0, fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Fee Head Name</th>
                    <th>Type</th>
                    <th>Frequency</th>
                    <th style={{ width: 110 }}>Amount (₹)</th>
                    <th>Due Rule</th>
                    <th style={{ width: 70 }}>Late Fee</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          className="input"
                          style={{ height: 32, fontSize: 12.5 }}
                          value={it.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value })}
                          placeholder="e.g. Tuition"
                          required
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ height: 32, fontSize: 12 }}
                          value={it.feeType}
                          onChange={(e) => {
                            const ft = e.target.value as any
                            updateItem(idx, { feeType: ft, isRefundable: ft === 'REFUNDABLE_DEPOSIT' })
                          }}
                        >
                          <option value="REGULAR">Regular Fee</option>
                          <option value="REFUNDABLE_DEPOSIT">Refundable Deposit</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="select"
                          style={{ height: 32, fontSize: 12 }}
                          value={it.frequency}
                          onChange={(e) => updateItem(idx, { frequency: e.target.value as any })}
                        >
                          <option value="ONE_TIME">One Time</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="HALF_YEARLY">Half Yearly</option>
                          <option value="ANNUALLY">Annually</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          style={{ height: 32, fontSize: 12.5, fontWeight: 600 }}
                          value={it.amountRupees}
                          onChange={(e) => updateItem(idx, { amountRupees: e.target.value })}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          style={{ height: 32, fontSize: 12 }}
                          value={it.dueRule}
                          onChange={(e) => updateItem(idx, { dueRule: e.target.value })}
                          placeholder="e.g. 5th of Month"
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={it.lateFeeApplicable}
                          onChange={(e) => updateItem(idx, { lateFeeApplicable: e.target.checked })}
                          title="Apply late fee penalty"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 4, color: 'var(--danger)' }}
                          onClick={() => removeItem(idx)}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>
                Estimated Annualised Total: <strong style={{ color: 'var(--foreground)' }}>₹{totalAnnualRupees.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!branchId || !academicSessionId || !programId || !name.trim()) {
                  toast.error('Validation', 'Please complete all required fields')
                  return
                }
                setStep(2)
              }}
              disabled={availablePrograms.length === 0}
            >
              Continue to Review →
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: REVIEW & CONFIRM */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, background: 'var(--surface-muted)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 16, fontWeight: 700 }}>{name}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
              <div><span style={{ color: 'var(--foreground-muted)' }}>Campus:</span> <strong>{selectedBranch?.name}</strong></div>
              <div><span style={{ color: 'var(--foreground-muted)' }}>Program:</span> <strong>{selectedProg?.name}</strong></div>
              <div><span style={{ color: 'var(--foreground-muted)' }}>Academic Year:</span> <strong>{selectedYear?.name}</strong></div>
              <div><span style={{ color: 'var(--foreground-muted)' }}>Status:</span> <span className={`badge ${status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>{status}</span></div>
            </div>
            {description && <p style={{ margin: '10px 0 0 0', fontSize: 12.5, color: 'var(--foreground-muted)' }}>{description}</p>}
          </div>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
            <table className="dtable" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Fee Head</th>
                  <th>Type</th>
                  <th>Frequency</th>
                  <th>Due Rule</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td><strong style={{ fontSize: 13 }}>{it.name}</strong></td>
                    <td>
                      {it.feeType === 'REFUNDABLE_DEPOSIT' ? (
                        <span className="badge b-orange">Refundable Deposit</span>
                      ) : (
                        <span className="badge b-primary">Regular Fee</span>
                      )}
                    </td>
                    <td><span className="badge b-neutral">{it.frequency.replace('_', ' ')}</span></td>
                    <td><span className="cell-sub">{it.dueRule || '—'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                      ₹{Number(it.amountRupees).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>
              ← Back to Edit
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button
                type="button"
                className={`btn btn-primary ${busy ? 'is-loading' : ''}`}
                onClick={handleSubmit}
                disabled={busy}
              >
                <CheckCircle2 size={15} /> {busy ? 'Persisting to Finance…' : 'Save & Publish to Finance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function FeeSetupSection({
  onDone,
  api,
  toast,
  refreshTrigger,
}: {
  onDone: () => void
  api: ApiFn
  toast: ToastFn
  refreshTrigger?: number
}) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [structures, setStructures] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadFeeData = useCallback(async () => {
    try {
      const [brRes, prRes, yrRes, stRes] = await Promise.all([
        fetch('/api/v1/branches', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/v1/programs', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/v1/academic-years', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/v1/fee-structures', { cache: 'no-store' }).then((r) => r.json()),
      ])

      if (brRes.success) setBranches(brRes.data || [])
      if (prRes.success) setPrograms(prRes.data || [])
      if (yrRes.success) setAcademicYears(yrRes.data || [])
      if (stRes.success) {
        setStructures(stRes.data || [])
      } else if (stRes.error) {
        toast.error('Failed to load fee structures', stRes.error.message)
      }
    } catch (err: any) {
      toast.error('Failed to load fee configuration', err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    loadFeeData()
  }, [loadFeeData, refreshTrigger])

  const handleManualReload = async () => {
    setRefreshing(true)
    await loadFeeData()
    onDone()
    toast.success('Reload complete', 'Fee structures and coverage data updated')
  }

  // Filter structures by branch
  const filteredStructures = useMemo(() => {
    if (selectedBranchId === 'ALL') return structures
    return structures.filter((s) => !s.branchId || s.branchId === selectedBranchId)
  }, [structures, selectedBranchId])

  // Build Program x Campus coverage matrix
  const coverageMatrix = useMemo(() => {
    const activeBranches = branches.filter((b) => b.isActive)
    const activeProgs = programs.filter((p) => p.isActive)
    const rows: Array<{
      program: any
      branch: any
      activeStructure: any | null
      status: 'CONFIGURED' | 'MISSING'
    }> = []

    for (const prog of activeProgs) {
      for (const branch of activeBranches) {
        // Only include if mapped
        const isMapped = !prog.branchMappings || prog.branchMappings.length === 0 ||
          prog.branchMappings.some((bm: any) => bm.branchId === branch.id && bm.isActive)

        if (isMapped) {
          const activeSt = structures.find(
            (st) =>
              st.status === 'ACTIVE' &&
              (st.programId === prog.id || st.programType === prog.programType) &&
              (!st.branchId || st.branchId === branch.id)
          )
          rows.push({
            program: prog,
            branch,
            activeStructure: activeSt || null,
            status: activeSt ? 'CONFIGURED' : 'MISSING',
          })
        }
      }
    }

    if (selectedBranchId === 'ALL') return rows
    return rows.filter((r) => r.branch.id === selectedBranchId)
  }, [branches, programs, structures, selectedBranchId])

  const missingCoverageCount = coverageMatrix.filter((r) => r.status === 'MISSING').length

  if (loading) {
    return <div style={{ padding: 16 }}><Skeleton h={220} /></div>
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="card-sub" style={{ margin: 0 }}>
            Create and govern canonical fee structures. Invoices, dues, payment tracking, and receipts in <strong>Finance</strong> directly consume these exact structures.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleManualReload}
            disabled={refreshing || loading}
            title="Reload live fee structures and update coverage matrix"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Reloading…' : 'Reload Data'}</span>
          </button>
          <a href="/app/finance" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>View in Finance</span> <ArrowUpRight size={13} />
          </a>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create Fee Structure
          </button>
        </div>
      </div>

      {/* Campus Branch Filter & Readiness Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, background: 'var(--surface-muted)', padding: '10px 14px', borderRadius: 8, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={16} style={{ color: 'var(--foreground-muted)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Filter by Campus:</span>
          <select
            className="select"
            style={{ height: 32, fontSize: 12.5, minWidth: 160 }}
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="ALL">All Campuses ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          {missingCoverageCount === 0 ? (
            <span className="badge b-success" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={13} /> 100% Fee Coverage — Go-Live Ready
            </span>
          ) : (
            <span className="badge b-danger">
              {missingCoverageCount} program mapping(s) lack active fee structure
            </span>
          )}
        </div>
      </div>

      {/* Program Coverage Matrix Table */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--foreground-muted)' }}>
          Campus Program Pricing Coverage
        </h4>
        <div className="dtable-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>Campus Branch</th>
                <th>Program</th>
                <th>Active Fee Structure</th>
                <th>Annual Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {coverageMatrix.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--foreground-muted)' }}>
                    No programs mapped to the selected campus filter.
                  </td>
                </tr>
              ) : (
                coverageMatrix.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="cell-strong">{row.branch.name}</span>
                      <span className="cell-sub">{row.branch.code}</span>
                    </td>
                    <td>
                      <span className="cell-strong">{row.program.name}</span>
                      <span className="cell-sub">{row.program.code}</span>
                    </td>
                    <td>
                      {row.activeStructure ? (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.activeStructure.name}</span>
                          <span className="cell-sub">{row.activeStructure.academicSession?.name || 'AY'}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--foreground-muted)', fontStyle: 'italic' }}>Not configured</span>
                      )}
                    </td>
                    <td>
                      {row.activeStructure ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          ₹{(
                            row.activeStructure.items?.reduce((s: number, i: any) => s + (i.amountCents || 0), 0) / 100
                          ).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {row.status === 'CONFIGURED' ? (
                        <span className="badge b-success">Active</span>
                      ) : (
                        <span className="badge b-danger">Missing Fee Structure</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {row.status === 'MISSING' ? (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            setSelectedBranchId(row.branch.id)
                            setShowCreateModal(true)
                          }}
                        >
                          <Plus size={12} /> Configure
                        </button>
                      ) : (
                        <a href="/app/finance" target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" title="View details in Finance">
                          Finance <ArrowUpRight size={12} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configured Structures List */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--foreground-muted)' }}>
          Configured Canonical Fee Structures ({filteredStructures.length})
        </h4>
        {filteredStructures.length === 0 ? (
          <EmptyState
            icon={<IndianRupee size={36} />}
            title="No fee structures found"
            message="Click 'Create Fee Structure' to define tuition, admission fees, and deposit rules for your programs."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filteredStructures.map((st) => {
              const totalRupees =
                (st.items?.reduce((s: number, i: any) => s + (i.amountCents || 0), 0) || 0) / 100
              const branchName = branches.find((b) => b.id === st.branchId)?.name || 'All Campuses'

              return (
                <div key={st.id} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h5 style={{ margin: '0 0 2px 0', fontSize: 14, fontWeight: 700 }}>{st.name}</h5>
                      <span className="cell-sub">{branchName} · {st.academicSession?.name || 'AY'}</span>
                    </div>
                    <span className={`badge ${st.status === 'ACTIVE' ? 'b-success' : 'b-neutral'}`}>
                      {st.status}
                    </span>
                  </div>

                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 10px', fontSize: 12, background: 'var(--surface-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 600 }}>
                      <span>Fee Heads ({st.items?.length || 0})</span>
                      <span style={{ fontFamily: 'monospace' }}>Total: ₹{totalRupees.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {st.items?.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--foreground-muted)' }}>
                          <span>{item.name}</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{((item.amountCents || 0) / 100).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      {st.items?.length > 3 && (
                        <span style={{ fontSize: 11, color: 'var(--foreground-muted)', fontStyle: 'italic' }}>
                          +{st.items.length - 3} more head(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto' }}>
                    <a href="/app/finance" target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}>
                      Inspect in Finance <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <p className="card-sub" style={{ marginBottom: 8 }}>Accepted payment methods (Finance configuration):</p>
        <QuickFinanceConfig onDone={() => { onDone(); loadFeeData() }} api={api} toast={toast} />
      </div>

      {showCreateModal && (
        <CreateFeeStructureModal
          branches={branches}
          programs={programs}
          academicYears={academicYears}
          onClose={() => setShowCreateModal(false)}
          onDone={() => {
            loadFeeData()
            onDone()
          }}
          api={api}
          toast={toast}
        />
      )}
    </>
  )
}

function QuickFinanceConfig({ onDone, api, toast }: { onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [methods, setMethods] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    fetch('/api/v1/setup/config/FINANCE', { cache: 'no-store' }).then((r) => r.json()).then((j) => {
      if (j.success) setMethods((j.data.data?.paymentMethods as string[]) ?? ['CASH', 'UPI', 'BANK_TRANSFER'])
      setLoaded(true)
    })
  }, [])
  if (!loaded) return <Skeleton h={40} />
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <IndianRupee size={14} style={{ color: 'var(--foreground-secondary)' }} />
      {['CASH', 'CHEQUE', 'CARD', 'UPI', 'NET_BANKING', 'BANK_TRANSFER'].map((m) => {
        const on = methods.includes(m)
        return <button key={m} className={`badge ${on ? 'b-primary' : 'b-neutral'}`} style={{ cursor: 'pointer', padding: '5px 10px' }} onClick={async () => {
          const next = on ? methods.filter((x) => x !== m) : [...methods, m]
          setMethods(next)
          const j = await api('/api/v1/setup/config/FINANCE', 'PUT', { paymentMethods: next })
          if (j.success) { toast.success('Payment methods updated'); onDone() } else toast.error('Failed', j.error?.message)
        }}>{on ? '✓ ' : ''}{m.replaceAll('_', ' ').toLowerCase()}</button>
      })}
    </div>
  )
}

/* ────────────────────────── modals ────────────────────────── */
function BranchModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const j = await api('/api/v1/branches', 'POST', fd)
    setBusy(false)
    if (j.success) { toast.success('Branch created', String(j.data.name)); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <Modal open onClose={onClose} title="Add Branch / Campus" icon={<Building2 size={22} />} iconClass="ic-blue">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Name <span className="req">*</span></label><input className="input" name="name" required /></div>
          <div className="field"><label>Code <span className="req">*</span></label><input className="input" name="code" required placeholder="MAIN2" /></div>
          <div className="field"><label>City</label><input className="input" name="city" /></div>
          <div className="field"><label>Phone</label><input className="input" name="phone" /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Address</label><input className="input" name="address" /></div>
          <div className="field"><label>Capacity (seats)</label><input className="input" name="capacity" type="number" min="1" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Branch</button>
        </div>
      </form>
    </Modal>
  )
}

function ProgramModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [branches, setBranches] = useState<Dict[]>([])
  const [selectedBranches, setSelectedBranches] = useState<Record<string, { enabled: boolean; capacity: number }>>({})

  useEffect(() => {
    fetch('/api/v1/branches').then((r) => r.json()).then((j) => {
      if (j.success && Array.isArray(j.data)) {
        setBranches(j.data)
        const init: Record<string, { enabled: boolean; capacity: number }> = {}
        j.data.forEach((b: any) => {
          init[b.id] = { enabled: true, capacity: 20 }
        })
        setSelectedBranches(init)
      }
    })
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const j = await api('/api/v1/programs', 'POST', fd)
    if (j.success) {
      // Map program to selected campuses
      const mappings = Object.entries(selectedBranches)
        .filter(([_, conf]) => conf.enabled)
        .map(([branchId, conf]) => ({
          programId: j.data.id,
          branchId,
          isActive: true,
          capacity: conf.capacity,
        }))
      if (mappings.length > 0) {
        await api('/api/v1/programs/branches', 'POST', { mappings })
      }
      setBusy(false)
      toast.success('Program created', String(j.data.name))
      onClose(); onDone()
    } else {
      setBusy(false)
      toast.error('Failed', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Program Master" icon={<Blocks size={22} />} iconClass="ic-violet" wide>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Name <span className="req">*</span></label><input className="input" name="name" required placeholder="Jr KG" /></div>
          <div className="field"><label>Code <span className="req">*</span></label><input className="input" name="code" required placeholder="JKG" /></div>
          <div className="field"><label>System program type <span className="req">*</span></label>
            <select className="select" name="programType" required>
              {['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="helper">Links the program to fee plans and canonical integrations — name and code stay custom.</div>
          </div>
          <div className="field"><label>Master Capacity <span className="req">*</span></label><input className="input" name="capacity" type="number" defaultValue={20} min="1" required /></div>
          <div className="field"><label>Min age (months)</label><input className="input" name="ageMinMonths" type="number" /></div>
          <div className="field"><label>Max age (months)</label><input className="input" name="ageMaxMonths" type="number" /></div>
          <div className="field"><label>Duration (months)</label><input className="input" name="durationMonths" type="number" placeholder="12" /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><input className="input" name="description" /></div>

          {branches.length > 0 && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Campus Availability & Capacity Mapping</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {branches.map((b: any) => {
                  const conf = selectedBranches[b.id] || { enabled: false, capacity: 20 }
                  return (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={conf.enabled}
                          onChange={(e) => {
                            setSelectedBranches((prev) => ({
                              ...prev,
                              [b.id]: { ...conf, enabled: e.target.checked },
                            }))
                          }}
                        />
                        <span style={{ fontWeight: 500 }}>{b.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>({b.code})</span>
                      </label>
                      {conf.enabled && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Capacity:</span>
                          <input
                            type="number"
                            className="input"
                            style={{ width: 80, height: 28, fontSize: 12, padding: '2px 8px' }}
                            value={conf.capacity}
                            min={1}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 20
                              setSelectedBranches((prev) => ({
                                ...prev,
                                [b.id]: { ...conf, capacity: val },
                              }))
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Program Master</button>
        </div>
      </form>
    </Modal>
  )
}

function ProgramCampusMappingSection({
  programs,
  onDone,
  api,
  toast,
}: {
  programs: Dict[]
  onDone: () => void
  api: ApiFn
  toast: ToastFn
}) {
  const [branches, setBranches] = useState<Dict[]>([])
  const [mappings, setMappings] = useState<Dict[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [bRes, mRes] = await Promise.all([
      fetch('/api/v1/branches').then((r) => r.json()),
      fetch('/api/v1/programs/branches').then((r) => r.json()),
    ])
    if (bRes.success) setBranches(bRes.data || [])
    if (mRes.success) setMappings(mRes.data || [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const toggleMapping = async (programId: string, branchId: string, currentActive: boolean, currentCap: number | null) => {
    const key = `${programId}-${branchId}`
    setUpdating(key)
    const res = await api('/api/v1/programs/branches', 'POST', {
      programId,
      branchId,
      isActive: !currentActive,
      capacity: currentCap,
    })
    setUpdating(null)
    if (res.success) {
      toast.success(currentActive ? 'Campus unmapped' : 'Campus mapped')
      loadData()
      onDone()
    } else {
      toast.error('Update failed', res.error?.message)
    }
  }

  const updateCapacity = async (programId: string, branchId: string, capacity: number) => {
    const key = `${programId}-${branchId}`
    setUpdating(key)
    const res = await api('/api/v1/programs/branches', 'POST', {
      programId,
      branchId,
      isActive: true,
      capacity,
    })
    setUpdating(null)
    if (res.success) {
      toast.success('Capacity updated')
      loadData()
      onDone()
    } else {
      toast.error('Update failed', res.error?.message)
    }
  }

  if (programs.length === 0 || branches.length === 0) return null

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div className="card-title" style={{ fontSize: 14 }}>
            <Building2 size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            Campus Availability & Capacity Matrix
          </div>
          <p className="helper" style={{ margin: '2px 0 0' }}>
            Map master programs to operating campuses. Preschools maintain ONE program master with branch-specific allocations.
          </p>
        </div>
      </div>

      <div className="dtable-scroll">
        <table className="dtable">
          <thead>
            <tr>
              <th>Master Program</th>
              {branches.map((b: any) => (
                <th key={b.id} style={{ textAlign: 'center' }}>
                  {b.name} <span style={{ fontSize: 10.5, opacity: 0.7 }}>({b.code})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {programs.map((p: any) => (
              <tr key={p.id}>
                <td>
                  <span className="cell-strong">{p.name}</span>
                  <span className="cell-sub">{p.code} · {String(p.programType).toLowerCase()}</span>
                </td>
                {branches.map((b: any) => {
                  const m = mappings.find((item: any) => item.programId === p.id && item.branchId === b.id)
                  const isActive = m ? m.isActive : false
                  const cap = m?.capacity ?? p.capacity ?? 20
                  const isBusy = updating === `${p.id}-${b.id}`

                  return (
                    <td key={b.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                          style={{ minWidth: 80, height: 26, padding: '2px 8px', fontSize: 11.5 }}
                          disabled={isBusy}
                          onClick={() => toggleMapping(p.id, b.id, isActive, cap)}
                        >
                          {isActive ? '✓ Offered' : '+ Offer'}
                        </button>
                        {isActive && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: 'var(--text-muted)' }}>
                            <span>Cap:</span>
                            <input
                              type="number"
                              className="input"
                              style={{ width: 50, height: 22, fontSize: 11, padding: '1px 4px', textAlign: 'center' }}
                              defaultValue={cap}
                              onBlur={(e) => {
                                const val = Number(e.target.value)
                                if (val > 0 && val !== cap) {
                                  updateCapacity(p.id, b.id, val)
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function YearModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const j = await api('/api/v1/academic-years', 'POST', fd)
    setBusy(false)
    if (j.success) { toast.success('Academic year created', String(j.data.name)); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <Modal open onClose={onClose} title="Create Academic Year" icon={<CalendarPlus size={22} />} iconClass="ic-green">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Name <span className="req">*</span></label><input className="input" name="name" required placeholder="2026-27" /></div>
          <div className="field"><label>Start date <span className="req">*</span></label><input className="input" name="startDate" type="date" required /></div>
          <div className="field"><label>End date <span className="req">*</span></label><input className="input" name="endDate" type="date" required /></div>
        </div>
        <p className="helper">The first academic year is automatically marked current. Terms can be added in Operating Configuration.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Year</button>
        </div>
      </form>
    </Modal>
  )
}

function EventModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const j = await api('/api/v1/calendar', 'POST', fd)
    setBusy(false)
    if (j.success) { toast.success('Event added', String(fd.title)); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <Modal open onClose={onClose} title="Add Calendar Event" icon={<CalendarPlus size={22} />} iconClass="ic-cyan">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Date <span className="req">*</span></label><input className="input" name="date" type="date" required /></div>
          <div className="field"><label>Type <span className="req">*</span></label>
            <select className="select" name="type" required>{['HOLIDAY', 'VACATION', 'EVENT', 'PARENT_MEETING', 'ASSESSMENT', 'SPECIAL_DAY'].map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select>
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Title <span className="req">*</span></label><input className="input" name="title" required /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><input className="input" name="notes" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Add Event</button>
        </div>
      </form>
    </Modal>
  )
}

function FacilityModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [branches, setBranches] = useState<Dict[]>([])
  useEffect(() => { fetch('/api/v1/branches').then((r) => r.json()).then((j) => { if (j.success) setBranches(j.data) }) }, [])
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const j = await api('/api/v1/facilities', 'POST', fd)
    setBusy(false)
    if (j.success) { toast.success('Facility registered', String(j.data.name)); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <Modal open onClose={onClose} title="Register Facility / Area" icon={<DoorOpen size={22} />} iconClass="ic-orange">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Branch <span className="req">*</span></label>
            <select className="select" name="branchId" required>{branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name}</option>)}</select>
          </div>
          <div className="field"><label>Type <span className="req">*</span></label>
            <select className="select" name="type" required>{['CLASSROOM', 'ACTIVITY_AREA', 'PLAY_AREA', 'NAP_AREA', 'MEAL_AREA', 'WASHROOM', 'MEDICAL', 'OTHER'].map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select>
          </div>
          <div className="field"><label>Name <span className="req">*</span></label><input className="input" name="name" required /></div>
          <div className="field"><label>Code <span className="req">*</span></label><input className="input" name="code" required placeholder="PLAY-1" /></div>
          <div className="field"><label>Capacity</label><input className="input" name="capacity" type="number" /></div>
          <div className="field"><label>Floor / area</label><input className="input" name="floorOrArea" placeholder="Ground floor, east wing" /></div>
          <div className="field"><label>Age suitability</label><input className="input" name="ageSuitability" placeholder="2–4 years" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Register Facility</button>
        </div>
      </form>
    </Modal>
  )
}

function StaffModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [branches, setBranches] = useState<Dict[]>([])
  useEffect(() => { fetch('/api/v1/branches').then((r) => r.json()).then((j) => { if (j.success) setBranches(j.data) }) }, [])
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const j = await api('/api/v1/staff', 'POST', { ...fd, mode: 'new' })
    setBusy(false)
    if (j.success) { toast.success('Staff created', String(fd.employeeCode)); onDone() } else toast.error('Failed', j.error?.message)
  }
  return (
    <Modal open onClose={onClose} title="Add Staff Member" icon={<UserPlus size={22} />} iconClass="ic-purple" wide>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Full name <span className="req">*</span></label><input className="input" name="fullName" required /></div>
          <div className="field"><label>Email (login) <span className="req">*</span></label><input className="input" name="email" type="email" required /></div>
          <div className="field"><label>Temporary password <span className="req">*</span></label><input className="input" name="password" required minLength={6} /></div>
          <div className="field"><label>Role <span className="req">*</span></label>
            <select className="select" name="role" required>
              {CANONICAL_SETUP_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r]?.label ? `${r} — ${ROLE_META[r].label}` : r}
                </option>
              ))}
            </select>
          </div>
          <div className="field"><label>Employee code <span className="req">*</span></label><input className="input" name="employeeCode" required placeholder="EMP-001" /></div>
          <div className="field"><label>Branch (operational assignment)</label>
            <select className="select" name="branchId">
              <option value="">— assign later —</option>
              {branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name}</option>)}
            </select>
            <div className="helper">Created ≠ assigned — branch assignment completes the Staff Foundation step.</div>
          </div>
          <div className="field"><label>Designation</label><input className="input" name="designation" /></div>
          <div className="field"><label>Qualification</label><input className="input" name="qualification" /></div>
          <div className="field"><label>Joining date</label><input className="input" name="joiningDate" type="date" /></div>
          <div className="field"><label>Employment type</label>
            <select className="select" name="employmentType">{['REGULAR', 'PART_TIME', 'CONTRACT', 'INTERN'].map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select>
          </div>
          <div className="field"><label>Emergency contact name</label><input className="input" name="emergencyContactName" /></div>
          <div className="field"><label>Emergency contact phone</label><input className="input" name="emergencyContactPhone" /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Staff</button>
        </div>
      </form>
    </Modal>
  )
}

/* ────────────────────────── IN-PLACE EDIT MODALS ────────────────────────── */

function EditBranchModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      name: fd.name,
      address: fd.address || null,
      city: fd.city || null,
      phone: fd.phone || null,
      timingOpen: fd.timingOpen || '08:30',
      timingClose: fd.timingClose || '16:00',
      capacity: fd.capacity ? Number(fd.capacity) : null,
      isActive: fd.isActive === 'on',
    }
    const j = await api('/api/v1/branches/' + item.id, 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Branch updated', String(j.data.name))
      onClose(); onDone()
    } else {
      toast.error('Update failed', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={'Edit Branch — ' + item.name} icon={<Building2 size={22} />} iconClass="ic-blue">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Branch Name <span className="req">*</span></label><input className="input" name="name" defaultValue={String(item.name || '')} required /></div>
          <div className="field"><label>Code</label><input className="input" value={String(item.code || '')} disabled title="Branch code is permanent" /></div>
          <div className="field"><label>City</label><input className="input" name="city" defaultValue={String(item.city || '')} /></div>
          <div className="field"><label>Contact Phone</label><input className="input" name="phone" defaultValue={String(item.phone || '')} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Campus Address</label><input className="input" name="address" defaultValue={String(item.address || '')} /></div>
          <div className="field"><label>Seat Capacity</label><input className="input" name="capacity" type="number" defaultValue={item.capacity ? Number(item.capacity) : ''} min="1" /></div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="isActive" defaultChecked={item.isActive !== false} />
              <span>Active Branch</span>
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

function EditProgramModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [impactWarning, setImpactWarning] = useState<string | null>(null)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setImpactWarning(null)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      name: fd.name,
      description: fd.description || null,
      ageMinMonths: fd.ageMinMonths ? Number(fd.ageMinMonths) : null,
      ageMaxMonths: fd.ageMaxMonths ? Number(fd.ageMaxMonths) : null,
      capacity: Number(fd.capacity || 20),
      isActive: fd.isActive === 'on',
    }

    const j = await api('/api/v1/programs/' + item.id, 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Program updated', String(j.data.name))
      onClose(); onDone()
    } else {
      if (j.error?.code === 'SETUP_004') {
        setImpactWarning(j.error.message)
      }
      toast.error('Update failed', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={'Edit Program — ' + item.name} icon={<Blocks size={22} />} iconClass="ic-violet">
      <form onSubmit={submit}>
        {impactWarning && (
          <div style={{ padding: '8px 12px', background: 'var(--danger-subtle)', border: '1px solid var(--danger)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--danger)' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
            {impactWarning}
          </div>
        )}
        <div className="form-grid">
          <div className="field"><label>Program Name <span className="req">*</span></label><input className="input" name="name" defaultValue={String(item.name || '')} required /></div>
          <div className="field"><label>Code</label><input className="input" value={String(item.code || '')} disabled title="Program code is permanent" /></div>
          <div className="field"><label>Seat Capacity <span className="req">*</span></label><input className="input" name="capacity" type="number" defaultValue={Number(item.capacity || 20)} min="1" required /></div>
          <div className="field"><label>Min Age (months)</label><input className="input" name="ageMinMonths" type="number" defaultValue={item.ageMinMonths != null ? Number(item.ageMinMonths) : ''} placeholder="e.g. 24" /></div>
          <div className="field"><label>Max Age (months)</label><input className="input" name="ageMaxMonths" type="number" defaultValue={item.ageMaxMonths != null ? Number(item.ageMaxMonths) : ''} placeholder="e.g. 36" /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><input className="input" name="description" defaultValue={String(item.description || '')} placeholder="e.g. Sensory discovery & play-based early foundation" /></div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="isActive" defaultChecked={item.isActive !== false} />
              <span>Accepting New Admissions (Active)</span>
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

function EditYearModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload: Record<string, unknown> = {
      name: fd.name,
      startDate: fd.startDate,
      endDate: fd.endDate,
    }
    if (fd.setStatusCurrent === 'on') payload.setStatusCurrent = true

    const j = await api('/api/v1/academic-years/' + item.id, 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Academic year updated', String(item.name))
      onClose(); onDone()
    } else {
      toast.error('Update failed', j.error?.message)
    }
  }

  const sDate = item.startDate ? new Date(String(item.startDate)).toISOString().split('T')[0] : ''
  const eDate = item.endDate ? new Date(String(item.endDate)).toISOString().split('T')[0] : ''

  return (
    <Modal open onClose={onClose} title={'Edit Academic Year — ' + item.name} icon={<CalendarPlus size={22} />} iconClass="ic-green">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Year Name <span className="req">*</span></label><input className="input" name="name" defaultValue={String(item.name || '')} required /></div>
          <div className="field"><label>Start Date <span className="req">*</span></label><input className="input" name="startDate" type="date" defaultValue={sDate} required /></div>
          <div className="field"><label>End Date <span className="req">*</span></label><input className="input" name="endDate" type="date" defaultValue={eDate} required /></div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="setStatusCurrent" defaultChecked={item.isCurrent === true} />
              <span>Current Operating Year</span>
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

function EditClassModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [members, setMembers] = useState<Dict[]>([])
  const [programs, setPrograms] = useState<Dict[]>([])
  const [facilities, setFacilities] = useState<Dict[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/users').then((r) => r.json()),
      fetch('/api/v1/programs').then((r) => r.json()),
      fetch('/api/v1/facilities').then((r) => r.json()),
    ]).then(([u, p, f]) => {
      if (u.success) setMembers(u.data)
      if (p.success) setPrograms(p.data)
      if (f.success) setFacilities(f.data)
    })
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr(null)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      name: fd.name,
      capacity: Number(fd.capacity || 20),
      programId: fd.programId || null,
      primaryTeacherId: fd.primaryTeacherId || null,
      facilityId: fd.facilityId || null,
    }

    const j = await api('/api/v1/classrooms/' + item.id, 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Classroom updated', String(item.name))
      onClose(); onDone()
    } else {
      setErr(j.error?.message || 'Update failed')
      toast.error('Update failed', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={'Edit Classroom / Section — ' + item.name} icon={<LayoutGrid size={22} />} iconClass="ic-blue">
      <form onSubmit={submit}>
        {err && (
          <div style={{ padding: '8px 12px', background: 'var(--danger-subtle)', border: '1px solid var(--danger)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--danger)' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
            {err}
          </div>
        )}
        <div className="form-grid">
          <div className="field"><label>Class / Section Name <span className="req">*</span></label><input className="input" name="name" defaultValue={String(item.name || '')} required /></div>
          <div className="field"><label>Code</label><input className="input" value={String(item.code || '')} disabled title="Classroom code is permanent" /></div>
          <div className="field"><label>Program Offering <span className="req">*</span></label>
            <select className="select" name="programId" defaultValue={String(item.programId || '')}>
              <option value="">Select program…</option>
              {programs.map((p: any) => <option key={String(p.id)} value={String(p.id)}>{p.name} ({String(p.programType)})</option>)}
            </select>
          </div>
          <div className="field"><label>Seat Capacity (max students) <span className="req">*</span></label>
            <input className="input" name="capacity" type="number" defaultValue={Number(item.capacity || 20)} min="1" required />
            <div className="helper">Currently enrolled: {String(item.students ?? 0)} children</div>
          </div>
          <div className="field"><label>Primary Lead Teacher</label>
            <select className="select" name="primaryTeacherId" defaultValue={String(item.primaryTeacherId || '')}>
              <option value="">— unassigned —</option>
              {members.map((u: any) => <option key={String(u.userId)} value={String(u.userId)}>{u.name} ({String(u.role).replaceAll('_', ' ')})</option>)}
            </select>
          </div>
          <div className="field"><label>Physical Room / Facility</label>
            <select className="select" name="facilityId" defaultValue={String(item.facilityId || '')}>
              <option value="">— default room —</option>
              {facilities.map((f: any) => <option key={String(f.id)} value={String(f.id)}>{f.name} ({f.code})</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

function ClassroomModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [branches, setBranches] = useState<Dict[]>([])
  const [programs, setPrograms] = useState<Dict[]>([])
  const [mappings, setMappings] = useState<Dict[]>([])
  const [members, setMembers] = useState<Dict[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/branches').then((r) => r.json()),
      fetch('/api/v1/programs').then((r) => r.json()),
      fetch('/api/v1/programs/branches').then((r) => r.json()),
      fetch('/api/v1/users').then((r) => r.json()),
    ]).then(([b, p, pb, u]) => {
      if (b.success && Array.isArray(b.data)) {
        setBranches(b.data)
        if (b.data.length > 0) setSelectedBranchId(String(b.data[0].id))
      }
      if (p.success) setPrograms(p.data)
      if (pb.success) setMappings(pb.data)
      if (u.success) setMembers(u.data)
    })
  }, [])

  const availablePrograms = useMemo(() => {
    if (!selectedBranchId) return programs
    const branchMappingProgIds = new Set(
      mappings
        .filter((m: any) => m.branchId === selectedBranchId && m.isActive)
        .map((m: any) => m.programId)
    )
    if (branchMappingProgIds.size === 0) return programs
    return programs.filter((p: any) => branchMappingProgIds.has(p.id))
  }, [programs, mappings, selectedBranchId])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const selectedProgram = programs.find((p: any) => p.id === fd.programId)
    const payload = {
      name: fd.name,
      programType: selectedProgram ? selectedProgram.programType : 'PLAYGROUP',
      programId: fd.programId || null,
      capacity: Number(fd.capacity || 20),
      branchId: selectedBranchId || fd.branchId || null,
      primaryTeacherId: fd.primaryTeacherId || null,
    }

    const j = await api('/api/v1/classrooms', 'POST', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Classroom created', String(fd.name))
      onClose(); onDone()
    } else {
      toast.error('Failed to create classroom', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Classroom / Section" icon={<LayoutGrid size={22} />} iconClass="ic-blue">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Campus Branch <span className="req">*</span></label>
            <select
              className="select"
              name="branchId"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              required
            >
              {branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Program Offering <span className="req">*</span></label>
            <select className="select" name="programId" required>
              <option value="">Select program offered at this campus…</option>
              {availablePrograms.map((p: any) => <option key={String(p.id)} value={String(p.id)}>{p.name} ({String(p.programType)})</option>)}
            </select>
            {availablePrograms.length < programs.length && (
              <div className="helper">Showing programs mapped to this campus. Map others in Programs step.</div>
            )}
          </div>
          <div className="field"><label>Class Name <span className="req">*</span></label><input className="input" name="name" required placeholder="Nursery - Sunflower" /></div>
          <div className="field"><label>Seat Capacity <span className="req">*</span></label><input className="input" name="capacity" type="number" defaultValue={20} min="1" required /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Primary Teacher</label>
            <select className="select" name="primaryTeacherId">
              <option value="">— assign later —</option>
              {members.map((u: any) => <option key={String(u.userId)} value={String(u.userId)}>{u.name} ({String(u.role).replaceAll('_', ' ')})</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Create Classroom</button>
        </div>
      </form>
    </Modal>
  )
}

function EditFacilityModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      name: fd.name,
      type: fd.type,
      capacity: fd.capacity ? Number(fd.capacity) : null,
      floorOrArea: fd.floorOrArea || null,
      ageSuitability: fd.ageSuitability || null,
    }
    const j = await api('/api/v1/facilities/' + item.id, 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Facility updated', String(item.name))
      onClose(); onDone()
    } else {
      toast.error('Update failed', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={'Edit Facility — ' + item.name} icon={<DoorOpen size={22} />} iconClass="ic-orange">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Name <span className="req">*</span></label><input className="input" name="name" defaultValue={String(item.name || '')} required /></div>
          <div className="field"><label>Type <span className="req">*</span></label>
            <select className="select" name="type" defaultValue={String(item.type || 'CLASSROOM')} required>
              {['CLASSROOM', 'ACTIVITY_AREA', 'PLAY_AREA', 'NAP_AREA', 'MEAL_AREA', 'WASHROOM', 'MEDICAL', 'OTHER'].map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <div className="field"><label>Code</label><input className="input" value={String(item.code || '')} disabled title="Code cannot be modified" /></div>
          <div className="field"><label>Capacity</label><input className="input" name="capacity" type="number" defaultValue={item.capacity != null ? Number(item.capacity) : ''} /></div>
          <div className="field"><label>Floor / Area</label><input className="input" name="floorOrArea" defaultValue={String(item.floorOrArea || '')} /></div>
          <div className="field"><label>Age Suitability</label><input className="input" name="ageSuitability" defaultValue={String(item.ageSuitability || '')} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

function EditStaffModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [branches, setBranches] = useState<Dict[]>([])

  useEffect(() => {
    fetch('/api/v1/branches').then((r) => r.json()).then((j) => { if (j.success) setBranches(j.data) })
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      id: item.id,
      branchId: fd.branchId || null,
      membershipRole: fd.role,
      designation: fd.designation || null,
      qualification: fd.qualification || null,
      employmentType: fd.employmentType || 'REGULAR',
      emergencyContactName: fd.emergencyContactName || null,
      emergencyContactPhone: fd.emergencyContactPhone || null,
    }
    const j = await api('/api/v1/staff', 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Staff profile updated', String(item.name))
      onClose(); onDone()
    } else {
      toast.error('Update failed', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={'Edit Staff — ' + item.name} icon={<Users size={22} />} iconClass="ic-purple" wide>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Staff Member</label><input className="input" value={String(item.name || '')} disabled /></div>
          <div className="field"><label>Email</label><input className="input" value={String(item.email || '')} disabled /></div>
          <div className="field"><label>Employee Code</label><input className="input" value={String(item.employeeCode || '')} disabled /></div>
          <div className="field"><label>Operating Role <span className="req">*</span></label>
            <select className="select" name="role" defaultValue={String(item.role || 'TEACHER')}>
              {CANONICAL_SETUP_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r]?.label ? `${r} — ${ROLE_META[r].label}` : r}
                </option>
              ))}
            </select>
          </div>
          <div className="field"><label>Branch Assignment</label>
            <select className="select" name="branchId" defaultValue={String(item.branchId || '')}>
              <option value="">— unassigned —</option>
              {branches.map((b: any) => <option key={String(b.id)} value={String(b.id)}>{b.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Designation</label><input className="input" name="designation" defaultValue={String(item.designation || '')} /></div>
          <div className="field"><label>Qualification</label><input className="input" name="qualification" defaultValue={String(item.qualification || '')} /></div>
          <div className="field"><label>Employment Type</label>
            <select className="select" name="employmentType" defaultValue={String(item.employmentType || 'REGULAR')}>
              {['REGULAR', 'PART_TIME', 'CONTRACT', 'INTERN'].map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <div className="field"><label>Emergency Contact Person</label><input className="input" name="emergencyContactName" defaultValue={String(item.emergencyContactName || '')} /></div>
          <div className="field"><label>Emergency Phone</label><input className="input" name="emergencyContactPhone" defaultValue={String(item.emergencyContactPhone || '')} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={'btn btn-primary ' + (busy ? 'is-loading' : '')} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

function SubjectModal({ onClose, onDone, api, toast }: { onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [programs, setPrograms] = useState<Dict[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/v1/programs').then((r) => r.json()).then((j) => {
      if (j.success && Array.isArray(j.data)) setPrograms(j.data)
    })
  }, [])

  const toggleProgram = (id: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      name: fd.name,
      code: fd.code,
      shortName: fd.shortName || undefined,
      description: fd.description || undefined,
      subjectType: fd.subjectType || 'CORE',
      programIds: selectedPrograms,
    }
    const j = await api('/api/v1/subjects', 'POST', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Subject created', String(j.data?.name ?? ''))
      onClose(); onDone()
    } else {
      toast.error('Failed to create subject', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add Subject / Learning Area" icon={<BookOpen size={22} />} iconClass="ic-blue">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Subject Name <span className="req">*</span></label><input className="input" name="name" required placeholder="Early Literacy & Phonics" /></div>
          <div className="field"><label>Subject Code <span className="req">*</span></label><input className="input" name="code" required placeholder="LIT" /></div>
          <div className="field"><label>Short Name</label><input className="input" name="shortName" placeholder="Literacy" /></div>
          <div className="field"><label>Subject Type <span className="req">*</span></label>
            <select className="select" name="subjectType" defaultValue="CORE" required>
              <option value="CORE">CORE — Core Learning Area</option>
              <option value="OPTIONAL">OPTIONAL — Optional / Elective</option>
              <option value="ACTIVITY">ACTIVITY — Co-curricular / Activity</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><input className="input" name="description" placeholder="Foundational language and reading development" /></div>

          {programs.length > 0 && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Assign to Programs</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {programs.map((p: any) => (
                  <label key={String(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: 6 }}>
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(String(p.id))}
                      onChange={() => toggleProgram(String(p.id))}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Create Subject</button>
        </div>
      </form>
    </Modal>
  )
}

function EditSubjectModal({ item, onClose, onDone, api, toast }: { item: Dict; onClose: () => void; onDone: () => void; api: ApiFn; toast: ToastFn }) {
  const [busy, setBusy] = useState(false)
  const [programs, setPrograms] = useState<Dict[]>([])
  const initialProgramIds = useMemo(() => {
    if (Array.isArray(item.programSubjects)) {
      return item.programSubjects.map((ps: any) => String(ps.programId))
    }
    return []
  }, [item])
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(initialProgramIds)

  useEffect(() => {
    fetch('/api/v1/programs').then((r) => r.json()).then((j) => {
      if (j.success && Array.isArray(j.data)) setPrograms(j.data)
    })
  }, [])

  const toggleProgram = (id: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true)
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries())
    const payload = {
      name: fd.name,
      shortName: fd.shortName || undefined,
      description: fd.description || undefined,
      subjectType: fd.subjectType || 'CORE',
      status: fd.status || 'ACTIVE',
      programIds: selectedPrograms,
    }
    const j = await api(`/api/v1/subjects/${item.id}`, 'PATCH', payload)
    setBusy(false)
    if (j.success) {
      toast.success('Subject updated', String(item.name))
      onClose(); onDone()
    } else {
      toast.error('Failed to update subject', j.error?.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Edit Subject — ${item.name}`} icon={<BookOpen size={22} />} iconClass="ic-blue">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Subject Name <span className="req">*</span></label><input className="input" name="name" defaultValue={String(item.name || '')} required /></div>
          <div className="field"><label>Subject Code</label><input className="input" value={String(item.code || '')} disabled /></div>
          <div className="field"><label>Short Name</label><input className="input" name="shortName" defaultValue={String(item.shortName || '')} /></div>
          <div className="field"><label>Subject Type <span className="req">*</span></label>
            <select className="select" name="subjectType" defaultValue={String(item.type || 'CORE')} required>
              <option value="CORE">CORE — Core Learning Area</option>
              <option value="OPTIONAL">OPTIONAL — Optional / Elective</option>
              <option value="ACTIVITY">ACTIVITY — Co-curricular / Activity</option>
            </select>
          </div>
          <div className="field"><label>Status</label>
            <select className="select" name="status" defaultValue={item.active ? 'ACTIVE' : 'INACTIVE'}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Description</label><input className="input" name="description" defaultValue={String(item.description || '')} /></div>

          {programs.length > 0 && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Assign to Programs</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {programs.map((p: any) => (
                  <label key={String(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: 6 }}>
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(String(p.id))}
                      onChange={() => toggleProgram(String(p.id))}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn btn-primary ${busy ? 'is-loading' : ''}`} disabled={busy}>Save Changes</button>
        </div>
      </form>
    </Modal>
  )
}

