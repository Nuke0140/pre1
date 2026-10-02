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

  const port = 9956
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-responsive-${Date.now()}`)
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

  await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  if (authToken) {
    await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })
  }

  // 1. TABLET VIEWPORT (768 x 1024)
  console.log('--- TABLET VIEWPORT (768 x 1024) ---')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))
  await capture('transport-tablet-home')

  // Switch to Today's Trips on tablet
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes("Today's Trips"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  await capture('transport-tablet-trips')

  // 2. MOBILE VIEWPORT (390 x 844 - iPhone 14 / standard modern phone)
  console.log('--- MOBILE VIEWPORT (390 x 844) ---')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })

  // Mobile Admin Home
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))
  await capture('transport-mobile-admin-home')

  // Mobile Gate QR Scanner
  await evalCode(`
    const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
    const b = btns.find(x => x.innerText.includes("Fleet & Settings"));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await evalCode(`
    const segs = Array.from(document.querySelectorAll('.seg button'));
    const b = segs.find(x => x.innerText.includes('Gate QR'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('transport-mobile-gate-scanner')

  console.log('All responsive captures finished successfully!')
  ws.close()
  browser.kill()
}

run().catch(console.error)
