import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Initializing clean school environments...')

  const hash = await bcrypt.hash('Preone@123', 10)

  // 1. Sunshine Kids Preschool (Clean - 0 dummy staff/students)
  const tenantSunshine = await db.tenant.upsert({
    where: { code: 'SUNSHINE' },
    create: {
      name: 'Sunshine Kids Preschool',
      code: 'SUNSHINE',
      type: 'SCHOOL',
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      maxBranches: 5,
      maxStudents: 500,
      onboardingStep: 5,
      onboardedAt: new Date(),
    },
    update: { status: 'ACTIVE' },
  })

  const branchSunshine = await db.branch.upsert({
    where: { tenantId_code: { tenantId: tenantSunshine.id, code: 'MAIN' } },
    create: {
      tenantId: tenantSunshine.id,
      name: 'Sunshine Kids — Main Campus',
      code: 'MAIN',
      isMain: true,
    },
    update: { isActive: true },
  })

  const userSunshine = await db.user.upsert({
    where: { email: 'owner@sunshine.demo' },
    create: {
      email: 'owner@sunshine.demo',
      username: 'owner.sunshine',
      fullName: 'School Owner',
      passwordHash: hash,
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE', passwordHash: hash },
  })

  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenantSunshine.id, userId: userSunshine.id } },
    create: {
      tenantId: tenantSunshine.id,
      userId: userSunshine.id,
      role: 'OWNER',
      roles: ['OWNER', 'PRINCIPAL'],
      branchId: branchSunshine.id,
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE' },
  })

  await db.staffProfile.upsert({
    where: { userId: userSunshine.id },
    create: {
      tenantId: tenantSunshine.id,
      userId: userSunshine.id,
      employeeCode: 'EMP-001',
      designation: 'School Trustee & Owner',
      branchId: branchSunshine.id,
    },
    update: { branchId: branchSunshine.id },
  })

  // 2. Demo School (Clean - 0 dummy staff/students)
  const tenantDemo = await db.tenant.upsert({
    where: { code: 'DEMO-SCHOOL' },
    create: {
      name: 'My Preschool & Early Learning',
      code: 'DEMO-SCHOOL',
      type: 'SCHOOL',
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      maxBranches: 5,
      maxStudents: 500,
      onboardingStep: 5,
      onboardedAt: new Date(),
    },
    update: { status: 'ACTIVE' },
  })

  const branchDemo = await db.branch.upsert({
    where: { tenantId_code: { tenantId: tenantDemo.id, code: 'MAIN' } },
    create: {
      tenantId: tenantDemo.id,
      name: 'My Preschool — Main Campus',
      code: 'MAIN',
      isMain: true,
    },
    update: { isActive: true },
  })

  const userDemo = await db.user.upsert({
    where: { email: 'admin@preone.in' },
    create: {
      email: 'admin@preone.in',
      username: 'school.admin',
      fullName: 'School Administrator',
      passwordHash: hash,
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE', passwordHash: hash },
  })

  await db.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenantDemo.id, userId: userDemo.id } },
    create: {
      tenantId: tenantDemo.id,
      userId: userDemo.id,
      role: 'OWNER',
      roles: ['OWNER', 'PRINCIPAL'],
      branchId: branchDemo.id,
      status: 'ACTIVE',
    },
    update: { status: 'ACTIVE' },
  })

  await db.staffProfile.upsert({
    where: { userId: userDemo.id },
    create: {
      tenantId: tenantDemo.id,
      userId: userDemo.id,
      employeeCode: 'EMP-001',
      designation: 'School Director',
      branchId: branchDemo.id,
    },
    update: { branchId: branchDemo.id },
  })

  console.log('✅ Clean schools initialized with 0 dummy staff/students:')
  console.log('   Option 1:')
  console.log('     · School Code: sunshine')
  console.log('     · Email:       owner@sunshine.demo')
  console.log('     · Password:    Preone@123')
  console.log('   Option 2:')
  console.log('     · School Code: DEMO-SCHOOL')
  console.log('     · Email:       admin@preone.in')
  console.log('     · Password:    Preone@123')
}

main().finally(() => db.$disconnect())
