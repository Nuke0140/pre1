import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function runRoleTest() {
  console.log('================================================================')
  console.log('PREONE: TRANSPORT ROLE-BASED VISIBILITY & AUDIT TEST')
  console.log('================================================================\n')

  // Step 1: Login as owner
  console.log('1. Authenticating as owner@sunshine.demo...')
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual',
  })

  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionMatch = setCookie.match(/preone_session=([^;]+)/)
  const tokenMatch = setCookie.match(/preone_token=([^;]+)/)
  const sessionToken = sessionMatch ? sessionMatch[1] : ''
  const authToken = tokenMatch ? tokenMatch[1] : ''

  if (!sessionToken) {
    console.error('Failed to get session cookie!')
    process.exit(1)
  }
  console.log('Session acquired successfully.')

  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-role-test-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9800 + (randId % 60)
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ])

  browser.on('error', (err) => console.error('Browser spawn error:', err))
  await new Promise((r) => setTimeout(r, 2500))

  const listRes = await fetch(`http://localhost:${port}/json/list`).then((r) => r.json())
  const pageTarget = listRes.find((t: any) => t.type === 'page') || listRes[0]
  const wsUrl = pageTarget.webSocketDebuggerUrl

  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

  let id = 1
  const send = (method: string, params: any = {}) => {
    return new Promise<any>((resolve, reject) => {
      const curId = id++
      const handler = (evt: any) => {
        const data = JSON.parse(evt.data)
        if (data.id === curId) {
          ws.removeEventListener('message', handler)
          if (data.error) reject(data.error)
          else resolve(data.result)
        }
      }
      ws.addEventListener('message', handler)
      ws.send(JSON.stringify({ id: curId, method, params }))
    })
  }

  const evalCode = async (expression: string) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return res?.result?.value
  }

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')

  // Set cookies
  await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  if (authToken) {
    await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })
  }

  // Set viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  console.log('2. Navigating to http://localhost:3000/app/transport...')
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 5000))

  // Inspect navigation items
  const visibleTabs: string[] = (await evalCode(`
    Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .map(b => b.innerText.trim())
  `)) || []

  console.log('Visible Workspaces for Admin:', visibleTabs)

  // Verify Admin expectations
  const hasParentPortal = visibleTabs.some(t => t.toLowerCase().includes('parent'))
  const hasDriverHub = visibleTabs.some(t => t.toLowerCase().includes('driver'))
  const hasTeacherHub = visibleTabs.some(t => t.toLowerCase().includes('teacher'))

  console.log('\n--- ROLE VISIBILITY CHECKS ---')
  console.log('Parent Portal hidden from Admin:', !hasParentPortal ? '✓ PASS' : '✗ FAIL')
  console.log('Driver Console hidden from Admin:', !hasDriverHub ? '✓ PASS' : '✗ FAIL')
  console.log('Teacher Handover hidden from Admin:', !hasTeacherHub ? '✓ PASS' : '✗ FAIL')

  const hasCommandCenter = visibleTabs.some(t => t.includes('Command Center'))
  const hasDailyRuns = visibleTabs.some(t => t.includes('Daily Runs'))
  const hasRoutes = visibleTabs.some(t => t.includes('Routes & Stops'))
  const hasVehicles = visibleTabs.some(t => t.includes('Fleet Vehicles'))
  const hasAllocations = visibleTabs.some(t => t.includes('Allocations'))
  const hasAuthorizations = visibleTabs.some(t => t.includes('Temp Pickups'))
  const hasSecurity = visibleTabs.some(t => t.includes('Security Audit'))
  const hasIncidents = visibleTabs.some(t => t.includes('Safety Incidents'))
  const hasScanner = visibleTabs.some(t => t.includes('QR Scanner'))

  console.log('Command Center visible:', hasCommandCenter ? '✓ PASS' : '✗ FAIL')
  console.log('Daily Runs visible:', hasDailyRuns ? '✓ PASS' : '✗ FAIL')
  console.log('Routes & Stops visible:', hasRoutes ? '✓ PASS' : '✗ FAIL')
  console.log('Fleet Vehicles visible:', hasVehicles ? '✓ PASS' : '✗ FAIL')
  console.log('Allocations visible:', hasAllocations ? '✓ PASS' : '✗ FAIL')
  console.log('Authorizations visible:', hasAuthorizations ? '✓ PASS' : '✗ FAIL')
  console.log('Security Audit visible:', hasSecurity ? '✓ PASS' : '✗ FAIL')
  console.log('Safety Incidents visible:', hasIncidents ? '✓ PASS' : '✗ FAIL')
  console.log('QR Scanner visible:', hasScanner ? '✓ PASS' : '✗ FAIL')

  // Capture screenshot of Admin Transport Command Center
  const adminScreen = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'transport-admin-role-clean.png'), Buffer.from(adminScreen.data, 'base64'))
  console.log('Saved screenshot: transport-admin-role-clean.png')

  // Step 3: Switch to Allocations tab and test Parent Preview Modal
  console.log('\n3. Testing Admin Parent Preview Simulation from Allocations tab...')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const allocBtn = btns.find(b => b.innerText.includes('Allocations'));
    if (allocBtn) allocBtn.click();
  `)
  await new Promise((r) => setTimeout(r, 2000))

  // Find Parent Preview button or click seed first if empty
  let hasPreviewBtn = await evalCode(`
    Boolean(Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Parent Preview')))
  `)

  if (!hasPreviewBtn) {
    console.log('No allocations yet in this session, seeding demo transport data...')
    await evalCode(`
      const seedBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Seed Demo Data') || b.querySelector('svg'));
      // Click seed tab
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const seedTab = btns.find(b => b.innerText.includes('Demo Seed'));
      if (seedTab) seedTab.click();
    `)
    await new Promise((r) => setTimeout(r, 1000))
    await evalCode(`
      const seedBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Seed Demo Data & QR'));
      if (seedBtn) seedBtn.click();
    `)
    await new Promise((r) => setTimeout(r, 3000))
    // Return to allocations tab
    await evalCode(`
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const allocBtn = btns.find(b => b.innerText.includes('Allocations'));
      if (allocBtn) allocBtn.click();
    `)
    await new Promise((r) => setTimeout(r, 2000))
  }

  const clickedPreview = await evalCode(`
    const previewBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Parent Preview'));
    if (previewBtns.length > 0) {
      previewBtns[0].click();
      true;
    } else {
      false;
    }
  `)

  console.log('Parent Preview button clicked on student row:', clickedPreview ? '✓ YES' : '✗ NO')
  await new Promise((r) => setTimeout(r, 1500))

  // Verify modal is open
  const modalTextRes = await evalCode(`
    document.body.innerText.includes('ADMIN AUDIT PREVIEW · READ-ONLY (NO GUARDIAN ACCESS)')
  `)
  console.log('Admin Parent Preview Modal visible with audit disclaimer:', modalTextRes ? '✓ PASS' : '✗ FAIL')

  // Screenshot modal
  const modalScreen = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'transport-parent-preview-audit-modal.png'), Buffer.from(modalScreen.data, 'base64'))
  console.log('Saved screenshot: transport-parent-preview-audit-modal.png')

  ws.close()
  browser.kill()
  console.log('\n================================================================')
  console.log('AUDIT COMPLETED SUCCESSFULLY')
  console.log('================================================================')
}

runRoleTest().catch(console.error)
