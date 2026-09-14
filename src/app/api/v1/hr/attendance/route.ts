import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AuditService } from '@/lib/audit/audit-service'

export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const dateStr = sp.get('date') || new Date().toISOString().split('T')[0]
    const branchId = sp.get('branchId') || undefined

    const date = new Date(dateStr)

    // Fetch active staff
    const staffList = await db.staffProfile.findMany({
      where: {
        tenantId: session.tenantId,
        ...(branchId ? { branchId } : {}),
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    })

    // Fetch punches for this day
    const punches = await db.attendanceStaff.findMany({
      where: {
        tenantId: session.tenantId,
        date,
      },
    })
    const punchMap = new Map(punches.map((p) => [p.staffProfileId, p]))

    const records = staffList.map((s) => {
      const p = punchMap.get(s.id)
      return {
        staffProfileId: s.id,
        employeeCode: s.employeeCode,
        name: s.user.fullName,
        designation: s.designation,
        branchName: s.branch?.name || null,
        status: p?.status || 'UNMARKED',
        checkIn: p?.checkIn || null,
        checkOut: p?.checkOut || null,
        workedHours: p?.workedHours ?? 0,
        lateMinutes: p?.lateMinutes ?? 0,
        source: p?.source || 'MANUAL',
        notes: p?.notes || null,
      }
    })

    return ok({ date: dateStr, records })
  } catch (e) {
    return Errors.system(e)
  }
}

export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'hr:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { date, entries } = body as {
      date: string
      entries: Array<{
        staffProfileId: string
        status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF'
        checkIn?: string
        checkOut?: string
        notes?: string
      }>
    }

    if (!date || !Array.isArray(entries)) {
      return Errors.validation('date and entries[] are required')
    }

    const punchDate = new Date(date)

    await db.$transaction(async (tx) => {
      for (const e of entries) {
        const staff = await tx.staffProfile.findFirst({
          where: { id: e.staffProfileId, tenantId: session.tenantId! },
        })
        if (!staff) continue

        let workedHours = 0
        let lateMinutes = 0
        if (e.checkIn && e.checkOut) {
          const inT = new Date(e.checkIn).getTime()
          const outT = new Date(e.checkOut).getTime()
          if (outT > inT) workedHours = parseFloat(((outT - inT) / (1000 * 60 * 60)).toFixed(2))
        }

        if (e.status === 'LATE') lateMinutes = 30

        await tx.attendanceStaff.upsert({
          where: {
            staffProfileId_date: {
              staffProfileId: e.staffProfileId,
              date: punchDate,
            },
          },
          create: {
            tenantId: session.tenantId!,
            branchId: staff.branchId || '',
            staffProfileId: e.staffProfileId,
            date: punchDate,
            status: e.status,
            checkIn: e.checkIn ? new Date(e.checkIn) : null,
            checkOut: e.checkOut ? new Date(e.checkOut) : null,
            shiftHours: 8,
            workedHours,
            lateMinutes,
            source: 'MANUAL',
            notes: e.notes || null,
            markedById: session.uid,
            markedByName: session.name,
          },
          update: {
            status: e.status,
            checkIn: e.checkIn ? new Date(e.checkIn) : null,
            checkOut: e.checkOut ? new Date(e.checkOut) : null,
            workedHours,
            lateMinutes,
            notes: e.notes || null,
            markedById: session.uid,
            markedByName: session.name,
          },
        })
      }

      await AuditService.record({
        tenantId: session.tenantId!,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
        action: 'STAFF_ATTENDANCE_MARKED',
        entity: 'AttendanceStaff',
        module: 'HR',
        summary: `Marked staff attendance for ${entries.length} members on ${date}`,
        severity: 'INFO',
      }, tx)
    })

    return ok({ success: true, count: entries.length })
  } catch (e: any) {
    return Errors.validation(e.message || 'Failed to record staff attendance')
  }
}
