import { db } from '../src/lib/db'
import { BulkUpdateService } from '../src/lib/users/bulk-update-service'
import { getBulkFieldConfig, PROTECTED_BULK_FIELDS, validateFieldValue } from '../src/lib/users/bulk-field-config'

async function main() {
  console.log('=== PREONE BULK USER FIELD UPDATE VERIFICATION ===\n')

  // 1. Verify Whitelist & Protected Fields
  console.log('[1/6] Verifying Whitelist & Protected Fields Configuration...')
  for (const field of PROTECTED_BULK_FIELDS) {
    const cfg = getBulkFieldConfig(field)
    if (cfg) {
      console.error(`❌ Security failure: Protected field '${field}' was allowed in bulk config!`)
      process.exit(1)
    }
  }
  console.log('✓ All protected fields (password, id, tenantId, tokens, etc.) are strictly excluded.')

  const fullNameCfg = getBulkFieldConfig('fullName')
  const phoneCfg = getBulkFieldConfig('phone')
  const designationCfg = getBulkFieldConfig('designation')
  if (!fullNameCfg || !phoneCfg || !designationCfg) {
    console.error('❌ Whitelist configuration missing expected fields!')
    process.exit(1)
  }
  console.log('✓ Whitelisted bulk-editable fields correctly configured.')

  // 2. Data Type Validation Tests
  console.log('\n[2/6] Verifying Input Data Type Validation...')
  const invalidEmail = validateFieldValue('email', 'not-an-email')
  if (invalidEmail.valid) {
    console.error('❌ Data validation failure: Invalid email format was accepted!')
    process.exit(1)
  }
  const validEmail = validateFieldValue('email', 'test.bulk@preone.com')
  if (!validEmail.valid || validEmail.cleanValue !== 'test.bulk@preone.com') {
    console.error('❌ Data validation failure: Valid email format was rejected!')
    process.exit(1)
  }

  const invalidPhone = validateFieldValue('phone', 'abc')
  if (invalidPhone.valid) {
    console.error('❌ Data validation failure: Invalid phone format was accepted!')
    process.exit(1)
  }

  const invalidEnum = validateFieldValue('status', 'INVALID_STATUS_CODE')
  if (invalidEnum.valid) {
    console.error('❌ Data validation failure: Invalid enum status was accepted!')
    process.exit(1)
  }
  console.log('✓ Data type validation engine functioning properly.')

  // 3. Setup Test Database Context
  console.log('\n[3/6] Setting up test database records...')
  const tenant = await db.tenant.findFirst()
  if (!tenant) {
    console.error('❌ No tenant found in database for test execution!')
    process.exit(1)
  }

  // Find or create test users
  const adminUser = await db.user.upsert({
    where: { email: 'admin@mypreone.com' },
    update: { fullName: 'Admin User' },
    create: {
      email: 'admin@mypreone.com',
      username: 'adminuser',
      passwordHash: '$2a$10$xyz',
      fullName: 'Admin User',
    },
    include: { memberships: true },
  })

  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: adminUser.id } },
    update: { role: 'OWNER', status: 'ACTIVE' },
    create: { tenantId: tenant.id, userId: adminUser.id, role: 'OWNER', status: 'ACTIVE' },
  })

  const testUser1 = await db.user.upsert({
    where: { email: 'bulk.test1@preone.com' },
    update: { fullName: 'Bulk Test User One', phone: '+919999900001' },
    create: {
      email: 'bulk.test1@preone.com',
      username: 'bulktest1',
      passwordHash: '$2a$10$xyz',
      fullName: 'Bulk Test User One',
      phone: '+919999900001',
    },
  })

  const testUser2 = await db.user.upsert({
    where: { email: 'bulk.test2@preone.com' },
    update: { fullName: 'Bulk Test User Two', phone: '+919999900002' },
    create: {
      email: 'bulk.test2@preone.com',
      username: 'bulktest2',
      passwordHash: '$2a$10$xyz',
      fullName: 'Bulk Test User Two',
      phone: '+919999900002',
    },
  })

  // Ensure TenantUsers exist
  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: testUser1.id } },
    update: { role: 'TEACHER', status: 'ACTIVE' },
    create: { tenantId: tenant.id, userId: testUser1.id, role: 'TEACHER', status: 'ACTIVE' },
  })

  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: testUser2.id } },
    update: { role: 'TEACHER', status: 'ACTIVE' },
    create: { tenantId: tenant.id, userId: testUser2.id, role: 'TEACHER', status: 'ACTIVE' },
  })

  console.log(`✓ Test records ready. Tenant: ${tenant.code}, Users: ${testUser1.id}, ${testUser2.id}`)

  // 4. Test Preview Mode
  console.log('\n[4/6] Executing Bulk Field Update PREVIEW Mode...')
  const previewRes = await BulkUpdateService.processBulkFieldUpdate({
    tenantId: tenant.id,
    actorId: adminUser.id,
    actorName: adminUser.fullName,
    actorRole: 'OWNER',
    userIds: [testUser1.id, testUser2.id],
    fieldKey: 'designation',
    value: 'Senior Lead Educator',
    mode: 'PREVIEW',
  })

  if (!previewRes.success || previewRes.successCount !== 2) {
    console.error('❌ Preview mode failure:', previewRes)
    process.exit(1)
  }
  console.log(`✓ Preview mode succeeded. Total: ${previewRes.totalSelected}, Valid: ${previewRes.successCount}`)

  // 5. Test Execution Mode
  console.log('\n[5/6] Executing Bulk Field Update EXECUTE Mode...')
  const executeRes = await BulkUpdateService.processBulkFieldUpdate({
    tenantId: tenant.id,
    actorId: adminUser.id,
    actorName: adminUser.fullName,
    actorRole: 'OWNER',
    userIds: [testUser1.id, testUser2.id],
    fieldKey: 'designation',
    value: 'Senior Lead Educator',
    mode: 'EXECUTE',
  })

  if (!executeRes.success || executeRes.successCount !== 2) {
    console.error('❌ Execute mode failure:', executeRes)
    process.exit(1)
  }

  // Verify in database
  const updatedProfile1 = await db.staffProfile.findFirst({ where: { userId: testUser1.id } })
  const updatedProfile2 = await db.staffProfile.findFirst({ where: { userId: testUser2.id } })

  if (updatedProfile1?.designation !== 'Senior Lead Educator' || updatedProfile2?.designation !== 'Senior Lead Educator') {
    console.error('❌ Database state mismatch after bulk update!')
    process.exit(1)
  }
  console.log('✓ Bulk update execution verified in PostgreSQL database.')

  // 6. Test Audit Logging
  console.log('\n[6/6] Verifying Audit Log Records...')
  const auditLog = await db.auditLog.findFirst({
    where: {
      tenantId: tenant.id,
      action: 'BULK_UPDATE_USER_FIELD',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!auditLog) {
    console.error('❌ Audit log entry not created for bulk field update!')
    process.exit(1)
  }
  console.log(`✓ Audit log verified: ${auditLog.summary}`)

  console.log('\n✅ ALL PREONE BULK USER FIELD UPDATE VERIFICATIONS PASSED SUCCESSFULLY!')
  await db.$disconnect()
}

main().catch((err) => {
  console.error('Fatal Verification Error:', err)
  process.exit(1)
})
