import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { ok, bad, conflict, serverError, forbidden } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { UserRole } from '@prisma/client'

/** GET /api/v1/users � directory with role/search filtering & pagination (users:read) */
export async function GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const url = new URL(req.url)
  const roleFilter = url.searchParams.get('role') as UserRole | null
  const query = url.searchParams.get('q')?.toLowerCase()?.trim()
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50')))

  try {
    const where: any = {
      tenantId: session.tenantId,
      deletedAt: null,
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(query
        ? {
            user: {
              OR: [
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
              ],
            },
          }
        : {}),
    }

    const [total, members] = await Promise.all([
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
    ])

    return ok(
      members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.fullName,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        status: m.status,
        branchId: m.branchId,
        lastLoginAt: m.user.lastLoginAt,
        createdAt: m.createdAt,
        staffProfile: m.user.staffProfile
          ? {
              employeeCode: m.user.staffProfile.employeeCode,
              designation: m.user.staffProfile.designation,
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
      })),
      { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
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
      phone,
      branchId,
      classroomId,
      guardianId,
      designation,
      employeeCode,
    } = body as {
      fullName: string
      email: string
      password: string
      role: UserRole
      phone?: string
      branchId?: string
      classroomId?: string
      guardianId?: string
      designation?: string
      employeeCode?: string
    }

    if (!fullName || !email || !password || !role) {
      return bad('fullName, email, password and role are required', 'MISSING_FIELDS')
    }

    if (role === 'PLATFORM_ADMIN' || (role === 'OWNER' && session.role !== 'OWNER')) {
      return forbidden('Cannot assign this role')
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

      // Create TenantUser membership
      const membership = await tx.tenantUser.create({
        data: {
          tenantId: session.tenantId!,
          userId: user.id,
          role,
          branchId: branchId || null,
          status: 'ACTIVE',
        },
      })

      // If role is PARENT and guardianId is provided, link them
      if (role === 'PARENT') {
        if (guardianId) {
          const guardian = await tx.guardian.findFirst({
            where: { id: guardianId, tenantId: session.tenantId! },
          })
          if (!guardian) {
            throw new Error(`Guardian ${guardianId} not found in this school`)
          }
          await tx.guardian.update({
            where: { id: guardianId },
            data: { userId: user.id },
          })
        }
      }

      // If role is staff, ensure StaffProfile exists with unique employeeCode
      if (['TEACHER', 'COORDINATOR', 'PRINCIPAL', 'ACCOUNTS', 'RECEPTION'].includes(role)) {
        let finalEmpCode = employeeCode?.trim()
        if (!finalEmpCode) {
          const prefix = role === 'TEACHER' ? 'TCH' : 'EMP'
          const count = await tx.staffProfile.count({ where: { tenantId: session.tenantId! } })
          finalEmpCode = `${prefix}-${String(count + 1).padStart(4, '0')}`
        }

        await tx.staffProfile.upsert({
          where: { tenantId_employeeCode: { tenantId: session.tenantId!, employeeCode: finalEmpCode } },
          update: {
            userId: user.id,
            designation: designation?.trim() || null,
            branchId: branchId || null,
          },
          create: {
            tenantId: session.tenantId!,
            userId: user.id,
            employeeCode: finalEmpCode,
            designation: designation?.trim() || null,
            branchId: branchId || null,
          },
        })
      }

      // If role is TEACHER and classroomId is assigned, set primaryTeacherId
      if (role === 'TEACHER' && classroomId) {
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

      return { user, membership }
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
      summary: `Created user ${fullName} with role ${role}${guardianId ? ' (linked to guardian)' : ''}${classroomId ? ' (assigned to classroom)' : ''}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    })

    return ok({ userId: result.user.id, membershipId: result.membership.id }, undefined, 201)
  } catch (e: any) {
    return serverError(e.message)
  }
}
