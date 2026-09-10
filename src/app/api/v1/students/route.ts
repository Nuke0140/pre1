import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/students — paginated list w/ search + filters (API Catalog §16) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'students:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') || '20')))
    const q = sp.get('q')?.trim()
    const classroomId = sp.get('classroomId')
    const status = sp.get('status')

    const where = {
      tenantId: session.tenantId,
      deletedAt: null,
      ...(classroomId ? { currentClassroomId: classroomId } : {}),
      ...(status ? { status: status as 'ACTIVE' } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' as const } },
              { lastName: { contains: q, mode: 'insensitive' as const } },
              { admissionNo: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, students] = await Promise.all([
      db.student.count({ where }),
      db.student.findMany({
        where,
        include: {
          currentClassroom: { select: { name: true, programType: true } },
          guardians: { include: { guardian: true }, where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return ok(
      students.map((s) => ({
        id: s.id,
        admissionNo: s.admissionNo,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        dob: s.dob,
        gender: s.gender,
        status: s.status,
        classroom: s.currentClassroom?.name ?? null,
        programType: s.currentClassroom?.programType ?? null,
        photoUrl: s.photoUrl,
        primaryGuardian: s.guardians[0]?.guardian
          ? {
              name: s.guardians[0].guardian.fullName,
              phone: s.guardians[0].guardian.phone,
              relationship: s.guardians[0].guardian.relationship,
            }
          : null,
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total }
    )
  } catch (e) {
    return Errors.system(e)
  }
}

/** POST /api/v1/students — create student + guardian (student:write) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'students:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      firstName, lastName, dob, gender, classroomId, bloodGroup, address,
      guardianName, guardianPhone, guardianRelationship,
    } = body

    if (!firstName || !dob || !gender) {
      return Errors.validation('firstName, dob and gender are required')
    }
    if (!guardianName || !guardianPhone) {
      return Errors.validation('At least one guardian with phone is required')
    }

    const branch = await db.branch.findFirst({
      where: { tenantId: session.tenantId, isMain: true },
    })
    if (!branch) return Errors.notFound('Branch')

    const count = await db.student.count({ where: { tenantId: session.tenantId } })
    const admissionNo = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    const student = await db.$transaction(async (tx) => {
      const s = await tx.student.create({
        data: {
          tenantId: session.tenantId!,
          branchId: branch.id,
          admissionNo,
          firstName,
          lastName: lastName || null,
          dob: new Date(dob),
          gender,
          bloodGroup: bloodGroup || null,
          address: address || null,
          currentClassroomId: classroomId || null,
        },
      })

      const guardian = await tx.guardian.create({
        data: {
          tenantId: session.tenantId!,
          fullName: guardianName,
          phone: guardianPhone,
          relationship: guardianRelationship || 'FATHER',
          isPrimaryContact: true,
        },
      })
      await tx.studentGuardian.create({
        data: { studentId: s.id, guardianId: guardian.id, isPrimary: true, canPickup: true, isFeePayer: true },
      })
      return s
    })

    const { audit: auditLog } = await import('@/lib/sequence')
    await auditLog({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'CREATE',
      entity: 'Student',
      entityId: student.id,
      summary: `Student ${firstName} ${lastName || ''} (${admissionNo}) admitted`,
    })

    return ok({ studentId: student.id, admissionNo }, undefined, 201)
  } catch (e) {
    return Errors.system(e)
  }
}
