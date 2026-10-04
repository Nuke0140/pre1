import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { TemplateService } from '../src/lib/templates/template-service'
import { TEMPLATE_PRESETS } from '../src/lib/templates/presets'
import { TemplateDefinition } from '../src/lib/templates/types'

const prisma = new PrismaClient()

export async function setupVerifiedSchool() {
  console.log('=== SETTING UP AUTHORIZED TEST SCHOOL ENVIRONMENT ===\n')

  const tenantCode = 'BVP-2026'
  let tenant = await prisma.tenant.findUnique({
    where: { code: tenantCode },
  })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Blossom Valley International Preschool',
        code: tenantCode,
        address: '#42, Blossom Garden Road, Indiranagar',
        city: 'Bengaluru, Karnataka 560038',
        phone: '+91 80 4123 4567',
        email: 'office@blossomvalley.edu',
      },
    })
    console.log(`[Created Tenant] ${tenant.name} (${tenant.id})`)
  } else {
    console.log(`[Found Tenant] ${tenant.name} (${tenant.id})`)
  }

  // Branch
  let branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, code: 'BVP-BLR-01' },
  })
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Indiranagar Main Campus',
        code: 'BVP-BLR-01',
        address: '#42, Blossom Garden Road, Indiranagar',
        city: 'Bengaluru',
        phone: '+91 80 4123 4567',
        timingOpen: '08:30',
        timingClose: '16:00',
        isMain: true,
      },
    })
    console.log(`[Created Branch] ${branch.name} (${branch.id})`)
  }

  // Academic Session
  let session = await prisma.academicSession.findFirst({
    where: { tenantId: tenant.id, name: '2026-2027' },
  })
  if (!session) {
    session = await prisma.academicSession.create({
      data: {
        tenantId: tenant.id,
        name: '2026-2027',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    })
    console.log(`[Created Session] ${session.name} (${session.id})`)
  }

  // Classroom
  let classroom = await prisma.classroom.findFirst({
    where: { tenantId: tenant.id, code: 'CLS-PREK-01' },
  })
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        academicSessionId: session.id,
        name: 'Butterflies Pre-K',
        code: 'CLS-PREK-01',
        programType: 'PLAYGROUP',
        capacity: 20,
      },
    })
    console.log(`[Created Classroom] ${classroom.name} (${classroom.id})`)
  }

  // Principal User
  const principalEmail = 'dr.meenakshi@blossomvalley.edu'
  let principalUser = await prisma.user.findFirst({
    where: { email: principalEmail },
  })
  const hashedPw = await bcrypt.hash('PreOne@2026!', 10)
  if (!principalUser) {
    principalUser = await prisma.user.create({
      data: {
        email: principalEmail,
        username: 'principal_meenakshi',
        fullName: 'Dr. Meenakshi Sundaram',
        passwordHash: hashedPw,
        phone: '+91 98450 99887',
      },
    })
    console.log(`[Created Principal User] ${principalUser.fullName}`)
  }

  // Principal Membership
  const membership = await prisma.tenantUser.findFirst({
    where: { tenantId: tenant.id, userId: principalUser.id },
  })
  if (!membership) {
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: principalUser.id,
        role: 'PRINCIPAL',
      },
    })
    console.log(`[Created Principal Tenant Membership]`)
  }

  // Authorized Student Record
  let student = await prisma.student.findFirst({
    where: { tenantId: tenant.id, admissionNo: 'PRE-2026-0042' },
  })
  if (!student) {
    student = await prisma.student.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        admissionNo: 'PRE-2026-0042',
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        dob: new Date('2022-05-14'),
        bloodGroup: 'B_POSITIVE',
        currentClassroomId: classroom.id,
        seatNumber: '12',
        address: 'Flat 4B, Greenwood Heights, Indiranagar, Bengaluru',
        photoUrl: '/sample-child-avatar.png',
      },
    })
    console.log(`[Created Student] ${student.firstName} ${student.lastName} (${student.admissionNo})`)
  }

  // Guardian
  let guardian = await prisma.guardian.findFirst({
    where: { tenantId: tenant.id, phone: '+91 98450 12345' },
  })
  if (!guardian) {
    guardian = await prisma.guardian.create({
      data: {
        tenantId: tenant.id,
        fullName: 'Vikram Sharma',
        relationship: 'FATHER',
        phone: '+91 98450 12345',
        email: 'vikram.sharma@example.com',
      },
    })
    await prisma.studentGuardian.create({
      data: {
        studentId: student.id,
        guardianId: guardian.id,
        relationship: 'FATHER',
        isPrimary: true,
      },
    })
    console.log(`[Created Guardian] ${guardian.fullName}`)
  }

  // Authorized Staff User & Profile
  const staffEmail = 'anita.d@blossomvalley.edu'
  let staffUser = await prisma.user.findFirst({
    where: { email: staffEmail },
  })
  if (!staffUser) {
    staffUser = await prisma.user.create({
      data: {
        email: staffEmail,
        username: 'anita_deshmukh',
        fullName: 'Anita Deshmukh',
        passwordHash: hashedPw,
        phone: '+91 97412 88990',
        avatarUrl: '/sample-staff-avatar.png',
      },
    })
    console.log(`[Created Staff User] ${staffUser.fullName}`)
  }

  let staffProfile = await prisma.staffProfile.findFirst({
    where: { tenantId: tenant.id, employeeCode: 'EMP-014' },
  })
  if (!staffProfile) {
    staffProfile = await prisma.staffProfile.create({
      data: {
        tenantId: tenant.id,
        userId: staffUser.id,
        branchId: branch.id,
        employeeCode: 'EMP-014',
        designation: 'Senior Early Educator',
        department: 'Academics & Early Childhood',
        emergencyContactPhone: '+91 97412 88990',
      },
    })
    console.log(`[Created Staff Profile] ${staffProfile.employeeCode} (${staffProfile.designation})`)
  }

  // Student ID Card Template
  let studentTemplate = await prisma.documentTemplate.findFirst({
    where: { tenantId: tenant.id, type: 'STUDENT_ID_CARD' },
  })
  if (!studentTemplate) {
    studentTemplate = await TemplateService.createTemplate(tenant.id, {
      name: 'Official Student Smart Card',
      type: 'STUDENT_ID_CARD',
      presetKey: 'STUDENT_ID_CARD',
      createdByName: 'Dr. Meenakshi Sundaram',
      actorId: principalUser.id,
    })
    // Publish to version 2
    studentTemplate = await TemplateService.publishTemplate(
      tenant.id,
      studentTemplate.id,
      'Dr. Meenakshi Sundaram',
      principalUser.id
    )
    console.log(`[Created Student Template] ${studentTemplate.name} (v2 PUBLISHED)`)
  }

  // Staff ID Card Template
  let staffTemplate = await prisma.documentTemplate.findFirst({
    where: { tenantId: tenant.id, type: 'STAFF_ID_CARD' },
  })
  if (!staffTemplate) {
    staffTemplate = await TemplateService.createTemplate(tenant.id, {
      name: 'Faculty & Educator Credential Badge',
      type: 'STAFF_ID_CARD',
      presetKey: 'STAFF_ID_CARD',
      createdByName: 'Dr. Meenakshi Sundaram',
      actorId: principalUser.id,
    })
    // Publish to version 2
    staffTemplate = await TemplateService.publishTemplate(
      tenant.id,
      staffTemplate.id,
      'Dr. Meenakshi Sundaram',
      principalUser.id
    )
    console.log(`[Created Staff Template] ${staffTemplate.name} (v2 PUBLISHED)`)
  }

  console.log('\n=== ENVIRONMENT READY FOR E2E VERIFICATION ===')
  console.log(`Tenant ID: ${tenant.id}`)
  console.log(`Principal User: ${principalUser.email} (Password: PreOne@2026!)`)
  console.log(`Student Record: ${student.firstName} ${student.lastName} (Adm: ${student.admissionNo})`)
  console.log(`Staff Record: ${staffUser.fullName} (Emp: ${staffProfile.employeeCode})`)
  console.log(`Student Template ID: ${studentTemplate.id}`)
  console.log(`Staff Template ID: ${staffTemplate.id}`)

  return {
    tenant,
    branch,
    session,
    classroom,
    principalUser,
    student,
    staffProfile,
    staffUser,
    studentTemplate,
    staffTemplate,
  }
}

if (import.meta.main) {
  setupVerifiedSchool()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}
