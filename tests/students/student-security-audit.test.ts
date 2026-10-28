import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { StudentService } from '@/lib/students/student-service'

describe('Student Module Security & Integration Audit Regression Tests', () => {
  let tenantId: string
  let branchAId: string
  let branchBId: string
  let classroomAId: string
  let classroomBId: string
  let academicSessionId: string
  let studentId: string
  let parentUserId: string
  let guardianId: string
  let teacherUserId: string

  beforeAll(async () => {
    // Resolve existing or create test tenant
    const existingTenant = await db.tenant.findFirst()
    if (!existingTenant) throw new Error('No tenant found in database for testing')
    tenantId = existingTenant.id

    // Ensure two branches
    let branches = await db.branch.findMany({ where: { tenantId } })
    if (branches.length < 2) {
      const b1 = branches[0] || (await db.branch.create({ data: { tenantId, name: 'Campus Alpha', code: 'CAMP-A' } }))
      const b2 = await db.branch.create({ data: { tenantId, name: 'Campus Beta', code: 'CAMP-B' } })
      branches = [b1, b2]
    }
    branchAId = branches[0].id
    branchBId = branches[1].id

    // Ensure active academic session
    let session = await db.academicSession.findFirst({ where: { tenantId, isCurrent: true } })
    if (!session) {
      session = await db.academicSession.create({
        data: {
          tenantId,
          name: '2026-2027 Academic Year',
          code: 'AY-2026-27',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      })
    }
    academicSessionId = session.id

    // Ensure Program exists for tenant
    let program = await db.program.findFirst({ where: { tenantId, name: 'NURSERY' } })
    if (!program) {
      await db.program.create({
        data: {
          tenantId,
          name: 'NURSERY',
          code: `NUR-${Date.now()}`,
          programType: 'NURSERY',
          ageMinMonths: 24,
          ageMaxMonths: 48,
          isActive: true,
        },
      })
    }

    // Create Classrooms in Branch A and Branch B
    const roomA = await db.classroom.create({
      data: {
        tenantId,
        branchId: branchAId,
        academicSessionId,
        name: 'Alpha Toddlers',
        code: `ATOD-${Date.now()}`,
        programType: 'NURSERY',
        capacity: 20,
        isActive: true,
      },
    })
    classroomAId = roomA.id

    const roomB = await db.classroom.create({
      data: {
        tenantId,
        branchId: branchBId,
        academicSessionId,
        name: 'Beta Toddlers',
        code: `BTOD-${Date.now()}`,
        programType: 'NURSERY',
        capacity: 20,
        isActive: true,
      },
    })
    classroomBId = roomB.id

    // Create parent user & guardian
    const pUser = await db.user.create({
      data: {
        email: `audit.parent.${Date.now()}@example.com`,
        fullName: 'Audit Parent',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
      },
    })
    parentUserId = pUser.id

    // Create teacher user
    const tUser = await db.user.create({
      data: {
        email: `audit.teacher.${Date.now()}@example.com`,
        fullName: 'Audit Teacher',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
      },
    })
    teacherUserId = tUser.id

    // Assign teacher to classroom A
    await db.classroom.update({
      where: { id: classroomAId },
      data: { primaryTeacherId: teacherUserId },
    })

    // Create student in Branch A and Classroom A
    const createdStudent = await StudentService.createStudent(
      {
        tenantId,
        branchId: branchAId,
        academicSessionId,
        actorId: 'system',
        actorName: 'System',
        actorRole: 'OWNER',
      },
      {
        firstName: 'AuditChild',
        lastName: `SecCheck_${Date.now()}`,
        dob: new Date('2023-01-15'),
        gender: 'FEMALE',
        classroomId: classroomAId,
        guardianName: 'Audit Parent',
        guardianPhone: `999${Math.floor(1000000 + Math.random() * 9000000)}`,
        guardianEmail: pUser.email,
        guardianRelationship: 'MOTHER',
        confirmDuplicate: true,
      }
    )
    studentId = createdStudent.id

    const sg = await db.studentGuardian.findFirst({
      where: { studentId },
      include: { guardian: true },
    })
    guardianId = sg!.guardianId

    // Link guardian to portal user
    await db.guardian.update({
      where: { id: guardianId },
      data: { userId: parentUserId },
    })
  })

  it('STU-AUDIT-001: Parent can access student summary drawer when linked to ward', async () => {
    // Call getStudentSummary with PARENT actorRole matching parentUserId
    const summary = await StudentService.getStudentSummary(
      {
        tenantId,
        branchId: branchAId,
        academicSessionId,
        actorId: parentUserId,
        actorName: 'Audit Parent',
        actorRole: 'PARENT',
        actorRoles: ['PARENT'],
      },
      studentId
    )

    expect(summary).toBeDefined()
    expect(summary.student.id).toBe(studentId)
    expect(summary.student.firstName).toBe('AuditChild')
  })

  it('STU-AUDIT-002: Unlinked parent is blocked from accessing student summary drawer', async () => {
    let error: any = null
    try {
      await StudentService.getStudentSummary(
        {
          tenantId,
          branchId: branchAId,
          academicSessionId,
          actorId: 'unlinked-parent-user-id',
          actorName: 'Stranger Parent',
          actorRole: 'PARENT',
          actorRoles: ['PARENT'],
        },
        studentId
      )
    } catch (e: any) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.message).toContain('Unauthorized: You can only view your own child')
  })

  it('STU-AUDIT-003: Teacher does NOT receive student finance data in getStudentProfile', async () => {
    const profile = await StudentService.getStudentProfile(
      {
        tenantId,
        branchId: branchAId,
        academicSessionId,
        actorId: teacherUserId,
        actorName: 'Audit Teacher',
        actorRole: 'TEACHER',
        actorRoles: ['TEACHER'],
      },
      studentId
    )

    expect(profile).toBeDefined()
    expect(profile.finance).toBeDefined()
    expect(profile.finance.totalBilledCents).toBe(0)
    expect(profile.finance.invoices.length).toBe(0)
    expect(profile.finance.deposits.length).toBe(0)
  })

  it('STU-AUDIT-004: Owner / Finance role DOES receive student finance data in getStudentProfile', async () => {
    const profile = await StudentService.getStudentProfile(
      {
        tenantId,
        branchId: branchAId,
        academicSessionId,
        actorId: 'admin-id',
        actorName: 'School Owner',
        actorRole: 'OWNER',
        actorRoles: ['OWNER'],
      },
      studentId
    )

    expect(profile).toBeDefined()
    expect(profile.finance).toBeDefined()
    expect(profile.finance.invoices).toBeDefined()
  })

  it('STU-AUDIT-005: manageGuardians masks pickupPin in API output', async () => {
    const result: any = await StudentService.manageGuardians(
      {
        tenantId,
        branchId: branchAId,
        actorId: 'admin-id',
        actorName: 'School Owner',
        actorRole: 'OWNER',
      },
      studentId,
      {
        action: 'UPDATE',
        guardianId,
        pickupPin: '9876',
        canPickup: true,
      }
    )

    expect(result.pickupPin).toBeUndefined()
    expect(result.hasPickupPin).toBe(true)
    expect(result.pickupPinMasked).toBe('••••')
  })

  it('STU-AUDIT-006: Reallocating student to classroom in different branch is rejected', async () => {
    let error: any = null
    try {
      await StudentService.reallocateClassroom(
        {
          tenantId,
          branchId: branchAId,
          academicSessionId,
          actorId: 'admin-id',
          actorName: 'School Owner',
          actorRole: 'OWNER',
        },
        studentId,
        {
          destinationClassroomId: classroomBId, // In Branch B, while student is in Branch A
          reason: 'Attempted cross-branch section switch',
        }
      )
    } catch (e: any) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.message).toContain('Cannot reallocate to classroom in a different branch')
  })

  it('STU-AUDIT-007: createStudent rejects classroom belonging to a different branch', async () => {
    let error: any = null
    try {
      await StudentService.createStudent(
        {
          tenantId,
          branchId: branchAId,
          academicSessionId,
          actorId: 'system',
          actorName: 'System',
          actorRole: 'OWNER',
        },
        {
          firstName: 'CrossBranch',
          lastName: 'Candidate',
          dob: new Date('2023-01-15'),
          gender: 'MALE',
          branchId: branchAId,
          classroomId: classroomBId, // Belongs to Branch B
          guardianName: 'Audit Parent',
          guardianPhone: '9991234567',
        }
      )
    } catch (e: any) {
      error = e
    }

    expect(error).not.toBeNull()
    expect(error.message).toContain('Selected classroom belongs to a different branch')
  })
})
