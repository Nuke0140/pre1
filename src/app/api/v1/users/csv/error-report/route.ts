import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { withApi, errValidation } from '@/lib/api'
import { sanitizeCsvCell } from '@/lib/csv-error'

export interface CsvValidationError {
  rowNumber?: number
  identifier?: string
  field?: string
  currentValue?: string
  requestedValue?: string
  errorCode?: string
  errorMessage?: string
}

/**
 * GET /api/v1/users/csv/error-report?jobId=[id] — download CSV error report for a background job
 */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errValidation('Tenant required', 'tenantId')

  const url = new URL(req.url)
  const jobId = url.searchParams.get('jobId')

  if (!jobId) {
    throw errValidation('jobId query parameter is required', 'jobId')
  }

  const { getJob } = await import('@/lib/jobs')
  const job = await getJob(jobId, session.tenantId)
  if (!job) {
    return new NextResponse('Job not found or access denied', { status: 404 })
  }

  const jobResult = (job.result as any) || {}
  const errors: CsvValidationError[] = Array.isArray(jobResult.errors)
    ? jobResult.errors.map((e: any) => ({
        rowNumber: e.rowNumber,
        identifier: e.identifier,
        field: e.field || '',
        currentValue: e.currentValue || '',
        requestedValue: e.requestedValue || '',
        errorCode: e.code || e.errorCode || 'IMPORT_ROW_ERROR',
        errorMessage: e.message || e.errorMessage || 'Validation or processing error',
      }))
    : []

  const headers = [
    'Row Number',
    'Identifier',
    'Field',
    'Current Value',
    'Requested Value',
    'Error Code',
    'Error Message',
  ]

  const rows = errors.map((e) => [
    sanitizeCsvCell(e.rowNumber || ''),
    sanitizeCsvCell(e.identifier || ''),
    sanitizeCsvCell(e.field || ''),
    sanitizeCsvCell(e.currentValue || ''),
    sanitizeCsvCell(e.requestedValue || ''),
    sanitizeCsvCell(e.errorCode || ''),
    sanitizeCsvCell(e.errorMessage || ''),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n')

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="users_import_errors_${jobId}.csv"`,
    },
  })
}, { module: 'users' })

/**
 * POST /api/v1/users/csv/error-report — generate downloadable CSV error report from payload
 * Protected with spreadsheet formula injection sanitization.
 */
export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session

  const body = await req.json()
  const { errors } = body as { errors: CsvValidationError[] }

  if (!errors || !Array.isArray(errors)) {
    throw errValidation('Errors array is required', 'errors')
  }

  const headers = [
    'Row Number',
    'Identifier',
    'Field',
    'Current Value',
    'Requested Value',
    'Error Code',
    'Error Message',
  ]

  const rows = errors.map((e) => [
    sanitizeCsvCell(e.rowNumber || ''),
    sanitizeCsvCell(e.identifier || ''),
    sanitizeCsvCell(e.field || ''),
    sanitizeCsvCell(e.currentValue || ''),
    sanitizeCsvCell(e.requestedValue || ''),
    sanitizeCsvCell(e.errorCode || ''),
    sanitizeCsvCell(e.errorMessage || ''),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n')

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="users_import_validation_errors.csv"',
    },
  })
}, { module: 'users' })
