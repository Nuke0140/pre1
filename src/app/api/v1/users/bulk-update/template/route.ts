import { NextRequest, NextResponse } from 'next/server'
import { withApi, bad, errAuth } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { BulkUpdateService } from '@/lib/users/bulk-update-service'

/**
 * POST /api/v1/users/bulk-update/template — Dynamic CSV Template Generator
 * Generates and downloads a .csv file populated with existing user usernames as rows,
 * and header columns for exactly the selected fields.
 */
export const POST = withApi(
  async (req: NextRequest) => {
    const session = await requireApi(req, 'users:read')
    if (isResponse(session)) return session
    if (!session.tenantId) throw errAuth('Tenant context required')

    const body = await req.json()
    const { fields, userType = 'ALL' } = body as {
      fields: string[]
      userType?: 'STAFF' | 'FAMILY' | 'ALL'
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return bad('At least one field must be selected to generate a CSV template', 'FIELDS_REQUIRED')
    }

    try {
      const csvText = await BulkUpdateService.generateDynamicCsvTemplate({
        tenantId: session.tenantId,
        selectedFields: fields,
        userType,
      })

      const filename = `preone-user-bulk-update-template-${Date.now()}.csv`

      return new NextResponse(csvText, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (err: any) {
      return bad(err.message || 'Failed to generate template', 'TEMPLATE_GEN_FAILED')
    }
  },
  { module: 'users', permission: 'users:read' }
)
