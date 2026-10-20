import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { InvitationService } from '@/lib/users/invitation-service'
import bcrypt from 'bcryptjs'

describe('REM-USR-03: Invitation Acceptance Concurrency & Atomic Claim', () => {
  const ts = Date.now().toString()
  let tenant: any
  let ownerUser: any

  beforeAll(async () => {
    tenant = await db.tenant.create({
      data: {
        code: `RACE-${ts.slice(-5)}`,
        name: `Race Testing School ${ts}`,
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('SecurePassword@123', 10)
    ownerUser = await db.user.create({
      data: {
        email: `race.owner.${ts}@preone.test`,
        username: `race_owner_${ts}`,
        fullName: 'Race Owner',
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
      },
    })
  })

  it('1. Two concurrent racing accept requests on the same invitation: exactly one succeeds and one is rejected', async () => {
    const passwordHash = await bcrypt.hash('Placeholder@123', 10)
    const racingUser = await db.user.create({
      data: {
        email: `racing.teacher.${ts}@preone.test`,
        username: `racing_teacher_${ts}`,
        fullName: 'Racing Teacher',
        passwordHash,
        status: 'PENDING',
      },
    })

    const racingMembership = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: racingUser.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'PENDING',
      },
    })

    const inviteResult = await InvitationService.createInvitation({
      tenantId: tenant.id,
      userId: racingUser.id,
      tenantUserId: racingMembership.id,
      email: racingUser.email,
      role: 'TEACHER',
      invitedById: ownerUser.id,
      sendEmail: false,
    })

    const token = inviteResult.rawToken

    // Fire 2 concurrent accept requests simultaneously
    const [res1, res2] = await Promise.allSettled([
      InvitationService.acceptInvitation({
        token,
        password: 'FreshPassword@2026',
        username: `activated_race_${ts}`,
      }),
      InvitationService.acceptInvitation({
        token,
        password: 'AnotherPassword@2026',
        username: `activated_race_${ts}`,
      }),
    ])

    const results = [res1, res2]
    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    // Concurrency guarantee: exactly one wins the claim, exactly one loses
    expect(fulfilled.length).toBe(1)
    expect(rejected.length).toBe(1)

    // The rejected request must fail with INVITATION_ALREADY_ACCEPTED or INVALID_INVITATION
    const rejectReason = (rejected[0] as PromiseRejectedResult).reason
    const errorCode = rejectReason?.code || rejectReason?.error?.code
    expect(['INVITATION_ALREADY_ACCEPTED', 'INVALID_INVITATION']).toContain(errorCode)

    // Verify database state: invitation is ACCEPTED, not duplicated
    const finalInv = await db.userInvitation.findFirst({
      where: { userId: racingUser.id },
    })
    expect(finalInv?.status).toBe('ACCEPTED')
    expect(finalInv?.acceptedAt).not.toBeNull()

    // Membership is ACTIVE
    const finalMembership = await db.tenantUser.findUnique({
      where: { id: racingMembership.id },
    })
    expect(finalMembership?.status).toBe('ACTIVE')

    // Global user is ACTIVE
    const finalUser = await db.user.findUnique({
      where: { id: racingUser.id },
    })
    expect(finalUser?.status).toBe('ACTIVE')
  })

  it('2. Rejects acceptance of an already expired invitation', async () => {
    const expiredUser = await db.user.create({
      data: {
        email: `expired.user.${ts}@preone.test`,
        fullName: 'Expired User',
        passwordHash: '$2b$10$...',
        status: 'PENDING',
      },
    })
    const expiredMembership = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: expiredUser.id,
        role: 'STAFF',
        roles: ['STAFF'],
        status: 'PENDING',
      },
    })

    const inviteResult = await InvitationService.createInvitation({
      tenantId: tenant.id,
      userId: expiredUser.id,
      tenantUserId: expiredMembership.id,
      email: expiredUser.email,
      role: 'STAFF',
      invitedById: ownerUser.id,
      sendEmail: false,
    })

    // Manually force expiration in DB to the past
    await db.userInvitation.update({
      where: { id: inviteResult.invitation.id },
      data: { expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })

    let caughtErr: any = null
    try {
      await InvitationService.acceptInvitation({
        token: inviteResult.rawToken,
        password: 'ValidPassword@123',
      })
    } catch (err: any) {
      caughtErr = err
    }

    expect(caughtErr).not.toBeNull()
    const code = caughtErr?.code || caughtErr?.error?.code
    expect(['INVALID_INVITATION', 'INVITATION_EXPIRED']).toContain(code)
  })

  it('3. Rejects acceptance of a revoked invitation', async () => {
    const revokedUser = await db.user.create({
      data: {
        email: `revoked.user.${ts}@preone.test`,
        fullName: 'Revoked User',
        passwordHash: '$2b$10$...',
        status: 'PENDING',
      },
    })
    const revokedMembership = await db.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: revokedUser.id,
        role: 'STAFF',
        roles: ['STAFF'],
        status: 'PENDING',
      },
    })

    const inviteResult = await InvitationService.createInvitation({
      tenantId: tenant.id,
      userId: revokedUser.id,
      tenantUserId: revokedMembership.id,
      email: revokedUser.email,
      role: 'STAFF',
      invitedById: ownerUser.id,
      sendEmail: false,
    })

    // Revoke the invitation
    await InvitationService.revokeInvitation({
      invitationId: inviteResult.invitation.id,
      tenantId: tenant.id,
      actorSession: {
        uid: ownerUser.id,
        name: ownerUser.fullName,
        role: 'OWNER',
        tenantId: tenant.id,
      },
    })

    let caughtErr: any = null
    try {
      await InvitationService.acceptInvitation({
        token: inviteResult.rawToken,
        password: 'ValidPassword@123',
      })
    } catch (err: any) {
      caughtErr = err
    }

    expect(caughtErr).not.toBeNull()
    const code = caughtErr?.code || caughtErr?.error?.code
    expect(['INVALID_INVITATION', 'INVITATION_REVOKED']).toContain(code)
  })
})
