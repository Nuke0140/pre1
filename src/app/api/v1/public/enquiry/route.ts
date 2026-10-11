import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { LeadSource, ProgramType } from '@prisma/client'
import { emailService } from '@/lib/email/email-service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * Public Enquiry API
 * Accessible without staff authentication.
 * Safely resolves tenant, branch, validates inputs, checks rate limits,
 * generates sequential Lead, and enforces duplicate protection.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const tenantCode = sp.get('schoolCode') || sp.get('tenantCode') || sp.get('code')
    const branchId = sp.get('branchId')

    let tenant = null

    // 1. If branchId is provided, resolve tenant securely from the branch
    if (branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all') {
      const branch = await db.branch.findFirst({
        where: { id: branchId, deletedAt: null },
        include: { tenant: true },
      })
      if (branch) {
        tenant = branch.tenant
      }
    }

    // 2. If schoolCode is provided, resolve tenant by unique school code
    if (!tenant && tenantCode) {
      tenant = await db.tenant.findUnique({
        where: { code: tenantCode.trim().toUpperCase() },
      })
    }

    // 3. Fallback to default active tenant
    if (!tenant) {
      tenant = await db.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      })
    }

    if (!tenant) {
      return Errors.notFound('School not found')
    }

    // Load available branches for parent selection
    const branches = await db.branch.findMany({
      where: { tenantId: tenant.id, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true, isMain: true },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    })

    // Load available programs (respecting branch filtering if branchId is supplied)
    const programs = await db.program.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        deletedAt: null,
        ...(branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all'
          ? {
              OR: [
                { branchMappings: { some: { branchId, deletedAt: null, isActive: true } } },
                { branchMappings: { none: {} } }, // Programs with no specific branch mappings are offered universally across branches
              ],
            }
          : {}),
      },
      select: { id: true, code: true, name: true, programType: true },
      orderBy: { name: 'asc' },
    })

    return ok({
      schoolName: tenant.name,
      schoolCode: tenant.code,
      branches,
      programs,
    })
  } catch (e) {
    return Errors.system(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: 10 submissions per minute per IP to prevent spam & abuse
    const rl = await checkRateLimit(req, {
      windowMs: 60 * 1000,
      max: 10,
      keyPrefix: 'rl:public-enquiry',
    })
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterSeconds, 'Too many enquiry submissions. Please wait a moment before trying again.')
    }

    const body = await req.json()
    const {
      parentName,
      phone,
      email,
      childName,
      childDob,
      branchId,
      schoolCode,
      interestedProgram,
      notes,
    } = body

    // 2. Server-side validation of required fields
    if (!parentName || typeof parentName !== 'string' || !parentName.trim()) {
      return Errors.validation([{ field: 'parentName', message: 'Parent name is required' }])
    }
    if (parentName.trim().length > 150) {
      return Errors.validation([{ field: 'parentName', message: 'Parent name cannot exceed 150 characters' }])
    }

    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return Errors.validation([{ field: 'phone', message: 'Valid 10-digit mobile number is required' }])
    }
    if (cleanPhone.length > 15) {
      return Errors.validation([{ field: 'phone', message: 'Phone number cannot exceed 15 digits' }])
    }

    // Validate email format if provided
    let normEmail: string | null = null
    if (email && typeof email === 'string' && email.trim()) {
      normEmail = email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normEmail) || normEmail.length > 255) {
        return Errors.validation([{ field: 'email', message: 'Please provide a valid email address' }])
      }
    }

    // 3. Resolve tenant & branch securely
    let targetTenantId: string | null = null
    let targetBranchId: string | null = null

    // If branchId is supplied, verify it exists and derive tenantId from the database
    if (branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all') {
      const branch = await db.branch.findFirst({
        where: { id: branchId, deletedAt: null },
        select: { id: true, tenantId: true },
      })
      if (branch) {
        targetTenantId = branch.tenantId
        targetBranchId = branch.id
      }
    }

    // If schoolCode is supplied and tenant is not resolved yet, verify school code
    if (!targetTenantId && schoolCode && typeof schoolCode === 'string' && schoolCode.trim()) {
      const tenant = await db.tenant.findUnique({
        where: { code: schoolCode.trim().toUpperCase() },
        select: { id: true },
      })
      if (tenant) {
        targetTenantId = tenant.id
      }
    }

    // Fallback: resolve to default active school
    if (!targetTenantId) {
      const defaultTenant = await db.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      if (!defaultTenant) {
        return Errors.badRequest('No school configured')
      }
      targetTenantId = defaultTenant.id
    }

    // If targetBranchId is not set, resolve to tenant's main branch or first active branch
    if (!targetBranchId) {
      const mainBranch = await db.branch.findFirst({
        where: { tenantId: targetTenantId, deletedAt: null, isActive: true },
        orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
        select: { id: true },
      })
      targetBranchId = mainBranch?.id || null
    }

    // 4. Validate program against target branch if specified
    let validatedProgram: ProgramType | null = null
    if (interestedProgram) {
      const validPrograms: ProgramType[] = ['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE']
      const normalizedProgram = String(interestedProgram).toUpperCase()
      let progCandidate: any = null

      if (validPrograms.includes(normalizedProgram as ProgramType)) {
        progCandidate = await db.program.findFirst({
          where: {
            tenantId: targetTenantId,
            programType: normalizedProgram as ProgramType,
            deletedAt: null,
            isActive: true,
          },
          include: {
            branchMappings: {
              where: targetBranchId ? { branchId: targetBranchId, deletedAt: null, isActive: true } : { deletedAt: null, isActive: true },
            },
          },
        })
      }

      if (!progCandidate) {
        progCandidate = await db.program.findFirst({
          where: {
            tenantId: targetTenantId,
            deletedAt: null,
            isActive: true,
            OR: [
              { id: interestedProgram },
              { code: normalizedProgram },
              { name: { equals: interestedProgram, mode: 'insensitive' } },
            ],
          },
          include: {
            branchMappings: {
              where: targetBranchId ? { branchId: targetBranchId, deletedAt: null, isActive: true } : { deletedAt: null, isActive: true },
            },
          },
        })
      }

      if (!progCandidate) {
        return Errors.validation([{ field: 'interestedProgram', message: `Selected program is not configured for this school.` }])
      }

      // Check branch association if targetBranchId is resolved
      if (targetBranchId && progCandidate.branchMappings.length === 0) {
        const totalBranchMappings = await db.programBranch.count({
          where: { programId: progCandidate.id, tenantId: targetTenantId, deletedAt: null, isActive: true },
        })
        if (totalBranchMappings > 0) {
          return Errors.validation([{ field: 'interestedProgram', message: `Program ${progCandidate.name} is not offered at the selected campus.` }])
        }
      }

      validatedProgram = progCandidate.programType
    }

    // 5. Duplicate protection check (10-digit normalized phone match within tenant)
    // If the enquiry has the exact same child or was recently submitted, return existing reference.
    // If notes or new child are provided, update existing lead notes to append new interest.
    const existingLead = await db.lead.findFirst({
      where: {
        tenantId: targetTenantId,
        deletedAt: null,
        phone: { contains: cleanPhone.slice(-10) },
      },
    })

    if (existingLead) {
      if (notes || childName) {
        const updateText = `\n[Follow-up Online Submission] Child: ${childName || 'Not specified'} | Notes: ${notes || 'None'}`
        await db.lead.update({
          where: { id: existingLead.id },
          data: {
            notes: (existingLead.notes || '') + updateText,
          },
        }).catch(() => {})
      }

      return ok({
        leadNumber: existingLead.leadNumber,
        status: existingLead.status,
        isExisting: true,
        message: 'Thank you! Your inquiry is already registered. Our admissions counselor will contact you shortly.',
      })
    }

    // 6. Generate sequential lead number
    const year = new Date().getFullYear()
    const count = await db.lead.count({ where: { tenantId: targetTenantId } })
    const leadNumber = `ENQ-${year}-${String(count + 1).padStart(4, '0')}`

    const parsedDob = childDob ? new Date(childDob) : null
    const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : null

    // 7. Persist lead under resolved tenant and branch
    const lead = await db.lead.create({
      data: {
        tenantId: targetTenantId,
        branchId: targetBranchId,
        leadNumber,
        parentName: parentName.trim(),
        phone: cleanPhone,
        email: normEmail,
        childName: childName && typeof childName === 'string' ? childName.trim().slice(0, 150) : null,
        childDob: validDob,
        interestedProgram: validatedProgram,
        source: LeadSource.WEBSITE,
        status: 'NEW',
        notes: notes && typeof notes === 'string' && notes.trim()
          ? `[Public Form Submission] ${notes.trim().slice(0, 1000)}`
          : '[Public Form Submission]',
      },
    })

    // 8. Asynchronous email acknowledgement
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
