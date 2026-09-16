import { NextRequest, NextResponse } from 'next/server'
import { requireApi, isResponse } from '@/lib/auth-api'
import { bad } from '@/lib/api'
import { CsvValidationError } from '../route'

/**
 * POST /api/v1/users/csv/error-report — generate downloadable CSV error report
 */
export async function POST(req: NextRequest) {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session

  try {
    const body = await req.json()
    const { errors } = body as { errors: CsvValidationError[] }

    if (!errors || !Array.isArray(errors)) {
      return bad('Errors array is required', 'INVALID_PAYLOAD')
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
      String(e.rowNumber || ''),
      e.identifier || '',
      e.field || '',
      e.currentValue || '',
      e.requestedValue || '',
      e.errorCode || '',
      e.errorMessage || '',
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
  } catch (err: any) {
    return bad('Failed to generate error report: ' + err.message)
  }
}
