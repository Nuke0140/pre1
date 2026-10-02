import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { signSession } from '../src/lib/auth'
import { db } from '../src/lib/db'

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const ARTIFACT_DIR = 'C:\\Users\\Nuke\\.gemini\\antigravity\\brain\\4e3150ff-d6fc-4612-a5c9-04f53b120cc4'

async function run() {
  const tenant = await db.tenant.findFirst({ where: { status: 'ACTIVE' } })
  if (!tenant) throw new Error('No active tenant found')

  const count = await db.announcement.count({ where: { tenantId: tenant.id } })
  if (count < 3) {
    console.log('Seeding rich demo announcements for visual verification...')
    await db.announcement.createMany({
      data: [
        {
          tenantId: tenant.id,
          title: 'Heavy Rainfall Warning — Early Dismissal at 1:30 PM',
          body: 'Dear parents, due to the severe monsoon weather alert issued by local authorities, preschool sessions will conclude early today at 1:30 PM. School vans will begin departures at 1:45 PM. Please coordinate with the front office if you are picking up your child personally.',
          type: 'EMERGENCY',
          audience: 'SCHOOL_WIDE',
          status: 'PUBLISHED',
        },
        {
          tenantId: tenant.id,
          title: 'Annual Sports Day & Fun Fair Schedule 2026',
          body: 'We are thrilled to announce our Annual Sports Day scheduled for Saturday, 24th October 2026. All children will participate in running races, obstacle relays, and the parent-child parachute race. Refreshments and certificates will be distributed at the campus ground.',
          type: 'EVENT',
          audience: 'ALL_PARENTS',
          status: 'PUBLISHED',
        },
        {
          tenantId: tenant.id,
          title: 'Staff Curriculum Alignment & Training Workshop',
          body: 'Mandatory professional development workshop for all early childhood educators this Friday from 3:30 PM to 5:00 PM in the Multi-Purpose Hall. Topic: Play-based Inquiry in Preschool Classrooms.',
          type: 'IMPORTANT',
          audience: 'ALL_STAFF',
          status: 'PUBLISHED',
        },
        {
          tenantId: tenant.id,
          title: 'Diwali Break & Holiday Notice',
          body: 'Sunshine Preschool will remain closed from Monday, 9th November to Friday, 13th November for the Diwali festive break. Regular classes will resume on Monday, 16th November. Wishing all families a joyful and safe festival of lights!',
          type: 'HOLIDAY',
          audience: 'SCHOOL_WIDE',
          status: 'PUBLISHED',
        },
      ],
    })
  }

  // Ensure a draft exists for visual demonstration
  const draft = await db.announcement.findFirst({ where: { tenantId: tenant.id, status: 'DRAFT' } })
  if (!draft) {
    await db.announcement.create({
      data: {
        tenantId: tenant.id,
        title: 'Upcoming Summer Camp & Art Workshop 2026',
        body: 'Draft itinerary for the 2-week summer activity camp covering water play, sensory gardening, pottery, and junior drama. Timings: 9:30 AM to 12:30 PM. Fee details and schedule to be confirmed before final broadcast.',
        type: 'EVENT',
        audience: 'ALL_PARENTS',
        status: 'DRAFT',
      },
    })
  }

  // Ensure a cancelled notice exists for visual demonstration
  const cancelled = await db.announcement.findFirst({ where: { tenantId: tenant.id, status: 'CANCELLED' } })
  if (!cancelled) {
    await db.announcement.create({
      data: {
        tenantId: tenant.id,
        title: 'Postponed: Parent-Teacher Meet for Toddlers Section',
        body: 'Please note that the Toddler PTM scheduled for this Friday has been postponed due to scheduled facility maintenance.',
        type: 'GENERAL',
        audience: 'ALL_PARENTS',
        status: 'CANCELLED',
      },
    })
  }

  const randId = Math.floor(Math.random() * 1000)
  const port = 9870 + (randId % 20)
  const PROFILE_DIR = path.join(ARTIFACT_DIR, 'scratch', `edge-comm-${Date.now()}`)
  if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true })

  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ])
  await new Promise((r) => setTimeout(r, 2500))

  const listRes = await fetch(`http://localhost:${port}/json/list`).then((r) => r.json())
  const pageTarget = listRes.find((t: any) => t.type === 'page') || listRes[0]
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

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

  const evalCode = async (expression: string) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return res?.result?.value
  }

  const capture = async (name: string) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    const buf = Buffer.from(shot.data, 'base64')
    fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.png`), buf)
    console.log(`  📸 Saved: ${name}.png (${(buf.length / 1024).toFixed(1)} KB)`)
  }

  await send('Page.enable')
  await send('Network.enable')
  await send('Runtime.enable')

  const adminToken = await signSession({
    uid: 'u_admin_comm',
    userId: 'u_admin_comm',
    name: 'Admin Principal',
    email: 'principal@sunshine.demo',
    role: 'PRINCIPAL',
    roles: ['PRINCIPAL'],
    tenantId: tenant.id,
  } as any)

  // 1. ADMIN DESKTOP SPLIT VIEW (1440x900)
  console.log('--- 1. Admin Desktop Split View (1440x900) ---')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await send('Network.setCookie', { name: 'preone_session', value: adminToken, domain: 'localhost', path: '/' })
  await send('Page.navigate', { url: 'http://localhost:3000/app/communication' })
  // Wait until announcement items are actually rendered into the DOM
  await evalCode(`
    new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        const titles = document.querySelectorAll('.announcements-split-grid h4');
        if (titles.length > 0 || attempts > 30) resolve(true);
        else { attempts++; setTimeout(check, 200); }
      };
      check();
    })
  `)
  await new Promise((r) => setTimeout(r, 1200))
  await capture('announcements-admin-split-view-1440')
  await capture('announcements-admin-feed-1440')

  // 2. OPEN COMPOSER MODAL (Shows "Save Draft" & "Publish Announcement")
  console.log('--- 2. Open Composer Modal ---')
  await evalCode(`
    const b = Array.from(document.querySelectorAll('button')).find(x => x.innerText.includes('New Announcement'));
    if (b) b.click();
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('announcements-composer-modal')

  // 3. SELECT CLASS_PARENTS AUDIENCE IN MODAL
  console.log('--- 3. Conditional Classroom Selection ---')
  await evalCode(`
    const modalSelects = Array.from(document.querySelectorAll('.modal select'));
    const audSelect = modalSelects.find(s => Array.from(s.options).some(o => o.value === 'CLASS_PARENTS'));
    if (audSelect) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(audSelect, 'CLASS_PARENTS');
      audSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('announcements-composer-class-selector')

  // 4. SELECT EMERGENCY TYPE IN MODAL
  console.log('--- 4. Emergency Alert Guard ---')
  await evalCode(`
    const modalSelects = Array.from(document.querySelectorAll('.modal select'));
    const typeSelect = modalSelects.find(s => Array.from(s.options).some(o => o.value === 'EMERGENCY'));
    if (typeSelect) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(typeSelect, 'EMERGENCY');
      typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('announcements-composer-emergency-guard')

  // Close composer modal using .x-btn
  await evalCode(`
    const xBtn = document.querySelector('.x-btn');
    if (xBtn) xBtn.click();
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 5. VIEW DRAFTS TAB & DRAFT DETAIL ACTIONS ("Publish Now", "Edit Draft", "Discard Draft")
  console.log('--- 5. Drafts Tab & Draft Actions ---')
  await evalCode(`
    const filterSelects = document.querySelectorAll('.announcements-split-grid select');
    filterSelects.forEach(s => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(s, 'ALL');
      s.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const draftTab = tabs.find(t => t.innerText.includes('Drafts'));
    if (draftTab) draftTab.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  await evalCode(`
    const card = document.querySelector('.announcements-split-grid .card.card-hover');
    if (card) card.click();
  `)
  await new Promise((r) => setTimeout(r, 800))
  await capture('announcements-drafts-tab-view')

  // 6. CANCEL CONFIRMATION DIALOG
  console.log('--- 6. Cancel Confirmation Dialog ---')
  // Switch back to Published tab
  await evalCode(`
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const pubTab = tabs.find(t => t.innerText.includes('Published'));
    if (pubTab) pubTab.click();
  `)
  await new Promise((r) => setTimeout(r, 1500))
  // Click Cancel Notice button on the active notice
  await evalCode(`
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cancel Notice'));
    if (cancelBtn) cancelBtn.click();
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('announcements-cancel-confirmation-modal')

  // Close cancel modal
  await evalCode(`
    const xBtn = document.querySelector('.x-btn');
    if (xBtn) xBtn.click();
  `)
  await new Promise((r) => setTimeout(r, 800))

  // 7. READ-ONLY TEACHER VIEW (Button Hidden)
  console.log('--- 7. Teacher Read-Only View ---')
  const teacherToken = await signSession({
    uid: 'u_teacher_comm',
    userId: 'u_teacher_comm',
    name: 'Ms. Anjali Teacher',
    email: 'teacher@sunshine.demo',
    role: 'TEACHER',
    roles: ['TEACHER'],
    tenantId: tenant.id,
  } as any)

  await send('Network.setCookie', { name: 'preone_session', value: teacherToken, domain: 'localhost', path: '/' })
  await send('Page.navigate', { url: 'http://localhost:3000/app/communication' })
  await evalCode(`
    new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        const titles = document.querySelectorAll('.announcements-split-grid h4');
        if (titles.length > 0 || attempts > 20) resolve(true);
        else { attempts++; setTimeout(check, 150); }
      };
      check();
    })
  `)
  await new Promise((r) => setTimeout(r, 1000))
  await capture('announcements-teacher-readonly-view')

  // 8. MOBILE RESPONSIVE VIEW (390 x 844)
  console.log('--- 8. Mobile Responsive View (390x844) ---')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send('Network.setCookie', { name: 'preone_session', value: adminToken, domain: 'localhost', path: '/' })
  await send('Page.navigate', { url: 'http://localhost:3000/app/communication' })
  await new Promise((r) => setTimeout(r, 2000))
  await capture('announcements-mobile-view')

  console.log('All visual captures completed successfully!')
  try {
    ws.close()
    browser.kill()
  } catch {}
}

run().catch(console.error)
