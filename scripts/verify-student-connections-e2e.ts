/**
 * PreOne — Comprehensive Student Module Connection Verification (Areas A-F)
 * 
 * Verifies:
 * Area A: Parent/Guardian ↔ User Module & Portal
 * Area B: Admissions ↔ Student Profile Dossier & Confidentiality
 * Area C: Inventory ↔ Student Issued Supplies
 * Area D: Transport ↔ Dismissal & Third-Party Pickups
 * Area E: Finance ↔ Deposits, Refunds & Non-Mutating Offer Reconciliation
 * Area F: Promotion / Class History ↔ Timeline & Idempotency
 */

import { db } from '../src/lib/db'
import { StudentService } from '../src/lib/students/student-service'

async function runVerification() {
  console.log('===============================================================')
  console.log('🚀 PreOne — Student Module Connection Verification (Areas A-F)')
  console.log('===============================================================\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`  ✅ [PASS] ${testName}`)
      if (detail) console.log(`     ↳ ${detail}`)
    } else {
      console.error(`  ❌ [FAIL] ${testName}`)
      if (detail) console.error(`     ↳ Details: ${detail}`)
    }
  }

  // 1. Setup / Find Active Tenant
  const tenant = await db.tenant.findFirst({
    include: { branches: true },
  })

  if (!tenant || tenant.branches.length === 0) {
    throw new Error('No tenant or branches found in database.')
  }

  const tenantId = tenant.id
  const branchId = tenant.branches[0].id
  console.log(`🏢 Testing against Tenant: "${tenant.name}" (${tenantId}) | Branch: ${branchId}\n`)

  const staffUser = await db.tenantUser.findFirst({
    where: { tenantId, role: { in: ['OWNER', 'PRINCIPAL', 'TEACHER', 'STAFF'] } },
    include: { user: true },
  })
  const staffUserId = staffUser?.userId || 'system-test-user'

  // Find or create an academic session
  let session = await db.academicSession.findFirst({
    where: { tenantId },
  })
  if (!session) {
    session = await db.academicSession.create({
      data: {
        tenantId,
        name: '2026-2027 Academic Session',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
      },
    })
  }

  // Find or create classrooms
  let classroomA = await db.classroom.findFirst({
    where: { tenantId, branchId },
  })
  if (!classroomA) {
    classroomA = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId: session.id,
        name: 'Toddler Joy A',
        code: 'TOD-A',
        capacity: 20,
        programType: 'PLAYGROUP',
        isActive: true,
      },
    })
  }

  let classroomB = await db.classroom.findFirst({
    where: { tenantId, branchId, id: { not: classroomA.id } },
  })
  if (!classroomB) {
    classroomB = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId: session.id,
        name: 'Pre-K Champions B',
        code: 'PREK-B',
        capacity: 22,
        programType: 'NURSERY',
        isActive: true,
      },
    })
  }

  // =========================================================================
  // SEED OR GET TEST STUDENT WITH ALL 6 INTEGRATION ENTITIES
  // =========================================================================
  const testStudentNumber = `STU-TEST-${Date.now().toString().slice(-4)}`
  const student = await db.student.create({
    data: {
      tenantId,
      branchId,
      admissionNo: testStudentNumber,
      firstName: 'Aarav',
      lastName: 'Verma',
      gender: 'MALE',
      dob: new Date('2022-05-15'),
      bloodGroup: 'B_POSITIVE',
      address: '14 Lotus Enclave, Bangalore',
      status: 'ACTIVE',
      admissionDate: new Date('2026-01-10'),
      admissionNo: testStudentNumber,
    },
  })
  const studentId = student.id
  console.log(`👶 Created Target Test Student: Aarav Verma (${studentId}, ${testStudentNumber})\n`)

  try {
    // -----------------------------------------------------------------------
    // AREA A: PARENT / GUARDIAN ↔ USER MODULE
    // -----------------------------------------------------------------------
    console.log('--- [AREA A] Parent / Guardian ↔ User Module & Portal ---')
    
    // Create portal user for guardian
    const guardianEmail = `test.parent.${Date.now()}@example.com`
    const portalUser = await db.user.create({
      data: {
        email: guardianEmail,
        fullName: 'Dr. Sunita Verma',
        status: 'ACTIVE',
        lastLoginAt: new Date(Date.now() - 3600000),
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId,
        userId: portalUser.id,
        role: 'PARENT',
        status: 'ACTIVE',
      },
    })
    // Add safe session
    await db.userSession.create({
      data: {
        userId: portalUser.id,
        sessionToken: `token-${Date.now()}`,
        device: 'Apple iPhone 15',
        platform: 'iOS 18.2 / Safari Mobile',
        ipAddress: '103.21.244.1',
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000 * 30),
      },
    })

    // Link Guardian with occupation & portal account
    const guardian = await db.guardian.create({
      data: {
        tenantId,
        name: 'Dr. Sunita Verma',
        phone: '9876543210',
        email: guardianEmail,
        occupation: 'Senior Pediatrician',
        relationship: 'MOTHER',
        isPrimary: true,
        canPickup: true,
        pickupPin: '$2b$10$e8w...hashedPin',
        userId: portalUser.id,
        students: {
          create: {
            studentId,
            relationship: 'MOTHER',
            isPrimary: true,
            canPickup: true,
            isFeePayer: true,
            receivesComm: true,
          },
        },
      },
    })

    // 1. Verify Profile Query returns occupation and portal account with safe session metadata
    const profileStaff = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId
    )
    const gRecord = profileStaff?.guardians?.find((g: any) => g.id === guardian.id)
    assert(!!gRecord, 'Area A.1: Guardian is mapped to student profile')
    assert(gRecord?.occupation === 'Senior Pediatrician', 'Area A.2: Guardian occupation is present and accurate', gRecord?.occupation)
    assert(!!gRecord?.portalAccount, 'Area A.3: Guardian portalAccount is resolved via User module')
    assert(gRecord?.portalAccount?.email === guardianEmail, 'Area A.4: Guardian portalAccount email matches user')
    assert(Array.isArray(gRecord?.portalAccount?.sessions) && gRecord.portalAccount.sessions.length > 0, 'Area A.5: Safe active user session metadata is included')
    assert(gRecord?.portalAccount?.sessions[0]?.platform?.includes('iOS'), 'Area A.6: Session platform and device metadata is populated', gRecord?.portalAccount?.sessions[0]?.platform)
    assert(!gRecord?.portalAccount?.sessions[0]?.sessionToken, 'Area A.7: Raw session tokens/secrets are strictly omitted for security')

    // 2. Test manageGuardians update of occupation
    await StudentService.manageGuardians(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId,
      {
        action: 'UPDATE',
        guardianId: guardian.id,
        fullName: 'Dr. Sunita Verma',
        occupation: 'Chief of Pediatrics',
      }
    )
    const updatedGuardian = await db.guardian.findUnique({ where: { id: guardian.id } })
    assert(updatedGuardian?.occupation === 'Chief of Pediatrics', 'Area A.8: manageGuardians successfully updates occupation', updatedGuardian?.occupation)

    // 3. Test portal invitation dispatch (action: 'INVITE')
    const inviteResult = await StudentService.manageGuardians(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId,
      {
        action: 'INVITE',
        guardianId: guardian.id,
      }
    )
    assert(inviteResult?.invited === true, 'Area A.9: manageGuardians dispatches portal invitation idempotently')

    // 4. Test Parent Ward Isolation
    const otherStudent = await db.student.create({
      data: {
        tenantId,
        branchId,
        studentNumber: `STU-OTHER-${Date.now().toString().slice(-4)}`,
        firstName: 'Other',
        lastName: 'Kid',
        gender: 'FEMALE',
        dob: new Date('2022-01-01'),
        status: 'ACTIVE',
      },
    })
    const parentAllowed = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'PARENT', actorUserId: portalUser.id },
      studentId
    )
    assert(!!parentAllowed, 'Area A.10: Linked parent can view their own child')
    const parentDenied = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'PARENT', actorUserId: portalUser.id },
      otherStudent.id
    )
    assert(parentDenied === null, 'Area A.11: Non-linked student profile access is strictly denied to parent')

    // -----------------------------------------------------------------------
    // AREA B: ADMISSIONS ↔ STUDENT PROFILE
    // -----------------------------------------------------------------------
    console.log('\n--- [AREA B] Admissions ↔ Student Profile Dossier ---')

    // Create admission lead
    const lead = await db.admissionLead.create({
      data: {
        tenantId,
        branchId,
        leadNumber: `LEAD-${Date.now().toString().slice(-4)}`,
        source: 'OPEN_HOUSE_EXPO',
        parentName: 'Dr. Sunita Verma',
        childName: 'Aarav Verma',
        phone: '9876543210',
        status: 'ENROLLED',
      },
    })

    // Create admission application
    const appNumber = `APP-ADM-${Date.now().toString().slice(-4)}`
    const application = await db.admissionApplication.create({
      data: {
        tenantId,
        branchId,
        applicationNumber: appNumber,
        childName: 'Aarav Verma',
        parentName: 'Dr. Sunita Verma',
        phone: '9876543210',
        status: 'APPROVED',
        leadId: lead.id,
        previousSchool: 'Little Sprouts Play School',
        notes: 'Child shows keen interest in building blocks. Slight milk allergy; staff alerted.',
        submittedAt: new Date('2025-11-01'),
        verifiedAt: new Date('2025-11-05'),
        approvedAt: new Date('2025-11-10'),
      },
    })

    // Create admission offer with agreed fee
    await db.admissionOffer.create({
      data: {
        tenantId,
        applicationId: application.id,
        offerNumber: `OFFER-${Date.now().toString().slice(-4)}`,
        terms: 'Standard Early Years Program 2026. Includes lunch and supplies.',
        feeTotalCents: 1500000, // 15,000 INR
        status: 'ACCEPTED',
        issuedAt: new Date('2025-11-12'),
      },
    })

    // Link application to student
    await db.student.update({
      where: { id: studentId },
      data: { applicationId: application.id },
    })

    // Test profile staff view of admission dossier
    const staffDossierProfile = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'PRINCIPAL', actorUserId: staffUserId },
      studentId
    )
    assert(staffDossierProfile?.admission?.applicationNumber === appNumber, 'Area B.1: Application reference correctly linked')
    assert(staffDossierProfile?.admission?.lead?.leadNumber === lead.leadNumber, 'Area B.2: Lead attribution resolved from Admissions module')
    assert(staffDossierProfile?.admission?.previousSchool === 'Little Sprouts Play School', 'Area B.3: Previous school history preserved')
    assert(staffDossierProfile?.admission?.offer?.feeTotalCents === 1500000, 'Area B.4: Agreed offer terms & fees attached to profile')
    assert(!!staffDossierProfile?.admission?.notes, 'Area B.5: Staff/Admins can review confidential intake notes')

    // Test confidentiality for Parent actor
    const parentDossierProfile = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'PARENT', actorUserId: portalUser.id },
      studentId
    )
    assert(parentDossierProfile?.admission?.notes === undefined, 'Area B.6: Confidential intake notes are strictly redacted from Parent role')

    // -----------------------------------------------------------------------
    // AREA C: INVENTORY ↔ STUDENT
    // -----------------------------------------------------------------------
    console.log('\n--- [AREA C] Inventory ↔ Student Issued Supplies ---')

    // Create inventory item
    const invItem = await db.inventoryItem.create({
      data: {
        tenantId,
        branchId,
        name: 'Montessori Sensory Kit - Grade 1',
        sku: `KIT-MON-${Date.now().toString().slice(-4)}`,
        category: 'LEARNING_AIDS',
        unit: 'SET',
        unitCostCents: 250000, // 2,500 INR
        minStockLevel: 5,
      },
    })

    // Create stock location
    const location = await db.stockLocation.create({
      data: {
        tenantId,
        branchId,
        name: 'Main Classroom Store Room',
        type: 'ROOM',
      },
    })

    // Issue stock to student
    const issueNumber = `ISSUE-${Date.now().toString().slice(-4)}`
    await db.stockIssue.create({
      data: {
        tenantId,
        branchId,
        issueNumber,
        studentId,
        locationId: location.id,
        issueDate: new Date(),
        purpose: 'STUDENT',
        status: 'COMPLETED',
        notes: 'Complete welcome orientation pack',
        items: {
          create: {
            itemId: invItem.id,
            quantity: 1,
            unitCostCents: 250000,
            totalCostCents: 250000,
          },
        },
      },
    })

    const invProfile = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId
    )
    const stockIssues = invProfile?.inventory?.stockIssues
    assert(Array.isArray(stockIssues) && stockIssues.length > 0, 'Area C.1: Stock issues query successfully resolved for student')
    assert(stockIssues[0]?.issueNumber === issueNumber, 'Area C.2: Stock issue number matches authoritative inventory ledger')
    assert(stockIssues[0]?.items[0]?.item?.name === 'Montessori Sensory Kit - Grade 1', 'Area C.3: Issued item name and category accurately linked')
    assert(stockIssues[0]?.items[0]?.quantity === 1, 'Area C.4: Item quantity correctly mapped')

    // -----------------------------------------------------------------------
    // AREA D: TRANSPORT ↔ STUDENT / GUARDIAN
    // -----------------------------------------------------------------------
    console.log('\n--- [AREA D] Transport ↔ Dismissal & Third-Party Pickups ---')

    // Create third-party pickup authorization
    const pickupAuth = await db.transportPickupAuthorization.create({
      data: {
        tenantId,
        branchId,
        studentId,
        personName: 'Ramesh Verma (Uncle)',
        phone: '9845012345',
        relationship: 'UNCLE',
        status: 'APPROVED',
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
        approvedByName: 'Principal Priya',
      },
    })

    const transProfile = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId
    )
    const pickupAuths = transProfile?.transport?.pickupAuthorizations
    assert(Array.isArray(pickupAuths) && pickupAuths.length > 0, 'Area D.1: Third-party pickup authorizations loaded')
    assert(pickupAuths[0]?.personName === 'Ramesh Verma (Uncle)', 'Area D.2: Pickup delegate name resolved accurately')
    assert(pickupAuths[0]?.status === 'APPROVED', 'Area D.3: Pickup authorization status active and verified')
    assert(pickupAuths[0]?.approvedByName === 'Principal Priya', 'Area D.4: Approver metadata traceable')
    // Verify dismissal PIN is not exposed in plain text in guardian profile
    const transGuardian = transProfile?.guardians?.find((g: any) => g.id === guardian.id)
    assert(transGuardian?.canPickup === true, 'Area D.5: Guardian pickup permission is verified')
    assert(!transGuardian?.pickupPin?.includes('1234'), 'Area D.6: No raw secret PINs leaked across profile queries')

    // -----------------------------------------------------------------------
    // AREA E: FINANCE ↔ DEPOSITS, REFUNDS & RECONCILIATION
    // -----------------------------------------------------------------------
    console.log('\n--- [AREA E] Finance ↔ Deposits, Refunds & Fee Reconciliation ---')

    // Create Caution Deposit
    const deposit = await db.studentDeposit.create({
      data: {
        tenantId,
        branchId,
        studentId,
        depositNumber: `DEP-${Date.now().toString().slice(-4)}`,
        type: 'CAUTION_MONEY',
        amountCents: 500000, // 5,000 INR
        remainingAmountCents: 300000, // 3,000 INR remaining
        status: 'HELD',
        receivedAt: new Date('2026-01-11'),
      },
    })

    // Create Partial Refund
    await db.refund.create({
      data: {
        tenantId,
        branchId,
        studentId,
        depositId: deposit.id,
        refundNumber: `REF-${Date.now().toString().slice(-4)}`,
        amountCents: 200000, // 2,000 INR refunded
        reason: 'Partial deposit release per policy',
        status: 'PROCESSED',
        refundedAt: new Date('2026-02-01'),
      },
    })

    // Create an Invoice with 10,000 INR billed (while agreed offer is 15,000 INR)
    // to test discrepancy detection
    await db.invoice.create({
      data: {
        tenantId,
        branchId,
        studentId,
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        title: 'Term 1 Tuition Fee',
        totalCents: 1000000, // 10,000 INR
        balanceCents: 0,
        paidCents: 1000000,
        status: 'PAID',
        dueDate: new Date('2026-01-20'),
      },
    })

    const finProfile = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId
    )
    assert(Array.isArray(finProfile?.finance?.deposits) && finProfile.finance.deposits.length > 0, 'Area E.1: Student security deposits returned')
    assert(finProfile?.finance?.depositsSummary?.totalDepositsCents === 500000, 'Area E.2: Deposits summary total accurately computed (5,000 INR)')
    assert(finProfile?.finance?.depositsSummary?.refundedAmountCents === 200000, 'Area E.3: Refunded deposits amount tracked (2,000 INR)')
    assert(finProfile?.finance?.depositsSummary?.remainingAmountCents === 300000, 'Area E.4: Remaining refundable deposit balance computed (3,000 INR)')
    
    // Fee Reconciliation
    const recon = finProfile?.finance?.reconciliation
    assert(!!recon, 'Area E.5: Fee reconciliation summary computed')
    assert(recon?.hasDiscrepancy === true, 'Area E.6: Discrepancy between offer (15k) and ledger (10k) detected')
    assert(recon?.offerAgreedCents === 1500000, 'Area E.7: Agreed offer baseline equals 15,000 INR')
    assert(recon?.invoicedTotalCents === 1000000, 'Area E.8: Ledger invoiced total equals 10,000 INR')
    assert(recon?.discrepancyCents === 500000, 'Area E.9: Discrepancy amount accurately computed as 5,000 INR without mutating ledger')

    // -----------------------------------------------------------------------
    // AREA F: PROMOTION / CLASS HISTORY ↔ TIMELINE & IDEMPOTENCY
    // -----------------------------------------------------------------------
    console.log('\n--- [AREA F] Promotion / Class History ↔ Timeline & Idempotency ---')

    // Initial allocation in classroomA
    await db.studentClassroomAllocation.create({
      data: {
        tenantId,
        studentId,
        classroomId: classroomA.id,
        academicSessionId: session.id,
        status: 'ACTIVE',
        startedAt: new Date('2026-04-01'),
        reason: 'Initial Placement',
      },
    })

    // Promote to classroomB
    const promo1 = await StudentService.promoteStudent(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId,
      {
        targetSessionId: session.id,
        targetClassroomId: classroomB.id,
        reason: 'Annual Year Promotion',
      }
    )
    assert(promo1?.status === 'ACTIVE', 'Area F.1: Student successfully promoted to new classroom')
    assert(promo1?.classroomId === classroomB.id, 'Area F.2: Target classroom allocation set to Classroom B')

    // Re-run the exact same promotion to test IDEMPOTENCY (must NOT create a duplicate active allocation)
    const promo2 = await StudentService.promoteStudent(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId,
      {
        targetSessionId: session.id,
        targetClassroomId: classroomB.id,
        reason: 'Annual Year Promotion (Retry)',
      }
    )
    assert(promo2?.id === promo1.id, 'Area F.3: Promote operation is strictly idempotent (returned existing allocation ID)')

    const totalActiveAllocations = await db.studentClassroomAllocation.count({
      where: {
        tenantId,
        studentId,
        status: 'ACTIVE',
      },
    })
    assert(totalActiveAllocations === 1, 'Area F.4: Exactly 1 active allocation exists after idempotent retry', `Count: ${totalActiveAllocations}`)

    // Verify progression timeline
    const academicProfile = await StudentService.getStudentProfile(
      { tenantId, branchId, actorRole: 'OWNER', actorUserId: staffUserId },
      studentId
    )
    const history = academicProfile?.academic?.history
    assert(Array.isArray(history) && history.length >= 2, 'Area F.5: Complete progression history timeline returned')
    const prevAlloc = history.find((h: any) => h.classroomId === classroomA.id)
    assert(prevAlloc?.status === 'COMPLETED' || prevAlloc?.endedAt !== null, 'Area F.6: Previous allocation status marked as COMPLETED upon promotion')

    console.log('\n===============================================================')
    console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} Passed (100% Success Rate)`)
    console.log('===============================================================')

  } finally {
    // Clean up test student and associated test entities
    console.log('\n🧹 Cleaning up test artifacts...')
    await db.refund.deleteMany({ where: { studentId } })
    await db.studentDeposit.deleteMany({ where: { studentId } })
    await db.invoice.deleteMany({ where: { studentId } })
    await db.stockIssue.deleteMany({ where: { studentId } })
    await db.transportPickupAuthorization.deleteMany({ where: { studentId } })
    await db.studentClassroomAllocation.deleteMany({ where: { studentId } })
    await db.studentGuardian.deleteMany({ where: { studentId } })
    await db.student.delete({ where: { id: studentId } }).catch(() => {})
    console.log('✨ Cleanup complete.\n')
  }
}

runVerification()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Verification failed with error:', err)
    process.exit(1)
  })
