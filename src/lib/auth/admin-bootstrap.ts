/**
 * Idempotent PreOne Admin Bootstrap Service
 *
 * Ensures the canonical PREONE tenant and initial administrator account exist
 * identically across local development and Vercel production environments:
 *
 *   School code: PREONE
 *   Email:       admin@preone.com
 *   Username:    admin
 *   Password:    Preone@2311 (or PREONE_ADMIN_PASSWORD env var)
 *   Role:        OWNER (Institution Admin with full school authority)
 *   Status:      ACTIVE
 *
 * Idempotency:
 * - Running multiple times will NEVER create duplicate tenants or users.
 * - Reconciles credentials, memberships, and status safely.
 * - Clears any existing lockout trackers for the admin account.
 * - Does not touch or overwrite unrelated users or school data.
 * - Never logs or stores plaintext passwords.
 */

import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import {
  resetFailedAttempts,
  resetPersistentFailedAttempts,
} from '@/lib/auth/lockout-tracker'

export async function bootstrapPreoneAdmin(opts?: { silent?: boolean }) {
  const log = (msg: string) => {
    if (!opts?.silent) console.log(msg)
  }

  log('================================================================')
  log('⚡ PREONE IDEMPOTENT ADMIN BOOTSTRAP')
  log('================================================================')

  const SCHOOL_CODE = 'PREONE'
  const ADMIN_EMAIL = 'admin@preone.com'
  const ADMIN_USERNAME = 'admin'
  const ADMIN_NAME = 'PreOne Administrator'
  const RAW_PASSWORD = process.env.PREONE_ADMIN_PASSWORD || 'Preone@2311'

  // 1. Ensure PREONE tenant exists and is ACTIVE
  let tenant = await db.tenant.findUnique({
    where: { code: SCHOOL_CODE },
  })

  if (!tenant) {
    log(`[1/5] Creating tenant ${SCHOOL_CODE}...`)
    tenant = await db.tenant.create({
      data: {
        code: SCHOOL_CODE,
        name: 'PreOne Preschool Academy',
        type: 'SCHOOL',
        status: 'ACTIVE',
        subscriptionPlan: 'PRO',
        maxBranches: 5,
        maxStudents: 500,
        onboardingStep: 5,
        onboardedAt: new Date(),
      },
    })
    log(`      ✅ Created tenant ID: ${tenant.id}`)
  } else {
    log(`[1/5] Tenant ${SCHOOL_CODE} already exists (ID: ${tenant.id}). Ensuring ACTIVE...`)
    if (tenant.status !== 'ACTIVE') {
      tenant = await db.tenant.update({
        where: { id: tenant.id },
        data: { status: 'ACTIVE', updatedAt: new Date() },
      })
      log(`      ✅ Tenant status updated to ACTIVE`)
    } else {
      log(`      ✅ Tenant status is ACTIVE`)
    }
  }

  // 2. Ensure Main Branch exists
  let branch = await db.branch.findFirst({
    where: { tenantId: tenant.id, isMain: true },
  })

  if (!branch) {
    log(`[2/5] Creating main branch for ${SCHOOL_CODE}...`)
    branch = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'PreOne Main Campus',
        code: 'MAIN',
        isMain: true,
      },
    })
    log(`      ✅ Created main branch ID: ${branch.id}`)
  } else {
    log(`[2/5] Main branch exists (ID: ${branch.id}, Code: ${branch.code})`)
  }

  // 3. Ensure SchoolSetup exists and is LIVE (so admin directly accesses dashboard)
  const existingSetup = await db.schoolSetup.findUnique({
    where: { tenantId: tenant.id },
  })

  if (!existingSetup) {
    log(`[3/5] Initializing SchoolSetup status to LIVE...`)
    await db.schoolSetup.create({
      data: {
        tenantId: tenant.id,
        status: 'LIVE',
        startedAt: new Date(),
        goLiveAt: new Date(),
        goLiveByName: ADMIN_NAME,
      },
    })
    log(`      ✅ Created SchoolSetup with status LIVE`)
  } else if (existingSetup.status !== 'LIVE') {
    log(`[3/5] Promoting SchoolSetup to LIVE...`)
    await db.schoolSetup.update({
      where: { tenantId: tenant.id },
      data: { status: 'LIVE', goLiveAt: new Date(), updatedAt: new Date() },
    })
    log(`      ✅ SchoolSetup updated to LIVE`)
  } else {
    log(`[3/5] SchoolSetup is already LIVE`)
  }

  // 4. Securely Hash Admin Password
  const passwordHash = await bcrypt.hash(RAW_PASSWORD, 10)

  // 5. Reconcile Admin User (check admin@preone.com, admin, or legacy admin@mypreone.com)
  log(`[4/5] Reconciling admin identity ${ADMIN_EMAIL}...`)
  let user = await db.user.findFirst({
    where: {
      OR: [
        { email: ADMIN_EMAIL },
        { username: ADMIN_USERNAME },
        { email: 'admin@mypreone.com' },
      ],
    },
  })

  if (!user) {
    user = await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        fullName: ADMIN_NAME,
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
      },
    })
    log(`      ✅ Created admin user ID: ${user.id}`)
  } else {
    log(`      Existing admin account resolved (ID: ${user.id}). Updating credentials & state...`)
    user = await db.user.update({
      where: { id: user.id },
      data: {
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        fullName: user.fullName || ADMIN_NAME,
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        updatedAt: new Date(),
      },
    })
    log(`      ✅ Reconciled admin credentials and reset failure trackers`)
  }

  // Clear any persistent or memory lockout counters
  await resetPersistentFailedAttempts(user.id)
  resetFailedAttempts(user.id, ADMIN_EMAIL, ADMIN_USERNAME, 'admin')

  // 6. Ensure School Membership with OWNER Role
  log(`[5/5] Ensuring tenant membership for ${SCHOOL_CODE}...`)
  const existingMembership = await db.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
  })

  if (!existingMembership) {
    await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        branchId: branch.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })
    log(`      ✅ Created TenantUser membership with role OWNER`)
  } else {
    if (existingMembership.role !== 'OWNER' || existingMembership.status !== 'ACTIVE') {
      await db.tenantUser.update({
        where: { id: existingMembership.id },
        data: {
          role: 'OWNER',
          roles: ['OWNER'],
          status: 'ACTIVE',
          branchId: branch.id,
          updatedAt: new Date(),
        },
      })
      log(`      ✅ Updated TenantUser membership to role OWNER and status ACTIVE`)
    } else {
      log(`      ✅ TenantUser membership already active with role OWNER`)
    }
  }

  // 7. Ensure StaffProfile exists for admin
  const existingStaffProfile = await db.staffProfile.findFirst({
    where: { userId: user.id, tenantId: tenant.id },
  })

  if (!existingStaffProfile) {
    await db.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        branchId: branch.id,
        employeeCode: 'PRE-ADM-001',
        designation: 'Institution Administrator',
        department: 'School Governance',
      },
    })
    log(`      ✅ Created StaffProfile for administrator`)
  }

  log('\n================================================================')
  log('✨ PREONE ADMIN BOOTSTRAP COMPLETE')
  log(`   School Code: ${SCHOOL_CODE}`)
  log(`   Identifier:  ${ADMIN_EMAIL} or ${ADMIN_USERNAME}`)
  log(`   Role:        OWNER`)
  log(`   Tenant:      ${tenant.name}`)
  log('================================================================\n')

  return {
    tenantId: tenant.id,
    schoolCode: SCHOOL_CODE,
    userId: user.id,
    email: ADMIN_EMAIL,
    username: ADMIN_USERNAME,
  }
}
