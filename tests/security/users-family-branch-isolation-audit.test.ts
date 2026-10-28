import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as getGuardians } from '@/app/api/v1/users/guardians/route'
import { POST as linkFamilyMember } from '@/app/api/v1/users/[id]/family/route'
import { DELETE as deleteUser } from '@/app/api/v1/users/[id]/route'
import { GET as getExport } from '@/app/api/v1/users/export/route'
import { UserCsvEngine } from '@/lib/users/csv-engine'
import { FamilyUserService } from '@/lib/users/family-user-service'

describe('Users Module Completion Audit: Staff vs Family Branch Isolation & Authorization', () => {
  const ts = Date.now()
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB1: any

  let ownerA: any
  let principalA: any
  let staffA1: any
  let staffA2: any

  let studentA1: any
  let studentA2: any
  let studentB1: any

  let guardianA1: any
  let guardianA2: any
  let guardianB1: any

  let tokenOwnerA: string
  let tokenPrincipalA: string
  let tokenStaffA1: string
  let tokenStaffA2: string

  beforeAll(async () => {
    // 1. Create Tenant A with 2 branches
    tenantA = await db.tenant.create({
      data: {
        name: `Tenant A (${ts})`,
        code: `TA${ts.toString().slice(-6)}`,
      },
    })

    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Campus Alpha (${ts})`,
        code: `ALPHA-${ts}`,
        isMain: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: `Campus Beta (${ts})`,
        code: `BETA-${ts}`,
        isMain: false,
      },
    })

    // 2. Create Tenant B with 1 branch
    tenantB = await db.tenant.create({
      data: {
        name: `Tenant B (${ts})`,
        code: `TB${ts.toString().slice(-6)}`,
      },
    })

    branchB1 = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: `Campus Gamma (${ts})`,
        code: `GAMMA-${ts}`,
        isMain: true,
      },
    })

    const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyz123456'

    // 3. Create Users & Memberships
    ownerA = await db.user.create({
      data: {
        fullName: 'Owner A',
        email: `owner.a.${ts}@preone.test`,
        phone: `+9198000${ts.toString().slice(-5)}`,
        passwordHash: dummyHash,
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'OWNER',
            roles: ['OWNER'],
            status: 'ACTIVE',
          },
        },
      },
    })

    principalA = await db.user.create({
      data: {
        fullName: 'Principal A',
        email: `principal.a.${ts}@preone.test`,
        phone: `+9198111${ts.toString().slice(-5)}`,
        passwordHash: dummyHash,
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'PRINCIPAL',
            roles: ['PRINCIPAL'],
            branchId: branchA1.id,
            status: 'ACTIVE',
          },
        },
      },
    })

    staffA1 = await db.user.create({
      data: {
        fullName: 'Staff Alpha (Branch A1)',
        email: `staff.a1.${ts}@preone.test`,
        phone: `+9198222${ts.toString().slice(-5)}`,
        passwordHash: dummyHash,
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'STAFF',
            roles: ['STAFF'],
            branchId: branchA1.id,
            status: 'ACTIVE',
          },
        },
      },
    })

    staffA2 = await db.user.create({
      data: {
        fullName: 'Staff Beta (Branch A2)',
        email: `staff.a2.${ts}@preone.test`,
        phone: `+9198333${ts.toString().slice(-5)}`,
        passwordHash: dummyHash,
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'STAFF',
            roles: ['STAFF'],
            branchId: branchA2.id,
            status: 'ACTIVE',
          },
        },
      },
    })

    // 4. Create Students in Tenant A & Tenant B
    studentA1 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        admissionNo: `ADM-A1-${ts}`,
        firstName: 'Child',
        lastName: 'Alpha',
        dob: new Date('2020-01-01'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    studentA2 = await db.student.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA2.id,
        admissionNo: `ADM-A2-${ts}`,
        firstName: 'Child',
        lastName: 'Beta',
        dob: new Date('2021-02-02'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    studentB1 = await db.student.create({
      data: {
        tenantId: tenantB.id,
        branchId: branchB1.id,
        admissionNo: `ADM-B1-${ts}`,
        firstName: 'Child',
        lastName: 'Gamma',
        dob: new Date('2020-05-05'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // 5. Create Guardians & Link to students
    guardianA1 = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Guardian Alpha',
        phone: `+9198444${ts.toString().slice(-5)}`,
        email: `guardian.a1.${ts}@preone.test`,
        relationship: 'FATHER',
        isPrimaryContact: true,
        studentLinks: {
          create: {
            studentId: studentA1.id,
            relationship: 'FATHER',
            isPrimary: true,
            canPickup: true,
          },
        },
      },
    })

    guardianA2 = await db.guardian.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Guardian Beta',
        phone: `+9198555${ts.toString().slice(-5)}`,
        email: `guardian.a2.${ts}@preone.test`,
        relationship: 'MOTHER',
        isPrimaryContact: true,
        studentLinks: {
          create: {
            studentId: studentA2.id,
            relationship: 'MOTHER',
            isPrimary: true,
            canPickup: true,
          },
        },
      },
    })

    guardianB1 = await db.guardian.create({
      data: {
        tenantId: tenantB.id,
        fullName: 'Guardian Gamma (Tenant B)',
        phone: `+9198666${ts.toString().slice(-5)}`,
        email: `guardian.b1.${ts}@preone.test`,
        relationship: 'FATHER',
        isPrimaryContact: true,
        studentLinks: {
          create: {
            studentId: studentB1.id,
            relationship: 'FATHER',
            isPrimary: true,
            canPickup: true,
          },
        },
      },
    })

    // 6. Sign JWT tokens
    tokenOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      name: ownerA.fullName,
      tenantId: tenantA.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    tokenPrincipalA = await signSession({
      uid: principalA.id,
      email: principalA.email,
      name: principalA.fullName,
      tenantId: tenantA.id,
      branchId: branchA1.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    tokenStaffA1 = await signSession({
      uid: staffA1.id,
      email: staffA1.email,
      name: staffA1.fullName,
      tenantId: tenantA.id,
      branchId: branchA1.id,
      role: 'STAFF',
      roles: ['STAFF'],
      permissions: ['users:read', 'users:write'],
    })

    tokenStaffA2 = await signSession({
      uid: staffA2.id,
      email: staffA2.email,
      name: staffA2.fullName,
      tenantId: tenantA.id,
      branchId: branchA2.id,
      role: 'STAFF',
      roles: ['STAFF'],
      permissions: ['users:read', 'users:write'],
    })
  })

  afterAll(async () => {
    // Cleanup in reverse dependency order
    await db.studentGuardian.deleteMany({
      where: {
        studentId: { in: [studentA1.id, studentA2.id, studentB1.id] },
      },
    })
    await db.guardian.deleteMany({
      where: { id: { in: [guardianA1.id, guardianA2.id, guardianB1.id] } },
    })
    await db.student.deleteMany({
      where: { id: { in: [studentA1.id, studentA2.id, studentB1.id] } },
    })
    await db.tenantUser.deleteMany({
      where: { tenantId: { in: [tenantA.id, tenantB.id] } },
    })
    await db.user.deleteMany({
      where: { id: { in: [ownerA.id, principalA.id, staffA1.id, staffA2.id] } },
    })
    await db.branch.deleteMany({
      where: { id: { in: [branchA1.id, branchA2.id, branchB1.id] } },
    })
    await db.tenant.deleteMany({
      where: { id: { in: [tenantA.id, tenantB.id] } },
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: GET /api/v1/users/guardians BRANCH ISOLATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/users/guardians Branch Isolation', () => {
    it('allows Owner to retrieve all guardians across all branches in tenant', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/guardians', {
        headers: { authorization: `Bearer ${tokenOwnerA}` },
      })
      const res = await getGuardians(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      const ids = data.data.map((g: any) => g.id)
      expect(ids).toContain(guardianA1.id)
      expect(ids).toContain(guardianA2.id)
      expect(ids).not.toContain(guardianB1.id)
    })

    it('allows Principal to retrieve guardians institution-wide or filtered by branch', async () => {
      const reqAll = new NextRequest('http://localhost:3000/api/v1/users/guardians', {
        headers: { authorization: `Bearer ${tokenPrincipalA}` },
      })
      const resAll = await getGuardians(reqAll)
      expect(resAll.status).toBe(200)
      const dataAll = await resAll.json()
      const idsAll = dataAll.data.map((g: any) => g.id)
      expect(idsAll).toContain(guardianA1.id)
      expect(idsAll).toContain(guardianA2.id)

      // Filter by Branch Beta
      const reqB2 = new NextRequest(`http://localhost:3000/api/v1/users/guardians?branchId=${branchA2.id}`, {
        headers: { authorization: `Bearer ${tokenPrincipalA}` },
      })
      const resB2 = await getGuardians(reqB2)
      expect(resB2.status).toBe(200)
      const dataB2 = await resB2.json()
      const idsB2 = dataB2.data.map((g: any) => g.id)
      expect(idsB2).toContain(guardianA2.id)
      expect(idsB2).not.toContain(guardianA1.id)
    })

    it('restricts single-branch staff (Branch A1) to only guardians linked to Branch A1 students', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/guardians', {
        headers: { authorization: `Bearer ${tokenStaffA1}` },
      })
      const res = await getGuardians(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      const ids = data.data.map((g: any) => g.id)
      expect(ids).toContain(guardianA1.id)
      expect(ids).not.toContain(guardianA2.id)
      expect(ids).not.toContain(guardianB1.id)
    })

    it('rejects single-branch staff attempting to query foreign branch guardians via query param', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/guardians?branchId=${branchA2.id}`, {
        headers: { authorization: `Bearer ${tokenStaffA1}` },
      })
      const res = await getGuardians(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      const errorMsg = data.error?.message || data.error || data.message || ''
      expect(errorMsg).toContain('branch scope restricted')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: SIBLING LINKING BRANCH & CROSS-TENANT ISOLATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/users/[id]/family Sibling Linking Branch Isolation', () => {
    it('blocks branch-scoped staff from linking a student belonging to another branch', async () => {
      // Staff A1 attempts to link studentA2 (Campus Beta) to guardianA1
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianA1.id}/family`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${tokenStaffA1}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentA2.id,
          relationship: 'FATHER',
        }),
      })

      const res = await linkFamilyMember(req, { params: Promise.resolve({ id: guardianA1.id }) })
      expect([400, 403, 500]).toContain(res.status)
      const data = await res.json()
      const errMsg = data.error?.message || data.error || data.message || ''
      expect(errMsg).toContain('belonging to another campus branch')
    })

    it('blocks linking a student belonging to another tenant (Cross-Tenant Defense)', async () => {
      // Owner A attempts to link studentB1 (from Tenant B)
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianA1.id}/family`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentB1.id,
          relationship: 'FATHER',
        }),
      })

      const res = await linkFamilyMember(req, { params: Promise.resolve({ id: guardianA1.id }) })
      expect([400, 404, 500]).toContain(res.status)
      const data = await res.json()
      const errMsg = data.error?.message || data.error || data.message || ''
      expect(errMsg).toContain('not found in this school')
    })

    it('allows Owner to link students across branches for cross-campus families', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianA1.id}/family`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${tokenOwnerA}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentA2.id,
          relationship: 'FATHER',
        }),
      })

      const res = await linkFamilyMember(req, { params: Promise.resolve({ id: guardianA1.id }) })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)

      // Clean up link
      await db.studentGuardian.delete({
        where: {
          studentId_guardianId: {
            studentId: studentA2.id,
            guardianId: guardianA1.id,
          },
        },
      })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: FAMILY CSV PREVIEW & EXECUTION BRANCH RESTRICTION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Family CSV Engine Branch Boundary Enforcement', () => {
    it('blocks linking foreign branch student when actor is branch scoped', async () => {
      const csvContent = [
        'fullName,email,phone,relationship,role,studentAdmissionNo',
        `New Caregiver,caregiver.${ts}@preone.test,+9198777${ts.toString().slice(-5)},MOTHER,PARENT,${studentA2.admissionNo}`,
      ].join('\n')

      const preview = await UserCsvEngine.previewFamilyCsv(tenantA.id, csvContent, {
        actorBranchId: branchA1.id,
        actorRole: 'STAFF',
      })

      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('BLOCKED')
      expect(row.errors.some((e: string) => e.includes('belonging to another campus branch'))).toBe(true)
    })

    it('blocks creating a new student in foreign campus branch when actor is branch scoped', async () => {
      const csvContent = [
        'fullName,email,phone,relationship,role,studentName,studentDOB,studentBranch',
        `New Caregiver 2,caregiver2.${ts}@preone.test,+9198888${ts.toString().slice(-5)},FATHER,PARENT,Foreign Child,2021-03-03,BETA-${ts}`,
      ].join('\n')

      const preview = await UserCsvEngine.previewFamilyCsv(tenantA.id, csvContent, {
        actorBranchId: branchA1.id,
        actorRole: 'STAFF',
      })

      expect(preview.rows.length).toBe(1)
      const row = preview.rows[0]
      expect(row.status).toBe('BLOCKED')
      expect(row.errors.some((e: string) => e.includes('Cannot create student in another campus branch'))).toBe(true)
    })

    it('rejects direct FamilyUserService.createFamilyUser across branches for branch-scoped actor', async () => {
      await expect(
        FamilyUserService.createFamilyUser(
          {
            tenantId: tenantA.id,
            actorBranchId: branchA1.id,
            actorRole: 'STAFF',
          },
          {
            fullName: 'Unauthorized Parent',
            email: `unauth.${ts}@preone.test`,
            phone: `+9198999${ts.toString().slice(-5)}`,
            relationship: 'FATHER',
            role: 'PARENT',
            childMode: 'EXISTING',
            existingChild: {
              studentId: studentA2.id,
            },
          }
        )
      ).rejects.toThrow('Unauthorized: Selected student belongs to another campus branch')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: PRIMARY CONTACT PROTECTION ON NON-LOGIN GUARDIAN DEACTIVATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/users/[id] Primary Contact Safety', () => {
    it('blocks deleting a non-login guardian profile if they are the sole primary contact without nominating an alternate', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/${guardianA1.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${tokenOwnerA}` },
      })

      const res = await deleteUser(req, { params: Promise.resolve({ id: guardianA1.id }) })
      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error?.code).toBe('PRIMARY_CONTACT_DEACTIVATION_BLOCKED')
      expect(data.error?.message).toContain('Cannot deactivate primary contact')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: USERS EXPORT BRANCH ISOLATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/users/export Branch Isolation', () => {
    it('blocks single-branch staff from exporting foreign branch records', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?branchId=${branchA2.id}&userType=FAMILY`, {
        headers: { authorization: `Bearer ${tokenStaffA1}` },
      })
      const res = await getExport(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      const errorMsg = data.error?.message || data.error || data.message || ''
      expect(errorMsg).toContain('branch scope restricted')
    })

    it('allows Principal to export institution-wide family records', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/users/export?userType=FAMILY`, {
        headers: { authorization: `Bearer ${tokenPrincipalA}` },
      })
      const res = await getExport(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toContain('Guardian Alpha')
      expect(text).toContain('Guardian Beta')
    })
  })
})
