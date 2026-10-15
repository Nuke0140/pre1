import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { GuardianChild, HouseholdGuardian, HouseholdCampus, FamilyHousehold } from '@/components/users/types'

class UnionFind {
  parent: Map<string, string> = new Map()

  find(i: string): string {
    if (!this.parent.has(i)) {
      this.parent.set(i, i)
      return i
    }
    const p = this.parent.get(i)!
    if (p === i) return i
    const root = this.find(p)
    this.parent.set(i, root)
    return root
  }

  union(i: string, j: string) {
    const rootI = this.find(i)
    const rootJ = this.find(j)
    if (rootI !== rootJ) {
      this.parent.set(rootI, rootJ)
    }
  }
}

/**
 * GET /api/v1/users/family-groups
 * Returns aggregated family households / sibling clusters across the school with:
 * - Cross-campus detection
 * - Branch filters
 * - Connected household guardians & siblings
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || searchParams.get('search') || '').trim().toLowerCase()
    const branchFilter = searchParams.get('branchId') || undefined
    const crossCampusOnly = searchParams.get('crossCampusOnly') === 'true' || searchParams.get('crossCampusOnly') === '1'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10)))

    // If session is branch-scoped and not owner/principal, enforce branchFilter
    const effectiveBranchFilter =
      session.role === 'OWNER' || session.role === 'PRINCIPAL' || session.role === 'PLATFORM_ADMIN'
        ? branchFilter
        : session.branchId || branchFilter

    // 1. Fetch all student-guardian links
    const allLinks = await db.studentGuardian.findMany({
      where: {
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

    // 2. Fetch tenant branches
    const branches = await db.branch.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      select: { id: true, name: true, code: true, isMain: true },
    })
    const branchMap = new Map(branches.map((b) => [b.id, b]))

    // 3. Cluster by connected components (Disjoint Set)
    const uf = new UnionFind()

    for (const link of allLinks) {
      const sKey = `s_${link.studentId}`
      const gKey = `g_${link.guardianId}`
      uf.union(sKey, gKey)
    }

    // 4. Collect members per cluster
    const clusterStudents = new Map<string, Map<string, GuardianChild>>()
    const clusterGuardians = new Map<string, Map<string, HouseholdGuardian>>()

    for (const link of allLinks) {
      const rootKey = uf.find(`s_${link.studentId}`)

      if (!clusterStudents.has(rootKey)) clusterStudents.set(rootKey, new Map())
      if (!clusterGuardians.has(rootKey)) clusterGuardians.set(rootKey, new Map())

      const sMap = clusterStudents.get(rootKey)!
      const gMap = clusterGuardians.get(rootKey)!

      if (!sMap.has(link.studentId)) {
        const b = branchMap.get(link.student.branchId)
        sMap.set(link.studentId, {
          id: link.student.id,
          name: `${link.student.firstName} ${link.student.lastName || ''}`.trim(),
          admissionNo: link.student.admissionNo,
          canPickup: link.canPickup,
          receivesComm: link.receivesComm,
          pickupPin: link.pickupPin ? '••••' : null,
          relationship: link.relationship || link.guardian.relationship,
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

      if (!gMap.has(link.guardianId)) {
        const userMem = link.guardian.user?.memberships?.[0]
        gMap.set(link.guardianId, {
          id: link.guardian.id,
          userId: link.guardian.userId,
          fullName: link.guardian.fullName,
          relationship: link.relationship || link.guardian.relationship,
          phone: link.guardian.phone,
          email: link.guardian.email,
          isPrimaryContact: link.guardian.isPrimaryContact || link.isPrimary,
          canPickup: link.canPickup,
          pickupPin: link.guardian.pickupPin ? '••••' : null,
          avatarUrl: link.guardian.user?.avatarUrl || null,
          role: userMem?.role || 'GUARDIAN',
          status: userMem?.status || 'ACTIVE',
        })
      }
    }

    // 5. Construct FamilyHousehold objects
    let households: FamilyHousehold[] = []

    for (const [rootKey, sMap] of clusterStudents.entries()) {
      const gMap = clusterGuardians.get(rootKey) || new Map()
      const students = Array.from(sMap.values())
      const guardians = Array.from(gMap.values())

      if (students.length === 0 && guardians.length === 0) continue

      const uniqueBranchIds = Array.from(
        new Set(students.map((s) => s.branchId).filter(Boolean))
      ) as string[]

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

      const lastNameCandidate =
        primaryGuardian?.fullName?.trim().split(' ').slice(-1)[0] ||
        students[0]?.name?.trim().split(' ').slice(-1)[0] ||
        'Family'
      const familyName = lastNameCandidate ? `The ${lastNameCandidate} Family` : 'Household'

      households.push({
        id: `fam_${rootKey.replace(/[^a-zA-Z0-9_]/g, '_')}`,
        familyName,
        isCrossCampus,
        campuses,
        guardians,
        students,
        primaryGuardian,
      })
    }

    // Global cross campus count before filtering
    const totalCrossCampusCount = households.filter((h) => h.isCrossCampus).length

    // 6. Apply filters
    if (effectiveBranchFilter) {
      households = households.filter((h) =>
        h.campuses.some((c) => c.id === effectiveBranchFilter)
      )
    }

    if (crossCampusOnly) {
      households = households.filter((h) => h.isCrossCampus)
    }

    if (q) {
      households = households.filter((h) => {
        const matchGuardian = h.guardians.some(
          (g) =>
            g.fullName.toLowerCase().includes(q) ||
            (g.phone && g.phone.toLowerCase().includes(q)) ||
            (g.email && g.email.toLowerCase().includes(q))
        )
        const matchStudent = h.students.some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.admissionNo.toLowerCase().includes(q) ||
            (s.classroom && s.classroom.toLowerCase().includes(q))
        )
        const matchFamilyName = h.familyName.toLowerCase().includes(q)
        return matchGuardian || matchStudent || matchFamilyName
      })
    }

    // 7. Sort: multi-child / cross-campus first, then family name
    households.sort((a, b) => {
      if (a.isCrossCampus !== b.isCrossCampus) {
        return a.isCrossCampus ? -1 : 1
      }
      if (b.students.length !== a.students.length) {
        return b.students.length - a.students.length
      }
      return a.familyName.localeCompare(b.familyName)
    })

    const total = households.length
    const offset = (page - 1) * pageSize
    const paginated = households.slice(offset, offset + pageSize)

    return ok({
      success: true,
      households: paginated,
      total,
      crossCampusCount: totalCrossCampusCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      campuses: branches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    })
  } catch (err: any) {
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
