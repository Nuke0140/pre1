import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🧹 Clearing all dummy auto-generated demo data from database...')

  try {
    // Truncate all main tenant and user related tables with CASCADE
    await db.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "tenants", 
        "users", 
        "user_sessions", 
        "audit_logs" 
      CASCADE;
    `)
    console.log('✅ Database successfully cleared! All dummy tenants, staff, families, students, and linked records have been removed.')
  } catch (err: any) {
    console.warn('Fallback to Prisma model deletes...', err.message)
    await db.$transaction([
      db.auditLog.deleteMany(),
      db.userSession.deleteMany(),
      db.timelineEntry.deleteMany(),
      db.observation.deleteMany(),
      db.announcement.deleteMany(),
      db.receipt.deleteMany(),
      db.payment.deleteMany(),
      db.invoiceItem.deleteMany(),
      db.invoice.deleteMany(),
      db.feePlanItem.deleteMany(),
      db.feePlan.deleteMany(),
      db.feeStructure.deleteMany(),
      db.attendance.deleteMany(),
      db.applicationDocument.deleteMany(),
      db.admissionApplication.deleteMany(),
      db.lead.deleteMany(),
      db.studentGuardian.deleteMany(),
      db.guardian.deleteMany(),
      db.student.deleteMany(),
      db.classroom.deleteMany(),
      db.academicSession.deleteMany(),
      db.staffProfile.deleteMany(),
      db.tenantUser.deleteMany(),
      db.user.deleteMany(),
      db.branch.deleteMany(),
      db.tenant.deleteMany(),
    ])
    console.log('✅ Database cleared via Prisma deletion.')
  } finally {
    await db.$disconnect()
  }
}

main()
