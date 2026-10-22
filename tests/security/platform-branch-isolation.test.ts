import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'

// Route Handlers
import { GET as appDetailGet, PATCH as appDetailPatch } from '@/app/api/v1/applications/[id]/route'
import { POST as appApprovePost } from '@/app/api/v1/applications/[id]/approve/route'
import { GET as leadDetailGet, PATCH as leadDetailPatch } from '@/app/api/v1/leads/[id]/route'
import { POST as leadImportPost } from '@/app/api/v1/leads/import/route'
import { GET as stockGet } from '@/app/api/v1/inventory/stock/route'
import { POST as adjustmentPost } from '@/app/api/v1/inventory/adjustments/route'
import { POST as mrApprovePost } from '@/app/api/v1/inventory/material-requests/[id]/approve/route'
import { POST as poApprovePost } from '@/app/api/v1/inventory/purchase-orders/[id]/approve/route'
import { GET as inventoryExportGet } from '@/app/api/v1/inventory/export/route'
import { GET as studentsGet, POST as studentsPost } from '@/app/api/v1/students/route'
import { POST as studentTransferPost } from '@/app/api/v1/students/[id]/transfer/route'
import { POST as classroomPost } from '@/app/api/v1/classrooms/route'
import { GET as attendanceGet, POST as attendancePost } from '@/app/api/v1/attendance/route'
import { GET as attendanceExportGet } from '@/app/api/v1/attendance/export/route'
import { GET as dashboardGet } from '@/app/api/v1/dashboard/route'
import { POST as bulkInvoicePost } from '@/app/api/v1/invoices/bulk/route'
import { GET as announcementsGet, POST as announcementsPost } from '@/app/api/v1/announcements/route'
import { GET as announcementDetailGet } from '@/app/api/v1/announcements/[id]/route'

