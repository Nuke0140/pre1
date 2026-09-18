import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'
const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', 'edge-profile')

async function run() {
  console.log('Authenticating to get session cookies...')
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual'
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionMatch = setCookie.match(/preone_session=([^;]+)/)
  const tokenMatch = setCookie.match(/preone_token=([^;]+)/)
  const sessionToken = sessionMatch ? sessionMatch[1] : ''
  const authToken = tokenMatch ? tokenMatch[1] : ''

  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9226
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank'
  ])

  browser.on('error', (err) => console.error('Browser spawn error:', err))
  await new Promise((r) => setTimeout(r, 2500))

  const listRes = await fetch(`http://localhost:${port}/json/list`).then(r => r.json())
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
      path: '/'
    })
  }
  if (authToken) {
    await send('Network.setCookie', {
      name: 'preone_token',
      value: authToken,
      domain: 'localhost',
      path: '/'
    })
  }

  async function capture(name: string, width: number, height: number, url: string) {
    console.log(`Setting metrics for ${name} (${width}x${height})...`)
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    })
    console.log(`Navigating to ${url}...`)
    await send('Page.navigate', { url })
    await new Promise((r) => setTimeout(r, 3000))

    console.log(`Capturing screenshot for ${name}...`)
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    const outPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'))
    console.log(`Saved screenshot ${name}:`, outPath)
  }

  // 1. Desktop 1440px
  await capture('users-hub-desktop-1440', 1440, 900, 'http://localhost:3000/app/users')

  // 2. Laptop 1024px
  await capture('users-hub-laptop-1024', 1024, 768, 'http://localhost:3000/app/users')

  // 3. Tablet 768px
  await capture('users-hub-tablet-768', 768, 1024, 'http://localhost:3000/app/users')

  // 4. Mobile 390px
  await capture('users-hub-mobile-390', 390, 844, 'http://localhost:3000/app/users')

  ws.close()
  browser.kill()
  console.log('Done capturing responsive users hub screenshots!')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
