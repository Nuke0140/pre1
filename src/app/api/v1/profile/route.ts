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
        memberships: {
          where: session.tenantId ? { tenantId: session.tenantId, deletedAt: null } : { deletedAt: null },
          include: {
            tenant: { select: { id: true, name: true, code: true } },
            staffProfile: {
              include: {
                branch: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return notFound('User record not found')
    }

    const membership = user.memberships[0]
    const staffProf = membership?.staffProfile || null
    let branch: { id: string; name: string; code?: string } | null = null
    if (session.branchId) {
      branch = await db.branch.findUnique({
        where: { id: session.branchId },
        select: { id: true, name: true, code: true },
      })
    } else if (staffProf?.branch) {
      branch = staffProf.branch
    }

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

    if (phone !== undefined && phone && phone.trim()) {
      const cleanPhone = phone.trim()
      if (cleanPhone.length < 5 || cleanPhone.length > 20) {
        return bad('Please provide a valid phone number', 'INVALID_PHONE')
      }
    }

    if (emergencyContactPhone !== undefined && emergencyContactPhone && emergencyContactPhone.trim()) {
      const cleanEmerg = emergencyContactPhone.trim()
      if (cleanEmerg.length < 5 || cleanEmerg.length > 20) {
        return bad('Please provide a valid emergency contact phone number', 'INVALID_EMERGENCY_PHONE')
      }
    }

    const validBloodGroups = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']
    let cleanBloodGroup: BloodGroup | null | undefined = undefined
    if (bloodGroup !== undefined) {
      if (!bloodGroup || (bloodGroup as unknown as string) === '') {
        cleanBloodGroup = null
      } else if (validBloodGroups.includes(bloodGroup as string)) {
        cleanBloodGroup = bloodGroup as BloodGroup
      }
    }

    // 2. Fetch existing user and staff profile
    const existingUser = await db.user.findUnique({
      where: { id: session.uid },
    })

    if (!existingUser) {
      return notFound('User account not found')
    }

    const existingStaffProfile = session.tenantId
      ? await db.staffProfile.findUnique({
          where: {
            tenantId_userId: {
              tenantId: session.tenantId,
              userId: session.uid,
            },
          },
        })
      : null

    // 3. Update User model (personal fields only)
    const userUpdateData: any = { updatedAt: new Date() }
    if (fullName !== undefined && fullName) userUpdateData.fullName = fullName.trim()
    if (phone !== undefined) userUpdateData.phone = phone ? phone.trim() : null

    const updatedUser = await db.user.update({
      where: { id: session.uid },
      data: userUpdateData,
    })

    // 4. Update StaffProfile if it exists or create if staff personal fields are provided
    const staffFields: any = {}
    if (emergencyContactName !== undefined) staffFields.emergencyContactName = emergencyContactName?.trim() || null
    if (emergencyContactPhone !== undefined) staffFields.emergencyContactPhone = emergencyContactPhone?.trim() || null
    if (currentAddress !== undefined) staffFields.currentAddress = currentAddress?.trim() || null
    if (permanentAddress !== undefined) staffFields.permanentAddress = permanentAddress?.trim() || null
    if (qualification !== undefined) staffFields.qualification = qualification?.trim() || null
    if (bloodGroup !== undefined) staffFields.bloodGroup = cleanBloodGroup

    let updatedStaffProfile = existingStaffProfile
    if (Object.keys(staffFields).length > 0) {
      if (existingStaffProfile) {
        updatedStaffProfile = await db.staffProfile.update({
          where: { id: existingStaffProfile.id },
          data: { ...staffFields, updatedAt: new Date() },
        })
      } else if (session.tenantId) {
        const employeeCode = `EMP-${Date.now().toString().slice(-6)}`
        updatedStaffProfile = await db.staffProfile.create({
          data: {
            userId: session.uid,
            tenantId: session.tenantId,
            branchId: session.branchId || null,
            employeeCode,
            ...staffFields,
          },
        })
      }
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
        avatarUrl: updatedUser.avatarUrl,
        staffProfile: updatedStaffProfile,
      },
    })
  } catch (err: any) {
    console.error('PATCH /api/v1/profile CAUGHT ERROR:', err)
    return bad(err.message || 'Profile update failed', 'PROFILE_UPDATE_FAILED')
  }
}

export const GET = withApi(_GET)
export const PATCH = withApi(_PATCH)
