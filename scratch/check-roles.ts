import 'dotenv/config'
import { db } from '../src/lib/db'

async function main() {
  const res = await db.$queryRawUnsafe<{ enumlabel: string }[]>(
    `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'UserRole'`
  )
  console.log('PostgreSQL UserRole enum values:', res.map(r => r.enumlabel))

  const userRoles = await db.tenantUser.groupBy({
    by: ['role'],
    _count: true,
  })
  console.log('Existing tenantUser role distribution:', userRoles)
}

main().catch(console.error).finally(() => process.exit(0))
