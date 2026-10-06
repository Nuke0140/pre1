import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)

  // Allow custom arguments or environment variables
  const schoolName = process.env.SCHOOL_NAME || args[0] || 'My Custom Preschool'
  const schoolCode = (process.env.SCHOOL_CODE || args[1] || 'CUSTOM-SCHOOL').toUpperCase()
  const ownerName = process.env.OWNER_NAME || args[2] || 'Custom School Owner'
  const ownerEmail = process.env.OWNER_EMAIL || args[3] || 'owner@customschool.com'
  const ownerPassword = process.env.OWNER_PASSWORD || args[4] || 'CustomPass@123'
  const username = ownerEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')

  console.log('✨ Creating custom school tenant and owner account...')
  console.log(`   · School Name:     ${schoolName}`)
  console.log(`   · School Code:     ${schoolCode}`)
  console.log(`   · Owner Full Name: ${ownerName}`)
  console.log(`   · Owner Email:     ${ownerEmail}`)
  console.log(`   · Owner Username:  ${username}`)

  const passwordHash = await bcrypt.hash(ownerPassword, 10)

  // 1. Create Tenant
  const tenant = await db.tenant.upsert({
    where: { code: schoolCode },
    create: {
      name: schoolName,
      code: schoolCode,
      type: 'SCHOOL',
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      maxBranches: 5,
      maxStudents: 1000,
      onboardingStep: 5,
      onboardedAt: new Date(),
    },
    update: { name: schoolName, status: 'ACTIVE' },
  })

  // 2. Create Main Branch
  const branch = await db.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'MAIN' } },
    create: {
      tenantId: tenant.id,
      name: `${schoolName} — Main Campus`,
      code: 'MAIN',
      isMain: true,
    },
    update: { isActive: true },
  })

  // 3. Create Custom Owner User
  const user = await db.user.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      username: username,
      fullName: ownerName,
      passwordHash: passwordHash,
      status: 'ACTIVE',
    },
    update: {
      fullName: ownerName,
      passwordHash: passwordHash,
      status: 'ACTIVE',
    },
  })

  // 4. Link User to Tenant as OWNER
  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'OWNER',
      roles: ['OWNER', 'PRINCIPAL'],
      branchId: branch.id,
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE' },
  })

  // 5. Create Staff Profile
  await db.staffProfile.upsert({
    where: { userId: user.id },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      employeeCode: 'OWNER-001',
      designation: 'School Owner & Founder',
      branchId: branch.id,
    },
    update: { branchId: branch.id },
  })

  console.log('\n✅ Custom school owner account created successfully!')
  console.log('----------------------------------------------------')
  console.log(`School Code: ${schoolCode}`)
  console.log(`Login Email: ${ownerEmail}`)
  console.log(`Password:    ${ownerPassword}`)
  console.log('----------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ Failed to create custom school:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
