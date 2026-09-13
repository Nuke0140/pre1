import { db } from './db'
import { NextRequest } from 'next/server'

export interface AuditEntry {
  tenantId?: string | null
  branchId?: string | null
  academicSessionId?: string | null
  actorId?: string | null
  actorName?: string | null
  actorRole?: string | null
  action: string
  entity: string
  entityId?: string | null
  module?: string | null
  summary?: string
  severity?: 'INFO' | 'WARNING' | 'CRITICAL'
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
  oldValues?: any
  newValues?: any
}

export function getRequestMeta(req?: NextRequest | null): { ipAddress?: string; userAgent?: string } {
  if (!req) return {}
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             undefined
  const ua = req.headers.get('user-agent') || undefined
  return { ipAddress: ip, userAgent: ua }
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        tenantId: entry.tenantId ?? undefined,
        branchId: entry.branchId ?? undefined,
        academicSessionId: entry.academicSessionId ?? undefined,
        actorId: entry.actorId ?? undefined,
        actorName: entry.actorName ?? undefined,
        actorRole: entry.actorRole ?? undefined,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? undefined,
        module: entry.module ?? undefined,
        summary: entry.summary,
        severity: entry.severity || 'INFO',
        ipAddress: entry.ipAddress ?? undefined,
        userAgent: entry.userAgent ?? undefined,
        requestId: entry.requestId ?? undefined,
        oldValues: entry.oldValues ?? undefined,
        newValues: entry.newValues ?? undefined,
      },
    })
  } catch (err) {
    console.error('[audit] Failed to record audit log:', err)
  }
}

export const audit = recordAudit
