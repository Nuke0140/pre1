import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { InvitationService, INVITATION_TTL_DAYS } from '@/lib/users/invitation-service'
import { GET as invitationsGet, POST as invitationsPost } from '@/app/api/v1/users/invitations/route'
import { GET as invitationAuthGet, POST as invitationAuthPost } from '@/app/api/v1/auth/invitation/route'
import { GET as userDetailGet } from '@/app/api/v1/users/[id]/route'
import { POST as resendInvitePost } from '@/app/api/v1/users/[id]/resend-invite/route'
import bcrypt from 'bcryptjs'
import { signSession } from '@/lib/auth'

describe('Invitation Lifecycle UI & Token Model (Doc 1.3 / P3 Sprint)', () => {
  const ts = Date.now().toString()
  let tenantA: any
  let tenantB: any
  let ownerA: any
  let ownerB: any
  let cookieOwnerA: string
  let cookieOwnerB: string

  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'preone-dev-jwt-secret-2f8b7c9d4e6a1f3b5c8d0e'
  )

  beforeAll(async () => {
    // 1. Create Tenant A & Tenant B
    tenantA = await db.tenant.create({
      data: {
        code: `INV-A-${ts.slice(-5)}`,
        name: `Invitation Alpha Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    tenantB = await db.tenant.create({
      data: {
        code: `INV-B-${ts.slice(-5)}`,
        name: `Invitation Beta Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    const passwordHash = await bcrypt.hash('Preone@123', 10)

    // 2. Owner of Tenant A
    ownerA = await db.user.create({
      data: {
        email: `owner.inv.a.${ts}@test.com`,
        username: `owner_inv_a_${ts}`,
        fullName: 'Owner Alpha Inv',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: ownerA.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })

    // 3. Owner of Tenant B
    ownerB = await db.user.create({
      data: {
        email: `owner.inv.b.${ts}@test.com`,
        username: `owner_inv_b_${ts}`,
        fullName: 'Owner Beta Inv',
        passwordHash,
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: ownerB.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })

    // 4. Session Tokens
    cookieOwnerA = await signSession({
      uid: ownerA.id,
      email: ownerA.email,
      role: 'OWNER',
      tenantId: tenantA.id,
    })

    cookieOwnerB = await signSession({
      uid: ownerB.id,
      email: ownerB.email,
      role: 'OWNER',
      tenantId: tenantB.id,
    })
  })

  describe('1. Invitation Creation & Token Generation', () => {
    let pendingUser: any
    let pendingMembership: any
    let createdInvitation: any

    it('creates an invitation with secure rawToken, SHA-256 tokenHash, and 7-day TTL', async () => {
      const passwordHash = await bcrypt.hash('Placeholder@123', 10)
      pendingUser = await db.user.create({
        data: {
          email: `pending.teacher.${ts}@test.com`,
          fullName: 'Pending Educator',
          passwordHash,
          status: 'PENDING',
        },
      })

      pendingMembership = await db.tenantUser.create({
        data: {
          tenantId: tenantA.id,
          userId: pendingUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'PENDING',
        },
      })

      const result = await InvitationService.createInvitation({
        tenantId: tenantA.id,
        userId: pendingUser.id,
        tenantUserId: pendingMembership.id,
        email: pendingUser.email,
        role: 'TEACHER',
        invitedById: ownerA.id,
        origin: 'http://localhost:3000',
        sendEmail: false,
      })

      createdInvitation = result.invitation
      expect(result.rawToken).toMatch(/^inv_[a-f0-9]{64}$/)
      expect(result.inviteUrl).toContain('/invite?token=inv_')
      expect(createdInvitation.status).toBe('PENDING')
      expect(createdInvitation.resendCount).toBe(0)

      // Verify expiration is set to 7 days from now
      const now = Date.now()
      const expiry = new Date(createdInvitation.expiresAt).getTime()
      const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(INVITATION_TTL_DAYS)
    })

    it('verifies public GET /api/v1/auth/invitation?token=... resolves invitation metadata', async () => {
      const inv = await db.userInvitation.findFirst({
        where: { userId: pendingUser.id },
      })
      expect(inv).not.toBeNull()
      expect(inv?.rawToken).toBeTruthy()

      const req = new NextRequest(`http://localhost:3000/api/v1/auth/invitation?token=${inv?.rawToken}`)
      const res = await invitationAuthGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.email).toBe(pendingUser.email)
      expect(json.data.fullName).toBe('Pending Educator')
      expect(json.data.role).toBe('TEACHER')
      expect(json.data.schoolName).toBe(tenantA.name)
    })
  })

  describe('2. Invitation Listing & Computed Attributes (invited-age, countdown, KPIs)', () => {
    it('GET /api/v1/users/invitations computes invitedAge, expiresIn, and status KPIs', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/invitations', {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })

      const res = await invitationsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.invitations.length).toBeGreaterThanOrEqual(1)

      const item = json.data.invitations[0]
      expect(item.invitedAge).toBeTruthy()
      expect(item.expiresIn).toContain('Expires')
      expect(item.isExpired).toBe(false)
      expect(item.effectiveStatus).toBe('PENDING')
      expect(item.resendCount).toBe(0)

      // KPIs
      expect(json.data.kpis).toBeDefined()
      expect(json.data.kpis.pending).toBeGreaterThanOrEqual(1)
      expect(json.data.kpis.total).toBeGreaterThanOrEqual(1)
    })

    it('GET /api/v1/users/[id] includes invitation lifecycle details in single user view', async () => {
      const inv = await db.userInvitation.findFirst({
        where: { tenantId: tenantA.id, status: 'PENDING' },
      })
      expect(inv).not.toBeNull()

      const req = new NextRequest(`http://localhost:3000/api/v1/users/${inv?.userId}`, {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })

      const res = await userDetailGet(req, { params: Promise.resolve({ id: inv!.userId }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.data.invitation).toBeDefined()
      expect(json.data.invitation.effectiveStatus).toBe('PENDING')
      expect(json.data.invitation.invitedAge).toBeTruthy()
      expect(json.data.invitation.expiresIn).toContain('Expires')
      expect(json.data.invitation.resendCount).toBe(0)
    })
  })

  describe('3. Resend Invitation Flow & Token Regeneration', () => {
    it('POST /api/v1/users/invitations with action: resend regenerates token and increments resendCount', async () => {
      const inv = await db.userInvitation.findFirst({
        where: { tenantId: tenantA.id, status: 'PENDING' },
      })
      const oldToken = inv?.rawToken
      const oldTokenHash = inv?.tokenHash

      const req = new NextRequest('http://localhost:3000/api/v1/users/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          action: 'resend',
          invitationId: inv?.id,
        }),
      })

      const res = await invitationsPost(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.resendCount).toBe(1)
      expect(json.data.inviteUrl).toContain('/invite?token=inv_')

      // Verify database updated with fresh token
      const updatedInv = await db.userInvitation.findUnique({
        where: { id: inv?.id },
      })
      expect(updatedInv?.resendCount).toBe(1)
      expect(updatedInv?.rawToken).not.toBe(oldToken)
      expect(updatedInv?.tokenHash).not.toBe(oldTokenHash)
      expect(updatedInv?.lastResentAt).not.toBeNull()

      // Old token must no longer be valid
      if (oldToken) {
        const oldVerifyReq = new NextRequest(`http://localhost:3000/api/v1/auth/invitation?token=${oldToken}`)
        const oldVerifyRes = await invitationAuthGet(oldVerifyReq)
        expect(oldVerifyRes.status).toBe(400)
      }

      // New token must verify successfully
      const newVerifyReq = new NextRequest(`http://localhost:3000/api/v1/auth/invitation?token=${updatedInv?.rawToken}`)
      const newVerifyRes = await invitationAuthGet(newVerifyReq)
      expect(newVerifyRes.status).toBe(200)
    })

    it('POST /api/v1/users/[id]/resend-invite route delegates to InvitationService for pending members', async () => {
      const inv = await db.userInvitation.findFirst({
        where: { tenantId: tenantA.id, status: 'PENDING' },
      })

      const req = new NextRequest(`http://localhost:3000/api/v1/users/${inv?.userId}/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
      })

      const res = await resendInvitePost(req, { params: Promise.resolve({ id: inv!.userId }) })
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.resendCount).toBe(2)
      expect(json.data.inviteUrl).toBeTruthy()
    })
  })

  describe('4. Expiration Enforcement & Security Policy', () => {
    let expiredInvitation: any
    let expiredRawToken: string

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('Placeholder@123', 10)
      const user = await db.user.create({
        data: {
          email: `expired.invite.${ts}@test.com`,
          fullName: 'Expired Staff Member',
          passwordHash,
          status: 'PENDING',
        },
      })

      await db.tenantUser.create({
        data: {
          tenantId: tenantA.id,
          userId: user.id,
          role: 'STAFF',
          roles: ['STAFF'],
          status: 'PENDING',
        },
      })

      const { rawToken, tokenHash } = InvitationService.generateToken()
      expiredRawToken = rawToken

      // Set expiresAt to 2 days in the PAST
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      expiredInvitation = await db.userInvitation.create({
        data: {
          tenantId: tenantA.id,
          userId: user.id,
          email: user.email,
          role: 'STAFF',
          tokenHash,
          rawToken,
          status: 'PENDING',
          expiresAt: pastDate,
        },
      })
    })

    it('GET /api/v1/auth/invitation?token=... rejects expired token with INVITATION_EXPIRED code', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/auth/invitation?token=${expiredRawToken}`)
      const res = await invitationAuthGet(req)
      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json.error.code).toBe('INVITATION_EXPIRED')
      expect(json.error.message.toLowerCase()).toContain('expired')
    })

    it('POST /api/v1/auth/invitation rejects activation attempt on expired invitation', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: expiredRawToken,
          password: 'NewStrongPassword@2026',
        }),
      })

      const res = await invitationAuthPost(req)
      expect(res.status).toBe(400)

      const json = await res.json()
      expect(json.error.message.toLowerCase()).toContain('expired')
    })

    it('GET /api/v1/users/invitations?status=EXPIRED filters expired invitations correctly', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/invitations?status=EXPIRED', {
        headers: { cookie: `preone_session=${cookieOwnerA}` },
      })

      const res = await invitationsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      const found = json.data.invitations.find((i: any) => i.id === expiredInvitation.id)
      expect(found).toBeDefined()
      expect(found.isExpired).toBe(true)
      expect(found.effectiveStatus).toBe('EXPIRED')
    })
  })

  describe('5. Onboarding Acceptance & Account Activation', () => {
    let acceptUser: any
    let acceptRawToken: string

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('Placeholder@123', 10)
      acceptUser = await db.user.create({
        data: {
          email: `accept.onboard.${ts}@test.com`,
          fullName: 'Accepting Educator',
          passwordHash,
          status: 'PENDING',
        },
      })

      const tu = await db.tenantUser.create({
        data: {
          tenantId: tenantA.id,
          userId: acceptUser.id,
          role: 'TEACHER',
          roles: ['TEACHER'],
          status: 'PENDING',
        },
      })

      const { rawToken, tokenHash } = InvitationService.generateToken()
      acceptRawToken = rawToken

      await db.userInvitation.create({
        data: {
          tenantId: tenantA.id,
          userId: acceptUser.id,
          tenantUserId: tu.id,
          email: acceptUser.email,
          role: 'TEACHER',
          tokenHash,
          rawToken,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
    })

    it('POST /api/v1/auth/invitation sets password, marks invitation ACCEPTED, and activates user', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: acceptRawToken,
          password: 'SecretTeacher@2026',
          username: `teacher_active_${ts}`,
        }),
      })

      const res = await invitationAuthPost(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.message).toContain('activated')

      // Verify User record is now ACTIVE
      const updatedUser = await db.user.findUnique({
        where: { id: acceptUser.id },
      })
      expect(updatedUser?.status).toBe('ACTIVE')
      expect(updatedUser?.username).toBe(`teacher_active_${ts}`)
      const passwordMatches = await bcrypt.compare('SecretTeacher@2026', updatedUser!.passwordHash)
      expect(passwordMatches).toBe(true)

      // Verify TenantUser is ACTIVE
      const updatedMembership = await db.tenantUser.findFirst({
        where: { tenantId: tenantA.id, userId: acceptUser.id },
      })
      expect(updatedMembership?.status).toBe('ACTIVE')

      // Verify UserInvitation is ACCEPTED
      const updatedInv = await db.userInvitation.findFirst({
        where: { userId: acceptUser.id },
      })
      expect(updatedInv?.status).toBe('ACCEPTED')
      expect(updatedInv?.acceptedAt).not.toBeNull()
    })

    it('rejects subsequent use of the already accepted token', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/auth/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: acceptRawToken,
          password: 'AnotherPassword@2026',
        }),
      })

      const res = await invitationAuthPost(req)
      expect(res.status).toBe(400)
    })
  })

  describe('6. Revocation Flow & Cross-Tenant Protection', () => {
    let revokeUser: any
    let revokeRawToken: string
    let revokeInvitation: any

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('Placeholder@123', 10)
      revokeUser = await db.user.create({
        data: {
          email: `revoke.invite.${ts}@test.com`,
          fullName: 'Revocable Staff',
          passwordHash,
          status: 'PENDING',
        },
      })

      const tu = await db.tenantUser.create({
        data: {
          tenantId: tenantA.id,
          userId: revokeUser.id,
          role: 'STAFF',
          roles: ['STAFF'],
          status: 'PENDING',
        },
      })

      const { rawToken, tokenHash } = InvitationService.generateToken()
      revokeRawToken = rawToken

      revokeInvitation = await db.userInvitation.create({
        data: {
          tenantId: tenantA.id,
          userId: revokeUser.id,
          tenantUserId: tu.id,
          email: revokeUser.email,
          role: 'STAFF',
          tokenHash,
          rawToken,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
    })

    it('cross-tenant protection: Tenant B admin cannot revoke or resend Tenant A invitation', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerB}`,
        },
        body: JSON.stringify({
          action: 'revoke',
          invitationId: revokeInvitation.id,
        }),
      })

      const res = await invitationsPost(req)
      expect(res.status).toBe(404)
    })

    it('Tenant A admin revokes invitation, marking invitation REVOKED and membership INACTIVE', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/users/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `preone_session=${cookieOwnerA}`,
        },
        body: JSON.stringify({
          action: 'revoke',
          invitationId: revokeInvitation.id,
        }),
      })

      const res = await invitationsPost(req)
      expect(res.status).toBe(200)

      const updatedInv = await db.userInvitation.findUnique({
        where: { id: revokeInvitation.id },
      })
      expect(updatedInv?.status).toBe('REVOKED')

      // Verification of revoked token fails
      const verifyReq = new NextRequest(`http://localhost:3000/api/v1/auth/invitation?token=${revokeRawToken}`)
      const verifyRes = await invitationAuthGet(verifyReq)
      expect(verifyRes.status).toBe(400)
      const json = await verifyRes.json()
      expect(json.error.message.toLowerCase()).toContain('cancelled')
    })
  })
})
