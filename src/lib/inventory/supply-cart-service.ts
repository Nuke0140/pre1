/**
 * PreOne — Inventory Module: Teacher Classroom Supply Cart Service
 *
 * Capabilities:
 * 1. Catalog Browsing: Filters active supplies for classroom use with branch-specific stock.
 * 2. Visual Icon / Category Mapping: Maps items to preschool-friendly emojis/icons & units.
 * 3. Server-side Cart Validation: Enforces positive quantities, active items, and stock bounds.
 * 4. Structured Request Persistence: Atomic creation of MaterialRequest and MaterialRequestItems.
 * 5. Multi-Channel Notifications: In-app notification to Principals on submission, and to Teachers on decision.
 * 6. Server-Side Approval & Rejection: Role-gated approval with mandatory rejection reasoning.
 * 7. Stock Safety & Fulfilment: Physical deduction only at confirmed fulfilment stage, preventing negative stock.
 * 8. Full Audit Logging & Scoping: Enforces tenant and branch isolation.
 */

import { db } from '@/lib/db'
import { nextNumber } from '@/lib/sequence'
import { AuditService } from '@/lib/audit/audit-service'
import { emit } from '@/lib/events'
import { InventoryService } from './inventory-service'
import { Prisma } from '@prisma/client'

export interface SupplyItemCatalogCard {
  id: string
  name: string
  sku: string
  description?: string | null
  imageUrl?: string | null
  itemType: string
  category: {
    id: string
    name: string
    code: string
  }
  unit: {
    id: string
    name: string
    symbol: string
  }
  availableStock: number
  physicalStock: number
  reorderLevel: number
  isLowStock: boolean
  isOutOfStock: boolean
  iconEmoji: string
  suggestedPackSize?: string
}

export interface SupplyCartLineInput {
  itemId: string
  quantity: number
  notes?: string
}

export interface SupplyRequestSubmissionInput {
  classroomId: string
  branchId?: string
  academicSessionId?: string
  requiredDate: Date | string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  purpose?: string
  notes?: string
  items: SupplyCartLineInput[]
}

export interface SupplyRequestActorContext {
  id: string
  name: string
  role?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Returns a suitable preschool emoji icon based on item name and category
 */
export function resolveSupplyItemIcon(itemName: string, categoryName: string): string {
  const name = itemName.toLowerCase()
  const cat = categoryName.toLowerCase()

  if (name.includes('crayon')) return '🖍️'
  if (name.includes('paper') || name.includes('sheet') || name.includes('chart')) return '📄'
  if (name.includes('paint') || name.includes('color') || cat.includes('art')) return '🎨'
  if (name.includes('wipe') || name.includes('tissue') || name.includes('napkin')) return '🧻'
  if (name.includes('glue') || name.includes('fevicol') || name.includes('adhesive')) return '🧴'
  if (name.includes('scissor') || name.includes('cutter')) return '✂️'
  if (name.includes('pencil') || name.includes('pen') || name.includes('marker')) return '✏️'
  if (name.includes('eraser') || name.includes('rubber')) return '🧼'
  if (name.includes('dough') || name.includes('clay') || name.includes('plasticine')) return '🧁'
  if (name.includes('ruler') || name.includes('scale')) return '📏'
  if (name.includes('book') || name.includes('notebook') || name.includes('diary')) return '📚'
  if (name.includes('sanitizer') || name.includes('soap') || name.includes('wash')) return '🧴'
  if (name.includes('mask') || name.includes('first aid') || name.includes('bandage')) return '🩹'
  if (name.includes('ball') || name.includes('toy') || name.includes('puzzle')) return '🧩'
  if (name.includes('bead') || name.includes('thread') || name.includes('craft')) return '🧵'
  if (name.includes('snack') || name.includes('food') || name.includes('fruit')) return '🍎'

  return '📦'
}

export class SupplyCartService {
  /**
   * 1. Get Teacher Supply Store Catalog
   */
  static async getCatalog(
    tenantId: string,
    params?: {
      branchId?: string
      categoryId?: string
      search?: string
      classroomId?: string
    }
  ): Promise<{
    items: SupplyItemCatalogCard[]
    categories: Array<{ id: string; name: string; code: string; count: number }>
    defaultBranchId: string | null
  }> {
    // Determine effective branch if not passed
    let branchId = params?.branchId
    if (!branchId && params?.classroomId) {
      const cls = await db.classroom.findFirst({
        where: { id: params.classroomId, tenantId },
        select: { branchId: true },
      })
      if (cls) branchId = cls.branchId
    }
    if (!branchId) {
      const mainBranch = await db.branch.findFirst({
        where: { tenantId, isMain: true, deletedAt: null },
        select: { id: true },
      })
      branchId = mainBranch?.id
    }

    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
      isActive: true,
      ...(params?.categoryId && params.categoryId !== 'ALL' ? { categoryId: params.categoryId } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { sku: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [dbItems, categoriesWithCount] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          unit: { select: { id: true, name: true, symbol: true } },
          stocks: branchId ? { where: { branchId } } : true,
        },
        orderBy: [{ isConsumable: 'desc' }, { name: 'asc' }],
      }),
      db.inventoryCategory.findMany({
        where: { tenantId, isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { items: { where: { isActive: true } } } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const formattedItems: SupplyItemCatalogCard[] = dbItems.map((item) => {
      const availableStock = item.stocks.reduce((acc, s) => acc + Number(s.availableQuantity), 0)
      const physicalStock = item.stocks.reduce((acc, s) => acc + Number(s.quantity), 0)
      const reorderLevel = Number(item.reorderLevel)
      const isOutOfStock = availableStock <= 0
      const isLowStock = !isOutOfStock && availableStock <= reorderLevel

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        imageUrl: (item as any).imageUrl || null,
        itemType: item.itemType,
        category: item.category,
        unit: item.unit,
        availableStock,
        physicalStock,
        reorderLevel,
        isLowStock,
        isOutOfStock,
        iconEmoji: resolveSupplyItemIcon(item.name, item.category?.name || ''),
        suggestedPackSize: item.unit ? `1 ${item.unit.name}` : undefined,
      }
    })

    const categories = categoriesWithCount.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      count: c._count.items,
    }))

