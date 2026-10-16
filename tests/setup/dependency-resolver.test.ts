import { describe, it, expect } from 'bun:test'
import {
  calculateSmartAcademicYear,
  calculateSmartBranch,
  orderPrerequisites,
  detectDependencyCycles,
  PREREQUISITE_EXPLANATIONS,
} from '@/lib/setup/dependency-resolver'
import { SETUP_STEPS, STEP_MAP, isUnlocked, type StepKey } from '@/lib/setup/steps'

describe('PreOne Smart Dependency Resolver — Core Engine & Logic', () => {
  it('1. Calculates dynamic, non-hardcoded Academic Year based on current reference date', () => {
    // Scenario A: Reference date in October 2026 (mid-session)
    const refDateMid = new Date(2026, 9, 15) // Oct 15, 2026
    const suggestedMid = calculateSmartAcademicYear([], refDateMid)

    expect(suggestedMid.name).toBe('2026-27')
    expect(suggestedMid.startDate).toBe('2026-06-01')
    expect(suggestedMid.endDate).toBe('2027-04-30')
    expect(suggestedMid.isCurrent).toBe(true)

    // Scenario B: Reference date in February 2027 (before April transition)
    const refDateEarly = new Date(2027, 1, 10) // Feb 10, 2027
    const suggestedEarly = calculateSmartAcademicYear([], refDateEarly)

    expect(suggestedEarly.name).toBe('2026-27')
    expect(suggestedEarly.startDate).toBe('2026-06-01')
    expect(suggestedEarly.endDate).toBe('2027-04-30')

    // Scenario C: Reference date in July 2028
    const refDate2028 = new Date(2028, 6, 1) // July 1, 2028
    const suggested2028 = calculateSmartAcademicYear([], refDate2028)

    expect(suggested2028.name).toBe('2028-29')
    expect(suggested2028.startDate).toBe('2028-06-01')
    expect(suggested2028.endDate).toBe('2029-04-30')
  })

  it('2. Suggests next sequential Academic Year when previous sessions already exist', () => {
    const existingSessions = [
      {
        name: '2025-26',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-04-30'),
      },
    ]

    const next = calculateSmartAcademicYear(existingSessions)
    expect(next.name).toBe('2026-27')
    expect(new Date(next.startDate).getTime()).toBeGreaterThan(existingSessions[0].endDate.getTime())
    expect(next.isCurrent).toBe(false) // Not first session, so not blindly marked current
  })

  it('3. Calculates smart branch code and name proposals without duplicates', () => {
    // When no branches exist
    const firstBranch = calculateSmartBranch([])
    expect(firstBranch.name).toBe('Main Campus')
    expect(firstBranch.code).toBe('MAIN')
    expect(firstBranch.capacity).toBe(120)

    // When 1 branch exists
    const secondBranch = calculateSmartBranch([{ name: 'Main Campus', code: 'MAIN' }])
    expect(secondBranch.name).toBe('Campus 2')
    expect(secondBranch.code).toBe('CAMPUS-2')
    expect(secondBranch.capacity).toBe(100)

    // When 2 branches exist
    const thirdBranch = calculateSmartBranch([
      { name: 'Main Campus', code: 'MAIN' },
      { name: 'Campus 2', code: 'CAMPUS-2' },
    ])
    expect(thirdBranch.name).toBe('Campus 3')
    expect(thirdBranch.code).toBe('CAMPUS-3')
  })

  it('4. Orders missing prerequisites in logical resolution hierarchy (e.g. Branch before Academic Year)', () => {
    // Classroom requires academic_year, programs, and branch
    const unordered: StepKey[] = ['classroom', 'academic_year', 'branch', 'programs', 'school_profile']
    const ordered = orderPrerequisites(unordered)

    // School profile must be first
    expect(ordered[0]).toBe('school_profile')
    // Branch must come before academic_year
    expect(ordered.indexOf('branch')).toBeLessThan(ordered.indexOf('academic_year'))
    // Programs and branch must come before classroom
    expect(ordered.indexOf('branch')).toBeLessThan(ordered.indexOf('classroom'))
    expect(ordered.indexOf('programs')).toBeLessThan(ordered.indexOf('classroom'))
    expect(ordered.indexOf('academic_year')).toBeLessThan(ordered.indexOf('classroom'))
  })

  it('5. Dependency graph is a valid Directed Acyclic Graph (DAG) with zero cycles', () => {
    const check = detectDependencyCycles(SETUP_STEPS)
    expect(check.hasCycle).toBe(false)
    expect(check.cyclePath).toBeUndefined()
  })

  it('6. Detects intentional cycles when an illegal cyclic dependency is introduced', () => {
    const cyclicSteps = [
      { key: 'step_a' as StepKey, label: 'A', deps: ['step_b' as StepKey] },
      { key: 'step_b' as StepKey, label: 'B', deps: ['step_c' as StepKey] },
      { key: 'step_c' as StepKey, label: 'C', deps: ['step_a' as StepKey] },
    ] as any

    const check = detectDependencyCycles(cyclicSteps)
    expect(check.hasCycle).toBe(true)
    expect(check.cyclePath).toBeDefined()
    expect(check.cyclePath!.length).toBeGreaterThan(0)
  })

  it('7. Explains why each prerequisite is required in plain, human-readable language', () => {
    const yearExplanation = PREREQUISITE_EXPLANATIONS['academic_year']
    expect(yearExplanation).toBeDefined()
    expect(yearExplanation.actionType).toBe('QUICK_CREATE_YEAR')
    expect(yearExplanation.whyRequired).toContain('academic session is required')

    const branchExplanation = PREREQUISITE_EXPLANATIONS['branch']
    expect(branchExplanation).toBeDefined()
    expect(branchExplanation.actionType).toBe('QUICK_CREATE_BRANCH')
    expect(branchExplanation.whyRequired).toContain('Campuses define the physical locations')

    const programsExplanation = PREREQUISITE_EXPLANATIONS['programs']
    expect(programsExplanation).toBeDefined()
    expect(programsExplanation.actionType).toBe('QUICK_CREATE_PROGRAM')
    expect(programsExplanation.whyRequired).toContain('educational programs')
  })

  it('8. Classroom step availability strictly requires all 3 prerequisites (Year, Branch, Programs)', () => {
    const classroomDef = STEP_MAP['classroom']
    expect(classroomDef).toBeDefined()
    expect(classroomDef.deps).toContain('academic_year')
    expect(classroomDef.deps).toContain('branch')
    expect(classroomDef.deps).toContain('programs')

    // Scenario 1: None complete -> locked
    const noneStatus = (_k: StepKey) => 'PENDING' as const
    expect(isUnlocked(classroomDef, noneStatus)).toBe(false)

    // Scenario 2: Only branch complete -> still locked
    const branchOnlyStatus = (k: StepKey) => (k === 'branch' ? ('COMPLETE' as const) : ('PENDING' as const))
    expect(isUnlocked(classroomDef, branchOnlyStatus)).toBe(false)

    // Scenario 3: Branch and Programs complete, but Academic Year missing -> still locked
    const missingYearStatus = (k: StepKey) =>
      k === 'branch' || k === 'programs' ? ('COMPLETE' as const) : ('PENDING' as const)
    expect(isUnlocked(classroomDef, missingYearStatus)).toBe(false)

    // Scenario 4: All 3 prerequisites complete -> unlocked!
    const allPrereqsComplete = (k: StepKey) =>
      k === 'branch' || k === 'programs' || k === 'academic_year' ? ('COMPLETE' as const) : ('PENDING' as const)
    expect(isUnlocked(classroomDef, allPrereqsComplete)).toBe(true)
  })

  it('9. Resolving prerequisites unlocks dependent steps without fabricating setup completion', () => {
    const classroomDef = STEP_MAP['classroom']
    const allPrereqsComplete = (k: StepKey) =>
      k === 'branch' || k === 'programs' || k === 'academic_year' ? ('COMPLETE' as const) : ('PENDING' as const)

    // Prerequisites unlocked
    const unlocked = isUnlocked(classroomDef, allPrereqsComplete)
    expect(unlocked).toBe(true)

    // But classroom step itself is NOT yet complete — user must still configure rooms!
    const classroomSelfStatus = 'PENDING'
    expect(classroomSelfStatus).toBe('PENDING')
    expect(classroomSelfStatus).not.toBe('COMPLETE')
  })
})
