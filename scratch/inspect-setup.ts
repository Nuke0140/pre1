import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9488;
  const tempDir = `C:\\Users\\Nuke\\AppData\\Local\\Temp\\edge-inspect-setup-${Date.now()}`;
  const proc = spawn(edgePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${tempDir}`,
    'about:blank'
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
  const pageTarget = targets.find((t: any) => t.type === 'page') || targets[0];
  const ws = new (require('ws'))(pageTarget.webSocketDebuggerUrl);

  await new Promise(r => ws.on('open', r));

  let id = 1;
  function send(method: string, params: any = {}) {
    return new Promise<any>((resolve, reject) => {
      const curId = id++;
      const handler = (data: any) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === curId) {
          ws.off('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  // Authenticate via PreOne API
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@sunshine.demo', password: 'Preone@123' }),
    redirect: 'manual'
  });
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const sessionMatch = setCookie.match(/preone_session=([^;]+)/);
  const tokenMatch = setCookie.match(/preone_token=([^;]+)/);

  if (sessionMatch) {
    await send('Network.setCookie', { name: 'preone_session', value: sessionMatch[1], url: 'http://localhost:3000' });
  }
  if (tokenMatch) {
    await send('Network.setCookie', { name: 'preone_token', value: tokenMatch[1], url: 'http://localhost:3000' });
  }

  // 1. Desktop 1440px
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:3000/app/setup' });
  // Wait until .setup-phases-grid exists
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    const check = await send('Runtime.evaluate', {
      expression: `!!document.querySelector('.setup-phases-grid')`,
      returnByValue: true
    });
    if (check.result?.value) break;
  }

  const desktopEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const summaryCards = document.querySelectorAll('.metro-summary-grid .metro-metric-card');
      const recommendBanner = document.querySelector('.setup-recommend-banner');
      const phaseCards = document.querySelectorAll('.setup-phases-grid .setup-phase-card');
      const stepTiles = document.querySelectorAll('.setup-step-tile');
      const phaseGrid = document.querySelector('.setup-phases-grid');
      const summaryGrid = document.querySelector('.metro-summary-grid');

      return {
        url: window.location.href,
        summaryCardCount: summaryCards.length,
        hasRecommendBanner: !!recommendBanner,
        phaseCardCount: phaseCards.length,
        stepTileCount: stepTiles.length,
        summaryGridColumns: summaryGrid ? window.getComputedStyle(summaryGrid).gridTemplateColumns : 'N/A',
        phaseGridColumns: phaseGrid ? window.getComputedStyle(phaseGrid).gridTemplateColumns : 'N/A',
      };
    })()`,
    returnByValue: true
  });

  console.log('Desktop 1440px inspection:', desktopEval.result.value);

  // Capture Desktop screenshot
  const deskShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/setup-desktop-1440.png', Buffer.from(deskShot.data, 'base64'));
  console.log('Saved scratch/setup-desktop-1440.png');

  // 2. Tablet 800px
  await send('Emulation.setDeviceMetricsOverride', {
    width: 800,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 600));

  const tabletEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const phaseGrid = document.querySelector('.setup-phases-grid');
      const summaryGrid = document.querySelector('.metro-summary-grid');
      return {
        summaryGridColumns: summaryGrid ? window.getComputedStyle(summaryGrid).gridTemplateColumns : 'N/A',
        phaseGridColumns: phaseGrid ? window.getComputedStyle(phaseGrid).gridTemplateColumns : 'N/A',
      };
    })()`,
    returnByValue: true
  });
  console.log('Tablet 800px inspection:', tabletEval.result.value);

  const tabShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/setup-tablet-800.png', Buffer.from(tabShot.data, 'base64'));
  console.log('Saved scratch/setup-tablet-800.png');

  // 3. Mobile 375px
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const phaseGrid = document.querySelector('.setup-phases-grid');
      const summaryGrid = document.querySelector('.metro-summary-grid');
      return {
        summaryGridColumns: summaryGrid ? window.getComputedStyle(summaryGrid).gridTemplateColumns : 'N/A',
        phaseGridColumns: phaseGrid ? window.getComputedStyle(phaseGrid).gridTemplateColumns : 'N/A',
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile 375px inspection:', mobileEval.result.value);

  const mobShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/setup-mobile-375.png', Buffer.from(mobShot.data, 'base64'));
  console.log('Saved scratch/setup-mobile-375.png');

  ws.close();
  proc.kill();
}

main().catch(console.error);
