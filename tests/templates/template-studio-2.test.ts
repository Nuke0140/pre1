/**
 * PreOne — Template Studio 2.0 Test Suite (PRE1-TEMPLATE-STUDIO-002)
 * Validates:
 *  1. Smart Canonical Field Catalog (Domains, Data Types, Alias Tags)
 *  2. Search Engine with Alias Matching (searchApprovedFields)
 *  3. Safe Token Injection & Fallback Handling
 *  4. Page Dimensions & Geometric Integrity (CR80, A4, Thermal)
 *  5. Multi-Tenant Quarantine & Publishing Lifecycle
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import {
  APPROVED_TEMPLATE_FIELDS,
  FIELD_DOMAINS,
  FieldDefinition,
  searchApprovedFields,
  resolveTokens,
  getDefaultSampleData,
} from '@/lib/templates/field-registry'
import {
  PAGE_DIMENSIONS,
  DOCUMENT_TYPE_CONFIG,
  TemplateDefinition,
  TemplateElement,
} from '@/lib/templates/types'
import { TemplateService } from '@/lib/templates/template-service'

describe('PreOne Template Studio 2.0 — Smart Data Binding & Document Builder Suite', () => {
  let tenantId: string
  let templateId: string

  beforeAll(async () => {
    const tenant = await db.tenant.create({
      data: {
        name: 'Studio 2.0 Test Academy',
        code: `TS2-${Date.now().toString().slice(-6)}`,
        city: 'Bengaluru',
      },
    })
    tenantId = tenant.id
  })

  afterAll(async () => {
    if (templateId) {
      await db.documentTemplate.deleteMany({ where: { id: templateId } }).catch(() => {})
    }
    if (tenantId) {
      await db.tenant.deleteMany({ where: { id: tenantId } }).catch(() => {})
    }
  })

  describe('1. Smart Canonical Field Registry & Domain Structure', () => {
    it('registers all 9 core preschool domains', () => {
      const domainKeys = FIELD_DOMAINS.map((d) => d.key)
      expect(domainKeys).toContain('SCHOOL')
      expect(domainKeys).toContain('STUDENT')
      expect(domainKeys).toContain('GUARDIAN')
      expect(domainKeys).toContain('CLASSROOM')
      expect(domainKeys).toContain('FINANCE')
      expect(domainKeys).toContain('STAFF')
      expect(domainKeys).toContain('TRANSPORT')
      expect(domainKeys).toContain('ATTENDANCE')
      expect(domainKeys).toContain('SYSTEM')
    })

    it('contains comprehensive student identity and safety fields', () => {
      const studentFields = APPROVED_TEMPLATE_FIELDS.filter((f) => f.domain === 'STUDENT')
      const keys = studentFields.map((f) => f.key)

      expect(keys).toContain('student.fullName')
      expect(keys).toContain('student.admissionNumber')
      expect(keys).toContain('student.dob')
      expect(keys).toContain('student.gender')
      expect(keys).toContain('student.bloodGroup')
      expect(keys).toContain('student.photoUrl')
      expect(keys).toContain('student.emergencyPhone')
      expect(keys).toContain('student.address')
    })

    it('contains transport & bus route fields for smart bus cards', () => {
      const transportFields = APPROVED_TEMPLATE_FIELDS.filter((f) => f.domain === 'TRANSPORT')
      const keys = transportFields.map((f) => f.key)

      expect(keys).toContain('transport.routeName')
      expect(keys).toContain('transport.vehicleNumber')
      expect(keys).toContain('transport.driverName')
      expect(keys).toContain('transport.driverPhone')
      expect(keys).toContain('transport.pickupStop')
    })

    it('contains attendance rate fields for report cards and evaluations', () => {
      const attendanceFields = APPROVED_TEMPLATE_FIELDS.filter((f) => f.domain === 'ATTENDANCE')
      const keys = attendanceFields.map((f) => f.key)

      expect(keys).toContain('attendance.percentage')
      expect(keys).toContain('attendance.presentDays')
      expect(keys).toContain('attendance.totalDays')
    })

    it('ensures every approved field has a non-empty sample value for preview mode', () => {
      for (const field of APPROVED_TEMPLATE_FIELDS) {
        expect(field.sampleValue).toBeDefined()
        expect(field.sampleValue.length).toBeGreaterThan(0)
      }
    })
  })

  describe('2. Search Engine with Tag & Alias Matching', () => {
    it('finds fields by friendly display label', () => {
      const results = searchApprovedFields('Admission Number')
      expect(results.some((r) => r.key === 'student.admissionNumber')).toBe(true)
    })

    it('finds fields by token path', () => {
      const results = searchApprovedFields('student.dob')
      expect(results.some((r) => r.key === 'student.dob')).toBe(true)
    })

    it('finds fields by user alias tags (e.g. "bus" -> transport fields)', () => {
      const results = searchApprovedFields('bus')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results.some((r) => r.key === 'transport.routeName')).toBe(true)
    })

    it('filters fields strictly by domain when specified', () => {
      const studentOnly = searchApprovedFields('', 'STUDENT')
      expect(studentOnly.every((f) => f.domain === 'STUDENT')).toBe(true)
      expect(studentOnly.length).toBeGreaterThanOrEqual(8)

      const financeOnly = searchApprovedFields('', 'FINANCE')
      expect(financeOnly.every((f) => f.domain === 'FINANCE')).toBe(true)
    })
  })

  describe('3. Token Resolution & Fallback Behavior', () => {
    it('resolves tokens from dynamic record context', () => {
      const template = 'Child: {{student.fullName}}, Reg: {{student.admissionNumber}}'
      const context = {
        'student.fullName': 'Anaya Patel',
        'student.admissionNumber': 'ADM-2026-99',
      }
      const rendered = resolveTokens(template, context)
      expect(rendered).toBe('Child: Anaya Patel, Reg: ADM-2026-99')
    })

    it('falls back to default sample data when context lacks the token', () => {
      const template = 'School: {{school.name}}'
      const rendered = resolveTokens(template, {})
      expect(rendered).toContain('Little Explorers')
    })

    it('handles nested context objects cleanly', () => {
      const template = 'Teacher: {{classroom.primaryTeacher}}'
      const context = {
        classroom: {
          primaryTeacher: 'Ms. Shalini Iyer',
        },
      }
      const rendered = resolveTokens(template, context)
      expect(rendered).toBe('Teacher: Ms. Shalini Iyer')
    })
  })

  describe('4. Document Dimensions & Structural Invariants', () => {
    it('maintains standard CR80 physical card dimensions (54 × 85.6 mm)', () => {
      const portrait = PAGE_DIMENSIONS.ID_CARD_PORTRAIT
      expect(portrait.widthMm).toBe(54)
      expect(portrait.heightMm).toBe(85.6)
      expect(portrait.orientation).toBe('portrait')

      const landscape = PAGE_DIMENSIONS.ID_CARD_LANDSCAPE
      expect(landscape.widthMm).toBe(85.6)
      expect(landscape.heightMm).toBe(54)
      expect(landscape.orientation).toBe('landscape')
    })

    it('maintains standard A4 document dimensions (210 × 297 mm)', () => {
      const a4 = PAGE_DIMENSIONS.A4_PORTRAIT
      expect(a4.widthMm).toBe(210)
      expect(a4.heightMm).toBe(297)
    })

    it('registers all 7 document types with default formats', () => {
      const types = Object.keys(DOCUMENT_TYPE_CONFIG)
      expect(types).toContain('STUDENT_ID_CARD')
      expect(types).toContain('STAFF_ID_CARD')
      expect(types).toContain('FEE_RECEIPT')
      expect(types).toContain('CERTIFICATE')
      expect(types).toContain('ADMISSION_FORM')
      expect(types).toContain('REPORT_CARD')
      expect(types).toContain('GENERAL_LETTER')
    })
  })

  describe('5. Template Lifecycle & Multi-Tenant Storage', () => {
    it('creates and updates a draft template record', async () => {
      const created = await TemplateService.createTemplate(tenantId, {
        name: 'Studio 2.0 Smart Badge',
        type: 'STUDENT_ID_CARD',
        presetKey: 'STUDENT_ID_CARD',
      })

      expect(created).toBeDefined()
      expect(created.id).toBeDefined()
      expect(created.name).toBe('Studio 2.0 Smart Badge')
      templateId = created.id

      // Update definition
      const def = created.content
      def.elements.push({
        id: 'new-elem-1',
        type: 'bound-text',
        name: 'Transport Route Badge',
        x: 10,
        y: 60,
        width: 34,
        height: 6,
        zIndex: 5,
        content: '{{transport.routeName}}',
        fieldBinding: 'transport.routeName',
        styles: { fontSize: 8, color: '#1E293B' },
      })

      const updated = await TemplateService.updateTemplate(tenantId, templateId, {
        name: 'Studio 2.0 Smart Badge (Updated)',
        definition: def,
      })

      expect(updated.name).toBe('Studio 2.0 Smart Badge (Updated)')
      expect(updated.content.elements.some((e: any) => e.id === 'new-elem-1')).toBe(true)
    })

    it('publishes the template incrementing the version', async () => {
      const published = await TemplateService.publishTemplate(tenantId, templateId, 'Admin User')
      expect(published.content.status).toBe('PUBLISHED')
      expect(published.content.version).toBeGreaterThanOrEqual(1)
    })
  })
})
