import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, serverError, notFound } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { BloodGroup } from '@prisma/client'

/**
 * GET /api/v1/profile — View self profile for the currently authenticated staff member.
 * Identity is derived strictly from the verified session token (no client ID trusted).
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session

  try {
    const user = await db.user.findUnique({
      where: { id: session.uid },
      include: {
        staffProfile: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
          },
        },
        memberships: {
          where: session.tenantId ? { tenantId: session.tenantId, deletedAt: null } : { deletedAt: null },
          include: {
            tenant: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    if (!user) {
      return notFound('User record not found')
    }

    const membership = user.memberships[0]
    let branch: { id: string; name: string; code?: string } | null = null
    if (session.branchId) {
      branch = await db.branch.findUnique({
        where: { id: session.branchId },
        select: { id: true, name: true, code: true },
      })
    } else if (user.staffProfile?.branch) {
      branch = user.staffProfile.branch
    }

    const staffProf = user.staffProfile

    return ok({
      id: user.id,
      userId: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: session.role,
      roles: session.roles || [session.role],
      status: user.status,
      tenantId: membership?.tenantId || session.tenantId,
      tenantName: membership?.tenant?.name || null,
      tenantCode: membership?.tenant?.code || null,
      branchId: branch?.id || null,
      branchName: branch?.name || null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      staffProfile: staffProf
        ? {
            id: staffProf.id,
            employeeCode: staffProf.employeeCode,
            designation: staffProf.designation,
            department: staffProf.department,
            qualification: staffProf.qualification,
            joiningDate: staffProf.joiningDate,
            employmentType: staffProf.employmentType,
            emergencyContactName: staffProf.emergencyContactName,
            emergencyContactPhone: staffProf.emergencyContactPhone,
            currentAddress: staffProf.currentAddress,
            permanentAddress: staffProf.permanentAddress,
            bloodGroup: staffProf.bloodGroup,
            dateOfBirth: staffProf.dateOfBirth,
            gender: staffProf.gender,
            status: staffProf.status,
          }
        : null,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * PATCH /api/v1/profile — Self-service profile edit for authenticated staff.
 * Allows updating approved personal fields only. Administrative and institutional fields
 * (roles, permissions, employeeCode, tenant, branch, status, payroll) remain strictly protected.
 */
async function _PATCH(req: NextRequest) {
  const session = await requireApi(req)
  if (isResponse(session)) return session

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return bad('Invalid request payload', 'INVALID_PAYLOAD')
    }

    const {
      fullName,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      currentAddress,
      permanentAddress,
      qualification,
      bloodGroup,
    } = body as {
      fullName?: string
      phone?: string
      emergencyContactName?: string
      emergencyContactPhone?: string
      currentAddress?: string
      permanentAddress?: string
      qualification?: string
      bloodGroup?: BloodGroup | null
    }

    // 1. Validation for approved personal fields
    if (fullName !== undefined && (!fullName || !fullName.trim())) {
      return bad('Full name cannot be blank', 'NAME_REQUIRED')
    }

    if (phone !== undefined && phone.trim()) {
      const cleanPhone = phone.trim()
      if (cleanPhone.length < 5 || cleanPhone.length > 20) {
        return bad('Please provide a valid phone number', 'INVALID_PHONE')
      }
    }

    if (emergencyContactPhone !== undefined && emergencyContactPhone.trim()) {
      const cleanEmerg = emergencyContactPhone.trim()
      if (cleanEmerg.length < 5 || cleanEmerg.length > 20) {
        return bad('Please provide a valid emergency contact phone number', 'INVALID_EMERGENCY_PHONE')
      }
    }

    const validBloodGroups = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']
    let cleanBloodGroup: BloodGroup | null | undefined = undefined
    if (bloodGroup !== undefined) {
      if (bloodGroup === null || (bloodGroup as unknown as string) === '') {
        cleanBloodGroup = null
      } else if (validBloodGroups.includes(bloodGroup as string)) {
        cleanBloodGroup = bloodGroup as BloodGroup
      }
    }

    // 2. Fetch existing user and staff profile
    const existingUser = await db.user.findUnique({
      where: { id: session.uid },
      include: { staffProfile: true },
    })

    if (!existingUser) {
      return notFound('User account not found')
    }

    // 3. Update User model (personal fields only)
    const userUpdateData: any = { updatedAt: new Date() }
    if (fullName !== undefined) userUpdateData.fullName = fullName.trim()
    if (phone !== undefined) userUpdateData.phone = phone.trim() || null

    const updatedUser = await db.user.update({
      where: { id: session.uid },
      data: userUpdateData,
    })

    // 4. Update StaffProfile if it exists or if staff personal fields are provided
    if (existingUser.staffProfile) {
      const staffUpdateData: any = { updatedAt: new Date() }
      if (emergencyContactName !== undefined) staffUpdateData.emergencyContactName = emergencyContactName.trim() || null
      if (emergencyContactPhone !== undefined) staffUpdateData.emergencyContactPhone = emergencyContactPhone.trim() || null
      if (currentAddress !== undefined) staffUpdateData.currentAddress = currentAddress.trim() || null
      if (permanentAddress !== undefined) staffUpdateData.permanentAddress = permanentAddress.trim() || null
      if (qualification !== undefined) staffUpdateData.qualification = qualification.trim() || null
      if (cleanBloodGroup !== undefined) staffUpdateData.bloodGroup = cleanBloodGroup

      await db.staffProfile.update({
        where: { id: existingUser.staffProfile.id },
        data: staffUpdateData,
      })
    }

    // 5. Audit log event
    const meta = getRequestMeta(req)
    await recordAudit({
      tenantId: session.tenantId,
      branchId: session.branchId || undefined,
      actorId: session.uid,
      actorName: updatedUser.fullName,
      actorRole: session.role,
      action: 'USER_PROFILE_UPDATED',
      entity: 'User',
      entityId: session.uid,
      module: 'USERS',
      summary: `${session.name} updated their self-service profile details`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValues: {
        fullName: userUpdateData.fullName,
        phone: userUpdateData.phone,
        hasEmergencyContact: Boolean(emergencyContactName || emergencyContactPhone),
      },
    })

    return ok({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
      },
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
