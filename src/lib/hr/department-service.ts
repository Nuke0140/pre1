import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'

export interface CreateDepartmentInput {
  name: string
  code: string
  description?: string | null
}

export interface UpdateDepartmentInput {
  name?: string
  code?: string
  description?: string | null
  status?: string
}

export class DepartmentService {
  static async getDepartments(tenantId: string, params?: { search?: string; status?: string }) {
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
    return db.department.findMany({
      where,
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    })
  }

  static async createDepartment(tenantId: string, input: CreateDepartmentInput, actor: { id: string; name: string; role: string }) {
    const { name, code, description } = input

    if (!name || !code) {
      throw new Error('Department name and code are required')
    }

    const dupName = await db.department.findFirst({
      where: { tenantId, name, deletedAt: null },
    })
    if (dupName) throw new Error(`Department with name "${name}" already exists`)

    const dupCode = await db.department.findFirst({
      where: { tenantId, code, deletedAt: null },
    })
    if (dupCode) throw new Error(`Department code "${code}" already exists`)

    const dept = await db.department.create({
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
      action: 'HR_DEPARTMENT_CREATE',
      entity: 'Department',
      entityId: dept.id,
      module: 'HR',
      summary: `Created department "${dept.name}" (${dept.code})`,
      newValues: dept,
    })

    return dept
  }

  static async updateDepartment(tenantId: string, id: string, input: UpdateDepartmentInput, actor: { id: string; name: string; role: string }) {
    const existing = await db.department.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!existing) throw new Error('Department not found')

    if (input.name && input.name !== existing.name) {
      const dup = await db.department.findFirst({
        where: { tenantId, name: input.name, NOT: { id }, deletedAt: null },
      })
      if (dup) throw new Error(`Department with name "${input.name}" already exists`)
    }

    if (input.code && input.code !== existing.code) {
      const dup = await db.department.findFirst({
        where: { tenantId, code: input.code.toUpperCase(), NOT: { id }, deletedAt: null },
      })
      if (dup) throw new Error(`Department code "${input.code}" already exists`)
    }

    const updated = await db.department.update({
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
      action: 'HR_DEPARTMENT_UPDATE',
      entity: 'Department',
      entityId: updated.id,
      module: 'HR',
      summary: `Updated department "${updated.name}"`,
      oldValues: existing,
      newValues: updated,
    })

    return updated
  }

  static async deleteDepartment(tenantId: string, id: string, actor: { id: string; name: string; role: string }) {
    const existing = await db.department.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!existing) throw new Error('Department not found')

    const empCount = await db.staffProfile.count({
      where: { departmentId: id, deletedAt: null },
    })
    if (empCount > 0) {
      throw new Error(`Cannot delete department with ${empCount} assigned employee(s). Reassign employees first.`)
    }

    const deleted = await db.department.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    })

    await AuditService.log({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HR_DEPARTMENT_DELETE',
      entity: 'Department',
      entityId: id,
      module: 'HR',
      summary: `Deactivated/deleted department "${existing.name}"`,
      oldValues: existing,
    })

    return deleted
  }
}
