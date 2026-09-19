import { spawn } from 'child_process'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function run() {
  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-${Date.now()}`)

  const port = 9600 + (randId % 20)
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

  await send('Page.enable')
  await send('Runtime.enable')

  // Login
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual'
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const sessionToken = (setCookie.match(/preone_session=([^;]+)/) || [])[1] || ''
  const authToken = (setCookie.match(/preone_token=([^;]+)/) || [])[1] || ''

  await send('Network.enable')
  if (sessionToken) await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  if (authToken) await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })

  await send('Emulation.setDeviceMetricsOverride', { width: 1140, height: 800, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://localhost:3000/app/users/staff' })
  await new Promise((r) => setTimeout(r, 2500))

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find all rules containing sm:w-40 or sm:order
      let foundRules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText && (rule.cssText.includes('sm\\\\:w-40') || rule.cssText.includes('sm\\\\:order') || rule.cssText.includes('min-width: 640px'))) {
              foundRules.push(rule.cssText);
            }
          }
        } catch(e) {}
      }
      return {
        foundRulesCount: foundRules.length,
        sample: foundRules.slice(0, 10)
      };
    })()`,
    returnByValue: true
  })

  console.log('CSS check:', evalRes.result.value)

  ws.close()
  browser.kill()
}

run().catch(console.error)
