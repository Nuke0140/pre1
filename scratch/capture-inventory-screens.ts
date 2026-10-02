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
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-inv-${Date.now()}`)
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
  console.log('Navigating to /app/inventory at 1440px...')
  await setMetrics(1440, 900)
  await send('Page.navigate', { url: 'http://localhost:3000/app/inventory' })
  await new Promise((r) => setTimeout(r, 3500))
  await takeScreenshot('inventory-desktop-1440')

  // 2. Tablet 1140px Overview
  console.log('Resizing to Tablet 1140px...')
  await setMetrics(1140, 800)
  await new Promise((r) => setTimeout(r, 1000))
  await takeScreenshot('inventory-tablet-1140')

  // 3. Mobile 390px Overview
  console.log('Resizing to Mobile 390px...')
  await setMetrics(390, 844)
  await new Promise((r) => setTimeout(r, 1000))
  await takeScreenshot('inventory-mobile-390')

  // Switch back to 1440px for workspace walkthrough
  await setMetrics(1440, 900)
  await new Promise((r) => setTimeout(r, 500))

  // 4. Items & Stock Tab
  console.log('Opening Items & Stock Workspace...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const itemsTab = btns.find(b => b.textContent.includes('Items & Stock'));
      if (itemsTab) itemsTab.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-items-tab-1440')

  // 5. Requests & Distribution Workspace
  console.log('Opening Requests & Distribution Workspace...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const distTab = btns.find(b => b.textContent.includes('Requests & Distribution'));
      if (distTab) distTab.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-distribution-workspace-1440')

  // 6. Stores & Transfers Tab
  console.log('Opening Stores & Transfers Workspace...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const storesTab = btns.find(b => b.textContent.includes('Stores & Transfers'));
      if (storesTab) storesTab.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-stores-tab-1440')

  // 7. Procurement Tab
  console.log('Opening Procurement Workspace...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const poTab = btns.find(b => b.textContent.includes('Procurement'));
      if (poTab) poTab.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-procurement-tab-1440')

  // 8. Reports & Audit Tab
  console.log('Opening Reports & Audit Workspace...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const repTab = btns.find(b => b.textContent.includes('Reports & Audit'));
      if (repTab) repTab.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-reports-ledger-1440')

  // 9. Open Classroom Issue Modal
  console.log('Opening Classroom Issue modal from Distribution...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const distTab = btns.find(b => b.textContent.includes('Requests & Distribution'));
      if (distTab) distTab.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clsBtn = btns.find(b => b.textContent.includes('Classroom Issue'));
      if (clsBtn) clsBtn.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-classroom-bulk-modal-1440')

  // Close modal
  await evalCode(`
    (() => {
      const closeBtn = document.querySelector('[aria-label="Close dialog"], [aria-label="Close"]');
      if (closeBtn) closeBtn.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 10. Open Student Issue Modal
  console.log('Opening Student Issue modal...')
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const stuBtn = btns.find(b => b.textContent.includes('Student Issue'));
      if (stuBtn) stuBtn.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await takeScreenshot('inventory-student-dist-modal-1440')

  console.log('All screenshots captured successfully!')
  ws.close()
  browser.kill()
  process.exit(0)
}

run().catch((err) => {
  console.error('Fatal screenshot runner error:', err)
  process.exit(1)
})
