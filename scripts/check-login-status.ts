import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { action: true, summary: true, actorName: true, createdAt: true, severity: true },
  })
  console.log('Recent Audit Logs:', logs)

  const owner = await db.user.findFirst({
    where: { OR: [{ email: 'owner@sunshine.demo' }, { username: 'owner.sunshine' }] },
    include: { memberships: { include: { tenant: true } } },
  })
  console.log('Owner User in DB:', {
    id: owner?.id,
    email: owner?.email,
    username: owner?.username,
    status: owner?.status,
    memberships: owner?.memberships.map((m) => ({
      tenantCode: m.tenant.code,
      tenantName: m.tenant.name,
      role: m.role,
      status: m.status,
    })),
  })

  if (owner) {
    const pwMatch = await bcrypt.compare('Preone@123', owner.passwordHash)
    console.log('Does Preone@123 match passwordHash?', pwMatch)
  }

  await db.$disconnect()
}

main()
