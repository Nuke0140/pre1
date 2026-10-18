export interface ReorderItemInput {
  id: string
  name: string
  sku?: string
  availableQuantity?: number
  suggestedReorderQuantity?: number
  requestedQuantity: number
  unit?: string
  vendorId?: string | null
  vendorName?: string | null
  vendorPhone?: string | null
  vendorContactPerson?: string | null
  costPriceCents?: number | null
}

export interface VendorReorderGroup {
  vendorId: string | null
  vendorName: string
  contactPerson?: string | null
  rawPhone?: string | null
  normalizedPhone: string | null
  isPhoneValid: boolean
  items: ReorderItemInput[]
  totalItems: number
  generatedMessage: string
  whatsAppUrl: string | null
}

export interface GenerateMessageOptions {
  vendorName: string
  schoolName: string
  branchName?: string | null
  items: Array<{
    name: string
    quantity: number
    unit?: string
  }>
  deliveryDate?: string | null
  deliveryNotes?: string | null
  customClosing?: string | null
}

/**
 * Normalizes phone numbers for WhatsApp click-to-chat links (E.164 standard digits).
 * Handles Indian 10-digit numbers (auto-prefixes 91), trunk prefixes (098...),
 * and valid international numbers between 10 and 15 digits.
 * Returns null if the phone is missing, too short, or invalid.
 */
export function normalizeWhatsAppNumber(rawPhone?: string | null): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null
  const cleaned = rawPhone.trim()
  if (!cleaned) return null

  // Strip all non-digit characters except leading plus which indicates international
  let digits = cleaned.replace(/\D/g, '')

  // Handle leading zero trunk prefix (e.g., 09876543210 -> 919876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // 10 digits: standard India mobile / local format, prefix 91
  if (digits.length === 10) {
    return `91${digits}`
  }

  // 11 to 15 digits: valid E.164 international length
  if (digits.length >= 11 && digits.length <= 15) {
    return digits
  }

  return null
}

/**
 * Generates a polite, professional vendor re-order message formatted for preschool suppliers.
 * Strictly excludes confidential cost figures, student information, or internal notes.
 */
export function generateVendorOrderMessage(opts: GenerateMessageOptions): string {
  const schoolDisplay = opts.branchName
    ? `${opts.schoolName} (${opts.branchName})`
    : opts.schoolName

  const header = `Hi ${opts.vendorName.trim()},`
  const intro = `Please arrange the following supplies for ${schoolDisplay}:`

  const itemsList = opts.items
    .filter((item) => item.quantity > 0 && item.name.trim().length > 0)
    .map((item) => {
      const unit = (item.unit || 'units').trim()
      return `• ${item.quantity} ${unit} — ${item.name.trim()}`
    })
    .join('\n')

  const extraNotes: string[] = []
  if (opts.deliveryDate && opts.deliveryDate.trim()) {
    extraNotes.push(`Expected Delivery: ${opts.deliveryDate.trim()}`)
  }
  if (opts.deliveryNotes && opts.deliveryNotes.trim()) {
    extraNotes.push(`Delivery Location / Notes: ${opts.deliveryNotes.trim()}`)
  }

  const extraSection = extraNotes.length > 0 ? `\n\n${extraNotes.join('\n')}` : ''

  const cta = 'Please confirm availability and expected delivery. Kindly send the invoice to accounts.'
  const closing = opts.customClosing || `Thank you,\n${schoolDisplay}`

  return `${header}\n\n${intro}\n\n${itemsList}${extraSection}\n\n${cta}\n\n${closing}`
}

/**
 * Constructs a secure WhatsApp wa.me click-to-chat URL with percent-encoded payload.
 */
export function buildWhatsAppClickToChatUrl(phone: string, message: string): string {
  const normalizedPhone = normalizeWhatsAppNumber(phone)
  if (!normalizedPhone) {
    throw new Error('Cannot construct WhatsApp URL with invalid phone number')
  }
  const encodedText = encodeURIComponent(message)
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`
}

/**
 * Groups multiple inventory items by their assigned vendor.
 * Items without an assigned vendor are collected under a dedicated 'UNASSIGNED' group.
 */
export function groupItemsByVendor(
  items: ReorderItemInput[],
  allVendors: Array<{
    id: string
    name: string
    code?: string
    phone?: string | null
    alternatePhone?: string | null
    contactPerson?: string | null
  }>,
  schoolName: string,
  branchName?: string | null,
  deliveryDate?: string | null,
  deliveryNotes?: string | null
): VendorReorderGroup[] {
  const vendorMap = new Map<string, any>()
  for (const v of allVendors) {
    vendorMap.set(v.id, v)
  }

  const groupsMap = new Map<string, ReorderItemInput[]>()

  for (const item of items) {
    const vId = item.vendorId || 'UNASSIGNED'
    if (!groupsMap.has(vId)) {
      groupsMap.set(vId, [])
    }
    groupsMap.get(vId)!.push(item)
  }

  const result: VendorReorderGroup[] = []

  // Process assigned vendors first
  for (const [vId, groupItems] of groupsMap.entries()) {
    if (vId === 'UNASSIGNED') continue

    const vendor = vendorMap.get(vId)
    const vendorName = vendor?.name || groupItems[0]?.vendorName || 'Supplier'
    const contactPerson = vendor?.contactPerson || groupItems[0]?.vendorContactPerson || null
    const rawPhone = vendor?.phone || vendor?.alternatePhone || groupItems[0]?.vendorPhone || null
    const normalizedPhone = normalizeWhatsAppNumber(rawPhone)
    const isPhoneValid = Boolean(normalizedPhone)

    const generatedMessage = generateVendorOrderMessage({
      vendorName,
      schoolName,
      branchName,
      items: groupItems.map((it) => ({
        name: it.name,
        quantity: it.requestedQuantity,
        unit: it.unit,
      })),
      deliveryDate,
      deliveryNotes,
    })

    const whatsAppUrl = isPhoneValid && normalizedPhone
      ? buildWhatsAppClickToChatUrl(normalizedPhone, generatedMessage)
      : null

    result.push({
      vendorId: vId,
      vendorName,
      contactPerson,
      rawPhone,
      normalizedPhone,
      isPhoneValid,
      items: groupItems,
      totalItems: groupItems.length,
      generatedMessage,
      whatsAppUrl,
    })
  }

  // Process unassigned items
  const unassignedItems = groupsMap.get('UNASSIGNED')
  if (unassignedItems && unassignedItems.length > 0) {
    const generatedMessage = generateVendorOrderMessage({
      vendorName: 'Supplier',
      schoolName,
      branchName,
      items: unassignedItems.map((it) => ({
        name: it.name,
        quantity: it.requestedQuantity,
        unit: it.unit,
      })),
      deliveryDate,
      deliveryNotes,
    })

    result.push({
      vendorId: null,
      vendorName: 'Unassigned Supplier (Select Vendor)',
      contactPerson: null,
      rawPhone: null,
      normalizedPhone: null,
      isPhoneValid: false,
      items: unassignedItems,
      totalItems: unassignedItems.length,
      generatedMessage,
      whatsAppUrl: null,
    })
  }

  return result
}
