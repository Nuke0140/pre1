import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { UserRole, UserStatus, EmploymentType } from '@prisma/client'

const VALID_ROLES = ['OWNER', 'PRINCIPAL', 'COORDINATOR', 'TEACHER', 'ACCOUNTS', 'RECEPTION', 'PARENT'] as const
const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] as const
const VALID_EMP_TYPES = ['REGULAR', 'PROBATION', 'CONTRACT', 'INTERN', 'PART_TIME'] as const

export type CsvMode = 'CREATE' | 'UPDATE' | 'UPSERT' | 'DELETE'

export interface CsvRowInput {
  rowNumber: number
  fullName?: string
  email?: string
  phone?: string
  password?: string
  role?: string
  roles?: string
  branchCode?: string
  designation?: string
  department?: string
  employeeCode?: string
  employmentType?: string
  status?: string
}

export interface CsvValidationError {
  rowNumber: number
  identifier: string
  field: string
  currentValue: string
  requestedValue: string
  errorCode: string
  errorMessage: string
}

export interface CsvRowDiff {
  rowNumber: number
  identifier: string
  name: string
  isNew: boolean
  changes: {
    field: string
    currentValue: string
    requestedValue: string
  }[]
}

/**
 * GET /api/v1/users/csv — Download template
 */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session

  const headers = [
    'fullName',
    'email',
    'phone',
    'password',
    'role',
    'roles',
    'branchCode',
    'designation',
    'department',
    'employeeCode',
    'employmentType',
    'status',
  ]

  const sampleRows = [
    [
      'Aarav Sharma',
      'aarav.sharma@school.demo',
      '+919876543210',
      'Preone@123',
      'TEACHER',
      'TEACHER|COORDINATOR',
      'MAIN',
      'Senior Montessori Teacher',
      'Early Childhood Education',
      'EMP-1001',
      'REGULAR',
      'ACTIVE',
    ],
    [
      'Neha Patel',
      'neha.patel@school.demo',
      '+919876543211',
      'Preone@123',
      'ACCOUNTS',
      'ACCOUNTS',
      'MAIN',
      'Accounts Officer',
      'Finance & Administration',
      'EMP-1002',
      'REGULAR',
      'ACTIVE',
    ],
  ]

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n')

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="preone_users_template.csv"',
    },
  })
}

