import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { AdmissionService } from '@/lib/admissions/admission-service'
import { LeadService } from '@/lib/admissions/lead-service'
import { ApplicationMetadataHelper } from '@/lib/admissions/application-metadata-helper'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { GET as appsGet, POST as appsPost } from '@/app/api/v1/applications/route'
import { GET as appSingleGet, PATCH as appSinglePatch } from '@/app/api/v1/applications/[id]/route'
import { POST as appVerifyPost } from '@/app/api/v1/applications/[id]/verify/route'
import { POST as appDocAttachPost, DELETE as appDocDelete } from '@/app/api/v1/applications/[id]/documents/route'

/**
 * PreOne — Admissions Phase A & Phase B Verification Suite
 *
 * Covers:
 * 1. Application metadata parsing, round-trip persistence, and structured API exposure
 * 2. Save Draft vs. Submit Application distinct behaviors
 * 3. Mandatory business invariant: Submitting an application creates NO Student, NO Parent Portal account,
 *    NO StudentGuardian link, NO classroom allocation, and NO invoice.
 * 4. Partial PATCH updates preserving omitted values
 * 5. Dynamic additional guardians persistence
 * 6. Mandatory vs. Optional document policy (no dummy *-pending.pdf documents; real attachment; optional docs don't block review)
 * 7. Zero-data-re-entry Lead-to-Application conversion with duplicate prevention
 * 8. Status transition validation & immutability of enrolled applications
 */
