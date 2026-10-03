/**
 * PreOne — Report Query Engine
 *
 * Executes server-side filtered, sorted, paginated, and scoped queries
 * directly against authoritative domain tables.
 */

import { db } from '@/lib/db'
import { getReportById } from './report-registry'
import { QueryOptions, ReportResult, ScopeContext } from './report-types'
import { inr, fmtDate } from '@/lib/format'

export class ReportQueryEngine {
  /**
   * Executes a standard registered report with strict server-side scoping and pagination.
   */
  static async executeReport(
    reportId: string,
    options: QueryOptions,
    ctx: ScopeContext
  ): Promise<ReportResult> {
    const reportDef = getReportById(reportId)
    if (!reportDef) {
      throw new Error(`Report '${reportId}' not found in registry`)
    }

    const { tenantId, branchId, academicSessionId, roles, actorId } = ctx
    const page = Math.max(1, options.page || 1)
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20))
    const skip = (page - 1) * pageSize

    const isParent = roles.includes('PARENT')
    const isTeacher = roles.includes('TEACHER') && !roles.includes('OWNER') && !roles.includes('PRINCIPAL')

    // Scoped execution by reportId
    switch (reportId) {
      // 1. EXECUTIVE
      case 'exec-overview': {
        const whereStudent: any = { tenantId, status: 'ACTIVE', deletedAt: null }
        if (options.branchId || branchId) whereStudent.branchId = options.branchId || branchId
        const studentCount = await db.student.count({ where: whereStudent })

        const whereStaff: any = { tenantId, deletedAt: null }
        if (options.branchId || branchId) whereStaff.branchId = options.branchId || branchId
        const staffCount = await db.staffProfile.count({ where: whereStaff })

        const todayStr = new Date().toISOString().slice(0, 10)
        const whereAtt: any = { tenantId, date: new Date(todayStr), status: 'PRESENT' }
        if (options.branchId || branchId) whereAtt.branchId = options.branchId || branchId
        const attCount = await db.attendance.count({ where: whereAtt })

        const whereInvoice: any = { tenantId, status: { not: 'CANCELLED' } }
        if (options.branchId || branchId) whereInvoice.branchId = options.branchId || branchId
        const invoiceAgg = await db.invoice.aggregate({
          where: whereInvoice,
          _sum: { totalCents: true, paidCents: true, balanceCents: true },
        })
        const collectedCents = invoiceAgg._sum.paidCents || 0
        const outstandingCents = invoiceAgg._sum.balanceCents || 0

        const whereRoute: any = { tenantId, status: 'ACTIVE' }
        if (options.branchId || branchId) whereRoute.branchId = options.branchId || branchId
        const routeCount = await db.transportRoute.count({ where: whereRoute })

        const whereStock: any = { tenantId, quantity: { lte: 5 } }
        if (options.branchId || branchId) whereStock.branchId = options.branchId || branchId
        const lowStockCount = await db.inventoryStock.count({ where: whereStock })

        const rows = [
          { metric: 'Enrolled Students', category: 'Enrollment', value: `${studentCount} Students`, target: '100% Capacity', status: 'ON_TRACK' },
          { metric: 'Today Attendance', category: 'Operations', value: `${attCount} Present`, target: '95%', status: attCount > 0 ? 'ON_TRACK' : 'NEEDS_ATTENTION' },
          { metric: 'Active Workforce', category: 'Staffing', value: `${staffCount} Staff`, target: 'Full Staffing', status: 'ON_TRACK' },
          { metric: 'Fee Collections', category: 'Finance', value: inr(collectedCents), target: inr(invoiceAgg._sum.totalCents || 0), status: 'ON_TRACK' },
          { metric: 'Pending Dues', category: 'Finance', value: inr(outstandingCents), target: '₹0', status: outstandingCents > 0 ? 'NEEDS_ATTENTION' : 'ON_TRACK' },
          { metric: 'Active Bus Routes', category: 'Transport', value: `${routeCount} Routes`, target: '100% Operational', status: 'ON_TRACK' },
          { metric: 'Low Stock Alerts', category: 'Inventory', value: `${lowStockCount} Items`, target: '0 Low Stock', status: lowStockCount > 0 ? 'NEEDS_ATTENTION' : 'ON_TRACK' },
        ]

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total: rows.length,
          page: 1,
          pageSize,
          totalPages: 1,
          columns: reportDef.columns,
          data: rows,
        }
      }

      // 2. STUDENTS
      case 'students-strength': {
        const where: any = { tenantId, deletedAt: null }
        if (options.branchId || branchId) where.branchId = options.branchId || branchId
        if (options.status) where.status = options.status
        if (isParent) {
          where.guardians = { some: { guardian: { userId: actorId } } }
        }
        if (isTeacher) {
          where.allocations = {
            some: { classroom: { primaryTeacherId: actorId } },
          }
        }
        if (options.classroomId) {
          where.allocations = { some: { classroomId: options.classroomId } }
        }
        if (options.search) {
          where.OR = [
            { firstName: { contains: options.search, mode: 'insensitive' } },
            { lastName: { contains: options.search, mode: 'insensitive' } },
            { admissionNo: { contains: options.search, mode: 'insensitive' } },
          ]
        }

        const total = await db.student.count({ where })
        const students = await db.student.findMany({
          where,
          include: {
            allocations: {
              where: { status: 'ACTIVE' },
              include: { classroom: true },
              take: 1,
            },
          },
          orderBy: { firstName: 'asc' },
          skip,
          take: pageSize,
        })

        const data = students.map((s) => ({
          admissionNumber: s.admissionNo || '—',
          fullName: `${s.firstName} ${s.lastName || ''}`.trim(),
          classroom: s.allocations[0]?.classroom?.name || 'Unassigned',
          program: s.allocations[0]?.classroom?.programType || '—',
          status: s.status,
          gender: s.gender || '—',
          dob: s.dob ? fmtDate(s.dob) : '—',
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 3. ADMISSIONS
      case 'admissions-funnel': {
        const where: any = { tenantId, deletedAt: null }
        if (options.branchId || branchId) where.branchId = options.branchId || branchId
        if (options.status) where.status = options.status
        if (options.search) {
          where.OR = [
            { leadNumber: { contains: options.search, mode: 'insensitive' } },
            { parentName: { contains: options.search, mode: 'insensitive' } },
            { childName: { contains: options.search, mode: 'insensitive' } },
          ]
        }
        if (options.startDate && options.endDate) {
          const s = new Date(options.startDate)
          s.setHours(0, 0, 0, 0)
          const e = new Date(options.endDate)
          e.setHours(23, 59, 59, 999)
          where.createdAt = { gte: s, lte: e }
        }

        const total = await db.lead.count({ where })
        const leads = await db.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        })

        const data = leads.map((l) => ({
          leadNumber: l.leadNumber,
          parentName: l.parentName,
          childName: l.childName || '—',
          source: l.source,
          stage: l.status,
          status: l.status,
          createdAt: fmtDate(l.createdAt),
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 4. ATTENDANCE
      case 'attendance-daily': {
        const where: any = { tenantId }
        if (options.branchId || branchId) where.branchId = options.branchId || branchId
        if (options.status) where.status = options.status
        if (options.classroomId) where.classroomId = options.classroomId

        if (options.startDate && options.endDate) {
          const s = new Date(options.startDate)
          s.setHours(0, 0, 0, 0)
          const e = new Date(options.endDate)
          e.setHours(23, 59, 59, 999)
          where.date = { gte: s, lte: e }
        } else if (options.startDate) {
          const s = new Date(options.startDate)
          s.setHours(0, 0, 0, 0)
          where.date = s
        } else {
          const targetDate = new Date()
          targetDate.setHours(0, 0, 0, 0)
          where.date = targetDate
        }

        if (isParent) {
          where.student = { guardians: { some: { guardian: { userId: actorId } } } }
        }
        if (isTeacher) {
          where.student = {
            ...where.student,
            allocations: {
              some: { classroom: { primaryTeacherId: actorId } },
            },
          }
        }
        if (options.search) {
          where.student = {
            ...where.student,
            OR: [
              { firstName: { contains: options.search, mode: 'insensitive' } },
              { lastName: { contains: options.search, mode: 'insensitive' } },
              { admissionNo: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        }

        const total = await db.attendance.count({ where })
        const records = await db.attendance.findMany({
          where,
          include: {
            student: {
              include: {
                allocations: {
                  where: { status: 'ACTIVE' },
                  include: { classroom: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: pageSize,
        })

        const data = records.map((r) => ({
          date: fmtDate(r.date),
          admissionNumber: r.student?.admissionNo || '—',
          studentName: r.student
            ? `${r.student.firstName} ${r.student.lastName || ''}`.trim()
            : '—',
          classroom: r.student?.allocations[0]?.classroom?.name || 'Unassigned',
          status: r.status,
          arrivalTime: '—',
          notes: r.notes || '—',
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 5. OPERATIONS
      case 'operations-daily': {
        const where: any = { tenantId }
        if (isParent) {
          where.student = { guardians: { some: { guardian: { userId: actorId } } } }
        }
        if (isTeacher) {
          where.student = {
            ...where.student,
            allocations: {
              some: { classroom: { primaryTeacherId: actorId } },
            },
          }
        }
        if (options.classroomId) {
          where.classroomId = options.classroomId
        }
        if (options.startDate && options.endDate) {
          const s = new Date(options.startDate)
          s.setHours(0, 0, 0, 0)
          const e = new Date(options.endDate)
          e.setHours(23, 59, 59, 999)
          where.createdAt = { gte: s, lte: e }
        }
        if (options.search) {
          where.OR = [
            { title: { contains: options.search, mode: 'insensitive' } },
            { body: { contains: options.search, mode: 'insensitive' } },
            { student: { firstName: { contains: options.search, mode: 'insensitive' } } },
            { student: { lastName: { contains: options.search, mode: 'insensitive' } } },
          ]
        }

        const total = await db.timelineEntry.count({ where })
        const entries = await db.timelineEntry.findMany({
          where,
          include: { student: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        })

        const data = entries.map((e) => ({
          time: e.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          studentName: e.student ? `${e.student.firstName} ${e.student.lastName || ''}`.trim() : '—',
          type: e.type,
          title: e.title,
          description: e.body || '—',
          isImportant: false,
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 6. ACADEMICS
      case 'academics-milestones': {
        const where: any = { tenantId }
        if (isParent) {
          where.student = { guardians: { some: { guardian: { userId: actorId } } } }
        }
        if (isTeacher) {
          where.student = {
            ...where.student,
            allocations: {
              some: { classroom: { primaryTeacherId: actorId } },
            },
          }
        }
        if (options.classroomId) {
          where.classroomId = options.classroomId
        }
        if (options.status) {
          where.status = options.status
        }
        if (options.search) {
          where.OR = [
            { narrative: { contains: options.search, mode: 'insensitive' } },
            { milestoneTags: { contains: options.search, mode: 'insensitive' } },
            { student: { firstName: { contains: options.search, mode: 'insensitive' } } },
            { student: { lastName: { contains: options.search, mode: 'insensitive' } } },
          ]
        }

        const total = await db.observation.count({ where })
        const observations = await db.observation.findMany({
          where,
          include: {
            student: {
              include: {
                allocations: {
                  where: { status: 'ACTIVE' },
                  include: { classroom: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { observedAt: 'desc' },
          skip,
          take: pageSize,
        })

        const data = observations.map((o) => ({
          studentName: o.student ? `${o.student.firstName} ${o.student.lastName || ''}`.trim() : '—',
          classroom: o.student?.allocations[0]?.classroom?.name || 'Unassigned',
          learningArea: o.category || 'Early Development',
          milestone: o.milestoneTags || o.narrative.slice(0, 40) + '...',
          status: o.status,
          assessedAt: fmtDate(o.observedAt),
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 7. FINANCE - COLLECTIONS
      case 'finance-collections': {
        const where: any = {
          tenantId,
          status: 'SUCCESS',
        }
        if (options.branchId || branchId) where.invoice = { branchId: options.branchId || branchId }
        if (isParent) {
          where.invoice = {
            ...where.invoice,
            student: { guardians: { some: { guardian: { userId: actorId } } } },
          }
        }
        if (options.search) {
          where.OR = [
            { paymentNumber: { contains: options.search, mode: 'insensitive' } },
            { transactionRef: { contains: options.search, mode: 'insensitive' } },
            { invoice: { invoiceNumber: { contains: options.search, mode: 'insensitive' } } },
          ]
        }
        if (options.startDate && options.endDate) {
          const s = new Date(options.startDate)
          s.setHours(0, 0, 0, 0)
          const e = new Date(options.endDate)
          e.setHours(23, 59, 59, 999)
          where.paymentDate = { gte: s, lte: e }
        }

        const total = await db.payment.count({ where })
        const payments = await db.payment.findMany({
          where,
          include: {
            receipt: true,
            invoice: {
              include: { student: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
          skip,
          take: pageSize,
        })

        const totalAmountCents = await db.payment.aggregate({
          where,
          _sum: { amountCents: true },
        })

        const data = payments.map((p) => ({
          receiptNumber: p.receipt?.receiptNumber || '—',
          invoiceNumber: p.invoice?.invoiceNumber || '—',
          studentName: p.invoice?.student
            ? `${p.invoice.student.firstName} ${p.invoice.student.lastName || ''}`.trim()
            : '—',
          amount: inr(p.amountCents),
          paymentMethod: p.method,
          transactionRef: p.transactionRef || '—',
          paymentDate: fmtDate(p.paymentDate),
          status: p.status,
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          summary: {
            totalCollected: inr(totalAmountCents._sum.amountCents || 0),
          },
          columns: reportDef.columns,
          data,
        }
      }

      // 8. FINANCE - OUTSTANDING
      case 'finance-outstanding': {
        const where: any = {
          tenantId,
          deletedAt: null,
          balanceCents: { gt: 0 },
        }
        if (options.branchId || branchId) where.branchId = options.branchId || branchId
        if (options.academicSessionId || academicSessionId)
          where.academicSessionId = options.academicSessionId || academicSessionId
        if (options.status) where.status = options.status
        if (isParent) {
          where.student = { guardians: { some: { guardian: { userId: actorId } } } }
        }
        if (options.search) {
          where.OR = [
            { invoiceNumber: { contains: options.search, mode: 'insensitive' } },
            { student: { firstName: { contains: options.search, mode: 'insensitive' } } },
            { student: { lastName: { contains: options.search, mode: 'insensitive' } } },
          ]
        }
        if (options.startDate && options.endDate) {
          const s = new Date(options.startDate)
          s.setHours(0, 0, 0, 0)
          const e = new Date(options.endDate)
          e.setHours(23, 59, 59, 999)
          where.dueDate = { gte: s, lte: e }
        }

        const total = await db.invoice.count({ where })
        const invoices = await db.invoice.findMany({
          where,
          include: {
            student: {
              include: {
                allocations: {
                  where: { status: 'ACTIVE' },
                  include: { classroom: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { dueDate: 'asc' },
          skip,
          take: pageSize,
        })

        const summaryAgg = await db.invoice.aggregate({
          where,
          _sum: { balanceCents: true, totalCents: true, paidCents: true },
        })

        const now = new Date()
        const data = invoices.map((inv) => {
          const due = new Date(inv.dueDate)
          const diffDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
          return {
            invoiceNumber: inv.invoiceNumber,
            studentName: inv.student
              ? `${inv.student.firstName} ${inv.student.lastName || ''}`.trim()
              : '—',
            classroom: inv.student?.allocations[0]?.classroom?.name || 'Unassigned',
            totalAmount: inr(inv.totalCents),
            paidAmount: inr(inv.paidCents),
            balance: inr(inv.balanceCents),
            dueDate: fmtDate(inv.dueDate),
            agingDays: diffDays,
            status: inv.status,
          }
        })

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          summary: {
            totalOutstanding: inr(summaryAgg._sum.balanceCents || 0),
          },
          columns: reportDef.columns,
          data,
        }
      }

      // 9. HR & WORKFORCE
      case 'hr-headcount': {
        const where: any = { tenantId, deletedAt: null }
        if (options.branchId || branchId) where.branchId = options.branchId || branchId
        if (options.search) {
          where.OR = [
            { employeeCode: { contains: options.search, mode: 'insensitive' } },
            { designation: { contains: options.search, mode: 'insensitive' } },
            { department: { contains: options.search, mode: 'insensitive' } },
          ]
        }

        const total = await db.staffProfile.count({ where })
        const staff = await db.staffProfile.findMany({
          where,
          include: { user: true },
          orderBy: { employeeCode: 'asc' },
          skip,
          take: pageSize,
        })

        const todayStr = new Date().toISOString().slice(0, 10)
        const staffIds = staff.map((s) => s.id)
        const todayAtt = await db.attendanceStaff.findMany({
          where: {
            staffProfileId: { in: staffIds },
            date: new Date(todayStr),
          },
        })
        const attMap = new Map(todayAtt.map((a) => [a.staffProfileId, a.status]))

        const data = staff.map((s) => ({
          employeeCode: s.employeeCode,
          fullName: (s.user as any)?.name || s.user?.fullName || '—',
          designation: s.designation || 'Staff',
          department: s.department || 'General',
          employmentType: s.employmentType || 'REGULAR',
          attendanceToday: attMap.get(s.id) || 'NOT_MARKED',
          joiningDate: s.joiningDate ? fmtDate(s.joiningDate) : '—',
        }))

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 10. TRANSPORT
      case 'transport-utilization': {
        const where: any = { tenantId }
        if (options.branchId || branchId) where.branchId = options.branchId || branchId
        if (options.status) where.status = options.status
        if (options.search) {
          where.OR = [
            { code: { contains: options.search, mode: 'insensitive' } },
            { name: { contains: options.search, mode: 'insensitive' } },
          ]
        }

        const total = await db.transportRoute.count({ where })
        const routes = await db.transportRoute.findMany({
          where,
          include: {
            vehicle: true,
            assignments: { where: { status: 'ACTIVE' } },
          },
          orderBy: { code: 'asc' },
          skip,
          take: pageSize,
        })

        const data = routes.map((r) => {
          const cap = r.vehicle?.capacity || 20
          const riders = r.assignments.length
          const util = cap > 0 ? Math.round((riders / cap) * 100) : 0
          return {
            routeCode: r.code,
            routeName: r.name,
            vehicleReg: r.vehicle?.registrationNumber || 'Unassigned',
            capacity: cap,
            activeRiders: riders,
            utilizationPercent: `${util}%`,
            status: r.status,
          }
        })

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      // 11. INVENTORY
      case 'inventory-valuation': {
        const where: any = {
          item: { tenantId, isActive: true },
        }
        if (options.branchId || branchId) where.location = { branchId: options.branchId || branchId }
        if (options.search) {
          where.item = {
            ...where.item,
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { sku: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        }

        const total = await db.inventoryStock.count({ where })
        const stocks = await db.inventoryStock.findMany({
          where,
          include: {
            item: { include: { category: true } },
          },
          orderBy: { quantity: 'asc' },
          skip,
          take: pageSize,
        })

        const data = stocks.map((st) => {
          const qty = Number(st.quantity || 0)
          const cost = Number(st.unitCost || 0)
          const minLevel = Number(st.item?.reorderLevel || 5)
          const status = qty <= 0 ? 'OUT_OF_STOCK' : qty <= minLevel ? 'LOW_STOCK' : 'ADEQUATE'
          const valCents = Math.round(qty * cost * 100)
          return {
            itemCode: st.item?.sku || '—',
            itemName: st.item?.name || '—',
            category: st.item?.category?.name || 'General',
            quantity: qty,
            minThreshold: minLevel,
            unitPrice: inr(Math.round(cost * 100)),
            totalValue: inr(valCents),
            stockStatus: status,
          }
        })

        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          columns: reportDef.columns,
          data,
        }
      }

      default: {
        // Fallback generic schema for remaining standard reports
        return {
          reportId,
          title: reportDef.title,
          domain: reportDef.domain,
          freshness: reportDef.freshness,
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 1,
          columns: reportDef.columns,
          data: [],
        }
      }
    }
  }
}
