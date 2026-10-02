import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function runAudit() {
  console.log('================================================================')
  console.log('PREONE: TRANSPORT PRODUCTION-READINESS COMPREHENSIVE AUDIT')
  console.log('================================================================\n')

  // Step 1: Get session cookies for admin
  console.log('Authenticating session (owner@sunshine.demo)...')
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
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-audit-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9800 + (randId % 60)
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

  const pageErrors: string[] = []

  ws.addEventListener('message', (evt: any) => {
    const msg = JSON.parse(evt.data)
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a: any) => a.value || a.description).join(' ')
      if (msg.params.type === 'error') {
        pageErrors.push(text)
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params.exceptionDetails?.text || 'Uncaught exception')
    }
  })

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')

  if (sessionToken) {
    await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  }
  if (authToken) {
    await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })
  }

  const setMetrics = async (width: number, height: number) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 })
  }

  const evalCode = async (expression: string) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return res.result?.value
  }

  // Load /app/transport
  console.log('Navigating to http://localhost:3000/app/transport...')
  await setMetrics(1440, 900)
  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3500))

  // 1. Audit Check: Page Head & Badges
  const pageTitle = await evalCode(`document.querySelector('.page-title')?.textContent || document.querySelector('h1')?.textContent || ''`)
  const moduleBadge = await evalCode(`Array.from(document.querySelectorAll('span')).find(s => s.textContent === 'M09')?.textContent || ''`)
  console.log(`✓ Page Title: "${pageTitle.trim()}"`)
  console.log(`✓ Module Badge: "${moduleBadge}"`)

  // 2. Audit Check: Horizontal Navigation Workspace Count
  const navTabs = await evalCode(`
    Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'))
      .map(b => b.textContent?.trim() || '')
  `)
  console.log(`✓ Horizontal Workspaces Found: ${navTabs?.length || 0}`)
  if (navTabs) {
    navTabs.forEach((t: string, idx: number) => console.log(`   ${idx + 1}. ${t}`))
  }

  // 3. Test Clicking through all 12 workspaces to ensure zero runtime errors
  console.log('\n--- Testing Workspace Navigation & DOM Rendering:')
  if (navTabs) {
    for (const tabText of navTabs) {
      const labelPart = tabText.split(' ')[1] || tabText
      const success = await evalCode(`
        (() => {
          const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
          const target = btns.find(b => b.textContent && b.textContent.includes('${labelPart}'));
          if (target) {
            target.click();
            return true;
          }
          return false;
        })()
      `)
      await new Promise((r) => setTimeout(r, 600))
      console.log(`   ✓ Switched to "${tabText}": ${success ? 'OK' : 'NOT FOUND'}`)
    }
  }

  // 4. Test Modals
  console.log('\n--- Testing Modal Dialogs (Open, Form Fields, Close):')
  
  // Switch to Command Center
  await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const ov = btns.find(b => b.textContent && b.textContent.includes('Command Center'));
      if (ov) ov.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 600))

  const dispatchModalOpen = await evalCode(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Dispatch Trip'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()
  `)
  await new Promise((r) => setTimeout(r, 600))
  const modalVisible = await evalCode(`document.querySelector('.modal-overlay') !== null || document.querySelector('[role="dialog"]') !== null`)
  console.log(`   ✓ Dispatch Trip Modal Opened: ${dispatchModalOpen && modalVisible ? 'YES' : 'NO'}`)

  // Close modal with Cancel
  await evalCode(`
    (() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    })()
  `)
  await new Promise((r) => setTimeout(r, 500))

  // 5. Test Responsive Overflows on 390px Mobile
  console.log('\n--- Testing Responsive Viewports:')
  await setMetrics(390, 844)
  await new Promise((r) => setTimeout(r, 800))
  const horizontalOverflow = await evalCode(`document.documentElement.scrollWidth > window.innerWidth`)
  console.log(`   ✓ Mobile (390px) Horizontal Body Overflow: ${horizontalOverflow ? 'YES (Defect)' : 'NO (Clean)'}`)

  // 6. Check for console runtime errors
  console.log('\n--- Runtime Error Inspection:')
  console.log(`   ✓ Page Console Errors: ${pageErrors.length}`)
  if (pageErrors.length > 0) {
    pageErrors.forEach((e) => console.log(`     ✗ Error: ${e}`))
  }

  ws.close()
  browser.kill()

  console.log('\n================================================================')
  console.log('AUDIT COMPLETED')
  console.log('================================================================')
}

runAudit().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
