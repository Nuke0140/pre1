/**
 * Deterministic answer used only when the Claude CLI is unavailable, so the
 * chat still returns real numbers instead of an error.
 */
import type { SchoolContext } from './school-context'

const fence = (lang: string, obj: unknown) => '```' + lang + '\n' + JSON.stringify(obj) + '\n```'
const title = (p: string) => p.charAt(0) + p.slice(1).toLowerCase()

export function fallbackAnswer(ctx: SchoolContext, question: string): string {
  const closed = ctx.sessionTotals.filter((s) => s.status === 'CLOSED')
  const target = /this year|current/i.test(question)
    ? ctx.sessionTotals.find((s) => s.isCurrent) ?? ctx.sessionTotals.at(-1)!
    : closed.at(-1) ?? ctx.sessionTotals.at(-1)!
  const prev = ctx.sessionTotals[ctx.sessionTotals.indexOf(target) - 1]
  const rows = ctx.bySessionBranchProgram.filter((r) => r.session === target.session)
  const byProgram = Object.values(
    rows.reduce<Record<string, any>>((acc, r) => {
      const a = (acc[r.program] ??= { program: title(r.program), students: 0, collected: 0, outstanding: 0, achieved: [] as number[], attendance: [] as number[] })
      a.students += r.students
      a.collected += (r as any).feesINR?.collected ?? 0
      a.outstanding += (r as any).feesINR?.outstanding ?? 0
      if ((r as any).learningGoals?.achievedPct != null) a.achieved.push((r as any).learningGoals.achievedPct)
      if (r.attendanceRatePct != null) a.attendance.push(r.attendanceRatePct)
      return acc
    }, {}),
  ).map((a: any) => ({
    ...a,
    achieved: a.achieved.length ? Math.round(a.achieved.reduce((s: number, x: number) => s + x, 0) / a.achieved.length) : null,
    attendance: a.attendance.length ? Math.round(a.attendance.reduce((s: number, x: number) => s + x, 0) / a.attendance.length) : null,
  }))
  const fees = (target as any).feesINR
  const delta = prev && prev.students ? Math.round(((target.students - prev.students) / prev.students) * 1000) / 10 : undefined

  return [
    `Here's the **${target.session}** batch for **${ctx.scope}** — ${target.students} students${fees ? `, **₹${fees.collected.toLocaleString('en-IN')}** collected` : ''}, ${target.attendanceRatePct ?? '—'}% attendance.`,
    fence('kpis', {
      items: [
        { label: 'Students', value: target.students, format: 'number', ...(delta !== undefined ? { delta, deltaLabel: `vs ${prev!.session}` } : {}) },
        ...(fees ? [{ label: 'Revenue collected', value: fees.collected, format: 'inr' }, { label: 'Collection rate', value: fees.collectionRatePct, format: 'percent', tone: fees.collectionRatePct > 90 ? 'good' : 'warn' }] : []),
        { label: 'Attendance', value: target.attendanceRatePct, format: 'percent' },
        ...((target as any).learningGoalsAchievedPct != null ? [{ label: 'Goals achieved', value: (target as any).learningGoalsAchievedPct, format: 'percent' }] : []),
      ],
    }),
    fence('chart', {
      type: fees ? 'composed' : 'bar',
      title: 'By program',
      subtitle: target.session,
      xKey: 'program',
      series: fees
        ? [{ key: 'collected', label: 'Collected', format: 'inr' }, { key: 'achieved', label: 'Goals achieved %', format: 'percent', axis: 'right' }]
        : [{ key: 'students', label: 'Students', format: 'number' }],
      data: byProgram,
    }),
    fence('table', {
      title: 'Program scorecard',
      columns: [
        { key: 'program', label: 'Program' },
        { key: 'students', label: 'Students', format: 'number' },
        ...(fees ? [{ key: 'collected', label: 'Collected', format: 'inr' }, { key: 'outstanding', label: 'Outstanding', format: 'inr' }] : []),
        { key: 'attendance', label: 'Attendance', format: 'percent' },
        { key: 'achieved', label: 'Goals achieved', format: 'percent' },
      ],
      rows: byProgram,
    }),
    '_PreO AI is running in offline mode, so this is a standard summary._',
    fence('followups', { items: ['How did these students perform this year?', 'Which program has the highest dues?', 'Show monthly fee collections'] }),
  ].join('\n\n')
}
