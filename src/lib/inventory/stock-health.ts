/**
 * PreOne — Stock Health Classification Engine
 *
 * Single authoritative source of truth for classifying inventory items into:
 * 🔴 Critical / Out of Stock
 * 🟡 Low Stock
 * 🟢 Healthy Stock
 * ⚪ Unrated / Missing Thresholds
 *
 * Rules:
 * - Out of Stock: available <= 0
 * - Critical: available > 0 && available <= minimumStock (or <= 30% of reorderLevel if minimumStock not set)
 * - Low Stock: above critical, but available <= reorderLevel
 * - Healthy: available > reorderLevel (or > minimumStock if only minimumStock configured)
 * - Unrated: minimumStock == 0 && reorderLevel == 0 (do NOT falsely label healthy)
 */

export type StockHealthStatus =
  | 'OUT_OF_STOCK'
  | 'CRITICAL'
  | 'LOW_STOCK'
  | 'HEALTHY'
  | 'UNRATED'

export type StockHealthCategory =
  | 'CRITICAL_OUT_OF_STOCK'
  | 'LOW_STOCK'
  | 'HEALTHY'
  | 'UNRATED'

export type StockHealthSeverity =
  | 'CRITICAL'
  | 'WARNING'
  | 'HEALTHY'
  | 'NEUTRAL'

export interface StockHealthItemEvaluation {
  status: StockHealthStatus
  category: StockHealthCategory
  label: string
  severity: StockHealthSeverity
  availableQuantity: number
  minimumStock: number
  reorderLevel: number
  maximumStock: number | null
  hasThreshold: boolean
  suggestedReorderQuantity: number
  needsReorder: boolean
}

export interface StockHealthItemInput {
  id: string
  name: string
  sku?: string
  code?: string
  minimumStock?: number | string | any
  reorderLevel?: number | string | any
  maximumStock?: number | string | any | null
  unit?: { id?: string; name?: string; symbol?: string } | null
  defaultVendor?: { id?: string; name?: string; code?: string } | null
  defaultVendorId?: string | null
  costPriceCents?: number | null
  stocks?: Array<{
    quantity?: number | string | any
    reservedQuantity?: number | string | any
    availableQuantity?: number | string | any
  }>
  totalAvailable?: number
  availableQuantity?: number
}

/**
 * Calculates total available stock from stocks array or existing fields.
 * Net available = quantity - reservedQuantity (or availableQuantity directly).
 */
export function calculateItemAvailableQuantity(item: StockHealthItemInput): number {
  if (typeof item.totalAvailable === 'number') {
    return item.totalAvailable
  }
  if (typeof item.availableQuantity === 'number') {
    return item.availableQuantity
  }
  if (Array.isArray(item.stocks) && item.stocks.length > 0) {
    return item.stocks.reduce((sum, s) => {
      const avail = s.availableQuantity !== undefined && s.availableQuantity !== null
        ? Number(s.availableQuantity)
        : Number(s.quantity || 0) - Number(s.reservedQuantity || 0)
      return sum + (isNaN(avail) ? 0 : avail)
    }, 0)
  }
  return 0
}

/**
 * Evaluates stock health for a given item and available quantity.
 */
