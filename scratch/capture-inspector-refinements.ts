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
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-insp-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9680 + (randId % 60)
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

  // 1. Navigate to Students roster
  console.log('Navigating to Students page...')
  await setMetrics(1440, 900)
  await send('Page.navigate', { url: 'http://localhost:3000/app/students' })

  // Wait for table rows to appear
  let rowsFound = false
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    const check = await send('Runtime.evaluate', {
      expression: `
        (function() {
          const cells = document.querySelectorAll('tbody tr td');
          return cells.length > 2;
        })()
      `,
    })
    if (check.result?.value) {
      rowsFound = true
      break
    }
  }
  console.log('Rows loaded successfully:', rowsFound)

  // 2. Scroll the table down by 300px to test scroll pinning
  console.log('Scrolling window down by 300px...')
  await send('Runtime.evaluate', {
    expression: 'window.scrollTo(0, 300)',
  })
  await new Promise((r) => setTimeout(r, 800))

  const scrollBefore = await send('Runtime.evaluate', {
    expression: 'window.scrollY',
  })
  console.log('Scroll position before picking record:', scrollBefore.result.value)

  // 3. Click the 1st student row to open Side-Peek Inspector
  console.log('Clicking student row to open Side-Peek Inspector...')
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const rows = document.querySelectorAll('tbody tr');
        if (rows.length > 0) {
          const firstRow = rows[0];
          firstRow.click();
          return true;
        }
        return false;
      })()
    `,
  })
  await new Promise((r) => setTimeout(r, 3000))

  // 4. Verify scroll positions
  const scrollAfter = await send('Runtime.evaluate', {
    expression: 'window.scrollY',
  })
  const drawerBodyScroll = await send('Runtime.evaluate', {
    expression: 'document.querySelector(".drawer-body")?.scrollTop',
  })
  console.log('Scroll position after drawer opened (should stick):', scrollAfter.result.value)
  console.log('Drawer body scroll position (should be 0):', drawerBodyScroll.result.value)

  // 5. Take Desktop Screenshot (1440px)
  await takeScreenshot('side-peek-inspector-student-upper-edit')

  // 6. Take Tablet Screenshot (1140px)
  console.log('Testing Tablet 1140px view...')
  await setMetrics(1140, 900)
  await new Promise((r) => setTimeout(r, 1000))
  await takeScreenshot('side-peek-inspector-1140')

  // 7. Take Mobile Screenshot (390px)
  console.log('Testing Mobile 390px view...')
  await setMetrics(390, 844)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('side-peek-inspector-mobile-390')

  // 8. Take Ultra-narrow Mobile Screenshot (320px)
  console.log('Testing Ultra-narrow Mobile 320px view...')
  await setMetrics(320, 700)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('side-peek-inspector-mobile-320')

  ws.close()
  browser.kill()
  console.log('Done verifying and capturing Side-Peek Inspector refinements!')
  process.exit(0)
}

run().catch((e) => {
  console.error('Inspector capture failed:', e)
  process.exit(1)
})
