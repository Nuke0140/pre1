import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AppraisalService } from '@/lib/hr/appraisal-service'

async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    // Resolve user's canonical StaffProfile ID
    const staff = await db.staffProfile.findFirst({
      where: {
        userId: session.id,
        tenantId: session.tenantId,
      },
      select: { id: true },
    })

    if (!staff) {
      return Errors.notFound('Staff profile not found for user')
    }

    const myAppraisals = await AppraisalService.getEmployeeSelfServiceAppraisals(
      session.tenantId,
      staff.id
    )

    return ok(myAppraisals)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
