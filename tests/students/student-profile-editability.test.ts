import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { StudentService } from '@/lib/students/student-service'
import { BloodGroup, Gender } from '@prisma/client'

describe('PreOne Student Profile Complete Editability & Save Pipeline Verification', () => {
  let tenantId: string
  let branchId: string
  let classroomAId: string
  let classroomBId: string
  let academicSessionId: string
  let studentId: string
  let observationId: string

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

    // 4. Create two test classrooms for allocation tests
    const roomA = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: 'Pre-K Alpha',
        code: `PKA-${Date.now()}`,
        programType: 'NURSERY',
        capacity: 25,
        isActive: true,
      },
    })
    classroomAId = roomA.id

    const roomB = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: 'Pre-K Beta',
        code: `PKB-${Date.now()}`,
        programType: 'NURSERY',
        capacity: 25,
        isActive: true,
      },
    })
    classroomBId = roomB.id

    // 5. Create student (DOB ~38 months old to satisfy Nursery age eligibility 24-48m)
    const student = await StudentService.createStudent(
      {
        tenantId,
        branchId,
        academicSessionId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      {
        firstName: 'Ananya',
        lastName: 'Sharma',
        dob: new Date('2023-08-15'),
        gender: 'FEMALE',
        bloodGroup: 'B_POSITIVE' as BloodGroup,
        classroomId: classroomAId,
        guardianName: 'Sunita Sharma',
        guardianPhone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
        guardianRelationship: 'MOTHER',
        confirmDuplicate: true,
      }
    )
    studentId = student.id
  })

  afterAll(async () => {
    if (observationId) {
      await db.timelineEntry.deleteMany({ where: { observationId } }).catch(() => {})
      await db.observation.delete({ where: { id: observationId } }).catch(() => {})
    }
    if (studentId) {
      await db.studentAllocation.deleteMany({ where: { studentId } }).catch(() => {})
      await db.timelineEntry.deleteMany({ where: { studentId } }).catch(() => {})
      await db.studentGuardian.deleteMany({ where: { studentId } }).catch(() => {})
      await db.student.delete({ where: { id: studentId } }).catch(() => {})
    }
    if (classroomAId) await db.classroom.delete({ where: { id: classroomAId } }).catch(() => {})
    if (classroomBId) await db.classroom.delete({ where: { id: classroomBId } }).catch(() => {})
  })

  // ── TEST GROUP 1: DEMOGRAPHICS EDIT & PERSISTENCE ──
  it('1. Updates personal demographics: firstName, lastName, dob, gender, address, photoUrl', async () => {
    const originalRecord = await db.student.findUnique({ where: { id: studentId } })
    const originalAdmissionNo = originalRecord?.admissionNo

    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      studentId,
      {
        firstName: 'Ananya-Kavya',
        lastName: 'Sharma-Iyer',
        dob: new Date('2023-09-10'),
        gender: 'FEMALE' as Gender,
        address: '42 Lotus Gardens, Sector 5, Pune',
        photoUrl: 'https://example.com/photos/ananya_updated.jpg',
      }
    )

    expect(updated.firstName).toBe('Ananya-Kavya')
    expect(updated.lastName).toBe('Sharma-Iyer')
    expect(updated.dob.toISOString().slice(0, 10)).toBe('2023-09-10')
    expect(updated.gender).toBe('FEMALE')
    expect(updated.address).toBe('42 Lotus Gardens, Sector 5, Pune')
    expect(updated.photoUrl).toBe('https://example.com/photos/ananya_updated.jpg')

    // Confirm admissionNo was NEVER altered
    expect(updated.admissionNo).toBe(originalAdmissionNo!)

    // Verify DB persistence
    const dbRecord = await db.student.findUnique({ where: { id: studentId } })
    expect(dbRecord?.firstName).toBe('Ananya-Kavya')
    expect(dbRecord?.address).toBe('42 Lotus Gardens, Sector 5, Pune')
  })

  // ── TEST GROUP 2: MEDICAL, ALLERGIES & EMERGENCY DIRECTIVES ──
  it('2. Updates medical alerts, allergies, dietary restrictions, and emergency protocols', async () => {
    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      studentId,
      {
        allergies: 'Peanuts, Shellfish',
        medicalAlerts: 'Asthma (requires inhaler during physical activity)',
        dietaryRestrictions: 'Vegetarian, strictly no gelatin',
        emergencyMedicalInstructions: 'Administer albuterol 2 puffs, call mother immediately: 9876543210',
      }
    )

    expect(updated.allergies).toBe('Peanuts, Shellfish')
    expect(updated.medicalAlerts).toBe('Asthma (requires inhaler during physical activity)')
    expect(updated.dietaryRestrictions).toBe('Vegetarian, strictly no gelatin')
    expect(updated.emergencyMedicalInstructions).toBe('Administer albuterol 2 puffs, call mother immediately: 9876543210')

    const dbRecord = await db.student.findUnique({ where: { id: studentId } })
    expect(dbRecord?.allergies).toBe('Peanuts, Shellfish')
  })

  // ── TEST GROUP 3: SEAT NUMBER EDITING & CONFLICT PREVENTION ──
  it('3. Seat number is editable and prevents collisions within the same classroom section', async () => {
    // 3a. Successfully assign a seat number
    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      studentId,
      {
        seatNumber: 'PKA-SEAT-01',
      }
    )
    expect(updated.seatNumber).toBe('PKA-SEAT-01')

    // 3b. Create another student in the same classroom
    const secondStudent = await StudentService.createStudent(
      {
        tenantId,
        branchId,
        academicSessionId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      {
        firstName: 'Rohan',
        lastName: 'Verma',
        dob: new Date('2023-09-01'),
        gender: 'MALE',
        classroomId: classroomAId,
        guardianName: 'Vikram Verma',
        guardianPhone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        confirmDuplicate: true,
      }
    )

    // 3c. Attempt to assign the exact same seat number to the second student -> must throw error
    let conflictError: Error | null = null
    try {
      await StudentService.updateStudent(
        {
          tenantId,
          branchId,
          actorId: 'admin-1',
          actorName: 'Admin Tester',
          actorRole: 'OWNER',
        },
        secondStudent.id,
        {
          seatNumber: 'PKA-SEAT-01',
        }
      )
    } catch (err: any) {
      conflictError = err
    }

    expect(conflictError).not.toBeNull()
    expect(conflictError?.message).toContain('is already assigned')

    // Clean up second student
    await db.studentAllocation.deleteMany({ where: { studentId: secondStudent.id } })
    await db.studentGuardian.deleteMany({ where: { studentId: secondStudent.id } })
    await db.student.delete({ where: { id: secondStudent.id } })
  })

  // ── TEST GROUP 4: CLEARING OPTIONAL FIELDS ──
  it('4. Optional fields can be cleared to null using empty string or null', async () => {
    const updated = await StudentService.updateStudent(
      {
        tenantId,
        branchId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      studentId,
      {
        lastName: '', // Cleared
        seatNumber: '', // Cleared
        photoUrl: '', // Cleared
        allergies: '', // Cleared
        medicalAlerts: '', // Cleared
        dietaryRestrictions: '', // Cleared
        emergencyMedicalInstructions: '', // Cleared
      }
    )

    expect(updated.lastName).toBeNull()
    expect(updated.seatNumber).toBeNull()
    expect(updated.photoUrl).toBeNull()
    expect(updated.allergies).toBeNull()
    expect(updated.medicalAlerts).toBeNull()

    const dbRecord = await db.student.findUnique({ where: { id: studentId } })
    expect(dbRecord?.lastName).toBeNull()
    expect(dbRecord?.seatNumber).toBeNull()
    expect(dbRecord?.photoUrl).toBeNull()
  })

  // ── TEST GROUP 5: VALIDATION REJECTIONS ──
  it('5. Rejects empty/whitespace first name, invalid DOB, and invalid gender', async () => {
    // 5a. Empty first name
    let emptyFirstErr: Error | null = null
    try {
      await StudentService.updateStudent(
        { tenantId, branchId, actorId: 'admin-1', actorName: 'Admin', actorRole: 'OWNER' },
        studentId,
        { firstName: '   ' }
      )
    } catch (e: any) {
      emptyFirstErr = e
    }
    expect(emptyFirstErr).not.toBeNull()
    expect(emptyFirstErr?.message).toContain('First name is required')

    // 5b. Future DOB
    let futureDobErr: Error | null = null
    try {
      await StudentService.updateStudent(
        { tenantId, branchId, actorId: 'admin-1', actorName: 'Admin', actorRole: 'OWNER' },
        studentId,
        { dob: new Date('2050-01-01') }
      )
    } catch (e: any) {
      futureDobErr = e
    }
    expect(futureDobErr).not.toBeNull()
    expect(futureDobErr?.message).toContain('Date of birth cannot be in the future')

    // 5c. Invalid gender
    let invalidGenderErr: Error | null = null
    try {
      await StudentService.updateStudent(
        { tenantId, branchId, actorId: 'admin-1', actorName: 'Admin', actorRole: 'OWNER' },
        studentId,
        { gender: 'INVALID_GENDER' as any }
      )
    } catch (e: any) {
      invalidGenderErr = e
    }
    expect(invalidGenderErr).not.toBeNull()
    expect(invalidGenderErr?.message).toContain('Invalid gender')
  })

  // ── TEST GROUP 6: OBSERVATION CREATION & EDITING ──
  it('6. Allows creating and editing learning observations for the student', async () => {
    // 6a. Create observation
    const createdObs = await db.observation.create({
      data: {
        tenantId,
        studentId,
        classroomId: classroomAId,
        narrative: 'Observed Ananya identifying geometric shapes with high confidence during morning block play.',
        category: 'Cognitive Learning',
        milestoneTags: 'Shapes, spatial awareness',
        concern: 'NORMAL',
        status: 'DRAFT',
      },
    })
    observationId = createdObs.id
    expect(createdObs.narrative).toContain('identifying geometric shapes')

    // 6b. Edit observation narrative and category
    const updatedObs = await db.observation.update({
      where: { id: observationId },
      data: {
        narrative: 'Observed Ananya identifying and sorting 3D shapes (cylinders, prisms) and assisting peers.',
        category: 'STEM / Inquiry',
        concern: 'PROGRESS',
      },
    })

    expect(updatedObs.narrative).toContain('3D shapes (cylinders, prisms)')
    expect(updatedObs.category).toBe('STEM / Inquiry')
    expect(updatedObs.concern).toBe('PROGRESS')

    // Verify DB persistence
    const dbObs = await db.observation.findUnique({ where: { id: observationId } })
    expect(dbObs?.narrative).toContain('3D shapes (cylinders, prisms)')
  })

  // ── TEST GROUP 7: CLASSROOM REALLOCATION WORKFLOW ──
  it('7. Reallocates classroom section via dedicated business workflow and tracks allocation history', async () => {
    const reallocated = await StudentService.reallocateClassroom(
      {
        tenantId,
        branchId,
        academicSessionId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      studentId,
      {
        destinationClassroomId: classroomBId,
        reason: 'Adjusting classroom balance for peer cohort',
      }
    )

    expect(reallocated.currentClassroomId).toBe(classroomBId)

    // Verify allocations table has historic and active records
    const allocations = await db.studentAllocation.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    })
    expect(allocations.length).toBeGreaterThanOrEqual(2)
    expect(allocations.some((a) => a.classroomId === classroomBId && a.status === 'ACTIVE')).toBe(true)
  })

  // ── TEST GROUP 8: GUARDIAN EDITING & PICKUP AUTHORIZATION ──
  it('8. Updates guardian relationship, contact details, and pickup permissions', async () => {
    const studentGuardians = await db.studentGuardian.findMany({
      where: { studentId },
      include: { guardian: true },
    })
    expect(studentGuardians.length).toBeGreaterThan(0)
    const link = studentGuardians[0]

    const updatedLink = await StudentService.manageGuardians(
      {
        tenantId,
        branchId,
        actorId: 'admin-1',
        actorName: 'Admin Tester',
        actorRole: 'OWNER',
      },
      studentId,
      {
        action: 'UPDATE',
        guardianId: link.guardianId,
        fullName: 'Sunita Sharma-Iyer',
        occupation: 'Head of Pediatric Medicine',
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        isFeePayer: true,
        receivesCommunication: true,
      }
    )

    expect(updatedLink.guardianId).toBe(link.guardianId)
    expect(updatedLink.canPickup).toBe(true)
    expect(updatedLink.isFeePayer).toBe(true)

    const updatedGuardian = await db.guardian.findUnique({ where: { id: link.guardianId } })
    expect(updatedGuardian?.fullName).toBe('Sunita Sharma-Iyer')
    expect(updatedGuardian?.occupation).toBe('Head of Pediatric Medicine')
  })
})
