import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function run() {
  // Login to get real session cookie
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual',
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionToken = (setCookie.match(/preone_session=([^;]+)/) || [])[1]
  console.log('Logged in, session token length:', sessionToken?.length)

  const port = 9930
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-audit-${Date.now()}`)
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

  await send('Network.setCookie', {
    name: 'preone_session',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
  })

  console.log('Navigating to /app/transport...')
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))

  // Destination 1: Home
  console.log('Capturing Destination 1: Home...')
  await capture('transport-workflow-1-home')

  // Destination 2: Trips
  console.log("Capturing Destination 2: Today's Trips...")
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes("Today's Trips"));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-2-trips')

  // Destination 3: Children & Routes
  console.log('Capturing Destination 3: Children & Routes...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Children & Routes'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-3-children-allocations')

  // Switch to routes subtab
  await evalCode(`
    (() => {
      const segs = Array.from(document.querySelectorAll('.seg button'));
      const b = segs.find(x => x.textContent.includes('Bus Routes'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-workflow-3-bus-routes')

  // Destination 4: Safety & Approvals
  console.log('Capturing Destination 4: Safety & Approvals...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Safety & Approvals'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-4-safety-authorizations')

  // Switch to incidents subtab
  await evalCode(`
    (() => {
      const segs = Array.from(document.querySelectorAll('.seg button'));
      const b = segs.find(x => x.textContent.includes('Safety Incidents'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-workflow-4-safety-incidents')

  // Destination 5: Fleet & Settings
  console.log('Capturing Destination 5: Fleet & Settings...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Fleet & Settings'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-workflow-5-fleet-vehicles')

  // Switch to QR Scanner subtab
  await evalCode(`
    (() => {
      const segs = Array.from(document.querySelectorAll('.seg button'));
      const b = segs.find(x => x.textContent.includes('Gate QR'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('transport-workflow-5-scanner')

  // Open Wizard: Allocate Seat
  console.log('Capturing Wizard 1: Allocate Seat...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Children & Routes'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Allocate Seat'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await capture('transport-wizard-1-allocate-seat')
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Cancel');
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 500))

  // Open Wizard: Dispatch Run
  console.log('Capturing Wizard 2: Dispatch Run...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Home'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Dispatch Run') || x.textContent.includes('Dispatch Trip'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await capture('transport-wizard-2-dispatch-trip')
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Cancel');
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 500))

  // Open Wizard: Temp Pickup
  console.log('Capturing Wizard 3: Temp Pickup...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Safety & Approvals'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Request Temp Pickup'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await capture('transport-wizard-3-temp-pickup')
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Cancel');
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 500))

  // Open Wizard: Register Vehicle
  console.log('Capturing Wizard 4: Register Vehicle...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Fleet & Settings'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    (() => {
      const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Register Vehicle'));
      if (b) b.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await capture('transport-wizard-4-register-vehicle')

  console.log('\nAll captures completed successfully!')
  ws.close()
  browser.kill()
}

run().catch(console.error)
