import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

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
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-op-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9620 + (randId % 60)
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
      mobile: width < 768,
    })
  }

  const takeScreenshot = async (name: string) => {
    console.log(`Capturing screenshot for ${name}...`)
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    const outPath = path.join(ARTIFACT_DIR, `${name}.png`)
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'))
    console.log(`Saved screenshot ${name}:`, outPath)
  }

  // -------------------------------------------------------------
  // Capture 1: Universal Action Search Modal
  // -------------------------------------------------------------
  console.log('1. Navigating to Dashboard and Opening Global Search...')
  await setMetrics(1440, 900)
  await send('Page.navigate', { url: 'http://localhost:3000/app/dashboard' })
  await new Promise((r) => setTimeout(r, 3500))

  // Open modal via .workspace-search-bar click
  console.log('Clicking .workspace-search-bar...')
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const searchBar = document.querySelector('.workspace-search-bar');
        if (searchBar) {
          searchBar.click();
          return true;
        }
        return false;
      })()
    `,
  })
  await new Promise((r) => setTimeout(r, 1200))

  // Type action query: 'call Aarav'
  console.log('Typing "call Aarav" using native setter...')
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const input = document.querySelector('.search-input');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'call Aarav');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      })()
    `,
  })
  await new Promise((r) => setTimeout(r, 2000))
  await takeScreenshot('universal-action-search-call')

  // Type action query: 'roll call'
  console.log('Typing "roll call" using native setter...')
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const input = document.querySelector('.search-input');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'roll call');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      })()
    `,
  })
  await new Promise((r) => setTimeout(r, 1500))
  await takeScreenshot('universal-action-search-rollcall')

  // -------------------------------------------------------------
  // Capture 2: Fast Roll Call Workspace on Daily Diary
  // -------------------------------------------------------------
  console.log('2. Navigating to Fast Roll Call attendance workspace...')
  await send('Page.navigate', { url: 'http://localhost:3000/app/daily-diary?fastRollCall=true' })
  await new Promise((r) => setTimeout(r, 4500))
  await takeScreenshot('fast-roll-call-workspace')

  // Capture Fast Roll Call Mobile
  await setMetrics(390, 844)
  await new Promise((r) => setTimeout(r, 1500))
  await takeScreenshot('fast-roll-call-mobile')

  ws.close()
  browser.kill()
  console.log('Done capturing operational ergonomics screenshots!')
  process.exit(0)
}

run().catch((e) => {
  console.error('Screenshot capture failed:', e)
  process.exit(1)
})
