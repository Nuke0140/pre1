import { db } from '@/lib/db'
import { SessionPayload } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { SubjectService } from '@/lib/academics/subject-service'
import { AttendanceStatus, ActivityStatus, ObservationConcern } from '@prisma/client'
import { isoDate } from '@/lib/format'

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

/** Helper: Assert that a teacher only accesses their assigned classroom */
async function assertClassroomAccess(session: SessionPayload, classroomId: string) {
  const tenantId = session.tenantId!
  const scope = getScopeFromSession(session)
  if (scope.isAdmin) return

  const classroom = await db.classroom.findFirst({
    where: { id: classroomId, tenantId },
    select: { primaryTeacherId: true },
  })

  if (!classroom) {
    throw new Error('Classroom not found')
  }

  if (classroom.primaryTeacherId === session.uid) {
    return
  }

  const isMapped = await db.classroomSubject.findFirst({
    where: { classroomId, specialistTeacherId: session.uid },
  })

  if (!isMapped) {
    throw new Error('FORBIDDEN_TEACHER_CLASSROOM_ACCESS: You are only authorized to manage your assigned classroom')
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
    const branches = await db.branch.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true, code: true, isMain: true },
      orderBy: { isMain: 'desc' },
    })

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
    } else if (scope.branchId) {
      // Admin scoped by branch if branchId present
      classroomsWhere.branchId = scope.branchId
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
   * Attendance, Activities, Meals, Naps, Observations, Care, and Incidents.
   */
  static async quickLog(
    session: SessionPayload,
    data: {
      classroomId: string
      type: 'ATTENDANCE' | 'ACTIVITY' | 'MEAL' | 'NAP' | 'OBSERVATION' | 'CARE' | 'INCIDENT'
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

    switch (data.type) {
      case 'ATTENDANCE': {
        if (!data.students || !data.students.length) {
          throw new Error('No attendance student records provided')
        }
        return await this.saveAttendanceRegister(session, data.classroomId, dateStr, data.students)
      }

      case 'ACTIVITY': {
        if (!data.title) throw new Error('title is required for activity')
        const activity = await this.createActivity(session, {
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
          return await this.updateActivity(session, activity.id, {
            status: data.status,
            actualOutcome: data.actualOutcome,
          })
        }
        return activity
      }

      case 'MEAL': {
        const mealName = data.mealName || data.title || 'Fruit Snack'
        const entries = data.mealEntries || []
        if (!entries.length) throw new Error('No student meal entries provided')

        const createdEntries: any[] = []
        for (const item of entries) {
          const entry = await db.timelineEntry.create({
            data: {
              tenantId,
              studentId: item.studentId,
              classroomId: data.classroomId,
              academicSessionId: classroom?.academicSessionId,
              type: 'MEAL',
              title: mealName,
              body: item.intake ? `${item.intake}${item.notes ? ` — ${item.notes}` : ''}` : (item.notes || 'Meal recorded'),
              authorId: session.uid,
              createdAt: data.time ? new Date(`${dateStr}T${data.time}:00.000Z`) : new Date(),
            },
          })
          createdEntries.push(entry)
        }

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded ${mealName}`,
          newValues: { type: 'MEAL', mealName, count: entries.length, date: dateStr },
        })

        return { success: true, count: createdEntries.length, mealName }
      }

      case 'NAP': {
        const title = data.title || 'Nap & Rest Time'
        const entries = data.napEntries || []
        if (!entries.length) throw new Error('No student nap entries provided')

        const createdEntries: any[] = []
        for (const item of entries) {
          const entry = await db.timelineEntry.create({
            data: {
              tenantId,
              studentId: item.studentId,
              classroomId: data.classroomId,
              academicSessionId: classroom?.academicSessionId,
              type: 'NAP',
              title,
              body: item.napStatus ? `${item.napStatus}${item.notes ? ` — ${item.notes}` : ''}` : (item.notes || 'Rest recorded'),
              authorId: session.uid,
              createdAt: data.startTime ? new Date(`${dateStr}T${data.startTime}:00.000Z`) : new Date(),
            },
          })
          createdEntries.push(entry)
        }

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded ${title}`,
          newValues: { type: 'NAP', title, count: entries.length, date: dateStr },
        })

        return { success: true, count: createdEntries.length, title }
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

        const createdEntries: any[] = []
        for (const item of entries) {
          const entry = await db.timelineEntry.create({
            data: {
              tenantId,
              studentId: item.studentId,
              classroomId: data.classroomId,
              academicSessionId: classroom?.academicSessionId,
              type: mappedType,
              title: data.title || careType.replace('_', ' '),
              body: item.notes || `${careType} recorded`,
              authorId: session.uid,
              createdAt: data.time ? new Date(`${dateStr}T${data.time}:00.000Z`) : new Date(),
            },
          })
          createdEntries.push(entry)
        }

        await recordAudit({
          tenantId,
          actorId: session.uid,
          action: 'CREATE',
          entity: 'TimelineEntry',
          entityId: data.classroomId,
          summary: `Recorded ${careType}`,
          newValues: { type: mappedType, careType, count: entries.length },
        })

        return { success: true, count: createdEntries.length, careType }
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
}
