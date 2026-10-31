import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Preone@123', 10)
  
  // Update all demo users with Preone@123
  const demoEmails = [
    'owner@sunshine.demo',
    'principal@sunshine.demo',
    'teacher@sunshine.demo',
    'parent@sunshine.demo',
    'accounts@sunshine.demo',
  ]

  for (const email of demoEmails) {
    const user = await db.user.findFirst({ where: { email } })
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hash, status: 'ACTIVE' },
      })
      console.log(`Updated ${email} password to Preone@123 (status: ACTIVE)`)
    }
  }

  // Verify owner
  const owner = await db.user.findFirst({ where: { email: 'owner@sunshine.demo' } })
  if (owner) {
    const match = await bcrypt.compare('Preone@123', owner.passwordHash)
    console.log(`Verification - owner@sunshine.demo matches Preone@123: ${match}`)
  }
}

main().finally(() => db.$disconnect())
