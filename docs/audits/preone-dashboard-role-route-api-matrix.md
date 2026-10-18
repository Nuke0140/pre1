# PreOne Dashboard — Role, Route, API & Permission Matrix (Final Reconciled)

**Audit Target:** Commit `3e0b7615ae4bc3257a11512e00f3377a24daa7f1` on `feat/admissions-e2e-workflow`  
**Date of Audit:** October 17, 2026  
**Auditor:** Senior Software Architect & Security Reviewer  

---

## 1. Exhaustive Role-to-Dashboard Routing & Scoping Matrix

This matrix establishes the complete routing path, rendered component, backend dependencies, permission requirements, and data scoping for every canonical role and supported alias in PreOne.

| Canonical Role | Legacy Alias | Landing Route (`/app`) | Dashboard Route (`/app/dashboard`) | Rendered Dashboard View | API & Service Dependencies | Required Permissions (`can(role, perm)`) | Data Scope Enforced | Available Actions & Modules | Evidence Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`PLATFORM_ADMIN`** | None | Redirects to `/onboard` | `<DashboardClient />` | Global Multi-Tenant Operations | Server direct queries or `/api/v1/dashboard` | `platform:manage`, `audit:read` | Global across all tenants | System provisioning, global audit | `src/app/app/layout.tsx:14` |
| **`OWNER`** | None | Redirects to `/app/home` | `<DashboardClient />` | Executive Operational Dashboard | Direct Prisma queries (`page.tsx:29-73`) | `*` (All capabilities) | `tenantId` (Tenant-wide) | Full school management, billing, pipeline, attendance | `src/app/app/dashboard/page.tsx:16` |
| **`PRINCIPAL`** | None | Redirects to `/app/home` | `<DashboardClient />` | Executive Operational Dashboard | Direct Prisma queries (`page.tsx:29-73`) | `students:read/write`, `admissions:*`, `attendance:*`, `finance:read/write`, `operations:*` | `tenantId` (Tenant-wide) | Full academic, operational, and financial command | `src/app/app/dashboard/page.tsx:16` |
| **`COORDINATOR`** | None | Redirects to `/app/home` | `<DashboardClient />` | Generic Fallthrough (Filtered) | Direct Prisma queries (`page.tsx:29-73`) | `students:read`, `attendance:read`, `academics:*`, `operations:*` | `tenantId` (Tenant-wide) | Student enrollment, daily attendance, class rosters | `src/app/app/dashboard/page.tsx:75` |
| **`TEACHER`** | None | Redirects to `/app/home` | `<TeacherToday />` | Teacher Daily Workspace Board | `GET /api/v1/teacher/today`<br>`POST /api/v1/care`<br>`PATCH /api/v1/operations/follow-ups/:id` | `attendance:read`, `attendance:mark`, `academics:*`, `operations:write` | `tenantId` + assigned classrooms (`primaryTeacherId == uid`) | Mark attendance, post daily care, resolve student follow-ups | `src/app/app/dashboard/page.tsx:23` |
| **`STAFF`** | None | Redirects to `/app/home` | `<DashboardClient />` | Generic Fallthrough (Filtered) | Direct Prisma queries (`page.tsx:29-73`) | `attendance:read`, `operations:read/write`, `inventory:read` | `tenantId` (Tenant-wide) | View daily attendance, view classrooms, audit log | `src/app/app/dashboard/page.tsx:75` |
| **`ACCOUNTS`** | `ACCOUNTANT` | Redirects to `/app/home` | `<DashboardClient />` | Generic Fallthrough (Filtered) | Direct Prisma queries (`page.tsx:29-73`) | `students:read`, `finance:read/write`, `attendance:read`, `payroll:process` | `tenantId` (Tenant-wide) | Fee collection, overdue balance, student strength | `src/app/app/dashboard/page.tsx:75` |
| **`RECEPTIONIST`** | `RECEPTION` | Redirects to `/app/home` | `<DashboardClient />` | Generic Fallthrough (Filtered) | Direct Prisma queries (`page.tsx:29-73`) | `students:read`, `admissions:read/write`, `attendance:read`, `operations:*` | `tenantId` (Tenant-wide) | Admissions pipeline, new leads, attendance | `src/app/app/dashboard/page.tsx:75` |
| **`ATTENDANT`** | `HELPER` | Redirects to `/app/home` | `<DashboardClient />` | Generic Fallthrough (Filtered) | Direct Prisma queries (`page.tsx:29-73`) | `attendance:read`, `operations:read`, `inventory:request` | `tenantId` (Tenant-wide) | View attendance, classroom list | `src/app/app/dashboard/page.tsx:75` |
| **`DRIVER`** | None | Redirects to `/app/home` | `<DashboardClient />` | Generic Fallthrough (Filtered) | Direct Prisma queries (`page.tsx:29-73`) | `transport:*`, `students:read` | `tenantId` (Tenant-wide) | Active student count, classroom list | `src/app/app/dashboard/page.tsx:75` |
| **`PARENT`** | None | Redirects to `/app/home` | `<ParentToday />` | Parent Child Portal | `GET /api/v1/parent/today`<br>`GET /api/v1/parent/documents` | `timeline:read`, `communication:read`, `students:read-linked` | `tenantId` + linked children (`guardian.userId == uid`) | Child daily sheet, care stream, view dues, safety alerts | `src/app/app/dashboard/page.tsx:24` |
| **`GUARDIAN`** | None | Redirects to `/app/home` | `<ParentToday />` | Parent Child Portal | `GET /api/v1/parent/today`<br>`GET /api/v1/parent/documents` | `timeline:read`, `pickup:verify-linked` | `tenantId` + linked children (`guardian.userId == uid`) | Child daily sheet, pickup verification, view dues | `src/app/app/dashboard/page.tsx:24` |

