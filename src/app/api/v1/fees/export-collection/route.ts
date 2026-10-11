import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'

/**
 * Escapes CSV field value according to RFC-4180 and protects against spreadsheet formula injection.
 */
function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""'
  let str = String(val).trim()

  // Prevent formula injection in Excel / Google Sheets
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // Escape inner double quotes
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * GET /api/v1/fees/export-collection — Download fee collection CSV report
 * Uses actual persisted payments and collection records.
 */
async function _GET(req: NextRequest) {
  const session = await requireApi(req, 'finance:read')
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const sp = req.nextUrl.searchParams
    const branchId = sp.get('branchId') || undefined
    const academicSessionId = sp.get('academicSessionId') || undefined
    const programId = sp.get('programId') || undefined
    const classroomId = sp.get('classroomId') || undefined
    const startDate = sp.get('startDate') || undefined
    const endDate = sp.get('endDate') || undefined
    const format = sp.get('format') || 'csv'

    const dateFilter: Record<string, Date> = {}
    if (startDate) {
      const d = new Date(startDate)
      if (!isNaN(d.getTime())) dateFilter.gte = d
    }
    if (endDate) {
      const d = new Date(endDate)
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999)
        dateFilter.lte = d
      }
    }

    // Load branches map for resolution
    const branches = await db.branch.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true, code: true },
    })
    const branchMap = new Map(branches.map((b) => [b.id, b.name]))

    // Only actual SUCCESSFUL persisted collections
    const payments = await db.payment.findMany({
      where: {
        tenantId: session.tenantId,
        status: 'SUCCESS',
        ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {}),
      },
      include: {
        receipt: { select: { id: true, receiptNumber: true, issuedAt: true } },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            title: true,
            branchId: true,
            academicSessionId: true,
            totalCents: true,
            paidCents: true,
            balanceCents: true,
            academicSession: { select: { id: true, name: true } },
          },
        },
        feeSchedule: {
          select: {
            id: true,
            period: true,
            amountDueCents: true,
            amountPaidCents: true,
            remainingAmountCents: true,
            feeItem: { select: { id: true, name: true } },
            feeStructure: { select: { id: true, name: true, branchId: true, programId: true } },
            academicSession: { select: { id: true, name: true } },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            branchId: true,
            currentClassroom: {
              select: {
                id: true,
                name: true,
                branchId: true,
                programId: true,
                program: { select: { id: true, name: true } },
                academicSession: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    })

    // Filter in-memory by branch, academicSession, program, and classroom if specified
    const filtered = payments.filter((p) => {
      const studentBranchId = p.student?.branchId || p.student?.currentClassroom?.branchId || p.invoice?.branchId || p.feeSchedule?.feeStructure?.branchId
      if (branchId && branchId !== 'ALL' && studentBranchId !== branchId) {
        return false
      }

      const sessionTargetId = p.feeSchedule?.academicSession?.id || p.invoice?.academicSession?.id || p.student?.currentClassroom?.academicSession?.id
      if (academicSessionId && academicSessionId !== 'ALL' && sessionTargetId !== academicSessionId) {
        return false
      }

      const progId = p.student?.currentClassroom?.programId || p.feeSchedule?.feeStructure?.programId
      if (programId && programId !== 'ALL' && progId !== programId) {
        return false
      }

      const classId = p.student?.currentClassroom?.id
      if (classroomId && classroomId !== 'ALL' && classId !== classroomId) {
        return false
      }

      return true
    })

    // Build row representations
    const rows = filtered.map((p) => {
      const bName =
        p.student?.branch?.name ||
        p.student?.currentClassroom?.branch?.name ||
        (p.invoice?.branchId ? branchMap.get(p.invoice.branchId) : null) ||
        (p.feeSchedule?.feeStructure?.branchId ? branchMap.get(p.feeSchedule.feeStructure.branchId) : null) ||
        branches[0]?.name ||
        'Main Campus'

      const ayName =
        p.feeSchedule?.academicSession?.name ||
        p.invoice?.academicSession?.name ||
        p.student?.currentClassroom?.academicSession?.name ||
        'Current AY'

      const progClassName = p.student?.currentClassroom
        ? `${p.student.currentClassroom.program?.name || 'Program'} - ${p.student.currentClassroom.name}`
        : p.feeSchedule?.feeStructure?.name || 'General'

      const studentName = p.student ? `${p.student.firstName} ${p.student.lastName || ''}`.trim() : 'N/A'
      const admissionNo = p.student?.admissionNo || 'N/A'

      const feeTypeName =
        p.feeSchedule?.feeItem?.name ||
        p.feeSchedule?.feeStructure?.name ||
        p.invoice?.title ||
        'School Tuition Fee'

      const feeAmountRupees = (
        (p.feeSchedule?.amountDueCents ?? p.invoice?.totalCents ?? p.amountCents) / 100
      ).toFixed(2)

      const amountPaidRupees = (p.amountCents / 100).toFixed(2)

      const remainingRupees = (
        Math.max(0, p.feeSchedule?.remainingAmountCents ?? p.invoice?.balanceCents ?? 0) / 100
      ).toFixed(2)

      const paymentDateStr = p.paymentDate
        ? new Date(p.paymentDate).toISOString().split('T')[0]
        : '—'

      const paymentStatus = p.status
      const paymentRef = p.receipt?.receiptNumber || p.transactionRef || p.paymentNumber

      return {
        branchName: bName,
        academicYear: ayName,
        programClass: progClassName,
        admissionNo,
        studentName,
        feeType: feeTypeName,
        feeAmountRupees,
        amountPaidRupees,
        remainingRupees,
        paymentDate: paymentDateStr,
        paymentStatus,
        paymentRef,
        amountCents: p.amountCents,
      }
    })

    // Summary calculation
    const grossCollectionCents = rows.reduce((sum, r) => sum + r.amountCents, 0)
    const grossCollectionRupees = (grossCollectionCents / 100).toFixed(2)

    if (format === 'json') {
      return ok({
        totalRecords: rows.length,
        grossCollectionRupees,
        rows,
      })
    }

    // CSV Headers
    const headers = [
      'Branch Name',
      'Academic Year',
      'Program/Class',
      'Student Admission Number',
      'Student Name',
      'Fee Type or Fee Structure',
      'Fee Amount (INR)',
      'Amount Paid (INR)',
      'Remaining/Pending Amount (INR)',
      'Payment Date',
      'Payment Status',
      'Payment/Receipt Reference',
    ]

    const csvLines: string[] = []
    csvLines.push(headers.map((h) => `"${h}"`).join(','))

    for (const r of rows) {
      csvLines.push(
        [
          sanitizeCsvCell(r.branchName),
          sanitizeCsvCell(r.academicYear),
          sanitizeCsvCell(r.programClass),
          sanitizeCsvCell(r.admissionNo),
          sanitizeCsvCell(r.studentName),
          sanitizeCsvCell(r.feeType),
          sanitizeCsvCell(r.feeAmountRupees),
          sanitizeCsvCell(r.amountPaidRupees),
          sanitizeCsvCell(r.remainingRupees),
          sanitizeCsvCell(r.paymentDate),
          sanitizeCsvCell(r.paymentStatus),
          sanitizeCsvCell(r.paymentRef),
        ].join(',')
      )
    }

    // Add summary row at the bottom
    csvLines.push('')
    csvLines.push(
      [
        sanitizeCsvCell('TOTAL COLLECTION'),
        '""',
        '""',
        '""',
        '""',
        sanitizeCsvCell(`${rows.length} successful transaction(s)`),
        '""',
        sanitizeCsvCell(grossCollectionRupees),
        '""',
        '""',
        '""',
        '""',
      ].join(',')
    )

    const csvOutput = '\uFEFF' + csvLines.join('\r\n')
    const filename = `fee-collection-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
