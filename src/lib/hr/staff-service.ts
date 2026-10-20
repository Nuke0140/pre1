import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { AuditService } from '@/lib/audit/audit-service'
import { emit } from '@/lib/events'
import type { Prisma, UserRole, EmploymentType, Gender, BloodGroup, VerificationStatus, StaffDocumentType } from '@prisma/client'
import { EncryptionService } from '@/lib/security/encryption-service'
import { validatePan, validateAadhaar, validateUan, validateEsi } from '@/lib/users/statutory-validation'
import { recordAudit } from '@/lib/audit'

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

      // Validate statutory IDs if provided
      if (panNumber) {
        const panRes = validatePan(panNumber)
        if (!panRes.valid) throw new Error(panRes.error || 'Invalid PAN format')
      }
      if (aadhaarNumber) {
        const aadhaarRes = validateAadhaar(aadhaarNumber)
        if (!aadhaarRes.valid) throw new Error(aadhaarRes.error || 'Invalid Aadhaar format')
      }
      if (uanNumber) {
        const uanRes = validateUan(uanNumber)
        if (!uanRes.valid) throw new Error(uanRes.error || 'Invalid UAN format')
      }
      if (esiNumber) {
        const esiRes = validateEsi(esiNumber)
        if (!esiRes.valid) throw new Error(esiRes.error || 'Invalid ESI format')
      }

      let resolvedBloodGroup = bloodGroup
      if (bloodGroup) {
        const bgMap: Record<string, BloodGroup> = {
          A_POS: 'A_POSITIVE' as BloodGroup,
          'A+': 'A_POSITIVE' as BloodGroup,
          A_NEG: 'A_NEGATIVE' as BloodGroup,
          'A-': 'A_NEGATIVE' as BloodGroup,
          B_POS: 'B_POSITIVE' as BloodGroup,
          'B+': 'B_POSITIVE' as BloodGroup,
          B_NEG: 'B_NEGATIVE' as BloodGroup,
          'B-': 'B_NEGATIVE' as BloodGroup,
          AB_POS: 'AB_POSITIVE' as BloodGroup,
          'AB+': 'AB_POSITIVE' as BloodGroup,
          AB_NEG: 'AB_NEGATIVE' as BloodGroup,
          'AB-': 'AB_NEGATIVE' as BloodGroup,
          O_POS: 'O_POSITIVE' as BloodGroup,
          'O+': 'O_POSITIVE' as BloodGroup,
          O_NEG: 'O_NEGATIVE' as BloodGroup,
          'O-': 'O_NEGATIVE' as BloodGroup,
        }
        resolvedBloodGroup = bgMap[bloodGroup as string] || bloodGroup
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
          bloodGroup: resolvedBloodGroup || null,
          currentAddress: currentAddress ? EncryptionService.encrypt(currentAddress.trim(), tenantId) : null,
          permanentAddress: permanentAddress ? EncryptionService.encrypt(permanentAddress.trim(), tenantId) : null,
          panNumber: panNumber ? EncryptionService.encrypt(panNumber.trim().toUpperCase(), tenantId) : null,
          aadhaarNumber: aadhaarNumber ? EncryptionService.encrypt(aadhaarNumber.trim(), tenantId) : null,
          uanNumber: uanNumber ? EncryptionService.encrypt(uanNumber.trim(), tenantId) : null,
          esiNumber: esiNumber ? EncryptionService.encrypt(esiNumber.trim(), tenantId) : null,
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

    const safeDecrypt = (val: string | null | undefined): string | null => {
      if (!val) return null
      try {
        return EncryptionService.decrypt(val, tenantId)
      } catch {
        return null
      }
    }

    return {
      ...profile,
      panNumber: safeDecrypt(profile.panNumber),
      aadhaarNumber: safeDecrypt(profile.aadhaarNumber),
      uanNumber: safeDecrypt(profile.uanNumber),
      esiNumber: safeDecrypt(profile.esiNumber),
      currentAddress: safeDecrypt(profile.currentAddress),
      permanentAddress: safeDecrypt(profile.permanentAddress),
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

  /**
   * Complete Staff Profile Update (Personal, Contact, Employment, Statutory, Salary, Bank)
   */
  static async updateStaffProfile(
    tenantId: string,
    staffProfileId: string,
    input: {
      // Personal
      dateOfBirth?: Date | string | null
      gender?: Gender | null
      maritalStatus?: string | null
      bloodGroup?: BloodGroup | null
      // Contact
      currentAddress?: string | null
      permanentAddress?: string | null
      emergencyContactName?: string | null
      emergencyContactPhone?: string | null
      phone?: string | null
      fullName?: string | null
      // Employment
      designation?: string | null
      department?: string | null
      qualification?: string | null
      joiningDate?: Date | string | null
      employmentType?: EmploymentType
      probationEndDate?: Date | string | null
      confirmationDate?: Date | string | null
      noticePeriodDays?: number
      status?: any
      branchId?: string | null
      // Statutory
      panNumber?: string | null
      aadhaarNumber?: string | null
      uanNumber?: string | null
      esiNumber?: string | null
      // Salary
      salary?: {
        basicSalary: number
        hra?: number
        specialAllowance?: number
        pfEligible?: boolean
        esiEligible?: boolean
        ptApplicable?: boolean
        tdsRate?: number
      }
      // Bank
      bankDetails?: {
        accountHolderName: string
        bankName: string
        accountNumber: string
        ifscCode: string
        branchName?: string
      }
    },
    actor: { id: string; name: string; role: string }
  ) {
    const profile = await db.staffProfile.findFirst({
      where: { id: staffProfileId, tenantId, deletedAt: null },
      include: { user: true, salaryStructure: true, bankDetails: true },
    })
    if (!profile) throw new Error('Staff profile not found')

    return await db.$transaction(async (tx) => {
      // Branch boundary check for branch-scoped actors
      const isGlobalRole = ['OWNER', 'DIRECTOR', 'SUPER_ADMIN'].includes(actor.role)
      const actorBranchId = (actor as any).branchId
      if (!isGlobalRole && actorBranchId) {
        if (profile.branchId && profile.branchId !== actorBranchId) {
          throw new Error('Forbidden: Cannot modify staff profile assigned to another campus branch')
        }
        if (input.branchId && input.branchId !== actorBranchId) {
          throw new Error('Forbidden: Cannot transfer staff to a campus branch outside your scope')
        }
      }

      // 1. Update User name/phone if provided
      if (input.fullName || input.phone) {
        await tx.user.update({
          where: { id: profile.userId },
          data: {
            ...(input.fullName ? { fullName: input.fullName } : {}),
            ...(input.phone ? { phone: input.phone } : {}),
          },
        })
      }

      // 2. If branch changed, update TenantUser branch scope too
      if (input.branchId && input.branchId !== profile.branchId) {
        await tx.tenantUser.updateMany({
          where: { tenantId, userId: profile.userId, deletedAt: null },
          data: { branchId: input.branchId },
        })
      }

      // 3. Update StaffProfile fields
      const staffUpdateData: any = {}
      if (input.designation !== undefined) staffUpdateData.designation = input.designation
      if (input.department !== undefined) staffUpdateData.department = input.department
      if (input.qualification !== undefined) staffUpdateData.qualification = input.qualification
      if (input.employmentType !== undefined) staffUpdateData.employmentType = input.employmentType
      if (input.branchId !== undefined) staffUpdateData.branchId = input.branchId
      if (input.status !== undefined) staffUpdateData.status = input.status
      if (input.emergencyContactName !== undefined) staffUpdateData.emergencyContactName = input.emergencyContactName
      if (input.emergencyContactPhone !== undefined) staffUpdateData.emergencyContactPhone = input.emergencyContactPhone
      if (input.gender !== undefined) staffUpdateData.gender = input.gender
      if (input.maritalStatus !== undefined) staffUpdateData.maritalStatus = input.maritalStatus
      if (input.bloodGroup !== undefined) {
        if (!input.bloodGroup) {
          staffUpdateData.bloodGroup = null
        } else {
          const bgMap: Record<string, BloodGroup> = {
            A_POS: 'A_POSITIVE' as BloodGroup,
            'A+': 'A_POSITIVE' as BloodGroup,
            A_NEG: 'A_NEGATIVE' as BloodGroup,
            'A-': 'A_NEGATIVE' as BloodGroup,
            B_POS: 'B_POSITIVE' as BloodGroup,
            'B+': 'B_POSITIVE' as BloodGroup,
            B_NEG: 'B_NEGATIVE' as BloodGroup,
            'B-': 'B_NEGATIVE' as BloodGroup,
            AB_POS: 'AB_POSITIVE' as BloodGroup,
            'AB+': 'AB_POSITIVE' as BloodGroup,
            AB_NEG: 'AB_NEGATIVE' as BloodGroup,
            'AB-': 'AB_NEGATIVE' as BloodGroup,
            O_POS: 'O_POSITIVE' as BloodGroup,
            'O+': 'O_POSITIVE' as BloodGroup,
            O_NEG: 'O_NEGATIVE' as BloodGroup,
            'O-': 'O_NEGATIVE' as BloodGroup,
          }
          staffUpdateData.bloodGroup = bgMap[input.bloodGroup as string] || input.bloodGroup
        }
      }
      if (input.currentAddress !== undefined) {
        staffUpdateData.currentAddress = input.currentAddress && !input.currentAddress.includes('•')
          ? EncryptionService.encrypt(input.currentAddress.trim(), tenantId)
          : input.currentAddress === null || input.currentAddress === '' ? null : undefined
      }
      if (input.permanentAddress !== undefined) {
        staffUpdateData.permanentAddress = input.permanentAddress && !input.permanentAddress.includes('•')
          ? EncryptionService.encrypt(input.permanentAddress.trim(), tenantId)
          : input.permanentAddress === null || input.permanentAddress === '' ? null : undefined
      }
      if (input.panNumber !== undefined) {
        if (input.panNumber && !input.panNumber.includes('•')) {
          const panRes = validatePan(input.panNumber)
          if (!panRes.valid) throw new Error(panRes.error || 'Invalid PAN format')
          staffUpdateData.panNumber = EncryptionService.encrypt(input.panNumber.trim().toUpperCase(), tenantId)
        } else if (input.panNumber === null || input.panNumber === '') {
          staffUpdateData.panNumber = null
        }
      }
      if (input.aadhaarNumber !== undefined) {
        if (input.aadhaarNumber && !input.aadhaarNumber.includes('•')) {
          const aadhaarRes = validateAadhaar(input.aadhaarNumber)
          if (!aadhaarRes.valid) throw new Error(aadhaarRes.error || 'Invalid Aadhaar format')
          staffUpdateData.aadhaarNumber = EncryptionService.encrypt(input.aadhaarNumber.trim(), tenantId)
        } else if (input.aadhaarNumber === null || input.aadhaarNumber === '') {
          staffUpdateData.aadhaarNumber = null
        }
      }
      if (input.uanNumber !== undefined) {
        if (input.uanNumber && !input.uanNumber.includes('•')) {
          const uanRes = validateUan(input.uanNumber)
          if (!uanRes.valid) throw new Error(uanRes.error || 'Invalid UAN format')
          staffUpdateData.uanNumber = EncryptionService.encrypt(input.uanNumber.trim(), tenantId)
        } else if (input.uanNumber === null || input.uanNumber === '') {
          staffUpdateData.uanNumber = null
        }
      }
      if (input.esiNumber !== undefined) {
        if (input.esiNumber && !input.esiNumber.includes('•')) {
          const esiRes = validateEsi(input.esiNumber)
          if (!esiRes.valid) throw new Error(esiRes.error || 'Invalid ESI format')
          staffUpdateData.esiNumber = EncryptionService.encrypt(input.esiNumber.trim(), tenantId)
        } else if (input.esiNumber === null || input.esiNumber === '') {
          staffUpdateData.esiNumber = null
        }
      }
      if (input.noticePeriodDays !== undefined) staffUpdateData.noticePeriodDays = input.noticePeriodDays
      if (input.joiningDate !== undefined) staffUpdateData.joiningDate = input.joiningDate ? new Date(input.joiningDate) : null
      if (input.probationEndDate !== undefined) staffUpdateData.probationEndDate = input.probationEndDate ? new Date(input.probationEndDate) : null
      if (input.confirmationDate !== undefined) staffUpdateData.confirmationDate = input.confirmationDate ? new Date(input.confirmationDate) : null
      if (input.dateOfBirth !== undefined) staffUpdateData.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null

      const updatedProfile = await tx.staffProfile.update({
        where: { id: staffProfileId },
        data: staffUpdateData,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          branch: { select: { id: true, name: true } },
        },
      })

      // 4. Update Salary Structure if provided
      if (input.salary) {
        await tx.staffSalaryStructure.upsert({
          where: { staffProfileId },
          create: {
            tenantId,
            staffProfileId,
            basicSalary: input.salary.basicSalary,
            hra: input.salary.hra ?? Math.round(input.salary.basicSalary * 0.4),
            specialAllowance: input.salary.specialAllowance ?? Math.round(input.salary.basicSalary * 0.2),
            pfEligible: input.salary.pfEligible ?? true,
            esiEligible: input.salary.esiEligible ?? false,
            ptApplicable: input.salary.ptApplicable ?? true,
            tdsRate: input.salary.tdsRate ?? 0,
          },
          update: {
            basicSalary: input.salary.basicSalary,
            hra: input.salary.hra !== undefined ? input.salary.hra : undefined,
            specialAllowance: input.salary.specialAllowance !== undefined ? input.salary.specialAllowance : undefined,
            pfEligible: input.salary.pfEligible !== undefined ? input.salary.pfEligible : undefined,
            esiEligible: input.salary.esiEligible !== undefined ? input.salary.esiEligible : undefined,
            ptApplicable: input.salary.ptApplicable !== undefined ? input.salary.ptApplicable : undefined,
            tdsRate: input.salary.tdsRate !== undefined ? input.salary.tdsRate : undefined,
          },
        })
      }

      // 5. Update Bank Details if provided
      if (input.bankDetails && input.bankDetails.accountNumber) {
        const rawAcc = input.bankDetails.accountNumber.trim()
        const masked = rawAcc.length >= 4 ? `****${rawAcc.slice(-4)}` : rawAcc
        await tx.staffBankDetail.upsert({
          where: { staffProfileId },
          create: {
            tenantId,
            staffProfileId,
            accountHolderName: input.bankDetails.accountHolderName || profile.user.fullName,
            bankName: input.bankDetails.bankName,
            accountNumberMasked: masked,
            accountNumberEncrypted: rawAcc, // In real app, AES encrypted; stored as payload
            ifscCode: input.bankDetails.ifscCode.toUpperCase(),
            branchName: input.bankDetails.branchName || null,
          },
          update: {
            accountHolderName: input.bankDetails.accountHolderName || undefined,
            bankName: input.bankDetails.bankName || undefined,
            accountNumberMasked: masked,
            accountNumberEncrypted: rawAcc,
            ifscCode: input.bankDetails.ifscCode ? input.bankDetails.ifscCode.toUpperCase() : undefined,
            branchName: input.bankDetails.branchName || undefined,
          },
        })
      }

      // 6. Record Comprehensive Audit Log
      await AuditService.record({
        tenantId,
        branchId: profile.branchId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'STAFF_PROFILE_UPDATED',
        entity: 'StaffProfile',
        entityId: staffProfileId,
        module: 'HR',
        summary: `Updated workforce profile for ${profile.user.fullName} (${profile.employeeCode})`,
        severity: 'INFO',
        newValues: {
          designation: input.designation,
          department: input.department,
          qualification: input.qualification,
          branchId: input.branchId,
          salaryUpdated: Boolean(input.salary),
          bankUpdated: Boolean(input.bankDetails),
        },
      }, tx)

      return updatedProfile
    })
  }

  /**
   * Bulk update staff profiles (e.g., from HR bulk updates or spreadsheets)
   */
  static async bulkUpdateStaffProfiles(
    tenantId: string,
    updates: Array<{ id?: string; staffProfileId?: string; employeeCode?: string; [key: string]: any }>,
    actor: { id: string; name: string; role: string }
  ) {
    const results: Array<{ id?: string; employeeCode?: string; success: boolean; error?: string }> = []
    let updatedCount = 0

    for (const update of updates) {
      let profileId = update.id || update.staffProfileId
      const empCode = update.employeeCode

      if (!profileId && empCode) {
        const matches = await db.staffProfile.findMany({
          where: { tenantId, employeeCode: empCode, deletedAt: null },
          select: { id: true, branchId: true },
        })
        if (matches.length > 1) {
          results.push({
            id: undefined,
            employeeCode: empCode,
            success: false,
            error: `Ambiguous employee code "${empCode}": multiple active records match this code`,
          })
          continue
        } else if (matches.length === 1) {
          profileId = matches[0].id
        }
      }

      if (!profileId) {
        results.push({
          id: profileId,
          employeeCode: empCode,
          success: false,
          error: empCode
            ? `Staff profile not found for employee code "${empCode}"`
            : 'Staff profile ID or valid employee code is required',
        })
        continue
      }

      const { id, staffProfileId, employeeCode, ...data } = update
      try {
        await StaffService.updateStaffProfile(tenantId, profileId, data, actor)
        results.push({ id: profileId, employeeCode: empCode, success: true })
        updatedCount++
      } catch (err: any) {
        results.push({
          id: profileId,
          employeeCode: empCode,
          success: false,
          error: err.message || 'Update failed',
        })
      }
    }

    return {
      total: updates.length,
      updatedCount,
      failedCount: updates.length - updatedCount,
      results,
    }
  }
}
