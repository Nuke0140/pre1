import { spawn } from 'child_process'
import { signSession } from '../src/lib/auth'

async function check() {
  const token = await signSession({
    userId: 'u_admin_audit',
    name: 'Admin Principal',
    email: 'admin@preone.test',
    role: 'OWNER',
    roles: ['OWNER', 'PRINCIPAL'],
    tenantId: 'demo-tenant',
  } as any)

  const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--remote-debugging-port=9912',
    '--user-data-dir=C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4\\scratch\\edge-tmp-9912',
    '--headless',
    '--disable-gpu',
    'about:blank',
  ])
  await new Promise((r) => setTimeout(r, 2000))
  const list = await fetch('http://localhost:9912/json/list').then((r) => r.json())
  const ws = new WebSocket(list[0].webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))

  let id = 1
  const send = (method: string, params: any = {}) =>
    new Promise<any>((res) => {
      const curId = id++
      const h = (evt: any) => {
        const d = JSON.parse(evt.data)
        if (d.id === curId) {
          ws.removeEventListener('message', h)
          res(d.result)
        }
      }
      ws.addEventListener('message', h)
      ws.send(JSON.stringify({ id: curId, method, params }))
    })

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')

  await send('Network.setCookie', {
    name: 'preone_session',
    value: token,
    domain: 'localhost',
    path: '/',
  })

  await send('Page.navigate', { url: 'http://localhost:3000/app/transport' })
  await new Promise((r) => setTimeout(r, 3000))

  const evalCode = async (expression: string) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return res?.result?.value
  }

  const buttons = await evalCode(`
    Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button')).map(b => b.textContent)
  `)
  console.log('Available Workspace Buttons:', buttons)

  const clickResult = await evalCode(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav[aria-label="Transport Workspaces"] button'));
      const b = btns.find(x => x.textContent.includes('Children & Routes'));
      if (b) {
        b.click();
        return 'Found and clicked: ' + b.textContent;
      }
      return 'Not found';
    })()
  `)
  console.log('Click result:', clickResult)

  await new Promise((r) => setTimeout(r, 1200))

  const bodySnippet = await evalCode(`
    document.body.innerText.slice(0, 500)
  `)
  console.log('Body snippet after click:\n', bodySnippet)

  const segButtons = await evalCode(`
    Array.from(document.querySelectorAll('.seg button')).map(b => b.textContent)
  `)
  console.log('Segmented buttons found:', segButtons)

  ws.close()
  browser.kill()
}

check().catch(console.error)
