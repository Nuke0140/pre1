import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'

/**
 * GET /api/v1/inventory/welcome-kits/students
 * Searches eligible enrolled students for welcome kit distribution.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() || ''
    const branchId = searchParams.get('branchId') || session.branchId || undefined

    const students = await db.student.findMany({
      where: {
        tenantId: session.tenantId,
        ...(branchId ? { branchId } : {}),
        deletedAt: null,
        status: { in: ['ACTIVE', 'ENROLLED', 'PROBATIONARY'] as any },
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { admissionNo: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        currentClassroom: { select: { id: true, name: true } },
        guardians: {
          include: { guardian: { select: { fullName: true, phone: true } } },
          where: { isPrimary: true },
        },
        kitIssuances: {
          select: { id: true, kitNumber: true, bundleName: true, createdAt: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    })

    const formatted = students.map((s) => ({
      id: s.id,
      admissionNo: s.admissionNo,
      fullName: `${s.firstName} ${s.lastName || ''}`.trim(),
      firstName: s.firstName,
      lastName: s.lastName,
      branchId: s.branchId,
      status: s.status,
      classroom: s.currentClassroom ? { id: s.currentClassroom.id, name: s.currentClassroom.name } : null,
      primaryGuardian: s.guardians[0]?.guardian
        ? {
            name: s.guardians[0].guardian.fullName,
            phone: s.guardians[0].guardian.phone,
          }
        : null,
      hasPreviousKit: s.kitIssuances.length > 0,
      previousKit: s.kitIssuances[0] || null,
    }))

    return ok({ students: formatted })
  } catch (err: any) {
    return bad(err.message, 'STUDENT_SEARCH_FAILED')
  }
}

export const GET = withApi(_GET)
