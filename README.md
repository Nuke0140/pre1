# PreOne — Preschool Operating System

Next.js + Prisma + PostgreSQL app for running preschools: admissions, students, attendance, fees, HR, transport, inventory, reports and the PreO AI copilot.

## Run locally

Prerequisites: Node.js 20+, Docker.

1. **Start PostgreSQL** (data lives in the `preone-pgdata` volume, so it survives restarts):

   ```bash
   docker volume create preone-pgdata
   docker run -d --name preone-pg --restart unless-stopped \
     -v preone-pgdata:/var/lib/postgresql/data \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=preone \
     -p 5432:5432 postgres:16-alpine
   ```

2. **Configure environment:** copy `.env.example` to `.env`, set `JWT_SECRET` to a long random string, and for local demos set `ENABLE_DEMO_OTP=true` and `ALLOW_DEMO_OTP=true`.

3. **Install and create the schema:**

   ```bash
   npm install
   npm run db:push
   ```

4. **Load demo data** (see below), then start the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Demo data

`scripts/seed-scale.ts` fills the database with a full-scale dataset so every screen has realistic data:

- 100 schools (`S001`–`S100`), 1–3 branches each, ~10,000 students
- 3 academic sessions (2024-25, 2025-26 closed; 2026-27 current) with promotions, graduations and withdrawals
- Data in every model: admissions funnel, daily attendance, fee schedules / invoices / payments / receipts / refunds, observations and progress, report cards, HR (staff attendance, leave, payroll, reviews, recruitment), transport trips, inventory and procurement, notifications and audit logs

```bash
npx tsx scripts/seed-scale.ts            # full run, ~15 minutes
SCHOOLS=2 npx tsx scripts/seed-scale.ts  # quick run with 2 schools (~200 students)
```

> **Warning:** the script truncates **all** tables before seeding.

The seed does not include the platform `PREONE` admin school; recreate it afterwards if you need it:

```bash
npm run bootstrap:admin
```

### Demo logins

All seeded users share the password `Preone@123`. Owner accounts are asked for an OTP; with demo OTP enabled, use `1234`.

| Role | School code | Identifier |
|---|---|---|
| Owner | `S001`–`S100` | `owner.s001@preone.demo` |
| Principal / teacher / accountant | same | `principal1.s001@preone.demo`, `teacher1.s001@preone.demo`, `accountant1.s001@preone.demo` |
| Parent | same school as the child | `parent.<n>@preone.demo` |
| Platform admin school | `PREONE` | `admin@preone.com` (after `npm run bootstrap:admin`) |

## PreO AI copilot

`/app/ask` answers questions about the school with charts, can propose attendance / fee-payment / announcement changes (applied only after the user approves), and can search the web. Locally it uses the Claude Code CLI as its model, so `claude` must be installed and signed in on the machine running `npm run dev`. Set `CLAUDE_BIN` if it isn't at `~/.local/bin/claude`, and `PREO_AI_MODEL` to change the model (default `sonnet`).
