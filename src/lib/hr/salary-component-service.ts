import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'

export interface CreateSalaryComponentInput {
  name: string
  code: string
  type: 'EARNING' | 'DEDUCTION'
  calculationType?: 'FIXED' | 'PERCENTAGE'
  value?: number
}

export interface UpdateSalaryComponentInput {
  name?: string
  code?: string
  type?: 'EARNING' | 'DEDUCTION'
  calculationType?: 'FIXED' | 'PERCENTAGE'
  value?: number
  status?: string
}

export class SalaryComponentService {
  static async getSalaryComponents(tenantId: string) {
    return db.salaryComponent.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })
  }

  static async createSalaryComponent(tenantId: string, input: CreateSalaryComponentInput, actor: { id: string; name: string; role: string }) {
    const { name, code, type, calculationType = 'FIXED', value = 0 } = input

    if (!name || !code) throw new Error('Salary component name and code are required')

    const dup = await db.salaryComponent.findFirst({
      where: { tenantId, code },
    })
    if (dup) throw new Error(`Salary component code "${code}" already exists`)

    const comp = await db.salaryComponent.create({
      data: {
        tenantId,
        name,
        code: code.toUpperCase(),
        type,
        calculationType,
        value,
        status: 'ACTIVE',
      },
    })

    await AuditService.log({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HR_SALARY_COMPONENT_CREATE',
      entity: 'SalaryComponent',
      entityId: comp.id,
      module: 'HR',
      summary: `Created salary component "${comp.name}" (${comp.code})`,
      newValues: comp,
    })

    return comp
  }

  static async updateSalaryComponent(tenantId: string, id: string, input: UpdateSalaryComponentInput, actor: { id: string; name: string; role: string }) {
    const existing = await db.salaryComponent.findFirst({
      where: { id, tenantId },
    })
    if (!existing) throw new Error('Salary component not found')

    if (input.code && input.code !== existing.code) {
      const dup = await db.salaryComponent.findFirst({
        where: { tenantId, code: input.code.toUpperCase(), NOT: { id } },
      })
      if (dup) throw new Error(`Salary component code "${input.code}" already exists`)
    }

    const updated = await db.salaryComponent.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.code && { code: input.code.toUpperCase() }),
        ...(input.type && { type: input.type }),
        ...(input.calculationType && { calculationType: input.calculationType }),
        ...(input.value !== undefined && { value: input.value }),
        ...(input.status && { status: input.status }),
      },
    })

    await AuditService.log({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'HR_SALARY_COMPONENT_UPDATE',
      entity: 'SalaryComponent',
      entityId: updated.id,
      module: 'HR',
      summary: `Updated salary component "${updated.name}"`,
      oldValues: existing,
      newValues: updated,
    })

    return updated
  }
}
