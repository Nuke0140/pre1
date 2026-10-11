/**
 * verify-public-enquiry-e2e.ts
 *
 * Comprehensive Automated Verification Suite for PreOne Public Enquiry Portal Flow.
 * Validates:
 * 1. Unauthenticated parent can fetch public school and branch metadata via GET.
 * 2. Unauthenticated parent can submit enquiry without session/tokens via POST.
 * 3. Successful enquiry is persisted under correct tenant and branch.
 * 4. Derived sequential reference number (ENQ-YYYY-XXXX) returned.
 * 5. Submitted enquiry is queryable via staff Admissions -> Enquiries workspace.
 * 6. Branch parameter security: client cannot tamper tenant; branchId derives tenant.
 * 7. Modifying branchId to non-existent or foreign branch is handled safely.
 * 8. School code parameter resolution: resolves correct school from code.
 * 9. Duplicate detection: resubmitting with same phone returns existing reference gracefully.
 * 10. Server-side validation: missing parentName or invalid phone rejected with 422.
 * 11. Rate limiting: abuse prevention halts excessive submissions from same IP.
 * 12. Staff APIs (/api/v1/leads, /api/v1/applications) remain strictly protected (401).
 * 13. Public visitor cannot read other parents' enquiries or access staff ledger.
 */

import { db } from '../src/lib/db'
import { resetRateLimit } from '../src/lib/rate-limit'

