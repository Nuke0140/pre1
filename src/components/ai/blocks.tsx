'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { animate, motion } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import {
  BarChart3, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon, Table2, Download,
  TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, XCircle, Info, ArrowUpRight, Sparkles,
  CalendarCheck, Receipt, Megaphone,
} from 'lucide-react'

export type Fmt = 'number' | 'inr' | 'percent' | undefined

export const PALETTE = ['#7C3AED', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#3B82F6', '#EF4444', '#84CC16', '#8B5CF6', '#14B8A6']

export function formatValue(v: unknown, fmt: Fmt, compact = false): string {
  if (v === null || v === undefined || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return String(v)
  if (fmt === 'percent') return `${Math.round(n * 10) / 10}%`
  if (fmt === 'inr') {
    if (compact || Math.abs(n) >= 1e7) {
      if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
      if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`
      if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
    }
    return `₹${Math.round(n).toLocaleString('en-IN')}`
  }
  if (compact && Math.abs(n) >= 1e5) return `${(n / 1e5).toFixed(1)}L`
  if (compact && Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return Math.round(n * 100) / 100 === Math.round(n) ? Math.round(n).toLocaleString('en-IN') : n.toLocaleString('en-IN', { maximumFractionDigits: 1 })
}

/* ───────────────────────── KPI cards ───────────────────────── */

function CountUp({ value, fmt }: { value: number; fmt: Fmt }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const c = animate(0, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: setShown })
    return () => c.stop()
  }, [value])
  return <>{formatValue(fmt === 'percent' ? Math.round(shown * 10) / 10 : Math.round(shown), fmt, fmt === 'inr' && value >= 1e5)}</>
}

export function KpiBlock({ spec }: { spec: any }) {
  const items: any[] = Array.isArray(spec?.items) ? spec.items : []
  return (
    <div className="ai-kpis" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${items.length > 3 ? 150 : 180}px, 1fr))` }}>
      {items.map((it, i) => {
        const tone = it.tone ?? (typeof it.delta === 'number' ? (it.delta >= 0 ? 'good' : 'bad') : undefined)
        return (
          <motion.div
            key={i}
            className={`ai-kpi tone-${tone ?? 'none'}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ai-kpi-label">{it.label}</div>
            <div className="ai-kpi-value">
              {typeof it.value === 'number' ? <CountUp value={it.value} fmt={it.format} /> : String(it.value ?? '—')}
            </div>
            {(typeof it.delta === 'number' || it.hint) && (
              <div className="ai-kpi-foot">
                {typeof it.delta === 'number' && (
                  <span className={`ai-delta ${it.delta >= 0 ? 'up' : 'down'}`}>
                    {it.delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {it.delta > 0 ? '+' : ''}
                    {Math.round(it.delta * 10) / 10}%
                  </span>
                )}
                <span className="ai-kpi-hint">{it.deltaLabel ?? it.hint}</span>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

/* ───────────────────────── Charts ───────────────────────── */

function ChartTooltip({ active, payload, label, series }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="ai-tooltip">
      <div className="ai-tooltip-title">{label ?? payload[0]?.name}</div>
      {payload.map((p: any, i: number) => {
        const s = series.find((x: any) => x.key === p.dataKey) ?? series[0]
        return (
          <div key={i} className="ai-tooltip-row">
            <span className="ai-dot" style={{ background: p.color || p.payload?.fill }} />
            <span>{s?.label ?? p.name}</span>
            <b>{formatValue(p.value, s?.format)}</b>
          </div>
        )
      })}
    </div>
  )
}

type CType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'radar' | 'composed'

export function ChartBlock({ spec }: { spec: any }) {
  const initial: CType = (['bar', 'line', 'area', 'pie', 'donut', 'radar', 'composed'].includes(spec?.type) ? spec.type : 'bar') as CType
  const [type, setType] = useState<CType>(initial)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [asTable, setAsTable] = useState(false)
  const xKey: string = spec?.xKey ?? 'label'
  const data: any[] = Array.isArray(spec?.data) ? spec.data : []
  const series: any[] = (Array.isArray(spec?.series) && spec.series.length ? spec.series : [{ key: 'value', label: 'Value' }]).map((s: any, i: number) => ({ ...s, color: s.color ?? PALETTE[i % PALETTE.length] }))
  const visible = series.filter((s) => !hidden.has(s.key))
  const rightAxis = series.some((s) => s.axis === 'right')
  const leftFmt: Fmt = series.find((s) => s.axis !== 'right')?.format
  const rightFmt: Fmt = series.find((s) => s.axis === 'right')?.format
  const isCircular = type === 'pie' || type === 'donut'
  const switchable: CType[] = isCircular ? ['pie', 'donut', 'bar'] : ['bar', 'line', 'area', ...(initial === 'composed' ? (['composed'] as CType[]) : []), ...(initial === 'radar' ? (['radar'] as CType[]) : [])]
  const toggle = (k: string) => setHidden((h) => { const n = new Set(h); n.has(k) ? n.delete(k) : n.add(k); return n })

  // recharts only scans direct children, so axes must be an array, not a fragment
  const axes = [
    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="var(--ai-grid)" />,
    <XAxis key="x" dataKey={xKey} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--ai-muted)' }} interval={0} angle={data.length > 8 ? -30 : 0} textAnchor={data.length > 8 ? 'end' : 'middle'} height={data.length > 8 ? 54 : 30} />,
    <YAxis key="yl" yAxisId="left" tickLine={false} axisLine={false} width={64} tick={{ fontSize: 12, fill: 'var(--ai-muted)' }} tickFormatter={(v) => formatValue(v, leftFmt, true)} />,
    ...(rightAxis ? [<YAxis key="yr" yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={52} tick={{ fontSize: 12, fill: 'var(--ai-muted)' }} tickFormatter={(v) => formatValue(v, rightFmt, true)} />] : []),
    <Tooltip key="tt" content={<ChartTooltip series={series} />} cursor={{ fill: 'var(--ai-cursor)' }} />,
  ]
  const axisOf = (s: any) => (rightAxis && s.axis === 'right' ? 'right' : 'left')

  let chart: React.ReactNode
  if (isCircular) {
    const s = series[0]
    chart = (
      <PieChart>
        <Tooltip content={<ChartTooltip series={series} />} />
        <Pie data={data} dataKey={s.key} nameKey={xKey} innerRadius={type === 'donut' ? '58%' : 0} outerRadius="82%" paddingAngle={type === 'donut' ? 2 : 0} stroke="var(--ai-surface)" strokeWidth={2} animationDuration={900}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    )
  } else if (type === 'radar') {
    chart = (
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--ai-grid)" />
        <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 12, fill: 'var(--ai-muted)' }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Tooltip content={<ChartTooltip series={series} />} />
        {visible.map((s) => <Radar key={s.key} dataKey={s.key} name={s.label} stroke={s.color} fill={s.color} fillOpacity={0.22} />)}
      </RadarChart>
    )
  } else if (type === 'line') {
    chart = <LineChart data={data}>{axes}{visible.map((s) => <Line key={s.key} yAxisId={axisOf(s)} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} animationDuration={900} />)}</LineChart>
  } else if (type === 'area') {
    chart = (
      <AreaChart data={data}>
        <defs>{series.map((s) => <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.35} /><stop offset="100%" stopColor={s.color} stopOpacity={0.02} /></linearGradient>)}</defs>
        {axes}
        {visible.map((s) => <Area key={s.key} yAxisId={axisOf(s)} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} fill={`url(#g-${s.key})`} stackId={spec?.stacked ? 'a' : undefined} animationDuration={900} />)}
      </AreaChart>
    )
  } else if (type === 'composed') {
    chart = (
      <ComposedChart data={data}>
        {axes}
        {visible.map((s, i) => series.indexOf(s) === 0
          ? <Bar key={s.key} yAxisId={axisOf(s)} dataKey={s.key} name={s.label} fill={s.color} radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={900} />
          : <Line key={s.key} yAxisId={axisOf(s)} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={{ r: 4 }} />)}
      </ComposedChart>
    )
  } else {
    chart = (
      <BarChart data={data}>
        {axes}
        {visible.map((s, i) => <Bar key={s.key} yAxisId={axisOf(s)} dataKey={s.key} name={s.label} fill={s.color} radius={spec?.stacked ? (i === visible.length - 1 ? [6, 6, 0, 0] : 0) : [6, 6, 0, 0]} maxBarSize={48} stackId={spec?.stacked ? 'a' : undefined} animationDuration={900} />)}
      </BarChart>
    )
  }

  const icon = (t: CType) => (t === 'line' ? <LineIcon size={14} /> : t === 'area' ? <AreaIcon size={14} /> : t === 'pie' || t === 'donut' ? <PieIcon size={14} /> : <BarChart3 size={14} />)

  return (
    <motion.div className="ai-card ai-chart" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="ai-card-head">
        <div>
          <div className="ai-card-title">{spec?.title ?? 'Chart'}</div>
          {spec?.subtitle && <div className="ai-card-sub">{spec.subtitle}</div>}
        </div>
        <div className="ai-seg">
          {switchable.map((t) => (
            <button key={t} className={!asTable && type === t ? 'on' : ''} onClick={() => { setType(t); setAsTable(false) }} title={t}>
              {icon(t)}
            </button>
          ))}
          <button className={asTable ? 'on' : ''} onClick={() => setAsTable((v) => !v)} title="Show data">
            <Table2 size={14} />
          </button>
        </div>
      </div>
      {!isCircular && series.length > 1 && !asTable && (
        <div className="ai-legend">
          {series.map((s) => (
            <button key={s.key} className={hidden.has(s.key) ? 'off' : ''} onClick={() => toggle(s.key)}>
              <span className="ai-dot" style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      )}
      {asTable ? (
        <DataTable columns={[{ key: xKey, label: spec?.xLabel ?? xKey }, ...series.map((s) => ({ key: s.key, label: s.label, format: s.format }))]} rows={data} />
      ) : (
        <div className="ai-chart-box">
          <ResponsiveContainer width="100%" height="100%">{chart as any}</ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}

/* ───────────────────────── Tables ───────────────────────── */

function DataTable({ columns, rows }: { columns: any[]; rows: any[] }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key]
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir
      return String(x ?? '').localeCompare(String(y ?? '')) * sort.dir
    })
  }, [rows, sort])
  return (
    <div className="ai-table-wrap">
      <table className="ai-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} onClick={() => setSort((s) => ({ key: c.key, dir: s && s.key === c.key && s.dir === -1 ? 1 : -1 }))} className={c.format ? 'num' : ''}>
                {c.label}
                {sort && sort.key === c.key ? (sort.dir === -1 ? ' ↓' : ' ↑') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.key} className={c.format ? 'num' : ''}>{c.format ? formatValue(r[c.key], c.format) : String(r[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TableBlock({ spec }: { spec: any }) {
  const columns: any[] = Array.isArray(spec?.columns) ? spec.columns : []
  const rows: any[] = Array.isArray(spec?.rows) ? spec.rows : []
  const download = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${(spec?.title ?? 'preo-ai').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
    a.click()
  }
  return (
    <motion.div className="ai-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div className="ai-card-head">
        <div className="ai-card-title">{spec?.title ?? 'Table'}</div>
        <button className="ai-ghost" onClick={download}><Download size={14} /> CSV</button>
      </div>
      <DataTable columns={columns} rows={rows} />
    </motion.div>
  )
}

/* ───────────────────────── Insights / actions / follow-ups ───────────────────────── */

/** Minimal inline **bold** support for text inside JSON blocks. */
function Rich({ text }: { text: string }) {
  return <>{String(text ?? '').split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p))}</>
}

const TONE_ICON: Record<string, React.ReactNode> = {
  good: <CheckCircle2 size={17} />,
  warn: <AlertTriangle size={17} />,
  bad: <XCircle size={17} />,
  info: <Info size={17} />,
}

export function InsightsBlock({ spec }: { spec: any }) {
  const items: any[] = Array.isArray(spec?.items) ? spec.items : []
  return (
    <div className="ai-insights">
      {items.map((it, i) => (
        <motion.div key={i} className={`ai-insight tone-${it.tone ?? 'info'}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
          <span className="ai-insight-icon">{TONE_ICON[it.tone] ?? TONE_ICON.info}</span>
          <div>
            <div className="ai-insight-title"><Rich text={it.title} /></div>
            {it.body && <div className="ai-insight-body"><Rich text={it.body} /></div>}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function ActionsBlock({ spec }: { spec: any }) {
  const items: any[] = Array.isArray(spec?.items) ? spec.items.filter((x: any) => typeof x?.href === 'string' && x.href.startsWith('/app/')) : []
  return (
    <div className="ai-actions">
      {items.map((it, i) => (
        <Link key={i} href={it.href} className="ai-action">
          {it.label} <ArrowUpRight size={14} />
        </Link>
      ))}
    </div>
  )
}

export function FollowupsBlock({ spec, onAsk }: { spec: any; onAsk?: (q: string) => void }) {
  const items: string[] = Array.isArray(spec?.items) ? spec.items.filter((x: any) => typeof x === 'string') : []
  if (!onAsk) return null
  return (
    <div className="ai-followups">
      {items.map((q, i) => (
        <motion.button key={i} onClick={() => onAsk(q)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
          <Sparkles size={13} /> {q}
        </motion.button>
      ))}
    </div>
  )
}

export function PendingBlock({ kind }: { kind: string }) {
  const label: Record<string, string> = { action: 'Preparing action preview', chart: 'Drawing chart', kpis: 'Computing KPIs', table: 'Building table', insights: 'Finding insights', actions: 'Linking modules', followups: 'Thinking of next questions' }
  return (
    <div className={`ai-pending kind-${kind}`}>
      <div className="ai-shimmer" />
      <span><Sparkles size={14} /> {label[kind] ?? 'Rendering'}…</span>
    </div>
  )
}

/* ───────────────────────── Action card (human-approved writes) ───────────────────────── */

type ActionState =
  | { phase: 'loading' }
  | { phase: 'preview'; preview: any }
  | { phase: 'running'; preview: any }
  | { phase: 'done'; preview: any; result: any }
  | { phase: 'cancelled'; preview: any }
  | { phase: 'failed'; preview: any; error: string }

const ACTION_STORE = 'preo-ai-actions-v1'
const readStore = (): Record<string, any> => { try { return JSON.parse(localStorage.getItem(ACTION_STORE) || '{}') } catch { return {} } }
const writeStore = (k: string, v: any) => { try { const s = readStore(); s[k] = v; localStorage.setItem(ACTION_STORE, JSON.stringify(s)) } catch {} }

function hashKey(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return 'a' + (h >>> 0).toString(36) + s.length.toString(36)
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  mark_attendance: <CalendarCheck size={18} />,
  record_payment: <Receipt size={18} />,
  draft_announcement: <Megaphone size={18} />,
}

export function ActionBlock({ spec, scopeKey }: { spec: any; scopeKey: string }) {
  const key = useMemo(() => hashKey(scopeKey + JSON.stringify(spec)), [scopeKey, spec])
  const [st, setSt] = useState<ActionState>({ phase: 'loading' })

  useEffect(() => {
    const saved = readStore()[key]
    if (saved?.phase === 'done' || saved?.phase === 'cancelled') { setSt(saved); return }
    let alive = true
    fetch('/api/v1/ai/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'preview', action: spec }) })
      .then((r) => r.json())
      .then((j) => { if (alive) setSt({ phase: 'preview', preview: j.data ?? { ok: false, error: j.error?.message ?? 'Could not prepare action', lines: [], warnings: [] } }) })
      .catch(() => alive && setSt({ phase: 'preview', preview: { ok: false, error: 'Network error', lines: [], warnings: [] } }))
    return () => { alive = false }
  }, [key, spec])

  const approve = async () => {
    if (st.phase !== 'preview') return
    const preview = st.preview
    setSt({ phase: 'running', preview })
    try {
      const j = await (await fetch('/api/v1/ai/actions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'execute', action: spec, key: key.replace(/[^a-z0-9]/gi, '').padEnd(8, '0') }) })).json()
      const result = j.data
      if (result?.ok) { const next = { phase: 'done' as const, preview, result }; setSt(next); writeStore(key, next) }
      else setSt({ phase: 'failed', preview, error: result?.error ?? j.error?.message ?? 'Action failed' })
    } catch { setSt({ phase: 'failed', preview, error: 'Network error' }) }
  }
  const cancel = () => { if (st.phase === 'preview' || st.phase === 'failed') { const next = { phase: 'cancelled' as const, preview: st.preview }; setSt(next); writeStore(key, next) } }

  if (st.phase === 'loading') return <PendingBlock kind="action" />
  const p = st.preview
  const done = st.phase === 'done'
  return (
    <motion.div className={`ai-card ai-action-card phase-${st.phase} ${p.ok ? '' : 'invalid'}`} initial={{ opacity: 0, y: 12, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}>
      <div className="ai-action-head">
        <span className="ai-action-icon">{done ? <CheckCircle2 size={18} /> : ACTION_ICON[spec?.type] ?? <Sparkles size={18} />}</span>
        <div>
          <div className="ai-action-kicker">{done ? 'Completed' : st.phase === 'cancelled' ? 'Cancelled' : p.ok ? 'Needs your approval' : 'Cannot run'}</div>
          <div className="ai-card-title">{done ? st.result.title : p.title}</div>
          {!done && p.description && <div className="ai-card-sub">{p.description}</div>}
        </div>
      </div>
      {!p.ok && <div className="ai-action-error"><XCircle size={15} /> {p.error}</div>}
      {(done ? st.result.lines : p.lines)?.length > 0 && (
        <div className="ai-action-lines">
          {(done ? st.result.lines : p.lines).map((l: any, i: number) => (
            <div key={i}><span>{l.label}</span><b>{l.value}</b></div>
          ))}
        </div>
      )}
      {!done && Array.isArray(p.rows) && p.rows.length > 0 && (
        <div className="ai-action-rows">
          {p.rows.map((r: any, i: number) => (
            <span key={i} className={`tone-${r.tone ?? 'none'}`} title={r.detail}>
              <i />{r.name}<em>{r.detail}</em>
            </span>
          ))}
        </div>
      )}
      {!done && p.warnings?.map((w: string, i: number) => <div key={i} className="ai-action-warn"><AlertTriangle size={14} /> {w}</div>)}
      {st.phase === 'failed' && <div className="ai-action-error"><XCircle size={15} /> {st.error}</div>}
      <div className="ai-action-foot">
        {done ? (
          st.result.link ? <Link href={st.result.link.href} className="ai-action">{st.result.link.label} <ArrowUpRight size={14} /></Link> : null
        ) : st.phase === 'cancelled' ? (
          <span className="ai-action-muted">No changes were made.</span>
        ) : p.ok ? (
          <>
            <button className="ai-approve" onClick={approve} disabled={st.phase === 'running'}>
              {st.phase === 'running' ? <span className="ai-orb-mini" /> : <CheckCircle2 size={15} />} {st.phase === 'running' ? 'Saving…' : p.confirmLabel || 'Approve'}
            </button>
            <button className="ai-ghost" onClick={cancel} disabled={st.phase === 'running'}>Cancel</button>
            <span className="ai-action-muted">Nothing changes until you approve.</span>
          </>
        ) : null}
      </div>
    </motion.div>
  )
}
