import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/**
 * GET /api/v1/parent/documents
 * List all authorized generated documents for the logged-in parent's linked children.
 * Strictly prevents cross-family leakage and administrative document exposure.
 */
export async function GET(req: NextRequest) {
  // Parents have timeline:read and documents:read-linked permissions
  const session = await requireApi(req, 'timeline:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const tenantId = session.tenantId
    const url = new URL(req.url)
    const filterStudentId = url.searchParams.get('studentId')

    // Find all linked students for this parent / guardian
    const guardians = await db.guardian.findMany({
      where: {
        userId: session.uid,
        tenantId,
        deletedAt: null,
      },
      include: {
        studentLinks: {
          select: {
            studentId: true,
          },
        },
      },
    })

    const linkedStudentIds = Array.from(
      new Set(guardians.flatMap((g) => g.studentLinks.map((l) => l.studentId)))
    )

    if (linkedStudentIds.length === 0) {
      return ok([])
    }

    if (filterStudentId && !linkedStudentIds.includes(filterStudentId)) {
      return Errors.forbidden('You are not authorized to view documents for this student')
    }

    const targetStudentIds = filterStudentId ? [filterStudentId] : linkedStudentIds

    const documents = await db.generatedProfileDocument.findMany({
      where: {
        tenantId,
        entityType: 'STUDENT',
        studentId: { in: targetStudentIds },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
        },
        studentReportCards: {
          select: {
            status: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    })

    // Parents can only view published report cards
    const visibleDocuments = documents.filter((doc) => {
      if (doc.documentType === 'REPORT_CARD') {
        const rc = (doc as any).studentReportCards?.[0]
        return rc ? rc.status === 'PUBLISHED' : false
      }
      return true
    })

    return ok(visibleDocuments)
  } catch (err: any) {
    return Errors.system(err.message || 'Failed to list parent documents')
  }
}
