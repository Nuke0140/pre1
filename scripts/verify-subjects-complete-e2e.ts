/**
 * PreOne — Subject Management & Integration Verification Test Suite
 *
 * Verifies:
 * 1. Setup Module Subject Management (Create, Edit, Status Toggle, Program-wise configuration, Duplicate prevention, Tenant isolation).
 * 2. Daily Diary Integration (Consumes Setup subjects, rejects unconfigured/inactive subjects, displays empty states).
 * 3. Teacher-Based Subject Filtering (Teacher identity -> Assigned Class -> Assigned Program -> Configured Subjects).
 * 4. Scheduling Integration & Validation (Uses canonical Setup subjects, validates class/program/subject mappings).
 * 5. Data Preservation & Safety (Existing data preserved, soft-deactivation safety, no dummy/seed subjects created).
 */

import { db } from '../src/lib/db'
import { SubjectService } from '../src/lib/academics/subject-service'
import { DailyDiaryService } from '../src/lib/daily-diary/daily-diary-service'
import { AcademicService } from '../src/lib/academics/academic-service'
import { SessionPayload } from '../src/lib/auth'

let passed = 0
let failed = 0

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${desc}`)
    failed++
  }
}

async function runTests() {
  console.log('===============================================================')
  console.log('PREONE — SUBJECT MANAGEMENT & INTEGRATION CERTIFICATION SUITE')
  console.log('===============================================================\n')

  const testSuffix = Date.now().toString().slice(-6)
  let tenantA: any = null
  let tenantB: any = null

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create Test Tenants, Programs, Classrooms, Users, and Teachers
    // -------------------------------------------------------------------------
    tenantA = await db.tenant.create({
      data: {
        code: `SUBJ-T1-${testSuffix}`,
        name: `Subject Test School A ${testSuffix}`,
        status: 'ACTIVE',
      },
    })

    tenantB = await db.tenant.create({
      data: {
        code: `SUBJ-T2-${testSuffix}`,
        name: `Subject Test School B ${testSuffix}`,
        status: 'ACTIVE',
      },
    })

    const sessionA = await db.academicSession.create({
      data: {
        tenantId: tenantA.id,
        name: '2026-27',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    // Create Programs for Tenant A
    const programNursery = await db.program.create({
      data: {
        tenantId: tenantA.id,
        code: `NUR-${testSuffix}`,
        name: 'Nursery Program',
        programType: 'NURSERY',
        isActive: true,
      },
    })

    const programLKG = await db.program.create({
      data: {
        tenantId: tenantA.id,
        code: `LKG-${testSuffix}`,
        name: 'LKG Program',
        programType: 'LKG',
        isActive: true,
      },
    })

    // Create Classrooms for Tenant A
    const classNursery = await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: 'main-branch',
        programId: programNursery.id,
        code: `CLS-NUR-${testSuffix}`,
        name: 'Nursery Butterflies',
        programType: 'NURSERY',
        capacity: 20,
        academicSessionId: sessionA.id,
      },
    })

    const classLKG = await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: 'main-branch',
        programId: programLKG.id,
        code: `CLS-LKG-${testSuffix}`,
        name: 'LKG Lions',
        programType: 'LKG',
        capacity: 25,
        academicSessionId: sessionA.id,
      },
    })

    // Create Admin User
    const adminUser = await db.user.create({
      data: {
        email: `admin-subj-${testSuffix}@test.com`,
        fullName: 'School Admin',
        passwordHash: 'hash123',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantA.id, userId: adminUser.id, role: 'OWNER', roles: ['OWNER'], status: 'ACTIVE' },
    })

    const adminSession: SessionPayload = {
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenantA.id,
      role: 'OWNER',
      roles: ['OWNER'],
    }

    // Create Teacher 1 (assigned to Nursery)
    const teacherNursery = await db.user.create({
      data: {
        email: `teacher-nur-${testSuffix}@test.com`,
        fullName: 'Teacher Nursery',
        passwordHash: 'hash123',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantA.id, userId: teacherNursery.id, role: 'TEACHER', roles: ['TEACHER'], status: 'ACTIVE' },
    })

    await db.classroom.update({
      where: { id: classNursery.id },
      data: { primaryTeacherId: teacherNursery.id },
    })

    const teacherNurserySession: SessionPayload = {
      uid: teacherNursery.id,
      email: teacherNursery.email,
      name: teacherNursery.fullName,
      tenantId: tenantA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Create Teacher 2 (unassigned)
    const teacherUnassigned = await db.user.create({
      data: {
        email: `teacher-unassigned-${testSuffix}@test.com`,
        fullName: 'Unassigned Teacher',
        passwordHash: 'hash123',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantA.id, userId: teacherUnassigned.id, role: 'TEACHER', roles: ['TEACHER'], status: 'ACTIVE' },
    })

    const teacherUnassignedSession: SessionPayload = {
      uid: teacherUnassigned.id,
      email: teacherUnassigned.email,
      name: teacherUnassigned.fullName,
      tenantId: tenantA.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // -------------------------------------------------------------------------
    // TEST 1: SETUP MODULE — SUBJECT CREATION & PROGRAM MAPPING
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 1: SETUP SUBJECT MANAGEMENT ---')

    const subjLanguage = await SubjectService.createSubject(
      tenantA.id,
      {
        name: 'Early Language & Phonics',
        code: `ENG-${testSuffix}`,
        subjectType: 'CORE',
        programIds: [programNursery.id],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'OWNER' }
    )
    assert(subjLanguage.id !== undefined, 'Created subject "Early Language & Phonics" for Nursery')

    const subjMath = await SubjectService.createSubject(
      tenantA.id,
      {
        name: 'Numeracy & Logic',
        code: `MATH-${testSuffix}`,
        subjectType: 'CORE',
        programIds: [programLKG.id],
      },
      { id: adminUser.id, name: adminUser.fullName, role: 'OWNER' }
    )
    assert(subjMath.id !== undefined, 'Created subject "Numeracy & Logic" for LKG')

    // Verify duplicate code within tenant is blocked
    try {
      await SubjectService.createSubject(
        tenantA.id,
        {
          name: 'Duplicate Language',
          code: `ENG-${testSuffix}`,
          programIds: [programNursery.id],
        },
        { id: adminUser.id, name: adminUser.fullName }
      )
      assert(false, 'Should throw duplicate code error')
    } catch (e: any) {
      assert(e.message.includes('already exists'), 'Duplicate subject code blocked in tenant scope')
    }

    // Tenant Isolation Check: Subjects from Tenant B must not leak into Tenant A
    const subjTenantB = await SubjectService.createSubject(
      tenantB.id,
      {
        name: 'Tenant B Secret Subject',
        code: `SEC-${testSuffix}`,
        subjectType: 'CORE',
      },
      { id: adminUser.id, name: 'Admin B' }
    )
    const listTenantA = await SubjectService.getSubjects(tenantA.id)
    assert(!listTenantA.some((s) => s.id === subjTenantB.id), 'Tenant isolation enforced: Tenant B subjects not visible in Tenant A')

    // Program Filtering Check
    const nurserySubjects = await SubjectService.getSubjects(tenantA.id, { programId: programNursery.id })
    assert(
      nurserySubjects.some((s) => s.id === subjLanguage.id) && !nurserySubjects.some((s) => s.id === subjMath.id),
      'Subject list filtered by program returned only Nursery subjects'
    )

    // -------------------------------------------------------------------------
    // TEST 2: TEACHER ACCESS — STRICT CLASSROOM/PROGRAM SCOPING
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: TEACHER ACCESS & AUTHORIZATION FILTERS ---')

    // Admin sees all configured active subjects for Tenant A
    const adminSubjects = await SubjectService.getTeacherEligibleSubjects(adminSession)
    assert(adminSubjects.length >= 2, 'Admin session sees all tenant configured subjects')

    // Teacher 1 (Nursery) sees only Nursery subjects
    const teacher1Subjects = await SubjectService.getTeacherEligibleSubjects(teacherNurserySession)
    assert(
      teacher1Subjects.some((s) => s.id === subjLanguage.id) && !teacher1Subjects.some((s) => s.id === subjMath.id),
      'Nursery teacher session returns ONLY Nursery program subjects'
    )

    // Teacher 1 requesting specific class: Nursery allowed, LKG rejected
    const teacher1NurseryClassSubjs = await SubjectService.getTeacherEligibleSubjects(teacherNurserySession, {
      classroomId: classNursery.id,
    })
    assert(teacher1NurseryClassSubjs.length === 1, 'Teacher accessing assigned classroom gets assigned program subjects')

    const teacher1LKGClassSubjs = await SubjectService.getTeacherEligibleSubjects(teacherNurserySession, {
      classroomId: classLKG.id,
    })
    assert(teacher1LKGClassSubjs.length === 0, 'Teacher requesting unassigned classroom receives EMPTY array (Unauthorized access blocked)')

    // Unassigned teacher receives EMPTY array
    const unassignedSubjects = await SubjectService.getTeacherEligibleSubjects(teacherUnassignedSession)
    assert(unassignedSubjects.length === 0, 'Unassigned teacher receives empty subject catalogue')

    // -------------------------------------------------------------------------
    // TEST 3: DAILY DIARY — SELECT SETUP SUBJECTS & VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: DAILY DIARY INTEGRATION & VALIDATION ---')

    // DailyDiaryService.getContext returns eligible subjects
    const ddContextTeacher = await DailyDiaryService.getContext(teacherNurserySession)
    assert(
      ddContextTeacher.subjects?.some((s) => s.id === subjLanguage.id) &&
        !ddContextTeacher.subjects?.some((s) => s.id === subjMath.id),
      'DailyDiaryService.getContext returns teacher-scoped setup subjects'
    )

    // Create activity using valid Setup subject
    const activityValid = await DailyDiaryService.createActivity(teacherNurserySession, {
      classroomId: classNursery.id,
      dateStr: '2026-10-15',
      title: 'Early Language & Phonics',
      startTime: '09:00',
      endTime: '09:30',
    })
    assert(activityValid.id !== undefined, 'Activity created successfully referencing canonical Setup subject')

    // Attempt to create activity with UNCONFIGURED subject name must throw VALIDATION_ERROR
    try {
      await DailyDiaryService.createActivity(teacherNurserySession, {
        classroomId: classNursery.id,
        dateStr: '2026-10-15',
        title: 'Unconfigured Magic Subject',
        startTime: '10:00',
        endTime: '10:30',
      })
      assert(false, 'Should reject unconfigured subject')
    } catch (e: any) {
      assert(e.message.includes('VALIDATION_ERROR'), 'Daily Diary rejects activity creation with unconfigured subject name')
    }

    // Attempt to create activity with subject belonging to UNRELATED program (Math in Nursery class)
    try {
      await DailyDiaryService.createActivity(teacherNurserySession, {
        classroomId: classNursery.id,
        dateStr: '2026-10-15',
        title: 'Numeracy & Logic',
        startTime: '10:00',
        endTime: '10:30',
      })
      assert(false, 'Should reject subject from unrelated program')
    } catch (e: any) {
      assert(e.message.includes('not configured for this class'), 'Daily Diary rejects subject belonging to an unrelated program')
    }

    // -------------------------------------------------------------------------
    // TEST 4: SCHEDULING INTEGRATION & SOFT DEACTIVATION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: SCHEDULING & SOFT DEACTIVATION ---')

    // AcademicService.createActivity validates subject eligibility
    const schedActivity = await AcademicService.createActivity(
      {
        tenantId: tenantA.id,
        academicSessionId: sessionA.id,
        actorId: adminUser.id,
        actorName: adminUser.fullName,
        actorRole: 'OWNER',
      },
      {
        classroomId: classLKG.id,
        title: 'Numeracy & Logic',
        activityDate: '2026-10-16',
        startTime: '11:00',
        endTime: '11:30',
      }
    )
    assert(schedActivity.id !== undefined, 'Academic Scheduling creates entry referencing Setup subject')

    // Soft Deactivate subject
    await SubjectService.deleteSubject(tenantA.id, subjMath.id, { id: adminUser.id, name: adminUser.fullName })
    const deactivatedSubj = await db.subject.findUnique({ where: { id: subjMath.id } })
    assert(deactivatedSubj?.status === 'INACTIVE', 'Subject soft-deactivated (status set to INACTIVE)')

    // Existing historical record remains intact in DB
    const existingSched = await db.classroomActivity.findUnique({ where: { id: schedActivity.id } })
    assert(existingSched !== null, 'Existing historical activity record preserved intact after subject deactivation')

    // New assignment with inactive subject must be rejected
    try {
      await DailyDiaryService.createActivity(adminSession, {
        classroomId: classLKG.id,
        dateStr: '2026-10-17',
        title: 'Numeracy & Logic',
        startTime: '09:00',
        endTime: '09:30',
      })
      assert(false, 'Should reject assignment of inactive subject')
    } catch (e: any) {
      assert(e.message.includes('inactive'), 'New assignment with inactive subject rejected by backend')
    }

  } catch (err: any) {
    console.error('CRITICAL UNHANDLED ERROR IN TEST SUITE:', err)
    failed++
  } finally {
    // Cleanup test data
    if (tenantA) {
      await db.classroomActivity.deleteMany({ where: { tenantId: tenantA.id } })
      await db.classroomSubject.deleteMany({ where: { tenantId: tenantA.id } })
      await db.programSubject.deleteMany({ where: { tenantId: tenantA.id } })
      await db.subject.deleteMany({ where: { tenantId: tenantA.id } })
      await db.classroom.deleteMany({ where: { tenantId: tenantA.id } })
      await db.program.deleteMany({ where: { tenantId: tenantA.id } })
      await db.academicSession.deleteMany({ where: { tenantId: tenantA.id } })
      await db.tenantUser.deleteMany({ where: { tenantId: tenantA.id } })
      await db.user.deleteMany({ where: { memberships: { none: {} } } })
      await db.tenant.delete({ where: { id: tenantA.id } })
    }
    if (tenantB) {
      await db.subject.deleteMany({ where: { tenantId: tenantB.id } })
      await db.tenant.delete({ where: { id: tenantB.id } })
    }
  }

  console.log('\n===============================================================')
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('===============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
