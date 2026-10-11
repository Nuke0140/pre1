import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { S3StorageService } from '@/lib/storage/s3-storage-service'
import { saveUserProfilePhoto, saveBrandingAsset, deleteUserProfilePhoto, deleteBrandingAsset } from '@/lib/storage'
import { UserPhotoService } from '@/lib/users/user-photo-service'
import { FamilyUserService } from '@/lib/users/family-user-service'
import { normalizeFamilyCreateInput } from '@/lib/users/user-validation'
import { NextRequest } from 'next/server'
import { POST as usersPost } from '@/app/api/v1/users/route'
import { POST as userPhotoPost, DELETE as userPhotoDelete } from '@/app/api/v1/users/photo/route'
import { POST as presignPost } from '@/app/api/v1/uploads/presign/route'
import { PUT as mockS3Put } from '@/app/api/v1/uploads/mock-s3/route'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

describe('QA Blockers: Family Account, Staff/Teacher Onboarding & S3 Centralized Storage', () => {
  const ts = Date.now().toString()
  let tenant: any
  let branch: any
  let classroom: any
  let adminUser: any
  let adminCookie: string

  beforeAll(async () => {
    // 1. Setup Tenant & Branch
    tenant = await db.tenant.create({
      data: {
        code: `QA-${ts.slice(-6)}`,
        name: `QA Academy ${ts.slice(-4)}`,
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

    const sessionRecord = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: `Session ${ts.slice(-4)}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    classroom = await db.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: sessionRecord.id,
        name: `Class 1A ${ts.slice(-4)}`,
        code: `C1A-${ts.slice(-4)}`,
        capacity: 20,
        programType: 'PLAYGROUP',
      },
    })

    // 2. Setup Admin Actor
    adminUser = await db.user.create({
      data: {
        email: `admin.${ts}@example.com`,
        fullName: 'Principal Admin',
        status: 'ACTIVE',
        passwordHash: '$2b$10$epGk0b...hashplaceholder',
        memberships: {
          create: {
            tenantId: tenant.id,
            branchId: branch.id,
            role: 'OWNER',
          },
        },
      },
    })

    const token = await signSession({
      uid: adminUser.id,
      email: adminUser.email,
      name: adminUser.fullName,
      tenantId: tenant.id,
      branchId: branch.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    adminCookie = `${SESSION_COOKIE}=${token}`
  })

  describe('Blocker 1: Parent / Family Account Creation', () => {
    it('normalizes family create input correctly with child gender and existing child mode', () => {
      const normalizedExisting = normalizeFamilyCreateInput({
        tenantId: tenant.id,
        branchId: branch.id,
        parentName: 'Jane Doe',
        parentPhone: '+1987654321',
        parentGender: 'FEMALE',
        childMode: 'EXISTING',
        existingStudentId: 'student-123',
        childGender: 'MALE',
      })

      expect(normalizedExisting.childMode).toBe('EXISTING')
      expect(normalizedExisting.existingChild?.studentId).toBe('student-123')
      expect(normalizedExisting.newChild).toBeUndefined()

      const normalizedNew = normalizeFamilyCreateInput({
        tenantId: tenant.id,
        branchId: branch.id,
        parentName: 'John Doe',
        parentPhone: '+1987654322',
        parentGender: 'MALE',
        childMode: 'NEW',
        childFirstName: 'Bobby',
        childLastName: 'Doe',
        childGender: 'MALE',
        childDob: '2020-01-01',
      })

      expect(normalizedNew.childMode).toBe('CREATE')
      expect(normalizedNew.newChild).toBeDefined()
      expect(normalizedNew.newChild?.firstName).toBe('Bobby')
      expect(normalizedNew.newChild?.gender).toBe('MALE')
    })

    it('creates a family account with new child via POST /api/v1/users', async () => {
      const payload = {
        userType: 'FAMILY',
        tenantId: tenant.id,
        branchId: branch.id,
        parentName: 'Martha Kent',
        parentPhone: `+9198${ts.slice(-8)}`,
        parentEmail: `martha.${ts}@example.com`,
        parentGender: 'FEMALE',
        relationship: 'MOTHER',
        childMode: 'NEW',
        childFirstName: 'Clark',
        childLastName: 'Kent',
        childGender: 'MALE',
        childDob: '2021-05-10',
        password: 'Password@123',
        pin: '1234',
        sendInvite: false,
      }

      const req = new NextRequest('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify(payload),
      })

      const res = await usersPost(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data?.parent).toBeDefined()
      expect(json.data?.parent.fullName).toBe('Martha Kent')
      expect(json.data?.student).toBeDefined()
      expect(json.data?.student.firstName).toBe('Clark')

      // Verify DB persistence
      const savedUser = await db.user.findUnique({
        where: { id: json.data.parent.id },
        include: { guardianProfile: { include: { studentLinks: { include: { student: true } } } } },
      })

      expect(savedUser).not.toBeNull()
      expect(savedUser?.guardianProfile).not.toBeNull()
      expect(savedUser?.guardianProfile?.studentLinks.length).toBe(1)
      expect(savedUser?.guardianProfile?.studentLinks[0].student.firstName).toBe('Clark')
    })

    it('links an existing student to a new family user', async () => {
      // 1. Create a standalone student first
      const student = await db.student.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          firstName: 'Bruce',
          lastName: 'Wayne',
          gender: 'MALE',
          dob: new Date('2020-03-30'),
          admissionNo: `ADM-${ts.slice(-4)}-BW`,
          status: 'ACTIVE',
        },
      })

      const payload = {
        userType: 'FAMILY',
        tenantId: tenant.id,
        branchId: branch.id,
        parentName: 'Alfred Pennyworth',
        parentPhone: `+9197${ts.slice(-8)}`,
        parentEmail: `alfred.${ts}@example.com`,
        parentGender: 'MALE',
        relationship: 'GUARDIAN',
        childMode: 'EXISTING',
        existingStudentId: student.id,
        password: 'Password@123',
      }

      const req = new NextRequest('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify(payload),
      })

      const res = await usersPost(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data?.student.id).toBe(student.id)

      // Verify DB link
      const links = await db.studentGuardian.findMany({
        where: { studentId: student.id },
      })
      expect(links.length).toBe(1)
    })
  })

  describe('Blocker 2 & 3: Staff & Teacher Onboarding Workflow', () => {
    it('creates a teacher account with employee code, classroom assignment, and login credentials', async () => {
      const payload = {
        fullName: 'Sarah Teacher',
        email: `sarah.teacher.${ts}@example.com`,
        phone: `+9196${ts.slice(-8)}`,
        gender: 'FEMALE',
        userType: 'STAFF',
        primaryRole: 'TEACHER',
        employeeCode: `EMP-T-${ts.slice(-4)}`,
        jobDesignation: 'Lead Educator',
        branchId: branch.id,
        classroomId: classroom.id,
        teachingSubject: 'Early Math & Reading',
        username: `sarah_t_${ts.slice(-4)}`,
        password: 'TeacherPassword123',
        status: 'ACTIVE',
      }

      const req = new NextRequest('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify(payload),
      })

      const res = await usersPost(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data?.fullName).toBe('Sarah Teacher')
      expect(json.data?.role).toBe('TEACHER')
      expect(json.data?.username).toBe(`sarah_t_${ts.slice(-4)}`)

      // Verify database record
      const dbStaff = await db.user.findUnique({
        where: { id: json.data.userId || json.data.id },
        include: {
          staffProfile: true,
          memberships: true,
        },
      })

      expect(dbStaff).not.toBeNull()
      expect(dbStaff?.passwordHash).toBeDefined()
      expect(dbStaff?.passwordHash?.length).toBeGreaterThan(10)
      expect(dbStaff?.staffProfile?.employeeCode).toBe(`EMP-T-${ts.slice(-4)}`)

      // Verify classroom teacher assignment
      const dbClassroom = await db.classroom.findUnique({
        where: { id: classroom.id },
      })
      expect(dbClassroom?.primaryTeacherId).toBe(json.data.userId)
    })

    it('rejects staff creation if required fields are missing', async () => {
      const payload = {
        userType: 'STAFF',
        fullName: 'Incomplete Staff',
        // missing email, role, etc.
      }

      const req = new NextRequest('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify(payload),
      })

      const res = await usersPost(req)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Blocker 4: Centralized S3 Photo Storage Architecture', () => {
    it('generates secure tenant-isolated S3 object keys and prevents traversal', () => {
      const key = S3StorageService.generateObjectKey('tenant-123', 'avatars', 'profile.png', 'image/png')
      expect(key.startsWith('tenants/tenant-123/avatars/')).toBe(true)
      expect(key.endsWith('.png')).toBe(true)

      // Test path traversal sanitization
      const dangerousKey = S3StorageService.generateObjectKey('../../bad/tenant', '../etc', 'avatar.jpg', 'image/jpeg')
      expect(dangerousKey).not.toContain('..')
      expect(dangerousKey.startsWith('tenants/badtenant/etc/')).toBe(true)
    })

    it('generates pre-signed upload URL for direct browser-to-S3 flow', async () => {
      const presign = await S3StorageService.createPresignedUploadUrl({
        tenantId: tenant.id,
        category: 'avatars',
        filename: 'my-avatar.webp',
        mimeType: 'image/webp',
        sizeBytes: 1024 * 50,
      })

      expect(presign.key).toBeDefined()
      expect(presign.key).toContain(`tenants/${tenant.id}/avatars/`)
      expect(presign.uploadUrl).toBeDefined()
      expect(presign.fileUrl).toBeDefined()
      expect(presign.expiresIn).toBe(300)
    })

    it('uploads buffer to S3 storage service without local disk writes', async () => {
      const fakeBuffer = Buffer.from('FAKE_IMAGE_DATA_FOR_AVATAR')
      const result = await S3StorageService.uploadBufferToS3({
        tenantId: tenant.id,
        category: 'avatars',
        buffer: fakeBuffer,
        mimeType: 'image/png',
        originalName: 'test.png',
      })

      expect(result.url).toBeDefined()
      expect(result.key).toContain(`tenants/${tenant.id}/avatars/`)
      expect(result.size).toBe(fakeBuffer.length)

      // Verify object exists in storage
      const verify = await S3StorageService.verifyObject(result.key)
      expect(verify.exists).toBe(true)

      // Delete object
      const deleted = await S3StorageService.deleteObject(result.url)
      expect(deleted).toBe(true)
    })

    it('handles direct presigned API and mock S3 upload endpoint seamlessly', async () => {
      // 1. Request presigned URL via API route
      const presignReq = new NextRequest('http://localhost:3000/api/v1/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          category: 'avatars',
          filename: 'avatar.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 2048,
        }),
      })

      const presignRes = await presignPost(presignReq)
      const presignJson = await presignRes.json()

      expect(presignRes.status).toBe(200)
      expect(presignJson.success).toBe(true)
      expect(presignJson.data?.uploadUrl).toBeDefined()
      expect(presignJson.data?.key).toBeDefined()

      // 2. Simulate client direct PUT upload to uploadUrl
      const putReq = new NextRequest(`http://localhost:3000${presignJson.data.uploadUrl}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: Buffer.from('TEST_DIRECT_PUT_BYTES'),
      })

      const putRes = await mockS3Put(putReq)
      const putJson = await putRes.json()

      expect(putRes.status).toBe(200)
      expect(putJson.success).toBe(true)
      expect(putJson.data?.uploaded).toBe(true)
    })

    it('uploads multipart avatar photo through /api/v1/users/photo route and updates S3 reference', async () => {
      const formData = new FormData()
      const blob = new Blob(['PNG_TEST_CONTENT'], { type: 'image/png' })
      formData.append('file', blob, 'my-test-photo.png')

      const req = new NextRequest('http://localhost:3000/api/v1/users/photo', {
        method: 'POST',
        headers: {
          Cookie: adminCookie,
        },
        body: formData,
      })

      const res = await userPhotoPost(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data?.url).toBeDefined()
      expect(json.data?.url).toContain(`tenants/${tenant.id}/avatars/`)

      // Delete via API
      const deleteReq = new NextRequest('http://localhost:3000/api/v1/users/photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({ url: json.data.url }),
      })

      const deleteRes = await userPhotoDelete(deleteReq)
      const deleteJson = await deleteRes.json()

      expect(deleteRes.status).toBe(200)
      expect(deleteJson.success).toBe(true)
    })

    it('saves and deletes school branding logo using S3 storage without disk writes', async () => {
      const logoBuffer = Buffer.from('FAKE_BRANDING_LOGO_SVG_OR_PNG')
      const saved = await saveBrandingAsset({
        tenantId: tenant.id,
        type: 'logo',
        buffer: logoBuffer,
        mimeType: 'image/png',
        originalName: 'logo.png',
      })

      expect(saved.url).toContain(`tenants/${tenant.id}/branding/`)
      expect(saved.size).toBe(logoBuffer.length)

      // Cleanup
      await deleteBrandingAsset(saved.url)
    })

    it('updates user avatarUrl in database through UserPhotoService with S3 integration', async () => {
      // Create user to attach photo
      const testUser = await db.user.create({
        data: {
          fullName: 'Test Photo User',
          email: `photo.user.${ts}@example.com`,
          status: 'ACTIVE',
          passwordHash: '$2b$10$epGk0b...hashplaceholder',
          memberships: {
            create: {
              tenantId: tenant.id,
              branchId: branch.id,
              role: 'PARENT',
            },
          },
        },
      })

      const photoBuffer = Buffer.from('USER_AVATAR_PHOTO_PAYLOAD')
      const photoResult = await UserPhotoService.saveSingleUserPhoto({
        userId: testUser.id,
        tenantId: tenant.id,
        fileBuffer: photoBuffer,
        mimeType: 'image/jpeg',
        originalFilename: 'user-photo.jpg',
        actor: {
          id: adminUser.id,
          name: adminUser.fullName,
          role: adminUser.role,
        },
      })

      expect(photoResult.success).toBe(true)
      expect(photoResult.avatarUrl).toContain(`tenants/${tenant.id}/avatars/`)

      // Verify in DB
      const updatedUser = await db.user.findUnique({
        where: { id: testUser.id },
        select: { avatarUrl: true },
      })
      expect(updatedUser?.avatarUrl).toBe(photoResult.avatarUrl)

      // Remove photo
      const removeResult = await UserPhotoService.removeUserPhoto({
        userId: testUser.id,
        tenantId: tenant.id,
        actor: {
          id: adminUser.id,
          name: adminUser.fullName,
          role: adminUser.role,
        },
      })

      expect(removeResult.success).toBe(true)

      const clearedUser = await db.user.findUnique({
        where: { id: testUser.id },
        select: { avatarUrl: true },
      })
      expect(clearedUser?.avatarUrl).toBeNull()
    })
  })
})
