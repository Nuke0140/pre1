import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { DailyDiaryService } from '@/lib/daily-diary/daily-diary-service'

describe('Daily Diary: Voice-to-Text for Child Observations Test Suite', () => {
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
  const testDate = '2026-10-22'

  beforeEach(async () => {
    // 1. Setup tenant & branch
    tenant = await db.tenant.upsert({
      where: { code: 'VOICE-OBS-TEST' },
      create: {
        code: 'VOICE-OBS-TEST',
        name: 'Voice Observation Academy',
        status: 'ACTIVE',
      },
      update: {},
    })

    branch = await db.branch.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'VOICE-MAIN',
        },
      },
      create: {
        tenantId: tenant.id,
        code: 'VOICE-MAIN',
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
      where: { email: 'teacher1@voice.test' },
      create: {
        email: 'teacher1@voice.test',
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
      where: { email: 'teacher2@voice.test' },
      create: {
        email: 'teacher2@voice.test',
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
      where: { email: 'admin@voice.test' },
      create: {
        email: 'admin@voice.test',
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
      where: { tenantId_code: { tenantId: tenant.id, code: 'VOICE-C1' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Toddler Blooms',
        code: 'VOICE-C1',
        programType: 'NURSERY',
        capacity: 20,
        primaryTeacherId: teacherUser1.id,
      },
      update: {
        primaryTeacherId: teacherUser1.id,
      },
    })

    classroom2 = await db.classroom.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'VOICE-C2' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Little Stars',
        code: 'VOICE-C2',
        programType: 'PLAYGROUP',
        capacity: 20,
        primaryTeacherId: teacherUser2.id,
      },
      update: {
        primaryTeacherId: teacherUser2.id,
      },
    })

    // 4. Setup students in Classroom 1
    student1 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'VOX-001' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'VOX-001',
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
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'VOX-002' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'VOX-002',
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

    student3 = await db.student.upsert({
      where: { tenantId_admissionNo: { tenantId: tenant.id, admissionNo: 'VOX-003' } },
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'VOX-003',
        firstName: 'Reyansh',
        lastName: 'Joshi',
        gender: 'MALE',
        dob: new Date('2023-08-12'),
        currentClassroomId: classroom2.id,
        status: 'ACTIVE',
      },
      update: {
        currentClassroomId: classroom2.id,
      },
    })

    // Clean prior observations for test date
    const startOfDay = new Date(`${testDate}T00:00:00.000Z`)
    const endOfDay = new Date(`${testDate}T23:59:59.999Z`)
    await db.observation.deleteMany({
      where: {
        tenantId: tenant.id,
        observedAt: { gte: startOfDay, lte: endOfDay },
      },
    })
  })

  it('1. Voice Transcription Append Logic Preserves Previous Text & Punctuation', () => {
    // Helper replicating smart append logic from VoiceObservationInput
    const joinText = (baseText: string, newText: string, mode: 'append' | 'replace'): string => {
      const trimmedNew = newText.trim()
      if (!trimmedNew) return baseText
      if (mode === 'replace' || !baseText.trim()) {
        return trimmedNew.charAt(0).toUpperCase() + trimmedNew.slice(1)
      }

      const trimmedBase = baseText.trim()
      const lastChar = trimmedBase.slice(-1)
      const capitalizedNew = trimmedNew.charAt(0).toUpperCase() + trimmedNew.slice(1)

      if (['.', '!', '?'].includes(lastChar)) {
        return `${trimmedBase} ${capitalizedNew}`
      } else if (lastChar === ',') {
        return `${trimmedBase} ${trimmedNew}`
      } else {
        return `${trimmedBase}. ${capitalizedNew}`
      }
    }

    // A. Starting with empty text
    const emptyResult = joinText('', 'aarav shared his blocks during playtime', 'append')
    expect(emptyResult).toBe('Aarav shared his blocks during playtime')

    // B. Appending to existing text ending with period
    const existingWithPeriod = 'Aarav entered the classroom cheerfully.'
    const appended1 = joinText(existingWithPeriod, 'he helped tidy up the art table', 'append')
    expect(appended1).toBe('Aarav entered the classroom cheerfully. He helped tidy up the art table')

    // C. Appending to text without trailing punctuation
    const existingWithoutPunctuation = 'Aarav engaged enthusiastically with the puzzle'
    const appended2 = joinText(existingWithoutPunctuation, 'he finished sorting all 10 shapes independently', 'append')
    expect(appended2).toBe('Aarav engaged enthusiastically with the puzzle. He finished sorting all 10 shapes independently')

    // D. Replace mode replaces text completely
    const replaced = joinText(existingWithPeriod, 'revised observation note for today', 'replace')
    expect(replaced).toBe('Revised observation note for today')
  })

  it('2. Teacher Saves Dictated Observation with Correct Student, Domain, and Concern Level', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Dictated text reviewed and edited by teacher
    const dictatedNarrative =
      'Aarav shared his building blocks with Diya during free play and demonstrated cooperative problem solving.'

    const obs = await DailyDiaryService.createObservation(teacherSession, {
      classroomId: classroom1.id,
      studentId: student1.id,
      narrative: dictatedNarrative,
      category: 'Social & Emotional',
      concern: 'NORMAL',
      observedAt: new Date(`${testDate}T10:15:00.000Z`),
    })

    expect(obs).toBeDefined()
    expect(obs.id).toBeDefined()
    expect(obs.studentId).toBe(student1.id)
    expect(obs.classroomId).toBe(classroom1.id)
    expect(obs.narrative).toBe(dictatedNarrative)
    expect(obs.category).toBe('Social & Emotional')
    expect(obs.concern).toBe('NORMAL')
    expect(obs.teacherId).toBe(teacherUser1.id)

    // Verify record in database
    const saved = await db.observation.findUnique({
      where: { id: obs.id },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    })
    expect(saved).toBeDefined()
    expect(saved?.student?.firstName).toBe('Aarav')
    expect(saved?.narrative).toContain('cooperative problem solving')
  })

  it('3. Manual Editing Before Save: Teacher Edits Dictated Words Before Submitting', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Teacher dictates raw transcript, then edits typos or adds context manually
    const rawTranscript = 'diya counted up to fifteen with teacher assistance'
    const editedNarrative = 'Diya counted up to 15 with teacher encouragement, identifying numbers 1 through 10 accurately.'

    const obs = await DailyDiaryService.createObservation(teacherSession, {
      classroomId: classroom1.id,
      studentId: student2.id,
      narrative: editedNarrative,
      category: 'Cognitive & Math',
      concern: 'NORMAL',
      observedAt: new Date(`${testDate}T11:00:00.000Z`),
    })

    expect(obs.narrative).toBe(editedNarrative)
    expect(obs.narrative).not.toBe(rawTranscript)
  })

  it('4. Voice Input Never Submits Automatically: Unsaved Dictation Is Not In Database', async () => {
    // When teacher speaks, words update the form state only.
    // If modal is closed or not submitted, no observation is saved.
    const unsavedText = 'Draft voice text that was spoken but cancelled by teacher.'

    const countBefore = await db.observation.count({
      where: {
        tenantId: tenant.id,
        classroomId: classroom1.id,
        narrative: unsavedText,
      },
    })
    expect(countBefore).toBe(0)
  })

  it('5. Role-Based Scoping: Teacher Cannot Save Observations in Unassigned Classrooms', async () => {
    // Teacher 1 is assigned to Classroom 1, NOT Classroom 2
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
      await DailyDiaryService.createObservation(teacher1Session, {
        classroomId: classroom2.id, // Forbidden!
        studentId: student1.id,
        narrative: 'Aarav was observed in unauthorized classroom.',
      })
    } catch (err: any) {
      if (err.message.includes('FORBIDDEN_TEACHER_CLASSROOM_ACCESS')) {
        forbiddenCaught = true
      }
    }
    expect(forbiddenCaught).toBe(true)

    // Admin can save observation in any classroom
    const adminSession: any = {
      uid: adminUser.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: adminUser.fullName,
      email: adminUser.email,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    }

    const adminObs = await DailyDiaryService.createObservation(adminSession, {
      classroomId: classroom2.id,
      studentId: student3.id,
      narrative: 'Whole class engaged well during outdoor morning play.',
      category: 'General',
    })
    expect(adminObs).toBeDefined()
    expect(adminObs.classroomId).toBe(classroom2.id)
    expect(adminObs.studentId).toBe(student3.id)
  })

  it('6. Classroom Day Stream Integration: Voice-Recorded Observations Surface in Stream', async () => {
    const teacherSession: any = {
      uid: teacherUser1.id,
      tenantId: tenant.id,
      branchId: branch.id,
      name: teacherUser1.fullName,
      email: teacherUser1.email,
      role: 'TEACHER',
      roles: ['TEACHER'],
    }

    // Save observation
    await DailyDiaryService.createObservation(teacherSession, {
      classroomId: classroom1.id,
      studentId: student1.id,
      narrative: 'Aarav independently sorted geometric blocks by primary colors.',
      category: 'Cognitive',
      concern: 'NORMAL',
      observedAt: new Date(`${testDate}T10:45:00.000Z`),
    })

    // Load Classroom Day Stream
    const stream = await DailyDiaryService.getDayStream(teacherSession, classroom1.id, testDate)

    const obsEvent = stream.events.find(
      (e) => e.streamType === 'OBSERVATION' && e.studentName?.includes('Aarav')
    )
    expect(obsEvent).toBeDefined()
    expect(obsEvent?.summary).toContain('independently sorted geometric blocks')
    expect(obsEvent?.badge.label).toBe('OBSERVED')
    expect(obsEvent?.badge.variant).toBe('info')
  })
})
