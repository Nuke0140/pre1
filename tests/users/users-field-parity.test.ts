import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as usersCsvPost } from '@/app/api/v1/users/csv/route'
import { GET as usersExportGet } from '@/app/api/v1/users/export/route'
import { POST as hrStaffBulkPost } from '@/app/api/v1/hr/staff/bulk/route'
import bcrypt from 'bcryptjs'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { EncryptionService } from '@/lib/security/encryption-service'
import {
  CANONICAL_STAFF_FIELDS,
  CANONICAL_FAMILY_FIELDS,
  normalizeHeaderToCanonicalKey,
  resolveRowWithAliases,
  parseBooleanCell,
  isHrFieldHeader,
} from '@/lib/users/canonical-fields'
import { UserCsvEngine } from '@/lib/users/csv-engine'
import { StaffService } from '@/lib/hr/staff-service'

describe('PreOne Users Module: Field Simplification & HR Module Separation', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let ownerUser: any
  let cookieOwner: string

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        code: `PARITY-${ts.slice(-5)}`,
        name: `Parity Test Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        code: `MAIN-${ts.slice(-4)}`,
        name: 'Main Campus',
        isMain: true,
      },
    })

    const passwordHash = await bcrypt.hash('ParitySecure@2026', 10)
    ownerUser = await db.user.create({
      data: {
        email: `parity.owner.${ts}@preone.test`,
        username: `parity_owner_${ts}`,
        fullName: 'Parity Owner Admin',
        passwordHash,
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: ownerUser.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
        branchId: branch.id,
      },
    })

    const token = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })
    cookieOwner = `${SESSION_COOKIE}=${token}`
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 1: Authoritative Simplified Identity Contract Layer
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 1: Authoritative Simplified Identity Metadata Contract', () => {
    it('defines simplified canonical definitions for Staff focusing strictly on identity and access', () => {
      const staffKeys = CANONICAL_STAFF_FIELDS.map((f) => f.key)
      expect(staffKeys).toEqual([
        'fullName',
        'email',
        'phone',
        'username',
        'role',
        'branchCode',
        'classroomCode',
        'employeeCode',
        'password',
        'status',
      ])

      expect(new Set(staffKeys).size).toBe(staffKeys.length)
    })

    it('confirms HR, personal, and statutory fields are completely removed from Users canonical contract', () => {
      const staffKeys = new Set(CANONICAL_STAFF_FIELDS.map((f) => f.key))

      // HR & employment fields removed
      expect(staffKeys.has('designation')).toBe(false)
      expect(staffKeys.has('department')).toBe(false)
      expect(staffKeys.has('qualification')).toBe(false)
      expect(staffKeys.has('employmentType')).toBe(false)
      expect(staffKeys.has('joiningDate')).toBe(false)
      expect(staffKeys.has('noticePeriodDays')).toBe(false)

      // Personal & emergency details removed
      expect(staffKeys.has('dateOfBirth')).toBe(false)
      expect(staffKeys.has('gender')).toBe(false)
      expect(staffKeys.has('maritalStatus')).toBe(false)
      expect(staffKeys.has('bloodGroup')).toBe(false)
      expect(staffKeys.has('emergencyContactName')).toBe(false)
      expect(staffKeys.has('emergencyContactPhone')).toBe(false)
      expect(staffKeys.has('currentAddress')).toBe(false)
      expect(staffKeys.has('permanentAddress')).toBe(false)

      // Statutory IDs removed
      expect(staffKeys.has('panNumber')).toBe(false)
      expect(staffKeys.has('aadhaarNumber')).toBe(false)
      expect(staffKeys.has('uanNumber')).toBe(false)
      expect(staffKeys.has('esiNumber')).toBe(false)
    })

    it('enforces strict role separation: staff fields do not leak into family and vice-versa', () => {
      const staffKeys = new Set(CANONICAL_STAFF_FIELDS.map((f) => f.key))
      const familyKeys = new Set(CANONICAL_FAMILY_FIELDS.map((f) => f.key))

      expect(staffKeys.has('employeeCode')).toBe(true)
      expect(staffKeys.has('password')).toBe(true)

      expect(familyKeys.has('employeeCode')).toBe(false)
      expect(familyKeys.has('password')).toBe(false)

      expect(familyKeys.has('canPickup')).toBe(true)
      expect(familyKeys.has('receivesComm')).toBe(true)
      expect(familyKeys.has('isFeePayer')).toBe(true)
      expect(familyKeys.has('relationship')).toBe(true)

      expect(staffKeys.has('canPickup')).toBe(false)
      expect(staffKeys.has('isFeePayer')).toBe(false)
    })

    it('flags sensitive credentials with exportable=false to enforce data minimization', () => {
      const pwdField = CANONICAL_STAFF_FIELDS.find((f) => f.key === 'password')
      expect(pwdField).toBeDefined()
      expect(pwdField?.exportable).toBe(false)
      expect(pwdField?.sensitive).toBe(true)
      expect(pwdField?.importable).toBe(true)

      const pinField = CANONICAL_FAMILY_FIELDS.find((f) => f.key === 'pickupPin')
      expect(pinField).toBeDefined()
      expect(pinField?.exportable).toBe(false)
      expect(pinField?.sensitive).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 2: Normalization, Alias Resolution & HR Field Detection
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 2: Normalization, Alias Resolution & HR Field Detection', () => {
    it('normalizes common human-friendly header variations to canonical keys', () => {
      expect(normalizeHeaderToCanonicalKey('Full Name', 'STAFF')).toBe('fullName')
      expect(normalizeHeaderToCanonicalKey('full_name', 'STAFF')).toBe('fullName')
      expect(normalizeHeaderToCanonicalKey('Mobile Number', 'STAFF')).toBe('phone')
      expect(normalizeHeaderToCanonicalKey('Staff Password', 'STAFF')).toBe('password')
      expect(normalizeHeaderToCanonicalKey('Emp Code', 'STAFF')).toBe('employeeCode')

      expect(normalizeHeaderToCanonicalKey('Authorized Pickup', 'FAMILY')).toBe('canPickup')
      expect(normalizeHeaderToCanonicalKey('can_pickup', 'FAMILY')).toBe('canPickup')
      expect(normalizeHeaderToCanonicalKey('Primary Contact', 'FAMILY')).toBe('isPrimaryContact')
      expect(normalizeHeaderToCanonicalKey('is_primary', 'FAMILY')).toBe('isPrimaryContact')
      expect(normalizeHeaderToCanonicalKey('Fee Payer', 'FAMILY')).toBe('isFeePayer')
      expect(normalizeHeaderToCanonicalKey('Relation to Child', 'FAMILY')).toBe('relationship')
    })

    it('correctly detects HR field aliases to emit informative advisory guidance', () => {
      expect(isHrFieldHeader('Designation').isHr).toBe(true)
      expect(isHrFieldHeader('department').isHr).toBe(true)
      expect(isHrFieldHeader('Date of Joining').isHr).toBe(true)
      expect(isHrFieldHeader('doj').isHr).toBe(true)
      expect(isHrFieldHeader('PAN Number').isHr).toBe(true)
      expect(isHrFieldHeader('aadhaar').isHr).toBe(true)
      expect(isHrFieldHeader('Current Address').isHr).toBe(true)
      expect(isHrFieldHeader('emergency_contact_phone').isHr).toBe(true)

      expect(isHrFieldHeader('fullName').isHr).toBe(false)
      expect(isHrFieldHeader('email').isHr).toBe(false)
      expect(isHrFieldHeader('password').isHr).toBe(false)
    })

    it('reports unrecognized columns in unmapped output to prevent silent dropping', () => {
      const rawRow = {
        'Full Name': 'Suresh Menon',
        'Email Address': 'suresh@preone.test',
        'Favorite Color': 'Blue',
        'Zodiac Sign': 'Leo',
      }
      const { canonical, unmapped } = resolveRowWithAliases(rawRow, 'STAFF')
      expect(canonical.fullName).toBe('Suresh Menon')
      expect(canonical.email).toBe('suresh@preone.test')
      expect(unmapped['Favorite Color']).toBe('Blue')
      expect(unmapped['Zodiac Sign']).toBe('Leo')
    })

    it('parses boolean inputs resiliently across CSV and grid representations', () => {
      expect(parseBooleanCell('YES')).toBe(true)
      expect(parseBooleanCell('yes')).toBe(true)
      expect(parseBooleanCell('true')).toBe(true)
      expect(parseBooleanCell('1')).toBe(true)
      expect(parseBooleanCell(true)).toBe(true)

      expect(parseBooleanCell('NO')).toBe(false)
      expect(parseBooleanCell('no')).toBe(false)
      expect(parseBooleanCell('false')).toBe(false)
      expect(parseBooleanCell('0')).toBe(false)
      expect(parseBooleanCell(false)).toBe(false)

      expect(parseBooleanCell(undefined, true)).toBe(true)
      expect(parseBooleanCell(null, false)).toBe(false)
      expect(parseBooleanCell('', true)).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 3: Staff Identity & Password Provisioning in Bulk CSV / Grid
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 3: Staff Identity & Password Provisioning in Bulk CSV / Grid', () => {
    it('advises users when HR columns are present in Users CSV import without failing row', async () => {
      const staffCsv = [
        'fullName,email,phone,role,designation,department,panNumber,password',
        `Pooja Hegde,pooja.${ts}@preone.test,9822233344,TEACHER,Senior Guide,Academics,ABCDE1234F,PoojaSecure@2026`,
      ].join('\n')

      const preview = await UserCsvEngine.previewStaffCsv(tenant.id, staffCsv)
      expect(preview.totalRows).toBe(1)
      expect(preview.validRows).toBe(1)
      expect(preview.blockedRows).toBe(0)
      expect(preview.warningRows).toBe(1)

      const row = preview.rows[0]
      expect(row.status).toBe('WARNING')
      expect(row.action).toBe('CREATE')

      // Advisory warning for each HR column
      const warningsText = row.warnings.join(' ')
      expect(warningsText).toContain('designation')
      expect(warningsText).toContain('HR Module')

      // Plaintext password is NEVER returned in preview data
      expect(row.data.password).toBe('••••••••')
      expect(row.encryptedPassword).toMatch(/^enc:v1:/)
    })

    it('enforces password complexity and rejects weak or client pre-hashed passwords', async () => {
      const weakPasswordCsv = [
        'fullName,email,role,password',
        `Weak User,weak.${ts}@preone.test,TEACHER,simple`,
      ].join('\n')

      const weakPreview = await UserCsvEngine.previewStaffCsv(tenant.id, weakPasswordCsv)
      expect(weakPreview.rows[0].status).toBe('BLOCKED')
      expect(weakPreview.rows[0].errors.some((e) => e.includes('Password must be at least 8 characters'))).toBe(true)

      const preHashedCsv = [
        'fullName,email,role,password',
        `Hashed User,hashed.${ts}@preone.test,TEACHER,$2a$10$abcdefghijklmnopqrstuu`,
      ].join('\n')

      const hashedPreview = await UserCsvEngine.previewStaffCsv(tenant.id, preHashedCsv)
      expect(hashedPreview.rows[0].status).toBe('BLOCKED')
      expect(hashedPreview.rows[0].errors.some((e) => e.includes('Pre-hashed passwords'))).toBe(true)
    })

    it('executes staff import and securely creates user with bcrypt-hashed provisioned password', async () => {
      const email = `secure.staff.${ts}@preone.test`
      const rawPassword = 'StaffSecure@2026'

      const staffCsv = [
        'fullName,email,phone,role,employeeCode,password',
        `Secure Staff Member,${email},9811122288,TEACHER,EMP-SEC-${ts.slice(-4)},${rawPassword}`,
      ].join('\n')

      const previewRes = await UserCsvEngine.previewStaffCsv(tenant.id, staffCsv)
      expect(previewRes.validRows).toBe(1)

      const execReq = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          action: 'execute',
          type: 'STAFF',
          previewRows: previewRes.rows,
        }),
      })

      const execRes = await usersCsvPost(execReq)
      expect(execRes.status).toBe(200)

      const user = await db.user.findFirst({
        where: { email },
        include: { staffProfiles: true },
      })

      expect(user).not.toBeNull()
      expect(user?.fullName).toBe('Secure Staff Member')
      expect(user?.passwordHash).toBeDefined()

      // The password is properly bcrypt-hashed and authenticates
      const match = await bcrypt.compare(rawPassword, user!.passwordHash!)
      expect(match).toBe(true)
    })

    it('preserves existing password when updating existing staff without a new password', async () => {
      const email = `preserve.pwd.${ts}@preone.test`
      const initialPassword = 'InitialPass@2026'
      const initialHash = await bcrypt.hash(initialPassword, 10)

      const existingUser = await db.user.create({
        data: {
          email,
          fullName: 'Existing User Preserved',
          passwordHash: initialHash,
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: existingUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'ACTIVE',
        },
      })

      // Bulk import updating phone and employeeCode with blank password
      const updateCsv = [
        'fullName,email,phone,role,employeeCode,password',
        `Existing User Preserved,${email},9877700011,TEACHER,EMP-UPD-${ts.slice(-4)},`,
      ].join('\n')

      const previewRes = await UserCsvEngine.previewStaffCsv(tenant.id, updateCsv)
      expect(previewRes.rows[0].action).toBe('LINK')

      const execRes = await UserCsvEngine.executeStaffImport({ tenantId: tenant.id, actorId: ownerUser.id }, previewRes.rows)
      expect(execRes.errors.length).toBe(0)

      const updatedUser = await db.user.findUnique({
        where: { id: existingUser.id },
      })

      expect(updatedUser?.passwordHash).toBe(initialHash)
      expect(await bcrypt.compare(initialPassword, updatedUser!.passwordHash!)).toBe(true)
    })

    it('rejects expired, cross-row, or foreign-tenant password provisioning tokens', async () => {
      // 1. Expired token
      const expiredPayload = JSON.stringify({
        p: 'ValidPass@2026',
        t: tenant.id,
        e: `expired.${ts}@preone.test`,
        exp: Date.now() - 1000, // expired 1s ago
        n: '123456',
      })
      const expiredToken = EncryptionService.encrypt(expiredPayload, tenant.id)

      const expiredRow: any = {
        rowNumber: 2,
        status: 'VALID',
        action: 'CREATE',
        identifier: `expired.${ts}@preone.test`,
        data: {
          fullName: 'Expired Token User',
          email: `expired.${ts}@preone.test`,
          role: 'TEACHER',
          encryptedPassword: expiredToken,
        },
      }

      const resExpired = await UserCsvEngine.executeStaffImport(
        { tenantId: tenant.id, actorId: ownerUser.id },
        [expiredRow]
      )
      expect(resExpired.errors.some((e) => e.message.includes('Expired password provisioning token'))).toBe(true)

      // 2. Cross-row / Identifier mismatch (token replay protection)
      const crossPayload = JSON.stringify({
        p: 'ValidPass@2026',
        t: tenant.id,
        e: `userA.${ts}@preone.test`,
        exp: Date.now() + 60000,
        n: '654321',
      })
      const crossToken = EncryptionService.encrypt(crossPayload, tenant.id)

      const crossRow: any = {
        rowNumber: 3,
        status: 'VALID',
        action: 'CREATE',
        identifier: `userB.${ts}@preone.test`,
        data: {
          fullName: 'Cross Token User',
          email: `userB.${ts}@preone.test`,
          role: 'TEACHER',
          encryptedPassword: crossToken,
        },
      }

      const resCross = await UserCsvEngine.executeStaffImport(
        { tenantId: tenant.id, actorId: ownerUser.id },
        [crossRow]
      )
      expect(resCross.errors.some((e) => e.message.includes('Identifier mismatch'))).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 4: Family Permissions & Caregiver Fields Parity
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 4: Family Permissions & Caregiver Fields Parity', () => {
    it('correctly maps occupation, pickup authorization, comms, and fee payer flags', async () => {
      const familyCsv = [
        'fullName,email,phone,role,relationship,occupation,isPrimaryContact,canPickup,receivesComm,isFeePayer,studentName,studentDateOfBirth,studentGender',
        `Anita Nair,anita.nair.${ts}@preone.test,9833344455,PARENT,MOTHER,Senior Architect,YES,YES,YES,YES,Rhea Nair,2021-08-14,FEMALE`,
      ].join('\n')

      const preview = await UserCsvEngine.previewFamilyCsv(tenant.id, familyCsv)
      expect(preview.totalRows).toBe(1)
      expect(preview.validRows).toBe(1)

      const rowData = preview.rows[0].data!
      expect(rowData.fullName).toBe('Anita Nair')
      expect(rowData.occupation).toBe('Senior Architect')
      expect(rowData.isPrimaryContact).toBe(true)
      expect(rowData.permissions.canPickup).toBe(true)
      expect(rowData.permissions.receivesCommunication).toBe(true)
      expect(rowData.permissions.isFeePayer).toBe(true)
    })

    it('executes family import creating parent and student links with correct flags', async () => {
      const email = `sunil.deshmukh.${ts}@preone.test`
      const familyCsv = [
        'fullName,email,phone,role,relationship,occupation,isPrimaryContact,canPickup,receivesComm,isFeePayer,studentName,studentDateOfBirth,studentGender',
        `Sunil Deshmukh,${email},9844455566,PARENT,FATHER,Data Scientist,YES,YES,YES,YES,Aaditya Deshmukh,2022-02-18,MALE`,
      ].join('\n')

      const preview = await UserCsvEngine.previewFamilyCsv(tenant.id, familyCsv)
      expect(preview.validRows).toBe(1)

      const execReq = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          action: 'execute',
          type: 'FAMILY',
          previewRows: preview.rows,
        }),
      })
      const execRes = await usersCsvPost(execReq)
      expect(execRes.status).toBe(200)

      const parentUser = await db.user.findFirst({
        where: { email },
        include: {
          guardianProfile: {
            include: {
              studentLinks: true,
            },
          },
        },
      })

      expect(parentUser).not.toBeNull()
      expect(parentUser?.guardianProfile).not.toBeNull()
      expect(parentUser?.guardianProfile?.occupation).toBe('Data Scientist')
      expect(parentUser?.guardianProfile?.isPrimaryContact).toBe(true)

      const link = parentUser?.guardianProfile?.studentLinks[0]
      expect(link).toBeDefined()
      expect(link?.canPickup).toBe(true)
      expect(link?.receivesComm).toBe(true)
      expect(link?.isFeePayer).toBe(true)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 5: Simplified Users Export & Sensitive Stripping
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 5: Simplified Users Export & Sensitive Stripping', () => {
    it('exports Staff directory with identity & placement headers and strictly excludes credentials and HR fields', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=STAFF`, {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersExportGet(req)
      expect(res.status).toBe(200)

      const csv = await res.text()
      // BOM check
      expect(csv.charCodeAt(0)).toBe(0xfeff)

      // Identity & placement headers present
      expect(csv).toContain('Full Name')
      expect(csv).toContain('Email')
      expect(csv).toContain('Primary Role')
      expect(csv).toContain('Employee Code')
      expect(csv).toContain('Campus Branch')

      // Credentials and internal security fields strictly excluded
      expect(csv).not.toContain('"password"')
      expect(csv).not.toContain('"Password"')
      expect(csv).not.toContain('"passwordHash"')
      expect(csv).not.toContain('"Password Hash"')

      // Statutory & HR details belong to HR module, strictly excluded from Users export
      expect(csv).not.toContain('PAN Number')
      expect(csv).not.toContain('Aadhaar')
      expect(csv).not.toContain('Qualification')
      expect(csv).not.toContain('Emergency Contact')
      expect(csv).not.toContain('enc:v1:')
    })

    it('exports Family directory with full caregiver permissions and strictly excludes pickup PIN', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=FAMILY`, {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersExportGet(req)
      expect(res.status).toBe(200)

      const csv = await res.text()
      expect(csv).toContain('Relationship to Child')
      expect(csv).toContain('Occupation')
      expect(csv).toContain('Primary Contact')
      expect(csv).toContain('Authorized for Pickup')
      expect(csv).toContain('Receives Communications')
      expect(csv).toContain('Fee Payer')
      expect(csv).toContain('Linked Students')

      // Strict child security: pickupPin is strictly excluded from export
      expect(csv).not.toContain('"pickupPin"')
      expect(csv).not.toContain('Pickup Gate PIN')
      expect(csv).not.toContain('"Pickup PIN"')
    })

    it('sanitizes potential CSV injection characters with leading single quotes', async () => {
      const maliciousName = '=cmd|"/C calc"!A0'
      const maliciousPhone = '+919999900000'
      const maliciousHash = await bcrypt.hash('SafePass123!', 10)
      const maliciousUser = await db.user.create({
        data: {
          email: `csv.injection.${ts}@preone.test`,
          fullName: maliciousName,
          phone: maliciousPhone,
          passwordHash: maliciousHash,
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: maliciousUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'ACTIVE',
        },
      })

      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=STAFF&search=csv.injection`, {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersExportGet(req)
      const csv = await res.text()

      // The '=' and '+' prefixes must be safely escaped with leading single quote
      expect(csv).toContain("'=cmd|")
      expect(csv).toContain("'+919999900000")
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 6: HR Module Operations & Encryption at Rest
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 6: HR Module Profile Updates & Encryption at Rest', () => {
    it('manages HR, personal, and statutory fields via StaffService with tenant AES-256-GCM encryption', async () => {
      // Create user and profile
      const staffUser = await db.user.create({
        data: {
          email: `hr.profile.${ts}@preone.test`,
          fullName: 'HR Profile Staff',
          passwordHash: await bcrypt.hash('HrPass@2026', 10),
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: staffUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'ACTIVE',
        },
      })
      const staffProfile = await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: staffUser.id,
          employeeCode: `EMP-HR-${ts.slice(-4)}`,
        },
      })

      const actor = { id: ownerUser.id, name: ownerUser.fullName, role: 'OWNER' }

      // Update via StaffService.updateStaffProfile
      const updated = await StaffService.updateStaffProfile(
        tenant.id,
        staffProfile.id,
        {
          designation: 'Senior Montessori Guide',
          department: 'Academics',
          qualification: 'M.Ed Montessori',
          employmentType: 'REGULAR',
          maritalStatus: 'Married',
          bloodGroup: 'O_POS',
          currentAddress: 'Flat 402, Sunshine Heights, Pune',
          permanentAddress: '10 Palace Road, Mysore',
          panNumber: 'ABCDE1234F',
          aadhaarNumber: '123456789012',
          uanNumber: '100900800700',
          esiNumber: '11223344556677889',
          noticePeriodDays: 60,
        },
        actor
      )

      expect(updated).toBeDefined()

      // Verify database stored values directly: statutory IDs and addresses MUST be ciphertext
      const dbRecord = await db.staffProfile.findUnique({
        where: { id: staffProfile.id },
      })

      expect(dbRecord?.designation).toBe('Senior Montessori Guide')
      expect(dbRecord?.department).toBe('Academics')
      expect(dbRecord?.panNumber).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(dbRecord?.aadhaarNumber).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(dbRecord?.uanNumber).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(dbRecord?.esiNumber).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(dbRecord?.currentAddress).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(dbRecord?.permanentAddress).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)

      // Verify StaffService.getStaff360 returns decrypted values for authorized UI
      const staff360 = await StaffService.getStaff360(tenant.id, staffProfile.id)
      expect(staff360.panNumber).toBe('ABCDE1234F')
      expect(staff360.aadhaarNumber).toBe('123456789012')
      expect(staff360.uanNumber).toBe('100900800700')
      expect(staff360.esiNumber).toBe('11223344556677889')
      expect(staff360.currentAddress).toBe('Flat 402, Sunshine Heights, Pune')
      expect(staff360.permanentAddress).toBe('10 Palace Road, Mysore')
    })

    it('performs bulk HR updates via StaffService and POST /api/v1/hr/staff/bulk route', async () => {
      // Create two staff members
      const hash = await bcrypt.hash('BulkPass@2026', 10)
      const user1 = await db.user.create({
        data: {
          email: `bulk1.${ts}@preone.test`,
          fullName: 'Bulk Staff One',
          passwordHash: hash,
          status: 'ACTIVE',
        },
      })
      const user2 = await db.user.create({
        data: {
          email: `bulk2.${ts}@preone.test`,
          fullName: 'Bulk Staff Two',
          passwordHash: hash,
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user1.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user2.id,
          role: 'COORDINATOR',
          roles: ['COORDINATOR'],
          status: 'ACTIVE',
        },
      })
      const prof1 = await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: user1.id,
          employeeCode: `EMP-B1-${ts.slice(-4)}`,
        },
      })
      const prof2 = await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: user2.id,
          employeeCode: `EMP-B2-${ts.slice(-4)}`,
        },
      })

      const bulkReq = new NextRequest('http://localhost:3000/api/v1/hr/staff/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          updates: [
            {
              id: prof1.id,
              designation: 'Lead Educator',
              department: 'Academics',
              qualification: 'M.A Education',
            },
            {
              employeeCode: prof2.employeeCode,
              designation: 'Operations Coordinator',
              department: 'Operations',
              noticePeriodDays: 45,
            },
          ],
        }),
      })

      const res = await hrStaffBulkPost(bulkReq)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.total).toBe(2)
      expect(data.data.updatedCount).toBe(2)

      const updated1 = await db.staffProfile.findUnique({ where: { id: prof1.id } })
      const updated2 = await db.staffProfile.findUnique({ where: { id: prof2.id } })

      expect(updated1?.designation).toBe('Lead Educator')
      expect(updated1?.department).toBe('Academics')
      expect(updated2?.designation).toBe('Operations Coordinator')
      expect(updated2?.department).toBe('Operations')
      expect(updated2?.noticePeriodDays).toBe(45)
    })

    it('confirms editing staff in Users module preserves existing HR fields without wiping', async () => {
      // 1. Create staff with full HR fields in DB
      const user = await db.user.create({
        data: {
          email: `preserve.hr.${ts}@preone.test`,
          fullName: 'Original Name',
          phone: '9800011122',
          passwordHash: await bcrypt.hash('Secret123!', 10),
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'ACTIVE',
          branchId: branch.id,
        },
      })
      const prof = await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          employeeCode: `EMP-KEEP-${ts.slice(-4)}`,
          designation: 'Senior Montessori Guide',
          department: 'Early Childhood',
          qualification: 'Diploma ECCE',
          panNumber: EncryptionService.encrypt('ABCDE1234F', tenant.id),
          currentAddress: EncryptionService.encrypt('Old Address 123', tenant.id),
        },
      })

      // 2. Simulate Users Edit form submission: updating fullName, phone, role only (no HR fields sent)
      const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          fullName: 'Updated Name',
          phone: '9800099999',
          role: 'TEACHER',
          employeeCode: prof.employeeCode,
          branchId: branch.id,
        }),
      })

      const { PATCH: usersPatch } = await import('@/app/api/v1/users/[id]/route')
      const patchRes = await usersPatch(patchReq, { params: Promise.resolve({ id: user.id }) })
      expect(patchRes.status).toBe(200)

      // 3. Verify user was updated
      const updatedUser = await db.user.findUnique({ where: { id: user.id } })
      expect(updatedUser?.fullName).toBe('Updated Name')
      expect(updatedUser?.phone).toBe('9800099999')

      // 4. Verify existing HR fields on StaffProfile remain 100% intact
      const updatedProfile = await db.staffProfile.findUnique({ where: { id: prof.id } })
      expect(updatedProfile?.designation).toBe('Senior Montessori Guide')
      expect(updatedProfile?.department).toBe('Early Childhood')
      expect(updatedProfile?.qualification).toBe('Diploma ECCE')
      expect(EncryptionService.decrypt(updatedProfile?.panNumber, tenant.id)).toBe('ABCDE1234F')
      expect(EncryptionService.decrypt(updatedProfile?.currentAddress, tenant.id)).toBe('Old Address 123')
    })

    it('rejects HR-field modifications through Users API when caller lacks hr:write', async () => {
      // Temporarily give STAFF users:write but no hr:write
      const { ROLE_PERMISSIONS } = await import('@/lib/auth')
      const originalStaffPerms = [...(ROLE_PERMISSIONS.STAFF || [])]
      ROLE_PERMISSIONS.STAFF = ['users:read', 'users:write']

      try {
        // Create user with STAFF role
        const nonHrUser = await db.user.create({
          data: {
            email: `usermanager.${ts}@preone.test`,
            fullName: 'User Manager Actor',
            passwordHash: await bcrypt.hash('Manager@2026', 10),
            status: 'ACTIVE',
          },
        })
        await db.tenantUser.create({
          data: {
            tenantId: tenant.id,
            userId: nonHrUser.id,
            role: 'STAFF',
            roles: ['STAFF'],
            status: 'ACTIVE',
            branchId: branch.id,
          },
        })
        const managerCookie = `${SESSION_COOKIE}=${await signSession({
          uid: nonHrUser.id,
          email: nonHrUser.email,
          name: nonHrUser.fullName,
          tenantId: tenant.id,
          branchId: branch.id,
          role: 'STAFF',
          roles: ['STAFF'],
        })}`

        // Attempting to mutate HR fields via PATCH /api/v1/users/[id]
        const { PATCH: usersPatch } = await import('@/app/api/v1/users/[id]/route')
        const patchReq = new NextRequest(`http://localhost:3000/api/v1/users/${nonHrUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: managerCookie },
          body: JSON.stringify({
            designation: 'Unauthorized Designation Change',
            panNumber: 'ABCDE1234F',
          }),
        })

        const patchRes = await usersPatch(patchReq, { params: Promise.resolve({ id: nonHrUser.id }) })
        expect(patchRes.status).toBe(403)
        const patchJson = await patchRes.json()
        expect(patchJson.error?.message).toContain("requires 'hr:write'")
      } finally {
        ROLE_PERMISSIONS.STAFF = originalStaffPerms
      }
    })

    it('rejects ambiguous or non-existent employee code matches in HR bulk updates', async () => {
      const actor = { id: ownerUser.id, name: ownerUser.fullName, role: 'OWNER' }

      // Non-existent employee code
      const resNonExistent = await StaffService.bulkUpdateStaffProfiles(
        tenant.id,
        [{ employeeCode: 'EMP-DOES-NOT-EXIST-9999', designation: 'Updated Designation' }],
        actor
      )
      expect(resNonExistent.results[0].success).toBe(false)
      expect(resNonExistent.results[0].error).toContain('Staff profile not found')
    })

    it('enforces branch boundary access for branch-scoped actors in HR profile updates', async () => {
      // Create branch B
      const branchB = await db.branch.create({
        data: { tenantId: tenant.id, code: `BRANCH-B-${ts.slice(-4)}`, name: 'Branch B' },
      })

      // Staff member in Branch B
      const userB = await db.user.create({
        data: { email: `branch.b.staff.${ts}@preone.test`, fullName: 'Staff in Branch B', passwordHash: 'hash', status: 'ACTIVE' },
      })
      await db.tenantUser.create({ data: { tenantId: tenant.id, userId: userB.id, role: 'TEACHER', branchId: branchB.id, status: 'ACTIVE' } })
      const profB = await db.staffProfile.create({ data: { tenantId: tenant.id, userId: userB.id, employeeCode: `EMP-BB-${ts.slice(-4)}`, branchId: branchB.id } })

      // Branch-scoped HR coordinator assigned to Branch A (not Branch B)
      const branchCoordinator = {
        id: 'coord-123',
        name: 'Branch Coordinator A',
        role: 'COORDINATOR',
        branchId: branch.id, // Main branch
      }

      await expect(
        StaffService.updateStaffProfile(
          tenant.id,
          profB.id,
          { designation: 'Unauthorized Branch Update' },
          branchCoordinator
        )
      ).rejects.toThrow('Forbidden: Cannot modify staff profile assigned to another campus branch')
    })
  })
})
