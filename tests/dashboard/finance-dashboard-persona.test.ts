import { describe, it, expect } from 'bun:test'
import * as fs from 'node:fs'
import { normalizeRole } from '@/lib/roles'
import { can } from '@/lib/auth'
import {
  calculateDashboardFeeMetrics,
  DashboardInvoiceRecord,
} from '@/lib/fees/dashboard-fees'
import { FinanceDashboardView } from '@/app/app/dashboard/FinanceDashboardView'

describe('Finance Persona (ACCOUNTS / ACCOUNTANT) Architecture & Integration Suite (Step 4)', () => {
  const pageSource = fs.readFileSync('src/app/app/dashboard/page.tsx', 'utf-8')
  const financeViewSource = fs.readFileSync('src/app/app/dashboard/FinanceDashboardView.tsx', 'utf-8')

  describe('1. Role Routing & Permission Model Integration', () => {
    it('verifies ACCOUNTS and legacy alias ACCOUNTANT normalize to ACCOUNTS', () => {
      expect(normalizeRole('ACCOUNTS')).toBe('ACCOUNTS')
      expect(normalizeRole('ACCOUNTANT')).toBe('ACCOUNTS')
    })

    it('verifies ACCOUNTS and ACCOUNTANT are authorized for finance:read', () => {
      expect(can('ACCOUNTS', 'finance:read')).toBe(true)
      expect(can('ACCOUNTANT', 'finance:read')).toBe(true)
    })

    it('verifies non-finance roles are strictly denied finance:read', () => {
      expect(can('TEACHER', 'finance:read')).toBe(false)
      expect(can('COORDINATOR', 'finance:read')).toBe(false)
      expect(can('STAFF', 'finance:read')).toBe(false)
      expect(can('RECEPTIONIST', 'finance:read')).toBe(false)
      expect(can('DRIVER', 'finance:read')).toBe(false)
      expect(can('ATTENDANT', 'finance:read')).toBe(false)
    })

    it('verifies dashboard controller maps canonicalRole ACCOUNTS to FinanceDashboardView', () => {
      expect(pageSource).toContain("if (canonicalRole === 'ACCOUNTS')")
      expect(pageSource).toContain('<FinanceDashboardView')
    })

    it('verifies server-side authorization guard redirects unauthorized users to /app/home', () => {
      expect(pageSource).toContain("const canReadFinance = can(session.role, 'finance:read')")
      expect(pageSource).toContain("if (!canReadFinance) {\n      redirect('/app/home')\n    }")
    })
  })

  describe('2. Server Data Scoping & Academic Session Filtering', () => {
    it('verifies invoices and payments queries are tenant-scoped', () => {
      expect(pageSource).toContain('db.invoice.findMany({\n        where: {\n          tenantId,')
      expect(pageSource).toContain('db.payment.findMany({\n        where: {\n          tenantId,')
    })

    it('verifies session filtering applies when activeSession.id is present', () => {
      expect(pageSource).toContain('...(activeSession?.id ? { academicSessionId: activeSession.id } : {})')
      expect(pageSource).toContain('...(activeSession?.id ? { invoice: { academicSessionId: activeSession.id } } : {})')
    })

    it('verifies missing active session is surfaced without crashing or inventing IDs', () => {
      expect(financeViewSource).toContain('All-Time Cumulative View (No Active Academic Session)')
      expect(financeViewSource).toContain('No active academic session was detected')
    })
  })

  describe('3. Draft Invoices Isolation & Work Queue Telemetry', () => {
    const referenceDate = new Date('2026-10-18T00:00:00.000Z')

    it('strictly separates DRAFT invoices from billed revenue and tracks draft work queue', () => {
      const records: DashboardInvoiceRecord[] = [
        {
          totalCents: 150000,
          paidCents: 150000,
          balanceCents: 0,
          status: 'PAID',
          dueDate: '2026-10-15T00:00:00.000Z',
        },
        {
          totalCents: 200000,
          paidCents: 0,
          balanceCents: 200000,
          status: 'ISSUED',
          dueDate: '2026-10-25T00:00:00.000Z',
        },
        {
          totalCents: 350000,
          paidCents: 0,
          balanceCents: 350000,
          status: 'DRAFT',
          dueDate: '2026-10-20T00:00:00.000Z',
        },
        {
          totalCents: 100000,
          paidCents: 0,
          balanceCents: 100000,
          status: 'DRAFT',
          dueDate: '2026-10-22T00:00:00.000Z',
        },
      ]

      const metrics = calculateDashboardFeeMetrics(records, referenceDate)

      // Active billed revenue includes ONLY PAID + ISSUED = 150000 + 200000 = 350000
      expect(metrics.billed).toBe(350000)
      expect(metrics.collected).toBe(150000)
      expect(metrics.overdue).toBe(0)

      // Draft metrics are counted and tracked separately
      expect(metrics.draftCount).toBe(2)
      expect(metrics.draftTotalCents).toBe(450000) // 350000 + 100000
    })

    it('verifies FinanceDashboardView renders dedicated Draft notice when draftCount > 0', () => {
      expect(financeViewSource).toContain('metrics.draftCount > 0 && (')
      expect(financeViewSource).toContain('Draft Invoices Pending')
      expect(financeViewSource).toContain('Draft invoices are isolated from legal billed receivables')
      expect(financeViewSource).toContain('/app/finance?tab=invoices&status=DRAFT')
    })
  })

  describe('4. Component Execution & Empty State Integrity', () => {
    it('executes FinanceDashboardView with empty datasets and renders honest empty states', () => {
      const emptyMetrics = {
        billed: 0,
        collected: 0,
        overdue: 0,
        collectRate: 0,
        draftCount: 0,
        draftTotalCents: 0,
        overdueCount: 0,
        paidCount: 0,
      }

      const view = FinanceDashboardView({
        role: 'ACCOUNTS',
        sessionName: '2026-27',
        metrics: emptyMetrics,
        recentInvoices: [],
        recentPayments: [],
      })

      expect(view).not.toBeNull()
      expect(view.props['className']).toBe('premium-enter')
    })

    it('verifies honest empty state labels exist in FinanceDashboardView source', () => {
      expect(financeViewSource).toContain('No Invoices Issued')
      expect(financeViewSource).toContain('No Payments Recorded')
      expect(financeViewSource).toContain('recentInvoices.length === 0')
      expect(financeViewSource).toContain('recentPayments.length === 0')
    })

    it('verifies design tokens, responsive quick-action strip, and status pills are preserved', () => {
      expect(financeViewSource).toContain('quick-action-strip')
      expect(financeViewSource).toContain('operational-hero')
      expect(financeViewSource).toContain('StatusBadge')
      expect(financeViewSource).toContain('KpiMetricCard')
      expect(financeViewSource).toContain('dash-grid')
    })
  })
})
