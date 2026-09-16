# PreOne — Users & Access Module Gap Analysis & Hardening Roadmap

## Executive Summary
This document provides a comprehensive technical audit and gap analysis of the existing **Users & Access / Users & RBAC (v2.0)** module in PreOne Enterprise Preschool OS. 

The goal of this hardening phase is to transition from simple role-permission checks to an **end-to-end, resource-scoped, multi-tenant authorization and relationship model** without introducing breaking changes to the UI or creating parallel schema models.

---

## 1. Architectural Principles & Invariants

1. **Zero UI Redesign:** Preserve the existing Windows 8 design language, header, taskbar, pagehead, metric cards, category pills, context bar, data tables, modals, and User 360 overview.
2. **Zero Duplicate Database Entities:** All business entities must reside within canonical Prisma models:
   - `User` (identity, authentication, status, locale)
   - `TenantUser` (multi-tenant membership, roles array, primary role, branch scope, membership status)
   - `StaffProfile` (workforce data: employeeCode, designation, department, employmentType, qualification)
   - `Guardian` & `StudentGuardian` (parent/guardian identity and child relationship links)
   - `Classroom` (`primaryTeacherId` for teacher-classroom mapping)
   - `AuditLog` (immutable audit trail with before/after state)
   *Prohibited parallel tables:* `Employee`, `TeacherUser`, `ParentUser`, `UserPermission`.
3. **Server as Single Source of Truth:**
   Authorization flow must strictly enforce:
   `Auth Session` -> `User Status` -> `Tenant Membership` -> `Role` -> `Branch Scope` -> `Resource Scope` -> `Audit`

---

## 2. Capability Gap Matrix (Current vs. Required)

| Area | Current Implementation | Production Hardened Target | Status |
| :--- | :--- | :--- | :--- |
| **Central Auth Helpers** | Basic `requireApi(req, permission)` checking `can(roles, perm)` | Centralized helpers in `src/lib/auth-api.ts`: `requireTenantMembership`, `requireBranchAccess`, `requireCanManageUser`, `requireTeacherClassroomAccess`, `requireGuardianChildAccess`, `requireCanAssignRole`, `requireCanOverride` | In Progress |
| **Branch Scoping** | Read queries filter by query param `branchId`; no automatic actor branch boundary | Actor with branch constraint cannot view or modify users in other branches unless `OWNER`, `PRINCIPAL`, or `PLATFORM_ADMIN` | In Progress |
| **Role Escalation Protection** | Basic check blocking non-owners from assigning `OWNER`/`PLATFORM_ADMIN` | Hierarchical role management: `PLATFORM_ADMIN` locked; `OWNER` only by owners; `PRINCIPAL` only by owners; non-owners cannot modify owner accounts | Present / Strengthening |
| **Bulk Operations** | `POST /api/v1/users/bulk` executes immediately; basic skipped list | Added `mode: 'PREVIEW' \| 'EXECUTE'`; returns `selected`, `affected`, `blocked`, `reasons`, and `bulkOperationId`; atomic commit on execute with audit | In Progress |
| **CSV Import System** | `POST /api/v1/users/csv` supports `validate` and `execute` | Standardized canonical columns; `GET /api/v1/users/import/template`; downloadable CSV error report; zero mutations in dry-run | In Progress |
| **Controlled Overrides** | Administrative actions performed with simple confirmation | Formal override flow requiring `reason` (>= 5 chars), permission check, impact preview, and transactional `OVERRIDE_USED` audit log | In Progress |
| **User Lifecycle & Invitations** | Directory handles active users; `invitations/route.ts` exists | Unified invitation creation via `isInvite` flag (sets `PENDING`), resend invitation, revoke invitation, and activation lifecycle | In Progress |
| **User 360 Connectivity** | Profile view modal renders basic fields | Ensure all 5 relation facets (Roles, Workforce HR, Educator Classes, Guardian Children, Security Sessions) reflect real DB data | Present / Verified |
| **Transactional Auditing** | `recordAudit` called across write endpoints | Capture exact `oldValues` and `newValues`, severity levels (`INFO`, `WARNING`, `CRITICAL`), and IP/User-Agent metadata | Verified |
| **Negative Security Tests** | 4 existing test suites cover basic and v3 features | Dedicated negative test suite `verify-users-security-negative-e2e.ts` validating unauthorized cross-tenant, cross-branch, and escalation attempts | In Progress |

