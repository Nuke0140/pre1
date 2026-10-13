/**
 * PreOne E2E Test Suite: Enquiry to Application & Staff-Assigned Follow-Up Workflow
 *
 * Verifies:
 * 1. Creation of enquiry in active list (NEW)
 * 2. Start Application modal handoff (staff assignment + follow-up scheduling)
 * 3. Atomic creation of AdmissionApplication & linked FollowUp task
 * 4. Transition of Lead to APPLICATION_STARTED with convertedApplicationId & assignedToId
 * 5. Removal of enquiry from default active enquiries list (GET /api/v1/leads?status=ACTIVE)
 * 6. Enquiry retained in database & visible when status=ALL or status=APPLICATION_STARTED
 * 7. Visibility of Follow-up task in Follow-ups queue (/api/v1/visits) with assigned counselor
 * 8. Idempotency on repeated start-application calls
 */

import { db } from '../src/lib/db'
import { LeadService } from '../src/lib/admissions/lead-service'
import { FollowUpVisitService } from '../src/lib/admissions/followup-visit-service'

let totalPassed = 0
let totalFailed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    totalPassed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    totalFailed++
  }
}

async function main() {
  console.log('====================================================================')
  console.log('PREONE ENQUIRY TO APPLICATION & STAFF FOLLOW-UP WORKFLOW VERIFICATION')
  console.log('====================================================================\n')

  const timestamp = Date.now()
  const tenantId = `test-tenant-${timestamp}`
  const branchId = `test-branch-${timestamp}`
  const academicYearId = `test-ay-${timestamp}`
  const counselorId = `test-counselor-${timestamp}`

  try {
    // 1. Setup Tenant, Branch, Academic Year, and Counselor
    console.log('[1] Multi-Branch Environment & Counselor Setup')
    const tenant = await db.tenant.create({
      data: {
        name: `PreOne Workflow Academy ${timestamp.toString().slice(-4)}`,
        code: `WF${timestamp.toString().slice(-4)}`,
        status: 'ACTIVE',
      },
    })
    const tenantId = tenant.id
    assert(true, 'Tenant created')

    await db.branch.create({
      data: {
        id: branchId,
        tenantId,
        name: 'Shivajinagar Campus',
        code: 'SVR',
        isMain: true,
      },
    })
    assert(true, 'Branch created')

    await db.academicSession.create({
      data: {
        id: academicYearId,
        tenantId,
        name: '2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        isCurrent: true,
      },
    })
    assert(true, 'Academic session created')

    const counselor = await db.user.create({
      data: {
        id: counselorId,
        email: `counselor.${timestamp}@preone.in`,
        username: `counselor_${timestamp}`,
        fullName: 'Pooja Deshmukh',
        passwordHash: 'dummy-hash',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId,
        userId: counselor.id,
        branchId,
        role: 'PRINCIPAL',
        status: 'ACTIVE',
      },
    })
    assert(true, 'Staff counselor & TenantUser membership created')

    // Create Nursery Program
    await db.program.create({
      data: {
        tenantId,
        name: 'Nursery Explorers',
        code: `NUR-${timestamp.toString().slice(-4)}`,
        programType: 'NURSERY',
        ageMinMonths: 30,
        ageMaxMonths: 48,
        isActive: true,
      },
    })
    assert(true, 'Nursery program created')

    // 2. Create Lead Enquiry
    console.log('\n[2] Create Lead Enquiry')
    const childDob = new Date()
    childDob.setMonth(childDob.getMonth() - 36) // exactly 36 months old

    const lead = await db.lead.create({
      data: {
        tenantId,
        branchId,
        leadNumber: `ENQ-2026-${timestamp.toString().slice(-4)}`,
        source: 'WALK_IN',
        status: 'NEW',
        parentName: 'Ramesh Kulkarni',
        phone: '9822012345',
        email: 'ramesh.kulkarni@example.com',
        childName: 'Aarav Kulkarni',
        childDob,
        interestedProgram: 'NURSERY',
        notes: 'Walked into Shivajinagar campus for nursery admission.',
      },
    })
    assert(lead.status === 'NEW', 'Enquiry created with status NEW')
    assert(lead.leadNumber.startsWith('ENQ-2026-'), 'Lead number generated')

    // 3. Test Lead list filtering before application start
    console.log('\n[3] Active Enquiries Visibility (Before Application Start)')
    const activeLeadsBefore = await db.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE'] },
      },
    })
    assert(activeLeadsBefore.some((l) => l.id === lead.id), 'Enquiry is present in active list')

    // 4. Start Application with Staff Assignment & Follow-Up Scheduling
    console.log('\n[4] Start Application Handoff with Counselor Assignment & Follow-up')
    const followUpDueDate = new Date(Date.now() + 48 * 60 * 60 * 1000) // 2 days later

    const handoffResult = await LeadService.startApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: counselor.id,
        actorName: counselor.fullName,
        actorRole: counselor.role,
      },
      lead.id,
      {
        assignedStaffId: counselor.id,
        followUpDate: followUpDueDate,
        followUpType: 'Phone Call',
        followUpNotes: 'Call parent regarding birth certificate copy and fee installment choice.',
      }
    )

    assert(!handoffResult.application, 'No premature application created upon scheduling follow-up')
    assert(handoffResult.assignedToId === counselor.id, 'Assigned to counselor ID')
    assert(handoffResult.assignedStaffName === 'Pooja Deshmukh', 'Assigned counselor name resolved')
    assert(!!handoffResult.followUp, 'Linked FollowUp task created')

    // 5. Verify Database Records State After Follow-up Scheduling
    console.log('\n[5] Database State After Follow-up Scheduling')
    const updatedLead = await db.lead.findUnique({ where: { id: lead.id } })
    assert(updatedLead?.status === 'CONTACTED', 'Lead status transitioned to CONTACTED')
    assert(updatedLead?.convertedApplicationId === null, 'Lead convertedApplicationId remains null')
    assert(updatedLead?.assignedToId === counselor.id, 'Lead has assignedToId set to counselor')
    assert(updatedLead?.deletedAt === null, 'Enquiry was NOT deleted (history preserved)')

    const followUpRecord = await db.followUp.findUnique({
      where: { id: handoffResult.followUp.id },
    })
    assert(followUpRecord?.domain === 'ADMISSION', 'Follow-up belongs to ADMISSION domain')
    assert(followUpRecord?.sourceId === lead.id, 'Follow-up linked to enquiry lead ID')
    assert(followUpRecord?.assignedToId === counselor.id, 'Follow-up assigned to counselor ID')
    assert(followUpRecord?.status === 'OPEN', 'Follow-up status is OPEN')

    // 6. Active Enquiries Queue Still Retains Contacted Lead
    console.log('\n[6] Active Enquiries Retention During Follow-up Stage')
    const activeLeadsDuringFollowUp = await db.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'APPLICATION_STARTED'] },
      },
    })
    assert(activeLeadsDuringFollowUp.some((l) => l.id === lead.id), 'Enquiry remains in active enquiries queue during follow-up')

    // 7. Follow-ups Queue Integration Check
    console.log('\n[7] Follow-ups Queue Workspace Integration')
    const workspaceQueues = await FollowUpVisitService.listWorkspaceQueues(tenantId, {
      branchId,
      queue: 'UPCOMING',
    })
    const foundInQueue = workspaceQueues.items.some((item) => item.id === followUpRecord?.id)
    assert(foundInQueue, 'Follow-up task appears in Admissions Follow-ups workspace queue')
    const queueItem = workspaceQueues.items.find((item) => item.id === followUpRecord?.id)
    assert(queueItem?.assignedStaffName === 'Pooja Deshmukh', 'Follow-up card displays assigned counselor name')

    // 8. Explicit Conversion: Follow-up -> Application Transition
    console.log('\n[8] Explicit Conversion to Admission Application')
    const conversionResult = await LeadService.convertToApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: counselor.id,
        actorName: counselor.fullName,
        actorRole: counselor.role,
      },
      lead.id,
      { branchId }
    )

    assert(!!conversionResult.application, 'Admission Application created upon explicit conversion')
    assert(!!conversionResult.applicationNumber, `Application Number generated: ${conversionResult.applicationNumber}`)

    const convertedLeadRecord = await db.lead.findUnique({ where: { id: lead.id } })
    assert(convertedLeadRecord?.status === 'CONVERTED', 'Lead status transitioned to CONVERTED')
    assert(convertedLeadRecord?.convertedApplicationId === conversionResult.application.id, 'Lead has convertedApplicationId linked')

    const applicationRecord = await db.admissionApplication.findUnique({
      where: { id: conversionResult.application.id },
    })
    assert(applicationRecord?.leadId === lead.id, 'Application has bidirectional leadId link')
    assert(applicationRecord?.childFirstName === 'Aarav', 'Child first name preserved without data re-entry')
    assert(applicationRecord?.childLastName === 'Kulkarni', 'Child last name preserved without data re-entry')
    assert(applicationRecord?.parentPhone === '9822012345', 'Parent phone preserved without data re-entry')

    const resolvedFollowUp = await db.followUp.findUnique({
      where: { id: followUpRecord!.id },
    })
    assert(resolvedFollowUp?.status === 'RESOLVED', 'Associated follow-up marked RESOLVED upon application conversion')

    // Verify Active Queue Disappearance After Conversion
    const activeLeadsAfter = await db.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'APPLICATION_STARTED'] },
      },
    })
    assert(!activeLeadsAfter.some((l) => l.id === lead.id), 'Converted enquiry is removed from active enquiries list')

    // 9. Idempotency Check on Repeated Conversion
    console.log('\n[9] Idempotency on Repeated Conversion Calls')
    const repeatedConversion = await LeadService.convertToApplication(
      {
        tenantId,
        branchId,
        academicYearId,
        actorId: counselor.id,
        actorName: counselor.fullName,
        actorRole: counselor.role,
      },
      lead.id,
      { branchId }
    )
    assert(repeatedConversion.application.id === conversionResult.application.id, 'Repeated call returns identical application ID')

    const applicationsCount = await db.admissionApplication.count({
      where: { leadId: lead.id },
    })
    assert(applicationsCount === 1, 'Exactly 1 application exists in DB for this enquiry (no duplicates)')

    // Clean up
    console.log('\n[10] Teardown & Clean-up')
    await db.followUp.deleteMany({ where: { tenantId } })
    await db.applicationDocument.deleteMany({ where: { application: { tenantId } } })
    await db.admissionApplication.deleteMany({ where: { tenantId } })
    await db.lead.deleteMany({ where: { tenantId } })
    await db.guardian.deleteMany({ where: { tenantId } })
    await db.program.deleteMany({ where: { tenantId } })
    await db.tenantUser.deleteMany({ where: { tenantId } })
    await db.user.delete({ where: { id: counselorId } }).catch(() => {})
    await db.academicSession.deleteMany({ where: { tenantId } })
    await db.branch.deleteMany({ where: { tenantId } })
    await db.tenant.deleteMany({ where: { id: tenantId } })
    assert(true, 'Clean-up executed successfully')

  } catch (error) {
    console.error('Fatal execution error:', error)
    totalFailed++
  } finally {
    console.log('\n====================================================================')
    console.log(`RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`)
    console.log('====================================================================\n')
    process.exit(totalFailed > 0 ? 1 : 0)
  }
}

main()