export function classifyItemStockHealth(
  item: StockHealthItemInput,
  overrideAvailable?: number
): StockHealthItemEvaluation {
  const available = overrideAvailable !== undefined ? overrideAvailable : calculateItemAvailableQuantity(item)
  const minStock = Math.max(0, Number(item.minimumStock || 0))
  const reorder = Math.max(0, Number(item.reorderLevel || 0))
  const maxStock = item.maximumStock !== null && item.maximumStock !== undefined && !isNaN(Number(item.maximumStock))
    ? Math.max(0, Number(item.maximumStock))
    : null

  const hasMinStock = minStock > 0
  const hasReorder = reorder > 0
  const hasThreshold = hasMinStock || hasReorder

  // 1. OUT OF STOCK: Available <= 0
  if (available <= 0) {
    const suggested = calculateSuggestedReorder(available, minStock, reorder, maxStock)
    return {
      status: 'OUT_OF_STOCK',
      category: 'CRITICAL_OUT_OF_STOCK',
      label: 'Out of Stock',
      severity: 'CRITICAL',
      availableQuantity: available,
      minimumStock: minStock,
      reorderLevel: reorder,
      maximumStock: maxStock,
      hasThreshold,
      suggestedReorderQuantity: suggested,
      needsReorder: true,
    }
  }

  // 2. UNRATED / MISSING THRESHOLDS: No threshold configured
  // Note: Do not silently treat missing thresholds as zero or falsely label healthy.
  if (!hasThreshold) {
    const suggested = calculateSuggestedReorder(available, minStock, reorder, maxStock)
    return {
      status: 'UNRATED',
      category: 'UNRATED',
      label: 'No Threshold Set',
      severity: 'NEUTRAL',
      availableQuantity: available,
      minimumStock: 0,
      reorderLevel: 0,
      maximumStock: maxStock,
      hasThreshold: false,
      suggestedReorderQuantity: suggested,
      needsReorder: false,
    }
  }

  // Determine Critical Floor:
  // If minimumStock is explicitly configured (>0), that is the critical threshold.
  // If only reorderLevel is configured, critical floor is 30% of reorderLevel (minimum 1).
  const criticalThreshold = hasMinStock
    ? minStock
    : Math.max(1, Math.floor(reorder * 0.3))

  // 3. CRITICAL STOCK: Positive stock, but at or below critical floor
  if (available <= criticalThreshold) {
    const suggested = calculateSuggestedReorder(available, minStock, reorder, maxStock)
    return {
      status: 'CRITICAL',
      category: 'CRITICAL_OUT_OF_STOCK',
      label: 'Critical Stock',
      severity: 'CRITICAL',
      availableQuantity: available,
      minimumStock: minStock,
      reorderLevel: reorder,
      maximumStock: maxStock,
      hasThreshold: true,
      suggestedReorderQuantity: suggested,
      needsReorder: true,
    }
  }

  // Determine Low Stock Floor:
  // Stock is below or at reorderLevel (or at minimumStock if reorderLevel is 0).
  const lowStockThreshold = hasReorder ? reorder : minStock

  // 4. LOW STOCK: Above critical, but at or below replenishment threshold
  if (available <= lowStockThreshold) {
    const suggested = calculateSuggestedReorder(available, minStock, reorder, maxStock)
    return {
      status: 'LOW_STOCK',
      category: 'LOW_STOCK',
      label: 'Low Stock',
      severity: 'WARNING',
      availableQuantity: available,
      minimumStock: minStock,
      reorderLevel: reorder,
      maximumStock: maxStock,
      hasThreshold: true,
      suggestedReorderQuantity: suggested,
      needsReorder: true,
    }
  }

  // 5. HEALTHY STOCK: Above reorder threshold
  return {
    status: 'HEALTHY',
    category: 'HEALTHY',
    label: 'Healthy Stock',
    severity: 'HEALTHY',
    availableQuantity: available,
    minimumStock: minStock,
    reorderLevel: reorder,
    maximumStock: maxStock,
    hasThreshold: true,
    suggestedReorderQuantity: 0,
    needsReorder: false,
  }
}

/**
 * Calculates realistic suggested re-order quantity.
 * Priority:
 * 1. Target maximumStock - available
 * 2. ReorderLevel * 2 - available
 * 3. MinimumStock * 2 - available
 * 4. Safe baseline of 10 units
 */
export function calculateSuggestedReorder(
  available: number,
  minStock: number,
  reorder: number,
  maxStock: number | null
): number {
  if (maxStock && maxStock > available) {
    return Math.max(1, Math.ceil(maxStock - available))
  }
  if (reorder > 0) {
    const target = reorder * 2
    return Math.max(1, Math.ceil(target - available))
  }
  if (minStock > 0) {
    const target = minStock * 2
    return Math.max(1, Math.ceil(target - available))
  }
  return 10
}

