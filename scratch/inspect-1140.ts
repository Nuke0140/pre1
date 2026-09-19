import { spawn } from 'child_process'
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
  const sessionMatch = setCookie.match(/preone_session=([^;]+)/)
  const tokenMatch = setCookie.match(/preone_token=([^;]+)/)
  const sessionToken = sessionMatch ? sessionMatch[1] : ''
  const authToken = tokenMatch ? tokenMatch[1] : ''

  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-${Date.now()}`)

  const port = 9420 + (randId % 50)
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

  if (sessionToken) {
    await send('Network.setCookie', { name: 'preone_session', value: sessionToken, domain: 'localhost', path: '/' })
  }
  if (authToken) {
    await send('Network.setCookie', { name: 'preone_token', value: authToken, domain: 'localhost', path: '/' })
  }

  for (const url of ['http://localhost:3000/app/users/family', 'http://localhost:3000/app/users/staff']) {
    console.log('Testing at 1140px:', url)
    await send('Emulation.setDeviceMetricsOverride', { width: 1140, height: 800, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url })
    await new Promise((r) => setTimeout(r, 2500))

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.offsetWidth;
        const innerWidth = window.innerWidth;
        const main = document.querySelector('main');
        const mainWidth = main ? main.offsetWidth : 0;
        const mainScrollWidth = main ? main.scrollWidth : 0;
        const overflowElements = Array.from(document.querySelectorAll('*')).filter(el => {
          return el.offsetWidth > innerWidth || el.scrollWidth > innerWidth;
        }).map(el => ({ tag: el.tagName, className: el.className, w: el.offsetWidth, sw: el.scrollWidth })).slice(0, 10);

        const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;

        return {
          innerWidth,
          docWidth,
          scrollWidth,
          bodyWidth,
          mainWidth,
          mainScrollWidth,
          overflowElements,
          htmlBg,
          bodyBg
        };
      })()`,
      returnByValue: true
    })

    console.log(url, JSON.stringify(evalRes.result.value, null, 2))
  }

  ws.close()
  browser.kill()
}

run().catch(console.error)
