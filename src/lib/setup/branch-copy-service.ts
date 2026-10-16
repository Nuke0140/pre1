/**
 * PreOne — Branch Setup Copy Domain Service (M00)
 *
 * Implements authoritative, safe, multi-tenant cloning of branch-level configuration:
 * - Preview with conflict and duplication analysis
 * - Explicit conflict resolution strategies (SKIP, CREATE_MISSING, OVERWRITE)
 * - Strict tenant boundary and branch validation
 * - Remapping of branch identifiers
 * - Unique code generation for destination entities
 * - Absolute exclusion of students, staff assignments, invoices, payments, and attendance
 * - Database transactional execution with audit logging
 */

import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import type { CopyableCategory } from './scope-model'

export type ConflictStrategy = 'SKIP' | 'CREATE_MISSING' | 'OVERWRITE'

export interface BranchCopyPreviewItem {
  name: string
  identifier: string
  type: string
  status: 'WILL_CREATE' | 'CONFLICT_EXISTS'
  details: string
  existingDestinationName?: string
}

export interface CategoryPreviewResult {
  category: CopyableCategory
  label: string
  sourceCount: number
  newCount: number
  conflictsCount: number
  existingDestinationCount: number
  items: BranchCopyPreviewItem[]
}

export interface BranchCopyPreviewResult {
  sourceBranch: { id: string; name: string; code: string }
  destinationBranch: { id: string; name: string; code: string }
  categories: CategoryPreviewResult[]
  summary: {
    totalSourceRecords: number
    totalNewRecords: number
    totalConflicts: number
  }
}

export interface CategoryExecutionResult {
  category: CopyableCategory
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export interface BranchCopyExecutionResult {
  success: boolean
  sourceBranch: { id: string; name: string }
  destinationBranch: { id: string; name: string }
  conflictStrategy: ConflictStrategy
  categories: CategoryExecutionResult[]
  totalCreated: number
  totalUpdated: number
  totalSkipped: number
  message: string
}

export class BranchCopyService {
  /**
   * Validates that both branches exist, are active, and belong to the same authorized tenant.
   */
  private static async validateBranches(tenantId: string, sourceBranchId: string, destinationBranchId: string) {
    if (!sourceBranchId || !destinationBranchId) {
      throw new Error('Both source and destination branches are required')
    }
    if (sourceBranchId === destinationBranchId) {
      throw new Error('Source and destination branches cannot be the same')
    }

    const [source, destination] = await Promise.all([
      db.branch.findFirst({
        where: { id: sourceBranchId, tenantId, deletedAt: null },
      }),
      db.branch.findFirst({
        where: { id: destinationBranchId, tenantId, deletedAt: null },
      }),
    ])

    if (!source) {
      throw new Error(`Source branch (${sourceBranchId}) does not exist in authorized school context`)
    }
    if (!destination) {
      throw new Error(`Destination branch (${destinationBranchId}) does not exist in authorized school context`)
    }

    return { source, destination }
  }

