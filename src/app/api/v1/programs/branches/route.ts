import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'

/**
 * GET /api/v1/programs/branches — list program mappings
 * Query params: ?programId=... or ?branchId=...
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { searchParams } = new URL(req.url)
    const programId = searchParams.get('programId')
    const branchId = searchParams.get('branchId')

    const mappings = await db.programBranch.findMany({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        ...(programId ? { programId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      include: {
        program: {
          select: { id: true, name: true, code: true, programType: true, isActive: true },
        },
        branch: {
          select: { id: true, name: true, code: true, isActive: true },
        },
      },
      orderBy: [{ branch: { name: 'asc' } }, { program: { name: 'asc' } }],
    })

    return ok(mappings.map((m) => ({
      id: m.id,
      programId: m.programId,
      branchId: m.branchId,
      capacity: m.capacity,
      isActive: m.isActive,
      displayOrder: m.displayOrder,
      program: m.program,
      branch: m.branch,
    })))
  } catch (e) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/programs/branches — map/unmap program to branch, or update branch capacity/status
 * Body:
 * {
 *   programId: string,
 *   branchId: string,
 *   isActive?: boolean,
 *   capacity?: number | null
 * }
 * or batch:
 * {
 *   mappings: { programId: string, branchId: string, isActive: boolean, capacity?: number | null }[]
 * }
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()

    // Handle batch update
    if (Array.isArray(body.mappings)) {
      const results = []
      for (const item of body.mappings) {
        if (!item.programId || !item.branchId) continue

        // Verify program & branch belong to this tenant
        const [prog, br] = await Promise.all([
          db.program.findFirst({ where: { id: item.programId, tenantId: session.tenantId, deletedAt: null } }),
          db.branch.findFirst({ where: { id: item.branchId, tenantId: session.tenantId, deletedAt: null } }),
        ])
        if (!prog || !br) continue

        const mapping = await db.programBranch.upsert({
          where: {
            programId_branchId: {
              programId: item.programId,
              branchId: item.branchId,
            },
          },
          update: {
            isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
            capacity: item.capacity !== undefined ? (item.capacity ? Number(item.capacity) : null) : undefined,
            deletedAt: null,
          },
          create: {
            tenantId: session.tenantId,
            programId: item.programId,
            branchId: item.branchId,
            capacity: item.capacity ? Number(item.capacity) : null,
            isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
          },
        })
        results.push(mapping)
      }

      await audit({
        tenantId: session.tenantId,
        actorId: session.uid,
        actorName: session.name,
        action: 'UPDATE',
        entity: 'ProgramBranch',
        entityId: session.tenantId,
        summary: `Batch updated ${results.length} program-branch mappings`,
      })

      return ok({ updated: results.length, mappings: results })
    }

    // Handle single item update
    const { programId, branchId, isActive, capacity } = body
    if (!programId || !branchId) {
      return Errors.validation('programId and branchId are required')
    }

    const [prog, br] = await Promise.all([
      db.program.findFirst({ where: { id: programId, tenantId: session.tenantId, deletedAt: null } }),
      db.branch.findFirst({ where: { id: branchId, tenantId: session.tenantId, deletedAt: null } }),
    ])
    if (!prog) return Errors.notFound('Program')
    if (!br) return Errors.notFound('Branch')

    const mapping = await db.programBranch.upsert({
      where: {
        programId_branchId: { programId, branchId },
      },
      update: {
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        capacity: capacity !== undefined ? (capacity ? Number(capacity) : null) : undefined,
        deletedAt: null,
      },
      create: {
        tenantId: session.tenantId,
        programId,
        branchId,
        capacity: capacity ? Number(capacity) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'UPDATE',
      entity: 'ProgramBranch',
      entityId: mapping.id,
      summary: `${mapping.isActive ? 'Mapped' : 'Unmapped'} program "${prog.name}" to branch "${br.name}"`,
    })

    return ok(mapping)
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
