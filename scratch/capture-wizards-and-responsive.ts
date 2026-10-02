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

  const port = 9958
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-wizards-${Date.now()}`)
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

  // 1. Wizard: Dispatch Trip
  console.log('Opening Dispatch Trip Wizard...')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Dispatch Trip'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-wizard-dispatch-trip-modal')
  // Close modal
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 2. Wizard: Allocate Seat
  console.log('Navigating to Children & Routes and opening Allocate Seat Wizard...')
  await evalCode(`
    const tab = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button')).find(x => x.innerText.includes('Children & Routes'));
    if (tab) tab.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Allocate Seat'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-wizard-allocate-seat-modal')
  // Close modal
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 3. Wizard: Temporary Pickup Request
  console.log('Navigating to Safety & Approvals and opening Temp Pickup Wizard...')
  await evalCode(`
    const tab = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button')).find(x => x.innerText.includes('Safety & Approvals'));
    if (tab) tab.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Request Temp Pickup'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-wizard-temp-pickup-modal')
  // Close modal
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 4. Wizard: Register Vehicle
  console.log('Navigating to Fleet & Settings and opening Register Vehicle Wizard...')
  await evalCode(`
    const tab = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button')).find(x => x.innerText.includes('Fleet & Settings'));
    if (tab) tab.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('Register Vehicle'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-wizard-register-vehicle-modal')
  // Close modal
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.trim() === 'Cancel');
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 5. Tablet Viewport (768 x 1024)
  console.log('Capturing Tablet Viewport...')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await evalCode(`
    const tab = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button')).find(x => x.innerText.includes('Home'));
    if (tab) tab.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-responsive-tablet-home')

  // 6. Mobile Viewport (390 x 844)
  console.log('Capturing Mobile Viewport...')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-responsive-mobile-home')

  console.log('Done capturing all wizard modals and responsive views!')
  ws.close()
  browser.kill()
}

run().catch(console.error)
