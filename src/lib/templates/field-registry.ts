/**
 * PreOne — Approved Data Field Registry & Binding Engine
 * Maps real PreOne domain models to safely injectable template tokens.
 * Zero raw client SQL or untrusted evaluation.
 */

export interface FieldDefinition {
  key: string // e.g. 'student.fullName'
  label: string // e.g. 'Student Full Name'
  domain: 'SCHOOL' | 'STUDENT' | 'GUARDIAN' | 'CLASSROOM' | 'FINANCE' | 'STAFF' | 'SYSTEM'
  sampleValue: string
  description?: string
}

export const APPROVED_TEMPLATE_FIELDS: FieldDefinition[] = [
  // ── SCHOOL DOMAIN ──
  {
    key: 'school.name',
    label: 'School Name',
    domain: 'SCHOOL',
    sampleValue: 'Little Explorers Preschool Academy',
    description: 'Official registered name of the preschool or branch',
  },
  {
    key: 'school.code',
    label: 'Branch / Affiliation Code',
    domain: 'SCHOOL',
    sampleValue: 'LEPA-BLR-01',
    description: 'School affiliation or branch identifier',
  },
  {
    key: 'school.address',
    label: 'School Address',
    domain: 'SCHOOL',
    sampleValue: '#42, Blossom Garden Road, Indiranagar',
    description: 'Physical campus address line',
  },
  {
    key: 'school.city',
    label: 'School City & Postal Code',
    domain: 'SCHOOL',
    sampleValue: 'Bengaluru, Karnataka 560038',
    description: 'Campus city and PIN / postal code',
  },
  {
    key: 'school.phone',
    label: 'School Phone',
    domain: 'SCHOOL',
    sampleValue: '+91 80 4123 4567',
    description: 'Official reception telephone number',
  },
  {
    key: 'school.email',
    label: 'School Email',
    domain: 'SCHOOL',
    sampleValue: 'admissions@littleexplorers.edu',
    description: 'Official correspondence email address',
  },
  {
    key: 'school.logoUrl',
    label: 'School Logo Image',
    domain: 'SCHOOL',
    sampleValue: '/preone-crest.png',
    description: 'URL to high-res school crest / emblem',
  },
  {
    key: 'school.principalName',
    label: 'Principal / Head Name',
    domain: 'SCHOOL',
    sampleValue: 'Dr. Meenakshi Sundaram',
    description: 'Name of the current Principal or Centre Head',
  },
  {
    key: 'school.principalSignatureUrl',
    label: 'Principal Signature Asset',
    domain: 'SCHOOL',
    sampleValue: '/sample-signature.png',
    description: 'Authorized digital signature graphic for the Principal',
  },
  {
    key: 'school.academicYear',
    label: 'Academic Session',
    domain: 'SCHOOL',
    sampleValue: '2026-2027',
    description: 'Current active academic year cycle',
  },

  // ── STUDENT DOMAIN ──
  {
    key: 'student.admissionNumber',
    label: 'Admission Number',
    domain: 'STUDENT',
    sampleValue: 'PRE-2026-0042',
    description: 'Unique institutional admission identifier',
  },
  {
    key: 'student.fullName',
    label: 'Student Full Name',
    domain: 'STUDENT',
    sampleValue: 'Aarav Sharma',
    description: 'Enrolled child official full name',
  },
  {
    key: 'student.firstName',
    label: 'Student First Name',
    domain: 'STUDENT',
    sampleValue: 'Aarav',
    description: 'Given name of the child',
  },
  {
    key: 'student.lastName',
    label: 'Student Last Name',
    domain: 'STUDENT',
    sampleValue: 'Sharma',
    description: 'Surname / family name',
  },
  {
    key: 'student.dob',
    label: 'Date of Birth',
    domain: 'STUDENT',
    sampleValue: '14 May 2022',
    description: 'Child birth date (formatted DD MMMM YYYY)',
  },
  {
    key: 'student.gender',
    label: 'Gender',
    domain: 'STUDENT',
    sampleValue: 'Male',
    description: 'Gender of the student',
  },
  {
    key: 'student.bloodGroup',
    label: 'Blood Group',
    domain: 'STUDENT',
    sampleValue: 'B+',
    description: 'Medical blood group',
  },
  {
    key: 'student.rollNumber',
    label: 'Roll / Seat Number',
    domain: 'STUDENT',
    sampleValue: '12',
    description: 'Classroom roll or badge number',
  },
  {
    key: 'student.photoUrl',
    label: 'Student Photo',
    domain: 'STUDENT',
    sampleValue: '/sample-child-avatar.png',
    description: 'Official student portrait photo',
  },
  {
    key: 'student.emergencyPhone',
    label: 'Emergency Contact Phone',
    domain: 'STUDENT',
    sampleValue: '+91 98450 12345',
    description: 'Primary verified emergency mobile number',
  },
  {
    key: 'student.address',
    label: 'Student Address',
    domain: 'STUDENT',
    sampleValue: 'Flat 4B, Greenwood Heights, 12th Main, Indiranagar',
    description: 'Residential home address',
  },
  {
    key: 'student.admissionDate',
    label: 'Date of Enrolment',
    domain: 'STUDENT',
    sampleValue: '01 June 2026',
    description: 'Official date of joining',
  },

  // ── GUARDIAN DOMAIN ──
  {
    key: 'guardian.primaryName',
    label: 'Guardian Name',
    domain: 'GUARDIAN',
    sampleValue: 'Vikram Sharma',
    description: 'Primary parent or authorized guardian name',
  },
  {
    key: 'guardian.relationship',
    label: 'Relationship',
    domain: 'GUARDIAN',
    sampleValue: 'Father',
    description: 'Relationship to child (Father, Mother, Legal Guardian)',
  },
  {
    key: 'guardian.phone',
    label: 'Guardian Phone',
    domain: 'GUARDIAN',
    sampleValue: '+91 98450 12345',
    description: 'Parent primary phone number',
  },
  {
    key: 'guardian.email',
    label: 'Guardian Email',
    domain: 'GUARDIAN',
    sampleValue: 'vikram.sharma@example.com',
    description: 'Parent billing and notice email',
  },

  // ── CLASSROOM & PROGRAM DOMAIN ──
  {
    key: 'classroom.name',
    label: 'Classroom / Section',
    domain: 'CLASSROOM',
    sampleValue: 'Butterflies (Morning)',
    description: 'Assigned classroom section',
  },
  {
    key: 'classroom.program',
    label: 'Program / Grade Level',
    domain: 'CLASSROOM',
    sampleValue: 'Early Years / Pre-K',
    description: 'Curricular program name',
  },
  {
    key: 'classroom.primaryTeacher',
    label: 'Lead Teacher Name',
    domain: 'CLASSROOM',
    sampleValue: 'Ms. Anita Deshmukh',
    description: 'Class homeroom teacher name',
  },
  {
    key: 'classroom.roomNumber',
    label: 'Room Number',
    domain: 'CLASSROOM',
    sampleValue: 'Room 102 - Ground Floor',
    description: 'Classroom location or room identifier',
  },

  // ── FINANCE DOMAIN ──
  {
    key: 'finance.receiptNumber',
    label: 'Receipt Number',
    domain: 'FINANCE',
    sampleValue: 'REC-2026-0842',
    description: 'Unique receipt reference voucher number',
  },
  {
    key: 'finance.invoiceNumber',
    label: 'Invoice Reference',
    domain: 'FINANCE',
    sampleValue: 'INV-2026-0319',
    description: 'Original fee invoice identifier',
  },
  {
    key: 'finance.termName',
    label: 'Fee Term / Description',
    domain: 'FINANCE',
    sampleValue: 'Term 1 Tuition & Learning Kit',
    description: 'Billing description or fee period',
  },
  {
    key: 'finance.totalAmount',
    label: 'Total Bill Amount',
    domain: 'FINANCE',
    sampleValue: '₹24,500.00',
    description: 'Total invoiced charges',
  },
  {
    key: 'finance.paidAmount',
    label: 'Amount Paid',
    domain: 'FINANCE',
    sampleValue: '₹24,500.00',
    description: 'Actual sum collected on this receipt',
  },
  {
    key: 'finance.balanceAmount',
    label: 'Outstanding Balance',
    domain: 'FINANCE',
    sampleValue: '₹0.00',
    description: 'Remaining fee amount due after this payment',
  },
  {
    key: 'finance.paymentDate',
    label: 'Payment Date',
    domain: 'FINANCE',
    sampleValue: '02 October 2026',
    description: 'Date payment was received',
  },
  {
    key: 'finance.paymentMethod',
    label: 'Payment Method',
    domain: 'FINANCE',
    sampleValue: 'UPI (Google Pay / PhonePe)',
    description: 'Channel (UPI, NetBanking, Card, Cash, Cheque)',
  },
  {
    key: 'finance.transactionRef',
    label: 'Transaction Reference',
    domain: 'FINANCE',
    sampleValue: 'UPI/3298410298/AXIS',
    description: 'Bank or gateway transaction reference string',
  },
  {
    key: 'finance.amountInWords',
    label: 'Amount in Words',
    domain: 'FINANCE',
    sampleValue: 'Rupees Twenty Four Thousand Five Hundred Only',
    description: 'Formal English currency representation',
  },

  // ── STAFF DOMAIN ──
  {
    key: 'staff.employeeCode',
    label: 'Staff / Employee ID',
    domain: 'STAFF',
    sampleValue: 'EMP-014',
    description: 'Official staff employment code',
  },
  {
    key: 'staff.fullName',
    label: 'Staff Full Name',
    domain: 'STAFF',
    sampleValue: 'Anita Deshmukh',
    description: 'Faculty or staff member name',
  },
  {
    key: 'staff.designation',
    label: 'Staff Designation',
    domain: 'STAFF',
    sampleValue: 'Senior Early Educator',
    description: 'Job role or appointment title',
  },
  {
    key: 'staff.department',
    label: 'Department',
    domain: 'STAFF',
    sampleValue: 'Academics & Early Childhood',
    description: 'Faculty or operations department',
  },
  {
    key: 'staff.phone',
    label: 'Staff Mobile Number',
    domain: 'STAFF',
    sampleValue: '+91 97412 88990',
    description: 'Official contact mobile number',
  },
  {
    key: 'staff.email',
    label: 'Staff Email',
    domain: 'STAFF',
    sampleValue: 'anita.d@littleexplorers.edu',
    description: 'Institutional faculty email',
  },
  {
    key: 'staff.photoUrl',
    label: 'Staff Photo',
    domain: 'STAFF',
    sampleValue: '/sample-staff-avatar.png',
    description: 'Staff badge photo portrait',
  },

  // ── SYSTEM & PRINT DOMAIN ──
  {
    key: 'system.currentDate',
    label: 'Printed Date',
    domain: 'SYSTEM',
    sampleValue: '02 Oct 2026',
    description: 'Today date at time of document printing',
  },
  {
    key: 'system.currentDateTime',
    label: 'Printed Timestamp',
    domain: 'SYSTEM',
    sampleValue: '02 Oct 2026, 06:45 PM',
    description: 'Exact timestamp for verification tracking',
  },
  {
    key: 'system.pageNumber',
    label: 'Page Number',
    domain: 'SYSTEM',
    sampleValue: '1',
    description: 'Current page number',
  },
  {
    key: 'system.totalPages',
    label: 'Total Pages',
    domain: 'SYSTEM',
    sampleValue: '1',
    description: 'Total count of document pages',
  },
]

