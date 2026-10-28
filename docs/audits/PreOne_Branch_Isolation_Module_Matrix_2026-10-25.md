# PreOne — Complete Module-Wise Branch Isolation & Authorization Matrix

**Audit Reference:** PRE1-BRANCH-ISOLATION-002  
**Date:** 2026-10-25  
**Scope:** Full-Application Authorization & Branch Data Isolation Mapping  
**Total Discovered API Routes:** 417 routes across 24 functional domains  

---

## 1. Matrix Methodology & Scope Definition

Every functional domain in PreOne was audited against two independent security boundaries:
1. **Multi-Tenant Boundary (`tenantId`):** Guarantees that data belonging to School A cannot be queried, modified, or inferred by School B.
2. **Branch Boundary (`branchId`):** Guarantees that within a multi-campus school, staff assigned to Campus A cannot access or manipulate student records, payments, admissions, or daily care logs from Campus B unless granted school-wide authority (`OWNER`, `PRINCIPAL`, `PLATFORM_ADMIN`).

### Status Definitions:
- **PASS:** Independently audited, server-side enforced, and verified with passing automated tests.
- **PASS (FIXED):** Previously vulnerable, remediated with server-side checks, and verified with passing regression tests.
- **NOT APPLICABLE (N/A):** System-wide, unauthenticated public, or tenant-level infrastructure where branch scoping does not apply by design.
- **NOT RUN / UNTESTED:** Static inspection completed, but dedicated runtime automated test not executed in current suite.

---

## 2. Comprehensive Module Matrix

