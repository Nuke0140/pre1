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
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-trp-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9700 + (randId % 60)
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
    console.log(`Saved screenshot to ${outPath}`)
  }

  const evalCode = async (expression: string) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return res.result?.value
  }

  // 1. Desktop 1440px Overview
  console.log('Navigating to /app/transport at 1440px...')
  await setMetrics(1440, 900)
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3500))
  await takeScreenshot('transport-desktop-1440')

  // 2. Tablet 1140px Overview
  console.log('Resizing to Tablet 1140px...')
  await setMetrics(1140, 800)
  await new Promise((r) => setTimeout(r, 1000))
  await takeScreenshot('transport-tablet-1140')

  // 3. Mobile 390px Overview
  console.log('Resizing to Mobile 390px...')
  await setMetrics(390, 844)
  await new Promise((r) => setTimeout(r, 1000))
  await takeScreenshot('transport-mobile-390')

  // Switch back to 1440px for workspace walkthrough
  await setMetrics(1440, 900)
  await new Promise((r) => setTimeout(r, 500))

  // Helper to click tab
  const clickTab = async (text: string) => {
    await evalCode(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.textContent && b.textContent.includes('${text}'));
        if (target) target.click();
      })()
    `)
    await new Promise((r) => setTimeout(r, 1000))
  }

  // 4. Trips Tab
  console.log('Opening Trips Tab...')
  await clickTab('Daily Runs')
  await takeScreenshot('transport-trips-1440')

  // 5. Routes Tab
  console.log('Opening Routes Tab...')
  await clickTab('Routes & Stops')
  await takeScreenshot('transport-routes-1440')

  // 6. Vehicles Tab
  console.log('Opening Fleet Vehicles Tab...')
  await clickTab('Fleet Vehicles')
  await takeScreenshot('transport-vehicles-1440')

  // 7. Students Tab
  console.log('Opening Allocations Tab...')
  await clickTab('Allocations')
  await takeScreenshot('transport-students-1440')

  // 8. Parent Portal Tab
  console.log('Opening Parent Portal Tab...')
  await clickTab('Parent Portal')
  await takeScreenshot('transport-parent-1440')

  // 9. Driver Hub Tab
  console.log('Opening Driver Hub Tab...')
  await clickTab('Driver Hub')
  await takeScreenshot('transport-driver-1440')

  // 10. Teacher Verification Tab
  console.log('Opening Teacher Verification Tab...')
  await clickTab('Teacher Verification')
  await takeScreenshot('transport-teacher-1440')

  // 11. Temp Pickups Tab
  console.log('Opening Temp Pickups Tab...')
  await clickTab('Temp Pickups')
  await takeScreenshot('transport-authorizations-1440')

  // 12. Security Logs Tab
  console.log('Opening Security Tab...')
  await clickTab('Security Audit')
  await takeScreenshot('transport-security-1440')

  // 13. Incidents Tab
  console.log('Opening Incidents Tab...')
  await clickTab('Safety Incidents')
  await takeScreenshot('transport-incidents-1440')

  // 14. QR Scanner Tab
  console.log('Opening QR Scanner Tab...')
  await clickTab('QR Scanner')
  await takeScreenshot('transport-scanner-1440')

  console.log('All transport screenshots captured successfully!')
  ws.close()
  browser.kill()
  process.exit(0)
}

run().catch((err) => {
  console.error('Run failed:', err)
  process.exit(1)
})
