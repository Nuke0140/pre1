/**
 * PreOne — Inventory Module: Student Welcome Kit Bundles Service
 *
 * Capabilities:
 * 1. Configurable Bundles: Supports preconfigured kits (e.g. Nursery Welcome Kit)
 *    with component inventory items, quantities, and variants (e.g. uniform sizes).
 * 2. Variant Resolution: Maps requested uniform size to concrete stock items.
 * 3. Live Stock Breakdown: Pre-checks availability for every bundle component.
 * 4. Atomic All-or-Nothing Issuance: Strict transactional deduction with raw SQL
 *    concurrency guard ('availableQuantity' >= quantity).
 * 5. Single Logical Operation: Creates StockIssue, StockIssueItem[], StockMovement[],
 *    and StudentKitIssuance in a single database transaction.
 * 6. Idempotency & Duplicate Guard: Prevents double-clicks, retries, and inadvertent re-issuance.
 * 7. Printable Handover Slip: Authoritative slip data provider for one-click printing & reprints.
 * 8. Full Audit Logging & Scoping: Strict tenant and branch isolation.
 */

import { db } from '@/lib/db'
import { nextNumber } from '@/lib/sequence'
import { AuditService } from '@/lib/audit/audit-service'
import { Prisma } from '@prisma/client'

export interface ActorContext {
  id: string
  name: string
  role: string
  branchId?: string | null
}

export interface WelcomeKitComponentDetail {
  bundleItemId: string
  itemName: string
  quantityRequired: number
  hasVariants: boolean
  variantType?: string | null
  selectedVariant?: string | null
  itemId: string
  sku: string
  unit: string
  availableStock: number
  hasSufficientStock: boolean
}

export interface WelcomeKitDetailsResult {
  bundle: {
    id: string
    name: string
    code: string
    description?: string | null
    programType?: string | null
    isActive: boolean
  }
  components: WelcomeKitComponentDetail[]
  totalItemsCount: number
  allInStock: boolean
  insufficientItems: string[]
  supportedSizes: string[]
  selectedSize?: string | null
  location: {
    id: string
    name: string
    code: string
  } | null
}

export interface IssueWelcomeKitInput {
  studentId: string
  bundleId?: string
  bundleCode?: string
  uniformSize?: string
  locationId?: string
  branchId?: string
  idempotencyKey?: string
  overrideDuplicate?: boolean
  notes?: string
  guardianName?: string
}

export interface HandoverSlipData {
  kitIssuanceId: string
  kitNumber: string
  bundleName: string
  issueDate: string
  issuedAtFormatted: string
  uniformSize: string | null
  status: string
  notes: string | null
  school: {
    tenantName: string
    branchName: string
    branchCode?: string | null
    branchAddress?: string | null
  }
  student: {
    id: string
    fullName: string
    admissionNo: string
    classroomName?: string | null
    gender?: string | null
    dob?: string | null
    guardianName?: string | null
    guardianPhone?: string | null
  }
  issuer: {
    id: string
    name: string
    role?: string | null
  }
  items: Array<{
    id: string
    itemName: string
    sku: string
    category: string
    quantity: number
    unit: string
  }>
  totalItemsQuantity: number
  stockIssueNumber: string
}

export class WelcomeKitService {
  /**
   * Allowed roles for issuing inventory kits
   */
  private static readonly AUTHORIZED_ISSUE_ROLES = [
    'OWNER',
    'PRINCIPAL',
    'ACCOUNTS',
    'PLATFORM_ADMIN',
    'ADMIN',
    'STAFF',
    'STORE_KEEPER',
    'INVENTORY_MANAGER',
  ]

