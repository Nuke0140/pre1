import { db } from '../src/lib/db'

async function migrate() {
  console.log('Starting legacy role migration...')

  // 1. ACCOUNTS -> ACCOUNTANT
  const resAccounts = await db.$executeRawUnsafe(`
    UPDATE "tenant_users"
    SET role = 'ACCOUNTANT'::"UserRole"
    WHERE role = 'ACCOUNTS'::"UserRole"
  `)
  console.log('Updated ACCOUNTS to ACCOUNTANT in role:', resAccounts)

  // 2. GUARDIAN -> PARENT
  const resGuardian = await db.$executeRawUnsafe(`
    UPDATE "tenant_users"
    SET role = 'PARENT'::"UserRole"
    WHERE role = 'GUARDIAN'::"UserRole"
  `)
  console.log('Updated GUARDIAN to PARENT in role:', resGuardian)

  // 3. RECEPTION -> HELPER
  const resReception = await db.$executeRawUnsafe(`
    UPDATE "tenant_users"
    SET role = 'HELPER'::"UserRole"
    WHERE role = 'RECEPTION'::"UserRole"
  `)
  console.log('Updated RECEPTION to HELPER in role:', resReception)

  // 4. COORDINATOR -> HELPER
  const resCoordinator = await db.$executeRawUnsafe(`
    UPDATE "tenant_users"
    SET role = 'HELPER'::"UserRole"
    WHERE role = 'COORDINATOR'::"UserRole"
  `)
  console.log('Updated COORDINATOR to HELPER in role:', resCoordinator)

  // Also migrate any roles[] arrays
  const allUsers = await db.tenantUser.findMany({
    select: { id: true, roles: true }
  })

  for (const u of allUsers) {
    if (u.roles && u.roles.length > 0) {
      const updatedRoles = u.roles.map((r: any) => {
        if (r === 'ACCOUNTS') return 'ACCOUNTANT'
        if (r === 'GUARDIAN') return 'PARENT'
        if (r === 'RECEPTION') return 'HELPER'
        if (r === 'COORDINATOR') return 'HELPER'
        return r
      })
      const uniqueRoles = [...new Set(updatedRoles)]
      if (JSON.stringify(uniqueRoles) !== JSON.stringify(u.roles)) {
        await db.tenantUser.update({
          where: { id: u.id },
          data: { roles: uniqueRoles as any }
        })
      }
    }
  }

  const check = await db.tenantUser.groupBy({ by: ['role'], _count: true })
  console.log('Post-migration TenantUser roles:', check)
}

migrate()
  .then(() => {
    console.log('Migration completed successfully.')
    process.exit(0)
  })
  .catch((e) => {
    console.error('Migration error:', e)
    process.exit(1)
  })
