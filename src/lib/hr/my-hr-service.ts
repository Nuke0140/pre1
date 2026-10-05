import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'
import { LeaveService } from './leave-service'

export class MyHrService {
  /**
   * Resolves the canonical Employee (StaffProfile) for a given authenticated user ID and tenant ID.
   */
  static async getEmployeeForUser(tenantId: string, userId: string) {
    const profile = await db.staffProfile.findFirst({
      where: { tenantId, userId, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        branch: { select: { id: true, name: true, code: true } },
        departmentRef: { select: { id: true, name: true, code: true } },
        designationRef: { select: { id: true, name: true, code: true } },
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    })
    if (!profile) {
      throw new Error('No active Employee record found for your user account in this tenant')
    }
    return profile
  }

  static async getMyProfile(tenantId: string, userId: string) {
    const profile = await this.getEmployeeForUser(tenantId, userId)
    return profile
  }

  static async getMyAttendance(tenantId: string, userId: string, month?: number, year?: number) {
    const profile = await this.getEmployeeForUser(tenantId, userId)
    const now = new Date()
    const targetMonth = month || now.getMonth() + 1
    const targetYear = year || now.getFullYear()

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

    const records = await db.attendanceStaff.findMany({
      where: {
        tenantId,
        staffProfileId: profile.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })

    const summary = {
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
      late: records.filter((r) => r.status === 'LATE' || r.lateMinutes > 0).length,
      total: records.length,
    }

    return { records, summary }
  }

  static async getMyLeave(tenantId: string, userId: string) {
    const profile = await this.getEmployeeForUser(tenantId, userId)

    const requests = await db.leaveRequest.findMany({
      where: { tenantId, staffProfileId: profile.id },
      include: {
        leaveType: true,
      },
      orderBy: { appliedAt: 'desc' },
    })

    const currentYear = new Date().getFullYear()
    const balances = await db.leaveBalance.findMany({
      where: { tenantId, staffProfileId: profile.id, year: currentYear },
      include: { leaveType: true },
    })

    return { requests, balances }
  }

  static async applyMyLeave(tenantId: string, userId: string, input: { leaveTypeId: string; startDate: string | Date; endDate: string | Date; reason: string }) {
    const profile = await this.getEmployeeForUser(tenantId, userId)

    return LeaveService.submitLeaveRequest(tenantId, {
      staffProfileId: profile.id,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
    })
  }

  static async getMySalary(tenantId: string, userId: string) {
    const profile = await this.getEmployeeForUser(tenantId, userId)

    const structure = await db.staffSalaryStructure.findUnique({
      where: { staffProfileId: profile.id },
    })

    return structure || null
  }

  static async getMyPayslips(tenantId: string, userId: string) {
    const profile = await this.getEmployeeForUser(tenantId, userId)

    const payslips = await db.payslip.findMany({
      where: { tenantId, staffProfileId: profile.id },
      include: {
        payrollCycle: { select: { month: true, year: true, status: true, lockedAt: true, disbursedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return payslips
  }

  static async getMyDocuments(tenantId: string, userId: string) {
    const profile = await this.getEmployeeForUser(tenantId, userId)

    const documents = await db.staffDocument.findMany({
      where: { tenantId, staffProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    })

    return documents
  }

  static async getMyNotifications(tenantId: string, userId: string) {
    const profile = await this.getEmployeeForUser(tenantId, userId)

    const notifications = await db.inAppNotification.findMany({
      where: { tenantId, userId: profile.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return notifications
  }
}
