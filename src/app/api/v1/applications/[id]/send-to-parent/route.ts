import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { AdmissionService } from '@/lib/admissions/admission-service'

/**
 * POST /api/v1/applications/[id]/send-to-parent
 * Dispatches a secure, tenant-scoped application completion link to the parent.
 */
async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  const { id } = await params

  try {
    const body = await req.json().catch(() => ({}))
    const email = body?.email

    const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

    const result = await AdmissionService.createApplicationInvitation(
      {
        tenantId: session.tenantId,
        branchId: session.branchId || '',
        academicYearId: '',
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      id,
      email,
      origin
    )

    return ok(result, 'Application invitation link generated successfully', 201)
  } catch (e: any) {
    if (e.message && e.message.toLowerCase().includes('not found')) {
      return Errors.notFound(e.message)
    }
    return Errors.business('INVITATION_SEND_FAILED', e.message || 'Failed to generate invitation', 422)
  }
}

export const POST = withApi(_POST)
