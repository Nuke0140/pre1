import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  classifyItemStockHealth,
  calculateSuggestedReorder,
  buildStockHealthRadarSummary,
} from '@/lib/inventory/stock-health'
import { InventoryService } from '@/lib/inventory/inventory-service'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { GET as dashboardGet } from '@/app/api/v1/inventory/dashboard/route'
import { GET as itemsGet } from '@/app/api/v1/inventory/items/route'

describe('PreOne Inventory — Stock Health Radar (Traffic Light Replenishment System)', () => {
  describe('Domain Engine: Classification & Calculations', () => {
    it('classifies items with 0 or negative available stock as OUT_OF_STOCK and CRITICAL_OUT_OF_STOCK', () => {
      const outOfStockItem = {
        id: 'item-1',
        name: 'Drawing Paper',
        minimumStock: 10,
        reorderLevel: 25,
        totalAvailable: 0,
      }
      const eval1 = classifyItemStockHealth(outOfStockItem)
      expect(eval1.status).toBe('OUT_OF_STOCK')
      expect(eval1.category).toBe('CRITICAL_OUT_OF_STOCK')
      expect(eval1.severity).toBe('CRITICAL')
      expect(eval1.needsReorder).toBe(true)

      const negativeStockItem = {
        id: 'item-neg',
        name: 'Reserved Paper',
        minimumStock: 5,
        reorderLevel: 20,
        totalAvailable: -2,
      }
      const evalNeg = classifyItemStockHealth(negativeStockItem)
      expect(evalNeg.status).toBe('OUT_OF_STOCK')
      expect(evalNeg.category).toBe('CRITICAL_OUT_OF_STOCK')
    })

    it('classifies items at or below minimumStock as CRITICAL stock', () => {
      const criticalItem = {
        id: 'item-2',
        name: 'Sanitizer 500ml',
        minimumStock: 5,
        reorderLevel: 20,
        totalAvailable: 4,
      }
      const evalResult = classifyItemStockHealth(criticalItem)
      expect(evalResult.status).toBe('CRITICAL')
      expect(evalResult.category).toBe('CRITICAL_OUT_OF_STOCK')
      expect(evalResult.severity).toBe('CRITICAL')
      expect(evalResult.needsReorder).toBe(true)
    })

    it('uses 30% of reorderLevel as critical floor when minimumStock is not set', () => {
      const itemNoMin = {
        id: 'item-nomin',
        name: 'Glue Sticks',
        minimumStock: 0,
        reorderLevel: 30, // 30% is 9
        totalAvailable: 8,
      }
      const evalResult = classifyItemStockHealth(itemNoMin)
      expect(evalResult.status).toBe('CRITICAL')
      expect(evalResult.category).toBe('CRITICAL_OUT_OF_STOCK')
    })

    it('classifies items above critical but <= reorderLevel as LOW_STOCK', () => {
      const lowStockItem = {
        id: 'item-3',
        name: 'Clay Blocks',
        minimumStock: 5,
        reorderLevel: 20,
        totalAvailable: 15,
      }
      const evalResult = classifyItemStockHealth(lowStockItem)
      expect(evalResult.status).toBe('LOW_STOCK')
      expect(evalResult.category).toBe('LOW_STOCK')
      expect(evalResult.severity).toBe('WARNING')
      expect(evalResult.needsReorder).toBe(true)
    })

    it('classifies items above reorderLevel as HEALTHY', () => {
      const healthyItem = {
        id: 'item-4',
        name: 'Wax Crayons',
        minimumStock: 5,
        reorderLevel: 20,
        totalAvailable: 50,
      }
      const evalResult = classifyItemStockHealth(healthyItem)
      expect(evalResult.status).toBe('HEALTHY')
      expect(evalResult.category).toBe('HEALTHY')
      expect(evalResult.severity).toBe('HEALTHY')
      expect(evalResult.needsReorder).toBe(false)
      expect(evalResult.suggestedReorderQuantity).toBe(0)
    })

    it('classifies items with both minimumStock == 0 and reorderLevel == 0 as UNRATED without falsely labeling healthy', () => {
      const unratedItem = {
        id: 'item-5',
        name: 'Miscellaneous Ribbon',
        minimumStock: 0,
        reorderLevel: 0,
        totalAvailable: 12,
      }
      const evalResult = classifyItemStockHealth(unratedItem)
      expect(evalResult.status).toBe('UNRATED')
      expect(evalResult.category).toBe('UNRATED')
      expect(evalResult.hasThreshold).toBe(false)
      expect(evalResult.needsReorder).toBe(false)
    })

    it('calculates realistic suggested reorder quantities prioritizing maximumStock and reorderLevel', () => {
      // 1. With maximumStock configured
      const qtyWithMax = calculateSuggestedReorder(5, 10, 20, 50)
      expect(qtyWithMax).toBe(45) // 50 - 5

      // 2. Without maximumStock, with reorderLevel
      const qtyWithReorder = calculateSuggestedReorder(5, 10, 20, null)
      expect(qtyWithReorder).toBe(35) // 20 * 2 - 5

      // 3. Out of stock with reorderLevel
      const qtyOOS = calculateSuggestedReorder(0, 5, 15, null)
      expect(qtyOOS).toBe(30) // 15 * 2 - 0
    })

    it('aggregates a list of items into a complete radar summary', () => {
      const items = [
        { id: '1', name: 'Item OOS', minimumStock: 5, reorderLevel: 10, totalAvailable: 0 },
        { id: '2', name: 'Item Critical', minimumStock: 5, reorderLevel: 10, totalAvailable: 3 },
        { id: '3', name: 'Item Low', minimumStock: 5, reorderLevel: 10, totalAvailable: 8 },
        { id: '4', name: 'Item Healthy', minimumStock: 5, reorderLevel: 10, totalAvailable: 25 },
        { id: '5', name: 'Item Unrated', minimumStock: 0, reorderLevel: 0, totalAvailable: 15 },
      ]

      const summary = buildStockHealthRadarSummary(items)
      expect(summary.counts.totalTracked).toBe(5)
      expect(summary.counts.criticalOutOfStock).toBe(2)
      expect(summary.counts.outOfStock).toBe(1)
      expect(summary.counts.critical).toBe(1)
      expect(summary.counts.lowStock).toBe(1)
      expect(summary.counts.healthy).toBe(1)
      expect(summary.counts.unrated).toBe(1)

      expect(summary.criticalItems.length).toBe(2)
      expect(summary.lowStockItems.length).toBe(1)
      expect(summary.criticalItems[0].suggestedReorderQuantity).toBeGreaterThan(0)
    })
  })

  describe('Integration with Database & Service Scoping', () => {
    let tenantId: string
    let branch1Id: string
    let branch2Id: string
    let location1Id: string
    let vendorId: string
    let unitId: string
    let catId: string
    let principalCookie: string

    beforeAll(async () => {
      const ts = Date.now()

      const tenant = await db.tenant.create({
        data: {
          name: `Radar School ${ts}`,
          code: `RADAR_${ts}`,
          status: 'ACTIVE',
        },
      })
      tenantId = tenant.id

      const b1 = await db.branch.create({
        data: {
          tenantId,
          name: `Branch Main ${ts}`,
          code: `B1_${ts}`,
        },
      })
      branch1Id = b1.id

      const b2 = await db.branch.create({
        data: {
          tenantId,
          name: `Branch Secondary ${ts}`,
          code: `B2_${ts}`,
        },
      })
      branch2Id = b2.id

      const loc1 = await db.inventoryLocation.create({
        data: {
          tenantId,
          branchId: branch1Id,
          name: 'Main Store Room',
          code: `LOC_MAIN_${ts}`,
          locationType: 'MAIN_STORE',
        },
      })
      location1Id = loc1.id

      const vendor = await db.vendor.create({
        data: {
          tenantId,
          name: 'Supreme Supplies Ltd',
          code: `VEND_${ts}`,
        },
      })
      vendorId = vendor.id

      const unit = await db.inventoryUnit.create({
        data: {
          tenantId,
          name: 'Packs',
          code: `PK_${ts}`,
          symbol: 'pk',
        },
      })
      unitId = unit.id

      const cat = await db.inventoryCategory.create({
        data: {
          tenantId,
          name: 'General Supplies',
          code: `GEN_${ts}`,
        },
      })
      catId = cat.id

      // Create test items with varying stock levels
      // 1. Critical Item
      const item1 = await db.inventoryItem.create({
        data: {
          tenantId,
          name: 'Tempera Paints Red',
          sku: `SKU_CRIT_${ts}`,
          categoryId: catId,
          unitId,
          defaultVendorId: vendorId,
          minimumStock: 10,
          reorderLevel: 25,
          maximumStock: 50,
          trackStock: true,
          isActive: true,
        },
      })

      await db.inventoryStock.create({
        data: {
          tenantId,
          branchId: branch1Id,
          locationId: location1Id,
          itemId: item1.id,
          quantity: 4,
          reservedQuantity: 0,
          availableQuantity: 4, // <= minimumStock (10) -> CRITICAL
        },
      })

      // 2. Low Stock Item
      const item2 = await db.inventoryItem.create({
        data: {
          tenantId,
          name: 'Construction Paper Blue',
          sku: `SKU_LOW_${ts}`,
          categoryId: catId,
          unitId,
          defaultVendorId: vendorId,
          minimumStock: 5,
          reorderLevel: 20,
          maximumStock: 40,
          trackStock: true,
          isActive: true,
        },
      })

      await db.inventoryStock.create({
        data: {
          tenantId,
          branchId: branch1Id,
          locationId: location1Id,
          itemId: item2.id,
          quantity: 12,
          reservedQuantity: 0,
          availableQuantity: 12, // > 5 but <= 20 -> LOW_STOCK
        },
      })

      // 3. Healthy Item
      const item3 = await db.inventoryItem.create({
        data: {
          tenantId,
          name: 'Safety Scissors',
          sku: `SKU_HLTH_${ts}`,
          categoryId: catId,
          unitId,
          defaultVendorId: vendorId,
          minimumStock: 5,
          reorderLevel: 15,
          maximumStock: 50,
          trackStock: true,
          isActive: true,
        },
      })

      await db.inventoryStock.create({
        data: {
          tenantId,
          branchId: branch1Id,
          locationId: location1Id,
          itemId: item3.id,
          quantity: 35,
          reservedQuantity: 0,
          availableQuantity: 35, // > 15 -> HEALTHY
        },
      })

      const principalUser = await db.user.create({
        data: {
          fullName: 'Principal Admin',
          email: `radar_admin_${ts}@preone.internal`,
          passwordHash: 'hashed_password_placeholder',
          status: 'ACTIVE',
        },
      })

      await db.tenantUser.create({
        data: {
          tenantId,
          userId: principalUser.id,
          role: 'PRINCIPAL',
          branchId: branch1Id,
        },
      })

      const token = await signSession({
        uid: principalUser.id,
        email: principalUser.email,
        name: principalUser.fullName,
        role: 'PRINCIPAL',
        tenantId,
        branchId: branch1Id,
      })
      principalCookie = `${SESSION_COOKIE}=${token}`
    })

    it('InventoryService.getStockHealthRadar correctly groups items for tenant and branch', async () => {
      const radar = await InventoryService.getStockHealthRadar(tenantId, branch1Id)

      expect(radar.counts.totalTracked).toBe(3)
      expect(radar.counts.criticalOutOfStock).toBe(1)
      expect(radar.counts.lowStock).toBe(1)
      expect(radar.counts.healthy).toBe(1)
      expect(radar.counts.unrated).toBe(0)

      expect(radar.criticalItems.length).toBe(1)
      expect(radar.criticalItems[0].name).toBe('Tempera Paints Red')
      expect(radar.criticalItems[0].availableQuantity).toBe(4)
      expect(radar.criticalItems[0].suggestedReorderQuantity).toBe(46) // maxStock(50) - 4

      expect(radar.lowStockItems.length).toBe(1)
      expect(radar.lowStockItems[0].name).toBe('Construction Paper Blue')
      expect(radar.lowStockItems[0].availableQuantity).toBe(12)
    })

    it('InventoryService.getDashboardMetrics returns stockHealthRadar matching service calculation', async () => {
      const metrics = await InventoryService.getDashboardMetrics(tenantId, branch1Id)

      expect(metrics.stockHealthRadar).toBeDefined()
      expect(metrics.stockHealthRadar.counts.criticalOutOfStock).toBe(1)
      expect(metrics.stockHealthRadar.counts.lowStock).toBe(1)
      expect(metrics.stockHealthRadar.counts.healthy).toBe(1)
      expect(metrics.kpis.criticalOutOfStockCount).toBe(1)
      expect(metrics.kpis.lowStockCount).toBe(1)
    })

    it('InventoryService.listItems filters correctly by stockHealthCategory', async () => {
      // 1. Filter by CRITICAL_OUT_OF_STOCK
      const criticalResult = await InventoryService.listItems(tenantId, {
        branchId: branch1Id,
        stockHealthCategory: 'CRITICAL_OUT_OF_STOCK',
      })
      expect(criticalResult.items.length).toBe(1)
      expect(criticalResult.items[0].name).toBe('Tempera Paints Red')

      // 2. Filter by LOW_STOCK
      const lowResult = await InventoryService.listItems(tenantId, {
        branchId: branch1Id,
        stockHealthCategory: 'LOW_STOCK',
      })
      expect(lowResult.items.length).toBe(1)
      expect(lowResult.items[0].name).toBe('Construction Paper Blue')

      // 3. Filter by HEALTHY
      const healthyResult = await InventoryService.listItems(tenantId, {
        branchId: branch1Id,
        stockHealthCategory: 'HEALTHY',
      })
      expect(healthyResult.items.length).toBe(1)
      expect(healthyResult.items[0].name).toBe('Safety Scissors')
    })

    it('GET /api/v1/inventory/dashboard returns stockHealthRadar', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/inventory/dashboard', {
        headers: { Cookie: principalCookie },
      })
      const res = await dashboardGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.stockHealthRadar).toBeDefined()
      expect(json.data.stockHealthRadar.counts.criticalOutOfStock).toBe(1)
      expect(json.data.stockHealthRadar.counts.lowStock).toBe(1)
      expect(json.data.stockHealthRadar.counts.healthy).toBe(1)
    })

    it('GET /api/v1/inventory/items?stockHealthCategory=CRITICAL_OUT_OF_STOCK filters via HTTP API', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/v1/inventory/items?branchId=${branch1Id}&stockHealthCategory=CRITICAL_OUT_OF_STOCK`,
        { headers: { Cookie: principalCookie } }
      )
      const res = await itemsGet(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.items.length).toBe(1)
      expect(json.data.items[0].name).toBe('Tempera Paints Red')
    })
  })
})