/**
 * POST /api/v1/users/csv — Validate or Execute CSV import, update, overwrite, or soft-deactivation
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json()
    const {
      action,
      mode = 'CREATE',
      overwrite = false,
      rows,
      applyValidOnly = false,
    } = body as {
      action: 'validate' | 'execute'
      mode: CsvMode
      overwrite?: boolean
      rows: CsvRowInput[]
      applyValidOnly?: boolean
    }

    if (!action || !['validate', 'execute'].includes(action)) {
      return bad('Action must be "validate" or "execute"', 'INVALID_ACTION')
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return bad('Non-empty rows array is required', 'EMPTY_ROWS')
    }

    const isActorOwnerOrPlatform = session.role === 'OWNER' || session.role === 'PLATFORM_ADMIN'

    // Fetch master data for tenant: branches & existing users (TENANT SCOPED)
    const [branches, existingTenantUsers] = await Promise.all([
      db.branch.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        select: { id: true, code: true, name: true },
      }),
      db.tenantUser.findMany({
        where: { tenantId: session.tenantId, deletedAt: null },
        include: {
          user: {
            include: { staffProfile: true },
          },
        },
      }),
    ])

    type BranchItem = { id: string; code: string; name: string }
    type TenantUserRecord = (typeof existingTenantUsers)[number]
    const branchCodeMap = new Map<string, BranchItem>(branches.map((b) => [b.code.toUpperCase(), b]))
    const existingUserMap = new Map<string, TenantUserRecord>(
      existingTenantUsers.map((tu) => [tu.user.email.toLowerCase(), tu])
    )

    const errors: CsvValidationError[] = []
    const diffs: CsvRowDiff[] = []
    const seenEmails = new Set<string>()

    let validRowsCount = 0
    let newUsersCount = 0
    let existingUsersCount = 0
    let deactivatingUsersCount = 0

    // Dry-run validation loop (Zero mutation)
    for (const r of rows) {
      const rowNum = r.rowNumber || 1
      const email = r.email?.trim().toLowerCase()
      const identifier = email || `Row #${rowNum}`
      let rowValid = true

      const addErr = (field: string, current: string, requested: string, code: string, msg: string) => {
        errors.push({
          rowNumber: rowNum,
          identifier,
          field,
          currentValue: current,
          requestedValue: requested,
          errorCode: code,
          errorMessage: msg,
        })
        rowValid = false
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        addErr('email', '', email || '', 'INVALID_EMAIL', 'Valid email is required')
        continue
      }

      if (seenEmails.has(email)) {
        addErr('email', '', email, 'DUPLICATE_EMAIL_IN_CSV', `Email ${email} appears multiple times in CSV`)
      } else {
        seenEmails.add(email)
      }

      const existing = existingUserMap.get(email)

      // 1. DELETE Mode — Controlled Soft-Deactivation
      if (mode === 'DELETE') {
        if (!existing) {
          addErr('email', 'NOT_FOUND', email, 'USER_NOT_FOUND', `User ${email} not found in this school`)
          continue
        }

        if (existing.role === 'OWNER' && !isActorOwnerOrPlatform) {
          addErr('role', 'OWNER', '', 'CANNOT_MODIFY_OWNER', 'Only school owners can deactivate an OWNER account')
          continue
        }

        if (existing.role === 'PRINCIPAL' && !isActorOwnerOrPlatform && session.role !== 'PRINCIPAL') {
          addErr('role', 'PRINCIPAL', '', 'CANNOT_MODIFY_PRINCIPAL', 'You do not have permission to deactivate principal accounts')
          continue
        }

        if (rowValid) {
          validRowsCount++
          deactivatingUsersCount++
          diffs.push({
            rowNumber: rowNum,
            identifier: email,
            name: existing.user.fullName,
            isNew: false,
            changes: [{ field: 'status', currentValue: existing.status, requestedValue: 'INACTIVE' }],
          })
        }
        continue
      }

      // 2. CREATE Mode (respects overwrite flag)
      if (mode === 'CREATE') {
        if (existing && !overwrite) {
          addErr('email', 'EXISTS', email, 'USER_ALREADY_EXISTS', `User ${email} already exists in this school`)
        } else if (!existing) {
          if (!r.fullName?.trim()) {
            addErr('fullName', '', '', 'MISSING_NAME', 'Full name is required')
          }
          if (r.password && r.password.length < 6) {
            addErr('password', '', '', 'INVALID_PASSWORD', 'Password must be at least 6 characters')
          }
        }
      }

      // 3. UPDATE Mode
      if (mode === 'UPDATE') {
        if (!existing) {
          addErr('email', 'NOT_FOUND', email, 'USER_NOT_FOUND', `User ${email} not found in this school`)
          continue
        }

        if (existing.role === 'OWNER' && !isActorOwnerOrPlatform) {
          addErr('role', 'OWNER', '', 'CANNOT_MODIFY_OWNER', 'Only school owners can modify an OWNER account')
          continue
        }
      }

      // 4. UPSERT Mode
      // (If existing, acts as update; if not existing, acts as create)
      if (mode === 'UPSERT' && !existing) {
        if (!r.fullName?.trim()) {
          addErr('fullName', '', '', 'MISSING_NAME', 'Full name is required')
        }
      }

      // Validate roles
      let parsedRoles: UserRole[] = []
      if (r.roles) {
        const split = r.roles.split(/[|,]/).map((s) => s.trim().toUpperCase())
        for (const sr of split) {
          if (!VALID_ROLES.includes(sr as any)) {
            addErr('roles', '', sr, 'INVALID_ROLE', `Invalid role "${sr}"`)
          } else {
            parsedRoles.push(sr as UserRole)
          }
        }
      } else if (r.role) {
        const single = r.role.trim().toUpperCase()
        if (!VALID_ROLES.includes(single as any)) {
          addErr('role', '', single, 'INVALID_ROLE', `Invalid role "${single}"`)
        } else {
          parsedRoles.push(single as UserRole)
        }
      }

      if (parsedRoles.includes('PLATFORM_ADMIN' as any)) {
        addErr('role', '', 'PLATFORM_ADMIN', 'ROLE_ASSIGNMENT_FORBIDDEN', 'Cannot assign PLATFORM_ADMIN role')
      }

      if (parsedRoles.includes('OWNER') && !isActorOwnerOrPlatform) {
        addErr('role', '', 'OWNER', 'ROLE_ASSIGNMENT_FORBIDDEN', 'Only owners can assign OWNER role')
      }

      if (parsedRoles.includes('PRINCIPAL') && !isActorOwnerOrPlatform && session.role !== 'PRINCIPAL') {
        addErr('role', '', 'PRINCIPAL', 'ROLE_ASSIGNMENT_FORBIDDEN', 'Only owners and principals can assign PRINCIPAL role')
      }

      // Validate Branch
      let resolvedBranchId: string | null | undefined = undefined
      if (r.branchCode?.trim()) {
        const b = branchCodeMap.get(r.branchCode.trim().toUpperCase())
        if (!b) {
          addErr('branchCode', '', r.branchCode, 'INVALID_BRANCH', `Branch code "${r.branchCode}" not found in this school`)
        } else {
          resolvedBranchId = b.id
          if (session.branchId && session.branchId !== b.id && !isActorOwnerOrPlatform && session.role !== 'PRINCIPAL') {
            addErr('branchCode', session.branchId, b.id, 'CROSS_BRANCH_FORBIDDEN', 'Cannot assign users to another campus branch')
          }
        }
      }

      // Validate Status
      if (r.status?.trim()) {
        const st = r.status.trim().toUpperCase()
        if (!VALID_STATUSES.includes(st as any)) {
          addErr('status', '', st, 'INVALID_STATUS', `Status must be one of: ${VALID_STATUSES.join(', ')}`)
        }
      }

      // Validate Employment Type
      if (r.employmentType?.trim()) {
        const et = r.employmentType.trim().toUpperCase()
        if (!VALID_EMP_TYPES.includes(et as any)) {
          addErr('employmentType', '', et, 'INVALID_EMP_TYPE', `Employment type must be one of: ${VALID_EMP_TYPES.join(', ')}`)
        }
      }

      if (rowValid) {
        validRowsCount++
        if (existing) {
          existingUsersCount++
          const changes: { field: string; currentValue: string; requestedValue: string }[] = []
          if (r.fullName && r.fullName.trim() !== existing.user.fullName) {
            changes.push({ field: 'fullName', currentValue: existing.user.fullName, requestedValue: r.fullName.trim() })
          }
          if (parsedRoles.length > 0 && JSON.stringify(parsedRoles.sort()) !== JSON.stringify((existing.roles || [existing.role]).sort())) {
            changes.push({ field: 'roles', currentValue: (existing.roles || [existing.role]).join(', '), requestedValue: parsedRoles.join(', ') })
          }
          if (r.status && r.status.trim().toUpperCase() !== existing.status) {
            changes.push({ field: 'status', currentValue: existing.status, requestedValue: r.status.trim().toUpperCase() })
          }
          if (resolvedBranchId !== undefined && resolvedBranchId !== existing.branchId) {
            changes.push({ field: 'branchCode', currentValue: existing.branchId || 'None', requestedValue: r.branchCode || 'None' })
          }
          if (r.designation !== undefined && r.designation.trim() !== (existing.user.staffProfile?.designation || '')) {
            changes.push({ field: 'designation', currentValue: existing.user.staffProfile?.designation || '', requestedValue: r.designation.trim() })
          }
          if (r.department !== undefined && r.department.trim() !== (existing.user.staffProfile?.department || '')) {
            changes.push({ field: 'department', currentValue: existing.user.staffProfile?.department || '', requestedValue: r.department.trim() })
          }

          diffs.push({
            rowNumber: rowNum,
            identifier: email,
            name: existing.user.fullName,
            isNew: false,
            changes,
          })
        } else {
          newUsersCount++
          diffs.push({
            rowNumber: rowNum,
            identifier: email,
            name: r.fullName?.trim() || '',
            isNew: true,
            changes: [
              { field: 'email', currentValue: '', requestedValue: email },
              { field: 'fullName', currentValue: '', requestedValue: r.fullName?.trim() || '' },
              { field: 'role', currentValue: '', requestedValue: parsedRoles[0] || 'TEACHER' },
            ],
          })
        }
      }
    }

    // DRY-RUN VALIDATION — Return results with strictly ZERO mutation
    if (action === 'validate') {
      return ok({
        action: 'validate',
        mode,
        totalRows: rows.length,
        validRows: validRowsCount,
        invalidRows: rows.length - validRowsCount,
        newUsers: newUsersCount,
        existingUsers: existingUsersCount,
        deactivatingUsers: deactivatingUsersCount,
        diffs,
        errors,
      })
    }

    // EXECUTION
    if (errors.length > 0 && !applyValidOnly) {
      return bad('CSV contains validation errors. Resolve errors or enable applyValidOnly.', 'VALIDATION_FAILED')
    }

    const invalidRowNumbers = new Set(errors.map((e) => e.rowNumber))
    const validRowsToExecute = rows.filter((r) => !invalidRowNumbers.has(r.rowNumber || 1))

    let createdCount = 0
    let updatedCount = 0
    let deletedCount = 0
    const meta = getRequestMeta(req)

    // Execute within an atomic transaction
    await db.$transaction(async (tx) => {
      // 1. DELETE Mode Execution (Soft-Deactivation)
      if (mode === 'DELETE') {
        for (const r of validRowsToExecute) {
          const email = r.email!.trim().toLowerCase()
          const existing = existingUserMap.get(email)
          if (!existing) continue

          await tx.tenantUser.update({
            where: { id: existing.id },
            data: { status: 'INACTIVE', deletedAt: new Date() },
          })
          await tx.user.update({
            where: { id: existing.userId },
            data: { status: 'INACTIVE', deletedAt: new Date(), updatedAt: new Date() },
          })
          deletedCount++
        }
        return
      }

      // 2. CREATE, UPDATE, UPSERT Mode Execution
      for (const r of validRowsToExecute) {
        const email = r.email!.trim().toLowerCase()
        const existing = existingUserMap.get(email)

        let parsedRoles: UserRole[] = []
        if (r.roles) {
          parsedRoles = Array.from(new Set(r.roles.split(/[|,]/).map((s) => s.trim().toUpperCase() as UserRole)))
        } else if (r.role) {
          parsedRoles = [r.role.trim().toUpperCase() as UserRole]
        }

        const primaryRole: UserRole = parsedRoles[0] || (existing ? existing.role : 'TEACHER')
        const branch = r.branchCode ? branchCodeMap.get(r.branchCode.trim().toUpperCase()) : undefined
        const status = (r.status?.trim().toUpperCase() as UserStatus) || 'ACTIVE'

        const shouldUpdate = existing && (mode === 'UPDATE' || mode === 'UPSERT' || (mode === 'CREATE' && overwrite))

        if (shouldUpdate) {
          // In-place update of existing user
          if (r.fullName?.trim() || r.phone !== undefined || (r.password && r.password.length >= 6)) {
            await tx.user.update({
              where: { id: existing.userId },
              data: {
                ...(r.fullName?.trim() ? { fullName: r.fullName.trim() } : {}),
                ...(r.phone !== undefined ? { phone: r.phone?.trim() || null } : {}),
                ...(r.password && r.password.length >= 6 ? { passwordHash: await bcrypt.hash(r.password, 10) } : {}),
              },
            })
          }

          await tx.tenantUser.update({
            where: { id: existing.id },
            data: {
              ...(parsedRoles.length > 0 ? { role: primaryRole, roles: parsedRoles } : {}),
              ...(branch ? { branchId: branch.id } : {}),
              ...(r.status ? { status } : {}),
            },
          })

          if (r.designation !== undefined || r.department !== undefined || r.employeeCode) {
            if (existing.user.staffProfile) {
              await tx.staffProfile.update({
                where: { id: existing.user.staffProfile.id },
                data: {
                  ...(r.designation !== undefined ? { designation: r.designation.trim() || null } : {}),
                  ...(r.department !== undefined ? { department: r.department.trim() || null } : {}),
                  ...(r.employeeCode ? { employeeCode: r.employeeCode.trim() } : {}),
                  ...(branch ? { branchId: branch.id } : {}),
                },
              })
            } else {
              await tx.staffProfile.create({
                data: {
                  tenantId: session.tenantId!,
                  userId: existing.userId,
                  employeeCode: r.employeeCode?.trim() || `EMP-${Date.now().toString().slice(-4)}-${existing.userId.slice(0, 3)}`,
                  designation: r.designation?.trim() || null,
                  department: r.department?.trim() || null,
                  branchId: branch?.id || existing.branchId,
                },
              })
            }
          }

          updatedCount++
        } else if (!existing && (mode === 'CREATE' || mode === 'UPSERT')) {
          // Creation of new user
          let user = await tx.user.findUnique({ where: { email } })
          const hash = await bcrypt.hash(r.password && r.password.length >= 6 ? r.password : 'Preone@123', 10)

          if (!user) {
            user = await tx.user.create({
              data: {
                email,
                fullName: r.fullName!.trim(),
                phone: r.phone?.trim() || null,
                passwordHash: hash,
                status,
              },
            })
          }

          await tx.tenantUser.create({
            data: {
              tenantId: session.tenantId!,
              userId: user.id,
              role: primaryRole,
              roles: parsedRoles.length > 0 ? parsedRoles : [primaryRole],
              branchId: branch?.id || null,
              status,
            },
          })

          const isStaff = parsedRoles.some((ro) =>
            ['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'OWNER'].includes(ro)
          )
          if (isStaff || r.designation || r.department || r.employeeCode) {
            const empCode = r.employeeCode?.trim() || `EMP-${Date.now().toString().slice(-4)}-${user.id.slice(0, 3)}`
            await tx.staffProfile.create({
              data: {
                tenantId: session.tenantId!,
                userId: user.id,
                employeeCode: empCode,
                designation: r.designation?.trim() || null,
                department: r.department?.trim() || null,
                employmentType: (r.employmentType?.trim().toUpperCase() as EmploymentType) || 'REGULAR',
                branchId: branch?.id || null,
              },
            })
          }

          createdCount++
        }
      }
    })

    const auditAction = mode === 'DELETE' ? 'CSV_DELETE' : mode === 'UPSERT' ? 'CSV_UPSERT' : `CSV_${mode}`

    await recordAudit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      action: auditAction,
      entity: 'User',
      module: 'Users',
      severity: mode === 'DELETE' ? 'WARNING' : 'INFO',
      summary: `Executed CSV ${mode}: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deactivated, ${errors.length} skipped`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: { mode, overwrite, createdCount, updatedCount, deletedCount, skippedCount: errors.length },
    })

    return ok({
      success: true,
      mode,
      createdCount,
      updatedCount,
      deletedCount,
      skippedCount: errors.length,
      errors,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

