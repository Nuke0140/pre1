import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { EncryptionService } from '@/lib/security/encryption-service'
import { DpdpService } from '@/lib/security/dpdp-service'
import { GET as anonymizeGet, POST as anonymizePost } from '@/app/api/v1/users/[id]/anonymize/route'
import { GET as getUserGet } from '@/app/api/v1/users/[id]/route'

describe('PII Encryption & DPDP Anonymization Workflow (Doc 4.1 / 4.2)', () => {
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let soleOwnerTenant: any
  let soleOwnerUser: any
  let teacherA: any
  let staffTarget: any
  let staffProfileTarget: any
  let guardianTargetUser: any
  let guardianTargetRecord: any
  let cookieOwnerA: string
  let cookieTeacherA: string
  let cookieTenantB: string
  let cookieSoleOwner: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  beforeAll(async () => {
    // 1. Setup Tenant A
    tenantA = await db.tenant.create({
      data: {
        name: `DPDP School A ${ts}`,
        code: `DPA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 2. Setup Tenant B (for cross-tenant checks)
    tenantB = await db.tenant.create({
      data: {
        name: `DPDP School B ${ts}`,
        code: `DPB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    // 3. Setup Sole Owner Tenant (to test sole-owner protection)
    soleOwnerTenant = await db.tenant.create({
      data: {
        name: `Sole Owner School ${ts}`,
        code: `SOL-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    soleOwnerUser = await db.user.create({
      data: {
        email: `sole_owner_${ts}@dpdp.com`,
        username: `sole_owner_${ts}`,
        fullName: 'Sole Owner Principal',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: soleOwnerTenant.id,
        userId: soleOwnerUser.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieSoleOwner = await signSession({
      uid: soleOwnerUser.id,
      email: soleOwnerUser.email,
      role: 'OWNER',
      tenantId: soleOwnerTenant.id,
    })

    // 4. Setup Owner A in Tenant A
    ownerA = await db.user.create({
      data: {
        email: `owner_${ts}@dpdpschool.com`,
        username: `owner_${ts}`,
        fullName: 'School Owner A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    // Add a second owner in Tenant A so Owner A isn't sole owner
    const secondOwner = await db.user.create({
      data: {
        email: `second_owner_${ts}@dpdpschool.com`,
        username: `second_owner_${ts}`,
        fullName: 'Second Owner',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: secondOwner.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    // 5. Setup Teacher A (lacks users:delete)
    teacherA = await db.user.create({
      data: {
        email: `teacher_${ts}@dpdpschool.com`,
        username: `teacher_${ts}`,
        fullName: 'Teacher A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: teacherA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    })

    cookieTeacherA = await signSession({
      uid: teacherA.id,
      email: teacherA.email,
      role: 'TEACHER',
      tenantId: tenantA.id,
    })

    // 6. Setup Tenant B admin
    const adminB = await db.user.create({
      data: {
        email: `adminB_${ts}@dpdpschool.com`,
        username: `adminB_${ts}`,
        fullName: 'Admin B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: adminB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    cookieTenantB = await signSession({
      uid: adminB.id,
      email: adminB.email,
      role: 'OWNER',
      tenantId: tenantB.id,
    })

    // 7. Setup Staff Target in Tenant A (with sensitive statutory data)
    staffTarget = await db.user.create({
      data: {
        email: `staff_dpdp_${ts}@dpdpschool.com`,
        username: `staff_dpdp_${ts}`,
        fullName: 'Rajesh Verma',
        phone: `+9198${ts.slice(-8)}`,
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    const staffMember = await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: staffTarget.id,
        role: 'STAFF',
        status: 'ACTIVE',
      },
    })

    staffProfileTarget = await db.staffProfile.create({
      data: {
        tenantId: tenantA.id,
        userId: staffTarget.id,
        employeeCode: `EMP-DPDP-${ts.slice(-4)}`,
        designation: 'Senior Accountant',
        department: 'Finance',
        panNumber: EncryptionService.encrypt('ABCDE1234F', tenantA.id),
        aadhaarNumber: EncryptionService.encrypt('999988887777', tenantA.id),
        uanNumber: EncryptionService.encrypt('100999888777', tenantA.id),
        esiNumber: EncryptionService.encrypt('11223344556677889', tenantA.id),
        currentAddress: EncryptionService.encrypt('Flat 402, Lotus Towers, Mumbai', tenantA.id),
        permanentAddress: EncryptionService.encrypt('House 12, MG Road, Pune', tenantA.id),
        emergencyContactName: 'Sunita Verma',
        emergencyContactPhone: '+919988776655',
      },
    })

    // Add active session for staffTarget
    const sessionToken = `session_token_${ts}`
    await db.userSession.create({
      data: {
        userId: staffTarget.id,
        tenantId: tenantA.id,
        tokenHash: crypto.createHash('sha256').update(sessionToken).digest('hex'),
        device: 'Desktop (Chrome)',
        platform: 'Windows 11',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })

    // 8. Setup Guardian Target in Tenant A
    guardianTargetUser = await db.user.create({
      data: {
        email: `parent_dpdp_${ts}@dpdpschool.com`,
        username: `parent_dpdp_${ts}`,
        fullName: 'Amitabh Joshi',
        phone: `+9197${ts.slice(-8)}`,
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: guardianTargetUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })

    guardianTargetRecord = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        userId: guardianTargetUser.id,
        fullName: guardianTargetUser.fullName,
        phone: guardianTargetUser.phone!,
        email: guardianTargetUser.email,
        relationship: 'FATHER',
        occupation: 'Software Architect',
        pickupPin: '$2b$10$mockpickupinhashfortest',
      },
    })
  })

  // =========================================================================
  // Section 1: EncryptionService (Doc 4.1) Unit Tests
  // =========================================================================

  describe('EncryptionService (AES-256-GCM field encryption)', () => {
    it('encrypts plaintext into the enc:v1:<iv>:<tag>:<ciphertext> format', () => {
      const plaintext = 'ABCDE1234F'
      const encrypted = EncryptionService.encrypt(plaintext, tenantA.id)

      expect(encrypted).not.toBeNull()
      expect(encrypted!.startsWith('enc:v1:')).toBe(true)

      const parts = encrypted!.replace('enc:v1:', '').split(':')
      expect(parts.length).toBe(3)
      // IV is 12 bytes = 24 hex characters
      expect(parts[0].length).toBe(24)
      // Auth Tag is 16 bytes = 32 hex characters
      expect(parts[1].length).toBe(32)
      // Ciphertext hex is non-empty
      expect(parts[2].length).toBeGreaterThan(0)
    })

    it('decrypts encrypted text back to exact original plaintext', () => {
      const original = '999988887777'
      const encrypted = EncryptionService.encrypt(original, tenantA.id)
      const decrypted = EncryptionService.decrypt(encrypted, tenantA.id)

      expect(decrypted).toBe(original)
    })

    it('is idempotent: encrypting already-encrypted text returns the same ciphertext without double encryption', () => {
      const text = 'Sensitive Address 123'
      const enc1 = EncryptionService.encrypt(text, tenantA.id)
      const enc2 = EncryptionService.encrypt(enc1, tenantA.id)

      expect(enc2).toBe(enc1)
    })

    it('backward compatibility: returns unencrypted plaintext as-is gracefully without errors', () => {
      const legacyPlaintext = 'OLD_LEGACY_PAN_12345'
      const result = EncryptionService.decrypt(legacyPlaintext, tenantA.id)

      expect(result).toBe(legacyPlaintext)
    })

    it('handles null, undefined, and empty string safely', () => {
      expect(EncryptionService.encrypt(null)).toBeNull()
      expect(EncryptionService.encrypt('')).toBe('')
      expect(EncryptionService.decrypt(null)).toBeNull()
      expect(EncryptionService.decrypt('')).toBe('')
    })

    it('authenticates ciphertext: tampering with auth tag causes decryption failure (returns null)', () => {
      const encrypted = EncryptionService.encrypt('TopSecretData', tenantA.id)!
      const parts = encrypted.split(':')
      // Tamper with the authentication tag
      const tamperedTag = parts[2].slice(0, -2) + (parts[2].slice(-2) === 'aa' ? 'bb' : 'aa')
      const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedTag}:${parts[3]}`

      const result = EncryptionService.decrypt(tamperedPayload, tenantA.id)
      expect(result).toBeNull()
    })

    it('enforces per-tenant key derivation: ciphertext from Tenant A cannot be decrypted with Tenant B key', () => {
      const plaintext = 'BankAccNumber_987654321'
      const encTenantA = EncryptionService.encrypt(plaintext, tenantA.id)

      // Attempting to decrypt with Tenant B's derived key fails
      const decTenantB = EncryptionService.decrypt(encTenantA, tenantB.id)
      expect(decTenantB).toBeNull()

      // Decrypting with Tenant A's derived key succeeds
      const decTenantA = EncryptionService.decrypt(encTenantA, tenantA.id)
      expect(decTenantA).toBe(plaintext)
    })

    it('batch encrypts and decrypts multiple fields on an object correctly', () => {
      const profileData = {
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '123456789012',
        nonSensitiveName: 'John Doe',
      }

      const encryptedObj = EncryptionService.encryptPiiFields(
        profileData,
        ['panNumber', 'aadhaarNumber'],
        tenantA.id
      )

      expect(encryptedObj.nonSensitiveName).toBe('John Doe')
      expect(EncryptionService.isEncrypted(encryptedObj.panNumber)).toBe(true)
      expect(EncryptionService.isEncrypted(encryptedObj.aadhaarNumber)).toBe(true)

      const decryptedObj = EncryptionService.decryptPiiFields(
        encryptedObj,
        ['panNumber', 'aadhaarNumber'],
        tenantA.id
      )

      expect(decryptedObj.panNumber).toBe('ABCDE1234F')
      expect(decryptedObj.aadhaarNumber).toBe('123456789012')
      expect(decryptedObj.nonSensitiveName).toBe('John Doe')
    })
  })

  // =========================================================================
  // Section 2: DPDP Service & Safeguards (Doc 4.2)
  // =========================================================================

  describe('DPDP Anonymization Service & Safeguards', () => {
    it('generates an accurate preview of fields to scrub and preserved records', async () => {
      const preview = await DpdpService.previewAnonymization({
        userId: staffTarget.id,
        tenantId: tenantA.id,
      })

      expect(preview).not.toBeNull()
      expect(preview!.userId).toBe(staffTarget.id)
      expect(preview!.fieldsToScrub).toContain('user.fullName')
      expect(preview!.fieldsToScrub).toContain('user.email')
      expect(preview!.fieldsToScrub).toContain('staffProfile.panNumber')
      expect(preview!.fieldsToScrub).toContain('staffProfile.aadhaarNumber')
      expect(preview!.hasStaffProfile).toBe(true)
      expect(preview!.preservedRecords).toBeDefined()
    })

    it('rejects anonymization when confirmErasure is false or missing', async () => {
      await expect(
        DpdpService.anonymizeUser({
          userId: staffTarget.id,
          tenantId: tenantA.id,
          actorSession: {
            uid: ownerA.id,
            email: ownerA.email,
            role: 'OWNER',
            tenantId: tenantA.id,
          } as any,
          reason: 'Employee resigned',
          confirmErasure: false,
        })
      ).rejects.toThrow('confirmation is required')
    })

    it('rejects anonymization when reason is too short', async () => {
      await expect(
        DpdpService.anonymizeUser({
          userId: staffTarget.id,
          tenantId: tenantA.id,
          actorSession: {
            uid: ownerA.id,
            email: ownerA.email,
            role: 'OWNER',
            tenantId: tenantA.id,
          } as any,
          reason: 'abc',
          confirmErasure: true,
        })
      ).rejects.toThrow('at least 5 characters')
    })

    it('protects the sole active Owner of a school from being erased (SOLE_OWNER_PROTECTION)', async () => {
      await expect(
        DpdpService.anonymizeUser({
          userId: soleOwnerUser.id,
          tenantId: soleOwnerTenant.id,
          actorSession: {
            uid: soleOwnerUser.id,
            email: soleOwnerUser.email,
            role: 'OWNER',
            tenantId: soleOwnerTenant.id,
          } as any,
          reason: 'Owner requested personal erasure',
          confirmErasure: true,
        })
      ).rejects.toThrow('Cannot anonymize or erase the sole active Owner')
    })
  })

  // =========================================================================
  // Section 3: DPDP API Route Endpoints Integration
  // =========================================================================

  describe('DPDP API Route Endpoints (/api/v1/users/[id]/anonymize)', () => {
    it('GET: requires authentication (rejects unauthenticated request)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`)
      const res = await anonymizeGet(req, { params: Promise.resolve({ id: staffTarget.id }) })

      expect(res.status).toBe(401)
    })

    it('GET: prevents cross-tenant access (School B admin querying School A user returns 404)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`, {
        headers: { cookie: `preone_session=${cookieTenantB}` },
      })
      const res = await anonymizeGet(req, { params: Promise.resolve({ id: staffTarget.id }) })

      expect(res.status).toBe(404)
    })

    it('GET: returns preview of fields to scrub for School A Owner', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`, {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })
      const res = await anonymizeGet(req, { params: Promise.resolve({ id: staffTarget.id }) })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.fieldsToScrub.length).toBeGreaterThan(0)
      expect(json.data.preservedRecords).toBeDefined()
    })

    it('POST: rejects teacher role lacking users:delete permission (403)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieTeacherA}`,
        },
        body: JSON.stringify({
          reason: 'Employee resigned requested erasure',
          confirmErasure: true,
        }),
      })

      const res = await anonymizePost(req, { params: Promise.resolve({ id: staffTarget.id }) })
      expect(res.status).toBe(403)
    })

    it('POST: validates confirmation parameter (400 if confirmErasure is missing)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          reason: 'Employee resigned requested erasure',
        }),
      })

      const res = await anonymizePost(req, { params: Promise.resolve({ id: staffTarget.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.code).toBe('CONFIRMATION_REQUIRED')
    })

    it('POST: validates reason parameter (400 if reason is empty or too short)', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          reason: 'no',
          confirmErasure: true,
        }),
      })

      const res = await anonymizePost(req, { params: Promise.resolve({ id: staffTarget.id }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error.code).toBe('REASON_REQUIRED')
    })

    it('POST: executes permanent DPDP anonymization on Staff Target, scrubbing personal data and terminating sessions', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${staffTarget.id}/anonymize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          reason: 'Employee resigned and exercised statutory right to erasure under DPDP Act 2023 Sec 6(6)',
          confirmErasure: true,
        }),
      })

      const res = await anonymizePost(req, { params: Promise.resolve({ id: staffTarget.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.scrubbedCount).toBeGreaterThan(0)
      expect(json.data.sessionsRevokedCount).toBeGreaterThanOrEqual(1)

      // Verify in DB that User is de-identified & status is ARCHIVED
      const updatedUser = await db.user.findUnique({ where: { id: staffTarget.id } })
      expect(updatedUser!.status).toBe('ARCHIVED')
      expect(updatedUser!.fullName.startsWith('Anonymized User')).toBe(true)
      expect(updatedUser!.phone).toBeNull()
      expect(updatedUser!.email!.includes('anonymized.preone.internal')).toBe(true)
      expect(updatedUser!.deletedAt).not.toBeNull()

      // Verify in DB that StaffProfile PII is wiped
      const updatedStaffProfile = await db.staffProfile.findFirst({
        where: { tenantId: tenantA.id, userId: staffTarget.id },
      })
      expect(updatedStaffProfile!.panNumber).toBeNull()
      expect(updatedStaffProfile!.aadhaarNumber).toBeNull()
      expect(updatedStaffProfile!.uanNumber).toBeNull()
      expect(updatedStaffProfile!.esiNumber).toBeNull()
      expect(updatedStaffProfile!.currentAddress).toBeNull()
      expect(updatedStaffProfile!.permanentAddress).toBeNull()
      expect(updatedStaffProfile!.emergencyContactName).toBeNull()
      expect(updatedStaffProfile!.emergencyContactPhone).toBeNull()

      // Verify that active sessions are revoked
      const activeSessions = await db.userSession.findMany({
        where: { userId: staffTarget.id, status: 'ACTIVE' },
      })
      expect(activeSessions.length).toBe(0)

      // Verify audit log exists
      const auditLog = await db.auditLog.findFirst({
        where: {
          tenantId: tenantA.id,
          entityId: staffTarget.id,
          action: 'DPDP_ANONYMIZED_USER',
        },
      })
      expect(auditLog).not.toBeNull()
      expect(auditLog!.action).toBe('DPDP_ANONYMIZED_USER')
    })

    it('POST: executes permanent DPDP anonymization on Guardian Target, wiping contact and pickup PIN', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianTargetUser.id}/anonymize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          reason: 'Parent requested data deletion following student graduation under DPDP 2023',
          confirmErasure: true,
        }),
      })

      const res = await anonymizePost(req, { params: Promise.resolve({ id: guardianTargetUser.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)

      // Verify Guardian record in DB
      const updatedGuardian = await db.guardian.findFirst({
        where: { tenantId: tenantA.id, userId: guardianTargetUser.id },
      })
      expect(updatedGuardian!.fullName.startsWith('Anonymized Guardian')).toBe(true)
      expect(updatedGuardian!.email).toBeNull()
      expect(updatedGuardian!.pickupPin).toBeNull()
      expect(updatedGuardian!.occupation).toBeNull()
      expect(updatedGuardian!.deletedAt).not.toBeNull()
    })
  })
})
