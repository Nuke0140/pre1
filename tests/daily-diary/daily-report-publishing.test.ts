import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

describe('Daily Diary: 1-Tap Review & Send Daily Reports to Parents Test Suite', () => {
  let tenant: any
  let branch: any
  let academicSession: any
  let teacherUser1: any
  let teacherUser2: any
  let adminUser: any
  let parentUser1: any
  let parentUser2: any
  let classroom1: any
  let classroom2: any
  let student1: any
  let student2: any
  let student3: any
  let guardian1: any
  let guardian2: any

  const testDate = '2026-10-22'

  beforeEach(async () => {
    // 1. Setup tenant & branch
    tenant = await db.tenant.upsert({
      where: { code: 'REPORT-TEST-TENANT' },
      create: {
        code: 'REPORT-TEST-TENANT',
        name: 'Report Publishing Preschool',
        status: 'ACTIVE',
      },
      update: {},
    })

    branch = await db.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'REPORT-MAIN',
        },
      },
      create: {
        tenantId: tenant.id,
        code: 'REPORT-MAIN',
        name: 'Main Campus',
        isActive: true,
      },
      update: {},
    })

    academicSession = await db.academicSession.findFirst({
      where: { tenantId: tenant.id },
    })

    if (!academicSession) {
      academicSession = await db.academicSession.create({
        data: {
          tenantId: tenant.id,
          name: '2026-2027 Academic Year',
          startDate: new Date('2026-06-01T00:00:00.000Z'),
          endDate: new Date('2027-05-31T23:59:59.999Z'),
          isCurrent: true,
          status: 'ACTIVE',
        },
      })
    }

    // 2. Setup teachers & admin
    teacherUser1 = await db.user.upsert({
      where: { email: 'teacher1.report@preone.test' },
      create: {
        email: 'teacher1.report@preone.test',
        fullName: 'Teacher Nandini',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'TEACHER',
          },
        },
      },
      update: {},
    })

    teacherUser2 = await db.user.upsert({
      where: { email: 'teacher2.report@preone.test' },
      create: {
        email: 'teacher2.report@preone.test',
        fullName: 'Teacher Manish',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'TEACHER',
          },
        },
      },
      update: {},
    })

    adminUser = await db.user.upsert({
      where: { email: 'admin.report@preone.test' },
      create: {
        email: 'admin.report@preone.test',
        fullName: 'Principal Sangeeta',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'PRINCIPAL',
          },
        },
      },
      update: {},
    })

    // 3. Setup parent portal users
    parentUser1 = await db.user.upsert({
      where: { email: 'parent1.report@preone.test' },
      create: {
        email: 'parent1.report@preone.test',
        fullName: 'Parent Rajesh Sharma',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'PARENT',
          },
        },
      },
      update: {},
    })

    parentUser2 = await db.user.upsert({
      where: { email: 'parent2.report@preone.test' },
      create: {
        email: 'parent2.report@preone.test',
        fullName: 'Parent Sunita Roy',
        passwordHash: 'dummy-hash',
        status: 'ACTIVE',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'PARENT',
          },
        },
      },
      update: {},
    })

    // 4. Setup classrooms
    classroom1 = await db.classroom.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'REP-CLS-1',
        },
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        primaryTeacherId: teacherUser1.id,
        name: 'Little Stars Playgroup',
        code: 'REP-CLS-1',
        programType: 'PLAYGROUP',
        capacity: 20,
      },
      update: {
        primaryTeacherId: teacherUser1.id,
      },
    })

    classroom2 = await db.classroom.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'REP-CLS-2',
        },
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        primaryTeacherId: teacherUser2.id,
        name: 'Rising Sun Nursery',
        code: 'REP-CLS-2',
        programType: 'NURSERY',
        capacity: 20,
      },
      update: {
        primaryTeacherId: teacherUser2.id,
      },
    })

    // 5. Setup students
    student1 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'REP-STU-01' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'REP-STU-01',
        firstName: 'Ananya',
        lastName: 'Sharma',
        gender: 'FEMALE',
        dob: new Date('2023-04-10'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: { currentClassroomId: classroom1.id },
    })

    student2 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'REP-STU-02' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'REP-STU-02',
        firstName: 'Kabir',
        lastName: 'Roy',
        gender: 'MALE',
        dob: new Date('2023-06-15'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: { currentClassroomId: classroom1.id },
    })

    student3 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'REP-STU-03' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'REP-STU-03',
        firstName: 'Dev',
        lastName: 'Patel',
        gender: 'MALE',
        dob: new Date('2023-08-20'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: { currentClassroomId: classroom1.id },
    })

    // 6. Setup Guardians & StudentGuardian links
    guardian1 = await db.guardian.upsert({
      where: { userId: parentUser1.id },
      create: {
        tenantId: tenant.id,
        fullName: 'Rajesh Sharma',
        relationship: 'FATHER',
        phone: '+919876543210',
        email: 'parent1.report@preone.test',
        userId: parentUser1.id,
      },
      update: { userId: parentUser1.id },
    })

    guardian2 = await db.guardian.upsert({
      where: { userId: parentUser2.id },
      create: {
        tenantId: tenant.id,
        fullName: 'Sunita Roy',
        relationship: 'MOTHER',
        phone: '+919876543211',
        email: 'parent2.report@preone.test',
        userId: parentUser2.id,
      },
      update: { userId: parentUser2.id },
    })

    // Link student1 -> guardian1 (receivesComm = true)
    await db.studentGuardian.upsert({
      where: { studentId_guardianId: { studentId: student1.id, guardianId: guardian1.id } },
      create: {
        studentId: student1.id,
        guardianId: guardian1.id,
        relationship: 'FATHER',
        receivesComm: true,
      },
      update: { receivesComm: true },
    })

    // Link student2 -> guardian2 (receivesComm = true)
    await db.studentGuardian.upsert({
      where: { studentId_guardianId: { studentId: student2.id, guardianId: guardian2.id } },
      create: {
        studentId: student2.id,
        guardianId: guardian2.id,
        relationship: 'MOTHER',
        receivesComm: true,
      },
      update: { receivesComm: true },
    })

    // student3 intentionally has NO guardian link to test readiness rules!

    // Clean up test data for date
    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)
    await db.dailyReport.deleteMany({ where: { tenantId: tenant.id } })
    await db.attendance.deleteMany({ where: { tenantId: tenant.id } })
    await db.classroomActivity.deleteMany({ where: { tenantId: tenant.id } })
    await db.timelineEntry.deleteMany({ where: { tenantId: tenant.id } })
    await db.observation.deleteMany({ where: { tenantId: tenant.id } })
  })

  it('1. Calculates accurate report readiness metrics and identifies missing requirements', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)

    // Mark attendance for student1 (PRESENT) and student2 (ABSENT)
    await db.attendance.createMany({
      data: [
        {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: academicSession.id,
          classroomId: classroom1.id,
          studentId: student1.id,
          date: targetDateObj,
          status: 'PRESENT',
        },
        {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: academicSession.id,
          classroomId: classroom1.id,
          studentId: student2.id,
          date: targetDateObj,
          status: 'ABSENT',
        },
      ],
    })
    // student3 attendance is UNMARKED and has NO guardian

    const readiness = await DailyDiaryService.getEndOfDayReadiness(teacherSession, classroom1.id, testDate)

    expect(readiness.classroomName).toBe('Little Stars Playgroup')
    expect(readiness.stats.totalEligible).toBe(3)
    // student1 and student2 have attendance marked & linked guardians -> READY (2)
    expect(readiness.stats.readyCount).toBe(2)
    // student3 has missing attendance and missing guardian -> NEEDS_REVIEW (1)
    expect(readiness.stats.needsReviewCount).toBe(1)
    expect(readiness.stats.publishedCount).toBe(0)
    expect(readiness.stats.canPublish).toBe(true)

    const s3 = readiness.students.find((s) => s.studentId === student3.id)
    expect(s3?.status).toBe('NEEDS_REVIEW')
    expect(s3?.issues).toContain('Attendance not marked')
    expect(s3?.issues).toContain('No authorized guardian with communication enabled')
  })

  it('2. Compiles complete child daily report preview using actual saved data without faking missing values', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)

    // 1. Attendance
    await db.attendance.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        classroomId: classroom1.id,
        studentId: student1.id,
        date: targetDateObj,
        status: 'PRESENT',
      },
    })

    // 2. Classroom Activities
    await db.classroomActivity.create({
      data: {
        tenantId: tenant.id,
        academicSessionId: academicSession.id,
        classroomId: classroom1.id,
        teacherId: teacherUser1.id,
        title: 'Sensory Sand Alphabet',
        activityType: 'PLAY',
        activityDate: targetDateObj,
        startTime: '10:00',
        endTime: '10:45',
        status: 'COMPLETED',
        actualOutcome: 'Traced letters A & B in sand with tactile enthusiasm',
      },
    })

    // 3. Meals & Naps
    await db.timelineEntry.createMany({
      data: [
        {
          tenantId: tenant.id,
          studentId: student1.id,
          classroomId: classroom1.id,
          type: 'MEAL',
          title: 'Fruit Snack',
          body: 'Ate All sliced apples',
          createdAt: new Date(`${testDate}T10:30:00.000Z`),
        },
        {
          tenantId: tenant.id,
          studentId: student1.id,
          classroomId: classroom1.id,
          type: 'NAP',
          title: 'Afternoon Rest',
          body: 'Slept peacefully for 1 hour 15 mins',
          createdAt: new Date(`${testDate}T13:00:00.000Z`),
        },
      ],
    })

    // 4. Learning Observation
    await db.observation.create({
      data: {
        tenantId: tenant.id,
        studentId: student1.id,
        classroomId: classroom1.id,
        category: 'Social-Emotional',
        narrative: 'Ananya shared her wooden blocks with Kabir during free play time.',
        concern: 'NORMAL',
        observedAt: new Date(`${testDate}T11:00:00.000Z`),
      },
    })

    const review = await DailyDiaryService.getReportsForReview(teacherSession, classroom1.id, testDate)

    const r1 = review.reports.find((r) => r.studentId === student1.id)
    expect(r1).toBeDefined()
    expect(r1?.attendanceStatus).toBe('PRESENT')
    expect(r1?.activities).toHaveLength(1)
    expect(r1?.activities[0].title).toBe('Sensory Sand Alphabet')
    expect(r1?.meals).toHaveLength(1)
    expect(r1?.meals[0].title).toBe('Fruit Snack')
    expect(r1?.meals[0].intake).toBe('Ate All sliced apples')
    expect(r1?.naps).toHaveLength(1)
    expect(r1?.naps[0].details).toBe('Slept peacefully for 1 hour 15 mins')
    expect(r1?.observations).toHaveLength(1)
    expect(r1?.observations[0].narrative).toContain('shared her wooden blocks')
    expect(r1?.guardians).toHaveLength(1)
    expect(r1?.guardians[0].fullName).toBe('Rajesh Sharma')
  })

  it('3. One child’s report never leaks into another child’s report', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)

    // Log meal for student1 ONLY
    await db.timelineEntry.create({
      data: {
        tenantId: tenant.id,
        studentId: student1.id,
        classroomId: classroom1.id,
        type: 'MEAL',
        title: 'Student 1 Breakfast',
        body: 'Ate All',
        createdAt: new Date(`${testDate}T09:00:00.000Z`),
      },
    })

    // Log observation for student2 ONLY
    await db.observation.create({
      data: {
        tenantId: tenant.id,
        studentId: student2.id,
        classroomId: classroom1.id,
        category: 'Cognitive',
        narrative: 'Kabir counted 5 yellow buttons independently.',
        concern: 'NORMAL',
        observedAt: new Date(`${testDate}T10:00:00.000Z`),
      },
    })

    const review = await DailyDiaryService.getReportsForReview(teacherSession, classroom1.id, testDate)

    const r1 = review.reports.find((r) => r.studentId === student1.id)
    const r2 = review.reports.find((r) => r.studentId === student2.id)

    // Student 1 has meal, NO observation
    expect(r1?.meals).toHaveLength(1)
    expect(r1?.meals[0].title).toBe('Student 1 Breakfast')
    expect(r1?.observations).toHaveLength(0)

    // Student 2 has observation, NO meal
    expect(r2?.meals).toHaveLength(0)
    expect(r2?.observations).toHaveLength(1)
    expect(r2?.observations[0].narrative).toContain('Kabir counted 5 yellow buttons')
  })

  it('4. 1-Tap bulk publishing publishes ready reports, creates DailyReport records, and skips unready children safely', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)

    // Attendance marked for student1 (PRESENT) and student2 (ABSENT)
    await db.attendance.createMany({
      data: [
        {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: academicSession.id,
          classroomId: classroom1.id,
          studentId: student1.id,
          date: targetDateObj,
          status: 'PRESENT',
        },
        {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: academicSession.id,
          classroomId: classroom1.id,
          studentId: student2.id,
          date: targetDateObj,
          status: 'ABSENT',
        },
      ],
    })
    // student3 attendance UNMARKED

    const result = await DailyDiaryService.publishDailyReports(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
      summaryOverrides: {
        [student1.id]: 'Ananya was very energetic and cheerful all morning!',
      },
    })

    expect(result.success).toBe(true)
    expect(result.publishedCount).toBe(2)
    expect(result.skippedCount).toBe(1) // student3 skipped due to unmarked attendance

    // Check database records
    const publishedReports = await db.dailyReport.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        reportDate: targetDateObj,
        status: 'PUBLISHED',
      },
    })

    expect(publishedReports).toHaveLength(2)

    const rep1 = publishedReports.find((r) => r.studentId === student1.id)
    expect(rep1).toBeDefined()
    expect(rep1?.status).toBe('PUBLISHED')
    expect(rep1?.attendanceStatus).toBe('PRESENT')
    expect(rep1?.summaryText).toBe('Ananya was very energetic and cheerful all morning!')
    expect(rep1?.parentRecipientsCount).toBe(1)
    expect(rep1?.publishedBy).toBe(teacherUser1.id)

    const rep2 = publishedReports.find((r) => r.studentId === student2.id)
    expect(rep2).toBeDefined()
    expect(rep2?.attendanceStatus).toBe('ABSENT')

    // Verify timeline entry note created for parent
    const timelineNotes = await db.timelineEntry.findMany({
      where: {
        tenantId: tenant.id,
        type: 'NOTE',
        title: 'Daily Report Published',
      },
    })
    expect(timelineNotes.length).toBeGreaterThanOrEqual(1)
  })

  it('5. Duplicate submission idempotency: Repeated clicks do not create duplicate reports', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)

    await db.attendance.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        classroomId: classroom1.id,
        studentId: student1.id,
        date: targetDateObj,
        status: 'PRESENT',
      },
    })

    // First publish call
    const res1 = await DailyDiaryService.publishDailyReports(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
    })
    expect(res1.publishedCount).toBe(1)

    // Second publish call (simulate rapid button click or retry)
    const res2 = await DailyDiaryService.publishDailyReports(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
    })
    expect(res2.publishedCount).toBe(1)

    // Total database records for student1 on testDate MUST be exactly 1
    const totalReports = await db.dailyReport.findMany({
      where: {
        tenantId: tenant.id,
        studentId: student1.id,
        reportDate: targetDateObj,
      },
    })
    expect(totalReports).toHaveLength(1)
  })

  it('6. Parents can access ONLY reports for their authorized linked children', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const targetDateObj = new Date(testDate)
    targetDateObj.setUTCHours(0, 0, 0, 0)

    await db.attendance.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        classroomId: classroom1.id,
        studentId: student1.id,
        date: targetDateObj,
        status: 'PRESENT',
      },
    })

    // Publish report for student1
    await DailyDiaryService.publishDailyReports(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
      summaryOverrides: {
        [student1.id]: 'Ananya enjoyed painting today.',
      },
    })

    // Authorized parent (Rajesh Sharma, linked to student1)
    const parent1Session = {
      uid: parentUser1.id,
      role: 'PARENT',
      tenantId: tenant.id,
    }

    const parentReport = await DailyDiaryService.getParentDailyReport(parent1Session, student1.id, testDate)
    expect(parentReport.published).toBe(true)
    expect(parentReport.report?.student?.id).toBe(student1.id)
    expect(parentReport.report?.summaryText).toBe('Ananya enjoyed painting today.')

    // Unauthorized parent (Sunita Roy is linked to student2, NOT student1)
    const parent2Session = {
      uid: parentUser2.id,
      role: 'PARENT',
      tenantId: tenant.id,
    }

    expect(
      DailyDiaryService.getParentDailyReport(parent2Session, student1.id, testDate)
    ).rejects.toThrow('FORBIDDEN_GUARDIAN_ACCESS')
  })

  it('7. Teachers cannot publish or review reports outside their authorized classroom scope', async () => {
    // teacherUser1 is assigned to classroom1, NOT classroom2
    const teacher1Session = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    expect(
      DailyDiaryService.getEndOfDayReadiness(teacher1Session, classroom2.id, testDate)
    ).rejects.toThrow('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')

    expect(
      DailyDiaryService.getReportsForReview(teacher1Session, classroom2.id, testDate)
    ).rejects.toThrow('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')

    expect(
      DailyDiaryService.publishDailyReports(teacher1Session, {
        classroomId: classroom2.id,
        dateStr: testDate,
      })
    ).rejects.toThrow('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')
  })
})
