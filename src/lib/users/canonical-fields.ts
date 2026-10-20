/**
 * PreOne Authoritative Canonical Field Definitions for Users Module
 * Single source of truth for field parity across:
 * 1. Add / Edit User Forms
 * 2. CSV / XLSX File Import
 * 3. Copy-Paste Spreadsheet Grid
 * 4. Validation & Preview Engines
 * 5. Bulk Commit Database Persistence
 * 6. CSV Export Data Serialization & Minimization
 */

export type FieldDataType =
  | 'string'
  | 'email'
  | 'phone'
  | 'date'
  | 'enum'
  | 'boolean'
  | 'number'
  | 'relation'

export interface CanonicalFieldDefinition {
  key: string
  label: string
  dataType: FieldDataType
  userType: 'STAFF' | 'FAMILY' | 'BOTH'
  required?: boolean
  importable: boolean
  exportable: boolean
  sensitive?: boolean
  securityRule?: string
  placeholder?: string
  width?: string
  options?: string[]
  aliases: string[]
}

export const CANONICAL_STAFF_FIELDS: CanonicalFieldDefinition[] = [
  // ── 1. Basic Information ──
  {
    key: 'fullName',
    label: 'Full Name',
    dataType: 'string',
    userType: 'STAFF',
    required: true,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Ananya Sharma',
    width: '180px',
    aliases: ['fullname', 'full_name', 'name', 'staffname', 'staff_name', 'employee_name', 'employeename'],
  },
  {
    key: 'email',
    label: 'Email Address',
    dataType: 'email',
    userType: 'STAFF',
    required: true,
    importable: true,
    exportable: true,
    placeholder: 'ananya@preschool.com',
    width: '180px',
    aliases: ['email', 'emailaddress', 'email_address', 'mail', 'work_email', 'workemail'],
  },
  {
    key: 'phone',
    label: 'Phone Number',
    dataType: 'phone',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: '+919876543210',
    width: '140px',
    aliases: ['phone', 'phonenumber', 'phone_number', 'mobile', 'mobilenumber', 'mobile_number', 'contact', 'telephone'],
  },
  {
    key: 'username',
    label: 'Username',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'ananya.sharma',
    width: '140px',
    aliases: ['username', 'user_name', 'login', 'login_id', 'userid', 'handle'],
  },
  {
    key: 'role',
    label: 'Role',
    dataType: 'enum',
    userType: 'STAFF',
    required: true,
    importable: true,
    exportable: true,
    width: '140px',
    options: ['TEACHER', 'PRINCIPAL', 'COORDINATOR', 'STAFF', 'ACCOUNTS', 'RECEPTIONIST', 'DRIVER', 'ATTENDANT', 'OWNER'],
    aliases: ['role', 'primaryrole', 'primary_role', 'userrole', 'user_role', 'position_type'],
  },
  {
    key: 'branchCode',
    label: 'Campus Branch',
    dataType: 'relation',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'MAIN',
    width: '110px',
    aliases: ['branchcode', 'branch_code', 'branch', 'campus', 'campuscode', 'campus_code', 'schoolbranch'],
  },
  {
    key: 'classroomCode',
    label: 'Assigned Classroom',
    dataType: 'relation',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. NUR-A',
    width: '140px',
    aliases: ['classroomcode', 'classroom_code', 'classroom', 'class', 'assignedclassroom', 'assigned_classroom', 'section'],
  },
  {
    key: 'employeeCode',
    label: 'Employee Code',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'EMP-101',
    width: '120px',
    aliases: ['employeecode', 'employee_code', 'empcode', 'emp_code', 'staffid', 'staff_id', 'badge_id'],
  },
  {
    key: 'designation',
    label: 'Designation',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'Lead Montessori Teacher',
    width: '150px',
    aliases: ['designation', 'title', 'jobtitle', 'job_title', 'position'],
  },
  {
    key: 'department',
    label: 'Department',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'Academics',
    width: '130px',
    aliases: ['department', 'dept', 'division', 'functional_area'],
  },
  {
    key: 'qualification',
    label: 'Qualification',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'B.Ed, Early Childhood Dip.',
    width: '160px',
    aliases: ['qualification', 'education', 'highest_qualification', 'degree', 'credentials'],
  },
  {
    key: 'employmentType',
    label: 'Employment Type',
    dataType: 'enum',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    width: '130px',
    options: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'PROBATION'],
    aliases: ['employmenttype', 'employment_type', 'contracttype', 'contract_type', 'job_type'],
  },
  {
    key: 'joiningDate',
    label: 'Date of Joining',
    dataType: 'date',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'YYYY-MM-DD',
    width: '120px',
    aliases: ['joiningdate', 'joining_date', 'dateofjoining', 'date_of_joining', 'doj', 'hiredate', 'hire_date', 'startdate', 'start_date'],
  },
  {
    key: 'dateOfBirth',
    label: 'Date of Birth',
    dataType: 'date',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'YYYY-MM-DD',
    width: '120px',
    aliases: ['dateofbirth', 'date_of_birth', 'dob', 'birthdate', 'birth_date'],
  },
  {
    key: 'gender',
    label: 'Gender',
    dataType: 'enum',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    width: '110px',
    options: ['FEMALE', 'MALE', 'OTHER'],
    aliases: ['gender', 'sex'],
  },
  {
    key: 'maritalStatus',
    label: 'Marital Status',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'Single / Married',
    width: '120px',
    aliases: ['maritalstatus', 'marital_status', 'marriage_status'],
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group',
    dataType: 'enum',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    width: '110px',
    options: ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    aliases: ['bloodgroup', 'blood_group', 'bloodtype', 'blood_type'],
  },
  {
    key: 'emergencyContactName',
    label: 'Emergency Contact Name',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Ramesh Sharma',
    width: '160px',
    aliases: ['emergencycontactname', 'emergency_contact_name', 'emergencyname', 'emergency_name', 'kin_name'],
  },
  {
    key: 'emergencyContactPhone',
    label: 'Emergency Contact Phone',
    dataType: 'phone',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: '+919876543219',
    width: '150px',
    aliases: ['emergencycontactphone', 'emergency_contact_phone', 'emergencyphone', 'emergency_phone', 'kin_phone', 'emergency_mobile'],
  },
  {
    key: 'currentAddress',
    label: 'Current Address',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Flat 402, Sunshine Heights, Pune',
    width: '200px',
    aliases: ['currentaddress', 'current_address', 'address', 'residentialaddress', 'residential_address', 'street_address'],
  },
  {
    key: 'permanentAddress',
    label: 'Permanent Address',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. 12 Heritage Way, Nagpur',
    width: '200px',
    aliases: ['permanentaddress', 'permanent_address', 'hometown_address'],
  },
  {
    key: 'panNumber',
    label: 'PAN Number',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: false, // Sensitive financial ID: masked/excluded on export
    sensitive: true,
    securityRule: 'Masked on export; encrypted at rest (AES-GCM)',
    placeholder: 'ABCDE1234F',
    width: '130px',
    aliases: ['pannumber', 'pan_number', 'pan', 'pancard', 'pan_card'],
  },
  {
    key: 'aadhaarNumber',
    label: 'Aadhaar Number',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: false, // UIDAI standard: restricted from open CSV export
    sensitive: true,
    securityRule: 'UIDAI standard: excluded on export; encrypted at rest',
    placeholder: '12-digit UIDAI number',
    width: '140px',
    aliases: ['aadhaarnumber', 'aadhaar_number', 'aadhaar', 'adhar', 'uidai'],
  },
  {
    key: 'uanNumber',
    label: 'UAN Number',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: false,
    sensitive: true,
    securityRule: 'Excluded on export; encrypted at rest',
    placeholder: '12-digit EPF UAN',
    width: '130px',
    aliases: ['uannumber', 'uan_number', 'uan', 'epf_uan'],
  },
  {
    key: 'esiNumber',
    label: 'ESI Number',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: false,
    sensitive: true,
    securityRule: 'Excluded on export; encrypted at rest',
    placeholder: '17-digit ESIC IP number',
    width: '130px',
    aliases: ['esinumber', 'esi_number', 'esi', 'esic'],
  },
  {
    key: 'noticePeriodDays',
    label: 'Notice Period (Days)',
    dataType: 'number',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    placeholder: '60',
    width: '110px',
    aliases: ['noticeperioddays', 'notice_period_days', 'noticeperiod', 'notice_period'],
  },
  {
    key: 'status',
    label: 'Account Status',
    dataType: 'enum',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: true,
    width: '110px',
    options: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'],
    aliases: ['status', 'accountstatus', 'account_status', 'state'],
  },
]

