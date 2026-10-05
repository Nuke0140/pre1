import { db } from '@/lib/db'
import { AuditService } from '@/lib/audit/audit-service'
import { emit } from '@/lib/events'
import type { Prisma, AppraisalIncreaseType, AppraisalStatus, SalaryRevisionStatus } from '@prisma/client'

export interface CreateAppraisalInput {
  employeeId?: string
  staffProfileId?: string
  reviewPeriod: string // e.g. "2025–26"
  reviewStartDate?: Date | string | null
  reviewEndDate?: Date | string | null
  appraisalDate?: Date | string | null
  reviewerId?: string | null
  rating?: number | null
  performanceStatus?: string | null
  strengths?: string | null
  areasForImprovement?: string | null
  goals?: string | null
  achievements?: string | null
  reviewerComments?: string | null
  employeeComments?: string | null
  appraisalResult?: string | null

  // Salary Impact Input
  previousSalary?: number
  increaseType?: AppraisalIncreaseType
  increasePercentage?: number
  increaseAmount?: number
  effectiveDate?: Date | string | null
  actorUserId?: string
}

export class AppraisalService {
  /**
   * Calculates salary impact metrics safely server-side
   */
  static calculateSalaryImpact(
    previousSalary: number,
    increaseType: AppraisalIncreaseType = 'NO_INCREASE',
    increasePercentage: number = 0,
    inputIncreaseAmount: number = 0
  ) {
    const base = Math.max(0, Math.round(previousSalary || 0))
    let amount = 0

    if (increaseType === 'PERCENTAGE') {
      const pct = Math.max(0, Number(increasePercentage) || 0)
      amount = Math.round((base * pct) / 100)
    } else if (increaseType === 'FIXED_AMOUNT') {
      amount = Math.max(0, Math.round(Number(inputIncreaseAmount) || 0))
    } else {
      amount = 0
    }

    const revised = base + amount
    return {
      previousSalary: base,
      increaseType,
      increasePercentage: Number(increasePercentage) || 0,
      increaseAmount: amount,
      revisedSalary: revised,
    }
  }

