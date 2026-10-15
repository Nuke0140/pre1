import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { MIN_PASSWORD_LENGTH, PASSWORD_POLICY } from '@/lib/auth'
import {
  MIN_PASSWORD_LENGTH as VALIDATION_MIN_PASSWORD_LENGTH,
  PASSWORD_POLICY as VALIDATION_PASSWORD_POLICY,
  validateStaffInput,
  validateFamilyInput,
} from '@/lib/users/user-validation'
import { POST as usersPost } from '@/app/api/v1/users/route'
import { PATCH as userPatch } from '@/app/api/v1/users/[id]/route'
import { POST as staffPost } from '@/app/api/v1/staff/route'
import { POST as tenantsPost } from '@/app/api/v1/tenants/route'

describe('Password Policy Consistency Audit (N-2)', () => {
  let tenant: any
  let branch: any
  let adminUser: any
  let adminCookie: string
  const ts = `${Date.now()}`

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        name: `Password Policy School ${ts.slice(-4)}`,
        code: `PWD-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        code: `MC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    adminUser = await db.user.create({
      data: {
        email: `pwd.admin.${ts}@preone.test`,
        fullName: 'Password Admin',
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
  // TEST 1: CONSTANTS & POLICIES
  // ─────────────────────────────────────────────────────────────────────────
  it('exports standardized minimum 8-character floor and consistent policy constants', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
    expect(VALIDATION_MIN_PASSWORD_LENGTH).toBe(8)
    expect(PASSWORD_POLICY.minLength).toBe(8)
    expect(VALIDATION_PASSWORD_POLICY.minLength).toBe(8)
    expect(PASSWORD_POLICY.errorMessage).toBe('Password must be at least 8 characters long')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: VALIDATION FUNCTIONS ENFORCE 8 CHARACTERS
  // ─────────────────────────────────────────────────────────────────────────
  it('enforces 8 characters in validateStaffInput and validateFamilyInput', () => {
    // 7 characters — FAILS
    const staffInvalid = validateStaffInput({
      fullName: 'John Doe',
      email: 'john@preone.test',
      role: 'TEACHER',
      password: 'Pass123', // 7 chars
    })
    expect(staffInvalid.valid).toBe(false)
    expect(staffInvalid.errors).toContain('Password must be at least 8 characters long')

    // 8 characters — PASSES
    const staffValid = validateStaffInput({
      fullName: 'John Doe',
      email: 'john@preone.test',
      role: 'TEACHER',
      password: 'Pass1234', // 8 chars
    })
    expect(staffValid.valid).toBe(true)
    expect(staffValid.errors).not.toContain('Password must be at least 8 characters long')

    // Family 7 characters — FAILS
    const familyInvalid = validateFamilyInput({
      fullName: 'Jane Doe',
      email: 'jane@preone.test',
      phone: '+91 99999 88888',
      role: 'PARENT',
      relationship: 'MOTHER',
      childMode: 'CREATE',
      newChild: { firstName: 'Child', dob: '2022-01-01', gender: 'FEMALE' },
      password: 'Pass123', // 7 chars
    })
    expect(familyInvalid.valid).toBe(false)
    expect(familyInvalid.errors).toContain('Password must be at least 8 characters long')

    // Family 8 characters — PASSES
    const familyValid = validateFamilyInput({
      fullName: 'Jane Doe',
      email: 'jane@preone.test',
      phone: '+91 99999 88888',
      role: 'PARENT',
      relationship: 'MOTHER',
      childMode: 'CREATE',
      newChild: { firstName: 'Child', dob: '2022-01-01', gender: 'FEMALE' },
      password: 'Pass1234', // 8 chars
    })
    expect(familyValid.valid).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: POST /api/v1/users REJECTS < 8 CHARACTERS & ACCEPTS >= 8
  // ─────────────────────────────────────────────────────────────────────────
  it('rejects passwords shorter than 8 characters in POST /api/v1/users and accepts >= 8', async () => {
    // Attempt 1: 7 characters (Pass123)
    const reqShort = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Short Password User',
        email: `short.pwd.${ts}@preone.test`,
        username: `short.pwd.${ts.slice(-4)}`,
        role: 'TEACHER',
        password: 'Pass123', // 7 chars
        credentialSetupMode: 'MANUAL',
      }),
    })

    const resShort = await usersPost(reqShort)
    expect(resShort.status).toBe(400)
    const jsonShort = await resShort.json()
    expect(jsonShort.success).toBe(false)
    expect(jsonShort.error.message).toContain('Password must be at least 8 characters long')
    expect(jsonShort.error.field).toBe('password')

    // Attempt 2: Exactly 8 characters (Pass1234)
    const reqValid = new NextRequest('http://localhost/api/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Valid 8Char Password User',
        email: `valid8.pwd.${ts}@preone.test`,
        username: `valid8.pwd.${ts.slice(-4)}`,
        role: 'TEACHER',
        password: 'Pass1234', // 8 chars
        credentialSetupMode: 'MANUAL',
      }),
    })

    const resValid = await usersPost(reqValid)
    expect(resValid.status).toBe(201)
    const jsonValid = await resValid.json()
    expect(jsonValid.success).toBe(true)
    expect(jsonValid.data.userId).toBeDefined()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: PATCH /api/v1/users/[id] REJECTS < 8 CHARACTERS & ACCEPTS >= 8
  // ─────────────────────────────────────────────────────────────────────────
  it('rejects passwords shorter than 8 characters in PATCH /api/v1/users/[id] and accepts >= 8', async () => {
    // Create dedicated user so adminUser session remains valid
    const patchTargetUser = await db.user.create({
      data: {
        email: `patch.target.${ts}@preone.test`,
        fullName: 'Patch Target User',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            role: 'TEACHER',
            status: 'ACTIVE',
          },
        },
      },
    })

    const targetUserId = patchTargetUser.id

    // Attempt 1: 7 characters
    const reqShortPatch = new NextRequest(`http://localhost/api/v1/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        password: '1234567', // 7 chars
      }),
    })

    const resShortPatch = await userPatch(reqShortPatch, { params: Promise.resolve({ id: targetUserId }) })
    expect(resShortPatch.status).toBe(400)
    const jsonShortPatch = await resShortPatch.json()
    expect(jsonShortPatch.success).toBe(false)
    expect(jsonShortPatch.error.code).toBe('INVALID_PASSWORD')
    expect(jsonShortPatch.error.message).toContain('Password must be at least 8 characters long')

    // Attempt 2: Exactly 8 characters
    const reqValidPatch = new NextRequest(`http://localhost/api/v1/users/${targetUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        password: 'Secure88', // 8 chars
      }),
    })

    const resValidPatch = await userPatch(reqValidPatch, { params: Promise.resolve({ id: targetUserId }) })
    expect(resValidPatch.status).toBe(200)
    const jsonValidPatch = await resValidPatch.json()
    expect(jsonValidPatch.success).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: POST /api/v1/staff REJECTS < 8 CHARACTERS
  // ─────────────────────────────────────────────────────────────────────────
  it('rejects passwords shorter than 8 characters in POST /api/v1/staff', async () => {
    const req = new NextRequest('http://localhost/api/v1/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Staff Route Tester',
        email: `staff.pwd.${ts}@preone.test`,
        role: 'TEACHER',
        employeeCode: `EMP-PWD-${ts.slice(-4)}`,
        password: 'Short6', // 6 chars
      }),
    })

    const res = await staffPost(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('Password must be at least 8 characters long')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: POST /api/v1/tenants REJECTS OWNER PASSWORD < 8 CHARACTERS
  // ─────────────────────────────────────────────────────────────────────────
  it('rejects owner passwords shorter than 8 characters in POST /api/v1/tenants', async () => {
    const platformAdminUser = await db.user.create({
      data: {
        email: `platform.admin.${ts}@preone.test`,
        fullName: 'Platform Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$placeholderhash1234567890',
      },
    })

    const platformAdminToken = await signSession({
      uid: platformAdminUser.id,
      email: platformAdminUser.email,
      name: platformAdminUser.fullName,
      tenantId: null,
      role: 'PLATFORM_ADMIN',
      roles: ['PLATFORM_ADMIN'],
      tokenVersion: 0,
      mustChangePassword: false,
    })

    const req = new NextRequest('http://localhost/api/v1/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `preone_session=${platformAdminToken}`,
      },
      body: JSON.stringify({
        name: `New School ${ts.slice(-4)}`,
        code: `NS${ts.slice(-3)}`,
        branchName: 'Main Campus',
        ownerName: 'Owner Person',
        ownerEmail: `owner.${ts}@preone.test`,
        ownerPassword: 'Short7!', // 7 chars
      }),
    })

    const res = await tenantsPost(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.message).toContain('Owner password must be at least 8 characters')
  })
})
