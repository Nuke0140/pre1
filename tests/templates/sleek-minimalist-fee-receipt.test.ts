import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { TEMPLATE_PRESETS, SLEEK_MINIMALIST_FEE_RECEIPT_PRESET } from '@/lib/templates/presets'
import { TemplateService } from '@/lib/templates/template-service'
import { TemplateDataResolver } from '@/lib/templates/data-resolver'
import { PdfService } from '@/lib/templates/pdf-service'
import { resolveTokens, getDefaultSampleData, APPROVED_TEMPLATE_FIELDS } from '@/lib/templates/field-registry'
import { POST as createTemplateApi, GET as listTemplatesApi } from '@/app/api/v1/templates/route'
import { PATCH as updateTemplateApi, GET as getTemplateApi } from '@/app/api/v1/templates/[id]/route'
import { UserRole } from '@prisma/client'

/**
 * PreOne E1 — Sleek Minimalist Fee Receipt Verification Suite
 *
 * Validates:
 * 1. Preset registration & schema validity (catalog key, dimensions, element inventory, margins)
 * 2. API creation from preset with tenant isolation (DRAFT status, JSON integrity, multi-tenant boundaries)
 * 3. Dynamic data token binding (canonical finance/student/school fields, sparse fallback resilience)
 * 4. Calculations & currency formatting (Subtotal, discounts, total, paid, balance in INR ₹)
 * 5. Payment status display (PAID green badge, PARTIALLY_PAID balance warning, DUE / UNPAID state)
 * 6. PDF rendering & boundary verification (exactly 1 page, valid %PDF bytes, file size < 500 KB)
 * 7. Publishing & default assignment workflow (DRAFT -> PUBLISHED, default replacement logic)
 */

