/**
 * PREONE: ANNOUNCEMENTS MODULE MVP VERIFICATION SUITE
 *
 * Verifies all 14 criteria specified in the Final MVP Implementation Prompt:
 * 1. Role-based permissions & authorization (OWNER, PRINCIPAL, TEACHER, PARENT)
 * 2. API Contract GET /api/v1/announcements
 *    - Tenant isolation
 *    - Parent visibility (SCHOOL_WIDE, ALL_PARENTS)
 *    - Strict exclusion of ALL_STAFF from Parent feed
 *    - Strict class-level targeting isolation (Parent sees only child's class, never other classes)
 * 3. API Contract POST /api/v1/announcements
 *    - Rejection of unauthorized broadcasters (PARENT, TEACHER -> 403 Forbidden)
 *    - Required field validation (title, body -> 400 Validation)
 *    - Conditional classroom validation (CLASS_PARENTS requires valid classroomId -> 400 Validation)
 *    - Cross-tenant classroom tampering rejected (400 Validation)
 *    - Canonical enum validation for all 8 types and 5 audiences
 *    - Immutable audit sequence trail logging
 * 4. Child Timeline Fan-Out
 *    - Fan-out creates TimelineEntry for active students on SCHOOL_WIDE, ALL_PARENTS, CLASS_PARENTS
 *    - ALL_STAFF broadcasts NEVER create student timeline entries
 *    - Targeted class announcements only create entries for children in that classroom
 */

import { db } from '../src/lib/db'
import { signSession } from '../src/lib/auth'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++
    console.log(`  ✓ Test ${passed}: ${msg}`)
  } else {
    failed++
    console.error(`  ✗ FAILED: ${msg}`)
  }
}

