import { describe, it, expect, beforeAll } from 'bun:test'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { signSession } from '@/lib/auth'
import { POST as csvPost } from '@/app/api/v1/users/csv/route'
import { GET as jobGet } from '@/app/api/v1/jobs/[id]/route'
import { GET as errorReportGet, POST as errorReportPost } from '@/app/api/v1/users/csv/error-report/route'
import { enqueueJob, getJob, processJob } from '@/lib/jobs'

describe('Async CSV Import Engine & Background Job Worker (Doc 3.3 Audit)', () => {
  let tenantA: any
  let branchA: any
  let tenantB: any
  let adminA: any
  let adminB: any
  let cookieA: string
  let cookieB: string

  const ts = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  beforeAll(async () => {
    // School A
    tenantA = await db.tenant.create({
      data: {
        name: `Async CSV School A ${ts.slice(-4)}`,
        code: `ASYNCA-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    branchA = await db.branch.create({
      data: {
        tenantId: tenantA.id,
        name: 'Main Campus',
        code: `MAIN-${ts.slice(-4)}`,
        isMain: true,
      },
    })

    adminA = await db.user.create({
      data: {
        email: `adminA_${ts}@preone-async.com`,
        username: `adminA_${ts}`,
        fullName: 'Async Admin A',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantA.id,
        userId: adminA.id,
        role: 'PRINCIPAL',
        status: 'ACTIVE',
      },
    })

    cookieA = await signSession({
      uid: adminA.id,
      email: adminA.email,
      name: adminA.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantA.id,
    })

    // School B
    tenantB = await db.tenant.create({
      data: {
        name: `Async CSV School B ${ts.slice(-4)}`,
        code: `ASYNCB-${ts.slice(-4)}`,
        status: 'ACTIVE',
      },
    })

    adminB = await db.user.create({
      data: {
        email: `adminB_${ts}@preone-async.com`,
        username: `adminB_${ts}`,
        fullName: 'Async Admin B',
        status: 'ACTIVE',
        passwordHash: '$2b$10$hashedtestpasswordstringhere',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId: tenantB.id,
        userId: adminB.id,
        role: 'PRINCIPAL',
        status: 'ACTIVE',
      },
    })

    cookieB = await signSession({
      uid: adminB.id,
      email: adminB.email,
      name: adminB.fullName,
      role: 'PRINCIPAL',
      tenantId: tenantB.id,
    })
  })

  it('1. POST /api/v1/users/csv with async: true enqueues BackgroundJob and returns HTTP 202 Accepted', async () => {
    const csvContent = [
      'fullName,email,role',
      `Test Teacher 1,teacher1_${ts}@school.com,TEACHER`,
      `Test Teacher 2,teacher2_${ts}@school.com,TEACHER`,
    ].join('\n')

    // 1. Preview
    const prevReq = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieA}`,
      },
      body: JSON.stringify({
        action: 'preview',
        type: 'STAFF',
        csv: csvContent,
      }),
    })
    const prevRes = await csvPost(prevReq)
    expect(prevRes.status).toBe(200)
    const prevData = await prevRes.json()
    expect(prevData.data.validRows).toBe(2)

    // 2. Execute with async: true
    const execReq = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieA}`,
      },
      body: JSON.stringify({
        action: 'execute',
        type: 'STAFF',
        previewRows: prevData.data.rows,
        async: true,
      }),
    })
    const execRes = await csvPost(execReq)
    expect(execRes.status).toBe(202)
    const execJson = await execRes.json()
    expect(execJson.async).toBe(true)
    expect(execJson.jobId).toBeDefined()
    expect(execJson.status).toBe('PENDING')

    // Verify job in database
    const dbJob = await getJob(execJson.jobId, tenantA.id)
    expect(dbJob).not.toBeNull()
    expect(dbJob?.jobType).toBe('CSV_IMPORT')
    expect(dbJob?.tenantId).toBe(tenantA.id)

    // Wait for async background worker to process and complete
    let attempts = 0
    while (attempts < 40) {
      const checkJob = await getJob(execJson.jobId, tenantA.id)
      if (checkJob?.status === 'COMPLETED') break
      await new Promise((resolve) => setTimeout(resolve, 50))
      attempts++
    }
    const finalJob = await getJob(execJson.jobId, tenantA.id)
    expect(finalJob?.status).toBe('COMPLETED')
    expect(finalJob?.progress).toBe(100)
  })

  it('2. Large CSV batches (> 25 rows) automatically enqueue as async jobs to avoid serverless timeouts', async () => {
    // Generate 28 mock preview rows
    const mockRows = Array.from({ length: 28 }, (_, i) => ({
      rowNumber: i + 1,
      status: 'VALID' as const,
      action: 'CREATE' as const,
      identifier: `auto_async_${i}_${ts}@school.com`,
      name: `Auto Async ${i}`,
      role: 'TEACHER',
      details: 'CREATE_STAFF',
      errors: [],
      warnings: [],
      data: {
        fullName: `Auto Async ${i}`,
        email: `auto_async_${i}_${ts}@school.com`,
        role: 'TEACHER',
      },
    }))

    const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieA}`,
      },
      body: JSON.stringify({
        action: 'execute',
        type: 'STAFF',
        previewRows: mockRows,
      }),
    })

    const res = await csvPost(req)
    expect(res.status).toBe(202)
    const json = await res.json()
    expect(json.async).toBe(true)
    expect(json.jobId).toBeDefined()
    expect(json.total).toBe(28)
  })

  it('3. Small CSV batches (<= 25 rows) execute synchronously by default for backward compatibility', async () => {
    const mockRows = [
      {
        rowNumber: 1,
        status: 'VALID' as const,
        action: 'CREATE' as const,
        identifier: `sync_teacher_${ts}@school.com`,
        name: 'Sync Teacher',
        role: 'TEACHER',
        details: 'CREATE_STAFF',
        errors: [],
        warnings: [],
        data: {
          fullName: 'Sync Teacher',
          email: `sync_teacher_${ts}@school.com`,
          role: 'TEACHER',
        },
      },
    ]

    const req = new NextRequest('http://localhost:3000/api/v1/users/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `preone_session=${cookieA}`,
      },
      body: JSON.stringify({
        action: 'execute',
        type: 'STAFF',
        previewRows: mockRows,
        async: false,
      }),
    })

    const res = await csvPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.createdCount).toBe(1)
    expect(json.data.total).toBe(1)
  })

  it('4. Background job processor handles chunked execution, updates progress, and records results', async () => {
    const test4Id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const importRows = [
      {
        rowNumber: 1,
        status: 'VALID' as const,
        action: 'CREATE' as const,
        identifier: `bg_worker_1_${test4Id}@school.com`,
        name: 'BG Worker 1',
        role: 'TEACHER',
        details: 'CREATE_STAFF',
        errors: [],
        warnings: [],
        data: {
          fullName: 'BG Worker 1',
          email: `bg_worker_1_${test4Id}@school.com`,
          role: 'TEACHER',
        },
      },
      {
        rowNumber: 2,
        status: 'BLOCKED' as const,
        action: 'BLOCK' as const,
        identifier: `bg_worker_2_${test4Id}@school.com`,
        name: 'BG Worker 2',
        role: 'TEACHER',
        details: 'Invalid record',
        errors: ['PAN number format invalid'],
        warnings: [],
        data: {
          fullName: 'BG Worker 2',
          email: `bg_worker_2_${test4Id}@school.com`,
          role: 'TEACHER',
        },
      },
    ]

    const job = await enqueueJob({
      tenantId: tenantA.id,
      jobType: 'CSV_IMPORT',
      createdById: adminA.id,
      payload: {
        templateType: 'STAFF',
        rows: importRows,
        options: { chunkSize: 1 },
      },
    })

    // Process job synchronously
    await processJob(job.id)

    const updatedJob = await getJob(job.id, tenantA.id)
    expect(updatedJob?.status).toBe('COMPLETED')
    expect(updatedJob?.progress).toBe(100)
    const result = updatedJob?.result as any
    expect(result.createdCount).toBe(1)
    expect(result.blockedCount).toBe(1)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0].message).toContain('PAN number format invalid')
  })

  it('5. GET /api/v1/jobs/[id] allows tenant admin to poll import status and enforces cross-tenant isolation', async () => {
    // 1. Create a job for tenant A
    const jobA = await enqueueJob({
      tenantId: tenantA.id,
      jobType: 'CSV_IMPORT',
      createdById: adminA.id,
      payload: {
        templateType: 'STAFF',
        rows: [],
      },
    })

    // 2. Admin A can poll job A
    const pollReqA = new NextRequest(`http://localhost:3000/api/v1/jobs/${jobA.id}`, {
      headers: { cookie: `preone_session=${cookieA}` },
    })
    const pollResA = await jobGet(pollReqA, { params: Promise.resolve({ id: jobA.id }) })
    expect(pollResA.status).toBe(200)
    const jsonA = await pollResA.json()
    expect(jsonA.data.id).toBe(jobA.id)
    expect(jsonA.data.tenantId).toBe(tenantA.id)

    // 3. Admin B cannot poll job A (cross-tenant isolation returns 404)
    const pollReqB = new NextRequest(`http://localhost:3000/api/v1/jobs/${jobA.id}`, {
      headers: { cookie: `preone_session=${cookieB}` },
    })
    const pollResB = await jobGet(pollReqB, { params: Promise.resolve({ id: jobA.id }) })
    expect(pollResB.status).toBe(404)
  })

  it('6. GET /api/v1/users/csv/error-report?jobId=[id] generates downloadable CSV with spreadsheet formula injection defense', async () => {
    // Create a job with dangerous formula injection payloads in errors
    const dangerousJob = await db.backgroundJob.create({
      data: {
        tenantId: tenantA.id,
        jobType: 'CSV_IMPORT',
        status: 'COMPLETED',
        progress: 100,
        result: {
          total: 2,
          createdCount: 0,
          blockedCount: 2,
          errors: [
            {
              rowNumber: 2,
              identifier: '=1+2',
              message: '@SUM(A1:A10) formula injection test',
            },
            {
              rowNumber: 3,
              identifier: '+cmd|"/C calc"!A0',
              message: '-DDE formula test',
            },
          ],
        },
      },
    })

    const req = new NextRequest(
      `http://localhost:3000/api/v1/users/csv/error-report?jobId=${dangerousJob.id}`,
      {
        headers: { cookie: `preone_session=${cookieA}` },
      }
    )

    const res = await errorReportGet(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain(`users_import_errors_${dangerousJob.id}.csv`)

    const csvText = await res.text()
    // Verify formula characters are safely escaped with leading single quote `'`
    expect(csvText).toContain("'=1+2")
    expect(csvText).toContain("'+cmd|")
    expect(csvText).toContain("'@SUM")
    expect(csvText).toContain("'-DDE")
  })
})
