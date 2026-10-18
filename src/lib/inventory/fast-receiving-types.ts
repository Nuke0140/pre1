export interface ItemLookupResult {
  id: string
  name: string
  sku: string
  description?: string | null
  imageUrl?: string | null
  isActive: boolean
  unit: {
    id: string
    name: string
    symbol: string
    decimalAllowed?: boolean
  }
  category: {
    id: string
    name: string
    code?: string
  }
  defaultVendor?: {
    id: string
    name: string
    code?: string
    phone?: string | null
    contactPerson?: string | null
  } | null
  currentStock: {
    availableQuantity: number
    physicalQuantity: number
    reservedQuantity: number
    locations: Array<{
      locationId: string
      locationName: string
      locationCode: string
      availableQuantity: number
      physicalQuantity: number
    }>
  }
  openPurchaseOrders: Array<{
    purchaseOrderId: string
    purchaseOrderItemId: string
    poNumber: string
    orderDate: Date | string
    vendorName: string
    orderedQuantity: number
    receivedQuantity: number
    pendingQuantity: number
    unitPrice: number
  }>
}

export interface FastStockReceiptInput {
  idempotencyKey: string
  itemId: string
  branchId: string
  locationId: string
  quantity: number
  unitId?: string
  purchaseOrderId?: string | null
  purchaseOrderItemId?: string | null
  unitCost?: number | null
  batchNumber?: string | null
  expiryDate?: Date | string | null
  serialNumber?: string | null
  invoiceNumber?: string | null
  challanNumber?: string | null
  deliveryNotes?: string | null
  deliveryPhotoUrl?: string | null
  vendorId?: string | null
}

export interface FastStockReceiptResult {
  success: boolean
  isDuplicate: boolean
  movementId: string
  referenceType: string
  referenceNumber: string
  grnNumber?: string | null
  purchaseOrderId?: string | null
  itemId: string
  itemName: string
  sku: string
  receivedQuantity: number
  unitSymbol: string
  unitName: string
  previousAvailableQuantity: number
  newAvailableQuantity: number
  locationId: string
  locationName: string
  branchId: string
  receivedAt: Date | string
  deliveryPhotoUrl?: string | null
}

export interface FastReceiveSessionItem {
  timestamp: string
  itemName: string
  sku: string
  quantity: number
  unitSymbol: string
  locationName: string
  referenceNumber: string
  newAvailableQuantity: number
  photoUrl?: string | null
  poNumber?: string | null
}
