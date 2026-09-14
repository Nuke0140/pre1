import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { AuditService } from '@/lib/audit/audit-service'
import { emit } from '@/lib/events'
import type { Prisma, UserRole, EmploymentType, Gender, BloodGroup, VerificationStatus, StaffDocumentType } from '@prisma/client'

export interface CreateStaffInput {
  tenantId: string
  branchId?: string | null
  mode?: 'new' | 'link'
  userId?: string
  // If mode === 'new'
  fullName?: string
  email?: string
  phone?: string
  password?: string
  role?: UserRole
  roles?: UserRole[]
  // StaffProfile fields
  employeeCode: string
  designation?: string | null
  department?: string | null
  qualification?: string | null
  joiningDate?: Date | string | null
  employmentType?: EmploymentType
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  // HR profile extensions
  dateOfBirth?: Date | string | null
  gender?: Gender | null
  maritalStatus?: string | null
  bloodGroup?: BloodGroup | null
  currentAddress?: string | null
  permanentAddress?: string | null
  panNumber?: string | null
  aadhaarNumber?: string | null
  uanNumber?: string | null
  esiNumber?: string | null
  probationEndDate?: Date | string | null
  confirmationDate?: Date | string | null
  noticePeriodDays?: number
  // Salary structure optional
  salary?: {
    basicSalary: number
    hra: number
    specialAllowance: number
    pfEligible?: boolean
    esiEligible?: boolean
    ptApplicable?: boolean
    tdsRate?: number
  }
}

