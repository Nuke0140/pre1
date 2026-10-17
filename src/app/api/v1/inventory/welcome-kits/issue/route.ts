import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { getRequestMeta } from '@/lib/audit'
import { WelcomeKitService } from '@/lib/inventory/welcome-kit-service'

/**
 * POST /api/v1/inventory/welcome-kits/issue
 * Atomically issues a Welcome Kit bundle to a student.
 * All-or-nothing stock deduction, idempotency protection, and audit logging.
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'inventory:issue')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json().catch(() => ({}))
    const meta = getRequestMeta(req)

    if (!body.studentId) {
      return Errors.badRequest('Student ID is required to issue a welcome kit.')
    }

    const idempotencyKey =
      req.headers.get('x-idempotency-key') ||
      req.headers.get('idempotency-key') ||
      body.idempotencyKey ||
      undefined

    const result = await WelcomeKitService.issueWelcomeKit(
      session.tenantId,
      {
        studentId: body.studentId,
        bundleId: body.bundleId,
        bundleCode: body.bundleCode,
        uniformSize: body.uniformSize,
        locationId: body.locationId,
        branchId: body.branchId || session.branchId || undefined,
        idempotencyKey,
        overrideDuplicate: !!body.overrideDuplicate,
        notes: body.notes,
        guardianName: body.guardianName,
      },
      {
        id: session.uid,
        name: session.name,
        role: session.role,
        branchId: session.branchId,
      }
    )

    return ok(result)
  } catch (err: any) {
    if (err.message?.startsWith('INSUFFICIENT_STOCK')) {
      return bad(err.message, 'INSUFFICIENT_STOCK')
    }
    if (err.message?.startsWith('DUPLICATE_ISSUANCE')) {
      return bad(err.message, 'DUPLICATE_ISSUANCE')
    }
    if (err.message?.startsWith('INVALID_VARIANT')) {
      return bad(err.message, 'INVALID_VARIANT')
    }
    if (err.message?.startsWith('UNAUTHORIZED')) {
      return Errors.forbidden(err.message)
    }
    return bad(err.message, 'WELCOME_KIT_ISSUE_FAILED')
  }
}

export const POST = withApi(_POST)
