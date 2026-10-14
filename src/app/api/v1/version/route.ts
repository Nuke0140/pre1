import { ok, withApi } from '@/lib/api'

/**
 * GET /api/v1/version
 * Public, unauthenticated endpoint exposing application version and build metadata.
 */
export const GET = withApi(
  async () => {
    return ok({
      name: 'PreOne',
      version: '0.2.1',
      apiVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
    })
  },
  { module: 'version' }
)
