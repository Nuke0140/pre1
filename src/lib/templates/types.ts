/**
 * PreOne — No-Code Template Studio Types
 * Strict, type-safe definitions for visual document templates.
 */

export type DocumentType =
  | 'STUDENT_ID_CARD'
  | 'STAFF_ID_CARD'
  | 'FEE_RECEIPT'
  | 'CERTIFICATE'
  | 'ADMISSION_FORM'
  | 'REPORT_CARD'
  | 'GENERAL_LETTER'

export type PageFormat =
  | 'A4_PORTRAIT'
  | 'A4_LANDSCAPE'
  | 'ID_CARD_PORTRAIT'
  | 'ID_CARD_LANDSCAPE'
  | 'RECEIPT_THERMAL'
  | 'RECEIPT_HALF_A4'
  | 'CERTIFICATE_A4'

export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type ElementType =
  | 'text'
  | 'bound-text'
  | 'image'
  | 'photo'
  | 'shape'
  | 'table'
  | 'barcode'
  | 'qrcode'
  | 'signature'
  | 'badge'

export interface TableColumnDef {
  key: string
  label: string
  widthPercent: number
  align: 'left' | 'center' | 'right'
}

export interface ElementStyles {
  fontSize?: number // in pt or px
  fontWeight?: 'normal' | '500' | '600' | 'bold'
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
  letterSpacing?: number
  lineHeight?: number
  textTransform?: 'none' | 'uppercase' | 'capitalize'
  tableColumns?: TableColumnDef[]
  shapeType?: 'rectangle' | 'line' | 'circle' | 'pill'
}

export interface TemplateElement {
  id: string
  type: ElementType
  name: string
  x: number // in mm
  y: number // in mm
  width: number // in mm
  height: number // in mm
  zIndex: number
  content: string // text, placeholder, or static asset URL
  fieldBinding?: string // e.g. 'student.fullName', 'school.name'
  styles: ElementStyles
  locked?: boolean
}

export interface TemplateDefinition {
  version: number
  status: TemplateStatus
  documentType: DocumentType
  pageSize: PageFormat
  orientation: 'portrait' | 'landscape'
  widthMm: number
  heightMm: number
  backgroundColor: string
  elements: TemplateElement[]
  publishedAt?: string
  publishedBy?: string
  description?: string
  marginsMm?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface DocumentTemplateRecord {
  id: string
  tenantId: string
  type: string
  name: string
  content: TemplateDefinition
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface PageDimension {
  name: string
  format: PageFormat
  widthMm: number
  heightMm: number
  orientation: 'portrait' | 'landscape'
  description: string
}

export const PAGE_DIMENSIONS: Record<PageFormat, PageDimension> = {
  A4_PORTRAIT: {
    name: 'A4 Portrait',
    format: 'A4_PORTRAIT',
    widthMm: 210,
    heightMm: 297,
    orientation: 'portrait',
    description: 'Standard 210 × 297 mm document',
  },
  A4_LANDSCAPE: {
    name: 'A4 Landscape',
    format: 'A4_LANDSCAPE',
    widthMm: 297,
    heightMm: 210,
    orientation: 'landscape',
    description: 'Standard 297 × 210 mm document',
  },
  ID_CARD_PORTRAIT: {
    name: 'ID Card Portrait',
    format: 'ID_CARD_PORTRAIT',
    widthMm: 54,
    heightMm: 85.6,
    orientation: 'portrait',
    description: 'Standard CR80 54 × 85.6 mm card',
  },
  ID_CARD_LANDSCAPE: {
    name: 'ID Card Landscape',
    format: 'ID_CARD_LANDSCAPE',
    widthMm: 85.6,
    heightMm: 54,
    orientation: 'landscape',
    description: 'Standard CR80 85.6 × 54 mm card',
  },
  RECEIPT_THERMAL: {
    name: 'Thermal Receipt',
    format: 'RECEIPT_THERMAL',
    widthMm: 80,
    heightMm: 180,
    orientation: 'portrait',
    description: 'POS Roll 80 × 180 mm slip',
  },
  RECEIPT_HALF_A4: {
    name: 'Half A4 Receipt (A5 Landscape)',
    format: 'RECEIPT_HALF_A4',
    widthMm: 210,
    heightMm: 148,
    orientation: 'landscape',
    description: 'Standard A5 210 × 148 mm slip',
  },
  CERTIFICATE_A4: {
    name: 'Certificate A4',
    format: 'CERTIFICATE_A4',
    widthMm: 297,
    heightMm: 210,
    orientation: 'landscape',
    description: 'Certificate 297 × 210 mm',
  },
}

export const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: string; defaultFormat: PageFormat; description: string }
> = {
  STUDENT_ID_CARD: {
    label: 'Student ID Card',
    icon: 'Contact',
    defaultFormat: 'ID_CARD_PORTRAIT',
    description: 'Student badges, smart bus cards, and pick-up identification.',
  },
  STAFF_ID_CARD: {
    label: 'Staff ID Card',
    icon: 'IdCard',
    defaultFormat: 'ID_CARD_PORTRAIT',
    description: 'Faculty, educator, and transport staff official credentials.',
  },
  FEE_RECEIPT: {
    label: 'Fee Receipt',
    icon: 'Receipt',
    defaultFormat: 'RECEIPT_HALF_A4',
    description: 'Official fee payment receipts, term breakdowns, and tax vouchers.',
  },
  CERTIFICATE: {
    label: 'Certificate',
    icon: 'Award',
    defaultFormat: 'CERTIFICATE_A4',
    description: 'Completion, graduation, sport day, and achievement certificates.',
  },
  ADMISSION_FORM: {
    label: 'Admission Form',
    icon: 'FileSpreadsheet',
    defaultFormat: 'A4_PORTRAIT',
    description: 'Official printed application form with student & guardian declarations.',
  },
  REPORT_CARD: {
    label: 'Report Card',
    icon: 'GraduationCap',
    defaultFormat: 'A4_PORTRAIT',
    description: 'Term evaluations, developmental milestone checklists, and teacher remarks.',
  },
  GENERAL_LETTER: {
    label: 'General Letter / Circular',
    icon: 'FileText',
    defaultFormat: 'A4_PORTRAIT',
    description: 'Bonafide letters, transfer certificates, and branded notifications.',
  },
}
