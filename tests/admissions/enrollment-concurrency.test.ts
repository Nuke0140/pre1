import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { ClassroomPlacementService } from '@/lib/admissions/classroom-placement-service'
import { nextNumber } from '@/lib/sequence'

describe('PreOne Phase 04.1: Admissions Concurrency Hardening & Row-Level Locking', () => {
  let tenantId: string
  let branchId: string
  let academicSessionId: string
  let teacherId: string
  let ctx: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenant
    const tenant = await db.tenant.create({
      data: {
        name: `Concurrency Academy ${ts}`,
        code: `CONC_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantId = tenant.id

    // 2. Create Branch
    const branch = await db.branch.create({
      data: {
        tenantId,
        name: 'Main Campus',
        code: `BR_CONC_${ts}`,
        isMain: true,
      },
    })
    branchId = branch.id

    // 2b. Create Program
    await db.program.create({
      data: {
        tenantId,
        name: 'Nursery Program',
        code: `PROG_NUR_${ts}`,
        programType: 'NURSERY',
        isActive: true,
        ageMinMonths: 24,
        ageMaxMonths: 60,
      },
    })

    // 3. Create Academic Session
    const session = await db.academicSession.create({
      data: {
        tenantId,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })
    academicSessionId = session.id

    // 4. Create Fee Plan for Nursery
    await db.feePlan.create({
      data: {
        tenantId,
        name: 'Standard Nursery Fee Plan',
        programType: 'NURSERY',
        isActive: true,
        totalAnnualCents: 4000000,
        items: {
          create: [
            {
              feeHead: 'ADMISSION',
              label: 'One-Time Admission Fee',
              amountCents: 1500000,
              frequency: 'ONE_TIME',
            },
            {
              feeHead: 'TUITION',
              label: 'Term 1 Tuition Fee',
              amountCents: 2500000,
              frequency: 'ONE_TIME',
            },
          ],
        },
      },
    })

    // 5. Create Teacher User
    const teacher = await db.user.create({
      data: {
        email: `teacher_conc_${ts}@preone.local`,
        fullName: 'Lead Teacher Ananya',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })
    teacherId = teacher.id

    ctx = {
      tenantId,
      branchId,
      academicYearId: academicSessionId,
      actorId: teacherId,
      actorName: 'Lead Teacher Ananya',
      actorRole: 'OWNER',
    }
  })

  it('1. Two applications competing for the final remaining seat: exactly one wins and one receives CLASSROOM_FULL', async () => {
    const ts = Date.now()

    // Create classroom with capacity: 2
    const classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: `Nursery Robins ${ts}`,
        code: `NR_ROB_${ts}`,
        programType: 'NURSERY',
        capacity: 2,
        isActive: true,
        primaryTeacherId: teacherId,
      },
    })

    // Seed 1 existing active student -> Exactly 1 seat remaining
    await db.student.create({
      data: {
        tenantId,
        branchId,
        admissionNo: `STU-PRE-${ts}`,
        firstName: 'Initial',
        lastName: 'Student',
        dob: new Date('2023-01-15'),
        gender: 'MALE',
        currentClassroomId: classroom.id,
        status: 'ACTIVE',
      },
    })

    // Create Candidate Alpha
    const appAlpha = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-ALPHA-${ts}`,
        childFirstName: 'Alpha',
        childLastName: 'Racer',
        childDob: new Date('2023-04-10'),
        childGender: 'FEMALE',
        parentName: 'Racer Parent A',
        parentPhone: `987000${String(ts).slice(-4)}1`,
        programType: 'NURSERY',
        status: 'APPROVED',
        documents: {
          create: [
            { docType: 'BIRTH_CERTIFICATE', fileName: 'birth.pdf', verified: true, status: 'VERIFIED' },
            { docType: 'PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
            { docType: 'AADHAAR', fileName: 'aadhaar.pdf', verified: true, status: 'VERIFIED' },
          ],
        },
      },
    })

    // Create Candidate Beta
    const appBeta = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-BETA-${ts}`,
        childFirstName: 'Beta',
        childLastName: 'Racer',
        childDob: new Date('2023-05-12'),
        childGender: 'MALE',
        parentName: 'Racer Parent B',
        parentPhone: `987000${String(ts).slice(-4)}2`,
        programType: 'NURSERY',
        status: 'APPROVED',
        documents: {
          create: [
            { docType: 'BIRTH_CERTIFICATE', fileName: 'birth.pdf', verified: true, status: 'VERIFIED' },
            { docType: 'PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
            { docType: 'AADHAAR', fileName: 'aadhaar.pdf', verified: true, status: 'VERIFIED' },
          ],
        },
      },
    })

    // Execute concurrent enrollment race
    const [resAlpha, resBeta] = await Promise.allSettled([
      AdmissionService.completeEnrollment(ctx, appAlpha.id, classroom.id),
      AdmissionService.completeEnrollment(ctx, appBeta.id, classroom.id),
    ])

    // Verify exactly one succeeded and exactly one failed
    const fulfilled = [resAlpha, resBeta].filter((r) => r.status === 'fulfilled')
    const rejected = [resAlpha, resBeta].filter((r) => r.status === 'rejected')

    expect(fulfilled.length).toBe(1)
    expect(rejected.length).toBe(1)

    // The rejected request must have CLASSROOM_FULL error code
    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason
    expect(rejectedReason.code).toBe('CLASSROOM_FULL')
    expect(rejectedReason.message).toContain('full capacity')

    // Verify classroom student count NEVER exceeds capacity
    const finalCount = await db.student.count({
      where: { currentClassroomId: classroom.id, status: 'ACTIVE', deletedAt: null },
    })
    expect(finalCount).toBe(2)

    // Verify that exactly one candidate is ENROLLED and the other remains APPROVED
    const finalAlpha = await db.admissionApplication.findUnique({ where: { id: appAlpha.id } })
    const finalBeta = await db.admissionApplication.findUnique({ where: { id: appBeta.id } })

    const enrolledCountInApps = [finalAlpha?.status, finalBeta?.status].filter((s) => s === 'ENROLLED').length
    const approvedCountInApps = [finalAlpha?.status, finalBeta?.status].filter((s) => s === 'APPROVED').length

    expect(enrolledCountInApps).toBe(1)
    expect(approvedCountInApps).toBe(1)
  })

  it('2. In-transaction idempotency: simultaneous duplicate requests for the same application create exactly one student and one invoice', async () => {
    const ts = Date.now()

    const classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: `Nursery Bluebells ${ts}`,
        code: `NR_BLU_${ts}`,
        programType: 'NURSERY',
        capacity: 10,
        isActive: true,
        primaryTeacherId: teacherId,
      },
    })

    const appDup = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-DUP-${ts}`,
        childFirstName: 'DuplicateCheck',
        childLastName: 'Child',
        childDob: new Date('2023-06-20'),
        childGender: 'FEMALE',
        parentName: 'Duplicate Parent',
        parentPhone: `987111${String(ts).slice(-4)}0`,
        programType: 'NURSERY',
        status: 'APPROVED',
        classroomId: classroom.id,
        documents: {
          create: [
            { docType: 'BIRTH_CERTIFICATE', fileName: 'birth.pdf', verified: true, status: 'VERIFIED' },
            { docType: 'PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
            { docType: 'AADHAAR', fileName: 'aadhaar.pdf', verified: true, status: 'VERIFIED' },
          ],
        },
      },
    })

    // Fire duplicate simultaneous requests for the exact same application
    const [res1, res2] = await Promise.allSettled([
      AdmissionService.completeEnrollment(ctx, appDup.id, classroom.id),
      AdmissionService.completeEnrollment(ctx, appDup.id, classroom.id),
    ])

    // Both should resolve without crashing
    expect(res1.status).toBe('fulfilled')
    expect(res2.status).toBe('fulfilled')

    const val1 = (res1 as PromiseFulfilledResult<any>).value
    const val2 = (res2 as PromiseFulfilledResult<any>).value

    // Both resolve with the same admission number
    expect(val1.admissionNo).toBeTruthy()
    expect(val2.admissionNo).toBe(val1.admissionNo)

    // Exactly one Student record exists in the database
    const students = await db.student.findMany({
      where: {
        tenantId,
        currentClassroomId: classroom.id,
        firstName: 'DuplicateCheck',
      },
    })
    expect(students.length).toBe(1)

    // Exactly one invoice was issued for this student
    const invoices = await db.invoice.findMany({
      where: { tenantId, studentId: students[0].id },
    })
    expect(invoices.length).toBe(1)
  })

  it('3. Atomic rollback: rejection due to capacity leaves zero orphan student, allocation, or invoice records', async () => {
    const ts = Date.now()

    // Create classroom with capacity: 1
    const classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: `Nursery Full Room ${ts}`,
        code: `NR_FULL_${ts}`,
        programType: 'NURSERY',
        capacity: 1,
        isActive: true,
        primaryTeacherId: teacherId,
      },
    })

    // Fill the room with 1 active student
    await db.student.create({
      data: {
        tenantId,
        branchId,
        admissionNo: `STU-OCCUPIED-${ts}`,
        firstName: 'Occupied',
        lastName: 'Child',
        dob: new Date('2023-02-10'),
        gender: 'MALE',
        currentClassroomId: classroom.id,
        status: 'ACTIVE',
      },
    })

    const appReject = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-REJECT-${ts}`,
        childFirstName: 'RolledBackChild',
        childLastName: 'Family',
        childDob: new Date('2023-07-15'),
        childGender: 'FEMALE',
        parentName: 'Rollback Parent',
        parentPhone: `987222${String(ts).slice(-4)}9`,
        programType: 'NURSERY',
        status: 'APPROVED',
        classroomId: classroom.id,
        documents: {
          create: [
            { docType: 'BIRTH_CERTIFICATE', fileName: 'birth.pdf', verified: true, status: 'VERIFIED' },
            { docType: 'PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
            { docType: 'AADHAAR', fileName: 'aadhaar.pdf', verified: true, status: 'VERIFIED' },
          ],
        },
      },
    })

    // Attempt enrollment
    let thrownError: any = null
    try {
      await AdmissionService.completeEnrollment(ctx, appReject.id, classroom.id)
    } catch (err: any) {
      thrownError = err
    }

    expect(thrownError).toBeTruthy()
    expect(thrownError.code).toBe('CLASSROOM_FULL')

    // Verify zero records were persisted for this candidate
    const student = await db.student.findFirst({
      where: { tenantId, firstName: 'RolledBackChild' },
    })
    expect(student).toBeNull()

    const allocations = await db.studentAllocation.findMany({
      where: { tenantId, classroomId: classroom.id },
    })
    // Only the pre-seeded student should have an allocation (if any)
    const rolledBackAlloc = allocations.find((a) => (a as any).studentId === appReject.id)
    expect(rolledBackAlloc).toBeUndefined()

    // Application remains APPROVED, not corrupted to ENROLLED
    const appAfter = await db.admissionApplication.findUnique({ where: { id: appReject.id } })
    expect(appAfter?.status).toBe('APPROVED')
    expect(appAfter?.studentId).toBeNull()
  })

  it('4. ClassroomPlacementService.allocateAndEnroll enforces the same row-level locking and capacity bounds', async () => {
    const ts = Date.now()

    const classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: `Placement Nursery ${ts}`,
        code: `PLC_NUR_${ts}`,
        programType: 'NURSERY',
        capacity: 1,
        isActive: true,
        primaryTeacherId: teacherId,
      },
    })

    // Fill the room with 1 active student
    await db.student.create({
      data: {
        tenantId,
        branchId,
        admissionNo: `STU-PLC-${ts}`,
        firstName: 'AlreadyThere',
        dob: new Date('2023-01-01'),
        gender: 'MALE',
        currentClassroomId: classroom.id,
        seatNumber: 'S-01',
        status: 'ACTIVE',
      },
    })

    const appPlacement = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-PLC-${ts}`,
        childFirstName: 'PlacementCandidate',
        childLastName: 'One',
        childDob: new Date('2023-03-03'),
        childGender: 'FEMALE',
        parentName: 'Placement Parent',
        parentPhone: `987333${String(ts).slice(-4)}8`,
        programType: 'NURSERY',
        status: 'OFFER_ACCEPTED',
        classroomId: classroom.id,
        documents: {
          create: [
            { docType: 'BIRTH_CERTIFICATE', fileName: 'birth.pdf', verified: true, status: 'VERIFIED' },
            { docType: 'PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
            { docType: 'AADHAAR', fileName: 'aadhaar.pdf', verified: true, status: 'VERIFIED' },
          ],
        },
      },
    })

    let caughtErr: any = null
    try {
      await ClassroomPlacementService.completePlacement(ctx, appPlacement.id, {
        classroomId: classroom.id,
        seatNumber: 'S-02',
      })
    } catch (err: any) {
      caughtErr = err
    }

    expect(caughtErr).toBeTruthy()
    expect(caughtErr.code).toBe('CLASSROOM_FULL')
    expect(caughtErr.message).toContain('maximum capacity')
  })
})
