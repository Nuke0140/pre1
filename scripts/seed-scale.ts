/**
 * Full-scale demo seed: 100 schools, ~10,000 students, 3 academic years
 * (2024-25, 2025-26, 2026-27 current) with data in every model.
 *
 * Usage: npx tsx scripts/seed-scale.ts   (WIPES the database first)
 * Login: school code S001..S100, identifier owner.s001@preone.demo, password Preone@123
 *        parents: parent.<n>@preone.demo, same password
 */
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const db = new PrismaClient()
const SCHOOLS = Number(process.env.SCHOOLS ?? 100)
const STUDENTS = SCHOOLS * 100
const TODAY = new Date(); TODAY.setUTCHours(0, 0, 0, 0)
const PASSWORD = 'Preone@123'

// ── deterministic rng ──
let seed = 42
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!
const chance = (p: number) => rnd() < p
const id = () => randomUUID()
const pad = (n: number, w = 4) => String(n).padStart(w, '0')
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
const between = (a: Date, b: Date) => new Date(a.getTime() + rnd() * (b.getTime() - a.getTime()))
const minD = (a: Date, b: Date) => (a < b ? a : b)

const FIRST_M = ['Aarav', 'Vihaan', 'Arjun', 'Reyansh', 'Kabir', 'Advik', 'Ishaan', 'Vivaan', 'Ayaan', 'Rudra', 'Atharv', 'Dhruv', 'Krishna', 'Shaurya', 'Yash', 'Rohan', 'Aditya', 'Rahul', 'Vikram', 'Sanjay']
const FIRST_F = ['Aadhya', 'Ananya', 'Diya', 'Saanvi', 'Myra', 'Kiara', 'Anika', 'Pari', 'Ira', 'Navya', 'Riya', 'Sara', 'Meera', 'Kavya', 'Priya', 'Sneha', 'Pooja', 'Neha', 'Divya', 'Anjali']
const LAST = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Patel', 'Gupta', 'Mehta', 'Rao', 'Joshi', 'Kulkarni', 'Desai', 'Shah', 'Menon', 'Pillai', 'Chopra', 'Malhotra', 'Bose', 'Das', 'Singh']
const CITIES = [['Bengaluru', 'Karnataka'], ['Mumbai', 'Maharashtra'], ['Pune', 'Maharashtra'], ['Delhi', 'Delhi'], ['Hyderabad', 'Telangana'], ['Chennai', 'Tamil Nadu'], ['Kolkata', 'West Bengal'], ['Ahmedabad', 'Gujarat'], ['Jaipur', 'Rajasthan'], ['Kochi', 'Kerala']] as const
const SCHOOL_WORDS = ['Sunshine', 'Little Stars', 'Rainbow', 'Tiny Tots', 'Bright Minds', 'Kidzee', 'Blossom', 'Happy Feet', 'Wonderland', 'Butterfly', 'Giggles', 'Sprouts', 'Twinkle', 'Bumblebee', 'Pebbles']
const PROGRAMS = [
  { t: 'PLAYGROUP', min: 18, max: 30 }, { t: 'NURSERY', min: 30, max: 42 }, { t: 'LKG', min: 42, max: 54 },
  { t: 'UKG', min: 54, max: 66 }, { t: 'DAYCARE', min: 12, max: 72 },
] as const
const PROG_ORDER = ['PLAYGROUP', 'NURSERY', 'LKG', 'UKG'] as const
const SESSIONS = [
  { name: '2024-25', start: new Date('2024-06-03'), end: new Date('2025-03-31') },
  { name: '2025-26', start: new Date('2025-06-02'), end: new Date('2026-03-31') },
  { name: '2026-27', start: new Date('2026-06-01'), end: new Date('2027-03-31') },
]
const schoolDays = SESSIONS.map(s => { const out: Date[] = []; for (let d = s.start; d <= minD(s.end, TODAY); d = addDays(d, 1)) if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(d); return out })
const phone = () => '+91' + int(70000, 99999) + int(10000, 99999)
const personName = (g = chance(0.5) ? 'M' : 'F') => `${pick(g === 'M' ? FIRST_M : FIRST_F)} ${pick(LAST)}`

// ── schema metadata: topo order + autofill for required scalars ──
const MODELS = Prisma.dmmf.datamodel.models
const ENUMS = Object.fromEntries(Prisma.dmmf.datamodel.enums.map(e => [e.name, e.values.map(v => v.name)]))
const ORDER: string[] = (() => {
  const deps = new Map(MODELS.map(m => [m.name, new Set(m.fields.filter(f => f.kind === 'object' && f.relationFromFields?.length && f.type !== m.name).map(f => f.type))]))
  const out: string[] = []; const seen = new Set<string>()
  const visit = (n: string) => { if (seen.has(n)) return; seen.add(n); deps.get(n)!.forEach(visit); out.push(n) }
  MODELS.forEach(m => visit(m.name)); return out
})()
const delegate = (m: string) => m[0]!.toLowerCase() + m.slice(1)
function autofill(model: string, row: any) {
  const m = MODELS.find(x => x.name === model)!
  for (const f of m.fields) {
    if (f.kind === 'object' || row[f.name] !== undefined || !f.isRequired || f.hasDefaultValue || f.isUpdatedAt) continue
    if (f.kind === 'enum') row[f.name] = ENUMS[f.type]![0]
    else row[f.name] = ({ String: `${f.name}-${int(1000, 9999)}`, Int: 1, Float: 1, Decimal: 1, Boolean: false, DateTime: TODAY, Json: {} } as any)[f.type]
  }
  if (!row.id && m.fields.some(f => f.name === 'id')) row.id = id()
  return row
}

let buf: Record<string, any[]> = {}
const put = (model: string, row: any) => { (buf[model] ??= []).push(autofill(model, row)); return row }
const totals: Record<string, number> = {}
async function flush() {
  for (const m of ORDER) {
    const rows = buf[m]; if (!rows?.length) continue
    for (let i = 0; i < rows.length; i += 4000) await (db as any)[delegate(m)].createMany({ data: rows.slice(i, i + 4000) })
    totals[m] = (totals[m] ?? 0) + rows.length
  }
  buf = {}
}

