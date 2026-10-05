import { performance } from 'node:perf_hooks';

async function testProd() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'owner@sunshine.demo', password: 'Preone@123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  const headers = { cookie };

  const endpoints = [
    { name: 'Auth Me API', url: 'http://localhost:3000/api/v1/me' },
    { name: 'Students API', url: 'http://localhost:3000/api/v1/students' },
    { name: 'Fee Structures API', url: 'http://localhost:3000/api/v1/fee-structures' },
    { name: 'Inventory Items API', url: 'http://localhost:3000/api/v1/inventory/items' },
    { name: 'Users API', url: 'http://localhost:3000/api/v1/users' },
    { name: 'Setup Status API', url: 'http://localhost:3000/api/v1/setup/status' },
    { name: 'Unread Notifications API', url: 'http://localhost:3000/api/v1/notifications/unread-count' },
    { name: 'Home Page', url: 'http://localhost:3000/app/home' },
    { name: 'Dashboard Page', url: 'http://localhost:3000/app/dashboard' },
    { name: 'Students Page', url: 'http://localhost:3000/app/students' },
    { name: 'Admissions Page', url: 'http://localhost:3000/app/admissions' },
    { name: 'Daily Diary Page', url: 'http://localhost:3000/app/daily-diary' },
    { name: 'Attendance Page', url: 'http://localhost:3000/app/attendance' },
    { name: 'Finance Page', url: 'http://localhost:3000/app/finance' },
    { name: 'Transport Page', url: 'http://localhost:3000/app/transport' },
    { name: 'Users Page', url: 'http://localhost:3000/app/users' },
    { name: 'Setup Page', url: 'http://localhost:3000/app/setup' },
    { name: 'Reports Page', url: 'http://localhost:3000/app/reports' },
    { name: 'Settings Page', url: 'http://localhost:3000/app/settings' },
  ];

  console.log('--- PRODUCTION STANDALONE SERVER BENCHMARK ---');
  for (const ep of endpoints) {
    const start = performance.now();
    const res = await fetch(ep.url, { headers });
    const duration = Math.round(performance.now() - start);
    console.log(`${ep.name.padEnd(28)}: ${res.status} ${res.statusText} (${duration} ms)`);
  }
}

testProd();