  /**
   * Search & List Appraisals with Tenant Scope
   */
  static async listAppraisals(
    tenantId: string,
    filters: {
      employeeId?: string
      staffProfileId?: string
      reviewerId?: string
      reviewPeriod?: string
      status?: AppraisalStatus
      salaryRevisionStatus?: SalaryRevisionStatus
      search?: string
    } = {}
  ) {
    const staffId = filters.employeeId || filters.staffProfileId
    const { reviewerId, reviewPeriod, status, salaryRevisionStatus, search } = filters

    const where: Prisma.EmployeeAppraisalWhereInput = {
      tenantId,
      deletedAt: null,
      ...(staffId ? { staffProfileId: staffId } : {}),
      ...(reviewerId ? { reviewerId } : {}),
      ...(reviewPeriod ? { reviewPeriod } : {}),
      ...(status ? { status } : {}),
      ...(salaryRevisionStatus ? { salaryRevisionStatus } : {}),
    }

    if (search) {
      where.OR = [
        { reviewPeriod: { contains: search, mode: 'insensitive' } },
        { performanceStatus: { contains: search, mode: 'insensitive' } },
        { staffProfile: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
        { staffProfile: { employeeCode: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const appraisals = await db.employeeAppraisal.findMany({
      where,
      include: {
        staffProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        reviewerProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        salaryStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return appraisals.map((a) => ({
      ...a,
      employee: a.staffProfile
        ? {
            id: a.staffProfile.id,
            employeeCode: a.staffProfile.employeeCode,
            designation: a.staffProfile.designation,
            user: a.staffProfile.user,
          }
        : null,
      reviewer: a.reviewerProfile
        ? {
            id: a.reviewerProfile.id,
            employeeCode: a.reviewerProfile.employeeCode,
            designation: a.reviewerProfile.designation,
            user: a.reviewerProfile.user,
          }
        : null,
      previousSalary: Number(a.previousSalary),
      increaseAmount: Number(a.increaseAmount),
      revisedSalary: Number(a.revisedSalary),
    }))
  }

  /**
   * Get single Appraisal detail view
   */
  static async getAppraisalById(tenantId: string, id: string) {
    const appraisal = await db.employeeAppraisal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        staffProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, status: true } },
            branch: { select: { id: true, name: true, code: true } },
            salaryStructure: true,
          },
        },
        reviewerProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        salaryStructure: true,
      },
    })

    if (!appraisal) return null

    return {
      ...appraisal,
      employee: appraisal.staffProfile
        ? {
            id: appraisal.staffProfile.id,
            employeeCode: appraisal.staffProfile.employeeCode,
            designation: appraisal.staffProfile.designation,
            user: appraisal.staffProfile.user,
          }
        : null,
      reviewer: appraisal.reviewerProfile
        ? {
            id: appraisal.reviewerProfile.id,
            employeeCode: appraisal.reviewerProfile.employeeCode,
            designation: appraisal.reviewerProfile.designation,
            user: appraisal.reviewerProfile.user,
          }
        : null,
      previousSalary: Number(appraisal.previousSalary),
      increaseAmount: Number(appraisal.increaseAmount),
      revisedSalary: Number(appraisal.revisedSalary),
    }
  }

  /**
   * Create Employee Appraisal Record
   */
  static async createAppraisal(
    tenantId: string,
    input: CreateAppraisalInput
  ) {
    const staffId = input.employeeId || input.staffProfileId
    if (!staffId) throw new Error('Employee ID (staffProfileId) is required')

    const {
      reviewPeriod,
      reviewStartDate,
      reviewEndDate,
      appraisalDate,
      reviewerId,
      rating,
      performanceStatus,
      strengths,
      areasForImprovement,
      goals,
      achievements,
      reviewerComments,
      employeeComments,
      appraisalResult,
      increaseType = 'NO_INCREASE',
      increasePercentage = 0,
      increaseAmount: inputIncreaseAmount = 0,
      effectiveDate,
      actorUserId,
    } = input

    // 1. Verify Staff Profile exists in Tenant
    const staff = await db.staffProfile.findFirst({
      where: { id: staffId, tenantId, deletedAt: null },
      include: { salaryStructure: true, user: true },
    })
    if (!staff) throw new Error('Employee profile not found in this tenant')

    // 2. Resolve base salary (from existing structure or input)
    const baseSalary =
      input.previousSalary ??
      (staff.salaryStructure ? Number(staff.salaryStructure.basicSalary) : 25000)

    // 3. Compute salary revision metrics
    const impact = this.calculateSalaryImpact(baseSalary, increaseType, increasePercentage, inputIncreaseAmount)

    // 4. Verify Reviewer if provided
    if (reviewerId) {
      const reviewer = await db.staffProfile.findFirst({
        where: { id: reviewerId, tenantId, deletedAt: null },
      })
      if (!reviewer) throw new Error('Reviewer not found in this tenant')
    }

    const revisionStatus: SalaryRevisionStatus =
      impact.increaseType !== 'NO_INCREASE' && impact.increaseAmount > 0 ? 'PENDING' : 'NOT_APPLICABLE'

    const appraisal = await db.employeeAppraisal.create({
      data: {
        tenantId,
        staffProfileId: staffId,
        reviewPeriod: reviewPeriod.trim(),
        reviewStartDate: reviewStartDate ? new Date(reviewStartDate) : null,
        reviewEndDate: reviewEndDate ? new Date(reviewEndDate) : null,
        appraisalDate: appraisalDate ? new Date(appraisalDate) : new Date(),
        reviewerId: reviewerId || null,
        rating: rating ? Number(rating) : null,
        performanceStatus: performanceStatus || null,
        strengths: strengths || null,
        areasForImprovement: areasForImprovement || null,
        goals: goals || null,
        achievements: achievements || null,
        reviewerComments: reviewerComments || null,
        employeeComments: employeeComments || null,
        appraisalResult: appraisalResult || null,

        previousSalary: impact.previousSalary,
        increaseType: impact.increaseType,
        increasePercentage: impact.increasePercentage,
        increaseAmount: impact.increaseAmount,
        revisedSalary: impact.revisedSalary,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        salaryRevisionStatus: revisionStatus,

        status: 'DRAFT',
      },
      include: {
        staffProfile: {
          include: { user: { select: { fullName: true, email: true } } },
        },
      },
    })

    // 5. Record Audit Log
    await AuditService.record({
      tenantId,
      branchId: staff.branchId,
      actorId: actorUserId || 'SYSTEM',
      actorName: 'HR Manager',
      actorRole: 'HR_ADMIN',
      action: 'APPRAISAL_CREATED',
      entity: 'EmployeeAppraisal',
      entityId: appraisal.id,
      module: 'HR',
      summary: `Created appraisal draft for ${staff.user.fullName} (${reviewPeriod})`,
      severity: 'INFO',
      newValues: {
        staffProfileId: staffId,
        reviewPeriod,
        rating,
        revisedSalary: impact.revisedSalary,
      },
    })

    return {
      ...appraisal,
      previousSalary: Number(appraisal.previousSalary),
      increaseAmount: Number(appraisal.increaseAmount),
      revisedSalary: Number(appraisal.revisedSalary),
    }
  }

  /**
   * Update Appraisal Draft Record
   */
  static async updateAppraisal(tenantId: string, id: string, data: any) {
    const appraisal = await db.employeeAppraisal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { staffProfile: true },
    })
    if (!appraisal) throw new Error('Appraisal record not found')

