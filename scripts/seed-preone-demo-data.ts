/**
 * PreOne Comprehensive Demo Data Seed Script
 * Scoped strictly to Local Development PostgreSQL and Tenant PreOne (SUNSHINE).
 * Idempotent, relationally consistent, and non-destructive.
 */
import { PrismaClient, UserRole, UserStatus, Gender, Relationship } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/preone',
    },
  },
})

// Configuration & Constants
const EXPECTED_TENANT_ID = '1fac9d27-88a1-4e78-90a4-8a0e38bc744f'
const EXPECTED_TENANT_CODE = 'SUNSHINE'
const EXPECTED_ACADEMIC_SESSION_ID = '8776fb60-9059-42ed-b28d-f04d608636d5'

const BRANCH_MAIN_ID = 'b100d3bd-92cf-4e76-8d6b-7735ac098ebc'
const BRANCH_PUNE_ID = '136a1527-58eb-4b36-be68-57d8e0640111'
const BRANCH_2ND_ID = '624a8bee-3071-4f85-ae48-17fc862b8acc'

const CLASSROOM_PLA_A_ID = 'ee299673-174a-4bca-8273-b5985696958a'
const CLASSROOM_PLA_B_ID = '324f1cc2-e314-4975-9319-6975fa59bbaf'
const CLASSROOM_PG_SEC_ID = 'edd7802c-21a0-4637-bc96-df26c021e151'

const DEMO_PASSWORD = process.env.PREONE_DEMO_PASSWORD || 'PreOne@2026'
const DEMO_PICKUP_PIN = '1234'

// 30 Staff Definition
interface StaffDef {
  email: string
  fullName: string
  role: UserRole
  secondaryRoles: UserRole[]
  branchId: string
  employeeCode: string
  designation: string
  department: string
}