// ── per-school generator ──
async function seedSchool(n: number, studentCount: number, hash: string, parentCounter: { n: number }) {
  const code = 'S' + pad(n, 3)
  const [city, state] = pick(CITIES)
  const tenantId = id()
  const createdAt = new Date('2024-04-01')
  put('Tenant', { id: tenantId, name: `${pick(SCHOOL_WORDS)} Preschool ${city} #${n}`, code, type: n % 10 === 0 ? 'CHAIN' : 'SCHOOL', status: 'ACTIVE', subscriptionPlan: pick(['STARTER', 'PRO', 'ENTERPRISE']), maxBranches: 5, maxStudents: 1000, city, state, pincode: String(int(400000, 699999)), phone: phone(), email: `hello@${code.toLowerCase()}.demo`, academicYearStartMonth: 6, timezone: 'Asia/Kolkata', onboardingStep: 5, onboardedAt: createdAt, createdAt })

  const nb = chance(0.6) ? 1 : chance(0.75) ? 2 : 3
  const branches = Array.from({ length: nb }, (_, i) => put('Branch', { id: id(), tenantId, name: `${city} ${['Main', 'East', 'West'][i]} Campus`, code: ['MAIN', 'EAST', 'WEST'][i], city, state, phone: phone(), capacity: 300, isMain: i === 0, createdAt }))
  const B = () => pick(branches).id

  // users & staff
  const tenantUsers: any[] = []; const staff: any[] = []
  const mkStaff = (role: string, designation: string, branchId: string | null, idx: number) => {
    const g = chance(0.8) ? 'F' : 'M'; const fullName = personName(g)
    const email = role === 'OWNER' ? `owner.${code.toLowerCase()}@preone.demo` : `${role.toLowerCase()}${idx}.${code.toLowerCase()}@preone.demo`
    const user = put('User', { id: id(), email, username: email.split('@')[0], phone: phone(), passwordHash: hash, fullName, status: 'ACTIVE', mustChangePassword: false, lastLoginAt: between(addDays(TODAY, -30), TODAY), createdAt })
    const tu = put('TenantUser', { id: id(), tenantId, userId: user.id, role, roles: [role], branchId, status: 'ACTIVE', createdAt })
    tenantUsers.push(tu)
    put('TenantUserBranch', { tenantUserId: tu.id, tenantId, branchId: branchId ?? branches[0]!.id, isPrimary: true })
    const joining = between(new Date('2023-01-01'), new Date('2026-06-01'))
    const sp = put('StaffProfile', { id: id(), tenantId, userId: user.id, branchId, employeeCode: `EMP-${pad(staff.length + 1)}`, designation, department: role === 'TEACHER' || role === 'HELPER' ? 'Academics' : role === 'DRIVER' || role === 'ATTENDANT' ? 'Transport' : 'Administration', qualification: pick(['B.Ed', 'ECCE Diploma', 'B.A.', 'M.A.', 'B.Com']), joiningDate: joining, employmentType: pick(['FULL_TIME', 'FULL_TIME', 'PART_TIME', 'CONTRACT']), emergencyContactName: personName(), emergencyContactPhone: phone(), dateOfBirth: between(new Date('1975-01-01'), new Date('2000-01-01')), gender: g === 'F' ? 'FEMALE' : 'MALE', bloodGroup: pick(ENUMS.BloodGroup!), currentAddress: `${int(1, 500)}, ${city}`, noticePeriodDays: 30, createdAt })
    const s = { user, tu, sp, role, branchId: branchId ?? branches[0]!.id, joining }; staff.push(s); return s
  }
  const owner = mkStaff('OWNER', 'Director', null, 1)
  const principal = mkStaff('PRINCIPAL', 'Principal', branches[0]!.id, 1)
  const accountant = mkStaff('ACCOUNTANT', 'Accountant', branches[0]!.id, 1)
  const reception = mkStaff('RECEPTIONIST', 'Front Office', branches[0]!.id, 1)
  const hr = mkStaff('HR', 'HR Executive', branches[0]!.id, 1)
  const teachers = branches.flatMap((b, bi) => Array.from({ length: 6 }, (_, i) => mkStaff('TEACHER', i === 0 ? 'Head Teacher' : 'Teacher', b.id, bi * 10 + i + 1)))
  branches.forEach((b, bi) => { mkStaff('HELPER', 'Caretaker', b.id, bi * 10 + 1); mkStaff('COORDINATOR', 'Coordinator', b.id, bi * 10 + 1) })
  const drivers = branches.map((b, bi) => mkStaff('DRIVER', 'Driver', b.id, bi + 1))
  const attendants = branches.map((b, bi) => mkStaff('ATTENDANT', 'Bus Attendant', b.id, bi + 1))
  staff.slice(1).forEach(s => (s.sp.reportingManagerId = principal.sp.id))
  for (const s of staff.slice(0, 5)) for (let i = 0; i < 2; i++) put('UserSession', { userId: s.user.id, tenantId, tokenHash: randomUUID().replace(/-/g, ''), device: pick(['Chrome on Windows', 'Safari on iPhone', 'Chrome on Android']), platform: pick(['web', 'ios', 'android']), ipAddress: `10.0.${int(0, 255)}.${int(1, 254)}`, expiresAt: addDays(TODAY, 7), lastActiveAt: addDays(TODAY, -i) })

  // custom roles + invitations
  const roles = ['Vice Principal', 'Admissions Lead', 'Store Keeper'].map((name, i) => put('CustomRole', { id: id(), tenantId, name, code: `CR${i + 1}`, capabilities: ['students.read', 'reports.read'], status: 'ACTIVE' }))
  roles.forEach((r, i) => put('TenantUserCustomRole', { tenantUserId: teachers[i]!.tu.id, customRoleId: r.id, assignedById: owner.user.id }))
  for (let i = 0; i < 2; i++) { const s = teachers[teachers.length - 1 - i]!; put('UserInvitation', { tenantId, userId: s.user.id, tenantUserId: s.tu.id, invitedById: owner.user.id, email: s.user.email, role: 'TEACHER', tokenHash: randomUUID(), status: pick(['ACCEPTED', 'PENDING']), expiresAt: addDays(TODAY, 7) }) }

  // setup & config
  put('SchoolSetup', { tenantId, status: 'LIVE', startedAt: createdAt, goLiveAt: addDays(createdAt, 20), goLiveByName: owner.user.fullName, lastValidationAt: addDays(createdAt, 19) })
  for (const k of ['school_profile', 'branches', 'programs', 'academic_session', 'classrooms', 'fees', 'staff', 'students']) put('SchoolSetupStep', { tenantId, stepKey: k, status: 'COMPLETE', applicability: 'MANDATORY', completedById: owner.user.id, completedByName: owner.user.fullName, completedAt: addDays(createdAt, int(1, 18)) })
  put('SchoolSetupValidationRun', { tenantId, kind: 'SETUP_VALIDATION', overall: 'WARNING', result: { warnings: 2 }, runById: owner.user.id, runByName: owner.user.fullName, createdAt: addDays(createdAt, 15) })
  put('SchoolSetupValidationRun', { tenantId, kind: 'GO_LIVE_CHECK', overall: 'PASS', result: { warnings: 0 }, runById: owner.user.id, runByName: owner.user.fullName, createdAt: addDays(createdAt, 19) })
  for (const domain of ['OPERATING', 'ADMISSION', 'FINANCE', 'COMMUNICATION', 'BRANDING']) put('SchoolConfig', { tenantId, domain, data: { configured: true, timezone: 'Asia/Kolkata' }, updatedById: owner.user.id, updatedByName: owner.user.fullName })
  const templates = [['REPORT_CARD', 'Term Report Card'], ['ID_CARD', 'Student ID Card'], ['BONAFIDE', 'Bonafide Certificate'], ['RECEIPT', 'Fee Receipt']].map(([type, name]) => put('DocumentTemplate', { id: id(), tenantId, type, name, content: { blocks: [{ type: 'heading', text: name }] }, isDefault: true }))

  // programs, subjects, facilities
  const programs = PROGRAMS.map(p => put('Program', { id: id(), tenantId, code: p.t, name: p.t[0] + p.t.slice(1).toLowerCase(), programType: p.t, ageMinMonths: p.min, ageMaxMonths: p.max, durationMonths: 12, capacity: 40 }))
  programs.forEach(p => branches.forEach((b, i) => put('ProgramBranch', { tenantId, programId: p.id, branchId: b.id, capacity: 40, displayOrder: i })))
  const subjects = [['ENG', 'English', 'CORE'], ['MATH', 'Numeracy', 'CORE'], ['EVS', 'Environment', 'CORE'], ['ART', 'Art & Craft', 'ACTIVITY'], ['MUS', 'Music', 'ACTIVITY'], ['HIN', 'Hindi', 'OPTIONAL']].map(([c, nm, t]) => put('Subject', { id: id(), tenantId, code: c, name: nm, shortName: c, subjectType: t }))
  programs.forEach(p => subjects.slice(0, 4).forEach(s => put('ProgramSubject', { tenantId, programId: p.id, subjectId: s.id })))
  const facilities = branches.flatMap(b => (['CLASSROOM', 'CLASSROOM', 'PLAY_AREA', 'NAP_AREA', 'MEAL_AREA', 'MEDICAL'] as const).map((t, i) => put('Facility', { id: id(), tenantId, branchId: b.id, type: t, name: `${t.replace('_', ' ')} ${i + 1}`, code: `${b.code}-F${i + 1}`, capacity: 25, floorOrArea: `Floor ${int(0, 2)}` })))

  // sessions, classrooms
  const sessions = SESSIONS.map((s, i) => put('AcademicSession', { id: id(), tenantId, name: s.name, startDate: s.start, endDate: s.end, status: i === 2 ? 'ACTIVE' : 'CLOSED', isCurrent: i === 2 }))
  const classrooms: Record<string, any> = {} // `${si}|${branch}|${prog}`
  sessions.forEach((s, si) => branches.forEach((b, bi) => programs.forEach((p, pi) => {
    const t = teachers[bi * 6 + (pi % 6)]!
    classrooms[`${si}|${b.id}|${p.programType}`] = put('Classroom', { id: id(), tenantId, academicSessionId: s.id, branchId: b.id, programId: p.id, programType: p.programType, facilityId: facilities.find(f => f.branchId === b.id && f.type === 'CLASSROOM')?.id, primaryTeacherId: t.user.id, name: `${p.name} ${['A', 'B', 'C'][bi]} ${SESSIONS[si]!.name}`, code: `${p.code}-${b.code}-${SESSIONS[si]!.name}`, capacity: 30, ageBandMinMonths: PROGRAMS[pi]!.min, ageBandMaxMonths: PROGRAMS[pi]!.max })
  })))
  Object.values(classrooms).forEach(c => subjects.slice(0, 3).forEach((s, i) => put('ClassroomSubject', { tenantId, classroomId: c.id, subjectId: s.id, specialistTeacherId: i === 2 ? teachers[0]!.user.id : null })))

  // curriculum
  const goalsByProg: Record<string, any[]> = {}; const curriculaByKey: Record<string, any> = {}
  sessions.forEach((s, si) => programs.forEach(p => {
    const cur = put('Curriculum', { id: id(), tenantId, academicSessionId: s.id, programId: p.id, programType: p.programType, name: `${p.name} Curriculum ${s.name}`, framework: 'NCF', status: si === 2 ? 'ACTIVE' : 'ARCHIVED', effectiveFrom: s.startDate, effectiveTo: s.endDate })
    curriculaByKey[`${si}|${p.programType}`] = cur
    const goals = ['Language', 'Numeracy', 'Motor Skills', 'Social-Emotional'].flatMap((area, ai) => {
      const la = put('CurriculumLearningArea', { id: id(), tenantId, curriculumId: cur.id, name: area, code: `LA${ai + 1}`, displayOrder: ai })
      return [1, 2, 3].map(g => put('LearningGoal', { id: id(), tenantId, curriculumLearningAreaId: la.id, name: `${area} goal ${g}`, description: `Child demonstrates ${area.toLowerCase()} skill ${g}`, displayOrder: g }))
    })
    goalsByProg[`${si}|${p.programType}`] = goals
  }))
  for (const p of programs) put('WeeklyThemeTemplate', { tenantId, name: `${p.name} themes`, theme: pick(['Animals', 'Seasons', 'Colours', 'My Family', 'Transport']), programType: p.programType, activities: [{ day: 'Mon', title: 'Circle time' }, { day: 'Wed', title: 'Story telling' }], isDefault: true })

  // fees
  const heads = (['TUITION', 'ADMISSION', 'TRANSPORT', 'MEAL', 'ACTIVITY', 'MATERIALS'] as const).map((c, i) => put('FeeHead', { id: id(), tenantId, name: c[0] + c.slice(1).toLowerCase(), code: c, category: c, sortOrder: i }))
  const tuitionBase = int(25, 60) * 1000_00
  for (const p of programs) {
    const plan = put('FeePlan', { id: id(), tenantId, name: `${p.name} Annual Plan`, programType: p.programType, totalAnnualCents: tuitionBase + 15000_00, installmentCount: 4 })
    put('FeePlanItem', { feePlanId: plan.id, feeHeadId: heads[0]!.id, feeHead: 'TUITION', label: 'Tuition', amountCents: tuitionBase / 4, frequency: 'QUARTERLY' })
    put('FeePlanItem', { feePlanId: plan.id, feeHeadId: heads[1]!.id, feeHead: 'ADMISSION', label: 'Admission', amountCents: 10000_00, frequency: 'ONE_TIME' })
    put('FeePlanItem', { feePlanId: plan.id, feeHeadId: heads[5]!.id, feeHead: 'MATERIALS', label: 'Materials', amountCents: 5000_00, frequency: 'ANNUALLY' })
  }
  const feeItems: Record<string, { tuition: any; admission: any; deposit: any; structure: any }> = {}
  sessions.forEach((s, si) => programs.forEach(p => {
    const fs = put('FeeStructure', { id: id(), tenantId, academicSessionId: s.id, programId: p.id, programType: p.programType, name: `${p.name} ${s.name}`, status: si === 2 ? 'ACTIVE' : 'ARCHIVED', effectiveFrom: s.startDate, effectiveTo: s.endDate, createdById: accountant.user.id })
    const amt = Math.round(tuitionBase * (1 + 0.08 * si) / 4 / 100) * 100
    feeItems[`${si}|${p.programType}`] = {
      structure: fs,
      tuition: put('FeeItem', { id: id(), tenantId, feeStructureId: fs.id, feeHeadId: heads[0]!.id, name: 'Tuition Fee', amountCents: amt, frequency: 'QUARTERLY', lateFeeApplicable: true, lateFeeAmountCents: 500_00, sortOrder: 0 }),
      admission: put('FeeItem', { id: id(), tenantId, feeStructureId: fs.id, feeHeadId: heads[1]!.id, name: 'Admission Fee', amountCents: 10000_00, frequency: 'ONE_TIME', sortOrder: 1 }),
      deposit: put('FeeItem', { id: id(), tenantId, feeStructureId: fs.id, name: 'Security Deposit', feeType: 'REFUNDABLE_DEPOSIT', amountCents: 5000_00, frequency: 'ONE_TIME', isRefundable: true, sortOrder: 2 }),
    }
  }))

  // calendar & announcements
  sessions.forEach((s, si) => {
    for (const [d, t, title] of [[15, 'PARENT_MEETING', 'PTM'], [60, 'EVENT', 'Annual Day'], [120, 'HOLIDAY', 'Diwali Break'], [150, 'ASSESSMENT', 'Term Assessment'], [200, 'SPECIAL_DAY', 'Sports Day'], [240, 'VACATION', 'Winter Break']] as const)
      put('CalendarEvent', { tenantId, academicSessionId: s.id, branchId: chance(0.5) ? B() : null, date: addDays(SESSIONS[si]!.start, d + int(0, 10)), type: t, title })
  })
  for (let i = 0; i < 40; i++) { const at = between(SESSIONS[0]!.start, TODAY); put('Announcement', { tenantId, branchId: chance(0.5) ? B() : null, title: pick(['Holiday notice', 'Fee reminder', 'Annual day', 'Picnic', 'PTM schedule', 'Health camp']), body: 'Dear parents, please note the details shared by the school office.', type: pick(ENUMS.AnnouncementType!), audience: pick(ENUMS.AudienceType!), status: chance(0.9) ? 'PUBLISHED' : 'DRAFT', authorId: principal.user.id, publishedAt: at, createdAt: at }) }

  // ── students across 3 sessions ──
  const students: any[] = []
  const enrolBySession: any[][] = [[], [], []]
  for (let i = 0; i < studentCount; i++) {
    const startSi = i < studentCount * 0.35 ? 0 : i < studentCount * 0.65 ? 1 : 2
    const daycare = chance(0.1)
    const progIdx = daycare ? -1 : startSi === 2 ? int(0, 3) : int(0, 2)
    const branch = pick(branches)
    const g = chance(0.5) ? 'MALE' : 'FEMALE'
    const admissionDate = between(addDays(SESSIONS[startSi]!.start, -60), addDays(SESSIONS[startSi]!.start, 30))
    const ageMonths = daycare ? int(14, 60) : PROGRAMS[progIdx]!.min + int(0, 10)
    // years enrolled: continue each year with 85% retention until UKG done
    const spans: { si: number; prog: string }[] = []
    let p = progIdx, si = startSi
    while (si <= 2) { spans.push({ si, prog: daycare ? 'DAYCARE' : PROG_ORDER[p]! }); if (!daycare && p === 3) break; if (!chance(0.85)) break; si++; if (!daycare) p++ }
    const last = spans[spans.length - 1]!
    const active = last.si === 2
    const status = active ? 'ACTIVE' : !daycare && last.prog === 'UKG' ? 'GRADUATED' : pick(['TRANSFERRED', 'INACTIVE'])
    const st = put('Student', { id: id(), tenantId, branchId: branch.id, admissionNo: `${code}-${SESSIONS[startSi]!.name.slice(0, 4)}-${pad(i + 1)}`, firstName: pick(g === 'MALE' ? FIRST_M : FIRST_F), lastName: pick(LAST), dob: addDays(admissionDate, -ageMonths * 30), gender: g, status, admissionDate, bloodGroup: pick(ENUMS.BloodGroup!), allergies: chance(0.1) ? pick(['Peanuts', 'Dairy', 'Gluten']) : null, address: `${int(1, 999)}, ${pick(['MG Road', 'Park Street', 'Lake View', 'Hill Road'])}, ${city}`, currentClassroomId: active ? classrooms[`2|${branch.id}|${last.prog}`].id : null, createdAt: admissionDate })
    st._spans = spans; st._branch = branch.id; st._startSi = startSi
    students.push(st)
    spans.forEach((sp, k) => {
      const cls = classrooms[`${sp.si}|${branch.id}|${sp.prog}`]
      const ended = sp.si < 2
      put('StudentAllocation', { tenantId, studentId: st.id, academicSessionId: sessions[sp.si]!.id, classroomId: cls.id, programType: sp.prog, status: !ended ? 'ACTIVE' : k < spans.length - 1 ? 'PROMOTED' : status === 'GRADUATED' ? 'COMPLETED' : 'WITHDRAWN', startedAt: k === 0 ? admissionDate : SESSIONS[sp.si]!.start, endedAt: ended ? SESSIONS[sp.si]!.end : null, createdById: principal.user.id, createdByName: principal.user.fullName })
      enrolBySession[sp.si]!.push({ st, cls, prog: sp.prog, first: k === 0 })
    })
  }
  // classroom counts → seat numbers aren't needed; guardians
  const guardiansByStudent = new Map<string, any[]>()
  for (const st of students) {
    const last = st.lastName
    const gs = (['FATHER', 'MOTHER'] as const).map((rel, k) => {
      const pid = ++parentCounter.n
      let userId = null
      if (k === 0 || chance(0.5)) {
        const email = `parent.${pid}@preone.demo`
        const u = put('User', { id: id(), email, username: `parent.${pid}`, phone: phone(), passwordHash: hash, fullName: `${pick(rel === 'FATHER' ? FIRST_M : FIRST_F)} ${last}`, status: 'ACTIVE', mustChangePassword: false, createdAt: st.admissionDate })
        const tu = put('TenantUser', { id: id(), tenantId, userId: u.id, role: 'PARENT', roles: ['PARENT'], branchId: st._branch, status: st.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE', createdAt: st.admissionDate })
        tenantUsers.push(tu); userId = u.id
      }
      const g = put('Guardian', { id: id(), tenantId, userId, fullName: `${pick(rel === 'FATHER' ? FIRST_M : FIRST_F)} ${last}`, relationship: rel, phone: phone(), email: `parent.${pid}@preone.demo`, occupation: pick(['Engineer', 'Doctor', 'Teacher', 'Business', 'Banker', 'Homemaker']), isPrimaryContact: k === 0, pickupPin: String(int(1000, 9999)), createdAt: st.admissionDate })
      put('StudentGuardian', { studentId: st.id, guardianId: g.id, relationship: rel, isPrimary: k === 0, canPickup: true, isFeePayer: k === 0, receivesComm: true, isEmergencyContact: true, emergencyPriority: k + 1, pickupStatus: 'AUTHORIZED', verifiedAt: st.admissionDate, verifiedByName: reception.user.fullName })
      return g
    })
    guardiansByStudent.set(st.id, gs)
  }

  // ── admissions funnel: leads → applications → offers ──
  let leadNo = 0, appNo = 0, offerNo = 0
  for (const st of students) {
    const si = st._startSi, g = guardiansByStudent.get(st.id)![0]
    const created = addDays(st.admissionDate, -int(20, 60))
    const lead = put('Lead', { id: id(), tenantId, branchId: st._branch, leadNumber: `LD-${pad(++leadNo, 5)}`, source: pick(ENUMS.LeadSource!), status: 'CONVERTED', parentName: g.fullName, phone: g.phone, email: g.email, childName: `${st.firstName} ${st.lastName}`, childDob: st.dob, interestedProgram: st._spans[0].prog, assignedToId: reception.user.id, createdAt: created })
    const app = put('AdmissionApplication', { id: id(), tenantId, branchId: st._branch, leadId: lead.id, guardianId: g.id, academicSessionId: sessions[si]!.id, programId: programs.find(p => p.programType === st._spans[0].prog)!.id, applicationNumber: `APP-${pad(++appNo, 5)}`, programType: st._spans[0].prog, childFirstName: st.firstName, childLastName: st.lastName, childDob: st.dob, childGender: st.gender, parentName: g.fullName, parentPhone: g.phone, parentEmail: g.email, status: 'ENROLLED', submittedAt: addDays(created, 3), verifiedAt: addDays(created, 7), approvedAt: addDays(created, 10), studentId: st.id, classroomId: classrooms[`${si}|${st._branch}|${st._spans[0].prog}`].id, createdAt: addDays(created, 2) })
    lead.convertedApplicationId = app.id
    put('AdmissionOffer', { tenantId, applicationId: app.id, offerNumber: `OFR-${pad(++offerNo, 5)}`, childName: `${st.firstName} ${st.lastName}`, parentName: g.fullName, programType: app.programType, feeTotalCents: 40000_00, status: 'ACCEPTED', validFrom: addDays(created, 10), validUntil: addDays(created, 25), issuedAt: addDays(created, 10), acceptedAt: addDays(created, 14), createdById: principal.user.id })
    for (const dt of ['BIRTH_CERTIFICATE', 'PHOTO', 'ADDRESS_PROOF'] as const) put('ApplicationDocument', { applicationId: app.id, docType: dt, fileName: `${dt.toLowerCase()}.pdf`, status: 'VERIFIED', verified: true, verifiedAt: addDays(created, 7) })
    put('AdmissionCommunication', { tenantId, branchId: st._branch, leadId: lead.id, applicationId: app.id, channel: 'CALL', interactionType: 'CALL_LOGGED', callOutcome: 'CONNECTED', notes: 'Discussed program and fees', parentName: g.fullName, phone: g.phone, createdById: reception.user.id, createdByName: reception.user.fullName, createdAt: addDays(created, 1) })
  }
  // non-converted leads & rejected/waitlisted apps
  for (let i = 0; i < Math.round(studentCount * 0.8); i++) {
    const created = between(SESSIONS[0]!.start, TODAY); const pn = personName(); const prog = pick(PROG_ORDER)
    const status = pick(['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'LOST', 'APPLICATION_STARTED', 'DUPLICATE'] as const)
    const lead = put('Lead', { id: id(), tenantId, branchId: B(), leadNumber: `LD-${pad(++leadNo, 5)}`, source: pick(ENUMS.LeadSource!), status, parentName: pn, phone: phone(), childName: `${pick(FIRST_F)} ${pn.split(' ')[1]}`, childDob: addDays(created, -int(600, 1800)), interestedProgram: prog, assignedToId: reception.user.id, nextFollowUpAt: status === 'NEW' || status === 'CONTACTED' ? addDays(TODAY, int(1, 14)) : null, createdAt: created })
    put('AdmissionCommunication', { tenantId, branchId: lead.branchId, leadId: lead.id, channel: pick(['CALL', 'WHATSAPP']), interactionType: pick(ENUMS.CommunicationInteractionType!), callOutcome: pick(ENUMS.CallOutcome!), parentName: pn, phone: lead.phone, followUpDate: lead.nextFollowUpAt, createdById: reception.user.id, createdByName: reception.user.fullName, createdAt: addDays(created, 1) })
    if (status === 'APPLICATION_STARTED' || chance(0.15)) {
      const si = created < SESSIONS[1]!.start ? 0 : created < SESSIONS[2]!.start ? 1 : 2
      const app = put('AdmissionApplication', { id: id(), tenantId, branchId: lead.branchId, leadId: lead.id, academicSessionId: sessions[si]!.id, applicationNumber: `APP-${pad(++appNo, 5)}`, programType: prog, childFirstName: lead.childName.split(' ')[0], childLastName: pn.split(' ')[1], childDob: lead.childDob, childGender: pick(['MALE', 'FEMALE']), parentName: pn, parentPhone: lead.phone, status: pick(['SUBMITTED', 'DOCUMENT_PENDING', 'UNDER_REVIEW', 'WAITLISTED', 'REJECTED', 'WITHDRAWN', 'APPROVED', 'OFFER_SENT']), submittedAt: addDays(created, 2), rejectionReason: null, createdAt: addDays(created, 2) })
      put('ApplicationDocument', { applicationId: app.id, docType: 'BIRTH_CERTIFICATE', fileName: 'birth_certificate.pdf', status: pick(['UPLOADED', 'UNDER_REVIEW', 'REJECTED']) })
      if (app.status === 'OFFER_SENT') put('AdmissionOffer', { tenantId, applicationId: app.id, offerNumber: `OFR-${pad(++offerNo, 5)}`, childName: lead.childName, parentName: pn, programType: prog, feeTotalCents: 40000_00, status: 'ISSUED', issuedAt: addDays(created, 10), validUntil: addDays(created, 30) })
    }
  }

  // ── fees: schedules, invoices, payments, receipts, deposits, refunds ──
  let invNo = 0, payNo = 0
  const payFor = (st: any, inv: any, sched: any | null, amount: number, date: Date) => {
    const pay = put('Payment', { id: id(), tenantId, invoiceId: inv.id, feeScheduleId: sched?.id, studentId: st.id, paymentNumber: `PAY-${pad(++payNo, 6)}`, amountCents: amount, method: pick(['UPI', 'UPI', 'CASH', 'CARD', 'NET_BANKING', 'CHEQUE']), transactionRef: `TXN${code}${pad(payNo, 7)}`, status: 'SUCCESS', paymentDate: date, receivedById: accountant.user.id, createdAt: date })
    put('Receipt', { tenantId, paymentId: pay.id, receiptNumber: `RCP-${pad(payNo, 6)}`, amountCents: amount, issuedAt: date })
  }
  for (let si = 0; si < 3; si++) for (const e of enrolBySession[si]!) {
    const fi = feeItems[`${si}|${e.prog}`]!
    const lines: [any, string, Date][] = []
    if (e.first) { lines.push([fi.admission, 'ONE_TIME', SESSIONS[si]!.start]); lines.push([fi.deposit, 'ONE_TIME', SESSIONS[si]!.start]) }
    for (let q = 0; q < 4; q++) lines.push([fi.tuition, `Q${q + 1}`, addDays(SESSIONS[si]!.start, q * 75 + 10)])
    for (const [item, period, due] of lines) {
      if (due > addDays(TODAY, 30)) continue // future quarters not yet raised
      const amount = item.amountCents
      const overdue = due < TODAY
      const paidFrac = !overdue ? (chance(0.4) ? 1 : 0) : si < 2 ? (chance(0.97) ? 1 : 0.5) : chance(0.8) ? 1 : chance(0.5) ? 0.5 : 0
      const paid = Math.round(amount * paidFrac)
      const sched = put('StudentFeeSchedule', { id: id(), tenantId, studentId: e.st.id, classroomId: e.cls.id, feeStructureId: fi.structure.id, feeItemId: item.id, academicSessionId: sessions[si]!.id, period: `${SESSIONS[si]!.name}-${period}`, amountDueCents: amount, amountPaidCents: paid, remainingAmountCents: amount - paid, dueDate: due, status: paid === amount ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : overdue ? 'OVERDUE' : 'PENDING', feeType: item.feeType ?? 'REGULAR', isRefundable: !!item.isRefundable, createdAt: addDays(due, -15) })
      const inv = put('Invoice', { id: id(), tenantId, branchId: e.st._branch, academicSessionId: sessions[si]!.id, studentId: e.st.id, invoiceNumber: `INV-${pad(++invNo, 6)}`, title: `${item.name} ${period}`, issueDate: addDays(due, -15), dueDate: due, subtotalCents: amount, totalCents: amount, paidCents: paid, balanceCents: amount - paid, status: sched.status === 'PAID' ? 'PAID' : sched.status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : overdue ? 'OVERDUE' : 'ISSUED', issuedById: accountant.user.id, createdAt: addDays(due, -15) })
      put('InvoiceItem', { invoiceId: inv.id, feeHead: item === fi.admission ? 'ADMISSION' : item === fi.deposit ? 'OTHER' : 'TUITION', description: `${item.name} ${period}`, amountCents: amount })
      if (paid) payFor(e.st, inv, sched, paid, minD(addDays(due, int(-10, 12)), TODAY))
      if (item === fi.deposit && paid) {
        const refunded = e.st.status !== 'ACTIVE' && chance(0.7)
        const dep = put('StudentDeposit', { id: id(), tenantId, studentId: e.st.id, feeScheduleId: sched.id, feeItemId: item.id, totalAmountCents: paid, refundedAmountCents: refunded ? paid : 0, remainingAmountCents: refunded ? 0 : paid, status: refunded ? 'REFUNDED' : 'HELD' })
        if (refunded) put('Refund', { tenantId, studentId: e.st.id, depositId: dep.id, feeScheduleId: sched.id, amountCents: paid, refundDate: SESSIONS[e.st._spans.at(-1).si]!.end, refundMode: 'BANK_TRANSFER', reason: 'Deposit refund on exit', approvedById: principal.user.id, processedById: accountant.user.id })
      }
    }
  }

  // ── attendance, timeline, observations, progress, daily reports ──
  for (let si = 0; si < 3; si++) {
    const days = schoolDays[si]!
    for (const e of enrolBySession[si]!) {
      const from = e.first ? e.st.admissionDate : SESSIONS[si]!.start
      const absentProne = rnd() * 0.12
      for (const d of days) {
        if (d < from) continue
        const r = rnd()
        put('Attendance', { tenantId, branchId: e.st._branch, classroomId: e.cls.id, studentId: e.st.id, academicSessionId: sessions[si]!.id, date: d, status: r < absentProne ? 'ABSENT' : r < absentProne + 0.03 ? 'LATE' : r < absentProne + 0.04 ? 'LEAVE' : 'PRESENT', markedById: e.cls.primaryTeacherId, markedAt: addDays(d, 0.375), createdAt: d })
      }
      // twice a month timeline, monthly observation
      for (let k = 0; k < days.length; k += 10) {
        const d = days[k]!; if (d < from) continue
        const obs = k % 20 === 0 ? put('Observation', { id: id(), tenantId, academicSessionId: sessions[si]!.id, classroomId: e.cls.id, studentId: e.st.id, teacherId: e.cls.primaryTeacherId, learningGoalId: pick(goalsByProg[`${si}|${e.prog}`]!).id, narrative: pick(['Shared toys with peers during free play.', 'Counted objects up to 10 confidently.', 'Recognised letters of own name.', 'Needed support settling after drop-off.', 'Showed great focus during puzzle time.']), milestoneTags: pick(['social', 'numeracy', 'language', 'motor']), status: 'PUBLISHED', category: pick(['Learning', 'Behaviour', 'Health']), concern: pick(['NORMAL', 'NORMAL', 'PROGRESS', 'NEEDS_ATTENTION']), observedAt: addDays(d, 0.45), publishedAt: addDays(d, 0.6), createdAt: d }) : null
        put('TimelineEntry', { tenantId, academicSessionId: sessions[si]!.id, classroomId: e.cls.id, studentId: e.st.id, observationId: obs?.id, type: obs ? 'OBSERVATION' : pick(['ARRIVAL', 'MEAL', 'NAP', 'ACTIVITY', 'PHOTO', 'PICKUP', 'MILESTONE']), title: obs ? 'New observation' : pick(['Arrived happily', 'Finished lunch', 'Napped 1 hr', 'Painting activity', 'Picked up by parent']), mood: pick(['happy', 'calm', 'tired', 'excited']), authorId: e.cls.primaryTeacherId, createdAt: addDays(d, 0.5) })
      }
      for (const goal of goalsByProg[`${si}|${e.prog}`]!) put('StudentProgress', { tenantId, academicSessionId: sessions[si]!.id, studentId: e.st.id, learningGoalId: goal.id, stage: si < 2 ? pick(['DEVELOPING', 'ACHIEVED', 'ACHIEVED']) : pick(['NOT_STARTED', 'INTRODUCED', 'DEVELOPING']), assessedBy: e.cls.primaryTeacherId, assessedAt: minD(addDays(SESSIONS[si]!.start, int(30, 250)), TODAY) })
      if (si < 2) for (const term of ['TERM_1', 'TERM_2']) put('StudentReportCard', { tenantId, branchId: e.st._branch, academicSessionId: sessions[si]!.id, studentId: e.st.id, classroomId: e.cls.id, templateId: templates[0]!.id, term, status: 'PUBLISHED', evaluatorId: e.cls.primaryTeacherId, overallGrade: pick(['A+', 'A', 'B+', 'B']), attendancePct: int(80, 99), fieldValues: { remarks: 'Making good progress' }, publishedAt: addDays(SESSIONS[si]!.start, term === 'TERM_1' ? 140 : 290), publishedById: principal.user.id, publishedByName: principal.user.fullName })
      if (si === 2) for (const d of days.slice(-20)) put('DailyReport', { tenantId, studentId: e.st.id, classroomId: e.cls.id, academicSessionId: sessions[si]!.id, reportDate: d, status: 'PUBLISHED', publishedAt: addDays(d, 0.7), publishedBy: e.cls.primaryTeacherId, attendanceStatus: 'PRESENT', summaryText: 'A joyful day of learning and play.', activitiesSummary: [{ title: 'Story time' }], mealsSummary: { lunch: pick(['all', 'most', 'some']) }, napSummary: { minutes: int(30, 90) }, parentRecipientsCount: 2, notificationStatus: 'SENT' })
    }
  }

  // classroom activities (weekly) + activity progress for last 4 weeks
  const activities: any[] = []
  for (const [key, cls] of Object.entries(classrooms)) {
    const si = Number(key[0]); const prog = key.split('|')[2]!
    schoolDays[si]!.forEach((d, k) => {
      if (k % 5) return
      activities.push(put('ClassroomActivity', { id: id(), tenantId, academicSessionId: sessions[si]!.id, classroomId: cls.id, curriculumId: curriculaByKey[`${si}|${prog}`].id, learningGoalId: pick(goalsByProg[`${si}|${prog}`]!).id, teacherId: cls.primaryTeacherId, title: pick(['Leaf painting', 'Number hop', 'Story circle', 'Clay modelling', 'Shape hunt', 'Music & movement']), activityType: pick(['ART', 'GAME', 'STORY', 'MUSIC']), activityDate: d, startTime: '10:00', endTime: '10:45', durationMinutes: 45, status: d < TODAY ? 'COMPLETED' : 'PLANNED', createdBy: cls.primaryTeacherId, _cls: cls.id, _si: si }))
    })
  }
  const recent = activities.filter(a => a._si === 2 && a.activityDate > addDays(TODAY, -28))
  for (const a of recent) for (const e of enrolBySession[2]!.filter(x => x.cls.id === a._cls)) put('ActivityProgress', { tenantId, activityId: a.id, studentId: e.st.id, status: 'COMPLETED', progressPercentage: 100, completedAt: a.activityDate })
  activities.forEach(a => { delete a._cls; delete a._si })

  // follow-ups
  for (let i = 0; i < 40; i++) { const st = pick(students); const at = between(SESSIONS[0]!.start, TODAY); const open = at > addDays(TODAY, -30); put('FollowUp', { tenantId, branchId: st._branch, studentId: st.id, domain: pick(ENUMS.FollowUpDomain!), severity: pick(['INFO', 'WARNING', 'URGENT']), status: open ? pick(['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED']) : 'CLOSED', sourceType: pick(['ATTENDANCE', 'OBSERVATION', 'MANUAL']), title: pick(['Repeated absence', 'Fever reported', 'Fee overdue', 'Speech support needed']), responsibleRole: 'PRINCIPAL', assignedToId: principal.user.id, dueAt: addDays(at, 7), resolvedAt: open ? null : addDays(at, 5), closedAt: open ? null : addDays(at, 6), createdById: principal.user.id, createdByName: principal.user.fullName, createdAt: at }) }

  // ── inventory ──
  const cats = ['Stationery', 'Art Supplies', 'Hygiene', 'Food', 'First Aid', 'Toys'].map((nm, i) => put('InventoryCategory', { id: id(), tenantId, name: nm, code: `CAT${i + 1}`, sortOrder: i }))
  put('InventoryCategory', { id: id(), tenantId, name: 'Crayons', code: 'CAT1-1', parentCategoryId: cats[0]!.id })
  const units = [['Piece', 'PCS', 'pc'], ['Box', 'BOX', 'bx'], ['Packet', 'PKT', 'pk'], ['Kilogram', 'KG', 'kg'], ['Litre', 'LTR', 'l']].map(([nm, c, s]) => put('InventoryUnit', { id: id(), tenantId, name: nm, code: c, symbol: s, decimalAllowed: c === 'KG' || c === 'LTR' }))
  const vendors = Array.from({ length: 5 }, (_, i) => put('Vendor', { id: id(), tenantId, name: `${pick(['Shree', 'Balaji', 'Modern', 'City', 'Royal'])} Supplies ${i + 1}`, code: `V${i + 1}`, contactPerson: personName(), phone: phone(), email: `vendor${i + 1}.${code.toLowerCase()}@demo.in`, city, state, paymentTerms: 'Net 30' }))
  const locs = branches.flatMap(b => { const main = put('InventoryLocation', { id: id(), tenantId, branchId: b.id, name: 'Main Store', code: 'MAIN', locationType: 'MAIN_STORE' }); return [main, put('InventoryLocation', { id: id(), tenantId, branchId: b.id, parentLocationId: main.id, name: 'Kitchen Store', code: 'KIT', locationType: 'KITCHEN_STORE' })] })
  const ITEMS = ['Crayons', 'Drawing Book', 'Glue Stick', 'Hand Wash', 'Tissue Box', 'Milk Powder', 'Band-aid', 'Building Blocks', 'Clay', 'Pencil', 'Eraser', 'Chart Paper', 'Sanitiser', 'Wet Wipes', 'Puzzle Set', 'Water Bottle', 'School Bag', 'Uniform Set', 'Activity Book', 'Paint Brush']
  const items = ITEMS.map((nm, i) => put('InventoryItem', { id: id(), tenantId, categoryId: cats[i % 6]!.id, unitId: units[i % 3]!.id, defaultVendorId: pick(vendors).id, sku: `SKU-${pad(i + 1)}`, name: nm, itemType: pick(['CONSUMABLE', 'LEARNING_MATERIAL', 'STUDENT_SUPPLY', 'HYGIENE_SUPPLY']), minimumStock: 10, reorderLevel: 20, maximumStock: 500, createdById: owner.user.id }))
  for (const b of branches) {
    const loc = locs.find(l => l.branchId === b.id)!
    for (const it of items) {
      const qty = int(30, 300)
      put('InventoryStock', { tenantId, branchId: b.id, locationId: loc.id, itemId: it.id, batchNumber: 'B1', serialNumber: '', quantity: qty, availableQuantity: qty, unitCost: int(20, 400), averageCost: int(20, 400), lastMovementAt: addDays(TODAY, -int(1, 30)) })
      put('StockMovement', { tenantId, branchId: b.id, itemId: it.id, locationId: loc.id, toLocationId: loc.id, movementType: 'OPENING_BALANCE', quantity: qty, unitCost: 50, referenceType: 'OPENING', performedById: owner.user.id, performedByName: owner.user.fullName, createdAt: SESSIONS[0]!.start })
    }
  }
  let prN = 0, poN = 0, grnN = 0, mrN = 0, isN = 0, rtN = 0, adN = 0, kitN = 0
  for (let q = 0; q < 10; q++) { // purchase cycles across 3 years
    const b = pick(branches), loc = locs.find(l => l.branchId === b.id)!, at = addDays(SESSIONS[0]!.start, q * 85), vendor = pick(vendors)
    const si = at < SESSIONS[1]!.start ? 0 : at < SESSIONS[2]!.start ? 1 : 2
    const pr = put('PurchaseRequest', { id: id(), tenantId, branchId: b.id, academicSessionId: sessions[si]!.id, requestNumber: `PR-${pad(++prN)}`, requestedById: principal.user.id, requestedByName: principal.user.fullName, status: 'ORDERED', priority: 'NORMAL', requiredBy: addDays(at, 14), approvedById: owner.user.id, approvedByName: owner.user.fullName, approvedAt: addDays(at, 1), createdAt: at })
    const lines = [0, 1, 2].map(() => pick(items))
    lines.forEach(it => put('PurchaseRequestItem', { purchaseRequestId: pr.id, itemId: it.id, requestedQuantity: 100, estimatedUnitCost: 40, approvedQuantity: 100 }))
    const po = put('PurchaseOrder', { id: id(), tenantId, branchId: b.id, academicSessionId: sessions[si]!.id, vendorId: vendor.id, purchaseRequestId: pr.id, poNumber: `PO-${pad(++poN)}`, status: 'FULLY_RECEIVED', orderDate: addDays(at, 2), expectedDeliveryDate: addDays(at, 9), subtotal: 12000, taxAmount: 2160, grandTotal: 14160, createdById: accountant.user.id, createdByName: accountant.user.fullName, approvedById: owner.user.id, approvedByName: owner.user.fullName, approvedAt: addDays(at, 2), createdAt: addDays(at, 2) })
    const poItems = lines.map(it => put('PurchaseOrderItem', { id: id(), purchaseOrderId: po.id, itemId: it.id, quantity: 100, unitPrice: 40, taxRate: 18, taxAmount: 720, lineTotal: 4720, receivedQuantity: 100, pendingQuantity: 0 }))
    const grn = put('GoodsReceipt', { id: id(), tenantId, branchId: b.id, purchaseOrderId: po.id, vendorId: vendor.id, grnNumber: `GRN-${pad(++grnN)}`, receiptDate: addDays(at, 9), receivedById: reception.user.id, receivedByName: reception.user.fullName, status: 'FINALIZED', totalReceivedValue: 12000, createdAt: addDays(at, 9) })
    poItems.forEach(pi => { put('GoodsReceiptItem', { goodsReceiptId: grn.id, purchaseOrderItemId: pi.id, itemId: pi.itemId, locationId: loc.id, orderedQuantity: 100, receivedQuantity: 100, acceptedQuantity: 100, unitCost: 40 }); put('StockMovement', { tenantId, branchId: b.id, academicSessionId: sessions[si]!.id, itemId: pi.itemId, locationId: loc.id, toLocationId: loc.id, movementType: 'RECEIPT', quantity: 100, unitCost: 40, referenceType: 'GRN', referenceId: grn.id, performedById: reception.user.id, performedByName: reception.user.fullName, createdAt: addDays(at, 9) }) })
    const bill = put('Invoice', { id: id(), tenantId, branchId: b.id, academicSessionId: sessions[si]!.id, vendorId: vendor.id, purchaseOrderId: po.id, invoiceType: 'VENDOR_BILL', invoiceNumber: `VB-${pad(q + 1)}`, title: `Vendor bill ${po.poNumber}`, issueDate: addDays(at, 9), dueDate: addDays(at, 39), subtotalCents: 12000_00, taxCents: 2160_00, totalCents: 14160_00, paidCents: 14160_00, balanceCents: 0, status: 'PAID', createdAt: addDays(at, 9) })
    put('InvoiceItem', { invoiceId: bill.id, feeHead: 'MATERIALS', description: 'Supplies', amountCents: 14160_00 })
    put('Payment', { tenantId, invoiceId: bill.id, vendorId: vendor.id, paymentNumber: `VPAY-${pad(q + 1)}`, amountCents: 14160_00, method: 'BANK_TRANSFER', transactionRef: `VTXN${code}${q}`, status: 'SUCCESS', paymentDate: addDays(at, 35), receivedById: accountant.user.id })
    // material request -> issue -> return
    const cls = classrooms[`${si}|${b.id}|${pick(PROG_ORDER)}`]
    const mr = put('MaterialRequest', { id: id(), tenantId, branchId: b.id, academicSessionId: sessions[si]!.id, classroomId: cls.id, requestNumber: `MR-${pad(++mrN)}`, requestedById: cls.primaryTeacherId, requestedByName: 'Class Teacher', requestedByRole: 'TEACHER', destinationType: 'CLASSROOM', destinationId: cls.id, requiredDate: addDays(at, 12), status: 'FULFILLED', approvedById: principal.user.id, approvedByName: principal.user.fullName, approvedAt: addDays(at, 11), createdAt: addDays(at, 10) })
    const mi = pick(items); put('MaterialRequestItem', { materialRequestId: mr.id, itemId: mi.id, requestedQuantity: 20, approvedQuantity: 20, issuedQuantity: 20 })
    const iss = put('StockIssue', { id: id(), tenantId, branchId: b.id, academicSessionId: sessions[si]!.id, locationId: loc.id, materialRequestId: mr.id, classroomId: cls.id, issueNumber: `SI-${pad(++isN)}`, destinationType: 'CLASSROOM', destinationId: cls.id, issuedById: reception.user.id, issuedByName: reception.user.fullName, status: 'COMPLETED', issueDate: addDays(at, 12), createdAt: addDays(at, 12) })
    const ii = put('StockIssueItem', { id: id(), stockIssueId: iss.id, itemId: mi.id, quantity: 20, unitCost: 40, returnedQuantity: 2 })
    put('StockMovement', { tenantId, branchId: b.id, itemId: mi.id, locationId: loc.id, fromLocationId: loc.id, movementType: 'ISSUE', quantity: 20, referenceType: 'STOCK_ISSUE', referenceId: iss.id, createdAt: addDays(at, 12) })
    const ret = put('StockReturn', { id: id(), tenantId, branchId: b.id, stockIssueId: iss.id, returnNumber: `SR-${pad(++rtN)}`, destinationLocationId: loc.id, returnedById: cls.primaryTeacherId, returnedByName: 'Class Teacher', returnDate: addDays(at, 30), createdAt: addDays(at, 30) })
    put('StockReturnItem', { stockReturnId: ret.id, stockIssueItemId: ii.id, itemId: mi.id, quantity: 2, condition: 'GOOD' })
    const adj = put('StockAdjustment', { id: id(), tenantId, branchId: b.id, adjustmentNumber: `ADJ-${pad(++adN)}`, locationId: loc.id, status: 'APPLIED', reason: 'Quarterly stock count', requestedById: reception.user.id, requestedByName: reception.user.fullName, approvedById: principal.user.id, approvedByName: principal.user.fullName, approvedAt: addDays(at, 60), createdAt: addDays(at, 60) })
    put('StockAdjustmentItem', { stockAdjustmentId: adj.id, itemId: pick(items).id, systemQuantity: 50, physicalQuantity: 48, differenceQuantity: -2, reason: 'Damaged' })
  }
  const bundle = put('InventoryBundle', { id: id(), tenantId, name: 'New Admission Kit', code: 'KIT-NEW', programType: null, description: 'Bag, bottle, uniform, books' })
  ;['School Bag', 'Water Bottle', 'Uniform Set', 'Activity Book'].forEach((nm, i) => put('InventoryBundleItem', { bundleId: bundle.id, itemId: items.find(x => x.name === nm)!.id, itemName: nm, quantity: 1, hasVariants: nm === 'Uniform Set', variantType: nm === 'Uniform Set' ? 'SIZE' : null, sortOrder: i }))
  for (const st of students.filter(s => s._startSi === 2)) {
    const loc = locs.find(l => l.branchId === st._branch)!
    const iss = put('StockIssue', { id: id(), tenantId, branchId: st._branch, academicSessionId: sessions[2]!.id, locationId: loc.id, studentId: st.id, issueNumber: `SI-${pad(++isN)}`, destinationType: 'STUDENT', destinationId: st.id, issuedById: reception.user.id, issuedByName: reception.user.fullName, recipientName: guardiansByStudent.get(st.id)![0].fullName, status: 'COMPLETED', issueDate: st.admissionDate, createdAt: st.admissionDate })
    put('StockIssueItem', { stockIssueId: iss.id, itemId: items.find(x => x.name === 'School Bag')!.id, quantity: 1 })
    put('StudentKitIssuance', { tenantId, branchId: st._branch, bundleId: bundle.id, studentId: st.id, stockIssueId: iss.id, kitNumber: `KIT-${pad(++kitN)}`, bundleName: bundle.name, variantValues: { size: pick(['S', 'M', 'L']) }, issuedById: reception.user.id, issuedByName: reception.user.fullName, guardianName: guardiansByStudent.get(st.id)![0].fullName, createdAt: st.admissionDate })
  }

  // ── HR ──
  const leaveTypes = [['Casual Leave', 'CL', 12], ['Sick Leave', 'SL', 8], ['Earned Leave', 'EL', 15], ['Loss of Pay', 'LOP', 0]].map(([nm, c, q]) => put('LeaveType', { id: id(), tenantId, name: nm, code: c, annualQuota: q, isPaid: c !== 'LOP', carryForwardAllowed: c === 'EL', maxCarryForward: c === 'EL' ? 10 : 0 }))
  const allDays = schoolDays.flat()
  for (const s of staff) {
    put('StaffDocument', { tenantId, staffProfileId: s.sp.id, docType: 'ID_PROOF', fileUrl: `https://cdn.preone.demo/${s.sp.id}/id.pdf`, fileName: 'id.pdf', verificationStatus: 'VERIFIED', verifiedById: hr.user.id, verifiedByName: hr.user.fullName, verifiedAt: s.joining })
    put('StaffDocument', { tenantId, staffProfileId: s.sp.id, docType: 'POLICE_VERIFICATION', fileUrl: `https://cdn.preone.demo/${s.sp.id}/pv.pdf`, fileName: 'pv.pdf', verificationStatus: pick(['VERIFIED', 'PENDING']), expiryDate: addDays(s.joining, 730) })
    put('StaffQualification', { tenantId, staffProfileId: s.sp.id, degree: s.sp.qualification, institution: `${city} University`, yearOfPassing: int(1998, 2022), isEcceCertified: s.role === 'TEACHER' })
    put('StaffBankDetail', { tenantId, staffProfileId: s.sp.id, accountHolderName: s.user.fullName, bankName: pick(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank']), accountNumberMasked: `XXXXXX${int(1000, 9999)}`, accountNumberEncrypted: 'enc:demo', ifscCode: `HDFC000${int(1000, 9999)}` })
    for (const t of ['POSH', 'FIRST_AID'] as const) { const done = between(s.joining, TODAY); put('StaffTraining', { tenantId, staffProfileId: s.sp.id, trainingType: t, completionDate: done, expiryDate: addDays(done, 365), status: addDays(done, 365) < TODAY ? 'EXPIRED' : 'VALID', score: int(70, 100) }) }
    const basic = s.role === 'OWNER' ? 0 : s.role === 'PRINCIPAL' ? 45000 : s.role === 'TEACHER' ? 22000 : 14000
    put('StaffSalaryStructure', { tenantId, staffProfileId: s.sp.id, basicSalary: basic, hra: basic * 0.4, specialAllowance: basic * 0.2, pfEligible: true, effectiveFrom: s.joining })
    for (const d of allDays) if (d >= s.joining) { const r = rnd(); put('AttendanceStaff', { tenantId, branchId: s.branchId, staffProfileId: s.sp.id, date: d, status: r < 0.04 ? 'ABSENT' : r < 0.08 ? 'ON_LEAVE' : r < 0.12 ? 'LATE' : 'PRESENT', checkIn: addDays(d, (8.5 + (r < 0.12 && r >= 0.08 ? 0.5 : 0)) / 24), checkOut: addDays(d, 16.5 / 24), source: pick(['BIOMETRIC', 'MANUAL']), shiftHours: 8, workedHours: 8, lateMinutes: r < 0.12 && r >= 0.08 ? 30 : 0 }) }
    for (const y of [2024, 2025, 2026]) {
      if (s.joining.getUTCFullYear() > y) continue
      leaveTypes.forEach(lt => { const c = lt.annualQuota; const used = Math.min(c, int(0, 6)); put('LeaveBalance', { tenantId, staffProfileId: s.sp.id, leaveTypeId: lt.id, year: y, totalCredited: c, consumed: used, balance: c - used }) })
      for (let k = 0; k < 2; k++) {
        const start = between(new Date(`${y}-01-05`), minD(new Date(`${y}-12-20`), addDays(TODAY, 20))); if (start < s.joining) continue
        const lr = put('LeaveRequest', { id: id(), tenantId, staffProfileId: s.sp.id, leaveTypeId: pick(leaveTypes.slice(0, 3)).id, startDate: start, endDate: addDays(start, 1), totalDays: 2, reason: pick(['Family function', 'Fever', 'Personal work', 'Travel']), status: start > TODAY ? 'PENDING' : pick(['APPROVED', 'APPROVED', 'REJECTED']), appliedAt: addDays(start, -5), actionedById: principal.user.id, actionedByName: principal.user.fullName })
        if (s.role === 'TEACHER' && lr.status === 'APPROVED') { const cls = Object.values(classrooms).find((c: any) => c.primaryTeacherId === s.user.id); if (cls) put('LeaveCoverage', { leaveRequestId: lr.id, classroomId: cls.id, date: start, substituteStaffId: pick(teachers).sp.id, status: 'ASSIGNED', notificationSent: true }) }
      }
    }
  }
  // payroll monthly from Jun 2024 to last month
  const payrollStaff = staff.filter(s => s.role !== 'OWNER')
  for (let m = new Date('2024-06-01'); m < new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1)); m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))) {
    const cycle = put('PayrollCycle', { id: id(), tenantId, branchId: null, month: m.getUTCMonth() + 1, year: m.getUTCFullYear(), attendanceCutoffDate: new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 25)), status: 'DISBURSED', processedById: hr.user.id, processedByName: hr.user.fullName, lockedAt: new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 28)), disbursedAt: new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)) })
    let gross = 0, ded = 0, cnt = 0
    for (const s of payrollStaff) {
      if (s.joining > m) continue
      const basic = s.role === 'PRINCIPAL' ? 45000 : s.role === 'TEACHER' ? 22000 : 14000
      const g = basic * 1.6, d = Math.round(basic * 0.12 + 200)
      gross += g; ded += d; cnt++
      put('Payslip', { tenantId, payrollCycleId: cycle.id, staffProfileId: s.sp.id, presentDays: int(20, 24), absentDays: int(0, 2), basicEarned: basic, hraEarned: basic * 0.4, allowanceEarned: basic * 0.2, grossEarnings: g, pfDeduction: basic * 0.12, ptDeduction: 200, totalDeductions: d, netSalary: g - d, poshCompliant: true, status: 'PAID', paymentReference: `SAL${code}${m.getUTCFullYear()}${m.getUTCMonth() + 1}${cnt}` })
    }
    Object.assign(cycle, { totalStaff: cnt, totalGross: gross, totalDeductions: ded, totalNetPayable: gross - ded })
  }
  for (const y of [2024, 2025]) {
    const rc = put('ReviewCycle', { id: id(), tenantId, title: `Annual Review ${y}-${y + 1}`, cycleType: 'ANNUAL', startDate: new Date(`${y + 1}-03-01`), endDate: new Date(`${y + 1}-04-15`), status: 'COMPLETED' })
    for (const s of payrollStaff) if (s.joining.getUTCFullYear() <= y) put('StaffReview', { tenantId, reviewCycleId: rc.id, staffProfileId: s.sp.id, reviewerId: principal.user.id, selfRating: int(3, 5), reviewerRating: int(3, 5), finalRating: int(3, 5), recommendation: pick(['INCREMENT', 'INCREMENT', 'NONE', 'PROMOTION']), status: 'CLOSED', completedAt: new Date(`${y + 1}-04-10`) })
  }
  for (let j = 0; j < 4; j++) {
    const jo = put('JobOpening', { id: id(), tenantId, branchId: B(), title: pick(['Pre-primary Teacher', 'Caretaker', 'Accountant', 'Bus Attendant']), department: 'Academics', designation: 'Teacher', openingsCount: int(1, 3), minExperienceYears: 1, status: j < 3 ? 'CLOSED' : 'OPEN', closingDate: addDays(SESSIONS[0]!.start, j * 250 + 30) })
    for (let a = 0; a < 6; a++) {
      const ja = put('JobApplication', { id: id(), tenantId, jobOpeningId: jo.id, candidateName: personName('F'), email: `cand${j}${a}.${code.toLowerCase()}@mail.demo`, phone: phone(), currentLocation: city, highestQualification: pick(['B.Ed', 'ECCE Diploma', 'B.A.']), experienceYears: int(0, 8), status: pick(ENUMS.JobApplicationStatus!), appliedAt: addDays(SESSIONS[0]!.start, j * 250 + int(0, 25)) })
      if (['INTERVIEW', 'OFFERED', 'HIRED'].includes(ja.status)) put('Interview', { jobApplicationId: ja.id, roundName: 'Round 1', scheduledAt: addDays(ja.appliedAt, 5), interviewerId: principal.user.id, interviewerName: principal.user.fullName, status: 'COMPLETED', rating: int(3, 5), feedback: 'Good classroom presence' })
    }
  }
  const leaver = teachers[teachers.length - 1]!
  put('ResignationRequest', { tenantId, staffProfileId: leaver.sp.id, resignationDate: addDays(TODAY, -20), requestedLwd: addDays(TODAY, 10), agreedLwd: addDays(TODAY, 10), reason: 'Relocating to another city', status: 'UNDER_NOTICE', actionedById: principal.user.id, actionedAt: addDays(TODAY, -18) })
  for (const t of ENUMS.OffboardingTaskType!) put('OffboardingTask', { tenantId, staffProfileId: leaver.sp.id, taskType: t, description: t.replace(/_/g, ' ').toLowerCase(), assignedRole: 'HR', isCompleted: chance(0.4) })

  // ── transport ──
  const routes = branches.map((b, bi) => {
    const v = put('Vehicle', { id: id(), tenantId, branchId: b.id, registrationNumber: `${state.slice(0, 2).toUpperCase()}-${pad(n, 2)}-${String.fromCharCode(65 + bi)}-${int(1000, 9999)}`, vehicleType: 'VAN', capacity: 20, makeModel: pick(['Force Traveller', 'Tata Winger', 'Maruti Eeco']), status: 'ACTIVE' })
    const r = put('TransportRoute', { id: id(), tenantId, branchId: b.id, vehicleId: v.id, driverProfileId: drivers[bi]!.sp.id, attendantProfileId: attendants[bi]!.sp.id, code: `R${bi + 1}`, name: `Route ${bi + 1} — ${city}`, status: 'ACTIVE' })
    const stops = [1, 2, 3, 4, 5].map(sq => put('RouteStop', { id: id(), tenantId, routeId: r.id, name: `Stop ${sq}`, landmark: pick(['Near temple', 'Opp. park', 'Bus depot', 'Main market', 'Metro station']), sequence: sq, morningPickupTime: `07:${pad(30 + sq * 5, 2)}`, eveningDropTime: `13:${pad(sq * 5, 2)}` }))
    return { v, r, stops, b, driver: drivers[bi]!, att: attendants[bi]! }
  })
  const riders: { st: any; route: any; stop: any }[] = []
  for (let si = 0; si < 3; si++) for (const e of enrolBySession[si]!) {
    if (!chance(0.3)) continue
    const rt = routes.find(r => r.b.id === e.st._branch)!; const stop = pick(rt.stops)
    put('StudentTransportAssignment', { tenantId, branchId: rt.b.id, academicSessionId: sessions[si]!.id, studentId: e.st.id, routeId: rt.r.id, pickupStopId: stop.id, dropStopId: stop.id, tripType: 'TWO_WAY', startDate: e.first ? e.st.admissionDate : SESSIONS[si]!.start, endDate: si < 2 ? SESSIONS[si]!.end : null, status: si < 2 ? 'CANCELLED' : 'ACTIVE', monthlyFeeCents: 1500_00 })
    if (si === 2) riders.push({ st: e.st, route: rt, stop })
  }
  for (const rt of routes) {
    const rr = riders.filter(x => x.route === rt)
    for (const d of schoolDays[2]!.slice(-30)) for (const tt of ['MORNING', 'EVENING'] as const) {
      const delay = chance(0.15) ? int(5, 25) : 0
      const trip = put('TransportTrip', { id: id(), tenantId, branchId: rt.b.id, routeId: rt.r.id, vehicleId: rt.v.id, driverProfileId: rt.driver.sp.id, attendantProfileId: rt.att.sp.id, tripDate: d, tripType: tt, status: 'COMPLETED', scheduledStartTime: tt === 'MORNING' ? '07:30' : '13:00', actualStartTime: addDays(d, (tt === 'MORNING' ? 7.5 : 13) / 24 + delay / 1440), actualEndTime: addDays(d, (tt === 'MORNING' ? 8.5 : 14) / 24), delayMinutes: delay, delayReason: delay ? 'Traffic' : null })
      for (const x of rr) { const absent = chance(0.07); put('TripManifestItem', { tripId: trip.id, studentId: x.st.id, stopId: x.stop.id, status: absent ? 'ABSENT' : tt === 'MORNING' ? 'ARRIVAL_VERIFIED' : 'DROPPED', boardedAt: absent ? null : trip.actualStartTime, droppedAt: absent ? null : trip.actualEndTime, actionById: rt.att.user.id, actionByName: rt.att.user.fullName }) }
      if (chance(0.03)) put('TransportIncident', { tenantId, branchId: rt.b.id, tripId: trip.id, vehicleId: rt.v.id, severity: pick(['LOW', 'MEDIUM']), category: pick(['TRAFFIC_DELAY', 'BREAKDOWN', 'STUDENT_ILLNESS']), title: 'Trip incident', description: 'Reported by attendant during trip', status: 'RESOLVED', reportedById: rt.att.user.id, reportedByName: rt.att.user.fullName, resolvedAt: addDays(d, 0.6) })
    }
    for (const x of rr.slice(0, 5)) {
      const g = guardiansByStudent.get(x.st.id)![1]
      const at = between(addDays(TODAY, -60), TODAY)
      const auth = put('TransportPickupAuthorization', { id: id(), tenantId, branchId: rt.b.id, studentId: x.st.id, guardianId: g.id, personName: personName(), phone: phone(), relationship: 'Uncle', reason: 'Parents travelling', validFrom: at, validUntil: addDays(at, 1), isOneTime: true, status: pick(['USED', 'APPROVED', 'EXPIRED']), approvedById: principal.user.id, approvedByName: principal.user.fullName, approvedAt: at })
      put('TransportSecurityEvent', { tenantId, branchId: rt.b.id, studentId: x.st.id, eventType: pick(['PIN_VERIFICATION_SUCCESS', 'QR_SCAN', 'AUTHORIZATION_APPROVED', 'PIN_VERIFICATION_FAILED']), driverProfileId: rt.driver.sp.id, vehicleId: rt.v.id, routeId: rt.r.id, authorizationId: auth.id, actorId: rt.att.user.id, actorName: rt.att.user.fullName, actorRole: 'ATTENDANT', action: 'VERIFY_PICKUP', result: 'SUCCESS', createdAt: at })
    }
  }

  // ── reports, documents, notifications, jobs, audit ──
  const rep = ['Fee collection', 'Attendance summary', 'Admissions funnel', 'Staff attendance', 'Inventory valuation'].map(nm => put('SavedReport', { id: id(), tenantId, branchId: null, name: nm, module: pick(['fees', 'students', 'admissions', 'hr', 'inventory']), source: 'students', fields: ['name', 'status'], filters: {}, createdById: owner.user.id, createdByName: owner.user.fullName, isPublic: true }))
  rep.slice(0, 2).forEach(r => put('ReportSchedule', { tenantId, savedReportId: r.id, frequency: 'WEEKLY', exportFormat: 'CSV', recipients: [owner.user.email], nextRunAt: addDays(TODAY, 3), lastRunAt: addDays(TODAY, -4) }))
  const job = put('BulkDocumentJob', { id: id(), tenantId, branchId: branches[0]!.id, templateId: templates[1]!.id, title: 'ID cards 2026-27', templateName: templates[1]!.name, documentType: 'ID_CARD', status: 'COMPLETED', totalCount: 10, processedCount: 10, successCount: 10, createdById: owner.user.id, createdByName: owner.user.fullName, startedAt: addDays(SESSIONS[2]!.start, 10), completedAt: addDays(SESSIONS[2]!.start, 10) })
  for (const st of students.filter(s => s.status === 'ACTIVE').slice(0, 10)) {
    const doc = put('GeneratedProfileDocument', { id: id(), tenantId, branchId: st._branch, studentId: st.id, jobId: job.id, entityType: 'STUDENT', templateId: templates[1]!.id, templateVersion: 1, documentType: 'ID_CARD', title: `ID Card — ${st.firstName}`, fileName: `${st.admissionNo}.pdf`, fileUrl: `https://cdn.preone.demo/docs/${st.id}.pdf`, fileSizeBytes: int(40000, 90000), mimeType: 'application/pdf', createdById: owner.user.id, createdByName: owner.user.fullName })
    put('BulkDocumentJobItem', { jobId: job.id, tenantId, documentId: doc.id, entityType: 'STUDENT', entityId: st.id, entityName: `${st.firstName} ${st.lastName}`, identifier: st.admissionNo, status: 'COMPLETED', fileUrl: doc.fileUrl })
  }
  put('GeneratedProfileDocument', { tenantId, staffProfileId: principal.sp.id, entityType: 'STAFF', documentType: 'EXPERIENCE_LETTER', title: 'Experience letter', fileName: 'experience.pdf', fileUrl: 'https://cdn.preone.demo/docs/exp.pdf', mimeType: 'application/pdf' })
  for (const jt of ['CSV_IMPORT', 'REPORT_EXPORT', 'BULK_DOCUMENTS']) put('BackgroundJob', { tenantId, jobType: jt, status: 'COMPLETED', progress: 100, payload: {}, result: { ok: true }, startedAt: addDays(TODAY, -int(1, 200)), completedAt: addDays(TODAY, -1), createdById: owner.user.id })
  for (const s of staff.slice(0, 8)) for (let k = 0; k < 15; k++) { const at = between(addDays(TODAY, -90), TODAY); put('InAppNotification', { tenantId, userId: s.user.id, title: pick(['New admission enquiry', 'Fee payment received', 'Leave request pending', 'Low stock alert', 'Incident reported']), body: 'Tap to view details.', category: pick(['ADMISSIONS', 'FEES', 'HR', 'INVENTORY', 'TRANSPORT']), severity: pick(['INFO', 'WARNING']), isRead: at < addDays(TODAY, -7), readAt: at < addDays(TODAY, -7) ? addDays(at, 1) : null, createdAt: at }) }
  for (let k = 0; k < 150; k++) { const g = guardiansByStudent.get(pick(students).id)![0]; const at = between(SESSIONS[0]!.start, TODAY); put('NotificationDeliveryLog', { tenantId, eventType: pick(['FEE_REMINDER', 'DAILY_REPORT', 'ANNOUNCEMENT', 'ATTENDANCE_ABSENT']), channel: pick(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH']), recipientType: 'GUARDIAN', recipientId: g.id, recipientAddress: g.phone, title: 'School update', body: 'Please check the PreOne app.', status: chance(0.95) ? 'DELIVERED' : 'FAILED', createdAt: at }) }
  for (let k = 0; k < 300; k++) { const s = pick(staff); const at = between(createdAt, TODAY); put('AuditLog', { tenantId, branchId: s.branchId, actorId: s.user.id, actorName: s.user.fullName, actorRole: s.role, action: pick(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT']), entity: pick(['Student', 'Invoice', 'Payment', 'Attendance', 'StaffProfile', 'Lead']), entityId: id(), module: pick(['students', 'fees', 'hr', 'admissions']), summary: 'Record changed via dashboard', severity: 'INFO', ipAddress: `10.0.${int(0, 255)}.${int(1, 254)}`, createdAt: at }) }

  for (const st of students) { delete st._spans; delete st._branch; delete st._startSi }
  await flush()
}

async function main() {
  const t0 = Date.now()
  console.log('Truncating all tables…')
  const tables = MODELS.map(m => `"${(m.dbName ?? m.name)}"`).join(', ')
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`)
  const hash = await bcrypt.hash(PASSWORD, 10)
  // split 10,000 students across 100 schools (40..160 each, exact total)
  const weights = Array.from({ length: SCHOOLS }, () => 40 + rnd() * 120)
  const sum = weights.reduce((a, b) => a + b, 0)
  const counts = weights.map(w => Math.floor((w / sum) * STUDENTS))
  for (let i = 0; counts.reduce((a, b) => a + b, 0) < STUDENTS; i++) counts[i % SCHOOLS]!++
  const parentCounter = { n: 0 }
  for (let n = 1; n <= SCHOOLS; n++) {
    await seedSchool(n, counts[n - 1]!, hash, parentCounter)
    console.log(`school ${n}/${SCHOOLS} (${counts[n - 1]} students) — ${Math.round((Date.now() - t0) / 1000)}s`)
  }
  const empty = MODELS.filter(m => !totals[m.name]).map(m => m.name)
  console.table(Object.fromEntries(ORDER.filter(m => totals[m]).map(m => [m, totals[m]])))
  console.log(empty.length ? `Models without rows: ${empty.join(', ')}` : 'All models populated.')
  console.log(`Done in ${Math.round((Date.now() - t0) / 1000)}s`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
