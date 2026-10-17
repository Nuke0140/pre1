import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

describe('Daily Diary: Copy Yesterday’s Routine & Weekly Theme Templates Test Suite', () => {
  let tenant: any
  let branch: any
  let academicSession: any
  let teacherUser1: any
  let teacherUser2: any
  let adminUser: any
  let classroom1: any
  let classroom2: any
  let student1: any

  const sourceDate = '2026-10-20'
  const targetDate = '2026-10-21'

  beforeEach(async () => {
    // 1. Setup tenant & branch
    tenant = await db.tenant.upsert({
      where: { code: 'ROUTINE-REUSE-TEST' },
      create: {
        code: 'ROUTINE-REUSE-TEST',
        name: 'Routine Reuse Preschool',
        status: 'ACTIVE',
      },
      update: {},
    })

    branch = await db.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'ROUTINE-MAIN',
        },
      },
      create: {
        tenantId: tenant.id,
        code: 'ROUTINE-MAIN',
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

    // 2. Setup users
    teacherUser1 = await db.user.upsert({
      where: { email: 'teacher1.routine@preone.test' },
      create: {
        email: 'teacher1.routine@preone.test',
        fullName: 'Teacher Ananya',
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
      where: { email: 'teacher2.routine@preone.test' },
      create: {
        email: 'teacher2.routine@preone.test',
        fullName: 'Teacher Rohan',
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
      where: { email: 'admin.routine@preone.test' },
      create: {
        email: 'admin.routine@preone.test',
        fullName: 'Admin Principal',
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

    // 3. Setup classrooms
    classroom1 = await db.classroom.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'ROUTINE-CLS-1',
        },
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        primaryTeacherId: teacherUser1.id,
        name: 'Butterflies Pre-K',
        code: 'ROUTINE-CLS-1',
        programType: 'NURSERY',
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
          code: 'ROUTINE-CLS-2',
        },
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        primaryTeacherId: teacherUser2.id,
        name: 'Sunflowers Toddler',
        code: 'ROUTINE-CLS-2',
        programType: 'PLAYGROUP',
        capacity: 15,
      },
      update: {
        primaryTeacherId: teacherUser2.id,
      },
    })

    // 4. Setup student
    student1 = await db.student.upsert({
      where: {
        tenantId_admissionNo: {
          tenantId: tenant.id,
          admissionNo: 'ROUTINE-STU-01',
        },
      },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'ROUTINE-STU-01',
        firstName: 'Vivaan',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: new Date('2023-03-15'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: {
        currentClassroomId: classroom1.id,
      },
    })

    // Clean up activities and timeline entries in test tenant
    await db.classroomActivity.deleteMany({
      where: { tenantId: tenant.id },
    })
    await db.timelineEntry.deleteMany({
      where: { tenantId: tenant.id },
    })
  })

  it('1. Copies previous day routine within 14-day window and strips actual outcomes', async () => {
    const adminSession = {
      uid: adminUser.id,
      role: 'ADMIN',
      tenantId: tenant.id,
    }

    // Seed previous day schedule on sourceDate (2026-10-20)
    const prevDate = new Date(`${sourceDate}T00:00:00.000Z`)
    await db.classroomActivity.createMany({
      data: [
        {
          tenantId: tenant.id,
          academicSessionId: academicSession.id,
          classroomId: classroom1.id,
          teacherId: teacherUser1.id,
          title: 'Circle Time & Rhymes',
          activityType: 'CIRCLE_TIME',
          activityDate: prevDate,
          startTime: '09:00',
          endTime: '09:30',
          durationMinutes: 30,
          description: 'Good morning song, calendar review, action rhymes',
          status: 'COMPLETED',
          actualOutcome: 'All children participated enthusiastically and sang along.',
        },
        {
          tenantId: tenant.id,
          academicSessionId: academicSession.id,
          classroomId: classroom1.id,
          teacherId: teacherUser1.id,
          title: 'Phonics Letter Sounds',
          activityType: 'CORE_SUBJECT',
          activityDate: prevDate,
          startTime: '09:30',
          endTime: '10:15',
          durationMinutes: 45,
          description: 'Letter B sound tracing and flashcard identification',
          status: 'COMPLETED',
          actualOutcome: 'Vivaan identified letter B correctly.',
        },
      ],
    })

    // Seed attendance and meal logs on sourceDate to verify they are NEVER copied
    await db.timelineEntry.create({
      data: {
        tenantId: tenant.id,
        studentId: student1.id,
        type: 'MEAL',
        title: 'Morning Snack',
        body: 'Ate All sliced apples',
        createdAt: new Date(`${sourceDate}T10:30:00.000Z`),
      },
    })

    // Fetch previous routine for classroom1 targeting targetDate (2026-10-21)
    const result = await DailyDiaryService.getPreviousDayRoutine(adminSession, classroom1.id, targetDate)

    expect(result.hasPreviousRoutine).toBe(true)
    expect(result.sourceDate).toBe(sourceDate)
    expect(result.activityCount).toBe(2)
    expect(result.activities).toHaveLength(2)

    // Verify activity metadata preserved
    const [act1, act2] = result.activities
    expect(act1.title).toBe('Circle Time & Rhymes')
    expect(act1.startTime).toBe('09:00')
    expect(act1.endTime).toBe('09:30')
    expect(act1.activityType).toBe('CIRCLE_TIME')

    expect(act2.title).toBe('Phonics Letter Sounds')
    expect(act2.startTime).toBe('09:30')
    expect(act2.endTime).toBe('10:15')

    // Invariant: Actual outcomes and past execution statuses must NOT be carried over
    expect((act1 as any).actualOutcome).toBeUndefined()
    expect((act1 as any).status).toBeUndefined()
  })

  it('2. Loads weekly theme templates from database and auto-seeds standard themes if empty', async () => {
    const adminSession = {
      uid: adminUser.id,
      role: 'ADMIN',
      tenantId: tenant.id,
    }

    // Clean up any templates for this tenant
    await db.weeklyThemeTemplate.deleteMany({
      where: { tenantId: tenant.id },
    })

    const templates = await DailyDiaryService.getWeeklyThemeTemplates(adminSession)
    expect(templates.length).toBeGreaterThanOrEqual(4)

    const phonicsTemplate = templates.find((t) => t.theme === 'Early Literacy')
    expect(phonicsTemplate).toBeDefined()
    expect(phonicsTemplate?.name).toContain('Phonics & Early Literacy')
    expect(Array.isArray(phonicsTemplate?.activities)).toBe(true)
    expect((phonicsTemplate?.activities as any[]).length).toBeGreaterThanOrEqual(5)

    const colorsTemplate = templates.find((t) => t.theme === 'Sensory & Art')
    expect(colorsTemplate).toBeDefined()
  })

  it('3. Applies routine to target day with status PLANNED and actualOutcome null', async () => {
    const teacherSession = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    const payload = {
      classroomId: classroom1.id,
      targetDateStr: targetDate,
      sourceType: 'PREVIOUS_DAY' as const,
      sourceName: 'Copied from yesterday',
      activities: [
        {
          title: 'Sensory Sand Play',
          activityType: 'PLAY',
          startTime: '10:00',
          endTime: '10:45',
          durationMinutes: 45,
          description: 'Exploring colored kinetic sand and molding shapes',
        },
        {
          title: 'Music & Movement',
          activityType: 'PLAY',
          startTime: '10:45',
          endTime: '11:15',
          durationMinutes: 30,
          description: 'Rhythm sticks and freeze dance game',
        },
      ],
    }

    const res = await DailyDiaryService.applyRoutineOrTemplate(teacherSession, payload)

    expect(res.success).toBe(true)
    expect(res.conflict).toBe(false)
    expect(res.count).toBe(2)

    // Inspect database records for targetDate
    const targetDateObj = new Date(`${targetDate}T00:00:00.000Z`)
    const saved = await db.classroomActivity.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        activityDate: targetDateObj,
      },
      orderBy: { startTime: 'asc' },
    })

    expect(saved).toHaveLength(2)
    for (const act of saved) {
      expect(act.status).toBe('PLANNED')
      expect(act.actualOutcome).toBeNull()
      expect(act.classroomId).toBe(classroom1.id)
    }
  })

  it('4. Triggers conflict alert when target day already has planned activities and requires confirmation', async () => {
    const adminSession = {
      uid: adminUser.id,
      role: 'ADMIN',
      tenantId: tenant.id,
    }

    // Seed an existing activity on targetDate
    const targetDateObj = new Date(`${targetDate}T00:00:00.000Z`)
    await db.classroomActivity.create({
      data: {
        tenantId: tenant.id,
        academicSessionId: academicSession.id,
        classroomId: classroom1.id,
        teacherId: teacherUser1.id,
        title: 'Morning Yoga & Stretch',
        activityType: 'PLAY',
        activityDate: targetDateObj,
        startTime: '08:45',
        endTime: '09:15',
        status: 'PLANNED',
      },
    })

    // Attempt to apply without replaceExisting
    const conflictResult = await DailyDiaryService.applyRoutineOrTemplate(adminSession, {
      classroomId: classroom1.id,
      targetDateStr: targetDate,
      replaceExisting: false,
      activities: [
        {
          title: 'Math Number Counting',
          activityType: 'CORE_SUBJECT',
          startTime: '09:30',
          endTime: '10:15',
        },
      ],
    })

    expect(conflictResult.conflict).toBe(true)
    expect(conflictResult.existingCount).toBe(1)
    expect(conflictResult.message).toContain('already has 1 planned activity')

    // Now re-apply with replaceExisting: true
    const replaceResult = await DailyDiaryService.applyRoutineOrTemplate(adminSession, {
      classroomId: classroom1.id,
      targetDateStr: targetDate,
      replaceExisting: true,
      activities: [
        {
          title: 'Math Number Counting',
          activityType: 'CORE_SUBJECT',
          startTime: '09:30',
          endTime: '10:15',
        },
      ],
    })

    expect(replaceResult.success).toBe(true)
    expect(replaceResult.conflict).toBe(false)
    expect(replaceResult.count).toBe(1)

    // Verify existing was soft-deleted and new one is active
    const activeActivities = await db.classroomActivity.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        activityDate: targetDateObj,
        deletedAt: null,
      },
    })
    expect(activeActivities).toHaveLength(1)
    expect(activeActivities[0].title).toBe('Math Number Counting')
  })

  it('5. Returns hasPreviousRoutine: false and recommends templates when no prior routine within 14 days', async () => {
    const adminSession = {
      uid: adminUser.id,
      role: 'ADMIN',
      tenantId: tenant.id,
    }

    // Classroom2 has no activities seeded
    const result = await DailyDiaryService.getPreviousDayRoutine(adminSession, classroom2.id, targetDate)

    expect(result.hasPreviousRoutine).toBe(false)
    expect(result.suggestTemplates).toBe(true)
    expect(result.activities).toHaveLength(0)
    expect(result.message).toContain('No previous planned routine found')
  })

  it('6. Enforces teacher classroom scoping RBAC', async () => {
    // teacherUser1 is assigned to classroom1, NOT classroom2
    const teacher1Session = {
      uid: teacherUser1.id,
      role: 'TEACHER',
      tenantId: tenant.id,
    }

    // Attempting to get previous routine for classroom2 should fail with forbidden
    expect(
      DailyDiaryService.getPreviousDayRoutine(teacher1Session, classroom2.id, targetDate)
    ).rejects.toThrow('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')

    // Attempting to apply routine to classroom2 should also fail
    expect(
      DailyDiaryService.applyRoutineOrTemplate(teacher1Session, {
        classroomId: classroom2.id,
        targetDateStr: targetDate,
        activities: [{ title: 'Unauthorized Activity' }],
      })
    ).rejects.toThrow('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')
  })

  it('7. Day stream reflects newly copied routine as PLANNED badge events', async () => {
    const adminSession = {
      uid: adminUser.id,
      role: 'ADMIN',
      tenantId: tenant.id,
    }

    // Apply template routine
    await DailyDiaryService.applyRoutineOrTemplate(adminSession, {
      classroomId: classroom1.id,
      targetDateStr: targetDate,
      replaceExisting: true,
      activities: [
        {
          title: 'Circle Time & Weather Chart',
          activityType: 'CIRCLE_TIME',
          startTime: '09:00',
          endTime: '09:30',
        },
      ],
    })

    // Fetch Day Stream
    const stream = await DailyDiaryService.getDayStream(adminSession, classroom1.id, targetDate)

    expect(stream).toBeDefined()
    expect(stream.stats.plannedEvents).toBeGreaterThanOrEqual(1)

    const circleTimeEvent = stream.events.find((e: any) => e.title === 'Circle Time & Weather Chart')
    expect(circleTimeEvent).toBeDefined()
    expect(circleTimeEvent.status).toBe('PLANNED')
    expect(circleTimeEvent.badge.label).toBe('PLANNED')
  })
})
