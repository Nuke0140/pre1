import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { ClassroomPlacementService } from '@/lib/admissions/classroom-placement-service'
import { InvitationService } from '@/lib/users/invitation-service'
import { S3StorageService } from '@/lib/storage/s3-storage-service'
import { isDemoOtpAllowed } from '@/lib/auth/otp-service'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

describe('Admissions Security & Parent Activation Flow Audit', () => {
  const tenantId = `tenant_act_${Date.now()}`
  const branchId = `branch_act_${Date.now()}`
  const academicSessionId = `session_act_${Date.now()}`

  beforeEach(async () => {
    // Set up test tenant and scope
    await db.tenant.create({
      data: {
        id: tenantId,
        name: 'Activation Audit Academy',
        code: `AAA_${Date.now()}`,
        status: 'ACTIVE',
      },
    })

    await db.branch.create({
      data: {
        id: branchId,
        tenantId,
        name: 'Main Campus',
        code: `MC_${Date.now()}`,
        isActive: true,
      },
    })

    await db.academicSession.create({
      data: {
        id: academicSessionId,
        tenantId,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    await db.program.create({
      data: {
        tenantId,
        name: 'Playgroup',
        code: `PG_${Date.now()}`,
        programType: 'PLAYGROUP',
        ageMinMonths: 18,
        ageMaxMonths: 48,
        isActive: true,
      },
    })
  })

  afterEach(async () => {
    // Clean up
    await db.studentAllocation.deleteMany({ where: { tenantId } })
    await db.studentGuardian.deleteMany({ where: { student: { tenantId } } })
    await db.student.deleteMany({ where: { tenantId } })
    await db.userInvitation.deleteMany({ where: { tenantId } })
    await db.applicationInvitation.deleteMany({ where: { tenantId } })
    await db.applicationDocument.deleteMany({ where: { application: { tenantId } } })
    await db.admissionApplication.deleteMany({ where: { tenantId } })
    await db.classroom.deleteMany({ where: { tenantId } })
    await db.program.deleteMany({ where: { tenantId } })
    await db.tenantUser.deleteMany({ where: { tenantId } })
    await db.academicSession.deleteMany({ where: { id: academicSessionId } })
    await db.branch.deleteMany({ where: { id: branchId } })
    await db.tenant.deleteMany({ where: { id: tenantId } })
  })

  it('SEC-01: Provisions parent with locked unguessable password and creates activation invitation', async () => {
    const classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        name: 'Playgroup Alpha',
        code: `PGA_${Date.now()}`,
        capacity: 20,
        programType: 'PLAYGROUP',
        isActive: true,
      },
    })

    const parentEmail = `parent.act.${Date.now()}@example.com`
    const parentPhone = `+919${Date.now().toString().slice(-8)}`
    const app = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-${Date.now()}`,
        childFirstName: 'Rohan',
        childLastName: 'Sharma',
        childGender: 'MALE',
        childDob: new Date('2024-06-01'),
        parentName: 'Deepak Sharma',
        parentPhone,
        parentEmail,
        programType: 'PLAYGROUP',
        status: 'OFFER_ACCEPTED',
      },
    })

    // Create required verified documents
    await db.applicationDocument.createMany({
      data: [
        { applicationId: app.id, docType: 'BIRTH_CERTIFICATE', fileName: 'birth.pdf', verified: true, status: 'VERIFIED' },
        { applicationId: app.id, docType: 'PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
        { applicationId: app.id, docType: 'AADHAAR', fileName: 'aadhaar.pdf', verified: true, status: 'VERIFIED' },
      ],
    })

    const result = await AdmissionService.completeEnrollment(
      {
        tenantId,
        branchId,
        academicYearId: academicSessionId,
        actorId: 'admin_1',
        actorName: 'Admissions Admin',
        actorRole: 'TENANT_ADMIN',
      },
      app.id,
      { classroomId: classroom.id }
    )

    expect(result.student).toBeDefined()
    expect(result.parentUser).toBeDefined()
    expect(result.parentUser.status).toBe('PENDING')

    // Verify parentUser password is NOT the predictable "PreOne@entropy" pattern
    const isSyntheticPattern = await bcrypt.compare('PreOne@12345678', result.parentUser.passwordHash)
    expect(isSyntheticPattern).toBe(false)

    // Verify an activation UserInvitation was created for this parent
    const invitation = await db.userInvitation.findFirst({
      where: { tenantId, userId: result.parentUser.id },
    })
    expect(invitation).toBeDefined()
    expect(invitation!.role).toBe('PARENT')
    expect(invitation!.status).toBe('PENDING')
    expect(invitation!.tokenHash).toBeDefined()
    // Verify plaintext rawToken is strictly NULL in DB
    expect(invitation!.rawToken).toBeNull()
  })

  it('SEC-02: Zero-knowledge application invitation token storage (rawToken is null in DB)', async () => {
    const app = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        academicSessionId,
        applicationNumber: `APP-INV-${Date.now()}`,
        childFirstName: 'Aanya',
        childLastName: 'Gupta',
        childGender: 'FEMALE',
        parentName: 'Pooja Gupta',
        parentPhone: '+919812345678',
        parentEmail: `pooja.${Date.now()}@example.com`,
        programType: 'PLAYGROUP',
        status: 'SUBMITTED',
      },
    })

    const inviteResult = await AdmissionService.createApplicationInvitation(
      {
        tenantId,
        branchId,
        academicYearId: academicSessionId,
        actorId: 'admin_1',
        actorName: 'Admissions Admin',
        actorRole: 'TENANT_ADMIN',
      },
      app.id,
      app.parentEmail!
    )

    expect(inviteResult.rawToken).toBeDefined()
    expect(inviteResult.inviteUrl).toContain('/public/admissions/application?token=')

    // Verify DB record has NULL rawToken
    const dbRecord = await db.applicationInvitation.findUnique({
      where: { id: inviteResult.invitation.id },
    })
    expect(dbRecord).toBeDefined()
    expect(dbRecord!.rawToken).toBeNull()
    expect(dbRecord!.tokenHash).toBe(crypto.createHash('sha256').update(inviteResult.rawToken).digest('hex'))

    // Verify token can be verified using the rawToken
    const verified = await AdmissionService.verifyApplicationInvitation(inviteResult.rawToken)
    expect(verified.invitationId).toBe(dbRecord!.id)
    expect(verified.application.id).toBe(app.id)
  })

  it('SEC-03: Magic bytes validation rejects executable/script disguised as PDF or image', async () => {
    // Valid PDF (%PDF-)
    const validPdfBuffer = Buffer.from('%PDF-1.7 sample pdf content for admission document verification')
    expect(() => S3StorageService.validateBufferMagicBytes(validPdfBuffer, 'application/pdf')).not.toThrow()

    // Valid PNG (\x89PNG\r\n\x1a\n)
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00])
    expect(() => S3StorageService.validateBufferMagicBytes(validPngBuffer, 'image/png')).not.toThrow()

    // Valid JPEG (0xFF, 0xD8, 0xFF)
    const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    expect(() => S3StorageService.validateBufferMagicBytes(validJpegBuffer, 'image/jpeg')).not.toThrow()

    // Malicious shell script disguised as PDF
    const fakePdfBuffer = Buffer.from('#!/bin/bash\necho "exploit"')
    expect(() => S3StorageService.validateBufferMagicBytes(fakePdfBuffer, 'application/pdf')).toThrow(
      'File signature mismatch: expected valid PDF document'
    )

    // Malicious Windows PE executable disguised as PNG
    const fakePngBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00')
    expect(() => S3StorageService.validateBufferMagicBytes(fakePngBuffer, 'image/png')).toThrow(
      'File signature mismatch: expected valid PNG image'
    )

    // Direct upload with fake PDF via S3StorageService.uploadBufferToS3 is blocked
    await expect(
      S3StorageService.uploadBufferToS3({
        tenantId,
        category: 'documents',
        buffer: fakePdfBuffer,
        mimeType: 'application/pdf',
        originalName: 'birth-certificate.pdf',
      })
    ).rejects.toThrow('File signature mismatch')
  })

  it('SEC-04: Full Parent Activation lifecycle: single-use token sets password and activates user', async () => {
    // 1. Create a parent user in PENDING status with locked hash
    const parentEmail = `active.parent.${Date.now()}@example.com`
    const lockedHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
    const parentUser = await db.user.create({
      data: {
        email: parentEmail,
        phone: '+919988776655',
        username: `parent.${Date.now()}`,
        fullName: 'Anita Roy',
        passwordHash: lockedHash,
        status: 'PENDING',
        mustChangePassword: true,
      },
    })

    const membership = await db.tenantUser.create({
      data: {
        tenantId,
        userId: parentUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        status: 'ACTIVE',
      },
    })

    // 2. Generate invitation token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const invitation = await db.userInvitation.create({
      data: {
        tenantId,
        userId: parentUser.id,
        tenantUserId: membership.id,
        email: parentEmail,
        role: 'PARENT',
        tokenHash,
        rawToken: null,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // 3. Verify invitation token
    const verifyResult = await InvitationService.verifyInvitation(rawToken)
    expect(verifyResult.valid).toBe(true)
    expect(verifyResult.invitation?.email).toBe(parentEmail)

    // 4. Accept invitation and set new password
    const newPassword = 'SecurePassword@2026'
    const acceptResult = await InvitationService.acceptInvitation({
      token: rawToken,
      password: newPassword,
    })
    expect(acceptResult.success).toBe(true)

    // 5. Verify user is now ACTIVE and can authenticate with new password
    const updatedUser = await db.user.findUnique({ where: { id: parentUser.id } })
    expect(updatedUser!.status).toBe('ACTIVE')
    expect(updatedUser!.mustChangePassword).toBe(false)
    const passwordValid = await bcrypt.compare(newPassword, updatedUser!.passwordHash)
    expect(passwordValid).toBe(true)

    // 6. Token is single-use: Re-using token fails
    const reVerifyResult = await InvitationService.verifyInvitation(rawToken)
    expect(reVerifyResult.valid).toBe(false)
    expect(reVerifyResult.error).toContain('already been accepted')
  })

  it('SEC-05: Demo OTP fails closed in production environment', () => {
    const originalEnv = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = 'production'
      // Even if someone set ALLOW_DEMO_OTP = 'true', production MUST fail closed
      process.env.ALLOW_DEMO_OTP = 'true'
      expect(isDemoOtpAllowed()).toBe(false)

      process.env.ALLOW_DEMO_OTP = 'false'
      expect(isDemoOtpAllowed()).toBe(false)
    } finally {
      process.env.NODE_ENV = originalEnv
      delete process.env.ALLOW_DEMO_OTP
    }
  })
})
