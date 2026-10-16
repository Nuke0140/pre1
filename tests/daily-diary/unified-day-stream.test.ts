import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'
import { isoDate } from '@/lib/format'

describe('Daily Diary: Unified Classroom Day Stream Test Suite', () => {
  let tenant: any
  let branch: any
  let academicSession: any
  let teacherUser1: any
  let teacherUser2: any
  let adminUser: any
  let classroom1: any
  let classroom2: any
  let student1: any
  let student2: any
  const testDate = '2026-10-20'

  beforeEach(async () => {
    // 1. Setup tenant & branch
    tenant = await db.tenant.upsert({
      where: { code: 'DAY-STREAM-TEST' },
      create: {
        code: 'DAY-STREAM-TEST',
        name: 'Day Stream Academy',
        status: 'ACTIVE',
      },
      update: {},
    })

    branch = await db.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'STREAM-MAIN',
        },
      },
      create: {
        tenantId: tenant.id,
        code: 'STREAM-MAIN',
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

    // 2. Setup users: Teacher 1, Teacher 2, Admin
    teacherUser1 = await db.user.upsert({
      where: { email: 'teacher1@stream.test' },
      create: {
        email: 'teacher1@stream.test',
        fullName: 'Teacher Anita Sharma',
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
      where: { email: 'teacher2@stream.test' },
      create: {
        email: 'teacher2@stream.test',
        fullName: 'Teacher Rohit Verma',
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
      where: { email: 'admin@stream.test' },
      create: {
        email: 'admin@stream.test',
        fullName: 'Principal Meera Joshi',
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

    // 3. Setup classrooms: Classroom 1 assigned to Teacher 1, Classroom 2 to Teacher 2
    classroom1 = await db.classroom.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'TS-01' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Toddler Sunshine',
        code: 'TS-01',
        programType: 'NURSERY',
        capacity: 20,
        primaryTeacherId: teacherUser1.id,
      },
      update: {
        primaryTeacherId: teacherUser1.id,
      },
    })

    classroom2 = await db.classroom.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'PS-02' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Playgroup Stars',
        code: 'PS-02',
        programType: 'PLAYGROUP',
        capacity: 20,
        primaryTeacherId: teacherUser2.id,
      },
      update: {
        primaryTeacherId: teacherUser2.id,
      },
    })

    // 4. Setup students in classroom 1
    student1 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'STRM-001' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'STRM-001',
        firstName: 'Aarav',
        lastName: 'Patel',
        gender: 'MALE',
        dob: new Date('2023-04-10'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: {
        currentClassroomId: classroom1.id,
      },
    })

    student2 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'STRM-002' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'STRM-002',
        firstName: 'Diya',
        lastName: 'Menon',
        gender: 'FEMALE',
        dob: new Date('2023-06-15'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: {
        currentClassroomId: classroom1.id,
      },
    })

    // 5. Setup subjects for classroom 1
    const sub1 = await db.subject.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-CIRCLE' } },
      create: {
        tenantId: tenant.id,
        code: 'SUB-CIRCLE',
        name: 'Circle Time & Rhymes',
        subjectType: 'CORE',
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE' },
    })

    const sub2 = await db.subject.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-SENSORY' } },
      create: {
        tenantId: tenant.id,
        code: 'SUB-SENSORY',
        name: 'Sensory Sand Play',
        subjectType: 'ACTIVITY',
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE' },
    })

    const sub3 = await db.subject.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-PHONICS' } },
      create: {
        tenantId: tenant.id,
        code: 'SUB-PHONICS',
        name: 'Early Literacy Phonics',
        subjectType: 'CORE',
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE' },
    })

    await db.classroomSubject.upsert({
      where: { classroomId_subjectId: { classroomId: classroom1.id, subjectId: sub1.id } },
      create: { tenantId: tenant.id, classroomId: classroom1.id, subjectId: sub1.id },
      update: {},
    })

    await db.classroomSubject.upsert({
      where: { classroomId_subjectId: { classroomId: classroom1.id, subjectId: sub2.id } },
      create: { tenantId: tenant.id, classroomId: classroom1.id, subjectId: sub2.id },
      update: {},
    })

    await db.classroomSubject.upsert({
      where: { classroomId_subjectId: { classroomId: classroom1.id, subjectId: sub3.id } },
      create: { tenantId: tenant.id, classroomId: classroom1.id, subjectId: sub3.id },
      update: {},
    })

    // Clean up test records for testDate
    const { startOfDay, endOfDay, dateOnly } = {
      startOfDay: new Date(`${testDate}T00:00:00.000Z`),
      endOfDay: new Date(`${testDate}T23:59:59.999Z`),
      dateOnly: new Date(testDate),
    }
    dateOnly.setUTCHours(0, 0, 0, 0)

    await db.attendance.deleteMany({
      where: { classroomId: classroom1.id, date: dateOnly },
    })
    await db.classroomActivity.deleteMany({
      where: { classroomId: classroom1.id, activityDate: { gte: startOfDay, lte: endOfDay } },
    })
    await db.observation.deleteMany({
      where: { classroomId: classroom1.id, observedAt: { gte: startOfDay, lte: endOfDay } },
    })
    await db.timelineEntry.deleteMany({
      where: { tenantId: tenant.id, createdAt: { gte: startOfDay, lte: endOfDay } },
    })
  })

  it('1. Strict Chronological Event Sorting: Orders multiple event types chronologically', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // A. Create planned activities at 09:45 AM and 11:15 AM
    await DailyDiaryService.createActivity(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
      title: 'Circle Time & Rhymes',
      activityType: 'CIRCLE_TIME',
      startTime: '09:45',
      endTime: '10:15',
    })

    await DailyDiaryService.createActivity(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
      title: 'Sensory Sand Play',
      activityType: 'ACTIVITY',
      startTime: '11:15',
      endTime: '12:00',
    })

    // B. Quick Log a Meal at 10:30 AM
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '10:30',
      type: 'MEAL',
      mealName: 'Fruit Snack',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All', notes: 'Loved the bananas' },
        { studentId: student2.id, intake: 'Ate Half', notes: 'Left papayas' },
      ],
    })

    // C. Quick Log a Nap at 12:30 PM (12:30)
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      type: 'NAP',
      startTime: '12:30',
      endTime: '14:00',
      napEntries: [
        { studentId: student1.id, napStatus: 'Slept Well' },
        { studentId: student2.id, napStatus: 'Rested Quietly' },
      ],
    })

    // D. Fetch Day Stream
    const stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)

    expect(stream).toBeDefined()
    expect(stream.events.length).toBeGreaterThanOrEqual(4)

    // Verify events are sorted in ascending sortMinutes order
    for (let i = 0; i < stream.events.length - 1; i++) {
      expect(stream.events[i].sortMinutes).toBeLessThanOrEqual(stream.events[i + 1].sortMinutes)
    }

    // Verify expected titles in chronological sequence:
    // 09:00 AM: Morning Arrival & Attendance (540 min)
    // 09:45 AM: Circle Time & Rhymes (585 min)
    // 10:30 AM: Fruit Snack (630 min)
    // 11:15 AM: Sensory Sand Play (675 min)
    // 12:30 PM: Nap & Rest Time (750 min)
    const titles = stream.events.map((e) => e.title)
    expect(titles).toContain('Morning Arrival & Attendance')
    expect(titles).toContain('Circle Time & Rhymes')
    expect(titles).toContain('Fruit Snack')
    expect(titles).toContain('Sensory Sand Play')
    expect(titles).toContain('Nap & Rest Time')

    const attendanceIdx = titles.indexOf('Morning Arrival & Attendance')
    const circleTimeIdx = titles.indexOf('Circle Time & Rhymes')
    const fruitSnackIdx = titles.indexOf('Fruit Snack')
    const sensoryPlayIdx = titles.indexOf('Sensory Sand Play')
    const napIdx = titles.indexOf('Nap & Rest Time')

    expect(attendanceIdx).toBeLessThan(circleTimeIdx)
    expect(circleTimeIdx).toBeLessThan(fruitSnackIdx)
    expect(fruitSnackIdx).toBeLessThan(sensoryPlayIdx)
    expect(sensoryPlayIdx).toBeLessThan(napIdx)
  })

  it('2. Attendance Summary & Unmarked Calculation', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Initially unmarked
    let stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)
    const initialAttendance = stream.events.find((e) => e.streamType === 'ATTENDANCE')
    expect(initialAttendance).toBeDefined()
    expect(initialAttendance?.attendanceStats?.total).toBe(2)
    expect(initialAttendance?.attendanceStats?.unmarked).toBe(2)
    expect(initialAttendance?.status).toBe('PENDING')

    // Mark 1 PRESENT, 1 ABSENT
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      type: 'ATTENDANCE',
      students: [
        { studentId: student1.id, status: 'PRESENT', notes: 'On time' },
        { studentId: student2.id, status: 'ABSENT', notes: 'Mild fever' },
      ],
    })

    stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)
    const updatedAttendance = stream.events.find((e) => e.streamType === 'ATTENDANCE')
    expect(updatedAttendance).toBeDefined()
    expect(updatedAttendance?.attendanceStats?.present).toBe(1)
    expect(updatedAttendance?.attendanceStats?.absent).toBe(1)
    expect(updatedAttendance?.attendanceStats?.unmarked).toBe(0)
    expect(updatedAttendance?.status).toBe('COMPLETED')
  })

  it('3. Meal Intake Aggregation: Combines multiple children intakes into summary string', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '10:30',
      type: 'MEAL',
      mealName: 'Midday Fruit Snack',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All', notes: 'Finished everything' },
        { studentId: student2.id, intake: 'Ate Half', notes: 'Had some apples' },
      ],
    })

    const stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)
    const mealEvent = stream.events.find((e) => e.streamType === 'MEAL' && e.title === 'Midday Fruit Snack')
    expect(mealEvent).toBeDefined()
    expect(mealEvent?.consumptionStats?.total).toBe(2)
    expect(mealEvent?.consumptionStats?.ateAll).toBe(1)
    expect(mealEvent?.consumptionStats?.ateHalf).toBe(1)
    expect(mealEvent?.summary).toContain('1 Ate All')
    expect(mealEvent?.summary).toContain('1 Ate Half')
  })

  it('4. Role-Based Scoping: Teacher cannot access unassigned classroom; Admin can access all', async () => {
    const teacher1Session: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    const adminSession: any = {
      uid: adminUser.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: adminUser.fullName,
      email: adminUser.email,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    }

    // Teacher 1 accessing Classroom 1 -> OK
    const t1Res = await DailyDiaryService.getDayStream(teacher1Session, classroom1.id, testDate)
    expect(t1Res.classroom.id).toBe(classroom1.id)

    // Teacher 1 accessing Classroom 2 (assigned to Teacher 2) -> Throws FORBIDDEN
    let forbiddenCaught = false
    try {
      await DailyDiaryService.getDayStream(teacher1Session, classroom2.id, testDate)
    } catch (err: any) {
      if (err.message.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
        forbiddenCaught = true
      }
    }
    expect(forbiddenCaught).toBe(true)

    // Admin accessing Classroom 1 and Classroom 2 -> Both OK
    const adminRes1 = await DailyDiaryService.getDayStream(adminSession, classroom1.id, testDate)
    const adminRes2 = await DailyDiaryService.getDayStream(adminSession, classroom2.id, testDate)
    expect(adminRes1.classroom.id).toBe(classroom1.id)
    expect(adminRes2.classroom.id).toBe(classroom2.id)
  })

  it('5. Observation and Incident Stream Logging', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Add observation
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      type: 'OBSERVATION',
      studentId: student1.id,
      narrative: 'Aarav independently sorted geometric shapes by color and size.',
      category: 'Cognitive',
      concern: 'NORMAL',
    })

    // Add incident
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '11:45',
      type: 'INCIDENT',
      studentId: student2.id,
      title: 'Minor Knee Bump',
      severity: 'LOW',
      description: 'Diya bumped her knee against the soft mat. Cleaned and comfort provided; smiling within 2 minutes.',
    })

    const stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)

    const obsEvent = stream.events.find((e) => e.streamType === 'OBSERVATION')
    expect(obsEvent).toBeDefined()
    expect(obsEvent?.studentName).toContain('Aarav')
    expect(obsEvent?.narrative).toContain('independently sorted geometric shapes')

    const incEvent = stream.events.find((e) => e.streamType === 'INCIDENT')
    expect(incEvent).toBeDefined()
    expect(incEvent?.title).toBe('Minor Knee Bump')
    expect(incEvent?.badge.variant).toBe('danger')
    expect(incEvent?.studentName).toContain('Diya')
  })

  it('6. Explicit Status Progression: Planned activity remains PLANNED until teacher updates it', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    const activity = await DailyDiaryService.createActivity(teacherSession, {
      classroomId: classroom1.id,
      dateStr: testDate,
      title: 'Early Literacy Phonics',
      activityType: 'CORE_SUBJECT',
      startTime: '08:00', // Even though scheduled in the past
      endTime: '08:45',
    })

    let stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)
    let actEvent = stream.events.find((e) => e.activityId === activity.id)
    expect(actEvent?.status).toBe('PLANNED')

    // Explicitly update to IN_PROGRESS
    await DailyDiaryService.updateActivity(teacherSession, activity.id, {
      status: 'IN_PROGRESS',
    })

    stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)
    actEvent = stream.events.find((e) => e.activityId === activity.id)
    expect(actEvent?.status).toBe('IN_PROGRESS')

    // Explicitly complete
    await DailyDiaryService.updateActivity(teacherSession, activity.id, {
      status: 'COMPLETED',
      notes: 'All letter sounds mastered',
    })

    stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)
    actEvent = stream.events.find((e) => e.activityId === activity.id)
    expect(actEvent?.status).toBe('COMPLETED')
  })
})
