import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function runTests() {
  console.log('🧪 Starting Acceptance & Security Tests for Parent Enhancements...\n')

  const BASE = 'http://localhost:3000'

  // 1. Authenticate via /api/v1/auth/login
  console.log('Authenticating parent ruchita.419...')
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ruchita.419',
      password: 'Preone@123',
    }),
  })

  const loginJson = await loginRes.json()
  if (!loginJson.success) {
    throw new Error(`Login failed for ruchita.419: ${JSON.stringify(loginJson)}`)
  }

  const setCookie = loginRes.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error('No set-cookie returned from login')
  }

  // Extract preone_session cookie
  const match = setCookie.match(/preone_session=([^;]+)/)
  const sessionCookie = match ? match[0] : setCookie.split(';')[0]
  const headers = {
    Cookie: sessionCookie,
  }

  console.log('✓ Successfully logged in as ruchita.419!')

  // 2. Query DB to verify linked student
  const parentUser = await db.user.findFirst({
    where: { username: 'ruchita.419' },
  })

  if (!parentUser) throw new Error('Parent user not found')

  const guardian = await db.guardian.findFirst({
    where: { userId: parentUser.id },
    include: {
      studentLinks: {
        include: {
          student: {
            include: {
              currentClassroom: true,
            },
          },
        },
      },
    },
  })

  const student = guardian?.studentLinks[0]?.student
  if (!student) {
    throw new Error('No linked student found in DB for ruchita.419')
  }

  console.log(`✓ Linked Student: ${student.firstName} (ID: ${student.id})`)
  console.log(`✓ Assigned Classroom: ${student.currentClassroom?.name} (ID: ${student.currentClassroom?.id})\n`)

  // TEST 1: GET /api/v1/parent/today includes scheduledDiary
  console.log('--- TEST 1: Scheduled Daily Diary in /api/v1/parent/today ---')
  const resToday = await fetch(`${BASE}/api/v1/parent/today`, { headers })
  const jsonToday = await resToday.json()
  if (!jsonToday.success) {
    throw new Error(`Failed /api/v1/parent/today: ${JSON.stringify(jsonToday)}`)
  }
  const childData = jsonToday.data.children.find((c: any) => c.id === student.id)
  if (!childData) throw new Error('Student missing from /parent/today response')
  console.log('Child name:', childData.name)
  console.log('Scheduled Diary present?', !!childData.scheduledDiary)
  console.log('Scheduled Activities count for today:', childData.scheduledDiary?.activities?.length)
  if (childData.scheduledDiary?.activities?.length > 0) {
    console.log('Activity 1:', childData.scheduledDiary.activities[0].title, '| Status:', childData.scheduledDiary.activities[0].status, '| Time:', childData.scheduledDiary.activities[0].startTime)
  }
  if (!childData.scheduledDiary || childData.scheduledDiary.activities.length === 0) {
    throw new Error('Expected scheduledDiary with activities for child')
  }
  console.log('✓ TEST 1 PASSED: scheduledDiary returned for child in /parent/today\n')

  // TEST 2: GET /api/v1/parent/daily-diary for today
  console.log('--- TEST 2: Dedicated /api/v1/parent/daily-diary Endpoint ---')
  const resDiaryToday = await fetch(`${BASE}/api/v1/parent/daily-diary?studentId=${student.id}&date=2026-10-24`, { headers })
  const jsonDiaryToday = await resDiaryToday.json()
  if (!jsonDiaryToday.success) throw new Error(`Failed /api/v1/parent/daily-diary: ${JSON.stringify(jsonDiaryToday)}`)
  console.log('Classroom Name:', jsonDiaryToday.data.classroom?.name)
  console.log('Activities count (2026-10-24):', jsonDiaryToday.data.activities.length)
  if (jsonDiaryToday.data.activities.length === 0) throw new Error('Expected at least 1 scheduled activity on 2026-10-24')
  console.log('Activity Title:', jsonDiaryToday.data.activities[0].title)
  console.log('Activity Type:', jsonDiaryToday.data.activities[0].activityType)
  console.log('✓ TEST 2 PASSED: /api/v1/parent/daily-diary returns correct schedule\n')

  // TEST 3: GET /api/v1/parent/daily-diary for past date (2026-10-16)
  console.log('--- TEST 3: Past Date Daily Diary ---')
  const resDiaryPast = await fetch(`${BASE}/api/v1/parent/daily-diary?studentId=${student.id}&date=2026-10-16`, { headers })
  const jsonDiaryPast = await resDiaryPast.json()
  console.log('Activities count (2026-10-16):', jsonDiaryPast.data.activities.length)
  console.log('Activity Title & Status:', jsonDiaryPast.data.activities[0]?.title, jsonDiaryPast.data.activities[0]?.status)
  if (jsonDiaryPast.data.activities.length === 0) throw new Error('Expected scheduled activity on 2026-10-16')
  console.log('✓ TEST 3 PASSED: Past scheduled activity retrieved correctly\n')

  // TEST 4: GET /api/v1/parent/daily-diary for empty date (e.g. 2026-11-01)
  console.log('--- TEST 4: Empty Date Handling ---')
  const resDiaryEmpty = await fetch(`${BASE}/api/v1/parent/daily-diary?studentId=${student.id}&date=2026-11-01`, { headers })
  const jsonDiaryEmpty = await resDiaryEmpty.json()
  console.log('Activities count (2026-11-01):', jsonDiaryEmpty.data.activities.length)
  if (jsonDiaryEmpty.data.activities.length !== 0) throw new Error('Expected 0 activities on unscheduled date')
  console.log('✓ TEST 4 PASSED: Empty state returns 0 activities without error\n')

  // TEST 5: Attendance API — All Time
  console.log('--- TEST 5: Attendance API (All Time) ---')
  const resAttAll = await fetch(`${BASE}/api/v1/parent/attendance?studentId=${student.id}&period=all`, { headers })
  const jsonAttAll = await resAttAll.json()
  if (!jsonAttAll.success) throw new Error(`Failed /api/v1/parent/attendance: ${JSON.stringify(jsonAttAll)}`)
  console.log('Summary:', jsonAttAll.data.summary)
  console.log('Records count:', jsonAttAll.data.records.length)
  if (jsonAttAll.data.records.length === 0) throw new Error('Expected attendance records for student')
  console.log('✓ TEST 5 PASSED: Attendance summary and history returned\n')

  // TEST 6: Attendance API — Quick Filter Today
  console.log('--- TEST 6: Attendance API (Quick Period: Today) ---')
  const resAttToday = await fetch(`${BASE}/api/v1/parent/attendance?studentId=${student.id}&period=today`, { headers })
  const jsonAttToday = await resAttToday.json()
  console.log('Summary (Today):', jsonAttToday.data.summary)
  console.log('Records count (Today):', jsonAttToday.data.records.length)
  if (jsonAttToday.data.records.length !== 1) throw new Error('Expected 1 attendance record for today')
  console.log('✓ TEST 6 PASSED: Today attendance filter works\n')

  // TEST 7: Attendance API — Status Filter
  console.log('--- TEST 7: Attendance API (Status Filter) ---')
  const resAttPresent = await fetch(`${BASE}/api/v1/parent/attendance?studentId=${student.id}&status=PRESENT`, { headers })
  const jsonAttPresent = await resAttPresent.json()
  console.log('PRESENT records count:', jsonAttPresent.data.records.length)
  if (jsonAttPresent.data.records.length === 0) throw new Error('Expected PRESENT records')

  const resAttAbsent = await fetch(`${BASE}/api/v1/parent/attendance?studentId=${student.id}&status=ABSENT`, { headers })
  const jsonAttAbsent = await resAttAbsent.json()
  console.log('ABSENT records count:', jsonAttAbsent.data.records.length)
  console.log('ABSENT summary totalDays (period preserved):', jsonAttAbsent.data.summary.totalDays)
  if (jsonAttAbsent.data.records.length !== 0) throw new Error('Expected 0 ABSENT records')
  if (jsonAttAbsent.data.summary.totalDays === 0) throw new Error('Expected period summary to be preserved')
  console.log('✓ TEST 7 PASSED: Status filter correctly isolates records while preserving period summary\n')

  // TEST 8: Attendance API — Invalid Date Range
  console.log('--- TEST 8: Invalid Date Range Validation ---')
  const resAttInvalid = await fetch(`${BASE}/api/v1/parent/attendance?studentId=${student.id}&startDate=2026-10-30&endDate=2026-10-01`, { headers })
  const jsonAttInvalid = await resAttInvalid.json()
  console.log('Status code:', resAttInvalid.status, '| Error message:', jsonAttInvalid.error?.message)
  if (resAttInvalid.status !== 400 || !jsonAttInvalid.error?.message?.includes('cannot be after')) {
    throw new Error('Expected 400 error for invalid date range')
  }
  console.log('✓ TEST 8 PASSED: Invalid date range rejected gracefully\n')

  // TEST 9: Security Check — Cross-Parent Student Access Prevention
  console.log('--- TEST 9: Security Check — Cross-Parent Student Access Prevention ---')
  const unauthorizedStudentId = '9d4f1731-c64f-4709-9bb2-29bb094b90fa'
  const resDiaryForbidden = await fetch(`${BASE}/api/v1/parent/daily-diary?studentId=${unauthorizedStudentId}&date=2026-10-24`, { headers })
  console.log('Diary cross-access HTTP status:', resDiaryForbidden.status)
  if (resDiaryForbidden.status !== 403) {
    throw new Error('Expected 403 Forbidden for cross-family daily diary access')
  }

  const resAttForbidden = await fetch(`${BASE}/api/v1/parent/attendance?studentId=${unauthorizedStudentId}`, { headers })
  console.log('Attendance cross-access HTTP status:', resAttForbidden.status)
  if (resAttForbidden.status !== 403) {
    throw new Error('Expected 403 Forbidden for cross-family attendance access')
  }
  console.log('✓ TEST 9 PASSED: Backend strictly forbids cross-student data leakage (403 Forbidden)\n')

  // TEST 10: Classroom & Branch Isolation — Only kid's classroom and branch details returned
  console.log('--- TEST 10: Classroom & Branch Isolation Verification ---')
  console.log('Child branch name in /today:', childData.branch?.name)
  console.log('Child classroom name in /today:', childData.classroom?.name)
  if (childData.branch?.name !== 'Green Sprouts Main Branch') {
    throw new Error(`Expected branch 'Green Sprouts Main Branch', got '${childData.branch?.name}'`)
  }
  if (childData.classroom?.name !== 'Doraemon') {
    throw new Error(`Expected classroom 'Doraemon', got '${childData.classroom?.name}'`)
  }

  // Verify daily diary branch and classroom
  console.log('Diary branch name in /daily-diary:', jsonDiaryToday.data.branch?.name)
  console.log('Diary classroom name in /daily-diary:', jsonDiaryToday.data.classroom?.name)
  if (jsonDiaryToday.data.branch?.name?.trim() !== 'Green Sprouts Main Branch') {
    throw new Error(`Expected diary branch 'Green Sprouts Main Branch', got '${jsonDiaryToday.data.branch?.name}'`)
  }
  if (jsonDiaryToday.data.classroom?.name !== 'Doraemon') {
    throw new Error(`Expected diary classroom 'Doraemon', got '${jsonDiaryToday.data.classroom?.name}'`)
  }

  console.log('✓ TEST 10 PASSED: Only kid classroom and branch details are visible/fetched for parent login\n')

  console.log('🎉 ALL 10 ACCEPTANCE AND SECURITY TESTS PASSED!')
}

runTests().finally(() => db.$disconnect())
