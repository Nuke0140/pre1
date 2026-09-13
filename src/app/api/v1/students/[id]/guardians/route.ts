import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { StudentService } from '@/lib/students/student-service'

/**
 * POST /api/v1/students/[id]/guardians — Manage student guardians (LINK, UPDATE, UNLINK)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'students:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const body = await req.json()
    const {
      action,
      guardianId,
      relationship,
      isPrimary,
      canPickup,
      isFeePayer,
      receivesCommunication,
    } = body

    if (!action || !guardianId) {
      return Errors.validation('action and guardianId are required')
    }

    if (!['LINK', 'UPDATE', 'UNLINK'].includes(action)) {
      return Errors.validation('action must be one of LINK, UPDATE, UNLINK')
    }

    const updated = await StudentService.manageGuardians(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      {
        action,
        guardianId,
        relationship,
        isPrimary,
        canPickup,
        isFeePayer,
        receivesComm: receivesCommunication ?? body.receivesComm,
      }
    )


    return ok(updated)
  } catch (e: any) {
    return Errors.business('GUARDIAN_ACTION_FAILED', e.message || 'Failed to update guardian association', 422)
  }
}

