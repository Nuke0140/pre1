import { describe, it, expect } from 'bun:test'
import {
  calculateDashboardFeeMetrics,
  DashboardInvoiceRecord,
} from '@/lib/fees/dashboard-fees'

describe('Dashboard Invoice Calculation Hardening (Step 2.2)', () => {
  const referenceDate = new Date('2026-10-18T00:00:00.000Z')

  it('1. Correctly calculates metrics for standard issued and paid invoices', () => {
    const invoices: DashboardInvoiceRecord[] = [
      {
        totalCents: 100000, // ₹1,000
        paidCents: 100000,
        balanceCents: 0,
        status: 'PAID',
        dueDate: '2026-10-15T00:00:00.000Z',
      },
      {
        totalCents: 200000, // ₹2,000
        paidCents: 50000,
        balanceCents: 150000,
        status: 'PARTIALLY_PAID',
        dueDate: '2026-10-25T00:00:00.000Z', // Future due date
      },
      {
        totalCents: 300000, // ₹3,000
        paidCents: 0,
        balanceCents: 300000,
        status: 'ISSUED',
        dueDate: '2026-10-30T00:00:00.000Z', // Future due date
      },
    ]

    const result = calculateDashboardFeeMetrics(invoices, referenceDate)

    expect(result.billed).toBe(600000) // 100000 + 200000 + 300000
    expect(result.collected).toBe(150000) // 100000 + 50000
    expect(result.overdue).toBe(0) // None overdue
    expect(result.collectRate).toBe(25) // (150000 / 600000) * 100 = 25%
  })

  it('2. Strictly excludes DRAFT invoices from billed, collected, and overdue', () => {
    const invoices: DashboardInvoiceRecord[] = [
      {
        totalCents: 500000,
        paidCents: 0,
        balanceCents: 500000,
        status: 'DRAFT',
        dueDate: '2026-10-10T00:00:00.000Z',
      },
    ]

    const result = calculateDashboardFeeMetrics(invoices, referenceDate)

    expect(result.billed).toBe(0)
    expect(result.collected).toBe(0)
    expect(result.overdue).toBe(0)
    expect(result.collectRate).toBe(0)
  })

  it('3. Strictly excludes CANCELLED invoices from billed, collected, and overdue', () => {
    const invoices: DashboardInvoiceRecord[] = [
      {
        totalCents: 400000,
        paidCents: 100000,
        balanceCents: 300000,
        status: 'CANCELLED',
        dueDate: '2026-10-01T00:00:00.000Z',
      },
    ]

    const result = calculateDashboardFeeMetrics(invoices, referenceDate)

    expect(result.billed).toBe(0)
    expect(result.collected).toBe(0)
    expect(result.overdue).toBe(0)
    expect(result.collectRate).toBe(0)
  })

  it('4. Strictly excludes WRITTEN_OFF bad debts from active billed and overdue balances', () => {
    const invoices: DashboardInvoiceRecord[] = [
      {
        totalCents: 350000,
        paidCents: 50000,
        balanceCents: 300000,
        status: 'WRITTEN_OFF',
        dueDate: '2026-09-01T00:00:00.000Z', // Past due
      },
    ]

    const result = calculateDashboardFeeMetrics(invoices, referenceDate)

    // Written off debts must not be counted as active billed or active overdue receivables
    expect(result.billed).toBe(0)
    expect(result.collected).toBe(0)
    expect(result.overdue).toBe(0)
    expect(result.collectRate).toBe(0)
  })

  it('5. Correctly flags overdue invoices: explicit OVERDUE status and past-due ISSUED/PARTIALLY_PAID', () => {
    const invoices: DashboardInvoiceRecord[] = [
      // Explicit OVERDUE
      {
        totalCents: 100000,
        paidCents: 20000,
        balanceCents: 80000,
        status: 'OVERDUE',
        dueDate: '2026-10-10T00:00:00.000Z',
      },
      // Past-due ISSUED
      {
        totalCents: 150000,
        paidCents: 0,
        balanceCents: 150000,
        status: 'ISSUED',
        dueDate: '2026-10-14T00:00:00.000Z', // Past due relative to Oct 18
      },
      // Past-due PARTIALLY_PAID
      {
        totalCents: 200000,
        paidCents: 50000,
        balanceCents: 150000,
        status: 'PARTIALLY_PAID',
        dueDate: '2026-10-16T00:00:00.000Z', // Past due relative to Oct 18
      },
      // Future ISSUED (Not overdue)
      {
        totalCents: 250000,
        paidCents: 0,
        balanceCents: 250000,
        status: 'ISSUED',
        dueDate: '2026-10-25T00:00:00.000Z',
      },
    ]

    const result = calculateDashboardFeeMetrics(invoices, referenceDate)

    expect(result.billed).toBe(700000) // 100000 + 150000 + 200000 + 250000
    expect(result.collected).toBe(70000) // 20000 + 50000
    // Overdue balance: 80000 (OVERDUE) + 150000 (past ISSUED) + 150000 (past PARTIALLY_PAID) = 380000
    expect(result.overdue).toBe(380000)
    expect(result.collectRate).toBe(10) // 70000 / 700000 = 10%
  })

  it('6. Handles edge cases: empty array and zero billed amount safely', () => {
    const resultEmpty = calculateDashboardFeeMetrics([])
    expect(resultEmpty.billed).toBe(0)
    expect(resultEmpty.collected).toBe(0)
    expect(resultEmpty.overdue).toBe(0)
    expect(resultEmpty.collectRate).toBe(0)

    const resultZeroBilled = calculateDashboardFeeMetrics([
      {
        totalCents: 0,
        paidCents: 0,
        balanceCents: 0,
        status: 'PAID',
        dueDate: '2026-10-10T00:00:00.000Z',
      },
    ])
    expect(resultZeroBilled.billed).toBe(0)
    expect(resultZeroBilled.collectRate).toBe(0)
  })
})
