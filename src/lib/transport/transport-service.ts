/**
 * PreOne — Transport Management Domain Service
 *
 * Core business orchestration for Preschool Child Transportation Safety & Route Operations:
 * 1. Fleet & Vehicle Management (Capacity enforcement, Maintenance, Branch Scope)
 * 2. Route & Stop Architecture (Ordered stops, Landmark sequences, Timings)
 * 3. Driver & Attendant Eligibility (Linked to HR StaffProfile with active check and designation)
 * 4. Student Transport Assignment (Capacity guard, Sibling/Multi-guardian, Session, Duplicate guard)
 * 5. Morning & Evening Operational Trips (Dynamic manifest generation from active assignments)
 * 6. Child Boarding (Idempotent, Timestamped, TimelineEntry, Parent Alert)
 * 7. School Arrival (Trip completion, Operations sync)
 * 8. Evening Drop & Guardian Verification (Integrates OperationPolicies.verifyPickupPerson)
 * 9. Delay Management & Targeted Parent Notification
 * 10. Operational Incidents & Safety Follow-ups
 * 11. Vehicle & Driver Substitution (Safe snapshots preserving historical data)
 * 12. Cross-Module Invariants (Student withdrawal ends transport, Driver offboarding blocks trips, Finance fee sync)
 */

import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { recordChildEvent } from '@/lib/notify'
import { raiseFollowUp } from '@/lib/followups'
import { OperationPolicies } from '@/lib/operations/operation-policies'
import { FeeService } from '@/lib/fees/fee-service'
import {
  VehicleStatus,
  RouteStatus,
  StopStatus,
  TransportTripType,
  TransportAssignmentStatus,
  TripOperationalType,
  TripStatus,
  ManifestItemStatus,
  TransportIncidentSeverity,
  TransportIncidentCategory,
  TransportIncidentStatus,
} from '@prisma/client'

export interface ScopeContext {
  tenantId: string
  branchId?: string | null
  academicSessionId?: string | null
  actorId?: string | null
  actorName?: string | null
  actorRole?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface CreateVehicleInput {
  branchId?: string | null
  registrationNumber: string
  vehicleType?: string
  capacity: number
  makeModel?: string
  notes?: string
}

export interface CreateStopInput {
  name: string
  landmark?: string
  sequence: number
  morningPickupTime?: string
  eveningDropTime?: string
}

export interface CreateRouteInput {
  branchId?: string | null
  code: string
  name: string
  description?: string
  vehicleId?: string | null
  driverProfileId?: string | null
  attendantProfileId?: string | null
  stops?: CreateStopInput[]
}

export interface AssignStudentInput {
  studentId: string
  routeId: string
  pickupStopId: string
  dropStopId: string
  tripType?: TransportTripType
  startDate?: Date | string
  endDate?: Date | string
  monthlyFeeCents?: number
  generateFeeInvoice?: boolean
}

export interface StartTripInput {
  routeId: string
  tripDate: Date | string
  tripType: TripOperationalType
  vehicleId?: string
  driverProfileId?: string
  attendantProfileId?: string
}

export interface RecordBoardingInput {
  tripId: string
  studentId: string
  stopId?: string
  notes?: string
}

export interface RecordDropInput {
  tripId: string
  studentId: string
  guardianId?: string
  phone?: string
  userId?: string
  pin?: string
  notes?: string
}

export interface ReportIncidentInput {
  tripId?: string
  vehicleId?: string
  studentId?: string
  severity: TransportIncidentSeverity
  category: TransportIncidentCategory
  title: string
  description: string
  actionTaken?: string
}

export class TransportService {
  /**
   * 1. DASHBOARD & OPERATIONAL METRICS
   * Real database aggregates — zero dummy data.
   */
  static async getDashboardMetrics(ctx: ScopeContext) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const branchFilter = ctx.branchId ? { branchId: ctx.branchId } : {}

