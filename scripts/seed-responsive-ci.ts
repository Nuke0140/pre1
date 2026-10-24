/**
 * Seed minimal database records required by Playwright Responsive Viewport Matrix tests
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding responsive matrix test fixtures...')

  const tenantId = '1fac9d27-88a1-4e78-90a4-8a0e38bc744f'
  const userId = '3a484602-7155-49ff-a9aa-18d451b356f6'
  const branchId = 'b100d3bd-92cf-4e76-8d6b-7735ac098ebc'

  // 1. Tenant
  const tenant = await db.tenant.upsert({
    where: { id: tenantId },
    update: {
      status: 'ACTIVE',
      onboardingStep: 5,
    },
    create: {
      id: tenantId,
      name: 'PreOne Sunshine',
      code: 'SUNSHINE',
      type: 'SCHOOL',
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      onboardingStep: 5,
      academicYearStartMonth: 4,
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
    },
  })

  // 2. Main Branch
  const branch = await db.branch.upsert({
    where: { id: branchId },
    update: { isMain: true, isActive: true },
    create: {
      id: branchId,
      tenantId,
      name: 'Main Campus',
      code: 'MAIN',
      isMain: true,
      isActive: true,
    },
  })

  // 3. Owner User
  const user = await db.user.upsert({
    where: { id: userId },
    update: { status: 'ACTIVE' },
    create: {
      id: userId,
      email: 'owner@sunshine.demo',
      username: 'owner.sunshine',
      fullName: 'School Owner',
      passwordHash: '$2b$10$W3MCU5DI0ScjrbYzTs8D0uN.Bini1xg1wQZnzaKgn14Rz0D1EB5Ju',
      status: 'ACTIVE',
      locale: 'en-IN',
    },
  })

  // 4. TenantUser Membership
  await db.tenantUser.upsert({
    where: { id: '5b7ccddb-9ab6-4a79-b62c-f3e4821d6257' },
    update: { status: 'ACTIVE', role: 'OWNER' },
    create: {
      id: '5b7ccddb-9ab6-4a79-b62c-f3e4821d6257',
      tenantId,
      userId,
      role: 'OWNER',
      roles: ['OWNER', 'PRINCIPAL'],
      branchId,
      status: 'ACTIVE',
    },
  })

  // 5. Current Academic Session
  let session = await db.academicSession.findFirst({
    where: { tenantId, isCurrent: true },
  })
  if (!session) {
    session = await db.academicSession.create({
      data: {
        tenantId,
        name: 'Session 2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'ACTIVE',
      },
    })
  }

  // 6. Program
  let program = await db.program.findFirst({
    where: { tenantId, code: 'NURSERY' },
  })
  if (!program) {
    program = await db.program.create({
      data: {
        tenantId,
        name: 'Nursery Program',
        code: 'NURSERY',
        programType: 'NURSERY',
        ageMinMonths: 24,
        ageMaxMonths: 60,
        capacity: 30,
        isActive: true,
      },
    })
  }

  // 7. Classroom
  let classroom = await db.classroom.findFirst({
    where: { tenantId, branchId },
  })
  if (!classroom) {
    classroom = await db.classroom.create({
      data: {
        tenantId,
        branchId,
        academicSessionId: session.id,
        name: 'Nursery Blue',
        code: 'NUR-BLUE',
        programType: 'NURSERY',
        capacity: 25,
      },
    })
  }

  // 8. Sample Student for students / daily-diary views
  const student = await db.student.findFirst({
    where: { tenantId },
  })
  if (!student) {
    await db.student.create({
      data: {
        tenantId,
        branchId,
        currentClassroomId: classroom.id,
        admissionNo: 'PRE-2026-0001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: new Date('2022-05-15'),
        status: 'ACTIVE',
      },
    })
  }

  console.log('✅ Responsive test fixtures seeded successfully.')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Failed to seed responsive fixtures:', e)
    await db.$disconnect()
    process.exit(1)
  })