    const baseSalary = data.previousSalary ?? Number(appraisal.previousSalary)
    const incType = data.increaseType || appraisal.increaseType
    const incPct = data.increasePercentage ?? Number(appraisal.increasePercentage || 0)
    const incAmt = data.increaseAmount ?? Number(appraisal.increaseAmount || 0)

    const impact = this.calculateSalaryImpact(baseSalary, incType, incPct, incAmt)

    const updated = await db.employeeAppraisal.update({
      where: { id },
      data: {
        ...(data.reviewPeriod ? { reviewPeriod: data.reviewPeriod.trim() } : {}),
        ...(data.reviewerId ? { reviewerId: data.reviewerId } : {}),
        ...(data.rating !== undefined ? { rating: Number(data.rating) } : {}),
        ...(data.performanceStatus ? { performanceStatus: data.performanceStatus } : {}),
        ...(data.strengths !== undefined ? { strengths: data.strengths } : {}),
        ...(data.areasForImprovement !== undefined ? { areasForImprovement: data.areasForImprovement } : {}),
        ...(data.goals !== undefined ? { goals: data.goals } : {}),
        ...(data.achievements !== undefined ? { achievements: data.achievements } : {}),
        ...(data.reviewerComments !== undefined ? { reviewerComments: data.reviewerComments } : {}),
        ...(data.employeeComments !== undefined ? { employeeComments: data.employeeComments } : {}),
        previousSalary: impact.previousSalary,
        increaseType: impact.increaseType,
        increasePercentage: impact.increasePercentage,
        increaseAmount: impact.increaseAmount,
        revisedSalary: impact.revisedSalary,
        ...(data.effectiveDate ? { effectiveDate: new Date(data.effectiveDate) } : {}),
      },
    })

