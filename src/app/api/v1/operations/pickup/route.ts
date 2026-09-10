import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { raiseFollowUp } from '@/lib/followups'
import { recordChildEvent } from '@/lib/notify'
import { getDomainConfig, getStudentParentConfig } from '@/lib/config'
import { isoDate } from '@/lib/format'

/**
 * POST /api/v1/operations/pickup — authorised release (Spec §16, Scenario 3).
 * Body: { studentId, guardianId, pin? }
 *  · authorised guardian + (PIN match when mode is PIN_MATCH) → TimelineEntry PICKUP + audit
 *  · unauthorised / mismatch → 403 BUSINESS_PICKUP_BLOCKED + EMERGENCY SAFETY follow-up
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { studentId, guardianId, pin } = body as { studentId: string; guardianId?: string; pin?: string }
    if (!studentId) return Errors.validation('studentId is required')

    const student = await db.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId, deletedAt: null },
      include: { currentClassroom: { select: { id: true, name: true } } },
    })
    if (!student) return Errors.notFound('Student')

    const spCfg = getStudentParentConfig(await getDomainConfig(session.tenantId, 'STUDENT_PARENT'))
    const links = await db.studentGuardian.findMany({
      where: { studentId, canPickup: true },
      include: { guardian: true },
    })

    const blocked = async (detail: string) => {
      await raiseFollowUp({
        tenantId: session.tenantId!,
        domain: 'SAFETY',
        severity: 'EMERGENCY',
        title: `Unauthorised pickup attempt — ${student.firstName}`,
        detail,
        sourceType: 'PickupAttempt',
        dedupeKey: `pickup:${studentId}:${isoDate()}:${Date.now()}`,
        studentId,
        classroomId: student.currentClassroomId,
        actorId: session.uid,
        actorName: session.name,
      })
      return Errors.business('BUSINESS_PICKUP_BLOCKED', 'Release blocked — person is not an authorised pickup contact', 403)
    }

    if (!guardianId) return blocked('No guardian identified at release')

    const link = links.find((l) => l.guardianId === guardianId)
    if (!link) {
      const known = await db.guardian.findFirst({ where: { id: guardianId, tenantId: session.tenantId } })
      return blocked(known ? 'Guardian exists but is NOT authorised for pickup on this child' : 'Unknown guardian presented for pickup')
    }

    // PIN verification when configured
    if (spCfg.pickupVerification === 'PIN_MATCH' && link.guardian.pickupPin) {
      if (!pin || pin !== link.guardian.pickupPin) {
        return blocked('PIN mismatch for authorised guardian')
      }
    }

    const entry = await recordChildEvent({
      tenantId: session.tenantId,
      studentId,
      type: 'PICKUP',
      title: 'Released to authorised guardian',
      body: `${link.guardian.fullName} (${link.guardian.relationship}) — verified by ${session.name}`,
      classroomId: student.currentClassroomId,
      actorId: session.uid,
    })

    return ok({
      released: true,
      guardian: link.guardian.fullName,
      timelineEntryId: entry.id,
      releasedAt: entry.createdAt,
    })
  } catch (e) {
    return Errors.system(e)
  }
}

/** GET /api/v1/operations/pickup?studentId= — authorised pickup contacts */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'students:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!studentId) return Errors.validation('studentId is required')

  const student = await db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId } })
  if (!student) return Errors.notFound('Student')

  const links = await db.studentGuardian.findMany({
    where: { studentId },
    include: { guardian: true },
  })

  return ok({
    student: { id: student.id, name: `${student.firstName} ${student.lastName || ''}`.trim() },
    contacts: links.map((l) => ({
      guardianId: l.guardianId,
      name: l.guardian.fullName,
      relationship: l.guardian.relationship,
      phone: l.guardian.phone,
      canPickup: l.canPickup,
      isPrimary: l.isPrimary,
      pinSet: Boolean(l.guardian.pickupPin),
    })),
  })
}
