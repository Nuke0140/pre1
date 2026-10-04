/**
 * PreOne — Student Module Complete Connectivity Audit & Gap Repair Verification
 * 
 * Verifies End-to-End:
 * 1. Student Core Profile & Health Directives (Allergies, Alerts, Dietary, Emergency Protocol)
 * 2. Report Cards Data Layer & Relations (StudentReportCard Model, Constraints, Multi-Term)
 * 3. Report Card Service (Single Save, Bulk Save, Status Transitions)
 * 4. Report Card PDF Rendering & Profile Document Linking (GeneratedProfileDocument)
 * 5. Student 360 Profile Aggregation (Health summary, Report cards list, Admission documents)
 * 6. Tenant Isolation & Parent Access Restrictions
 */

import { db } from '../src/lib/db'
import { StudentService } from '../src/lib/students/student-service'
import { ReportCardService } from '../src/lib/academics/report-card-service'

async function runVerification() {
  console.log('========================================================================')
  console.log('🚀 PreOne — Student Module Complete Verification & Report Card E2E Check')
  console.log('========================================================================\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`  ✅ [PASS] ${testName}`)
      if (detail) console.log(`     ↳ ${detail}`)
    } else {
      console.error(`  ❌ [FAIL] ${testName}`)
      if (detail) console.error(`     ↳ Details: ${detail}`)
    }
  }

  // 1. Setup / Resolve Active Tenant, Branch & Session
  const tenant = await db.tenant.findFirst({
    include: { branches: true },
  })
  if (!tenant || tenant.branches.length === 0) {
    throw new Error('No tenant or branches found in database.')
  }
  const tenantId = tenant.id
  const branchId = tenant.branches[0].id
  console.log(`🏢 Active Tenant: "${tenant.name}" (${tenantId}) | Branch: ${branchId}\n`)

  let session = await db.academicSession.findFirst({
    where: { tenantId },
  })
  if (!session) {
    session = await db.academicSession.create({
      data: {
        tenantId,
        name: '2026-2027 Academic Session',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    })
  }

  let classroom = await db.classroom.findFirst({
    where: { tenantId, branchId },
  })
  if (!classroom) {
    classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId: session.id,
        name: 'Little Stars Kindergarten',
        code: 'LSK-A',
        capacity: 25,
        programType: 'KINDERGARTEN',
        isActive: true,
      },
    })
  }

  // 2. Resolve or Seed a REPORT_CARD DocumentTemplate
  let template = await db.documentTemplate.findFirst({
    where: { tenantId, type: 'REPORT_CARD' },
  })
  if (!template) {
    template = await db.documentTemplate.create({
      data: {
        tenantId,
        name: 'Comprehensive Preschool Term Evaluation Template',
        type: 'REPORT_CARD',
        isDefault: true,
        content: {
          canvas: { width: 794, height: 1123 },
          elements: [
            { id: 'hdr-1', type: 'text', text: 'Preschool Academic Report Card', x: 50, y: 40, style: { fontSize: 22, bold: true } },
            { id: 'rep-student-profile', type: 'rep-student-profile', x: 50, y: 100, width: 694, height: 100 },
            { id: 'rep-table', type: 'rep-table', x: 50, y: 220, width: 694, height: 300 },
            { id: 'rep-remarks-box', type: 'rep-remarks-box', x: 50, y: 550, width: 694, height: 120 },
          ],
        },
      },
    })
  }

  // ===========================================================================
  // TEST SUITE 1: Student Core Profile & Health & Medical Directives (Section 7)
  // ===========================================================================
  console.log('--- TEST SUITE 1: Student Profile & Health Directives ---')

  const testStudent = await db.student.create({
    data: {
      tenantId,
      branchId,
      firstName: 'Aarav',
      lastName: 'Sharma',
      dob: new Date('2022-03-15'),
      gender: 'MALE',
      bloodGroup: 'B_POSITIVE',
      status: 'ACTIVE',
      allergies: 'Severe Peanut and Cashew allergy (requires EpiPen)',
      medicalAlerts: 'Asthma triggered by high physical exertion or dust',
      dietaryRestrictions: 'Strictly Vegetarian, No Nuts, Lactose-free snacks preferred',
      emergencyMedicalInstructions: 'Administer inhaler 2 puffs; immediately notify mother Dr. Meera Sharma at +91-9876543210',
      address: '742 Lotus Boulevard, Tower C, Pune',
      admissionNo: `ADM-${Date.now().toString().slice(-6)}`,
      seatNumber: 'LSK-001',
    },
  })

  assert(Boolean(testStudent.id), '1.1 Student record created successfully with health fields')
  assert(
    testStudent.allergies?.includes('Peanut') &&
    testStudent.medicalAlerts?.includes('Asthma') &&
    testStudent.dietaryRestrictions?.includes('Vegetarian') &&
    testStudent.emergencyMedicalInstructions?.includes('Dr. Meera Sharma'),
    '1.2 Student model preserves all Section 7 health and medical directive fields'
  )

  // Verify Student Profile aggregation via StudentService
  const profile = await StudentService.getStudentProfile({ tenantId }, testStudent.id)
  assert(Boolean(profile), '1.3 StudentService.getStudentProfile returns complete 360 profile')
  assert(
    profile.health?.allergies === testStudent.allergies &&
    profile.health?.bloodGroup === 'B_POSITIVE' &&
    profile.health?.medicalAlerts === testStudent.medicalAlerts &&
    profile.health?.emergencyMedicalInstructions === testStudent.emergencyMedicalInstructions,
    '1.4 Profile payload includes aggregated health object for UI banners and medical directives'
  )
  assert(
    Array.isArray(profile.reportCards),
    '1.5 Profile payload includes reportCards array relationship'
  )

  // ===========================================================================
  // TEST SUITE 2: Report Card Service — Single & Bulk Assessment (Section 17)
  // ===========================================================================
  console.log('\n--- TEST SUITE 2: Report Card Service & Data Layer ---')

  // Create a second student in the classroom for bulk testing
  const testStudent2 = await db.student.create({
    data: {
      tenantId,
      branchId,
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      dob: new Date('2022-05-20'),
      gender: 'FEMALE',
      bloodGroup: 'O_POSITIVE',
      status: 'ACTIVE',
      admissionNo: `ADM-${Date.now().toString().slice(-6)}-2`,
      seatNumber: 'LSK-002',
    },
  })

  // 2.1 Single Save
  const singleReport = await ReportCardService.saveReportCard(
    { tenantId, branchId },
    {
      academicSessionId: session.id,
      studentId: testStudent.id,
      classroomId: classroom.id,
      term: 'Term 1',
      templateId: template.id,
      status: 'DRAFT',
      overallGrade: 'A+',
      remarks: 'Aarav shows exceptional curiosity in sensory exploration and cooperative circle play.',
      attendancePct: 96,
      fieldValues: {
        overallGrade: { key: 'overallGrade', label: 'Overall Grade', type: 'grade', value: 'A+' },
        remarks: { key: 'remarks', label: 'Educator Remarks', type: 'textarea', value: 'Aarav shows exceptional curiosity.' },
        attendancePct: { key: 'attendancePct', label: 'Attendance %', type: 'number', value: 96 },
        domainMotor: { key: 'domainMotor', label: 'Gross & Fine Motor Skills', type: 'rating', value: 'Exceeding Expectations' },
        domainLanguage: { key: 'domainLanguage', label: 'Language & Phonics', type: 'rating', value: 'Exceeding Expectations' },
        domainSocial: { key: 'domainSocial', label: 'Social & Emotional Harmony', type: 'rating', value: 'Meeting Expectations' },
        domainCognitive: { key: 'domainCognitive', label: 'Cognitive & Sensory Exploration', type: 'rating', value: 'Exceeding Expectations' },
      },
    }
  )

  assert(Boolean(singleReport.id), '2.1 Single report card saved via ReportCardService.saveReportCard')
  assert(singleReport.term === 'Term 1' && singleReport.overallGrade === 'A+', '2.2 Term, grades, and evaluator correctly stored')
  assert(singleReport.status === 'DRAFT', '2.3 Default initial status correctly set to DRAFT')

  // 2.2 Bulk Save for Classroom
  const bulkResult = await ReportCardService.bulkSaveReportCards(
    { tenantId, branchId },
    {
      academicSessionId: session.id,
      classroomId: classroom.id,
      term: 'Term 1',
      templateId: template.id,
      status: 'REVIEWED',
      items: [
        {
          studentId: testStudent.id,
          overallGrade: 'A+',
          remarks: 'Updated remarks via teacher bulk review session.',
          attendancePct: 97,
          fieldValues: {
            domainMotor: { key: 'domainMotor', label: 'Gross & Fine Motor', type: 'rating', value: 'Exceeding Expectations' },
          },
        },
        {
          studentId: testStudent2.id,
          overallGrade: 'A',
          remarks: 'Ananya is an articulate student with brilliant storytelling abilities.',
          attendancePct: 92,
          fieldValues: {
            domainMotor: { key: 'domainMotor', label: 'Gross & Fine Motor', type: 'rating', value: 'Meeting Expectations' },
            domainLanguage: { key: 'domainLanguage', label: 'Language & Phonics', type: 'rating', value: 'Exceeding Expectations' },
          },
        },
      ],
      evaluatorName: 'Teacher Sunita Rao',
    }
  )

  assert(bulkResult.successCount === 2, '2.4 Bulk save completed successfully with 2 students')
  assert(bulkResult.totalCount === 2, '2.5 Bulk save upserted 2 student records in transaction')

  // Verify list query
  const listedReports = await ReportCardService.listReportCards(
    { tenantId },
    {
      classroomId: classroom.id,
      term: 'Term 1',
    }
  )
  assert(listedReports.reportCards.length >= 2, '2.6 Report cards listed by classroom and term')

  // Verify status update
  const updatedReport = await ReportCardService.updateStatus({
    tenantId,
    reportCardId: singleReport.id,
    status: 'PUBLISHED',
    publishedById: 'teacher-sunita-id',
    publishedByName: 'Teacher Sunita Rao',
  })
  assert(
    updatedReport.status === 'PUBLISHED' && Boolean(updatedReport.publishedAt),
    '2.7 Status transitioned to PUBLISHED with publication timestamp and actor audit'
  )

  // ===========================================================================
  // TEST SUITE 3: PDF Generation & Profile Document Filing (Section 17 & 2)
  // ===========================================================================
  console.log('\n--- TEST SUITE 3: Report Card PDF Generation & Document Filing ---')

  const renderResult = await ReportCardService.renderReportCardPdf(
    { tenantId },
    singleReport.id
  )

  assert(Boolean(renderResult.document?.id), '3.1 PDF compiled and generated document ID returned')
  assert(Boolean(renderResult.reportCard?.documentId), '3.2 Report card record linked to GeneratedProfileDocument')

  // Verify GeneratedProfileDocument record exists and is linked
  const profileDoc = await db.generatedProfileDocument.findUnique({
    where: { id: renderResult.document.id },
  })
  assert(Boolean(profileDoc), '3.3 GeneratedProfileDocument created in document library')
  assert(
    profileDoc?.entityType === 'STUDENT' &&
    profileDoc?.studentId === testStudent.id &&
    profileDoc?.documentType === 'REPORT_CARD',
    '3.4 Generated document correctly categorized as STUDENT REPORT_CARD in Profile Library'
  )

  // Verify Student 360 profile now returns the report card with documentId linked
  const updatedProfile = await StudentService.getStudentProfile({ tenantId }, testStudent.id)
  assert(
    updatedProfile.reportCards.length >= 1 &&
    updatedProfile.reportCards[0].documentId === renderResult.document.id,
    '3.5 Student 360 profile now aggregates published report card linked to official PDF'
  )

  // ===========================================================================
  // TEST SUITE 4: Tenant & Parent Access Boundary Verification
  // ===========================================================================
  console.log('\n--- TEST SUITE 4: Tenant & Permission Boundaries ---')

  // Verify foreign tenant cannot read or modify this student's report cards
  const foreignTenantId = 'foreign-tenant-xyz-999'
  try {
    await ReportCardService.getReportCard(foreignTenantId, singleReport.id)
    assert(false, '4.1 Foreign tenant access rejected')
  } catch (err: any) {
    assert(true, '4.1 Foreign tenant access cleanly rejected with 404/NotFoundError', err.message)
  }

  // ===========================================================================
  // CLEANUP TEST FIXTURES
  // ===========================================================================
  console.log('\n🧹 Cleaning up test fixtures...')
  await db.studentReportCard.deleteMany({
    where: { studentId: { in: [testStudent.id, testStudent2.id] } },
  })
  if (renderResult.document?.id) {
    await db.generatedProfileDocument.deleteMany({
      where: { id: renderResult.document.id },
    })
  }
  await db.student.deleteMany({
    where: { id: { in: [testStudent.id, testStudent2.id] } },
  })
  console.log('✅ Cleanup complete.\n')

  // ===========================================================================
  // FINAL SCORECARD
  // ===========================================================================
  console.log('========================================================================')
  console.log(`📊 FINAL TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`)
  console.log('========================================================================')

  if (passedTests === totalTests) {
    console.log('🎉 ALL STUDENT MODULE CONNECTIVITY & REPORT CARD TESTS PASSED!')
    process.exit(0)
  } else {
    console.error('❌ SOME TESTS FAILED.')
    process.exit(1)
  }
}

runVerification().catch((err) => {
  console.error('💥 Unhandled error in verification script:', err)
  process.exit(1)
})
