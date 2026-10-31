/**
 * PreOne — Phase 1: Modern Fee Receipts & Presets Comprehensive Test Suite
 * Validates:
 *  - E1: Sleek Minimalist Fee Receipt (A4 Portrait)
 *  - E2: Compact Thermal Receipt (80 mm POS)
 *  - E3: Institutional A4 Receipt (210 × 297 mm)
 *  - E4: Payment Status Badges & Settlement Mapping
 *  - E5: Itemized Fee Table & Financial Calculation Integrity
 *  - E6: Dynamic Indian Number-to-Words & Secure Authenticity QR
 *  - E7: Multi-Tenant Branding Isolation
 *  - E8: PDF Rendering & Single-Page Boundary Guarantees
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '@/lib/db'
import { TEMPLATE_PRESETS, THERMAL_FEE_RECEIPT_PRESET, INSTITUTIONAL_FEE_RECEIPT_PRESET, SLEEK_MINIMALIST_FEE_RECEIPT_PRESET } from '@/lib/templates/presets'
import { TemplateService } from '@/lib/templates/template-service'
import { TemplateDataResolver, numberToWordsIndian } from '@/lib/templates/data-resolver'
import { PdfService } from '@/lib/templates/pdf-service'
import { APPROVED_TEMPLATE_FIELDS, resolveTokens } from '@/lib/templates/field-registry'

describe('PreOne Template Studio — Phase 1: Fee Receipt Design System Suite', () => {
  let tenantAId: string
  let tenantBId: string
  let branchAId: string
  let studentAId: string
  let invoiceAId: string
  let paymentAId: string
  let receiptAId: string

  beforeAll(async () => {
    // 1. Create Tenant A
    const tenantA = await db.tenant.create({
      data: {
        name: 'Little Explorers Preschool Academy',
        code: `TEST-TEA-${Date.now().toString().slice(-6)}`,
        address: '42 Lotus Blossom Road, Indiranagar',
        city: 'Bengaluru',
        phone: '+91 98450 11223',
        email: 'accounts@littleexplorers.edu.in',
        website: 'https://littleexplorers.edu.in',
        gstNumber: '29ABCDE1234F1Z5',
        logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120',
      },
    })
    tenantAId = tenantA.id

    // 2. Create Tenant B
    const tenantB = await db.tenant.create({
      data: {
        name: 'Sunrise Montessori School',
        code: `TEST-TEB-${Date.now().toString().slice(-6)}`,
        address: '88 MG Road',
        city: 'Pune',
      },
    })
    tenantBId = tenantB.id

    // 3. Create Branch for Tenant A
    const branchA = await db.branch.create({
      data: {
        tenantId: tenantAId,
        name: 'Main Campus',
        code: `BR-${Date.now().toString().slice(-4)}`,
        city: 'Bengaluru',
      },
    })
    branchAId = branchA.id

    // 4. Create AcademicSession, Classroom & Student for Tenant A
    const academicSession = await db.academicSession.create({
      data: {
        tenantId: tenantAId,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })

    const classroom = await db.classroom.create({
      data: {
        tenantId: tenantAId,
        branchId: branchAId,
        academicSessionId: academicSession.id,
        name: 'Nursery Bluebirds',
        code: `NUR-${Date.now().toString().slice(-4)}`,
        capacity: 25,
        programType: 'NURSERY',
      },
    })

    const student = await db.student.create({
      data: {
        tenantId: tenantAId,
        branchId: branchAId,
        currentClassroomId: classroom.id,
        admissionNo: `ADM-${Date.now().toString().slice(-5)}`,
        firstName: 'Vivaan',
        lastName: 'Deshmukh',
        dob: new Date('2022-06-15'),
        gender: 'MALE',
        bloodGroup: 'B_POSITIVE',
        seatNumber: '012',
        address: 'Flat 402, Palms Residency, Indiranagar, Bengaluru',
      },
    })
    studentAId = student.id

    // 5. Create Guardian
    const guardian = await db.guardian.create({
      data: {
        tenantId: tenantAId,
        fullName: 'Vikram Deshmukh',
        phone: '+91 98765 43210',
        email: 'vikram.deshmukh@example.com',
        relationship: 'FATHER',
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId: guardian.id,
        relationship: 'FATHER',
        isPrimary: true,
      },
    })

    // 6. Create Invoice with itemized line items
    const invoice = await db.invoice.create({
      data: {
        tenantId: tenantAId,
        branchId: branchAId,
        studentId: student.id,
        invoiceNumber: `INV-2026-${Date.now().toString().slice(-4)}`,
        title: 'Term 1 Preschool Tuition & Activity Fee',
        subtotalCents: 2450000, // ₹24,500.00
        discountCents: 200000,  // ₹2,000.00 concession
        taxCents: 0,
        totalCents: 2250000,    // ₹22,500.00 net
        paidCents: 2250000,     // Fully paid
        balanceCents: 0,
        status: 'PAID',
        dueDate: new Date(),
        items: {
          create: [
            {
              feeHead: 'TUITION',
              description: 'Term 1 Core Early Years Learning & Montessori Curriculum',
              amountCents: 1650000, // ₹16,500.00
            },
            {
              feeHead: 'MEAL',
              description: 'Organic Nutrition, Snack & Pure Filtered Water Program',
              amountCents: 500000,  // ₹5,000.00
            },
            {
              feeHead: 'ACTIVITY',
              description: 'Phonics Activity Kit, Sensory Bins & Creative Art Supplies',
              amountCents: 300000,  // ₹3,000.00
            },
          ],
        },
      },
    })
    invoiceAId = invoice.id

    // 7. Create Payment & Receipt
    const payment = await db.payment.create({
      data: {
        tenantId: tenantAId,
        studentId: student.id,
        invoiceId: invoice.id,
        paymentNumber: `PAY-2026-${Date.now().toString().slice(-4)}`,
        amountCents: 2250000, // ₹22,500.00
        method: 'UPI',
        transactionRef: `UPI/2026/TXN${Date.now().toString().slice(-6)}`,
        status: 'SUCCESS',
        paymentDate: new Date(),
      },
    })
    paymentAId = payment.id

    const receipt = await db.receipt.create({
      data: {
        tenantId: tenantAId,
        paymentId: payment.id,
        receiptNumber: `RCPT-2026-${Date.now().toString().slice(-4)}`,
        amountCents: 2250000,
        issuedAt: new Date(),
      },
    })
    receiptAId = receipt.id
  })

  afterAll(async () => {
    // Clean up created records
    try {
      if (receiptAId) await db.receipt.deleteMany({ where: { id: receiptAId } })
      if (paymentAId) await db.payment.deleteMany({ where: { id: paymentAId } })
      if (invoiceAId) {
        await db.invoiceItem.deleteMany({ where: { invoiceId: invoiceAId } })
        await db.invoice.deleteMany({ where: { id: invoiceAId } })
      }
      if (studentAId) {
        await db.studentGuardian.deleteMany({ where: { studentId: studentAId } })
        await db.student.deleteMany({ where: { id: studentAId } })
      }
      if (tenantAId) {
        await db.documentTemplate.deleteMany({ where: { tenantId: tenantAId } })
        await db.classroom.deleteMany({ where: { tenantId: tenantAId } })
        await db.academicSession.deleteMany({ where: { tenantId: tenantAId } })
        await db.guardian.deleteMany({ where: { tenantId: tenantAId } })
        await db.branch.deleteMany({ where: { tenantId: tenantAId } })
        await db.tenant.deleteMany({ where: { id: tenantAId } })
      }
      if (tenantBId) {
        await db.documentTemplate.deleteMany({ where: { tenantId: tenantBId } })
        await db.tenant.deleteMany({ where: { id: tenantBId } })
      }
    } catch {}
  })

  describe('1. Preset Catalog & Structural Geometry Validation', () => {
    it('registers all three Phase 1 fee receipt presets in catalog', () => {
      expect(TEMPLATE_PRESETS['FEE_RECEIPT_SLEEK']).toBeDefined()
      expect(TEMPLATE_PRESETS['FEE_RECEIPT_THERMAL']).toBeDefined()
      expect(TEMPLATE_PRESETS['FEE_RECEIPT_INSTITUTIONAL']).toBeDefined()

      expect(TEMPLATE_PRESETS['FEE_RECEIPT_SLEEK'].type).toBe('FEE_RECEIPT')
      expect(TEMPLATE_PRESETS['FEE_RECEIPT_THERMAL'].type).toBe('FEE_RECEIPT')
      expect(TEMPLATE_PRESETS['FEE_RECEIPT_INSTITUTIONAL'].type).toBe('FEE_RECEIPT')
    })

    it('exports named aliases for all presets', () => {
      expect(SLEEK_MINIMALIST_FEE_RECEIPT_PRESET).toBeDefined()
      expect(THERMAL_FEE_RECEIPT_PRESET).toBeDefined()
      expect(INSTITUTIONAL_FEE_RECEIPT_PRESET).toBeDefined()

      expect(TEMPLATE_PRESETS['THERMAL_RECEIPT']).toBe(TEMPLATE_PRESETS['FEE_RECEIPT_THERMAL'])
      expect(TEMPLATE_PRESETS['INSTITUTIONAL_RECEIPT']).toBe(TEMPLATE_PRESETS['FEE_RECEIPT_INSTITUTIONAL'])
    })

    it('validates E2 Compact Thermal (80 mm) dimensions and printable bounds', () => {
      const def = TEMPLATE_PRESETS['FEE_RECEIPT_THERMAL'].definition
      expect(def.pageSize).toBe('RECEIPT_THERMAL')
      expect(def.orientation).toBe('portrait')
      expect(def.widthMm).toBe(80)
      expect(def.heightMm).toBe(180)

      expect(def.elements.length).toBeGreaterThanOrEqual(20)

      for (const el of def.elements) {
        expect(el.x).toBeGreaterThanOrEqual(0)
        expect(el.x + el.width).toBeLessThanOrEqual(def.widthMm)
        expect(el.y).toBeGreaterThanOrEqual(0)
        expect(el.y + el.height).toBeLessThanOrEqual(def.heightMm)
        // Monospace typography for POS printers
        if (el.styles.fontFamily) {
          expect(el.styles.fontFamily).toContain('monospace')
        }
      }
    })

    it('validates E3 Institutional A4 Receipt dimensions and formal double border', () => {
      const def = TEMPLATE_PRESETS['FEE_RECEIPT_INSTITUTIONAL'].definition
      expect(def.pageSize).toBe('A4_PORTRAIT')
      expect(def.orientation).toBe('portrait')
      expect(def.widthMm).toBe(210)
      expect(def.heightMm).toBe(297)

      expect(def.elements.length).toBeGreaterThanOrEqual(35)

      const outerBorder = def.elements.find((e) => e.id === 'inst-outer-border')
      const innerBorder = def.elements.find((e) => e.id === 'inst-inner-border')
      const copyBanner = def.elements.find((e) => e.id === 'inst-copy-banner')
      const table = def.elements.find((e) => e.id === 'inst-table')
      const qr = def.elements.find((e) => e.id === 'inst-verification-qr')

      expect(outerBorder).toBeDefined()
      expect(innerBorder).toBeDefined()
      expect(copyBanner).toBeDefined()
      expect(table).toBeDefined()
      expect(qr).toBeDefined()

      for (const el of def.elements) {
        expect(el.x).toBeGreaterThanOrEqual(0)
        expect(el.x + el.width).toBeLessThanOrEqual(def.widthMm)
        expect(el.y).toBeGreaterThanOrEqual(0)
        expect(el.y + el.height).toBeLessThanOrEqual(def.heightMm)
      }
    })
  })

  describe('2. Template Creation, Aliases & Multi-Tenant Quarantine', () => {
    it('creates E2 Thermal receipt draft from preset key and alias', async () => {
      const tmpl1 = await TemplateService.createTemplate(tenantAId, {
        name: 'Campus POS Thermal Receipt',
        type: 'FEE_RECEIPT',
        presetKey: 'FEE_RECEIPT_THERMAL',
      })
      expect(tmpl1.id).toBeDefined()
      expect(tmpl1.content.pageSize).toBe('RECEIPT_THERMAL')
      expect(tmpl1.content.widthMm).toBe(80)

      const tmpl2 = await TemplateService.createTemplate(tenantAId, {
        name: 'Desk Thermal Slip',
        type: 'FEE_RECEIPT',
        presetKey: 'THERMAL_RECEIPT',
      })
      expect(tmpl2.id).toBeDefined()
      expect(tmpl2.content.pageSize).toBe('RECEIPT_THERMAL')
    })

    it('creates E3 Institutional receipt draft from preset key and alias', async () => {
      const tmpl = await TemplateService.createTemplate(tenantAId, {
        name: 'Official Institutional Voucher',
        type: 'FEE_RECEIPT',
        presetKey: 'FEE_RECEIPT_INSTITUTIONAL',
      })
      expect(tmpl.id).toBeDefined()
      expect(tmpl.content.pageSize).toBe('A4_PORTRAIT')
      expect(tmpl.content.elements.some((e) => e.id === 'inst-outer-border')).toBe(true)
    })

    it('strictly isolates created templates between Tenant A and Tenant B', async () => {
      const tmplA = await TemplateService.createTemplate(tenantAId, {
        name: 'Secret Academy Voucher',
        type: 'FEE_RECEIPT',
        presetKey: 'FEE_RECEIPT_INSTITUTIONAL',
      })

      const fetchedByB = await TemplateService.getTemplateById(tenantBId, tmplA.id)
      expect(fetchedByB).toBeNull()

      expect(
        TemplateService.updateTemplate(tenantBId, tmplA.id, { name: 'Compromised Name' })
      ).rejects.toThrow()
    })
  })

  describe('3. Dynamic Indian Number-to-Words Conversion (E5 / E6)', () => {
    it('accurately converts Indian currency amounts to formal English representations', () => {
      expect(numberToWordsIndian(24500)).toBe('Rupees Twenty Four Thousand Five Hundred Only')
      expect(numberToWordsIndian(22500)).toBe('Rupees Twenty Two Thousand Five Hundred Only')
      expect(numberToWordsIndian(18500)).toBe('Rupees Eighteen Thousand Five Hundred Only')
      expect(numberToWordsIndian(100000)).toBe('Rupees One Lakh Only')
      expect(numberToWordsIndian(2500000)).toBe('Rupees Twenty Five Lakh Only')
      expect(numberToWordsIndian(10000000)).toBe('Rupees One Crore Only')
      expect(numberToWordsIndian(0)).toBe('Rupees Zero Only')
    })
  })

  describe('4. Authoritative Payment Status Badges (E4)', () => {
    it('maps and renders PAID status cleanly without ambiguity', async () => {
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        paymentAId,
        'PAYMENT'
      )
      expect(context['finance.paymentStatus']).toBe('PAID')
      expect(context['finance.statusBadge']).toBe('PAID')
    })

    it('maps PARTIALLY_PAID status accurately with balance', async () => {
      // Create temporary invoice with partial payment
      const pInvoice = await db.invoice.create({
        data: {
          tenantId: tenantAId,
          branchId: branchAId,
          studentId: studentAId,
          invoiceNumber: `INV-PARTIAL-${Date.now().toString().slice(-4)}`,
          title: 'Partial Fee Invoice',
          subtotalCents: 2000000,
          discountCents: 0,
          totalCents: 2000000,
          paidCents: 1000000,
          balanceCents: 1000000,
          status: 'PARTIALLY_PAID',
          dueDate: new Date(),
        },
      })

      const pPayment = await db.payment.create({
        data: {
          tenantId: tenantAId,
          studentId: studentAId,
          invoiceId: pInvoice.id,
          paymentNumber: `PAY-PARTIAL-${Date.now().toString().slice(-4)}`,
          amountCents: 1000000,
          method: 'UPI',
          paymentDate: new Date(),
        },
      })

      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        pPayment.id,
        'PAYMENT'
      )
      expect(context['finance.paymentStatus']).toBe('PARTIALLY PAID')
      expect(context['finance.balanceAmount']).toBe('₹10,000.00')

      // Clean up
      await db.payment.delete({ where: { id: pPayment.id } })
      await db.invoice.delete({ where: { id: pInvoice.id } })
    })
  })

  describe('5. Itemized Fee Table & Database Data Integrity (E5)', () => {
    it('resolves live itemized invoice items into dynamic table.rows', async () => {
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        paymentAId,
        'PAYMENT'
      )

      expect(context['table.rows']).toBeDefined()
      expect(Array.isArray(context['table.rows'])).toBe(true)
      expect(context['table.rows'].length).toBe(3)

      const items = context['table.rows'] as any[]
      expect(items[0].item).toContain('Early Years Learning')
      expect(items[0].amount).toBe('₹16,500.00')
      expect(items[1].item).toContain('Organic Nutrition')
      expect(items[1].amount).toBe('₹5,000.00')
      expect(items[2].item).toContain('Phonics Activity Kit')
      expect(items[2].amount).toBe('₹3,000.00')

      // Check financial arithmetic
      expect(context['finance.subtotalAmount']).toBe('₹24,500.00')
      expect(context['finance.discountAmount']).toBe('₹2,000.00')
      expect(context['finance.totalAmount']).toBe('₹22,500.00')
      expect(context['finance.paidAmount']).toBe('₹22,500.00')
      expect(context['finance.balanceAmount']).toBe('₹0.00')
      expect(context['finance.amountInWords']).toBe('Rupees Twenty Two Thousand Five Hundred Only')
    })
  })

  describe('6. Live Payment Search & Record Resolution in Studio', () => {
    it('searches live payment records with fee metadata', async () => {
      const records = await TemplateDataResolver.searchRecords(
        tenantAId,
        'FEE_RECEIPT',
        '',
        10,
        branchAId
      )

      expect(records.length).toBeGreaterThanOrEqual(1)
      const payRecord = records.find((r) => r.type === 'PAYMENT' && r.id === paymentAId)
      expect(payRecord).toBeDefined()
      expect(payRecord?.title).toContain('Vivaan Deshmukh')
      expect(payRecord?.title).toContain('₹22,500.00')
      expect(payRecord?.metadata?.receiptNumber).toBeDefined()
    })
  })

  describe('7. Secure Authenticity Verification QR (E6)', () => {
    it('generates authenticity verification URL and never fake VPAs', async () => {
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        paymentAId,
        'PAYMENT'
      )

      const receiptNumber = context['finance.receiptNumber']
      const thermalQr = TEMPLATE_PRESETS['FEE_RECEIPT_THERMAL'].definition.elements.find(
        (e) => e.type === 'qrcode'
      )
      const institutionalQr = TEMPLATE_PRESETS['FEE_RECEIPT_INSTITUTIONAL'].definition.elements.find(
        (e) => e.type === 'qrcode'
      )

      expect(thermalQr).toBeDefined()
      expect(institutionalQr).toBeDefined()

      const resolvedThermal = resolveTokens(thermalQr!.content, context)
      const resolvedInst = resolveTokens(institutionalQr!.content, context)

      expect(resolvedThermal).toBe(`https://preone.school/verify/receipt/${receiptNumber}`)
      expect(resolvedInst).toBe(`https://preone.school/verify/receipt/${receiptNumber}`)

      // Must NEVER invent fake VPAs
      expect(resolvedThermal).not.toContain('fake@')
      expect(resolvedThermal).not.toContain('okhdfcbank')
      expect(resolvedInst).not.toContain('fake@')
    })
  })

  describe('8. Tenant Branding & Field Integration (E7)', () => {
    it('binds Tenant A legal identity and contact info accurately', async () => {
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        paymentAId,
        'PAYMENT'
      )

      expect(context['school.name']).toBe('Little Explorers Preschool Academy')
      expect(context['school.address']).toBe('42 Lotus Blossom Road, Indiranagar')
      expect(context['school.city']).toBe('Bengaluru')
      expect(context['school.phone']).toBe('+91 98450 11223')
      expect(context['school.email']).toBe('accounts@littleexplorers.edu.in')
      expect(context['school.gstNumber']).toBe('29ABCDE1234F1Z5')
      expect(context['school.logoUrl']).toBe('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120')
    })
  })

  describe('9. PDF Rendering & Single-Page Invariants (E8)', () => {
    it('compiles E2 Compact Thermal receipt into valid single-page PDF', async () => {
      const def = JSON.parse(JSON.stringify(TEMPLATE_PRESETS['FEE_RECEIPT_THERMAL'].definition))
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        paymentAId,
        'PAYMENT'
      )

      const html = await TemplateService.renderTemplateHtml(def, context)
      expect(html).toContain('Little Explorers Preschool Academy')
      expect(html).toContain('TOTAL PAID: ₹22,500.00')

      const result = await PdfService.generatePdf({
        definition: def,
        dataContext: context,
      })
      const pdfBuffer = result.buffer

      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(500)
      expect(result.pageCount).toBe(1)
      const header = pdfBuffer.subarray(0, 5).toString('utf-8')
      expect(header).toBe('%PDF-')
    }, 45000)

    it('compiles E3 Institutional A4 receipt into valid single-page PDF without multi-page spill', async () => {
      const def = JSON.parse(JSON.stringify(TEMPLATE_PRESETS['FEE_RECEIPT_INSTITUTIONAL'].definition))
      const context = await TemplateDataResolver.resolveDataContext(
        tenantAId,
        'FEE_RECEIPT',
        paymentAId,
        'PAYMENT'
      )

      const html = await TemplateService.renderTemplateHtml(def, context)
      expect(html).toContain('OFFICIAL FEE RECEIPT & REVENUE VOUCHER')
      expect(html).toContain('Rupees Twenty Two Thousand Five Hundred Only')

      const result = await PdfService.generatePdf({
        definition: def,
        dataContext: context,
      })
      const pdfBuffer = result.buffer

      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(1000)
      expect(result.pageCount).toBe(1)
      const header = pdfBuffer.subarray(0, 5).toString('utf-8')
      expect(header).toBe('%PDF-')
    }, 45000)
  })

  describe('10. Lifecycle Publishing & Default Assignment', () => {
    it('publishes and assigns default fee receipt template', async () => {
      const template = await TemplateService.createTemplate(tenantAId, {
        name: 'Annual Official Receipt Form',
        type: 'FEE_RECEIPT',
        presetKey: 'FEE_RECEIPT_INSTITUTIONAL',
      })

      const published = await TemplateService.publishTemplate(
        tenantAId,
        template.id,
        'Director Meenakshi'
      )
      expect(published.content.status).toBe('PUBLISHED')
      expect(published.content.publishedBy).toBe('Director Meenakshi')

      const assigned = await TemplateService.assignDefaultTemplate(tenantAId, template.id)
      expect(assigned.isDefault).toBe(true)
    })
  })
})
