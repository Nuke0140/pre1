import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { BranchCopyService } from '@/lib/setup/branch-copy-service'

describe('PreOne — Branch Setup Copy Service & Boundary Security', () => {
  const ts = Date.now().toString()
  let tenantA: any
  let tenantB: any
  let branchA1: any
  let branchA2: any
  let branchB1: any
  let academicSession: any
  let testProgram: any
  let testFeeHead: any

  beforeAll(async () => {
    // 1. Create clean test tenant A
    tenantA = await db.tenant.create({
      data: {
        code: `CPYA-${ts.slice(-5)}`,
        name: `Copy Setup Test School A ${ts}`,
        status: 'ACTIVE',
      },
    })

    // 2. Create another tenant B for cross-tenant testing
    tenantB = await db.tenant.create({
      data: {
        code: `CPYB-${ts.slice(-5)}`,
        name: `Copy Setup Test School B ${ts}`,
        status: 'ACTIVE',
      },
    })

    // 3. Create branches for Tenant A
    branchA1 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Main Campus',
        code: `MC-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchA2 = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'North Campus',
        code: `NC-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    // 4. Create branch for Tenant B
    branchB1 = await db.branch.create({
      data: {
        tenantId: tenantB.id,
        name: 'Tenant B Campus',
        code: `TB-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 5. Create active academic session for Tenant A
    academicSession = await db.academicSession.create({
      data: {
        tenantId: tenantA.id,
        name: `Session 2026-27 ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    // 6. Create program in Tenant A
    testProgram = await db.program.create({
      data: {
        tenantId: tenantA.id,
        name: 'Nursery Discovery',
        code: `NUR-${ts.slice(-4)}`,
        programType: 'NURSERY',
        capacity: 25,
      },
    })

    // Map program to Branch A1
    await db.programBranch.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        programId: testProgram.id,
        capacity: 24,
      },
    })

    // 7. Create Fee Head in Tenant A
    testFeeHead = await db.feeHead.create({
      data: {
        tenantId: tenantA.id,
        name: 'Tuition Term 1',
        code: `TUI-${ts.slice(-4)}`,
        category: 'TUITION',
      },
    })

    // 8. Create Classrooms in Branch A1
    await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicSessionId: academicSession.id,
        name: 'Nursery Sunflowers',
        code: `MC-NUR-A-${ts.slice(-4)}`,
        programType: 'NURSERY',
        capacity: 22,
        ageBandMinMonths: 30,
        ageBandMaxMonths: 42,
        primaryTeacherId: null,
      },
    })

    await db.classroom.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicSessionId: academicSession.id,
        name: 'Playgroup Starlets',
        code: `MC-PG-B-${ts.slice(-4)}`,
        programType: 'PLAYGROUP',
        capacity: 18,
        primaryTeacherId: null,
      },
    })

    // 9. Create Fee Structure in Branch A1
    const fs = await db.feeStructure.create({
      data: {
        tenantId: tenantA.id,
        branchId: branchA1.id,
        academicSessionId: academicSession.id,
        programType: 'NURSERY',
        name: 'Nursery Standard Plan',
        status: 'ACTIVE',
      },
    })

    await db.feeItem.create({
      data: {
        tenantId: tenantA.id,
        feeStructureId: fs.id,
        feeHeadId: testFeeHead.id,
        name: 'Tuition Fee',
        amountCents: 500000,
        currency: 'INR',
        frequency: 'MONTHLY',
      },
    })
  })

  it('1. Rejects copying when source and destination branch are identical', async () => {
    expect(
      BranchCopyService.previewBranchCopy(tenantA.id, {
        sourceBranchId: branchA1.id,
        destinationBranchId: branchA1.id,
        categories: ['classrooms'],
      })
    ).rejects.toThrow('Source and destination branches cannot be the same')
  })

  it('2. Enforces multi-tenant isolation and rejects copying across different tenants', async () => {
    // Attempting to copy from Tenant A to Tenant B using Tenant A context
    expect(
      BranchCopyService.previewBranchCopy(tenantA.id, {
        sourceBranchId: branchA1.id,
        destinationBranchId: branchB1.id,
        categories: ['classrooms'],
      })
    ).rejects.toThrow('does not exist in authorized school context')
  })

  it('3. Successfully previews configuration and correctly identifies new records vs conflicts', async () => {
    const preview = await BranchCopyService.previewBranchCopy(tenantA.id, {
      sourceBranchId: branchA1.id,
      destinationBranchId: branchA2.id,
      categories: ['classrooms', 'fee_structures', 'programs'],
    })

    expect(preview.sourceBranch.name).toBe('Main Campus')
    expect(preview.destinationBranch.name).toBe('North Campus')

    const clsCat = preview.categories.find((c) => c.category === 'classrooms')
    expect(clsCat).toBeDefined()
    expect(clsCat!.sourceCount).toBe(2)
    expect(clsCat!.newCount).toBe(2)
    expect(clsCat!.conflictsCount).toBe(0)
    expect(clsCat!.items.every((i) => i.status === 'WILL_CREATE')).toBe(true)

    const feeCat = preview.categories.find((c) => c.category === 'fee_structures')
    expect(feeCat).toBeDefined()
    expect(feeCat!.sourceCount).toBe(1)
    expect(feeCat!.newCount).toBe(1)

    const progCat = preview.categories.find((c) => c.category === 'programs')
    expect(progCat).toBeDefined()
    expect(progCat!.sourceCount).toBe(1)
    expect(progCat!.newCount).toBe(1)
  })

  it('4. Executes copy to destination branch: re-maps branchId, creates unique codes, and excludes sensitive staff/students', async () => {
    const result = await BranchCopyService.executeBranchCopy(
      tenantA.id,
      { id: 'user-admin', name: 'Principal Jane', role: 'PRINCIPAL' },
      {
        sourceBranchId: branchA1.id,
        destinationBranchId: branchA2.id,
        categories: ['classrooms', 'fee_structures', 'programs'],
        conflictStrategy: 'SKIP',
      }
    )

    expect(result.success).toBe(true)
    expect(result.totalCreated).toBeGreaterThan(0)
    expect(result.destinationBranch.name).toBe('North Campus')

    // Verify classrooms were created in destination branch
    const destClassrooms = await db.classroom.findMany({
      where: { tenantId: tenantA.id, branchId: branchA2.id },
    })
    expect(destClassrooms.length).toBe(2)

    for (const cls of destClassrooms) {
      // Must belong to destination branch
      expect(cls.branchId).toBe(branchA2.id)
      // Must NOT have assigned teachers
      expect(cls.primaryTeacherId).toBeNull()
      // Code must contain destination code and be distinct from source
      expect(cls.code).toContain(branchA2.code)
    }

    // Verify fee structures created in destination branch
    const destFeeStructures = await db.feeStructure.findMany({
      where: { tenantId: tenantA.id, branchId: branchA2.id, deletedAt: null },
      include: { items: true },
    })
    expect(destFeeStructures.length).toBe(1)
    expect(destFeeStructures[0].branchId).toBe(branchA2.id)
    expect(destFeeStructures[0].items.length).toBe(1)
    expect(destFeeStructures[0].items[0].amountCents).toBe(500000)

    // Verify program mapping created in destination branch
    const destPrograms = await db.programBranch.findMany({
      where: { tenantId: tenantA.id, branchId: branchA2.id },
    })
    expect(destPrograms.length).toBe(1)
    expect(destPrograms[0].branchId).toBe(branchA2.id)
  })

  it('5. Enforces conflict strategies when copying into a branch with existing configuration', async () => {
    // Second copy with SKIP strategy: All existing items should be skipped without duplicates
    const skipResult = await BranchCopyService.executeBranchCopy(
      tenantA.id,
      { id: 'user-admin', name: 'Principal Jane', role: 'PRINCIPAL' },
      {
        sourceBranchId: branchA1.id,
        destinationBranchId: branchA2.id,
        categories: ['classrooms'],
        conflictStrategy: 'SKIP',
      }
    )

    expect(skipResult.totalCreated).toBe(0)
    expect(skipResult.totalSkipped).toBe(2)

    // Total classrooms in North Campus remains exactly 2
    const destClassrooms = await db.classroom.findMany({
      where: { tenantId: tenantA.id, branchId: branchA2.id },
    })
    expect(destClassrooms.length).toBe(2)
  })
})