export class StaffService {
  /**
   * Atomic creation of User + TenantUser + StaffProfile (+ optional salary structure)
   * If mode === 'link', links existing User + TenantUser to new StaffProfile without duplication.
   */
  static async createStaff(input: CreateStaffInput, actor: { id: string; name: string; role: string }) {
    const {
      tenantId, branchId, mode = 'new', userId,
      fullName, email, phone, password, role = 'TEACHER', roles,
      employeeCode, designation, department, qualification,
      joiningDate, employmentType = 'REGULAR',
      emergencyContactName, emergencyContactPhone,
      dateOfBirth, gender, maritalStatus, bloodGroup,
      currentAddress, permanentAddress, panNumber, aadhaarNumber,
      uanNumber, esiNumber, probationEndDate, confirmationDate,
      noticePeriodDays = 60, salary,
    } = input

    if (!employeeCode) {
      throw new Error('Employee code is required')
    }

    const dupCode = await db.staffProfile.findFirst({
      where: { tenantId, employeeCode, deletedAt: null },
    })
    if (dupCode) {
      throw new Error(`Employee code "${employeeCode}" already exists`)
    }

    if (branchId) {
      const branch = await db.branch.findFirst({
        where: { id: branchId, tenantId, deletedAt: null },
      })
      if (!branch) throw new Error('Branch not found')
    }

    return await db.$transaction(async (tx) => {
      let resolvedUserId = userId

      if (mode === 'link') {
        if (!resolvedUserId) throw new Error('userId is required for link mode')
        const tenantMember = await tx.tenantUser.findFirst({
          where: { tenantId, userId: resolvedUserId, deletedAt: null },
        })
        if (!tenantMember) throw new Error('User is not a member of this tenant')

        const existingProfile = await tx.staffProfile.findFirst({
          where: { userId: resolvedUserId, deletedAt: null },
        })
        if (existingProfile) throw new Error('This user already has an active staff profile')
      } else {
        if (!fullName || !email) throw new Error('Full name and email are required for new staff')

        // Check if user already exists across tenants
        let user = await tx.user.findUnique({ where: { email } })
        if (!user) {
          const passwordHash = await bcrypt.hash(password || 'PreOne@2026', 10)
          user = await tx.user.create({
            data: {
              email,
              fullName,
              phone: phone || null,
              passwordHash,
              status: 'ACTIVE',
            },
          })
        }
        resolvedUserId = user.id

        // Check or create TenantUser
        const existingMembership = await tx.tenantUser.findFirst({
          where: { tenantId, userId: resolvedUserId, deletedAt: null },
        })

        const assignedRoles: UserRole[] = roles && roles.length > 0 ? roles : [role]

        if (!existingMembership) {
          await tx.tenantUser.create({
            data: {
              tenantId,
              userId: resolvedUserId,
              branchId: branchId || null,
              role: assignedRoles[0],
              roles: assignedRoles,
              status: 'ACTIVE',
            },
          })
        }
      }

      // Create canonical StaffProfile
      const staffProfile = await tx.staffProfile.create({
        data: {
          tenantId,
          userId: resolvedUserId!,
          branchId: branchId || null,
          employeeCode,
          designation: designation || null,
          department: department || null,
          qualification: qualification || null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          employmentType,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          maritalStatus: maritalStatus || null,
          bloodGroup: bloodGroup || null,
          currentAddress: currentAddress || null,
          permanentAddress: permanentAddress || null,
          panNumber: panNumber || null,
          aadhaarNumber: aadhaarNumber || null,
          uanNumber: uanNumber || null,
          esiNumber: esiNumber || null,
          probationEndDate: probationEndDate ? new Date(probationEndDate) : null,
          confirmationDate: confirmationDate ? new Date(confirmationDate) : null,
          noticePeriodDays,
          status: 'ACTIVE',
        },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          branch: { select: { id: true, name: true } },
        },
      })

      // If salary specified, create StaffSalaryStructure
      if (salary) {
        await tx.staffSalaryStructure.create({
          data: {
            tenantId,
            staffProfileId: staffProfile.id,
            basicSalary: salary.basicSalary,
            hra: salary.hra,
            specialAllowance: salary.specialAllowance,
            pfEligible: salary.pfEligible ?? true,
            esiEligible: salary.esiEligible ?? false,
            ptApplicable: salary.ptApplicable ?? true,
            tdsRate: salary.tdsRate ?? 0,
          },
        })
      }

      // Audit Log
      await AuditService.record({
        tenantId,
        branchId: branchId || null,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'STAFF_CREATED',
        entity: 'StaffProfile',
        entityId: staffProfile.id,
        module: 'HR',
        summary: `Created staff profile for ${staffProfile.user.fullName} (${employeeCode})`,
        severity: 'INFO',
        newValues: {
          employeeCode,
          designation,
          department,
          employmentType,
          branchId,
        },
      }, tx)

      // Emit Domain Event
      await emit({
        type: 'StaffOnboarded',
        tenantId,
        staffProfileId: staffProfile.id,
        employeeCode,
        name: staffProfile.user.fullName,
      })

      return staffProfile
    })
  }

  /**
   * Get 360 staff profile with all relational tabs
   */
  static async getStaff360(tenantId: string, staffProfileId: string) {
    const profile = await db.staffProfile.findFirst({
      where: { id: staffProfileId, tenantId, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
        branch: { select: { id: true, name: true, code: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        qualifications: { orderBy: { createdAt: 'asc' } },
        bankDetails: true,
        trainings: { orderBy: { completionDate: 'desc' } },
        salaryStructure: true,
        leaveBalances: {
          include: { leaveType: true },
          orderBy: { year: 'desc' },
        },
        resignation: true,
        offboardingTasks: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!profile) return null

    // Fetch tenant membership roles
    const membership = await db.tenantUser.findFirst({
      where: { tenantId, userId: profile.userId, deletedAt: null },
    })

    // Fetch active assigned classroom if teacher
    const classrooms = await db.classroom.findMany({
      where: { tenantId, primaryTeacherId: profile.userId, isActive: true },
      select: { id: true, name: true, code: true, programType: true, branchId: true },
    })

    // Fetch latest attendance records (last 30 days)
    const recentAttendance = await db.attendanceStaff.findMany({
      where: { tenantId, staffProfileId },
      orderBy: { date: 'desc' },
      take: 30,
    })

    // Fetch recent payslips
    const recentPayslips = await db.payslip.findMany({
      where: { tenantId, staffProfileId },
      include: { payrollCycle: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })

    return {
      ...profile,
      membershipRoles: membership?.roles || (membership?.role ? [membership.role] : []),
      primaryRole: membership?.role || null,
      classrooms,
      recentAttendance,
      recentPayslips,
    }
  }

  /**
   * Transfer staff to another branch
   */
  static async transferBranch(
    tenantId: string,
    staffProfileId: string,
    newBranchId: string,
    actor: { id: string; name: string; role: string }
  ) {
    const profile = await db.staffProfile.findFirst({
      where: { id: staffProfileId, tenantId, deletedAt: null },
    })
    if (!profile) throw new Error('Staff profile not found')

    const newBranch = await db.branch.findFirst({
      where: { id: newBranchId, tenantId, deletedAt: null },
    })
    if (!newBranch) throw new Error('Target branch not found')

    return await db.$transaction(async (tx) => {
      const oldBranchId = profile.branchId

      const updated = await tx.staffProfile.update({
        where: { id: staffProfileId },
        data: { branchId: newBranchId },
      })

      // Update TenantUser branchId as well
      await tx.tenantUser.updateMany({
        where: { tenantId, userId: profile.userId, deletedAt: null },
        data: { branchId: newBranchId },
      })

      await AuditService.record({
        tenantId,
        branchId: newBranchId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'STAFF_BRANCH_TRANSFERRED',
        entity: 'StaffProfile',
        entityId: staffProfileId,
        module: 'HR',
        summary: `Transferred staff ${profile.employeeCode} to branch ${newBranch.name}`,
        severity: 'INFO',
        oldValues: { branchId: oldBranchId },
        newValues: { branchId: newBranchId },
      }, tx)

      return updated
    })
  }

  /**
   * Update designation / department without altering RBAC roles
   */
  static async updateDesignation(
    tenantId: string,
    staffProfileId: string,
    data: { designation?: string; department?: string },
    actor: { id: string; name: string; role: string }
  ) {
    const profile = await db.staffProfile.findFirst({
      where: { id: staffProfileId, tenantId, deletedAt: null },
    })
    if (!profile) throw new Error('Staff profile not found')

    return await db.$transaction(async (tx) => {
      const updated = await tx.staffProfile.update({
        where: { id: staffProfileId },
        data,
      })

      await AuditService.record({
        tenantId,
        branchId: profile.branchId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'STAFF_DESIGNATION_UPDATED',
        entity: 'StaffProfile',
        entityId: staffProfileId,
        module: 'HR',
        summary: `Updated designation/department for ${profile.employeeCode}`,
        severity: 'INFO',
        oldValues: { designation: profile.designation, department: profile.department },
        newValues: data,
      }, tx)

      return updated
    })
  }
}
