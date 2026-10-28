import { NextRequest } from 'next/server'
import { ok, withApi, errPermission } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds, requireBranchAccess } from '@/lib/auth-api'
import { can } from '@/lib/auth'
import { StudentService } from '@/lib/students/student-service'
import type { ProgramType, StudentStatus } from '@prisma/client'

/**
 * GET /api/v1/students — Paginated directory with multi-dimensional filtering & search
 */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('No tenant context found in active session')
  }

  const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
  const hasAccess = can(effectiveRoles, 'students:read') || can(effectiveRoles, 'students:read-linked')
  if (!hasAccess) {
    throw errPermission('Missing permission: students:read or students:read-linked')
  }

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') || '20', 10)))
  const search = sp.get('q') || sp.get('search') || undefined
  const classroomId = sp.get('classroomId') || undefined
  const rawBranchId = sp.get('branchId')
  const isAllBranches =
    !rawBranchId ||
    rawBranchId === 'ALL' ||
    rawBranchId === '__ALL_BRANCHES__' ||
    rawBranchId.toLowerCase() === 'all'

  const isInstitutionWide = effectiveRoles.some((r) =>
    ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(r)
  )

  let branchId: string | undefined = undefined
  if (!isInstitutionWide && session.branchId) {
    if (!isAllBranches && rawBranchId !== session.branchId) {
      throw errPermission('Access denied: branch scope restricted')
    }
    branchId = session.branchId
  } else if (!isAllBranches) {
    branchId = rawBranchId
  }

  const academicSessionId = sp.get('academicSessionId') || undefined
  const programType = (sp.get('programType') as ProgramType) || undefined
  const status = (sp.get('status') as StudentStatus) || undefined

  const isTeacher = effectiveRoles.includes('TEACHER') && !effectiveRoles.some((r) => ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r))
  if (isTeacher && session.branchId && rawBranchId && rawBranchId !== session.branchId) {
    throw errPermission('Teacher cannot access students outside assigned campus')
  }

  const result = await StudentService.listStudents(
    {
      tenantId: session.tenantId,
      branchId: session.branchId,
      academicSessionId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
      actorRoles: effectiveRoles,
    },
    {
      page,
      pageSize,
      search,
      classroomId,
      branchId,
      academicSessionId,
      programType,
      status,
    }
  )

  return ok(result.data, result.pagination)
}, { module: 'students' })

/**
 * POST /api/v1/students — Transactional manual student creation with duplicate check
 */
export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'students:write')
  if (isResponse(session)) return session
  if (!session.tenantId) {
    throw errPermission('No tenant context found in active session')
  }

  const body = await req.json()
  const {
    firstName,
    lastName,
    dob,
    gender,
    bloodGroup,
    address,
    photoUrl,
    programId,
    programType,
    classroomId,
    branchId,
    academicSessionId,
    guardianName,
    guardianPhone,
    guardianEmail,
    guardianRelationship,
    canPickup,
    isFeePayer,
    confirmDuplicate,
  } = body

  const targetBranchId = branchId || session.branchId
  if (!targetBranchId) {
    throw errPermission('Branch context is required')
  }

  const branchCheck = await requireBranchAccess(session, targetBranchId)
  if (branchCheck) return branchCheck

  const student = await StudentService.createStudent(
    {
      tenantId: session.tenantId,
      branchId: targetBranchId,
      academicSessionId,
      actorId: session.uid,
      actorName: session.name,
      actorRole: session.role,
    },
    {
      firstName,
      lastName,
      dob,
      gender,
      bloodGroup,
      address,
      photoUrl,
      programId,
      programType,
      classroomId,
      branchId: targetBranchId,
      academicSessionId,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelationship,
      canPickup,
      isFeePayer,
      confirmDuplicate,
    }
  )

  return ok(student, undefined, 201)
}, { module: 'students' })
