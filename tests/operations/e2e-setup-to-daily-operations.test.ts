import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { isoDate } from '@/lib/format'

// Setup & Core Engines
import { runValidation, goLive } from '@/lib/setup/validate'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { FamilyUserService } from '@/lib/users/family-user-service'
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

describe('PreOne — Complete End-to-End Preschool Lifecycle (Setup → Go-Live → Admissions → Daily Ops)', () => {
  const ts = `${Date.now()}`
  const todayStr = isoDate()

  // Setup entities
  let tenant: any
  let branch: any
  let academicSession: any
  let program: any
  let classroom: any
  let foreignClassroom: any

  // Users & Roles
  let ownerUser: any
  let ownerCookie: string

  let principalUser: any
  let principalCookie: string

  let teacherLead: any
  let teacherLeadCookie: string

  let teacherForeign: any
  let teacherForeignCookie: string

  let parentFatherUser: any
  let parentFatherCookie: string

  let parentMotherUser: any

  let thirdParentUser: any

  // Admissions & Student
  let draftApp: any
  let enrolledStudent: any
  let guardianFather: any
  let guardianMother: any
  let unauthorizedUncle: any

  beforeAll(async () => {
    // =========================================================================
    // STAGE 1: INITIAL SETUP PHASE (SCHOOL CREATION & CONFIGURATION)
    // =========================================================================

    // 1. Legal Entity & School Profile
    tenant = await db.tenant.create({
      data: {
        name: `Sunbeam International Preschool ${ts.slice(-4)}`,
        code: `SBP-${ts.slice(-4)}`,
        email: `info.sbp.${ts}@sunbeam.edu`,
        phone: `98765${ts.slice(-5)}`,
        address: '124 Lotus Valley Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        status: 'PENDING_ACTIVATION', // Will transition to ACTIVE on Go-Live
      },
    })

    // Setup tracker record
    await db.schoolSetup.create({
      data: {
        tenantId: tenant.id,
        status: 'IN_PROGRESS',
      },
    })

    // 2. Campus / Branch Infrastructure
    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Indiranagar Main Campus',
        code: `IND-${ts.slice(-4)}`,
        timingOpen: '08:00',
        timingClose: '18:00',
        isMain: true,
      },
    })

    // 3. Academic Year Session
    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: 'AY 2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    })

    // 4. Operational Schedules & Parent Policies
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
          lateArrivalRule: 'Arrivals after 09:30 AM are marked LATE.',
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
          maxParentsPerStudent: 2,
        },
      },
    })

    await db.schoolConfig.create({
      data: {
        tenantId: tenant.id,
        domain: 'HEALTH_SAFETY',
        data: {
          temperatureThresholdF: 99.5,
          feverIsolationThresholdF: 100.4,
          emergencyContacts: [
            { name: 'City Pediatric Emergency', phone: '080-25253636', type: 'HOSPITAL' },
          ],
          incidentCategories: ['INJURY', 'ILLNESS', 'BEHAVIOR', 'SAFETY'],
        },
      },
    })

    await db.schoolConfig.create({
      data: {
        tenantId: tenant.id,
        domain: 'DAILY_OPERATIONS',
        data: {
          attendanceEnabled: true,
          recordTypes: ['MEAL', 'NAP', 'BATHROOM', 'MOOD', 'ACTIVITY'],
        },
      },
    })

    // Active Subject / Activity
    await db.subject.create({
      data: {
        tenantId: tenant.id,
        name: 'Circle Time & Phonics',
        code: `CTP-${ts.slice(-4)}`,
        subjectType: 'CORE',
        status: 'ACTIVE',
      },
    })

    // Active Fee Plan
    await db.feePlan.create({
      data: {
        tenantId: tenant.id,
        programType: 'PLAYGROUP',
        name: 'Annual Playgroup Tuition Plan',
        totalAnnualCents: 6000000,
        isActive: true,
      },
    })

    // 5. Staff Users
    // A. School Owner
    ownerUser = await db.user.create({
      data: {
        email: `owner.e2e.${ts}@sunbeam.edu`,
        fullName: 'Dr. Vikram Malhotra (Owner)',
        username: `owner_e2e_${ts}`,
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
        email: `principal.e2e.${ts}@sunbeam.edu`,
        fullName: 'Mrs. Nandita Sen (Principal)',
        username: `principal_e2e_${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuPrinc = await db.tenantUser.create({
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
        tenantUserId: tuPrinc.id,
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

    // C. Lead Teacher
    teacherLead = await db.user.create({
      data: {
        email: `teacher.lead.${ts}@sunbeam.edu`,
        fullName: 'Ms. Meena Iyer (Lead Playgroup)',
        username: `teacher_lead_${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuTeach1 = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherLead.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant.id,
        tenantUserId: tuTeach1.id,
        branchId: branch.id,
        isPrimary: true,
      },
    })
    teacherLeadCookie = await signSession({
      uid: teacherLead.id,
      email: teacherLead.email,
      name: teacherLead.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })

    // D. Foreign Teacher (for classroom separation check)
    teacherForeign = await db.user.create({
      data: {
        email: `teacher.foreign.${ts}@sunbeam.edu`,
        fullName: 'Ms. Preeti Verma (Lead Nursery)',
        username: `teacher_foreign_${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuTeach2 = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherForeign.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        branchId: branch.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant.id,
        tenantUserId: tuTeach2.id,
        branchId: branch.id,
        isPrimary: true,
      },
    })
    teacherForeignCookie = await signSession({
      uid: teacherForeign.id,
      email: teacherForeign.email,
      name: teacherForeign.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'TEACHER',
      roles: ['TEACHER'],
    })

    // 6. Educational Programs & Classrooms
    program = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Toddler Playgroup',
        code: `PG-${ts.slice(-4)}`,
        programType: 'PLAYGROUP',
        ageMinMonths: 18,
        ageMaxMonths: 30,
        capacity: 25,
        isActive: true,
      },
    })

    await db.programBranch.create({
      data: {
        tenantId: tenant.id,
        programId: program.id,
        branchId: branch.id,
        capacity: 25,
        isActive: true,
      },
    })

    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        programId: program.id,
        programType: 'PLAYGROUP',
        name: 'Bumblebees (Playgroup A)',
        code: `PG-BUM-${ts.slice(-4)}`,
        capacity: 15,
        primaryTeacherId: teacherLead.id,
        isActive: true,
      },
    })

    foreignClassroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: academicSession.id,
        programId: program.id,
        programType: 'PLAYGROUP',
        name: 'Butterflies (Playgroup B)',
        code: `PG-BUT-${ts.slice(-4)}`,
        capacity: 15,
        primaryTeacherId: teacherForeign.id,
        isActive: true,
      },
    })
  })

  // =========================================================================
  // STAGE 1 VALIDATION: GO-LIVE READINESS
  // =========================================================================
  describe('Stage 1: Setup Validation & Go-Live State Machine', () => {
    it('validates setup integrity across operating campuses and executes Go-Live', async () => {
      // Run validation engine
      const validation = await runValidation(tenant.id)
      expect(validation).not.toBeNull()
      expect(validation?.overall).not.toBe('BLOCKED')

      // Execute goLive transition
      const goLiveResult = await goLive(tenant.id, { id: ownerUser.id, name: ownerUser.fullName })
      expect(goLiveResult.ok).toBe(true)

      // Verify school status is now LIVE & ACTIVE
      const activeTenant = await db.tenant.findUnique({ where: { id: tenant.id } })
      expect(activeTenant?.status).toBe('ACTIVE')

      const activeSetup = await db.schoolSetup.findUnique({ where: { tenantId: tenant.id } })
      expect(activeSetup?.status).toBe('LIVE')
      expect(activeSetup?.goLiveAt).not.toBeNull()
    })
  })

  // =========================================================================
  // STAGE 2: ADMISSIONS, ENROLLMENT & FAMILY ACCOUNTS
  // =========================================================================
  describe('Stage 2: Admissions & Enrollment Lifecycle', () => {
    it('creates admission application, accepts offer, and enrolls student into classroom', async () => {
      // 1. Submit application
      draftApp = await db.admissionApplication.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          academicSessionId: academicSession.id,
          applicationNumber: `APP-${ts.slice(-4)}`,
          programType: 'PLAYGROUP',
          childFirstName: 'Vihaan',
          childLastName: 'Verma',
          childDob: new Date('2023-05-15'),
          childGender: 'MALE',
          parentName: 'Sanjay Verma',
          parentEmail: `sanjay.verma.${ts}@example.com`,
          parentPhone: `98100${ts.slice(-5)}`,
          status: 'OFFER_ACCEPTED', // Document verification & offer accepted
        },
      })

      // 2. Complete enrollment via AdmissionService
      const enrollment = await AdmissionService.completeEnrollment(
        {
          tenantId: tenant.id,
          branchId: branch.id,
          academicYearId: academicSession.id,
          actorId: principalUser.id,
          actorName: principalUser.fullName,
          actorRole: 'PRINCIPAL',
        },
        draftApp.id,
        classroom.id
      )

      expect(enrollment).toBeDefined()
      expect(enrollment.student).toBeDefined()
      expect(enrollment.student.firstName).toBe('Vihaan')
      expect(enrollment.student.lastName).toBe('Verma')
      expect(enrollment.student.currentClassroomId).toBe(classroom.id)
      expect(enrollment.student.status).toBe('ACTIVE')

      enrolledStudent = enrollment.student
      parentFatherUser = enrollment.parentUser

      // Activate Father's membership account
      await db.tenantUser.updateMany({
        where: { userId: parentFatherUser.id, tenantId: tenant.id },
        data: { status: 'ACTIVE' },
      })

      // Setup Parent Father login cookie
      parentFatherCookie = await signSession({
        uid: parentFatherUser.id,
        email: parentFatherUser.email,
        name: parentFatherUser.fullName,
        tenantId: tenant.id,
        branchId: branch.id,
        role: 'PARENT',
        roles: ['PARENT'],
      })
    })

    it('provisions secure 4-digit pickup PINs for guardians and links family members', async () => {
      // 1. Setup Father Guardian with PIN 7429
      guardianFather = await db.guardian.findFirst({
        where: { userId: parentFatherUser.id, tenantId: tenant.id },
      })
      expect(guardianFather).not.toBeNull()

      await db.guardian.update({
        where: { id: guardianFather.id },
        data: {
          pickupPin: '7429', // Valid 4-digit security PIN
        },
      })
      await db.studentGuardian.updateMany({
        where: { studentId: enrolledStudent.id, guardianId: guardianFather.id },
        data: {
          canPickup: true,
          pickupStatus: 'AUTHORIZED',
          pickupPin: '7429',
        },
      })

      // 2. Add Mother as Second Parent Account (PIN 3185)
      parentMotherUser = await db.user.create({
        data: {
          email: `priya.verma.${ts}@example.com`,
          fullName: 'Priya Verma',
          username: `priya_verma_${ts}`,
          passwordHash: 'dummy',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: parentMotherUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          branchId: branch.id,
          status: 'ACTIVE',
        },
      })
      guardianMother = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: parentMotherUser.id,
          fullName: 'Priya Verma',
          relationship: 'MOTHER',
          phone: `98200${ts.slice(-5)}`,
          email: parentMotherUser.email,
          pickupPin: '3185',
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: enrolledStudent.id,
          guardianId: guardianMother.id,
          isPrimary: false,
          canPickup: true,
          pickupStatus: 'AUTHORIZED',
          pickupPin: '3185',
        },
      })

      // 3. Add Unauthorized Relative (Dev Anand, canPickup: false)
      unauthorizedUncle = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          fullName: 'Dev Anand',
          relationship: 'OTHER',
          phone: `98300${ts.slice(-5)}`,
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: enrolledStudent.id,
          guardianId: unauthorizedUncle.id,
          isPrimary: false,
          canPickup: false,
          pickupStatus: 'NOT_AUTHORIZED',
        },
      })
    })

    it('enforces maximum 2-parent accounts rule per student', async () => {
      // Attempting to register a 3rd parent user for Vihaan
      thirdParentUser = await db.user.create({
        data: {
          email: `third.parent.${ts}@example.com`,
          fullName: 'Third Guardian Account',
          username: `third_parent_${ts}`,
          passwordHash: 'dummy',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: thirdParentUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          branchId: branch.id,
          status: 'ACTIVE',
        },
      })
      await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: thirdParentUser.id,
          fullName: thirdParentUser.fullName,
          relationship: 'GUARDIAN',
          phone: `98500${ts.slice(-5)}`,
        },
      })

      const ctx = {
        tenantId: tenant.id,
        actorId: principalUser.id,
        actorName: principalUser.fullName,
        actorRole: 'PRINCIPAL',
        actorBranchId: branch.id,
      }

      // Linking 3rd parent must be blocked
      await expect(
        FamilyUserService.linkStudentToGuardian(ctx, {
          userId: thirdParentUser.id,
          studentId: enrolledStudent.id,
          relationship: 'GUARDIAN',
        })
      ).rejects.toThrow(/already has 2 registered Parent accounts/i)
    })
  })

  // =========================================================================
  // STAGE 3: MORNING GATE OPERATIONS (SCAN & ARRIVAL)
  // =========================================================================
  describe('Stage 3: Morning Gate Operations (Scan & Arrival)', () => {
    it('scans student at gate, resolves room and authorized guardians with PIN readiness', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan?code=${enrolledStudent.admissionNo}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const res = await scanGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.student.id).toBe(enrolledStudent.id)
      expect(body.data.student.name).toBe('Vihaan Verma')
      expect(body.data.student.classroom).toBe('Bumblebees (Playgroup A)')
      expect(body.data.student.teacher).toBe(teacherLead.fullName)
      expect(body.data.student.isPickedUp).toBe(false)

      const guardians = body.data.student.guardians
      expect(guardians.length).toBeGreaterThanOrEqual(2)
      const fatherG = guardians.find((g: any) => g.name === 'Sanjay Verma')
      expect(fatherG.canPickup).toBe(true)
      expect(fatherG.hasPin).toBe(true)
    })

    it('records morning gate arrival check-in and enforces idempotency', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/scan`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'ARRIVAL',
          code: enrolledStudent.admissionNo,
          notes: 'Dropped off by father at front porch',
        }),
      })

      // 1. First Scan
      const res1 = await scanPost(req)
      expect(res1.status).toBe(200)
      const body1 = await res1.json()
      expect(body1.data.success).toBe(true)
      expect(body1.data.studentId).toBe(enrolledStudent.id)
      expect(body1.data.isRepeatScan).toBe(false)
      expect(['PRESENT', 'LATE']).toContain(body1.data.status)

      // 2. Second Scan (Idempotent) with fresh request stream
      const req2 = new NextRequest(`http://localhost:3000/api/v1/operations/scan`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'ARRIVAL',
          code: enrolledStudent.admissionNo,
          notes: 'Accidental duplicate tap at gate',
        }),
      })
      const res2 = await scanPost(req2)
      expect(res2.status).toBe(200)
      const body2 = await res2.json()
      expect(body2.data.success).toBe(true)
      expect(body2.data.isRepeatScan).toBe(true)

      // Verify only 1 timeline entry in DB
      const timelineCount = await db.timelineEntry.count({
        where: { tenantId: tenant.id, studentId: enrolledStudent.id, type: 'ARRIVAL' },
      })
      expect(timelineCount).toBe(1)
    })
  })

  // =========================================================================
  // STAGE 4: MORNING HEALTH SCREENING & TRIAGE
  // =========================================================================
  describe('Stage 4: Morning Health Screening & Triage', () => {
    it('records health screening with fever, creating an urgent isolation ticket for Principal', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/health`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: enrolledStudent.id,
          outcome: 'ISOLATE',
          temperature: 101.4,
          symptoms: ['Fever', 'Mild Cough'],
          notes: 'Child feels warm. Escorted to sick bay isolation cot.',
        }),
      })
      const res = await healthPost(req)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.outcome).toBe('ISOLATE')
      expect(body.data.followUpId).not.toBeNull()

      // Verify urgent follow-up exists in DB assigned to Principal
      const followUp = await db.followUp.findUnique({ where: { id: body.data.followUpId } })
      expect(followUp?.domain).toBe('HEALTH')
      expect(['URGENT', 'EMERGENCY']).toContain(followUp!.severity)
      expect(followUp?.responsibleRole).toBe('PRINCIPAL')

      // Verify exception appears in Command Centre exceptions queue
      const exReq = new NextRequest(`http://localhost:3000/api/v1/operations/exceptions`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const exRes = await exceptionsGet(exReq)
      const exBody = await exRes.json()
      const item = exBody.data.items.find((i: any) => i.id === body.data.followUpId)
      expect(item).toBeDefined()
      expect(item.student).toBe('Vihaan Verma')
    })
  })

  // =========================================================================
  // STAGE 5: CLASSROOM ROSTER & DAILY CARE SHEET INTAKE
  // =========================================================================
  describe('Stage 5: Classroom Operational Board & Care Sheets', () => {
    it('enforces teacher RBAC: foreign teacher is blocked from viewing classroom board (403)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/classrooms/${classroom.id}`, {
        headers: { cookie: `preone_session=${teacherForeignCookie}` },
      })
      const res = await classroomBoardGet(req, { params: Promise.resolve({ id: classroom.id }) })
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/authorized to access your assigned classroom/i)
    })

    it('assigned teacher views roster and logs batch daily care sheet entries', async () => {
      // 1. Lead Teacher loads room board
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/classrooms/${classroom.id}`, {
        headers: { cookie: `preone_session=${teacherLeadCookie}` },
      })
      const res = await classroomBoardGet(req, { params: Promise.resolve({ id: classroom.id }) })
      expect(res.status).toBe(200)

      // 2. Batch log care entries (Meal, Nap, Potty, Activity)
      const ctx = {
        tenantId: tenant.id,
        branchId: branch.id,
        actorId: teacherLead.id,
        actorName: teacherLead.fullName,
        actorRole: 'TEACHER',
      }

      const careItems = [
        {
          studentId: enrolledStudent.id,
          type: 'MEAL' as const,
          title: 'Morning Fruit Snack — Papaya & Coconut Water',
          body: 'Ate full portion cheerfully',
          mood: 'HAPPY',
        },
        {
          studentId: enrolledStudent.id,
          type: 'NAP' as const,
          title: 'Midday Nap Routine',
          body: 'Slept soundly on cot for 45 minutes',
          durationMinutes: 45,
          mood: 'CALM',
        },
        {
          studentId: enrolledStudent.id,
          type: 'BATHROOM' as const,
          title: 'Potty Training Routine',
          body: 'Used potty independently with handwashing',
        },
        {
          studentId: enrolledStudent.id,
          type: 'ACTIVITY' as const,
          title: 'Sensory Sand & Water Play',
          body: 'Explored textured measuring cups and colored water',
        },
      ]

      const careResult = await OperationsService.recordClassroomCare(ctx, careItems)
      expect(careResult.recordedCount).toBe(4)

      // 3. Verify classroom operational board reflects updated counters
      const updatedRes = await classroomBoardGet(req, { params: Promise.resolve({ id: classroom.id }) })
      const updatedBody = await updatedRes.json()
      const vihaanRoster = updatedBody.data.students.find((s: any) => s.id === enrolledStudent.id)
      expect(vihaanRoster.careSummary.mealsCount).toBe(1)
      expect(vihaanRoster.careSummary.napCount).toBe(1)
      expect(vihaanRoster.careSummary.bathroomCount).toBe(1)
    })
  })

  // =========================================================================
  // STAGE 6: PLAYGROUND SAFETY INCIDENT & AUDIT LOGGING
  // =========================================================================
  describe('Stage 6: Safety Incident & Immediate Escalation', () => {
    it('records playground injury, creates urgent safety ticket, and logs immutable audit trail', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/incidents`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${teacherLeadCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: enrolledStudent.id,
          category: 'INJURY',
          severity: 'HIGH',
          title: 'Minor scrape on left elbow at outdoor sandpit',
          description: 'Tripped over sand toy while playing. Mild scrape with slight bleeding.',
          location: 'Outdoor Toddler Sandpit',
          actionTaken: 'Washed with saline, applied antiseptic cream and sterile bandage. Child comforted.',
          witnesses: ['Ms. Meena Iyer'],
        }),
      })
      const res = await incidentPost(req)
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.followUpId).toBeDefined()

      // Verify Safety Follow-Up
      const safetyTicket = await db.followUp.findUnique({ where: { id: body.data.followUpId } })
      expect(safetyTicket?.domain).toBe('SAFETY')
      expect(safetyTicket?.severity).toBe('URGENT')
      expect(safetyTicket?.responsibleRole).toBe('PRINCIPAL')

      // Verify Audit Log
      const auditLog = await db.auditLog.findFirst({
        where: { tenantId: tenant.id, action: 'INCIDENT_CREATED', entityId: enrolledStudent.id },
      })
      expect(auditLog).not.toBeNull()
      expect(auditLog?.summary).toContain('Minor scrape')
    })
  })

  // =========================================================================
  // STAGE 7: AFTERNOON DISMISSAL, PIN VERIFICATION & REPEAT PROTECTION
  // =========================================================================
  describe('Stage 7: Afternoon Dismissal, 4-Digit Security PIN & Duplicate Protection', () => {
    it('verifies student presence in dismissal queue awaiting collection', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup?classroomId=${classroom.id}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const res = await pickupGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      const v = body.data.items.find((i: any) => i.id === enrolledStudent.id)
      expect(v).toBeDefined()
      expect(v.status).toBe('WAITING_PICKUP')
      expect(v.isPickedUp).toBe(false)
    })

    it('blocks release on incorrect PIN and raises an emergency security alert', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: enrolledStudent.id,
          guardianId: guardianFather.id,
          pin: '9999', // INCORRECT (actual is 7429)
          notes: 'Gate staff prompted for PIN',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/verification failed|incorrect or invalid/i)

      // Verify emergency safety follow-up generated
      const secAlert = await db.followUp.findFirst({
        where: {
          tenantId: tenant.id,
          studentId: enrolledStudent.id,
          title: { contains: 'Unauthorized pickup blocked' },
        },
      })
      expect(secAlert).not.toBeNull()
      expect(secAlert?.severity).toBe('EMERGENCY')
    })

    it('blocks pickup by unapproved relative (canPickup: false)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: enrolledStudent.id,
          guardianId: unauthorizedUncle.id,
          pin: '7429',
          notes: 'Uncle Dev attempting collection',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/not authorized|blocked/i)
    })

    it('successfully authorizes release when valid 4-digit PIN is provided by father', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: enrolledStudent.id,
          guardianId: guardianFather.id,
          pin: '7429', // CORRECT PIN
          notes: 'Verified father Sanjay Verma at gate',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(body.data.released).toBe(true)
      expect(body.data.status).toBe('MATCH')
      expect(body.data.guardianName).toBe('Sanjay Verma')
      expect(body.data.studentName).toBe('Vihaan Verma')

      // Verify pickup queue status transitions to RELEASED
      const qReq = new NextRequest(`http://localhost:3000/api/v1/operations/pickup?classroomId=${classroom.id}`, {
        headers: { cookie: `preone_session=${principalCookie}` },
      })
      const qRes = await pickupGet(qReq)
      const qBody = await qRes.json()
      const vAfter = qBody.data.items.find((i: any) => i.id === enrolledStudent.id)
      expect(vAfter.isPickedUp).toBe(true)
      expect(vAfter.status).toBe('RELEASED')
    })

    it('strictly prevents duplicate release of a child already checked out', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/pickup`, {
        method: 'POST',
        headers: {
          cookie: `preone_session=${principalCookie}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: enrolledStudent.id,
          guardianId: guardianMother.id,
          pin: '3185', // Mother's correct PIN
          notes: 'Mother arriving later unaware child was already released to father',
        }),
      })
      const res = await pickupPost(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/already been released today/i)
    })
  })

  // =========================================================================
  // STAGE 8: LATE PICKUP POLICY & AUTOMATED BILLING INVOICE
  // =========================================================================
  describe('Stage 8: Late Pickup Calculation & Automated Finance Billing', () => {
    it('calculates late fee past 15-min grace window and auto-drafts Finance Invoice', async () => {
      // 1. Policy calculation test: 17:15 (45m late, 30m billable after 15m grace = ₹100)
      const lateTime = new Date()
      lateTime.setHours(17, 15, 0, 0)
      const calc = await OperationPolicies.calculateLatePickup(tenant.id, lateTime)
      expect(calc.isLate).toBe(true)
      expect(calc.lateMinutes).toBe(45)
      expect(calc.chargeRupees).toBe(100)
      expect(calc.chargeCents).toBe(10000)

      // 2. Test real invoice generation on late release for another active student
      const student2 = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          currentClassroomId: classroom.id,
          firstName: 'Ananya',
          lastName: 'Rao',
          dob: new Date('2023-08-10'),
          gender: 'FEMALE',
          admissionNo: `ADM-E2E-02-${ts.slice(-3)}`,
          status: 'ACTIVE',
        },
      })

      const gMother2 = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          fullName: 'Kavita Rao',
          relationship: 'MOTHER',
          phone: `98400${ts.slice(-5)}`,
          pickupPin: '6521',
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: student2.id,
          guardianId: gMother2.id,
          canPickup: true,
          pickupStatus: 'AUTHORIZED',
          pickupPin: '6521',
        },
      })

      // Arrival check-in
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

      // Late pickup at 17:25 (55 mins past window, 40 mins billable = 2 blocks = ₹200)
      const latePickupTime = new Date()
      latePickupTime.setHours(17, 25, 0, 0)

      const lateReleaseResult = await OperationsService.recordPickup(
        {
          tenantId: tenant.id,
          branchId: branch.id,
          actorId: principalUser.id,
          actorName: principalUser.fullName,
          actorRole: 'PRINCIPAL',
        },
        {
          studentId: student2.id,
          guardianId: gMother2.id,
          pin: '6521',
          pickupTime: latePickupTime,
          notes: 'Late pickup past grace window',
        }
      )

      expect(lateReleaseResult.success).toBe(true)
      expect(lateReleaseResult.latePickup.isLate).toBe(true)
      expect(lateReleaseResult.latePickup.chargeRupees).toBe(200)
      expect(lateReleaseResult.invoiceId).not.toBeNull()

      // Verify invoice stored in Finance database
      const inv = await db.invoice.findUnique({
        where: { id: lateReleaseResult.invoiceId! },
        include: { items: true },
      })
      expect(inv).not.toBeNull()
      expect(inv?.studentId).toBe(student2.id)
      expect(inv?.totalCents).toBe(20000)
      expect(inv?.items[0].feeHead).toBe('LATE_FEE')
    })
  })

  // =========================================================================
  // STAGE 9: EOD COMMAND CENTRE & PARENT DAILY REPORT
  // =========================================================================
  describe('Stage 9: End-of-Day Command Centre Reconciliation & Parent Report', () => {
    it('aggregates live operational KPIs and exception feeds in Command Centre', async () => {
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
      const section = body.data.sections.find((s: any) => s.id === classroom.id)
      expect(section).toBeDefined()
      expect(section.name).toBe('Bumblebees (Playgroup A)')
      expect(section.teacher).toBe(teacherLead.fullName)
    })

    it('parent views consolidated end-of-day daily report with all care routines and pickup release', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/operations/reports/daily?studentId=${enrolledStudent.id}`, {
        headers: { cookie: `preone_session=${parentFatherCookie}` },
      })
      const res = await dailyReportGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.data.student.id).toBe(enrolledStudent.id)
      expect(body.data.student.name).toBe('Vihaan Verma')
      expect(body.data.student.classroom).toBe('Bumblebees (Playgroup A)')
      expect(['PRESENT', 'LATE']).toContain(body.data.attendance)

      // Verified care entries
      expect(body.data.meals.length).toBeGreaterThanOrEqual(1)
      expect(body.data.naps.length).toBeGreaterThanOrEqual(1)
      expect(body.data.health.length).toBeGreaterThanOrEqual(1)
      expect(body.data.pickup).toMatch(/Released to/i)
      expect(body.data.timeline.length).toBeGreaterThanOrEqual(4)
    })

    it('unlinked parent is strictly forbidden from viewing another child daily report (403)', async () => {
      // Create foreign parent user
      const foreignParentUser = await db.user.create({
        data: {
          email: `foreign.parent.${ts}@example.com`,
          fullName: 'Foreign Parent',
          username: `foreign_parent_${ts}`,
          passwordHash: 'dummy',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: foreignParentUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          branchId: branch.id,
          status: 'ACTIVE',
        },
      })
      const foreignParentCookie = await signSession({
        uid: foreignParentUser.id,
        email: foreignParentUser.email,
        name: foreignParentUser.fullName,
        tenantId: tenant.id,
        branchId: branch.id,
        role: 'PARENT',
        roles: ['PARENT'],
      })

      const req = new NextRequest(`http://localhost:3000/api/v1/operations/reports/daily?studentId=${enrolledStudent.id}`, {
        headers: { cookie: `preone_session=${foreignParentCookie}` },
      })
      const res = await dailyReportGet(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error?.message || JSON.stringify(body)).toMatch(/not authorized to access this child’s daily report/i)
    })
  })
})
