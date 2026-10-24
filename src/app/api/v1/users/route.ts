import { NextRequest } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import {
  ok,
  withApi,
  errPermission,
  errValidation,
  errConflict,
  errNotFound,
  errBusiness,
  ErrorCodes,
} from '@/lib/api'
import { requireApi, isResponse, requireBranchAccess, requireCanAssignRole } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserRole, Relationship, UserStatus, Gender } from '@prisma/client'
import { normalizeFamilyCreateInput, normalizeBloodGroup, formatBloodGroup } from '@/lib/users/user-validation'
import { validateStatutoryInputs } from '@/lib/users/statutory-validation'
import { FamilyUserService } from '@/lib/users/family-user-service'
import { UserIdentityService } from '@/lib/users/user-identity-service'
import { normalizeRole } from '@/lib/roles'
import { normalizeUsername, isValidUsername, sanitizeUsernameSlug } from '@/lib/users/username-service'
import { MIN_PASSWORD_LENGTH, PASSWORD_POLICY, can } from '@/lib/auth'
import { EncryptionService } from '@/lib/security/encryption-service'
import { CustomRoleService } from '@/lib/auth/rbac-engine'

/** GET /api/v1/users — directory with role/search filtering & pagination (users:read) */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('Tenant context required')
  }

  const url = new URL(req.url)
  const roleFilter = url.searchParams.get('role') as UserRole | null
  const statusFilter = url.searchParams.get('status') as string | null
  const rawBranchFilter = url.searchParams.get('branchId') || url.searchParams.get('branch')
  const branchFilter =
    rawBranchFilter && rawBranchFilter !== 'undefined' && rawBranchFilter !== 'null'
      ? rawBranchFilter
      : null
  const departmentFilter = url.searchParams.get('department')?.toLowerCase()?.trim()
  const designationFilter = url.searchParams.get('designation')?.toLowerCase()?.trim()
  const userTypeFilter = url.searchParams.get('userType')?.toUpperCase() // 'STAFF' | 'PARENT'
  const query = url.searchParams.get('q')?.toLowerCase()?.trim()
  const activeTab = (url.searchParams.get('activeTab') || 'ALL').toUpperCase()
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50')))

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const isInstitutionWide = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r)
  )

  let effectiveBranchId: string | undefined = undefined
  if (!isInstitutionWide && session.branchId) {
    if (branchFilter && branchFilter !== session.branchId) {
      throw errPermission('Access denied: branch scope restricted')
    }
    effectiveBranchId = session.branchId
  } else if (branchFilter) {
    effectiveBranchId = branchFilter
  }

  // Build the tenantUser where clause
  const buildWhere = (
    opts: { skipRole?: boolean; skipStatus?: boolean; skipUserType?: boolean } = {}
  ) => {
    const { skipRole = false, skipStatus = false, skipUserType = false } = opts
    const includeDeleted =
      url.searchParams.get('includeDeleted') === 'true' ||
      statusFilter?.toUpperCase() === 'INACTIVE' ||
      statusFilter?.toUpperCase() === 'DEACTIVATED' ||
      statusFilter?.toUpperCase() === 'ARCHIVED'
    const andConditions: any[] = [
      { tenantId: session.tenantId },
      ...(includeDeleted ? [] : [{ deletedAt: null }]),
    ]

    if (!skipRole && roleFilter) {
      andConditions.push({ OR: [{ role: roleFilter }, { roles: { has: roleFilter } }] })
    }

    if (
      !skipStatus &&
      statusFilter &&
      ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'LOCKED', 'DEACTIVATED', 'ARCHIVED'].includes(
        statusFilter.toUpperCase()
      )
    ) {
      andConditions.push({ status: statusFilter.toUpperCase() })
    }

    if (effectiveBranchId) {
      andConditions.push({
        OR: [
          { branchId: effectiveBranchId },
          { assignedBranches: { some: { branchId: effectiveBranchId } } },
        ],
      })
    }

    if (!skipUserType && userTypeFilter === 'PARENT') {
      andConditions.push({ OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }] })
    } else if (!skipUserType && userTypeFilter === 'GUARDIAN') {
      andConditions.push({ OR: [{ role: 'GUARDIAN' }, { roles: { has: 'GUARDIAN' } }] })
    } else if (!skipUserType && userTypeFilter === 'FAMILY') {
      andConditions.push({ OR: [{ role: { in: ['PARENT', 'GUARDIAN'] } }, { roles: { hasSome: ['PARENT', 'GUARDIAN'] } }] })
    } else if (!skipUserType && userTypeFilter === 'STAFF') {
      andConditions.push({ AND: [{ role: { notIn: ['PARENT', 'GUARDIAN'] } }, { NOT: { roles: { hasSome: ['PARENT', 'GUARDIAN'] } } }] })
    }

    if (departmentFilter || designationFilter) {
      andConditions.push({
        staffProfile: {
          ...(departmentFilter ? { department: { contains: departmentFilter, mode: 'insensitive' } } : {}),
          ...(designationFilter ? { designation: { contains: designationFilter, mode: 'insensitive' } } : {}),
        },
      })
    }

    if (query) {
      andConditions.push({
        OR: [
          { user: { fullName: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { user: { phone: { contains: query } } },
          { user: { username: { contains: query, mode: 'insensitive' } } },
          { staffProfile: { employeeCode: { contains: query, mode: 'insensitive' } } },
          { staffProfile: { designation: { contains: query, mode: 'insensitive' } } },
          {
            user: {
              guardianProfile: {
                studentLinks: {
                  some: { student: { admissionNo: { contains: query, mode: 'insensitive' } } },
                },
              },
            },
          },
          {
            user: {
              guardianProfile: {
                studentLinks: {
                  some: { student: { firstName: { contains: query, mode: 'insensitive' } } },
                },
              },
            },
          },
        ],
      })
    }

    return { AND: andConditions }
  }

  const where = buildWhere()

  const isRoleTab = [
    'TEACHER',
    'STAFF',
    'ACCOUNTS',
    'RECEPTIONIST',
    'ATTENDANT',
    'DRIVER',
    'PRINCIPAL',
    'COORDINATOR',
    'PARENT',
    'GUARDIAN',
  ].includes(activeTab)
  const baseWhere = buildWhere({
    skipRole: isRoleTab,
    skipUserType: activeTab === 'STAFF' || activeTab === 'FAMILY',
    skipStatus: activeTab === 'PENDING',
  })

  let total = 0
  let members: any[] = []
  let countsGrouped: any[] = []
  let tenantBranches: any[] = []
  let familyKpis = {
    totalParents: 0,
    linkedStudents: 0,
    multiChildParents: 0,
    totalGuardians: 0,
    authorizedPickupTotal: 0,
    pinSetTotal: 0,
  }

  const isGuardianQuery = roleFilter === 'GUARDIAN' || userTypeFilter === 'GUARDIAN'

  try {
    if (isGuardianQuery) {
      const guardianBaseWhere: any = {
        tenantId: session.tenantId,
        deletedAt: null,
        NOT: {
          user: {
            memberships: {
              some: {
                tenantId: session.tenantId,
                deletedAt: null,
                OR: [{ role: 'PARENT' }, { roles: { has: 'PARENT' } }],
              },
            },
          },
        },
        relationship: { notIn: ['FATHER', 'MOTHER'] },
        OR: [
          {
            user: {
              memberships: {
                some: {
                  tenantId: session.tenantId,
                  deletedAt: null,
                  OR: [{ role: 'GUARDIAN' }, { roles: { has: 'GUARDIAN' } }],
                },
              },
            },
          },
          {
            studentLinks: {
              some: {
                canPickup: true,
                student: {
                  tenantId: session.tenantId,
                  deletedAt: null,
                  ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
                },
              },
            },
          },
          {
            pickupPin: { not: null },
            studentLinks: {
              some: {
                student: {
                  tenantId: session.tenantId,
                  deletedAt: null,
                  ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
                },
              },
            },
          },
        ],
      }

      if (effectiveBranchId) {
        guardianBaseWhere.studentLinks = {
          some: {
            student: {
              tenantId: session.tenantId,
              branchId: effectiveBranchId,
              deletedAt: null,
            },
          },
        }
      }

      if (statusFilter && statusFilter !== 'ALL') {
        const upperStatus = statusFilter.toUpperCase().trim()
        const SUPPORTED_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'LOCKED', 'DEACTIVATED', 'ARCHIVED']
        if (SUPPORTED_STATUSES.includes(upperStatus)) {
          if (upperStatus === 'ACTIVE') {
            guardianBaseWhere.AND = [
              ...(guardianBaseWhere.AND || []),
              {
                OR: [
                  { user: { status: 'ACTIVE' } },
                  { user: null },
                ],
              },
            ]
          } else if (upperStatus === 'SUSPENDED' || upperStatus === 'LOCKED' || upperStatus === 'PENDING') {
            guardianBaseWhere.AND = [
              ...(guardianBaseWhere.AND || []),
              {
                user: { status: upperStatus },
              },
            ]
          } else if (upperStatus === 'DEACTIVATED' || upperStatus === 'ARCHIVED' || upperStatus === 'INACTIVE') {
            guardianBaseWhere.AND = [
              ...(guardianBaseWhere.AND || []),
              {
                OR: [
                  { user: { status: upperStatus } },
                  ...(upperStatus === 'INACTIVE' ? [{ user: { status: 'DEACTIVATED' } }] : []),
                ],
              },
            ]
          }
        } else {
          guardianBaseWhere.AND = [
            ...(guardianBaseWhere.AND || []),
            { id: '__NO_MATCH_INVALID_STATUS__' },
          ]
        }
      }

      if (query) {
        guardianBaseWhere.AND = [
          {
            OR: [
              { fullName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query } },
              { user: { username: { contains: query, mode: 'insensitive' } } },
              {
                studentLinks: {
                  some: {
                    student: {
                      OR: [
                        { firstName: { contains: query, mode: 'insensitive' } },
                        { lastName: { contains: query, mode: 'insensitive' } },
                        { admissionNo: { contains: query, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              },
            ],
          },
        ]
      }

      const [guardianCount, rawGuardians, countsRes, branchesRes, kpiRes] = await Promise.all([
        db.guardian.count({ where: guardianBaseWhere }),
        db.guardian.findMany({
          where: guardianBaseWhere,
          include: {
            user: {
              include: {
                taughtClasses: {
                  select: { id: true, name: true, programType: true },
                },
              },
            },
            studentLinks: {
              where: {
                student: {
                  tenantId: session.tenantId,
                  deletedAt: null,
                  ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
                },
              },
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    admissionNo: true,
                    branchId: true,
                    dob: true,
                    gender: true,
                    status: true,
                    photoUrl: true,
                    seatNumber: true,
                    currentClassroom: {
                      select: { id: true, name: true, branchId: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.tenantUser.groupBy({
          by: ['role', 'status'],
          where: baseWhere,
          _count: { _all: true },
        }),
        db.branch.findMany({
          where: { tenantId: session.tenantId, deletedAt: null },
          select: { id: true, name: true, code: true, isMain: true },
        }),
        FamilyUserService.getFamilyKpis(session.tenantId, { branchId: effectiveBranchId }),
      ])

      total = guardianCount
      countsGrouped = countsRes
      tenantBranches = branchesRes
      familyKpis = kpiRes

      members = rawGuardians.map((g) => ({
        id: g.id,
        role: 'GUARDIAN' as UserRole,
        roles: ['GUARDIAN' as UserRole],
        status: (g.user?.status || 'ACTIVE') as UserStatus,
        branchId: g.studentLinks[0]?.student?.branchId || null,
        createdAt: g.createdAt,
        user: {
          id: g.user?.id || g.id,
          fullName: g.fullName,
          username: g.user?.username || null,
          email: g.email || g.user?.email || null,
          phone: g.phone || g.user?.phone || null,
          avatarUrl: g.photoUrl || g.user?.avatarUrl || null,
          passwordHash: g.user?.passwordHash || '',
          mustChangePassword: g.user?.mustChangePassword || false,
          lastLoginAt: g.user?.lastLoginAt || null,
          locale: g.user?.locale || 'en-IN',
          taughtClasses: g.user?.taughtClasses || [],
          guardianProfile: {
            id: g.id,
            relationship: g.relationship,
            occupation: g.occupation,
            isPrimaryContact: g.isPrimaryContact,
            pickupPin: g.pickupPin || null,
            studentLinks: g.studentLinks,
          },
        },
        staffProfile: null,
        assignedBranches: [],
      }))
    } else {
      const res = await Promise.all([
        db.tenantUser.count({ where }),
        db.tenantUser.findMany({
          where,
          include: {
            staffProfile: {
              include: {
                reportingManager: {
                  include: {
                    user: {
                      select: { id: true, fullName: true, avatarUrl: true, email: true },
                    },
                  },
                },
                directReports: {
                  select: { id: true, userId: true },
                },
              },
            },
            assignedBranches: {
              include: {
                branch: {
                  select: { id: true, name: true, code: true, isMain: true },
                },
              },
            },
            user: {
              include: {
                taughtClasses: {
                  select: { id: true, name: true, programType: true },
                },
                guardianProfile: {
                  include: {
                    studentLinks: {
                      include: {
                        student: {
                          select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            admissionNo: true,
                            branchId: true,
                            dob: true,
                            gender: true,
                            status: true,
                            photoUrl: true,
                            seatNumber: true,
                            currentClassroom: {
                              select: { id: true, name: true, branchId: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.tenantUser.groupBy({
          by: ['role', 'status'],
          where: baseWhere,
          _count: { _all: true },
        }),
        db.branch.findMany({
          where: { tenantId: session.tenantId, deletedAt: null },
          select: { id: true, name: true, code: true, isMain: true },
        }),
        FamilyUserService.getFamilyKpis(session.tenantId, { branchId: effectiveBranchId }),
      ])
      total = res[0]
      members = res[1]
      countsGrouped = res[2]
      tenantBranches = res[3]
      familyKpis = res[4]
    }
  } catch (err) {
    console.warn('[GET /api/v1/users] DB query failed, returning fallback mock staff:', err)
    const mockStaff = [
      {
        id: 'tu-1',
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL', 'ADMIN'],
        status: 'ACTIVE',
        branchId: 'branch-main',
        createdAt: new Date().toISOString(),
        user: {
          id: 'u-1',
          fullName: 'Dr. Pooja Sharma',
          username: 'pooja.sharma',
          email: 'pooja.sharma@sunshine.demo',
          phone: '9876543210',
          avatarUrl: null,
          passwordHash: '••••',
          lastLoginAt: new Date().toISOString(),
          locale: 'en',
          taughtClasses: [],
          guardianProfile: null,
        },
        staffProfile: {
          employeeCode: 'EMP-001',
          designation: 'Principal & Academic Director',
          department: 'Leadership',
          qualification: 'M.Ed, Ph.D in Early Childhood Education',
          employmentType: 'FULL_TIME',
          joiningDate: new Date('2022-06-01'),
          reportingManagerId: null,
          reportingManager: null,
          directReports: [],
          maritalStatus: 'MARRIED',
          bloodGroup: 'O_POSITIVE',
          emergencyContactName: 'Rajesh Sharma',
          emergencyContactPhone: '9876543211',
          noticePeriodDays: 60,
        },
        assignedBranches: [{
          branch: { id: 'branch-main', name: 'Main Campus', code: 'MAIN', isMain: true },
          isPrimary: true,
        }],
      },
      {
        id: 'tu-2',
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
        branchId: 'branch-main',
        createdAt: new Date().toISOString(),
        user: {
          id: 'u-2',
          fullName: 'Ananya Deshmukh',
          username: 'ananya.d',
          email: 'ananya@sunshine.demo',
          phone: '9876543220',
          avatarUrl: null,
          passwordHash: '••••',
          lastLoginAt: new Date().toISOString(),
          locale: 'en',
          taughtClasses: [{ id: 'cls-1', name: 'Nursery A (Sunflowers)', programType: 'NURSERY' }],
          guardianProfile: null,
        },
        staffProfile: {
          employeeCode: 'EMP-002',
          designation: 'Lead Nursery Teacher',
          department: 'Academics',
          qualification: 'B.Ed, Montessori Certified',
          employmentType: 'FULL_TIME',
          joiningDate: new Date('2023-04-15'),
          reportingManagerId: 'tu-1',
          reportingManager: null,
          directReports: [],
          maritalStatus: 'SINGLE',
          bloodGroup: 'B_POSITIVE',
          emergencyContactName: 'Sanjay Deshmukh',
          emergencyContactPhone: '9876543221',
          noticePeriodDays: 30,
        },
        assignedBranches: [{
          branch: { id: 'branch-main', name: 'Main Campus', code: 'MAIN', isMain: true },
          isPrimary: true,
        }],
      },
      {
        id: 'tu-3',
        role: 'COORDINATOR',
        roles: ['COORDINATOR'],
        status: 'ACTIVE',
        branchId: 'branch-main',
        createdAt: new Date().toISOString(),
        user: {
          id: 'u-3',
          fullName: 'Rahul Patil',
          username: 'rahul.patil',
          email: 'rahul@sunshine.demo',
          phone: '9876543230',
          avatarUrl: null,
          passwordHash: '••••',
          lastLoginAt: new Date().toISOString(),
          locale: 'en',
          taughtClasses: [],
          guardianProfile: null,
        },
        staffProfile: {
          employeeCode: 'EMP-003',
          designation: 'Admissions & Academic Coordinator',
          department: 'Administration',
          qualification: 'MBA, PG Diploma in School Admin',
          employmentType: 'FULL_TIME',
          joiningDate: new Date('2023-01-10'),
          reportingManagerId: 'tu-1',
          reportingManager: null,
          directReports: [],
          maritalStatus: 'MARRIED',
          bloodGroup: 'A_POSITIVE',
          emergencyContactName: 'Sunita Patil',
          emergencyContactPhone: '9876543231',
          noticePeriodDays: 45,
        },
        assignedBranches: [{
          branch: { id: 'branch-main', name: 'Main Campus', code: 'MAIN', isMain: true },
          isPrimary: true,
        }],
      },
      {
        id: 'tu-4',
        role: 'ACCOUNTS',
        roles: ['ACCOUNTS'],
        status: 'ACTIVE',
        branchId: 'branch-main',
        createdAt: new Date().toISOString(),
        user: {
          id: 'u-4',
          fullName: 'Neha Joshi',
          username: 'neha.joshi',
          email: 'neha.joshi@sunshine.demo',
          phone: '9876543240',
          avatarUrl: null,
          passwordHash: '••••',
          lastLoginAt: new Date().toISOString(),
          locale: 'en',
          taughtClasses: [],
          guardianProfile: null,
        },
        staffProfile: {
          employeeCode: 'EMP-004',
          designation: 'Finance & Accounts Officer',
          department: 'Accounts',
          qualification: 'M.Com, Tally ERP Certified',
          employmentType: 'FULL_TIME',
          joiningDate: new Date('2023-08-01'),
          reportingManagerId: 'tu-1',
          reportingManager: null,
          directReports: [],
          maritalStatus: 'SINGLE',
          bloodGroup: 'AB_POSITIVE',
          emergencyContactName: 'Milind Joshi',
          emergencyContactPhone: '9876543241',
          noticePeriodDays: 30,
        },
        assignedBranches: [{
          branch: { id: 'branch-main', name: 'Main Campus', code: 'MAIN', isMain: true },
          isPrimary: true,
        }],
      }
    ]

    total = mockStaff.length
    members = mockStaff as any
    countsGrouped = [
      { role: 'PRINCIPAL', status: 'ACTIVE', _count: { _all: 1 } },
      { role: 'TEACHER', status: 'ACTIVE', _count: { _all: 1 } },
      { role: 'COORDINATOR', status: 'ACTIVE', _count: { _all: 1 } },
      { role: 'ACCOUNTS', status: 'ACTIVE', _count: { _all: 1 } },
    ]
    tenantBranches = [{ id: 'branch-main', name: 'Main Campus', code: 'MAIN', isMain: true }]
  }

  const branchMap = new Map(tenantBranches.map((b) => [b.id, b]))

  let activeCount = 0
  let pendingCount = 0
  let suspendedCount = 0
  let inactiveCount = 0
  let tabAll = 0
  let tabStaff = 0
  let tabStaffActive = 0
  let tabFamily = 0
  let tabFamilyActive = 0
  let tabPending = 0
  const roleCounts: Record<string, number> = {}

  for (const g of countsGrouped) {
    const count = g._count._all
    tabAll += count
    if (g.status === 'ACTIVE') activeCount += count
    else if (g.status === 'PENDING') pendingCount += count
    else if (g.status === 'SUSPENDED') suspendedCount += count
    else if (g.status === 'INACTIVE') inactiveCount += count

    if (g.status === 'PENDING') tabPending += count
    const isFamily = ['PARENT', 'GUARDIAN'].includes(g.role)
    if (!isFamily) {
      tabStaff += count
      if (g.status === 'ACTIVE') tabStaffActive += count
    } else {
      tabFamily += count
      if (g.status === 'ACTIVE') tabFamilyActive += count
    }

    roleCounts[g.role] = (roleCounts[g.role] || 0) + count
  }

  return ok(
    members.map((m) => {
      const assignedRoles: UserRole[] = m.roles && m.roles.length > 0 ? m.roles : [m.role]
      const assignedBranches = (m.assignedBranches || []).map((ab: any) => ({
        id: ab.branch.id,
        name: ab.branch.name,
        code: ab.branch.code,
        isMain: ab.branch.isMain,
        isPrimary: ab.isPrimary,
      }))
      const assignedBranchIds = assignedBranches.map((b: any) => b.id)

      const hasPassword = Boolean(m.user.passwordHash && m.user.passwordHash.trim().length > 0)
      const passwordStatus: 'CONFIGURED' | 'PENDING_SETUP' | 'NOT_SET' =
        !hasPassword
          ? 'NOT_SET'
          : m.status === 'PENDING' || m.user.mustChangePassword
          ? 'PENDING_SETUP'
          : 'CONFIGURED'
      const maskedPassword = hasPassword ? '••••••••' : null

      return {
        id: m.id,
        userId: m.user.id,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        name: m.user.fullName,
        fullName: m.user.fullName,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        roles: assignedRoles,
        status: m.status,
        hasPassword,
        passwordStatus,
        maskedPassword,
        branchId: m.branchId,
        assignedBranches,
        assignedBranchIds,
        lastLoginAt: m.user.lastLoginAt,
        createdAt: m.createdAt,
        locale: m.user.locale,
        staffProfile: m.staffProfile
          ? {
              employeeCode: m.staffProfile.employeeCode,
              designation: m.staffProfile.designation,
              department: m.staffProfile.department,
              qualification: m.staffProfile.qualification,
              employmentType: m.staffProfile.employmentType,
              joiningDate: m.staffProfile.joiningDate
                ? m.staffProfile.joiningDate.toISOString()
                : null,
              reportingManagerId: m.staffProfile.reportingManagerId,
              reportingManager: m.staffProfile.reportingManager
                ? {
                    id: m.staffProfile.reportingManager.id,
                    userId: m.staffProfile.reportingManager.userId,
                    name: m.staffProfile.reportingManager.user.fullName,
                    fullName: m.staffProfile.reportingManager.user.fullName,
                    designation: m.staffProfile.reportingManager.designation,
                    avatarUrl: m.staffProfile.reportingManager.user.avatarUrl,
                  }
                : null,
              directReportsCount: m.staffProfile.directReports ? m.staffProfile.directReports.length : 0,
              dateOfBirth: m.staffProfile.dateOfBirth ? '••••' : null,
              gender: m.staffProfile.gender,
              currentAddress: m.staffProfile.currentAddress ? '••••' : null,
              permanentAddress: m.staffProfile.permanentAddress ? '••••' : null,
              maritalStatus: m.staffProfile.maritalStatus,
              bloodGroup: formatBloodGroup(m.staffProfile.bloodGroup),
              emergencyContactName: m.staffProfile.emergencyContactName,
              emergencyContactPhone: m.staffProfile.emergencyContactPhone,
              panNumber: m.staffProfile.panNumber ? '••••' : null,
              aadhaarNumber: m.staffProfile.aadhaarNumber ? '••••' : null,
              uanNumber: m.staffProfile.uanNumber ? '••••' : null,
              esiNumber: m.staffProfile.esiNumber ? '••••' : null,
              probationEndDate: m.staffProfile.probationEndDate
                ? m.staffProfile.probationEndDate.toISOString()
                : null,
              confirmationDate: m.staffProfile.confirmationDate
                ? m.staffProfile.confirmationDate.toISOString()
                : null,
              noticePeriodDays: m.staffProfile.noticePeriodDays,
            }
          : null,
        reportingManagerId: m.staffProfile?.reportingManagerId || null,
        reportingManager: m.staffProfile?.reportingManager
          ? {
              id: m.staffProfile.reportingManager.id,
              userId: m.staffProfile.reportingManager.userId,
              name: m.staffProfile.reportingManager.user.fullName,
              designation: m.staffProfile.reportingManager.designation,
              avatarUrl: m.staffProfile.reportingManager.user.avatarUrl,
            }
          : null,
        taughtClasses: m.user.taughtClasses,
        guardianProfile: m.user.guardianProfile
          ? (() => {
              const gp = m.user.guardianProfile
              const students = gp.studentLinks.map((sl: any) => {
                const b = branchMap.get(sl.student.branchId)
                return {
                  id: sl.student.id,
                  name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
                  admissionNo: sl.student.admissionNo,
                  canPickup: sl.canPickup,
                  receivesComm: sl.receivesComm,
                  pickupPin: sl.pickupPin ? '••••' : null,
                  relationship: sl.relationship || gp.relationship,
                  classroom: sl.student.currentClassroom?.name || null,
                  branchId: sl.student.branchId,
                  branchName: b?.name || null,
                  branchCode: b?.code || null,
                  dob: sl.student.dob ? sl.student.dob.toISOString() : null,
                  gender: sl.student.gender || null,
                  status: sl.student.status || 'ACTIVE',
                  photoUrl: sl.student.photoUrl || null,
                  seatNumber: sl.student.seatNumber || null,
                }
              })
              const uniqueBranchIds = Array.from(new Set(students.map((s: any) => s.branchId).filter(Boolean))) as string[]
              const campuses = uniqueBranchIds.map((bId) => {
                const b = branchMap.get(bId)
                return {
                  id: bId,
                  name: b?.name || 'Unknown Campus',
                  code: b?.code || '',
                  studentCount: students.filter((s: any) => s.branchId === bId).length,
                }
              })
              return {
                id: gp.id,
                relationship: gp.relationship,
                occupation: gp.occupation,
                isPrimaryContact: gp.isPrimaryContact,
                pickupPin: gp.pickupPin ? '••••' : null,
                isCrossCampus: uniqueBranchIds.length > 1,
                campusesCount: uniqueBranchIds.length,
                campuses,
                students,
              }
            })()
          : null,
      }
    }),
    {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      kpis: {
        total: activeCount + pendingCount + suspendedCount + inactiveCount,
        active: activeCount,
        pending: pendingCount,
        suspended: suspendedCount,
        inactive: inactiveCount,
      },
      familyKpis,
      tabs: {
        ALL: tabAll,
        STAFF: tabStaff,
        STAFF_ACTIVE: tabStaffActive,
        FAMILY: (familyKpis?.totalParents ?? 0) + (familyKpis?.totalGuardians ?? 0) || tabFamily,
        FAMILY_ACTIVE: (familyKpis?.totalParents ?? 0) + (familyKpis?.totalGuardians ?? 0) || tabFamilyActive,
        TEACHER: roleCounts['TEACHER'] || 0,
        PARENT: familyKpis?.totalParents ?? roleCounts['PARENT'] ?? 0,
        GUARDIAN: familyKpis?.totalGuardians ?? roleCounts['GUARDIAN'] ?? 0,
        PRINCIPAL: roleCounts['PRINCIPAL'] || 0,
        COORDINATOR: roleCounts['COORDINATOR'] || 0,
        ACCOUNTS: roleCounts['ACCOUNTS'] || 0,
        RECEPTIONIST: roleCounts['RECEPTIONIST'] || 0,
        ATTENDANT: roleCounts['ATTENDANT'] || 0,
        DRIVER: roleCounts['DRIVER'] || 0,
        PENDING: tabPending,
      },
    }
  )
}, { module: 'users' })

/**
 * Generates a cryptographically secure initial password.
 * Uses only CSPRNG sources (Node.js crypto.randomBytes, Web Crypto getRandomValues, or randomUUID).
 * Never uses Math.random. Fails safely if secure entropy is unavailable.
 */
function generateSecureInitialPassword(): string {
  if (typeof crypto?.randomBytes === 'function') {
    return `PreOne@${crypto.randomBytes(6).toString('hex')}`
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(6)
    globalThis.crypto.getRandomValues(bytes)
    return `PreOne@${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
  }
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `PreOne@${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  }
  throw errBusiness(
    ErrorCodes.SYSTEM_INTERNAL_ERROR,
    'Cryptographically secure random number generator is unavailable.'
  )
}

/** POST /api/v1/users — create/invite user with role and relations (users:write) */
export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('Tenant context required')
  }

  const body = await req.json()
  const {
    fullName,
    email,
    password,
    role,
    roles: inputRoles,
    primaryRole,
    additionalRoles: inputAdditionalRoles,
    phone,
    avatarUrl,
    branchId,
    branchIds: inputBranchIds,
    assignedBranchIds: inputAssignedBranchIds,
    customRoleIds,
    classroomId,
    reassignClassroom,
    guardianId,
    studentId,
    studentIds: inputStudentIds,
    relationship,
    pickupPin,
    canPickup,
    isPrimary,
    designation,
    employeeCode,
    department,
    qualification,
    employmentType,
    dateOfBirth,
    gender,
    joiningDate,
    status: inputStatus,
    isInvite,
    emergencyContactName,
    emergencyContactPhone,
    maritalStatus,
    bloodGroup,
    currentAddress,
    permanentAddress,
    panNumber,
    aadhaarNumber,
    uanNumber,
    esiNumber,
    probationEndDate,
    confirmationDate,
    noticePeriodDays,
    occupation,
    locale,
    reportingManagerId,
  } = body as {
    fullName: string
    email: string
    password: string
    role?: UserRole
    roles?: UserRole[]
    primaryRole?: UserRole
    additionalRoles?: UserRole[]
    phone?: string
    avatarUrl?: string
    branchId?: string
    branchIds?: string[]
    assignedBranchIds?: string[]
    customRoleIds?: string[]
    classroomId?: string
    reassignClassroom?: boolean
    guardianId?: string
    studentId?: string
    studentIds?: string[]
    relationship?: Relationship
    pickupPin?: string
    canPickup?: boolean
    isPrimary?: boolean
    designation?: string
    employeeCode?: string
    department?: string
    qualification?: string
    employmentType?: any
    dateOfBirth?: string
    gender?: any
    joiningDate?: string
    status?: UserStatus
    isInvite?: boolean
    emergencyContactName?: string
    emergencyContactPhone?: string
    maritalStatus?: string
    bloodGroup?: any
    currentAddress?: string
    permanentAddress?: string
    panNumber?: string
    aadhaarNumber?: string
    uanNumber?: string
    esiNumber?: string
    probationEndDate?: string
    confirmationDate?: string
    noticePeriodDays?: number
    occupation?: string
    locale?: string
    reportingManagerId?: string
  }

  const effectiveFullName = (fullName || (body as any).parentName || (body as any).parentGuardianFullName || '').trim()
  const effectiveEmail = (email || (body as any).parentEmail || (body as any).parentGuardianEmail || '').trim().toLowerCase()
  const effectivePhone = phone || (body as any).parentPhone || (body as any).parentGuardianPhone

  // Determine roles array and primary role
  let assignedRoles: UserRole[] = []
  if (inputRoles && Array.isArray(inputRoles) && inputRoles.length > 0) {
    assignedRoles = [...new Set(inputRoles.map((r) => normalizeRole(r) as UserRole))]
  } else if (inputAdditionalRoles && Array.isArray(inputAdditionalRoles) && inputAdditionalRoles.length > 0) {
    const primary = normalizeRole(primaryRole || role || ('TEACHER' as UserRole)) as UserRole
    const others = inputAdditionalRoles.map((r) => normalizeRole(r) as UserRole)
    assignedRoles = [...new Set([primary, ...others])]
  } else if (primaryRole) {
    assignedRoles = [normalizeRole(primaryRole) as UserRole]
  } else if (role) {
    assignedRoles = [normalizeRole(role) as UserRole]
  } else if ((body as any).userType === 'FAMILY' || (body as any).parentName || (body as any).childMode) {
    assignedRoles = ['PARENT']
  }

  if (!effectiveFullName || !effectiveEmail || assignedRoles.length === 0) {
    throw errValidation('fullName, email, and at least one role are required', 'fullName')
  }

  // Authorization check: Reject unauthorized HR-field supply through Users API
  const HR_MANAGED_FIELDS = [
    'designation',
    'department',
    'qualification',
    'employmentType',
    'joiningDate',
    'dateOfBirth',
    'gender',
    'maritalStatus',
    'bloodGroup',
    'currentAddress',
    'permanentAddress',
    'emergencyContactName',
    'emergencyContactPhone',
    'panNumber',
    'aadhaarNumber',
    'uanNumber',
    'esiNumber',
    'probationEndDate',
    'confirmationDate',
    'noticePeriodDays',
  ]

  const attemptedHrFields = HR_MANAGED_FIELDS.filter((f) => (body as any)[f] !== undefined)
  if (attemptedHrFields.length > 0) {
    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const hasHrWrite = can(effectiveRoles, 'hr:write')
    if (!hasHrWrite) {
      throw errPermission(
        `Unauthorized to provide HR fields (${attemptedHrFields.join(', ')}) through Users API. Maintain HR details in the HR Module (requires 'hr:write').`
      )
    }
  }

  // Determine credential setup mode and invitation status
  const credentialSetupMode: 'MANUAL' | 'INVITE' | 'GENERATE' =
    (body as any).credentialSetupMode === 'INVITE'
      ? 'INVITE'
      : (body as any).credentialSetupMode === 'GENERATE'
      ? 'GENERATE'
      : (body as any).credentialSetupMode === 'MANUAL'
      ? 'MANUAL'
      : isInvite || inputStatus === 'PENDING'
      ? 'INVITE'
      : password && password.trim().length >= 6
      ? 'MANUAL'
      : 'MANUAL' // Default for staff account creation is manual credential setup

  const isStaffFlow = assignedRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'STAFF', 'ACCOUNTS', 'RECEPTIONIST', 'ATTENDANT', 'DRIVER'].includes(r)
  )

  let finalUsername: string | undefined = undefined
  let effectivePassword = ''
  let isGeneratedPassword = false
  let mustChangePassword = false

  const rawUsername = (body as any).username ? String((body as any).username).trim() : ''

  if (credentialSetupMode === 'MANUAL') {
    // 1. In manual flow: Username is auto-derived if not provided
    if (!rawUsername) {
      if (isStaffFlow) {
        const baseSlug = sanitizeUsernameSlug(effectiveFullName)
        let candidate = normalizeUsername(`${baseSlug}.${Math.floor(100 + Math.random() * 900)}`)
        let attempts = 0
        while (attempts < 5) {
          const exists = await db.user.findFirst({
            where: { username: { equals: candidate, mode: 'insensitive' }, deletedAt: null },
            select: { id: true },
          })
          if (!exists) break
          candidate = normalizeUsername(`${baseSlug}.${Math.floor(1000 + Math.random() * 9000)}`)
          attempts++
        }
        finalUsername = candidate
      } else {
        finalUsername = undefined
      }
    } else {
      const userCheck = isValidUsername(rawUsername)
      if (!userCheck.valid) {
        throw errValidation(userCheck.reason || 'Invalid username format.', 'username')
      }
      finalUsername = normalizeUsername(rawUsername)
    }

    // 2. In manual flow: If password is provided, validate it; otherwise auto-generate temporary credentials
    const rawPassword = password !== undefined && password !== null ? String(password).trim() : ''
    if (!rawPassword) {
      effectivePassword = generateSecureInitialPassword()
      isGeneratedPassword = true
      mustChangePassword = true
    } else {
      if (rawPassword.length < MIN_PASSWORD_LENGTH) {
        throw errValidation(PASSWORD_POLICY.errorMessage, 'password')
      }
      effectivePassword = rawPassword
      isGeneratedPassword = false
      mustChangePassword = false
    }
  } else if (credentialSetupMode === 'GENERATE') {
    // Generated credentials flow: username required or sanitized, secure CSPRNG password
    if (rawUsername) {
      const userCheck = isValidUsername(rawUsername)
      if (!userCheck.valid) {
        throw errValidation(userCheck.reason || 'Invalid username format.', 'username')
      }
      finalUsername = normalizeUsername(rawUsername)
    } else {
      finalUsername = normalizeUsername(effectiveFullName.replace(/\s+/g, '.'))
    }
    effectivePassword = generateSecureInitialPassword()
    isGeneratedPassword = true
    mustChangePassword = isStaffFlow ? true : false
  } else {
    // INVITE flow: Account is created in PENDING state. Password cannot be used for immediate login.
    if (rawUsername) {
      const userCheck = isValidUsername(rawUsername)
      if (!userCheck.valid) {
        throw errValidation(userCheck.reason || 'Invalid username format.', 'username')
      }
      finalUsername = normalizeUsername(rawUsername)
    }
    // High-entropy random initial placeholder for password hash so the DB column is satisfied, but login is blocked by PENDING status
    effectivePassword = generateSecureInitialPassword()
    isGeneratedPassword = true
    mustChangePassword = isStaffFlow ? true : false
  }

  // Account status enforcement: INVITE mode MUST be PENDING so it cannot be used for immediate login
  const initialStatus: UserStatus =
    credentialSetupMode === 'INVITE'
      ? 'PENDING'
      : inputStatus || (isInvite ? 'PENDING' : 'ACTIVE')

  // Primary role defaults to primaryRole if in assignedRoles, else first role in array, else input role
  const normPrimaryRole = primaryRole ? (normalizeRole(primaryRole) as UserRole) : undefined
  const finalPrimaryRole: UserRole =
    normPrimaryRole && assignedRoles.includes(normPrimaryRole)
      ? normPrimaryRole
      : assignedRoles[0]

  // Validate role escalation using centralized helper
  const roleErr = requireCanAssignRole(session, assignedRoles)
  if (roleErr) return roleErr

  // Validate branch boundary using centralized helper
  if (branchId) {
    const branchErr = requireBranchAccess(session, branchId)
    if (branchErr) return branchErr

    const branchExists = await db.branch.findFirst({
      where: { id: branchId, tenantId: session.tenantId },
    })
    if (!branchExists) {
      throw errNotFound('Selected campus branch was not found in this school', ErrorCodes.NOT_FOUND_RESOURCE, 'branchId')
    }
  }

  const isFamilyFlow =
    assignedRoles.length === 1 &&
    (assignedRoles.includes('PARENT') || assignedRoles.includes('GUARDIAN')) &&
    Boolean(
      (body as any).childMode ||
      (body as any).newChild ||
      (body as any).studentFullName ||
      (body as any).studentDateOfBirth ||
      (body as any).childFirstName ||
      (body as any).studentId ||
      (body as any).studentAdmissionNo ||
      (body as any).existingChild ||
      (body as any).parentGuardianFullName
    )

  if (isFamilyFlow) {
    const familyInput = normalizeFamilyCreateInput({
      ...body,
      fullName: effectiveFullName,
      email: effectiveEmail,
      phone: effectivePhone,
      username: finalUsername,
      role: finalPrimaryRole,
      password: effectivePassword,
      status: initialStatus,
      branchId: branchId || undefined,
    })

    const familyResult = await FamilyUserService.createFamilyUser(
      {
        tenantId: session.tenantId!,
        actorId: (session as any).userId || session.uid,
        actorName: (session as any).fullName || session.name,
        actorRole: session.role,
        actorBranchId: session.branchId,
        reqMeta: getRequestMeta(req),
      },
      familyInput
    )

    const hasPassword = Boolean(familyResult.user.passwordHash && familyResult.user.passwordHash.trim().length > 0)
    const passwordStatus: 'CONFIGURED' | 'PENDING_SETUP' | 'NOT_SET' =
      !hasPassword
        ? 'NOT_SET'
        : familyResult.user.status === 'PENDING'
        ? 'PENDING_SETUP'
        : 'CONFIGURED'
    const maskedPassword = hasPassword ? '••••••••' : null

    return ok(
      {
        id: familyResult.user.id,
        userId: familyResult.user.id,
        email: familyResult.user.email,
        fullName: familyResult.user.fullName,
        username: familyResult.user.username,
        hasPassword,
        passwordStatus,
        maskedPassword,
        role: finalPrimaryRole,
        roles: assignedRoles,
        status: familyResult.user.status,
        membershipId: familyResult.membership?.id,
        guardianId: familyResult.guardian?.id,
        studentId: familyResult.student?.id,
        student: familyResult.student,
        parent: familyResult.user,
        isNewStudent: familyResult.isNewStudent,
      },
      undefined,
      201
    )
  }

  const emailNorm = email.toLowerCase().trim()
  const phoneNorm = phone?.trim() || null

  // Check email uniqueness within tenant
  const existingTenantUser = await db.tenantUser.findFirst({
    where: {
      tenantId: session.tenantId,
      user: { email: emailNorm },
      deletedAt: null,
    },
  })
  if (existingTenantUser) {
    throw errConflict(
      'An account with this email already belongs to this school',
      ErrorCodes.CONFLICT_DUPLICATE_EMAIL,
      'email'
    )
  }

  // Check phone uniqueness within tenant if provided
  if (phoneNorm) {
    const existingPhoneUser = await db.tenantUser.findFirst({
      where: {
        tenantId: session.tenantId,
        user: { phone: phoneNorm },
        deletedAt: null,
      },
    })
    if (existingPhoneUser) {
      throw errConflict(
        'An account with this mobile number already exists in this school',
        ErrorCodes.CONFLICT_DUPLICATE_PHONE,
        'phone'
      )
    }
  }

  // Check username uniqueness if provided (case-insensitive across User table for other users)
  if (finalUsername) {
    const existingUsername = await db.user.findFirst({
      where: {
        username: { equals: finalUsername, mode: 'insensitive' },
        deletedAt: null,
        NOT: { email: emailNorm },
      },
    })
    if (existingUsername) {
      throw errConflict(
        `Username "${finalUsername}" is already taken. Please choose another username.`,
        ErrorCodes.CONFLICT_DUPLICATE_RECORD,
        'username'
      )
    }
  }

  // Check employee code uniqueness within tenant if provided
  const rawEmployeeCode = employeeCode?.trim()
  if (rawEmployeeCode) {
    const existingCode = await db.staffProfile.findFirst({
      where: {
        tenantId: session.tenantId,
        employeeCode: rawEmployeeCode,
      },
    })
    if (existingCode) {
      throw errConflict(
        `A staff member with employee code "${rawEmployeeCode}" already exists in this school`,
        ErrorCodes.CONFLICT_DUPLICATE_RECORD,
        'employeeCode'
      )
    }
  }

  // Validate statutory IDs if provided
  const statutoryCheck = validateStatutoryInputs({
    panNumber,
    aadhaarNumber,
    uanNumber,
    esiNumber,
  })
  if (!statutoryCheck.valid) {
    const [firstField, firstErr] = Object.entries(statutoryCheck.errors)[0]
    throw errValidation(firstErr, firstField)
  }

  const passwordHash = await bcrypt.hash(effectivePassword, 10)

  // Run creation inside an atomic transaction
  const result = await db.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email: emailNorm } })

    if (!user) {
      user = await tx.user.create({
        data: {
          email: emailNorm,
          fullName: fullName.trim(),
          username: finalUsername || undefined,
          phone: phoneNorm,
          avatarUrl: avatarUrl?.trim() || null,
          passwordHash,
          mustChangePassword: mustChangePassword,
          status: initialStatus,
          locale: locale || 'en-IN',
        },
      })
    } else {
      // Determine if the existing global user is already established/active
      const isEstablishedUser =
        user.status === 'ACTIVE' ||
        (await tx.tenantUser.count({
          where: {
            userId: user.id,
            status: 'ACTIVE',
            deletedAt: null,
          },
        })) > 0

      // Security (REM-USR-01): An invitation or secondary tenant must NOT downgrade
      // an active global user to PENDING, nor overwrite an established user's global full name.
      const shouldUpdateGlobalStatus = user.status === 'PENDING' && initialStatus === 'ACTIVE'
      const shouldUpdateFullName = (!isEstablishedUser || !user.fullName) && Boolean(fullName?.trim())

      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(shouldUpdateFullName ? { fullName: fullName.trim() } : {}),
          ...(phoneNorm && !user.phone ? { phone: phoneNorm } : {}),
          ...(finalUsername && !user.username ? { username: finalUsername } : {}),
          ...(avatarUrl && !user.avatarUrl ? { avatarUrl: avatarUrl.trim() } : {}),
          ...(locale && !user.locale ? { locale } : {}),
          ...(shouldUpdateGlobalStatus ? { status: 'ACTIVE' } : {}),
        },
      })
    }

    // Create TenantUser membership with primary role and roles array
    const membership = await tx.tenantUser.create({
      data: {
        tenantId: session.tenantId!,
        userId: user.id,
        role: finalPrimaryRole,
        roles: assignedRoles,
        branchId: branchId || null,
        status: initialStatus,
      },
    })

    const effectiveBranchIds = inputBranchIds !== undefined ? inputBranchIds : inputAssignedBranchIds
    if (effectiveBranchIds !== undefined || branchId !== undefined) {
      await UserIdentityService.syncTenantUserBranches(tx, {
        tenantId: session.tenantId!,
        tenantUserId: membership.id,
        primaryBranchId: membership.branchId,
        branchIds: effectiveBranchIds !== undefined ? effectiveBranchIds : (membership.branchId ? [membership.branchId] : []),
      })
    }

    // If any assigned role is PARENT or GUARDIAN, resolve or link guardian profile
    if (assignedRoles.includes('PARENT') || assignedRoles.includes('GUARDIAN')) {
      let guardian: any = null

      // 1. Explicit guardianId provided
      if (guardianId) {
        guardian = await tx.guardian.findFirst({
          where: { id: guardianId, tenantId: session.tenantId! },
          include: { user: true },
        })
        if (!guardian) {
          throw errNotFound(`Guardian ${guardianId} not found in this school`, ErrorCodes.NOT_FOUND_GUARDIAN)
        }

        // Check for collision if already linked to another active user
        if (guardian.userId && guardian.userId !== user.id) {
          if (guardian.user && guardian.user.status !== 'INACTIVE') {
            throw errConflict(
              `Guardian "${guardian.fullName}" is already linked to parent account (${guardian.user.email}). Cannot reassign without manual unlinking.`
            )
          }
        }

        if (guardian.userId !== user.id) {
          guardian = await tx.guardian.update({
            where: { id: guardianId },
            data: { userId: user.id },
          })
        }
      } else {
        // 2. Check if this user is already linked to a guardian in this tenant
        guardian = await tx.guardian.findFirst({
          where: { userId: user.id, tenantId: session.tenantId! },
        })

        // 3. Match existing guardian by email
        if (!guardian && emailNorm) {
          const byEmail = await tx.guardian.findFirst({
            where: { tenantId: session.tenantId!, email: emailNorm, deletedAt: null },
            include: { user: true },
          })
          if (byEmail) {
            if (byEmail.userId && byEmail.userId !== user.id) {
              // Different active account linked to this email
            } else {
              guardian = await tx.guardian.update({
                where: { id: byEmail.id },
                data: { userId: user.id },
              })
            }
          }
        }

        // 4. Match existing guardian by phone
        if (!guardian && phoneNorm) {
          const byPhone = await tx.guardian.findFirst({
            where: { tenantId: session.tenantId!, phone: phoneNorm, deletedAt: null },
            include: { user: true },
          })
          if (byPhone) {
            const nameMatches =
              byPhone.fullName.toLowerCase().trim() === fullName.trim().toLowerCase()
            if (nameMatches) {
              if (!byPhone.userId || byPhone.userId === user.id) {
                guardian = await tx.guardian.update({
                  where: { id: byPhone.id },
                  data: { userId: user.id },
                })
              }
            }
          }
        }

        // 5. If no safe existing guardian found, create a new Guardian record
        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              tenantId: session.tenantId!,
              fullName: fullName.trim(),
              phone: phoneNorm || '',
              email: emailNorm,
              relationship: (relationship as Relationship) || 'OTHER',
              pickupPin: pickupPin?.trim() || null,
              userId: user.id,
              isPrimaryContact: Boolean(isPrimary),
              occupation: occupation?.trim() || null,
            },
          })
        }
      }

      // 6. Link to student(s) if provided
      const targetStudentIds: string[] = []
      if (studentId) targetStudentIds.push(studentId)
      if (Array.isArray(inputStudentIds)) {
        for (const s of inputStudentIds) {
          if (typeof s === 'string' && s && !targetStudentIds.includes(s)) targetStudentIds.push(s)
        }
      }
      const inputAdmissionNo = (body as any).studentAdmissionNo
      const inputAdmissionNos = (body as any).studentAdmissionNos
      if (inputAdmissionNo && typeof inputAdmissionNo === 'string') {
        const s = await tx.student.findFirst({
          where: {
            tenantId: session.tenantId!,
            admissionNo: inputAdmissionNo.trim(),
            deletedAt: null,
          },
          select: { id: true },
        })
        if (s && !targetStudentIds.includes(s.id)) targetStudentIds.push(s.id)
      }
      if (Array.isArray(inputAdmissionNos)) {
        for (const adm of inputAdmissionNos) {
          if (typeof adm === 'string' && adm.trim()) {
            const s = await tx.student.findFirst({
              where: {
                tenantId: session.tenantId!,
                admissionNo: adm.trim(),
                deletedAt: null,
              },
              select: { id: true },
            })
            if (s && !targetStudentIds.includes(s.id)) targetStudentIds.push(s.id)
          }
        }
      }

      for (const sid of targetStudentIds) {
        const student = await tx.student.findFirst({
          where: { id: sid, tenantId: session.tenantId!, deletedAt: null },
        })
        if (student) {
          await tx.$queryRaw`SELECT id FROM students WHERE id = ${sid} FOR UPDATE`

          // Enforce Max 2 Parents policy if PARENT role
          if (assignedRoles.includes('PARENT')) {
            const currentParents = await FamilyUserService.countActiveParentsForStudent(
              session.tenantId!,
              sid,
              user.id,
              tx
            )
            if (currentParents >= 2) {
              throw errBusiness(
                ErrorCodes.BUSINESS_PARENT_LIMIT_EXCEEDED,
                `Child ${student.firstName} already has 2 registered Parent accounts. An additional caregiver must be registered with the GUARDIAN role.`
              )
            }
          }

          const effectiveIsFeePayer =
            (body as any).isFeePayer !== undefined
              ? Boolean((body as any).isFeePayer)
              : assignedRoles.includes('PARENT')
          const effectiveReceivesComm =
            (body as any).receivesComm !== false && (body as any).receivesCommunication !== false

          const existingLink = await tx.studentGuardian.findUnique({
            where: { studentId_guardianId: { studentId: sid, guardianId: guardian.id } },
          })
          if (!existingLink) {
            await tx.studentGuardian.create({
              data: {
                studentId: sid,
                guardianId: guardian.id,
                relationship: relationship ? (relationship as Relationship) : guardian.relationship,
                canPickup: canPickup !== false,
                pickupPin: pickupPin?.trim() || null,
                isPrimary: Boolean(isPrimary),
                isFeePayer: effectiveIsFeePayer,
                receivesComm: effectiveReceivesComm,
              },
            })
          } else {
            await tx.studentGuardian.update({
              where: { id: existingLink.id },
              data: {
                relationship: relationship ? (relationship as Relationship) : guardian.relationship,
                canPickup: canPickup !== false,
                pickupPin: pickupPin?.trim() || guardian.pickupPin || null,
                isPrimary: Boolean(isPrimary),
                isFeePayer: effectiveIsFeePayer,
                receivesComm: effectiveReceivesComm,
              },
            })
          }
        }
      }
    }

    // If any assigned role is staff or designation provided, ensure StaffProfile exists
    const isStaff = assignedRoles.some((r) =>
      ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'STAFF', 'ACCOUNTS', 'RECEPTIONIST', 'ATTENDANT', 'DRIVER'].includes(r)
    )

    let staffProfileRecord: any = null
    if (isStaff || designation) {
      const existingProfile = await tx.staffProfile.findUnique({
        where: { tenantId_userId: { tenantId: session.tenantId!, userId: user.id } },
      })

      let finalEmpCode = employeeCode?.trim()
      if (!finalEmpCode) {
        if (existingProfile?.employeeCode) {
          finalEmpCode = existingProfile.employeeCode
        } else {
          const prefix = assignedRoles.includes('TEACHER') ? 'TCH' : 'EMP'
          let candidateIndex = (await tx.staffProfile.count({ where: { tenantId: session.tenantId! } })) + 1
          let candidate = `${prefix}-${String(candidateIndex).padStart(4, '0')}`
          while (await tx.staffProfile.findFirst({ where: { tenantId: session.tenantId!, employeeCode: candidate } })) {
            candidateIndex++
            candidate = `${prefix}-${String(candidateIndex).padStart(4, '0')}`
          }
          finalEmpCode = candidate
        }
      } else {
        const codeInTx = await tx.staffProfile.findFirst({
          where: {
            tenantId: session.tenantId!,
            employeeCode: finalEmpCode,
            userId: { not: user.id },
          },
        })
        if (codeInTx) {
          throw errConflict(
            `A staff member with employee code "${finalEmpCode}" already exists in this school`,
            ErrorCodes.CONFLICT_DUPLICATE_RECORD,
            'employeeCode'
          )
        }
      }

      const safeParseDate = (d?: any): Date | undefined => {
        if (!d) return undefined
        const parsed = new Date(d)
        return isNaN(parsed.getTime()) ? undefined : parsed
      }

      const parsedDob = safeParseDate(dateOfBirth)
      const parsedJoining = safeParseDate(joiningDate)
      const parsedProbation = safeParseDate(probationEndDate)
      const parsedConfirmation = safeParseDate(confirmationDate)
      const noticePeriod =
        noticePeriodDays !== undefined && noticePeriodDays !== null && !isNaN(Number(noticePeriodDays))
          ? Number(noticePeriodDays)
          : undefined

      const normGender = gender
        ? ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'].includes(String(gender).toUpperCase().trim())
          ? (String(gender).toUpperCase().trim() as Gender)
          : null
        : null

      let resolvedReportingManagerId: string | null = null
      if (reportingManagerId && typeof reportingManagerId === 'string' && reportingManagerId.trim()) {
        const mgrStaff = await tx.staffProfile.findFirst({
          where: {
            tenantId: session.tenantId!,
            deletedAt: null,
            OR: [
              { id: reportingManagerId.trim() },
              { userId: reportingManagerId.trim() },
            ],
          },
          select: { id: true, userId: true },
        })
        if (mgrStaff && mgrStaff.userId !== user.id) {
          resolvedReportingManagerId = mgrStaff.id
        }
      }

      if (existingProfile) {
        staffProfileRecord = await tx.staffProfile.update({
          where: { id: existingProfile.id },
          data: {
            employeeCode: finalEmpCode,
            designation: designation !== undefined ? (designation?.trim() || null) : existingProfile.designation,
            department: department !== undefined ? (department?.trim() || null) : existingProfile.department,
            qualification: qualification !== undefined ? (qualification?.trim() || null) : existingProfile.qualification,
            employmentType: employmentType || existingProfile.employmentType,
            branchId: branchId || existingProfile.branchId,
            ...(reportingManagerId !== undefined ? { reportingManagerId: resolvedReportingManagerId } : {}),
            ...(parsedDob ? { dateOfBirth: parsedDob } : {}),
            ...(normGender ? { gender: normGender } : {}),
            ...(parsedJoining ? { joiningDate: parsedJoining } : {}),
            ...(emergencyContactName !== undefined ? { emergencyContactName: emergencyContactName?.trim() || null } : {}),
            ...(emergencyContactPhone !== undefined ? { emergencyContactPhone: emergencyContactPhone?.trim() || null } : {}),
            ...(maritalStatus !== undefined ? { maritalStatus: maritalStatus?.trim() || null } : {}),
            ...(bloodGroup !== undefined ? { bloodGroup: normalizeBloodGroup(bloodGroup) } : {}),
            ...(currentAddress !== undefined ? { currentAddress: currentAddress?.trim() ? EncryptionService.encrypt(currentAddress.trim(), session.tenantId) : null } : {}),
            ...(permanentAddress !== undefined ? { permanentAddress: permanentAddress?.trim() ? EncryptionService.encrypt(permanentAddress.trim(), session.tenantId) : null } : {}),
            ...(panNumber !== undefined ? { panNumber: statutoryCheck.normalized.panNumber ? EncryptionService.encrypt(statutoryCheck.normalized.panNumber, session.tenantId) : null } : {}),
            ...(aadhaarNumber !== undefined ? { aadhaarNumber: statutoryCheck.normalized.aadhaarNumber ? EncryptionService.encrypt(statutoryCheck.normalized.aadhaarNumber, session.tenantId) : null } : {}),
            ...(uanNumber !== undefined ? { uanNumber: statutoryCheck.normalized.uanNumber ? EncryptionService.encrypt(statutoryCheck.normalized.uanNumber, session.tenantId) : null } : {}),
            ...(esiNumber !== undefined ? { esiNumber: statutoryCheck.normalized.esiNumber ? EncryptionService.encrypt(statutoryCheck.normalized.esiNumber, session.tenantId) : null } : {}),
            ...(parsedProbation ? { probationEndDate: parsedProbation } : {}),
            ...(parsedConfirmation ? { confirmationDate: parsedConfirmation } : {}),
            ...(noticePeriod !== undefined ? { noticePeriodDays: noticePeriod } : {}),
          },
          include: {
            reportingManager: {
              include: { user: { select: { fullName: true, avatarUrl: true } } },
            },
          },
        })
      } else {
        staffProfileRecord = await tx.staffProfile.create({
          data: {
            tenantId: session.tenantId!,
            userId: user.id,
            employeeCode: finalEmpCode,
            designation: designation?.trim() || null,
            department: department?.trim() || null,
            qualification: qualification?.trim() || null,
            employmentType: employmentType || 'FULL_TIME',
            branchId: branchId || null,
            reportingManagerId: resolvedReportingManagerId,
            dateOfBirth: parsedDob || null,
            gender: normGender,
            joiningDate: parsedJoining || null,
            emergencyContactName: emergencyContactName?.trim() || null,
            emergencyContactPhone: emergencyContactPhone?.trim() || null,
            maritalStatus: maritalStatus?.trim() || null,
            bloodGroup: normalizeBloodGroup(bloodGroup),
            currentAddress: currentAddress?.trim() ? EncryptionService.encrypt(currentAddress.trim(), session.tenantId) : null,
            permanentAddress: permanentAddress?.trim() ? EncryptionService.encrypt(permanentAddress.trim(), session.tenantId) : null,
            panNumber: statutoryCheck.normalized.panNumber ? EncryptionService.encrypt(statutoryCheck.normalized.panNumber, session.tenantId) : null,
            aadhaarNumber: statutoryCheck.normalized.aadhaarNumber ? EncryptionService.encrypt(statutoryCheck.normalized.aadhaarNumber, session.tenantId) : null,
            uanNumber: statutoryCheck.normalized.uanNumber ? EncryptionService.encrypt(statutoryCheck.normalized.uanNumber, session.tenantId) : null,
            esiNumber: statutoryCheck.normalized.esiNumber ? EncryptionService.encrypt(statutoryCheck.normalized.esiNumber, session.tenantId) : null,
            probationEndDate: parsedProbation || null,
            confirmationDate: parsedConfirmation || null,
            noticePeriodDays: noticePeriod !== undefined ? noticePeriod : 60,
          },
          include: {
            reportingManager: {
              include: { user: { select: { fullName: true, avatarUrl: true } } },
            },
          },
        })
      }
    }

    // Classroom assignment for TEACHER and ATTENDANT
    let assignedClassroom: any = null
    const isTeacher = assignedRoles.includes('TEACHER')
    const isAttendant = assignedRoles.includes('ATTENDANT')

    if (classroomId && (isTeacher || isAttendant)) {
      const classroom = await tx.classroom.findFirst({
        where: { id: classroomId, tenantId: session.tenantId! },
      })
      if (!classroom) {
        throw errNotFound(`Classroom ${classroomId} not found in this school`, ErrorCodes.NOT_FOUND_CLASSROOM, 'classroomId')
      }
      if (classroom.isActive === false) {
        throw errValidation(`Classroom "${classroom.name}" is currently inactive or archived`, 'classroomId')
      }
      // Branch boundary check: if branchId is provided, classroom must belong to branchId
      if (branchId && classroom.branchId && classroom.branchId !== branchId) {
        throw errValidation(`Classroom "${classroom.name}" does not belong to the selected campus branch`, 'classroomId')
      }

      if (isTeacher) {
        if (classroom.primaryTeacherId && classroom.primaryTeacherId !== user.id) {
          if (!reassignClassroom) {
            const existingTeacher = await tx.user.findUnique({
              where: { id: classroom.primaryTeacherId },
              select: { fullName: true },
            })
            throw errConflict(
              `Classroom "${classroom.name}" already has a primary teacher assigned (${existingTeacher?.fullName || 'Another teacher'}). To replace them, confirm reassignment.`,
              ErrorCodes.CONFLICT_DUPLICATE_RECORD,
              'classroomId'
            )
          }
        }
        assignedClassroom = await tx.classroom.update({
          where: { id: classroom.id },
          data: { primaryTeacherId: user.id },
          select: { id: true, name: true, code: true, programType: true, branchId: true },
        })
      } else if (isAttendant) {
        const currentPrefs = (user.preferences as any) || {}
        await tx.user.update({
          where: { id: user.id },
          data: {
            preferences: {
              ...currentPrefs,
              assignedClassroomId: classroom.id,
              assignedClassroomName: classroom.name,
              classroomRole: 'ATTENDANT',
            },
          },
        })
        if (staffProfileRecord && (!staffProfileRecord.department || staffProfileRecord.department === 'Caregiving')) {
          staffProfileRecord = await tx.staffProfile.update({
            where: { id: staffProfileRecord.id },
            data: { department: `Caregiving — ${classroom.name}` },
          })
        }
        assignedClassroom = {
          id: classroom.id,
          name: classroom.name,
          code: classroom.code,
          programType: classroom.programType,
          branchId: classroom.branchId,
        }
      }
    }

    const assignedBranchesData = await tx.tenantUserBranch.findMany({
      where: { tenantUserId: membership.id },
      include: {
        branch: {
          select: { id: true, name: true, code: true, isMain: true },
        },
      },
    })
    const assignedBranches = assignedBranchesData.map((ab: any) => ({
      id: ab.branch.id,
      name: ab.branch.name,
      code: ab.branch.code,
      isMain: ab.branch.isMain,
      isPrimary: ab.isPrimary,
    }))
    const assignedBranchIds = assignedBranches.map((b: any) => b.id)

    return {
      user,
      membership,
      assignedRoles,
      finalPrimaryRole,
      assignedBranches,
      assignedBranchIds,
      staffProfileRecord,
      assignedClassroom,
    }
  }, {
    maxWait: 10000,
    timeout: 25000,
  })

  if (customRoleIds && Array.isArray(customRoleIds) && customRoleIds.length > 0) {
    await CustomRoleService.syncUserCustomRoles({
      tenantUserId: result.membership.id,
      tenantId: session.tenantId,
      customRoleIds,
      assignedById: session.uid,
    })
  }

  let invitationData: any = null
  if (result.membership.status === 'PENDING' || credentialSetupMode === 'INVITE') {
    const { InvitationService } = await import('@/lib/users/invitation-service')
    const origin = req.headers.get('origin') || undefined
    const createdInv = await InvitationService.createInvitation({
      tenantId: session.tenantId,
      userId: result.user.id,
      tenantUserId: result.membership.id,
      email: emailNorm,
      role: result.finalPrimaryRole,
      invitedById: session.uid,
      origin,
      sendEmail: true,
    }).catch(() => null)
    if (createdInv) {
      invitationData = {
        invitationId: createdInv.invitation.id,
        inviteUrl: createdInv.inviteUrl,
        expiresAt: createdInv.invitation.expiresAt.toISOString(),
      }
    }
  }

  const meta = getRequestMeta(req)
  await recordAudit({
    tenantId: session.tenantId,
    branchId: branchId || undefined,
    actorId: session.uid,
    actorName: session.name,
    actorRole: session.role,
    action: 'CREATE_USER',
    entity: 'User',
    entityId: result.user.id,
    module: 'Users',
    summary: `Created user ${fullName} with roles [${result.assignedRoles.join(', ')}] (primary: ${result.finalPrimaryRole})${result.assignedClassroom ? ` assigned to classroom ${result.assignedClassroom.name}` : ''}`,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    newValues: {
      id: result.membership.id,
      userId: result.user.id,
      email: emailNorm,
      fullName: fullName.trim(),
      role: result.finalPrimaryRole,
      roles: result.assignedRoles,
      branchId: branchId || null,
      designation: designation?.trim() || null,
      assignedClassroom: result.assignedClassroom || null,
    },
  })

  const hasPassword = Boolean(result.user.passwordHash && result.user.passwordHash.trim().length > 0)
  const passwordStatus: 'CONFIGURED' | 'PENDING_SETUP' | 'NOT_SET' =
    !hasPassword
      ? 'NOT_SET'
      : result.membership.status === 'PENDING' || result.user.mustChangePassword
      ? 'PENDING_SETUP'
      : 'CONFIGURED'
  const maskedPassword = hasPassword ? '••••••••' : null

  return ok(
    {
      id: result.membership.id,
      userId: result.user.id,
      membershipId: result.membership.id,
      fullName: result.user.fullName,
      email: result.user.email,
      username: result.user.username,
      avatarUrl: result.user.avatarUrl,
      phone: result.user.phone,
      hasPassword,
      passwordStatus,
      maskedPassword,
      role: result.finalPrimaryRole,
      roles: result.assignedRoles,
      status: result.membership.status,
      branchId: result.membership.branchId,
      assignedBranches: result.assignedBranches,
      assignedBranchIds: result.assignedBranchIds,
      staffProfile: result.staffProfileRecord,
      reportingManagerId: result.staffProfileRecord?.reportingManagerId || null,
      reportingManager: result.staffProfileRecord?.reportingManager
        ? {
            id: result.staffProfileRecord.reportingManager.id,
            userId: result.staffProfileRecord.reportingManager.userId,
            name: result.staffProfileRecord.reportingManager.user.fullName,
            designation: result.staffProfileRecord.reportingManager.designation,
            avatarUrl: result.staffProfileRecord.reportingManager.user.avatarUrl,
          }
        : null,
      classroom: result.assignedClassroom
        ? {
            id: result.assignedClassroom.id,
            name: result.assignedClassroom.name,
            code: result.assignedClassroom.code,
            programType: result.assignedClassroom.programType,
          }
        : null,
      taughtClasses:
        result.assignedRoles.includes('TEACHER') && result.assignedClassroom
          ? [
              {
                id: result.assignedClassroom.id,
                name: result.assignedClassroom.name,
                programType: result.assignedClassroom.programType,
              },
            ]
          : [],
      invitation: invitationData,
    },
    undefined,
    201
  )
}, { module: 'users' })
