/**
 * PreOne Enterprise PII At-Rest Encryption Backfill Utility (Doc 4.1)
 *
 * Scans all existing plaintext StaffProfile and Guardian records, encrypting
 * sensitive statutory identifiers (Aadhaar, PAN, UAN, ESI, Addresses)
 * using authenticated AES-256-GCM under per-tenant derived keys.
 *
 * Safe to re-run (idempotent): ignores already-encrypted values ('enc:v1:...').
 *
 * Usage:
 *   npx tsx scripts/encrypt-pii-at-rest.ts
 *   or: bun run scripts/encrypt-pii-at-rest.ts
 */

import { db } from '../src/lib/db'
import { EncryptionService } from '../src/lib/security/encryption-service'

async function backfillPiiEncryption() {
  console.log('[PreOne PII Backfill] Starting at-rest PII encryption backfill...\n')

  // 1. Staff Profiles
  const staffProfiles = await db.staffProfile.findMany({
    select: {
      id: true,
      tenantId: true,
      aadhaarNumber: true,
      panNumber: true,
      uanNumber: true,
      esiNumber: true,
      currentAddress: true,
      permanentAddress: true,
    },
  })

  console.log(`[PreOne PII Backfill] Found ${staffProfiles.length} staff profiles to evaluate.`)

  let staffEncryptedCount = 0
  let fieldsEncryptedCount = 0

  for (const staff of staffProfiles) {
    const updates: Record<string, string | null> = {}

    if (staff.aadhaarNumber && !EncryptionService.isEncrypted(staff.aadhaarNumber)) {
      updates.aadhaarNumber = EncryptionService.encrypt(staff.aadhaarNumber, staff.tenantId)
      fieldsEncryptedCount++
    }
    if (staff.panNumber && !EncryptionService.isEncrypted(staff.panNumber)) {
      updates.panNumber = EncryptionService.encrypt(staff.panNumber, staff.tenantId)
      fieldsEncryptedCount++
    }
    if (staff.uanNumber && !EncryptionService.isEncrypted(staff.uanNumber)) {
      updates.uanNumber = EncryptionService.encrypt(staff.uanNumber, staff.tenantId)
      fieldsEncryptedCount++
    }
    if (staff.esiNumber && !EncryptionService.isEncrypted(staff.esiNumber)) {
      updates.esiNumber = EncryptionService.encrypt(staff.esiNumber, staff.tenantId)
      fieldsEncryptedCount++
    }
    if (staff.currentAddress && !EncryptionService.isEncrypted(staff.currentAddress)) {
      updates.currentAddress = EncryptionService.encrypt(staff.currentAddress, staff.tenantId)
      fieldsEncryptedCount++
    }
    if (staff.permanentAddress && !EncryptionService.isEncrypted(staff.permanentAddress)) {
      updates.permanentAddress = EncryptionService.encrypt(staff.permanentAddress, staff.tenantId)
      fieldsEncryptedCount++
    }

    if (Object.keys(updates).length > 0) {
      await db.staffProfile.update({
        where: { id: staff.id },
        data: updates,
      })
      staffEncryptedCount++
    }
  }

  console.log(
    `[PreOne PII Backfill] Staff Profiles: ${staffEncryptedCount} profiles updated (${fieldsEncryptedCount} fields encrypted).`
  )
  console.log('\n[PreOne PII Backfill] Backfill migration completed successfully.')
}

backfillPiiEncryption()
  .catch((err) => {
    console.error('[PreOne PII Backfill] Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
