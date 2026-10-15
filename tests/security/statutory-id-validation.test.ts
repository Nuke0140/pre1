import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import {
  validatePan,
  validateAadhaar,
  validateUan,
  validateEsi,
  validateStatutoryInputs,
  validateVerhoeff,
  generateVerhoeff,
} from '@/lib/users/statutory-validation'
import { StatutoryBackfillService } from '@/lib/users/statutory-backfill'
import { POST as usersPost } from '@/app/api/v1/users/route'
import { PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { CsvEngine } from '@/lib/users/csv-engine'
import { EncryptionService } from '@/lib/security/encryption-service'

describe('Statutory-ID Format Validation & Backfill Audit (N-3)', () => {
  let tenant: any
  let branch: any
  let adminUser: any
  let adminCookie: string
  const ts = `${Date.now()}`

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        name: `Statutory School ${ts.slice(-4)}`,
        code: `STAT-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `STB-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    adminUser = await db.user.create({
      data: {
        email: `stat.admin.${ts}@preone.test`,
        fullName: 'Statutory Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      role: 'OWNER',
      roles: ['OWNER'],
      tokenVersion: 0,
      mustChangePassword: false,
      branchId: branch.id,
    })
    adminCookie = `preone_session=${token}`
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: PAN VALIDATION LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  describe('PAN (Permanent Account Number) Validation', () => {
    it('accepts valid 10-character PAN and normalizes to uppercase', () => {
      const res1 = validatePan('ABCDE1234F')
      expect(res1.valid).toBe(true)
      expect(res1.normalized).toBe('ABCDE1234F')

      // Case-insensitivity test
      const res2 = validatePan('abcde1234f')
      expect(res2.valid).toBe(true)
      expect(res2.normalized).toBe('ABCDE1234F')
    })

    it('rejects audit document sample: AHDKSK2038 (6 letters, 4 digits, missing trailing letter)', () => {
      const res = validatePan('AHDKSK2038')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Invalid PAN format')
    })

    it('rejects incorrect lengths and patterns', () => {
      // 9 chars
      expect(validatePan('ABCDE1234').valid).toBe(false)
      // 11 chars
      expect(validatePan('ABCDE12345F').valid).toBe(false)
      // Digits first
      expect(validatePan('12345ABCDE').valid).toBe(false)
    })

    it('allows empty, null, and masked values', () => {
      expect(validatePan('').valid).toBe(true)
      expect(validatePan(null).valid).toBe(true)
      expect(validatePan(undefined).valid).toBe(true)
      expect(validatePan('••••').valid).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: AADHAAR 12-DIGIT + VERHOEFF CHECKSUM VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Aadhaar 12-Digit & Verhoeff Checksum Validation', () => {
    it('accurately computes and verifies Verhoeff checksums', () => {
      const prefix = '23456789012'
      const checkDigit = generateVerhoeff(prefix)
      const validAadhaar = `${prefix}${checkDigit}`

      expect(validateVerhoeff(validAadhaar)).toBe(true)
      // Tampering single digit fails checksum
      expect(validateVerhoeff(`${prefix}${(checkDigit + 1) % 10}`)).toBe(false)
    })

    it('rejects audit document sample: 12830374038 (11 digits)', () => {
      const res = validateAadhaar('12830374038')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Aadhaar must be exactly 12 digits')
    })

    it('rejects Aadhaar numbers starting with 0 or 1 per UIDAI standard', () => {
      // Starts with 0
      const res0 = validateAadhaar('012345678901')
      expect(res0.valid).toBe(false)
      expect(res0.error).toContain('cannot start with 0 or 1')

      // Starts with 1
      const res1 = validateAadhaar('123456789012')
      expect(res1.valid).toBe(false)
      expect(res1.error).toContain('cannot start with 0 or 1')
    })

    it('rejects Aadhaar numbers that fail Verhoeff checksum', () => {
      // 12 digits, starts with 9, but invalid check digit
      const res = validateAadhaar('998877665544')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('failed Verhoeff checksum validation')
    })

    it('accepts valid 12-digit Aadhaar and normalizes spaces/hyphens', () => {
      // 998877665548 is valid
      const resFormatted = validateAadhaar('9988-7766 5548')
      expect(resFormatted.valid).toBe(true)
      expect(resFormatted.normalized).toBe('998877665548')
    })

    it('allows empty, null, and masked values', () => {
      expect(validateAadhaar('').valid).toBe(true)
      expect(validateAadhaar(null).valid).toBe(true)
      expect(validateAadhaar('••••').valid).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: UAN & ESI VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('UAN & ESI Format Validation', () => {
    it('rejects audit document sample: 19101010 (8 digits)', () => {
      const res = validateUan('19101010')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('UAN must be exactly 12 numeric digits')
    })

    it('accepts valid 12-digit UAN', () => {
      const res = validateUan('100998877665')
      expect(res.valid).toBe(true)
      expect(res.normalized).toBe('100998877665')
    })

    it('validates 17-digit ESI number', () => {
      expect(validateEsi('31998877665544332').valid).toBe(true)
      expect(validateEsi('12345').valid).toBe(false)
      expect(validateEsi(null).valid).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: POST /api/v1/users REJECTS INVALID STATUTORY IDS & ACCEPTS VALID
  // ─────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/users Statutory Enforcement', () => {
    it('rejects staff creation with invalid PAN', async () => {
      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          fullName: 'Invalid PAN Staff',
          email: `invalid.pan.${ts}@preone.test`,
          username: `inv.pan.${ts.slice(-4)}`,
          role: 'TEACHER',
          password: 'Password@123',
          panNumber: 'AHDKSK2038', // Invalid PAN from audit
        }),
      })

      const res = await usersPost(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.field).toBe('panNumber')
      expect(json.error.message).toContain('Invalid PAN format')
    })

    it('rejects staff creation with 11-digit or invalid Verhoeff Aadhaar', async () => {
      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          fullName: 'Invalid Aadhaar Staff',
          email: `invalid.aadhaar.${ts}@preone.test`,
          username: `inv.adh.${ts.slice(-4)}`,
          role: 'TEACHER',
          password: 'Password@123',
          aadhaarNumber: '12830374038', // 11 digits from audit
        }),
      })

      const res = await usersPost(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.field).toBe('aadhaarNumber')
      expect(json.error.message).toContain('Aadhaar must be exactly 12 digits')
    })

    it('accepts staff creation with compliant statutory IDs and stores normalized values', async () => {
      const req = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          fullName: 'Valid Statutory Staff',
          email: `valid.stat.${ts}@preone.test`,
          username: `val.stat.${ts.slice(-4)}`,
          role: 'TEACHER',
          password: 'Password@123',
          panNumber: 'abcde1234f', // lowercase to verify normalization
          aadhaarNumber: '9988 7766 5548', // spaces to verify normalization
          uanNumber: '100998877665',
          esiNumber: '31998877665544332',
        }),
      })

      const res = await usersPost(req)
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.success).toBe(true)

      const dbProfile = await db.staffProfile.findFirst({
        where: { tenantId: tenant.id, userId: json.data.userId },
      })
      expect(EncryptionService.decrypt(dbProfile?.panNumber, tenant.id)).toBe('ABCDE1234F')
      expect(EncryptionService.decrypt(dbProfile?.aadhaarNumber, tenant.id)).toBe('998877665548')
      expect(EncryptionService.decrypt(dbProfile?.uanNumber, tenant.id)).toBe('100998877665')
      expect(EncryptionService.decrypt(dbProfile?.esiNumber, tenant.id)).toBe('31998877665544332')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: PATCH /api/v1/users/[id] REJECTS INVALID STATUTORY MUTATIONS
  // ─────────────────────────────────────────────────────────────────────────
  describe('PATCH /api/v1/users/[id] Statutory Enforcement', () => {
    it('rejects invalid UAN in PATCH', async () => {
      const testUser = await db.user.create({
        data: {
          email: `patch.stat.${ts}@preone.test`,
          fullName: 'Patch Stat User',
          status: 'ACTIVE',
          passwordHash: 'hash',
          memberships: {
            create: { tenantId: tenant.id, role: 'TEACHER', status: 'ACTIVE' },
          },
        },
      })

      await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: testUser.id,
          employeeCode: `EMP-T-${ts.slice(-4)}`,
        },
      })

      const req = new NextRequest(`http://localhost/api/v1/users/${testUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          uanNumber: '19101010', // 8 digits from audit
        }),
      })

      const res = await userPatch(req, { params: Promise.resolve({ id: testUser.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.field).toBe('uanNumber')
      expect(json.error.message).toContain('UAN must be exactly 12 numeric digits')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: CSV IMPORT PREVIEW FLAGS INVALID ROLES & STATUTORY IDS
  // ─────────────────────────────────────────────────────────────────────────
  describe('CSV Import Engine Statutory & Role Validation', () => {
    it('flags invalid role SUPERADMIN and invalid statutory IDs in preview', async () => {
      const csvContent = [
        'fullName,email,role,employeeCode,panNumber,aadhaarNumber',
        `Super Admin Staff,super.${ts}@preone.test,SUPERADMIN,EMP-9001,AHDKSK2038,12830374038`,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csvContent)
      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('BLOCKED')

      // Role check: SUPERADMIN flagged
      expect(row.errors.some((e: string) => e.includes('Invalid staff role "SUPERADMIN"'))).toBe(true)
      // Statutory checks flagged
      expect(row.errors.some((e: string) => e.includes('Invalid PAN format'))).toBe(true)
      expect(row.errors.some((e: string) => e.includes('Aadhaar must be exactly 12 digits'))).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: STATUTORY BACKFILL SERVICE (AUDIT & SANITIZATION)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Statutory Backfill Service', () => {
    it('audits non-compliant statutory records in the database', async () => {
      // Create a staff profile with intentionally corrupt statutory ID in tenant
      await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          employeeCode: `CORRUPT-${ts.slice(-4)}`,
          panNumber: 'AHDKSK2038',
          aadhaarNumber: '12830374038',
          uanNumber: '19101010',
        },
      })

      const report = await StatutoryBackfillService.auditStatutoryRecords({ tenantId: tenant.id })
      expect(report.invalidCount).toBeGreaterThanOrEqual(1)

      const corruptRecord = report.invalidRecords.find((r) => r.employeeCode === `CORRUPT-${ts.slice(-4)}`)
      expect(corruptRecord).toBeDefined()
      expect(corruptRecord?.violations.length).toBe(3)

      // Test sanitization (clearing corrupt fields)
      const sanitized = await StatutoryBackfillService.sanitizeInvalidRecords({
        tenantId: tenant.id,
        dryRun: false,
      })
      expect(sanitized.fixedCount).toBeGreaterThanOrEqual(1)

      const dbClean = await db.staffProfile.findFirst({
        where: { employeeCode: `CORRUPT-${ts.slice(-4)}` },
      })
      expect(dbClean?.panNumber).toBeNull()
      expect(dbClean?.aadhaarNumber).toBeNull()
      expect(dbClean?.uanNumber).toBeNull()
    })
  })
})
