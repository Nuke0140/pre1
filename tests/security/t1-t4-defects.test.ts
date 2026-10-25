import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import {
  validateAadhaar,
  validatePan,
  validateUan,
  validateEsi,
  validateVerhoeff,
  generateVerhoeff,
} from '@/lib/users/statutory-validation'
import { CsvEngine } from '@/lib/users/csv-engine'
import { StaffUserService, isEmployeeCodeUniqueViolation } from '@/lib/users/staff-user-service'
import { EncryptionService } from '@/lib/security/encryption-service'

describe('PreOne T-1 to T-4 Defect Remediation & Full Regression Suite', () => {
  let tenant: any
  let branch: any
  const ts = `${Date.now()}`

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        name: `T1-T4 School ${ts.slice(-4)}`,
        code: `T14-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `T14B-${ts.slice(-4)}`,
        isMain: true,
      },
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // DEFECT T-1: AADHAAR VERHOEFF CHECKSUM VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Defect T-1: Aadhaar Verhoeff Checksum Validation', () => {
    it('accepts valid 12-digit Aadhaar vectors that satisfy Verhoeff checksum', () => {
      // Generate guaranteed valid Aadhaar number starting with 2
      const prefix = '23456789012'
      const checkDigit = generateVerhoeff(prefix)
      const validVector = `${prefix}${checkDigit}`

      const res = validateAadhaar(validVector)
      expect(res.valid).toBe(true)
      expect(res.normalized).toBe(validVector)
    })

    it('rejects known audit vector 998877665544 that fails Verhoeff checksum', () => {
      const res = validateAadhaar('998877665544')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Invalid Aadhaar number: failed Verhoeff checksum validation')
    })

    it('rejects single-digit mutation of valid checksum', () => {
      const prefix = '38491028374'
      const checkDigit = generateVerhoeff(prefix)
      const validVector = `${prefix}${checkDigit}`
      expect(validateAadhaar(validVector).valid).toBe(true)

      // Mutate checksum digit
      const tamperedCheck = (checkDigit + 1) % 10
      const tampered = `${prefix}${tamperedCheck}`
      const res = validateAadhaar(tampered)
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Invalid Aadhaar number: failed Verhoeff checksum validation')
    })

    it('rejects transposition of two adjacent digits in valid Aadhaar', () => {
      const prefix = '48201938475'
      const checkDigit = generateVerhoeff(prefix)
      const valid = `${prefix}${checkDigit}`
      expect(validateAadhaar(valid).valid).toBe(true)

      // Transpose adjacent digits (index 2 and 3: '20' -> '02')
      const transposed = `${valid.slice(0, 2)}${valid[3]}${valid[2]}${valid.slice(4)}`
      const res = validateAadhaar(transposed)
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Invalid Aadhaar number: failed Verhoeff checksum validation')
    })

    it('rejects all-identical digit patterns (e.g. 222222222222, 999999999999)', () => {
      const res2 = validateAadhaar('222222222222')
      expect(res2.valid).toBe(false)
      expect(res2.error).toBe('Invalid Aadhaar number: cannot be all identical digits')

      const res9 = validateAadhaar('999999999999')
      expect(res9.valid).toBe(false)
      expect(res9.error).toBe('Invalid Aadhaar number: cannot be all identical digits')
    })

    it('rejects non-numeric characters and length mismatches', () => {
      const nonNum = validateAadhaar('23456789012A')
      expect(nonNum.valid).toBe(false)
      expect(nonNum.error).toBe('Aadhaar must contain only numeric digits')

      const short = validateAadhaar('2345678901')
      expect(short.valid).toBe(false)
      expect(short.error).toContain('Aadhaar must be exactly 12 digits')
    })

    it('never emits raw or sanitized Aadhaar numbers in error messages (PII safety)', () => {
      const sample = '998877665544'
      const res = validateAadhaar(sample)
      expect(res.valid).toBe(false)
      expect(res.error).not.toContain(sample)
      expect(res.error).not.toContain('9988')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // DEFECT T-2: AADHAAR PREFIX 0 AND 1 VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Defect T-2: Aadhaar Prefix 0 and 1 Validation', () => {
    it('rejects Aadhaar starting with 0 with authoritative error message', () => {
      const res = validateAadhaar('012345678901')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Invalid Aadhaar number: cannot start with 0 or 1')
    })

    it('rejects Aadhaar starting with 1 with authoritative error message', () => {
      const res = validateAadhaar('112345678901')
      expect(res.valid).toBe(false)
      expect(res.error).toBe('Invalid Aadhaar number: cannot start with 0 or 1')
    })

    it('rejects formatted Aadhaar starting with 0 or 1 (spaces/hyphens)', () => {
      const res0 = validateAadhaar('0123 4567 8901')
      expect(res0.valid).toBe(false)
      expect(res0.error).toBe('Invalid Aadhaar number: cannot start with 0 or 1')

      const res1 = validateAadhaar('1123-4567-8901')
      expect(res1.valid).toBe(false)
      expect(res1.error).toBe('Invalid Aadhaar number: cannot start with 0 or 1')
    })

    it('accepts prefixes 2 through 9 if checksum is valid', () => {
      for (let prefixDigit = 2; prefixDigit <= 9; prefixDigit++) {
        const body = `${prefixDigit}2345678901`
        const check = generateVerhoeff(body)
        const num = `${body}${check}`
        const res = validateAadhaar(num)
        expect(res.valid).toBe(true)
        expect(res.normalized).toBe(num)
      }
    })

    it('allows empty, null, whitespace, and masked values as optional', () => {
      expect(validateAadhaar('').valid).toBe(true)
      expect(validateAadhaar('   ').valid).toBe(true)
      expect(validateAadhaar(null).valid).toBe(true)
      expect(validateAadhaar(undefined).valid).toBe(true)
      expect(validateAadhaar('•••• •••• 5548').valid).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // DEFECT T-3: CSV IMPORT STATUTORY VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Defect T-3: CSV Import Statutory Validation', () => {
    it('blocks CSV import preview on invalid PAN (AHDKSK2038)', async () => {
      const csv = [
        'fullName,email,role,employeeCode,panNumber',
        `Test Staff 1,staff1.${ts}@preone.test,TEACHER,EMP-T3-01,AHDKSK2038`,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csv)
      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('BLOCKED')
      expect(row.errors.some((e: string) => e.includes('Invalid PAN format'))).toBe(true)
    })

    it('blocks CSV import preview on invalid Aadhaar (checksum failure and prefix 1)', async () => {
      const csv = [
        'fullName,email,role,employeeCode,aadhaarNumber',
        `Test Staff 2A,staff2a.${ts}@preone.test,TEACHER,EMP-T3-02A,998877665544`,
        `Test Staff 2B,staff2b.${ts}@preone.test,TEACHER,EMP-T3-02B,112345678901`,
        `Test Staff 2C,staff2c.${ts}@preone.test,TEACHER,EMP-T3-02C,012345678901`,
        `Test Staff 2D,staff2d.${ts}@preone.test,TEACHER,EMP-T3-02D,12830374038`,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csv)
      expect(preview.rows.length).toBe(4)

      // 998877665544: checksum failure
      expect(preview.rows[0].status).toBe('BLOCKED')
      expect(preview.rows[0].errors.some((e: string) => e.includes('Verhoeff checksum'))).toBe(true)

      // 112345678901: prefix 1
      expect(preview.rows[1].status).toBe('BLOCKED')
      expect(preview.rows[1].errors.some((e: string) => e.includes('cannot start with 0 or 1'))).toBe(true)

      // 012345678901: prefix 0
      expect(preview.rows[2].status).toBe('BLOCKED')
      expect(preview.rows[2].errors.some((e: string) => e.includes('cannot start with 0 or 1'))).toBe(true)

      // 12830374038: length 11
      expect(preview.rows[3].status).toBe('BLOCKED')
      expect(preview.rows[3].errors.some((e: string) => e.includes('exactly 12 digits'))).toBe(true)
    })

    it('blocks CSV import preview on invalid UAN and invalid ESI', async () => {
      const csv = [
        'fullName,email,role,employeeCode,uanNumber,esiNumber',
        `Test Staff 3,staff3.${ts}@preone.test,TEACHER,EMP-T3-03,19101010,12345`,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csv)
      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('BLOCKED')
      expect(row.errors.some((e: string) => e.includes('UAN must be exactly 12 numeric digits'))).toBe(true)
      expect(row.errors.some((e: string) => e.includes('ESI number must be exactly 17 numeric digits'))).toBe(true)
    })

    it('maps statutory header aliases correctly (e.g. pan, PAN, aadhaar, UAN, ESI)', async () => {
      const csv = [
        'fullName,email,role,employeeCode,PAN,AADHAAR,UAN,ESI',
        `Test Staff 4,staff4.${ts}@preone.test,TEACHER,EMP-T3-04,INVALIDPAN,998877665544,123,456`,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csv)
      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('BLOCKED')
      expect(row.errors.length).toBe(4)
      expect(row.errors.some((e: string) => e.includes('Invalid PAN format'))).toBe(true)
      expect(row.errors.some((e: string) => e.includes('Verhoeff checksum'))).toBe(true)
      expect(row.errors.some((e: string) => e.includes('UAN'))).toBe(true)
      expect(row.errors.some((e: string) => e.includes('ESI'))).toBe(true)
    })

    it('accepts compliant statutory IDs, imports cleanly, and persists encrypted in StaffProfile', async () => {
      const validAadhaar = '998877665548' // Valid Verhoeff vector
      const csv = [
        'fullName,email,role,employeeCode,panNumber,aadhaarNumber,uanNumber,esiNumber',
        `Compliant Staff,compliant.${ts}@preone.test,TEACHER,EMP-T3-VALID,abcde1234f,${validAadhaar},100998877665,31998877665544332`,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csv)
      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('VALID')
      expect(row.errors.length).toBe(0)

      // Execute import
      const execResult = await CsvEngine.executeStaffImport(
        { tenantId: tenant.id, actorRole: 'OWNER' },
        preview.rows
      )
      expect(execResult.createdCount).toBe(1)
      expect(execResult.blockedCount).toBe(0)

      // Verify encrypted persistence in DB
      const profile = await db.staffProfile.findFirst({
        where: { tenantId: tenant.id, employeeCode: 'EMP-T3-VALID' },
      })
      expect(profile).toBeDefined()
      expect(EncryptionService.decrypt(profile?.panNumber, tenant.id)).toBe('ABCDE1234F')
      expect(EncryptionService.decrypt(profile?.aadhaarNumber, tenant.id)).toBe(validAadhaar)
      expect(EncryptionService.decrypt(profile?.uanNumber, tenant.id)).toBe('100998877665')
      expect(EncryptionService.decrypt(profile?.esiNumber, tenant.id)).toBe('31998877665544332')
    })

    it('imports row with omitted or empty statutory fields without error', async () => {
      const csv = [
        'fullName,email,role,employeeCode,panNumber,aadhaarNumber',
        `Optional Staff,optional.${ts}@preone.test,TEACHER,EMP-T3-OPT, , `,
      ].join('\n')

      const preview = await CsvEngine.previewStaffCsv(tenant.id, csv)
      expect(preview.rows.length).toBe(1)
      expect(preview.rows[0].status).toBe('VALID')
      expect(preview.rows[0].errors.length).toBe(0)

      const execResult = await CsvEngine.executeStaffImport(
        { tenantId: tenant.id, actorRole: 'OWNER' },
        preview.rows
      )
      expect(execResult.createdCount).toBe(1)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // DEFECT T-4: STAFF EMPLOYEE-CODE COLLISION RECOVERY
  // ─────────────────────────────────────────────────────────────────────────
  describe('Defect T-4: Staff Employee-Code Collision Recovery', () => {
    it('correctly identifies employeeCode unique constraint violation', () => {
      const employeeCodeError = {
        code: 'P2002',
        meta: { target: ['tenantId', 'employeeCode'] },
        message: 'Unique constraint failed on the fields: (`tenantId`,`employeeCode`)',
      }
      expect(isEmployeeCodeUniqueViolation(employeeCodeError)).toBe(true)

      const emailError = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed on the fields: (`email`)',
      }
      expect(isEmployeeCodeUniqueViolation(emailError)).toBe(false)

      const userIdError = {
        code: 'P2002',
        meta: { target: ['tenantId', 'userId'] },
        message: 'Unique constraint failed on the fields: (`tenantId`,`userId`)',
      }
      expect(isEmployeeCodeUniqueViolation(userIdError)).toBe(false)
    })

    it('recovers from employeeCode collision in a fresh transaction without SQLSTATE 25P02', async () => {
      const collidingCode = `COLLIDE-${ts.slice(-4)}`

      // Seed first staff member with collidingCode
      const staff1 = await StaffUserService.createStaff(
        { tenantId: tenant.id, actorRole: 'OWNER' },
        {
          fullName: 'Original Staff',
          email: `orig.${ts}@preone.test`,
          employeeCode: collidingCode,
          role: 'TEACHER',
        }
      )
      expect(staff1.staffProfile.employeeCode).toBe(collidingCode)

      // Now create second staff member requesting the EXACT SAME employeeCode
      // Before T-4 fix, this crashed with PostgreSQL 25P02 transaction aborted.
      // With T-4 fix, this catches the collision at transaction boundary, opens a fresh transaction, and succeeds.
      const staff2 = await StaffUserService.createStaff(
        { tenantId: tenant.id, actorRole: 'OWNER' },
        {
          fullName: 'Colliding Staff',
          email: `collide.${ts}@preone.test`,
          employeeCode: collidingCode,
          role: 'TEACHER',
        }
      )

      expect(staff2).toBeDefined()
      expect(staff2.staffProfile).toBeDefined()
      // Recovered code must be different from collidingCode and start with collidingCode prefix
      expect(staff2.staffProfile.employeeCode).not.toBe(collidingCode)
      expect(staff2.staffProfile.employeeCode.startsWith(collidingCode)).toBe(true)

      // Verify both profiles exist in DB with distinct employee codes
      const p1 = await db.staffProfile.findFirst({ where: { tenantId: tenant.id, userId: staff1.user.id } })
      const p2 = await db.staffProfile.findFirst({ where: { tenantId: tenant.id, userId: staff2.user.id } })
      expect(p1?.employeeCode).toBe(collidingCode)
      expect(p2?.employeeCode).toBe(staff2.staffProfile.employeeCode)
      expect(p1?.employeeCode).not.toBe(p2?.employeeCode)
    })

    it('fails immediately without retrying when an unrelated error occurs (e.g. duplicate email)', async () => {
      const duplicateEmail = `dup.email.${ts}@preone.test`

      // Create first user
      await StaffUserService.createStaff(
        { tenantId: tenant.id, actorRole: 'OWNER' },
        {
          fullName: 'Staff With Email 1',
          email: duplicateEmail,
          role: 'TEACHER',
        }
      )

      // Attempt to create another user with same email (unique email violation)
      let thrownError: any = null
      try {
        await StaffUserService.createStaff(
          { tenantId: tenant.id, actorRole: 'OWNER' },
          {
            fullName: 'Staff With Email 2',
            email: duplicateEmail,
            role: 'TEACHER',
          }
        )
      } catch (err: any) {
        thrownError = err
      }

      expect(thrownError).toBeDefined()
      // Should not be retried as an employeeCode collision
      expect(isEmployeeCodeUniqueViolation(thrownError)).toBe(false)
    })

    it('bounded retry exhausts gracefully after 3 attempts if collision cannot be resolved', async () => {
      let attemptsCount = 0
      const origTransaction = db.$transaction

      const simulatedCollisionError: any = new Error('Unique constraint failed on the fields: (`tenantId`,`employeeCode`)')
      simulatedCollisionError.code = 'P2002'
      simulatedCollisionError.meta = { target: ['tenantId', 'employeeCode'] }

      ;(db as any).$transaction = async () => {
        attemptsCount++
        throw simulatedCollisionError
      }

      let exhaustError: any = null
      try {
        await StaffUserService.createStaff(
          { tenantId: tenant.id, actorRole: 'OWNER' },
          {
            fullName: 'Retry Exhaust Staff',
            email: `exhaust.${ts}@preone.test`,
            role: 'TEACHER',
          }
        )
      } catch (err: any) {
        exhaustError = err
      } finally {
        ;(db as any).$transaction = origTransaction
      }

      expect(attemptsCount).toBe(3) // Verified exactly 3 attempts
      expect(exhaustError).toBeDefined()
      expect(exhaustError.code).toBe('P2002')
      expect(isEmployeeCodeUniqueViolation(exhaustError)).toBe(true)
    })

    it('concurrent staff creations allocate distinct employee codes without transaction crashes', async () => {
      const concurrentCount = 5
      const promises = Array.from({ length: concurrentCount }, (_, i) =>
        StaffUserService.createStaff(
          { tenantId: tenant.id, actorRole: 'OWNER' },
          {
            fullName: `Concurrent Staff ${i}`,
            email: `concurrent.${i}.${ts}@preone.test`,
            role: 'TEACHER',
          }
        )
      )

      const results = await Promise.all(promises)
      expect(results.length).toBe(concurrentCount)

      const allocatedCodes = results.map((r) => r.staffProfile.employeeCode)
      const uniqueCodes = new Set(allocatedCodes)
      expect(uniqueCodes.size).toBe(concurrentCount)
    })
  })
})