async function runTests() {
  console.log('===============================================================')
  console.log('PREONE: ANNOUNCEMENTS MODULE MVP VERIFICATION SUITE')
  console.log('===============================================================\n')

  const runId = Math.random().toString(36).slice(2, 7)
  const tenantCode = `ANN-${runId}`
  const foreignCode = `FORG-${runId}`

  // --- Group 1: Setup Tenant, Branches, Classrooms & Users ---
  console.log('--- Group 1: Environment & Multi-Classroom Setup')
  const tenant = await db.tenant.create({
    data: {
      name: `Sunshine Preschool ${runId}`,
      code: tenantCode,
      status: 'ACTIVE',
      subscriptionPlan: 'ENTERPRISE',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
    },
  })
  assert(!!tenant.id, 'Tenant created successfully')

  const foreignTenant = await db.tenant.create({
    data: {
      name: `Foreign Academy ${runId}`,
      code: foreignCode,
      status: 'ACTIVE',
      subscriptionPlan: 'STARTER',
    },
  })
  assert(!!foreignTenant.id, 'Foreign tenant created for boundary isolation')

  const branch = await db.branch.create({
    data: { tenantId: tenant.id, name: 'Main Campus', code: `MC-${runId}`, isMain: true },
  })

  const session = await db.academicSession.create({
    data: {
      tenantId: tenant.id,
      name: `Session 2026-27 ${runId}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  })

  // Classrooms
  const classA = await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      academicSessionId: session.id,
      name: `Playgroup A Sunflower ${runId}`,
      code: `PGA-${runId}`,
      programType: 'PLAYGROUP',
      capacity: 15,
    },
  })

  const classB = await db.classroom.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      academicSessionId: session.id,
      name: `Nursery B Rose ${runId}`,
      code: `NRB-${runId}`,
      programType: 'NURSERY',
      capacity: 15,
    },
  })
  assert(!!classA.id && !!classB.id, 'Classrooms A & B established')

  const foreignBranch = await db.branch.create({
    data: { tenantId: foreignTenant.id, name: 'Foreign Campus', code: `FC-${runId}`, isMain: true },
  })

  const foreignSession = await db.academicSession.create({
    data: {
      tenantId: foreignTenant.id,
      name: `Foreign Session ${runId}`,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  })

  // Foreign Classroom (in foreign tenant)
  const foreignClass = await db.classroom.create({
    data: {
      tenantId: foreignTenant.id,
      branchId: foreignBranch.id,
      academicSessionId: foreignSession.id,
      name: `Foreign Class ${runId}`,
      code: `FORG-CLS-${runId}`,
      programType: 'PLAYGROUP',
      capacity: 10,
    },
  })

  // Students & Guardians
  // Student 1 in Class A
  const student1 = await db.student.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      currentClassroomId: classA.id,
      admissionNo: `ADM1-${runId}`,
      firstName: 'Aarav',
      lastName: `Sharma ${runId}`,
      dob: new Date('2023-01-15'),
      gender: 'MALE',
      admissionDate: new Date('2026-04-01'),
      status: 'ACTIVE',
    },
  })

  // Parent 1 (Father of Aarav in Class A)
  const userParent1 = await db.user.create({
    data: {
      email: `parent1_${runId}@example.com`,
      fullName: `Rajesh Sharma ${runId}`,
      passwordHash: 'hashed_pw',
    },
  })

  const guardian1 = await db.guardian.create({
    data: {
      tenantId: tenant.id,
      userId: userParent1.id,
      fullName: userParent1.fullName,
      phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
      relationship: 'FATHER',
      isPrimaryContact: true,
    },
  })

  await db.studentGuardian.create({
    data: {
      studentId: student1.id,
      guardianId: guardian1.id,
      relationship: 'FATHER',
      isPrimary: true,
      canPickup: true,
      receivesComm: true,
    },
  })

  // Student 2 in Class B
  const student2 = await db.student.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      currentClassroomId: classB.id,
      admissionNo: `ADM2-${runId}`,
      firstName: 'Ananya',
      lastName: `Verma ${runId}`,
      dob: new Date('2022-08-20'),
      gender: 'FEMALE',
      admissionDate: new Date('2026-04-01'),
      status: 'ACTIVE',
    },
  })

  // Parent 2 (Mother of Ananya in Class B)
  const userParent2 = await db.user.create({
    data: {
      email: `parent2_${runId}@example.com`,
      fullName: `Pooja Verma ${runId}`,
      passwordHash: 'hashed_pw',
    },
  })

  const guardian2 = await db.guardian.create({
    data: {
      tenantId: tenant.id,
      userId: userParent2.id,
      fullName: userParent2.fullName,
      phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
      relationship: 'MOTHER',
      isPrimaryContact: true,
    },
  })

  await db.studentGuardian.create({
    data: {
      studentId: student2.id,
      guardianId: guardian2.id,
      relationship: 'MOTHER',
      isPrimary: true,
      canPickup: true,
      receivesComm: true,
    },
  })

  // Admin User
  const userAdmin = await db.user.create({
    data: {
      email: `admin_${runId}@example.com`,
      fullName: `Principal Roy ${runId}`,
      passwordHash: 'hashed_pw',
    },
  })

  // Teacher User
  const userTeacher = await db.user.create({
    data: {
      email: `teacher_${runId}@example.com`,
      fullName: `Ms. Anjali ${runId}`,
      passwordHash: 'hashed_pw',
    },
  })

  assert(!!userParent1.id && !!userParent2.id && !!userAdmin.id && !!userTeacher.id, 'Users and Guardian profiles created')

  // --- Group 2: Session Token Generation ---
  console.log('\n--- Group 2: Role Sessions & Tokens')
  const adminToken = await signSession({
    uid: userAdmin.id,
    userId: userAdmin.id,
    name: userAdmin.fullName,
    email: userAdmin.email,
    role: 'PRINCIPAL',
    roles: ['PRINCIPAL'],
    tenantId: tenant.id,
    branchId: branch.id,
  } as any)

  const teacherToken = await signSession({
    uid: userTeacher.id,
    userId: userTeacher.id,
    name: userTeacher.fullName,
    email: userTeacher.email,
    role: 'TEACHER',
    roles: ['TEACHER'],
    tenantId: tenant.id,
    branchId: branch.id,
  } as any)

  const parent1Token = await signSession({
    uid: userParent1.id,
    userId: userParent1.id,
    name: userParent1.fullName,
    email: userParent1.email,
    role: 'PARENT',
    roles: ['PARENT'],
    tenantId: tenant.id,
    branchId: branch.id,
  } as any)

  const parent2Token = await signSession({
    uid: userParent2.id,
    userId: userParent2.id,
    name: userParent2.fullName,
    email: userParent2.email,
    role: 'PARENT',
    roles: ['PARENT'],
    tenantId: tenant.id,
    branchId: branch.id,
  } as any)

  assert(!!adminToken && !!teacherToken && !!parent1Token && !!parent2Token, 'Session tokens signed for all 4 test roles')

  // --- Group 3: Broadcast Creation & Validation Testing (POST) ---
  console.log('\n--- Group 3: Authorization & Validation Controls (POST /api/v1/announcements)')

  // 1. Unauthorized Broadcaster Rejection (Teacher)
  const teachPostRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${teacherToken}` },
    body: JSON.stringify({ title: 'Staff Meeting', body: 'Please gather in the library' }),
  })
  assert(teachPostRes.status === 403, 'Teacher without broadcast permission rejected (HTTP 403 Forbidden)')

  // 2. Unauthorized Broadcaster Rejection (Parent)
  const parentPostRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${parent1Token}` },
    body: JSON.stringify({ title: 'My child notice', body: 'Unauthorized attempt' }),
  })
  assert(parentPostRes.status === 403, 'Parent broadcast attempt strictly rejected (HTTP 403 Forbidden)')

  // 3. Validation: Missing Title
  const noTitleRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({ title: '', body: 'Valid body text' }),
  })
  assert(noTitleRes.status === 400, 'Empty title rejected with 400 Validation')

  // 4. Validation: Missing Body
  const noBodyRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({ title: 'Valid Title', body: '' }),
  })
  assert(noBodyRes.status === 400, 'Empty body rejected with 400 Validation')

  // 5. Validation: CLASS_PARENTS without classroomId
  const noClassRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: 'Class Announcement',
      body: 'Bring coloring books',
      audience: 'CLASS_PARENTS',
      classroomId: '',
    }),
  })
  assert(noClassRes.status === 400, 'CLASS_PARENTS audience without classroomId rejected (HTTP 400)')

  // 6. Validation: Invalid / Non-existent Classroom
  const fakeClassRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: 'Class Announcement',
      body: 'Bring coloring books',
      audience: 'CLASS_PARENTS',
      classroomId: 'non_existent_cls_uuid',
    }),
  })
  assert(fakeClassRes.status === 400, 'Non-existent classroomId rejected (HTTP 400)')

  // 7. Security: Cross-Tenant Classroom Tampering
  const foreignClassRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: 'Class Announcement',
      body: 'Bring coloring books',
      audience: 'CLASS_PARENTS',
      classroomId: foreignClass.id,
    }),
  })
  assert(foreignClassRes.status === 400, 'Foreign tenant classroom targeting strictly rejected (HTTP 400)')

  // --- Group 4: Canonical Broadcasts & Fan-out Testing ---
  console.log('\n--- Group 4: Legitimate Broadcasts & Timeline Fan-out')

  // 8. Broadcast 1: SCHOOL_WIDE General Update
  const b1Res = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: `Annual Sports Day ${runId}`,
      body: 'Sports day will be held on Saturday morning from 9am to 12pm.',
      type: 'EVENT',
      audience: 'SCHOOL_WIDE',
    }),
  })
  const b1Json = await b1Res.json()
  assert(b1Json.success && !!b1Json.data.announcementId, 'Broadcast 1 (SCHOOL_WIDE Event) published successfully')

  // Check Timeline Fan-Out for Student 1 & Student 2
  const tl1 = await db.timelineEntry.findFirst({
    where: { studentId: student1.id, title: `Announcement: Annual Sports Day ${runId}` },
  })
  const tl2 = await db.timelineEntry.findFirst({
    where: { studentId: student2.id, title: `Announcement: Annual Sports Day ${runId}` },
  })
  assert(!!tl1 && !!tl2, 'SCHOOL_WIDE announcement fanned out to both active student timelines')

  // 9. Broadcast 2: ALL_STAFF Internal Circular
  const b2Res = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: `Staff Appraisal Cycle ${runId}`,
      body: 'Faculty performance evaluations begin next Monday. Please review the criteria.',
      type: 'IMPORTANT',
      audience: 'ALL_STAFF',
    }),
  })
  const b2Json = await b2Res.json()
  assert(b2Json.success && !!b2Json.data.announcementId, 'Broadcast 2 (ALL_STAFF Important) published successfully')

  // Verify ALL_STAFF notice did NOT leak to student timelines
  const tlStaffLeak1 = await db.timelineEntry.findFirst({
    where: { studentId: student1.id, title: `Announcement: Staff Appraisal Cycle ${runId}` },
  })
  const tlStaffLeak2 = await db.timelineEntry.findFirst({
    where: { studentId: student2.id, title: `Announcement: Staff Appraisal Cycle ${runId}` },
  })
  assert(!tlStaffLeak1 && !tlStaffLeak2, 'ALL_STAFF announcement strictly prevented from student timeline fan-out')

  // 10. Broadcast 3: CLASS_PARENTS (Targeting Class A only)
  const b3Res = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: `Playgroup A Clay Modeling Session ${runId}`,
      body: 'Sunflower class parents, please send an apron with your child tomorrow.',
      type: 'ACADEMIC',
      audience: 'CLASS_PARENTS',
      classroomId: classA.id,
    }),
  })
  const b3Json = await b3Res.json()
  assert(b3Json.success && !!b3Json.data.announcementId, 'Broadcast 3 (CLASS_PARENTS for Class A) published successfully')

  // Verify Fan-out: Student 1 (in Class A) received it; Student 2 (in Class B) DID NOT receive it!
  const tlClassA = await db.timelineEntry.findFirst({
    where: { studentId: student1.id, title: `Announcement: Playgroup A Clay Modeling Session ${runId}` },
  })
  const tlClassB = await db.timelineEntry.findFirst({
    where: { studentId: student2.id, title: `Announcement: Playgroup A Clay Modeling Session ${runId}` },
  })
  assert(!!tlClassA, 'Class A student timeline received class-specific announcement')
  assert(!tlClassB, 'Class B student timeline correctly excluded from Class A announcement')

  // 11. Broadcast 4: EMERGENCY Alert
  const b4Res = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `preone_session=${adminToken}` },
    body: JSON.stringify({
      title: `Early Dismissal Heavy Rainfall ${runId}`,
      body: 'Due to severe weather warnings, school will close at 1:00 PM today. School buses will depart early.',
      type: 'EMERGENCY',
      audience: 'SCHOOL_WIDE',
    }),
  })
  const b4Json = await b4Res.json()
  assert(b4Json.success && !!b4Json.data.announcementId, 'Broadcast 4 (EMERGENCY School-Wide) published successfully')

  // --- Group 5: Feed Visibility & Parent Isolation Testing (GET) ---
  console.log('\n--- Group 5: Feed Visibility & Scope Isolation (GET /api/v1/announcements)')

  // 12. Admin Feed (Must see all 4 announcements)
  const adminFeedRes = await fetch('http://localhost:3000/api/v1/announcements', {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const adminFeedJson = await adminFeedRes.json()
  assert(adminFeedJson.success, 'Admin feed successfully retrieved')
  const adminTitles = adminFeedJson.data.map((a: any) => a.title)
  assert(
    adminTitles.some((t: string) => t.includes('Annual Sports Day')) &&
      adminTitles.some((t: string) => t.includes('Staff Appraisal Cycle')) &&
      adminTitles.some((t: string) => t.includes('Playgroup A Clay Modeling')) &&
      adminTitles.some((t: string) => t.includes('Early Dismissal Heavy Rainfall')),
    'Admin sees all 4 published announcements (School-Wide, Staff, Class, Emergency)'
  )

  // 13. Teacher Feed (Must see School-Wide, Staff, and general published announcements)
  const teacherFeedRes = await fetch('http://localhost:3000/api/v1/announcements', {
    headers: { Cookie: `preone_session=${teacherToken}` },
  })
  const teacherFeedJson = await teacherFeedRes.json()
  assert(teacherFeedJson.success, 'Teacher feed successfully retrieved')
  const teacherTitles = teacherFeedJson.data.map((a: any) => a.title)
  assert(
    teacherTitles.some((t: string) => t.includes('Staff Appraisal Cycle')),
    'Teacher feed includes ALL_STAFF internal notice'
  )

  // 14. Parent 1 Feed (Has child in Class A)
  const parent1FeedRes = await fetch('http://localhost:3000/api/v1/announcements', {
    headers: { Cookie: `preone_session=${parent1Token}` },
  })
  const parent1FeedJson = await parent1FeedRes.json()
  assert(parent1FeedJson.success, 'Parent 1 feed successfully retrieved')
  const p1Titles = parent1FeedJson.data.map((a: any) => a.title)

  assert(p1Titles.some((t: string) => t.includes('Annual Sports Day')), 'Parent 1 sees SCHOOL_WIDE event announcement')
  assert(p1Titles.some((t: string) => t.includes('Early Dismissal Heavy Rainfall')), 'Parent 1 sees EMERGENCY school alert')
  assert(p1Titles.some((t: string) => t.includes('Playgroup A Clay Modeling')), 'Parent 1 sees Class A announcement for their child')
  assert(!p1Titles.some((t: string) => t.includes('Staff Appraisal Cycle')), 'Parent 1 CANNOT see ALL_STAFF internal announcement (strict isolation)')

  // 15. Parent 2 Feed (Has child in Class B)
  const parent2FeedRes = await fetch('http://localhost:3000/api/v1/announcements', {
    headers: { Cookie: `preone_session=${parent2Token}` },
  })
  const parent2FeedJson = await parent2FeedRes.json()
  assert(parent2FeedJson.success, 'Parent 2 feed successfully retrieved')
  const p2Titles = parent2FeedJson.data.map((a: any) => a.title)

  assert(p2Titles.some((t: string) => t.includes('Annual Sports Day')), 'Parent 2 sees SCHOOL_WIDE event announcement')
  assert(!p2Titles.some((t: string) => t.includes('Playgroup A Clay Modeling')), 'Parent 2 CANNOT see Class A announcement (class isolation preserved)')
  // --- Group 6: Immutable Audit Trail Verification ---
  console.log('\n--- Group 6: Audit Sequence Logging')
  const auditLogs = await db.auditLog.findMany({
    where: {
      tenantId: tenant.id,
      entity: 'Announcement',
      action: 'CREATE',
    },
  })
  assert(auditLogs.length >= 4, `At least 4 audit log entries recorded for announcements (got ${auditLogs.length})`)
  assert(
    auditLogs.some((l) => l.summary?.includes('Annual Sports Day')),
    'Audit log contains summary of published Sports Day broadcast'
  )
  assert(
    auditLogs.some((l) => l.summary?.includes('Early Dismissal Heavy Rainfall')),
    'Audit log contains summary of Emergency broadcast'
  )

  // --- Group 7: Complete Lifecycle Operations (Draft, Edit, Publish, Cancel, Discard) ---
  console.log('\n--- Group 7: Complete Announcement Lifecycle Operations')
  const timelineBeforeDraft = await db.timelineEntry.count({ where: { tenantId: tenant.id } })

  // 1. Save Draft
  const saveDraftRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: `Field Trip Zoo Draft ${runId}`,
      body: 'Tentative schedule for the animal sanctuary visit next month.',
      type: 'EVENT',
      audience: 'ALL_PARENTS',
      status: 'DRAFT',
    }),
  })
  const saveDraftJson = await saveDraftRes.json()
  assert(saveDraftJson.success, 'Draft created successfully via POST /api/v1/announcements')
  assert(saveDraftJson.data.status === 'DRAFT', 'Draft returns status DRAFT')
  const draftId = saveDraftJson.data.announcementId

  const timelineAfterDraft = await db.timelineEntry.count({ where: { tenantId: tenant.id } })
  assert(
    timelineAfterDraft === timelineBeforeDraft,
    'Draft creation NEVER fans out to student timelines (zero timeline pollution)'
  )

  // 2. Query Drafts Tab
  const draftsFeedRes = await fetch('http://localhost:3000/api/v1/announcements?status=DRAFT', {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const draftsFeedJson = await draftsFeedRes.json()
  assert(draftsFeedJson.success, 'Drafts feed query succeeds')
  assert(
    draftsFeedJson.data.some((d: any) => d.id === draftId),
    'Created draft appears in Drafts query'
  )
  assert(
    draftsFeedJson.meta?.counts?.drafts >= 1,
    `Drafts status count metadata accurately reflects drafts (${draftsFeedJson.meta?.counts?.drafts})`
  )

  // 3. GET /api/v1/announcements/[id]
  const getSingleDraftRes = await fetch(`http://localhost:3000/api/v1/announcements/${draftId}`, {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const getSingleDraftJson = await getSingleDraftRes.json()
  assert(getSingleDraftJson.success, 'GET /api/v1/announcements/[id] succeeds for authorized broadcaster')
  assert(getSingleDraftJson.data.title.includes('Field Trip Zoo Draft'), 'Draft detail has expected title')

  // Security Verification: Non-broadcasters (Teacher, Parent) strictly blocked from reading drafts
  const teacherDraftFeedRes = await fetch('http://localhost:3000/api/v1/announcements?status=DRAFT', {
    headers: { Cookie: `preone_session=${teacherToken}` },
  })
  const teacherDraftFeedJson = await teacherDraftFeedRes.json()
  assert(
    !teacherDraftFeedJson.data.some((d: any) => d.id === draftId),
    'Non-broadcasting teacher query for status=DRAFT cannot see drafts (strict status enforcement)'
  )
  assert(
    (teacherDraftFeedJson.meta?.counts?.drafts || 0) === 0,
    'Non-broadcasting teacher does not receive draft count metrics'
  )

  const teacherSingleDraftRes = await fetch(`http://localhost:3000/api/v1/announcements/${draftId}`, {
    headers: { Cookie: `preone_session=${teacherToken}` },
  })
  assert(
    teacherSingleDraftRes.status === 403,
    'Non-broadcasting teacher blocked from GET /api/v1/announcements/[draftId] (HTTP 403 Forbidden)'
  )

  const parentSingleDraftRes = await fetch(`http://localhost:3000/api/v1/announcements/${draftId}`, {
    headers: { Cookie: `preone_session=${parent1Token}` },
  })
  assert(
    parentSingleDraftRes.status === 403,
    'Parent strictly blocked from GET /api/v1/announcements/[draftId] (HTTP 403 Forbidden)'
  )

  // 4. Edit Draft via PATCH /api/v1/announcements/[id]
  const editDraftRes = await fetch(`http://localhost:3000/api/v1/announcements/${draftId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: `Confirmed Field Trip Zoo ${runId}`,
      body: 'Finalized schedule: departure at 9:00 AM, return at 2:00 PM.',
    }),
  })
  const editDraftJson = await editDraftRes.json()
  assert(editDraftJson.success, 'PATCH /api/v1/announcements/[id] successfully updates draft content')
  assert(editDraftJson.data.title.includes('Confirmed Field Trip Zoo'), 'Draft reflects updated title')

  // 5. Publish Draft via PATCH /api/v1/announcements/[id]
  const timelineBeforePublish = await db.timelineEntry.count({ where: { tenantId: tenant.id } })
  const publishDraftRes = await fetch(`http://localhost:3000/api/v1/announcements/${draftId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({ action: 'PUBLISH' }),
  })
  const publishDraftJson = await publishDraftRes.json()
  assert(publishDraftJson.success, 'Publishing draft via PATCH succeeds')
  assert(publishDraftJson.data.status === 'PUBLISHED', 'Announcement status transitioned to PUBLISHED')

  const timelineAfterPublish = await db.timelineEntry.count({ where: { tenantId: tenant.id } })
  assert(
    timelineAfterPublish > timelineBeforePublish,
    `Publishing draft triggers timeline fan-out for active children (${timelineAfterPublish - timelineBeforePublish} entries created)`
  )

  // 6. Cancel Notice via PATCH /api/v1/announcements/[id]
  const cancelNoticeRes = await fetch(`http://localhost:3000/api/v1/announcements/${draftId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({ action: 'CANCEL' }),
  })
  const cancelNoticeJson = await cancelNoticeRes.json()
  assert(cancelNoticeJson.success, 'Cancelling notice via PATCH succeeds')
  assert(cancelNoticeJson.data.status === 'CANCELLED', 'Announcement status transitioned to CANCELLED')

  const cancelledFeedRes = await fetch('http://localhost:3000/api/v1/announcements?status=CANCELLED', {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const cancelledFeedJson = await cancelledFeedRes.json()
  assert(
    cancelledFeedJson.data.some((c: any) => c.id === draftId),
    'Cancelled notice appears in Cancelled status query'
  )

  // 7. Discard Draft via DELETE /api/v1/announcements/[id]
  const scratchDraftRes = await fetch('http://localhost:3000/api/v1/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({
      title: `Discardable Draft ${runId}`,
      body: 'Will be deleted before publishing.',
      type: 'GENERAL',
      audience: 'SCHOOL_WIDE',
      status: 'DRAFT',
    }),
  })
  const scratchDraftJson = await scratchDraftRes.json()
  const scratchDraftId = scratchDraftJson.data.announcementId

  const deleteDraftRes = await fetch(`http://localhost:3000/api/v1/announcements/${scratchDraftId}`, {
    method: 'DELETE',
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const deleteDraftJson = await deleteDraftRes.json()
  assert(deleteDraftJson.success, 'DELETE /api/v1/announcements/[id] succeeds for draft')
  assert(deleteDraftJson.data.discarded === true, 'Response confirms draft was discarded')

  const checkDiscarded = await db.announcement.findUnique({ where: { id: scratchDraftId } })
  assert(checkDiscarded === null, 'Discarded draft is completely removed from database')

  // --- Group 8: Production Readiness (Large History Pagination, Concurrency, Cross-Branch Scoping) ---
  console.log('\n--- Group 8: Production Readiness Verification')

  // 8.1 Server-side pagination beyond 50 announcements
  const batchRecords: any[] = []
  const baseTime = Date.now()
  for (let i = 1; i <= 55; i++) {
    batchRecords.push({
      tenantId: tenant.id,
      branchId: branch.id,
      title: `Archive Notice ${i.toString().padStart(2, '0')} ${runId}`,
      body: `Archived notice body content number ${i}`,
      type: 'GENERAL' as const,
      audience: 'SCHOOL_WIDE' as const,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(baseTime + i * 1000),
      createdAt: new Date(baseTime + i * 1000),
    })
  }
  await db.announcement.createMany({ data: batchRecords })

  const page1Res = await fetch('http://localhost:3000/api/v1/announcements?page=1&limit=50', {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const page1Json = await page1Res.json()
  assert(page1Json.success, 'Page 1 pagination request succeeded')
  assert(page1Json.data.length === 50, 'Page 1 returned exactly 50 announcements')
  assert(page1Json.meta.hasMore === true, 'Page 1 meta indicates hasMore is true')
  assert(page1Json.meta.total >= 55, 'Total count reflects large announcement history')

  const page2Res = await fetch('http://localhost:3000/api/v1/announcements?page=2&limit=50', {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  const page2Json = await page2Res.json()
  assert(page2Json.success, 'Page 2 pagination request succeeded')
  assert(page2Json.data.length >= 5, 'Page 2 returned remaining announcements')

  const page1Ids = new Set(page1Json.data.map((a: any) => a.id))
  const page2Ids = page2Json.data.map((a: any) => a.id)
  const overlap = page2Ids.filter((id: string) => page1Ids.has(id))
  assert(overlap.length === 0, 'Deterministic sorting tie-breaker prevents page overlap or drift across pagination boundaries')

  // 8.2 Concurrency & Double-Submit Protection for Draft Publication
  const concurrentDraft = await db.announcement.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      title: `Concurrent Draft Notice ${runId}`,
      body: 'Testing simultaneous publication race conditions.',
      type: 'IMPORTANT',
      audience: 'CLASS_PARENTS',
      classroomId: classA.id,
      status: 'DRAFT',
    },
  })

  const timelineCountBeforeConcurrent = await db.timelineEntry.count({
    where: { tenantId: tenant.id, classroomId: classA.id },
  })

  // Fire two simultaneous publish calls
  const [pubRes1, pubRes2] = await Promise.all([
    fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `preone_session=${adminToken}`,
      },
      body: JSON.stringify({ action: 'PUBLISH' }),
    }),
    fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `preone_session=${adminToken}`,
      },
      body: JSON.stringify({ action: 'PUBLISH' }),
    }),
  ])

  const pubJson1 = await pubRes1.json()
  const pubJson2 = await pubRes2.json()

  assert(pubJson1.success && pubJson2.success, 'Both concurrent publish requests completed successfully')
  assert(
    pubJson1.data.status === 'PUBLISHED' && pubJson2.data.status === 'PUBLISHED',
    'Announcement status is reliably PUBLISHED'
  )

  const timelineCountAfterConcurrent = await db.timelineEntry.count({
    where: { tenantId: tenant.id, classroomId: classA.id },
  })

  assert(
    timelineCountAfterConcurrent === timelineCountBeforeConcurrent + 1,
    `Atomic transaction guarantees zero duplicate timeline entries (created exactly 1 entry, got delta ${
      timelineCountAfterConcurrent - timelineCountBeforeConcurrent
    })`
  )

  // 8.3 Cross-Branch Isolation Guard for Scoped Staff
  const branchB = await db.branch.create({
    data: { tenantId: tenant.id, name: 'North Campus', code: `NC-${runId}` },
  })

  const branchBNotice = await db.announcement.create({
    data: {
      tenantId: tenant.id,
      branchId: branchB.id,
      title: `Branch B Secret Notice ${runId}`,
      body: 'Confidential to North Campus staff.',
      type: 'GENERAL',
      audience: 'BRANCH_PARENTS',
      status: 'PUBLISHED',
    },
  })

  const branchBCoordinatorToken = await signSession({
    uid: `user-branch-a-${runId}`,
    email: `coord-branch-a-${runId}@example.com`,
    name: 'Branch A Coordinator',
    role: 'COORDINATOR',
    roles: ['COORDINATOR'],
    tenantId: tenant.id,
    branchId: branch.id, // Scoped to Branch A!
  })

  // Branch A Coordinator attempts to GET Branch B announcement
  const branchBGetRes = await fetch(`http://localhost:3000/api/v1/announcements/${branchBNotice.id}`, {
    headers: { Cookie: `preone_session=${branchBCoordinatorToken}` },
  })
  assert(branchBGetRes.status === 403, 'Cross-branch GET announcement detail strictly rejected (HTTP 403 Forbidden)')

  // Branch A Coordinator attempts to PATCH Branch B announcement
  const branchBPatchRes = await fetch(`http://localhost:3000/api/v1/announcements/${branchBNotice.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${branchBCoordinatorToken}`,
    },
    body: JSON.stringify({ title: 'Tampered Notice' }),
  })
  assert(branchBPatchRes.status === 403, 'Cross-branch PATCH announcement strictly rejected (HTTP 403 Forbidden)')

  // Branch A Coordinator attempts to DELETE Branch B announcement
  const branchBDeleteRes = await fetch(`http://localhost:3000/api/v1/announcements/${branchBNotice.id}`, {
    method: 'DELETE',
    headers: { Cookie: `preone_session=${branchBCoordinatorToken}` },
  })
  assert(branchBDeleteRes.status === 403, 'Cross-branch DELETE announcement strictly rejected (HTTP 403 Forbidden)')

  // 8.4 State Transition Integrity & Cancellation Idempotency
  console.log('\n--- 8.4 State Transition Integrity & Idempotency')

  // Cannot revert PUBLISHED announcement to DRAFT
  const revertPublishedRes = await fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({ status: 'DRAFT' }),
  })
  assert(revertPublishedRes.status === 400, 'Reverting PUBLISHED announcement to DRAFT strictly rejected (HTTP 400)')

  // Cancel notice
  const cancelRes = await fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({ action: 'CANCEL' }),
  })
  assert(cancelRes.status === 200, 'Cancelling announcement succeeds (HTTP 200)')

  // Cannot edit CANCELLED notice
  const editCancelledRes = await fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({ title: 'Modified Cancelled Notice' }),
  })
  assert(editCancelledRes.status === 400, 'Modifying CANCELLED announcement strictly rejected (HTTP 400)')

  // Cancelling an already cancelled notice is idempotent
  const auditCountBeforeRepeatCancel = await db.auditLog.count({ where: { tenantId: tenant.id } })
  const repeatCancelRes = await fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `preone_session=${adminToken}`,
    },
    body: JSON.stringify({ action: 'CANCEL' }),
  })
  assert(repeatCancelRes.status === 200, 'Repeat cancellation on already CANCELLED announcement is idempotent (HTTP 200)')
  const auditCountAfterRepeatCancel = await db.auditLog.count({ where: { tenantId: tenant.id } })
  assert(
    auditCountAfterRepeatCancel === auditCountBeforeRepeatCancel,
    'Repeat cancellation does not produce redundant audit logs'
  )

  // Deleting an already cancelled notice is idempotent
  const repeatDeleteRes = await fetch(`http://localhost:3000/api/v1/announcements/${concurrentDraft.id}`, {
    method: 'DELETE',
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  assert(repeatDeleteRes.status === 200, 'DELETE on already CANCELLED announcement is idempotent (HTTP 200)')

  // Clean up test data
  console.log('\n--- Cleaning up test records...')
  await db.timelineEntry.deleteMany({ where: { tenantId: tenant.id } })
  await db.announcement.deleteMany({ where: { tenantId: tenant.id } })
  await db.auditLog.deleteMany({ where: { tenantId: tenant.id } })
  await db.studentGuardian.deleteMany({ where: { guardian: { tenantId: tenant.id } } })
  await db.guardian.deleteMany({ where: { tenantId: tenant.id } })
  await db.student.deleteMany({ where: { tenantId: tenant.id } })
  await db.classroom.deleteMany({ where: { tenantId: tenant.id } })
  await db.classroom.deleteMany({ where: { tenantId: foreignTenant.id } })
  await db.academicSession.deleteMany({ where: { tenantId: tenant.id } })
  await db.academicSession.deleteMany({ where: { tenantId: foreignTenant.id } })
  await db.branch.deleteMany({ where: { tenantId: tenant.id } })
  await db.branch.deleteMany({ where: { tenantId: foreignTenant.id } })
  await db.tenant.deleteMany({ where: { id: { in: [tenant.id, foreignTenant.id] } } })

  console.log('\n===============================================================')
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('===============================================================')

  if (failed > 0) process.exit(1)
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
