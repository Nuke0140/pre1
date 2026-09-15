import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, bad, conflict, serverError, forbidden } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserRole, Relationship } from '@prisma/client'

/** GET /api/v1/users � directory with role/search filtering & pagination (users:read) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const roleFilter = url.searchParams.get('role') as UserRole | null
  const statusFilter = url.searchParams.get('status') as string | null
  const branchFilter = url.searchParams.get('branchId') || url.searchParams.get('branch')
  const departmentFilter = url.searchParams.get('department')?.toLowerCase()?.trim()
  const designationFilter = url.searchParams.get('designation')?.toLowerCase()?.trim()
  const userTypeFilter = url.searchParams.get('userType')?.toUpperCase() // 'STAFF' | 'PARENT'
  const query = url.searchParams.get('q')?.toLowerCase()?.trim()
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50')))

  try {
    const where: any = {
      tenantId: session.tenantId,
      deletedAt: null,
      ...(roleFilter
        ? {
            OR: [
              { role: roleFilter },
              { roles: { has: roleFilter } },
            ],
          }
        : {}),
      ...(statusFilter && ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(statusFilter)
        ? { status: statusFilter }
        : {}),
      ...(branchFilter ? { branchId: branchFilter } : {}),
      ...(userTypeFilter === 'PARENT'
        ? {
            OR: [
              { role: 'PARENT' },
              { roles: { has: 'PARENT' } },
            ],
          }
        : userTypeFilter === 'STAFF'
        ? {
            AND: [
              { role: { not: 'PARENT' } },
              { NOT: { roles: { equals: ['PARENT'] } } },
            ],
          }
        : {}),
      ...(departmentFilter || designationFilter
        ? {
            user: {
              staffProfile: {
                ...(departmentFilter ? { department: { contains: departmentFilter, mode: 'insensitive' } } : {}),
                ...(designationFilter ? { designation: { contains: designationFilter, mode: 'insensitive' } } : {}),
              },
            },
          }
        : {}),
      ...(query
        ? {
            user: {
              OR: [
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { staffProfile: { employeeCode: { contains: query, mode: 'insensitive' } } },
                { staffProfile: { designation: { contains: query, mode: 'insensitive' } } },
              ],
            },
          }
        : {}),
    }

    const [total, members, activeCount, pendingCount, suspendedCount, inactiveCount] = await Promise.all([
      db.tenantUser.count({ where }),
      db.tenantUser.findMany({
        where,
        include: {
          user: {
            include: {
              staffProfile: true,
              taughtClasses: {
                select: { id: true, name: true, programType: true },
              },
              guardianProfile: {
                include: {
                  studentLinks: {
                    include: {
                      student: {
                        select: { id: true, firstName: true, lastName: true, admissionNo: true },
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
      db.tenantUser.count({ where: { tenantId: session.tenantId, deletedAt: null, status: 'ACTIVE' } }),
      db.tenantUser.count({ where: { tenantId: session.tenantId, deletedAt: null, status: 'PENDING' } }),
      db.tenantUser.count({ where: { tenantId: session.tenantId, deletedAt: null, status: 'SUSPENDED' } }),
      db.tenantUser.count({ where: { tenantId: session.tenantId, deletedAt: null, status: 'INACTIVE' } }),
    ])

    return ok(
      members.map((m) => {
        const assignedRoles: UserRole[] = m.roles && m.roles.length > 0 ? m.roles : [m.role]
        return {
          id: m.id,
          userId: m.user.id,
          name: m.user.fullName,
          email: m.user.email,
          phone: m.user.phone,
          role: m.role,
          roles: assignedRoles,
          status: m.status,
          branchId: m.branchId,
          lastLoginAt: m.user.lastLoginAt,
          createdAt: m.createdAt,
          staffProfile: m.user.staffProfile
            ? {
                employeeCode: m.user.staffProfile.employeeCode,
                designation: m.user.staffProfile.designation,
                department: m.user.staffProfile.department,
                qualification: m.user.staffProfile.qualification,
                employmentType: m.user.staffProfile.employmentType,
              }
            : null,
          taughtClasses: m.user.taughtClasses,
          guardianProfile: m.user.guardianProfile
            ? {
                id: m.user.guardianProfile.id,
                relationship: m.user.guardianProfile.relationship,
                students: m.user.guardianProfile.studentLinks.map((sl) => ({
                  id: sl.student.id,
                  name: `${sl.student.firstName} ${sl.student.lastName || ''}`.trim(),
                  admissionNo: sl.student.admissionNo,
                  canPickup: sl.canPickup,
                })),
              }
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
      }
    )
  } catch (err: any) {
    return serverError(err.message)
  }
}

/** POST /api/v1/users � create/invite user with role and relations (users:write) */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json()
    const {
      fullName,
      email,
      password,
      role,
      roles: inputRoles,
      primaryRole,
      phone,
      branchId,
      classroomId,
      guardianId,
      studentId,
      studentIds: inputStudentIds,
      relationship,
      pickupPin,
      canPickup,
      isPrimary,
      designation,
      employeeCode,
    } = body as {
      fullName: string
      email: string
      password: string
      role?: UserRole
      roles?: UserRole[]
      primaryRole?: UserRole
      phone?: string
      branchId?: string
      classroomId?: string
      guardianId?: string
      studentId?: string
      studentIds?: string[]
      relationship?: Relationship
      pickupPin?: string
      canPickup?: boolean
      isPrimary?: boolean
      designation?: string
      employeeCode?: string
    }

    // Determine roles array and primary role
    let assignedRoles: UserRole[] = []
    if (inputRoles && Array.isArray(inputRoles) && inputRoles.length > 0) {
      assignedRoles = [...new Set(inputRoles)]
    } else if (role) {
      assignedRoles = [role]
    }

    if (!fullName || !email || !password || assignedRoles.length === 0) {
      return bad('fullName, email, password and at least one role are required', 'MISSING_FIELDS')
    }

    // Primary role defaults to primaryRole if in assignedRoles, else first role in array, else input role
    const finalPrimaryRole: UserRole =
      primaryRole && assignedRoles.includes(primaryRole)
        ? primaryRole
        : assignedRoles[0]

    // Validate role escalation for all requested roles
    for (const r of assignedRoles) {
      if (r === 'PLATFORM_ADMIN') {
        return forbidden('Cannot assign PLATFORM_ADMIN role')
      }
      if (r === 'OWNER' && session.role !== 'OWNER' && session.role !== 'PLATFORM_ADMIN') {
        return forbidden('Only school owners can assign the OWNER role')
      }
    }

    if (password.length < 6) {
      return bad('Password must be at least 6 characters', 'PASSWORD_TOO_SHORT')
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
      return conflict('An account with this email already belongs to this school')
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
        return conflict('An account with this mobile number already exists in this school')
      }
    }

    // Run creation inside an atomic transaction
    const result = await db.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: emailNorm } })

      if (!user) {
        user = await tx.user.create({
          data: {
            email: emailNorm,
            fullName: fullName.trim(),
            phone: phoneNorm,
            passwordHash: await bcrypt.hash(password, 10),
            status: 'ACTIVE',
          },
        })
      } else {
        // Update user name/phone if not set
        await tx.user.update({
          where: { id: user.id },
          data: {
            fullName: fullName.trim(),
            ...(phoneNorm ? { phone: phoneNorm } : {}),
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
          status: 'ACTIVE',
        },
      })

      // If any assigned role is PARENT, resolve or link guardian profile
      if (assignedRoles.includes('PARENT')) {
        let guardian: any = null

        // 1. Explicit guardianId provided (strongest)
        if (guardianId) {
          guardian = await tx.guardian.findFirst({
            where: { id: guardianId, tenantId: session.tenantId! },
            include: { user: true },
          })
          if (!guardian) {
            throw new Error(`Guardian ${guardianId} not found in this school`)
          }

          // Rule: Check for collision if already linked to another active user
          if (guardian.userId && guardian.userId !== user.id) {
            if (guardian.user && guardian.user.status !== 'INACTIVE') {
              throw new Error(`Guardian "${guardian.fullName}" is already linked to parent account (${guardian.user.email}). Cannot reassign without manual unlinking.`)
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

          // 3. Match existing guardian by email (supporting match)
          if (!guardian && emailNorm) {
            const byEmail = await tx.guardian.findFirst({
              where: { tenantId: session.tenantId!, email: emailNorm, deletedAt: null },
              include: { user: true },
            })
            if (byEmail) {
              if (byEmail.userId && byEmail.userId !== user.id) {
                // Different active account linked to this email — do not merge blindly
              } else {
                guardian = await tx.guardian.update({
                  where: { id: byEmail.id },
                  data: { userId: user.id },
                })
              }
            }
          }

          // 4. Match existing guardian by phone (candidate match — only if name also matches)
          if (!guardian && phoneNorm) {
            const byPhone = await tx.guardian.findFirst({
              where: { tenantId: session.tenantId!, phone: phoneNorm, deletedAt: null },
              include: { user: true },
            })
            if (byPhone) {
              const nameMatches = byPhone.fullName.toLowerCase().trim() === fullName.trim().toLowerCase()
              if (nameMatches) {
                if (!byPhone.userId || byPhone.userId === user.id) {
                  guardian = await tx.guardian.update({
                    where: { id: byPhone.id },
                    data: { userId: user.id },
                  })
                }
              }
              // If name doesn't match, it could be a shared household phone (Mother vs Father).
              // Do NOT merge; fall through to create a distinct Guardian record.
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

        for (const sid of targetStudentIds) {
          const student = await tx.student.findFirst({
            where: { id: sid, tenantId: session.tenantId!, deletedAt: null },
          })
          if (student) {
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
                  isFeePayer: true,
                  receivesComm: true,
                },
              })
            }
          }
        }
      }

      // If any assigned role is staff or designation provided, ensure StaffProfile exists
      const isStaff = assignedRoles.some((r) =>
        ['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION', 'OWNER'].includes(r)
      )

      if (isStaff || designation) {
        const existingProfile = await tx.staffProfile.findUnique({
          where: { userId: user.id },
        })

        let finalEmpCode = employeeCode?.trim()
        if (!finalEmpCode) {
          if (existingProfile?.employeeCode) {
            finalEmpCode = existingProfile.employeeCode
          } else {
            const prefix = assignedRoles.includes('TEACHER') ? 'TCH' : 'EMP'
            const count = await tx.staffProfile.count({ where: { tenantId: session.tenantId! } })
            finalEmpCode = `${prefix}-${String(count + 1).padStart(4, '0')}`
          }
        }

        if (existingProfile) {
          await tx.staffProfile.update({
            where: { id: existingProfile.id },
            data: {
              employeeCode: finalEmpCode,
              designation: designation?.trim() || existingProfile.designation,
              branchId: branchId || existingProfile.branchId,
            },
          })
        } else {
          await tx.staffProfile.create({
            data: {
              tenantId: session.tenantId!,
              userId: user.id,
              employeeCode: finalEmpCode,
              designation: designation?.trim() || null,
              branchId: branchId || null,
            },
          })
        }
      }

      // If TEACHER is among the assigned roles and classroomId is assigned, set primaryTeacherId
      if (assignedRoles.includes('TEACHER') && classroomId) {
        const classroom = await tx.classroom.findFirst({
          where: { id: classroomId, tenantId: session.tenantId! },
        })
        if (!classroom) {
          throw new Error(`Classroom ${classroomId} not found in this school`)
        }
        await tx.classroom.update({
          where: { id: classroomId },
          data: { primaryTeacherId: user.id },
        })
      }

      return { user, membership, assignedRoles, finalPrimaryRole }
    })

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
      summary: `Created user ${fullName} with roles [${result.assignedRoles.join(', ')}] (primary: ${result.finalPrimaryRole})`,
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
      },
    })

    return ok(
      {
        id: result.membership.id,
        userId: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.finalPrimaryRole,
        roles: result.assignedRoles,
        status: result.membership.status,
        branchId: result.membership.branchId,
      },
      undefined,
      201
    )
  } catch (e: any) {
    return serverError(e.message)
  }
}
