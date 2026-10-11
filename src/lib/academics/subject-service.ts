import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'
import { SessionPayload } from '@/lib/auth'
import type { SubjectType } from '@prisma/client'

export interface CreateSubjectInput {
  name: string
  code: string
  shortName?: string
  description?: string
  subjectType?: SubjectType
  programIds?: string[]
}

export interface UpdateSubjectInput {
  name?: string
  shortName?: string
  description?: string
  subjectType?: SubjectType
  status?: string
  programIds?: string[]
}

export class SubjectService {
  /**
   * List all subjects for a tenant with optional status/type/program/classroom filter
   */
  static async getSubjects(
    tenantId: string,
    filter?: {
      status?: string
      subjectType?: SubjectType
      programId?: string
      classroomId?: string
    }
  ) {
    let targetProgramId = filter?.programId

    if (filter?.classroomId && !targetProgramId) {
      const cls = await db.classroom.findFirst({
        where: { id: filter.classroomId, tenantId },
        select: { programId: true },
      })
      if (cls?.programId) {
        targetProgramId = cls.programId
      }
    }

    return db.subject.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.subjectType ? { subjectType: filter.subjectType } : {}),
        ...(targetProgramId
          ? {
              OR: [
                { programMappings: { some: { programId: targetProgramId } } },
                ...(filter?.classroomId ? [{ classroomMappings: { some: { classroomId: filter.classroomId } } }] : []),
              ],
            }
          : {}),
      },
      include: {
        programMappings: {
          include: {
            program: {
              select: { id: true, code: true, name: true, programType: true },
            },
          },
        },
        classroomMappings: {
          include: {
            classroom: {
              select: { id: true, name: true, code: true, branchId: true },
            },
            specialistTeacher: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Resolve teacher/user authorized subjects according to rule:
   * Authenticated Teacher -> Assigned Class -> Assigned Program -> Configured Subjects
   */
  static async getTeacherEligibleSubjects(
    session: SessionPayload,
    filter?: {
      classroomId?: string
      programId?: string
      status?: string
      subjectType?: SubjectType
    }
  ) {
    const tenantId = session.tenantId!
    const role = session.role
    const roles = session.roles || [role]
    const isAdmin = roles.some((r) => ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'PLATFORM_ADMIN', 'ADMIN'].includes(r))
    const activeStatus = filter?.status || 'ACTIVE'

    // 1. If Admin/Owner: Full access to configured active subjects for the tenant
    if (isAdmin) {
      return this.getSubjects(tenantId, {
        status: activeStatus,
        subjectType: filter?.subjectType,
        programId: filter?.programId,
        classroomId: filter?.classroomId,
      })
    }

    // 2. If Teacher: Scoped strictly to assigned classes & programs
    const teacherUserId = session.uid

    const assignedClassrooms = await db.classroom.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { primaryTeacherId: teacherUserId },
          { subjectMappings: { some: { specialistTeacherId: teacherUserId } } },
        ],
      },
      select: { id: true, programId: true },
    })

    if (assignedClassrooms.length === 0) {
      return [] // Teacher has no assigned classrooms/programs -> return empty array
    }

    // If a specific classroomId was requested, verify teacher is assigned to it
    if (filter?.classroomId) {
      const isAssigned = assignedClassrooms.some((c) => c.id === filter.classroomId)
      if (!isAssigned) {
        return [] // Teacher not authorized for requested classroom
      }
      const targetClassroom = assignedClassrooms.find((c) => c.id === filter.classroomId)
      const targetProgramId = targetClassroom?.programId || filter.programId

      return db.subject.findMany({
        where: {
          tenantId,
          deletedAt: null,
          ...(activeStatus ? { status: activeStatus } : {}),
          ...(filter?.subjectType ? { subjectType: filter.subjectType } : {}),
          OR: [
            ...(targetProgramId ? [{ programMappings: { some: { programId: targetProgramId } } }] : []),
            { classroomMappings: { some: { classroomId: filter.classroomId } } },
          ],
        },
        include: {
          programMappings: {
            include: {
              program: {
                select: { id: true, code: true, name: true, programType: true },
              },
            },
          },
          classroomMappings: {
            include: {
              classroom: {
                select: { id: true, name: true, code: true, branchId: true },
              },
              specialistTeacher: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })
    }

    // Otherwise, collect all assigned program IDs for this teacher
    const assignedProgramIds = assignedClassrooms
      .map((c) => c.programId)
      .filter((pId): pId is string => Boolean(pId))
    const assignedClassroomIds = assignedClassrooms.map((c) => c.id)

    return db.subject.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(activeStatus ? { status: activeStatus } : {}),
        ...(filter?.subjectType ? { subjectType: filter.subjectType } : {}),
        OR: [
          ...(assignedProgramIds.length > 0 ? [{ programMappings: { some: { programId: { in: assignedProgramIds } } } }] : []),
          { classroomMappings: { some: { classroomId: { in: assignedClassroomIds } } } },
        ],
      },
      include: {
        programMappings: {
          include: {
            program: {
              select: { id: true, code: true, name: true, programType: true },
            },
          },
        },
        classroomMappings: {
          include: {
            classroom: {
              select: { id: true, name: true, code: true, branchId: true },
            },
            specialistTeacher: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Validate subject eligibility when creating or updating Daily Diary / Schedule entries
   */
  static async validateSubjectEligibility(
    tenantId: string,
    classroomId: string,
    subjectTitleOrId: string,
    session: SessionPayload
  ) {
    if (!subjectTitleOrId || !subjectTitleOrId.trim()) {
      return true
    }

    const title = subjectTitleOrId.trim()

    // 1. Fetch subject from DB
    const subject = await db.subject.findFirst({
      where: {
        tenantId,
        OR: [
          { id: title },
          { name: { equals: title, mode: 'insensitive' } },
          { code: { equals: title.toUpperCase(), mode: 'insensitive' } },
        ],
      },
      include: {
        programMappings: true,
        classroomMappings: true,
      },
    })

    if (!subject) {
      throw new Error(`VALIDATION_ERROR: Subject "${title}" is not configured in Setup. Please select an existing subject from Setup.`)
    }

    if (subject.deletedAt !== null || subject.status !== 'ACTIVE') {
      throw new Error(`VALIDATION_ERROR: Subject "${subject.name}" is inactive and cannot be assigned to new entries.`)
    }

    // 2. Resolve Classroom
    const classroom = await db.classroom.findFirst({
      where: { id: classroomId, tenantId },
      select: { id: true, programId: true },
    })

    if (!classroom) {
      throw new Error('VALIDATION_ERROR: Classroom not found')
    }

    // 3. Verify program-to-subject or classroom-to-subject mapping
    const isProgramMapped = classroom.programId
      ? subject.programMappings.some((pm) => pm.programId === classroom.programId)
      : false
    const isClassroomMapped = subject.classroomMappings.some((cm) => cm.classroomId === classroomId)

    if (!isProgramMapped && !isClassroomMapped) {
      throw new Error(`VALIDATION_ERROR: Subject "${subject.name}" is not configured for this class's program. Please configure subjects in Setup.`)
    }

    return subject
  }

  /**
   * Get single subject by ID or code
   */
  static async getSubject(tenantId: string, idOrCode: string) {
    return db.subject.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
      },
      include: {
        programMappings: {
          include: {
            program: {
              select: { id: true, code: true, name: true, programType: true },
            },
          },
        },
        classroomMappings: {
          include: {
            classroom: {
              select: { id: true, name: true, code: true, branchId: true, primaryTeacherId: true },
            },
            specialistTeacher: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    })
  }

  /**
   * Create a new Subject and optionally map to programs
   */
  static async createSubject(
    tenantId: string,
    data: CreateSubjectInput,
    actor: { id: string; name: string; role?: string }
  ) {
    const tenantExists = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenantExists) {
      throw new Error('Tenant not found. Please log out and log in again to refresh your session.')
    }

    const code = data.code.trim().toUpperCase()
    const existing = await db.subject.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    })

    if (existing) {
      if (existing.deletedAt) {
        // Reactivate soft-deleted subject
        return await db.$transaction(async (tx) => {
          const updated = await tx.subject.update({
            where: { id: existing.id },
            data: {
              name: data.name.trim(),
              shortName: data.shortName?.trim() || null,
              description: data.description?.trim() || null,
              subjectType: data.subjectType || 'CORE',
              status: 'ACTIVE',
              deletedAt: null,
              updatedAt: new Date(),
            },
          })

          if (data.programIds && data.programIds.length > 0) {
            await tx.programSubject.deleteMany({ where: { subjectId: updated.id } })
            await tx.programSubject.createMany({
              data: data.programIds.map((pId) => ({
                tenantId,
                programId: pId,
                subjectId: updated.id,
              })),
              skipDuplicates: true,
            })
          }

          await AuditService.record(
            {
              tenantId,
              actorId: actor.id,
              actorName: actor.name,
              actorRole: actor.role || 'OWNER',
              action: 'SUBJECT_REACTIVATED',
              entity: 'Subject',
              entityId: updated.id,
              module: 'ACADEMICS',
              summary: `Reactivated subject ${updated.name} (${updated.code})`,
              severity: 'INFO',
            },
            tx
          )

          return updated
        })
      }
      throw new Error(`Subject with code "${code}" already exists in this school`)
    }

    return await db.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          tenantId,
          code,
          name: data.name.trim(),
          shortName: data.shortName?.trim() || null,
          description: data.description?.trim() || null,
          subjectType: data.subjectType || 'CORE',
          status: 'ACTIVE',
        },
      })

      if (data.programIds && data.programIds.length > 0) {
        await tx.programSubject.createMany({
          data: data.programIds.map((pId) => ({
            tenantId,
            programId: pId,
            subjectId: subject.id,
          })),
          skipDuplicates: true,
        })
      }

      await AuditService.record(
        {
          tenantId,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'OWNER',
          action: 'SUBJECT_CREATED',
          entity: 'Subject',
          entityId: subject.id,
          module: 'ACADEMICS',
          summary: `Created subject ${subject.name} (${subject.code}) type: ${subject.subjectType}`,
          severity: 'INFO',
        },
        tx
      )

      return subject
    })
  }

  /**
   * Update Subject details and program mappings
   */
  static async updateSubject(
    tenantId: string,
    id: string,
    data: UpdateSubjectInput,
    actor: { id: string; name: string; role?: string }
  ) {
    const subject = await db.subject.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!subject) throw new Error('Subject not found')

    return await db.$transaction(async (tx) => {
      const updated = await tx.subject.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          shortName: data.shortName !== undefined ? (data.shortName?.trim() || null) : undefined,
          description: data.description !== undefined ? (data.description?.trim() || null) : undefined,
          subjectType: data.subjectType !== undefined ? data.subjectType : undefined,
          status: data.status !== undefined ? data.status : undefined,
          updatedAt: new Date(),
        },
      })

      if (data.programIds !== undefined) {
        await tx.programSubject.deleteMany({ where: { subjectId: id } })
        if (data.programIds.length > 0) {
          await tx.programSubject.createMany({
            data: data.programIds.map((pId) => ({
              tenantId,
              programId: pId,
              subjectId: id,
            })),
            skipDuplicates: true,
          })
        }
      }

      await AuditService.record(
        {
          tenantId,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'OWNER',
          action: 'SUBJECT_UPDATED',
          entity: 'Subject',
          entityId: id,
          module: 'ACADEMICS',
          summary: `Updated subject ${updated.name} (${updated.code})`,
          severity: 'INFO',
        },
        tx
      )

      return updated
    })
  }

  /**
   * Soft delete a subject
   */
  static async deleteSubject(
    tenantId: string,
    id: string,
    actor: { id: string; name: string; role?: string }
  ) {
    const subject = await db.subject.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!subject) throw new Error('Subject not found')

    return await db.$transaction(async (tx) => {
      const deleted = await tx.subject.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'INACTIVE',
        },
      })

      await AuditService.record(
        {
          tenantId,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role || 'OWNER',
          action: 'SUBJECT_DELETED',
          entity: 'Subject',
          entityId: id,
          module: 'ACADEMICS',
          summary: `Deactivated subject ${subject.name} (${subject.code})`,
          severity: 'WARNING',
        },
        tx
      )

      return deleted
    })
  }

  /**
   * Map Subject to Classroom with optional specialist teacher
   */
  static async mapSubjectToClassroom(
    tenantId: string,
    classroomId: string,
    subjectId: string,
    specialistTeacherId?: string | null
  ) {
    return db.classroomSubject.upsert({
      where: {
        classroomId_subjectId: { classroomId, subjectId },
      },
      create: {
        tenantId,
        classroomId,
        subjectId,
        specialistTeacherId: specialistTeacherId || null,
      },
      update: {
        specialistTeacherId: specialistTeacherId || null,
      },
    })
  }
}
