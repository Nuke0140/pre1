import { db } from '../src/lib/db'

async function check() {
  const tenants = await db.tenant.findMany({
    include: {
      staffProfiles: true,
      transportRoutes: { include: { vehicle: true, driverProfile: { include: { user: true } } } },
    }
  })
  console.log('Tenants count:', tenants.length)
  for (const t of tenants) {
    console.log(`Tenant [${t.code}] ${t.name}:`)
    console.log(`  Staff profiles: ${t.staffProfiles.length}`)
    console.log(`  Routes: ${t.transportRoutes.length}`)
    for (const r of t.transportRoutes) {
      console.log(`    - Route [${r.code}] ${r.name}: Driver=${r.driverProfile?.user?.fullName || 'NONE'}, Vehicle=${r.vehicle?.registrationNumber || 'NONE'}`)
    }
  }
}

check().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); })
