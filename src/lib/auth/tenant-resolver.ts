import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export interface ResolvedTenant {
  id: string
  name: string
  code: string
  logoUrl: string | null
  status: string
  campusName: string | null
  branches?: Array<{ id: string; name: string; code: string; isMain: boolean }>
}

/**
 * Extracts a potential tenant subdomain from a hostname.
 * Examples:
 *   - "sunshine.preone.in" -> "sunshine"
 *   - "little-stars.preone.in:3000" -> "little-stars"
 *   - "sunshine.localhost:3000" -> "sunshine"
 *   - "localhost:3000" -> null
 *   - "app.preone.in" -> null
 */
export function extractSubdomainFromHost(rawHost: string | null | undefined): string | null {
  if (!rawHost) return null

  // Strip port
  const hostname = rawHost.split(':')[0].trim().toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  // Handle *.localhost (e.g. sunshine.localhost)
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.')
    return parts.length >= 2 && parts[0] !== 'www' ? parts[0] : null
  }

  // Handle standard domain structures (*.preone.in, *.preone.com)
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    if (sub && sub !== 'www' && sub !== 'app' && sub !== 'admin' && sub !== 'api') {
      return sub
    }
  }

  return null
}

/**
 * Resolves a tenant from a hostname or request headers.
 */
export async function resolveTenantFromHost(rawHost: string | null | undefined): Promise<ResolvedTenant | null> {
  const subdomain = extractSubdomainFromHost(rawHost)
  if (!subdomain) return null

  const tenant = await db.tenant.findFirst({
    where: {
      OR: [
        { code: { equals: subdomain, mode: 'insensitive' } },
        { code: { equals: subdomain.toUpperCase() } },
      ],
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      code: true,
      logoUrl: true,
      status: true,
      branches: {
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, code: true, isMain: true },
      },
    },
  })

  if (!tenant) return null

  const mainBranch = tenant.branches.find((b) => b.isMain) || tenant.branches[0]

  return {
    id: tenant.id,
    name: tenant.name,
    code: tenant.code,
    logoUrl: tenant.logoUrl,
    status: tenant.status,
    campusName: mainBranch?.name || null,
    branches: tenant.branches,
  }
}

/**
 * Resolves a tenant by code or ID directly.
 */
export async function resolveTenantByCodeOrId(codeOrId: string): Promise<ResolvedTenant | null> {
  const clean = codeOrId.trim()
  if (!clean) return null

  const tenant = await db.tenant.findFirst({
    where: {
      OR: [
        { id: clean },
        { code: { equals: clean, mode: 'insensitive' } },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      code: true,
      logoUrl: true,
      status: true,
      branches: {
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, code: true, isMain: true },
      },
    },
  })

  if (!tenant) return null

  const mainBranch = tenant.branches.find((b) => b.isMain) || tenant.branches[0]

  return {
    id: tenant.id,
    name: tenant.name,
    code: tenant.code,
    logoUrl: tenant.logoUrl,
    status: tenant.status,
    campusName: mainBranch?.name || null,
    branches: tenant.branches,
  }
}

/**
 * Canonical helper to resolve tenant context from Request (Host, query, or explicit code/id).
 */
export async function resolveTenantContext(
  req: NextRequest | Request,
  explicitCodeOrId?: string | null
): Promise<ResolvedTenant | null> {
  // 1. Explicit code or ID provided
  if (explicitCodeOrId && explicitCodeOrId.trim()) {
    return resolveTenantByCodeOrId(explicitCodeOrId)
  }

  // 2. Query param ?code= or ?tenant= or ?school= from URL
  try {
    const url = new URL(req.url)
    const param = url.searchParams.get('code') || url.searchParams.get('tenant') || url.searchParams.get('school')
    if (param && param.trim()) {
      return resolveTenantByCodeOrId(param)
    }
  } catch {}

  // 3. Resolve from Host or X-Forwarded-Host header
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    null

  return resolveTenantFromHost(host)
}
