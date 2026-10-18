import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export type SeatAvailabilityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'FULL'
  | 'WAITLIST_ONLY'
  | 'UNCONFIGURED'

export interface CapacityMetrics {
  id: string
  name: string
  classroomId: string
  classroomName: string
  classroomCode?: string | null
  programType?: string | null
  programId?: string | null
  programName?: string | null
  branchId: string
  branchName?: string | null
  capacity: number
  enrolledCount: number
  pendingCount: number
  totalOccupied: number
  availableSeats: number
  occupancyPercent: number
  status: SeatAvailabilityStatus
  statusLabel: string
  occupancySummary: string
  waitlistCount: number
  isWaitlistEligible: boolean
  canEnroll: boolean
  teacherName?: string | null
  hasTeacher: boolean
}

export interface ProgramCapacitySummary {
  id: string
  name: string
  programType: string
  programId?: string | null
  programName: string
  branchId?: string | null
  totalCapacity: number
  totalEnrolled: number
  totalPending: number
  totalOccupied: number
  totalAvailableSeats: number
  sectionCount: number
  status: SeatAvailabilityStatus
  statusLabel: string
  occupancySummary: string
  waitlistCount: number
  isWaitlistEligible: boolean
  classrooms: CapacityMetrics[]
}

export interface CapacityThresholdOptions {
  limitedThreshold?: number // Default: 3 seats or fewer
  enableWaitlistWhenFull?: boolean // Default: true (if waitlist supported)
}

/**
 * Pure helper to compute standard capacity metrics for a classroom.
 */
export function computeCapacityMetrics(params: {
  classroomId: string
  classroomName: string
  classroomCode?: string | null
  programType?: string | null
  programId?: string | null
  programName?: string | null
  branchId: string
  branchName?: string | null
  capacity: number
  enrolledCount: number
  pendingCount?: number
  waitlistCount?: number
  teacherName?: string | null
  options?: CapacityThresholdOptions
}): CapacityMetrics {
  const {
    classroomId,
    classroomName,
    classroomCode,
    programType,
    programId,
    programName,
    branchId,
    branchName,
    capacity,
    enrolledCount,
    pendingCount = 0,
    waitlistCount = 0,
    teacherName,
    options,
  } = params

  const limitedThreshold = options?.limitedThreshold ?? 3
  const enableWaitlist = options?.enableWaitlistWhenFull ?? true

  const totalOccupied = enrolledCount + pendingCount
  const hasCapacity = capacity > 0
  const availableSeats = hasCapacity ? Math.max(0, capacity - totalOccupied) : 0
  const occupancyPercent = hasCapacity
    ? Math.min(100, Math.round((totalOccupied / capacity) * 100))
    : 0

  let status: SeatAvailabilityStatus
  let statusLabel: string

  if (!hasCapacity) {
    status = 'UNCONFIGURED'
    statusLabel = 'Capacity not set'
  } else if (availableSeats === 0) {
    if (enableWaitlist) {
      status = 'WAITLIST_ONLY'
      statusLabel = 'Full · Waitlist only'
    } else {
      status = 'FULL'
      statusLabel = 'Full'
    }
  } else if (availableSeats <= limitedThreshold) {
    status = 'LIMITED'
    statusLabel = availableSeats === 1 ? '1 seat left' : `${availableSeats} seats left`
  } else {
    status = 'AVAILABLE'
    statusLabel = `${availableSeats} seats left`
  }

  const occupancySummary = hasCapacity
    ? `${totalOccupied}/${capacity} occupied`
    : '0/0 occupied'

  return {
    id: classroomId,
    name: classroomName,
    classroomId,
    classroomName,
    classroomCode: classroomCode || null,
    programType: programType || null,
    programId: programId || null,
    programName: programName || null,
    branchId,
    branchName: branchName || null,
    capacity,
    enrolledCount,
    pendingCount,
    totalOccupied,
    availableSeats,
    occupancyPercent,
    status,
    statusLabel,
    occupancySummary,
    waitlistCount,
    isWaitlistEligible: status === 'WAITLIST_ONLY' || status === 'FULL',
    canEnroll: availableSeats > 0,
    teacherName: teacherName || null,
    hasTeacher: Boolean(teacherName && teacherName.trim().length > 0),
  }
}

/**
 * Pure helper to aggregate classroom metrics into a program-level summary.
 */
