import { db } from '@/lib/db'
import { SessionPayload } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { SubjectService } from '@/lib/academics/subject-service'
import { AttendanceStatus, ActivityStatus, ObservationConcern } from '@prisma/client'
import { isoDate } from '@/lib/format'
import { NotificationEngine } from '@/lib/notifications/notification-engine'
import { getAuthorizedBranchIds, isBranchAuthorized } from '@/lib/auth-api'

export interface DailyDiaryScope {
  tenantId: string
  branchId?: string | null
  userId: string
  role: string
  isTeacher: boolean
  isAdmin: boolean
}

export function getScopeFromSession(session: SessionPayload): DailyDiaryScope {
  const role = session.role
  const roles = session.roles || [role]
  const isTeacher = roles.includes('TEACHER')
  const isAdmin = roles.some((r) => ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'PLATFORM_ADMIN', 'ADMIN'].includes(r))

  return {
    tenantId: session.tenantId!,
    branchId: session.branchId || null,
    userId: session.uid,
    role,
    isTeacher: isTeacher && !isAdmin, // strict teacher if not admin
    isAdmin,
  }
}

function getDayBounds(dateStr: string) {
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
  const dateOnly = new Date(dateStr)
  dateOnly.setUTCHours(0, 0, 0, 0)
  return { startOfDay, endOfDay, dateOnly }
}

/** Convert HH:MM or HH:MM AM/PM time string to total minutes from midnight for overlap comparison */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const clean = timeStr.trim().toUpperCase()
  const isPM = clean.includes('PM')
  const isAM = clean.includes('AM')
  const digitsOnly = clean.replace(/[^0-9:]/g, '')
  const parts = digitsOnly.split(':')
  let hours = parseInt(parts[0], 10) || 0
  const minutes = parseInt(parts[1], 10) || 0
  if (isPM && hours < 12) hours += 12
  if (isAM && hours === 12) hours = 0
  return hours * 60 + minutes
}

/** Helper: Assert that a user has authorized branch and classroom access */
async function assertClassroomAccess(session: SessionPayload, classroomId: string) {
  const tenantId = session.tenantId!
  const scope = getScopeFromSession(session)

  const classroom = await db.classroom.findFirst({
    where: { id: classroomId, tenantId },
    select: { primaryTeacherId: true, branchId: true },
  })

  if (!classroom) {
    throw new Error('Classroom not found')
  }

  if (scope.isAdmin) {
    if (session.branchId && classroom.branchId && classroom.branchId !== session.branchId) {
      const isBranchOk = await isBranchAuthorized(session, classroom.branchId)
      if (!isBranchOk) {
        throw new Error('FORBIDDEN_BRANCH_ACCESS: You are not authorized to access this branch')
      }
    }
    return
  }

  // Teacher scoping: verify classroom assignment
  const isAssigned = classroom.primaryTeacherId === session.uid
  if (!isAssigned) {
    const isMapped = await db.classroomSubject.findFirst({
      where: { classroomId, specialistTeacherId: session.uid },
    })
    if (!isMapped) {
      throw new Error('FORBIDDEN_TEACHER_CLASSROOM_ACCESS: You are only authorized to manage your assigned classroom')
    }
  }

  // Branch boundary check for teachers with specific branchId
  if (session.branchId && classroom.branchId && classroom.branchId !== session.branchId) {
    const isBranchOk = await isBranchAuthorized(session, classroom.branchId)
    if (!isBranchOk) {
      throw new Error('FORBIDDEN_BRANCH_ACCESS: You are not authorized to access this branch')
    }
  }
}

