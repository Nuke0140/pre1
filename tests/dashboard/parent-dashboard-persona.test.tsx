import { describe, it, expect } from 'bun:test'
import * as fs from 'node:fs'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { normalizeRole } from '@/lib/roles'
import { can } from '@/lib/auth'
import { ParentToday, ChildData } from '@/app/app/dashboard/ParentToday'

describe('Parent Persona & Multi-Child Switcher Test Suite (Step 5)', () => {
  const pageSource = fs.readFileSync('src/app/app/dashboard/page.tsx', 'utf-8')
  const parentTodaySource = fs.readFileSync('src/app/app/dashboard/ParentToday.tsx', 'utf-8')
  const parentApiSource = fs.readFileSync('src/app/api/v1/parent/today/route.ts', 'utf-8')
  const parentDocsApiSource = fs.readFileSync('src/app/api/v1/parent/documents/route.ts', 'utf-8')

  describe('1. Role Routing & Server Authorization', () => {
    it('verifies PARENT and GUARDIAN normalize to canonical family roles', () => {
      expect(normalizeRole('PARENT')).toBe('PARENT')
      expect(normalizeRole('GUARDIAN')).toBe('GUARDIAN')
    })

    it('verifies dashboard controller maps PARENT and GUARDIAN to ParentToday', () => {
      expect(pageSource).toContain("if (canonicalRole === 'PARENT' || canonicalRole === 'GUARDIAN')")
      expect(pageSource).toContain('return <ParentToday />')
    })

    it('verifies parent API requires timeline:read permission and authenticated tenant context', () => {
      expect(parentApiSource).toContain("requireApi(req, 'timeline:read')")
      expect(parentApiSource).toContain("if (!session.tenantId) return Errors.forbidden('No tenant context')")
    })

    it('verifies parents are granted timeline:read permission in auth matrix', () => {
      expect(can('PARENT', 'timeline:read')).toBe(true)
      expect(can('GUARDIAN', 'timeline:read')).toBe(true)
    })
  })

  describe('2. Guardian Authorization & Tenant-Isolation in Parent APIs', () => {
    it('verifies parent/today queries guardian by session.uid and tenantId strictly', () => {
      expect(parentApiSource).toContain('db.guardian.findMany({\n      where: { userId: session.uid, tenantId, deletedAt: null },')
    })

    it('verifies parent/today rejects unauthorized studentId requests', () => {
      expect(parentApiSource).toContain('filterStudentId && !linkedStudentIds.includes(filterStudentId)')
      expect(parentApiSource).toContain("return Errors.forbidden('You are not authorized to view records for this student')")
    })

    it('verifies parent/documents rejects unauthorized studentId requests', () => {
      expect(parentDocsApiSource).toContain('filterStudentId && !linkedStudentIds.includes(filterStudentId)')
      expect(parentDocsApiSource).toContain("return Errors.forbidden('You are not authorized to view documents for this student')")
    })
  })

  describe('3. Multi-Child Switcher Architecture & Accessibility', () => {
    it('verifies ParentToday implements tablist and tab roles with ARIA attributes', () => {
      expect(parentTodaySource).toContain('role="tablist"')
      expect(parentTodaySource).toContain('role="tab"')
      expect(parentTodaySource).toContain('role="tabpanel"')
      expect(parentTodaySource).toContain('aria-selected={isSelected}')
      expect(parentTodaySource).toContain('aria-controls={`panel-child-${child.id}`}')
      expect(parentTodaySource).toContain('aria-labelledby={`tab-child-${childDetail.id}`}')
    })

    it('verifies ParentToday prevents stale data by resetting childDetail during transitions', () => {
      expect(parentTodaySource).toContain('setChildDetail(null)')
      expect(parentTodaySource).toContain('setSwitchingChild(true)')
      expect(parentTodaySource).toContain('!switchingChild && childDetail && (')
    })

    it('verifies switching child queries scoped APIs with URL parameter and AbortController signal', () => {
      expect(parentTodaySource).toContain('/api/v1/parent/today?studentId=')
      expect(parentTodaySource).toContain('/api/v1/parent/documents?studentId=')
      expect(parentTodaySource).toContain('signal: controller.signal')
    })

    it('verifies latest-request-wins request sequencing and cancellation (DASH-5.1-01 fix)', () => {
      expect(parentTodaySource).toContain('const activeRequestIdRef = useRef<number>(0)')
      expect(parentTodaySource).toContain('const abortControllerRef = useRef<AbortController | null>(null)')
      expect(parentTodaySource).toContain('activeRequestIdRef.current !== currentRequestId')
      expect(parentTodaySource).toContain('activeRequestIdRef.current === currentRequestId')
      expect(parentTodaySource).toContain('abortControllerRef.current.abort()')
    })
  })

  describe('4. Component Execution & Server-Side Rendering', () => {
    const mockChildren: ChildData[] = [
      {
        id: 'child-1',
        name: 'Aarav Patel',
        admissionNo: 'PRE-2026-001',
        photoUrl: null,
        classroom: 'Toddlers A',
        teacher: 'Priya Sharma',
        attendance: 'PRESENT',
        todayCare: [
          { type: 'MEAL', title: 'Fruit snack', body: 'Ate all papaya slices', mood: 'HAPPY', at: new Date().toISOString() },
        ],
        latestUpdate: { narrative: 'Showed great curiosity during nature block play.', observedAt: new Date().toISOString(), category: 'COGNITIVE' },
        feesDue: [
          { invoiceNumber: 'INV-101', dueDate: new Date().toISOString(), balanceCents: 450000, status: 'ISSUED' },
        ],
        alerts: [],
      },
      {
        id: 'child-2',
        name: 'Isha Patel',
        admissionNo: 'PRE-2026-002',
        photoUrl: null,
        classroom: 'Nursery B',
        teacher: 'Anita Verma',
        attendance: 'PRESENT',
        todayCare: [],
        latestUpdate: null,
        feesDue: [],
        alerts: [],
      },
    ]

    it('renders ParentToday with multi-child data and renders child switcher tabs', () => {
      const html = renderToString(
        <ParentToday initialChildren={mockChildren} initialToday="18 Oct 2026" />
      )
      expect(html).toContain('role="tablist"')
      expect(html).toContain('Aarav Patel')
      expect(html).toContain('Isha Patel')
      expect(html).toContain('Switch Child Profile')
      expect(html).toContain('aria-selected="true"')
    })

    it('renders ParentToday with empty children and displays honest empty state', () => {
      const html = renderToString(
        <ParentToday initialChildren={[]} initialToday="18 Oct 2026" />
      )
      expect(html).toContain('No children linked')
      expect(html).not.toContain('role="tablist"')
    })

    it('renders ParentToday with single child without multi-child switcher tab rail', () => {
      const singleChild = [mockChildren[0]]
      const html = renderToString(
        <ParentToday initialChildren={singleChild} initialToday="18 Oct 2026" />
      )
      expect(html).toContain('Aarav Patel')
      expect(html).not.toContain('role="tablist"')
      expect(html).not.toContain('Switch Child Profile')
    })
  })

  describe('5. Deterministic Race Condition Simulation & Request Sequencing Logic', () => {
    // Pure algorithmic verification of the request sequencing state machine used in ParentToday
    function createRequestSequencer() {
      let activeRequestId = 0
      let committedChild: ChildData | null = null
      let isSwitching = false
      let committedDocs: any[] = []

      function startRequest(childId: string) {
        const requestId = ++activeRequestId
        committedChild = null
        isSwitching = true
        committedDocs = []

        return {
          requestId,
          commitSuccess(data: { child: ChildData; docs: any[] }) {
            if (activeRequestId === requestId) {
              committedChild = data.child
              committedDocs = data.docs
              isSwitching = false
              return true
            }
            return false // superseded
          },
          commitFailure(fallbackChild?: ChildData) {
            if (activeRequestId === requestId) {
              if (fallbackChild) committedChild = fallbackChild
              isSwitching = false
              return true
            }
            return false // superseded
          },
          get currentActiveId() {
            return activeRequestId
          },
        }
      }

      return {
        startRequest,
        getState: () => ({ committedChild, isSwitching, committedDocs, activeRequestId }),
      }
    }

    it('1. Child A starts loading, then Child B is selected; A finishes last and cannot overwrite B', () => {
      const sequencer = createRequestSequencer()

      const childA: ChildData = {
        id: 'child-A',
        name: 'Aarav',
        admissionNo: '001',
        photoUrl: null,
        classroom: null,
        teacher: null,
        attendance: null,
        todayCare: [],
        latestUpdate: null,
        feesDue: [],
        alerts: [],
      }

      const childB: ChildData = {
        id: 'child-B',
        name: 'Bhavna',
        admissionNo: '002',
        photoUrl: null,
        classroom: null,
        teacher: null,
        attendance: null,
        todayCare: [],
        latestUpdate: null,
        feesDue: [],
        alerts: [],
      }

      // Step 1: User selects Child A
      const reqA = sequencer.startRequest('child-A')
      expect(sequencer.getState().isSwitching).toBe(true)

      // Step 2: User rapidly selects Child B before A completes
      const reqB = sequencer.startRequest('child-B')
      expect(reqB.requestId).toBeGreaterThan(reqA.requestId)

      // Step 3: Req B resolves first
      const bCommitted = reqB.commitSuccess({ child: childB, docs: [{ id: 'doc-B' }] })
      expect(bCommitted).toBe(true)
      expect(sequencer.getState().committedChild?.id).toBe('child-B')
      expect(sequencer.getState().isSwitching).toBe(false)

      // Step 4: Req A arrives delayed (out of order)
      const aCommitted = reqA.commitSuccess({ child: childA, docs: [{ id: 'doc-A' }] })
      expect(aCommitted).toBe(false) // Must be discarded

      // Invariant check: Child B remains the committed state
      expect(sequencer.getState().committedChild?.id).toBe('child-B')
      expect(sequencer.getState().committedDocs[0].id).toBe('doc-B')
    })

    it('2. A -> B -> A rapid switching leaves the final A selection and its data consistent', () => {
      const sequencer = createRequestSequencer()

      const childA: ChildData = {
        id: 'child-A',
        name: 'Aarav',
        admissionNo: '001',
        photoUrl: null,
        classroom: null,
        teacher: null,
        attendance: null,
        todayCare: [],
        latestUpdate: null,
        feesDue: [],
        alerts: [],
      }

      const childB: ChildData = {
        id: 'child-B',
        name: 'Bhavna',
        admissionNo: '002',
        photoUrl: null,
        classroom: null,
        teacher: null,
        attendance: null,
        todayCare: [],
        latestUpdate: null,
        feesDue: [],
        alerts: [],
      }

      // User rapidly selects A -> B -> A
      const reqA1 = sequencer.startRequest('child-A')
      const reqB = sequencer.startRequest('child-B')
      const reqA2 = sequencer.startRequest('child-A')

      // Responses resolve in chaotic order: B, then A1, then A2
      expect(reqB.commitSuccess({ child: childB, docs: [] })).toBe(false)
      expect(reqA1.commitSuccess({ child: childA, docs: [] })).toBe(false)

      const finalCommitted = reqA2.commitSuccess({ child: childA, docs: [{ id: 'doc-A2' }] })
      expect(finalCommitted).toBe(true)
      expect(sequencer.getState().committedChild?.id).toBe('child-A')
      expect(sequencer.getState().committedDocs[0].id).toBe('doc-A2')
    })

    it('3. A superseded request cannot clear the current request loading state', () => {
      const sequencer = createRequestSequencer()
      const reqA = sequencer.startRequest('child-A')
      const reqB = sequencer.startRequest('child-B')

      expect(sequencer.getState().isSwitching).toBe(true)

      // Delayed A attempts to complete
      reqA.commitSuccess({ child: {} as any, docs: [] })

      // Switching flag MUST remain true because reqB is still pending!
      expect(sequencer.getState().isSwitching).toBe(true)
    })

    it('4. A failed obsolete request cannot replace the current child error or data state', () => {
      const sequencer = createRequestSequencer()
      const reqA = sequencer.startRequest('child-A')
      const reqB = sequencer.startRequest('child-B')

      // Delayed A fails
      const aCommitted = reqA.commitFailure({ id: 'fallback-A' } as any)
      expect(aCommitted).toBe(false)
      expect(sequencer.getState().committedChild).toBeNull()
      expect(sequencer.getState().isSwitching).toBe(true)
    })
  })
})
