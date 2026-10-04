import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

// 1. Copy the excellent student modal capture
fs.copyFileSync(
  path.join(ARTIFACT_DIR, 'inventory-reports-student-distribution-1440.png'),
  path.join(ARTIFACT_DIR, 'inventory-student-dist-modal-1440.png')
)

async function run() {
  console.log('Authenticating to get session cookies...')
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

  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-rep-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9790 + (randId % 30)
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

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')

  if (sessionToken) {
    await send('Network.setCookie', {
      name: 'preone_session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
    })
  }
  if (authToken) {
    await send('Network.setCookie', {
      name: 'preone_token',
      value: authToken,
      domain: 'localhost',
      path: '/',
    })
  }

  const setMetrics = async (width: number, height: number) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    })
  }

  const takeScreenshot = async (name: string) => {
    console.log(`Capturing screenshot for ${name}...`)
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    const outPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'))
    console.log(`Saved screenshot to ${outPath}`)
  }

  const evalCode = async (expression: string) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return res.result?.value
  }

  await setMetrics(1440, 950)
  await send('Page.navigate', { url: 'http://localhost:3000/app/inventory' })
  await new Promise((r) => setTimeout(r, 3500))

  // Open Reports & Audit Workspace
  console.log('Navigating to Reports & Audit...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const repBtn = btns.find(b => b.textContent.includes('8. Reports & Audit') || b.textContent.includes('Reports & Audit'));
      if (repBtn) repBtn.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))

  // Click Student-Wise Distribution sub-segment tab
  console.log('Clicking Student-Wise Distribution sub-tab...')
  await evalCode(`
    (() => {
      // Find buttons inside the sub-segment bar
      const btns = Array.from(document.querySelectorAll('button'));
      const stuBtn = btns.find(b => b.textContent.trim().includes('Student-Wise Distribution'));
      if (stuBtn) stuBtn.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-reports-student-distribution-1440')

  console.log('Reports student distribution screenshot captured!')
  ws.close()
  browser.kill()
  process.exit(0)
}

run().catch((err) => {
  console.error('Fatal capture error:', err)
  process.exit(1)
})
