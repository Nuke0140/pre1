import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'
const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', 'edge-profile-csv-modal')

async function run() {
  console.log('Authenticating to get session cookies...')
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionMatch = setCookie.match(/preone_session=([^;]+)/)
  const tokenMatch = setCookie.match(/preone_token=([^;]+)/)
  const sessionToken = sessionMatch ? sessionMatch[1] : ''
  const authToken = tokenMatch ? tokenMatch[1] : ''

  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9241
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 840,
    deviceScaleFactor: 1,
    mobile: false,
  })

  console.log('Navigating to http://localhost:3000/app/users/staff...')
  await send('Page.navigate', { url: 'http://localhost:3000/app/users/staff' })
  await new Promise((r) => setTimeout(r, 3000))

  console.log('Opening Bulk Import Staff Modal...')
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Bulk Import Staff'));
      if (btn) btn.click();
    })()`,
  })
  await new Promise((r) => setTimeout(r, 1000))

  // 1. File Upload tab screenshot
  const snap1 = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'csv-modal-file-upload.png'), Buffer.from(snap1.data, 'base64'))
  console.log('Saved csv-modal-file-upload.png')

  // 2. Switch to Paste CSV tab
  console.log('Switching to Paste CSV tab...')
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Paste Raw CSV'));
      if (btn) btn.click();
    })()`,
  })
  await new Promise((r) => setTimeout(r, 600))
  const snap2 = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'csv-modal-paste-mode.png'), Buffer.from(snap2.data, 'base64'))
  console.log('Saved csv-modal-paste-mode.png')

  // 3. Paste valid CSV and validate
  console.log('Pasting sample CSV and validating...')
  await send('Runtime.evaluate', {
    expression: `(() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        const sampleCsv = \`fullName,email,role,username,phone,branchCode,employeeCode,designation
Priya Sharma,priya.sharma@sunshine.demo,TEACHER,priya.sharma,+919876543210,MAIN,EMP-101,Lead Montessori Guide
Ramesh Patil,ramesh.patil@sunshine.demo,HELPER,ramesh.patil,+919876543211,MAIN,EMP-102,Classroom Helper
Meera Nair,meera.nair@sunshine.demo,HR,meera.nair,+919876543212,MAIN,EMP-103,HR Executive\`;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, sampleCsv);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()`,
  })
  await new Promise((r) => setTimeout(r, 500))

  console.log('Clicking Validate & Preview...')
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes('Validate & Preview'));
      if (btn) btn.click();
    })()`,
  })
  await new Promise((r) => setTimeout(r, 2000))

  // 4. Preview Table Screenshot
  const snap3 = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'csv-modal-preview-table.png'), Buffer.from(snap3.data, 'base64'))
  console.log('Saved csv-modal-preview-table.png')

  ws.close()
  browser.kill()
  console.log('CSV Modal screenshots captured successfully!')
}

run().catch(console.error)