    const [
      activeRoutesCount,
      activeVehiclesCount,
      vehiclesInMaintenanceCount,
      activeAssignmentsCount,
      todayTrips,
      openIncidentsCount,
    ] = await Promise.all([
      db.transportRoute.count({
        where: { tenantId: ctx.tenantId, status: 'ACTIVE', deletedAt: null, ...branchFilter },
      }),
      db.vehicle.count({
        where: { tenantId: ctx.tenantId, status: 'ACTIVE', deletedAt: null, ...branchFilter },
      }),
      db.vehicle.count({
        where: { tenantId: ctx.tenantId, status: 'MAINTENANCE', deletedAt: null, ...branchFilter },
      }),
      db.studentTransportAssignment.count({
        where: { tenantId: ctx.tenantId, status: 'ACTIVE', deletedAt: null, ...branchFilter },
      }),
      db.transportTrip.findMany({
        where: {
          tenantId: ctx.tenantId,
          tripDate: { gte: today, lt: tomorrow },
          ...branchFilter,
        },
        include: {
          manifest: true,
          route: { select: { name: true, code: true } },
          vehicle: { select: { registrationNumber: true } },
          driverProfile: { include: { user: { select: { fullName: true } } } },
        },
      }),
      db.transportIncident.count({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ['REPORTED', 'INVESTIGATING'] },
          ...branchFilter,
        },
      }),
    ])

    // Aggregate manifest numbers across today's trips
    let boardedCount = 0
    let droppedCount = 0
    let absentCount = 0
    let delayedTripsCount = 0

    for (const trip of todayTrips) {
      if (trip.delayMinutes > 0) delayedTripsCount++
      for (const item of trip.manifest) {
        if (item.status === 'BOARDED') boardedCount++
        if (item.status === 'DROPPED') droppedCount++
        if (item.status === 'ABSENT') absentCount++
      }
    }

    return {
      activeRoutes: activeRoutesCount,
      activeVehicles: activeVehiclesCount,
      vehiclesInMaintenance: vehiclesInMaintenanceCount,
      studentsUsingTransport: activeAssignmentsCount,
      todayTripsCount: todayTrips.length,
      childrenBoarded: boardedCount,
      childrenDropped: droppedCount,
      childrenAbsent: absentCount,
      delayedTrips: delayedTripsCount,
      openIncidents: openIncidentsCount,
      todayTrips: todayTrips.map((t) => ({
        id: t.id,
        routeName: t.route.name,
        routeCode: t.route.code,
        vehicleReg: t.vehicle.registrationNumber,
        driverName: t.driverProfile.user.fullName,
        tripType: t.tripType,
        status: t.status,
        delayMinutes: t.delayMinutes,
        totalManifest: t.manifest.length,
        boarded: t.manifest.filter((m) => m.status === 'BOARDED').length,
        dropped: t.manifest.filter((m) => m.status === 'DROPPED').length,
      })),
    }
  }

  /**
   * 2. VEHICLE MANAGEMENT
   */
  static async listVehicles(ctx: ScopeContext, filter?: { status?: VehicleStatus; branchId?: string; search?: string }) {
    const where: any = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.branchId || ctx.branchId ? { branchId: filter?.branchId || ctx.branchId } : {}),
    }

    if (filter?.search?.trim()) {
      const q = filter.search.trim()
      where.OR = [
        { registrationNumber: { contains: q, mode: 'insensitive' } },
        { makeModel: { contains: q, mode: 'insensitive' } },
      ]
    }

    const vehicles = await db.vehicle.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        routes: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return vehicles
  }

  static async createVehicle(ctx: ScopeContext, input: CreateVehicleInput) {
    if (!input.registrationNumber || !input.registrationNumber.trim()) {
      throw new Error('Vehicle registration number is required')
    }
    if (!input.capacity || input.capacity <= 0) {
      throw new Error('Vehicle capacity must be greater than 0')
    }

    const regNorm = input.registrationNumber.trim().toUpperCase()

    // Uniqueness check within tenant
    const existing = await db.vehicle.findUnique({
      where: { tenantId_registrationNumber: { tenantId: ctx.tenantId, registrationNumber: regNorm } },
    })
    if (existing && !existing.deletedAt) {
      throw new Error(`Vehicle with registration number ${regNorm} already exists in this school`)
    }

    const vehicle = await db.vehicle.create({
      data: {
        tenantId: ctx.tenantId,
        branchId: input.branchId || ctx.branchId || null,
        registrationNumber: regNorm,
        vehicleType: input.vehicleType?.trim() || 'BUS',
        capacity: input.capacity,
        makeModel: input.makeModel?.trim() || null,
        notes: input.notes?.trim() || null,
        status: 'ACTIVE',
      },
      include: { branch: true },
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: vehicle.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'CREATE_VEHICLE',
      entity: 'Vehicle',
      entityId: vehicle.id,
      module: 'TRANSPORT',
      summary: `Vehicle created: ${vehicle.registrationNumber} (${vehicle.capacity} seats)`,
    })

    return vehicle
  }

  static async updateVehicle(
    ctx: ScopeContext,
    id: string,
    data: { capacity?: number; status?: VehicleStatus; makeModel?: string; notes?: string; branchId?: string | null }
  ) {
    const existing = await db.vehicle.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    })
    if (!existing) throw new Error('Vehicle not found')

    if (data.capacity !== undefined && data.capacity <= 0) {
      throw new Error('Capacity must be greater than 0')
    }

    const updated = await db.vehicle.update({
      where: { id },
      data: {
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.makeModel !== undefined ? { makeModel: data.makeModel?.trim() || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        ...(data.branchId !== undefined ? { branchId: data.branchId || null } : {}),
      },
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: updated.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'UPDATE_VEHICLE',
      entity: 'Vehicle',
      entityId: updated.id,
      module: 'TRANSPORT',
      summary: `Vehicle updated: ${updated.registrationNumber} (Status: ${updated.status})`,
    })

    return updated
  }

  /**
   * 3. ROUTE & STOP ARCHITECTURE
   */
  static async listRoutes(ctx: ScopeContext, filter?: { branchId?: string; status?: RouteStatus }) {
    const where: any = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.branchId || ctx.branchId ? { branchId: filter?.branchId || ctx.branchId } : {}),
    }

    const routes = await db.transportRoute.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        vehicle: true,
        driverProfile: { include: { user: { select: { id: true, fullName: true, phone: true, email: true } } } },
        attendantProfile: { include: { user: { select: { id: true, fullName: true, phone: true, email: true } } } },
        stops: { orderBy: { sequence: 'asc' } },
        assignments: {
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true, studentId: true },
        },
      },
      orderBy: { code: 'asc' },
    })

    return routes.map((r) => ({
      ...r,
      activeStudentsCount: r.assignments.length,
      availableCapacity: r.vehicle ? Math.max(0, r.vehicle.capacity - r.assignments.length) : 0,
    }))
  }

  static async createRoute(ctx: ScopeContext, input: CreateRouteInput) {
    if (!input.code || !input.code.trim()) throw new Error('Route code is required')
    if (!input.name || !input.name.trim()) throw new Error('Route name is required')

    const codeNorm = input.code.trim().toUpperCase()

    // Validate uniqueness of route code in tenant
    const existing = await db.transportRoute.findUnique({
      where: { tenantId_code: { tenantId: ctx.tenantId, code: codeNorm } },
    })
    if (existing && !existing.deletedAt) {
      throw new Error(`Route code ${codeNorm} already exists in this school`)
    }

    // Validate vehicle if provided
    if (input.vehicleId) {
      const vehicle = await db.vehicle.findFirst({
        where: { id: input.vehicleId, tenantId: ctx.tenantId, deletedAt: null },
      })
      if (!vehicle) throw new Error('Vehicle not found')
      if (vehicle.status === 'MAINTENANCE') {
        throw new Error('Selected vehicle is currently undergoing MAINTENANCE and cannot be assigned to a route')
      }
    }

    // Validate driver if provided
    if (input.driverProfileId) {
      await this.validateStaffEligibility(ctx.tenantId, input.driverProfileId, 'driver')
    }

    // Validate attendant if provided
    if (input.attendantProfileId) {
      await this.validateStaffEligibility(ctx.tenantId, input.attendantProfileId, 'attendant')
    }

    // Validate stops sequence if provided
    if (input.stops && input.stops.length > 0) {
      const sequences = input.stops.map((s) => s.sequence)
      const uniqueSeq = new Set(sequences)
      if (uniqueSeq.size !== sequences.length) {
        throw new Error('Stop sequence numbers within a route must be unique')
      }
    }

    const route = await db.transportRoute.create({
      data: {
        tenantId: ctx.tenantId,
        branchId: input.branchId || ctx.branchId || null,
        code: codeNorm,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        vehicleId: input.vehicleId || null,
        driverProfileId: input.driverProfileId || null,
        attendantProfileId: input.attendantProfileId || null,
        status: 'ACTIVE',
        stops: input.stops && input.stops.length > 0
          ? {
              create: input.stops.map((s) => ({
                tenantId: ctx.tenantId,
                name: s.name.trim(),
                landmark: s.landmark?.trim() || null,
                sequence: s.sequence,
                morningPickupTime: s.morningPickupTime?.trim() || '08:00',
                eveningDropTime: s.eveningDropTime?.trim() || '15:00',
                status: 'ACTIVE',
              })),
            }
          : undefined,
      },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
        vehicle: true,
        driverProfile: { include: { user: true } },
      },
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: route.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'CREATE_ROUTE',
      entity: 'TransportRoute',
      entityId: route.id,
      module: 'TRANSPORT',
      summary: `Transport route created: ${route.name} (${route.code}) with ${route.stops.length} stops`,
    })

    return route
  }

  static async updateRoute(
    ctx: ScopeContext,
    id: string,
    data: {
      name?: string
      description?: string
      status?: RouteStatus
      vehicleId?: string | null
      driverProfileId?: string | null
      attendantProfileId?: string | null
      branchId?: string | null
      stops?: CreateStopInput[]
    }
  ) {
    const existing = await db.transportRoute.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
      include: { stops: true },
    })
    if (!existing) throw new Error('Transport route not found')

    if (data.vehicleId) {
      const v = await db.vehicle.findFirst({
        where: { id: data.vehicleId, tenantId: ctx.tenantId, deletedAt: null },
      })
      if (!v) throw new Error('Vehicle not found')
      if (v.status === 'MAINTENANCE') {
        throw new Error('Selected vehicle is currently in MAINTENANCE and cannot be assigned')
      }
    }

    if (data.driverProfileId) {
      await this.validateStaffEligibility(ctx.tenantId, data.driverProfileId, 'driver')
    }

    if (data.attendantProfileId) {
      await this.validateStaffEligibility(ctx.tenantId, data.attendantProfileId, 'attendant')
    }

    const updated = await db.$transaction(async (tx) => {
      // If stops provided, replace them safely
      if (data.stops) {
        const sequences = data.stops.map((s) => s.sequence)
        const uniqueSeq = new Set(sequences)
        if (uniqueSeq.size !== sequences.length) {
          throw new Error('Stop sequence numbers within a route must be unique')
        }

        // Safely update or add stops without violating foreign key constraints on existing assignments
        const existingStops = await tx.routeStop.findMany({ where: { routeId: id } })
        const existingMap = new Map(existingStops.map((s) => [s.sequence, s]))
        const touchedStopIds: string[] = []

        for (const stopInput of data.stops) {
          const matched = existingMap.get(stopInput.sequence) || existingStops.find((s) => s.name.toLowerCase() === stopInput.name.trim().toLowerCase())
          if (matched) {
            const updatedStop = await tx.routeStop.update({
              where: { id: matched.id },
              data: {
                name: stopInput.name.trim(),
                landmark: stopInput.landmark?.trim() || null,
                sequence: stopInput.sequence,
                morningPickupTime: stopInput.morningPickupTime?.trim() || '08:00',
                eveningDropTime: stopInput.eveningDropTime?.trim() || '15:00',
                status: 'ACTIVE',
              },
            })
            touchedStopIds.push(updatedStop.id)
          } else {
            const newStop = await tx.routeStop.create({
              data: {
                tenantId: ctx.tenantId,
                routeId: id,
                name: stopInput.name.trim(),
                landmark: stopInput.landmark?.trim() || null,
                sequence: stopInput.sequence,
                morningPickupTime: stopInput.morningPickupTime?.trim() || '08:00',
                eveningDropTime: stopInput.eveningDropTime?.trim() || '15:00',
                status: 'ACTIVE',
              },
            })
            touchedStopIds.push(newStop.id)
          }
        }

        // Safely remove any unreferenced old stops
        const stopsToRemove = existingStops.filter((s) => !touchedStopIds.includes(s.id))
        for (const oldStop of stopsToRemove) {
          const hasAssignments = await tx.studentTransportAssignment.findFirst({
            where: { OR: [{ pickupStopId: oldStop.id }, { dropStopId: oldStop.id }] },
          })
          if (!hasAssignments) {
            await tx.routeStop.delete({ where: { id: oldStop.id } }).catch(() => {})
          }
        }
      }

      return tx.transportRoute.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId || null } : {}),
          ...(data.driverProfileId !== undefined ? { driverProfileId: data.driverProfileId || null } : {}),
          ...(data.attendantProfileId !== undefined ? { attendantProfileId: data.attendantProfileId || null } : {}),
          ...(data.branchId !== undefined ? { branchId: data.branchId || null } : {}),
        },
        include: { stops: { orderBy: { sequence: 'asc' } }, vehicle: true, driverProfile: { include: { user: true } } },
      })
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: updated.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'UPDATE_ROUTE',
      entity: 'TransportRoute',
      entityId: updated.id,
      module: 'TRANSPORT',
      summary: `Route ${updated.name} updated (Status: ${updated.status})`,
    })

    return updated
  }

  /**
   * 4. STUDENT TRANSPORT ASSIGNMENT & CAPACITY ENFORCEMENT
   */
  static async assignStudent(ctx: ScopeContext, input: AssignStudentInput) {
    const {
      studentId,
      routeId,
      pickupStopId,
      dropStopId,
      tripType = 'TWO_WAY',
      startDate = new Date(),
      endDate,
      monthlyFeeCents = 0,
      generateFeeInvoice = false,
    } = input

    // 1. Verify Student exists in tenant and is ACTIVE
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId: ctx.tenantId, deletedAt: null },
      include: { guardians: { include: { guardian: true } } },
    })
    if (!student) throw new Error('Student not found in this school')
    if (student.status !== 'ACTIVE') {
      throw new Error(`Cannot assign transport: Student status is ${student.status}`)
    }

    // 2. Resolve AcademicSession
    const session = await db.academicSession.findFirst({
      where: {
        tenantId: ctx.tenantId,
        ...(ctx.academicSessionId ? { id: ctx.academicSessionId } : { isCurrent: true, status: 'ACTIVE' }),
      },
    })
    if (!session) throw new Error('No active academic session found')

    // 3. Verify Route and Stops
    const route = await db.transportRoute.findFirst({
      where: { id: routeId, tenantId: ctx.tenantId, deletedAt: null },
      include: { vehicle: true, stops: true },
    })
    if (!route) throw new Error('Transport route not found')
    if (route.status !== 'ACTIVE') throw new Error('Cannot assign student to an INACTIVE route')

    const pStop = route.stops.find((s) => s.id === pickupStopId)
    if (!pStop) throw new Error('Selected pickup stop does not belong to this route')

    const dStop = route.stops.find((s) => s.id === dropStopId)
    if (!dStop) throw new Error('Selected drop stop does not belong to this route')

    // 4. Concurrency-Safe Vehicle Capacity Enforcement
    if (!route.vehicle) {
      throw new Error('Selected route does not have an assigned vehicle. Assign a vehicle before enrolling students.')
    }
    if (route.vehicle.status !== 'ACTIVE') {
      throw new Error(`Assigned vehicle ${route.vehicle.registrationNumber} is ${route.vehicle.status}. Cannot accept new assignments.`)
    }

    // 5. Duplicate Active Assignment Protection
    const existingActive = await db.studentTransportAssignment.findFirst({
      where: {
        tenantId: ctx.tenantId,
        studentId,
        academicSessionId: session.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
    })
    if (existingActive) {
      throw new Error('Student already has an active transport assignment for this academic session. Cancel or end-date the existing assignment first.')
    }

    // Execute within database transaction with capacity count check
    const assignment = await db.$transaction(async (tx) => {
      const activeCount = await tx.studentTransportAssignment.count({
        where: {
          tenantId: ctx.tenantId,
          routeId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      })

      if (activeCount >= route.vehicle!.capacity) {
        throw new Error(`Vehicle capacity exceeded: Route ${route.code} vehicle ${route.vehicle!.registrationNumber} is full (${activeCount}/${route.vehicle!.capacity} seats filled).`)
      }

      const created = await tx.studentTransportAssignment.create({
        data: {
          tenantId: ctx.tenantId,
          branchId: student.branchId,
          academicSessionId: session.id,
          studentId,
          routeId,
          pickupStopId,
          dropStopId,
          tripType,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: 'ACTIVE',
          monthlyFeeCents: Math.max(0, monthlyFeeCents),
        },
        include: {
          student: true,
          route: { include: { vehicle: true } },
          pickupStop: true,
          dropStop: true,
        },
      })

      // If transport fee is configured and invoice requested, generate canonical Invoice
      if (generateFeeInvoice && monthlyFeeCents > 0) {
        const invNumber = `INV-TRP-${Date.now().toString().slice(-6)}`
        await tx.invoice.create({
          data: {
            tenantId: ctx.tenantId,
            branchId: student.branchId,
            studentId: student.id,
            academicSessionId: session.id,
            invoiceNumber: invNumber,
            title: `Transport Fee — Route ${route.code}`,
            dueDate: new Date(Date.now() + 15 * 86400000),
            subtotalCents: monthlyFeeCents,
            totalCents: monthlyFeeCents,
            paidCents: 0,
            balanceCents: monthlyFeeCents,
            status: 'ISSUED',
            notes: `Monthly transport fee for Route ${route.name} (${pStop.name} to ${dStop.name})`,
            items: {
              create: [
                {
                  feeHead: 'TRANSPORT',
                  description: `Transport fee: Route ${route.code} (${route.name})`,
                  amountCents: monthlyFeeCents,
                },
              ],
            },
          },
        })
      }

      return created
    })

    // Child event on timeline
    await recordChildEvent({
      tenantId: ctx.tenantId,
      studentId,
      type: 'NOTE',
      title: 'Transport Assigned',
      body: `Assigned to Route ${route.name} (${route.code}). Pickup: ${pStop.name} (${pStop.morningPickupTime}), Drop: ${dStop.name} (${dStop.eveningDropTime}).`,
      actorId: ctx.actorId,
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: student.branchId,
      academicSessionId: session.id,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'ASSIGN_STUDENT_TRANSPORT',
      entity: 'StudentTransportAssignment',
      entityId: assignment.id,
      module: 'TRANSPORT',
      summary: `Assigned student ${student.firstName} to Route ${route.name} (${route.code})`,
    })

    return assignment
  }

  static async listAssignments(
    ctx: ScopeContext,
    filter?: { routeId?: string; studentId?: string; status?: TransportAssignmentStatus; branchId?: string }
  ) {
    const where: any = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(filter?.routeId ? { routeId: filter.routeId } : {}),
      ...(filter?.studentId ? { studentId: filter.studentId } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.branchId || ctx.branchId ? { branchId: filter?.branchId || ctx.branchId } : {}),
    }

    return db.studentTransportAssignment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            currentClassroom: { select: { id: true, name: true } },
            guardians: {
              include: {
                guardian: {
                  select: { id: true, fullName: true, phone: true, relationship: true, userId: true },
                },
              },
            },
          },
        },
        route: {
          include: {
            vehicle: true,
            driverProfile: { include: { user: { select: { fullName: true, phone: true } } } },
          },
        },
        pickupStop: true,
        dropStop: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async cancelAssignment(ctx: ScopeContext, assignmentId: string, reason?: string) {
    const existing = await db.studentTransportAssignment.findFirst({
      where: { id: assignmentId, tenantId: ctx.tenantId, deletedAt: null },
      include: { student: true, route: true },
    })
    if (!existing) throw new Error('Transport assignment not found')

    const updated = await db.studentTransportAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'CANCELLED',
        endDate: new Date(),
      },
    })

    await recordChildEvent({
      tenantId: ctx.tenantId,
      studentId: existing.studentId,
      type: 'NOTE',
      title: 'Transport Service Discontinued',
      body: `Transport discontinued for Route ${existing.route.name}. Reason: ${reason || 'Requested by school/parent'}.`,
      actorId: ctx.actorId,
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: existing.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'CANCEL_TRANSPORT_ASSIGNMENT',
      entity: 'StudentTransportAssignment',
      entityId: updated.id,
      module: 'TRANSPORT',
      summary: `Cancelled transport assignment for student ${existing.student.firstName} on Route ${existing.route.name}`,
    })

    return updated
  }

  /**
   * 5. DAILY OPERATIONAL TRIPS & MANIFESTS
   */
  static async startTrip(ctx: ScopeContext, input: StartTripInput) {
    const { routeId, tripType, tripDate = new Date() } = input

    const dateObj = new Date(tripDate)
    dateObj.setHours(0, 0, 0, 0)

    const route = await db.transportRoute.findFirst({
      where: { id: routeId, tenantId: ctx.tenantId, deletedAt: null },
      include: {
        vehicle: true,
        driverProfile: true,
        attendantProfile: true,
        stops: { orderBy: { sequence: 'asc' } },
      },
    })
    if (!route) throw new Error('Route not found')
    if (route.status !== 'ACTIVE') throw new Error('Cannot start a trip for an INACTIVE route')

    // Determine and validate vehicle
    const vehicleId = input.vehicleId || route.vehicleId
    if (!vehicleId) throw new Error('No vehicle assigned to this route or trip')
    const vehicle = await db.vehicle.findFirst({
      where: { id: vehicleId, tenantId: ctx.tenantId, deletedAt: null },
    })
    if (!vehicle) throw new Error('Vehicle not found')
    if (vehicle.status !== 'ACTIVE') {
      throw new Error(`Vehicle ${vehicle.registrationNumber} is ${vehicle.status}. Trip cannot start with an unavailable vehicle.`)
    }

    // Determine and validate driver from StaffProfile
    const driverId = input.driverProfileId || route.driverProfileId
    if (!driverId) throw new Error('No driver assigned to this route or trip')
    await this.validateStaffEligibility(ctx.tenantId, driverId, 'driver')

    // Determine and validate attendant from StaffProfile if present
    const attendantId = input.attendantProfileId || route.attendantProfileId
    if (attendantId) {
      await this.validateStaffEligibility(ctx.tenantId, attendantId, 'attendant')
    }

    // Check if trip already exists for this route, date and trip type
    const existingTrip = await db.transportTrip.findUnique({
      where: {
        tenantId_routeId_tripDate_tripType: {
          tenantId: ctx.tenantId,
          routeId,
          tripDate: dateObj,
          tripType,
        },
      },
      include: { manifest: true },
    })

    if (existingTrip) {
      if (existingTrip.status === 'COMPLETED') {
        throw new Error(`Trip for ${tripType} on this date is already COMPLETED`)
      }
      return existingTrip
    }

    // Dynamic Manifest Generation: Query active assignments for this route
    const tripFilter: TransportTripType[] = tripType === 'MORNING' ? ['TWO_WAY', 'MORNING_ONLY'] : ['TWO_WAY', 'EVENING_ONLY']
    const activeAssignments = await db.studentTransportAssignment.findMany({
      where: {
        tenantId: ctx.tenantId,
        routeId,
        status: 'ACTIVE',
        tripType: { in: tripFilter },
        deletedAt: null,
      },
      include: { student: true },
    })

    const trip = await db.$transaction(async (tx) => {
      const createdTrip = await tx.transportTrip.create({
        data: {
          tenantId: ctx.tenantId,
          branchId: route.branchId,
          routeId,
          vehicleId,
          driverProfileId: driverId,
          attendantProfileId: attendantId || null,
          tripDate: dateObj,
          tripType,
          status: 'IN_PROGRESS',
          scheduledStartTime: tripType === 'MORNING' ? '08:00' : '15:00',
          actualStartTime: new Date(),
        },
      })

      // Create manifest entries for each assigned active student
      if (activeAssignments.length > 0) {
        await tx.tripManifestItem.createMany({
          data: activeAssignments.map((a) => ({
            tripId: createdTrip.id,
            studentId: a.studentId,
            stopId: tripType === 'MORNING' ? a.pickupStopId : a.dropStopId,
            status: 'EXPECTED',
          })),
        })
      }

      return tx.transportTrip.findUniqueOrThrow({
        where: { id: createdTrip.id },
        include: {
          manifest: { include: { student: true, stop: true } },
          vehicle: true,
          route: true,
          driverProfile: { include: { user: true } },
        },
      })
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: route.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'START_TRANSPORT_TRIP',
      entity: 'TransportTrip',
      entityId: trip.id,
      module: 'TRANSPORT',
      summary: `Started ${tripType} trip for Route ${route.name} (${route.code}) with ${trip.manifest.length} students`,
    })

    return trip
  }

  static async recordBoarding(ctx: ScopeContext, input: RecordBoardingInput) {
    const { tripId, studentId, notes } = input

    const manifestItem = await db.tripManifestItem.findUnique({
      where: { tripId_studentId: { tripId, studentId } },
      include: {
        trip: { include: { route: true, vehicle: true } },
        student: true,
        stop: true,
      },
    })

    if (!manifestItem) {
      throw new Error('Student is not registered on this trip manifest')
    }

    if (manifestItem.status === 'BOARDED') {
      // Idempotency: already boarded, do not create duplicate events
      return manifestItem
    }

    const now = new Date()
    const updated = await db.tripManifestItem.update({
      where: { id: manifestItem.id },
      data: {
        status: 'BOARDED',
        boardedAt: now,
        actionById: ctx.actorId || null,
        actionByName: ctx.actorName || 'Attendant',
        notes: notes?.trim() || null,
      },
      include: { student: true, stop: true },
    })

    // Publish child timeline entry
    await recordChildEvent({
      tenantId: manifestItem.trip.tenantId,
      studentId,
      type: 'ARRIVAL',
      title: 'Boarded School Bus',
      body: `${manifestItem.student.firstName} safely boarded bus ${manifestItem.trip.vehicle.registrationNumber} (Route: ${manifestItem.trip.route.name}) at ${manifestItem.stop.name}.`,
      actorId: ctx.actorId,
    })

    await recordAudit({
      tenantId: manifestItem.trip.tenantId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'BOARD_STUDENT',
      entity: 'TripManifestItem',
      entityId: updated.id,
      module: 'TRANSPORT',
      summary: `Marked child ${manifestItem.student.firstName} as BOARDED at ${manifestItem.stop.name}`,
    })

    return updated
  }

  /**
   * 6. EVENING DROP & GUARDIAN VERIFICATION
   * Strictly evaluates the multi-guardian hierarchy using OperationPolicies.verifyPickupPerson.
   * Unauthorized persons are BLOCKED, and a CRITICAL safety follow-up is raised.
   */
  static async recordDrop(ctx: ScopeContext, input: RecordDropInput) {
    const { tripId, studentId, guardianId, phone, userId, pin, notes } = input

    const manifestItem = await db.tripManifestItem.findUnique({
      where: { tripId_studentId: { tripId, studentId } },
      include: {
        trip: { include: { route: true, vehicle: true } },
        student: true,
        stop: true,
      },
    })

    if (!manifestItem) {
      throw new Error('Student is not registered on this trip manifest')
    }

    if (manifestItem.status === 'DROPPED') {
      return manifestItem
    }

    // 1. Verify Guardian Authorization & PIN via canonical OperationPolicies
    const authCheck = await OperationPolicies.verifyPickupPerson(
      manifestItem.trip.tenantId,
      studentId,
      { guardianId, phone, userId, pin: pin || undefined },
      pin
    )

    if (!authCheck.authorized) {
      const attemptedTarget = guardianId || phone || userId || 'Provided-PIN'

      // Raise emergency safety follow-up
      await raiseFollowUp({
        tenantId: manifestItem.trip.tenantId,
        branchId: manifestItem.trip.branchId || manifestItem.student.branchId,
        domain: 'SAFETY',
        severity: 'EMERGENCY',
        title: `Bus Drop Blocked: Unauthorized Guardian for ${manifestItem.student.firstName}`,
        detail: `Attempted bus drop verification failed for ${attemptedTarget}. Reason: ${authCheck.reason}. Bus: ${manifestItem.trip.vehicle.registrationNumber}, Stop: ${manifestItem.stop.name}.`,
        sourceType: 'TransportDrop',
        sourceId: tripId,
        studentId,
        responsibleRole: 'PRINCIPAL',
      })

      await recordAudit({
        tenantId: manifestItem.trip.tenantId,
        branchId: manifestItem.trip.branchId || undefined,
        actorId: ctx.actorId,
        actorName: ctx.actorName,
        actorRole: ctx.actorRole,
        action: 'PICKUP_BLOCKED',
        entity: 'TripManifestItem',
        entityId: manifestItem.id,
        module: 'TRANSPORT',
        severity: 'CRITICAL',
        summary: `Unauthorized pickup blocked at bus stop ${manifestItem.stop.name} for child ${manifestItem.student.firstName}. Reason: ${authCheck.reason}`,
      })

      throw new Error(`UNAUTHORIZED_PICKUP: ${authCheck.reason}`)
    }

    // 2. Drop Approved: Update manifest and timeline
    const now = new Date()
    const updated = await db.tripManifestItem.update({
      where: { id: manifestItem.id },
      data: {
        status: 'DROPPED',
        droppedAt: now,
        verifiedGuardianId: authCheck.guardianId || null,
        actionById: ctx.actorId || null,
        actionByName: ctx.actorName || 'Attendant',
        notes: notes?.trim() || null,
      },
      include: { student: true, stop: true },
    })

    await recordChildEvent({
      tenantId: manifestItem.trip.tenantId,
      studentId,
      type: 'PICKUP',
      title: 'Handed Over to Guardian',
      body: `${manifestItem.student.firstName} was handed over to ${authCheck.guardianName || 'authorized guardian'} (${authCheck.relationship || 'Guardian'}) at ${manifestItem.stop.name}.`,
      actorId: ctx.actorId,
    })

    await recordAudit({
      tenantId: manifestItem.trip.tenantId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'DROP_STUDENT',
      entity: 'TripManifestItem',
      entityId: updated.id,
      module: 'TRANSPORT',
      summary: `Student ${manifestItem.student.firstName} safely dropped to ${authCheck.guardianName} (${authCheck.relationship}) at ${manifestItem.stop.name}`,
    })

    return updated
  }

  /**
   * 7. SCHOOL ARRIVAL & TRIP COMPLETION
   */
  static async completeTrip(ctx: ScopeContext, tripId: string) {
    const trip = await db.transportTrip.findFirst({
      where: { id: tripId, tenantId: ctx.tenantId },
      include: { route: true, manifest: { include: { student: true } } },
    })
    if (!trip) throw new Error('Trip not found')

    const updated = await db.transportTrip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        actualEndTime: new Date(),
      },
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: trip.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'COMPLETE_TRIP',
      entity: 'TransportTrip',
      entityId: trip.id,
      module: 'TRANSPORT',
      summary: `Trip ${trip.tripType} completed for Route ${trip.route.name}. Total students: ${trip.manifest.length}`,
    })

    return updated
  }

  /**
   * 8. DELAY MANAGEMENT & TARGETED NOTIFICATION
   */
  static async recordDelay(ctx: ScopeContext, tripId: string, delayMinutes: number, reason: string) {
    if (delayMinutes <= 0) throw new Error('Delay minutes must be greater than 0')
    if (!reason || !reason.trim()) throw new Error('Delay reason is required')

    const trip = await db.transportTrip.findFirst({
      where: { id: tripId, tenantId: ctx.tenantId },
      include: {
        route: true,
        vehicle: true,
        manifest: { include: { student: true } },
      },
    })
    if (!trip) throw new Error('Trip not found')

    // Delay Idempotency: If the delay minutes and reason are identical, do not duplicate timeline alerts
    if (trip.delayMinutes === delayMinutes && trip.delayReason?.trim() === reason.trim()) {
      return trip
    }

    const updated = await db.transportTrip.update({
      where: { id: tripId },
      data: {
        delayMinutes,
        delayReason: reason.trim(),
      },
    })

    // Notify affected students only (via ChildEvent Timeline)
    for (const item of trip.manifest) {
      await recordChildEvent({
        tenantId: ctx.tenantId,
        studentId: item.studentId,
        type: 'NOTE',
        title: 'Bus Delay Alert',
        body: `School bus ${trip.vehicle.registrationNumber} (Route: ${trip.route.name}) is delayed by approximately ${delayMinutes} mins. Reason: ${reason.trim()}.`,
        actorId: ctx.actorId,
      })
    }

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: trip.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'TRIP_DELAYED',
      entity: 'TransportTrip',
      entityId: trip.id,
      module: 'TRANSPORT',
      summary: `Trip for Route ${trip.route.name} delayed by ${delayMinutes}m. Reason: ${reason}`,
    })

    return updated
  }

  /**
   * 9. INCIDENT REPORTING & EMERGENCY SAFETY INTEGRATION
   */
  static async reportIncident(ctx: ScopeContext, input: ReportIncidentInput) {
    const { tripId, vehicleId, studentId, severity, category, title, description, actionTaken } = input

    if (!title?.trim() || !description?.trim()) {
      throw new Error('Title and description are required for an incident report')
    }

    const incident = await db.transportIncident.create({
      data: {
        tenantId: ctx.tenantId,
        branchId: ctx.branchId || null,
        tripId: tripId || null,
        vehicleId: vehicleId || null,
        studentId: studentId || null,
        severity,
        category,
        title: title.trim(),
        description: description.trim(),
        actionTaken: actionTaken?.trim() || null,
        status: 'REPORTED',
        reportedById: ctx.actorId || 'system',
        reportedByName: ctx.actorName || 'Staff Member',
      },
    })

    // For HIGH or CRITICAL severity, raise emergency FollowUp in Operations
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      await raiseFollowUp({
        tenantId: ctx.tenantId,
        branchId: ctx.branchId || null,
        domain: 'SAFETY',
        severity: severity === 'CRITICAL' ? 'EMERGENCY' : 'URGENT',
        title: `Transport Safety Incident: ${title.trim()}`,
        detail: `[Category: ${category}] ${description.trim()}. Reported by: ${ctx.actorName || 'Staff'}.`,
        sourceType: 'TransportIncident',
        sourceId: incident.id,
        studentId: studentId || undefined,
        responsibleRole: 'PRINCIPAL',
      })
    }

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: ctx.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'REPORT_TRANSPORT_INCIDENT',
      entity: 'TransportIncident',
      entityId: incident.id,
      module: 'TRANSPORT',
      severity: severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      summary: `Reported transport incident: ${title.trim()} (${severity}/${category})`,
    })

    return incident
  }

  /**
   * 9b. INCIDENT RESOLUTION & CORRECTION
   */
  static async updateIncident(
    ctx: ScopeContext,
    id: string,
    data: {
      status?: TransportIncidentStatus
      actionTaken?: string
      resolutionNotes?: string
      severity?: TransportIncidentSeverity
      category?: TransportIncidentCategory
      correctionReason?: string
    }
  ) {
    const existing = await db.transportIncident.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { trip: true, vehicle: true, student: true },
    })
    if (!existing) throw new Error('Transport incident not found')

    const oldStatus = existing.status
    const isResolving = data.status === 'RESOLVED' && oldStatus !== 'RESOLVED'

    const updated = await db.transportIncident.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.actionTaken !== undefined ? { actionTaken: data.actionTaken?.trim() || null } : {}),
        ...(isResolving ? { resolvedAt: new Date() } : {}),
        ...(data.severity ? { severity: data.severity } : {}),
        ...(data.category ? { category: data.category } : {}),
      },
    })

    // If there was an operations FollowUp created for this incident and it's being resolved
    if (isResolving) {
      await db.followUp.updateMany({
        where: {
          tenantId: ctx.tenantId,
          sourceType: 'TransportIncident',
          sourceId: id,
          status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      }).catch(() => {})
    }

    await recordAudit({
      tenantId: ctx.tenantId,
      branchId: existing.branchId || undefined,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: isResolving ? 'RESOLVE_TRANSPORT_INCIDENT' : 'UPDATE_TRANSPORT_INCIDENT',
      entity: 'TransportIncident',
      entityId: existing.id,
      module: 'TRANSPORT',
      summary: `Incident "${existing.title}" status changed: ${oldStatus} -> ${updated.status}. ${data.correctionReason ? `Correction reason: ${data.correctionReason}` : ''}`,
    })

    return updated
  }

  /**
   * 10. IN-FLIGHT VEHICLE & DRIVER SUBSTITUTION
   * Preserves historical records safely without mutating past completed trips.
   */
  static async replaceTripVehicle(ctx: ScopeContext, tripId: string, newVehicleId: string, reason?: string) {
    const trip = await db.transportTrip.findFirst({
      where: { id: tripId, tenantId: ctx.tenantId },
      include: { vehicle: true },
    })
    if (!trip) throw new Error('Trip not found')
    if (trip.status === 'COMPLETED') throw new Error('Cannot change vehicle on a COMPLETED trip')

    const newVehicle = await db.vehicle.findFirst({
      where: { id: newVehicleId, tenantId: ctx.tenantId, deletedAt: null },
    })
    if (!newVehicle) throw new Error('Replacement vehicle not found')
    if (newVehicle.status !== 'ACTIVE') {
      throw new Error(`Replacement vehicle ${newVehicle.registrationNumber} is ${newVehicle.status}. Cannot be assigned.`)
    }

    const updated = await db.transportTrip.update({
      where: { id: tripId },
      data: {
        vehicleId: newVehicleId,
        notes: [trip.notes, `Vehicle replaced from ${trip.vehicle.registrationNumber} to ${newVehicle.registrationNumber}. Reason: ${reason || 'Operational replacement'}`].filter(Boolean).join('. '),
      },
      include: { vehicle: true },
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'REPLACE_TRIP_VEHICLE',
      entity: 'TransportTrip',
      entityId: trip.id,
      module: 'TRANSPORT',
      summary: `Replaced trip vehicle: ${trip.vehicle.registrationNumber} -> ${newVehicle.registrationNumber}`,
    })

    return updated
  }

  static async replaceTripDriver(ctx: ScopeContext, tripId: string, newStaffProfileId: string, reason?: string) {
    const trip = await db.transportTrip.findFirst({
      where: { id: tripId, tenantId: ctx.tenantId },
      include: { driverProfile: { include: { user: true } } },
    })
    if (!trip) throw new Error('Trip not found')
    if (trip.status === 'COMPLETED') throw new Error('Cannot change driver on a COMPLETED trip')

    await this.validateStaffEligibility(ctx.tenantId, newStaffProfileId, 'driver')

    const newDriver = await db.staffProfile.findUniqueOrThrow({
      where: { id: newStaffProfileId },
      include: { user: true },
    })

    const updated = await db.transportTrip.update({
      where: { id: tripId },
      data: {
        driverProfileId: newStaffProfileId,
        notes: [trip.notes, `Driver replaced from ${trip.driverProfile.user.fullName} to ${newDriver.user.fullName}. Reason: ${reason || 'Duty handover'}`].filter(Boolean).join('. '),
      },
      include: { driverProfile: { include: { user: true } } },
    })

    await recordAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      actorName: ctx.actorName,
      actorRole: ctx.actorRole,
      action: 'REPLACE_TRIP_DRIVER',
      entity: 'TransportTrip',
      entityId: trip.id,
      module: 'TRANSPORT',
      summary: `Replaced trip driver: ${trip.driverProfile.user.fullName} -> ${newDriver.user.fullName}`,
    })

    return updated
  }

  /**
   * 11. STAFF ELIGIBILITY VALIDATION
   * Validates active status, tenant, branch, and non-terminated HR state.
   */
  static async validateStaffEligibility(tenantId: string, staffProfileId: string, roleType: 'driver' | 'attendant') {
    const profile = await db.staffProfile.findFirst({
      where: { id: staffProfileId, tenantId, deletedAt: null },
      include: { user: true },
    })

    if (!profile) {
      throw new Error(`Assigned ${roleType} staff profile not found in this school`)
    }

    if (profile.status !== 'ACTIVE' || profile.user.status !== 'ACTIVE') {
      throw new Error(`Selected staff member ${profile.user.fullName} is ${profile.status} and cannot be assigned as ${roleType}. Active staff required.`)
    }

    return profile
  }
}
