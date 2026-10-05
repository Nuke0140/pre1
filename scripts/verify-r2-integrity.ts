import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8')

const schema = read('prisma/schema.prisma')
const migration = read('prisma/migrations/20261006_r2_payment_idempotency/migration.sql')
const paymentRoute = read('src/app/api/v1/invoices/[id]/payments/route.ts')
const feeService = read('src/lib/fees/fee-service.ts')
const allocationRoute = read('src/app/api/v1/students/[id]/allocate/route.ts')
const promotionRoute = read('src/app/api/v1/academic-years/[id]/promote/route.ts')

const checks: Array<[string, boolean]> = [
  ['tenant payment transactionRef unique in Prisma schema', schema.includes('@@unique([tenantId, transactionRef])')],
  ['guarded payment unique migration exists', migration.includes('payments_tenantId_transactionRef_key')],
  ['migration blocks pre-existing duplicate refs', migration.includes('GROUP BY "tenantId", "transactionRef"')],
  ['invoice payment requires idempotency key', paymentRoute.includes('transactionRef or Idempotency-Key is required')],
  ['invoice payment locks invoice row', paymentRoute.includes('FOR UPDATE')],
  ['invoice payment uses tenant transactionRef compound lookup', paymentRoute.includes('tenantId_transactionRef')],
  ['service payment requires transactionRef', feeService.includes('transactionRef or Idempotency-Key is required for payment writes')],
  ['service payment locks invoice row', feeService.includes('FROM "invoices"') && feeService.includes('FOR UPDATE')],
  ['service verification locks payment row', feeService.includes('FROM "payments"') && feeService.includes('FOR UPDATE')],
  ['allocation route locks classroom row', allocationRoute.includes('FROM "classrooms"') && allocationRoute.includes('FOR UPDATE')],
  ['allocation route rechecks active count in transaction', allocationRoute.includes('tx.student.count')],
  ['promotion locks target classroom row', promotionRoute.includes('FROM "classrooms"') && promotionRoute.includes('FOR UPDATE')],
]

let failed = 0
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`)
  if (!ok) failed++
}

if (failed) process.exit(1)
console.log('\nALL R2 STATIC INTEGRITY ASSERTIONS PASSED')