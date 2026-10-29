import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { NotificationEngine } from '@/lib/notifications/notification-engine'

/**
 * GET /api/v1/settings/notifications/logs
 * Filtered query of delivery audit logs for administrators.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const eventType = searchParams.get('eventType') || undefined
    const channel = searchParams.get('channel') || undefined
    const status = searchParams.get('status') || undefined
    const rawLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit))
    const rawOffset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)

    const { logs, total } = await NotificationEngine.getDeliveryLogs(session.tenantId, {
      eventType,
      channel,
      status,
      limit,
      offset,
    })

    return ok({ logs, total })
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
