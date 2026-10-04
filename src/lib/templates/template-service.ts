/**
 * PreOne — Template Service
 * Core business engine for managing, versioning, publishing and rendering document templates.
 * Enforces multi-tenant isolation, safe JSON structure, and audit logging.
 */

import { db } from '@/lib/db'
import {
  DocumentType,
  PageFormat,
  TemplateDefinition,
  TemplateElement,
  PAGE_DIMENSIONS,
  DOCUMENT_TYPE_CONFIG,
} from './types'
import { TEMPLATE_PRESETS } from './presets'
import { resolveTokens, getDefaultSampleData } from './field-registry'
import { AuditService } from '@/lib/audit/audit-service'

export interface CreateTemplateInput {
  name: string
  type: DocumentType
  presetKey?: DocumentType | 'BLANK'
  format?: PageFormat
  createdByName?: string
  actorId?: string
}

export interface UpdateTemplateInput {
  name?: string
  type?: DocumentType
  isDefault?: boolean
  definition?: Partial<TemplateDefinition>
  updatedByName?: string
  actorId?: string
}

export class TemplateService {
  /**
   * List templates for a tenant with optional filtering by type, status, and search query.
   */
  static async listTemplates(
    tenantId: string,
    filters: {
      type?: string
      status?: string
      search?: string
      page?: number
      limit?: number
    } = {}
  ) {
    const page = Math.max(1, filters.page ?? 1)
    const limit = Math.max(1, Math.min(100, filters.limit ?? 50))
    const skip = (page - 1) * limit

    const whereClause: any = { tenantId }

    if (filters.type && filters.type !== 'ALL') {
      whereClause.type = filters.type
    }

    if (filters.search && filters.search.trim()) {
      whereClause.name = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      }
    }