const STAFF_DEFS: StaffDef[] = [
  // MAIN Branch (11 new staff)
  { email: 'principal.main.1@sunshine.demo', fullName: 'Rajesh Sharma', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-001', designation: 'Principal / Center Head', department: 'Leadership' },
  { email: 'principal.main.2@sunshine.demo', fullName: 'Anita Desai', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-002', designation: 'Vice Principal', department: 'Leadership' },
  { email: 'principal.main.3@sunshine.demo', fullName: 'Sanjay Verma', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-003', designation: 'Assistant Principal', department: 'Leadership' },
  { email: 'coordinator.main@sunshine.demo', fullName: 'Pooja Kulkarni', role: 'COORDINATOR', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-004', designation: 'Academic Coordinator', department: 'Academics' },
  { email: 'teacher.main.multirole@sunshine.demo', fullName: 'Meera Nambiar', role: 'TEACHER', secondaryRoles: ['COORDINATOR'], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-005', designation: 'Lead Teacher & Curriculum Coordinator', department: 'Academics' },
  { email: 'staff.main.1@sunshine.demo', fullName: 'Deepak Patil', role: 'STAFF', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-006', designation: 'Operations Associate', department: 'Operations' },
  { email: 'staff.main.2@sunshine.demo', fullName: 'Kavita Joshi', role: 'STAFF', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-007', designation: 'Administrative Assistant', department: 'Operations' },
  { email: 'accounts.main@sunshine.demo', fullName: 'Vikas Nair', role: 'ACCOUNTS', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-008', designation: 'Accounts & Billing Officer', department: 'Finance' },
  { email: 'reception.main@sunshine.demo', fullName: 'Sunita Rao', role: 'RECEPTIONIST', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-009', designation: 'Front Desk Executive', department: 'Front Office' },
  { email: 'attendant.main.1@sunshine.demo', fullName: 'Ramesh Jadhav', role: 'ATTENDANT', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-010', designation: 'Classroom Caregiver', department: 'Support' },
  { email: 'attendant.main.2@sunshine.demo', fullName: 'Shobha Shinde', role: 'ATTENDANT', secondaryRoles: [], branchId: BRANCH_MAIN_ID, employeeCode: 'EMP-2026-011', designation: 'Classroom Caregiver', department: 'Support' },

  // Pune Campus (9 new staff)
  { email: 'principal.pune.1@sunshine.demo', fullName: 'Amitabh Sen', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-012', designation: 'Principal Pune Campus', department: 'Leadership' },
  { email: 'principal.pune.2@sunshine.demo', fullName: 'Ritu Kapoor', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-013', designation: 'Vice Principal', department: 'Leadership' },
  { email: 'principal.pune.3@sunshine.demo', fullName: 'Naveen Reddy', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-014', designation: 'Dean of Students', department: 'Leadership' },
  { email: 'coordinator.pune@sunshine.demo', fullName: 'Swati Saxena', role: 'COORDINATOR', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-015', designation: 'Academic Coordinator', department: 'Academics' },
  { email: 'teacher.pune.1@sunshine.demo', fullName: 'Arjun Das', role: 'TEACHER', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-016', designation: 'Senior Preschool Teacher', department: 'Academics' },
  { email: 'staff.pune.1@sunshine.demo', fullName: 'Manoj More', role: 'STAFF', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-017', designation: 'Facility Supervisor', department: 'Operations' },
  { email: 'staff.pune.2@sunshine.demo', fullName: 'Snehal Jagtap', role: 'STAFF', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-018', designation: 'HR Coordinator', department: 'Operations' },
  { email: 'accounts.pune@sunshine.demo', fullName: 'Pramod Kale', role: 'ACCOUNTS', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-019', designation: 'Senior Accountant', department: 'Finance' },
  { email: 'attendant.pune.1@sunshine.demo', fullName: 'Laxman Gaikwad', role: 'ATTENDANT', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-020', designation: 'Childcare Attendant', department: 'Support' },
  { email: 'attendant.pune.2@sunshine.demo', fullName: 'Meena Kamble', role: 'ATTENDANT', secondaryRoles: [], branchId: BRANCH_PUNE_ID, employeeCode: 'EMP-2026-021', designation: 'Childcare Attendant', department: 'Support' },

  // 2nd Branch (10 new staff)
  { email: 'principal.2nd.1@sunshine.demo', fullName: 'Vivek Oberoi', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-022', designation: 'Principal 2nd Branch', department: 'Leadership' },
  { email: 'principal.2nd.2@sunshine.demo', fullName: 'Priyanka Chopra', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-023', designation: 'Vice Principal', department: 'Leadership' },
  { email: 'principal.2nd.3@sunshine.demo', fullName: 'Karan Johar', role: 'PRINCIPAL', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-024', designation: 'Administrative Head', department: 'Leadership' },
  { email: 'coordinator.2nd@sunshine.demo', fullName: 'Ananya Birla', role: 'COORDINATOR', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-025', designation: 'Academic Coordinator', department: 'Academics' },
  { email: 'staff.2nd.1@sunshine.demo', fullName: 'Girish Kulkarni', role: 'STAFF', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-026', designation: 'Admin Officer', department: 'Operations' },
  { email: 'staff.2nd.2@sunshine.demo', fullName: 'Radhika Apte', role: 'STAFF', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-027', designation: 'Procurement Specialist', department: 'Operations' },
  { email: 'reception.2nd@sunshine.demo', fullName: 'Varun Dhawan', role: 'RECEPTIONIST', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-028', designation: 'Receptionist & Front Office', department: 'Front Office' },
  { email: 'attendant.2nd.1@sunshine.demo', fullName: 'Baburao Apte', role: 'ATTENDANT', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-029', designation: 'Hygiene & Care Attendant', department: 'Support' },
  { email: 'attendant.2nd.2@sunshine.demo', fullName: 'Anuradha Joshi', role: 'ATTENDANT', secondaryRoles: [], branchId: BRANCH_2ND_ID, employeeCode: 'EMP-2026-030', designation: 'Hygiene & Care Attendant', department: 'Support' },
]

// 49 Synthetic Students Definition (STU-2026-0002 to STU-2026-0050)
interface StudentDef {
  admissionNo: string
  firstName: string
  lastName: string
  gender: Gender
  dob: Date
  branchId: string
  classroomId: string
  seatNumber: string
}

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Kabir'
]
const FIRST_NAMES_FEMALE = [
  'Saanvi', 'Aanya', 'Aadhya', 'Aaradhya', 'Ananya', 'Pari', 'Anika', 'Navya',
  'Diya', 'Avani', 'Myra', 'Ira', 'Riya', 'Prisha', 'Anvi'
]
const LAST_NAMES = [
  'Patel', 'Sharma', 'Verma', 'Deshmukh', 'Kulkarni', 'Joshi', 'Patil', 'Shinde',
  'Iyer', 'Menon', 'Nair', 'Reddy', 'Chauhan', 'Gupta', 'Mehta', 'Bhatia', 'Agarwal'
]

function generateStudents(): StudentDef[] {
  const students: StudentDef[] = []
  for (let i = 2; i <= 50; i++) {
    const admissionNo = `STU-2026-${String(i).padStart(4, '0')}`
    const isMale = i % 2 === 0
    const firstName = isMale 
      ? FIRST_NAMES_MALE[(i - 2) % FIRST_NAMES_MALE.length]
      : FIRST_NAMES_FEMALE[(i - 2) % FIRST_NAMES_FEMALE.length]
    const lastName = LAST_NAMES[(i - 2) % LAST_NAMES.length]
    
    // Ages between 3 and 4.5 years old
    const dob = new Date(2022, (i * 3) % 12, (i * 7) % 28 + 1)

    let branchId = BRANCH_MAIN_ID
    let classroomId = CLASSROOM_PLA_A_ID
    let seatNumber = ''

    if (i >= 2 && i <= 18) {
      // PLA-A (17 students, MAIN)
      branchId = BRANCH_MAIN_ID
      classroomId = CLASSROOM_PLA_A_ID
      seatNumber = `PLA-A-${String(i - 1).padStart(3, '0')}`
    } else if (i >= 19 && i <= 35) {
      // PLA-B (17 students, MAIN)
      branchId = BRANCH_MAIN_ID
      classroomId = CLASSROOM_PLA_B_ID
      seatNumber = `PLA-B-${String(i - 18).padStart(3, '0')}`
    } else {
      // PG-SEC-3073 (15 students, 2ND_BRANCH)
      branchId = BRANCH_2ND_ID
      classroomId = CLASSROOM_PG_SEC_ID
      seatNumber = `PG-SEC-3073-${String(i - 34).padStart(3, '0')}`
    }

    students.push({
      admissionNo,
      firstName,
      lastName,
      gender: isMale ? 'MALE' : 'FEMALE',
      dob,
      branchId,
      classroomId,
      seatNumber,
    })
  }
  return students
}

async function main() {
  console.log('=================================================================')
  console.log('🚀 PreOne Demo Data Seed Execution Starting')
  console.log('=================================================================')

  // 1. Stage A: Pre-Flight Safety Checks
  console.log('\n[1/6] Validating Target Environment & Constraints...')
  
  const dbUrl = process.env.DATABASE_URL || ''
  const isLoopback = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost')
  if (!isLoopback) {
    throw new Error(`CRITICAL ABORT: Database URL does not point to a local loopback database: ${dbUrl}`)
  }
  console.log('  ✓ Environment is verified as local loopback PostgreSQL.')

  const tenant = await db.tenant.findUnique({
    where: { id: EXPECTED_TENANT_ID },
  })
  if (!tenant || tenant.code !== EXPECTED_TENANT_CODE) {
    throw new Error(`CRITICAL ABORT: Expected tenant ${EXPECTED_TENANT_CODE} (${EXPECTED_TENANT_ID}) not found!`)
  }
  console.log(`  ✓ Tenant ${tenant.name} (${tenant.code}) verified.`)

  const session = await db.academicSession.findUnique({
    where: { id: EXPECTED_ACADEMIC_SESSION_ID },
  })
  if (!session || session.tenantId !== EXPECTED_TENANT_ID) {
    throw new Error(`CRITICAL ABORT: Academic session ${EXPECTED_ACADEMIC_SESSION_ID} not found or mismatch!`)
  }
  console.log(`  ✓ Academic Session ${session.name} verified.`)

  // Check branches
  const branches = await db.branch.findMany({
    where: { tenantId: EXPECTED_TENANT_ID },
  })
  const branchIds = new Set(branches.map(b => b.id))
  if (!branchIds.has(BRANCH_MAIN_ID) || !branchIds.has(BRANCH_PUNE_ID) || !branchIds.has(BRANCH_2ND_ID)) {
    throw new Error('CRITICAL ABORT: One or more expected branches (MAIN, MB-PUNE, 2ND_BRANCH) missing!')
  }
  console.log(`  ✓ All 3 branches verified.`)

  // Check classrooms
  const classrooms = await db.classroom.findMany({
    where: { tenantId: EXPECTED_TENANT_ID },
  })
  const classroomIds = new Set(classrooms.map(c => c.id))
  if (!classroomIds.has(CLASSROOM_PLA_A_ID) || !classroomIds.has(CLASSROOM_PLA_B_ID) || !classroomIds.has(CLASSROOM_PG_SEC_ID)) {
    throw new Error('CRITICAL ABORT: One or more expected classrooms (PLA-A, PLA-B, PG-SEC-3073) missing!')
  }
  console.log(`  ✓ All 3 classrooms verified.`)

  // Check existing student
  const student1 = await db.student.findUnique({
    where: { tenantId_admissionNo: { tenantId: EXPECTED_TENANT_ID, admissionNo: 'STU-2026-0001' } },
    include: { guardians: true },
  })
  if (!student1) {
    throw new Error('CRITICAL ABORT: Existing student STU-2026-0001 missing!')
  }
  console.log(`  ✓ Existing Student 1 (${student1.firstName} ${student1.lastName || ''}) verified and preserved.`)

  // Check that STU-2026-0002 through 0050 are not colliding with other tenants or corrupt records
  const existingOtherStudents = await db.student.findMany({
    where: {
      tenantId: EXPECTED_TENANT_ID,
      admissionNo: { in: Array.from({ length: 49 }, (_, i) => `STU-2026-${String(i + 2).padStart(4, '0')}`) },
    },
  })
  const isRerun = existingOtherStudents.length > 0
  if (isRerun) {
    console.log(`  ℹ Found ${existingOtherStudents.length} existing demo students. Running in IDEMPOTENT mode.`)
  } else {
    console.log(`  ✓ All 49 target admission numbers (STU-2026-0002..0050) are free for initial insertion.`)
  }

  // 2. Hash Password & PIN Once
  console.log('\n[2/6] Generating cryptographic hashes (bcrypt salt rounds = 10)...')
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const pinHash = await bcrypt.hash(DEMO_PICKUP_PIN, 10)
  console.log('  ✓ Password and pickup PIN hashes generated.')

  // 3. Seed 30 Staff Accounts
  console.log('\n[3/6] Seeding 30 Staff accounts and profiles...')
  let staffCreated = 0
  let staffReused = 0

  for (const s of STAFF_DEFS) {
    let user = await db.user.findUnique({ where: { email: s.email } })
    if (!user) {
      user = await db.user.create({
        data: {
          email: s.email,
          username: s.email.split('@')[0],
          fullName: s.fullName,
          passwordHash,
          phone: `+919833${s.employeeCode.split('-').pop()?.padStart(6, '0') || '000000'}`,
          status: 'ACTIVE',
        },
      })
      staffCreated++
    } else {
      staffReused++
    }

    // TenantUser
    let tenantUser = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: EXPECTED_TENANT_ID, userId: user.id } },
    })
    if (!tenantUser) {
      tenantUser = await db.tenantUser.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          userId: user.id,
          role: s.role,
          roles: s.secondaryRoles.length > 0 ? [s.role, ...s.secondaryRoles] : [s.role],
          branchId: s.branchId,
          status: 'ACTIVE',
        },
      })
    }

    // TenantUserBranch
    const existingTub = await db.tenantUserBranch.findUnique({
      where: {
        tenantUserId_branchId: {
          tenantUserId: tenantUser.id,
          branchId: s.branchId,
        },
      },
    })
    if (!existingTub) {
      await db.tenantUserBranch.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          tenantUserId: tenantUser.id,
          branchId: s.branchId,
          isPrimary: true,
        },
      })
    }

    // StaffProfile
    const existingProfile = await db.staffProfile.findUnique({
      where: { tenantId_userId: { tenantId: EXPECTED_TENANT_ID, userId: user.id } },
    })
    if (!existingProfile) {
      await db.staffProfile.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          userId: user.id,
          branchId: s.branchId,
          employeeCode: s.employeeCode,
          designation: s.designation,
          department: s.department,
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          noticePeriodDays: 60,
        },
      })
    }
  }
  console.log(`  ✓ Staff processed: ${staffCreated} created, ${staffReused} existing reused.`)

  // 4. Seed 49 Students
  console.log('\n[4/6] Seeding 49 Students & Class Allocations...')
  const studentDefs = generateStudents()
  const studentMap = new Map<number, any>() // index -> student record
  let studentsCreated = 0
  let studentsReused = 0

  for (let idx = 2; idx <= 50; idx++) {
    const sDef = studentDefs[idx - 2]
    let student = await db.student.findUnique({
      where: { tenantId_admissionNo: { tenantId: EXPECTED_TENANT_ID, admissionNo: sDef.admissionNo } },
    })

    if (!student) {
      student = await db.student.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          branchId: sDef.branchId,
          admissionNo: sDef.admissionNo,
          firstName: sDef.firstName,
          lastName: sDef.lastName,
          gender: sDef.gender,
          dob: sDef.dob,
          status: 'ACTIVE',
          currentClassroomId: sDef.classroomId,
          seatNumber: sDef.seatNumber,
        },
      })
      studentsCreated++
    } else {
      studentsReused++
    }
    studentMap.set(idx, student)

    // Student Allocation
    const existingAlloc = await db.studentAllocation.findFirst({
      where: {
        tenantId: EXPECTED_TENANT_ID,
        studentId: student.id,
        classroomId: sDef.classroomId,
        academicSessionId: EXPECTED_ACADEMIC_SESSION_ID,
      },
    })
    if (!existingAlloc) {
      await db.studentAllocation.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          studentId: student.id,
          academicSessionId: EXPECTED_ACADEMIC_SESSION_ID,
          classroomId: sDef.classroomId,
          programType: 'PLAYGROUP',
          status: 'ACTIVE',
          reason: 'Direct Enrollment',
          createdById: '3a484602-7155-49ff-a9aa-18d451b356f6', // School Owner
          createdByName: 'School Owner',
        },
      })
    }
  }
  console.log(`  ✓ Students processed: ${studentsCreated} created, ${studentsReused} existing reused.`)

  // 5. Seed 98 Parents (2 per student for Students 2..50)
  console.log('\n[5/6] Seeding 98 Parents & Family Relationships...')
  let parentsCreated = 0
  let parentLinksCreated = 0

  for (let idx = 2; idx <= 50; idx++) {
    const student = studentMap.get(idx)
    const p1Index = 2 * (idx - 2) + 1 // 1..97 (Father)
    const p2Index = 2 * (idx - 2) + 2 // 2..98 (Mother)

    const parentConfigs = [
      {
        idx: p1Index,
        rel: 'FATHER' as Relationship,
        email: `parent.demo.${String(p1Index).padStart(3, '0')}@sunshine.demo`,
        fullName: `${student.firstName}'s Father (${student.lastName})`,
        isPrimary: true,
      },
      {
        idx: p2Index,
        rel: 'MOTHER' as Relationship,
        email: `parent.demo.${String(p2Index).padStart(3, '0')}@sunshine.demo`,
        fullName: `${student.firstName}'s Mother (${student.lastName})`,
        isPrimary: false,
      },
    ]

    for (const pConfig of parentConfigs) {
      let pUser = await db.user.findUnique({ where: { email: pConfig.email } })
      if (!pUser) {
        pUser = await db.user.create({
          data: {
            email: pConfig.email,
            username: pConfig.email.split('@')[0],
            fullName: pConfig.fullName,
            passwordHash,
            phone: `+919811${String(pConfig.idx).padStart(6, '0')}`,
            status: 'ACTIVE',
          },
        })
        parentsCreated++
      }

      // TenantUser
      let pTenantUser = await db.tenantUser.findUnique({
        where: { tenantId_userId: { tenantId: EXPECTED_TENANT_ID, userId: pUser.id } },
      })
      if (!pTenantUser) {
        pTenantUser = await db.tenantUser.create({
          data: {
            tenantId: EXPECTED_TENANT_ID,
            userId: pUser.id,
            role: 'PARENT',
            roles: ['PARENT'],
            branchId: student.branchId,
            status: 'ACTIVE',
          },
        })
      }

      // Guardian record
      let guardian = await db.guardian.findUnique({
        where: { userId: pUser.id },
      })
      if (!guardian) {
        guardian = await db.guardian.create({
          data: {
            tenantId: EXPECTED_TENANT_ID,
            userId: pUser.id,
            fullName: pConfig.fullName,
            email: pConfig.email,
            phone: `+919811${String(pConfig.idx).padStart(6, '0')}`,
            relationship: pConfig.rel,
            isPrimaryContact: pConfig.isPrimary,
          },
        })
      }

      // StudentGuardian link
      const existingLink = await db.studentGuardian.findUnique({
        where: {
          studentId_guardianId: {
            studentId: student.id,
            guardianId: guardian.id,
          },
        },
      })
      if (!existingLink) {
        await db.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            relationship: pConfig.rel,
            isPrimary: pConfig.isPrimary,
            canPickup: false,
            pickupStatus: 'NOT_AUTHORIZED',
            pickupPin: null,
            isFeePayer: true,
            receivesComm: true,
          },
        })
        parentLinksCreated++
      }
    }
  }
  console.log(`  ✓ Parents processed: ${parentsCreated} created, ${parentLinksCreated} links established.`)

  // 6. Seed 100 Guardians (2 per student for 2..48, 3 per student for 49..50)
  console.log('\n[6/6] Seeding 100 Guardians & Pickup Security Permissions...')
  let guardiansCreated = 0
  let guardianLinksCreated = 0

  // Build guardian assignment plan
  const guardianAssignments: { guardianNum: number; studentIndex: number }[] = []
  let gNum = 1

  // Students 2..48 get 2 each
  for (let sIdx = 2; sIdx <= 48; sIdx++) {
    guardianAssignments.push({ guardianNum: gNum++, studentIndex: sIdx })
    guardianAssignments.push({ guardianNum: gNum++, studentIndex: sIdx })
  }
  // Student 49 gets 3
  guardianAssignments.push({ guardianNum: gNum++, studentIndex: 49 })
  guardianAssignments.push({ guardianNum: gNum++, studentIndex: 49 })
  guardianAssignments.push({ guardianNum: gNum++, studentIndex: 49 })
  // Student 50 gets 3
  guardianAssignments.push({ guardianNum: gNum++, studentIndex: 50 })
  guardianAssignments.push({ guardianNum: gNum++, studentIndex: 50 })
  guardianAssignments.push({ guardianNum: gNum++, studentIndex: 50 })

  for (const gAssign of guardianAssignments) {
    const student = studentMap.get(gAssign.studentIndex)
    const isAuthorized = gAssign.guardianNum <= 30
    const email = `guardian.demo.${String(gAssign.guardianNum).padStart(3, '0')}@sunshine.demo`
    const fullName = `Guardian Demo ${String(gAssign.guardianNum).padStart(3, '0')} (${student.firstName}'s Guardian)`

    let gUser = await db.user.findUnique({ where: { email } })
    if (!gUser) {
      gUser = await db.user.create({
        data: {
          email,
          username: email.split('@')[0],
          fullName,
          passwordHash,
          phone: `+919822${String(gAssign.guardianNum).padStart(6, '0')}`,
          status: 'ACTIVE',
        },
      })
      guardiansCreated++
    }

    // TenantUser
    let gTenantUser = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: EXPECTED_TENANT_ID, userId: gUser.id } },
    })
    if (!gTenantUser) {
      gTenantUser = await db.tenantUser.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          userId: gUser.id,
          role: 'GUARDIAN',
          roles: ['GUARDIAN'],
          branchId: student.branchId,
          status: 'ACTIVE',
        },
      })
    }

    // Guardian record
    let guardian = await db.guardian.findUnique({
      where: { userId: gUser.id },
    })
    if (!guardian) {
      guardian = await db.guardian.create({
        data: {
          tenantId: EXPECTED_TENANT_ID,
          userId: gUser.id,
          fullName,
          email,
          phone: `+919822${String(gAssign.guardianNum).padStart(6, '0')}`,
          relationship: 'GUARDIAN',
          isPrimaryContact: false,
          pickupPin: isAuthorized ? pinHash : null,
        },
      })
    }

    // StudentGuardian link
    const existingGLink = await db.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: student.id,
          guardianId: guardian.id,
        },
      },
    })
    if (!existingGLink) {
      await db.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          relationship: 'GUARDIAN',
          isPrimary: false,
          canPickup: isAuthorized,
          pickupStatus: isAuthorized ? 'AUTHORIZED' : 'NOT_AUTHORIZED',
          pickupPin: isAuthorized ? pinHash : null,
          isFeePayer: false,
          receivesComm: true,
        },
      })
      guardianLinksCreated++
    }
  }
  console.log(`  ✓ Guardians processed: ${guardiansCreated} created, ${guardianLinksCreated} links established.`)

  console.log('\n=================================================================')
  console.log('🎉 PreOne Demo Data Seed Execution Successfully Completed!')
  console.log('=================================================================')
}

main()
  .catch((e) => {
    console.error('\n❌ SEED EXECUTION FAILED WITH ERROR:\n', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
