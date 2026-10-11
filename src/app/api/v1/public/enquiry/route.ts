import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { LeadSource } from '@prisma/client'
import { emailService } from '@/lib/email/email-service'

/**
 * Public Enquiry API
 * Accessible without staff authentication.
 * Safely resolves tenant, branch, generates sequential Lead, and runs duplicate protection.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const tenantSlug = sp.get('tenant')

    // Find tenant by slug or take default first active tenant
    const tenant = tenantSlug
      ? await db.tenant.findUnique({ where: { slug: tenantSlug } })
      : await db.tenant.findFirst({ orderBy: { createdAt: 'asc' } })

    if (!tenant) {
      return Errors.notFound('School not found')
    }

    // Load available branches for parent selection
    const branches = await db.branch.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      select: { id: true, name: true, isMain: true },
      orderBy: { isMain: 'desc' },
    })

    // Load available programs
    const programs = await db.program.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true, code: true, name: true, programType: true },
    })

    return ok({
      schoolName: tenant.name,
      branches,
      programs,
    })
  } catch (e) {
    return Errors.system(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      parentName,
      phone,
      email,
      childName,
      childDob,
      branchId,
      interestedProgram,
      notes,
      source,
    } = body

    if (!parentName?.trim()) {
      return Errors.validation([{ field: 'parentName', message: 'Parent name is required' }])
    }

    const cleanPhone = (phone || '').trim().replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return Errors.validation([{ field: 'phone', message: 'Valid 10-digit mobile number is required' }])
    }

    // Resolve tenant safely from branchId or first active tenant
    let targetTenantId: string | null = null
    let targetBranchId: string | null = null

    if (branchId) {
      const branch = await db.branch.findFirst({
        where: { id: branchId, deletedAt: null },
        select: { id: true, tenantId: true },
      })
      if (branch) {
        targetTenantId = branch.tenantId
        targetBranchId = branch.id
      }
    }

    if (!targetTenantId) {
      const tenant = await db.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!tenant) return Errors.badRequest('No school configured')
      targetTenantId = tenant.id
      const mainBranch = await db.branch.findFirst({
        where: { tenantId: tenant.id, deletedAt: null },
        orderBy: { isMain: 'desc' },
      })
      targetBranchId = mainBranch?.id || null
    }

    // Duplicate protection check
    const existingLead = await db.lead.findFirst({
      where: {
        tenantId: targetTenantId,
        deletedAt: null,
        phone: { contains: cleanPhone.slice(-10) },
      },
    })

    if (existingLead) {
      // Append follow-up / note rather than creating unwanted duplicate
      return ok({
        leadNumber: existingLead.leadNumber,
        status: existingLead.status,
        isExisting: true,
        message: 'Thank you! Your inquiry is already registered. Our admissions counselor will contact you shortly.',
      })
    }

    // Generate sequential lead number
    const year = new Date().getFullYear()
    const count = await db.lead.count({ where: { tenantId: targetTenantId } })
    const leadNumber = `ENQ-${year}-${String(count + 1).padStart(4, '0')}`

    const parsedDob = childDob ? new Date(childDob) : null
    const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : null

    const lead = await db.lead.create({
      data: {
        tenantId: targetTenantId,
        branchId: targetBranchId,
        leadNumber,
        parentName: parentName.trim(),
        phone: cleanPhone,
        email: email?.trim() || null,
        childName: childName?.trim() || null,
        childDob: validDob,
        interestedProgram: interestedProgram || null,
        source: LeadSource.WEBSITE,
        status: 'NEW',
        notes: notes ? `[Public Form Submission] ${notes.trim()}` : '[Public Form Submission]',
      },
    })

    if (lead.email) {
      emailService
        .send({
          to: lead.email,
          subject: `Enquiry Acknowledgement — ${lead.leadNumber}`,
          html: `<div style="font-family:sans-serif;padding:24px;"><h2>Thank You for Your Enquiry</h2><p>Dear ${lead.parentName},</p><p>We have received your admission enquiry for <strong>${lead.childName || 'your child'}</strong> (Reference: <strong>${lead.leadNumber}</strong>).</p><p>Our admissions counselor will review the details and contact you shortly.</p></div>`,
          text: `Dear ${lead.parentName},\n\nWe have received your enquiry (Ref: ${lead.leadNumber}). Our counselor will contact you shortly.`,
          tenantId: targetTenantId,
        })
        .catch(() => {})
    }

    return ok({
      leadNumber: lead.leadNumber,
      message: 'Thank you! We have received your inquiry. Our team will get in touch with you soon.',
    })
  } catch (e) {
    return Errors.system(e)
  }
}
