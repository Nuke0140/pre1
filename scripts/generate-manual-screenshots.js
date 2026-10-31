const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const outDir = path.join(process.cwd(), 'docs', 'manual-screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Authenticating as school owner...');
  const r1 = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'owner@sunshine.demo', password: 'Preone@123' })
  });
  const d1 = await r1.json();
  const mfaToken = d1.data?.mfaToken;

  const r2 = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mfaToken, otp: '000000' })
  });
  const cookieHeader = r2.headers.get('set-cookie') || '';
  const match = cookieHeader.match(/preone_session=([^;]+)/);
  const sessionToken = match ? match[1] : '';

  if (!sessionToken) {
    throw new Error('Failed to obtain preone_session cookie');
  }
  console.log('Authentication successful.');

  const browser = await chromium.launch({ headless: true });
  const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await authCtx.addCookies([
    {
      name: 'preone_session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);

  const targets = [
    { name: '04_admissions_pipeline.png', path: '/app/admissions' },
    { name: '05_students_directory.png', path: '/app/students' },
    { name: '06_classrooms.png', path: '/app/classrooms' },
    { name: '07_attendance_tracker.png', path: '/app/attendance' },
    { name: '08_daily_diary.png', path: '/app/daily-diary' },
    { name: '09_fees_billing.png', path: '/app/fees' },
    { name: '10_users_roles.png', path: '/app/users' },
    { name: '11_transport_fleet.png', path: '/app/transport' },
    { name: '12_inventory_management.png', path: '/app/inventory' },
    { name: '13_school_setup.png', path: '/app/setup' }
  ];

  const page = await authCtx.newPage();

  for (const t of targets) {
    const dest = path.join(outDir, t.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`Skipping already captured ${t.name}`);
      continue;
    }
    try {
      console.log(`Navigating to ${t.path} (timeout 60s)...`);
      await page.goto(`http://localhost:3000${t.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: dest });
      console.log(`Successfully saved: ${t.name}`);
    } catch (err) {
      console.warn(`Warning: failed to capture ${t.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Capture pass complete.');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
