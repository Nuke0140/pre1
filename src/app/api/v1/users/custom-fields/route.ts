import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, bad, errAuth } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { recordAudit, getRequestMeta } from '@/lib/audit'
import { ConfigDomain } from '@prisma/client'

export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'BOOLEAN' | 'PHONE' | 'EMAIL'
export type CustomFieldAppliesTo = 'STAFF' | 'FAMILY' | 'BOTH'

export interface CustomFieldDefinition {
  id: string
  name: string
  key: string
  type: CustomFieldType
  appliesTo: CustomFieldAppliesTo
  required?: boolean
  options?: string[] // For DROPDOWN type
  description?: string
  createdAt?: string
}

const CONFIG_KEY = 'userCustomFields'

/**
 * GET /api/v1/users/custom-fields
 * Returns tenant-scoped custom field definitions
 */
export const GET = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:read')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errAuth('Tenant required')

  const url = new URL(req.url)
  const targetScope = url.searchParams.get('appliesTo')?.toUpperCase() // 'STAFF' | 'FAMILY' | 'BOTH'

  const config = await db.schoolConfig.findUnique({
    where: {
      tenantId_domain: {
        tenantId: session.tenantId,
        domain: ConfigDomain.STUDENT_PARENT,
      },
    },
  })

  const data = (config?.data as Record<string, any>) || {}
  let fields: CustomFieldDefinition[] = Array.isArray(data[CONFIG_KEY]) ? data[CONFIG_KEY] : []

  if (targetScope && targetScope !== 'ALL') {
    fields = fields.filter((f) => f.appliesTo === 'BOTH' || f.appliesTo === targetScope)
  }

  return ok({
    fields,
    total: fields.length,
  })
})

/**
 * POST /api/v1/users/custom-fields
 * Creates, updates, or deletes custom field definitions for the tenant
 */
export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errAuth('Tenant required')

  const body = await req.json()
  const { action = 'UPSERT_FIELD', field, fieldId, fields: replaceAllFields } = body

  const existingConfig = await db.schoolConfig.findUnique({
    where: {
      tenantId_domain: {
        tenantId: session.tenantId,
        domain: ConfigDomain.STUDENT_PARENT,
      },
    },
  })

  const currentData: Record<string, any> = (existingConfig?.data as Record<string, any>) || {}
  let currentFields: CustomFieldDefinition[] = Array.isArray(currentData[CONFIG_KEY]) ? [...currentData[CONFIG_KEY]] : []

  if (action === 'REPLACE_ALL') {
    if (!Array.isArray(replaceAllFields)) {
      return bad('Fields array is required for REPLACE_ALL', 'FIELDS_REQUIRED')
    }
    currentFields = replaceAllFields
  } else if (action === 'DELETE_FIELD') {
    if (!fieldId) return bad('fieldId is required to delete custom field', 'FIELD_ID_REQUIRED')
    currentFields = currentFields.filter((f) => f.id !== fieldId && f.key !== fieldId)
  } else {
    // UPSERT_FIELD
    if (!field || !field.name) {
      return bad('Field definition with valid name is required', 'FIELD_NAME_REQUIRED')
    }

    const key = (field.key || field.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')

    if (!key) {
      return bad('Generated field key is invalid', 'INVALID_FIELD_KEY')
    }

    const newField: CustomFieldDefinition = {
      id: field.id || `cf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: field.name.trim(),
      key,
      type: (['TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'BOOLEAN', 'PHONE', 'EMAIL'].includes(field.type)
        ? field.type
        : 'TEXT') as CustomFieldType,
      appliesTo: (['STAFF', 'FAMILY', 'BOTH'].includes(field.appliesTo) ? field.appliesTo : 'BOTH') as CustomFieldAppliesTo,
      required: Boolean(field.required),
      options: Array.isArray(field.options) ? field.options.map((o: any) => String(o).trim()).filter(Boolean) : undefined,
      description: field.description?.trim() || undefined,
      createdAt: field.createdAt || new Date().toISOString(),
    }

    const idx = currentFields.findIndex((f) => f.id === newField.id || f.key === newField.key)
    if (idx >= 0) {
      currentFields[idx] = newField
    } else {
      currentFields.push(newField)
    }
  }

  currentData[CONFIG_KEY] = currentFields

  await db.schoolConfig.upsert({
    where: {
      tenantId_domain: {
        tenantId: session.tenantId,
        domain: ConfigDomain.STUDENT_PARENT,
      },
    },
    update: {
      data: currentData,
      updatedById: session.userId,
      updatedByName: session.fullName || 'Admin',
    },
    create: {
      tenantId: session.tenantId,
      domain: ConfigDomain.STUDENT_PARENT,
      data: currentData,
      updatedById: session.userId,
      updatedByName: session.fullName || 'Admin',
    },
  })

  const meta = getRequestMeta(req)
  await recordAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    actorName: session.fullName || 'Admin',
    actorRole: session.role,
    action: 'CUSTOM_FIELDS_UPDATED',
    entity: 'SchoolConfig',
    module: 'USERS',
    summary: `Updated custom fields definition (${currentFields.length} active fields)`,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    newValues: { fieldsCount: currentFields.length },
  })

  return ok({
    success: true,
    fields: currentFields,
    total: currentFields.length,
  })
})
