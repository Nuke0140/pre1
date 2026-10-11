import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { LeadSource, ProgramType } from '@prisma/client'
import { emailService } from '@/lib/email/email-service'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getEffectiveBranding } from '@/lib/branding-service'

/**
 * Normalizes an Indian or international phone number to the standard E.164 digits format
 * suitable for WhatsApp wa.me links. Returns null if invalid or unconfigured.
 */
export function normalizeWhatsAppNumber(rawPhone?: string | null): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null
  let digits = rawPhone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  if (digits.length === 10) {
    return `91${digits}`
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits
  }
  return null
}

/**
 * Derives available shifts for a campus based on operating hours and program type.
 */
export function getAvailableShifts(
  timingOpen?: string | null,
  timingClose?: string | null,
  programType?: string | null
) {
  const openTime = timingOpen?.trim() || '08:30 AM'
  const isDaycare = programType === 'DAYCARE'

  if (isDaycare) {
    return [
      { id: 'FULL_DAY', name: 'Full Day (Daycare)', timings: `${openTime} – 05:30 PM` },
      { id: 'HALF_DAY_MORNING', name: 'Half Day Morning', timings: `${openTime} – 01:00 PM` },
      { id: 'HALF_DAY_AFTERNOON', name: 'Half Day Afternoon', timings: '12:30 PM – 05:30 PM' },
    ]
  }

  return [
    { id: 'MORNING', name: 'Morning Shift', timings: `${openTime} – 11:30 AM` },
    { id: 'AFTERNOON', name: 'Afternoon Shift', timings: '12:00 PM – 03:00 PM' },
    { id: 'REGULAR', name: 'Regular Day', timings: `${openTime} – 01:00 PM` },
  ]
}

