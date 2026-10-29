import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { POST as createObservation, GET as listObservations } from '@/app/api/v1/observations/route'
import { POST as publishObservation } from '@/app/api/v1/observations/[id]/publish/route'
import { GET as getObservation, PATCH as updateObservation, DELETE as deleteObservation } from '@/app/api/v1/observations/[id]/route'
import { GET as getNotifications } from '@/app/api/v1/notifications/route'
import { GET as getUnreadCount } from '@/app/api/v1/notifications/unread-count/route'
import { PATCH as markNotificationRead } from '@/app/api/v1/notifications/[id]/read/route'
import { POST as markAllNotificationsRead } from '@/app/api/v1/notifications/mark-all-read/route'
import { GET as getStudent } from '@/app/api/v1/students/[id]/route'
import { POST as testNotificationGateway } from '@/app/api/v1/setup/notifications/test/route'
import { POST as n8nCallback, _testClearCallbackCache } from '@/app/api/v1/integrations/n8n/callback/route'
import { POST as paymentWebhook } from '@/app/api/v1/payments/webhook/route'
import { generateHmacSignature, N8N_WEBHOOK_SECRET } from '@/lib/integrations/n8n'
import { NotificationEngine } from '@/lib/notifications/notification-engine'
import { RecipientResolver } from '@/lib/notifications/recipient-resolver'
import { registerNotificationListeners } from '@/lib/notifications/event-listeners'
import { StudentService } from '@/lib/students/student-service'

/**
 * PRE1-NOTIFICATIONS-AUDIT-001
 * Comprehensive Notification, Observation Inbox, RBAC, Integrations & Delivery Reliability Test Suite
 */