---

## 3. Detailed Component Plan

### 3.1 Central Authorization Layer (`src/lib/auth-api.ts`)
Add reusable guards:
- `requireTenantMembership(session, tenantId)`: Verifies actor belongs to tenant and is active.
- `requireBranchAccess(session, targetBranchId)`: Ensures users assigned to a branch cannot access resources of another branch.
- `requireCanManageUser(session, targetUserId, targetRole)`: Ensures non-owners cannot edit or delete owners or higher-privilege users.
- `requireTeacherClassroomAccess(session, classroomId)`: Verifies that if actor is a teacher, they are assigned as primary teacher to the classroom.
- `requireGuardianChildAccess(session, studentId)`: Verifies that if actor is a parent, their guardian profile is linked to the student.
- `requireCanAssignRole(session, rolesToAssign)`: Validates role privilege hierarchy.
- `requireCanOverride(session, action, targetUserId, reason)`: Validates override authority and reason length.

### 3.2 Bulk Operations (`src/app/api/v1/users/bulk/route.ts`)
- Support `mode: 'PREVIEW' | 'EXECUTE'`.
- Generate `bulkOperationId` (UUID) for batch tracking.
- Partition users into `affected` vs `blocked` with explicit reasons (`CANNOT_MODIFY_OWNER`, `CROSS_BRANCH_FORBIDDEN`, `INVALID_STATUS_TRANSITION`).
- Wrap execution in a single atomic Prisma transaction.
- Record audit log with `action: 'BULK_' + action`, tracking before/after snapshot.

### 3.3 CSV Template & Error Reporting
- Route `GET /api/v1/users/import/template` providing downloadable CSV template with canonical headers:
  `fullName,email,phone,password,role,roles,branchCode,designation,department,employeeCode,employmentType,status`
- Route `GET /api/v1/users/csv` supporting query param `?template=true` for backward compatibility.
- Route `POST /api/v1/users/import/error-report` or structured CSV download for validation errors.

### 3.4 User Lifecycle & Controlled Overrides
- Support `isInvite: true` in `POST /api/v1/users` to set user status as `PENDING`.
- Controlled overrides endpoint `POST /api/v1/users/override`:
  Requires `action`, `targetUserId`, `reason` (>= 5 characters).
  Validates actor privilege (`OWNER`, `PRINCIPAL`, `PLATFORM_ADMIN`).
  Records `OVERRIDE_USED` in `AuditLog`.

---

## 4. Verification & Conformance Strategy
1. **Automated Negative Test Suite (`scripts/verify-users-security-negative-e2e.ts`):**
   - Cross-tenant user access -> 403 / 404 Forbidden
   - Cross-branch mutation by branch coordinator -> 403 Forbidden
   - Non-owner attempting to assign OWNER -> 403 Forbidden
   - Non-owner attempting to modify OWNER account -> 403 Forbidden
   - Unlinked teacher attempting classroom access -> 403 Forbidden
   - Unlinked parent attempting student access -> 403 Forbidden
   - Override request without reason -> 400 Bad Request
   - CSV Validate mode -> 0 mutations in database
2. **Regression Testing:**
   - Verify existing test suites (`verify-users-v3-e2e.ts`, `verify-users-rbac-e2e.ts`, `verify-users-multi-guardian-e2e.ts`, `verify-users-setup-e2e.ts`).
3. **Production Build:**
   - Verify with `bunx next build --webpack`.
