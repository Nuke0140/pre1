import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { resolveAuthorizedBranchScope } from '@/lib/admissions/branch-context'
import { db } from '@/lib/db'
import { audit } from '@/lib/sequence'
import { raiseFollowUp } from '@/lib/followups'

/**
 * GET /api/v1/admissions/communications
 * Lists communication history records for a given leadId or applicationId with tenant & branch scoping.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'admissions:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const leadId = sp.get('leadId')
    const applicationId = sp.get('applicationId')
    const requestedBranchId = sp.get('branchId')

    if (!leadId && !applicationId) {
      return Errors.validation('Either leadId or applicationId query parameter is required')
    }

    // Authoritative branch scoping
    const branchScope = await resolveAuthorizedBranchScope(session, requestedBranchId)
    if (branchScope.mode === 'NO_BRANCH_ACCESS') {
      return Errors.forbidden('No authorized branch access for active user')
    }

    const where: any = {
      tenantId: branchScope.tenantId,
      ...(leadId ? { leadId } : {}),
      ...(applicationId ? { applicationId } : {}),
    }

    if (branchScope.mode === 'SINGLE_BRANCH') {
      where.OR = [
        { branchId: branchScope.selectedBranchId },
        { branchId: null },
      ]
    } else {
      where.OR = [
        { branchId: { in: branchScope.authorizedBranchIds } },
        { branchId: null },
      ]
    }

    const records = await db.admissionCommunication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return ok(records)
  } catch (e: any) {
    return Errors.system(e)
  }
}

/**
 * POST /api/v1/admissions/communications
 * Creates a confirmed staff communication record (Call log or WhatsApp preparation).
 */
async function _POST(req: NextRequest) {
  const session = await requireApi(req, 'admissions:write')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const body = await req.json()
    const {
      leadId,
      applicationId,
      channel, // 'CALL' | 'WHATSAPP'
      interactionType, // 'CALL_LOGGED' | 'CALL_INITIATED' | 'WHATSAPP_PREPARED'
      callOutcome, // 'CONNECTED' | 'NO_ANSWER' | 'BUSY' | 'CALL_BACK_REQUESTED' | 'WRONG_NUMBER' | 'OTHER'
      notes,
      parentName,
      phone,
      followUpDate,
      callDate,
      createReminderTask,
    } = body

    if (!channel || (channel !== 'CALL' && channel !== 'WHATSAPP')) {
      return Errors.validation('Valid channel (CALL or WHATSAPP) is required')
    }

    if (!interactionType) {
      return Errors.validation('interactionType is required')
    }

    if (interactionType === 'CALL_LOGGED' && !callOutcome) {
      return Errors.validation('callOutcome is required when saving a call log')
    }

    if (!leadId && !applicationId) {
      return Errors.validation('leadId or applicationId is required')
    }

    // Verify ownership & tenant isolation
    let resolvedBranchId: string | null = null
    let targetLead: any = null
    let targetApp: any = null

    if (leadId) {
      targetLead = await db.lead.findFirst({
        where: { id: leadId, tenantId: session.tenantId, deletedAt: null },
      })
      if (!targetLead) {
        return Errors.notFound('Admission Lead not found in active tenant')
      }
      resolvedBranchId = targetLead.branchId
    }

    if (applicationId) {
      targetApp = await db.admissionApplication.findFirst({
        where: { id: applicationId, tenantId: session.tenantId, deletedAt: null },
      })
      if (!targetApp) {
        return Errors.notFound('Admission Application not found in active tenant')
      }
      resolvedBranchId = targetApp.branchId || resolvedBranchId
    }

    // Enforce branch scope authorization
    const branchScope = await resolveAuthorizedBranchScope(session, resolvedBranchId || undefined)
    if (branchScope.mode === 'NO_BRANCH_ACCESS') {
      return Errors.forbidden('No permission to log communication for this branch')
    }

    if (
      branchScope.mode === 'SINGLE_BRANCH' &&
      resolvedBranchId &&
      resolvedBranchId !== branchScope.selectedBranchId
    ) {
      return Errors.forbidden('Branch mismatch: user not authorized for this campus')
    }

    // Sanitize string inputs
    const cleanNotes = notes && typeof notes === 'string' ? notes.trim().slice(0, 1500) : null
    const cleanParent = parentName && typeof parentName === 'string' ? parentName.trim().slice(0, 120) : (targetLead?.parentName || targetApp?.parentName || null)
    const cleanPhone = phone && typeof phone === 'string' ? phone.trim().slice(0, 20) : (targetLead?.phone || targetApp?.parentPhone || null)

    const parsedFollowUp = followUpDate ? new Date(followUpDate) : null
    const parsedCreatedAt = callDate ? new Date(callDate) : new Date()

    // Create communication record atomically
    const record = await db.admissionCommunication.create({
      data: {
        tenantId: session.tenantId,
        branchId: resolvedBranchId,
        leadId: leadId || null,
        applicationId: applicationId || null,
        channel,
        interactionType,
        callOutcome: callOutcome || null,
        notes: cleanNotes,
        parentName: cleanParent,
        phone: cleanPhone,
        followUpDate: parsedFollowUp && !isNaN(parsedFollowUp.getTime()) ? parsedFollowUp : null,
        createdById: session.uid,
        createdByName: session.name || 'Staff Counselor',
        createdAt: !isNaN(parsedCreatedAt.getTime()) ? parsedCreatedAt : new Date(),
      },
    })

    // Update Lead.nextFollowUpAt if followUpDate was supplied
    if (leadId && parsedFollowUp && !isNaN(parsedFollowUp.getTime())) {
      await db.lead.update({
        where: { id: leadId },
        data: {
          nextFollowUpAt: parsedFollowUp,
          ...(targetLead.status === 'NEW' ? { status: 'CONTACTED' } : {}),
        },
      }).catch(() => {})
    }

    // Optionally create a structured FollowUp reminder task if requested or outcome is CALL_BACK_REQUESTED
    if (parsedFollowUp && !isNaN(parsedFollowUp.getTime()) && (createReminderTask || callOutcome === 'CALL_BACK_REQUESTED')) {
      await raiseFollowUp({
        tenantId: session.tenantId,
        branchId: resolvedBranchId || undefined,
        domain: 'ADMISSION',
        severity: 'INFO',
        title: `Call Back: ${cleanParent || 'Parent'} (${cleanPhone || ''})`,
        detail: cleanNotes || `Call log outcome: ${callOutcome}. Follow-up scheduled.`,
        sourceType: 'AdmissionCommunication',
        sourceId: record.id,
        dedupeKey: `comm-fu:${record.id}:${parsedFollowUp.getTime()}`,
        dueAt: parsedFollowUp,
        actorId: session.uid,
        actorName: session.name || 'Staff Counselor',
      }).catch(() => {})
    }

    // Audit log entry
    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name || 'Staff Counselor',
      action: 'COMMUNICATION_LOGGED',
      entity: 'AdmissionCommunication',
      entityId: record.id,
      summary: `Logged ${channel} communication (${interactionType}) with ${cleanParent || 'Parent'}. Outcome: ${callOutcome || 'N/A'}`,
    })

    return ok(record, undefined, 201)
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
export const POST = withApi(_POST)
