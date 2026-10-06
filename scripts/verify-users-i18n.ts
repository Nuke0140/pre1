/**
 * Users & Access Module i18n Parity Verification Script
 * Validates that all user-facing keys in the users namespace exist
 * and have non-empty translations across en-IN, hi-IN, and mr-IN.
 */
import { enIN } from '../src/lib/i18n/locales/en-IN'
import { hiIN } from '../src/lib/i18n/locales/hi-IN'
import { mrIN } from '../src/lib/i18n/locales/mr-IN'

async function verifyUsersI18n() {
  console.log('🔍 Running Users & Access Module i18n Verification Suite...\n')

  const enUsers = (enIN as any).users
  const hiUsers = (hiIN as any).users
  const mrUsers = (mrIN as any).users

  if (!enUsers || !hiUsers || !mrUsers) {
    console.error('❌ Failed: users namespace missing from one or more catalogs')
    process.exit(1)
  }

  const enKeys = Object.keys(enUsers)
  const hiKeys = Object.keys(hiUsers)
  const mrKeys = Object.keys(mrUsers)

  console.log(`📊 Users Namespace Key Count: ${enKeys.length}`)

  let errors = 0

  // 1. Check hi-IN
  for (const key of enKeys) {
    if (!(key in hiUsers)) {
      console.error(`❌ [hi-IN] Missing key: users.${key}`)
      errors++
    } else if (!hiUsers[key] || typeof hiUsers[key] !== 'string' || hiUsers[key].trim() === '') {
      console.error(`❌ [hi-IN] Empty string: users.${key}`)
      errors++
    }
  }

  // 2. Check mr-IN
  for (const key of enKeys) {
    if (!(key in mrUsers)) {
      console.error(`❌ [mr-IN] Missing key: users.${key}`)
      errors++
    } else if (!mrUsers[key] || typeof mrUsers[key] !== 'string' || mrUsers[key].trim() === '') {
      console.error(`❌ [mr-IN] Empty string: users.${key}`)
      errors++
    }
  }

  if (errors > 0) {
    console.error(`\n💥 Failed with ${errors} i18n issues!`)
    process.exit(1)
  }

  console.log('✅ [PASS] en-IN, hi-IN, mr-IN have 100% key and content parity for Users & Access!')
}

verifyUsersI18n().catch((err) => {
  console.error(err)
  process.exit(1)
})
