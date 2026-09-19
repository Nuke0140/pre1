import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

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

  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-${Date.now()}`)

  const port = 9520 + (randId % 20)
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
  await new Promise((resolve) => { ws.onopen = resolve })

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

  await send('Network.enable')
  await send('Page.enable')
  await send('Runtime.enable')
  if (sessionToken) await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  if (authToken) await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })

  for (const name of ['users-family', 'users-staff']) {
    const url = `http://localhost:3000/app/users/${name === 'users-family' ? 'family' : 'staff'}`
    await send('Emulation.setDeviceMetricsOverride', { width: 1140, height: 800, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url })
    await new Promise((r) => setTimeout(r, 2500))

    // Set dark theme
    await send('Runtime.evaluate', {
      expression: `document.documentElement.setAttribute('data-theme', 'dark');`
    })
    await new Promise((r) => setTimeout(r, 500))

    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}-1140-dark.png`), Buffer.from(data, 'base64'))
    console.log(`Saved ${name}-1140-dark.png`)
  }

  ws.close()
  browser.kill()
}

run().catch(console.error)
