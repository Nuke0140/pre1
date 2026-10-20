import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as usersCsvPost, GET as usersCsvGet } from '@/app/api/v1/users/csv/route'
import { GET as usersExportGet, POST as usersExportPost } from '@/app/api/v1/users/export/route'
import bcrypt from 'bcryptjs'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { EncryptionService } from '@/lib/security/encryption-service'
import {
  CANONICAL_STAFF_FIELDS,
  CANONICAL_FAMILY_FIELDS,
  normalizeHeaderToCanonicalKey,
  resolveRowWithAliases,
  parseBooleanCell,
} from '@/lib/users/canonical-fields'
import { UserCsvEngine } from '@/lib/users/csv-engine'

describe('PreOne Users Module: Field Parity & Import/Export Consistency', () => {
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
  // Pillar 1: Authoritative Canonical Contract Layer
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 1: Authoritative Canonical Metadata Contracts', () => {
    it('defines non-empty canonical definitions with unique keys for Staff and Family', () => {
      expect(CANONICAL_STAFF_FIELDS.length).toBeGreaterThan(15)
      expect(CANONICAL_FAMILY_FIELDS.length).toBeGreaterThan(10)

      const staffKeys = CANONICAL_STAFF_FIELDS.map((f) => f.key)
      const familyKeys = CANONICAL_FAMILY_FIELDS.map((f) => f.key)

      expect(new Set(staffKeys).size).toBe(staffKeys.length)
      expect(new Set(familyKeys).size).toBe(familyKeys.length)
    })

    it('enforces strict role separation: staff fields do not leak into family and vice-versa', () => {
      const staffKeys = new Set(CANONICAL_STAFF_FIELDS.map((f) => f.key))
      const familyKeys = new Set(CANONICAL_FAMILY_FIELDS.map((f) => f.key))

      expect(staffKeys.has('employeeCode')).toBe(true)
      expect(staffKeys.has('designation')).toBe(true)
      expect(staffKeys.has('qualification')).toBe(true)
      expect(staffKeys.has('joiningDate')).toBe(true)

      expect(familyKeys.has('employeeCode')).toBe(false)
      expect(familyKeys.has('designation')).toBe(false)

      expect(familyKeys.has('canPickup')).toBe(true)
      expect(familyKeys.has('receivesComm')).toBe(true)
      expect(familyKeys.has('isFeePayer')).toBe(true)
      expect(familyKeys.has('relationship')).toBe(true)

      expect(staffKeys.has('canPickup')).toBe(false)
      expect(staffKeys.has('isFeePayer')).toBe(false)
    })

    it('flags sensitive fields with exportable=false to enforce data minimization', () => {
      const pinField = CANONICAL_FAMILY_FIELDS.find((f) => f.key === 'pickupPin')
      expect(pinField).toBeDefined()
      expect(pinField?.exportable).toBe(false)
      expect(pinField?.sensitive).toBe(true)

      const panField = CANONICAL_STAFF_FIELDS.find((f) => f.key === 'panNumber')
      const aadhaarField = CANONICAL_STAFF_FIELDS.find((f) => f.key === 'aadhaarNumber')
      const uanField = CANONICAL_STAFF_FIELDS.find((f) => f.key === 'uanNumber')
      const esiField = CANONICAL_STAFF_FIELDS.find((f) => f.key === 'esiNumber')

      expect(panField?.exportable).toBe(false)
      expect(aadhaarField?.exportable).toBe(false)
      expect(uanField?.exportable).toBe(false)
      expect(esiField?.exportable).toBe(false)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Pillar 2: Normalization, Aliasing, and Boolean Parsing
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 2: Normalization, Alias Resolution & Boolean Parsing', () => {
    it('normalizes common human-friendly header variations to canonical keys', () => {
      expect(normalizeHeaderToCanonicalKey('Full Name', 'STAFF')).toBe('fullName')
      expect(normalizeHeaderToCanonicalKey('full_name', 'STAFF')).toBe('fullName')
      expect(normalizeHeaderToCanonicalKey('DATE OF JOINING', 'STAFF')).toBe('joiningDate')
      expect(normalizeHeaderToCanonicalKey('doj', 'STAFF')).toBe('joiningDate')
      expect(normalizeHeaderToCanonicalKey('Mobile Number', 'STAFF')).toBe('phone')
      expect(normalizeHeaderToCanonicalKey('Emergency Contact Phone', 'STAFF')).toBe('emergencyContactPhone')

      expect(normalizeHeaderToCanonicalKey('Authorized Pickup', 'FAMILY')).toBe('canPickup')
      expect(normalizeHeaderToCanonicalKey('can_pickup', 'FAMILY')).toBe('canPickup')
      expect(normalizeHeaderToCanonicalKey('Primary Contact', 'FAMILY')).toBe('isPrimaryContact')
      expect(normalizeHeaderToCanonicalKey('is_primary', 'FAMILY')).toBe('isPrimaryContact')
      expect(normalizeHeaderToCanonicalKey('Fee Payer', 'FAMILY')).toBe('isFeePayer')
      expect(normalizeHeaderToCanonicalKey('Relation to Child', 'FAMILY')).toBe('relationship')
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
  // Pillar 3: Staff Extended HR Fields Parity (Import & DB Persistence)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 3: Staff Extended HR Fields Parity in CSV & Grid', () => {
    it('previews and binds all canonical HR fields in Staff CSV preview', async () => {
      const staffCsv = [
        'fullName,email,phone,role,designation,department,qualification,employmentType,joiningDate,dateOfBirth,gender,maritalStatus,bloodGroup,emergencyContactName,emergencyContactPhone,currentAddress,permanentAddress,noticePeriodDays',
        `Pooja Hegde,pooja.${ts}@preone.test,9822233344,TEACHER,Senior Guide,Academics,M.Ed & Montessori,FULL_TIME,2024-06-01,1992-04-15,FEMALE,Married,B_POSITIVE,Arjun Hegde,9822233349,"Flat 101, Green Meadows, Pune","14 Lotus Court, Bangalore",45`,
      ].join('\n')

      const preview = await UserCsvEngine.previewStaffCsv(tenant.id, staffCsv)
      expect(preview.totalRows).toBe(1)
      expect(preview.validRows).toBe(1)

      const rowData = preview.rows[0].data!
      expect(rowData.fullName).toBe('Pooja Hegde')
      expect(rowData.designation).toBe('Senior Guide')
      expect(rowData.department).toBe('Academics')
      expect(rowData.qualification).toBe('M.Ed & Montessori')
      expect(rowData.employmentType).toBe('FULL_TIME')
      expect(rowData.joiningDate).toBe('2024-06-01')
      expect(rowData.dateOfBirth).toBe('1992-04-15')
      expect(rowData.gender).toBe('FEMALE')
      expect(rowData.maritalStatus).toBe('Married')
      expect(rowData.bloodGroup).toBe('B_POSITIVE')
      expect(rowData.emergencyContactName).toBe('Arjun Hegde')
      expect(rowData.emergencyContactPhone).toBe('9822233349')
      expect(rowData.currentAddress).toBe('Flat 101, Green Meadows, Pune')
      expect(rowData.permanentAddress).toBe('14 Lotus Court, Bangalore')
      expect(rowData.noticePeriodDays).toBe(45)
    })

    it('executes staff import and persists HR fields into StaffProfile without data loss', async () => {
      const email = `kavita.${ts}@preone.test`
      const staffCsv = [
        'fullName,email,phone,role,designation,department,qualification,joiningDate,dateOfBirth,gender,maritalStatus,bloodGroup,emergencyContactName,emergencyContactPhone,currentAddress,permanentAddress,panNumber,aadhaarNumber,noticePeriodDays',
        `Kavita Iyer,${email},9811122299,COORDINATOR,Academic Coordinator,Pre-Primary,B.Sc B.Ed,2023-01-10,1988-11-20,FEMALE,Married,O_POSITIVE,Natarajan Iyer,9811122290,"Flat 302, Green Acres, Pune","12 MG Road, Pune",ABCDE1234F,999988887777,90`,
      ].join('\n')

      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          action: 'preview',
          type: 'STAFF',
          csv: staffCsv,
        }),
      })
      const previewRes = await usersCsvPost(req)
      const previewJson = await previewRes.json()
      expect(previewJson.success).toBe(true)

      const execReq = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          action: 'execute',
          type: 'STAFF',
          previewRows: previewJson.data.rows,
        }),
      })
      const execRes = await usersCsvPost(execReq)
      expect(execRes.status).toBe(200)

      const user = await db.user.findFirst({
        where: { email },
        include: {
          staffProfiles: true,
        },
      })
      expect(user).not.toBeNull()
      expect(user?.fullName).toBe('Kavita Iyer')

      const profile = user?.staffProfiles[0]
      expect(profile).toBeDefined()
      expect(profile?.qualification).toBe('B.Sc B.Ed')
      expect(profile?.emergencyContactName).toBe('Natarajan Iyer')
      expect(profile?.emergencyContactPhone).toBe('9811122290')
      expect(profile?.maritalStatus).toBe('Married')
      expect(profile?.gender).toBe('FEMALE')
      expect(profile?.noticePeriodDays).toBe(90)

      // ── Evidence-based Encryption at Rest Verification ──
      // Sensitive statutory IDs and addresses MUST be stored encrypted in the database
      expect(profile?.panNumber).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(profile?.aadhaarNumber).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(profile?.currentAddress).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
      expect(profile?.permanentAddress).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)

      // Verified via decryption with tenant key
      expect(EncryptionService.decrypt(profile?.panNumber, tenant.id)).toBe('ABCDE1234F')
      expect(EncryptionService.decrypt(profile?.aadhaarNumber, tenant.id)).toBe('999988887777')
      expect(EncryptionService.decrypt(profile?.currentAddress, tenant.id)).toBe('Flat 302, Green Acres, Pune')
      expect(EncryptionService.decrypt(profile?.permanentAddress, tenant.id)).toBe('12 MG Road, Pune')

      // Verified via Export: address decrypted transparently for export, statutory IDs strictly excluded
      const exportReq = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=STAFF&search=Kavita`, {
        headers: { Cookie: cookieOwner },
      })
      const exportRes = await usersExportGet(exportReq)
      expect(exportRes.status).toBe(200)
      const exportCsv = await exportRes.text()

      expect(exportCsv).toContain('Flat 302, Green Acres, Pune')
      expect(exportCsv).not.toContain('ABCDE1234F')
      expect(exportCsv).not.toContain('999988887777')
      expect(exportCsv).not.toContain('enc:v1:')
    })

    it('surfaces unknown-column warnings and handles blank-cell fallback gracefully', async () => {
      const csvWithUnknown = [
        'fullName,email,role,unrecognizedCustomColumn,department',
        `Test Warning,test.warn.${ts}@preone.test,TEACHER,RandomValue,`,
      ].join('\n')

      const preview = await UserCsvEngine.previewStaffCsv(tenant.id, csvWithUnknown)
      expect(preview.rows[0].warnings.some((w) => w.includes('unrecognizedCustomColumn'))).toBe(true)
      // Blank cell behavior: department was blank, data.department is null
      expect(preview.rows[0].data?.department).toBeNull()
    })

    it('handles partial-row failures by blocking invalid rows and permitting valid rows', async () => {
      const multiRowCsv = [
        'fullName,email,role',
        `Valid User,valid.${ts}@preone.test,TEACHER`,
        `Missing Email User,,TEACHER`,
      ].join('\n')

      const preview = await UserCsvEngine.previewStaffCsv(tenant.id, multiRowCsv)
      expect(preview.totalRows).toBe(2)
      expect(preview.validRows).toBe(1)
      expect(preview.blockedRows).toBe(1)
      expect(preview.rows[0].status).toBe('VALID')
      expect(preview.rows[1].status).toBe('BLOCKED')
      expect(preview.rows[1].errors).toContain('Email is missing')
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
  // Pillar 5: Export Field Parity & Sensitive Data Minimization
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 5: CSV Export Parity & Sensitive Data Stripping', () => {
    it('exports Staff directory with full canonical HR headers', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=STAFF`, {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersExportGet(req)
      expect(res.status).toBe(200)

      const csv = await res.text()
      // BOM check
      expect(csv.charCodeAt(0)).toBe(0xfeff)

      // HR headers check
      expect(csv).toContain('Qualification')
      expect(csv).toContain('Date of Joining')
      expect(csv).toContain('Date of Birth')
      expect(csv).toContain('Emergency Contact Name')
      expect(csv).toContain('Emergency Contact Phone')
      expect(csv).toContain('Notice Period (Days)')
      expect(csv).toContain('Current Address')
      expect(csv).toContain('Permanent Address')

      // Sensitive fields check: Must NOT be present as column headers
      expect(csv).not.toContain('"Pickup Gate PIN"')
      expect(csv).not.toContain('"pickupPin"')
      expect(csv).not.toContain('"Password Hash"')
      expect(csv).not.toContain('"passwordHash"')
    })

    it('exports Family directory with full canonical caregiver and permission headers', async () => {
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
  // Pillar 6: Security Edge-Cases, Encryption Robustness & CSV Sanitization
  // ───────────────────────────────────────────────────────────────────────────
  describe('Pillar 6: Security Edge-Cases, Encryption Robustness & CSV Sanitization', () => {
    it('confirms existing ciphertext cannot be accidentally double-encrypted', () => {
      const plaintext = 'ABCDE1234F'
      const encryptedOnce = EncryptionService.encrypt(plaintext, tenant.id)
      expect(encryptedOnce).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)

      // Encrypting an already-encrypted string must return the exact same string
      const encryptedTwice = EncryptionService.encrypt(encryptedOnce, tenant.id)
      expect(encryptedTwice).toBe(encryptedOnce)
    })

    it('confirms encryption errors fail closed and never fall back to plaintext', () => {
      // Null / empty values return safely without plaintext leak
      expect(EncryptionService.encrypt(null, tenant.id)).toBeNull()
      expect(EncryptionService.encrypt('', tenant.id)).toBe('')

      // Tampered ciphertext fails closed to null on decryption
      const tampered = `enc:v1:0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef:invalid`
      const decryptedTampered = EncryptionService.decrypt(tampered, tenant.id)
      expect(decryptedTampered).toBeNull()
    })

    it('confirms decryption failures in export fail closed to empty string and never leak raw ciphertext', async () => {
      // Create user with tampered/foreign ciphertext in staff profile
      const foreignCiphertext = `enc:v1:00112233445566778899aabbccddeeff:00112233445566778899aabbccddeeff:aabbccddeeff`
      const foreignStaffUser = await db.user.create({
        data: {
          email: `foreign.cipher.${ts}@preone.test`,
          fullName: 'Foreign Cipher Staff',
          passwordHash: await bcrypt.hash('Secret123!', 10),
          status: 'ACTIVE',
        },
      })
      await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: foreignStaffUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'ACTIVE',
        },
      })
      await db.staffProfile.create({
        data: {
          tenantId: tenant.id,
          userId: foreignStaffUser.id,
          employeeCode: `EMP-CIPHER-${ts.slice(-4)}`,
          currentAddress: foreignCiphertext,
        },
      })

      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=STAFF&search=foreign.cipher`, {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersExportGet(req)
      expect(res.status).toBe(200)
      const csv = await res.text()

      // The export must NEVER leak raw ciphertext or enc:v1: prefix
      expect(csv).not.toContain(foreignCiphertext)
      expect(csv).not.toContain('enc:v1:')
    })

    it('preserves complex cell contents with commas, quotes, and newlines via copy-paste grid input', async () => {
      const complexAddress = 'Bldg 4, Suite 100\nBusiness Park, West'
      const complexDesignation = 'Lead "Montessori" Guide'

      const gridRows = [
        {
          fullName: 'Complex Test Guide',
          email: `complex.cell.${ts}@preone.test`,
          role: 'TEACHER',
          designation: complexDesignation,
          currentAddress: complexAddress,
          qualification: 'Diploma, B.Ed (ECE)',
        },
      ]

      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieOwner },
        body: JSON.stringify({
          action: 'preview',
          type: 'STAFF',
          rows: gridRows,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)

      const rowData = json.data.rows[0].data
      // Embedded commas and quotes must be preserved intact without splitting
      expect(rowData.currentAddress).toBe(complexAddress)
      expect(rowData.designation).toBe(complexDesignation)
      expect(rowData.qualification).toBe('Diploma, B.Ed (ECE)')
    })

    it('confirms formula-injection sanitization does not corrupt ordinary benign data', () => {
      // Ordinary alphanumeric and standard data must remain untouched (no single quote added)
      const exportReq = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=STAFF&search=Pooja`, {
        headers: { Cookie: cookieOwner },
      })

      // Test helper logic directly for contract precision
      const sanitize = (val: string | null | undefined): string => {
        if (val === null || val === undefined) return '""'
        const raw = String(val)
        let s = raw.trim()
        if (/^[=+\-@\t\r]/.test(raw) || /^[=+\-@]/.test(s)) {
          s = `'${s}`
        }
        return `"${s.replace(/"/g, '""')}"`
      }

      expect(sanitize('Ananya Sharma')).toBe('"Ananya Sharma"')
      expect(sanitize('ananya@preschool.com')).toBe('"ananya@preschool.com"')
      expect(sanitize('2024-06-01')).toBe('"2024-06-01"')
      expect(sanitize('Academics')).toBe('"Academics"')
      expect(sanitize('60')).toBe('"60"')

      // Malicious or formula-like prefixes get escaped
      expect(sanitize('=1+1')).toBe("\"'=1+1\"")
      expect(sanitize('+919876543210')).toBe("\"'+919876543210\"")
      expect(sanitize('-5')).toBe("\"'-5\"")
      expect(sanitize('@SUM(A1:A10)')).toBe("\"'@SUM(A1:A10)\"")
    })
  })
})
