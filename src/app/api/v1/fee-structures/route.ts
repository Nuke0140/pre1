import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { FeeService } from '@/lib/fees/fee-service'
import type { ProgramType, FeeStructureStatus } from '@prisma/client'

async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const programType = (sp.get('programType') as ProgramType) || undefined
    const academicSessionId = sp.get('academicSessionId') || undefined
    const classroomId = sp.get('classroomId') || undefined
    const programId = sp.get('programId') || undefined
    const status = (sp.get('status') as FeeStructureStatus) || undefined

    const structures = await FeeService.getFeeStructures(session.tenantId, {
      academicSessionId,
      classroomId,
      programId,
      programType,
      status,
    })

    return ok(structures)
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
    const { name, items } = body
    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      return Errors.validation('name and at least one fee item are required')
    }

    const structure = await FeeService.createFeeStructure(
      {
        tenantId: session.tenantId,
        branchId: session.branchId,
        actorId: session.uid,
        actorName: session.name,
        actorRole: session.role,
      },
      body
    )

    return ok(structure, undefined, 201)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