export function aggregateProgramCapacity(
  programType: string,
  programName: string,
  classrooms: CapacityMetrics[],
  options?: CapacityThresholdOptions
): ProgramCapacitySummary {
  const limitedThreshold = options?.limitedThreshold ?? 3
  const enableWaitlist = options?.enableWaitlistWhenFull ?? true

  const totalCapacity = classrooms.reduce((sum, c) => sum + c.capacity, 0)
  const totalEnrolled = classrooms.reduce((sum, c) => sum + c.enrolledCount, 0)
  const totalPending = classrooms.reduce((sum, c) => sum + c.pendingCount, 0)
  const totalOccupied = totalEnrolled + totalPending
  const totalAvailableSeats = classrooms.reduce((sum, c) => sum + c.availableSeats, 0)
  const waitlistCount = classrooms.reduce((sum, c) => sum + c.waitlistCount, 0)

  let status: SeatAvailabilityStatus
  let statusLabel: string

  if (totalCapacity === 0 || classrooms.length === 0) {
    status = 'UNCONFIGURED'
    statusLabel = 'No sections configured'
  } else if (totalAvailableSeats === 0) {
    if (enableWaitlist) {
      status = 'WAITLIST_ONLY'
      statusLabel = 'Full · Waitlist only'
    } else {
      status = 'FULL'
      statusLabel = 'Full'
    }
  } else if (totalAvailableSeats <= limitedThreshold) {
    status = 'LIMITED'
    statusLabel = totalAvailableSeats === 1 ? '1 seat left' : `${totalAvailableSeats} seats left`
  } else {
    status = 'AVAILABLE'
    statusLabel = `${totalAvailableSeats} seats left`
  }

  const occupancySummary = totalCapacity > 0
    ? `${totalOccupied}/${totalCapacity} occupied`
    : '0/0 occupied'

  return {
    id: programType,
    name: programName,
    programType,
    programId: classrooms[0]?.programId || null,
    programName,
    branchId: classrooms[0]?.branchId || null,
    totalCapacity,
    totalEnrolled,
    totalPending,
    totalOccupied,
    totalAvailableSeats,
    sectionCount: classrooms.length,
    status,
    statusLabel,
    occupancySummary,
    waitlistCount,
    isWaitlistEligible: status === 'WAITLIST_ONLY' || status === 'FULL',
    classrooms,
  }
}

/**
 * Authoritative Database Service for Capacity and Availability.
 */
export class CapacityService {
  /**
   * Retrieves live capacity metrics for all classrooms matching scope.
   */
  static async getClassroomsCapacityList(params: {
    tenantId: string
    branchId?: string | null
    branchIds?: string[]
    academicSessionId?: string | null
    programType?: string | null
    options?: CapacityThresholdOptions
  }): Promise<CapacityMetrics[]> {
    const { tenantId, branchId, branchIds, academicSessionId, programType, options } = params

    const where: Prisma.ClassroomWhereInput = {
      tenantId,
      isActive: true,
    }

    if (branchId) {
      where.branchId = branchId
    } else if (branchIds && branchIds.length > 0) {
      where.branchId = { in: branchIds }
    }

    if (academicSessionId) {
      where.academicSessionId = academicSessionId
    }

    if (programType) {
      where.programType = programType
    }

    const classrooms = await db.classroom.findMany({
      where,
      include: {
        primaryTeacher: { select: { fullName: true } },
        program: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ programType: 'asc' }, { name: 'asc' }],
    })

    if (classrooms.length === 0) {
      return []
    }

    const classroomIds = classrooms.map((c) => c.id)
    const branchIdsList = Array.from(new Set(classrooms.map((c) => c.branchId).filter(Boolean)))
    const branches = branchIdsList.length > 0 ? await db.branch.findMany({
      where: { id: { in: branchIdsList }, tenantId },
      select: { id: true, name: true, code: true },
    }) : []
    const branchMap = new Map(branches.map((b) => [b.id, b]))

    // 1. Authoritative active enrollment count per classroom
    const activeStudentsGroup = await db.student.groupBy({
      by: ['currentClassroomId'],
      where: {
        tenantId,
        currentClassroomId: { in: classroomIds },
        status: 'ACTIVE',
        deletedAt: null,
      },
      _count: { _all: true },
    })
    const activeStudentMap = new Map<string, number>()
    for (const g of activeStudentsGroup) {
      if (g.currentClassroomId) {
        activeStudentMap.set(g.currentClassroomId, g._count._all)
      }
    }

    // 2. Pending reserved seats from approved/fee-received applications targeting this classroom
    const pendingAppsGroup = await db.admissionApplication.groupBy({
      by: ['classroomId'],
      where: {
        tenantId,
        classroomId: { in: classroomIds },
        studentId: null, // Not yet created as active student
        status: { in: ['OFFER_ACCEPTED', 'APPROVED', 'OFFER_SENT'] },
      },
      _count: { _all: true },
    })
    const pendingAppMap = new Map<string, number>()
    for (const g of pendingAppsGroup) {
      if (g.classroomId) {
        pendingAppMap.set(g.classroomId, g._count._all)
      }
    }

    // 3. Waitlist count per classroom
    const waitlistGroup = await db.admissionApplication.groupBy({
      by: ['classroomId'],
      where: {
        tenantId,
        classroomId: { in: classroomIds },
        status: 'WAITLISTED',
      },
      _count: { _all: true },
    })
    const waitlistMap = new Map<string, number>()
    for (const g of waitlistGroup) {
      if (g.classroomId) {
        waitlistMap.set(g.classroomId, g._count._all)
      }
    }

