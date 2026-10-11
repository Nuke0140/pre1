/**
 * Comprehensive verification script for Branch-Wise Program Configuration:
 * School → Branch → Program Configuration → Enquiry Form → Enquiry Record → Application/Admission
 */

import { db } from '../src/lib/db'
import { ConfigurationService } from '../src/lib/setup/config-service'
import { LeadService } from '../src/lib/admissions/lead-service'
import { AdmissionService } from '../src/lib/admissions/admission-service'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${msg}`)
    failed++
  }
}

async function run() {
  console.log('====================================================================')
  console.log('PREONE BRANCH-WISE PROGRAM CONFIGURATION & WORKFLOW VERIFICATION')
  console.log('====================================================================\n')

  const timestamp = Date.now()
  const tenantSlug = `branch-prog-${timestamp}`

  let tenant: any = null
  let branchA: any = null
  let branchB: any = null
  let academicSession: any = null
  let programPlaygroup: any = null
  let programNursery: any = null
  let programDaycare: any = null

  try {
    // ------------------------------------------------------------------------
    // [1] Multi-Branch School Tenant Setup
    // ------------------------------------------------------------------------
    console.log('[1] Multi-Branch School Tenant & Programs Setup')

    tenant = await db.tenant.create({
      data: {
        name: `Acme Academy ${timestamp}`,
        code: `AA${String(timestamp).slice(-4)}`,
        status: 'ACTIVE',
      },
    })
    assert(!!tenant.id, 'School tenant created')

    branchA = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Pune Campus',
        code: `PUN-${String(timestamp).slice(-4)}`,
        isMain: true,
        isActive: true,
      },
    })
    assert(!!branchA.id, 'Branch A (Pune Campus) created')

    branchB = await db.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Sangli Campus',
        code: `SAN-${String(timestamp).slice(-4)}`,
        isMain: false,
        isActive: true,
      },
    })
    assert(!!branchB.id, 'Branch B (Sangli Campus) created')

    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: 'Academic Year 2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    })
    assert(!!academicSession.id, 'Academic session created')

    // Program 1: PLAYGROUP (Mapped strictly to Branch A)
    programPlaygroup = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Playgroup Program',
        code: 'PLAYGROUP',
        programType: 'PLAYGROUP',
        ageMinMonths: 18,
        ageMaxMonths: 36,
        capacity: 25,
        isActive: true,
        branchMappings: {
          create: {
            tenantId: tenant.id,
            branchId: branchA.id,
            capacity: 25,
            isActive: true,
          },
        },
      },
      include: { branchMappings: true },
    })
    assert(programPlaygroup.branchMappings.length === 1, 'Playgroup program mapped strictly to Branch A')

    // Program 2: NURSERY (Mapped strictly to Branch B)
    programNursery = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Nursery Program',
        code: 'NURSERY',
        programType: 'NURSERY',
        ageMinMonths: 30,
        ageMaxMonths: 48,
        capacity: 30,
        isActive: true,
        branchMappings: {
          create: {
            tenantId: tenant.id,
            branchId: branchB.id,
            capacity: 30,
            isActive: true,
          },
        },
      },
      include: { branchMappings: true },
    })
    assert(programNursery.branchMappings.length === 1, 'Nursery program mapped strictly to Branch B')

    // Program 3: DAYCARE (Universal, no branch mapping)
    programDaycare = await db.program.create({
      data: {
        tenantId: tenant.id,
        name: 'Universal Daycare',
        code: 'DAYCARE',
        programType: 'DAYCARE',
        ageMinMonths: 12,
        ageMaxMonths: 72,
        capacity: 50,
        isActive: true,
      },
      include: { branchMappings: true },
    })
    assert(programDaycare.branchMappings.length === 0, 'Universal Daycare program created with no branch mappings')

    // ------------------------------------------------------------------------
    // [2] Authoritative Branch-Dependent Validation via ConfigurationService
    // ------------------------------------------------------------------------
    console.log('\n[2] Authoritative Age & Branch Validation (ConfigurationService)')

    const childDobPlaygroup = new Date()
    childDobPlaygroup.setMonth(childDobPlaygroup.getMonth() - 24) // 24 months old

    // Branch A allows Playgroup
    const checkPlaygroupOnA = await ConfigurationService.validateProgramAge(
      tenant.id,
      'PLAYGROUP',
      childDobPlaygroup,
      branchA.id
    )
    assert(checkPlaygroupOnA.eligible === true, 'Branch A accepts PLAYGROUP child (24 months)')

    // Branch A forbids Nursery (not offered at Branch A)
    const checkNurseryOnA = await ConfigurationService.validateProgramAge(
      tenant.id,
      'NURSERY',
      childDobPlaygroup,
      branchA.id
    )
    assert(checkNurseryOnA.eligible === false, 'Branch A rejects NURSERY (not offered at Pune Campus)')
    assert(
      checkNurseryOnA.reason?.includes('not offered at the selected branch campus') || false,
      `Correct descriptive reason returned: "${checkNurseryOnA.reason}"`
    )

    // Branch B allows Nursery for 36-month-old child
    const childDobNursery = new Date()
    childDobNursery.setMonth(childDobNursery.getMonth() - 36) // 36 months old
    const checkNurseryOnB = await ConfigurationService.validateProgramAge(
      tenant.id,
      'NURSERY',
      childDobNursery,
      branchB.id
    )
    assert(checkNurseryOnB.eligible === true, 'Branch B accepts NURSERY child (36 months)')

    // Branch B forbids Playgroup (not offered at Branch B)
    const checkPlaygroupOnB = await ConfigurationService.validateProgramAge(
      tenant.id,
      'PLAYGROUP',
      childDobNursery,
      branchB.id
    )
    assert(checkPlaygroupOnB.eligible === false, 'Branch B rejects PLAYGROUP (not offered at Sangli Campus)')

    // Both branches accept Universal Daycare
    const checkDaycareOnA = await ConfigurationService.validateProgramAge(
      tenant.id,
      'DAYCARE',
      childDobPlaygroup,
      branchA.id
    )
    assert(checkDaycareOnA.eligible === true, 'Universal DAYCARE accepted at Branch A')

    const checkDaycareOnB = await ConfigurationService.validateProgramAge(
      tenant.id,
      'DAYCARE',
      childDobPlaygroup,
      branchB.id
    )
    assert(checkDaycareOnB.eligible === true, 'Universal DAYCARE accepted at Branch B')

    // ------------------------------------------------------------------------
    // [3] Public Enquiry Route Filter & Submission Verification
    // ------------------------------------------------------------------------
    console.log('\n[3] Branch-Scaped Programs Discovery & Public Submission')

    // Simulate GET /api/v1/public/enquiry?branchId=branchA.id
    const branchAPrograms = await db.program.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
        isActive: true,
        OR: [
          { branchMappings: { some: { branchId: branchA.id, deletedAt: null, isActive: true } } },
          { branchMappings: { none: {} } },
        ],
      },
    })
    const branchAProgramCodes = branchAPrograms.map((p) => p.programType)
    assert(branchAProgramCodes.includes('PLAYGROUP'), 'Branch A queries include PLAYGROUP')
    assert(branchAProgramCodes.includes('DAYCARE'), 'Branch A queries include universal DAYCARE')
    assert(!branchAProgramCodes.includes('NURSERY'), 'Branch A queries EXCLUDE unmapped NURSERY')

    // Simulate GET /api/v1/public/enquiry?branchId=branchB.id
    const branchBPrograms = await db.program.findMany({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
        isActive: true,
        OR: [
          { branchMappings: { some: { branchId: branchB.id, deletedAt: null, isActive: true } } },
          { branchMappings: { none: {} } },
        ],
      },
    })
    const branchBProgramCodes = branchBPrograms.map((p) => p.programType)
    assert(branchBProgramCodes.includes('NURSERY'), 'Branch B queries include NURSERY')
    assert(branchBProgramCodes.includes('DAYCARE'), 'Branch B queries include universal DAYCARE')
    assert(!branchBProgramCodes.includes('PLAYGROUP'), 'Branch B queries EXCLUDE unmapped PLAYGROUP')

    // ------------------------------------------------------------------------
    // [4] Lead/Enquiry Creation with Branch-Specific Program
    // ------------------------------------------------------------------------
    console.log('\n[4] Lead / Enquiry Creation & Age Advisory Scoping')

    const leadRes = await LeadService.createLead(
      {
        tenantId: tenant.id,
        branchId: branchA.id,
        academicYearId: academicSession.id,
        actorId: 'system-tester',
        actorName: 'System Test',
        actorRole: 'OWNER',
      },
      {
        parentName: 'Sneha Patil',
        phone: '9876543210',
        childName: 'Aarav Patil',
        childDob: childDobPlaygroup,
        interestedProgram: 'PLAYGROUP',
        source: 'WEBSITE',
        notes: 'Interested in Pune Playgroup',
      }
    )
    const leadA = leadRes.lead
    assert(!!leadA?.id, 'Lead created for Branch A with PLAYGROUP')
    assert(leadA?.branchId === branchA.id, 'Lead correctly scoped to Branch A')
    assert(leadA?.interestedProgram === 'PLAYGROUP', 'Lead recorded with interestedProgram PLAYGROUP')

    // ------------------------------------------------------------------------
    // [5] Start Application Workflow (Enquiry → Application without NURSERY error)
    // ------------------------------------------------------------------------
    console.log('\n[5] Start Application Workflow (Zero Data Re-Entry & Correct Branch Linking)')

    // This is the core workflow that previously crashed with:
    // "Program "NURSERY" is not configured for this school. Configure programs in Setup first."
    // Because Branch A ONLY has PLAYGROUP configured and NO NURSERY!
    const startedApp = await LeadService.startApplication(
      {
        tenantId: tenant.id,
        branchId: branchA.id,
        academicYearId: academicSession.id,
        actorId: 'system-tester',
        actorName: 'System Test',
        actorRole: 'OWNER',
      },
      leadA.id
    )

    const application = startedApp.application
    assert(!!application?.id, 'Application started successfully for Branch A lead without falling back to NURSERY')
    assert(application?.branchId === branchA.id, 'Application is correctly associated with Branch A')
    assert(application?.programType === 'PLAYGROUP', 'Application programType is PLAYGROUP, preserving lead configuration')
    assert(application?.programId === programPlaygroup.id, 'Application programId links authoritatively to Program record')

    // Verify lead state transition
    const updatedLead = await db.lead.findUnique({ where: { id: leadA.id } })
    assert(updatedLead?.status === 'APPLICATION_STARTED', 'Lead status transitioned to APPLICATION_STARTED')
    assert(updatedLead?.convertedApplicationId === application.id, 'Lead convertedApplicationId points to application')

    // ------------------------------------------------------------------------
    // [6] Submit Application with Branch-Mismatch Guard
    // ------------------------------------------------------------------------
    console.log('\n[6] Direct Application Submission Guard against Invalid Branch Program')

    let mismatchCaught = false
    try {
      await AdmissionService.submitApplication(
        {
          tenantId: tenant.id,
          branchId: branchA.id,
          academicYearId: academicSession.id,
          actorId: 'system-tester',
          actorName: 'System Test',
          actorRole: 'OWNER',
        },
        {
          programType: 'NURSERY', // Nursery is only at Branch B!
          childFirstName: 'Rohan',
          childDob: childDobNursery,
          parentName: 'Vikas Kulkarni',
          parentPhone: '9988776655',
        }
      )
    } catch (err: any) {
      mismatchCaught = true
      assert(
        err.message.includes('not offered at the selected branch campus'),
        `Properly rejected mismatched branch program with message: "${err.message}"`
      )
    }
    assert(mismatchCaught, 'Guard rejected application for program not offered at selected branch')

    // ------------------------------------------------------------------------
    // [7] Direct Application for Branch B with Nursery
    // ------------------------------------------------------------------------
    console.log('\n[7] Direct Application for Branch B with Its Configured Program (NURSERY)')

    const appB = await AdmissionService.submitApplication(
      {
        tenantId: tenant.id,
        branchId: branchB.id,
        academicYearId: academicSession.id,
        actorId: 'system-tester',
        actorName: 'System Test',
        actorRole: 'OWNER',
      },
      {
        programType: 'NURSERY',
        childFirstName: 'Anaya',
        childDob: childDobNursery,
        parentName: 'Priya Joshi',
        parentPhone: '9123456780',
      }
    )
    assert(!!appB.id, 'Application created for Branch B with NURSERY')
    assert(appB.branchId === branchB.id, 'Application correctly scoped to Branch B')
    assert(appB.programType === 'NURSERY', 'Application programType is NURSERY')
    assert(appB.programId === programNursery.id, 'Application programId links to Nursery program')

  } catch (err: any) {
    console.error('Unhandled verification error:', err)
    failed++
  } finally {
    // ------------------------------------------------------------------------
    // [8] Teardown & Clean-up
    // ------------------------------------------------------------------------
    console.log('\n[8] Teardown & Clean-up')
    if (tenant?.id) {
      await db.followUp.deleteMany({ where: { tenantId: tenant.id } })
      await db.applicationDocument.deleteMany({ where: { application: { tenantId: tenant.id } } })
      await db.admissionApplication.deleteMany({ where: { tenantId: tenant.id } })
      await db.lead.deleteMany({ where: { tenantId: tenant.id } })
      await db.programBranch.deleteMany({ where: { tenantId: tenant.id } })
      await db.program.deleteMany({ where: { tenantId: tenant.id } })
      await db.academicSession.deleteMany({ where: { tenantId: tenant.id } })
      await db.branch.deleteMany({ where: { tenantId: tenant.id } })
      await db.tenant.delete({ where: { id: tenant.id } })
      console.log('  ✓ Clean-up executed successfully')
    }
  }

  console.log('\n====================================================================')
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

run()