  /**
   * Previews configuration to copy, identifying new records and conflicts.
   */
  static async previewBranchCopy(
    tenantId: string,
    params: {
      sourceBranchId: string
      destinationBranchId: string
      categories: CopyableCategory[]
    }
  ): Promise<BranchCopyPreviewResult> {
    const { source, destination } = await this.validateBranches(
      tenantId,
      params.sourceBranchId,
      params.destinationBranchId
    )

    const categoriesResults: CategoryPreviewResult[] = []

    // 1. Classrooms
    if (params.categories.includes('classrooms')) {
      const [srcClassrooms, destClassrooms] = await Promise.all([
        db.classroom.findMany({
          where: { tenantId, branchId: source.id, isActive: true },
          orderBy: { name: 'asc' },
        }),
        db.classroom.findMany({
          where: { tenantId, branchId: destination.id },
          orderBy: { name: 'asc' },
        }),
      ])

      const destMap = new Map<string, (typeof destClassrooms)[0]>(
        destClassrooms.map((c) => [`${c.name.trim().toLowerCase()}::${c.programType}`, c])
      )

      const items: BranchCopyPreviewItem[] = srcClassrooms.map((c) => {
        const key = `${c.name.trim().toLowerCase()}::${c.programType}`
        const exists = destMap.has(key)
        return {
          name: c.name,
          identifier: c.code,
          type: c.programType,
          status: exists ? 'CONFLICT_EXISTS' : 'WILL_CREATE',
          details: exists
            ? `Classroom with matching name and program already exists in ${destination.name}`
            : `Will be created with capacity ${c.capacity} in ${destination.name}`,
          existingDestinationName: exists ? destMap.get(key)?.name : undefined,
        }
      })

      const conflicts = items.filter((i) => i.status === 'CONFLICT_EXISTS').length
      categoriesResults.push({
        category: 'classrooms',
        label: 'Classrooms & Learning Sections',
        sourceCount: srcClassrooms.length,
        newCount: srcClassrooms.length - conflicts,
        conflictsCount: conflicts,
        existingDestinationCount: destClassrooms.length,
        items,
      })
    }

    // 2. Fee Structures
    if (params.categories.includes('fee_structures')) {
      const [srcStructures, destStructures] = await Promise.all([
        db.feeStructure.findMany({
          where: { tenantId, branchId: source.id, deletedAt: null },
          include: { items: true },
          orderBy: { name: 'asc' },
        }),
        db.feeStructure.findMany({
          where: { tenantId, branchId: destination.id, deletedAt: null },
          include: { items: true },
          orderBy: { name: 'asc' },
        }),
      ])

      const destMap = new Map<string, (typeof destStructures)[0]>(
        destStructures.map((fs) => [`${fs.name.trim().toLowerCase()}::${fs.programType ?? 'ALL'}`, fs])
      )

      const items: BranchCopyPreviewItem[] = srcStructures.map((fs) => {
        const key = `${fs.name.trim().toLowerCase()}::${fs.programType ?? 'ALL'}`
        const exists = destMap.has(key)
        return {
          name: fs.name,
          identifier: fs.id,
          type: fs.programType ?? 'General',
          status: exists ? 'CONFLICT_EXISTS' : 'WILL_CREATE',
          details: exists
            ? `Fee structure '${fs.name}' already configured in ${destination.name}`
            : `Will copy structure with ${fs.items.length} fee component items`,
          existingDestinationName: exists ? destMap.get(key)?.name : undefined,
        }
      })

      const conflicts = items.filter((i) => i.status === 'CONFLICT_EXISTS').length
      categoriesResults.push({
        category: 'fee_structures',
        label: 'Fee Structures & Component Heads',
        sourceCount: srcStructures.length,
        newCount: srcStructures.length - conflicts,
        conflictsCount: conflicts,
        existingDestinationCount: destStructures.length,
        items,
      })
    }

    // 3. Program Campus Availability
    if (params.categories.includes('programs')) {
      const [srcProgs, destProgs] = await Promise.all([
        db.programBranch.findMany({
          where: { tenantId, branchId: source.id, deletedAt: null, isActive: true },
          include: { program: true },
        }),
        db.programBranch.findMany({
          where: { tenantId, branchId: destination.id, deletedAt: null },
          include: { program: true },
        }),
      ])

      const destSet = new Set(destProgs.map((pb) => pb.programId))

      const items: BranchCopyPreviewItem[] = srcProgs.map((pb) => {
        const exists = destSet.has(pb.programId)
        return {
          name: pb.program.name,
          identifier: pb.program.code,
          type: pb.program.programType,
          status: exists ? 'CONFLICT_EXISTS' : 'WILL_CREATE',
          details: exists
            ? `Program is already mapped to ${destination.name}`
            : `Will map program with capacity ${pb.capacity ?? pb.program.capacity}`,
        }
      })

      const conflicts = items.filter((i) => i.status === 'CONFLICT_EXISTS').length
      categoriesResults.push({
        category: 'programs',
        label: 'Program Campus Availability & Capacities',
        sourceCount: srcProgs.length,
        newCount: srcProgs.length - conflicts,
        conflictsCount: conflicts,
        existingDestinationCount: destProgs.length,
        items,
      })
    }

    // 4. Facilities
    if (params.categories.includes('facilities')) {
      const [srcFac, destFac] = await Promise.all([
        db.facility.findMany({
          where: { tenantId, branchId: source.id, deletedAt: null, isActive: true },
        }),
        db.facility.findMany({
          where: { tenantId, branchId: destination.id, deletedAt: null },
        }),
      ])

      const destMap = new Map(
        destFac.map((f) => [`${f.name.trim().toLowerCase()}::${f.type}`, f])
      )

      const items: BranchCopyPreviewItem[] = srcFac.map((f) => {
        const key = `${f.name.trim().toLowerCase()}::${f.type}`
        const exists = destMap.has(key)
        return {
          name: f.name,
          identifier: f.code,
          type: f.type,
          status: exists ? 'CONFLICT_EXISTS' : 'WILL_CREATE',
          details: exists
            ? `Facility '${f.name}' already configured in ${destination.name}`
            : `Will create ${f.type.toLowerCase().replaceAll('_', ' ')} space in ${destination.name}`,
        }
      })

      const conflicts = items.filter((i) => i.status === 'CONFLICT_EXISTS').length
      categoriesResults.push({
        category: 'facilities',
        label: 'Campus Facilities & Learning Spaces',
        sourceCount: srcFac.length,
        newCount: srcFac.length - conflicts,
        conflictsCount: conflicts,
        existingDestinationCount: destFac.length,
        items,
      })
    }

    const totalSourceRecords = categoriesResults.reduce((sum, c) => sum + c.sourceCount, 0)
    const totalNewRecords = categoriesResults.reduce((sum, c) => sum + c.newCount, 0)
    const totalConflicts = categoriesResults.reduce((sum, c) => sum + c.conflictsCount, 0)

    return {
      sourceBranch: { id: source.id, name: source.name, code: source.code },
      destinationBranch: { id: destination.id, name: destination.name, code: destination.code },
      categories: categoriesResults,
      summary: {
        totalSourceRecords,
        totalNewRecords,
        totalConflicts,
      },
    }
  }