    return classrooms.map((c) => {
      const enrolledCount = activeStudentMap.get(c.id) || 0
      const pendingCount = pendingAppMap.get(c.id) || 0
      const waitlistCount = waitlistMap.get(c.id) || 0

      return computeCapacityMetrics({
        classroomId: c.id,
        classroomName: c.name,
        classroomCode: c.code,
        programType: c.programType,
        programId: c.programId || c.program?.id,
        programName: c.program?.name || c.programType,
        branchId: c.branchId,
        branchName: branchMap.get(c.branchId)?.name || null,
        capacity: c.capacity,
        enrolledCount,
        pendingCount,
        waitlistCount,
        teacherName: c.primaryTeacher?.fullName,
        options,
      })
    })
  }

  /**
   * Retrieves single classroom live capacity metrics.
   */
  static async getClassroomCapacity(
    tenantId: string,
    classroomId: string,
    options?: CapacityThresholdOptions
  ): Promise<CapacityMetrics | null> {
    const classroom = await db.classroom.findFirst({
      where: { id: classroomId, tenantId },
      include: {
        primaryTeacher: { select: { fullName: true } },
        program: { select: { id: true, name: true } },
      },
    })

    if (!classroom) return null

    const branch = classroom.branchId
      ? await db.branch.findFirst({
          where: { id: classroom.branchId, tenantId },
          select: { id: true, name: true },
        })
      : null

    const [enrolledCount, pendingCount, waitlistCount] = await Promise.all([
      db.student.count({
        where: {
          tenantId,
          currentClassroomId: classroom.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      db.admissionApplication.count({
        where: {
          tenantId,
          classroomId: classroom.id,
          studentId: null,
          status: { in: ['OFFER_ACCEPTED', 'APPROVED', 'OFFER_SENT'] },
        },
      }),
      db.admissionApplication.count({
        where: {
          tenantId,
          classroomId: classroom.id,
          status: 'WAITLISTED',
        },
      }),
    ])

    return computeCapacityMetrics({
      classroomId: classroom.id,
      classroomName: classroom.name,
      classroomCode: classroom.code,
      programType: classroom.programType,
      programId: classroom.programId || classroom.program?.id,
      programName: classroom.program?.name || classroom.programType,
      branchId: classroom.branchId,
      branchName: branch?.name || null,
      capacity: classroom.capacity,
      enrolledCount,
      pendingCount,
      waitlistCount,
      teacherName: classroom.primaryTeacher?.fullName,
      options,
    })
  }

  /**
   * Aggregates capacity metrics across programs for a branch/session.
   */
  static async getProgramCapacitySummary(params: {
    tenantId: string
    branchId?: string | null
    branchIds?: string[]
    academicSessionId?: string | null
    options?: CapacityThresholdOptions
  }): Promise<ProgramCapacitySummary[]> {
    const classrooms = await this.getClassroomsCapacityList(params)

    // Group classrooms by programType
    const grouped = new Map<string, CapacityMetrics[]>()
    for (const c of classrooms) {
      const key = c.programType || 'GENERAL'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(c)
    }

    const summaries: ProgramCapacitySummary[] = []
    for (const [progType, classList] of grouped.entries()) {
      const progName = classList[0]?.programName || progType
      summaries.push(aggregateProgramCapacity(progType, progName, classList, params.options))
    }

    return summaries.sort((a, b) => a.programName.localeCompare(b.programName))
  }

  /**
   * In-Transaction Atomic Concurrency Guard.
   * Throws CLASSROOM_FULL if classroom is at or over capacity.
   */
  static async assertClassroomCapacity(
    tx: Prisma.TransactionClient,
    params: {
      tenantId: string
      classroomId: string
      excludeStudentId?: string | null
    }
  ): Promise<{ classroom: { id: string; name: string; capacity: number }; activeCount: number }> {
    const { tenantId, classroomId, excludeStudentId } = params

    const classroom = await tx.classroom.findFirst({
      where: { id: classroomId, tenantId },
      select: { id: true, name: true, capacity: true },
    })

    if (!classroom) {
      const err: any = new Error(`Classroom ${classroomId} not found`)
      err.code = 'NOT_FOUND'
      throw err
    }

    const studentWhere: Prisma.StudentWhereInput = {
      tenantId,
      currentClassroomId: classroomId,
      status: 'ACTIVE',
      deletedAt: null,
    }

    if (excludeStudentId) {
      studentWhere.id = { not: excludeStudentId }
    }

    const activeCount = await tx.student.count({ where: studentWhere })

    if (activeCount >= classroom.capacity) {
      const err: any = new Error(
        `Classroom ${classroom.name} has reached maximum capacity (${activeCount}/${classroom.capacity}).`
      )
      err.code = 'CLASSROOM_FULL'
      err.details = {
        classroomId: classroom.id,
        classroomName: classroom.name,
        capacity: classroom.capacity,
        occupied: activeCount,
        availableSeats: 0,
      }
      throw err
    }

    return { classroom, activeCount }
  }
}