    return {
      items: formattedItems,
      categories,
      defaultBranchId: branchId || null,
    }
  }

  /**
   * 2. Server-side Cart Validation
   */
  static async validateCart(
    tenantId: string,
    items: SupplyCartLineInput[],
    branchId?: string
  ): Promise<{
    isValid: boolean
    errors: string[]
    lineDetails: Array<{
      itemId: string
      name: string
      requestedQuantity: number
      availableStock: number
      unitSymbol: string
      isStockSufficient: boolean
      error?: string
    }>
  }> {
    const errors: string[] = []
    const lineDetails: any[] = []

    if (!items || items.length === 0) {
      return {
        isValid: false,
        errors: ['Classroom supply cart is empty. Add at least one supply item.'],
        lineDetails: [],
      }
    }

    const itemIds = items.map((i) => i.itemId)
    const dbItems = await db.inventoryItem.findMany({
      where: { id: { in: itemIds }, tenantId },
      include: {
        unit: { select: { symbol: true, name: true } },
        stocks: branchId ? { where: { branchId } } : true,
      },
    })

    const itemMap = new Map(dbItems.map((i) => [i.id, i]))

    for (const line of items) {
      const dbItem = itemMap.get(line.itemId)
      if (!dbItem) {
        errors.push(`Item ID ${line.itemId} does not exist in inventory catalog.`)
        continue
      }
      if (!dbItem.isActive) {
        errors.push(`Supply item "${dbItem.name}" is currently inactive or discontinued.`)
      }

      const qty = Number(line.quantity)
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        errors.push(`Quantity for "${dbItem.name}" must be a positive whole number.`)
      }

      const availableStock = dbItem.stocks.reduce((acc, s) => acc + Number(s.availableQuantity), 0)
      const isStockSufficient = availableStock >= qty

      let lineError: string | undefined
      if (availableStock <= 0) {
        lineError = `"${dbItem.name}" is currently out of stock.`
        errors.push(lineError)
      } else if (qty > availableStock) {
        lineError = `Requested ${qty} ${dbItem.unit?.symbol || 'units'} of "${dbItem.name}", but only ${availableStock} currently available.`
        errors.push(lineError)
      }

      lineDetails.push({
        itemId: line.itemId,
        name: dbItem.name,
        requestedQuantity: qty,
        availableStock,
        unitSymbol: dbItem.unit?.symbol || 'units',
        isStockSufficient,
        error: lineError,
      })
    }

    const stockIssues = lineDetails.filter((l) => !l.isStockSufficient)

    return {
      isValid: errors.length === 0,
      errors,
      lineDetails,
      stockIssues,
    }
  }

  /**
   * 3. Submit Classroom Supply Request for Principal Approval
   */
  static async submitSupplyRequest(
    tenantId: string,
    input: SupplyRequestSubmissionInput,
    actor: SupplyRequestActorContext
  ) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Cannot submit an empty supply cart. Please add items.')
    }

    // Resolve classroom
    if (!input.classroomId) {
      throw new Error('Classroom assignment is required for classroom supply requests.')
    }

    const classroom = await db.classroom.findFirst({
      where: { id: input.classroomId, tenantId, isActive: true },
    })
    if (!classroom) {
      throw new Error('Assigned classroom not found or is inactive in this school.')
    }

    const branchId = input.branchId || classroom.branchId

    // Validate cart against server-side stock
    const validation = await this.validateCart(tenantId, input.items, branchId)
    if (!validation.isValid) {
      throw new Error(`Cart validation failed: ${validation.errors.join('; ')}`)
    }

    // Format needed by date
    const rawReqDate = input.requiredDate ? new Date(input.requiredDate) : new Date(Date.now() + 2 * 86400000)
    const requiredDate = isNaN(rawReqDate.getTime()) ? new Date(Date.now() + 2 * 86400000) : rawReqDate

    // Generate unique sequential request number
    const requestNumber = await nextNumber('material_request', tenantId)

    // Atomic transaction
    const newRequest = await db.$transaction(async (tx) => {
      const req = await tx.materialRequest.create({
        data: {
          tenantId,
          branchId,
          academicSessionId: input.academicSessionId || classroom.academicSessionId || null,
          classroomId: classroom.id,
          requestNumber,
          requestedById: actor.id,
          requestedByName: actor.name,
          requestedByRole: actor.role || 'TEACHER',
          destinationType: 'CLASSROOM',
          destinationId: classroom.id,
          requiredDate,
          priority: input.priority || 'NORMAL',
          status: 'PENDING',
          reason: input.purpose?.trim() || `Classroom supplies for ${classroom.name}`,
          notes: input.notes?.trim() || null,
          items: {
            create: input.items.map((line) => ({
              itemId: line.itemId,
              requestedQuantity: Number(line.quantity),
              notes: line.notes?.trim() || null,
            })),
          },
        },
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  imageUrl: true,
                  unit: { select: { name: true, symbol: true } },
                  category: { select: { name: true } },
                },
              },
            },
          },
          classroom: { select: { id: true, name: true, code: true } },
          branch: { select: { id: true, name: true } },
        },
      })

      return req
    })

    // In-App Notification: Notify Principals & School Owners of pending request
    try {
      const approvers = await db.tenantUser.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { role: { in: ['OWNER', 'PRINCIPAL'] } },
            { roles: { hasSome: ['OWNER', 'PRINCIPAL'] } },
          ],
        },
        select: { userId: true },
      })

      const totalItemsCount = input.items.reduce((acc, i) => acc + Number(i.quantity), 0)
      const notifPromises = approvers.map((appr) =>
        db.inAppNotification.create({
          data: {
            tenantId,
            userId: appr.userId,
            title: `Supply Request: ${classroom.name}`,
            body: `${actor.name} requested ${input.items.length} supply items (${totalItemsCount} units) for ${classroom.name} — Review Request (${newRequest.requestNumber})`,
            category: 'INVENTORY',
            severity: 'INFO',
            linkUrl: `/app/inventory?tab=DISTRIBUTION&requestId=${newRequest.id}`,
            metadata: {
              requestId: newRequest.id,
              requestNumber: newRequest.requestNumber,
              classroomId: classroom.id,
              classroomName: classroom.name,
              itemCount: input.items.length,
            },
          },
        })
      )
      await Promise.allSettled(notifPromises)
    } catch (err) {
      console.warn('[SupplyCartService] Approver notification dispatch warning:', err)
    }

    // Audit Log
    await AuditService.record({
      tenantId,
      branchId,
      academicSessionId: input.academicSessionId || classroom.academicSessionId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MATERIAL_REQUEST_CREATED',
      entity: 'MaterialRequest',
      entityId: newRequest.id,
      module: 'INVENTORY',
      summary: `Teacher ${actor.name} submitted supply cart with ${input.items.length} item(s) for ${classroom.name} (${newRequest.requestNumber})`,
      newValues: {
        requestNumber: newRequest.requestNumber,
        classroom: classroom.name,
        itemCount: input.items.length,
      },
    })

    await emit({
      type: 'MaterialRequestCreated',
      tenantId,
      requestId: newRequest.id,
      requestNumber: newRequest.requestNumber,
      branchId,
      classroomId: classroom.id,
    })

    return newRequest
  }

  /**
   * 4. Approve Supply Request (Principal / Admin Action)
   */
  static async approveSupplyRequest(
    tenantId: string,
    requestId: string,
    actor: SupplyRequestActorContext,
    options?: {
      approvedItems?: Array<{ itemId: string; approvedQuantity: number }>
      notes?: string
    }
  ) {
    const existing = await db.materialRequest.findFirst({
      where: { id: requestId, tenantId },
      include: {
        items: { include: { item: true } },
        classroom: true,
      },
    })

    if (!existing) {
      throw new Error('Supply request not found.')
    }
    if (existing.status !== 'PENDING') {
      throw new Error(`Request ${existing.requestNumber} has already been processed (Current status: ${existing.status}).`)
    }

    const updated = await db.$transaction(async (tx) => {
      if (options?.approvedItems && options.approvedItems.length > 0) {
        for (const appItem of options.approvedItems) {
          await tx.materialRequestItem.updateMany({
            where: { materialRequestId: requestId, itemId: appItem.itemId },
            data: { approvedQuantity: Math.max(0, Number(appItem.approvedQuantity)) },
          })
        }
      } else {
        // Default approvedQuantity = requestedQuantity
        for (const itm of existing.items) {
          await tx.materialRequestItem.update({
            where: { id: itm.id },
            data: { approvedQuantity: itm.requestedQuantity },
          })
        }
      }

      return tx.materialRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedById: actor.id,
          approvedByName: actor.name,
          approvedAt: new Date(),
          notes: options?.notes ? (existing.notes ? `${existing.notes}\n[Approved]: ${options.notes}` : options.notes) : existing.notes,
        },
        include: {
          items: {
            include: {
              item: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
          classroom: { select: { id: true, name: true, code: true } },
        },
      })
    })

    // Notify requesting teacher
    try {
      await db.inAppNotification.create({
        data: {
          tenantId,
          userId: existing.requestedById,
          title: `Supply Request Approved!`,
          body: `Your classroom supply request ${existing.requestNumber} for ${existing.classroom?.name || 'Classroom'} has been approved by ${actor.name}. Inventory staff can now issue the materials.`,
          category: 'INVENTORY',
          severity: 'SUCCESS',
          linkUrl: `/app/inventory?tab=DISTRIBUTION&requestId=${existing.id}`,
          metadata: {
            requestId: existing.id,
            requestNumber: existing.requestNumber,
            approvedBy: actor.name,
          },
        },
      })
    } catch (err) {
      console.warn('[SupplyCartService] Teacher notification warning:', err)
    }

    // Audit Log
    await AuditService.record({
      tenantId,
      branchId: existing.branchId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MATERIAL_REQUEST_APPROVED',
      entity: 'MaterialRequest',
      entityId: existing.id,
      module: 'INVENTORY',
      summary: `Approved classroom supply request ${existing.requestNumber} for ${existing.classroom?.name || 'Classroom'}`,
    })

    await emit({
      type: 'MaterialRequestApproved',
      tenantId,
      requestId: existing.id,
      requestNumber: existing.requestNumber,
    })

    return updated
  }

  /**
   * 5. Reject Supply Request (Principal / Admin Action with Mandatory Reason)
   */
  static async rejectSupplyRequest(
    tenantId: string,
    requestId: string,
    reason: string,
    actor: SupplyRequestActorContext
  ) {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is mandatory when rejecting a supply request.')
    }

    const existing = await db.materialRequest.findFirst({
      where: { id: requestId, tenantId },
      include: { classroom: true },
    })

    if (!existing) {
      throw new Error('Supply request not found.')
    }
    if (existing.status !== 'PENDING') {
      throw new Error(`Request ${existing.requestNumber} has already been processed (Current status: ${existing.status}).`)
    }

    const updated = await db.materialRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedById: actor.id,
        rejectedByName: actor.name,
        rejectedAt: new Date(),
        rejectionReason: reason.trim(),
      },
      include: {
        items: { include: { item: true } },
        classroom: true,
      },
    })

    // Notify requesting teacher with rejection reason
    try {
      await db.inAppNotification.create({
        data: {
          tenantId,
          userId: existing.requestedById,
          title: `Supply Request Rejected`,
          body: `Supply request ${existing.requestNumber} was rejected by ${actor.name}. Reason: ${reason.trim()}`,
          category: 'INVENTORY',
          severity: 'WARNING',
          linkUrl: `/app/inventory?tab=DISTRIBUTION&requestId=${existing.id}`,
          metadata: {
            requestId: existing.id,
            requestNumber: existing.requestNumber,
            rejectionReason: reason.trim(),
          },
        },
      })
    } catch (err) {
      console.warn('[SupplyCartService] Teacher rejection notification warning:', err)
    }

    // Audit Log
    await AuditService.record({
      tenantId,
      branchId: existing.branchId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MATERIAL_REQUEST_REJECTED',
      entity: 'MaterialRequest',
      entityId: existing.id,
      module: 'INVENTORY',
      summary: `Rejected classroom supply request ${existing.requestNumber}. Reason: ${reason.trim()}`,
      newValues: { rejectionReason: reason.trim() },
    })

    return updated
  }

  /**
   * 6. Fulfill / Issue Approved Classroom Supplies (Physical stock deduction)
   */
  static async fulfillSupplyRequest(
    tenantId: string,
    requestId: string,
    actor: SupplyRequestActorContext,
    input: {
      locationId: string
      items?: Array<{ itemId: string; quantity: number }>
      recipientNotes?: string
    }
  ) {
    const existing = await db.materialRequest.findFirst({
      where: { id: requestId, tenantId },
      include: {
        items: { include: { item: true } },
        classroom: true,
      },
    })

    if (!existing) {
      throw new Error('Supply request not found.')
    }
    if (existing.status !== 'APPROVED' && existing.status !== 'PARTIALLY_ISSUED') {
      throw new Error(`Cannot fulfill request in status '${existing.status}'. Only APPROVED requests can be fulfilled.`)
    }

    // Validate location belongs to branch
    const location = await db.inventoryLocation.findFirst({
      where: { id: input.locationId, tenantId, branchId: existing.branchId, isActive: true },
    })
    if (!location) {
      throw new Error('Selected store location not found or inactive in this campus branch.')
    }

    // Items to issue
    const itemsToIssue: Array<{ itemId: string; quantity: number }> = []

    if (input.items && input.items.length > 0) {
      for (const line of input.items) {
        const reqItem = existing.items.find((i) => i.itemId === line.itemId)
        if (!reqItem) continue
        const remainingToIssue = Math.max(
          0,
          Number(reqItem.approvedQuantity ?? reqItem.requestedQuantity) - Number(reqItem.issuedQuantity)
        )
        const qty = Math.min(Number(line.quantity), remainingToIssue)
        if (qty > 0) {
          itemsToIssue.push({ itemId: line.itemId, quantity: qty })
        }
      }
    } else {
      // Default: issue all remaining approved quantities
      for (const reqItem of existing.items) {
        const remaining = Math.max(
          0,
          Number(reqItem.approvedQuantity ?? reqItem.requestedQuantity) - Number(reqItem.issuedQuantity)
        )
        if (remaining > 0) {
          itemsToIssue.push({ itemId: reqItem.itemId, quantity: remaining })
        }
      }
    }

    if (itemsToIssue.length === 0) {
      throw new Error('All approved quantities for this request have already been issued.')
    }

    // Execute atomic issue via InventoryService.issueStock
    const issueResult = await InventoryService.issueStock(
      tenantId,
      {
        branchId: existing.branchId,
        academicSessionId: existing.academicSessionId || undefined,
        locationId: input.locationId,
        materialRequestId: existing.id,
        destinationType: 'CLASSROOM',
        destinationId: existing.classroomId || undefined,
        classroomId: existing.classroomId || undefined,
        recipientName: existing.requestedByName,
        notes: input.recipientNotes || `Fulfilled classroom supply request ${existing.requestNumber}`,
        items: itemsToIssue,
      },
      actor
    )

    if (!issueResult) {
      throw new Error('Stock issue failed: Insufficient stock or invalid store location.')
    }

    // Notify teacher
    try {
      await db.inAppNotification.create({
        data: {
          tenantId,
          userId: existing.requestedById,
          title: `Classroom Supplies Issued!`,
          body: `Supplies for ${existing.classroom?.name || 'Classroom'} (${existing.requestNumber}) have been physically issued from ${location.name} (Issue: ${issueResult.issueNumber}).`,
          category: 'INVENTORY',
          severity: 'INFO',
          linkUrl: `/app/inventory?tab=DISTRIBUTION&requestId=${existing.id}`,
          metadata: {
            requestId: existing.id,
            issueNumber: issueResult.issueNumber,
          },
        },
      })
    } catch (err) {
      console.warn('[SupplyCartService] Fulfilment notification warning:', err)
    }

    // Return refreshed request state
    const refreshed = await db.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        items: { include: { item: { select: { id: true, name: true, sku: true, unit: true } } } },
        classroom: true,
        issues: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { item: true } }, location: true },
        },
      },
    })

    return {
      ...(refreshed || {}),
      request: refreshed,
      stockIssue: issueResult,
      issueNumber: issueResult.issueNumber,
    }
  }

  /**
   * 7. Get Full Details of a Single Supply Request
   */
  static async getRequestDetails(tenantId: string, requestId: string) {
    const request = await db.materialRequest.findFirst({
      where: { id: requestId, tenantId },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                imageUrl: true,
                reorderLevel: true,
                unit: { select: { id: true, name: true, symbol: true } },
                category: { select: { id: true, name: true, code: true } },
                stocks: true,
              },
            },
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            code: true,
            programType: true,
            primaryTeacher: { select: { id: true, fullName: true, email: true } },
          },
        },
        branch: { select: { id: true, name: true, code: true } },
        issues: {
          orderBy: { createdAt: 'desc' },
          include: {
            location: { select: { id: true, name: true } },
            items: {
              include: {
                item: { select: { id: true, name: true, unit: true } },
              },
            },
          },
        },
      },
    })

    if (!request) return null

    // Compute live stock summary for each item in the request
    const itemsWithLiveStock = request.items.map((line) => {
      const branchStocks = line.item.stocks.filter((s) => s.branchId === request.branchId)
      const currentAvailable = branchStocks.reduce((acc, s) => acc + Number(s.availableQuantity), 0)
      const requestedQty = Number(line.requestedQuantity)
      const approvedQty = line.approvedQuantity !== null ? Number(line.approvedQuantity) : null
      const issuedQty = Number(line.issuedQuantity)

      return {
        id: line.id,
        itemId: line.item.id,
        name: line.item.name,
        sku: line.item.sku,
        imageUrl: line.item.imageUrl,
        category: line.item.category.name,
        unit: line.item.unit.symbol || line.item.unit.name,
        requestedQuantity: requestedQty,
        approvedQuantity: approvedQty,
        issuedQuantity: issuedQty,
        currentAvailableStock: currentAvailable,
        isStockSufficient: currentAvailable >= requestedQty,
        notes: line.notes,
        iconEmoji: resolveSupplyItemIcon(line.item.name, line.item.category.name),
      }
    })

    return {
      ...request,
      items: itemsWithLiveStock,
    }
  }

  /**
   * 8. Resolve teacher's default classroom in the active tenant/branch
   */
  static async getTeacherClassroom(tenantId: string, teacherUserId: string, branchId?: string) {
    // 1. Direct primary teacher assignment
    const primaryClass = await db.classroom.findFirst({
      where: {
        tenantId,
        primaryTeacherId: teacherUserId,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
    })

    if (primaryClass) {
      const branch = primaryClass.branchId
        ? await db.branch.findUnique({ where: { id: primaryClass.branchId } })
        : null

      return {
        id: primaryClass.id,
        name: primaryClass.name,
        code: primaryClass.code,
        programType: primaryClass.programType,
        branchId: primaryClass.branchId,
        branchName: branch?.name || null,
        isPrimary: true,
      }
    }

    // 2. Fall back to any active classroom in branch
    const anyClass = await db.classroom.findFirst({
      where: {
        tenantId,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { name: 'asc' },
    })

    if (anyClass) {
      const branch = anyClass.branchId
        ? await db.branch.findUnique({ where: { id: anyClass.branchId } })
        : null

      return {
        id: anyClass.id,
        name: anyClass.name,
        code: anyClass.code,
        programType: anyClass.programType,
        branchId: anyClass.branchId,
        branchName: branch?.name || null,
        isPrimary: false,
      }
    }

    return null
  }
}
