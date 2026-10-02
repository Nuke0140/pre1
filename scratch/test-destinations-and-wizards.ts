import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { signSession } from '../src/lib/auth'
import { db } from '../src/lib/db'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function runTest() {
  const tenant = await db.tenant.findFirst({ where: { deletedAt: null } })
  const tenantId = tenant?.id || 't1'

  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-dest-audit-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9880 + (randId % 20)
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ])

  await new Promise((r) => setTimeout(r, 2500))

  const listRes = await fetch(`http://localhost:${port}/json/list`).then((r) => r.json())
  const pageTarget = listRes.find((t: any) => t.type === 'page') || listRes[0]
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
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

  const captureShot = async (name: string) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const buf = Buffer.from(shot.data, 'base64')
    const filePath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.writeFileSync(filePath, buf)
    console.log(`  📸 Saved: ${name}.png (${(buf.length / 1024).toFixed(1)} KB)`)
  }

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  const adminToken = await signSession({
    userId: 'u_admin_audit',
    name: 'Admin Principal',
    email: 'admin@preone.test',
    role: 'OWNER',
    roles: ['OWNER', 'PRINCIPAL'],
    tenantId,
  } as any)

  await send('Network.setCookie', {
    name: 'preone_session',
    value: adminToken,
    domain: 'localhost',
    path: '/',
  })

  console.log('Navigating to /app/transport...')
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))

  // 1. Home
  console.log('--- 1. Home (Operations Banner + KPI Tiles)')
  await captureShot('transport-admin-dest1-home')

  // 2. Today's Trips
  console.log("--- 2. Today's Trips")
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Today's Trips"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await captureShot('transport-admin-dest2-trips')

  // 3. Children & Routes
  console.log('--- 3. Children & Routes')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Children & Routes"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  const crTabs = await evalCode(`
    Array.from(document.querySelectorAll('.seg button')).map(b => b.textContent.trim())
  `)
  console.log('  Children & Routes Sub-tabs:', crTabs)
  await captureShot('transport-admin-dest3-children-routes')

  // Switch to Bus Routes subtab
  await evalCode(`
    const b = Array.from(document.querySelectorAll('.seg button')).find(btn => btn.textContent.includes("Bus Routes"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-admin-dest3-routes-subtab')

  // 4. Safety & Approvals
  console.log('--- 4. Safety & Approvals')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Safety & Approvals"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  const safetyTabs = await evalCode(`
    Array.from(document.querySelectorAll('.seg button')).map(b => b.textContent.trim())
  `)
  console.log('  Safety & Approvals Sub-tabs:', safetyTabs)
  await captureShot('transport-admin-dest4-safety')

  // Switch to Incidents subtab
  await evalCode(`
    const b = Array.from(document.querySelectorAll('.seg button')).find(btn => btn.textContent.includes("Safety Incidents"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-admin-dest4-incidents-subtab')

  // 5. Fleet & Settings
  console.log('--- 5. Fleet & Settings')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Fleet & Settings"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  const fleetTabs = await evalCode(`
    Array.from(document.querySelectorAll('.seg button')).map(b => b.textContent.trim())
  `)
  console.log('  Fleet & Settings Sub-tabs:', fleetTabs)
  await captureShot('transport-admin-dest5-fleet-settings')

  // Switch to Gate Scanner subtab
  await evalCode(`
    const b = Array.from(document.querySelectorAll('.seg button')).find(btn => btn.textContent.includes("Gate QR"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-admin-dest5-scanner-subtab')

  // --- Test 4 Wizards ---
  // Wizard 1: Allocate Student
  console.log('\n--- Wizard 1: Allocate Seat (Step 1)')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Children & Routes"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('.seg button')).find(btn => btn.textContent.includes("Child Allocations"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes("Allocate Seat") || btn.textContent.includes("Assign Student"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-wizard-allocate-seat-step1')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 500))

  // Wizard 2: Dispatch Run
  console.log('--- Wizard 2: Dispatch Daily Trip (Step 1)')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Today's Trips"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes("Dispatch New Run") || btn.textContent.includes("Dispatch Trip"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-wizard-dispatch-trip-step1')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 500))

  // Wizard 3: Temp Pickup
  console.log('--- Wizard 3: Temporary Pickup Authorization (Step 1)')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Safety & Approvals"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('.seg button')).find(btn => btn.textContent.includes("Temp Pickups"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes("Request Temp Pickup"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-wizard-temp-pickup-step1')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 500))

  // Wizard 4: Register Vehicle
  console.log('--- Wizard 4: Register Vehicle (Step 1)')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .find(btn => btn.textContent.includes("Fleet & Settings"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('.seg button')).find(btn => btn.textContent.includes("Fleet Vehicles"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes("Register Vehicle"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await captureShot('transport-wizard-register-vehicle-step1')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 500))

  console.log('\n--- Done all 5 destinations and 4 wizards!')
  try {
    ws.close()
    browser.kill()
  } catch {}
}

runTest().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
