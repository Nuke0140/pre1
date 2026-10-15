#!/usr/bin/env bun
/**
 * PreOne CLI Script: Statutory ID Audit & Backfill Engine (N-3 Audit Requirement)
 * Usage:
 *   bun run scripts/backfill-statutory-ids.ts             # Dry-run audit report
 *   bun run scripts/backfill-statutory-ids.ts --fix       # Apply data sanitization
 */

import { StatutoryBackfillService } from '../src/lib/users/statutory-backfill'

async function run() {
  const isFix = process.argv.includes('--fix')
  console.log('─────────────────────────────────────────────────────────────────')
  console.log('  PreOne Statutory ID Compliance Audit & Backfill Engine (N-3)   ')
  console.log(`  Mode: ${isFix ? 'FIX (Apply Sanitization)' : 'DRY-RUN (Audit Only)'}`)
  console.log('─────────────────────────────────────────────────────────────────\n')

  if (isFix) {
    const result = await StatutoryBackfillService.sanitizeInvalidRecords({
      dryRun: false,
      actorName: 'CLI Backfill Script',
    })
    console.log(`Scanned:  ${result.totalScanned} profiles`)
    console.log(`Compliant: ${result.validCount}`)
    console.log(`Invalid:   ${result.invalidCount}`)
    console.log(`Sanitized: ${result.fixedCount} records updated\n`)

    if (result.invalidRecords.length > 0) {
      console.log('Sanitized Records Detail:')
      for (const rec of result.invalidRecords) {
        console.log(`  • ${rec.employeeCode} (${rec.profileId}):`)
        for (const v of rec.violations) {
          console.log(`      - ${v.field}: "${v.value}" (${v.error})`)
        }
      }
    }
  } else {
    const report = await StatutoryBackfillService.auditStatutoryRecords()
    console.log(`Scanned:   ${report.totalScanned} profiles`)
    console.log(`Compliant: ${report.validCount}`)
    console.log(`Invalid:   ${report.invalidCount}\n`)

    if (report.invalidRecords.length > 0) {
      console.log('Non-Compliant Records Detected:')
      for (const rec of report.invalidRecords) {
        console.log(`  • Staff ${rec.employeeCode} (ID: ${rec.profileId}):`)
        for (const v of rec.violations) {
          console.log(`      - ${v.field}: "${v.value}" -> ${v.error}`)
        }
      }
      console.log('\nTo sanitize non-compliant records, run:')
      console.log('  bun run scripts/backfill-statutory-ids.ts --fix\n')
    } else {
      console.log('All statutory ID records are 100% compliant with PAN, Aadhaar (Verhoeff), UAN, and ESI standards.')
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill script failed:', err)
    process.exit(1)
  })