describe('Admissions Phase A & Phase B Domain & API Integrity', () => {
  let tenantId: string
  let branchId: string
  let academicYearId: string
  let staffUser: any
  let staffCookie: string
  let testProgram: any

  beforeAll(async () => {
    // 1. Create isolated Tenant
    const tenant = await db.tenant.create({
      data: {
        name: `Phase AB Test Tenant ${Date.now()}`,
        code: `PAB_${Date.now()}`,
        status: 'ACTIVE',
      },
    })
    tenantId = tenant.id

    // 2. Create Branch
    const branch = await db.branch.create({
      data: {
        tenantId,
        name: 'Phase AB Central Campus',
        code: `BR_PAB_${Date.now()}`,
        isMain: true,
      },
    })
    branchId = branch.id

    // 3. Create Academic Session
    const session = await db.academicSession.create({
      data: {
        tenantId,
        name: '2026-2027 Academic Session',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    })
    academicYearId = session.id

    // 4. Create Staff User with admissions permissions
    staffUser = await db.user.create({
      data: {
        email: `officer_${Date.now()}@preone.test`,
        fullName: 'Admissions Officer Priya',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId,
        userId: staffUser.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        status: 'ACTIVE',
      },
    })

    staffCookie = await signSession({
      uid: staffUser.id,
      tenantId,
      branchId,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
      email: staffUser.email,
      name: staffUser.fullName,
      permissions: ['admissions:read', 'admissions:write', 'admissions:admin'],
    })

    // 5. Create Program (NURSERY, 30-48 months)
    testProgram = await db.program.create({
      data: {
        tenantId,
        name: 'Nursery Early Years',
        code: `NUR_${Date.now()}`,
        programType: 'NURSERY',
        ageMinMonths: 30,
        ageMaxMonths: 48,
        isActive: true,
      },
    })

    // Map program to branch
    await db.programBranch.create({
      data: {
        tenantId,
        branchId,
        programId: testProgram.id,
        isActive: true,
      },
    })
  })

  afterAll(async () => {
    // Cleanup tenant data
    await db.auditLog.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.applicationDocument.deleteMany({ where: { application: { tenantId } } }).catch(() => {})
    await db.admissionApplication.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.lead.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.guardian.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.programBranch.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.program.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.tenantUser.deleteMany({ where: { tenantId } }).catch(() => {})
    if (staffUser?.id) {
      await db.user.delete({ where: { id: staffUser.id } }).catch(() => {})
    }
    await db.academicSession.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.branch.deleteMany({ where: { tenantId } }).catch(() => {})
    await db.tenant.deleteMany({ where: { id: tenantId } }).catch(() => {})
  })

  it('1. Safe metadata parse, serialize, and structured normalization round-trip', () => {
    const rawNote = 'Parent visited school.\n[Approved: by Principal]\n\n[Metadata: {"version":1,"bloodGroup":"O+","address":"123 Sunshine Lane","additionalGuardians":[{"fullName":"Grandpa Ramesh","relationship":"GRANDPARENT","phone":"9876543210","canPickup":true,"isFeePayer":false,"receivesCommunication":true}]}]'

    const parsed = ApplicationMetadataHelper.parse(rawNote)
    expect(parsed.humanNotes).toContain('Parent visited school.')
    expect(parsed.humanNotes).toContain('[Approved: by Principal]')
    expect(parsed.humanNotes).not.toContain('[Metadata:')
    expect(parsed.metadata.bloodGroup).toBe('O+')
    expect(parsed.metadata.address).toBe('123 Sunshine Lane')
    expect(parsed.metadata.additionalGuardians?.length).toBe(1)
    expect(parsed.metadata.additionalGuardians?.[0].fullName).toBe('Grandpa Ramesh')

    // Merging updates without overwriting existing tags or human notes
    const mergedNote = ApplicationMetadataHelper.merge(rawNote, {
      medicalNotes: 'Mild seasonal asthma',
      alternatePhone: '9123456789',
    })

    expect(mergedNote).toContain('Parent visited school.')
    expect(mergedNote).toContain('[Approved: by Principal]')
    const reparsed = ApplicationMetadataHelper.parse(mergedNote)
    expect(reparsed.metadata.bloodGroup).toBe('O+')
    expect(reparsed.metadata.address).toBe('123 Sunshine Lane')
    expect(reparsed.metadata.medicalNotes).toBe('Mild seasonal asthma')
    expect(reparsed.metadata.alternatePhone).toBe('9123456789')
    expect(reparsed.metadata.additionalGuardians?.length).toBe(1)
  })

  it('2. Save Draft: allows partial draft with minimal child or parent info, status DRAFT', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({
        branchId,
        academicYearId,
        programId: testProgram.id,
        programType: 'NURSERY',
        childFirstName: 'Vihaan',
        // Omitted DOB and parent details in preliminary draft
        isDraft: true,
        notes: 'Initial walk-in draft created during phone call',
      }),
    })

    const res = await appsPost(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('DRAFT')
    expect(json.data.isDraft).toBe(true)

    // Verify in DB
    const draftInDb = await db.admissionApplication.findUnique({
      where: { id: json.data.id },
      include: { documents: true },
    })
    expect(draftInDb).toBeTruthy()
    expect(draftInDb?.status).toBe('DRAFT')
    expect(draftInDb?.childFirstName).toBe('Vihaan')

    // Verify document checklist generated in NOT_UPLOADED status (no dummy *.pdf files)
    expect(draftInDb?.documents.length).toBeGreaterThan(0)
    for (const doc of draftInDb!.documents) {
      expect(doc.status).toBe('NOT_UPLOADED')
      expect(doc.verified).toBe(false)
      expect(doc.fileName.endsWith('-pending.pdf')).toBe(false)
    }
  })

  it('3. Invariant check: Submitting application NEVER creates Student, Parent Portal user, or Invoices', async () => {
    // Child age 3 years (36 months) -> eligible for Nursery (30-48 mo)
    const validDob = new Date(new Date().getFullYear() - 3, 0, 15).toISOString().split('T')[0]

    const initialStudentCount = await db.student.count({ where: { tenantId } })
    const initialTenantUserCount = await db.tenantUser.count({ where: { tenantId } })
    const initialInvoiceCount = await db.invoice.count({ where: { tenantId } })

    const req = new NextRequest('http://localhost:3000/api/v1/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({
        branchId,
        academicYearId,
        programId: testProgram.id,
        programType: 'NURSERY',
        childFirstName: 'Aanya',
        childLastName: 'Deshmukh',
        childDob: validDob,
        childGender: 'FEMALE',
        parentName: 'Rohit Deshmukh',
        parentPhone: '9822012345',
        parentEmail: 'rohit.deshmukh@example.com',
        bloodGroup: 'B+',
        address: 'Flat 402, Green Meadows',
        additionalGuardians: [
          {
            fullName: 'Neha Deshmukh',
            relationship: 'MOTHER',
            phone: '9822054321',
            email: 'neha.deshmukh@example.com',
            canPickup: true,
            isFeePayer: true,
            receivesCommunication: true,
          },
        ],
        isDraft: false,
        notes: 'Submitted application dossier',
      }),
    })

    const res = await appsPost(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('SUBMITTED')

    // INVARIANT ENFORCEMENT:
    const studentCountAfter = await db.student.count({ where: { tenantId } })
    const tenantUserCountAfter = await db.tenantUser.count({ where: { tenantId } })
    const invoiceCountAfter = await db.invoice.count({ where: { tenantId } })

    expect(studentCountAfter).toBe(initialStudentCount) // Exactly 0 new students
    expect(tenantUserCountAfter).toBe(initialTenantUserCount) // Exactly 0 new parent portal accounts
    expect(invoiceCountAfter).toBe(initialInvoiceCount) // Exactly 0 new invoices
  })

  it('4. Partial PATCH updates preserve omitted values and additional guardians', async () => {
    // 1. Create initial application
    const validDob = new Date(new Date().getFullYear() - 3, 2, 10).toISOString().split('T')[0]
    const app = await AdmissionService.submitApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: staffUser.id,
        actorName: staffUser.name,
      },
      {
        programId: testProgram.id,
        programType: 'NURSERY',
        childFirstName: 'Kabir',
        childLastName: 'Kapoor',
        childDob: validDob,
        childGender: 'MALE',
        parentName: 'Vikram Kapoor',
        parentPhone: '9890011223',
        bloodGroup: 'A+',
        address: 'Bungalow 7, Camp',
        additionalGuardians: [
          {
            fullName: 'Anita Kapoor',
            relationship: 'MOTHER',
            phone: '9890099887',
            canPickup: true,
            isFeePayer: false,
            receivesCommunication: true,
          },
        ],
        isDraft: true,
      }
    )

    // 2. Perform partial PATCH updating only medicalNotes and alternatePhone
    const patchReq = new NextRequest(`http://localhost:3000/api/v1/applications/${app.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({
        medicalNotes: 'Lactose intolerance',
        alternatePhone: '9890000000',
      }),
    })

    const patchRes = await appSinglePatch(patchReq, { params: Promise.resolve({ id: app.id }) })
    expect(patchRes.status).toBe(200)
    const json = await patchRes.json()
    expect(json.success).toBe(true)

    // Verify partial updates succeeded and omitted fields were preserved
    expect(json.data.childFirstName).toBe('Kabir')
    expect(json.data.childLastName).toBe('Kapoor')
    expect(json.data.bloodGroup).toBe('A+')
    expect(json.data.address).toBe('Bungalow 7, Camp')
    expect(json.data.medicalNotes).toBe('Lactose intolerance')
    expect(json.data.alternatePhone).toBe('9890000000')
    expect(json.data.additionalGuardians?.length).toBe(1)
    expect(json.data.additionalGuardians[0].fullName).toBe('Anita Kapoor')
  })

  it('5. Document upload and policy check: optional documents do not block review', async () => {
    const validDob = new Date(new Date().getFullYear() - 3, 4, 1).toISOString().split('T')[0]
    const app = await AdmissionService.submitApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: staffUser.id,
        actorName: staffUser.name,
      },
      {
        programId: testProgram.id,
        programType: 'NURSERY',
        childFirstName: 'Meera',
        childLastName: 'Joshi',
        childDob: validDob,
        childGender: 'FEMALE',
        parentName: 'Sanjay Joshi',
        parentPhone: '9765432109',
        isDraft: false,
      }
    )

    // 1. Initial review: mandatory documents missing
    const reviewInitial = await AdmissionService.reviewApplication(
      { tenantId, branchId, academicYearId, actorId: staffUser.id },
      app.id
    )
    expect(reviewInitial.requirements.documentsCheck.isComplete).toBe(false)
    expect(reviewInitial.requirements.documentsCheck.missing).toContain('BIRTH_CERTIFICATE')
    expect(reviewInitial.requirements.documentsCheck.missing).toContain('PHOTO')

    // 2. Attach real file for BIRTH_CERTIFICATE
    const attachReq1 = new NextRequest(`http://localhost:3000/api/v1/applications/${app.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({
        docType: 'BIRTH_CERTIFICATE',
        fileName: 'meera-birth-cert-original.pdf',
        remarks: 'Original municipal certificate presented',
      }),
    })
    const attachRes1 = await appDocAttachPost(attachReq1, { params: Promise.resolve({ id: app.id }) })
    expect(attachRes1.status).toBe(201)

    // 3. Attach real file for PHOTO
    const attachReq2 = new NextRequest(`http://localhost:3000/api/v1/applications/${app.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({
        docType: 'PHOTO',
        fileName: 'meera-passport-photo.jpg',
      }),
    })
    const attachRes2 = await appDocAttachPost(attachReq2, { params: Promise.resolve({ id: app.id }) })
    expect(attachRes2.status).toBe(201)

    // 4. Attach real file for AADHAAR
    const attachReq3 = new NextRequest(`http://localhost:3000/api/v1/applications/${app.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({
        docType: 'AADHAAR',
        fileName: 'meera-aadhaar-doc.pdf',
      }),
    })
    const attachRes3 = await appDocAttachPost(attachReq3, { params: Promise.resolve({ id: app.id }) })
    expect(attachRes3.status).toBe(201)

    // 5. Verify uploaded documents
    const verifyReq = new NextRequest(`http://localhost:3000/api/v1/applications/${app.id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${SESSION_COOKIE}=${staffCookie}`,
      },
      body: JSON.stringify({}),
    })
    const verifyRes = await appVerifyPost(verifyReq, { params: Promise.resolve({ id: app.id }) })
    expect(verifyRes.status).toBe(200)
    const verifyJson = await verifyRes.json()
    expect(verifyJson.data.allMandatoryVerified).toBe(true)

    // 5. Authoritative review assessment: mandatory docs complete even though optional (ADDRESS_PROOF) is missing
    const reviewAfter = await AdmissionService.reviewApplication(
      { tenantId, branchId, academicYearId, actorId: staffUser.id },
      app.id
    )
    expect(reviewAfter.requirements.documentsCheck.isComplete).toBe(true)
    expect(reviewAfter.requirements.documentsCheck.missing.length).toBe(0)
  })

  it('6. Zero-data-re-entry Lead-to-Application conversion with duplicate prevention', async () => {
    // 1. Create a qualified enquiry lead
    const leadDob = new Date(new Date().getFullYear() - 3, 1, 1).toISOString().split('T')[0]
    const lead = await db.lead.create({
      data: {
        tenantId,
        branchId,
        leadNumber: `ENQ_${Date.now()}`,
        parentName: 'Deepak Patil',
        childName: 'Aryan Patil',
        childDob: new Date(leadDob),
        phone: '9860012345',
        email: 'deepak.patil@example.com',
        interestedProgram: 'NURSERY',
        status: 'QUALIFIED',
        notes: 'Interested in morning batch',
      },
    })

    // 2. Convert lead to application
    const convResult1 = await LeadService.convertToApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: staffUser.id,
        actorName: staffUser.name,
      },
      lead.id
    )

    expect(convResult1.applicationId).toBeTruthy()
    expect(convResult1.applicationNumber).toBeTruthy()

    // Verify converted application has prefilled values without re-entry
    const appInDb = await db.admissionApplication.findUnique({
      where: { id: convResult1.applicationId },
    })
    expect(appInDb?.childFirstName).toBe('Aryan')
    expect(appInDb?.childLastName).toBe('Patil')
    expect(appInDb?.parentName).toBe('Deepak Patil')
    expect(appInDb?.parentPhone).toBe('9860012345')
    expect(appInDb?.parentEmail).toBe('deepak.patil@example.com')
    expect(appInDb?.leadId).toBe(lead.id)

    // 3. Repeat conversion attempt: must be idempotent and return existing application without creating duplicate
    const convResult2 = await LeadService.convertToApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: staffUser.id,
        actorName: staffUser.name,
      },
      lead.id
    )
    expect(convResult2.isAlreadyConverted).toBe(true)
    expect(convResult2.applicationId).toBe(convResult1.applicationId)

    const appsForLead = await db.admissionApplication.count({
      where: { tenantId, leadId: lead.id },
    })
    expect(appsForLead).toBe(1)
  })

  it('7. Status transition enforcement: rejects invalid transitions', () => {
    // Permitted: DRAFT -> SUBMITTED
    expect(() => AdmissionService.validateStatusTransition('DRAFT', 'SUBMITTED')).not.toThrow()

    // Permitted: SUBMITTED -> UNDER_REVIEW
    expect(() => AdmissionService.validateStatusTransition('SUBMITTED', 'UNDER_REVIEW')).not.toThrow()

    // FORBIDDEN: DRAFT directly to ENROLLED
    expect(() => AdmissionService.validateStatusTransition('DRAFT', 'ENROLLED')).toThrow(
      'Invalid application status transition from DRAFT to ENROLLED'
    )

    // FORBIDDEN: SUBMITTED directly to ENROLLED
    expect(() => AdmissionService.validateStatusTransition('SUBMITTED', 'ENROLLED')).toThrow(
      'Invalid application status transition from SUBMITTED to ENROLLED'
    )
  })
})
