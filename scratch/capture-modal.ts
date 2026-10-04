import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function main() {
  console.log('Logging in...')
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionMatch = setCookie.match(/preone_session=([^;]+)/)
  const sessionToken = sessionMatch ? sessionMatch[1] : ''

  const port = 9789
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${path.join(ARTIFACT_DIR, 'scratch', 'edge-mod-' + Date.now())}`,
    '--headless',
    '--disable-gpu',
    'about:blank',
  ])
  await new Promise((r) => setTimeout(r, 2500))

  const list = await fetch(`http://localhost:${port}/json/list`).then((r) => r.json())
  const ws = new WebSocket(list[0].webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))

  let id = 1
  const send = (method: string, params: any = {}) =>
    new Promise<any>((resolve) => {
      const cur = id++
      const fn = (evt: any) => {
        const d = JSON.parse(evt.data)
        if (d.id === cur) {
          ws.removeEventListener('message', fn)
          resolve(d.result)
        }
      }
      ws.addEventListener('message', fn)
      ws.send(JSON.stringify({ id: cur, method, params }))
    })

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')
  await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://localhost:3000/app/inventory' })
  await new Promise((r) => setTimeout(r, 3000))

  // Click Stock Count Audit button
  await send('Runtime.evaluate', {
    expression:
      '(() => { const b = Array.from(document.querySelectorAll("button")).find(x => x.textContent.includes("Stock Count Audit")); if (b) b.click(); })()',
    awaitPromise: true,
  })
  await new Promise((r) => setTimeout(r, 1200))

  const snap = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'inventory-audit-modal-1440.png'), Buffer.from(snap.data, 'base64'))
  console.log('Saved inventory-audit-modal-1440.png successfully!')
  ws.close()
  browser.kill()
  process.exit(0)
}

main().catch(console.error)