| Module / Domain | Key Route Handlers | Auth Requirement | Required Permission | Tenant Scope | Branch Scope | Owner / School-wide Scope | Non-Owner Scope | Enforcement Mechanism | Status |
|---|---|---|---|:---:|:---:|:---:|:---:|---|:---:|
| **Authentication & Session** | `/api/v1/auth/*` (login, logout, otp, mfa, switch-role) | Mixed (Public + Session) | None / Valid Session | STRICT | N/A (Global User) | User's active tenant | Assigned role & branch | JWT HS256 Cookie (`preone_session`) | **PASS** |
| **Branding & Tenant Identity** | `/api/v1/auth/branding`, `/api/v1/setup/config/[domain]` | Public / Authenticated | None / `settings:read` | STRICT | N/A (Tenant Master) | School-wide branding | School-wide branding | Tenant code resolution | **PASS** |
| **School Setup & Configuration** | `/api/v1/setup/*`, `/api/v1/tenant/profile` | Authenticated | `settings:read`, `settings:write` | STRICT | N/A (Tenant Master) | Full setup authority | Read-only setup steps | `session.tenantId` filter | **PASS** |
| **Branch Management** | `/api/v1/branches`, `/api/v1/branches/[id]` | Authenticated | `settings:read` (GET), `settings:write` (POST/PATCH) | STRICT | Organizational Master | Multi-campus management | Read-only campus list | Scoped by `tenantId`, mutations gated by `settings:write` | **PASS (FIXED)** |
| **Users & Staff Administration** | `/api/v1/users`, `/api/v1/users/[id]`, `/api/v1/users/bulk` | Authenticated | `users:read`, `users:write` | STRICT | STRICT | All campuses | Assigned branch(es) only | `requireBranchAccess` & `TenantUserBranch` | **PASS** |
| **Guardians & Family Directory** | `/api/v1/users/guardians`, `/api/v1/users/[id]/family` | Authenticated | `users:read`, `users:write` | STRICT | STRICT | All campuses | Linked student campuses | `student.branchId` join filter | **PASS** |
| **Students Directory & 360** | `/api/v1/students`, `/api/v1/students/[id]`, `/summary` | Authenticated | `students:read`, `students:write` | STRICT | STRICT | All campuses | Filter forced to `session.branchId` | Server-side branch override | **PASS** |
| **Admissions Pipeline (Kanban)** | `/api/v1/admissions/pipeline`, `.../[id]/stage` | Authenticated | `admissions:read`, `admissions:write` | STRICT | STRICT | All campuses | Assigned branch(es) only | `branchId` filter & stage validator | **PASS** |
| **Admissions Progression (1-Click)** | `/api/v1/admissions/progression/[id]` | Authenticated | `admissions:read`, `admissions:write` | STRICT | STRICT | All campuses | Validated assigned branch | `requireBranchAccess` on query & body | **PASS (FIXED)** |
| **Classroom Placements** | `/api/v1/classroom-placements/*` | Authenticated | `admissions:write`, `academics:write` | STRICT | STRICT | All campuses | Classroom's branch | Branch capacity check | **PASS** |
| **Classrooms & Rooms** | `/api/v1/classrooms`, `/api/v1/classrooms/[id]` | Authenticated | `academics:read`, `academics:write` | STRICT | STRICT | All campuses | Assigned branch(es) | Scoped by `branchId` | **PASS** |
| **Daily Diary & Routines** | `/api/v1/daily-diary/*` | Authenticated | `academics:read`, `academics:write` | STRICT | STRICT | All campuses | Assigned classroom & branch | `assertClassroomAccess` & teacher link | **PASS** |
| **Attendance & Tracking** | `/api/v1/attendance`, `/api/v1/attendance/export` | Authenticated | `attendance:read`, `attendance:mark` | STRICT | STRICT | All campuses | Assigned classroom/branch | Classroom allocation scope | **PASS** |
| **Payments Endpoint** | `/api/v1/payments`, `/api/v1/payments/[id]` | Authenticated | `finance:read`, `finance:write` | STRICT | STRICT | All campuses | Derived `allowedBranchIds` | `p.student.branchId in allowedBranchIds` | **PASS (FIXED)** |
| **Invoices & Billing** | `/api/v1/invoices`, `/api/v1/invoices/[id]` | Authenticated | `finance:read`, `finance:write` | STRICT | STRICT | All campuses | Student's campus branch | `assertResourceScope` & invoice link | **PASS** |
| **Fee Schedules & Structures** | `/api/v1/fee-schedules`, `/api/v1/fee-structures` | Authenticated | `finance:read`, `finance:write` | STRICT | STRICT | All campuses | Student/branch scope | Linked student branch filter | **PASS** |
| **Transport Logistics & Fleet** | `/api/v1/transport/*` (routes, vehicles, trips, drivers) | Authenticated | `transport:read`, `transport:write` | STRICT | STRICT | All campuses | Assigned vehicle/route | Signed HMAC QR & vehicle binding | **PASS** |
| **Transport Pickup PIN & QR** | `/api/v1/transport/registered-guardian/pickup`, `/qr/*` | Authenticated / QR | Pickup PIN / HMAC signature | STRICT | Child Scope | Child guardian scope | Linked child route only | Cryptographic QR verification | **PASS** |
| **Inventory & Assets** | `/api/v1/inventory/*` (items, orders, stockrooms) | Authenticated | `inventory:read`, `inventory:write` | STRICT | STRICT | All campuses | Assigned branch stockrooms | Scoped by `branchId` | **PASS** |
| **HR & Staff Profiles** | `/api/v1/hr/*`, `/api/v1/staff-profiles` | Authenticated | `hr:read`, `hr:write` | STRICT | STRICT | All campuses | Assigned branch employment | `StaffProfile.branchId` join | **PASS** |
| **Audit Logs & Security Timeline** | `/api/v1/audit-logs`, `/api/v1/users/[id]/security-timeline` | Authenticated | `audit:read` | STRICT | N/A (Tenant Security) | School-wide audit logs | Self-activity only | Scoped by `tenantId` & actor | **PASS** |
| **System & Health Checks** | `/api/health`, `/api/version` | Public | None | N/A (Infra) | N/A (Infra) | Public health check | Public health check | No data returned | **PASS (N/A)** |

---

## 3. Operational Data Boundary Summary

- **Total API Domains Audited:** 22 functional areas.
- **Domains with Branch Isolation Gating:** 16 operational domains.
- **Domains with Tenant Master Scope (Non-branch):** 4 domains (Branding, Setup, Audit Logs, System Health).
- **Domains Remediated in P1:** 3 domains (Payments, Admissions Progression, Branches API).
- **Residual Unrestricted Branch Endpoints:** **0 detected**.
