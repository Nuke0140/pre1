import { spawn } from 'child_process'
import path from 'path'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function run() {
  const randId = Math.floor(Math.random() * 1000)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-profile-${Date.now()}`)

  const port = 9620 + (randId % 20)
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

  await send('Page.navigate', { url: 'http://localhost:3000/app/users/staff' })
  await new Promise((r) => setTimeout(r, 2000))

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      let mediaRules = [];
      let totalRules = 0;
      for (const sheet of document.styleSheets) {
        try {
          totalRules += sheet.cssRules.length;
          for (const rule of sheet.cssRules) {
            if (rule.media) {
              mediaRules.push(rule.media.mediaText);
            }
          }
        } catch(e) {}
      }
      return {
        totalRules,
        mediaRules: Array.from(new Set(mediaRules))
      };
    })()`,
    returnByValue: true
  })

  console.log('Media queries check:', evalRes.result.value)

  ws.close()
  browser.kill()
}

run().catch(console.error)