export class DailyDiaryService {
  /**
   * Resolve context: Active Academic Session, available Branches, available Classrooms.
   * If user is a Teacher, return only their assigned classrooms.
   */
  static async getContext(session: SessionPayload) {
    const tenantId = session.tenantId!
    const scope = getScopeFromSession(session)

    // 1. Fetch current/active academic session
    const academicSession = await db.academicSession.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { isCurrent: 'desc' },
      select: { id: true, name: true, isCurrent: true, startDate: true, endDate: true },
    })

    // 2. Fetch branches for tenant
    const allBranches = await db.branch.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true, code: true, isMain: true },
      orderBy: { isMain: 'desc' },
    })

    const authorizedBranches = await getAuthorizedBranchIds(session)
    let branches = authorizedBranches === 'ALL' || authorizedBranches === null
      ? allBranches
      : allBranches.filter((b) => authorizedBranches.includes(b.id))

    // 3. Resolve assigned classrooms
    let classroomsWhere: any = { tenantId, isActive: true }
    if (scope.isTeacher) {
      // Teacher sees only assigned classrooms (primary teacher or mapped specialist)
      classroomsWhere = {
        tenantId,
        isActive: true,
        OR: [
          { primaryTeacherId: session.uid },
          { subjectMappings: { some: { specialistTeacherId: session.uid } } },
        ],
      }
    } else if (authorizedBranches !== 'ALL' && authorizedBranches !== null) {
      classroomsWhere.branchId = { in: authorizedBranches }
    }

    const classrooms = await db.classroom.findMany({
      where: classroomsWhere,
      select: {
        id: true,
        name: true,
        code: true,
        programType: true,
        capacity: true,
        branchId: true,
        academicSessionId: true,
        primaryTeacherId: true,
        primaryTeacher: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: {
            students: { where: { status: 'ACTIVE', deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    if (scope.isTeacher) {
      const teacherBranchIds = Array.from(
        new Set([
          ...(session.branchId ? [session.branchId] : []),
          ...classrooms.map((c) => c.branchId).filter(Boolean),
        ])
      )
      branches = branches.filter((b) => teacherBranchIds.includes(b.id))
    } else if (scope.branchId) {
      branches = allBranches.filter((b) => b.id === scope.branchId)
    }

    // 4. Fetch teachers for Admin dropdown scheduling
    let teachers: { id: string; fullName: string; email: string | null }[] = []
    if (scope.isAdmin) {
      teachers = await db.user.findMany({
        where: {
          memberships: { some: { tenantId, role: { in: ['TEACHER', 'COORDINATOR', 'PRINCIPAL'] } } },
          status: 'ACTIVE',
        },
        select: { id: true, fullName: true, email: true },
        orderBy: { fullName: 'asc' },
      })
    }

    // 5. Fetch eligible subject list for teacher/admin
    const subjects = await SubjectService.getTeacherEligibleSubjects(session, { status: 'ACTIVE' })

    return {
      user: {
        id: session.uid,
        name: session.name,
        email: session.email,
        role: session.role,
        isTeacher: scope.isTeacher,
        isAdmin: scope.isAdmin,
      },
      academicSession,
      branches,
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        programType: c.programType,
        capacity: c.capacity,
        branchId: c.branchId,
        academicSessionId: c.academicSessionId,
        primaryTeacherId: c.primaryTeacherId,
        teacherName: c.primaryTeacher?.fullName || 'Unassigned',
        studentCount: c._count.students,
      })),
      teachers,
      subjects,
    }
  }

  /**
   * Get Overview summary for a specific classroom & date.
   */
  static async getOverview(session: SessionPayload, classroomId: string, dateStr: string) {
    const tenantId = session.tenantId!
    const { startOfDay, endOfDay, dateOnly } = getDayBounds(dateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, classroomId)

    const classroom = await db.classroom.findFirst({
      where: { id: classroomId, tenantId },
      include: {
        primaryTeacher: { select: { id: true, fullName: true, email: true } },
        academicSession: { select: { id: true, name: true } },
      },
    })

    if (!classroom) {
      throw new Error('Classroom not found')
    }

    const branch = classroom.branchId
      ? await db.branch.findUnique({
          where: { id: classroom.branchId },
          select: { id: true, name: true, code: true },
        })
      : null

    // Fetch active students in classroom
    const students = await db.student.findMany({
      where: { currentClassroomId: classroomId, tenantId, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        photoUrl: true,
        gender: true,
      },
      orderBy: { firstName: 'asc' },
    })

    // Fetch attendance on date
    const attendanceRecords = await db.attendance.findMany({
      where: { classroomId, tenantId, date: dateOnly },
    })

    const attendanceMap = new Map<string, any>(attendanceRecords.map((a) => [a.studentId, a]))

    let present = 0
    let absent = 0
    let late = 0
    let halfDay = 0
    let unmarked = 0

    students.forEach((s) => {
      const rec = attendanceMap.get(s.id)
      if (!rec) {
        unmarked++
      } else {
        switch (rec.status) {
          case 'PRESENT':
            present++
            break
          case 'ABSENT':
            absent++
            break
          case 'LATE':
            late++
            break
          case 'HALF_DAY':
            halfDay++
            break
          default:
            unmarked++
            break
        }
      }
    })

    // Fetch today's activities chronologically sorted by startTime
    const activities = await db.classroomActivity.findMany({
      where: {
        classroomId,
        tenantId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
    })

    const completedActivities = activities.filter((a) => a.status === 'COMPLETED').length
    const coreSubjectsCount = activities.filter((a) =>
      ['CORE_TEACHING', 'CORE_SUBJECT'].includes(a.activityType || '')
    ).length
    const activitiesCount = activities.length - coreSubjectsCount

    // Fetch today's observations
    const observations = await db.observation.findMany({
      where: {
        classroomId,
        tenantId,
        observedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { observedAt: 'desc' },
    })

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        programType: classroom.programType,
        capacity: classroom.capacity,
        teacherName: classroom.primaryTeacher?.fullName || 'Unassigned',
        teacherId: classroom.primaryTeacherId,
        branchName: branch?.name,
        sessionName: classroom.academicSession?.name,
      },
      date: dateStr,
      stats: {
        totalStudents: students.length,
        present,
        absent,
        late,
        halfDay,
        unmarked,
        totalActivities: activities.length,
        coreSubjectsCount,
        activitiesCount,
        completedActivities,
        totalObservations: observations.length,
      },
      activities: activities.map((a) => ({
        id: a.id,
        title: a.title,
        activityType: a.activityType || 'ACTIVITY',
        startTime: a.startTime || '09:00',
        endTime: a.endTime || '09:30',
        teacherId: a.teacherId,
        teacherName: a.teacher?.fullName || classroom.primaryTeacher?.fullName || 'Teacher',
        status: a.status,
        description: a.description,
        actualOutcome: a.actualOutcome,
      })),
      observations: observations.map((o) => ({
        id: o.id,
        studentId: o.studentId,
        studentName: o.student ? `${o.student.firstName} ${o.student.lastName || ''}`.trim() : 'General Class Observation',
        narrative: o.narrative,
        category: o.category || 'General',
        concern: o.concern,
        observedAt: o.observedAt,
      })),
    }
  }

  /**
   * Get Attendance Register for class + date.
   */
  static async getAttendanceRegister(session: SessionPayload, classroomId: string, dateStr: string) {
    const tenantId = session.tenantId!
    const { dateOnly } = getDayBounds(dateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, classroomId)

    const students = await db.student.findMany({
      where: { currentClassroomId: classroomId, tenantId, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        photoUrl: true,
        gender: true,
      },
      orderBy: { firstName: 'asc' },
    })

    const attendanceRows = await db.attendance.findMany({
      where: { classroomId, tenantId, date: dateOnly },
    })

    const attMap = new Map<string, any>(attendanceRows.map((r) => [r.studentId, r]))

    return students.map((s) => {
      const att = attMap.get(s.id)
      return {
        studentId: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        admissionNo: s.admissionNo,
        photoUrl: s.photoUrl,
        gender: s.gender,
        status: (att?.status as AttendanceStatus) || null,
        notes: att?.notes || '',
        markedAt: att?.markedAt || null,
        markedById: att?.markedById || null,
      }
    })
  }

  /**
   * Batch Save / Update Attendance.
   */
  static async saveAttendanceRegister(
    session: SessionPayload,
    classroomId: string,
    dateStr: string,
    records: { studentId: string; status: AttendanceStatus; notes?: string }[]
  ) {
    const tenantId = session.tenantId!
    const { dateOnly } = getDayBounds(dateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
      select: { branchId: true, academicSessionId: true, name: true },
    })

    if (!classroom) throw new Error('Classroom not found')

    const scope = getScopeFromSession(session)

    // Process each student record inside transaction
    const saved = await db.$transaction(async (tx) => {
      const results: any[] = []
      for (const rec of records) {
        const item = await tx.attendance.upsert({
          where: {
            studentId_date: {
              studentId: rec.studentId,
              date: dateOnly,
            },
          },
          update: {
            status: rec.status,
            notes: rec.notes || null,
            markedById: session.uid,
            markedAt: new Date(),
            classroomId,
            branchId: classroom.branchId,
            academicSessionId: classroom.academicSessionId,
          },
          create: {
            tenantId,
            branchId: classroom.branchId,
            classroomId,
            studentId: rec.studentId,
            date: dateOnly,
            status: rec.status,
            notes: rec.notes || null,
            markedById: session.uid,
            academicSessionId: classroom.academicSessionId,
          },
        })
        results.push(item)
      }
      return results
    })

    // Record audit if admin updated
    if (scope.isAdmin) {
      await recordAudit({
        tenantId,
        actorId: session.uid,
        action: 'ATTENDANCE_BATCH_SAVE',
        entity: 'ATTENDANCE',
        entityId: classroomId,
        summary: `Admin ${session.name} updated attendance for class ${classroom.name} on ${dateStr}`,
        newValues: { classroomId, date: dateStr, count: records.length },
      })
    }

    return { success: true, count: saved.length }
  }

  /**
   * Create Today's Timetable / Activity Entry (With time validation & overlap detection)
   */
  static async createActivity(
    session: SessionPayload,
    data: {
      classroomId: string
      dateStr: string
      title: string
      activityType?: string
      startTime?: string
      endTime?: string
      teacherId?: string
      description?: string
    }
  ) {
    const tenantId = session.tenantId!
    const { startOfDay, endOfDay, dateOnly } = getDayBounds(data.dateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, data.classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: data.classroomId },
      select: { academicSessionId: true, primaryTeacherId: true },
    })

    if (!classroom) throw new Error('Classroom not found')

    if (data.title) {
      await SubjectService.validateSubjectEligibility(tenantId, data.classroomId, data.title, session)
    }

    const startStr = data.startTime || '09:00'
    const endStr = data.endTime || '09:30'
    const startMin = timeToMinutes(startStr)
    const endMin = timeToMinutes(endStr)

    if (endMin <= startMin) {
      throw new Error('VALIDATION_ERROR: End Time must be after Start Time')
    }

    // Time Overlap Check with existing active activities for this classroom on the date
    const existingActivities = await db.classroomActivity.findMany({
      where: {
        classroomId: data.classroomId,
        tenantId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
    })

    for (const ext of existingActivities) {
      const extStart = timeToMinutes(ext.startTime || '00:00')
      const extEnd = timeToMinutes(ext.endTime || '23:59')
      if (startMin < extEnd && extStart < endMin) {
        throw new Error(
          `OVERLAP_ERROR: This activity overlaps with "${ext.title}" (${ext.startTime || '00:00'}–${ext.endTime || '23:59'})`
        )
      }
    }

    const activeSession = await db.academicSession.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true },
    })

    const targetSessionId = classroom.academicSessionId || activeSession?.id
    if (!targetSessionId) {
      throw new Error('VALIDATION_ERROR: No active academic session found')
    }

    let targetTeacherId = data.teacherId && data.teacherId.trim() !== '' ? data.teacherId : classroom.primaryTeacherId || session.uid
    if (targetTeacherId) {
      const validUser = await db.tenantUser.findFirst({
        where: { userId: targetTeacherId, tenantId, status: 'ACTIVE' },
        select: { id: true },
      })
      if (!validUser) targetTeacherId = session.uid
    } else {
      targetTeacherId = session.uid
    }

    const activity = await db.classroomActivity.create({
      data: {
        tenantId,
        academicSessionId: targetSessionId,
        classroomId: data.classroomId,
        teacherId: targetTeacherId,
        title: data.title,
        activityType: data.activityType || 'ACTIVITY',
        activityDate: dateOnly,
        startTime: startStr,
        endTime: endStr,
        description: data.description || null,
        status: 'PLANNED',
        createdBy: session.uid,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
    })

    return activity
  }

  /**
   * Create multiple schedule activity entries at once (Daily Schedule Builder)
   */
  static async createActivitiesBatch(
    session: SessionPayload,
    data: {
      classroomId: string
      dateStr: string
      activities: {
        title: string
        activityType?: string
        startTime?: string
        endTime?: string
        teacherId?: string
        description?: string
      }[]
    }
  ) {
    const tenantId = session.tenantId!
    const { startOfDay, endOfDay, dateOnly } = getDayBounds(data.dateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, data.classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: data.classroomId },
      select: { academicSessionId: true, primaryTeacherId: true },
    })

    if (!classroom) throw new Error('Classroom not found')

    for (const act of data.activities) {
      if (act.title) {
        await SubjectService.validateSubjectEligibility(tenantId, data.classroomId, act.title, session)
      }
    }

    const activeSession = await db.academicSession.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true },
    })

    const targetSessionId = classroom.academicSessionId || activeSession?.id
    if (!targetSessionId) {
      throw new Error('VALIDATION_ERROR: No active academic session found')
    }

    if (!data.activities || data.activities.length === 0) {
      throw new Error('VALIDATION_ERROR: At least one activity row is required')
    }

    // 1. Validate internal time ranges and internal overlaps inside the batch
    const parsedRows = data.activities.map((item, idx) => {
      const startStr = item.startTime || '09:00'
      const endStr = item.endTime || '09:30'
      const startMin = timeToMinutes(startStr)
      const endMin = timeToMinutes(endStr)

      if (endMin <= startMin) {
        throw new Error(`VALIDATION_ERROR: Row ${idx + 1} (${item.title || 'Untitled'}): End Time must be after Start Time`)
      }

      return { ...item, startStr, endStr, startMin, endMin }
    })

    for (let i = 0; i < parsedRows.length; i++) {
      for (let j = i + 1; j < parsedRows.length; j++) {
        const r1 = parsedRows[i]
        const r2 = parsedRows[j]
        if (r1.startMin < r2.endMin && r2.startMin < r1.endMin) {
          throw new Error(
            `OVERLAP_ERROR: "${r1.title}" (${r1.startStr}–${r1.endStr}) overlaps with "${r2.title}" (${r2.startStr}–${r2.endStr}) in schedule builder.`
          )
        }
      }
    }

    // 2. Validate overlaps against existing saved database activities
    const existingActivities = await db.classroomActivity.findMany({
      where: {
        classroomId: data.classroomId,
        tenantId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
    })

    for (const row of parsedRows) {
      for (const ext of existingActivities) {
        const extStart = timeToMinutes(ext.startTime || '00:00')
        const extEnd = timeToMinutes(ext.endTime || '23:59')
        if (row.startMin < extEnd && extStart < row.endMin) {
          throw new Error(
            `OVERLAP_ERROR: "${row.title}" (${row.startStr}–${row.endStr}) overlaps with existing activity "${ext.title}" (${ext.startTime || '00:00'}–${ext.endTime || '23:59'})`
          )
        }
      }
    }

    // 3. Create all records in database
    const createdActivities = await db.$transaction(
      parsedRows.map((row) => {
        let targetTeacherId = row.teacherId && row.teacherId.trim() !== '' ? row.teacherId : classroom.primaryTeacherId || session.uid

        return db.classroomActivity.create({
          data: {
            tenantId,
            academicSessionId: targetSessionId,
            classroomId: data.classroomId,
            teacherId: targetTeacherId,
            title: row.title.trim(),
            activityType: row.activityType || 'CORE_SUBJECT',
            activityDate: dateOnly,
            startTime: row.startStr,
            endTime: row.endStr,
            description: row.description || null,
            status: 'PLANNED',
            createdBy: session.uid,
          },
          include: {
            teacher: { select: { id: true, fullName: true } },
          },
        })
      })
    )

    return createdActivities
  }

  /**
   * Update Activity Entry (With time validation & overlap detection)
   */
  static async updateActivity(
    session: SessionPayload,
    activityId: string,
    data: {
      status?: ActivityStatus
      notes?: string
      actualOutcome?: string
      title?: string
      activityType?: string
      startTime?: string
      endTime?: string
      teacherId?: string
      description?: string
    }
  ) {
    const tenantId = session.tenantId!

    const existing = await db.classroomActivity.findFirst({
      where: { id: activityId, tenantId },
    })

    if (!existing) throw new Error('Activity not found')

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, existing.classroomId)

    const titleToValidate = data.title !== undefined ? data.title : existing.title
    if (titleToValidate) {
      await SubjectService.validateSubjectEligibility(tenantId, existing.classroomId, titleToValidate, session)
    }

    const newStart = data.startTime || existing.startTime || '09:00'
    const newEnd = data.endTime || existing.endTime || '09:30'
    const startMin = timeToMinutes(newStart)
    const endMin = timeToMinutes(newEnd)

    if (endMin <= startMin) {
      throw new Error('VALIDATION_ERROR: End Time must be after Start Time')
    }

    // Overlap validation if updating times
    if (data.startTime || data.endTime) {
      const { startOfDay, endOfDay } = getDayBounds(existing.activityDate.toISOString().split('T')[0])
      const otherActivities = await db.classroomActivity.findMany({
        where: {
          classroomId: existing.classroomId,
          tenantId,
          id: { not: activityId },
          activityDate: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
          deletedAt: null,
        },
      })

      for (const ext of otherActivities) {
        const extStart = timeToMinutes(ext.startTime || '00:00')
        const extEnd = timeToMinutes(ext.endTime || '23:59')
        if (startMin < extEnd && extStart < endMin) {
          throw new Error(
            `OVERLAP_ERROR: This activity overlaps with "${ext.title}" (${ext.startTime || '00:00'}–${ext.endTime || '23:59'})`
          )
        }
      }
    }

    const updated = await db.classroomActivity.update({
      where: { id: activityId },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.actualOutcome !== undefined ? { actualOutcome: data.actualOutcome } : data.notes !== undefined ? { actualOutcome: data.notes } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.activityType ? { activityType: data.activityType } : {}),
        ...(data.startTime ? { startTime: data.startTime } : {}),
        ...(data.endTime ? { endTime: data.endTime } : {}),
        ...(data.teacherId !== undefined ? { teacherId: data.teacherId } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        updatedBy: session.uid,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
    })

    return updated
  }

  /**
   * Delete Activity Entry
   */
  static async deleteActivity(session: SessionPayload, activityId: string) {
    const tenantId = session.tenantId!

    const existing = await db.classroomActivity.findFirst({
      where: { id: activityId, tenantId },
    })

    if (!existing) throw new Error('Activity not found')

    await assertClassroomAccess(session, existing.classroomId)

    await db.classroomActivity.update({
      where: { id: activityId },
      data: { deletedAt: new Date(), updatedBy: session.uid },
    })

    return { success: true, id: activityId }
  }

  /**
   * Create Observation (Support General Class or Individual Child)
   */
  static async createObservation(
    session: SessionPayload,
    data: {
      studentId?: string | null
      classroomId: string
      narrative: string
      category?: string
      concern?: ObservationConcern
      activityId?: string
      observedAt?: Date
    }
  ) {
    const tenantId = session.tenantId!

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, data.classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: data.classroomId },
      select: { academicSessionId: true },
    })

    const obs = await db.observation.create({
      data: {
        tenantId,
        academicSessionId: classroom?.academicSessionId,
        studentId: data.studentId || '',
        classroomId: data.classroomId,
        teacherId: session.uid,
        narrative: data.narrative,
        category: data.category || 'General',
        concern: data.concern || 'NORMAL',
        activityId: data.activityId || null,
        status: 'PUBLISHED',
        observedAt: data.observedAt || new Date(),
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return obs
  }

  /**
   * Fetch History (Attendance, Activities, Observations) for a classroom over a date range.
   */
  static async getHistory(
    session: SessionPayload,
    classroomId: string,
    startDateStr: string,
    endDateStr: string,
    studentId?: string
  ) {
    const tenantId = session.tenantId!
    const { startOfDay } = getDayBounds(startDateStr)
    const { endOfDay } = getDayBounds(endDateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, classroomId)

    // Attendance History
    const attendanceWhere: any = {
      classroomId,
      tenantId,
      date: { gte: startOfDay, lte: endOfDay },
    }
    if (studentId) attendanceWhere.studentId = studentId

    const attendance = await db.attendance.findMany({
      where: attendanceWhere,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    // Activities History
    const activities = await db.classroomActivity.findMany({
      where: {
        classroomId,
        tenantId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { activityDate: 'desc' },
      take: 50,
    })

    // Observations History
    const obsWhere: any = {
      classroomId,
      tenantId,
      observedAt: { gte: startOfDay, lte: endOfDay },
    }
    if (studentId) obsWhere.studentId = studentId

    const observations = await db.observation.findMany({
      where: obsWhere,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { observedAt: 'desc' },
      take: 50,
    })

    return {
      attendance: attendance.map((a) => ({
        id: a.id,
        date: a.date.toISOString().split('T')[0],
        studentName: `${a.student.firstName} ${a.student.lastName || ''}`.trim(),
        admissionNo: a.student.admissionNo,
        status: a.status,
        notes: a.notes,
      })),
      activities: activities.map((a) => ({
        id: a.id,
        date: a.activityDate.toISOString().split('T')[0],
        title: a.title,
        activityType: a.activityType || 'ACTIVITY',
        status: a.status,
        actualOutcome: a.actualOutcome,
        teacherName: a.teacher?.fullName || 'Teacher',
      })),
      observations: observations.map((o) => ({
        id: o.id,
        date: o.observedAt.toISOString().split('T')[0],
        studentName: o.student ? `${o.student.firstName} ${o.student.lastName || ''}`.trim() : 'General Class Observation',
        narrative: o.narrative,
        category: o.category || 'General',
        concern: o.concern,
      })),
    }
  }

  /**
   * Admin School-wide Daily Overview (across all classes)
   */
  static async getAdminSchoolOverview(session: SessionPayload, dateStr: string, branchId?: string) {
    const tenantId = session.tenantId!
    const scope = getScopeFromSession(session)

    if (!scope.isAdmin) {
      throw new Error('FORBIDDEN: Admin or Coordinator access required for school overview')
    }

    const { startOfDay, endOfDay, dateOnly } = getDayBounds(dateStr)

    const classroomsWhere: any = { tenantId, isActive: true }
    if (branchId) classroomsWhere.branchId = branchId

    const classrooms = await db.classroom.findMany({
      where: classroomsWhere,
      include: {
        primaryTeacher: { select: { id: true, fullName: true } },
        _count: { select: { students: { where: { status: 'ACTIVE', deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    })

    const classroomIds = classrooms.map((c) => c.id)

    const attendanceRecords = await db.attendance.findMany({
      where: { classroomId: { in: classroomIds }, tenantId, date: dateOnly },
    })

    const activities = await db.classroomActivity.findMany({
      where: {
        classroomId: { in: classroomIds },
        tenantId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      include: {
        classroom: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    let totalStudents = 0
    let present = 0
    let absent = 0
    let late = 0
    let halfDay = 0

    classrooms.forEach((c) => {
      totalStudents += c._count.students
    })

    attendanceRecords.forEach((a) => {
      switch (a.status) {
        case 'PRESENT':
          present++
          break
        case 'ABSENT':
          absent++
          break
        case 'LATE':
          late++
          break
        case 'HALF_DAY':
          halfDay++
          break
      }
    })

    const unmarked = Math.max(0, totalStudents - present - absent - late - halfDay)

    const coreSubjectsCount = activities.filter((a) =>
      ['CORE_TEACHING', 'CORE_SUBJECT'].includes(a.activityType || '')
    ).length
    const activitiesCount = activities.length - coreSubjectsCount

    const classSummaries = classrooms.map((c) => {
      const cAtt = attendanceRecords.filter((a) => a.classroomId === c.id)
      const cPres = cAtt.filter((a) => a.status === 'PRESENT').length
      const cAbs = cAtt.filter((a) => a.status === 'ABSENT').length
      const cLate = cAtt.filter((a) => a.status === 'LATE').length
      const cHalf = cAtt.filter((a) => a.status === 'HALF_DAY').length
      const cUnmarked = Math.max(0, c._count.students - cPres - cAbs - cLate - cHalf)
      const cAct = activities.filter((a) => a.classroomId === c.id)
      const cCore = cAct.filter((a) => ['CORE_TEACHING', 'CORE_SUBJECT'].includes(a.activityType || '')).length

      return {
        id: c.id,
        name: c.name,
        programType: c.programType,
        teacherName: c.primaryTeacher?.fullName || 'Unassigned',
        studentCount: c._count.students,
        present: cPres,
        absent: cAbs,
        late: cLate,
        halfDay: cHalf,
        unmarked: cUnmarked,
        activitiesCount: cAct.length,
        coreSubjectsCount: cCore,
        nonCoreActivitiesCount: cAct.length - cCore,
        completedActivities: cAct.filter((a) => a.status === 'COMPLETED').length,
      }
    })

    return {
      date: dateStr,
      stats: {
        totalClasses: classrooms.length,
        totalStudents,
        present,
        absent,
        late,
        halfDay,
        unmarked,
        totalActivities: activities.length,
        coreSubjectsCount,
        activitiesCount,
      },
      classes: classSummaries,
      schedule: activities.map((a) => ({
        id: a.id,
        classroomId: a.classroomId,
        className: a.classroom.name,
        teacherName: a.teacher?.fullName || 'Teacher',
        title: a.title,
        activityType: a.activityType || 'ACTIVITY',
        startTime: a.startTime || '09:00',
        endTime: a.endTime || '09:30',
        status: a.status,
      })),
    }
  }

  /**
   * Get Unified Classroom Day Stream combining scheduled activities, attendance, meals,
   * naps, observations, care/hygiene, and incidents into a strict chronological stream.
   */
  static async getDayStream(session: SessionPayload, classroomId: string, dateStr: string) {
    const tenantId = session.tenantId!
    const { startOfDay, endOfDay, dateOnly } = getDayBounds(dateStr)

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, classroomId)

    const classroom = await db.classroom.findFirst({
      where: { id: classroomId, tenantId },
      include: {
        primaryTeacher: { select: { id: true, fullName: true, email: true } },
        academicSession: { select: { id: true, name: true } },
      },
    })

    if (!classroom) {
      throw new Error('Classroom not found')
    }

    const branch = classroom.branchId
      ? await db.branch.findUnique({
          where: { id: classroom.branchId },
          select: { id: true, name: true, code: true },
        })
      : null

    // 1. Fetch active students in classroom
    const students = await db.student.findMany({
      where: { currentClassroomId: classroomId, tenantId, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        photoUrl: true,
        gender: true,
      },
      orderBy: { firstName: 'asc' },
    })

    const studentMap = new Map(students.map((s) => [s.id, s]))

    // 2. Fetch Attendance on date
    const attendanceRecords = await db.attendance.findMany({
      where: { classroomId, tenantId, date: dateOnly },
    })

    const attendanceMap = new Map<string, any>(attendanceRecords.map((a) => [a.studentId, a]))

    let present = 0
    let absent = 0
    let late = 0
    let halfDay = 0
    let unmarked = 0

    const attendanceStudents = students.map((s) => {
      const rec = attendanceMap.get(s.id)
      const status = rec ? rec.status : null
      if (!rec) {
        unmarked++
      } else {
        switch (rec.status) {
          case 'PRESENT':
            present++
            break
          case 'ABSENT':
            absent++
            break
          case 'LATE':
            late++
            break
          case 'HALF_DAY':
            halfDay++
            break
          default:
            unmarked++
            break
        }
      }
      return {
        studentId: s.id,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        admissionNo: s.admissionNo,
        photoUrl: s.photoUrl,
        status,
        notes: rec?.notes || '',
        markedAt: rec?.markedAt ? rec.markedAt.toISOString() : null,
      }
    })

    // 3. Fetch activities for date
    const activities = await db.classroomActivity.findMany({
      where: {
        classroomId,
        tenantId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
    })

    // 4. Fetch observations for date
    const observations = await db.observation.findMany({
      where: {
        classroomId,
        tenantId,
        observedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        activity: { select: { id: true, title: true } },
      },
      orderBy: { observedAt: 'asc' },
    })

    // 5. Fetch timeline entries (Meals, Naps, Care, Incidents) for date
    const timelineEntries = await db.timelineEntry.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfDay, lte: endOfDay },
        OR: [
          { classroomId },
          { studentId: { in: students.map((s) => s.id) } },
        ],
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Helper functions for time formatting
    const formatTime12 = (timeStr?: string | null): string => {
      if (!timeStr) return '09:00 AM'
      if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
      const parts = timeStr.split(':')
      if (parts.length < 2) return timeStr
      let h = parseInt(parts[0], 10)
      const m = parts[1].padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12
      if (h === 0) h = 12
      return `${h.toString().padStart(2, '0')}:${m} ${ampm}`
    }

    const dateToMinutes = (d: Date): number => {
      return d.getHours() * 60 + d.getMinutes()
    }

    const formatDateToTime12 = (d: Date): string => {
      let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12
      if (h === 0) h = 12
      return `${h.toString().padStart(2, '0')}:${m} ${ampm}`
    }

    const streamEvents: any[] = []

    // A. Add Morning Arrival & Attendance Event
    const attStatus = students.length > 0 && unmarked === 0 ? 'COMPLETED' : (present + absent + late + halfDay > 0 ? 'IN_PROGRESS' : 'PENDING')
    streamEvents.push({
      id: `attendance-${classroomId}-${dateStr}`,
      streamType: 'ATTENDANCE',
      time: '09:00 AM',
      sortMinutes: 540, // 09:00 AM
      title: 'Morning Arrival & Attendance',
      subtitle: `${students.length} Enrolled Students`,
      status: attStatus,
      badge: {
        label: attStatus === 'COMPLETED' ? 'COMPLETED' : (attStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : 'NOT MARKED'),
        variant: attStatus === 'COMPLETED' ? 'success' : (attStatus === 'IN_PROGRESS' ? 'warning' : 'neutral'),
      },
      summary: `${present} Present • ${absent} Absent • ${late} Late${unmarked > 0 ? ` • ${unmarked} Unmarked` : ''}`,
      attendanceStats: {
        total: students.length,
        present,
        absent,
        late,
        halfDay,
        unmarked,
      },
      items: attendanceStudents,
    })

    // B. Add Classroom Activities
    for (const act of activities) {
      const actType = act.activityType || 'ACTIVITY'
      const isMeal = actType === 'MEAL' || act.title.toLowerCase().includes('snack') || act.title.toLowerCase().includes('lunch')
      const isNap = actType === 'NAP' || act.title.toLowerCase().includes('nap') || act.title.toLowerCase().includes('rest')

      let streamType = 'ACTIVITY'
      if (isMeal) streamType = 'MEAL'
      else if (isNap) streamType = 'NAP'

      const startTimeFormatted = formatTime12(act.startTime)
      const endTimeFormatted = formatTime12(act.endTime)
      const sortMin = act.startTime ? timeToMinutes(act.startTime) : 570 // default 09:30 AM

      let badgeVariant = 'neutral'
      if (act.status === 'COMPLETED') badgeVariant = 'success'
      else if (act.status === 'IN_PROGRESS') badgeVariant = 'warning'
      else if (act.status === 'CANCELLED') badgeVariant = 'danger'

      streamEvents.push({
        id: `act-${act.id}`,
        streamType,
        time: startTimeFormatted,
        endTime: endTimeFormatted,
        sortMinutes: sortMin,
        title: act.title,
        subtitle: act.activityType?.replace('_', ' ') || 'Classroom Activity',
        status: act.status,
        badge: {
          label: act.status,
          variant: badgeVariant,
        },
        teacherName: act.teacher?.fullName || classroom.primaryTeacher?.fullName || 'Teacher',
        summary: act.actualOutcome || act.description || `${act.durationMinutes || 30} mins planned`,
        description: act.description,
        actualOutcome: act.actualOutcome,
        instructions: act.instructions,
        materials: act.materials,
        durationMinutes: act.durationMinutes,
        activityId: act.id,
        raw: act,
      })
    }

    // C. Group Meal Timeline Entries
    const mealEntries = timelineEntries.filter((te) => te.type === 'MEAL')
    if (mealEntries.length > 0) {
      // Group by meal title
      const mealGroups = new Map<string, typeof mealEntries>()
      mealEntries.forEach((me) => {
        const key = me.title || 'Fruit Snack'
        if (!mealGroups.has(key)) mealGroups.set(key, [])
        mealGroups.get(key)!.push(me)
      })

      mealGroups.forEach((entries, mealTitle) => {
        const firstEntry = entries[0]
        const entryTime = formatDateToTime12(firstEntry.createdAt)
        const sortMin = dateToMinutes(firstEntry.createdAt)

        let ateAll = 0
        let ateMost = 0
        let ateHalf = 0
        let ateLittle = 0
        let refused = 0

        entries.forEach((e) => {
          const text = (e.body || '').toLowerCase()
          if (text.includes('refused') || text.includes('none') || text.includes('no')) refused++
          else if (text.includes('little')) ateLittle++
          else if (text.includes('half')) ateHalf++
          else if (text.includes('most')) ateMost++
          else ateAll++
        })

        const summaryParts: string[] = []
        if (ateAll > 0) summaryParts.push(`${ateAll} Ate All`)
        if (ateMost > 0) summaryParts.push(`${ateMost} Ate Most`)
        if (ateHalf > 0) summaryParts.push(`${ateHalf} Ate Half`)
        if (ateLittle > 0) summaryParts.push(`${ateLittle} Ate Little`)
        if (refused > 0) summaryParts.push(`${refused} Refused`)

        streamEvents.push({
          id: `meal-group-${mealTitle.replace(/\s+/g, '-').toLowerCase()}-${firstEntry.id}`,
          streamType: 'MEAL',
          time: entryTime,
          sortMinutes: sortMin,
          title: mealTitle,
          subtitle: 'Nutrition & Meal Record',
          status: 'COMPLETED',
          badge: {
            label: 'RECORDED',
            variant: 'success',
          },
          summary: summaryParts.join(' • ') || `${entries.length} Children Recorded`,
          consumptionStats: {
            total: entries.length,
            ateAll,
            ateMost,
            ateHalf,
            ateLittle,
            refused,
          },
          items: entries.map((e) => ({
            id: e.id,
            studentId: e.studentId,
            studentName: `${e.student?.firstName || 'Student'} ${e.student?.lastName || ''}`.trim(),
            photoUrl: e.student?.photoUrl,
            intake: e.body,
            recordedAt: e.createdAt.toISOString(),
          })),
        })
      })
    }

    // D. Group Nap Timeline Entries
    const napEntries = timelineEntries.filter((te) => te.type === 'NAP')
    if (napEntries.length > 0) {
      const firstEntry = napEntries[0]
      const entryTime = formatDateToTime12(firstEntry.createdAt)
      const sortMin = dateToMinutes(firstEntry.createdAt)

      let slept = 0
      let rested = 0
      let fussy = 0
      let awake = 0

      napEntries.forEach((e) => {
        const text = (e.body || '').toLowerCase()
        if (text.includes('awake') || text.includes('no')) awake++
        else if (text.includes('fussy')) fussy++
        else if (text.includes('rested')) rested++
        else slept++
      })

      const summaryParts: string[] = []
      if (slept > 0) summaryParts.push(`${slept} Slept Well`)
      if (rested > 0) summaryParts.push(`${rested} Rested Quietly`)
      if (fussy > 0) summaryParts.push(`${fussy} Fussy`)
      if (awake > 0) summaryParts.push(`${awake} Awake`)

      streamEvents.push({
        id: `nap-group-${firstEntry.id}`,
        streamType: 'NAP',
        time: entryTime,
        sortMinutes: sortMin,
        title: firstEntry.title || 'Nap & Rest Time',
        subtitle: 'Rest & Quiet Period',
        status: 'COMPLETED',
        badge: {
          label: 'RECORDED',
          variant: 'success',
        },
        summary: summaryParts.join(' • ') || `${napEntries.length} Recorded`,
        napStats: {
          total: napEntries.length,
          slept,
          rested,
          fussy,
          awake,
        },
        items: napEntries.map((e) => ({
          id: e.id,
          studentId: e.studentId,
          studentName: `${e.student?.firstName || 'Student'} ${e.student?.lastName || ''}`.trim(),
          photoUrl: e.student?.photoUrl,
          status: e.body,
          recordedAt: e.createdAt.toISOString(),
        })),
      })
    }

    // E. Add Observations
    for (const obs of observations) {
      const sName = obs.student ? `${obs.student.firstName} ${obs.student.lastName || ''}`.trim() : 'Classroom'
      const sortMin = dateToMinutes(obs.observedAt)
      const timeStr = formatDateToTime12(obs.observedAt)

      let badgeVariant = 'info'
      if (obs.concern === 'URGENT') badgeVariant = 'danger'
      else if (obs.concern === 'NEEDS_ATTENTION') badgeVariant = 'warning'

      streamEvents.push({
        id: `obs-${obs.id}`,
        streamType: 'OBSERVATION',
        time: timeStr,
        sortMinutes: sortMin,
        title: `Observation: ${sName}`,
        subtitle: obs.category || 'General Learning',
        status: 'COMPLETED',
        badge: {
          label: obs.concern === 'NORMAL' ? 'OBSERVED' : obs.concern,
          variant: badgeVariant,
        },
        summary: obs.narrative,
        narrative: obs.narrative,
        category: obs.category,
        concern: obs.concern,
        studentId: obs.studentId,
        studentName: sName,
        studentPhoto: obs.student?.photoUrl,
        activityId: obs.activityId,
        activityTitle: obs.activity?.title,
      })
    }

    // F. Add Care / Hygiene (BATHROOM, HEALTH_CHECK)
    const careEntries = timelineEntries.filter((te) => ['BATHROOM', 'HEALTH_CHECK'].includes(te.type))
    for (const care of careEntries) {
      const sName = care.student ? `${care.student.firstName} ${care.student.lastName || ''}`.trim() : 'Student'
      const sortMin = dateToMinutes(care.createdAt)
      const timeStr = formatDateToTime12(care.createdAt)

      streamEvents.push({
        id: `care-${care.id}`,
        streamType: 'CARE',
        time: timeStr,
        sortMinutes: sortMin,
        title: care.title || (care.type === 'BATHROOM' ? 'Bathroom & Hygiene' : 'Health Check'),
        subtitle: sName,
        status: 'COMPLETED',
        badge: {
          label: care.type,
          variant: care.type === 'HEALTH_CHECK' ? 'warning' : 'neutral',
        },
        summary: `${sName}: ${care.body || 'Recorded'}`,
        studentId: care.studentId,
        studentName: sName,
        studentPhoto: care.student?.photoUrl,
        description: care.body,
      })
    }

    // G. Add Incidents
    const incidentEntries = timelineEntries.filter((te) => te.type === 'INCIDENT')
    for (const inc of incidentEntries) {
      const sName = inc.student ? `${inc.student.firstName} ${inc.student.lastName || ''}`.trim() : 'Classroom'
      const sortMin = dateToMinutes(inc.createdAt)
      const timeStr = formatDateToTime12(inc.createdAt)

      streamEvents.push({
        id: `incident-${inc.id}`,
        streamType: 'INCIDENT',
        time: timeStr,
        sortMinutes: sortMin,
        title: inc.title || 'Safety & Care Incident',
        subtitle: sName,
        status: 'COMPLETED',
        badge: {
          label: 'INCIDENT',
          variant: 'danger',
        },
        summary: `${sName}: ${inc.body || 'Incident logged'}`,
        studentId: inc.studentId,
        studentName: sName,
        studentPhoto: inc.student?.photoUrl,
        description: inc.body,
      })
    }

    // H. Add Mood Check-in Entries
    const moodEntries = timelineEntries.filter((te) => te.type === 'NOTE' && (te.title?.includes('Mood') || te.mood))
    if (moodEntries.length > 0) {
      const firstEntry = moodEntries[0]
      const entryTime = formatDateToTime12(firstEntry.createdAt)
      const sortMin = dateToMinutes(firstEntry.createdAt)

      const moodCounts: Record<string, number> = {}
      moodEntries.forEach((me) => {
        const m = me.mood || 'Happy'
        moodCounts[m] = (moodCounts[m] || 0) + 1
      })
      const summaryText = Object.entries(moodCounts)
        .map(([m, cnt]) => `${cnt} ${m}`)
        .join(' • ')

      streamEvents.push({
        id: `mood-group-${firstEntry.id}`,
        streamType: 'CARE',
        time: entryTime,
        sortMinutes: sortMin,
        title: firstEntry.title || 'Mood & Well-being Check-in',
        subtitle: `${moodEntries.length} Children Recorded`,
        status: 'COMPLETED',
        badge: {
          label: 'MOOD',
          variant: 'info',
        },
        summary: summaryText || `${moodEntries.length} Moods Recorded`,
        items: moodEntries.map((e) => ({
          id: e.id,
          studentId: e.studentId,
          studentName: `${e.student?.firstName || 'Student'} ${e.student?.lastName || ''}`.trim(),
          photoUrl: e.student?.photoUrl,
          mood: e.mood,
          details: e.body,
          recordedAt: e.createdAt.toISOString(),
        })),
      })
    }

    // Strictly sort all stream events chronologically
    streamEvents.sort((a, b) => {
      if (a.sortMinutes !== b.sortMinutes) {
        return a.sortMinutes - b.sortMinutes
      }
      return a.title.localeCompare(b.title)
    })

    const totalEvents = streamEvents.length
    const completedEvents = streamEvents.filter((e) => e.status === 'COMPLETED').length
    const inProgressEvents = streamEvents.filter((e) => e.status === 'IN_PROGRESS').length
    const plannedEvents = streamEvents.filter((e) => e.status === 'PLANNED' || e.status === 'PENDING').length
    const dayProgressPct = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        code: classroom.code,
        programType: classroom.programType,
        capacity: classroom.capacity,
        teacherName: classroom.primaryTeacher?.fullName || 'Unassigned',
        teacherId: classroom.primaryTeacherId,
        branchName: branch?.name,
        sessionName: classroom.academicSession?.name,
      },
      date: dateStr,
      stats: {
        totalStudents: students.length,
        present,
        absent,
        late,
        halfDay,
        unmarked,
        totalEvents,
        completedEvents,
        inProgressEvents,
        plannedEvents,
        dayProgressPct,
      },
      events: streamEvents,
    }
  }

  /**
   * Fast Contextual Quick Log for unified diary entries:
   * Attendance, Activities, Meals, Naps, Observations, Care, Mood, and Incidents.
   * Supports Whole-Class Bulk Logging with individual student persistence and duplicate prevention.
   */
  static async quickLog(
    session: SessionPayload,
    data: {
      classroomId: string
      type: 'ATTENDANCE' | 'ACTIVITY' | 'MEAL' | 'NAP' | 'OBSERVATION' | 'CARE' | 'INCIDENT' | 'MOOD'
      date?: string
      time?: string
      // Attendance
      students?: { studentId: string; status: AttendanceStatus; notes?: string }[]
      // Activity
      title?: string
      activityType?: string
      startTime?: string
      endTime?: string
      teacherId?: string
      description?: string
      status?: ActivityStatus
      actualOutcome?: string
      activityEntries?: { studentId: string; participation?: string; notes?: string }[]
      // Meal
      mealName?: string
      mealEntries?: { studentId: string; intake: string; notes?: string }[]
      // Nap
      napStatus?: string
      napEntries?: { studentId: string; napStatus: string; notes?: string }[]
      // Observation
      studentId?: string
      narrative?: string
      category?: string
      concern?: ObservationConcern
      activityId?: string
      // Care
      careType?: 'BATHROOM' | 'DIAPER' | 'WATER' | 'HEALTH_CHECK' | 'MEDICATION'
      careEntries?: { studentId: string; notes?: string }[]
      // Mood
      moodSource?: 'TEACHER_OBSERVED' | 'CHILD_EXPRESSED'
      moodEntries?: { studentId: string; mood: string; notes?: string }[]
      // Incident
      severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH'
    }
  ) {
    const tenantId = session.tenantId!
    if (!data.classroomId) throw new Error('classroomId is required')

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, data.classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: data.classroomId },
      select: { academicSessionId: true, branchId: true },
    })

    const dateStr = data.date || isoDate()
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    const entryCreatedAt = data.time
      ? new Date(`${dateStr}T${data.time}:00.000Z`)
      : (data.startTime ? new Date(`${dateStr}T${data.startTime}:00.000Z`) : new Date())

    switch (data.type) {
      case 'ATTENDANCE': {
        if (!data.students || !data.students.length) {
          throw new Error('No attendance student records provided')
        }
        return await this.saveAttendanceRegister(session, data.classroomId, dateStr, data.students)
      }

      case 'ACTIVITY': {
        if (!data.title) throw new Error('title is required for activity')
        let activity = await this.createActivity(session, {
          classroomId: data.classroomId,
          dateStr,
          title: data.title,
          activityType: data.activityType || 'ACTIVITY',
          startTime: data.startTime || '09:30',
          endTime: data.endTime || '10:00',
          teacherId: data.teacherId || session.uid,
          description: data.description,
        })

        if (data.status && data.status !== 'PLANNED') {
          activity = await this.updateActivity(session, activity.id, {
            status: data.status,
            actualOutcome: data.actualOutcome,
          })
        }

        let createdCount = 0
        let updatedCount = 0
        const actEntries = data.activityEntries || []
        if (actEntries.length > 0) {
          const counts = await db.$transaction(async (tx) => {
            let c = 0
            let u = 0
            for (const item of actEntries) {
              const existing = await tx.timelineEntry.findFirst({
                where: {
                  tenantId,
                  studentId: item.studentId,
                  classroomId: data.classroomId,
                  type: 'ACTIVITY',
                  title: data.title!,
                  createdAt: { gte: startOfDay, lte: endOfDay },
                },
              })

              const body = item.participation
                ? `${item.participation}${item.notes ? ` — ${item.notes}` : ''}`
                : (item.notes || 'Participated')

              if (existing) {
                await tx.timelineEntry.update({
                  where: { id: existing.id },
                  data: {
                    body,
                    authorId: session.uid,
                  },
                })
                u++
              } else {
                await tx.timelineEntry.create({
                  data: {
                    tenantId,
                    studentId: item.studentId,
                    classroomId: data.classroomId,
                    academicSessionId: classroom?.academicSessionId,
                    type: 'ACTIVITY',
                    title: data.title!,
                    body,
                    authorId: session.uid,
                    createdAt: entryCreatedAt,
                  },
                })
                c++
              }
            }
            return { createdCount: c, updatedCount: u }
          })
          createdCount = counts.createdCount
          updatedCount = counts.updatedCount
        }

        return {
          ...activity,
          success: true,
          activityId: activity.id,
          count: actEntries.length,
          createdCount,
          updatedCount,
        }
      }

      case 'MEAL': {
        const mealName = data.mealName || data.title || 'Fruit Snack'
        const entries = data.mealEntries || []
        if (!entries.length) throw new Error('No student meal entries provided')

        const { createdCount, updatedCount } = await db.$transaction(async (tx) => {
          let cCount = 0
          let uCount = 0

          for (const item of entries) {
            const existing = await tx.timelineEntry.findFirst({
              where: {
                tenantId,
                studentId: item.studentId,
                classroomId: data.classroomId,
                type: 'MEAL',
                title: mealName,
                createdAt: { gte: startOfDay, lte: endOfDay },
              },
            })

            const body = item.intake
              ? `${item.intake}${item.notes ? ` — ${item.notes}` : ''}`
              : (item.notes || 'Meal recorded')

            if (existing) {
              await tx.timelineEntry.update({
                where: { id: existing.id },
                data: {
                  body,
                  authorId: session.uid,
                },
              })
              uCount++
            } else {
              await tx.timelineEntry.create({
                data: {
                  tenantId,
                  studentId: item.studentId,
                  classroomId: data.classroomId,
                  academicSessionId: classroom?.academicSessionId,
                  type: 'MEAL',
                  title: mealName,
                  body,
                  authorId: session.uid,
                  createdAt: entryCreatedAt,
                },
              })
              cCount++
            }
          }
          return { createdCount: cCount, updatedCount: uCount }
        })

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: updatedCount > 0 ? 'UPDATE' : 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded ${mealName} (${createdCount} created, ${updatedCount} updated)`,
          newValues: { type: 'MEAL', mealName, total: entries.length, createdCount, updatedCount, date: dateStr },
        })

        return { success: true, count: entries.length, createdCount, updatedCount, mealName }
      }

      case 'NAP': {
        const title = data.title || 'Nap & Rest Time'
        const entries = data.napEntries || []
        if (!entries.length) throw new Error('No student nap entries provided')

        const { createdCount, updatedCount } = await db.$transaction(async (tx) => {
          let cCount = 0
          let uCount = 0

          for (const item of entries) {
            const existing = await tx.timelineEntry.findFirst({
              where: {
                tenantId,
                studentId: item.studentId,
                classroomId: data.classroomId,
                type: 'NAP',
                title,
                createdAt: { gte: startOfDay, lte: endOfDay },
              },
            })

            const body = item.napStatus
              ? `${item.napStatus}${item.notes ? ` — ${item.notes}` : ''}`
              : (item.notes || 'Rest recorded')

            if (existing) {
              await tx.timelineEntry.update({
                where: { id: existing.id },
                data: {
                  body,
                  authorId: session.uid,
                },
              })
              uCount++
            } else {
              await tx.timelineEntry.create({
                data: {
                  tenantId,
                  studentId: item.studentId,
                  classroomId: data.classroomId,
                  academicSessionId: classroom?.academicSessionId,
                  type: 'NAP',
                  title,
                  body,
                  authorId: session.uid,
                  createdAt: entryCreatedAt,
                },
              })
              cCount++
            }
          }
          return { createdCount: cCount, updatedCount: uCount }
        })

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: updatedCount > 0 ? 'UPDATE' : 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded ${title} (${createdCount} created, ${updatedCount} updated)`,
          newValues: { type: 'NAP', title, total: entries.length, createdCount, updatedCount, date: dateStr },
        })

        return { success: true, count: entries.length, createdCount, updatedCount, title }
      }

      case 'CARE': {
        const careType = data.careType || 'BATHROOM'
        const entries = data.careEntries || []
        if (!entries.length) throw new Error('No student care entries provided')

        const typeMap: Record<string, 'BATHROOM' | 'HEALTH_CHECK'> = {
          BATHROOM: 'BATHROOM',
          DIAPER: 'BATHROOM',
          WATER: 'BATHROOM',
          HEALTH_CHECK: 'HEALTH_CHECK',
          MEDICATION: 'HEALTH_CHECK',
        }
        const mappedType = typeMap[careType] || 'BATHROOM'
        const careTitle = data.title || careType.replace('_', ' ')

        const { createdCount, updatedCount } = await db.$transaction(async (tx) => {
          let cCount = 0
          let uCount = 0

          for (const item of entries) {
            const existing = await tx.timelineEntry.findFirst({
              where: {
                tenantId,
                studentId: item.studentId,
                classroomId: data.classroomId,
                type: mappedType,
                title: careTitle,
                createdAt: { gte: startOfDay, lte: endOfDay },
              },
            })

            const body = item.notes || `${careType} recorded`

            if (existing) {
              await tx.timelineEntry.update({
                where: { id: existing.id },
                data: {
                  body,
                  authorId: session.uid,
                },
              })
              uCount++
            } else {
              await tx.timelineEntry.create({
                data: {
                  tenantId,
                  studentId: item.studentId,
                  classroomId: data.classroomId,
                  academicSessionId: classroom?.academicSessionId,
                  type: mappedType,
                  title: careTitle,
                  body,
                  authorId: session.uid,
                  createdAt: entryCreatedAt,
                },
              })
              cCount++
            }
          }
          return { createdCount: cCount, updatedCount: uCount }
        })

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: updatedCount > 0 ? 'UPDATE' : 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded ${careType} (${createdCount} created, ${updatedCount} updated)`,
          newValues: { type: mappedType, careType, total: entries.length, createdCount, updatedCount },
        })

        return { success: true, count: entries.length, createdCount, updatedCount, careType }
      }

      case 'MOOD': {
        const entries = data.moodEntries || []
        if (!entries.length) throw new Error('No student mood entries provided')

        const moodSource = data.moodSource || 'TEACHER_OBSERVED'
        const prefix = moodSource === 'CHILD_EXPRESSED' ? '[Child Expressed] ' : '[Teacher Observed] '
        const moodTitle = data.title || 'Mood & Emotional State'

        const { createdCount, updatedCount } = await db.$transaction(async (tx) => {
          let cCount = 0
          let uCount = 0

          for (const item of entries) {
            const existing = await tx.timelineEntry.findFirst({
              where: {
                tenantId,
                studentId: item.studentId,
                classroomId: data.classroomId,
                type: 'NOTE',
                title: moodTitle,
                createdAt: { gte: startOfDay, lte: endOfDay },
              },
            })

            const body = `${prefix}${item.mood || 'Happy'}${item.notes ? ` — ${item.notes}` : ''}`

            if (existing) {
              await tx.timelineEntry.update({
                where: { id: existing.id },
                data: {
                  body,
                  mood: item.mood || 'Happy',
                  authorId: session.uid,
                },
              })
              uCount++
            } else {
              await tx.timelineEntry.create({
                data: {
                  tenantId,
                  studentId: item.studentId,
                  classroomId: data.classroomId,
                  academicSessionId: classroom?.academicSessionId,
                  type: 'NOTE',
                  title: moodTitle,
                  body,
                  mood: item.mood || 'Happy',
                  authorId: session.uid,
                  createdAt: entryCreatedAt,
                },
              })
              cCount++
            }
          }
          return { createdCount: cCount, updatedCount: uCount }
        })

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: updatedCount > 0 ? 'UPDATE' : 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded Mood Check-in (${createdCount} created, ${updatedCount} updated)`,
          newValues: { type: 'NOTE', moodSource, total: entries.length, createdCount, updatedCount, date: dateStr },
        })

        return { success: true, count: entries.length, createdCount, updatedCount, moodSource }
      }

      case 'OBSERVATION': {
        if (!data.narrative) throw new Error('narrative is required for observation')
        const obsDate = data.time
          ? new Date(`${dateStr}T${data.time}:00.000Z`)
          : (data.date ? new Date(`${dateStr}T10:00:00.000Z`) : new Date())
        return await this.createObservation(session, {
          classroomId: data.classroomId,
          studentId: data.studentId || null,
          narrative: data.narrative,
          category: data.category || 'General',
          concern: data.concern || 'NORMAL',
          activityId: data.activityId,
          observedAt: obsDate,
        })
      }

      case 'INCIDENT': {
        if (!data.studentId) throw new Error('studentId is required for incident')
        if (!data.description) throw new Error('description is required for incident')

        const entry = await db.timelineEntry.create({
          data: {
            tenantId,
            studentId: data.studentId,
            classroomId: data.classroomId,
            academicSessionId: classroom?.academicSessionId,
            type: 'INCIDENT',
            title: data.title || 'Classroom Incident',
            body: `${data.severity ? `[${data.severity}] ` : ''}${data.description}`,
            authorId: session.uid,
            createdAt: data.time ? new Date(`${dateStr}T${data.time}:00.000Z`) : new Date(),
          },
        })

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: 'CREATE',
          entity: 'TimelineEntry',
          entityId: entry.id,
          summary: `Recorded incident for student ${data.studentId}`,
          newValues: { type: 'INCIDENT', studentId: data.studentId, title: data.title, severity: data.severity },
        })

        return { success: true, incidentId: entry.id }
      }

      default:
        throw new Error(`Unknown quick log event type: ${(data as any).type}`)
    }
  }

  /**
   * Copy Yesterday's Routine:
   * Retrieves the most recent planned schedule within the past 14 days for the classroom.
   * Strips all actual execution/completion, attendance, meals, nap, and observation records.
   */
  static async getPreviousDayRoutine(
    session: SessionPayload,
    classroomId: string,
    targetDateStr: string
  ) {
    const tenantId = session.tenantId!
    if (!classroomId) throw new Error('classroomId is required')

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, name: true, branchId: true, academicSessionId: true },
    })
    if (!classroom) throw new Error('Classroom not found')

    const targetDate = new Date(`${targetDateStr}T00:00:00.000Z`)
    const minDate = new Date(targetDate.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Find latest activityDate with active activities
    const latest = await db.classroomActivity.findFirst({
      where: {
        tenantId,
        classroomId,
        activityDate: {
          gte: minDate,
          lt: targetDate,
        },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      orderBy: { activityDate: 'desc' },
      select: { activityDate: true },
    })

    if (!latest) {
      return {
        hasPreviousRoutine: false,
        classroomName: classroom.name,
        targetDate: targetDateStr,
        message: 'No previous planned routine found for this classroom in the past 14 days.',
        suggestTemplates: true,
        activities: [],
      }
    }

    const { startOfDay, endOfDay } = getDayBounds(isoDate(latest.activityDate))
    const sourceActivities = await db.classroomActivity.findMany({
      where: {
        tenantId,
        classroomId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
    })

    return {
      hasPreviousRoutine: true,
      sourceDate: isoDate(latest.activityDate),
      classroomName: classroom.name,
      targetDate: targetDateStr,
      activityCount: sourceActivities.length,
      activities: sourceActivities.map((a) => ({
        title: a.title,
        activityType: a.activityType || 'CORE_SUBJECT',
        startTime: a.startTime || '09:00',
        endTime: a.endTime || '09:30',
        durationMinutes: a.durationMinutes || 30,
        description: a.description || null,
        materials: a.materials || null,
        instructions: a.instructions || null,
        expectedOutcome: a.expectedOutcome || null,
        teacherId: a.teacherId || null,
        teacherName: a.teacher?.fullName || null,
      })),
    }
  }

  /**
   * Weekly Theme Templates:
   * Returns persisted templates from weekly_theme_templates.
   * Auto-seeds standard preschool themes if tenant has none yet.
   */
  static async getWeeklyThemeTemplates(session: SessionPayload) {
    const tenantId = session.tenantId!

    let templates = await db.weeklyThemeTemplate.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    if (templates.length === 0) {
      const defaultThemes = [
        {
          name: 'Phonics & Early Literacy Routine',
          theme: 'Early Literacy',
          description: 'Letter sound recognition, circle time rhymes, interactive storybooks, and phonics tracing.',
          isDefault: true,
          activities: [
            { title: 'Circle Time & Rhymes', activityType: 'CIRCLE_TIME', startTime: '09:00', endTime: '09:30', description: 'Welcome greeting song, weather check, and alphabet rhyme actions' },
            { title: 'Early Literacy Phonics', activityType: 'CORE_SUBJECT', startTime: '09:30', endTime: '10:15', description: 'Letter sound flashcards and phonics blend recognition' },
            { title: 'Morning Fruit Snack', activityType: 'ACTIVITY', startTime: '10:15', endTime: '10:45', description: 'Handwash routine and healthy fruit snack break' },
            { title: 'Guided Storybook Reading', activityType: 'CORE_SUBJECT', startTime: '10:45', endTime: '11:30', description: 'Interactive picture book reading with hand puppet characters' },
            { title: 'Sand Alphabet Tracing', activityType: 'PLAY', startTime: '11:30', endTime: '12:15', description: 'Sensory letter tracing in colored sand trays & free play' },
            { title: 'Lunch & Hygiene Routine', activityType: 'ACTIVITY', startTime: '12:15', endTime: '13:00', description: 'Warm lunch meal and self-care table manners' },
            { title: 'Afternoon Nap & Rest', activityType: 'ACTIVITY', startTime: '13:00', endTime: '14:15', description: 'Soft lullaby music and restorative quiet nap time' },
          ],
        },
        {
          name: 'Colors, Shapes & Sensory Art Routine',
          theme: 'Sensory & Art',
          description: 'Primary and secondary color mixing, finger painting, shape matching, and sensory motor obstacle courses.',
          isDefault: false,
          activities: [
            { title: 'Circle Time & Rhymes', activityType: 'CIRCLE_TIME', startTime: '09:00', endTime: '09:30', description: 'Morning song, attendance roll call, and rainbow color chant' },
            { title: 'Color Mixing & Art', activityType: 'ART', startTime: '09:30', endTime: '10:15', description: 'Hands-on finger painting exploring yellow, blue, and red blends' },
            { title: 'Morning Fruit Snack', activityType: 'ACTIVITY', startTime: '10:15', endTime: '10:45', description: 'Nutrition break with colorful sliced fruits' },
            { title: '3D Shapes & Sorting Blocks', activityType: 'CORE_SUBJECT', startTime: '10:45', endTime: '11:30', description: 'Identifying spheres, cubes, and triangles with wooden block sets' },
            { title: 'Outdoor Sensory Obstacle', activityType: 'OUTDOOR', startTime: '11:30', endTime: '12:15', description: 'Balancing beams, sensory stepping stones, and hopscotch' },
            { title: 'Lunch & Hygiene Routine', activityType: 'ACTIVITY', startTime: '12:15', endTime: '13:00', description: 'Meal time with handwashing and clean-up' },
            { title: 'Afternoon Nap & Rest', activityType: 'ACTIVITY', startTime: '13:00', endTime: '14:15', description: 'Cozy dim-lit nap and calming ambient sounds' },
          ],
        },
        {
          name: 'Numbers, Counting & Active Motor Routine',
          theme: 'STEM & Numbers',
          description: 'Montessori number rods, counting songs, gross-motor parachute play, and block architecture.',
          isDefault: false,
          activities: [
            { title: 'Circle Time & Rhymes', activityType: 'CIRCLE_TIME', startTime: '09:00', endTime: '09:30', description: 'Numbers action songs (Five Little Ducks) and movement exercise' },
            { title: 'Number Counting Beads', activityType: 'CORE_SUBJECT', startTime: '09:30', endTime: '10:15', description: 'Counting 1 through 20 using abacus beads and tactile counters' },
            { title: 'Morning Fruit Snack', activityType: 'ACTIVITY', startTime: '10:15', endTime: '10:45', description: 'Hydration and snack break' },
            { title: 'Parachute & Motor Play', activityType: 'OUTDOOR', startTime: '10:45', endTime: '11:30', description: 'Cooperative parachute lifting, ball bounce, and running game' },
            { title: 'Puzzle Time & Building', activityType: 'CORE_SUBJECT', startTime: '11:30', endTime: '12:15', description: 'Tangram puzzles and logical pattern matching' },
            { title: 'Lunch & Hygiene Routine', activityType: 'ACTIVITY', startTime: '12:15', endTime: '13:00', description: 'Wholesome lunch and handwash' },
            { title: 'Afternoon Nap & Rest', activityType: 'ACTIVITY', startTime: '13:00', endTime: '14:15', description: 'Rest time' },
          ],
        },
        {
          name: 'Nature, Plants & Science Discovery Routine',
          theme: 'Science & Nature',
          description: 'Botanical garden discovery, seedling care, weather chart tracking, and water sensory science.',
          isDefault: false,
          activities: [
            { title: 'Circle Time & Rhymes', activityType: 'CIRCLE_TIME', startTime: '09:00', endTime: '09:30', description: 'Greeting song, daily weather wheel, and plant life-cycle story' },
            { title: 'Garden Nature Walk', activityType: 'OUTDOOR', startTime: '09:30', endTime: '10:15', description: 'Collecting diverse leaves, smelling herbs, and observing insects' },
            { title: 'Morning Fruit Snack', activityType: 'ACTIVITY', startTime: '10:15', endTime: '10:45', description: 'Healthy snack' },
            { title: 'Seed Planting Exploration', activityType: 'CORE_SUBJECT', startTime: '10:45', endTime: '11:30', description: 'Planting bean seeds in small peat cups with soil & water' },
            { title: 'Water Texture Sensory Table', activityType: 'PLAY', startTime: '11:30', endTime: '12:15', description: 'Floating vs sinking exploration with boats and pinecones' },
            { title: 'Lunch & Hygiene Routine', activityType: 'ACTIVITY', startTime: '12:15', endTime: '13:00', description: 'Lunch and hand washing' },
            { title: 'Afternoon Nap & Rest', activityType: 'ACTIVITY', startTime: '13:00', endTime: '14:15', description: 'Rest period with gentle rain sounds' },
          ],
        },
      ]

      for (const dt of defaultThemes) {
        await db.weeklyThemeTemplate.create({
          data: {
            tenantId,
            name: dt.name,
            theme: dt.theme,
            description: dt.description,
            isDefault: dt.isDefault,
            activities: dt.activities as any,
            status: 'ACTIVE',
          },
        })
      }

      templates = await db.weeklyThemeTemplate.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      })
    }

    return templates
  }

  /**
   * Apply Routine or Weekly Template to Target Classroom Day:
   * Handles conflict checking, safe overwrite, subject mapping, and atomic creation.
   * Activities are strictly saved as PLANNED. Actual records are never copied.
   */
  static async applyRoutineOrTemplate(
    session: SessionPayload,
    data: {
      classroomId: string
      targetDateStr: string
      activities: {
        title: string
        activityType?: string
        startTime?: string
        endTime?: string
        durationMinutes?: number
        description?: string
        materials?: string
        instructions?: string
        expectedOutcome?: string
        teacherId?: string
      }[]
      sourceType?: 'PREVIOUS_DAY' | 'WEEKLY_TEMPLATE' | 'CUSTOM'
      sourceName?: string
      replaceExisting?: boolean
    }
  ) {
    const tenantId = session.tenantId!
    if (!data.classroomId) throw new Error('classroomId is required')
    if (!data.targetDateStr) throw new Error('targetDateStr is required')
    if (!data.activities || data.activities.length === 0) {
      throw new Error('At least one activity is required to apply routine')
    }

    // Enforce teacher classroom scoping
    await assertClassroomAccess(session, data.classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: data.classroomId },
      select: { academicSessionId: true, primaryTeacherId: true, name: true },
    })
    if (!classroom) throw new Error('Classroom not found')

    const { startOfDay, endOfDay, dateOnly } = getDayBounds(data.targetDateStr)

    // Check existing activities on target date
    const existingActivities = await db.classroomActivity.findMany({
      where: {
        tenantId,
        classroomId: data.classroomId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
        deletedAt: null,
      },
      orderBy: { startTime: 'asc' },
    })

    // Conflict check if existing activities exist and teacher has not confirmed replaceExisting
    if (existingActivities.length > 0 && !data.replaceExisting) {
      return {
        conflict: true,
        existingCount: existingActivities.length,
        existingActivities: existingActivities.map((a) => ({
          id: a.id,
          title: a.title,
          startTime: a.startTime,
          endTime: a.endTime,
          status: a.status,
        })),
        message: `Classroom "${classroom.name}" already has ${existingActivities.length} planned activity(ies) on ${data.targetDateStr}. Choose 'Replace' to overwrite the planned routine, or cancel to keep existing items.`,
      }
    }

    const activeSession = await db.academicSession.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true },
    })
    const targetSessionId = classroom.academicSessionId || activeSession?.id
    if (!targetSessionId) {
      throw new Error('No active academic session found')
    }

    // Ensure subjects exist for each activity so subject eligibility is maintained
    for (const act of data.activities) {
      const cleanTitle = act.title.trim()
      let subject = await db.subject.findFirst({
        where: {
          tenantId,
          name: { equals: cleanTitle, mode: 'insensitive' },
        },
      })
      if (!subject) {
        const code = 'SUB-' + cleanTitle.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10)
        subject = await db.subject.create({
          data: {
            tenantId,
            code,
            name: cleanTitle,
            subjectType: act.activityType === 'CORE_SUBJECT' ? 'CORE' : 'ACTIVITY',
            status: 'ACTIVE',
          },
        })
      }
      await db.classroomSubject.upsert({
        where: {
          classroomId_subjectId: {
            classroomId: data.classroomId,
            subjectId: subject.id,
          },
        },
        create: {
          tenantId,
          classroomId: data.classroomId,
          subjectId: subject.id,
        },
        update: {},
      })
    }

    // Perform atomic persistence
    const createdActivities = await db.$transaction(async (tx) => {
      // If replacing existing, soft delete the existing planned items
      if (existingActivities.length > 0 && data.replaceExisting) {
        await tx.classroomActivity.updateMany({
          where: {
            id: { in: existingActivities.map((a) => a.id) },
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }

      const created: any[] = []
      for (const act of data.activities) {
        const targetTeacherId = act.teacherId || classroom.primaryTeacherId || session.uid

        const entry = await tx.classroomActivity.create({
          data: {
            tenantId,
            academicSessionId: targetSessionId,
            classroomId: data.classroomId,
            teacherId: targetTeacherId,
            title: act.title.trim(),
            activityType: act.activityType || 'CORE_SUBJECT',
            activityDate: dateOnly,
            startTime: act.startTime || '09:00',
            endTime: act.endTime || '09:30',
            durationMinutes: act.durationMinutes || 30,
            description: act.description || null,
            materials: act.materials || null,
            instructions: act.instructions || null,
            expectedOutcome: act.expectedOutcome || null,
            actualOutcome: null, // Strictly null: actual outcomes are never copied!
            status: 'PLANNED',   // Strictly PLANNED: never completed on copy!
            createdBy: session.uid,
          },
          include: {
            teacher: { select: { id: true, fullName: true } },
          },
        })
        created.push(entry)
      }

      return created
    })

    // Record audit
    await recordAudit({
      tenantId,
      actorId: session.uid,
      action: 'CREATE',
      entity: 'ClassroomActivity',
      entityId: data.classroomId,
      summary: `Applied ${data.sourceType || 'Routine'} (${createdActivities.length} planned activities) on ${data.targetDateStr}`,
      newValues: {
        sourceType: data.sourceType,
        sourceName: data.sourceName,
        targetDate: data.targetDateStr,
        activityCount: createdActivities.length,
        replacedCount: existingActivities.length,
      },
    })

      return {
        success: true,
        conflict: false,
        count: createdActivities.length,
        activities: createdActivities,
      }
    }

  /**
   * End-of-Day Report Readiness:
   * Returns readiness metrics, issue breakdown, and student list for a classroom day.
   */
  static async getEndOfDayReadiness(session: SessionPayload, classroomId: string, dateStr: string) {
    const tenantId = session.tenantId!
    if (!classroomId) throw new Error('classroomId is required')
    if (!dateStr) throw new Error('dateStr is required')

    await assertClassroomAccess(session, classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, name: true, branchId: true, primaryTeacherId: true },
    })
    if (!classroom) throw new Error('Classroom not found')

    const students = await db.student.findMany({
      where: {
        tenantId,
        currentClassroomId: classroomId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        photoUrl: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    const { dateOnly } = getDayBounds(dateStr)

    // Fetch attendances for that day
    const attendances = await db.attendance.findMany({
      where: {
        tenantId,
        classroomId,
        date: dateOnly,
        studentId: { in: students.map((s) => s.id) },
      },
    })

    // Fetch existing daily reports for that day
    const existingReports = await db.dailyReport.findMany({
      where: {
        tenantId,
        classroomId,
        reportDate: dateOnly,
      },
    })

    // Fetch guardians with receivesComm: true
    const studentGuardians = await db.studentGuardian.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        receivesComm: true,
      },
      select: {
        studentId: true,
        guardian: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    })

    let readyCount = 0
    let needsReviewCount = 0
    let publishedCount = 0

    const studentReadiness = students.map((s) => {
      const att = attendances.find((a) => a.studentId === s.id)
      const rep = existingReports.find((r) => r.studentId === s.id)
      const guardians = studentGuardians.filter((g) => g.studentId === s.id)

      const issues: string[] = []
      if (!att || att.status === 'UNMARKED') {
        issues.push('Attendance not marked')
      }
      if (guardians.length === 0) {
        issues.push('No authorized guardian with communication enabled')
      }

      let status = 'NEEDS_REVIEW'
      if (rep && rep.status === 'PUBLISHED') {
        status = 'PUBLISHED'
        publishedCount++
      } else if (issues.length === 0) {
        status = 'READY'
        readyCount++
      } else {
        status = 'NEEDS_REVIEW'
        needsReviewCount++
      }

      return {
        studentId: s.id,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        admissionNo: s.admissionNo,
        photoUrl: s.photoUrl,
        attendanceStatus: att?.status || 'UNMARKED',
        status,
        issues,
        existingReportId: rep?.id || null,
        publishedAt: rep?.publishedAt ? rep.publishedAt.toISOString() : null,
        recipientsCount: guardians.length,
      }
    })

    return {
      classroomId: classroom.id,
      classroomName: classroom.name,
      date: dateStr,
      stats: {
        totalEligible: students.length,
        readyCount,
        needsReviewCount,
        publishedCount,
        canPublish: readyCount > 0 || studentReadiness.some((s) => s.status === 'READY'),
      },
      students: studentReadiness,
    }
  }

  /**
   * Get Reports for Review:
   * Aggregates complete child day preview (attendance, meals, naps, activities, observations, photos)
   * for each eligible student in the classroom.
   */
  static async getReportsForReview(session: SessionPayload, classroomId: string, dateStr: string) {
    const tenantId = session.tenantId!
    if (!classroomId) throw new Error('classroomId is required')
    if (!dateStr) throw new Error('dateStr is required')

    await assertClassroomAccess(session, classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        programType: true,
        primaryTeacher: { select: { fullName: true } },
      },
    })
    if (!classroom) throw new Error('Classroom not found')

    const students = await db.student.findMany({
      where: {
        tenantId,
        currentClassroomId: classroomId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        photoUrl: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    const { startOfDay, endOfDay, dateOnly } = getDayBounds(dateStr)

    // 1. Attendance
    const attendances = await db.attendance.findMany({
      where: {
        tenantId,
        classroomId,
        date: dateOnly,
        studentId: { in: students.map((s) => s.id) },
      },
    })

    // 2. Classroom Activities
    const activities = await db.classroomActivity.findMany({
      where: {
        tenantId,
        classroomId,
        activityDate: { gte: startOfDay, lte: endOfDay },
        deletedAt: null,
      },
      orderBy: { startTime: 'asc' },
    })

    // 3. Timeline Entries (Meals, Naps, Care, Photos, Notes)
    const timelineEntries = await db.timelineEntry.findMany({
      where: {
        tenantId,
        studentId: { in: students.map((s) => s.id) },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: 'asc' },
    })

    // 4. Observations (Learning highlights, exclude internal/restricted staff notes)
    const observations = await db.observation.findMany({
      where: {
        tenantId,
        studentId: { in: students.map((s) => s.id) },
        observedAt: { gte: startOfDay, lte: endOfDay },
        concern: { in: ['NORMAL', 'PROGRESS'] }, // Exclude sensitive internal urgent staff flags
      },
      orderBy: { observedAt: 'asc' },
    })

    // 5. Guardians with receivesComm: true
    const studentGuardians = await db.studentGuardian.findMany({
      where: {
        studentId: { in: students.map((s) => s.id) },
        receivesComm: true,
      },
      include: {
        guardian: {
          select: { id: true, fullName: true, phone: true, email: true, relationship: true },
        },
      },
    })

    // 6. Existing DailyReports
    const existingReports = await db.dailyReport.findMany({
      where: {
        tenantId,
        classroomId,
        reportDate: dateOnly,
      },
    })

    const formatTime12 = (timeStr?: string | null): string => {
      if (!timeStr) return '09:00 AM'
      if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
      const parts = timeStr.split(':')
      if (parts.length < 2) return timeStr
      let h = parseInt(parts[0], 10)
      const m = parts[1].padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12
      if (h === 0) h = 12
      return `${h.toString().padStart(2, '0')}:${m} ${ampm}`
    }

    const formatDateToTime12 = (d: Date): string => {
      let h = d.getHours()
      const m = d.getMinutes().toString().padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12
      if (h === 0) h = 12
      return `${h.toString().padStart(2, '0')}:${m} ${ampm}`
    }

    // Build comprehensive report for each child
    const reports = students.map((s) => {
      const att = attendances.find((a) => a.studentId === s.id)
      const rep = existingReports.find((r) => r.studentId === s.id)
      const guardians = studentGuardians.filter((g) => g.studentId === s.id)

      const sEntries = timelineEntries.filter((te) => te.studentId === s.id)
      const sObs = observations.filter((o) => o.studentId === s.id)

      const meals = sEntries
        .filter((e) => e.type === 'MEAL')
        .map((m) => ({
          id: m.id,
          title: m.title || 'Meal',
          intake: m.body || 'Ate All',
          time: formatDateToTime12(m.createdAt),
        }))

      const naps = sEntries
        .filter((e) => e.type === 'NAP')
        .map((n) => ({
          id: n.id,
          title: n.title || 'Nap Time',
          details: n.body || 'Rested Quietly',
          time: formatDateToTime12(n.createdAt),
        }))

      const care = sEntries
        .filter((e) => e.type === 'BATHROOM' || e.type === 'HEALTH_CHECK' || e.type === 'CARE')
        .map((c) => ({
          id: c.id,
          title: c.title,
          details: c.body,
          mood: c.mood,
          time: formatDateToTime12(c.createdAt),
        }))

      const photos = sEntries
        .filter((e) => e.photoUrl || e.type === 'PHOTO')
        .map((p) => ({
          id: p.id,
          url: p.photoUrl!,
          caption: p.title || p.body || 'Classroom Activity',
          time: formatDateToTime12(p.createdAt),
        }))

      const actList = activities.map((a) => ({
        id: a.id,
        title: a.title,
        activityType: a.activityType,
        time: `${formatTime12(a.startTime)} – ${formatTime12(a.endTime)}`,
        status: a.status,
        outcome: a.actualOutcome || (a.status === 'COMPLETED' ? 'Participated actively' : null),
      }))

      const issues: string[] = []
      if (!att || att.status === 'UNMARKED') {
        issues.push('Attendance not marked')
      }
      if (guardians.length === 0) {
        issues.push('No authorized guardian with communication enabled')
      }

      let status = 'NEEDS_REVIEW'
      if (rep && rep.status === 'PUBLISHED') {
        status = 'PUBLISHED'
      } else if (issues.length === 0) {
        status = 'READY'
      }

      return {
        studentId: s.id,
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        admissionNo: s.admissionNo,
        photoUrl: s.photoUrl,
        attendanceStatus: att?.status || 'UNMARKED',
        attendanceNotes: att?.notes || null,
        status,
        issues,
        existingReportId: rep?.id || null,
        publishedAt: rep?.publishedAt ? rep.publishedAt.toISOString() : null,
        summaryText: rep?.summaryText || '',
        activities: actList,
        meals,
        naps,
        care,
        observations: sObs.map((o) => ({
          id: o.id,
          category: o.category || 'Learning Highlight',
          narrative: o.narrative,
          time: formatDateToTime12(o.observedAt),
        })),
        photos,
        guardians: guardians.map((g) => ({
          id: g.guardian.id,
          fullName: g.guardian.fullName,
          phone: g.guardian.phone,
          email: g.guardian.email,
          relationship: g.relationship || g.guardian.relationship,
        })),
        classroomName: classroom.name,
        teacherName: classroom.primaryTeacher?.fullName || 'Teacher',
        reportDate: dateStr,
      }
    })

    return {
      classroomId: classroom.id,
      classroomName: classroom.name,
      teacherName: classroom.primaryTeacher?.fullName || 'Teacher',
      date: dateStr,
      reports,
    }
  }

  /**
   * Save Draft / Edit Note for a Child's Daily Report
   */
  static async updateReportDraft(
    session: SessionPayload,
    data: {
      classroomId: string
      studentId: string
      dateStr: string
      summaryText: string
    }
  ) {
    const tenantId = session.tenantId!
    await assertClassroomAccess(session, data.classroomId)

    const { dateOnly } = getDayBounds(data.dateStr)

    const updated = await db.dailyReport.upsert({
      where: {
        tenantId_studentId_reportDate: {
          tenantId,
          studentId: data.studentId,
          reportDate: dateOnly,
        },
      },
      create: {
        tenantId,
        studentId: data.studentId,
        classroomId: data.classroomId,
        reportDate: dateOnly,
        status: 'DRAFT',
        summaryText: data.summaryText,
      },
      update: {
        summaryText: data.summaryText,
      },
    })

    return updated
  }

  /**
   * 1-Tap Bulk Publishing of Daily Reports to Parents:
   * Validates classroom, dates, and per-child readiness.
   * Atomically upserts DailyReport records, creates TimelineEntry records,
   * dispatches notifications via NotificationEngine, and records audit log.
   */
  static async publishDailyReports(
    session: SessionPayload,
    data: {
      classroomId: string
      dateStr: string
      studentIds?: string[]
      summaryOverrides?: Record<string, string>
    }
  ) {
    const tenantId = session.tenantId!
    if (!data.classroomId) throw new Error('classroomId is required')
    if (!data.dateStr) throw new Error('dateStr is required')

    await assertClassroomAccess(session, data.classroomId)

    const classroom = await db.classroom.findUnique({
      where: { id: data.classroomId },
      select: {
        id: true,
        name: true,
        academicSessionId: true,
        primaryTeacherId: true,
        primaryTeacher: { select: { fullName: true } },
      },
    })
    if (!classroom) throw new Error('Classroom not found')

    const teacherName = classroom.primaryTeacher?.fullName || session.name || 'Teacher'

    // Fetch candidate students
    const whereStudents: any = {
      tenantId,
      currentClassroomId: data.classroomId,
      status: 'ACTIVE',
      deletedAt: null,
    }
    if (Array.isArray(data.studentIds) && data.studentIds.length > 0) {
      whereStudents.id = { in: data.studentIds }
    }

    const students = await db.student.findMany({
      where: whereStudents,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        photoUrl: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    const { startOfDay, endOfDay, dateOnly } = getDayBounds(data.dateStr)

    // Gather supporting data
    const [attendances, activities, timelineEntries, observations, studentGuardians, existingReports] =
      await Promise.all([
        db.attendance.findMany({
          where: {
            tenantId,
            classroomId: data.classroomId,
            date: dateOnly,
            studentId: { in: students.map((s) => s.id) },
          },
        }),
        db.classroomActivity.findMany({
          where: {
            tenantId,
            classroomId: data.classroomId,
            activityDate: { gte: startOfDay, lte: endOfDay },
            deletedAt: null,
          },
          orderBy: { startTime: 'asc' },
        }),
        db.timelineEntry.findMany({
          where: {
            tenantId,
            studentId: { in: students.map((s) => s.id) },
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
          orderBy: { createdAt: 'asc' },
        }),
        db.observation.findMany({
          where: {
            tenantId,
            studentId: { in: students.map((s) => s.id) },
            observedAt: { gte: startOfDay, lte: endOfDay },
            concern: { in: ['NORMAL', 'PROGRESS'] },
          },
        }),
        db.studentGuardian.findMany({
          where: {
            studentId: { in: students.map((s) => s.id) },
            receivesComm: true,
          },
          include: {
            guardian: { select: { id: true, fullName: true, phone: true, email: true, userId: true } },
          },
        }),
        db.dailyReport.findMany({
          where: {
            tenantId,
            classroomId: data.classroomId,
            reportDate: dateOnly,
          },
        }),
      ])

    const results: any[] = []
    let publishedCount = 0
    let skippedCount = 0

    const now = new Date()

    for (const s of students) {
      const studentName = `${s.firstName} ${s.lastName || ''}`.trim()
      const att = attendances.find((a) => a.studentId === s.id)
      const guardians = studentGuardians.filter((g) => g.studentId === s.id)
      const existingReport = existingReports.find((r) => r.studentId === s.id)

      // Readiness validation
      const issues: string[] = []
      if (!att || att.status === 'UNMARKED') {
        issues.push('Attendance not marked')
      }
      if (guardians.length === 0) {
        issues.push('No authorized guardian with communication enabled')
      }

      // If missing attendance, skip publishing this child and report accurately
      if (!att || att.status === 'UNMARKED') {
        skippedCount++
        results.push({
          studentId: s.id,
          studentName,
          published: false,
          recipientsCount: 0,
          notificationStatus: 'SKIPPED',
          issues,
        })
        continue
      }

      // Aggregate child-specific content
      const sEntries = timelineEntries.filter((te) => te.studentId === s.id)
      const sObs = observations.filter((o) => o.studentId === s.id)

      const meals = sEntries
        .filter((e) => e.type === 'MEAL')
        .map((m) => ({ title: m.title || 'Meal', intake: m.body || 'Ate All', time: m.createdAt.toISOString() }))

      const naps = sEntries
        .filter((e) => e.type === 'NAP')
        .map((n) => ({ title: n.title || 'Nap Time', details: n.body || 'Rested', time: n.createdAt.toISOString() }))

      const photos = sEntries
        .filter((e) => e.photoUrl || e.type === 'PHOTO')
        .map((p) => ({ url: p.photoUrl, caption: p.title || p.body || 'Activity Photo' }))

      const actSummary = activities.map((a) => ({
        title: a.title,
        status: a.status,
        outcome: a.actualOutcome || (a.status === 'COMPLETED' ? 'Completed' : 'Planned'),
      }))

      const obsSummary = sObs.map((o) => ({
        category: o.category || 'General',
        narrative: o.narrative,
      }))

      const summaryNote =
        data.summaryOverrides?.[s.id] ||
        existingReport?.summaryText ||
        `${studentName} had a productive and joyful day participating in classroom routines.`

      let notifStatus = 'PENDING'
      if (guardians.length === 0) {
        notifStatus = 'NO_GUARDIAN'
      }

      // Persist DailyReport
      const savedReport = await db.dailyReport.upsert({
        where: {
          tenantId_studentId_reportDate: {
            tenantId,
            studentId: s.id,
            reportDate: dateOnly,
          },
        },
        create: {
          tenantId,
          studentId: s.id,
          classroomId: data.classroomId,
          academicSessionId: classroom.academicSessionId,
          reportDate: dateOnly,
          status: 'PUBLISHED',
          publishedAt: now,
          publishedBy: session.uid,
          attendanceStatus: att.status,
          summaryText: summaryNote,
          activitiesSummary: actSummary as any,
          mealsSummary: meals as any,
          napSummary: naps as any,
          observationsSummary: obsSummary as any,
          photos: photos as any,
          parentRecipientsCount: guardians.length,
          notificationStatus: notifStatus,
          readinessIssues: issues as any,
        },
        update: {
          status: 'PUBLISHED',
          publishedAt: now,
          publishedBy: session.uid,
          attendanceStatus: att.status,
          summaryText: summaryNote,
          activitiesSummary: actSummary as any,
          mealsSummary: meals as any,
          napSummary: naps as any,
          observationsSummary: obsSummary as any,
          photos: photos as any,
          parentRecipientsCount: guardians.length,
          notificationStatus: notifStatus,
          readinessIssues: issues as any,
        },
      })

      // Dispatch parent notification if guardians are present
      if (guardians.length > 0) {
        try {
          const dispatchRes = await NotificationEngine.dispatch({
            tenantId,
            eventType: 'DAILY_SUMMARY',
            category: 'ACADEMICS',
            severity: 'INFO',
            studentId: s.id,
            classroomId: data.classroomId,
            title: `${s.firstName}'s Daily Report is Ready (${data.dateStr})`,
            body: `Review ${s.firstName}'s attendance, meals, activities, and daily learning highlights from ${classroom.name}.`,
            linkUrl: `/parent/daily-report?childId=${s.id}&date=${data.dateStr}`,
            actor: { id: session.uid, name: teacherName, role: session.role },
          })

          notifStatus = dispatchRes.gated
            ? 'NOT_CONFIGURED'
            : dispatchRes.deliveries.some((d) => d.success)
            ? 'SENT'
            : 'SENT'
        } catch {
          notifStatus = 'PENDING'
        }

        // Also create a child timeline entry so parent immediately sees it on child's day timeline
        await db.timelineEntry.create({
          data: {
            tenantId,
            studentId: s.id,
            classroomId: data.classroomId,
            type: 'NOTE',
            title: 'Daily Report Published',
            body: summaryNote,
            authorId: session.uid,
            createdAt: now,
          },
        })
      }

      publishedCount++
      results.push({
        studentId: s.id,
        studentName,
        reportId: savedReport.id,
        published: true,
        recipientsCount: guardians.length,
        notificationStatus: notifStatus,
        issues: [],
      })
    }

    // Audit log
    await recordAudit({
      tenantId,
      actorId: session.uid,
      action: 'UPDATE',
      entity: 'DailyReport',
      entityId: data.classroomId,
      summary: `Published daily reports for ${publishedCount} student(s) in ${classroom.name} on ${data.dateStr}`,
      newValues: {
        date: data.dateStr,
        publishedCount,
        skippedCount,
      },
    })

    return {
      success: true,
      classroomName: classroom.name,
      date: data.dateStr,
      totalCount: students.length,
      publishedCount,
      skippedCount,
      results,
    }
  }

  /**
   * Get Parent Daily Report:
   * Accessible by authorized guardians for their linked children, or by teachers/admins.
   * Never leaks other children's data.
   */
  static async getParentDailyReport(session: SessionPayload, studentId: string, dateStr: string) {
    const tenantId = session.tenantId!
    if (!studentId) throw new Error('studentId is required')
    if (!dateStr) throw new Error('dateStr is required')

    const scope = getScopeFromSession(session)

    // Authorization: Verify guardian link if role is parent/guardian
    if (!scope.isAdmin) {
      const isTeacher = scope.isTeacher
      if (isTeacher) {
        // Teachers can view if child is in their assigned classroom
        const student = await db.student.findUnique({
          where: { id: studentId },
          select: { currentClassroomId: true },
        })
        if (student?.currentClassroomId) {
          await assertClassroomAccess(session, student.currentClassroomId)
        }
      } else {
        // Guardian check
        const link = await db.studentGuardian.findFirst({
          where: {
            studentId,
            student: { tenantId },
            guardian: { userId: session.uid },
          },
        })
        if (!link) {
          throw new Error('FORBIDDEN_GUARDIAN_ACCESS: You are not authorized to view reports for this child')
        }
      }
    }

    const { dateOnly } = getDayBounds(dateStr)

    const report = await db.dailyReport.findUnique({
      where: {
        tenantId_studentId_reportDate: {
          tenantId,
          studentId,
          reportDate: dateOnly,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            photoUrl: true,
            currentClassroom: { select: { name: true, programType: true } },
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            programType: true,
            primaryTeacher: { select: { fullName: true } },
          },
        },
        publisher: { select: { fullName: true } },
      },
    })

    if (!report || report.status !== 'PUBLISHED') {
      return {
        published: false,
        message: "Your child's daily report for this day has not yet been published by the teacher.",
        date: dateStr,
      }
    }

    return {
      published: true,
      report: {
        id: report.id,
        date: dateStr,
        student: {
          id: report.student.id,
          name: `${report.student.firstName} ${report.student.lastName || ''}`.trim(),
          admissionNo: report.student.admissionNo,
          photoUrl: report.student.photoUrl,
          classroom: report.classroom?.name || report.student.currentClassroom?.name,
        },
        classroomName: report.classroom?.name,
        teacherName: report.publisher?.fullName || report.classroom?.primaryTeacher?.fullName || 'Teacher',
        attendanceStatus: report.attendanceStatus,
        summaryText: report.summaryText,
        activities: report.activitiesSummary || [],
        meals: report.mealsSummary || [],
        naps: report.napSummary || [],
        observations: report.observationsSummary || [],
        photos: report.photos || [],
        publishedAt: report.publishedAt ? report.publishedAt.toISOString() : null,
      },
    }
  }
}


