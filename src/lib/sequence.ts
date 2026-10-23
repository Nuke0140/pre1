import { db } from './db'

/**
 * Business number generator — INV-{FY}-{SEQ} pattern per docs.
 * e.g. INV-2026-0001, PAY-2026-0003, RCT-2026-0002
 */
export async function nextNumber(
  model:
    | 'invoice'
    | 'payment'
    | 'receipt'
    | 'lead'
    | 'application'
    | 'student'
    | 'material_request'
    | 'purchase_request'
    | 'purchase_order'
    | 'goods_receipt'
    | 'stock_issue'
    | 'stock_return'
    | 'stock_adjustment'
    | 'employee',
  tenantId: string
): Promise<string> {
  const fy = new Date().getFullYear()
  const prefixMap = {
    invoice: 'INV',
    payment: 'PAY',
    receipt: 'RCT',
    lead: 'LEAD',
    application: 'ADM',
    student: 'STU',
    material_request: 'MR',
    purchase_request: 'PR',
    purchase_order: 'PO',
    goods_receipt: 'GRN',
    stock_issue: 'ISS',
    stock_return: 'RET',
    stock_adjustment: 'ADJ',
    employee: 'EMP',
  } as const
  const prefix = `${prefixMap[model]}-${fy}`

function extractMaxSeq(identifiers: (string | null | undefined)[]): number {
  let max = 0
  for (const id of identifiers) {
    if (!id) continue
    const parts = id.split('-')
    const num = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(num) && num > max) {
      max = num
    }
  }
  return max
}

  let seq = 0
  switch (model) {
    case 'employee': {
      const records = await db.staffProfile.findMany({
        where: { tenantId, employeeCode: { startsWith: prefix } },
        select: { employeeCode: true },
      })
      seq = extractMaxSeq(records.map((r) => r.employeeCode)) + 1
      return `${prefix}-${String(seq).padStart(3, '0')}`
    }
    case 'invoice': {
      const records = await db.invoice.findMany({
        where: { tenantId, invoiceNumber: { startsWith: prefix } },
        select: { invoiceNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.invoiceNumber)) + 1
      break
    }
    case 'payment': {
      const records = await db.payment.findMany({
        where: { tenantId, paymentNumber: { startsWith: prefix } },
        select: { paymentNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.paymentNumber)) + 1
      break
    }
    case 'receipt': {
      const records = await db.receipt.findMany({
        where: { tenantId, receiptNumber: { startsWith: prefix } },
        select: { receiptNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.receiptNumber)) + 1
      break
    }
    case 'lead': {
      const records = await db.lead.findMany({
        where: { tenantId, leadNumber: { startsWith: prefix } },
        select: { leadNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.leadNumber)) + 1
      break
    }
    case 'application': {
      const records = await db.admissionApplication.findMany({
        where: { tenantId, applicationNumber: { startsWith: prefix } },
        select: { applicationNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.applicationNumber)) + 1
      break
    }
    case 'student': {
      const records = await db.student.findMany({
        where: { tenantId, admissionNo: { startsWith: prefix } },
        select: { admissionNo: true },
      })
      seq = extractMaxSeq(records.map((r) => r.admissionNo)) + 1
      break
    }
    case 'material_request': {
      const records = await db.materialRequest.findMany({
        where: { tenantId, requestNumber: { startsWith: prefix } },
        select: { requestNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.requestNumber)) + 1
      break
    }
    case 'purchase_request': {
      const records = await db.purchaseRequest.findMany({
        where: { tenantId, requestNumber: { startsWith: prefix } },
        select: { requestNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.requestNumber)) + 1
      break
    }
    case 'purchase_order': {
      const records = await db.purchaseOrder.findMany({
        where: { tenantId, poNumber: { startsWith: prefix } },
        select: { poNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.poNumber)) + 1
      break
    }
    case 'goods_receipt': {
      const records = await db.goodsReceipt.findMany({
        where: { tenantId, grnNumber: { startsWith: prefix } },
        select: { grnNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.grnNumber)) + 1
      break
    }
    case 'stock_issue': {
      const records = await db.stockIssue.findMany({
        where: { tenantId, issueNumber: { startsWith: prefix } },
        select: { issueNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.issueNumber)) + 1
      break
    }
    case 'stock_return': {
      const records = await db.stockReturn.findMany({
        where: { tenantId, returnNumber: { startsWith: prefix } },
        select: { returnNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.returnNumber)) + 1
      break
    }
    case 'stock_adjustment': {
      const records = await db.stockAdjustment.findMany({
        where: { tenantId, adjustmentNumber: { startsWith: prefix } },
        select: { adjustmentNumber: true },
      })
      seq = extractMaxSeq(records.map((r) => r.adjustmentNumber)) + 1
      break
    }
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`
}

export { audit, recordAudit } from './audit'
export type { AuditEntry } from './audit'

