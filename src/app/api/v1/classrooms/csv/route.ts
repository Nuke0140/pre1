import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { ok, bad, serverError } from '@/lib/api'
import { requireApi, isResponse, getAuthorizedBranchIds } from '@/lib/auth-api'
import { ClassroomsImportService } from '@/lib/importers/classrooms-import-service'

/**
 * GET /api/v1/classrooms/csv — Download template
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session

  const content = ClassroomsImportService.getClassroomsTemplate()
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="preone_classrooms_template.csv"',
    },
  })
}

/**
 * POST /api/v1/classrooms/csv — Two-stage preview & execution
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return bad('Tenant required', 'TENANT_REQUIRED')

  try {
    const body = await req.json()
    const { action = 'preview', csv, rows, previewRows, duplicatePolicy = 'SKIP', atomic = false } = body
    const authorizedBranches = await getAuthorizedBranchIds(session)

    if (action === 'preview' || action === 'validate') {
      const dataInput = typeof csv === 'string' && csv.trim() ? csv : Array.isArray(rows) ? rows : []
      if (!dataInput || (typeof dataInput === 'string' && !dataInput.trim()) || (Array.isArray(dataInput) && dataInput.length === 0)) {
        return bad('No CSV content or rows provided for preview', 'MISSING_DATA')
      }

      const preview = await ClassroomsImportService.preview(session.tenantId, dataInput, { duplicatePolicy })
      if (authorizedBranches !== 'ALL') {
        for (const r of preview.rows) {
          const rowBranch = r.data?.branchId
          if (rowBranch && !authorizedBranches.includes(rowBranch)) {
            r.status = 'BLOCKED'
            r.action = 'BLOCK'
            r.errors.push(`Unauthorized branch ID: ${rowBranch}`)
          }
        }
        preview.blockedCount = preview.rows.filter(r => r.status === 'BLOCKED').length
        preview.validCount = preview.rows.filter(r => r.status === 'VALID').length
      }
      return ok(preview)
    }

    if (action === 'execute') {
      let rowsToExecute = previewRows
      if (!rowsToExecute && (typeof csv === 'string' || Array.isArray(rows))) {
        const preview = await ClassroomsImportService.preview(session.tenantId, csv || rows, { duplicatePolicy })
        rowsToExecute = preview.rows
      }

      if (!rowsToExecute || !Array.isArray(rowsToExecute) || rowsToExecute.length === 0) {
        return bad('No validated rows provided for execution', 'EMPTY_ROWS')
      }

      if (authorizedBranches !== 'ALL') {
        for (const row of rowsToExecute) {
          const rowBranch = row.data?.branchId
          if (rowBranch && !authorizedBranches.includes(rowBranch)) {
            return bad(`Unauthorized branch assignment in import row: ${rowBranch}`, 'FORBIDDEN_BRANCH')
          }
        }
      }

      const result = await ClassroomsImportService.execute(
        {
          tenantId: session.tenantId,
          actorId: session.uid,
          actorName: session.name,
          actorRole: session.role,
        },
        rowsToExecute,
        { atomic }
      )

      return ok(result)
    }

    return bad('Action must be "preview" or "execute"', 'INVALID_ACTION')
  } catch (err: any) {
    console.error('[/api/v1/classrooms/csv error]', err)
    return serverError(err.message)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
