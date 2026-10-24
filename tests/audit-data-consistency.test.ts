import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { FamilyUserService } from '@/lib/users/family-user-service'
import { StudentService } from '@/lib/students/student-service'
import { signSession } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { GET as getStudents } from '@/app/api/v1/students/route'
import { GET as getFamilyGroups } from '@/app/api/v1/users/family-groups/route'
import { GET as getHouseholdFamily } from '@/app/api/v1/users/[id]/family/route'

describe('PreOne Integration Audit: Actual Record Consistency Proof', () => {
  const ts = Date.now()
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB1: any
  let sessionA: any
  let classroomA1: any
  let inactiveClassroom: any

  let ownerUserA: any
  let staffBranchA1: any
  let ownerTokenA: string
  let staffTokenA1: string

  // Recorded entities across paths
  let appA: any
  let studentA: any
  let parentUserA: any
  let guardianA: any
  let sgLinkA: any
  let allocationA: any

  let studentB: any
  let studentBId: string
  let familyUserBResult: any

  beforeAll(async () => {
    tenantA = await db.tenant.create({
      data: { name: `Audit School A (${ts})`, code: `TA${ts.toString().slice(-6)}` },
    })
    branchA1 = await db.branch.create({
      data: { tenantId: tenantA.id, name: 'Main Campus A1', code: `A1${ts.toString().slice(-4)}`, isMain: true },
    })
    branchA2 = await db.branch.create({
      data: { tenantId: tenantA.id, name: 'West Campus A2', code: `A2${ts.toString().slice(-4)}`, isMain: false },
    })
    tenantB = await db.tenant.create({
      data: { name: `Audit School B (${ts})`, code: `TB${ts.toString().slice(-6)}` },
    })
    branchB1 = await db.branch.create({
      data: { tenantId: tenantB.id, name: 'Campus B1', code: `B1${ts.toString().slice(-4)}`, isMain: true },
    })

    sessionA = await db.academicSession.create({
      data: {
        tenantId: tenantA.id,
        name: `AY 2026-2027 (${ts})`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })

    const programA = await db.program.create({
      data: {
        tenantId: tenantA.id,
        name: 'Nursery',
        code: `NUR_${ts.toString().slice(-4)}`,
        programType: 'NURSERY',
        ageMinMonths: 36,
        ageMaxMonths: 60,
        isActive: true,
      },
    })

    classroomA1 = await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicSessionId: sessionA.id,
        programId: programA.id,
        name: 'Nursery Blue',
        code: `NUR-${ts.toString().slice(-4)}`,
        programType: 'NURSERY',
        capacity: 25,
        isActive: true,
      },
    })

    inactiveClassroom = await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicSessionId: sessionA.id,
        programId: programA.id,
        name: 'Nursery Inactive',
        code: `INA-${ts.toString().slice(-4)}`,
        programType: 'NURSERY',
        capacity: 10,
        isActive: false,
      },
    })

    ownerUserA = await db.user.create({
      data: {
        fullName: 'Owner Auditor A',
        email: `owner.audit.${ts}@school.test`,
        passwordHash: 'dummy-hash',
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'OWNER',
            roles: ['OWNER'],
            status: 'ACTIVE',
          },
        },
      },
    })
    ownerTokenA = await signSession({
      uid: ownerUserA.id,
      email: ownerUserA.email!,
      name: ownerUserA.fullName,
      tenantId: tenantA.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    staffBranchA1 = await db.user.create({
      data: {
        fullName: 'Staff Branch A1',
        email: `staff.a1.${ts}@school.test`,
        passwordHash: 'dummy-hash',
        memberships: {
          create: {
            tenantId: tenantA.id,
            branchId: branchA1.id,
            role: 'STAFF',
            roles: ['STAFF'],
            status: 'ACTIVE',
          },
        },
      },
    })
    staffTokenA1 = await signSession({
      uid: staffBranchA1.id,
      email: staffBranchA1.email!,
      name: staffBranchA1.fullName,
      tenantId: tenantA.id,
      branchId: branchA1.id,
      role: 'STAFF',
      roles: ['STAFF'],
    })
  })

  // -------------------------------------------------------------
  // Path A & C
  // -------------------------------------------------------------
  it('Path A & C: Admission Approval -> Student Module -> Family Directory & Parent/User Linking', async () => {
    const appNumber = `APP-2026-${ts.toString().slice(-4)}`
    appA = await db.admissionApplication.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicSessionId: sessionA.id,
        applicationNumber: appNumber,
        childFirstName: 'Aarav',
        childLastName: 'Sharma',
        childDob: new Date('2022-08-15'),
        childGender: 'MALE',
        parentName: 'Rohit Sharma',
        parentPhone: `+919811${ts.toString().slice(-6)}`,
        parentEmail: `rohit.sharma.${ts}@audit.test`,
        programType: 'NURSERY',
        classroomId: classroomA1.id,
        status: 'APPROVED',
      },
    })

    const enrollResultA = await AdmissionService.completeEnrollment(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicYearId: sessionA.id,
        actorId: ownerUserA.id,
        actorName: ownerUserA.fullName,
        actorRole: 'OWNER',
      },
      appA.id,
      classroomA1.id
    )

    studentA = await db.student.findUnique({
      where: { id: enrollResultA.student.id },
      include: {
        currentClassroom: true,
        allocations: true,
        guardians: { include: { guardian: { include: { user: { include: { memberships: true } } } } } },
      },
    })

    const updatedApp = await db.admissionApplication.findUnique({ where: { id: appA.id } })
    sgLinkA = studentA?.guardians[0]
    guardianA = sgLinkA?.guardian
    parentUserA = guardianA?.user
    const parentMembership = parentUserA?.memberships.find((m: any) => m.tenantId === tenantA.id)
    allocationA = studentA?.allocations[0]

    // Database Assertions
    expect(studentA).toBeDefined()
    expect(studentA.admissionNo).toMatch(/^STU-2026-\d{4}$/)
    expect(studentA.status).toBe('ACTIVE')
    expect(studentA.currentClassroomId).toBe(classroomA1.id)
    expect(studentA.branchId).toBe(branchA1.id)
    expect(studentA.tenantId).toBe(tenantA.id)

    expect(updatedApp?.status).toBe('ENROLLED')
    expect(updatedApp?.studentId).toBe(studentA.id)
    expect(updatedApp?.classroomId).toBe(classroomA1.id)

    expect(parentUserA).toBeDefined()
    expect(parentUserA.status).toBe('PENDING')
    expect(parentMembership?.role).toBe('PARENT')
    expect(parentMembership?.status).toBe('PENDING')

    expect(guardianA).toBeDefined()
    expect(guardianA.userId).toBe(parentUserA.id)
    expect(guardianA.tenantId).toBe(tenantA.id)
    expect(guardianA.phone).toBe(appA.parentPhone)

    expect(sgLinkA).toBeDefined()
    expect(sgLinkA.studentId).toBe(studentA.id)
    expect(sgLinkA.guardianId).toBe(guardianA.id)
    expect(sgLinkA.isPrimary).toBe(true)
    expect(sgLinkA.canPickup).toBe(true)
    expect(sgLinkA.isFeePayer).toBe(true)

    expect(allocationA).toBeDefined()
    expect(allocationA.studentId).toBe(studentA.id)
    expect(allocationA.classroomId).toBe(classroomA1.id)
    expect(allocationA.status).toBe('ACTIVE')

    // API Assertions: Student Module GET /api/v1/students
    const reqStudent = new NextRequest(`http://localhost:3000/api/v1/students?search=Aarav`, {
      headers: { authorization: `Bearer ${ownerTokenA}` },
    })
    const resStudent = await getStudents(reqStudent)
    expect(resStudent.status).toBe(200)
    const jsonStudent = await resStudent.json()
    const foundStudent = jsonStudent.data?.find((s: any) => s.id === studentA.id)
    expect(foundStudent).toBeDefined()
    expect(foundStudent.admissionNo).toBe(studentA.admissionNo)
    expect(foundStudent.classroom?.id).toBe(classroomA1.id)

    // API Assertions: Family Household GET /api/v1/users/[id]/family
    const reqHousehold = new NextRequest(`http://localhost:3000/api/v1/users/${parentUserA.id}/family`, {
      headers: { authorization: `Bearer ${ownerTokenA}` },
    })
    const resHousehold = await getHouseholdFamily(reqHousehold, { params: Promise.resolve({ id: parentUserA.id }) })
    expect(resHousehold.status).toBe(200)
    const jsonHousehold = await resHousehold.json()
    console.log('JSON HOUSEHOLD:', JSON.stringify(jsonHousehold))
    const householdData = jsonHousehold.data || jsonHousehold
    const householdStudent = householdData.household?.students?.find((s: any) => s.id === studentA.id)
    expect(householdStudent).toBeDefined()
    expect(householdStudent.name).toBe('Aarav Sharma')
    expect(householdStudent.admissionNo).toBe(studentA.admissionNo)
  })

  // -------------------------------------------------------------
  // Path B: Family Creates Student -> Students Module
  // -------------------------------------------------------------
  it('Path B: Family Creates Student -> Students Module with Direct Enrollment Lifecycle', async () => {
    familyUserBResult = await FamilyUserService.createFamilyUser(
      {
        tenantId: tenantA.id,
        actorId: ownerUserA.id,
        actorName: ownerUserA.fullName,
        actorRole: 'OWNER',
      },
      {
        role: 'PARENT',
        fullName: 'Vikram Malhotra',
        email: `vikram.malhotra.${ts}@audit.test`,
        phone: `+919822${ts.toString().slice(-6)}`,
        relationship: 'FATHER',
        isPrimaryContact: true,
        childMode: 'CREATE',
        newChild: {
          firstName: 'Ananya',
          lastName: 'Malhotra',
          dob: new Date('2022-09-10'),
          gender: 'FEMALE',
          programType: 'NURSERY',
          branchId: branchA1.id,
          classroomId: classroomA1.id,
        },
      }
    )

    studentBId = (familyUserBResult as any).student?.id || (familyUserBResult as any).id
    studentB = await db.student.findUnique({
      where: { id: studentBId },
      include: {
        currentClassroom: true,
        allocations: true,
        guardians: { include: { guardian: { include: { user: { include: { memberships: true } } } } } },
      },
    })

    // Check AdmissionApplication record does NOT exist (Direct Enrollment)
    const appB = await db.admissionApplication.findFirst({
      where: { studentId: studentBId },
    })

    expect(studentB).toBeDefined()
    expect(studentB.admissionNo).toMatch(/^STU-2026-\d{4}$/)
    expect(studentB.status).toBe('ACTIVE')
    expect(studentB.admissionDate).toBeDefined()
    expect(studentB.currentClassroomId).toBe(classroomA1.id)
    expect(appB).toBeNull() // Confirmed: Direct enrollment bypasses AdmissionApplication by design

    // Student Module API Check
    const reqStudentB = new NextRequest(`http://localhost:3000/api/v1/students?search=Ananya`, {
      headers: { authorization: `Bearer ${ownerTokenA}` },
    })
    const resStudentB = await getStudents(reqStudentB)
    expect(resStudentB.status).toBe(200)
    const jsonStudentB = await resStudentB.json()
    const foundB = jsonStudentB.data?.find((s: any) => s.id === studentBId)
    expect(foundB).toBeDefined()
    expect(foundB.admissionNo).toBe(studentB.admissionNo)
  })

  // -------------------------------------------------------------
  // Path D: Family Creates Parent/Guardian -> Link Existing & Sibling
  // -------------------------------------------------------------
  it('Path D: Links Caregiver to Existing Student & Clusters Siblings', async () => {
    // 1. Add Mother to Ananya (Existing Student)
    const motherResult = await FamilyUserService.createFamilyUser(
      {
        tenantId: tenantA.id,
        actorId: ownerUserA.id,
        actorName: ownerUserA.fullName,
        actorRole: 'OWNER',
      },
      {
        role: 'PARENT',
        fullName: 'Pooja Malhotra',
        email: `pooja.malhotra.${ts}@audit.test`,
        phone: `+919833${ts.toString().slice(-6)}`,
        relationship: 'MOTHER',
        isPrimaryContact: false,
        childMode: 'EXISTING',
        existingChild: { studentId: studentBId },
      }
    )
    expect(motherResult).toBeDefined()

    // 2. Link second child (Aarav) to Vikram Malhotra (Father)
    const linkSibling = await FamilyUserService.linkStudentToGuardian(
      {
        tenantId: tenantA.id,
        actorId: ownerUserA.id,
        actorName: ownerUserA.fullName,
        actorRole: 'OWNER',
      },
      {
        userId: familyUserBResult.user?.id,
        studentId: studentA.id,
        relationship: 'LEGAL_GUARDIAN',
      }
    )
    expect(linkSibling.student.id).toBe(studentA.id)

    // Household API: Verify both children clustered
    const reqHousehold = new NextRequest(`http://localhost:3000/api/v1/users/${familyUserBResult.user?.id}/family`, {
      headers: { authorization: `Bearer ${ownerTokenA}` },
    })
    const resHousehold = await getHouseholdFamily(reqHousehold, { params: Promise.resolve({ id: familyUserBResult.user?.id }) })
    expect(resHousehold.status).toBe(200)
    const jsonHousehold = await resHousehold.json()
    const householdData = jsonHousehold.data || jsonHousehold
    const students = householdData.household?.students || []
    expect(students.length).toBe(2)
    const studentIds = students.map((s: any) => s.id)
    expect(studentIds).toContain(studentBId)
    expect(studentIds).toContain(studentA.id)
  })

  // -------------------------------------------------------------
  // Setup, Duplicates, and Security Validations
  // -------------------------------------------------------------
  it('Validates Setup Rejection, Duplicate Enrollment, Max 2 Parents, and Isolation', async () => {
    // 1. Inactive Classroom Rejection
    await expect(
      StudentService.createStudent(
        { tenantId: tenantA.id, branchId: branchA1.id, actorId: ownerUserA.id },
        {
          firstName: 'InactiveFail',
          dob: new Date('2022-01-01'),
          gender: 'MALE',
          guardianName: 'Parent',
          guardianPhone: '+919844111111',
          classroomId: inactiveClassroom.id,
        }
      )
    ).rejects.toThrow('Selected classroom not found or inactive')

    // 2. Duplicate Enrollment Idempotency
    const reEnroll = await AdmissionService.completeEnrollment(
      {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicYearId: sessionA.id,
        actorId: ownerUserA.id,
      },
      appA.id,
      classroomA1.id
    )
    expect(reEnroll.isAlreadyEnrolled).toBe(true)
    expect(reEnroll.student.id).toBe(studentA.id)

    // 3. Max 2 Parents Rule
    // Ananya has Vikram (FATHER) and Pooja (MOTHER). Third PARENT must fail.
    await expect(
      FamilyUserService.createFamilyUser(
        { tenantId: tenantA.id, actorId: ownerUserA.id },
        {
          role: 'PARENT',
          fullName: 'Third Parent',
          phone: `+919855${ts.toString().slice(-6)}`,
          relationship: 'FATHER',
          childMode: 'EXISTING',
          existingChild: { studentId: studentBId },
        }
      )
    ).rejects.toThrow('already has 2 registered Parent accounts')

    // Adding as GUARDIAN succeeds
    const thirdCaregiver = await FamilyUserService.createFamilyUser(
      { tenantId: tenantA.id, actorId: ownerUserA.id },
      {
        role: 'GUARDIAN',
        fullName: 'Grandmother Malhotra',
        phone: `+919866${ts.toString().slice(-6)}`,
        relationship: 'GRANDPARENT',
        childMode: 'EXISTING',
        existingChild: { studentId: studentBId },
      }
    )
    expect(thirdCaregiver.guardian).toBeDefined()

    // 4. Cross-Branch Isolation for Branch-Scoped Staff
    const studentA2 = await StudentService.createStudent(
      { tenantId: tenantA.id, branchId: branchA2.id, actorId: ownerUserA.id },
      {
        firstName: 'BranchTwoChild',
        dob: new Date('2022-01-01'),
        gender: 'FEMALE',
        branchId: branchA2.id,
        guardianName: 'Branch Two Guardian',
        guardianPhone: `+919877${ts.toString().slice(-6)}`,
      }
    )

    await expect(
      FamilyUserService.linkStudentToGuardian(
        {
          tenantId: tenantA.id,
          actorId: staffBranchA1.id,
          actorRole: 'STAFF',
          actorBranchId: branchA1.id,
        },
        {
          guardianId: thirdCaregiver.guardian?.id,
          studentId: studentA2.id,
        }
      )
    ).rejects.toThrow('Cannot link student belonging to another campus branch')

    // 5. Cross-Tenant Isolation
    await expect(
      FamilyUserService.linkStudentToGuardian(
        { tenantId: tenantB.id, actorId: ownerUserA.id, actorRole: 'OWNER' },
        {
          guardianId: thirdCaregiver.guardian?.id,
          studentId: studentA.id,
        }
      )
    ).rejects.toThrow()
  })
})
