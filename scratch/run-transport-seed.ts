import { db } from '../src/lib/db'
import { TransportService } from '../src/lib/transport/transport-service'

async function runSeed() {
  const tenant = await db.tenant.findFirst()
  if (!tenant) throw new Error('No tenant found')
  console.log('Seeding transport for tenant:', tenant.name, tenant.id)

  const ctx = {
    tenantId: tenant.id,
    actorId: 'admin-seed',
    actorName: 'Admin',
    actorRole: 'PRINCIPAL',
  }

  const res = await TransportService.seedTransportDemoData(ctx)
  console.log('Seed result:', res)
}

runSeed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); })
