import { spawn } from 'child_process'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function run() {
  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-${Date.now()}`)

  const port = 9550 + (randId % 20)
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

  await send('Emulation.setDeviceMetricsOverride', { width: 1140, height: 800, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://localhost:3000/app/users/family' })
  await new Promise((r) => setTimeout(r, 2000))

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      // Check scrollbar styles in CSS
      const styles = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\\n');
      const scrollbarRules = styles.match(/::-webkit-scrollbar[^{]*\\{[^}]*\\}/g) || [];
      const elAtRight = document.elementFromPoint(1138, 200);
      return {
        scrollbarRules,
        elAtRight: elAtRight ? {
          tag: elAtRight.tagName,
          className: elAtRight.className,
          rect: elAtRight.getBoundingClientRect()
        } : null
      };
    })()`,
    returnByValue: true
  })

  console.log(JSON.stringify(evalRes.result.value, null, 2))

  ws.close()
  browser.kill()
}

run().catch(console.error)
