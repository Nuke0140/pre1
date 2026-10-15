import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { PrimaryContactGuard } from '@/lib/users/primary-contact-guard'
import { POST as userStatusPost } from '@/app/api/v1/users/[id]/status/route'
import { PATCH as userPatch, DELETE as userDelete } from '@/app/api/v1/users/[id]/route'
import bcrypt from 'bcryptjs'
import { signSession } from '@/lib/auth'

describe('Primary-Contact Deactivation Guard (Doc 3.2 / P3 Sprint)', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let owner: any
  let cookieOwner: string

  // Guardian accounts & Student fixtures
  let fatherUser: any
  let fatherMember: any
  let fatherGuardian: any

  let motherUser: any
  let motherMember: any
  let motherGuardian: any

  let studentWithTwoParents: any

  let soleParentUser: any
  let soleParentMember: any
  let soleParentGuardian: any
  let studentWithSoleParent: any

  let teacherUser: any
  let teacherMember: any

  beforeAll(async () => {
    // 1. Create Tenant and Branch
    tenant = await db.tenant.create({
      data: {
        code: `PCG-${ts.slice(-5)}`,
        name: `Primary Guard Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `MAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    const passwordHash = await bcrypt.hash('Preone@123', 10)

    // 2. Owner
    owner = await db.user.create({
      data: {
        email: `owner.pcg.${ts}@test.com`,
        username: `owner_pcg_${ts}`,
        fullName: 'Owner Primary Guard',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: owner.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })

    const token = await signSession({
      uid: owner.id,
      name: owner.fullName,
      email: owner.email!,
      role: 'OWNER',
      roles: ['OWNER'],
      tenantId: tenant.id,
      branchId: branch.id,
    })
    cookieOwner = `preone_session=${token}`

    // 3. Family 1: Father (Primary) & Mother (Secondary) for studentWithTwoParents
    fatherUser = await db.user.create({
      data: {
        email: `father.${ts}@test.com`,
        fullName: 'Ramesh Sharma',
        passwordHash,
        status: 'ACTIVE',
        phone: '9876543210',
      },
    })
    fatherMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: fatherUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        status: 'ACTIVE',
      },
    })
    fatherGuardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        userId: fatherUser.id,
        fullName: 'Ramesh Sharma',
        phone: '9876543210',
        email: fatherUser.email,
        relationship: 'FATHER',
        isPrimaryContact: true,
      },
    })

    motherUser = await db.user.create({
      data: {
        email: `mother.${ts}@test.com`,
        fullName: 'Sunita Sharma',
        passwordHash,
        status: 'ACTIVE',
        phone: '9876543211',
      },
    })
    motherMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: motherUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        status: 'ACTIVE',
      },
    })
    motherGuardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        userId: motherUser.id,
        fullName: 'Sunita Sharma',
        phone: '9876543211',
        email: motherUser.email,
        relationship: 'MOTHER',
        isPrimaryContact: false,
      },
    })

    studentWithTwoParents = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-2P-${ts.slice(-4)}`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2018-05-15'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    // Link Father as Primary
    await db.studentGuardian.create({
      data: {
        studentId: studentWithTwoParents.id,
        guardianId: fatherGuardian.id,
        relationship: 'FATHER',
        isPrimary: true,
        canPickup: true,
        receivesComm: true,
      },
    })

    // Link Mother as Secondary
    await db.studentGuardian.create({
      data: {
        studentId: studentWithTwoParents.id,
        guardianId: motherGuardian.id,
        relationship: 'MOTHER',
        isPrimary: false,
        canPickup: true,
        receivesComm: true,
      },
    })

    // 4. Family 2: Sole Parent for studentWithSoleParent
    soleParentUser = await db.user.create({
      data: {
        email: `sole.${ts}@test.com`,
        fullName: 'Pooja Verma',
        passwordHash,
        status: 'ACTIVE',
        phone: '9876543212',
      },
    })
    soleParentMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: soleParentUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        status: 'ACTIVE',
      },
    })
    soleParentGuardian = await db.guardian.create({
      data: {
        tenantId: tenant.id,
        userId: soleParentUser.id,
        fullName: 'Pooja Verma',
        phone: '9876543212',
        email: soleParentUser.email,
        relationship: 'MOTHER',
        isPrimaryContact: true,
      },
    })

    studentWithSoleParent = await db.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: `ADM-1P-${ts.slice(-4)}`,
        firstName: 'Ananya',
        lastName: 'Verma',
        dob: new Date('2019-02-10'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    await db.studentGuardian.create({
      data: {
        studentId: studentWithSoleParent.id,
        guardianId: soleParentGuardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
        canPickup: true,
        receivesComm: true,
      },
    })

    // 5. Staff User (Teacher)
    teacherUser = await db.user.create({
      data: {
        email: `teacher.pcg.${ts}@test.com`,
        fullName: 'Priya Teacher',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    teacherMember = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: teacherUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
  })

  describe('1. Unit / Service Guard Level (PrimaryContactGuard)', () => {
    it('passes safely for non-guardian users (e.g. Teacher)', async () => {
      const result = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: tenant.id,
        userId: teacherUser.id,
        targetStatus: 'SUSPENDED',
      })

      expect(result.safe).toBe(true)
      expect(result.isPrimary).toBe(false)
      expect(result.affectedStudents.length).toBe(0)
    })

    it('passes safely when deactivating a secondary guardian (Mother) without nomination', async () => {
      const result = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: tenant.id,
        userId: motherUser.id,
        targetStatus: 'SUSPENDED',
      })

      expect(result.safe).toBe(true)
      expect(result.affectedStudents.length).toBe(0)
    })

    it('blocks deactivating primary contact (Father) when no alternate is nominated', async () => {
      const result = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: tenant.id,
        userId: fatherUser.id,
        targetStatus: 'SUSPENDED',
      })

      expect(result.safe).toBe(false)
      expect(result.code).toBe('PRIMARY_CONTACT_DEACTIVATION_BLOCKED')
      expect(result.affectedStudents.length).toBe(1)
      expect(result.affectedStudents[0].studentId).toBe(studentWithTwoParents.id)
      expect(result.affectedStudents[0].hasAvailableAlternates).toBe(true)
      expect(result.affectedStudents[0].availableAlternates.length).toBe(1)
      expect(result.affectedStudents[0].availableAlternates[0].guardianId).toBe(motherGuardian.id)
    })

    it('approves deactivating primary contact (Father) when alternate (Mother) is nominated', async () => {
      const result = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: tenant.id,
        userId: fatherUser.id,
        targetStatus: 'SUSPENDED',
        alternateGuardianId: motherGuardian.id,
      })

      expect(result.safe).toBe(true)
      expect(result.isPrimary).toBe(true)
      expect(result.transfers.length).toBe(1)
      expect(result.transfers[0].studentId).toBe(studentWithTwoParents.id)
      expect(result.transfers[0].fromGuardianId).toBe(fatherGuardian.id)
      expect(result.transfers[0].toGuardianId).toBe(motherGuardian.id)
    })

    it('blocks deactivating sole guardian when student has no other active guardians', async () => {
      const result = await PrimaryContactGuard.checkDeactivationSafety({
        tenantId: tenant.id,
        userId: soleParentUser.id,
        targetStatus: 'SUSPENDED',
      })

      expect(result.safe).toBe(false)
      expect(result.code).toBe('PRIMARY_CONTACT_DEACTIVATION_BLOCKED')
      expect(result.affectedStudents.length).toBe(1)
      expect(result.affectedStudents[0].studentId).toBe(studentWithSoleParent.id)
      expect(result.affectedStudents[0].hasAvailableAlternates).toBe(false)
      expect(result.affectedStudents[0].availableAlternates.length).toBe(0)
    })
  })

  describe('2. POST /api/v1/users/[id]/status (Lifecycle Action Write-Path)', () => {
    it('rejects suspending primary contact with HTTP 409 when no alternate is nominated', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${fatherMember.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieOwner,
          },
          body: JSON.stringify({
            action: 'suspend',
            reason: 'Administrative policy review',
          }),
        }
      )

      const res = await userStatusPost(req, { params: Promise.resolve({ id: fatherMember.id }) })
      expect(res.status).toBe(409)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('PRIMARY_CONTACT_DEACTIVATION_BLOCKED')
      expect(json.error.details).toBeDefined()
      expect(json.error.details.affectedStudents.length).toBe(1)
      expect(json.error.details.affectedStudents[0].studentName).toBe('Aarav Sharma')
      expect(json.error.details.affectedStudents[0].availableAlternates[0].fullName).toBe('Sunita Sharma')

      // Verify DB unchanged
      const tu = await db.tenantUser.findUnique({ where: { id: fatherMember.id } })
      expect(tu?.status).toBe('ACTIVE')
    })

    it('atomically transfers primary contact and suspends guardian when valid alternate is nominated', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${fatherMember.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieOwner,
          },
          body: JSON.stringify({
            action: 'suspend',
            reason: 'Extended leave',
            alternateGuardianId: motherGuardian.id,
          }),
        }
      )

      const res = await userStatusPost(req, { params: Promise.resolve({ id: fatherMember.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('SUSPENDED')

      // Verify DB mutations
      // 1. Father is SUSPENDED and demoted
      const updatedFatherMember = await db.tenantUser.findUnique({ where: { id: fatherMember.id } })
      expect(updatedFatherMember?.status).toBe('SUSPENDED')

      const updatedFatherGuardian = await db.guardian.findUnique({ where: { id: fatherGuardian.id } })
      expect(updatedFatherGuardian?.isPrimaryContact).toBe(false)

      const fatherLink = await db.studentGuardian.findUnique({
        where: {
          studentId_guardianId: {
            studentId: studentWithTwoParents.id,
            guardianId: fatherGuardian.id,
          },
        },
      })
      expect(fatherLink?.isPrimary).toBe(false)

      // 2. Mother is promoted to Primary Contact
      const updatedMotherGuardian = await db.guardian.findUnique({ where: { id: motherGuardian.id } })
      expect(updatedMotherGuardian?.isPrimaryContact).toBe(true)

      const motherLink = await db.studentGuardian.findUnique({
        where: {
          studentId_guardianId: {
            studentId: studentWithTwoParents.id,
            guardianId: motherGuardian.id,
          },
        },
      })
      expect(motherLink?.isPrimary).toBe(true)
      expect(motherLink?.receivesComm).toBe(true)
    })
  })

  describe('3. DELETE /api/v1/users/[id] (User Soft-Deletion Write-Path)', () => {
    let delFatherUser: any
    let delFatherMember: any
    let delFatherGuardian: any
    let delMotherUser: any
    let delMotherMember: any
    let delMotherGuardian: any
    let delStudent: any

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('Preone@123', 10)
      const pfx = `del_${Date.now()}`

      delFatherUser = await db.user.create({
        data: {
          email: `${pfx}.father@test.com`,
          fullName: 'Vikram Joshi',
          passwordHash,
          status: 'ACTIVE',
          phone: '9876543220',
        },
      })
      delFatherMember = await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: delFatherUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          status: 'ACTIVE',
        },
      })
      delFatherGuardian = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: delFatherUser.id,
          fullName: 'Vikram Joshi',
          phone: '9876543220',
          email: delFatherUser.email,
          relationship: 'FATHER',
          isPrimaryContact: true,
        },
      })

      delMotherUser = await db.user.create({
        data: {
          email: `${pfx}.mother@test.com`,
          fullName: 'Kavita Joshi',
          passwordHash,
          status: 'ACTIVE',
          phone: '9876543221',
        },
      })
      delMotherMember = await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: delMotherUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          status: 'ACTIVE',
        },
      })
      delMotherGuardian = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: delMotherUser.id,
          fullName: 'Kavita Joshi',
          phone: '9876543221',
          email: delMotherUser.email,
          relationship: 'MOTHER',
          isPrimaryContact: false,
        },
      })

      delStudent = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          admissionNo: `ADM-DEL-${ts.slice(-4)}`,
          firstName: 'Kabir',
          lastName: 'Joshi',
          dob: new Date('2018-09-20'),
          gender: 'MALE',
          status: 'ACTIVE',
        },
      })

      await db.studentGuardian.create({
        data: {
          studentId: delStudent.id,
          guardianId: delFatherGuardian.id,
          relationship: 'FATHER',
          isPrimary: true,
        },
      })

      await db.studentGuardian.create({
        data: {
          studentId: delStudent.id,
          guardianId: delMotherGuardian.id,
          relationship: 'MOTHER',
          isPrimary: false,
        },
      })
    })

    it('rejects soft-deleting primary contact without alternate nomination', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${delFatherMember.id}`,
        {
          method: 'DELETE',
          headers: { Cookie: cookieOwner },
        }
      )

      const res = await userDelete(req, { params: Promise.resolve({ id: delFatherMember.id }) })
      expect(res.status).toBe(409)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('PRIMARY_CONTACT_DEACTIVATION_BLOCKED')
      expect(json.error.details.affectedStudents.length).toBe(1)
      expect(json.error.details.affectedStudents[0].studentName).toBe('Kabir Joshi')

      // Verify not deleted
      const tu = await db.tenantUser.findUnique({ where: { id: delFatherMember.id } })
      expect(tu?.deletedAt).toBeNull()
    })

    it('soft-deletes primary contact and promotes nominated alternate when provided via body or param', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${delFatherMember.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieOwner,
          },
          body: JSON.stringify({
            alternateGuardianId: delMotherGuardian.id,
          }),
        }
      )

      const res = await userDelete(req, { params: Promise.resolve({ id: delFatherMember.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.deactivated).toBe(true)

      // Verify DB soft deleted
      const tu = await db.tenantUser.findUnique({ where: { id: delFatherMember.id } })
      expect(tu?.deletedAt).not.toBeNull()
      expect(tu?.status).toBe('INACTIVE')

      // Verify Mother promoted
      const motherLink = await db.studentGuardian.findUnique({
        where: {
          studentId_guardianId: {
            studentId: delStudent.id,
            guardianId: delMotherGuardian.id,
          },
        },
      })
      expect(motherLink?.isPrimary).toBe(true)
    })
  })

  describe('4. PATCH /api/v1/users/[id] (Primary Status Revocation & Mutation)', () => {
    let patchFatherUser: any
    let patchFatherMember: any
    let patchFatherGuardian: any
    let patchMotherUser: any
    let patchMotherMember: any
    let patchMotherGuardian: any
    let patchStudent: any

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('Preone@123', 10)
      const pfx = `pat_${Date.now()}`

      patchFatherUser = await db.user.create({
        data: {
          email: `${pfx}.father@test.com`,
          fullName: 'Deepak Patel',
          passwordHash,
          status: 'ACTIVE',
          phone: '9876543230',
        },
      })
      patchFatherMember = await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: patchFatherUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          status: 'ACTIVE',
        },
      })
      patchFatherGuardian = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: patchFatherUser.id,
          fullName: 'Deepak Patel',
          phone: '9876543230',
          email: patchFatherUser.email,
          relationship: 'FATHER',
          isPrimaryContact: true,
        },
      })

      patchMotherUser = await db.user.create({
        data: {
          email: `${pfx}.mother@test.com`,
          fullName: 'Bhavna Patel',
          passwordHash,
          status: 'ACTIVE',
          phone: '9876543231',
        },
      })
      patchMotherMember = await db.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: patchMotherUser.id,
          role: 'PARENT',
          roles: ['PARENT'],
          status: 'ACTIVE',
        },
      })
      patchMotherGuardian = await db.guardian.create({
        data: {
          tenantId: tenant.id,
          userId: patchMotherUser.id,
          fullName: 'Bhavna Patel',
          phone: '9876543231',
          email: patchMotherUser.email,
          relationship: 'MOTHER',
          isPrimaryContact: false,
        },
      })

      patchStudent = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          admissionNo: `ADM-PAT-${ts.slice(-4)}`,
          firstName: 'Dev',
          lastName: 'Patel',
          dob: new Date('2019-11-05'),
          gender: 'MALE',
          status: 'ACTIVE',
        },
      })

      await db.studentGuardian.create({
        data: {
          studentId: patchStudent.id,
          guardianId: patchFatherGuardian.id,
          relationship: 'FATHER',
          isPrimary: true,
        },
      })

      await db.studentGuardian.create({
        data: {
          studentId: patchStudent.id,
          guardianId: patchMotherGuardian.id,
          relationship: 'MOTHER',
          isPrimary: false,
        },
      })
    })

    it('rejects setting isPrimaryContact: false on Father without nominating an alternate', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${patchFatherMember.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieOwner,
          },
          body: JSON.stringify({
            isPrimaryContact: false,
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: patchFatherMember.id }) })
      expect(res.status).toBe(409)

      const json = await res.json()
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('PRIMARY_CONTACT_DEACTIVATION_BLOCKED')
      expect(json.error.details.affectedStudents.length).toBe(1)
    })

    it('accepts setting isPrimaryContact: false when alternateGuardianId is provided and promotes alternate', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${patchFatherMember.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieOwner,
          },
          body: JSON.stringify({
            isPrimaryContact: false,
            alternateGuardianId: patchMotherGuardian.id,
          }),
        }
      )

      const res = await userPatch(req, { params: Promise.resolve({ id: patchFatherMember.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)

      // Verify Mother is now primary contact in DB
      const updatedMother = await db.guardian.findUnique({ where: { id: patchMotherGuardian.id } })
      expect(updatedMother?.isPrimaryContact).toBe(true)

      const motherLink = await db.studentGuardian.findUnique({
        where: {
          studentId_guardianId: {
            studentId: patchStudent.id,
            guardianId: patchMotherGuardian.id,
          },
        },
      })
      expect(motherLink?.isPrimary).toBe(true)
    })
  })

  describe('5. Staff User Protection (Non-Guardian bypass)', () => {
    it('allows suspending staff user without primary contact guard interference', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/users/${teacherMember.id}/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookieOwner,
          },
          body: JSON.stringify({
            action: 'suspend',
            reason: 'Staff sabbatical',
          }),
        }
      )

      const res = await userStatusPost(req, { params: Promise.resolve({ id: teacherMember.id }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.status).toBe('SUSPENDED')
    })
  })
})
