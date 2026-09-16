# PreOne — Users & Access: Bulk Update / Overwrite & CSV Gap Analysis

## Executive Summary
This gap analysis document specifies the technical boundaries, current state, and target enterprise capabilities for **Bulk Profile Overwrite and CSV Lifecycle Management** (Create with Overwrite, In-Place Profile Update, Upsert, and Controlled Soft Deactivation) in PreOne Enterprise Preschool OS.

---

## 1. Architectural Invariants
1. **Zero UI Redesign:** Preserve existing Windows 8 design language, header, taskbar, pagehead, metric cards, category pills, context bar, data tables, modals, and User 360 overview.
2. **Zero Duplicate Database Entities:** All business entities reside exclusively in canonical Prisma models: `User`, `TenantUser`, `StaffProfile`, `Guardian`, `StudentGuardian`, `Classroom`, `AuditLog`. No `BulkUser`, `CsvUser`, `ImportedUser`, etc.
3. **Tenant-Scoped Identity Matching:** User matching by `email` is strictly executed within the authenticated `tenantId` via `TenantUser`. Cross-tenant lookups for mutation are strictly prevented.
4. **Controlled Soft-Deactivation (DELETE mode):** "DELETE" mode in CSV executes controlled soft-deactivation (`status = INACTIVE`, `deletedAt = new Date()`). Hard deletion via `prisma.user.delete()` is prohibited.

---

## 2. Capability Gap Matrix

| Area | Current Implementation | Required Enterprise Implementation | Status |
| :--- | :--- | :--- | :--- |
| **CSV Modes** | Supports `CREATE` and `UPDATE` | `type CsvMode = 'CREATE' \| 'UPDATE' \| 'UPSERT' \| 'DELETE'` | 🟡 Upgrading |
| **Overwrite Flag** | `CREATE` mode always fails with `USER_ALREADY_EXISTS` on duplicate | `overwrite: true` enables in-place update of existing user without duplicate entity | 🟡 Upgrading |
| **UPSERT Mode** | Not explicitly typed | New email $\to$ `CREATE`; existing email $\to$ `UPDATE` | 🟡 Upgrading |
| **DELETE / Deactivate Mode** | Not available via CSV | Soft-deactivates users (`status = INACTIVE`, `deletedAt = new Date()`), enforcing `OWNER` protection | 🟡 Upgrading |
| **Password Handling** | Required in `CREATE`; ignored or updated in `UPDATE` | Empty/omitted $\to$ preserve existing password hash; populated $\to$ check authority and hash with `bcrypt`; zero plaintext in logs/responses | 🟡 Upgrading |
| **Bulk API Overwrite** | Supports single actions (`ASSIGN_ROLE`, `CHANGE_BRANCH`, etc.) | Adds `action: 'UPDATE_PROFILE'` allowing multi-attribute bulk changes in one atomic operation | 🟡 Upgrading |
| **PageHead Actions** | Only `Roles Directory`, `Groups`, `Add User` | Add `[ CSV Template ]` and `[ Import / Bulk CSV ]` directly beside `[ Add User ]` | 🟡 Upgrading |
| **CSV Modal** | Basic inline file upload | `CsvManagerModal` with 3 workflows (Create + Overwrite toggle, Update, Bulk Deactivate), live drag-and-drop, row preview, dry-run diffs, error table with CSV download | 🟡 Upgrading |
| **DataTable Bulk Toolbar** | Single-field actions | Adds `Bulk Overwrite` button to update role, branch, designation, department, status simultaneously | 🟡 Upgrading |
| **Audit Logging** | Generic `CSV_CREATE`, `CSV_UPDATE` | Granular `CSV_CREATE`, `CSV_UPDATE`, `CSV_UPSERT`, `CSV_DELETE`, `BULK_UPDATE_PROFILE` with before/after state snapshots | 🟡 Upgrading |
| **Automated Tests** | Basic CSV tests in `verify-users-v3-e2e.ts` | Dedicated test suite `scripts/verify-users-csv-overwrite-e2e.ts` validating all 4 modes, dry-run zero-mutation, error report, and security negative cases | 🟡 Upgrading |

---

## 3. Endpoints Specification

### 3.1 `GET /api/v1/users/import/template`
- Returns canonical 12-column CSV template:
  `fullName,email,phone,password,role,roles,branchCode,designation,department,employeeCode,employmentType,status`
- UTF-8 charset with `Content-Disposition: attachment; filename="preone_users_template.csv"`.

### 3.2 `POST /api/v1/users/csv`
- Request payload:
  ```ts
  interface CsvRequest {
    action: 'validate' | 'execute'
    mode: 'CREATE' | 'UPDATE' | 'UPSERT' | 'DELETE'
    overwrite?: boolean
    applyValidOnly?: boolean
    rows: CsvRowInput[]
  }
  ```
- Modes:
  - `CREATE`: Creates new user. If email exists and `overwrite === false`, returns `USER_ALREADY_EXISTS`. If `overwrite === true`, updates user in-place.
  - `UPDATE`: Updates existing user. If email does not exist in tenant, returns `USER_NOT_FOUND`. Only updates fields supplied in CSV.
  - `UPSERT`: Updates if exists, creates if new.
  - `DELETE`: Controlled soft-deactivation (`status: 'INACTIVE', deletedAt: new Date()`). Rejects deactivation of `OWNER` by non-owners.
- Actions:
  - `validate`: Dry-run mode. Returns `diffs`, `errors`, counts (`totalRows`, `validRows`, `invalidRows`, `newUsers`, `existingUsers`). Strictly **0 database mutations**.
  - `execute`: Atomic Prisma transaction. Applies updates, writes `AuditLog`, returns execution counts.

### 3.3 `POST /api/v1/users/csv/error-report`
- Input: `{ errors: CsvValidationError[] }`.
- Output: Downloadable CSV with canonical diagnostic headers (`Row Number,Identifier,Field,Current Value,Requested Value,Error Code,Error Message`).

### 3.4 `POST /api/v1/users/bulk`
- Add action `UPDATE_PROFILE`:
  ```ts
  interface BulkUpdateProfileRequest {
    action: 'UPDATE_PROFILE'
    mode?: 'PREVIEW' | 'EXECUTE'
    userIds: string[]
    changes: {
      role?: UserRole
      roles?: UserRole[]
      branchId?: string | null
      designation?: string
      department?: string
      status?: UserStatus
    }
    reason?: string
  }
  ```