describe('PRE1-NOTIFICATIONS-AUDIT-001: Notifications & Integrations Reliability Suite', () => {
  const timestamp = Date.now()
  const tenantACode = `NOTIF_TA_${timestamp}`
  const tenantBCode = `NOTIF_TB_${timestamp}`

  let tenantAId = ''
  let tenantBId = ''
  let branchA1Id = ''
  let branchA2Id = ''
  let branchB1Id = ''

  let classroomA1Id = ''
  let classroomA2Id = ''

  let teacherA1Token = ''
  let teacherA1UserId = ''
  let teacherA2Token = ''
  let parentA1Token = ''
  let parentA1UserId = ''
  let parentA1GuardianId = ''
  let parentA2Token = ''
  let parentA2UserId = ''
  let coordinatorAToken = ''
  let ownerAToken = ''
  let ownerBToken = ''

  let studentA1Id = ''
  let studentA2Id = ''
  let studentB1Id = ''

  let createdObservationId = ''
  let publishedTimelineEntryId = ''
  let inAppNotificationId = ''

  beforeAll(async () => {
    registerNotificationListeners()

    // 1. Create Tenant A with 2 branches
    const tenantA = await db.tenant.create({
      data: { name: 'Acme Preschool A', code: tenantACode, status: 'ACTIVE' },
    })
    tenantAId = tenantA.id

    const branchA1 = await db.branch.create({
      data: { tenantId: tenantAId, name: 'Main Campus', code: `MA1_${timestamp}`, isMain: true },
    })
    branchA1Id = branchA1.id

    const branchA2 = await db.branch.create({
      data: { tenantId: tenantAId, name: 'North Campus', code: `NA2_${timestamp}`, isMain: false },
    })
    branchA2Id = branchA2.id

    // 2. Create Tenant B with 1 branch
    const tenantB = await db.tenant.create({
      data: { name: 'Beta Preschool B', code: tenantBCode, status: 'ACTIVE' },
    })
    tenantBId = tenantB.id

    const branchB1 = await db.branch.create({
      data: { tenantId: tenantBId, name: 'Beta Campus', code: `BB1_${timestamp}`, isMain: true },
    })
    branchB1Id = branchB1.id

    // 2b. Academic Session
    const sessionA = await db.academicSession.create({
      data: {
        tenantId: tenantAId,
        name: `AY 2026-2027 ${timestamp}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    })

    // 3. Classrooms
    const classA1 = await db.classroom.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA1Id,
        academicSessionId: sessionA.id,
        name: 'Butterflies',
        code: `CLS_A1_${timestamp}`,
        programType: 'NURSERY',
        capacity: 20,
      },
    })
    classroomA1Id = classA1.id

    const classA2 = await db.classroom.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA2Id,
        academicSessionId: sessionA.id,
        name: 'Sunflowers',
        code: `CLS_A2_${timestamp}`,
        programType: 'PLAYGROUP',
        capacity: 20,
      },
    })
    classroomA2Id = classA2.id

    // 4. Users & Staff
    // Teacher A1 (Branch A1)
    const userTeacherA1 = await db.user.create({
      data: { email: `teacher_a1_${timestamp}@test.pre1`, fullName: 'Teacher A1', passwordHash: 'hash' },
    })
    teacherA1UserId = userTeacherA1.id
    const tuTeacherA1 = await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userTeacherA1.id, role: 'TEACHER', branchId: branchA1Id, status: 'ACTIVE' },
    })
    const spTeacherA1 = await db.staffProfile.create({
      data: {
        tenantId: tenantAId,
        userId: userTeacherA1.id,
        branchId: branchA1Id,
        employeeCode: `EMP_T1_${timestamp}`,
        designation: 'TEACHER',
        status: 'ACTIVE',
      },
    })
    teacherA1Token = await signSession({
      uid: userTeacherA1.id,
      email: userTeacherA1.email!,
      name: userTeacherA1.fullName,
      tenantId: tenantAId,
      branchId: branchA1Id,
      role: 'TEACHER',
    })

    // Teacher A2 (Branch A2)
    const userTeacherA2 = await db.user.create({
      data: { email: `teacher_a2_${timestamp}@test.pre1`, fullName: 'Teacher A2', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userTeacherA2.id, role: 'TEACHER', branchId: branchA2Id, status: 'ACTIVE' },
    })
    teacherA2Token = await signSession({
      uid: userTeacherA2.id,
      email: userTeacherA2.email!,
      name: userTeacherA2.fullName,
      tenantId: tenantAId,
      branchId: branchA2Id,
      role: 'TEACHER',
    })

    // Coordinator A
    const userCoordA = await db.user.create({
      data: { email: `coord_a_${timestamp}@test.pre1`, fullName: 'Coordinator A', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userCoordA.id, role: 'COORDINATOR', branchId: branchA1Id, status: 'ACTIVE' },
    })
    coordinatorAToken = await signSession({
      uid: userCoordA.id,
      email: userCoordA.email!,
      name: userCoordA.fullName,
      tenantId: tenantAId,
      branchId: branchA1Id,
      role: 'COORDINATOR',
    })

    // Owner A
    const userOwnerA = await db.user.create({
      data: { email: `owner_a_${timestamp}@test.pre1`, fullName: 'Owner A', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userOwnerA.id, role: 'OWNER', status: 'ACTIVE' },
    })
    ownerAToken = await signSession({
      uid: userOwnerA.id,
      email: userOwnerA.email!,
      name: userOwnerA.fullName,
      tenantId: tenantAId,
      role: 'OWNER',
    })

    // Owner B (Tenant B)
    const userOwnerB = await db.user.create({
      data: { email: `owner_b_${timestamp}@test.pre1`, fullName: 'Owner B', passwordHash: 'hash' },
    })
    await db.tenantUser.create({
      data: { tenantId: tenantBId, userId: userOwnerB.id, role: 'OWNER', status: 'ACTIVE' },
    })
    ownerBToken = await signSession({
      uid: userOwnerB.id,
      email: userOwnerB.email!,
      name: userOwnerB.fullName,
      tenantId: tenantBId,
      role: 'OWNER',
    })

    // 5. Students
    const studentA1 = await db.student.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA1Id,
        currentClassroomId: classroomA1Id,
        firstName: 'Aarav',
        lastName: 'Sharma',
        admissionNo: `ADM_A1_${timestamp}`,
        dob: new Date('2021-05-10'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })
    studentA1Id = studentA1.id

    const studentA2 = await db.student.create({
      data: {
        tenantId: tenantAId,
        branchId: branchA2Id,
        currentClassroomId: classroomA2Id,
        firstName: 'Anaya',
        lastName: 'Patel',
        admissionNo: `ADM_A2_${timestamp}`,
        dob: new Date('2021-08-15'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })
    studentA2Id = studentA2.id

    const studentB1 = await db.student.create({
      data: {
        tenantId: tenantBId,
        branchId: branchB1Id,
        firstName: 'Reyansh',
        lastName: 'Verma',
        admissionNo: `ADM_B1_${timestamp}`,
        dob: new Date('2021-02-20'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })
    studentB1Id = studentB1.id

    // 6. Parents & Guardians
    // Parent A1 (linked to Student A1)
    const userParentA1 = await db.user.create({
      data: { email: `parent_a1_${timestamp}@test.pre1`, fullName: 'Priya Sharma', passwordHash: 'hash', phone: '9876543210' },
    })
    parentA1UserId = userParentA1.id
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userParentA1.id, role: 'PARENT', status: 'ACTIVE' },
    })
    const guardianA1 = await db.guardian.create({
      data: {
        tenantId: tenantAId,
        userId: userParentA1.id,
        fullName: 'Priya Sharma',
        relationship: 'MOTHER',
        phone: '9876543210',
        email: userParentA1.email,
        isPrimaryContact: true,
      },
    })
    parentA1GuardianId = guardianA1.id
    await db.studentGuardian.create({
      data: {
        studentId: studentA1Id,
        guardianId: guardianA1.id,
        relationship: 'MOTHER',
        isPrimary: true,
        receivesComm: true,
      },
    })
    parentA1Token = await signSession({
      uid: userParentA1.id,
      email: userParentA1.email!,
      name: userParentA1.fullName,
      tenantId: tenantAId,
      role: 'PARENT',
    })

    // Parent A2 (linked to Student A2)
    const userParentA2 = await db.user.create({
      data: { email: `parent_a2_${timestamp}@test.pre1`, fullName: 'Rohan Patel', passwordHash: 'hash', phone: '9876543211' },
    })
    parentA2UserId = userParentA2.id
    await db.tenantUser.create({
      data: { tenantId: tenantAId, userId: userParentA2.id, role: 'PARENT', status: 'ACTIVE' },
    })
    const guardianA2 = await db.guardian.create({
      data: {
        tenantId: tenantAId,
        userId: userParentA2.id,
        fullName: 'Rohan Patel',
        relationship: 'FATHER',
        phone: '9876543211',
        email: userParentA2.email,
        isPrimaryContact: true,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA2Id,
        guardianId: guardianA2.id,
        relationship: 'FATHER',
        isPrimary: true,
        receivesComm: true,
      },
    })
    parentA2Token = await signSession({
      uid: userParentA2.id,
      email: userParentA2.email!,
      name: userParentA2.fullName,
      tenantId: tenantAId,
      role: 'PARENT',
    })
  })

  afterAll(async () => {
    // Clean up test data
    try {
      await db.inAppNotification.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.notificationDeliveryLog.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.timelineEntry.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.observation.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.studentGuardian.deleteMany({ where: { studentId: { in: [studentA1Id, studentA2Id, studentB1Id] } } })
      await db.guardian.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.student.deleteMany({ where: { id: { in: [studentA1Id, studentA2Id, studentB1Id] } } })
      await db.classroom.deleteMany({ where: { id: { in: [classroomA1Id, classroomA2Id] } } })
      await db.staffProfile.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.tenantUser.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.branch.deleteMany({ where: { id: { in: [branchA1Id, branchA2Id, branchB1Id] } } })
      await db.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } })
    } catch {}
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. OBSERVATION CREATION, PUBLISHING & PARENT NOTIFICATION DISPATCH
  // ──────────────────────────────────────────────────────────────────────────
  describe('Workflow: Observation Creation → Publishing → Notification Delivery', () => {
    it('Scenario 1: Teacher A1 creates a valid Observation for Student A1 (status DRAFT)', async () => {
      const narrative = 'Aarav showed excellent fine motor skills during the bead-stringing and puzzle activity today.'
      const req = new NextRequest('http://localhost:3000/api/v1/observations', {
        method: 'POST',
        headers: {
          cookie: `preone_session=${teacherA1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentA1Id,
          narrative,
          category: 'Motor Skills',
          concern: 'NORMAL',
        }),
      })

      const res = await createObservation(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.observationId).toBeDefined()
      createdObservationId = json.data.observationId

      // Verify DB record status is DRAFT
      const obs = await db.observation.findUnique({ where: { id: createdObservationId } })
      expect(obs?.status).toBe('DRAFT')
      expect(obs?.teacherId).toBe(teacherA1UserId)
    })

    it('Scenario 1 (cont): Teacher A1 publishes observation → dispatches InAppNotification to Parent A1', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/observations/${createdObservationId}/publish`, {
        method: 'POST',
        headers: { cookie: `preone_session=${teacherA1Token}` },
      })

      const res = await publishObservation(req, { params: Promise.resolve({ id: createdObservationId }) })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.timelineEntryId).toBeDefined()
      publishedTimelineEntryId = json.data.timelineEntryId

      // Check observation is PUBLISHED
      const obs = await db.observation.findUnique({ where: { id: createdObservationId } })
      expect(obs?.status).toBe('PUBLISHED')
      expect(obs?.publishedAt).not.toBeNull()

      // Verify that InAppNotification was dispatched to Parent A1
      const notifs = await db.inAppNotification.findMany({
        where: { tenantId: tenantAId, userId: parentA1UserId },
      })
      expect(notifs.length).toBeGreaterThanOrEqual(1)
      const obsNotif = notifs.find((n) => n.linkUrl?.includes(studentA1Id))
      expect(obsNotif).toBeDefined()
      expect(obsNotif?.title).toContain('Aarav')
      expect(obsNotif?.category).toBe('ACADEMICS')
      expect(obsNotif?.isRead).toBe(false)
      expect(obsNotif?.linkUrl).toBe(`/app/students/${studentA1Id}?tab=observations`)
      inAppNotificationId = obsNotif!.id

      // Verify truthful delivery log was recorded
      const deliveryLog = await db.notificationDeliveryLog.findFirst({
        where: {
          tenantId: tenantAId,
          eventType: 'OBSERVATION_PUBLISHED',
          recipientAddress: parentA1UserId,
        },
      })
      expect(deliveryLog).toBeDefined()
      expect(deliveryLog?.status).toBe('DELIVERED')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PARENT NOTIFICATION INBOX, UNREAD COUNT & DESTINATION NAVIGATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Parent Notification Inbox & Record-Level Authorization', () => {
    it('Scenario 2: Parent A1 views inbox and unread count is accurate', async () => {
      // 1. Check unread count
      const countReq = new NextRequest('http://localhost:3000/api/v1/notifications/unread-count', {
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const countRes = await getUnreadCount(countReq)
      const countJson = await countRes.json()
      expect(countRes.status).toBe(200)
      expect(countJson.data.count).toBeGreaterThanOrEqual(1)

      // 2. List notifications
      const listReq = new NextRequest('http://localhost:3000/api/v1/notifications?limit=10', {
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const listRes = await getNotifications(listReq)
      const listJson = await listRes.json()
      expect(listRes.status).toBe(200)
      expect(listJson.data.items.length).toBeGreaterThanOrEqual(1)
      expect(listJson.data.items[0].id).toBe(inAppNotificationId)
      expect(listJson.data.items[0].isRead).toBe(false)
    })

    it('Scenario 2 (cont): Parent A1 navigates to notification destination (/api/v1/students/[id]) successfully', async () => {
      const studentReq = new NextRequest(`http://localhost:3000/api/v1/students/${studentA1Id}`, {
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const studentRes = await getStudent(studentReq, { params: Promise.resolve({ id: studentA1Id }) })
      const studentJson = await studentRes.json()

      expect(studentRes.status).toBe(200)
      expect(studentJson.success).toBe(true)
      expect(studentJson.data.student.id).toBe(studentA1Id)
      expect(studentJson.data.student.firstName).toBe('Aarav')
    })

    it('Scenario 2b (UI Route & Server Reconciliation): Notification destination /app/students/[id]?tab=observations loads child observations securely', async () => {
      // 1. Verify notification linkUrl is the exact UI route
      const notif = await db.inAppNotification.findUnique({ where: { id: inAppNotificationId } })
      expect(notif?.linkUrl).toBe(`/app/students/${studentA1Id}?tab=observations`)

      // 2. Load profile via StudentService as executed by the UI Server Component (StudentDetailPage)
      const parentCtx = {
        tenantId: tenantAId,
        branchId: branchA1Id,
        actorId: parentA1UserId,
        actorName: 'Parent A1',
        actorRole: 'PARENT',
        actorRoles: ['PARENT'],
      }

      const profile = await StudentService.getStudentProfile(parentCtx, studentA1Id)
      expect(profile).toBeDefined()
      expect(profile.student.id).toBe(studentA1Id)
      expect(profile.academics.observations).toBeDefined()
      expect(profile.academics.observations.length).toBeGreaterThanOrEqual(1)
      expect(profile.academics.observations[0].id).toBe(createdObservationId)
      expect(profile.academics.observations[0].status).toBe('PUBLISHED')

      // 3. Re-request / refresh: authorization persists idempotently
      const refreshedProfile = await StudentService.getStudentProfile(parentCtx, studentA1Id)
      expect(refreshedProfile.student.id).toBe(studentA1Id)

      // 4. URL tampering attempt: parent attempts to load non-child student profile
      await expect(StudentService.getStudentProfile(parentCtx, studentA2Id)).rejects.toThrow()
    })

    it('Scenario 3: Parent A1 cannot access another student (Student A2) by changing ID (403 Forbidden)', async () => {
      const studentReq = new NextRequest(`http://localhost:3000/api/v1/students/${studentA2Id}`, {
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const studentRes = await getStudent(studentReq, { params: Promise.resolve({ id: studentA2Id }) })
      expect(studentRes.status).toBe(403)
    })

    it('Scenario 4: Unrelated parent (Parent A2) does not see Parent A1 notification and cannot mark it read', async () => {
      // Parent A2's inbox should NOT contain Parent A1's notification
      const listReq = new NextRequest('http://localhost:3000/api/v1/notifications', {
        headers: { cookie: `preone_session=${parentA2Token}` },
      })
      const listRes = await getNotifications(listReq)
      const listJson = await listRes.json()
      expect(listRes.status).toBe(200)
      const hasForeign = listJson.data.items.some((n: any) => n.id === inAppNotificationId)
      expect(hasForeign).toBe(false)

      // Parent A2 attempts IDOR to mark Parent A1 notification read
      const markReq = new NextRequest(`http://localhost:3000/api/v1/notifications/${inAppNotificationId}/read`, {
        method: 'PATCH',
        headers: { cookie: `preone_session=${parentA2Token}` },
      })
      const markRes = await markNotificationRead(markReq, { params: Promise.resolve({ id: inAppNotificationId }) })
      expect(markRes.status).toBe(404) // Fails closed with 404 (not found for this user)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. READ / UNREAD UPDATES & COUNT CONSISTENCY
  // ──────────────────────────────────────────────────────────────────────────
  describe('Read/Unread Mutation & Count Consistency', () => {
    it('Scenario 7: Parent A1 marks own notification as read → state and badge count update', async () => {
      const markReq = new NextRequest(`http://localhost:3000/api/v1/notifications/${inAppNotificationId}/read`, {
        method: 'PATCH',
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const markRes = await markNotificationRead(markReq, { params: Promise.resolve({ id: inAppNotificationId }) })
      const markJson = await markRes.json()

      expect(markRes.status).toBe(200)
      expect(markJson.data.isRead).toBe(true)
      expect(markJson.data.readAt).not.toBeNull()

      // Unread count is now 0
      const countReq = new NextRequest('http://localhost:3000/api/v1/notifications/unread-count', {
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const countRes = await getUnreadCount(countReq)
      const countJson = await countRes.json()
      expect(countJson.data.count).toBe(0)
    })

    it('Scenario 8: Cross-tenant user (Owner B) cannot mark Tenant A notification as read', async () => {
      const markReq = new NextRequest(`http://localhost:3000/api/v1/notifications/${inAppNotificationId}/read`, {
        method: 'PATCH',
        headers: { cookie: `preone_session=${ownerBToken}` },
      })
      const markRes = await markNotificationRead(markReq, { params: Promise.resolve({ id: inAppNotificationId }) })
      expect(markRes.status).toBe(404)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. BRANCH ISOLATION & TEACHER CONSTRAINTS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Branch Isolation & Teacher Scope Constraints', () => {
    it('Scenario 6: Teacher A2 (Branch A2) cannot publish Teacher A1 (Branch A1) observation', async () => {
      // Create a draft observation by Teacher A1
      const obs = await db.observation.create({
        data: {
          tenantId: tenantAId,
          studentId: studentA1Id,
          classroomId: classroomA1Id,
          teacherId: teacherA1UserId,
          narrative: 'Testing teacher branch and author scope restrictions.',
          status: 'DRAFT',
        },
      })

      const req = new NextRequest(`http://localhost:3000/api/v1/observations/${obs.id}/publish`, {
        method: 'POST',
        headers: { cookie: `preone_session=${teacherA2Token}` },
      })

      const res = await publishObservation(req, { params: Promise.resolve({ id: obs.id }) })
      expect(res.status).toBe(403) // Denied: branch mismatch or author mismatch
    })

    it('Scenario 5: Observation recorded with concern (NEEDS_ATTENTION) notifies Coordinator/Principal', async () => {
      const narrative = 'Aarav is experiencing difficulty with peer transitions and requires sensory breaks.'
      const req = new NextRequest('http://localhost:3000/api/v1/observations', {
        method: 'POST',
        headers: {
          cookie: `preone_session=${teacherA1Token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentA1Id,
          narrative,
          concern: 'NEEDS_ATTENTION',
        }),
      })

      const res = await createObservation(req)
      expect(res.status).toBe(201)

      // Verify that delivery log for OBSERVATION_ALERT was generated for staff
      const alertLogs = await db.notificationDeliveryLog.findMany({
        where: {
          tenantId: tenantAId,
          eventType: 'OBSERVATION_ALERT',
        },
      })
      expect(alertLogs.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. INBOX PAGINATION & BOUNDING SAFEGUARDS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Inbox Limits, Pagination & Query Hardening', () => {
    it('Scenario 11: Inbox pagination retrieves records without data loss', async () => {
      // Seed 25 test notifications for a synthetic user
      const testUser = await db.user.create({
        data: { email: `pag_test_${timestamp}@test.pre1`, fullName: 'Pagination Test User', passwordHash: 'hash' },
      })
      const testToken = await signSession({
        uid: testUser.id,
        email: testUser.email!,
        name: testUser.fullName,
        tenantId: tenantAId,
        role: 'STAFF',
      })

      const notifsToCreate = Array.from({ length: 25 }, (_, i) => ({
        tenantId: tenantAId,
        userId: testUser.id,
        title: `Test Notification ${i + 1}`,
        body: `Body ${i + 1}`,
        category: 'SYSTEM',
        severity: 'INFO',
        isRead: false,
      }))
      await db.inAppNotification.createMany({ data: notifsToCreate })

      // Page 1 (limit 10, offset 0)
      const p1Req = new NextRequest('http://localhost:3000/api/v1/notifications?limit=10&offset=0', {
        headers: { cookie: `preone_session=${testToken}` },
      })
      const p1Res = await getNotifications(p1Req)
      const p1Json = await p1Res.json()
      expect(p1Json.data.items.length).toBe(10)
      expect(p1Json.data.total).toBe(25)

      // Page 2 (limit 10, offset 10)
      const p2Req = new NextRequest('http://localhost:3000/api/v1/notifications?limit=10&offset=10', {
        headers: { cookie: `preone_session=${testToken}` },
      })
      const p2Res = await getNotifications(p2Req)
      const p2Json = await p2Res.json()
      expect(p2Json.data.items.length).toBe(10)

      // Page 3 (limit 10, offset 20)
      const p3Req = new NextRequest('http://localhost:3000/api/v1/notifications?limit=10&offset=20', {
        headers: { cookie: `preone_session=${testToken}` },
      })
      const p3Res = await getNotifications(p3Req)
      const p3Json = await p3Res.json()
      expect(p3Json.data.items.length).toBe(5)

      // Verify no overlap across pages
      const idsP1 = new Set(p1Json.data.items.map((i: any) => i.id))
      const idsP2 = new Set(p2Json.data.items.map((i: any) => i.id))
      for (const id of idsP2) {
        expect(idsP1.has(id)).toBe(false)
      }
    })

    it('Scenario 12: Limit query parameter is safely clamped to 100 on excessive inputs', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/notifications?limit=500000', {
        headers: { cookie: `preone_session=${ownerAToken}` },
      })
      const res = await getNotifications(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      // Clamped safely without crashing
      expect(json.data.items.length).toBeLessThanOrEqual(100)
    })

    it('Scenario 12 (cont): Invalid or negative limit and offset fail safely with defaults', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/notifications?limit=-10&offset=-5', {
        headers: { cookie: `preone_session=${ownerAToken}` },
      })
      const res = await getNotifications(req)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. IDEMPOTENCY & DUPLICATE PROTECTION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Duplicate Prevention & Idempotency Safeguards', () => {
    it('Scenario 10: Publishing an already-published observation fails with 409 Conflict', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/observations/${createdObservationId}/publish`, {
        method: 'POST',
        headers: { cookie: `preone_session=${teacherA1Token}` },
      })
      const res = await publishObservation(req, { params: Promise.resolve({ id: createdObservationId }) })
      expect(res.status).toBe(409)
    })

    it('Scenario 10 (cont): markAllAsRead is idempotent and safely returns zero when all already read', async () => {
      const req1 = new NextRequest('http://localhost:3000/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      await markAllNotificationsRead(req1)

      // Subsequent call is idempotent and returns 0
      const req2 = new NextRequest('http://localhost:3000/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: { cookie: `preone_session=${parentA1Token}` },
      })
      const res = await markAllNotificationsRead(req2)
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.markedCount).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 7. WEBHOOK INTEGRITY & REPLAY PROTECTION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Inbound Webhooks & Integration Security', () => {
    it('Scenario 14: Inbound n8n callback rejects missing or invalid HMAC signature (401)', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/integrations/n8n/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-preone-signature': 'invalid_forged_hmac_signature',
        },
        body: JSON.stringify({ eventId: 'evt_1', tenantId: tenantAId }),
      })
      const res = await n8nCallback(req)
      expect(res.status).toBe(401)
    })

    it('Scenario 15: Valid n8n callback processes idempotently and prevents duplicate side-effects', async () => {
      const eventId = `n8n_test_${timestamp}`
      const payloadObj = { eventId, tenantId: tenantAId, status: 'PROCESSED' }
      const rawBody = JSON.stringify(payloadObj)
      const validSig = generateHmacSignature(rawBody, N8N_WEBHOOK_SECRET)

      // First call: Records in IntegrationEvent
      const req1 = new NextRequest('http://localhost:3000/api/v1/integrations/n8n/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-preone-signature': validSig,
          'x-preone-event-id': eventId,
          'x-preone-tenant-id': tenantAId,
        },
        body: rawBody,
      })
      const res1 = await n8nCallback(req1)
      expect(res1.status).toBe(200)

      // Second call: Returns ALREADY_PROCESSED
      const req2 = new NextRequest('http://localhost:3000/api/v1/integrations/n8n/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-preone-signature': validSig,
          'x-preone-event-id': eventId,
          'x-preone-tenant-id': tenantAId,
        },
        body: rawBody,
      })
      const res2 = await n8nCallback(req2)
      const json2 = await res2.json()
      expect(res2.status).toBe(200)
      expect(json2.data.status).toBe('ALREADY_PROCESSED')
    })

    it('Scenario 15b: In-memory cache reset (simulating container restart or multi-instance) falls back to durable DB log and remains idempotent', async () => {
      const eventId = `n8n_restart_test_${timestamp}`
      const payloadObj = { eventId, tenantId: tenantAId, status: 'PROCESSED' }
      const rawBody = JSON.stringify(payloadObj)
      const validSig = generateHmacSignature(rawBody, N8N_WEBHOOK_SECRET)

      // First call: Writes to both memory and NotificationDeliveryLog
      const req1 = new NextRequest('http://localhost:3000/api/v1/integrations/n8n/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-preone-signature': validSig,
          'x-preone-event-id': eventId,
          'x-preone-tenant-id': tenantAId,
        },
        body: rawBody,
      })
      const res1 = await n8nCallback(req1)
      expect(res1.status).toBe(200)

      // Verify written to PostgreSQL NotificationDeliveryLog
      const initialLogCount = await db.notificationDeliveryLog.count({
        where: { tenantId: tenantAId, eventId, eventType: 'N8N_CALLBACK' },
      })
      expect(initialLogCount).toBe(1)

      // Simulate container restart or multi-instance cache miss by clearing in-memory cache
      _testClearCallbackCache()

      // Second call: Memory cache is empty, but L2 persistent DB log catches duplicate
      const req2 = new NextRequest('http://localhost:3000/api/v1/integrations/n8n/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-preone-signature': validSig,
          'x-preone-event-id': eventId,
          'x-preone-tenant-id': tenantAId,
        },
        body: rawBody,
      })
      const res2 = await n8nCallback(req2)
      const json2 = await res2.json()

      expect(res2.status).toBe(200)
      expect(json2.data.status).toBe('ALREADY_PROCESSED')

      // Ensure no duplicate records were created in the database
      const finalLogCount = await db.notificationDeliveryLog.count({
        where: { tenantId: tenantAId, eventId, eventType: 'N8N_CALLBACK' },
      })
      expect(finalLogCount).toBe(1)
    })

    it('Scenario 14 (cont): Inbound payment webhook rejects unverified gateway signature in production mode', async () => {
      const origEnv = process.env.NODE_ENV
      const origSecret = process.env.PAYMENT_WEBHOOK_SECRET
      process.env.NODE_ENV = 'production'
      process.env.PAYMENT_WEBHOOK_SECRET = 'secret_test_key_123'

      try {
        const req = new NextRequest('http://localhost:3000/api/v1/payments/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gateway-signature': 'bad_sig',
          },
          body: JSON.stringify({ paymentNumber: 'PAY_1', gatewayStatus: 'SUCCESS' }),
        })
        const res = await paymentWebhook(req)
        expect(res.status).toBe(401)
      } finally {
        process.env.NODE_ENV = origEnv
        process.env.PAYMENT_WEBHOOK_SECRET = origSecret
      }
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 8. TRUTHFUL GATEWAY TESTER (ZERO FAKE SUCCESS)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Notification Gateway Tester (Zero Fake Success)', () => {
    it('Scenario 17: Gateway test returns CONFIGURATION_ONLY when unconfigured without pretending success', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/setup/notifications/test', {
        method: 'POST',
        headers: {
          cookie: `preone_session=${ownerAToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: 'WHATSAPP',
          templateBody: 'Test alert for {{schoolName}}.',
          recipient: '+919876543210',
        }),
      })

      const res = await testNotificationGateway(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.testStatus).toBe('CONFIGURATION_ONLY')
      expect(json.data.delivered).toBe(false)
      expect(json.data.message).toContain('not configured')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 9. SOFT-DELETED & REVOKED RECIPIENTS EXCLUSION
  // ──────────────────────────────────────────────────────────────────────────
  describe('Recipient Resolution Security: Soft-Delete & Stale Guardians', () => {
    it('Scenario 18: Soft-deleted guardian does not receive notifications', async () => {
      // Create a guardian and immediately soft-delete
      const userDeleted = await db.user.create({
        data: { email: `del_g_${timestamp}@test.pre1`, fullName: 'Deleted Guardian', passwordHash: 'hash' },
      })
      const gDeleted = await db.guardian.create({
        data: {
          tenantId: tenantAId,
          userId: userDeleted.id,
          fullName: 'Deleted Guardian',
          relationship: 'GUARDIAN',
          phone: '9999988888',
          deletedAt: new Date(),
        },
      })
      await db.studentGuardian.create({
        data: {
          studentId: studentA1Id,
          guardianId: gDeleted.id,
          relationship: 'GUARDIAN',
          receivesComm: true,
        },
      })

      // Resolve child guardians
      const recipients = await RecipientResolver.resolveChildGuardians(tenantAId, studentA1Id)
      const foundDeleted = recipients.some((r) => r.guardianId === gDeleted.id)
      expect(foundDeleted).toBe(false)
    })
  })
})