  /**
   * Executes the copy operation within a database transaction, adhering to the chosen conflict strategy.
   */
  static async executeBranchCopy(
    tenantId: string,
    actor: { id?: string | null; name?: string | null; role?: string | null },
    params: {
      sourceBranchId: string
      destinationBranchId: string
      categories: CopyableCategory[]
      conflictStrategy: ConflictStrategy
    }
  ): Promise<BranchCopyExecutionResult> {
    const { source, destination } = await this.validateBranches(
      tenantId,
      params.sourceBranchId,
      params.destinationBranchId
    )

    const conflictStrategy = params.conflictStrategy || 'SKIP'
    const results: CategoryExecutionResult[] = []

    // Execute in a transaction for safety
    await db.$transaction(async (tx) => {
      // 1. CLASSROOMS
      if (params.categories.includes('classrooms')) {
        let created = 0
        let updated = 0
        let skipped = 0
        const errors: string[] = []

        const [srcClassrooms, destClassrooms] = await Promise.all([
          tx.classroom.findMany({
            where: { tenantId, branchId: source.id, isActive: true },
          }),
          tx.classroom.findMany({
            where: { tenantId, branchId: destination.id },
          }),
        ])

        const currentSession = (await tx.academicSession.findFirst({
          where: { tenantId, isCurrent: true },
        })) ?? (await tx.academicSession.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        }))

        if (!currentSession) {
          throw new Error('No active academic session found for tenant. Create an academic session first.')
        }

        const destMap = new Map<string, (typeof destClassrooms)[0]>(
          destClassrooms.map((c) => [`${c.name.trim().toLowerCase()}::${c.programType}`, c])
        )

        for (const src of srcClassrooms) {
          const key = `${src.name.trim().toLowerCase()}::${src.programType}`
          const existing = destMap.get(key)

          if (existing) {
            if (conflictStrategy === 'OVERWRITE') {
              await tx.classroom.update({
                where: { id: existing.id },
                data: {
                  capacity: src.capacity,
                  ageBandMinMonths: src.ageBandMinMonths,
                  ageBandMaxMonths: src.ageBandMaxMonths,
                  isActive: true,
                },
              })
              updated++
            } else {
              skipped++
            }
          } else {
            // Generate unique code scoped to destination branch
            const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
            const code = `${destination.code.toUpperCase()}-${src.programType.slice(0, 3)}-${randomCode}`

            await tx.classroom.create({
              data: {
                tenantId,
                branchId: destination.id,
                academicSessionId: currentSession.id,
                name: src.name,
                code,
                programType: src.programType,
                capacity: src.capacity,
                ageBandMinMonths: src.ageBandMinMonths,
                ageBandMaxMonths: src.ageBandMaxMonths,
                programId: src.programId,
                primaryTeacherId: null, // Strictly excluded!
                isActive: true,
              },
            })
            created++
          }
        }

        results.push({ category: 'classrooms', created, updated, skipped, errors })
      }

      // 2. FEE STRUCTURES
      if (params.categories.includes('fee_structures')) {
        let created = 0
        let updated = 0
        let skipped = 0
        const errors: string[] = []

        const [srcStructures, destStructures] = await Promise.all([
          tx.feeStructure.findMany({
            where: { tenantId, branchId: source.id, deletedAt: null },
            include: { items: true },
          }),
          tx.feeStructure.findMany({
            where: { tenantId, branchId: destination.id, deletedAt: null },
            include: { items: true },
          }),
        ])

        const currentSession = (await tx.academicSession.findFirst({
          where: { tenantId, isCurrent: true },
        })) ?? (await tx.academicSession.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        }))

