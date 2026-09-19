import { spawn } from 'child_process';
import http from 'http';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9399;
  const proc = spawn(edgePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=C:\\Users\\Nuke\\AppData\\Local\\Temp\\edge-inspect-${Date.now()}`
  ]);

  // wait for cdp
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetch(`http://localhost:${cdpPort}/json/version`);
      if (res.ok) break;
    } catch {}
  }

  const targetsRes = await fetch(`http://localhost:${cdpPort}/json/list`);
  const targets = await targetsRes.json();
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new (require('ws'))(wsUrl);

  await new Promise(r => ws.on('open', r));

  let id = 1;
  function send(method: string, params: any = {}) {
    return new Promise<any>((resolve) => {
      const curId = id++;
      const handler = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === curId) {
          ws.off('message', handler);
          resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Navigate to login/bypass or users/family
  // First set session cookie
  const sessionToken = '4e3150ff-d6fc-4612-a5c9-04f53b120cc4';
  // Let's authenticate via /api/auth or credentials
  // Wait, let's call the auth endpoint to get cookie
  const authRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'owner@preone.app', password: 'password', csrfToken: '', redirect: 'false', callbackUrl: '/app/home' })
  });
  const setCookie = authRes.headers.get('set-cookie');
  let cookieVal = '';
  if (setCookie) {
    const match = setCookie.match(/next-auth\.session-token=([^;]+)/);
    if (match) cookieVal = match[1];
  }

  await send('Network.enable');
  if (cookieVal) {
    await send('Network.setCookie', {
      name: 'next-auth.session-token',
      value: cookieVal,
      domain: 'localhost',
      path: '/'
    });
  }

  await send('Page.navigate', { url: 'http://localhost:3000/app/users/family' });
  await new Promise(r => setTimeout(r, 2000));

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Roles Directory'));
      const select = document.querySelector('select');
      return {
        btnClasses: btn ? btn.className : 'NOT FOUND',
        btnWidth: btn ? window.getComputedStyle(btn).width : 'N/A',
        btnOrder: btn ? window.getComputedStyle(btn).order : 'N/A',
        selectClasses: select ? select.className : 'NOT FOUND',
        selectWidth: select ? window.getComputedStyle(select).width : 'N/A',
        screenWidth: window.innerWidth
      };
    })()`,
    returnByValue: true
  });

  console.log('Result at 1440px:', evalRes.result.value);

  ws.close();
  proc.kill();
}

main().catch(console.error);
