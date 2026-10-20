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
  // ── 1. Basic Identity & Placement Information ──
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
    key: 'password',
    label: 'Initial Password',
    dataType: 'string',
    userType: 'STAFF',
    required: false,
    importable: true,
    exportable: false,
    sensitive: true,
    securityRule: 'Initial account password; validated, encrypted, and hashed server-side, strictly excluded from export',
    placeholder: 'Min 8 chars, 1 upper, 1 number',
    width: '160px',
    aliases: ['password', 'initialpassword', 'initial_password', 'staffpassword', 'staff_password', 'temp_password', 'pass', 'pwd'],
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
    label: 'Full Name',
    dataType: 'string',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Ramesh Joshi',
    width: '180px',
    aliases: ['fullname', 'full_name', 'name', 'parentname', 'parent_name', 'caregivername', 'caregiver_name'],
  },
  {
    key: 'username',
    label: 'Portal Username',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'ramesh.joshi',
    width: '130px',
    aliases: ['username', 'user_name', 'login', 'login_id', 'userid', 'portalusername', 'portal_username'],
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
    placeholder: 'ramesh@example.com',
    width: '180px',
    aliases: ['email', 'emailaddress', 'email_address', 'mail', 'parentemail', 'parent_email'],
  },
  {
    key: 'phone',
    label: 'Mobile Phone',
    dataType: 'phone',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    placeholder: '+91 98765 43210',
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
    aliases: ['role', 'userrole', 'user_role', 'caregiver_role', 'family_role'],
  },
  {
    key: 'relationship',
    label: 'Relationship to Child',
    dataType: 'enum',
    userType: 'FAMILY',
    required: true,
    importable: true,
    exportable: true,
    width: '160px',
    options: [
      'FATHER',
      'MOTHER',
      'STEP_PARENT',
      'GRANDPARENT',
      'UNCLE_AUNT',
      'LEGAL_GUARDIAN',
      'NANNY_CARETAKER',
      'SIBLING',
      'OTHER',
    ],
    aliases: ['relationship', 'relation', 'relationtochild', 'relation_to_child', 'kinship', 'relationshiptochild'],
  },
  {
    key: 'occupation',
    label: 'Profession / Occupation',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. Software Engineer, Architect',
    width: '180px',
    aliases: ['occupation', 'profession', 'job', 'designation', 'employment'],
  },
  {
    key: 'isPrimaryContact',
    label: 'Primary Emergency Contact',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '150px',
    options: ['YES', 'NO'],
    aliases: ['isprimarycontact', 'is_primary_contact', 'isprimary', 'is_primary', 'primarycontact', 'primary_contact', 'emergencycontact', 'primary_emergency_contact', 'primaryemergencycontact'],
  },
  {
    key: 'canPickup',
    label: 'Authorized for Campus Pickup',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '170px',
    options: ['YES', 'NO'],
    aliases: ['canpickup', 'can_pickup', 'pickupauthorized', 'pickup_authorized', 'authorizedpickup', 'authorized_pickup', 'authorizedforcampuspickup'],
  },
  {
    key: 'receivesComm',
    label: 'Receive Broadcasts & Alerts',
    dataType: 'boolean',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    width: '170px',
    options: ['YES', 'NO'],
    aliases: ['receivescomm', 'receives_comm', 'receivescommunication', 'receives_communication', 'communication', 'get_notified', 'broadcasts', 'alerts', 'receivebroadcastsandalerts'],
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
    label: 'Pickup Security PIN',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false, // Strict child security rule: Gate release PIN is strictly excluded from export
    sensitive: true,
    securityRule: 'Child gate release PIN: strictly excluded from CSV export',
    placeholder: 'e.g. 4821',
    width: '140px',
    aliases: ['pickuppin', 'pickup_pin', 'gatepin', 'gate_pin', 'pin', 'pickupsecuritypin'],
  },
  {
    key: 'studentAdmissionNo',
    label: 'Student Admission No',
    dataType: 'relation',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: true,
    placeholder: 'e.g. PRE-2026-0042',
    width: '160px',
    aliases: ['studentadmissionno', 'student_admission_no', 'admissionno', 'admission_no', 'student_id', 'admission_number', 'childadmissionno', 'child_admission_no'],
  },
  {
    key: 'studentName',
    label: 'Student Name',
    dataType: 'string',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'e.g. Aarav Joshi',
    width: '160px',
    aliases: ['studentname', 'student_name', 'childname', 'child_name', 'childfirstname', 'child_first_name'],
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
    width: '140px',
    aliases: ['studentdateofbirth', 'student_date_of_birth', 'studentdob', 'student_dob', 'childdob', 'child_dob', 'dob'],
  },
  {
    key: 'studentGender',
    label: 'Student Gender',
    dataType: 'enum',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    width: '120px',
    options: ['MALE', 'FEMALE', 'OTHER'],
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
    label: 'Campus Branch',
    dataType: 'relation',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'MAIN',
    width: '120px',
    aliases: ['studentbranch', 'student_branch', 'childbranch', 'child_branch', 'branchcode', 'branch_code', 'branch', 'campus'],
  },
  {
    key: 'studentClass',
    label: 'Classroom / Section',
    dataType: 'relation',
    userType: 'FAMILY',
    required: false,
    importable: true,
    exportable: false,
    placeholder: 'NUR-A',
    width: '140px',
    aliases: ['studentclass', 'student_class', 'childclass', 'child_class', 'studentclassroom', 'student_classroom', 'classroomcode', 'classroom_code', 'classroom', 'section'],
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
    options: ['ACTIVE', 'PENDING'],
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

/**
 * Authoritative set of HR and employment-specific fields
 * that are governed and maintained exclusively within the HR Module.
 */
export const HR_FIELD_ALIASES: Record<string, string[]> = {
  designation: ['designation', 'title', 'jobtitle', 'job_title', 'position'],
  department: ['department', 'dept', 'division', 'functional_area'],
  qualification: ['qualification', 'education', 'highest_qualification', 'degree', 'credentials'],
  employmentType: ['employmenttype', 'employment_type', 'contracttype', 'contract_type', 'job_type'],
  noticePeriodDays: ['noticeperioddays', 'notice_period_days', 'noticeperiod', 'notice_period'],
  joiningDate: ['joiningdate', 'joining_date', 'dateofjoining', 'date_of_joining', 'doj', 'hiredate', 'hire_date', 'startdate', 'start_date'],
  dateOfBirth: ['dateofbirth', 'date_of_birth', 'dob', 'birthdate', 'birth_date'],
  gender: ['gender', 'sex'],
  maritalStatus: ['maritalstatus', 'marital_status', 'marriage_status'],
  bloodGroup: ['bloodgroup', 'blood_group', 'bloodtype', 'blood_type'],
  emergencyContactName: ['emergencycontactname', 'emergency_contact_name', 'emergencyname', 'emergency_name', 'kin_name'],
  emergencyContactPhone: ['emergencycontactphone', 'emergency_contact_phone', 'emergencyphone', 'emergency_phone', 'kin_phone', 'emergency_mobile'],
  currentAddress: ['currentaddress', 'current_address', 'address', 'residentialaddress', 'residential_address', 'street_address'],
  permanentAddress: ['permanentaddress', 'permanent_address', 'hometown_address'],
  panNumber: ['pannumber', 'pan_number', 'pan', 'pancard', 'pan_card'],
  aadhaarNumber: ['aadhaarnumber', 'aadhaar_number', 'aadhaar', 'adhar', 'uidai'],
  uanNumber: ['uannumber', 'uan_number', 'uan', 'epf_uan'],
  esiNumber: ['esinumber', 'esi_number', 'esi', 'esic'],
  salary: ['salary', 'basicsalary', 'basic_salary', 'ctc', 'gross_salary', 'pay'],
}

/**
 * Detects whether a header corresponds to an HR-managed field.
 */
export function isHrFieldHeader(header: string): { isHr: boolean; fieldName?: string } {
  if (!header || typeof header !== 'string') return { isHr: false }
  const cleaned = header
    .replace(/^["']|["']$/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')

  for (const [key, aliases] of Object.entries(HR_FIELD_ALIASES)) {
    if (key.toLowerCase() === cleaned) {
      return { isHr: true, fieldName: key }
    }
    if (aliases.some((a) => a.replace(/[\s\-_]+/g, '').toLowerCase() === cleaned)) {
      return { isHr: true, fieldName: key }
    }
  }

  return { isHr: false }
}
