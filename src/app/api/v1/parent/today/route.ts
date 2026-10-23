import { withApi } from '@/lib/with-api'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { isoDate } from '@/lib/format'

function calculateAge(dob: string | Date | null | undefined): string | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) {
    months--
  }
  if (months < 0) {
    years--
    months += 12
  }
  if (years < 0) return null
  if (years === 0) {
    return months === 1 ? '1 month' : `${months} months`
  }
  if (months === 0) {
    return years === 1 ? '1 year' : `${years} years`
  }
  return `${years} yr${years > 1 ? 's' : ''} ${months} mo${months > 1 ? 's' : ''}`
}

/**
 * GET /api/v1/parent/today — Complete Parent Dashboard & Child Details
 * Fetches real Student Master details, attendance, daily diary, fees, and documents.
 * Scoped strictly to the authenticated parent's linked children.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'timeline:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const tenantId = session.tenantId
    const today = isoDate()
    const todayDate = new Date(today)

    const url = new URL(req.url)
    const filterChildId = url.searchParams.get('childId')

    // 1. Find all guardians linked to this user in this tenant
    const guardians = await db.guardian.findMany({
      where: { userId: session.uid, tenantId, deletedAt: null },
      include: {
        studentLinks: {
          include: {
            student: {
              include: {
                currentClassroom: {
                  include: {
                    primaryTeacher: { select: { fullName: true, email: true, avatarUrl: true } },
                    program: { select: { id: true, name: true, code: true } },
                  },
                },
              },
            },
          },
        },
      },
    })

    const allLinkedStudentIds = Array.from(
      new Set(guardians.flatMap((g) => g.studentLinks.map((l) => l.student.id)))
    )

    if (allLinkedStudentIds.length === 0) {
      return ok({ children: [], today })
    }

    // Security check: If specific childId requested, verify ownership
    if (filterChildId && !allLinkedStudentIds.includes(filterChildId)) {
      return Errors.forbidden('You are not authorized to view details for this student')
    }

    const targetChildrenIds = filterChildId ? [filterChildId] : allLinkedStudentIds

    // 2. Fetch Branches for campus name mapping
    const branches = await db.branch.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true, code: true },
    })
    const branchMap = new Map(branches.map((b) => [b.id, b]))

    // 3. Attendance — Today + Complete Records for History & Summary
    const [todayAttendances, allAttendances] = await Promise.all([
      db.attendance.findMany({
        where: { tenantId, date: todayDate, studentId: { in: targetChildrenIds } },
        select: { studentId: true, status: true, markedAt: true, notes: true },
      }),
      db.attendance.findMany({
        where: { tenantId, studentId: { in: targetChildrenIds } },
        orderBy: { date: 'desc' },
        select: { id: true, studentId: true, date: true, status: true, markedAt: true, notes: true },
      }),
    ])

    // 4. Daily Care & Timeline Entries (Published activities, meals, nap, notes)
    const timelineEntries = await db.timelineEntry.findMany({
      where: {
        tenantId,
        studentId: { in: targetChildrenIds },
        type: { in: ['ARRIVAL', 'MEAL', 'NAP', 'BATHROOM', 'ACTIVITY', 'NOTE', 'MILESTONE', 'PICKUP'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        studentId: true,
        type: true,
        title: true,
        body: true,
        mood: true,
        photoUrl: true,
        createdAt: true,
      },
    })

    // 5. Teacher Observations (Only PUBLISHED parent-facing updates)
    const observations = await db.observation.findMany({
      where: {
        tenantId,
        studentId: { in: targetChildrenIds },
        status: 'PUBLISHED',
      },
      orderBy: { observedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        studentId: true,
        narrative: true,
        observedAt: true,
        category: true,
      },
    })

    // 6. Fees — Invoices, line items & payment history
    const [invoices, feeSchedules] = await Promise.all([
      db.invoice.findMany({
        where: { tenantId, studentId: { in: targetChildrenIds }, deletedAt: null },
        orderBy: { issueDate: 'desc' },
        include: {
          items: {
            select: { id: true, feeHead: true, description: true, amountCents: true },
          },
          payments: {
            include: { receipt: { select: { receiptNumber: true } } },
            orderBy: { paymentDate: 'desc' },
          },
        },
      }),
      db.studentFeeSchedule.findMany({
        where: { studentId: { in: targetChildrenIds } },
        include: { feeItem: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
      }),
    ])

    // 7. Safety / Health Alerts
    const alerts = await db.followUp.findMany({
      where: {
        tenantId,
        studentId: { in: targetChildrenIds },
        domain: { in: ['HEALTH', 'SAFETY'] },
        status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING'] },
      },
      select: { studentId: true, title: true, severity: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // 8. Official Reports & Generated Documents
    const documents = await db.generatedProfileDocument.findMany({
      where: {
        tenantId,
        entityType: 'STUDENT',
        studentId: { in: targetChildrenIds },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        studentReportCards: { select: { status: true } },
      },
    })

    const visibleDocs = documents.filter((doc) => {
      if (doc.documentType === 'REPORT_CARD') {
        const rc = doc.studentReportCards?.[0]
        return rc ? rc.status === 'PUBLISHED' : false
      }
      return true
    })

    // Shape child record
    const childrenList: any[] = []
    for (const g of guardians) {
      for (const link of g.studentLinks) {
        const s = link.student
        if (targetChildrenIds.includes(s.id) && !childrenList.some((c) => c.id === s.id)) {
          const branch = branchMap.get(s.branchId)

          // Attendance stats
          const studentAttendanceRecords = allAttendances.filter((a) => a.studentId === s.id)
          const totalDays = studentAttendanceRecords.length
          const presentDays = studentAttendanceRecords.filter((a) =>
            ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)
          ).length
          const absentDays = studentAttendanceRecords.filter((a) => a.status === 'ABSENT').length
          const lateDays = studentAttendanceRecords.filter((a) => a.status === 'LATE').length
          const halfDays = studentAttendanceRecords.filter((a) => a.status === 'HALF_DAY').length
          const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
          const todayRec = todayAttendances.find((a) => a.studentId === s.id)

          // Fee calculations
          const childInvoices = invoices.filter((i) => i.studentId === s.id)
          const childSchedules = feeSchedules.filter((sc) => sc.studentId === s.id)

          let totalApplicableRupees = 0
          let totalPaidRupees = 0
          let totalPendingRupees = 0

          if (childInvoices.length > 0) {
            totalApplicableRupees = childInvoices.reduce((sum, inv) => sum + inv.totalCents, 0) / 100
            totalPaidRupees = childInvoices.reduce((sum, inv) => sum + inv.paidCents, 0) / 100
            totalPendingRupees = childInvoices.reduce((sum, inv) => sum + inv.balanceCents, 0) / 100
          } else if (childSchedules.length > 0) {
            totalApplicableRupees = childSchedules.reduce((sum, sc) => sum + sc.amountDueCents, 0) / 100
            totalPaidRupees = childSchedules.reduce((sum, sc) => sum + sc.amountPaidCents, 0) / 100
            totalPendingRupees = childSchedules.reduce((sum, sc) => sum + sc.remainingAmountCents, 0) / 100
          }

          let feeStatus: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'NO_FEES' = 'NO_FEES'
          if (totalApplicableRupees > 0) {
            if (totalPendingRupees <= 0) {
              feeStatus = 'FULLY_PAID'
            } else if (
              childInvoices.some(
                (i) => i.status === 'OVERDUE' || (new Date(i.dueDate) < new Date() && i.balanceCents > 0)
              )
            ) {
              feeStatus = 'OVERDUE'
            } else if (totalPaidRupees > 0) {
              feeStatus = 'PARTIALLY_PAID'
            } else {
              feeStatus = 'PENDING'
            }
          }

          // Payment history
          const paymentList = childInvoices.flatMap((inv) =>
            inv.payments.map((p) => ({
              id: p.id,
              paymentNumber: p.paymentNumber,
              invoiceNumber: inv.invoiceNumber,
              amountRupees: p.amountCents / 100,
              method: p.method,
              status: p.status,
              paymentDate: p.paymentDate,
              receiptNumber: p.receipt?.receiptNumber || null,
            }))
          )

          // Filter documents for this child
          const childDocs = visibleDocs
            .filter((d) => d.studentId === s.id)
            .map((doc) => ({
              id: doc.id,
              title: doc.title,
              documentType: doc.documentType,
              fileName: doc.fileName || `${doc.title}.pdf`,
              fileSizeBytes: doc.fileSizeBytes,
              createdAt: doc.createdAt,
              downloadUrl: `/api/v1/documents/${doc.id}/download`,
            }))

          childrenList.push({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            name: `${s.firstName} ${s.lastName || ''}`.trim(),
            photoUrl: s.photoUrl,
            admissionNo: s.admissionNo,
            admissionDate: s.admissionDate ? s.admissionDate.toISOString() : null,
            dob: s.dob ? s.dob.toISOString() : null,
            age: calculateAge(s.dob),
            gender: s.gender,
            status: s.status,
            branch: branch ? { id: branch.id, name: branch.name.trim(), code: branch.code } : null,
            classroom: s.currentClassroom
              ? {
                  id: s.currentClassroom.id,
                  name: s.currentClassroom.name,
                  code: s.currentClassroom.code,
                  programType: s.currentClassroom.programType,
                  programName: s.currentClassroom.program?.name || s.currentClassroom.programType,
                  teacher: s.currentClassroom.primaryTeacher?.fullName || null,
                }
              : null,
            guardian: {
              relationship: link.relationship || g.relationship,
              name: g.fullName,
              phone: g.phone,
              isPrimary: link.isPrimary,
              canPickup: link.canPickup,
            },
            // Health & Medical Info (clean nulls so frontend only renders valid fields)
            bloodGroup: s.bloodGroup || null,
            allergies: s.allergies && s.allergies.trim().length > 0 ? s.allergies.trim() : null,
            medicalAlerts: s.medicalAlerts && s.medicalAlerts.trim().length > 0 ? s.medicalAlerts.trim() : null,
            dietaryRestrictions:
              s.dietaryRestrictions && s.dietaryRestrictions.trim().length > 0
                ? s.dietaryRestrictions.trim()
                : null,
            emergencyMedicalInstructions:
              s.emergencyMedicalInstructions && s.emergencyMedicalInstructions.trim().length > 0
                ? s.emergencyMedicalInstructions.trim()
                : null,
            address: s.address && s.address.trim().length > 0 ? s.address.trim() : null,

            // Attendance Data
            attendance: {
              todayStatus: todayRec?.status || null,
              todayNotes: todayRec?.notes || null,
              summary: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                halfDays,
                attendanceRate,
              },
              recentHistory: studentAttendanceRecords.slice(0, 30).map((a) => ({
                id: a.id,
                date: a.date.toISOString(),
                status: a.status,
                markedAt: a.markedAt ? a.markedAt.toISOString() : null,
                notes: a.notes,
              })),
            },

            // Daily Diary / Care Updates
            todayCare: timelineEntries
              .filter((c) => c.studentId === s.id)
              .map((c) => ({
                id: c.id,
                type: c.type,
                title: c.title,
                body: c.body,
                mood: c.mood,
                photoUrl: c.photoUrl,
                at: c.createdAt.toISOString(),
              })),

            // Teacher Observations & Learning Updates
            observations: observations
              .filter((u) => u.studentId === s.id)
              .map((u) => ({
                id: u.id,
                narrative: u.narrative,
                category: u.category,
                observedAt: u.observedAt.toISOString(),
              })),

            // Fees Data
            fees: {
              summary: {
                totalApplicableRupees,
                totalPaidRupees,
                totalPendingRupees,
                status: feeStatus,
              },
              invoices: childInvoices.map((i) => ({
                id: i.id,
                invoiceNumber: i.invoiceNumber,
                title: i.title,
                dueDate: i.dueDate.toISOString(),
                issueDate: i.issueDate.toISOString(),
                subtotalRupees: i.subtotalCents / 100,
                discountRupees: i.discountCents / 100,
                totalRupees: i.totalCents / 100,
                paidRupees: i.paidCents / 100,
                balanceRupees: i.balanceCents / 100,
                status: i.status,
                items: i.items.map((it) => ({
                  id: it.id,
                  feeHead: it.feeHead,
                  description: it.description,
                  amountRupees: it.amountCents / 100,
                })),
              })),
              paymentHistory: paymentList,
              schedules: childSchedules.map((sc) => ({
                id: sc.id,
                feeHead: sc.feeItem.name,
                dueDate: sc.dueDate.toISOString(),
                amountDueRupees: sc.amountDueCents / 100,
                amountPaidRupees: sc.amountPaidCents / 100,
                remainingRupees: sc.remainingAmountCents / 100,
                status: sc.status,
              })),
            },

            // Reports & Documents
            documents: childDocs,

            // Health & Safety Alerts
            alerts: alerts
              .filter((a) => a.studentId === s.id)
              .map((a) => ({
                title: a.title,
                severity: a.severity,
                createdAt: a.createdAt.toISOString(),
              })),
          })
        }
      }
    }

    return ok({
      today,
      children: childrenList,
    })
  } catch (e: any) {
    return Errors.system(e.message || 'Failed to fetch parent dashboard data')
  }
}

export const GET = withApi(_GET)
