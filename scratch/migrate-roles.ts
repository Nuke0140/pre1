import 'dotenv/config'
import { db } from '../src/lib/db'

async function main() {
  console.log('Adding new roles to UserRole enum in PostgreSQL...')
  const rolesToAdd = ['GUARDIAN', 'HELPER', 'ACCOUNTANT', 'HR', 'DRIVER']
  
  for (const role of rolesToAdd) {
    try {
      await db.$executeRawUnsafe(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS '${role}'`)
      console.log(`✓ Added ${role} to UserRole enum`)
    } catch (err: any) {
      console.log(`Note for ${role}: ${err.message}`)
    }
  }

  const res = await db.$queryRawUnsafe<{ enumlabel: string }[]>(
    `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'UserRole'`
  )
  console.log('\nUpdated PostgreSQL UserRole enum values:', res.map(r => r.enumlabel))
}

main().catch(console.error).finally(() => process.exit(0))