export interface StockHealthRadarSummary {
  counts: {
    criticalOutOfStock: number
    outOfStock: number
    critical: number
    lowStock: number
    healthy: number
    unrated: number
    totalTracked: number
  }
  criticalItems: Array<{
    id: string
    name: string
    sku: string
    unit: string
    availableQuantity: number
    status: StockHealthStatus
    label: string
    severity: StockHealthSeverity
    suggestedReorderQuantity: number
    defaultVendor: { id?: string; name?: string; code?: string } | null
    costPriceCents?: number | null
    categoryName?: string
  }>
  lowStockItems: Array<{
    id: string
    name: string
    sku: string
    unit: string
    availableQuantity: number
    reorderLevel: number
    status: StockHealthStatus
    label: string
    severity: StockHealthSeverity
    suggestedReorderQuantity: number
    defaultVendor: { id?: string; name?: string; code?: string } | null
    costPriceCents?: number | null
    categoryName?: string
  }>
  healthyCount: number
}

/**
 * Aggregates a list of inventory items into the radar summary structure
 */
export function buildStockHealthRadarSummary(
  items: StockHealthItemInput[]
): StockHealthRadarSummary {
  let outOfStock = 0
  let critical = 0
  let lowStock = 0
  let healthy = 0
  let unrated = 0

  const criticalItems: StockHealthRadarSummary['criticalItems'] = []
  const lowStockItems: StockHealthRadarSummary['lowStockItems'] = []

  for (const item of items) {
    const evalResult = classifyItemStockHealth(item)
    const unitSymbol = item.unit?.symbol || item.unit?.name || 'units'
    const sku = item.sku || item.code || 'SKU'

    switch (evalResult.status) {
      case 'OUT_OF_STOCK':
        outOfStock++
        criticalItems.push({
          id: item.id,
          name: item.name,
          sku,
          unit: unitSymbol,
          availableQuantity: evalResult.availableQuantity,
          status: evalResult.status,
          label: evalResult.label,
          severity: evalResult.severity,
          suggestedReorderQuantity: evalResult.suggestedReorderQuantity,
          defaultVendor: item.defaultVendor || null,
          costPriceCents: item.costPriceCents || null,
          categoryName: (item as any).category?.name,
        })
        break

      case 'CRITICAL':
        critical++
        criticalItems.push({
          id: item.id,
          name: item.name,
          sku,
          unit: unitSymbol,
          availableQuantity: evalResult.availableQuantity,
          status: evalResult.status,
          label: evalResult.label,
          severity: evalResult.severity,
          suggestedReorderQuantity: evalResult.suggestedReorderQuantity,
          defaultVendor: item.defaultVendor || null,
          costPriceCents: item.costPriceCents || null,
          categoryName: (item as any).category?.name,
        })
        break

      case 'LOW_STOCK':
        lowStock++
        lowStockItems.push({
          id: item.id,
          name: item.name,
          sku,
          unit: unitSymbol,
          availableQuantity: evalResult.availableQuantity,
          reorderLevel: evalResult.reorderLevel,
          status: evalResult.status,
          label: evalResult.label,
          severity: evalResult.severity,
          suggestedReorderQuantity: evalResult.suggestedReorderQuantity,
          defaultVendor: item.defaultVendor || null,
          costPriceCents: item.costPriceCents || null,
          categoryName: (item as any).category?.name,
        })
        break

      case 'HEALTHY':
        healthy++
        break

      case 'UNRATED':
        unrated++
        break
    }
  }

  // Sort critical by available asc (0/negative first)
  criticalItems.sort((a, b) => a.availableQuantity - b.availableQuantity)
  // Sort low stock by available asc
  lowStockItems.sort((a, b) => a.availableQuantity - b.availableQuantity)

  return {
    counts: {
      criticalOutOfStock: outOfStock + critical,
      outOfStock,
      critical,
      lowStock,
      healthy,
      unrated,
      totalTracked: items.length,
    },
    criticalItems,
    lowStockItems,
    healthyCount: healthy,
  }
}
