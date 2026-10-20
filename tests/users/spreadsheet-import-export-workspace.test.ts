import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST as usersCsvPost, GET as usersCsvGet } from '@/app/api/v1/users/csv/route'
import { GET as usersExportGet } from '@/app/api/v1/users/export/route'
import bcrypt from 'bcryptjs'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('Track B: Users Import/Export Workspace & Spreadsheet Consolidation', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let ownerUser: any
  let cookieOwner: string

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        code: `WS-${ts.slice(-5)}`,
        name: `Workspace Academy ${ts}`,
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

    const passwordHash = await bcrypt.hash('SecurePassword@123', 10)
    ownerUser = await db.user.create({
      data: {
        email: `ws.owner.${ts}@preone.test`,
        username: `ws_owner_${ts}`,
        fullName: 'Workspace Owner',
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

  describe('1. Unified Template Downloads for Staff and Family', () => {
    it('downloads staff template CSV with correct headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv?template=staff', {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersCsvGet(req)
      expect(res.status).toBe(200)
      const disposition = res.headers.get('Content-Disposition')
      expect(disposition).toContain('preone_staff_template.csv')
      const csv = await res.text()
      expect(csv).toContain('fullName')
      expect(csv).toContain('email')
      expect(csv).toContain('role')
    })

    it('downloads family template CSV with correct headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv?template=family', {
        headers: { Cookie: cookieOwner },
      })
      const res = await usersCsvGet(req)
      expect(res.status).toBe(200)
      const disposition = res.headers.get('Content-Disposition')
      expect(disposition).toContain('preone_family_template.csv')
      const csv = await res.text()
      expect(csv).toContain('name')
      expect(csv).toContain('email')
      expect(csv).toContain('relationship')
    })
  })

  describe('2. Staff Import Flow via Workspace (Preview & Execution)', () => {
    const staffCsv = [
      'fullName,email,phone,role,department',
      `Rahul Verma,rahul.verma.${ts}@preone.test,9811122233,TEACHER,Academics`,
      `Sneha Kulkarni,sneha.k.${ts}@preone.test,9811122244,ACCOUNTS,Finance`,
    ].join('\n')

    it('previews staff import rows with validation metadata', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'preview',
          type: 'STAFF',
          csv: staffCsv,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.totalRows).toBe(2)
      expect(json.data.validRows).toBe(2)
    })

    it('executes staff import and persists members to the database', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'execute',
          type: 'STAFF',
          csv: staffCsv,
          async: false,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)

      // Confirm user was created
      const user = await db.user.findFirst({
        where: { email: `rahul.verma.${ts}@preone.test` },
      })
      expect(user).not.toBeNull()
      expect(user?.fullName).toBe('Rahul Verma')
    })
  })

  describe('3. Family Import Flow via Workspace (Preview & Execution)', () => {
    const familyCsv = [
      'fullName,email,phone,role,relationship,studentName,studentDateOfBirth,studentGender',
      `Deepak Rao,deepak.rao.${ts}@preone.test,9877711122,PARENT,FATHER,Aarav Rao,2021-05-10,MALE`,
    ].join('\n')

    it('previews family import rows with validation status', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'preview',
          type: 'FAMILY',
          csv: familyCsv,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.totalRows).toBe(1)
      expect(json.data.validRows).toBe(1)
    })

    it('executes family import creating parent and guardian profile', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieOwner,
        },
        body: JSON.stringify({
          action: 'execute',
          type: 'FAMILY',
          csv: familyCsv,
          async: false,
        }),
      })

      const res = await usersCsvPost(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)

      const familyUser = await db.user.findFirst({
        where: { email: `deepak.rao.${ts}@preone.test` },
      })
      expect(familyUser).not.toBeNull()
      expect(familyUser?.fullName).toBe('Deepak Rao')
    })
  })

  describe('4. Export Controls, Sensitive Field Stripping & Formula Escaping', () => {
    it('exports staff directory respecting tenant and userType filters', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/export?userType=STAFF', {
        headers: { Cookie: cookieOwner },
      })

      const res = await usersExportGet(req)
      expect(res.status).toBe(200)
      const csv = await res.text()

      // Header row
      expect(csv).toContain('Full Name')
      expect(csv).toContain('Email')
      expect(csv).toContain('Role')

      // Sensitive fields must NOT exist in export
      expect(csv).not.toContain('passwordHash')
      expect(csv).not.toContain('password')
      expect(csv).not.toContain('tokenHash')
      expect(csv).not.toContain('mfaSecret')
      expect(csv).not.toContain('pickupPin')

      // Contains imported staff member
      expect(csv).toContain('Rahul Verma')
    })

    it('exports family directory data', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/export?userType=PARENT', {
        headers: { Cookie: cookieOwner },
      })

      const res = await usersExportGet(req)
      expect(res.status).toBe(200)
      const csv = await res.text()

      expect(csv).toContain('Full Name')
      expect(csv).toContain('Deepak Rao')
      // No sensitive tokens
      expect(csv).not.toContain('passwordHash')
    })

    it('sanitizes formula injection characters with leading single quote', async () => {
      // Create user with formula attack name
      const formulaUser = await db.user.create({
        data: {
          email: `formula.user.${ts}@preone.test`,
          fullName: '=cmd|’ /C calc’!A0',
          passwordHash: '$2b$10$...',
          status: 'ACTIVE',
          memberships: {
            create: {
              tenantId: tenant.id,
              role: 'TEACHER',
              status: 'ACTIVE',
            },
          },
        },
      })

      const req = new NextRequest('http://localhost:3000/api/v1/users/export?userType=STAFF', {
        headers: { Cookie: cookieOwner },
      })

      const res = await usersExportGet(req)
      expect(res.status).toBe(200)
      const csv = await res.text()

      // The equal sign must be prepended with a single quote to neutralize formula injection
      expect(csv).toContain(`"'=cmd|’ /C calc’!A0"`)
    })
  })
})