    return {
      ...updated,
      previousSalary: Number(updated.previousSalary),
      increaseAmount: Number(updated.increaseAmount),
      revisedSalary: Number(updated.revisedSalary),
    }
  }

  /**
   * Submit Appraisal (DRAFT -> SUBMITTED)
   */
  static async submitAppraisal(tenantId: string, id: string, actorUserId: string) {
    const appraisal = await db.employeeAppraisal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { staffProfile: { include: { user: true } } },
    })
    if (!appraisal) throw new Error('Appraisal record not found')

    if (appraisal.status !== 'DRAFT') {
      throw new Error(`Cannot submit appraisal in ${appraisal.status} status`)
    }

    const updated = await db.employeeAppraisal.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    })

    await AuditService.record({
      tenantId,
      branchId: appraisal.staffProfile.branchId,
      actorId: actorUserId,
      actorName: 'Reviewer',
      actorRole: 'REVIEWER',
      action: 'APPRAISAL_SUBMITTED',
      entity: 'EmployeeAppraisal',
      entityId: id,
      module: 'HR',
      summary: `Submitted appraisal for ${appraisal.staffProfile.user.fullName} (${appraisal.reviewPeriod})`,
      severity: 'INFO',
    })

    return {
      ...updated,
      previousSalary: Number(updated.previousSalary),
      increaseAmount: Number(updated.increaseAmount),
      revisedSalary: Number(updated.revisedSalary),
    }
  }

  /**
   * Approve Appraisal & Automatically Apply Salary Structure Revision
   */
  static async approveAppraisal(
    tenantId: string,
    id: string,
    actorUserId: string,
    reviewerComments?: string
  ) {
    const appraisal = await db.employeeAppraisal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { staffProfile: { include: { user: true, salaryStructure: true } } },
    })
    if (!appraisal) throw new Error('Appraisal record not found')

    // Prevent self approval: an employee cannot approve their own appraisal
    if (appraisal.staffProfile.userId === actorUserId) {
      throw new Error('Unauthorized: Employees cannot approve their own appraisal record')
    }

    return await db.$transaction(async (tx) => {
      let salaryStructureId: string | null = appraisal.salaryStructureId
      let revisionStatus: SalaryRevisionStatus = appraisal.salaryRevisionStatus

      const revisedSalaryNum = Number(appraisal.revisedSalary)
      const hasIncrease =
        appraisal.increaseType !== 'NO_INCREASE' && revisedSalaryNum > Number(appraisal.previousSalary)

      if (hasIncrease && revisedSalaryNum > 0) {
        // Upsert StaffSalaryStructure for employee
        const newStructure = await tx.staffSalaryStructure.upsert({
          where: { staffProfileId: appraisal.staffProfileId },
          create: {
            tenantId,
            staffProfileId: appraisal.staffProfileId,
            basicSalary: revisedSalaryNum,
            hra: Math.round(revisedSalaryNum * 0.4),
            specialAllowance: Math.round(revisedSalaryNum * 0.2),
            pfEligible: appraisal.staffProfile.salaryStructure?.pfEligible ?? true,
            esiEligible: appraisal.staffProfile.salaryStructure?.esiEligible ?? false,
            ptApplicable: appraisal.staffProfile.salaryStructure?.ptApplicable ?? true,
            tdsRate: appraisal.staffProfile.salaryStructure?.tdsRate ?? 0,
            effectiveFrom: appraisal.effectiveDate || new Date(),
          },
          update: {
            basicSalary: revisedSalaryNum,
            hra: Math.round(revisedSalaryNum * 0.4),
            specialAllowance: Math.round(revisedSalaryNum * 0.2),
            effectiveFrom: appraisal.effectiveDate || new Date(),
          },
        })

        salaryStructureId = newStructure.id
        revisionStatus = 'APPLIED'
      } else {
        revisionStatus = 'NOT_APPLICABLE'
      }

      const approved = await tx.employeeAppraisal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          salaryRevisionStatus: revisionStatus,
          salaryStructureId,
          ...(reviewerComments ? { reviewerComments } : {}),
        },
      })

      await AuditService.record(
        {
          tenantId,
          branchId: appraisal.staffProfile.branchId,
          actorId: actorUserId,
          actorName: 'Approver',
          actorRole: 'MANAGEMENT',
          action: 'APPRAISAL_APPROVED',
          entity: 'EmployeeAppraisal',
          entityId: id,
          module: 'HR',
          summary: `Approved appraisal and applied salary revision for ${appraisal.staffProfile.user.fullName} (${appraisal.reviewPeriod})`,
          severity: 'INFO',
          newValues: {
            status: 'APPROVED',
            revisedSalary: revisedSalaryNum,
            salaryRevisionStatus: revisionStatus,
          },
        },
        tx
      )

      await emit({
        type: 'AppraisalApproved',
        tenantId,
        appraisalId: id,
        staffProfileId: appraisal.staffProfileId,
        revisedSalary: revisedSalaryNum,
      })

      return {
        ...approved,
        previousSalary: Number(approved.previousSalary),
        increaseAmount: Number(approved.increaseAmount),
        revisedSalary: Number(approved.revisedSalary),
      }
    })
  }

  /**
   * Reject Appraisal (Status -> REJECTED, Revision -> CANCELLED)
   */
  static async rejectAppraisal(
    tenantId: string,
    id: string,
    actorUserId: string,
    rejectionReason?: string
  ) {
    const appraisal = await db.employeeAppraisal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { staffProfile: { include: { user: true } } },
    })
    if (!appraisal) throw new Error('Appraisal record not found')

    const rejected = await db.employeeAppraisal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        salaryRevisionStatus: 'CANCELLED',
        rejectionReason: rejectionReason || 'Appraisal rejected during review',
      },
    })

    await AuditService.record({
      tenantId,
      branchId: appraisal.staffProfile.branchId,
      actorId: actorUserId,
      actorName: 'Approver',
      actorRole: 'MANAGEMENT',
      action: 'APPRAISAL_REJECTED',
      entity: 'EmployeeAppraisal',
      entityId: id,
      module: 'HR',
      summary: `Rejected appraisal for ${appraisal.staffProfile.user.fullName}`,
      severity: 'WARNING',
      newValues: { rejectionReason },
    })

    return {
      ...rejected,
      previousSalary: Number(rejected.previousSalary),
      increaseAmount: Number(rejected.increaseAmount),
      revisedSalary: Number(rejected.revisedSalary),
    }
  }

  /**
   * Get Employee Self-Service Appraisals
   */
  static async getEmployeeSelfServiceAppraisals(tenantId: string, staffProfileId: string) {
    const history = await db.employeeAppraisal.findMany({
      where: {
        tenantId,
        staffProfileId,
        deletedAt: null,
      },
      include: {
        reviewerProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
      orderBy: { appraisalDate: 'desc' },
    })

    return history.map((a) => ({
      ...a,
      reviewer: a.reviewerProfile
        ? {
            id: a.reviewerProfile.id,
            user: a.reviewerProfile.user,
          }
        : null,
      previousSalary: Number(a.previousSalary),
      increaseAmount: Number(a.increaseAmount),
      revisedSalary: Number(a.revisedSalary),
    }))
  }

  /**
   * Dashboard Counters & Key Performance Metrics
   */
  static async getDashboardStats(tenantId: string) {
    const [totalEmployees, dueForAppraisal, completedAppraisals, pendingReviews, approvedAppraisals, salaryRevisionsApplied] =
      await Promise.all([
        db.staffProfile.count({ where: { tenantId, deletedAt: null } }),
        db.employeeAppraisal.count({ where: { tenantId, status: 'DRAFT', deletedAt: null } }),
        db.employeeAppraisal.count({ where: { tenantId, status: { in: ['APPROVED', 'REJECTED'] }, deletedAt: null } }),
        db.employeeAppraisal.count({ where: { tenantId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, deletedAt: null } }),
        db.employeeAppraisal.count({ where: { tenantId, status: 'APPROVED', deletedAt: null } }),
        db.employeeAppraisal.count({ where: { tenantId, salaryRevisionStatus: 'APPLIED', deletedAt: null } }),
      ])

    return {
      totalEmployees,
      dueForAppraisal,
      completedAppraisals,
      pendingReviews,
      approvedAppraisals,
      salaryRevisionsApplied,
    }
  }
}
