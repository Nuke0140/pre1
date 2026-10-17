import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { SupplyCartService } from '@/lib/inventory/supply-cart-service'

/**
 * GET /api/v1/inventory/supply-store/catalog
 * Returns classroom supply catalog with live stock for branch, categories,
 * and the authenticated teacher's assigned classroom.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'inventory:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId') || session.branchId || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const search = searchParams.get('search') || undefined
    const classroomId = searchParams.get('classroomId') || undefined

    const [catalog, teacherClassroom] = await Promise.all([
      SupplyCartService.getCatalog(session.tenantId, {
        branchId,
        categoryId,
        search,
        classroomId,
      }),
      SupplyCartService.getTeacherClassroom(session.tenantId, session.uid, branchId),
    ])

    return ok({
      ...catalog,
      classroom: teacherClassroom,
      teacherClassroom,
      authenticatedTeacher: {
        id: session.uid,
        name: session.name,
        role: session.role,
      },
    })
  } catch (err: any) {
    return bad(err.message, 'SUPPLY_CATALOG_FETCH_FAILED')
  }
}

export const GET = withApi(_GET)
