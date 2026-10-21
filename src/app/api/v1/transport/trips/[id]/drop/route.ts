import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors, bad } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { TransportService } from '@/lib/transport/transport-service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * POST /api/v1/transport/trips/[id]/drop — Record child drop with authorized guardian verification
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Rate limiting: 10 drop verification attempts per 15 mins per IP
  const rl = await checkRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: 'rl-transport-drop',
  })
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfterSeconds, 'Too many drop verification attempts. Please wait.')
  }

  const session = await requireApi(req, 'transport:drop')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('Tenant context required')

  const { id } = await params
  try {
    const body = await req.json()
    const { studentId, guardianId, phone, userId, pin, notes } = body

    if (!studentId) return bad('studentId is required')
    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      return bad('Security PIN is required for pickup handover verification')
    }

    const updated = await TransportService.recordDrop(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        tripId: id,
        studentId,
        guardianId,
        phone,
        userId,
        pin,
        notes,
      }
    )

    return ok(updated)
  } catch (e: any) {
    return bad(e.message)
  }
}

export const POST = withApi(_POST)
