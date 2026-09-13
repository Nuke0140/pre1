import { db } from './db'

/**
 * Business number generator — INV-{FY}-{SEQ} pattern per docs.
 * e.g. INV-2026-0001, PAY-2026-0003, RCT-2026-0002
 */
export async function nextNumber(
  model: 'invoice' | 'payment' | 'receipt' | 'lead' | 'application',
  tenantId: string
): Promise<string> {
  const fy = new Date().getFullYear()
  const prefixMap = {
    invoice: 'INV',
    payment: 'PAY',
    receipt: 'RCT',
    lead: 'LEAD',
    application: 'ADM',
  } as const
  const prefix = `${prefixMap[model]}-${fy}`

  let seq = 0
  switch (model) {
    case 'invoice': {
      const c = await db.invoice.count({ where: { tenantId, invoiceNumber: { startsWith: prefix } } })
      seq = c + 1
      break
    }
    case 'payment': {
      const c = await db.payment.count({ where: { tenantId, paymentNumber: { startsWith: prefix } } })
      seq = c + 1
      break
    }
    case 'receipt': {
      // tenant-scoped sequence — receiptNumber is unique per tenant (M01 §53 fix)
      const c = await db.receipt.count({ where: { tenantId, receiptNumber: { startsWith: prefix } } })
      seq = c + 1
      break
    }
    case 'lead': {
      const c = await db.lead.count({ where: { tenantId, leadNumber: { startsWith: prefix } } })
      seq = c + 1
      break
    }
    case 'application': {
      const c = await db.admissionApplication.count({
        where: { tenantId, applicationNumber: { startsWith: prefix } },
      })
      seq = c + 1
      break
    }
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`
}

export { audit, recordAudit } from './audit'
export type { AuditEntry } from './audit'

