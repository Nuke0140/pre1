import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { UserCsvEngine, CsvPreviewRow } from '@/lib/users/csv-engine'

/**
 * GET /api/v1/users/csv — Download template
 * Query params: ?type=staff | family
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session

  const url = new URL(req.url)
  const type = (url.searchParams.get('template') || url.searchParams.get('type') || 'staff').toLowerCase()

  if (type === 'parent') {
    const content = UserCsvEngine.getParentTemplate()
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="preone_parent_template.csv"',
      },
    })
  }

  if (type === 'guardian') {
    const content = UserCsvEngine.getGuardianTemplate()
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="preone_guardian_template.csv"',
      },
    })
  }

  if (type === 'family') {
    const content = UserCsvEngine.getFamilyTemplate()
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="preone_family_template.csv"',
      },
    })
  }

  const content = UserCsvEngine.getStaffTemplate()
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="preone_staff_template.csv"',
    },
  })
}

function rowsToCsv(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escapeVal = (v: any) => {
    const s = String(v ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  return [
    headers.map(escapeVal).join(','),
    ...rows.map((r) => headers.map((h) => escapeVal(r[h])).join(',')),
  ].join('\n')
}

/**
 * POST /api/v1/users/csv — Two-stage CSV preview and execution for Staff and Family
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json()
    const { action = 'preview', type: inputType, csv, previewRows } = body

    const effectiveRoles = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isInstitutionWide = effectiveRoles.some((r) =>
      ['OWNER', 'PRINCIPAL', 'PLATFORM_ADMIN'].includes(r)
    )
    const actorBranchId = isInstitutionWide ? null : session.branchId

    // Auto-detect template type if not explicitly set
    let templateType: 'STAFF' | 'FAMILY' =
      inputType?.toUpperCase() === 'FAMILY' || inputType?.toUpperCase() === 'PARENT' ? 'FAMILY' : 'STAFF'

    if (!inputType && typeof csv === 'string') {
      if (
        csv.includes('studentAdmissionNo') ||
        csv.includes('childFirstName') ||
        csv.includes('childDOB') ||
        csv.includes('relationship')
      ) {
        templateType = 'FAMILY'
      }
    }

    if (action === 'preview' || action === 'validate') {
      let rawCsv = typeof csv === 'string' ? csv : ''
      if (!rawCsv && Array.isArray(body.rows) && body.rows.length > 0) {
        rawCsv = rowsToCsv(body.rows)
      }

      if (!rawCsv) {
        return bad('Raw CSV content string or rows array is required for preview', 'MISSING_CSV')
      }

      if (templateType === 'FAMILY') {
        const preview = await UserCsvEngine.previewFamilyCsv(session.tenantId, rawCsv, {
          actorBranchId,
          actorRole: session.role,
          actorRoles: session.roles,
        })
        return ok(preview)
      } else {
        const preview = await UserCsvEngine.previewStaffCsv(session.tenantId, rawCsv, {
          mode: body.mode,
          overwrite: body.overwrite,
          actorContext: {
            actorBranchId,
            actorRole: session.role,
            actorRoles: session.roles,
          },
        })
        return ok(preview)
      }
    }

    if (action === 'execute') {
      let rowsToExecute: CsvPreviewRow[] = previewRows

      if (!rowsToExecute && typeof csv === 'string') {
        const preview =
          templateType === 'FAMILY'
            ? await UserCsvEngine.previewFamilyCsv(session.tenantId, csv, {
                actorBranchId,
                actorRole: session.role,
                actorRoles: session.roles,
              })
            : await UserCsvEngine.previewStaffCsv(session.tenantId, csv, {
                mode: body.mode,
                overwrite: body.overwrite,
                actorContext: {
                  actorBranchId,
                  actorRole: session.role,
                  actorRoles: session.roles,
                },
              })
        rowsToExecute = preview.rows
      }

      if (!rowsToExecute && Array.isArray(body.rows) && body.rows.length > 0) {
        const rawCsv = rowsToCsv(body.rows)
        const preview =
          templateType === 'FAMILY'
            ? await UserCsvEngine.previewFamilyCsv(session.tenantId, rawCsv, {
                actorBranchId,
                actorRole: session.role,
                actorRoles: session.roles,
              })
            : await UserCsvEngine.previewStaffCsv(session.tenantId, rawCsv, {
                mode: body.mode,
                overwrite: body.overwrite,
                actorContext: {
                  actorBranchId,
                  actorRole: session.role,
                  actorRoles: session.roles,
                },
              })
        rowsToExecute = preview.rows
      }

      if (!rowsToExecute || !Array.isArray(rowsToExecute) || rowsToExecute.length === 0) {
        return bad('No validated rows provided for execution', 'EMPTY_ROWS')
      }

      const atomicAllOrNothing = Boolean((body as any)?.atomicAllOrNothing || (body as any)?.mode === 'atomic')
      const isAsync = body.async === true || (body.async !== false && !atomicAllOrNothing && rowsToExecute.length > 25)

      if (isAsync) {
        const { enqueueJob } = await import('@/lib/jobs')
        const job = await enqueueJob({
          tenantId: session.tenantId,
          jobType: 'CSV_IMPORT',
          createdById: session.uid,
          payload: {
            templateType,
            rows: rowsToExecute,
            options: {
              atomicAllOrNothing,
              mode: body.mode,
              chunkSize: body.chunkSize || 15,
            },
            actor: {
              id: session.uid,
              name: session.name,
              role: session.role,
              roles: session.roles,
              branchId: session.branchId,
            },
          },
        })

        return NextResponse.json(
          {
            success: true,
            async: true,
            jobId: job.id,
            status: job.status,
            progress: 0,
            total: rowsToExecute.length,
            message: `CSV import enqueued as background job (${rowsToExecute.length} rows)`,
            data: {
              async: true,
              jobId: job.id,
              status: job.status,
              progress: 0,
              total: rowsToExecute.length,
            },
          },
          { status: 202 }
        )
      }

      if (templateType === 'FAMILY') {
        const result = await UserCsvEngine.executeFamilyImport(
          {
            tenantId: session.tenantId,
            actorId: session.uid,
            actorName: session.name,
            actorRole: session.role,
            actorRoles: session.roles,
            actorBranchId,
          },
          rowsToExecute,
          { atomicAllOrNothing }
        )
        return ok(result)
      } else {
        const result = await UserCsvEngine.executeStaffImport(
          {
            tenantId: session.tenantId,
            actorId: session.uid,
            actorName: session.name,
            actorRole: session.role,
            actorRoles: session.roles,
            actorBranchId,
          },
          rowsToExecute,
          { atomicAllOrNothing, mode: body.mode }
        )
        return ok(result)
      }
    }

    return bad('Action must be "preview" or "execute"', 'INVALID_ACTION')
  } catch (err: any) {
    console.error('[CSV _POST error]', err)
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
