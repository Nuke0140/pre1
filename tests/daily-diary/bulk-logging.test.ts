import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

describe('Daily Diary: Select All / Bulk Logging Test Suite', () => {
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
  let student3: any
  const testDate = '2026-10-21'

  beforeEach(async () => {
    // 1. Setup tenant & branch
    tenant = await db.tenant.upsert({
      where: { code: 'BULK-LOG-TEST' },
      create: {
        code: 'BULK-LOG-TEST',
        name: 'Bulk Log Preschool Academy',
        status: 'ACTIVE',
      },
      update: {},
    })

    branch = await db.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'BULK-MAIN',
        },
      },
      create: {
        tenantId: tenant.id,
        code: 'BULK-MAIN',
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
      where: { email: 'teacher1@bulk.test' },
      create: {
        email: 'teacher1@bulk.test',
        fullName: 'Teacher Priya Nair',
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
      where: { email: 'teacher2@bulk.test' },
      create: {
        email: 'teacher2@bulk.test',
        fullName: 'Teacher Vikram Rao',
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
      where: { email: 'admin@bulk.test' },
      create: {
        email: 'admin@bulk.test',
        fullName: 'Principal Sunita Sen',
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
      where: { tenantId_code: { tenantId: tenant.id, code: 'BL-01' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Toddler Sprouts',
        code: 'BL-01',
        programType: 'NURSERY',
        capacity: 20,
        primaryTeacherId: teacherUser1.id,
      },
      update: {
        primaryTeacherId: teacherUser1.id,
      },
    })

    classroom2 = await db.classroom.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'BL-02' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Little Explorers',
        code: 'BL-02',
        programType: 'PLAYGROUP',
        capacity: 20,
        primaryTeacherId: teacherUser2.id,
      },
      update: {
        primaryTeacherId: teacherUser2.id,
      },
    })

    // 4. Setup 3 students in Classroom 1
    student1 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'BLK-001' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'BLK-001',
        firstName: 'Aarav',
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

    student2 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'BLK-002' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'BLK-002',
        firstName: 'Kabir',
        lastName: 'Mehta',
        gender: 'MALE',
        dob: new Date('2023-05-20'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: {
        currentClassroomId: classroom1.id,
      },
    })

    student3 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'BLK-003' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'BLK-003',
        firstName: 'Diya',
        lastName: 'Kapoor',
        gender: 'FEMALE',
        dob: new Date('2023-07-10'),
        currentClassroomId: classroom1.id,
        status: 'ACTIVE',
      },
      update: {
        currentClassroomId: classroom1.id,
      },
    })

    // 5. Setup subject for classroom 1
    const sub1 = await db.subject.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'SUB-CIRCLE-BL' } },
      create: {
        tenantId: tenant.id,
        code: 'SUB-CIRCLE-BL',
        name: 'Circle Time & Rhymes',
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

    // Clean any prior timeline entries for test date
    const startOfDay = new Date(`${testDate}T00:00:00.000Z`)
    const endOfDay = new Date(`${testDate}T23:59:59.999Z`)
    await db.timelineEntry.deleteMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    })
    await db.classroomActivity.deleteMany({
      where: {
        tenantId: tenant.id,
        activityDate: { gte: startOfDay, lte: endOfDay },
      },
    })
  })

  it('1. Whole-Class Default Selection & Absent Student Exclusion', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Set attendance: Aarav = PRESENT, Kabir = ABSENT, Diya = LATE
    await DailyDiaryService.saveAttendanceRegister(teacherSession, classroom1.id, testDate, [
      { studentId: student1.id, status: 'PRESENT' },
      { studentId: student2.id, status: 'ABSENT' },
      { studentId: student3.id, status: 'LATE' },
    ])

    // Eligible students for meals are Aarav (PRESENT) and Diya (LATE). Kabir is ABSENT.
    // Teacher performs bulk meal log for the 2 eligible students
    const mealRes = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '10:30',
      type: 'MEAL',
      mealName: 'Fruit Snack (Papaya & Apples)',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All' },
        { studentId: student3.id, intake: 'Ate Most' },
      ],
    })

    expect(mealRes.success).toBe(true)
    expect(mealRes.count).toBe(2)
    expect(mealRes.createdCount).toBe(2)

    // Verify separate student-level records are created
    const aaravEntry = await db.timelineEntry.findFirst({
      where: {
        tenantId: tenant.id,
        studentId: student1.id,
        type: 'MEAL',
        title: 'Fruit Snack (Papaya & Apples)',
      },
    })
    expect(aaravEntry).toBeDefined()
    expect(aaravEntry?.body).toContain('Ate All')

    const diyaEntry = await db.timelineEntry.findFirst({
      where: {
        tenantId: tenant.id,
        studentId: student3.id,
        type: 'MEAL',
        title: 'Fruit Snack (Papaya & Apples)',
      },
    })
    expect(diyaEntry).toBeDefined()
    expect(diyaEntry?.body).toContain('Ate Most')

    // Absent student Kabir MUST NOT have a meal record
    const kabirEntry = await db.timelineEntry.findFirst({
      where: {
        tenantId: tenant.id,
        studentId: student2.id,
        type: 'MEAL',
        title: 'Fruit Snack (Papaya & Apples)',
      },
    })
    expect(kabirEntry).toBeNull()
  })

  it('2. Fast "Apply Default to All" with Individual Student Exceptions and Notes', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Default baseline: "Ate All".
    // Exceptions: Kabir = "Ate Half" with note, Diya = "Refused" with note.
    const result = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '12:00',
      type: 'MEAL',
      mealName: 'Warm Lunch (Khichdi & Curd)',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All' },
        { studentId: student2.id, intake: 'Ate Half', notes: 'Complained of stomach ache' },
        { studentId: student3.id, intake: 'Refused', notes: 'Did not want curd' },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.count).toBe(3)
    expect(result.createdCount).toBe(3)

    // Inspect individual records to ensure fidelity
    const entries = await db.timelineEntry.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        type: 'MEAL',
        title: 'Warm Lunch (Khichdi & Curd)',
      },
      orderBy: { studentId: 'asc' },
    })

    expect(entries.length).toBe(3)
    const e1 = entries.find((e) => e.studentId === student1.id)
    const e2 = entries.find((e) => e.studentId === student2.id)
    const e3 = entries.find((e) => e.studentId === student3.id)

    expect(e1?.body).toBe('Ate All')
    expect(e2?.body).toContain('Ate Half — Complained of stomach ache')
    expect(e3?.body).toContain('Refused — Did not want curd')
  })

  it('3. Atomic Persistence & Duplicate Prevention / Idempotency', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // First save: 2 students recorded
    const firstSave = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '09:45',
      type: 'MEAL',
      mealName: 'Morning Milk',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All' },
        { studentId: student3.id, intake: 'Ate Half' },
      ],
    })

    expect(firstSave.createdCount).toBe(2)
    expect(firstSave.updatedCount).toBe(0)

    // Second save (re-submission / update): teacher adjusts Diya to "Ate All" and re-saves
    const secondSave = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '09:45',
      type: 'MEAL',
      mealName: 'Morning Milk',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All' },
        { studentId: student3.id, intake: 'Ate All', notes: 'Finished second cup' },
      ],
    })

    expect(secondSave.createdCount).toBe(0)
    expect(secondSave.updatedCount).toBe(2)

    // Total records on database must still be exactly 2 (NO duplicates)
    const totalEntries = await db.timelineEntry.count({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        type: 'MEAL',
        title: 'Morning Milk',
      },
    })
    expect(totalEntries).toBe(2)

    // Diya's record was updated with the new intake
    const updatedDiya = await db.timelineEntry.findFirst({
      where: {
        tenantId: tenant.id,
        studentId: student3.id,
        title: 'Morning Milk',
      },
    })
    expect(updatedDiya?.body).toContain('Ate All — Finished second cup')
  })

  it('4. Activity Participation Bulk Logging with Separate Student Records', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    const res = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '10:00',
      type: 'ACTIVITY',
      title: 'Circle Time & Rhymes',
      activityType: 'CORE_SUBJECT',
      startTime: '10:00',
      endTime: '10:30',
      status: 'COMPLETED',
      actualOutcome: 'All children participated enthusiastically in wheels on the bus.',
      activityEntries: [
        { studentId: student1.id, participation: 'Active Leader' },
        { studentId: student2.id, participation: 'Participated' },
        { studentId: student3.id, participation: 'Observed Quietly', notes: 'Held teacher hand' },
      ],
    })

    expect(res.success).toBe(true)
    expect(res.activityId).toBeDefined()
    expect(res.createdCount).toBe(3)

    // Check that ClassroomActivity was created
    const activity = await db.classroomActivity.findUnique({
      where: { id: res.activityId },
    })
    expect(activity).toBeDefined()
    expect(activity?.title).toBe('Circle Time & Rhymes')
    expect(activity?.status).toBe('COMPLETED')

    // Check individual timeline entries for each child
    const timelineEntries = await db.timelineEntry.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        type: 'ACTIVITY',
        title: 'Circle Time & Rhymes',
      },
    })
    expect(timelineEntries.length).toBe(3)

    const leader = timelineEntries.find((e) => e.studentId === student1.id)
    expect(leader?.body).toBe('Active Leader')

    const observer = timelineEntries.find((e) => e.studentId === student3.id)
    expect(observer?.body).toBe('Observed Quietly — Held teacher hand')
  })

  it('5. Nap & Rest Time Bulk Logging with Exceptions', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    const res = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '13:00',
      type: 'NAP',
      title: 'Afternoon Nap & Rest',
      startTime: '13:00',
      endTime: '14:30',
      napEntries: [
        { studentId: student1.id, napStatus: 'Slept Well' },
        { studentId: student2.id, napStatus: 'Rested Quietly' },
        { studentId: student3.id, napStatus: 'Fussy', notes: 'Woke up after 20 mins' },
      ],
    })

    expect(res.success).toBe(true)
    expect(res.count).toBe(3)

    const naps = await db.timelineEntry.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        type: 'NAP',
        title: 'Afternoon Nap & Rest',
      },
    })
    expect(naps.length).toBe(3)

    const fussyChild = naps.find((n) => n.studentId === student3.id)
    expect(fussyChild?.body).toContain('Fussy — Woke up after 20 mins')
  })

  it('6. Classroom Mood Check-in Bulk Logging with Observer Attribution', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    const res = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '09:15',
      type: 'MOOD',
      title: 'Morning Emotional Check-in',
      moodSource: 'TEACHER_OBSERVED',
      moodEntries: [
        { studentId: student1.id, mood: 'Happy' },
        { studentId: student2.id, mood: 'Energetic' },
        { studentId: student3.id, mood: 'Tired', notes: 'Rubbing eyes during arrival' },
      ],
    })

    expect(res.success).toBe(true)
    expect(res.count).toBe(3)

    const moods = await db.timelineEntry.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        title: 'Morning Emotional Check-in',
      },
    })
    expect(moods.length).toBe(3)

    const tiredChild = moods.find((m) => m.studentId === student3.id)
    expect(tiredChild?.mood).toBe('Tired')
    expect(tiredChild?.body).toContain('[Teacher Observed] Tired — Rubbing eyes during arrival')
  })

  it('7. Potty & Care Deliberate Child Selection', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Deliberate selection: Only Student 2 had a diaper change
    const res = await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '11:15',
      type: 'CARE',
      careType: 'DIAPER',
      title: 'Diaper Change',
      careEntries: [{ studentId: student2.id, notes: 'Wet diaper; clean change; cream applied' }],
    })

    expect(res.success).toBe(true)
    expect(res.count).toBe(1)

    const diaperRecords = await db.timelineEntry.findMany({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        title: 'Diaper Change',
      },
    })
    expect(diaperRecords.length).toBe(1)
    expect(diaperRecords[0].studentId).toBe(student2.id)
    expect(diaperRecords[0].body).toContain('Wet diaper; clean change; cream applied')
  })

  it('8. Teacher Authorization Scoping: Forbidden access to unassigned classrooms', async () => {
    // Teacher 1 is assigned to Classroom 1, not Classroom 2
    const teacher1Session: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    let forbiddenCaught = false
    try {
      await DailyDiaryService.quickLog(teacher1Session, {
        classroomId: classroom2.id, // Unassigned!
        date: testDate,
        type: 'MEAL',
        mealName: 'Forbidden Snack',
        mealEntries: [{ studentId: student1.id, intake: 'Ate All' }],
      })
    } catch (err: any) {
      if (err.message.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
        forbiddenCaught = true
      }
    }
    expect(forbiddenCaught).toBe(true)

    // Admin has access to both Classroom 1 and Classroom 2
    const adminSession: any = {
      uid: adminUser.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: adminUser.fullName,
      email: adminUser.email,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    }

    const adminRes = await DailyDiaryService.quickLog(adminSession, {
      classroomId: classroom2.id,
      date: testDate,
      type: 'MEAL',
      mealName: 'Admin Authorized Snack',
      mealEntries: [{ studentId: student1.id, intake: 'Ate All' }],
    })
    expect(adminRes.success).toBe(true)
  })

  it('9. Classroom Day Stream Integration: Bulk events display aggregated summaries', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // 1. Log a bulk meal
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '12:00',
      type: 'MEAL',
      mealName: 'Warm Lunch',
      mealEntries: [
        { studentId: student1.id, intake: 'Ate All' },
        { studentId: student2.id, intake: 'Ate Half' },
        { studentId: student3.id, intake: 'Refused' },
      ],
    })

    // 2. Log a bulk nap
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '13:00',
      type: 'NAP',
      title: 'Afternoon Rest',
      napEntries: [
        { studentId: student1.id, napStatus: 'Slept Well' },
        { studentId: student2.id, napStatus: 'Slept Well' },
        { studentId: student3.id, napStatus: 'Awake' },
      ],
    })

    // 3. Log a bulk mood check-in
    await DailyDiaryService.quickLog(teacherSession, {
      classroomId: classroom1.id,
      date: testDate,
      time: '09:15',
      type: 'MOOD',
      title: 'Emotional Check-in',
      moodSource: 'TEACHER_OBSERVED',
      moodEntries: [
        { studentId: student1.id, mood: 'Happy' },
        { studentId: student2.id, mood: 'Calm' },
        { studentId: student3.id, mood: 'Tired' },
      ],
    })

    // Fetch Day Stream for Classroom 1
    const stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)

    expect(stream.classroom.id).toBe(classroom1.id)
    expect(stream.events.length).toBeGreaterThan(0)

    // Verify Meal group event exists and has consumption stats
    const mealEvent = stream.events.find((e) => e.streamType === 'MEAL' && e.title.includes('Lunch'))
    expect(mealEvent).toBeDefined()
    expect(mealEvent?.consumptionStats).toBeDefined()
    expect(mealEvent?.summary).toContain('Ate All')
    expect(mealEvent?.summary).toContain('Ate Half')
    expect(mealEvent?.summary).toContain('Refused')

    // Verify Nap group event exists
    const napEvent = stream.events.find((e) => e.streamType === 'NAP')
    expect(napEvent).toBeDefined()
    expect(napEvent?.napStats).toBeDefined()
    expect(napEvent?.items?.length).toBe(3)

    // Verify Mood check-in group event exists
    const moodEvent = stream.events.find((e) => e.title?.includes('Emotional Check-in'))
    expect(moodEvent).toBeDefined()
    expect(moodEvent?.badge.label).toBe('MOOD')
  })
})
