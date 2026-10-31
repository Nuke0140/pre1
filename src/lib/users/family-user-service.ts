import { db } from '@/lib/db'
import { UserRole, UserStatus, Relationship } from '@prisma/client'
import { FamilyCreateInput, validateFamilyInput } from './user-validation'
import { UserIdentityService } from './user-identity-service'
import { UsernameService } from './username-service'
import { StudentService } from '@/lib/students/student-service'
import { recordAudit } from '@/lib/audit'

export interface FamilyContext {
  tenantId: string
  actorId?: string
  actorName?: string
  actorRole?: string
  actorRoles?: string[]
  actorBranchId?: string | null
  authorizedBranchIds?: string[]
  reqMeta?: {
    ipAddress?: string
    userAgent?: string
  }
}

export interface FamilyKpiAggregates {
  totalParents: number
  linkedStudents: number
  multiChildParents: number
  totalGuardians: number
  authorizedPickupTotal: number
  pinSetTotal: number
}

export interface FamilyKpiOptions {
  branchId?: string | null
}

export function normalizeRelationship(rel?: string): Relationship {
  if (!rel) return 'GUARDIAN'
  const upper = rel.toUpperCase().trim().replace(/[\s\-_]+/g, '_')
  if (upper === 'FATHER' || upper === 'DAD') return 'FATHER'
  if (upper === 'MOTHER' || upper === 'MOM') return 'MOTHER'
  if (upper === 'SIBLING' || upper === 'BROTHER' || upper === 'SISTER') return 'SIBLING'
  if (upper.includes('GRAND') || upper === 'NANA' || upper === 'NANI' || upper === 'DADA' || upper === 'DADI') return 'GRANDPARENT'
  if (upper === 'LEGAL_GUARDIAN') return 'LEGAL_GUARDIAN'
  if (upper === 'GUARDIAN') return 'GUARDIAN'
  return 'OTHER'
}

// High-performance in-memory TTL cache for heavy multi-table family KPI aggregations
const KPI_CACHE_TTL_MS = 15_000 // 15 seconds TTL

interface CachedFamilyKpis {
  data: FamilyKpiAggregates
  expiresAt: number
}

const familyKpiCache = new Map<string, CachedFamilyKpis>()

export function invalidateFamilyKpiCache(tenantId?: string): void {
  if (tenantId) {
    for (const key of familyKpiCache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        familyKpiCache.delete(key)
      }
    }
  } else {
    familyKpiCache.clear()
  }
}

