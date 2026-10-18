import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/**
 * GET /api/v1/hr/schedule — Staff Schedule & Teacher-Classroom Allocations.
 * Uses the existing Classroom branchId and User→StaffProfile relationship
 * without assuming Prisma relations that do not exist in the schema.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'hr:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const branchId = sp.get('branchId') || undefined
    const tenantId = session.tenantId

    const classrooms = await db.classroom.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        primaryTeacher: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        program: { select: { id: true, name: true, code: true } },
        academicSession: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ name: 'asc' }],
    })

    const activeStaff = await db.staffProfile.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    })

    const classroomBranchIds = [...new Set(classrooms.map((c) => c.branchId))]
    const branches = classroomBranchIds.length
      ? await db.branch.findMany({
          where: { tenantId, id: { in: classroomBranchIds } },
          select: { id: true, name: true, code: true },
        })
      : []
    const branchById = new Map(branches.map((b) => [b.id, b]))
    const staffByUserId = new Map(activeStaff.map((s) => [s.userId, s]))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const leaveCoverages = await db.leaveCoverage.findMany({
      where: {
        date: today,
        leaveRequest: { tenantId },
        ...(branchId ? { classroom: { branchId } } : {}),
      },
      include: {
        classroom: { select: { id: true, name: true, code: true } },
        leaveRequest: {
          include: {
            staffProfile: {
              include: { user: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
    })

    const assignedTeacherUserIds = new Set(
      classrooms.map((c) => c.primaryTeacherId).filter((id): id is string => Boolean(id))
    )

    const unassignedTeachers = activeStaff.filter(
      (s) =>
        (s.designation?.toLowerCase().includes('teacher') ||
          s.designation?.toLowerCase().includes('educator') ||
          s.department?.toLowerCase().includes('academic')) &&
        !assignedTeacherUserIds.has(s.userId)
    )

    const scheduleData = {
      classrooms: classrooms.map((c) => {
        const teacherProfile = c.primaryTeacher ? staffByUserId.get(c.primaryTeacher.id) : undefined
        const branch = branchById.get(c.branchId)
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          programType: c.programType,
          programName: c.program?.name || null,
          capacity: c.capacity,
          enrolledCount: c._count.students,
          branchId: c.branchId,
          branchName: branch?.name || 'Main Campus',
          primaryTeacher: c.primaryTeacher
            ? {
                id: c.primaryTeacher.id,
                name: c.primaryTeacher.fullName,
                email: c.primaryTeacher.email,
                phone: c.primaryTeacher.phone,
                employeeCode: teacherProfile?.employeeCode || null,
                designation: teacherProfile?.designation || 'Teacher',
              }
            : null,
          defaultShift: '08:30 AM – 03:30 PM',
          workingHours: 7.0,
        }
      }),
      unassignedTeachers: unassignedTeachers.map((t) => ({
        id: t.id,
        userId: t.userId,
        name: t.user.fullName,
        email: t.user.email,
        phone: t.user.phone,
        employeeCode: t.employeeCode,
        designation: t.designation || 'Teacher',
        branchName: t.branch?.name || 'Main Campus',
      })),
      coveragesToday: leaveCoverages.map((cov) => ({
        id: cov.id,
        classroomName: cov.classroom.name,
        absentTeacherName: cov.leaveRequest.staffProfile.user.fullName,
        status: cov.status,
        notes: cov.notes,
      })),
      summary: {
        totalClassrooms: classrooms.length,
        assignedClassrooms: classrooms.filter((c) => c.primaryTeacherId !== null).length,
        unassignedClassrooms: classrooms.filter((c) => c.primaryTeacherId === null).length,
        availableTeachers: unassignedTeachers.length,
        activeCoveragesToday: leaveCoverages.length,
      },
    }

    return ok(scheduleData)
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
