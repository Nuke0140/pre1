import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function run() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual',
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionToken = (setCookie.match(/preone_session=([^;]+)/) || [])[1]
  const authToken = (setCookie.match(/preone_token=([^;]+)/) || [])[1]

  const port = 9955
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-dest-clean-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--headless',
    '--disable-gpu',
    'about:blank',
  ])
  await new Promise((r) => setTimeout(r, 2000))

  const list = await fetch(`http://localhost:${port}/json/list`).then((r) => r.json())
  const ws = new WebSocket(list[0].webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))

  let id = 1
  const send = (method: string, params: any = {}) =>
    new Promise<any>((res) => {
      const curId = id++
      const h = (evt: any) => {
        const d = JSON.parse(evt.data)
        if (d.id === curId) {
          ws.removeEventListener('message', h)
          res(d.result)
        }
      }
      ws.addEventListener('message', h)
      ws.send(JSON.stringify({ id: curId, method, params }))
    })

  const evalCode = async (expr: string) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
    return res?.result?.value
  }

  const capture = async (name: string) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const buf = Buffer.from(shot.data, 'base64')
    fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.png`), buf)
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

  await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  if (authToken) {
    await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })
  }

  console.log('Navigating to /app/transport...')
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))

  // Seed demo data first to have rich data across all workspaces
  console.log('Ensuring demo transport master data is seeded...')
  await evalCode(`
    (async () => {
      await fetch('/api/v1/transport/seed-demo', { method: 'POST' });
    })()
  `)
  await new Promise((r) => setTimeout(r, 2000))

  // Reload page
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))

  // 1. Home
  console.log('Destination 1: Home')
  await capture('transport-workflow-dest1-home')

  // 2. Today's Trips
  console.log("Destination 2: Today's Trips")
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes("Today's Trips"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  await capture('transport-workflow-dest2-trips')

  // 3. Children & Routes
  console.log('Destination 3: Children & Routes')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Children & Routes'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  await capture('transport-workflow-dest3-children-allocations')

  // Switch to Bus Routes subtab
  console.log('Destination 3: Bus Routes subtab')
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Bus Routes'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-dest3-bus-routes')

  // 4. Safety & Approvals
  console.log('Destination 4: Safety & Approvals')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Safety & Approvals'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  await capture('transport-workflow-dest4-temp-pickups')

  // Switch to Incidents subtab
  console.log('Destination 4: Safety Incidents subtab')
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Safety Incidents'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-dest4-safety-incidents')

  // Switch to Security Audit Trail subtab
  console.log('Destination 4: Security Audit Trail subtab')
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Security Audit'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-dest4-security-audit')

  // 5. Fleet & Settings
  console.log('Destination 5: Fleet & Settings')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Fleet & Settings'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  await capture('transport-workflow-dest5-fleet-vehicles')

  // Switch to QR Scanner subtab
  console.log('Destination 5: QR Scanner subtab')
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Gate QR'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-dest5-scanner')

  // --- Guided Task Flow Wizards ---
  // Wizard 1: Allocate Student
  console.log('Testing Wizard 1: Allocate Seat...')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Children & Routes'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Child Allocations'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Allocate Seat'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-wizard-1-allocate-seat')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))

  // Wizard 2: Dispatch Run
  console.log('Testing Wizard 2: Dispatch Daily Trip...')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Home'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Dispatch Run') || x.innerText.includes('Dispatch Trip'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-wizard-2-dispatch-trip')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))

  // Wizard 3: Temp Pickup
  console.log('Testing Wizard 3: Temporary Pickup...')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Safety & Approvals'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Temp Pickups'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Request Temp Pickup'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-wizard-3-temp-pickup')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 600))

  // Wizard 4: Register Vehicle
  console.log('Testing Wizard 4: Register Vehicle...')
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes('Fleet & Settings'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Fleet Vehicles'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Register Vehicle'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-wizard-4-register-vehicle')

  console.log('\n--- ALL WORKFLOWS & WIZARDS CAPTURED SUCCESSFULLY!')
  ws.close()
  browser.kill()
}

run().catch(console.error)
