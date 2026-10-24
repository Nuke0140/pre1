import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, fail, Errors, logger, PreOneError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { StudentStatus, Prisma } from '@prisma/client'

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

    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit')

    let page = 1
    if (pageParam !== null) {
      const parsedPage = Number(pageParam)
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return Errors.badRequest('Invalid page parameter: must be a positive integer', 'page')
      }
      page = parsedPage
    }

    let pageSize = 25
    if (pageSizeParam !== null) {
      const parsedSize = Number(pageSizeParam)
      if (!Number.isInteger(parsedSize) || parsedSize < 1) {
        return Errors.badRequest('Invalid pageSize parameter: must be a positive integer', 'pageSize')
      }
      pageSize = Math.min(100, parsedSize)
    }

    const statusParam = searchParams.get('status')
    let targetStatus: StudentStatus = StudentStatus.ACTIVE
    if (statusParam !== null) {
      if (!Object.values(StudentStatus).includes(statusParam as StudentStatus)) {
        return Errors.badRequest(
          `Invalid status parameter: must be one of ${Object.values(StudentStatus).join(', ')}`,
          'status'
        )
      }
      targetStatus = statusParam as StudentStatus
    }

    const where: Prisma.StudentWhereInput = {
      tenantId: session.tenantId,
      ...(branchId ? { branchId } : {}),
      deletedAt: null,
      status: targetStatus,
      ...(query
        ? {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { admissionNo: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const skip = (page - 1) * pageSize

    const [total, students] = await Promise.all([
      db.student.count({ where }),
      db.student.findMany({
        where,
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
        skip,
        take: pageSize,
      }),
    ])

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

    const totalPages = Math.ceil(total / pageSize)
    const pagination = {
      page,
      pageSize,
      total,
      totalPages,
    }

    return ok({ students: formatted, pagination }, pagination)
  } catch (err: any) {
    if (isResponse(err)) {
      return err
    }
    if (err instanceof PreOneError && err.isOperational()) {
      return fail(err.code, err.userMessage, err.httpStatus)
    }

    logger.error('Failed to search eligible welcome-kit students', {
      error: err instanceof Error ? err.message : String(err),
      tenantId: session.tenantId,
    }, err)

    return fail(
      'STUDENT_SEARCH_FAILED',
      'An unexpected error occurred while searching students. Please try again or contact support.',
      500
    )
  }
}

export const GET = withApi(_GET, { module: 'inventory' })