        const destMap = new Map<string, (typeof destStructures)[0]>(
          destStructures.map((fs) => [`${fs.name.trim().toLowerCase()}::${fs.programType ?? 'ALL'}`, fs])
        )

        for (const src of srcStructures) {
          const key = `${src.name.trim().toLowerCase()}::${src.programType ?? 'ALL'}`
          const existing = destMap.get(key)

          if (existing) {
            if (conflictStrategy === 'OVERWRITE') {
              // Delete existing items and re-insert
              await tx.feeItem.deleteMany({
                where: { feeStructureId: existing.id },
              })

              for (const item of src.items) {
                await tx.feeItem.create({
                  data: {
                    tenantId,
                    feeStructureId: existing.id,
                    feeHeadId: item.feeHeadId,
                    name: item.name,
                    description: item.description,
                    feeType: item.feeType,
                    amountCents: item.amountCents,
                    currency: item.currency,
                    frequency: item.frequency,
                    dueRule: item.dueRule,
                    isRefundable: item.isRefundable,
                    sortOrder: item.sortOrder,
                    status: 'ACTIVE',
                  },
                })
              }
              updated++
            } else {
              skipped++
            }
          } else {
            const newStructure = await tx.feeStructure.create({
              data: {
                tenantId,
                branchId: destination.id,
                academicSessionId: currentSession?.id ?? src.academicSessionId,
                programId: src.programId,
                programType: src.programType,
                name: src.name,
                description: src.description,
                status: src.status,
                createdById: actor.id ?? null,
              },
            })

            for (const item of src.items) {
              await tx.feeItem.create({
                data: {
                  tenantId,
                  feeStructureId: newStructure.id,
                  feeHeadId: item.feeHeadId,
                  name: item.name,
                  description: item.description,
                  feeType: item.feeType,
                  amountCents: item.amountCents,
                  currency: item.currency,
                  frequency: item.frequency,
                  dueRule: item.dueRule,
                  isRefundable: item.isRefundable,
                  sortOrder: item.sortOrder,
                  status: 'ACTIVE',
                },
              })
            }
            created++
          }
        }

        results.push({ category: 'fee_structures', created, updated, skipped, errors })
      }

