'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp, Square, Plus, MessageSquare, Trash2, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown,
  Sparkles, ShieldCheck, Building2, Globe, IndianRupee, GraduationCap, Users, TrendingUp, CalendarCheck, PanelLeftClose, PanelLeft, Loader2,
} from 'lucide-react'
import { ActionBlock, ActionsBlock, ChartBlock, FollowupsBlock, InsightsBlock, KpiBlock, PendingBlock, TableBlock } from './blocks'
import './ask.css'

type Step = { label: string; detail?: string; at: number; kind?: string }
type Msg = { id: string; role: 'user' | 'assistant'; content: string; steps?: Step[]; status?: 'streaming' | 'done' | 'error'; startedAt?: number; endedAt?: number; fallback?: boolean; error?: string; vote?: 1 | -1 }
type Chat = { id: string; title: string; messages: Msg[]; updatedAt: number; branchId: string }

const STORE = 'preo-ai-chats-v1'
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const BLOCKS = ['kpis', 'chart', 'table', 'insights', 'actions', 'action', 'followups'] as const

/** Split streamed text into markdown and rich-block segments (tolerates unfinished fences). */
function parseSegments(text: string) {
  const out: { kind: 'md' | (typeof BLOCKS)[number]; body: string; done: boolean }[] = []
  const re = /```(kpis|chart|table|insights|actions|action|followups)[^\n]*\n([\s\S]*?)(```|$)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: 'md', body: text.slice(last, m.index), done: true })
    out.push({ kind: m[1] as any, body: m[2], done: m[3] === '```' })
    last = re.lastIndex
    if (m[3] !== '```') break
  }
  if (last < text.length) {
    // hide a half-typed fence opener at the tail while streaming
    out.push({ kind: 'md', body: text.slice(last).replace(/`{1,3}[a-z]*$/i, ''), done: true })
  }
  return out
}

function tryJson(s: string) {
  try { return JSON.parse(s) } catch { return null }
}

function Segments({ text, streaming, onAsk, scopeKey }: { text: string; streaming: boolean; onAsk?: (q: string) => void; scopeKey: string }) {
  const segs = useMemo(() => parseSegments(text), [text])
  return (
    <>
      {segs.map((s, i) => {
        if (s.kind === 'md') return s.body.trim() ? <div key={i} className="ai-md"><ReactMarkdown components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="ai-link">{children}</a> }}>{s.body}</ReactMarkdown></div> : null
        const spec = s.done ? tryJson(s.body.trim()) : null
        if (!spec) return streaming || !s.done ? <PendingBlock key={i} kind={s.kind} /> : null
        switch (s.kind) {
          case 'kpis': return <KpiBlock key={i} spec={spec} />
          case 'chart': return <ChartBlock key={i} spec={spec} />
          case 'table': return <TableBlock key={i} spec={spec} />
          case 'insights': return <InsightsBlock key={i} spec={spec} />
          case 'actions': return <ActionsBlock key={i} spec={spec} />
          case 'action': return streaming ? <PendingBlock key={i} kind="action" /> : <ActionBlock key={i} spec={spec} scopeKey={`${scopeKey}:${i}`} />
          case 'followups': return <FollowupsBlock key={i} spec={spec} onAsk={onAsk} />
        }
      })}
    </>
  )
}

function Thinking({ steps, live, startedAt, endedAt }: { steps: Step[]; live: boolean; startedAt?: number; endedAt?: number }) {
  const [open, setOpen] = useState(true)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [live])
  useEffect(() => { if (!live) setOpen(false) }, [live])
  const secs = (((endedAt ?? now) - (startedAt ?? now)) / 1000).toFixed(1)
  return (
    <div className={`ai-thinking ${live ? 'live' : ''}`}>
      <button className="ai-thinking-head" onClick={() => setOpen((o) => !o)}>
        {live ? <span className="ai-orb-mini" /> : <ShieldCheck size={15} />}
        <span>{live ? steps.at(-1)?.label ?? 'Thinking' : `Analysed your school data in ${secs}s`}</span>
        {live && <span className="ai-elapsed">{secs}s</span>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {steps.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                {live && i === steps.length - 1 ? <Loader2 size={13} className="spin" /> : (s as any).kind === 'web' ? <Globe size={13} /> : <Check size={13} />}
                <span><b>{s.label}</b>{s.detail ? <em> — {s.detail}</em> : null}</span>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AskClient({ userName, schoolName, branches, canPickBranch, defaultBranchId }: { userName: string; schoolName: string; branches: { id: string; name: string }[]; canPickBranch: boolean; defaultBranchId: string }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [sidebar, setSidebar] = useState(true)
  const [branchId, setBranchId] = useState(defaultBranchId)
  const [copied, setCopied] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const stickRef = useRef(true)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '[]') as Chat[]
      setChats(saved.map((c) => ({ ...c, messages: c.messages.map((m) => (m.status === 'streaming' ? { ...m, status: 'done' } : m)) })))
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(chats.slice(0, 40))) } catch {}
  }, [chats])

  const active = chats.find((c) => c.id === activeId) ?? null
  const messages = active?.messages ?? []

  useEffect(() => {
    const onScroll = () => { stickRef.current = window.innerHeight + window.scrollY >= document.body.scrollHeight - 160 }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (stickRef.current) endRef.current?.scrollIntoView({ behavior: busy ? 'auto' : 'smooth', block: 'end' })
  }, [messages, busy])

  const patchMsg = (chatId: string, msgId: string, fn: (m: Msg) => Msg) =>
    setChats((cs) => cs.map((c) => (c.id !== chatId ? c : { ...c, updatedAt: Date.now(), messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) })))

  const ask = useCallback(async (raw: string, opts?: { replaceFrom?: string }) => {
    const question = raw.trim()
    if (!question || busy) return
    setInput('')
    stickRef.current = true
    let chatId = activeId
    let history: Msg[] = active?.messages ?? []
    if (opts?.replaceFrom) history = history.slice(0, history.findIndex((m) => m.id === opts.replaceFrom))
    const userMsg: Msg = { id: uid(), role: 'user', content: question }
    const botMsg: Msg = { id: uid(), role: 'assistant', content: '', steps: [{ label: 'Understanding your question', at: Date.now() }], status: 'streaming', startedAt: Date.now() }
    if (!chatId) {
      chatId = uid()
      const chat: Chat = { id: chatId, title: question.slice(0, 60), messages: [userMsg, botMsg], updatedAt: Date.now(), branchId }
      setChats((cs) => [chat, ...cs])
      setActiveId(chatId)
    } else {
      const base = opts?.replaceFrom ? history : history
      setChats((cs) => cs.map((c) => (c.id === chatId ? { ...c, messages: [...base, userMsg, botMsg], updatedAt: Date.now() } : c)))
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl
    setBusy(true)
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          branchId,
          history: history.filter((m) => m.status !== 'error').map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error?.message || `Request failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let sep: number
        while ((sep = buf.indexOf('\n\n')) >= 0) {
          const raw = buf.slice(0, sep)
          buf = buf.slice(sep + 2)
          const ev = /^event: (.+)$/m.exec(raw)?.[1]
          const data = tryJson(/^data: (.+)$/m.exec(raw)?.[1] ?? 'null')
          if (!ev) continue
          if (ev === 'status') patchMsg(chatId!, botMsg.id, (m) => ({ ...m, steps: [...(m.steps ?? []), { ...data, at: Date.now() }] }))
          else if (ev === 'delta') patchMsg(chatId!, botMsg.id, (m) => ({ ...m, content: m.content + (data?.text ?? '') }))
          else if (ev === 'done') patchMsg(chatId!, botMsg.id, (m) => ({ ...m, status: 'done', endedAt: Date.now(), fallback: !!data?.fallback }))
          else if (ev === 'error') patchMsg(chatId!, botMsg.id, (m) => ({ ...m, status: 'error', endedAt: Date.now(), error: data?.message }))
        }
      }
      patchMsg(chatId!, botMsg.id, (m) => (m.status === 'streaming' ? { ...m, status: 'done', endedAt: Date.now() } : m))
    } catch (e: any) {
      const stopped = e?.name === 'AbortError'
      patchMsg(chatId!, botMsg.id, (m) => ({ ...m, status: stopped ? 'done' : 'error', endedAt: Date.now(), error: stopped ? undefined : e?.message || 'Something went wrong', content: m.content + (stopped ? '\n\n_Stopped._' : '') }))
    } finally {
      setBusy(false)
      abortRef.current = null
      setTimeout(() => taRef.current?.focus(), 50)
    }
  }, [active, activeId, branchId, busy])

  const newChat = () => { abortRef.current?.abort(); setActiveId(null); setInput(''); taRef.current?.focus() }
  const removeChat = (id: string) => { setChats((cs) => cs.filter((c) => c.id !== id)); if (id === activeId) setActiveId(null) }
  const autosize = () => { const t = taRef.current; if (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 220) + 'px' } }
  useEffect(autosize, [input])

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const first = userName.split(' ')[0]
  const branchLabel = branchId === 'ALL' ? 'all branches' : branches.find((b) => b.id === branchId)?.name ?? 'this branch'

  const suggestions = [
    { icon: <IndianRupee size={18} />, title: "Last year's batch report", q: `What was last year's preschool batch revenue and student count for ${branchLabel}, and how did those students perform?` },
    { icon: <TrendingUp size={18} />, title: 'Fee collection trend', q: 'Show monthly fee collections for the last 18 months and highlight any dips.' },
    { icon: <GraduationCap size={18} />, title: 'Learning outcomes', q: 'Which program has the best learning outcomes this year, and which needs attention?' },
    { icon: <Users size={18} />, title: 'Admissions funnel', q: 'How are admissions converting this year compared to last year? Which lead sources work best?' },
    { icon: <CalendarCheck size={18} />, title: 'Attendance health', q: 'Which classrooms have the lowest attendance in the last 30 days and how full are they?' },
    { icon: <Building2 size={18} />, title: '3-year growth', q: 'Give me a 3-year executive summary of students, revenue and outcomes.' },
  ]

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  return (
    <div className={`ai-root ${sidebar ? 'with-side' : ''}`}>
      <aside className="ai-side">
        <div className="ai-side-top">
          <button className="ai-new" onClick={newChat}><Plus size={16} /> New chat</button>
          <button className="ai-icon" onClick={() => setSidebar(false)} title="Hide history"><PanelLeftClose size={16} /></button>
        </div>
        <div className="ai-side-label">Recent</div>
        <div className="ai-side-list">
          {chats.length === 0 && <div className="ai-side-empty">Your conversations appear here.</div>}
          {chats.map((c) => (
            <div key={c.id} className={`ai-side-item ${c.id === activeId ? 'on' : ''}`} onClick={() => setActiveId(c.id)}>
              <MessageSquare size={14} />
              <span>{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); removeChat(c.id) }} title="Delete"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="ai-side-foot">
          <ShieldCheck size={14} /> <span>Answers use only data your role can access in <b>{schoolName}</b>.</span>
        </div>
      </aside>

      <main className="ai-main">
        <div className="ai-topbar">
          {!sidebar && <button className="ai-icon" onClick={() => setSidebar(true)} title="Show history"><PanelLeft size={16} /></button>}
          <div className="ai-brand"><span className="ai-orb-mini" /> PreO AI <span className="ai-beta">Copilot</span></div>
          <div className="ai-scope">
            <Building2 size={14} />
            {canPickBranch && branches.length > 1 ? (
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={busy}>
                <option value="ALL">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            ) : (
              <span>{branches.find((b) => b.id === branchId)?.name ?? branches[0]?.name ?? schoolName}</span>
            )}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="ai-hero">
            <motion.div className="ai-orb" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              {greet}, {first}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              Ask anything about {schoolName} — enrolments, fees, attendance, learning outcomes, admissions or staff. I'll answer with live numbers and charts.
            </motion.p>
            <div className="ai-suggest">
              {suggestions.map((s, i) => (
                <motion.button key={i} onClick={() => ask(s.q)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }} whileHover={{ y: -3 }}>
                  <span className="ai-suggest-icon">{s.icon}</span>
                  <b>{s.title}</b>
                  <span>{s.q}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-thread">
            {messages.map((m) =>
              m.role === 'user' ? (
                <motion.div key={m.id} className="ai-user" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="ai-user-bubble">{m.content}</div>
                </motion.div>
              ) : (
                <div key={m.id} className="ai-bot">
                  <div className="ai-avatar"><Sparkles size={16} /></div>
                  <div className="ai-bot-body">
                    {!!m.steps?.length && <Thinking steps={m.steps} live={m.status === 'streaming' && !m.content} startedAt={m.startedAt} endedAt={m.endedAt} />}
                    <Segments text={m.content} streaming={m.status === 'streaming'} onAsk={m.id === lastAssistantId && !busy ? ask : undefined} scopeKey={m.id} />
                    {m.status === 'streaming' && m.content && <span className="ai-caret" />}
                    {m.status === 'error' && <div className="ai-error">{m.error} <button onClick={() => { const q = messages[messages.indexOf(m) - 1]?.content; if (q) ask(q, { replaceFrom: messages[messages.indexOf(m) - 1].id }) }}>Retry</button></div>}
                    {m.status === 'done' && (
                      <div className="ai-msg-actions">
                        <button onClick={() => { navigator.clipboard.writeText(m.content.replace(/```[a-z]+\n[\s\S]*?```/g, '').trim()); setCopied(m.id); setTimeout(() => setCopied(null), 1400) }} title="Copy">
                          {copied === m.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => { const i = messages.indexOf(m); const q = messages[i - 1]; if (q) ask(q.content, { replaceFrom: q.id }) }} title="Regenerate" disabled={busy}><RotateCcw size={14} /></button>
                        <button className={m.vote === 1 ? 'on' : ''} onClick={() => patchMsg(active!.id, m.id, (x) => ({ ...x, vote: x.vote === 1 ? undefined : 1 }))} title="Good answer"><ThumbsUp size={14} /></button>
                        <button className={m.vote === -1 ? 'on' : ''} onClick={() => patchMsg(active!.id, m.id, (x) => ({ ...x, vote: x.vote === -1 ? undefined : -1 }))} title="Bad answer"><ThumbsDown size={14} /></button>
                        {m.fallback && <span className="ai-tag">offline summary</span>}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            <div ref={endRef} style={{ height: 1 }} />
          </div>
        )}

        <div className="ai-composer-wrap">
          <form className="ai-composer" onSubmit={(e) => { e.preventDefault(); ask(input) }}>
            <textarea
              ref={taRef}
              value={input}
              rows={1}
              autoFocus
              placeholder={`Ask PreO AI about ${branchLabel}…`}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(input) } }}
            />
            {busy ? (
              <button type="button" className="ai-send stop" onClick={() => abortRef.current?.abort()} title="Stop"><Square size={14} fill="currentColor" /></button>
            ) : (
              <button type="submit" className="ai-send" disabled={!input.trim()} title="Send"><ArrowUp size={18} /></button>
            )}
          </form>
          <div className="ai-disclaimer">PreO AI reads live school records scoped to your role. Verify important figures before acting.</div>
        </div>
      </main>
    </div>
  )
}
