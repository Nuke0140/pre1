import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { PUT as settingsPut, GET as settingsGet } from '@/app/api/v1/settings/route'
import { SettingsService } from '@/lib/settings/settings-service'
import {
  normalizeOptionalString,
  validateEmail,
  validatePhone,
  validateGstin,
  validatePan,
  validateSchoolProfileInput,
} from '@/lib/settings/settings-validation'
import { PreOneError } from '@/lib/errors'

describe('QA-007: School Profile Save & Validation Hardening', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let ownerUser: any
  let ownerToken: string

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        name: `Acme Academy ${ts.slice(-4)}`,
        code: `ACM-${ts.slice(-4)}`,
        status: 'ACTIVE',
        address: '123 Initial Street',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        phone: '+91 98765 00000',
        email: `contact_${ts.slice(-4)}@acme.edu`,
        website: 'https://initial.acme.edu',
        gstNumber: '27AABCU9603R1ZM',
        panNumber: 'ABCDE1234F',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `ACM-MC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    ownerUser = await db.user.create({
      data: {
        email: `owner_${ts.slice(-4)}@acme.edu`,
        fullName: 'School Owner',
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

    ownerToken = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      role: 'OWNER',
      name: 'School Owner',
      tenantId: tenant.id,
      branchId: branch.id,
    })
  })

  // ---------------------------------------------------------------------------
  // 1. Normalization helper tests
  // ---------------------------------------------------------------------------
  describe('Normalization Helper (normalizeOptionalString)', () => {
    it('returns undefined when value is undefined (omitted field preservation)', () => {
      expect(normalizeOptionalString(undefined)).toBeUndefined()
    })

    it('returns null when value is null (clearing field)', () => {
      expect(normalizeOptionalString(null)).toBeNull()
    })

    it('returns null when value is empty string or whitespace (clearing field)', () => {
      expect(normalizeOptionalString('')).toBeNull()
      expect(normalizeOptionalString('   ')).toBeNull()
      expect(normalizeOptionalString('\t\n ')).toBeNull()
    })

    it('returns trimmed string when value has content', () => {
      expect(normalizeOptionalString('  example.com  ')).toBe('example.com')
      expect(normalizeOptionalString('Pune')).toBe('Pune')
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Email validation tests
  // ---------------------------------------------------------------------------
  describe('Email Validation (validateEmail)', () => {
    it('accepts valid email addresses and normalizes to lowercase', () => {
      const res = validateEmail('School.Admin@Example.COM ')
      expect(res.valid).toBe(true)
      expect(res.normalized).toBe('school.admin@example.com')
    })

    it('rejects malformed email strings', () => {
      expect(validateEmail('not-an-email').valid).toBe(false)
      expect(validateEmail('user@').valid).toBe(false)
      expect(validateEmail('@domain.com').valid).toBe(false)
      expect(validateEmail('user@domain').valid).toBe(false)
    })

    it('treats empty, null, and undefined as valid (clearing optional field)', () => {
      expect(validateEmail(undefined).valid).toBe(true)
      expect(validateEmail(null).valid).toBe(true)
      expect(validateEmail('').valid).toBe(true)
      expect(validateEmail('   ').valid).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Phone validation tests
  // ---------------------------------------------------------------------------
  describe('Phone Validation (validatePhone)', () => {
    it('accepts valid phone numbers with standard country codes and formatting', () => {
      expect(validatePhone('+91 98765 43210').valid).toBe(true)
      expect(validatePhone('+919876543210').valid).toBe(true)
      expect(validatePhone('9876543210').valid).toBe(true)
      expect(validatePhone('(020) 2567-8901').valid).toBe(true)
      expect(validatePhone('+1 555-123-4567').valid).toBe(true)
    })

    it('rejects malformed phone numbers', () => {
      expect(validatePhone('abcdef').valid).toBe(false)
      expect(validatePhone('123').valid).toBe(false) // too short (< 7 digits)
      expect(validatePhone('12345678901234567890').valid).toBe(false) // too long (> 15 digits)
      expect(validatePhone('++91-abc-123').valid).toBe(false)
    })

    it('treats empty, null, and undefined as valid (clearing optional field)', () => {
      expect(validatePhone(undefined).valid).toBe(true)
      expect(validatePhone(null).valid).toBe(true)
      expect(validatePhone('').valid).toBe(true)
      expect(validatePhone('   ').valid).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 4. GSTIN validation tests
  // ---------------------------------------------------------------------------
  describe('GSTIN Validation (validateGstin)', () => {
    it('accepts valid 15-character Indian GSTIN and normalizes to uppercase', () => {
      const res = validateGstin(' 27aabcu9603r1zm ')
      expect(res.valid).toBe(true)
      expect(res.normalized).toBe('27AABCU9603R1ZM')
    })

    it('rejects malformed GSTIN numbers', () => {
      expect(validateGstin('12345').valid).toBe(false)
      expect(validateGstin('27AABCU9603R1Z').valid).toBe(false) // 14 chars
      expect(validateGstin('27AABCU9603R1ZMM').valid).toBe(false) // 16 chars
      expect(validateGstin('XXAABCU9603R1ZM').valid).toBe(false) // invalid state code
    })

    it('treats empty, null, and undefined as valid (clearing optional field)', () => {
      expect(validateGstin(undefined).valid).toBe(true)
      expect(validateGstin(null).valid).toBe(true)
      expect(validateGstin('').valid).toBe(true)
      expect(validateGstin('   ').valid).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 5. PAN validation tests
  // ---------------------------------------------------------------------------
  describe('PAN Validation (validatePan)', () => {
    it('accepts valid 10-character Indian PAN and normalizes to uppercase', () => {
      const res = validatePan(' abcde1234f ')
      expect(res.valid).toBe(true)
      expect(res.normalized).toBe('ABCDE1234F')
    })

    it('rejects malformed PAN numbers', () => {
      expect(validatePan('12345').valid).toBe(false)
      expect(validatePan('ABCDE12345').valid).toBe(false)
      expect(validatePan('12345ABCDE').valid).toBe(false)
      expect(validatePan('ABCD12345E').valid).toBe(false)
    })

    it('treats empty, null, and undefined as valid (clearing optional field)', () => {
      expect(validatePan(undefined).valid).toBe(true)
      expect(validatePan(null).valid).toBe(true)
      expect(validatePan('').valid).toBe(true)
      expect(validatePan('   ').valid).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 6. School Profile Validator (validateSchoolProfileInput)
  // ---------------------------------------------------------------------------
  describe('validateSchoolProfileInput', () => {
    it('rejects blank or whitespace-only school name', () => {
      const resEmpty = validateSchoolProfileInput({ name: '' })
      expect(resEmpty.valid).toBe(false)
      expect(resEmpty.errors.name).toBeDefined()

      const resSpaces = validateSchoolProfileInput({ name: '    ' })
      expect(resSpaces.valid).toBe(false)
      expect(resSpaces.errors.name).toBeDefined()
    })

    it('normalizes valid optional fields and trims whitespace', () => {
      const res = validateSchoolProfileInput({
        name: '  Greenwood High  ',
        email: ' Info@Greenwood.Edu ',
        phone: ' +91 98765 11111 ',
        website: ' https://greenwood.edu ',
        address: ' 456 Palm Grove ',
        gstNumber: ' 27aabcu9603r1zm ',
        panNumber: ' abcde1234f ',
      })
      expect(res.valid).toBe(true)
      expect(res.normalized.name).toBe('Greenwood High')
      expect(res.normalized.email).toBe('info@greenwood.edu')
      expect(res.normalized.phone).toBe('+91 98765 11111')
      expect(res.normalized.website).toBe('https://greenwood.edu')
      expect(res.normalized.address).toBe('456 Palm Grove')
      expect(res.normalized.gstNumber).toBe('27AABCU9603R1ZM')
      expect(res.normalized.panNumber).toBe('ABCDE1234F')
    })
  })

  // ---------------------------------------------------------------------------
  // 7. SettingsService Database Layer Updates
  // ---------------------------------------------------------------------------
  describe('SettingsService.updateSchoolProfile (Database Operations)', () => {
    it('safely handles null optional fields without throwing TypeError on trim()', async () => {
      // Prior bug: null.trim() threw 500 error
      const updated = await SettingsService.updateSchoolProfile(tenant.id, {
        website: null,
        address: null,
        gstNumber: null,
      })

      expect(updated.website).toBeNull()
      expect(updated.address).toBeNull()
      expect(updated.gstNumber).toBeNull()
    })

    it('preserves omitted fields during partial updates', async () => {
      // First update name and phone
      await SettingsService.updateSchoolProfile(tenant.id, {
        name: 'Preserved School Name',
        phone: '+91 91111 22222',
        city: 'Mumbai',
      })

      // Partial update without touching phone or city
      const updated = await SettingsService.updateSchoolProfile(tenant.id, {
        name: 'Preserved School Name Updated',
      })

      expect(updated.name).toBe('Preserved School Name Updated')
      expect(updated.phone).toBe('+91 91111 22222')
      expect(updated.city).toBe('Mumbai')
    })

    it('clears fields when updated to empty string or whitespace', async () => {
      // Set initial values
      await SettingsService.updateSchoolProfile(tenant.id, {
        website: 'https://myschool.com',
        panNumber: 'ABCDE1234F',
      })

      // Update with empty/whitespace strings
      const updated = await SettingsService.updateSchoolProfile(tenant.id, {
        website: '',
        panNumber: '   ',
      })

      expect(updated.website).toBeNull()
      expect(updated.panNumber).toBeNull()
    })

    it('throws validation error when name is blank or whitespace', async () => {
      let threw = false
      try {
        await SettingsService.updateSchoolProfile(tenant.id, {
          name: '   ',
        })
      } catch (e: any) {
        threw = true
        expect(e instanceof PreOneError).toBe(true)
        expect(e.httpStatus).toBe(400)
        expect(e.field).toBe('name')
      }
      expect(threw).toBe(true)
    })

    it('throws validation error when email is malformed', async () => {
      let threw = false
      try {
        await SettingsService.updateSchoolProfile(tenant.id, {
          email: 'invalid-email-string',
        })
      } catch (e: any) {
        threw = true
        expect(e instanceof PreOneError).toBe(true)
        expect(e.httpStatus).toBe(400)
        expect(e.field).toBe('email')
      }
      expect(threw).toBe(true)
    })

    it('throws validation error when GSTIN is malformed', async () => {
      let threw = false
      try {
        await SettingsService.updateSchoolProfile(tenant.id, {
          gstNumber: '12345',
        })
      } catch (e: any) {
        threw = true
        expect(e instanceof PreOneError).toBe(true)
        expect(e.httpStatus).toBe(400)
        expect(e.field).toBe('gstNumber')
      }
      expect(threw).toBe(true)
    })

    it('throws validation error when PAN is malformed', async () => {
      let threw = false
      try {
        await SettingsService.updateSchoolProfile(tenant.id, {
          panNumber: '12345',
        })
      } catch (e: any) {
        threw = true
        expect(e instanceof PreOneError).toBe(true)
        expect(e.httpStatus).toBe(400)
        expect(e.field).toBe('panNumber')
      }
      expect(threw).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // 8. PUT /api/v1/settings Route Hardening (HTTP Status & Contract)
  // ---------------------------------------------------------------------------
  describe('PUT /api/v1/settings API Route Contract', () => {
    it('returns HTTP 200 when updating profile with null optional fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${SESSION_COOKIE}=${ownerToken}`,
        },
        body: JSON.stringify({
          profile: {
            website: null,
            address: null,
            phone: '+91 99999 88888',
          },
        }),
      })

      const res = await settingsPut(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.profile.website).toBeNull()
      expect(json.data.profile.phone).toBe('+91 99999 88888')
    })

    it('returns HTTP 400 (not 500) for client validation errors with field details', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${SESSION_COOKIE}=${ownerToken}`,
        },
        body: JSON.stringify({
          profile: {
            name: '   ',
          },
        }),
      })

      const res = await settingsPut(req)
      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_001')
      expect(json.error.field).toBe('name')
    })

    it('returns HTTP 400 when malformed GSTIN is submitted via API', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${SESSION_COOKIE}=${ownerToken}`,
        },
        body: JSON.stringify({
          profile: {
            gstNumber: 'INVALID-GST-NUMBER',
          },
        }),
      })

      const res = await settingsPut(req)
      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.field).toBe('gstNumber')
    })

    it('returns HTTP 500 when an unexpected internal error occurs (without leaking stack trace)', async () => {
      // Call with an invalid tenant context to trigger a system error if mocked
      const badReq = new NextRequest('http://localhost:3000/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: `${SESSION_COOKIE}=${ownerToken}`,
        },
        // Missing body triggers a JSON parse error / system error
        body: 'invalid-json{{{',
      })

      const res = await settingsPut(badReq)
      expect(res.status).toBe(500)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('SYSTEM_001')
      // Ensure stack traces are not leaked in error message
      expect(json.error.message).toContain('Something went wrong on our side')
      expect(json.error.stack).toBeUndefined()
    })
  })
})