    const [total, rows] = await Promise.all([
      db.documentTemplate.count({ where: whereClause }),
      db.documentTemplate.findMany({
        where: whereClause,
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
    ])

    // Parse and filter by status in JSON content if provided
    let items = rows.map((r) => {
      const def = (r.content as unknown as TemplateDefinition) || {}
      return {
        id: r.id,
        tenantId: r.tenantId,
        type: r.type as DocumentType,
        name: r.name,
        isDefault: r.isDefault,
        version: def.version || 1,
        status: def.status || 'DRAFT',
        pageSize: def.pageSize || 'A4_PORTRAIT',
        orientation: def.orientation || 'portrait',
        elementsCount: Array.isArray(def.elements) ? def.elements.length : 0,
        publishedAt: def.publishedAt || null,
        publishedBy: def.publishedBy || null,
        updatedAt: r.updatedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
        definition: def,
      }
    })

    if (filters.status && filters.status !== 'ALL') {
      items = items.filter((it) => it.status === filters.status)
    }

    return {
      items,
      total: filters.status && filters.status !== 'ALL' ? items.length : total,
      page,
      limit,
    }
  }

  /**
   * Get template by ID with tenant isolation.
   */
  static async getTemplateById(tenantId: string, id: string) {
    const row = await db.documentTemplate.findFirst({
      where: { id, tenantId },
    })

    if (!row) return null

    const def = row.content as unknown as TemplateDefinition

    return {
      id: row.id,
      tenantId: row.tenantId,
      type: row.type as DocumentType,
      name: row.name,
      isDefault: row.isDefault,
      definition: def,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  /**
   * Create a new template (either from a preschool starter preset or blank canvas).
   */
  static async createTemplate(tenantId: string, input: CreateTemplateInput) {
    const trimmedName = input.name.trim()
    if (!trimmedName) throw new Error('Template name is required')

    // Check unique name per tenant and type
    const existing = await db.documentTemplate.findFirst({
      where: {
        tenantId,
        type: input.type,
        name: trimmedName,
      },
    })

    let finalName = trimmedName
    if (existing) {
      finalName = `${trimmedName} (${new Date().toLocaleDateString('en-GB')})`
    }

    let definition: TemplateDefinition

    if (input.presetKey && input.presetKey !== 'BLANK' && TEMPLATE_PRESETS[input.presetKey as DocumentType]) {
      const preset = TEMPLATE_PRESETS[input.presetKey as DocumentType]
      definition = JSON.parse(JSON.stringify(preset.definition))
      definition.status = 'DRAFT'
      definition.version = 1
    } else {
      const format = input.format || DOCUMENT_TYPE_CONFIG[input.type]?.defaultFormat || 'A4_PORTRAIT'
      const dim = PAGE_DIMENSIONS[format] || PAGE_DIMENSIONS.A4_PORTRAIT
      definition = {
        version: 1,
        status: 'DRAFT',
        documentType: input.type,
        pageSize: format,
        orientation: dim.orientation,
        widthMm: dim.widthMm,
        heightMm: dim.heightMm,
        backgroundColor: '#FFFFFF',
        marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
        elements: [
          {
            id: 'elem-header',
            type: 'bound-text',
            name: 'School Header',
            x: 10,
            y: 10,
            width: dim.widthMm - 20,
            height: 12,
            zIndex: 1,
            content: '{{school.name}}',
            fieldBinding: 'school.name',
            styles: {
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1E1B4B',
              textAlign: 'center',
            },
          },
        ],
      }
    }

    // Check if this is the first template of its type for the tenant; if so, make default
    const countForType = await db.documentTemplate.count({
      where: { tenantId, type: input.type },
    })

    const record = await db.documentTemplate.create({
      data: {
        tenantId,
        type: input.type,
        name: finalName,
        isDefault: countForType === 0,
        content: definition as any,
      },
    })

    // Automatically sync with setup DOCUMENT_TEMPLATES config so Step 15 completes
    await this.syncSetupConfig(tenantId, input.type)

    // Audit log
    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT', // audit action
      entity: 'DocumentTemplate',
      entityId: record.id,
      module: 'SETTINGS',
      actorId: input.actorId || 'system',
      actorName: input.createdByName || 'System',
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Created template "${record.name}" for ${record.type}`,
      severity: 'INFO',
    }).catch(() => {})

    return record
  }

  /**
   * Update template elements, dimensions, or metadata.
   */
  static async updateTemplate(
    tenantId: string,
    id: string,
    input: UpdateTemplateInput
  ) {
    const existing = await db.documentTemplate.findFirst({
      where: { id, tenantId },
    })

    if (!existing) throw new Error('Template not found')

    const currentDef = existing.content as unknown as TemplateDefinition
    const mergedDef: TemplateDefinition = {
      ...currentDef,
      ...(input.definition || {}),
    }

    // If setting as default, unset others of same type
    if (input.isDefault) {
      await db.documentTemplate.updateMany({
        where: {
          tenantId,
          type: existing.type,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    const updated = await db.documentTemplate.update({
      where: { id },
      data: {
        name: input.name ? input.name.trim() : existing.name,
        type: input.type || existing.type,
        isDefault: input.isDefault !== undefined ? input.isDefault : existing.isDefault,
        content: mergedDef as any,
      },
    })

    return updated
  }

  /**
   * Publish an immutable template version.
   */
  static async publishTemplate(
    tenantId: string,
    id: string,
    publishedByName: string,
    actorId?: string
  ) {
    const existing = await db.documentTemplate.findFirst({
      where: { id, tenantId },
    })

    if (!existing) throw new Error('Template not found')

    const currentDef = existing.content as unknown as TemplateDefinition
    if (!currentDef.elements || currentDef.elements.length === 0) {
      throw new Error('Cannot publish an empty template. Please add at least one element.')
    }

    const nextVersion = (currentDef.version || 1) + 1
    const publishedDef: TemplateDefinition = {
      ...currentDef,
      version: nextVersion,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      publishedBy: publishedByName,
    }

    const updated = await db.documentTemplate.update({
      where: { id },
      data: {
        content: publishedDef as any,
      },
    })

    // Sync with setup config
    await this.syncSetupConfig(tenantId, existing.type)

    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'DocumentTemplate',
      entityId: id,
      module: 'SETTINGS',
      actorId: actorId || 'system',
      actorName: publishedByName,
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Published template "${existing.name}" (version ${nextVersion})`,
      severity: 'INFO',
    }).catch(() => {})

    return updated
  }

  /**
   * Duplicate an existing template into a new editable draft.
   */
  static async duplicateTemplate(
    tenantId: string,
    id: string,
    actorName?: string,
    actorId?: string
  ) {
    const existing = await db.documentTemplate.findFirst({
      where: { id, tenantId },
    })

    if (!existing) throw new Error('Template not found')

    const originalDef = existing.content as unknown as TemplateDefinition
    const clonedDef: TemplateDefinition = {
      ...JSON.parse(JSON.stringify(originalDef)),
      version: 1,
      status: 'DRAFT',
      publishedAt: undefined,
      publishedBy: undefined,
    }

    const newName = `${existing.name} (Copy)`

    const duplicated = await db.documentTemplate.create({
      data: {
        tenantId,
        type: existing.type,
        name: newName,
        isDefault: false,
        content: clonedDef as any,
      },
    })

    return duplicated
  }

  /**
   * Archive a template (soft delete).
   */
  static async archiveTemplate(tenantId: string, id: string) {
    const existing = await db.documentTemplate.findFirst({
      where: { id, tenantId },
    })

    if (!existing) throw new Error('Template not found')

    const currentDef = existing.content as unknown as TemplateDefinition
    const archivedDef: TemplateDefinition = {
      ...currentDef,
      status: 'ARCHIVED',
    }

    return await db.documentTemplate.update({
      where: { id },
      data: {
        isDefault: false,
        content: archivedDef as any,
      },
    })
  }

  /**
   * Delete a template permanently. Safeguard: cannot delete default active templates.
   */
  static async deleteTemplate(tenantId: string, id: string) {
    const existing = await db.documentTemplate.findFirst({
      where: { id, tenantId },
    })

    if (!existing) throw new Error('Template not found')

    if (existing.isDefault) {
      throw new Error(
        'Cannot delete the default active template for this document type. Please set another template as default first.'
      )
    }

    return await db.documentTemplate.delete({
      where: { id },
    })
  }

  /**
   * Synchronize document template types with the SchoolConfig.DOCUMENT_TEMPLATES registry
   * so that Setup Step 15 evaluates as satisfied.
   */
  static async syncSetupConfig(tenantId: string, addedType: string) {
    try {
      const existingConfig = await db.schoolConfig.findUnique({
        where: { tenantId_domain: { tenantId, domain: 'DOCUMENT_TEMPLATES' } },
      })

      const data = (existingConfig?.data as Record<string, any>) || { templates: [] }
      const currentList: string[] = Array.isArray(data.templates) ? data.templates : []

      if (!currentList.includes(addedType)) {
        currentList.push(addedType)
        await db.schoolConfig.upsert({
          where: { tenantId_domain: { tenantId, domain: 'DOCUMENT_TEMPLATES' } },
          create: {
            tenantId,
            domain: 'DOCUMENT_TEMPLATES',
            data: {
              ...data,
              templates: currentList,
              lastSyncedAt: new Date().toISOString(),
            },
          },
          update: {
            data: {
              ...data,
              templates: currentList,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        })
      }
    } catch {
      // Non-blocking sync
    }
  }

  /**
   * Generates a printer-ready HTML document representation with millimeter precision.
   */
  static renderTemplateHtml(
    definition: TemplateDefinition,
    dataContext: Record<string, any> = getDefaultSampleData()
  ): string {
    const width = definition.widthMm || 210
    const height = definition.heightMm || 297
    const bg = definition.backgroundColor || '#ffffff'

    // Sort elements by z-index
    const elements = [...(definition.elements || [])].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))

    const elementsHtml = elements
      .map((el) => {
        const left = el.x
        const top = el.y
        const w = el.width
        const h = el.height
        const s = el.styles || {}

        // CSS styles string
        const styleParts: string[] = [
          `position: absolute;`,
          `left: ${left}mm;`,
          `top: ${top}mm;`,
          `width: ${w}mm;`,
          `height: ${h}mm;`,
          `z-index: ${el.zIndex || 1};`,
          `box-sizing: border-box;`,
        ]

        if (s.fontSize) styleParts.push(`font-size: ${s.fontSize}pt;`)
        if (s.fontWeight) styleParts.push(`font-weight: ${s.fontWeight};`)
        if (s.fontFamily) styleParts.push(`font-family: ${s.fontFamily};`)
        if (s.color) styleParts.push(`color: ${s.color};`)
        if (s.textAlign) styleParts.push(`text-align: ${s.textAlign};`)
        if (s.backgroundColor) styleParts.push(`background-color: ${s.backgroundColor};`)
        if (s.borderColor) styleParts.push(`border-color: ${s.borderColor}; border-style: solid;`)
        if (s.borderWidth !== undefined) styleParts.push(`border-width: ${s.borderWidth}px;`)
        if (s.borderRadius) styleParts.push(`border-radius: ${s.borderRadius}px;`)
        if (s.lineHeight) styleParts.push(`line-height: ${s.lineHeight};`)
        if (s.letterSpacing) styleParts.push(`letter-spacing: ${s.letterSpacing}px;`)
        if (s.textTransform) styleParts.push(`text-transform: ${s.textTransform};`)
        if (s.opacity !== undefined) styleParts.push(`opacity: ${s.opacity};`)

        const styleAttr = `style="${styleParts.join(' ')}"`

        // Render content based on type
        if (el.type === 'text' || el.type === 'bound-text') {
          const resolved = resolveTokens(el.content || '', dataContext)
          const formatted = resolved.replace(/\n/g, '<br/>')
          return `<div class="tmpl-element tmpl-${el.type}" ${styleAttr}>${formatted}</div>`
        }

        if (el.type === 'shape') {
          return `<div class="tmpl-element tmpl-shape" ${styleAttr}></div>`
        }

        if (el.type === 'photo') {
          const photoUrl = resolveTokens(el.content || '', dataContext)
          return `<div class="tmpl-element tmpl-photo" ${styleAttr}>
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f1f5f9; color: #64748b; font-size: 8pt; border: 1px dashed #cbd5e1; border-radius: 4px; overflow: hidden;">
              ${photoUrl && photoUrl !== el.content ? `<img src="${photoUrl}" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span>PHOTO</span>`}
            </div>
          </div>`
        }

        if (el.type === 'qrcode') {
          const qrVal = resolveTokens(el.content || 'https://preone.school/verify', dataContext)
          return `<div class="tmpl-element tmpl-qrcode" ${styleAttr}>
            <div style="width: 100%; height: 100%; border: 1px solid #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; font-size: 6pt; color: #1e293b; padding: 2px;">
              <div style="font-weight: bold; margin-bottom: 2px;">[ QR CODE ]</div>
              <div style="font-size: 5pt; color: #64748b; word-break: break-all; text-align: center;">${qrVal.substring(0, 32)}</div>
            </div>
          </div>`
        }

        if (el.type === 'barcode') {
          const codeVal = resolveTokens(el.content || '12345678', dataContext)
          return `<div class="tmpl-element tmpl-barcode" ${styleAttr}>
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; border: 1px solid #e2e8f0; padding: 2px;">
              <div style="letter-spacing: 3px; font-family: monospace; font-size: 9pt; font-weight: bold;">||| | |||| | |||</div>
              <div style="font-size: 6pt; color: #475569; font-family: monospace;">*${codeVal}*</div>
            </div>
          </div>`
        }

        if (el.type === 'signature') {
          const sigText = resolveTokens(el.content || 'Authorized Signature', dataContext).replace(/\n/g, '<br/>')
          return `<div class="tmpl-element tmpl-signature" ${styleAttr}>
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
              <div style="width: 80%; border-top: 1px solid #94a3b8; margin-bottom: 3px;"></div>
              <div style="font-size: 7pt; color: #475569; text-align: center;">${sigText}</div>
            </div>
          </div>`
        }

        if (el.type === 'table') {
          const cols = s.tableColumns || [
            { key: 'item', label: 'Item / Description', widthPercent: 60, align: 'left' },
            { key: 'amount', label: 'Amount', widthPercent: 40, align: 'right' },
          ]

          const dynamicRows = Array.isArray(dataContext['table.rows']) ? dataContext['table.rows'] : null

          let bodyRowsHtml = ''
          if (dynamicRows && dynamicRows.length > 0) {
            bodyRowsHtml = dynamicRows
              .map(
                (row: any) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  ${cols
                    .map(
                      (c: any) =>
                        `<td style="padding: 4px 6px; text-align: ${c.align}; font-weight: ${
                          c.key === 'rating' || c.key === 'grade' || c.key === 'amount' ? '600' : 'normal'
                        }; color: #334155;">${row[c.key] ?? row[c.key.toLowerCase()] ?? ''}</td>`
                    )
                    .join('')}
                </tr>`
              )
              .join('')
          } else {
            bodyRowsHtml = `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 6px; text-align: left;">Term 1 Tuition & Learning Curriculum</td>
                  <td style="padding: 4px 6px; text-align: left;">Term 1</td>
                  <td style="padding: 4px 6px; text-align: right; font-weight: 600;">₹18,500.00</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 6px; text-align: left;">Organic Nutritious Snack & Meal Plan</td>
                  <td style="padding: 4px 6px; text-align: left;">Term 1</td>
                  <td style="padding: 4px 6px; text-align: right; font-weight: 600;">₹4,000.00</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 6px; text-align: left;">Activity Kit, Phonics Readers & Art Supplies</td>
                  <td style="padding: 4px 6px; text-align: left;">Annual</td>
                  <td style="padding: 4px 6px; text-align: right; font-weight: 600;">₹2,000.00</td>
                </tr>`
          }

          return `<div class="tmpl-element tmpl-table" ${styleAttr}>
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
                  ${cols
                    .map(
                      (c: any) =>
                        `<th style="padding: 4px 6px; text-align: ${c.align}; width: ${c.widthPercent}%; font-weight: 600; color: #334155;">${c.label}</th>`
                    )
                    .join('')}
                </tr>
              </thead>
              <tbody>
                ${bodyRowsHtml}
              </tbody>
            </table>
          </div>`
        }

        return `<div class="tmpl-element" ${styleAttr}></div>`
      })
      .join('\n')

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${definition.documentType} - PreOne Template Studio</title>
  <style>
    @page {
      size: ${width}mm ${height}mm;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: ${width}mm;
      height: ${height}mm;
      position: relative;
      background-color: ${bg};
      margin: 0 auto;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    @media print {
      body {
        background: transparent;
      }
      .page-container {
        box-shadow: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${elementsHtml}
  </div>
</body>
</html>`
  }
}