      // 3. PROGRAMS
      if (params.categories.includes('programs')) {
        let created = 0
        let updated = 0
        let skipped = 0
        const errors: string[] = []

        const [srcProgs, destProgs] = await Promise.all([
          tx.programBranch.findMany({
            where: { tenantId, branchId: source.id, deletedAt: null, isActive: true },
          }),
          tx.programBranch.findMany({
            where: { tenantId, branchId: destination.id, deletedAt: null },
          }),
        ])

        const destMap = new Map<string, (typeof destProgs)[0]>(destProgs.map((pb) => [pb.programId, pb]))

        for (const src of srcProgs) {
          const existing = destMap.get(src.programId)
          if (existing) {
            if (conflictStrategy === 'OVERWRITE') {
              await tx.programBranch.update({
                where: { id: existing.id },
                data: {
                  capacity: src.capacity,
                  isActive: true,
                },
              })
              updated++
            } else {
              skipped++
            }
          } else {
            await tx.programBranch.create({
              data: {
                tenantId,
                branchId: destination.id,
                programId: src.programId,
                capacity: src.capacity,
                isActive: true,
                displayOrder: src.displayOrder,
              },
            })
            created++
          }
        }

        results.push({ category: 'programs', created, updated, skipped, errors })
      }

      // 4. FACILITIES
      if (params.categories.includes('facilities')) {
        let created = 0
        let updated = 0
        let skipped = 0
        const errors: string[] = []

        const [srcFac, destFac] = await Promise.all([
          tx.facility.findMany({
            where: { tenantId, branchId: source.id, deletedAt: null, isActive: true },
          }),
          tx.facility.findMany({
            where: { tenantId, branchId: destination.id, deletedAt: null },
          }),
        ])

        const destMap = new Map<string, (typeof destFac)[0]>(
          destFac.map((f) => [`${f.name.trim().toLowerCase()}::${f.type}`, f])
        )

        for (const src of srcFac) {
          const key = `${src.name.trim().toLowerCase()}::${src.type}`
          const existing = destMap.get(key)

          if (existing) {
            if (conflictStrategy === 'OVERWRITE') {
              await tx.facility.update({
                where: { id: existing.id },
                data: {
                  capacity: src.capacity,
                  floorOrArea: src.floorOrArea,
                  ageSuitability: src.ageSuitability,
                  isActive: true,
                },
              })
              updated++
            } else {
              skipped++
            }
          } else {
            const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
            const code = `${destination.code.toUpperCase()}-FAC-${randomCode}`

            await tx.facility.create({
              data: {
                tenantId,
                branchId: destination.id,
                type: src.type,
                name: src.name,
                code,
                capacity: src.capacity,
                floorOrArea: src.floorOrArea,
                ageSuitability: src.ageSuitability,
                isActive: true,
              },
            })
            created++
          }
        }

        results.push({ category: 'facilities', created, updated, skipped, errors })
      }
    })

    const totalCreated = results.reduce((sum, r) => sum + r.created, 0)
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0)
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0)

    // Audit log
    await recordAudit({
      tenantId,
      branchId: destination.id,
      actorId: actor.id ?? null,
      actorName: actor.name ?? 'system',
      actorRole: actor.role ?? 'ADMIN',
      action: 'SETUP_BRANCH_COPY',
      entity: 'BranchSetup',
      entityId: destination.id,
      module: 'SETUP',
      summary: `Copied configuration from ${source.name} to ${destination.name}: ${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped (strategy: ${conflictStrategy})`,
      newValues: {
        sourceBranchId: source.id,
        sourceBranchName: source.name,
        destinationBranchId: destination.id,
        destinationBranchName: destination.name,
        categories: params.categories,
        conflictStrategy,
        results,
      },
    })

    return {
      success: true,
      sourceBranch: { id: source.id, name: source.name },
      destinationBranch: { id: destination.id, name: destination.name },
      conflictStrategy,
      categories: results,
      totalCreated,
      totalUpdated,
      totalSkipped,
      message: `Setup successfully copied to ${destination.name} (${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped).`,
    }
  }
}
