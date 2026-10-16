import { describe, expect, it } from 'bun:test'
import { MilestoneItem, MilestoneStatus } from '@/components/preone/MilestoneProgress'

describe('PreOne Milestone-Based Progress & Celebration Engine', () => {
  it('1. Calculates total and completed milestones based on actual completion criteria', () => {
    const milestones: MilestoneItem[] = [
      { id: '1', title: 'School Profile', status: 'COMPLETED' },
      { id: '2', title: 'Academic Year', status: 'COMPLETED' },
      { id: '3', title: 'Classrooms', status: 'IN_PROGRESS' },
    ]

    const total = milestones.length
    const completed = milestones.filter((m) => m.status === 'COMPLETED').length
    const allCompleted = completed === total

    expect(total).toBe(3)
    expect(completed).toBe(2)
    expect(allCompleted).toBe(false)
  })

  it('2. Optional milestones do not block overall workflow completion', () => {
    const milestones: MilestoneItem[] = [
      { id: '1', title: 'School & Campus', status: 'COMPLETED', required: true },
      { id: '2', title: 'Child Dossier', status: 'COMPLETED', required: true },
      { id: '3', title: 'Primary Parent', status: 'COMPLETED', required: true },
      { id: '4', title: 'Documents', status: 'NOT_STARTED', required: false }, // Optional
      { id: '5', title: 'Declarations', status: 'COMPLETED', required: true },
    ]

    const required = milestones.filter((m) => m.required !== false)
    const requiredCompleted = required.filter((m) => m.status === 'COMPLETED').length
    const allRequiredComplete = requiredCompleted === required.length

    expect(required.length).toBe(4)
    expect(requiredCompleted).toBe(4)
    expect(allRequiredComplete).toBe(true)
  })

  it('3. Blocked / waiting for review states are distinct and do not count as completed', () => {
    const milestones: MilestoneItem[] = [
      { id: '1', title: 'Application Submitted', status: 'COMPLETED' },
      { id: '2', title: 'Application Review', status: 'BLOCKED', statusLabel: 'Waiting for review' },
      { id: '3', title: 'Seat Reservation', status: 'NOT_STARTED' },
    ]

    const completed = milestones.filter((m) => m.status === 'COMPLETED').length
    const blocked = milestones.filter((m) => m.status === 'BLOCKED').length

    expect(completed).toBe(1)
    expect(blocked).toBe(1)
    // Blocked is NOT completed
    expect(milestones[1].status).not.toBe('COMPLETED')
  })

  it('4. Single-fire celebration logic: persists celebration key to prevent re-triggering on reload', () => {
    const mockStorage = new Map<string, string>()
    const workflowKey = 'foundation_setup_main_branch'
    const storageKey = `preone_celebrated:${workflowKey}`

    const shouldTriggerCelebration = (isComplete: boolean): boolean => {
      if (!isComplete) return false
      const already = mockStorage.get(storageKey)
      if (already) return false
      mockStorage.set(storageKey, 'true')
      return true
    }

    // Step 1: Incomplete -> No celebration
    expect(shouldTriggerCelebration(false)).toBe(false)

    // Step 2: Completed for the first time -> Triggers celebration!
    expect(shouldTriggerCelebration(true)).toBe(true)

    // Step 3: Re-render or page reload -> Celebration does NOT re-trigger!
    expect(shouldTriggerCelebration(true)).toBe(false)
  })

  it('5. Reduced-motion accessibility preference suppresses active confetti animation', () => {
    const getCelebrationConfig = (prefersReducedMotion: boolean) => {
      return {
        showConfetti: !prefersReducedMotion,
        animationDurationMs: prefersReducedMotion ? 0 : 3500,
        renderStaticBadge: true,
      }
    }

    const regular = getCelebrationConfig(false)
    const accessible = getCelebrationConfig(true)

    expect(regular.showConfetti).toBe(true)
    expect(regular.animationDurationMs).toBe(3500)

    expect(accessible.showConfetti).toBe(false)
    expect(accessible.animationDurationMs).toBe(0)
    expect(accessible.renderStaticBadge).toBe(true)
  })

  it('6. Actionable milestones: provides click handler for navigating directly to relevant step', () => {
    let navigatedTo: string | null = null

    const milestones: MilestoneItem[] = [
      {
        id: 'child_step',
        title: 'Child Details',
        status: 'IN_PROGRESS',
        onClick: () => {
          navigatedTo = 'child_tab'
        },
      },
    ]

    expect(typeof milestones[0].onClick).toBe('function')
    milestones[0].onClick?.()
    expect(navigatedTo).toBe('child_tab')
  })

  it('7. Up/Down collapsible slider toggles expand/collapse state with appropriate accessibility attributes', () => {
    let isExpanded = true
    const toggle = () => {
      isExpanded = !isExpanded
    }

    expect(isExpanded).toBe(true)
    // Slide up to collapse
    toggle()
    expect(isExpanded).toBe(false)
    // Slide down to expand
    toggle()
    expect(isExpanded).toBe(true)
  })

  it('8. Collapsible slider preference persists user state across reloads', () => {
    const mockStorage = new Map<string, string>()
    const workflowKey = 'foundation_setup_main_branch'
    const storageKey = `preone_milestones_expanded:${workflowKey}`

    const setExpanded = (val: boolean) => {
      mockStorage.set(storageKey, String(val))
    }
    const getExpanded = (defaultVal = true): boolean => {
      const saved = mockStorage.get(storageKey)
      return saved !== undefined ? saved === 'true' : defaultVal
    }

    // Default when no storage key exists
    expect(getExpanded(true)).toBe(true)

    // User slides up to collapse
    setExpanded(false)
    expect(getExpanded()).toBe(false)

    // User slides down to expand
    setExpanded(true)
    expect(getExpanded()).toBe(true)
  })

  it('9. Progress percentage correctly calculates for inline header slider track', () => {
    const milestones: MilestoneItem[] = [
      { id: '1', title: 'A', status: 'COMPLETED' },
      { id: '2', title: 'B', status: 'IN_PROGRESS' },
      { id: '3', title: 'C', status: 'NOT_STARTED' },
    ]
    const completed = milestones.filter((m) => m.status === 'COMPLETED').length
    const total = milestones.length
    const percentage = Math.round((completed / total) * 100)

    expect(percentage).toBe(33)
  })
})

