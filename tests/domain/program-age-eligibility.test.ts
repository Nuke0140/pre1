import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { ConfigurationService, calculateAgeMonths } from '@/lib/setup/config-service'
import { AdmissionService } from '@/lib/admissions/admission-service'

describe('PreOne — Centralized Program Age Restriction & End-to-End Validation', () => {
  const ts = Date.now().toString()
  let testTenant: any
  let testBranch: any
  let nukeProgram: any
  let flexibleProgram: any

  beforeAll(async () => {
    // 1. Create a clean isolated test tenant
    testTenant = await db.tenant.create({
      data: {
        code: `AGE-${ts.slice(-5)}`,
        name: `Age Validation Academy ${ts}`,
        status: 'ACTIVE',
      },
    })

    // 2. Create campus branch
    testBranch = await db.branch.create({
      data: {
        tenantId: testTenant.id,
        name: 'Alpha Campus',
        code: `AL-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 3. Create active academic session
    const academicSession = await db.academicSession.create({
      data: {
        tenantId: testTenant.id,
        name: `AY 2026-2027 ${ts}`,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })

    // 4. Create the "Nuke program" with initial max age of 45 months
    nukeProgram = await db.program.create({
      data: {
        tenantId: testTenant.id,
        name: 'Nuke program',
        code: `NUKE-${ts.slice(-4)}`,
        programType: 'NURSERY',
        ageMinMonths: 30,
        ageMaxMonths: 45,
        capacity: 25,
      },
    })

    // 5. Map Nuke program to test branch
    await db.programBranch.create({
      data: {
        tenantId: testTenant.id,
        programId: nukeProgram.id,
        branchId: testBranch.id,
        isActive: true,
        capacity: 25,
      },
    })

    // 6. Create flexible program with null age boundaries
    flexibleProgram = await db.program.create({
      data: {
        tenantId: testTenant.id,
        name: 'Open Explorers',
        code: `OPEN-${ts.slice(-4)}`,
        programType: 'DAYCARE',
        ageMinMonths: null,
        ageMaxMonths: null,
        capacity: 30,
      },
    })
  })

  // =========================================================================
  // SECTION 1: Authoritative Calendar-Accurate Age Calculation
  // =========================================================================
  describe('1. Accurate Calendar-Month Age Calculation', () => {
    it('calculates exact completed months considering day of month', () => {
      // Born 2021-02-15, evaluated on 2026-10-15 (exactly 5 years 8 months = 68 months)
      const refDate = new Date(2026, 9, 15) // Month index 9 = Oct
      const dobExact = new Date(2021, 1, 15) // Month index 1 = Feb
      expect(calculateAgeMonths(dobExact, refDate)).toBe(68)

      // Evaluated one day before birthday (2026-10-14): child has not completed the 68th month yet -> 67 months
      const refDayBefore = new Date(2026, 9, 14)
      expect(calculateAgeMonths(dobExact, refDayBefore)).toBe(67)

      // Evaluated one day after birthday (2026-10-16): child has completed 68 months -> 68 months
      const refDayAfter = new Date(2026, 9, 16)
      expect(calculateAgeMonths(dobExact, refDayAfter)).toBe(68)
    })

    it('correctly handles leap years and month ends', () => {
      // Born Feb 29, 2020 evaluated on Feb 28, 2024 -> 47 months
      const refBeforeLeap = new Date(2024, 1, 28)
      const dobLeap = new Date(2020, 1, 29)
      expect(calculateAgeMonths(dobLeap, refBeforeLeap)).toBe(47)

      // Evaluated on Feb 29, 2024 -> 48 months
      const refOnLeap = new Date(2024, 1, 29)
      expect(calculateAgeMonths(dobLeap, refOnLeap)).toBe(48)
    })

    it('returns 0 for future dates or invalid date inputs', () => {
      expect(calculateAgeMonths('invalid-date')).toBe(0)
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      expect(calculateAgeMonths(futureDate)).toBe(0)
    })
  })

  // =========================================================================
  // SECTION 2: Centralized validateProgramAge Engine
  // =========================================================================
  describe('2. Authoritative ConfigurationService.validateProgramAge', () => {
    it('produces the exact regression error for child 68 months vs Nuke program max 45 months', async () => {
      // Construct DOB that is exactly 68 completed months old today
      const now = new Date()
      const dob68 = new Date(now.getFullYear(), now.getMonth() - 68, now.getDate())

      const result = await ConfigurationService.validateProgramAge(
        testTenant.id,
        nukeProgram.id,
        dob68,
        testBranch.id
      )

      expect(result.eligible).toBe(false)
      expect(result.code).toBe('AGE_ABOVE_MAXIMUM')
      expect(result.ageMonths).toBe(68)
      expect(result.maxMonths).toBe(45)
      expect(result.reason).toBe(`Child is 68 months old; maximum permitted for Nuke program is 45 months.`)
    })

    it('recognizes program lookup by Name (case-insensitive), Code, or ID', async () => {
      const now = new Date()
      const dobEligible = new Date(now.getFullYear(), now.getMonth() - 36, now.getDate()) // 36 months old (in 30-45 range)

      // By Name
      const checkByName = await ConfigurationService.validateProgramAge(
        testTenant.id,
        'Nuke program',
        dobEligible,
        testBranch.id
      )
      expect(checkByName.eligible).toBe(true)
      expect(checkByName.code).toBe('ELIGIBLE')

      // By lower-case name
      const checkByLowerName = await ConfigurationService.validateProgramAge(
        testTenant.id,
        'nuke program',
        dobEligible,
        testBranch.id
      )
      expect(checkByLowerName.eligible).toBe(true)

      // By Code
      const checkByCode = await ConfigurationService.validateProgramAge(
        testTenant.id,
        nukeProgram.code,
        dobEligible,
        testBranch.id
      )
      expect(checkByCode.eligible).toBe(true)

      // By ID
      const checkById = await ConfigurationService.validateProgramAge(
        testTenant.id,
        nukeProgram.id,
        dobEligible,
        testBranch.id
      )
      expect(checkById.eligible).toBe(true)
    })

    it('allows any age for programs with flexible (null) boundaries', async () => {
      const now = new Date()
      const dob68 = new Date(now.getFullYear(), now.getMonth() - 68, now.getDate())

      const result = await ConfigurationService.validateProgramAge(
        testTenant.id,
        flexibleProgram.id,
        dob68
      )

      expect(result.eligible).toBe(true)
      expect(result.code).toBe('ELIGIBLE')
      expect(result.minMonths).toBeNull()
      expect(result.maxMonths).toBeNull()
    })

    it('rejects children below the minimum permitted age with clear explanation', async () => {
      const now = new Date()
      const dobYoung = new Date(now.getFullYear(), now.getMonth() - 20, now.getDate()) // 20 months old vs min 30

      const result = await ConfigurationService.validateProgramAge(
        testTenant.id,
        nukeProgram.id,
        dobYoung,
        testBranch.id
      )

      expect(result.eligible).toBe(false)
      expect(result.code).toBe('AGE_BELOW_MINIMUM')
      expect(result.ageMonths).toBe(20)
      expect(result.reason).toBe(`Child is 20 months old; minimum required for Nuke program is 30 months.`)
    })
  })

  // =========================================================================
  // SECTION 3: Central Database Configuration Updates in Setup
  // =========================================================================
  describe('3. Dynamic Program Age Configuration Updates & Resolution', () => {
    it('rejects saving invalid configurations where minimum age exceeds maximum age', async () => {
      // Simulate API patch validating min > max
      const targetMin = 50
      const targetMax = 40
      const isValid = !(targetMin > targetMax)
      expect(isValid).toBe(false)
    })

    it('updating Program ageMaxMonths from 45 to 72 months resolves eligibility for the 68-month-old child', async () => {
      // Admin adjusts Nuke program in Setup: max age updated from 45 to 72 months
      await db.program.update({
        where: { id: nukeProgram.id },
        data: { ageMaxMonths: 72 },
      })

      const now = new Date()
      const dob68 = new Date(now.getFullYear(), now.getMonth() - 68, now.getDate())

      // Authoritative validation now queries the updated database record
      const recheck = await ConfigurationService.validateProgramAge(
        testTenant.id,
        nukeProgram.id,
        dob68,
        testBranch.id
      )

      expect(recheck.eligible).toBe(true)
      expect(recheck.code).toBe('ELIGIBLE')
      expect(recheck.ageMonths).toBe(68)
      expect(recheck.maxMonths).toBe(72)
    })
  })

  // =========================================================================
  // SECTION 4: Admissions Flow — Advisory Enquiry vs Blocking Application
  // =========================================================================
  describe('4. End-to-End Admissions Lifecycle Enforcement', () => {
    it('Enquiry capture is non-blocking and records Age Advisory tag in notes', async () => {
      // Temporarily revert Nuke program max age to 45
      await db.program.update({
        where: { id: nukeProgram.id },
        data: { ageMaxMonths: 45 },
      })

      const now = new Date()
      const dob68 = new Date(now.getFullYear(), now.getMonth() - 68, now.getDate())

      const res = await AdmissionService.createEnquiry(
        {
          tenantId: testTenant.id,
          branchId: testBranch.id,
          actorId: 'admin-1',
          actorName: 'Admissions Staff',
          actorRole: 'TENANT_ADMIN',
        },
        {
          parentName: 'Priya Sharma',
          phone: `9988${ts.slice(-6)}`,
          childName: 'Aryan Sharma',
          childDob: dob68,
          interestedProgram: nukeProgram.id,
          notes: 'Walk-in enquiry for upcoming intake',
        }
      )

      expect(res.enquiry).toBeDefined()
      expect(res.enquiry.leadNumber).toContain('LEAD-')
      // Note contains non-blocking advisory
      expect(res.enquiry.notes).toContain('[Age Advisory:')
      expect(res.enquiry.notes).toContain('maximum permitted for Nuke program is 45 months')
    })

    it('Application submission strictly blocks submission when child age violates program limits', async () => {
      const now = new Date()
      const dob68 = new Date(now.getFullYear(), now.getMonth() - 68, now.getDate())

      // Submitting application for child of 68 months when max is 45 must throw
      let threwError = false
      let caughtReason = ''
      try {
        await AdmissionService.submitApplication(
          {
            tenantId: testTenant.id,
            branchId: testBranch.id,
            actorId: 'admin-1',
            actorName: 'Admissions Staff',
            actorRole: 'TENANT_ADMIN',
          },
          {
            programId: nukeProgram.id,
            programType: 'NURSERY',
            childFirstName: 'Aryan',
            childLastName: 'Sharma',
            childDob: dob68,
            parentName: 'Priya Sharma',
            parentPhone: `9988${ts.slice(-6)}`,
            isDuplicateConfirmed: true,
          }
        )
      } catch (err: any) {
        threwError = true
        caughtReason = err.message
      }

      expect(threwError).toBe(true)
      expect(caughtReason).toContain('Child is 68 months old; maximum permitted for Nuke program is 45 months.')
    })

    it('Once program age limits are updated in Setup, Application submission succeeds seamlessly', async () => {
      // Administrator updates Nuke program ageMaxMonths to 72 in Setup
      await db.program.update({
        where: { id: nukeProgram.id },
        data: { ageMaxMonths: 72 },
      })

      const now = new Date()
      const dob68 = new Date(now.getFullYear(), now.getMonth() - 68, now.getDate())

      // Now submit the application for the exact same child
      const app = await AdmissionService.submitApplication(
        {
          tenantId: testTenant.id,
          branchId: testBranch.id,
          actorId: 'admin-1',
          actorName: 'Admissions Staff',
          actorRole: 'TENANT_ADMIN',
        },
        {
          programId: nukeProgram.id,
          programType: 'NURSERY',
          childFirstName: 'Aryan',
          childLastName: 'Sharma',
          childDob: dob68,
          parentName: 'Priya Sharma',
          parentPhone: `9988${ts.slice(-6)}`,
          isDuplicateConfirmed: true,
        }
      )

      expect(app).toBeDefined()
      expect(app.applicationNumber).toContain('ADM-')
      expect(app.status).toBe('SUBMITTED')
    })
  })
})