/**
 * Public Enquiry API
 * Accessible without staff authentication.
 * Safely resolves tenant, school branding, active academic session,
 * campus branches, campus-specific programs, shifts, rate limits, and WhatsApp contact.
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

    // 4. Resolve institution branding via canonical branding service
    const branding = await getEffectiveBranding(tenant.id)

    // 5. Load active academic admission session
    const activeSession =
      (await db.academicSession.findFirst({
        where: { tenantId: tenant.id, isCurrent: true, status: 'ACTIVE' },
        orderBy: { startDate: 'desc' },
        select: { id: true, name: true, startDate: true, endDate: true },
      })) ||
      (await db.academicSession.findFirst({
        where: { tenantId: tenant.id, status: 'ACTIVE' },
        orderBy: { startDate: 'desc' },
        select: { id: true, name: true, startDate: true, endDate: true },
      }))

    // 6. Load available branches for parent selection with public address and contact details
    const branches = await db.branch.findMany({
      where: { tenantId: tenant.id, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        isMain: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        timingOpen: true,
        timingClose: true,
      },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    })

    // Selected branch context (if valid)
    const selectedBranch = branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all'
      ? branches.find((b) => b.id === branchId) || null
      : branches.length === 1
      ? branches[0]
      : null

    // 7. Load available programs (respecting branch filtering if branchId is supplied)
    const programs = await db.program.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        deletedAt: null,
        ...(selectedBranch
          ? {
              OR: [
                { branchMappings: { some: { branchId: selectedBranch.id, deletedAt: null, isActive: true } } },
                { branchMappings: { none: {} } }, // Universal programs offered across all campuses
              ],
            }
          : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        programType: true,
        description: true,
        ageMinMonths: true,
        ageMaxMonths: true,
        durationMonths: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // 8. Resolve available shifts for the campus
    const shifts = getAvailableShifts(
      selectedBranch?.timingOpen,
      selectedBranch?.timingClose
    )

    // 9. Resolve WhatsApp Business number
    const campusOrSchoolPhone = selectedBranch?.phone || tenant.phone
    const whatsAppNumber = normalizeWhatsAppNumber(campusOrSchoolPhone)

    return ok({
      schoolName: tenant.name,
      schoolCode: tenant.code,
      logoUrl: branding.logoUrl || tenant.logoUrl || null,
      bannerUrl: branding.bannerUrl || null,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      academicSession: activeSession
        ? {
            id: activeSession.id,
            name: activeSession.name,
          }
        : null,
      schoolContact: {
        address: tenant.address,
        city: tenant.city,
        state: tenant.state,
        pincode: tenant.pincode,
        phone: tenant.phone,
        email: tenant.email,
        website: tenant.website,
      },
      whatsAppNumber,
      branches,
      selectedBranchId: selectedBranch?.id || null,
      programs,
      shifts,
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
      return rateLimitResponse(
        rl.retryAfterSeconds,
        'Too many enquiry submissions. Please wait a moment before trying again.'
      )
    }

    const body = await req.json()
    const {
      parentName,
      phone,
      email,
      childName,
      childDob,
      branchId,
      academicSessionId,
      schoolCode,
      interestedProgram,
      preferredShift,
      notes,
      consentGiven,
    } = body

    // 2. Server-side validation of required parent details
    if (!parentName || typeof parentName !== 'string' || !parentName.trim()) {
      return Errors.validation([{ field: 'parentName', message: 'Parent / Guardian name is required' }])
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

    // Validate child date of birth
    if (!childDob) {
      return Errors.validation([{ field: 'childDob', message: 'Child date of birth is required' }])
    }
    const parsedDob = new Date(childDob)
    if (isNaN(parsedDob.getTime())) {
      return Errors.validation([{ field: 'childDob', message: 'Please provide a valid date of birth' }])
    }
    if (parsedDob > new Date()) {
      return Errors.validation([{ field: 'childDob', message: 'Child date of birth cannot be in the future' }])
    }

    // Validate consent
    if (consentGiven !== true) {
      return Errors.validation([
        {
          field: 'consentGiven',
          message: 'Please consent to be contacted regarding this enquiry before submitting.',
        },
      ])
    }

    // 3. Resolve tenant & branch securely
    let targetTenant: any = null
    let targetBranch: any = null

    // If branchId is supplied, verify it exists and derive tenant securely
    if (branchId && branchId !== '__ALL_BRANCHES__' && branchId !== 'all') {
      targetBranch = await db.branch.findFirst({
        where: { id: branchId, deletedAt: null, isActive: true },
        include: { tenant: true },
      })
      if (targetBranch) {
        targetTenant = targetBranch.tenant
      } else {
        return Errors.validation([{ field: 'branchId', message: 'Selected campus is not valid or currently inactive.' }])
      }
    }

    // If schoolCode is supplied and tenant is not resolved yet, verify school code
    if (!targetTenant && schoolCode && typeof schoolCode === 'string' && schoolCode.trim()) {
      targetTenant = await db.tenant.findUnique({
        where: { code: schoolCode.trim().toUpperCase() },
      })
    }

    // Fallback: resolve to default active school
    if (!targetTenant) {
      targetTenant = await db.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      })
      if (!targetTenant) {
        return Errors.badRequest('No school configured')
      }
    }

    // If targetBranch is not yet set, resolve to tenant's main branch or first active branch
    if (!targetBranch) {
      targetBranch = await db.branch.findFirst({
        where: { tenantId: targetTenant.id, deletedAt: null, isActive: true },
        orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
      })
    }

    // 4. Validate program against target branch and school
    if (!interestedProgram || typeof interestedProgram !== 'string' || !interestedProgram.trim()) {
      return Errors.validation([{ field: 'interestedProgram', message: 'Please select an academic program / class.' }])
    }

    const validProgramTypes: ProgramType[] = ['PLAYGROUP', 'NURSERY', 'LKG', 'UKG', 'DAYCARE']
    const normalizedProgram = String(interestedProgram).toUpperCase()
    let progCandidate: any = null

    if (validProgramTypes.includes(normalizedProgram as ProgramType)) {
      progCandidate = await db.program.findFirst({
        where: {
          tenantId: targetTenant.id,
          programType: normalizedProgram as ProgramType,
          deletedAt: null,
          isActive: true,
        },
        include: {
          branchMappings: {
            where: targetBranch
              ? { branchId: targetBranch.id, deletedAt: null, isActive: true }
              : { deletedAt: null, isActive: true },
          },
        },
      })
    }

    if (!progCandidate) {
      progCandidate = await db.program.findFirst({
        where: {
          tenantId: targetTenant.id,
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
            where: targetBranch
              ? { branchId: targetBranch.id, deletedAt: null, isActive: true }
              : { deletedAt: null, isActive: true },
          },
        },
      })
    }

    if (!progCandidate) {
      return Errors.validation([
        { field: 'interestedProgram', message: `Selected program is not configured for this school.` },
      ])
    }

    // Check campus offering eligibility
    if (targetBranch && progCandidate.branchMappings.length === 0) {
      const totalBranchMappings = await db.programBranch.count({
        where: { programId: progCandidate.id, tenantId: targetTenant.id, deletedAt: null, isActive: true },
      })
      if (totalBranchMappings > 0) {
        return Errors.validation([
          {
            field: 'interestedProgram',
            message: `Program ${progCandidate.name} is not offered at the ${targetBranch.name} campus.`,
          },
        ])
      }
    }

    const validatedProgram: ProgramType = progCandidate.programType

    // 5. Validate academic session
    let targetSessionName: string | null = null
    if (academicSessionId) {
      const sessionRow = await db.academicSession.findFirst({
        where: { id: academicSessionId, tenantId: targetTenant.id },
      })
      if (sessionRow) {
        targetSessionName = sessionRow.name
      }
    }
    if (!targetSessionName) {
      const activeSession = await db.academicSession.findFirst({
        where: { tenantId: targetTenant.id, isCurrent: true, status: 'ACTIVE' },
      })
      targetSessionName = activeSession?.name || null
    }

    // 6. Validate shift selection against available shifts
    const availableShifts = getAvailableShifts(
      targetBranch?.timingOpen,
      targetBranch?.timingClose,
      validatedProgram
    )
    let validatedShiftName: string | null = null
    if (preferredShift && typeof preferredShift === 'string' && preferredShift.trim()) {
      const match = availableShifts.find(
        (s) => s.id === preferredShift.trim() || s.name.toLowerCase() === preferredShift.trim().toLowerCase()
      )
      validatedShiftName = match ? `${match.name} (${match.timings})` : preferredShift.trim()
    }

    // 7. Resolve WhatsApp Business number for post-submission CTA
    const whatsAppNumber = normalizeWhatsAppNumber(targetBranch?.phone || targetTenant.phone)

    // 8. Duplicate protection check (10-digit normalized phone match within tenant)
    const existingLead = await db.lead.findFirst({
      where: {
        tenantId: targetTenant.id,
        deletedAt: null,
        phone: { contains: cleanPhone.slice(-10) },
      },
    })

    if (existingLead) {
      if (notes || childName || validatedShiftName) {
        const updateText = `\n[Follow-up Online Submission] Program: ${progCandidate.name} | Shift: ${validatedShiftName || 'Not specified'} | Child: ${childName || 'Not specified'} | Notes: ${notes || 'None'}`
        await db.lead
          .update({
            where: { id: existingLead.id },
            data: {
              notes: (existingLead.notes || '') + updateText,
            },
          })
          .catch(() => {})
      }

      return ok({
        leadNumber: existingLead.leadNumber,
        schoolName: targetTenant.name,
        campusName: targetBranch?.name || null,
        whatsAppNumber,
        status: existingLead.status,
        isExisting: true,
        message: 'Thank you! Your inquiry is already registered. Our admissions counselor will contact you shortly.',
      })
    }

    // 9. Generate sequential lead number
    const year = new Date().getFullYear()
    const count = await db.lead.count({ where: { tenantId: targetTenant.id } })
    const leadNumber = `ENQ-${year}-${String(count + 1).padStart(4, '0')}`

    // 10. Persist lead under resolved tenant and branch
    const notesSummary = [
      `[Public Enquiry Portal]`,
      targetSessionName ? `Academic Session: ${targetSessionName}` : null,
      `Program: ${progCandidate.name} (${progCandidate.programType})`,
      validatedShiftName ? `Preferred Shift: ${validatedShiftName}` : null,
      `Consent: Verified on ${new Date().toISOString()}`,
      notes && typeof notes === 'string' && notes.trim() ? `Parent Message: ${notes.trim().slice(0, 1000)}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const lead = await db.lead.create({
      data: {
        tenantId: targetTenant.id,
        branchId: targetBranch?.id || null,
        leadNumber,
        parentName: parentName.trim(),
        phone: cleanPhone,
        email: normEmail,
        childName: childName && typeof childName === 'string' ? childName.trim().slice(0, 150) : null,
        childDob: parsedDob,
        interestedProgram: validatedProgram,
        source: LeadSource.WEBSITE,
        status: 'NEW',
        notes: notesSummary,
      },
    })

    // 11. Asynchronous email acknowledgement
    if (lead.email) {
      emailService
        .send({
          to: lead.email,
          subject: `Enquiry Acknowledgement — ${lead.leadNumber}`,
          html: `<div style="font-family:sans-serif;padding:24px;"><h2>Thank You for Your Enquiry</h2><p>Dear ${lead.parentName},</p><p>We have received your admission enquiry for <strong>${lead.childName || 'your child'}</strong> for the <strong>${progCandidate.name}</strong> program (Reference: <strong>${lead.leadNumber}</strong>).</p><p>Our admissions counselor at <strong>${targetTenant.name}</strong> will review the details and contact you shortly.</p></div>`,
          text: `Dear ${lead.parentName},\n\nWe have received your enquiry for ${lead.childName || 'your child'} (Ref: ${lead.leadNumber}). Our counselor will contact you shortly.`,
          tenantId: targetTenant.id,
        })
        .catch(() => {})
    }

    return ok({
      leadNumber: lead.leadNumber,
      schoolName: targetTenant.name,
      campusName: targetBranch?.name || null,
      whatsAppNumber,
      message: 'Thank you! We have received your inquiry. Our team will get in touch with you soon.',
    })
  } catch (e) {
    return Errors.system(e)
  }
}

