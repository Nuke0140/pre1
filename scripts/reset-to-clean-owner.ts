import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Purging all dummy data from all database tables...')

  // Truncate all public tables (except migrations)
  await db.$executeRawUnsafe(`
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
            EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE;';
        END LOOP;
    END $$;
  `)
  console.log('✅ All tables truncated cleanly.')

  console.log('🌱 Setting up single School Owner demo account...')
  const passwordHash = await bcrypt.hash('Preone@123', 10)

  // 1. Create clean School Tenant (Sunshine Kids Preschool)
  const tenant = await db.tenant.create({
    data: {
      name: 'Sunshine Kids Preschool',
      code: 'SUNSHINE',
      type: 'SCHOOL',
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      maxBranches: 5,
      maxStudents: 500,
      address: 'Plot 42, Sunrise Boulevard, Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400705',
      phone: '+91 98200 12345',
      email: 'contact@sunshine.demo',
      website: 'https://sunshine.demo',
      academicYearStartMonth: 4,
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      onboardingStep: 5,
      onboardedAt: new Date(),
    },
  })

  // 2. Create Main Campus Branch
  const branch = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Sunshine Kids — Main Campus',
      code: 'MAIN',
      isMain: true,
      address: 'Plot 42, Sunrise Boulevard, Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400705',
      phone: '+91 98200 12345',
      email: 'main@sunshine.demo',
      isActive: true,
    },
  })

  // 3. Create Current Academic Session (2026-2027)
  await db.academicSession.create({
    data: {
      tenantId: tenant.id,
      name: 'Academic Year 2026-2027',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  })

  // 4. Create the Owner User Account
  const ownerUser = await db.user.create({
    data: {
      email: 'owner@sunshine.demo',
      username: 'owner.sunshine',
      fullName: 'School Owner',
      phone: '+91 98200 99999',
      passwordHash,
      status: 'ACTIVE',
    },
  })

  // 5. Create Tenant Membership for Owner
  await db.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      role: 'OWNER',
      roles: ['OWNER', 'PRINCIPAL'],
      branchId: branch.id,
      status: 'ACTIVE',
    },
  })

  // 6. Create Staff Profile for Owner
  await db.staffProfile.create({
    data: {
      tenantId: tenant.id,
      userId: ownerUser.id,
      employeeCode: 'EMP-001',
      designation: 'School Trustee & Owner',
      department: 'Executive Management',
      branchId: branch.id,
      joiningDate: new Date('2026-01-01'),
    },
  })

  // 7. Optional: Also keep Platform SuperAdmin for platform management console access
  const platformUser = await db.user.create({
    data: {
      email: 'platform@preone.in',
      username: 'platform.admin',
      fullName: 'Platform Superadmin',
      passwordHash,
      status: 'ACTIVE',
    },
  })

  // Create initial audit log entry
  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      actorId: ownerUser.id,
      actorName: ownerUser.fullName,
      actorRole: 'OWNER',
      action: 'SYSTEM_INITIALIZED',
      entity: 'Tenant',
      entityId: tenant.id,
      module: 'SYSTEM',
      summary: 'Clean preschool instance initialized with single Owner account',
      severity: 'INFO',
    },
  })

  console.log('\n===============================================================')
  console.log('🎉 DATABASE RESET COMPLETE!')
  console.log('===============================================================')
  console.log('School:   Sunshine Kids Preschool (Code: SUNSHINE)')
  console.log('Branch:   Sunshine Kids — Main Campus (Code: MAIN)')
  console.log('---------------------------------------------------------------')
  console.log('OWNER DEMO ACCOUNT:')
  console.log('  · Login Email:    owner@sunshine.demo')
  console.log('  · Login Username: owner.sunshine')
  console.log('  · Password:       Preone@123')
  console.log('  · Role:           OWNER / PRINCIPAL')
  console.log('---------------------------------------------------------------')
  console.log('PLATFORM CONSOLE ACCOUNT:')
  console.log('  · Login Email:    platform@preone.in')
  console.log('  · Password:       Preone@123')
  console.log('===============================================================\n')

  // Verify counts
  const totalTenants = await db.tenant.count()
  const totalUsers = await db.user.count()
  const totalStudents = await db.student.count()
  const totalClassrooms = await db.classroom.count()
  const totalInvoices = await db.invoice.count()
  const totalAttendance = await db.attendance.count()

  console.log(`Database Counts:`)
  console.log(`  Tenants:    ${totalTenants}`)
  console.log(`  Users:      ${totalUsers}`)
  console.log(`  Students:   ${totalStudents} (0 dummy records)`)
  console.log(`  Classrooms: ${totalClassrooms} (0 dummy records)`)
  console.log(`  Invoices:   ${totalInvoices} (0 dummy records)`)
  console.log(`  Attendance: ${totalAttendance} (0 dummy records)`)
}

main()
  .catch((e) => {
    console.error('Error during reset:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