describe('PreOne Platform-Wide RBAC and Branch-Wise Data Isolation', () => {
  let tenant1: any
  let tenant2: any
  let branchA: any
  let branchB: any
  let branchC: any // in tenant2

  let ownerUser: any
  let ownerCookie: string

  let branchAAdmin: any
  let branchAAdminCookie: string

  let branchBAdmin: any
  let branchBAdminCookie: string

  let parentUser: any
  let parentCookie: string

  let classroomA: any
  let classroomB: any

  let studentA: any
  let studentB: any
  let guardianA: any

  let appA: any
  let appB: any

  let leadA: any
  let leadB: any

  let itemA: any
  let itemB: any
  let locA: any
  let locB: any

  let mrB: any
  let poB: any
  let vendorB: any

  let announcementB: any

  const ts = `${Date.now()}`

  beforeAll(async () => {
    // 1. Setup Tenant 1 and Branches
    tenant1 = await db.tenant.create({
      data: {
        name: `Security Isolation Tenant 1 ${ts.slice(-4)}`,
        code: `SEC1-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    tenant2 = await db.tenant.create({
      data: {
        name: `Security Isolation Tenant 2 ${ts.slice(-4)}`,
        code: `SEC2-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenant1.id,
        name: 'Alpha Campus',
        code: `ALP-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    branchB = await db.branch.create({
      data: {
        tenantId: tenant1.id,
        name: 'Beta Campus',
        code: `BET-${ts.slice(-4)}`,
        isMain: false,
      },
    })

    branchC = await db.branch.create({
      data: {
        tenantId: tenant2.id,
        name: 'Gamma Campus',
        code: `GAM-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    // 2. Setup Owner
    ownerUser = await db.user.create({
      data: {
        email: `owner.plat.${ts}@test.com`,
        fullName: 'Global School Owner',
        username: `owner.plat.${ts}`,
        passwordHash: 'dummy',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: ownerUser.id,
        role: 'OWNER',
        roles: ['OWNER'],
        status: 'ACTIVE',
      },
    })
    ownerCookie = await signSession({
      uid: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.fullName,
      tenantId: tenant1.id,
      role: 'OWNER',
      roles: ['OWNER'],
    })

    // 3. Setup Branch A Admin (Principal)
    branchAAdmin = await db.user.create({
      data: {
        email: `admin.a.${ts}@test.com`,
        fullName: 'Admin Branch Alpha',
        username: `admin.a.${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuAdminA = await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: branchAAdmin.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant1.id,
        tenantUserId: tuAdminA.id,
        branchId: branchA.id,
        isPrimary: true,
      },
    })
    branchAAdminCookie = await signSession({
      uid: branchAAdmin.id,
      email: branchAAdmin.email,
      name: branchAAdmin.fullName,
      tenantId: tenant1.id,
      branchId: branchA.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    // 4. Setup Branch B Admin
    branchBAdmin = await db.user.create({
      data: {
        email: `admin.b.${ts}@test.com`,
        fullName: 'Admin Branch Beta',
        username: `admin.b.${ts}`,
        passwordHash: 'dummy',
      },
    })
    const tuAdminB = await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: branchBAdmin.id,
        role: 'PRINCIPAL',
        roles: ['PRINCIPAL'],
        branchId: branchB.id,
        status: 'ACTIVE',
      },
    })
    await db.tenantUserBranch.create({
      data: {
        tenantId: tenant1.id,
        tenantUserId: tuAdminB.id,
        branchId: branchB.id,
        isPrimary: true,
      },
    })
    branchBAdminCookie = await signSession({
      uid: branchBAdmin.id,
      email: branchBAdmin.email,
      name: branchBAdmin.fullName,
      tenantId: tenant1.id,
      branchId: branchB.id,
      role: 'PRINCIPAL',
      roles: ['PRINCIPAL'],
    })

    // 5. Setup Parent User
    parentUser = await db.user.create({
      data: {
        email: `parent.${ts}@test.com`,
        fullName: 'Parent User One',
        username: `parent.${ts}`,
        passwordHash: 'dummy',
      },
    })
    await db.tenantUser.create({
      data: {
        tenantId: tenant1.id,
        userId: parentUser.id,
        role: 'PARENT',
        roles: ['PARENT'],
        branchId: branchA.id,
        status: 'ACTIVE',
      },
    })
    parentCookie = await signSession({
      uid: parentUser.id,
      email: parentUser.email,
      name: parentUser.fullName,
      tenantId: tenant1.id,
      branchId: branchA.id,
      role: 'PARENT',
      roles: ['PARENT'],
    })

    // 6. Setup Academic Session & Classrooms
    const academicSession1 = await db.academicSession.create({
      data: {
        tenantId: tenant1.id,
        name: `Academic Year ${ts}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isCurrent: true,
      },
    })

    classroomA = await db.classroom.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        academicSessionId: academicSession1.id,
        name: `Room Alpha ${ts.slice(-3)}`,
        code: `RMA-${ts.slice(-3)}`,
        capacity: 20,
        programType: 'PLAYGROUP',
      },
    })

    classroomB = await db.classroom.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        academicSessionId: academicSession1.id,
        name: `Room Beta ${ts.slice(-3)}`,
        code: `RMB-${ts.slice(-3)}`,
        capacity: 20,
        programType: 'PLAYGROUP',
      },
    })

    // 7. Setup Students
    studentA = await db.student.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        currentClassroomId: classroomA.id,
        firstName: 'Child',
        lastName: 'Alpha',
        admissionNo: `ADM-A-${ts.slice(-4)}`,
        dob: new Date('2020-01-01'),
        gender: 'MALE',
        status: 'ACTIVE',
      },
    })

    studentB = await db.student.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        currentClassroomId: classroomB.id,
        firstName: 'Child',
        lastName: 'Beta',
        admissionNo: `ADM-B-${ts.slice(-4)}`,
        dob: new Date('2020-01-01'),
        gender: 'FEMALE',
        status: 'ACTIVE',
      },
    })

    // Link parent to studentA only
    guardianA = await db.guardian.create({
      data: {
        tenantId: tenant1.id,
        fullName: parentUser.fullName,
        relationship: 'MOTHER',
        phone: `9198888${ts.slice(-4)}`,
        pickupPin: '1234',
        userId: parentUser.id,
      },
    })
    await db.studentGuardian.create({
      data: {
        studentId: studentA.id,
        guardianId: guardianA.id,
        relationship: 'MOTHER',
        isPrimary: true,
      },
    })

    // 8. Setup Admissions records
    appA = await db.admissionApplication.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        academicSessionId: academicSession1.id,
        applicationNumber: `APP-A-${ts.slice(-4)}`,
        programType: 'PLAYGROUP',
        childFirstName: 'AppChild',
        childGender: 'MALE',
        parentName: 'Parent Alpha',
        parentPhone: '9888888888',
        status: 'SUBMITTED',
      },
    })

    appB = await db.admissionApplication.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        academicSessionId: academicSession1.id,
        applicationNumber: `APP-B-${ts.slice(-4)}`,
        programType: 'PLAYGROUP',
        childFirstName: 'AppChildBeta',
        childGender: 'MALE',
        parentName: 'Parent Beta',
        parentPhone: '9888888889',
        status: 'SUBMITTED',
      },
    })

    leadA = await db.lead.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        leadNumber: `LEAD-A-${ts.slice(-4)}`,
        parentName: 'LeadParent Alpha',
        phone: '9888888888',
        childName: 'LeadChild Alpha',
        status: 'NEW',
      },
    })

    leadB = await db.lead.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        leadNumber: `LEAD-B-${ts.slice(-4)}`,
        parentName: 'LeadParent Beta',
        phone: '9888888889',
        childName: 'LeadChild Beta',
        status: 'NEW',
      },
    })

    // 9. Setup Inventory records
    locA = await db.inventoryLocation.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        name: 'Warehouse Alpha',
        code: `WH-A-${ts.slice(-3)}`,
      },
    })

    locB = await db.inventoryLocation.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        name: 'Warehouse Beta',
        code: `WH-B-${ts.slice(-3)}`,
      },
    })

    const cat1 = await db.inventoryCategory.create({
      data: {
        tenantId: tenant1.id,
        name: `General Cat ${ts}`,
        code: `GCAT_${ts.slice(-4)}`,
      },
    })

    const unit1 = await db.inventoryUnit.create({
      data: {
        tenantId: tenant1.id,
        name: `Pieces ${ts}`,
        code: `PCS_${ts.slice(-4)}`,
        symbol: 'pcs',
      },
    })

    itemA = await db.inventoryItem.create({
      data: {
        tenantId: tenant1.id,
        categoryId: cat1.id,
        unitId: unit1.id,
        name: `Crayons Alpha ${ts.slice(-3)}`,
        sku: `CR-A-${ts.slice(-4)}`,
      },
    })

    itemB = await db.inventoryItem.create({
      data: {
        tenantId: tenant1.id,
        categoryId: cat1.id,
        unitId: unit1.id,
        name: `Notebooks Beta ${ts.slice(-3)}`,
        sku: `NB-B-${ts.slice(-4)}`,
      },
    })

    await db.inventoryStock.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchA.id,
        locationId: locA.id,
        itemId: itemA.id,
        quantity: 50,
        availableQuantity: 50,
      },
    })

    await db.inventoryStock.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        locationId: locB.id,
        itemId: itemB.id,
        quantity: 100,
        availableQuantity: 100,
      },
    })

    mrB = await db.materialRequest.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        requestNumber: `MR-B-${ts.slice(-4)}`,
        requestedById: branchBAdmin.id,
        requestedByName: branchBAdmin.fullName,
        requiredDate: new Date(),
        classroomId: classroomB.id,
        status: 'PENDING',
      },
    })

    vendorB = await db.vendor.create({
      data: {
        tenantId: tenant1.id,
        name: `Vendor Beta ${ts.slice(-4)}`,
        code: `VEN-B-${ts.slice(-4)}`,
      },
    })

    poB = await db.purchaseOrder.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        vendorId: vendorB.id,
        poNumber: `PO-B-${ts.slice(-4)}`,
        createdById: branchBAdmin.id,
        createdByName: branchBAdmin.fullName,
        status: 'DRAFT',
      },
    })

    // 10. Announcements
    announcementB = await db.announcement.create({
      data: {
        tenantId: tenant1.id,
        branchId: branchB.id,
        title: `Campus Beta Notice ${ts.slice(-3)}`,
        body: 'Exclusively for Campus Beta members',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        audience: 'BRANCH_PARENTS',
        type: 'IMPORTANT',
      },
    })
  })

  // =========================================================================
  // 1. ADMISSIONS MODULE ISOLATION
  // =========================================================================
  it('Admissions: Branch A Admin cannot read or modify Branch B application (403)', async () => {
    const getReq = new NextRequest(`http://localhost:3000/api/v1/applications/${appB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const getRes = await appDetailGet(getReq, { params: Promise.resolve({ id: appB.id }) })
    expect(getRes.status).toBe(403)

    const patchReq = new NextRequest(`http://localhost:3000/api/v1/applications/${appB.id}`, {
      method: 'PATCH',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentFirstName: 'IllegitimateUpdate' }),
    })
    const patchRes = await appDetailPatch(patchReq, { params: Promise.resolve({ id: appB.id }) })
    expect(patchRes.status).toBe(403)
  })

  it('Admissions: Branch A Admin cannot approve Branch B application (403)', async () => {
    const approveReq = new NextRequest(`http://localhost:3000/api/v1/applications/${appB.id}/approve`, {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewNotes: 'Attempted approval' }),
    })
    const approveRes = await appApprovePost(approveReq, { params: Promise.resolve({ id: appB.id }) })
    expect(approveRes.status).toBe(403)
  })

  it('Admissions: Branch A Admin cannot read or convert Branch B leads (403)', async () => {
    const getReq = new NextRequest(`http://localhost:3000/api/v1/leads/${leadB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const getRes = await leadDetailGet(getReq, { params: Promise.resolve({ id: leadB.id }) })
    expect(getRes.status).toBe(403)
  })

  it('Admissions: Branch A Admin cannot import leads into Branch B (403)', async () => {
    const importReq = new NextRequest('http://localhost:3000/api/v1/leads/import', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branchId: branchB.id,
        leads: [
          { parentName: 'CrossBranch Parent', phone: '9999999999', childName: 'CrossChild' },
        ],
      }),
    })
    const importRes = await leadImportPost(importReq)
    expect(importRes.status).toBe(403)
  })

  // =========================================================================
  // 2. INVENTORY MODULE ISOLATION
  // =========================================================================
  it('Inventory: Branch A Admin querying Branch B stock is rejected with 403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/inventory/stock?branchId=${branchB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await stockGet(req)
    expect(res.status).toBe(403)
  })

  it('Inventory: Branch A Admin querying stock without branchId only sees Branch A stock', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/inventory/stock', {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await stockGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
    const allBranchIds = json.data.map((s: any) => s.branchId)
    expect(allBranchIds.every((b: string) => b === branchA.id)).toBe(true)
    expect(allBranchIds.includes(branchB.id)).toBe(false)
  })

  it('Inventory: Branch A Admin cannot adjust stock in Branch B (403)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/inventory/adjustments', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branchId: branchB.id,
        locationId: locB.id,
        adjustmentType: 'COUNT_DISCREPANCY',
        reason: 'Unauthorized stock alteration attempt',
        items: [{ itemId: itemB.id, adjustedQuantity: -5 }],
      }),
    })
    const res = await adjustmentPost(req)
    expect(res.status).toBe(403)
  })

  it('Inventory: Branch A Admin cannot approve Branch B material requests (403)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/inventory/material-requests/${mrB.id}/approve`, {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes: 'Cross-campus approval' }),
    })
    const res = await mrApprovePost(req, { params: Promise.resolve({ id: mrB.id }) })
    expect(res.status).toBe(403)
  })

  it('Inventory: Branch A Admin cannot approve Branch B purchase orders (403)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/inventory/purchase-orders/${poB.id}/approve`, {
      method: 'POST',
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await poApprovePost(req, { params: Promise.resolve({ id: poB.id }) })
    expect(res.status).toBe(403)
  })

  it('Inventory: Export does not leak cross-branch stock to Branch A Admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/inventory/export?type=stock', {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await inventoryExportGet(req)
    expect(res.status).toBe(200)
    const csv = await res.text()
    expect(csv).toContain('Alpha Campus')
    expect(csv).not.toContain('Campus Beta')
  })

  // =========================================================================
  // 3. STUDENTS & CLASSROOMS ISOLATION
  // =========================================================================
  it('Students: Parent listing students only receives their own linked child', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/students', {
      headers: { cookie: `preone_session=${parentCookie}` },
    })
    const res = await studentsGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.length).toBe(1)
    expect(json.data[0].id).toBe(studentA.id)
    expect(json.data[0].admissionNo).toBe(studentA.admissionNo)
  })

  it('Students: Branch A Admin querying students with branchId=BranchB is rejected with 403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/students?branchId=${branchB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await studentsGet(req)
    expect(res.status).toBe(403)
  })

  it('Students: Branch A Admin cannot create students in Branch B (403)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/students', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Cross',
        lastName: 'Campus',
        branchId: branchB.id,
        programType: 'PLAYGROUP',
        dob: '2023-01-01',
      }),
    })
    const res = await studentsPost(req)
    expect(res.status).toBe(403)
  })

  it('Students: Branch A Admin cannot transfer a student out of Branch B (403)', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/students/${studentB.id}/transfer`, {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinationBranchId: branchA.id,
        destinationClassroomId: classroomA.id,
        reason: 'Unauthorized campus transfer',
      }),
    })
    const res = await studentTransferPost(req, { params: Promise.resolve({ id: studentB.id }) })
    expect(res.status).toBe(403)
  })

  it('Classrooms: Branch A Admin cannot create a classroom in Branch B (403)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/classrooms', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Infiltrated Room',
        programType: 'PLAYGROUP',
        branchId: branchB.id,
      }),
    })
    const res = await classroomPost(req)
    expect(res.status).toBe(403)
  })

  // =========================================================================
  // 4. ATTENDANCE & DASHBOARD ISOLATION
  // =========================================================================
  it('Attendance: Branch A Admin querying attendance for Branch B classroom is rejected with 403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/attendance?classroomId=${classroomB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await attendanceGet(req)
    expect(res.status).toBe(403)
  })

  it('Attendance: Branch A Admin marking attendance for Branch B classroom is rejected with 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/attendance', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classroomId: classroomB.id,
        date: '2026-10-21',
        entries: [{ studentId: studentB.id, status: 'PRESENT' }],
      }),
    })
    const res = await attendancePost(req)
    expect(res.status).toBe(403)
  })

  it('Attendance: Export with branchId=BranchB is rejected with 403 for Branch A Admin', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/attendance/export?branchId=${branchB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await attendanceExportGet(req)
    expect(res.status).toBe(403)
  })

  it('Dashboard: Branch A Admin querying dashboard with branchId=BranchB is rejected with 403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/dashboard?branchId=${branchB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await dashboardGet(req)
    expect(res.status).toBe(403)
  })

  it('Dashboard: Branch A Admin dashboard only counts Branch A students and classrooms', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/dashboard', {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await dashboardGet(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.students.active).toBe(1) // only studentA
    expect(json.data.classes).toBe(1) // only classroomA
  })

  // =========================================================================
  // 5. FINANCE & ANNOUNCEMENTS ISOLATION
  // =========================================================================
  it('Finance: Branch A Admin bulk-invoicing Branch B students is rejected with 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/invoices/bulk', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branchId: branchB.id,
        dueDate: '2026-11-01',
      }),
    })
    const res = await bulkInvoicePost(req)
    expect(res.status).toBe(403)
  })

  it('Announcements: Branch A Admin cannot broadcast notice specifically for Branch B (403)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/announcements', {
      method: 'POST',
      headers: {
        cookie: `preone_session=${branchAAdminCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Cross-Branch Broadcast',
        body: 'Unauthorized broadcast to Beta campus',
        audience: 'BRANCH_PARENTS',
        branchId: branchB.id,
      }),
    })
    const res = await announcementsPost(req)
    expect(res.status).toBe(403)
  })

  it('Announcements: Branch A Admin viewing detail of Branch B announcement is rejected with 403', async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/announcements/${announcementB.id}`, {
      headers: { cookie: `preone_session=${branchAAdminCookie}` },
    })
    const res = await announcementDetailGet(req, { params: Promise.resolve({ id: announcementB.id }) })
    expect(res.status).toBe(403)
  })

  // =========================================================================
  // 6. OWNER PRIVILEGES & MULTI-TENANT ISOLATION
  // =========================================================================
  it('Owner: Can legitimately access both Branch A and Branch B across tenant 1', async () => {
    const reqA = new NextRequest(`http://localhost:3000/api/v1/applications/${appA.id}`, {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const resA = await appDetailGet(reqA, { params: Promise.resolve({ id: appA.id }) })
    expect(resA.status).toBe(200)

    const reqB = new NextRequest(`http://localhost:3000/api/v1/applications/${appB.id}`, {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const resB = await appDetailGet(reqB, { params: Promise.resolve({ id: appB.id }) })
    expect(resB.status).toBe(200)
  })

  it('Owner: Is strictly forbidden from accessing Tenant 2 records (Multi-Tenant Isolation)', async () => {
    const crossTenantReq = new NextRequest(`http://localhost:3000/api/v1/inventory/stock?branchId=${branchC.id}`, {
      headers: { cookie: `preone_session=${ownerCookie}` },
    })
    const res = await stockGet(crossTenantReq)
    expect(res.status).toBe(403)
  })
})
