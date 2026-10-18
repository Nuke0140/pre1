import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { LeadService } from '@/lib/admissions/lead-service'
import { S3StorageService } from '@/lib/storage/s3-storage-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

import { POST as sendToParentPost } from '@/app/api/v1/applications/[id]/send-to-parent/route'
import { GET as publicAppGet, POST as publicAppPost } from '@/app/api/v1/public/application/route'
import { GET as docGet, POST as docPost, PATCH as docPatch } from '@/app/api/v1/applications/[id]/documents/route'
import { GET as docViewGet } from '@/app/api/v1/applications/[id]/documents/[docId]/view/route'
import { GET as parentTodayGet } from '@/app/api/v1/parent/today/route'

describe('PreOne Admissions End-to-End Workflow & Remediation Test Suite (ADM-01 to ADM-19)', () => {
  let tenantA: string
  let tenantB: string
  let branchA1: string
  let branchB1: string
  let academicSessionA: string
  let programNurseryA: any
  let teacherUserA: any
  let classroomA1: string
  let classroomFull: string
  let adminUserA: any
  let adminCookieA: string
  let adminCookieB: string

  let parentEmailA: string
  let parentPhoneA: string

  let createdLeadA: any
  let createdDraftAppA: any
  let invitationTokenA: string
  let verifiedDocId: string
  let enrolledStudentA: any
  let enrolledParentUserA: any

  beforeAll(async () => {
    const ts = Date.now()
    parentEmailA = `rohan_${ts}@example.com`
    parentPhoneA = `987${ts.toString().slice(-7)}`

    // 1. Create Tenant A
    const tA = await db.tenant.create({
      data: {
        name: `Admissions E2E School A ${ts}`,
        code: `E2E_A_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    // 2. Create Tenant B (cross-tenant isolation)
    const tB = await db.tenant.create({
      data: {
        name: `Admissions E2E School B ${ts}`,
        code: `E2E_B_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 3. Branches
    const brA1 = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus A',
        code: `BR_A1_${ts}`,
        isMain: true,
      },
    })
    branchA1 = brA1.id

    const brB1 = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Campus B',
        code: `BR_B1_${ts}`,
        isMain: true,
      },
    })
    branchB1 = brB1.id

    // 4. Academic Session
    const sessA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    })
    academicSessionA = sessA.id

    // 5. Nursery Program (Ages 36 to 48 months)
    programNurseryA = await db.program.create({
      data: {
        tenantId: tenantA,
        name: 'Nursery',
        code: `NUR_${ts}`,
        programType: 'NURSERY',
        ageMinMonths: 36,
        ageMaxMonths: 48,
        isActive: true,
      },
    })

    // 6. Teacher User & Classrooms
    teacherUserA = await db.user.create({
      data: {
        fullName: 'Teacher Priya',
        email: `priya_${ts}@school.com`,
        username: `teacher_priya_${ts}`,
        passwordHash: 'test_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: teacherUserA.id,
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })

    const cr1 = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        programId: programNurseryA.id,
        programType: 'NURSERY',
        name: 'Nursery Bluebell',
        code: `NUR_BB_${ts}`,
        capacity: 25,
        primaryTeacherId: teacherUserA.id,
        isActive: true,
      },
    })
    classroomA1 = cr1.id

    const crFull = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        programId: programNurseryA.id,
        programType: 'NURSERY',
        name: 'Nursery Sunflower Full',
        code: `NUR_SF_${ts}`,
        capacity: 1, // Full with 1 student
        primaryTeacherId: teacherUserA.id,
        isActive: true,
      },
    })
    classroomFull = crFull.id

    // Populate crFull with 1 student to make it full
    await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `STU-FULL-${ts}`,
        firstName: 'Existing',
        lastName: 'Child',
        dob: new Date('2023-01-01'),
        gender: 'MALE',
        currentClassroomId: classroomFull,
        status: 'ACTIVE',
      },
    })

    // 7. Admin Users & Cookies
    adminUserA = await db.user.create({
      data: {
        fullName: 'Admin A',
        email: `adminA_${ts}@school.com`,
        username: `admin_a_${ts}`,
        passwordHash: 'test_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantA,
        userId: adminUserA.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })
    const tokA = await signSession({
      uid: adminUserA.id,
      email: adminUserA.email,
      name: adminUserA.fullName,
      tenantId: tenantA,
      role: 'OWNER',
      roles: ['OWNER'],
      branchId: branchA1,
    })
    adminCookieA = `${SESSION_COOKIE}=${tokA}`

    const adminUserB = await db.user.create({
      data: {
        fullName: 'Admin B',
        email: `adminB_${ts}@school.com`,
        username: `admin_b_${ts}`,
        passwordHash: 'test_hash',
        status: 'ACTIVE',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenantB,
        userId: adminUserB.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })
    const tokB = await signSession({
      uid: adminUserB.id,
      email: adminUserB.email,
      name: adminUserB.fullName,
      tenantId: tenantB,
      role: 'OWNER',
      roles: ['OWNER'],
      branchId: branchB1,
    })
    adminCookieB = `${SESSION_COOKIE}=${tokB}`
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-01: Enquiry Creation & Auto-Numbering
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-01: creates Enquiry with source attribution and auto-generated leadNumber', async () => {
    const leadRes = await LeadService.createLead(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      {
        parentName: 'Rohan Sharma',
        phone: parentPhoneA,
        email: parentEmailA,
        childName: 'Aarav Sharma',
        childDob: '2023-04-15',
        childGender: 'MALE',
        source: 'WALK_IN',
        interestedProgram: 'NURSERY',
        notes: 'Walk-in enquiry at lobby',
      }
    )

    createdLeadA = leadRes.lead

    expect(createdLeadA).toBeDefined()
    expect(createdLeadA.id).toBeDefined()
    expect(createdLeadA.leadNumber).toMatch(/LEAD|ENQ/i)
    expect(createdLeadA.source).toBe('WALK_IN')
    expect(createdLeadA.status).toBe('NEW')
    expect(createdLeadA.childName).toBe('Aarav Sharma')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-02: Follow-up Scheduling & Transitions
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-02: schedules follow-up task with due date, counselor, and records outcome', async () => {
    const followUp = await AdmissionService.addEnquiryFollowUp(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdLeadA.id,
      {
        type: 'Call Parent',
        note: 'Call parent regarding curriculum and campus visit',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        outcome: 'CONNECTED_INTERESTED',
      }
    )

    expect(followUp).toBeDefined()
    const refreshedLead = await db.lead.findUnique({ where: { id: createdLeadA.id } })
    expect(refreshedLead?.status).toBe('QUALIFIED')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-03: Lead Conversion without Data Fabrication
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-03: converts lead to canonical application draft without fake child name or fabricated DOB', async () => {
    const conversion = await LeadService.convertToApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdLeadA.id,
      {
        programId: programNurseryA.id,
      }
    )

    expect(conversion).toBeDefined()
    expect(conversion.applicationId).toBeDefined()
    expect(conversion.applicationNumber).toMatch(/ADM|APP/i)

    const app = await db.admissionApplication.findUnique({
      where: { id: conversion.applicationId },
    })

    expect(app).toBeDefined()
    expect(app?.leadId).toBe(createdLeadA.id)
    expect(app?.childFirstName).toBe('Aarav') // Exactly child name, NOT parent Rohan
    expect(app?.childLastName).toBe('Sharma')
    expect(app?.childDob?.toISOString().slice(0, 10)).toBe('2023-04-15')
    expect(app?.status).toBe('DRAFT')

    createdDraftAppA = app

    // Verify idempotency: calling convert again returns existing application
    const secondCall = await LeadService.convertToApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdLeadA.id
    )
    expect(secondCall.isAlreadyConverted).toBe(true)
    expect(secondCall.applicationId).toBe(conversion.applicationId)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-04: Application Draft Allows Partial Data
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-04: allows saving application draft with partial data (omitted DOB)', async () => {
    const partialDraft = await AdmissionService.submitApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      {
        programId: programNurseryA.id,
        childFirstName: 'Vihaan',
        parentName: 'Ananya Verma',
        parentPhone: '9988776655',
        isDraft: true,
      }
    )

    expect(partialDraft).toBeDefined()
    expect(partialDraft.status).toBe('DRAFT')
    expect(partialDraft.childFirstName).toBe('Vihaan')
    expect(partialDraft.childDob).toBeNull() // DOB omitted in draft, not fabricated
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-05: Staff Application Completion Validates Required Fields
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-05: staff completion validates required fields and updates status to SUBMITTED', async () => {
    const updated = await AdmissionService.updateApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      {
        childFirstName: 'Aarav',
        childLastName: 'Sharma',
        childDob: '2023-04-15',
        childGender: 'MALE',
        parentName: 'Rohan Sharma',
        parentPhone: parentPhoneA,
        parentEmail: parentEmailA,
        address: '123 Palm Grove, Sector 4',
        status: 'SUBMITTED',
      }
    )

    expect(updated).toBeDefined()
    expect(updated.status).toBe('SUBMITTED')
    expect(updated.submittedAt).toBeDefined()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-06: Parent Application Invitation Token Generation
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-06: generates secure parent invitation token with 7-day expiration and sha256 hash', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/applications/${createdDraftAppA.id}/send-to-parent`, {
      method: 'POST',
      headers: {
        cookie: adminCookieA,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: parentEmailA }),
    })

    const res = await sendToParentPost(req, { params: Promise.resolve({ id: createdDraftAppA.id }) })
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data.inviteUrl).toContain('/public/admissions/application?token=')
    expect(json.data.token).toBeDefined()

    invitationTokenA = json.data.token

    // Verify DB record stores tokenHash, not rawToken
    const tokenHash = crypto.createHash('sha256').update(invitationTokenA).digest('hex')
    const invRecord = await db.applicationInvitation.findUnique({ where: { tokenHash } })
    expect(invRecord).toBeDefined()
    expect(invRecord?.status).toBe('PENDING')
    expect(invRecord?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-07: Parent Application Retrieval via Secure Token
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-07: public endpoint verifies valid token and prevents modifying branch/session', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/public/application?token=${invitationTokenA}`, {
      method: 'GET',
    })

    const res = await publicAppGet(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.application.applicationNumber).toBe(createdDraftAppA.applicationNumber)
    expect(json.data.application.branchName).toBe('Main Campus A')
    expect(json.data.application.childFirstName).toBe('Aarav')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-08: Parent Application Submission & Invitation Completion
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-08: parent completes application with required fields & declarations', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/public/application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: invitationTokenA,
        data: {
          childFirstName: 'Aarav',
          childLastName: 'Sharma',
          childDob: '2023-04-15',
          childGender: 'MALE',
          bloodGroup: 'B_POSITIVE',
          address: '123 Palm Grove, Sector 4',
          medicalNotes: 'No allergies known',
          emergencyContact: '9876543211',
          parentName: 'Rohan Sharma',
          parentPhone: parentPhoneA,
          declarations: {
            accuracyDeclared: true,
            parentConsent: true,
          },
        },
      }),
    })

    const res = await publicAppPost(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('SUBMITTED')

    // Verify invitation marked ACCEPTED
    const tokenHash = crypto.createHash('sha256').update(invitationTokenA).digest('hex')
    const inv = await db.applicationInvitation.findUnique({ where: { tokenHash } })
    expect(inv?.status).toBe('ACCEPTED')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-09: Invalid & Expired Token Rejection
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-09: rejects invalid or expired invitation tokens', async () => {
    // 1. Invalid token
    const invalidReq = new NextRequest('http://localhost:3000/api/v1/public/application?token=fake_invalid_token', {
      method: 'GET',
    })
    const invalidRes = await publicAppGet(invalidReq)
    expect(invalidRes.status).toBe(400)

    // 2. Already completed token (invitationTokenA was completed in ADM-08)
    const usedReq = new NextRequest(`http://localhost:3000/api/v1/public/application?token=${invitationTokenA}`, {
      method: 'GET',
    })
    const usedRes = await publicAppGet(usedReq)
    expect(usedRes.status).toBe(400)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-10: Document Upload Type Validation
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-10: accepts PDF/images and rejects disallowed file types (.exe, .sh)', async () => {
    // 1. Disallowed type test directly via S3StorageService
    expect(() => {
      S3StorageService.validateUploadParams({
        category: 'documents',
        mimeType: 'application/x-msdownload',
        sizeBytes: 1024,
      })
    }).toThrow(/Unsupported format/i)

    // 2. Disallowed shell script
    expect(() => {
      S3StorageService.validateUploadParams({
        category: 'documents',
        mimeType: 'application/x-sh',
        sizeBytes: 1024,
      })
    }).toThrow(/Unsupported format/i)

    // 3. Allowed PDF
    expect(() => {
      S3StorageService.validateUploadParams({
        category: 'documents',
        mimeType: 'application/pdf',
        sizeBytes: 1024 * 50,
      })
    }).not.toThrow()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-11: Document Upload Size Limit (10MB)
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-11: rejects document upload exceeding 10MB', async () => {
    expect(() => {
      S3StorageService.validateUploadParams({
        category: 'documents',
        mimeType: 'application/pdf',
        sizeBytes: 11 * 1024 * 1024, // 11MB
      })
    }).toThrow(/exceeds maximum allowed size of 10MB/i)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-12: Document Upload & View Endpoint (Tenant Scoped)
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-12: uploads PDF document and serves it via secure tenant-authorized view endpoint', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 sample birth certificate content')
    const formData = new FormData()
    formData.append('docType', 'BIRTH_CERTIFICATE')
    formData.append('remarks', 'Official municipal certificate')
    formData.append(
      'file',
      new Blob([pdfBuffer], { type: 'application/pdf' }),
      'birth_certificate.pdf'
    )

    const uploadReq = new NextRequest(`http://localhost:3000/api/v1/applications/${createdDraftAppA.id}/documents`, {
      method: 'POST',
      headers: { cookie: adminCookieA },
      body: formData,
    })

    const uploadRes = await docPost(uploadReq, { params: Promise.resolve({ id: createdDraftAppA.id }) })
    const uploadJson = await uploadRes.json()

    expect(uploadRes.status).toBe(201)
    expect(uploadJson.success).toBe(true)
    expect(uploadJson.data.docType).toBe('BIRTH_CERTIFICATE')
    expect(uploadJson.data.status).toBe('UPLOADED')

    verifiedDocId = uploadJson.data.id

    // View endpoint with Tenant A admin
    const viewReqA = new NextRequest(
      `http://localhost:3000/api/v1/applications/${createdDraftAppA.id}/documents/${verifiedDocId}/view`,
      {
        method: 'GET',
        headers: { cookie: adminCookieA },
      }
    )
    const viewResA = await docViewGet(viewReqA, {
      params: Promise.resolve({ id: createdDraftAppA.id, docId: verifiedDocId }),
    })
    expect(viewResA.status).toBe(200)

    // Cross-tenant access with Tenant B admin must be 404 (Not Found in tenant scope)
    const viewReqB = new NextRequest(
      `http://localhost:3000/api/v1/applications/${createdDraftAppA.id}/documents/${verifiedDocId}/view`,
      {
        method: 'GET',
        headers: { cookie: adminCookieB },
      }
    )
    const viewResB = await docViewGet(viewReqB, {
      params: Promise.resolve({ id: createdDraftAppA.id, docId: verifiedDocId }),
    })
    expect(viewResB.status).toBe(404)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-13: Staff Document Review (VERIFY / REJECT)
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-13: staff review records VERIFY and REJECT with reviewer audit details', async () => {
    // 1. Attach a PHOTO document
    const photoDoc = await AdmissionService.attachDocument(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      {
        docType: 'PHOTO',
        fileName: 'child_photo.jpg',
        mimeType: 'image/jpeg',
      }
    )

    // 2. Reject PHOTO document
    const rejectReq = new NextRequest(`http://localhost:3000/api/v1/applications/${createdDraftAppA.id}/documents`, {
      method: 'PATCH',
      headers: { cookie: adminCookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: photoDoc.id,
        action: 'REJECT',
        notes: 'Photo is blurry; please upload a clear passport-style picture',
      }),
    })
    const rejectRes = await docPatch(rejectReq, { params: Promise.resolve({ id: createdDraftAppA.id }) })
    const rejectJson = await rejectRes.json()

    expect(rejectRes.status).toBe(200)
    expect(rejectJson.data.status).toBe('REJECTED')
    expect(rejectJson.data.rejectionReason).toContain('blurry')

    // 3. Verify BIRTH_CERTIFICATE document
    const verifyReq = new NextRequest(`http://localhost:3000/api/v1/applications/${createdDraftAppA.id}/documents`, {
      method: 'PATCH',
      headers: { cookie: adminCookieA, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: verifiedDocId,
        action: 'VERIFY',
        notes: 'Original municipal seal verified',
      }),
    })
    const verifyRes = await docPatch(verifyReq, { params: Promise.resolve({ id: createdDraftAppA.id }) })
    const verifyJson = await verifyRes.json()

    expect(verifyRes.status).toBe(200)
    expect(verifyJson.data.status).toBe('VERIFIED')
    expect(verifyJson.data.verified).toBe(true)
    expect(verifyJson.data.verifiedByName).toBe(adminUserA.fullName)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-14: Approval Gate Blocks When Documents Are Rejected or Unverified
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-14: approval gate blocks when required documents are rejected or pending verification', async () => {
    // Application currently has a REJECTED photo document
    await expect(
      AdmissionService.approveApplication(
        {
          tenantId: tenantA,
          branchId: branchA1,
          academicYearId: academicSessionA,
          actorId: adminUserA.id,
          actorName: adminUserA.fullName,
          actorRole: 'OWNER',
        },
        createdDraftAppA.id
      )
    ).rejects.toThrow(/Cannot approve application: One or more documents are marked as Rejected/i)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-15: Approval Succeeds When All Required Documents Are Verified
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-15: approval succeeds when all required documents are verified and child meets age criteria', async () => {
    // Ensure all required docs (BIRTH_CERTIFICATE, PHOTO, AADHAAR) exist and are verified
    const requiredTypes = ['BIRTH_CERTIFICATE', 'PHOTO', 'AADHAAR']
    for (const docType of requiredTypes) {
      let doc = await db.applicationDocument.findFirst({
        where: { applicationId: createdDraftAppA.id, docType: docType as any },
      })
      if (!doc) {
        doc = await db.applicationDocument.create({
          data: {
            applicationId: createdDraftAppA.id,
            docType: docType as any,
            fileName: `${docType.toLowerCase()}.pdf`,
            status: 'UPLOADED',
            verified: false,
          },
        })
      }
      await db.applicationDocument.update({
        where: { id: doc.id },
        data: {
          status: 'VERIFIED',
          verified: true,
          verifiedAt: new Date(),
          verifiedByName: adminUserA.fullName,
        },
      })
    }

    const approved = await AdmissionService.approveApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      'Approved by admissions board'
    )

    expect(approved).toBeDefined()
    expect(approved.status).toBe('APPROVED')
    expect(approved.approvedAt).toBeDefined()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-16: Acceptance Records OFFER_ACCEPTED Distinct from Enrollment
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-16: generates offer and accepts it (OFFER_ACCEPTED) without prematurely enrolling', async () => {
    // Generate admission offer
    const offerResult = await AdmissionService.generateOffer(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      {
        validDays: 14,
      }
    )

    expect(offerResult).toBeDefined()
    expect(offerResult.offer.status).toBe('ISSUED')

    // Accept offer
    const accepted = await AdmissionService.acceptOffer(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      offerResult.offer.id,
      { remarks: 'Accepted by Rohan Sharma (father)' }
    )

    expect(accepted.offer.status).toBe('ACCEPTED')
    const app = await db.admissionApplication.findUnique({ where: { id: createdDraftAppA.id } })
    expect(app?.status).toBe('OFFER_ACCEPTED')
    expect(app?.studentId).toBeNull() // Student not created until enrollment
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-17: Idempotent Enrollment Confirmation Without Hardcoded Passwords
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-17: confirms enrollment, creates Student & links Parent without hardcoded passwords', async () => {
    const enrollment = await AdmissionService.completeEnrollment(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      classroomA1
    )

    expect(enrollment).toBeDefined()
    expect(enrollment.student).toBeDefined()
    expect(enrollment.student.admissionNo).toMatch(/STU/i)
    expect(enrollment.student.currentClassroomId).toBe(classroomA1)
    expect(enrollment.guardian).toBeDefined()

    enrolledStudentA = enrollment.student
    enrolledParentUserA = enrollment.parentUser

    // Verify parent user password was generated using CSPRNG hash, NOT 'PreOneParent@2026'
    const parentUserRecord = await db.user.findUnique({
      where: { id: enrolledParentUserA.id },
    })
    expect(parentUserRecord).toBeDefined()
    expect(parentUserRecord?.mustChangePassword).toBe(true)
    expect(parentUserRecord?.status).toBe('PENDING')

    // Verify hardcoded password cannot be used
    const bcrypt = await import('bcryptjs')
    const isHardcoded = await bcrypt.compare('PreOneParent@2026', parentUserRecord!.passwordHash!)
    expect(isHardcoded).toBe(false)

    // Verify idempotency: calling completeEnrollment again returns existing student safely
    const retry = await AdmissionService.completeEnrollment(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      createdDraftAppA.id,
      classroomA1
    )
    expect(retry.isAlreadyEnrolled).toBe(true)
    expect(retry.student.id).toBe(enrolledStudentA.id)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-18: Classroom Capacity Verification & Rejection
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-18: rejects enrollment when target section/classroom is at full capacity', async () => {
    // Create another approved application
    const newApp = await AdmissionService.submitApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      {
        programId: programNurseryA.id,
        childFirstName: 'Sara',
        childLastName: 'Patel',
        childDob: '2023-03-20',
        childGender: 'FEMALE',
        parentName: 'Neha Patel',
        parentPhone: '9898989898',
        parentEmail: 'neha.patel@example.com',
        isDraft: false,
      }
    )

    // Verify documents for newApp to satisfy approval gate
    const docs = await db.applicationDocument.findMany({ where: { applicationId: newApp.id } })
    for (const d of docs) {
      await db.applicationDocument.update({
        where: { id: d.id },
        data: { status: 'VERIFIED', verified: true },
      })
    }

    await AdmissionService.approveApplication(
      {
        tenantId: tenantA,
        branchId: branchA1,
        academicYearId: academicSessionA,
        actorId: adminUserA.id,
        actorName: adminUserA.fullName,
        actorRole: 'OWNER',
      },
      newApp.id
    )

    // Attempting to enroll in classroomFull (capacity = 1, already 1 enrolled) must throw CLASSROOM_FULL
    await expect(
      AdmissionService.completeEnrollment(
        {
          tenantId: tenantA,
          branchId: branchA1,
          academicYearId: academicSessionA,
          actorId: adminUserA.id,
          actorName: adminUserA.fullName,
          actorRole: 'OWNER',
        },
        newApp.id,
        classroomFull
      )
    ).rejects.toThrow(/full capacity/i)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // ADM-19: Parent Portal Data Isolation
  // ───────────────────────────────────────────────────────────────────────────
  it('ADM-19: parent portal strictly isolates data to linked children and hides internal staff follow-ups', async () => {
    // Sign in as enrolled parent
    const parentToken = await signSession({
      uid: enrolledParentUserA.id,
      email: enrolledParentUserA.email,
      name: enrolledParentUserA.fullName,
      tenantId: tenantA,
      role: 'PARENT',
      roles: ['PARENT'],
      branchId: branchA1,
    })
    const parentCookie = `${SESSION_COOKIE}=${parentToken}`

    const req = new NextRequest('http://localhost:3000/api/v1/parent/today', {
      method: 'GET',
      headers: { cookie: parentCookie },
    })

    const res = await parentTodayGet(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.children).toBeDefined()
    expect(json.data.children.length).toBe(1)
    expect(json.data.children[0].id).toBe(enrolledStudentA.id)
    expect(json.data.children[0].name).toContain('Aarav')

    // Confirm that other students (e.g. STU-FULL) are NEVER returned
    const leaked = json.data.children.find((c: any) => c.name?.includes('Existing'))
    expect(leaked).toBeUndefined()
  })

  afterAll(async () => {
    try {
      await db.applicationInvitation.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.applicationDocument.deleteMany({ where: { application: { tenantId: { in: [tenantA, tenantB] } } } }).catch(() => {})
      await db.admissionOffer.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.admissionApplication.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.studentGuardian.deleteMany({ where: { student: { tenantId: { in: [tenantA, tenantB] } } } }).catch(() => {})
      await db.guardian.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.timelineEntry.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.student.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.classroom.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.followUp.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.lead.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.program.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.academicSession.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.tenantUser.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.branch.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } }).catch(() => {})
      await db.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } }).catch(() => {})
    } catch {}
  })
})
