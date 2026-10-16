import { describe, it, expect } from 'bun:test'
import {
  SETUP_SCOPE_REGISTRY,
  CATEGORY_COPY_POLICIES,
  calculateScopedProgress,
  type CopyableCategory,
} from '@/lib/setup/scope-model'

describe('PreOne Setup Scope Model & Scoped Progress Engine', () => {
  it('1. Authoritatively classifies all setup steps as either TENANT (Global) or BRANCH (Campus-Specific)', () => {
    // School-Wide / Global setup items
    const globalSteps = ['school_profile', 'branch', 'branding', 'roles', 'templates', 'communication', 'curriculum']
    for (const stepKey of globalSteps) {
      const step = (SETUP_SCOPE_REGISTRY as any)[stepKey]
      expect(step).toBeDefined()
      expect(step.scope).toBe('TENANT')
      expect(step.globalLabel).toBe('🌐 All Branches')
      expect(step.schoolWideExplanation).toBeDefined()
      expect(step.schoolWideExplanation.length).toBeGreaterThan(0)
    }

    // Branch-Specific setup items
    const branchSteps = ['academic_year', 'programs', 'classroom', 'subject', 'fees_setup', 'promotion']
    for (const stepKey of branchSteps) {
      const step = (SETUP_SCOPE_REGISTRY as any)[stepKey]
      expect(step).toBeDefined()
      expect(step.scope).toBe('BRANCH')
      expect(step.globalLabel).toBe('🏫 Branch Specific')
      expect(step.branchLabelPrefix).toBe('🏫 Branch Specific · ')
      expect(step.branchSpecificExplanation).toBeDefined()
      expect(step.branchSpecificExplanation.length).toBeGreaterThan(0)
    }
  })

  it('2. Enforces category-level copy policies and strictly excludes sensitive operational records', () => {
    const supportedCategories: CopyableCategory[] = ['classrooms', 'fee_structures', 'programs', 'facilities']

    for (const cat of supportedCategories) {
      const policy = CATEGORY_COPY_POLICIES[cat]
      expect(policy).toBeDefined()
      expect(policy.supported).toBe(true)
      expect(policy.copiedFields.length).toBeGreaterThan(0)
      expect(policy.transformedFields.length).toBeGreaterThan(0)
      expect(policy.excludedFields.length).toBeGreaterThan(0)
    }

    // Verify classrooms policy excludes staff credentials & students
    const classroomPolicy = CATEGORY_COPY_POLICIES.classrooms
    expect(classroomPolicy.excludedFields.some((f) => f.includes('primaryTeacherId'))).toBe(true)
    expect(classroomPolicy.excludedFields.some((f) => f.includes('students'))).toBe(true)
    expect(classroomPolicy.excludedFields.some((f) => f.includes('attendances'))).toBe(true)

    // Verify fee structures policy excludes invoices & payment transactions
    const feePolicy = CATEGORY_COPY_POLICIES.fee_structures
    expect(feePolicy.excludedFields.some((f) => f.includes('invoices'))).toBe(true)
    expect(feePolicy.excludedFields.some((f) => f.includes('payments'))).toBe(true)
    expect(feePolicy.excludedFields.some((f) => f.includes('studentFeeSchedules'))).toBe(true)
  })

  it('3. Calculates scoped progress independently for School-Wide and Branch-Specific configuration', () => {
    const testSteps = [
      // 3 Global steps (2 completed, 1 pending)
      { key: 'school_profile', scope: 'TENANT', status: 'COMPLETE', applicability: 'MANDATORY' },
      { key: 'branch', scope: 'TENANT', status: 'COMPLETE', applicability: 'MANDATORY' },
      { key: 'branding', scope: 'TENANT', status: 'PENDING', applicability: 'RECOMMENDED' },

      // 4 Branch steps (1 completed, 3 pending)
      { key: 'academic_year', scope: 'BRANCH', status: 'COMPLETE', applicability: 'MANDATORY' },
      { key: 'programs', scope: 'BRANCH', status: 'PENDING', applicability: 'MANDATORY' },
      { key: 'classroom', scope: 'BRANCH', status: 'PENDING', applicability: 'MANDATORY' },
      { key: 'fees_setup', scope: 'BRANCH', status: 'PENDING', applicability: 'MANDATORY' },
    ]

    const metrics = calculateScopedProgress(testSteps, 'branch-north', 'North Campus')

    // School-wide: 3 total, 2 completed -> 67%
    expect(metrics.schoolWide.total).toBe(3)
    expect(metrics.schoolWide.completed).toBe(2)
    expect(metrics.schoolWide.percentage).toBe(67)
    // Both mandatory school-wide steps (school_profile, branch) are complete!
    expect(metrics.schoolWide.isComplete).toBe(true)

    // Branch-specific: 4 total, 1 completed -> 25%
    expect(metrics.branchSpecific.branchId).toBe('branch-north')
    expect(metrics.branchSpecific.branchName).toBe('North Campus')
    expect(metrics.branchSpecific.total).toBe(4)
    expect(metrics.branchSpecific.completed).toBe(1)
    expect(metrics.branchSpecific.percentage).toBe(25)
    expect(metrics.branchSpecific.isComplete).toBe(false)

    // Combined: 7 total, 3 completed -> 43%
    expect(metrics.combined.total).toBe(7)
    expect(metrics.combined.completed).toBe(3)
    expect(metrics.combined.percentage).toBe(43)
  })

  it('4. Ensures one branch completing setup does not mark other branches complete', () => {
    const branchASteps = [
      { key: 'classroom', scope: 'BRANCH', status: 'COMPLETE', applicability: 'MANDATORY' },
      { key: 'fees_setup', scope: 'BRANCH', status: 'COMPLETE', applicability: 'MANDATORY' },
    ]
    const branchBSteps = [
      { key: 'classroom', scope: 'BRANCH', status: 'PENDING', applicability: 'MANDATORY' },
      { key: 'fees_setup', scope: 'BRANCH', status: 'PENDING', applicability: 'MANDATORY' },
    ]

    const metricsA = calculateScopedProgress(branchASteps, 'branch-a', 'Branch A')
    const metricsB = calculateScopedProgress(branchBSteps, 'branch-b', 'Branch B')

    expect(metricsA.branchSpecific.isComplete).toBe(true)
    expect(metricsA.branchSpecific.percentage).toBe(100)

    expect(metricsB.branchSpecific.isComplete).toBe(false)
    expect(metricsB.branchSpecific.percentage).toBe(0)
  })
})
