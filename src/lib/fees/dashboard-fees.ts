import type { InvoiceStatus } from '@prisma/client'

export interface DashboardInvoiceRecord {
  id?: string
  invoiceNumber?: string
  totalCents: number
  paidCents: number
  balanceCents: number
  status: InvoiceStatus | string
  dueDate: Date | string
  issueDate?: Date | string
  studentName?: string | null
  academicSessionId?: string | null
}

export interface DashboardFeeMetrics {
  /**
   * Total active billed revenue:
   * Legally issued or settled billables (ISSUED, PARTIALLY_PAID, PAID, OVERDUE).
   * - Excludes DRAFT: uncommitted/provisional drafts pending school dispatch.
   * - Excludes CANCELLED: voided transactions.
   * - Excludes WRITTEN_OFF: bad debts written off that are no longer active billables.
   */
  billed: number

  /**
   * Total collected to date across all recognized invoices.
   */
  collected: number

  /**
   * Currently overdue receivable balance:
   * Outstanding balance on OVERDUE invoices, or active unpaid invoices (ISSUED, PARTIALLY_PAID)
   * whose due date has passed.
   * Strictly excludes DRAFT, CANCELLED, PAID, and WRITTEN_OFF.
   */
  overdue: number

  /**
   * Collection efficiency percentage:
   * (collected / billed) * 100, clamped to 0-100 integer percentage.
   */
  collectRate: number

  /**
   * Unissued draft invoices awaiting dispatch/approval.
   * Kept separate from active billed/collectible totals.
   */
  draftCount: number
  draftTotalCents: number

  /**
   * Count of active invoices that are past due.
   */
  overdueCount: number

  /**
   * Count of settled paid invoices.
   */
  paidCount: number
}

/**
 * Pure helper to calculate dashboard fee metrics from invoice records and a reference date.
 */
export function calculateDashboardFeeMetrics(
  invoices: DashboardInvoiceRecord[],
  referenceDate: Date = new Date()
): DashboardFeeMetrics {
  const refTime = referenceDate.getTime()

  // 1. Separate Draft invoices as uncommitted pending work
  const draftInvoices = invoices.filter((inv) => inv.status === 'DRAFT')
  const draftCount = draftInvoices.length
  const draftTotalCents = draftInvoices.reduce((sum, inv) => sum + (inv.totalCents || 0), 0)

  // 2. Active billable invoices: Exclude DRAFT, CANCELLED, and WRITTEN_OFF
  const activeInvoices = invoices.filter(
    (inv) => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED' && inv.status !== 'WRITTEN_OFF'
  )

  const billed = activeInvoices.reduce((sum, inv) => sum + (inv.totalCents || 0), 0)
  const collected = activeInvoices.reduce((sum, inv) => sum + (inv.paidCents || 0), 0)

  // 3. Overdue outstanding balance and count:
  // Must be an active invoice, not fully paid, not cancelled or written off.
  // Either status is explicitly OVERDUE, or status is (ISSUED / PARTIALLY_PAID) with dueDate < referenceDate.
  const overdueInvoices = activeInvoices.filter((inv) => {
    if (inv.status === 'PAID') return false
    if (inv.status === 'OVERDUE') return true
    const dueTime = new Date(inv.dueDate).getTime()
    return (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID') && dueTime < refTime
  })

  const overdue = overdueInvoices.reduce((sum, inv) => sum + (inv.balanceCents || 0), 0)
  const overdueCount = overdueInvoices.length

  const paidCount = activeInvoices.filter((inv) => inv.status === 'PAID').length

  const collectRate = billed > 0 ? Math.round((collected / billed) * 100) : 0

  return {
    billed,
    collected,
    overdue,
    collectRate,
    draftCount,
    draftTotalCents,
    overdueCount,
    paidCount,
  }
}
