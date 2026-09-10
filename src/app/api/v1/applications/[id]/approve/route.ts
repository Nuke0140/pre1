import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { audit, nextNumber } from '@/lib/sequence'
import { emit } from '@/lib/events'
import { registerIntegrations } from '@/lib/integrations'
import { getDomainConfig, getAdmissionConfig } from '@/lib/config'
import { classroomSeats } from '@/lib/capacity'

/**
 * POST /api/v1/applications/{id}/approve — Admission approval.
 * Fans out (PRD journey B): Student created → classroom enrolled →
 * first fee invoice raised. All in ONE transaction (doc-mandated).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApi(req, 'admissions:approve')
  if (isResponse(session)) return session
  const { id } = await params
  registerIntegrations()

  try {
    const app = await db.admissionApplication.findUnique({ where: { id } })
    if (!app) return Errors.notFound('Application')
    if (app.status === 'ENROLLED') return Errors.conflict('Application already enrolled')
    if (!['VERIFIED', 'UNDER_REVIEW'].includes(app.status)) {
      return Errors.conflict('Documents must be verified before approval')
    }

    const body = await req.json().catch(() => ({}))
    const classroomId: string | undefined = body.classroomId

    // M00 ADMISSION config is the source of truth for required documents
    const admCfg = getAdmissionConfig(await getDomainConfig(session.tenantId!, 'ADMISSION'))
    const requiredDocs: string[] = admCfg.requiredDocuments || []
    if (requiredDocs.length > 0) {
      const docs = await db.applicationDocument.findMany({ where: { applicationId: id } })
      const missing = requiredDocs.filter(
        (d) => d !== 'PREVIOUS_SCHOOL_REPORT' && !docs.some((doc) => doc.docType === d && doc.verified)
      )
      if (missing.length > 0) {
        return Errors.business(
          'BUSINESS_DOCS_PENDING',
          `Required documents not verified: ${missing.join(', ')}. Verify before approval.`
        )
      }
    }

    const classroom = classroomId
      ? await db.classroom.findFirst({ where: { id: classroomId, tenantId: session.tenantId! } })
      : await db.classroom.findFirst({
          where: { tenantId: session.tenantId!, programType: app.programType, isActive: true },
        })
    if (!classroom) {
      return Errors.business(
        'BUSINESS_NO_CLASSROOM',
        `No active classroom found for program ${app.programType}. Create one in Settings first.`
      )
    }

    const capacity = await db.student.count({
      where: { currentClassroomId: classroom.id, status: 'ACTIVE' },
    })
    if (capacity >= classroom.capacity) {
      return Errors.business(
        'BUSINESS_CLASS_FULL',
        `Classroom ${classroom.name} is at full capacity (${capacity}/${classroom.capacity}). Waitlist the application or allocate another section.`
      )
    }
    void classroomSeats // capacity surfaced in response below

    const result = await db.$transaction(async (tx) => {
      const studentCount = await tx.student.count({ where: { tenantId: session.tenantId! } })
      const admissionNo = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, '0')}`

      const student = await tx.student.create({
        data: {
          tenantId: session.tenantId!,
          branchId: app.branchId,
          admissionNo,
          firstName: app.childFirstName,
          lastName: app.childLastName,
          dob: app.childDob,
          gender: app.childGender,
          admissionDate: new Date(),
          currentClassroomId: classroom!.id,
        },
      })

      // guardian
      const guardian = await tx.guardian.create({
        data: {
          tenantId: session.tenantId!,
          fullName: app.parentName,
          phone: app.parentPhone,
          email: app.parentEmail,
          relationship: 'MOTHER',
          isPrimaryContact: true,
        },
      })
      await tx.studentGuardian.create({
        data: { studentId: student.id, guardianId: guardian.id, isPrimary: true, canPickup: true, isFeePayer: true },
      })

      // first invoice from fee plan
      const feePlan = await tx.feePlan.findFirst({
        where: { tenantId: session.tenantId!, programType: app.programType, isActive: true },
        include: { items: true },
      })

      let invoice: { id: string; invoiceNumber: string; totalCents: number; dueDate: Date } | null = null
      if (feePlan) {
        const admissionItem = feePlan.items.find((i) => i.feeHead === 'ADMISSION')
        const items = admissionItem
          ? [admissionItem, ...feePlan.items.filter((i) => i.feeHead !== 'ADMISSION')]
          : feePlan.items
        const subtotal = items.reduce((s, i) => s + i.amountCents, 0)
        const invoiceNumber = await nextNumber('invoice', session.tenantId!)
        const finCfg = await getDomainConfig(session.tenantId!, 'FINANCE')
        const dueOffset = Number(finCfg.dueDayOffset) > 0 ? Number(finCfg.dueDayOffset) : 15
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + dueOffset)

        invoice = await tx.invoice.create({
          data: {
            tenantId: session.tenantId!,
            branchId: app.branchId,
            studentId: student.id,
            invoiceNumber,
            title: `${feePlan.name} — Admission Invoice`,
            dueDate,
            subtotalCents: subtotal,
            totalCents: subtotal,
            balanceCents: subtotal,
            status: 'ISSUED',
            issuedById: session.uid,
            academicSessionId: classroom.academicSessionId,
            items: {
              create: items.map((i) => ({
                feeHead: i.feeHead,
                description: i.label,
                amountCents: i.amountCents,
              })),
            },
          },
        })
      }

      // M01: allocation history row (mutable per AY, never overwritten)
      await tx.studentAllocation.create({
        data: {
          tenantId: session.tenantId!,
          studentId: student.id,
          academicSessionId: classroom.academicSessionId,
          classroomId: classroom.id,
          programType: classroom.programType,
          status: 'ACTIVE',
          startedAt: new Date(),
          reason: 'Admission enrolment',
          createdById: session.uid,
          createdByName: session.name,
        },
      })

      await tx.admissionApplication.update({
        where: { id },
        data: {
          status: 'ENROLLED',
          approvedAt: new Date(),
          studentId: student.id,
          classroomId: classroom!.id,
        },
      })

      // lead converTed
      if (app.leadId) {
        await tx.lead.update({
          where: { id: app.leadId },
          data: { status: 'CONVERTED' },
        }).catch(() => {})
      }

      // welcome timeline entry
      await tx.timelineEntry.create({
        data: {
          tenantId: session.tenantId!,
          studentId: student.id,
          type: 'MILESTONE',
          title: 'Welcome to PreOne!',
          body: `${app.childFirstName} joined ${classroom!.name}. A bright new journey begins!`,
        },
      })

      return { student, invoice }
    })

    // M01 domain events → follow-ups/comms/audit fan-out (in-process seam)
    await emit({
      type: 'StudentCreated',
      tenantId: session.tenantId!,
      studentId: result.student.id,
      name: `${result.student.firstName} ${result.student.lastName || ''}`.trim(),
      classroomId: classroom.id,
    })
    await emit({
      type: 'StudentAllocated',
      tenantId: session.tenantId!,
      studentId: result.student.id,
      classroomId: classroom.id,
      reason: 'Admission enrolment',
    })
    if (result.invoice) {
      await emit({
        type: 'InvoiceIssued',
        tenantId: session.tenantId!,
        invoiceId: result.invoice.id,
        studentId: result.student.id,
        invoiceNumber: result.invoice.invoiceNumber,
        totalCents: result.invoice.totalCents,
        dueDate: result.invoice.dueDate,
      })
    }

    await audit({
      tenantId: session.tenantId,
      actorId: session.uid,
      actorName: session.name,
      action: 'APPROVE',
      entity: 'AdmissionApplication',
      entityId: id,
      summary: `Approved ${app.applicationNumber} → Student ${result.student.admissionNo} enrolled in ${classroom.name}`,
    })

    return ok({
      studentId: result.student.id,
      admissionNo: result.student.admissionNo,
      classroom: classroom.name,
      seats: { capacity: classroom.capacity, current: capacity + 1, available: Math.max(0, classroom.capacity - capacity - 1) },
      invoiceNumber: result.invoice?.invoiceNumber ?? null,
    })
  } catch (e) {
    return Errors.system(e)
  }
}