export const FIELD_DOMAINS: {
  key: FieldDefinition['domain']
  label: string
  color: string
}[] = [
  { key: 'SCHOOL', label: 'School & Campus', color: '#7C3AED' },
  { key: 'STUDENT', label: 'Student Info', color: '#2563EB' },
  { key: 'GUARDIAN', label: 'Parent & Guardian', color: '#059669' },
  { key: 'CLASSROOM', label: 'Class & Program', color: '#D97706' },
  { key: 'FINANCE', label: 'Fee & Billing', color: '#0D9488' },
  { key: 'STAFF', label: 'Faculty & Staff', color: '#9333EA' },
  { key: 'SYSTEM', label: 'Print & System', color: '#475569' },
]

/**
 * Returns a complete sample data record dictionary for preview rendering.
 */
export function getDefaultSampleData(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const f of APPROVED_TEMPLATE_FIELDS) {
    map[f.key] = f.sampleValue
  }
  return map
}

/**
 * Replaces token markers like {{student.fullName}} with resolved values from data context.
 */
export function resolveTokens(
  templateString: string,
  context: Record<string, any>
): string {
  if (!templateString) return ''
  return templateString.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    // 1. Direct key match (e.g. 'student.fullName')
    if (context[key] !== undefined && context[key] !== null) {
      return String(context[key])
    }
    // 2. Nested property lookup (e.g. context.student?.fullName)
    const parts = key.split('.')
    let curr: any = context
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p]
      } else {
        curr = undefined
        break
      }
    }
    if (curr !== undefined && curr !== null) {
      return String(curr)
    }
    // 3. Fallback to sample value if defined
    const fieldDef = APPROVED_TEMPLATE_FIELDS.find((f) => f.key === key)
    if (fieldDef) {
      return fieldDef.sampleValue
    }
    return match
  })
}
