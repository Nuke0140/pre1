import { db } from '../src/lib/db'
import { getTranslation, formatCurrencyLocale, formatDateLocale, formatNumberLocale } from '../src/lib/i18n'
import { SupportedLocale, SUPPORTED_LOCALES } from '../src/lib/i18n/types'
import { generateHmacSignature, verifyHmacSignature, dispatchN8nEvent, N8N_WEBHOOK_SECRET } from '../src/lib/integrations/n8n'
import crypto from 'crypto'

async function runTests() {
  console.log('--- 1. Testing i18n Locales Translation & Formatting ---')

  // Check all 3 locales
  const locales: SupportedLocale[] = ['en-IN', 'hi-IN', 'mr-IN']
  for (const loc of locales) {
    const saveTxt = getTranslation('common.save', loc)
    const studentsTxt = getTranslation('nav.students', loc)
    const errTxt = getTranslation('errors.STUDENT_NOT_FOUND', loc)
    const curr = formatCurrencyLocale(150000, loc)
    const num = formatNumberLocale(45000, loc)

    console.log(`[Locale: ${loc}]`)
    console.log(`  common.save -> ${saveTxt}`)
    console.log(`  nav.students -> ${studentsTxt}`)
    console.log(`  errors.STUDENT_NOT_FOUND -> ${errTxt}`)
    console.log(`  Currency (150000 paise = 1500 INR) -> ${curr}`)
    console.log(`  Number (45000) -> ${num}`)

    if (!saveTxt || !studentsTxt || !errTxt) {
      throw new Error(`Missing translations for ${loc}`)
    }
  }

  // Check fallback behavior
  const fallback = getTranslation('common.save', 'fr-FR' as any)
  console.log(`  Fallback for unknown locale -> ${fallback}`)
  if (fallback !== 'Save') {
    throw new Error('Fallback failed to default to en-IN')
  }

  console.log('\n--- 2. Testing n8n HMAC-SHA256 Signing & Verification ---')
  const payload = JSON.stringify({ event: 'StudentAdmitted', studentId: 'stu_123', tenantId: 'tenant_test' })
  const signature = generateHmacSignature(payload, N8N_WEBHOOK_SECRET)
  console.log(`  Payload: ${payload}`)
  console.log(`  Generated Signature: ${signature}`)

  const isValid = verifyHmacSignature(payload, signature, N8N_WEBHOOK_SECRET)
  console.log(`  Verification with correct signature: ${isValid}`)
  if (!isValid) throw new Error('Valid signature was rejected!')

  const tamperedPayload = JSON.stringify({ event: 'StudentAdmitted', studentId: 'stu_999', tenantId: 'tenant_test' })
  const isInvalidValid = verifyHmacSignature(tamperedPayload, signature, N8N_WEBHOOK_SECRET)
  console.log(`  Verification with tampered payload: ${isInvalidValid}`)
  if (isInvalidValid) throw new Error('Tampered payload was incorrectly verified!')

  console.log('\n--- 3. Testing IntegrationEvent Persistence & Dispatch ---')
  const tenant = await db.tenant.findFirst()
  if (!tenant) {
    console.warn('  No tenant found in DB, skipping DB event write test')
    return
  }

  const testEventId = `test_event_${crypto.randomUUID()}`
  const result = await dispatchN8nEvent({
    eventId: testEventId,
    eventType: 'STUDENT_ENROLLED',
    tenantId: tenant.id,
    locale: 'mr-IN',
    data: { studentName: 'Rohan Patil', class: 'Nursery' },
  })

  console.log(`  Dispatched event result:`, result)
  const saved = await db.integrationEvent.findUnique({
    where: { eventId: testEventId },
  })

  if (!saved) throw new Error(`IntegrationEvent was not saved in database!`)
  console.log(`  Verified record in DB: id=${saved.id}, eventId=${saved.eventId}, status=${saved.status}, locale=${saved.locale}`)

  // Cleanup test event
  await db.integrationEvent.delete({ where: { eventId: testEventId } })
  console.log('  Cleaned up test event record.')

  console.log('\nAll i18n and n8n foundation verifications passed successfully!')
}

runTests()
  .catch((e) => {
    console.error('Test verification failed:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