export const CANONICAL_FAMILY_FIELDS: CanonicalFieldDefinition[] = [
  // ── Caregiver Account Fields ──
  {
    key: 'fullName',
    label: 'Caregiver Full Name',
    dataType: 'string',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Rajesh Kumar',
    width: '180px',
    aliases: ['fullname', 'full_name', 'name', 'parentname', 'parent_name', 'caregivername', 'caregiver_name'],
  },
  {
    key: 'username',
    label: 'Caregiver Username',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'rajesh.kumar',
    width: '130px',
    aliases: ['username', 'user_name', 'login', 'login_id', 'userid'],
  },
  {
    key: 'gender',
    label: 'Caregiver Gender',
    dataType: 'enum',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '110px',
    options: ['FEMALE', 'MALE', 'OTHER'],
    aliases: ['gender', 'sex', 'caregivergender', 'caregiver_gender'],
  },
  {
    key: 'email',
    label: 'Email Address',
    dataType: 'email',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    placeholder: 'rajesh@example.com',
    width: '180px',
    aliases: ['email', 'emailaddress', 'email_address', 'mail', 'parentemail', 'parent_email'],
  },
  {
    key: 'phone',
    label: 'Phone Number',
    dataType: 'phone',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    placeholder: '+919876543210',
    width: '140px',
    aliases: ['phone', 'phonenumber', 'phone_number', 'mobile', 'mobilenumber', 'mobile_number', 'contact', 'parentphone', 'parent_phone'],
  },
  {
    key: 'role',
    label: 'Role',
    dataType: 'enum',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    width: '130px',
    options: ['PARENT', 'GUARDIAN'],
    aliases: ['role', 'userrole', 'user_role', 'caregiver_role'],
  },
  {
    key: 'relationship',
    label: 'Relationship to Child',
    dataType: 'enum',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '140px',
    options: ['FATHER', 'MOTHER', 'GUARDIAN', 'GRANDPARENT', 'SIBLING', 'OTHER'],
    aliases: ['relationship', 'relation', 'relationtochild', 'relation_to_child', 'kinship'],
  },
  {
    key: 'occupation',
    label: 'Occupation',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Software Engineer',
    width: '160px',
    aliases: ['occupation', 'profession', 'job', 'designation', 'employment'],
  },
  {
    key: 'isPrimaryContact',
    label: 'Primary Contact',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '120px',
    options: ['YES', 'NO'],
    aliases: ['isprimarycontact', 'is_primary_contact', 'isprimary', 'is_primary', 'primarycontact', 'primary_contact'],
  },
  {
    key: 'canPickup',
    label: 'Authorized for Pickup',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '130px',
    options: ['YES', 'NO'],
    aliases: ['canpickup', 'can_pickup', 'pickupauthorized', 'pickup_authorized', 'authorizedpickup', 'authorized_pickup'],
  },
  {
    key: 'receivesComm',
    label: 'Receives Communications',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '140px',
    options: ['YES', 'NO'],
    aliases: ['receivescomm', 'receives_comm', 'receivescommunication', 'receives_communication', 'communication', 'get_notified'],
  },
  {
    key: 'isFeePayer',
    label: 'Fee Payer',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '110px',
    options: ['YES', 'NO'],
    aliases: ['isfeepayer', 'is_fee_payer', 'feepayer', 'fee_payer', 'payer'],
  },
  {
    key: 'pickupPin',
    label: 'Pickup Gate PIN',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false, // Strict child security rule: Gate release PIN is strictly excluded from export
    sensitive: true,
    securityRule: 'Child gate release PIN: strictly excluded from CSV export',
    placeholder: 'e.g. 1234',
    width: '120px',
    aliases: ['pickuppin', 'pickup_pin', 'gatepin', 'gate_pin', 'pin'],
  },
  {
    key: 'studentAdmissionNo',
    label: 'Student Admission No',
    dataType: 'relation',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. ADM-2026-00123',
    width: '160px',
    aliases: ['studentadmissionno', 'student_admission_no', 'admissionno', 'admission_no', 'student_id', 'admission_number'],
  },
  {
    key: 'studentName',
    label: 'Student Name',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'e.g. Aarav Patil',
    width: '160px',
    aliases: ['studentname', 'student_name', 'childname', 'child_name'],
  },
  {
    key: 'studentDateOfBirth',
    label: 'Student Date of Birth',
    dataType: 'date',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'YYYY-MM-DD',
    width: '130px',
    aliases: ['studentdateofbirth', 'student_date_of_birth', 'studentdob', 'student_dob', 'childdob', 'child_dob'],
  },
  {
    key: 'studentGender',
    label: 'Student Gender',
    dataType: 'enum',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    width: '110px',
    options: ['FEMALE', 'MALE', 'OTHER'],
    aliases: ['studentgender', 'student_gender', 'childgender', 'child_gender'],
  },
  {
    key: 'studentBloodGroup',
    label: 'Student Blood Group',
    dataType: 'enum',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    width: '110px',
    options: ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
    aliases: ['studentbloodgroup', 'student_blood_group', 'childbloodgroup', 'child_blood_group'],
  },
  {
    key: 'studentBranch',
    label: 'Student Branch',
    dataType: 'relation',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'MAIN',
    width: '110px',
    aliases: ['studentbranch', 'student_branch', 'childbranch', 'child_branch'],
  },
  {
    key: 'studentClass',
    label: 'Student Class',
    dataType: 'relation',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'NURSERY-A',
    width: '130px',
    aliases: ['studentclass', 'student_class', 'childclass', 'child_class', 'studentclassroom', 'student_classroom'],
  },
  {
    key: 'studentSeatNumber',
    label: 'Student Seat Number',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'SEAT-01',
    width: '120px',
    aliases: ['studentseatnumber', 'student_seat_number', 'seatnumber', 'seat_number', 'seatno', 'seat_no'],
  },
  {
    key: 'studentAdmissionYear',
    label: 'Student Admission Year',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: '2026-27',
    width: '120px',
    aliases: ['studentadmissionyear', 'student_admission_year', 'admissionyear', 'admission_year'],
  },
  {
    key: 'studentUsername',
    label: 'Student Username',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'aarav.patil',
    width: '130px',
    aliases: ['studentusername', 'student_username', 'childusername', 'child_username'],
  },
  {
    key: 'status',
    label: 'Account Status',
    dataType: 'enum',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '110px',
    options: ['ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE'],
    aliases: ['status', 'accountstatus', 'account_status', 'state'],
  },
]

