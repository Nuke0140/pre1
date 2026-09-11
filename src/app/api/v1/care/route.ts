import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { isoDate } from '@/lib/format'
import { getDomainConfig, getDailyOps } from '@/lib/config'
import { recordChildEvent } from '@/lib/notify'
import { resolveSessionId } from '@/lib/academic'
import { raiseFollowUp } from '@/lib/followups'
import { registerIntegrations } from '@/lib/integrations'

/**
 * GET /api/v1/care?studentId=&date=&classroomId= — the daily care sheet.
 * Parent: own children only. Staff: tenant scope.
 * Record types are config-driven (DAILY_OPERATIONS.recordTypes) — nothing hardcoded.
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'timeline:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const date = sp.get('date') || isoDate()
    const studentId = sp.get('studentId')
    const classroomId = sp.get('classroomId')

    let studentIds: string[] | null = null

    if (session.role === 'PARENT') {
      const guardians = await db.guardian.findMany({
        where: { userId: session.uid, tenantId: session.tenantId },
        include: { studentLinks: { select: { studentId: true } } },
      })
      studentIds = guardians.flatMap((g) => g.studentLinks.map((l) => l.studentId))
      if (studentId && !studentIds.includes(studentId)) return Errors.forbidden('Not your child')
      if (studentIds.length === 0) return ok({ date, entries: [] })
    } else if (studentId) {
      studentIds = [studentId]
    }

    const start = new Date(`${date}T00:00:00.000Z`)
    const end = new Date(`${date}T23:59:59.999Z`)

    const entries = await db.timelineEntry.findMany({
      where: {
        tenantId: session.tenantId,
        createdAt: { gte: start, lte: end },
        ...(studentIds ? { studentId: { in: studentIds } } : {}),
        ...(classroomId ? { student: { currentClassroomId: classroomId } } : {}),
      },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return ok({
      date,
      recordTypes: getDailyOps(await getDomainConfig(session.tenantId, 'DAILY_OPERATIONS')).recordTypes,
      entries: entries.map((e) => ({
        id: e.id, studentId: e.studentId,
        studentName: `${e.student.firstName} ${e.student.lastName || ''}`.trim(),
        type: e.type, title: e.title, body: e.body, mood: e.mood, at: e.createdAt,
      })),
    })
  } catch (e) {
    return Errors.system(e)
  }
}

const CARE_TO_TIMELINE: Record<string, 'ARRIVAL' | 'MEAL' | 'NAP' | 'ACTIVITY' | 'BATHROOM' | 'INCIDENT' | 'NOTE' | 'PICKUP' | 'HEALTH_CHECK' | 'MILESTONE' | 'OBSERVATION'> = {
  ARRIVAL: 'ARRIVAL', MEALS: 'MEAL', MEAL: 'MEAL', NAP: 'NAP', BATHROOM: 'BATHROOM',
  MOOD: 'NOTE', ACTIVITIES: 'ACTIVITY', ACTIVITY: 'ACTIVITY', NOTES: 'NOTE', NOTE: 'NOTE',
  PICKUP: 'PICKUP', HEALTH_CHECK: 'HEALTH_CHECK', INCIDENT: 'INCIDENT', MILESTONE: 'MILESTONE',
  DAILY_OBSERVATION: 'OBSERVATION',
}

/**
 * POST /api/v1/care — record daily care events (teacher minimal-tap flow).
 * Body: { studentId, type, title?, body?, mood? } or { entries: [...] }
 * · type validated against DAILY_OPERATIONS config record types
 * · HEALTH_CHECK outcome NORMAL/ABNORMAL — abnormal raises HEALTH follow-up
 * · INCIDENT (category from HEALTH_SAFETY config) raises follow-up; parent alerted
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  registerIntegrations()

  try {
    const body = await req.json()
    const items = Array.isArray(body.entries) ? body.entries : [body]
    if (!items.length) return Errors.validation('Nothing to record')

    const cfg = getDailyOps(await getDomainConfig(session.tenantId, 'DAILY_OPERATIONS'))
    const healthCfg = await getDomainConfig(session.tenantId, 'HEALTH_SAFETY')
    const incidentCategories: string[] = (healthCfg.incidentCategories as string[]) || []
    const results: unknown[] = []
    const raised: { title: string; severity: string }[] = []

    for (const item of items) {
      const { studentId, type, title, body: bodyText, mood, outcome, category } = item as {
        studentId: string; type: string; title?: string; body?: string
        mood?: string; outcome?: 'NORMAL' | 'ABNORMAL'; category?: string
      }
      if (!studentId || !type) return Errors.validation('studentId and type are required per entry')

      const student = await db.student.findFirst({
        where: { id: studentId, tenantId: session.tenantId, deletedAt: null },
        include: { currentClassroom: { select: { id: true, name: true } } },
      })
      if (!student) return Errors.notFound('Student')

      const mapped = CARE_TO_TIMELINE[type]
      if (!mapped) return Errors.validation(`Unknown care type: ${type}`)
      const configured = (cfg.recordTypes || []).includes(type)
      const isSafety = type === 'HEALTH_CHECK' || type === 'INCIDENT'
      if (!configured && !isSafety) {
        return Errors.business(
          'BUSINESS_TYPE_DISABLED',
          `Record type ${type} is not enabled in Daily Operations configuration`
        )
      }
      if (type === 'INCIDENT' && category && !incidentCategories.includes(category)) {
        return Errors.validation(`category must be one of: ${incidentCategories.join(', ')}`)
      }

      const sessionRow = await resolveSessionId(session.tenantId, { classroomId: student.currentClassroomId })
      const defaultTitle = title ?? ({
        ARRIVAL: 'Arrived at school', MEAL: 'Meal recorded', NAP: 'Nap recorded',
        BATHROOM: 'Bathroom recorded', ACTIVITY: 'Activity', NOTE: 'Note',
        PICKUP: 'Picked up', HEALTH_CHECK: 'Health check', INCIDENT: 'Incident reported',
        MILESTONE: 'Milestone reached', OBSERVATION: 'Observation',
      } as Record<string, string>)[mapped]!

      const entry = await recordChildEvent({
        tenantId: session.tenantId,
        studentId,
        type: mapped,
        title: outcome && mapped === 'HEALTH_CHECK' ? `${defaultTitle} — ${outcome}` : defaultTitle,
        body: bodyText,
        mood,
        classroomId: student.currentClassroomId,
        academicSessionId: sessionRow?.id,
        actorId: session.uid,
      })

      // abnormal health check → URGENT health follow-up (+ alert via type)
      if (mapped === 'HEALTH_CHECK' && outcome === 'ABNORMAL') {
        const r = await raiseFollowUp({
          tenantId: session.tenantId,
          domain: 'HEALTH',
          severity: 'URGENT',
          title: `Health check abnormal — ${student.firstName}`,
          detail: bodyText || 'Child unwell at arrival health check. Isolation / parent action required.',
          sourceType: 'HealthCheck',
          sourceId: entry.id,
          studentId,
          classroomId: student.currentClassroomId,
          academicSessionId: sessionRow?.id,
          actorId: session.uid,
          actorName: session.name,
        })
        if (r.created) raised.push({ title: r.followUp.title, severity: r.followUp.severity })
      }

      // incident → severity by category
      if (mapped === 'INCIDENT') {
        const sev = category === 'EMERGENCY' ? 'EMERGENCY' : 'URGENT'
        const r = await raiseFollowUp({
          tenantId: session.tenantId,
          domain: 'HEALTH',
          severity: sev,
          title: title || `Incident — ${category || 'General'}`,
          detail: bodyText,
          sourceType: 'Incident',
          sourceId: entry.id,
          studentId,
          classroomId: student.currentClassroomId,
          academicSessionId: sessionRow?.id,
          actorId: session.uid,
          actorName: session.name,
        })
        if (r.created) raised.push({ title: r.followUp.title, severity: r.followUp.severity })
      }

      results.push({ entryId: entry.id, type: mapped, studentId })
    }

    return ok({ recorded: results.length, followUpsRaised: raised, results }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}
