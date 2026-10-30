import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { isoDate } from '@/lib/format'
import { OperationsService } from '@/lib/operations/operations-service'
import { OperationPolicies } from '@/lib/operations/operation-policies'

// Operations Route Handlers
import { GET as scanGet, POST as scanPost } from '@/app/api/v1/operations/scan/route'
import { GET as pickupGet, POST as pickupPost } from '@/app/api/v1/operations/pickup/route'
import { POST as healthPost } from '@/app/api/v1/operations/health/route'
import { POST as incidentPost } from '@/app/api/v1/operations/incidents/route'
import { GET as classroomBoardGet } from '@/app/api/v1/operations/classrooms/[id]/route'
import { GET as todayOpsGet } from '@/app/api/v1/operations/today/route'
import { GET as exceptionsGet } from '@/app/api/v1/operations/exceptions/route'
import { GET as dailyReportGet } from '@/app/api/v1/operations/reports/daily/route'

describe('PreOne — Real-World Preschool Operational Workflows Integration Suite', () => {
  let tenant: any
  let branch: any
  let academicSession: any

  // Users & Cookies
  let ownerUser: any
  let ownerCookie: string

  let principalUser: any
  let principalCookie: string

  let teacherA: any
  let teacherACookie: string

  let teacherB: any
  let teacherBCookie: string

  let parentUser1: any
  let parentUser1Cookie: string

  let parentUser2: any
  let parentUser2Cookie: string

  // Classrooms
  let classroomA: any // Toddlers / Butterflies
  let classroomB: any // Pre-K / Little Stars

  // Students & Guardians
  let student1: any // Aarav Sharma
  let student2: any // Ananya Patel
  let student3: any // Vihaan Rao

  let guardianFather1: any // Rajesh Sharma (Father, pickupPin: '5821', canPickup: true)
  let guardianMother1: any // Sunita Sharma (Mother, pickupPin: '9432', canPickup: true)
  let guardianMother2: any // Meera Patel (Mother, pickupPin: '7654', canPickup: true)
  let guardianUnauthorized: any // Uncle Dev (canPickup: false)

  const ts = `${Date.now()}`
  const todayStr = isoDate()

  beforeAll(async () => {
    // 1. Setup Tenant and Branch
    tenant = await db.tenant.create({
      data: {
        name: `Little Sprout Preschool ${ts.slice(-4)}`,
        code: `LSP-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Koramangala Campus',
        code: `KOR-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: 'AY 2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    })

    // 2. Setup Operating & Student Parent Config
    await db.schoolConfig.create({
      data: {
        tenantId: tenant.id,
        domain: 'OPERATING',
        data: {
          schoolStartTime: '08:30',
          schoolEndTime: '16:00',
          arrivalWindowStart: '08:00',
          arrivalWindowEnd: '09:30',
          pickupWindowStart: '15:30',
          pickupWindowEnd: '16:30',
          lateArrivalRule: 'Arrivals after 09:30 are marked LATE.',
        },
      },
    })

    await db.schoolConfig.create({
      data: {
        tenantId: tenant.id,
        domain: 'STUDENT_PARENT',
        data: {
          pickupVerification: 'PIN_MATCH',
          maxAuthorizedPickups: 4,
        },
      },
    })

    // 3. Setup Users & Sessions
    // A. Owner
    ownerUser = await db.user.create({
      data: {
        email: `owner.ops.${ts}@test.com`,
        fullName: 'Dr. Anita Desai (Owner)',
        username: `owner_ops_${ts}`,
        passwordHash: 'dummy',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: ownerUser.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })
    ownerCookie = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      tenantId: tenant.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    // B. Principal
    principalUser = await db.user.create({
      data: {
        email: `principal.ops.${ts}@test.com`,
        fullName: 'Mrs. Rohini Mehta (Principal)',
        username: `principal_ops_${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuPrincipal = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: principalUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant.id,
        tenantUserId: tuPrincipal.id,
        branchId: branch.id,
        isPrimary: true,
      },
    })
    principalCookie = await signSession({
      uid: principalUser.id,
      email: principalUser.email,
      name: principalUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    // C. Teacher A (Classroom A)
    teacherA = await db.user.create({
      data: {
        email: `teacher.a.${ts}@test.com`,
        fullName: 'Ms. Kavita Nair (Lead Toddlers)',
        username: `teacher_a_${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuTeacherA = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherA.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant.id,
        tenantUserId: tuTeacherA.id,
        branchId: branch.id,
        isPrimary: true,
      },
    })
    teacherACookie = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      name: teacherA.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })

    // D. Teacher B (Classroom B)
    teacherB = await db.user.create({
      data: {
        email: `teacher.b.${ts}@test.com`,
        fullName: 'Ms. Sonal Roy (Lead Pre-K)',
        username: `teacher_b_${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuTeacherB = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherB.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant.id,
        tenantUserId: tuTeacherB.id,
        branchId: branch.id,
        isPrimary: true,
      },
    })
    teacherBCookie = await signSession({
      uid: teacherB.id,
      email: teacherB.email,
      name: teacherB.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })

    // E. Parent 1 (Rajesh Sharma)
    parentUser1 = await db.user.create({
      data: {
        email: `parent1.ops.${ts}@test.com`,
        fullName: 'Rajesh Sharma',
        username: `parent1_ops_${ts}`,
        passwordHash: 'dummy',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: parentUser1.id,
        role: 'PARENT',
        roles: ['PARENT'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    parentUser1Cookie = await signSession({
      uid: parentUser1.id,
      email: parentUser1.email,
      name: parentUser1.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })

    // F. Parent 2 (Meera Patel)
    parentUser2 = await db.user.create({
      data: {
        email: `parent2.ops.${ts}@test.com`,
        fullName: 'Meera Patel',
        username: `parent2_ops_${ts}`,
        passwordHash: 'dummy',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: parentUser2.id,
        role: 'PARENT',
        roles: ['PARENT'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    parentUser2Cookie = await signSession({
      uid: parentUser2.id,
      email: parentUser2.email,
      name: parentUser2.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })

    // 4. Setup Classrooms
    classroomA = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Toddlers — Butterflies',
        code: `TOD-BUT-${ts.slice(-4)}`,
        programType: 'PLAYGROUP',
        capacity: 15,
        primaryTeacherId: teacherA.id,
        isActive: true,
      },
    })

    classroomB = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        name: 'Nursery — Little Stars',
        code: `NUR-STA-${ts.slice(-4)}`,
        programType: 'NURSERY',
        capacity: 20,
        primaryTeacherId: teacherB.id,
        isActive: true,
      },
    })

    // 5. Setup Students
    student1 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomA.id,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2023-04-12'),
        gender: 'MALE',
        admissionNo: `ADM-${ts.slice(-4)}-01`,
        seatNumber: `S01-${ts.slice(-3)}`,
        bloodGroup: 'B_POSITIVE',
        status: 'ACTIVE',
      },
    })

    student2 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomA.id,
        firstName: 'Ananya',
        lastName: 'Patel',
        dob: new Date('2023-07-25'),
        gender: 'FEMALE',
        admissionNo: `ADM-${ts.slice(-4)}-02`,
        seatNumber: `S02-${ts.slice(-3)}`,
        bloodGroup: 'O_POSITIVE',
        status: 'ACTIVE',
      },
    })

    student3 = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        currentClassroomId: classroomB.id,
        firstName: 'Vihaan',
        lastName: 'Rao',
        dob: new Date('2022-11-05'),
        gender: 'MALE',
        admissionNo: `ADM-${ts.slice(-4)}-03`,
        seatNumber: `S03-${ts.slice(-3)}`,
        bloodGroup: 'A_POSITIVE',
        status: 'ACTIVE',
      },
    })

    // 6. Setup Guardians & Linking
    guardianFather1 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Rajesh Sharma',
        relationship: 'FATHER',
        phone: `98700${ts.slice(-5)}1`,
        email: parentUser1.email,
        pickupPin: '5821', // Valid 4-digit PIN
        userId: parentUser1.id,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: student1.id,
        guardianId: guardianFather1.id,
        isPrimary: true,
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: '5821',
      },
    })

    guardianMother1 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Sunita Sharma',
        relationship: 'MOTHER',
        phone: `98700${ts.slice(-5)}2`,
        pickupPin: '9432', // Mother's PIN
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: student1.id,
        guardianId: guardianMother1.id,
        isPrimary: false,
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: '9432',
      },
    })

    guardianMother2 = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Meera Patel',
        relationship: 'MOTHER',
        phone: `98700${ts.slice(-5)}3`,
        email: parentUser2.email,
        pickupPin: '7654',
        userId: parentUser2.id,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: student2.id,
        guardianId: guardianMother2.id,
        isPrimary: true,
        canPickup: true,
        pickupStatus: 'AUTHORIZED',
        pickupPin: '7654',
      },
    })

    guardianUnauthorized = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Dev Anand',
        relationship: 'OTHER',
        phone: `98700${ts.slice(-5)}4`,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: student1.id,
        guardianId: guardianUnauthorized.id,
        isPrimary: false,
        canPickup: false,
        pickupStatus: 'NOT_AUTHORIZED',
      },
    })
  })

  // =========================================================================
  // WORKFLOW 1: GATE SCANNER IDENTIFICATION & LOOKUP
  // =========================================================================
  describe('Workflow 1: Gate Scanner Identification & Lookup', () => {
    it('resolves student profile, classroom, and authorized guardians by Admission Number', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan?code=${student1.admissionNo}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const res = await scanGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.student).toBeDefined()
      expect(body.data.student.id).toBe(student1.id)
      expect(body.data.student.name).toBe('Aarav Sharma')
      expect(body.data.student.admissionNo).toBe(student1.admissionNo)
      expect(body.data.student.classroom).toBe('Toddlers — Butterflies')
      expect(body.data.student.teacher).toBe(teacherA.fullName)
      expect(body.data.student.isPickedUp).toBe(false)

      // Verify authorized guardian list includes both Father & Mother
      const guardianNames = body.data.student.guardians.map((g: any) => g.name)
      expect(guardianNames).toContain('Rajesh Sharma')
      expect(guardianNames).toContain('Sunita Sharma')
      expect(guardianNames).toContain('Dev Anand')
    })

    it('resolves student profile accurately by Seat Number', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan?code=${student1.seatNumber}`, {
        headers: { cookie: `preone_session=${teacherACookie}` },
      })
      const res = await scanGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.student.id).toBe(student1.id)
      expect(body.data.student.name).toBe('Aarav Sharma')
    })

    it('returns 404 when scanning an unrecognized QR or admission code', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan?code=NON_EXISTENT_QR_999`, {
        headers: { cookie: `preone_session=${teacherACookie}` },
      })
      const res = await scanGet(req)
      expect(res.status).toBe(404)
    })
  })

  // =========================================================================
  // WORKFLOW 2: MORNING ARRIVAL CHECK-IN & CUTOFF TIME POLICIES
  // =========================================================================
  describe('Workflow 2: Morning Arrival Check-in & Idempotency', () => {
    it('records morning gate arrival check-in and updates student attendance', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'ARRIVAL',
          code: student1.admissionNo,
          notes: 'Dropped off by father at main gate',
        }),
      })
      const res = await scanPost(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.studentId).toBe(student1.id)
      expect(['PRESENT', 'LATE']).toContain(body.data.status)
      expect(body.data.isRepeatScan).toBe(false)

      // Verify attendance record in database
      const attRecord = await db.attendance.findUnique({
        where: {
          studentId_date: {
            studentId: student1.id,
            date: new Date(todayStr),
          },
        },
      })
      expect(attRecord).not.toBeNull()
      expect(attRecord?.tenantId).toBe(tenant.id)
      expect(attRecord?.classroomId).toBe(classroomA.id)
      expect(['PRESENT', 'LATE']).toContain(attRecord!.status)

      // Verify timeline entry created
      const timelineEntry = await db.timelineEntry.findFirst({
        where: {
          tenantId: tenant.id,
          studentId: student1.id,
          type: 'ARRIVAL',
        },
      })
      expect(timelineEntry).not.toBeNull()
      expect(timelineEntry?.title).toMatch(/arrived|late arrival/i)
    })

    it('handles repeat arrival scans idempotently without duplicate records', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'ARRIVAL',
          code: student1.admissionNo,
          notes: 'Accidental second scan',
        }),
      })
      const res = await scanPost(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.isRepeatScan).toBe(true)

      // Ensure only 1 timeline arrival entry exists for today
      const arrivalEntriesCount = await db.timelineEntry.count({
        where: {
          tenantId: tenant.id,
          studentId: student1.id,
          type: 'ARRIVAL',
        },
      })
      expect(arrivalEntriesCount).toBe(1)
    })

    it('accurately distinguishes on-time vs late arrival based on Operating policy cutoff', async () => {
      // 08:45 AM (before 09:30 cutoff)
      const onTimeArrival = new Date()
      onTimeArrival.setHours(8, 45, 0, 0)
      const onTimeResult = await OperationPolicies.evaluateArrivalStatus(tenant.id, onTimeArrival)
      expect(onTimeResult.isLate).toBe(false)
      expect(onTimeResult.status).toBe('PRESENT')

      // 10:15 AM (after 09:30 cutoff)
      const lateArrival = new Date()
      lateArrival.setHours(10, 15, 0, 0)
      const lateResult = await OperationPolicies.evaluateArrivalStatus(tenant.id, lateArrival)
      expect(lateResult.isLate).toBe(true)
      expect(lateResult.status).toBe('LATE')
      expect(lateResult.cutoffTime).toBe('09:30')
    })
  })

  // =========================================================================
  // WORKFLOW 3: CLASSROOM OPERATIONAL ROSTER & TEACHER SCOPING
  // =========================================================================
  describe('Workflow 3: Classroom Operational Board & Teacher RBAC Scoping', () => {
    it('displays full classroom roster with arrival and attendance status to assigned teacher', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/classrooms/${classroomA.id}`, {
        headers: { cookie: `preone_session=${teacherACookie}` },
      })
      const res = await classroomBoardGet(req, { params: Promise.resolve({ id: classroomA.id }) })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.classroom.name).toBe('Toddlers — Butterflies')
      expect(body.data.classroom.teacher).toBe(teacherA.fullName)
      expect(body.data.students.length).toBe(2) // student1 & student2

      const student1Entry = body.data.students.find((s: any) => s.id === student1.id)
      expect(student1Entry).toBeDefined()
      expect(['PRESENT', 'LATE']).toContain(student1Entry.attendance)
      expect(student1Entry.isPickedUp).toBe(false)

      const student2Entry = body.data.students.find((s: any) => s.id === student2.id)
      expect(student2Entry.attendance).toBe('UNMARKED')
    })

    it('restricts teacher from viewing an unassigned classroom operational board (RBAC)', async () => {
      // Teacher A attempting to view Teacher B's classroom (Classroom B)
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/classrooms/${classroomB.id}`, {
        headers: { cookie: `preone_session=${teacherACookie}` },
      })
      const res = await classroomBoardGet(req, { params: Promise.resolve({ id: classroomB.id }) })
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/authorized to access your assigned classroom|forbidden/i)
    })

    it('allows Principal to view any classroom operational board', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/classrooms/${classroomB.id}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const res = await classroomBoardGet(req, { params: Promise.resolve({ id: classroomB.id }) })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.classroom.name).toBe('Nursery — Little Stars')
      expect(body.data.students.length).toBe(1) // student3
    })
  })

  // =========================================================================
  // WORKFLOW 4: GATE HEALTH SCREENING & FEVER/SYMPTOM ISOLATION TRIAGE
  // =========================================================================
  describe('Workflow 4: Gate Health Screening & Isolation Triage', () => {
    it('records a CLEAR health check for child with normal temperature and zero symptoms', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/health`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student2.id,
          outcome: 'CLEAR',
          temperature: 98.4,
          symptoms: [],
          notes: 'Cheerful, clear skin and throat',
        }),
      })
      const res = await healthPost(req)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.outcome).toBe('CLEAR')
      expect(body.data.followUpId).toBeNull()
    })

    it('records an ISOLATE health check with high fever, triggering an emergency follow-up to Principal', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/health`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student1.id,
          outcome: 'ISOLATE',
          temperature: 101.4,
          symptoms: ['Fever', 'Cough', 'Fatigue'],
          notes: 'Flushed cheeks. Moved to sick-bay / isolation room immediately.',
        }),
      })
      const res = await healthPost(req)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.outcome).toBe('ISOLATE')
      expect(body.data.followUpId).not.toBeNull()

      // Verify that an URGENT or EMERGENCY follow-up exists in DB
      const followUp = await db.followUp.findUnique({
        where: { id: body.data.followUpId },
      })
      expect(followUp).not.toBeNull()
      expect(followUp?.domain).toBe('HEALTH')
      expect(['URGENT', 'EMERGENCY']).toContain(followUp!.severity)
      expect(followUp?.studentId).toBe(student1.id)
      expect(followUp?.responsibleRole).toBe('PRINCIPAL')

      // Verify it appears in the operations exceptions queue
      const exReq = new NextRequest(`http://localhost:3000/api/v1/operations/exceptions`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const exRes = await exceptionsGet(exReq)
      expect(exRes.status).toBe(200)

      const exBody = await exRes.json()
      const healthItem = exBody.data.items.find((i: any) => i.id === body.data.followUpId)
      expect(healthItem).toBeDefined()
      expect(healthItem.domain).toBe('HEALTH')
      expect(healthItem.student).toBe('Aarav Sharma')
    })
  })

  // =========================================================================
  // WORKFLOW 5: CLASSROOM DAILY CARE SHEET (MEALS, NAP, POTTY, HYDRATION)
  // =========================================================================
  describe('Workflow 5: Classroom Daily Care Sheet', () => {
    it('records comprehensive care entries into student timeline', async () => {
      const careItems = [
        {
          studentId: student1.id,
          type: 'MEAL' as const,
          title: 'Morning Snack — Apple Slices & Milk',
          body: 'Ate all apple slices and drank 150ml milk cheerfully',
          mood: 'HAPPY',
        },
        {
          studentId: student1.id,
          type: 'NAP' as const,
          title: 'Afternoon Nap',
          body: 'Slept soundly on cot for 45 minutes',
          durationMinutes: 45,
          mood: 'CALM',
        },
        {
          studentId: student1.id,
          type: 'BATHROOM' as const,
          title: 'Potty / Toilet Routine',
          body: 'Used potty independently with handwashing',
        },
        {
          studentId: student1.id,
          type: 'ACTIVITY' as const,
          title: 'Sensory Play — Finger Painting',
          body: 'Explored primary colors and textures',
        },
      ]

      const ctx = {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: teacherA.id,
        actorName: teacherA.fullName,
        actorRole: 'TEACHER',
      }

      const result = await OperationsService.recordClassroomCare(ctx, careItems)
      expect(result.recordedCount).toBe(4)

      // Verify entries in TimelineEntry
      const entries = await db.timelineEntry.findMany({
        where: {
          tenantId: tenant.id,
          studentId: student1.id,
        },
      })
      const types = entries.map((e) => e.type)
      expect(types).toContain('MEAL')
      expect(types).toContain('NAP')
      expect(types).toContain('BATHROOM')
      expect(types).toContain('ACTIVITY')

      // Verify classroom operational board reflects the updated care counts
      const boardReq = new NextRequest(`http://localhost:3000/api/v1/operations/classrooms/${classroomA.id}`, {
        headers: { cookie: `preone_session=${teacherACookie}` },
      })
      const boardRes = await classroomBoardGet(boardReq, { params: Promise.resolve({ id: classroomA.id }) })
      const boardBody = await boardRes.json()
      const student1Roster = boardBody.data.students.find((s: any) => s.id === student1.id)
      expect(student1Roster.careSummary.mealsCount).toBeGreaterThanOrEqual(1)
      expect(student1Roster.careSummary.napCount).toBeGreaterThanOrEqual(1)
      expect(student1Roster.careSummary.bathroomCount).toBeGreaterThanOrEqual(1)
    })
  })

  // =========================================================================
  // WORKFLOW 6: PLAYGROUND SAFETY INCIDENT & MANAGER ESCALATION
  // =========================================================================
  describe('Workflow 6: Playground Safety Incident & Escalation', () => {
    it('logs safety incident, publishes to parent timeline, and raises emergency follow-up to Principal', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/incidents`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${teacherACookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student1.id,
          category: 'INJURY',
          severity: 'HIGH',
          title: 'Minor scrape on right knee at outdoor slide',
          description: 'Tripped while stepping down from the low slide. Small scrape with minimal bleeding.',
          location: 'Outdoor Toddler Playground',
          actionTaken: 'Cleaned with antiseptic wash, applied adhesive bandage, monitored for 10 minutes.',
          witnesses: ['Ms. Sonal Roy', 'Ms. Kavita Nair'],
        }),
      })
      const res = await incidentPost(req)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.studentId).toBe(student1.id)
      expect(body.data.followUpId).toBeDefined()

      // Verify follow-up created in DB
      const followUp = await db.followUp.findUnique({
        where: { id: body.data.followUpId },
      })
      expect(followUp?.domain).toBe('SAFETY')
      expect(followUp?.severity).toBe('URGENT')
      expect(followUp?.responsibleRole).toBe('PRINCIPAL')

      // Verify audit trail logged
      const auditLog = await db.auditLog.findFirst({
        where: {
          tenantId: tenant.id,
          action: 'INCIDENT_CREATED',
          entityId: student1.id,
        },
      })
      expect(auditLog).not.toBeNull()
      expect(auditLog?.summary).toContain('Minor scrape')
    })
  })

  // =========================================================================
  // WORKFLOW 7: AFTERNOON PICKUP QUEUE & REAL-TIME STATUS
  // =========================================================================
  describe('Workflow 7: Afternoon Pickup Queue & Real-time Status', () => {
    it('lists children awaiting pickup with their registered guardians', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup?classroomId=${classroomA.id}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const res = await pickupGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.total).toBe(2)
      expect(body.data.items).toBeDefined()

      const s1 = body.data.items.find((i: any) => i.id === student1.id)
      expect(s1).toBeDefined()
      expect(s1.isPresent).toBe(true)
      expect(s1.status).toBe('WAITING_PICKUP')
      expect(s1.isPickedUp).toBe(false)
      expect(s1.guardians.length).toBeGreaterThanOrEqual(2)
    })
  })

  // =========================================================================
  // WORKFLOW 8: PICKUP AUTHORIZATION & PIN VERIFICATION (VALID & INVALID)
  // =========================================================================
  describe('Workflow 8: Pickup Authorization & PIN Verification', () => {
    it('blocks unauthorized pickup when wrong PIN is provided and raises emergency security alert', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student1.id,
          guardianId: guardianFather1.id,
          pin: '9999', // INCORRECT PIN (Actual is 5821)
          notes: 'Gate staff prompted for PIN',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/verification failed|incorrect or invalid/i)

      // Verify that security audit log was written for blocked pickup
      const blockedAudit = await db.auditLog.findFirst({
        where: {
          tenantId: tenant.id,
          action: 'PICKUP_BLOCKED',
          entityId: student1.id,
        },
      })
      expect(blockedAudit).not.toBeNull()
      expect(blockedAudit?.severity).toBe('CRITICAL')

      // Verify safety follow-up raised to Principal
      const emergencyAlert = await db.followUp.findFirst({
        where: {
          tenantId: tenant.id,
          studentId: student1.id,
          domain: 'SAFETY',
          title: { contains: 'Unauthorized pickup blocked' },
        },
      })
      expect(emergencyAlert).not.toBeNull()
      expect(emergencyAlert?.severity).toBe('EMERGENCY')
    })

    it('blocks pickup when an unapproved guardian attempts to release child', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student1.id,
          guardianId: guardianUnauthorized.id,
          pin: '5821',
          notes: 'Uncle Dev attempting pickup without authorization',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/not authorized|blocked/i)
    })

    it('successfully authorizes release when valid 4-digit PIN is provided by authorized guardian', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student1.id,
          guardianId: guardianFather1.id,
          pin: '5821', // CORRECT PIN
          notes: 'Verified father at gate',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.released).toBe(true)
      expect(body.data.status).toBe('MATCH')
      expect(body.data.guardianName).toBe('Rajesh Sharma')
      expect(body.data.studentName).toBe('Aarav Sharma')

      // Verify student status now transitions to RELEASED in pickup queue
      const qReq = new NextRequest(`http://localhost:3000/api/v1/operations/pickup?classroomId=${classroomA.id}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const qRes = await pickupGet(qReq)
      const qBody = await qRes.json()
      const s1After = qBody.data.items.find((i: any) => i.id === student1.id)
      expect(s1After.isPickedUp).toBe(true)
      expect(s1After.status).toBe('RELEASED')
    })
  })

  // =========================================================================
  // WORKFLOW 9: CONCURRENCY & DUPLICATE RELEASE PREVENTION
  // =========================================================================
  describe('Workflow 9: Concurrency & Duplicate Release Prevention', () => {
    it('strictly prevents duplicate release of a child already checked out', async () => {
      // Attempt to release student1 again on the same day
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student1.id,
          guardianId: guardianMother1.id,
          pin: '9432', // Mother's correct PIN
          notes: 'Mother arriving later unaware child was already released to father',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/already been released today/i)

      // Verify timeline only has 1 pickup entry
      const pickupCount = await db.timelineEntry.count({
        where: {
          tenantId: tenant.id,
          studentId: student1.id,
          type: 'PICKUP',
        },
      })
      expect(pickupCount).toBe(1)
    })
  })

  // =========================================================================
  // WORKFLOW 10: LATE PICKUP CALCULATION & FINANCE BILLING INTEGRATION
  // =========================================================================
  describe('Workflow 10: Late Pickup Policy & Auto-Billing Invoice Generation', () => {
    it('applies configured grace period before charging late pickup fees', async () => {
      // Normal pickup window ends at 16:30.
      // Pickup at 16:40 (10 mins late, within 15 mins grace period)
      const withinGrace = new Date()
      withinGrace.setHours(16, 40, 0, 0)
      const graceResult = await OperationPolicies.calculateLatePickup(tenant.id, withinGrace)
      expect(graceResult.isLate).toBe(false)
      expect(graceResult.chargeRupees).toBe(0)
      expect(graceResult.chargeCents).toBe(0)

      // Pickup at 17:15 (45 mins after cutoff -> 30 billable mins after 15 min grace -> 1 block of 30 mins)
      const late30 = new Date()
      late30.setHours(17, 15, 0, 0)
      const lateResult30 = await OperationPolicies.calculateLatePickup(tenant.id, late30)
      expect(lateResult30.isLate).toBe(true)
      expect(lateResult30.chargeRupees).toBe(100)
      expect(lateResult30.chargeCents).toBe(10000)

      // Pickup at 17:50 (80 mins after cutoff -> 65 billable mins -> 3 blocks of 30 mins -> ₹300)
      const late80 = new Date()
      late80.setHours(17, 50, 0, 0)
      const lateResult80 = await OperationPolicies.calculateLatePickup(tenant.id, late80)
      expect(lateResult80.isLate).toBe(true)
      expect(lateResult80.chargeRupees).toBe(300)
      expect(lateResult80.chargeCents).toBe(30000)
    })

    it('generates an official Finance Invoice when late pickup is recorded past grace cutoff', async () => {
      // Check in student2 for arrival first
      await OperationsService.recordArrival(
        {
          tenantId: tenant.id,
          branchId: branch.id,
          actorId: principalUser.id,
          actorName: principalUser.fullName,
          actorRole: 'PRINCIPAL',
        },
        { studentId: student2.id }
      )

      // Pickup student2 at 17:20 (past grace period)
      const latePickupTime = new Date()
      latePickupTime.setHours(17, 20, 0, 0)

      const pickupResult = await OperationsService.recordPickup(
        {
          tenantId: tenant.id,
          branchId: branch.id,
          actorId: principalUser.id,
          actorName: principalUser.fullName,
          actorRole: 'PRINCIPAL',
        },
        {
          studentId: student2.id,
          guardianId: guardianMother2.id,
          pin: '7654',
          pickupTime: latePickupTime,
          notes: 'Late pickup recorded after work delay',
        }
      )

      expect(pickupResult.success).toBe(true)
      expect(pickupResult.latePickup.isLate).toBe(true)
      expect(pickupResult.latePickup.chargeRupees).toBeGreaterThan(0)
      expect(pickupResult.invoiceId).not.toBeNull()

      // Verify the generated invoice in the Finance DB
      const invoice = await db.invoice.findUnique({
        where: { id: pickupResult.invoiceId! },
        include: { items: true },
      })
      expect(invoice).not.toBeNull()
      expect(invoice?.tenantId).toBe(tenant.id)
      expect(invoice?.studentId).toBe(student2.id)
      expect(invoice?.title).toMatch(/Late Pickup Fee/i)
      expect(invoice?.totalCents).toBe(pickupResult.latePickup.chargeCents)
      expect(invoice?.items.length).toBe(1)
      expect(invoice?.items[0].feeHead).toBe('LATE_FEE')
    })
  })

  // =========================================================================
  // WORKFLOW 11: END-OF-DAY PARENT REPORT & COMMAND CENTRE KPIs
  // =========================================================================
  describe('Workflow 11: End-of-Day Parent Daily Report & Command Centre KPIs', () => {
    it('aggregates complete daily timeline report for parent of student1', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/reports/daily?studentId=${student1.id}`, {
        headers: { cookie: `preone_session=${parentUser1Cookie}` },
      })
      const res = await dailyReportGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.student.id).toBe(student1.id)
      expect(body.data.student.name).toBe('Aarav Sharma')
      expect(body.data.student.classroom).toBe('Toddlers — Butterflies')
      expect(['PRESENT', 'LATE']).toContain(body.data.attendance)

      // Daily summary arrays
      expect(body.data.meals.length).toBeGreaterThanOrEqual(1)
      expect(body.data.naps.length).toBeGreaterThanOrEqual(1)
      expect(body.data.health.length).toBeGreaterThanOrEqual(1)
      expect(body.data.pickup).toMatch(/Released to/i)
      expect(body.data.timeline.length).toBeGreaterThanOrEqual(4)
    })

    it('restricts parent from viewing reports of unlinked children (403)', async () => {
      // Parent 2 attempting to view Student 1's report
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/reports/daily?studentId=${student1.id}`, {
        headers: { cookie: `preone_session=${parentUser2Cookie}` },
      })
      const res = await dailyReportGet(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/not authorized to access this child’s daily report/i)
    })

    it('aggregates live operational KPIs and exception queue in Command Centre Dashboard', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/today?branchId=${branch.id}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const res = await todayOpsGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.kpis).toBeDefined()
      expect(body.data.kpis.expectedChildren).toBeGreaterThanOrEqual(2)
      expect(body.data.kpis.checkedIn).toBeGreaterThanOrEqual(2)
      expect(body.data.kpis.checkedOut).toBeGreaterThanOrEqual(2)
      expect(body.data.kpis.healthAlerts).toBeGreaterThanOrEqual(1)
      expect(body.data.kpis.openIncidents).toBeGreaterThanOrEqual(1)

      // Verify sections breakdown
      expect(body.data.sections).toBeDefined()
      const toddlersSection = body.data.sections.find((s: any) => s.id === classroomA.id)
      expect(toddlersSection).toBeDefined()
      expect(toddlersSection.name).toBe('Toddlers — Butterflies')
      expect(toddlersSection.teacher).toBe(teacherA.fullName)

      // Verify exception lists
      expect(body.data.exceptions).toBeDefined()
      expect(body.data.exceptions.unresolvedTotal).toBeGreaterThanOrEqual(1)
    })
  })
})
