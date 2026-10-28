import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { StudentService } from '@/lib/students/student-service'
import { BloodGroup } from '@prisma/client'

describe('STU-EDIT-001: Blood Group Edit, Normalization & Validation Regression Tests', () => {
  let tenantId: string
  let branchId: string
  let classroomId: string
  let academicSessionId: string
  let testStudentId: string

  beforeAll(async () => {
    // 1. Resolve test tenant
    const existingTenant = await db.tenant.findFirst()
    if (!existingTenant) throw new Error('No tenant found in database for testing')
    tenantId = existingTenant.id

    // 2. Resolve branch
    let branch = await db.branch.findFirst({ where: { tenantId } })
    if (!branch) {
      branch = await db.branch.create({
        data: { tenantId, name: 'Main Campus', code: `MC-${Date.now()}` },
      })
    }
    branchId = branch.id

    // 3. Resolve active academic session
    let session = await db.academicSession.findFirst({ where: { tenantId, isCurrent: true } })
    if (!session) {
      session = await db.academicSession.create({
        data: {
          tenantId,
          name: '2026-2027 Academic Year',
          code: `AY-${Date.now()}`,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isCurrent: true,
        },
      })
    }
    academicSessionId = session.id

    // 4. Ensure Program exists
    let program = await db.program.findFirst({ where: { tenantId, name: 'NURSERY' } })
    if (!program) {
      program = await db.program.create({
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

    // 5. Create Classroom
    const room = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: 'Blood Group Test Section',
        code: `BG-${Date.now()}`,
        programType: 'NURSERY',
        capacity: 25,
        isActive: true,
      },
    })
    classroomId = room.id

    // 6. Create test student with initial blood group O_POSITIVE
    const student = await StudentService.createStudent(
      {
        tenantId,
        branchId,
        academicSessionId,
        actorId: 'test-admin',
        actorName: 'Test Admin',
        actorRole: 'OWNER',
      },
      {
        firstName: 'BloodGroupTest',
        lastName: `Subject_${Date.now()}`,
        dob: new Date('2023-05-10'),
        gender: 'MALE',
        bloodGroup: 'O_POSITIVE' as BloodGroup,
        classroomId,
        guardianName: 'Test Guardian',
        guardianPhone: `999${Math.floor(1000000 + Math.random() * 9000000)}`,
        guardianRelationship: 'FATHER',
        confirmDuplicate: true,
      }
    )
    testStudentId = student.id
  })

  afterAll(async () => {
    // Clean up test student & allocations
    if (testStudentId) {
      await db.studentAllocation.deleteMany({ where: { studentId: testStudentId } }).catch(() => {})
      await db.timelineEntry.deleteMany({ where: { studentId: testStudentId } }).catch(() => {})
      await db.studentGuardian.deleteMany({ where: { studentId: testStudentId } }).catch(() => {})
      await db.student.delete({ where: { id: testStudentId } }).catch(() => {})
    }
    if (classroomId) {
      await db.classroom.delete({ where: { id: classroomId } }).catch(() => {})
    }
  })

  it('1. Setting a valid enum value saves and persists correctly', async () => {
    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'test-admin',
        actorName: 'Test Admin',
        actorRole: 'OWNER',
      },
      testStudentId,
      {
        bloodGroup: 'B_POSITIVE' as BloodGroup,
      }
    )

    expect(updated.bloodGroup).toBe('B_POSITIVE')

    const dbRecord = await db.student.findUnique({
      where: { id: testStudentId },
      select: { bloodGroup: true },
    })
    expect(dbRecord?.bloodGroup).toBe('B_POSITIVE')
  })

  it('2. Clearing a previously set blood group using empty string "" ("Not Set") normalizes to null and persists in DB', async () => {
    // First ensure student currently has a set blood group
    await db.student.update({
      where: { id: testStudentId },
      data: { bloodGroup: 'A_POSITIVE' },
    })

    // Update with empty string as sent by "- Not Set -" option in select element
    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'test-admin',
        actorName: 'Test Admin',
        actorRole: 'OWNER',
      },
      testStudentId,
      {
        bloodGroup: '',
      }
    )

    expect(updated.bloodGroup).toBeNull()

    const dbRecord = await db.student.findUnique({
      where: { id: testStudentId },
      select: { bloodGroup: true },
    })
    expect(dbRecord?.bloodGroup).toBeNull()
  })

  it('3. Explicit null clears the blood group to null', async () => {
    // Set to AB_POSITIVE first
    await db.student.update({
      where: { id: testStudentId },
      data: { bloodGroup: 'AB_POSITIVE' },
    })

    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'test-admin',
        actorName: 'Test Admin',
        actorRole: 'OWNER',
      },
      testStudentId,
      {
        bloodGroup: null,
      }
    )

    expect(updated.bloodGroup).toBeNull()

    const dbRecord = await db.student.findUnique({
      where: { id: testStudentId },
      select: { bloodGroup: true },
    })
    expect(dbRecord?.bloodGroup).toBeNull()
  })

  it('4. Omitting bloodGroup while updating another field preserves the existing blood group', async () => {
    // Set to O_NEGATIVE
    await db.student.update({
      where: { id: testStudentId },
      data: { bloodGroup: 'O_NEGATIVE' },
    })

    // Update only lastName; bloodGroup is undefined/omitted
    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'test-admin',
        actorName: 'Test Admin',
        actorRole: 'OWNER',
      },
      testStudentId,
      {
        lastName: 'UpdatedLastNameOnly',
      }
    )

    expect(updated.lastName).toBe('UpdatedLastNameOnly')
    expect(updated.bloodGroup).toBe('O_NEGATIVE')

    const dbRecord = await db.student.findUnique({
      where: { id: testStudentId },
      select: { bloodGroup: true, lastName: true },
    })
    expect(dbRecord?.bloodGroup).toBe('O_NEGATIVE')
    expect(dbRecord?.lastName).toBe('UpdatedLastNameOnly')
  })

  it('5. Invalid non-empty enum value is rejected with clear validation error and does NOT silently convert to null', async () => {
    // Set to O_POSITIVE first to ensure it is not altered
    await db.student.update({
      where: { id: testStudentId },
      data: { bloodGroup: 'O_POSITIVE' },
    })

    let caughtError: Error | null = null
    try {
      await StudentService.updateStudent(
        {
          tenantId,
          branchId,
          actorId: 'test-admin',
          actorName: 'Test Admin',
          actorRole: 'OWNER',
        },
        testStudentId,
        {
          bloodGroup: 'INVALID_BLOOD_GROUP_XYZ',
        }
      )
    } catch (err: any) {
      caughtError = err
    }

    expect(caughtError).not.toBeNull()
    expect(caughtError?.message).toContain("Invalid blood group 'INVALID_BLOOD_GROUP_XYZ'")
    expect(caughtError?.message).toContain('Must be one of:')

    // Ensure database value was not altered or cleared
    const dbRecord = await db.student.findUnique({
      where: { id: testStudentId },
      select: { bloodGroup: true },
    })
    expect(dbRecord?.bloodGroup).toBe('O_POSITIVE')
  })
})
