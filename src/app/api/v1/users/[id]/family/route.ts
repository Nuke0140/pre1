import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, notFound, forbidden, serverError } from '@/lib/api'
import { requireApi, isResponse, requireCanManageUser } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { FamilyUserService, normalizeRelationship } from '@/lib/users/family-user-service'
import { GuardianChild, HouseholdGuardian, HouseholdCampus, FamilyHousehold } from '@/components/users/types'

/**
 * GET /api/v1/users/[id]/family
 * Resolves the complete household / family grouping unit for a parent/guardian user:
 * - All enrolled children (siblings) across campuses with classroom and admission info
 * - All co-guardians / household caregivers (Father, Mother, Legal Guardian) linked to any sibling
 * - Unique campuses and cross-campus indicator
 */
async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember } = manageCheck

  try {
    // 1. Resolve guardian profile for this user
    let guardian = await db.guardian.findFirst({
      where: {
        userId: targetMember.userId,
        tenantId: session.tenantId,
        deletedAt: null,
      },
      include: {
        studentLinks: {
          select: { studentId: true },
        },
      },
    })

    if (!guardian) {
      guardian = await db.guardian.findFirst({
        where: {
          id,
          tenantId: session.tenantId,
          deletedAt: null,
        },
        include: {
          studentLinks: {
            select: { studentId: true },
          },
        },
      })
    }

    if (!guardian) {
      return ok({
        isFamily: false,
        household: null,
      })
    }

    const studentIds = guardian.studentLinks.map((sl) => sl.studentId)

    if (studentIds.length === 0) {
      const singleHousehold: FamilyHousehold = {
        id: `hh_${guardian.id}`,
        familyName: `${guardian.fullName}'s Family`,
        isCrossCampus: false,
        campuses: [],
        guardians: [
          {
            id: guardian.id,
            userId: guardian.userId,
            fullName: guardian.fullName,
            relationship: guardian.relationship,
            phone: guardian.phone,
            email: guardian.email,
            isPrimaryContact: guardian.isPrimaryContact,
            canPickup: true,
            pickupPin: guardian.pickupPin ? '••••' : null,
            role: targetMember.role,
            status: targetMember.status,
          },
        ],
        students: [],
        primaryGuardian: null,
      }

      return ok({
        isFamily: true,
        household: singleHousehold,
      })
    }

    // 2. Fetch all student-guardian links for all these children (sibling cluster + co-guardians)
    const allLinks = await db.studentGuardian.findMany({
      where: {
        studentId: { in: studentIds },
        student: { tenantId: session.tenantId, deletedAt: null },
        guardian: { tenantId: session.tenantId, deletedAt: null },
      },
      include: {
        student: {
          include: {
            currentClassroom: {
              select: { id: true, name: true, branchId: true },
            },
          },
        },
        guardian: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                memberships: {
                  where: { tenantId: session.tenantId, deletedAt: null },
                  select: { role: true, status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // 3. Resolve branches
    const branchIds = Array.from(
      new Set(allLinks.map((l) => l.student.branchId).filter(Boolean))
    ) as string[]

    const branches = await db.branch.findMany({
      where: {
        tenantId: session.tenantId,
        id: { in: branchIds },
      },
      select: { id: true, name: true, code: true, isMain: true },
    })
    const branchMap = new Map(branches.map((b) => [b.id, b]))

    // 4. Build unique students list
    const studentMap = new Map<string, GuardianChild>()
    for (const link of allLinks) {
      if (!studentMap.has(link.studentId)) {
        const b = branchMap.get(link.student.branchId)
        studentMap.set(link.studentId, {
          id: link.student.id,
          name: `${link.student.firstName} ${link.student.lastName || ''}`.trim(),
          admissionNo: link.student.admissionNo,
          canPickup: link.canPickup,
          receivesComm: link.receivesComm,
          pickupPin: link.pickupPin ? '••••' : null,
          relationship: link.relationship || guardian.relationship,
          classroom: link.student.currentClassroom?.name || null,
          branchId: link.student.branchId,
          branchName: b?.name || 'Main Campus',
          branchCode: b?.code || '',
          dob: link.student.dob ? link.student.dob.toISOString() : null,
          gender: link.student.gender || null,
          status: link.student.status || 'ACTIVE',
          photoUrl: link.student.photoUrl || null,
          seatNumber: link.student.seatNumber || null,
        })
      }
    }

    // 5. Build unique guardians list (household caregivers)
    const guardianMap = new Map<string, HouseholdGuardian>()
    for (const link of allLinks) {
      const g = link.guardian
      if (!guardianMap.has(g.id)) {
        const userMem = g.user?.memberships?.[0]
        guardianMap.set(g.id, {
          id: g.id,
          userId: g.userId,
          fullName: g.fullName,
          relationship: link.relationship || g.relationship,
          phone: g.phone,
          email: g.email,
          isPrimaryContact: g.isPrimaryContact || link.isPrimary,
          canPickup: link.canPickup,
          pickupPin: g.pickupPin ? '••••' : null,
          avatarUrl: g.user?.avatarUrl || null,
          role: userMem?.role || 'GUARDIAN',
          status: userMem?.status || 'ACTIVE',
        })
      }
    }

    const students = Array.from(studentMap.values())
    const guardians = Array.from(guardianMap.values())

    const uniqueBranchIds = Array.from(new Set(students.map((s) => s.branchId).filter(Boolean))) as string[]
    const campuses: HouseholdCampus[] = uniqueBranchIds.map((bId) => {
      const b = branchMap.get(bId)
      return {
        id: bId,
        name: b?.name || 'Unknown Campus',
        code: b?.code || '',
        studentCount: students.filter((s) => s.branchId === bId).length,
      }
    })

    const isCrossCampus = campuses.length > 1
    const primaryGuardian = guardians.find((g) => g.isPrimaryContact) || guardians[0] || null

    // Determine family household title
    const lastNameCandidate =
      primaryGuardian?.fullName?.trim().split(' ').slice(-1)[0] ||
      students[0]?.name?.trim().split(' ').slice(-1)[0] ||
      'Family'
    const familyName = lastNameCandidate ? `The ${lastNameCandidate} Family` : `${guardian.fullName}'s Family`

    const household: FamilyHousehold = {
      id: `hh_${guardian.id}`,
      familyName,
      isCrossCampus,
      campuses,
      guardians,
      students,
      primaryGuardian,
    }

    return ok({
      isFamily: true,
      household,
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

/**
 * POST /api/v1/users/[id]/family
 * Links an additional sibling/child to this guardian / family unit.
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  const manageCheck = await requireCanManageUser(session, id)
  if (isResponse(manageCheck)) return manageCheck
  const { targetMember } = manageCheck

  try {
    const body = await req.json().catch(() => ({}))
    const {
      studentId,
      studentAdmissionNo,
      relationship,
      permissions,
    } = body

    if (!studentId && !studentAdmissionNo) {
      return bad('Either studentId or studentAdmissionNo is required', 'MISSING_STUDENT_IDENTIFIER')
    }

    // Resolve guardian profile
    let guardian = await db.guardian.findFirst({
      where: {
        userId: targetMember.userId,
        tenantId: session.tenantId,
        deletedAt: null,
      },
    })

    if (!guardian) {
      guardian = await db.guardian.findFirst({
        where: {
          id,
          tenantId: session.tenantId,
          deletedAt: null,
        },
      })
    }

    if (!guardian) {
      return bad('Target user is not registered as a parent or guardian', 'NOT_A_GUARDIAN')
    }

    const result = await FamilyUserService.linkStudentToGuardian(
      {
        tenantId: session.tenantId,
        actorId: session.userId,
        actorName: session.name,
        actorRole: session.role,
        actorBranchId: session.branchId,
        reqMeta: {
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      },
      {
        userId: targetMember.userId,
        guardianId: guardian.id,
        studentId: studentId?.trim() || undefined,
        studentAdmissionNo: studentAdmissionNo?.trim() || undefined,
        relationship: relationship ? normalizeRelationship(relationship) : guardian.relationship,
        permissions: {
          canPickup: permissions?.canPickup !== false,
          pickupPin: permissions?.pickupPin?.trim() || null,
          receivesCommunication: permissions?.receivesCommunication !== false,
          isFeePayer: permissions?.isFeePayer !== undefined ? Boolean(permissions.isFeePayer) : undefined,
        },
      }
    )

    return ok({
      success: true,
      message: `Successfully linked ${result.student.firstName} (${result.student.admissionNo}) to ${guardian.fullName}`,
      link: {
        studentId: result.student.id,
        studentName: `${result.student.firstName} ${result.student.lastName || ''}`.trim(),
        admissionNo: result.student.admissionNo,
        guardianId: guardian.id,
        relationship: result.studentGuardian.relationship,
        isAlreadyLinked: result.isAlreadyLinked,
      },
    })
  } catch (err: any) {
    if (err.code === 'PARENT_LIMIT_REACHED' || err.message?.includes('already has 2 registered Parent accounts')) {
      return bad(err.message, 'PARENT_LIMIT_REACHED')
    }
    if (err.message?.includes('not found')) {
      return notFound(err.message)
    }
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
