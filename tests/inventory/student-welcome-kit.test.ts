import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { WelcomeKitService } from '@/lib/inventory/welcome-kit-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'

import { GET as bundlesGet } from '@/app/api/v1/inventory/welcome-kits/bundles/route'
import { GET as eligibilityGet } from '@/app/api/v1/inventory/welcome-kits/eligibility/route'
import { POST as issuePost } from '@/app/api/v1/inventory/welcome-kits/issue/route'
import { GET as slipGet } from '@/app/api/v1/inventory/welcome-kits/slip/route'

describe('PreOne Inventory Module — Student Welcome Kit Bundles (1-Click Atomic Issuance)', () => {
  let tenantA: string
  let tenantB: string
  let branchA1: string
  let branchB1: string
  let locationA1: string
  let locationB1: string
  let academicSessionA: string

  let principalUserA: any
  let staffUserA: any
  let unauthorizedUserA: any

  let principalCookieA: string
  let staffCookieA: string
  let unauthorizedCookieA: string

  let studentA1: any
  let studentA2: any
  let studentA3: any
  let studentB1: any

  let defaultBundleA: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Create Tenant A & Tenant B
    const tA = await db.tenant.create({
      data: {
        name: `Kit School A ${ts}`,
        code: `KITA_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantA = tA.id

    const tB = await db.tenant.create({
      data: {
        name: `Kit School B ${ts}`,
        code: `KITB_${ts}`,
        status: 'ACTIVE',
      },
    })
    tenantB = tB.id

    // 2. Branches
    const brA = await db.branch.create({
      data: {
        tenantId: tenantA,
        name: 'Main Campus A',
        code: `BR_A_${ts}`,
        isMain: true,
        isActive: true,
      },
    })
    branchA1 = brA.id

    const brB = await db.branch.create({
      data: {
        tenantId: tenantB,
        name: 'Main Campus B',
        code: `BR_B_${ts}`,
        isMain: true,
        isActive: true,
      },
    })
    branchB1 = brB.id

    // 3. Store Locations
    const locA = await db.inventoryLocation.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        name: 'Central School Store A',
        code: `STORE_A_${ts}`,
        locationType: 'MAIN_STORE',
        isActive: true,
      },
    })
    locationA1 = locA.id

    const locB = await db.inventoryLocation.create({
      data: {
        tenantId: tenantB,
        branchId: branchB1,
        name: 'Central School Store B',
        code: `STORE_B_${ts}`,
        locationType: 'MAIN_STORE',
        isActive: true,
      },
    })
    locationB1 = locB.id

    // 4. Academic Session
    const sesA = await db.academicSession.create({
      data: {
        tenantId: tenantA,
        name: `2026-2027 ${ts}`,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
      },
    })
    academicSessionA = sesA.id

    // 5. Classroom
    const classA = await db.classroom.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        academicSessionId: academicSessionA,
        name: 'Nursery Stars',
        code: `NUR_A_${ts}`,
        programType: 'NURSERY',
        capacity: 25,
      },
    })

    // 6. Students
    studentA1 = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-A1-${ts}`,
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2023-05-15'),
        gender: 'MALE',
        status: 'ACTIVE',
        currentClassroomId: classA.id,
      },
    })

    studentA2 = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-A2-${ts}`,
        firstName: 'Ananya',
        lastName: 'Iyer',
        dob: new Date('2023-08-20'),
        gender: 'FEMALE',
        status: 'ACTIVE',
        currentClassroomId: classA.id,
      },
    })

    studentA3 = await db.student.create({
      data: {
        tenantId: tenantA,
        branchId: branchA1,
        admissionNo: `ADM-A3-${ts}`,
        firstName: 'Kabir',
        lastName: 'Mehta',
        dob: new Date('2023-02-10'),
        gender: 'MALE',
        status: 'ACTIVE',
        currentClassroomId: classA.id,
      },
    })

    studentB1 = await db.student.create({
      data: {
        tenantId: tenantB,
        branchId: branchB1,
        admissionNo: `ADM-B1-${ts}`,
        firstName: 'Riya',
        lastName: 'Sen',
        dob: new Date('2023-04-12'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    // 7. Users
    principalUserA = await db.user.create({
      data: {
        email: `principal.kit.a.${ts}@preone.test`,
        fullName: 'Mrs. Rohini Sen (Principal)',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    staffUserA = await db.user.create({
      data: {
        email: `storekeeper.kit.a.${ts}@preone.test`,
        fullName: 'Rajesh Kumar (Storekeeper)',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    unauthorizedUserA = await db.user.create({
      data: {
        email: `driver.kit.a.${ts}@preone.test`,
        fullName: 'Mahesh Patil (Driver)',
        passwordHash: 'dummyhash123',
        status: 'ACTIVE',
      },
    })

    principalCookieA = await signSession({
      uid: principalUserA.id,
      email: principalUserA.email,
      name: principalUserA.fullName,
      role: 'PRINCIPAL' as any,
      roles: ['PRINCIPAL' as any],
      tenantId: tenantA,
      branchId: branchA1,
    })

    staffCookieA = await signSession({
      uid: staffUserA.id,
      email: staffUserA.email,
      name: staffUserA.fullName,
      role: 'STAFF' as any,
      roles: ['STAFF' as any],
      tenantId: tenantA,
      branchId: branchA1,
    })

    unauthorizedCookieA = await signSession({
      uid: unauthorizedUserA.id,
      email: unauthorizedUserA.email,
      name: unauthorizedUserA.fullName,
      role: 'DRIVER' as any,
      roles: ['DRIVER' as any],
      tenantId: tenantA,
      branchId: branchA1,
    })

    // 8. Auto-provision default Nursery Welcome Kit
    defaultBundleA = await WelcomeKitService.getOrCreateDefaultNurseryWelcomeKit(
      tenantA,
      branchA1
    )
  })

  // Helper to stock items
  async function replenishItemStock(itemId: string, locationId: string, quantity: number) {
    const existing = await db.inventoryStock.findFirst({
      where: {
        locationId,
        itemId,
      },
    })
    if (existing) {
      await db.inventoryStock.update({
        where: { id: existing.id },
        data: {
          quantity,
          availableQuantity: quantity,
        },
      })
    } else {
      await db.inventoryStock.create({
        data: {
          tenantId: tenantA,
          branchId: branchA1,
          locationId,
          itemId,
          quantity,
          availableQuantity: quantity,
        },
      })
    }
  }

  describe('1. Preconfigured Welcome Kit Bundle & Catalog', () => {
    it('provisions Nursery Welcome Kit with 2 uniform sets and 1 of each companion item', async () => {
      const bundle = await WelcomeKitService.getOrCreateDefaultNurseryWelcomeKit(
        tenantA,
        branchA1
      )

      expect(bundle).toBeDefined()
      expect(bundle.name).toBe('Nursery Welcome Kit')
      expect(bundle.code).toBe('NURSERY_WELCOME_KIT')
      expect(bundle.items.length).toBe(4)

      // 1. Uniform Set line
      const uniformLine = bundle.items.find((it) => it.itemName === 'Uniform Set')
      expect(uniformLine).toBeDefined()
      expect(Number(uniformLine?.quantity)).toBe(2)
      expect(uniformLine?.hasVariants).toBe(true)
      expect(uniformLine?.variantType).toBe('SIZE')
      const vMap = uniformLine?.variantMap as Record<string, string>
      expect(vMap['S']).toBeDefined()
      expect(vMap['M']).toBeDefined()
      expect(vMap['L']).toBeDefined()
      expect(vMap['XL']).toBeDefined()

      // 2. School Bag line
      const bagLine = bundle.items.find((it) => it.itemName === 'School Bag')
      expect(bagLine).toBeDefined()
      expect(Number(bagLine?.quantity)).toBe(1)
      expect(bagLine?.hasVariants).toBe(false)

      // 3. Student Diary line
      const diaryLine = bundle.items.find((it) => it.itemName === 'Student Diary')
      expect(diaryLine).toBeDefined()
      expect(Number(diaryLine?.quantity)).toBe(1)

      // 4. Phonics Workbook line
      const workbookLine = bundle.items.find((it) => it.itemName === 'Phonics Workbook')
      expect(workbookLine).toBeDefined()
      expect(Number(workbookLine?.quantity)).toBe(1)

      // Total items count = 2 + 1 + 1 + 1 = 5
      const totalUnits = bundle.items.reduce((acc, it) => acc + Number(it.quantity), 0)
      expect(totalUnits).toBe(5)
    })

    it('lists welcome kits via Service and checks stock status for uniform size M', async () => {
      const details = await WelcomeKitService.getWelcomeKitDetails(
        tenantA,
        'NURSERY_WELCOME_KIT',
        {
          branchId: branchA1,
          locationId: locationA1,
          uniformSize: 'M',
        }
      )

      expect(details.bundle.name).toBe('Nursery Welcome Kit')
      expect(details.totalItemsCount).toBe(5)
      expect(details.components.length).toBe(4)
      expect(details.supportedSizes).toContain('M')
      expect(details.supportedSizes).toContain('S')
    })
  })

  describe('2. Student Eligibility and Pre-checks', () => {
    it('verifies student eligibility for welcome kit issuance', async () => {
      const elig = await WelcomeKitService.checkStudentEligibility(
        tenantA,
        studentA1.id,
        branchA1
      )

      expect(elig.eligible).toBe(true)
      expect(elig.student.admissionNo).toBe(studentA1.admissionNo)
      expect(elig.hasPreviousKit).toBe(false)
    })

    it('blocks eligibility check for cross-branch or non-existent student', async () => {
      expect(
        WelcomeKitService.checkStudentEligibility(tenantA, studentB1.id, branchA1)
      ).rejects.toThrow('Student not found or unauthorized')
    })
  })

  describe('3. Atomic Welcome Kit Issuance & All-or-Nothing Stock Deduction', () => {
    it('fails with INSUFFICIENT_STOCK when store is empty and does not deduct any items', async () => {
      // Location has 0 stock currently
      await expect(
        WelcomeKitService.issueWelcomeKit(
          tenantA,
          {
            studentId: studentA1.id,
            uniformSize: 'M',
            locationId: locationA1,
          },
          {
            id: principalUserA.id,
            name: principalUserA.fullName,
            role: 'PRINCIPAL',
          }
        )
      ).rejects.toThrow('INSUFFICIENT_STOCK')

      // Verify no StockIssue was created
      const issues = await db.stockIssue.findMany({
        where: { tenantId: tenantA, studentId: studentA1.id },
      })
      expect(issues.length).toBe(0)
    })

    it('successfully issues complete Nursery Welcome Kit when stock is available', async () => {
      // 1. Stock the store location with 20 of each component
      const uniformLine = defaultBundleA.items.find((it) => it.itemName === 'Uniform Set')
      const vMap = uniformLine?.variantMap as Record<string, string>
      const uniformMId = vMap['M']

      const bagLine = defaultBundleA.items.find((it) => it.itemName === 'School Bag')
      const diaryLine = defaultBundleA.items.find((it) => it.itemName === 'Student Diary')
      const wbLine = defaultBundleA.items.find((it) => it.itemName === 'Phonics Workbook')

      await replenishItemStock(uniformMId, locationA1, 20)
      await replenishItemStock(bagLine!.itemId!, locationA1, 20)
      await replenishItemStock(diaryLine!.itemId!, locationA1, 20)
      await replenishItemStock(wbLine!.itemId!, locationA1, 20)

      // 2. Issue Welcome Kit to Student A1
      const res = await WelcomeKitService.issueWelcomeKit(
        tenantA,
        {
          studentId: studentA1.id,
          uniformSize: 'M',
          locationId: locationA1,
          notes: 'Issued on day 1 orientation',
        },
        {
          id: principalUserA.id,
          name: principalUserA.fullName,
          role: 'PRINCIPAL',
        }
      )

      expect(res.success).toBe(true)
      expect(res.kitNumber).toContain('KIT-')
      expect(res.stockIssue).toBeDefined()

      // 3. Verify exactly 2 uniform sets and 1 of each companion item were deducted
      const stockM = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformMId },
      })
      expect(Number(stockM?.availableQuantity)).toBe(18) // 20 - 2

      const stockBag = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: bagLine!.itemId! },
      })
      expect(Number(stockBag?.availableQuantity)).toBe(19) // 20 - 1

      const stockDiary = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: diaryLine!.itemId! },
      })
      expect(Number(stockDiary?.availableQuantity)).toBe(19) // 20 - 1

      const stockWb = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: wbLine!.itemId! },
      })
      expect(Number(stockWb?.availableQuantity)).toBe(19) // 20 - 1

      // 4. Verify StockIssue record
      const issue = await db.stockIssue.findUnique({
        where: { id: res.stockIssue.id },
        include: { items: true, student: true },
      })
      expect(issue).toBeDefined()
      expect(issue?.destinationType).toBe('STUDENT')
      expect(issue?.studentId).toBe(studentA1.id)
      expect(issue?.items.length).toBe(4)

      // Total quantity across the 4 lines should be 5
      const totalIssued = issue?.items.reduce((acc, it) => acc + Number(it.quantity), 0)
      expect(totalIssued).toBe(5)

      // 5. Verify StudentKitIssuance record
      const kitIssuance = await db.studentKitIssuance.findUnique({
        where: { id: res.kitIssuance.id },
      })
      expect(kitIssuance).toBeDefined()
      expect(kitIssuance?.studentId).toBe(studentA1.id)
      expect(kitIssuance?.bundleName).toBe('Nursery Welcome Kit')
      expect((kitIssuance?.variantValues as any)?.uniformSize).toBe('M')

      // 6. Verify StockMovements created
      const movements = await db.stockMovement.findMany({
        where: { referenceId: issue!.id },
      })
      expect(movements.length).toBe(4)
      expect(movements.every((m) => m.movementType === 'ISSUE')).toBe(true)
    })

    it('correctly maps and deducts size S variant without touching size M stock', async () => {
      const uniformLine = defaultBundleA.items.find((it) => it.itemName === 'Uniform Set')
      const vMap = uniformLine?.variantMap as Record<string, string>
      const uniformSId = vMap['S']
      const uniformMId = vMap['M']

      // Replenish size S to 15
      await replenishItemStock(uniformSId, locationA1, 15)

      // Size M is currently at 18
      const stockMBefore = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformMId },
      })
      expect(Number(stockMBefore?.availableQuantity)).toBe(18)

      // Issue kit with Size S to Student A2
      const res = await WelcomeKitService.issueWelcomeKit(
        tenantA,
        {
          studentId: studentA2.id,
          uniformSize: 'S',
          locationId: locationA1,
        },
        {
          id: staffUserA.id,
          name: staffUserA.fullName,
          role: 'STAFF',
        }
      )

      expect(res.success).toBe(true)

      // Size S decremented from 15 to 13 (2 sets deducted)
      const stockS = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformSId },
      })
      expect(Number(stockS?.availableQuantity)).toBe(13)

      // Size M untouched at 18
      const stockMAfter = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformMId },
      })
      expect(Number(stockMAfter?.availableQuantity)).toBe(18)
    })

    it('demonstrates all-or-nothing rollback when one component has insufficient stock', async () => {
      const wbLine = defaultBundleA.items.find((it) => it.itemName === 'Phonics Workbook')
      const uniformLine = defaultBundleA.items.find((it) => it.itemName === 'Uniform Set')
      const vMap = uniformLine?.variantMap as Record<string, string>
      const uniformSId = vMap['S']

      // Record baseline stock
      const stockSBefore = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformSId },
      })
      const qtySBefore = Number(stockSBefore?.availableQuantity)

      // Set Phonics Workbook stock to 0
      await replenishItemStock(wbLine!.itemId!, locationA1, 0)

      // Attempt issuance for Student A3
      await expect(
        WelcomeKitService.issueWelcomeKit(
          tenantA,
          {
            studentId: studentA3.id,
            uniformSize: 'S',
            locationId: locationA1,
          },
          {
            id: principalUserA.id,
            name: principalUserA.fullName,
            role: 'PRINCIPAL',
          }
        )
      ).rejects.toThrow('INSUFFICIENT_STOCK')

      // Verify that Uniform stock was NOT decremented (strict rollback)
      const stockSAfter = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformSId },
      })
      expect(Number(stockSAfter?.availableQuantity)).toBe(qtySBefore)

      // Verify no StudentKitIssuance was created for Student A3
      const issuances = await db.studentKitIssuance.findMany({
        where: { studentId: studentA3.id },
      })
      expect(issuances.length).toBe(0)
    })

    it('prevents concurrent overdraft: exactly one issuance succeeds when stock only covers one kit', async () => {
      const uniformLine = defaultBundleA.items.find((it) => it.itemName === 'Uniform Set')
      const vMap = uniformLine?.variantMap as Record<string, string>
      const uniformXLId = vMap['XL']
      const bagLine = defaultBundleA.items.find((it) => it.itemName === 'School Bag')
      const diaryLine = defaultBundleA.items.find((it) => it.itemName === 'Student Diary')
      const wbLine = defaultBundleA.items.find((it) => it.itemName === 'Phonics Workbook')

      // Set stock of size XL to exactly 2 (enough for only ONE kit, which needs 2 sets)
      await replenishItemStock(uniformXLId, locationA1, 2)
      await replenishItemStock(bagLine!.itemId!, locationA1, 10)
      await replenishItemStock(diaryLine!.itemId!, locationA1, 10)
      await replenishItemStock(wbLine!.itemId!, locationA1, 10)

      // Create two fresh students for concurrent test
      const ts = Date.now()
      const studentRace1 = await db.student.create({
        data: {
          tenantId: tenantA,
          branchId: branchA1,
          admissionNo: `RACE-1-${ts}`,
          firstName: 'RaceStudent1',
          dob: new Date('2023-01-01'),
          gender: 'MALE',
          status: 'ACTIVE',
        },
      })
      const studentRace2 = await db.student.create({
        data: {
          tenantId: tenantA,
          branchId: branchA1,
          admissionNo: `RACE-2-${ts}`,
          firstName: 'RaceStudent2',
          dob: new Date('2023-01-01'),
          gender: 'FEMALE',
          status: 'ACTIVE',
        },
      })

      // Concurrently fire both issues
      const [res1, res2] = await Promise.allSettled([
        WelcomeKitService.issueWelcomeKit(
          tenantA,
          {
            studentId: studentRace1.id,
            uniformSize: 'XL',
            locationId: locationA1,
          },
          {
            id: principalUserA.id,
            name: principalUserA.fullName,
            role: 'PRINCIPAL',
          }
        ),
        WelcomeKitService.issueWelcomeKit(
          tenantA,
          {
            studentId: studentRace2.id,
            uniformSize: 'XL',
            locationId: locationA1,
          },
          {
            id: staffUserA.id,
            name: staffUserA.fullName,
            role: 'STAFF',
          }
        ),
      ])

      const fulfilled = [res1, res2].filter((r) => r.status === 'fulfilled')
      const rejected = [res1, res2].filter((r) => r.status === 'rejected')

      // Exactly one must succeed and one must fail
      expect(fulfilled.length).toBe(1)
      expect(rejected.length).toBe(1)
      expect((rejected[0] as PromiseRejectedResult).reason.message).toContain('INSUFFICIENT_STOCK')

      // Stock must be exactly 0, never negative
      const stockXL = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: uniformXLId },
      })
      expect(Number(stockXL?.availableQuantity)).toBe(0)
    })
  })

  describe('4. Idempotency & Duplicate Prevention', () => {
    it('returns existing issuance without extra stock deduction on duplicate idempotencyKey', async () => {
      const wbLine = defaultBundleA.items.find((it) => it.itemName === 'Phonics Workbook')
      await replenishItemStock(wbLine!.itemId!, locationA1, 25)

      const idempKey = `test_idemp_${Date.now()}`

      // First call
      const res1 = await WelcomeKitService.issueWelcomeKit(
        tenantA,
        {
          studentId: studentA3.id,
          uniformSize: 'M',
          locationId: locationA1,
          idempotencyKey: idempKey,
        },
        {
          id: principalUserA.id,
          name: principalUserA.fullName,
          role: 'PRINCIPAL',
        }
      )
      expect(res1.isExisting).toBe(false)
      const initialKitNum = res1.kitNumber

      // Record stock right after first call
      const stockWb = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: wbLine!.itemId! },
      })
      const qtyAfterFirst = Number(stockWb?.availableQuantity)

      // Second call with same idempotencyKey (simulating network retry / double-click)
      const res2 = await WelcomeKitService.issueWelcomeKit(
        tenantA,
        {
          studentId: studentA3.id,
          uniformSize: 'M',
          locationId: locationA1,
          idempotencyKey: idempKey,
        },
        {
          id: principalUserA.id,
          name: principalUserA.fullName,
          role: 'PRINCIPAL',
        }
      )
      expect(res2.isExisting).toBe(true)
      expect(res2.kitIssuance.kitNumber).toBe(initialKitNum)

      // Stock was NOT decremented twice!
      const stockWbAfterSecond = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: wbLine!.itemId! },
      })
      expect(Number(stockWbAfterSecond?.availableQuantity)).toBe(qtyAfterFirst)
    })

    it('blocks duplicate welcome kit issuance to same student without override flag', async () => {
      // Student A1 already received a kit
      await expect(
        WelcomeKitService.issueWelcomeKit(
          tenantA,
          {
            studentId: studentA1.id,
            uniformSize: 'M',
            locationId: locationA1,
          },
          {
            id: principalUserA.id,
            name: principalUserA.fullName,
            role: 'PRINCIPAL',
          }
        )
      ).rejects.toThrow('DUPLICATE_ISSUANCE')
    })
  })

  describe('5. Security, Roles & Cross-Tenant Isolation', () => {
    it('rejects kit issuance from unauthorized roles (e.g. DRIVER)', async () => {
      await expect(
        WelcomeKitService.issueWelcomeKit(
          tenantA,
          {
            studentId: studentA2.id,
            uniformSize: 'M',
            locationId: locationA1,
          },
          {
            id: unauthorizedUserA.id,
            name: unauthorizedUserA.fullName,
            role: 'DRIVER',
          }
        )
      ).rejects.toThrow('UNAUTHORIZED')
    })

    it('prevents cross-tenant issuance attempts', async () => {
      await expect(
        WelcomeKitService.issueWelcomeKit(
          tenantB, // Tenant B attempting to issue to Tenant A's student
          {
            studentId: studentA1.id,
            uniformSize: 'M',
            locationId: locationB1,
          },
          {
            id: principalUserA.id,
            name: principalUserA.fullName,
            role: 'PRINCIPAL',
          }
        )
      ).rejects.toThrow('STUDENT_NOT_FOUND')
    })
  })

  describe('6. Authoritative Handover Slip Generation & Reprinting', () => {
    it('generates complete handover slip matching the committed transaction', async () => {
      // Retrieve slip for Student A1's kit
      const issuances = await db.studentKitIssuance.findMany({
        where: { studentId: studentA1.id },
      })
      expect(issuances.length).toBeGreaterThan(0)
      const kitId = issuances[0].id

      const slip = await WelcomeKitService.getHandoverSlip(tenantA, kitId)

      expect(slip.kitIssuanceId).toBe(kitId)
      expect(slip.student.fullName).toBe('Aarav Sharma')
      expect(slip.student.admissionNo).toBe(studentA1.admissionNo)
      expect(slip.bundleName).toBe('Nursery Welcome Kit')
      expect(slip.uniformSize).toBe('M')
      expect(slip.totalItemsQuantity).toBe(5)
      expect(slip.items.length).toBe(4)
      expect(slip.school.branchName).toBe('Main Campus A')
    })

    it('allows reprinting handover slip repeatedly without modifying stock', async () => {
      const issuances = await db.studentKitIssuance.findMany({
        where: { studentId: studentA1.id },
      })
      const kitId = issuances[0].id

      const wbLine = defaultBundleA.items.find((it) => it.itemName === 'Phonics Workbook')
      const stockBefore = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: wbLine!.itemId! },
      })
      const qtyBefore = Number(stockBefore?.availableQuantity)

      // Fetch slip multiple times (reprints)
      await WelcomeKitService.getHandoverSlip(tenantA, kitId)
      await WelcomeKitService.getHandoverSlip(tenantA, kitId)

      const stockAfter = await db.inventoryStock.findFirst({
        where: { locationId: locationA1, itemId: wbLine!.itemId! },
      })
      expect(Number(stockAfter?.availableQuantity)).toBe(qtyBefore)
    })
  })

  describe('7. API Endpoints Integration', () => {
    it('GET /api/v1/inventory/welcome-kits/bundles returns available bundles', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/welcome-kits/bundles', {
        method: 'GET',
        headers: {
          cookie: `${SESSION_COOKIE}=${principalCookieA}`,
        },
      })

      const res = await bundlesGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.bundles.length).toBeGreaterThan(0)
      expect(json.data.bundles[0].code).toBe('NURSERY_WELCOME_KIT')
    })

    it('GET /api/v1/inventory/welcome-kits/eligibility validates student', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/inventory/welcome-kits/eligibility?studentId=${studentA2.id}`,
        {
          method: 'GET',
          headers: {
            cookie: `${SESSION_COOKIE}=${principalCookieA}`,
          },
        }
      )

      const res = await eligibilityGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.student.admissionNo).toBe(studentA2.admissionNo)
    })

    it('GET /api/v1/inventory/welcome-kits/slip returns authoritative receipt', async () => {
      const issuances = await db.studentKitIssuance.findMany({
        where: { studentId: studentA1.id },
      })
      const kitNum = issuances[0].kitNumber

      const req = new NextRequest(
        `http://localhost:3000/api/v1/inventory/welcome-kits/slip?id=${kitNum}`,
        {
          method: 'GET',
          headers: {
            cookie: `${SESSION_COOKIE}=${principalCookieA}`,
          },
        }
      )

      const res = await slipGet(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.kitNumber).toBe(kitNum)
      expect(json.data.totalItemsQuantity).toBe(5)
    })
  })
})
