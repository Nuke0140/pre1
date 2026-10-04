/**
 * PreOne — Gap Remediation & Production Hardening Automated Verification Suite
 * Tests security invariants, canonical DB authorization, draft PDF restrictions,
 * bulk evaluation write safety, dynamic template fields, and database migrations.
 */

import fs from 'fs'
import path from 'path'
import { db } from '../src/lib/db'
import { ReportCardService } from '../src/lib/academics/report-card-service'
import { TemplateService } from '../src/lib/templates/template-service'
import { BulkDocumentService } from '../src/lib/reports/bulk-document-service'
import { StudentService } from '../src/lib/students/student-service'

async function runTests() {
  console.log('================================================================')
  console.log('🚀 PreOne — Gap Remediation & Production Hardening Test Suite')
  console.log('================================================================\n')

  let passedTests = 0
  let failedTests = 0

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`)
      passedTests++
    } else {
      console.error(`❌ FAIL: ${testName}`)
      if (details) console.error(`   Details: ${details}`)
      failedTests++
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. MIGRATIONS & SCHEMA INTEGRITY
  // ─────────────────────────────────────────────────────────────
  console.log('▶ [1/6] Testing Database Migrations & Schema Files...')
  const lockFilePath = path.join(process.cwd(), 'prisma', 'migrations', 'migration_lock.toml')
  const migrationSqlPath = path.join(
    process.cwd(),
    'prisma',
    'migrations',
    '20261004_student_health_and_report_cards',
    'migration.sql'
  )

  assert(fs.existsSync(lockFilePath), 'migration_lock.toml exists in prisma/migrations')
  assert(fs.existsSync(migrationSqlPath), 'Production SQL migration exists for student health and report cards')

  if (fs.existsSync(migrationSqlPath)) {
    const sqlContent = fs.readFileSync(migrationSqlPath, 'utf8')
    assert(
      sqlContent.includes('ALTER TABLE "students"') &&
      sqlContent.includes('"allergies" TEXT') &&
      sqlContent.includes('CREATE TABLE "student_report_cards"'),
      'Migration SQL contains student health columns and student_report_cards table'
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STUDENT HEALTH DIRECTIVES SANITIZATION & LIMITS
  // ─────────────────────────────────────────────────────────────
  console.log('\n▶ [2/6] Testing Student Medical Directives Sanitization & Field Limits...')
  // Test sanitization helper behavior directly through StudentService
  const maliciousXss = '<script>alert("XSS")</script>Nut allergy <b>severe</b>'
  const oversizedText = 'A'.repeat(800)

  // Verify DB Student model supports the fields
  const sampleTenant = await db.tenant.findFirst()
  if (!sampleTenant) {
    console.warn('⚠️ No tenant found in DB, skipping live student update test')
  } else {
    // Find or create a test student
    let testStudent = await db.student.findFirst({
      where: { tenantId: sampleTenant.id, deletedAt: null },
    })

    if (testStudent) {
      const updated = await StudentService.updateStudent(
        { tenantId: sampleTenant.id, actorId: 'TEST_USER', actorName: 'Tester', actorRole: 'ADMIN' },
        testStudent.id,
        {
          allergies: maliciousXss,
          medicalAlerts: oversizedText,
        }
      )

      assert(
        !updated.allergies?.includes('<script>') && !updated.allergies?.includes('<b>'),
        'HTML tags stripped from medical directives (anti-XSS)'
      )
      assert(
        (updated.medicalAlerts?.length || 0) <= 500,
        'Max character limit (500) enforced for medicalAlerts'
      )
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. DYNAMIC TEMPLATE STUDIO FIELDS EXTRACTION
  // ─────────────────────────────────────────────────────────────
  console.log('\n▶ [3/6] Testing Dynamic Template Studio Fields Extraction...')

  // Test standard fallback (5 holistic early childhood domains)
  const defaultFields = ReportCardService.getTemplateFields(null)
  assert(defaultFields.length === 5, 'Default report card fallback provides 5 early childhood domains')
  assert(
    defaultFields.some((f) => f.key === 'domainMotor') &&
    defaultFields.some((f) => f.key === 'domainCreative'),
    'Fallback contains Gross & Fine Motor Skills and Creative Arts'
  )

  // Test custom template with explicit fields array
  const customTemplateDef = {
    content: {
      fields: [
        { key: 'math_skills', label: 'Mathematics & Numeracy', type: 'grade', options: ['A', 'B', 'C'] },
        { key: 'science_curiosity', label: 'Inquiry & Discovery', type: 'rating' },
      ],
    },
  }
  const extractedCustom = ReportCardService.getTemplateFields(customTemplateDef)
  assert(extractedCustom.length === 2, 'Custom template with fields array correctly extracted')
  assert(extractedCustom[0].key === 'math_skills', 'Custom field keys preserved')

  // ─────────────────────────────────────────────────────────────
  // 4. DYNAMIC PDF TABLE RENDERING (dataContext['table.rows'])
  // ─────────────────────────────────────────────────────────────
  console.log('\n▶ [4/6] Testing Dynamic HTML/PDF Table Rendering...')
  const mockTemplateDef: any = {
    version: 1,
    status: 'PUBLISHED',
    documentType: 'REPORT_CARD',
    pageSize: 'A4_PORTRAIT',
    orientation: 'portrait',
    widthMm: 210,
    heightMm: 297,
    backgroundColor: '#FFFFFF',
    elements: [
      {
        id: 'rep-table',
        type: 'table',
        name: 'Report Card Table',
        x: 10,
        y: 10,
        width: 190,
        height: 100,
        styles: {
          tableColumns: [
            { key: 'domain', label: 'Domain', widthPercent: 50, align: 'left' },
            { key: 'milestone', label: 'Milestone', widthPercent: 30, align: 'left' },
            { key: 'rating', label: 'Rating', widthPercent: 20, align: 'center' },
          ],
        },
      },
    ],
  }

  const mockContext = {
    'table.rows': [
      { domain: 'Motor Skills', milestone: 'Pencil grasp', rating: 'Mastered' },
      { domain: 'Social Harmony', milestone: 'Shares toys with peers', rating: 'Developing' },
    ],
  }

  const renderedHtml = TemplateService.renderTemplateHtml(mockTemplateDef, mockContext)
  assert(renderedHtml.includes('Motor Skills'), 'Dynamic table row "Motor Skills" rendered in HTML')
  assert(renderedHtml.includes('Shares toys with peers'), 'Dynamic milestone text rendered in HTML')
  assert(renderedHtml.includes('Mastered') && renderedHtml.includes('Developing'), 'Ratings rendered in HTML')

  // ─────────────────────────────────────────────────────────────
  // 5. PARENT AUTHORIZATION & DRAFT RESTRICTIONS
  // ─────────────────────────────────────────────────────────────
  console.log('\n▶ [5/6] Testing Canonical Parent Auth & Draft PDF Restrictions...')
  if (sampleTenant) {
    // Check if we can find or create a mock report card to test draft protection
    const session = await db.academicSession.findFirst({ where: { tenantId: sampleTenant.id } })
    const student = await db.student.findFirst({ where: { tenantId: sampleTenant.id, deletedAt: null } })
    const template = await db.documentTemplate.findFirst({
      where: { tenantId: sampleTenant.id, type: 'REPORT_CARD' },
    })

    if (session && student && template) {
      // 1. Create a DRAFT report card
      const draftRc = await db.studentReportCard.upsert({
        where: {
          tenantId_academicSessionId_term_studentId_templateId: {
            tenantId: sampleTenant.id,
            academicSessionId: session.id,
            term: 'Test Term Draft',
            studentId: student.id,
            templateId: template.id,
          },
        },
        update: { status: 'DRAFT' },
        create: {
          tenantId: sampleTenant.id,
          academicSessionId: session.id,
          term: 'Test Term Draft',
          studentId: student.id,
          templateId: template.id,
          status: 'DRAFT',
          templateVersion: 1,
          fieldValues: {},
        },
      })

      // Create a linked GeneratedProfileDocument
      const draftDoc = await db.generatedProfileDocument.create({
        data: {
          tenantId: sampleTenant.id,
          entityType: 'STUDENT',
          studentId: student.id,
          templateId: template.id,
          documentType: 'REPORT_CARD',
          title: 'Draft Report Card PDF',
          fileName: 'draft_report.pdf',
          fileUrl: '/uploads/documents/draft_report.pdf',
          fileSizeBytes: 1024,
          mimeType: 'application/pdf',
          metadata: { reportCardId: draftRc.id },
        },
      })

      // Link document to report card
      await db.studentReportCard.update({
        where: { id: draftRc.id },
        data: { documentId: draftDoc.id },
      })

      // Attempt to access document as a GUARDIAN user
      let blockedError = ''
      try {
        await BulkDocumentService.getDocumentForAccess(
          sampleTenant.id,
          draftDoc.id,
          {
            uid: 'mock-guardian-user',
            role: 'GUARDIAN',
            roles: ['GUARDIAN'],
          }
        )
      } catch (err: any) {
        blockedError = err.message
      }

      assert(
        blockedError.includes('published report cards') || blockedError.includes('access this document'),
        'Guardian access to DRAFT report card PDF blocked'
      )

      // Clean up test document & report card
      await db.studentReportCard.deleteMany({ where: { id: draftRc.id } })
      await db.generatedProfileDocument.deleteMany({ where: { id: draftDoc.id } })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. BULK EVALUATION ENROLLMENT VALIDATION & MERGE LOGIC
  // ─────────────────────────────────────────────────────────────
  console.log('\n▶ [6/6] Testing Bulk Evaluation Enrollment Validation & Omitted Field Merging...')
  if (sampleTenant) {
    const session = await db.academicSession.findFirst({ where: { tenantId: sampleTenant.id } })
    const classroom = await db.classroom.findFirst({ where: { tenantId: sampleTenant.id } })
    const template = await db.documentTemplate.findFirst({
      where: { tenantId: sampleTenant.id, type: 'REPORT_CARD' },
    })

    if (session && classroom && template) {
      // Test 1: Bulk save with an un-enrolled fake student ID should reject that student
      const bulkResult = await ReportCardService.bulkSaveReportCards(
        {
          tenantId: sampleTenant.id,
          actorId: 'test-teacher',
          actorName: 'Test Teacher',
          actorRole: 'TEACHER',
        },
        {
          academicSessionId: session.id,
          classroomId: classroom.id,
          term: 'Term 1 Test Bulk',
          templateId: template.id,
          status: 'DRAFT',
          items: [
            {
              studentId: 'non-existent-student-id-9999',
              overallGrade: 'A',
              fieldValues: {},
            },
          ],
        }
      )

      assert(bulkResult.failedCount === 1, 'Un-enrolled student rejected during bulk evaluation save')
      assert(
        bulkResult.results[0].error?.includes('not actively enrolled') || false,
        'Actionable error message returned for un-enrolled student'
      )
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================')
  console.log(`Test Execution Finished: ${passedTests} PASSED, ${failedTests} FAILED`)
  console.log('================================================================')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests()
  .catch((err) => {
    console.error('Fatal test runner failure:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
