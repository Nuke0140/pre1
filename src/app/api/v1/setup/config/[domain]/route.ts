import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit } from '@/lib/sequence'
import type { ConfigDomain } from '@prisma/client'

const VALID_DOMAINS: ConfigDomain[] = [
  'OPERATING', 'ADMISSION', 'STUDENT_PARENT', 'FINANCE', 'DAILY_OPERATIONS',
  'HEALTH_SAFETY', 'COMMUNICATION', 'DOCUMENT_TEMPLATES', 'CURRICULUM', 'BRANDING',
]

/** GET /api/v1/setup/config/{domain} — read JSON config (defaults for null) */
async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await requireApi(req, 'settings:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  const { domain } = await params
  if (!VALID_DOMAINS.includes(domain as ConfigDomain)) {
    return Errors.validation(`domain must be one of: ${VALID_DOMAINS.join(', ')}`)
  }

  try {
    const row = await db.schoolConfig.findUnique({
      where: { tenantId_domain: { tenantId: session.tenantId, domain: domain as ConfigDomain } },
    })
    return ok({ domain, data: row?.data ?? null, updatedAt: row?.updatedAt ?? null, updatedByName: row?.updatedByName ?? null })
  } catch (e) {
    return Errors.system(e)
  }
}

/** PUT /api/v1/setup/config/{domain} — upsert JSON config (single source of truth for that domain) */
async function _PUT(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const session = await requireApi(req, 'settings:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')
  const { domain } = await params
  if (!VALID_DOMAINS.includes(domain as ConfigDomain)) {
    return Errors.validation(`domain must be one of: ${VALID_DOMAINS.join(', ')}`)
  }

  try {
    const body = await req.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return Errors.validation('config body must be a JSON object')
    }
    const before = await db.schoolConfig.findUnique({
      where: { tenantId_domain: { tenantId: session.tenantId, domain: domain as ConfigDomain } },
    })
    const row = await db.schoolConfig.upsert({
      where: { tenantId_domain: { tenantId: session.tenantId, domain: domain as ConfigDomain } },
      create: {
        tenantId: session.tenantId,
        domain: domain as ConfigDomain,
        data: body,
        updatedById: session.uid,
        updatedByName: session.name,
      },
      update: {
        data: body,
        updatedById: session.uid,
        updatedByName: session.name,
      },
    })
    await audit({
      tenantId: session.tenantId, actorId: session.uid, actorName: session.name,
      action: 'SETUP_CONFIG_UPDATE', entity: 'SchoolConfig', entityId: `${session.tenantId}:${domain}`,
      summary: `Updated ${domain} configuration${before ? ' (edited existing)' : ' (first configuration)'}`,
    })
    return ok({ domain: row.domain, data: row.data, updatedAt: row.updatedAt })
  } catch (e) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const PUT = withApi(_PUT)