export class FamilyUserService {
  /**
   * Helper: Counts active PARENT accounts linked to a student
   */
  static async countActiveParentsForStudent(
    tenantId: string,
    studentId: string,
    excludeUserId?: string,
    client: any = db
  ): Promise<number> {
    const parentLinks = await client.studentGuardian.findMany({
      where: {
        studentId,
        student: { tenantId, deletedAt: null },
      },
      include: {
        guardian: {
          include: {
            user: {
              include: {
                memberships: {
                  where: {
                    tenantId,
                    deletedAt: null,
                    OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }],
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
      },
    })

    const activeParents = parentLinks.filter((link) => {
      const u = link.guardian.user
      if (!u) return false
      if (excludeUserId && u.id === excludeUserId) return false
      return u.memberships && u.memberships.length > 0
    })

    return activeParents.length
  }

  /**
   * Authoritative KPI Aggregates for Family Users Directory & Home Dashboard
   * Evaluated across the full database matching the school and branch scope,
   * completely independent of client-side pagination or page size limits.
   */
  static async getFamilyKpis(
    tenantId: string,
    options?: FamilyKpiOptions
  ): Promise<FamilyKpiAggregates> {
    if (!tenantId) {
      return {
        totalParents: 0,
        linkedStudents: 0,
        multiChildParents: 0,
        totalGuardians: 0,
        authorizedPickupTotal: 0,
        pinSetTotal: 0,
      }
    }

    const branchId =
      options?.branchId &&
      options.branchId !== 'ALL' &&
      options.branchId !== 'undefined' &&
      options.branchId !== 'null'
        ? options.branchId
        : undefined

    const cacheKey = `${tenantId}:${branchId || 'ALL'}`
    const cached = familyKpiCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    // 1. Total Parents: authoritative parent login accounts in tenant
    const parentWhere: any = {
      tenantId,
      deletedAt: null,
      OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }],
    }
    if (branchId) {
      parentWhere.AND = [
        {
          OR: [
            { branchId },
            { assignedBranches: { some: { branchId } } },
            {
              user: {
                guardianProfile: {
                  studentLinks: {
                    some: { student: { branchId, deletedAt: null } },
                  },
                },
              },
            },
          ],
        },
      ]
    }
    const totalParentsPromise = db.tenantUser.count({ where: parentWhere })

    // 2. Linked Students: distinct students linked to at least one parent (guaranteed no double-counting)
    const linkedStudentsPromise = db.student.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
        guardians: {
          some: {
            guardian: {
              deletedAt: null,
              OR: [
                {
                  user: {
                    memberships: {
                      some: {
                        tenantId,
                        deletedAt: null,
                        OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }],
                      },
                    },
                  },
                },
                {
                  relationship: { in: ['FATHER', 'MOTHER'] },
                },
              ],
            },
          },
        },
      },
    })

    // 3. Multi-child parents: parent identities linked to > 1 distinct active students
    const parentLinksPromise = db.studentGuardian.groupBy({
      by: ['guardianId'],
      where: {
        student: {
          tenantId,
          deletedAt: null,
          ...(branchId ? { branchId } : {}),
        },
        guardian: {
          tenantId,
          deletedAt: null,
          OR: [
            {
              user: {
                memberships: {
                  some: {
                    tenantId,
                    deletedAt: null,
                    OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }],
                  },
                },
              },
            },
            {
              relationship: { in: ['FATHER', 'MOTHER'] },
            },
          ],
        },
      },
      _count: {
        studentId: true,
      },
    })

    // 4. Guardians: non-parent guardians/escorts (including non-login pickup escorts)
    // Distinguishes between emergency contacts who lack pickup authorization and true pickup guardians
    const guardianBaseWhere: any = {
      tenantId,
      deletedAt: null,
      NOT: {
        user: {
          memberships: {
            some: {
              tenantId,
              deletedAt: null,
              OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }],
            },
          },
        },
      },
      relationship: { notIn: ['FATHER', 'MOTHER'] },
      OR: [
        {
          user: {
            memberships: {
              some: {
                tenantId,
                deletedAt: null,
                OR: [{ role: 'GUARDIAN' }, { roles: { has: 'GUARDIAN' } }],
              },
            },
          },
        },
        {
          studentLinks: {
            some: {
              canPickup: true,
              student: {
                tenantId,
                deletedAt: null,
                ...(branchId ? { branchId } : {}),
              },
            },
          },
        },
        {
          pickupPin: { not: null },
          studentLinks: {
            some: {
              student: {
                tenantId,
                deletedAt: null,
                ...(branchId ? { branchId } : {}),
              },
            },
          },
        },
      ],
    }

    if (branchId) {
      guardianBaseWhere.studentLinks = {
        some: {
          student: {
            tenantId,
            branchId,
            deletedAt: null,
          },
        },
      }
    }

    const totalGuardiansPromise = db.guardian.count({ where: guardianBaseWhere })

    // 5. Authorized pickup total (Gate Clearance)
    const authorizedPickupWhere: any = {
      ...guardianBaseWhere,
      studentLinks: {
        some: {
          canPickup: true,
          student: {
            tenantId,
            deletedAt: null,
            ...(branchId ? { branchId } : {}),
          },
        },
      },
    }
    const authorizedPickupPromise = db.guardian.count({ where: authorizedPickupWhere })

    // 6. Gate PIN set total
    const pinSetWhere: any = {
      ...guardianBaseWhere,
      OR: [
        { pickupPin: { not: null } },
        {
          studentLinks: {
            some: {
              pickupPin: { not: null },
              student: {
                tenantId,
                deletedAt: null,
                ...(branchId ? { branchId } : {}),
              },
            },
          },
        },
      ],
    }
    const pinSetPromise = db.guardian.count({ where: pinSetWhere })

    const [
      totalParents,
      linkedStudents,
      parentLinks,
      totalGuardians,
      authorizedPickupTotal,
      pinSetTotal,
    ] = await Promise.all([
      totalParentsPromise,
      linkedStudentsPromise,
      parentLinksPromise,
      totalGuardiansPromise,
      authorizedPickupPromise,
      pinSetPromise,
    ])

    const multiChildParents = parentLinks.filter((l) => l._count.studentId > 1).length

    const result: FamilyKpiAggregates = {
      totalParents,
      linkedStudents,
      multiChildParents,
      totalGuardians,
      authorizedPickupTotal,
      pinSetTotal,
    }

    familyKpiCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + KPI_CACHE_TTL_MS,
    })

    return result
  }

  /**
   * Authoritative Flow 2: Unified Parent / Guardian Creation
   * Supports PARENT and GUARDIAN roles with Existing or New Child options
   */
  static async createFamilyUser(ctx: FamilyContext, input: FamilyCreateInput) {
    if (!ctx.tenantId) throw new Error('Tenant identifier is required')

    // 1. Validation
    const validation = validateFamilyInput(input)
    if (!validation.valid) {
      const err: any = new Error(validation.errors.join(', '))
      err.code = 'VALIDATION_ERROR'
      err.details = validation.errors
      throw err
    }

    const assignedRole: UserRole = input.role // 'PARENT' or 'GUARDIAN'
    const initialStatus: UserStatus = input.status || 'ACTIVE'
    const perms = {
      canPickup: input.permissions?.canPickup !== false,
      pickupPin: input.permissions?.pickupPin?.trim() || null,
      receivesCommunication: input.permissions?.receivesCommunication !== false,
      isFeePayer: input.permissions?.isFeePayer !== undefined ? Boolean(input.permissions.isFeePayer) : assignedRole === 'PARENT',
    }

    // 2. Pre-check Existing Child & Max 2 Parents rule
    let targetStudent: any = null
    if (input.childMode === 'EXISTING') {
      targetStudent = await db.student.findFirst({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(input.existingChild?.studentId ? { id: input.existingChild.studentId } : {}),
          ...(input.existingChild?.admissionNo ? { admissionNo: input.existingChild.admissionNo.trim() } : {}),
        },
        include: {
          currentClassroom: true,
        },
      })

      if (!targetStudent) {
        const err: any = new Error('Selected student not found in this school')
        err.code = 'STUDENT_NOT_FOUND'
        throw err
      }

      // Branch check if actor is branch scoped
      const effectiveRoles = (ctx.actorRoles && ctx.actorRoles.length > 0 ? ctx.actorRoles : [ctx.actorRole]).filter(Boolean)
      const isInstitutionWide = effectiveRoles.some((r) => ['OWNER', 'PLATFORM_ADMIN'].includes(r as any))
      const allowedBranches = ctx.authorizedBranchIds || (ctx.actorBranchId ? [ctx.actorBranchId] : [])

      if (!isInstitutionWide && allowedBranches.length > 0) {
        if (targetStudent.branchId && !allowedBranches.includes(targetStudent.branchId)) {
          throw new Error('Unauthorized: Selected student belongs to another campus branch')
        }
      } else if (ctx.actorBranchId && targetStudent.branchId !== ctx.actorBranchId && !isInstitutionWide) {
        throw new Error('Unauthorized: Selected student belongs to another campus branch')
      }

      // Enforce Max 2 PARENT accounts rule
      if (assignedRole === 'PARENT') {
        const existingParentCount = await this.countActiveParentsForStudent(ctx.tenantId, targetStudent.id)
        if (existingParentCount >= 2) {
          const err: any = new Error(
            `Child ${targetStudent.firstName} ${targetStudent.lastName || ''} already has 2 registered Parent accounts. An additional caregiver must be registered with the GUARDIAN role.`
          )
          err.code = 'PARENT_LIMIT_REACHED'
          throw err
        }
      }
    }

    // 3. Execution: Either create new child or link existing child
    if (input.childMode === 'CREATE') {
      // ─────────────────────────────────────────────────────────────
      // Branch A: CREATE NEW CHILD via StudentService
      // ─────────────────────────────────────────────────────────────
      const childData = input.newChild!

      const effectiveRoles = (ctx.actorRoles && ctx.actorRoles.length > 0 ? ctx.actorRoles : [ctx.actorRole]).filter(Boolean)
      const isInstitutionWide = effectiveRoles.some((r) => ['OWNER', 'PLATFORM_ADMIN'].includes(r as any))
      const allowedBranches = ctx.authorizedBranchIds || (ctx.actorBranchId ? [ctx.actorBranchId] : [])
      if (!isInstitutionWide && allowedBranches.length > 0) {
        if (childData.branchId && !allowedBranches.includes(childData.branchId)) {
          throw new Error('Unauthorized: Cannot create student in another campus branch')
        }
      } else if (ctx.actorBranchId && childData.branchId && childData.branchId !== ctx.actorBranchId && !isInstitutionWide) {
        throw new Error('Unauthorized: Cannot create student in another campus branch')
      }

      // Generate child username
      const childUsername = await UsernameService.generateUniqueUsername({
        name: `${childData.firstName} ${childData.lastName || ''}`.trim(),
        type: 'STUDENT',
      })

      // Resolve parent user identity first inside transaction
      return await db.$transaction(async (tx) => {
        // Step 1: Create User
        const { user } = await UserIdentityService.resolveOrCreateUser(tx, {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          avatarUrl: input.avatarUrl,
          username: input.username,
          password: input.password,
          status: initialStatus,
          usernameType: assignedRole,
          locale: input.locale,
        })

        // Step 2: Create TenantUser membership
        const membership = await UserIdentityService.createOrUpdateMembership(tx, {
          tenantId: ctx.tenantId,
          userId: user.id,
          role: assignedRole,
          roles: [assignedRole],
          branchId: childData.branchId || null,
          status: initialStatus,
        })

        // Step 3: Create student using existing StudentService
        // StudentService handles admission number, seat number, allocations, and guardian creation
        const mappedRel = normalizeRelationship(input.relationship)

        const studentResult = await StudentService.createStudent(
          {
            tenantId: ctx.tenantId,
            branchId: childData.branchId,
            actorId: ctx.actorId,
            actorName: ctx.actorName,
            actorRole: ctx.actorRole,
          },
          {
            firstName: childData.firstName,
            lastName: childData.lastName,
            dob: childData.dob,
            gender: childData.gender,
            bloodGroup: childData.bloodGroup,
            programType: childData.programType,
            classroomId: childData.classroomId,
            branchId: childData.branchId,
            seatNumber: childData.seatNumber,
            photoUrl: childData.photoUrl,
            username: childUsername,
            guardianName: input.fullName.trim(),
            guardianPhone: input.phone.trim(),
            guardianEmail: input.email?.trim() || undefined,
            guardianRelationship: mappedRel,
            guardianUsername: user.username,
            canPickup: perms.canPickup,
            isFeePayer: perms.isFeePayer,
            confirmDuplicate: input.confirmDuplicate ?? false,
          },
          tx
        )

        const studentId = (studentResult as any).id || (studentResult as any).student?.id

        // Step 4: Link created Guardian record to User account and update link properties
        const studentLink = await tx.studentGuardian.findFirst({
          where: { studentId },
          include: { guardian: true },
        })

        if (studentLink) {
          await tx.studentGuardian.update({
            where: { id: studentLink.id },
            data: {
              relationship: mappedRel,
              isPrimary: Boolean(input.isPrimaryContact),
              canPickup: perms.canPickup,
              pickupPin: perms.pickupPin,
              receivesComm: perms.receivesCommunication,
              isFeePayer: perms.isFeePayer,
            },
          })
        }

        let createdGuardian =
          studentLink?.guardian ||
          (await tx.guardian.findFirst({
            where: { tenantId: ctx.tenantId, phone: input.phone.trim() },
          }))

        const existingUserGuardian = await tx.guardian.findUnique({
          where: { userId: user.id },
        })

        if (existingUserGuardian && createdGuardian && existingUserGuardian.id !== createdGuardian.id) {
          if (studentLink) {
            await tx.studentGuardian.update({
              where: { id: studentLink.id },
              data: { guardianId: existingUserGuardian.id },
            })
          }
          await tx.guardian.delete({ where: { id: createdGuardian.id } }).catch(() => {})
          createdGuardian = existingUserGuardian
        } else if (existingUserGuardian) {
          createdGuardian = existingUserGuardian
        }

        if (createdGuardian) {
          createdGuardian = await tx.guardian.update({
            where: { id: createdGuardian.id },
            data: {
              userId: user.id,
              relationship: mappedRel,
              pickupPin: perms.pickupPin || createdGuardian.pickupPin || null,
              isPrimaryContact: Boolean(input.isPrimaryContact),
              ...(input.occupation !== undefined ? { occupation: input.occupation?.trim() || null } : {}),
            },
          })
        }

        // Step 5: Assign child username on student record
        const createdStudent = await tx.student.update({
          where: { id: studentId },
          data: { username: childUsername },
          include: { currentClassroom: true },
        })

        // Step 6: Audit log
        await recordAudit({
          tenantId: ctx.tenantId,
          branchId: createdStudent.branchId || undefined,
          actorId: ctx.actorId,
          actorName: ctx.actorName,
          actorRole: ctx.actorRole,
          action: assignedRole === 'PARENT' ? 'PARENT_CREATED' : 'GUARDIAN_CREATED',
          entity: 'User',
          entityId: user.id,
          module: 'Users',
          summary: `Created ${assignedRole} ${user.fullName} and enrolled new child ${createdStudent.firstName} (${createdStudent.admissionNo})`,
          ipAddress: ctx.reqMeta?.ipAddress,
          userAgent: ctx.reqMeta?.userAgent,
          newValues: {
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            role: assignedRole,
            studentId: createdStudent.id,
            admissionNo: createdStudent.admissionNo,
            childUsername,
          },
        })

        return {
          user,
          membership,
          guardian: createdGuardian,
          student: createdStudent,
          isNewStudent: true,
        }
      }, {
        maxWait: 10000,
        timeout: 25000,
      })
    } else {
      // ─────────────────────────────────────────────────────────────
      // Branch B: LINK TO EXISTING CHILD
      // ─────────────────────────────────────────────────────────────
      return await db.$transaction(async (tx) => {
        // Step 0: Lock student row to serialize concurrent parent linking for this student
        await tx.$queryRaw`SELECT id FROM students WHERE id = ${targetStudent.id} FOR UPDATE`

        // In-transaction atomic check for Max 2 Parents policy
        if (assignedRole === 'PARENT') {
          const inTxParentCount = await this.countActiveParentsForStudent(ctx.tenantId, targetStudent.id, undefined, tx)
          if (inTxParentCount >= 2) {
            const err: any = new Error(
              `Child ${targetStudent.firstName} ${targetStudent.lastName || ''} already has 2 registered Parent accounts. An additional caregiver must be registered with the GUARDIAN role.`
            )
            err.code = 'PARENT_LIMIT_REACHED'
            throw err
          }
        }

        // Step 1: Create or resolve User identity
        const { user } = await UserIdentityService.resolveOrCreateUser(tx, {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          avatarUrl: input.avatarUrl,
          username: input.username,
          password: input.password,
          status: initialStatus,
          usernameType: assignedRole,
          locale: input.locale,
        })

        // Step 2: Create or update TenantUser membership
        const membership = await UserIdentityService.createOrUpdateMembership(tx, {
          tenantId: ctx.tenantId,
          userId: user.id,
          role: assignedRole,
          roles: [assignedRole],
          branchId: targetStudent.branchId || null,
          status: initialStatus,
        })

        // Step 3: Resolve or create Guardian record
        let guardian = await tx.guardian.findFirst({
          where: { userId: user.id },
        })

        // If not found by userId, check by phone + name to respect shared household phone numbers
        if (!guardian) {
          const byPhone = await tx.guardian.findFirst({
            where: { tenantId: ctx.tenantId, phone: input.phone.trim(), deletedAt: null },
          })
          if (byPhone) {
            const nameMatches = byPhone.fullName.toLowerCase().trim() === input.fullName.trim().toLowerCase()
            if (nameMatches && (!byPhone.userId || byPhone.userId === user.id)) {
              guardian = await tx.guardian.update({
                where: { id: byPhone.id },
                data: { userId: user.id },
              })
            }
          }
        }

        const mappedRel = normalizeRelationship(input.relationship)

        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              tenantId: ctx.tenantId,
              userId: user.id,
              fullName: input.fullName.trim(),
              phone: input.phone.trim(),
              email: input.email?.trim() || null,
              relationship: mappedRel,
              pickupPin: perms.pickupPin,
              isPrimaryContact: Boolean(input.isPrimaryContact),
              occupation: input.occupation?.trim() || null,
            },
          })
        } else {
          // Update pickupPin if provided
          guardian = await tx.guardian.update({
            where: { id: guardian.id },
            data: {
              relationship: mappedRel,
              pickupPin: perms.pickupPin || guardian.pickupPin,
              isPrimaryContact: input.isPrimaryContact !== undefined ? Boolean(input.isPrimaryContact) : guardian.isPrimaryContact,
              ...(input.occupation !== undefined ? { occupation: input.occupation?.trim() || null } : {}),
            },
          })
        }

        // Step 4: Create or update StudentGuardian junction
        const existingLink = await tx.studentGuardian.findUnique({
          where: {
            studentId_guardianId: {
              studentId: targetStudent.id,
              guardianId: guardian.id,
            },
          },
        })

        let studentGuardian = existingLink
        if (studentGuardian) {
          studentGuardian = await tx.studentGuardian.update({
            where: { id: studentGuardian.id },
            data: {
              relationship: mappedRel,
              isPrimary: Boolean(input.isPrimaryContact),
              canPickup: perms.canPickup,
              pickupPin: perms.pickupPin || guardian.pickupPin || null,
              receivesComm: perms.receivesCommunication,
              isFeePayer: perms.isFeePayer,
            },
          })
        } else {
          studentGuardian = await tx.studentGuardian.create({
            data: {
              studentId: targetStudent.id,
              guardianId: guardian.id,
              relationship: mappedRel,
              isPrimary: Boolean(input.isPrimaryContact),
              canPickup: perms.canPickup,
              pickupPin: perms.pickupPin || guardian.pickupPin || null,
              receivesComm: perms.receivesCommunication,
              isFeePayer: perms.isFeePayer,
            },
          })
        }

        // Step 4b: Multi-child support (linking additional siblings in same transaction)
        if (input.additionalChildren && input.additionalChildren.length > 0) {
          for (const extra of input.additionalChildren) {
            if (!extra.studentId && !extra.admissionNo) continue
            const extraStudent = await tx.student.findFirst({
              where: {
                tenantId: ctx.tenantId,
                deletedAt: null,
                ...(extra.studentId ? { id: extra.studentId } : {}),
                ...(extra.admissionNo ? { admissionNo: extra.admissionNo.trim() } : {}),
              },
            })
            if (!extraStudent) continue

            // Branch check for additional children
            if (
              ctx.actorBranchId &&
              extraStudent.branchId !== ctx.actorBranchId &&
              ctx.actorRole !== 'OWNER' &&
              ctx.actorRole !== 'PLATFORM_ADMIN'
            ) {
              throw new Error(`Unauthorized: Additional child ${extraStudent.firstName} belongs to another campus branch`)
            }

            await tx.$queryRaw`SELECT id FROM students WHERE id = ${extraStudent.id} FOR UPDATE`
            if (assignedRole === 'PARENT') {
              const inTxExtraParents = await this.countActiveParentsForStudent(ctx.tenantId, extraStudent.id, user.id, tx)
              if (inTxExtraParents >= 2) {
                throw new Error(
                  `Child ${extraStudent.firstName} already has 2 registered Parent accounts. An additional caregiver must be registered with the GUARDIAN role.`
                )
              }
            }

            const extraRel = extra.relationship ? normalizeRelationship(extra.relationship) : mappedRel
            const extraExistingLink = await tx.studentGuardian.findUnique({
              where: {
                studentId_guardianId: {
                  studentId: extraStudent.id,
                  guardianId: guardian.id,
                },
              },
            })
            if (!extraExistingLink) {
              await tx.studentGuardian.create({
                data: {
                  studentId: extraStudent.id,
                  guardianId: guardian.id,
                  relationship: extraRel,
                  isPrimary: false,
                  canPickup: perms.canPickup,
                  pickupPin: perms.pickupPin || guardian.pickupPin || null,
                  receivesComm: perms.receivesCommunication,
                  isFeePayer: perms.isFeePayer,
                },
              })
            }
          }
        }

        // If primary contact, ensure other guardians for this student are marked non-primary
        if (input.isPrimaryContact) {
          await tx.studentGuardian.updateMany({
            where: {
              studentId: targetStudent.id,
              guardianId: { not: guardian.id },
            },
            data: { isPrimary: false },
          })
        }

        // Step 5: Audit log
        await recordAudit({
          tenantId: ctx.tenantId,
          branchId: targetStudent.branchId || undefined,
          actorId: ctx.actorId,
          actorName: ctx.actorName,
          actorRole: ctx.actorRole,
          action: assignedRole === 'PARENT' ? 'PARENT_CREATED' : 'GUARDIAN_CREATED',
          entity: 'User',
          entityId: user.id,
          module: 'Users',
          summary: `Linked ${assignedRole} ${user.fullName} to existing student ${targetStudent.firstName} (${targetStudent.admissionNo})`,
          ipAddress: ctx.reqMeta?.ipAddress,
          userAgent: ctx.reqMeta?.userAgent,
          newValues: {
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            role: assignedRole,
            studentId: targetStudent.id,
            admissionNo: targetStudent.admissionNo,
            relationship: input.relationship,
          },
        })

        return {
          user,
          membership,
          guardian,
          student: targetStudent,
          studentGuardian,
          isNewStudent: false,
          isAlreadyLinked: Boolean(existingLink),
        }
      }, {
        maxWait: 10000,
        timeout: 25000,
      })
    }
  }

  /**
   * Helper: Links an additional student to an existing guardian or user
   */
  static async linkStudentToGuardian(
    ctx: FamilyContext,
    params: {
      userId?: string
      guardianId?: string
      studentAdmissionNo?: string
      studentId?: string
      relationship?: string
      permissions?: {
        canPickup?: boolean
        pickupPin?: string | null
        receivesCommunication?: boolean
        isFeePayer?: boolean
      }
    }
  ) {
    if (!ctx.tenantId) throw new Error('Tenant identifier is required')

    return await db.$transaction(async (tx) => {
      // 1. Resolve guardian
      let guardian = params.guardianId
        ? await tx.guardian.findFirst({ where: { id: params.guardianId, tenantId: ctx.tenantId } })
        : params.userId
        ? await tx.guardian.findFirst({ where: { userId: params.userId, tenantId: ctx.tenantId } })
        : null

      if (!guardian) throw new Error('Guardian profile not found')

      // 2. Resolve target student
      const student = await tx.student.findFirst({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(params.studentId ? { id: params.studentId } : {}),
          ...(params.studentAdmissionNo ? { admissionNo: params.studentAdmissionNo.trim() } : {}),
        },
      })
      if (!student) throw new Error('Student not found in this school')

      // Branch boundary check: Branch-scoped actor cannot link a student belonging to another campus
      const effectiveRoles = (ctx.actorRoles && ctx.actorRoles.length > 0 ? ctx.actorRoles : [ctx.actorRole]).filter(Boolean)
      const isInstitutionWide = effectiveRoles.some((r) => ['OWNER', 'PLATFORM_ADMIN'].includes(r as any))
      const allowedBranches = ctx.authorizedBranchIds || (ctx.actorBranchId ? [ctx.actorBranchId] : [])
      if (!isInstitutionWide && allowedBranches.length > 0) {
        if (student.branchId && !allowedBranches.includes(student.branchId)) {
          throw new Error('Unauthorized: Cannot link student belonging to another campus branch')
        }
      } else if (ctx.actorBranchId && student.branchId !== ctx.actorBranchId && !isInstitutionWide) {
        throw new Error('Unauthorized: Cannot link student belonging to another campus branch')
      }

      await tx.$queryRaw`SELECT id FROM students WHERE id = ${student.id} FOR UPDATE`

      // 3. If parent account, check max 2 parent accounts limit
      const user = guardian.userId ? await tx.user.findUnique({ where: { id: guardian.userId } }) : null
      const tenantUser = guardian.userId
        ? await tx.tenantUser.findFirst({ where: { userId: guardian.userId, tenantId: ctx.tenantId } })
        : null

      const isParent = tenantUser?.role === 'PARENT' || tenantUser?.roles.includes('PARENT')
      if (isParent) {
        const activeParents = await this.countActiveParentsForStudent(ctx.tenantId, student.id, user?.id, tx)
        if (activeParents >= 2) {
          throw new Error(
            `Child ${student.firstName} already has 2 registered Parent accounts. An additional caregiver must be registered with the GUARDIAN role.`
          )
        }
      }

      // 4. Create or update StudentGuardian link
      const mappedRel = normalizeRelationship(params.relationship || guardian.relationship)
      const existingLink = await tx.studentGuardian.findUnique({
        where: {
          studentId_guardianId: {
            studentId: student.id,
            guardianId: guardian.id,
          },
        },
      })

      let link = existingLink
      if (link) {
        link = await tx.studentGuardian.update({
          where: { id: link.id },
          data: {
            relationship: mappedRel,
            canPickup: params.permissions?.canPickup !== false,
            pickupPin: params.permissions?.pickupPin || guardian.pickupPin || null,
            receivesComm: params.permissions?.receivesCommunication !== false,
            isFeePayer: params.permissions?.isFeePayer !== undefined ? Boolean(params.permissions.isFeePayer) : isParent,
          },
        })
      } else {
        link = await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            relationship: mappedRel,
            canPickup: params.permissions?.canPickup !== false,
            pickupPin: params.permissions?.pickupPin || guardian.pickupPin || null,
            receivesComm: params.permissions?.receivesCommunication !== false,
            isFeePayer: params.permissions?.isFeePayer !== undefined ? Boolean(params.permissions.isFeePayer) : isParent,
          },
        })
      }

      // 5. AuditLog
      if (user) {
        await recordAudit({
          tenantId: ctx.tenantId,
          branchId: student.branchId || undefined,
          actorId: ctx.actorId,
          actorName: ctx.actorName,
          actorRole: ctx.actorRole,
          action: isParent ? 'PARENT_LINKED' : 'GUARDIAN_LINKED',
          entity: 'User',
          entityId: user.id,
          module: 'Users',
          summary: `Linked ${guardian.fullName} to sibling student ${student.firstName} (${student.admissionNo})`,
          ipAddress: ctx.reqMeta?.ipAddress,
          userAgent: ctx.reqMeta?.userAgent,
          newValues: {
            userId: user.id,
            studentId: student.id,
            admissionNo: student.admissionNo,
            relationship: mappedRel,
          },
        })
      }

      return {
        guardian,
        student,
        studentGuardian: link,
        isAlreadyLinked: Boolean(existingLink),
      }
    }, {
      maxWait: 10000,
      timeout: 25000,
    })
  }
}
