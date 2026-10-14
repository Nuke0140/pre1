import { ok, withApi } from '@/lib/api'
import { db } from '@/lib/db'

/**
 * GET /api/v1/health
 * Public, unauthenticated endpoint for uptime monitors and ALB/K8s health checks.
 */
export const GET = withApi(
  async () => {
    let dbStatus = 'healthy'
    let dbLatencyMs = 0

    try {
      const start = Date.now()
      await db.$queryRaw`SELECT 1`
      dbLatencyMs = Date.now() - start
    } catch {
      dbStatus = 'unreachable'
    }

    return ok({
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '0.2.1',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    })
  },
  { module: 'health' }
)