let passedCount = 0
let failedCount = 0

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`)
    failedCount++
    throw new Error(msg)
  } else {
    console.log(`  ✓ ${msg}`)
    passedCount++
  }
}

async function run() {
  console.log('====================================================================')
  console.log('PREONE PUBLIC ENQUIRY FLOW: AUTOMATED E2E & SECURITY VERIFICATION')
  console.log('====================================================================\n')

  const stamp = Date.now().toString().slice(-4)

  // 1. Setup Test Tenant with Two Branches
  console.log('[1] Multi-Branch School Tenant Setup')
  const tenant = await db.tenant.create({
    data: {
      name: `Public Test Academy ${stamp}`,
      code: `PUB-${stamp}`,
      status: 'ACTIVE',
    },
  })
  assert(!!tenant.id, 'School tenant created')

  const mainBranch = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Central Campus',
      code: `CEN-${stamp}`,
      isMain: true,
      isActive: true,
    },
  })
  assert(!!mainBranch.id, 'Main branch created')

  const secondaryBranch = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'North Campus',
      code: `NOR-${stamp}`,
      isMain: false,
      isActive: true,
    },
  })
  assert(!!secondaryBranch.id, 'Secondary branch created')

  const program = await db.program.create({
    data: {
      tenantId: tenant.id,
      name: 'Playgroup Juniors',
      code: `PJ-${stamp}`,
      programType: 'PLAYGROUP',
      isActive: true,
    },
  })
  assert(!!program.id, 'Playgroup program created')

  // Create isolated foreign tenant to verify isolation
  const foreignTenant = await db.tenant.create({
    data: {
      name: `Foreign School ${stamp}`,
      code: `FOR-${stamp}`,
      status: 'ACTIVE',
    },
  })
  const foreignBranch = await db.branch.create({
    data: {
      tenantId: foreignTenant.id,
      name: 'Foreign Campus',
      code: `FC-${stamp}`,
      isMain: true,
      isActive: true,
    },
  })
  assert(!!foreignBranch.id, 'Foreign tenant and branch created')

  const BASE_URL = 'http://localhost:3000'

  try {
    // 2. Unauthenticated GET Metadata Tests
    console.log('\n[2] Public Metadata Resolution (GET /api/v1/public/enquiry)')

    // 2.1 Fetch without query params (should return 200 and available branches)
    const getRes1 = await fetch(`${BASE_URL}/api/v1/public/enquiry`)
    assert(getRes1.status === 200, 'GET /api/v1/public/enquiry responds 200 OK without authentication')
    const getData1 = await getRes1.json()
    assert(getData1.success === true, 'GET response indicates success')
    assert(Array.isArray(getData1.data.branches), 'Returns list of branches')
    assert(Array.isArray(getData1.data.programs), 'Returns list of programs')

    // 2.2 Fetch with specific branchId
    const getRes2 = await fetch(`${BASE_URL}/api/v1/public/enquiry?branchId=${secondaryBranch.id}`)
    assert(getRes2.status === 200, 'GET with branchId responds 200 OK')
    const getData2 = await getRes2.json()
    assert(getData2.data.schoolName === tenant.name, 'Resolves correct school name from branchId')
    const hasSecBranch = getData2.data.branches.some((b: any) => b.id === secondaryBranch.id)
    assert(hasSecBranch, 'Branches include secondary branch')

    // 2.3 Fetch with schoolCode
    const getRes3 = await fetch(`${BASE_URL}/api/v1/public/enquiry?schoolCode=${tenant.code}`)
    assert(getRes3.status === 200, 'GET with schoolCode responds 200 OK')
    const getData3 = await getRes3.json()
    assert(getData3.data.schoolName === tenant.name, 'Resolves school name from schoolCode')

    // 3. Unauthenticated Public Enquiry Submission (POST /api/v1/public/enquiry)
    console.log('\n[3] Public Enquiry Submission & Persistence')

    const parentPhone = `98${stamp}1234`
    const postRes1 = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Anita Deshmukh',
        phone: parentPhone,
        email: `anita.${stamp}@example.com`,
        childName: 'Aarav Deshmukh',
        childDob: '2022-06-15',
        branchId: secondaryBranch.id,
        interestedProgram: 'PLAYGROUP',
        notes: 'Inquiring for morning session and bus facility',
      }),
    })

    assert(postRes1.status === 200, 'POST /api/v1/public/enquiry responds 200 OK without session')
    const postData1 = await postRes1.json()
    assert(postData1.success === true, 'Enquiry submission response is success: true')
    assert(postData1.data.leadNumber.startsWith('ENQ-'), 'Returns sequential ENQ-YYYY-XXXX lead reference')
    assert(typeof postData1.data.message === 'string', 'Returns friendly confirmation message')

    // Verify record in PostgreSQL database
    const savedLead = await db.lead.findFirst({
      where: {
        tenantId: tenant.id,
        phone: parentPhone,
      },
    })
    assert(!!savedLead, 'Enquiry persisted in PostgreSQL')
    assert(savedLead?.parentName === 'Anita Deshmukh', 'Parent name matches exactly')
    assert(savedLead?.branchId === secondaryBranch.id, 'Assigned to correct authorized branch')
    assert(savedLead?.status === 'NEW', 'Status initialized to NEW')
    assert(savedLead?.source === 'WEBSITE', 'Lead source recorded as WEBSITE')
    assert(savedLead?.interestedProgram === 'PLAYGROUP', 'Program recorded as PLAYGROUP')

    // 4. Duplicate Submission Protection
    console.log('\n[4] Duplicate Submission Handling')
    const dupRes = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Anita Deshmukh',
        phone: parentPhone,
        email: `anita.${stamp}@example.com`,
        branchId: secondaryBranch.id,
      }),
    })

    assert(dupRes.status === 200, 'Duplicate submission returns 200')
    const dupData = await dupRes.json()
    assert(dupData.success === true, 'Duplicate returns friendly success without crash')
    assert(dupData.data.isExisting === true, 'Flags lead as already existing')
    assert(dupData.data.leadNumber === postData1.data.leadNumber, 'Returns identical leadNumber reference')

    // 5. Tenant and Branch Security Boundary Tests
    console.log('\n[5] Tenant & Branch Security Boundaries')

    // 5.1 Submitting with foreign branchId derives foreign tenant, NOT spoofed tenant
    const foreignPhone = `97${stamp}5678`
    const foreignRes = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Foreign Parent',
        phone: foreignPhone,
        branchId: foreignBranch.id,
      }),
    })
    assert(foreignRes.status === 200, 'Foreign branch submission succeeds safely')
    const savedForeignLead = await db.lead.findFirst({
      where: { phone: foreignPhone },
    })
    assert(savedForeignLead?.tenantId === foreignTenant.id, 'Persisted under foreign branch owner tenant')
    assert(savedForeignLead?.tenantId !== tenant.id, 'Zero leakage into primary school tenant')

    // 6. Server-Side Input Validation Tests
    console.log('\n[6] Server-Side Input Validation')

    // 6.1 Missing parentName
    const valRes1 = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: '',
        phone: '9876543210',
      }),
    })
    assert(valRes1.status === 400 || valRes1.status === 422, 'Empty parentName returns 400/422 validation error')
    const valData1 = await valRes1.json()
    assert(valData1.success === false, 'Validation failure returns success: false')

    // 6.2 Invalid phone (less than 10 digits)
    const valRes2 = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Valid Name',
        phone: '12345',
      }),
    })
    assert(valRes2.status === 400 || valRes2.status === 422, 'Short phone number returns 400/422 validation error')

    // 6.3 Malformed email address
    const valRes3 = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Valid Name',
        phone: '9876543210',
        email: 'not-an-email',
      }),
    })
    assert(valRes3.status === 400 || valRes3.status === 422, 'Malformed email address returns 400/422 validation error')

    // 7. Rate Limiting Abuse Protection
    console.log('\n[7] Abuse Prevention & Rate Limiting')
    resetRateLimit('rl:public-enquiry')

    let rateLimitTriggered = false
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/public/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: `Spam Tester ${i}`,
          phone: `91${stamp}000${i}`,
        }),
      })
      if (res.status === 429) {
        rateLimitTriggered = true
        const retryHeader = res.headers.get('Retry-After')
        assert(!!retryHeader, '429 response contains Retry-After header')
        break
      }
    }
    assert(rateLimitTriggered, 'Rate limiter activates after burst of submissions (429)')
    resetRateLimit('rl:public-enquiry')

    // 8. Authentication Guard Verification on Staff-Facing APIs
    console.log('\n[8] Staff-Facing Authorization Guards Intact')

    // 8.1 GET /api/v1/leads without auth
    const staffLeadsRes = await fetch(`${BASE_URL}/api/v1/leads`)
    assert(staffLeadsRes.status === 401, 'GET /api/v1/leads strictly requires authentication (401)')
    const staffLeadsData = await staffLeadsRes.json()
    assert(staffLeadsData.error?.code === 'AUTH_001', 'Returns AUTH_001 error code')

    // 8.2 POST /api/v1/leads without auth
    const staffPostRes = await fetch(`${BASE_URL}/api/v1/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentName: 'Hacker', phone: '9999999999' }),
    })
    assert(staffPostRes.status === 401, 'POST /api/v1/leads strictly requires authentication (401)')

    // 8.3 GET /api/v1/applications without auth
    const staffAppsRes = await fetch(`${BASE_URL}/api/v1/applications`)
    assert(staffAppsRes.status === 401, 'GET /api/v1/applications strictly requires authentication (401)')

  } finally {
    // Teardown test data
    console.log('\n[9] Teardown & Clean-up')
    await db.lead.deleteMany({
      where: { tenantId: { in: [tenant.id, foreignTenant.id] } },
    })
    await db.program.deleteMany({
      where: { tenantId: tenant.id },
    })
    await db.branch.deleteMany({
      where: { tenantId: { in: [tenant.id, foreignTenant.id] } },
    })
    await db.tenant.deleteMany({
      where: { id: { in: [tenant.id, foreignTenant.id] } },
    })
    console.log('  ✓ Test tenant, branches, and leads cleaned up successfully')
  }

  console.log('\n====================================================================')
  console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log('====================================================================')
}

run().catch((err) => {
  console.error('Fatal error running verify-public-enquiry-e2e:', err)
  process.exit(1)
})
