---
Task ID: 1,2
Agent: main (Super Z)
Task: Read PreOne docs + setup PostgreSQL for fullstack webapp

Work Log:
- Extracted PREONE_DOC zip (19 docs, ~5.7MB markdown) from /home/z/my-project/upload
- Launched 5 parallel Explore agents: design system HTML, PRD/BRC/Vision, Prisma Schema v3.0 + ERD v3.0, API contracts + backend TD, frontend architecture + UI philosophy + DDD
- Key findings: PreOne = Enterprise Preschool OS (SaaS ERP); multi-tenant (Tenant→Branch→Classroom→Student); 8 roles; money in integer paise; soft delete; /api/v1 envelope {success,data,meta,traceId}; Design System v4.1 "Windows Shell Edition" (no sidebar; 72px header + 64px bottom taskbar + Start button/logo navigation; Poppins+Nunito; primary #7C3AED; light + Deep Space dark)
- No sudo in sandbox → installed @embedded-postgres/linux-x64@17.10.0-beta.17 (PostgreSQL 17.10 user-space binaries)
- Ran hydrate-symlinks postinstall manually (ICU lib fix)
- scripts/pg-setup.sh + scripts/pg-admin.mjs: initdb at db/pgdata, port 54329, role+db `preone` created

Stage Summary:
- PostgreSQL 17.10 running: postgresql://preone:preone@127.0.0.1:54329/preone
- All design tokens + schema knowledge captured in conversation; ready for Prisma schema + app build
