import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * GET /api/v1/public/application?token=...
 * Public verification endpoint for parent completion links.
 */
async function _GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return Errors.validation('Token parameter is required')
  }

  try {
    const data = await AdmissionService.verifyApplicationInvitation(token)
    return ok(data)
  } catch (e: any) {
    return Errors.business('INVALID_APPLICATION_LINK', e.message || 'Invalid or expired invitation link', 400)
  }
}

/**
 * POST /api/v1/public/application
 * Public submission endpoint for parent-completed applications.
 */
async function _POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, data } = body

    if (!token) {
      return Errors.validation('Token is required')
    }

    if (!data) {
      return Errors.validation('Application completion data is required')
    }

    const application = await AdmissionService.submitParentApplication(token, data)
    return ok(
      {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
      },
      'Application submitted successfully',
      200
    )
  } catch (e: any) {
    return Errors.business('SUBMISSION_FAILED', e.message || 'Failed to submit application', 422)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
