import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { raiseFollowUp } from '@/lib/followups'
import { recordChildEvent } from '@/lib/notify'
import { getDomainConfig, getOperating, getStudentParentConfig } from '@/lib/config'
import { isoDate } from '@/lib/format'

/**
 * GET /api/v1/operations/scan?code=
 * Resolves student identity from a scanned code (admissionNo, seatNumber, or studentId).
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const code = req.nextUrl.searchParams.get('code')?.trim()
  if (!code) return bad('Scan code is required', 'MISSING_CODE')

  try {
    const student = await db.student.findFirst({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        OR: [
          { admissionNo: code },
          { id: code },
          { seatNumber: code },
        ],
      },
      include: {
        currentClassroom: true,
        guardians: {
          include: { guardian: true },
        },
      },
    })

    if (!student) return notFound('Student not recognized from scan code')

    return ok({
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        seatNumber: student.seatNumber,
        name: `${student.firstName} ${student.lastName || ''}`.trim(),
        classroom: student.currentClassroom?.name || 'Unassigned',
        classroomId: student.currentClassroomId,
        photoUrl: student.photoUrl,
        guardians: student.guardians.map((g) => ({
          id: g.guardian.id,
          name: g.guardian.fullName,
          relationship: g.guardian.relationship,
          phone: g.guardian.phone,
          canPickup: g.canPickup,
          hasPin: !!g.guardian.pickupPin,
        })),
      },
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/operations/scan
 * Process scanned event: ARRIVAL or PICKUP
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'attendance:mark')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json()
    const { code, eventType, guardianId, pin } = body as {
      code: string
      eventType: 'ARRIVAL' | 'PICKUP'
      guardianId?: string
      pin?: string
    }

    if (!code || !eventType) {
      return bad('code and eventType (ARRIVAL or PICKUP) are required', 'MISSING_FIELDS')
    }

    const student = await db.student.findFirst({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        OR: [
          { admissionNo: code },
          { id: code },
          { seatNumber: code },
        ],
      },
      include: {
        currentClassroom: true,
        guardians: {
          include: { guardian: true },
        },
      },
    })

    if (!student) return notFound('Student not recognized from scan code')

    const todayStr = isoDate()
    const today = new Date(todayStr)
    const meta = getRequestMeta(req)

    if (eventType === 'ARRIVAL') {
      const opCfg = getOperating(await getDomainConfig(session.tenantId, 'OPERATING'))
      const now = new Date()
      const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const isLate = Boolean(opCfg.arrivalWindowEnd && nowHHMM > opCfg.arrivalWindowEnd)

      const attStatus = isLate ? 'LATE' : 'PRESENT'

      await db.attendance.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: today,
          },
        },
        update: {
          status: attStatus,
          markedById: session.uid,
          markedAt: now,
        },
        create: {
          tenantId: session.tenantId,
          branchId: student.branchId,
          classroomId: student.currentClassroomId || '',
          studentId: student.id,
          date: today,
          status: attStatus,
          markedById: session.uid,
          markedAt: now,
          academicSessionId: student.currentClassroom?.academicSessionId,
        },
      })

      const entry = await recordChildEvent({
        tenantId: session.tenantId,
        studentId: student.id,
        type: 'ARRIVAL',
        title: isLate ? 'Late arrival recorded' : 'Arrived at preschool',
        body: `Checked in at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} via scanner by ${session.name}`,
        classroomId: student.currentClassroomId,
        actorId: session.uid,
      })

      await recordAudit({
        tenantId: session.tenantId,
        branchId: student.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'SCAN_ARRIVAL',
        entity: 'Attendance',
        entityId: student.id,
        module: 'Operations',
        summary: `Scanned arrival for ${student.firstName} (${attStatus})`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })

      return ok({
        eventType: 'ARRIVAL',
        student: `${student.firstName} ${student.lastName || ''}`.trim(),
        status: attStatus,
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timelineId: entry.id,
      })
    } else if (eventType === 'PICKUP') {
      const spCfg = getStudentParentConfig(await getDomainConfig(session.tenantId, 'STUDENT_PARENT'))
      const link = student.guardians.find((g) => g.guardianId === guardianId && g.canPickup)

      if (!link) {
        await raiseFollowUp({
          tenantId: session.tenantId,
          domain: 'SAFETY',
          severity: 'EMERGENCY',
          title: `Scanner blocked unauthorized pickup - ${student.firstName}`,
          detail: `Unverified person attempted pickup via barcode/scanner. Blocked at gate by ${session.name}.`,
          sourceType: 'PickupAttempt',
          sourceId: guardianId || 'UNKNOWN',
          dedupeKey: `pickup-scan-block:${student.id}:${todayStr}:${Date.now()}`,
          studentId: student.id,
          classroomId: student.currentClassroomId,
          responsibleRole: 'PRINCIPAL',
        })

        await recordAudit({
          tenantId: session.tenantId,
          branchId: student.branchId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
          action: 'SCAN_PICKUP_BLOCKED',
          entity: 'Student',
          entityId: student.id,
          module: 'Operations',
          severity: 'CRITICAL',
          summary: `BLOCKED unauthorized pickup scan for ${student.firstName}`,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        })

        return forbidden('Release blocked - Person is NOT an authorized pickup contact for this child')
      }

      if (spCfg.pickupVerification === 'PIN_MATCH' && link.guardian.pickupPin) {
        if (!pin || pin.trim() !== link.guardian.pickupPin) {
          await raiseFollowUp({
            tenantId: session.tenantId,
            domain: 'SAFETY',
            severity: 'EMERGENCY',
            title: `Scanner PIN mismatch for ${link.guardian.fullName} - ${student.firstName}`,
            detail: 'Incorrect pickup security PIN entered during scan release.',
            sourceType: 'PickupAttempt',
            sourceId: link.guardianId,
            studentId: student.id,
            classroomId: student.currentClassroomId,
            responsibleRole: 'PRINCIPAL',
          })
          return forbidden('Incorrect pickup verification PIN')
        }
      }

      const now = new Date()
      const entry = await recordChildEvent({
        tenantId: session.tenantId,
        studentId: student.id,
        type: 'PICKUP',
        title: 'Released to authorized guardian',
        body: `Released to ${link.guardian.fullName} (${link.guardian.relationship}) - verified via scanner by ${session.name}`,
        classroomId: student.currentClassroomId,
        actorId: session.uid,
      })

      await recordAudit({
        tenantId: session.tenantId,
        branchId: student.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'SCAN_PICKUP_RELEASED',
        entity: 'Student',
        entityId: student.id,
        module: 'Operations',
        summary: `Authorized pickup released: ${student.firstName} to ${link.guardian.fullName}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })

      return ok({
        eventType: 'PICKUP',
        student: `${student.firstName} ${student.lastName || ''}`.trim(),
        guardian: link.guardian.fullName,
        releasedAt: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timelineId: entry.id,
      })
    }

    return bad('Invalid eventType', 'INVALID_EVENT')
  } catch (err: any) {
    return serverError(err.message)
  }
}