/**
 * Normalizes any arbitrary header string (e.g. "Full Name", "full_name", "EMAIL ADDRESS")
 * to its canonical field key based on the user type contract.
 */
export function normalizeHeaderToCanonicalKey(
  header: string,
  userType: 'STAFF' | 'FAMILY'
): string | null {
  if (!header || typeof header !== 'string') return null
  const cleaned = header
    .replace(/^["']|["']$/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')

  const definitions = userType === 'FAMILY' ? CANONICAL_FAMILY_FIELDS : CANONICAL_STAFF_FIELDS

  for (const def of definitions) {
    if (def.key.toLowerCase() === cleaned) return def.key
    if (def.aliases.some((a) => a.replace(/[\s\-_]+/g, '').toLowerCase() === cleaned)) {
      return def.key
    }
  }

  return null
}

/**
 * Resolves a raw row object against the canonical field contract,
 * mapping recognized headers and reporting unmapped/unknown columns.
 */
export function resolveRowWithAliases(
  rawRow: Record<string, any>,
  userType: 'STAFF' | 'FAMILY'
): {
  canonical: Record<string, any>
  unmapped: Record<string, any>
} {
  const canonical: Record<string, any> = {}
  const unmapped: Record<string, any> = {}

  for (const [rawKey, rawVal] of Object.entries(rawRow)) {
    const canonicalKey = normalizeHeaderToCanonicalKey(rawKey, userType)
    if (canonicalKey) {
      // Don't overwrite if already populated by higher priority match
      if (canonical[canonicalKey] === undefined || canonical[canonicalKey] === '') {
        canonical[canonicalKey] = rawVal
      }
    } else {
      unmapped[rawKey] = rawVal
    }
  }

  return { canonical, unmapped }
}

/**
 * Safely parses any boolean representation from CSV or grid input.
 * Handles 'true', 'false', 'yes', 'no', '1', '0', 'y', 'n', case-insensitively.
 */
export function parseBooleanCell(val: any, defaultVal = false): boolean {
  if (val === undefined || val === null || val === '') return defaultVal
  if (typeof val === 'boolean') return val
  const s = String(val).trim().toLowerCase()
  if (['true', 'yes', '1', 'y'].includes(s)) return true
  if (['false', 'no', '0', 'n'].includes(s)) return false
  return defaultVal
}
