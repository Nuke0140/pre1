import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/** GET /api/v1/students - paginated list w/ search + filters (API Catalog §16) */
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

/** POST /api/v1/students - create student + guardian (student:write) */
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

    let classroom: { id: string; academicSessionId: string; programType: any; capacity: number } | null = null
    if (classroomId) {
      classroom = await db.classroom.findFirst({
        where: { id: classroomId, tenantId: session.tenantId, isActive: true },
        select: { id: true, academicSessionId: true, programType: true, capacity: true },
      })
      if (!classroom) return Errors.notFound('Classroom')

      const activeInClass = await db.student.count({
        where: { currentClassroomId: classroom.id, tenantId: session.tenantId, status: 'ACTIVE', deletedAt: null },
      })
      if (activeInClass >= classroom.capacity) {
        return Errors.business(
          'BUSINESS_CLASS_FULL',
          `Classroom is at full capacity (${activeInClass}/${classroom.capacity})`,
          422
        )
      }
    }

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
          currentClassroomId: classroom?.id || null,
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

      // Create StudentAllocation record for historical tracking if classroom assigned
      if (classroom) {
        await tx.studentAllocation.create({
          data: {
            tenantId: session.tenantId!,
            studentId: s.id,
            academicSessionId: classroom.academicSessionId,
            classroomId: classroom.id,
            programType: classroom.programType,
            status: 'ACTIVE',
            startedAt: new Date(),
            reason: 'Direct enrollment',
            createdById: session.uid,
            createdByName: session.name,
          },
        })
      }

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
