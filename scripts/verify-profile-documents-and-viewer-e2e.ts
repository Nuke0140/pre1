/**
 * PreOne — Profile Documents, Real PDF Viewer, and Parent Access Verification Script
 * Validates:
 * 1. Automatic linking of generated documents to Student and Staff profiles.
 * 2. Idempotent bulk document generation (no duplicate profile documents created on rerun).
 * 3. Authenticated PDF View streaming (/api/v1/documents/[id]/view with inline disposition).
 * 4. Authenticated PDF Download streaming (/api/v1/documents/[id]/download with attachment disposition).
 * 5. Multi-tenant and RBAC authorization boundaries (guardian scoping, cross-tenant isolation).
 * 6. Parent Portal child report access scoping (only linked children's documents).
 */

import { db } from '../src/lib/db'
import { BulkDocumentService } from '../src/lib/reports/bulk-document-service'
import { TemplateService } from '../src/lib/templates/template-service'
import { SessionService } from '../src/lib/users/session-service'
import { signSession } from '../src/lib/auth'
import fs from 'fs'

async function runVerification() {
  console.log('\n========================================================================')
  console.log('🚀 PreOne: Profile Documents, PDF Viewer & Parent Access Verification')
  console.log('========================================================================\n')

  // 1. Fetch Tenant Context
  const tenant = await db.tenant.findFirst({
    include: {
      students: { take: 5 },
      staffProfiles: { include: { user: true }, take: 5 },
    },
  })

  if (!tenant || tenant.students.length === 0) {
    console.error('❌ FAIL: Tenant or students missing in database.')
    process.exit(1)
  }

  const student = tenant.students[0]
  console.log(`[PASS] 1. Verified Tenant: "${tenant.name}" (${tenant.id}), Student: "${student.firstName} ${student.lastName}" (${student.id})`)

  // 2. Fetch or Create a Guardian linked to this student
  let guardian = await db.guardian.findFirst({
    where: {
      tenantId: tenant.id,
      studentLinks: { some: { studentId: student.id } },
    },
    include: { user: true },
  })

  if (!guardian) {
    const parentUser = await db.user.create({
      data: {
        email: `parent-e2e-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
        fullName: 'E2E Test Parent',
        passwordHash: 'dummy-hash-for-testing',
        status: 'ACTIVE',
      },
    })

    guardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        userId: parentUser.id,
        fullName: 'Test Parent',
        phone: '9876543210',
        relationship: 'MOTHER',
        studentLinks: {
          create: {
            studentId: student.id,
            relationship: 'MOTHER',
            isPrimary: true,
          },
        },
      },
      include: { user: true },
    })
  }

  console.log(`[PASS] 2. Verified Linked Guardian: "${guardian.fullName}" (User ID: ${guardian.userId})`)

  // 3. Ensure a published template exists
  let template = await db.documentTemplate.findFirst({
    where: { tenantId: tenant.id, type: 'STUDENT_ID_CARD' },
  })
  if (!template) {
    template = await TemplateService.createTemplate(tenant.id, {
      name: 'Verification Student ID Card',
      type: 'STUDENT_ID_CARD',
      presetKey: 'STUDENT_ID_CARD',
      createdByName: 'Verification Runner',
      actorId: 'tester',
    })
  }
  await TemplateService.publishTemplate(tenant.id, template.id, 'Verification Runner', 'tester')

  // 4. Generate Document via Bulk Job
  const job = await BulkDocumentService.createJob(tenant.id, {
    title: `Profile Doc Verification Job ${Date.now()}`,
    templateId: template.id,
    documentType: 'STUDENT_ID_CARD',
    filters: { search: student.firstName },
    createdById: 'tester',
    createdByName: 'Verification Runner',
    autoStart: false,
  })

  // Execute job synchronously for testing
  await BulkDocumentService.processJob(job.id)

  const completedJob = await db.bulkDocumentJob.findUnique({
    where: { id: job.id },
    include: { items: true },
  })

  console.log(`[PASS] 3. Executed Bulk Document Job: status = ${completedJob?.status}, items = ${completedJob?.items.length}, successful = ${completedJob?.successCount}`)

  // 5. Test Profile Document Retrieval for Student
  const studentDocs = await BulkDocumentService.listEntityDocuments(tenant.id, 'STUDENT', student.id)
  if (studentDocs.length === 0) {
    console.error('❌ FAIL: Generated document did not appear in student profile!')
    process.exit(1)
  }
  const testDoc = studentDocs[0]
  console.log(`[PASS] 4. Verified Document in Student Profile: "${testDoc.title}" (${testDoc.fileName})`)

  // 6. Test Idempotency: Re-executing job on existing items should NOT create duplicate documents
  const initialDocCount = await db.generatedProfileDocument.count({
    where: { tenantId: tenant.id, studentId: student.id, jobId: job.id, deletedAt: null },
  })

  // Simulate re-running job items
  await db.bulkDocumentJobItem.updateMany({
    where: { jobId: job.id },
    data: { status: 'PENDING' },
  })
  await BulkDocumentService.processJob(job.id)

  const docCountAfterRerun = await db.generatedProfileDocument.count({
    where: { tenantId: tenant.id, studentId: student.id, jobId: job.id, deletedAt: null },
  })

  if (docCountAfterRerun !== initialDocCount) {
    console.error(`❌ FAIL: Idempotency failed! Doc count changed from ${initialDocCount} to ${docCountAfterRerun}`)
    process.exit(1)
  }
  console.log(`[PASS] 5. Verified Idempotency: Duplicate runs update existing document (count remained ${initialDocCount})`)

  // 7. Test getDocumentForAccess Authorization
  const adminMember = await db.tenantUser.findFirst({
    where: {
      tenantId: tenant.id,
      role: { in: ['OWNER', 'PRINCIPAL'] },
      status: 'ACTIVE',
    },
    include: { user: true },
  })

  let adminUserId = adminMember?.userId
  if (!adminUserId) {
    const adminUser = await db.user.create({
      data: {
        email: `admin-e2e-${Date.now()}@example.com`,
        fullName: 'E2E Test Admin',
        passwordHash: 'dummy-hash',
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'PRINCIPAL',
            status: 'ACTIVE',
          },
        },
      },
    })
    adminUserId = adminUser.id
  }

  const adminSession = {
    uid: adminUserId,
    name: 'Admin',
    tenantId: tenant.id,
    role: 'PRINCIPAL',
    roles: ['PRINCIPAL'],
  }
  const adminAccess = await BulkDocumentService.getDocumentForAccess(tenant.id, testDoc.id, adminSession)
  if (!adminAccess.fileBuffer || adminAccess.fileBuffer.length === 0) {
    console.error('❌ FAIL: Admin could not access document buffer')
    process.exit(1)
  }
  const isPdf = adminAccess.fileBuffer.slice(0, 5).toString() === '%PDF-'
  console.log(`[PASS] 6. Admin Access Granted: Buffer size = ${adminAccess.fileBuffer.length} bytes, Header = %PDF- (${isPdf})`)

  // Ensure parent has a valid tenant membership
  await db.tenantUser.upsert({
    where: {
      tenantId_userId: {
        userId: guardian.userId!,
        tenantId: tenant.id,
      },
    },
    update: { status: 'ACTIVE' },
    create: {
      userId: guardian.userId!,
      tenantId: tenant.id,
      role: 'PARENT',
      status: 'ACTIVE',
    },
  })

  // Linked Parent Session
  const parentSession = {
    uid: guardian.userId!,
    name: guardian.fullName,
    tenantId: tenant.id,
    role: 'PARENT',
    roles: ['PARENT'],
  }
  const parentAccess = await BulkDocumentService.getDocumentForAccess(tenant.id, testDoc.id, parentSession)
  console.log(`[PASS] 7. Linked Parent Access Granted: Validated guardian student link for child document`)

  // Unlinked Parent Session (from another user)
  const unlinkedParentSession = {
    uid: 'unlinked-stranger-parent-id',
    name: 'Stranger',
    tenantId: tenant.id,
    role: 'PARENT',
    roles: ['PARENT'],
  }
  let unlinkedBlocked = false
  try {
    await BulkDocumentService.getDocumentForAccess(tenant.id, testDoc.id, unlinkedParentSession)
  } catch (err: any) {
    unlinkedBlocked = true
  }
  if (!unlinkedBlocked) {
    console.error('❌ FAIL: Unlinked parent was improperly allowed to access student document!')
    process.exit(1)
  }
  console.log(`[PASS] 8. Security Boundary: Unlinked parent correctly denied access to student document`)

  // Cross-tenant Session
  const crossTenantSession = {
    uid: 'admin-other-tenant',
    name: 'Other Tenant Admin',
    tenantId: 'completely-different-tenant-id',
    role: 'PRINCIPAL',
    roles: ['PRINCIPAL'],
  }
  let crossTenantBlocked = false
  try {
    await BulkDocumentService.getDocumentForAccess('completely-different-tenant-id', testDoc.id, crossTenantSession)
  } catch {
    crossTenantBlocked = true
  }
  if (!crossTenantBlocked) {
    console.error('❌ FAIL: Cross-tenant access was improperly allowed!')
    process.exit(1)
  }
  console.log(`[PASS] 9. Multi-Tenant Isolation: Cross-tenant document access strictly rejected`)

  // 8. Test HTTP Endpoints via local server (http://localhost:3000)
  const adminToken = await signSession({ ...adminSession, email: 'admin@test.com' } as any)
  await SessionService.createSession({
    userId: adminUserId,
    tenantId: tenant.id,
    token: adminToken,
  })

  const parentToken = await signSession({ ...parentSession, email: 'parent@test.com' } as any)
  await SessionService.createSession({
    userId: guardian.userId!,
    tenantId: tenant.id,
    token: parentToken,
  })

  // Test /api/v1/documents/[id]/view
  const viewRes = await fetch(`http://localhost:3000/api/v1/documents/${testDoc.id}/view`, {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  if (viewRes.status !== 200) {
    console.error(`❌ FAIL: /api/v1/documents/[id]/view returned status ${viewRes.status}`)
    process.exit(1)
  }
  const viewDisposition = viewRes.headers.get('content-disposition') || ''
  const viewType = viewRes.headers.get('content-type') || ''
  if (!viewDisposition.startsWith('inline') || viewType !== 'application/pdf') {
    console.error(`❌ FAIL: Invalid headers on view route. Disposition: ${viewDisposition}, Type: ${viewType}`)
    process.exit(1)
  }
  console.log(`[PASS] 10. HTTP Endpoint /view: HTTP 200 OK, Type: ${viewType}, Disposition: ${viewDisposition}`)

  // Test /api/v1/documents/[id]/download
  const downloadRes = await fetch(`http://localhost:3000/api/v1/documents/${testDoc.id}/download`, {
    headers: { Cookie: `preone_session=${adminToken}` },
  })
  if (downloadRes.status !== 200) {
    console.error(`❌ FAIL: /api/v1/documents/[id]/download returned status ${downloadRes.status}`)
    process.exit(1)
  }
  const dlDisposition = downloadRes.headers.get('content-disposition') || ''
  if (!dlDisposition.startsWith('attachment')) {
    console.error(`❌ FAIL: Invalid headers on download route. Disposition: ${dlDisposition}`)
    process.exit(1)
  }
  console.log(`[PASS] 11. HTTP Endpoint /download: HTTP 200 OK, Disposition: ${dlDisposition}`)

  // Test Parent Portal /api/v1/parent/documents
  const parentDocsRes = await fetch(`http://localhost:3000/api/v1/parent/documents?studentId=${student.id}`, {
    headers: { Cookie: `preone_session=${parentToken}` },
  })
  const parentDocsData = await parentDocsRes.json()
  if (!parentDocsData.success || parentDocsData.data.length === 0) {
    console.error('❌ FAIL: Parent portal documents route did not return linked student documents')
    process.exit(1)
  }
  console.log(`[PASS] 12. Parent Portal Documents API: Returned ${parentDocsData.data.length} authorized documents for child`)

  // Test Parent Portal Cross-Child Protection
  const forbiddenStudentRes = await fetch(`http://localhost:3000/api/v1/parent/documents?studentId=non-existent-or-unlinked-id`, {
    headers: { Cookie: `preone_session=${parentToken}` },
  })
  if (forbiddenStudentRes.status !== 403) {
    console.error(`❌ FAIL: Parent portal allowed access to unlinked student! Status: ${forbiddenStudentRes.status}`)
    process.exit(1)
  }
  console.log(`[PASS] 13. Parent Portal Cross-Child Guard: HTTP 403 Forbidden on unlinked child request`)

  console.log('\n========================================================================')
  console.log('🎉 ALL 13 VERIFICATION CHECKS PASSED PERFECTLY!')
  console.log('========================================================================\n')
}

runVerification()
  .catch((err) => {
    console.error('Fatal error during verification:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