---

## 2. Granular Permission Gates in `DashboardClient.tsx`

In `src/app/app/dashboard/DashboardClient.tsx`, permission booleans derived via `can(session.role, perm)` gate individual tiles:

1. **Active Students Tile (Lines 55-68):**
   - Gate: `perms.students` (`students:read`)
   - Visible to: `OWNER`, `PRINCIPAL`, `COORDINATOR`, `ACCOUNTS`, `RECEPTIONIST`, `DRIVER`.
   - Hidden from: `STAFF`, `ATTENDANT`.
2. **Present Today Tile (Lines 70-83):**
   - Gate: `perms.attendance` (`attendance:read`)
   - Visible to: `OWNER`, `PRINCIPAL`, `COORDINATOR`, `STAFF`, `ACCOUNTS`, `RECEPTIONIST`, `ATTENDANT`.
   - Hidden from: `DRIVER`.
3. **Fees Collected Tile (Lines 85-98):**
   - Gate: `perms.finance` (`finance:read`)
   - Visible to: `OWNER`, `PRINCIPAL`, `ACCOUNTS`.
   - Hidden from: `COORDINATOR`, `STAFF`, `RECEPTIONIST`, `ATTENDANT`, `DRIVER`.
4. **Admissions Pipeline Tile (Lines 100-113):**
   - Gate: `perms.admissions` (`admissions:read`)
   - Visible to: `OWNER`, `PRINCIPAL`, `RECEPTIONIST`.
   - Hidden from: `COORDINATOR`, `STAFF`, `ACCOUNTS`, `ATTENDANT`, `DRIVER`.
5. **Classrooms & Enrollment Card (Lines 220-251):**
   - Gate: **NONE (Unconditional)**
   - Visible to ALL fallthrough roles, including `DRIVER` and `ATTENDANT`.
6. **Recent Operational Activity / Audit Trail (Lines 254-280):**
   - Gate: **NONE (Unconditional) — `AUTH-001` CONFIRMED DEFECT / PRIVILEGE LEAK**
   - Visible to ALL fallthrough roles, exposing administrative audit summaries regardless of `audit:read` permission.

---

## 3. Unresolved Product Decisions for Phase 02

1. **Dedicated Dashboard Blueprints:** Should roles like `ACCOUNTS`, `RECEPTIONIST`, and `DRIVER` have purpose-built dashboard routes (e.g. `/app/accounts/dashboard`, `/app/transport/dashboard`) or should `/app/dashboard` dynamically mount dedicated view components like it does for `TeacherToday` and `ParentToday`?
2. **Multi-Branch Switching:** How should the dashboard allow multi-branch principals to toggle between "All Campuses" aggregate and "Branch A" specific view?
3. **Setup Bypass Policy:** Should an Owner in an onboarding school be permitted to enter the dashboard with a non-dismissible "Setup Incomplete (Step 3/7)" banner, or must the redirect to `/app/setup` remain strictly enforced?
4. **Audit Trail Visibility:** Should the `Recent Operational Activity` feed on the dashboard be gated behind `audit:read` capability rather than rendered unconditionally?
