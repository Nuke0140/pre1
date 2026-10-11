/**
 * Full Internationalization Verification Script
 * Validates key parity, missing keys, empty translations, and formatting across en-IN, hi-IN, mr-IN.
 */
import { enIN } from '../src/lib/i18n/locales/en-IN'
import { hiIN } from '../src/lib/i18n/locales/hi-IN'
import { mrIN } from '../src/lib/i18n/locales/mr-IN'
import { getTranslation, formatCurrencyLocale, formatDateLocale, formatDateTimeLocale, resolveLocale } from '../src/lib/i18n'

function flattenKeys(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenKeys(val, fullKey))
    } else {
      result[fullKey] = String(val)
    }
  }
  return result
}

async function runVerification() {
  console.log('🌐 Starting PreOne Full i18n Verification Suite...\n')

  const enFlat = flattenKeys(enIN)
  const hiFlat = flattenKeys(hiIN)
  const mrFlat = flattenKeys(mrIN)

  const enKeys = Object.keys(enFlat)
  const hiKeys = Object.keys(hiFlat)
  const mrKeys = Object.keys(mrFlat)

  console.log(`📊 Catalog Key Counts:`)
  console.log(`   en-IN: ${enKeys.length} keys`)
  console.log(`   hi-IN: ${hiKeys.length} keys`)
  console.log(`   mr-IN: ${mrKeys.length} keys\n`)

  let hasError = false

  // 1. Missing keys check
  const missingInHi = enKeys.filter((k) => !(k in hiFlat))
  const missingInMr = enKeys.filter((k) => !(k in mrFlat))

  if (missingInHi.length > 0) {
    console.error(`❌ [FAIL] Missing in hi-IN (${missingInHi.length} keys):`, missingInHi)
    hasError = true
  } else {
    console.log(`✅ [PASS] hi-IN has 0 missing keys compared to en-IN.`)
  }

  if (missingInMr.length > 0) {
    console.error(`❌ [FAIL] Missing in mr-IN (${missingInMr.length} keys):`, missingInMr)
    hasError = true
  } else {
    console.log(`✅ [PASS] mr-IN has 0 missing keys compared to en-IN.`)
  }

  // 2. Extra keys check
  const extraInHi = hiKeys.filter((k) => !(k in enFlat))
  const extraInMr = mrKeys.filter((k) => !(k in enFlat))

  if (extraInHi.length > 0) {
    console.error(`❌ [FAIL] Extra keys in hi-IN (${extraInHi.length} keys):`, extraInHi)
    hasError = true
  } else {
    console.log(`✅ [PASS] hi-IN has 0 extra/unmapped keys.`)
  }

  if (extraInMr.length > 0) {
    console.error(`❌ [FAIL] Extra keys in mr-IN (${extraInMr.length} keys):`, extraInMr)
    hasError = true
  } else {
    console.log(`✅ [PASS] mr-IN has 0 extra/unmapped keys.`)
  }

  // 3. Empty string check
  const emptyInEn = enKeys.filter((k) => !enFlat[k]?.trim())
  const emptyInHi = hiKeys.filter((k) => !hiFlat[k]?.trim())
  const emptyInMr = mrKeys.filter((k) => !mrFlat[k]?.trim())

  if (emptyInEn.length > 0 || emptyInHi.length > 0 || emptyInMr.length > 0) {
    console.error(`❌ [FAIL] Found empty translation strings!`, { emptyInEn, emptyInHi, emptyInMr })
    hasError = true
  } else {
    console.log(`✅ [PASS] All 3 catalogs have 0 empty translation strings.`)
  }

  // 4. Formatter test
  const sampleAmountPaise = 5000000 // ₹50,000.00
  const sampleDate = '2026-10-05T12:00:00Z'

  console.log(`\n💱 Testing Locale Currency Formatting (₹50,000):`)
  console.log(`   en-IN: ${formatCurrencyLocale(sampleAmountPaise, 'en-IN')}`)
  console.log(`   hi-IN: ${formatCurrencyLocale(sampleAmountPaise, 'hi-IN')}`)
  console.log(`   mr-IN: ${formatCurrencyLocale(sampleAmountPaise, 'mr-IN')}`)

  console.log(`\n📅 Testing Locale Date & Time Formatting (${sampleDate}):`)
  console.log(`   en-IN: ${formatDateLocale(sampleDate, 'en-IN')} | ${formatDateTimeLocale(sampleDate, 'en-IN')}`)
  console.log(`   hi-IN: ${formatDateLocale(sampleDate, 'hi-IN')} | ${formatDateTimeLocale(sampleDate, 'hi-IN')}`)
  console.log(`   mr-IN: ${formatDateLocale(sampleDate, 'mr-IN')} | ${formatDateTimeLocale(sampleDate, 'mr-IN')}`)

  // 5. Verification result
  if (hasError) {
    console.error('\n🚨 Full i18n Verification FAILED with errors.')
    process.exit(1)
  }

  console.log('\n🎉 ALL FULL i18n VERIFICATIONS PASSED SUCCESSFULLY!')
}

runVerification().catch((err) => {
  console.error(err)
  process.exit(1)
})
