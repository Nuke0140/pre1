import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { PickupPinService } from '@/lib/users/pickup-pin-service'

/**
 * GET /api/v1/users/[id]/pickup-pin
 * Retrieves current pickup PIN status, coverage metrics, and linked students.
 */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember } = manageCheck

  try {
    const status = await PickupPinService.getPinStatus({
      userId: targetMember.userId,
      tenantId: session.tenantId,
    })

    if (!status) {
      return notFound('Guardian profile not found for this user in current school')
    }

    return ok(status)
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/users/[id]/pickup-pin
 * Lifecycle management for pickup security PINs (regenerate, reset, auto-provision, clear).
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember } = manageCheck

  try {
    const body = await req.json().catch(() => ({}))
    const {
      action,
      pin,
      studentId,
      syncToAllStudents = true,
      pinLength = 4,
      reason,
      overwriteExisting = false,
    } = body as {
      action?: 'regenerate' | 'reset' | 'auto-provision' | 'clear'
      pin?: string | null
      studentId?: string
      syncToAllStudents?: boolean
      pinLength?: number
      reason?: string
      overwriteExisting?: boolean
    }

    if (!action) {
      return bad(
        'Action is required. Must be one of: regenerate, reset, auto-provision, clear',
        'ACTION_REQUIRED'
      )
    }

    switch (action) {
      case 'regenerate': {
        const result = await PickupPinService.regeneratePin({
          userId: targetMember.userId,
          tenantId: session.tenantId,
          actorSession: session,
          studentId,
          syncToAllStudents,
          pinLength,
          reason,
          req,
        })
        return ok({
          action: 'regenerate',
          newPin: result.newPin,
          target: result.target,
          studentId: result.studentId,
          updatedStudentsCount: result.updatedStudentsCount,
          message:
            result.target === 'STUDENT'
              ? 'Successfully regenerated child-specific pickup PIN'
              : `Successfully regenerated family pickup PIN (synced to ${result.updatedStudentsCount} students)`,
        })
      }

      case 'reset': {
        if (!pin) {
          return bad('PIN is required for reset action', 'PIN_REQUIRED')
        }
        const result = await PickupPinService.resetPin({
          userId: targetMember.userId,
          tenantId: session.tenantId,
          actorSession: session,
          pin,
          clear: false,
          studentId,
          syncToAllStudents,
          reason,
          req,
        })
        return ok({
          action: 'reset',
          target: result.target,
          studentId: result.studentId,
          updatedStudentsCount: result.updatedStudentsCount,
          message:
            result.target === 'STUDENT'
              ? 'Successfully set custom pickup PIN for child'
              : `Successfully set custom pickup PIN for family (synced to ${result.updatedStudentsCount} students)`,
        })
      }

      case 'clear': {
        const result = await PickupPinService.resetPin({
          userId: targetMember.userId,
          tenantId: session.tenantId,
          actorSession: session,
          clear: true,
          studentId,
          syncToAllStudents,
          reason,
          req,
        })
        return ok({
          action: 'clear',
          cleared: true,
          target: result.target,
          studentId: result.studentId,
          updatedStudentsCount: result.updatedStudentsCount,
          message:
            result.target === 'STUDENT'
              ? 'Successfully cleared child-specific pickup PIN'
              : `Successfully cleared family pickup PIN`,
        })
      }

      case 'auto-provision': {
        const result = await PickupPinService.autoProvisionPins({
          userId: targetMember.userId,
          tenantId: session.tenantId,
          actorSession: session,
          overwriteExisting,
          req,
        })
        return ok({
          action: 'auto-provision',
          provisionedPin: result.provisionedPin,
          affectedStudents: result.affectedStudents,
          alreadyConfigured: result.alreadyConfigured,
          message: result.message,
        })
      }

      default:
        return bad(
          `Invalid action: ${action}. Allowed: regenerate, reset, auto-provision, clear`,
          'INVALID_ACTION'
        )
    }
  } catch (err: any) {
    if (err.code === 'INVALID_PIN_FORMAT' || err.code === 'PIN_TOO_WEAK') {
      return bad(err.message, err.code)
    }
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