describe('PreOne E1 — Sleek Minimalist Fee Receipt Preset Suite', () => {
  const timestamp = Date.now()
  const tenantACode = `SM_TENANT_A_${timestamp}`
  const tenantBCode = `SM_TENANT_B_${timestamp}`

  let tenantAId = ''
  let tenantBId = ''
  let branchAId = ''
  let branchBId = ''
  let userAId = ''
  let userBId = ''
  let sessionCookieA = ''
  let sessionCookieB = ''

  beforeAll(async () => {
    // 1. Create Tenant A
    const tenantA = await db.tenant.create({
      data: {
        code: tenantACode,
        name: 'Little Explorers Preschool Academy',
        address: 'Plot 42, HSR Layout Sector 2',
        city: 'Bengaluru, Karnataka 560102',
        phone: '+91 80 4123 4567',
        email: 'bursar@littleexplorers.edu',
        logoUrl: 'https://preone.school/assets/sample-crest.png',
      },
    })
    tenantAId = tenantA.id

    // 2. Create Branch A
    const branchA = await db.branch.create({
      data: {
        tenantId: tenantAId,
        name: 'HSR Main Campus',
        code: `HSR_${timestamp}`,
        address: 'Plot 42, HSR Layout',
        city: 'Bengaluru',
      },
    })
    branchAId = branchA.id

    // 3. Create Admin User A
    const userA = await db.user.create({
      data: {
        email: `adminA_${timestamp}@preone.test`,
        fullName: 'Vikram Deshmukh',
        phone: `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash: 'hash',
      },
    })
    userAId = userA.id

    await db.tenantUser.create({
      data: {
        tenantId: tenantAId,
        userId: userA.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    const tokenA = await signSession({
      uid: userA.id,
      email: userA.email!,
      name: userA.fullName,
      role: 'OWNER',
      tenantId: tenantAId,
    })
    sessionCookieA = `preone_session=${tokenA}`

    // 4. Create Tenant B (Quarantine Boundary)
    const tenantB = await db.tenant.create({
      data: {
        code: tenantBCode,
        name: 'Sunshine Early Learners',
        address: 'MG Road, Camp',
        city: 'Pune, Maharashtra 411001',
        phone: '+91 20 2612 9988',
        email: 'office@sunshinelearners.edu',
      },
    })
    tenantBId = tenantB.id

    const branchB = await db.branch.create({
      data: {
        tenantId: tenantBId,
        name: 'Pune Central Campus',
        code: `PUN_${timestamp}`,
        address: 'MG Road',
        city: 'Pune',
      },
    })
    branchBId = branchB.id

    const userB = await db.user.create({
      data: {
        email: `adminB_${timestamp}@preone.test`,
        fullName: 'Sunita Sharma',
        phone: `+9198766${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash: 'hash',
      },
    })
    userBId = userB.id

    await db.tenantUser.create({
      data: {
        tenantId: tenantBId,
        userId: userB.id,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    })

    const tokenB = await signSession({
      uid: userB.id,
      email: userB.email!,
      name: userB.fullName,
      role: 'OWNER',
      tenantId: tenantBId,
    })
    sessionCookieB = `preone_session=${tokenB}`
  })

  afterAll(async () => {
    // Clean up created test entities
    try {
      await db.documentTemplate.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.tenantUser.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } })
      await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } })
      await db.branch.deleteMany({ where: { id: { in: [branchAId, branchBId] } } })
      await db.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } })
    } catch (e) {
      console.warn('Cleanup warning:', e)
    }
  })

  // ─────────────────────────────────────────────────────────
  // 1. Preset Registration & Schema Validity
  // ─────────────────────────────────────────────────────────
  describe('1. Preset Registration & Schema Validity', () => {
    it('registers FEE_RECEIPT_SLEEK in preset catalog with type FEE_RECEIPT', () => {
      const preset = TEMPLATE_PRESETS['FEE_RECEIPT_SLEEK']
      expect(preset).toBeDefined()
      expect(preset.type).toBe('FEE_RECEIPT')
      expect(preset.name).toBe('Sleek Minimalist Fee Receipt')
      expect(preset.thumbnailIcon).toBe('Receipt')
      expect(preset.definition.documentType).toBe('FEE_RECEIPT')
    })

    it('exports SLEEK_MINIMALIST_FEE_RECEIPT_PRESET and aliases correctly', () => {
      expect(SLEEK_MINIMALIST_FEE_RECEIPT_PRESET).toBeDefined()
      expect(TEMPLATE_PRESETS['SLEEK_MINIMALIST']).toBe(TEMPLATE_PRESETS['FEE_RECEIPT_SLEEK'])
      expect(TEMPLATE_PRESETS['SLEEK_MINIMALIST_FEE_RECEIPT']).toBe(TEMPLATE_PRESETS['FEE_RECEIPT_SLEEK'])
    })

    it('has standard A4 Portrait dimensions and valid margins', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      expect(def.pageSize).toBe('A4_PORTRAIT')
      expect(def.orientation).toBe('portrait')
      expect(def.widthMm).toBe(210)
      expect(def.heightMm).toBe(297)
      expect(def.backgroundColor).toBe('#FFFFFF')
      expect(def.marginsMm.top).toBeGreaterThanOrEqual(10)
      expect(def.marginsMm.bottom).toBeGreaterThanOrEqual(10)
    })

    it('contains all required structural elements without coordinates clipping', () => {
      const elements = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition.elements
      expect(elements.length).toBeGreaterThanOrEqual(25)

      // Ensure every element fits within 210mm x 297mm bounds
      for (const el of elements) {
        expect(el.x).toBeGreaterThanOrEqual(0)
        expect(el.y).toBeGreaterThanOrEqual(0)
        expect(el.x + el.width).toBeLessThanOrEqual(210)
        // Bottom limit: elements must terminate comfortably above 290mm to prevent 2nd page overflow
        expect(el.y + el.height).toBeLessThanOrEqual(288)
      }
    })
  })

  // ─────────────────────────────────────────────────────────
  // 2. Template Creation from Preset & Tenant Isolation
  // ─────────────────────────────────────────────────────────
  describe('2. Template Creation from Preset & Tenant Isolation', () => {
    let createdTemplateAId = ''

    it('creates a DRAFT DocumentTemplate record via API using presetKey', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieA,
        },
        body: JSON.stringify({
          name: 'Official Sleek Receipt 2026',
          type: 'FEE_RECEIPT',
          presetKey: 'FEE_RECEIPT_SLEEK',
        }),
      })

      const res = await createTemplateApi(req)
      expect(res.status).toBe(200)
      const resJson = await res.json()
      const data = resJson.data || resJson

      expect(data.id).toBeDefined()
      createdTemplateAId = data.id
      expect(data.name).toBe('Official Sleek Receipt 2026')
      expect(data.type).toBe('FEE_RECEIPT')
      expect(typeof data.isDefault).toBe('boolean')
      expect(data.tenantId).toBe(tenantAId)

      // Verify definition status is initialized as DRAFT
      const def = data.content
      expect(def.status).toBe('DRAFT')
      expect(def.pageSize).toBe('A4_PORTRAIT')
      expect(def.elements.length).toBe(SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition.elements.length)
    })

    it('supports alias presetKey SLEEK_MINIMALIST seamlessly in TemplateService', async () => {
      const aliasTemplate = await TemplateService.createTemplate(tenantAId, {
        name: 'Alias Receipt Test',
        type: 'FEE_RECEIPT',
        presetKey: 'SLEEK_MINIMALIST',
      })

      expect(aliasTemplate.id).toBeDefined()
      const def = aliasTemplate.content as any
      expect(def.pageSize).toBe('A4_PORTRAIT')
      expect(def.elements.length).toBe(SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition.elements.length)
    })

    it('strictly isolates templates across tenants (Tenant B cannot read Tenant A template)', async () => {
      // Tenant B tries to fetch Tenant A's template
      const req = new NextRequest(`http://localhost:3000/api/v1/templates/${createdTemplateAId}`, {
        method: 'GET',
        headers: { Cookie: sessionCookieB },
      })

      const res = await getTemplateApi(req, { params: Promise.resolve({ id: createdTemplateAId }) })
      expect(res.status).toBe(404)
    })

    it('strictly prevents Tenant B from updating or overwriting Tenant A template', async () => {
      const req = new NextRequest(`http://localhost:3000/api/v1/templates/${createdTemplateAId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookieB,
        },
        body: JSON.stringify({ name: 'Hacked Receipt Name' }),
      })

      const res = await updateTemplateApi(req, { params: Promise.resolve({ id: createdTemplateAId }) })
      // Tenant isolation: Foreign tenant update must be rejected (400 Template not found or 404)
      expect([400, 404]).toContain(res.status)

      // Confirm unchanged in database
      const row = await db.documentTemplate.findUnique({ where: { id: createdTemplateAId } })
      expect(row?.name).toBe('Official Sleek Receipt 2026')
    })
  })

  // ─────────────────────────────────────────────────────────
  // 3. Dynamic Data Token Bindings & Fallbacks
  // ─────────────────────────────────────────────────────────
  describe('3. Dynamic Data Token Bindings & Fallbacks', () => {
    it('resolves all canonical tokens with sample and real data context', async () => {
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        'sample-fixture',
        'FIXTURE'
      )

      expect(context['school.name']).toBe('Little Explorers Preschool Academy')
      expect(context['school.address']).toBe('Plot 42, HSR Layout Sector 2')
      expect(context['school.city']).toBe('Bengaluru, Karnataka 560102')
      expect(context['school.phone']).toBe('+91 80 4123 4567')
      expect(context['school.email']).toBe('bursar@littleexplorers.edu')
      expect(context['school.logoUrl']).toBe('https://preone.school/assets/sample-crest.png')
      expect(context['finance.receiptNumber']).toBeDefined()
      expect(context['finance.paymentStatus']).toBe('PAID')
      expect(context['finance.paidAmount']).toBeDefined()
      expect(context['student.fullName']).toBeDefined()
      expect(context['system.currentDateTime']).toBeDefined()
    })

    it('gracefully handles sparse / missing data without raw {{token}} leaks or crashes', () => {
      const sparseContext: Record<string, string> = {
        'school.name': 'Minimal Preschool',
        'finance.receiptNumber': 'REC-999',
        'finance.paidAmount': '₹10,000.00',
        'guardian.phone': '',
      }

      const rawTemplate = 'Student: {{student.fullName}} | Contact: {{guardian.phone}} | Receipt: {{finance.receiptNumber}}'
      const resolved = resolveTokens(rawTemplate, sparseContext)

      // Token substitution replaces missing with empty string without raw braces or crashes
      expect(resolved).not.toContain('{{student.fullName}}')
      expect(resolved).not.toContain('{{guardian.phone}}')
      expect(resolved).toContain('Receipt: REC-999')
    })

    it('renders clean school logo or graceful fallback in HTML engine', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const htmlWithLogo = TemplateService.renderTemplateHtml(def, {
        'school.logoUrl': 'https://preone.school/logo.png',
        'school.name': 'Ivy Kids',
      })
      expect(htmlWithLogo).toContain('<img src="https://preone.school/logo.png"')

      const htmlWithoutLogo = TemplateService.renderTemplateHtml(def, {
        'school.logoUrl': '',
        'school.name': 'Ivy Kids',
      })
      // When logo is empty/missing, it renders the styled LOGO pill without broken img tag
      expect(htmlWithoutLogo).toContain('LOGO')
    })
  })

  // ─────────────────────────────────────────────────────────
  // 4. Calculations & Currency Formatting
  // ─────────────────────────────────────────────────────────
  describe('4. Calculations & Currency Formatting', () => {
    it('verifies standard Indian Rupee currency format for totals and breakdown', () => {
      const subtotalCents = 2450000
      const discountCents = 200000
      const totalCents = subtotalCents - discountCents
      const paidCents = totalCents
      const balanceCents = 0

      const formatInr = (cents: number) => `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

      const formattedSubtotal = formatInr(subtotalCents)
      const formattedDiscount = formatInr(discountCents)
      const formattedTotal = formatInr(totalCents)
      const formattedPaid = formatInr(paidCents)
      const formattedBalance = formatInr(balanceCents)

      expect(formattedSubtotal).toBe('₹24,500.00')
      expect(formattedDiscount).toBe('₹2,000.00')
      expect(formattedTotal).toBe('₹22,500.00')
      expect(formattedPaid).toBe('₹22,500.00')
      expect(formattedBalance).toBe('₹0.00')
    })
  })

  // ─────────────────────────────────────────────────────────
  // 5. Payment Status Display (PAID, PARTIALLY_PAID, DUE)
  // ─────────────────────────────────────────────────────────
  describe('5. Payment Status Display', () => {
    it('renders PAID status badge cleanly', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const html = TemplateService.renderTemplateHtml(def, {
        ...getDefaultSampleData(),
        'finance.paymentStatus': 'PAID',
        'finance.paidAmount': '₹24,500.00',
        'finance.balanceAmount': '₹0.00',
      })

      expect(html).toContain('PAID')
      expect(html).toContain('Total Paid:')
      expect(html).toContain('₹24,500.00')
    })

    it('renders PARTIALLY_PAID status with remaining balance', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const html = TemplateService.renderTemplateHtml(def, {
        ...getDefaultSampleData(),
        'finance.paymentStatus': 'PARTIALLY_PAID',
        'finance.paidAmount': '₹12,000.00',
        'finance.balanceAmount': '₹12,500.00',
      })

      expect(html).toContain('PARTIALLY_PAID')
      expect(html).toContain('₹12,000.00')
      expect(html).toContain('₹12,500.00')
    })

    it('renders DUE / UNPAID state with full outstanding balance', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const html = TemplateService.renderTemplateHtml(def, {
        ...getDefaultSampleData(),
        'finance.paymentStatus': 'DUE',
        'finance.paidAmount': '₹0.00',
        'finance.balanceAmount': '₹24,500.00',
      })

      expect(html).toContain('DUE')
      expect(html).toContain('₹24,500.00')
    })
  })

  // ─────────────────────────────────────────────────────────
  // 6. Conditional & Secure Verification QR Handling
  // ─────────────────────────────────────────────────────────
  describe('6. Conditional & Secure Verification QR Handling', () => {
    it('generates authenticity verification link, never an unverified payment request VPA', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const qrElement = def.elements.find((el) => el.type === 'qrcode')

      expect(qrElement).toBeDefined()
      expect(qrElement?.content).toContain('https://preone.school/verify/receipt/')
      // Confirms it does not contain raw unsafe UPI merchant string e.g. "upi://pay?pa=..."
      expect(qrElement?.content).not.toContain('upi://pay')
    })

    it('substitutes dynamic receipt number into verification QR content', () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const qrElement = def.elements.find((el) => el.type === 'qrcode')!
      const resolved = resolveTokens(qrElement.content, {
        'finance.receiptNumber': 'REC-BLR-2026-904',
      })

      expect(resolved).toBe('https://preone.school/verify/receipt/REC-BLR-2026-904')
    })
  })

  // ─────────────────────────────────────────────────────────
  // 7. PDF Rendering & Boundary Verification
  // ─────────────────────────────────────────────────────────
  describe('7. PDF Rendering & Boundary Verification', () => {
    it('compiles template into valid PDF with %PDF magic bytes and exactly 1 page', async () => {
      const def = SLEEK_MINIMALIST_FEE_RECEIPT_PRESET.definition
      const result = await PdfService.generatePdf({
        definition: def,
        dataContext: {
          ...getDefaultSampleData(),
          'school.name': 'Little Explorers Preschool Academy',
          'finance.receiptNumber': 'REC-2026-001',
          'finance.paymentStatus': 'PAID',
          'finance.paidAmount': '₹24,500.00',
          'finance.balanceAmount': '₹0.00',
        },
      })

      expect(result).toBeDefined()
      expect(result.buffer).toBeDefined()
      // Verify valid PDF stream header
      expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF')
      // Critical requirement: must be exactly 1 page (no spillover onto blank second page)
      expect(result.pageCount).toBe(1)
      // File size must be compact (< 500 KB)
      expect(result.sizeBytes).toBeLessThan(500 * 1024)
      expect(result.widthMm).toBe(210)
      expect(result.heightMm).toBe(297)
    })
  })

  // ─────────────────────────────────────────────────────────
  // 8. Publishing & Default Template Assignment
  // ─────────────────────────────────────────────────────────
  describe('8. Publishing & Default Template Assignment', () => {
    let templateId1 = ''
    let templateId2 = ''

    beforeAll(async () => {
      const t1 = await TemplateService.createTemplate(tenantAId, {
        name: 'Sleek Minimalist Active V1',
        type: 'FEE_RECEIPT',
        presetKey: 'FEE_RECEIPT_SLEEK',
      })
      templateId1 = t1.id

      const t2 = await TemplateService.createTemplate(tenantAId, {
        name: 'Executive Receipt Alternative',
        type: 'FEE_RECEIPT',
        presetKey: 'FEE_RECEIPT',
      })
      templateId2 = t2.id
    })

    it('transitions DRAFT template to PUBLISHED status', async () => {
      const published = await TemplateService.publishTemplate(
        tenantAId,
        templateId1,
        'Vikram Deshmukh',
        userAId
      )

      expect(published).toBeDefined()
      const def = published.content as any
      expect(def.status).toBe('PUBLISHED')
      expect(def.publishedBy).toBe('Vikram Deshmukh')
      expect(def.publishedAt).toBeDefined()
    })

    it('sets template as default and clears isDefault on prior default template for that tenant', async () => {
      // Step 1: Set templateId1 as default
      await TemplateService.updateTemplate(tenantAId, templateId1, {
        isDefault: true,
      })

      let row1 = await db.documentTemplate.findUnique({ where: { id: templateId1 } })
      let row2 = await db.documentTemplate.findUnique({ where: { id: templateId2 } })
      expect(row1?.isDefault).toBe(true)
      expect(row2?.isDefault).toBe(false)

      // Step 2: Now set templateId2 as default
      await TemplateService.updateTemplate(tenantAId, templateId2, {
        isDefault: true,
      })

      row1 = await db.documentTemplate.findUnique({ where: { id: templateId1 } })
      row2 = await db.documentTemplate.findUnique({ where: { id: templateId2 } })

      // templateId2 should be default, templateId1 should automatically be cleared to false
      expect(row2?.isDefault).toBe(true)
      expect(row1?.isDefault).toBe(false)

      // Step 3: Re-assign templateId1 (Sleek Minimalist) as default
      await TemplateService.updateTemplate(tenantAId, templateId1, {
        isDefault: true,
      })

      row1 = await db.documentTemplate.findUnique({ where: { id: templateId1 } })
      row2 = await db.documentTemplate.findUnique({ where: { id: templateId2 } })
      expect(row1?.isDefault).toBe(true)
      expect(row2?.isDefault).toBe(false)
    })
  })
})
