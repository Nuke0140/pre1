import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'

export interface CreateDesignationInput {
  name: string
  code: string
  description?: string | null
}

export interface UpdateDesignationInput {
  name?: string
  code?: string
  description?: string | null
  status?: string
}

export class DesignationService {
  static async getDesignations(tenantId: string, params?: { search?: string; status?: string }) {
    const where: any = { tenantId, deletedAt: null }
    if (params?.status) {
      where.status = params.status
    }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    return db.designation.findMany({
      where,
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  static async createDesignation(tenantId: string, input: CreateDesignationInput, actor: { id: string; name: string; role: string }) {
    const { name, code, description } = input

    if (!name || !code) {
      throw new Error('Designation name and code are required')
    }

    const dupName = await db.designation.findFirst({
      where: { tenantId, name, deletedAt: null },
    })
    if (dupName) throw new Error(`Designation with name "${name}" already exists`)

    const dupCode = await db.designation.findFirst({
      where: { tenantId, code, deletedAt: null },
    })
    if (dupCode) throw new Error(`Designation code "${code}" already exists`)

    const designation = await db.designation.create({
      data: {
        tenantId,
        name,
        code: code.toUpperCase(),
        description,
        status: 'ACTIVE',
      },
    })

    await AuditService.log({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HR_DESIGNATION_CREATE',
      entity: 'Designation',
      entityId: designation.id,
      module: 'HR',
      summary: `Created designation "${designation.name}" (${designation.code})`,
      newValues: designation,
    })

    return designation
  }

  static async updateDesignation(tenantId: string, id: string, input: UpdateDesignationInput, actor: { id: string; name: string; role: string }) {
    const existing = await db.designation.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!existing) throw new Error('Designation not found')

    if (input.name && input.name !== existing.name) {
      const dup = await db.designation.findFirst({
        where: { tenantId, name: input.name, NOT: { id }, deletedAt: null },
      })
      if (dup) throw new Error(`Designation with name "${input.name}" already exists`)
    }

    if (input.code && input.code !== existing.code) {
      const dup = await db.designation.findFirst({
        where: { tenantId, code: input.code.toUpperCase(), NOT: { id }, deletedAt: null },
      })
      if (dup) throw new Error(`Designation code "${input.code}" already exists`)
    }

    const updated = await db.designation.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.code && { code: input.code.toUpperCase() }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status && { status: input.status }),
      },
    })

    await AuditService.log({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HR_DESIGNATION_UPDATE',
      entity: 'Designation',
      entityId: updated.id,
      module: 'HR',
      summary: `Updated designation "${updated.name}"`,
      oldValues: existing,
      newValues: updated,
    })

    return updated
  }

  static async deleteDesignation(tenantId: string, id: string, actor: { id: string; name: string; role: string }) {
    const existing = await db.designation.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!existing) throw new Error('Designation not found')

    const empCount = await db.staffProfile.count({
      where: { designationId: id, deletedAt: null },
    })
    if (empCount > 0) {
      throw new Error(`Cannot delete designation with ${empCount} assigned employee(s). Reassign employees first.`)
    }

    const deleted = await db.designation.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    })

    await AuditService.log({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HR_DESIGNATION_DELETE',
      entity: 'Designation',
      entityId: id,
      module: 'HR',
      summary: `Deactivated/deleted designation "${existing.name}"`,
      oldValues: existing,
    })

    return deleted
  }
}
