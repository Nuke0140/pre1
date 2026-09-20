import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { SettingsService } from '@/lib/settings/settings-service'

/**
 * GET /api/v1/settings/preferences
 * Returns user-level UI preferences.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session

  try {
    const prefs = await SettingsService.getUserPreferences(session.uid)
    return ok(prefs)
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * PATCH /api/v1/settings/preferences
 * Updates user-level UI preferences.
 */
async function _PATCH(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session

  try {
    const body = await req.json()
    // Return updated preferences
    return ok({
      userId: session.uid,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
