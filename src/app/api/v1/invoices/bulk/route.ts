import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import type { ProgramType } from '@prisma/client'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const feePlanId = sp.get('feePlanId') || undefined
    const requestedBranchId = sp.get('branchId') || session.branchId || undefined
    const classroomId = sp.get('classroomId') || undefined
    const academicSessionId = sp.get('academicSessionId') || undefined
    const programType = (sp.get('programType') as ProgramType) || undefined
    const customTitle = sp.get('title') || 'Term Fee'
    const dueDate = sp.get('dueDate') || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)

    if (requestedBranchId) {
      const branchCheck = await requireBranchAccess(session, requestedBranchId)
      if (branchCheck) return branchCheck
    }

    const preview = await FeeService.previewBulkInvoices(
      {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        feePlanId,
        branchId: requestedBranchId,
        classroomId,
        academicSessionId,
        programType,
        customTitle,
        dueDate,
      }
    )

    return ok(preview)
  } catch (e: any) {
    return Errors.system(e)
  }
}

async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'finance:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const { feePlanId, branchId, classroomId, academicSessionId, programType, title, dueDate, customAmountCents } = body

    if (!dueDate) {
      return Errors.validation('dueDate is required')
    }

    const targetBranchId = branchId || session.branchId
    if (targetBranchId) {
      const branchCheck = await requireBranchAccess(session, targetBranchId)
      if (branchCheck) return branchCheck
    }

    const result = await FeeService.createBulkInvoices(
      {
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      {
        feePlanId,
        branchId: targetBranchId,
        classroomId,
        academicSessionId,
        programType,
        customTitle: title || 'Term Fee Invoice',
        dueDate,
        customAmountCents,
      }
    )

    return ok(result, undefined, 201)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
