import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { GET as getFamilyGroups } from '@/app/api/v1/users/family-groups/route'
import { GET as getUsername } from '@/app/api/v1/users/username/route'
import { DELETE as deleteUser } from '@/app/api/v1/users/[id]/route'
import { POST as resetPassword } from '@/app/api/v1/users/[id]/reset-password/route'
import { POST as transitionStatus } from '@/app/api/v1/users/[id]/status/route'
import { POST as unlockUser } from '@/app/api/v1/users/[id]/unlock/route'
import { POST as postCsv } from '@/app/api/v1/users/csv/route'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`)
    throw new Error(message)
  }
  console.log(`  PASS: ${message}`)
}

async function runRuntimeVerification() {
  console.log('===============================================================')
  console.log('RUNTIME API ACCEPTANCE VERIFICATION (PHASE D & E)')
  console.log('===============================================================')

  const ts = Date.now().toString()

  // 1. Setup multi-branch tenant
  const tenant = await db.tenant.create({
    data: {
      code: `RUN-${ts.slice(-6)}`,
      name: `Runtime Tenant ${ts.slice(-4)}`,
      status: 'ACTIVE',
    },
  })

  const branch1 = await db.branch.create({
    data: { tenantId: tenant.id, name: 'Campus East', code: `BE-${ts.slice(-4)}`, isMain: true },
  })
  const branch2 = await db.branch.create({
    data: { tenantId: tenant.id, name: 'Campus West', code: `BW-${ts.slice(-4)}`, isMain: false },
  })

  // 2. Setup actors:
  // - Owner (Institution-wide)
  // - Principal Campus 1 (Campus-scoped)
  // - Coordinator Multi-branch (Branch 1 + Branch 2)
  const ownerUser = await db.user.create({
    data: {
      email: `owner.rt.${ts}@preone.test`,
      fullName: 'Owner Runtime',
      status: 'ACTIVE',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
      memberships: {
        create: { tenantId: tenant.id, role: 'OWNER', roles: ['OWNER'], branchId: null, status: 'ACTIVE' },
      },
    },
  })

  const campusPrincipalUser = await db.user.create({
    data: {
      email: `princ.campus.${ts}@preone.test`,
      fullName: 'Principal Campus East',
      status: 'ACTIVE',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
      memberships: {
        create: { tenantId: tenant.id, role: 'PRINCIPAL', roles: ['PRINCIPAL'], branchId: branch1.id, status: 'ACTIVE' },
      },
    },
  })

  const multiBranchCoord = await db.user.create({
    data: {
      email: `coord.multi.${ts}@preone.test`,
      fullName: 'Coord Multi Campus',
      status: 'ACTIVE',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
      memberships: {
        create: {
          tenantId: tenant.id,
          role: 'COORDINATOR',
          roles: ['COORDINATOR'],
          branchId: branch1.id,
          status: 'ACTIVE',
          assignedBranches: {
            create: { tenantId: tenant.id, branchId: branch2.id },
          },
        },
      },
    },
  })

  const tokenOwner = await signSession({
    uid: ownerUser.id,
    email: ownerUser.email,
    name: ownerUser.fullName,
    tenantId: tenant.id,
    role: 'OWNER',
    roles: ['OWNER'],
  })

  const tokenCampusPrincipal = await signSession({
    uid: campusPrincipalUser.id,
    email: campusPrincipalUser.email,
    name: campusPrincipalUser.fullName,
    tenantId: tenant.id,
    branchId: branch1.id,
    role: 'PRINCIPAL',
    roles: ['PRINCIPAL'],
  })

  const tokenMultiCoord = await signSession({
    uid: multiBranchCoord.id,
    email: multiBranchCoord.email,
    name: multiBranchCoord.fullName,
    tenantId: tenant.id,
    branchId: branch1.id,
    role: 'COORDINATOR',
    roles: ['COORDINATOR'],
    permissions: ['users:read', 'users:write'],
  })

  // 3. Create Students in Campus East and Campus West
  const studentEast = await db.student.create({
    data: {
      tenantId: tenant.id,
      branchId: branch1.id,
      admissionNo: `ADM-E-${ts.slice(-5)}`,
      firstName: 'Easton',
      lastName: 'Child',
      dob: new Date('2020-05-15'),
      gender: 'MALE',
      status: 'ACTIVE',
    },
  })

  const studentWest = await db.student.create({
    data: {
      tenantId: tenant.id,
      branchId: branch2.id,
      admissionNo: `ADM-W-${ts.slice(-5)}`,
      firstName: 'Weston',
      lastName: 'Child',
      dob: new Date('2021-06-20'),
      gender: 'FEMALE',
      status: 'ACTIVE',
    },
  })

  // Create Family Grouping: Household with primary contact and alternate contact
  const primaryGuardian = await db.guardian.create({
    data: {
      tenantId: tenant.id,
      fullName: 'Primary Contact Parent',
      phone: `+9198111${ts.slice(-5)}`,
      email: `primary.${ts}@preone.test`,
      relationship: 'FATHER',
      isPrimaryContact: true,
      studentLinks: {
        create: {
          studentId: studentEast.id,
          relationship: 'FATHER',
          isPrimary: true,
          canPickup: true,
        },
      },
    },
  })

  const alternateGuardian = await db.guardian.create({
    data: {
      tenantId: tenant.id,
      fullName: 'Alternate Contact Parent',
      phone: `+9198222${ts.slice(-5)}`,
      email: `alt.${ts}@preone.test`,
      relationship: 'MOTHER',
      isPrimaryContact: false,
      studentLinks: {
        create: {
          studentId: studentEast.id,
          relationship: 'MOTHER',
          isPrimary: false,
          canPickup: true,
        },
      },
    },
  })

  try {
    console.log('\n--- 1. Family Groups GET Runtime Verification ---')
    // Owner sees groups
    const reqOwnerFG = new NextRequest('http://localhost:3000/api/v1/users/family-groups', {
      headers: { authorization: `Bearer ${tokenOwner}` },
    })
    const resOwnerFG = await getFamilyGroups(reqOwnerFG)
    assert(resOwnerFG.status === 200, 'Owner successfully accesses family-groups (200)')
    const jsonOwnerFG = await resOwnerFG.json()
    assert(Array.isArray(jsonOwnerFG.data?.households), 'family-groups returns array of households')

    // Campus Principal (Campus East) queries East branch -> 200
    const reqPrincEast = new NextRequest(`http://localhost:3000/api/v1/users/family-groups?branchId=${branch1.id}`, {
      headers: { authorization: `Bearer ${tokenCampusPrincipal}` },
    })
    const resPrincEast = await getFamilyGroups(reqPrincEast)
    assert(resPrincEast.status === 200, 'Campus Principal queries own campus family-groups (200)')

    // Campus Principal queries foreign Campus West -> 403 Forbidden
    const reqPrincWest = new NextRequest(`http://localhost:3000/api/v1/users/family-groups?branchId=${branch2.id}`, {
      headers: { authorization: `Bearer ${tokenCampusPrincipal}` },
    })
    const resPrincWest = await getFamilyGroups(reqPrincWest)
    assert(resPrincWest.status === 403, 'Campus Principal is denied access to foreign campus family-groups (403)')

    console.log('\n--- 2. Username Availability Runtime Verification ---')
    // Valid and available username
    const reqAvail = new NextRequest('http://localhost:3000/api/v1/users/username?username=aarav.teacher', {
      headers: { authorization: `Bearer ${tokenOwner}` },
    })
    const resAvail = await getUsername(reqAvail)
    assert(resAvail.status === 200, 'Username check returns 200 for valid format')
    const jsonAvail = await resAvail.json()
    assert(jsonAvail.data?.isAvailable === true, 'aarav.teacher is reported available')
    assert(jsonAvail.data?.normalizedUsername === 'aarav.teacher', 'Username normalized correctly')

    // Invalid format username (uppercase, special chars, too short)
    const reqInvalid = new NextRequest('http://localhost:3000/api/v1/users/username?username=a!*', {
      headers: { authorization: `Bearer ${tokenOwner}` },
    })
    const resInvalid = await getUsername(reqInvalid)
    const jsonInvalid = await resInvalid.json()
    assert(jsonInvalid.data?.isValid === false, 'Invalid username format reported as valid: false')

    console.log('\n--- 3. Guardian Deletion with Primary Contact Transfer ---')
    // 3a. Deletion without alternate contact transfer rejected
    const reqDelBlocked = new NextRequest(`http://localhost:3000/api/v1/users/${primaryGuardian.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${tokenOwner}` },
    })
    const resDelBlocked = await deleteUser(reqDelBlocked, { params: Promise.resolve({ id: primaryGuardian.id }) })
    assert(resDelBlocked.status === 409, 'Deleting sole primary contact without alternate transfer returns 409 Conflict')

    // 3b. Deletion WITH alternate contact transfer succeeds atomically
    const reqDelSuccess = new NextRequest(`http://localhost:3000/api/v1/users/${primaryGuardian.id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${tokenOwner}` },
      body: JSON.stringify({ alternateGuardianId: alternateGuardian.id }),
    })
    const resDelSuccess = await deleteUser(reqDelSuccess, { params: Promise.resolve({ id: primaryGuardian.id }) })
    assert(resDelSuccess.status === 200, 'Deleting primary contact with alternate transfer succeeds (200)')

    // Verify database state: alternateGuardian is now primary
    const updatedAlt = await db.guardian.findUnique({ where: { id: alternateGuardian.id } })
    assert(updatedAlt?.isPrimaryContact === true, 'Alternate contact promoted to isPrimaryContact: true')

    console.log('\n--- 4. Null Target-Member Route Handling (Consistent 404) ---')
    const fakeId = '00000000-0000-0000-0000-000000000000'

    const reqReset = new NextRequest(`http://localhost:3000/api/v1/users/${fakeId}/reset-password`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenOwner}` },
    })
    const resReset = await resetPassword(reqReset, { params: Promise.resolve({ id: fakeId }) })
    assert(resReset.status === 404, 'reset-password on nonexistent user returns 404 without leaking info')

    const reqStatus = new NextRequest(`http://localhost:3000/api/v1/users/${fakeId}/status`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenOwner}` },
      body: JSON.stringify({ action: 'suspend' }),
    })
    const resStatus = await transitionStatus(reqStatus, { params: Promise.resolve({ id: fakeId }) })
    assert(resStatus.status === 404, 'status transition on nonexistent user returns 404')

    const reqUnlock = new NextRequest(`http://localhost:3000/api/v1/users/${fakeId}/unlock`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenOwner}` },
    })
    const resUnlock = await unlockUser(reqUnlock, { params: Promise.resolve({ id: fakeId }) })
    assert(resUnlock.status === 404, 'unlock on nonexistent user returns 404')

    console.log('\n--- 5. Family CSV Multi-Branch Authorization ---')
    // Multi-branch coordinator (assigned to Branch 1 & Branch 2)
    // CSV with rows across both authorized branches
    const multiBranchCsv = [
      'studentAdmissionNo,relationship,name,phone,email,canPickup,isPrimaryContact',
      `${studentEast.admissionNo},MOTHER,Priya East,+9198333${ts.slice(-5)},priya.east.${ts}@preone.test,TRUE,TRUE`,
      `${studentWest.admissionNo},FATHER,Rajesh West,+9198444${ts.slice(-5)},rajesh.west.${ts}@preone.test,TRUE,TRUE`,
    ].join('\n')

    // Preview
    const reqPreview = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenMultiCoord}` },
      body: JSON.stringify({ action: 'preview', type: 'FAMILY', csv: multiBranchCsv }),
    })
    const resPreview = await postCsv(reqPreview)
    assert(resPreview.status === 200, 'Multi-branch coordinator can preview rows across both authorized branches (200)')
    const jsonPreview = await resPreview.json()
    assert(jsonPreview.data?.validRows === 2, 'Both rows in authorized branches are validated without branch errors')

    // Execution
    const reqExecute = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenMultiCoord}` },
      body: JSON.stringify({ action: 'execute', type: 'FAMILY', previewRows: jsonPreview.data.rows }),
    })
    const resExecute = await postCsv(reqExecute)
    assert(resExecute.status === 200, 'Multi-branch coordinator executes import across both authorized branches (200)')

    // Campus Principal (confined to Campus East only) attempts to import row for Campus West
    const singleBranchCsv = [
      'studentAdmissionNo,relationship,name,phone,email',
      `${studentWest.admissionNo},MOTHER,Cross Campus Mother,+9198555${ts.slice(-5)},cross.mom.${ts}@preone.test`,
    ].join('\n')

    const reqForeignPreview = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenCampusPrincipal}` },
      body: JSON.stringify({ action: 'preview', type: 'FAMILY', csv: singleBranchCsv }),
    })
    const resForeignPreview = await postCsv(reqForeignPreview)
    const jsonForeignPreview = await resForeignPreview.json()
    assert(
      jsonForeignPreview.data?.blockedRows === 1 || jsonForeignPreview.data?.rows[0]?.errors?.length > 0,
      'Campus-scoped principal preview strictly blocks foreign branch student row'
    )

    console.log('===============================================================')
    console.log('ALL RUNTIME API ACCEPTANCE CHECKS PASSED SUCCESSFULLY')
    console.log('===============================================================')
  } finally {
    // Cleanup
    await db.studentGuardian.deleteMany({ where: { studentId: { in: [studentEast.id, studentWest.id] } } })
    await db.guardian.deleteMany({ where: { tenantId: tenant.id } })
    await db.student.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenantUserBranch.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenantUser.deleteMany({ where: { tenantId: tenant.id } })
    await db.user.deleteMany({ where: { id: { in: [ownerUser.id, campusPrincipalUser.id, multiBranchCoord.id] } } })
    await db.branch.deleteMany({ where: { tenantId: tenant.id } })
    await db.tenant.deleteMany({ where: { id: tenant.id } })
  }
}

runRuntimeVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Runtime verification failed:', err)
    process.exit(1)
  })
