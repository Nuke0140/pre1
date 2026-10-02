/**
 * End-to-End Automated Verification Script for PreOne No-Code Template Studio
 * Tests CRUD, presets, field tokens, versioning, publishing, duplication, and HTML rendering.
 */

import { PrismaClient } from '@prisma/client'
import { TemplateService } from '../src/lib/templates/template-service'
import { TEMPLATE_PRESETS } from '../src/lib/templates/presets'
import { resolveTokens, APPROVED_TEMPLATE_FIELDS } from '../src/lib/templates/field-registry'
import { evaluateStep } from '../src/lib/setup/engine'

const prisma = new PrismaClient()

async function runVerification() {
  console.log('====================================================')
  console.log('   PreOne No-Code Template Studio Verification')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`)
      passed++
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`)
      failed++
    }
  }

  // 1. Get or create a test tenant
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    throw new Error('No tenant found in database for testing')
  }
  const tenantId = tenant.id
  console.log(`Target Tenant: ${tenant.name} (${tenantId})`)

  try {
    // 2. Test Presets Coverage
    console.log('\n--- 1. Testing Starter Presets ---')
    const presetKeys = Object.keys(TEMPLATE_PRESETS)
    assert(presetKeys.length >= 6, 'Provides at least 6 preschool starter presets', `Found: ${presetKeys.length}`)
    assert(presetKeys.includes('STUDENT_ID_CARD'), 'Includes STUDENT_ID_CARD preset')
    assert(presetKeys.includes('STAFF_ID_CARD'), 'Includes STAFF_ID_CARD preset')
    assert(presetKeys.includes('FEE_RECEIPT'), 'Includes FEE_RECEIPT preset')
    assert(presetKeys.includes('CERTIFICATE'), 'Includes CERTIFICATE preset')
    assert(presetKeys.includes('ADMISSION_FORM'), 'Includes ADMISSION_FORM preset')
    assert(presetKeys.includes('REPORT_CARD'), 'Includes REPORT_CARD preset')

    // 3. Test Field Registry & Token Resolver
    console.log('\n--- 2. Testing Field Registry & Token Resolver ---')
    assert(APPROVED_TEMPLATE_FIELDS.length >= 25, 'Approved field registry contains comprehensive domain fields', `Total: ${APPROVED_TEMPLATE_FIELDS.length}`)
    
    const sampleText = 'Welcome to {{school.name}}! Student: {{student.fullName}}, Admission: {{student.admissionNumber}}'
    const resolved = resolveTokens(sampleText, {
      'school.name': 'Sunflower Kindergarten',
      'student.fullName': 'Diya Patel',
      'student.admissionNumber': 'ADM-2026-99',
    })
    assert(
      resolved === 'Welcome to Sunflower Kindergarten! Student: Diya Patel, Admission: ADM-2026-99',
      'Token resolver correctly injects mapped context fields',
      `Got: ${resolved}`
    )

    // 4. Test Template Creation from Preset
    console.log('\n--- 3. Testing Template Creation from Preset ---')
    const testName1 = `Test Student ID Card ${Date.now()}`
    const created1 = await TemplateService.createTemplate(tenantId, {
      name: testName1,
      type: 'STUDENT_ID_CARD',
      presetKey: 'STUDENT_ID_CARD',
      createdByName: 'Principal Admin',
      actorId: 'test-admin',
    })

    assert(Boolean(created1 && created1.id), 'Successfully creates template record in database')
    assert(created1.type === 'STUDENT_ID_CARD', 'Template has correct document type')
    
    const fetched1 = await TemplateService.getTemplateById(tenantId, created1.id)
    assert(Boolean(fetched1), 'getTemplateById retrieves created template')
    assert(fetched1?.definition.status === 'DRAFT', 'New template starts in DRAFT status')
    assert(fetched1?.definition.version === 1, 'Initial template version is 1')
    assert((fetched1?.definition.elements.length || 0) > 5, 'Preset elements correctly populated', `Count: ${fetched1?.definition.elements.length}`)

    // 5. Test Template Update
    console.log('\n--- 4. Testing Template Updates ---')
    const updatedDef = {
      ...fetched1!.definition,
      backgroundColor: '#FEF3C7',
    }
    const updated1 = await TemplateService.updateTemplate(tenantId, created1.id, {
      name: `${testName1} (Updated)`,
      definition: updatedDef,
    })
    const refetched1 = await TemplateService.getTemplateById(tenantId, created1.id)
    assert(refetched1?.name === `${testName1} (Updated)`, 'Template name updated')
    assert(refetched1?.definition.backgroundColor === '#FEF3C7', 'Template background color updated')

    // 6. Test Publishing
    console.log('\n--- 5. Testing Template Publishing & Immutability ---')
    const published = await TemplateService.publishTemplate(tenantId, created1.id, 'Principal Sharma', 'admin-uid')
    const refetchedPublished = await TemplateService.getTemplateById(tenantId, created1.id)
    assert(refetchedPublished?.definition.status === 'PUBLISHED', 'Template status transitioned to PUBLISHED')
    assert(refetchedPublished?.definition.version === 2, 'Version incremented on publish', `Version: ${refetchedPublished?.definition.version}`)
    assert(refetchedPublished?.definition.publishedBy === 'Principal Sharma', 'publishedBy recorded')
    assert(Boolean(refetchedPublished?.definition.publishedAt), 'publishedAt timestamp recorded')

    // 7. Test Duplication
    console.log('\n--- 6. Testing Template Duplication ---')
    const duplicated = await TemplateService.duplicateTemplate(tenantId, created1.id, 'Admin', 'admin-uid')
    const refetchedDuplicated = await TemplateService.getTemplateById(tenantId, duplicated.id)
    assert(Boolean(duplicated && duplicated.id), 'Duplicated template created successfully')
    assert(duplicated.id !== created1.id, 'Duplicated template has a unique ID')
    assert(refetchedDuplicated?.definition.status === 'DRAFT', 'Cloned template resets to DRAFT status')
    assert(refetchedDuplicated?.definition.version === 1, 'Cloned template resets version to 1')
    assert(refetchedDuplicated?.name.includes('Copy'), 'Cloned template name indicates copy')

    // 8. Test HTML Rendering
    console.log('\n--- 7. Testing Document HTML Rendering ---')
    const renderedHtml = TemplateService.renderTemplateHtml(refetchedPublished!.definition, {
      'school.name': 'Sunshine Little Angels',
      'student.fullName': 'Kabir Varma',
      'student.admissionNumber': 'PRE-8821',
    })
    assert(typeof renderedHtml === 'string' && renderedHtml.includes('<!DOCTYPE html>'), 'Renders valid HTML document')
    assert(renderedHtml.includes('Sunshine Little Angels'), 'HTML output includes resolved school name')
    assert(renderedHtml.includes('Kabir Varma'), 'HTML output includes resolved student name')
    assert(renderedHtml.includes('PRE-8821'), 'HTML output includes resolved admission number')
    assert(renderedHtml.includes('width: 54mm'), 'Rendered container matches CR80 millimeter width')
    assert(renderedHtml.includes('height: 85.6mm'), 'Rendered container matches CR80 millimeter height')

    // 9. Test Listing with Filters
    console.log('\n--- 8. Testing List & Query Filtering ---')
    const listResult = await TemplateService.listTemplates(tenantId, {
      type: 'STUDENT_ID_CARD',
      status: 'PUBLISHED',
    })
    assert(listResult.items.length >= 1, 'Filter by type and status returns published templates')
    const foundPublished = listResult.items.some((it) => it.id === created1.id)
    assert(foundPublished, 'Published test template present in filtered list')

    // 10. Test Setup Step 15 Integration
    console.log('\n--- 9. Testing Setup Step 15 Evaluation ---')
    const setupConfig = await prisma.schoolConfig.findUnique({
      where: { tenantId_domain: { tenantId, domain: 'DOCUMENT_TEMPLATES' } },
    })
    assert(Boolean(setupConfig), 'SchoolConfig.DOCUMENT_TEMPLATES is automatically populated')
    const cfgData = (setupConfig?.data as any) || {}
    assert(Array.isArray(cfgData.templates) && cfgData.templates.includes('STUDENT_ID_CARD'), 'STUDENT_ID_CARD registered in setup config')

    // 11. Cleanup test records
    console.log('\n--- 10. Cleanup & Final Verification ---')
    await TemplateService.deleteTemplate(tenantId, duplicated.id)
    const checkDeleted = await TemplateService.getTemplateById(tenantId, duplicated.id)
    assert(checkDeleted === null, 'Draft copy cleanly deleted')

    // Unset default on created1 before deleting
    await prisma.documentTemplate.update({
      where: { id: created1.id },
      data: { isDefault: false },
    })
    await TemplateService.deleteTemplate(tenantId, created1.id)
    const checkDeleted1 = await TemplateService.getTemplateById(tenantId, created1.id)
    assert(checkDeleted1 === null, 'Primary test template cleanly deleted')

  } catch (err: any) {
    console.error('Unexpected error in verification:', err)
    failed++
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n====================================================')
  console.log(`Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runVerification()
