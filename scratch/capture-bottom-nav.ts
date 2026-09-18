import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'
const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', 'edge-profile-dock')

async function run() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual'
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionToken = (setCookie.match(/preone_session=([^;]+)/) || [])[1] || ''
  const authToken = (setCookie.match(/preone_token=([^;]+)/) || [])[1] || ''

  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const port = 9240
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--headless',
    '--disable-gpu',
    'about:blank'
  ])

  await new Promise((r) => setTimeout(r, 2000))
  const listRes = await fetch(`http://localhost:${port}/json/list`).then(r => r.json())
  const pageTarget = listRes.find((t: any) => t.type === 'page') || listRes[0]
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve) => ws.onopen = resolve)

  let id = 1
  const send = (method: string, params: any = {}) => {
    return new Promise<any>((resolve) => {
      const curId = id++
      const handler = (evt: any) => {
        const data = JSON.parse(evt.data)
        if (data.id === curId) {
          ws.removeEventListener('message', handler)
          resolve(data)
        }
      }
      ws.addEventListener('message', handler)
      ws.send(JSON.stringify({ id: curId, method, params }))
    })
  }

  await send('Page.enable')
  await send('Network.enable')
  await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })

  // 1. Desktop 1440x900
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://localhost:3000/app/home' })

  // Wait for dock to mount
  for (let i = 0; i < 30; i++) {
    const check = await send('Runtime.evaluate', { expression: `!!document.querySelector('.preone-dock')`, returnByValue: true })
    if (check.result?.result?.value) break
    await new Promise(r => setTimeout(r, 400))
  }
  await new Promise(r => setTimeout(r, 1200))

  let shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dock-desktop-1440.png'), Buffer.from(shot.result.data, 'base64'))
  console.log('Saved dock-desktop-1440.png')

  // 2. Start Menu open above dock
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('.dock-orb');
      if (btn) {
        btn.focus();
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
    `
  })
  await new Promise(r => setTimeout(r, 1000))
  shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dock-startmenu-open.png'), Buffer.from(shot.result.data, 'base64'))
  console.log('Saved dock-startmenu-open.png')

  // Close start menu by pressing Escape
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' })
  await new Promise(r => setTimeout(r, 600))

  // 3. Dark Mode
  await send('Runtime.evaluate', { expression: `document.documentElement.setAttribute('data-theme', 'dark');` })
  await new Promise(r => setTimeout(r, 600))
  shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dock-dark-mode.png'), Buffer.from(shot.result.data, 'base64'))
  console.log('Saved dock-dark-mode.png')

  // 4. Laptop 1024x768
  await send('Runtime.evaluate', { expression: `document.documentElement.setAttribute('data-theme', 'light');` })
  await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 1, mobile: false })
  await new Promise(r => setTimeout(r, 600))
  shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dock-laptop-1024.png'), Buffer.from(shot.result.data, 'base64'))
  console.log('Saved dock-laptop-1024.png')

  // 5. Tablet 768x1024
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false })
  await new Promise(r => setTimeout(r, 600))
  shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dock-tablet-768.png'), Buffer.from(shot.result.data, 'base64'))
  console.log('Saved dock-tablet-768.png')

  // 6. Mobile 390x844
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await new Promise(r => setTimeout(r, 600))
  shot = await send('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'dock-mobile-390.png'), Buffer.from(shot.result.data, 'base64'))
  console.log('Saved dock-mobile-390.png')

  ws.close()
  browser.kill()
}

run().catch(console.error)
