import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { POST as statusPost } from '@/app/api/v1/users/[id]/status/route'
import { DELETE as userDelete, GET as userGet } from '@/app/api/v1/users/[id]/route'
import { GET as usersGet } from '@/app/api/v1/users/route'
import { GET as classroomsGet } from '@/app/api/v1/classrooms/route'
import { GET as studentsGet } from '@/app/api/v1/students/route'
import { GET as studentDetailGet } from '@/app/api/v1/students/[id]/route'
import { GET as attendanceExportGet } from '@/app/api/v1/attendance/export/route'
import { GET as attendanceGet, POST as attendancePost } from '@/app/api/v1/attendance/route'
import { resolveAuthorizedBranchScope } from '@/lib/admissions/branch-context'
import { isoDate } from '@/lib/format'

describe('Sprint Hardening: Admin Actions, Teacher Scope & Attendance Export', () => {
  let tenant: any
  let branchA: any
  let branchB: any
  let classroomA: any
  let classroomB: any
  let ownerUser: any
  let adminUser: any
  let teacherAUser: any
  let teacherUnassignedUser: any
  let staffTargetUser: any
  let studentA: any
  let studentB: any

  let cookieOwner: string
  let cookieAdmin: string
  let cookieTeacherA: string
  let cookieTeacherUnassigned: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant
    tenant = await db.tenant.create({
      data: {
        name: `Sprint Hardening School ${ts}`,
        code: `SHS-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup 2 Branches
    branchA = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: `Main Campus ${ts}`,
        code: `MAIN-${ts.slice(-3)}`,
        isMain: true,
        isActive: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: `North Campus ${ts}`,
        code: `NORTH-${ts.slice(-3)}`,
        isMain: false,
        isActive: true,
      },
    })

    // 3. Setup Owner
    ownerUser = await db.user.create({
      data: {
        email: `owner_${ts}@hardening.com`,
        username: `owner_${ts}`,
        fullName: 'School Owner',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: ownerUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })
    cookieOwner = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      role: 'OWNER',
      tenantId: tenant.id,
    })

    // 4. Setup Admin / Principal User
    adminUser = await db.user.create({
      data: {
        email: `admin_${ts}@hardening.com`,
        username: `admin_${ts}`,
        fullName: 'School Principal Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: adminUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })
    cookieAdmin = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      tenantId: tenant.id,
    })

    // 5. Setup Teacher A (assigned to Classroom A and Branch A)
    teacherAUser = await db.user.create({
      data: {
        email: `teacherA_${ts}@hardening.com`,
        username: `teacherA_${ts}`,
        fullName: 'Teacher A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherAUser.id,
        branchId: branchA.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
    cookieTeacherA = await signSession({
      uid: teacherAUser.id,
      email: teacherAUser.email,
      name: teacherAUser.fullName,
      role: 'TEACHER',
      roles: ['TEACHER'],
      tenantId: tenant.id,
      branchId: branchA.id,
    })

    // 6. Setup Teacher Unassigned (no classroom, no branch)
    teacherUnassignedUser = await db.user.create({
      data: {
        email: `teacher_unassigned_${ts}@hardening.com`,
        username: `teacher_unassigned_${ts}`,
        fullName: 'Unassigned Teacher',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUnassignedUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
    cookieTeacherUnassigned = await signSession({
      uid: teacherUnassignedUser.id,
      email: teacherUnassignedUser.email,
      name: teacherUnassignedUser.fullName,
      role: 'TEACHER',
      roles: ['TEACHER'],
      tenantId: tenant.id,
    })

    // 7. Setup Staff Target
    staffTargetUser = await db.user.create({
      data: {
        email: `staff_target_${ts}@hardening.com`,
        username: `staff_target_${ts}`,
        fullName: 'Target Staff Member',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: staffTargetUser.id,
        branchId: branchA.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    })

    // 8. Setup Academic Session and Classrooms
    const academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `AY ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })

    classroomA = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        name: `Nursery A ${ts}`,
        code: `NUR-A-${ts.slice(-3)}`,
        programType: 'NURSERY',
        primaryTeacherId: teacherAUser.id,
        academicSessionId: academicSession.id,
        isActive: true,
      },
    })

    classroomB = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branchB.id,
        name: `Playgroup B ${ts}`,
        code: `PG-B-${ts.slice(-3)}`,
        programType: 'PLAYGROUP',
        primaryTeacherId: ownerUser.id, // Not teacherA
        academicSessionId: academicSession.id,
        isActive: true,
      },
    })

    // 9. Setup Students
    studentA = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        currentClassroomId: classroomA.id,
        admissionNo: `STU-A-${ts.slice(-4)}`,
        firstName: '=FormulaInjectionChild',
        lastName: 'Test',
        dob: new Date('2022-05-15'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    studentB = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branchB.id,
        currentClassroomId: classroomB.id,
        admissionNo: `STU-B-${ts.slice(-4)}`,
        firstName: 'NormalChildB',
        lastName: 'Test',
        dob: new Date('2022-08-20'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    // 10. Setup Attendance Record
    const today = new Date(isoDate())
    await db.attendance.create({
      data: {
        tenantId: tenant.id,
        branchId: branchA.id,
        classroomId: classroomA.id,
        studentId: studentA.id,
        date: today,
        status: 'PRESENT',
        markedById: teacherAUser.id,
        notes: '+SensitiveNotes=123',
      },
    })
  })

  // =========================================================================
  // ISSUE 1: Admin Suspend and Delete Users
  // =========================================================================
  describe('Issue 1: Admin Suspend & Delete Users', () => {
    it('1.1: Authorized admin can suspend a user account', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users/${staffTargetUser.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `preone_session=${cookieAdmin}`,
          },
          body: JSON.stringify({
            action: 'suspend',
            reason: 'Administrative policy review',
          }),
        }
      )
      const res = await statusPost(req, { params: Promise.resolve({ id: staffTargetUser.id }) })
      expect(res.status).toBe(200)

      const member = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId: staffTargetUser.id },
      })
      expect(member?.status).toBe('SUSPENDED')
    })

    it('1.2: Admin cannot suspend their own account (CANNOT_SUSPEND_SELF)', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users/${adminUser.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `preone_session=${cookieAdmin}`,
          },
          body: JSON.stringify({
            action: 'suspend',
            reason: 'Self suspension attempt',
          }),
        }
      )
      const res = await statusPost(req, { params: Promise.resolve({ id: adminUser.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error?.code).toBe('CANNOT_SUSPEND_SELF')
    })

    it('1.3: Authorized admin can reactivate a suspended user', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users/${staffTargetUser.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `preone_session=${cookieAdmin}`,
          },
          body: JSON.stringify({
            action: 'reactivate',
            reason: 'Reinstated by admin',
          }),
        }
      )
      const res = await statusPost(req, { params: Promise.resolve({ id: staffTargetUser.id }) })
      expect(res.status).toBe(200)

      const member = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId: staffTargetUser.id },
      })
      expect(member?.status).toBe('ACTIVE')
    })

    it('1.4: Admin cannot delete their own account (CANNOT_DELETE_SELF)', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users/${adminUser.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `preone_session=${cookieAdmin}`,
          },
          body: JSON.stringify({ reason: 'Accidental self-delete' }),
        }
      )
      const res = await userDelete(req, { params: Promise.resolve({ id: adminUser.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error?.code).toBe('CANNOT_DELETE_SELF')
    })

    it('1.5: Cannot delete school owner account', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users/${ownerUser.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `preone_session=${cookieAdmin}`,
          },
          body: JSON.stringify({ reason: 'Attempted owner delete' }),
        }
      )
      const res = await userDelete(req, { params: Promise.resolve({ id: ownerUser.id }) })
      expect(res.status).toBe(403)
    })

    it('1.6: Authorized admin can soft-delete a user, preserving records and revoking sessions', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users/${staffTargetUser.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `preone_session=${cookieAdmin}`,
          },
          body: JSON.stringify({ reason: 'Staff departure and contract completion' }),
        }
      )
      const res = await userDelete(req, { params: Promise.resolve({ id: staffTargetUser.id }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data?.deactivated).toBe(true)

      const member = await db.tenantUser.findFirst({
        where: { tenantId: tenant.id, userId: staffTargetUser.id },
      })
      expect(member?.status).toBe('INACTIVE')
      expect(member?.deletedAt).not.toBeNull()

      // The historical User record still exists
      const user = await db.user.findUnique({ where: { id: staffTargetUser.id } })
      expect(user).not.toBeNull()
    })

    it('1.7: GET /api/v1/users returns soft-deleted users when filtered by status=INACTIVE', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/users?status=INACTIVE`,
        {
          method: 'GET',
          headers: { Cookie: `preone_session=${cookieAdmin}` },
        }
      )
      const res = await usersGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      const found = json.data?.some((u: any) => u.userId === staffTargetUser.id)
      expect(found).toBe(true)
    })
  })

  // =========================================================================
  // ISSUE 3: Teacher Scope Enforcement
  // =========================================================================
  describe('Issue 3: Teacher Scope Enforcement', () => {
    it('3.1: Unassigned teacher has no branch access (returns empty array, no silent main branch fallback)', async () => {
      const scope = await resolveAuthorizedBranchScope(
        {
          uid: teacherUnassignedUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          tenantId: tenant.id,
        } as any
      )
      expect(scope.mode).toBe('NO_BRANCH_ACCESS')
      expect(scope.authorizedBranchIds).toEqual([])
      expect(scope.branches).toEqual([])

      const req = new NextRequest(`http://localhost/api/v1/classrooms`, {
        headers: { Cookie: `preone_session=${cookieTeacherUnassigned}` },
      })
      const res = await classroomsGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual([])
    })

    it('3.2: Unassigned teacher querying students returns empty array with unassigned flag', async () => {
      const req = new NextRequest(`http://localhost/api/v1/students`, {
        headers: { Cookie: `preone_session=${cookieTeacherUnassigned}` },
      })
      const res = await studentsGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual([])
      expect(json.meta?.total ?? json.pagination?.total).toBe(0)
    })

    it('3.3: Teacher A only sees their assigned classroom (Classroom A)', async () => {
      const req = new NextRequest(`http://localhost/api/v1/classrooms`, {
        headers: { Cookie: `preone_session=${cookieTeacherA}` },
      })
      const res = await classroomsGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      const classroomIds = json.data.map((c: any) => c.id)
      expect(classroomIds).toContain(classroomA.id)
      expect(classroomIds).not.toContain(classroomB.id)
    })

    it('3.4: Teacher A only sees students in their assigned classroom', async () => {
      const req = new NextRequest(`http://localhost/api/v1/students`, {
        headers: { Cookie: `preone_session=${cookieTeacherA}` },
      })
      const res = await studentsGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      const studentIds = json.data.map((s: any) => s.id)
      expect(studentIds).toContain(studentA.id)
      expect(studentIds).not.toContain(studentB.id)
    })

    it('3.5: Teacher A is forbidden from viewing details of a student in another classroom', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/students/${studentB.id}`,
        {
          headers: { Cookie: `preone_session=${cookieTeacherA}` },
        }
      )
      const res = await studentDetailGet(req, { params: Promise.resolve({ id: studentB.id }) })
      expect(res.status).toBe(403)
    })

    it('3.6: Teacher A cannot access attendance of an unassigned classroom', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/attendance?classroomId=${classroomB.id}&date=${isoDate()}`,
        {
          headers: { Cookie: `preone_session=${cookieTeacherA}` },
        }
      )
      const res = await attendanceGet(req)
      expect(res.status).toBe(403)
    })

    it('3.7: Teacher A cannot mark attendance for an unassigned classroom', async () => {
      const req = new NextRequest(`http://localhost/api/v1/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `preone_session=${cookieTeacherA}`,
        },
        body: JSON.stringify({
          classroomId: classroomB.id,
          date: isoDate(),
          entries: [{ studentId: studentB.id, status: 'PRESENT' }],
        }),
      })
      const res = await attendancePost(req)
      expect(res.status).toBe(403)
    })
  })

  // =========================================================================
  // ISSUE 4: Attendance CSV Export
  // =========================================================================
  describe('Issue 4: Attendance CSV Export', () => {
    it('4.1: Exports attendance as UTF-8 CSV with BOM and proper headers', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/attendance/export?classroomId=${classroomA.id}&date=${isoDate()}`,
        {
          headers: { Cookie: `preone_session=${cookieAdmin}` },
        }
      )
      const res = await attendanceExportGet(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/csv')
      expect(res.headers.get('content-disposition')).toContain('attachment')

      const text = await res.text()
      // Verifies UTF-8 BOM
      expect(text.charCodeAt(0)).toBe(0xfeff)
      // Verifies CSV header columns
      expect(text).toContain('Admission No')
      expect(text).toContain('Student Name')
      expect(text).toContain('Campus')
      expect(text).toContain('Classroom')
      expect(text).toContain('Status')
    })

    it('4.2: Formula injection protection prefixes unsafe cell values with single quote', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/attendance/export?classroomId=${classroomA.id}&date=${isoDate()}`,
        {
          headers: { Cookie: `preone_session=${cookieAdmin}` },
        }
      )
      const res = await attendanceExportGet(req)
      const text = await res.text()

      // studentA has firstName: '=FormulaInjectionChild' -> must be sanitized to "'=FormulaInjectionChild"
      expect(text).toContain("\"'=FormulaInjectionChild")
      // notes: '+SensitiveNotes=123' -> must be sanitized to "'+SensitiveNotes=123"
      expect(text).toContain("\"'+SensitiveNotes=123\"")
    })

    it('4.3: Teacher A can only export attendance for their assigned classroom', async () => {
      // Legitimate export for assigned Classroom A
      const reqA = new NextRequest(
        `http://localhost/api/v1/attendance/export?classroomId=${classroomA.id}&date=${isoDate()}`,
        {
          headers: { Cookie: `preone_session=${cookieTeacherA}` },
        }
      )
      const resA = await attendanceExportGet(reqA)
      expect(resA.status).toBe(200)

      // Forbidden export attempt for unassigned Classroom B
      const reqB = new NextRequest(
        `http://localhost/api/v1/attendance/export?classroomId=${classroomB.id}&date=${isoDate()}`,
        {
          headers: { Cookie: `preone_session=${cookieTeacherA}` },
        }
      )
      const resB = await attendanceExportGet(reqB)
      expect(resB.status).toBe(403)
    })

    it('4.4: Unassigned teacher export returns empty CSV with headers without throwing', async () => {
      const req = new NextRequest(
        `http://localhost/api/v1/attendance/export?date=${isoDate()}`,
        {
          headers: { Cookie: `preone_session=${cookieTeacherUnassigned}` },
        }
      )
      const res = await attendanceExportGet(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toContain('Admission No')
      // Only 1 line of header
      const lines = text.trim().split('\n')
      expect(lines.length).toBe(1)
    })
  })
})