  /**
   * Ensures the preconfigured Nursery Welcome Kit exists for the tenant.
   * Components:
   * - 2 Uniform Sets (Sizes S, M, L, XL)
   * - 1 School Bag
   * - 1 Student Diary
   * - 1 Phonics Workbook
   */
  static async getOrCreateDefaultNurseryWelcomeKit(
    tenantId: string,
    branchId?: string
  ) {
    // 1. Check if the bundle already exists
    let bundle = await db.inventoryBundle.findFirst({
      where: {
        tenantId,
        code: 'NURSERY_WELCOME_KIT',
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                unit: true,
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (bundle && bundle.items.length > 0) {
      return bundle
    }

    // 2. Ensure prerequisites exist: Categories & Units
    let uniformCat = await db.inventoryCategory.findFirst({
      where: { tenantId, code: 'CAT_UNIFORM' },
    })
    if (!uniformCat) {
      uniformCat = await db.inventoryCategory.create({
        data: {
          tenantId,
          code: 'CAT_UNIFORM',
          name: 'Uniforms & Apparel',
          description: 'School uniform sets, sportswear and apparel',
        },
      })
    }

    let bagCat = await db.inventoryCategory.findFirst({
      where: { tenantId, code: 'CAT_BAGS' },
    })
    if (!bagCat) {
      bagCat = await db.inventoryCategory.create({
        data: {
          tenantId,
          code: 'CAT_BAGS',
          name: 'Bags & Carriers',
          description: 'School bags, pouches and carriers',
        },
      })
    }

    let stationeryCat = await db.inventoryCategory.findFirst({
      where: { tenantId, code: 'CAT_STATIONERY' },
    })
    if (!stationeryCat) {
      stationeryCat = await db.inventoryCategory.create({
        data: {
          tenantId,
          code: 'CAT_STATIONERY',
          name: 'Stationery & Supplies',
          description: 'Diaries, notebooks, paper and desk supplies',
        },
      })
    }

    let booksCat = await db.inventoryCategory.findFirst({
      where: { tenantId, code: 'CAT_BOOKS' },
    })
    if (!booksCat) {
      booksCat = await db.inventoryCategory.create({
        data: {
          tenantId,
          code: 'CAT_BOOKS',
          name: 'Books & Workbooks',
          description: 'Textbooks, activity workbooks and readers',
        },
      })
    }

    let setUnit = await db.inventoryUnit.findFirst({
      where: { tenantId, code: 'SET' },
    })
    if (!setUnit) {
      setUnit = await db.inventoryUnit.create({
        data: {
          tenantId,
          code: 'SET',
          name: 'Set',
          symbol: 'set',
        },
      })
    }

    let pcsUnit = await db.inventoryUnit.findFirst({
      where: { tenantId, code: 'PCS' },
    })
    if (!pcsUnit) {
      pcsUnit = await db.inventoryUnit.create({
        data: {
          tenantId,
          code: 'PCS',
          name: 'Pieces',
          symbol: 'pcs',
        },
      })
    }

    // 3. Ensure Uniform Items with Sizes S, M, L, XL exist
    const sizes = ['S', 'M', 'L', 'XL'] as const
    const uniformItemIds: Record<string, string> = {}

    for (const size of sizes) {
      const sku = `UNI-NUR-${size}`
      let item = await db.inventoryItem.findFirst({
        where: { tenantId, sku },
      })
      if (!item) {
        item = await db.inventoryItem.create({
          data: {
            tenantId,
            sku,
            name: `Nursery Uniform Set (Size ${size})`,
            description: `Complete 2-piece preschool uniform set in size ${size}`,
            categoryId: uniformCat.id,
            unitId: setUnit.id,
            itemType: 'CONSUMABLE',
            isActive: true,
          },
        })
      }
      uniformItemIds[size] = item.id
    }

    // 4. Ensure School Bag exists
    let bagItem = await db.inventoryItem.findFirst({
      where: { tenantId, sku: 'BAG-PRE-01' },
    })
    if (!bagItem) {
      bagItem = await db.inventoryItem.create({
        data: {
          tenantId,
          sku: 'BAG-PRE-01',
          name: 'PreOne Ergonomic School Bag',
          description: 'Durable lightweight preschool backpack with bottle pocket',
          categoryId: bagCat.id,
          unitId: pcsUnit.id,
          itemType: 'CONSUMABLE',
          isActive: true,
        },
      })
    }

    // 5. Ensure Student Diary exists
    let diaryItem = await db.inventoryItem.findFirst({
      where: { tenantId, sku: 'DIR-STU-01' },
    })
    if (!diaryItem) {
      diaryItem = await db.inventoryItem.create({
        data: {
          tenantId,
          sku: 'DIR-STU-01',
          name: 'Student Communication Diary',
          description: 'Daily parent-teacher communication diary and progress log',
          categoryId: stationeryCat.id,
          unitId: pcsUnit.id,
          itemType: 'CONSUMABLE',
          isActive: true,
        },
      })
    }

    // 6. Ensure Phonics Workbook exists
    let phonicsItem = await db.inventoryItem.findFirst({
      where: { tenantId, sku: 'WB-PHON-01' },
    })
    if (!phonicsItem) {
      phonicsItem = await db.inventoryItem.create({
        data: {
          tenantId,
          sku: 'WB-PHON-01',
          name: 'Early Steps Phonics Workbook',
          description: 'Interactive phonics and early letter-sound mastery workbook',
          categoryId: booksCat.id,
          unitId: pcsUnit.id,
          itemType: 'CONSUMABLE',
          isActive: true,
        },
      })
    }

    // 7. Create or update the InventoryBundle
    if (!bundle) {
      bundle = await db.inventoryBundle.create({
        data: {
          tenantId,
          branchId: branchId || null,
          name: 'Nursery Welcome Kit',
          code: 'NURSERY_WELCOME_KIT',
          description:
            'Preconfigured welcome bundle issued to newly enrolled students. Includes 2 uniform sets (size selected), school bag, student diary, and phonics workbook.',
          programType: 'NURSERY',
          isActive: true,
        },
        include: {
          items: {
            include: {
              item: {
                include: {
                  unit: true,
                  category: true,
                },
              },
            },
          },
        },
      })
    }

    // 8. Create bundle items if they don't exist
    const existingItems = await db.inventoryBundleItem.findMany({
      where: { bundleId: bundle.id },
    })

    if (existingItems.length === 0) {
      // 2 Uniform Sets (with variants)
      await db.inventoryBundleItem.create({
        data: {
          bundleId: bundle.id,
          itemName: 'Uniform Set',
          quantity: 2,
          hasVariants: true,
          variantType: 'SIZE',
          variantMap: uniformItemIds,
          itemId: uniformItemIds['M'] || null, // default fallback variant
          sortOrder: 1,
        },
      })

      // 1 School Bag
      await db.inventoryBundleItem.create({
        data: {
          bundleId: bundle.id,
          itemName: 'School Bag',
          quantity: 1,
          hasVariants: false,
          itemId: bagItem.id,
          sortOrder: 2,
        },
      })

      // 1 Student Diary
      await db.inventoryBundleItem.create({
        data: {
          bundleId: bundle.id,
          itemName: 'Student Diary',
          quantity: 1,
          hasVariants: false,
          itemId: diaryItem.id,
          sortOrder: 3,
        },
      })

      // 1 Phonics Workbook
      await db.inventoryBundleItem.create({
        data: {
          bundleId: bundle.id,
          itemName: 'Phonics Workbook',
          quantity: 1,
          hasVariants: false,
          itemId: phonicsItem.id,
          sortOrder: 4,
        },
      })
    }

    // Re-fetch full bundle with items
    return db.inventoryBundle.findUniqueOrThrow({
      where: { id: bundle.id },
      include: {
        items: {
          include: {
            item: {
              include: {
                unit: true,
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  /**
   * Lists all active welcome kit bundles for a tenant/branch.
   * Auto-provisions the default Nursery Welcome Kit if no bundles exist.
   */
  static async listWelcomeKits(tenantId: string, branchId?: string) {
    if (!tenantId) throw new Error('Tenant ID is required')

    let bundles = await db.inventoryBundle.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                unit: true,
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (bundles.length === 0) {
      const defaultBundle = await this.getOrCreateDefaultNurseryWelcomeKit(tenantId, branchId)
      bundles = [defaultBundle]
    }

    return bundles.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      description: b.description,
      programType: b.programType,
      isActive: b.isActive,
      itemsCount: b.items.length,
      totalQuantity: b.items.reduce((acc, it) => acc + Number(it.quantity), 0),
      items: b.items.map((it) => ({
        id: it.id,
        itemName: it.itemName,
        quantity: Number(it.quantity),
        hasVariants: it.hasVariants,
        variantType: it.variantType,
        supportedVariants: it.variantMap ? Object.keys(it.variantMap as object) : [],
        defaultItemId: it.itemId,
      })),
    }))
  }

  /**
   * Resolves component items and checks live branch stock for a bundle.
   */
  static async getWelcomeKitDetails(
    tenantId: string,
    bundleIdOrCode: string,
    options: {
      branchId?: string
      locationId?: string
      uniformSize?: string
    } = {}
  ): Promise<WelcomeKitDetailsResult> {
    if (!tenantId) throw new Error('Tenant ID is required')

    // Find bundle by ID or Code
    let bundle = await db.inventoryBundle.findFirst({
      where: {
        tenantId,
        OR: [{ id: bundleIdOrCode }, { code: bundleIdOrCode }],
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                unit: true,
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!bundle) {
      if (bundleIdOrCode === 'NURSERY_WELCOME_KIT' || bundleIdOrCode === 'default') {
        bundle = await this.getOrCreateDefaultNurseryWelcomeKit(tenantId, options.branchId)
      } else {
        throw new Error('Welcome kit bundle not found')
      }
    }

    // Resolve Location
    let locationId = options.locationId
    let locationRecord = null

    if (locationId) {
      locationRecord = await db.inventoryLocation.findFirst({
        where: { id: locationId, tenantId },
      })
    } else if (options.branchId) {
      locationRecord = await db.inventoryLocation.findFirst({
        where: { tenantId, branchId: options.branchId, isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      locationId = locationRecord?.id
    } else {
      locationRecord = await db.inventoryLocation.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      locationId = locationRecord?.id
    }

    const uniformSize = options.uniformSize?.toUpperCase() || 'M'
    const components: WelcomeKitComponentDetail[] = []
    const supportedSizes: string[] = []
    let allInStock = true
    const insufficientItems: string[] = []

    for (const bItem of bundle.items) {
      let resolvedItemId = bItem.itemId
      let selectedVariant: string | null = null

      if (bItem.hasVariants && bItem.variantMap) {
        const vMap = bItem.variantMap as Record<string, any>
        supportedSizes.push(...Object.keys(vMap))

        const variantVal = vMap[uniformSize]
        if (typeof variantVal === 'string') {
          resolvedItemId = variantVal
        } else if (variantVal && typeof variantVal === 'object' && variantVal.itemId) {
          resolvedItemId = variantVal.itemId
        }
        selectedVariant = uniformSize
      }

      if (!resolvedItemId) {
        throw new Error(`Unable to resolve inventory item for bundle component '${bItem.itemName}'`)
      }

      // Fetch authoritative item master
      const itemMaster = await db.inventoryItem.findFirst({
        where: { id: resolvedItemId, tenantId },
        include: { unit: true, category: true },
      })

      if (!itemMaster) {
        throw new Error(`Inventory item for component '${bItem.itemName}' not found`)
      }

      // Check stock at location
      let availableStock = 0
      if (locationId) {
        const stockRecord = await db.inventoryStock.findFirst({
          where: { locationId, itemId: resolvedItemId },
        })
        availableStock = stockRecord ? Number(stockRecord.availableQuantity) : 0
      }

      const quantityRequired = Number(bItem.quantity)
      const hasSufficientStock = availableStock >= quantityRequired
      if (!hasSufficientStock) {
        allInStock = false
        insufficientItems.push(
          `${bItem.itemName} (${itemMaster.name}): need ${quantityRequired}, have ${availableStock}`
        )
      }

      components.push({
        bundleItemId: bItem.id,
        itemName: bItem.itemName,
        quantityRequired,
        hasVariants: bItem.hasVariants,
        variantType: bItem.variantType,
        selectedVariant,
        itemId: itemMaster.id,
        sku: itemMaster.sku,
        unit: itemMaster.unit.symbol || itemMaster.unit.name,
        availableStock,
        hasSufficientStock,
      })
    }

    const totalItemsCount = components.reduce((acc, c) => acc + c.quantityRequired, 0)

    return {
      bundle: {
        id: bundle.id,
        name: bundle.name,
        code: bundle.code,
        description: bundle.description,
        programType: bundle.programType,
        isActive: bundle.isActive,
      },
      components,
      totalItemsCount,
      allInStock,
      insufficientItems,
      supportedSizes: Array.from(new Set(supportedSizes)),
      selectedSize: uniformSize,
      location: locationRecord
        ? {
            id: locationRecord.id,
            name: locationRecord.name,
            code: locationRecord.code,
          }
        : null,
    }
  }

  /**
   * Validates student eligibility for welcome kit issuance.
   */
  static async checkStudentEligibility(
    tenantId: string,
    studentId: string,
    branchId?: string
  ) {
    if (!tenantId || !studentId) throw new Error('Tenant ID and Student ID are required')

    const student = await db.student.findFirst({
      where: {
        id: studentId,
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        currentClassroom: true,
        guardians: {
          include: { guardian: true },
          where: { isPrimary: true },
        },
        kitIssuances: {
          orderBy: { createdAt: 'desc' },
          include: {
            stockIssue: true,
          },
        },
      },
    })

    if (!student) {
      throw new Error('Student not found or unauthorized for this branch')
    }

    if (student.deletedAt) {
      throw new Error('Student record is deleted')
    }

    const primaryGuardian = student.guardians[0]?.guardian
    const previousIssuance = student.kitIssuances[0]

    return {
      eligible: true,
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        fullName: `${student.firstName} ${student.lastName || ''}`.trim(),
        firstName: student.firstName,
        lastName: student.lastName,
        branchId: student.branchId,
        status: student.status,
        classroom: student.currentClassroom
          ? {
              id: student.currentClassroom.id,
              name: student.currentClassroom.name,
            }
          : null,
        primaryGuardian: primaryGuardian
          ? {
              id: primaryGuardian.id,
              name: primaryGuardian.fullName,
              phone: primaryGuardian.phone,
              relationship: primaryGuardian.relationship,
            }
          : null,
      },
      hasPreviousKit: !!previousIssuance,
      previousKit: previousIssuance
        ? {
            id: previousIssuance.id,
            kitNumber: previousIssuance.kitNumber,
            bundleName: previousIssuance.bundleName,
            issueDate: previousIssuance.createdAt,
            variantValues: previousIssuance.variantValues,
            stockIssueNumber: previousIssuance.stockIssue?.issueNumber,
          }
        : null,
    }
  }

  /**
   * ATOMIC WELCOME KIT ISSUANCE
   *
   * Enforces all-or-nothing stock deduction. If any component is unavailable,
   * the entire transaction rolls back cleanly with zero stock deductions.
   */
  static async issueWelcomeKit(
    tenantId: string,
    input: IssueWelcomeKitInput,
    actor: ActorContext
  ) {
    if (!tenantId) throw new Error('Tenant ID is required')
    if (!input.studentId) throw new Error('Student ID is required')

    // 1. Permission check
    const normalizedRole = (actor.role || '').toUpperCase()
    if (!this.AUTHORIZED_ISSUE_ROLES.includes(normalizedRole)) {
      throw new Error(`UNAUTHORIZED: Role '${actor.role}' is not permitted to issue welcome kits`)
    }

    // 2. Idempotency Guard: prevent duplicate submissions / double clicks
    if (input.idempotencyKey) {
      const existing = await db.studentKitIssuance.findFirst({
        where: {
          tenantId,
          idempotencyKey: input.idempotencyKey,
        },
        include: {
          stockIssue: {
            include: {
              items: { include: { item: true } },
              location: true,
            },
          },
          student: true,
        },
      })

      if (existing) {
        // Return existing issuance cleanly without re-deducting stock
        return {
          success: true,
          isExisting: true,
          kitIssuance: existing,
          stockIssue: existing.stockIssue,
          message: 'Welcome kit already processed (idempotency key matched).',
        }
      }
    }

    // 3. Validate Student & Scope
    const student = await db.student.findFirst({
      where: {
        id: input.studentId,
        tenantId,
        ...(input.branchId ? { branchId: input.branchId } : {}),
      },
      include: {
        currentClassroom: true,
        guardians: {
          include: { guardian: true },
          where: { isPrimary: true },
        },
      },
    })

    if (!student) {
      throw new Error('STUDENT_NOT_FOUND: Student does not belong to authorized branch or tenant')
    }

    if (student.deletedAt) {
      throw new Error('INVALID_STUDENT: Cannot issue welcome kit to a deleted student profile')
    }

    const branchId = student.branchId
    const primaryGuardian = student.guardians[0]?.guardian
    const guardianName = input.guardianName?.trim() || primaryGuardian?.fullName || 'Parent / Guardian'

    // 4. Duplicate Check
    if (!input.overrideDuplicate) {
      const existingKit = await db.studentKitIssuance.findFirst({
        where: {
          tenantId,
          studentId: student.id,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingKit) {
        throw new Error(
          `DUPLICATE_ISSUANCE: Student ${student.admissionNo} has already been issued Welcome Kit '${existingKit.bundleName}' (${existingKit.kitNumber}) on ${existingKit.createdAt.toISOString().slice(0, 10)}. Set overrideDuplicate=true to issue another kit.`
        )
      }
    }

    // 5. Resolve Bundle
    let bundle = await db.inventoryBundle.findFirst({
      where: {
        tenantId,
        ...(input.bundleId
          ? { id: input.bundleId }
          : input.bundleCode
          ? { code: input.bundleCode }
          : { code: 'NURSERY_WELCOME_KIT' }),
        isActive: true,
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                unit: true,
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!bundle) {
      // Auto-provision default Nursery Welcome Kit if needed
      bundle = await this.getOrCreateDefaultNurseryWelcomeKit(tenantId, branchId)
    }

    if (!bundle.isActive) {
      throw new Error(`INACTIVE_BUNDLE: Welcome kit bundle '${bundle.name}' is currently inactive`)
    }

    // 6. Resolve Uniform Size and Concrete Component Items
    const uniformSize = (input.uniformSize || 'M').toUpperCase().trim()
    const resolvedComponents: Array<{
      bundleItemId: string
      itemName: string
      itemId: string
      itemMasterName: string
      sku: string
      quantity: number
      unitId: string
      unitSymbol: string
      categoryId: string
    }> = []

    for (const bItem of bundle.items) {
      let itemId = bItem.itemId

      if (bItem.hasVariants && bItem.variantMap) {
        const vMap = bItem.variantMap as Record<string, any>
        const mapped = vMap[uniformSize]
        if (!mapped) {
          throw new Error(
            `INVALID_VARIANT: Size '${uniformSize}' is not configured for bundle component '${bItem.itemName}'. Available sizes: ${Object.keys(vMap).join(', ')}`
          )
        }
        itemId = typeof mapped === 'string' ? mapped : mapped.itemId
      }

      if (!itemId) {
        throw new Error(`INVALID_BUNDLE: Component '${bItem.itemName}' has no concrete inventory item`)
      }

      const itemMaster = await db.inventoryItem.findFirst({
        where: { id: itemId, tenantId },
        include: { unit: true, category: true },
      })

      if (!itemMaster) {
        throw new Error(`ITEM_NOT_FOUND: Item for component '${bItem.itemName}' does not exist`)
      }

      if (!itemMaster.isActive) {
        throw new Error(`INACTIVE_ITEM: Item '${itemMaster.name}' (${itemMaster.sku}) is inactive`)
      }

      resolvedComponents.push({
        bundleItemId: bItem.id,
        itemName: bItem.itemName,
        itemId: itemMaster.id,
        itemMasterName: itemMaster.name,
        sku: itemMaster.sku,
        quantity: Number(bItem.quantity),
        unitId: itemMaster.unitId,
        unitSymbol: itemMaster.unit.symbol || itemMaster.unit.name,
        categoryId: itemMaster.categoryId,
      })
    }

    // 7. Resolve Source Store Location
    let locationId = input.locationId
    let locationRecord = null

    if (locationId) {
      locationRecord = await db.inventoryLocation.findFirst({
        where: { id: locationId, tenantId, branchId },
      })
    } else {
      locationRecord = await db.inventoryLocation.findFirst({
        where: { tenantId, branchId, isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      locationId = locationRecord?.id
    }

    if (!locationRecord || !locationId) {
      throw new Error(`LOCATION_NOT_FOUND: No active store location found in branch '${branchId}'`)
    }

    // 8. Generate Unique Sequence Identifiers
    const baseKitNum = await nextNumber('stock_issue', tenantId).catch(() => '1001')
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const kitNumber = `KIT-${new Date().getFullYear()}-${baseKitNum}-${randSuffix}`
    const issueNumber = `ISS-KIT-${baseKitNum}-${randSuffix}`

    // 9. ATOMIC DATABASE TRANSACTION (All-or-Nothing)
    const result = await db.$transaction(async (tx) => {
      // Step A: Pre-validate stock availability for all components
      for (const comp of resolvedComponents) {
        const stockRecord = await tx.inventoryStock.findFirst({
          where: { locationId, itemId: comp.itemId },
        })

        const available = stockRecord ? Number(stockRecord.availableQuantity) : 0
        if (available < comp.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Insufficient stock for '${comp.itemName}' (${comp.itemMasterName}). Required: ${comp.quantity}, Available: ${available} at ${locationRecord.name}.`
          )
        }
      }

      // Step B: Create Authoritative StockIssue Record
      const stockIssue = await tx.stockIssue.create({
        data: {
          tenantId,
          branchId,
          issueNumber,
          locationId,
          destinationType: 'STUDENT',
          destinationId: student.id,
          classroomId: student.currentClassroomId || null,
          studentId: student.id,
          issuedById: actor.id,
          issuedByName: actor.name,
          recipientName: `${student.firstName} ${student.lastName || ''}`.trim(),
          status: 'COMPLETED',
          notes: `Welcome Kit: ${bundle.name} (Uniform Size: ${uniformSize})${input.notes ? ` — ${input.notes}` : ''}`,
        },
      })

      // Step C: Atomically Decrement Stock & Create Issue Items + Stock Movements
      for (const comp of resolvedComponents) {
        // Atomic raw SQL decrement with concurrency overdraft guard
        const updatedRows = await tx.$executeRaw`
          UPDATE "inventory_stocks"
          SET "quantity" = "quantity" - ${comp.quantity},
              "availableQuantity" = "availableQuantity" - ${comp.quantity},
              "lastMovementAt" = NOW(),
              "updatedAt" = NOW()
          WHERE "locationId" = ${locationId}
            AND "itemId" = ${comp.itemId}
            AND "availableQuantity" >= ${comp.quantity}
        `

        if (updatedRows === 0) {
          throw new Error(
            `INSUFFICIENT_STOCK: Concurrent modification or insufficient stock for '${comp.itemName}'. Transaction aborted.`
          )
        }

        const stockRecord = await tx.inventoryStock.findFirst({
          where: { locationId, itemId: comp.itemId },
        })
        const unitCost = stockRecord?.unitCost ? Number(stockRecord.unitCost) : null

        // Create StockIssueItem
        await tx.stockIssueItem.create({
          data: {
            stockIssueId: stockIssue.id,
            itemId: comp.itemId,
            quantity: comp.quantity,
            unitCost,
            batchNumber: stockRecord?.batchNumber || null,
          },
        })

        // Create StockMovement
        await tx.stockMovement.create({
          data: {
            tenantId,
            branchId,
            itemId: comp.itemId,
            locationId,
            movementType: 'ISSUE',
            quantity: comp.quantity,
            unitCost,
            referenceType: 'STOCK_ISSUE',
            referenceId: stockIssue.id,
            fromLocationId: locationId,
            batchNumber: stockRecord?.batchNumber || null,
            expiryDate: stockRecord?.expiryDate || null,
            performedById: actor.id,
            reason: `Issued as part of Welcome Kit ${kitNumber} to student ${student.admissionNo}`,
          },
        })
      }

      // Step D: Create StudentKitIssuance Record
      const kitIssuance = await tx.studentKitIssuance.create({
        data: {
          tenantId,
          branchId,
          bundleId: bundle.id,
          studentId: student.id,
          stockIssueId: stockIssue.id,
          kitNumber,
          bundleName: bundle.name,
          variantValues: { uniformSize },
          idempotencyKey: input.idempotencyKey?.trim() || null,
          issuedById: actor.id,
          issuedByName: actor.name,
          recipientName: `${student.firstName} ${student.lastName || ''}`.trim(),
          guardianName,
          notes: input.notes?.trim() || null,
        },
      })

      return {
        kitIssuance,
        stockIssue,
      }
    })

    // 10. Audit Logging
    await AuditService.record({
      tenantId,
      branchId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'INVENTORY_STOCK_ISSUE',
      entity: 'StudentKitIssuance',
      entityId: result.kitIssuance.id,
      module: 'INVENTORY',
      summary: `Issued Welcome Kit '${bundle.name}' (${kitNumber}) with uniform size ${uniformSize} to student ${student.admissionNo} (${student.firstName})`,
      newValues: {
        kitNumber,
        bundleId: bundle.id,
        bundleName: bundle.name,
        studentId: student.id,
        studentAdmissionNo: student.admissionNo,
        uniformSize,
        totalItemsCount: resolvedComponents.reduce((acc, c) => acc + c.quantity, 0),
        components: resolvedComponents.map((c) => ({
          itemName: c.itemName,
          sku: c.sku,
          quantity: c.quantity,
        })),
      },
    }).catch((err) => console.error('[WelcomeKitService] Audit log error:', err))

    return {
      success: true,
      isExisting: false,
      kitIssuance: result.kitIssuance,
      stockIssue: result.stockIssue,
      kitNumber,
      message: `Welcome Kit ${kitNumber} successfully issued to ${student.firstName} ${student.lastName || ''}.`,
    }
  }

  /**
   * Generates authoritative printable handover slip data.
   * Can be invoked repeatedly for reprints without altering inventory balances.
   */
  static async getHandoverSlip(
    tenantId: string,
    issuanceIdOrKitNumber: string
  ): Promise<HandoverSlipData> {
    if (!tenantId || !issuanceIdOrKitNumber) {
      throw new Error('Tenant ID and Issuance ID or Kit Number are required')
    }

    const issuance = await db.studentKitIssuance.findFirst({
      where: {
        tenantId,
        OR: [
          { id: issuanceIdOrKitNumber },
          { kitNumber: issuanceIdOrKitNumber },
          { stockIssueId: issuanceIdOrKitNumber },
        ],
      },
      include: {
        tenant: { select: { name: true } },
        branch: { select: { name: true, code: true, address: true } },
        student: {
          include: {
            currentClassroom: true,
            guardians: {
              include: { guardian: true },
              where: { isPrimary: true },
            },
          },
        },
        stockIssue: {
          include: {
            items: {
              include: {
                item: {
                  include: {
                    unit: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!issuance) {
      throw new Error('Welcome kit issuance record not found')
    }

    const primaryGuardian = issuance.student.guardians[0]?.guardian
    const variantValues = issuance.variantValues as Record<string, any> | null
    const uniformSize = variantValues?.uniformSize || variantValues?.size || null

    const items = issuance.stockIssue.items.map((si) => ({
      id: si.id,
      itemName: si.item.name,
      sku: si.item.sku,
      category: si.item.category.name,
      quantity: Number(si.quantity),
      unit: si.item.unit.symbol || si.item.unit.name,
    }))

    const totalItemsQuantity = items.reduce((acc, it) => acc + it.quantity, 0)

    const issueDate = issuance.createdAt
    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(issueDate)

    return {
      kitIssuanceId: issuance.id,
      kitNumber: issuance.kitNumber,
      bundleName: issuance.bundleName,
      issueDate: issueDate.toISOString(),
      issuedAtFormatted: formattedDate,
      uniformSize,
      status: issuance.stockIssue.status,
      notes: issuance.notes,
      school: {
        tenantName: issuance.tenant.name,
        branchName: issuance.branch.name,
        branchCode: issuance.branch.code,
        branchAddress: issuance.branch.address,
      },
      student: {
        id: issuance.student.id,
        fullName: `${issuance.student.firstName} ${issuance.student.lastName || ''}`.trim(),
        admissionNo: issuance.student.admissionNo,
        classroomName: issuance.student.currentClassroom?.name || null,
        gender: issuance.student.gender,
        dob: issuance.student.dob ? issuance.student.dob.toISOString().slice(0, 10) : null,
        guardianName: issuance.guardianName || primaryGuardian?.fullName || 'Parent / Guardian',
        guardianPhone: primaryGuardian?.phone || null,
      },
      issuer: {
        id: issuance.issuedById,
        name: issuance.issuedByName,
      },
      items,
      totalItemsQuantity,
      stockIssueNumber: issuance.stockIssue.issueNumber,
    }
  }

  /**
   * Lists historical student kit issuances for tracking.
   */
  static async listStudentKitIssuances(
    tenantId: string,
    options: {
      studentId?: string
      branchId?: string
      limit?: number
    } = {}
  ) {
    if (!tenantId) throw new Error('Tenant ID is required')

    return db.studentKitIssuance.findMany({
      where: {
        tenantId,
        ...(options.studentId ? { studentId: options.studentId } : {}),
        ...(options.branchId ? { branchId: options.branchId } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            currentClassroom: { select: { name: true } },
          },
        },
        stockIssue: {
          include: {
            location: { select: { name: true } },
            items: {
              include: {
                item: { select: { name: true, sku: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    })
  }
}
